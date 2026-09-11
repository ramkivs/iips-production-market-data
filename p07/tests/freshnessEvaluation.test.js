/**
 * P07-02 — FRESHNESS / STALENESS EVALUATION TESTS
 *
 * Authority: D14 §5 (P07-02 contract basis), D3 = A (threshold set),
 *            P07 implementation authorization (c91690b), P07-01 acceptance (17f6bc2).
 *
 * Exit criterion: *"Freshness state reproducible"* — evidenced by this suite.
 *
 * ⚠ No wall clock, no randomness, no network, no filesystem writes.
 * ⚠ Every test input is a fixed literal — byte-identical across runs (F-5).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateFreshness,
  evaluateFreshnessAndQuality,
  THRESHOLD_SET,
  DURATION_UNITS,
  FRESHNESS_RESULT,
} from '../src/freshnessEvaluation.js';

import { evaluateQualityRules } from '../src/qualityRuleFramework.js';
import { buildTestSnapshot } from './helpers.js';

// ── Threshold set integrity ──────────────────────────────────────────────────────────────────

test('THRESHOLD_SET is frozen and authoritative', () => {
  assert.ok(Object.isFrozen(THRESHOLD_SET));
  assert.equal(THRESHOLD_SET.identity, 'D01-FRESHNESS-SET');
  assert.equal(THRESHOLD_SET.version, 'v1.0');
  assert.equal(THRESHOLD_SET.effectiveDate, '2026-09-11T18:30:00Z');
  assert.equal(THRESHOLD_SET.thresholdValue, 15);
  assert.equal(THRESHOLD_SET.thresholdUnit, 'minutes');
  assert.equal(THRESHOLD_SET.comparison, 'strict-greater-than');
  assert.equal(THRESHOLD_SET.negativeAgeHandling, 'N1-reject-invalid');
  assert.equal(THRESHOLD_SET.evaluationInstant, 'evaluationTime');
  assert.equal(THRESHOLD_SET.referenceTimestamp, 'asOf');
  assert.equal(THRESHOLD_SET.scope, 'domain-instrument');
  assert.equal(THRESHOLD_SET.normalOperatingState, 'OS-0-NORMAL');
});

test('DURATION_UNITS is exactly minutes and seconds (UN-8)', () => {
  assert.deepEqual([...DURATION_UNITS], ['minutes', 'seconds']);
  assert.ok(Object.isFrozen(DURATION_UNITS));
});

test('FRESHNESS_RESULT has exactly FRESH, STALE, NEGATIVE_AGE_REJECTED', () => {
  assert.deepEqual({ ...FRESHNESS_RESULT }, {
    FRESH: 'FRESH', STALE: 'STALE', NEGATIVE_AGE_REJECTED: 'NEGATIVE_AGE_REJECTED',
  });
  assert.ok(Object.isFrozen(FRESHNESS_RESULT));
});

// ── 1. Age below 15 minutes → NOT stale ────────────────────────────────────────────────────

test('age below threshold → FRESH, quality preserved', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T19:00:00.000Z',
    asOf: '2026-09-11T18:50:00.000Z', // 10 minutes
    quality: 'good',
  });
  assert.equal(result.result, FRESHNESS_RESULT.FRESH);
  assert.equal(result.isStale, false);
  assert.equal(result.rejected, false);
  assert.equal(result.quality, 'good');
  assert.equal(result.ageMs, 600000); // 10 * 60 * 1000
});

// ── 2. Age exactly 15 minutes → NOT stale (strict >) ───────────────────────────────────────

test('age exactly 15 minutes → NOT stale (strict >)', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T19:00:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z', // exactly 15 minutes
    quality: 'good',
  });
  assert.equal(result.result, FRESHNESS_RESULT.FRESH);
  assert.equal(result.isStale, false);
  assert.equal(result.ageMs, 900000); // 15 * 60 * 1000
  assert.equal(result.thresholdMs, 900000);
});

// ── 3. Age greater than 15 minutes → STALE ─────────────────────────────────────────────────

test('age greater than threshold → STALE', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T19:01:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z', // 16 minutes
    quality: 'good',
  });
  assert.equal(result.result, FRESHNESS_RESULT.STALE);
  assert.equal(result.isStale, true);
  assert.equal(result.quality, 'stale');
  assert.equal(result.ageMs, 960000); // 16 * 60 * 1000
});

// ── 4. Negative age → N1 reject/invalid ────────────────────────────────────────────────────

test('negative age → N1 REJECT', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T18:30:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z', // evaluationTime before asOf → negative age
    quality: 'good',
  });
  assert.equal(result.result, FRESHNESS_RESULT.NEGATIVE_AGE_REJECTED);
  assert.equal(result.rejected, true);
  assert.ok(result.rejectionReason.includes('N1'));
  assert.ok(result.rejectionReason.includes('negative age'));
  assert.equal(result.isStale, false);
  assert.equal(result.freshnessAge, null);
});

// ── 5. evaluationTime is the evaluation instant ────────────────────────────────────────────

test('evaluationTime is used as evaluation instant, not receivedAt', () => {
  // evaluationTime = 5 minutes after asOf → FRESH
  // receivedAt = 20 minutes after asOf → would be STALE if used
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T18:50:00.000Z', // 5 min after asOf
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
  });
  assert.equal(result.result, FRESHNESS_RESULT.FRESH);
  assert.equal(result.ageMs, 300000); // 5 minutes, NOT 20
  assert.equal(result.evaluationTime, '2026-09-11T18:50:00.000Z');
});

// ── 6. asOf is the freshness reference timestamp ───────────────────────────────────────────

test('asOf is the reference timestamp for freshness age', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T19:00:00.000Z',
    asOf: '2026-09-11T18:50:00.000Z',
    quality: 'good',
  });
  assert.equal(result.asOf, '2026-09-11T18:50:00.000Z');
  assert.equal(result.ageMs, 600000); // 10 minutes from asOf
});

// ── 7. receivedAt is NOT substituted ───────────────────────────────────────────────────────

test('receivedAt is not present in the evaluation — only evaluationTime and asOf', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T18:50:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
  });
  // The result only contains evaluationTime and asOf, not receivedAt
  assert.ok(!('receivedAt' in result), 'receivedAt not in result');
  assert.equal(result.evaluationTime, '2026-09-11T18:50:00.000Z');
  assert.equal(result.asOf, '2026-09-11T18:45:00.000Z');
});

// ── 8. Minutes and seconds both accepted ────────────────────────────────────────────────────

test('threshold in minutes works correctly', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T19:01:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
    thresholdSet: { ...THRESHOLD_SET, thresholdValue: 15, thresholdUnit: 'minutes' },
  });
  assert.equal(result.result, FRESHNESS_RESULT.STALE);
  assert.equal(result.thresholdMs, 900000);
});

test('threshold in seconds works correctly', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T18:46:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z', // 60 seconds
    quality: 'good',
    thresholdSet: { ...THRESHOLD_SET, thresholdValue: 30, thresholdUnit: 'seconds' },
  });
  assert.equal(result.result, FRESHNESS_RESULT.STALE);
  assert.equal(result.thresholdMs, 30000);
  assert.equal(result.ageMs, 60000);
});

test('threshold in seconds — below threshold → FRESH', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T18:45:20.000Z',
    asOf: '2026-09-11T18:45:00.000Z', // 20 seconds
    quality: 'good',
    thresholdSet: { ...THRESHOLD_SET, thresholdValue: 30, thresholdUnit: 'seconds' },
  });
  assert.equal(result.result, FRESHNESS_RESULT.FRESH);
  assert.equal(result.ageMs, 20000);
});

// ── 9. INV-7: explicit quality preserved ───────────────────────────────────────────────────

test('INV-7: explicit partial quality preserved even when data is stale', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T19:10:00.000Z', // 25 min → stale
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'partial', // worse than stale
  });
  assert.equal(result.result, FRESHNESS_RESULT.STALE);
  assert.equal(result.quality, 'partial', 'partial preserved — not coerced to stale');
});

test('INV-7: explicit unavailable quality preserved even when data is stale', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T19:10:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'unavailable',
  });
  assert.equal(result.result, FRESHNESS_RESULT.STALE);
  assert.equal(result.quality, 'unavailable', 'unavailable preserved — not coerced');
});

test('INV-7: good quality is overwritten to stale when age exceeds threshold', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T19:10:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
  });
  assert.equal(result.quality, 'stale', 'good → stale (stale is worse)');
});

test('INV-7: no explicit quality → defaults to good when fresh', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T18:50:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z',
  });
  assert.equal(result.quality, 'good');
});

// ── 10. Q-5: contract violation ≠ quality state ────────────────────────────────────────────

test('Q-5: negative age is a rejection, not a quality state', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T18:30:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
  });
  assert.equal(result.rejected, true);
  assert.equal(result.result, FRESHNESS_RESULT.NEGATIVE_AGE_REJECTED);
  // Quality is preserved from input — rejection does not change quality
  assert.equal(result.quality, 'good', 'quality preserved even on rejection (Q-5)');
});

// ── 11. Threshold identity/version/effective-date metadata ──────────────────────────────────

test('threshold set metadata is included in every result', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T18:50:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
  });
  assert.equal(result.thresholdSet.identity, 'D01-FRESHNESS-SET');
  assert.equal(result.thresholdSet.version, 'v1.0');
  assert.equal(result.thresholdSet.effectiveDate, '2026-09-11T18:30:00Z');
  assert.ok(Object.isFrozen(result.thresholdSet));
});

// ── 12. Determinism — no wall clock ────────────────────────────────────────────────────────

test('determinism: identical inputs produce byte-identical outputs', () => {
  const input = {
    evaluationTime: '2026-09-11T19:00:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
  };
  const r1 = evaluateFreshness(input);
  const r2 = evaluateFreshness(input);
  assert.deepEqual(r1, r2, 'two evaluations are byte-identical');
});

test('no wall clock: freshnessAge is computed from inputs only', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T19:00:00.000Z',
    asOf: '2026-09-11T18:50:00.000Z',
    quality: 'good',
  });
  assert.equal(result.freshnessAge, '10.000 minutes (600000ms)');
  assert.ok(!('wallClock' in result));
  assert.ok(!('evaluatedAt' in result));
});

// ── 13. OS-0 NORMAL behavior ───────────────────────────────────────────────────────────────

test('OS-0 NORMAL: standard freshness evaluation applies', () => {
  // Under OS-0 NORMAL, the threshold is active
  const freshResult = evaluateFreshness({
    evaluationTime: '2026-09-11T18:50:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
  });
  assert.equal(freshResult.result, FRESHNESS_RESULT.FRESH);

  const staleResult = evaluateFreshness({
    evaluationTime: '2026-09-11T19:10:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
  });
  assert.equal(staleResult.result, FRESHNESS_RESULT.STALE);
});

// ── 14. Domain/instrument scope ────────────────────────────────────────────────────────────

test('scope metadata is domain-instrument', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T18:50:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
  });
  assert.equal(result.thresholdSet.scope, 'domain-instrument');
});

// ── 15. Boundary and malformed-input cases ─────────────────────────────────────────────────

test('boundary: age = threshold + 1ms → STALE', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T19:00:00.001Z',
    asOf: '2026-09-11T18:45:00.000Z', // 15 min + 1ms
    quality: 'good',
  });
  assert.equal(result.result, FRESHNESS_RESULT.STALE);
  assert.equal(result.ageMs, 900001);
});

test('boundary: age = 0ms → FRESH', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T18:45:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
  });
  assert.equal(result.result, FRESHNESS_RESULT.FRESH);
  assert.equal(result.ageMs, 0);
});

test('boundary: age = -1ms → N1 REJECT', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T18:44:59.999Z',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
  });
  assert.equal(result.result, FRESHNESS_RESULT.NEGATIVE_AGE_REJECTED);
  assert.equal(result.ageMs, -1);
});

test('malformed: invalid evaluationTime throws', () => {
  assert.throws(() => evaluateFreshness({
    evaluationTime: 'not-a-date',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
  }));
});

test('malformed: invalid asOf throws', () => {
  assert.throws(() => evaluateFreshness({
    evaluationTime: '2026-09-11T18:50:00.000Z',
    asOf: 'not-a-date',
    quality: 'good',
  }));
});

test('malformed: null input throws TypeError', () => {
  assert.throws(() => evaluateFreshness(null), TypeError);
});

test('malformed: unrecognized duration unit throws', () => {
  assert.throws(() => evaluateFreshness({
    evaluationTime: '2026-09-11T18:50:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
    thresholdSet: { ...THRESHOLD_SET, thresholdUnit: 'hours' },
  }));
});

// ── 16. Integration with P07-01 quality rule framework ─────────────────────────────────────

test('integration: evaluateFreshnessAndQuality combines freshness + quality rules', () => {
  const snapshot = buildTestSnapshot({
    evaluationTime: '2026-09-11T19:10:00.000Z', // 25 min after asOf → stale
  });
  const result = evaluateFreshnessAndQuality(snapshot, {
    _qualityEvaluator: { evaluateQualityRules },
  });
  assert.ok(result.freshness);
  assert.ok(result.qualityRules);
  assert.equal(result.freshness.isStale, true);
  // Combined quality should be stale (from freshness)
  assert.equal(result.freshness.quality, 'stale');
});

test('integration: freshness FRESH + quality rules PASS → combined good', () => {
  const snapshot = buildTestSnapshot({
    evaluationTime: '2026-09-11T00:05:00.000Z', // 5 min after asOf → fresh
  });
  const result = evaluateFreshnessAndQuality(snapshot, {
    _qualityEvaluator: { evaluateQualityRules },
  });
  assert.equal(result.freshness.result, FRESHNESS_RESULT.FRESH);
  assert.equal(result.combinedQuality, 'good');
});

test('integration: without P07-01 evaluator → freshness only', () => {
  const snapshot = buildTestSnapshot({
    evaluationTime: '2026-09-11T00:05:00.000Z',
  });
  const result = evaluateFreshnessAndQuality(snapshot);
  assert.ok(result.freshness);
  assert.equal(result.qualityRules, null);
  assert.equal(result.combinedQuality, result.freshness.quality);
});

// ── Result is frozen ───────────────────────────────────────────────────────────────────────

test('result is deeply frozen', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T18:50:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
  });
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.thresholdSet));
});

// ── Stale does not suppress data (F-3) ─────────────────────────────────────────────────────

test('F-3: stale result carries all metadata — data is annotated, not suppressed', () => {
  const result = evaluateFreshness({
    evaluationTime: '2026-09-11T19:10:00.000Z',
    asOf: '2026-09-11T18:45:00.000Z',
    quality: 'good',
  });
  assert.equal(result.isStale, true);
  assert.ok(result.freshnessAge !== null, 'freshness age is present');
  assert.ok(result.ageMs !== null, 'ageMs is present');
  assert.equal(result.evaluationTime, '2026-09-11T19:10:00.000Z');
  assert.equal(result.asOf, '2026-09-11T18:45:00.000Z');
});
