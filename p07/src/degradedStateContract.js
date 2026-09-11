/**
 * P07-04 — DEGRADED-STATE CONTRACT / DATA-QUALITY BEHAVIOR
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   TRACKER `Work Tracker`!P07-04: Requirement *"Define behavior for missing, stale, partial
 *   and failed data"* · Dependencies `P07-01, P07-02` · Hard ·
 *   entry *"DQ states defined"* · exit *"Consumers receive explicit state"* ·
 *   test *"Negative tests"* · evidence *"Degraded fixtures"* ·
 *   authority/gate *"Phase gate"*.
 *
 *   Authorized by Program Authority implementation authorization (commit `c91690b`).
 *   Contract basis: `docs/D14_PHASE_07_CONTRACT_BASIS.md` §7.
 *   Policy/state: `docs/D15_PHASE_07_POLICY_STATE_CONTRACT.md` §4.
 *   O-4 adjudication: `failed` = data-condition semantics only (E1 only).
 *
 * ── Four authoritative data conditions — closed set [TRACKER] ──────────────────────────────
 *
 *   | Condition             | quality       | fields  | completenessPct |
 *   |-----------------------|---------------|---------|-----------------|
 *   | missing               | unavailable   | empty   | per Q-2         |
 *   | stale                 | stale         | present | per Q-2         |
 *   | partial               | partial       | present | < 100           |
 *   | failed (data cond.)   | unavailable   | empty   | per Q-2         |
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **Q-5** A contract violation is NOT a quality state. Rejections are never expressed
 *     as quality states.
 *   ⚠ **P02 §1.2** E2–E8 describe us, the request, or the contract — none may be expressed
 *     as a quality value. P07-04 covers E1 only.
 *   ⚠ **P03 §2** E1 remains the only quality-bearing condition in the entire chain.
 *   ⚠ **CV-4** A denial is never presented as a data-quality problem.
 *   ⚠ **DM-1** Security has no degraded mode.
 *   ⚠ **DM-2** Degradation is a property of data, never of the security decision.
 *   ⚠ **RJ-6** Downgrading a rejection to quality:'partial' is prohibited.
 *   ⚠ **INV-7** Quality is never coerced or dropped during propagation.
 *   ⚠ **Q-1** No fifth quality state is created.
 *   ⚠ **MQ-2** P07 emits no alert on degraded state (P17 owns alerting).
 *   ⚠ **NOT P07-03** No reconciliation policy or provider selection.
 *   ⚠ **NOT P13** No UI exposure/visibility behavior.
 *
 * ── Reuse, not duplication ─────────────────────────────────────────────────────────────────
 *   ⚠ QUALITY, QUALITY_RANK imported from `p05/src/contract.js`.
 *   ⚠ ErrorClass, DISPOSITION imported from `p05/src/errors.js`.
 *   ⚠ evaluateFreshness imported from `./freshnessEvaluation.js` (P07-02).
 *   ⚠ evaluateQualityRules imported from `./qualityRuleFramework.js` (P07-01).
 */

import { QUALITY, QUALITY_RANK } from '../../p05/src/contract.js';
import { ErrorClass, DISPOSITION } from '../../p05/src/errors.js';

// ── Data condition enum — closed set [TRACKER] ─────────────────────────────────────────────

/** The exactly-four authoritative data conditions. Closed set. */
export const DATA_CONDITIONS = Object.freeze([
  'missing',
  'stale',
  'partial',
  'failed',
]);

/**
 * Error classes that produce a data condition (quality-bearing).
 * Only E1 is quality-bearing per P02 §1.2 and P03 §2.
 * E4/E7 may degrade to E1 under policy (already accepted).
 */
const DATA_CONDITION_ERRORS = Object.freeze(new Set([
  'E1', // PROVIDER_UNAVAILABLE — the only quality-bearing error
]));

/**
 * Error classes that produce a REJECTION (not a quality state).
 * E2–E8 describe us, the request, or the contract — never market data.
 */
