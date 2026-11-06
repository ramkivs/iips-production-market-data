/**
 * V1 — UNKNOWN/lost-acknowledgement reconciliation, evidence-bound readback
 * (2026-11-06 bounded correction of the finding recorded in the R01 investigation).
 *
 * AUTHORITY AND SCOPE
 *   - The PA authorized the bounded v1 correction that R01 expressly deferred
 *     (`IIPS_V3_R01_IPD_RECONCILIATION_INVESTIGATION_2026-11-06.md` §4.5): the
 *     legacy `reconcileBrokerImportByRead` treated a lone contribution-ledger
 *     row as sufficient evidence. This suite pins the corrected behaviour.
 *   - Fixture-class, synthetic disposable databases. No operational database
 *     is opened; no production path is enabled or exercised; no W-1, lock,
 *     fsync, schema or wire change. Reconciliation performs ZERO writes.
 *   - BEHAVIOUR CHANGE: the legacy four-argument call now always returns
 *     UNRESOLVED — a terminal verdict requires settlement, evidence binding to
 *     the original request, cross-binding and two consistent evidence passes.
 *     Committed imports reconcile COMMITTED when the original request is
 *     supplied as `{ request }`; nothing else can produce COMMITTED.
 *   - This suite claims no qualification (QE 0/11), no admission and no live
 *     save. Synthetic PASS != qualification; reconstructed != original.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase, closeDatabase } from '../src/persistence/connection.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import {
  DurablePortfolioStore,
  type OwnerRef,
} from '../src/persistence/portfolio_store.js';
import {
  persistBrokerImport,
  reconcileBrokerImportByRead,
  deriveV1IntendedEvidence,
  type BrokerImportHolding,
  type BrokerImportRequest,
  type BrokerImportReconciliationWriter,
} from '../src/persistence/brokerImportPersistence.js';
import { createGovernedBrokerObservationResolver } from '../src/identity/broker_observation_resolver.js';

const OWNER: OwnerRef = { canonicalOwnerId: 'owner-v1', tenantId: 'ipd-personal-local' };
const FOREIGN_OWNER: OwnerRef = { canonicalOwnerId: 'owner-v1-foreign', tenantId: 'ipd-personal-local' };
const resolvedResolver = createGovernedBrokerObservationResolver();

let root: string;

function freshDb(name: string): DatabaseSync {
  closeDatabase();
  const db = openDatabase(join(root, name));
  ensureMigrations(db, GATE3_MIGRATIONS);
  db.prepare(`INSERT OR IGNORE INTO local_principal_bindings
    (binding_id, principal_label, status, created_at, updated_at, revoked_at)
    VALUES ('binding-v1', 'test-principal', 'ACTIVE', '2026-11-06T00:00:00.000Z', '2026-11-06T00:00:00.000Z', NULL)`).run();
  db.prepare(`INSERT OR IGNORE INTO local_principal_memberships
    (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at)
    VALUES ('membership-v1', 'binding-v1', 'ipd-personal-local', 'owner-v1', 'ACTIVE', '2026-11-06T00:00:00.000Z', '2026-11-06T00:00:00.000Z', NULL)`).run();
  return db;
}

function holding(overrides: Partial<BrokerImportHolding> = {}): BrokerImportHolding {
  return {
    symbol: 'RELIANCE',
    exchange: 'NSE',
    quantity: 10,
    averageBuyPrice: 100,
    currentPrice: 110,
    marketValue: 1100,
    weightPercentage: 60,
    active: true,
    sourceBroker: 'ZERODHA',
    lineageDigest: 'lineage-reliance',
    ...overrides,
  };
}

function importRequest(overrides: Partial<BrokerImportRequest> = {}): BrokerImportRequest {
  return {
    portfolioId: 'P-V1',
    expectedRevision: 0,
    holdings: [holding(), holding({ symbol: 'TCS', weightPercentage: 40, quantity: 5, marketValue: 750 })],
    contentDigest: 'sha256:v1-fixture-a',
    fileName: 'zerodha-v1.csv',
    sourceBroker: 'ZERODHA',
    importedAt: '2026-11-06T01:00:00.000Z',
    ...overrides,
  };
}

function domainCounts(db: DatabaseSync): number {
  const row = db
    .prepare(
      `SELECT (SELECT COUNT(*) FROM portfolios)
            + (SELECT COUNT(*) FROM portfolio_revisions)
            + (SELECT COUNT(*) FROM portfolio_holdings)
            + (SELECT COUNT(*) FROM portfolio_contributions) AS n`,
    )
    .get() as { n: number | bigint };
  return Number(row.n);
}

function tableRowCounts(db: DatabaseSync): string {
  return JSON.stringify({
    portfolios: db.prepare('SELECT COUNT(*) AS n FROM portfolios').get(),
    revisions: db.prepare('SELECT COUNT(*) AS n FROM portfolio_revisions').get(),
    holdings: db.prepare('SELECT COUNT(*) AS n FROM portfolio_holdings').get(),
    contributions: db.prepare('SELECT COUNT(*) AS n FROM portfolio_contributions').get(),
  });
}

/** Commit import `P-…` with a simulated lost acknowledgement AFTER the commit lands. */
function commitWithLostAck(name: string, request: BrokerImportRequest): { db: DatabaseSync; outcome: ReturnType<typeof persistBrokerImport> } {
  const db = freshDb(name);
  const store = new DurablePortfolioStore(db, {
    afterCommit: () => {
      throw new Error('simulated ack loss');
    },
  });
  const outcome = persistBrokerImport(store, OWNER, request, resolvedResolver);
  return { db, outcome };
}

