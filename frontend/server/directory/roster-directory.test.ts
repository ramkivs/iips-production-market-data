/**
 * Program v3.0 — PF-2 roster directory + IdP sync tests (offline, deterministic).
 *
 * Covers the accepted authority chain (TD-4/TD-8/TD-5a/TD-5b1/TD-5b3/TD-5c/TD-6):
 * whole-snapshot replacement, IdP-wins, removal, disabled-user exclusion, tenant isolation,
 * fail-closed no-sync, failed-sync leaves last snapshot authoritative, restart/reload,
 * idempotency, audit, governed-role filtering, tenant-less-user skipping, and the
 * KeycloakAdminReader's client-credentials + Admin REST flow with an injected fetch.
 * No live network; no real credentials; no secret ever leaks into audit/errors.
 */
import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { PersistenceService } from '../persistence/persistence-service';
import {
  RosterDirectory,
  RosterError,
  ADMIN_ROLE,
  type DirectorySnapshot,
} from './roster-directory';
import {
  KeycloakAdminReader,
  syncDirectory,
  SyncError,
  type IdpReader,
  type IdpSnapshot,
  type SyncAuditEvent,
} from './idp-sync';

const tmpDirs: string[] = [];
function tmpDir(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'iips-pf2-'));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

function dir(): RosterDirectory {
  return new RosterDirectory({ persistence: new PersistenceService({ dataDir: tmpDir() }) });
}

function user(userId: string, tenantId: string, roles: readonly string[], enabled = true) {
  return { userId, tenantId, roles, enabled };
}

class MockReader implements IdpReader {
  constructor(private readonly behavior: { snapshot?: IdpSnapshot; error?: Error }) {}
  async readSnapshot(): Promise<IdpSnapshot> {
    if (this.behavior.error) throw this.behavior.error;
    return this.behavior.snapshot!;
  }
}

const SNAP1: IdpSnapshot = {
  realm: 'iips',
  users: [
    user('admin-a', 'tenant-A', ['iips-admin']),
    user('analyst-a', 'tenant-A', ['iips-analyst']),
    user('viewer-a', 'tenant-A', ['iips-viewer']),
    user('admin-b', 'tenant-B', ['iips-admin']),
    user('disabled-admin', 'tenant-A', ['iips-admin'], false),
  ],
};

describe('PF-2 directory — whole-snapshot replacement (TD-5c)', () => {
  it('seed populates the roster and adminsOf returns enabled tenant admins', async () => {
    const d = new RosterDirectory({ persistence: new PersistenceService({ dataDir: tmpDir() }), clock: () => '2026-08-22T00:00:00.000Z' });
    await syncDirectory({ directory: d, idp: new MockReader({ snapshot: SNAP1 }) });
    expect(d.adminsOf('tenant-A')).toEqual(['admin-a']);
    expect(d.adminsOf('tenant-B')).toEqual(['admin-b']);
    expect(d.syncedAt()).toBe('2026-08-22T00:00:00.000Z');
  });

  it('replacement is IdP-wins: a later snapshot supersedes the previous one', async () => {
    const d = dir();
    await syncDirectory({ directory: d, idp: new MockReader({ snapshot: SNAP1 }) });
    const snap2: IdpSnapshot = {
      realm: 'iips',
      users: [
        user('admin-a', 'tenant-A', ['iips-analyst']), // demoted: no longer admin
        user('admin-c', 'tenant-A', ['iips-admin']),   // promoted/new
      ],
    };
    await syncDirectory({ directory: d, idp: new MockReader({ snapshot: snap2 }) });
    expect(d.adminsOf('tenant-A')).toEqual(['admin-c']); // admin-a demoted; admin-b removed
  });

  it('removal: a user absent from the new snapshot leaves the roster', async () => {
    const d = dir();
    await syncDirectory({ directory: d, idp: new MockReader({ snapshot: SNAP1 }) });
    const snap2: IdpSnapshot = { realm: 'iips', users: [user('admin-a', 'tenant-A', ['iips-admin'])] };
    await syncDirectory({ directory: d, idp: new MockReader({ snapshot: snap2 }) });
    expect(d.adminsOf('tenant-B')).toEqual([]); // admin-b removed
  });

  it('excludes disabled users from enumeration but keeps them out of the active roster', async () => {
    const d = dir();
    await syncDirectory({ directory: d, idp: new MockReader({ snapshot: SNAP1 }) });
    expect(d.adminsOf('tenant-A')).not.toContain('disabled-admin');
  });
});

