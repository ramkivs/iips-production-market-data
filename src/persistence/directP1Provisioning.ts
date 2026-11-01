/**
 * Direct P1 Local User-Portfolio Database Provisioning & Verification (IPD).
 *
 * Authority: IIPS-V3-CAP03-PA-BLANKET-WAIVER-ONE-PASS-AUTHORIZATION-2026-11-01-01
 *
 * Implements straightforward, standalone local provisioning and read-only
 * verification of the designated single-user SQLite user-portfolio store
 * (`C:\iips-data\iips\user-portfolio.sqlite` on Windows) by reusing existing
 * IPD persistence primitives:
 *   - runtime & `node:sqlite` validation (`connection.ts`)
 *   - ordered migration ledger `001`..`004` (`migration_ledger.ts` + `migrations/*`)
 *   - deterministic PA-determined local principal binding & membership records
 *   - hash-chained `audit_events` ledger (`audit.ts`)
 *   - single-ACTIVE binding/membership resolution (`binding.ts`)
 *   - W-1 `Port.save` write guard (`portfolio_store.ts`)
 *
 * Discontinued P1-F governance, certification, retry, claim/marker, S2 commit/tree
 * pin, standalone preflight, and external evidence-root workflows are NOT invoked
 * and NOT required. Genuine database integrity and existing-user-data safeguards
 * remain strictly enforced.
 */

import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, posix as posixPath, resolve, win32 as win32Path } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

import {
  AUDIT_GENESIS,
  appendAuditEvent,
  readAuditEvents,
  verifyAuditChain,
} from './audit.js';
import { resolveActiveBindingInCurrentTransaction } from './binding.js';
import {
  DatabasePathError,
  MINIMUM_NODE_MAJOR,
  MINIMUM_NODE_MINOR,
  MINIMUM_NODE_PATCH,
  RuntimeUnsupportedError,
  assertSupportedRuntime,
  closeDatabase,
  openDatabase,
} from './connection.js';
import {
  CANONICAL_OWNER_ID,
  GATE3_MIGRATIONS,
  PRINCIPAL_LABEL,
  TENANT_ID,
  bindingIdFor,
  membershipIdFor,
} from './gateAPrimeValidation.js';
import {
  MigrationIntegrityError,
  ensureMigrations,
  migrationChecksum,
} from './migration_ledger.js';
import { evaluatePortSaveGuard } from './portfolio_store.js';

export const DIRECT_PROVISIONING_AUTHORITY_ID =
  'IIPS-V3-CAP03-PA-BLANKET-WAIVER-ONE-PASS-AUTHORIZATION-2026-11-01-01';

export const DESIGNATED_USER_PORTFOLIO_DB_PATH =
  'C:\\iips-data\\iips\\user-portfolio.sqlite';

export const DIRECT_PROVISIONING_MODES = ['provision', 'verify'] as const;
export type DirectProvisioningMode = (typeof DIRECT_PROVISIONING_MODES)[number];

export type DirectProvisioningErrorCode =
  | 'ARGUMENT_INVALID'
  | 'RUNTIME_UNSUPPORTED'
  | 'SQLITE_DEPENDENCY_UNAVAILABLE'
  | 'MIGRATION_DEFINITION_INVALID'
  | 'IDENTITY_CONSTANTS_UNRESOLVED'
  | 'STORE_PATH_INVALID'
  | 'STORE_PATH_IN_GIT_WORKTREE'
  | 'STORE_PATH_SYMLINK_UNSUPPORTED'
  | 'STORE_PARENT_NOT_DIRECTORY'
  | 'STORE_DIRECTORY_NOT_WRITABLE'
  | 'EXISTING_PATH_NOT_REGULAR_FILE'
  | 'EXISTING_DATABASE_PROTECTED'
  | 'STORE_MISSING'
  | 'PROVISIONING_TRANSACTION_FAILED'
  | 'VERIFICATION_FAILED';

export class DirectProvisioningError extends Error {
  readonly code: DirectProvisioningErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    code: DirectProvisioningErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(`${code}: ${message}`);
    this.name = 'DirectProvisioningError';
    this.code = code;
    this.details = details;
  }
}

export interface DesignatedIdentityTriple {
  principalLabel: string;
  tenantId: string;
  canonicalOwnerId: string;
  bindingId: string;
  membershipId: string;
}

export function resolveDesignatedIdentityTriple(): DesignatedIdentityTriple {
  if (
    typeof PRINCIPAL_LABEL !== 'string' ||
    !PRINCIPAL_LABEL.trim() ||
    typeof TENANT_ID !== 'string' ||
    !TENANT_ID.trim() ||
    typeof CANONICAL_OWNER_ID !== 'string' ||
    !CANONICAL_OWNER_ID.trim()
  ) {
    throw new DirectProvisioningError(
      'IDENTITY_CONSTANTS_UNRESOLVED',
      'PA-determined identity constants (PRINCIPAL_LABEL, TENANT_ID, CANONICAL_OWNER_ID) must all be non-empty strings.',
    );
  }
  const bindingId = bindingIdFor(PRINCIPAL_LABEL);
  const membershipId = membershipIdFor(TENANT_ID, CANONICAL_OWNER_ID);
  return {
    principalLabel: PRINCIPAL_LABEL,
    tenantId: TENANT_ID,
    canonicalOwnerId: CANONICAL_OWNER_ID,
    bindingId,
    membershipId,
  };
}

export interface RuntimeDependencyReport {
  nodeVersion: string;
  minimumNodeVersion: string;
  sqliteVersion: string;
  foreignKeysPragmaSupported: boolean;
  migrationIds: string[];
  migrationChecksums: Record<string, string>;
  principalLabel: string;
  tenantId: string;
  canonicalOwnerId: string;
  bindingId: string;
  membershipId: string;
}

export interface DestinationValidationReport {
  storePath: string;
  parentDirectory: string;
  platform: NodeJS.Platform;
  exists: boolean;
  sizeBytes: number | null;
  outsideGitWorktree: boolean;
}

export interface DirectProvisioningCheck {
  checkId: string;
  name: string;
  passed: boolean;
  detail: string;
}

export interface SchemaVerificationSummary {
  migrationCount: number;
  appliedMigrations: Array<{
    migrationId: string;
    checksum: string;
    appliedAt: string;
  }>;
  tables: string[];
  explicitIndexes: string[];
  integrityCheck: string;
  foreignKeyViolations: number;
  writeGuardEnforced: boolean;
}

export interface ProvisioningRecordSummary {
  bindingId: string;
  principalLabel: string;
  bindingStatus: string;
  membershipId: string;
  tenantId: string;
  canonicalOwnerId: string;
  membershipStatus: string;
  auditEventCount: number;
  auditChainValid: boolean;
  initialAuditEventId: number;
  initialAuditEventChecksum: string;
  portfolioCounts: {
    portfolios: number;
    portfolioRevisions: number;
    portfolioHoldings: number;
    portfolioContributions: number;
  };
}

export interface VerificationResult {
  ok: boolean;
  status: 'VERIFIED' | 'VERIFICATION_FAILED';
  mode: 'verify';
  authorityId: string;
  storePath: string;
  fileSizeBytes: number;
  fileSha256: string;
  checks: DirectProvisioningCheck[];
  schema: SchemaVerificationSummary | null;
  provisioning: ProvisioningRecordSummary | null;
  errorCode?: DirectProvisioningErrorCode;
  errorMessage?: string;
}

export interface ProvisioningTestHooks {
  afterMigrationsApplied?: (db: DatabaseSync) => void;
  afterBindingInserted?: (db: DatabaseSync) => void;
  afterMembershipInserted?: (db: DatabaseSync) => void;
}

export interface DirectProvisioningOptions {
  storePath?: string;
  requireFresh?: boolean;
  now?: () => string;
  nodeVersion?: string;
  platform?: NodeJS.Platform;
  testHooks?: ProvisioningTestHooks;
}

export interface DirectProvisioningResult {
  ok: true;
  status: 'PROVISIONED' | 'ALREADY_PROVISIONED';
  mode: 'provision';
  authorityId: string;
  storePath: string;
  storeExistedBefore: boolean;
  mutated: boolean;
  fileSizeBytes: number;
  fileSha256: string;
  runtime: RuntimeDependencyReport;
  checks: DirectProvisioningCheck[];
  schema: SchemaVerificationSummary;
  provisioning: ProvisioningRecordSummary;
}

