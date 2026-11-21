/**
 * Broker import — the security-identity qualification outcome is kept.
 *
 * WHAT THIS SUITE PROVES
 *   A broker import can commit a holding whose COMPANY identity is resolved
 *   (`identityStatus: RESOLVED`, `resolutionDisposition: CANONICAL_P04`) while
 *   its SECURITY identity is not (`securityIdentity: null`). That state is
 *   unchanged by this suite's subject. What changed is that the import no
 *   longer drops the reason:
 *     - the outcome returned to the caller states, by count and by typed
 *       reason, how many holdings are qualified and how many are not;
 *     - one audit-chain record per committed revision keeps, for every
 *       holding, the typed reason, the qualification detail and the ISIN,
 *       exchange and series exactly as the import row carried them;
 *     - the record commits and rolls back with the revision.
 *
 * WHAT THIS SUITE IS NOT
 *   - Not evidence about any existing portfolio. It reads and writes only
 *     temporary databases it creates itself.
 *   - Not a reproduction of the cause of the 63 unqualified holdings of
 *     `DHAN_PORTFOLIO` revision 1. The reason computed at that import was not
 *     kept by any artefact, and a result computed here is a new measurement.
 *   - Not an identity repair, and not a change of the import gate, of the
 *     stored holding row or of what `RESOLVED` means.
 *
 * FIXTURES
 *   GOVERNED: issuer facts read from the tracked P04 master and the retained
 *   P7 manifest (ISIN, exchange, listing symbol). They are source facts, not
 *   holdings of anyone. Quantities and prices are invented.
 *   SYNTHETIC: every registry built in this file with `syntheticMapping` and
 *   every hand-built resolved holding. A synthetic mapping is not an
 *   authoritative mapping and exists only to reach a code path.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { createConnection } from 'node:net';
import { GATE3_MIGRATIONS, startIpcServer } from '../src/ipc/entrypoint.js';
import { closeDatabase } from '../src/persistence/connection.js';
import { composeBrokerImportIdentityDependencies } from '../src/ipc/brokerImportComposition.js';
import { createBrokerImportConsumer } from '../src/ipc/brokerImportConsumer.js';
import { LOCAL_PERSONAL_USE_SETTING } from '../src/ipc/localPersonalUse.js';
import { readAuditEvents, verifyAuditChain } from '../src/persistence/audit.js';
import {
  BROKER_IMPORT_QUALIFICATION_AUDIT_EVENT,
  DurablePortfolioStore,
  computeRevisionContentDigest,
  type OwnerRef,
} from '../src/persistence/portfolio_store.js';
import { DurablePortfolioStorePort } from '../src/persistence/durablePortfolioStorePort.js';
import {
  BROKER_IMPORT_UNQUALIFIED_HOLDINGS_WIRE_LIMIT,
  computeBrokerImportProvenance,
  countBrokerImportQualification,
  describeBrokerImportQualificationSources,
  mapBrokerImportHoldings,
  mapBrokerImportHoldingsWithQualification,
  persistBrokerImport,
  type BrokerImportHolding,
  type BrokerImportOutcome,
  type BrokerImportQualificationHoldingRecord,
  type BrokerImportRequest,
  type BrokerImportSuccess,
  type BrokerImportWriter,
  type ResolvedBrokerImportHolding,
} from '../src/persistence/brokerImportPersistence.js';
import { DhanInstrumentRegistry, type DhanInstrumentMapping } from '../src/providers/dhan/dhan_instrument_map.js';
import { buildD114SecurityIdentity, type D114SecurityIdentity } from '../src/contracts/types.js';
import { isQualifiedSecurityIdentity, qualifyHoldingSecurityIdentity } from '../src/providers/dhan/dhan_security_identity_service.js';

const OWNER: OwnerRef = { canonicalOwnerId: 'qualification-owner', tenantId: 'qualification-tenant' };
const ON: NodeJS.ProcessEnv = { [LOCAL_PERSONAL_USE_SETTING]: '1' };
const IMPORTED_AT = '2026-11-15T09:00:00.000Z';

/** GOVERNED: in the P04 master and in the retained P7 manifest on NSE. */
const QUALIFIABLE = { symbol: 'RELIANCE', isin: 'INE002A01018', companyId: 'EQ_RELIANCE_IN', securityId: 'ISIN:INE002A01018:EQ' };
const QUALIFIABLE_2 = { symbol: 'INFY', isin: 'INE009A01021', companyId: 'EQ_INFY_IN', securityId: 'ISIN:INE009A01021:EQ' };
/** GOVERNED: in the P04 master with an ACTIVE NSE listing, absent from the retained P7 manifest. */
const UNMAPPED = { symbol: 'BAJFINANCE', isin: 'INE296A01032', companyId: 'EQ_BAJFINANCE_IN' };
const UNMAPPED_2 = { symbol: 'HAVELLS', isin: 'INE176B01034', companyId: 'EQ_HAVELLS_IN' };
/** GOVERNED: listed on NSE only in the P04 master. */
const NSE_ONLY = { symbol: 'AAKASH', isin: 'INE087Z01024' };

const governed = composeBrokerImportIdentityDependencies();

/**
 * COMPATIBILITY WITH CURRENT `main` (fixture only; no assertion is weakened).
 *
 * This suite was written against the 96-mapping P7 registry. PR #164 has since
 * published 4,680 mappings, so `BAJFINANCE`/`HAVELLS` now resolve and the rows
 * the suite needs to be UNRESOLVED would qualify. The two ISINs used as
 * "unmapped" fixtures are therefore removed from the registry for exactly the
 * tests that require an absent P7 mapping, so the fixture still means "no P7
 * mapping in force" — the condition the suite was written to exercise.
 *
 * The P04 master is unchanged; no production code, registry or manifest is
 * touched. Every assertion below is the original one.
 */
const UNMAPPED_FIXTURE_ISINS = new Set([UNMAPPED.isin, UNMAPPED_2.isin]);
const governedWithoutUnmapped = Object.freeze({
  securityMaster: governed.securityMaster,
  registry: registryOf(...governed.registry.list().filter((m) => !UNMAPPED_FIXTURE_ISINS.has(m.isin ?? ''))),
});

function holding(source: { symbol: string; isin?: string }, overrides: Partial<BrokerImportHolding> = {}): BrokerImportHolding {
  return {
    symbol: source.symbol,
    ...(source.isin === undefined ? {} : { isin: source.isin }),
    exchange: 'NSE',
    quantity: 10,
    averageBuyPrice: 100,
    currentPrice: 110,
    marketValue: 1100,
    weightPercentage: 50,
    active: true,
    sourceBroker: 'DHAN',
    lineageDigest: `lineage-${source.symbol}`,
    ...overrides,
  };
}

