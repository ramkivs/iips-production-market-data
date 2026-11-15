/**
 * W04-P7 — tests of the published-manifest qualification utility
 * (`evidence/integration/w04-p7-published-manifest-qualification-2026-11-15/
 *   w04-p7-published-manifest-qualification.mjs`).
 *
 * Everything here is SYNTHETIC: the holdings are rows invented from the tracked P7 manifest,
 * the "published" manifest is served by a loopback HTTP server inside this process, and the
 * utility runs as a child process exactly as it would on a host. The original broker CSV is
 * not in the repository and is not used. No provider and no outside host is contacted.
 *
 * What is proven:
 *   PMQ-01  exact match on 64 synthetic holdings; the acceptance line is NOT printed for
 *           overridden inputs;
 *   PMQ-02  for EVERY mapping of the tracked manifest the utility's verdict is MATCH and the
 *           real runtime qualification (`qualifyHoldingSecurityIdentity` with the governed
 *           P04 master and `loadGovernedP7InstrumentRegistry`) is QUALIFIED, with the same series;
 *   PMQ-03  on negative holdings neither qualifies;
 *   PMQ-04  missing mapping;
 *   PMQ-05  mismatch in each dimension;
 *   PMQ-06  duplicate and ambiguous mappings, on the manifest side and on the CSV side;
 *   PMQ-07  manifest digest failure, decided before parsing;
 *   PMQ-08  CSV digest failure, decided before any download;
 *   PMQ-09  wrong pipeline commit and wrong mapping count;
 *   PMQ-10  download failures and argument errors are INCONCLUSIVE;
 *   PMQ-11  the output is sanitized and the fingerprints are keyed by the CSV content;
 *   PMQ-12  the utility is self-contained and read-only by its source, its CSV functions are
 *           the gap diagnostic's character for character, and its recorded inputs are the
 *           tracked ones;
 *   PMQ-13  it runs under the Node permission model with read access to two files only;
 *   PMQ-14  the acceptance line is reached only with no override: shown with a copy of the
 *           utility in which the one recorded CSV digest is replaced by a synthetic one, and
 *           with the recorded address answered by the loopback server.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { getGovernedBroadSecurityMaster } from '../src/identity/index.js';
import {
  loadGovernedP7InstrumentRegistry,
  qualifyHoldingSecurityIdentity,
} from '../src/providers/dhan/index.js';

const FOLDER = join(process.cwd(), 'evidence/integration/w04-p7-published-manifest-qualification-2026-11-15');
const UTILITY = join(FOLDER, 'w04-p7-published-manifest-qualification.mjs');
const GAP_DIAGNOSTIC = join(
  process.cwd(),
  'evidence/integration/w04-p7-registry-regeneration-2026-11-15/w04-p7-mapping-gap-diagnostic.mjs'
);
const MANIFEST_PATH = join(process.cwd(), 'evidence/dhan-p7/qualification-manifest.json');

/* The inputs of record, as the Principal stated them for W04-P7. */
const RECORDED = {
  manifestUrl:
    'https://raw.githubusercontent.com/ramkivs/iips-production-market-data/main/evidence/dhan-p7/qualification-manifest.json',
  manifestSha256: '69a918f78791114e8fb036ddfd2a2005facdddf785a7496bc28f541fd4964769',
  pipelineCommit: '325266d684f857a377d55b147e7306e02c7a495a',
  mappings: 4680,
  csvSha256: 'a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107',
  holdings: 64,
};
const ACCEPTANCE_LINE = 'ALL_64_MATCH_PUBLISHED_MANIFEST';

interface Mapping {
  companyId: string;
  isin: string;
  securityId: string;
  exchange: 'NSE' | 'BSE';
  symbol: string;
  exchangeSegment: string;
  dhanSecurityId: string;
  mappingProvenance: string;
  instrumentType: string;
  active?: boolean;
  lastVerifiedAt?: string;
}
interface ManifestRecord {
  disposition: string;
  exchange?: string;
  segment?: string;
  dhanSecurityId?: string;
  isin?: string;
  series?: string;
  companyId?: string;
  securityIdentity?: { securityId: string; isin: string; series: string; isinAuthority: string };
  mapping?: Mapping;
}
interface Manifest {
  pipelineCommit: string;
  totals: { qualified: number; registrySize: number };
  countsByDisposition: Record<string, number>;
  registryEntries: string[];
  records: ManifestRecord[];
}
interface Holding {
  isin: string;
  exchange: 'NSE' | 'BSE';
  symbol: string;
}
interface Row {
  label: string;
  exchange: string;
  verdict: string;
  reason: string;
  publishedMappings: string;
  registryEntry: string;
  isin: string;
  exchangeAgrees: string;
  series: string;
  company: string;
  seriesCode: string;
  otherExchanges: string;
  unexpected: string;
  holdingFp: string;
  mappingFp: string;
}
interface Outcome {
  code: number;
  stdout: string;
  stderr: string;
  result: string;
  rows: Row[];
  json: { conditions: Record<string, string>; unresolved: string[]; [key: string]: unknown } | null;
}

const sha256 = (data: Buffer | string): string => createHash('sha256').update(data).digest('hex');
const trackedBytes = readFileSync(MANIFEST_PATH);
const trackedText = trackedBytes.toString('utf8');
const tracked = JSON.parse(trackedText) as Manifest;
const qualifiedMappings: Mapping[] = tracked.records
  .filter((r) => r.disposition === 'QUALIFIED' && r.mapping)
  .map((r) => r.mapping as Mapping);
const nseMappings = qualifiedMappings.filter((m) => m.exchange === 'NSE');
const bseMappings = qualifiedMappings.filter((m) => m.exchange === 'BSE');
const publishedIsins = new Set(qualifiedMappings.map((m) => m.isin));
const bseIsins = new Set(bseMappings.map((m) => m.isin));

const holdingOf = (m: Mapping): Holding => ({ isin: m.isin, exchange: m.exchange, symbol: m.symbol });

/* 63 NSE holdings and 1 BSE holding, as the original CSV has, taken from the tracked manifest. */
const baseNse = nseMappings.slice(100, 163);
const baseNseIsins = new Set(baseNse.map((m) => m.isin));
const baseBse = bseMappings.filter((m) => !baseNseIsins.has(m.isin)).slice(5, 6);
const baseHoldings: Holding[] = [...baseNse, ...baseBse].map(holdingOf);
/* The holding the mutations aim at: an NSE holding whose ISIN is also published on BSE. */
const target = baseNse.find((m) => bseIsins.has(m.isin)) as Mapping;

