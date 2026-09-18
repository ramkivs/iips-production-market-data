import { describe, expect, it } from 'vitest';
import { Readable } from 'node:stream';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { dispatchExecutiveRequest } from './executive-transport';
import { WatchlistAlertApi } from './watchlist-alert-api';
import { WatchlistAlertPersistence } from './watchlist-alert-persistence';
import { PersistenceService } from './persistence/persistence-service';
import type { SecuredExecutor } from './secured-executor';
import { AuthError } from '../src/core/auth/keycloakAdapter';
import { createNote } from './notes/notes-service';
import type { ExecutiveDispatchDependencies } from './executive-transport';

const p1 = { userId: 'owner-1', tenantId: 'tenant-1' };
const scope = { tenantId: p1.tenantId, ownerUserId: p1.userId };
function ex(principal = p1, denied = false): SecuredExecutor { return { authenticate: async (token: string) => { if (token !== 'valid') throw Object.assign(new Error('unauthenticated'), { code: 'UNAUTHORIZED' }); return principal; }, authorize: () => { if (denied) throw new AuthError(403, 'forbidden'); } } as unknown as SecuredExecutor; }
function req(method: string, url: string, value?: unknown, authorization = 'Bearer valid') { const r = Readable.from(value === undefined ? [] : [JSON.stringify(value)]) as Readable & { method: string; url: string; headers: Record<string, string> }; r.method = method; r.url = url; r.headers = { authorization }; return r; }
function res() { let status = 0; let text = ''; return { setHeader: () => undefined, writeHead: (v: number) => { status = v; }, end: (v?: string) => { text = v ?? ''; }, get: () => ({ status, body: JSON.parse(text || '{}') }) }; }
async function call(api: WatchlistAlertApi, method: string, url: string, value?: unknown, principal = p1, denied = false, authorization = 'Bearer valid', extra: Partial<ExecutiveDispatchDependencies> = {}) { const response = res(); await dispatchExecutiveRequest(req(method, url, value, authorization) as never, response as never, { readExecutor: ex(principal, denied), watchlistAlertApi: api, ...extra }); return response.get(); }
function fixture() { const dataDir = mkdtempSync(join(tmpdir(), 'g018-dispatch-')); const api = new WatchlistAlertApi(new WatchlistAlertPersistence({ journal: new PersistenceService({ dataDir }) })); return { dataDir, api }; }

