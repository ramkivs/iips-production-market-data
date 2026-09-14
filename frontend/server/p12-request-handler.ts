/**
 * P13-B — P12 HTTP REQUEST HANDLER (ADDITIVE SURFACE)
 *
 * Authority: D54 P13-B Implementation Authorization (commit dce5cdb4)
 *
 * Purpose:
 *   Serve the four additive P12 endpoints bound by P13-B:
 *     POST /api/screener/execute   (P13-B-05 — C6)
 *     POST /api/screener/saved     (P13-B-05 — C6, definition validation only)
 *     GET  /api/resolve            (P13-B-06 — C7)
 *     GET  /api/search             (P13-B-06 — C7)
 *
 *   This mirrors the EXISTING additive dispatch pattern already used by
 *   `admin-transport` and `ai-advisory-transport`: a dedicated handler module reached
 *   from a path-prefix branch in `executive-transport`, using the existing authorization
 *   path. No new RBAC model, no new executor, no change to `readSurfaceFor`.
 *
 * Boundaries (hard — per D54 §5):
 *   ⚠ The 13 existing v2.0 routes are NOT touched by this module.
 *   ⚠ Tenant scoping is SERVER-ENFORCED and FAIL-CLOSED (401 when unresolved, 403 on
 *     cross-tenant, 404 on OR-2 unresolved identity, 400 on contract violation).
 *   ⚠ The governed universe supplied to C6/C7 is the caller's governed payload. Nothing
 *     is fabricated here; where no governed universe is available the endpoint FAILS
 *     CLOSED rather than inventing rows.
 *   ⚠ No certification is claimed by exposing these endpoints.
 */
import type http from 'node:http';
import {
  P12TransportError,
  buildP12Response,
  buildRequestContext,
  deriveProvenance,
  executeGovernedScreen,
  executeGovernedSearch,
  propagateRowQuality,
  resolveGovernedObject,
  saveGovernedScreenDefinition,
  p12SurfaceFor,
  type GovernedRow,
} from './p12-transport';

/** Governed universe provider — supplied by the caller (no fabrication in this module). */
export interface GovernedUniverseProvider {
  /** Rows eligible for screening (C6). */
  screenerUniverse(tenantId: string): Promise<readonly GovernedRow[]>;
  /** Objects eligible for search/resolution (C7). */
  searchUniverse(tenantId: string): Promise<readonly GovernedRow[]>;
  /** Securities eligible for identity resolution (C7). */
  securities(tenantId: string): Promise<readonly GovernedRow[]>;
  /** The governed as-of / vintage facts for the universe (DERIVED, never invented). */
  vintage(tenantId: string): Promise<{
    asOf: string;
    dataVersion: string;
    mode: string;
    dataSource: string;
    classification: string;
    contributingSnapshotIds: readonly string[];
  }>;
}

function readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      chunks.push(c);
      // Bounded read — refuse unbounded bodies.
      if (chunks.reduce((n, b) => n + b.length, 0) > 1_000_000) {
        reject(new P12TransportError(413, 'request body too large'));
      }
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (raw.trim() === '') { resolve({}); return; }
      try {
        resolve(JSON.parse(raw) as Record<string, unknown>);
      } catch {
        reject(new P12TransportError(400, 'request body is not valid JSON'));
      }
    });
    req.on('error', () => reject(new P12TransportError(400, 'request body read error')));
  });
}

function fail(res: http.ServerResponse, e: unknown): void {
  const status = e instanceof P12TransportError ? e.status : 500;
  const rules = e instanceof P12TransportError ? e.rules : [];
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: (e as Error).message ?? 'p12 transport error',
    rules,
    // Fail-closed disclosure: no partial data is emitted alongside an error.
    dataEmitted: false,
  }));
}

/**
 * Handle a P12 request. `tenantId` MUST already be the authenticated, server-resolved
 * tenant — this handler never derives authorization from client input.
 */
