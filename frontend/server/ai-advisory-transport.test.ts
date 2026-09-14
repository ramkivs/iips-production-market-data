/**
 * Program v3.0 — G-AI-IMPL: AI Advisory transport contract tests (offline-safe).
 *
 * Covers T1 (governed read authorization), T2 (dynamic engine coverage), T9 (adviceId via the
 * canonical platform helper) and T10 (freshness SNAPSHOT), plus the S4 failure semantics, SR-1
 * snapshot provenance, S2 exact text, D7 label and the S3-A A===B / adviceLog guarantees.
 *
 * No external AI, provider or network is used or permitted (S1). No recovered implementation is
 * referenced. Authorization reuses the EXISTING canonical guardRead (SR-4) — no second RBAC model.
 */
import { describe, it, expect, vi } from 'vitest';
import type http from 'node:http';
import {
  handleAiAdvisoryRequest,
  createDeterministicAdvisor,
  guardAdvisorCompletion,
  buildAiAdvisoryDto,
  EngineResultNotCompletedError,
  ADVISORY_TEXT,
  ADVISORY_LABEL,
  ADVISORY_FRESHNESS,
  ADVISORY_UNAVAILABLE,
  ADVISOR_MODEL,
  type ResolvedSectorEngine,
} from './ai-advisory-transport';
import { resolveSectorEngine } from './executive-transport';
import { createReadExecutor } from './admin-transport';
import { adviceId } from '../../iips-platform/src/distributed/AiAssistedRuntime';
import { AiAssistedRuntime } from '../../iips-platform/src/distributed/AiAssistedRuntime';
import type { OidcVerifier } from '../src/core/auth/keycloakAdapter';
import type { Container } from '../../iips-platform/src/di/Container';
import type { ExecutionRequest, ExecutionResult, SectorPlugin } from '../../iips-platform/src/plugin-loader/PluginContract';

// --- governed read executor (same construction as read-guard.test.ts) -------------------------

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

// --- http doubles ------------------------------------------------------------------------------

function req(url: string, token = 'token'): http.IncomingMessage {
  return { url, method: 'GET', headers: token ? { authorization: `Bearer ${token}` } : {} } as unknown as http.IncomingMessage;
}

function res() {
  const r = {
    statusCode: 0,
    body: '',
    headers: {} as Record<string, string>,
    setHeader(k: string, v: string) { r.headers[k] = v; },
    writeHead(code: number) { r.statusCode = code; return r; },
    end(b?: string) { r.body = b ?? ''; return r; },
  };
  return r as unknown as http.ServerResponse & { statusCode: number; body: string };
}

function json(r: { body: string }): Record<string, unknown> {
  return JSON.parse(r.body) as Record<string, unknown>;
}

// --- stub engine producing a chosen ExecutionResult state --------------------------------------

const STUB_ENGINE_ID = 'sector.stub';

function stubEngine(state: ExecutionResult['state'], tracked?: { called: boolean }): SectorPlugin {
  return {
    identity: { engineId: STUB_ENGINE_ID, sectorFamily: 'stub', engineVersion: '1.0', secVersion: '1.0', semcVersion: '1.0' },
    manifest: { engineId: STUB_ENGINE_ID, sectorFamily: 'stub', engineVersion: '1.0', capabilities: [], compatibility: {} },
    onDiscover() {},
    onRegister() { return true; },
    onInitialize() {},
    execute(_ctx: Container, _request: ExecutionRequest): ExecutionResult {
      if (state === 'COMPLETED') {
        return { state, snapshotRef: 'SNAP_CANONICAL01', evidenceRef: 'EVID_CANONICAL01', metadata: { composite: 76.3, verdict: 'Buy' } };
      }
      return { state, metadata: {} };
    },
    onComplete() { if (tracked) tracked.called = true; },
  };
}

