/**
 * Institutional Investment Platform System (IIPS)
 * HTTP Error Mapping (NP04-G24 / §15)
 *
 * Errors are mapped to status codes without disclosing internal persistence
 * structure, SQL text, file paths, or driver details.
 */

import { isIdentityError, IdentityError } from '../app_identity/errors.js';
import { isOidcError, OidcError } from '../auth/errors.js';
import { isPersistenceError, PersistenceError } from '../persistence/errors.js';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function badRequest(code: string, message: string): HttpError {
  return new HttpError(400, code, message);
}

/** Maps a domain error to a safe HTTP response. */
export function mapDomainError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  if (isOidcError(error)) {
    return new HttpError(401, error.code, 'Authentication failed.');
  }

  if (isIdentityError(error)) {
    // Unmapped identity, missing/revoked tenant membership: fail closed.
    const status = error.code === 'TENANT_MEMBERSHIP_MISSING' || error.code === 'TENANT_MEMBERSHIP_REVOKED'
      ? 403
      : 403;
    return new HttpError(status, error.code, 'Access denied.');
  }

  if (isPersistenceError(error)) {
    return mapPersistenceError(error);
  }

  return new HttpError(500, 'INTERNAL_ERROR', 'Request failed.');
}

function mapPersistenceError(error: PersistenceError): HttpError {
  switch (error.code) {
    case 'RESOURCE_NOT_FOUND':
    case 'RESOURCE_TOMBSTONED':
      // Non-disclosure: identical response for missing and unauthorized.
      return new HttpError(404, 'NOT_FOUND', 'Resource not found.');
    case 'REVISION_CONFLICT':
      return new HttpError(409, 'REVISION_CONFLICT', 'Portfolio revision is stale.');
    case 'PERSISTENCE_CONFIGURATION_INVALID':
      return new HttpError(500, 'PERSISTENCE_CONFIGURATION_INVALID', 'Persistence is not configured.');
    case 'MIGRATION_CHECKSUM_MISMATCH':
    case 'MIGRATION_STATE_REGRESSION':
    case 'MIGRATION_APPLICATION_FAILED':
    case 'MIGRATION_LEDGER_INVALID':
      return new HttpError(503, 'PERSISTENCE_UNAVAILABLE', 'Persistence is unavailable.');
    case 'PERSISTENCE_CLOSED':
    case 'PERSISTENCE_UNAVAILABLE':
    case 'TRANSACTION_FAILED':
    default:
      return new HttpError(503, 'PERSISTENCE_UNAVAILABLE', 'Persistence is unavailable.');
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export { isIdentityError, isOidcError, isPersistenceError };
export type { IdentityError, OidcError, PersistenceError };