export async function handleP12Request(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  tenantId: string,
  universe: GovernedUniverseProvider,
  /**
   * R-3 (D74) — server-resolved owner for durable saved-screen persistence.
   *
   * OPTIONAL and additive: when omitted, saved-screen behaviour is exactly as before
   * (validate-only, no persistence). It is NEVER read from the request — the caller
   * derives it from the authenticated principal.
   */
  ownerUserId?: string,
): Promise<void> {
  const url = req.url ?? '';
  const path = url.split('?')[0];
  const surface = p12SurfaceFor(url);

  if (!surface) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
    return;
  }

  try {
    const vintage = await universe.vintage(tenantId);
    const query = Object.fromEntries(new URL(url, 'http://internal').searchParams.entries());

    // ---------------- P13-B-05 — Screener (C6) ----------------
    if (path === '/api/screener/execute') {
      if (req.method !== 'POST') { throw new P12TransportError(405, 'method not allowed — use POST'); }
      const body = await readBody(req);
      buildRequestContext({ tenantId, endpoint: path, body, query });

      const rows = await universe.screenerUniverse(tenantId);
      const result = executeGovernedScreen({
        universe: rows,
        filters: Array.isArray(body.filters) ? (body.filters as unknown[]) : [],
        sort: Array.isArray(body.sort) ? (body.sort as unknown[]) : [],
        tieBreakField: typeof body.tieBreakField === 'string' ? body.tieBreakField : 'canonicalSecurityId',
        asOf: typeof body.asOf === 'string' && body.asOf.length > 0 ? body.asOf : vintage.asOf,
        screenId: typeof body.screenId === 'string' && body.screenId.length > 0 ? body.screenId : 'ad-hoc',
        tenantId,
      });

      // P13-B-04 — worst-case propagation across the rows that actually contributed.
      const agg = propagateRowQuality((result.rows as GovernedRow[]) ?? []);
      const provenance = deriveProvenance({
        dataSource: vintage.dataSource,
        asOf: (result.asOf as string) ?? vintage.asOf,
        dataVersion: vintage.dataVersion,
        mode: vintage.mode,
        quality: agg.quality,
        completenessPct: agg.completenessPct,
        contributingSnapshotIds: vintage.contributingSnapshotIds,
        classification: vintage.classification,
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(buildP12Response({ data: result, provenance, tenantId, endpoint: path })));
      return;
    }

    if (path === '/api/screener/saved') {
      // R-3 (D74) — GET lists this principal's durable saved screens. Additive: the
      // pre-existing POST contract is unchanged.
      if (req.method === 'GET') {
        if (ownerUserId === undefined || ownerUserId === '') {
          throw new P12TransportError(401, 'owner unresolved for authenticated principal — fail-closed');
        }
        const store = await import('./persistence/saved-screens-store');
        const items = store.listScreens(store.savedScreensService(), tenantId, ownerUserId);
        const provenance = deriveProvenance({
          dataSource: vintage.dataSource,
          asOf: vintage.asOf,
          dataVersion: vintage.dataVersion,
          mode: vintage.mode,
          quality: 'good',
          completenessPct: 100,
          contributingSnapshotIds: vintage.contributingSnapshotIds,
          classification: vintage.classification,
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(buildP12Response({ data: items, provenance, tenantId, endpoint: path })));
        return;
      }
      if (req.method !== 'POST') { throw new P12TransportError(405, 'method not allowed — use POST'); }
      const body = await readBody(req);
      buildRequestContext({ tenantId, endpoint: path, body, query });

      const definition = saveGovernedScreenDefinition({
        screenId: body.screenId,
        filters: Array.isArray(body.filters) ? body.filters : [],
        sort: Array.isArray(body.sort) ? body.sort : [],
        tieBreakField: body.tieBreakField,
        tenantId,
      });

      // R-3 (D74) — persist AFTER the certified C6 contract has validated and built the
      // definition. Storage is transport-layer only; the contract is unchanged and the
      // definition object is stored verbatim. Without a resolved owner we do NOT persist
      // (and do not fabricate one) — behaviour then matches the prior validate-only path.
      let persisted: { recordId: string; createdAt: string } | null = null;
      if (ownerUserId !== undefined && ownerUserId !== '') {
        const store = await import('./persistence/saved-screens-store');
        const rec = store.saveScreen(
          store.savedScreensService(),
          tenantId,
          ownerUserId,
          String(body.screenId ?? ''),
          definition,
        );
        persisted = { recordId: rec.recordId, createdAt: rec.createdAt };
      }

      // No governed data rows are returned — provenance describes the definition vintage.
      const provenance = deriveProvenance({
        dataSource: vintage.dataSource,
        asOf: vintage.asOf,
        dataVersion: vintage.dataVersion,
        mode: vintage.mode,
        quality: 'good',
        completenessPct: 100,
        contributingSnapshotIds: vintage.contributingSnapshotIds,
        classification: vintage.classification,
      });

      // R-3 (D74): the certified definition is returned UNCHANGED. When the screen was
      // persisted, the durable record identity is added alongside it — additive only, so
      // every pre-existing field and its semantics are preserved.
      const data = persisted === null ? definition : { ...definition, persisted };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(buildP12Response({ data, provenance, tenantId, endpoint: path })));
      return;
    }

    // ---------------- P13-B-06 — Resolve / Search (C7) ----------------
    if (path === '/api/resolve') {
      if (req.method !== 'GET') { throw new P12TransportError(405, 'method not allowed — use GET'); }
      buildRequestContext({ tenantId, endpoint: path, query });

      const inputType = query.inputType ?? '';
      const inputValue = query.inputValue ?? '';
      const securities = await universe.securities(tenantId);

      // OR-2 fail-closed: an unresolved identity yields 404, never a placeholder.
      const resolved = resolveGovernedObject({
        inputType,
        inputValue,
        asOf: query.asOf || vintage.asOf,
        tenantId,
        securities,
      });

      const provenance = deriveProvenance({
        dataSource: vintage.dataSource,
        asOf: (resolved.asOf as string) ?? vintage.asOf,
        dataVersion: vintage.dataVersion,
        mode: vintage.mode,
        quality: 'good',
        completenessPct: 100,
        contributingSnapshotIds: vintage.contributingSnapshotIds,
        classification: vintage.classification,
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(buildP12Response({ data: resolved, provenance, tenantId, endpoint: path })));
      return;
    }

    if (path === '/api/search') {
      if (req.method !== 'GET') { throw new P12TransportError(405, 'method not allowed — use GET'); }
      buildRequestContext({ tenantId, endpoint: path, query });

      const objects = await universe.searchUniverse(tenantId);
      const result = executeGovernedSearch({
        universe: objects,
        query: query.q ?? '',
        ...(query.objectTypes ? { objectTypes: query.objectTypes.split(',') } : {}),
        asOf: query.asOf || vintage.asOf,
        tenantId,
        ...(query.maxResults ? { maxResults: Number(query.maxResults) } : {}),
      });

      const agg = propagateRowQuality((result.results as GovernedRow[]) ?? []);
      const provenance = deriveProvenance({
        dataSource: vintage.dataSource,
        asOf: vintage.asOf,
        dataVersion: vintage.dataVersion,
        mode: vintage.mode,
        quality: agg.quality,
        completenessPct: agg.completenessPct,
        contributingSnapshotIds: vintage.contributingSnapshotIds,
        classification: vintage.classification,
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(buildP12Response({ data: result, provenance, tenantId, endpoint: path })));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  } catch (e) {
    fail(res, e);
  }
}
