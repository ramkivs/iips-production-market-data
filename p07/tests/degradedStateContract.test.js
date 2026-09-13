/**
 * P07-04 — DEGRADED-STATE CONTRACT TESTS
 *
 * Authority: D14 §7 (P07-04 contract basis), D15 §4 (policy/state design),
 *            O-4 resolution (failed = data-condition only),
 *            P07 implementation authorization (c91690b).
 *
 * Exit criterion: *"Consumers receive explicit state"* — evidenced by this suite.
 *
 * ⚠ No wall clock, no randomness, no network, no filesystem writes.
 * ⚠ Every test input is a fixed literal — byte-identical across runs (ST-4).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  classifyDataCondition,
  classifyErrorDisposition,
  evaluateDegradedState,
  DATA_CONDITIONS,
} from '../src/degradedStateContract.js';

// ── Data condition set ─────────────────────────────────────────────────────────────────────

test('DATA_CONDITIONS is exactly four, closed, authoritative', () => {
  assert.deepEqual([...DATA_CONDITIONS], ['missing', 'stale', 'partial', 'failed']);
  assert.ok(Object.isFrozen(DATA_CONDITIONS));
});

// ── 1. Missing → unavailable ───────────────────────────────────────────────────────────────

test('missing data → quality: unavailable, fields empty', () => {
  const result = classifyDataCondition({ condition: 'missing' });
  assert.equal(result.quality, 'unavailable');
  assert.equal(result.fieldsEmpty, true);
  assert.equal(result.isRejection, false);
  assert.equal(result.condition, 'missing');
});

// ── 2. Stale → stale ──────────────────────────────────────────────────────────────────────

test('stale data → quality: stale, fields populated', () => {
  const result = classifyDataCondition({ condition: 'stale', completenessPct: 100 });
  assert.equal(result.quality, 'stale');
  assert.equal(result.fieldsEmpty, false);
  assert.equal(result.completenessPct, 100);
});

// ── 3. Partial → partial ──────────────────────────────────────────────────────────────────

test('partial data → quality: partial, fields populated, completenessPct < 100', () => {
  const result = classifyDataCondition({ condition: 'partial', completenessPct: 75 });
  assert.equal(result.quality, 'partial');
  assert.equal(result.fieldsEmpty, false);
  assert.equal(result.completenessPct, 75);
});

test('partial data with 100% completeness → capped below 100', () => {
  const result = classifyDataCondition({ condition: 'partial', completenessPct: 100 });
  assert.equal(result.quality, 'partial');
  assert.ok(result.completenessPct < 100, 'partial must have completenessPct < 100');
});

// ── 4. Failed data condition → unavailable ─────────────────────────────────────────────────

test('failed data condition → quality: unavailable, fields empty', () => {
  const result = classifyDataCondition({ condition: 'failed' });
  assert.equal(result.quality, 'unavailable');
  assert.equal(result.fieldsEmpty, true);
});

// ── 5. No fifth quality state ──────────────────────────────────────────────────────────────

test('no fifth quality state can be produced', () => {
  for (const cond of DATA_CONDITIONS) {
    const result = classifyDataCondition({ condition: cond });
    assert.ok(
      ['good', 'stale', 'partial', 'unavailable'].includes(result.quality),
      `condition '${cond}' produced quality '${result.quality}' — not in accepted enum`
    );
  }
});

test('unknown condition throws (closed set enforcement)', () => {
  assert.throws(() => classifyDataCondition({ condition: 'degraded' }),
    /unknown data condition/);
  assert.throws(() => classifyDataCondition({ condition: 'warning' }),
    /unknown data condition/);
});

// ── 6. Q-5: rejection ≠ quality state ─────────────────────────────────────────────────────

test('Q-5: E2 (authentication failure) is a REJECTION, not a quality state', () => {
  const result = classifyErrorDisposition('E2');
  assert.equal(result.isRejection, true);
  assert.equal(result.isDataCondition, false);
  assert.equal(result.quality, null, 'no quality value for rejections');
  assert.equal(result.rejectionClass, 'E2');
});

test('Q-5: E3 (entitlement failure) is a REJECTION', () => {
  const result = classifyErrorDisposition('E3');
  assert.equal(result.isRejection, true);
  assert.equal(result.quality, null);
});

test('Q-5: E5 (malformed response) is a REJECTION', () => {
  const result = classifyErrorDisposition('E5');
  assert.equal(result.isRejection, true);
  assert.equal(result.quality, null);
});

test('Q-5: E6 (unsupported capability) is a REJECTION', () => {
  const result = classifyErrorDisposition('E6');
  assert.equal(result.isRejection, true);
  assert.equal(result.quality, null);
});

test('Q-5: E8 (contract mapping failure) is a REJECTION', () => {
  const result = classifyErrorDisposition('E8');
  assert.equal(result.isRejection, true);
  assert.equal(result.quality, null);
});

// ── E1 = data condition (the only quality-bearing error) ───────────────────────────────────

test('E1 (provider unavailable) is a data condition → unavailable', () => {
  const result = classifyErrorDisposition('E1');
  assert.equal(result.isDataCondition, true);
  assert.equal(result.isRejection, false);
  assert.equal(result.dataCondition, 'failed');
  assert.equal(result.quality, 'unavailable');
});

test('E4 (transient failure) degrades to E1 → data condition', () => {
  const result = classifyErrorDisposition('E4');
  assert.equal(result.isDataCondition, true);
  assert.equal(result.quality, 'unavailable');
});

test('E7 (rate limit) degrades to E1 → data condition', () => {
  const result = classifyErrorDisposition('E7');
  assert.equal(result.isDataCondition, true);
  assert.equal(result.quality, 'unavailable');
});

// ── 7. INV-7: explicit quality preserved ──────────────────────────────────────────────────

test('INV-7: explicit unavailable quality preserved on stale condition', () => {
  const result = classifyDataCondition({
    condition: 'stale',
    explicitQuality: 'unavailable',
  });
  assert.equal(result.quality, 'unavailable', 'unavailable preserved — worse than stale');
});

test('INV-7: explicit partial quality preserved on stale condition', () => {
  const result = classifyDataCondition({
    condition: 'stale',
    explicitQuality: 'partial',
  });
  assert.equal(result.quality, 'partial', 'partial preserved — worse than stale');
});

test('INV-7: explicit good quality does NOT override stale', () => {
  const result = classifyDataCondition({
    condition: 'stale',
    explicitQuality: 'good',
  });
  assert.equal(result.quality, 'stale', 'good is NOT worse than stale — stale wins');
});

// ── 8. P03 security/degraded-mode boundary (DM-1/DM-2) ────────────────────────────────────

test('DM-1/DM-2: rejections never produce a degraded security mode', () => {
  for (const code of ['E2', 'E3', 'E5', 'E6', 'E8']) {
    const result = classifyErrorDisposition(code);
    assert.equal(result.isRejection, true, `${code} is a rejection`);
    assert.equal(result.quality, null, `${code} has no quality value`);
    assert.equal(result.isDataCondition, false, `${code} is not a data condition`);
  }
});

test('DM-2: degradation is a property of data — only E1 is quality-bearing', () => {
  const e1 = classifyErrorDisposition('E1');
  assert.equal(e1.isDataCondition, true);
  assert.equal(e1.quality, 'unavailable');
});

// ── 9. P05 acquisition boundary ────────────────────────────────────────────────────────────

test('P07-04 does not replace P05 acquisition classification', () => {
  // P07-04 classifies data conditions at the data level.
  // It does not know about or replace P05's acquisition-time classification.
  const result = classifyDataCondition({ condition: 'missing' });
  assert.equal(result.condition, 'missing');
  assert.equal(result.quality, 'unavailable');
  // No P05-specific fields are present in the result
  assert.ok(!('errorClass' in result), 'no errorClass — that is P05');
  assert.ok(!('disposition' in result), 'no disposition — that is P05');
});

// ── 10. P13 UI boundary ───────────────────────────────────────────────────────────────────

test('P13: no UI behavior is implemented', () => {
  const result = classifyDataCondition({ condition: 'stale' });
  // No UI-related properties in the result
  assert.ok(!('displayText' in result), 'no displayText — that is P13');
  assert.ok(!('uiState' in result), 'no uiState — that is P13');
  assert.ok(!('cssClass' in result), 'no cssClass — that is P13');
  assert.ok(!('icon' in result), 'no icon — that is P13');
});

// ── 11. Deterministic / no wall clock ─────────────────────────────────────────────────────

test('determinism: identical inputs produce byte-identical outputs', () => {
  const input = { condition: 'partial', completenessPct: 60 };
  const r1 = classifyDataCondition(input);
  const r2 = classifyDataCondition(input);
  assert.deepEqual(r1, r2);
});

test('no wall clock: result contains no timestamp', () => {
  const result = classifyDataCondition({ condition: 'stale' });
  assert.ok(!('timestamp' in result));
  assert.ok(!('evaluatedAt' in result));
  assert.ok(!('wallClock' in result));
});

// ── 12. Malformed / invalid inputs ────────────────────────────────────────────────────────

test('null input throws TypeError', () => {
  assert.throws(() => classifyDataCondition(null), TypeError);
});

test('invalid error code throws', () => {
  assert.throws(() => classifyErrorDisposition('E9'));
  assert.throws(() => classifyErrorDisposition('X1'));
  assert.throws(() => classifyErrorDisposition(''));
});

// ── evaluateDegradedState integration ─────────────────────────────────────────────────────

test('evaluateDegradedState: missing condition', () => {
  const result = evaluateDegradedState({ condition: 'missing' });
  assert.equal(result.condition, 'missing');
  assert.equal(result.quality, 'unavailable');
  assert.equal(result.fieldsEmpty, true);
  assert.equal(result.isRejection, false);
  assert.ok(Object.isFrozen(result));
});

test('evaluateDegradedState: stale condition', () => {
  const result = evaluateDegradedState({
    condition: 'stale',
    completenessPct: 100,
  });
  assert.equal(result.condition, 'stale');
  assert.equal(result.quality, 'stale');
  assert.equal(result.fieldsEmpty, false);
});

test('evaluateDegradedState: partial condition', () => {
  const result = evaluateDegradedState({
    condition: 'partial',
    completenessPct: 50,
  });
  assert.equal(result.condition, 'partial');
  assert.equal(result.quality, 'partial');
  assert.equal(result.completenessPct, 50);
});

test('evaluateDegradedState: failed condition', () => {
  const result = evaluateDegradedState({ condition: 'failed' });
  assert.equal(result.condition, 'failed');
  assert.equal(result.quality, 'unavailable');
  assert.equal(result.fieldsEmpty, true);
});

test('evaluateDegradedState: error E1 → failed data condition', () => {
  const result = evaluateDegradedState({
    condition: 'missing',
    errorCode: 'E1',
  });
  assert.equal(result.condition, 'failed');
  assert.equal(result.quality, 'unavailable');
  assert.equal(result.isRejection, false);
  assert.ok(result.errorDisposition);
  assert.equal(result.errorDisposition.isDataCondition, true);
});

test('evaluateDegradedState: error E2 → REJECTION (no quality state)', () => {
  const result = evaluateDegradedState({
    condition: 'missing',
    errorCode: 'E2',
  });
  assert.equal(result.isRejection, true);
  assert.equal(result.quality, null);
  assert.equal(result.condition, null);
  assert.equal(result.rejectionClass, 'E2');
});

test('evaluateDegradedState: error E3 → REJECTION (CV-4: denial not a data-quality problem)', () => {
  const result = evaluateDegradedState({
    condition: 'partial',
    errorCode: 'E3',
  });
  assert.equal(result.isRejection, true);
  assert.equal(result.quality, null, 'CV-4: entitlement denial not presented as quality');
});

test('evaluateDegradedState: error E5 → REJECTION (malformed response)', () => {
  const result = evaluateDegradedState({
    condition: 'stale',
    errorCode: 'E5',
  });
  assert.equal(result.isRejection, true);
  assert.equal(result.quality, null);
});

// ── NEG-1 through NEG-9 ───────────────────────────────────────────────────────────────────

test('NEG-1: E2/E3 never presented as unavailable or partial', () => {
  for (const code of ['E2', 'E3']) {
    const result = evaluateDegradedState({ condition: 'missing', errorCode: code });
    assert.equal(result.isRejection, true);
    assert.equal(result.quality, null);
  }
});

test('NEG-2: E5/E8 never presented as quality states', () => {
  for (const code of ['E5', 'E8']) {
    const result = evaluateDegradedState({ condition: 'missing', errorCode: code });
    assert.equal(result.isRejection, true);
    assert.equal(result.quality, null);
  }
});

test('NEG-3: no rejection→partial downgrade', () => {
  const result = evaluateDegradedState({ condition: 'partial', errorCode: 'E2' });
  assert.equal(result.isRejection, true);
  assert.notEqual(result.quality, 'partial', 'RJ-6: no rejection→partial downgrade');
});

test('NEG-7: no fifth quality value from any path', () => {
  const conditions = ['missing', 'stale', 'partial', 'failed'];
  for (const c of conditions) {
    const result = evaluateDegradedState({ condition: c });
    assert.ok(
      ['good', 'stale', 'partial', 'unavailable'].includes(result.quality),
      `NEG-7: condition '${c}' produced '${result.quality}'`
    );
  }
});

test('NEG-8: no alert emitted (no alert property)', () => {
  const result = evaluateDegradedState({ condition: 'stale' });
  assert.ok(!('alert' in result));
  assert.ok(!('alertLevel' in result));
  assert.ok(!('incident' in result));
});

// ── Result is frozen ───────────────────────────────────────────────────────────────────────

test('all results are deeply frozen', () => {
  assert.ok(Object.isFrozen(classifyDataCondition({ condition: 'missing' })));
  assert.ok(Object.isFrozen(classifyDataCondition({ condition: 'stale' })));
  assert.ok(Object.isFrozen(classifyDataCondition({ condition: 'partial' })));
  assert.ok(Object.isFrozen(classifyDataCondition({ condition: 'failed' })));
  assert.ok(Object.isFrozen(classifyErrorDisposition('E1')));
  assert.ok(Object.isFrozen(classifyErrorDisposition('E2')));
  assert.ok(Object.isFrozen(evaluateDegradedState({ condition: 'missing' })));
});

// ── P07-03 boundary ───────────────────────────────────────────────────────────────────────

test('P07-03: no reconciliation or provider selection behavior', () => {
  const result = evaluateDegradedState({ condition: 'stale' });
  assert.ok(!('reconciliationPolicy' in result));
  assert.ok(!('providerSelection' in result));
  assert.ok(!('precedence' in result));
  assert.ok(!('tolerance' in result));
});
