/**
 * DHAN-P7 instrument-master qualification (bounded SYNTHETIC fixture derived
 * from the documented official schema — NOT a live download, NOT live
 * qualification). Tests use a fixed in-test snapshot so they never depend on
 * the network.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { createHash } from 'node:crypto';

import {
  parseInstrumentMasterCsv,
  splitCsv,
  qualifyInstrumentMaster,
  retrieveInstrumentMaster,
  DHAN_INSTRUMENT_MASTER_DETAILED_URL,
} from '../src/providers/dhan/index.js';
import { DhanInstrumentRegistry } from '../src/providers/dhan/dhan_instrument_map.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';

const HEADER = 'EXCH_ID,SEGMENT,SEM_SMST_SECURITY_ID,ISIN,INSTRUMENT,SERIES,SYMBOL_NAME,INSTRUMENT_TYPE';

function row(over: Partial<Record<string, string>> = {}): string {
  const v = {
    EXCH_ID: 'NSE',
    SEGMENT: 'E',
    SEM_SMST_SECURITY_ID: 'SYNTH-NSE-EQ-1001',
    ISIN: 'INE000SYNTH1',
    INSTRUMENT: 'EQUITY',
    SERIES: 'EQ',
    SYMBOL_NAME: 'SYNTHA',
    INSTRUMENT_TYPE: 'EQ',
    ...over,
  };
  return [v.EXCH_ID, v.SEGMENT, v.SEM_SMST_SECURITY_ID, v.ISIN, v.INSTRUMENT, v.SERIES, v.SYMBOL_NAME, v.INSTRUMENT_TYPE].join(',');
}

function csv(...rows: string[]): string {
  return [HEADER, ...rows].join('\n') + '\n';
}

function p04Master(): SecurityMaster {
  const sm = new SecurityMaster();
  sm.registerEntity({
    companyId: 'COMP-SYNTH-A',
    isin: 'INE000SYNTH1',
    companyName: 'Synth A',
    industry: 'T',
    sector: 'T',
    effectiveFrom: '2026-01-01',
    listings: [
      { exchange: 'NSE', symbol: 'SYNTHA', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
      { exchange: 'BSE', symbol: 'SYNTHA', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
    ],
  });
  sm.registerEntity({
    companyId: 'COMP-SYNTH-B',
    isin: 'INE000SYNTH2',
    companyName: 'Synth B',
    industry: 'T',
    sector: 'T',
    effectiveFrom: '2026-01-01',
    listings: [
      { exchange: 'NSE', symbol: 'SYNTHB', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
      { exchange: 'BSE', symbol: 'SYNTHB', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
    ],
  });
  return sm;
}

const SOURCE = {
  url: DHAN_INSTRUMENT_MASTER_DETAILED_URL,
  retrievedAtUtc: '2026-11-06T00:00:00.000Z',
  httpStatus: 200,
  contentType: 'text/csv',
  contentLength: 0,
  rawSha256: 'synthetic',
  byteSize: 0,
  ok: true,
};

describe('DHAN-P7 instrument-master qualification (synthetic fixture)', () => {
  it('parses the documented detailed schema from the observed header row', () => {
    const parsed = parseInstrumentMasterCsv(csv(row()));
    assert.strictEqual(parsed.schemaError, null);
    assert.ok(parsed.headers.includes('SEM_SMST_SECURITY_ID'));
    assert.ok(parsed.headers.includes('ISIN'));
    assert.ok(parsed.headers.includes('SERIES'));
    assert.strictEqual(parsed.records.length, 1);
    assert.strictEqual(parsed.records[0]!.values['SEM_SMST_SECURITY_ID'], 'SYNTH-NSE-EQ-1001');
  });

  it('rejects a CSV missing required columns instead of assuming positions', () => {
    const parsed = parseInstrumentMasterCsv('A,B,C\n1,2,3\n');
    assert.ok(parsed.schemaError && parsed.schemaError.includes('ISIN'));
    assert.strictEqual(parsed.records.length, 0);
  });

  it('handles quoted fields with embedded commas', () => {
    const rows = splitCsv('A,B\n"x,y",z\n');
    assert.deepStrictEqual(rows[1], ['x,y', 'z']);
  });

  it('qualifies exact records: P04 ISIN join, D114 identity, registry population', () => {
    const text = csv(
      row(),
      row({ SEM_SMST_SECURITY_ID: 'SYNTH-NSE-EQ-1009', SERIES: 'BE', SYMBOL_NAME: 'SYNTHA-BE' }), // second series, same ISIN
      row({ SEM_SMST_SECURITY_ID: 'SYNTH-BSE-EQ-2001', EXCH_ID: 'BSE', ISIN: 'INE000SYNTH2', SYMBOL_NAME: 'SYNTHB' }), // BSE listing
    );
    const { manifest, registry } = qualifyInstrumentMaster(parseInstrumentMasterCsv(text), p04Master(), SOURCE);
    assert.strictEqual(manifest.qualified, 3);
    assert.strictEqual(manifest.counts.QUALIFIED, 3);
    assert.strictEqual(registry.size, 3);
    // Multiple series of the same company+ISIN coexist and resolve exactly.
    const eq = registry.resolveExactIdentity('COMP-SYNTH-A', 'NSE_EQ', buildD114SecurityIdentity('INE000SYNTH1', 'EQ')!);
    const be = registry.resolveExactIdentity('COMP-SYNTH-A', 'NSE_EQ', buildD114SecurityIdentity('INE000SYNTH1', 'BE')!);
    assert.strictEqual(eq.status, 'RESOLVED');
    assert.strictEqual(be.status, 'RESOLVED');
    if (eq.status === 'RESOLVED' && be.status === 'RESOLVED') {
      assert.strictEqual(eq.mapping.dhanSecurityId, 'SYNTH-NSE-EQ-1001');
      assert.strictEqual(be.mapping.dhanSecurityId, 'SYNTH-NSE-EQ-1009');
      assert.notStrictEqual(eq.mapping.securityId, be.mapping.securityId);
    }
    // BSE listing distinct from NSE.
    const bse = registry.resolveExactIdentity('COMP-SYNTH-B', 'BSE_EQ', buildD114SecurityIdentity('INE000SYNTH2', 'EQ')!);
    assert.strictEqual(bse.status, 'RESOLVED');
    assert.strictEqual(manifest.coverageByExchangeSeries['NSE:EQ'], 1);
    assert.strictEqual(manifest.coverageByExchangeSeries['NSE:BE'], 1);
    assert.strictEqual(manifest.coverageByExchangeSeries['BSE:EQ'], 1);
  });

  it('rejects non-equity, invalid fields, duplicates, conflicts and unknown P04 correspondence', () => {
    const text = csv(
      row({ SEGMENT: 'D', INSTRUMENT: 'FUTIDX' }), // not equity
      row({ SEM_SMST_SECURITY_ID: 'SYNTH-NSE-EQ-1002', ISIN: 'SHORT' }), // invalid ISIN
      row({ SEM_SMST_SECURITY_ID: 'SYNTH-NSE-EQ-1003', SERIES: '' }), // missing series
      row({ SEM_SMST_SECURITY_ID: '', ISIN: 'INE000SYNTH1' }), // missing security id
      row({ ISIN: 'INE999UNKNWN' }), // no P04 correspondence
      row(), // qualified
      row(), // exact duplicate
      row({ SEM_SMST_SECURITY_ID: 'SYNTH-NSE-EQ-7777' }), // conflicting provider id for same identity
    );
    const { manifest, registry } = qualifyInstrumentMaster(parseInstrumentMasterCsv(text), p04Master(), SOURCE);
    assert.strictEqual(manifest.counts.REJECTED_NOT_EQUITY, 1);
    assert.strictEqual(manifest.counts.REJECTED_INVALID_FIELD, 3);
    assert.strictEqual(manifest.counts.REJECTED_NO_P04_CORRESPONDENCE, 1);
    assert.strictEqual(manifest.counts.QUALIFIED, 1);
    assert.strictEqual(manifest.counts.DUPLICATE_IDENTITY, 1);
    assert.strictEqual(manifest.counts.CONFLICTING_PROVIDER_ID, 1);
    assert.strictEqual(registry.size, 1, 'rejected records never enter the qualified registry');
    // Rejected records carry explicit reasons in the evidence manifest.
    for (const r of manifest.records) {
      if (r.disposition !== 'QUALIFIED') assert.ok(r.reason.length > 0);
    }
  });

  it('is deterministic for a fixed snapshot and keeps P6 exact resolver semantics', () => {
    const text = csv(row(), row({ SEM_SMST_SECURITY_ID: 'SYNTH-NSE-EQ-1009', SERIES: 'BE' }));
    const a = qualifyInstrumentMaster(parseInstrumentMasterCsv(text), p04Master(), SOURCE);
    const b = qualifyInstrumentMaster(parseInstrumentMasterCsv(text), p04Master(), SOURCE);
    assert.deepStrictEqual(a.manifest.records, b.manifest.records);
    assert.deepStrictEqual(a.manifest.registryEntries, b.manifest.registryEntries);
    // ISIN-only resolution is ambiguous across series (P6 semantics preserved).
    const amb = a.registry.resolveSecurity('COMP-SYNTH-A', 'NSE_EQ', 'INE000SYNTH1');
    assert.strictEqual(amb.status, 'UNRESOLVED');
  });

  it('retrieval evidence records HTTP metadata and hash for a successful fetch', async () => {
    const fakeFetch = async () =>
      new Response('EXCH_ID,SEGMENT\nNSE,E\n', {
        status: 200,
        headers: { 'content-type': 'text/csv', 'content-length': '22' },
      });
    const snap = await retrieveInstrumentMaster(DHAN_INSTRUMENT_MASTER_DETAILED_URL, fakeFetch as typeof fetch);
    assert.strictEqual(snap.evidence.ok, true);
    assert.strictEqual(snap.evidence.httpStatus, 200);
    assert.strictEqual(snap.evidence.rawSha256, createHash('sha256').update(snap.body, 'utf8').digest('hex'));
    assert.match(snap.evidence.retrievedAtUtc, /^\d{4}-\d{2}-\d{2}T/);
  });

  it('retrieval failure is captured as evidence, never thrown', async () => {
    const failing = async () => {
      throw new Error('network blocked by sandbox allowlist');
    };
    const snap = await retrieveInstrumentMaster(DHAN_INSTRUMENT_MASTER_DETAILED_URL, failing as typeof fetch);
    assert.strictEqual(snap.evidence.ok, false);
    assert.strictEqual(snap.evidence.httpStatus, null);
    assert.strictEqual(snap.evidence.rawSha256, null);
    assert.match(snap.evidence.error ?? '', /network blocked/);
  });
});
