/**
 * Program v3.0 — G3: SecuredExecutor (server-side enforcement boundary).
 *
 * Lives in the TRANSPORT (server), NOT the React bundle. Wires the Keycloak AUTHENTICATION
 * authority into the IIPS v2.0 AUTHORIZATION authority:
 *   Keycloak validation → ValidatedIdentity → EnterpriseRuntime.Principal
 *   → tenant validation → EnterpriseRuntime RBAC + quota → PlatformApi.ApiSecurity-style
 *   resource check → audit → granted Principal.
 *
 * This is where "who is the user" (Keycloak) meets "what the user may do" (EnterpriseRuntime /
 * PlatformApi.ApiSecurity). React and the transport are NOT the security authority.
 */
import { EnterpriseRuntime, type Principal, type Role } from '../../iips-platform/src/distributed/EnterpriseRuntime';
import { KeycloakSessionValidator, mapKeycloakRoles, AuthError, type OidcRealmMetadata, type OidcVerifier } from '../src/core/auth/keycloakAdapter';

export interface TenantDirectory {
  /** Map an external subject to the authoritative tenant (platform-validated). */
  tenantForUser(userId: string, candidateTenant: unknown): { tenantId: string } | null;
}

export class SecuredExecutor {
  private readonly validator: KeycloakSessionValidator;

  constructor(
    private readonly runtime: EnterpriseRuntime,
    private readonly directory: TenantDirectory,
    private readonly resourceAccess: (principal: Principal, action: string, resource: string) => boolean,
    metadata: OidcRealmMetadata,
    verifier: OidcVerifier,
  ) {
    this.validator = new KeycloakSessionValidator(metadata, verifier);
  }

  /** Authenticate via Keycloak and resolve a governed Principal (or 401). */
  async authenticate(credential: unknown): Promise<Principal> {
    const id = await this.validator.validate(credential);
    // Governed userId: prefer the stable IdP username when present; fall back to the OIDC subject
    // (UUID). The tenant is always platform-validated — never taken from the client/URL/state.
    const governedUserId = (id.claims['preferred_username'] as string) ?? id.subject;
    const tenant = this.directory.tenantForUser(governedUserId, id.claims.tenant);
    if (!tenant) throw new AuthError(401, 'no-valid-tenant');
    const roles: Role[] = mapKeycloakRoles(id.claims) as Role[];
    return { userId: governedUserId, tenantId: tenant.tenantId, roles };
  }

  /**
   * Enforce authorization for the REQUESTED action (EnterpriseRuntime RBAC) + quota + the
   * ApiSecurity-style resource gate; audit; return granted Principal (403 on deny).
   *
   * Each enforcement layer audits through the governed runtime; the allow path records a single
   * allow audit, each deny path records a deny audit.
   */
  authorize(principal: Principal, action: string, resource: string, quotaUsed: number, quotaMax: number): Principal {
    // 1. RBAC for the requested action (not forced 'execute') via the governed runtime.
    if (!this.runtime.check(principal, action, resource)) throw new AuthError(403, 'forbidden');
    // 2. Quota (governed, execute-scoped).
    if (quotaUsed >= quotaMax) { this.runtime.check(principal, action, resource); throw new AuthError(403, 'quota-exceeded'); }
    // 3. ApiSecurity-style resource gate for the requested action.
    if (!this.resourceAccess(principal, action, resource)) { this.runtime.check(principal, action, resource); throw new AuthError(403, 'forbidden'); }
    return principal;
  }

  tenantAllows(principal: Principal, resource: string, resourceTenant: string): boolean {
    return this.runtime.isTenantResource(principal, resource, resourceTenant);
  }

  /**
   * Governed mutation authorization (tenant-aware). Enforces tenant ownership FIRST (audited via
   * EnterpriseRuntime.checkIsTenantResource -> governed DENY audit for cross-tenant), then RBAC
   * (audited via EnterpriseRuntime.check -> governed DENY for non-admin), then quota + resource
   * gate. Returns the granted Principal or throws 403. Every decision is governed-audited.
   */
  authorizeMutation(principal: Principal, action: string, resource: string, resourceTenant: string, quotaUsed: number, quotaMax: number): Principal {
    if (!this.runtime.checkIsTenantResource(principal, resource, resourceTenant)) throw new AuthError(403, 'cross-tenant-denied');
    if (!this.runtime.check(principal, action, resource)) throw new AuthError(403, 'forbidden');
    if (quotaUsed >= quotaMax) { this.runtime.check(principal, action, resource); throw new AuthError(403, 'quota-exceeded'); }
    if (!this.resourceAccess(principal, action, resource)) { this.runtime.check(principal, action, resource); throw new AuthError(403, 'forbidden'); }
    return principal;
  }

  auditLog() { return this.runtime.auditLog(); }
}
