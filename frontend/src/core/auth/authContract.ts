/**
 * Program v3.0 — G3: IdP-neutral authentication contract (mechanism-agnostic).
 *
 * This is a CONTRACT ONLY — it is NOT an authentication implementation and does not bind to
 * any vendor. It defines the shapes an approved identity provider adapter will satisfy. No
 * credentials, login, token issuance, or session mechanism exists.
 *
 * Authentication authority ≠ Authorization authority ≠ Transport ≠ React.
 * Authoritative authorization remains EnterpriseRuntime / PlatformApi.ApiSecurity.
 */
import type { Role } from '../session/session';

/** A validated identity from an approved external IdP (claims are untrusted until validated). */
export interface ValidatedIdentity {
  readonly subject: string;
  readonly claims: Readonly<Record<string, unknown>>;
  readonly expiry: number;
}

/** IdP-neutral adapter boundary (vendor-open). */
export interface SessionValidator {
  /** Validate an approved external authentication/session credential; returns a validated identity. */
  validate(credential: unknown): Promise<ValidatedIdentity>;
  /** Revocation/logout where the IdP supports it. */
  revoke(sessionId: string): Promise<void>;
}

/** Maps a validated identity to a governed application principal (tenant + roles resolved by platform). */
export interface PrincipalResolver {
  resolve(identity: ValidatedIdentity): { userId: string; tenantId: string; roles: Role[] };
}

/** Frozen HTTP security semantics (401 vs 403). */
export const SECURITY_STATUS = {
  UNAUTHORIZED: 401, // authentication absent/invalid/expired/revoked
  FORBIDDEN: 403,    // authenticated Principal exists but not authorized for action/resource
} as const;
