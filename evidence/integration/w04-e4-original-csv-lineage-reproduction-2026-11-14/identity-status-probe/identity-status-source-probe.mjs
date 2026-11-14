#!/usr/bin/env node
/**
 * W04 E4 - identity status versus security identity: sandbox source probe.
 *
 * SANDBOX ONLY. SYNTHETIC STATEMENT. NOT HOST EVIDENCE.
 *
 * Question: the host capture reports identityStatus RESOLVED and resolutionDisposition
 * CANONICAL_P04 on 64 of 64 holdings, and a securityIdentity object on 1 of 64. Is that a state
 * the reviewed IPD code produces, and from which inputs?
 *
 * What it runs: the unmodified compiled IPD code of this checkout (dist/), with the two identity
 * sources tracked in this repository: the governed P04 master and the retained P7 qualification
 * manifest. The statement is invented: the securities are taken from the tracked master by a fixed
 * rule, the quantities and prices are made up. No holding of any portfolio is involved.
 *
 * What it prints: counts, closed-vocabulary values and digests of tracked files. No ISIN, no
 * symbol, no company identifier, no quantity, no price.
 *
 * What it does not show: which sources the host loaded, which build wrote revision 1, or which of
 * the Principal's holdings has the stored identity. Those are host facts.
 *
 * Run from the repository root after `npx tsc`:
 *   node evidence/integration/w04-e4-original-csv-lineage-reproduction-2026-11-14/identity-status-probe/identity-status-source-probe.mjs
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..', '..');
const utility = path.resolve(here, '..', 'w04-e4-csv-lineage-reproduction.mjs');
const manifestPath = path.join(repoRoot, 'evidence', 'dhan-p7', 'qualification-manifest.json');
if (!existsSync(path.join(repoRoot, 'dist', 'src', 'persistence', 'brokerImportPersistence.js'))) {
  console.error('dist/ is missing: run `npm ci --ignore-scripts` and `npx tsc` first.');
  process.exit(2);
}
process.chdir(repoRoot); // the registry loader looks for the manifest under the working directory first

const dist = (rel) => import(pathToFileURL(path.join(repoRoot, 'dist', rel)).href);
const { BrokerImportIngressOrchestrator } = await dist('frontend/src/features/portfolio/import/broker-import-ingress.js');
const G = await dist('src/identity/governed_fixture_master.js');
const { createGovernedBrokerObservationResolver } = await dist('src/identity/broker_observation_resolver.js');
const { qualifyHoldingSecurityIdentity } = await dist('src/providers/dhan/dhan_security_identity_service.js');
const { DhanInstrumentRegistry } = await dist('src/providers/dhan/dhan_instrument_map.js');
const { composeBrokerImportIdentityDependencies, brokerImportConsumerOptions } = await dist('src/ipc/brokerImportComposition.js');
const { DurablePortfolioStore } = await dist('src/persistence/portfolio_store.js');
const { ensureMigrations } = await dist('src/persistence/migration_ledger.js');
const { GATE3_MIGRATIONS } = await dist('src/ipc/entrypoint.js');
const { persistBrokerImport } = await dist('src/persistence/brokerImportPersistence.js');

const sha = (d) => createHash('sha256').update(d).digest('hex');
const out = [];
const say = (line = '') => out.push(line);
const tally = (values) => {
  const t = {};
  for (const v of values) t[v] = (t[v] ?? 0) + 1;
  return JSON.stringify(Object.fromEntries(Object.entries(t).sort(([a], [b]) => (a < b ? -1 : 1))));
};
let failed = 0;
const check = (label, ok) => {
  if (!ok) failed += 1;
  say(`[${ok ? 'PASS' : 'FAIL'}] ${label}`);
};

say('W04 E4 - identity status versus security identity: sandbox source probe.');
say('SANDBOX ONLY. SYNTHETIC STATEMENT. NOT HOST EVIDENCE. Counts and closed-vocabulary values only.');
say();

/* ---------------------------------------------------------------- 1. the two tracked sources */
const master = G.getGovernedBroadSecurityMaster();
const entities = G.D05_AUTHENTICATED_UNIVERSE_ENTITIES;
const dependencies = composeBrokerImportIdentityDependencies(); // the production composition
const registry = dependencies.registry;
const resolver = createGovernedBrokerObservationResolver();
const AS_OF = '2026-11-14T03:04:05.006Z';