describe('v1 / UNKNOWN/lost-ACK reconciliation — evidence-bound readback (bounded correction)', () => {
  before(() => {
    root = mkdtempSync(join(tmpdir(), 'v1-broker-import-recon-'));
  });

  after(() => {
    closeDatabase();
    rmSync(root, { recursive: true, force: true });
  });

  it('V1-T1: a genuinely committed import with lost ack reconciles COMMITTED — and performs zero writes', () => {
    const request = importRequest({ portfolioId: 'P-V1-T1' });
    const { db, outcome } = commitWithLostAck('v1-t1.db', request);
    const store = new DurablePortfolioStore(db);
    assert.equal(outcome.ok, 'unknown');
    assert.equal(outcome.ok === 'unknown' && outcome.code, 'OUTCOME_UNKNOWN');
    const beforeCounts = domainCounts(db);
    assert.equal(store.contributions(OWNER, 'P-V1-T1').length, 1);
    assert.equal(
      reconcileBrokerImportByRead(store, OWNER, 'P-V1-T1', request.contentDigest, { request }),
      'COMMITTED',
    );
    assert.equal(domainCounts(db), beforeCounts, 'reconciliation performed zero writes');
    assert.equal(store.revisions(OWNER, 'P-V1-T1').length, 1, 'no automatic retry occurred');
    closeDatabase();
  });

  it('V1-T2: the legacy four-argument call fails closed to UNRESOLVED (documented tightening)', () => {
    const request = importRequest({ portfolioId: 'P-V1-T2' });
    const { db, outcome } = commitWithLostAck('v1-t2.db', request);
    const store = new DurablePortfolioStore(db);
    assert.equal(outcome.ok, 'unknown');
    assert.equal(reconcileBrokerImportByRead(store, OWNER, 'P-V1-T2', request.contentDigest), 'UNRESOLVED');
    closeDatabase();
  });

  it('V1-T3: a pre-commit rollback leaves no evidence; settlement-proven readback yields NOT_COMMITTED, zero writes', () => {
    const request = importRequest({ portfolioId: 'P-V1-T3' });
    const db = freshDb('v1-t3.db');
    const store = new DurablePortfolioStore(db, {
      afterMutation: (step) => {
        if (step === 'revision-insert') throw new Error('injected:revision-insert');
      },
    });
    const outcome = persistBrokerImport(store, OWNER, request, resolvedResolver);
    assert.notEqual(outcome.ok, 'unknown');
    assert.equal(outcome.ok === false && outcome.storeEffect, 'NONE');
    const beforeCounts = tableRowCounts(db);
    assert.equal(
      reconcileBrokerImportByRead(new DurablePortfolioStore(db), OWNER, 'P-V1-T3', request.contentDigest, { request }),
      'NOT_COMMITTED',
    );
    assert.equal(tableRowCounts(db), beforeCounts, 'reconciliation performed zero writes');
    closeDatabase();
  });

  it('V1-T4: commit landed but the successor snapshot rows are missing — never COMMITTED', () => {
    const request = importRequest({ portfolioId: 'P-V1-T4' });
    const { db, outcome } = commitWithLostAck('v1-t4.db', request);
    assert.equal(outcome.ok, 'unknown');
    db.exec('DELETE FROM portfolio_holdings;');
    db.exec('DELETE FROM portfolio_revisions;');
    const store = new DurablePortfolioStore(db);
    assert.equal(
      reconcileBrokerImportByRead(store, OWNER, 'P-V1-T4', request.contentDigest, { request }),
      'UNRESOLVED',
    );
    closeDatabase();
  });

  it('V1-T5: a contradicted stored content_digest (≠ intended digest) yields UNRESOLVED', () => {
    const request = importRequest({ portfolioId: 'P-V1-T5' });
    const { db, outcome } = commitWithLostAck('v1-t5.db', request);
    assert.equal(outcome.ok, 'unknown');
    db.prepare('UPDATE portfolio_revisions SET content_digest = ? WHERE portfolio_id = ?').run('0'.repeat(64), 'P-V1-T5');
    const store = new DurablePortfolioStore(db);
    assert.equal(
      reconcileBrokerImportByRead(store, OWNER, 'P-V1-T5', request.contentDigest, { request }),
      'UNRESOLVED',
    );
    closeDatabase();
  });

  it('V1-T6: tampered contribution evidence never yields COMMITTED', () => {
    // Sub-case a: amount no longer matches the revision total.
    {
      const request = importRequest({ portfolioId: 'P-V1-T6a' });
      const { db, outcome } = commitWithLostAck('v1-t6a.db', request);
      assert.equal(outcome.ok, 'unknown');
      db.prepare('UPDATE portfolio_contributions SET amount = amount + 1 WHERE portfolio_id = ?').run('P-V1-T6a');
      const store = new DurablePortfolioStore(db);
      assert.equal(
        reconcileBrokerImportByRead(store, OWNER, 'P-V1-T6a', request.contentDigest, { request }),
        'UNRESOLVED',
      );
      closeDatabase();
    }
    // Sub-case b: lineage no longer binds to the commit-derived provenance.
    {
      const request = importRequest({ portfolioId: 'P-V1-T6b' });
      const { db, outcome } = commitWithLostAck('v1-t6b.db', request);
      assert.equal(outcome.ok, 'unknown');
      db.prepare('UPDATE portfolio_contributions SET lineage_digest = ? WHERE portfolio_id = ?').run(
        'e'.repeat(64),
        'P-V1-T6b',
      );
      const store = new DurablePortfolioStore(db);
      assert.equal(
        reconcileBrokerImportByRead(store, OWNER, 'P-V1-T6b', request.contentDigest, { request }),
        'UNRESOLVED',
      );
      closeDatabase();
    }
  });

  it('V1-T7: a stale expectedRevision (wrong successor expectation) never yields COMMITTED; the correct expectation does', () => {
    const request = importRequest({ portfolioId: 'P-V1-T7' });
    const { db, outcome } = commitWithLostAck('v1-t7.db', request);
    assert.equal(outcome.ok, 'unknown');
    const store = new DurablePortfolioStore(db);
    const staleExpectation = { request: importRequest({ portfolioId: 'P-V1-T7', expectedRevision: 5 }) };
    assert.equal(
      reconcileBrokerImportByRead(store, OWNER, 'P-V1-T7', request.contentDigest, staleExpectation),
      'UNRESOLVED',
    );
    assert.equal(
      reconcileBrokerImportByRead(store, OWNER, 'P-V1-T7', request.contentDigest, { request }),
      'COMMITTED',
    );
    closeDatabase();
  });

  it('V1-T8: an intended evidence set for a different import against the same store yields UNRESOLVED, never COMMITTED', () => {
    const request = importRequest({ portfolioId: 'P-V1-T8' });
    const { db, outcome } = commitWithLostAck('v1-t8.db', request);
    assert.equal(outcome.ok, 'unknown');
    const store = new DurablePortfolioStore(db);
    const foreignIntent = importRequest({ portfolioId: 'P-V1-T8', contentDigest: 'f'.repeat(64) });
    assert.equal(
      reconcileBrokerImportByRead(store, OWNER, 'P-V1-T8', 'f'.repeat(64), { request: foreignIntent }),
      'UNRESOLVED',
    );
    closeDatabase();
  });

  it('V1-T9: the same import read under a foreign owner yields NOT_COMMITTED — never COMMITTED', () => {
    const request = importRequest({ portfolioId: 'P-V1-T9' });
    const { db, outcome } = commitWithLostAck('v1-t9.db', request);
    assert.equal(outcome.ok, 'unknown');
    const store = new DurablePortfolioStore(db);
    assert.equal(
      reconcileBrokerImportByRead(store, FOREIGN_OWNER, 'P-V1-T9', request.contentDigest, { request }),
      'NOT_COMMITTED',
    );
    closeDatabase();
  });

  it('V1-T10: settlement-probe failure yields UNRESOLVED even though every read would succeed', () => {
    const request = importRequest({ portfolioId: 'P-V1-T10' });
    const { db, outcome } = commitWithLostAck('v1-t10.db', request);
    assert.equal(outcome.ok, 'unknown');
    const store = new DurablePortfolioStore(db);
    const unsettled: BrokerImportReconciliationWriter = {
      contributions: store.contributions.bind(store),
      proveSettledForReconciliation: () => {
        throw new Error('BEGIN IMMEDIATE failed: busy');
      },
      revisionReconciliationEvidence: store.revisionReconciliationEvidence.bind(store),
      holdingsForRevision: store.holdingsForRevision.bind(store),
    };
    assert.equal(
      reconcileBrokerImportByRead(unsettled, OWNER, 'P-V1-T10', request.contentDigest, { request }),
      'UNRESOLVED',
    );
    closeDatabase();
  });

  it('V1-T11: flickering evidence across passes yields UNRESOLVED', () => {
    const request = importRequest({ portfolioId: 'P-V1-T11' });
    const { db, outcome } = commitWithLostAck('v1-t11.db', request);
    assert.equal(outcome.ok, 'unknown');
    const store = new DurablePortfolioStore(db);
    let calls = 0;
    const flickering: BrokerImportReconciliationWriter = {
      contributions: (o, pid) => {
        calls += 1;
        return calls <= 1 ? store.contributions(o, pid) : [];
      },
      proveSettledForReconciliation: store.proveSettledForReconciliation.bind(store),
      revisionReconciliationEvidence: store.revisionReconciliationEvidence.bind(store),
      holdingsForRevision: store.holdingsForRevision.bind(store),
    };
    assert.equal(
      reconcileBrokerImportByRead(flickering, OWNER, 'P-V1-T11', request.contentDigest, { request }),
      'UNRESOLVED',
    );
    closeDatabase();
  });

  it('V1-T12: malformed or mismatched evidence inputs fail closed to UNRESOLVED', () => {
    const request = importRequest({ portfolioId: 'P-V1-T12' });
    const { db, outcome } = commitWithLostAck('v1-t12.db', request);
    assert.equal(outcome.ok, 'unknown');
    const store = new DurablePortfolioStore(db);
    // Empty digest.
    assert.equal(reconcileBrokerImportByRead(store, OWNER, 'P-V1-T12', '  ', { request }), 'UNRESOLVED');
    // Argument digest must equal the request's content digest.
    assert.equal(
      reconcileBrokerImportByRead(store, OWNER, 'P-V1-T12', 'sha256:different', { request }),
      'UNRESOLVED',
    );
    // The portfolio id must match the originally reconciled portfolio.
    assert.equal(
      reconcileBrokerImportByRead(store, OWNER, 'P-OTHER', request.contentDigest, { request }),
      'UNRESOLVED',
    );
    // Expectation without a usable request.
    assert.equal(
      reconcileBrokerImportByRead(store, OWNER, 'P-V1-T12', request.contentDigest, { request: undefined as unknown as BrokerImportRequest }),
      'UNRESOLVED',
    );
    closeDatabase();
  });

  it('V1-T13: a REPLACE-mode create stores INITIAL (v1 create semantics) and reconciles COMMITTED', () => {
    const request = importRequest({ portfolioId: 'P-V1-T13', mode: 'REPLACE' });
    const { db, outcome } = commitWithLostAck('v1-t13.db', request);
    assert.equal(outcome.ok, 'unknown');
    const store = new DurablePortfolioStore(db);
    assert.equal(store.revisions(OWNER, 'P-V1-T13').length, 1);
    assert.equal(store.revisions(OWNER, 'P-V1-T13')[0].operation, 'INITIAL');
    assert.equal(
      reconcileBrokerImportByRead(store, OWNER, 'P-V1-T13', request.contentDigest, { request }),
      'COMMITTED',
    );
    closeDatabase();
  });

  it('V1-T14: intended-evidence derivation fails closed on a request the identity gate refuses', () => {
    // A symbol outside the governed master cannot produce intended evidence.
    const request = importRequest({ portfolioId: 'P-V1-T14', holdings: [holding({ symbol: 'NOT_IN_MASTER_XYZZY' })] });
    assert.equal(deriveV1IntendedEvidence(request, resolvedResolver), undefined);
    const db = freshDb('v1-t14.db');
    const store = new DurablePortfolioStore(db);
    assert.equal(
      reconcileBrokerImportByRead(store, OWNER, 'P-V1-T14', request.contentDigest, { request }),
      'UNRESOLVED',
    );
    closeDatabase();
  });

  it('V1-T15: intended-evidence derivation fails closed on a broker-mismatched holdings set', () => {
    // Each holding's source broker must match the import's provenance broker.
    const request = importRequest({
      portfolioId: 'P-V1-T15',
      holdings: [holding({ symbol: 'TCS', sourceBroker: 'NOTZERODHA' })],
    });
    assert.equal(deriveV1IntendedEvidence(request, resolvedResolver), undefined);
  });
});