export interface DirectProvisioningFailureReport {
  ok: false;
  status: 'FAILED';
  mode: DirectProvisioningMode;
  authorityId: string;
  storePath: string | null;
  mutated: false;
  errorCode: DirectProvisioningErrorCode;
  errorMessage: string;
  details?: Record<string, unknown>;
}

interface ExpectedColumnSpec {
  name: string;
  type: string;
  notnull: 0 | 1;
  pk: number;
}

interface ExpectedIndexSpec {
  table: string;
  unique: 0 | 1;
  partial: 0 | 1;
}

interface ExpectedForeignKeySpec {
  fromTable: string;
  toTable: string;
  columnPairs: Array<[string, string]>;
}

const SQLITE_HEADER_MAGIC = 'SQLite format 3\0';
const SQLITE_MINIMUM_HEADER_BYTES = 100;

const EXPECTED_MIGRATION_IDS = [
  '001_initial_schema',
  '002_audit_event_sequence',
  '003_local_principal_bindings',
  '004_portfolio_contribution_provenance',
] as const;

const EXPECTED_TABLE_COLUMNS: Readonly<Record<string, readonly ExpectedColumnSpec[]>> = {
  _migration_ledger: [
    { name: 'migration_id', type: 'TEXT', notnull: 1, pk: 1 },
    { name: 'checksum', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'applied_at', type: 'TEXT', notnull: 1, pk: 0 },
  ],
  portfolios: [
    { name: 'portfolio_id', type: 'TEXT', notnull: 1, pk: 2 },
    { name: 'canonical_owner_id', type: 'TEXT', notnull: 1, pk: 1 },
    { name: 'tenant_id', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'portfolio_name', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'current_revision', type: 'INTEGER', notnull: 1, pk: 0 },
    { name: 'status', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'created_at', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'updated_at', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'deleted_at', type: 'TEXT', notnull: 0, pk: 0 },
  ],
  portfolio_revisions: [
    { name: 'portfolio_id', type: 'TEXT', notnull: 1, pk: 2 },
    { name: 'canonical_owner_id', type: 'TEXT', notnull: 1, pk: 1 },
    { name: 'revision', type: 'INTEGER', notnull: 1, pk: 3 },
    { name: 'operation', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'total_market_value', type: 'REAL', notnull: 1, pk: 0 },
    { name: 'weight_sum_percentage', type: 'REAL', notnull: 1, pk: 0 },
    { name: 'holdings_count', type: 'INTEGER', notnull: 1, pk: 0 },
    { name: 'provenance_digest', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'content_digest', type: 'TEXT', notnull: 0, pk: 0 },
    { name: 'created_at', type: 'TEXT', notnull: 1, pk: 0 },
  ],
  portfolio_holdings: [
    { name: 'canonical_owner_id', type: 'TEXT', notnull: 1, pk: 1 },
    { name: 'portfolio_id', type: 'TEXT', notnull: 1, pk: 2 },
    { name: 'revision', type: 'INTEGER', notnull: 1, pk: 3 },
    { name: 'holding_key', type: 'TEXT', notnull: 1, pk: 4 },
    { name: 'symbol', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'company_id', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'quantity', type: 'REAL', notnull: 1, pk: 0 },
    { name: 'average_buy_price', type: 'REAL', notnull: 1, pk: 0 },
    { name: 'current_price', type: 'REAL', notnull: 1, pk: 0 },
    { name: 'market_value', type: 'REAL', notnull: 1, pk: 0 },
    { name: 'weight_percentage', type: 'REAL', notnull: 1, pk: 0 },
    { name: 'active', type: 'INTEGER', notnull: 1, pk: 0 },
    { name: 'source_broker', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'lineage_digest', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'identity_status', type: 'TEXT', notnull: 0, pk: 0 },
    { name: 'resolution_disposition', type: 'TEXT', notnull: 0, pk: 0 },
    { name: 'created_at', type: 'TEXT', notnull: 1, pk: 0 },
  ],
  portfolio_contributions: [
    { name: 'canonical_owner_id', type: 'TEXT', notnull: 1, pk: 1 },
    { name: 'portfolio_id', type: 'TEXT', notnull: 1, pk: 2 },
    { name: 'contribution_id', type: 'TEXT', notnull: 1, pk: 3 },
    { name: 'amount', type: 'REAL', notnull: 1, pk: 0 },
    { name: 'contributed_at', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'created_at', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'file_name', type: 'TEXT', notnull: 0, pk: 0 },
    { name: 'source_broker', type: 'TEXT', notnull: 0, pk: 0 },
    { name: 'content_digest', type: 'TEXT', notnull: 0, pk: 0 },
    { name: 'lineage_digest', type: 'TEXT', notnull: 0, pk: 0 },
    { name: 'imported_at', type: 'TEXT', notnull: 0, pk: 0 },
    { name: 'contribution_semantics', type: 'TEXT', notnull: 0, pk: 0 },
  ],
  audit_events: [
    { name: 'id', type: 'INTEGER', notnull: 0, pk: 1 },
    { name: 'event_type', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'subject_type', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'subject_id', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'detail_json', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'prev_checksum', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'entry_checksum', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'created_at', type: 'TEXT', notnull: 1, pk: 0 },
  ],
  local_principal_bindings: [
    { name: 'binding_id', type: 'TEXT', notnull: 0, pk: 1 },
    { name: 'principal_label', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'status', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'created_at', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'updated_at', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'revoked_at', type: 'TEXT', notnull: 0, pk: 0 },
  ],
  local_principal_memberships: [
    { name: 'membership_id', type: 'TEXT', notnull: 0, pk: 1 },
    { name: 'binding_id', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'tenant_id', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'canonical_owner_id', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'status', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'created_at', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'updated_at', type: 'TEXT', notnull: 1, pk: 0 },
    { name: 'revoked_at', type: 'TEXT', notnull: 0, pk: 0 },
  ],
};

const EXPECTED_EXPLICIT_INDEXES: Readonly<Record<string, ExpectedIndexSpec>> = {
  idx_portfolios_owner: { table: 'portfolios', unique: 0, partial: 0 },
  idx_portfolio_holdings_symbol: { table: 'portfolio_holdings', unique: 0, partial: 0 },
  idx_audit_events_subject: { table: 'audit_events', unique: 0, partial: 0 },
  idx_audit_events_entry_checksum: { table: 'audit_events', unique: 0, partial: 0 },
  idx_local_principal_bindings_single_active: {
    table: 'local_principal_bindings',
    unique: 1,
    partial: 1,
  },
  idx_local_principal_memberships_single_active: {
    table: 'local_principal_memberships',
    unique: 1,
    partial: 1,
  },
  idx_local_principal_memberships_binding: {
    table: 'local_principal_memberships',
    unique: 0,
    partial: 0,
  },
};

const EXPECTED_FOREIGN_KEYS: readonly ExpectedForeignKeySpec[] = [
  {
    fromTable: 'portfolio_revisions',
    toTable: 'portfolios',
    columnPairs: [
      ['canonical_owner_id', 'canonical_owner_id'],
      ['portfolio_id', 'portfolio_id'],
    ],
  },
  {
    fromTable: 'portfolio_holdings',
    toTable: 'portfolio_revisions',
    columnPairs: [
      ['canonical_owner_id', 'canonical_owner_id'],
      ['portfolio_id', 'portfolio_id'],
      ['revision', 'revision'],
    ],
  },
  {
    fromTable: 'portfolio_contributions',
    toTable: 'portfolios',
    columnPairs: [
      ['canonical_owner_id', 'canonical_owner_id'],
      ['portfolio_id', 'portfolio_id'],
    ],
  },
  {
    fromTable: 'local_principal_memberships',
    toTable: 'local_principal_bindings',
    columnPairs: [['binding_id', 'binding_id']],
  },
];

const EXPECTED_TABLE_CHECK_FRAGMENTS: Readonly<Record<string, readonly string[]>> = {
  portfolios: ["CHECK (status IN ('ACTIVE', 'TOMBSTONED'))"],
  portfolio_revisions: [
    "CHECK (operation IN ('INITIAL', 'MERGE', 'REPLACE', 'RESET', 'DELETE'))",
  ],
  local_principal_bindings: ["CHECK (status IN ('ACTIVE', 'REVOKED'))"],
  local_principal_memberships: ["CHECK (status IN ('ACTIVE', 'REVOKED'))"],
  portfolio_contributions: [
    "CHECK (contribution_semantics IS NULL OR contribution_semantics IN ('SAVED_NEW_BATCH', 'MERGED_INTO_EXISTING', 'RESET', 'REPLACE'))",
  ],
};

