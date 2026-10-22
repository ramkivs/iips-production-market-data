/**
 * Q1 — IPC read-path conformance to accepted contract v1 §6.
 *
 * The effective Gate 3 implementation-authority act fixes the wire property
 * names by reference to accepted contract v1 and requires them to be
 * implemented exactly:
 *
 *   "`PortfolioSummary` = `portfolioId`, `portfolioName`, `revision`,
 *    `holdingsCount`, `totalMarketValue`, `lastUpdated`; `PortfolioDetail` adds
 *    `holdings`, `contributions`, `weightSumPercentage`, `provenanceDigest`,
 *    `durability`, `durable`; `RevisionEntry` = `revision`, `operation`
 *    (`INITIAL|MERGE|REPLACE|RESET|DELETE`), `committedAt`, `contentDigest?`"
 *
 * The Gate 3 implementation shipped a wrapper around every read result
 * (`{ portfolios: [...] }`, `{ portfolio: {...} }`, `{ revisions: [...] }`) and
 * named the revision timestamp `createdAt`. Both are wire-shape departures
 * from the accepted contract, and the frozen IRR consumer adapter — which is
 * written against contract v1 — refuses a result of either shape.
 *
 * This suite pins the corrected wire shape end to end over the REAL IPC
 * endpoint. It is a conformance fixture:
 *
 *   - it opens only a fixture store under the OS temporary directory;
 *   - it writes the binding rows and the portfolio directly, as an executed
 *     Gate A-prime act and an admitted store would leave them (Gate A-prime is
 *     APPROVED and NOT EXECUTED; the write path is refused by Gate E W-1);
 *   - it asserts shape only. It claims no capability, no qualification and no
 *     admission, and it asserts no durability claim of any kind.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createConnection } from 'node:net';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase, closeDatabase } from '../src/persistence/connection.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS, startIpcServer } from '../src/ipc/entrypoint.js';
import {
  DurablePortfolioStore,
  type HoldingInput,
  type OwnerRef,
} from '../src/persistence/portfolio_store.js';

const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
const OWNER: OwnerRef = { canonicalOwnerId: 'owner-contract', tenantId: 'tenant-contract' };

const SUMMARY_KEYS = [
  'holdingsCount',
  'lastUpdated',
  'portfolioId',
  'portfolioName',
  'revision',
  'totalMarketValue',
];

const DETAIL_KEYS = [
  'contributions',
  'holdings',
  'holdingsCount',
  'lastUpdated',
  'portfolioId',
  'portfolioName',
  'provenanceDigest',
  'revision',
  'totalMarketValue',
  'weightSumPercentage',
];

function holding(symbol: string, weight: number): HoldingInput {
  return {
    symbol,
    companyId: `C-${symbol}`,
    quantity: 10,
    averageBuyPrice: 100,
    currentPrice: 110,
    marketValue: 1100,
    weightPercentage: weight,
    active: true,
    sourceBroker: 'GENERIC',
    lineageDigest: `lineage-${symbol}`,
    identityStatus: 'RESOLVED',
    resolutionDisposition: 'CANONICAL_P04',
  };
}

function frameFor(value: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8');
  const prefix = Buffer.allocUnsafe(4);
  prefix.writeUInt32BE(body.byteLength, 0);
  return Buffer.concat([prefix, body]);
}

function call(endpointPath: string, envelope: unknown): Promise<Buffer> {
  return new Promise((resolvePromise) => {
    const socket = createConnection({ path: endpointPath });
    const chunks: Buffer[] = [];
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.on('error', () => resolvePromise(Buffer.concat(chunks)));
    socket.on('close', () => resolvePromise(Buffer.concat(chunks)));
    socket.on('connect', () => socket.write(frameFor(envelope), () => socket.end()));
  });
}

function parseResult(buffer: Buffer): unknown {
  const declared = buffer.readUInt32BE(0);
  const frame = JSON.parse(buffer.subarray(4, 4 + declared).toString('utf8')) as {
    ok: boolean;
    result?: unknown;
    outcome?: string;
  };
  assert.equal(frame.ok, true, `expected a success frame, got ${String(frame.outcome)}`);
  return frame.result;
}

function keysOf(value: unknown): string[] {
  assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value));
  return Object.keys(value as Record<string, unknown>).sort();
}

describe('q1 / IPC read path conforms to accepted contract v1 §6', () => {
  let root: string;
  let db: DatabaseSync;
  let databasePath: string;

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'q1-contract-'));
    databasePath = join(root, 'store', 'ipd.db');
    db = openDatabase(databasePath);
    ensureMigrations(db, GATE3_MIGRATIONS);

    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('b-contract', 'operator', 'ACTIVE', ?, ?, NULL)",
    ).run(now, now);
    db.prepare(
      "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('m-contract', 'b-contract', ?, ?, 'ACTIVE', ?, ?, NULL)",
    ).run(OWNER.tenantId, OWNER.canonicalOwnerId, now, now);

    // A portfolio to read back. The store's own write path is used directly
    // because the Gate E W-1 gate refuses every write over the endpoint while
    // the gates are unmet; this fixture is not an admitted write.
    new DurablePortfolioStore(db).create(OWNER, 'P-CONTRACT', {
      name: 'Contract fixture',
      holdings: [holding('AAPL', 60), holding('MSFT', 40)],
      provenanceDigest: 'prov-contract',
      contentDigest: 'digest-contract',
    });
  });

  after(() => {
    closeDatabase();
    rmSync(root, { recursive: true, force: true });
  });

  it('portfolio.list returns the PortfolioSummary array itself', async () => {
    const outcome = await startIpcServer({
      env: {
        IIPS_G2_IPC_ENDPOINT: `iips-q1-contract-list-${process.pid}`,
        IIPS_G3_LOCAL_STATE_DIR: join(root, 'state-list'),
        IIPS_G3_DATABASE_PATH: databasePath,
      } as NodeJS.ProcessEnv,
      platform: HOST_PLATFORM,
    });
    assert.equal(outcome.ok, true, outcome.error);

    try {
      const result = parseResult(
        await call(outcome.target!.path, { v: 1, op: 'portfolio.list', requestId: 'q1c-1' }),
      );
      assert.ok(Array.isArray(result), 'the list result is the array itself, not a wrapper');
      assert.equal((result as unknown[]).length, 1);
      const [row] = result as Array<Record<string, unknown>>;
      assert.deepEqual(keysOf(row), SUMMARY_KEYS);
      assert.equal(row.portfolioId, 'P-CONTRACT');
      assert.equal(row.portfolioName, 'Contract fixture');
      assert.equal(row.revision, 1);
      assert.equal(row.holdingsCount, 2);
      assert.equal(typeof row.lastUpdated, 'string');
      assert.equal(typeof row.totalMarketValue, 'number');
    } finally {
      await outcome.handle!.stop();
    }
  });

  it('portfolio.get returns the PortfolioDetail object itself, with no durability claim', async () => {
    const outcome = await startIpcServer({
      env: {
        IIPS_G2_IPC_ENDPOINT: `iips-q1-contract-get-${process.pid}`,
        IIPS_G3_LOCAL_STATE_DIR: join(root, 'state-get'),
        IIPS_G3_DATABASE_PATH: databasePath,
      } as NodeJS.ProcessEnv,
      platform: HOST_PLATFORM,
    });
    assert.equal(outcome.ok, true, outcome.error);

    try {
      const result = parseResult(
        await call(outcome.target!.path, {
          v: 1,
          op: 'portfolio.get',
          payload: { portfolioId: 'P-CONTRACT' },
          requestId: 'q1c-2',
        }),
      );
      assert.ok(!Array.isArray(result), 'the get result is the object itself, not a wrapper');
      const detail = result as Record<string, unknown>;
      assert.deepEqual(keysOf(detail), DETAIL_KEYS);
      assert.equal(detail.portfolioId, 'P-CONTRACT');
      assert.ok(Array.isArray(detail.holdings));
      assert.equal((detail.holdings as unknown[]).length, 2);
      assert.ok(Array.isArray(detail.contributions));
      assert.equal((detail.contributions as unknown[]).length, 1);
      assert.equal(typeof detail.weightSumPercentage, 'number');
      assert.equal(typeof detail.provenanceDigest, 'string');
      // The standing boundary forbids a `durable:true` claim before the Gate 4
      // result-acceptance act, so contract v1's `durability`/`durable` fields
      // are deliberately absent rather than fabricated. Asserted so the
      // omission stays visible and cannot be mistaken for an oversight.
      assert.ok(!('durable' in detail), 'no `durable` field is emitted');
      assert.ok(!('durability' in detail), 'no `durability` field is emitted');
    } finally {
      await outcome.handle!.stop();
    }
  });

  it('portfolio.revisions returns the RevisionEntry array itself, keyed `committedAt`', async () => {
    const outcome = await startIpcServer({
      env: {
        IIPS_G2_IPC_ENDPOINT: `iips-q1-contract-rev-${process.pid}`,
        IIPS_G3_LOCAL_STATE_DIR: join(root, 'state-rev'),
        IIPS_G3_DATABASE_PATH: databasePath,
      } as NodeJS.ProcessEnv,
      platform: HOST_PLATFORM,
    });
    assert.equal(outcome.ok, true, outcome.error);

    try {
      const result = parseResult(
        await call(outcome.target!.path, {
          v: 1,
          op: 'portfolio.revisions',
          payload: { portfolioId: 'P-CONTRACT' },
          requestId: 'q1c-3',
        }),
      );
      assert.ok(Array.isArray(result), 'the revisions result is the array itself, not a wrapper');
      assert.equal((result as unknown[]).length, 1);
      const [entry] = result as Array<Record<string, unknown>>;
      assert.equal(entry.revision, 1);
      assert.equal(entry.operation, 'INITIAL');
      assert.equal(typeof entry.committedAt, 'string');
      assert.ok(!('createdAt' in entry), 'the wire property is `committedAt`, not `createdAt`');
    } finally {
      await outcome.handle!.stop();
    }
  });
});
