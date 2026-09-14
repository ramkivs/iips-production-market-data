/**
 * Program v3.0 — G3: Keycloak adapter tests (mock OIDC verifier — no live Keycloak needed).
 * Validates issuer/audience/expiry + role mapping. Authorization authority remains platform-side.
 */
import { describe, it, expect, vi } from 'vitest';
import { KeycloakSessionValidator, mapKeycloakRoles, AuthError, type OidcVerifier } from './keycloakAdapter';

const METADATA = { issuer: 'http://localhost:8080/realms/iips', jwksUri: 'http://localhost:8080/realms/iips/protocol/openid-connect/certs', clientId: 'iips-spa' };

function makeVerifier(claims: Record<string, unknown>, expiry = Date.now() / 1000 + 3600): OidcVerifier {
  return { verify: vi.fn().mockResolvedValue({ subject: 'u1', claims, expiry }) };
}

describe('Keycloak adapter (authentication authority)', () => {
  it('validates a valid token with correct issuer + audience', async () => {
    const v = new KeycloakSessionValidator(METADATA, makeVerifier({ iss: METADATA.issuer, aud: 'iips-spa', realm_access: { roles: ['iips-analyst'] } }));
    const id = await v.validate('token');
    expect(id.subject).toBe('u1');
    expect(id.expiry).toBeGreaterThan(Date.now() / 1000);
  });

  it('rejects a wrong issuer (401)', async () => {
    const v = new KeycloakSessionValidator(METADATA, makeVerifier({ iss: 'evil', aud: 'iips-spa' }));
    await expect(v.validate('token')).rejects.toBeInstanceOf(AuthError);
    await expect(v.validate('token')).rejects.toMatchObject({ status: 401 });
  });

  it('rejects a wrong audience (401)', async () => {
    const v = new KeycloakSessionValidator(METADATA, makeVerifier({ iss: METADATA.issuer, aud: 'other-client' }));
    await expect(v.validate('token')).rejects.toMatchObject({ status: 401 });
  });

  it('rejects an expired token (401)', async () => {
    const v = new KeycloakSessionValidator(METADATA, makeVerifier({ iss: METADATA.issuer, aud: 'iips-spa' }, Date.now() / 1000 - 10));
    await expect(v.validate('token')).rejects.toMatchObject({ status: 401 });
  });

  it('rejects missing/invalid credential (401)', async () => {
    const v = new KeycloakSessionValidator(METADATA, makeVerifier({}));
    await expect(v.validate('')).rejects.toMatchObject({ status: 401 });
    await expect(v.validate(undefined)).rejects.toMatchObject({ status: 401 });
  });

  it('maps Keycloak roles to governed roles (mapping only, not authorization)', () => {
    expect(mapKeycloakRoles({ realm_access: { roles: ['iips-admin'] } })).toEqual(['admin']);
    expect(mapKeycloakRoles({ realm_access: { roles: ['iips-analyst'] } })).toEqual(['analyst']);
    expect(mapKeycloakRoles({ realm_access: { roles: ['iips-viewer'] } })).toEqual(['viewer']);
    expect(mapKeycloakRoles({ realm_access: { roles: [] } })).toEqual(['viewer']);
  });
});
