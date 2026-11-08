/**
 * Local personal-use path — end-to-end durability over the real IPC socket.
 *
 * Exercises the explicitly authorized IIPS_LOCAL_PERSONAL_USE=1 path for this
 * local single-user, non-production application: create → read-after-restart →
 * update → idempotent re-save → weight recomputation → delete → audit chain.
 * Also proves the un-flagged behavior is the historical zero-effect refusal,
 * ownership/binding fail-closed behavior is preserved, invalid payloads roll
 * back cleanly, and caller-identity keys are still zero-byte refused.
 *
 * The Windows smoke test on the designated host is separate (Direct P1) and is
 * not repeated here; this test is host-adaptive on POSIX/Windows via UDS.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createConnection } from 'node:net';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import {
  listenIpc,
  resolveEndpointTarget,
  settlementPolicyForEndpoint,
  type IpcHandle,
} from '../src/ipc/endpoint.js';
import { createConnectionHandler } from '../src/ipc/dispatch.js';
import { verifyAuditChain } from '../src/persistence/audit.js';
import {
  mapManualRequest,
  mapManualHolding,
} from '../src/persistence/manualPersonalPortfolio.js';
import { LOCAL_PERSONAL_USE_SETTING } from '../src/ipc/localPersonalUse.js';

const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
const ENDPOINT_NAME = `iips-personal-${process.pid}`;
const OWNER = 'personal-owner';
const TENANT = 'personal-tenant';

function frameFor(value: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(value), 'utf8');
  const prefix = Buffer.allocUnsafe(4);
  prefix.writeUInt32BE(body.byteLength, 0);
  return Buffer.concat([prefix, body]);
}

function call(endpointPath: string, envelope: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ path: endpointPath });
    const chunks: Buffer[] = [];
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.on('error', reject);
    socket.on('close', () => {
      const raw = Buffer.concat(chunks);
      if (raw.byteLength < 5) {
        resolve({ __zeroBytes: true });
        return;
      }
      const length = raw.readUInt32BE(0);
      resolve(JSON.parse(raw.subarray(4, 4 + length).toString('utf8')));
    });
    socket.on('connect', () => socket.write(frameFor(envelope), () => socket.end()));
  });
}

/**
 * Raw node:sqlite handle. The process-global openDatabase/closeDatabase pair is
 * deliberately NOT used: this test runs two live servers against one file (and a
 * restart cycle), which the singleton connection cannot express.
 */
function openRaw(path: string): DatabaseSync {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

function seedBinding(db: DatabaseSync): void {
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('b-personal', 'personal-operator', 'ACTIVE', ?, ?, NULL)",
  ).run(now, now);
  db.prepare(
    "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('m-personal', 'b-personal', ?, ?, 'ACTIVE', ?, ?, NULL)",
  ).run(TENANT, OWNER, now, now);
}

const TWO_HOLDINGS = [
  { symbol: 'RELIANCE', quantity: 10, averageBuyPrice: 2400, currentPrice: 2500, active: true },
  { symbol: 'INFY', quantity: 25, averageBuyPrice: 1500, currentPrice: 1400, active: true },
];

