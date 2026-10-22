/**
 * Gate 3 T-C — owner-scoped portfolio read isolation, host-adaptive.
 *
 * Missing, foreign-owned and tombstoned portfolios are deliberately
 * indistinguishable on the wire: the same RESOURCE_UNAVAILABLE Class A frame
 * bytes for all three, so existence cannot be probed across owners. Reads are
 * sequential over the single permitted connection, and the reserved
 * portfolio.analytics operation stays outside the closed v1 set.
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
import { DurablePortfolioStore, type HoldingInput, type OwnerRef } from '../src/persistence/portfolio_store.js';

const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
const ENDPOINT_NAME = `iips-g3-isolation-${process.pid}`;

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

function holding(symbol: string): HoldingInput {
  return {
    symbol,
    companyId: `C-${symbol}`,
    quantity: 1,
    averageBuyPrice: 100,
    currentPrice: 100,
    marketValue: 100,
    weightPercentage: 100,
    active: true,
    sourceBroker: 'GENERIC',
    lineageDigest: `lineage-${symbol}`,
    identityStatus: 'RESOLVED',
    resolutionDisposition: 'CANONICAL_P04',
  };
}

describe('g3 / T-C portfolio read isolation', () => {
  let root: string;
  let db: DatabaseSync;
  let handle: IpcHandle;
  let endpointPath: string;
  const local: OwnerRef = { canonicalOwnerId: 'owner-local', tenantId: 'tenant-local' };
  const other: OwnerRef = { canonicalOwnerId: 'owner-other', tenantId: 'tenant-other' };

  before(async () => {
    root = mkdtempSync(join(tmpdir(), 'g3-isolation-'));
    db = openDatabase(join(root, 'store', 'ipd.db'));
    ensureMigrations(db, GATE3_MIGRATIONS);
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('b-1', 'operator', 'ACTIVE', ?, ?, NULL)",
    ).run(now, now);
    db.prepare(
      "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('m-1', 'b-1', 'tenant-local', 'owner-local', 'ACTIVE', ?, ?, NULL)",
    ).run(now, now);

    const store = new DurablePortfolioStore(db);
    const request = { holdings: [holding('AAPL')], provenanceDigest: 'prov-iso' };
    store.create(local, 'P-LOCAL', request);
    store.create(other, 'P-FOREIGN', request);
    const tombRevision = store.create(local, 'P-TOMB', request);
    store.delete(local, 'P-TOMB', tombRevision);

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
  });

  after(async () => {
    await handle.stop();
    closeDatabase();
    rmSync(root, { recursive: true, force: true });
  });

  it('a valid list returns only the resolved owner portfolios', async () => {
    const response = parseResponse(await call(endpointPath, { v: 1, op: 'portfolio.list' }));
    assert.equal(response.ok, true);
    const portfolios = (response.result as Array<{ portfolioId: string }>);
    const ids = portfolios.map((p) => p.portfolioId).sort();
    assert.deepEqual(ids, ['P-LOCAL']);
  });

  it('a missing portfolio returns RESOURCE_UNAVAILABLE', async () => {
    const response = parseResponse(
      await call(endpointPath, { v: 1, op: 'portfolio.get', payload: { portfolioId: 'P-MISSING' } }),
    );
    assert.equal(response.ok, false);
    assert.equal(response.outcome, 'RESOURCE_UNAVAILABLE');
  });

  it('a foreign-owned portfolio is byte-identical to the missing-portfolio response', async () => {
    const missing = await call(endpointPath, {
      v: 1,
      op: 'portfolio.get',
      payload: { portfolioId: 'P-MISSING' },
      requestId: 'same-request-id',
    });
    const foreign = await call(endpointPath, {
      v: 1,
      op: 'portfolio.get',
      payload: { portfolioId: 'P-FOREIGN' },
      requestId: 'same-request-id',
    });
    assert.ok(foreign.equals(missing), 'missing and foreign frames must be byte-identical');
    assert.equal(parseResponse(foreign).outcome, 'RESOURCE_UNAVAILABLE');
  });

  it('a tombstoned portfolio is byte-identical to the missing-portfolio response', async () => {
    const missing = await call(endpointPath, {
      v: 1,
      op: 'portfolio.get',
      payload: { portfolioId: 'P-MISSING' },
      requestId: 'same-request-id',
    });
    const tombstoned = await call(endpointPath, {
      v: 1,
      op: 'portfolio.get',
      payload: { portfolioId: 'P-TOMB' },
      requestId: 'same-request-id',
    });
    assert.ok(tombstoned.equals(missing), 'tombstoned and missing frames must be byte-identical');
  });

  it('the reserved portfolio.analytics operation is refused with zero bytes', async () => {
    const response = await call(endpointPath, { v: 1, op: 'portfolio.analytics' });
    assert.equal(response.byteLength, 0);
  });

  it('sequential requests over separate connections each complete under the capacity cap', async () => {
    const first = await call(endpointPath, { v: 1, op: 'portfolio.list' });
    const second = await call(endpointPath, {
      v: 1,
      op: 'portfolio.revisions',
      payload: { portfolioId: 'P-LOCAL' },
    });
    assert.ok(first.byteLength > 0);
    assert.ok(second.byteLength > 0);
    const revisions = parseResponse(second);
    assert.equal(revisions.ok, true);
    assert.equal((revisions.result as unknown[]).length, 1);
  });
});
