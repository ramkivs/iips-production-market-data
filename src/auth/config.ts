/**
 * Institutional Investment Platform System (IIPS)
 * IPD OIDC Trust Configuration (NP04-G24 / Phase H)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Accepted direction: user-delegated OIDC. IPD independently validates the
 * incoming credential. Trust inputs are supplied by configuration, never by
 * the caller:
 *   - trusted issuer
 *   - distinct IPD audience (ipd-user-portfolio-api)
 *   - trusted JWKS endpoint
 *
 * The existing iips-spa audience/client is NOT referenced or modified here.
 *
 * Explicitly out of scope (not implemented anywhere in this module):
 * caller-service authentication, mTLS, token exchange, service credentials,
 * forwarded IRR Principal trust, browser identity trust, operator bypass.
 */

import { OidcConfigurationError } from './errors.js';

export const IPD_OIDC_ISSUER_ENV = 'IPD_OIDC_ISSUER';
export const IPD_OIDC_JWKS_URI_ENV = 'IPD_OIDC_JWKS_URI';
export const IPD_OIDC_AUDIENCE_ENV = 'IPD_OIDC_AUDIENCE';

/**
 * The distinct IPD audience required by the accepted direction.
 * This is deliberately separate from the existing iips-spa audience.
 */
export const IPD_DEFAULT_AUDIENCE = 'ipd-user-portfolio-api';

/** Algorithms IPD is willing to trust. `none` and symmetric algs are rejected. */
export const TRUSTED_JWS_ALGORITHMS: readonly string[] = ['RS256', 'ES256'];

export interface OidcTrustConfig {
  readonly issuer: string;
  readonly jwksUri: string;
  readonly audience: string;
}

/**
 * Validates the OIDC trust configuration. Fails closed on any missing or
 * malformed trust input — an unconfigured verifier must never verify anything.
 */
export function loadOidcTrustConfig(
  env: NodeJS.ProcessEnv = process.env
): OidcTrustConfig {
  const issuer = env[IPD_OIDC_ISSUER_ENV];
  const jwksUri = env[IPD_OIDC_JWKS_URI_ENV];
  const audience = env[IPD_OIDC_AUDIENCE_ENV] ?? IPD_DEFAULT_AUDIENCE;

  if (typeof issuer !== 'string' || issuer.trim() === '') {
    throw new OidcConfigurationError(
      `Missing required configuration: ${IPD_OIDC_ISSUER_ENV}.`
    );
  }
  if (typeof jwksUri !== 'string' || jwksUri.trim() === '') {
    throw new OidcConfigurationError(
      `Missing required configuration: ${IPD_OIDC_JWKS_URI_ENV}.`
    );
  }
  if (typeof audience !== 'string' || audience.trim() === '') {
    throw new OidcConfigurationError(
      `Invalid configuration: ${IPD_OIDC_AUDIENCE_ENV} must not be blank.`
    );
  }

  let parsedJwks: URL;
  try {
    parsedJwks = new URL(jwksUri.trim());
  } catch {
    throw new OidcConfigurationError(
      `Invalid configuration: ${IPD_OIDC_JWKS_URI_ENV} must be an absolute URL.`
    );
  }
  if (parsedJwks.protocol !== 'https:' && parsedJwks.protocol !== 'http:') {
    throw new OidcConfigurationError(
      `Invalid configuration: ${IPD_OIDC_JWKS_URI_ENV} must use http(s).`
    );
  }

  return {
    issuer: issuer.trim(),
    jwksUri: jwksUri.trim(),
    audience: audience.trim(),
  };
}
