/**
 * CAP-02 — Gate A′ successor provisioning entrypoint.
 *
 * This is the only act-bound execution path. The authorization brand below is
 * module-private and is minted only after every preflight condition succeeds.
 * The three identity constants are populated by the Program Authority
 * determination `IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01`;
 * execution still requires the designated Windows host, the required Node
 * major and a non-existent P-1 store, so no Linux/CI path can provision.
 *
 * CAP-03 D2 (PA-5 Option B): the execute receipt records the *executing* HEAD and
 * tree, measured from `--repo-root`, separately from the compiled basis constants,
 * and refuses before any connection when that measurement is unavailable or differs
 * from the expected execution pin. `BASIS_COMMIT`/`BASIS_TREE` keep their existing
 * meaning and value.
 *
 * CAP-03 D2 follow-up: `--repo-root` is a claim, not a grant. The identity is
 * measured from the repository that actually contains this executing module, and the
 * supplied `--repo-root` must resolve to that same repository (`REPO_ROOT_MISMATCH`
 * otherwise), so a caller cannot record the HEAD of an unrelated checkout as the
 * executing identity. The expected pin stays caller-attested and is deliberately
 * not given a pin store, a signed artifact or a default here; the note beside the
 * comparison in `authorizeExecution` states exactly what it is bound to.
 *
 * No IPC, startup, frontend or composition module imports this file.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
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
  /**
   * Absolute path of the checkout whose `HEAD` is the executing identity.
   * Required in `execute` mode; never read from the environment.
   */
  readonly repoRoot?: string;
  /**
   * Expected execution pin (commit) supplied by the governed authorization at
   * execution time. Required in `execute` mode. It is an *expectation* only: the
   * identity that is recorded is always the measured `HEAD`, never this value.
   */
  readonly executionCommit?: string;
  /** Expected execution pin (tree); see `executionCommit`. */
  readonly executionTree?: string;
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
  /**
   * Compiled basis of the successor act (`BASIS_COMMIT`/`BASIS_TREE`). These
   * identify the act's selected basis and keep exactly that meaning; they are
   * never the identity of the checkout that ran.
   */
  readonly basisCommit: string;
  readonly basisTree: string;
  /**
   * CAP-03 D2 (PA-5 Option B): the executing `HEAD` and its tree, measured from
   * `--repo-root` at run time. Recorded separately from the compiled basis so a
   * receipt can never let one stand for the other (adopted DA-A1).
   */
  readonly executingCommit: string;
  readonly executingTree: string;
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
  /**
   * The measured executing identity, carried by the authorization itself so the
   * value recorded in the receipt is the value that was verified before the
   * connection was opened — not a value a caller can restate afterwards.
   */
  readonly executingCommit: string;
  readonly executingTree: string;
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

/* -------------------------------------------------------------------------- *
 * CAP-03 D2 — executing identity (PA-5 Option B)
 *
 * Authority: IRR `IIPS-V3-CAP03-D2-IPD-RECEIPT-HANDOFF-2026-10-28-01` §4.1/§4.2/§4.4
 * as adjusted by `IIPS_v3.0_CAP03_P1_PA_FORMAL_DECISION_RECORD_2026-10-28.md` §5.2,
 * implementing the adopted DA-A1 requirement that a provisioning receipt record
 * the executing HEAD and tree *separately from* the compiled basis.
 *
 * The executing identity is always measured. It is never `BASIS_COMMIT`, never a
 * caller-restated value, and never read from the environment.
 * -------------------------------------------------------------------------- */

/** A resolved identity must be a full lowercase Git object id; anything else refuses. */
const GIT_OBJECT_ID = /^[0-9a-f]{40}$/;

const EXECUTING_HEAD_REVISION = 'HEAD^{commit}';
const EXECUTING_TREE_REVISION = 'HEAD^{tree}';

/**
 * Only the variables a bare `git rev-parse` needs to run are kept. Every `GIT_*`
 * name is dropped, so an inherited `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE`,
 * `GIT_OBJECT_DIRECTORY`, `GIT_ALTERNATE_OBJECT_DIRECTORIES`,
 * `GIT_CEILING_DIRECTORIES` or `GIT_NAMESPACE` cannot silently redirect identity
 * resolution to a different repository or worktree than `--repo-root` names.
 * Dropping the whole prefix is a superset of those seven names and is strictly
 * safer than enumerating them.
 */
function sanitizedGitEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const requiredToRunGit = new Set([
    'PATH',
    'PATHEXT',
    'SYSTEMROOT',
    'SystemRoot',
    'SYSTEMDRIVE',
    'COMSPEC',
    'USERPROFILE',
    'HOMEDRIVE',
    'HOMEPATH',
    'HOME',
    'APPDATA',
    'LOCALAPPDATA',
    'TMP',
    'TEMP',
    'TMPDIR',
  ]);
  const sanitized: NodeJS.ProcessEnv = {};
  for (const key of Object.keys(env)) {
    if (key.toUpperCase().startsWith('GIT_')) continue;
    if (requiredToRunGit.has(key)) sanitized[key] = env[key];
  }
  return sanitized;
}

function resolveGitObject(repoRoot: string, revision: string, env: NodeJS.ProcessEnv): string | undefined {
  try {
    const output = execFileSync('git', ['-C', repoRoot, 'rev-parse', '--verify', revision], {
      env: sanitizedGitEnvironment(env),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    });
    return output.trim();
  } catch {
    // A non-zero exit, an absent `git`, or an unusable `--repo-root` are one and the
    // same condition here: the executing identity is not established. This helper
    // never repairs, retries or substitutes a value.
    return undefined;
  }
}

/**
 * Measures the executing `HEAD` and its tree from the repository at `repoRoot`.
 * Refuses `EXECUTING_HEAD_UNRESOLVED` when either value is missing or malformed; the
 * caller invokes this before any database connection is opened. `repoRoot` is the
 * repository containing the executing module, resolved by `executingRepositoryRoot`,
 * never the caller's string as supplied.
 */
function readExecutionHead(repoRoot: string, env: NodeJS.ProcessEnv): { commit: string; tree: string } {
  const commit = resolveGitObject(repoRoot, EXECUTING_HEAD_REVISION, env);
  const tree = resolveGitObject(repoRoot, EXECUTING_TREE_REVISION, env);
  if (commit === undefined || !GIT_OBJECT_ID.test(commit) || tree === undefined || !GIT_OBJECT_ID.test(tree)) {
    throwRefusal(
      'EXECUTING_HEAD_UNRESOLVED',
      `the executing HEAD or tree could not be resolved from the repository at ${repoRoot}`,
    );
  }
  return { commit, tree };
}

/**
 * The repository containing this executing module, found by walking up from the
 * module's own file location. This is the only checkout whose `HEAD` can honestly be
 * reported as the *executing* identity, because it is the checkout the running code
 * came from. Returns `undefined` when no `.git` entry exists above the module, in
 * which case the executing identity is not established and execution refuses rather
 * than falling back to a caller-named path.
 */
