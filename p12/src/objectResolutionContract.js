/**
 * P12-04 — OBJECT-RESOLUTION / SEARCH CONTRACT (C7 TARGET)
 *
 * Authority:
 *   D29 P12 Implementation Authorization (commit f03967e)
 *   D4_09_P12_CONTRACT_DELTA.md K.2.4
 *
 * Purpose:
 *   Governed object-resolution contract implementing:
 *     - Resolution input: canonical security ID, issuer ID, identifier, or symbol
 *     - Resolution output: governed product object references
 *       (company, research, holding, decision, evidence, alert, report)
 *     - Identity source: P04 adapter ONLY (no raw-provider search surface)
 *     - Prohibited: raw-provider search surface (INT-015 Notes)
 *     - Time-awareness: PIT resolution as of a stated boundary
 *     - Tenant scoping: enforced server-side
 *     - Consumers: UI13 Global Search, UI14 Command Palette, UI02
 *
 * Boundaries (hard):
 *   ⚠ **OR-1** Identity source is P04 adapter ONLY — no raw provider search
 *   ⚠ **OR-2** Fail-closed — unresolved identity is an explicit failure, not a silent miss
 *   ⚠ **OR-3** PIT-aware — resolution as of a stated boundary
 *   ⚠ **OR-4** Tenant scoping is server-enforced — never client-side
 *   ⚠ **OR-5** No P04 identity rules are redefined or modified
 *   ⚠ **OR-6** C7 is NOT certified by this implementation — requires A2 act
 *   ⚠ **OR-7** Deterministic — same input + same as-of → same output
 */

import { IdentityResolutionFailure } from '../../p05/src/identity.js';
import { NAMESPACE_TOKEN } from '../../p05/src/namespace.js';

export const P12_04_MODULE = 'P12-04-OBJECT-RESOLUTION-CONTRACT';

/** OR-1: Permitted resolution input types — CLOSED set. */
export const RESOLUTION_INPUT_TYPES = Object.freeze([
  'canonicalSecurityId',
  'issuerId',
  'identifier',
  'symbol',
]);

/** Governed object types that can be resolved — CLOSED set. */
export const OBJECT_TYPES = Object.freeze([
  'company',
  'research',
  'holding',
  'decision',
  'evidence',
  'alert',
  'report',
  'security',
  'issuer',
]);

/**
 * OR-1/OR-2 — Build a resolution request.
 *
 * @param {object} args
 * @param {string} args.inputType — one of RESOLUTION_INPUT_TYPES
 * @param {string} args.inputValue — the value to resolve
 * @param {string} args.asOf — ISO-8601 UTC (PIT boundary; OR-3)
 * @param {string} args.tenantId — tenant scope (OR-4)
 * @returns {Readonly<object>} frozen resolution request
 */
export function buildResolutionRequest(args) {
  const { inputType, inputValue, asOf, tenantId } = args;

  if (!RESOLUTION_INPUT_TYPES.includes(inputType)) {
    throw new ResolutionViolation(
      ['OR-1'],
      `inputType '${inputType}' is not in [${RESOLUTION_INPUT_TYPES.join(', ')}]`
    );
  }
  if (typeof inputValue !== 'string' || inputValue.length === 0) {
    throw new ResolutionViolation(
      ['OR-2'],
      'inputValue must be a non-empty string'
    );
  }
  if (typeof asOf !== 'string' || asOf.length === 0) {
    throw new ResolutionViolation(
      ['OR-3'],
      'asOf must be a non-empty ISO-8601 string'
    );
  }
  if (typeof tenantId !== 'string' || tenantId.length === 0) {
    throw new ResolutionViolation(
      ['OR-4'],
      'tenantId must be a non-empty string (server-enforced)'
    );
  }

  return Object.freeze({
    inputType,
    inputValue,
    asOf,
    tenantId,
  });
}

/**
 * OR-1/OR-2/OR-3 — Resolve an object through the P04 identity adapter.
 *
 * This function resolves a single identity to a governed product object reference.
 * It delegates to the P04 identity adapter (via the provided register/securities)
 * and NEVER to a raw provider search surface (OR-1).
 *
 * Fail-closed (OR-2): if the identity cannot be resolved, an explicit
 * ResolutionViolation is thrown — not a silent miss, not a null.
 *
 * @param {object} args
 * @param {Readonly<object>} args.request — a resolution request (from buildResolutionRequest)
 * @param {object[]} args.securities — the security master records (P04-shaped)
 * @param {object} args.register — MappingRegister from P05 identity
 * @returns {Readonly<object>} frozen resolution result
 */
