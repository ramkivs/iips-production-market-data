/**
 * Institutional Investment Platform System (IIPS)
 * Migration Runner — Ledger, Checksum Integrity, Transactional Application
 * (NP04-G24 / Phase B)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Guarantees:
 *  - schema version tracking via an append-only ledger;
 *  - checksum/integrity validation of every already-applied migration;
 *  - transactional application (DDL + ledger insert in ONE transaction);
 *  - startup failure on migration failure or checksum mismatch;
 *  - NO automatic downgrade;
 *  - NO destructive automatic recovery — the runner never drops or recreates
 *    a database, and never deletes ledger rows.
 */

import { computeSha256 } from '../../contracts/provenance.js';
import {
  MigrationApplicationError,
  MigrationChecksumError,
  MigrationLedgerError,
  MigrationStateRegressionError,
  PersistenceUnavailableError,
} from '../errors.js';
import type { PersistenceConnection } from '../connection.js';
import { MIGRATIONS } from './registry.js';
import type { AppliedMigrationRecord, MigrationDefinition } from './types.js';

export const MIGRATION_LEDGER_TABLE = 'schema_migrations';

const LEDGER_DDL = `
CREATE TABLE IF NOT EXISTS ${MIGRATION_LEDGER_TABLE} (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    checksum   TEXT NOT NULL,
    applied_at TEXT NOT NULL
);
`;

/**
 * Deterministic SHA-256 checksum over the immutable SQL text.
 * Uses the governed IIPS provenance hash so digest semantics stay identical
 * across the whole platform.
 */
export function computeMigrationChecksum(sql: string): string {
  return computeSha256(sql);
}

/**
 * Creates the migration ledger if absent and verifies its required shape.
 * Bootstrap concern only — the ledger is not itself a numbered migration.
 */
export function ensureMigrationLedger(connection: PersistenceConnection): void {
  try {
    connection.exec(LEDGER_DDL);
  } catch (error) {
    throw new MigrationLedgerError('Unable to create or verify the migration ledger.', error);
  }

  try {
    const columns = connection
      .prepare(`PRAGMA table_info(${MIGRATION_LEDGER_TABLE})`)
      .all() as Array<{ name: string }>;
    const names = new Set(columns.map((c) => c.name));
    for (const required of ['id', 'name', 'checksum', 'applied_at']) {
      if (!names.has(required)) {
        throw new MigrationLedgerError(
          `Migration ledger "${MIGRATION_LEDGER_TABLE}" is missing required column "${required}".`
        );
      }
    }
  } catch (error) {
    if (error instanceof MigrationLedgerError) {
      throw error;
    }
    throw new MigrationLedgerError('Unable to inspect the migration ledger.', error);
  }
}

/** Reads the applied migration ledger in application order. */
export function readAppliedMigrations(
  connection: PersistenceConnection
): AppliedMigrationRecord[] {
  try {
    const rows = connection
      .prepare(
        `SELECT id, name, checksum, applied_at AS appliedAt
           FROM ${MIGRATION_LEDGER_TABLE}
          ORDER BY id ASC`
      )
      .all() as AppliedMigrationRecord[];
    return rows;
  } catch (error) {
    throw new MigrationLedgerError('Unable to read the migration ledger.', error);
  }
}

/**
 * Validates the recorded state against the immutable registry.
 * Throws on checksum mismatch, unknown migrations, or out-of-order state.
 * Never performs a downgrade.
 */
export function validateMigrationState(
  applied: readonly AppliedMigrationRecord[],
  migrations: readonly MigrationDefinition[] = MIGRATIONS
): void {
  if (applied.length > migrations.length) {
    throw new MigrationStateRegressionError(
      `Database has ${applied.length} applied migration(s) but the application defines ${migrations.length}. ` +
        `Automatic downgrade is not performed; refusing to start.`
    );
  }

  applied.forEach((record, index) => {
    const expected = migrations[index];
    if (!expected || expected.id !== record.id) {
      throw new MigrationStateRegressionError(
        `Migration order mismatch at position ${index}: ledger has "${record.id}", expected "${expected?.id ?? '<none>'}".`
      );
    }

    const expectedChecksum = computeMigrationChecksum(expected.sql);
    if (expectedChecksum !== record.checksum) {
      throw new MigrationChecksumError(
        expected.id,
        `Migration "${expected.id}" (${expected.name}) checksum mismatch: ` +
          `ledger=${record.checksum}, computed=${expectedChecksum}. An applied migration may have been modified.`
      );
    }
  });
}

/**
 * Applies every pending migration, each in its own IMMEDIATE transaction that
 * also records the ledger row. Returns the ids applied.
 */
export function applyPendingMigrations(
  connection: PersistenceConnection,
  migrations: readonly MigrationDefinition[] = MIGRATIONS
): string[] {
  const applied = readAppliedMigrations(connection);
  validateMigrationState(applied, migrations);

  const pending = migrations.slice(applied.length);
  const appliedIds: string[] = [];

  for (const migration of pending) {
    const checksum = computeMigrationChecksum(migration.sql);
    const appliedAt = new Date().toISOString();

    try {
      connection.immediateTransaction((tx) => {
        tx.exec(migration.sql);
        tx.prepare(
          `INSERT INTO ${MIGRATION_LEDGER_TABLE} (id, name, checksum, applied_at)
           VALUES (?, ?, ?, ?)`
        ).run(migration.id, migration.name, checksum, appliedAt);
      });
    } catch (error) {
      if (error instanceof MigrationChecksumError || error instanceof MigrationStateRegressionError) {
        throw error;
      }
      throw new MigrationApplicationError(
        migration.id,
        `Failed to apply migration "${migration.id}" (${migration.name}).`,
        error
      );
    }

    appliedIds.push(migration.id);
  }

  return appliedIds;
}

/**
 * Full migration sequence used at startup:
 * ensure ledger -> read -> validate -> apply pending -> re-verify.
 */
export function runMigrations(
  connection: PersistenceConnection,
  migrations: readonly MigrationDefinition[] = MIGRATIONS
): { applied: string[]; currentVersion: string } {
  ensureMigrationLedger(connection);
  const appliedIds = applyPendingMigrations(connection, migrations);

  // Re-read and re-validate so a silent partial application cannot pass startup.
  const finalState = readAppliedMigrations(connection);
  validateMigrationState(finalState, migrations);

  return {
    applied: appliedIds,
    currentVersion: finalState.length > 0 ? finalState[finalState.length - 1]!.id : '000',
  };
}

/**
 * Reports the current schema version without mutating anything.
 */
export function readSchemaVersion(connection: PersistenceConnection): string {
  try {
    const row = connection
      .prepare(`SELECT id FROM ${MIGRATION_LEDGER_TABLE} ORDER BY id DESC LIMIT 1`)
      .get() as { id: string } | undefined;
    return row?.id ?? '000';
  } catch (error) {
    throw new PersistenceUnavailableError('Unable to read current schema version.', error);
  }
}
