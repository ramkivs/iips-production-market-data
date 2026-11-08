/**
 * D05 authoritative-source readiness tool — behavioural contract.
 * Fixtures are synthetic stand-ins (NOT real deposition data); every ISIN used
 * has a valid ISO-6166 check digit.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const repositoryRoot = process.cwd();
const CLI = resolve(repositoryRoot, 'scripts/source_readiness.mjs');
const CORPUS = resolve(repositoryRoot, 'evidence/operator_drop/d05_security_master_broad_universe.json');

const N = {
  rows: [
    { sym: 'ALPHA', isin: 'INE001A01036', name: 'Alpha Industries Limited', face: 1 },
    { sym: 'BETA', isin: 'INE002A01018', name: 'Beta Services Limited', face: 2 },
    { sym: 'GAMMA', isin: 'INE040A01034', name: 'Gamma Energy Limited', face: 5 },
    { sym: 'DELTA', isin: 'INE081A01020', name: 'Delta Autos Limited', face: 10 },
  ],
};
const CIN = {
  ALPHA1: 'L99999MH2015PTC000001',
  BETA: 'L88888MH2012PTC000002',
  GAMMA: 'L77777KA2010PTC000003',
  DELTA: 'L66666DL1999PTC000004',
};

const NSE_CSV = [
  'SYMBOL,SERIES,ISIN,NAME OF COMPANY,DATE OF LISTING,MARKET LOT',
  ...N.rows.map((r, i) => `${r.sym},EQ,${r.isin},${r.name},2015-01-01,1`),
].join('\n') + '\n';

const BSE_CSV = [
  'Scrip Code,Security Name,ISIN Number',
  ...N.rows.map((r, i) => `${100001 + i * 7},${r.name},${r.isin}`),
].join('\n') + '\n';

const MCA_CSV = [
  'CIN,Company Name,Face Value',
  `${CIN.ALPHA1},Alpha Industries Limited,1`,
  `${CIN.BETA},Beta Services Limited,2`,
  `${CIN.GAMMA},Gamma Energy Limited,5`,
  `${CIN.DELTA},Delta Autos Limited,10`,
].join('\n') + '\n';

const TAXONOMY_CSV = [
  'ISIN,Industry,Sector',
  ...N.rows.map((r, i) => `${r.isin},Sector ${i} Industry,SECTOR${i}`),
].join('\n') + '\n';

function runCli(args: string[]): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
}

describe('D05 source readiness CLI', () => {
  let workDir: string;
  const dirs: string[] = [];

  before(() => {
    workDir = mkdtempSync(join(tmpdir(), 'd05-source-test-'));
  });
  after(() => {
    rmSync(workDir, { recursive: true, force: true });
    dirs.length = 0;
  });

  function fixture(name: string, content: string): string {
    const p = join(workDir, name);
    writeFileSync(p, content);
    return p;
  }
  function readyFixtures() {
    const nse = fixture('nse.csv', NSE_CSV);
    const bse = fixture('bse.csv', BSE_CSV);
    const mca = fixture('mca.csv', MCA_CSV);
    const tax = fixture('taxonomy.csv', TAXONOMY_CSV);
    return { nse, bse, mca, taxonomy: tax };
  }
  const outDir = (name: string) => join(workDir, `out-${name}`);

  it('reports DEPOSITION_READY with exit 0 when tickSize evidence is provided', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    const stdout = runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--tick-size-uniform', '0.05', '--output-dir', outDir('ready')]);
    assert.equal(stdout.status, 0, stdout.stderr);
    const report = JSON.parse(readFileSync(join(outDir('ready'), 'source-readiness.json'), 'utf8'));
    assert.equal(report.reportVersion, 2);
    assert.equal(report.verdict, 'DEPOSITION_READY');
    assert.equal(report.blockingReasons.length, 0);
    assert.equal(report.crossSource.unionIsins, 4);
    assert.equal(report.crossSource.isinsPresentInAll, 4);
    const unresolved = report.d05FieldCoverage.filter((c: { status: string; kind: string }) => c.status === 'UNRESOLVED' && c.kind === 'MANDATORY');
    assert.deepEqual(unresolved, []);
    const tick = report.d05FieldCoverage.find((c: { field: string }) => c.field === 'tickSize');
    assert.equal(tick.status, 'DERIVED');
    assert.equal(tick.kind, 'MANDATORY');
    // SHA-256 of every supplied file is embedded
    for (const s of report.sources) {
      const expected = createHash('sha256').update(readFileSync(s.path)).digest('hex');
      assert.equal(s.sha256, expected);
    }
  });

  it('blocks with exit 4 and actionable reasons when a source is missing', () => {
    const { nse, bse, mca } = readyFixtures();
    const res = runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--tick-size-uniform', '0.05', '--output-dir', outDir('missing-source')]);
    assert.equal(res.status, 4);
    const report = JSON.parse(readFileSync(join(outDir('missing-source'), 'source-readiness.json'), 'utf8'));
    assert.equal(report.verdict, 'DEPOSITION_BLOCKED');
    assert.ok(report.missingSources.includes('taxonomy'));
    assert.ok(report.blockingReasons.some((b: string) => b.includes('taxonomy')));
    assert.ok(report.requiredEvidenceForFullCoverage.some((r: string) => r.toLowerCase().includes('taxonomy')));
  });

  it('blocks when no sources are supplied at all', () => {
    const res = runCli(['--output-dir', outDir('none')]);
    assert.equal(res.status, 4);
    const report = JSON.parse(readFileSync(join(outDir('none'), 'source-readiness.json'), 'utf8'));
    assert.deepEqual(report.missingSources.sort(), ['bse', 'mca', 'nse', 'taxonomy']);
  });

  it('flags invalid rows, duplicate ISINs and conflicting symbols; inputs stay byte-identical', () => {
    const dupSymbol = 'BETA2';
    const badNse = fixture('bad-nse.csv', [
      'SYMBOL,SERIES,ISIN,NAME OF COMPANY,DATE OF LISTING,MARKET LOT',
      'ALPHA,EQ,INE001A01036,Alpha Industries Limited,2015-01-01,1',
      'ALPHA2,EQ,INE001A01036,Alpha Industries Limited,2015-01-01,1', // duplicate ISIN, conflicting symbol
      'BETA,EQ,INE002A01019,Beta Services Limited,2015-01-01,1',  // invalid check digit
      'GARBLE,EQ,TOO-SHORT,Bad Row Limited,2015-01-01,1',          // bad shape
      'GAMMA,EQ,INE040A01034,Gamma Energy Limited,2015-01-01,',    // blank lot tolerated
      '',
    ].join('\n'));
    const { bse, mca, taxonomy } = readyFixtures();
    const beforeNse = readFileSync(badNse);
    const res = runCli(['--nse', badNse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--tick-size-uniform', '0.05', '--output-dir', outDir('bad')]);
    assert.equal(res.status, 4);
    const report = JSON.parse(readFileSync(join(outDir('bad'), 'source-readiness.json'), 'utf8'));
    const kinds = report.crossSource.conflicts.map((c: { kind: string }) => c.kind);
    assert.ok(kinds.includes('DUPLICATE_ISIN_IN_SOURCE'));
    assert.ok(kinds.includes('SYMBOL_MISMATCH_IN_NSE'));
    const csv = readFileSync(join(outDir('bad'), 'source-readiness.csv'), 'utf8');
    assert.match(csv, /INVALID_ROW/);
    assert.deepEqual(readFileSync(badNse), beforeNse);
    void dupSymbol;
  });

  it('reports ambiguous MCA name bridges without fuzzy-matching', () => {
    const dupNameNse = fixture('dupname-nse.csv', [
      'SYMBOL,SERIES,ISIN,NAME OF COMPANY,DATE OF LISTING,MARKET LOT',
      'DUP1,EQ,INE001A01036,Same Name Limited,2015-01-01,1',
      'DUP2,EQ,INE002A01018,Same Name Limited,2015-01-01,1',
      'GAMMA,EQ,INE040A01034,Gamma Energy Limited,2015-01-01,1',
      'DELTA,EQ,INE081A01020,Delta Autos Limited,2015-01-01,1',
    ].join('\n'));
    const dupNameMca = fixture('dupname-mca.csv', [
      'CIN,Company Name,Face Value',
      `${CIN.ALPHA1},Same Name Limited,1`,   // ambiguous: matches 2 NSE rows by exact normalized name
      `${CIN.GAMMA},Gamma Energy Limited,5`, // unambiguous
      `${CIN.DELTA},Delta Autos Limited,10`, // unambiguous
      'L55555MH2001PTC999999,No Match Body Corporate,5', // no NSE counterpart
    ].join('\n'));
    const { bse, taxonomy } = readyFixtures();
    const res = runCli(['--nse', dupNameNse, '--bse', bse, '--mca', dupNameMca, '--taxonomy', taxonomy, '--tick-size-uniform', '0.05', '--output-dir', outDir('bridge')]);
    const report = JSON.parse(readFileSync(join(outDir('bridge'), 'source-readiness.json'), 'utf8'));
    assert.equal(report.crossSource.mcaAmbiguousNameBridge, 1);
    assert.equal(report.crossSource.mcaUnmapped, 1);
    assert.ok(report.crossSource.mcaAmbiguousNameSamples.includes('Same Name Limited'));
    assert.ok(report.crossSource.mcaUnmappedSamples.includes('No Match Body Corporate'));
    // two NSE securities (DUP1/DUP2) have no reliable MCA linkage ⇒ mandatory cin/faceValue coverage materially unresolved ⇒ blocked
    assert.equal(res.status, 4);
    assert.ok(report.blockingReasons.some((b: string) => b.includes('MCA linkage')));
  });

  it('handles a malformed source file (bad headers) without crashing', () => {
    const bad = fixture('garbage.csv', 'a,b,c\n1,2,3\n');
    const { bse, mca, taxonomy } = readyFixtures();
    const res = runCli(['--nse', bad, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--tick-size-uniform', '0.05', '--output-dir', outDir('headerfail')]);
    assert.equal(res.status, 4);
    const report = JSON.parse(readFileSync(join(outDir('headerfail'), 'source-readiness.json'), 'utf8'));
    const nse = report.sources.find((s: { key: string }) => s.key === 'nse');
    assert.equal(nse.headerStatus, 'UNUSABLE');
    assert.ok(report.blockingReasons.some((b: string) => b.includes('nse')));
  });

  it('is byte-deterministic across runs', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    const a = outDir('det-a'); const b = outDir('det-b');
    assert.equal(runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--tick-size-uniform', '0.05', '--output-dir', a]).status, 0);
    assert.equal(runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--tick-size-uniform', '0.05', '--output-dir', b]).status, 0);
    for (const line of ['source-readiness.json', 'source-readiness.csv', 'source-readiness.md']) {
      assert.deepEqual(readFileSync(join(a, line)), readFileSync(join(b, line)));
    }
  });


  /* ── mandatory tickSize + advisory distinction (2026-11-07 fix) ─────────── */

  it('blocks DEPOSITION_READY when tickSize is UNRESOLVED (missing evidence)', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    const res = runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--output-dir', outDir('t-none')]);
    assert.equal(res.status, 4);
    const report = JSON.parse(readFileSync(join(outDir('t-none'), 'source-readiness.json'), 'utf8'));
    assert.equal(report.verdict, 'DEPOSITION_BLOCKED');
    assert.ok(report.blockingReasons.some((b: string) => b.includes('tickSize')));
    const tick = report.d05FieldCoverage.find((c: { field: string }) => c.field === 'tickSize');
    assert.equal(tick.status, 'UNRESOLVED');
    assert.equal(tick.kind, 'MANDATORY');
    assert.equal(report.tickSizeEvidence.mode, 'absent');
    assert.ok(report.requiredEvidenceForFullCoverage.some((r: string) => r.includes('--tick-rules') && r.includes('--tick-size-uniform')));
  });

  it('accepts --tick-size-uniform 0.05 as DERIVED bound evidence → READY', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    const res = runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--tick-size-uniform', '0.05', '--output-dir', outDir('t-uni')]);
    assert.equal(res.status, 0);
    const report = JSON.parse(readFileSync(join(outDir('t-uni'), 'source-readiness.json'), 'utf8'));
    const tick = report.d05FieldCoverage.find((c: { field: string }) => c.field === 'tickSize');
    assert.equal(tick.status, 'DERIVED');
    assert.equal(tick.kind, 'MANDATORY');
    assert.equal(report.verdict, 'DEPOSITION_READY');
    assert.equal(report.tickSizeEvidence.mode, 'uniform');
    assert.ok(report.requiredEvidenceForFullCoverage.some((r: string) => r.includes('mode=uniform')));
  });

  it('rejects --tick-size-uniform outside the NSE tick band set with exit 2 (no invention)', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    for (const bad of ['0.03', '0.07', 'abc']) {
      const res = runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--tick-size-uniform', bad, '--output-dir', outDir('t-baduni')]);
      assert.equal(res.status, 2, `expected exit 2 for ${bad}`);
    }
  });

  it('full --tick-rules supply → SOURCE_PROVIDED with sha256 → READY', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    const tickRules = fixture('ticks-full.csv', [
      'ISIN,TICK_SIZE',
      'INE001A01036,0.05',
      'INE002A01018,0.10',
      'INE040A01034,0.50',
      'INE081A01020,5.00',
    ].join('\n') + '\n');
    const res = runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--tick-rules', tickRules, '--output-dir', outDir('t-full')]);
    assert.equal(res.status, 0, res.stderr);
    const report = JSON.parse(readFileSync(join(outDir('t-full'), 'source-readiness.json'), 'utf8'));
    assert.equal(report.verdict, 'DEPOSITION_READY');
    const tick = report.d05FieldCoverage.find((c: { field: string }) => c.field === 'tickSize');
    assert.equal(tick.status, 'SOURCE_PROVIDED');
    assert.equal(tick.source, 'tickRules');
    assert.equal(tick.kind, 'MANDATORY');
    assert.equal(report.tickSizeEvidence.mode, 'rules');
    assert.equal(report.tickSizeEvidence.coveredIsins, 4);
    assert.equal(report.tickSizeEvidence.denominator, 4);
    assert.equal(report.tickSizeEvidence.sha256, createHash('sha256').update(readFileSync(tickRules)).digest('hex'));
  });

  it('partial --tick-rules coverage → exit 4, missing ISINs reported', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    const tickRules = fixture('ticks-partial.csv', [
      'ISIN,TICK_SIZE',
      'INE001A01036,0.05',
      'INE002A01018,0.05',
    ].join('\n') + '\n');
    const res = runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--tick-rules', tickRules, '--output-dir', outDir('t-part')]);
    assert.equal(res.status, 4);
    const report = JSON.parse(readFileSync(join(outDir('t-part'), 'source-readiness.json'), 'utf8'));
    assert.equal(report.verdict, 'DEPOSITION_BLOCKED');
    assert.equal(report.tickSizeEvidence.coveredIsins, 2);
    assert.deepEqual(report.tickSizeEvidence.missingSamples.sort(), ['INE040A01034', 'INE081A01020']);
    const tick = report.d05FieldCoverage.find((c: { field: string }) => c.field === 'tickSize');
    assert.equal(tick.status, 'UNRESOLVED');
    const csv = readFileSync(join(outDir('t-part'), 'source-readiness.csv'), 'utf8');
    assert.match(csv, /TICK_SIZE_MISSING_ISIN,INE040A01034/);
  });

  it('non-band tickSize values in --tick-rules rows are rejected (never defaulted)', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    const tickRules = fixture('ticks-badband.csv', [
      'ISIN,TICK_SIZE',
      'INE001A01036,0.07',
      'INE002A01018,0.05',
      'INE040A01034,0.10',
      'INE081A01020,0.25',
    ].join('\n') + '\n');
    const res = runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--tick-rules', tickRules, '--output-dir', outDir('t-band')]);
    assert.equal(res.status, 4);
    const report = JSON.parse(readFileSync(join(outDir('t-band'), 'source-readiness.json'), 'utf8'));
    assert.equal(report.tickSizeEvidence.invalidSamples.length, 1);
    assert.match(report.tickSizeEvidence.invalidSamples[0].reason, /0\.01\/0\.05\/0\.10\/0\.25\/0\.50\/1\.00\/5\.00/);
    const csv = readFileSync(join(outDir('t-band'), 'source-readiness.csv'), 'utf8');
    assert.match(csv, /INVALID_TICK_RULE_ROW/);
  });

  it('conflicting tickSize values for the same ISIN in --tick-rules are blocking', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    const tickRules = fixture('ticks-conflict.csv', [
      'ISIN,TICK_SIZE',
      'INE001A01036,0.05',
      'INE001A01036,0.10',
      'INE002A01018,0.05',
      'INE040A01034,0.10',
      'INE081A01020,0.25',
    ].join('\n') + '\n');
    const res = runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--tick-rules', tickRules, '--output-dir', outDir('t-conf')]);
    assert.equal(res.status, 4);
    const report = JSON.parse(readFileSync(join(outDir('t-conf'), 'source-readiness.json'), 'utf8'));
    assert.ok(report.crossSource.conflicts.some((c: { kind: string }) => c.kind === 'TICK_RULE_DUPLICATE_ISIN'));
    const tick = report.d05FieldCoverage.find((c: { field: string }) => c.field === 'tickSize');
    assert.equal(tick.status, 'UNRESOLVED');
  });

  it('other unresolved mandatory fields remain blocking (faceValue missing from MCA)', () => {
    const { nse, bse, taxonomy } = (() => {
      const { nse, bse, taxonomy } = readyFixtures();
      return { nse, bse, taxonomy };
    })();
    const mcaNoFace = fixture('mca-noface.csv', [
      'CIN,Company Name',
      'L99999MH2015PTC000001,Alpha Industries Limited',
      'L88888MH2012PTC000002,Beta Services Limited',
      'L77777KA2010PTC000003,Gamma Energy Limited',
      'L66666DL1999PTC000004,Delta Autos Limited',
    ].join('\n') + '\n');
    const res = runCli(['--nse', nse, '--bse', bse, '--mca', mcaNoFace, '--taxonomy', taxonomy, '--tick-size-uniform', '0.05', '--output-dir', outDir('t-face')]);
    assert.equal(res.status, 4);
    const report = JSON.parse(readFileSync(join(outDir('t-face'), 'source-readiness.json'), 'utf8'));
    assert.ok(report.blockingReasons.some((b: string) => b.includes('faceValue')));
    const fv = report.d05FieldCoverage.find((c: { field: string }) => c.field === 'faceValue');
    assert.equal(fv.status, 'UNRESOLVED');
    assert.equal(fv.kind, 'MANDATORY');
  });

  it('advisory rows stay ADVISORY and never block the verdict (NSE↔MCA faceValue cross-check)', () => {
    const NseWithFace = [
      'SYMBOL,SERIES,ISIN,NAME OF COMPANY,DATE OF LISTING,MARKET LOT,FACE VALUE',
      'ALPHA,EQ,INE001A01036,Alpha Industries Limited,2015-01-01,1,1',
      'BETA,EQ,INE002A01018,Beta Services Limited,2015-01-01,1,2',
      'GAMMA,EQ,INE040A01034,Gamma Energy Limited,2015-01-01,1,7', // diverges from MCA (5)
      'DELTA,EQ,INE081A01020,Delta Autos Limited,2015-01-01,1,10',
    ].join('\n') + '\n';
    const nseFace = fixture('nse-face.csv', NseWithFace);
    const { bse, mca, taxonomy } = readyFixtures();
    const res = runCli(['--nse', nseFace, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--tick-size-uniform', '0.05', '--output-dir', outDir('t-adv')]);
    const report = JSON.parse(readFileSync(join(outDir('t-adv'), 'source-readiness.json'), 'utf8'));
    // advisory divergence is reported but must NOT block
    const adv = report.d05FieldCoverage.find((c: { field: string }) => c.field === 'faceValue cross-check (NSE vs MCA)');
    assert.ok(adv, 'advisory cross-check row exists when both columns are present');
    assert.equal(adv.kind, 'ADVISORY');
    assert.equal(adv.status, 'UNRESOLVED');
    assert.equal(report.verdict, 'DEPOSITION_READY');
    assert.equal(res.status, 0);
    assert.ok(report.warnings.some((w: string) => w.includes('faceValue divergence')));
    // every coverage row carries a kind; currency is ADVISORY; everything else MANDATORY
    for (const row of report.d05FieldCoverage) {
      assert.ok(row.kind === 'MANDATORY' || row.kind === 'ADVISORY');
    }
    assert.equal(report.d05FieldCoverage.find((c: { field: string }) => c.field === 'currency').kind, 'ADVISORY');
    const mandatories = report.d05FieldCoverage.filter((c: { field: string }) => !['currency', 'faceValue cross-check (NSE vs MCA)'].includes(c.field));
    assert.ok(mandatories.every((c: { kind: string }) => c.kind === 'MANDATORY'));
  });

  it('deterministic outputs with tick evidence (byte-identical across runs)', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    const tickRules = fixture('ticks-det.csv', [
      'ISIN,TICK_SIZE',
      'INE001A01036,0.05',
      'INE002A01018,0.05',
      'INE040A01034,0.10',
      'INE081A01020,5.00',
    ].join('\n') + '\n');
    const a = outDir('t-det-a'); const b = outDir('t-det-b');
    assert.equal(runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--tick-rules', tickRules, '--output-dir', a]).status, 0);
    assert.equal(runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--tick-rules', tickRules, '--output-dir', b]).status, 0);
    for (const line of ['source-readiness.json', 'source-readiness.csv', 'source-readiness.md']) {
      assert.deepEqual(readFileSync(join(a, line)), readFileSync(join(b, line)));
    }
  });


  it('refuses to write outputs into evidence/', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    const res = runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--output-dir', 'evidence/should-not-write']);
    assert.equal(res.status, 2);
  });

  it('placeholder BSE scrip codes (UNLISTED-BSE) never count as BSE coverage — fail closed', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    const placeholderBse = fixture('bse-placeholder.csv', [
      'Scrip Code,Security Name,ISIN Number',
      ...N.rows.map((r) => `UNLISTED-BSE,${r.name},${r.isin}`),
    ].join('\n') + '\n');
    const res = runCli(['--nse', nse, '--bse', placeholderBse, '--mca', mca, '--taxonomy', taxonomy, '--tick-size-uniform', '0.05', '--output-dir', outDir('placeholder-bse')]);
    assert.equal(res.status, 4);
    const report = JSON.parse(readFileSync(join(outDir('placeholder-bse'), 'source-readiness.json'), 'utf8'));
    assert.equal(report.verdict, 'DEPOSITION_BLOCKED');
    assert.ok(report.blockingReasons.some((b: string) => b.includes('no BSE listing match')), JSON.stringify(report.blockingReasons));
    const invalid = report.sources.find((s: { key: string }) => s.key === 'bse');
    assert.ok(invalid.validRows === 0);
    assert.ok(report.crossSource.nseWithoutBse === N.rows.length, 'placeholder rows must not close the gap');
  });

  it('placeholder MCA reference tokens (EXEMPT-STRUCT-*) never count as MCA linkage — fail closed', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    const tokenMca = fixture('mca-tokens.csv', [
      'CIN,Company Name,Face Value',
      ...N.rows.map((r) => `EXEMPT-STRUCT-${r.sym},${r.name},1`),
    ].join('\n') + '\n');
    const res = runCli(['--nse', nse, '--bse', bse, '--mca', tokenMca, '--taxonomy', taxonomy, '--tick-size-uniform', '0.05', '--output-dir', outDir('token-mca')]);
    assert.equal(res.status, 4);
    const report = JSON.parse(readFileSync(join(outDir('token-mca'), 'source-readiness.json'), 'utf8'));
    assert.equal(report.verdict, 'DEPOSITION_BLOCKED');
    assert.ok(report.blockingReasons.some((b: string) => b.includes('no MCA linkage')), JSON.stringify(report.blockingReasons));
    const inv = report.sources.find((s: { key: string }) => s.key === 'mca');
    assert.equal(inv.validRows, 0, 'EXEMPT-STRUCT tokens are not CINs');
  });

  it('leaves the governed corpus byte-identical', () => {
    const before = createHash('sha256').update(readFileSync(CORPUS)).digest('hex');
    const { nse, bse, mca, taxonomy } = readyFixtures();
    runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--tick-size-uniform', '0.05', '--output-dir', outDir('readonly')]);
    assert.equal(createHash('sha256').update(readFileSync(CORPUS)).digest('hex'), before);
  });
});
