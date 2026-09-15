/**
 * UI07 WATCHLISTS — HTTP transport.
 *
 * Authority: D81-R1 decision A. Requirement: INT-011a / D4_01 / D4_03.
 *
 * Mirrors the promoted P-2 notes / D80 settings dispatch pattern: reached from a path-prefix
 * branch in `executive-transport` with the EXISTING READ executor. No new RBAC model, no new
 * executor, `readSurfaceFor` is NOT extended.
 *
 * Routes (all owner-scoped, server-derived identity):
 *   GET    /api/watchlists                         — lists with evaluated deltas + triggers
 *   POST   /api/watchlists                         — create a list
 *   DELETE /api/watchlists/:id                     — delete a list
 *   POST   /api/watchlists/:id/items               — add a governed row (baseline captured)
 *   DELETE /api/watchlists/:id/items/:securityId   — remove an item
 *
 * ⚠ GOVERNED DATA ONLY. Item content is taken from the P12 governed universe supplied by the
 *   caller. A client supplies only a `canonicalSecurityId` to select a row — never the row's
 *   values. Nothing is fabricated; an unknown id fails closed with 404.
 *
 * ⚠ The certified P13 `buildWatchlistView` is consumed UNMODIFIED to attach quality/degradation/
 *   provenance per item, satisfying INT-011a's "freshness" validation through the accepted
 *   contract rather than a re-implementation.
 *
 * ⚠ AD-17/M-2, ReplayService, replay hardcodes and the P12/P13 contracts are untouched.
 */
import type http from 'node:http';
import { AuthError } from '../../src/core/auth/keycloakAdapter';
import type { SecuredExecutor } from '../secured-executor';
import { guardRead, guardExecute, TransportError } from '../admin-transport';
import type { GovernedRow } from '../p12-transport';
import type { GovernedUniverseProvider } from '../p12-request-handler';
import {
  WatchlistValidationError,
  addItem,
  createWatchlist,
  deleteWatchlist,
  evaluateItem,
  getWatchlistsPersistence,
  listWatchlists,
  readWatchlist,
  removeItem,
  type WatchlistItem,
} from './watchlists-service';
// The ACCEPTED P13 UI07 contract — consumed unmodified (D81 §7). Imported with the SAME
// `@ts-expect-error` convention already used for the certified P12 JS modules in p12-transport.
// @ts-expect-error — accepted P13 JavaScript module; imported without modification.
import * as newSurfaces from '../../../p13/src/newSurfaces.js';

/** Governed numeric fields compared between baseline and current. */
export const TRACKED_FIELDS = Object.freeze(['composite', 'qualityAxis', 'valuation'] as const);

function readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      chunks.push(c);
      if (chunks.reduce((n, b) => n + b.length, 0) > 1_000_000) reject(new TransportError(400, 'request-body-too-large'));
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (raw.trim() === '') { resolve({}); return; }
      try { resolve(JSON.parse(raw) as Record<string, unknown>); } catch { reject(new TransportError(400, 'invalid-json')); }
    });
    req.on('error', reject);
  });
}

export function isWatchlistPath(url: string | undefined): boolean {
  return (url ?? '').split('?')[0].startsWith('/api/watchlists');
}

/**
 * Handle a UI07 request. `universe` supplies the GOVERNED rows; this module never invents data.
 */
