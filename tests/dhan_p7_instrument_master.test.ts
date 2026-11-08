/**
 * DHAN-P7 instrument-master qualification — tests use bounded SYNTHETIC
 * fixtures in the REAL observed schemas (detailed: EXCH_ID,SEGMENT,SECURITY_ID,
 * ISIN,INSTRUMENT,...,SERIES; compact: SEM_EXM_EXCH_ID,SEM_SEGMENT,
 * SEM_SMST_SECURITY_ID,...,SEM_SERIES) plus the retained published snapshots
 * for hash/manifest integrity. No network, no live qualification claims.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  parseInstrumentMasterCsv,
  splitCsv,
  qualifyInstrumentMaster,
  retrieveInstrumentMaster,
  indexCompactMaster,
  compactConsistency,
  DETAILED_REQUIRED_COLUMNS,
  COMPACT_REQUIRED_COLUMNS,
  DHAN_INSTRUMENT_MASTER_DETAILED_URL,
} from '../src/providers/dhan/index.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import { buildD114SecurityIdentity } from '../src/contracts/types.js';

const DETAILED_HEADER = 'EXCH_ID,SEGMENT,SECURITY_ID,ISIN,INSTRUMENT,SERIES,SYMBOL_NAME,INSTRUMENT_TYPE';
const COMPACT_HEADER = 'SEM_EXM_EXCH_ID,SEM_SEGMENT,SEM_SMST_SECURITY_ID,SEM_SERIES,SEM_INSTRUMENT_NAME';

function drow(over: Partial<Record<string, string>> = {}): string {
  const v = {
    EXCH_ID: 'NSE', SEGMENT: 'E', SECURITY_ID: '11536', ISIN: 'INE000SYNTH1',
    INSTRUMENT: 'EQUITY', SERIES: 'EQ', SYMBOL_NAME: 'SYNTHA', INSTRUMENT_TYPE: 'EQ', ...over,
  };
  return [v.EXCH_ID, v.SEGMENT, v.SECURITY_ID, v.ISIN, v.INSTRUMENT, v.SERIES, v.SYMBOL_NAME, v.INSTRUMENT_TYPE].join(',');
}
function crow(over: Partial<Record<string, string>> = {}): string {
  const v = {
    SEM_EXM_EXCH_ID: 'NSE', SEM_SEGMENT: 'E', SEM_SMST_SECURITY_ID: '11536',
    SEM_SERIES: 'EQ', SEM_INSTRUMENT_NAME: 'EQUITY', ...over,
  };
  return [v.SEM_EXM_EXCH_ID, v.SEM_SEGMENT, v.SEM_SMST_SECURITY_ID, v.SEM_SERIES, v.SEM_INSTRUMENT_NAME].join(',');
}
const dcsv = (...r: string[]) => [DETAILED_HEADER, ...r].join('\n') + '\n';
const ccsv = (...r: string[]) => [COMPACT_HEADER, ...r].join('\n') + '\n';

function p04Master(): SecurityMaster {
  const sm = new SecurityMaster();
  sm.registerEntity({
    companyId: 'COMP-SYNTH-A', isin: 'INE000SYNTH1', companyName: 'Synth A', industry: 'T', sector: 'T',
    effectiveFrom: '2026-01-01',
    listings: [
      { exchange: 'NSE', symbol: 'SYNTHA', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
      { exchange: 'BSE', symbol: 'SYNTHA', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
    ],
  });
  sm.registerEntity({
    companyId: 'COMP-SYNTH-B', isin: 'INE000SYNTH2', companyName: 'Synth B', industry: 'T', sector: 'T',
    effectiveFrom: '2026-01-01',
    listings: [
      { exchange: 'NSE', symbol: 'SYNTHB', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
      { exchange: 'BSE', symbol: 'SYNTHB', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
    ],
  });
  return sm;
}

const SOURCE = {
  url: DHAN_INSTRUMENT_MASTER_DETAILED_URL, retrievedAtUtc: '2026-11-06T05:27:53.7922492Z',
  httpStatus: 200, contentType: 'text/csv', contentLength: 0, rawSha256: 'synthetic',
  byteSize: 0, ok: true,
};

describe('DHAN-P7 instrument-master qualification (real schemas, synthetic rows)', () => {
  it('parses the actual detailed schema (SECURITY_ID, ISIN, SERIES) from the observed header', () => {
    const parsed = parseInstrumentMasterCsv(dcsv(drow()));
    assert.strictEqual(parsed.schemaError, null);
    assert.ok((DETAILED_REQUIRED_COLUMNS as readonly string[]).includes('SECURITY_ID'));
    assert.ok(!(DETAILED_REQUIRED_COLUMNS as readonly string[]).includes('SEM_SMST_SECURITY_ID'));
    assert.strictEqual(parsed.records[0]!.values['SECURITY_ID'], '11536');
    assert.strictEqual(parsed.records[0]!.values['ISIN'], 'INE000SYNTH1');
    assert.strictEqual(parsed.records[0]!.values['SERIES'], 'EQ');
  });

  it('parses the actual compact schema (SEM_SMST_SECURITY_ID, SEM_SERIES, no ISIN)', () => {
    const parsed = parseInstrumentMasterCsv(ccsv(crow()), COMPACT_REQUIRED_COLUMNS);
    assert.strictEqual(parsed.schemaError, null);
    assert.strictEqual(parsed.records[0]!.values['SEM_SMST_SECURITY_ID'], '11536');
    assert.strictEqual(parsed.records[0]!.values['SEM_SERIES'], 'EQ');
    assert.strictEqual(parsed.records[0]!.values['ISIN'], undefined);
  });

  it('rejects a CSV missing the REAL required columns and strips a BOM', () => {
    assert.ok(parseInstrumentMasterCsv('A,B\n1,2\n').schemaError!.includes('SECURITY_ID'));
    const bom = parseInstrumentMasterCsv('\uFEFF' + dcsv(drow()));
    assert.strictEqual(bom.schemaError, null);
    assert.strictEqual(bom.headers[0], 'EXCH_ID');
  });

  it('handles quoted fields with embedded commas', () => {
    assert.deepStrictEqual(splitCsv('A,B\n"x,y",z\n')[1], ['x,y', 'z']);
  });

  it('qualifies exact records: P04 ISIN join, D114 series identity, multi-series and multi-exchange coexistence', () => {
    const text = dcsv(
      drow(),
      drow({ SECURITY_ID: '11537', SERIES: 'BE', SYMBOL_NAME: 'SYNTHA-BE' }), // second series, same ISIN
      drow({ SECURITY_ID: '500410', EXCH_ID: 'BSE', ISIN: 'INE000SYNTH2', SYMBOL_NAME: 'SYNTHB' }), // BSE listing
    );
    const { manifest, registry } = qualifyInstrumentMaster(parseInstrumentMasterCsv(text), p04Master(), SOURCE);
    assert.strictEqual(manifest.qualified, 3);
    assert.strictEqual(registry.size, 3);
    const eq = registry.resolveExactIdentity('COMP-SYNTH-A', 'NSE_EQ', buildD114SecurityIdentity('INE000SYNTH1', 'EQ')!);
    const be = registry.resolveExactIdentity('COMP-SYNTH-A', 'NSE_EQ', buildD114SecurityIdentity('INE000SYNTH1', 'BE')!);
    assert.strictEqual(eq.status, 'RESOLVED');
    assert.strictEqual(be.status, 'RESOLVED');
    if (eq.status === 'RESOLVED' && be.status === 'RESOLVED') {
      assert.strictEqual(eq.mapping.dhanSecurityId, '11536');
      assert.strictEqual(be.mapping.dhanSecurityId, '11537');
      assert.strictEqual(eq.mapping.securityId, 'ISIN:INE000SYNTH1:EQ');
      assert.strictEqual(be.mapping.securityId, 'ISIN:INE000SYNTH1:BE');
    }
    const bse = registry.resolveExactIdentity('COMP-SYNTH-B', 'BSE_EQ', buildD114SecurityIdentity('INE000SYNTH2', 'EQ')!);
    assert.strictEqual(bse.status, 'RESOLVED');
    assert.strictEqual(manifest.coverageByExchangeSeries['NSE:EQ'], 1);
    assert.strictEqual(manifest.coverageByExchangeSeries['NSE:BE'], 1);
    assert.strictEqual(manifest.coverageByExchangeSeries['BSE:EQ'], 1);
  });

  it('rejects with reason codes: non-equity, invalid fields, duplicates, conflicts, unknown P04 ISIN', () => {
    const text = dcsv(
      drow({ SEGMENT: 'D', INSTRUMENT: 'FUTIDX' }),
      drow({ SECURITY_ID: '1', ISIN: 'SHORT' }),
      drow({ SECURITY_ID: '2', SERIES: '' }),
      drow({ SECURITY_ID: '', ISIN: 'INE000SYNTH1' }),
      drow({ SECURITY_ID: '3', ISIN: 'INE999UNKNWN' }),
      drow(),
      drow(), // duplicate
      drow({ SECURITY_ID: '9999' }), // conflicting provider id for same identity
    );
    const { manifest, registry } = qualifyInstrumentMaster(parseInstrumentMasterCsv(text), p04Master(), SOURCE);
    assert.strictEqual(manifest.counts.REJECTED_NOT_EQUITY, 1);
    assert.strictEqual(manifest.counts.REJECTED_INVALID_FIELD, 3);
    assert.strictEqual(manifest.counts.REJECTED_NO_P04_CORRESPONDENCE, 1);
    assert.strictEqual(manifest.counts.QUALIFIED, 1);
    assert.strictEqual(manifest.counts.DUPLICATE_IDENTITY, 1);
    assert.strictEqual(manifest.counts.CONFLICTING_PROVIDER_ID, 1);
    assert.strictEqual(registry.size, 1);
    for (const r of manifest.records) if (r.disposition !== 'QUALIFIED') assert.ok(r.reason.length > 0);
  });

  it('detailed/compact reconciliation by exchange+segment+securityId scope', () => {
    const compact = indexCompactMaster(parseInstrumentMasterCsv(ccsv(
      crow(),
      crow({ SEM_SMST_SECURITY_ID: '11537', SEM_SERIES: 'BE' }),
      crow({ SEM_EXM_EXCH_ID: 'BSE', SEM_SMST_SECURITY_ID: '500410', SEM_SERIES: 'EQ' }),
    ), COMPACT_REQUIRED_COLUMNS));
    assert.strictEqual(compactConsistency(compact, 'NSE', 'E', '11536', 'EQ'), 'CONSISTENT');
    assert.strictEqual(compactConsistency(compact, 'NSE', 'E', '11536', 'BE'), 'SERIES_MISMATCH');
    assert.strictEqual(compactConsistency(compact, 'NSE', 'E', '99999', 'EQ'), 'MISSING_IN_COMPACT');
    // Same security id on another segment is a different provider identity (no global uniqueness).
    assert.strictEqual(compactConsistency(compact, 'BSE', 'E', '11536', 'EQ'), 'MISSING_IN_COMPACT');
  });

  it('is deterministic for a fixed snapshot and preserves P6 exact-resolver semantics', () => {
    const text = dcsv(drow(), drow({ SECURITY_ID: '11537', SERIES: 'BE' }));
    const a = qualifyInstrumentMaster(parseInstrumentMasterCsv(text), p04Master(), SOURCE);
    const b = qualifyInstrumentMaster(parseInstrumentMasterCsv(text), p04Master(), SOURCE);
    assert.deepStrictEqual(a.manifest.records, b.manifest.records);
    assert.deepStrictEqual(a.manifest.registryEntries, b.manifest.registryEntries);
    assert.strictEqual(a.registry.resolveSecurity('COMP-SYNTH-A', 'NSE_EQ', 'INE000SYNTH1').status, 'UNRESOLVED'); // ambiguous across series
  });

  it('retrieval evidence: HTTP metadata + hash on success; failure captured, never thrown', async () => {
    const okFetch = async () => new Response('EXCH_ID\nNSE\n', { status: 200, headers: { 'content-type': 'text/csv' } });
    const snap = await retrieveInstrumentMaster(DHAN_INSTRUMENT_MASTER_DETAILED_URL, okFetch);
    assert.strictEqual(snap.evidence.ok, true);
    assert.strictEqual(snap.evidence.rawSha256, createHash('sha256').update(snap.body, 'utf8').digest('hex'));
    const fail = await retrieveInstrumentMaster(DHAN_INSTRUMENT_MASTER_DETAILED_URL, (async () => { throw new Error('blocked'); }) as typeof fetch);
    assert.strictEqual(fail.evidence.ok, false);
    assert.strictEqual(fail.evidence.rawSha256, null);
  });

  it('published source snapshots match the recorded manifest hashes (integrity)', () => {
    const dir = resolve(process.cwd(), 'evidence/dhan-p7');
    const manifest = JSON.parse(readFileSync(resolve(dir, 'source-retrieval-manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
    for (const f of manifest.files) {
      const bytes = readFileSync(resolve(dir, 'source', f.filename));
      assert.strictEqual(createHash('sha256').update(bytes).digest('hex').toUpperCase(), f.sha256.toUpperCase(), f.filename);
      assert.strictEqual(bytes.length, f.sizeBytes);
      assert.ok(existsSync(resolve(dir, 'qualification-manifest.json')));
    }
    const qual = JSON.parse(readFileSync(resolve(dir, 'qualification-manifest.json'), 'utf8'));
    assert.strictEqual(qual.totals.detailedRows, 217104);
    assert.ok(qual.totals.qualified > 0, 'exact P04-qualified mappings were populated');
    assert.strictEqual(qual.totals.qualified, qual.totals.registrySize);
  });
});
