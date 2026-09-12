/**
 * P12-03 — SCREENER CONTRACT (C6 TARGET)
 *
 * Authority:
 *   D29 P12 Implementation Authorization (commit f03967e)
 *   D4_09_P12_CONTRACT_DELTA.md K.2.3
 *   AD-9 — Screener contract certified before UI05
 *
 * Purpose:
 *   Governed screener contract implementing:
 *     - Universe definition (derived from D05 security master; explicit, versioned)
 *     - Filter model (deterministic; declared operators; stable ordering)
 *     - Field set (canonical namespaced market-data + mapped fundamentals)
 *     - Result rows (per-row quality, completenessPct, asOf)
 *     - Sorting (deterministic and total — stable tie-break)
 *     - Saved screens (re-executable; PIT-capable; reproducible for an as-of)
 *     - Degraded behaviour (stale/partial rows explicitly marked, NEVER silently
 *       ranked as good)
 *     - Tenant scoping (enforced server-side)
 *
 * Boundaries (hard):
 *   ⚠ **SC-1** Deterministic — same inputs + same as-of → same output (byte-identical)
 *   ⚠ **SC-2** Filter operators are DECLARED, not ad-hoc
 *   ⚠ **SC-3** Sorting is total with stable tie-break (no incidental ordering)
 *   ⚠ **SC-4** Degraded rows are explicitly marked — NEVER silently ranked as good
 *   ⚠ **SC-5** No scoring/methodology/taxonomy modification
 *   ⚠ **SC-6** Tenant scoping is server-enforced — never client-side
 *   ⚠ **SC-7** PIT-capable — a screen at a given as-of is reproducible
 *   ⚠ **SC-8** AD-17/M-2 — no replay reproducibility claim
 *   ⚠ **SC-9** C6 is NOT certified by this implementation — requires A2 act
 */

import { QUALITY, QUALITY_RANK, MODES } from '../../p05/src/contract.js';
import { NAMESPACE_TOKEN } from '../../p05/src/namespace.js';
import { ProvenanceViolation } from './dataProvenanceDto.js';

export const P12_03_MODULE = 'P12-03-SCREENER-CONTRACT';

/** SC-2: Declared filter operators — CLOSED set. */
export const FILTER_OPERATORS = Object.freeze([
  'eq',       // equal
  'neq',      // not equal
  'gt',       // greater than
  'gte',      // greater than or equal
  'lt',       // less than
  'lte',      // less than or equal
  'in',       // in set
  'notIn',    // not in set
  'contains', // string contains
  'isNull',   // value is null/absent
  'isNotNull', // value is present
]);

/** SC-3: Declared sort directions — CLOSED set. */
export const SORT_DIRECTIONS = Object.freeze(['asc', 'desc']);

/**
 * SC-2 — Apply a single filter predicate to a value.
 *
 * @param {string} operator — one of FILTER_OPERATORS
 * @param {*} value — the field value
 * @param {*} operand — the filter operand
 * @returns {boolean}
 */
export function applyFilter(operator, value, operand) {
  if (!FILTER_OPERATORS.includes(operator)) {
    throw new ScreenerViolation(
      ['SC-2'],
      `unknown filter operator '${operator}'. ` +
      `Permitted: [${FILTER_OPERATORS.join(', ')}]`
    );
  }

  switch (operator) {
    case 'eq': return value === operand;
    case 'neq': return value !== operand;
    case 'gt': return value > operand;
    case 'gte': return value >= operand;
    case 'lt': return value < operand;
    case 'lte': return value <= operand;
    case 'in': return Array.isArray(operand) && operand.includes(value);
    case 'notIn': return Array.isArray(operand) && !operand.includes(value);
    case 'contains': return typeof value === 'string' && typeof operand === 'string' && value.includes(operand);
    case 'isNull': return value === null || value === undefined;
    case 'isNotNull': return value !== null && value !== undefined;
    default:
      throw new ScreenerViolation(['SC-2'], `unhandled operator '${operator}'`);
  }
}

