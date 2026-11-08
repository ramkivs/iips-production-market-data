/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Provider Deterministic Failure Taxonomy (DHAN-D1)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Gate: DHAN-D1 PRE-ACCESS PROVIDER FOUNDATION
 * Operating Mode: PRE_ACCESS_NO_LIVE_CREDENTIALS
 *
 * NOTE: This module contains NO credentials and performs NO authentication.
 */

/**
 * Closed set of deterministic provider failure codes.
 * Every Dhan boundary failure MUST map to exactly one of these codes so that
 * downstream behaviour is reproducible and fails closed.
 */
export type DhanFailureCode =
  | 'CREDENTIALS_UNAVAILABLE'
  | 'CONFIGURATION_INCOMPLETE'
  | 'AUTHENTICATION_FAILURE'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'TRANSPORT_FAILURE'
  | 'HTTP_ERROR'
  | 'PROVIDER_STATUS_FAILURE'
  | 'MALFORMED_RESPONSE'
  | 'MISSING_REQUIRED_FIELD'
  | 'INSTRUMENT_NOT_IN_RESPONSE'
  | 'UNRESOLVED_INSTRUMENT'
  | 'CANONICAL_VALIDATION_FAILURE'
  | 'STALE_DATA_SUPPRESSED'
  | 'UNSUPPORTED_DOMAIN'
  | 'UNSUPPORTED_PRE_ACCESS_OPERATION'
  // DHAN-D2 additions (integration & historical qualification harness)
  | 'MALFORMED_INSTRUMENT_MAPPING'
  | 'CONFLICTING_INSTRUMENT_MAPPING'
  | 'IDENTITY_RESOLUTION_FAILURE'
  | 'INVALID_DATE_RANGE'
  | 'UNSUPPORTED_INTERVAL'
  | 'EMPTY_HISTORICAL_SERIES';

export interface DhanFailure {
  code: DhanFailureCode;
  /** Operator-safe message. MUST NOT contain credential material. */
  message: string;
  /** Optional field path within the provider payload that caused the failure. */
  field?: string;
  /** Optional HTTP status for transport-layer failures. */
  httpStatus?: number;
}

export type DhanResult<T> =
  | { ok: true; value: T }
  | { ok: false; failure: DhanFailure };

export function dhanFailure(
  code: DhanFailureCode,
  message: string,
  extra?: { field?: string; httpStatus?: number }
): { ok: false; failure: DhanFailure } {
  return {
    ok: false,
    failure: {
      code,
      message,
      field: extra?.field,
      httpStatus: extra?.httpStatus,
    },
  };
}

export function dhanOk<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}

/**
 * Error thrown across the provider-neutral SPI boundary.
 * Carries the deterministic failure code; never carries credential material.
 */
export class DhanProviderError extends Error {
  public readonly code: DhanFailureCode;
  public readonly failure: DhanFailure;

  constructor(failure: DhanFailure) {
    super(`[DHAN_PROVIDER:${failure.code}] ${failure.message}`);
    this.name = 'DhanProviderError';
    this.code = failure.code;
    this.failure = failure;
  }
}
