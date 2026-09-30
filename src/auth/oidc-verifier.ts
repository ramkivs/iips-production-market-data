/**
 * Institutional Investment Platform System (IIPS)
 * IPD OIDC Access-Token Verifier (NP04-G24 / Phase H)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * IPD independently validates the incoming credential. Trust inputs:
 *   - trusted issuer            (configuration)
 *   - signed OIDC access bearer (Authorization: Bearer)
 *   - distinct IPD audience     (ipd-user-portfolio-api)
 *   - verified subject
 *   - signature                 (trusted JWKS)
 *   - expiry
 *   - trusted JWKS              (configuration)
 *   - fail-closed verification
 *
 * NOT implemented (outside the accepted initial scope):
 * caller-service authentication, mTLS, token exchange, service credentials,
 * forwarded IRR Principal trust, browser identity trust, operator bypass.
 */

import { createVerify, verify as cryptoVerify, type KeyObject } from 'node:crypto';
import {
  OidcAlgorithmRejectedError,
  OidcAudienceMismatchError,
  OidcIssuerMismatchError,
  OidcSignatureInvalidError,
  OidcSubjectMissingError,
  OidcTokenExpiredError,
  OidcTokenMalformedError,
  OidcTokenMissingError,
  OidcTokenNotYetValidError,
} from './errors.js';
import { loadOidcTrustConfig, TRUSTED_JWS_ALGORITHMS, type OidcTrustConfig } from './config.js';
import { JwksClient, type FetchLike } from './jwks.js';

export interface VerifiedOidcCredential {
  readonly issuer: string;
  readonly subject: string;
  readonly audience: string;
  readonly expiresAt: number;
  readonly issuedAt: number | null;
  readonly claims: Readonly<Record<string, unknown>>;
}

interface JwtHeader {
  alg: string;
  kid?: string;
  typ?: string;
}

function base64UrlDecode(segment: string): Buffer {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64');
}

/** DER-encodes a raw JWS ES256 (r||s) signature for node:crypto. */
function derFromRawSignature(raw: Buffer): Buffer {
  const half = raw.length / 2;
  const r = toDerInteger(raw.subarray(0, half));
  const s = toDerInteger(raw.subarray(half));
  const body = Buffer.concat([r, s]);
  return Buffer.concat([Buffer.from([0x30]), encodeDerLength(body.length), body]);
}

function toDerInteger(value: Buffer): Buffer {
  let start = 0;
  while (start < value.length - 1 && value[start] === 0x00) {
    start++;
  }
  let body = value.subarray(start);
  if (body.length > 0 && (body[0]! & 0x80) !== 0) {
    body = Buffer.concat([Buffer.from([0x00]), body]);
  }
  return Buffer.concat([Buffer.from([0x02, body.length]), body]);
}

