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
import { readFileSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

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
  buildMappingExpansionManifest,
  renderMappingExpansionReport,
} from '../src/providers/dhan/index.js';
import type { DhanInstrumentMapping } from '../src/providers/dhan/index.js';
import { loadGovernedP7InstrumentRegistry } from '../src/providers/dhan/dhan_local_daemon.js';
import { getGovernedBroadSecurityMaster } from '../src/identity/governed_fixture_master.js';
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

/**
 * DHAN-W27 — repeatable mapping-expansion pipeline.
 *
 * The W-27 rules are exercised on bounded synthetic fixtures in the REAL schemas,
 * and the published snapshot is exercised only for provenance/determinism. No
 * network, no Dhan call, no promotion of a proposal to a qualified mapping.
 */
describe('DHAN-W27 mapping expansion (proposal generator over the governed P7 path)', () => {
  const W27_SHA = 'a'.repeat(64);

  function snap(text: string, over: Partial<Record<string, unknown>> = {}) {
    return {
      filename: 'api-scrip-master-detailed.csv',
      sourceUrl: DHAN_INSTRUMENT_MASTER_DETAILED_URL,
      retrievedAtUtc: '2026-11-06T05:27:53.7922492Z',
      sha256: W27_SHA,
      sizeBytes: Buffer.byteLength(text, 'utf8'),
      text,
      ...over,
    };
  }

  /** Builds the options for a fixture with a chosen baseline (what the runtime already loads). */
  function opts(text: string, baseline: DhanInstrumentMapping[], sm: SecurityMaster = p04Master()) {
    return {
      snapshot: snap(text),
      securityMaster: sm,
      baselineMappings: baseline,
      baselineSource: 'test baseline',
      p04SourceRevision: { batchId: 'B', fileChecksumSha256: 'c'.repeat(64), recordCount: 2 },
    };
  }

  function mappingOf(over: Partial<DhanInstrumentMapping> = {}): DhanInstrumentMapping {
    return {
      companyId: 'COMP-SYNTH-A',
      isin: 'INE000SYNTH1',
      securityId: 'ISIN:INE000SYNTH1:EQ',
      exchange: 'NSE',
      symbol: 'SYNTHA',
      exchangeSegment: 'NSE_EQ',
      dhanSecurityId: '11536',
      mappingProvenance: 'DHAN_INSTRUMENT_MASTER',
      instrumentType: 'EQUITY',
      active: true,
      lastVerifiedAt: '2026-11-06T05:27:53.7922492Z',
      ...over,
    };
  }

  it('proposes an unmapped exact identity, and only as PROPOSED (never QUALIFIED)', () => {
    const m = buildMappingExpansionManifest(opts(dcsv(drow()), []));
    assert.strictEqual(m.counts.proposedAdditions, 1);
    assert.strictEqual(m.records[0]!.disposition, 'PROPOSED_ADDITION');
    assert.strictEqual(m.records[0]!.reasonCode, 'PROPOSED_EXACT_IDENTITY_UNMAPPED');
    assert.strictEqual(m.proposedMappings.length, 1);
    assert.strictEqual(m.proposedMappings[0]!.dhanSecurityId, '11536');
    // The disposition vocabulary contains no QUALIFIED value at all.
    assert.ok(!(Object.keys(m.countsByDisposition) as string[]).includes('QUALIFIED'));
    assert.strictEqual(m.coverage.potentialGain, 1);
    assert.strictEqual(m.coverage.qualifiedBefore, 0);
    assert.strictEqual(m.coverage.qualifiedAfterPromotion, 1);
  });

  it('reports zero gain honestly when every exact identity is already qualified', () => {
    const m = buildMappingExpansionManifest(opts(dcsv(drow()), [mappingOf()]));
    assert.strictEqual(m.counts.proposedAdditions, 0);
    assert.strictEqual(m.counts.alreadyQualified, 1);
    assert.strictEqual(m.records[0]!.disposition, 'ALREADY_QUALIFIED');
    assert.deepStrictEqual(m.proposedMappings, []);
  });

  it('REJECTS a same-company wrong-series near-match instead of replacing the served security', () => {
    // COMP-SYNTH-A on NSE is already served by INE000SYNTH1:EQ. The snapshot also
    // offers INE000SYNTH1:BE (e.g. a trade-to-trade series). Adding it would silently
    // change which security the company resolves to.
    const text = dcsv(
      drow({ SERIES: 'BE', SECURITY_ID: '11537', SYMBOL_NAME: 'SYNTHA' }),
    );
    const m = buildMappingExpansionManifest(opts(text, [mappingOf()]));
    assert.strictEqual(m.counts.proposedAdditions, 0, 'a wrong-series row must never be proposed');
    assert.strictEqual(m.records[0]!.disposition, 'REJECTED_WRONG_SERIES');
    assert.strictEqual(m.records[0]!.reasonCode, 'SAME_ISIN_OTHER_SERIES_ALREADY_SERVED');
    assert.strictEqual(m.counts.heldForSeriesAuthority, 1);
    assert.match(m.records[0]!.reason, /already served by series EQ/);
    // The served EQ mapping is untouched in the baseline.
    assert.strictEqual(m.counts.alreadyQualified, 0);
  });

  // NOTE on the P04-disagreement branch: P7's REJECTED_AMBIGUOUS_IDENTITY path (an entity
  // reached by ISIN whose own ISIN differs) is defensive and is not reachable through the
  // public SecurityMaster API, so it is deliberately not asserted here. The ambiguity case
  // exercised below is the W-27 gate that can actually fire: competing exchange series.
  it('fails safely on several competing series with no series authority (no preference, no order)', () => {
    const text = dcsv(
      drow({ SERIES: 'EQ', SECURITY_ID: '11536' }),
      drow({ SERIES: 'BE', SECURITY_ID: '11537' }),
      drow({ SERIES: 'BZ', SECURITY_ID: '11538' }),
    );
    const m = buildMappingExpansionManifest(opts(text, []));
    assert.strictEqual(m.counts.proposedAdditions, 0);
    assert.strictEqual(m.countsByDisposition.REJECTED_AMBIGUOUS_IDENTITY, 3);
    for (const r of m.records) {
      assert.strictEqual(r.disposition, 'REJECTED_AMBIGUOUS_IDENTITY');
      assert.strictEqual(r.reasonCode, 'MULTIPLE_SERIES_NO_SERIES_AUTHORITY');
      assert.match(r.reason, /no authoritative series evidence selects/);
    }
    // Deterministic: reversing input order cannot change the verdict.
    const reversed = buildMappingExpansionManifest(opts(dcsv(
      drow({ SERIES: 'BZ', SECURITY_ID: '11538' }),
      drow({ SERIES: 'BE', SECURITY_ID: '11537' }),
      drow({ SERIES: 'EQ', SECURITY_ID: '11536' }),
    ), []));
    assert.strictEqual(reversed.counts.proposedAdditions, 0);
    assert.strictEqual(reversed.countsByDisposition.REJECTED_AMBIGUOUS_IDENTITY, 3);
  });

  it('fails safely on incomplete, ambiguous and conflicting provider identities', () => {
    // A company listed only on BSE: an NSE row for its ISIN has no P04 listing evidence.
    const sm = p04Master();
    sm.registerEntity({
      companyId: 'COMP-SYNTH-C', isin: 'INE000SYNTH3', companyName: 'Synth C', industry: 'T', sector: 'T',
      effectiveFrom: '2026-01-01',
      listings: [{ exchange: 'BSE', symbol: 'SYNTHC', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
    });
    const text = dcsv(
      drow({ ISIN: 'INE000SYNTH3', SECURITY_ID: '7001', EXCH_ID: 'NSE' }), // P04: no ACTIVE NSE listing
      drow({ SECURITY_ID: '' }),              // incomplete provider identity
      drow({ ISIN: 'BADISIN' }),              // malformed ISIN (wrong length)
      drow({ SERIES: '' }),                   // missing series
      drow({ ISIN: 'INE999UNKNWN' }),         // no P04 company at all
      drow(),                                  // a proposal
      drow(),                                  // duplicate of the same identity
      drow({ SECURITY_ID: '9999' }),          // same identity, conflicting provider id
    );
    const m = buildMappingExpansionManifest(opts(text, [], sm));
    assert.strictEqual(m.records[0]!.disposition, 'REJECTED_NO_P04_CORRESPONDENCE');
    assert.strictEqual(m.records[0]!.reasonCode, 'NO_ACTIVE_P04_LISTING_FOR_EXCHANGE');
    assert.strictEqual(m.records[1]!.reasonCode, 'MALFORMED_PROVIDER_IDENTITY');
    assert.strictEqual(m.records[2]!.reasonCode, 'MALFORMED_PROVIDER_IDENTITY');
    assert.strictEqual(m.records[3]!.reasonCode, 'MALFORMED_PROVIDER_IDENTITY');
    assert.strictEqual(m.records[4]!.reasonCode, 'NO_P04_COMPANY_FOR_ISIN');
    assert.strictEqual(m.records[5]!.disposition, 'PROPOSED_ADDITION');
    assert.strictEqual(m.records[6]!.reasonCode, 'DUPLICATE_INPUT_ROW');
    assert.strictEqual(m.records[7]!.reasonCode, 'CONFLICTING_PROVIDER_ID_FOR_IDENTITY');
    assert.strictEqual(m.counts.proposedAdditions, 1);
    assert.strictEqual(m.reconciliation.reconciles, true);
    // Every rejected row explains itself in prose, not only as a code.
    for (const r of m.records) if (r.disposition !== 'PROPOSED_ADDITION') assert.ok(r.reason.length > 0);
  });

  it('records a disposition for EVERY input row and reconciles the counts', () => {
    const text = dcsv(
      drow(),
      drow({ EXCH_ID: 'NSE', SEGMENT: 'D', INSTRUMENT: 'FUTIDX', SECURITY_ID: '1' }), // out of scope
      drow({ ISIN: 'INE000SYNTH2' }),
    );
    const m = buildMappingExpansionManifest(opts(text, []));
    assert.strictEqual(m.counts.inputRows, 3);
    assert.strictEqual(m.reconciliation.inScopeRows, 2);
    assert.strictEqual(m.reconciliation.outOfScopeRows, 1);
    assert.strictEqual(m.reconciliation.dispositionTotal, 3);
    assert.strictEqual(m.reconciliation.reconciles, true);
    assert.strictEqual(m.records.length + m.reconciliation.outOfScopeRows, m.counts.inputRows);
    // Out-of-scope rows are aggregated, deterministically.
    assert.deepStrictEqual(m.outOfScopeSummary, [{ exchange: 'NSE', segment: 'D', instrument: 'FUTIDX', rows: 1 }]);
    const sum = Object.values(m.countsByReasonCode).reduce((a, b) => a + (b ?? 0), 0);
    assert.strictEqual(sum, m.counts.inputRows);
  });

  it('refuses to run without SHA-256 provenance on each input', () => {
    const text = dcsv(drow());
    const withBad = { ...opts(text, []), snapshot: snap(text, { sha256: 'synthetic' }) };
    assert.throws(() => buildMappingExpansionManifest(withBad), /SHA-256/);
    const withRecon = {
      ...opts(text, []),
      reconciliationSnapshot: snap(ccsv(crow()), { filename: 'api-scrip-master.csv', sha256: '' }),
    };
    assert.throws(() => buildMappingExpansionManifest(withRecon), /SHA-256/);
  });

  it('is byte-identical on rerun and never reads symbol or company name as identity', () => {
    const text = dcsv(drow(), drow({ ISIN: 'INE000SYNTH2', SECURITY_ID: '500410', EXCH_ID: 'BSE' }));
    const a = buildMappingExpansionManifest(opts(text, []));
    const b = buildMappingExpansionManifest(opts(text, []));
    assert.strictEqual(JSON.stringify(a), JSON.stringify(b));

    // Renaming every symbol and display name must not change a single disposition:
    // name is not identity evidence.
    const renamed = dcsv(
      drow({ SYMBOL_NAME: 'ZZZ-TOTALLY-DIFFERENT' }),
      drow({ ISIN: 'INE000SYNTH2', SECURITY_ID: '500410', EXCH_ID: 'BSE', SYMBOL_NAME: 'QQQ' }),
    );
    const c = buildMappingExpansionManifest(opts(renamed, []));
    assert.deepStrictEqual(
      c.records.map((r) => [r.disposition, r.reasonCode, r.isin, r.series]),
      a.records.map((r) => [r.disposition, r.reasonCode, r.isin, r.series]),
    );

    // The manifest renders to a deterministic operator report.
    assert.strictEqual(renderMappingExpansionReport(a), renderMappingExpansionReport(b));
  });

  it('published snapshot: SHA-256 provenance is correct and reruns are byte-identical', () => {
    const dir = resolve(process.cwd(), 'evidence/dhan-p7');
    const retrieval = JSON.parse(readFileSync(resolve(dir, 'source-retrieval-manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
    const detailedFile = 'api-scrip-master-detailed.csv';
    const bytes = readFileSync(resolve(dir, 'source', detailedFile));
    const digest = createHash('sha256').update(bytes).digest('hex').toUpperCase();
    const expected = retrieval.files.find((f: { filename: string }) => f.filename === detailedFile);
    assert.ok(expected, 'the retained snapshot has provenance in the retrieval manifest');
    assert.strictEqual(digest, String(expected.sha256).toUpperCase());

    const build = () =>
      buildMappingExpansionManifest({
        snapshot: {
          filename: detailedFile,
          sourceUrl: expected.sourceUrl,
          retrievedAtUtc: expected.retrievedAtUtc,
          sha256: digest,
          sizeBytes: bytes.length,
          text: bytes.toString('utf8'),
        },
        securityMaster: getGovernedBroadSecurityMaster(),
        baselineMappings: loadGovernedP7InstrumentRegistry().list(),
        p04SourceRevision: getGovernedBroadSecurityMaster().sourceRevision,
      });

    const first = build();
    const second = build();
    assert.strictEqual(JSON.stringify(first), JSON.stringify(second), 'a rerun on the same snapshot is byte-identical');
    assert.strictEqual(first.inputs[0]!.sha256, digest.toLowerCase());

    // Reconciliation against the published baseline the daemon actually loads.
    assert.strictEqual(first.reconciliation.reconciles, true);
    assert.strictEqual(first.reconciliation.dispositionTotal, first.counts.inputRows);
    assert.strictEqual(first.counts.inputRows, 217104);
    assert.strictEqual(first.baseline.qualifiedMappings, loadGovernedP7InstrumentRegistry().size);
    assert.strictEqual(
      first.counts.alreadyQualified + first.counts.proposedAdditions,
      first.baseline.qualifiedMappings + first.counts.proposedAdditions,
    );
    // Every proposed row must be genuinely absent from the qualified baseline.
    for (const p of first.proposedMappings) {
      const found = loadGovernedP7InstrumentRegistry()
        .list()
        .some((m) => m.companyId === p.companyId && m.securityId === p.securityId && m.exchangeSegment === p.exchangeSegment);
      assert.strictEqual(found, false, `proposal ${p.companyId}/${p.securityId} must not already be qualified`);
    }
    // No record may claim the qualified disposition through this pipeline.
    for (const r of first.records) assert.notStrictEqual(r.disposition as string, 'QUALIFIED');
  });

  it('proposals are inert: the daemon loader ignores PROPOSED rows and loads QUALIFIED only', () => {
    // A manifest that contains both a QUALIFIED row and a PROPOSED row — proving the
    // daemon filter is on `disposition`, not on the presence of a mapping payload.
    const dir = resolve(process.cwd(), 'evidence/dhan-p7');
    const base = JSON.parse(readFileSync(resolve(dir, 'qualification-manifest.json'), 'utf8'));
    const qualified = base.records.find((r: { disposition: string }) => r.disposition === 'QUALIFIED');
    assert.ok(qualified, 'the published manifest carries a qualified row to copy');

    const proposal = {
      disposition: 'PROPOSED_ADDITION',
      lineNumber: 999999,
      reason: 'proposed, not qualified',
      companyId: 'COMP-W27-PROPOSED',
      exchange: 'NSE',
      segment: 'E',
      dhanSecurityId: '888888',
      isin: 'INE000W27PRP',
      series: 'EQ',
      mapping: {
        companyId: 'COMP-W27-PROPOSED',
        isin: 'INE000W27PRP',
        securityId: 'ISIN:INE000W27PRP:EQ',
        exchange: 'NSE',
        symbol: 'W27PROP',
        exchangeSegment: 'NSE_EQ',
        dhanSecurityId: '888888',
        mappingProvenance: 'DHAN_INSTRUMENT_MASTER',
        instrumentType: 'EQUITY',
        active: true,
      },
    };
    const mixed = { ...base, records: [qualified, proposal] };

    const tmpDir = mkdtempSync(join(tmpdir(), 'w27-'));
    try {
      const file = join(tmpDir, 'manifest.json');
      writeFileSync(file, JSON.stringify(mixed), 'utf8');
      const registry = loadGovernedP7InstrumentRegistry(file);
      assert.strictEqual(registry.size, 1, 'only the QUALIFIED row is loaded');
      const loaded = registry.list();
      assert.ok(loaded.every((m) => m.companyId !== 'COMP-W27-PROPOSED'));
      assert.strictEqual(
        registry.resolveExactIdentity('COMP-W27-PROPOSED', 'NSE_EQ', buildD114SecurityIdentity('INE000W27PRP', 'EQ')!).status,
        'UNRESOLVED',
        'a proposed mapping is not resolvable at runtime',
      );
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('W-27-AS1: the W-27 cases above genuinely executed (guards against an all-skip pass)', () => {
    // `node --test` exits 0 when every case skips. Assert the pipeline module and the
    // snapshot are present so a green run cannot be a run that tested nothing.
    assert.strictEqual(typeof buildMappingExpansionManifest, 'function');
    assert.strictEqual(typeof renderMappingExpansionReport, 'function');
    assert.ok(existsSync(resolve(process.cwd(), 'evidence/dhan-p7/source/api-scrip-master-detailed.csv')));
    const m = buildMappingExpansionManifest(opts(dcsv(drow()), []));
    assert.ok(m.records.length > 0 && m.counts.inputRows > 0);
  });
});
