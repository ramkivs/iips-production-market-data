/**
 * R-2 tests — DETERMINISTIC NORMALIZATION (§N "normalization"; §F.41)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { canonicalRecordKey, normalizeAll, normalizeRow } from '../src/normalization.js';
import { parseCmUdiff } from '../src/cmudiffParser.js';
import { buildSnapshotId } from '../src/canonicalContract.js';
import { fixtures, lineage } from './helpers.js';

const F = fixtures();
const NAME = 'BhavCopy_NSE_CM_0_0_0_20260102_F_0000.csv';
const rows = () => parseCmUdiff({ text: F[NAME], sourceRef: NAME, sourceId: 'r2-reference-file', sourceTimestamp: '2026-01-02T16:30:00Z' }).rows;

test('§F.41 — normalization is deterministic: identical input ⇒ identical JSON', () => {
  const lin = lineage();
  const a = JSON.stringify(normalizeAll(rows(), lin));
  const b = JSON.stringify(normalizeAll(rows(), lin));
  assert.equal(a, b);
});

test('§F.41 — repeated calls produce no drift over 50 iterations', () => {
  const lin = lineage();
  const first = JSON.stringify(normalizeAll(rows(), lin));
  for (let i = 0; i < 50; i += 1) assert.equal(JSON.stringify(normalizeAll(rows(), lin)), first);
});

test('normalization maps CM-UDiFF ISO tags onto canonical names', () => {
  const rec = normalizeRow(rows().find((r) => r.TckrSymb === 'SYNTHALPHA'), lineage());
  assert.equal(rec.tradeDate, '2026-01-02');
  assert.equal(rec.exchange, 'NSE');
  assert.equal(rec.isin, 'INE000A01001');
  assert.equal(rec.symbol, 'SYNTHALPHA');
  assert.equal(rec.series, 'EQ');
  assert.equal(rec.close, 1015);
  assert.equal(rec.previousClose, 1000);
  assert.equal(rec.volume, 250000);
  assert.equal(rec.transactionCount, 12500);
  assert.equal(rec.priceCurrency, 'INR');
});

test('normalization produces numeric types, not strings', () => {
  const rec = normalizeRow(rows()[0], lineage());
  for (const k of ['open', 'high', 'low', 'close', 'lastPrice', 'previousClose', 'volume', 'tradedValue', 'transactionCount']) {
    assert.equal(typeof rec[k], 'number', `${k} should be a number`);
  }
});

test('P01 NL-7 — an unparseable numeric normalizes to null, never to 0', () => {
  const row = { ...rows()[0], ClsPric: 'NOT_A_NUMBER' };
  const rec = normalizeRow(row, lineage());
  assert.equal(rec.close, null);
  assert.notEqual(rec.close, 0);
});

test('§H/AD-6 — snapshotId is derived from lineage using the frozen format', () => {
  const lin = lineage();
  const rec = normalizeRow(rows()[0], lin);
  assert.equal(rec.snapshotId, buildSnapshotId(lin));
  assert.equal(rec.snapshotId, `data-${lin.provider}-${lin.dataVersion}-${lin.asOf}`);
});

test('§F.40 — provenance survives normalization', () => {
  const rec = normalizeRow(rows()[0], lineage());
  assert.equal(rec.sourceRef, NAME);
  assert.equal(rec.sourceId, 'r2-reference-file');
  assert.equal(rec.sourceTimestamp, '2026-01-02T16:30:00Z');
  assert.equal(rec.ingestionTimestamp, lineage().ingestionTimestamp);
});

test('§F.43 — the canonical key is (exchange, isin, tradeDate), excluding dataVersion', () => {
  const rec = normalizeRow(rows()[0], lineage());
  assert.equal(canonicalRecordKey(rec), 'NSE|INE000A01001|2026-01-02');
  const v2 = normalizeRow(rows()[0], lineage({ dataVersion: 'test-v2' }));
  assert.equal(canonicalRecordKey(v2), canonicalRecordKey(rec),
    'reprocessing at a new dataVersion must target the SAME canonical record');
});

test('symbols are upper-cased and whitespace-normalised; company names keep their case', () => {
  const rec = normalizeRow({ ...rows()[0], TckrSymb: '  synth alpha ', FinInstrmId: 'Synthetic Equity Alpha Ltd' }, lineage());
  assert.equal(rec.symbol, 'SYNTH ALPHA');
  assert.equal(rec.securityName, 'Synthetic Equity Alpha Ltd');
});

test('normalizeAll returns a frozen array of frozen records', () => {
  const all = normalizeAll(rows(), lineage());
  assert.ok(Object.isFrozen(all));
  assert.ok(Object.isFrozen(all[0]));
  assert.equal(all.length, 4);
});