describe('personal-use mapper', () => {
  it('computes weights to sum exactly 100 and sets manual sentinel identity fields', () => {
    const request = mapManualRequest(TWO_HOLDINGS);
    const weightSum = request.holdings.reduce((sum, h) => sum + h.weightPercentage, 0);
    assert.equal(weightSum, 100);
    for (const holding of request.holdings) {
      assert.equal(holding.companyId, `MANUAL:${holding.symbol}`);
      assert.equal(holding.identityStatus, 'UNRESOLVED');
      assert.equal(holding.resolutionDisposition, 'MANUAL_PERSONAL_ENTRY');
      assert.equal(holding.sourceBroker, 'manual-personal');
      assert.ok(/^[0-9a-f]{64}$/.test(holding.lineageDigest));
      assert.equal(holding.marketValue, Math.round(holding.quantity * holding.currentPrice * 100) / 100);
    }
    assert.ok(/^[0-9a-f]{64}$/.test(request.provenanceDigest));
  });

  it('refuses duplicate symbols, non-positive quantity and malformed entries', () => {
    assert.throws(() => mapManualRequest([TWO_HOLDINGS[0], { ...TWO_HOLDINGS[0], symbol: 'RELIANCE' }]), /duplicate/i);
    assert.throws(() => mapManualRequest([{ ...TWO_HOLDINGS[0], quantity: 0 }]), /quantity/i);
    assert.throws(() => mapManualRequest([{ symbol: ' ' }]), /symbol|string/i);
    assert.throws(() => mapManualRequest('not-an-array'), /array/i);
    assert.throws(() => mapManualRequest([]), /at least one/i);
  });

  it('normalizes symbols to uppercase', () => {
    const holding = mapManualHolding({ ...TWO_HOLDINGS[0], symbol: 'reliance' }, 0);
    assert.equal(holding.symbol, 'RELIANCE');
  });
});