function stubResolver(state: ExecutionResult['state']): (k: string) => ResolvedSectorEngine | null {
  return (k: string) => (k.toLowerCase() === 'stub'
    ? { sector: 'Stub', engineId: STUB_ENGINE_ID, makeEngine: () => stubEngine(state), inputs: {} }
    : null);
}

// --- T1 — governed read authorization -----------------------------------------------------------

describe('T1 — governed read authorization (canonical guardRead, SR-4)', () => {
  it('authorizes a viewer for read → 200', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/Banking'), r, readExec(['iips-viewer']), resolveSectorEngine);
    expect(r.statusCode).toBe(200);
  });

  it('authorizes an analyst for read → 200', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/Banking'), r, readExec(['iips-analyst'], 'analyst-a'), resolveSectorEngine);
    expect(r.statusCode).toBe(200);
  });

  it('authorizes an admin for read → 200', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/Banking'), r, readExec(['iips-admin'], 'admin-a'), resolveSectorEngine);
    expect(r.statusCode).toBe(200);
  });

  it('rejects a missing token with 401', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/Banking', ''), r, readExec(['iips-viewer']), resolveSectorEngine);
    expect(r.statusCode).toBe(401);
  });

  it('rejects an expired token with 401', async () => {
    const ex = createReadExecutor({ metadata: METADATA, verifier: verifier(claims('viewer-a', ['iips-viewer']), Date.now() / 1000 - 60) });
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/Banking'), r, ex, resolveSectorEngine);
    expect(r.statusCode).toBe(401);
  });

  it('uses the governed read resource read.ai-advisory and never a second RBAC model', async () => {
    const ex = readExec(['iips-viewer']);
    const authorize = vi.spyOn(ex, 'authorize');
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/Banking'), r, ex, resolveSectorEngine);
    expect(authorize).toHaveBeenCalled();
    expect(authorize.mock.calls[0][1]).toBe('read');
    expect(authorize.mock.calls[0][2]).toBe('read.ai-advisory');
  });

  it('returns 404 for a malformed advisory path', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/'), r, readExec(['iips-viewer']), resolveSectorEngine);
    expect(r.statusCode).toBe(404);
  });
});

// --- T2 — dynamic engine coverage (SR-5) --------------------------------------------------------

describe('T2 — dynamic engine coverage derived from the governed mapping (SR-5)', () => {
  const ALL_SECTORS = [
    'Banking', 'Insurance', 'Capital Markets', 'Healthcare', 'Hospitality', 'Energy',
    'Utilities', 'Consumer', 'Industrials', 'Technology', 'Telecommunications', 'Automobile',
    'Materials & Metals',
  ];

  it('resolves all 13 governed engines — no sector is enumerated in the transport', async () => {
    expect(ALL_SECTORS).toHaveLength(13);
    for (const sector of ALL_SECTORS) {
      const resolved = resolveSectorEngine(sector);
      expect(resolved, `expected ${sector} to resolve`).not.toBeNull();
      expect(resolved?.engineId).toMatch(/^sector\./);
      const r = res();
      await handleAiAdvisoryRequest(req(`/api/ai-advisory/${encodeURIComponent(sector)}`), r, readExec(['iips-viewer']), resolveSectorEngine);
      expect(r.statusCode, `expected 200 for ${sector}`).toBe(200);
      expect(json(r).engineResultId).toBe(sector);
    }
  });

  it('matches sector keys case-insensitively (D6)', () => {
    expect(resolveSectorEngine('banking')?.sector).toBe('Banking');
    expect(resolveSectorEngine('BANKING')?.sector).toBe('Banking');
    expect(resolveSectorEngine('  Banking  ')?.sector).toBe('Banking');
  });

  it('returns the pre-existing 404 semantics for an unknown sector', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/NotASector'), r, readExec(['iips-viewer']), resolveSectorEngine);
    expect(r.statusCode).toBe(404);
    expect(json(r).error).toContain('engine result not found');
  });

  it('returns 404 for an empty sector key', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/%20'), r, readExec(['iips-viewer']), resolveSectorEngine);
    expect(r.statusCode).toBe(404);
  });
});

