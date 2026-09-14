/**
 * Program v3.0 — Phase 12.1: Administration transport — security + governed-read tests.
 *
 * Exercises the G3 boundary on every admin endpoint with a mock OIDC verifier (offline-safe):
 *   admin → 200 (authorized, audited) · analyst → 403 · viewer → 403 · unauthenticated → 401
 *   tenant isolation (data-governance/audit are tenant-filtered)
 *   no fabricated values (missing governed data is absent, never fabricated)
 * The same handlers are wired to a REAL Keycloak verifier in the G3 LIVE path.
 */
import { describe, it, expect, vi } from 'vitest';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { buildAdminState, createAdminExecutor } from './admin-transport';
import { AuthError, OidcVerifier } from '../src/core/auth/keycloakAdapter';

const METADATA = { issuer: 'http://localhost:8080/realms/iips', jwksUri: 'http://localhost:8080/realms/iips/certs', clientId: 'iips-spa' };

function verifier(claims: Record<string, unknown>): OidcVerifier {
  return { verify: vi.fn().mockResolvedValue({ subject: 'u1', claims, expiry: Date.now() / 1000 + 3600 }) };
}

function adminClaims(username: string): Record<string, unknown> {
  const tenant = username === 'admin-b' || username === 'analyst-b' ? 'tenant-B' : 'tenant-A';
  return { iss: METADATA.issuer, aud: 'iips-spa', preferred_username: username, tenant };
}

function execFor(claims: Record<string, unknown>) {
  return createAdminExecutor({ metadata: METADATA, verifier: verifier(claims) });
}