/** The CSV text of a set of holdings. Quantities and prices are invented and distinctive. */
function csvOf(holdings: readonly Holding[], extraLines: readonly string[] = []): string {
  const lines = ['Name,Trading Symbol,ISIN,Exchange,Quantity,Avg Cost'];
  holdings.forEach((h, i) => {
    lines.push(`"${h.symbol} SYNTHETIC LIMITED",${h.symbol},${h.isin},${h.exchange},${90000017 + i},${87654 + i}.4321`);
  });
  lines.push(...extraLines);
  return `${lines.join('\r\n')}\r\n`;
}

/** The label rule of the gap diagnostic, restated: ascending SHA-256 of "<ISIN>|<exchange>". */
function labelsOf(holdings: readonly Holding[]): Map<string, Holding> {
  const keyed = holdings.map((h) => ({ h, order: sha256(`${h.isin}|${h.exchange}`) }));
  keyed.sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
  const width = Math.max(2, String(keyed.length).length);
  return new Map(keyed.map((k, index) => [`H${String(index + 1).padStart(width, '0')}`, k.h]));
}
function labelOf(holdings: readonly Holding[], isin: string): string {
  for (const [label, h] of labelsOf(holdings)) if (h.isin === isin) return label;
  throw new Error('holding not found');
}

/** A changed copy of the tracked manifest, as bytes with their digest. */
function mutated(change: (manifest: Manifest) => void): { bytes: Buffer; sha: string } {
  const copy = JSON.parse(trackedText) as Manifest;
  change(copy);
  const bytes = Buffer.from(JSON.stringify(copy), 'utf8');
  return { bytes, sha: sha256(bytes) };
}
function recordOf(manifest: Manifest, isin: string, exchange: string): ManifestRecord {
  const record = manifest.records.find(
    (r) => r.disposition === 'QUALIFIED' && r.mapping?.isin === isin && r.mapping.exchange === exchange
  );
  assert.ok(record, 'the record to change exists');
  return record;
}

/* ------------------------------------------------------------------ the loopback "main ref" */
let server: Server;
let baseUrl = '';
let workDir = '';
const served = { bytes: trackedBytes as Buffer, status: 200, hits: 0 };

function csvFile(name: string, text: string): { file: string; sha: string } {
  const file = join(workDir, name);
  writeFileSync(file, text, 'utf8');
  return { file, sha: sha256(Buffer.from(text, 'utf8')) };
}

function run(
  args: readonly string[],
  nodeArgs: readonly string[] = [],
  utility: string = UTILITY,
  env: NodeJS.ProcessEnv = process.env
): Promise<Outcome> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [...nodeArgs, utility, ...args],
      { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env },
      (error, stdout, stderr) => {
        const exit = error ? (error as { code?: unknown }).code : 0;
        const code = typeof exit === 'number' ? exit : -1;
        const names = [
          'label', 'exchange', 'verdict', 'reason', 'publishedMappings', 'registryEntry', 'isin', 'exchangeAgrees',
          'series', 'company', 'seriesCode', 'otherExchanges', 'unexpected', 'holdingFp', 'mappingFp',
        ] as const;
        const rows = stdout
          .split('\n')
          .filter((l) => l.startsWith('[ROW] '))
          .map((l) => {
            const cells = l.slice('[ROW] '.length).split(' | ');
            assert.equal(cells.length, names.length, 'a row has the announced columns');
            return Object.fromEntries(names.map((n, i) => [n, cells[i]])) as unknown as Row;
          });
        const results = [...stdout.matchAll(/^RESULT: (.+)$/gm)].map((m) => m[1] as string);
        const jsonLine = stdout.split('\n').find((l) => l.startsWith('W04_P7_PUBLISHED_MANIFEST_RESULT_JSON: '));
        resolve({
          code,
          stdout,
          stderr,
          result: results.length === 1 ? (results[0] as string) : `RESULT_LINES_${results.length}`,
          rows,
          json: jsonLine ? JSON.parse(jsonLine.slice('W04_P7_PUBLISHED_MANIFEST_RESULT_JSON: '.length)) : null,
        });
      }
    );
  });
}

/** One run of the base 64 holdings against the bytes given (default: the tracked manifest). */
async function runBase(manifest?: { bytes: Buffer; sha: string }, csv?: { file: string; sha: string }): Promise<Outcome> {
  served.bytes = manifest ? manifest.bytes : trackedBytes;
  served.status = 200;
  const input = csv ?? csvFile('dhan_holdings_synthetic - Copy.csv', csvOf(baseHoldings));
  const args = ['--csv', input.file, '--url', `${baseUrl}/qualification-manifest.json`, '--expected-csv-sha256', input.sha];
  if (manifest) args.push('--expected-manifest-sha256', manifest.sha);
  return run(args);
}

function failedConditions(outcome: Outcome): string[] {
  assert.ok(outcome.json, 'the result JSON line is present');
  return Object.entries(outcome.json.conditions)
    .filter(([id, value]) => value === 'no' && id !== '9')
    .map(([id]) => id);
}

/** Exactly the target row has the verdict and reason; every other row is an exact match. */
function assertOnlyTarget(outcome: Outcome, verdict: string, reason: string): Row {
  const label = labelOf(baseHoldings, target.isin);
  assert.equal(outcome.rows.length, 64);
  const row = outcome.rows.find((r) => r.label === label) as Row;
  assert.equal(row.verdict, verdict, `verdict of the changed holding (${outcome.stdout.slice(-600)})`);
  assert.equal(row.reason, reason);
  for (const other of outcome.rows) {
    if (other.label === label) continue;
    assert.equal(other.verdict, 'MATCH');
    assert.equal(other.reason, 'EXACT_PUBLISHED_MAPPING');
  }
  assert.equal(outcome.result, 'NOT_ALL_MATCH');
  assert.equal(outcome.code, 1);
  assert.ok(!outcome.stdout.includes(ACCEPTANCE_LINE));
  assert.equal(outcome.stderr, '');
  return row;
}

