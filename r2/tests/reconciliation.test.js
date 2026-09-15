/**
 * R-2 tests — RECONCILIATION (§N "reconciliation"; §J)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertRowAccounting, assessCompleteness, findContradictoryDaily, findDuplicateKeys,
  findTimestampInconsistencies, reconcile,
} from '../src/reconciliation.js';
import { canonicalRecordKey } from '../src/normalization.js';
import { validRecord } from './canonicalContract.test.js';

test('§J — balanced row accounting reconciles', () => {
  const r = assertRowAccounting({ sourceRecordCount: 10, acceptedCount: 7, rejectedCount: 2, quarantinedCount: 1 });
  assert.equal(r.balanced, true);
  assert.equal(r.unaccounted, 0);
});

test('§J — a lost row is a reconciliation FAILURE, reported not absorbed', () => {
  const r = assertRowAccounting({ sourceRecordCount: 10, acceptedCount: 6, rejectedCount: 2, quarantinedCount: 1 });
  assert.equal(r.balanced, false);
  assert.equal(r.unaccounted, 1);
  assert.match(r.detail, /RECONCILIATION FAILURE/);
});

test('§J — duplicate canonical keys inside an accepted set are detected', () => {
  const recs = [validRecord(), validRecord({ dataVersion: 'v2' }), validRecord({ isin: 'INE000B01002' })];
  const d = findDuplicateKeys(recs, canonicalRecordKey);
  assert.equal(d.duplicateCount, 1);
  assert.equal(d.duplicates[0], 'NSE|INE000A01001|2026-01-02');
});

test('§J — source completeness separates missing from unexpected days', () => {
  const recs = [validRecord({ tradeDate: '2026-01-02' }), validRecord({ tradeDate: '2026-01-03', isin: 'INE000B01002' })];
  const c = assessCompleteness({ expectedDays: ['2026-01-02', '2026-01-03', '2026-01-05'], records: recs });
  assert.deepEqual(c.missingDays, ['2026-01-05']);
  assert.deepEqual(c.unexpectedDays, []);
  assert.equal(c.complete, false);
  assert.equal(c.coveragePct, 66.6667);
});

test('§J — a day present but not expected is flagged (catches mis-dated sources)', () => {
  const c = assessCompleteness({ expectedDays: ['2026-01-02'], records: [validRecord({ tradeDate: '2026-01-09' })] });
  assert.deepEqual(c.unexpectedDays, ['2026-01-09']);
  assert.equal(c.complete, false);
});

test('§J — contradictory daily data (two closes for one bar) is detected', () => {
  const recs = [validRecord({ close: 1015 }), validRecord({ close: 999, dataVersion: 'v2' })];
  const c = findContradictoryDaily(recs);
  assert.equal(c.conflictCount, 1);
  assert.match(c.conflicts[0].reason, /disagree on close/);
});

test('§J — a restatement that agrees on close is not a contradiction', () => {
  const recs = [validRecord(), validRecord({ dataVersion: 'v2' })];
  assert.equal(findContradictoryDaily(recs).conflictCount, 0);
});

test('§J — inconsistent timestamps across a set are detected', () => {
  const recs = [validRecord({ sourceTimestamp: '2026-01-05T16:30:00Z', ingestionTimestamp: '2026-01-05T09:00:00Z' })];
  assert.equal(findTimestampInconsistencies(recs).count, 1);
});

test('§J — reconcile aggregates every control into one verdict', () => {
  const metrics = { sourceRecordCount: 2, acceptedCount: 1, rejectedCount: 1, quarantinedCount: 0 };
  const accepted = [validRecord()];
  const r = reconcile({ metrics, accepted, keyFn: canonicalRecordKey, expectedDays: ['2026-01-02'] });
  assert.equal(r.reconciled, true, r.failures.join('; '));
  assert.equal(r.rowAccounting.balanced, true);
  assert.equal(r.duplicates.duplicateCount, 0);
  assert.equal(r.completeness.complete, true);
});

test('§J — reconcile fails when completeness is unmet', () => {
  const metrics = { sourceRecordCount: 1, acceptedCount: 1, rejectedCount: 0, quarantinedCount: 0 };
  const r = reconcile({
    metrics, accepted: [validRecord()], keyFn: canonicalRecordKey,
    expectedDays: ['2026-01-02', '2026-01-03'],
  });
  assert.equal(r.reconciled, false);
  assert.ok(r.failures.some((f) => /completeness/.test(f)));
});

test('§J — reconcile fails when the accepted set contains duplicates', () => {
  const metrics = { sourceRecordCount: 2, acceptedCount: 2, rejectedCount: 0, quarantinedCount: 0 };
  const r = reconcile({
    metrics, accepted: [validRecord(), validRecord({ dataVersion: 'v2' })], keyFn: canonicalRecordKey,
  });
  assert.equal(r.reconciled, false);
  assert.ok(r.failures.some((f) => /duplicate canonical key/.test(f)));
});

test('§J — reconcile omits completeness when no expected-day set is supplied', () => {
  const r = reconcile({
    metrics: { sourceRecordCount: 1, acceptedCount: 1, rejectedCount: 0, quarantinedCount: 0 },
    accepted: [validRecord()], keyFn: canonicalRecordKey,
  });
  assert.equal(r.completeness, null);
  assert.equal(r.reconciled, true);
});
