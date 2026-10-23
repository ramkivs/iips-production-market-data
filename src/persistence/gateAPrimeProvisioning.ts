/**
 * CAP-02 — Gate A′ successor provisioning entrypoint.
 *
 * This is the only act-bound execution path. The authorization brand below is
 * module-private and is minted only after every preflight condition succeeds.
 * The shipped state has null identity constants, so the execute mode is
 * intentionally inert until a separate Program Authority value-selection act.
 *
 * No IPC, startup, frontend or composition module imports this file.
 */
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import {
  appendAuditEvent,
  type AuditEvent,
} from './audit.js';
import { closeDatabase, openDatabase } from './connection.js';
import { ensureMigrations } from './migration_ledger.js';
import {
  BASIS_COMMIT,
  BASIS_TREE,
  CANONICAL_OWNER_ID,
  DESIGNATED_MIGRATION_BLOBS,
  GATE3_MIGRATIONS,
  GATE_A_PRIME_ACT_ID,
  PRINCIPAL_LABEL,
  TENANT_ID,
  existingStoreHasProvisioningRows,
  validateStoreAtPath,
  type GateAPrimeValidationInput,
  type GateAPrimeValidationReport,
} from './gateAPrimeValidation.js';

export {
  BASIS_COMMIT,
  BASIS_TREE,
  CANONICAL_OWNER_ID,
  DESIGNATED_MIGRATION_BLOBS,
  GATE_A_PRIME_ACT_ID,
  PRINCIPAL_LABEL,
  TENANT_ID,
  existingStoreHasProvisioningRows,
};

export type GateAPrimeMode = 'execute' | 'validate';

export interface GateAPrimeArguments extends GateAPrimeValidationInput {
  readonly mode: GateAPrimeMode;
  readonly actId: string;
  readonly store: string;
  readonly actor?: string;
}

export interface GateAPrimeExecutionOptions {
  readonly env?: NodeJS.ProcessEnv;
  readonly platform?: NodeJS.Platform;
  readonly nodeVersion?: string;
}

export interface GateAPrimeExecutionResult {
  readonly mode: 'execute';
  readonly actId: string;
  readonly store: string;
  readonly bindingId: string;
  readonly membershipId: string;
  readonly auditEventId: number;
  readonly basisCommit: string;
  readonly basisTree: string;
}

export class GateAPrimeRefusalError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'GateAPrimeRefusalError';
  }
}

/** Module-private brand. There is no exported factory or accepted token shape. */
const GATE_A_PRIME_EXECUTION_BRAND: unique symbol = Symbol('gate-a-prime-successor-execution');
interface GateAPrimeExecutionAuthorization {
  readonly actId: typeof GATE_A_PRIME_ACT_ID;
  readonly [GATE_A_PRIME_EXECUTION_BRAND]: true;
}

function bindingIdFor(principalLabel: string): string {
  return createHash('sha256').update(`binding:${principalLabel}`, 'utf8').digest('hex').slice(0, 32);
}

function membershipIdFor(tenantId: string, canonicalOwnerId: string): string {
  return createHash('sha256')
    .update(`membership:${tenantId}:${canonicalOwnerId}`, 'utf8')
    .digest('hex')
    .slice(0, 32);
}

function isAuthorization(value: unknown): value is GateAPrimeExecutionAuthorization {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as GateAPrimeExecutionAuthorization).actId === GATE_A_PRIME_ACT_ID &&
    (value as GateAPrimeExecutionAuthorization)[GATE_A_PRIME_EXECUTION_BRAND] === true
  );
}

function throwRefusal(code: string, message: string): never {
  throw new GateAPrimeRefusalError(code, message);
}

function nonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function environmentCarriesGateValues(env: NodeJS.ProcessEnv): string[] {
  return Object.keys(env)
    .filter((key) => key.startsWith('GATE_A_PRIME_'))
    .sort();
}

function isInsideGitWorktree(filePath: string): boolean {
  let current = resolve(dirname(filePath));
  while (true) {
    if (existsSync(resolve(current, '.git'))) return true;
    const parent = dirname(current);
    if (parent === current) return false;
    current = parent;
  }
}

function assertCommonArguments(args: GateAPrimeArguments, options: GateAPrimeExecutionOptions): void {
  if (args.actId !== GATE_A_PRIME_ACT_ID) {
    throwRefusal('ACT_ID_MISMATCH', 'the supplied act id is not the effective Gate A′ successor act');
  }
  if (!nonEmpty(args.store) || !isAbsolute(args.store)) {
    throwRefusal('STORE_PATH_INVALID', 'the store path must be a non-empty absolute path');
  }
  if (isInsideGitWorktree(args.store)) {
    throwRefusal('STORE_PATH_IN_GIT_WORKTREE', 'the provisioning store must be outside every Git working tree');
  }

  const env = options.env ?? process.env;
  const forbiddenEnvironmentValues = environmentCarriesGateValues(env);
  if (forbiddenEnvironmentValues.length > 0) {
    throwRefusal(
      'ENVIRONMENT_VALUES_NOT_AUTHORIZED',
      `environment-supplied Gate A′ values are forbidden: ${forbiddenEnvironmentValues.join(', ')}`,
    );
  }
}

