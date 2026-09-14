/**
 * Program v3.0 — P-1 notification service tests (offline, deterministic).
 *
 * Covers the accepted acceptance contract T-1…T-27 at the service/transport level:
 * fan-out, dedup, isolation, failure semantics (U-2c/U-2d/U-2d(ii)), non-reversible read,
 * unread count, deep link, sourceStateDurability + verbatim wording, and the prohibited-work
 * guarantees. No live network, no real credentials, no Keycloak.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { PersistenceService, PersistenceError } from '../persistence/persistence-service';
import { RosterDirectory } from '../directory/roster-directory';
import {
  emitClassificationNotifications,
  listNotifications,
  unreadCount,
  markNotificationRead,
  resetNotificationPersistence,
  NOTIFICATION_DEEP_LINK,
  NOTIFICATION_TYPE_CLASSIFIED,
  SOURCE_STATE_NON_DURABLE,
  SOURCE_STATE_NOTE,
  type NotificationAuditEvent,
} from './notification-service';
import { handleNotificationRequest, createAdminExecutor, createReadExecutor } from '../admin-transport';
import type { OidcVerifier } from '../../src/core/auth/keycloakAdapter';

const tmpDirs: string[] = [];
function tmpDir(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'iips-p1-'));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
  resetNotificationPersistence();
});
beforeEach(() => resetNotificationPersistence());

function store(): PersistenceService {
  return new PersistenceService({ dataDir: tmpDir() });
}

/** Roster seeded with two tenant-A admins, one disabled admin, one analyst, one tenant-less. */
function seededRoster(): RosterDirectory {
  const d = new RosterDirectory({ persistence: new PersistenceService({ dataDir: tmpDir() }) });
  d.applySnapshot({
    realm: 'iips',
    users: [
      { userId: 'admin-a', tenantId: 'tenant-A', roles: ['iips-admin'], enabled: true },
      { userId: 'admin-a2', tenantId: 'tenant-A', roles: ['iips-admin'], enabled: true },
      { userId: 'admin-off', tenantId: 'tenant-A', roles: ['iips-admin'], enabled: false },
      { userId: 'analyst-a', tenantId: 'tenant-A', roles: ['iips-analyst'], enabled: true },
      { userId: 'admin-b', tenantId: 'tenant-B', roles: ['iips-admin'], enabled: true },
      { userId: 'no-tenant', tenantId: '', roles: ['iips-admin'], enabled: true },
    ],
  });
  return d;
}

/** Roster that has never synced -> adminsOf throws RosterError('NO_SYNC'). */
function unsyncedRoster(): RosterDirectory {
  return new RosterDirectory({ persistence: new PersistenceService({ dataDir: tmpDir() }) });
}

function emit(directory: RosterDirectory, persistence: PersistenceService, audit?: (e: NotificationAuditEvent) => void) {
  return emitClassificationNotifications({
    tenantId: 'tenant-A', dataId: 'biz-data-A', classification: 'internal',
    actorUserId: 'admin-a', directory, persistence, ...(audit ? { audit } : {}),
  });
}

// --- Fan-out, recipients, identity -------------------------------------------------------

describe('T-1..T-4 fan-out and event identity', () => {
  it('T-1: one record per adminsOf() recipient', () => {
    const s = store();
    const r = emit(seededRoster(), s);
    expect(r.outcome).toBe('delivered');
    expect(r.recipientCount).toBe(2);            // admin-a, admin-a2
    expect(r.persistedCount).toBe(2);
    expect(listNotifications('tenant-A', 'admin-a', s)).toHaveLength(1);
    expect(listNotifications('tenant-A', 'admin-a2', s)).toHaveLength(1);
  });

  it('T-2: disabled, non-admin and tenant-less users are excluded', () => {
    const s = store();
    emit(seededRoster(), s);
    expect(listNotifications('tenant-A', 'admin-off', s)).toHaveLength(0);
    expect(listNotifications('tenant-A', 'analyst-a', s)).toHaveLength(0);
    expect(listNotifications('', 'no-tenant', s)).toHaveLength(0);
  });

  it('T-3: recipients are derived server-side; no client input is accepted', () => {
    const s = store();
    emit(seededRoster(), s);
    // Only roster-derived admins hold records; an arbitrary user never does.
    expect(listNotifications('tenant-A', 'attacker', s)).toHaveLength(0);
  });

  it('T-4: exactly ONE eventId per event, shared across all recipient records', () => {
    const s = store();
    const r = emit(seededRoster(), s);
    const a = listNotifications('tenant-A', 'admin-a', s)[0];
    const b = listNotifications('tenant-A', 'admin-a2', s)[0];
    expect(a.eventId).toBe(b.eventId);
    expect(a.eventId).toBe(r.eventId);
    expect(a.notificationId).not.toBe(b.notificationId); // distinct records
    expect(a.type).toBe(NOTIFICATION_TYPE_CLASSIFIED);
  });
});

