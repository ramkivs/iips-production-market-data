/**
 * Gate 3 — append-only, checksummed migration ledger (act §4.2 item 2).
 *
 * The ledger records each applied migration id with a SHA-256 checksum of its SQL.
 * At startup every expected migration is verified against the ledger and every
 * applied row must correspond to an expected migration: tampered, unknown,
 * out-of-order or missing-prior state refuses startup before any endpoint binds.
 */
import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export interface Migration {
  readonly id: string;
  readonly sql: string;
}

export class MigrationIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MigrationIntegrityError';
  }
}

const LEDGER_DDL = `
CREATE TABLE IF NOT EXISTS _migration_ledger (
  migration_id TEXT PRIMARY KEY,
  checksum TEXT NOT NULL,
  applied_at TEXT NOT NULL
) WITHOUT ROWID;
`;

export function migrationChecksum(migration: Migration): string {
  return createHash('sha256').update(migration.sql, 'utf8').digest('hex');
}

interface AppliedRow {
  migration_id: string;
  checksum: string;
}

/**
 * Verifies and applies the fixed, ordered migration set. All DDL for a pending
 * migration plus its ledger insert commit together in one transaction.
 *
 * The ledger is WITHOUT ROWID, so applied migrations are ordered by the fixed
 * migration id ('001_…' < '002_…' < '003_…'), which is also the required order.
 */
export function ensureMigrations(db: DatabaseSync, migrations: readonly Migration[]): void {
  db.exec(LEDGER_DDL);

  const ids = new Set(migrations.map((m) => m.id));
  if (ids.size !== migrations.length) {
    throw new MigrationIntegrityError('the migration set contains a duplicate id');
  }

  const appliedRows = db
    .prepare('SELECT migration_id, checksum FROM _migration_ledger ORDER BY migration_id')
    .all() as unknown as AppliedRow[];

  for (const row of appliedRows) {
    if (!ids.has(row.migration_id)) {
      throw new MigrationIntegrityError(`unknown migration recorded in ledger: ${row.migration_id}`);
    }
  }

  const applied = new Map(appliedRows.map((row) => [row.migration_id, row.checksum]));
  let seenPending = false;

  for (const migration of migrations) {
    const expectedChecksum = migrationChecksum(migration);
    const recordedChecksum = applied.get(migration.id);

    if (recordedChecksum !== undefined) {
      if (seenPending) {
        throw new MigrationIntegrityError(`migration ${migration.id} is applied after a pending migration`);
      }
      if (recordedChecksum !== expectedChecksum) {
        throw new MigrationIntegrityError(
          `checksum mismatch for migration ${migration.id}: the stored schema does not match the authorized migration`,
        );
      }
      continue;
    }

    seenPending = true;
    db.exec('BEGIN IMMEDIATE;');
    try {
      db.exec(migration.sql);
      db.prepare(
        'INSERT INTO _migration_ledger (migration_id, checksum, applied_at) VALUES (?, ?, ?)',
      ).run(migration.id, expectedChecksum, new Date().toISOString());
      db.exec('COMMIT;');
    } catch (error) {
      db.exec('ROLLBACK;');
      throw error;
    }
  }
}

/** Read-only ledger inspection used by startup validation tests. */
export function readLedger(db: DatabaseSync): AppliedRow[] {
  return db
    .prepare('SELECT migration_id, checksum FROM _migration_ledger ORDER BY migration_id')
    .all() as unknown as AppliedRow[];
}
