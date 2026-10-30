/**
 * O5-A — durable broker-import consumer wiring
 * (PA act `IIPS-V3-O05-PRODUCTION-CONSUMER-PA-DECISION-2026-10-30-01`, clause 1(c)).
 *
 * WHAT THIS SUITE IS, AND WHAT IT IS NOT
 *   It is the executed evidence that the shipped consumer added by `O5-A`
 *   refuses. It drives the REAL components — `createBrokerImportConsumer`,
 *   `submitBrokerImport`, `DurablePortfolioStorePort`, `persistBrokerImport`
 *   and the real `startIpcServer` entrypoint — against a fixture database under
 *   the OS temporary directory. It opens no endpoint of its own beyond the one
 *   the entrypoint binds, and it never opens the authoritative operator store.
 *
 *   It is NOT an admitted write, NOT a Gate 4 qualification result, NOT a
 *   durability claim and NOT evidence for any of `QE-1`…`QE-11`. Gate E W-1(3)
 *   (Gate 4 qualification) and W-1(4) (Gate 5 admission) remain unmet, so the
 *   product write path refuses every import with zero store effect; this suite
 *   proves that the new consumer cannot do otherwise.
 *
 * THE SEVEN THINGS THIS SUITE MEASURES (act clause 5, and the PA's validation list)
 *   1. the consumer is reachable only through the single authorized call site;
 *   2. the refusal is deterministic;
 *   3. the result code is `WRITE_NOT_AUTHORIZED`;
 *   4. `storeEffect` is `'NONE'`;
 *   5. no durable store operation occurs — no row, no transaction, no mutation;
 *   6. the authorization guard and the closed IPC write-operation set are
 *      unchanged, and no environment flag moves either;
 *   7. the excluded surfaces are untouched: the consumer is not an IPC
 *      operation, `dispatch.ts`/`protocol.ts` name nothing that reaches it, and
 *      the module exports exactly the factory and the delegating function.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase, closeDatabase } from '../src/persistence/connection.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS, startIpcServer } from '../src/ipc/entrypoint.js';
import {
  createBrokerImportConsumer,
  submitBrokerImport,
} from '../src/ipc/brokerImportConsumer.js';
import * as consumerModule from '../src/ipc/brokerImportConsumer.js';
import { DurablePortfolioStorePort } from '../src/persistence/durablePortfolioStorePort.js';
import { evaluatePortSaveGuard, type OwnerRef } from '../src/persistence/portfolio_store.js';
import type { BrokerImportHolding, BrokerImportRequest } from '../src/persistence/brokerImportPersistence.js';
import {
  IPC_OPERATIONS,
  IPC_READ_OPERATIONS,
  IPC_RESERVED_OPERATIONS,
  IPC_WRITE_OPERATIONS,
} from '../src/ipc/protocol.js';

const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
const REPO_ROOT = (() => {
  let candidate = resolve(dirname(fileURLToPath(import.meta.url)));
  while (!existsSync(resolve(candidate, 'src/ipc/entrypoint.ts'))) {
    const parent = resolve(candidate, '..');
    if (parent === candidate) throw new Error('Unable to locate IPD repository root');
    candidate = parent;
  }
  return candidate;
})();
const OWNER: OwnerRef = { canonicalOwnerId: 'owner-local', tenantId: 'tenant-local' };
const PORTFOLIO = 'P-BROKER-O5A';

/** The same fully-resolved vector the durability suite uses: an otherwise saveable import. */
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
    contentDigest: 'sha256:o5a-file-a',
    fileName: 'zerodha-holdings-o5a.csv',
    sourceBroker: 'ZERODHA',
    importedAt: '2026-10-30T10:00:00.000Z',
    ...overrides,
  };
}

/** The four statement classes the import transaction could reach. */
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

