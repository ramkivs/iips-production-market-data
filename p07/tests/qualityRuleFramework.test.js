/**
 * P07-01 — QUALITY RULE FRAMEWORK TESTS
 *
 * Authority: D14 §4 (P07-01 contract basis), P07 implementation authorization (c91690b).
 *
 * Exit criterion: *"Rules execute and classify failures"* — evidenced by this suite.
 * No-coercion proof: INV-7 / NFR-04 compliance tested explicitly.
 * Q-5: contract violation ≠ quality state — tested explicitly.
 *
 * ⚠ No wall clock, no randomness, no network, no filesystem writes.
 * ⚠ Every test input is a fixed literal — byte-identical across runs (B-6).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateQualityRules,
  RULE_CATEGORIES,
  RULE_RESULT,
} from '../src/qualityRuleFramework.js';

import { buildTestSnapshot, buildInvalidSnapshot } from './helpers.js';

// ── Category set ───────────────────────────────────────────────────────────────────────────

test('RULE_CATEGORIES is exactly five, closed, authoritative', () => {
  assert.deepEqual([...RULE_CATEGORIES], [
    'completeness', 'validity', 'range', 'continuity', 'reconciliation',
  ]);
  assert.ok(Object.isFrozen(RULE_CATEGORIES), 'RULE_CATEGORIES is frozen');
});

test('RULE_RESULT has exactly PASS, FAIL, DELEGATED', () => {
  assert.deepEqual({ ...RULE_RESULT }, { PASS: 'PASS', FAIL: 'FAIL', DELEGATED: 'DELEGATED' });
  assert.ok(Object.isFrozen(RULE_RESULT), 'RULE_RESULT is frozen');
});

// ── Valid snapshot — all categories pass ───────────────────────────────────────────────────

test('valid snapshot: all evaluable categories PASS', () => {
  const snapshot = buildTestSnapshot();
  const result = evaluateQualityRules(snapshot);

  assert.equal(result.snapshotId, 'data-test-1.0-2026-09-11T00:00:00.000Z');
  assert.equal(result.quality, 'good');
  assert.equal(result.completenessPct, 100);
  assert.equal(result.passed, true);
  assert.deepEqual([...result.failedCategories], []);
  assert.deepEqual([...result.delegatedCategories], ['reconciliation']);
  assert.equal(result.categoriesEvaluated, 4);
  assert.equal(result.evaluationTimestamp, null);

  // Per-category
  assert.equal(result.results.completeness.status, RULE_RESULT.PASS);
  assert.equal(result.results.validity.status, RULE_RESULT.PASS);
  assert.equal(result.results.range.status, RULE_RESULT.PASS);
  assert.equal(result.results.continuity.status, RULE_RESULT.PASS);
  assert.equal(result.results.reconciliation.status, RULE_RESULT.DELEGATED);
});

// ── Quality preservation (INV-7) ───────────────────────────────────────────────────────────

test('quality is NEVER coerced — preserved from input', () => {
  for (const q of ['good', 'stale', 'partial', 'unavailable']) {
    const fields = q === 'unavailable' ? Object.freeze({}) : buildTestSnapshot().fields;
    const cp = q === 'unavailable' ? 0 : 100;
    const snapshot = buildTestSnapshot({ quality: q, completenessPct: cp, fields });
    const result = evaluateQualityRules(snapshot);
    assert.equal(result.quality, q, `quality '${q}' preserved — not coerced`);
  }
});

test('completenessPct is NEVER overwritten — preserved from input', () => {
  const snapshot = buildTestSnapshot({ completenessPct: 75.5 });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.completenessPct, 75.5, 'completenessPct preserved');
});

// ── No fifth quality state ─────────────────────────────────────────────────────────────────

test('no fifth quality state is introduced by the framework', () => {
  const snapshot = buildTestSnapshot();
  const result = evaluateQualityRules(snapshot);

  // The result quality must be one of the four accepted states
  assert.ok(
    ['good', 'stale', 'partial', 'unavailable'].includes(result.quality),
    `result.quality '${result.quality}' is in the accepted enum`
  );

  // No new quality values appear anywhere in the results
  const allFindings = Object.values(result.results).flatMap((r) => r.findings);
  const inventedStates = allFindings.filter((f) =>
    /quality.*'(excellent|warning|error|degraded|failed|bad|ok)'/.test(f)
  );
  assert.deepEqual(inventedStates, [], 'no fifth quality state invented in findings');
});

// ── Completeness rules ─────────────────────────────────────────────────────────────────────

test('completeness: PASS when completenessPct is consistent', () => {
  const snapshot = buildTestSnapshot({ completenessPct: 100 });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.completeness.status, RULE_RESULT.PASS);
});

test('completeness: FAIL when completenessPct is out of range', () => {
  const snapshot = buildTestSnapshot({ completenessPct: 150 });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.completeness.status, RULE_RESULT.FAIL);
  assert.ok(result.results.completeness.findings.some((f) => f.startsWith('C-1')));
});

test('completeness: FAIL when completenessPct is negative', () => {
  const snapshot = buildTestSnapshot({ completenessPct: -5 });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.completeness.status, RULE_RESULT.FAIL);
  assert.ok(result.results.completeness.findings.some((f) => f.startsWith('C-1')));
});

test('completeness: FAIL when unavailable snapshot has non-zero completenessPct', () => {
  const snapshot = buildTestSnapshot({
    quality: 'unavailable',
    completenessPct: 50,
    fields: Object.freeze({}),
  });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.completeness.status, RULE_RESULT.FAIL);
  assert.ok(result.results.completeness.findings.some((f) => f.startsWith('C-3')));
});

test('completeness: PASS for unavailable snapshot with completenessPct=0 and empty fields', () => {
  const snapshot = buildTestSnapshot({
    quality: 'unavailable',
    completenessPct: 0,
    fields: Object.freeze({}),
  });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.completeness.status, RULE_RESULT.PASS);
});

test('completeness: FAIL when incomplete fields are not reflected in completenessPct', () => {
  const fields = Object.freeze({
    'test:price': Object.freeze({
      value: '100', availability: 'PRESENT', dataType: 'decimal',
      provenance: { source: 't', field: 'p' }, pitEligible: true,
    }),
    'test:volume': Object.freeze({
      value: null, availability: 'NOT_PROVIDED', dataType: 'integer',
      provenance: { source: 't', field: 'v' }, pitEligible: false,
    }),
  });
  const snapshot = buildTestSnapshot({ completenessPct: 100, fields });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.completeness.status, RULE_RESULT.FAIL);
  assert.ok(result.results.completeness.findings.some((f) => f.startsWith('C-2')));
});

// ── Validity rules ─────────────────────────────────────────────────────────────────────────

test('validity: PASS for structurally valid snapshot', () => {
  const snapshot = buildTestSnapshot();
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.validity.status, RULE_RESULT.PASS);
});

test('validity: FAIL for structurally invalid snapshot (Q-5 — rejection, not quality state)', () => {
  const snapshot = buildInvalidSnapshot();
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.validity.status, RULE_RESULT.FAIL);
  assert.ok(result.results.validity.findings.some((f) => f.startsWith('V-1')));
  assert.ok(result.results.validity.findings.some((f) => f.includes('Q-5')));
});

test('validity: contract violation is reported as REJECTION, never as a quality state', () => {
  const snapshot = buildInvalidSnapshot({ quality: 'good' });
  const result = evaluateQualityRules(snapshot);

  // Quality must still be 'good' — preserved, not coerced to something else
  assert.equal(result.quality, 'good', 'quality preserved even when snapshot is invalid');
  // The validity finding must reference Q-5
  const q5Finding = result.results.validity.findings.find((f) => f.includes('Q-5'));
  assert.ok(q5Finding, 'Q-5 finding present');
  assert.ok(q5Finding.includes('rejection'), 'Q-5 finding references rejection');
});

// ── Range rules ────────────────────────────────────────────────────────────────────────────

test('range: PASS when all fields conform', () => {
  const snapshot = buildTestSnapshot();
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.range.status, RULE_RESULT.PASS);
});

test('range: FAIL when field has unrecognized availability (R-1)', () => {
  const fields = Object.freeze({
    'test:bad': Object.freeze({
      value: '1', availability: 'UNKNOWN_STATUS', dataType: 'decimal',
      provenance: { source: 't', field: 'b' }, pitEligible: false,
    }),
  });
  const snapshot = buildTestSnapshot({ fields });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.range.status, RULE_RESULT.FAIL);
  assert.ok(result.results.range.findings.some((f) => f.startsWith('R-1')));
});

test('range: FAIL when field has unrecognized dataType (R-2)', () => {
  const fields = Object.freeze({
    'test:bad': Object.freeze({
      value: '1', availability: 'PRESENT', dataType: 'blob',
      provenance: { source: 't', field: 'b' }, pitEligible: false,
    }),
  });
  const snapshot = buildTestSnapshot({ fields });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.range.status, RULE_RESULT.FAIL);
  assert.ok(result.results.range.findings.some((f) => f.startsWith('R-2')));
});

test('range: FAIL when field quality is better than snapshot quality (R-4, SM-13/Q-6)', () => {
  const fields = Object.freeze({
    'test:price': Object.freeze({
      value: '100', availability: 'PRESENT', dataType: 'decimal',
      quality: 'good', // field says 'good' but snapshot says 'stale' — violation
      provenance: { source: 't', field: 'p' }, pitEligible: true,
    }),
  });
  const snapshot = buildTestSnapshot({ quality: 'stale', fields });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.range.status, RULE_RESULT.FAIL);
  assert.ok(result.results.range.findings.some((f) => f.startsWith('R-4')));
});

test('range: PASS when field quality is equal or worse than snapshot (R-4)', () => {
  const fields = Object.freeze({
    'test:price': Object.freeze({
      value: '100', availability: 'PRESENT', dataType: 'decimal',
      quality: 'partial', // worse than snapshot 'good' — allowed
      provenance: { source: 't', field: 'p' }, pitEligible: true,
    }),
    'test:volume': Object.freeze({
      value: '1000', availability: 'PRESENT', dataType: 'integer',
      provenance: { source: 't', field: 'v' }, pitEligible: false,
    }),
  });
  const snapshot = buildTestSnapshot({ fields });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.range.status, RULE_RESULT.PASS);
});

test('range: FAIL when PRESENT field has undefined value (R-5)', () => {
  const fields = Object.freeze({
    'test:bad': Object.freeze({
      availability: 'PRESENT', dataType: 'decimal',
      provenance: { source: 't', field: 'b' }, pitEligible: false,
      // value is undefined
    }),
  });
  const snapshot = buildTestSnapshot({ fields });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.range.status, RULE_RESULT.FAIL);
  assert.ok(result.results.range.findings.some((f) => f.startsWith('R-5')));
});

// ── Continuity rules ───────────────────────────────────────────────────────────────────────

test('continuity: PASS when timestamps are valid and ordered', () => {
  const snapshot = buildTestSnapshot();
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.continuity.status, RULE_RESULT.PASS);
});

test('continuity: FAIL when receivedAt precedes asOf (T-3)', () => {
  const snapshot = buildTestSnapshot({
    asOf: '2026-09-11T12:00:00.000Z',
    receivedAt: '2026-09-11T11:00:00.000Z',
  });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.continuity.status, RULE_RESULT.FAIL);
  assert.ok(result.results.continuity.findings.some((f) => f.startsWith('T-3')));
});

test('continuity: FAIL when asOf is not valid ISO-8601 UTC (T-1)', () => {
  const snapshot = buildTestSnapshot({ asOf: 'not-a-date' });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.continuity.status, RULE_RESULT.FAIL);
  assert.ok(result.results.continuity.findings.some((f) => f.startsWith('T-1')));
});

test('continuity: PASS when evaluationTime is valid', () => {
  const snapshot = buildTestSnapshot({ evaluationTime: '2026-09-11T00:00:02.000Z' });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.continuity.status, RULE_RESULT.PASS);
});

test('continuity: FAIL when evaluationTime is invalid (T-4)', () => {
  const snapshot = buildTestSnapshot({ evaluationTime: 'not-utc' });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.continuity.status, RULE_RESULT.FAIL);
  assert.ok(result.results.continuity.findings.some((f) => f.startsWith('T-4')));
});

// ── Reconciliation delegation ───────────────────────────────────────────────────────────────

test('reconciliation: always DELEGATED to P07-03', () => {
  const snapshot = buildTestSnapshot();
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.results.reconciliation.status, RULE_RESULT.DELEGATED);
  assert.deepEqual([...result.delegatedCategories], ['reconciliation']);
});

// ── Determinism (B-6) ──────────────────────────────────────────────────────────────────────

test('determinism: identical inputs produce byte-identical outputs', () => {
  const snapshot = buildTestSnapshot();
  const r1 = evaluateQualityRules(snapshot);
  const r2 = evaluateQualityRules(snapshot);
  assert.deepEqual(r1, r2, 'two evaluations of the same snapshot are byte-identical');
});

test('determinism: evaluationTimestamp is always null (no wall clock)', () => {
  const snapshot = buildTestSnapshot();
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.evaluationTimestamp, null, 'no wall clock used');
});

// ── No mutation (B-1, INV-7) ───────────────────────────────────────────────────────────────

test('no mutation: input snapshot is not modified', () => {
  const snapshot = buildTestSnapshot();
  const before = JSON.stringify(snapshot);
  evaluateQualityRules(snapshot);
  const after = JSON.stringify(snapshot);
  assert.equal(before, after, 'snapshot not modified by evaluation');
});

test('no mutation: result is deeply frozen', () => {
  const snapshot = buildTestSnapshot();
  const result = evaluateQualityRules(snapshot);
  assert.ok(Object.isFrozen(result), 'result is frozen');
  assert.ok(Object.isFrozen(result.results), 'result.results is frozen');
  assert.ok(Object.isFrozen(result.failedCategories), 'failedCategories is frozen');
  assert.ok(Object.isFrozen(result.delegatedCategories), 'delegatedCategories is frozen');
});

// ── Error handling ─────────────────────────────────────────────────────────────────────────

test('throws TypeError for null snapshot', () => {
  assert.throws(() => evaluateQualityRules(null), TypeError);
});

test('throws TypeError for non-object snapshot', () => {
  assert.throws(() => evaluateQualityRules('not-an-object'), TypeError);
});

// ── "passed" semantics ─────────────────────────────────────────────────────────────────────

test('passed=true when all non-delegated categories pass', () => {
  const snapshot = buildTestSnapshot();
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.passed, true);
  assert.deepEqual([...result.failedCategories], []);
});

test('passed=false when any category fails', () => {
  const snapshot = buildTestSnapshot({ completenessPct: 200 });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.passed, false);
  assert.ok(result.failedCategories.length > 0);
});

// ── Multiple failures ──────────────────────────────────────────────────────────────────────

test('multiple categories can fail simultaneously', () => {
  const snapshot = buildTestSnapshot({
    completenessPct: -10,           // completeness FAIL (C-1)
    asOf: 'not-a-date',             // continuity FAIL (T-1)
  });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.passed, false);
  assert.ok(result.failedCategories.includes('completeness'));
  assert.ok(result.failedCategories.includes('continuity'));
});

// ── Stale/partial quality snapshots ────────────────────────────────────────────────────────

test('stale quality snapshot evaluates correctly', () => {
  const snapshot = buildTestSnapshot({ quality: 'stale' });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.quality, 'stale');
  assert.equal(result.results.completeness.status, RULE_RESULT.PASS);
});

test('partial quality snapshot evaluates correctly', () => {
  const fields = Object.freeze({
    'test:price': Object.freeze({
      value: '100', availability: 'PRESENT', dataType: 'decimal',
      provenance: { source: 't', field: 'p' }, pitEligible: true,
    }),
    'test:volume': Object.freeze({
      value: null, availability: 'NOT_PROVIDED', dataType: 'integer',
      provenance: { source: 't', field: 'v' }, pitEligible: false,
    }),
  });
  const snapshot = buildTestSnapshot({ quality: 'partial', completenessPct: 50, fields });
  const result = evaluateQualityRules(snapshot);
  assert.equal(result.quality, 'partial');
  assert.equal(result.results.completeness.status, RULE_RESULT.PASS);
});