function executingRepositoryRoot(): string | undefined {
  let current = dirname(fileURLToPath(import.meta.url));
  while (true) {
    if (existsSync(resolve(current, '.git'))) return current;
    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

/**
 * Compares two repository roots as filesystem locations. Symlinks are resolved on
 * both sides, so a `--repo-root` naming the same checkout through an equivalent path
 * still satisfies the binding, while a different checkout never does. Windows paths
 * compare case-insensitively because that filesystem does; the object ids returned
 * by `rev-parse` are unaffected by the comparison mode.
 */
function isSameRepositoryRoot(supplied: string, executing: string): boolean {
  try {
    const left = realpathSync.native(resolve(supplied));
    const right = realpathSync.native(resolve(executing));
    return process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right;
  } catch {
    // An unresolvable `--repo-root` is not the repository now executing.
    return false;
  }
}

/**
 * The three execute-mode identity arguments are mandatory and are never defaulted.
 * `--repo-root` is the caller's claim about which checkout is executing and is
 * verified against the repository containing this module before it is trusted;
 * `--execution-commit` / `--execution-tree` carry the caller-attested expected pin.
 */
function assertExecutionIdentityArguments(args: GateAPrimeArguments): {
  repoRoot: string;
  expectedCommit: string;
  expectedTree: string;
} {
  const missing = [
    ...(nonEmpty(args.repoRoot) ? [] : ['--repo-root']),
    ...(nonEmpty(args.executionCommit) ? [] : ['--execution-commit']),
    ...(nonEmpty(args.executionTree) ? [] : ['--execution-tree']),
  ];
  if (missing.length > 0) {
    throwRefusal(
      'ARGUMENT_INVALID',
      `${missing.join(', ')} must be supplied verbatim in execute mode; no identity value is read from the environment`,
    );
  }
  const repoRoot = (args.repoRoot as string).trim();
  const expectedCommit = (args.executionCommit as string).trim();
  const expectedTree = (args.executionTree as string).trim();
  if (!isAbsolute(repoRoot)) {
    throwRefusal('ARGUMENT_INVALID', '--repo-root must be an absolute path');
  }
  if (!GIT_OBJECT_ID.test(expectedCommit) || !GIT_OBJECT_ID.test(expectedTree)) {
    throwRefusal(
      'ARGUMENT_INVALID',
      '--execution-commit and --execution-tree must each be a 40-character lowercase Git object id',
    );
  }
  return { repoRoot, expectedCommit, expectedTree };
}

function isAuthorization(value: unknown): value is GateAPrimeExecutionAuthorization {
  const candidate = value as GateAPrimeExecutionAuthorization;
  return (
    typeof value === 'object' &&
    value !== null &&
    candidate.actId === GATE_A_PRIME_ACT_ID &&
    candidate[GATE_A_PRIME_EXECUTION_BRAND] === true &&
    typeof candidate.executingCommit === 'string' &&
    GIT_OBJECT_ID.test(candidate.executingCommit) &&
    typeof candidate.executingTree === 'string' &&
    GIT_OBJECT_ID.test(candidate.executingTree)
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

export interface GateAPrimeCompiledIdentityValues {
  readonly principalLabel: string | null;
  readonly tenantId: string | null;
  readonly canonicalOwnerId: string | null;
}

/**
 * Pure, side-effect-free identity gate (act §5.3 items 2 and 3).
 *
 * It is exported so that the null-constant refusal (T-4) remains executable
 * after the Program Authority determination populated the shipped constants.
 * There is no injectable bypass: `authorizeExecution` — the only production
 * caller — always passes this module's compiled constants, so a caller cannot
 * substitute a different triple to weaken the act binding.
 */
export function assertIdentityValuesResolved(
  supplied: {
    readonly principalLabel?: string;
    readonly tenantId?: string;
    readonly canonicalOwnerId?: string;
  },
  compiled: GateAPrimeCompiledIdentityValues,
): { principalLabel: string; tenantId: string; canonicalOwnerId: string } {
  if (!nonEmpty(supplied.principalLabel) || !nonEmpty(supplied.tenantId) || !nonEmpty(supplied.canonicalOwnerId)) {
    throwRefusal(
      'IDENTITY_VALUES_UNRESOLVED',
      'principal_label, tenantId and canonicalOwnerId must be supplied verbatim by a separate PA determination',
    );
  }
  if (compiled.principalLabel === null || compiled.tenantId === null || compiled.canonicalOwnerId === null) {
    throwRefusal(
      'IDENTITY_VALUES_UNRESOLVED',
      'the compiled identity constants are null; provisioning execution is not authorized',
    );
  }
  if (
    supplied.principalLabel !== compiled.principalLabel ||
    supplied.tenantId !== compiled.tenantId ||
    supplied.canonicalOwnerId !== compiled.canonicalOwnerId
  ) {
    throwRefusal('IDENTITY_VALUE_MISMATCH', 'supplied identity values differ from the act-bound constants');
  }
  return {
    principalLabel: supplied.principalLabel,
    tenantId: supplied.tenantId,
    canonicalOwnerId: supplied.canonicalOwnerId,
  };
}

/**
 * All execute-mode checks that must happen before a database connection is
 * opened. Identity resolution runs first: while any compiled constant is null
 * (a partially-bound or unbound build) execution stops there, before platform
 * or path side effects. The executing HEAD is measured last, after every
 * pre-existing refusal keeps its precedence, and only a matching measurement
 * mints the authorization.
 */
function authorizeExecution(args: GateAPrimeArguments, options: GateAPrimeExecutionOptions): GateAPrimeExecutionAuthorization {
  assertCommonArguments(args, options);

  assertIdentityValuesResolved(
    {
      principalLabel: args.principalLabel,
      tenantId: args.tenantId,
      canonicalOwnerId: args.canonicalOwnerId,
    },
    {
      principalLabel: PRINCIPAL_LABEL,
      tenantId: TENANT_ID,
      canonicalOwnerId: CANONICAL_OWNER_ID,
    },
  );

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

  // CAP-03 D2: measure the executing identity and compare it with the expected
  // execution pin carried by the arguments. Both happen here, before the second
  // store-existence check and before any connection is opened, so every refusal
  // leaves the store path untouched and writes zero rows.
  const { repoRoot, expectedCommit, expectedTree } = assertExecutionIdentityArguments(args);

  // Provenance of the *expected* pin, stated plainly because it is the one value in
  // this comparison that this module cannot authenticate. `--execution-commit` and
  // `--execution-tree` are caller-attested: they are validated for shape, compared
  // with the measurement, and refused on difference, but nothing inside the
  // enforcing commit can bind them to a governed authorization, because a compiled
  // constant here could never equal the commit that contains it. Their authority
  // therefore comes only from the P-1 authorization act that names the execution
  // commit for the checkout being executed. Until that act is rendered, a matching
  // pin demonstrates that the checkout is the one the caller named — it does not
  // demonstrate that the execution was authorized. This module deliberately adds no
  // pin store, no signed artifact and no default.
  //
  // `--repo-root` is the caller's claim about which checkout is executing. The claim
  // is verified against the repository that actually contains this module, and the
  // measurement is then taken from that repository, so a caller cannot have the
  // receipt record the HEAD of an unrelated checkout as the executing identity.
  const executingRoot = executingRepositoryRoot();
  if (executingRoot === undefined || !isSameRepositoryRoot(repoRoot, executingRoot)) {
    throwRefusal(
      'REPO_ROOT_MISMATCH',
      executingRoot === undefined
        ? `--repo-root=${repoRoot} cannot be bound: no repository containing the executing module was found`
        : `--repo-root=${repoRoot} is not the repository containing the executing module (${executingRoot}); ` +
            'the executing identity is measured only from the checkout now running',
    );
  }
  const executing = readExecutionHead(executingRoot, options.env ?? process.env);
  if (executing.commit !== expectedCommit || executing.tree !== expectedTree) {
    throwRefusal(
      'EXECUTION_PIN_MISMATCH',
      `the executing HEAD ${executing.commit} (tree ${executing.tree}) is not the expected execution pin ` +
        `${expectedCommit} (tree ${expectedTree})`,
    );
  }

  // This is a second, explicit check immediately before the connection is
  // opened. It closes the time-of-check/time-of-use race without ever repairing
  // or deleting a path that appeared concurrently.
  if (existsSync(args.store)) {
    throwRefusal('STORE_ALREADY_EXISTS', 'the provisioning store appeared before the write path opened');
  }

  return Object.freeze({
    actId: GATE_A_PRIME_ACT_ID,
    executingCommit: executing.commit,
    executingTree: executing.tree,
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
    // Compiled basis: unchanged constant, unchanged meaning (successor act §5.2).
    basisCommit: BASIS_COMMIT,
    basisTree: BASIS_TREE,
    // Executing identity: measured before the connection was opened and carried by
    // the authorization, never restated from the arguments or from a constant.
    executingCommit: authorization.executingCommit,
    executingTree: authorization.executingTree,
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
    // CAP-03 D2: executing identity and expected execution pin. Supplied verbatim on
    // the command line by the governed authorization; never read from the environment.
    '--repo-root',
    '--execution-commit',
    '--execution-tree',
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
  if (mode === 'execute') {
    const missing = ['--repo-root', '--execution-commit', '--execution-tree'].filter((name) => !values.has(name));
    if (missing.length > 0) {
      throw new GateAPrimeRefusalError('ARGUMENT_INVALID', `${missing.join(', ')} are required in execute mode`);
    }
  }
  const args: GateAPrimeArguments = {
    mode,
    actId,
    store,
    ...(values.has('--principal-label') ? { principalLabel: values.get('--principal-label') } : {}),
    ...(values.has('--tenant-id') ? { tenantId: values.get('--tenant-id') } : {}),
    ...(values.has('--canonical-owner-id') ? { canonicalOwnerId: values.get('--canonical-owner-id') } : {}),
    ...(values.has('--actor') ? { actor: values.get('--actor') } : {}),
    ...(values.has('--repo-root') ? { repoRoot: values.get('--repo-root') } : {}),
    ...(values.has('--execution-commit') ? { executionCommit: values.get('--execution-commit') } : {}),
    ...(values.has('--execution-tree') ? { executionTree: values.get('--execution-tree') } : {}),
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
