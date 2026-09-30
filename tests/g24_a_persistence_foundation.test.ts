/**
 * Institutional Investment Platform System (IIPS)
 * G24 — Phase A Persistence Foundation Tests (NP04-G24 / §17)
 *
 * Covers: initialization, foreign keys, transaction rollback, startup failure,
 * invalid configuration.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  loadPersistenceConfig,
  temporaryPersistenceConfig,
  PersistenceConfigurationError,
  PersistenceConnection,
  PersistenceUnavailableError,
  DEFAULT_BUSY_TIMEOUT_MS,
  IPD_PORTFOLIO_DB_PATH_ENV,
} from '../src/persistence/index.js';
import {
  initializePersistence,
  initializePersistenceWithConfig,
} from '../src/persistence/bootstrap.js';
import {
  closeTestPersistence,
  openTestPersistence,
  tempDatabasePath,
} from './g24_test_support.js';

test('G24-A1: initialization creates the database file and applies the accepted pragmas', () => {
  const handle = openTestPersistence('a1');
  try {
    assert.equal(handle.startup.databasePath, handle.config.databasePath);
    assert.ok(fs.existsSync(handle.config.databasePath), 'database file must exist');
    assert.equal(handle.startup.schemaVersion, '002');
    assert.deepEqual(
      handle.startup.migrationsApplied,
      ['001', '002'],
      'first boot applies migrations 001 and 002'
    );
    assert.ok(handle.isOpen);
  } finally {
    closeTestPersistence(handle);
  }
});

test('G24-A2: foreign keys, synchronous, journal mode and busy timeout are enforced', () => {
  const handle = openTestPersistence('a2');
  try {
    const connection = handle.connection;

    const foreignKeys = connection.prepare('PRAGMA foreign_keys').get() as {
      foreign_keys: number;
    };
    assert.equal(foreignKeys.foreign_keys, 1, 'foreign_keys must be ON');

    const synchronous = connection.prepare('PRAGMA synchronous').get() as { synchronous: number };
    assert.equal(synchronous.synchronous, 2, 'synchronous must be FULL (2)');

    const journal = connection.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
    assert.equal(journal.journal_mode, 'delete', 'rollback journal is the accepted initial mode');

    const busy = connection.prepare('PRAGMA busy_timeout').get() as { timeout: number };
    assert.equal(busy.timeout, DEFAULT_BUSY_TIMEOUT_MS, 'bounded busy timeout must be applied');
  } finally {
    closeTestPersistence(handle);
  }
});

test('G24-A3: foreign key violations are rejected by the database', () => {
  const handle = openTestPersistence('a3');
  try {
    const connection = handle.connection;
    connection.exec(
      `CREATE TABLE parent_a3 (id TEXT PRIMARY KEY);
       CREATE TABLE child_a3 (id TEXT PRIMARY KEY, parent_id TEXT NOT NULL REFERENCES parent_a3(id));`
    );
    assert.throws(
      () => connection.prepare(`INSERT INTO child_a3 VALUES ('c1', 'missing')`).run(),
      (error: unknown) => {
        const code = (error as { code?: string }).code ?? '';
        return code.includes('CONSTRAINT');
      }
    );
  } finally {
    closeTestPersistence(handle);
  }
});

test('G24-A4: a failing transaction is rolled back completely and the connection stays usable', () => {
  const handle = openTestPersistence('a4');
  try {
    const connection = handle.connection;
    connection.exec(`CREATE TABLE tx_a4 (id TEXT PRIMARY KEY, value TEXT NOT NULL);`);

    assert.throws(() =>
      connection.immediateTransaction((tx) => {
        tx.prepare(`INSERT INTO tx_a4 VALUES ('k1', 'v1')`).run();
        throw new Error('forced-rollback');
      })
    );

    const rows = connection.prepare('SELECT COUNT(*) AS c FROM tx_a4').get() as { c: number };
    assert.equal(rows.c, 0, 'no rows may survive a rolled back transaction');

    // Connection remains usable after rollback.
    connection.immediateTransaction((tx) => {
      tx.prepare(`INSERT INTO tx_a4 VALUES ('k2', 'v2')`).run();
    });
    const after = connection.prepare('SELECT COUNT(*) AS c FROM tx_a4').get() as { c: number };
    assert.equal(after.c, 1);
  } finally {
    closeTestPersistence(handle);
  }
});

test('G24-A5: configuration validation fails closed', () => {
  // Missing path.
  assert.throws(
    () => loadPersistenceConfig({}),
    (error: unknown) =>
      error instanceof PersistenceConfigurationError &&
      error.code === 'PERSISTENCE_CONFIGURATION_INVALID'
  );

  // Relative path.
  assert.throws(
    () => loadPersistenceConfig({ [IPD_PORTFOLIO_DB_PATH_ENV]: 'relative/path.sqlite' }),
    PersistenceConfigurationError
  );

  // Blank path.
  assert.throws(
    () => loadPersistenceConfig({ [IPD_PORTFOLIO_DB_PATH_ENV]: '   ' }),
    PersistenceConfigurationError
  );

  // Invalid busy timeout.
  assert.throws(
    () =>
      loadPersistenceConfig({
        [IPD_PORTFOLIO_DB_PATH_ENV]: tempDatabasePath('a5'),
        IPD_PORTFOLIO_BUSY_TIMEOUT_MS: 'not-a-number',
      }),
    PersistenceConfigurationError
  );

  // Out-of-range busy timeout.
  assert.throws(
    () =>
      loadPersistenceConfig({
        [IPD_PORTFOLIO_DB_PATH_ENV]: tempDatabasePath('a5b'),
        IPD_PORTFOLIO_BUSY_TIMEOUT_MS: '999999',
      }),
    PersistenceConfigurationError
  );
});

test('G24-A6: initializePersistence fails closed when configuration is invalid (no connection opened)', () => {
  assert.throws(() => initializePersistence({}), PersistenceConfigurationError);
});

test('G24-A7: temporary configuration rejects relative paths', () => {
  assert.throws(() => temporaryPersistenceConfig('relative.sqlite'), PersistenceConfigurationError);
});

test('G24-A8: startup failure surfaces as a persistence error and never yields a usable handle', () => {
  // A directory cannot be opened as a SQLite database file.
  const directory = fs.mkdtempSync('/tmp/ipd-g24-a8-');
  assert.throws(
    () => initializePersistenceWithConfig(temporaryPersistenceConfig(directory)),
    PersistenceUnavailableError
  );
});

test('G24-A9: graceful shutdown closes persistence cleanly and is idempotent', () => {
  const handle = openTestPersistence('a9');
  const path = handle.config.databasePath;

  handle.close();
  assert.equal(handle.isOpen, false);

  // Idempotent: a second close does not throw.
  handle.close();
  assert.equal(handle.isOpen, false);

  // The database can be reopened (proves clean shutdown, no lock retained).
  const reopened = PersistenceConnection.open(temporaryPersistenceConfig(path));
  try {
    assert.ok(reopened.isOpen);
  } finally {
    reopened.close();
  }
});

test('G24-A10: operations after close fail closed', () => {
  const handle = openTestPersistence('a10');
  handle.close();
  assert.throws(() => handle.connection.prepare('SELECT 1'), (error: unknown) => {
    const code = (error as { code?: string }).code ?? '';
    return code === 'PERSISTENCE_CLOSED';
  });
});
