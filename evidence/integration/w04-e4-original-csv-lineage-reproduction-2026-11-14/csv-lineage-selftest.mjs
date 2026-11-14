#!/usr/bin/env node
/**
 * Self-test of `w04-e4-csv-lineage-reproduction.mjs`. A TOOL TEST, NOT EVIDENCE.
 *
 * Everything here is synthetic: invented companies, invented identifiers, invented measures. No
 * line of its output describes an actual holding, and none of it is an E4 result. The original
 * CSV and the capture of the actual portfolio are not available to this test and are not used.
 *
 * What it does, per scenario:
 *   1. Runs the UNMODIFIED compiled IPD import pipeline
 *      (`BrokerImportIngressOrchestrator.executeIngress`) on a synthetic Dhan-format CSV against a
 *      synthetic security master, with the options the IRR preview passes.
 *   2. Commits the result with the UNMODIFIED `persistBrokerImport` into an in-memory database.
 *   3. Reads the portfolio back through the real store, shaped as the `portfolio.get` wire result
 *      (IPD src/ipc/dispatch.ts `personalGet`), and writes it as an exact-capture document.
 *   4. Runs the utility as a separate process on the CSV file and the capture folder, and compares
 *      its result with the truth known by construction.
 * So every lineage digest the utility is asked to reproduce was computed by production code, and a
 * reproduced digest shows that the port inside the utility equals production on that input.
 *
 * Every run is also checked for: an unchanged input tree (names, sizes, modification times and
 * SHA-256 of every file), an empty stderr, a result line whose SHA-256 is the one printed, and an
 * output that contains none of the synthetic symbols, ISINs, company identifiers, file names,
 * paths, instants, per-holding digests or measures.
 *
 * Two places differ from the deployed path, both stated where they occur:
 *   - The identity gate of `persistBrokerImport` is a stand-in with the rules of the governed
 *     resolver (IPD src/identity/broker_observation_resolver.ts), because the governed resolver
 *     accepts only the governed D05 master. The stand-in can be told not to require an exchange,
 *     which production does require; that is how a stored holding without an exchange is built.
 *   - IRR refuses to commit an import with a rejected row. The scenario with excluded rows commits
 *     anyway, to show the utility follows the mapper there too.
 *
 * Requires `npm run build:tsc` (it imports the compiled pipeline from `dist/`).
 * Run: node evidence/integration/w04-e4-original-csv-lineage-reproduction-2026-11-14/csv-lineage-selftest.mjs
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');
const tool = path.join(here, 'w04-e4-csv-lineage-reproduction.mjs');
const dist = (relative) => import(pathToFileURL(path.join(repoRoot, 'dist', relative)).href);

const { BrokerImportIngressOrchestrator } = await dist('frontend/src/features/portfolio/import/broker-import-ingress.js');
const { SecurityMaster } = await dist('src/identity/security_master.js');
const { DhanInstrumentRegistry } = await dist('src/providers/dhan/dhan_instrument_map.js');
const { DurablePortfolioStore } = await dist('src/persistence/portfolio_store.js');
const { ensureMigrations } = await dist('src/persistence/migration_ledger.js');
const { GATE3_MIGRATIONS } = await dist('src/ipc/entrypoint.js');
const { persistBrokerImport } = await dist('src/persistence/brokerImportPersistence.js');

const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const wire = (value) => JSON.parse(JSON.stringify(value));

/* ------------------------------------------------------------ synthetic world */
const PORTFOLIO_ID = 'SYNTHETIC_SELFTEST_PORTFOLIO';
const FILE_NAME = 'synthetic-selftest-statement.csv';
const AS_OF = '2026-11-14T01:02:03.004Z';
const OWNER = { canonicalOwnerId: 'selftest-owner-user', tenantId: 'selftest-tenant' };
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');
/* 24 lettered entities for the scenarios, and 46 more so that one statement can hold 64. */
const CODES = [...LETTERS, ...Array.from({ length: 46 }, (_, i) => `N${String(i + 25).padStart(2, '0')}`)];
const ENTITIES = CODES.map((letter, i) => ({
  letter, companyId: `COMP-SYNTH-${letter}`, isin: `INE0SYNT${String(i).padStart(2, '0')}${String(i).padStart(2, '0')}`, symbol: `QZSYM${letter}`,
}));
const E = Object.fromEntries(ENTITIES.map((e) => [e.letter, e]));

