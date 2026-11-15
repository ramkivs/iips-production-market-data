#!/usr/bin/env node
/**
 * Self-test of `w04-e4-identifier-supply-probe.mjs`. A TOOL TEST, NOT EVIDENCE.
 *
 * Everything here is synthetic: invented companies, invented identifiers, invented measures. No
 * line of its output describes an actual holding, and none of it is an E4 result.
 *
 * What it does:
 *   1. Runs the REAL IPD import pipeline (`BrokerImportIngressOrchestrator.executeIngress`) on a
 *      synthetic Dhan-format CSV against a synthetic security master.
 *   2. Commits the result with the REAL `persistBrokerImport` into an in-memory database, with a
 *      synthetic P7 registry that covers one of the five securities.
 *   3. Reads the stored portfolio back through the REAL store and shapes it as the `portfolio.get`
 *      wire result (IPD src/ipc/dispatch.ts `personalDetail`).
 *   4. Writes that as an exact-capture document, and writes an evidence journal in the IRR format
 *      (IRR frontend/server/broker-import/brokerImportEvidenceStore.ts), into a temporary folder.
 *   5. Runs the probe as a separate process on those two inputs and compares its aggregate output
 *      with the truth known by construction. It also checks that the output contains none of the
 *      synthetic identifiers, measures, file names or paths.
 *
 * Requires `npm run build:tsc` (it imports the compiled pipeline from `dist/`).
 * Run: node evidence/integration/w04-e4-identifier-supply-diagnosis-2026-11-14/probe-selftest.mjs
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');
const probe = path.join(here, 'w04-e4-identifier-supply-probe.mjs');
const dist = (relative) => import(pathToFileURL(path.join(repoRoot, 'dist', relative)).href);

const { BrokerImportIngressOrchestrator } = await dist('frontend/src/features/portfolio/import/broker-import-ingress.js');
const { SecurityMaster } = await dist('src/identity/security_master.js');
const { DhanInstrumentRegistry } = await dist('src/providers/dhan/dhan_instrument_map.js');
const { DurablePortfolioStore } = await dist('src/persistence/portfolio_store.js');
const { ensureMigrations } = await dist('src/persistence/migration_ledger.js');
const { GATE3_MIGRATIONS } = await dist('src/ipc/entrypoint.js');
const { persistBrokerImport } = await dist('src/persistence/brokerImportPersistence.js');

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

/* ------------------------------------------------------------ synthetic world */
const PORTFOLIO_ID = 'SYNTHETIC_SELFTEST_PORTFOLIO';
const FILE_NAME = 'synthetic-selftest-statement.csv';
const AS_OF = '2026-11-14T01:02:03.004Z';
const OWNER = { canonicalOwnerId: 'selftest-owner-user', tenantId: 'selftest-tenant' };
const ENTITIES = ['A', 'B', 'C', 'D', 'E'].map((letter, i) => ({
  letter, companyId: `COMP-SYNTH-${letter}`, isin: `INE000SYNT${i}${i}`, symbol: `QZSYM${letter}`,
}));

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
/* The synthetic registry maps entity A on NSE only: one of five holdings can be qualified. */
const registry = new DhanInstrumentRegistry();
registry.register({
  companyId: ENTITIES[0].companyId, isin: ENTITIES[0].isin, securityId: `ISIN:${ENTITIES[0].isin}:EQ`, exchange: 'NSE',
  symbol: ENTITIES[0].symbol, exchangeSegment: 'NSE_EQ', dhanSecurityId: 'SYNTH-NSE-EQ-1001', mappingProvenance: 'DHAN_INSTRUMENT_MASTER',
  instrumentType: 'EQUITY', active: true, lastVerifiedAt: '2026-11-06T05:27:53.7922492Z',
});
const resolver = {
  resolve(observation) {
    try {
      const companyId = observation.isin && observation.isin.trim()
        ? master.resolveCompanyId({ identifierType: 'ISIN', identifierValue: observation.isin.trim() })
        : master.resolveCompanyId({ identifierType: `${observation.exchange}_SYMBOL`, identifierValue: observation.symbol });
      return { status: 'RESOLVED', companyId, sourceRevision: 'selftest' };
    } catch {
      return { status: 'UNMAPPED', reason: 'UNMAPPED_IDENTIFIER: selftest', sourceRevision: 'selftest' };
    }
  },
};

