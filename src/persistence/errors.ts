/**
 * Institutional Investment Platform System (IIPS)
 * Durable Persistence Error Taxonomy (NP04-G24 / Phase A)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Every persistence failure is typed and fail-closed. No caller is permitted to
 * treat a persistence failure as a recoverable in-memory fallback.
 */

export type PersistenceErrorCode =
  | 'PERSISTENCE_CONFIGURATION_INVALID'
  | 'PERSISTENCE_UNAVAILABLE'
  | 'PERSISTENCE_CLOSED'
  | 'MIGRATION_LEDGER_INVALID'
  | 'MIGRATION_CHECKSUM_MISMATCH'
  | 'MIGRATION_APPLICATION_FAILED'
  | 'MIGRATION_STATE_REGRESSION'
  | 'TRANSACTION_FAILED'
  | 'REVISION_CONFLICT'
  | 'RESOURCE_NOT_FOUND'
  | 'RESOURCE_TOMBSTONED';

/**
 * Base class for every error raised inside the IPD persistence boundary.
 */
export class PersistenceError extends Error {
  public readonly code: PersistenceErrorCode;
  public readonly cause?: unknown;

  constructor(code: PersistenceErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'PersistenceError';
    this.code = code;
    this.cause = cause;
  }
}

/** Configuration supplied to the persistence layer is invalid. */
export class PersistenceConfigurationError extends PersistenceError {
  constructor(message: string, cause?: unknown) {
    super('PERSISTENCE_CONFIGURATION_INVALID', message, cause);
    this.name = 'PersistenceConfigurationError';
  }
}

/** The database could not be opened, or failed during use. */
export class PersistenceUnavailableError extends PersistenceError {
  constructor(message: string, cause?: unknown) {
    super('PERSISTENCE_UNAVAILABLE', message, cause);
    this.name = 'PersistenceUnavailableError';
  }
}

/** An operation was attempted after the connection was closed. */
export class PersistenceClosedError extends PersistenceError {
  constructor(message = 'Persistence connection is closed.') {
    super('PERSISTENCE_CLOSED', message);
    this.name = 'PersistenceClosedError';
  }
}

/** The migration ledger table is missing required structure. */
export class MigrationLedgerError extends PersistenceError {
  constructor(message: string, cause?: unknown) {
    super('MIGRATION_LEDGER_INVALID', message, cause);
    this.name = 'MigrationLedgerError';
  }
}

/**
 * A migration already recorded in the ledger no longer matches the checksum of
 * the immutable migration file. Startup must fail.
 */
export class MigrationChecksumError extends PersistenceError {
  public readonly migrationId: string;

  constructor(migrationId: string, message: string) {
    super('MIGRATION_CHECKSUM_MISMATCH', message);
    this.name = 'MigrationChecksumError';
    this.migrationId = migrationId;
  }
}

/** A migration could not be applied. */
export class MigrationApplicationError extends PersistenceError {
  public readonly migrationId: string;

  constructor(migrationId: string, message: string, cause?: unknown) {
    super('MIGRATION_APPLICATION_FAILED', message, cause);
    this.name = 'MigrationApplicationError';
    this.migrationId = migrationId;
  }
}

/**
 * The database is at a schema state the application can no longer serve
 * (unknown or out-of-order migrations). Automatic downgrade is never performed.
 */
export class MigrationStateRegressionError extends PersistenceError {
  constructor(message: string) {
    super('MIGRATION_STATE_REGRESSION', message);
    this.name = 'MigrationStateRegressionError';
  }
}

/** A write transaction failed and was rolled back. */
export class TransactionFailedError extends PersistenceError {
  constructor(message: string, cause?: unknown) {
    super('TRANSACTION_FAILED', message, cause);
    this.name = 'TransactionFailedError';
  }
}

/** Optimistic concurrency check failed: expected revision is stale. */
export class RevisionConflictError extends PersistenceError {
  public readonly expectedRevision: number;
  public readonly actualRevision: number;

  constructor(expectedRevision: number, actualRevision: number) {
    super(
      'REVISION_CONFLICT',
      `Stale portfolio revision: expected ${expectedRevision}, actual ${actualRevision}.`
    );
    this.name = 'RevisionConflictError';
    this.expectedRevision = expectedRevision;
    this.actualRevision = actualRevision;
  }
}

/** The requested resource does not exist (or is not visible to the caller). */
export class ResourceNotFoundError extends PersistenceError {
  constructor(message = 'Resource not found.') {
    super('RESOURCE_NOT_FOUND', message);
    this.name = 'ResourceNotFoundError';
  }
}

/** The requested resource has been tombstoned. */
export class ResourceTombstonedError extends PersistenceError {
  constructor(message = 'Resource has been deleted.') {
    super('RESOURCE_TOMBSTONED', message);
    this.name = 'ResourceTombstonedError';
  }
}

/**
 * Type guard for any error raised inside the persistence boundary.
 */
export function isPersistenceError(error: unknown): error is PersistenceError {
  return error instanceof PersistenceError;
}
