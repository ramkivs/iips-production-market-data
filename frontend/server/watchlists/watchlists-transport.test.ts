/**
 * UI07 (D81) — Watchlists HTTP transport tests (offline, deterministic).
 *
 * Proves authorization, server-derived tenant/owner, tenant isolation, owner scoping,
 * cross-tenant denial, governed-row-only membership, provenance/freshness disclosure and
 * baseline-vs-current delta semantics at the HTTP boundary.
 *
 * Mirrors the promoted notes / UI12 settings HTTP harness exactly.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PersistenceService } from '../persistence/persistence-service';
import { resetWatchlistsPersistence } from './watchlists-service';
import { handleWatchlistsRequest } from './watchlists-transport';
import { createReadExecutor } from '../admin-transport';
import type { GovernedUniverseProvider } from '../p12-request-handler';
import type { OidcVerifier } from '../../src/core/auth/keycloakAdapter';

const METADATA = { issuer: 'http://localhost:8080/realms/iips', jwksUri: 'http://localhost:8080/realms/iips/certs', clientId: 'iips-spa' };

const ROW = Object.freeze({
  canonicalSecurityId: 'Banking',
  companyId: 'Banking',
  sector: 'Banking',
  verdict: 'BUY',
  composite: 72,
  qualityAxis: 80,
  valuation: 61,
  quality: 'good',
  completenessPct: 100,
  asOf: '2026-08-09T00:00:00.000Z',
});

const VINTAGE = {
  asOf: '2026-08-09T00:00:00.000Z',
  dataVersion: 'v1.1-replay-baseline',
  mode: 'SNAPSHOT',
  dataSource: 'governed:certified-v2.0-reference-universe',
  classification: 'REAL',
  contributingSnapshotIds: ['snap_Banking'] as readonly string[],
};

function universe(rows: readonly Record<string, unknown>[] = [ROW]): GovernedUniverseProvider {
  return {
    screenerUniverse: async () => rows,
    searchUniverse: async () => rows,
    securities: async () => rows,
    vintage: async () => VINTAGE,
  };
}

const tmpDirs: string[] = [];
function tmpDir(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'iips-ui07-'));
  tmpDirs.push(d);
  return d;
}
beforeEach(() => resetWatchlistsPersistence());
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
  resetWatchlistsPersistence();
});

function store(dir = tmpDir()): PersistenceService {
  return new PersistenceService({ dataDir: dir });
}

function verifier(claims: Record<string, unknown>): OidcVerifier {
  return { verify: vi.fn().mockResolvedValue({ subject: 'u1', claims, expiry: Date.now() / 1000 + 3600 }) };
}
function claimsFor(username: string, role: string, tenant = 'tenant-A'): Record<string, unknown> {
  return { iss: METADATA.issuer, aud: 'iips-spa', preferred_username: username, tenant, realm_access: { roles: [role] } };
}

async function call(
  who: { user: string; role: string; tenant?: string } | null,
  urlPath: string,
  method: 'GET' | 'POST' | 'DELETE',
  s: PersistenceService,
  body?: unknown,
  u: GovernedUniverseProvider = universe(),
): Promise<{ status: number; body: Record<string, unknown> }> {
  const deps = { metadata: METADATA, verifier: verifier(claimsFor(who?.user ?? 'analyst-a', who?.role ?? 'iips-analyst', who?.tenant)) };
  const executor = createReadExecutor(deps);
  const server = http.createServer((req, res) => {
    void handleWatchlistsRequest(req, res, executor, u, { store: s });
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}${urlPath}`, {
      method,
      headers: {
        ...(who ? { Authorization: 'Bearer t' } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, body: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}

const ANALYST = { user: 'analyst-a', role: 'iips-analyst' };
const VIEWER = { user: 'viewer-a', role: 'iips-viewer' };
const OTHER_TENANT = { user: 'analyst-b', role: 'iips-analyst', tenant: 'tenant-B' };
const lists = (b: Record<string, unknown>) => b.data as Record<string, unknown>[];

describe('UI07 transport — authorization (fail-closed)', () => {
  it('unauthenticated GET is 401', async () => {
    expect((await call(null, '/api/watchlists', 'GET', store())).status).toBe(401);
  });

  it('a viewer MAY read watchlists', async () => {
    const { status } = await call(VIEWER, '/api/watchlists', 'GET', store());
    expect(status).toBe(200);
  });

  it('a viewer may NOT create a watchlist (403)', async () => {
    expect((await call(VIEWER, '/api/watchlists', 'POST', store(), { watchlistId: 'wl-1' })).status).toBe(403);
  });

  it('an analyst may create a watchlist (201)', async () => {
    const { status, body } = await call(ANALYST, '/api/watchlists', 'POST', store(), { watchlistId: 'wl-1', name: 'Core' });
    expect(status).toBe(201);
    expect((body.data as Record<string, unknown>).name).toBe('Core');
  });

  it('a duplicate watchlist is 409', async () => {
    const s = store();
    await call(ANALYST, '/api/watchlists', 'POST', s, { watchlistId: 'wl-1' });
    expect((await call(ANALYST, '/api/watchlists', 'POST', s, { watchlistId: 'wl-1' })).status).toBe(409);
  });

  it('a missing watchlistId is 400', async () => {
    expect((await call(ANALYST, '/api/watchlists', 'POST', store(), {})).status).toBe(400);
  });

  it('a token claiming a tenant the user does not belong to is 401', async () => {
    const { status, body } = await call({ user: 'analyst-a', role: 'iips-analyst', tenant: 'tenant-B' }, '/api/watchlists', 'GET', store());
    expect(status).toBe(401);
    expect(body.error).toBe('no-valid-tenant');
  });
});

describe('UI07 transport — membership uses GOVERNED rows only', () => {
  it('adds a governed row selected by id and captures its baseline', async () => {
    const s = store();
    await call(ANALYST, '/api/watchlists', 'POST', s, { watchlistId: 'wl-1' });
    const { status, body } = await call(ANALYST, '/api/watchlists/wl-1/items', 'POST', s, { canonicalSecurityId: 'Banking' });
    expect(status).toBe(201);
    const items = (body.data as { items: Record<string, unknown>[] }).items;
    expect(items).toHaveLength(1);
    expect((items[0].baseline as Record<string, unknown>).composite).toBe(72);
  });

  it('an unknown security fails closed (404) — no row is fabricated', async () => {
    const s = store();
    await call(ANALYST, '/api/watchlists', 'POST', s, { watchlistId: 'wl-1' });
    const { status, body } = await call(ANALYST, '/api/watchlists/wl-1/items', 'POST', s, { canonicalSecurityId: 'NOT-A-SECURITY' });
    expect(status).toBe(404);
    expect(body.error).toBe('governed-row-not-found');
  });

  it('client-supplied VALUES are ignored — the governed row is resolved server-side', async () => {
    const s = store();
    await call(ANALYST, '/api/watchlists', 'POST', s, { watchlistId: 'wl-1' });
    const { body } = await call(ANALYST, '/api/watchlists/wl-1/items', 'POST', s, {
      canonicalSecurityId: 'Banking',
      composite: 999,
      verdict: 'FABRICATED',
    });
    const items = (body.data as { items: Record<string, unknown>[] }).items;
    const baseline = items[0].baseline as Record<string, unknown>;
    expect(baseline.composite).toBe(72);
    expect(baseline.verdict).toBe('BUY');
  });

  it('removes an item, and an unknown removal is 404', async () => {
    const s = store();
    await call(ANALYST, '/api/watchlists', 'POST', s, { watchlistId: 'wl-1' });
    await call(ANALYST, '/api/watchlists/wl-1/items', 'POST', s, { canonicalSecurityId: 'Banking' });
    expect((await call(ANALYST, '/api/watchlists/wl-1/items/Banking', 'DELETE', s)).status).toBe(200);
    expect((await call(ANALYST, '/api/watchlists/wl-1/items/Banking', 'DELETE', s)).status).toBe(404);
  });

  it('deletes a watchlist, and an unknown delete is 404', async () => {
    const s = store();
    await call(ANALYST, '/api/watchlists', 'POST', s, { watchlistId: 'wl-1' });
    expect((await call(ANALYST, '/api/watchlists/wl-1', 'DELETE', s)).status).toBe(200);
    expect((await call(ANALYST, '/api/watchlists/wl-1', 'DELETE', s)).status).toBe(404);
  });

  it('rejects an invalid trigger operator (400)', async () => {
    const s = store();
    await call(ANALYST, '/api/watchlists', 'POST', s, { watchlistId: 'wl-1' });
    const { status, body } = await call(ANALYST, '/api/watchlists/wl-1/items', 'POST', s, {
      canonicalSecurityId: 'Banking',
      triggers: [{ field: 'composite', op: 'between', value: 5 }],
    });
    expect(status).toBe(400);
    expect(body.error).toBe('invalid-trigger-op');
  });
});

describe('UI07 transport — isolation', () => {
  it('a different tenant sees no watchlists', async () => {
    const s = store();
    await call(ANALYST, '/api/watchlists', 'POST', s, { watchlistId: 'wl-1' });
    const { status, body } = await call(OTHER_TENANT, '/api/watchlists', 'GET', s);
    expect(status).toBe(200);
    expect(lists(body)).toHaveLength(0);
  });

  it('a different owner in the same tenant sees no watchlists', async () => {
    const s = store();
    await call(ANALYST, '/api/watchlists', 'POST', s, { watchlistId: 'wl-1' });
    const { body } = await call(VIEWER, '/api/watchlists', 'GET', s);
    expect(lists(body)).toHaveLength(0);
  });

  it('a different owner cannot delete another principal watchlist (404, no disclosure)', async () => {
    const s = store();
    await call(ANALYST, '/api/watchlists', 'POST', s, { watchlistId: 'wl-1' });
    expect((await call(OTHER_TENANT, '/api/watchlists/wl-1', 'DELETE', s)).status).toBe(404);
    // The owner's list is untouched.
    expect(lists((await call(ANALYST, '/api/watchlists', 'GET', s)).body)).toHaveLength(1);
  });
});

describe('UI07 transport — view, provenance and baseline deltas', () => {
  it('returns the certified P13 UI07 view shape with per-item provenance', async () => {
    const s = store();
    await call(ANALYST, '/api/watchlists', 'POST', s, { watchlistId: 'wl-1', name: 'Core' });
    await call(ANALYST, '/api/watchlists/wl-1/items', 'POST', s, { canonicalSecurityId: 'Banking' });
    const { body } = await call(ANALYST, '/api/watchlists', 'GET', s);
    const view = lists(body)[0];
    // Produced by the ACCEPTED p13 buildWatchlistView, unmodified.
    expect(view.surfaceName).toBe('UI07');
    expect(view.disposition).toBe('NEW');
    expect(view.totalItems).toBe(1);
    const item = (view.items as Record<string, unknown>[])[0];
    expect(item._quality).toBe('good');
    expect(item._provenanceView).toBeDefined();
  });

  it('reports zero delta against the frozen baseline and discloses that fact', async () => {
    const s = store();
    await call(ANALYST, '/api/watchlists', 'POST', s, { watchlistId: 'wl-1' });
    await call(ANALYST, '/api/watchlists/wl-1/items', 'POST', s, { canonicalSecurityId: 'Banking' });
    const { body } = await call(ANALYST, '/api/watchlists', 'GET', s);
    const item = ((lists(body)[0].items as Record<string, unknown>[])[0]);
    const composite = (item.deltas as Record<string, unknown>[]).find((d) => d.field === 'composite')!;
    expect(composite.delta).toBe(0);
    expect(composite.changed).toBe(false);

    const prov = body.provenance as Record<string, unknown>;
    expect(String(prov.transportSemantics)).toMatch(/PERSISTED BASELINE/);
    expect(String(prov.transportSemantics)).toMatch(/NOT a live feed and NOT a time series/);
    expect(prov.asOf).toBe(VINTAGE.asOf);
  });

  it('reports a signed delta when the current governed value differs from the baseline', async () => {
    const s = store();
    await call(ANALYST, '/api/watchlists', 'POST', s, { watchlistId: 'wl-1' });
    await call(ANALYST, '/api/watchlists/wl-1/items', 'POST', s, {
      canonicalSecurityId: 'Banking',
      triggers: [{ field: 'composite', op: 'changed', value: null }],
    });
    // A later governed vintage carries a different value; the baseline is unchanged.
    const moved = universe([{ ...ROW, composite: 80 }]);
    const { body } = await call(ANALYST, '/api/watchlists', 'GET', s, undefined, moved);
    const item = ((lists(body)[0].items as Record<string, unknown>[])[0]);
    const composite = (item.deltas as Record<string, unknown>[]).find((d) => d.field === 'composite')!;
    expect(composite.baselineValue).toBe(72);
    expect(composite.currentValue).toBe(80);
    expect(composite.delta).toBe(8);
    expect((item.triggers as Record<string, unknown>[])[0].fired).toBe(true);
  });

  it('a security absent from the current universe yields null current and no fired trigger', async () => {
    const s = store();
    await call(ANALYST, '/api/watchlists', 'POST', s, { watchlistId: 'wl-1' });
    await call(ANALYST, '/api/watchlists/wl-1/items', 'POST', s, {
      canonicalSecurityId: 'Banking',
      triggers: [{ field: 'composite', op: 'gt', value: 1 }],
    });
    const { body } = await call(ANALYST, '/api/watchlists', 'GET', s, undefined, universe([]));
    const item = ((lists(body)[0].items as Record<string, unknown>[])[0]);
    expect(item.current).toBeNull();
    expect((item.triggers as Record<string, unknown>[])[0].fired).toBeNull();
  });

  it('survives a restart over HTTP (journal reconstruction)', async () => {
    const dir = tmpDir();
    await call(ANALYST, '/api/watchlists', 'POST', store(dir), { watchlistId: 'wl-1', name: 'Core' });
    await call(ANALYST, '/api/watchlists/wl-1/items', 'POST', store(dir), { canonicalSecurityId: 'Banking' });
    const { body } = await call(ANALYST, '/api/watchlists', 'GET', store(dir));
    expect(lists(body)).toHaveLength(1);
    expect(lists(body)[0].totalItems).toBe(1);
  });
});