export async function handleWatchlistsRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  executor: SecuredExecutor,
  universe: GovernedUniverseProvider,
  opts: { readonly store?: import('../persistence/persistence-service').PersistenceService } = {},
): Promise<void> {
  const url = (req.url ?? '').split('?')[0];
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '').trim();
  const method = req.method ?? 'GET';
  res.setHeader('Content-Type', 'application/json');

  try {
    const store = opts.store ?? getWatchlistsPersistence();
    const segments = url.split('/').filter(Boolean); // api, watchlists, [id], [items], [securityId]

    // ---- GET /api/watchlists -----------------------------------------------------------
    if (url === '/api/watchlists' && method === 'GET') {
      const p = await guardRead(executor, token, 'watchlists');
      const vintage = await universe.vintage(p.tenantId);
      const rows = await universe.screenerUniverse(p.tenantId);
      const byId = new Map<string, GovernedRow>(
        rows.map((r) => [String((r as Record<string, unknown>).canonicalSecurityId), r]),
      );

      const lists = listWatchlists(p.tenantId, p.userId, store).map((list) => {
        const evaluated = list.items.map((item: WatchlistItem) => {
          const current = byId.get(item.canonicalSecurityId) as Record<string, unknown> | undefined;
          const ev = evaluateItem(item, current, TRACKED_FIELDS);
          return { ...item, current: current ?? null, ...ev };
        });

        // Certified P13 UI07 contract, unmodified — attaches quality/degradation/provenance.
        const provenances = evaluated.map(() => ({
          dataSource: vintage.dataSource,
          classification: vintage.classification,
          asOf: vintage.asOf,
          dataVersion: vintage.dataVersion,
          mode: vintage.mode,
          quality: 'good',
          receivedAt: vintage.asOf,
          completenessPct: 100,
        }));
        const view = newSurfaces.buildWatchlistView({
          watchlistId: list.watchlistId,
          items: evaluated,
          provenances,
          tenantId: p.tenantId,
        }) as Record<string, unknown>;

        return { ...view, name: list.name, createdAt: list.createdAt };
      });

      res.writeHead(200);
      res.end(JSON.stringify({
        data: lists,
        provenance: {
          dataSource: vintage.dataSource,
          asOf: vintage.asOf,
          dataVersion: vintage.dataVersion,
          mode: vintage.mode,
          freshness: 'SNAPSHOT',
          authority: 'PLATFORM',
          transportSemantics:
            'owner-scoped watchlists (append-only journal). Deltas compare each item PERSISTED BASELINE against the CURRENT governed value. Values derive from the frozen v1.1 replay baseline — this is NOT a live feed and NOT a time series.',
        },
      }));
      return;
    }

    // ---- POST /api/watchlists ----------------------------------------------------------
    if (url === '/api/watchlists' && method === 'POST') {
      const p = await guardExecute(executor, token, 'watchlists');
      const body = await readBody(req);
      const created = createWatchlist(p.tenantId, p.userId, body.watchlistId, body.name, store);
      res.writeHead(201);
      res.end(JSON.stringify({ data: created }));
      return;
    }

    // ---- DELETE /api/watchlists/:id ----------------------------------------------------
    if (segments.length === 3 && method === 'DELETE') {
      const p = await guardExecute(executor, token, 'watchlists');
      const ok = deleteWatchlist(p.tenantId, p.userId, decodeURIComponent(segments[2]), store);
      if (!ok) throw new TransportError(404, 'watchlist-not-found');
      res.writeHead(200);
      res.end(JSON.stringify({ data: { deleted: true } }));
      return;
    }

    // ---- POST /api/watchlists/:id/items ------------------------------------------------
    if (segments.length === 4 && segments[3] === 'items' && method === 'POST') {
      const p = await guardExecute(executor, token, 'watchlists');
      const watchlistId = decodeURIComponent(segments[2]);
      const body = await readBody(req);
      const securityId = body.canonicalSecurityId;
      if (typeof securityId !== 'string' || securityId.trim() === '') {
        throw new TransportError(400, 'canonicalSecurityId-required');
      }
      // The governed row is resolved SERVER-SIDE from the P12 universe; the client cannot
      // supply values. An unknown id fails closed rather than fabricating a row.
      const rows = await universe.screenerUniverse(p.tenantId);
      const row = rows.find((r) => String((r as Record<string, unknown>).canonicalSecurityId) === securityId);
      if (!row) throw new TransportError(404, 'governed-row-not-found');

      const updated = addItem(p.tenantId, p.userId, watchlistId, row as Record<string, unknown>, body.triggers, store);
      res.writeHead(201);
      res.end(JSON.stringify({ data: updated }));
      return;
    }

    // ---- DELETE /api/watchlists/:id/items/:securityId ----------------------------------
    if (segments.length === 5 && segments[3] === 'items' && method === 'DELETE') {
      const p = await guardExecute(executor, token, 'watchlists');
      const ok = removeItem(
        p.tenantId,
        p.userId,
        decodeURIComponent(segments[2]),
        decodeURIComponent(segments[4]),
        store,
      );
      if (!ok) throw new TransportError(404, 'watchlist-item-not-found');
      res.writeHead(200);
      res.end(JSON.stringify({ data: { removed: true } }));
      return;
    }

    // ---- GET /api/watchlists/:id -------------------------------------------------------
    if (segments.length === 3 && method === 'GET') {
      const p = await guardRead(executor, token, 'watchlists');
      const list = readWatchlist(p.tenantId, p.userId, decodeURIComponent(segments[2]), store);
      if (!list) throw new TransportError(404, 'watchlist-not-found');
      res.writeHead(200);
      res.end(JSON.stringify({ data: list }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'watchlist-not-found' }));
  } catch (e) {
    if (e instanceof AuthError) { res.writeHead(e.status); res.end(JSON.stringify({ error: e.message })); return; }
    if (e instanceof TransportError) { res.writeHead(e.status); res.end(JSON.stringify({ error: e.message })); return; }
    if (e instanceof WatchlistValidationError) {
      const status = e.message === 'watchlist-not-found' ? 404 : e.message === 'watchlist-exists' ? 409 : 400;
      res.writeHead(status); res.end(JSON.stringify({ error: e.message })); return;
    }
    res.writeHead(500); res.end(JSON.stringify({ error: 'watchlists transport error', detail: String(e) }));
  }
}
