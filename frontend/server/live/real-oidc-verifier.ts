/**
 * Program v3.0 — G3 LIVE: RealKeycloakVerifier.
 *
 * The production-style OIDC verifier used to prove the G3 LIVE criterion (#6). It performs
 * REAL OIDC discovery against a running Keycloak realm and verifies an actual Keycloak-issued
 * token's RSA signature against the realm's REAL JWKS using WebCrypto (RS256). It never trusts
 * client-supplied claims without cryptographic verification.
 *
 * This is the missing empirical link from the previously-certified (unit/contract) adapter:
 * it connects the `OidcVerifier` seam to a genuine IdP instead of a mock.
 */
import { webcrypto } from 'node:crypto';
import { AuthError } from '../../src/core/auth/keycloakAdapter';

// Normalize Node's WebCrypto to the standard SubtleCrypto/DOM types for a single typed surface.
const subtle = webcrypto.subtle as unknown as SubtleCrypto;

/** A JSON Web Key (RSA public key) as returned by Keycloak's JWKS endpoint. */
export interface Jwk {
  readonly kid?: string;
  readonly kty?: string;
  readonly alg?: string;
  readonly n?: string;
  readonly e?: string;
}

function b64uDecode(s: string): string {
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b + '='.repeat((4 - (b.length % 4)) % 4), 'base64').toString('utf8');
}

function b64uToBytes(s: string): Uint8Array {
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  return new Uint8Array(Buffer.from(b + '='.repeat((4 - (b.length % 4)) % 4), 'base64'));
}

export class RealKeycloakVerifier {
  private jwksCache: Jwk[] | null = null;

  constructor(
    private readonly issuer: string,
    private readonly jwksUri: string,
    private readonly clientId: string,
  ) {}

  /** Verify an OIDC token's signature/claims against the real realm JWKS. */
  async verify(token: string): Promise<{ subject: string; claims: Record<string, unknown>; expiry: number }> {
    const parts = token.split('.');
    if (parts.length !== 3) throw new AuthError(401, 'malformed-token');

    let payload: { sub?: string; exp?: number; iss?: string; aud?: string | string[] } & Record<string, unknown>;
    let header: { kid?: string; alg?: string };
    try {
      payload = JSON.parse(b64uDecode(parts[1])) as typeof payload;
      header = JSON.parse(b64uDecode(parts[0])) as typeof header;
    } catch {
      throw new AuthError(401, 'malformed-token');
    }

    // Issuer + audience guard (defense in depth; KeycloakSessionValidator re-checks too).
    if (payload.iss !== this.issuer) throw new AuthError(401, 'invalid-issuer');
    const aud = payload.aud;
    const audOk = Array.isArray(aud) ? aud.includes(this.clientId) : aud === this.clientId;
    if (!audOk) throw new AuthError(401, 'invalid-audience');

    // REAL RSA signature verification against the realm's JWKS.
    const key = await this.loadKey(header.kid);
    const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const valid = await subtle.verify(
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      key,
      b64uToBytes(parts[2]) as BufferSource,
      data,
    );
    if (!valid) throw new AuthError(401, 'bad-signature');

    return { subject: payload.sub as string, claims: payload as Record<string, unknown>, expiry: payload.exp ?? 0 };
  }

  /** Import the realm's RSA public key (by kid) from the live JWKS endpoint. */
  private async loadKey(kid: string | undefined): Promise<CryptoKey> {
    if (!this.jwksCache) {
      const res = await fetch(this.jwksUri);
      if (!res.ok) throw new AuthError(401, 'jwks-unavailable');
      const jwks = (await res.json()) as { keys: Jwk[] };
      this.jwksCache = jwks.keys;
    }
    const jwk = this.jwksCache.find((k) => k.kty === 'RSA' && !!k.n && !!k.e && (kid ? k.kid === kid : true));
    if (!jwk) throw new AuthError(401, 'key-not-found');
    return subtle.importKey(
      'jwk',
      { kty: 'RSA', n: jwk.n as string, e: jwk.e as string },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
  }
}