describe('W04-P7 published-manifest qualification utility (synthetic holdings, loopback manifest)', () => {
  before(async () => {
    workDir = mkdtempSync(join(tmpdir(), 'w04-p7-pmq-'));
    server = createServer((_request, response) => {
      served.hits += 1;
      response.writeHead(served.status, { 'content-type': 'text/plain; charset=utf-8', 'content-length': served.bytes.length });
      response.end(served.bytes);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(workDir, { recursive: true, force: true });
  });

  it('PMQ-01 64 synthetic holdings are exact members of the tracked manifest; overridden inputs never print the acceptance line', async () => {
    assert.equal(sha256(trackedBytes), RECORDED.manifestSha256, 'the tracked manifest is the recorded one');
    assert.equal(baseHoldings.length, 64);
    assert.equal(baseHoldings.filter((h) => h.exchange === 'NSE').length, 63);

    const outcome = await runBase();
    assert.equal(outcome.stderr, '');
    assert.equal(outcome.rows.length, 64);
    for (const row of outcome.rows) {
      assert.deepEqual(
        [row.verdict, row.reason, row.publishedMappings, row.registryEntry, row.isin, row.exchangeAgrees, row.series, row.company, row.unexpected],
        ['MATCH', 'EXACT_PUBLISHED_MAPPING', '1', 'yes', 'yes', 'yes', 'yes', 'yes', '0']
      );
    }
    /* A label is the holding the rule names: exchange and series agree with the manifest. */
    const labels = labelsOf(baseHoldings);
    for (const row of outcome.rows) {
      const holding = labels.get(row.label) as Holding;
      const mapping = qualifiedMappings.find((m) => m.isin === holding.isin && m.exchange === holding.exchange) as Mapping;
      assert.equal(row.exchange, holding.exchange);
      assert.equal(row.seriesCode, mapping.securityId.split(':')[2]);
    }
    assert.deepEqual(failedConditions(outcome), [], 'conditions 1 to 8 hold');
    assert.equal(outcome.json?.conditions['9'], 'no', 'condition 9 (recorded inputs) does not hold for synthetic inputs');
    assert.equal(outcome.result, 'ALL_MATCH_NOT_RECORDED_INPUTS');
    assert.equal(outcome.code, 3);
    assert.ok(!outcome.stdout.includes(ACCEPTANCE_LINE), 'the acceptance line is reserved for the recorded inputs');
    assert.match(outcome.stdout, /\[PASS\] manifest\.sha256: .*verified before parsing.*: yes/);
    assert.match(outcome.stdout, /\[INFO\] aggregate\.verdict: 64 holding\(s\): MATCH 64/);
  });

  it('PMQ-02 every published mapping: the utility says MATCH where the real runtime qualification says QUALIFIED, with the same series', async () => {
    const master = getGovernedBroadSecurityMaster();
    const registry = loadGovernedP7InstrumentRegistry();
    assert.equal(registry.list().length, RECORDED.mappings);
    served.bytes = trackedBytes;
    served.status = 200;

    let compared = 0;
    for (const [name, mappings] of [['all-nse.csv', nseMappings], ['all-bse.csv', bseMappings]] as const) {
      const holdings = mappings.map(holdingOf);
      const csv = csvFile(name, csvOf(holdings));
      const outcome = await run([
        '--csv', csv.file, '--url', `${baseUrl}/m.json`, '--expected-csv-sha256', csv.sha, '--expected-holdings', String(holdings.length),
      ]);
      assert.equal(outcome.stderr, '');
      assert.equal(outcome.result, 'ALL_MATCH_NOT_RECORDED_INPUTS');
      assert.equal(outcome.rows.length, holdings.length);
      const labels = labelsOf(holdings);
      for (const row of outcome.rows) {
        const holding = labels.get(row.label) as Holding;
        const real = qualifyHoldingSecurityIdentity({ isin: holding.isin, exchange: holding.exchange, symbol: holding.symbol }, master, registry);
        assert.equal(real.status, 'QUALIFIED');
        assert.equal(row.verdict, 'MATCH');
        if (real.status === 'QUALIFIED') {
          assert.equal(row.seriesCode, real.securityIdentity.series);
          assert.equal(row.exchange, real.exchange);
        }
        compared += 1;
      }
    }
    assert.equal(compared, RECORDED.mappings, 'all 4,680 published mappings were compared');
  });

  it('PMQ-03 negative holdings: neither the utility nor the real runtime qualification accepts them', async () => {
    const master = getGovernedBroadSecurityMaster();
    const registry = loadGovernedP7InstrumentRegistry();
    const nseOnly = nseMappings.filter((m) => !bseIsins.has(m.isin)).slice(0, 20);
    assert.equal(nseOnly.length, 20);
    const onTheOtherExchange: Holding[] = nseOnly.map((m) => ({ isin: m.isin, exchange: 'BSE', symbol: m.symbol }));
    const unpublished: Holding[] = Array.from({ length: 20 }, (_, i) => ({
      isin: `INEZZZ${String(i).padStart(2, '0')}Z019`, exchange: i % 2 === 0 ? 'NSE' : 'BSE', symbol: `SYNTHETIC${i}`,
    }));
    for (const h of unpublished) assert.ok(!publishedIsins.has(h.isin));
    const malformed: Holding[] = [
      { isin: 'INE12345', exchange: 'NSE', symbol: 'SYNSHORT' },
      { isin: 'INE0000000001', exchange: 'NSE', symbol: 'SYNLONG' },
      { isin: 'INE-0000-001', exchange: 'BSE', symbol: 'SYNDASH' },
    ];
    const holdings = [...onTheOtherExchange, ...unpublished, ...malformed];
    const csv = csvFile('negatives.csv', csvOf(holdings));
    served.bytes = trackedBytes;
    served.status = 200;
    const outcome = await run([
      '--csv', csv.file, '--url', `${baseUrl}/m.json`, '--expected-csv-sha256', csv.sha, '--expected-holdings', String(holdings.length),
    ]);
    assert.equal(outcome.result, 'NOT_ALL_MATCH');
    assert.equal(outcome.code, 1);
    assert.equal(outcome.rows.length, holdings.length);
    const labels = labelsOf(holdings);
    const pairs: Record<string, number> = {};
    for (const row of outcome.rows) {
      const holding = labels.get(row.label) as Holding;
      const real = qualifyHoldingSecurityIdentity({ isin: holding.isin, exchange: holding.exchange }, master, registry);
      assert.equal(real.status, 'UNRESOLVED');
      assert.notEqual(row.verdict, 'MATCH');
      const pair = `${real.status === 'UNRESOLVED' ? real.reason : 'QUALIFIED'} -> ${row.verdict}/${row.reason}`;
      pairs[pair] = (pairs[pair] ?? 0) + 1;
    }
    /* The utility has no P04 master: where the runtime names a P04 reason, the utility reports
     * that the published registry has no mapping. Both refuse. */
    assert.deepEqual(pairs, {
      'INACTIVE_OR_MISSING_LISTING -> MISSING/MISSING_P7_MAPPING': 20,
      'MISSING_P04_CORRESPONDENCE -> MISSING/MISSING_P7_MAPPING': 20,
      'INVALID_ISIN_SYNTAX -> NOT_COMPARABLE/INVALID_ISIN_SYNTAX': 3,
    });
    assert.deepEqual(failedConditions(outcome), ['5', '6', '7']);
  });

  it('PMQ-04 a missing mapping is reported as MISSING, for a removed record and for an unpublished holding', async () => {
    /* (a) the published manifest lacks the record and the entry of one holding. */
    const removed = mutated((m) => {
      const record = recordOf(m, target.isin, 'NSE');
      m.records.splice(m.records.indexOf(record), 1);
      m.registryEntries = m.registryEntries.filter((e) => e !== `${target.companyId}|NSE_EQ|${target.securityId}`);
    });
    const a = await runBase(removed);
    const row = assertOnlyTarget(a, 'MISSING', 'MISSING_P7_MAPPING');
    assert.deepEqual([row.publishedMappings, row.registryEntry, row.mappingFp, row.otherExchanges], ['0', 'n/a', 'none', 'BSE']);
    assert.deepEqual(failedConditions(a), ['4', '5', '6', '7']);
    assert.match(a.stdout, /\[FAIL\] registry\.count\.records: the manifest holds 4680 QUALIFIED records \(found 4679\): no/);
    assert.match(a.stdout, /\[INFO\] aggregate\.exceptions: missing 1; ambiguous 0; mismatched 0; not comparable 0; unexpected entries 0/);

    /* (b) the manifest is intact; one holding of the CSV is not published. */
    const holdings: Holding[] = [...baseHoldings.slice(0, 63), { isin: 'INEZZZ77Z019', exchange: 'NSE', symbol: 'SYNTHETICX' }];
    const b = await runBase(undefined, csvFile('one-unpublished.csv', csvOf(holdings)));
    assert.equal(b.result, 'NOT_ALL_MATCH');
    assert.equal(b.code, 1);
    const missing = b.rows.filter((r) => r.verdict !== 'MATCH');
    assert.equal(missing.length, 1);
    assert.equal((missing[0] as Row).label, labelOf(holdings, 'INEZZZ77Z019'));
    assert.deepEqual([(missing[0] as Row).verdict, (missing[0] as Row).reason], ['MISSING', 'MISSING_P7_MAPPING']);
    assert.deepEqual(failedConditions(b), ['5', '6', '7']);
  });

  it('PMQ-05 a mismatch is reported in the dimension it occurs in', async () => {
    const cases: Array<{ name: string; reason: string; column: keyof Row | null; change: (m: Manifest) => void }> = [
      { name: 'record series', reason: 'SERIES_DISAGREES', column: 'series', change: (m) => { recordOf(m, target.isin, 'NSE').series = 'BE'; } },
      {
        name: 'identity series', reason: 'SERIES_DISAGREES', column: 'series',
        change: (m) => { (recordOf(m, target.isin, 'NSE').securityIdentity as { series: string }).series = 'BE'; },
      },
      { name: 'record company', reason: 'COMPANY_DISAGREES', column: 'company', change: (m) => { recordOf(m, target.isin, 'NSE').companyId = 'EQ_SYNTHETIC_IN'; } },
      {
        name: 'mapping company', reason: 'COMPANY_DISAGREES', column: 'company',
        change: (m) => { (recordOf(m, target.isin, 'NSE').mapping as Mapping).companyId = 'EQ_SYNTHETIC_IN'; },
      },
      {
        name: 'mapping exchange', reason: 'EXCHANGE_DISAGREES', column: 'exchangeAgrees',
        change: (m) => { (recordOf(m, target.isin, 'NSE').mapping as Mapping).exchange = 'BSE'; },
      },
      { name: 'record exchange', reason: 'EXCHANGE_DISAGREES', column: 'exchangeAgrees', change: (m) => { recordOf(m, target.isin, 'NSE').exchange = 'BSE'; } },
      { name: 'record ISIN', reason: 'ISIN_DISAGREES', column: 'isin', change: (m) => { recordOf(m, target.isin, 'NSE').isin = 'INEZZZ77Z019'; } },
      {
        name: 'identity ISIN', reason: 'ISIN_DISAGREES', column: 'isin',
        change: (m) => { (recordOf(m, target.isin, 'NSE').securityIdentity as { isin: string }).isin = 'INEZZZ77Z019'; },
      },
      {
        name: 'entry not listed', reason: 'NOT_IN_REGISTRY_ENTRIES', column: 'registryEntry',
        change: (m) => { m.registryEntries = m.registryEntries.filter((e) => e !== `${target.companyId}|NSE_EQ|${target.securityId}`); },
      },
      {
        name: 'unexpected listed entry', reason: 'UNEXPECTED_ENTRIES', column: null,
        change: (m) => { m.registryEntries.push(`${target.companyId}|NSE_EQ|ISIN:${target.isin}:BE`); },
      },
      {
        name: 'inactive mapping', reason: 'INACTIVE_OR_MISSING_LISTING', column: null,
        change: (m) => { (recordOf(m, target.isin, 'NSE').mapping as Mapping).active = false; },
      },
      {
        name: 'no verification instant', reason: 'STALE_SOURCE_EVIDENCE', column: null,
        change: (m) => { delete (recordOf(m, target.isin, 'NSE').mapping as Mapping).lastVerifiedAt; },
      },
    ];
    for (const c of cases) {
      const outcome = await runBase(mutated(c.change));
      const row = assertOnlyTarget(outcome, 'MISMATCH', c.reason);
      if (c.column) assert.equal(row[c.column], 'no', `${c.name}: the column says no`);
      if (c.reason === 'UNEXPECTED_ENTRIES') assert.equal(row.unexpected, '1');
      const failed = failedConditions(outcome);
      assert.ok(failed.includes('7'), `${c.name}: condition 7 fails`);
      assert.ok(failed.includes('5'), `${c.name}: condition 5 fails`);
    }
  });

  it('PMQ-06 duplicate and ambiguous mappings are refused, on the manifest side and on the CSV side', async () => {
    const clone = (m: Manifest, change: (r: ManifestRecord) => void): void => {
      const copy = JSON.parse(JSON.stringify(recordOf(m, target.isin, 'NSE'))) as ManifestRecord;
      change(copy);
      m.records.push(copy);
      const mapping = copy.mapping as Mapping;
      const entry = `${mapping.companyId}|${mapping.exchangeSegment}|${mapping.securityId}`;
      if (!m.registryEntries.includes(entry)) m.registryEntries.push(entry);
    };

    /* (a) a second series of the same security on the same exchange. */
    const secondSeries = await runBase(mutated((m) => clone(m, (r) => {
      const mapping = r.mapping as Mapping;
      mapping.securityId = `ISIN:${target.isin}:BE`;
      mapping.dhanSecurityId = 'SYNTHETIC-1';
      r.series = 'BE';
      r.securityIdentity = { securityId: mapping.securityId, isin: target.isin, series: 'BE', isinAuthority: 'NON_AUTHORITATIVE' };
    })));
    const a = assertOnlyTarget(secondSeries, 'AMBIGUOUS', 'AMBIGUOUS_PROVIDER_MAPPING');
    assert.deepEqual([a.publishedMappings, a.seriesCode, a.mappingFp], ['2', 'BE+EQ', 'none']);
    assert.match(secondSeries.stdout, /ambiguous 1;/);

    /* (b) the same ISIN on the same exchange under a second company. */
    const secondCompany = await runBase(mutated((m) => clone(m, (r) => {
      (r.mapping as Mapping).companyId = 'EQ_SYNTHETIC_IN';
      (r.mapping as Mapping).dhanSecurityId = 'SYNTHETIC-2';
      r.companyId = 'EQ_SYNTHETIC_IN';
    })));
    const b = assertOnlyTarget(secondCompany, 'AMBIGUOUS', 'AMBIGUOUS_PROVIDER_MAPPING');
    assert.equal(b.publishedMappings, '2');

    /* (c) the same record twice: the registry class accepts the repeat, this utility does not. */
    const twice = await runBase(mutated((m) => clone(m, () => undefined)));
    const c = assertOnlyTarget(twice, 'MISMATCH', 'UNEXPECTED_ENTRIES');
    assert.equal(c.unexpected, '1');
    assert.match(twice.stdout, /\[FAIL\] registry\.count\.records: the manifest holds 4680 QUALIFIED records \(found 4681\): no/);

    /* (d) a record the registry class would refuse: two securities on one provider instrument. */
    const reused = await runBase(mutated((m) => clone(m, (r) => {
      const mapping = r.mapping as Mapping;
      mapping.securityId = `ISIN:${target.isin}:BE`;
      r.series = 'BE';
      r.securityIdentity = { securityId: mapping.securityId, isin: target.isin, series: 'BE', isinAuthority: 'NON_AUTHORITATIVE' };
    })));
    assert.equal(reused.result, 'NOT_ALL_MATCH');
    assert.match(reused.stdout, /records the registry class would refuse 1 \(SECURITY_ID_REUSED 1\)/);
    assert.ok(failedConditions(reused).includes('4'));

    /* (e) CSV: the same holding on two rows is one holding, as the mapper groups it. */
    const first = baseHoldings[0] as Holding;
    const repeated = await runBase(
      undefined,
      csvFile('row-twice.csv', csvOf(baseHoldings, [`"${first.symbol} SYNTHETIC LIMITED",${first.symbol},${first.isin},${first.exchange},5,6.5`]))
    );
    assert.equal(repeated.result, 'ALL_MATCH_NOT_RECORDED_INPUTS');
    assert.equal(repeated.rows.length, 64);
    assert.match(repeated.stdout, /data rows 65; holdings after the mapper's grouping 64/);
    assert.match(repeated.stdout, /holdings formed from more than one row 1/);

    /* (f) CSV: one ISIN on rows that name two exchanges is ambiguous on the holding's side. */
    const twoExchanges = await runBase(
      undefined,
      csvFile('two-exchanges.csv', csvOf(baseHoldings, [`"${target.symbol} SYNTHETIC LIMITED",${target.symbol},${target.isin},BSE,5,6.5`]))
    );
    assert.equal(twoExchanges.result, 'NOT_ALL_MATCH');
    assert.equal(twoExchanges.code, 1);
    assert.match(twoExchanges.stdout, /\[FAIL\] csv\.oneExchangePerHolding: .*\(1 such holdings\): no/);
    assert.deepEqual(failedConditions(twoExchanges), ['7']);
  });

  it('PMQ-07 a manifest with another digest stops the run before a byte is parsed', async () => {
    const other = mutated((m) => { m.registryEntries.push('EQ_SYNTHETIC_IN|NSE_EQ|ISIN:INEZZZ77Z019:EQ'); });
    served.bytes = other.bytes;
    served.status = 200;
    const csv = csvFile('digest.csv', csvOf(baseHoldings));
    const args = ['--csv', csv.file, '--url', `${baseUrl}/m.json`, '--expected-csv-sha256', csv.sha];

    const wrong = await run(args);
    assert.equal(wrong.result, 'FAILED_PRECONDITION');
    assert.equal(wrong.code, 1);
    assert.equal(wrong.rows.length, 0, 'no holding was compared');
    assert.match(wrong.stdout, /\[FAIL\] manifest\.sha256: .*: no/);
    assert.match(wrong.stdout, /\[STOP\] MANIFEST_SHA256_NOT_EXPECTED at step: 2\./);
    assert.ok(wrong.stdout.includes(`[EVIDENCE] expected ${RECORDED.manifestSha256}`));
    assert.ok(wrong.stdout.includes(`[EVIDENCE] downloaded ${other.sha}`));
    assert.ok(wrong.stdout.includes('[EVIDENCE] the bytes were not parsed'));
    assert.deepEqual(failedConditions(wrong), ['2']);
    assert.deepEqual([wrong.json?.conditions['3'], wrong.json?.conditions['5']], ['NOT_EVALUATED', 'NOT_EVALUATED']);
    assert.ok(!wrong.stdout.includes(ACCEPTANCE_LINE));

    /* Bytes that are not JSON at all: the digest decides, the parser is never reached. */
    served.bytes = Buffer.from('<html>not the manifest</html>', 'utf8');
    const garbage = await run(args);
    assert.equal(garbage.result, 'FAILED_PRECONDITION');
    assert.match(garbage.stdout, /\[STOP\] MANIFEST_SHA256_NOT_EXPECTED/);
    assert.ok(!garbage.stdout.includes('MANIFEST_NOT_JSON'));

    /* With the digest of those bytes given as expected, the parser is reached and refuses them. */
    const notJson = await run([...args, '--expected-manifest-sha256', sha256(served.bytes)]);
    assert.equal(notJson.result, 'FAILED_PRECONDITION');
    assert.match(notJson.stdout, /\[STOP\] MANIFEST_NOT_JSON/);
  });

  it('PMQ-08 a CSV with another digest stops the run before any download', async () => {
    served.bytes = trackedBytes;
    served.status = 200;
    const csv = csvFile('not-the-original.csv', csvOf(baseHoldings));
    const hits = served.hits;
    const outcome = await run(['--csv', csv.file, '--url', `${baseUrl}/m.json`]);
    assert.equal(outcome.result, 'FAILED_PRECONDITION');
    assert.equal(outcome.code, 1);
    assert.match(outcome.stdout, /\[STOP\] CSV_SHA256_NOT_EXPECTED at step: 1\./);
    assert.ok(outcome.stdout.includes(`[EVIDENCE] expected ${RECORDED.csvSha256}`));
    assert.ok(outcome.stdout.includes(`[EVIDENCE] actual ${csv.sha}`));
    assert.equal(served.hits, hits, 'no request was made');
    assert.equal(outcome.rows.length, 0);
    assert.deepEqual(failedConditions(outcome), ['1']);
  });

  it('PMQ-09 a wrong pipeline commit and a wrong mapping count fail their conditions', async () => {
    const commit = await runBase(mutated((m) => { m.pipelineCommit = '0000000000000000000000000000000000000000'; }));
    assert.equal(commit.result, 'NOT_ALL_MATCH');
    assert.deepEqual(failedConditions(commit), ['3']);
    assert.match(commit.stdout, /\[INFO\] manifest\.pipelineCommit: 0{40}/);
    assert.equal(commit.rows.filter((r) => r.verdict === 'MATCH').length, 64, 'the holdings are still compared and reported');

    const stated = await runBase(mutated((m) => { m.totals.qualified = 96; m.totals.registrySize = 96; m.countsByDisposition.QUALIFIED = 96; }));
    assert.equal(stated.result, 'NOT_ALL_MATCH');
    assert.deepEqual(failedConditions(stated), ['4']);
    assert.match(stated.stdout, /\[FAIL\] manifest\.count\.stated: .*totals\.qualified 96; totals\.registrySize 96; countsByDisposition\.QUALIFIED 96\): no/);

    /* A mapping no holding uses is removed: every holding still matches, the count does not. */
    const unused = nseMappings.find((m) => !baseNseIsins.has(m.isin) && !baseBse.some((b) => b.isin === m.isin)) as Mapping;
    const fewer = await runBase(mutated((m) => {
      m.records.splice(m.records.indexOf(recordOf(m, unused.isin, 'NSE')), 1);
      m.registryEntries = m.registryEntries.filter((e) => e !== `${unused.companyId}|NSE_EQ|${unused.securityId}`);
    }));
    assert.equal(fewer.result, 'NOT_ALL_MATCH');
    assert.equal(fewer.rows.filter((r) => r.verdict === 'MATCH').length, 64);
    assert.deepEqual(failedConditions(fewer), ['4']);
  });

  it('PMQ-10 download failures and argument errors are INCONCLUSIVE and compare nothing', async () => {
    const csv = csvFile('inconclusive.csv', csvOf(baseHoldings));
    served.bytes = trackedBytes;
    served.status = 404;
    const notFound = await run(['--csv', csv.file, '--url', `${baseUrl}/m.json`, '--expected-csv-sha256', csv.sha]);
    served.status = 200;
    assert.equal(notFound.result, 'INCONCLUSIVE');
    assert.equal(notFound.code, 2);
    assert.match(notFound.stdout, /\[STOP\] MANIFEST_DOWNLOAD_HTTP_STATUS/);
    assert.ok(notFound.stdout.includes('[EVIDENCE] HTTP status 404'));

    const refused = await run(['--csv', csv.file, '--url', 'http://127.0.0.1:1/m.json', '--expected-csv-sha256', csv.sha]);
    assert.equal(refused.result, 'INCONCLUSIVE');
    assert.equal(refused.code, 2);
    assert.match(refused.stdout, /\[STOP\] MANIFEST_DOWNLOAD_FAILED/);
    assert.match(refused.stdout, /\[EVIDENCE\] cause [A-Z][A-Z0-9_]+\n/);

    for (const [args, code] of [
      [[], 'ARGUMENT_CSV_MISSING'],
      [['--csv'], 'ARGUMENT_VALUE_MISSING'],
      [['--csv', csv.file, '--ipd-root', '.'], 'ARGUMENT_UNKNOWN'],
      [['--csv', csv.file, '--url', 'http://example.invalid/m.json'], 'ARGUMENT_URL_NOT_ALLOWED'],
      [['--csv', csv.file, '--url', 'file:///m.json'], 'ARGUMENT_URL_NOT_ALLOWED'],
      [['--csv', csv.file, '--expected-manifest-sha256', 'abc'], 'ARGUMENT_EXPECTED_DIGEST_NOT_SHA256'],
      [['--csv', join(workDir, 'absent.csv')], 'CSV_FILE_NOT_FOUND'],
    ] as const) {
      const outcome = await run(args);
      assert.equal(outcome.result, 'INCONCLUSIVE', code);
      assert.equal(outcome.code, 2, code);
      assert.ok(outcome.stdout.includes(`[STOP] ${code} at step:`), code);
      assert.equal(outcome.rows.length, 0);
      assert.equal(outcome.stderr, '');
    }
  });

  it('PMQ-11 the output is sanitized, and the fingerprints are keyed by the content of the CSV', async () => {
    const ok = await runBase();
    const broken = await runBase(mutated((m) => { recordOf(m, target.isin, 'NSE').series = 'BE'; }));
    const all = `${ok.stdout}\n${broken.stdout}`;

    for (const m of qualifiedMappings) {
      assert.ok(!all.includes(m.isin), 'no ISIN of the published registry is printed');
      assert.ok(!all.includes(m.companyId), 'no company identifier of the published registry is printed');
    }
    const tokens = new Set(all.split(/[^A-Za-z0-9&_-]+/));
    for (const h of baseHoldings) {
      if (h.symbol.length >= 4) assert.ok(!tokens.has(h.symbol), 'no symbol of a holding is printed');
    }
    for (const forbidden of ['SYNTHETIC LIMITED', 'synthetic - Copy', 'dhan_holdings', workDir, '.4321']) {
      assert.ok(!all.includes(forbidden), `the output does not contain "${forbidden}"`);
    }
    assert.ok(![...tokens].some((token) => /^900000\d\d$/.test(token)), 'no quantity of a holding is printed');
    assert.ok(!/ISIN:[A-Za-z0-9]/.test(all), 'no security identifier is printed');
    assert.ok(!/\|(NSE|BSE)_EQ\|/.test(all), 'no registry entry is printed');
    for (const row of [...ok.rows, ...broken.rows]) {
      assert.match(row.holdingFp, /^[0-9a-f]{16}$/);
      assert.match(row.mappingFp, /^[0-9a-f]{16}$/);
    }
    assert.equal(new Set(ok.rows.map((r) => r.holdingFp)).size, 64, 'holding fingerprints are distinct');
    assert.equal(new Set(ok.rows.map((r) => r.mappingFp)).size, 64, 'mapping fingerprints are distinct');

    /* The same inputs give the same fingerprints. */
    const again = await runBase();
    assert.deepEqual(again.rows, ok.rows);
    assert.equal(again.stdout, ok.stdout, 'the whole output is deterministic');

    /* A plain hash of the identifiers would be reversible from a public ISIN list. These are not plain hashes. */
    const labels = labelsOf(baseHoldings);
    for (const row of ok.rows) {
      const h = labels.get(row.label) as Holding;
      assert.notEqual(row.holdingFp, sha256(`${h.isin}|${h.exchange}`).slice(0, 16));
    }

    /* Another CSV with the same identifiers (one quantity differs) has other fingerprints and the same labels. */
    const otherCsv = csvFile('other-quantity.csv', csvOf(baseHoldings).replace('90000017', '90000018'));
    const other = await runBase(undefined, otherCsv);
    assert.equal(other.result, 'ALL_MATCH_NOT_RECORDED_INPUTS');
    assert.deepEqual(other.rows.map((r) => [r.label, r.exchange, r.verdict]), ok.rows.map((r) => [r.label, r.exchange, r.verdict]));
    for (let i = 0; i < 64; i += 1) {
      assert.notEqual((other.rows[i] as Row).holdingFp, (ok.rows[i] as Row).holdingFp);
      assert.notEqual((other.rows[i] as Row).mappingFp, (ok.rows[i] as Row).mappingFp);
    }
  });

  it('PMQ-12 the utility is one self-contained, read-only file; its CSV functions are the gap diagnostic\'s; its recorded inputs are the tracked ones', () => {
    assert.deepEqual(readdirSync(FOLDER).filter((name) => name.endsWith('.mjs')), ['w04-p7-published-manifest-qualification.mjs']);
    const source = readFileSync(UTILITY, 'utf8');
    assert.ok(!/[^\x00-\x7f]/.test(source), 'ASCII only');
    assert.ok(!source.includes('\r'), 'LF line endings');

    /* Imports: two built-ins, read functions only. */
    const imports = [...source.matchAll(/^import\s+(.+?)\s+from\s+'([^']+)';$/gm)].map((m) => [m[1], m[2]]);
    assert.deepEqual(imports, [
      ['{ createHash, createHmac }', 'node:crypto'],
      ['{ closeSync, existsSync, openSync, readFileSync, statSync }', 'node:fs'],
    ]);
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/process\.stdout\.write\(/g, 'STDOUT(');
    assert.equal([...code.matchAll(/^import /gm)].length, 2, 'no further static import');
    assert.ok(!/\bimport\s*\(/.test(code), 'no dynamic import');
    for (const call of [
      /\b(writeFile|appendFile|createWriteStream|mkdir|mkdtemp|rm|rmdir|unlink|rename|copyFile|cp|truncate|ftruncate|chmod|chown|symlink|link|utimes|write|writev)(Sync)?\s*\(/,
      /\brequire\s*\(/, /\beval\s*\(/, /\bnew Function\b/, /\bprocess\.(env|chdir|kill|exit)\b/, /\bWebSocket\b/, /\bXMLHttpRequest\b/,
      /child_process|worker_threads|node:net|node:http|node:https|node:dgram|node:sqlite|node:vm/,
    ]) {
      assert.ok(!call.test(code), `the source has no ${call}`);
    }
    const opens = [...source.matchAll(/openSync\(([^)]*)\)/g)].map((m) => m[1]);
    assert.deepEqual(opens, ["file, 'r'"], 'the only open call is read-only');
    assert.equal([...source.matchAll(/\bfetch\s*\(/g)].length, 1, 'exactly one network call');
    assert.match(source, /fetch\(options\.url, \{ method: 'GET', redirect: 'error'/);

    /* The acceptance line is printed in one place, behind the no-override test. */
    const acceptance = [...source.matchAll(/finish\('ALL_64_MATCH_PUBLISHED_MANIFEST'/g)];
    assert.equal(acceptance.length, 1);
    assert.match(source, /else if \(options\.overrides\.length === 0 && options\.expectedHoldings === RECORDED\.holdings\) finish\('ALL_64_MATCH_PUBLISHED_MANIFEST', 0, options, payload\);/);

    /* The CSV functions and the label rule are the gap diagnostic's, character for character. */
    const diagnostic = readFileSync(GAP_DIAGNOSTIC, 'utf8');
    const block = (text: string, from: string, to: string): string => {
      const start = text.indexOf(from);
      const end = text.indexOf(to, start);
      assert.ok(start >= 0 && end > start, `block ${from} found`);
      return text.slice(start, end + to.length);
    };
    assert.equal(block(source, ' * PORT BEGIN', ' * PORT END'), block(diagnostic, ' * PORT BEGIN', ' * PORT END'));
    const labelRule = block(diagnostic, '  /* Labels: ascending SHA-256', "    g.label = `H${String(index + 1).padStart(width, '0')}`;\n  });");
    assert.ok(labelRule.includes('keyed.sort('));
    assert.ok(source.includes(labelRule), 'the label rule is the same text');
    const digestRule = block(diagnostic, "  const hasBom = bytes.length >= 3", '  const text = keepBom ? textWithBom : textWithoutBom;');
    assert.ok(source.includes(digestRule), 'the import-content digest is computed by the same text');

    /* The recorded inputs in the source are the tracked ones. */
    for (const value of [RECORDED.manifestUrl, RECORDED.manifestSha256, RECORDED.pipelineCommit, RECORDED.csvSha256]) {
      assert.ok(source.includes(`'${value}'`), 'the recorded value is in the source');
    }
    assert.match(source, /\n {2}mappings: 4680,\n/);
    assert.match(source, /\n {2}holdings: 64,\n/);
    assert.equal(tracked.pipelineCommit, RECORDED.pipelineCommit);
    assert.equal(tracked.totals.qualified, RECORDED.mappings);
    assert.equal(tracked.registryEntries.length, RECORDED.mappings);
  });

  it('PMQ-13 it runs under the Node permission model with read access to the utility and the CSV only', async (t) => {
    if (!process.allowedNodeEnvironmentFlags.has('--permission')) {
      t.skip('this Node has no --permission flag');
      return;
    }
    served.bytes = trackedBytes;
    served.status = 200;
    const csv = csvFile('permission model - Copy.csv', csvOf(baseHoldings));
    const csvBefore = readFileSync(csv.file);
    const args = ['--csv', csv.file, '--url', `${baseUrl}/m.json`, '--expected-csv-sha256', csv.sha];
    const plain = await run(args);
    /* Node 25 and later also restrict the network under the model; earlier versions have no such flag. */
    const network = process.allowedNodeEnvironmentFlags.has('--allow-net') ? ['--allow-net'] : [];
    const restricted = await run(args, ['--permission', ...network, `--allow-fs-read=${UTILITY}`, `--allow-fs-read=${csv.file}`]);
    assert.equal(restricted.stderr, '');
    assert.equal(restricted.result, 'ALL_MATCH_NOT_RECORDED_INPUTS');
    assert.match(restricted.stdout, /\[INFO\] readOnly\.permissionModel: Node permission model: ACTIVE_WRITE_DENIED/);
    assert.match(plain.stdout, /\[INFO\] readOnly\.permissionModel: Node permission model: NOT_ACTIVE/);
    assert.deepEqual(restricted.rows, plain.rows);
    assert.ok(csvBefore.equals(readFileSync(csv.file)), 'the CSV is unchanged');
    assert.deepEqual(readdirSync(workDir).filter((name) => name.includes('permission')), ['permission model - Copy.csv'], 'nothing was created beside it');

    /* Without read access to the CSV the model refuses the read and nothing is compared. */
    const denied = await run(args, ['--permission', ...network, `--allow-fs-read=${UTILITY}`]);
    assert.equal(denied.result, 'INCONCLUSIVE');
    assert.match(denied.stdout, /\[STOP\] CSV_FILE_READ_NOT_PERMITTED/);
  });

  it('PMQ-14 with no override, the recorded address and the recorded manifest digest, the run ends with the acceptance line', async () => {
    served.bytes = trackedBytes;
    served.status = 200;
    const csv = csvFile('acceptance-shape.csv', csvOf(baseHoldings));

    /* A copy of the utility that differs in ONE constant: the recorded CSV digest. The original
     * CSV is not in the repository, so the unchanged utility cannot be given a CSV it accepts. */
    const source = readFileSync(UTILITY, 'utf8');
    const recordedLine = `  csvSha256: '${RECORDED.csvSha256}',\n`;
    assert.equal(source.split(recordedLine).length, 2, 'the recorded CSV digest is stated once');
    const copy = join(workDir, 'w04-p7-published-manifest-qualification.mjs');
    writeFileSync(copy, source.replace(recordedLine, `  csvSha256: '${csv.sha}',\n`), 'utf8');

    /* The recorded address is not reachable from a test. A preload answers it from the loopback
     * server; the utility itself is given no --url and therefore reports no override. */
    const preload = join(workDir, 'answer-the-recorded-address.mjs');
    writeFileSync(
      preload,
      [
        'const real = globalThis.fetch;',
        `const recorded = ${JSON.stringify(RECORDED.manifestUrl)};`,
        'globalThis.fetch = (url, init) => real(String(url) === recorded ? process.env.PMQ_LOOPBACK_URL : url, init);',
        '',
      ].join('\n'),
      'utf8'
    );
    const env = { ...process.env, PMQ_LOOPBACK_URL: `${baseUrl}/m.json` };
    const nodeArgs = ['--import', `file://${preload}`];

    const accepted = await run(['--csv', csv.file], nodeArgs, copy, env);
    assert.equal(accepted.stderr, '');
    assert.equal(accepted.result, ACCEPTANCE_LINE);
    assert.equal(accepted.code, 0);
    assert.equal(accepted.rows.length, 64);
    assert.ok(accepted.rows.every((r) => r.verdict === 'MATCH'));
    assert.ok(Object.values(accepted.json?.conditions ?? {}).every((value) => value === 'yes'), 'all nine conditions hold');
    assert.match(accepted.stdout, /\[INFO\] inputs: the recorded inputs are in force \(no override\)/);
    assert.ok(accepted.stdout.includes(`[INFO] manifest.url: ${RECORDED.manifestUrl}`));
    assert.match(accepted.stdout, /failed conditions: none\n/);

    /* The same copy and the same address, with one mismatching holding: not the acceptance line. */
    const broken = mutated((m) => { recordOf(m, target.isin, 'NSE').series = 'BE'; });
    served.bytes = broken.bytes;
    const refused = await run(['--csv', csv.file], nodeArgs, copy, env);
    served.bytes = trackedBytes;
    assert.equal(refused.result, 'FAILED_PRECONDITION', 'other bytes at the recorded address fail the recorded digest');
    assert.ok(!refused.stdout.includes(ACCEPTANCE_LINE));

    /* The unchanged utility refuses the synthetic CSV outright. */
    const unchanged = await run(['--csv', csv.file], nodeArgs, UTILITY, env);
    assert.equal(unchanged.result, 'FAILED_PRECONDITION');
    assert.match(unchanged.stdout, /\[STOP\] CSV_SHA256_NOT_EXPECTED/);
    assert.ok(!unchanged.stdout.includes(ACCEPTANCE_LINE));
  });
});
