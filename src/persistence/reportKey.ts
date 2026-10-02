/**
 * NP-04 — Common Governed Persistence: canonical report-key derivation.
 *
 * Implements the canonicalization contract recorded in the NP-06 Reports governance record
 * (section 5.2), which formalises closed decision C2. This module does not redefine C2; it
 * implements it.
 *
 * reportKey is deterministic CONTENT identity: the same canonical input always yields the same key.
 * It is NOT instance identity — see identity.ts.
 */
import { createHash } from 'node:crypto';

import { PersistenceValidationError } from './errors.js';

/** Schema version of the canonical member set understood by this module. */
export const CANONICAL_SCHEMA_VERSION = 1 as const;

/**
 * A schemaVersion-1 parameter value. Flat primitives only.
 *
 * Nested objects and arrays are deliberately excluded: the canonicalization contract is defined
 * over flat primitives so that ordering is total and unambiguous. A nested value is rejected
 * rather than flattened, because silently flattening would change content identity.
 */
export type CanonicalParameterValue = string | number | boolean | null;

/** The four — and only four — canonical members that constitute content identity. */
export interface CanonicalReportKeyInput {
  readonly reportType: string;
  readonly portfolioId: string;
  /** Optional. An absent scenario is represented as explicit null, never omitted. */
  readonly scenario?: string | null;
  /** Optional. Absent is represented as explicit null, never omitted. */
  readonly parameters?: Readonly<Record<string, CanonicalParameterValue>> | null;
}

/**
 * Compare two strings by UNICODE CODE POINT.
 *
 * The default Array#sort comparator orders by UTF-16 code unit, which places astral-plane
 * characters (U+10000 and above, encoded as surrogates U+D800..U+DFFF) before U+E000..U+FFFF.
 * Code-point ordering places them last. This comparator implements true code-point order.
 */
export function compareByCodePoint(a: string, b: string): number {
  const left = Array.from(a);
  const right = Array.from(b);
  const shared = Math.min(left.length, right.length);
  for (let i = 0; i < shared; i += 1) {
    const l = left[i]!.codePointAt(0)!;
    const r = right[i]!.codePointAt(0)!;
    if (l !== r) return l < r ? -1 : 1;
  }
  return left.length === right.length ? 0 : left.length < right.length ? -1 : 1;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new PersistenceValidationError(`${field} must be a non-empty string`, { field });
  }
  return value;
}

function assertPrimitive(value: unknown, name: string): CanonicalParameterValue {
  if (value === null) return null;
  const t = typeof value;
  if (t === 'string' || t === 'boolean') return value as string | boolean;
  if (t === 'number') {
    const n = value as number;
    // NaN and +/-Infinity have no canonical JSON representation.
    if (!Number.isFinite(n)) {
      throw new PersistenceValidationError(`parameter '${name}' must be a finite number`, { name });
    }
    return n;
  }
  throw new PersistenceValidationError(
    `parameter '${name}' must be a schemaVersion-1 flat primitive (string, number, boolean, or null)`,
    { name },
  );
}

/**
 * Produce the canonical UTF-8 JSON byte string for a report key.
 *
 * Rules applied (NP-06 section 5.2):
 *  1. fixed top-level member order: reportType, portfolioId, scenario, parameters
 *  2. parameters sorted by code point of member name
 *  3. absent optional members serialised as explicit null, never omitted
 *  4. numbers use the shortest round-trip decimal representation (String(n) is exactly that)
 *  5. strings escaped per JSON; no forward-slash escaping (JSON.stringify does not add it)
 *  6. no case folding
 *  7. no Unicode normalisation — the input is encoded as given
 */
export function canonicalizeReportKey(input: CanonicalReportKeyInput): string {
  const reportType = requireNonEmptyString(input.reportType, 'reportType');
  const portfolioId = requireNonEmptyString(input.portfolioId, 'portfolioId');

  const scenario =
    input.scenario === undefined || input.scenario === null
      ? null
      : requireNonEmptyString(input.scenario, 'scenario');

  let parameters: string;
  if (input.parameters === undefined || input.parameters === null) {
    parameters = 'null';
  } else {
    const entries = Object.entries(input.parameters);
    entries.forEach(([name]) => requireNonEmptyString(name, 'parameter name'));
    const values = new Map(entries.map(([name, value]) => [name, assertPrimitive(value, name)]));
    const sortedNames = [...values.keys()].sort(compareByCodePoint);
    if (sortedNames.length === 0) {
      // An empty parameter set carries exactly as much meaning as an absent one, so both
      // canonicalise to explicit null. Without this, two consumers that build the same report
      // with `{}` and with no parameters at all would compute different content identity.
      parameters = 'null';
    } else {
      const body = sortedNames.map((name) => `${JSON.stringify(name)}:${JSON.stringify(values.get(name))}`);
      parameters = `{${body.join(',')}}`;
    }
  }

  // Fixed order. No case folding, no Unicode normalisation.
  return (
    `{"reportType":${JSON.stringify(reportType)},` +
    `"portfolioId":${JSON.stringify(portfolioId)},` +
    `"scenario":${JSON.stringify(scenario)},` +
    `"parameters":${parameters}}`
  );
}

/**
 * Derive the deterministic content identity: lowercase hex SHA-256 over the canonical UTF-8 bytes.
 *
 * Deterministic across processes, machines, and insertion order.
 */
export function deriveReportKey(input: CanonicalReportKeyInput): string {
  return createHash('sha256').update(canonicalizeReportKey(input), 'utf8').digest('hex');
}