// --- S2 / D7 / SR-2 / SR-3 — governed success DTO -----------------------------------------------

describe('governed success DTO (S2 exact text · D7 label · SR-2 freshness · SR-3 adviceId)', () => {
  it('returns the EXACT authorized advisory sentence, with no interpolation (S2)', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/Technology'), r, readExec(['iips-viewer']), resolveSectorEngine);
    const body = json(r);
    expect(body.text).toBe('This is a supplementary advisory explanation. It is not a certified engine result and does not alter the certified result.');
    expect(body.text).toBe(ADVISORY_TEXT);
    expect(body.text).not.toContain('Technology');
    expect(body.text).not.toMatch(/\d/);
  });

  it('is identical for every engine result — fixed, non-result-dependent (S2)', async () => {
    const texts: unknown[] = [];
    for (const sector of ['Banking', 'Technology', 'Automobile']) {
      const r = res();
      await handleAiAdvisoryRequest(req(`/api/ai-advisory/${encodeURIComponent(sector)}`), r, readExec(['iips-viewer']), resolveSectorEngine);
      texts.push(json(r).text);
    }
    expect(new Set(texts).size).toBe(1);
  });

  it('carries the mandatory D7 label and SNAPSHOT freshness (SR-2)', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/Banking'), r, readExec(['iips-viewer']), resolveSectorEngine);
    const body = json(r);
    expect(body.label).toBe('AI EXPLANATION ≠ CERTIFIED RESULT');
    expect(body.label).toBe(ADVISORY_LABEL);
    expect(body.freshness).toBe('SNAPSHOT');
    expect(body.freshness).toBe(ADVISORY_FRESHNESS);
  });

  it('produces adviceId via the canonical platform adviceId() helper (SR-3)', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/Banking'), r, readExec(['iips-viewer']), resolveSectorEngine);
    const body = json(r);
    const ref = body.engineResultRef as string;
    expect(body.adviceId).toBe(adviceId(`ai-advisory|${ref}`));
    expect(typeof body.adviceId).toBe('string');
    expect((body.adviceId as string).length).toBeGreaterThan(0);
  });

  it('exposes the governed 12-field DTO exactly — nothing added, removed or renamed', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/Banking'), r, readExec(['iips-viewer']), resolveSectorEngine);
    const keys = Object.keys(json(r)).sort();
    expect(keys).toEqual([
      'adviceId', 'engineResultId', 'engineResultRef', 'freshness', 'grounded', 'kind', 'label',
      'model', 'modelVersion', 'nonAuthoritative', 'text', 'unavailable',
    ]);
    expect(json(r).nonAuthoritative).toBe(true);
    expect(json(r).unavailable).toEqual([...ADVISORY_UNAVAILABLE]);
  });

  it('never fabricates the fields the governed contract does not provide', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/Banking'), r, readExec(['iips-viewer']), resolveSectorEngine);
    const body = json(r);
    for (const absent of ['timestamp', 'tenant', 'provider', 'confidence', 'citations', 'decision']) {
      expect(body).not.toHaveProperty(absent);
    }
  });

  it('reports a truthful deterministic advisor identity — no external AI is implied (S1)', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/Banking'), r, readExec(['iips-viewer']), resolveSectorEngine);
    expect(json(r).model).toBe(ADVISOR_MODEL);
    expect(json(r).model).not.toMatch(/gpt|openai|anthropic|claude|gemini/i);
  });
});

// --- SR-1 — canonical snapshot provenance --------------------------------------------------------

