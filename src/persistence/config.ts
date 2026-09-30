/**
 * Institutional Investment Platform System (IIPS)
 * Durable Persistence Configuration (NP04-G24 / Phase A)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION
 *
 * Configuration is validated before any connection is established.
 * The database path MUST be absolute and is never hard-coded to a machine-specific
 * location; it is supplied exclusively through IPD_PORTFOLIO_DB_PATH.
 */

import path from 'node:path';
import { PersistenceConfigurationError } from './errors.js';

/** Environment variable that supplies the durable SQLite database location. */
export const IPD_PORTFOLIO_DB_PATH_ENV = 'IPD_PORTFOLIO_DB_PATH';

/** Optional bounded busy timeout override. */
export const IPD_PORTFOLIO_BUSY_TIMEOUT_ENV = 'IPD_PORTFOLIO_BUSY_TIMEOUT_MS';

export const DEFAULT_BUSY_TIMEOUT_MS = 5_000;
export const MAX_BUSY_TIMEOUT_MS = 60_000;

export interface PersistenceConfig {
  /** Absolute path to the IPD-owned durable SQLite database file. */
  readonly databasePath: string;
  /** Bounded busy timeout applied to the connection (milliseconds). */
  readonly busyTimeoutMs: number;
  /** Foreign key enforcement is mandatory. */
  readonly foreignKeysEnabled: true;
  /** Accepted direction: rollback journal initially; WAL deferred. */
  readonly journalMode: 'DELETE';
  /** Accepted direction: synchronous=FULL. */
  readonly synchronous: 'FULL';
}

/**
 * Validates and returns the persistence configuration.
 *
 * Fails closed on:
 *  - missing / blank IPD_PORTFOLIO_DB_PATH;
 *  - a relative path (absolute paths are mandatory);
 *  - a path that resolves to a directory separator root only;
 *  - an out-of-range or non-numeric busy timeout.
 */
export function loadPersistenceConfig(
  env: NodeJS.ProcessEnv = process.env
): PersistenceConfig {
  const rawPath = env[IPD_PORTFOLIO_DB_PATH_ENV];

  if (typeof rawPath !== 'string' || rawPath.trim() === '') {
    throw new PersistenceConfigurationError(
      `Missing required configuration: ${IPD_PORTFOLIO_DB_PATH_ENV} must be set to an absolute path.`
    );
  }

  const databasePath = rawPath.trim();

  if (!path.isAbsolute(databasePath)) {
    throw new PersistenceConfigurationError(
      `Invalid ${IPD_PORTFOLIO_DB_PATH_ENV}: path must be absolute, received "${databasePath}".`
    );
  }

  const normalized = path.normalize(databasePath);
  if (normalized === path.sep || normalized.endsWith(`${path.sep}${path.sep}`)) {
    throw new PersistenceConfigurationError(
      `Invalid ${IPD_PORTFOLIO_DB_PATH_ENV}: path must reference a database file, not a filesystem root.`
    );
  }

  const rawTimeout = env[IPD_PORTFOLIO_BUSY_TIMEOUT_ENV];
  let busyTimeoutMs = DEFAULT_BUSY_TIMEOUT_MS;

  if (rawTimeout !== undefined && String(rawTimeout).trim() !== '') {
    const parsed = Number(rawTimeout);
    if (!Number.isInteger(parsed) || parsed <= 0 || parsed > MAX_BUSY_TIMEOUT_MS) {
      throw new PersistenceConfigurationError(
        `Invalid ${IPD_PORTFOLIO_BUSY_TIMEOUT_ENV}: must be an integer in (0, ${MAX_BUSY_TIMEOUT_MS}].`
      );
    }
    busyTimeoutMs = parsed;
  }

  return {
    databasePath: normalized,
    busyTimeoutMs,
    foreignKeysEnabled: true,
    journalMode: 'DELETE',
    synchronous: 'FULL',
  };
}

/**
 * Resolves a configuration for an isolated temporary database (tests only).
 * Tests must never write to the development database.
 */
export function temporaryPersistenceConfig(
  databasePath: string,
  overrides: Partial<Pick<PersistenceConfig, 'busyTimeoutMs'>> = {}
): PersistenceConfig {
  if (!path.isAbsolute(databasePath)) {
    throw new PersistenceConfigurationError(
      `Temporary persistence path must be absolute, received "${databasePath}".`
    );
  }
  return {
    databasePath: path.normalize(databasePath),
    busyTimeoutMs: overrides.busyTimeoutMs ?? DEFAULT_BUSY_TIMEOUT_MS,
    foreignKeysEnabled: true,
    journalMode: 'DELETE',
    synchronous: 'FULL',
  };
}
