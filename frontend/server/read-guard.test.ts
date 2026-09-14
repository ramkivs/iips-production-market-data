/**
 * Program v3.0 — N+2 hardening: governed READ authorization contract tests (offline-safe).
 *
 * Proves the read boundary reuses the existing Keycloak authentication + governed RBAC:
 *   viewer/analyst/admin → read allowed (authenticated + authorized)
 *   missing/expired/invalid token → 401
 *   the read gate is action-aware (viewer denied execute → 403)
 *   the admin gate remains admin-only (unchanged admin boundary)
 */
import { describe, it, expect, vi } from 'vitest';
import { createReadExecutor, createAdminExecutor, guardRead } from './admin-transport';
import { AuthError, type OidcVerifier } from '../src/core/auth/keycloakAdapter';

const METADATA = { issuer: 'http://localhost:8080/realms/iips', jwksUri: 'http://localhost:8080/realms/iips/certs', clientId: 'iips-spa' };

function verifier(claims: Record<string, unknown>, expiry = Date.now() / 1000 + 3600): OidcVerifier {
  return { verify: vi.fn().mockResolvedValue({ subject: 'u1', claims, expiry }) };
}

function claims(username: string, roles: string[]): Record<string, unknown> {
  return { iss: METADATA.issuer, aud: 'iips-spa', preferred_username: username, tenant: 'tenant-A', realm_access: { roles } };
}

function readExec(roles: string[], username = 'viewer-a'): ReturnType<typeof createReadExecutor> {
  return createReadExecutor({ metadata: METADATA, verifier: verifier(claims(username, roles)) });
}

describe('guardRead (N+2) — governed read authorization', () => {
  it('authenticates + authorizes a viewer for read', async () => {
    const p = await guardRead(readExec(['iips-viewer']), 'token', 'executive');
    expect(p.roles).toContain('viewer');
    expect(p.tenantId).toBe('tenant-A');
  });

  it('authenticates + authorizes an analyst for read', async () => {
    const p = await guardRead(readExec(['iips-analyst'], 'analyst-a'), 'token', 'portfolio');
    expect(p.roles).toContain('analyst');
  });

  it('authenticates + authorizes an admin for read', async () => {
    const p = await guardRead(readExec(['iips-admin'], 'admin-a'), 'token', 'evidence');
    expect(p.roles).toContain('admin');
  });

  it('rejects a missing token with 401', async () => {
    await expect(guardRead(readExec(['iips-viewer']), '', 'executive')).rejects.toMatchObject({ status: 401 });
  });

  it('rejects an expired token with 401', async () => {
    const ex = createReadExecutor({ metadata: METADATA, verifier: verifier(claims('viewer-a', ['iips-viewer']), Date.now() / 1000 - 60) });
    await expect(guardRead(ex, 'token', 'executive')).rejects.toMatchObject({ status: 401 });
  });

  it('read gate is action-aware: viewer is denied execute (403)', async () => {
    const ex = readExec(['iips-viewer']);
    const p = await ex.authenticate('token');
    expect(() => ex.authorize(p, 'execute', 'read.executive', 0, 1000)).toThrowError(AuthError);
  });

  it('admin executor gate remains admin-only (read is NOT granted there)', async () => {
    const adminEx = createAdminExecutor({ metadata: METADATA, verifier: verifier(claims('admin-a', ['iips-admin'])) });
    const p = await adminEx.authenticate('token');
    expect(() => adminEx.authorize(p, 'read', 'read.executive', 0, 1000)).toThrowError(AuthError);
  });
});