describe('SR-1 — genuine canonical snapshotRef provenance', () => {
  it('returns the runtime-generated canonical snapshotRef, not a synthesized snap_<sector>', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/Banking'), r, readExec(['iips-viewer']), resolveSectorEngine);
    const ref = json(r).engineResultRef as string;
    expect(typeof ref).toBe('string');
    // The form SR-1 prohibits is the lowercase synthesized `snap_<sector>` presentation reference.
    expect(ref).not.toMatch(/^snap_[A-Za-z]/);
    expect(ref).not.toBe('snap_Banking');
    expect(ref.toLowerCase()).not.toContain('banking');
    // The genuine canonical form is the SnapshotService/DeterministicIdProvider opaque `SNAP_<hex>`.
    expect(ref).toMatch(/^SNAP_[0-9A-F]{8}$/);
  });
});

// --- S3-A — A===B, single execution, adviceLog lineage -------------------------------------------

describe('S3-A — executeWithAi orchestration, A===B and adviceLog lineage', () => {
  it('returns the engine result unchanged (A===B)', async () => {
    const runtime = new AiAssistedRuntime(createDeterministicAdvisor());
    const executed = runtime.executeWithAi(STUB_ENGINE_ID, () => stubEngine('COMPLETED'), { requestId: 'r1', inputs: {} });
    expect(executed.engineResultUnchanged).toBe(true);
    expect(executed.result.state).toBe('COMPLETED');
    expect(executed.result.metadata.composite).toBe(76.3);
  });

  it('proves AI ON and AI OFF produce the identical engine result', () => {
    const runtime = new AiAssistedRuntime(createDeterministicAdvisor());
    const on = runtime.executeWithAi(STUB_ENGINE_ID, () => stubEngine('COMPLETED'), { requestId: 'r1', inputs: {} });
    const off = runtime.executeWithoutAi(STUB_ENGINE_ID, () => stubEngine('COMPLETED'), { requestId: 'r1', inputs: {} });
    expect(runtime.isEngineResultEquivalent(on.result, off)).toBe(true);
  });

  it('records adviceLog lineage for the advice it produced', () => {
    const runtime = new AiAssistedRuntime(createDeterministicAdvisor());
    const executed = runtime.executeWithAi(STUB_ENGINE_ID, () => stubEngine('COMPLETED'), { requestId: 'r1', inputs: {} });
    const log = runtime.adviceLog();
    expect(log).toHaveLength(1);
    expect(log[0].text).toBe(ADVISORY_TEXT);
    expect(Object.isFrozen(log[0])).toBe(true);
    expect(executed.advice.engineResultRef).toBe(executed.result.snapshotRef);
  });

  it('does not mutate the engine result', () => {
    const runtime = new AiAssistedRuntime(createDeterministicAdvisor());
    const executed = runtime.executeWithAi(STUB_ENGINE_ID, () => stubEngine('COMPLETED'), { requestId: 'r1', inputs: {} });
    const before = JSON.stringify(executed.result);
    buildAiAdvisoryDto(executed.advice, 'Stub');
    expect(JSON.stringify(executed.result)).toBe(before);
  });
});

// --- S4 — failure semantics -----------------------------------------------------------------------