/**
 * All execute-mode checks that must happen before a database connection is
 * opened. The current null constants intentionally make this stop at identity
 * resolution, before platform or path side effects.
 */
function authorizeExecution(args: GateAPrimeArguments, options: GateAPrimeExecutionOptions): GateAPrimeExecutionAuthorization {
  assertCommonArguments(args, options);

  if (!nonEmpty(args.principalLabel) || !nonEmpty(args.tenantId) || !nonEmpty(args.canonicalOwnerId)) {
    throwRefusal(
      'IDENTITY_VALUES_UNRESOLVED',
      'principal_label, tenantId and canonicalOwnerId must be supplied verbatim by a separate PA determination',
    );
  }
  if (
    PRINCIPAL_LABEL === null ||
    TENANT_ID === null ||
    CANONICAL_OWNER_ID === null
  ) {
    throwRefusal(
      'IDENTITY_VALUES_UNRESOLVED',
      'the compiled identity constants are null; provisioning execution is not authorized',
    );
  }
  if (
    args.principalLabel !== PRINCIPAL_LABEL ||
    args.tenantId !== TENANT_ID ||
    args.canonicalOwnerId !== CANONICAL_OWNER_ID
  ) {
    throwRefusal('IDENTITY_VALUE_MISMATCH', 'supplied identity values differ from the act-bound constants');
  }

  const platform = options.platform ?? process.platform;
  if (platform !== 'win32') {
    throwRefusal('PLATFORM_UNSUPPORTED', `provisioning is restricted to win32; observed ${platform}`);
  }

  const version = options.nodeVersion ?? process.versions.node;
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
  const supported =
    match !== null &&
    Number(match[1]) === 22 &&
    (Number(match[2]) > 13 || (Number(match[2]) === 13 && Number(match[3]) >= 0));
  if (!supported) {
    throwRefusal('RUNTIME_UNSUPPORTED', `Node ${version} is outside the required range >=22.13.0 <23`);
  }

  if (existsSync(args.store)) {
    if (statSync(args.store).isFile() && existingStoreHasProvisioningRows(args.store)) {
      throwRefusal('ALREADY_PROVISIONED', 'the store already contains a binding or membership row');
    }
    throwRefusal('STORE_ALREADY_EXISTS', 'P-1 requires the provisioning store file not to pre-exist');
  }

  // This is a second, explicit check immediately before the connection is
  // opened. It closes the time-of-check/time-of-use race without ever repairing
  // or deleting a path that appeared concurrently.
  if (existsSync(args.store)) {
    throwRefusal('STORE_ALREADY_EXISTS', 'the provisioning store appeared before the write path opened');
  }

  return Object.freeze({
    actId: GATE_A_PRIME_ACT_ID,
    [GATE_A_PRIME_EXECUTION_BRAND]: true as const,
  });
}

function executeWithAuthorization(
  db: DatabaseSync,
  authorization: unknown,
  args: GateAPrimeArguments,
): GateAPrimeExecutionResult {
  if (!isAuthorization(authorization)) {
    throw new GateAPrimeRefusalError('AUTHORIZATION_BRAND_INVALID', 'the act-bound execution brand is invalid');
  }
  const principalLabel = args.principalLabel as string;
  const tenantId = args.tenantId as string;
  const canonicalOwnerId = args.canonicalOwnerId as string;
  const bindingId = bindingIdFor(principalLabel);
  const membershipId = membershipIdFor(tenantId, canonicalOwnerId);

  const existing = db
    .prepare('SELECT COUNT(*) AS n FROM local_principal_bindings')
    .get() as { n: number | bigint };
  const existingMemberships = db
    .prepare('SELECT COUNT(*) AS n FROM local_principal_memberships')
    .get() as { n: number | bigint };
  if (Number(existing.n) > 0 || Number(existingMemberships.n) > 0) {
    throw new GateAPrimeRefusalError('ALREADY_PROVISIONED', 'the store already contains a binding or membership row');
  }

  const now = new Date().toISOString();
  let audit: AuditEvent;
  db.exec('BEGIN IMMEDIATE;');
  try {
    db.prepare(
      `INSERT INTO local_principal_bindings
         (binding_id, principal_label, status, created_at, updated_at, revoked_at)
       VALUES (?, ?, 'ACTIVE', ?, ?, NULL)`,
    ).run(bindingId, principalLabel, now, now);
    db.prepare(
      `INSERT INTO local_principal_memberships
         (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at)
       VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, NULL)`,
    ).run(membershipId, bindingId, tenantId, canonicalOwnerId, now, now);
    audit = appendAuditEvent(db, {
      eventType: 'local_principal_binding.provisioned',
      subjectType: 'local_principal_binding',
      subjectId: principalLabel,
      detail: { tenantId, canonicalOwnerId },
    });
    db.exec('COMMIT;');
  } catch (error) {
    if (db.isTransaction) db.exec('ROLLBACK;');
    throw error;
  }

  return {
    mode: 'execute',
    actId: GATE_A_PRIME_ACT_ID,
    store: args.store,
    bindingId,
    membershipId,
    auditEventId: audit!.id,
    basisCommit: BASIS_COMMIT,
    basisTree: BASIS_TREE,
  };
}

