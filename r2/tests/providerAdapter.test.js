/**
 * R-2 tests — PROVIDER/ADAPTER CONTRACT COMPLIANCE + STORAGE PORT
 * (§N "provider-adapter contract compliance")
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertAdapterShape, assertMechanismPermitted, bindAdapter, CAPABILITY, describeGate,
  PROHIBITED_ACQUISITION, requireCapability,
} from '../src/providerAdapter.js';
import { assertStoreShape, createInMemoryStore } from '../src/storagePort.js';
import { canonicalRecordKey } from '../src/normalization.js';
import { E } from '../src/errorTaxonomy.js';
import { adapter } from './helpers.js';
import { validRecord } from './canonicalContract.test.js';

// ── adapter port ─────────────────────────────────────────────────────────────────────────────

test('the reference adapter satisfies the provider port', () => {
  assert.equal(assertAdapterShape(adapter()), true);
});

test('§B — an adapter missing a required member is refused at bind time', () => {
  assert.throws(() => assertAdapterShape({ id: 'x' }), /does not satisfy the provider port/);
  assert.throws(() => assertAdapterShape({ id: 'x', describe() {}, fetchEodDaily() {}, capabilities: [] }),
    /fetchCurrentState/);
});

test('§B — an adapter with no id is refused', () => {
  assert.throws(() => assertAdapterShape({ describe() {}, fetchEodDaily() {}, fetchCurrentState() {}, capabilities: [] }), /adapter\.id/);
});

test('§B — an unknown capability declaration is refused', () => {
  assert.throws(() => assertAdapterShape({
    id: 'x', describe() {}, fetchEodDaily() {}, fetchCurrentState() {}, capabilities: ['magicFeed'],
  }), /unknown capabilities/);
});

test('§B / P02 E6 — an undeclared capability fails PRE-FLIGHT, before any provider call', () => {
  const a = { ...adapter(), capabilities: [CAPABILITY.EOD_DAILY] };
  const r = requireCapability(a, CAPABILITY.CURRENT_STATE);
  assert.equal(r.ok, false);
  assert.equal(r.error.code, E.E6);
  assert.match(r.error.reason, /pre-flight, no provider call made/);
});

test('§B — a declared capability passes pre-flight', () => {
  assert.equal(requireCapability(adapter(), CAPABILITY.CURRENT_STATE).ok, true);
});

test('P02 E6 — an unknown capability name is refused', () => {
  assert.equal(requireCapability(adapter(), 'notACapability').error.code, E.E6);
});

test('§E.27 / §L.66 — the external gate is reported as data, with the exact missing items', () => {
  const g = describeGate(adapter());
  assert.equal(g.open, true);
  assert.deepEqual(g.satisfied, []);
  for (const item of ['acquisitionMechanismAuthorized', 'credentialsAvailable', 'licensingInPlace',
    'exchangeEntitlementsGranted', 'providerAgreementExecuted', 'productionAccessValidated']) {
    assert.ok(g.outstanding.includes(item), `${item} must be reported as outstanding`);
  }
});

test('§L.66 — a fully provisioned gate reports closed', () => {
  const g = describeGate({
    gate: {
      acquisitionMechanismAuthorized: true, credentialsAvailable: true, licensingInPlace: true,
      exchangeEntitlementsGranted: true, providerAgreementExecuted: true, productionAccessValidated: true,
    },
  });
  assert.equal(g.open, false);
  assert.deepEqual(g.outstanding, []);
});

test('§L.67 — prohibited acquisition mechanisms are refused', () => {
  for (const mech of PROHIBITED_ACQUISITION) {
    assert.throws(() => assertMechanismPermitted({ mechanism: mech }), /§L\.67/, `${mech} must be refused`);
  }
});

test('§L.67 — a permitted mechanism binds', () => {
  assert.equal(assertMechanismPermitted({ mechanism: 'reference-file' }), true);
  assert.equal(assertMechanismPermitted({ mechanism: 'authorised-nse-feed' }), true);
});

test('§B — the reference adapter declares itself synthetic and not an NSE mechanism', () => {
  const d = adapter().describe();
  assert.equal(d.synthetic, true);
  assert.match(d.note, /NOT an authorised NSE acquisition mechanism/);
});

// ── storage port ─────────────────────────────────────────────────────────────────────────────

test('the in-memory reference store satisfies the storage port', () => {
  assert.equal(assertStoreShape(createInMemoryStore()), true);
});

test('§D.23 — the reference store is explicitly labelled NON-durable', () => {
  const s = createInMemoryStore();
  assert.equal(s.durable, false);
  assert.equal(s.kind, 'in-memory-reference');
});

test('§D — an incomplete store implementation is refused', () => {
  assert.throws(() => assertStoreShape({ putDaily() {} }), /missing: putDailyBatch/);
});

test('§F.43 — putDaily is idempotent: same content twice ⇒ inserted then unchanged', () => {
  const s = createInMemoryStore();
  const rec = validRecord();
  assert.equal(s.putDaily(rec).status, 'inserted');
  assert.equal(s.putDaily(rec).status, 'unchanged');
  assert.equal(s.dailyCount(), 1);
});

test('§F.43 — a restatement at a new dataVersion updates the same key, adding no row', () => {
  const s = createInMemoryStore();
  s.putDaily(validRecord({ dataVersion: 'v1' }));
  assert.equal(s.putDaily(validRecord({ dataVersion: 'v2' })).status, 'updated');
  assert.equal(s.dailyCount(), 1);
});

test('§F.43 — putDailyBatch aggregates statuses', () => {
  const s = createInMemoryStore();
  const r = s.putDailyBatch([validRecord(), validRecord(), validRecord({ isin: 'INE000B01002' })]);
  assert.equal(r.inserted, 2);
  assert.equal(r.unchanged, 1);
  assert.equal(s.dailyCount(), 2);
});

test('§E.30 — putCurrent replaces; getCurrent is a single record, never a list', () => {
  const s = createInMemoryStore();
  s.putCurrent({ asOf: '2026-01-02T16:30:00Z', dataVersion: 'v1' });
  s.putCurrent({ asOf: '2026-01-02T16:45:00Z', dataVersion: 'v2' });
  const c = s.getCurrent();
  assert.equal(Array.isArray(c), false);
  assert.equal(c.dataVersion, 'v2');
});

test('§J — a repeated source file is reported as a duplicate, not re-applied', () => {
  const s = createInMemoryStore();
  assert.equal(s.recordSourceFile('a.csv').status, 'recorded');
  assert.equal(s.recordSourceFile('a.csv').status, 'duplicate');
  assert.equal(s.recordSourceFile('b.csv').status, 'recorded');
});

test('§J — quarantined records are retrievable with their reason', () => {
  const s = createInMemoryStore();
  s.quarantine(validRecord(), 'test reason');
  const q = s.quarantined();
  assert.equal(q.length, 1);
  assert.equal(q[0].reason, 'test reason');
});

test('range query honours from/to inclusively', () => {
  const s = createInMemoryStore();
  s.putDaily(validRecord({ tradeDate: '2026-01-01' }));
  s.putDaily(validRecord({ tradeDate: '2026-01-02', isin: 'INE000B01002' }));
  s.putDaily(validRecord({ tradeDate: '2026-01-03', isin: 'INE000C01003' }));
  assert.equal(s.queryDailyRange({ from: '2026-01-01', to: '2026-01-02' }).length, 2);
  assert.equal(s.queryDailyRange({ from: '2026-01-02', to: '2026-01-03' }).length, 2);
});

test('§A.10 — an audit trail accumulates even though snapshots do not', () => {
  const s = createInMemoryStore();
  s.putCurrent({ asOf: 'a', dataVersion: 'v1' });
  s.putCurrent({ asOf: 'b', dataVersion: 'v2' });
  s.putCurrent({ asOf: 'b', dataVersion: 'v2' });
  assert.equal(s.dailyCount(), 0);
  assert.ok(s._auditTrail().length >= 3);
});

test('the canonical key function agrees with the store key semantics', () => {
  assert.equal(canonicalRecordKey(validRecord()), 'NSE|INE000A01001|2026-01-02');
});
