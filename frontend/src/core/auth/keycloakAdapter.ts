/**
 * Program v3.0 — G3: Keycloak OIDC adapter (authentication authority = Keycloak).
 *
 * Implements the previously-approved `SessionValidator` against Keycloak/OIDC. It validates
 * an approved external authentication credential and produces a ValidatedIdentity, which is
 * then mapped to a governed `EnterpriseRuntime.Principal` by the platform (tenant validation +
 * role mapping). Keycloak is the AUTHENTICATION authority; IIPS v2.0 remains the
 * AUTHORIZATION authority.
 *
 * To keep this testable without a live Keycloak instance, the OIDC token verification is
 * delegated to an injectable `OidcVerifier` (in production, backed by Keycloak OIDC
 * discovery + JWKS). The adapter logic (discovery metadata, claim extraction, expiry) is
 * exercised with a mock verifier in tests. No credentials/login/token issuance exists here.
 */
import type { ValidatedIdentity, SessionValidator } from './authContract';

/** OIDC realm/JWKS metadata obtained from Keycloak OIDC discovery. */
export interface OidcRealmMetadata {
  readonly issuer: string;
  readonly jwksUri: string;
  readonly clientId: string;
}

/** Verifies an OIDC ID/access token against the Keycloak realm (JWKS). In production this is
 *  backed by Keycloak OIDC discovery + key rotation. In tests it is mocked. */
export interface OidcVerifier {
  verify(token: string): Promise<{ subject: string; claims: Record<string, unknown>; expiry: number }>;
}

/**
 * Keycloak session validator: validates the OIDC credential, checks issuer + client + expiry,
 * and returns a ValidatedIdentity. The token itself is NEVER trusted from the client without
 * verification.
 */
export class KeycloakSessionValidator implements SessionValidator {
  constructor(
    private readonly metadata: OidcRealmMetadata,
    private readonly verifier: OidcVerifier,
  ) {}

  async validate(credential: unknown): Promise<ValidatedIdentity> {
    if (typeof credential !== 'string' || !credential) {
      throw new AuthError(401, 'missing-credential');
    }
    // Verify the token signature/claims via the OIDC verifier (Keycloak JWKS in production).
    const verified = await this.verifier.verify(credential);
    // Validate issuer + audience/client (never trust client-created claims).
    if (verified.claims.iss !== this.metadata.issuer) {
      throw new AuthError(401, 'invalid-issuer');
    }
    const aud = verified.claims.aud;
    const audOk = Array.isArray(aud) ? aud.includes(this.metadata.clientId) : aud === this.metadata.clientId;
    if (!audOk) throw new AuthError(401, 'invalid-audience');
    if (Date.now() / 1000 >= verified.expiry) throw new AuthError(401, 'expired');
    return { subject: verified.subject, claims: verified.claims, expiry: verified.expiry };
  }

  async revoke(_sessionId: string): Promise<void> {
    // Logout/revocation is delegated to Keycloak (where supported). No local revocation DB.
  }
}

/** A distinguishable authentication error carrying the frozen 401 semantics. */
export class AuthError extends Error {
  constructor(readonly status: 401 | 403, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Derive the governed role vocabulary from validated claims (mapping only; NOT authorization). */
export function mapKeycloakRoles(claims: Record<string, unknown>): Array<'admin' | 'analyst' | 'viewer'> {
  const realm = claims['realm_access'] as { roles?: string[] } | undefined;
  const roles = realm?.roles ?? [];
  const out: Array<'admin' | 'analyst' | 'viewer'> = [];
  if (roles.includes('iips-admin')) out.push('admin');
  if (roles.includes('iips-analyst')) out.push('analyst');
  if (roles.includes('iips-viewer')) out.push('viewer');
  return out.length ? out : ['viewer'];
}