say('== 1. Sources, as tracked in this repository');
say(`[INFO] p04.master: batch ${master.sourceRevision?.batchId}; ${master.sourceRevision?.recordCount} records; ${entities.length} entities`);
say(`[INFO] p7.manifest.sha256: ${sha(readFileSync(manifestPath))}`);
say(`[INFO] p7.registry: ${registry.list().length} mappings loaded by composeBrokerImportIdentityDependencies(); by segment ${tally(registry.list().map((m) => m.exchangeSegment))}; distinct ISINs ${new Set(registry.list().map((m) => m.isin)).size}`);
say();

/* ------------------------------------- 2. company gate and security qualification, whole master */
say('== 2. The two decisions, over every ACTIVE NSE and BSE listing of the tracked master');
const pairs = [];
for (const e of entities) {
  for (const l of e.listings ?? []) {
    if (l.status === 'ACTIVE' && (l.exchange === 'NSE' || l.exchange === 'BSE') && e.isin) {
      pairs.push({ isin: e.isin, symbol: l.symbol, exchange: l.exchange });
    }
  }
}
const gate = pairs.map((p) => resolver.resolve(p, AS_OF).status);
const qual = pairs.map((p) => {
  const r = qualifyHoldingSecurityIdentity({ isin: p.isin, exchange: p.exchange, symbol: p.symbol }, master, registry);
  return r.status === 'QUALIFIED' ? 'QUALIFIED' : `UNRESOLVED:${r.reason}`;
});
say(`[INFO] pairs: ${pairs.length} (ISIN, exchange, listing symbol); by exchange ${tally(pairs.map((p) => p.exchange))}`);
say(`[INFO] companyGate (resolver.resolve; decides identityStatus and resolutionDisposition): ${tally(gate)}`);
say(`[INFO] securityQualification (qualifyHoldingSecurityIdentity; decides securityIdentity): ${tally(qual)}`);
say(`[INFO] securityQualification by exchange: NSE ${tally(qual.filter((_, i) => pairs[i].exchange === 'NSE'))}; BSE ${tally(qual.filter((_, i) => pairs[i].exchange === 'BSE'))}`);
const both = tally(pairs.map((_, i) => `${gate[i]}+${qual[i]}`));
say(`[INFO] joint: ${both}`);
check('every pair passes the company gate', gate.every((s) => s === 'RESOLVED'));
check('a pair that passes the company gate can fail security qualification', qual.some((q) => q !== 'QUALIFIED'));
say();

/* --------------------------------------------- 3. a synthetic import of the shape the host reports */
say('== 3. Synthetic import of the reported shape, through the production composition');
const qualifying = (p) => qualifyHoldingSecurityIdentity({ isin: p.isin, exchange: p.exchange }, master, registry).status === 'QUALIFIED';
const nse = pairs.filter((p) => p.exchange === 'NSE');
const bse = pairs.filter((p) => p.exchange === 'BSE');
const picked = [];
const usedIsin = new Set();
const take = (list, want, n, stride) => {
  let got = 0;
  for (let i = 0; i < list.length && got < n; i += stride) {
    const p = list[i];
    if (usedIsin.has(p.isin) || qualifying(p) !== want) continue;
    usedIsin.add(p.isin);
    picked.push(p);
    got += 1;
  }
  if (got !== n) throw new Error('the tracked master does not supply the synthetic selection');
};
take(nse, true, 1, 1);    // one NSE row whose ISIN has a P7 mapping
take(nse, false, 62, 31); // 62 NSE rows whose ISIN has none
take(bse, false, 1, 53);  // one BSE row whose ISIN has none
const HEADER = 'Trading Symbol,ISIN,Exchange,Total Qty,DP Qty,Available Qty,Average Buy Price,Last Traded Price,Current Value,Profit / Loss,P&L %';
const lines = [HEADER];
picked.forEach((p, i) => {
  const q = 1 + ((i * 13) % 47);
  lines.push([p.symbol, p.isin, p.exchange, q, q, q, (10.11 + i * 7.3).toFixed(2), (9.5 + i * 8.1).toFixed(2), 0, 0, 0].join(','));
});
const content = `${lines.join('\r\n')}\r\n`;
const FILE_NAME = 'synthetic-statement.csv';
// The options of IRR's preview (frontend/src/api/brokerHoldingsPreview.ts).
const ingress = BrokerImportIngressOrchestrator.executeIngress({
  content, fileName: FILE_NAME, asOf: AS_OF, securityMaster: master,
  failOnUnmappedIdentity: true, allowNonProductionBypass: false, allowPartialRejection: false,
  executionEnvironment: 'NON_PRODUCTION',
});
say(`[INFO] statement: ${picked.length} rows; by exchange ${tally(picked.map((p) => p.exchange))}; every row has an ISIN and an exchange`);
say(`[INFO] ingress (browser side): success ${ingress.success}; holdings ${ingress.userHoldings.length}; identityStatus ${tally(ingress.userHoldings.map((h) => h.identityStatus))}; resolutionDisposition ${tally(ingress.userHoldings.map((h) => h.resolutionDisposition))}`);

