/**
 * Program v3.0 — Session model.
 *
 * This carries the current DISPLAY session (user/tenant/role) for role-aware shell
 * rendering. It does NOT perform authentication or authorization — those remain
 * owned by the v2.0 platform (EnterpriseRuntime / ApiSecurity) and the transport.
 * The browser never uses this model to make authorization decisions.
 *
 * Phase — Browser Authentication Integration: `roles` is an additive, display-only
 * field (Keycloak-derived realm-role mapping). `role` is retained as the primary
 * presentation role for backward compatibility.
 */
export type Role = 'viewer' | 'analyst' | 'admin';

export interface Session {
  readonly userId: string;
  readonly tenantId: string;
  readonly role: Role;
  readonly authenticated: boolean;
  /** Display-only Keycloak-derived roles (never an authorization authority). */
  readonly roles?: readonly Role[];
}

/** Default unauthenticated session used by the shell until the auth layer is wired. */
export const ANONYMOUS_SESSION: Session = {
  userId: 'anonymous',
  tenantId: 'system',
  role: 'viewer',
  authenticated: false,
};
