/**
 * Institutional Investment Platform System (IIPS)
 * OIDC Verification Errors (NP04-G24 / Phase H)
 *
 * Every error here is a FAIL-CLOSED outcome. A rejected credential is never
 * downgraded to an anonymous, operator, or browser-supplied identity.
 */

export type OidcErrorCode =
  | 'OIDC_CONFIGURATION_INVALID'
  | 'OIDC_TOKEN_MISSING'
  | 'OIDC_TOKEN_MALFORMED'
  | 'OIDC_ALGORITHM_REJECTED'
  | 'OIDC_SIGNATURE_INVALID'
  | 'OIDC_KEY_UNAVAILABLE'
  | 'OIDC_ISSUER_MISMATCH'
  | 'OIDC_AUDIENCE_MISMATCH'
  | 'OIDC_TOKEN_EXPIRED'
  | 'OIDC_TOKEN_NOT_YET_VALID'
  | 'OIDC_SUBJECT_MISSING'
  | 'OIDC_JWKS_UNAVAILABLE';

export class OidcError extends Error {
  public readonly code: OidcErrorCode;

  constructor(code: OidcErrorCode, message: string) {
    super(message);
    this.name = 'OidcError';
    this.code = code;
  }
}

export class OidcConfigurationError extends OidcError {
  constructor(message: string) {
    super('OIDC_CONFIGURATION_INVALID', message);
    this.name = 'OidcConfigurationError';
  }
}

export class OidcTokenMissingError extends OidcError {
  constructor() {
    super('OIDC_TOKEN_MISSING', 'Missing bearer credential.');
    this.name = 'OidcTokenMissingError';
  }
}

export class OidcTokenMalformedError extends OidcError {
  constructor(detail: string) {
    super('OIDC_TOKEN_MALFORMED', `Malformed JWT: ${detail}`);
    this.name = 'OidcTokenMalformedError';
  }
}

export class OidcAlgorithmRejectedError extends OidcError {
  constructor(algorithm: string) {
    super('OIDC_ALGORITHM_REJECTED', `Signing algorithm "${algorithm}" is not trusted.`);
    this.name = 'OidcAlgorithmRejectedError';
  }
}

export class OidcSignatureInvalidError extends OidcError {
  constructor() {
    super('OIDC_SIGNATURE_INVALID', 'Token signature verification failed.');
    this.name = 'OidcSignatureInvalidError';
  }
}

export class OidcKeyUnavailableError extends OidcError {
  constructor(keyId: string) {
    super('OIDC_KEY_UNAVAILABLE', `No trusted JWKS key available for kid "${keyId}".`);
    this.name = 'OidcKeyUnavailableError';
  }
}

export class OidcIssuerMismatchError extends OidcError {
  constructor(observed: string) {
    super('OIDC_ISSUER_MISMATCH', `Token issuer "${observed}" is not a trusted issuer.`);
    this.name = 'OidcIssuerMismatchError';
  }
}

export class OidcAudienceMismatchError extends OidcError {
  constructor() {
    super(
      'OIDC_AUDIENCE_MISMATCH',
      'Token audience does not include the distinct IPD audience.'
    );
    this.name = 'OidcAudienceMismatchError';
  }
}

export class OidcTokenExpiredError extends OidcError {
  constructor() {
    super('OIDC_TOKEN_EXPIRED', 'Token has expired.');
    this.name = 'OidcTokenExpiredError';
  }
}

export class OidcTokenNotYetValidError extends OidcError {
  constructor() {
    super('OIDC_TOKEN_NOT_YET_VALID', 'Token is not yet valid.');
    this.name = 'OidcTokenNotYetValidError';
  }
}

export class OidcSubjectMissingError extends OidcError {
  constructor() {
    super('OIDC_SUBJECT_MISSING', 'Token has no subject claim.');
    this.name = 'OidcSubjectMissingError';
  }
}

export class OidcJwksUnavailableError extends OidcError {
  constructor(message: string) {
    super('OIDC_JWKS_UNAVAILABLE', `JWKS unavailable: ${message}`);
    this.name = 'OidcJwksUnavailableError';
  }
}

export function isOidcError(error: unknown): error is OidcError {
  return error instanceof OidcError;
}
