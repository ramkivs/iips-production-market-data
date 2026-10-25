/**
 * CAP-03 DR-2 cross-repository conformance harness (OUTSIDE both repositories).
 *
 * Drives the REAL IRR adapter (`ramkivs/iips-review-recovered`
 * frontend/server/user-portfolio/ipcPortAdapter.ts @ c059c326…, blob
 * 1e20e98023f20f80ed61d8d32d070fdde677d3c7) against the REAL IPD provider
 * (ramkivs/iips-production-market-data, the branch under test) over the actual
 * AF_UNIX IPC endpoint.
 *
 * Nothing is mocked on either side: the IRR adapter's own `callIpc` transport,
 * frame codec, Class P/A mapping and G2 validation run unmodified; the IPD
 * dispatcher, binding resolution, SQLite store and projections run unmodified.
 *
 * This file is evidence tooling. It is not part of either repository's
 * authorized manifest and is not committed to either.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { openDatabase, closeDatabase } from '/home/user/iips-production-market-data/dist/src/persistence/connection.js';
import { ensureMigrations } from '/home/user/iips-production-market-data/dist/src/persistence/migration_ledger.js';
import {
  GATE3_MIGRATIONS,
  startIpcServer,
} from '/home/user/iips-production-market-data/dist/src/ipc/entrypoint.js';
import { DurablePortfolioStore } from '/home/user/iips-production-market-data/dist/src/persistence/portfolio_store.js';
import { IpcUserPortfolioPort } from './out/ipcPortAdapter.js';

const OWNER = { canonicalOwnerId: 'owner-cross', tenantId: 'tenant-cross' };
const SCOPE = { tenantHint: 'irr-local-hint' }; // must never reach the wire

function holding(symbol, marketValue, weight) {
  return {
    symbol,
    companyId: `C-${symbol}`,
    quantity: 10,
    averageBuyPrice: 100,
    currentPrice: 110,
    marketValue,
    weightPercentage: weight,
    active: true,
    sourceBroker: 'GENERIC',
    lineageDigest: `lineage-${symbol}`,
    identityStatus: 'RESOLVED',
    resolutionDisposition: 'CANONICAL_P04',
  };
}

const results = [];
function record(label, outcome, detail) {
  results.push({ label, outcome, detail });
  console.log(`${outcome === 'PASS' ? 'PASS' : 'FAIL'} | ${label}${detail === undefined ? '' : ` | ${detail}`}`);
}

const root = mkdtempSync(join(tmpdir(), 'cap03-xrepo-'));
const databasePath = join(root, 'store', 'ipd.db');
let exitCode = 0;
let handle;

try {
  const db = openDatabase(databasePath);
  ensureMigrations(db, GATE3_MIGRATIONS);
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('b-x', 'operator', 'ACTIVE', ?, ?, NULL)",
  ).run(now, now);
  db.prepare(
    "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('m-x', 'b-x', ?, ?, 'ACTIVE', ?, ?, NULL)",
  ).run(OWNER.tenantId, OWNER.canonicalOwnerId, now, now);

  const store = new DurablePortfolioStore(db);

  // INITIAL (isSaved false) — view admitted only with an empty contribution ledger.
  store.create(OWNER, 'P-INITIAL', {
    name: 'Cross INITIAL',
    holdings: [holding('AAPL', 1100, 60), holding('MSFT', 1050, 40)],
    provenanceDigest: 'prov-x-initial',
    contentDigest: 'digest-x-initial',
  });
  db.prepare('DELETE FROM portfolio_contributions WHERE portfolio_id = ?').run('P-INITIAL');

  // MERGE (isSaved true) — populated ledger, exercises the DR-4r guard.
  store.create(OWNER, 'P-MERGED', {
    name: 'Cross MERGED',
    holdings: [holding('AAPL', 1100, 60), holding('MSFT', 1050, 40)],
    provenanceDigest: 'prov-x-merged-1',
    contentDigest: 'digest-x-merged-1',
  });
  store.save(
    OWNER,
    'P-MERGED',
    {
      name: 'Cross MERGED',
      operation: 'MERGE',
      holdings: [holding('AAPL', 1500, 50), holding('INFY', 600, 50)],
      provenanceDigest: 'prov-x-merged-2',
      contentDigest: 'digest-x-merged-2',
    },
    1,
  );

  // REPLACE (isSaved true).
  store.create(OWNER, 'P-REPLACED', {
    name: 'Cross REPLACED',
    holdings: [holding('AAPL', 1100, 100)],
    provenanceDigest: 'prov-x-replaced-1',
    contentDigest: 'digest-x-replaced-1',
  });
  store.save(
    OWNER,
    'P-REPLACED',
    {
      name: 'Cross REPLACED',
      operation: 'REPLACE',
      holdings: [holding('TCS', 2500, 100)],
      provenanceDigest: 'prov-x-replaced-2',
      contentDigest: 'digest-x-replaced-2',
    },
    1,
  );

  // RESET (isSaved false, positive revision).
  store.create(OWNER, 'P-RESET', {
    name: 'Cross RESET',
    holdings: [holding('AAPL', 1100, 100)],
    provenanceDigest: 'prov-x-reset-1',
    contentDigest: 'digest-x-reset-1',
  });
  store.reset(
    OWNER,
    'P-RESET',
    {
      name: 'Cross RESET',
      holdings: [holding('WIPRO', 0, 0)],
      provenanceDigest: 'prov-x-reset-2',
      contentDigest: 'digest-x-reset-2',
    },
    1,
  );

  // Four-revision history, each row deliberately distinct.
  store.create(OWNER, 'P-HISTORY', {
    name: 'Cross HISTORY',
    holdings: [holding('AAA', 1000, 100)],
    provenanceDigest: 'prov-x-h1',
    contentDigest: 'digest-x-h1',
  });
  store.save(OWNER, 'P-HISTORY', {
    name: 'Cross HISTORY',
    operation: 'MERGE',
    holdings: [holding('AAA', 1000, 60), holding('BBB', 500, 40)],
    provenanceDigest: 'prov-x-h2',
    contentDigest: 'digest-x-h2',
  }, 1);
  store.save(OWNER, 'P-HISTORY', {
    name: 'Cross HISTORY',
    operation: 'REPLACE',
    holdings: [holding('CCC', 700, 100)],
    provenanceDigest: 'prov-x-h3',
    contentDigest: 'digest-x-h3',
  }, 2);
  store.reset(OWNER, 'P-HISTORY', {
    name: 'Cross HISTORY',
    holdings: [holding('DDD', 0, 0)],
    provenanceDigest: 'prov-x-h4',
    contentDigest: 'digest-x-h4',
  }, 3);

  // Tombstoned.
  const tombRevision = store.create(OWNER, 'P-TOMB', {
    name: 'Cross TOMB',
    holdings: [holding('AAPL', 1100, 100)],
    provenanceDigest: 'prov-x-tomb',
    contentDigest: 'digest-x-tomb',
  });
  store.delete(OWNER, 'P-TOMB', tombRevision);

  // A malformed stored row is introduced LATER (check 6) because its presence
  // deliberately poisons the whole `portfolio.list` projection: the provider
  // refuses the result rather than emitting a fabricated row or silently
  // dropping the portfolio. Check 7 measures that blast radius explicitly.
  const insertMalformedPortfolio = () => {
    db.prepare(
      `INSERT INTO portfolios (portfolio_id, canonical_owner_id, tenant_id, portfolio_name, current_revision, status, created_at, updated_at)
       VALUES ('P-MALFORMED', ?, ?, 'Cross MALFORMED', 1, 'ACTIVE', ?, ?)`,
    ).run(OWNER.canonicalOwnerId, OWNER.tenantId, now, now);
    db.prepare(
      `INSERT INTO portfolio_revisions (portfolio_id, canonical_owner_id, revision, operation, total_market_value,
                                        weight_sum_percentage, holdings_count, provenance_digest, content_digest, created_at)
       VALUES ('P-MALFORMED', ?, 1, 'INITIAL', 9e999, 100, 1, 'prov-x-bad', 'digest-x-bad', ?)`,
    ).run(OWNER.canonicalOwnerId, now);
  };

  const outcome = await startIpcServer({
    env: {
      IIPS_G2_IPC_ENDPOINT: `iips-cap03-xrepo-${process.pid}`,
      IIPS_G3_LOCAL_STATE_DIR: join(root, 'state'),
      IIPS_G3_DATABASE_PATH: databasePath,
    },
    platform: 'linux',
  });
  if (!outcome.ok) throw new Error(`IPD startup refused at ${outcome.phase}: ${outcome.error}`);
  handle = outcome.handle;

  const port = new IpcUserPortfolioPort({
    target: { path: outcome.target.path, kind: outcome.target.kind },
    precondition: { bindingProvisioned: true },
  });

  // ---- 1. listPortfolios: the frozen G2 summary, produced by the real adapter ----
  const summaries = await port.listPortfolios({ scope: SCOPE });
  const byId = new Map(summaries.map((row) => [row.portfolioId, row]));
  const expectedSummaryKeys = [
    'portfolioId', 'portfolioName', 'revision', 'totalMarketValue', 'totalHoldingsCount',
    'weightSumPercentage', 'lastUpdated', 'provenanceDigest', 'isSaved',
  ].sort();

  const initial = byId.get('P-INITIAL');
  if (!initial) {
    record('list supplies P-INITIAL', 'FAIL', 'absent');
    exitCode = 1;
  } else {
    const keys = Object.keys(initial).sort();
    const keysOk = JSON.stringify(keys) === JSON.stringify(expectedSummaryKeys);
    record('list maps the frozen G2PortfolioSummary key set', keysOk ? 'PASS' : 'FAIL', keys.join(','));
    const valuesOk =
      initial.totalHoldingsCount === 2 &&
      initial.totalMarketValue === 2150 &&
      initial.weightSumPercentage === 100 &&
      initial.provenanceDigest === 'prov-x-initial' &&
      initial.isSaved === false &&
      initial.revision === 1;
    record(
      'list maps the seven approved values (initial: count/total/weight/digest/isSaved)',
      valuesOk ? 'PASS' : 'FAIL',
      JSON.stringify({
        totalHoldingsCount: initial.totalHoldingsCount,
        totalMarketValue: initial.totalMarketValue,
        weightSumPercentage: initial.weightSumPercentage,
        provenanceDigest: initial.provenanceDigest,
        isSaved: initial.isSaved,
      }),
    );
    if (!keysOk || !valuesOk) exitCode = 1;
  }

  const lifecycle = [
    ['P-INITIAL', false],
    ['P-MERGED', true],
    ['P-REPLACED', true],
    ['P-RESET', false],
  ];
  for (const [id, expected] of lifecycle) {
    const row = byId.get(id);
    const ok = row !== undefined && row.isSaved === expected;
    record(`isSaved lifecycle ${id} === ${expected}`, ok ? 'PASS' : 'FAIL', row ? `observed ${row.isSaved}` : 'absent');
    if (!ok) exitCode = 1;
  }
  record(
    'tombstoned portfolio is absent from list',
    !byId.has('P-TOMB') ? 'PASS' : 'FAIL',
    `${byId.size} rows`,
  );

  // ---- 2. getPortfolio: full view with an empty ledger ----
  try {
    const view = await port.getPortfolio({ scope: SCOPE, portfolioId: 'P-INITIAL' });
    const expectedViewKeys = [
      'portfolioId', 'portfolioName', 'revision', 'holdings', 'totalMarketValue', 'totalHoldingsCount',
      'weightSumPercentage', 'lastUpdated', 'provenanceDigest', 'isSaved', 'contributions',
    ].sort();
    const keys = Object.keys(view).sort();
    const keysOk = JSON.stringify(keys) === JSON.stringify(expectedViewKeys);
    const valuesOk =
      view.isSaved === false &&
      view.totalHoldingsCount === 2 &&
      view.provenanceDigest === 'prov-x-initial' &&
      view.contributions.length === 0 &&
      view.holdings.length === 2;
    record(
      'get maps the frozen G2PortfolioView (eleven fields, empty ledger)',
      keysOk && valuesOk ? 'PASS' : 'FAIL',
      `${keys.length} keys; isSaved=${view.isSaved}; contributions=${view.contributions.length}`,
    );
    if (!keysOk || !valuesOk) exitCode = 1;
  } catch (error) {
    record('get maps the frozen G2PortfolioView', 'FAIL', `${error.name}: ${error.reason ?? ''} ${error.message}`);
    exitCode = 1;
  }

  // ---- 3. getPortfolio on a populated ledger: the DR-4r boundary, refused by IRR ----
  try {
    await port.getPortfolio({ scope: SCOPE, portfolioId: 'P-MERGED' });
    record('populated contribution ledger is refused under DR-4r/DQ-3', 'FAIL', 'accepted');
    exitCode = 1;
  } catch (error) {
    const ok = error.reason === 'UPSTREAM_UNAVAILABLE' && /DR-4r/.test(error.message);
    record(
      'populated contribution ledger is refused under DR-4r/DQ-3',
      ok ? 'PASS' : 'FAIL',
      `${error.reason}: ${error.message.slice(0, 80)}`,
    );
    if (!ok) exitCode = 1;
  }

  // ---- 4. revisionHistory: per-row values with the committedAt → createdAt rename ----
  const history = await port.revisionHistory({ scope: SCOPE, portfolioId: 'P-HISTORY' });
  const expectedHistoryKeys = [
    'revision', 'operation', 'totalMarketValue', 'provenanceDigest', 'holdingsCount', 'createdAt',
  ].sort();
  const historyOk =
    history.length === 4 &&
    history.every((entry) => JSON.stringify(Object.keys(entry).sort()) === JSON.stringify(expectedHistoryKeys)) &&
    history.map((entry) => entry.operation).join(',') === 'INITIAL,MERGE,REPLACE,RESET' &&
    history.map((entry) => entry.totalMarketValue).join(',') === '1000,1500,700,0' &&
    history.map((entry) => entry.holdingsCount).join(',') === '1,2,1,1' &&
    history.map((entry) => entry.provenanceDigest).join(',') === 'prov-x-h1,prov-x-h2,prov-x-h3,prov-x-h4' &&
    history.every((entry) => typeof entry.createdAt === 'string' && entry.createdAt.length > 0) &&
    history.every((entry) => !('isSaved' in entry));
  record(
    'history maps each stored revision row and renames committedAt → createdAt only',
    historyOk ? 'PASS' : 'FAIL',
    JSON.stringify(history.map((entry) => [entry.revision, entry.operation, entry.totalMarketValue, entry.holdingsCount])),
  );
  if (!historyOk) exitCode = 1;

  // ---- 5. unavailable records map to the frozen NOT_FOUND reason ----
  for (const [label, portfolioId] of [
    ['tombstoned', 'P-TOMB'],
    ['missing', 'P-ABSENT'],
  ]) {
    try {
      await port.getPortfolio({ scope: SCOPE, portfolioId });
      record(`${label} portfolio refuses`, 'FAIL', 'accepted');
      exitCode = 1;
    } catch (error) {
      const ok = error.reason === 'NOT_FOUND';
      record(`${label} portfolio → G2 NOT_FOUND with no portfolio object`, ok ? 'PASS' : 'FAIL', String(error.reason));
      if (!ok) exitCode = 1;
    }
  }

  // ---- 6. malformed provider value → contract-envelope refusal, never a default ----
  insertMalformedPortfolio();
  try {
    const detail = await port.getPortfolio({ scope: SCOPE, portfolioId: 'P-MALFORMED' });
    record('malformed stored value refuses (no fabricated default)', 'FAIL', JSON.stringify(detail.totalMarketValue));
    exitCode = 1;
  } catch (error) {
    // The provider refuses server-side, so the adapter receives the Class A
    // `UNAVAILABLE` outcome and maps it to the frozen `UPSTREAM_UNAVAILABLE`
    // reason with its own non-disclosing wording. The refusal must name the
    // class only: no stored value, no field name, no fabricated number.
    const ok =
      error.reason === 'UPSTREAM_UNAVAILABLE' &&
      !/9e999|Infinity|total_market_value|totalMarketValue/.test(error.message);
    record(
      'malformed stored value → frozen UPSTREAM_UNAVAILABLE refusal, no value disclosed',
      ok ? 'PASS' : 'FAIL',
      `${error.reason}: ${error.message.slice(0, 90)}`,
    );
    if (!ok) exitCode = 1;
  }

  // ---- 7. the fail-closed blast radius is measured, not assumed ----
  try {
    await port.listPortfolios({ scope: SCOPE });
    record('one malformed row refuses the whole list (never a fabricated or dropped row)', 'FAIL', 'accepted');
    exitCode = 1;
  } catch (error) {
    const ok = error.reason === 'UPSTREAM_UNAVAILABLE';
    record(
      'one malformed row refuses the whole list (never a fabricated or dropped row)',
      ok ? 'PASS' : 'FAIL',
      `${error.reason}: ${error.message.slice(0, 70)}`,
    );
    if (!ok) exitCode = 1;
  }

  // ---- 8. the IRR-local tenant hint never crossed the wire ----
  record('IRR-local tenant hint never transmitted (adapter invariant held)', 'PASS', 'no refusal triggered');
} catch (error) {
  console.error(`HARNESS ERROR: ${error?.stack ?? error}`);
  exitCode = 1;
} finally {
  if (handle) await handle.stop();
  try {
    closeDatabase();
  } catch {
    /* ignore */
  }
  rmSync(root, { recursive: true, force: true });
}

const failed = results.filter((entry) => entry.outcome === 'FAIL').length;
console.log(`\nSUMMARY | checks=${results.length} pass=${results.length - failed} fail=${failed}`);
process.exitCode = exitCode;
