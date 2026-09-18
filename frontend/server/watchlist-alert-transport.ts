/** G-018 A1 — authenticated HTTP transport for the bounded Watchlist/Alert facade. */
import type http from 'node:http';
import { guardExecute, guardRead } from './admin-transport';
import type { SecuredExecutor } from './secured-executor';
import { WatchlistAlertApi } from './watchlist-alert-api';
import type { PrincipalScope } from './watchlist-alert-persistence';

function token(req: http.IncomingMessage): string { return (req.headers.authorization ?? '').replace(/^Bearer /, '').trim(); }
function scope(principal: { tenantId: string; userId: string }): PrincipalScope { return { tenantId: principal.tenantId, ownerUserId: principal.userId }; }
function json(res: http.ServerResponse, status: number, body: unknown): void { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); }
async function body(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  let text = ''; for await (const chunk of req) text += String(chunk);
  if (!text) return {};
  try { const parsed = JSON.parse(text); return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}; } catch { return {}; }
}
function errorStatus(error: unknown): number {
  const code = (error as { code?: string }).code;
  const authStatus = (error as { status?: number }).status;
  return authStatus === 401 || code === 'UNAUTHORIZED' ? 401 : authStatus === 403 || code === 'FORBIDDEN' ? 403 : code === 'NOT_FOUND' ? 404 : code === 'CONFLICT' ? 409 : 422;
}

/** Returns false when the path is not a bounded Watchlist/Alert endpoint. */
export async function handleWatchlistAlertRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  executor: SecuredExecutor,
  api: WatchlistAlertApi,
): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname;
  if (!path.startsWith('/api/watchlists') && !path.startsWith('/api/alerts')) return false;
  try {
    const principal = req.method === 'GET' ? await guardRead(executor, token(req), 'watchlists') : await guardExecute(executor, token(req), 'watchlists');
    const s = scope(principal);
    if (path === '/api/watchlists' && req.method === 'GET') { json(res, 200, { data: api.listWatchlists(s) }); return true; }
    if (path === '/api/watchlists' && req.method === 'POST') { const b = await body(req); json(res, 201, { data: api.createWatchlist(s, String(b.name ?? '')) }); return true; }
    const watchlist = /^\/api\/watchlists\/([^/]+)$/.exec(path);
    if (watchlist && req.method === 'PATCH') { const b = await body(req); json(res, 200, { data: api.updateWatchlist(s, watchlist[1], String(b.name ?? '')) }); return true; }
    const membership = /^\/api\/watchlists\/([^/]+)\/memberships$/.exec(path);
    if (membership && req.method === 'POST') { const b = await body(req); json(res, 201, { data: api.addMembership(s, membership[1], { subjectType: b.subjectType as never, subjectId: String(b.subjectId ?? '') }) }); return true; }
    const rule = /^\/api\/watchlists\/([^/]+)\/rules$/.exec(path);
    if (rule && req.method === 'POST') { const b = await body(req); json(res, 201, { data: api.addRule(s, { ...b, ruleId: String(b.ruleId ?? ''), watchlistId: rule[1], kind: b.kind as never, subject: b.subject as never }) }); return true; }
    if (path === '/api/alerts' && req.method === 'GET') { json(res, 200, { data: api.listAlerts(s) }); return true; }
    const ack = /^\/api\/alerts\/([^/]+)\/acknowledge$/.exec(path);
    if (ack && req.method === 'POST') { const b = await body(req); json(res, 200, { data: api.acknowledgeAlert(s, { alertId: ack[1], acknowledgedBy: principal.userId, acknowledgedAt: String(b.acknowledgedAt ?? '') }) }); return true; }
    const evidence = /^\/api\/alerts\/([^/]+)\/evidence$/.exec(path);
    if (evidence && req.method === 'POST') { const b = await body(req); json(res, 201, { data: api.addEvidenceReference(s, { alertId: evidence[1], evidenceId: String(b.evidenceId ?? ''), ...(b.replayId !== undefined ? { replayId: String(b.replayId) } : {}) }) }); return true; }
    json(res, 404, { error: 'watchlist-alert endpoint not found' }); return true;
  } catch (e) { json(res, errorStatus(e), { error: e instanceof Error ? e.message : 'watchlist-alert request failed' }); return true; }
}
