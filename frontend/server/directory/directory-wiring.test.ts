/**
 * Program v3.0 — PF-2 Trigger Wiring tests (offline, deterministic) — TW-1…TW-5.
 *
 * Covers the pinned test contract: startup seed success/failure, fail-closed secret and IdP
 * errors, await-before-listen ordering, guardAdmin enforcement on the sync endpoint, the
 * sync-result envelope, the deterministic 409 concurrent trigger, audit behaviour, and the
 * two leakage guarantees (no roster data, no secret) in the response/errors/audit.
 *
 * No live network, no real credentials, no Keycloak. PF-1 / SecretAuthority /
 * RosterDirectory / idp-sync are exercised as promoted, never modified.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { PersistenceService } from '../persistence/persistence-service';
import { RosterDirectory, RosterError } from './roster-directory';
import { SyncError, type IdpReader, type IdpSnapshot, type SyncAuditEvent } from './idp-sync';
import {
  createDirectoryWiring,
  resolveDirectoryConfig,
  runGuardedSync,
  startupSeed,
  resetDirectoryWiring,
  isSyncInFlight,
  DirectoryConfigError,
  SyncInProgressError,
  ENV_KEYCLOAK_URL,
  ENV_REALM,
  ENV_CLIENT_ID,
  ENV_SECRET_NAME,
  ENV_SECRET_VALUE,
  type DirectoryWiring,
} from './directory-wiring';
import { handleAdminRequest, buildAdminState, createAdminExecutor } from '../admin-transport';
import type { OidcVerifier } from '../../src/core/auth/keycloakAdapter';

const SECRET_VALUE = 'super-secret-client-credential-value';
const tmpDirs: string[] = [];
function tmpDir(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'iips-tw-'));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
  resetDirectoryWiring();
});
beforeEach(() => resetDirectoryWiring());

const SNAP: IdpSnapshot = {
  realm: 'iips',
  users: [
    { userId: 'admin-a', tenantId: 'tenant-A', roles: ['iips-admin'], enabled: true },
    { userId: 'analyst-a', tenantId: 'tenant-A', roles: ['iips-analyst'], enabled: true },
    { userId: 'analyst-b', tenantId: 'tenant-B', roles: ['iips-analyst'], enabled: true },
  ],
};

class MockReader implements IdpReader {
  constructor(private readonly behavior: { snapshot?: IdpSnapshot; error?: Error }) {}
  async readSnapshot(): Promise<IdpSnapshot> {
    if (this.behavior.error) throw this.behavior.error;
    return this.behavior.snapshot!;
  }
}

function wiringWith(idp: IdpReader): DirectoryWiring {
  const directory = new RosterDirectory({ persistence: new PersistenceService({ dataDir: tmpDir() }) });
  return {
    directory,
    idp,
    config: { baseUrl: 'http://kc', realm: 'iips', clientId: 'c', secretName: 's', dataDir: tmpDir(), secretStore: 'env' },
  };
}

function envFor(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return {
    [ENV_KEYCLOAK_URL]: 'http://localhost:8080',
    [ENV_REALM]: 'iips',
    [ENV_CLIENT_ID]: 'iips-sync',
    [ENV_SECRET_NAME]: 'pf2-sync',
    [ENV_SECRET_VALUE]: SECRET_VALUE,
    IIPS_DATA_DIR: tmpDir(),
    ...overrides,
  } as NodeJS.ProcessEnv;
}

// --- TW-3 configuration ------------------------------------------------------------------

describe('TW-3 configuration (fail-closed, no defaults)', () => {
  it('resolves all pinned env vars', () => {
    const c = resolveDirectoryConfig(envFor());
    expect(c.realm).toBe('iips');
    expect(c.clientId).toBe('iips-sync');
    expect(c.secretName).toBe('pf2-sync');
    expect(c.secretStore).toBe('env');
  });

  for (const missing of [ENV_KEYCLOAK_URL, ENV_REALM, ENV_CLIENT_ID, ENV_SECRET_NAME]) {
    it(`fails closed when ${missing} is absent`, () => {
      expect(() => resolveDirectoryConfig(envFor({ [missing]: undefined }))).toThrow(DirectoryConfigError);
    });
  }

  it('selects the file store when IIPS_SYNC_SECRET is absent (no default value)', () => {
    const c = resolveDirectoryConfig(envFor({ [ENV_SECRET_VALUE]: undefined }));
    expect(c.secretStore).toBe('file');
  });
});

// --- Secret seam -------------------------------------------------------------------------

describe('secret wiring (SM6 fail-closed, SM10 no leakage)', () => {
  it('missing/empty secret fails closed as SECRET_MISSING; the seed does not crash', async () => {
    const env = envFor({ [ENV_SECRET_VALUE]: undefined });
    // File store with no provisioned secret -> SECRET_MISSING at use time.
    const w = createDirectoryWiring({ env });
    const outcome = await startupSeed({ wiring: w });
    expect(outcome.outcome).toBe('failed');
    expect(outcome.errorMessage ?? '').not.toContain(SECRET_VALUE);
  });

  it('the secret value never appears in the startup-seed outcome', async () => {
    const w = wiringWith(new MockReader({ error: new SyncError('TOKEN_FAILED', 'token request rejected') }));
    const outcome = await startupSeed({ wiring: w });
    expect(JSON.stringify(outcome)).not.toContain(SECRET_VALUE);
  });
});

// --- TW-1 / TW-4 startup seed --------------------------------------------------------------

describe('TW-1 + TW-4 startup seed', () => {
  it('1. successful seed -> directory authoritative; syncedAt set', async () => {
    const w = wiringWith(new MockReader({ snapshot: SNAP }));
    const outcome = await startupSeed({ wiring: w });
    expect(outcome.outcome).toBe('success');
    expect(w.directory.hasSynced()).toBe(true);
    expect(w.directory.syncedAt()).toBeTruthy();
    expect(w.directory.adminsOf('tenant-A')).toEqual(['admin-a']);
  });

  it('2. failed seed (IdP error) -> continue-degraded; roster NO_SYNC; no throw', async () => {
    const w = wiringWith(new MockReader({ error: new SyncError('USERS_FAILED', 'users read failed') }));
    const outcome = await startupSeed({ wiring: w });
    expect(outcome.outcome).toBe('failed');
    expect(outcome.errorCode).toBe('USERS_FAILED');
    expect(w.directory.hasSynced()).toBe(false);
    expect(() => w.directory.adminsOf('tenant-A')).toThrow(RosterError);
  });

  it('4. IdP failure leaves no partial directory state', async () => {
    const w = wiringWith(new MockReader({ error: new SyncError('ROLES_FAILED', 'roles read failed') }));
    await startupSeed({ wiring: w });
    expect(w.directory.syncedAt()).toBeNull();
  });

  it('9. seed success and failure are both audited, without secrets or user data', async () => {
    const events: SyncAuditEvent[] = [];
    const ok = wiringWith(new MockReader({ snapshot: SNAP }));
    await startupSeed({ wiring: ok, audit: (e) => events.push(e) });
    const bad = wiringWith(new MockReader({ error: new SyncError('TOKEN_FAILED', 'nope') }));
    await startupSeed({ wiring: bad, audit: (e) => events.push(e) });

    expect(events.map((e) => e.outcome)).toEqual(['success', 'failed']);
    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain(SECRET_VALUE);
    expect(serialized).not.toContain('admin-a'); // counts only, never per-user data
  });

  it('5. await-before-listen: the seed settles before listen is invoked', async () => {
    const order: string[] = [];
    let release: (() => void) | null = null;
    const gate = new Promise<void>((r) => { release = r; });
    const slow: IdpReader = {
      async readSnapshot() { await gate; order.push('seed-settled'); return SNAP; },
    };
    const w = wiringWith(slow);
    const boot = startupSeed({ wiring: w }).then(() => { order.push('listen'); });
    // Nothing has happened yet: the seed is still awaiting the gate.
    expect(order).toEqual([]);
    release!();
    await boot;
    expect(order).toEqual(['seed-settled', 'listen']);
  });
});

// --- TW-5 concurrency ----------------------------------------------------------------------

describe('TW-5 single in-flight guard', () => {
  it('8. a concurrent trigger is rejected deterministically', async () => {
    let release: (() => void) | null = null;
    const gate = new Promise<void>((r) => { release = r; });
    const slow: IdpReader = { async readSnapshot() { await gate; return SNAP; } };
    const w = wiringWith(slow);

    const first = runGuardedSync({ wiring: w });
    expect(isSyncInFlight()).toBe(true);
    await expect(runGuardedSync({ wiring: w })).rejects.toBeInstanceOf(SyncInProgressError);

    release!();
    await first;
    expect(isSyncInFlight()).toBe(false);
  });

  it('the guard is released after a failed sync', async () => {
    const w = wiringWith(new MockReader({ error: new SyncError('TOKEN_FAILED', 'x') }));
    await expect(runGuardedSync({ wiring: w })).rejects.toBeInstanceOf(SyncError);
    expect(isSyncInFlight()).toBe(false);
  });
});

// --- TW-2 admin endpoint ---------------------------------------------------------------------

const METADATA = { issuer: 'http://localhost:8080/realms/iips', jwksUri: 'http://localhost:8080/realms/iips/certs', clientId: 'iips-spa' };

function verifier(claims: Record<string, unknown>): OidcVerifier {
  return { verify: vi.fn().mockResolvedValue({ subject: 'u1', claims, expiry: Date.now() / 1000 + 3600 }) };
}

function claimsFor(username: string, role: string): Record<string, unknown> {
  return { iss: METADATA.issuer, aud: 'iips-spa', preferred_username: username, tenant: 'tenant-A', realm_access: { roles: [role] } };
}

/**
 * Drive the endpoint over a REAL HTTP server, exactly as admin-transport.test.ts does, so the
 * authentication/authorization path and status mapping are exercised end-to-end.
 */