function encodeDerLength(length: number): Buffer {
  if (length < 0x80) {
    return Buffer.from([length]);
  }
  const bytes: number[] = [];
  let remaining = length;
  while (remaining > 0) {
    bytes.unshift(remaining & 0xff);
    remaining >>= 8;
  }
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

export class OidcVerifier {
  private readonly jwks: JwksClient;

  constructor(
    private readonly config: OidcTrustConfig,
    jwks?: JwksClient,
    private readonly clock: () => number = () => Date.now()
  ) {
    this.jwks = jwks ?? new JwksClient(config.jwksUri);
  }

  /** Builds a verifier from environment-supplied trust inputs. */
  public static fromEnvironment(
    env: NodeJS.ProcessEnv = process.env,
    fetchImpl?: FetchLike
  ): OidcVerifier {
    const config = loadOidcTrustConfig(env);
    return new OidcVerifier(config, fetchImpl ? new JwksClient(config.jwksUri, fetchImpl) : undefined);
  }

  /** Extracts and verifies a bearer credential from an Authorization header. */
  public async verifyAuthorizationHeader(
    header: string | null | undefined
  ): Promise<VerifiedOidcCredential> {
    if (typeof header !== 'string' || header.trim() === '') {
      throw new OidcTokenMissingError();
    }
    const parts = header.trim().split(/\s+/);
    if (parts.length !== 2 || parts[0]!.toLowerCase() !== 'bearer') {
      throw new OidcTokenMissingError();
    }
    return this.verifyToken(parts[1]!);
  }

  /** Verifies a compact JWS access token. Fails closed on any defect. */
  public async verifyToken(token: string): Promise<VerifiedOidcCredential> {
    if (typeof token !== 'string' || token.trim() === '') {
      throw new OidcTokenMissingError();
    }

    const segments = token.trim().split('.');
    if (segments.length !== 3) {
      throw new OidcTokenMalformedError('expected three segments');
    }
    const [encodedHeader, encodedPayload, encodedSignature] = segments as [string, string, string];

    let header: JwtHeader;
    let claims: Record<string, unknown>;
    try {
      header = JSON.parse(base64UrlDecode(encodedHeader).toString('utf8')) as JwtHeader;
      claims = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8')) as Record<string, unknown>;
    } catch {
      throw new OidcTokenMalformedError('header/payload is not valid JSON');
    }

    const algorithm = header?.alg;
    if (typeof algorithm !== 'string' || !TRUSTED_JWS_ALGORITHMS.includes(algorithm)) {
      throw new OidcAlgorithmRejectedError(typeof algorithm === 'string' ? algorithm : '<none>');
    }

    const kid = typeof header.kid === 'string' ? header.kid : '';
    if (kid === '') {
      throw new OidcTokenMalformedError('token header has no kid');
    }

    const key = await this.jwks.getKey(kid);

    const signingInput = Buffer.from(`${encodedHeader}.${encodedPayload}`, 'utf8');
    const signature = base64UrlDecode(encodedSignature);

    if (!this.verifySignature(algorithm, signingInput, signature, key)) {
      throw new OidcSignatureInvalidError();
    }

    // --- Claim validation (fail closed) ---

    const issuer = claims['iss'];
    if (issuer !== this.config.issuer) {
      throw new OidcIssuerMismatchError(typeof issuer === 'string' ? issuer : '<none>');
    }

    const audience = claims['aud'];
    const audienceValues = Array.isArray(audience)
      ? audience.filter((a): a is string => typeof a === 'string')
      : typeof audience === 'string'
        ? [audience]
        : [];
    if (!audienceValues.includes(this.config.audience)) {
      throw new OidcAudienceMismatchError();
    }

    const now = this.clock();

    const expiresAt = claims['exp'];
    if (typeof expiresAt !== 'number' || !Number.isFinite(expiresAt)) {
      throw new OidcTokenMalformedError('missing or invalid exp claim');
    }
    if (expiresAt * 1000 <= now) {
      throw new OidcTokenExpiredError();
    }

    const notBefore = claims['nbf'];
    if (typeof notBefore === 'number' && notBefore * 1000 > now) {
      throw new OidcTokenNotYetValidError();
    }

    const subject = claims['sub'];
    if (typeof subject !== 'string' || subject.trim() === '') {
      throw new OidcSubjectMissingError();
    }

    const issuedAt = claims['iat'];
    return {
      issuer,
      subject,
      audience: this.config.audience,
      expiresAt,
      issuedAt: typeof issuedAt === 'number' ? issuedAt : null,
      claims,
    };
  }

  private verifySignature(
    algorithm: string,
    signingInput: Buffer,
    signature: Buffer,
    key: KeyObject
  ): boolean {
    try {
      if (algorithm === 'RS256') {
        return cryptoVerify('RSA-SHA256', signingInput, key, signature);
      }
      if (algorithm === 'ES256') {
        const verifier = createVerify('SHA256');
        verifier.update(signingInput);
        return verifier.verify({ key, dsaEncoding: 'der' }, derFromRawSignature(signature));
      }
      return false;
    } catch {
      return false;
    }
  }
}
