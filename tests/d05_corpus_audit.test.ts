/**
 * D05 corpus audit tool — behavioural contract.
 *
 * Spawns the governed CLI exactly as CI would, against fixtures derived from the
 * deposit shape, plus one read-only integration run against the real deposit
 * corpus (byte-stability of the corpus is asserted, never modified).
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const repositoryRoot = process.cwd();
const CORPUS = resolve(repositoryRoot, 'evidence/operator_drop/d05_security_master_broad_universe.json');
const CORPUS_SHA256 = '7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5';
const CLI = resolve(repositoryRoot, 'scripts/d05_corpus_audit.mjs');

const VALID_ISINS = ['INE002A01018', 'INE001A01036', 'INE040A01034', 'INE081A01020', 'INE009A01021', 'INE242A01010'];

function makeRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const rest = { ...overrides };
  const token = (rest.__token as string | undefined) ?? 'T0001X';
  delete rest.__token;
  const isin = (rest.isin as string | undefined) ?? VALID_ISINS[0];
  const u = (Math.abs(token.split('').reduce((a, c) => (a * 131 + c.charCodeAt(0)) | 0, 7)) % 100000) + 1;
  const cin = `L${String(10000 + (u % 90000))}MH${String(1950 + (u % 70))}PTC${String(100000 + u).slice(-6)}`;
  const base: Record<string, unknown> = {
    companyId: `EQ_${token}_IN`,
    isin,
    cin,
    companyName: `${token} India Limited`,
    industry: 'IT Services & Consulting',
    sector: 'IT',
    listingStatus: 'ACTIVE',
    lotSize: 1,
    tickSize: 0.05,
    faceValue: 1,
    currency: 'INR',
    effectiveFrom: '2015-01-01T00:00:00.000Z',
    listings: [
      { exchange: 'NSE', symbol: token, scripCode: token, status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
      { exchange: 'BSE', symbol: token, scripCode: String(200000 + u), status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
    ],
    nseSymbol: token,
    bseSymbol: token,
    bseScripCode: String(200000 + u),
  };
  return { ...base, ...rest };
}

function runCli(args: string[]): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
}

describe('D05 corpus audit CLI', () => {
  let workDir: string;
  const dirs: string[] = [];

  before(() => {
    workDir = mkdtempSync(join(tmpdir(), 'd05-audit-test-'));
    dirs.push(workDir);
  });
  after(() => {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
    dirs.length = 0;
  });

  function writeFixture(name: string, records: unknown[]): string {
    const p = join(workDir, name);
    writeFileSync(p, JSON.stringify({ depositAct: 'TEST-FIXTURE', records }, null, 2));
    return p;
  }

  it('audits a well-formed fixture: exit 0, outputs parse, origin UNCLASSIFIED', () => {
    const records = VALID_ISINS.slice(0, 5).map((isin, i) => makeRecord({ isin, __token: `N${String(i + 1000)}A` }));
    const corpus = writeFixture('ok.json', records);
    const outDir = join(workDir, 'out-ok');
    const res = runCli(['--corpus', corpus, '--output-dir', outDir]);
    assert.equal(res.status, 0, res.stderr);
    const report = JSON.parse(readFileSync(join(outDir, 'corpus-audit.json'), 'utf8'));
    assert.equal(report.input.recordCount, 5);
    assert.equal(report.counts.criticalFindings, 0);
    assert.equal(report.originPolicy.perRecordClassification, 'UNCLASSIFIED');
    assert.match(report.input.sha256, /^[0-9a-f]{64}$/);
    for (const line of ['corpus-audit.json', 'corpus-audit.csv', 'corpus-audit.md']) {
      assert.ok(readFileSync(join(outDir, line), 'utf8').length > 10);
    }
  });

  it('is byte-deterministic across runs', () => {
    const records = VALID_ISINS.slice(0, 4).map((isin, i) => makeRecord({ isin, __token: `D${String(i + 2000)}B` }));
    const corpus = writeFixture('det.json', records);
    const a = join(workDir, 'out-det-a');
    const b = join(workDir, 'out-det-b');
    assert.equal(runCli(['--corpus', corpus, '--output-dir', a]).status, 0);
    assert.equal(runCli(['--corpus', corpus, '--output-dir', b]).status, 0);
    for (const line of ['corpus-audit.json', 'corpus-audit.csv', 'corpus-audit.md']) {
      assert.deepEqual(readFileSync(join(a, line)), readFileSync(join(b, line)));
    }
  });

  it('flags missing field, bad Luhn, duplicate identifiers and bad enum as CRITICAL/WARNING findings', () => {
    const good = makeRecord({ isin: VALID_ISINS[0], __token: 'AAA1001X' });
    const missingField = makeRecord({ isin: VALID_ISINS[1], __token: 'BBB1002X' });
    delete (missingField as Record<string, unknown>).cin;
    const badLuhn = makeRecord({ isin: 'INE002A01019', __token: 'CCC1003X' });
    const dupe = makeRecord({ isin: VALID_ISINS[3], __token: 'DDD1004X' });
    const dupe2 = makeRecord({ isin: VALID_ISINS[4], __token: 'DDD1004X', bseScripCode: '777001' });
    dupe2.isin = dupe.isin as string; // same ISIN as dupe
    const badEnum = makeRecord({ isin: VALID_ISINS[5], __token: 'EEE1005X', listingStatus: 'PENDING' });
    const corpus = writeFixture('bad.json', [good, missingField, badLuhn, dupe, dupe2, badEnum]);
    const outDir = join(workDir, 'out-bad');
    const res = runCli(['--corpus', corpus, '--output-dir', outDir]);
    assert.equal(res.status, 0, res.stderr);
    const report = JSON.parse(readFileSync(join(outDir, 'corpus-audit.json'), 'utf8'));
    const codes = report.findings.map((x: { code: string }) => x.code);
    assert.ok(codes.includes('FIELD_MISSING'));
    assert.ok(codes.includes('ISIN_LUHN'));
    assert.ok(codes.includes('DUPLICATE_ISIN') || codes.includes('DUPLICATE_COMPANY_ID'));
    assert.ok(codes.includes('ENUM_LISTING_STATUS'));
    assert.ok(report.counts.criticalFindings > 0);
  });

  it('never treats markers as authenticity verdicts', () => {
    const synthetic = VALID_ISINS.slice(0, 2).map((isin, i) => makeRecord({ isin, __token: `ZZZ${9100 + i}` }));
    const corpus = writeFixture('mark.json', synthetic);
    const outDir = join(workDir, 'out-mark');
    assert.equal(runCli(['--corpus', corpus, '--output-dir', outDir]).status, 0);
    const report = JSON.parse(readFileSync(join(outDir, 'corpus-audit.json'), 'utf8'));
    assert.equal(report.originPolicy.perRecordClassification, 'UNCLASSIFIED');
    assert.match(report.originPolicy.disclaimer, /not an authenticity verdict/i);
    assert.ok(!JSON.stringify(report).includes('AUTHENTIC'));
    assert.ok(!JSON.stringify(report).includes('SYNTHETIC_VERIFIED'));
  });

  it('refuses to write into evidence/ and leaves the corpus byte-identical', () => {
    const before = createHash('sha256').update(readFileSync(CORPUS)).digest('hex');
    const res = runCli(['--output-dir', 'evidence/audit-should-not-be-written']);
    assert.notEqual(res.status, 0);
    const afterHash = createHash('sha256').update(readFileSync(CORPUS)).digest('hex');
    assert.equal(afterHash, before);
  });

  it('integration: real deposit corpus hashes to pinned value; audit reports UNCLASSIFIED/2198 markers', () => {
    const before = createHash('sha256').update(readFileSync(CORPUS)).digest('hex');
    assert.equal(before, CORPUS_SHA256, 'deposit corpus drifted; audit integration pin is stale');
    const outDir = join(workDir, 'out-real');
    const res = runCli(['--output-dir', outDir]);
    assert.equal(res.status, 0, res.stderr);
    const report = JSON.parse(readFileSync(join(outDir, 'corpus-audit.json'), 'utf8'));
    assert.equal(report.input.sha256, CORPUS_SHA256);
    assert.equal(report.input.recordCount, 2250);
    assert.equal(report.originPolicy.perRecordClassification, 'UNCLASSIFIED');
    assert.equal(report.originPolicy.markerCount, 2198);
    assert.equal(report.originPolicy.markerFreeCount, 52);
    assert.equal(report.counts.criticalFindings, 0);
    // corpus untouched by the run
    assert.equal(createHash('sha256').update(readFileSync(CORPUS)).digest('hex'), CORPUS_SHA256);
    // evidence references embedded with live hashes
    const ref = (n: string) => report.evidenceRefs.find((r: { ref: string }) => r.ref === n);
    assert.equal(ref('WAVE1-BROAD-UNIVERSE-MANIFEST')?.sha256, '063288b329e09aa937899e0071ae5ff77321791501aab57766e8ce215156d51c');
    assert.equal(ref('WAVE2-DISPOSITION-MANIFEST')?.sha256, '21a6b47316753755897bf8dabce84c88bc069d13b3d6ecbc83dc272218ada63c');
    assert.equal(ref('WAVE3-ACQUISITION-ATTEMPT-LOG')?.sha256, '93c92ec40bc8b3bc14cfc28fef7683653c02e01e51425adfcc111193bf51e290');
    assert.ok(report.evidenceRefs.every((r: { present: boolean }) => r.present === true));
  });

  it('fails cleanly (exit 3) on unreadable corpus', () => {
    const res = runCli(['--corpus', join(workDir, 'does-not-exist.json'), '--output-dir', join(workDir, 'out-x')]);
    assert.equal(res.status, 3);
  });
});