describe('S4 — failure semantics', () => {
  it('non-COMPLETED (FAILED) → 503 engine-result-not-completed, advisory body never produced', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/stub'), r, readExec(['iips-viewer']), stubResolver('FAILED'));
    expect(r.statusCode).toBe(503);
    expect(json(r).code).toBe('engine-result-not-completed');
    expect(json(r)).not.toHaveProperty('text');
  });

  it('non-COMPLETED (CANCELLED) → 503 engine-result-not-completed', async () => {
    const r = res();
    await handleAiAdvisoryRequest(req('/api/ai-advisory/stub'), r, readExec(['iips-viewer']), stubResolver('CANCELLED'));
    expect(r.statusCode).toBe(503);
    expect(json(r).code).toBe('engine-result-not-completed');
  });

  it('the advisor BODY is never invoked for a non-COMPLETED result', () => {
    const inner = createDeterministicAdvisor();
    const advise = vi.spyOn(inner, 'advise');
    const guarded = guardAdvisorCompletion(inner);
    expect(() => guarded.advise({ state: 'FAILED', metadata: {} }, {})).toThrowError(EngineResultNotCompletedError);
    expect(() => guarded.advise({ state: 'CANCELLED', metadata: {} }, {})).toThrowError(EngineResultNotCompletedError);
    expect(advise).not.toHaveBeenCalled();
  });

  it('advisor failure after a COMPLETED result → 503 advisory-unavailable, no fallback advice', async () => {
    const failing = { advise: () => { throw new Error('advisor failed'); } };
    const r = res();
    await handleAiAdvisoryRequest(
      req('/api/ai-advisory/stub'), r, readExec(['iips-viewer']), stubResolver('COMPLETED'), { advisor: failing },
    );
    expect(r.statusCode).toBe(503);
    expect(json(r).code).toBe('advisory-unavailable');
    expect(json(r)).not.toHaveProperty('text');
    expect(json(r).error).not.toBe(ADVISORY_TEXT);
  });

  it('a COMPLETED result through the guarded advisor yields the authorized advice', () => {
    const guarded = guardAdvisorCompletion(createDeterministicAdvisor());
    const advice = guarded.advise({ state: 'COMPLETED', snapshotRef: 'SNAP_X', metadata: {} }, { composite: 1, verdict: 'Buy' });
    expect(advice.text).toBe(ADVISORY_TEXT);
    expect(advice.nonAuthoritative).toBe(true);
    expect(advice.engineResultRef).toBe('SNAP_X');
  });

  it('marks grounded=false when the evidence does not carry the certified composite/verdict', () => {
    const advice = createDeterministicAdvisor().advise({ state: 'COMPLETED', metadata: {} }, {});
    expect(advice.grounded).toBe(false);
    expect(advice.text).toBe(ADVISORY_TEXT);
  });
});

// --- S1 — advisor constraints -----------------------------------------------------------------------

