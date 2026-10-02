/**
 * NP-04 — Common Governed Persistence: structured error taxonomy.
 *
 * Authority: docs/integration/IIPS_v3.0_NP04_COMMON_GOVERNED_PERSISTENCE_IMPLEMENTATION_AUTHORITY.md
 * Consumer contract: docs/integration/IIPS_v3.0_NP06_REPORTS_GOVERNANCE_DECISIONS.md (section 5.1)
 *
 * Errors are structured and distinguishable so that a consumer can map them onto its own
 * transport semantics without inspecting messages.
 */

/** A stable, machine-readable failure code. Never localised; never reworded. */
export type PersistenceErrorCode =
  | 'ARTIFACT_VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'OWNERSHIP_REQUIRED'
  | 'OWNERSHIP_MISMATCH'
  | 'IMMUTABLE_ARTIFACT'
  | 'SUPERSESSION_CONFLICT'
  | 'PERSISTENCE_TRANSACTION_FAILED'
  | 'PERSISTENCE_SCHEMA_INVALID'
  | 'PERSISTENCE_NOT_INITIALIZED'
  | 'PERSISTENCE_ALREADY_CLOSED';

/** Base class for every error raised by the governed persistence capability. */
export class PersistenceError extends Error {
  constructor(
    readonly code: PersistenceErrorCode,
    message: string,
    readonly detail?: Readonly<Record<string, unknown>>,
  ) {
    super(message);
    this.name = 'PersistenceError';
  }
}

/** The supplied input does not satisfy the governed artifact contract. */
export class PersistenceValidationError extends PersistenceError {
  constructor(message: string, detail?: Readonly<Record<string, unknown>>) {
    super('ARTIFACT_VALIDATION_FAILED', message, detail);
    this.name = 'PersistenceValidationError';
  }
}

/**
 * The requested artifact does not exist **for this owner**.
 *
 * A cross-owner read is deliberately reported as NOT_FOUND rather than OWNERSHIP_MISMATCH so
 * that the store never discloses the existence of another owner's artifact.
 */
export class PersistenceNotFoundError extends PersistenceError {
  constructor(message = 'artifact not found', detail?: Readonly<Record<string, unknown>>) {
    super('NOT_FOUND', message, detail);
    this.name = 'PersistenceNotFoundError';
  }
}

/** Ownership is absent, malformed, or not a complete (tenantId, userId) pair. */
export class PersistenceOwnershipError extends PersistenceError {
  constructor(message: string, detail?: Readonly<Record<string, unknown>>) {
    super('OWNERSHIP_REQUIRED', message, detail);
    this.name = 'PersistenceOwnershipError';
  }
}

/** A published artifact was targeted for in-place modification. Governed artifacts are append-only. */
export class PersistenceImmutableError extends PersistenceError {
  constructor(message = 'governed artifacts are append-only', detail?: Readonly<Record<string, unknown>>) {
    super('IMMUTABLE_ARTIFACT', message, detail);
    this.name = 'PersistenceImmutableError';
  }
}

/** The supplied supersession pointer does not continue the single-parent chain. */
export class PersistenceSupersessionError extends PersistenceError {
  constructor(message: string, detail?: Readonly<Record<string, unknown>>) {
    super('SUPERSESSION_CONFLICT', message, detail);
    this.name = 'PersistenceSupersessionError';
  }
}

/** A transaction was rolled back. No partial governed artifact is left behind. */
export class PersistenceTransactionError extends PersistenceError {
  constructor(message: string, detail?: Readonly<Record<string, unknown>>) {
    super('PERSISTENCE_TRANSACTION_FAILED', message, detail);
    this.name = 'PersistenceTransactionError';
  }
}

/** Schema/migration state is missing, non-contiguous, or has drifted from its recorded checksum. */
export class PersistenceSchemaError extends PersistenceError {
  constructor(message: string, detail?: Readonly<Record<string, unknown>>) {
    super('PERSISTENCE_SCHEMA_INVALID', message, detail);
    this.name = 'PersistenceSchemaError';
  }
}
