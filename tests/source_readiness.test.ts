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

  it('reports DEPOSITION_READY with exit 0 for a complete, consistent fixture set', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    const stdout = runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--output-dir', outDir('ready')]);
    assert.equal(stdout.status, 0, stdout.stderr);
    const report = JSON.parse(readFileSync(join(outDir('ready'), 'source-readiness.json'), 'utf8'));
    assert.equal(report.verdict, 'DEPOSITION_READY');
    assert.equal(report.blockingReasons.length, 0);
    assert.equal(report.crossSource.unionIsins, 4);
    assert.equal(report.crossSource.isinsPresentInAll, 4);
    const unresolved = report.d05FieldCoverage.filter((c: { status: string; field: string }) => c.status === 'UNRESOLVED' && c.field !== 'tickSize');
    assert.deepEqual(unresolved, []);
    const tick = report.d05FieldCoverage.find((c: { field: string }) => c.field === 'tickSize');
    assert.equal(tick.status, 'UNRESOLVED');
    // SHA-256 of every supplied file is embedded
    for (const s of report.sources) {
      const expected = createHash('sha256').update(readFileSync(s.path)).digest('hex');
      assert.equal(s.sha256, expected);
    }
  });

  it('blocks with exit 4 and actionable reasons when a source is missing', () => {
    const { nse, bse, mca } = readyFixtures();
    const res = runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--output-dir', outDir('missing-source')]);
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
    const res = runCli(['--nse', badNse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--output-dir', outDir('bad')]);
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
    const res = runCli(['--nse', dupNameNse, '--bse', bse, '--mca', dupNameMca, '--taxonomy', taxonomy, '--output-dir', outDir('bridge')]);
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
    const res = runCli(['--nse', bad, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--output-dir', outDir('headerfail')]);
    assert.equal(res.status, 4);
    const report = JSON.parse(readFileSync(join(outDir('headerfail'), 'source-readiness.json'), 'utf8'));
    const nse = report.sources.find((s: { key: string }) => s.key === 'nse');
    assert.equal(nse.headerStatus, 'UNUSABLE');
    assert.ok(report.blockingReasons.some((b: string) => b.includes('nse')));
  });

  it('is byte-deterministic across runs', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    const a = outDir('det-a'); const b = outDir('det-b');
    assert.equal(runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--output-dir', a]).status, 0);
    assert.equal(runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--output-dir', b]).status, 0);
    for (const line of ['source-readiness.json', 'source-readiness.csv', 'source-readiness.md']) {
      assert.deepEqual(readFileSync(join(a, line)), readFileSync(join(b, line)));
    }
  });

  it('refuses to write outputs into evidence/', () => {
    const { nse, bse, mca, taxonomy } = readyFixtures();
    const res = runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--output-dir', 'evidence/should-not-write']);
    assert.equal(res.status, 2);
  });

  it('leaves the governed corpus byte-identical', () => {
    const before = createHash('sha256').update(readFileSync(CORPUS)).digest('hex');
    const { nse, bse, mca, taxonomy } = readyFixtures();
    runCli(['--nse', nse, '--bse', bse, '--mca', mca, '--taxonomy', taxonomy, '--output-dir', outDir('readonly')]);
    assert.equal(createHash('sha256').update(readFileSync(CORPUS)).digest('hex'), before);
  });
});