describe('S1 — deterministic in-process advisor constraints', () => {
  it('is deterministic: identical inputs produce identical advice', () => {
    const a = createDeterministicAdvisor();
    const first = a.advise({ state: 'COMPLETED', snapshotRef: 'SNAP_X', metadata: {} }, { composite: 42, verdict: 'Hold' });
    const second = a.advise({ state: 'COMPLETED', snapshotRef: 'SNAP_X', metadata: {} }, { composite: 42, verdict: 'Hold' });
    expect(second).toEqual(first);
  });

  it('consumes only the engine result and evidence — it performs no additional reads', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    createDeterministicAdvisor().advise({ state: 'COMPLETED', snapshotRef: 'SNAP_X', metadata: {} }, { composite: 1, verdict: 'Buy' });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('does not mutate the engine result it is given', () => {
    const result: ExecutionResult = { state: 'COMPLETED', snapshotRef: 'SNAP_X', metadata: { composite: 1, verdict: 'Buy' } };
    const before = JSON.stringify(result);
    createDeterministicAdvisor().advise(result, { composite: 1, verdict: 'Buy' });
    expect(JSON.stringify(result)).toBe(before);
  });

  it('produces no recommendation and no external AI implication', () => {
    const advice = createDeterministicAdvisor().advise({ state: 'COMPLETED', metadata: {} }, { composite: 99, verdict: 'Buy' });
    expect(advice.text).not.toMatch(/BUY|SELL|HOLD/i);
    expect(advice.kind).toBe('explanation');
    expect(advice.nonAuthoritative).toBe(true);
  });
});

// --- G-DISPATCH-COVERAGE — real-socket coverage of the production dispatch branch -----------
/**
 * G-DISPATCH-COVERAGE (authorized by `DEC-G-AI-IMPL-CERT-CRITERIA` §4).
 *
 * Every test above calls `handleAiAdvisoryRequest` DIRECTLY. The only production path that
 * reaches the advisory is the `/api/ai-advisory/` DISPATCH branch inside the module-scope
 * `http.createServer(...)` callback in `executive-transport.ts`, which was previously covered
 * by no test. These tests cover it over a REAL socket on a REAL ephemeral port, using the
 * repository's existing `createServer` + `listen(0)` convention (`admin-transport.test.ts`).
 *
 * The production request listener is CAPTURED, never re-implemented: `http.createServer` is
 * observed while `executive-transport` is (re)imported, and the listener it registers is then
 * served on `listen(0)`. No production file is modified and no 14th path is created — this
 * block lives inside the already-authorized `frontend/server/ai-advisory-transport.test.ts`.
 *
 * `vi.resetModules()` is used so each test gets a fresh `executive-transport` instance and
 * therefore a fresh module-level `readExecutor` cache, keeping the no-IdP and authenticated
 * cases independent and deterministic. Servers are always closed in a `finally`.
 *
 * Offline-safe: no container runtime, Keycloak, browser or external provider is used.
 */

type ServedDispatch = {
  get(path: string, token?: string): Promise<{ status: number; body: Record<string, unknown> }>;
  close(): Promise<void>;
};

/**
 * Serve the REAL executive-transport dispatch listener on a real ephemeral port.
 *
 * `roles === null` simulates "no IdP configured": `createLiveReadExecutor` resolves to null,
 * which is exactly what production returns when Keycloak discovery fails, so the dispatch's
 * fail-closed 401 branch is exercised for real.
 *
 * The executor is built from the SAME fresh module registry as the freshly imported
 * `executive-transport` / `ai-advisory-transport`. That matters: `vi.resetModules()` gives those
 * modules a fresh `AuthError` class, and an executor built from the file's original static
 * import would throw a different class identity, so the handler's `e instanceof AuthError`
 * would miss and report 500 instead of 401. Building it here keeps class identity consistent
 * and the assertions honest.
 */
async function serveRealDispatch(roles: string[] | null, username = 'viewer-a'): Promise<ServedDispatch> {
  // `executive-transport.ts` does `import http from 'node:http'`, which vitest resolves to the
  // mutable CJS default export — not the frozen ESM namespace, which cannot be redefined.
  const ns = await import('node:http');
  const nodeHttp = (ns.default ?? ns) as typeof ns;
  const realCreateServer = nodeHttp.createServer as unknown as (...a: unknown[]) => {
    listen(port: number, cb?: () => void): unknown;
    address(): unknown;
    close(cb?: () => void): unknown;
  };

  let dispatch: ((req: unknown, res: unknown) => void) | undefined;
  const createServerSpy = vi.spyOn(nodeHttp, 'createServer').mockImplementation(((...args: unknown[]) => {
    dispatch = args[0] as (req: unknown, res: unknown) => void;
    return realCreateServer.apply(nodeHttp, args);
  }) as unknown as typeof nodeHttp.createServer);

  const adminSpies: Array<{ mockRestore(): void }> = [];
  try {
    vi.resetModules();
    const admin = await import('./admin-transport');
    const executor = roles
      ? admin.createReadExecutor({ metadata: METADATA, verifier: verifier(claims(username, roles)) })
      : null;
    adminSpies.push(
      vi.spyOn(admin, 'createLiveReadExecutor').mockResolvedValue(executor as never),
    );
    // Importing runs the module body, which calls http.createServer(<the dispatch listener>).
    await import('./executive-transport');
  } finally {
    createServerSpy.mockRestore();
  }

  if (!dispatch) throw new Error('executive-transport registered no http request listener');
  const captured: (req: unknown, res: unknown) => void = dispatch;

  const server = realCreateServer.call(nodeHttp, captured);
  await new Promise<void>((r) => server.listen(0, r));
  const addr = server.address() as { port: number } | null;
  const port = addr ? addr.port : 0;

  return {
    async get(path: string, token?: string) {
      const r = await fetch(`http://127.0.0.1:${port}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const body = await r.json().catch(() => ({}));
      return { status: r.status, body: body as Record<string, unknown> };
    },
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}

describe('G-DISPATCH-COVERAGE — real-socket /api/ai-advisory/ dispatch (executive-transport)', () => {
  it('routes /api/ai-advisory/ through the real dispatch to the governed advisory and returns the 12-field DTO (200)', async () => {
    const served = await serveRealDispatch(['iips-viewer']);
    try {
      const { status, body } = await served.get('/api/ai-advisory/Banking', 'real-token');
      expect(status).toBe(200);
      expect(body.label).toBe(ADVISORY_LABEL);
      expect(body.text).toBe(ADVISORY_TEXT);
      expect(body.freshness).toBe(ADVISORY_FRESHNESS);
      expect(body.nonAuthoritative).toBe(true);
      expect(body.kind).toBe('explanation');
      expect(body.grounded).toBe(true);
      expect(typeof body.adviceId).toBe('string');
      expect(typeof body.engineResultId).toBe('string');
      // SR-1 — the genuine canonical form is the opaque `SNAP_<hex>`; the prohibited form is
      // the lowercase synthesized `snap_<sector>` presentation reference (same convention as
      // the SR-1 contract test above).
      expect(typeof body.engineResultRef).toBe('string');
      expect(String(body.engineResultRef)).toMatch(/^SNAP_[0-9A-F]{8}$/);
      expect(String(body.engineResultRef)).not.toMatch(/^snap_[A-Za-z]/);
      expect(String(body.engineResultRef).toLowerCase()).not.toContain('banking');
      expect(Object.keys(body).sort()).toEqual([
        'adviceId', 'engineResultId', 'engineResultRef', 'freshness', 'grounded', 'kind',
        'label', 'model', 'modelVersion', 'nonAuthoritative', 'text', 'unavailable',
      ]);
    } finally {
      await served.close();
    }
  });

  it('fails closed through the real dispatch when no IdP is configured (401, advisory body never produced)', async () => {
    const served = await serveRealDispatch(null);
    try {
      const { status, body } = await served.get('/api/ai-advisory/Banking', 'real-token');
      expect(status).toBe(401);
      expect(body.error).toBe('authentication unavailable (no IdP configured)');
      // no advisory payload is fabricated on the fail-closed path
      expect(body.label).toBeUndefined();
      expect(body.text).toBeUndefined();
      expect(body.adviceId).toBeUndefined();
    } finally {
      await served.close();
    }
  });

  it('yields no unauthenticated advisory success path through the real dispatch (401 with no token)', async () => {
    const served = await serveRealDispatch(['iips-viewer']);
    try {
      const { status, body } = await served.get('/api/ai-advisory/Banking');
      expect(status).toBe(401);
      expect(body.text).toBeUndefined();
      expect(body.adviceId).toBeUndefined();
    } finally {
      await served.close();
    }
  });

  it('preserves the pre-existing 404 semantics for an unknown sector through the real dispatch', async () => {
    const served = await serveRealDispatch(['iips-viewer']);
    try {
      const { status, body } = await served.get('/api/ai-advisory/NotASector', 'real-token');
      expect(status).toBe(404);
      expect(String(body.error)).toContain('engine result not found');
    } finally {
      await served.close();
    }
  });

  it('dispatches only the /api/ai-advisory/ prefix — a lookalike path is not captured by the advisory branch', async () => {
    const served = await serveRealDispatch(['iips-viewer']);
    try {
      const { status, body } = await served.get('/api/ai-advisory-lookalike/Banking', 'real-token');
      expect(status).toBe(404);
      expect(body.error).toBe('not found');
    } finally {
      await served.close();
    }
  });
});