const master = new SecurityMaster();
for (const e of ENTITIES) {
  master.registerEntity({
    companyId: e.companyId, isin: e.isin, cin: '', companyName: `Synth ${e.letter}`, industry: 'T', sector: 'T',
    listings: [
      { exchange: 'NSE', symbol: e.symbol, status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
      { exchange: 'BSE', symbol: e.symbol, status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
    ],
    effectiveFrom: '2026-01-01',
  });
}
/* The synthetic registry maps entity A on NSE only: at most one holding gets a security identity. */
const registry = new DhanInstrumentRegistry();
registry.register({
  companyId: E.A.companyId, isin: E.A.isin, securityId: `ISIN:${E.A.isin}:EQ`, exchange: 'NSE',
  symbol: E.A.symbol, exchangeSegment: 'NSE_EQ', dhanSecurityId: 'SYNTH-NSE-EQ-1001', mappingProvenance: 'DHAN_INSTRUMENT_MASTER',
  instrumentType: 'EQUITY', active: true, lastVerifiedAt: '2026-11-06T05:27:53.7922492Z',
});

/**
 * Stand-in for `createGovernedBrokerObservationResolver`, same rules: every supplied identifier
 * must resolve and agree, and a symbol needs an explicit exchange. `requireExchange: false` drops
 * that last rule (not a production state) and falls back to NSE then BSE, as the import pipeline's
 * own assessment does.
 */
function makeResolver({ requireExchange }) {
  const unmapped = { status: 'UNMAPPED', reason: 'UNMAPPED_IDENTIFIER: selftest', sourceRevision: 'selftest' };
  return {
    resolve(observation) {
      const identifiers = [];
      if (typeof observation.isin === 'string' && observation.isin.trim()) identifiers.push(['ISIN', observation.isin]);
      if (typeof observation.symbol === 'string' && observation.symbol.trim()) {
        if (!observation.exchange) {
          if (requireExchange) return { status: 'AMBIGUOUS', reason: 'MISSING_EXCHANGE: selftest', sourceRevision: 'selftest' };
          if (identifiers.length === 0) {
            for (const type of ['NSE_SYMBOL', 'BSE_SYMBOL']) {
              try {
                return { status: 'RESOLVED', companyId: master.resolveCompanyId({ identifierType: type, identifierValue: observation.symbol }), sourceRevision: 'selftest' };
              } catch { /* next */ }
            }
            return unmapped;
          }
        } else {
          identifiers.push([`${observation.exchange}_SYMBOL`, observation.symbol]);
        }
      }
      if (identifiers.length === 0) return unmapped;
      const matches = [];
      for (const [identifierType, identifierValue] of identifiers) {
        try {
          matches.push(master.resolveCompanyId({ identifierType, identifierValue }));
        } catch {
          return unmapped;
        }
      }
      const unique = [...new Set(matches)];
      if (unique.length !== 1) return { status: 'AMBIGUOUS', reason: 'AMBIGUOUS_COLLISION: selftest', sourceRevision: 'selftest' };
      return { status: 'RESOLVED', companyId: unique[0], sourceRevision: 'selftest' };
    },
  };
}

const DETAILED_HEADER = 'Trading Symbol,ISIN,Exchange,Total Qty,DP Qty,Available Qty,Average Buy Price,Last Traded Price,Current Value,Profit / Loss,P&L %';

/**
 * Real pipeline, real commit, real read-back. `content` is the text the browser hands the
 * pipeline; `fileBytes` is what is on disk (defaults to the UTF-8 encoding of `content`).
 */
function buildWorld({ content, fileBytes, requireExchange = true, allowRejections = false, portfolioId = PORTFOLIO_ID }) {
  /* IRR frontend/src/api/brokerHoldingsPreview.ts `previewBrokerHoldings`: the options it passes,
   * with the synthetic master in place of the governed one. `allowPartialRejection` is true only
   * in the scenarios that commit a statement with a rejected row, which IRR would not do. */
  const ingress = BrokerImportIngressOrchestrator.executeIngress({
    content, fileName: FILE_NAME, asOf: AS_OF, securityMaster: master,
    failOnUnmappedIdentity: true, allowNonProductionBypass: false, allowPartialRejection: allowRejections,
    executionEnvironment: 'NON_PRODUCTION',
  });
  assert.equal(ingress.success, true, `ingress: ${JSON.stringify(ingress.rejections)}`);
  assert.equal(ingress.disposition, 'READY_FOR_PORTFOLIO_SAVE');
  if (!allowRejections) assert.equal(ingress.rejections.length, 0, JSON.stringify(ingress.rejections));

  /* IRR frontend/src/api/brokerImportStage4.ts `prepareBrokerImport`, member for member. */
  const request = {
    portfolioId,
    expectedRevision: 0,
    holdings: ingress.userHoldings.map((h) => ({
      symbol: h.symbol,
      ...(h.isin ? { isin: h.isin } : {}),
      ...(h.exchange ? { exchange: h.exchange } : {}),
      quantity: h.quantity, averageBuyPrice: h.averageBuyPrice, currentPrice: h.currentPrice, marketValue: h.marketValue,
      weightPercentage: h.weightPercentage, active: h.active, sourceBroker: String(h.sourceBroker), lineageDigest: h.lineageDigest,
    })),
    contentDigest: ingress.provenance.contentDigest,
    fileName: ingress.provenance.fileName,
    sourceBroker: String(ingress.provenance.sourceBroker),
    importedAt: ingress.provenance.asOf,
    mode: 'MERGE',
  };

  const db = new DatabaseSync(':memory:');
  ensureMigrations(db, GATE3_MIGRATIONS);
  db.prepare(`INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at)
    VALUES ('binding-selftest', 'selftest-principal', 'ACTIVE', ?, ?, NULL)`).run(AS_OF, AS_OF);
  db.prepare(`INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at)
    VALUES ('membership-selftest', 'binding-selftest', ?, ?, 'ACTIVE', ?, ?, NULL)`).run(OWNER.tenantId, OWNER.canonicalOwnerId, AS_OF, AS_OF);
  const store = new DurablePortfolioStore(db);
  const outcome = persistBrokerImport(store, OWNER, request, makeResolver({ requireExchange }), { securityMaster: master, registry });
  assert.equal(outcome.ok, true, JSON.stringify(outcome));
  assert.equal(outcome.revision, 1);

  /* IPD src/ipc/dispatch.ts `personalGet`. JSON round trip = what crosses the IPC wire. */
  const detail = wire({
    ...store.get(OWNER, portfolioId),
    contributions: [],
    importEvidence: store.contributions(OWNER, portfolioId).map((row) => ({
      contentDigest: row.contentDigest, lineageDigest: row.lineageDigest, fileName: row.fileName, sourceBroker: row.sourceBroker,
      importedAt: row.importedAt, contributedAt: row.contributedAt, semantics: row.semantics,
    })),
  });
  const revisions = wire(store.revisions(OWNER, portfolioId));
  db.close();
  assert.equal(detail.holdings.length, ingress.userHoldings.length);
  /* The store keeps the pipeline's digest verbatim. */
  const produced = new Map(ingress.userHoldings.map((h) => [h.symbol, h.lineageDigest]));
  for (const h of detail.holdings) assert.equal(h.lineageDigest, produced.get(h.symbol));
  return { content, fileBytes: fileBytes ?? Buffer.from(content, 'utf8'), ingress, detail, revisions, portfolioId };
}

/** IRR ownerBoundPortfolioCapture.ts `buildExactCaptureDocument`: the members the utility reads. */
function captureDocument(world, mutate = (d) => d) {
  const get = mutate(wire(world.detail)) ?? world.detail;
  return {
    schema: 'iips.w11-dep1.owner-bound-portfolio-capture.exact/v1',
    classification: 'SYNTHETIC SELF-TEST DOCUMENT - NOT A CAPTURE OF ANY PORTFOLIO',
    captureId: 'selftest', outcome: 'CONSISTENT_CAPTURE', evidenceEligibility: 'NOT_EVIDENCE_SYNTHETIC_TEST_PEER',
    selection: { method: 'selftest', listedPortfolioCount: 1, portfolioId: world.portfolioId },
    reads: [
      { sequence: 1, operation: 'portfolio.list', requestPayload: {}, wireResult: [] },
      { sequence: 2, operation: 'portfolio.get', requestPayload: { portfolioId: world.portfolioId }, wireResult: get },
      { sequence: 3, operation: 'portfolio.revisions', requestPayload: { portfolioId: world.portfolioId }, wireResult: world.revisions },
      { sequence: 4, operation: 'portfolio.get', requestPayload: { portfolioId: world.portfolioId }, wireResult: get },
    ],
  };
}

/* ------------------------------------------------------------ running the utility */
const work = mkdtempSync(path.join(tmpdir(), 'w04-e4-csv-lineage-selftest-'));
let caseNumber = 0;
let runCount = 0;

function treeState(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(`D ${full}`);
        walk(full);
      } else {
        const stat = statSync(full);
        out.push(`F ${full} ${stat.size} ${stat.mtimeMs} ${sha256(readFileSync(full))}`);
      }
    }
  };
  walk(root);
  return out.join('\n');
}

/** Writes the CSV and the capture into a fresh folder shaped like the host capture root. */
function layout(world, { captureText, csvBytes, csvName = FILE_NAME, runFolders = 1 } = {}) {
  caseNumber += 1;
  const dir = path.join(work, `case-${String(caseNumber).padStart(3, '0')}`);
  const csvPath = path.join(dir, 'statement', csvName);
  const captureRoot = path.join(dir, 'w11-dep1-capture');
  const runFolder = path.join(captureRoot, 'w11-dep1-capture-20261113T000000Z-selftest');
  const localOnly = path.join(runFolder, 'LOCAL-ONLY-DO-NOT-PUBLISH');
  const capturePath = path.join(localOnly, 'exact-owner-bound-portfolio-capture.json');
  mkdirSync(path.dirname(csvPath), { recursive: true });
  mkdirSync(localOnly, { recursive: true });
  const bytes = csvBytes ?? world.fileBytes;
  writeFileSync(csvPath, bytes);
  const text = captureText ?? `${JSON.stringify(captureDocument(world), null, 2)}\n`;
  writeFileSync(capturePath, text);
  for (let i = 1; i < runFolders; i += 1) {
    const other = path.join(captureRoot, `w11-dep1-capture-2026111${i}T000000Z-other${i}`, 'LOCAL-ONLY-DO-NOT-PUBLISH');
    mkdirSync(other, { recursive: true });
    writeFileSync(path.join(other, 'exact-owner-bound-portfolio-capture.json'), `${JSON.stringify({ schema: 'iips.w11-dep1.owner-bound-portfolio-capture.exact/v1', other: i })}\n`);
  }
  return { dir, csvPath, captureRoot, runFolder, localOnly, capturePath, csvSha: sha256(Buffer.from(world.content, 'utf8')), captureSha: sha256(Buffer.from(text, 'utf8')) };
}

function sensitiveStrings(world, files) {
  /* The recorded portfolio name is a published constant of the utility and may be printed. */
  const list = [world.portfolioId === 'DHAN_PORTFOLIO' ? '' : world.portfolioId, FILE_NAME, AS_OF, work, files.dir, OWNER.canonicalOwnerId, OWNER.tenantId];
  for (const e of ENTITIES) list.push(e.companyId, e.isin, e.symbol);
  for (const h of world.detail.holdings) {
    list.push(h.lineageDigest);
    for (const m of ['quantity', 'averageBuyPrice', 'currentPrice', 'marketValue', 'weightPercentage']) {
      const textValue = String(h[m]);
      if (textValue.includes('.') && textValue.length >= 5) list.push(textValue);
    }
  }
  list.push(world.detail.provenanceDigest);
  for (const row of world.detail.importEvidence) list.push(row.lineageDigest, row.contributedAt);
  for (const row of world.revisions) list.push(row.contentDigest, row.committedAt);
  return [...new Set(list.filter((s) => typeof s === 'string' && s.length >= 5))];
}