const requestOf = () => ({
  portfolioId: 'DHAN_PORTFOLIO',
  expectedRevision: 0,
  holdings: ingress.userHoldings.map((h) => ({
    symbol: h.symbol, ...(h.isin ? { isin: h.isin } : {}), ...(h.exchange ? { exchange: h.exchange } : {}),
    quantity: h.quantity, averageBuyPrice: h.averageBuyPrice, currentPrice: h.currentPrice, marketValue: h.marketValue,
    weightPercentage: h.weightPercentage, active: h.active, sourceBroker: String(h.sourceBroker), lineageDigest: h.lineageDigest,
  })),
  contentDigest: ingress.provenance.contentDigest,
  fileName: ingress.provenance.fileName,
  sourceBroker: String(ingress.provenance.sourceBroker),
  importedAt: ingress.provenance.asOf,
  mode: 'MERGE',
});
const OWNER = { canonicalOwnerId: 'synthetic-owner', tenantId: 'synthetic-tenant' };
const freshStore = () => {
  const db = new DatabaseSync(':memory:');
  ensureMigrations(db, GATE3_MIGRATIONS);
  // The store reads and writes for an owner with an ACTIVE local binding and membership only.
  db.prepare(`INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at)
              VALUES ('synthetic-binding', 'synthetic-principal', 'ACTIVE', ?, ?, NULL)`).run(AS_OF, AS_OF);
  db.prepare(`INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at)
              VALUES ('synthetic-membership', 'synthetic-binding', ?, ?, 'ACTIVE', ?, ?, NULL)`).run(OWNER.tenantId, OWNER.canonicalOwnerId, AS_OF, AS_OF);
  return { db, store: new DurablePortfolioStore(db) };
};
const identityCounts = (holdings) => {
  let object = 0; let nul = 0; let absent = 0;
  for (const h of holdings) {
    if (!Object.prototype.hasOwnProperty.call(h, 'securityIdentity') || h.securityIdentity === undefined) absent += 1;
    else if (h.securityIdentity === null) nul += 1;
    else object += 1;
  }
  return { object, null: nul, absent };
};
const wire = (v) => JSON.parse(JSON.stringify(v));

