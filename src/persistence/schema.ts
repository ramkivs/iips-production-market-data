/**
 * NP-04 — Common Governed Persistence: schema and migration mechanism.
 *
 * Deterministic, fail-closed, transactional. No destructive migration. No production assumptions.
 *
 * Migration state is recorded in schema_migrations(ordinal, name, checksum, applied_at) with a
 * contiguous-ordinal requirement and a per-migration checksum. Any drift, gap, or unknown ordinal
 * aborts startup rather than proceeding against an unverified schema.
 */
import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

import { PersistenceSchemaError } from './errors.js';

export interface Migration {
  /** Contiguous ordinal starting at 1. */
  readonly ordinal: number;
  /** Stable unique name. */
  readonly name: string;
  /** SQL applied inside a single transaction. */
  readonly sql: string;
}

const LEDGER_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  ordinal    INTEGER PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  checksum   TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
`;

const LEDGER_NAME = 'schema_migrations';

function checksumOf(sql: string): string {
  return createHash('sha256').update(sql, 'utf8').digest('hex');
}

/**
 * The governed persistence baseline.
 *
 * Creates only what the NP-06 consumer contract requires. The table is named for the common
 * governed substrate, NOT for any single consumer: there is no Reports-specific store, per R3.
 *
 * `report_id` is the PRIMARY KEY, which enforces global instance uniqueness at the storage layer.
 * `artifact_version` starts at 1. There are deliberately NO mutable status column: "current
 * version" is derived as the maximum artifact_version within an instance chain, so supersession
 * requires no in-place mutation and the table is append-only by construction.
 */
export const MIGRATIONS: readonly Migration[] = [
  {
    ordinal: 1,
    name: 'governed_persistence_baseline',
    sql: `
CREATE TABLE governed_artifacts (
  report_id            TEXT    PRIMARY KEY,
  chain_id             TEXT    NOT NULL,
  tenant_id            TEXT    NOT NULL,
  user_id              TEXT    NOT NULL,
  report_key           TEXT    NOT NULL,
  report_type          TEXT    NOT NULL,
  portfolio_id         TEXT    NOT NULL,
  scenario             TEXT,
  parameters_json      TEXT    NOT NULL,
  schema_version       INTEGER NOT NULL,
  artifact_version     INTEGER NOT NULL,
  supersedes_report_id TEXT             REFERENCES governed_artifacts(report_id),
  generated_at         TEXT    NOT NULL,
  canonical_payload    TEXT    NOT NULL,
  provenance_json      TEXT    NOT NULL,
  created_at           TEXT    NOT NULL,
  CHECK (artifact_version >= 1)
);

-- Ownership-scoped retrieval. queryByOwner is always scoped to (tenant_id, user_id).
CREATE INDEX idx_governed_artifacts_owner
  ON governed_artifacts (tenant_id, user_id, generated_at, report_id);

-- The version sequence is per DURABLE INSTANCE (chain), not per content identity.
-- This is what permits two separate instances of identical canonical content: each chain
-- starts at artifact_version 1 under its own report_id, while report_key remains equal.
CREATE INDEX idx_governed_artifacts_chain
  ON governed_artifacts (chain_id, artifact_version);

-- Content-identity lookups within an owner's scope.
CREATE INDEX idx_governed_artifacts_owner_key
  ON governed_artifacts (tenant_id, user_id, report_key);

-- A single-parent chain cannot contain two rows pointing at the same predecessor.
CREATE UNIQUE INDEX uq_governed_artifacts_single_parent
  ON governed_artifacts (supersedes_report_id)
  WHERE supersedes_report_id IS NOT NULL;

-- One version number per instance chain.
CREATE UNIQUE INDEX uq_governed_artifacts_chain_version
  ON governed_artifacts (chain_id, artifact_version);

-- Append-only is enforced at the STORAGE layer, not merely by API convention.
-- No supersession status column exists, so nothing ever needs to update a row, and these
-- triggers make that structural: a published artifact's content and its (tenant_id, user_id)
-- ownership can never be modified or removed, by any code path.
CREATE TRIGGER governed_artifacts_no_update BEFORE UPDATE ON governed_artifacts
BEGIN
  SELECT RAISE(ABORT, 'governed_artifacts are append-only: UPDATE is prohibited');
END;