/** Execute the single act-bound provisioning attempt. */
export function executeProvisioning(
  args: GateAPrimeArguments,
  options: GateAPrimeExecutionOptions = {},
): GateAPrimeExecutionResult {
  if (args.mode !== 'execute') {
    throwRefusal('MODE_INVALID', 'executeProvisioning requires --mode=execute');
  }
  const authorization = authorizeExecution(args, options);
  let db: DatabaseSync | undefined;
  try {
    db = openDatabase(args.store, options.nodeVersion ?? process.versions.node);
    ensureMigrations(db, GATE3_MIGRATIONS);
    return executeWithAuthorization(db, authorization, args);
  } catch (error) {
    if (error instanceof GateAPrimeRefusalError) throw error;
    throw new GateAPrimeRefusalError(
      'EXECUTION_FAILED_ROLLED_BACK',
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    // The process-local connection singleton must not leak into a later
    // validation or test; the database file itself is never deleted here.
    closeDatabase();
  }
}

/** Read-only mode. It does not require win32 and never creates a store. */
export function validateProvisioning(
  args: GateAPrimeArguments,
): GateAPrimeValidationReport {
  if (args.mode !== 'validate') {
    throwRefusal('MODE_INVALID', 'validateProvisioning requires --mode=validate');
  }
  assertCommonArguments(args, {});
  return validateStoreAtPath(args.store, {
    principalLabel: args.principalLabel,
    tenantId: args.tenantId,
    canonicalOwnerId: args.canonicalOwnerId,
  });
}

export function runGateAPrime(
  args: GateAPrimeArguments,
  options: GateAPrimeExecutionOptions = {},
): GateAPrimeExecutionResult | GateAPrimeValidationReport {
  return args.mode === 'execute' ? executeProvisioning(args, options) : validateProvisioning(args);
}

function valueAfterEquals(argument: string): string | undefined {
  const index = argument.indexOf('=');
  return index < 0 ? undefined : argument.slice(index + 1);
}

function requiredOption(argument: string, name: string): string {
  const value = valueAfterEquals(argument);
  if (value === undefined || value.length === 0) {
    throw new GateAPrimeRefusalError('ARGUMENT_INVALID', `${name} must use the form ${name}=<value>`);
  }
  return value;
}

/** Strict CLI parser; no environment defaults or fallback values are accepted. */
export function parseGateAPrimeArguments(argv: readonly string[]): GateAPrimeArguments {
  const values = new Map<string, string>();
  const allowed = new Set([
    '--mode',
    '--act-id',
    '--store',
    '--principal-label',
    '--tenant-id',
    '--canonical-owner-id',
    '--actor',
  ]);
  for (const argument of argv) {
    const name = argument.split('=', 1)[0];
    if (!allowed.has(name)) {
      throw new GateAPrimeRefusalError('ARGUMENT_INVALID', `unknown argument ${argument}`);
    }
    values.set(name, requiredOption(argument, name));
  }

  const mode = values.get('--mode');
  if (mode !== 'execute' && mode !== 'validate') {
    throw new GateAPrimeRefusalError('ARGUMENT_INVALID', '--mode must be execute or validate');
  }
  const actId = values.get('--act-id');
  const store = values.get('--store');
  if (!actId || !store) {
    throw new GateAPrimeRefusalError('ARGUMENT_INVALID', '--act-id and --store are required');
  }
  const args: GateAPrimeArguments = {
    mode,
    actId,
    store,
    ...(values.has('--principal-label') ? { principalLabel: values.get('--principal-label') } : {}),
    ...(values.has('--tenant-id') ? { tenantId: values.get('--tenant-id') } : {}),
    ...(values.has('--canonical-owner-id') ? { canonicalOwnerId: values.get('--canonical-owner-id') } : {}),
    ...(values.has('--actor') ? { actor: values.get('--actor') } : {}),
  };
  return args;
}

const isMain = (): boolean => {
  if (!process.argv[1]) return false;
  return process.argv[1].endsWith('gateAPrimeProvisioning.js') || process.argv[1].endsWith('gateAPrimeProvisioning.ts');
};

if (isMain()) {
  try {
    const result = runGateAPrime(parseGateAPrimeArguments(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    const payload = {
      ok: false,
      code: error instanceof GateAPrimeRefusalError ? error.code : 'UNEXPECTED_FAILURE',
      error: error instanceof Error ? error.message : String(error),
    };
    process.stderr.write(`${JSON.stringify(payload)}\n`);
    process.exitCode = 1;
  }
}
