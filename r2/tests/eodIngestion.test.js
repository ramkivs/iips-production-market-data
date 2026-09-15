/**
 * R-2 tests — EOD INGESTION PIPELINE (§N "EOD ingestion", "duplicate handling", "idempotency")
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { ingestFile, ingestEodRows, METRIC_KEYS } from '../src/eodIngestion.js';
import { parseCmUdiff } from '../src/cmudiffParser.js';
import { assertRowAccounting, reconcile } from '../src/reconciliation.js';
import { canonicalRecordKey } from '../src/normalization.js';
import { fixtures, lineage, store } from './helpers.js';

const F = fixtures();
const VALID = 'BhavCopy_NSE_CM_0_0_0_20260102_F_0000.csv';
const MIXED = 'BhavCopy_NSE_CM_0_0_0_20260105_F_0000.csv';
const QUALITY = 'SYNTHETIC_quality_cases_20260106.csv';

/**
 * Derive a source-publication instant from the fixture's own business date.
 *
 * Using one fixed timestamp for every fixture would make the §J timestamp check fire spuriously
 * on the 01-05/01-06 files (tradeDate after sourceTimestamp), which would mask real behaviour.
 */
function sourceTsFor(name) {
  const m = /(\d{4})(\d{2})(\d{2})/.exec(name);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T16:30:00Z`;
  const d = /(\d{4}-\d{2}-\d{2})/.exec(name);
  return d ? `${d[1]}T16:30:00Z` : '2026-01-02T16:30:00Z';
}

/** Ingestion instant for a fixture: its publication time plus two hours, so that the §J
 *  timestamp check (ingestion must not precede publication) is satisfied by construction. */
function ingestionTsFor(name) {
  const m = /(\d{4})-(\d{2})-(\d{2})/.exec(sourceTsFor(name));
  return `${m[1]}-${m[2]}-${m[3]}T18:30:00Z`;
}

function ingest(name, s = store(), lin = null) {
  const l = lin ?? lineage({ ingestionTimestamp: ingestionTsFor(name), asOf: sourceTsFor(name) });
  return ingestFile({
    text: F[name], sourceRef: name, sourceId: 'r2-reference-file',
    sourceTimestamp: sourceTsFor(name), lineage: l, store: s, now: l.ingestionTimestamp,
  });
}

test('§F.36 — the pipeline exposes exactly the required stage sequence', () => {
  const r = ingest(VALID);
  assert.deepEqual(r.trace.stages, [
    'RAW NSE FILE', 'PARSER', 'SCHEMA VALIDATION', 'EQUITY ELIGIBILITY FILTER',
    'NORMALIZATION', 'DATA QUALITY VALIDATION', 'CANONICAL EOD RECORD',
    'RECONCILIATION', 'HISTORICAL STORE',
  ]);
});

test('§J — every run reports the full metric set', () => {
  const r = ingest(VALID);
  for (const k of METRIC_KEYS) assert.ok(k in r.metrics, `${k} must be reported`);
});

test('a clean file ingests every row into the historical store', () => {
  const s = store();
  const r = ingest(VALID, s);
  assert.equal(r.ok, true, r.error?.reason);
  assert.equal(r.metrics.sourceRecordCount, 4);
  assert.equal(r.metrics.eligibleEquityCount, 4);
  assert.equal(r.metrics.acceptedCount, 4);
  assert.equal(r.metrics.rejectedCount, 0);
  assert.equal(r.metrics.quarantinedCount, 0);
  assert.equal(s.dailyCount(), 4);
});

test('§F.39 — debt and SGB rows never reach the store', () => {
  const s = store();
  const r = ingest(MIXED, s);
  assert.equal(r.metrics.sourceRecordCount, 5);
  assert.equal(r.metrics.eligibleEquityCount, 2);
  assert.equal(r.metrics.acceptedCount, 2);
  assert.equal(r.metrics.rejectedCount, 3);
  assert.equal(s.dailyCount(), 2);
  for (const rec of r.accepted) assert.ok(['EQ', 'BE'].includes(rec.series));
});

test('§F.43 — reprocessing the SAME source file creates no duplicate records', () => {
  const s = store();
  const first = ingest(VALID, s);
  const second = ingest(VALID, s);
  assert.equal(first.metrics.acceptedCount, 4);
  assert.equal(s.dailyCount(), 4, 'store must still hold exactly 4 canonical records');
  assert.equal(second.sourceFileStatus, 'duplicate');
  assert.equal(second.metrics.acceptedCount, 0);
  assert.equal(second.metrics.duplicateCount, 1);
  assert.equal(s.dailyCount(), 4);
});

test('§F.42 — reprocessing the same content at a NEW dataVersion updates, never duplicates', () => {
  const s = store();
  ingest(VALID, s, lineage({ dataVersion: 'v1' }));
  const before = s.dailyCount();
  const r2 = ingestFile({
    text: F[VALID], sourceRef: 'restated-copy-20260102.csv', sourceId: 'r2-reference-file',
    sourceTimestamp: sourceTsFor(VALID), lineage: lineage({ dataVersion: 'v2' }), store: s,
    now: '2026-01-05T09:15:00Z',
  });
  assert.equal(s.dailyCount(), before, 'a restatement must not add rows');
  assert.equal(r2.ok, true);
});

test('§J — a duplicate (isin, tradeDate) WITHIN one file is counted, not double-stored', () => {
  const s = store();
  const r = ingest(QUALITY, s);
  assert.ok(r.metrics.duplicateCount >= 1, 'the fixture contains a deliberate duplicate');
  const keys = r.accepted.map(canonicalRecordKey);
  assert.equal(new Set(keys).size, keys.length, 'no duplicate keys may be accepted');
});

test('§J — the malformed short row is quarantined and counted', () => {
  const s = store();
  const r = ingest(QUALITY, s);
  assert.ok(r.metrics.rejectedCount >= 1);
  assert.ok(s.quarantined().length >= 1);
});

test('§J — an invalid numeric value does not reach the store as a number', () => {
  const s = store();
  const r = ingest(QUALITY, s);
  for (const rec of r.accepted) {
    for (const k of ['open', 'high', 'low', 'close', 'lastPrice', 'previousClose']) {
      if (rec[k] !== null) assert.equal(typeof rec[k], 'number');
    }
  }
  assert.equal(r.accepted.some((x) => x.symbol === 'SYNTHBADNUM'), false,
    'NOT_A_NUMBER must not be accepted as a price');
});

test('§J — impossible OHLC is quarantined, never silently accepted', () => {
  const s = store();
  const r = ingest(QUALITY, s);
  assert.equal(r.accepted.some((x) => x.symbol === 'SYNTHBADOHLC'), false);
  assert.ok(r.quarantined.some((q) => /SYNTHBADOHLC/.test(JSON.stringify(q.rec)) || /OHLC/.test(q.reason)));
});

test('§J — a stale/invalid date is quarantined', () => {
  const s = store();
  const r = ingest('SYNTHETIC_invalid_date_20260107.csv', s, lineage({ asOf: '2026-01-07T16:30:00Z' }));
  assert.equal(r.accepted.length, 0);
  assert.ok(r.metrics.quarantinedCount >= 1);
});

test('§F.35 — the legacy CM file is refused outright', () => {
  const r = ingest('SYNTHETIC_legacy_cm_format.csv');
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'MALFORMED_RESPONSE');
});

test('E5 — a file missing required tags is refused', () => {
  const r = ingest('SYNTHETIC_missing_required_tags.csv');
  assert.equal(r.ok, false);
  assert.equal(r.error.code, 'MALFORMED_RESPONSE');
});

test('§J — row accounting balances: source = accepted + rejected + quarantined', () => {
  for (const name of [VALID, MIXED, QUALITY]) {
    const r = ingest(name);
    if (!r.ok) continue;
    const acct = assertRowAccounting(r.metrics);
    assert.equal(acct.balanced, true, `${name}: ${acct.detail}`);
  }
});

test('§F.40 — every accepted record carries full source provenance', () => {
  const r = ingest(VALID);
  for (const rec of r.accepted) {
    assert.ok(rec.sourceRef);
    assert.ok(rec.sourceId);
    assert.ok(rec.sourceTimestamp);
    assert.ok(rec.ingestionTimestamp);
  }
});

test('§F.36 — reconciliation runs and reports success on a clean file', () => {
  const r = ingest(VALID);
  const rec = reconcile({ metrics: r.metrics, accepted: r.accepted, keyFn: canonicalRecordKey });
  assert.equal(rec.reconciled, true, rec.failures.join('; '));
});

test('inv-10 — accepted records contain no provider-native field names', () => {
  const r = ingest(MIXED);
  const native = ['TradDt', 'TckrSymb', 'ClsPric', 'SctySrs', 'TtlTradgQty'];
  for (const rec of r.accepted) {
    for (const n of native) assert.equal(n in rec, false, `${n} leaked into a canonical record`);
  }
});

test('ingestEodRows works directly on parsed rows (shared code path with current state)', () => {
  const s = store();
  const parsed = parseCmUdiff({ text: F[VALID], sourceRef: VALID, sourceId: 'r2-reference-file', sourceTimestamp: sourceTsFor(VALID) });
  const r = ingestEodRows({ rows: parsed.rows, lineage: lineage(), store: s, mode: 'eod', now: '2026-01-05T09:15:00Z' });
  assert.equal(r.metrics.acceptedCount, 4);
});

test('§F.39 — current-state mode applies the SAME equity filter as EOD', () => {
  const s = store();
  const parsed = parseCmUdiff({ text: F[MIXED], sourceRef: MIXED, sourceId: 'r2-reference-file', sourceTimestamp: sourceTsFor(MIXED) });
  const lin = lineage({ asOf: sourceTsFor(MIXED), ingestionTimestamp: ingestionTsFor(MIXED) });
  const r = ingestEodRows({ rows: parsed.rows, lineage: lin, store: s, mode: 'current', now: lin.ingestionTimestamp });
  assert.equal(r.metrics.acceptedCount, 2, 'debt/SGB must not enter current state either');
  assert.equal(r.metrics.rejectedCount, 3);
});
