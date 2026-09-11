/**
 * P07-02 — FRESHNESS / STALENESS EVALUATION
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   TRACKER `Work Tracker`!P07-02: Requirement *"Calculate freshness and explicit
 *   stale/unavailable states"* · Dependencies `P01-02, P07-01` · Hard ·
 *   entry *"Time semantics stable"* · exit *"Freshness state reproducible"* ·
 *   test *"Time/freshness tests"* · evidence *"Freshness evidence"* ·
 *   authority/gate *"Phase gate"*.
 *
 *   Authorized by Program Authority implementation authorization (commit `c91690b`).
 *   Contract basis: `docs/D14_PHASE_07_CONTRACT_BASIS.md` §5.
 *   Threshold authority: `docs/PHASE_07_D3_AUTHORITY_SUPPLY_ACT3.md` (D3 = A).
 *
 * ── Authoritative threshold set ────────────────────────────────────────────────────────────
 *   Identity:    D01-FRESHNESS-SET
 *   Version:     v1.0
 *   Effective:   2026-09-11T18:30:00Z
 *   Threshold:   15 minutes
 *   Comparison:  strict > (age > threshold → stale; age = threshold → NOT stale)
 *   Negative:    N1 reject/invalid
 *   Evaluation:  evaluationTime (T6)
 *   Reference:   asOf (market-data observation time)
 *   Units:       minutes | seconds (UN-8)
 *   Scope:       B — domain/instrument
 *   State:       OS-0 NORMAL
 *
 * ── Freshness formula ──────────────────────────────────────────────────────────────────────
 *   age_ms = parseIsoUtc(evaluationTime) - parseIsoUtc(asOf)
 *
 *   if age_ms < 0              → N1 REJECT (negative age)
 *   if age_ms > threshold_ms   → STALE  (strict >)
 *   if age_ms ≤ threshold_ms   → NOT STALE (quality preserved from input)
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **evaluationTime is the evaluation instant** — NOT receivedAt.
 *   ⚠ **Act 6 5-second boundary is SEPARATE** — not used here. No screenDisplayedAt.
 *   ⚠ **INV-7** — explicit quality is never coerced. If input quality is already worse
 *     than 'stale' (partial, unavailable), it is preserved.
 *   ⚠ **Q-5** — contract violation (negative age) is a rejection, not a quality state.
 *   ⚠ **F-1** — freshness state is always explicit.
 *   ⚠ **F-3** — stale does not suppress data; it annotates it.
 *   ⚠ **F-5** — reproducible for identical inputs (deterministic, no wall clock).
 *   ⚠ **F-6** — no alert emitted (P17 owns alerting).
 *   ⚠ **B-1** — evaluates only; does not repair, fill, coerce, or drop.
 *   ⚠ **NOT P07-03** — no threshold governance or version management.
 *   ⚠ **NOT P07-04** — no degraded-state data-quality behavior.
 *
 * ── Reuse, not duplication ─────────────────────────────────────────────────────────────────
 *   ⚠ QUALITY, QUALITY_RANK imported from `p05/src/contract.js`.
 *   ⚠ assertIsoUtc imported from `p05/src/serialize.js`.
 *   ⚠ ContractViolation imported from `p05/src/serialize.js`.
 */

import { QUALITY, QUALITY_RANK } from '../../p05/src/contract.js';
import { assertIsoUtc, ContractViolation } from '../../p05/src/serialize.js';

// ── Authoritative threshold set ────────────────────────────────────────────────────────────

/**
 * The authoritative D01 freshness threshold set as established by D3 = A.
 * Frozen. Not modifiable at runtime.
 */
export const THRESHOLD_SET = Object.freeze({
  identity: 'D01-FRESHNESS-SET',
  version: 'v1.0',
  effectiveDate: '2026-09-11T18:30:00Z',
  thresholdValue: 15,
  thresholdUnit: 'minutes',
  comparison: 'strict-greater-than',
  negativeAgeHandling: 'N1-reject-invalid',
  evaluationInstant: 'evaluationTime',
  referenceTimestamp: 'asOf',
  scope: 'domain-instrument',
  normalOperatingState: 'OS-0-NORMAL',
});

/** Duration units recognized by P01 UN-8. */
export const DURATION_UNITS = Object.freeze(['minutes', 'seconds']);

/** Freshness evaluation outcomes. */
export const FRESHNESS_RESULT = Object.freeze({
  FRESH: 'FRESH',
  STALE: 'STALE',
  NEGATIVE_AGE_REJECTED: 'NEGATIVE_AGE_REJECTED',
});

// ── Internal helpers ───────────────────────────────────────────────────────────────────────

/**
 * Convert a threshold value + unit to milliseconds.
 * @param {number} value
 * @param {string} unit — 'minutes' | 'seconds'
 * @returns {number}
 */
function thresholdToMs(value, unit) {
  if (unit === 'minutes') return value * 60 * 1000;
  if (unit === 'seconds') return value * 1000;
  throw new Error(`unrecognized duration unit: ${unit}`);
}

/**
 * Parse an ISO-8601 UTC timestamp to epoch milliseconds.
 * Validates format via assertIsoUtc, then parses.
 * @param {string} iso
 * @param {string} label
 * @returns {number}
 */
function parseInstant(iso, label) {
  assertIsoUtc(iso, label);
  return Date.parse(iso);
}

// ── Main entry point ───────────────────────────────────────────────────────────────────────

