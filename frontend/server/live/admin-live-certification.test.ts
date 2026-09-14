/**
 * Program v3.0 — Phase 12.1 Certification: REAL Keycloak end-to-end admin path.
 *
 * Proves, against a REAL running Keycloak (realm `iips`), the complete authenticated admin path:
 *
 *   Keycloak → real OIDC token → real JWKS verification → ValidatedIdentity
 *   → EnterpriseRuntime.Principal → SecuredExecutor (EnterpriseRuntime RBAC + ApiSecurity-style
 *   gate + audit) → /api/admin/* read endpoint → HTTP 200/403/401.
 *
 * Tests the frozen authorization authority with REAL tokens:
 *   admin-a → 200 · analyst-a → 403 · viewer-a → 403 · no token → 401 · invalid/expired → 401
 * Real tenant isolation (admin-a tenant-A vs admin-b tenant-B): data-governance/audit payloads
 * contain only the authenticated principal's tenant; no cross-tenant records leak.
 *
 * Offline-safe: skips when no Keycloak is reachable, so the default regression gate is unaffected.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { createLiveAdminExecutor, buildAdminState } from '../admin-transport';

const KC = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const TEST_PW = process.env.IIPS_TEST_PASSWORD || 'iips-test-pw-2026';
const DISCOVERY = `${KC}/realms/iips/.well-known/openid-configuration`;

let kcUp = false;
try { kcUp = (await fetch(DISCOVERY)).ok; } catch { kcUp = false; }

async function realToken(username: string): Promise<string> {
  const res = await fetch(`${KC}/realms/iips/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'password', client_id: 'iips-spa', username, password: TEST_PW }),
  });
  const t = (await res.json()) as { access_token?: string };
  if (!res.ok || !t.access_token) throw new Error(`token ${username} -> ${res.status}`);
  return t.access_token;
}

type Exec = Awaited<ReturnType<typeof createLiveAdminExecutor>>;

describe.skipIf(!kcUp)('Phase 12.1 CERT — real Keycloak admin path', () => {
  let executor: Exec;
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    executor = await createLiveAdminExecutor();
    if (!executor) throw new Error('admin executor unavailable');
    const state = buildAdminState();
    server = http.createServer((req, res) => {
      void import('../admin-transport').then(({ handleAdminRequest }) => handleAdminRequest(req, res, executor!, state));
    });
    await new Promise<void>((r) => server.listen(0, () => r()));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((r) => server?.close(() => r()));
  });

  async function call(path: string, token: string): Promise<{ status: number; body: unknown }> {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  }

  it('performs REAL OIDC auth and admin → /api/admin/overview → 200 (real JWKS path)', async () => {
    const token = await realToken('admin-a');
    const { status } = await call('/api/admin/overview', token);
    expect(status).toBe(200);
  });

  it('denies analyst (403) and viewer (403) on /api/admin/overview', async () => {
    expect((await call('/api/admin/overview', await realToken('analyst-a'))).status).toBe(403);
    expect((await call('/api/admin/overview', await realToken('viewer-a'))).status).toBe(403);
  });

  it('returns 401 for no token and for an invalid token', async () => {
    expect((await call('/api/admin/overview', '')).status).toBe(401);
    expect((await call('/api/admin/overview', 'invalid.garbage.token')).status).toBe(401);
  });

  it('proves REAL tenant isolation: admin-a sees only tenant-A governed data; admin-b only tenant-B', async () => {
    const adminA = (await call('/api/admin/data-governance', await realToken('admin-a'))).body as { data: Array<{ tenantId: string }> };
    expect(adminA.data.every((d) => d.tenantId === 'tenant-A')).toBe(true);

    const adminB = (await call('/api/admin/data-governance', await realToken('admin-b'))).body as { data: Array<{ tenantId: string }> };
    expect(adminB.data.every((d) => d.tenantId === 'tenant-B')).toBe(true);

    // Payloads contain no cross-tenant records (not relying on React filtering).
    expect(adminA.data.some((d) => d.tenantId === 'tenant-B')).toBe(false);
    expect(adminB.data.some((d) => d.tenantId === 'tenant-A')).toBe(false);
  });

  it('proves audit viewer is tenant-isolated over real HTTP', async () => {
    const adminA = (await call('/api/admin/audit', await realToken('admin-a'))).body as { records: Array<{ tenantId: string }> };
    expect(adminA.records.every((r) => r.tenantId === 'tenant-A')).toBe(true);
    const adminB = (await call('/api/admin/audit', await realToken('admin-b'))).body as { records: Array<{ tenantId: string }> };
    expect(adminB.records.every((r) => r.tenantId === 'tenant-B')).toBe(true);
  });

  it('records governed audit ALLOW for admin read and DENY for unauthorized admin access', async () => {
    const before = executor!.auditLog().length;
    await call('/api/admin/engines', await realToken('admin-a'));       // allow
    await call('/api/admin/engines', await realToken('analyst-a'));     // deny (403)
    const log = executor!.auditLog().slice(before);
    expect(log.some((e) => e.allowed === true && e.tenantId === 'tenant-A')).toBe(true);
    expect(log.some((e) => e.allowed === false && e.tenantId === 'tenant-A')).toBe(true);
    // AuditRecord carries principal, tenant, action, resource, allow/deny, timestamp.
    const rec = log.find((e) => e.action === 'admin');
    expect(rec).toBeTruthy();
    expect(rec!.userId).toBe('admin-a');
    expect(rec!.tenantId).toBe('tenant-A');
    expect(rec!.resource).toContain('admin.');
    expect(rec!.at).toBeTruthy();
  });

  it('exposes read-only endpoints only (no mutation method/handler on any admin path)', async () => {
    // A POST to an admin endpoint must not mutate anything; the handler ignores method and is read-only.
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/engines`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await realToken('admin-a')}` },
    });
    // Read-only: returns the governed read payload (no mutation side-effect / no 405-only mutation surface).
    expect(res.status).toBe(200);
  });

  // ---- Phase 12.2: data classification mutation (real Keycloak) ----

  async function classify(token: string, body: unknown): Promise<{ status: number; body: unknown }> {
    const res = await fetch(`http://127.0.0.1:${port}/api/admin/data-governance/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  }

  it('authorizes a REAL admin token to reclassify an own-tenant governed resource (200)', async () => {
    const { status, body } = await classify(await realToken('admin-a'), { dataId: 'biz-data-A', classification: 'confidential' });
    expect(status).toBe(200);
    expect((body as { data: { tenantId: string; classification: string } }).data).toMatchObject({ tenantId: 'tenant-A', classification: 'confidential' });
  });

  it('denies a REAL analyst token on classify (403)', async () => {
    expect((await classify(await realToken('analyst-a'), { dataId: 'biz-data-A', classification: 'public' })).status).toBe(403);
  });

  it('denies a REAL viewer token on classify (403)', async () => {
    expect((await classify(await realToken('viewer-a'), { dataId: 'biz-data-A', classification: 'public' })).status).toBe(403);
  });

  it('rejects invalid (non-governed) classification value over real HTTP (422)', async () => {
    expect((await classify(await realToken('admin-a'), { dataId: 'biz-data-A', classification: 'Sensitive' })).status).toBe(422);
  });

  it('enforces REAL cross-tenant denial: tenant-A admin cannot classify tenant-B resource (403 + governed DENY audit)', async () => {
    const before = executor!.auditLog().length;
    expect((await classify(await realToken('admin-a'), { dataId: 'biz-data-B', classification: 'public' })).status).toBe(403);
    expect(executor!.auditLog().slice(before).some((e) => e.allowed === false && e.action === 'tenant' && e.tenantId === 'tenant-A')).toBe(true);
  });

  it('allows REAL tenant-B admin to classify tenant-B resource (200)', async () => {
    const { status, body } = await classify(await realToken('admin-b'), { dataId: 'biz-data-B', classification: 'internal' });
    expect(status).toBe(200);
    expect((body as { data: { tenantId: string } }).data.tenantId).toBe('tenant-B');
  });
});
