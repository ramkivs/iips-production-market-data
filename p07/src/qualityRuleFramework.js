/**
 * P07-01 — QUALITY RULE FRAMEWORK
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   TRACKER `Work Tracker`!P07-01: Requirement *"Quality rule framework → DQ rule engine"* ·
 *   Dependencies `P06-01, P01-02` · Hard · entry *"Canonical data exists"* ·
 *   exit *"Rules execute and classify failures"* · test *"Rule tests"* ·
 *   evidence *"DQ evidence"* · authority/gate *"Phase gate"*.
 *
 *   Authorized by Program Authority implementation authorization (commit `c91690b`).
 *   Contract basis: `docs/D14_PHASE_07_CONTRACT_BASIS.md` §4.
 *   Policy/state: `docs/D15_PHASE_07_POLICY_STATE_CONTRACT.md`.
 *
 * ── Rule categories — [TRACKER] authoritative, closed set ──────────────────────────────────
 *   Exactly five categories. This set is authoritative and closed; P07 may not add or drop
 *   a category without an authority act (D14 §4.1).
 *
 *     1. completeness  — completenessPct evaluation (Q-2, ST-7)
 *     2. validity      — contract structural validity (Q-5, S1–S4)
 *     3. range         — field-domain conformance (P01 field rules)
 *     4. continuity    — asOf/session timestamp semantics (P01-02)
 *     5. reconciliation — delegates to P07-03 (not evaluated here)
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **B-1** P07 evaluates; it does NOT repair, fill, coerce or drop data (INV-7 / NFR-04).
 *   ⚠ **B-2** A rule failure is a CLASSIFICATION, never a mutation.
 *   ⚠ **B-3** A contract violation is NOT a quality state — rejections stay rejections (Q-5).
 *   ⚠ **B-4** P07 does NOT re-derive identity, lineage or namespace (P01/P04/P06 own these).
 *   ⚠ **B-5** P07 does NOT raise alerts or incidents (MQ-2 — that is P17).
 *   ⚠ **B-6** Rule evaluation is deterministic and reproducible over identical inputs.
 *
 *   ⚠ **NOT P07-02.** No freshness/staleness derivation. No threshold comparison.
 *   ⚠ **NOT P07-03.** No threshold governance. Reconciliation category DELEGATES to P07-03.
 *   ⚠ **NOT P07-04.** No degraded-state data-quality behavior.
 *   ⚠ **No fifth quality state.** Only `good | stale | partial | unavailable` [ACCEPTED].
 *   ⚠ **No coercion.** Quality is preserved from input, never overwritten (INV-7).
 *   ⚠ **No wall clock, no randomness, no ambient input.**
 *   ⚠ **No provider execution, credentials, entitlements or connectivity.**
 *   ⚠ **No production activation.**
 *
 * ── Reuse, not duplication ─────────────────────────────────────────────────────────────────
 *   ⚠ QUALITY, QUALITY_RANK, AVAILABILITY, INCOMPLETENESS_MARKERS, DATA_TYPES
 *     are IMPORTED from `p05/src/contract.js`.
 *   ⚠ validateSnapshot, SnapshotRejection are IMPORTED from `p05/src/validate.js`.
 *   ⚠ assertIsoUtc is IMPORTED from `p05/src/serialize.js`.
 *   ⚠ P07 invents no contract vocabulary that P05 already defines.
 */

import {
  QUALITY,
  QUALITY_RANK,
  AVAILABILITY,
  INCOMPLETENESS_MARKERS,
  DATA_TYPES,
} from '../../p05/src/contract.js';

import { validateSnapshot, SnapshotRejection } from '../../p05/src/validate.js';
import { assertIsoUtc } from '../../p05/src/serialize.js';

// ── Rule categories — frozen, authoritative, closed ────────────────────────────────────────

/** The exactly-five authoritative rule categories. Closed set. */
export const RULE_CATEGORIES = Object.freeze([
  'completeness',
  'validity',
  'range',
  'continuity',
  'reconciliation',
]);

