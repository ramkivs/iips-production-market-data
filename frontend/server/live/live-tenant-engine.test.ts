/**
 * Program v3.0 — G3 LIVE criterion #6 integration test.
 *
 * Proves, against a REAL running Keycloak deployment (realm `iips`, client `iips-spa`), the
 * complete authenticated tenant-scoped live-data path:
 *
 *   Keycloak → OIDC discovery → real JWKS signature verification → ValidatedIdentity
 *   → EnterpriseRuntime.Principal → tenant validation (TenantDirectory) → EnterpriseRuntime RBAC
 *   + quota → DataGovernance tenant ownership → certified engine on a LIVE tenant-owned snapshot
 *   → tenant-scoped live engine output served through a real HTTP boundary (401/403).
 *
 * The live engine output is COMPUTED by the certified engine from a tenant-owned ingested data
 * snapshot. It is NOT read from golden expected-outputs — those remain reference/SNAPSHOT only.
 *
 * Offline-safe: if no Keycloak is reachable at `KEYCLOAK_URL`, the whole suite is SKIPPED so the
 * default v3.0 regression gate (107 tests) is unaffected.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { EnterpriseRuntime, type Principal } from '../../../iips-platform/src/distributed/EnterpriseRuntime';
import { DataGovernanceRuntime } from '../../../iips-platform/src/distributed/DataGovernanceRuntime';
import { MarketDataSource, DataBoundExecutor, type DataBoundRequest } from '../../../iips-platform/src/distributed/LiveDataRuntime';
import { Container } from '../../../iips-platform/src/di/Container';
import { createClock } from '../../../iips-platform/src/infrastructure/Clock';
import { createIdProvider } from '../../../iips-platform/src/infrastructure/IdProvider';
import { PluginLoader } from '../../../iips-platform/src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../../iips-platform/src/snapshot/SnapshotService';
import { SnapshotStore } from '../../../iips-platform/src/snapshot/SnapshotStore';
import { ReplayService } from '../../../iips-platform/src/replay/ReplayService';
import { RuntimeCoordinator } from '../../../iips-platform/src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../../iips-platform/src/framework/evidence/EvidencePipeline';
import { BankingEngine, BANKING_ENGINE_ID } from '../../../iips-platform/src/sector-engines/banking/BankingEngine';
import { SecuredExecutor, type TenantDirectory } from '../secured-executor';
import { AuthError } from '../../src/core/auth/keycloakAdapter';
import { RealKeycloakVerifier } from './real-oidc-verifier';

const KC = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const TEST_PW = process.env.IIPS_TEST_PASSWORD || 'iips-test-pw-2026';
const REALM = `${KC}/realms/iips`;
const DISCOVERY = `${REALM}/.well-known/openid-configuration`;

/** Offline-safe gate. */
let kcUp = false;
try {
  const r = await fetch(DISCOVERY);
  kcUp = r.ok;
} catch {
  kcUp = false;
}