/* Six native rows -> five holdings: A, B (two rows, aggregated), C carry an ISIN; D and E do not. */
const CSV = [
  'Trading Symbol,ISIN,Exchange,Total Qty,DP Qty,Available Qty,Average Buy Price,Last Traded Price,Current Value,Profit / Loss,P&L %',
  'QZSYMA,INE000SYNT00,NSE,10,10,10,100.5,110.25,1102.5,97.5,9.7',
  'QZSYMB,INE000SYNT11,NSE,7,7,7,33.333,41.07,287.49,54.1,23.2',
  'QZSYMC,INE000SYNT22,BSE,3,3,3,1000,999.95,2999.85,-0.15,0',
  'QZSYMD,,NSE,12,12,12,10.1,12.3,147.6,26.4,21.7',
  'QZSYME,,NSE,5,5,5,250,260.4,1302,52,4.1',
  'QZSYMB,INE000SYNT11,NSE,2,2,2,35,41.07,82.14,12.1,17.3',
].join('\n') + '\n';

/* ------------------------------------------------------------ real pipeline */
const ingress = BrokerImportIngressOrchestrator.executeIngress({ content: CSV, fileName: FILE_NAME, asOf: AS_OF, securityMaster: master });
assert.equal(ingress.success, true);
assert.equal(ingress.disposition, 'READY_FOR_PORTFOLIO_SAVE');

/* IRR frontend/src/api/brokerImportStage4.ts `prepareBrokerImport`, member for member. */
const request = {
  portfolioId: PORTFOLIO_ID,
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
const outcome = persistBrokerImport(store, OWNER, request, resolver, { securityMaster: master, registry });
assert.equal(outcome.ok, true, JSON.stringify(outcome));
assert.equal(outcome.revision, 1);

/* IPD src/ipc/dispatch.ts `personalDetail`. JSON round trip = what crosses the IPC wire. */
const wire = (value) => JSON.parse(JSON.stringify(value));
const detail = wire({
  ...store.get(OWNER, PORTFOLIO_ID),
  contributions: [],
  importEvidence: store.contributions(OWNER, PORTFOLIO_ID).map((row) => ({
    contentDigest: row.contentDigest, lineageDigest: row.lineageDigest, fileName: row.fileName, sourceBroker: row.sourceBroker,
    importedAt: row.importedAt, contributedAt: row.contributedAt, semantics: row.semantics,
  })),
});
const revisions = wire(store.revisions(OWNER, PORTFOLIO_ID));
assert.equal(detail.holdings.length, 5);
assert.equal(detail.holdings.filter((h) => h.securityIdentity === null).length, 4);

function captureDocument(mutate = (d) => d) {
  const get = mutate(wire(detail));
  return {
    schema: 'iips.w11-dep1.owner-bound-portfolio-capture.exact/v1',
    classification: 'SYNTHETIC SELF-TEST DOCUMENT - NOT A CAPTURE OF ANY PORTFOLIO',
    captureId: 'selftest', outcome: 'CONSISTENT_CAPTURE', evidenceEligibility: 'NOT_EVIDENCE_SYNTHETIC_TEST_PEER',
    selection: { method: 'selftest', listedPortfolioCount: 1, portfolioId: PORTFOLIO_ID },
    reads: [
      { sequence: 1, operation: 'portfolio.list', requestPayload: {}, wireResult: [] },
      { sequence: 2, operation: 'portfolio.get', requestPayload: { portfolioId: PORTFOLIO_ID }, wireResult: get },
      { sequence: 3, operation: 'portfolio.revisions', requestPayload: { portfolioId: PORTFOLIO_ID }, wireResult: revisions },
      { sequence: 4, operation: 'portfolio.get', requestPayload: { portfolioId: PORTFOLIO_ID }, wireResult: get },
    ],
  };
}

/* ------------------------------------------------------------ journal in the IRR format */
function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}
function evidenceRecord({ contentDigest, readAt, holdings, broker = 'DHAN', variant = 'DHAN_DETAILED_HOLDINGS_V1' }) {
  const rows = holdings.map((h, i) => ({
    rowIndex: i + 1, symbol: h.symbol, isin: h.isin ?? null, exchange: h.exchange ?? null, quantity: h.quantity,
    averagePrice: h.averagePrice, currentPrice: h.currentPrice ?? null, identityStatus: 'RESOLVED', identityBasis: 'PIPELINE_RESOLVED',
    identityRefusalCode: null, quarantineIds: [],
  }));
  const withoutDigest = {
    schema: 'IIPS_BROKER_IMPORT_EVIDENCE_V1',
    importId: sha256(`${broker}\u0000${contentDigest}\u0000${readAt}`),
    tenantId: OWNER.tenantId, ownerUserId: OWNER.canonicalOwnerId, portfolioSlot: 'DEFAULT_PORTFOLIO', broker, variant,
    fileName: FILE_NAME, readAt, contentDigest, status: 'PARSED_IDENTITIES_RESOLVED',
    identityAuthority: { source: 'IPD_GOVERNED_D05_SECURITY_MASTER', entities: ENTITIES.length },
    counts: { nativeRows: rows.length, identityAssessedRows: rows.length, identityResolvedRows: rows.length, identityUnresolvedRows: 0, savedRows: 0 },
    rows, pipelineRefusals: [], warnings: [],
    validation: { performed: false, reason: 'selftest' }, saveAuthorization: { authorized: false, reason: 'selftest' },
    persistence: { performed: false, reason: 'selftest' },
    reconciliation: { importedRows: rows.length, savedRows: 0, difference: rows.length, disposition: 'NO_HOLDINGS_SAVED' },
    limitations: ['selftest'],
  };
  return { ...withoutDigest, recordDigest: sha256(canonicalJson(withoutDigest)) };
}
function journalLine(seq, payload) {
  return JSON.stringify({
    seq, op: 'create', recordId: `selftest-record-${seq}`, tenantId: OWNER.tenantId, ownerUserId: OWNER.canonicalOwnerId,
    dedupKey: `IIPS_BROKER_IMPORT_EVIDENCE_V1:${payload.importId}`, payload, createdAt: AS_OF,
  });
}
const matching = evidenceRecord({ contentDigest: ingress.provenance.contentDigest, readAt: AS_OF, holdings: ingress.parseResult.holdings });
const unrelated = evidenceRecord({ contentDigest: sha256('unrelated synthetic content'), readAt: '2026-11-01T00:00:00.000Z', holdings: ingress.parseResult.holdings.slice(0, 2), variant: null });
const HEADER = JSON.stringify({ journalFormatVersion: 1 });
const journalText = (payloads, tail = '') =>
  `${[HEADER, ...payloads.map((p, i) => journalLine(i + 1, p)), JSON.stringify({ seq: 99, op: 'readState', recordId: 'selftest-record-1', read: true, updatedAt: AS_OF })].join('\n')}\n${tail}`;