// 3a. The production composition: governed master and the registry read from the tracked manifest.
const main = freshStore();
const outcome = persistBrokerImport(main.store, OWNER, requestOf(), undefined, brokerImportConsumerOptions(dependencies));
say(`[INFO] persistBrokerImport: ok ${outcome.ok}; disposition ${outcome.disposition}; revision ${outcome.revision}; holdingsPersisted ${outcome.holdingsPersisted}`);
if (outcome.ok !== true) throw new Error(`the synthetic import was not committed: ${outcome.code}`);
const columns = main.db.prepare(
  `SELECT identity_status AS s, resolution_disposition AS d, CASE WHEN security_identity IS NULL THEN 'NULL' ELSE 'TEXT' END AS i, COUNT(*) AS n
     FROM portfolio_holdings GROUP BY 1, 2, 3 ORDER BY 3`,
).all();
say(`[INFO] stored columns (identity_status | resolution_disposition | security_identity): ${columns.map((r) => `${r.s} | ${r.d} | ${r.i} = ${r.n}`).join('; ')}`);
const stored = main.store.get(OWNER, 'DHAN_PORTFOLIO');
const detail = wire({
  ...stored,
  contributions: [],
  importEvidence: main.store.contributions(OWNER, 'DHAN_PORTFOLIO').map((c) => ({
    contentDigest: c.contentDigest, lineageDigest: c.lineageDigest, fileName: c.fileName, sourceBroker: c.sourceBroker,
    importedAt: c.importedAt, contributedAt: c.contributedAt, semantics: c.semantics,
  })),
});
const counts = identityCounts(detail.holdings);
say(`[INFO] portfolio.get wire result: holdings ${detail.holdings.length}; identityStatus ${tally(detail.holdings.map((h) => h.identityStatus))}; resolutionDisposition ${tally(detail.holdings.map((h) => h.resolutionDisposition))}`);
say(`[INFO] portfolio.get wire result: securityIdentity object ${counts.object}; null ${counts.null}; absent ${counts.absent}`);
const objectSeries = detail.holdings.filter((h) => h.securityIdentity).map((h) => `${h.securityIdentity.series}/${h.securityIdentity.isinAuthority}`);
say(`[INFO] the stored identity object: series/isinAuthority ${tally(objectSeries)}`);
check('64 holdings are RESOLVED and CANONICAL_P04 while 63 carry securityIdentity null and 1 carries an object',
  detail.holdings.length === 64 && detail.holdings.every((h) => h.identityStatus === 'RESOLVED' && h.resolutionDisposition === 'CANONICAL_P04')
  && counts.object === 1 && counts.null === 63 && counts.absent === 0);
const pipelineCompany = new Map(ingress.userHoldings.map((h) => [h.symbol, h.companyId]));
check('the company identifier the server stored equals the one the browser side put inside the lineage digest, on 64 of 64',
  detail.holdings.every((h) => pipelineCompany.get(h.symbol) === h.companyId));

// 3b. The published lineage utility on this synthetic statement and a capture-shaped file.
const doc = {
  schema: 'iips.w11-dep1.owner-bound-portfolio-capture.exact/v1',
  outcome: 'CONSISTENT_CAPTURE',
  evidenceEligibility: 'NOT_EVIDENCE_SYNTHETIC_TEST_PEER',
  selection: { portfolioId: 'DHAN_PORTFOLIO' },
  reads: [
    { sequence: 1, operation: 'portfolio.list', wireResult: [] },
    { sequence: 2, operation: 'portfolio.get', wireResult: detail },
    { sequence: 3, operation: 'portfolio.revisions', wireResult: wire(main.store.revisions(OWNER, 'DHAN_PORTFOLIO')) },
    { sequence: 4, operation: 'portfolio.get', wireResult: detail },
  ],
};
const dir = mkdtempSync(path.join(tmpdir(), 'w04-e4-identity-probe-'));
try {
  const cap = path.join(dir, 'capture', 'run', 'LOCAL-ONLY-DO-NOT-PUBLISH');
  mkdirSync(cap, { recursive: true });
  const text = JSON.stringify(doc, null, 2);
  writeFileSync(path.join(cap, 'exact-owner-bound-portfolio-capture.json'), text);
  writeFileSync(path.join(dir, FILE_NAME), content);
  const run = spawnSync(process.execPath, [utility, '--csv', path.join(dir, FILE_NAME), '--capture-dir', path.join(dir, 'capture'),
    '--expected-csv-sha256', sha(content), '--expected-capture-sha256', sha(text)], { encoding: 'utf8' });
  const keep = /reproduction\.(reproduced|ambiguous|unmatched)|input\.reproduced\.|^RESULT/;
  for (const line of run.stdout.split('\n').filter((l) => keep.test(l))) say(`[UTILITY] ${line}`);
  say(`[INFO] utility: sha256 ${sha(readFileSync(utility))}; exit ${run.status}`);
  check('the published utility reproduces 64 of 64 on the synthetic statement and reports the null identities as ISIN+EXCHANGE inputs',
    run.status === 0 && /RESULT: REPRODUCED_ALL/.test(run.stdout)
    && run.stdout.includes('"ISIN+EXCHANGE_NSE":62') && run.stdout.includes('"ISIN+EXCHANGE_BSE":1'));
} finally {
  rmSync(dir, { recursive: true, force: true });
}
say();

