/**
 * Q1-b readiness probe — the designated ownership source (CV-20 Option A /
 * `IIPS-V3-Q1B-OWNERSHIP-SOURCE-DISPOSITION-2026-10-22`).
 *
 * The Q1-b record designates the sole non-authentication ownership source for
 * user portfolios: the single `ACTIVE` `local_principal_bindings` row held in
 * the IPD-owned store, consumed exclusively by the IPD-owned, single-principal,
 * same-host IPC endpoint. That record explicitly does NOT assert operational
 * status.
 *
 * This suite establishes, on the host that ran it, whether the designated
 * source is OPERATIONAL. It is a read-only readiness probe:
 *
 *   - it opens only a fixture store under the OS temporary directory;
 *   - it never provisions, revokes or mutates an authoritative binding;
 *   - it never claims a capability, a qualification or an admission.
 *
 * The question it answers is narrow and factual: does the designated source
 * exist, is it reachable, and does the endpoint it feeds serve a live read?
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createConnection } from 'node:net';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase, closeDatabase } from '../src/persistence/connection.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS, startIpcServer } from '../src/ipc/entrypoint.js';
import { inspectBindings } from '../src/persistence/binding.js';
import {
  ProvisioningNotAuthorizedError,
  provisionActiveBinding,
} from '../src/persistence/provisioning.js';

const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

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

function sourceFilesUnder(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) {
      found.push(...sourceFilesUnder(full));
    } else if (entry.endsWith('.ts')) {
      found.push(full);
    }
  }
  return found;
}

describe('q1-b / designated ownership source readiness', () => {
  let root: string;
  let db: DatabaseSync;
  let databasePath: string;

  before(() => {
    root = mkdtempSync(join(tmpdir(), 'q1-ownership-'));
    databasePath = join(root, 'store', 'ipd.db');
    db = openDatabase(databasePath);
    ensureMigrations(db, GATE3_MIGRATIONS);
  });

  after(() => {
    closeDatabase();
    rmSync(root, { recursive: true, force: true });
  });

  it('a fresh store carries no ACTIVE binding and no ACTIVE membership', () => {
    const observed = inspectBindings(db);
    assert.deepEqual(observed.bindings, []);
    assert.deepEqual(observed.memberships, []);
  });

  it('the real entrypoint starts, and the designated source refuses every request with zero bytes', async () => {
    const outcome = await startIpcServer({
      env: {
        IIPS_G2_IPC_ENDPOINT: `iips-q1b-${process.pid}`,
        IIPS_G3_LOCAL_STATE_DIR: join(root, 'state'),
        IIPS_G3_DATABASE_PATH: databasePath,
      } as NodeJS.ProcessEnv,
      platform: HOST_PLATFORM,
    });
    assert.equal(outcome.ok, true, outcome.error);
    assert.ok(outcome.target);

    try {
      const response = await call(outcome.target!.path, { v: 1, op: 'portfolio.list', requestId: 'q1b-1' });
      assert.equal(
        response.byteLength,
        0,
        'the endpoint refused the request with zero bytes: the binding is absent, so the designated ownership source is not operational',
      );
    } finally {
      await outcome.handle!.stop();
    }
  });

  it('Gate A-prime provisioning is unreachable from every other module and cannot be forged', () => {
    const importers: string[] = [];
    for (const file of sourceFilesUnder(join(REPO_ROOT, 'src'))) {
      const source = readFileSync(file, 'utf8');
      if (/from\s+['"][^'"]*provisioning['"]/.test(source) || /import\(\s*['"][^'"]*provisioning['"]\s*\)/.test(source)) {
        importers.push(file.replace(`${REPO_ROOT}/`, ''));
      }
    }
    assert.deepEqual(
      importers,
      [],
      'no module under src/ imports provisioning: the Gate A-prime path is unreachable from every IPC operation and from startup',
    );

    const before = db.prepare('SELECT COUNT(*) AS n FROM local_principal_bindings').get() as { n: number | bigint };
    assert.throws(
      () =>
        provisionActiveBinding(
          db,
          { issuedAt: new Date().toISOString(), act: 'gate-a-prime' },
          { principalLabel: 'operator', tenantId: 'tenant-local', canonicalOwnerId: 'owner-local' },
        ),
      ProvisioningNotAuthorizedError,
    );
    const after = db.prepare('SELECT COUNT(*) AS n FROM local_principal_bindings').get() as { n: number | bigint };
    assert.equal(Number(after.n), Number(before.n), 'the forged authorization wrote nothing');
  });

  it('with the binding present, the same real endpoint serves a live read', async () => {
    const now = new Date().toISOString();
    // The operator-side Gate A-prime act is APPROVED and NOT EXECUTED, so this
    // fixture writes the binding rows directly, exactly as a future executed
    // Gate A-prime act would leave them. It is a fixture, not an activation.
    db.prepare(
      "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('b-q1b', 'operator', 'ACTIVE', ?, ?, NULL)",
    ).run(now, now);
    db.prepare(
      "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('m-q1b', 'b-q1b', 'tenant-local', 'owner-local', 'ACTIVE', ?, ?, NULL)",
    ).run(now, now);

    const outcome = await startIpcServer({
      env: {
        IIPS_G2_IPC_ENDPOINT: `iips-q1b-live-${process.pid}`,
        IIPS_G3_LOCAL_STATE_DIR: join(root, 'state-live'),
        IIPS_G3_DATABASE_PATH: databasePath,
      } as NodeJS.ProcessEnv,
      platform: HOST_PLATFORM,
    });
    assert.equal(outcome.ok, true, outcome.error);

    try {
      const response = await call(outcome.target!.path, { v: 1, op: 'portfolio.list', requestId: 'q1b-2' });
      assert.ok(response.byteLength > 0, 'the endpoint answered');
      const declared = response.readUInt32BE(0);
      const parsed = JSON.parse(response.subarray(4, 4 + declared).toString('utf8')) as {
        ok: boolean;
        result: unknown[];
      };
      assert.equal(parsed.ok, true);
      // Contract v1 §6: the `portfolio.list` result IS `PortfolioSummary[]`.
      assert.ok(Array.isArray(parsed.result), 'the list result is the array itself');
      assert.deepEqual(parsed.result, []);
    } finally {
      await outcome.handle!.stop();
    }
  });
});
