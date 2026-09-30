/**
 * Institutional Investment Platform System (IIPS)
 * Durable Persistence Connection Lifecycle (NP04-G24 / Phase A)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * This class is the ONLY holder of the native SQLite handle. Application code
 * never receives a raw database handle; it receives a PersistenceConnection
 * whose surface is limited to transactional units of work.
 *
 * Accepted configuration (NP04 governing decision):
 *  - foreign keys enabled
 *  - synchronous = FULL
 *  - rollback journal (DELETE) initially; WAL deferred
 *  - bounded busy timeout
 */

import type BetterSqlite3 from 'better-sqlite3';
import DatabaseDriver from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type { PersistenceConfig } from './config.js';
import {
  PersistenceClosedError,
  PersistenceError,
  PersistenceUnavailableError,
  TransactionFailedError,
} from './errors.js';

/**
 * Narrow, intentional surface exposed to the repository layer.
 * The native handle is private to this module boundary.
 */
/**
 * Translates only infrastructure faults. Governed domain errors are never
 * rewritten, so callers can distinguish a uniqueness conflict from a lifecycle
 * violation from an infrastructure failure.
 */
function translateTransactionError(error: unknown): unknown {
  if (error instanceof PersistenceError) {
    return error;
  }
  const code = (error as { code?: unknown } | null)?.code;
  if (typeof code === 'string' && code.startsWith('SQLITE_')) {
    return new PersistenceUnavailableError(`SQLite failure during transaction: ${code}`, error);
  }
  return error;
}

export class PersistenceConnection {
  private readonly handle: BetterSqlite3.Database;
  private closed = false;
  public readonly config: PersistenceConfig;

  private constructor(handle: BetterSqlite3.Database, config: PersistenceConfig) {
    this.handle = handle;
    this.config = config;
  }

  /**
   * Opens (or creates) the SQLite database and applies the accepted pragmas.
   * Fails closed: any opening or pragma failure propagates as PersistenceUnavailableError.
   */
  public static open(config: PersistenceConfig): PersistenceConnection {
    try {
      const directory = path.dirname(config.databasePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
    } catch (error) {
      throw new PersistenceUnavailableError(
        `Unable to create database directory for "${config.databasePath}".`,
        error
      );
    }

    let handle: BetterSqlite3.Database;
    try {
      handle = new DatabaseDriver(config.databasePath);
    } catch (error) {
      throw new PersistenceUnavailableError(
        `Unable to open persistence database at "${config.databasePath}".`,
        error
      );
    }

    const connection = new PersistenceConnection(handle, config);
    try {
      connection.applyPragmas();
    } catch (error) {
      try {
        handle.close();
      } catch {
        /* swallow: original failure is authoritative */
      }
      throw new PersistenceUnavailableError(
        `Unable to apply required SQLite pragmas to "${config.databasePath}".`,
        error
      );
    }

    return connection;
  }

  private applyPragmas(): void {
    this.assertOpen();

    // Accepted durability direction: apply, then read back and verify.
    // (The setter form of a pragma returns undefined in better-sqlite3, so the
    // effective value is always confirmed by a separate read.)
    this.handle.pragma('foreign_keys = ON');
    this.handle.pragma(`synchronous = ${this.config.synchronous}`);
    this.handle.pragma(`journal_mode = ${this.config.journalMode}`);
    this.handle.pragma(`busy_timeout = ${this.config.busyTimeoutMs}`);

    const foreignKeys = this.handle.pragma('foreign_keys', { simple: true });
    if (foreignKeys !== 1) {
      throw new PersistenceUnavailableError(
        'SQLite foreign key enforcement could not be enabled.'
      );
    }

    const synchronous = this.handle.pragma('synchronous', { simple: true });
    if (synchronous !== 2) {
      throw new PersistenceUnavailableError(
        `SQLite synchronous mode must be FULL (2), observed ${String(synchronous)}.`
      );
    }

    const journalMode = this.handle.pragma('journal_mode', { simple: true });
    if (journalMode !== 'delete') {
      throw new PersistenceUnavailableError(
        `SQLite journal mode must be the rollback journal (delete), observed ${String(journalMode)}.`
      );
    }
  }

  public get isOpen(): boolean {
    return !this.closed;
  }

  public get databasePath(): string {
    return this.config.databasePath;
  }

  private assertOpen(): void {
    if (this.closed) {
      throw new PersistenceClosedError();
    }
  }

  /** Repository-layer statement preparation. Only used inside the persistence boundary. */
  public prepare(sql: string): BetterSqlite3.Statement {
    this.assertOpen();
    try {
      return this.handle.prepare(sql);
    } catch (error) {
      throw new PersistenceUnavailableError(`Failed to prepare statement: ${sql}`, error);
    }
  }

  /** Executes DDL/DML script text. Intended for migration application only. */
  public exec(sql: string): void {
    this.assertOpen();
    try {
      this.handle.exec(sql);
    } catch (error) {
      throw new PersistenceUnavailableError('Failed to execute migration script.', error);
    }
  }

  /**
   * Runs `work` inside a DEFERRED transaction.
   *
   * The transaction is rolled back on any thrown error. Error translation is
   * deliberately minimal so that governed domain errors (identity, lifecycle,
   * authorization) reach their callers unchanged:
   *   - PersistenceError   -> propagated verbatim
   *   - SQLITE_* failures  -> PersistenceUnavailableError (infrastructure fault)
   *   - everything else    -> propagated verbatim (domain error)
   */
  public transaction<T>(work: (connection: PersistenceConnection) => T): T {
    this.assertOpen();
    const runner = this.handle.transaction((): T => work(this));
    try {
      return runner();
    } catch (error) {
      throw translateTransactionError(error);
    }
  }

  /**
   * Runs `work` inside an IMMEDIATE transaction (write lock acquired up front).
   * This is the required form for portfolio and identity mutations.
   */
  public immediateTransaction<T>(work: (connection: PersistenceConnection) => T): T {
    this.assertOpen();
    const runner = this.handle.transaction((): T => work(this));
    try {
      return runner.immediate();
    } catch (error) {
      throw translateTransactionError(error);
    }
  }

  /** Closes the connection. Idempotent and safe to call during shutdown. */
  public close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    try {
      this.handle.close();
    } catch (error) {
      throw new PersistenceUnavailableError('Failed to close persistence connection cleanly.', error);
    }
  }
}
