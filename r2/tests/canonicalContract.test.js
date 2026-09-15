/**
 * R-2 tests — CANONICAL MARKET-DATA CONTRACT (§H, §N "canonical contract")
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSnapshotId, FIELDS, FIELD_NAMES, freezeRecord, PROVIDER_NATIVE_FIELDS,
  SCHEMA_DESCRIPTOR, SCHEMA_ID, SCHEMA_VERSION, validateRecord,
} from '../src/canonicalContract.js';

/** A fully valid canonical record, used as the base for negative cases. */
export function validRecord(overrides = {}) {
  return {
    tradeDate: '2026-01-02',
    exchange: 'NSE',
    isin: 'INE000A01001',
    symbol: 'SYNTHALPHA',
    securityName: 'SYNTHETIC EQUITY ALPHA LTD',
    series: 'EQ',
    open: 1005.5, high: 1020.75, low: 998.1, close: 1015, lastPrice: 1015, previousClose: 1000,
    volume: 250000, tradedValue: 253750000, transactionCount: 12500,
    sourceId: 'r2-reference-file',
    sourceRef: 'BhavCopy_NSE_CM_0_0_0_20260102_F_0000.csv',
    sourceTimestamp: '2026-01-02T16:30:00Z',
    ingestionTimestamp: '2026-01-05T09:15:00Z',
    provider: 'r2-reference-file',
    dataVersion: 'test-v1',
    asOf: '2026-01-02T16:30:00Z',
    snapshotId: 'data-r2-reference-file-test-v1-2026-01-02T16:30:00Z',
    priceCurrency: 'INR',
    freshness: { status: 'CURRENT', isCurrent: true },
    ...overrides,
  };
}

test('§H — every required contract field is present in the dictionary', () => {
  const required = ['tradeDate', 'exchange', 'isin', 'symbol', 'series', 'close',
    'sourceId', 'sourceRef', 'sourceTimestamp', 'ingestionTimestamp',
    'provider', 'dataVersion', 'asOf', 'snapshotId'];
  for (const f of required) {
    assert.ok(FIELD_NAMES.includes(f), `${f} must be a canonical field`);
    assert.equal(FIELDS[f].required, true, `${f} must be REQUIRED`);
  }
});

test('§H — optional fields are optional, and include the §H "where available" ones', () => {
  for (const f of ['securityName', 'open', 'high', 'low', 'lastPrice', 'previousClose',
    'volume', 'tradedValue', 'transactionCount', 'freshness']) {
    assert.equal(FIELDS[f].required, false, `${f} must be optional`);
  }
});

test('contract — a complete record validates', () => {
  const r = validateRecord(validRecord());
  assert.equal(r.valid, true, r.errors.join('; '));
});

test('contract — a missing REQUIRED field is reported, not defaulted', () => {
  const r = validateRecord(validRecord({ isin: null }));
  assert.equal(r.valid, false);
  assert.ok(r.errors.some((e) => e.startsWith('isin:')));
});

test('P01 NL-7 — absence never becomes 0, "" or false (optional numeric stays absent)', () => {
  const r = validateRecord(validRecord({ transactionCount: null }));
  assert.equal(r.valid, true, 'an absent optional field must not fail validation');
  const rec = validRecord({ transactionCount: null });
  assert.equal(rec.transactionCount, null);
});

test('contract — a malformed ISIN is rejected', () => {
  assert.equal(validateRecord(validRecord({ isin: 'NOTANISIN' })).valid, false);
  assert.equal(validateRecord(validRecord({ isin: 'INE000A0100X' })).valid, false, 'bad check digit shape');
});

test('contract — a non-finite numeric is rejected', () => {
  assert.equal(validateRecord(validRecord({ close: Number.NaN })).valid, false);
  assert.equal(validateRecord(validRecord({ high: Infinity })).valid, false);
});

test('contract — a non-NSE exchange is rejected (R-2 §A.1 NSE only)', () => {
  assert.equal(validateRecord(validRecord({ exchange: 'BSE' })).valid, false);
});

test('contract — a non-UTC timestamp is rejected', () => {
  assert.equal(validateRecord(validRecord({ asOf: '2026-01-02T16:30:00+05:30' })).valid, false);
});

test('AD-6 — snapshotId uses the FROZEN format data-${provider}-${dataVersion}-${asOf}', () => {
  const id = buildSnapshotId({ provider: 'p', dataVersion: 'v9', asOf: '2026-01-02T16:30:00Z' });
  assert.equal(id, 'data-p-v9-2026-01-02T16:30:00Z');
});

test('AD-6 — snapshotId cannot be built without full lineage (P01 INV-5)', () => {
  assert.throws(() => buildSnapshotId({ provider: 'p', dataVersion: '', asOf: 'x' }), /INV-5/);
});

test('INV-2 — freezeRecord produces an immutable record', () => {
  const frozen = freezeRecord(validRecord());
  assert.throws(() => { frozen.close = 1; }, TypeError);
  assert.equal(frozen.schemaId, SCHEMA_ID);
  assert.equal(frozen.schemaVersion, SCHEMA_VERSION);
});

test('INV-10 / NFR-06 — a provider-native field cannot enter the canonical contract', () => {
  assert.throws(() => freezeRecord({ ...validRecord(), TckrSymb: 'LEAKED' }), /INV-10/);
  assert.throws(() => freezeRecord({ ...validRecord(), ClsPric: 1 }), /INV-10/);
});

test('contract — an unknown field is refused rather than silently carried', () => {
  assert.throws(() => freezeRecord({ ...validRecord(), somethingElse: 1 }), /not a member of/);
});

test('§H — the contract is documented and versionable via SCHEMA_DESCRIPTOR', () => {
  assert.equal(SCHEMA_DESCRIPTOR.schemaId, 'r2.equity.daily');
  assert.equal(SCHEMA_DESCRIPTOR.schemaVersion, '1.0.0');
  assert.equal(SCHEMA_DESCRIPTOR.fieldCount, FIELD_NAMES.length);
  assert.ok(SCHEMA_DESCRIPTOR.requiredFields.includes('isin'));
  assert.ok(SCHEMA_DESCRIPTOR.optionalFields.includes('transactionCount'));
  assert.equal(SCHEMA_DESCRIPTOR.lineageAuthority.includes('AD-6'), true);
});

test('§P.82 — the provider-native field list is exported for leakage assertions', () => {
  assert.ok(PROVIDER_NATIVE_FIELDS.includes('TckrSymb'));
  assert.ok(PROVIDER_NATIVE_FIELDS.includes('ClsPric'));
  assert.ok(PROVIDER_NATIVE_FIELDS.includes('TradDt'));
});