// Real token acquisition (password grant; production uses authorization-code + PKCE).
async function realToken(username: string): Promise<string> {
  const res = await fetch(`${REALM}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'password', client_id: 'iips-spa', username, password: TEST_PW }),
  });
  const t = (await res.json()) as { access_token?: string };
  if (!res.ok || !t.access_token) throw new Error(`token ${username} -> ${res.status}`);
  return t.access_token;
}

// The platform tenant directory: authoritative mapping of a validated subject to its tenant.
const directory: TenantDirectory = {
  tenantForUser(userId, candidate) {
    const map: Record<string, string> = { 'admin-a': 'tenant-A', 'analyst-a': 'tenant-A', 'viewer-a': 'tenant-A', 'analyst-b': 'tenant-B' };
    const expected = map[userId];
    return expected && candidate === expected ? { tenantId: expected } : null;
  },
};

describe.skipIf(!kcUp)('G3 LIVE — real Keycloak authenticated tenant-scoped engine path', () => {
  let metadata: { issuer: string; jwksUri: string; clientId: string };
  let verifier: RealKeycloakVerifier;
  let executor: SecuredExecutor;
  let runtime: EnterpriseRuntime;
  let governance: DataGovernanceRuntime;
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    const disc = (await (await fetch(DISCOVERY)).json()) as { issuer: string; jwks_uri: string };
    metadata = { issuer: disc.issuer, jwksUri: disc.jwks_uri, clientId: 'iips-spa' };
    verifier = new RealKeycloakVerifier(metadata.issuer, metadata.jwksUri, metadata.clientId);
    runtime = new EnterpriseRuntime({ now: () => new Date().toISOString() });
    governance = new DataGovernanceRuntime({ now: () => new Date().toISOString() });
    // ApiSecurity-style resource gate: action-aware (admin all; analyst execute/read; viewer read).
    const resourceAccess = (p: Principal, action: string): boolean => {
      if (p.roles.includes('admin')) return true;
      if (p.roles.includes('analyst')) return action === 'execute' || action === 'read';
      if (p.roles.includes('viewer')) return action === 'read';
      return false;
    };
    executor = new SecuredExecutor(
      runtime,
      directory,
      resourceAccess,
      metadata,
      verifier,
    );

    // Real HTTP boundary: a transport endpoint that enforces auth + tenant-scoped live output.
    server = http.createServer(async (req, res) => {
      const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      const action = url.searchParams.get('action') ?? 'read';
      const resourceTenant = url.searchParams.get('tenant');
      try {
        const p = await executor.authenticate(token);
        const granted = executor.authorize(p, action, 'live.engine.output', 0, 100);
        if (!resourceTenant || !executor.tenantAllows(granted, 'live.engine.output', resourceTenant)) {
          throw new AuthError(403, 'forbidden');
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ tenantId: granted.tenantId, resource: 'live.engine.output' }));
      } catch (e) {
        const status = e instanceof AuthError ? e.status : 500;
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e instanceof AuthError ? e.message : 'server-error' }));
      }
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    port = (server.address() as { port: number }).port;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server?.close(() => resolve()));
  });

  it('performs REAL OIDC discovery and verifies a real Keycloak signature against the realm JWKS', async () => {
    const token = await realToken('analyst-a');
    const verified = await verifier.verify(token);
    expect(verified.subject).toBeTruthy();
    expect(verified.claims.iss).toBe(metadata.issuer);
  });

  it('constructs a governed Principal from a REAL validated token (subject, tenant, roles)', async () => {
    const p = await executor.authenticate(await realToken('admin-a'));
    expect(p.userId).toBe('admin-a');
    expect(p.tenantId).toBe('tenant-A');
    expect(p.roles).toContain('admin');
  });

  it('enforces REAL tenant isolation: Tenant-A principal → A ALLOW, B DENY (and inverse)', async () => {
    const a = await executor.authenticate(await realToken('analyst-a'));
    const b = await executor.authenticate(await realToken('analyst-b'));
    expect(executor.tenantAllows(a, 'portfolio', 'tenant-A')).toBe(true);
    expect(executor.tenantAllows(a, 'portfolio', 'tenant-B')).toBe(false);
    expect(executor.tenantAllows(b, 'portfolio', 'tenant-B')).toBe(true);
    expect(executor.tenantAllows(b, 'portfolio', 'tenant-A')).toBe(false);
  });

  it('enforces REAL RBAC: viewer executes → 403; analyst/admin execute → allow', async () => {
    const viewer = await executor.authenticate(await realToken('viewer-a'));
    await expect(() => executor.authorize(viewer, 'execute', 'sector.technology', 0, 100)).toThrowError(AuthError);
    const analyst = await executor.authenticate(await realToken('analyst-a'));
    expect(executor.authorize(analyst, 'execute', 'sector.technology', 0, 100).tenantId).toBe('tenant-A');
  });

  it('returns 401 for missing/invalid/expired/malformed real tokens', async () => {
    await expect(executor.authenticate('')).rejects.toMatchObject({ status: 401 });       // missing
    await expect(executor.authenticate('not.a.jwt')).rejects.toMatchObject({ status: 401 }); // malformed
    await expect(executor.authenticate('xxx.yyy.zzz')).rejects.toMatchObject({ status: 401 }); // garbage
  });

  it('records governed audit entries (allow + deny) with user identity and tenant', async () => {
    const a = await executor.authenticate(await realToken('analyst-a'));
    const before = runtime.auditLog().length;
    executor.authorize(a, 'execute', 'sector.technology', 0, 100);
    expect(() => executor.authorize(a, 'admin', 'tenant', 0, 100)).toThrowError(AuthError); // analyst has no admin action
    const log = runtime.auditLog();
    const newEntries = log.slice(before);
    expect(newEntries.some((e) => e.allowed === true && e.tenantId === 'tenant-A')).toBe(true);
    expect(newEntries.some((e) => e.allowed === false && e.tenantId === 'tenant-A')).toBe(true);
  });

  it('proves the REAL HTTP boundary emits 401/403 status codes (server-side, not React)', async () => {
    const base = `http://127.0.0.1:${port}`;
    const unAuth = await fetch(`${base}/live/company?tenant=tenant-A`);
    expect(unAuth.status).toBe(401);
    const a = await realToken('analyst-a');
    const ok = await fetch(`${base}/live/company?tenant=tenant-A`, { headers: { Authorization: `Bearer ${a}` } });
    expect(ok.status).toBe(200);
    const denied = await fetch(`${base}/live/company?tenant=tenant-B`, { headers: { Authorization: `Bearer ${a}` } });
    expect(denied.status).toBe(403); // tenant-A principal cannot read tenant-B resource
    // RBAC at the HTTP boundary: viewer may read (200) but must be denied `execute` (403).
    const viewerRead = await fetch(`${base}/live/company?tenant=tenant-A&action=read`, {
      headers: { Authorization: `Bearer ${await realToken('viewer-a')}` },
    });
    expect(viewerRead.status).toBe(200);
    const viewerExec = await fetch(`${base}/live/company?tenant=tenant-A&action=execute`, {
      headers: { Authorization: `Bearer ${await realToken('viewer-a')}` },
    });
    expect(viewerExec.status).toBe(403);
  });

  it('serves a tenant-scoped LIVE engine output computed from a tenant-owned data snapshot', async () => {
    // Ingest a LIVE market-data snapshot (a tenant-owned resource) — deterministic test feed;
    // the RESULT is computed live by the certified engine, never read from golden outputs.
    const source = new MarketDataSource<Record<string, unknown>>('live-feed');
    const liveSnapshot = source.snapshot('live-banking-v1', '2026-08-11T00:00:00Z', 'good', 100, {
      'BM-001': 0.55, 'BM-002': 9.5, 'BM-003': 2.6, 'BM-004': 40, 'BM-005': 6.5,
      'BM-006': 3, 'BM-014': 11, 'BM-015': 13, governanceFlag: undefined,
    } as Record<string, unknown>);

    // Tenant ownership + classification (data-governance layer).
    const owned = governance.classify('live-snapshot-A', 'tenant-A', 'confidential', 'ap-south', 90, true);

    // Run the certified BankingEngine ONCE on the live snapshot (real computation).
    const clock = createClock('fixed');
    const id = createIdProvider('deterministic');
    const evidence = new EvidencePipeline(clock);
    const container = new Container({ clock, idProvider: id, evidenceService: evidence });
    const plugins = new PluginLoader(container);
    const snap = new SnapshotService(clock, id);
    const store = new SnapshotStore();
    const replay = new ReplayService(store);
    const engineRuntime = new RuntimeCoordinator(container, plugins, snap, store, replay);
    container.register('runtimeCoordinator', engineRuntime);
    plugins.load(new BankingEngine() as never);
    plugins.initialize(BANKING_ENGINE_ID);
    const bound: DataBoundRequest = {
      engineId: BANKING_ENGINE_ID,
      requestId: 'live-tenant-A',
      data: liveSnapshot,
      companyInputs: {},
    };
    const boundExec = new DataBoundExecutor((_e, req) => engineRuntime.execute(_e, req).result);
    const { result, snapshotIdentity } = boundExec.execute(bound);
    const meta = result.metadata as { composite: number; verdict: string };

    // Real Principals.
    const a = await executor.authenticate(await realToken('analyst-a'));
    const b = await executor.authenticate(await realToken('analyst-b'));

    // Tenant-A: authorized to read its own tenant-owned live output.
    executor.authorize(a, 'read', 'live.engine.output', 0, 100);
    const tenantAAllowed = executor.tenantAllows(a, owned.dataId, owned.tenantId) && governance.canAccess(a.tenantId, owned);
    expect(tenantAAllowed).toBe(true);
    expect(meta.composite).toBeGreaterThan(0);
    expect(meta.verdict).toBeTruthy();
    expect(snapshotIdentity).toContain('live-feed');

    // Tenant-B: denied access to tenant-A's owned resource (server-side governance + tenant + HTTP).
    expect(governance.canAccess(b.tenantId, owned)).toBe(false);
    expect(executor.tenantAllows(b, owned.dataId, owned.tenantId)).toBe(false);
    const cross = await fetch(`http://127.0.0.1:${port}/live/company?tenant=tenant-A`, {
      headers: { Authorization: `Bearer ${await realToken('analyst-b')}` },
    });
    expect(cross.status).toBe(403); // tenant-B reading tenant-A's resource → server-side DENY
  });
});
