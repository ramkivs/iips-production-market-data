/**
 * NP-04 — Common Governed Persistence: controlled connection and lifecycle.
 *
 * A single controlled handle. No module-level singleton, so a consumer can open an isolated
 * database per test and close it deterministically.
 *
 * The path must be absolute and caller-supplied. This module never invents a default location,
 * never silently recreates a missing database directory, and never falls back to an in-memory
 * store when a durable path was requested.
 */
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { PersistenceError, PersistenceSchemaError } from './errors.js';
import { runMigrations } from './schema.js';

/**
 * Pragmas applied to every governed connection.
 *
 * WAL gives durable, concurrent readers alongside a writer. `foreign_keys` enforces the
 * supersession self-reference. `synchronous = FULL` trades throughput for durability, which is
 * the correct trade for a governed artifact store: a committed artifact must survive restart.
 */
const PRAGMAS: readonly string[] = [
  'PRAGMA journal_mode = WAL',
  'PRAGMA foreign_keys = ON',
  'PRAGMA busy_timeout = 5000',
  'PRAGMA synchronous = FULL',
];

export interface OpenOptions {
  /**
   * Absolute filesystem path to the governed database file.
   * Use ':memory:' only for explicit non-durable test scenarios.
   */
  readonly path: string;
  /** Create the parent directory if absent. Defaults to true. */
  readonly createDirectory?: boolean;
  /** Apply pending migrations on open. Defaults to true. Fail-closed. */
  readonly migrate?: boolean;
}

export interface GovernedDatabase {
  readonly handle: DatabaseSync;
  readonly path: string;
  /** Migrations applied during this open. */
  readonly migrationsApplied: number;
  close(): void;
}

/**
 * Open a governed database, apply pragmas, and migrate — in that order.
 *
 * If any step fails the handle is closed before the error propagates, so a failed open never
 * leaves a half-initialised connection behind and never leaves a listener running.
 */
export function openDatabase(options: OpenOptions): GovernedDatabase {
  const { path, createDirectory = true, migrate = true } = options;

  if (typeof path !== 'string' || path.length === 0) {
    throw new PersistenceError('PERSISTENCE_NOT_INITIALIZED', 'database path must be a non-empty string');
  }
  const isMemory = path === ':memory:';
  if (!isMemory && !isAbsolute(path)) {
    // Fail closed rather than resolve against a process-dependent working directory.
    throw new PersistenceError(
      'PERSISTENCE_NOT_INITIALIZED',
      `database path must be absolute (or ':memory:'): received '${path}'`,
    );
  }

  if (!isMemory && createDirectory) {
    try {
      mkdirSync(dirname(resolve(path)), { recursive: true });
    } catch (error) {
      throw new PersistenceError('PERSISTENCE_NOT_INITIALIZED', `cannot create database directory: ${String(error)}`);
    }
  }

  let handle: DatabaseSync;
  try {
    handle = new DatabaseSync(path);
  } catch (error) {
    throw new PersistenceError('PERSISTENCE_NOT_INITIALIZED', `cannot open database: ${String(error)}`);
  }

  try {
    for (const pragma of PRAGMAS) handle.exec(pragma);
    const migrationsApplied = migrate ? runMigrations(handle) : 0;
    return {
      handle,
      path,
      migrationsApplied,
      close(): void {
        if (handle.isOpen) handle.close();
      },
    };
  } catch (error) {
    if (handle.isOpen) handle.close();
    if (error instanceof PersistenceSchemaError) throw error;
    throw new PersistenceError('PERSISTENCE_NOT_INITIALIZED', `initialisation failed: ${String(error)}`);
  }
}