describe('personal-use IPC path (host-adaptive UDS)', () => {
  let root: string;
  let dbPath: string;
  let refusedHandle: IpcHandle;
  let personalHandle: IpcHandle;
  let refusedPath: string;
  let personalPath: string;
  let db1: DatabaseSync;
  let db2: DatabaseSync | undefined; // closed and replaced by db3 in the restart test
  let db3: DatabaseSync | undefined;

  before(async () => {
    root = mkdtempSync(join(tmpdir(), 'personal-path-'));
    dbPath = join(root, 'store', 'ipd.db');

    // Refusal baseline server (no personal-use flag).
    db1 = openRaw(dbPath);
    ensureMigrations(db1, GATE3_MIGRATIONS);
    seedBinding(db1);
    const target1 = resolveEndpointTarget(
      { IIPS_G2_IPC_ENDPOINT: `${ENDPOINT_NAME}-off`, IIPS_G3_LOCAL_STATE_DIR: join(root, 'state-off') },
      HOST_PLATFORM,
    );
    refusedPath = target1.path;
    refusedHandle = await listenIpc(
      target1,
      createConnectionHandler(db1, { env: { ...process.env, [LOCAL_PERSONAL_USE_SETTING]: '0' } }),
      { platform: HOST_PLATFORM },
    );
    // Personal-use server (flag set).
    db2 = openRaw(dbPath);
    const target2 = resolveEndpointTarget(
      { IIPS_G2_IPC_ENDPOINT: `${ENDPOINT_NAME}-on`, IIPS_G3_LOCAL_STATE_DIR: join(root, 'state-on') },
      HOST_PLATFORM,
    );
    personalPath = target2.path;
    personalHandle = await listenIpc(
      target2,
      createConnectionHandler(db2, {
        env: { ...process.env, [LOCAL_PERSONAL_USE_SETTING]: '1' },
      }),
      { platform: HOST_PLATFORM },
    );
  });

  after(async () => {
    await refusedHandle.stop();
    await personalHandle.stop();
    db1.close();
    db2?.close();
    db3?.close();
    rmSync(root, { recursive: true, force: true });
  });

  const envelope = (op: string, payload?: unknown) => ({ v: 1 as const, op, payload, requestId: `req-${op}-${Math.random().toString(36).slice(2, 8)}` });

  it('without the flag, every write is refused with zero store effect', async () => {
    const out = (await call(refusedPath, envelope('portfolio.create', { holdings: TWO_HOLDINGS }))) as { outcome?: string; result?: unknown };
    assert.equal(out.outcome, 'WRITE_NOT_AUTHORIZED');
    const list = (await call(refusedPath, envelope('portfolio.list'))) as { result?: unknown[] };
    assert.deepEqual(list.result, []);
  });

  it('creates a portfolio durably, then reads it back', async () => {
    const out = (await call(
      personalPath,
      envelope('portfolio.create', { portfolioId: 'personal-main', portfolioName: 'My portfolio', holdings: TWO_HOLDINGS }),
    )) as { result?: { revision: number; isDuplicate: boolean; disposition: string; portfolio: { holdings: unknown[]; revision: number; portfolioName: string; contributions: unknown[] } } };
    assert.equal(out.result?.disposition, 'SAVED_NEW_BATCH');
    assert.equal(out.result?.revision, 1);
    assert.equal(out.result?.portfolio.portfolioName, 'My portfolio');
    assert.equal(out.result?.portfolio.holdings.length, 2);
    // The G2 projection scope is documented: the contribution ledger is not on the wire.
    assert.deepEqual(out.result?.portfolio.contributions, []);
  });

  it('persists across an application restart (close + reopen the database)', async () => {
    // Simulate a full restart: stop the server, close the DB, reopen a fresh
    // connection through the documented migrations and bind a fresh handler.
    await personalHandle.stop();
    db2?.close();
    db2 = undefined;
    db3 = openRaw(dbPath);
    ensureMigrations(db3, GATE3_MIGRATIONS);
    const target = resolveEndpointTarget(
      { IIPS_G2_IPC_ENDPOINT: `${ENDPOINT_NAME}-restarted`, IIPS_G3_LOCAL_STATE_DIR: join(root, 'state-restart') },
      HOST_PLATFORM,
    );
    personalPath = target.path;
    personalHandle = await listenIpc(
      target,
      createConnectionHandler(db3, {
        env: { ...process.env, [LOCAL_PERSONAL_USE_SETTING]: '1' },
      }),
      { platform: HOST_PLATFORM },
    );
    const out = (await call(personalPath, envelope('portfolio.get', { portfolioId: 'personal-main' }))) as {
      result?: { revision: number; portfolioName: string; holdings: Array<{ symbol: string; quantity: number; companyId: string }> };
    };
    assert.equal(out.result?.portfolioName, 'My portfolio');
    assert.equal(out.result?.revision, 1);
    const symbols = out.result?.holdings.map((h) => h.symbol).sort();
    assert.deepEqual(symbols, ['INFY', 'RELIANCE']);
    for (const holding of out.result?.holdings ?? []) {
      assert.equal(holding.companyId, `MANUAL:${holding.symbol}`);
    }
  });

  it('updates a holding and the change persists; weight sum stays exact', async () => {
    const current = (await call(personalPath, envelope('portfolio.get', { portfolioId: 'personal-main' }))) as {
      result: { revision: number; holdings: Array<{ symbol: string; quantity: number; currentPrice: number }> };
    };
    const updated = TWO_HOLDINGS.map((h) => (h.symbol === 'RELIANCE' ? { ...h, quantity: 20 } : h));
    const out = (await call(
      personalPath,
      envelope('portfolio.save', { portfolioId: 'personal-main', expectedRevision: current.result.revision, holdings: updated }),
    )) as { result?: { revision: number; isDuplicate: boolean; portfolio: { weightSumPercentage: number; holdings: Array<{ symbol: string; quantity: number }> } } };
    assert.equal(out.result?.revision, 2);
    assert.equal(out.result?.isDuplicate, false);
    assert.equal(out.result?.portfolio.weightSumPercentage, 100);
    const reliance = out.result?.portfolio.holdings.find((h) => h.symbol === 'RELIANCE');
    assert.equal(reliance?.quantity, 20);
  });

  it('re-saving identical content is an idempotent no-op (no duplicate writes)', async () => {
    const updated = TWO_HOLDINGS.map((h) => (h.symbol === 'RELIANCE' ? { ...h, quantity: 20 } : h));
    const out = (await call(
      personalPath,
      envelope('portfolio.save', { portfolioId: 'personal-main', expectedRevision: 2, holdings: updated, options: { mode: 'MERGE' } }),
    )) as { result?: { revision: number; isDuplicate: boolean; disposition: string } };
    assert.equal(out.result?.revision, 2);
    assert.equal(out.result?.isDuplicate, true);
    assert.equal(out.result?.disposition, 'ALREADY_IMPORTED_NO_OP');
  });

  it('removes a holding and the removal persists', async () => {
    const remaining = TWO_HOLDINGS.filter((h) => h.symbol !== 'INFY').map((h) =>
      h.symbol === 'RELIANCE' ? { ...h, quantity: 20 } : h,
    );
    const out = (await call(
      personalPath,
      envelope('portfolio.save', { portfolioId: 'personal-main', expectedRevision: 2, holdings: remaining }),
    )) as { result?: { revision: number; portfolio: { holdings: Array<{ symbol: string }> } } };
    assert.equal(out.result?.revision, 3);
    assert.deepEqual(out.result?.portfolio.holdings.map((h) => h.symbol), ['RELIANCE']);
  });

  it('rejects invalid payloads with zero partial state (rollback)', async () => {
    const before = (await call(personalPath, envelope('portfolio.get', { portfolioId: 'personal-main' }))) as { result: { revision: number } };
    const bad = await call(
      personalPath,
      envelope('portfolio.save', {
        portfolioId: 'personal-main',
        expectedRevision: before.result.revision,
        holdings: [{ symbol: 'BROKEN', quantity: -5, averageBuyPrice: 10, currentPrice: 10 }],
      }),
    ) as { outcome?: string };
    assert.equal(bad.outcome, 'INVALID_REQUEST');
    const afterCall = (await call(personalPath, envelope('portfolio.get', { portfolioId: 'personal-main' }))) as { result: { revision: number; holdings: Array<{ symbol: string }> } };
    assert.equal(afterCall.result.revision, before.result.revision);
    assert.deepEqual(afterCall.result.holdings.map((h) => h.symbol), ['RELIANCE']);
  });

  it('refuses a stale expectedRevision with REVISION_CONFLICT', async () => {
    const out = (await call(
      personalPath,
      envelope('portfolio.save', {
        portfolioId: 'personal-main',
        expectedRevision: 1,
        holdings: TWO_HOLDINGS,
      }),
    )) as { outcome?: string };
    assert.equal(out.outcome, 'REVISION_CONFLICT');
  });

  it('foreign/unknown portfolio identifiers are indistinguishable (RESOURCE_UNAVAILABLE)', async () => {
    const out = (await call(personalPath, envelope('portfolio.get', { portfolioId: 'no-such-portfolio' }))) as { outcome?: string };
    assert.equal(out.outcome, 'RESOURCE_UNAVAILABLE');
  });

  it('caller-supplied identity keys are still zero-byte refused (Class P)', async () => {
    const out = (await call(
      personalPath,
      envelope('portfolio.save', { portfolioId: 'personal-main', expectedRevision: 3, holdings: [{ symbol: 'X', quantity: 1, averageBuyPrice: 1, currentPrice: 1, companyId: 'EVIL' }] }),
    )) as { __zeroBytes?: boolean; outcome?: string };
    assert.equal(out.__zeroBytes, true);
  });

  it('revision history exposes the audit trail; audit chain verifies', async () => {
    const history = (await call(personalPath, envelope('portfolio.revisions', { portfolioId: 'personal-main' }))) as {
      result?: Array<{ revision: number; operation: string }>;
    };
    assert.deepEqual(history.result?.map((r) => r.operation), ['INITIAL', 'MERGE', 'MERGE']);
    const auditHandle = db3 ?? db2;
    assert.ok(auditHandle);
    assert.equal(verifyAuditChain(auditHandle), true);
  });

  it('deletes the portfolio; a subsequent read is indistinguishable from a foreign one', async () => {
    const out = (await call(
      personalPath,
      envelope('portfolio.delete', { portfolioId: 'personal-main', expectedRevision: 3 }),
    )) as { result?: { portfolioId: string; deletedAt: string } };
    assert.equal(out.result?.portfolioId, 'personal-main');
    assert.ok(typeof out.result?.deletedAt === 'string' && out.result.deletedAt.length > 0);
    const afterDelete = (await call(personalPath, envelope('portfolio.get', { portfolioId: 'personal-main' }))) as { outcome?: string };
    assert.equal(afterDelete.outcome, 'RESOURCE_UNAVAILABLE');
  });
});