function run(world, files, { args, nodeArgs = [], expectCsv, expectCapture } = {}) {
  const finalArgs = args ?? [
    '--csv', files.csvPath, '--capture-dir', files.captureRoot,
    '--expected-csv-sha256', expectCsv ?? files.csvSha, '--expected-capture-sha256', expectCapture ?? files.captureSha,
  ];
  const before = treeState(files.dir);
  runCount += 1;
  const child = spawnSync(process.execPath, [...nodeArgs, tool, ...finalArgs], { encoding: 'utf8' });
  const after = treeState(files.dir);
  assert.equal(after, before, 'the utility changed its input tree');
  assert.equal(child.stderr, '', `stderr is not empty: ${child.stderr}`);
  const stdout = child.stdout;
  for (const secret of sensitiveStrings(world, files)) {
    assert.equal(stdout.includes(secret), false, `output leaks a synthetic value (${secret.slice(0, 4)}...)`);
  }
  const jsonLine = stdout.split('\n').find((l) => l.startsWith('E4_CSV_LINEAGE_RESULT_JSON: '));
  assert.ok(jsonLine, 'no result line');
  const jsonText = jsonLine.slice('E4_CSV_LINEAGE_RESULT_JSON: '.length);
  const shaLine = stdout.split('\n').find((l) => l.startsWith('E4_CSV_LINEAGE_RESULT_JSON_SHA256: '));
  assert.equal(shaLine, `E4_CSV_LINEAGE_RESULT_JSON_SHA256: ${sha256(Buffer.from(jsonText, 'utf8'))}`);
  const json = JSON.parse(jsonText);
  const resultLine = stdout.trimEnd().split('\n').pop();
  assert.equal(resultLine, `RESULT: ${json.result}`);
  return { status: child.status, stdout, json, lines: stdout.split('\n') };
}

/* ------------------------------------------------------------ assertions */
const results = [];
function scenario(group, name, fn) {
  try {
    fn();
    results.push({ group, name, ok: true });
    process.stdout.write(`ok   - [${group}] ${name}\n`);
  } catch (error) {
    results.push({ group, name, ok: false });
    process.stdout.write(`FAIL - [${group}] ${name}\n       ${String(error && error.message).split('\n').join('\n       ')}\n`);
  }
}
function expectAll(r, world, extra = {}) {
  const n = world.detail.holdings.length;
  assert.equal(r.json.result, 'REPRODUCED_ALL', r.stdout);
  assert.equal(r.status, 0);
  assert.equal(r.json.reproduction.targetHoldings, n);
  assert.equal(r.json.reproduction.reproduced, n);
  assert.equal(r.json.reproduction.ambiguous, 0);
  assert.equal(r.json.reproduction.notReproducedFromCsv, 0);
  assert.equal(r.json.reproduction.csvHoldingsMatchingNoStoredDigest, 0);
  assert.equal(r.json.reproduction.csvDerivedHoldings, n);
  assert.deepEqual(r.json.importProvenance, { computed: true, equalsImportEvidence: true, equalsRevisionProvenance: true });
  assert.equal(r.json.checks.fail, 0);
  assert.deepEqual(r.json.unresolved, []);
  assert.equal(r.json.identityClassification, 'NOT_PERFORMED');
  assert.equal(r.json.holdings.every((h) => h.status === 'REPRODUCED' && h.algorithm === 'MAPPER_BI03' && h.storedMembersDiffering.length === 0), true);
  /* one-to-one: every CSV-derived holding is used exactly once */
  assert.equal(new Set(r.json.holdings.map((h) => h.csvHolding)).size, n);
  assert.equal(r.lines.filter((l) => l.startsWith('[ROW] ')).length, n);
  if (extra.classes) {
    const merged = {};
    for (const part of ['storedIdentityNull', 'storedIdentityObject']) {
      for (const [k, v] of Object.entries(r.json.inputClassOfReproduced.REPRODUCED[part])) merged[k] = (merged[k] ?? 0) + v;
    }
    assert.deepEqual(merged, extra.classes);
  }
}
function expectStop(r, code) {
  assert.equal(r.json.result, 'INCONCLUSIVE', r.stdout);
  assert.equal(r.status, 2);
  assert.deepEqual(r.json.unresolved.filter((u) => u.startsWith('STOPPED:')), [`STOPPED:${code}`]);
  assert.deepEqual(r.json.holdings, []);
  assert.equal(r.json.reproduction, null);
  assert.equal(r.lines.some((l) => l.startsWith('[ROW] ')), false);
  assert.equal(r.stdout.includes('Nothing was compared. No holding was reproduced or classified.'), true);
}
/** The H ordinal (1-based) of the stored holding of an entity, known to the test only. */
const hOf = (world, letter) => world.detail.holdings.findIndex((h) => h.symbol === E[letter].symbol) + 1;
const rowOf = (r, world, letter) => r.json.holdings.find((h) => h.h === hOf(world, letter));
const csvOf = (rows, eol = '\n') => rows.join(eol) + eol;
const row = (letter, { isin = true, exchange = 'NSE', qty = '10', avg = '100.5', ltp = '110.25', symbol } = {}) =>
  [symbol ?? E[letter].symbol, isin === true ? E[letter].isin : (isin || ''), exchange ?? '', qty, qty, qty, avg, ltp, '0', '0', '0'].join(',');
/** A capture whose import record names another content digest, so a changed CSV passes the link. */
const relinked = (world, content) => `${JSON.stringify(captureDocument(world, (d) => {
  d.importEvidence[0].contentDigest = sha256(Buffer.from(content, 'utf8'));
  return d;
}), null, 2)}\n`;
const captureWith = (world, mutate) => `${JSON.stringify(captureDocument(world, mutate), null, 2)}\n`;

/* ------------------------------------------------------------ base world */
const BASE_ROWS = [
  DETAILED_HEADER,
  row('A', { qty: '10', avg: '100.5', ltp: '110.25' }),
  row('B', { qty: '7', avg: '33.333', ltp: '41.07' }),
  row('C', { exchange: 'BSE', qty: '3', avg: '1000', ltp: '999.95' }),
  row('D', { isin: false, qty: '12', avg: '10.1', ltp: '12.3' }),
  row('E', { isin: false, exchange: 'BSE', qty: '5', avg: '250', ltp: '260.4' }),
  row('F', { qty: '"1,234"', avg: '"\u20B91,050.75"', ltp: '" 1,101.10 "' }),
  row('G', { exchange: 'nse_eq', qty: '0.5', avg: '19.99', ltp: '20.01' }),
  row('H', { exchange: 'bse', qty: '42', avg: '7.07', ltp: '7.7' }),
];
const BASE = buildWorld({ content: csvOf(BASE_ROWS) });
const BASE_CLASSES = { 'ISIN+EXCHANGE_NSE': 4, 'ISIN+EXCHANGE_BSE': 2, 'NO_ISIN+EXCHANGE_NSE': 1, 'NO_ISIN+EXCHANGE_BSE': 1 };

