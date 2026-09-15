/**
 * UI12 (D80) — Settings HTTP transport tests (offline, deterministic).
 *
 * Proves authorization, server-derived tenant/owner, tenant isolation, owner scoping,
 * cross-tenant denial and fail-closed validation at the HTTP boundary.
 *
 * Mirrors the promoted P-2 notes HTTP harness exactly — same executor, same verifier stub,
 * same ephemeral-server pattern. No new RBAC model is introduced or tested.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PersistenceService } from '../persistence/persistence-service';
import { resetSettingsPersistence } from './settings-service';
import { handleSettingsRequest, createReadExecutor } from '../admin-transport';
import type { OidcVerifier } from '../../src/core/auth/keycloakAdapter';

const METADATA = { issuer: 'http://localhost:8080/realms/iips', jwksUri: 'http://localhost:8080/realms/iips/certs', clientId: 'iips-spa' };

const tmpDirs: string[] = [];
function tmpDir(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'iips-ui12-'));
  tmpDirs.push(d);
  return d;
}
beforeEach(() => resetSettingsPersistence());
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
  resetSettingsPersistence();
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
  method: 'GET' | 'PUT',
  s: PersistenceService,
  body?: unknown,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const deps = { metadata: METADATA, verifier: verifier(claimsFor(who?.user ?? 'analyst-a', who?.role ?? 'iips-analyst', who?.tenant)) };
  const executor = createReadExecutor(deps);
  const server = http.createServer((req, res) => {
    void handleSettingsRequest(req, res, executor, { store: s });
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

const CUSTOM = { theme: 'dark', density: 'compact', defaultDataMode: 'PIT', showDegradedDetail: false };
const data = (b: Record<string, unknown>) => b.data as Record<string, unknown>;
const prefs = (b: Record<string, unknown>) => data(b).preferences as Record<string, unknown>;

describe('UI12 transport — authorization', () => {
  it('unauthenticated GET is rejected (fail-closed)', async () => {
    const { status } = await call(null, '/api/settings', 'GET', store());
    expect(status).toBe(401);
  });

  it('unauthenticated PUT is rejected (fail-closed)', async () => {
    const { status } = await call(null, '/api/settings', 'PUT', store(), { preferences: CUSTOM });
    expect(status).toBe(401);
  });

  it('a viewer MAY read their own preferences', async () => {
    const { status, body } = await call({ user: 'viewer-a', role: 'iips-viewer' }, '/api/settings', 'GET', store());
    expect(status).toBe(200);
    expect(data(body).revision).toBe(0);
  });

  it('a viewer may NOT save preferences (403)', async () => {
    const { status } = await call({ user: 'viewer-a', role: 'iips-viewer' }, '/api/settings', 'PUT', store(), { preferences: CUSTOM });
    expect(status).toBe(403);
  });

  it('an analyst may save preferences', async () => {
    const { status, body } = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/settings', 'PUT', store(), { preferences: CUSTOM });
    expect(status).toBe(200);
    expect(prefs(body).theme).toBe('dark');
    expect(data(body).revision).toBe(1);
  });

  it('an unknown settings path is 404', async () => {
    const { status } = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/settings/other', 'GET', store());
    expect(status).toBe(404);
  });
});

describe('UI12 transport — server-derived identity and isolation', () => {
  it('a saved preference is retrievable by the same principal', async () => {
    const s = store();
    await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/settings', 'PUT', s, { preferences: CUSTOM });
    const { body } = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/settings', 'GET', s);
    expect(prefs(body).defaultDataMode).toBe('PIT');
    expect(data(body).revision).toBe(1);
  });

  /**
   * ⚠ The platform `ADMIN_DIRECTORY` binds each user to exactly ONE authoritative tenant
   * (`analyst-a`→tenant-A, `analyst-b`→tenant-B) and 401s `no-valid-tenant` when the token's
   * tenant claim disagrees. Cross-tenant access is therefore unreachable over HTTP by
   * construction — asserted here rather than assumed, and separately from the service-level
   * tenant-isolation tests in settings-service.test.ts.
   */
  it('a token claiming a tenant the user does not belong to is rejected (401)', async () => {
    const s = store();
    await call({ user: 'analyst-a', role: 'iips-analyst', tenant: 'tenant-A' }, '/api/settings', 'PUT', s, { preferences: CUSTOM });
    const { status, body } = await call({ user: 'analyst-a', role: 'iips-analyst', tenant: 'tenant-B' }, '/api/settings', 'GET', s);
    expect(status).toBe(401);
    expect(body.error).toBe('no-valid-tenant');
  });

  it('a DIFFERENT TENANT principal gets governed defaults, never the first tenant data', async () => {
    const s = store();
    await call({ user: 'analyst-a', role: 'iips-analyst', tenant: 'tenant-A' }, '/api/settings', 'PUT', s, { preferences: CUSTOM });
    // analyst-b is authoritatively bound to tenant-B.
    const { status, body } = await call({ user: 'analyst-b', role: 'iips-analyst', tenant: 'tenant-B' }, '/api/settings', 'GET', s);
    expect(status).toBe(200);
    expect(data(body).revision).toBe(0);
    expect(prefs(body).theme).toBe('light');
  });

  it('another OWNER gets governed defaults, not the first owner data', async () => {
    const s = store();
    await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/settings', 'PUT', s, { preferences: CUSTOM });
    const { status, body } = await call({ user: 'viewer-a', role: 'iips-viewer', tenant: 'tenant-A' }, '/api/settings', 'GET', s);
    expect(status).toBe(200);
    expect(data(body).revision).toBe(0);
  });

  it('a client-supplied tenant/owner in the BODY is ignored — identity comes from the principal', async () => {
    const s = store();
    await call({ user: 'analyst-a', role: 'iips-analyst', tenant: 'tenant-A' }, '/api/settings', 'PUT', s, {
      preferences: CUSTOM,
      tenantId: 'tenant-B',
      ownerUserId: 'someone-else',
    });
    // Written under the AUTHENTICATED identity only.
    const mine = await call({ user: 'analyst-a', role: 'iips-analyst', tenant: 'tenant-A' }, '/api/settings', 'GET', s);
    expect(data(mine.body).revision).toBe(1);
    // The principal named in the body sees nothing — the smuggled identity was never used.
    const spoofed = await call({ user: 'analyst-b', role: 'iips-analyst', tenant: 'tenant-B' }, '/api/settings', 'GET', s);
    expect(data(spoofed.body).revision).toBe(0);
  });

  it('preferences survive a restart (journal reconstruction over HTTP)', async () => {
    const dir = tmpDir();
    await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/settings', 'PUT', store(dir), { preferences: CUSTOM });
    // A brand-new PersistenceService over the same dir rebuilds from the journal.
    const { body } = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/settings', 'GET', store(dir));
    expect(prefs(body).theme).toBe('dark');
    expect(data(body).revision).toBe(1);
  });
});