async function callSync(
  who: 'admin' | 'analyst' | 'none',
  trigger?: () => Promise<import('./idp-sync').SyncResult>,
  method: 'POST' | 'GET' = 'POST',
): Promise<{ status: number; body: Record<string, unknown> }> {
  const executor = createAdminExecutor({
    metadata: METADATA,
    verifier: verifier(who === 'analyst' ? claimsFor('analyst-a', 'iips-analyst') : claimsFor('admin-a', 'iips-admin')),
  });
  const state = buildAdminState();
  const server = http.createServer((req, res) => {
    void handleAdminRequest(req, res, executor, state, trigger ? { syncTrigger: trigger } : {});
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/directory/sync`, {
      method,
      headers: who === 'none' ? {} : { Authorization: `Bearer token-${who}` },
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, body };
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}

describe('TW-2 admin sync endpoint', () => {
  const RESULT = { syncId: 'sync-1', syncedAt: '2026-08-22T00:00:00.000Z', realm: 'iips', tenantCount: 2, userCount: 3 };

  it('6. guardAdmin is enforced: 401 without a token', async () => {
    const { status } = await callSync('none', async () => RESULT);
    expect(status).toBe(401);
  });

  it('6. guardAdmin is enforced: 403 for a non-admin', async () => {
    const { status } = await callSync('analyst', async () => RESULT);
    expect(status).toBe(403);
  });

  it('7. 200 with the sync-result envelope for an admin', async () => {
    const { status, body } = await callSync('admin', async () => RESULT);
    expect(status).toBe(200);
    expect(body.data).toEqual(RESULT);
    expect(body.auditId).toBeTruthy();
    expect((body.provenance as Record<string, string>).authority).toBe('PLATFORM');
  });

  it('8. concurrent trigger -> 409 SYNC_IN_PROGRESS', async () => {
    const { status, body } = await callSync('admin', async () => { throw new SyncInProgressError(); });
    expect(status).toBe(409);
    expect(body.code).toBe('SYNC_IN_PROGRESS');
  });

  for (const code of ['TOKEN_FAILED', 'USERS_FAILED', 'ROLES_FAILED'] as const) {
    it(`${code} -> 503 (IdP source unavailable)`, async () => {
      const { status, body } = await callSync('admin', async () => { throw new SyncError(code, 'idp down'); });
      expect(status).toBe(503);
      expect(body.code).toBe(code);
    });
  }

  it('SYNC_FAILED -> 502 (source contract)', async () => {
    const { status, body } = await callSync('admin', async () => { throw new SyncError('SYNC_FAILED', 'malformed'); });
    expect(status).toBe(502);
    expect(body.code).toBe('SYNC_FAILED');
  });

  it('10. no roster data leakage: counts only, no user or role lists', async () => {
    const { body } = await callSync('admin', async () => RESULT);
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('admin-a');
    expect(serialized).not.toContain('iips-admin');
    expect(Object.keys(body.data as object).sort()).toEqual(['realm', 'syncId', 'syncedAt', 'tenantCount', 'userCount']);
  });

  it('11. no secret leakage in the response on success or failure', async () => {
    const ok = await callSync('admin', async () => RESULT);
    const bad = await callSync('admin', async () => { throw new SyncError('TOKEN_FAILED', `failed using ${SECRET_VALUE}`); });
    expect(JSON.stringify(ok.body)).not.toContain(SECRET_VALUE);
    expect(JSON.stringify(bad.body)).not.toContain(SECRET_VALUE);
  });

  it('is not a roster view: GET is not routed to the sync mutation', async () => {
    const { status } = await callSync('admin', async () => RESULT, 'GET');
    expect(status).toBe(404);
  });
});