/* ============================================================ 1. exact matches */
scenario('exact matches', 'ISIN and exchange, no ISIN, quoted and formatted numbers: all reproduced one-to-one', () => {
  const files = layout(BASE);
  const r = run(BASE, files);
  expectAll(r, BASE, { classes: BASE_CLASSES });
  assert.equal(r.json.capture.identity.object, 1);
  assert.equal(r.json.capture.identity.null, 7);
  assert.equal(rowOf(r, BASE, 'A').storedIdentity, 'object');
  assert.equal(rowOf(r, BASE, 'D').inputClass, 'NO_ISIN+EXCHANGE_NSE');
  assert.equal(rowOf(r, BASE, 'D').storedIdentity, 'null');
  assert.deepEqual(rowOf(r, BASE, 'C').csvLines, [4]);
  assert.equal(r.json.inputs.csv.rawBytesEqualExpected, true);
  assert.equal(r.json.csv.variant, 'DHAN_DETAILED_HOLDINGS_V1');
  assert.equal(r.json.link.fileNameEqualsCsvBaseName, true);
});
scenario('exact matches', 'CRLF line endings and a byte-order mark that the decoder dropped', () => {
  const content = csvOf(BASE_ROWS, '\r\n');
  const world = buildWorld({ content, fileBytes: Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(content, 'utf8')]) });
  const r = run(world, layout(world));
  expectAll(r, world, { classes: BASE_CLASSES });
  assert.equal(r.json.inputs.csv.byteOrderMark, true);
  assert.equal(r.json.inputs.csv.byteOrderMarkInImportedText, false);
  assert.equal(r.json.inputs.csv.rawBytesEqualExpected, false);
  assert.equal(r.json.inputs.csv.lineEndings, 'CRLF');
});
scenario('exact matches', 'a byte-order mark that was part of the imported text', () => {
  const content = `\uFEFF${csvOf(BASE_ROWS)}`;
  const world = buildWorld({ content });
  const r = run(world, layout(world));
  expectAll(r, world, { classes: BASE_CLASSES });
  assert.equal(r.json.inputs.csv.byteOrderMarkInImportedText, true);
  assert.equal(r.json.inputs.csv.rawBytesEqualExpected, true);
});
scenario('exact matches', 'the Dhan web-summary variant (Name / Quantity / Avg Price / Last Traded)', () => {
  const content = csvOf([
    'Name,Quantity,Avg Price,Last Traded,Investment,Current Value,P&L',
    `${E.A.symbol},10,100.5,110.25,1005,1102.5,97.5`,
    `${E.B.symbol},3,20.2,19.9,60.6,59.7,-0.9`,
  ]);
  const world = buildWorld({ content, requireExchange: false });
  const r = run(world, layout(world));
  expectAll(r, world, { classes: { 'NO_ISIN+NO_EXCHANGE': 2 } });
  assert.equal(r.json.csv.variant, 'DHAN_WEB_UI_SUMMARY_V1');
});
scenario('exact matches', 'a renamed copy of the CSV, and each accepted form of --capture-dir', () => {
  const files = layout(BASE, { csvName: 'renamed copy of the statement.csv', runFolders: 3 });
  const base = ['--csv', files.csvPath, '--expected-csv-sha256', files.csvSha, '--expected-capture-sha256', files.captureSha];
  for (const target of [files.captureRoot, files.runFolder, files.localOnly, files.capturePath]) {
    const r = run(BASE, files, { args: [...base, '--capture-dir', target] });
    expectAll(r, BASE, { classes: BASE_CLASSES });
    assert.equal(r.json.link.fileNameEqualsCsvBaseName, false);
    assert.equal(r.json.inputs.capture.filesWithExpectedSha256, 1);
  }
  const root = run(BASE, files);
  assert.equal(root.json.inputs.capture.filesExamined, 3);
});
let sampleOutput = null;
scenario('exact matches', 'a statement of the recorded shape: 64 holdings, 63 without and 1 with a stored security identity', () => {
  /* The shape of the recorded target (portfolio name, revision 1, 64 holdings, 63 + 1). The mix
   * of rows with and without an ISIN is arbitrary and says nothing about the actual statement. */
  const lines = [DETAILED_HEADER];
  CODES.slice(0, 64).forEach((code, i) => {
    lines.push(row(code, {
      isin: i % 16 !== 5, exchange: i % 7 === 3 ? 'BSE' : 'NSE',
      qty: String(1 + ((i * 37) % 91)), avg: (11.37 + i * 13.091).toFixed(2), ltp: (9.83 + i * 14.207).toFixed(2),
    }));
  });
  const world = buildWorld({ content: csvOf(lines, '\r\n'), portfolioId: 'DHAN_PORTFOLIO' });
  const r = run(world, layout(world));
  expectAll(r, world, { classes: { 'ISIN+EXCHANGE_NSE': 51, 'ISIN+EXCHANGE_BSE': 9, 'NO_ISIN+EXCHANGE_NSE': 4 } });
  assert.equal(r.json.capture.holdings, 64);
  assert.deepEqual(r.json.capture.identity, { object: 1, null: 63, other: 0 });
  assert.equal(r.json.capture.portfolioIdIsRecorded, true);
  assert.equal(r.json.capture.revision, 1);
  assert.equal(r.json.capture.revisionEntryOperation, 'INITIAL');
  /* Under overridden digests the recorded facts are still reported, and here they all hold. */
  for (const id of ['capture.portfolio', 'capture.revision', 'capture.holdings', 'capture.identity.null', 'capture.identity.object']) {
    assert.ok(r.lines.some((l) => l.startsWith(`[PASS] ${id}: `)), id);
  }
  assert.ok(r.lines.some((l) => l.startsWith('[WARN] result.override: ')));
  sampleOutput = r.stdout;
});
scenario('exact matches', 'forty seeded random statements: every digest of every statement reproduced', () => {
  /* Differential test of the port against the compiled pipeline over varied formatting. */
  let seed = 20261114;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const pick = (list) => list[Math.floor(next() * list.length)];
  const number = () => {
    const whole = Math.floor(next() * pick([10, 1000, 100000, 10000000]));
    const decimals = pick([0, 1, 2, 3, 4]);
    const fraction = decimals === 0 ? '' : `.${String(Math.floor(next() * 10 ** decimals)).padStart(decimals, '0')}`;
    const style = pick(['plain', 'plain', 'grouped', 'rupee', 'spaced']);
    const plain = `${whole + 1}${fraction}`;
    if (style === 'grouped') return `"${(whole + 1).toLocaleString('en-IN')}${fraction}"`;
    if (style === 'rupee') return `"\u20B9 ${(whole + 1).toLocaleString('en-US')}${fraction}"`;
    if (style === 'spaced') return `  ${plain} `;
    return plain;
  };
  let executed = 0;
  let holdings = 0;
  for (let s = 0; s < 40; s += 1) {
    const count = 2 + Math.floor(next() * 20);
    const chosen = [...LETTERS].sort(() => next() - 0.5).slice(0, count);
    const lines = [DETAILED_HEADER];
    for (const letter of chosen) {
      const copies = next() < 0.2 ? 2 : 1;
      const isin = next() < 0.7;
      const exchange = pick(['NSE', 'BSE', 'NSE', '']);
      for (let c = 0; c < copies; c += 1) {
        const symbol = pick([E[letter].symbol, E[letter].symbol.toLowerCase(), `"${E[letter].symbol}"`, ` ${E[letter].symbol} `]);
        lines.push(row(letter, { symbol, isin: isin ? pick([E[letter].isin, E[letter].isin.toLowerCase()]) : false, exchange, qty: number(), avg: next() < 0.1 ? '' : number(), ltp: next() < 0.1 ? '' : number() }));
      }
      if (next() < 0.1) lines.push('');
      if (next() < 0.1) lines.push(',,,,,,,,,,');
    }
    const content = csvOf(lines, pick(['\n', '\r\n']));
    let world;
    try {
      world = buildWorld({ content, requireExchange: false, allowRejections: true });
    } catch {
      continue; /* the pipeline itself refused this statement: nothing to reproduce */
    }
    expectAll(run(world, layout(world)), world);
    executed += 1;
    holdings += world.detail.holdings.length;
  }
  assert.ok(executed >= 35, `only ${executed} random statements were accepted by the pipeline`);
  process.stdout.write(`       (${executed} statements, ${holdings} holdings)\n`);
});

/* ============================================================ 2. missing identifiers */
scenario('missing identifiers', 'no ISIN column at all: reproduced, every input class is NO_ISIN', () => {
  const content = csvOf([
    'Trading Symbol,Exchange,Total Qty,Average Buy Price,Last Traded Price',
    `${E.A.symbol},NSE,10,100.5,110.25`,
    `${E.B.symbol},BSE,4,55.5,54.25`,
    `${E.C.symbol},NSE,9,1.25,1.5`,
  ]);
  const world = buildWorld({ content });
  const r = run(world, layout(world));
  expectAll(r, world, { classes: { 'NO_ISIN+EXCHANGE_NSE': 2, 'NO_ISIN+EXCHANGE_BSE': 1 } });
  assert.equal(r.json.csv.columns.isin, false);
  assert.equal(r.json.csv.rows.withIsin, 0);
  assert.equal(r.json.csv.distinctIsins, 0);
});
scenario('missing identifiers', 'an ISIN column with empty and quoted-empty cells on some rows', () => {
  const content = csvOf([
    DETAILED_HEADER,
    row('A'),
    row('B', { isin: false, qty: '2', ltp: '3.5' }),
    row('C', { isin: '""', exchange: 'BSE', qty: '8', ltp: '9.5' }),
    row('D', { isin: '   ', qty: '6', ltp: '4.5' }),
  ]);
  const world = buildWorld({ content });
  const r = run(world, layout(world));
  expectAll(r, world, { classes: { 'ISIN+EXCHANGE_NSE': 1, 'NO_ISIN+EXCHANGE_NSE': 2, 'NO_ISIN+EXCHANGE_BSE': 1 } });
  assert.equal(r.json.csv.rows.withoutIsin, 3);
});