/** Result status for a single rule category evaluation. */
export const RULE_RESULT = Object.freeze({
  PASS: 'PASS',
  FAIL: 'FAIL',
  DELEGATED: 'DELEGATED',
});

// ── Category evaluators ────────────────────────────────────────────────────────────────────

/**
 * COMPLETENESS — evaluate completenessPct against the snapshot's own declared value.
 *
 * Authority: Q-2, ST-7, D14 §4.1 row 1.
 *
 * Rules:
 *   C-1: completenessPct must be a number in [0, 100].
 *   C-2: completenessPct must be consistent with the field availability data
 *        (recomputed from INCOMPLETENESS_MARKERS against the field count).
 *   C-3: quality='unavailable' requires completenessPct=0 and empty fields.
 *
 * @param {Record<string, unknown>} snapshot — validated canonical snapshot
 * @returns {{status: string, findings: string[]}}
 */
function evaluateCompleteness(snapshot) {
  const findings = [];
  const { completenessPct, quality, fields } = snapshot;
  const fieldKeys = Object.keys(fields);

  // C-1: range check
  if (typeof completenessPct !== 'number' || completenessPct < 0 || completenessPct > 100) {
    findings.push(`C-1: completenessPct ${completenessPct} outside [0,100]`);
    return Object.freeze({ status: RULE_RESULT.FAIL, findings: Object.freeze(findings) });
  }

  // C-3: unavailable check
  if (quality === 'unavailable') {
    if (completenessPct !== 0) {
      findings.push(`C-3: quality 'unavailable' requires completenessPct=0, got ${completenessPct}`);
    }
    if (fieldKeys.length !== 0) {
      findings.push(`C-3: quality 'unavailable' requires empty fields, got ${fieldKeys.length}`);
    }
    return Object.freeze({
      status: findings.length > 0 ? RULE_RESULT.FAIL : RULE_RESULT.PASS,
      findings: Object.freeze(findings),
    });
  }

  // C-2: recompute completeness from field availability
  if (fieldKeys.length > 0) {
    const applicable = fieldKeys.filter((k) => fields[k].availability !== 'NOT_APPLICABLE');
    const incomplete = applicable.filter((k) =>
      INCOMPLETENESS_MARKERS.includes(fields[k].availability)
    );
    const recomputed = applicable.length === 0
      ? 100
      : Number((((applicable.length - incomplete.length) / applicable.length) * 100).toFixed(2));

    if (recomputed !== completenessPct) {
      findings.push(
        `C-2: completenessPct ${completenessPct} inconsistent with recomputed ${recomputed} ` +
        `(${incomplete.length} incomplete of ${applicable.length} applicable fields)`
      );
    }
  }

  return Object.freeze({
    status: findings.length > 0 ? RULE_RESULT.FAIL : RULE_RESULT.PASS,
    findings: Object.freeze(findings),
  });
}

/**
 * VALIDITY — evaluate structural contract validity.
 *
 * Authority: Q-5, S1–S4, D14 §4.1 row 2.
 *
 * Rules:
 *   V-1: The snapshot must pass P05 validateSnapshot (S1–S4) without rejection.
 *   V-2: A contract violation is a REJECTION, not a quality state (Q-5).
 *        If the snapshot is already a rejection, V-2 reports it.
 *
 * The snapshot is evaluated as-is. No mutation.
 *
 * @param {Record<string, unknown>} snapshot
 * @returns {{status: string, findings: string[]}}
 */
function evaluateValidity(snapshot) {
  const findings = [];

  try {
    validateSnapshot(snapshot);
    // V-1 PASS — snapshot is structurally valid
  } catch (err) {
    if (err instanceof SnapshotRejection) {
      // V-1 FAIL — contract violation (Q-5: rejection, not quality state)
      findings.push(
        `V-1: snapshot rejected at stage ${err.stage} — ` +
        `rules [${err.rules.join(',')}] — ${err.reason}`
      );
      findings.push(`V-2: Q-5 — contract violation is a rejection, not a quality state`);
    } else {
      findings.push(`V-1: unexpected validation error — ${err.message}`);
    }
  }

  return Object.freeze({
    status: findings.length > 0 ? RULE_RESULT.FAIL : RULE_RESULT.PASS,
    findings: Object.freeze(findings),
  });
}