describe('PF-2 directory — tenant isolation + server-derived identity (TD-6)', () => {
  it('adminsOf is tenant-scoped: never returns another tenant\'s users', async () => {
    const d = dir();
    await syncDirectory({ directory: d, idp: new MockReader({ snapshot: SNAP1 }) });
    expect(d.adminsOf('tenant-A')).toEqual(['admin-a']);
    expect(d.adminsOf('tenant-B')).toEqual(['admin-b']);
    expect(d.adminsOf('tenant-A')).not.toContain('admin-b');
  });

  it('snapshot record identity is server-stamped by PF-1 (not taken from the IdP)', () => {
    const persistence = new PersistenceService({ dataDir: tmpDir() });
    const d = new RosterDirectory({ persistence, clock: () => '2026-08-22T00:00:00.000Z' });
    const snap = d.applySnapshot({ realm: 'iips', users: [user('admin-a', 'tenant-A', ['iips-admin'])] });
    const records = persistence.listOrdered('__system__', '__directory__');
    expect(records).toHaveLength(1);
    expect(records[0].recordId).toBeTruthy();
    expect(records[0].seq).toBe(1);
    // The PF-1 journal record's createdAt is PF-1's own server stamp (system clock);
    // the DIRECTORY's syncedAt is the directory's injectable clock. Both server-derived.
    expect(records[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(snap.syncedAt).toBe('2026-08-22T00:00:00.000Z');
    expect(snap.syncId).toBeTruthy();
  });
});

describe('PF-2 directory — fail-closed + no half-authoritative state', () => {
  it('adminsOf throws NO_SYNC when no successful sync has ever occurred', () => {
    const d = dir();
    expect(d.hasSynced()).toBe(false);
    expect(() => d.adminsOf('tenant-A')).toThrowError(RosterError);
    try { d.adminsOf('tenant-A'); } catch (e) { expect((e as RosterError).code).toBe('NO_SYNC'); }
  });

  it('a failed sync leaves the last successful snapshot authoritative', async () => {
    const d = dir();
    await syncDirectory({ directory: d, idp: new MockReader({ snapshot: SNAP1 }) });
    const failing = new MockReader({ error: new SyncError('USERS_FAILED', 'idp down') });
    const audit: SyncAuditEvent[] = [];
    await expect(syncDirectory({ directory: d, idp: failing, audit: (e) => audit.push(e) }))
      .rejects.toMatchObject({ code: 'USERS_FAILED' });
    expect(d.adminsOf('tenant-A')).toEqual(['admin-a']); // unchanged — no half-state
    expect(audit[audit.length - 1]?.outcome).toBe('failed');
  });
});

describe('PF-2 directory — restart/reload + idempotency + audit', () => {
  it('restart reload rebuilds the roster from the journal', async () => {
    const dataDir = tmpDir();
    const d1 = new RosterDirectory({ persistence: new PersistenceService({ dataDir }) });
    await syncDirectory({ directory: d1, idp: new MockReader({ snapshot: SNAP1 }) });
    const d2 = new RosterDirectory({ persistence: new PersistenceService({ dataDir }) });
    expect(d2.adminsOf('tenant-A')).toEqual(['admin-a']);
    expect(d2.adminsOf('tenant-B')).toEqual(['admin-b']);
    expect(d2.syncedAt()).toBe(d1.syncedAt());
  });

  it('applySnapshot is idempotent for the same syncId (PF-1 dedup → one record)', () => {
    const persistence = new PersistenceService({ dataDir: tmpDir() });
    const d = new RosterDirectory({ persistence });
    const input = { syncId: 'sync-1', realm: 'iips', users: [user('admin-a', 'tenant-A', ['iips-admin'])] };
    d.applySnapshot(input);
    d.applySnapshot(input);
    expect(persistence.listOrdered('__system__', '__directory__')).toHaveLength(1);
    expect(d.adminsOf('tenant-A')).toEqual(['admin-a']);
  });

  it('audits success with counts and never leaks user data beyond counts', async () => {
    const d = dir();
    const audit: SyncAuditEvent[] = [];
    await syncDirectory({ directory: d, idp: new MockReader({ snapshot: SNAP1 }), audit: (e) => audit.push(e) });
    expect(audit).toHaveLength(1);
    expect(audit[0].outcome).toBe('success');
    expect(audit[0].tenantCount).toBe(2);
    expect(audit[0].userCount).toBe(5);
    expect(JSON.stringify(audit)).not.toContain('admin-a'); // no per-user data
    expect(JSON.stringify(audit)).not.toContain('secret');
  });
});

describe('PF-2 directory — role filtering + tenant-less users', () => {
  it('filters roles to the governed vocabulary', () => {
    const d = dir();
    d.applySnapshot({ realm: 'iips', users: [user('x', 'tenant-A', ['iips-admin', 'offline_access'])] });
    expect(d.adminsOf('tenant-A')).toEqual(['x']);
  });

  it('skips users without a tenant attribute', () => {
    const d = dir();
    d.applySnapshot({ realm: 'iips', users: [user('notenant', '', ['iips-admin']), user('admin-a', 'tenant-A', ['iips-admin'])] });
    expect(d.adminsOf('tenant-A')).toEqual(['admin-a']);
    expect(d.adminsOf('')).toEqual([]);
  });
});

describe('PF-2 sync — KeycloakAdminReader (offline, injected fetch)', () => {
  function readerWith(behavior: {
    secret?: string;
    tokenStatus?: number;
    tokenBody?: unknown;
    usersStatus?: number;
    usersBody?: unknown;
    rolesStatus?: number;
    rolesBody?: unknown;
  }, secretFailure?: Error): KeycloakAdminReader {
    const calls: string[] = [];
    const mockFetch = (async (input: unknown, init?: { method?: string; body?: unknown; headers?: Record<string, string> }) => {
      const url = String(input);
      calls.push(url);
      if (url.includes('/protocol/openid-connect/token')) {
        if (behavior.tokenStatus !== undefined && behavior.tokenStatus !== 200) {
          return new Response('{}', { status: behavior.tokenStatus }) as unknown as Response;
        }
        return new Response(JSON.stringify(behavior.tokenBody ?? { access_token: 'at-1' }), { status: 200 }) as unknown as Response;
      }
      if (url.includes('/role-mappings/realm')) {
        if (behavior.rolesStatus !== undefined && behavior.rolesStatus !== 200) {
          return new Response('[]', { status: behavior.rolesStatus }) as unknown as Response;
        }
        return new Response(JSON.stringify(behavior.rolesBody ?? [{ name: 'iips-admin' }]), { status: 200 }) as unknown as Response;
      }
      // users list
      if (behavior.usersStatus !== undefined && behavior.usersStatus !== 200) {
        return new Response('[]', { status: behavior.usersStatus }) as unknown as Response;
      }
      return new Response(JSON.stringify(behavior.usersBody ?? []), { status: 200 }) as unknown as Response;
    }) as unknown as typeof globalThis.fetch;
    return new KeycloakAdminReader({
      baseUrl: 'http://idp',
      realm: 'iips',
      clientId: 'iips-sync',
      getSecret: secretFailure
        ? async () => { throw secretFailure; }
        : async () => behavior.secret ?? 'the-secret',
      fetchImpl: mockFetch,
    });
  }

  it('performs client-credentials token acquisition + users + roles reads', async () => {
    const r = readerWith({
      usersBody: [
        { id: 'u1', username: 'admin-a', enabled: true, attributes: { tenant: ['tenant-A'] } },
        { id: 'u2', username: 'off', enabled: false, attributes: { tenant: ['tenant-A'] } },
        { id: 'u3', username: 'notenant', enabled: true, attributes: {} },
      ],
    });
    const snap = await r.readSnapshot();
    expect(snap.realm).toBe('iips');
    expect(snap.users.map((u) => u.userId)).toEqual(['admin-a', 'off']); // tenant-less skipped
    expect(snap.users[0].roles).toEqual(['iips-admin']); // governed filter applied
    expect(snap.users[0].enabled).toBe(true);
    expect(snap.users[1].enabled).toBe(false);
  });

  it('fails closed on token failure (no secret in the error)', async () => {
    const r = readerWith({ tokenStatus: 401 });
    await expect(r.readSnapshot()).rejects.toMatchObject({ code: 'TOKEN_FAILED' });
    try { await r.readSnapshot(); } catch (e) { expect(String(e)).not.toContain('the-secret'); }
  });

  it('fails closed on users failure', async () => {
    const r = readerWith({ usersStatus: 500 });
    await expect(r.readSnapshot()).rejects.toMatchObject({ code: 'USERS_FAILED' });
  });

  it('fails closed on roles failure', async () => {
    const r = readerWith({ usersBody: [{ id: 'u1', username: 'admin-a', enabled: true, attributes: { tenant: ['tenant-A'] } }], rolesStatus: 500 });
    await expect(r.readSnapshot()).rejects.toMatchObject({ code: 'ROLES_FAILED' });
  });

  it('propagates a credential failure (SecretAuthority error) and never calls the IdP', async () => {
    const secretFailure = new Error('SECRET_MISSING');
    const r = readerWith({}, secretFailure);
    await expect(r.readSnapshot()).rejects.toThrow('SECRET_MISSING');
  });
});

describe('PF-2 sync — SecretAuthority integration seam', () => {
  it('syncDirectory composes reader + directory into a whole-snapshot replacement', async () => {
    const d = dir();
    const snap1: IdpSnapshot = { realm: 'iips', users: [user('admin-a', 'tenant-A', ['iips-admin'])] };
    await syncDirectory({ directory: d, idp: new MockReader({ snapshot: snap1 }) });
    const snap2: IdpSnapshot = { realm: 'iips', users: [user('admin-b', 'tenant-A', ['iips-admin'])] };
    await syncDirectory({ directory: d, idp: new MockReader({ snapshot: snap2 }) });
    expect(d.adminsOf('tenant-A')).toEqual(['admin-b']);
  });
});