/* ============================================================ 3. missing exchange */
scenario('missing exchange', 'empty exchange cells, with and without an ISIN (identity gate relaxed for the test)', () => {
  const content = csvOf([
    DETAILED_HEADER,
    row('A'),
    row('B', { exchange: '', qty: '2', ltp: '3.5' }),
    row('C', { isin: false, exchange: '', qty: '8', ltp: '9.5' }),
    row('D', { exchange: '""', qty: '6', ltp: '4.5' }),
  ]);
  const world = buildWorld({ content, requireExchange: false });
  const r = run(world, layout(world));
  expectAll(r, world, { classes: { 'ISIN+EXCHANGE_NSE': 1, 'ISIN+NO_EXCHANGE': 2, 'NO_ISIN+NO_EXCHANGE': 1 } });
  assert.equal(r.json.csv.rows.exchange.none, 3);
});
scenario('missing exchange', 'no Exchange column at all', () => {
  const content = csvOf([
    'Trading Symbol,ISIN,Total Qty,Average Buy Price,Last Traded Price',
    `${E.A.symbol},${E.A.isin},10,100.5,110.25`,
    `${E.B.symbol},,4,55.5,54.25`,
  ]);
  const world = buildWorld({ content, requireExchange: false });
  const r = run(world, layout(world));
  expectAll(r, world, { classes: { 'ISIN+NO_EXCHANGE': 1, 'NO_ISIN+NO_EXCHANGE': 1 } });
  assert.equal(r.json.csv.columns.exchange, false);
});
scenario('missing exchange', 'the production identity gate refuses a holding without an exchange (so no such stored holding is expected)', () => {
  const content = csvOf([DETAILED_HEADER, row('A'), row('B', { exchange: '', qty: '2', ltp: '3.5' })]);
  assert.throws(() => buildWorld({ content, requireExchange: true }), /REFUSED|refus|IDENTITY/i);
});

/* ============================================================ 4. null and empty fields */
scenario('null and empty fields', 'empty prices, empty quantity, empty symbol, blank lines, an all-empty row', () => {
  const content = csvOf([
    DETAILED_HEADER,
    '',
    row('A'),
    row('B', { avg: '', qty: '4', ltp: '5.5' }),            // no average price: averageBuyPrice 0
    row('C', { ltp: '', qty: '3', avg: '8.25' }),           // no last price: the average price is used
    ',,,,,,,,,,',                                           // all-empty row: dropped by the parser
    row('D', { qty: '', avg: '1', ltp: '2' }),              // no quantity: excluded by the mapper
    row('E', { avg: '', ltp: '', qty: '2' }),               // no price: excluded by the mapper
    `,${E.F.isin},NSE,5,5,5,1,2,0,0,0`,                     // no symbol: skipped by the adapter
    '   ',
    row('G', { qty: '"abc"', avg: '1', ltp: '2' }),         // not a number: 0, excluded by the mapper
    row('H', { qty: '6', avg: '"n/a"', ltp: '7.75' }),      // not a number: 0
  ]);
  /* IRR would refuse to commit a statement with a rejected row; committed here on purpose. */
  const world = buildWorld({ content, allowRejections: true });
  assert.equal(world.detail.holdings.length, 4);
  const r = run(world, layout(world));
  expectAll(r, world);
  assert.equal(r.json.csv.dataRows, 8);
  assert.equal(r.json.csv.rowsSkippedEmptySymbol, 1);
  assert.equal(r.json.csv.excludedRows, 3);
  assert.deepEqual(r.json.csv.excludedByReason, { NON_POSITIVE_PRICE: 1, NON_POSITIVE_QTY: 2 });
  assert.deepEqual(r.json.csv.excludedLines, [{ csvLine: 7, reason: 'NON_POSITIVE_QTY' }, { csvLine: 8, reason: 'NON_POSITIVE_PRICE' }, { csvLine: 11, reason: 'NON_POSITIVE_QTY' }]);
  assert.deepEqual(rowOf(r, world, 'H').csvLines, [12]);
  assert.equal(r.json.capture.identity.null, 3);
});
scenario('null and empty fields', 'a stored holding whose lineage digest is null: reported, not reproduced, nothing guessed', () => {
  const victim = hOf(BASE, 'C');
  const files = layout(BASE, { captureText: captureWith(BASE, (d) => { d.holdings[victim - 1].lineageDigest = null; return d; }) });
  const r = run(BASE, files);
  assert.equal(r.json.result, 'PARTIAL');
  assert.equal(r.status, 1);
  assert.equal(r.json.reproduction.reproduced, 7);
  assert.equal(r.json.holdings.find((h) => h.h === victim).status, 'NOT_REPRODUCED');
  assert.equal(r.json.reproduction.csvHoldingsMatchingNoStoredDigest, 1);
  assert.ok(r.json.unresolved.includes('CHECK_FAILED:capture.holdings.wellformed'));
  assert.equal(r.json.importProvenance.computed, false);
});
scenario('null and empty fields', 'a stored holding with an empty company identifier', () => {
  const victim = hOf(BASE, 'B');
  const files = layout(BASE, { captureText: captureWith(BASE, (d) => { d.holdings[victim - 1].companyId = ''; return d; }) });
  const r = run(BASE, files);
  assert.equal(r.json.result, 'PARTIAL');
  assert.equal(r.json.reproduction.reproduced, 7);
  assert.equal(r.json.holdings.find((h) => h.h === victim).status, 'NOT_REPRODUCED');
});
scenario('null and empty fields', 'an import record with a null import instant, and one with no file name', () => {
  const noInstant = run(BASE, layout(BASE, { captureText: captureWith(BASE, (d) => { d.importEvidence[0].importedAt = null; return d; }) }));
  expectStop(noInstant, 'IMPORT_INSTANT_NOT_RECORDED');
  const noName = run(BASE, layout(BASE, { captureText: captureWith(BASE, (d) => { d.importEvidence[0].fileName = null; return d; }) }));
  assert.equal(noName.json.result, 'PARTIAL');
  assert.equal(noName.json.reproduction.reproduced, 8);
  assert.equal(noName.json.importProvenance.computed, false);
});
scenario('null and empty fields', 'an empty CSV, a header-only CSV, and a capture with no holdings', () => {
  const empty = layout(BASE, { csvBytes: Buffer.alloc(0), captureText: relinked(BASE, '') });
  expectStop(run(BASE, empty, { expectCsv: sha256(Buffer.alloc(0)) }), 'CSV_EMPTY_FILE');
  const headerOnly = `${DETAILED_HEADER}\n`;
  const header = layout(BASE, { csvBytes: Buffer.from(headerOnly), captureText: relinked(BASE, headerOnly) });
  expectStop(run(BASE, header, { expectCsv: sha256(Buffer.from(headerOnly)) }), 'CSV_REJECTED_BY_THE_DHAN_ADAPTER');
  const none = layout(BASE, { captureText: captureWith(BASE, (d) => { d.holdings = []; return d; }) });
  expectStop(run(BASE, none), 'CAPTURE_HAS_NO_HOLDINGS');
});

