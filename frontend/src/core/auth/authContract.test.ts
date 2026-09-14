/**
 * Program v3.0 — G3: IdP-neutral auth contract tests.
 * Verifies the CONTRACT shapes and frozen 401/403 semantics. No authentication implementation.
 */
import { describe, it, expect } from 'vitest';
import { SECURITY_STATUS, type SessionValidator, type ValidatedIdentity, type PrincipalResolver } from './authContract';
import type { Role } from '../session/session';

describe('G3 auth contract (IdP-neutral, vendor-open)', () => {
  it('defines 401 (unauthorized) and 403 (forbidden) distinctly', () => {
    expect(SECURITY_STATUS.UNAUTHORIZED).toBe(401);
    expect(SECURITY_STATUS.FORBIDDEN).toBe(403);
    expect(SECURITY_STATUS.UNAUTHORIZED).not.toBe(SECURITY_STATUS.FORBIDDEN);
  });

  it('SessionValidator shape is mechanism-agnostic (validate + revoke only)', () => {
    const validator: SessionValidator = {
      async validate() { return { subject: 'u', claims: {}, expiry: 0 }; },
      async revoke() {},
    };
    expect(typeof validator.validate).toBe('function');
    expect(typeof validator.revoke).toBe('function');
  });

  it('PrincipalResolver maps a validated identity to a governed principal', () => {
    const resolver: PrincipalResolver = {
      resolve(identity: ValidatedIdentity) {
        const tenant = identity.claims.tenant === 'X' ? 'X' : 'system';
        const roles: Role[] = identity.claims.role === 'admin' ? ['admin'] : ['viewer'];
        return { userId: identity.subject, tenantId: tenant, roles };
      },
    };
    const id: ValidatedIdentity = { subject: 'u1', claims: { tenant: 'X', role: 'admin' }, expiry: 123 };
    const p = resolver.resolve(id);
    expect(p.userId).toBe('u1');
    expect(p.tenantId).toBe('X');
    expect(p.roles).toEqual(['admin']);
  });
});