CREATE TRIGGER governed_artifacts_no_delete BEFORE DELETE ON governed_artifacts
BEGIN
  SELECT RAISE(ABORT, 'governed_artifacts are append-only: DELETE is prohibited');
END;
`,
  },
];

/** Ensure the ledger itself exists. Idempotent. */
function ensureLedger(db: DatabaseSync): void {
  db.exec(LEDGER_SQL);
}

function readLedger(db: DatabaseSync): Array<{ ordinal: number; name: string; checksum: string }> {
  const rows = db.prepare(`SELECT ordinal, name, checksum FROM ${LEDGER_NAME} ORDER BY ordinal`).all();
  return rows.map((r) => ({
    ordinal: Number(r.ordinal),
    name: String(r.name),
    checksum: String(r.checksum),
  }));
}

/**
 * Verify that the applied ledger exactly matches the declared migrations.
 *
 * Fails closed on: an unknown applied ordinal, a name mismatch, a checksum drift, or a gap.
 */
function assertLedgerMatchesMigrations(
  applied: ReadonlyArray<{ ordinal: number; name: string; checksum: string }>,
): void {
  for (const row of applied) {
    const declared = MIGRATIONS.find((m) => m.ordinal === row.ordinal);
    if (!declared) {
      throw new PersistenceSchemaError(
        `applied migration ordinal ${row.ordinal} is not declared by this build`,
        { ordinal: row.ordinal, name: row.name },
      );
    }
    if (declared.name !== row.name) {
      throw new PersistenceSchemaError(
        `migration ordinal ${row.ordinal} name drift: applied '${row.name}', declared '${declared.name}'`,
        { ordinal: row.ordinal },
      );
    }
    const expected = checksumOf(declared.sql);
    if (expected !== row.checksum) {
      throw new PersistenceSchemaError(
        `migration ordinal ${row.ordinal} ('${declared.name}') checksum drift`,
        { ordinal: row.ordinal, expected, applied: row.checksum },
      );
    }
  }
}

/**
 * Apply pending migrations, then verify the resulting schema.
 *
 * Ordering: migrations are applied in contiguous ordinal order. Each is applied inside its own
 * transaction together with its ledger row, so a failure leaves neither a half-applied schema nor
 * a ledger entry claiming it was applied.
 *
 * @param now injectable clock so that applied_at is deterministic under test.
 */
export function runMigrations(db: DatabaseSync, now: () => string = () => new Date().toISOString()): number {
  ensureLedger(db);

  const applied = readLedger(db);
  assertLedgerMatchesMigrations(applied);

  const appliedOrdinals = new Set(applied.map((r) => r.ordinal));

  // Contiguity: declared ordinals must be 1..N with no gaps.
  MIGRATIONS.forEach((m, index) => {
    if (m.ordinal !== index + 1) {
      throw new PersistenceSchemaError(
        `declared migrations must be contiguous from 1; found ordinal ${m.ordinal} at position ${index + 1}`,
        { ordinal: m.ordinal },
      );
    }
  });

  let count = 0;
  for (const migration of MIGRATIONS) {
    if (appliedOrdinals.has(migration.ordinal)) continue;

    db.exec('BEGIN');
    try {
      db.exec(migration.sql);
      db
        .prepare(`INSERT INTO ${LEDGER_NAME} (ordinal, name, checksum, applied_at) VALUES (?, ?, ?, ?)`)
        .run(migration.ordinal, migration.name, checksumOf(migration.sql), now());
      db.exec('COMMIT');
      count += 1;
    } catch (error) {
      db.exec('ROLLBACK');
      throw new PersistenceSchemaError(
        `migration ${migration.ordinal} ('${migration.name}') failed and was rolled back`,
        { ordinal: migration.ordinal, cause: String(error) },
      );
    }
  }

  // Final fail-closed verification against whatever is now applied.
  assertLedgerMatchesMigrations(readLedger(db));
  return count;
}

/** Inspect the applied ledger. Read-only. */
export function inspectLedger(db: DatabaseSync): ReadonlyArray<{ ordinal: number; name: string; checksum: string; appliedAt: string }> {
  const rows = db
    .prepare(`SELECT ordinal, name, checksum, applied_at FROM ${LEDGER_NAME} ORDER BY ordinal`)
    .all();
  return rows.map((r) => ({
    ordinal: Number(r.ordinal),
    name: String(r.name),
    checksum: String(r.checksum),
    appliedAt: String(r.applied_at),
  }));
}