/* ============================================================ 5. duplicate rows */
scenario('duplicate rows', 'rows of one security are aggregated exactly as the mapper does', () => {
  const content = csvOf([
    DETAILED_HEADER,
    row('A', { qty: '10', avg: '100.5', ltp: '110.25' }),
    row('B', { qty: '7', avg: '33.333', ltp: '41.07' }),
    row('C', { isin: false, qty: '3', avg: '9.1', ltp: '9.9' }),
    row('A', { qty: '10', avg: '100.5', ltp: '110.25' }),                    // identical duplicate, same ISIN
    row('B', { qty: '2', avg: '35', ltp: '41.11' }),                         // same ISIN, other measures: last price wins
    row('C', { isin: false, exchange: 'BSE', qty: '1', avg: '9.3', ltp: '10.1' }), // same symbol, no ISIN: first exchange wins
    row('B', { qty: '1', avg: '36.6', ltp: '41.19', symbol: 'ANOTHERNAME' }), // same ISIN, other symbol: first symbol wins
    row('D', { qty: '5', avg: '4', ltp: '4.4' }),
  ]);
  const world = buildWorld({ content });
  assert.equal(world.detail.holdings.length, 4);
  const r = run(world, layout(world));
  expectAll(r, world, { classes: { 'ISIN+EXCHANGE_NSE': 3, 'NO_ISIN+EXCHANGE_NSE': 1 } });
  assert.equal(r.json.csv.aggregatedRows, 4);
  assert.equal(r.json.csv.derivedHoldingsFromSeveralRows, 3);
  assert.deepEqual(rowOf(r, world, 'A').csvLines, [2, 5]);
  assert.deepEqual(rowOf(r, world, 'B').csvLines, [3, 6, 8]);
  assert.deepEqual(rowOf(r, world, 'C').csvLines, [4, 7]);
  assert.deepEqual(rowOf(r, world, 'D').csvLines, [9]);
});
scenario('duplicate rows', 'one security once with an ISIN and once without: two holdings, as the mapper keys them', () => {
  const content = csvOf([
    DETAILED_HEADER,
    row('A', { qty: '10', avg: '100.5', ltp: '110.25' }),
    row('B', { qty: '4', avg: '5.5', ltp: '6.5' }),
  ]);
  const withSplit = csvOf([
    DETAILED_HEADER,
    row('A', { qty: '10', avg: '100.5', ltp: '110.25' }),
    row('B', { qty: '4', avg: '5.5', ltp: '6.5' }),
    row('A', { isin: false, qty: '1', avg: '100.5', ltp: '110.25' }),
  ]);
  /* The store keys holdings by company, so production cannot hold this split; the changed
   * statement is therefore compared with the capture of the unsplit one. */
  const world = buildWorld({ content });
  const files = layout(world, { csvBytes: Buffer.from(withSplit), captureText: relinked(world, withSplit) });
  const r = run(world, files, { expectCsv: sha256(Buffer.from(withSplit)) });
  assert.equal(r.json.result, 'PARTIAL');
  assert.equal(r.json.reproduction.csvDerivedHoldings, 3);
  assert.equal(r.json.reproduction.targetHoldings, 2);
  assert.equal(r.json.reproduction.reproduced, 0);            // every weight moved
  assert.equal(r.json.reproduction.csvHoldingsMatchingNoStoredDigest, 3);
  /* Two CSV holdings carry the symbol of A: the diagnostic reports the count and joins nothing. */
  assert.equal(rowOf(r, world, 'A').diagnostic.csvHoldingsWithEqualSymbol, 2);
});

/* ============================================================ 6. ambiguous matches */
scenario('ambiguous matches', 'two stored holdings with one digest: both AMBIGUOUS, neither counted as reproduced', () => {
  const victim = hOf(BASE, 'B');
  const files = layout(BASE, { captureText: captureWith(BASE, (d) => { d.holdings.push({ ...d.holdings[victim - 1] }); return d; }) });
  const r = run(BASE, files);
  assert.equal(r.json.result, 'PARTIAL');
  assert.equal(r.status, 1);
  assert.equal(r.json.reproduction.targetHoldings, 9);
  assert.equal(r.json.reproduction.reproduced, 7);
  assert.equal(r.json.reproduction.ambiguous, 2);
  assert.equal(r.json.reproduction.notReproducedFromCsv, 0);
  const ambiguous = r.json.holdings.filter((h) => h.status === 'AMBIGUOUS');
  assert.deepEqual(ambiguous.map((h) => h.h), [victim, 9]);
  assert.deepEqual(ambiguous[0].storedHoldingsSharingACandidate, [9]);
  assert.deepEqual(ambiguous[1].storedHoldingsSharingACandidate, [victim]);
  assert.equal(ambiguous[0].candidateCsvHoldings.length, 1);
  assert.ok(r.json.unresolved.includes('AMBIGUOUS_MATCHES'));
  assert.ok(r.json.unresolved.includes('STORED_LINEAGE_DIGESTS_NOT_DISTINCT'));
  assert.equal(r.json.importProvenance.computed, false);
  assert.equal(r.lines.filter((l) => /^\[ROW\] H\d+ AMBIGUOUS /.test(l)).length, 2);
});
scenario('ambiguous matches', 'rows that merely look alike are not matched: same symbol and measures, other digest', () => {
  /* The stored digest of one holding is replaced by another valid SHA-256. Its CSV row is equal in
   * symbol and in every measure. It must be NOT_REPRODUCED. */
  const victim = hOf(BASE, 'E');
  const files = layout(BASE, { captureText: captureWith(BASE, (d) => { d.holdings[victim - 1].lineageDigest = sha256('another digest'); return d; }) });
  const r = run(BASE, files);
  assert.equal(r.json.result, 'PARTIAL');
  const h = r.json.holdings.find((x) => x.h === victim);
  assert.equal(h.status, 'NOT_REPRODUCED');
  assert.equal(h.diagnostic.csvHoldingsWithEqualSymbol, 1);
  assert.deepEqual(h.diagnostic.differingMembers, []);
  assert.equal(r.json.reproduction.reproduced, 7);
  assert.equal(r.json.reproduction.reproducedByNothing, 1);
});