/**
 * SC-1/SC-2 — Evaluate filter criteria against a row.
 *
 * All criteria are AND-combined (conjunctive). A row matches only if ALL
 * criteria pass.
 *
 * @param {object} row — a data row (field values keyed by namespaced field name)
 * @param {Array<{field: string, operator: string, operand: *}>} criteria
 * @returns {boolean}
 */
export function evaluateFilters(row, criteria) {
  if (!Array.isArray(criteria)) {
    throw new ScreenerViolation(['SC-2'], 'criteria must be an array');
  }

  for (const criterion of criteria) {
    const { field, operator, operand } = criterion;
    if (typeof field !== 'string' || field.length === 0) {
      throw new ScreenerViolation(['SC-2'], 'criterion field must be a non-empty string');
    }
    if (!applyFilter(operator, row[field], operand)) {
      return false;
    }
  }

  return true;
}

/**
 * SC-3 — Deterministic total-order sort with stable tie-break.
 *
 * The tie-break is always on a designated identity field (e.g., canonicalSecurityId
 * or rowId) to ensure the sort is total and deterministic regardless of input order.
 *
 * @param {object[]} rows — array of data rows
 * @param {Array<{field: string, direction: 'asc'|'desc'}>} sortSpec
 * @param {string} tieBreakField — the identity field for stable tie-breaking
 * @returns {object[]} sorted copy (original not mutated)
 */
export function deterministicSort(rows, sortSpec, tieBreakField) {
  if (!Array.isArray(rows)) {
    throw new ScreenerViolation(['SC-3'], 'rows must be an array');
  }
  if (!Array.isArray(sortSpec) || sortSpec.length === 0) {
    throw new ScreenerViolation(['SC-3'], 'sortSpec must be a non-empty array');
  }
  if (typeof tieBreakField !== 'string' || tieBreakField.length === 0) {
    throw new ScreenerViolation(['SC-3'], 'tieBreakField must be a non-empty string');
  }

  // Validate sort spec
  for (const spec of sortSpec) {
    if (!SORT_DIRECTIONS.includes(spec.direction)) {
      throw new ScreenerViolation(
        ['SC-3'],
        `sort direction '${spec.direction}' invalid. Permitted: [${SORT_DIRECTIONS.join(', ')}]`
      );
    }
  }

  // Copy to avoid mutation
  const sorted = [...rows];

  sorted.sort((a, b) => {
    // Apply sort spec in order
    for (const spec of sortSpec) {
      const { field, direction } = spec;
      const aVal = a[field];
      const bVal = b[field];
      const cmp = compareValues(aVal, bVal);
      if (cmp !== 0) {
        return direction === 'desc' ? -cmp : cmp;
      }
    }

    // SC-3: stable tie-break on identity field (deterministic total order)
    const aId = a[tieBreakField];
    const bId = b[tieBreakField];
    return compareValues(aId, bId);
  });

  return sorted;
}

/**
 * SC-4 — Classify a row's degradation state.
 *
 * Rows with stale or partial quality are explicitly classified.
 * They are NEVER silently ranked as good.
 *
 * @param {object} row
 * @param {string} row.quality — P05 quality value
 * @returns {'good' | 'degraded-stale' | 'degraded-partial' | 'degraded-unavailable'}
 */
export function classifyRowDegradation(quality) {
  switch (quality) {
    case 'good': return 'good';
    case 'stale': return 'degraded-stale';
    case 'partial': return 'degraded-partial';
    case 'unavailable': return 'degraded-unavailable';
    default:
      throw new ScreenerViolation(
        ['SC-4', 'Q-1'],
        `unknown quality '${quality}'`
      );
  }
}

/**
 * SC-1/SC-4/SC-7 — Execute a screen.
 *
 * Deterministic: same universe + same filters + same sort + same as-of →
 * byte-identical output.
 *
 * @param {object} args
 * @param {object[]} args.universe — array of data rows (each with quality, asOf, etc.)
 * @param {Array<{field: string, operator: string, operand: *}>} args.filters
 * @param {Array<{field: string, direction: 'asc'|'desc'}>} args.sort
 * @param {string} args.tieBreakField
 * @param {string} args.asOf — screen execution as-of time
 * @param {string} args.screenId — screen identity (for saved screens)
 * @param {string} args.tenantId — tenant scope (SC-6)
 * @returns {Readonly<object>} frozen screen result
 */