function request(portfolioId: string, holdings: BrokerImportHolding[], overrides: Partial<BrokerImportRequest> = {}): BrokerImportRequest {
  return {
    portfolioId,
    expectedRevision: 0,
    holdings,
    contentDigest: `sha256:${portfolioId}-content`,
    fileName: `${portfolioId}.csv`,
    sourceBroker: 'DHAN',
    importedAt: IMPORTED_AT,
    ...overrides,
  };
}

/** SYNTHETIC: a hand-built holding as it leaves the company gate. */
function resolved(source: { symbol: string; isin?: string; companyId: string }, overrides: Partial<ResolvedBrokerImportHolding> = {}): ResolvedBrokerImportHolding {
  return {
    ...holding(source),
    companyId: source.companyId,
    identityStatus: 'RESOLVED',
    resolutionDisposition: 'CANONICAL_P04',
    ...overrides,
  };
}

/** SYNTHETIC: not an authoritative mapping. It exists only to reach a code path. */
function syntheticMapping(source: { symbol: string; isin: string; companyId: string }, overrides: Partial<DhanInstrumentMapping> = {}): DhanInstrumentMapping {
  return {
    companyId: source.companyId,
    isin: source.isin,
    securityId: `ISIN:${source.isin}:EQ`,
    exchange: 'NSE',
    symbol: `SYNTHETIC ${source.symbol}`,
    exchangeSegment: 'NSE_EQ',
    dhanSecurityId: `SYNTHETIC-${source.symbol}`,
    mappingProvenance: 'DHAN_INSTRUMENT_MASTER',
    instrumentType: 'EQUITY',
    active: true,
    lastVerifiedAt: '2026-11-15T00:00:00.000Z',
    ...overrides,
  };
}

function registryOf(...mappings: DhanInstrumentMapping[]): DhanInstrumentRegistry {
  const registry = new DhanInstrumentRegistry();
  for (const mapping of mappings) registry.register(mapping);
  return registry;
}

function openStore(root: string, name: string): DatabaseSync {
  const path = join(root, name, 'ipd.db');
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  ensureMigrations(db, GATE3_MIGRATIONS);
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('b-qualification', 'qualification-operator', 'ACTIVE', ?, ?, NULL)",
  ).run(now, now);
  db.prepare(
    "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('m-qualification', 'b-qualification', ?, ?, 'ACTIVE', ?, ?, NULL)",
  ).run(OWNER.tenantId, OWNER.canonicalOwnerId, now, now);
  return db;
}

function authorizedPort(db: DatabaseSync): DurablePortfolioStorePort {
  return new DurablePortfolioStorePort(db, { scope: 'BROKER_OBSERVED_IMPORT', env: ON });
}

function success(outcome: BrokerImportOutcome): BrokerImportSuccess {
  assert.equal(outcome.ok, true, JSON.stringify(outcome));
  return outcome as BrokerImportSuccess;
}

function count(db: DatabaseSync, table: string): number {
  return Number((db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number | bigint }).n);
}

function storedHoldings(db: DatabaseSync, portfolioId: string, revision: number) {
  return db
    .prepare(
      `SELECT symbol, company_id, identity_status, resolution_disposition, security_identity, lineage_digest
         FROM portfolio_holdings
        WHERE canonical_owner_id = ? AND portfolio_id = ? AND revision = ? ORDER BY symbol`,
    )
    .all(OWNER.canonicalOwnerId, portfolioId, revision) as unknown as Array<{
    symbol: string;
    company_id: string;
    identity_status: string;
    resolution_disposition: string;
    security_identity: string | null;
    lineage_digest: string;
  }>;
}

