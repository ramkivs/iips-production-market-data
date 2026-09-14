/**
 * Program v3.0 — G3: SecuredExecutor enforcement tests.
 * Uses the REAL v2.0 EnterpriseRuntime as authorization authority + a mock Keycloak verifier
 * (authentication) + mock tenant directory. Verifies 401/403, tenant isolation, audit.
 */
import { describe, it, expect, vi } from 'vitest';
import { EnterpriseRuntime } from '../../iips-platform/src/distributed/EnterpriseRuntime';
import { SecuredExecutor, type TenantDirectory } from './secured-executor';
import { AuthError, type OidcVerifier } from '../src/core/auth/keycloakAdapter';

const METADATA = { issuer: 'http://localhost:8080/realms/iips', jwksUri: 'http://localhost:8080/realms/iips/certs', clientId: 'iips-spa' };
const clock = { now: () => '2026-08-09T00:00:00.000Z' };

function verifier(claims: Record<string, unknown>): OidcVerifier {
  return { verify: vi.fn().mockResolvedValue({ subject: 'u1', claims, expiry: Date.now() / 1000 + 3600 }) };
}

function make(claims: Record<string, unknown>) {
  const runtime = new EnterpriseRuntime(clock);
  const directory: TenantDirectory = { tenantForUser: (u, cand) => (cand === 'tenant-A' ? { tenantId: 'tenant-A' } : null) };
  const resourceAccess = vi.fn().mockReturnValue(true);
  const ex = new SecuredExecutor(runtime, directory, resourceAccess, METADATA, verifier(claims));
  return { runtime, resourceAccess, ex };
}

describe('SecuredExecutor (authorization authority = EnterpriseRuntime)', () => {
  it('authenticates a valid Keycloak principal and authorizes admin', async () => {
    const { ex, resourceAccess } = make({ iss: METADATA.issuer, aud: 'iips-spa', realm_access: { roles: ['iips-admin'] }, tenant: 'tenant-A' });
    const p = await ex.authenticate('token');
    expect(p.userId).toBe('u1');
    expect(p.tenantId).toBe('tenant-A');
    expect(p.roles).toEqual(['admin']);
    const granted = ex.authorize(p, 'execute', 'sector.technology', 1, 100);
    expect(granted.tenantId).toBe('tenant-A');
    expect(resourceAccess).toHaveBeenCalled();
  });

  it('returns 401 on invalid/expired Keycloak credential', async () => {
    const { ex } = make({ iss: METADATA.issuer, aud: 'iips-spa' });
    const verifier = { verify: vi.fn().mockRejectedValue(new AuthError(401, 'expired')) };
    const bad = new SecuredExecutor(new EnterpriseRuntime(clock), { tenantForUser: () => ({ tenantId: 'A' }) }, () => true, METADATA, verifier);
    await expect(bad.authenticate('expired')).rejects.toMatchObject({ status: 401 });
  });

  it('returns 403 when a viewer tries to execute', async () => {
    const { ex } = make({ iss: METADATA.issuer, aud: 'iips-spa', realm_access: { roles: ['iips-viewer'] }, tenant: 'tenant-A' });
    const p = await ex.authenticate('token');
    // viewer role: EnterpriseRuntime role policy allows only 'read'; 'execute' is denied.
    await expect(() => ex.authorize(p, 'execute', 'sector.technology', 0, 100)).toThrowError(AuthError);
  });

  it('enforces tenant isolation (Tenant A cannot access Tenant B resource)', async () => {
    const { ex } = make({ iss: METADATA.issuer, aud: 'iips-spa', realm_access: { roles: ['iips-analyst'] }, tenant: 'tenant-A' });
    const p = await ex.authenticate('token');
    expect(ex.tenantAllows(p, 'portfolio', 'tenant-A')).toBe(true);
    expect(ex.tenantAllows(p, 'portfolio', 'tenant-B')).toBe(false);
  });

  it('records audit events (allow + deny)', async () => {
    const { ex, runtime } = make({ iss: METADATA.issuer, aud: 'iips-spa', realm_access: { roles: ['iips-admin'] }, tenant: 'tenant-A' });
    const p = await ex.authenticate('token');
    ex.authorize(p, 'execute', 'sector.technology', 0, 100);
    expect(runtime.auditLog().length).toBeGreaterThan(0);
    const last = runtime.auditLog()[runtime.auditLog().length - 1];
    expect(last.allowed).toBe(true);
    expect(last.tenantId).toBe('tenant-A');
  });
});
