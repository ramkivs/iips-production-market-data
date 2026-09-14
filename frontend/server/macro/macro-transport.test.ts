/**
 * Program v3.0 — WP-MACRO-02: certified Macro transport tests (OFFLINE).
 *
 * Exercises GET /api/macro end-to-end through the governed read transport handler
 * (handleMacroReadRequest) with a MOCK source fetch — no live MoSPI network access.
 *
 * Authorization is the existing read gate (guardRead → viewer/analyst/admin read; 401/403).
 * Error mapping is the WP-MACRO-02 fixed decision:
 *   INVALID_FILTER → 422 · EXCLUDED_DATASET → 422 · SOURCE_CONTRACT → 502 · SOURCE_UNAVAILABLE → 503.
 */
import { describe, it, expect, vi } from 'vitest';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { handleMacroReadRequest } from '../executive-transport';
import { createReadExecutor } from '../admin-transport';
import type { OidcVerifier } from '../../src/core/auth/keycloakAdapter';

const METADATA = { issuer: 'http://localhost:8080/realms/iips', jwksUri: 'http://localhost:8080/realms/iips/certs', clientId: 'iips-spa' };

function verifier(claims: Record<string, unknown>, expiry = Date.now() / 1000 + 3600): OidcVerifier {
  return { verify: vi.fn().mockResolvedValue({ subject: 'u1', claims, expiry }) };
}

function claims(username: string, roles: string[]): Record<string, unknown> {
  return { iss: METADATA.issuer, aud: 'iips-spa', preferred_username: username, tenant: 'tenant-A', realm_access: { roles } };
}

function readExec(roles: string[], username = 'viewer-a') {
  return createReadExecutor({ metadata: METADATA, verifier: verifier(claims(username, roles)) });
}

// Real captured MoSPI IIP rows (2026-08-21), used only to exercise normalization offline.
const IIP_ROWS = [
  { base_year: '2022-23', year: '2025-26', type: 'General', category: 'General', sub_category: '', index: '117.7', growth_rate: '4.3' },
  { base_year: '2022-23', year: '2025-26', type: 'Sectoral', category: 'Mining & Quarrying', sub_category: 'Fuel Minerals', index: '103.6', growth_rate: '-2.0' },
];

interface MacroRequestOpts {
  path: string;
  token?: string;
  executor: ReturnType<typeof createReadExecutor>;
  fetchImpl: typeof fetch;
  onFetch?: (url: string) => void;
}