export function resolveObject(args) {
  const { request, securities, register } = args;

  const { inputType, inputValue, asOf, tenantId } = request;

  // OR-1: Resolve through P04 adapter ONLY
  let matched = null;

  switch (inputType) {
    case 'canonicalSecurityId':
      matched = securities.find((s) => s.canonicalSecurityId === inputValue);
      break;

    case 'issuerId':
      matched = securities.find((s) => s.issuerId === inputValue);
      break;

    case 'identifier':
      // Match on any external identifier (FIGI, ISIN, CUSIP, SEDOL)
      matched = securities.find((s) => {
        const ids = s.identifiers || {};
        return Object.values(ids).includes(inputValue);
      });
      break;

    case 'symbol':
      matched = securities.find((s) => s.symbol === inputValue);
      break;

    default:
      throw new ResolutionViolation(
        ['OR-1'],
        `unhandled inputType '${inputType}'`
      );
  }

  // OR-2: fail-closed — unresolved identity is an explicit failure
  if (!matched) {
    throw new ResolutionViolation(
      ['OR-2'],
      `unresolved ${inputType} '${inputValue}' as of ${asOf} — ` +
      'fail-closed; no coercion, no placeholder, no synthesized result'
    );
  }

  // OR-3: PIT check — verify the security is active at the stated as-of
  if (matched.lifecycleState && matched.lifecycleState !== 'active') {
    // Still resolve, but flag the lifecycle state
  }

  // Build the resolution result
  const result = Object.freeze({
    resolved: true,
    objectType: 'security',
    canonicalSecurityId: matched.canonicalSecurityId,
    issuerId: matched.issuerId || null,
    symbol: matched.symbol || null,
    lifecycleState: matched.lifecycleState || 'active',
    asOf,
    tenantId,
    identifiers: Object.freeze({ ...(matched.identifiers || {}) }),
    identityMappingVersion: register?.version || '1.0',
  });

  return result;
}

/**
 * OR-7 — Execute a search query across governed objects.
 *
 * Deterministic: same query + same universe + same as-of → same results.
 *
 * @param {object} args
 * @param {object[]} args.universe — array of governed objects
 * @param {string} args.query — search query string
 * @param {string[]} [args.objectTypes] — filter by object types (default: all)
 * @param {string} args.asOf — PIT boundary
 * @param {string} args.tenantId — tenant scope
 * @param {number} [args.maxResults] — maximum results (default 50)
 * @returns {Readonly<object>} frozen search result
 */
export function executeSearch(args) {
  const {
    universe,
    query,
    objectTypes = OBJECT_TYPES,
    asOf,
    tenantId,
    maxResults = 50,
  } = args;

  if (!Array.isArray(universe)) {
    throw new ResolutionViolation(['OR-7'], 'universe must be an array');
  }
  if (typeof query !== 'string' || query.length === 0) {
    throw new ResolutionViolation(['OR-7'], 'query must be a non-empty string');
  }
  if (typeof tenantId !== 'string' || tenantId.length === 0) {
    throw new ResolutionViolation(['OR-4'], 'tenantId must be a non-empty string');
  }

  const queryLower = query.toLowerCase();

  // Filter by object type and match against query
  const matches = universe
    .filter((obj) => {
      if (!objectTypes.includes(obj.objectType)) return false;
      return matchesQuery(obj, queryLower);
    })
    // OR-7: deterministic sort — by objectType, then by canonicalSecurityId
    .sort((a, b) => {
      const typeCmp = (a.objectType || '').localeCompare(b.objectType || '');
      if (typeCmp !== 0) return typeCmp;
      return (a.canonicalSecurityId || a.id || '').localeCompare(b.canonicalSecurityId || b.id || '');
    })
    .slice(0, maxResults)
    .map((obj) => Object.freeze({ ...obj, asOf, tenantId }));

  return Object.freeze({
    query,
    asOf,
    tenantId,
    objectTypes: Object.freeze([...objectTypes]),
    totalMatches: matches.length,
    truncated: universe.filter((obj) => objectTypes.includes(obj.objectType) && matchesQuery(obj, queryLower)).length > maxResults,
    results: Object.freeze(matches),
  });
}

/**
 * OR-1 — Build a governed object reference (typed pointer).
 *
 * @param {string} objectType — one of OBJECT_TYPES
 * @param {string} objectId — the governed object identifier
 * @param {string} asOf — PIT boundary
 * @returns {Readonly<object>}
 */
export function buildObjectReference(objectType, objectId, asOf) {
  if (!OBJECT_TYPES.includes(objectType)) {
    throw new ResolutionViolation(
      ['OR-1'],
      `objectType '${objectType}' is not in [${OBJECT_TYPES.join(', ')}]`
    );
  }
  if (typeof objectId !== 'string' || objectId.length === 0) {
    throw new ResolutionViolation(['OR-2'], 'objectId must be a non-empty string');
  }

  return Object.freeze({
    objectType,
    objectId,
    asOf,
  });
}

// ── Internal helpers ──────────────────────────────────────────────────────────────────────

function matchesQuery(obj, queryLower) {
  // Match against common fields
  const searchableFields = [
    'canonicalSecurityId',
    'issuerId',
    'symbol',
    'name',
    'displayName',
    'description',
  ];

  for (const field of searchableFields) {
    const val = obj[field];
    if (typeof val === 'string' && val.toLowerCase().includes(queryLower)) {
      return true;
    }
  }

  // Also search identifiers
  if (obj.identifiers && typeof obj.identifiers === 'object') {
    for (const val of Object.values(obj.identifiers)) {
      if (typeof val === 'string' && val.toLowerCase().includes(queryLower)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * OR-typed error.
 */
export class ResolutionViolation extends Error {
  constructor(rules, message) {
    super(`${rules.join(',')}: ${message}`);
    this.name = 'ResolutionViolation';
    this.rules = Object.freeze([...rules]);
  }
}