/**
 * RANGE — evaluate field values against P01 field-domain rules.
 *
 * Authority: P01 field dictionary, D14 §4.1 row 3.
 *
 * Rules:
 *   R-1: Every field must carry a recognized availability value.
 *   R-2: Every field with a `dataType` must carry one of the recognized DATA_TYPES.
 *   R-3: Field-level quality (if present) must be in the QUALITY enum.
 *   R-4: Field-level quality must be equal-or-worse than snapshot quality (SM-13 / Q-6).
 *   R-5: PRESENT fields must carry a non-undefined value.
 *
 * @param {Record<string, unknown>} snapshot
 * @returns {{status: string, findings: string[]}}
 */
function evaluateRange(snapshot) {
  const findings = [];
  const { quality: snapshotQuality, fields } = snapshot;
  const snapRank = QUALITY_RANK[snapshotQuality] ?? -1;

  for (const [key, field] of Object.entries(fields)) {
    // R-1: availability
    if (!AVAILABILITY.includes(field.availability)) {
      findings.push(`R-1: field '${key}' availability '${field.availability}' not recognized`);
    }

    // R-2: dataType
    if (field.dataType !== undefined && !DATA_TYPES.includes(field.dataType)) {
      findings.push(`R-2: field '${key}' dataType '${field.dataType}' not recognized`);
    }

    // R-3: quality enum
    if (field.quality !== undefined && !QUALITY.includes(field.quality)) {
      findings.push(`R-3: field '${key}' quality '${field.quality}' not in enum`);
    }

    // R-4: field quality ≤ snapshot quality (SM-13 / Q-6)
    if (field.quality !== undefined && QUALITY_RANK[field.quality] < snapRank) {
      findings.push(
        `R-4: field '${key}' quality '${field.quality}' is better than snapshot '${snapshotQuality}' (SM-13/Q-6)`
      );
    }

    // R-5: PRESENT fields must have a value
    if (field.availability === 'PRESENT' && field.value === undefined) {
      findings.push(`R-5: field '${key}' is PRESENT but value is undefined`);
    }
  }

  return Object.freeze({
    status: findings.length > 0 ? RULE_RESULT.FAIL : RULE_RESULT.PASS,
    findings: Object.freeze(findings),
  });
}

/**
 * CONTINUITY — evaluate asOf/session timestamp semantics.
 *
 * Authority: P01-02 timestamp rules, D14 §4.1 row 4.
 *
 * Rules:
 *   T-1: asOf must be valid ISO-8601 UTC.
 *   T-2: receivedAt must be valid ISO-8601 UTC.
 *   T-3: receivedAt must not precede asOf (delivery cannot be before observation).
 *   T-4: evaluationTime (if present) must be valid ISO-8601 UTC.
 *
 * @param {Record<string, unknown>} snapshot
 * @returns {{status: string, findings: string[]}}
 */
function evaluateContinuity(snapshot) {
  const findings = [];
  const { asOf, receivedAt, evaluationTime } = snapshot;

  // T-1: asOf
  try {
    assertIsoUtc(asOf, 'asOf');
  } catch {
    findings.push(`T-1: asOf '${asOf}' is not valid ISO-8601 UTC`);
  }

  // T-2: receivedAt
  try {
    assertIsoUtc(receivedAt, 'receivedAt');
  } catch {
    findings.push(`T-2: receivedAt '${receivedAt}' is not valid ISO-8601 UTC`);
  }

  // T-3: receivedAt >= asOf
  if (typeof asOf === 'string' && typeof receivedAt === 'string') {
    try {
      assertIsoUtc(asOf, 'asOf');
      assertIsoUtc(receivedAt, 'receivedAt');
      if (receivedAt < asOf) {
        findings.push(`T-3: receivedAt '${receivedAt}' precedes asOf '${asOf}'`);
      }
    } catch {
      // Already reported by T-1/T-2
    }
  }

  // T-4: evaluationTime (optional — BC-3/BC-4)
  if (evaluationTime !== undefined) {
    try {
      assertIsoUtc(evaluationTime, 'evaluationTime');
    } catch {
      findings.push(`T-4: evaluationTime '${evaluationTime}' is not valid ISO-8601 UTC`);
    }
  }

  return Object.freeze({
    status: findings.length > 0 ? RULE_RESULT.FAIL : RULE_RESULT.PASS,
    findings: Object.freeze(findings),
  });
}

