/**
 * Gate 3 T-H — C7/OC-7 caller-authority refusal, host-adaptive.
 *
 * Every certified caller-identity/authority wire key is refused at any depth
 * (top level, payload, nested options) before any store access: zero bytes,
 * connection close and a bounded diagnostic-sink record. The closed envelope
 * grammar and one valid control frame bound the data-driven refusal matrix.
 */
import { describe, it, before, after, beforeEach } from 'node:test';
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
import {
  diagnosticSink,
  IPC_REFUSED_WIRE_KEYS,
  IPC_RESERVED_OPERATIONS,
} from '../src/ipc/protocol.js';

const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
const ENDPOINT_NAME = `iips-g3-authority-${process.pid}`;
const TABLES = [
  'portfolios', 'portfolio_revisions', 'portfolio_holdings', 'portfolio_contributions',
  'audit_events', 'local_principal_bindings', 'local_principal_memberships', '_migration_ledger',
];

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

describe('g3 / T-H caller authority (C7) refusal matrix', () => {
  let root: string;
  let db: DatabaseSync;
  let handle: IpcHandle;
  let endpointPath: string;

  function rowCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const table of TABLES) {
      const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number | bigint };
      counts[table] = Number(row.n);
    }
    return counts;
  }

  before(async () => {
    root = mkdtempSync(join(tmpdir(), 'g3-authority-'));
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
  });

  after(async () => {
    await handle.stop();
    closeDatabase();
    rmSync(root, { recursive: true, force: true });
  });

  beforeEach(() => {
    diagnosticSink.drain();
  });

  for (const key of IPC_REFUSED_WIRE_KEYS) {
    it(`refuses top-level caller authority key: ${key}`, async () => {
      const response = await call(endpointPath, { v: 1, op: 'portfolio.list', [key]: 'spoofed' });
      assert.equal(response.byteLength, 0);
      assert.equal(diagnosticSink.peek().at(-1)?.reason, 'CALLER_SUPPLIED_AUTHORITY');
    });
  }

  for (const key of IPC_REFUSED_WIRE_KEYS) {
    it(`refuses caller authority key nested in payload: ${key}`, async () => {
      const response = await call(endpointPath, {
        v: 1,
        op: 'portfolio.list',
        payload: { [key]: 'spoofed' },
      });
      assert.equal(response.byteLength, 0);
      assert.equal(diagnosticSink.peek().at(-1)?.reason, 'CALLER_SUPPLIED_AUTHORITY');
    });
  }

  for (const key of IPC_REFUSED_WIRE_KEYS) {
    it(`refuses caller authority key nested in payload.options: ${key}`, async () => {
      const response = await call(endpointPath, {
        v: 1,
        op: 'portfolio.list',
        payload: { options: { [key]: 'spoofed' } },
      });
      assert.equal(response.byteLength, 0);
      assert.equal(diagnosticSink.peek().at(-1)?.reason, 'CALLER_SUPPLIED_AUTHORITY');
    });
  }

  it('the full refusal matrix creates no rows and a clean control frame still succeeds', async () => {
    const counts = rowCounts();
    const response = await call(endpointPath, {
      v: 1,
      op: 'portfolio.list',
      payload: { filter: 'open' },
      requestId: 'control-1',
    });
    assert.ok(response.byteLength > 4);
    const declared = response.readUInt32BE(0);
    assert.equal(declared, response.byteLength - 4);
    const body = JSON.parse(response.subarray(4).toString('utf8')) as Record<string, unknown>;
    assert.equal(body.ok, true);
    assert.equal(body.requestId, 'control-1');
    assert.deepEqual(rowCounts(), counts, 'refusals and reads never mutate the store');
    assert.equal(IPC_RESERVED_OPERATIONS.includes('portfolio.analytics'), true);
  });
});