// --- Dedup, ordering, isolation ----------------------------------------------------------

describe('T-5..T-8 dedup, isolation, ordering', () => {
  it('T-5: replaying the same eventId creates no duplicate per recipient', () => {
    const s = store();
    const directory = seededRoster();
    const first = emit(directory, s);
    // Simulate an exact replay by re-appending with the same dedupKey.
    s.append({ tenantId: 'tenant-A', ownerUserId: 'admin-a', dedupKey: first.eventId, payload: { replay: true } });
    expect(listNotifications('tenant-A', 'admin-a', s)).toHaveLength(1);
  });

  it('T-6: tenant isolation — another tenant never sees the notification', () => {
    const s = store();
    emit(seededRoster(), s);
    expect(listNotifications('tenant-B', 'admin-b', s)).toHaveLength(0);
    expect(listNotifications('tenant-B', 'admin-a', s)).toHaveLength(0);
  });

  it('T-7: recipient scoping (PD4) — an admin never sees another user\'s notification', () => {
    const s = store();
    emit(seededRoster(), s);
    const own = listNotifications('tenant-A', 'admin-a', s);
    expect(own).toHaveLength(1);
    expect(own[0].recipientUserId).toBe('admin-a');
    // admin-a cannot reach admin-a2's record by id
    const otherId = listNotifications('tenant-A', 'admin-a2', s)[0].notificationId;
    expect(markNotificationRead('tenant-A', 'admin-a', otherId, s)).toBeUndefined();
  });

  it('T-8: ordering is createdAt DESC and deterministic', () => {
    const s = store();
    const d = seededRoster();
    emit(d, s); emit(d, s); emit(d, s);
    const list = listNotifications('tenant-A', 'admin-a', s);
    expect(list).toHaveLength(3);
    const times = list.map((n) => n.createdAt);
    expect([...times].sort().reverse()).toEqual(times);
  });
});

// --- Unread count, mark-read, non-reversibility ------------------------------------------

describe('T-9, T-14, T-15 unread count and mark-read', () => {
  it('T-9: unread count is own-unread only', () => {
    const s = store();
    emit(seededRoster(), s);
    expect(unreadCount('tenant-A', 'admin-a', s)).toBe(1);
    expect(unreadCount('tenant-B', 'admin-b', s)).toBe(0);
  });

  it('T-14: mark-read is idempotent', () => {
    const s = store();
    emit(seededRoster(), s);
    const id = listNotifications('tenant-A', 'admin-a', s)[0].notificationId;
    const first = markNotificationRead('tenant-A', 'admin-a', id, s);
    const second = markNotificationRead('tenant-A', 'admin-a', id, s);
    expect(first?.read).toBe(true);
    expect(second?.read).toBe(true);
    expect(unreadCount('tenant-A', 'admin-a', s)).toBe(0);
  });

  it('T-15: read is NON-REVERSIBLE — no service path can set read=false', () => {
    const s = store();
    emit(seededRoster(), s);
    const id = listNotifications('tenant-A', 'admin-a', s)[0].notificationId;
    markNotificationRead('tenant-A', 'admin-a', id, s);
    // The exported signature accepts no boolean; re-invoking cannot unset it.
    expect(markNotificationRead('tenant-A', 'admin-a', id, s)?.read).toBe(true);
    expect(markNotificationRead.length).toBeLessThanOrEqual(4); // (tenant, owner, id, store)
  });
});

// --- Failure semantics (U-2c / U-2d / U-2d(ii)) ------------------------------------------