describe('broker import: the security-identity qualification outcome is kept', () => {
  let root: string;
  let db: DatabaseSync;

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'broker-qualification-'));
    db = openStore(root, 'main');
  });

  after(() => {
    db.close();
    rmSync(root, { recursive: true, force: true });
  });

  /* ------------------------------------------------------------------ *
   * 1. Fully qualified identity
   * ------------------------------------------------------------------ */
  it('1. fully qualified: the identity is stored, counted as qualified and recorded', () => {
    const consumer = createBrokerImportConsumer(db, { ...governed, authorization: { env: ON } });
    const outcome = success(consumer(OWNER, request('P-QUALIFIED', [holding(QUALIFIABLE), holding(QUALIFIABLE_2)])));
    const summary = outcome.securityIdentityQualification;
    assert.ok(summary, 'a committed import states its qualification outcome');
    assert.equal(summary.appliesTo, 'COMMITTED_REVISION');
    assert.equal(summary.holdings, 2);
    assert.equal(summary.companyIdentityResolved, 2);
    assert.equal(summary.securityIdentityQualified, 2);
    assert.equal(summary.securityIdentityUnresolved, 0);
    assert.equal(summary.securityIdentityBrokerSuppliedUnqualified, 0);
    assert.deepEqual(summary.unresolvedByReason, {});
    assert.deepEqual(summary.unqualifiedHoldings, []);
    assert.equal(summary.durableRecord, 'RECORDED');

    const rows = storedHoldings(db, 'P-QUALIFIED', 1);
    assert.deepEqual(rows.map((r) => JSON.parse(String(r.security_identity)).securityId), [QUALIFIABLE_2.securityId, QUALIFIABLE.securityId]);
    const [record] = new DurablePortfolioStore(db).brokerImportQualificationRecords(OWNER, 'P-QUALIFIED');
    assert.ok(record);
    assert.deepEqual(record.holdings.map((h) => [h.symbol, h.securityIdentityStatus, h.reason, h.securityId]), [
      [QUALIFIABLE_2.symbol, 'QUALIFIED', null, QUALIFIABLE_2.securityId],
      [QUALIFIABLE.symbol, 'QUALIFIED', null, QUALIFIABLE.securityId],
    ]);
  });

  /* ------------------------------------------------------------------ *
   * 2 + 3. Company resolved, security unresolved; missing P7 mapping
   * ------------------------------------------------------------------ */
  it('2/3. company resolved but security unresolved: stored as before, and the MISSING_P7_MAPPING reason is returned and recorded', () => {
    const consumer = createBrokerImportConsumer(db, { ...governedWithoutUnmapped, authorization: { env: ON } });
    const outcome = success(consumer(OWNER, request('P-MIXED', [holding(QUALIFIABLE), holding(UNMAPPED), holding(UNMAPPED_2)])));

    // The stored row is exactly the state the import produced before this change.
    const rows = storedHoldings(db, 'P-MIXED', 1);
    assert.deepEqual(
      rows.map((r) => [r.symbol, r.identity_status, r.resolution_disposition, r.security_identity === null]),
      [
        [UNMAPPED.symbol, 'RESOLVED', 'CANONICAL_P04', true],
        [UNMAPPED_2.symbol, 'RESOLVED', 'CANONICAL_P04', true],
        [QUALIFIABLE.symbol, 'RESOLVED', 'CANONICAL_P04', false],
      ],
    );
    assert.deepEqual(rows.map((r) => r.company_id), [UNMAPPED.companyId, UNMAPPED_2.companyId, QUALIFIABLE.companyId]);

    // The outcome now separates the two identity levels and names the reason.
    const summary = outcome.securityIdentityQualification!;
    assert.equal(summary.companyIdentityResolved, 3);
    assert.equal(summary.securityIdentityQualified, 1);
    assert.equal(summary.securityIdentityUnresolved, 2);
    assert.deepEqual(summary.unresolvedByReason, { MISSING_P7_MAPPING: 2 });
    assert.deepEqual(summary.unqualifiedHoldings, [
      { symbol: UNMAPPED.symbol, securityIdentityStatus: 'UNRESOLVED', reason: 'MISSING_P7_MAPPING' },
      { symbol: UNMAPPED_2.symbol, securityIdentityStatus: 'UNRESOLVED', reason: 'MISSING_P7_MAPPING' },
    ]);
    assert.equal(summary.unqualifiedHoldingsTruncated, false);
    assert.equal(summary.durableRecord, 'RECORDED');

    // The record keeps the reason, the service's detail and the row's own identifiers.
    const [record] = new DurablePortfolioStore(db).brokerImportQualificationRecords(OWNER, 'P-MIXED');
    assert.ok(record);
    assert.equal(record.revision, 1);
    const unresolved = record.holdings.find((h) => h.symbol === UNMAPPED.symbol)!;
    assert.equal(unresolved.securityIdentityStatus, 'UNRESOLVED');
    assert.equal(unresolved.qualificationAttempted, true);
    assert.equal(unresolved.reason, 'MISSING_P7_MAPPING');
    assert.match(String(unresolved.details), /P7/);
    assert.equal(unresolved.securityId, null);
    assert.equal(unresolved.companyId, UNMAPPED.companyId);
    assert.equal(unresolved.observedIsin, UNMAPPED.isin);
    assert.equal(unresolved.observedExchange, 'NSE');
    assert.equal(unresolved.observedSeries, null);
  });

  it('3. an empty registry leaves every holding unresolved with MISSING_P7_MAPPING, and says so', () => {
    const { qualification } = mapBrokerImportHoldingsWithQualification([resolved(QUALIFIABLE), resolved(UNMAPPED)], {
      securityMaster: governed.securityMaster,
      registry: new DhanInstrumentRegistry(),
    });
    assert.deepEqual(qualification.map((q) => [q.securityIdentityStatus, q.reason]), [
      ['UNRESOLVED', 'MISSING_P7_MAPPING'],
      ['UNRESOLVED', 'MISSING_P7_MAPPING'],
    ]);
  });

  /* ------------------------------------------------------------------ *
   * 4. Unsupported exchange or series
   * ------------------------------------------------------------------ */
  it('4. unsupported exchange: a listing P04 does not hold is refused by the company gate with no store effect and no record', () => {
    const before = { revisions: count(db, 'portfolio_revisions'), audit: count(db, 'audit_events') };
    const consumer = createBrokerImportConsumer(db, { ...governed, authorization: { env: ON } });
    const outcome = consumer(OWNER, request('P-UNSUPPORTED-EXCHANGE', [holding(NSE_ONLY, { exchange: 'BSE' })]));
    assert.equal(outcome.ok, false);
    assert.equal(outcome.ok === false && outcome.code, 'REFUSED_UNRESOLVED_IDENTITY');
    assert.deepEqual({ revisions: count(db, 'portfolio_revisions'), audit: count(db, 'audit_events') }, before);
  });

  it('4. SYNTHETIC: an exchange value outside NSE/BSE that reaches the mapping is reported as INACTIVE_OR_MISSING_LISTING with the value the row carried', () => {
    const row = resolved(QUALIFIABLE, { exchange: 'MCX' as unknown as 'NSE' });
    const { holdings, qualification } = mapBrokerImportHoldingsWithQualification([row], governed);
    assert.equal(holdings[0]!.securityIdentity, null);
    assert.equal(qualification[0]!.reason, 'INACTIVE_OR_MISSING_LISTING');
    assert.equal(qualification[0]!.observedExchange, 'MCX');
  });

  it('4. SYNTHETIC: a mapping without series evidence, an inactive instrument and a mapping without verification time each keep their own reason', () => {
    const cases: Array<[string, DhanInstrumentMapping, string]> = [
      ['no series', (() => { const { securityId: _dropped, ...rest } = syntheticMapping(UNMAPPED); return rest; })(), 'MISSING_SERIES_EVIDENCE'],
      ['inactive', syntheticMapping(UNMAPPED, { active: false }), 'INACTIVE_OR_MISSING_LISTING'],
      ['unverified', (() => { const { lastVerifiedAt: _dropped, ...rest } = syntheticMapping(UNMAPPED); return rest; })(), 'STALE_SOURCE_EVIDENCE'],
    ];
    for (const [label, mapping, expected] of cases) {
      const { holdings, qualification } = mapBrokerImportHoldingsWithQualification([resolved(UNMAPPED)], {
        securityMaster: governed.securityMaster,
        registry: registryOf(mapping),
      });
      assert.equal(holdings[0]!.securityIdentity, null, label);
      assert.equal(qualification[0]!.reason, expected, label);
      assert.ok(String(qualification[0]!.details).length > 0, label);
    }
  });

  /* ------------------------------------------------------------------ *
   * 5. Invalid or malformed ISIN
   * ------------------------------------------------------------------ */
  it('5. malformed ISIN: the company gate refuses the import; nothing is stored or recorded', () => {
    const before = { revisions: count(db, 'portfolio_revisions'), audit: count(db, 'audit_events') };
    const consumer = createBrokerImportConsumer(db, { ...governed, authorization: { env: ON } });
    for (const isin of ['INE002A0101', 'INE002A01018X', 'NOT-AN-ISIN!!']) {
      const outcome = consumer(OWNER, request('P-MALFORMED', [holding({ symbol: QUALIFIABLE.symbol, isin })]));
      assert.equal(outcome.ok === false && outcome.code, 'REFUSED_UNRESOLVED_IDENTITY', isin);
    }
    assert.deepEqual({ revisions: count(db, 'portfolio_revisions'), audit: count(db, 'audit_events') }, before);
  });

  it('5. SYNTHETIC: a malformed or unknown ISIN that reaches the mapping keeps its typed reason and its original text', () => {
    const { qualification } = mapBrokerImportHoldingsWithQualification(
      [
        resolved({ symbol: 'A-SHORT', isin: 'INE002A0101', companyId: QUALIFIABLE.companyId }),
        resolved({ symbol: 'B-UNKNOWN', isin: 'INE999X01011', companyId: QUALIFIABLE.companyId }),
        resolved({ symbol: 'C-BLANK', isin: '   ', companyId: QUALIFIABLE.companyId }),
      ],
      governed,
    );
    assert.deepEqual(qualification.map((q) => [q.symbol, q.reason, q.observedIsin]), [
      ['A-SHORT', 'INVALID_ISIN_SYNTAX', 'INE002A0101'],
      ['B-UNKNOWN', 'MISSING_P04_CORRESPONDENCE', 'INE999X01011'],
      ['C-BLANK', 'MISSING_ISIN', '   '],
    ]);
  });

  it('5. a row without an ISIN is unresolved with MISSING_ISIN and qualification is marked as not attempted', () => {
    const consumer = createBrokerImportConsumer(db, { ...governed, authorization: { env: ON } });
    const outcome = success(consumer(OWNER, request('P-NO-ISIN', [holding({ symbol: QUALIFIABLE.symbol })])));
    assert.deepEqual(outcome.securityIdentityQualification!.unresolvedByReason, { MISSING_ISIN: 1 });
    const [record] = new DurablePortfolioStore(db).brokerImportQualificationRecords(OWNER, 'P-NO-ISIN');
    assert.equal(record!.holdings[0]!.qualificationAttempted, false);
    assert.equal(record!.holdings[0]!.observedIsin, null);
    assert.equal(storedHoldings(db, 'P-NO-ISIN', 1)[0]!.security_identity, null);
  });

  /* ------------------------------------------------------------------ *
   * 6. ISIN and exchange normalization differences
   * ------------------------------------------------------------------ */
  it('6. normalization: case and padding of the ISIN do not change the qualified identity, and the record keeps the text as supplied', () => {
    const consumer = createBrokerImportConsumer(db, { ...governed, authorization: { env: ON } });
    const supplied = `  ${QUALIFIABLE.isin.toLowerCase()} `;
    const outcome = success(consumer(OWNER, request('P-NORMALIZED', [holding({ symbol: QUALIFIABLE.symbol, isin: supplied })])));
    assert.equal(outcome.securityIdentityQualification!.securityIdentityQualified, 1);
    assert.equal(JSON.parse(String(storedHoldings(db, 'P-NORMALIZED', 1)[0]!.security_identity)).securityId, QUALIFIABLE.securityId);
    const [record] = new DurablePortfolioStore(db).brokerImportQualificationRecords(OWNER, 'P-NORMALIZED');
    assert.equal(record!.holdings[0]!.observedIsin, supplied, 'the observed ISIN is the row text, not the normalized form');
    assert.equal(record!.holdings[0]!.securityId, QUALIFIABLE.securityId);
  });

  it('6. the exchange is never defaulted: the same ISIN qualifies per exchange to that exchange\'s own series', () => {
    const { qualification } = mapBrokerImportHoldingsWithQualification(
      [resolved(QUALIFIABLE), resolved({ ...QUALIFIABLE, symbol: 'RELIANCE-BSE' }, { exchange: 'BSE' })],
      governed,
    );
    assert.deepEqual(qualification.map((q) => [q.observedExchange, q.securityId]), [
      ['NSE', 'ISIN:INE002A01018:EQ'],
      ['BSE', 'ISIN:INE002A01018:A'],
    ]);
  });

  /* ------------------------------------------------------------------ *
   * 7. Multiple candidate mappings
   * ------------------------------------------------------------------ */
  it('7. SYNTHETIC: two candidate series for one ISIN and exchange are never chosen between; the reason is AMBIGUOUS_PROVIDER_MAPPING', () => {
    const registry = registryOf(
      syntheticMapping(UNMAPPED, { securityId: `ISIN:${UNMAPPED.isin}:EQ`, dhanSecurityId: 'SYNTHETIC-EQ' }),
      syntheticMapping(UNMAPPED, { securityId: `ISIN:${UNMAPPED.isin}:BE`, dhanSecurityId: 'SYNTHETIC-BE' }),
    );
    const { holdings, qualification } = mapBrokerImportHoldingsWithQualification([resolved(UNMAPPED)], {
      securityMaster: governed.securityMaster,
      registry,
    });
    assert.equal(holdings[0]!.securityIdentity, null, 'no series is picked');
    assert.equal(qualification[0]!.reason, 'AMBIGUOUS_PROVIDER_MAPPING');
    assert.equal(qualification[0]!.securityId, null);
  });

  /* ------------------------------------------------------------------ *
   * 8. Retry after a mapping correction
   * ------------------------------------------------------------------ */
  it('8. SYNTHETIC: after a mapping correction the same row qualifies, but re-importing the same file is a no-op and the stored identity stays null', () => {
    const local = openStore(root, 'retry');
    try {
      const rows = [holding(UNMAPPED)];
      const first = success(persistBrokerImport(authorizedPort(local), OWNER, request('P-RETRY', rows), undefined, governedWithoutUnmapped));
      assert.deepEqual(first.securityIdentityQualification!.unresolvedByReason, { MISSING_P7_MAPPING: 1 });

      // SYNTHETIC correction: the retained registry plus one invented mapping.
      const corrected = registryOf(...governedWithoutUnmapped.registry.list(), syntheticMapping(UNMAPPED));
      const correctedOptions = { securityMaster: governedWithoutUnmapped.securityMaster, registry: corrected };

      // The qualification itself now succeeds for the unchanged row.
      const remapped = mapBrokerImportHoldingsWithQualification([resolved(UNMAPPED)], correctedOptions);
      assert.equal(remapped.qualification[0]!.securityIdentityStatus, 'QUALIFIED');

      // The import path offers no retry: the file is already a committed
      // contribution, so nothing is written. The outcome says what the
      // submitted rows would qualify to and that no revision was written.
      const again = success(
        persistBrokerImport(authorizedPort(local), OWNER, request('P-RETRY', rows, { expectedRevision: 1 }), undefined, correctedOptions),
      );
      assert.equal(again.disposition, 'ALREADY_IMPORTED_NO_OP');
      assert.equal(again.securityIdentityQualification!.appliesTo, 'SUBMITTED_ROWS_NO_REVISION_WRITTEN');
      assert.equal(again.securityIdentityQualification!.durableRecord, 'NOT_RECORDED_NO_REVISION');
      assert.equal(again.securityIdentityQualification!.securityIdentityQualified, 1);
      assert.equal(storedHoldings(local, 'P-RETRY', 1)[0]!.security_identity, null, 'the stored identity is untouched');
      assert.equal(count(local, 'portfolio_revisions'), 1);
      const records = new DurablePortfolioStore(local).brokerImportQualificationRecords(OWNER, 'P-RETRY');
      assert.equal(records.length, 1, 'a no-op writes no second record');
      assert.equal(records[0]!.holdings[0]!.reason, 'MISSING_P7_MAPPING', 'the first record still states the reason at import');
      // The two source states are distinguishable from the records alone.
      assert.notEqual(again.securityIdentityQualification!.sources.registryDigest, first.securityIdentityQualification!.sources.registryDigest);
    } finally {
      local.close();
    }
  });

  /* ------------------------------------------------------------------ *
   * 9. Preservation of original broker evidence
   * ------------------------------------------------------------------ */
  it('9. original broker evidence: digests, lineage and the row identifiers are kept verbatim and nothing is derived', () => {
    const consumer = createBrokerImportConsumer(db, { ...governedWithoutUnmapped, authorization: { env: ON } });
    const rows = [holding(UNMAPPED, { lineageDigest: 'lineage-row-a', series: 'EQ' }), holding(QUALIFIABLE, { lineageDigest: 'lineage-row-b' })];
    const req = request('P-EVIDENCE', rows);
    success(consumer(OWNER, req));
    const [record] = new DurablePortfolioStore(db).brokerImportQualificationRecords(OWNER, 'P-EVIDENCE');
    assert.ok(record);
    assert.equal(record.contentDigest, req.contentDigest);
    assert.equal(record.provenanceDigest, computeBrokerImportProvenance(req));
    assert.equal(record.importedAt, IMPORTED_AT);
    const unresolved = record.holdings.find((h) => h.symbol === UNMAPPED.symbol)!;
    assert.equal(unresolved.lineageDigest, 'lineage-row-a');
    assert.equal(unresolved.observedIsin, UNMAPPED.isin);
    assert.equal(unresolved.observedExchange, 'NSE');
    // The row's own series is kept as evidence and is NOT used to build an
    // identity on the qualified path: the holding stays unresolved.
    assert.equal(unresolved.observedSeries, 'EQ');
    assert.equal(unresolved.securityId, null);
    assert.equal(storedHoldings(db, 'P-EVIDENCE', 1).find((r) => r.symbol === UNMAPPED.symbol)!.security_identity, null);
    // The sources in force are part of the record.
    assert.deepEqual(record.sources, describeBrokerImportQualificationSources(governedWithoutUnmapped));
    assert.equal(record.sources.registryMappingCount, governedWithoutUnmapped.registry.list().length);
    assert.match(String(record.sources.registryDigest), /^[a-f0-9]{64}$/);
    assert.match(String(record.sources.securityMasterChecksumSha256), /^[a-f0-9]{64}$/);
  });

  /* ------------------------------------------------------------------ *
   * 10. Persistence and read-back consistency
   * ------------------------------------------------------------------ */
  it('10. read-back: the record agrees with the stored holdings, the stored rows are what the unchanged mapping produces, and the audit chain verifies', () => {
    const store = new DurablePortfolioStore(db);
    for (const summary of store.list(OWNER)) {
      const detail = store.get(OWNER, summary.portfolioId);
      const records = store.brokerImportQualificationRecords(OWNER, summary.portfolioId);
      const record = records.find((r) => r.revision === detail.revision);
      assert.ok(record, `${summary.portfolioId} has a record for its current revision`);
      assert.equal(record.holdings.length, detail.holdings.length);
      for (const stored of detail.holdings) {
        const kept: BrokerImportQualificationHoldingRecord = record.holdings.find((h) => h.symbol === stored.symbol)!;
        assert.equal(kept.securityId, stored.securityIdentity?.securityId ?? null, `${summary.portfolioId}/${stored.symbol}`);
        assert.equal(kept.securityIdentityStatus === 'UNRESOLVED', (stored.securityIdentity ?? null) === null);
        assert.equal(kept.companyId, stored.companyId);
        if (kept.securityIdentityStatus === 'UNRESOLVED') assert.ok(kept.reason, 'an unresolved holding always has a reason');
      }
      assert.equal(record.counts.securityIdentityUnresolved, detail.holdings.filter((h) => (h.securityIdentity ?? null) === null).length);
      assert.deepEqual(record.counts, countBrokerImportQualification(record.holdings));
    }
    assert.equal(verifyAuditChain(db), true);

    // The holdings the store received are byte-for-byte those of the
    // pre-existing mapping function: the stored content digest is unchanged.
    const req = request('P-MIXED', [holding(QUALIFIABLE), holding(UNMAPPED), holding(UNMAPPED_2)]);
    // Same identity sources the import used (see `governedWithoutUnmapped`), so
    // this remains a true recomputation of what the unchanged mapper produced.
    const mapped = mapBrokerImportHoldings(
      req.holdings.map((h) => resolved({ symbol: h.symbol, isin: h.isin!, companyId: [QUALIFIABLE, UNMAPPED, UNMAPPED_2].find((s) => s.symbol === h.symbol)!.companyId })),
      governedWithoutUnmapped,
    );
    const storedDigest = (db
      .prepare('SELECT content_digest FROM portfolio_revisions WHERE canonical_owner_id = ? AND portfolio_id = ? AND revision = 1')
      .get(OWNER.canonicalOwnerId, 'P-MIXED') as { content_digest: string }).content_digest;
    assert.equal(storedDigest, computeRevisionContentDigest(mapped, computeBrokerImportProvenance(req)));
  });

  it('10. one record per committed revision, and a record of another owner is not returned', () => {
    const events = readAuditEvents(db).filter((e) => e.eventType === BROKER_IMPORT_QUALIFICATION_AUDIT_EVENT);
    assert.equal(events.length, count(db, 'portfolio_revisions'));
    assert.deepEqual(new DurablePortfolioStore(db).brokerImportQualificationRecords({ canonicalOwnerId: 'someone-else', tenantId: OWNER.tenantId }, 'P-MIXED'), []);
  });

  /* ------------------------------------------------------------------ *
   * 11. Prevention of silent reason loss
   * ------------------------------------------------------------------ */
  it('11. SYNTHETIC 64-row shape: 1 qualified and 63 unresolved are reported with a reason for every unresolved holding', () => {
    // Labels are invented; every row reuses one governed, unmapped ISIN on a
    // hand-built resolved holding. This reproduces a SHAPE and proves nothing
    // about the cause of any real import.
    const rows = [resolved(QUALIFIABLE)];
    for (let i = 0; i < 63; i += 1) rows.push(resolved({ ...UNMAPPED, symbol: `SYNTHETIC-${String(i).padStart(2, '0')}` }));
    const { holdings, qualification } = mapBrokerImportHoldingsWithQualification(rows, governedWithoutUnmapped);
    assert.equal(holdings.filter((h) => h.securityIdentity).length, 1);
    assert.equal(holdings.filter((h) => h.securityIdentity === null).length, 63);
    assert.ok(holdings.every((h) => h.identityStatus === 'RESOLVED' && h.resolutionDisposition === 'CANONICAL_P04'));
    const counts = countBrokerImportQualification(qualification);
    assert.equal(counts.securityIdentityQualified, 1);
    assert.equal(counts.securityIdentityUnresolved, 63);
    assert.deepEqual(counts.unresolvedByReason, { MISSING_P7_MAPPING: 63 });
    assert.ok(qualification.filter((q) => q.securityIdentityStatus === 'UNRESOLVED').every((q) => q.reason !== null && q.details !== null));
  });

  it('11. if the record cannot be written the import is rolled back: no revision exists without its qualification outcome', () => {
    const local = openStore(root, 'rollback');
    try {
      const port = authorizedPort(local);
      const failing: BrokerImportWriter = {
        list: (owner) => port.list(owner),
        create: (owner, id, req) => port.create(owner, id, req),
        save: (owner, id, req, expected) => port.save(owner, id, req, expected),
        contributions: (owner, id) => port.contributions(owner, id),
        withBrokerImportTransaction: (owner, work) => port.withBrokerImportTransaction(owner, () => work(failing)),
        recordBrokerImportQualification: () => {
          throw new Error('SYNTHETIC record failure');
        },
      };
      const before = { audit: count(local, 'audit_events') };
      const outcome = persistBrokerImport(failing, OWNER, request('P-ROLLBACK', [holding(UNMAPPED)]), undefined, governed);
      assert.equal(outcome.ok, false);
      assert.equal(outcome.storeEffect, 'NONE');
      assert.equal(count(local, 'portfolio_revisions'), 0);
      assert.equal(count(local, 'portfolio_holdings'), 0);
      assert.equal(count(local, 'portfolio_contributions'), 0);
      assert.equal(count(local, 'audit_events'), before.audit);
    } finally {
      local.close();
    }
  });

  it('11. a writer with no durable record surface still returns the outcome and says the record was not kept', () => {
    const local = openStore(root, 'no-record-surface');
    try {
      const port = authorizedPort(local);
      const bare: BrokerImportWriter = {
        list: (owner) => port.list(owner),
        create: (owner, id, req) => port.create(owner, id, req),
        save: (owner, id, req, expected) => port.save(owner, id, req, expected),
        contributions: (owner, id) => port.contributions(owner, id),
        withBrokerImportTransaction: (owner, work) => port.withBrokerImportTransaction(owner, () => work(bare)),
      };
      const outcome = success(persistBrokerImport(bare, OWNER, request('P-BARE', [holding(UNMAPPED)]), undefined, governedWithoutUnmapped));
      assert.equal(outcome.securityIdentityQualification!.durableRecord, 'NOT_SUPPORTED_BY_WRITER');
      assert.deepEqual(outcome.securityIdentityQualification!.unresolvedByReason, { MISSING_P7_MAPPING: 1 });
    } finally {
      local.close();
    }
  });

  it('11. the record is refused outside the import transaction, for a revision that was not just written, and without write authorization', () => {
    const local = openStore(root, 'record-guards');
    try {
      const store = new DurablePortfolioStore(local);
      const record = {
        contentDigest: 'x', provenanceDigest: 'y', importedAt: IMPORTED_AT,
        sources: describeBrokerImportQualificationSources(governed),
        counts: countBrokerImportQualification([]),
        holdings: [],
      };
      const before = count(local, 'audit_events');
      assert.throws(() => store.recordBrokerImportQualification(OWNER, 'P-NONE', 1, record), /only inside the import transaction/);
      assert.throws(
        () => store.withBrokerImportTransaction(OWNER, (s) => s.recordBrokerImportQualification(OWNER, 'P-NONE', 1, record)),
        /does not belong to the revision/,
      );
      // No authorization context: the unchanged default-deny write gate decides.
      assert.throws(() => new DurablePortfolioStorePort(local).recordBrokerImportQualification(OWNER, 'P-NONE', 1, record));
      assert.equal(count(local, 'audit_events'), before);
    } finally {
      local.close();
    }
  });

  it('11. without composed identity sources the outcome says so instead of returning a bare null', () => {
    const { holdings, qualification } = mapBrokerImportHoldingsWithQualification([resolved(UNMAPPED), resolved(QUALIFIABLE, { series: 'EQ' })]);
    assert.deepEqual(qualification.map((q) => [q.symbol, q.securityIdentityStatus, q.qualificationAttempted, q.reason]), [
      [UNMAPPED.symbol, 'UNRESOLVED', false, 'IDENTITY_SOURCES_NOT_COMPOSED'],
      // The pre-Stage-4 fallback builds an identity from the row's own ISIN and
      // series. It is stored as before and is labelled as not qualified.
      [QUALIFIABLE.symbol, 'BROKER_SUPPLIED_UNQUALIFIED', false, null],
    ]);
    assert.equal(holdings[1]!.securityIdentity?.securityId, 'ISIN:INE002A01018:EQ');
    assert.deepEqual(describeBrokerImportQualificationSources(), {
      securityMasterBatchId: null,
      securityMasterChecksumSha256: null,
      registryMappingCount: null,
      registryDigest: null,
    });
  });

  it('11. the list returned to the caller is bounded; the counts and the record stay complete', () => {
    const local = openStore(root, 'bounded');
    try {
      const total = BROKER_IMPORT_UNQUALIFIED_HOLDINGS_WIRE_LIMIT + 3;
      // SYNTHETIC resolver: every invented label resolves to one governed company.
      const resolver = { resolve: () => ({ status: 'RESOLVED' as const, companyId: UNMAPPED.companyId, sourceRevision: 'SYNTHETIC' }) };
      const rows: BrokerImportHolding[] = [];
      for (let i = 0; i < total; i += 1) rows.push(holding({ symbol: `SYNTHETIC-${String(i).padStart(4, '0')}`, isin: UNMAPPED.isin }));
      const outcome = success(persistBrokerImport(authorizedPort(local), OWNER, request('P-BOUNDED', rows), resolver, governedWithoutUnmapped));
      const summary = outcome.securityIdentityQualification!;
      assert.equal(summary.securityIdentityUnresolved, total);
      assert.equal(summary.unqualifiedHoldings.length, BROKER_IMPORT_UNQUALIFIED_HOLDINGS_WIRE_LIMIT);
      assert.equal(summary.unqualifiedHoldingsTruncated, true);
      assert.ok(Buffer.byteLength(JSON.stringify(outcome), 'utf8') < 256 * 1024, 'the outcome fits the response frame');
      assert.equal(new DurablePortfolioStore(local).brokerImportQualificationRecords(OWNER, 'P-BOUNDED')[0]!.holdings.length, total);
    } finally {
      local.close();
    }
  });
});