/**
 * RECONCILIATION — delegates to P07-03 (not evaluated in P07-01).
 *
 * Authority: D14 §4.1 row 5 — *"Delegates to P07-03 [TRACKER]"*.
 * P07-03 is BLOCKED (O-2, O-3 OPEN). This category reports DELEGATED.
 *
 * @returns {{status: string, findings: string[]}}
 */
function evaluateReconciliation() {
  return Object.freeze({
    status: RULE_RESULT.DELEGATED,
    findings: Object.freeze([
      'Reconciliation category delegates to P07-03 (BLOCKED — O-2/O-3 OPEN)',
    ]),
  });
}

// ── Main entry point ───────────────────────────────────────────────────────────────────────

/**
 * Evaluate all five quality-rule categories against a canonical snapshot.
 *
 * This function is PURE: identical inputs produce byte-identical outputs (B-6).
 * It NEVER modifies the input snapshot (B-1, INV-7).
 * It NEVER coerces quality (INV-7).
 * It NEVER introduces a fifth quality state.
 *
 * @param {Record<string, unknown>} snapshot — a canonical snapshot as produced by P06
 * @returns {Readonly<{
 *   snapshotId: string,
 *   quality: string,
 *   completenessPct: number,
 *   results: Readonly<Record<string, {status: string, findings: readonly string[]}>>,
 *   passed: boolean,
 *   failedCategories: readonly string[],
 *   delegatedCategories: readonly string[],
 *   categoriesEvaluated: number,
 *   evaluationTimestamp: null,
 * }>}
 */
export function evaluateQualityRules(snapshot) {
  if (snapshot === null || typeof snapshot !== 'object') {
    throw new TypeError('evaluateQualityRules requires a snapshot object');
  }

  const { snapshotId, quality, completenessPct } = snapshot;

  // Preserve quality and completenessPct from input — NEVER coerce (INV-7)
  const preservedQuality = quality;
  const preservedCompletenessPct = completenessPct;

  // Evaluate each category
  const results = Object.freeze({
    completeness: evaluateCompleteness(snapshot),
    validity: evaluateValidity(snapshot),
    range: evaluateRange(snapshot),
    continuity: evaluateContinuity(snapshot),
    reconciliation: evaluateReconciliation(),
  });

  const failedCategories = Object.freeze(
    RULE_CATEGORIES.filter((cat) => results[cat].status === RULE_RESULT.FAIL)
  );

  const delegatedCategories = Object.freeze(
    RULE_CATEGORIES.filter((cat) => results[cat].status === RULE_RESULT.DELEGATED)
  );

  const passedCategories = RULE_CATEGORIES.filter((cat) => results[cat].status === RULE_RESULT.PASS);

  // "passed" means all non-delegated categories passed
  const passed = failedCategories.length === 0;

  const categoriesEvaluated = RULE_CATEGORIES.length - delegatedCategories.length;

  return Object.freeze({
    snapshotId: snapshotId ?? null,
    quality: preservedQuality,
    completenessPct: preservedCompletenessPct,
    results,
    passed,
    failedCategories,
    delegatedCategories,
    categoriesEvaluated,
    // No wall clock — evaluationTimestamp is null (B-6 determinism)
    evaluationTimestamp: null,
  });
}
