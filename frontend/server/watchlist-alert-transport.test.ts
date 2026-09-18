import { describe, expect, it } from 'vitest';
import { Readable } from 'node:stream';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PersistenceService } from './persistence/persistence-service';
import { WatchlistAlertApi } from './watchlist-alert-api';
import { WatchlistAlertPersistence } from './watchlist-alert-persistence';
import { handleWatchlistAlertRequest } from './watchlist-alert-transport';
import type { SecuredExecutor } from './secured-executor';

function executor(principal?: { userId: string; tenantId: string }): SecuredExecutor {
  return { authenticate: async (token: string) => { if (!principal || token !== 'valid') throw Object.assign(new Error('unauthenticated'), { code: 'UNAUTHORIZED' }); return principal; }, authorize: () => undefined } as unknown as SecuredExecutor;
}
function request(method: string, path: string, payload?: unknown, auth = 'Bearer valid') {
  const req = Readable.from(payload === undefined ? [] : [JSON.stringify(payload)]) as Readable & { method: string; url: string; headers: Record<string, string> };
  req.method = method; req.url = path; req.headers = { authorization: auth };
  return req;
}
function response() { let status = 0; let text = ''; return { writeHead: (s: number) => { status = s; }, end: (b?: string) => { text = b ?? ''; }, result: () => ({ status, body: JSON.parse(text || '{}') }) }; }

describe('G-018 authenticated transport', () => {
  it('rejects unauthenticated Watchlist and Alert operations', async () => {
    const root = mkdtempSync(join(tmpdir(), 'g018-http-'));
    try {
      const api = new WatchlistAlertApi(new WatchlistAlertPersistence({ journal: new PersistenceService({ dataDir: root }) }));
      for (const [method, path] of [['GET', '/api/watchlists'], ['POST', '/api/watchlists'], ['GET', '/api/alerts'], ['POST', '/api/alerts/a/acknowledge'], ['POST', '/api/alerts/a/evidence']] as const) {
        const res = response(); await handleWatchlistAlertRequest(request(method, path, {}, 'Bearer bad') as never, res as never, executor(), api); expect(res.result().status).toBe(401);
      }
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('covers all unauthenticated transport operations', async () => {
    const root = mkdtempSync(join(tmpdir(), 'g018-http-'));
    try {
      const api = new WatchlistAlertApi(new WatchlistAlertPersistence({ journal: new PersistenceService({ dataDir: root }) }));
      const paths = [['PATCH', '/api/watchlists/w1'], ['POST', '/api/watchlists/w1/memberships'], ['POST', '/api/watchlists/w1/rules'], ['GET', '/api/alerts'], ['POST', '/api/alerts/a/acknowledge'], ['POST', '/api/alerts/a/evidence']] as const;
      for (const [method, path] of paths) { const res = response(); await handleWatchlistAlertRequest(request(method, path, {}, 'Bearer bad') as never, res as never, executor(), api); expect(res.result().status).toBe(401); }
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('fails closed for malformed input and preserves forbidden semantics', async () => {
    const root = mkdtempSync(join(tmpdir(), 'g018-http-'));
    try {
      const api = new WatchlistAlertApi(new WatchlistAlertPersistence({ journal: new PersistenceService({ dataDir: root }) }));
      const invalid = response(); await handleWatchlistAlertRequest(request('POST', '/api/watchlists', {}) as never, invalid as never, executor({ userId: 'u1', tenantId: 't1' }), api); expect(invalid.result().status).toBe(422);
      const denied = response(); const e = executor({ userId: 'u1', tenantId: 't1' }); e.authorize = () => { throw Object.assign(new Error('forbidden'), { code: 'FORBIDDEN' }); }; await handleWatchlistAlertRequest(request('GET', '/api/watchlists') as never, denied as never, e, api); expect(denied.result().status).toBe(403);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('derives scope from the authenticated principal and rejects foreign updates', async () => {
    const root = mkdtempSync(join(tmpdir(), 'g018-http-'));
    try {
      const api = new WatchlistAlertApi(new WatchlistAlertPersistence({ journal: new PersistenceService({ dataDir: root }) }));
      const owner = { ownerUserId: 'u1', tenantId: 't1' };
      const created = api.createWatchlist(owner, 'Private');
      const res = response(); await handleWatchlistAlertRequest(request('PATCH', `/api/watchlists/${created.watchlistId}`, { name: 'stolen', tenantId: 't1', ownerUserId: 'u1' }) as never, res as never, executor({ userId: 'u2', tenantId: 't1' }), api);
      expect(res.result().status).toBe(404);
      const list = response(); await handleWatchlistAlertRequest(request('GET', '/api/watchlists') as never, list as never, executor({ userId: owner.ownerUserId, tenantId: owner.tenantId }), api); expect(list.result().status).toBe(200); expect(list.result().body.data).toHaveLength(1);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