export function executeScreen(args) {
  const {
    universe,
    filters = [],
    sort,
    tieBreakField,
    asOf,
    screenId,
    tenantId,
  } = args;

  if (!Array.isArray(universe)) {
    throw new ScreenerViolation(['SC-1'], 'universe must be an array');
  }
  if (typeof screenId !== 'string' || screenId.length === 0) {
    throw new ScreenerViolation(['SC-1'], 'screenId must be a non-empty string');
  }
  if (typeof tenantId !== 'string' || tenantId.length === 0) {
    throw new ScreenerViolation(['SC-6'], 'tenantId must be a non-empty string (server-enforced)');
  }
  if (typeof asOf !== 'string' || asOf.length === 0) {
    throw new ScreenerViolation(['SC-7'], 'asOf must be a non-empty ISO-8601 string');
  }

  // Step 1: Filter (SC-2)
  const filtered = universe.filter((row) => evaluateFilters(row, filters));

  // Step 2: Sort (SC-3 — deterministic total order)
  const sorted = deterministicSort(filtered, sort, tieBreakField);

  // Step 3: Classify degradation (SC-4)
  const rows = sorted.map((row, index) => {
    const quality = row.quality || 'unavailable';
    const degradation = classifyRowDegradation(quality);

    return Object.freeze({
      rank: index + 1,
      ...row,
      _degradation: degradation,
      _rowQuality: quality,
      _rowCompleteness: row.completenessPct ?? 0,
      _rowAsOf: row.asOf || asOf,
    });
  });

  // Step 4: Compute screen-level provenance (SC-4 — worst-case)
  const qualities = rows.map((r) => r._rowQuality);
  const screenQuality = qualities.length > 0 ? worstOf(qualities) : 'unavailable';

  const result = Object.freeze({
    screenId,
    tenantId,
    asOf,
    executedAt: asOf, // SC-7: PIT — executedAt = asOf for reproducibility
    mode: 'PIT',
    totalRows: rows.length,
    quality: screenQuality,
    filters: Object.freeze(filters.map((f) => Object.freeze({ ...f }))),
    sort: Object.freeze(sort.map((s) => Object.freeze({ ...s }))),
    tieBreakField,
    rows: Object.freeze(rows),
  });

  return result;
}

/**
 * SC-7 — Save a screen definition for re-execution.
 *
 * A saved screen is reproducible: given the same universe at the same as-of,
 * re-execution produces byte-identical results.
 *
 * @param {object} args
 * @param {string} args.screenId
 * @param {Array} args.filters
 * @param {Array} args.sort
 * @param {string} args.tieBreakField
 * @param {string} args.tenantId
 * @param {string} args.version
 * @returns {Readonly<object>} frozen saved screen definition
 */
export function saveScreenDefinition(args) {
  const { screenId, filters, sort, tieBreakField, tenantId, version = '1.0' } = args;

  return Object.freeze({
    screenId,
    tenantId,
    version,
    filters: Object.freeze(filters.map((f) => Object.freeze({ ...f }))),
    sort: Object.freeze(sort.map((s) => Object.freeze({ ...s }))),
    tieBreakField,
    savedAt: new Date().toISOString(),
    pitCapable: true,
  });
}

// ── Internal helpers ──────────────────────────────────────────────────────────────────────

function compareValues(a, b) {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1; // nulls sort last
  if (b === null || b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

function worstOf(qualities) {
  let worst = qualities[0];
  let worstRank = QUALITY_RANK[worst] ?? 3;
  for (let i = 1; i < qualities.length; i++) {
    const rank = QUALITY_RANK[qualities[i]] ?? 3;
    if (rank > worstRank) {
      worst = qualities[i];
      worstRank = rank;
    }
  }
  return worst;
}

/**
 * SC-typed error.
 */
export class ScreenerViolation extends Error {
  constructor(rules, message) {
    super(`${rules.join(',')}: ${message}`);
    this.name = 'ScreenerViolation';
    this.rules = Object.freeze([...rules]);
  }
}