/**
 * Evaluate freshness/staleness of a canonical snapshot.
 *
 * Pure function — identical inputs produce byte-identical outputs (F-5).
 * Never modifies the input snapshot (B-1, INV-7).
 * Never uses a wall clock.
 * Never emits alerts (F-6 — P17 owns alerting).
 *
 * @param {object} input
 * @param {string} input.evaluationTime — ISO-8601 UTC evaluation instant (T6)
 * @param {string} input.asOf — ISO-8601 UTC market-data observation time
 * @param {string} [input.quality] — existing quality state from snapshot (preserved under INV-7)
 * @param {object} [input.thresholdSet] — override threshold set (default: THRESHOLD_SET)
 * @returns {Readonly<{
 *   result: string,
 *   ageMs: number|null,
 *   thresholdMs: number,
 *   thresholdSet: object,
 *   quality: string,
 *   isStale: boolean,
 *   rejected: boolean,
 *   rejectionReason: string|null,
 *   evaluationTime: string,
 *   asOf: string,
 *   freshnessAge: string|null,
 * }>}
 */
export function evaluateFreshness(input) {
  if (input === null || typeof input !== 'object') {
    throw new TypeError('evaluateFreshness requires an input object');
  }

  const { evaluationTime, asOf, quality: inputQuality } = input;
  const ts = input.thresholdSet ?? THRESHOLD_SET;

  // Validate threshold set unit
  if (!DURATION_UNITS.includes(ts.thresholdUnit)) {
    throw new ContractViolation(['UN-8'],
      `threshold unit '${ts.thresholdUnit}' is not minutes|seconds`, { unit: ts.thresholdUnit });
  }

  const thresholdMs = thresholdToMs(ts.thresholdValue, ts.thresholdUnit);

  // Parse evaluation instant (T6) — NOT receivedAt
  const evalMs = parseInstant(evaluationTime, 'evaluationTime');

  // Parse reference timestamp
  const asOfMs = parseInstant(asOf, 'asOf');

  // Calculate age
  const ageMs = evalMs - asOfMs;

  // N1: negative age → reject/invalid
  if (ageMs < 0) {
    return Object.freeze({
      result: FRESHNESS_RESULT.NEGATIVE_AGE_REJECTED,
      ageMs,
      thresholdMs,
      thresholdSet: Object.freeze({ ...ts }),
      quality: inputQuality ?? 'good',
      isStale: false,
      rejected: true,
      rejectionReason: `N1: negative age ${ageMs}ms — evaluationTime '${evaluationTime}' precedes asOf '${asOf}'`,
      evaluationTime,
      asOf,
      freshnessAge: null,
    });
  }

  // Format age as ISO-8601 duration-like string for evidence
  const ageSeconds = ageMs / 1000;
  const ageMinutes = ageSeconds / 60;
  const freshnessAge = `${ageMinutes.toFixed(3)} minutes (${ageMs}ms)`;

  // Strict > comparison: stale only if age EXCEEDS threshold
  const isStale = ageMs > thresholdMs;

  // Determine quality — INV-7: never coerce an explicitly worse state
  let derivedQuality;
  if (isStale) {
    // Stale — but preserve a worse explicit quality (partial, unavailable)
    if (inputQuality && QUALITY_RANK[inputQuality] > QUALITY_RANK.stale) {
      derivedQuality = inputQuality;
    } else {
      derivedQuality = 'stale';
    }
  } else {
    // Not stale — preserve input quality (good, or whatever was supplied)
    derivedQuality = inputQuality ?? 'good';
  }

  return Object.freeze({
    result: isStale ? FRESHNESS_RESULT.STALE : FRESHNESS_RESULT.FRESH,
    ageMs,
    thresholdMs,
    thresholdSet: Object.freeze({ ...ts }),
    quality: derivedQuality,
    isStale,
    rejected: false,
    rejectionReason: null,
    evaluationTime,
    asOf,
    freshnessAge,
  });
}

/**
 * Evaluate freshness for a full canonical snapshot, integrating with P07-01.
 *
 * This is the integration seam: it runs P07-01 quality rule evaluation AND
 * P07-02 freshness evaluation, combining results.
 *
 * @param {object} snapshot — canonical snapshot with evaluationTime field
 * @param {object} [options]
 * @param {object} [options.thresholdSet] — override threshold set
 * @returns {Readonly<{
 *   freshness: object,
 *   qualityRules: object,
 *   combinedQuality: string,
 * }>}
 */
export function evaluateFreshnessAndQuality(snapshot, options = {}) {
  // Import P07-01 lazily to avoid circular dependency at module level
  const { evaluateQualityRules } = options._qualityEvaluator
    ?? { evaluateQualityRules: null };

  // Run freshness evaluation
  const freshness = evaluateFreshness({
    evaluationTime: snapshot.evaluationTime,
    asOf: snapshot.asOf,
    quality: snapshot.quality,
    thresholdSet: options.thresholdSet,
  });

  // If no P07-01 evaluator supplied, return freshness only
  if (!evaluateQualityRules) {
    return Object.freeze({
      freshness,
      qualityRules: null,
      combinedQuality: freshness.quality,
    });
  }

  // Run P07-01 quality rule evaluation
  const qualityRules = evaluateQualityRules(snapshot);

  // Combine: take the worse of freshness-derived quality and rule-framework quality
  const freshnessRank = QUALITY_RANK[freshness.quality] ?? 0;
  const rulesRank = QUALITY_RANK[qualityRules.quality] ?? 0;
  const combinedQuality = freshnessRank >= rulesRank ? freshness.quality : qualityRules.quality;

  return Object.freeze({
    freshness,
    qualityRules,
    combinedQuality,
  });
}