function isIso8601Timestamp(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 20) return false;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }
  return Number.isFinite(Date.parse(value));
}

function sha256File(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function inspectExistingFileHeader(filePath: string): {
  sizeBytes: number;
  isSqliteHeader: boolean;
} {
  const stat = lstatSync(filePath);
  if (stat.size < SQLITE_MINIMUM_HEADER_BYTES) {
    return { sizeBytes: stat.size, isSqliteHeader: false };
  }
  const headerBuf = Buffer.alloc(SQLITE_HEADER_MAGIC.length);
  const fd = openSync(filePath, 'r');
  try {
    const bytesRead = readSync(fd, headerBuf, 0, headerBuf.length, 0);
    return {
      sizeBytes: stat.size,
      isSqliteHeader:
        bytesRead === SQLITE_HEADER_MAGIC.length &&
        headerBuf.toString('latin1') === SQLITE_HEADER_MAGIC,
    };
  } finally {
    closeSync(fd);
  }
}

function isInsideGitWorktree(candidatePath: string): boolean {
  let cursor = resolve(dirname(candidatePath));
  for (;;) {
    if (existsSync(join(cursor, '.git'))) return true;
    const parent = dirname(cursor);
    if (parent === cursor) return false;
    cursor = parent;
  }
}

function ancestorDirectories(targetDir: string, platform: NodeJS.Platform): string[] {
  const pathImpl = platform === 'win32' ? win32Path : posixPath;
  const resolved = pathImpl.resolve(targetDir);
  const chain: string[] = [];
  let cursor = resolved;
  for (;;) {
    chain.push(cursor);
    const parent = pathImpl.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  chain.reverse();
  return chain;
}

/**
 * Step 1: Validate Node runtime, built-in `node:sqlite`, ordered migration
 * definitions (`001`..`004`), and PA-determined S1 identity constants.
 */
export function validateRuntimeAndDependencies(options?: {
  nodeVersion?: string;
}): RuntimeDependencyReport {
  const nodeVersion = options?.nodeVersion ?? process.versions.node;
  const minimumNodeVersion = `${MINIMUM_NODE_MAJOR}.${MINIMUM_NODE_MINOR}.${MINIMUM_NODE_PATCH}`;

  try {
    assertSupportedRuntime(nodeVersion);
  } catch (err) {
    if (err instanceof RuntimeUnsupportedError) {
      throw new DirectProvisioningError('RUNTIME_UNSUPPORTED', err.message, {
        nodeVersion,
        minimumNodeVersion,
      });
    }
    throw err;
  }

  let sqliteVersion = '';
  let foreignKeysPragmaSupported = false;
  let probeDb: DatabaseSync | undefined;
  try {
    probeDb = new DatabaseSync(':memory:');
    probeDb.exec('PRAGMA foreign_keys = ON;');
    const fkRow = probeDb.prepare('PRAGMA foreign_keys').get() as
      | { foreign_keys: number }
      | undefined;
    foreignKeysPragmaSupported = fkRow?.foreign_keys === 1;
    const versionRow = probeDb
      .prepare('SELECT sqlite_version() AS version')
      .get() as { version: string } | undefined;
    sqliteVersion = versionRow?.version ?? '';
  } catch (err) {
    throw new DirectProvisioningError(
      'SQLITE_DEPENDENCY_UNAVAILABLE',
      `Built-in node:sqlite probe failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    probeDb?.close();
  }

  if (!sqliteVersion || !foreignKeysPragmaSupported) {
    throw new DirectProvisioningError(
      'SQLITE_DEPENDENCY_UNAVAILABLE',
      'node:sqlite did not report a valid SQLite version or foreign_keys=ON support.',
      { sqliteVersion, foreignKeysPragmaSupported },
    );
  }

  if (GATE3_MIGRATIONS.length !== EXPECTED_MIGRATION_IDS.length) {
    throw new DirectProvisioningError(
      'MIGRATION_DEFINITION_INVALID',
      `Expected ${EXPECTED_MIGRATION_IDS.length} ordered migrations, found ${GATE3_MIGRATIONS.length}.`,
    );
  }

  const migrationIds: string[] = [];
  const migrationChecksums: Record<string, string> = {};
  for (let i = 0; i < EXPECTED_MIGRATION_IDS.length; i += 1) {
    const migration = GATE3_MIGRATIONS[i];
    const expectedId = EXPECTED_MIGRATION_IDS[i];
    if (!migration || migration.id !== expectedId || !migration.sql.trim()) {
      throw new DirectProvisioningError(
        'MIGRATION_DEFINITION_INVALID',
        `Migration at index ${i} did not match expected id ${expectedId}.`,
      );
    }
    migrationIds.push(migration.id);
    migrationChecksums[migration.id] = migrationChecksum(migration);
  }

  const identity = resolveDesignatedIdentityTriple();

  return {
    nodeVersion,
    minimumNodeVersion,
    sqliteVersion,
    foreignKeysPragmaSupported,
    migrationIds,
    migrationChecksums,
    principalLabel: identity.principalLabel,
    tenantId: identity.tenantId,
    canonicalOwnerId: identity.canonicalOwnerId,
    bindingId: identity.bindingId,
    membershipId: identity.membershipId,
  };
}

/**
 * Step 2: Validate the target database path before any directory or file
 * creation occurs.
 */
export function validateDatabaseDestination(
  rawStorePath: string,
  options?: { platform?: NodeJS.Platform },
): DestinationValidationReport {
  const platform = options?.platform ?? process.platform;
  if (typeof rawStorePath !== 'string' || rawStorePath.trim().length === 0) {
    throw new DirectProvisioningError(
      'STORE_PATH_INVALID',
      'Database destination path must be a non-empty filesystem path.',
    );
  }
  if (rawStorePath.includes('\0')) {
    throw new DirectProvisioningError(
      'STORE_PATH_INVALID',
      'Database destination path must not contain NUL bytes.',
    );
  }
  if (rawStorePath === ':memory:' || rawStorePath.includes('://')) {
    throw new DirectProvisioningError(
      'STORE_PATH_INVALID',
      `Database destination path must be a local file path, not "${rawStorePath}".`,
    );
  }
  if (/(?:^|[\\/])\.\.(?:[\\/]|$)/.test(rawStorePath)) {
    throw new DirectProvisioningError(
      'STORE_PATH_INVALID',
      `Database destination path must not contain ".." traversal segments: "${rawStorePath}".`,
    );
  }
  if (rawStorePath.endsWith('/') || rawStorePath.endsWith('\\')) {
    throw new DirectProvisioningError(
      'STORE_PATH_INVALID',
      `Database destination path must name a file, not a directory: "${rawStorePath}".`,
    );
  }

  let normalizedPath: string;
  let parentDirectory: string;

  if (platform === 'win32') {
    if (rawStorePath.startsWith('\\\\')) {
      throw new DirectProvisioningError(
        'STORE_PATH_INVALID',
        `UNC, device, and named-pipe paths are not valid SQLite file destinations: "${rawStorePath}".`,
      );
    }
    if (!/^[A-Za-z]:[\\/]/.test(rawStorePath)) {
      throw new DirectProvisioningError(
        'STORE_PATH_INVALID',
        `Windows database destination must be a drive-qualified absolute path (e.g. C:\\iips-data\\iips\\user-portfolio.sqlite): "${rawStorePath}".`,
      );
    }
    const afterDrive = rawStorePath.slice(2);
    if (/[<>:"|?*\r\n]/.test(afterDrive)) {
      throw new DirectProvisioningError(
        'STORE_PATH_INVALID',
        `Windows database destination contains illegal filename characters: "${rawStorePath}".`,
      );
    }
    normalizedPath = win32Path.normalize(rawStorePath);
    parentDirectory = win32Path.dirname(normalizedPath);
    const base = win32Path.basename(normalizedPath);
    if (!base || base === '.' || base === '..' || normalizedPath === parentDirectory) {
      throw new DirectProvisioningError(
        'STORE_PATH_INVALID',
        `Windows database destination must include a file name: "${rawStorePath}".`,
      );
    }
  } else {
    if (!posixPath.isAbsolute(rawStorePath)) {
      throw new DirectProvisioningError(
        'STORE_PATH_INVALID',
        `Database destination must be an absolute path: "${rawStorePath}".`,
      );
    }
    normalizedPath = posixPath.normalize(rawStorePath);
    parentDirectory = posixPath.dirname(normalizedPath);
    const base = posixPath.basename(normalizedPath);
    if (!base || base === '.' || base === '..' || normalizedPath === '/') {
      throw new DirectProvisioningError(
        'STORE_PATH_INVALID',
        `Database destination must include a file name: "${rawStorePath}".`,
      );
    }
  }

  if (platform !== process.platform) {
    return {
      storePath: normalizedPath,
      parentDirectory,
      platform,
      exists: false,
      sizeBytes: null,
      outsideGitWorktree: true,
    };
  }

  if (isInsideGitWorktree(normalizedPath)) {
    throw new DirectProvisioningError(
      'STORE_PATH_IN_GIT_WORKTREE',
      `Database destination "${normalizedPath}" lies inside a Git worktree; durable user data must live outside any repository checkout.`,
    );
  }

  for (const dirSegment of ancestorDirectories(parentDirectory, platform)) {
    let segStat;
    try {
      segStat = lstatSync(dirSegment);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        continue;
      }
      throw err;
    }
    if (segStat.isSymbolicLink()) {
      throw new DirectProvisioningError(
        'STORE_PATH_SYMLINK_UNSUPPORTED',
        `Ancestor path "${dirSegment}" is a symbolic link or reparse point; refusing unsafe store destination.`,
      );
    }
    if (!segStat.isDirectory()) {
      throw new DirectProvisioningError(
        'STORE_PARENT_NOT_DIRECTORY',
        `Ancestor path "${dirSegment}" exists and is not a directory.`,
      );
    }
  }

  let targetStat;
  try {
    targetStat = lstatSync(normalizedPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        storePath: normalizedPath,
        parentDirectory,
        platform,
        exists: false,
        sizeBytes: null,
        outsideGitWorktree: true,
      };
    }
    throw err;
  }

  if (targetStat.isSymbolicLink()) {
    throw new DirectProvisioningError(
      'STORE_PATH_SYMLINK_UNSUPPORTED',
      `Database destination "${normalizedPath}" is a symbolic link or reparse point; refusing unsafe target.`,
    );
  }
  if (!targetStat.isFile()) {
    throw new DirectProvisioningError(
      'EXISTING_PATH_NOT_REGULAR_FILE',
      `Existing path "${normalizedPath}" is not a regular file; refusing to touch it.`,
    );
  }

  return {
    storePath: normalizedPath,
    parentDirectory,
    platform,
    exists: true,
    sizeBytes: targetStat.size,
    outsideGitWorktree: true,
  };
}

/**
 * Strictly read-only verification of an existing user-portfolio SQLite database:
 * validates migration ledger, all tables & column schemas, explicit & partial-unique
 * indexes, foreign-key & CHECK constraints, `PRAGMA integrity_check`, initial
 * binding/membership records, hash-chained `audit_events`, single-ACTIVE binding
 * resolution, portfolio table accessibility, and W-1 write-guard enforcement.
 */
export function verifyUserPortfolioDatabase(
  rawStorePath?: string,
  options?: {
    expectFreshProvisioning?: boolean;
    platform?: NodeJS.Platform;
  },
): VerificationResult {
  const effectivePath =
    rawStorePath ??
    (process.platform === 'win32' ? DESIGNATED_USER_PORTFOLIO_DB_PATH : '');

  const identity = resolveDesignatedIdentityTriple();

  let destination: DestinationValidationReport;
  try {
    destination = validateDatabaseDestination(effectivePath, {
      platform: options?.platform,
    });
  } catch (err) {
    const dpErr =
      err instanceof DirectProvisioningError
        ? err
        : new DirectProvisioningError(
            'STORE_PATH_INVALID',
            err instanceof Error ? err.message : String(err),
          );
    return {
      ok: false,
      status: 'VERIFICATION_FAILED',
      mode: 'verify',
      authorityId: DIRECT_PROVISIONING_AUTHORITY_ID,
      storePath: effectivePath,
      fileSizeBytes: 0,
      fileSha256: '',
      checks: [],
      schema: null,
      provisioning: null,
      errorCode: dpErr.code,
      errorMessage: dpErr.message,
    };
  }

  const { storePath } = destination;
  if (!destination.exists) {
    return {
      ok: false,
      status: 'VERIFICATION_FAILED',
      mode: 'verify',
      authorityId: DIRECT_PROVISIONING_AUTHORITY_ID,
      storePath,
      fileSizeBytes: 0,
      fileSha256: '',
      checks: [
        {
          checkId: 'DP-V0',
          name: 'database_file_present',
          passed: false,
          detail: `No database file exists at "${storePath}".`,
        },
      ],
      schema: null,
      provisioning: null,
      errorCode: 'STORE_MISSING',
      errorMessage: `STORE_MISSING: No database file exists at "${storePath}".`,
    };
  }

  const preSha256 = sha256File(storePath);
  const headerInfo = inspectExistingFileHeader(storePath);
  if (!headerInfo.isSqliteHeader) {
    return {
      ok: false,
      status: 'VERIFICATION_FAILED',
      mode: 'verify',
      authorityId: DIRECT_PROVISIONING_AUTHORITY_ID,
      storePath,
      fileSizeBytes: headerInfo.sizeBytes,
      fileSha256: preSha256,
      checks: [
        {
          checkId: 'DP-V0',
          name: 'sqlite_header_magic',
          passed: false,
          detail:
            headerInfo.sizeBytes === 0
              ? 'Existing file is 0 bytes (empty file, not an initialized SQLite database).'
              : `Existing file (${headerInfo.sizeBytes} bytes) does not have a valid SQLite 3 header.`,
        },
      ],
      schema: null,
      provisioning: null,
      errorCode: 'VERIFICATION_FAILED',
      errorMessage: `VERIFICATION_FAILED: "${storePath}" is not a valid SQLite 3 database file.`,
    };
  }

  const checks: DirectProvisioningCheck[] = [];
  let schemaSummary: SchemaVerificationSummary | null = null;
  let provisioningSummary: ProvisioningRecordSummary | null = null;

  let db: DatabaseSync | undefined;
  try {
    db = new DatabaseSync(storePath, { readOnly: true });

    // DP-V1: Migration ledger table DDL + ordered 001..004 checksums.
    let appliedMigrations: Array<{
      migrationId: string;
      checksum: string;
      appliedAt: string;
    }> = [];
    {
      const ledgerMaster = db
        .prepare(
          `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = '_migration_ledger'`,
        )
        .get() as { sql: string | null } | undefined;
      const ddl = ledgerMaster?.sql ?? '';
      const hasWithoutRowid = /WITHOUT\s+ROWID/i.test(ddl);
      const ledgerRows = ledgerMaster
        ? (db
            .prepare(
              'SELECT migration_id, checksum, applied_at FROM _migration_ledger ORDER BY migration_id',
            )
            .all() as Array<{
            migration_id: string;
            checksum: string;
            applied_at: string;
          }>)
        : [];
      const mismatches: string[] = [];

      if (!ledgerMaster) {
        mismatches.push('_migration_ledger table is missing');
      } else if (!hasWithoutRowid) {
        mismatches.push('_migration_ledger is missing WITHOUT ROWID');
      }

      if (ledgerRows.length !== GATE3_MIGRATIONS.length) {
        mismatches.push(
          `expected ${GATE3_MIGRATIONS.length} ledger rows, found ${ledgerRows.length}`,
        );
      }

      for (let i = 0; i < GATE3_MIGRATIONS.length; i += 1) {
        const expected = GATE3_MIGRATIONS[i];
        const row = ledgerRows[i];
        if (!row) continue;
        const expectedChecksum = migrationChecksum(expected);
        if (row.migration_id !== expected.id) {
          mismatches.push(
            `index ${i} expected ${expected.id}, found ${row.migration_id}`,
          );
        }
        if (row.checksum !== expectedChecksum) {
          mismatches.push(
            `checksum mismatch on ${expected.id}: expected ${expectedChecksum}, found ${row.checksum}`,
          );
        }
        if (!isIso8601Timestamp(row.applied_at)) {
          mismatches.push(
            `invalid ISO-8601 applied_at on ${row.migration_id}: ${row.applied_at}`,
          );
        }
      }

      appliedMigrations = ledgerRows.map((r) => ({
        migrationId: r.migration_id,
        checksum: r.checksum,
        appliedAt: r.applied_at,
      }));

      checks.push({
        checkId: 'DP-V1',
        name: 'migration_ledger',
        passed: mismatches.length === 0,
        detail:
          mismatches.length === 0
            ? `Verified ${ledgerRows.length} ordered migrations (001..004) with SHA-256 checksums and WITHOUT ROWID ledger.`
            : mismatches.join('; '),
      });
    }

    // DP-V2: Required application tables and exact column definitions.
    let actualTables: string[] = [];
    {
      const tableRows = db
        .prepare(
          `SELECT name FROM sqlite_master
            WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name ASC`,
        )
        .all() as Array<{ name: string }>;
      actualTables = tableRows.map((r) => r.name);
      const expectedTableNames = Object.keys(EXPECTED_TABLE_COLUMNS).sort();
      const issues: string[] = [];

      for (const expectedName of expectedTableNames) {
        if (!actualTables.includes(expectedName)) {
          issues.push(`missing table ${expectedName}`);
          continue;
        }
        const cols = db.prepare(`PRAGMA table_info(${expectedName})`).all() as Array<{
          cid: number;
          name: string;
          type: string;
          notnull: number;
          pk: number;
        }>;
        const expectedCols = EXPECTED_TABLE_COLUMNS[expectedName];
        if (cols.length !== expectedCols.length) {
          issues.push(
            `table ${expectedName} column count ${cols.length} !== expected ${expectedCols.length}`,
          );
          continue;
        }
        for (let i = 0; i < expectedCols.length; i += 1) {
          const exp = expectedCols[i];
          const got = cols[i];
          if (
            got.name !== exp.name ||
            got.type.toUpperCase() !== exp.type ||
            got.notnull !== exp.notnull ||
            got.pk !== exp.pk
          ) {
            issues.push(
              `table ${expectedName} column[${i}] mismatch: got (${got.name}, ${got.type}, notnull=${got.notnull}, pk=${got.pk}), expected (${exp.name}, ${exp.type}, notnull=${exp.notnull}, pk=${exp.pk})`,
            );
          }
        }
      }

      for (const actualName of actualTables) {
        if (!(actualName in EXPECTED_TABLE_COLUMNS)) {
          issues.push(`unexpected table ${actualName}`);
        }
      }

      checks.push({
        checkId: 'DP-V2',
        name: 'tables_and_columns',
        passed: issues.length === 0,
        detail:
          issues.length === 0
            ? `Verified all ${expectedTableNames.length} required tables and column definitions.`
            : issues.join('; '),
      });
    }

    // DP-V3: Explicit indexes and partial-unique single-ACTIVE indexes.
    let explicitIndexes: string[] = [];
    {
      const indexRows = db
        .prepare(
          `SELECT name, tbl_name, sql FROM sqlite_master
            WHERE type = 'index' AND name NOT LIKE 'sqlite_autoindex_%'
            ORDER BY name ASC`,
        )
        .all() as Array<{ name: string; tbl_name: string; sql: string | null }>;
      explicitIndexes = indexRows.map((r) => r.name);
      const issues: string[] = [];

      for (const [idxName, spec] of Object.entries(EXPECTED_EXPLICIT_INDEXES)) {
        const masterRow = indexRows.find((r) => r.name === idxName);
        if (!masterRow) {
          issues.push(`missing index ${idxName}`);
          continue;
        }
        if (masterRow.tbl_name !== spec.table) {
          issues.push(
            `index ${idxName} attached to ${masterRow.tbl_name}, expected ${spec.table}`,
          );
          continue;
        }
        const tableIndexes = db
          .prepare(`PRAGMA index_list(${spec.table})`)
          .all() as Array<{
          name: string;
          unique: number;
          partial: number;
        }>;
        const meta = tableIndexes.find((r) => r.name === idxName);
        if (!meta) {
          issues.push(`PRAGMA index_list(${spec.table}) missing ${idxName}`);
          continue;
        }
        if (meta.unique !== spec.unique || meta.partial !== spec.partial) {
          issues.push(
            `index ${idxName} flags (unique=${meta.unique}, partial=${meta.partial}) !== expected (unique=${spec.unique}, partial=${spec.partial})`,
          );
        }
        if (spec.partial === 1 && !/WHERE\s+status\s*=\s*'ACTIVE'/i.test(masterRow.sql ?? '')) {
          issues.push(`partial unique index ${idxName} missing WHERE status = 'ACTIVE'`);
        }
      }

      for (const actualIdx of explicitIndexes) {
        if (!(actualIdx in EXPECTED_EXPLICIT_INDEXES)) {
          issues.push(`unexpected index ${actualIdx}`);
        }
      }

      checks.push({
        checkId: 'DP-V3',
        name: 'indexes',
        passed: issues.length === 0,
        detail:
          issues.length === 0
            ? `Verified all ${Object.keys(EXPECTED_EXPLICIT_INDEXES).length} explicit indexes including partial-unique single-ACTIVE indexes.`
            : issues.join('; '),
      });
    }

    // DP-V4: PRAGMA integrity_check, foreign_key_check, foreign_key_list & CHECK constraints.
    let integrityCheckResult = 'unknown';
    let fkViolationCount = -1;
    {
      const issues: string[] = [];
      const integrityRows = db.prepare('PRAGMA integrity_check').all() as Array<{
        integrity_check: string;
      }>;
      integrityCheckResult =
        integrityRows.length === 1
          ? integrityRows[0].integrity_check
          : JSON.stringify(integrityRows);
      if (integrityRows.length !== 1 || integrityRows[0].integrity_check !== 'ok') {
        issues.push(`PRAGMA integrity_check returned ${integrityCheckResult}`);
      }

      const fkViolations = db.prepare('PRAGMA foreign_key_check').all();
      fkViolationCount = fkViolations.length;
      if (fkViolationCount !== 0) {
        issues.push(`PRAGMA foreign_key_check reported ${fkViolationCount} violation(s)`);
      }

      for (const fkSpec of EXPECTED_FOREIGN_KEYS) {
        if (!actualTables.includes(fkSpec.fromTable)) {
          issues.push(`cannot inspect foreign keys on missing table ${fkSpec.fromTable}`);
          continue;
        }
        const fkRows = db
          .prepare(`PRAGMA foreign_key_list(${fkSpec.fromTable})`)
          .all() as Array<{ table: string; from: string; to: string }>;
        for (const [fromCol, toCol] of fkSpec.columnPairs) {
          const found = fkRows.some(
            (r) => r.table === fkSpec.toTable && r.from === fromCol && r.to === toCol,
          );
          if (!found) {
            issues.push(
              `missing foreign key ${fkSpec.fromTable}.${fromCol} -> ${fkSpec.toTable}.${toCol}`,
            );
          }
        }
      }

      for (const [tableName, fragments] of Object.entries(EXPECTED_TABLE_CHECK_FRAGMENTS)) {
        const ddlRow = db
          .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`)
          .get(tableName) as { sql: string | null } | undefined;
        const normalizedSql = (ddlRow?.sql ?? '').replace(/\s+/g, ' ');
        for (const fragment of fragments) {
          if (!normalizedSql.includes(fragment)) {
            issues.push(`table ${tableName} missing constraint: ${fragment}`);
          }
        }
      }

      checks.push({
        checkId: 'DP-V4',
        name: 'constraints_and_integrity',
        passed: issues.length === 0,
        detail:
          issues.length === 0
            ? 'PRAGMA integrity_check=ok, foreign_key_check=0 violations, and all FK + CHECK constraints verified.'
            : issues.join('; '),
      });
    }

    // DP-V5: Initial principal binding record.
    let verifiedBindingRow:
      | {
          binding_id: string;
          principal_label: string;
          status: string;
          created_at: string;
          updated_at: string;
          revoked_at: string | null;
        }
      | undefined;

    {
      const issues: string[] = [];
      if (!actualTables.includes('local_principal_bindings')) {
        issues.push('local_principal_bindings table missing');
      } else {
        const rows = db
          .prepare(
            `SELECT binding_id, principal_label, status, created_at, updated_at, revoked_at
               FROM local_principal_bindings`,
          )
          .all() as Array<{
          binding_id: string;
          principal_label: string;
          status: string;
          created_at: string;
          updated_at: string;
          revoked_at: string | null;
        }>;
        const activeRows = rows.filter((r) => r.status === 'ACTIVE');
        if (options?.expectFreshProvisioning && rows.length !== 1) {
          issues.push(`expected exactly 1 binding row on fresh store, found ${rows.length}`);
        }
        if (activeRows.length !== 1) {
          issues.push(`expected exactly 1 ACTIVE binding row, found ${activeRows.length}`);
        } else {
          const active = activeRows[0];
          verifiedBindingRow = active;
          if (active.principal_label !== identity.principalLabel) {
            issues.push(
              `principal_label "${active.principal_label}" !== expected "${identity.principalLabel}"`,
            );
          }
          if (active.binding_id !== identity.bindingId) {
            issues.push(
              `binding_id "${active.binding_id}" !== expected "${identity.bindingId}"`,
            );
          }
          if (active.revoked_at !== null) {
            issues.push(`ACTIVE binding has non-null revoked_at "${active.revoked_at}"`);
          }
          if (!isIso8601Timestamp(active.created_at) || !isIso8601Timestamp(active.updated_at)) {
            issues.push('binding timestamps are not valid ISO-8601 strings');
          }
        }
      }

      checks.push({
        checkId: 'DP-V5',
        name: 'initial_principal_binding',
        passed: issues.length === 0,
        detail:
          issues.length === 0
            ? `Verified ACTIVE local_principal_bindings record (${identity.principalLabel} -> ${identity.bindingId}).`
            : issues.join('; '),
      });
    }

    // DP-V6: Initial principal membership record.
    let verifiedMembershipRow:
      | {
          membership_id: string;
          binding_id: string;
          tenant_id: string;
          canonical_owner_id: string;
          status: string;
          created_at: string;
          updated_at: string;
          revoked_at: string | null;
        }
      | undefined;

    {
      const issues: string[] = [];
      if (!actualTables.includes('local_principal_memberships')) {
        issues.push('local_principal_memberships table missing');
      } else {
        const rows = db
          .prepare(
            `SELECT membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at
               FROM local_principal_memberships`,
          )
          .all() as Array<{
          membership_id: string;
          binding_id: string;
          tenant_id: string;
          canonical_owner_id: string;
          status: string;
          created_at: string;
          updated_at: string;
          revoked_at: string | null;
        }>;
        const activeRows = rows.filter((r) => r.status === 'ACTIVE');
        if (options?.expectFreshProvisioning && rows.length !== 1) {
          issues.push(
            `expected exactly 1 membership row on fresh store, found ${rows.length}`,
          );
        }
        if (activeRows.length !== 1) {
          issues.push(`expected exactly 1 ACTIVE membership row, found ${activeRows.length}`);
        } else {
          const active = activeRows[0];
          verifiedMembershipRow = active;
          if (active.binding_id !== identity.bindingId) {
            issues.push(
              `membership binding_id "${active.binding_id}" !== expected "${identity.bindingId}"`,
            );
          }
          if (active.tenant_id !== identity.tenantId) {
            issues.push(`tenant_id "${active.tenant_id}" !== expected "${identity.tenantId}"`);
          }
          if (active.canonical_owner_id !== identity.canonicalOwnerId) {
            issues.push(
              `canonical_owner_id "${active.canonical_owner_id}" !== expected "${identity.canonicalOwnerId}"`,
            );
          }
          if (active.membership_id !== identity.membershipId) {
            issues.push(
              `membership_id "${active.membership_id}" !== expected "${identity.membershipId}"`,
            );
          }
          if (active.revoked_at !== null) {
            issues.push(`ACTIVE membership has non-null revoked_at "${active.revoked_at}"`);
          }
          if (!isIso8601Timestamp(active.created_at) || !isIso8601Timestamp(active.updated_at)) {
            issues.push('membership timestamps are not valid ISO-8601 strings');
          }
        }
      }

      checks.push({
        checkId: 'DP-V6',
        name: 'initial_principal_membership',
        passed: issues.length === 0,
        detail:
          issues.length === 0
            ? `Verified ACTIVE local_principal_memberships record (${identity.tenantId}/${identity.canonicalOwnerId} -> ${identity.membershipId}).`
            : issues.join('; '),
      });
    }

    // DP-V7: Hash-chained audit_events ledger and genesis provisioning event.
    let auditEventCount = 0;
    let auditChainValid = false;
    let initialAuditId = 0;
    let initialAuditChecksum = '';
    {
      const issues: string[] = [];
      if (!actualTables.includes('audit_events')) {
        issues.push('audit_events table missing');
      } else {
        try {
          auditChainValid = verifyAuditChain(db);
          if (!auditChainValid) {
            issues.push('verifyAuditChain returned false');
          }
        } catch (err) {
          issues.push(
            `verifyAuditChain failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }

        const events = readAuditEvents(db);
        auditEventCount = events.length;
        if (options?.expectFreshProvisioning && events.length !== 1) {
          issues.push(`expected 1 audit event on fresh store, found ${events.length}`);
        } else if (events.length < 1) {
          issues.push('audit_events contains 0 rows; initial provisioning event is missing');
        }

        const genesis = events[0];
        if (genesis) {
          initialAuditId = genesis.id;
          initialAuditChecksum = genesis.entryChecksum;
          const detail = genesis.detail as Record<string, unknown> | null;
          if (genesis.id !== 1) {
            issues.push(`genesis audit event id=${genesis.id} !== 1`);
          }
          if (genesis.prevChecksum !== AUDIT_GENESIS) {
            issues.push(`genesis prev_checksum="${genesis.prevChecksum}" !== "${AUDIT_GENESIS}"`);
          }
          if (genesis.eventType !== 'local_principal_binding.provisioned') {
            issues.push(
              `genesis event_type="${genesis.eventType}" !== "local_principal_binding.provisioned"`,
            );
          }
          if (genesis.subjectType !== 'local_principal_binding') {
            issues.push(
              `genesis subject_type="${genesis.subjectType}" !== "local_principal_binding"`,
            );
          }
          if (genesis.subjectId !== identity.principalLabel) {
            issues.push(
              `genesis subject_id="${genesis.subjectId}" !== "${identity.principalLabel}"`,
            );
          }
          if (
            !detail ||
            detail.tenantId !== identity.tenantId ||
            detail.canonicalOwnerId !== identity.canonicalOwnerId
          ) {
            issues.push('genesis audit detail_json did not match designated tenant/owner');
          }
          if (!isIso8601Timestamp(genesis.createdAt)) {
            issues.push(`genesis created_at is not valid ISO-8601: ${genesis.createdAt}`);
          }
        }
      }

      checks.push({
        checkId: 'DP-V7',
        name: 'audit_chain_and_provisioning_event',
        passed: issues.length === 0,
        detail:
          issues.length === 0
            ? `Verified hash-chained audit_events (${auditEventCount} event(s), genesis checksum ${initialAuditChecksum}).`
            : issues.join('; '),
      });
    }

    // DP-V8: Live transactional ACTIVE binding resolution (`resolveActiveBindingInCurrentTransaction`).
    {
      const issues: string[] = [];
      try {
        db.exec('BEGIN;');
        try {
          const resolved = resolveActiveBindingInCurrentTransaction(db);
          if (
            resolved.bindingId !== identity.bindingId ||
            resolved.principalLabel !== identity.principalLabel ||
            resolved.membershipId !== identity.membershipId ||
            resolved.tenantId !== identity.tenantId ||
            resolved.canonicalOwnerId !== identity.canonicalOwnerId
          ) {
            issues.push(`resolved binding mismatch: ${JSON.stringify(resolved)}`);
          }
        } finally {
          if (db.isTransaction) db.exec('COMMIT;');
        }
      } catch (err) {
        issues.push(
          `resolveActiveBindingInCurrentTransaction failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      checks.push({
        checkId: 'DP-V8',
        name: 'active_binding_resolution',
        passed: issues.length === 0,
        detail:
          issues.length === 0
            ? 'resolveActiveBindingInCurrentTransaction resolved exact single-ACTIVE owner context.'
            : issues.join('; '),
      });
    }

    // DP-V9: Portfolio tables accessible & W-1 write guard active.
    let portfolioCounts = {
      portfolios: 0,
      portfolioRevisions: 0,
      portfolioHoldings: 0,
      portfolioContributions: 0,
    };
    let writeGuardEnforced = false;
    {
      const issues: string[] = [];
      const countTable = (tableName: string): number => {
        if (!actualTables.includes(tableName)) {
          issues.push(`missing portfolio table ${tableName}`);
          return -1;
        }
        const row = db!.prepare(`SELECT COUNT(*) AS n FROM ${tableName}`).get() as {
          n: number;
        };
        return row.n;
      };

      portfolioCounts = {
        portfolios: countTable('portfolios'),
        portfolioRevisions: countTable('portfolio_revisions'),
        portfolioHoldings: countTable('portfolio_holdings'),
        portfolioContributions: countTable('portfolio_contributions'),
      };

      if (options?.expectFreshProvisioning) {
        for (const [k, v] of Object.entries(portfolioCounts)) {
          if (v !== 0) {
            issues.push(`expected 0 rows in ${k} on fresh provisioning, found ${v}`);
          }
        }
      }

      const guard = evaluatePortSaveGuard();
      writeGuardEnforced = guard.authorized === false;
      if (!writeGuardEnforced) {
        issues.push('W-1 Port.save write guard failed to report authorized=false');
      }

      checks.push({
        checkId: 'DP-V9',
        name: 'portfolio_tables_and_write_guard',
        passed: issues.length === 0,
        detail:
          issues.length === 0
            ? `Portfolio tables readable (portfolios=${portfolioCounts.portfolios}, revisions=${portfolioCounts.portfolioRevisions}, holdings=${portfolioCounts.portfolioHoldings}, contributions=${portfolioCounts.portfolioContributions}); W-1 write guard enforced.`
            : issues.join('; '),
      });
    }

    schemaSummary = {
      migrationCount: appliedMigrations.length,
      appliedMigrations,
      tables: actualTables,
      explicitIndexes,
      integrityCheck: integrityCheckResult,
      foreignKeyViolations: fkViolationCount,
      writeGuardEnforced,
    };

    if (verifiedBindingRow && verifiedMembershipRow) {
      provisioningSummary = {
        bindingId: verifiedBindingRow.binding_id,
        principalLabel: verifiedBindingRow.principal_label,
        bindingStatus: verifiedBindingRow.status,
        membershipId: verifiedMembershipRow.membership_id,
        tenantId: verifiedMembershipRow.tenant_id,
        canonicalOwnerId: verifiedMembershipRow.canonical_owner_id,
        membershipStatus: verifiedMembershipRow.status,
        auditEventCount,
        auditChainValid,
        initialAuditEventId: initialAuditId,
        initialAuditEventChecksum: initialAuditChecksum,
        portfolioCounts,
      };
    }
  } catch (err) {
    checks.push({
      checkId: 'DP-V-FATAL',
      name: 'sqlite_readonly_inspection',
      passed: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    db?.close();
  }

  const postSha256 = sha256File(storePath);
  const postSizeBytes = lstatSync(storePath).size;
  if (postSha256 !== preSha256) {
    checks.push({
      checkId: 'DP-V-IMMUTABILITY',
      name: 'readonly_byte_immutability',
      passed: false,
      detail: `Read-only verification altered file digest from ${preSha256} to ${postSha256}.`,
    });
  }

  const failedChecks = checks.filter((c) => !c.passed);
  const ok = checks.length > 0 && failedChecks.length === 0;

  return {
    ok,
    status: ok ? 'VERIFIED' : 'VERIFICATION_FAILED',
    mode: 'verify',
    authorityId: DIRECT_PROVISIONING_AUTHORITY_ID,
    storePath,
    fileSizeBytes: postSizeBytes,
    fileSha256: postSha256,
    checks,
    schema: schemaSummary,
    provisioning: provisioningSummary,
    ...(ok
      ? {}
      : {
          errorCode: 'VERIFICATION_FAILED' as const,
          errorMessage: `VERIFICATION_FAILED: ${failedChecks.map((c) => `[${c.checkId}] ${c.detail}`).join(' | ')}`,
        }),
  };
}

function verifyDirectoryWritable(parentDirectory: string): void {
  mkdirSync(parentDirectory, { recursive: true });
  const probeFile = join(
    parentDirectory,
    `.iips-write-probe-${process.pid}-${randomUUID().slice(0, 8)}.tmp`,
  );
  try {
    writeFileSync(probeFile, 'ok', { flag: 'wx' });
    unlinkSync(probeFile);
  } catch (err) {
    try {
      if (existsSync(probeFile)) unlinkSync(probeFile);
    } catch {
      // Ignore secondary cleanup error.
    }
    throw new DirectProvisioningError(
      'STORE_DIRECTORY_NOT_WRITABLE',
      `Parent directory "${parentDirectory}" is not writable under the current user account: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function provisionInitialRecordsInTransaction(
  db: DatabaseSync,
  identity: DesignatedIdentityTriple,
  nowFn: () => string,
  hooks?: ProvisioningTestHooks,
): void {
  const ts = nowFn();

  db.exec('BEGIN IMMEDIATE;');
  try {
    db.prepare(
      `INSERT INTO local_principal_bindings
        (binding_id, principal_label, status, created_at, updated_at, revoked_at)
       VALUES (?, ?, 'ACTIVE', ?, ?, NULL)`,
    ).run(identity.bindingId, identity.principalLabel, ts, ts);

    hooks?.afterBindingInserted?.(db);

    db.prepare(
      `INSERT INTO local_principal_memberships
        (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at)
       VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, NULL)`,
    ).run(
      identity.membershipId,
      identity.bindingId,
      identity.tenantId,
      identity.canonicalOwnerId,
      ts,
      ts,
    );

    hooks?.afterMembershipInserted?.(db);

    appendAuditEvent(db, {
      eventType: 'local_principal_binding.provisioned',
      subjectType: 'local_principal_binding',
      subjectId: identity.principalLabel,
      detail: {
        tenantId: identity.tenantId,
        canonicalOwnerId: identity.canonicalOwnerId,
      },
    });

    db.exec('COMMIT;');
  } catch (err) {
    if (db.isTransaction) {
      db.exec('ROLLBACK;');
    }
    throw err;
  }
}

/**
 * Provision the designated user-portfolio SQLite database directly and safely:
 *   - Validates runtime, `node:sqlite`, migrations, and destination path first.
 *   - Never overwrites or replaces an existing database:
 *       * If the file already exists and `--require-fresh` is false, inspects it
 *         strictly read-only: returns `ALREADY_PROVISIONED` (`mutated: false`)
 *         when valid (preserving any existing user portfolio rows untouched),
 *         or throws `EXISTING_DATABASE_PROTECTED` (`mutated: false`) when
 *         corrupt, unprovisioned, foreign, or mismatched.
 *       * If `--require-fresh` is true and the file exists, throws
 *         `EXISTING_DATABASE_PROTECTED` immediately (`mutated: false`).
 *   - On a fresh path, creates the parent directory if needed, opens SQLite,
 *     applies migrations `001`..`004` in order within transactions, inserts
 *     initial binding/membership/audit records atomically, closes the write
 *     handle, and executes full read-only post-provisioning verification.
 */
export function provisionUserPortfolioDatabase(
  options?: DirectProvisioningOptions,
): DirectProvisioningResult {
  const runtime = validateRuntimeAndDependencies({
    nodeVersion: options?.nodeVersion,
  });
  const identity = resolveDesignatedIdentityTriple();

  const requestedPath =
    options?.storePath ??
    ((options?.platform ?? process.platform) === 'win32'
      ? DESIGNATED_USER_PORTFOLIO_DB_PATH
      : '');

  const destination = validateDatabaseDestination(requestedPath, {
    platform: options?.platform,
  });
  const { storePath, parentDirectory } = destination;

  if (destination.exists) {
    const beforeSha256 = sha256File(storePath);
    const beforeSize = destination.sizeBytes ?? lstatSync(storePath).size;

    if (options?.requireFresh) {
      throw new DirectProvisioningError(
        'EXISTING_DATABASE_PROTECTED',
        `Existing file at "${storePath}" (${beforeSize} bytes) will not be overwritten (--require-fresh requested).`,
        {
          storePath,
          fileSizeBytes: beforeSize,
          fileSha256: beforeSha256,
          mutated: false,
        },
      );
    }

    const verification = verifyUserPortfolioDatabase(storePath, {
      expectFreshProvisioning: false,
      platform: options?.platform,
    });
    const afterSha256 = sha256File(storePath);

    if (afterSha256 !== beforeSha256) {
      throw new DirectProvisioningError(
        'VERIFICATION_FAILED',
        `Unexpected digest change while inspecting "${storePath}".`,
      );
    }

    if (!verification.ok || !verification.schema || !verification.provisioning) {
      throw new DirectProvisioningError(
        'EXISTING_DATABASE_PROTECTED',
        `Existing file at "${storePath}" is not a validly provisioned IPD user-portfolio database and is protected from overwrite (${verification.errorMessage ?? 'verification failed'}).`,
        {
          storePath,
          fileSizeBytes: beforeSize,
          fileSha256: beforeSha256,
          mutated: false,
          failedChecks: verification.checks.filter((c) => !c.passed),
        },
      );
    }

    return {
      ok: true,
      status: 'ALREADY_PROVISIONED',
      mode: 'provision',
      authorityId: DIRECT_PROVISIONING_AUTHORITY_ID,
      storePath,
      storeExistedBefore: true,
      mutated: false,
      fileSizeBytes: verification.fileSizeBytes,
      fileSha256: verification.fileSha256,
      runtime,
      checks: verification.checks,
      schema: verification.schema,
      provisioning: verification.provisioning,
    };
  }

  verifyDirectoryWritable(parentDirectory);

  if (existsSync(storePath)) {
    throw new DirectProvisioningError(
      'EXISTING_DATABASE_PROTECTED',
      `Target path "${storePath}" appeared concurrently before initialization; refusing to overwrite.`,
    );
  }

  const nowFn = options?.now ?? (() => new Date().toISOString());
  let handleOpened = false;
  try {
    const db = openDatabase(storePath, runtime.nodeVersion);
    handleOpened = true;
    try {
      ensureMigrations(db, GATE3_MIGRATIONS);
      options?.testHooks?.afterMigrationsApplied?.(db);
      provisionInitialRecordsInTransaction(db, identity, nowFn, options?.testHooks);
    } finally {
      closeDatabase();
    }
  } catch (err) {
    if (handleOpened) {
      for (const candidate of [
        storePath,
        `${storePath}-journal`,
        `${storePath}-wal`,
        `${storePath}-shm`,
      ]) {
        try {
          if (existsSync(candidate)) unlinkSync(candidate);
        } catch {
          // Best-effort cleanup of newly created incomplete database file.
        }
      }
    }
    if (err instanceof DirectProvisioningError) throw err;
    if (err instanceof DatabasePathError) {
      throw new DirectProvisioningError('STORE_PATH_INVALID', err.message);
    }
    if (err instanceof MigrationIntegrityError) {
      throw new DirectProvisioningError('PROVISIONING_TRANSACTION_FAILED', err.message);
    }
    throw new DirectProvisioningError(
      'PROVISIONING_TRANSACTION_FAILED',
      `Database provisioning rolled back safely after error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const verification = verifyUserPortfolioDatabase(storePath, {
    expectFreshProvisioning: true,
    platform: options?.platform,
  });

  if (!verification.ok || !verification.schema || !verification.provisioning) {
    throw new DirectProvisioningError(
      'VERIFICATION_FAILED',
      verification.errorMessage ?? 'Post-provisioning verification failed.',
      {
        storePath,
        failedChecks: verification.checks.filter((c) => !c.passed),
      },
    );
  }

  return {
    ok: true,
    status: 'PROVISIONED',
    mode: 'provision',
    authorityId: DIRECT_PROVISIONING_AUTHORITY_ID,
    storePath,
    storeExistedBefore: false,
    mutated: true,
    fileSizeBytes: verification.fileSizeBytes,
    fileSha256: verification.fileSha256,
    runtime,
    checks: verification.checks,
    schema: verification.schema,
    provisioning: verification.provisioning,
  };
}

export interface ParsedDirectProvisioningCliArgs {
  mode: DirectProvisioningMode;
  storePath: string;
  requireFresh: boolean;
  pretty: boolean;
}

function parseBooleanFlag(flagName: string, rawValue: string | undefined): boolean {
  if (rawValue === undefined || rawValue === 'true' || rawValue === '1') return true;
  if (rawValue === 'false' || rawValue === '0') return false;
  throw new DirectProvisioningError(
    'ARGUMENT_INVALID',
    `Invalid boolean value for ${flagName}: "${rawValue}". Expected true or false.`,
  );
}

export function parseDirectProvisioningArgs(
  argv: readonly string[],
  options?: { platform?: NodeJS.Platform },
): ParsedDirectProvisioningCliArgs {
  const platform = options?.platform ?? process.platform;
  let mode: DirectProvisioningMode = 'provision';
  let storePath: string | undefined;
  let requireFresh = false;
  let pretty = false;

  for (const arg of argv) {
    if (arg.startsWith('--mode=')) {
      const value = arg.slice('--mode='.length);
      if (value !== 'provision' && value !== 'verify') {
        throw new DirectProvisioningError(
          'ARGUMENT_INVALID',
          `Invalid --mode="${value}". Expected "provision" or "verify".`,
        );
      }
      mode = value;
      continue;
    }
    if (arg.startsWith('--store=')) {
      const value = arg.slice('--store='.length);
      if (!value) {
        throw new DirectProvisioningError(
          'ARGUMENT_INVALID',
          'Flag --store= requires a non-empty path value.',
        );
      }
      storePath = value;
      continue;
    }
    if (arg === '--require-fresh' || arg.startsWith('--require-fresh=')) {
      const value =
        arg === '--require-fresh' ? undefined : arg.slice('--require-fresh='.length);
      requireFresh = parseBooleanFlag('--require-fresh', value);
      continue;
    }
    if (arg === '--pretty' || arg.startsWith('--pretty=')) {
      const value = arg === '--pretty' ? undefined : arg.slice('--pretty='.length);
      pretty = parseBooleanFlag('--pretty', value);
      continue;
    }
    throw new DirectProvisioningError(
      'ARGUMENT_INVALID',
      `Unrecognized CLI argument: "${arg}". Supported flags: --mode=provision|verify, --store=<path>, --require-fresh, --pretty.`,
    );
  }

  const resolvedStorePath =
    storePath ?? (platform === 'win32' ? DESIGNATED_USER_PORTFOLIO_DB_PATH : '');
  if (!resolvedStorePath) {
    throw new DirectProvisioningError(
      'ARGUMENT_INVALID',
      'Flag --store=<absolute-path> is required on non-Windows platforms.',
    );
  }

  return {
    mode,
    storePath: resolvedStorePath,
    requireFresh,
    pretty,
  };
}

export function runDirectProvisioningCli(
  argv: readonly string[],
  options?: { platform?: NodeJS.Platform },
): {
  exitCode: 0 | 1;
  payload:
    | DirectProvisioningResult
    | VerificationResult
    | DirectProvisioningFailureReport;
  pretty: boolean;
} {
  let parsed: ParsedDirectProvisioningCliArgs | undefined;
  try {
    parsed = parseDirectProvisioningArgs(argv, options);
    if (parsed.mode === 'verify') {
      validateRuntimeAndDependencies();
      const verification = verifyUserPortfolioDatabase(parsed.storePath, {
        expectFreshProvisioning: parsed.requireFresh,
        platform: options?.platform,
      });
      return {
        exitCode: verification.ok ? 0 : 1,
        payload: verification,
        pretty: parsed.pretty,
      };
    }

    const result = provisionUserPortfolioDatabase({
      storePath: parsed.storePath,
      requireFresh: parsed.requireFresh,
      platform: options?.platform,
    });
    return {
      exitCode: 0,
      payload: result,
      pretty: parsed.pretty,
    };
  } catch (err) {
    const dpErr =
      err instanceof DirectProvisioningError
        ? err
        : new DirectProvisioningError(
            'PROVISIONING_TRANSACTION_FAILED',
            err instanceof Error ? err.message : String(err),
          );
    return {
      exitCode: 1,
      payload: {
        ok: false,
        status: 'FAILED',
        mode: parsed?.mode ?? 'provision',
        authorityId: DIRECT_PROVISIONING_AUTHORITY_ID,
        storePath: parsed?.storePath ?? null,
        mutated: false,
        errorCode: dpErr.code,
        errorMessage: dpErr.message,
        ...(dpErr.details ? { details: dpErr.details } : {}),
      },
      pretty: parsed?.pretty ?? false,
    };
  }
}

const isMain = (() => {
  try {
    if (!process.argv[1]) return false;
    return resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);
  } catch {
    return false;
  }
})();

if (isMain) {
  const outcome = runDirectProvisioningCli(process.argv.slice(2));
  const jsonText = JSON.stringify(outcome.payload, null, outcome.pretty ? 2 : 0);
  process.stdout.write(`${jsonText}\n`);
  if (outcome.exitCode !== 0) {
    const errMsg =
      'errorMessage' in outcome.payload && outcome.payload.errorMessage
        ? outcome.payload.errorMessage
        : 'Direct P1 provisioning/verification failed.';
    process.stderr.write(`[direct-p1-provisioning] ${errMsg}\n`);
  }
  process.exitCode = outcome.exitCode;
}