/* -------------------------------------------------------------------- *
 * The shipped entrypoint, over a real socket
 * -------------------------------------------------------------------- */

function ipcCall(path: string, op: string, payload?: unknown): Promise<Record<string, any> | null> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ path });
    const chunks: Buffer[] = [];
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.on('error', reject);
    socket.on('close', () => {
      const raw = Buffer.concat(chunks);
      resolve(raw.length >= 4 ? JSON.parse(raw.subarray(4, 4 + raw.readUInt32BE()).toString()) : null);
    });
    socket.on('connect', () => {
      const body = Buffer.from(JSON.stringify({ v: 1, op, payload, requestId: 'qualification-wire' }));
      const prefix = Buffer.alloc(4);
      prefix.writeUInt32BE(body.length);
      socket.end(Buffer.concat([prefix, body]));
    });
  });
}

describe('broker import over the shipped IPC entrypoint', () => {
  it('the result frame carries the qualification outcome next to the unchanged members, and the stored state is as before', async () => {
    const root = mkdtempSync(join(tmpdir(), 'broker-qualification-ipc-'));
    const db = openStore(root, 'wire');
    const dbPath = join(root, 'wire', 'ipd.db');
    const started = await startIpcServer({
      env: {
        ...ON,
        IIPS_G2_IPC_ENDPOINT: `iips-qualification-${process.pid}`,
        IIPS_G3_LOCAL_STATE_DIR: join(root, 'state'),
        IIPS_G3_DATABASE_PATH: dbPath,
      } as NodeJS.ProcessEnv,
      // The server otherwise loads the shipped registry, in which PR #164 has
      // since mapped every ACTIVE P04 listing — there would then be no
      // unresolved holding to observe. This is the documented test seam
      // (`StartupOptions.brokerImportIdentity`), used here exactly as it is
      // intended; the server still loads the governed P04 master.
      brokerImportIdentity: { securityMaster: governed.securityMaster, registry: governedWithoutUnmapped.registry },
    });
    assert.ok(started.ok, started.error);
    try {
      const path = started.target!.path;
      const frame = await ipcCall(path, 'portfolio.importBroker', request('WIRE-PORTFOLIO', [holding(QUALIFIABLE), holding(UNMAPPED)]));
      assert.equal(frame?.ok, true, JSON.stringify(frame));
      const result = frame!.result as BrokerImportSuccess;

      // Every member a consumer of the accepted contract validates is unchanged.
      assert.equal(result.ok, true);
      assert.equal(result.disposition, 'SAVED_NEW_BATCH');
      assert.equal(result.revision, 1);
      assert.equal(result.noOp, false);
      assert.equal(result.storeEffect, 'REVISION_COMMITTED');
      assert.equal(result.holdingsPersisted, 2);
      assert.equal(result.contributions, 1);
      assert.equal(result.totalMarketValue, 2200);
      assert.equal(result.message, 'The import was committed as a new batch.');
      assert.deepEqual(
        Object.keys(result).sort(),
        ['contributions', 'disposition', 'holdingsPersisted', 'message', 'noOp', 'ok', 'revision', 'securityIdentityQualification', 'storeEffect', 'totalMarketValue'],
        'exactly one member was added',
      );

      // The added member.
      const summary = result.securityIdentityQualification!;
      assert.equal(summary.companyIdentityResolved, 2);
      assert.equal(summary.securityIdentityQualified, 1);
      assert.equal(summary.securityIdentityUnresolved, 1);
      assert.deepEqual(summary.unresolvedByReason, { MISSING_P7_MAPPING: 1 });
      assert.deepEqual(summary.unqualifiedHoldings, [{ symbol: UNMAPPED.symbol, securityIdentityStatus: 'UNRESOLVED', reason: 'MISSING_P7_MAPPING' }]);
      assert.equal(summary.durableRecord, 'RECORDED');
      assert.equal(summary.sources.registryMappingCount, governedWithoutUnmapped.registry.list().length);

      // The read contract is unchanged: the holding still reads RESOLVED with a null identity.
      const get = await ipcCall(path, 'portfolio.get', { portfolioId: 'WIRE-PORTFOLIO' });
      const read = (get!.result.holdings as Array<Record<string, unknown>>).find((h) => h.symbol === UNMAPPED.symbol)!;
      assert.equal(read.identityStatus, 'RESOLVED');
      assert.equal(read.resolutionDisposition, 'CANONICAL_P04');
      assert.equal(read.securityIdentity ?? null, null);

      // The record is in the same database, in a verifying audit chain.
      const records = new DurablePortfolioStore(db).brokerImportQualificationRecords(OWNER, 'WIRE-PORTFOLIO');
      assert.equal(records.length, 1);
      assert.equal(records[0]!.holdings.find((h) => h.symbol === UNMAPPED.symbol)!.reason, 'MISSING_P7_MAPPING');
      assert.equal(verifyAuditChain(db), true);
    } finally {
      await started.handle!.stop();
      closeDatabase();
      db.close();
      rmSync(root, { recursive: true, force: true });
    }
  });
});

