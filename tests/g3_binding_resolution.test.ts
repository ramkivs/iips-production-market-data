/**
 * Gate 3 T-B — per-request local principal binding resolution, host-adaptive.
 *
 * The active owner is resolved afresh on every request: no cache, no
 * process-global owner, so a revocation takes effect on the next connection.
 * Storage-level partial-unique indexes enforce the single-ACTIVE rule, and
 * malformed binding shapes fail closed through the same Class P path.
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
  type IpcHandle,
} from '../src/ipc/endpoint.js';
import { createConnectionHandler } from '../src/ipc/dispatch.js';
import {
  BindingAbsentError,
  BindingInvalidError,
  resolveActiveBinding,
} from '../src/persistence/binding.js';
import { verifyAuditChain } from '../src/persistence/audit.js';

const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
const ENDPOINT_NAME = `iips-g3-binding-${process.pid}`;

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

describe('g3 / T-B binding resolution', () => {
  let root: string;
  let db: DatabaseSync;
  let handle: IpcHandle;
  let endpointPath: string;

  before(async () => {
    root = mkdtempSync(join(tmpdir(), 'g3-binding-'));
    db = openDatabase(join(root, 'store', 'ipd.db'));
    ensureMigrations(db, GATE3_MIGRATIONS);
    const target = resolveEndpointTarget(
      { IIPS_G2_IPC_ENDPOINT: ENDPOINT_NAME, IIPS_G3_LOCAL_STATE_DIR: join(root, 'state') },
      HOST_PLATFORM,
    );
    endpointPath = target.path;
    handle = await listenIpc(
      target,
      createConnectionHandler(db),
      { platform: HOST_PLATFORM },
    );
  });

  after(async () => {
    await handle.stop();
    closeDatabase();
    rmSync(root, { recursive: true, force: true });
  });

  function seedActive(bindingId: string, membershipId: string, owner: string): void {
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES (?, 'operator', 'ACTIVE', ?, ?, NULL)",
    ).run(bindingId, now, now);
    db.prepare(
      "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES (?, ?, 'tenant-local', ?, 'ACTIVE', ?, ?, NULL)",
    ).run(membershipId, bindingId, owner, now, now);
  }

  function revoke(bindingId: string, membershipId: string): void {
    const now = new Date().toISOString();
    db.prepare("UPDATE local_principal_bindings SET status = 'REVOKED', revoked_at = ? WHERE binding_id = ?").run(now, bindingId);
    db.prepare("UPDATE local_principal_memberships SET status = 'REVOKED', revoked_at = ? WHERE membership_id = ?").run(now, membershipId);
  }

  it('resolves the single ACTIVE binding and membership', () => {
    seedActive('b-1', 'm-1', 'owner-local');
    const owner = resolveActiveBinding(db);
    assert.equal(owner.bindingId, 'b-1');
    assert.equal(owner.membershipId, 'm-1');
    assert.equal(owner.canonicalOwnerId, 'owner-local');
    assert.equal(owner.tenantId, 'tenant-local');
  });

  it('the partial-unique index blocks a second ACTIVE binding', () => {
    const now = new Date().toISOString();
    assert.throws(() =>
      db.prepare(
        "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('b-x', 'other', 'ACTIVE', ?, ?, NULL)",
      ).run(now, now),
    );
  });

  it('the partial-unique index blocks a second ACTIVE membership', () => {
    const now = new Date().toISOString();
    assert.throws(() =>
      db.prepare(
        "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('m-x', 'b-1', 't2', 'o2', 'ACTIVE', ?, ?, NULL)",
      ).run(now, now),
    );
  });

  it('an ACTIVE membership attached to a different binding is BindingInvalidError', () => {
    const now = new Date().toISOString();
    // The single-ACTIVE index means the existing membership must leave the
    // ACTIVE set before the orphan can occupy it.
    db.prepare("UPDATE local_principal_memberships SET status = 'REVOKED', revoked_at = ? WHERE membership_id = 'm-1'").run(now);
    db.prepare(
      "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('b-orphan', 'orphan', 'REVOKED', ?, ?, ?)",
    ).run(now, now, now);
    db.prepare(
      "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('m-orphan', 'b-orphan', 't', 'o-orphan', 'ACTIVE', ?, ?, NULL)",
    ).run(now, now);
    assert.throws(() => resolveActiveBinding(db), BindingInvalidError);
    db.prepare("DELETE FROM local_principal_memberships WHERE membership_id = 'm-orphan'").run();
    db.prepare("DELETE FROM local_principal_bindings WHERE binding_id = 'b-orphan'").run();
    db.prepare("UPDATE local_principal_memberships SET status = 'ACTIVE', revoked_at = NULL WHERE membership_id = 'm-1'").run();
  });

  it('revoking the only ACTIVE pair makes direct resolution throw BindingAbsentError', () => {
    revoke('b-1', 'm-1');
    assert.throws(() => resolveActiveBinding(db), BindingAbsentError);
  });

  it('re-resolves per request with no cache: a revocation takes effect on the next request', async () => {
    seedActive('b-2', 'm-2', 'owner-two');
    const envelope = { v: 1, op: 'portfolio.list' };
    const first = await call(endpointPath, envelope);
    assert.ok(first.byteLength > 0, 'the first request on a live binding receives a response');
    const firstBody = JSON.parse(first.subarray(4).toString('utf8')) as Record<string, unknown>;
    assert.equal(firstBody.ok, true);

    revoke('b-2', 'm-2');

    const second = await call(endpointPath, envelope);
    assert.equal(second.byteLength, 0, 'the next request after revocation is a zero-byte Class P refusal');
  });

  it('an absent binding over IPC is zero-byte with no wire reason', async () => {
    const response = await call(endpointPath, { v: 1, op: 'portfolio.list' });
    assert.equal(response.byteLength, 0);
  });

  it('restoring an ACTIVE binding makes the next IPC request succeed again', async () => {
    seedActive('b-3', 'm-3', 'owner-three');
    const response = await call(endpointPath, { v: 1, op: 'portfolio.list' });
    assert.ok(response.byteLength > 0);
    const body = JSON.parse(response.subarray(4).toString('utf8')) as Record<string, unknown>;
    assert.equal(body.ok, true);
  });

  it('multiple ACTIVE bindings after a restore still fail closed at the storage layer', () => {
    const now = new Date().toISOString();
    assert.throws(() =>
      db.prepare(
        "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('b-4', 'again', 'ACTIVE', ?, ?, NULL)",
      ).run(now, now),
    );
  });

  it('leaves a verifiable audit hash chain and no half-open transaction', () => {
    assert.equal(verifyAuditChain(db), true);
    db.exec('BEGIN IMMEDIATE;');
    db.exec('ROLLBACK;');
  });
});