/* ------------------------------------------------------------ scenarios */
const work = mkdtempSync(path.join(tmpdir(), 'w04-e4-selftest-'));
const FORBIDDEN = [
  ...ENTITIES.flatMap((e) => [e.companyId, e.isin, e.symbol]), FILE_NAME, OWNER.tenantId, OWNER.canonicalOwnerId, work, AS_OF,
  '33.70344444444444', '110.25', '999.95', PORTFOLIO_ID,
];
let scenarios = 0;

function run(name, { capture = captureDocument(), journal, expectedDigest, extraArgs = [], dataDirExists = true }) {
  const dir = path.join(work, name);
  const dataDir = path.join(dir, 'iips-data');
  mkdirSync(dir, { recursive: true });
  if (dataDirExists) mkdirSync(dataDir, { recursive: true });
  const captureFile = path.join(dir, 'exact-owner-bound-portfolio-capture.json');
  const captureBytes = Buffer.from(`${JSON.stringify(capture, null, 2)}\n`, 'utf8');
  writeFileSync(captureFile, captureBytes);
  if (journal !== undefined) writeFileSync(path.join(dataDir, 'journal.ndjson'), journal);
  const before = journal === undefined ? null : sha256(readFileSync(path.join(dataDir, 'journal.ndjson')));
  const child = spawnSync(process.execPath, [probe, '--capture', captureFile, '--data-dir', dataDir,
    '--expected-capture-sha256', expectedDigest ?? sha256(captureBytes), ...extraArgs], { encoding: 'utf8' });
  const stdout = child.stdout;
  assert.equal(child.stderr, '', `${name}: the probe wrote to stderr`);
  FORBIDDEN.forEach((secret, index) => assert.equal(stdout.includes(secret), false, `${name}: output discloses synthetic value number ${index}`));
  assert.equal(sha256(readFileSync(captureFile)), sha256(captureBytes), `${name}: capture file changed`);
  if (before !== null) assert.equal(sha256(readFileSync(path.join(dataDir, 'journal.ndjson'))), before, `${name}: journal changed`);
  const jsonLine = stdout.split('\n').find((l) => l.startsWith('E4_RESULT_JSON: '));
  scenarios += 1;
  return { status: child.status, stdout, result: jsonLine ? JSON.parse(jsonLine.slice('E4_RESULT_JSON: '.length)) : null };
}