describe('T-11..T-13, T-25 failure semantics', () => {
  it('T-11: NO_SYNC -> fan-out skipped entirely; never an empty-roster fan-out', () => {
    const s = store();
    const events: NotificationAuditEvent[] = [];
    const r = emitClassificationNotifications({
      tenantId: 'tenant-A', dataId: 'biz-data-A', classification: 'internal', actorUserId: 'admin-a',
      directory: unsyncedRoster(), persistence: s, audit: (e) => events.push(e),
    });
    expect(r.outcome).toBe('skipped-no-sync');
    expect(r.errorCode).toBe('NO_SYNC');
    expect(r.recipientCount).toBe(0);
    expect(r.persistedCount).toBe(0);
    expect(events[0].outcome).toBe('skipped-no-sync');
  });

  it('T-12: WRITE_FAILED -> reported, never thrown; no rollback', () => {
    const failing = {
      append() { throw new PersistenceError('WRITE_FAILED', 'journal append failed'); },
      listOrdered: () => [], readById: () => undefined, updateReadState: () => undefined, exists: () => false,
    } as unknown as PersistenceService;
    const events: NotificationAuditEvent[] = [];
    const r = emitClassificationNotifications({
      tenantId: 'tenant-A', dataId: 'biz-data-A', classification: 'internal', actorUserId: 'admin-a',
      directory: seededRoster(), persistence: failing, audit: (e) => events.push(e),
    });
    expect(r.outcome).toBe('failed');
    expect(r.errorCode).toBe('WRITE_FAILED');
    expect(r.persistedCount).toBe(0);
    expect(events[0].outcome).toBe('failed');
  });

  it('T-13: partial fan-out keeps already-persisted records; no atomicity', () => {
    const real = store();
    let calls = 0;
    const flaky = {
      append(input: Parameters<PersistenceService['append']>[0]) {
        calls += 1;
        if (calls === 2) throw new PersistenceError('WRITE_FAILED', 'second recipient fails');
        return real.append(input);
      },
      listOrdered: real.listOrdered.bind(real),
      readById: real.readById.bind(real),
      updateReadState: real.updateReadState.bind(real),
      exists: real.exists.bind(real),
    } as unknown as PersistenceService;

    const r = emitClassificationNotifications({
      tenantId: 'tenant-A', dataId: 'biz-data-A', classification: 'internal', actorUserId: 'admin-a',
      directory: seededRoster(), persistence: flaky,
    });
    expect(r.outcome).toBe('partial');
    expect(r.persistedCount).toBe(1);
    // The FIRST recipient KEEPS its record — not rolled back.
    expect(listNotifications('tenant-A', 'admin-a', real)).toHaveLength(1);
    expect(listNotifications('tenant-A', 'admin-a2', real)).toHaveLength(0);
  });

  it('T-25: emission NEVER throws, so classification can never be coupled to it', () => {
    const exploding = { append() { throw new Error('catastrophic'); } } as unknown as PersistenceService;
    expect(() => emitClassificationNotifications({
      tenantId: 'tenant-A', dataId: 'x', classification: 'public', actorUserId: 'admin-a',
      directory: seededRoster(), persistence: exploding,
    })).not.toThrow();
    const broken = { adminsOf() { throw new Error('boom'); } } as unknown as RosterDirectory;
    expect(() => emitClassificationNotifications({
      tenantId: 'tenant-A', dataId: 'x', classification: 'public', actorUserId: 'admin-a',
      directory: broken, persistence: store(),
    })).not.toThrow();
  });
});

// --- DG-1′ provenance + deep link ---------------------------------------------------------

describe('T-18..T-20 deep link and DG-1′ provenance', () => {
  it('T-18: deepLink is exactly /admin/data (no per-resource route)', () => {
    const s = store();
    emit(seededRoster(), s);
    const n = listNotifications('tenant-A', 'admin-a', s)[0];
    expect(n.deepLink).toBe('/admin/data');
    expect(NOTIFICATION_DEEP_LINK).toBe('/admin/data');
    expect(n.deepLink).not.toMatch(/\/admin\/data\/.+/);
  });

  it('T-19: sourceStateDurability is present on every notification', () => {
    const s = store();
    emit(seededRoster(), s);
    for (const u of ['admin-a', 'admin-a2']) {
      expect(listNotifications('tenant-A', u, s)[0].sourceStateDurability).toBe(SOURCE_STATE_NON_DURABLE);
    }
  });

  it('T-20: the approved U-4 wording is present character-for-character', () => {
    const s = store();
    emit(seededRoster(), s);
    expect(listNotifications('tenant-A', 'admin-a', s)[0].sourceStateNote).toBe(
      'Historical record — the classification shown here was recorded at the time of this event and is not the current stored state.',
    );
    expect(SOURCE_STATE_NOTE).toBe(
      'Historical record — the classification shown here was recorded at the time of this event and is not the current stored state.',
    );
  });
});

// --- Transport: authorization, envelope, 404 ---------------------------------------------

const METADATA = { issuer: 'http://localhost:8080/realms/iips', jwksUri: 'http://localhost:8080/realms/iips/certs', clientId: 'iips-spa' };
function verifier(claims: Record<string, unknown>): OidcVerifier {
  return { verify: vi.fn().mockResolvedValue({ subject: 'u1', claims, expiry: Date.now() / 1000 + 3600 }) };
}
function claimsFor(username: string, role: string, tenant = 'tenant-A'): Record<string, unknown> {
  return { iss: METADATA.issuer, aud: 'iips-spa', preferred_username: username, tenant, realm_access: { roles: [role] } };
}