/** Whole-database snapshot: every table, every row, normalised — a zero-effect proof. */
function databaseSnapshot(db: DatabaseSync): string {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all() as Array<{ name: string }>;
  const state = tables.map(({ name }) => {
    const rows = db.prepare(`SELECT * FROM \"${name.replaceAll('\"', '\"\"')}\"`).all() as Array<Record<string, unknown>>;
    const normalized = rows.map((row) =>
      Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === 'bigint' ? value.toString() : value])),
    );
    normalized.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    return { name, rows: normalized };
  });
  return JSON.stringify(state);
}

function readRepoSource(relative: string): string {
  return readFileSync(resolve(REPO_ROOT, relative), 'utf8');
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

describe('q1 / O5-A durable broker-import consumer', () => {
  let root: string;
  let dbPath: string;
  let db: DatabaseSync;

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'q1-broker-import-consumer-'));
    dbPath = join(root, 'store', 'ipd.db');
  });

  after(() => {
    closeDatabase();
    rmSync(root, { recursive: true, force: true });
  });

  function openFixture(): DatabaseSync {
    db = openDatabase(dbPath);
    ensureMigrations(db, GATE3_MIGRATIONS);
    db.prepare(`INSERT OR IGNORE INTO local_principal_bindings
      (binding_id, principal_label, status, created_at, updated_at, revoked_at)
      VALUES ('binding-o5a', 'test-principal', 'ACTIVE', '2026-10-30T00:00:00.000Z', '2026-10-30T00:00:00.000Z', NULL)`).run();
    db.prepare(`INSERT OR IGNORE INTO local_principal_memberships
      (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at)
      VALUES ('membership-o5a', 'binding-o5a', 'tenant-local', 'owner-local', 'ACTIVE', '2026-10-30T00:00:00.000Z', '2026-10-30T00:00:00.000Z', NULL)`).run();
    return db;
  }

  /* ---------------------------------------------------------------- *
   * 1. The authorized consumer: shipped code, refusing by construction
   * ---------------------------------------------------------------- */

  describe('the shipped consumer', () => {
    it('refuses an otherwise saveable import with WRITE_NOT_AUTHORIZED and zero store effect', () => {
      const store = openFixture();
      const consumer = createBrokerImportConsumer(store);
      const rowsBefore = countRows(store);
      const snapshotBefore = databaseSnapshot(store);

      const outcome = consumer(OWNER, importRequest());

      assert.equal(outcome.ok, false, 'the durable leg may not persist under O5-A');
      assert.equal(outcome.ok === false && outcome.code, 'WRITE_NOT_AUTHORIZED');
      assert.equal(outcome.storeEffect, 'NONE');

      assert.equal(countRows(store), rowsBefore, 'no portfolios/revisions/holdings/contributions row was created, changed or deleted');
      assert.equal(databaseSnapshot(store), snapshotBefore, 'the whole database is byte-identical after the attempted import');
      assert.equal(store.isTransaction, false, 'the refusal happens before a transaction begins');
    });

    it('is deterministic: the same import returns the same refusal every time', () => {
      const store = openFixture();
      const consumer = createBrokerImportConsumer(store);

      const first = consumer(OWNER, importRequest());
      const second = consumer(OWNER, importRequest());
      const third = submitBrokerImport(new DurablePortfolioStorePort(store), OWNER, importRequest());

      assert.deepEqual(second, first, 'refusal is a constant, not a race or a counter');
      assert.deepEqual(third, first, 'the exported delegating function and the factory-bound consumer agree');
      assert.equal(store.isTransaction, false);
    });

    it('refuses before the revision logic runs, even for an import that would be rejected later', () => {
      const store = openFixture();
      const consumer = createBrokerImportConsumer(store);
      const rowsBefore = countRows(store);

      // No portfolio exists at revision 0, so expectedRevision 1 would be a
      // REVISION_CONFLICT if the transaction body were ever entered. The write
      // gate refuses first, so the outcome is the authorization refusal.
      const outcome = consumer(OWNER, importRequest({ expectedRevision: 1 }));

      assert.equal(outcome.ok, false);
      assert.equal(outcome.ok === false && outcome.code, 'WRITE_NOT_AUTHORIZED', 'refusal precedes the transaction body');
      assert.equal(outcome.storeEffect, 'NONE');
      assert.equal(countRows(store), rowsBefore);
      assert.equal(store.isTransaction, false);
    });

    it('cannot be authorized by any environment flag', () => {
      const store = openFixture();
      const consumer = createBrokerImportConsumer(store);
      const snapshotBefore = databaseSnapshot(store);
      const flags: Record<string, string> = {
        IIPS_PORT_SAVE_AUTHORIZED: 'true',
        IIPS_ALLOW_WRITES: '1',
        IIPS_GATE4_QUALIFIED: 'true',
        IIPS_GATE5_ADMITTED: 'true',
        IIPS_W1_3: 'PASS',
        IIPS_W1_4: 'PASS',
        NODE_ENV: 'development',
      };
      const saved = new Map(Object.keys(flags).map((key) => [key, process.env[key]]));
      try {
        for (const [key, value] of Object.entries(flags)) process.env[key] = value;

        assert.equal(evaluatePortSaveGuard().authorized, false, 'the W-1 conjunction is code, not configuration');
        const outcome = consumer(OWNER, importRequest());
        assert.equal(outcome.ok === false && outcome.code, 'WRITE_NOT_AUTHORIZED');
        assert.equal(outcome.storeEffect, 'NONE');
        assert.equal(databaseSnapshot(store), snapshotBefore);
      } finally {
        for (const [key, value] of saved) {
          if (value === undefined) delete process.env[key];
          else process.env[key] = value;
        }
      }
    });
  });

  /* ---------------------------------------------------------------- *
   * 2. The boundary: one surface, one call site, nothing excluded moves
   * ---------------------------------------------------------------- */

  describe('the authorization boundary', () => {
    it('exports exactly the factory and the delegating function — no route, no capability', () => {
      assert.deepEqual(
        Object.keys(consumerModule).sort(),
        ['createBrokerImportConsumer', 'submitBrokerImport'],
        'the module surface is the two authorized symbols and nothing else',
      );
      assert.equal(typeof consumerModule.createBrokerImportConsumer, 'function');
      assert.equal(typeof consumerModule.submitBrokerImport, 'function');
    });

    it('constructs the write-gate port and never the bare store that would step around it', () => {
      const source = stripComments(readRepoSource('src/ipc/brokerImportConsumer.ts'));
      assert.ok(/new\s+DurablePortfolioStorePort\(/.test(source), 'the consumer must bind the write-gate port');
      assert.ok(
        !/new\s+DurablePortfolioStore\s*\(/.test(source),
        'constructing DurablePortfolioStore directly would bypass the W-1 boundary',
      );
      assert.ok(/persistBrokerImport\(/.test(source), 'the consumer must delegate to the durable leg');
    });

    it('keeps the guard hard-false and the closed IPC operation set unchanged', () => {
      const guard = evaluatePortSaveGuard();
      assert.equal(guard.authorized, false);
      assert.deepEqual(guard.reasons, [
        'W-1(3): Gate 4 qualification not accepted',
        'W-1(4): Gate 5 admission not accepted',
      ]);

      assert.deepEqual([...IPC_READ_OPERATIONS].sort(), ['portfolio.get', 'portfolio.list', 'portfolio.revisions']);
      assert.deepEqual(
        [...IPC_WRITE_OPERATIONS].sort(),
        ['portfolio.create', 'portfolio.delete', 'portfolio.reset', 'portfolio.save'],
      );
      assert.equal(IPC_OPERATIONS.length, 7, 'no new operation was added');
      assert.deepEqual([...IPC_RESERVED_OPERATIONS], ['portfolio.analytics']);
      assert.ok(!(IPC_OPERATIONS as readonly string[]).includes('portfolio.analytics'));

      const storeSource = stripComments(readRepoSource('src/persistence/portfolio_store.ts'));
      assert.ok(/authorized:\s*false/.test(storeSource), 'the guard is still the literal authorized:false');
      assert.ok(storeSource.includes('W-1(3): Gate 4 qualification not accepted'));
      assert.ok(storeSource.includes('W-1(4): Gate 5 admission not accepted'));

      const protocolSource = stripComments(readRepoSource('src/ipc/protocol.ts'));
      for (const op of ['portfolio.create', 'portfolio.save', 'portfolio.reset', 'portfolio.delete']) {
        assert.ok(protocolSource.includes(`'${op}'`), `contract v1 write set changed: ${op} disappeared`);
      }
      assert.ok(protocolSource.includes('IPC_REFUSED_WIRE_KEYS'), 'the C7 caller-authority refusal list changed');
    });

    it('is unreachable from the IPC dispatch path — no operation, route or caller change', () => {
      const dispatchSource = stripComments(readRepoSource('src/ipc/dispatch.ts'));
      for (const token of ['brokerImportConsumer', 'createBrokerImportConsumer', 'submitBrokerImport', 'persistBrokerImport']) {
        assert.ok(!dispatchSource.includes(token), `dispatch.ts must not reach the consumer: ${token}`);
      }
      // The refusal branch is still present and still precedes dispatch.
      const gateIndex = dispatchSource.indexOf('IPC_WRITE_OPERATIONS as readonly string[]');
      assert.ok(gateIndex >= 0, 'the write-set gate disappeared from the dispatch path');
      const gateBlock = dispatchSource.slice(gateIndex, gateIndex + 400);
      assert.ok(gateBlock.includes("'WRITE_NOT_AUTHORIZED'"), 'the write set is no longer refused');
      assert.ok(gateBlock.indexOf("'WRITE_NOT_AUTHORIZED'") < gateBlock.indexOf('switch (envelope.op)'), 'the refusal must precede operation dispatch');

      const entrypointSource = stripComments(readRepoSource('src/ipc/entrypoint.ts'));
      const callSites = entrypointSource.split('createBrokerImportConsumer(').length - 1;
      assert.equal(callSites, 1, 'exactly one authorized call site');
      assert.ok(!/user-portfolios?|\bexpress\b|\bhttp\.createServer\b/.test(entrypointSource), 'no route or HTTP surface was introduced');
    });
  });

  /* ---------------------------------------------------------------- *
   * 3. The real entrypoint: the consumer exists in the shipped process
   * ---------------------------------------------------------------- */

  describe('the shipped entrypoint', () => {
    it('constructs the consumer once at startup and it refuses there too', async () => {
      const store = openFixture();
      const rowsBefore = countRows(store);
      const snapshotBefore = databaseSnapshot(store);

      const outcome = await startIpcServer({
        env: {
          IIPS_G2_IPC_ENDPOINT: `iips-q1o5a-${process.pid}`,
          IIPS_G3_LOCAL_STATE_DIR: join(root, 'state'),
          IIPS_G3_DATABASE_PATH: dbPath,
        } as NodeJS.ProcessEnv,
        platform: HOST_PLATFORM,
      });

      assert.equal(outcome.ok, true, outcome.error);
      assert.ok(outcome.handle, 'the entrypoint bound its endpoint');
      assert.equal(typeof outcome.brokerImportConsumer, 'function', 'the shipped process exposes the consumer it constructed');

      try {
        const refused = outcome.brokerImportConsumer!(OWNER, importRequest());
        assert.equal(refused.ok, false);
        assert.equal(refused.ok === false && refused.code, 'WRITE_NOT_AUTHORIZED');
        assert.equal(refused.storeEffect, 'NONE');
        assert.equal(countRows(store), rowsBefore);
        assert.equal(databaseSnapshot(store), snapshotBefore);
        assert.equal(store.isTransaction, false);
      } finally {
        await outcome.handle!.stop();
      }
    });
  });
});
