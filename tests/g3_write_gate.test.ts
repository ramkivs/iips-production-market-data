/**
 * Gate 3 T-G — the disabled-by-default write slice (G3-D3 disposition 3b),
 * host-adaptive.
 *
 * While Gate E W-1(3) (Gate 4 qualification) and W-1(4) (Gate 5 admission) are
 * false, every write operation returns WRITE_NOT_AUTHORIZED with zero database
 * row delta, and no environment variable can enable one — identically over a
 * POSIX socket and a Windows named pipe. The durable domain store still
 * implements the governed semantics behind that gate: revision conflicts,
 * invalid requests, content-hash idempotency (ALREADY_IMPORTED_NO_OP creates no
 * revision) and the immutable 1 -> 2 -> 3 -> 4 revision lifecycle.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createConnection } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDatabase, closeDatabase } from '../src/persistence/connection.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import {
  listenIpc,
  resolveEndpointTarget,
  settlementPolicyForEndpoint,
  type IpcHandle,
} from '../src/ipc/endpoint.js';
import { createConnectionHandler } from '../src/ipc/dispatch.js';
import { resolveActiveBinding } from '../src/persistence/binding.js';
import {
  DurablePortfolioStore,
  InvalidPortfolioRequestError,
  RevisionConflictError,
  ResourceUnavailableError,
  type HoldingInput,
  type OwnerRef,
} from '../src/persistence/portfolio_store.js';

const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
const ENDPOINT_NAME = `iips-g3-write-${process.pid}`;
const TABLES = [
  'portfolios', 'portfolio_revisions', 'portfolio_holdings', 'portfolio_contributions',
  'audit_events', 'local_principal_bindings', 'local_principal_memberships', '_migration_ledger',
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
  return new Promise((resolve) => {
    const socket = createConnection({ path: endpointPath });
    const chunks: Buffer[] = [];
    socket.on('data', (chunk) => chunks.push(chunk));
    socket.on('error', () => resolve(Buffer.concat(chunks)));
    socket.on('close', () => resolve(Buffer.concat(chunks)));
    socket.on('connect', () => socket.write(frameFor(envelope), () => socket.end()));
  });
}

function parseResponse(buffer: Buffer): Record<string, unknown> {
  const declared = buffer.readUInt32BE(0);
  return JSON.parse(buffer.subarray(4, 4 + declared).toString('utf8')) as Record<string, unknown>;
}

describe('g3 / T-G write gate', () => {
  let root: string;
  let db: DatabaseSync;
  let handle: IpcHandle;
  let endpointPath: string;
  let store: DurablePortfolioStore;
  let owner: OwnerRef;

  function rowCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const table of TABLES) {
      const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number | bigint };
      counts[table] = Number(row.n);
    }
    return counts;
  }

  before(async () => {
    root = mkdtempSync(join(tmpdir(), 'g3-write-'));
    db = openDatabase(join(root, 'store', 'ipd.db'));
    ensureMigrations(db, GATE3_MIGRATIONS);
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('b-1', 'operator', 'ACTIVE', ?, ?, NULL)",
    ).run(now, now);
    db.prepare(
      "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('m-1', 'b-1', 'tenant-local', 'owner-local', 'ACTIVE', ?, ?, NULL)",
    ).run(now, now);

    const target = resolveEndpointTarget(
      { IIPS_G2_IPC_ENDPOINT: ENDPOINT_NAME, IIPS_G3_LOCAL_STATE_DIR: join(root, 'state') },
      HOST_PLATFORM,
    );
    endpointPath = target.path;
    handle = await listenIpc(
      target,
      createConnectionHandler(db, { settlement: settlementPolicyForEndpoint(target) }),
      { platform: HOST_PLATFORM },
    );
    store = new DurablePortfolioStore(db);
    owner = { canonicalOwnerId: 'owner-local', tenantId: 'tenant-local' };
  });

  after(async () => {
    await handle.stop();
    closeDatabase();
    rmSync(root, { recursive: true, force: true });
  });

  const writeOps = ['portfolio.create', 'portfolio.save', 'portfolio.reset', 'portfolio.delete'] as const;

  for (const op of writeOps) {
    it(`refuses ${op} over IPC with WRITE_NOT_AUTHORIZED and zero row delta`, async () => {
      const before = rowCounts();
      const response = parseResponse(
        await call(endpointPath, { v: 1, op, payload: { portfolioId: 'P1' }, requestId: `r-${op}` }),
      );
      assert.equal(response.ok, false);
      assert.equal(response.outcome, 'WRITE_NOT_AUTHORIZED');
      assert.deepEqual(rowCounts(), before);
    });
  }

  it('no environment flag combination can enable a write', async () => {
    const before = rowCounts();
    for (const key of ['IIPS_ENABLE_WRITES', 'IIPS_G3_ENABLE_WRITES', 'GATE_E_OVERRIDE', 'NODE_ENV']) {
      process.env[key] = 'true';
    }
    const response = parseResponse(
      await call(endpointPath, { v: 1, op: 'portfolio.save', payload: { portfolioId: 'P1' } }),
    );
    assert.equal(response.ok, false);
    assert.equal(response.outcome, 'WRITE_NOT_AUTHORIZED');
    assert.deepEqual(rowCounts(), before);
    for (const key of ['IIPS_ENABLE_WRITES', 'IIPS_G3_ENABLE_WRITES', 'GATE_E_OVERRIDE', 'NODE_ENV']) {
      delete process.env[key];
    }
  });

  it('the durable store enforces the immutable 1 -> 2 -> 3 -> 4 revision lifecycle', () => {
    const pid = 'P-LIFECYCLE';
    const request = {
      holdings: [holding('AAPL', 60), holding('MSFT', 40)],
      provenanceDigest: 'prov-1',
    };
    const r1 = store.create(owner, pid, request);
    assert.equal(r1, 1);
    const r2 = store.save(owner, pid, { ...request, provenanceDigest: 'prov-2' }, 1);
    assert.equal(r2, 2);
    const r3 = store.save(owner, pid, { ...request, provenanceDigest: 'prov-3' }, 2);
    assert.equal(r3, 3);
    const r4 = store.save(owner, pid, { ...request, provenanceDigest: 'prov-4' }, 3);
    assert.equal(r4, 4);
    assert.throws(
      () => store.save(owner, pid, { ...request, provenanceDigest: 'prov-5' }, 4),
      RevisionConflictError,
    );
    const revisions = store.revisions(owner, pid);
    assert.deepEqual(revisions.map((r) => r.revision), [1, 2, 3, 4]);
    assert.deepEqual([...new Set(revisions.map((r) => r.operation))].sort(), ['INITIAL', 'MERGE']);
  });

  it('a stale expected revision raises RevisionConflictError', () => {
    const pid = 'P-CONFLICT';
    const request = { holdings: [holding('INFY', 100)], provenanceDigest: 'prov-c1' };
    store.create(owner, pid, request);
    store.save(owner, pid, { ...request, provenanceDigest: 'prov-c2' }, 1);
    assert.throws(() => store.save(owner, pid, { ...request, provenanceDigest: 'prov-c3' }, 1), RevisionConflictError);
  });

  it('identical content is an idempotent no-op that creates no new revision', () => {
    const pid = 'P-IDEMPOTENT';
    const request = { holdings: [holding('TCS', 50), holding('WIPRO', 50)], provenanceDigest: 'prov-i1' };
    const r1 = store.create(owner, pid, request);
    const revisionsBefore = store.revisions(owner, pid).length;
    const again = store.save(owner, pid, request, r1);
    assert.equal(again, r1, 'ALREADY_IMPORTED_NO_OP returns the existing revision');
    assert.equal(store.revisions(owner, pid).length, revisionsBefore);
  });

  it('invalid requests are rejected and tombstoned reads collapse to RESOURCE_UNAVAILABLE', () => {
    assert.throws(
      () => store.create(owner, 'P-EMPTY', { holdings: [], provenanceDigest: 'p' }),
      InvalidPortfolioRequestError,
    );
    const pid = 'P-TOMBSTONE';
    const request = { holdings: [holding('HDFC', 100)], provenanceDigest: 'prov-t1' };
    const revision = store.create(owner, pid, request);
    store.delete(owner, pid, revision);
    assert.throws(() => store.get(owner, pid), ResourceUnavailableError);
    // The resolution path itself stays live for other owners.
    assert.equal(resolveActiveBinding(db).canonicalOwnerId, 'owner-local');
  });
});
