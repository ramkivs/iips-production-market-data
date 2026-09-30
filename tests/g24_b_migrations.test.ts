/**
 * Institutional Investment Platform System (IIPS)
 * G24 — Phase B Migration System Tests (NP04-G24 / §17)
 *
 * Covers: migration application, checksum validation, transactional
 * application, startup failure, no automatic downgrade, restart survival.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  initializePersistenceWithConfig,
  PersistenceConnection,
  temporaryPersistenceConfig,
  MigrationApplicationError,
  MigrationChecksumError,
  MigrationStateRegressionError,
} from '../src/persistence/index.js';
import {
  applyPendingMigrations,
  computeMigrationChecksum,
  ensureMigrationLedger,
  MIGRATION_LEDGER_TABLE,
  readAppliedMigrations,
  readSchemaVersion,
  runMigrations,
} from '../src/persistence/migrations/index.js';
import { MIGRATIONS } from '../src/persistence/migrations/registry.js';
import type { MigrationDefinition } from '../src/persistence/migrations/types.js';
import {
  closeTestPersistence,
  openTestPersistence,
  tempDatabasePath,
} from './g24_test_support.js';

test('G24-B1: migration 001 is recorded in the ledger with its checksum', () => {
  const handle = openTestPersistence('b1');
  try {
    const applied = readAppliedMigrations(handle.connection);
    assert.equal(applied.length, 2);
    assert.equal(applied[0]!.id, '001');
    assert.equal(applied[0]!.name, 'initial_schema');
    assert.equal(applied[1]!.id, '002');
    assert.equal(applied[1]!.name, 'audit_event_sequence');
    assert.equal(
      applied[0]!.checksum,
      computeMigrationChecksum(MIGRATIONS[0]!.sql),
      'recorded checksum must equal the checksum of the immutable SQL'
    );
    assert.equal(readSchemaVersion(handle.connection), '002');
  } finally {
    closeTestPersistence(handle);
  }
});

test('G24-B2: re-running migrations on an already-migrated database applies nothing', () => {
  const handle = openTestPersistence('b2');
  try {
    const result = runMigrations(handle.connection);
    assert.deepEqual(result.applied, [], 'no migration may be re-applied');
    assert.equal(result.currentVersion, '002');
  } finally {
    closeTestPersistence(handle);
  }
});

test('G24-B3: a tampered checksum causes startup failure (no silent repair)', () => {
  const handle = openTestPersistence('b3');
  try {
    handle.connection
      .prepare(`UPDATE ${MIGRATION_LEDGER_TABLE} SET checksum = ? WHERE id = ?`)
      .run('deadbeef', '001');

    assert.throws(
      () => runMigrations(handle.connection),
      (error: unknown) =>
        error instanceof MigrationChecksumError && error.migrationId === '001'
    );
  } finally {
    closeTestPersistence(handle);
  }
});

test('G24-B4: a database ahead of the application is refused (no automatic downgrade)', () => {
  const handle = openTestPersistence('b4');
  try {
    handle.connection
      .prepare(
        `INSERT INTO ${MIGRATION_LEDGER_TABLE} (id, name, checksum, applied_at) VALUES (?, ?, ?, ?)`
      )
      .run('999', 'future_migration', 'abc', new Date().toISOString());

    assert.throws(
      () => runMigrations(handle.connection),
      (error: unknown) => error instanceof MigrationStateRegressionError
    );
  } finally {
    closeTestPersistence(handle);
  }
});

test('G24-B5: an out-of-order ledger is refused', () => {
  const handle = openTestPersistence('b5');
  try {
    handle.connection
      .prepare(
        `INSERT INTO ${MIGRATION_LEDGER_TABLE} (id, name, checksum, applied_at) VALUES (?, ?, ?, ?)`
      )
      .run('000', 'mystery', 'abc', new Date().toISOString());

    assert.throws(
      () => runMigrations(handle.connection),
      (error: unknown) => error instanceof MigrationStateRegressionError
    );
  } finally {
    closeTestPersistence(handle);
  }
});

test('G24-B6: a failing migration fails startup and records nothing (transactional)', () => {
  const handle = openTestPersistence('b6');
  try {
    const brokenMigration: MigrationDefinition = {
      id: '003',
      name: 'broken_migration',
      sql: `CREATE TABLE should_not_exist_b6 (id TEXT PRIMARY KEY);
            THIS IS NOT VALID SQL;`,
    };

    assert.throws(
      () => runMigrations(handle.connection, [...MIGRATIONS, brokenMigration]),
      (error: unknown) =>
        error instanceof MigrationApplicationError && error.migrationId === '003'
    );

    // Neither the DDL nor the ledger row may survive: application is transactional.
    const table = handle.connection
      .prepare(`SELECT name FROM sqlite_master WHERE name = 'should_not_exist_b6'`)
      .get();
    assert.equal(table, undefined, 'failed DDL must be rolled back');

    const applied = readAppliedMigrations(handle.connection);
    assert.equal(applied.length, 2, 'failed migration must not be recorded in the ledger');
    assert.equal(applied[0]!.id, '001');
  } finally {
    closeTestPersistence(handle);
  }
});

test('G24-B7: migration DDL and ledger insert are atomic within one transaction', () => {
  const handle = openTestPersistence('b7');
  try {
    const goodMigration: MigrationDefinition = {
      id: '003',
      name: 'atomic_probe',
      sql: `CREATE TABLE atomic_probe_b7 (id TEXT PRIMARY KEY);`,
    };

    const applied = applyPendingMigrations(handle.connection, [...MIGRATIONS, goodMigration]);
    assert.deepEqual(applied, ['003']);

    const table = handle.connection
      .prepare(`SELECT name FROM sqlite_master WHERE name = 'atomic_probe_b7'`)
      .get();
    assert.ok(table, 'DDL from the applied migration must be present');
    assert.equal(readSchemaVersion(handle.connection), '003');
  } finally {
    closeTestPersistence(handle);
  }
});

test('G24-B8: migration state survives a process restart and is not re-applied', () => {
  const databasePath = tempDatabasePath('b8');

  const first = initializePersistenceWithConfig(temporaryPersistenceConfig(databasePath));
  assert.deepEqual(first.startup.migrationsApplied, ['001', '002']);
  closeTestPersistence(first);

  // "Restart": a brand new connection against the same durable file.
  const second = initializePersistenceWithConfig(temporaryPersistenceConfig(databasePath));
  try {
    assert.deepEqual(
      second.startup.migrationsApplied,
      [],
      'migrations must not be re-applied on restart'
    );
    assert.equal(second.startup.schemaVersion, '002');

    const applied = readAppliedMigrations(second.connection);
    assert.equal(applied.length, 2);
    assert.equal(applied[0]!.id, '001');
  } finally {
    closeTestPersistence(second);
  }
});

test('G24-B9: the migration runner never destroys or recreates an existing database', () => {
  const handle = openTestPersistence('b9');
  try {
    // Plant a row that is not part of any migration.
    handle.connection.exec(
      `CREATE TABLE user_data_b9 (id TEXT PRIMARY KEY, value TEXT NOT NULL);
       INSERT INTO user_data_b9 VALUES ('survivor', 'must-remain');`
    );

    runMigrations(handle.connection);

    const row = handle.connection
      .prepare(`SELECT value FROM user_data_b9 WHERE id = 'survivor'`)
      .get() as { value: string } | undefined;
    assert.equal(row?.value, 'must-remain', 'no destructive recovery may occur');
  } finally {
    closeTestPersistence(handle);
  }
});

test('G24-B10: the ledger is created and verified by bootstrap', () => {
  const connection = PersistenceConnection.open(temporaryPersistenceConfig(tempDatabasePath('b10')));
  try {
    ensureMigrationLedger(connection);
    ensureMigrationLedger(connection); // idempotent

    const columns = connection
      .prepare(`PRAGMA table_info(${MIGRATION_LEDGER_TABLE})`)
      .all() as Array<{ name: string }>;
    const names = columns.map((c) => c.name).sort();
    assert.deepEqual(names, ['applied_at', 'checksum', 'id', 'name']);
  } finally {
    connection.close();
  }
});