/**
 * REFERENCE: the mapper with the qualification record removed — current
 * `main`'s mapper (`src/persistence/brokerImportPersistence.ts`) minus only
 * the `qualification` accumulation, copied without change of logic. It exists
 * only so the suite below can show that the holdings handed to the store are
 * the same as before this change.
 *
 * The four broker-reported daily fields (PR #177) are part of current `main`
 * and are carried verbatim; omitting them would make this a comparison against
 * a state that no longer exists.
 */
function mapBrokerImportHoldingsBeforeTheChange(
  holdings: readonly ResolvedBrokerImportHolding[],
  options: { securityMaster?: typeof governed.securityMaster; registry?: DhanInstrumentRegistry } = {},
) {
  const { securityMaster, registry } = options;
  return [...holdings]
    .sort((a, b) => (a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0))
    .map((h) => {
      let securityIdentity: D114SecurityIdentity | null = null;
      if (h.isin && h.exchange && securityMaster && registry) {
        const result = qualifyHoldingSecurityIdentity(
          { isin: h.isin, exchange: h.exchange, symbol: h.symbol },
          securityMaster,
          registry,
        );
        if (isQualifiedSecurityIdentity(result)) {
          securityIdentity = result.securityIdentity;
        }
      } else {
        securityIdentity = buildD114SecurityIdentity(h.isin, h.series) ?? null;
      }
      return {
        symbol: h.symbol,
        companyId: h.companyId,
        quantity: h.quantity,
        averageBuyPrice: h.averageBuyPrice,
        currentPrice: h.currentPrice,
        marketValue: h.marketValue,
        weightPercentage: h.weightPercentage,
        active: h.active,
        sourceBroker: h.sourceBroker,
        lineageDigest: h.lineageDigest,
        identityStatus: h.identityStatus,
        resolutionDisposition: h.resolutionDisposition,
        securityIdentity,
        // PRESENT ON CURRENT `main` (PR #177): the four broker-reported daily
        // fields pass through verbatim, `undefined` kept as `null`. The
        // reference copy predated #177 and omitted them, which made this
        // comparison disagree on every row for a reason unrelated to the
        // qualification change. They are carried here unchanged so the copy
        // remains "current main minus only the qualification record".
        dpQty: h.dpQty ?? null,
        availableQty: h.availableQty ?? null,
        profitLoss: h.profitLoss ?? null,
        pnlPercentage: h.pnlPercentage ?? null,
      };
    });
}

