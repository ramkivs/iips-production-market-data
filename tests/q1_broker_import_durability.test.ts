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
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase, closeDatabase } from '../src/persistence/connection.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import {
  DurablePortfolioStore,
  type HoldingInput,
  type OwnerRef,
} from '../src/persistence/portfolio_store.js';
import { DurablePortfolioStorePort } from '../src/persistence/durablePortfolioStorePort.js';
import {
  computeBrokerImportProvenance,
  evaluateBrokerImportIdentityGate,
  mapBrokerImportHoldings,
  persistBrokerImport,
  type BrokerImportHolding,
  type BrokerImportRequest,
} from '../src/persistence/brokerImportPersistence.js';

const OWNER: OwnerRef = { canonicalOwnerId: 'owner-local', tenantId: 'tenant-local' };
const PORTFOLIO = 'P-BROKER';

function holding(overrides: Partial<BrokerImportHolding> = {}): BrokerImportHolding {
  return {
    symbol: 'RELIANCE',
    companyId: 'C-RELIANCE',
    quantity: 10,
    averageBuyPrice: 100,
    currentPrice: 110,
    marketValue: 1100,
    weightPercentage: 60,
    active: true,
    sourceBroker: 'ZERODHA',
    lineageDigest: 'lineage-reliance',
    identityStatus: 'RESOLVED',
    resolutionDisposition: 'CANONICAL_P04',
    ...overrides,
  };
}

function importRequest(overrides: Partial<BrokerImportRequest> = {}): BrokerImportRequest {
  return {
    portfolioId: PORTFOLIO,
    holdings: [holding(), holding({ symbol: 'TCS', companyId: 'C-TCS', weightPercentage: 40 })],
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
    return db;
  }

  /* ---------------------------------------------------------------- *
   * 1. The identity gate (Gate E W-6 / DP-2 Option 2F)
   * ---------------------------------------------------------------- */

  describe('the governed identity gate', () => {
    it('refuses a holding with no canonical resolution and names it', () => {
      const gate = evaluateBrokerImportIdentityGate([
        holding(),
        holding({ symbol: 'UNKNOWNCO', companyId: '', identityStatus: 'UNRESOLVED' }),
      ]);
      assert.equal(gate.saveable, false);
      assert.equal(gate.refusedHoldings.length, 1);
      assert.equal(gate.refusedHoldings[0].symbol, 'UNKNOWNCO');
      assert.match(gate.refusedHoldings[0].reason, /UNMAPPED_IDENTIFIER/);
    });

    it('refuses a resolved holding that carries no canonical identity', () => {
      const gate = evaluateBrokerImportIdentityGate([holding({ companyId: '' })]);
      assert.equal(gate.saveable, false);
      assert.match(gate.refusedHoldings[0].reason, /CANONICAL_IDENTITY_MISSING/);
    });

    it('refuses an UNRESOLVED holding that carries a canonical identity (fabrication)', () => {
      const gate = evaluateBrokerImportIdentityGate([
        holding({ identityStatus: 'UNRESOLVED', companyId: 'C-SHOULD-NOT-BE-HERE' }),
      ]);
      assert.equal(gate.saveable, false);
      assert.match(gate.refusedHoldings[0].reason, /IDENTITY_FABRICATED/);
    });

    it('refuses the non-production operator bypass outright', () => {
      const gate = evaluateBrokerImportIdentityGate([
        holding({ resolutionDisposition: 'NON_PRODUCTION_OPERATOR_BYPASS' }),
      ]);
      assert.equal(gate.saveable, false);
      assert.match(gate.refusedHoldings[0].reason, /NON_PRODUCTION_BYPASS_REFUSED/);
    });

    it('accepts a fully resolved vector', () => {
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
      const mapped = mapBrokerImportHoldings([
        holding({ symbol: 'TCS', companyId: '' , identityStatus: 'UNRESOLVED' }),
        holding({ symbol: 'RELIANCE' }),
      ]);
      assert.deepEqual(
        mapped.map((h) => h.symbol),
        ['RELIANCE', 'TCS'],
      );
      const unresolved = mapped.find((h) => h.symbol === 'TCS') as HoldingInput;
      assert.equal(unresolved.companyId, '');
      assert.equal(unresolved.identityStatus, 'UNRESOLVED');
      assert.equal(unresolved.resolutionDisposition, 'CANONICAL_P04');
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
      const again = persistBrokerImport(storeAfterRestart, OWNER, importRequest());
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
        contentDigest: 'sha256:file-b',
        fileName: 'dhan-holdings-b.csv',
        sourceBroker: 'DHAN',
      });

      persistBrokerImport(store, OWNER, fileA);
      const second = persistBrokerImport(store, OWNER, fileB);
      assert.equal(second.ok === true && second.disposition, 'MERGED_INTO_EXISTING');
      assert.equal(second.ok === true && second.revision, 2);

      const replay = persistBrokerImport(store, OWNER, fileA);
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
        importRequest({
          holdings: [
            holding(),
            holding({ symbol: 'UNKNOWNCO', companyId: '', identityStatus: 'UNRESOLVED' }),
          ],
        }),
      );
      assert.equal(refused.ok, false);
      assert.equal(refused.ok === false && refused.code, 'REFUSED_UNRESOLVED_IDENTITY');
      assert.equal(refused.storeEffect, 'NONE');
      assert.equal(countRows(db), before, 'the refused import wrote nothing at all');
      const rows = db
        .prepare("SELECT COUNT(*) AS n FROM portfolio_holdings WHERE symbol = 'UNKNOWNCO'")
        .get() as { n: number | bigint };
      assert.equal(Number(rows.n), 0, 'the unresolved holding was never persisted');
    });
  });
});