/* ============================================================ 7. changed field values */
const changed = (mutateRows) => {
  const rows = [...BASE_ROWS];
  mutateRows(rows);
  return csvOf(rows);
};
const runChanged = (content, world = BASE) => {
  const files = layout(world, { csvBytes: Buffer.from(content), captureText: relinked(world, content) });
  return run(world, files, { expectCsv: sha256(Buffer.from(content)) });
};
scenario('changed field values', 'exchange changed on one row: that holding is not reproduced from the CSV', () => {
  const r = runChanged(changed((rows) => { rows[1] = row('A', { exchange: 'BSE', qty: '10', avg: '100.5', ltp: '110.25' }); }));
  assert.equal(r.json.result, 'PARTIAL');
  assert.equal(r.json.reproduction.reproduced, 7);
  const a = rowOf(r, BASE, 'A');
  /* The stored digest is the one with NSE. It is reproduced from the stored measures and the ISIN
   * of the CSV, and the result says the exchange differs from that CSV holding. */
  assert.equal(a.status, 'REPRODUCED_IDENTIFIERS_ONLY');
  assert.equal(a.inputClass, 'ISIN+EXCHANGE_NSE');
  assert.equal(a.exchangeEqualsThatCsvHolding, false);
  assert.deepEqual(a.diagnostic.differingMembers, []);
  assert.equal(r.json.reproduction.reproducedIdentifiersOnly, 1);
  assert.equal(r.json.reproduction.csvHoldingsMatchingNoStoredDigest, 1);
});
scenario('changed field values', 'ISIN changed on one row: reproduced by nothing', () => {
  const r = runChanged(changed((rows) => { rows[3] = row('C', { isin: E.X.isin, exchange: 'BSE', qty: '3', avg: '1000', ltp: '999.95' }); }));
  assert.equal(r.json.reproduction.reproduced, 7);
  assert.equal(rowOf(r, BASE, 'C').status, 'NOT_REPRODUCED');
  assert.equal(r.json.reproduction.reproducedByNothing, 1);
});
scenario('changed field values', 'ISIN removed on one row: reproduced by nothing', () => {
  const r = runChanged(changed((rows) => { rows[2] = row('B', { isin: false, qty: '7', avg: '33.333', ltp: '41.07' }); }));
  assert.equal(r.json.reproduction.reproduced, 7);
  assert.equal(rowOf(r, BASE, 'B').status, 'NOT_REPRODUCED');
});
scenario('changed field values', 'quantity changed on a small holding: that holding is not reproduced from the CSV', () => {
  const r = runChanged(changed((rows) => { rows[2] = row('B', { qty: '8', avg: '33.333', ltp: '41.07' }); }));
  assert.equal(r.json.result, 'PARTIAL');
  const b = rowOf(r, BASE, 'B');
  assert.equal(b.status, 'REPRODUCED_IDENTIFIERS_ONLY');
  for (const member of ['quantity', 'marketValue']) assert.ok(b.diagnostic.differingMembers.includes(member));
  assert.equal(b.diagnostic.differingMembers.includes('averageBuyPrice'), false);
  /* Weights are shares of the whole statement, so other holdings can move with it. Whatever is
   * not reproduced from the CSV is counted apart from "reproduced". */
  const s = r.json.reproduction;
  assert.ok(s.reproduced < 8);
  assert.equal(s.reproduced + s.notReproducedFromCsv, 8);
  assert.equal(s.reproducedIdentifiersOnly, s.notReproducedFromCsv);
  assert.equal(s.csvHoldingsMatchingNoStoredDigest, s.notReproducedFromCsv);
  assert.ok(r.json.unresolved.includes('STORED_DIGESTS_NOT_REPRODUCED_FROM_CSV'));
});
scenario('changed field values', 'quantity changed on the largest holding: every holding whose weight moved is not reproduced', () => {
  const r = runChanged(changed((rows) => { rows[6] = row('F', { qty: '"1,334"', avg: '"\u20B91,050.75"', ltp: '" 1,101.10 "' }); }));
  assert.equal(r.json.result, 'PARTIAL');
  assert.deepEqual(rowOf(r, BASE, 'F').diagnostic.differingMembers, ['quantity', 'marketValue', 'weightPercentage']);
  assert.deepEqual(rowOf(r, BASE, 'A').diagnostic.differingMembers, ['weightPercentage']);
  /* A holding is still reproduced only if its weight, rounded to four places, did not move.
   * The weaker result is kept apart from "reproduced". */
  const s = r.json.reproduction;
  assert.ok(s.reproduced <= 1, `reproduced ${s.reproduced}`);
  assert.equal(s.reproduced + s.notReproducedFromCsv, 8);
  assert.equal(s.reproducedIdentifiersOnly, s.notReproducedFromCsv);
  assert.equal(s.reproducedByNothing, 0);
  assert.equal(r.json.importProvenance.computed, false);
});
scenario('changed field values', 'average price changed on one row: only that holding is not reproduced', () => {
  const r = runChanged(changed((rows) => { rows[4] = row('D', { isin: false, qty: '12', avg: '10.2', ltp: '12.3' }); }));
  assert.equal(r.json.reproduction.reproduced, 7);
  const d = rowOf(r, BASE, 'D');
  assert.equal(d.status, 'REPRODUCED_IDENTIFIERS_ONLY');
  assert.deepEqual(d.diagnostic.differingMembers, ['averageBuyPrice']);
});
scenario('changed field values', 'a row added, and a row removed', () => {
  const added = runChanged(changed((rows) => { rows.push(row('I', { qty: '100000', avg: '200', ltp: '300' })); }));
  assert.equal(added.json.reproduction.csvDerivedHoldings, 9);
  assert.equal(added.json.reproduction.reproduced, 0);
  assert.equal(added.json.reproduction.csvHoldingsMatchingNoStoredDigest, 9);
  assert.equal(added.json.result, 'PARTIAL');
  const removed = runChanged(changed((rows) => { rows.splice(6, 1); }));
  assert.equal(removed.json.reproduction.csvDerivedHoldings, 7);
  assert.equal(removed.json.reproduction.reproduced, 0);
  assert.equal(rowOf(removed, BASE, 'F').diagnostic.csvHoldingsWithEqualSymbol, 0);
  /* Its ISIN is no longer in the CSV, so not even the weaker result is available for it. */
  assert.equal(rowOf(removed, BASE, 'F').status, 'NOT_REPRODUCED');
  assert.equal(removed.json.reproduction.reproducedByNothing, 1);
});
scenario('changed field values', 'rows reordered: per-holding digests reproduced, the whole-import digest is not', () => {
  /* Row order does not enter a per-holding digest. The file is still another file: its content
   * digest enters the whole-import digest, which therefore differs. Not REPRODUCED_ALL. */
  const r = runChanged(changed((rows) => { [rows[2], rows[5]] = [rows[5], rows[2]]; }));
  assert.equal(r.json.reproduction.reproduced, 8);
  assert.deepEqual(rowOf(r, BASE, 'B').csvLines, [6]);
  assert.deepEqual(r.json.importProvenance, { computed: true, equalsImportEvidence: false, equalsRevisionProvenance: false });
  assert.equal(r.json.result, 'PARTIAL');
  assert.equal(r.status, 1);
});
scenario('changed field values', 'a stored measure changed in the capture: digest reproduced, stored member reported as differing', () => {
  const victim = hOf(BASE, 'F');
  const files = layout(BASE, { captureText: captureWith(BASE, (d) => { d.holdings[victim - 1].quantity += 1; return d; }) });
  const r = run(BASE, files);
  assert.equal(r.json.result, 'PARTIAL');
  assert.equal(r.json.reproduction.reproduced, 8);
  assert.equal(r.json.reproduction.reproducedWithStoredMembersDiffering, 1);
  assert.deepEqual(r.json.holdings.find((h) => h.h === victim).storedMembersDiffering, ['quantity']);
  assert.ok(r.json.unresolved.includes('CHECK_FAILED:reproduction.storedMembers'));
});
scenario('changed field values', 'stored company identifier, identity status or import instant changed: not reproduced', () => {
  const victim = hOf(BASE, 'G');
  const company = run(BASE, layout(BASE, { captureText: captureWith(BASE, (d) => { d.holdings[victim - 1].companyId = E.X.companyId; return d; }) }));
  assert.equal(company.json.reproduction.reproduced, 7);
  assert.equal(company.json.holdings.find((h) => h.h === victim).status, 'NOT_REPRODUCED');
  const status = run(BASE, layout(BASE, { captureText: captureWith(BASE, (d) => { d.holdings[victim - 1].identityStatus = 'UNRESOLVED'; return d; }) }));
  assert.equal(status.json.reproduction.reproduced, 7);
  const instant = run(BASE, layout(BASE, { captureText: captureWith(BASE, (d) => { d.importEvidence[0].importedAt = '2026-11-14T01:02:03.005Z'; return d; }) }));
  assert.equal(instant.json.reproduction.reproduced, 0);
  assert.equal(instant.json.reproduction.reproducedByNothing, 8);
  assert.equal(instant.json.result, 'PARTIAL');
});
scenario('changed field values', 'whole-import digest: a changed file name or revision digest in the capture is detected', () => {
  const name = run(BASE, layout(BASE, { captureText: captureWith(BASE, (d) => { d.importEvidence[0].fileName = 'another-name.csv'; return d; }) }));
  assert.equal(name.json.reproduction.reproduced, 8);
  assert.deepEqual(name.json.importProvenance, { computed: true, equalsImportEvidence: false, equalsRevisionProvenance: false });
  assert.equal(name.json.result, 'PARTIAL');
  const revision = run(BASE, layout(BASE, { captureText: captureWith(BASE, (d) => { d.provenanceDigest = sha256('another revision digest'); return d; }) }));
  assert.deepEqual(revision.json.importProvenance, { computed: true, equalsImportEvidence: true, equalsRevisionProvenance: false });
  assert.equal(revision.json.result, 'PARTIAL');
});

/* ============================================================ 8. incorrect input digest */
scenario('incorrect input digest', 'a CSV changed by one byte: stops before anything is parsed or compared', () => {
  const content = `${BASE.content}\n`;
  const files = layout(BASE, { csvBytes: Buffer.from(content) });
  const r = run(BASE, files);
  expectStop(r, 'CSV_SHA256_NOT_EXPECTED');
  assert.equal(r.json.inputs.csv.decodedTextEqualsExpected, false);
  assert.equal(r.json.capture, null);
  assert.ok(r.json.unresolved.includes('CHECK_FAILED:csv.sha256'));
});
scenario('incorrect input digest', 'another statement entirely', () => {
  const other = csvOf([DETAILED_HEADER, row('J'), row('K', { qty: '3' })]);
  expectStop(run(BASE, layout(BASE, { csvBytes: Buffer.from(other) })), 'CSV_SHA256_NOT_EXPECTED');
});
scenario('incorrect input digest', 'without overrides the recorded digest applies: a synthetic CSV is refused', () => {
  const files = layout(BASE);
  const r = run(BASE, files, { args: ['--csv', files.csvPath, '--capture-dir', files.captureRoot] });
  expectStop(r, 'CSV_SHA256_NOT_EXPECTED');
  assert.equal(r.json.inputs.csv.expected, 'a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107');
  assert.equal(r.json.inputs.csv.expectedIsRecorded, true);
});
scenario('incorrect input digest', 'a changed CSV whose own digest is supplied: refused, the capture names another content digest', () => {
  const content = changed((rows) => { rows[2] = row('B', { qty: '8', avg: '33.333', ltp: '41.07' }); });
  const files = layout(BASE, { csvBytes: Buffer.from(content) });
  expectStop(run(BASE, files, { expectCsv: sha256(Buffer.from(content)) }), 'CAPTURE_HAS_NO_IMPORT_WITH_THIS_CONTENT_DIGEST');
});
scenario('incorrect input digest', 'a missing CSV, a folder given as the CSV, a malformed expected digest', () => {
  const files = layout(BASE);
  const common = ['--capture-dir', files.captureRoot, '--expected-csv-sha256', files.csvSha, '--expected-capture-sha256', files.captureSha];
  expectStop(run(BASE, files, { args: ['--csv', path.join(files.dir, 'absent.csv'), ...common] }), 'CSV_FILE_NOT_FOUND');
  expectStop(run(BASE, files, { args: ['--csv', files.dir, ...common] }), 'CSV_FILE_NOT_FOUND');
  expectStop(run(BASE, files, { args: ['--csv', files.csvPath, '--capture-dir', files.captureRoot, '--expected-csv-sha256', 'abc'] }), 'ARGUMENT_EXPECTED_DIGEST_NOT_SHA256');
});
scenario('incorrect input digest', 'a CSV of another broker format whose digest is linked: refused, not parsed as Dhan', () => {
  const zerodha = csvOf(['Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L', `${E.A.symbol},10,100.5,110.25,1102.5,97.5`]);
  const files = layout(BASE, { csvBytes: Buffer.from(zerodha), captureText: relinked(BASE, zerodha) });
  expectStop(run(BASE, files, { expectCsv: sha256(Buffer.from(zerodha)) }), 'CSV_NOT_A_DHAN_EXPORT');
});

