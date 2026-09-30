/**
 * Institutional Investment Platform System (IIPS)
 * Ordered Migration Contract (NP04-G24 / Phase B)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Migrations are:
 *  - ordered (array order is the authority);
 *  - immutable (the SQL text is checksummed; any edit changes the checksum and
 *    causes a startup failure on an already-migrated database);
 *  - append-only (new work is a new migration, never an edit of an applied one).
 */

export interface MigrationDefinition {
  /** Zero-padded, lexicographically ordered migration identifier. */
  readonly id: string;
  /** Human-readable migration name recorded in the ledger. */
  readonly name: string;
  /** Immutable SQL text. Changing this invalidates the recorded checksum. */
  readonly sql: string;
}

/** A row recorded in the migration ledger. */
export interface AppliedMigrationRecord {
  readonly id: string;
  readonly name: string;
  readonly checksum: string;
  readonly appliedAt: string;
}