describe('broker import: the holdings handed to the store are those of the mapper before the change', () => {
  /** GOVERNED: every ACTIVE listing of the tracked P04 master, in reverse order so the sort is exercised. */
  function everyActiveListing(): ResolvedBrokerImportHolding[] {
    const rows: ResolvedBrokerImportHolding[] = [];
    for (const companyId of governed.securityMaster.listAllCompanyIds()) {
      const entity = governed.securityMaster.getEntity(companyId);
      if (!entity) continue;
      for (const listing of entity.listings) {
        if (listing.status !== 'ACTIVE') continue;
        rows.push(resolved(
          { symbol: `${listing.symbol}@${listing.exchange}`, isin: entity.isin, companyId },
          { exchange: listing.exchange, lineageDigest: `lineage-${companyId}-${listing.exchange}` },
        ));
      }
    }
    return rows.reverse();
  }

  it('GOVERNED: for every ACTIVE listing of the tracked master, with the tracked registry, the holdings and their order are identical', () => {
    const rows = everyActiveListing();
    assert.ok(rows.length > 4000, `expected the whole tracked master, got ${rows.length}`);
    const before = mapBrokerImportHoldingsBeforeTheChange(rows, governed);
    const after = mapBrokerImportHoldings(rows, governed);
    const withOutcome = mapBrokerImportHoldingsWithQualification(rows, governed);
    assert.deepEqual(after, before);
    assert.deepEqual(withOutcome.holdings, before);
    assert.equal(computeRevisionContentDigest(after, 'sha256:reference'), computeRevisionContentDigest(before, 'sha256:reference'));
    // The outcome is in the order of the holdings and agrees with each one.
    assert.equal(withOutcome.qualification.length, before.length);
    withOutcome.qualification.forEach((entry, index) => {
      assert.equal(entry.symbol, before[index].symbol);
      assert.equal(entry.securityId, before[index].securityIdentity?.securityId ?? null);
      assert.equal(entry.securityIdentityStatus === 'UNRESOLVED', before[index].securityIdentity === null);
      if (entry.securityIdentityStatus === 'UNRESOLVED') assert.notEqual(entry.reason, null);
    });
    // Non-vacuity: at least one row qualified, so the comparison above is not
    // a comparison of two lists of nulls.
    assert.ok(before.some((h) => h.securityIdentity !== null));
    // PR #164 mapped every ACTIVE P04 listing AFTER this suite was written, so
    // on the tracked registry there is no longer an unresolved row to show
    // here. The unresolved half of the pairing is carried by the companion
    // SYNTHETIC/edge test below, which asserts both states explicitly.
  });

  it('GOVERNED and SYNTHETIC: identical with an empty registry, without identity sources, and for rows without ISIN, exchange or with a series', () => {
    const rows = everyActiveListing().slice(0, 400);
    const edge: ResolvedBrokerImportHolding[] = [
      resolved({ symbol: 'EDGE-NO-ISIN', companyId: UNMAPPED.companyId }),
      resolved({ symbol: 'EDGE-NO-EXCHANGE', isin: UNMAPPED.isin, companyId: UNMAPPED.companyId }, { exchange: undefined }),
      resolved({ symbol: 'EDGE-SERIES', isin: UNMAPPED.isin, companyId: UNMAPPED.companyId }, { exchange: undefined, series: 'EQ' }),
      resolved({ symbol: 'EDGE-LOWER', isin: QUALIFIABLE.isin.toLowerCase(), companyId: QUALIFIABLE.companyId }),
      resolved({ symbol: 'EDGE-MALFORMED', isin: 'NOT-AN-ISIN', companyId: UNMAPPED.companyId }),
      resolved({ symbol: 'EDGE-OTHER-EXCHANGE', isin: QUALIFIABLE.isin, companyId: QUALIFIABLE.companyId }, { exchange: 'MCX' as unknown as 'NSE' }),
    ];
    const input = [...edge, ...rows];
    const variants: Array<{ securityMaster?: typeof governed.securityMaster; registry?: DhanInstrumentRegistry }> = [
      governed,
      { securityMaster: governed.securityMaster, registry: registryOf() },
      { securityMaster: governed.securityMaster },
      { registry: governed.registry },
      {},
    ];
    for (const options of variants) {
      const before = mapBrokerImportHoldingsBeforeTheChange(input, options);
      assert.deepEqual(mapBrokerImportHoldings(input, options), before);
      assert.deepEqual(mapBrokerImportHoldingsWithQualification(input, options).holdings, before);
    }
    assert.deepEqual(mapBrokerImportHoldings(input), mapBrokerImportHoldingsBeforeTheChange(input));

    // Non-vacuity for the tracked-master comparison above: this input contains
    // both a qualified and an unresolved holding, so the equivalence holds
    // where a security identity survives and where it does not.
    const edgeOutcome = mapBrokerImportHoldingsWithQualification(edge, governed);
    assert.ok(edgeOutcome.holdings.some((h) => h.securityIdentity !== null), 'a qualified row is present');
    assert.ok(edgeOutcome.holdings.some((h) => h.securityIdentity === null), 'an unresolved row is present');
    assert.ok(
      edgeOutcome.qualification.some((q) => q.reason !== null),
      'an unresolved row states a typed reason',
    );
  });
});
