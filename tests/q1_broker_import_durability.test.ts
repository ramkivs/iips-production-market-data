/**
 * Q1 bounded residual implementation — durable broker-ingestion persistence
 * (CV-39; `G-2` §2/§3; Gate E rev 1 W-6/W-7/W-8/W-10; DP-2 Option 2F).
 *
 * WHAT THIS SUITE IS, AND WHAT IT IS NOT
 *   It is a **qualification-fixture measurement** of the durable import
 *   boundary on the host that ran it. It exercises the REAL compiled
 *   components — `DurablePortfolioStore`, `DurablePortfolioStorePort`,
 *   `migration_ledger`, `connection` — against a fixture database under the OS
 *   temporary directory. No repository worktree file is written, no endpoint
 *   is used for a write, and the authoritative operator store is never opened.
 *
 *   It is NOT an admitted write, NOT a Gate 4 qualification result and NOT a
 *   durable-capability claim. Gate E W-1(3) (Gate 4 qualification) and W-1(4)
 *   (Gate 5 admission) are unmet, so the product write path refuses every
 *   write with zero store effect; the suite proves that refusal too.
 *
 * THE FOUR BEHAVIORS THIS SUITE MEASURES
 *   1. unresolved identity is refused, never fabricated (DP-2 2F / W-6);
 *   2. a committed import survives a store restart and a SEPARATE PROCESS
 *      restart (restart durability);
 *   3. a re-import of the same broker file is an idempotent no-op, and a
 *      re-import of an EARLIER broker file is also a no-op (no unintended
 *      duplication), while a different file is a new import (no loss);
 *   4. the Gate E W-1 write gate still refuses every write with zero store
 *      effect, and no environment flag changes that.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDatabase, closeDatabase } from '../src/persistence/connection.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import {
  DurablePortfolioStore,
  WriteNotAuthorizedError,
  type HoldingInput,
  type OwnerRef,
} from '../src/persistence/portfolio_store.js';
import { DurablePortfolioStorePort } from '../src/persistence/durablePortfolioStorePort.js';
import { resolveActiveBindingInCurrentTransaction } from '../src/persistence/binding.js';
import {
  computeBrokerImportProvenance,
  evaluateBrokerImportIdentityGate,
  mapBrokerImportHoldings,
  persistBrokerImport,
  reconcileBrokerImportByRead,
  type BrokerImportHolding,
  type BrokerImportRequest,
  type ResolvedBrokerImportHolding,
} from '../src/persistence/brokerImportPersistence.js';

const OWNER: OwnerRef = { canonicalOwnerId: 'owner-local', tenantId: 'tenant-local' };
const PORTFOLIO = 'P-BROKER';

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
    portfolioId: PORTFOLIO,
    expectedRevision: 0,
    holdings: [holding(), holding({ symbol: 'TCS', exchange: 'NSE', weightPercentage: 40 })],
    contentDigest: 'sha256:file-a',
    fileName: 'zerodha-holdings-a.csv',
    sourceBroker: 'ZERODHA',
    importedAt: '2026-10-22T10:00:00.000Z',
    ...overrides,
  };
}

function countRows(db: DatabaseSync): number {
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

function databaseSnapshot(db: DatabaseSync): string {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as Array<{ name: string }>;
  const state = tables.map(({ name }) => {
    const rows = db.prepare(`SELECT * FROM \"${name.replaceAll('\"', '\"\"')}\"`).all() as Array<Record<string, unknown>>;
    const normalized = rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === 'bigint' ? value.toString() : value])));
    normalized.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    return { name, rows: normalized };
  });
  return JSON.stringify(state);
}

describe('q1 / durable broker-ingestion persistence boundary', () => {
  let root: string;
  let dbPath: string;

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'q1-broker-import-'));
    dbPath = join(root, 'store', 'ipd.db');
  });

  after(() => {
    closeDatabase();
    rmSync(root, { recursive: true, force: true });
  });

  function openFixture(): DatabaseSync {
    const db = openDatabase(dbPath);
    ensureMigrations(db, GATE3_MIGRATIONS);
    db.prepare(`INSERT OR IGNORE INTO local_principal_bindings
      (binding_id, principal_label, status, created_at, updated_at, revoked_at)
      VALUES ('binding-test', 'test-principal', 'ACTIVE', '2026-10-23T00:00:00.000Z', '2026-10-23T00:00:00.000Z', NULL)`).run();
    db.prepare(`INSERT OR IGNORE INTO local_principal_memberships
      (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at)
      VALUES ('membership-test', 'binding-test', 'tenant-local', 'owner-local', 'ACTIVE', '2026-10-23T00:00:00.000Z', '2026-10-23T00:00:00.000Z', NULL)`).run();
    return db;
  }

  /* ---------------------------------------------------------------- *
   * 1. The identity gate (Gate E W-6 / DP-2 Option 2F)
   * ---------------------------------------------------------------- */

  describe('the governed identity gate', () => {
    it('resolves raw broker observations from the governed source and names unmapped identifiers', () => {
      const gate = evaluateBrokerImportIdentityGate([
        holding(),
        holding({ symbol: 'UNKNOWNCO', exchange: 'NSE' }),
      ]);
      assert.equal(gate.saveable, false);
      assert.equal(gate.refusedHoldings.length, 1);
      assert.equal(gate.refusedHoldings[0].symbol, 'UNKNOWNCO');
      assert.match(gate.refusedHoldings[0].reason, /UNMAPPED_IDENTIFIER/);
      assert.ok(gate.refusedHoldings[0].sourceRevision?.includes(':'));
      assert.equal(gate.refusedHoldings[0].quarantineRecord?.rawIdentifier, 'UNKNOWNCO');
      assert.equal(gate.refusedHoldings[0].quarantineRecord?.reason, 'UNMAPPED_IDENTIFIER');
    });

    it('refuses contradictory broker-observed identifiers instead of choosing one', () => {
      const gate = evaluateBrokerImportIdentityGate([holding({ symbol: 'TCS', isin: 'INE002A01018' })]);
      assert.equal(gate.saveable, false);
      assert.match(gate.refusedHoldings[0].reason, /AMBIGUOUS_COLLISION/);
    });

    it('refuses a symbol without an explicit exchange', () => {
      const gate = evaluateBrokerImportIdentityGate([holding({ exchange: undefined })]);
      assert.equal(gate.saveable, false);
      assert.match(gate.refusedHoldings[0].reason, /MISSING_EXCHANGE/);
    });

    it('accepts a fully resolved raw vector without receiving any canonical identity claim', () => {
      const gate = evaluateBrokerImportIdentityGate([holding()]);
      assert.equal(gate.saveable, true);
      assert.deepEqual(gate.refusedHoldings, []);
    });
  });

  /* ---------------------------------------------------------------- *
   * 2. Deterministic mapping and provenance
   * ---------------------------------------------------------------- */

  describe('the deterministic mapping', () => {
    it('preserves every value verbatim and never invents an identity', () => {
      const resolved: ResolvedBrokerImportHolding[] = [
        { ...holding({ symbol: 'TCS' }), companyId: 'EQ_TCS_IN', identityStatus: 'RESOLVED', resolutionDisposition: 'CANONICAL_P04' },
        { ...holding(), companyId: 'EQ_RELIANCE_IN', identityStatus: 'RESOLVED', resolutionDisposition: 'CANONICAL_P04' },
      ];
      const mapped = mapBrokerImportHoldings(resolved);
      assert.deepEqual(mapped.map((h) => h.symbol), ['RELIANCE', 'TCS']);
      assert.ok(mapped.every((h) => h.companyId && h.identityStatus === 'RESOLVED'));
      assert.ok(mapped.every((h) => h.resolutionDisposition === 'CANONICAL_P04'));
    });

    it('binds the provenance digest to the broker file it came from', () => {
      const a = computeBrokerImportProvenance(importRequest());
      const b = computeBrokerImportProvenance(importRequest());
      const otherFile = computeBrokerImportProvenance(
        importRequest({ contentDigest: 'sha256:file-b', fileName: 'zerodha-holdings-b.csv' }),
      );
      assert.equal(a, b, 'the same import is deterministic');
      assert.notEqual(a, otherFile, 'a different broker file is a different import');
    });
  });

  /* ---------------------------------------------------------------- *
   * 3. The write gate (Gate E W-1) is still closed
   * ---------------------------------------------------------------- */

  it('the W-1 write gate refuses the import with zero store effect', () => {
    const db = openFixture();
    const before = countRows(db);
    const port = new DurablePortfolioStorePort(db);
    const outcome = persistBrokerImport(port, OWNER, importRequest());
    assert.equal(outcome.ok, false);
    assert.equal(outcome.ok === false && outcome.code, 'WRITE_NOT_AUTHORIZED');
    assert.equal(outcome.storeEffect, 'NONE');
    assert.equal(countRows(db), before, 'no row was created, changed or deleted');
    let callbackInvoked = false;
    assert.throws(() => port.withBrokerImportTransaction(OWNER, () => { callbackInvoked = true; }), WriteNotAuthorizedError);
    assert.equal(callbackInvoked, false, 'W-1 refuses before evaluating the transaction callback');
    assert.equal(db.isTransaction, false, 'W-1 refuses before beginning a database transaction');
  });

  /* ---------------------------------------------------------------- *
   * 4. The import itself, on a fixture store
   * ---------------------------------------------------------------- */

  describe('the durable import on a qualification fixture', () => {
    it('commits an import, survives a store restart and a separate process restart, and is idempotent', () => {
      const db = openFixture();
      const store = new DurablePortfolioStore(db);

      const first = persistBrokerImport(store, OWNER, importRequest());
      assert.equal(first.ok, true);
      assert.equal(first.ok === true && first.disposition, 'SAVED_NEW_BATCH');
      assert.equal(first.ok === true && first.revision, 1);

      const committed = store.get(OWNER, PORTFOLIO);
      assert.equal(committed.revision, 1);
      assert.equal(committed.holdings.length, 2);
      assert.equal(committed.contributions.length, 1);
      assert.equal(committed.contributions[0].contributionId, 'sha256:file-a');
      assert.equal(committed.contributions[0].fileName, 'zerodha-holdings-a.csv');
      assert.equal(committed.contributions[0].sourceBroker, 'ZERODHA');
      assert.equal(committed.contributions[0].contentDigest, 'sha256:file-a');
      assert.equal(committed.contributions[0].importedAt, '2026-10-22T10:00:00.000Z');
      assert.equal(committed.contributions[0].semantics, 'SAVED_NEW_BATCH');
      assert.equal(committed.contributions[0].lineageDigest?.length, 64);
      assert.equal(committed.provenanceDigest.length, 64);

      // --- restart 1: close and reopen the store in this process -------------
      closeDatabase();
      const reopened = openFixture();
      const storeAfterRestart = new DurablePortfolioStore(reopened);
      const readBack = storeAfterRestart.get(OWNER, PORTFOLIO);
      assert.deepEqual(readBack.holdings, committed.holdings, 'holdings are byte-equal after restart');
      assert.deepEqual(readBack.contributions, committed.contributions, 'contributions are byte-equal after restart');
      assert.deepEqual(
        storeAfterRestart.revisions(OWNER, PORTFOLIO).map((r) => [r.revision, r.operation]),
        [[1, 'INITIAL']],
        'revisions are byte-equal after restart',
      );

      // --- restart 2: a SEPARATE OS process reads the same store file -------
      const child = spawnSync(
        process.execPath,
        [
          '-e',
          [
            "const { DatabaseSync } = require('node:sqlite');",
            `const db = new DatabaseSync(${JSON.stringify(dbPath)});`,
            "const rows = db.prepare('SELECT contribution_id, amount FROM portfolio_contributions ORDER BY contribution_id').all();",
            "const holdings = db.prepare('SELECT symbol, company_id, quantity, market_value FROM portfolio_holdings ORDER BY holding_key').all();",
            'process.stdout.write(JSON.stringify({ rows, holdings }));',
          ].join('\n'),
        ],
        { encoding: 'utf8' },
      );
      assert.equal(child.status, 0, child.stderr);
      const observed = JSON.parse(child.stdout) as {
        rows: Array<{ contribution_id: string; amount: number }>;
        holdings: Array<{ symbol: string; company_id: string; quantity: number; market_value: number }>;
      };
      assert.deepEqual(observed.rows, [{ contribution_id: 'sha256:file-a', amount: 2200 }]);
      assert.deepEqual(
        observed.holdings.map((h) => h.symbol),
        ['RELIANCE', 'TCS'],
      );

      // --- idempotent re-import of the SAME file ---------------------------
      const again = persistBrokerImport(storeAfterRestart, OWNER, importRequest({ expectedRevision: 1 }));
      assert.equal(again.ok, true);
      assert.equal(again.ok === true && again.disposition, 'ALREADY_IMPORTED_NO_OP');
      assert.equal(again.ok === true && again.noOp, true);
      assert.equal(again.storeEffect, 'NONE');
      const afterNoOp = storeAfterRestart.get(OWNER, PORTFOLIO);
      assert.equal(afterNoOp.revision, 1, 'no new revision was created');
      assert.equal(afterNoOp.contributions.length, 1, 'no duplicated contribution was appended');
      assert.deepEqual(afterNoOp.holdings, committed.holdings, 'no duplication and no loss');
    });

    it('treats a re-import of an EARLIER broker file as a duplicate, not a second application', () => {
      const db = openFixture();
      const store = new DurablePortfolioStore(db);
      const fileA = importRequest();
      const fileB = importRequest({
        expectedRevision: 1,
        contentDigest: 'sha256:file-b',
        fileName: 'dhan-holdings-b.csv',
        sourceBroker: 'DHAN',
        holdings: importRequest().holdings.map((row) => ({ ...row, sourceBroker: 'DHAN' })),
      });

      persistBrokerImport(store, OWNER, fileA);
      const staleDuplicate = persistBrokerImport(store, OWNER, fileA);
      assert.equal(staleDuplicate.ok, false);
      assert.equal(staleDuplicate.ok === false && staleDuplicate.code, 'REVISION_CONFLICT');
      const second = persistBrokerImport(store, OWNER, fileB);
      assert.equal(second.ok === true && second.disposition, 'MERGED_INTO_EXISTING');
      assert.equal(second.ok === true && second.revision, 2);

      const replay = persistBrokerImport(store, OWNER, { ...fileA, expectedRevision: 2 });
      assert.equal(replay.ok === true && replay.disposition, 'ALREADY_IMPORTED_NO_OP');
      assert.equal(replay.ok === true && replay.revision, 2, 'the replay created no third revision');

      const final = store.get(OWNER, PORTFOLIO);
      assert.equal(final.revision, 2);
      assert.equal(final.contributions.length, 2, 'the replay did not append a third contribution');
      assert.deepEqual(
        final.contributions.map((c) => c.contributionId).sort(),
        ['sha256:file-a', 'sha256:file-b'],
      );
    });

    it('never persists a holding whose identity was refused', () => {
      const db = openFixture();
      const store = new DurablePortfolioStore(db);
      const before = countRows(db);
      const refused = persistBrokerImport(
        store,
        OWNER,
        importRequest({ holdings: [holding(), holding({ symbol: 'UNKNOWNCO', exchange: 'NSE' })] }),
      );
      assert.equal(refused.ok, false);
      assert.equal(refused.ok === false && refused.code, 'REFUSED_UNRESOLVED_IDENTITY');
      assert.equal(refused.storeEffect, 'NONE');
      assert.equal(countRows(db), before, 'the refused import wrote nothing at all');
      const rows = db.prepare("SELECT COUNT(*) AS n FROM portfolio_holdings WHERE symbol = 'UNKNOWNCO'").get() as { n: number | bigint };
      assert.equal(Number(rows.n), 0, 'the unresolved holding was never persisted');
    });

    it('requires expectedRevision and rejects caller-supplied canonical identity claims', () => {
      const db = openFixture();
      const store = new DurablePortfolioStore(db);
      const before = countRows(db);
      const missing = { ...importRequest(), expectedRevision: undefined } as unknown as BrokerImportRequest;
      const missingResult = persistBrokerImport(store, OWNER, missing);
      assert.equal(missingResult.ok, false);
      assert.equal(missingResult.ok === false && missingResult.code, 'INVALID_REQUEST');
      const forged = { ...importRequest(), holdings: [{ ...holding(), companyId: 'FORGED' }] } as unknown as BrokerImportRequest;
      const forgedResult = persistBrokerImport(store, OWNER, forged);
      assert.equal(forgedResult.ok, false);
      assert.equal(forgedResult.ok === false && forgedResult.code, 'INVALID_REQUEST');
      const wrongInitialRevision = persistBrokerImport(store, OWNER, importRequest({ portfolioId: 'P-NEW-STALE', expectedRevision: 1 }));
      assert.equal(wrongInitialRevision.ok, false);
      assert.equal(wrongInitialRevision.ok === false && wrongInitialRevision.code, 'REVISION_CONFLICT');
      const unsupportedReplace = persistBrokerImport(store, OWNER, importRequest({ expectedRevision: 2, mode: 'REPLACE' }));
      assert.equal(unsupportedReplace.ok, false);
      assert.equal(unsupportedReplace.ok === false && unsupportedReplace.code, 'INVALID_REQUEST');
      assert.equal(countRows(db), before);
    });

    it('rolls every portfolio/revision/holding/contribution statement back on injected faults', () => {
      const db = openFixture();
      const faultPoints = ['portfolio-insert', 'revision-insert', 'holding-insert:RELIANCE', 'holding-insert:TCS', 'portfolio-update', 'contribution-insert'];
      for (const faultPoint of faultPoints) {
        const before = databaseSnapshot(db);
        const store = new DurablePortfolioStore(db, {
          afterMutation: (step) => { if (step === faultPoint) throw new Error(`injected:${step}`); },
        });
        const result = persistBrokerImport(store, OWNER, importRequest({ portfolioId: `P-${faultPoint}` }));
        assert.equal(result.ok, false, `fault ${faultPoint} must not report success`);
        assert.equal(result.storeEffect, 'NONE');
        assert.equal(databaseSnapshot(db), before, `fault ${faultPoint} must roll back the complete database state`);
      }
    });

    it('returns an explicit unknown result after commit acknowledgement loss and reconciles by read', () => {
      const db = openFixture();
      const store = new DurablePortfolioStore(db, { afterCommit: () => { throw new Error('simulated ack loss'); } });
      const request = importRequest({ portfolioId: 'P-ACK-LOSS', contentDigest: 'sha256:ack-loss' });
      const unknown = persistBrokerImport(store, OWNER, request);
      assert.equal(unknown.ok, 'unknown', JSON.stringify(unknown));
      assert.equal(unknown.code, 'OUTCOME_UNKNOWN');
      assert.equal(unknown.storeEffect, 'OUTCOME_UNKNOWN');
      assert.equal(reconcileBrokerImportByRead(store, OWNER, 'P-ACK-LOSS', 'sha256:ack-loss'), 'COMMITTED');
      assert.equal(store.revisions(OWNER, 'P-ACK-LOSS').length, 1, 'no automatic retry occurred');
    });

    it('revalidates revocation inside the request transaction and keeps the transaction owner intact', () => {
      const db = openFixture();
      db.exec('BEGIN IMMEDIATE;');
      const resolved = resolveActiveBindingInCurrentTransaction(db);
      assert.equal(resolved.canonicalOwnerId, OWNER.canonicalOwnerId);
      assert.equal(db.isTransaction, true, 'the resolver must not commit or roll back its caller transaction');
      const competingRevoker = new DatabaseSync(dbPath);
      assert.throws(
        () => competingRevoker.prepare("UPDATE local_principal_memberships SET status = 'REVOKED' WHERE membership_id = 'membership-test'").run(),
        /locked|busy/i,
        'BEGIN IMMEDIATE serializes the binding check against concurrent revocation writes',
      );
      db.exec('ROLLBACK;');
      competingRevoker.prepare("UPDATE local_principal_memberships SET status = 'REVOKED' WHERE membership_id = 'membership-test'").run();
      competingRevoker.close();

      const before = countRows(db);
      const outcome = persistBrokerImport(new DurablePortfolioStore(db), OWNER, importRequest());
      assert.equal(outcome.ok, false);
      assert.equal(outcome.ok === false && outcome.code, 'RESOURCE_UNAVAILABLE');
      assert.equal(countRows(db), before, 'revoked owner request has no store effect');
    });

    it('upgrades an existing 001–003 database without inventing historical provenance', () => {
      const legacyPath = join(root, 'legacy', 'ipd-legacy.db');
      mkdirSync(join(root, 'legacy'), { recursive: true });
      const legacy = new DatabaseSync(legacyPath);
      legacy.exec('PRAGMA foreign_keys = ON;');
      ensureMigrations(legacy, GATE3_MIGRATIONS.slice(0, 3));
      legacy.prepare(`INSERT INTO portfolios (portfolio_id, canonical_owner_id, tenant_id, portfolio_name, current_revision, status, created_at, updated_at)
        VALUES ('P-OLD', 'owner-local', 'tenant-local', 'Old', 0, 'ACTIVE', 't0', 't0')`).run();
      legacy.prepare(`INSERT INTO portfolio_contributions (canonical_owner_id, portfolio_id, contribution_id, amount, contributed_at, created_at)
        VALUES ('owner-local', 'P-OLD', 'old-id', 10, 't0', 't0')`).run();
      ensureMigrations(legacy, GATE3_MIGRATIONS);
      ensureMigrations(legacy, GATE3_MIGRATIONS);
      const old = legacy.prepare('SELECT file_name, source_broker, content_digest, lineage_digest, imported_at, contribution_semantics FROM portfolio_contributions WHERE contribution_id = ?').get('old-id') as Record<string, unknown>;
      assert.deepEqual(Object.values(old), [null, null, null, null, null, null]);
      legacy.close();
    });
  });
});
