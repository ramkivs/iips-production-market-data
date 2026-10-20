/**
 * Gate 3 T-E — startup fail-closed validation, host-adaptive.
 *
 * Every fault in the fixed validate -> connect -> migrate -> verify -> bind
 * order creates no endpoint and returns a bounded phase-coded non-OK outcome,
 * using native temp paths with the HOST platform's own path semantics. POSIX
 * filesystem-permission and socket-collision cases run only on POSIX hosts;
 * Windows gets named-pipe collision coverage through the F7 EADDRINUSE seam and
 * a startup-order test proving the pipe branch neither creates nor requires a
 * state directory. The Gate A′ provisioning guard (#118) and the no-import-edge
 * regression are platform-independent.
 */
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
  chmodSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import {
  closeDatabase,
  compareNodeVersion,
  DatabasePathError,
  openDatabase,
  RuntimeUnsupportedError,
} from '../src/persistence/connection.js';
import { ensureMigrations, migrationChecksum } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS, startIpcServer } from '../src/ipc/entrypoint.js';
import {
  EndpointCollisionError,
  isWindowsPipeNamespaceOnly,
  UnsafeEndpointDirectoryError,
} from '../src/ipc/endpoint.js';
import {
  buildBindingProvisionStatements,
  inspectBindings,
  ProvisioningNotAuthorizedError,
  provisionActiveBinding,
} from '../src/persistence/provisioning.js';

const HOST_PLATFORM: NodeJS.Platform = process.platform === 'win32' ? 'win32' : 'linux';
const IS_WINDOWS_HOST = HOST_PLATFORM === 'win32';
const ENDPOINT_NAME = `iips-g3-startup-${process.pid}`;
const posixOnly = IS_WINDOWS_HOST ? it.skip : it;

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function eaddrInuseFactory(): (path: string) => import('node:net').Server {
  return () => {
    const server = createServer();
    server.listen = (() => {
      setImmediate(() =>
        server.emit('error', Object.assign(new Error('pipe busy'), { code: 'EADDRINUSE' })),
      );
      return server;
    }) as typeof server.listen;
    return server;
  };
}

