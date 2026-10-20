/**
 * Gate 3 — node:sqlite connection boundary (act §4.2 item 1).
 *
 * Opens exactly one `node:sqlite` DatabaseSync against an operator-local absolute
 * path. No network, no HTTP, no URL: node:sqlite is a local file binding only.
 *
 * Runtime guard (act §8.3): node:sqlite is flag-free only from Node 22.13.0. The
 * guard runs before any file is opened, fails closed, and is code-enforced because
 * adding an `engines` field to package.json is not authorized.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute } from 'node:path';

export const MINIMUM_NODE_MAJOR = 22;
export const MINIMUM_NODE_MINOR = 13;
export const MINIMUM_NODE_PATCH = 0;

export class RuntimeUnsupportedError extends Error {
  constructor(readonly observed: string, readonly required: string) {
    super(`Node ${observed} is below the required minimum ${required}; node:sqlite is not available flag-free`);
    this.name = 'RuntimeUnsupportedError';
  }
}

export class DatabasePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabasePathError';
  }
}

export function compareNodeVersion(version: string): { supported: boolean; major: number; minor: number; patch: number } {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
  if (!match) {
    return { supported: false, major: 0, minor: 0, patch: 0 };
  }
  const [major, minor, patch] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const supported =
    major > MINIMUM_NODE_MAJOR ||
    (major === MINIMUM_NODE_MAJOR &&
      (minor > MINIMUM_NODE_MINOR || (minor === MINIMUM_NODE_MINOR && patch >= MINIMUM_NODE_PATCH)));
  return { supported, major, minor, patch };
}

export function assertSupportedRuntime(version: string = process.versions.node): void {
  const result = compareNodeVersion(version);
  if (!result.supported) {
    throw new RuntimeUnsupportedError(
      version,
      `${MINIMUM_NODE_MAJOR}.${MINIMUM_NODE_MINOR}.${MINIMUM_NODE_PATCH}`,
    );
  }
}

let processConnection: DatabaseSync | null = null;
let processConnectionPath: string | null = null;

/**
 * Opens the single process connection. Idempotent per process for the SAME
 * path: a repeated open returns the existing connection. Requesting a
 * DIFFERENT path while a handle is open is an explicit error: silently
 * returning the old handle let one component's (or test's) database
 * contaminate another's on platforms where an open file cannot be removed
 * (Windows EBUSY). Callers must closeDatabase() before opening a new path.
 */
export function openDatabase(filePath: string, version: string = process.versions.node): DatabaseSync {
  assertSupportedRuntime(version);
  if (typeof filePath !== 'string' || filePath.trim().length === 0) {
    throw new DatabasePathError('the database path must be a non-empty absolute operator-local path');
  }
  if (!isAbsolute(filePath)) {
    throw new DatabasePathError(`the database path must be absolute, received: ${filePath}`);
  }
  if (processConnection) {
    if (processConnectionPath !== filePath) {
      throw new DatabasePathError(
        `a database connection is already open at ${processConnectionPath}; ` +
          `close it before opening ${filePath}`,
      );
    }
    return processConnection;
  }
  mkdirSync(dirname(filePath), { recursive: true });
  const db = new DatabaseSync(filePath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = DELETE;');
  db.exec('PRAGMA synchronous = FULL;');
  processConnection = db;
  processConnectionPath = filePath;
  return db;
}

export function getProcessConnection(): DatabaseSync | null {
  return processConnection;
}

export function closeDatabase(): void {
  if (processConnection) {
    processConnection.close();
    processConnection = null;
    processConnectionPath = null;
  }
}