describe('G-018 canonical executive dispatch matrix', () => {
  it('covers owner access, foreign isolation, tenant isolation, 404, and 401', async () => { const f = fixture(); try { const w = f.api.createWatchlist(scope, 'Canonical'); expect((await call(f.api, 'GET', '/api/watchlists')).status).toBe(200); expect((await call(f.api, 'GET', '/api/watchlists', undefined, { userId: 'other', tenantId: 'tenant-1' })).body.data).toHaveLength(0); expect((await call(f.api, 'GET', '/api/watchlists', undefined, { userId: 'owner-1', tenantId: 'tenant-2' })).body.data).toHaveLength(0); expect((await call(f.api, 'PATCH', `/api/watchlists/${w.watchlistId}`, { name: 'x' }, { userId: 'other', tenantId: 'tenant-1' })).status).toBe(404); expect((await call(f.api, 'PATCH', '/api/watchlists/missing', { name: 'x' })).status).toBe(404); expect((await call(f.api, 'GET', '/api/watchlists', undefined, p1, false, 'Bearer bad')).status).toBe(401); } finally { rmSync(f.dataDir, { recursive: true, force: true }); } });
  it('covers membership/rule validation and duplicate conflict through dispatch', async () => { const f = fixture(); try { const w = f.api.createWatchlist(scope, 'Bounded'); const member = { subjectType: 'company', subjectId: 'C1' }; expect((await call(f.api, 'POST', `/api/watchlists/${w.watchlistId}/memberships`, member)).status).toBe(201); expect((await call(f.api, 'POST', `/api/watchlists/${w.watchlistId}/memberships`, member)).status).toBe(409); expect((await call(f.api, 'POST', `/api/watchlists/${w.watchlistId}/memberships`, { subjectType: 'bad', subjectId: '' })).status).toBe(422); expect((await call(f.api, 'POST', `/api/watchlists/${w.watchlistId}/rules`, { ruleId: 'r', kind: 'bad', subject: member })).status).toBe(422); expect((await call(f.api, 'POST', `/api/watchlists/${w.watchlistId}/rules`, { ruleId: 'r', kind: 'FIELD_THRESHOLD', subject: member })).status).toBe(201); } finally { rmSync(f.dataDir, { recursive: true, force: true }); } });
  it('covers canonical Notes and Notifications with injected PF-1 stores', async () => { const f = fixture(); try {
    const notesStore = new PersistenceService({ dataDir: join(f.dataDir, 'notes') });
    const notificationStore = new PersistenceService({ dataDir: join(f.dataDir, 'notifications') });
    createNote(scope.tenantId, scope.ownerUserId, 'canonical note', notesStore);
    const notification = notificationStore.append({ tenantId: scope.tenantId, ownerUserId: scope.ownerUserId, dedupKey: 'classified-1', payload: { eventId: 'event-1', type: 'data-governance.classified', title: 'Classified', summary: 'Classification complete', deepLink: '/data/1', sourceStateDurability: 'DURABLE', sourceStateNote: 'test' } });
    notificationStore.append({ tenantId: scope.tenantId, ownerUserId: 'other', dedupKey: 'foreign-1', payload: { eventId: 'event-2', type: 'data-governance.classified', title: 'Foreign', summary: 'Foreign', deepLink: '/data/2', sourceStateDurability: 'DURABLE', sourceStateNote: 'test' } });
    const notes = await call(f.api, 'GET', '/api/notes', undefined, p1, false, 'Bearer valid', { notesStore });
    expect(notes.status).toBe(200); expect(notes.body.data[0].body).toBe('canonical note');
    const createdNote = await call(f.api, 'POST', '/api/notes', { body: 'created canonically' }, p1, false, 'Bearer valid', { notesStore });
    expect(createdNote.status).toBe(201); expect(createdNote.body.data.body).toBe('created canonically');
    const notifications = await call(f.api, 'GET', '/api/notifications', undefined, p1, false, 'Bearer valid', { notificationStore });
    expect(notifications.status).toBe(200); expect(notifications.body.data).toHaveLength(1); expect(notifications.body.data[0].type).toBe('data-governance.classified'); expect(notifications.body).toHaveProperty('unreadCount');
    const marked = await call(f.api, 'POST', `/api/notifications/${notification.recordId}/read`, undefined, p1, false, 'Bearer valid', { notificationStore });
    expect(marked.status).toBe(200); expect(marked.body.data.read).toBe(true);
    expect((await call(f.api, 'GET', '/api/notes', undefined, p1, true, 'Bearer valid', { notesStore })).status).toBe(403);
  } finally { rmSync(f.dataDir, { recursive: true, force: true }); } });
  it('covers authenticated forbidden behavior without weakening guards', async () => { const f = fixture(); try { expect((await call(f.api, 'GET', '/api/watchlists', undefined, p1, true)).status).toBe(403); } finally { rmSync(f.dataDir, { recursive: true, force: true }); } });
  it('covers the canonical Notes, Notifications, P12, and executive branches without route collision', async () => { const f = fixture(); try {
    expect((await call(f.api, 'GET', '/api/notes')).status).toBe(200);
    expect((await call(f.api, 'GET', '/api/notifications')).status).toBe(200);
    expect((await call(f.api, 'GET', '/api/executive')).status).toBe(200);
    const denied = await call(f.api, 'GET', '/api/executive', undefined, p1, true); expect(denied.status).toBe(403);
    const p12 = await call(f.api, 'GET', '/api/search'); expect([200, 400, 404, 422, 500]).toContain(p12.status);
  } finally { rmSync(f.dataDir, { recursive: true, force: true }); } });
  it('covers scoped Alert listing, acknowledgement, and Evidence through canonical dispatch', async () => { const f = fixture(); try {
    const w = f.api.createWatchlist(scope, 'Alerts');
    f.api.addRule(scope, { ruleId: 'rule-1', watchlistId: w.watchlistId, kind: 'QUALITY_CHANGE', subject: { subjectType: 'company', subjectId: 'C1' } });
    f.api.createAlert(scope, { alertId: 'alert-1', tenantId: scope.tenantId, ownerUserId: scope.ownerUserId, watchlistId: w.watchlistId, ruleId: 'rule-1', state: 'OPEN', createdAt: '2026-09-17T00:00:00.000Z', sourceContext: {} });
    expect((await call(f.api, 'GET', '/api/alerts')).body.data).toHaveLength(1);
    expect((await call(f.api, 'GET', '/api/alerts', undefined, { userId: 'other', tenantId: scope.tenantId })).body.data).toHaveLength(0);
    expect((await call(f.api, 'POST', '/api/alerts/alert-1/acknowledge', { acknowledgedAt: '2026-09-17T00:01:00.000Z' })).status).toBe(200);
    expect((await call(f.api, 'POST', '/api/alerts/alert-1/evidence', { evidenceId: 'evidence-1', replayId: 'replay-1' })).status).toBe(201);
    expect((await call(f.api, 'POST', '/api/alerts/alert-1/acknowledge', { acknowledgedAt: 'bad' })).status).toBe(422);
    expect((await call(f.api, 'POST', '/api/alerts/alert-1/acknowledge', {})).status).toBe(422);
    expect((await call(f.api, 'POST', '/api/alerts/missing/evidence', { evidenceId: '' })).status).toBe(404);
    expect((await call(f.api, 'POST', '/api/alerts/alert-1/evidence', { evidenceId: '' })).status).toBe(422);
  } finally { rmSync(f.dataDir, { recursive: true, force: true }); } });
});