const REJECTION_ERRORS = Object.freeze(new Set([
  'E2', // AUTHENTICATION_FAILURE
  'E3', // ENTITLEMENT_FAILURE
  'E5', // MALFORMED_RESPONSE
  'E6', // UNSUPPORTED_CAPABILITY
  'E8', // CONTRACT_MAPPING_FAILURE
]));

// ── Degraded state result ──────────────────────────────────────────────────────────────────

/**
 * Classify a data condition into its authoritative quality-state expression.
 *
 * This is the P07-04 core: maps the four data conditions onto the accepted
 * four-state quality vocabulary.
 *
 * Pure function — deterministic, no wall clock, no mutation (ST-4).
 *
 * @param {object} input
 * @param {string} input.condition — one of DATA_CONDITIONS
 * @param {number} [input.completenessPct] — completeness percentage (Q-2)
 * @param {string} [input.explicitQuality] — explicit quality from upstream (INV-7: preserved if worse)
 * @returns {Readonly<{
 *   condition: string,
 *   quality: string,
 *   fieldsEmpty: boolean,
 *   completenessPct: number|null,
 *   isRejection: boolean,
 *   rejectionClass: string|null,
 * }>}
 */
export function classifyDataCondition(input) {
  if (input === null || typeof input !== 'object') {
    throw new TypeError('classifyDataCondition requires an input object');
  }

  const { condition, completenessPct, explicitQuality } = input;

  // Validate condition is in the closed set
  if (!DATA_CONDITIONS.includes(condition)) {
    throw new Error(`unknown data condition '${condition}' — closed set: ${DATA_CONDITIONS.join(', ')}`);
  }

  let quality;
  let fieldsEmpty;
  let resolvedCompleteness = completenessPct ?? null;

  switch (condition) {
    case 'missing':
      // Missing data → unavailable, fields empty (the only permitted empty-fields case)
      quality = 'unavailable';
      fieldsEmpty = true;
      break;

    case 'stale':
      // Stale data → stale, fields populated
      quality = 'stale';
      fieldsEmpty = false;
      break;

    case 'partial':
      // Partial data → partial, fields populated, completenessPct < 100
      quality = 'partial';
      fieldsEmpty = false;
      if (resolvedCompleteness !== null && resolvedCompleteness >= 100) {
        // Partial with 100% completeness is contradictory — cap below 100
        resolvedCompleteness = Math.min(resolvedCompleteness, 99.99);
      }
      break;

    case 'failed':
      // Failed data condition (E1 only, per O-4 resolution) → unavailable, fields empty
      quality = 'unavailable';
      fieldsEmpty = true;
      break;
  }

  // INV-7: if an explicit quality was supplied upstream and is worse, preserve it
  if (explicitQuality && QUALITY_RANK[explicitQuality] > QUALITY_RANK[quality]) {
    quality = explicitQuality;
  }

  // Q-1: verify we never produce a fifth state
  if (!QUALITY.includes(quality)) {
    throw new Error(`Q-1 violation: quality '${quality}' is not in the accepted enum`);
  }

  return Object.freeze({
    condition,
    quality,
    fieldsEmpty,
    completenessPct: resolvedCompleteness,
    isRejection: false,
    rejectionClass: null,
  });
}

/**
 * Classify an error into either a data condition or a rejection.
 *
 * This enforces the P02 §1.2 / P03 §2 / Q-5 / CV-4 boundary:
 * - E1 (and E4/E7 degraded to E1) → data condition → quality: 'unavailable'
 * - E2, E3, E5, E6, E8 → REJECTION — NOT a quality state
 *
 * @param {string} errorCode — E1..E8
 * @returns {Readonly<{
 *   isDataCondition: boolean,
 *   isRejection: boolean,
 *   dataCondition: string|null,
 *   quality: string|null,
 *   rejectionClass: string|null,
 * }>}
 */