describe('UI12 transport — fail-closed validation', () => {
  it('a missing preferences object is 400', async () => {
    const { status, body } = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/settings', 'PUT', store(), {});
    expect(status).toBe(400);
    expect(body.error).toBe('preferences-required');
  });

  it('an invalid theme is 422 and is NOT coerced', async () => {
    const s = store();
    const { status, body } = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/settings', 'PUT', s, {
      preferences: { ...CUSTOM, theme: 'neon' },
    });
    expect(status).toBe(422);
    expect(body.error).toBe('invalid-theme');
    // Nothing was persisted by the rejected request.
    const after = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/settings', 'GET', s);
    expect(data(after.body).revision).toBe(0);
  });

  it('an invalid data mode is 422', async () => {
    const { status, body } = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/settings', 'PUT', store(), {
      preferences: { ...CUSTOM, defaultDataMode: 'REALTIME' },
    });
    expect(status).toBe(422);
    expect(body.error).toBe('invalid-defaultDataMode');
  });

  it('the response carries governed provenance', async () => {
    const { body } = await call({ user: 'analyst-a', role: 'iips-analyst' }, '/api/settings', 'GET', store());
    const p = body.provenance as Record<string, unknown>;
    expect(String(p.dataSource)).toMatch(/UI12 user preferences/);
    expect(String(p.transportSemantics)).toMatch(/owner-scoped/);
  });
});