/* ------------------------------------------------------------------------------- 4. controls */
say('== 4. Controls on the same synthetic statement');

// 4a. A caller cannot supply the status: the request is refused.
const c1 = freshStore();
const tampered = requestOf();
tampered.holdings[0] = { ...tampered.holdings[0], identityStatus: 'UNRESOLVED' };
const r1 = persistBrokerImport(c1.store, OWNER, tampered, undefined, brokerImportConsumerOptions(dependencies));
say(`[INFO] callerSuppliedStatus: ok ${r1.ok}; code ${r1.code}; storeEffect ${r1.storeEffect}`);
check('a request that carries identityStatus is refused with no store effect', r1.ok === false && r1.code === 'INVALID_REQUEST' && r1.storeEffect === 'NONE');

// 4b. One row that fails the company gate refuses the whole import.
const c2 = freshStore();
const mixed = requestOf();
mixed.holdings[1] = { ...mixed.holdings[1], isin: mixed.holdings[0].isin }; // the ISIN of another company
const r2 = persistBrokerImport(c2.store, OWNER, mixed, undefined, brokerImportConsumerOptions(dependencies));
say(`[INFO] oneRowFailsCompanyGate: ok ${r2.ok}; code ${r2.code}; storeEffect ${r2.storeEffect}; refused ${r2.refusedHoldings?.length}; portfolios stored ${c2.store.list(OWNER).length}`);
check('one row without a single company identity refuses the whole import, so no committed holding can be other than RESOLVED',
  r2.ok === false && r2.code === 'REFUSED_UNRESOLVED_IDENTITY' && c2.store.list(OWNER).length === 0);

// 4c. An empty registry: the company result is unchanged, no security identity is stored.
const c3 = freshStore();
persistBrokerImport(c3.store, OWNER, requestOf(), undefined, { securityMaster: master, registry: new DhanInstrumentRegistry() });
const h3 = wire(c3.store.get(OWNER, 'DHAN_PORTFOLIO')).holdings;
say(`[INFO] emptyRegistry: identityStatus ${tally(h3.map((h) => h.identityStatus))}; securityIdentity ${JSON.stringify(identityCounts(h3))}`);
check('with an empty registry all 64 are still RESOLVED and none has a security identity',
  h3.every((h) => h.identityStatus === 'RESOLVED') && identityCounts(h3).object === 0);

// 4d. No identity dependencies (the pre-Stage-4 fallback): no series is supplied, so nothing is built.
const c4 = freshStore();
persistBrokerImport(c4.store, OWNER, requestOf());
const h4 = wire(c4.store.get(OWNER, 'DHAN_PORTFOLIO')).holdings;
say(`[INFO] fallbackWithoutDependencies: identityStatus ${tally(h4.map((h) => h.identityStatus))}; securityIdentity ${JSON.stringify(identityCounts(h4))}`);
check('without the identity dependencies all 64 are still RESOLVED and none has a security identity',
  h4.every((h) => h.identityStatus === 'RESOLVED') && identityCounts(h4).object === 0);

// 4e. The read never turns a stored identity into null: a damaged stored value refuses the read.
const c5 = freshStore();
persistBrokerImport(c5.store, OWNER, requestOf(), undefined, brokerImportConsumerOptions(dependencies));
c5.db.exec(`UPDATE portfolio_holdings SET security_identity = '{"securityId":"damaged"}' WHERE security_identity IS NOT NULL`);
let readError = 'none';
try { c5.store.get(OWNER, 'DHAN_PORTFOLIO'); } catch (error) { readError = error?.name ?? 'Error'; }
say(`[INFO] damagedStoredIdentity: read error ${readError}`);
check('a stored identity that does not conform makes the read fail; it is not projected as null', readError !== 'none');

say();
say(`checks: ${out.filter((l) => l.startsWith('[PASS]')).length} pass, ${failed} fail`);
say(`RESULT: ${failed === 0 ? 'PROBE_CONSISTENT' : 'PROBE_FAILED'}`);
process.stdout.write(`${out.join('\n')}\n`);
process.exit(failed === 0 ? 0 : 1);