async function requestMacro(opts: MacroRequestOpts): Promise<{ status: number; body: Record<string, unknown> }> {
  const server = http.createServer((req, res) => {
    void handleMacroReadRequest(req, res, opts.executor, { fetchImpl: opts.fetchImpl });
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}${opts.path}`, {
      headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : {},
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, body };
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}

/** Mock source fetch returning a MoSPI-shaped JSON body; records the requested URL. */
function sourceFetch(body: unknown, status = 200): { fetch: typeof globalThis.fetch; calls: string[] } {
  const calls: string[] = [];
  const impl = (async (input: unknown) => {
    calls.push(String(input));
    if (status === 0) throw new Error('source unreachable');
    return new Response(JSON.stringify(body), { status }) as unknown as Response;
  }) as unknown as typeof globalThis.fetch;
  return { fetch: impl, calls };
}

const VALID_PATH = '/api/macro?dataset=IIP&base_year=2022-23&frequency=Annually';

describe('WP-MACRO-02 — GET /api/macro (authorization)', () => {
  it('authorized viewer read → 200', async () => {
    const { fetch } = sourceFetch({ data: IIP_ROWS, statusCode: true, msg: 'ok' });
    const { status, body } = await requestMacro({ path: VALID_PATH, token: 't', executor: readExec(['iips-viewer']), fetchImpl: fetch });
    expect(status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('authorized analyst read → 200', async () => {
    const { fetch } = sourceFetch({ data: IIP_ROWS, statusCode: true, msg: 'ok' });
    const { status } = await requestMacro({ path: VALID_PATH, token: 't', executor: readExec(['iips-analyst'], 'analyst-a'), fetchImpl: fetch });
    expect(status).toBe(200);
  });

  it('authorized admin read → 200', async () => {
    const { fetch } = sourceFetch({ data: IIP_ROWS, statusCode: true, msg: 'ok' });
    const { status } = await requestMacro({ path: VALID_PATH, token: 't', executor: readExec(['iips-admin'], 'admin-a'), fetchImpl: fetch });
    expect(status).toBe(200);
  });

  it('missing token → 401', async () => {
    const { fetch } = sourceFetch({ data: [], statusCode: true, msg: 'ok' });
    const { status, body } = await requestMacro({ path: VALID_PATH, token: '', executor: readExec(['iips-viewer']), fetchImpl: fetch });
    expect(status).toBe(401);
    expect(body.error).toBeTruthy();
  });

  it('expired token → 401', async () => {
    const { fetch } = sourceFetch({ data: [], statusCode: true, msg: 'ok' });
    const ex = createReadExecutor({ metadata: METADATA, verifier: verifier(claims('viewer-a', ['iips-viewer']), Date.now() / 1000 - 60) });
    const { status } = await requestMacro({ path: VALID_PATH, token: 't', executor: ex, fetchImpl: fetch });
    expect(status).toBe(401);
  });

  it('authenticated principal denied by the governed resource gate → 403', async () => {
    // The governed read model maps any authenticated principal to at least 'viewer'
    // (mapKeycloakRoles defaults an empty role list to viewer), so READ is never role-denied.
    // The 403 read path is the ApiSecurity-style resource gate; we inject a denying gate
    // (createReadExecutor deps.resourceAccess) to prove handleMacroReadRequest propagates it.
    const denying = createReadExecutor({ metadata: METADATA, verifier: verifier(claims('viewer-a', ['iips-viewer'])), resourceAccess: () => false });
    const { fetch } = sourceFetch({ data: [], statusCode: true, msg: 'ok' });
    const { status, body } = await requestMacro({ path: VALID_PATH, token: 't', executor: denying, fetchImpl: fetch });
    expect(status).toBe(403);
    expect(body.error).toBeTruthy();
  });
});

describe('WP-MACRO-02 — GET /api/macro (response + measures)', () => {
  it('returns the governed envelope with LIVE freshness', async () => {
    const { fetch } = sourceFetch({ data: IIP_ROWS, statusCode: true, msg: 'ok' });
    const { status, body } = await requestMacro({ path: VALID_PATH, token: 't', executor: readExec(['iips-viewer']), fetchImpl: fetch });
    expect(status).toBe(200);
    expect(body.provenance).toEqual({
      dataSource: 'MoSPI National Statistical Office',
      freshness: 'LIVE',
      transportSemantics: '1:1 normalization; no derivation',
    });
    expect(JSON.stringify(body)).not.toContain('SNAPSHOT');
  });

  it('preserves multiple observations and every measure (no data loss)', async () => {
    const { fetch } = sourceFetch({ data: IIP_ROWS, statusCode: true, msg: 'ok' });
    const { body } = await requestMacro({ path: VALID_PATH, token: 't', executor: readExec(['iips-viewer']), fetchImpl: fetch });
    const data = body.data as Array<Record<string, unknown>>;
    expect(data).toHaveLength(4); // 2 rows × (index + growth_rate)
    const measures = data.map((o) => o.measure).sort();
    expect(measures).toEqual(['growth_rate', 'growth_rate', 'index', 'index']);
  });

  it('preserves every MacroObservation field incl. adapter provenance', async () => {
    const { fetch } = sourceFetch({ data: IIP_ROWS, statusCode: true, msg: 'ok' });
    const { body } = await requestMacro({ path: VALID_PATH, token: 't', executor: readExec(['iips-viewer']), fetchImpl: fetch });
    const first = (body.data as Array<Record<string, unknown>>)[0];
    for (const key of ['dataset', 'indicator', 'measure', 'value', 'unit', 'frequency', 'referencePeriod', 'dimensions', 'baseYear', 'series', 'status', 'source', 'retrievedAt', 'provenance']) {
      expect(first).toHaveProperty(key);
    }
    const prov = first.provenance as Record<string, unknown>;
    expect(prov.source).toBe('MoSPI');
    expect(prov.endpoint).toBe('/api/iip/getIipData');
    expect(prov.freshness).toBe('LIVE');
  });

  it('keeps null/non-numeric values honest (never fabricates)', async () => {
    const rows = [{ base_year: '2022-23', year: '2025-26', type: 'General', category: 'General', sub_category: '', index: 'N/A', growth_rate: '4.3' }];
    const { fetch } = sourceFetch({ data: rows, statusCode: true, msg: 'ok' });
    const { body } = await requestMacro({ path: VALID_PATH, token: 't', executor: readExec(['iips-viewer']), fetchImpl: fetch });
    const data = body.data as Array<Record<string, unknown>>;
    const idx = data.find((o) => o.measure === 'index');
    expect(idx?.value).toBeNull();
    expect((idx?.dimensions as Record<string, unknown>).index).toBe('N/A'); // raw preserved
  });

  it('passes query parameters through verbatim to the source adapter', async () => {
    const { fetch, calls } = sourceFetch({ data: IIP_ROWS, statusCode: true, msg: 'ok' });
    await requestMacro({ path: VALID_PATH, token: 't', executor: readExec(['iips-viewer']), fetchImpl: fetch });
    expect(calls.length).toBe(1);
    expect(calls[0]).toContain('/api/iip/getIipData');
    expect(calls[0]).toContain('base_year=2022-23');
    expect(calls[0]).toContain('frequency=Annually');
  });
});

describe('WP-MACRO-02 — GET /api/macro (error mapping — fixed decision)', () => {
  it('INVALID_FILTER → 422 (and no source call is made)', async () => {
    const { fetch, calls } = sourceFetch({ data: [], statusCode: true, msg: 'ok' });
    const { status, body } = await requestMacro({ path: '/api/macro?dataset=IIP&base_year=1999-00&frequency=Annually', token: 't', executor: readExec(['iips-viewer']), fetchImpl: fetch });
    expect(status).toBe(422);
    expect(body.code).toBe('INVALID_FILTER');
    expect(calls.length).toBe(0);
  });

  it('missing dataset → 422 INVALID_FILTER', async () => {
    const { fetch } = sourceFetch({ data: [], statusCode: true, msg: 'ok' });
    const { status, body } = await requestMacro({ path: '/api/macro?base_year=2022-23', token: 't', executor: readExec(['iips-viewer']), fetchImpl: fetch });
    expect(status).toBe(422);
    expect(body.code).toBe('INVALID_FILTER');
  });

  it('EXCLUDED_DATASET (WPI) → 422', async () => {
    const { fetch } = sourceFetch({ data: [], statusCode: true, msg: 'ok' });
    const { status, body } = await requestMacro({ path: '/api/macro?dataset=WPI', token: 't', executor: readExec(['iips-viewer']), fetchImpl: fetch });
    expect(status).toBe(422);
    expect(body.code).toBe('EXCLUDED_DATASET');
  });

  it('SOURCE_CONTRACT (statusCode:false) → 502', async () => {
    const { fetch } = sourceFetch({ statusCode: false, msg: 'Requested item was not found!' });
    const { status, body } = await requestMacro({ path: VALID_PATH, token: 't', executor: readExec(['iips-viewer']), fetchImpl: fetch });
    expect(status).toBe(502);
    expect(body.code).toBe('SOURCE_CONTRACT');
  });

  it('SOURCE_UNAVAILABLE (HTTP 500 from source) → 503', async () => {
    const { fetch } = sourceFetch({}, 500);
    const { status, body } = await requestMacro({ path: VALID_PATH, token: 't', executor: readExec(['iips-viewer']), fetchImpl: fetch });
    expect(status).toBe(503);
    expect(body.code).toBe('SOURCE_UNAVAILABLE');
  });
});

describe('WP-MACRO-02 — GET /api/macro (security)', () => {
  it('never leaks source credentials or bearer tokens in the response', async () => {
    const { fetch } = sourceFetch({ data: IIP_ROWS, statusCode: true, msg: 'ok' });
    const { body } = await requestMacro({ path: VALID_PATH, token: 'top-secret-bearer', executor: readExec(['iips-viewer']), fetchImpl: fetch });
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('Bearer');
    expect(serialized).not.toContain('Authorization');
    expect(serialized).not.toContain('top-secret-bearer');
  });
});
