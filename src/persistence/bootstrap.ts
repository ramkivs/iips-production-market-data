/**
 * Institutional Investment Platform System (IIPS)
 * Persistence Bootstrap & Lifecycle (NP04-G24 / Phase A + Phase B)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Accepted startup order (NP04 governing decision):
 *   1. validate configuration
 *   2. establish database connection
 *   3. apply migrations
 *   4. verify migration state
 *   5. only then is the caller permitted to start HTTP listening
 *
 * Shutdown closes persistence cleanly. Any failure fails closed: there is no
 * silent in-memory fallback anywhere on this path.
 */

import { loadPersistenceConfig, type PersistenceConfig } from './config.js';
import { PersistenceConnection } from './connection.js';
import { PersistenceUnavailableError } from './errors.js';
import { runMigrations, readSchemaVersion } from './migrations/index.js';

export interface PersistenceStartupReport {
  readonly databasePath: string;
  readonly migrationsApplied: readonly string[];
  readonly schemaVersion: string;
}

/**
 * The single handle an application component receives. It owns the connection
 * and is the only path to a transactional unit of work.
 */
export class PersistenceHandle {
  private closed = false;
  public readonly connection: PersistenceConnection;
  public readonly config: PersistenceConfig;
  public readonly startup: PersistenceStartupReport;

  constructor(
    connection: PersistenceConnection,
    config: PersistenceConfig,
    startup: PersistenceStartupReport
  ) {
    this.connection = connection;
    this.config = config;
    this.startup = startup;
  }

  public get isOpen(): boolean {
    return !this.closed;
  }

  /** Idempotent graceful shutdown. */
  public close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.connection.close();
  }
}

/**
 * Explicit database initialization/bootstrap.
 *
 * @param env environment source (defaults to process.env)
 */
export function initializePersistence(env: NodeJS.ProcessEnv = process.env): PersistenceHandle {
  // 1. Configuration is validated before any connection is attempted.
  const config = loadPersistenceConfig(env);

  // 2. Establish the connection (pragmas applied atomically inside open()).
  const connection = PersistenceConnection.open(config);

  try {
    // 3 + 4. Apply migrations and verify the resulting state.
    const result = runMigrations(connection);
    const schemaVersion = readSchemaVersion(connection);

    return new PersistenceHandle(connection, config, {
      databasePath: config.databasePath,
      migrationsApplied: result.applied,
      schemaVersion,
    });
  } catch (error) {
    // Fail closed: never leave a half-initialised connection open.
    try {
      connection.close();
    } catch {
      /* swallow: original failure is authoritative */
    }
    if (error instanceof PersistenceUnavailableError) {
      throw error;
    }
    throw new PersistenceUnavailableError(
      `Persistence initialization failed for "${config.databasePath}".`,
      error
    );
  }
}

/**
 * Opens a handle against an explicitly supplied configuration (tests, tooling).
 * Applies the identical startup sequence.
 */
export function initializePersistenceWithConfig(config: PersistenceConfig): PersistenceHandle {
  const connection = PersistenceConnection.open(config);
  try {
    const result = runMigrations(connection);
    const schemaVersion = readSchemaVersion(connection);
    return new PersistenceHandle(connection, config, {
      databasePath: config.databasePath,
      migrationsApplied: result.applied,
      schemaVersion,
    });
  } catch (error) {
    try {
      connection.close();
    } catch {
      /* swallow */
    }
    if (error instanceof PersistenceUnavailableError) {
      throw error;
    }
    throw new PersistenceUnavailableError(
      `Persistence initialization failed for "${config.databasePath}".`,
      error
    );
  }
}