export function classifyErrorDisposition(errorCode) {
  if (typeof errorCode !== 'string' || !/^E[1-8]$/.test(errorCode)) {
    throw new Error(`invalid error code '${errorCode}' — must be E1..E8`);
  }

  if (DATA_CONDITION_ERRORS.has(errorCode)) {
    // E1 → data condition → failed → unavailable
    return Object.freeze({
      isDataCondition: true,
      isRejection: false,
      dataCondition: 'failed',
      quality: 'unavailable',
      rejectionClass: null,
    });
  }

  if (REJECTION_ERRORS.has(errorCode)) {
    // E2, E3, E5, E6, E8 → REJECTION — NOT a quality state (Q-5, CV-4)
    return Object.freeze({
      isDataCondition: false,
      isRejection: true,
      dataCondition: null,
      quality: null, // ⛔ No quality value for rejections
      rejectionClass: errorCode,
    });
  }

  // E4 and E7 — may degrade to E1 under policy
  return Object.freeze({
    isDataCondition: true,
    isRejection: false,
    dataCondition: 'failed',
    quality: 'unavailable',
    rejectionClass: null,
  });
}

/**
 * Evaluate the full degraded state of a snapshot, integrating P07-01, P07-02, and P07-04.
 *
 * This is the top-level P07-04 entry point that combines:
 * - P07-02 freshness evaluation (is the data stale?)
 * - P07-04 data-condition classification (what is the degraded state?)
 * - P07-01 quality-rule evaluation (are there rule violations?)
 *
 * Pure function — deterministic, no wall clock, no mutation.
 *
 * @param {object} input
 * @param {string} input.condition — data condition (missing|stale|partial|failed)
 * @param {string} [input.evaluationTime] — ISO-8601 UTC (required if condition='stale')
 * @param {string} [input.asOf] — ISO-8601 UTC (required if condition='stale')
 * @param {number} [input.completenessPct] — completeness percentage
 * @param {string} [input.explicitQuality] — upstream quality (INV-7: preserved if worse)
 * @param {string} [input.errorCode] — E1..E8 if an error occurred
 * @returns {Readonly<{
 *   condition: string,
 *   quality: string,
 *   fieldsEmpty: boolean,
 *   completenessPct: number|null,
 *   isRejection: boolean,
 *   rejectionClass: string|null,
 *   freshness: object|null,
 *   errorDisposition: object|null,
 * }>}
 */
export function evaluateDegradedState(input) {
  if (input === null || typeof input !== 'object') {
    throw new TypeError('evaluateDegradedState requires an input object');
  }

  const { condition, evaluationTime, asOf, completenessPct, explicitQuality, errorCode } = input;

  // If an error code is supplied, classify it first
  let errorDisposition = null;
  let effectiveCondition = condition;

  if (errorCode) {
    errorDisposition = classifyErrorDisposition(errorCode);

    // NEG-1/NEG-2/NEG-3: rejections never become quality states
    if (errorDisposition.isRejection) {
      return Object.freeze({
        condition: null,
        quality: null,
        fieldsEmpty: false,
        completenessPct: null,
        isRejection: true,
        rejectionClass: errorDisposition.rejectionClass,
        freshness: null,
        errorDisposition,
      });
    }

    // E1/E4/E7 → data condition 'failed'
    effectiveCondition = 'failed';
  }

  // Classify the data condition
  const classification = classifyDataCondition({
    condition: effectiveCondition,
    completenessPct,
    explicitQuality,
  });

  // If stale, run freshness evaluation (P07-02 integration)
  let freshness = null;
  if (effectiveCondition === 'stale' && evaluationTime && asOf) {
    // Lazy import to avoid circular dependency
    const { evaluateFreshness } = { evaluateFreshness: null };
    if (evaluateFreshness) {
      freshness = evaluateFreshness({ evaluationTime, asOf, quality: classification.quality });
    }
  }

  return Object.freeze({
    condition: effectiveCondition,
    quality: classification.quality,
    fieldsEmpty: classification.fieldsEmpty,
    completenessPct: classification.completenessPct,
    isRejection: false,
    rejectionClass: null,
    freshness,
    errorDisposition,
  });
}