/* ============================================================ 9. incorrect capture digest */
scenario('incorrect capture digest', 'the same capture content in other bytes: refused', () => {
  const compact = `${JSON.stringify(captureDocument(BASE))}\n`;
  const files = layout(BASE, { captureText: compact });
  const expected = sha256(Buffer.from(`${JSON.stringify(captureDocument(BASE), null, 2)}\n`));
  const r = run(BASE, files, { expectCapture: expected });
  expectStop(r, 'NO_CAPTURE_WITH_EXPECTED_SHA256');
  assert.equal(r.json.inputs.csv.decodedTextEqualsExpected, true);
  assert.equal(r.lines.filter((l) => l.startsWith('[INFO] capture.sha256.observed: ')).length, 1);
  assert.ok(r.json.unresolved.includes('CHECK_FAILED:capture.sha256'));
});
scenario('incorrect capture digest', 'without overrides the recorded capture digest applies: a synthetic capture is refused', () => {
  const files = layout(BASE);
  const r = run(BASE, files, { args: ['--csv', files.csvPath, '--capture-dir', files.captureRoot, '--expected-csv-sha256', files.csvSha] });
  expectStop(r, 'NO_CAPTURE_WITH_EXPECTED_SHA256');
});
scenario('incorrect capture digest', 'an empty capture folder, and a capture folder that does not exist', () => {
  const files = layout(BASE);
  const emptyDir = path.join(files.dir, 'empty-capture-root');
  mkdirSync(emptyDir);
  const common = ['--csv', files.csvPath, '--expected-csv-sha256', files.csvSha, '--expected-capture-sha256', files.captureSha];
  expectStop(run(BASE, files, { args: [...common, '--capture-dir', emptyDir] }), 'NO_EXACT_CAPTURE_FILE_FOUND');
  expectStop(run(BASE, files, { args: [...common, '--capture-dir', path.join(files.dir, 'absent')] }), 'CAPTURE_DIRECTORY_NOT_FOUND');
});
scenario('incorrect capture digest', 'a file with the expected digest that is not an exact capture', () => {
  const notJson = layout(BASE, { captureText: 'not json\n' });
  expectStop(run(BASE, notJson), 'CAPTURE_NOT_JSON');
  const otherSchema = layout(BASE, { captureText: `${JSON.stringify({ ...captureDocument(BASE), schema: 'another/v1' })}\n` });
  expectStop(run(BASE, otherSchema), 'CAPTURE_SCHEMA_UNEXPECTED');
});
scenario('incorrect capture digest', 'the two portfolio.get reads of the capture disagree: reported as a failed check', () => {
  const doc = captureDocument(BASE);
  doc.reads[3] = { ...doc.reads[3], wireResult: { ...wire(BASE.detail), revision: 2 } };
  const r = run(BASE, layout(BASE, { captureText: `${JSON.stringify(doc)}\n` }));
  assert.equal(r.json.result, 'PARTIAL');
  assert.ok(r.json.unresolved.includes('CHECK_FAILED:capture.reads.agree'));
});

/* ============================================================ read-only and output discipline */
scenario('read-only', 'runs under the Node permission model with file-system read only, same output', () => {
  const files = layout(BASE);
  const plain = run(BASE, files);
  const version = process.versions.node.split('.').map(Number);
  const flag = version[0] > 22 || (version[0] === 22 && version[1] >= 13) ? '--permission' : '--experimental-permission';
  const child = spawnSync(process.execPath, [flag, '--allow-fs-read=*', tool,
    '--csv', files.csvPath, '--capture-dir', files.captureRoot, '--expected-csv-sha256', files.csvSha, '--expected-capture-sha256', files.captureSha], { encoding: 'utf8' });
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout, plain.stdout);
});
scenario('read-only', 'the source imports three built-in modules, calls no writing API, and is ASCII with LF endings', () => {
  const source = readFileSync(tool);
  const text = source.toString('utf8');
  const imports = [...text.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]).sort();
  assert.deepEqual(imports, ['node:crypto', 'node:fs', 'node:path']);
  assert.equal(/\b(import|require)\s*\(\s*['"`]/.test(text), false, 'source loads a module dynamically');
  const fsNames = text.match(/^import \{([^}]+)\} from 'node:fs';$/m)[1].split(',').map((s) => s.trim()).sort();
  assert.deepEqual(fsNames, ['closeSync', 'existsSync', 'openSync', 'readFileSync', 'readdirSync', 'statSync']);
  assert.deepEqual([...text.matchAll(/openSync\(([^)]*)\)/g)].map((m) => m[1]), ["file, 'r'"]);
  assert.equal(/\b(write|writeFile|appendFile|mkdir|mkdtemp|rm|rmdir|unlink|rename|copyFile|cp|truncate|ftruncate|chmod|chown|utimes|symlink|link|createWriteStream|createReadStream|fetch|spawn|exec|execFile|fork)(Sync)?\s*\(/.test(text.replace(/process\.stdout\.write\(/g, '')), false, 'source calls a writing, process or network API');
  for (const forbidden of ['child_process', 'node:http', 'node:https', 'node:net', 'node:dgram', 'node:tls', 'node:worker_threads', 'process.env', 'process.stderr', 'createRequire', 'process.binding', 'eval(', 'new Function']) {
    assert.equal(text.includes(forbidden), false, `source mentions ${forbidden}`);
  }
  assert.equal(source.every((byte) => byte === 0x0a || (byte >= 0x20 && byte <= 0x7e)), true, 'source is not printable ASCII with LF endings');
});
scenario('read-only', 'arguments: none, an unknown one, a missing value, --help', () => {
  const files = layout(BASE);
  expectStop(run(BASE, files, { args: [] }), 'ARGUMENT_CSV_MISSING');
  expectStop(run(BASE, files, { args: ['--csv', files.csvPath] }), 'ARGUMENT_CAPTURE_DIR_MISSING');
  expectStop(run(BASE, files, { args: ['--csv', files.csvPath, '--capture-dir', files.captureRoot, '--data-dir', files.dir] }), 'ARGUMENT_UNKNOWN');
  expectStop(run(BASE, files, { args: ['--csv'] }), 'ARGUMENT_VALUE_MISSING');
  const help = spawnSync(process.execPath, [tool, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.equal(help.stdout.includes('usage: node w04-e4-csv-lineage-reproduction.mjs'), true);
});

/* ------------------------------------------------------------ summary */
rmSync(work, { recursive: true, force: true });
const failed = results.filter((r) => !r.ok);
const groups = [...new Set(results.map((r) => r.group))];
process.stdout.write('\n');
for (const group of groups) {
  const inGroup = results.filter((r) => r.group === group);
  process.stdout.write(`${group}: ${inGroup.filter((r) => r.ok).length} of ${inGroup.length} passed\n`);
}
process.stdout.write(`\nutility runs checked: ${runCount}, on ${caseNumber} input folders\n`);
process.stdout.write(`${results.length - failed.length} of ${results.length} scenarios passed\n`);
process.stdout.write('SYNTHETIC TOOL TEST. NOT EVIDENCE. The original CSV and the actual capture were not used.\n');
if (process.argv.includes('--print-sample') && sampleOutput !== null) {
  process.stdout.write('\n----- sample output of the utility on the synthetic 64-holding statement -----\n');
  process.stdout.write(sampleOutput);
}
process.exitCode = failed.length === 0 ? 0 : 1;
