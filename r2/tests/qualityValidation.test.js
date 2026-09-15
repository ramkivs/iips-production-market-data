/**
 * R-2 tests — DATA QUALITY VALIDATION (§N "missing values", "malformed records",
 * "invalid numeric values", "OHLC validation"; §J)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assessRecord, checkContradictions, checkOhlcRelationships, checkTimestamps, QV,
} from '../src/qualityValidation.js';
import { validRecord } from './canonicalContract.test.js';

const NOW = '2026-01-05T09:15:00Z';

test('a clean record is ACCEPTED', () => {
  const v = assessRecord(validRecord(), { now: NOW });
  assert.equal(v.verdict, QV.ACCEPT, v.reasons.join('; '));
});

test('§J — a missing required field is REJECTED, never silently accepted', () => {
  assert.equal(assessRecord(validRecord({ isin: null }), { now: NOW }).verdict, QV.REJECT);
  assert.equal(assessRecord(validRecord({ close: null }), { now: NOW }).verdict, QV.REJECT);
});

test('§J — an invalid numeric value is REJECTED', () => {
  assert.equal(assessRecord(validRecord({ volume: 12.5 }), { now: NOW }).verdict, QV.REJECT);
  assert.equal(assessRecord(validRecord({ close: Number.NaN }), { now: NOW }).verdict, QV.REJECT);
});

test('§J — impossible OHLC (low > high) is QUARANTINED with a diagnostic reason', () => {
  const v = assessRecord(validRecord({ low: 1050, high: 900 }), { now: NOW });
  assert.equal(v.verdict, QV.QUARANTINE);
  assert.ok(v.reasons.some((r) => /low \(1050\) > high \(900\)/.test(r)));
});

test('§J — a close outside the day range is QUARANTINED', () => {
  const v = assessRecord(validRecord({ close: 1100, high: 1020.75 }), { now: NOW });
  assert.equal(v.verdict, QV.QUARANTINE);
  assert.ok(v.reasons.some((r) => /close \(1100\) > high/.test(r)));
});

test('OHLC — an absent optional price cannot make a bar impossible (P01 NL-7)', () => {
  assert.deepEqual(checkOhlcRelationships(validRecord({ open: null, low: 998.1, high: 1020.75 })), []);
});

test('OHLC — a negative price is flagged', () => {
  assert.ok(checkOhlcRelationships(validRecord({ low: -1 })).length > 0);
});

test('§J — contradictory daily data: volume > 0 with no close', () => {
  const v = assessRecord(validRecord({ close: null, volume: 250000 }), { now: NOW });
  assert.equal(v.verdict, QV.REJECT, 'a missing required close is a rejection, not a quarantine');
  assert.ok(checkContradictions({ close: null, volume: 250000, tradedValue: 1, transactionCount: 1 }).length > 0);
});

test('§J — tradedValue wildly inconsistent with volume×close is QUARANTINED', () => {
  const v = assessRecord(validRecord({ volume: 250000, close: 1015, tradedValue: 100 }), { now: NOW });
  assert.equal(v.verdict, QV.QUARANTINE);
  assert.ok(v.reasons.some((r) => /implies avg/.test(r)));
});

test('§J — a plausible VWAP-vs-close difference is NOT flagged', () => {
  const rec = validRecord({ volume: 250000, close: 1015, tradedValue: 253750000 });
  assert.deepEqual(checkContradictions(rec), []);
});

test('§J — inconsistent timestamps: ingestion before publication', () => {
  const rec = validRecord({ sourceTimestamp: '2026-01-05T16:30:00Z', ingestionTimestamp: '2026-01-05T09:15:00Z' });
  assert.ok(checkTimestamps(rec, NOW).some((p) => /precedes sourceTimestamp/.test(p)));
  assert.equal(assessRecord(rec, { now: NOW }).verdict, QV.QUARANTINE);
});

test('§J — a source timestamp in the future is flagged', () => {
  const rec = validRecord({ sourceTimestamp: '2027-01-01T00:00:00Z', ingestionTimestamp: '2027-01-01T00:00:01Z' });
  assert.ok(checkTimestamps(rec, NOW).some((p) => /in the future/.test(p)));
});

test('§J — tradeDate after sourceTimestamp is flagged', () => {
  const rec = validRecord({ tradeDate: '2026-03-15', sourceTimestamp: '2026-01-07T16:30:00Z' });
  assert.ok(checkTimestamps(rec, NOW).some((p) => /tradeDate is after sourceTimestamp/.test(p)));
});

test('§J — an unexpected symbol shape is QUARANTINED, not dropped', () => {
  const v = assessRecord(validRecord({ symbol: 'BAD SYMBOL!!' }), { now: NOW });
  assert.equal(v.verdict, QV.QUARANTINE);
  assert.ok(v.reasons.some((r) => /expected NSE symbol shape/.test(r)));
});

test('§J — the expected-universe hook quarantines an out-of-universe symbol', () => {
  const v = assessRecord(validRecord({ symbol: 'SYNTHALPHA' }), {
    now: NOW,
    isExpectedSymbol: (r) => r.symbol === 'SYNTHBETA',
  });
  assert.equal(v.verdict, QV.QUARANTINE);
  assert.ok(v.reasons.some((r) => /not in the expected instrument universe/.test(r)));
});

test('§J — there are exactly three verdicts, so no record can pass unclassified', () => {
  assert.deepEqual(Object.values(QV).sort(), ['accept', 'quarantine', 'reject']);
});

test('§J — every verdict carries a reason unless it is a clean accept', () => {
  for (const rec of [
    validRecord({ isin: null }), validRecord({ low: 1050, high: 900 }),
    validRecord({ symbol: 'BAD!!' }), validRecord(),
  ]) {
    const v = assessRecord(rec, { now: NOW });
    if (v.verdict !== QV.ACCEPT) assert.ok(v.reasons.length > 0, 'a non-accept must explain itself');
  }
});
