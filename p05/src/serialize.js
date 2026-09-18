/**
 * P05-01 — DETERMINISTIC SERIALIZATION AND EXACT NUMERICS
 *
 * Authority:
 *   SN-6  Serialization is deterministic: canonical key ordering, ISO-8601 UTC at fixed
 *         precision, stable numeric formatting            (docs/p01/P01_DATA_CONTRACT.md §9)
 *   RI-6  Deterministic serialization … stable ordering     (docs/p01/P01_IDENTITY_AND_LINEAGE.md §3)
 *   NP-1  Every decimal field declares precision (scale)    (P01_TIMESTAMP_CURRENCY_UNIT_RULES.md §6)
 *   NP-2  Decimal semantics are EXACT; binary floating-point that loses source fidelity is
 *         PROHIBITED for monetary and ratio values
 *   NP-4  Numeric formatting is stable and canonical (fixed scale, no exponent drift,
 *         no trailing-zero variation)
 *   TS-1/TS-2/TS-5  ISO-8601 UTC with explicit Z, fixed declared precision, deterministic
 */

import { createHash } from 'node:crypto';

/** Contract error carrying rule IDs (feeds RJ-4 evidence events). */
export class ContractViolation extends Error {
  /**
   * @param {string[]} rules
   * @param {string} message
   * @param {Record<string, unknown>} [detail]
   */
  constructor(rules, message, detail = {}) {
    super(message);
    this.name = 'ContractViolation';
    this.rules = Object.freeze([...rules]);
    this.detail = Object.freeze({ ...detail });
  }
}

/**
 * Canonical fixed-scale decimal, held as a string so NP-2 exactness is preserved.
 * Format: `-?digits.digits` with EXACTLY `precision` decimal places (0 ⇒ no fraction part).
 * @param {string|number} raw
 * @param {number} precision  declared scale (NP-1)
 * @returns {string} canonical fixed-scale representation
 * @throws {ContractViolation} NP-1 / NP-2 / NP-4
 */
export function canonicalDecimal(raw, precision) {
  if (!Number.isInteger(precision) || precision < 0) {
    throw new ContractViolation(['NP-1'], `precision must be a non-negative integer, got ${precision}`, { precision });
  }
  const text = typeof raw === 'number' ? String(raw) : String(raw).trim();
  if (!/^-?\d+(\.\d+)?$/.test(text)) {
    throw new ContractViolation(['NP-2'], `value '${text}' is not an exact fixed-point decimal`, { raw, precision });
  }
  const negative = text.startsWith('-');
  const body = negative ? text.slice(1) : text;
  const [intPart, fracPart = ''] = body.split('.');
  if (fracPart.length > precision) {
    // NP-3: no silent rounding. Truncation would be a silent transformation.
    throw new ContractViolation(['NP-3'],
      `value '${text}' carries ${fracPart.length} decimals but declared precision is ${precision}; ` +
      'silent rounding/truncation is prohibited — declare the precision or transform explicitly',
      { raw, precision, providedScale: fracPart.length });
  }
  const padded = fracPart.padEnd(precision, '0');
  const canonical = precision === 0 ? intPart : `${intPart}.${padded}`;
  return negative ? `-${canonical}` : canonical;
}

/** True iff the string is a canonical ISO-8601 UTC instant at millisecond precision. */
const ISO_UTC_MS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/**
 * Validate/normalise an ISO-8601 UTC timestamp (TS-1, TS-2, ST-12).
 * @param {string} value
 * @param {string} label  used in the violation detail
 * @returns {string} the value, unchanged (fixed precision is asserted, not reformatted)
 * @throws {ContractViolation}
 */
export function assertIsoUtc(value, label) {
  if (typeof value !== 'string' || !ISO_UTC_MS.test(value)) {
    throw new ContractViolation(['TS-1', 'TS-2', 'ST-12'],
      `${label} '${value}' is not ISO-8601 UTC at fixed millisecond precision (expected YYYY-MM-DDTHH:MM:SS.mmmZ)`,
      { label, value });
  }
  if (Number.isNaN(Date.parse(value))) {
    throw new ContractViolation(['TS-1'], `${label} '${value}' is not a valid instant`, { label, value });
  }
  return value;
}

/**
 * Deterministic JSON: object keys sorted ascending at every level, arrays order-preserved,
 * no whitespace. Guarantees byte-stable identity (SN-6, RI-6, TS-5, NP-4).
 * @param {unknown} value
 * @returns {string}
 */
export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalJson(v)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  const parts = keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`);
  return `{${parts.join(',')}}`;
}

/**
 * Stable 256-bit-ish digest of a canonical serialization, computed without external deps
 * using node:crypto. Deterministic for identical canonical input.
 * @param {unknown} value
 * @returns {string} hex sha256
 */
export function canonicalDigest(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}