describe('g3 / T-E startup validation', () => {
  const roots: string[] = [];

  function makeRoot(): string {
    const root = mkdtempSync(join(tmpdir(), 'g3-startup-'));
    roots.push(root);
    return root;
  }

  /**
   * Windows refuses to unlink a file while a sqlite handle (or a briefly
   * retained OS handle, e.g. an indexer/AV scan) is open. Retry the tree
   * removal for the lock-released codes instead of masking the error: after
   * the retries are exhausted the failure still surfaces, so a real leak is
   * never hidden.
   */
  function removeRootWithRetry(root: string, attempts = 5): void {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        rmSync(root, { recursive: true, force: true });
        return;
      } catch (error) {
        lastError = error;
        const code = (error as NodeJS.ErrnoException)?.code;
        if (code !== 'EBUSY' && code !== 'EPERM' && code !== 'ENOTEMPTY') throw error;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
      }
    }
    throw lastError;
  }

  afterEach(() => {
    // Close EVERY handle before removing files. On Linux an open file can be
    // unlinked, so the inverted order happened to work; on Windows it throws
    // EBUSY, which previously skipped closeDatabase() and leaked the process
    // singleton into every later test.
    closeDatabase();
    for (const root of roots) removeRootWithRetry(root);
    roots.length = 0;
  });

  function baseEnv(root: string): NodeJS.ProcessEnv {
    return {
      IIPS_G2_IPC_ENDPOINT: ENDPOINT_NAME,
      IIPS_G3_LOCAL_STATE_DIR: join(root, 'state'),
      IIPS_G3_DATABASE_PATH: join(root, 'store', 'ipd.db'),
    };
  }

  it('refuses Node versions below 22.13.0 before opening any file', () => {
    assert.equal(compareNodeVersion('22.12.0').supported, false);
    assert.equal(compareNodeVersion('22.13.0').supported, true);
    assert.equal(compareNodeVersion('23.0.0').supported, true);
    assert.throws(() => openDatabase(join(makeRoot(), 'x.db'), '22.5.0'), RuntimeUnsupportedError);
  });

  it('refuses a missing endpoint setting at the validate phase with no endpoint', async () => {
    const root = makeRoot();
    const outcome = await startIpcServer({
      env: { IIPS_G3_DATABASE_PATH: join(root, 'x.db') },
      platform: HOST_PLATFORM,
    });
    assert.equal(outcome.ok, false);
    assert.equal(outcome.phase, 'validate');
    assert.ok(!existsSync(join(root, 'state')));
  });

  it('refuses a URL endpoint at validate', async () => {
    const root = makeRoot();
    const outcome = await startIpcServer({
      env: { ...baseEnv(root), IIPS_G2_IPC_ENDPOINT: 'tcp://127.0.0.1:9000' },
      platform: HOST_PLATFORM,
    });
    assert.equal(outcome.ok, false);
    assert.equal(outcome.phase, 'validate');
  });

  it('refuses a relative database path at validate', async () => {
    const root = makeRoot();
    const outcome = await startIpcServer({
      env: { ...baseEnv(root), IIPS_G3_DATABASE_PATH: join('relative', 'ipd.db') },
      platform: HOST_PLATFORM,
    });
    assert.equal(outcome.ok, false);
    assert.equal(outcome.phase, 'validate');
  });

  it('refuses a tampered migration checksum at the migrate phase', async () => {
    const root = makeRoot();
    const dbPath = join(root, 'store', 'ipd.db');
    const db = openDatabase(dbPath);
    ensureMigrations(db, GATE3_MIGRATIONS);
    db.prepare("UPDATE _migration_ledger SET checksum = 'tampered' WHERE migration_id = '001_initial_schema'").run();
    closeDatabase();

    const outcome = await startIpcServer({ env: baseEnv(root), platform: HOST_PLATFORM });
    assert.equal(outcome.ok, false);
    assert.equal(outcome.phase, 'migrate');
    assert.match(outcome.error ?? '', /checksum mismatch/i);
    assert.ok(!existsSync(join(root, 'state')));
  });

  it('refuses an unknown migration recorded in the ledger at migrate', async () => {
    const root = makeRoot();
    const dbPath = join(root, 'store', 'ipd.db');
    const db = openDatabase(dbPath);
    ensureMigrations(db, GATE3_MIGRATIONS);
    db.prepare('INSERT INTO _migration_ledger (migration_id, checksum, applied_at) VALUES (?, ?, ?)').run(
      '999_unknown',
      'deadbeef',
      new Date().toISOString(),
    );
    closeDatabase();

    const outcome = await startIpcServer({ env: baseEnv(root), platform: HOST_PLATFORM });
    assert.equal(outcome.ok, false);
    assert.equal(outcome.phase, 'migrate');
    assert.match(outcome.error ?? '', /unknown migration/i);
  });

  it('detects migration SQL drift deterministically through the checksum', () => {
    const original = GATE3_MIGRATIONS[0];
    const drifted = { id: original.id, sql: `${original.sql}\n-- drift\n` };
    assert.notEqual(migrationChecksum(drifted), migrationChecksum(original));
    assert.equal(migrationChecksum(original).length, 64);
  });

  it('refuses a store open fault at the connect phase', async () => {
    const root = makeRoot();
    writeFileSync(join(root, 'blocker'), 'not a directory');
    const outcome = await startIpcServer({
      env: { ...baseEnv(root), IIPS_G3_DATABASE_PATH: join(root, 'blocker', 'x.db') },
      platform: HOST_PLATFORM,
    });
    assert.equal(outcome.ok, false);
    assert.equal(outcome.phase, 'connect');
  });

  posixOnly('refuses an occupied POSIX endpoint path at bind with no second endpoint', async () => {
    const root = makeRoot();
    mkdirSync(join(root, 'state'), { recursive: true, mode: 0o700 });
    writeFileSync(join(root, 'state', `${ENDPOINT_NAME}.sock`), 'occupied');
    const outcome = await startIpcServer({ env: baseEnv(root), platform: 'linux' });
    assert.equal(outcome.ok, false);
    assert.equal(outcome.phase, 'bind');
    assert.match(outcome.error ?? '', /already exists/i);
  });

  posixOnly('refuses an unsafe pre-existing state directory instead of repairing it', async () => {
    const root = makeRoot();
    const stateDir = join(root, 'state');
    mkdirSync(stateDir, { recursive: true });
    chmodSync(stateDir, 0o755);
    const outcome = await startIpcServer({ env: baseEnv(root), platform: 'linux' });
    assert.equal(outcome.ok, false);
    assert.equal(outcome.phase, 'bind');
    assert.ok(outcome.error?.includes('0700'));
    assert.equal(statSync(stateDir).mode & 0o777, 0o755);
    chmodSync(stateDir, 0o700);
  });

  it('maps a Windows pipe EADDRINUSE bind fault (F7) to EndpointCollisionError at bind', async () => {
    const root = makeRoot();
    const outcome = await startIpcServer({
      env: baseEnv(root),
      platform: 'win32',
      serverFactory: eaddrInuseFactory(),
    });
    assert.equal(outcome.ok, false);
    assert.equal(outcome.phase, 'bind');
    assert.match(outcome.error ?? '', /already occupied/i);
    assert.equal(outcome.target?.kind, 'windows-named-pipe');
  });

  it('the Windows pipe branch reaches bind without creating or requiring a state directory', async () => {
    const root = makeRoot();
    assert.ok(!existsSync(join(root, 'state')));
    const outcome = await startIpcServer({
      env: baseEnv(root),
      platform: 'win32',
      serverFactory: eaddrInuseFactory(),
    });
    assert.equal(outcome.phase, 'bind');
    assert.ok(!existsSync(join(root, 'state')), 'named pipes create no filesystem endpoint directory');
  });

  it('a successful startup binds the host endpoint and survives a clean stop', async () => {
    const root = makeRoot();
    const outcome = await startIpcServer({ env: baseEnv(root), platform: HOST_PLATFORM });
    assert.equal(outcome.ok, true);
    if (IS_WINDOWS_HOST) {
      assert.equal(outcome.target?.kind, 'windows-named-pipe');
      assert.match(outcome.target!.path, /^\\\\\.\\pipe\\/);
      assert.ok(isWindowsPipeNamespaceOnly(outcome.target!));
      assert.ok(!existsSync(join(root, 'state')), 'pipe binding creates no endpoint directory on disk');
    } else {
      assert.equal(outcome.target?.kind, 'unix-socket');
      assert.ok(existsSync(outcome.target!.path));
    }
    await outcome.handle?.stop();
  });

  it('collision and unsafe-dir errors are distinct bounded classes', () => {
    assert.ok(new EndpointCollisionError('x') instanceof Error);
    assert.ok(new UnsafeEndpointDirectoryError('x') instanceof Error);
  });

  it('refuses to open a second database path while a handle is open (isolation guard)', () => {
    const root = makeRoot();
    const firstPath = join(root, 'store-a', 'ipd.db');
    const secondPath = join(root, 'store-b', 'ipd.db');
    const first = openDatabase(firstPath);
    assert.equal(openDatabase(firstPath), first);
    assert.throws(() => openDatabase(secondPath), DatabasePathError);
    closeDatabase();
    assert.doesNotThrow(() => openDatabase(secondPath));
  });

  it('#118 provisioning without Gate A′ authorization throws before any SQL (undefined)', () => {
    const root = makeRoot();
    const db = openDatabase(join(root, 'store', 'ipd.db'));
    ensureMigrations(db, GATE3_MIGRATIONS);
    const before = countBindingRows(db);
    assert.throws(
      () =>
        provisionActiveBinding(
          db,
          undefined,
          { principalLabel: 'operator', tenantId: 't', canonicalOwnerId: 'o' },
        ),
      ProvisioningNotAuthorizedError,
    );
    assert.deepEqual(countBindingRows(db), before);
    assert.equal(inspectBindings(db).bindings.length, 0);
  });

  it('#118 a forged plain-object authorization is refused with zero store effect', () => {
    const root = makeRoot();
    const db = openDatabase(join(root, 'store', 'ipd.db'));
    ensureMigrations(db, GATE3_MIGRATIONS);
    const before = countBindingRows(db);
    const forged = { issuedAt: new Date().toISOString(), act: 'gate-a-prime' } as never;
    assert.throws(
      () =>
        provisionActiveBinding(
          db,
          forged,
          { principalLabel: 'operator', tenantId: 't', canonicalOwnerId: 'o' },
        ),
      ProvisioningNotAuthorizedError,
    );
    assert.deepEqual(countBindingRows(db), before);
  });

  it('the pure statement builder and read-only inspector need no authorization and mutate nothing', () => {
    const root = makeRoot();
    const db = openDatabase(join(root, 'store', 'ipd.db'));
    ensureMigrations(db, GATE3_MIGRATIONS);
    const prepared = buildBindingProvisionStatements({
      principalLabel: 'operator',
      tenantId: 't',
      canonicalOwnerId: 'o',
    });
    assert.ok(prepared.bindingSql.includes('INSERT INTO local_principal_bindings'));
    assert.equal(inspectBindings(db).bindings.length, 0);
  });

  it('no IPC entrypoint or dispatch module has an import edge to provisioning', () => {
    const here = fileURLToPath(new URL('.', import.meta.url));
    for (const name of ['entrypoint.ts', 'dispatch.ts']) {
      const source = stripComments(
        readFileSync(join(here, '..', '..', 'src', 'ipc', name), 'utf8'),
      );
      assert.ok(
        !/from\s+['"][^'"]*provisioning['"]/.test(source) &&
          !/import\(\s*['"][^'"]*provisioning['"]\s*\)/.test(source),
        `${name} must not import provisioning`,
      );
    }
  });

  it('a broken audit hash chain is refused at the verify phase', async () => {
    const root = makeRoot();
    const dbPath = join(root, 'store', 'ipd.db');
    const db = openDatabase(dbPath);
    ensureMigrations(db, GATE3_MIGRATIONS);
    db.prepare(
      `INSERT INTO audit_events (event_type, subject_type, subject_id, detail_json, prev_checksum, entry_checksum, created_at)
       VALUES ('x','y','z','{}', ?, ?, ?)`,
    ).run('0'.repeat(64), '1'.repeat(64), new Date().toISOString());
    closeDatabase();
    const outcome = await startIpcServer({ env: baseEnv(root), platform: HOST_PLATFORM });
    assert.equal(outcome.ok, false);
    assert.equal(outcome.phase, 'verify');
  });
});

function countBindingRows(db: DatabaseSync): { bindings: number; memberships: number; audit: number } {
  return {
    bindings: Number((db.prepare('SELECT COUNT(*) AS n FROM local_principal_bindings').get() as { n: number | bigint }).n),
    memberships: Number((db.prepare('SELECT COUNT(*) AS n FROM local_principal_memberships').get() as { n: number | bigint }).n),
    audit: Number((db.prepare('SELECT COUNT(*) AS n FROM audit_events').get() as { n: number | bigint }).n),
  };
}