async function request(executor: ReturnType<typeof execFor>, path: string, token: string): Promise<{ status: number; body: unknown }> {
  const state = buildAdminState();
  const server = http.createServer((req, res) => {
    void import('./admin-transport').then(({ handleAdminRequest }) => handleAdminRequest(req, res, executor, state));
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as AddressInfo).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}

describe('Admin transport (G3 boundary + governed read)', () => {
  it('authenticated admin is authorized on every surface (200) and produces governed data', async () => {
    const ex = execFor({ ...adminClaims('admin-a'), realm_access: { roles: ['iips-admin'] } });
    for (const path of ['/api/admin/overview', '/api/admin/identity', '/api/admin/tenants', '/api/admin/engines', '/api/admin/certification', '/api/admin/platform', '/api/admin/audit', '/api/admin/live-data', '/api/admin/data-governance', '/api/admin/migration', '/api/admin/workflow', '/api/admin/marketplace']) {
      const { status } = await request(ex, path, 'real-token');
      expect(status).toBe(200);
    }
  });

  it('returns governed engines with non-fabricated identity', async () => {
    const ex = execFor({ ...adminClaims('admin-a'), realm_access: { roles: ['iips-admin'] } });
    const { body } = await request(ex, '/api/admin/engines', 't');
    const engines = (body as { engines: Array<{ engineId: string; sectorFamily: string }> }).engines;
    expect(engines.length).toBeGreaterThan(0);
    expect(engines.every((e) => e.engineId && e.sectorFamily)).toBe(true);
  });

  it('denies analyst (403) on an admin surface', async () => {
    const ex = execFor({ ...adminClaims('analyst-a'), realm_access: { roles: ['iips-analyst'] } });
    const { status } = await request(ex, '/api/admin/engines', 't');
    expect(status).toBe(403);
  });

  it('denies viewer (403) on an admin surface', async () => {
    const ex = execFor({ ...adminClaims('viewer-a'), realm_access: { roles: ['iips-viewer'] } });
    const { status } = await request(ex, '/api/admin/engines', 't');
    expect(status).toBe(403);
  });

  it('returns 401 for missing authentication', async () => {
    const ex = execFor({ ...adminClaims('admin-a'), realm_access: { roles: ['iips-admin'] } });
    const missing = await request(ex, '/api/admin/engines', '');
    expect(missing.status).toBe(401);
  });

  it('returns 401 when the OIDC verifier rejects an invalid/expired token', async () => {
    // Simulate a real IdP rejecting a bad-signature/expired token (401), which the mock accepts
    // only when the verifier rejects.
    const ex = createAdminExecutor({ metadata: METADATA, verifier: { verify: vi.fn().mockRejectedValue(new AuthError(401, 'expired')) } });
    const bad = await request(ex, '/api/admin/engines', 'expired-token');
    expect(bad.status).toBe(401);
  });

  it('tenant-isolates data-governance and audit to the authenticated principal tenant', async () => {
    const adminA = execFor({ ...adminClaims('admin-a'), realm_access: { roles: ['iips-admin'] } });
    const { body } = await request(adminA, '/api/admin/data-governance', 't');
    const data = (body as { data: Array<{ tenantId: string }> }).data;
    expect(data.every((d) => d.tenantId === 'tenant-A')).toBe(true);

    const { body: audit } = await request(adminA, '/api/admin/audit', 't');
    const records = (audit as { records: Array<{ tenantId: string }> }).records;
    expect(records.every((r) => r.tenantId === 'tenant-A')).toBe(true);
  });

  it('does not fabricate performance when measurement is unavailable', async () => {
    const ex = execFor({ ...adminClaims('admin-a'), realm_access: { roles: ['iips-admin'] } });
    const { body } = await request(ex, '/api/admin/platform', 't');
    const p = (body as { performance: unknown }).performance;
    // performance is measured live (banking baseline); if present it must be a real sample, else null.
    if (p !== null) expect(p).toMatchObject({ nodes: expect.any(Number), executions: expect.any(Number) });
  });

  it('records audit (allow) for an authorized admin read', async () => {
    const ex = execFor({ ...adminClaims('admin-a'), realm_access: { roles: ['iips-admin'] } });
    await request(ex, '/api/admin/engines', 't');
    expect(ex.auditLog().length).toBeGreaterThan(0);
    const last = ex.auditLog()[ex.auditLog().length - 1];
    expect(last.allowed).toBe(true);
    expect(last.tenantId).toBe('tenant-A');
  });

  // ---- Phase 12.2: data classification mutation (governed) ----

  async function classify(executor: ReturnType<typeof execFor>, body: unknown, token: string): Promise<{ status: number; body: unknown }> {
    const state = buildAdminState();
    const server = http.createServer((req, res) => {
      void import('./admin-transport').then(({ handleAdminRequest }) => handleAdminRequest(req, res, executor, state));
    });
    await new Promise<void>((r) => server.listen(0, r));
    const port = (server.address() as AddressInfo).port;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/admin/data-governance/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      return { status: res.status, body: await res.json().catch(() => ({})) };
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  }

  it('authorizes admin to reclassify a governed mutable tenant-A resource (200) and updates it', async () => {
    const ex = execFor({ ...adminClaims('admin-a'), realm_access: { roles: ['iips-admin'] } });
    const { status, body } = await classify(ex, { dataId: 'biz-data-A', classification: 'confidential' }, 't');
    expect(status).toBe(200);
    expect((body as { data: { classification: string; tenantId: string } }).data).toMatchObject({ dataId: 'biz-data-A', classification: 'confidential', tenantId: 'tenant-A' });
  });

  it('rejects an invalid (non-governed) classification value with 422', async () => {
    const ex = execFor({ ...adminClaims('admin-a'), realm_access: { roles: ['iips-admin'] } });
    const { status } = await classify(ex, { dataId: 'biz-data-A', classification: 'Approved' }, 't');
    expect(status).toBe(422);
  });

  it('rejects reclassification of an immutable/frozen resource with 422', async () => {
    const ex = execFor({ ...adminClaims('admin-a'), realm_access: { roles: ['iips-admin'] } });
    const { status } = await classify(ex, { dataId: 'live-snap-A', classification: 'public' }, 't');
    expect(status).toBe(422);
  });

  it('returns 404 for an unknown resource', async () => {
    const ex = execFor({ ...adminClaims('admin-a'), realm_access: { roles: ['iips-admin'] } });
    const { status } = await classify(ex, { dataId: 'does-not-exist', classification: 'public' }, 't');
    expect(status).toBe(404);
  });

  it('enforces tenant isolation: tenant-A admin cannot classify tenant-B resource (403) AND records a governed DENY audit', async () => {
    const exA = execFor({ ...adminClaims('admin-a'), realm_access: { roles: ['iips-admin'] } });
    const before = exA.auditLog().length;
    const { status } = await classify(exA, { dataId: 'biz-data-B', classification: 'confidential' }, 't');
    expect(status).toBe(403);
    const log = exA.auditLog().slice(before);
    expect(log.some((e) => e.allowed === false && e.action === 'tenant' && e.tenantId === 'tenant-A')).toBe(true);
  });

  it('enforces tenant isolation: tenant-B admin can classify tenant-B (200) and cannot classify tenant-A (403 + DENY audit)', async () => {
    const exB = execFor({ ...adminClaims('admin-b'), realm_access: { roles: ['iips-admin'] } });
    const ok = await classify(exB, { dataId: 'biz-data-B', classification: 'internal' }, 't');
    expect(ok.status).toBe(200);
    const before = exB.auditLog().length;
    const denied = await classify(exB, { dataId: 'biz-data-A', classification: 'public' }, 't');
    expect(denied.status).toBe(403);
    expect(exB.auditLog().slice(before).some((e) => e.allowed === false && e.action === 'tenant')).toBe(true);
  });

  it('denies analyst and viewer (403 + governed DENY audit) on classify mutation', async () => {
    const exAnalyst = execFor({ ...adminClaims('analyst-a'), realm_access: { roles: ['iips-analyst'] } });
    const before = exAnalyst.auditLog().length;
    expect((await classify(exAnalyst, { dataId: 'biz-data-A', classification: 'public' }, 't')).status).toBe(403);
    expect(exAnalyst.auditLog().slice(before).some((e) => e.allowed === false)).toBe(true);
    const exViewer = execFor({ ...adminClaims('viewer-a'), realm_access: { roles: ['iips-viewer'] } });
    expect((await classify(exViewer, { dataId: 'biz-data-A', classification: 'public' }, 't')).status).toBe(403);
  });

  it('returns 401 for missing authentication on classify', async () => {
    const ex = execFor({ ...adminClaims('admin-a'), realm_access: { roles: ['iips-admin'] } });
    const { status } = await classify(ex, { dataId: 'biz-data-A', classification: 'public' }, '');
    expect(status).toBe(401);
  });

  it('is effectively idempotent: repeating the same valid classify yields the same governed result (documented, not full idempotency)', async () => {
    const ex = execFor({ ...adminClaims('admin-a'), realm_access: { roles: ['iips-admin'] } });
    const first = await classify(ex, { dataId: 'biz-data-A', classification: 'restricted' }, 't');
    const second = await classify(ex, { dataId: 'biz-data-A', classification: 'restricted' }, 't');
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect((second.body as { data: { classification: string } }).data.classification).toBe('restricted');
  });

  it('records governed audit ALLOW for a successful admin mutation and governed DENY for RBAC + cross-tenant denials', async () => {
    const exAdmin = execFor({ ...adminClaims('admin-a'), realm_access: { roles: ['iips-admin'] } });
    await classify(exAdmin, { dataId: 'biz-data-A', classification: 'internal' }, 't');
    const adminLog = exAdmin.auditLog();
    expect(adminLog.some((e) => e.allowed === true && e.resource.includes('data.classify') && e.tenantId === 'tenant-A')).toBe(true);

    const exCross = execFor({ ...adminClaims('admin-a'), realm_access: { roles: ['iips-admin'] } });
    await classify(exCross, { dataId: 'biz-data-B', classification: 'public' }, 't'); // 403
    expect(exCross.auditLog().some((e) => e.allowed === false && e.action === 'tenant' && e.tenantId === 'tenant-A')).toBe(true);

    const exAnalyst = execFor({ ...adminClaims('analyst-a'), realm_access: { roles: ['iips-analyst'] } });
    await classify(exAnalyst, { dataId: 'biz-data-A', classification: 'public' }, 't'); // 403
    expect(exAnalyst.auditLog().some((e) => e.allowed === false)).toBe(true);
  });
});