try {
  /* S1: matched record present. Every holding determined; whole-import digest reproduced. */
  {
    const { status, result, stdout } = run('s1-matched-record', { journal: journalText([unrelated, matching]) });
    assert.equal(status, 0, stdout);
    assert.equal(result.result, 'COMPLETE');
    assert.deepEqual(result.classification.classes.withIdentity, { 'ISIN+EXCHANGE_NSE': 1 });
    assert.deepEqual(result.classification.classes.nullIdentity, { 'ISIN+EXCHANGE_BSE': 1, 'ISIN+EXCHANGE_NSE': 1, 'NO_ISIN+EXCHANGE_NSE': 2 });
    assert.deepEqual(result.classification.evidenceUsed, { MATCHED_EVIDENCE_RECORD: 2, NO_IDENTIFIER_NEEDED: 2, OWN_STORED_IDENTITY: 1 });
    const c = result.classification.causes;
    assert.equal(c.nullIdentityHoldings, 4);
    assert.deepEqual([c.A_NO_ISIN_IN_COMMITTED_INPUT.count, c.B_ISIN_WITHOUT_EXCHANGE_IN_COMMITTED_INPUT.count, c.C_ISIN_AND_EXCHANGE_BUT_NO_IDENTITY.count, c.D_UNDETERMINED.count], [2, 0, 2, 0]);
    assert.equal(c.C_ISIN_AND_EXCHANGE_BUT_NO_IDENTITY.qualificationPathEvidencedByHoldingsWithIdentity, 1);
    assert.equal(result.verification.importProvenanceDigest, 'EQUAL');
    assert.equal(result.verification.equalsRevisionProvenanceDigest, true);
    assert.equal(result.e4.recordFound, true);
    assert.equal(result.e4.matchedRecords.length, 1);
    const m = result.e4.matchedRecords[0];
    assert.equal(m.recordDigestRecomputedEqual && m.importIdRecomputedEqual && m.dedupKeyConsistent && m.readAtEqualsCommittedImportInstant, true);
    assert.deepEqual([m.rows.rows, m.rows.isinPresent, m.rows.isinNull, m.rows.isinSyntaxValid, m.rows.distinctIsins, m.rows.distinctGroupKeys], [6, 4, 2, 4, 3, 5]);
    assert.deepEqual(m.rows.exchange, { BSE: 1, NSE: 5 });
    assert.deepEqual([m.rows.isinAndExchange, m.rows.exchangeWithoutIsin], [4, 2]);
    assert.equal(m.rowCountEqualsHoldings, false);
    assert.equal(m.groupKeyCountEqualsHoldings, true);
    assert.equal(result.e4.journals[0].evidenceRecords, 2);
    assert.equal(result.e4.journals[0].operations.readState, 1);
    assert.equal(result.capture.importEvidence[0].contentDigest, sha256(Buffer.from(CSV, 'utf8')));
  }
  /* S2: no journal. The capture alone settles the holdings without an ISIN; the rest stay unknown. */
  {
    const { status, result } = run('s2-no-journal', {});
    assert.equal(status, 1);
    assert.equal(result.result, 'PARTIAL');
    assert.equal(result.e4.recordFound, false);
    assert.equal(result.e4.journals[0].journalExists, false);
    assert.deepEqual(result.classification.classes.nullIdentity, { 'NO_ISIN+EXCHANGE_NSE': 2, UNDETERMINED: 2 });
    assert.equal(result.classification.causes.A_NO_ISIN_IN_COMMITTED_INPUT.count, 2);
    assert.equal(result.classification.causes.D_UNDETERMINED.count, 2);
    assert.equal(result.verification.importProvenanceDigest, 'NOT_COMPUTED');
  }
  /* S3: data directory absent. */
  {
    const { status, result } = run('s3-no-data-directory', { dataDirExists: false });
    assert.equal(status, 1);
    assert.equal(result.e4.journals[0].dataDirectoryExists, false);
    assert.equal(result.classification.causes.D_UNDETERMINED.count, 2);
  }
  /* S4: journal holds only an unrelated record. Nothing is substituted. */
  {
    const { status, result } = run('s4-unrelated-record-only', { journal: journalText([unrelated]) });
    assert.equal(status, 1);
    assert.equal(result.e4.recordFound, false);
    assert.equal(result.e4.journals[0].evidenceRecords, 1);
    assert.equal(result.classification.causes.D_UNDETERMINED.count, 2);
  }
  /* S5: matched record altered after retention. It fails its digest and its rows are not used. */
  {
    const tampered = JSON.parse(JSON.stringify(matching));
    tampered.rows[1].exchange = 'BSE';
    const { status, result, stdout } = run('s5-altered-record', { journal: journalText([tampered]) });
    assert.equal(status, 1);
    assert.equal(result.e4.matchedRecords[0].recordDigestRecomputedEqual, false);
    assert.equal(result.classification.causes.D_UNDETERMINED.count, 2);
    assert.match(stdout, /\[FAIL\] match\[1\]\.recordDigest/);
  }
  /* S6: the capture is not the expected one. Nothing is classified. */
  {
    const { status, result, stdout } = run('s6-other-capture', { journal: journalText([matching]), expectedDigest: 'a'.repeat(64) });
    assert.equal(status, 2);
    assert.equal(result, null);
    assert.match(stdout, /CAPTURE_SHA256_NOT_EXPECTED/);
    assert.match(stdout, /RESULT: INCONCLUSIVE/);
  }
  /* S7: a truncated final journal line (an append in progress) is counted and tolerated. */
  {
    const { status, result } = run('s7-truncated-tail', { journal: journalText([matching], '{"seq":100,"op":"create","recordId":"x","payl') });
    assert.equal(status, 0);
    assert.equal(result.e4.journals[0].unparseableFinalLine, 1);
    assert.equal(result.e4.journals[0].unparseableOtherLines, 0);
  }
  /* S8: a stored measure differs from the committed one. That holding is reported undetermined. */
  {
    const altered = captureDocument((d) => {
      const target = d.holdings.find((h) => h.securityIdentity === null);
      target.quantity += 1;
      return d;
    });
    const { status, result } = run('s8-measure-differs', { capture: altered, journal: journalText([matching]) });
    assert.equal(status, 1);
    assert.equal(result.classification.causes.D_UNDETERMINED.count, 1);
    assert.equal(result.verification.holdingLineageDigestsReproduced, 4);
  }
  /* S9: registry cross-check against the tracked manifest. Synthetic ISINs are not in it. */
  {
    const { status, result } = run('s9-registry', { journal: journalText([matching]), extraArgs: ['--ipd-root', repoRoot] });
    assert.equal(status, 0);
    assert.equal(result.registry.manifestSha256IsRecorded, true);
    assert.deepEqual(result.registry.nullIdentity, { isinAndExchange: 2, pairInManifest: 0, pairNotInManifest: 2 });
    assert.equal(result.registry.entriesNotUnderstood, 0);
  }
  /* S10: no import evidence on the wire (plain PortfolioDetail). No match key; nothing classified. */
  {
    const plain = captureDocument((d) => {
      delete d.importEvidence;
      return d;
    });
    const { status, result } = run('s10-no-match-key', { capture: plain, journal: journalText([matching]) });
    assert.equal(status, 1);
    assert.equal(result.capture.matchKeyAvailable, false);
    assert.equal(result.e4.recordFound, false);
    assert.equal(result.classification.causes.D_UNDETERMINED.count, 4);
  }
  /* S11: no --capture. The default capture root is searched and the capture is chosen by digest only. */
  {
    const root = path.join(work, 's11-default-root', 'IIPS', 'w11-dep1-capture');
    const place = (runName, document) => {
      const dir = path.join(root, runName, 'LOCAL-ONLY-DO-NOT-PUBLISH');
      mkdirSync(dir, { recursive: true });
      const bytes = Buffer.from(`${JSON.stringify(document, null, 2)}\n`, 'utf8');
      writeFileSync(path.join(dir, 'exact-owner-bound-portfolio-capture.json'), bytes);
      return sha256(bytes);
    };
    place('run-newer-other', captureDocument((d) => ({ ...d, holdings: d.holdings.slice(0, 2), holdingsCount: 2 })));
    const wanted = place('run-older-wanted', captureDocument());
    const dataDir = path.join(work, 's11-default-root', 'iips-data');
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(path.join(dataDir, 'journal.ndjson'), journalText([matching]));
    const child = spawnSync(process.execPath, [probe, '--data-dir', dataDir, '--expected-capture-sha256', wanted],
      { encoding: 'utf8', env: { ...process.env, LOCALAPPDATA: path.join(work, 's11-default-root') } });
    assert.equal(child.status, 0, child.stdout);
    assert.match(child.stdout, /2 exact capture file\(s\) examined, 1 with the expected SHA-256/);
    FORBIDDEN.forEach((secret, index) => assert.equal(child.stdout.includes(secret), false, `s11: output discloses synthetic value number ${index}`));
    const result = JSON.parse(child.stdout.split('\n').find((l) => l.startsWith('E4_RESULT_JSON: ')).slice('E4_RESULT_JSON: '.length));
    assert.equal(result.capture.captureSha256, wanted);
    assert.equal(result.capture.holdings, 5);
    scenarios += 1;
  }
  process.stdout.write(`probe self-test: ${scenarios} scenarios, all assertions passed (synthetic data; a tool test, not evidence)\n`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