async function call(
  who: { user: string; role: string; tenant?: string } | null,
  urlPath: string,
  method: 'GET' | 'POST',
  s: PersistenceService,
  useAdminExecutor = false,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const deps = { metadata: METADATA, verifier: verifier(claimsFor(who?.user ?? 'admin-a', who?.role ?? 'iips-admin', who?.tenant)) };
  const executor = useAdminExecutor ? createAdminExecutor(deps) : createReadExecutor(deps);
  const server = http.createServer((req, res) => {
    void handleNotificationRequest(req, res, executor, { store: s });
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}${urlPath}`, {
      method, headers: who ? { Authorization: 'Bearer t' } : {},
    });
    return { status: res.status, body: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}

describe('T-9, T-10, T-16, T-17 transport contract', () => {
  it('T-9: GET envelope carries data + unreadCount + provenance', async () => {
    const s = store();
    emit(seededRoster(), s);
    const { status, body } = await call({ user: 'admin-a', role: 'iips-admin' }, '/api/notifications', 'GET', s);
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.unreadCount).toBe(1);
    expect((body.provenance as Record<string, string>).authority).toBe('PLATFORM');
  });

  it('T-10: there is NO dedicated unread-count endpoint', async () => {
    const s = store();
    const { status } = await call({ user: 'admin-a', role: 'iips-admin' }, '/api/notifications/unread-count', 'GET', s);
    expect(status).toBe(404);
  });

  it('T-16: mark-read is NOT admin-only — a non-admin recipient may mark own read', async () => {
    const s = store();
    // Seed a notification addressed to an analyst recipient directly.
    s.append({ tenantId: 'tenant-A', ownerUserId: 'analyst-a', dedupKey: 'evt-1', payload: {
      eventId: 'evt-1', type: NOTIFICATION_TYPE_CLASSIFIED, title: 't', summary: null,
      deepLink: NOTIFICATION_DEEP_LINK, sourceStateDurability: SOURCE_STATE_NON_DURABLE,
      sourceStateNote: SOURCE_STATE_NOTE, dataId: 'd', classification: 'public', actorUserId: 'admin-a',
    } });
    const id = listNotifications('tenant-A', 'analyst-a', s)[0].notificationId;
    const { status, body } = await call({ user: 'analyst-a', role: 'iips-analyst' }, `/api/notifications/${id}/read`, 'POST', s);
    expect(status).toBe(200);
    expect((body.data as Record<string, unknown>).read).toBe(true);
  });

  it('T-17: 401 unauthenticated', async () => {
    const s = store();
    const { status } = await call(null, '/api/notifications', 'GET', s);
    expect(status).toBe(401);
  });

  it('T-17: 404 for an unknown or foreign notification id', async () => {
    const s = store();
    emit(seededRoster(), s);
    const foreign = listNotifications('tenant-A', 'admin-a2', s)[0].notificationId;
    expect((await call({ user: 'admin-a', role: 'iips-admin' }, '/api/notifications/does-not-exist/read', 'POST', s)).status).toBe(404);
    // admin-a may not mark admin-a2's notification read -> indistinguishable 404
    expect((await call({ user: 'admin-a', role: 'iips-admin' }, `/api/notifications/${foreign}/read`, 'POST', s)).status).toBe(404);
  });

  it('R-1-a evidence: the ADMIN executor would 403 this read gate (hence read-executor dispatch)', async () => {
    const s = store();
    const { status } = await call({ user: 'admin-a', role: 'iips-admin' }, '/api/notifications', 'GET', s, true);
    expect(status).toBe(403);
  });

  it('T-6/T-7 over HTTP: another tenant sees nothing', async () => {
    const s = store();
    emit(seededRoster(), s);
    const { body } = await call({ user: 'admin-b', role: 'iips-admin', tenant: 'tenant-B' }, '/api/notifications', 'GET', s);
    expect((body.data as unknown[]).length).toBe(0);
    expect(body.unreadCount).toBe(0);
  });
});

// --- Prohibited-work guarantees ----------------------------------------------------------

describe('T-21..T-24 prohibited work', () => {
  it('T-21/T-23/T-24: service CODE contains no secret, scheduler, event bus, or rollback', () => {
    // Scan executable code only — comments legitimately mention these terms to assert absence.
    const raw = fs.readFileSync(path.resolve(__dirname, './notification-service.ts'), 'utf8');
    const code = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')      // block comments
      .split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
      .join('\n');
    expect(code).not.toMatch(/setInterval|setTimeout|cron|worker_threads|new Worker/);
    expect(code).not.toMatch(/EventEmitter|eventBus|publish\(|subscribe\(/);
    expect(code).not.toMatch(/rollback|beginTransaction|commitTransaction|retryQueue/);
    expect(code).not.toMatch(/SecretAuthority|useSecret|client_secret/);
  });

  it('T-22: only the existing guardRead primitive is used (no new RBAC model)', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../admin-transport.ts'), 'utf8');
    const handler = src.slice(src.indexOf('export async function handleNotificationRequest'));
    const body = handler.slice(0, handler.indexOf('\nexport type AdminSyncTrigger'));
    expect(body).toContain('guardRead(executor, token, \'notifications\')');
    expect(body).not.toContain('guardAdmin');
  });
});
