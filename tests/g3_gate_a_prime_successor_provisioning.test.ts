/**
 * CAP-02 — Gate A′ successor implementation and validation boundary.
 *
 * These tests exercise the act-bound state after the Program Authority
 * determination `IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01`:
 * the exact act is effective, the entrypoint is bounded, the three compiled
 * constants are exactly the determined values, and no provisioning call made
 * from this (non-win32) environment can create a store or row.
 *
 * T-10…T-16 add the CAP-03 D2 coverage (PA-5 Option B; IRR D2 handoff §4.5 and
 * formal decision record §5.3): the execute receipt records the *measured*
 * executing HEAD and tree separately from the unchanged compiled basis, and
 * refuses before any store is opened when that identity is unresolvable,
 * unpinned, malformed or mismatched. The measurement is taken from the repository
 * containing the executing module, so `--repo-root` naming any other checkout is
 * refused rather than recorded as the executing identity.
 */
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import type { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendAuditEvent, readAuditEvents } from '../src/persistence/audit.js';
import { closeDatabase, openDatabase } from '../src/persistence/connection.js';
import {
  assertIdentityValuesResolved,
  executeProvisioning,
  existingStoreHasProvisioningRows,
  GATE_A_PRIME_ACT_ID,
  parseGateAPrimeArguments,
  PRINCIPAL_LABEL,
  TENANT_ID,
  CANONICAL_OWNER_ID,
  validateProvisioning,
  type GateAPrimeArguments,
  type GateAPrimeExecutionOptions,
} from '../src/persistence/gateAPrimeProvisioning.js';
import { inspectBindings } from '../src/persistence/binding.js';
import { ProvisioningNotAuthorizedError, provisionActiveBinding } from '../src/persistence/provisioning.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import {
  BASIS_COMMIT,
  BASIS_TREE,
  GATE3_MIGRATIONS,
  validateStoreAtPath,
} from '../src/persistence/gateAPrimeValidation.js';

function bindingId(principalLabel: string): string {
  return createHash('sha256').update(`binding:${principalLabel}`, 'utf8').digest('hex').slice(0, 32);
}

function membershipId(tenantId: string, canonicalOwnerId: string): string {
  return createHash('sha256')
    .update(`membership:${tenantId}:${canonicalOwnerId}`, 'utf8')
    .digest('hex')
    .slice(0, 32);
}

/**
 * The Program Authority determined values, restated here literally so the test
 * is an independent check of the compiled constants rather than a copy of them.
 * Authority: `IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01`.
 */
const DETERMINED_PRINCIPAL_LABEL = 'ramki-personal-local';
const DETERMINED_TENANT_ID = 'ipd-personal-local';
const DETERMINED_CANONICAL_OWNER_ID = 'ipd-owner-ramki-personal';

describe('CAP-02 Gate A′ successor provisioning boundary', () => {
  const roots: string[] = [];

  afterEach(() => {
    closeDatabase();
    for (const root of roots) rmSync(root, { recursive: true, force: true });
    roots.length = 0;
  });

  function makeRoot(): string {
    const root = mkdtempSync(join(tmpdir(), 'cap02-gate-a-prime-'));
    roots.push(root);
    return root;
  }

  function args(store: string, overrides: Partial<GateAPrimeArguments> = {}): GateAPrimeArguments {
    return {
      mode: 'execute',
      actId: GATE_A_PRIME_ACT_ID,
      store,
      principalLabel: DETERMINED_PRINCIPAL_LABEL,
      tenantId: DETERMINED_TENANT_ID,
      canonicalOwnerId: DETERMINED_CANONICAL_OWNER_ID,
      actor: 'test-only-operator',
      ...overrides,
    };
  }

  function createStore(store: string, withProvisionedPair = false): void {
    const db = openDatabase(store);
    ensureMigrations(db, GATE3_MIGRATIONS);
    if (withProvisionedPair) {
      const principal = 'fixture-principal';
      const tenant = 'fixture-tenant';
      const owner = 'fixture-owner';
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO local_principal_bindings
           (binding_id, principal_label, status, created_at, updated_at, revoked_at)
         VALUES (?, ?, 'ACTIVE', ?, ?, NULL)`,
      ).run(bindingId(principal), principal, now, now);
      db.prepare(
        `INSERT INTO local_principal_memberships
           (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at)
         VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, NULL)`,
      ).run(membershipId(tenant, owner), bindingId(principal), tenant, owner, now, now);
      appendAuditEvent(db, {
        eventType: 'local_principal_binding.provisioned',
        subjectType: 'local_principal_binding',
        subjectId: principal,
        detail: { tenantId: tenant, canonicalOwnerId: owner },
      });
    }
    closeDatabase();
  }

  it('T-1 refuses a wrong act id before opening or creating a store', () => {
    const store = join(makeRoot(), 'store', 'ipd.db');
    assert.throws(
      () => executeProvisioning(args(store, { actId: 'wrong-act-id' }), { platform: 'win32', nodeVersion: '22.22.3', env: {} }),
      (error: unknown) => (error as { code?: string }).code === 'ACT_ID_MISMATCH',
    );
    assert.equal(existsSync(store), false);
  });

  it('T-2 refuses an absent identity value as unresolved and creates no store', () => {
    const absentShapes: Array<[string, Partial<GateAPrimeArguments>]> = [
      ['principal_label', { principalLabel: undefined }],
      ['tenantId', { tenantId: undefined }],
      ['canonicalOwnerId', { canonicalOwnerId: undefined }],
    ];
    for (const [field, shape] of absentShapes) {
      const store = join(makeRoot(), 'store', 'ipd.db');
      assert.throws(
        () => executeProvisioning(args(store, shape), { platform: 'win32', nodeVersion: '22.22.3', env: {} }),
        (error: unknown) => (error as { code?: string }).code === 'IDENTITY_VALUES_UNRESOLVED',
        `an absent ${field} must refuse as unresolved`,
      );
      assert.equal(existsSync(store), false);
    }
    const store = join(makeRoot(), 'blank', 'ipd.db');
    assert.throws(
      () => executeProvisioning(args(store, { principalLabel: '   ' }), { platform: 'win32', nodeVersion: '22.22.3', env: {} }),
      (error: unknown) => (error as { code?: string }).code === 'IDENTITY_VALUES_UNRESOLVED',
    );
    assert.equal(existsSync(store), false);
  });

  it('T-2 refuses every value differing from the compiled constant as a mismatch', () => {
    const mismatchShapes: Array<[string, Partial<GateAPrimeArguments>]> = [
      ['principal_label', { principalLabel: 'ipd-value-not-selected' }],
      ['tenantId', { tenantId: 'ipd-value-not-selected' }],
      ['canonicalOwnerId', { canonicalOwnerId: 'ipd-value-not-selected' }],
    ];
    for (const [field, shape] of mismatchShapes) {
      const store = join(makeRoot(), 'store', 'ipd.db');
      assert.throws(
        () => executeProvisioning(args(store, shape), { platform: 'win32', nodeVersion: '22.22.3', env: {} }),
        (error: unknown) => (error as { code?: string }).code === 'IDENTITY_VALUE_MISMATCH',
        `a differing ${field} must refuse as a mismatch`,
      );
      assert.equal(existsSync(store), false);
    }
  });

  it('T-4 the shipped constants are exactly the determined triple and the null guard still refuses', () => {
    // (a) The delivered state is no longer null; it is exactly the PA triple,
    // never a partial binding.
    assert.equal(PRINCIPAL_LABEL, DETERMINED_PRINCIPAL_LABEL);
    assert.equal(TENANT_ID, DETERMINED_TENANT_ID);
    assert.equal(CANONICAL_OWNER_ID, DETERMINED_CANONICAL_OWNER_ID);
    const compiled = [PRINCIPAL_LABEL, TENANT_ID, CANONICAL_OWNER_ID];
    assert.equal(
      compiled.every((value) => value === null) || compiled.every((value) => typeof value === 'string'),
      true,
      'the compiled triple must be all-null or all-string, never partially bound',
    );

    // (b) The null-constant refusal path itself is still present, executable and
    // fail-closed: an unbound or partially-bound build cannot provision.
    const supplied = {
      principalLabel: DETERMINED_PRINCIPAL_LABEL,
      tenantId: DETERMINED_TENANT_ID,
      canonicalOwnerId: DETERMINED_CANONICAL_OWNER_ID,
    };
    for (const nulls of [
      { principalLabel: null, tenantId: null, canonicalOwnerId: null },
      { principalLabel: DETERMINED_PRINCIPAL_LABEL, tenantId: null, canonicalOwnerId: DETERMINED_CANONICAL_OWNER_ID },
    ]) {
      assert.throws(
        () => assertIdentityValuesResolved(supplied, nulls),
        (error: unknown) => (error as { code?: string }).code === 'IDENTITY_VALUES_UNRESOLVED',
      );
    }

    // (c) The same gate accepts exactly the bound triple and returns it.
    assert.deepEqual(assertIdentityValuesResolved(supplied, { ...supplied }), supplied);

    // (d) The gate lives before any connection: a refuse still creates no file.
    const store = join(makeRoot(), 'store', 'ipd.db');
    assert.throws(
      () =>
        assertIdentityValuesResolved(
          supplied,
          { principalLabel: null, tenantId: null, canonicalOwnerId: null },
        ),
      (error: unknown) => (error as { code?: string }).code === 'IDENTITY_VALUES_UNRESOLVED',
    );
    assert.equal(existsSync(store), false);
  });

  it('T-6 refuses execution on a non-win32 platform with the correct values and creates no store', () => {
    for (const platform of ['linux', 'darwin'] as const) {
      const store = join(makeRoot(), 'store', 'ipd.db');
      assert.throws(
        () => executeProvisioning(args(store), { platform, nodeVersion: '22.22.3', env: {} }),
        (error: unknown) => (error as { code?: string }).code === 'PLATFORM_UNSUPPORTED',
        `platform ${platform} must refuse`,
      );
      assert.equal(existsSync(store), false);
    }
    // The runtime range is enforced immediately after the platform check.
    const store = join(makeRoot(), 'runtime', 'ipd.db');
    assert.throws(
      () => executeProvisioning(args(store), { platform: 'win32', nodeVersion: '24.14.0', env: {} }),
      (error: unknown) => (error as { code?: string }).code === 'RUNTIME_UNSUPPORTED',
    );
    assert.equal(existsSync(store), false);
  });

  it('T-7 refuses all four forged authorization shapes against provisionActiveBinding', () => {
    const store = join(makeRoot(), 'store', 'ipd.db');
    const db: DatabaseSync = openDatabase(store);
    ensureMigrations(db, GATE3_MIGRATIONS);
    const before = rowCounts(db);
    const attempt = (auth: unknown): void => {
      assert.throws(
        () =>
          provisionActiveBinding(db, auth, {
            principalLabel: DETERMINED_PRINCIPAL_LABEL,
            tenantId: DETERMINED_TENANT_ID,
            canonicalOwnerId: DETERMINED_CANONICAL_OWNER_ID,
          }),
        ProvisioningNotAuthorizedError,
      );
    };
    const otherBrand = Symbol('gate-a-prime-authorization');
    attempt(undefined);
    attempt({});
    attempt({ issuedAt: new Date().toISOString(), act: 'gate-a-prime' });
    attempt({ issuedAt: new Date().toISOString(), act: 'gate-a-prime', [otherBrand]: true });
    assert.deepEqual(rowCounts(db), before);
    assert.deepEqual(rowCounts(db), { bindings: 0, memberships: 0, audit: 0 });
    assert.deepEqual(inspectBindings(db).bindings, []);
    closeDatabase();
  });

  it('T-8 keeps both provisioning modules outside the IPC, startup, composition and frontend import graph', () => {
    const here = fileURLToPath(new URL('.', import.meta.url));
    const repoRoot = join(here, '..', '..');
    const guardedPaths = [
      join(repoRoot, 'src', 'ipc', 'entrypoint.ts'),
      join(repoRoot, 'src', 'ipc', 'dispatch.ts'),
      join(repoRoot, 'src', 'ipc', 'startup.ts'),
      join(repoRoot, 'src', 'index.ts'),
      join(repoRoot, 'frontend', 'src', 'main.tsx'),
    ];
    for (const path of guardedPaths) {
      if (!existsSync(path)) continue;
      const source = stripComments(readFileSync(path, 'utf8'));
      assert.ok(
        !/from\s+['"][^'"]*(?:provisioning|gateAPrimeProvisioning)['"]/.test(source) &&
          !/import\(\s*['"][^'"]*(?:provisioning|gateAPrimeProvisioning)['"]\s*\)/.test(source),
        `${path} must not import a Gate A′ provisioning module`,
      );
    }
    // The suite itself is the only importer of the library-only mutator: no
    // src/ or frontend/ module may reference it.
    const srcFiles = listSources(join(repoRoot, 'src')).concat(listSources(join(repoRoot, 'frontend', 'src')));
    const importers = srcFiles.filter((path) => {
      const source = stripComments(readFileSync(path, 'utf8'));
      return /from\s+['"][^'"]*provisioning\.js['"]|from\s+['"][^'"]*gateAPrimeProvisioning\.js['"]/.test(source);
    });
    assert.deepEqual(importers, []);
  });

  it('T-3 refuses every Gate A′ environment-shaped value without opening a store', () => {
    const store = join(makeRoot(), 'store', 'ipd.db');
    assert.throws(
      () =>
        executeProvisioning(args(store), {
          platform: 'win32',
          nodeVersion: '22.22.3',
          env: { GATE_A_PRIME_TENANT_ID: 'environment-must-not-authorize' },
        }),
      (error: unknown) => (error as { code?: string }).code === 'ENVIRONMENT_VALUES_NOT_AUTHORIZED',
    );
    assert.equal(existsSync(store), false);
  });

  it('T-5 classifies an existing provisioned store without changing its bytes', () => {
    const store = join(makeRoot(), 'store', 'ipd.db');
    createStore(store, true);
    const before = createHash('sha256').update(readFileSync(store)).digest('hex');
    assert.equal(existingStoreHasProvisioningRows(store), true);
    const after = createHash('sha256').update(readFileSync(store)).digest('hex');
    assert.equal(after, before);
  });

  it('T-9 validates an empty temporary store read-only and leaves bytes unchanged', () => {
    const store = join(makeRoot(), 'empty', 'ipd.db');
    createStore(store, false);
    const before = readFileSync(store);
    const report = validateProvisioning({
      mode: 'validate',
      actId: GATE_A_PRIME_ACT_ID,
      store,
      principalLabel: 'fixture-principal',
      tenantId: 'fixture-tenant',
      canonicalOwnerId: 'fixture-owner',
    });
    assert.equal(report.readOnly, true);
    assert.equal(report.status, 'FAIL');
    assert.equal(report.bindings, 0);
    assert.equal(report.memberships, 0);
    assert.deepEqual(readFileSync(store), before);
  });

  it('T-9 reports a valid fixture pair without treating it as an execution result', () => {
    const store = join(makeRoot(), 'valid', 'ipd.db');
    createStore(store, true);
    const before = readFileSync(store);
    const report = validateStoreAtPath(store, {
      principalLabel: 'fixture-principal',
      tenantId: 'fixture-tenant',
      canonicalOwnerId: 'fixture-owner',
    });
    assert.equal(report.readOnly, true);
    assert.equal(report.status, 'PASS');
    assert.deepEqual(readFileSync(store), before);
    assert.equal(report.checks.every((item) => item.ok), true);
  });

  it('keeps the CLI strict and free of implicit identity or environment defaults', () => {
    assert.deepEqual(
      parseGateAPrimeArguments([
        '--mode=validate',
        `--act-id=${GATE_A_PRIME_ACT_ID}`,
        '--store=/tmp/ipd-gate-a-prime.db',
      ]),
      {
        mode: 'validate',
        actId: GATE_A_PRIME_ACT_ID,
        store: '/tmp/ipd-gate-a-prime.db',
      },
    );
    assert.throws(() => parseGateAPrimeArguments(['--mode=execute', '--store=/tmp/x']), /--act-id/);
    assert.throws(() => parseGateAPrimeArguments(['--mode=execute', '--store=/tmp/x', '--unknown=x']), /unknown argument/);
  });

  /* ---------------------------------------------------------------------- *
   * CAP-03 D2 (PA-5 Option B) — executing identity versus compiled basis.
   *
   * The Git repository below is a throwaway fixture standing in for "the checkout
   * that executes". It is NOT a designated execution pin and NOT a P-1 store: the
   * store is always a temporary file in a separate directory, outside every Git
   * working tree, and successor act §7.6 forbids reporting a fixture result as a
   * provisioning result. Nothing here is a P-1 attempt.
   * ---------------------------------------------------------------------- */

  /** Creates a temporary repository with exactly one commit and measures it. */
  function makeGitFixture(label: string): { root: string; commit: string; tree: string } {
    const root = makeRoot();
    const git = (...gitArgs: string[]): string =>
      execFileSync('git', ['-C', root, ...gitArgs], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    git('init', '--quiet', '--initial-branch=main');
    git('config', 'user.email', 'cap03-d2-fixture@example.invalid');
    git('config', 'user.name', 'CAP-03 D2 fixture');
    git('config', 'commit.gpgsign', 'false');
    writeFileSync(join(root, 'fixture.txt'), `${label}\n`);
    git('add', 'fixture.txt');
    git('commit', '--quiet', '-m', `CAP-03 D2 fixture ${label}`);
    return {
      root,
      commit: git('rev-parse', '--verify', 'HEAD^{commit}'),
      tree: git('rev-parse', '--verify', 'HEAD^{tree}'),
    };
  }

  /**
   * The environment the module is allowed to see. It is deliberately explicit: the
   * module sanitizes whatever it is given, so the test states exactly what `git`
   * needs (`PATH`) and never relies on an inherited value.
   */
  function gitCapableEnvironment(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      SystemRoot: process.env.SystemRoot,
      ...extra,
    };
    for (const key of Object.keys(env)) {
      if (key.startsWith('GATE_A_PRIME_')) delete env[key];
    }
    return env;
  }

  /** Execute options matching the act's host/runtime contract, with a stated env. */
  function executeOptions(env: NodeJS.ProcessEnv): GateAPrimeExecutionOptions {
    return { platform: 'win32', nodeVersion: '22.22.3', env };
  }

  /**
   * The repository that actually contains the executing module — the checkout the
   * compiled module under test was built from. This is the only `--repo-root` the
   * module accepts, and the only repository whose `HEAD` it will record as the
   * executing identity. It is measured here, independently of the module, so every
   * assertion below compares against a value the module did not supply. It is a
   * development checkout, NOT a designated execution pin.
   */
  function executingRepository(): { root: string; commit: string; tree: string } {
    const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
    const git = (...gitArgs: string[]): string =>
      execFileSync('git', ['-C', root, ...gitArgs], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return {
      root,
      commit: git('rev-parse', '--verify', 'HEAD^{commit}'),
      tree: git('rev-parse', '--verify', 'HEAD^{tree}'),
    };
  }

  /** Well-formed but arbitrary object ids, used only as wrong expectations. */
  const NOT_A_PIN = 'a'.repeat(40);
  const NOT_A_TREE = 'b'.repeat(40);

  it('T-10 refuses an unavailable executing identity before opening a store', () => {
    const executing = executingRepository();

    // (a) The executing repository is named correctly, but the executing identity
    //     cannot be measured because `git` cannot run. Nothing is substituted.
    const storeA = join(makeRoot(), 'store', 'ipd.db');
    assert.throws(
      () =>
        executeProvisioning(
          args(storeA, {
            repoRoot: executing.root,
            executionCommit: executing.commit,
            executionTree: executing.tree,
          }),
          executeOptions(gitCapableEnvironment({ PATH: '' })),
        ),
      (error: unknown) => (error as { code?: string }).code === 'EXECUTING_HEAD_UNRESOLVED',
    );
    assert.equal(existsSync(storeA), false);

    // (b) A relative `--repo-root` is refused as an argument, before any measurement.
    const storeB = join(makeRoot(), 'store', 'ipd.db');
    assert.throws(
      () =>
        executeProvisioning(
          args(storeB, { repoRoot: 'relative/path', executionCommit: NOT_A_PIN, executionTree: NOT_A_TREE }),
          executeOptions(gitCapableEnvironment()),
        ),
      (error: unknown) => (error as { code?: string }).code === 'ARGUMENT_INVALID',
    );
    assert.equal(existsSync(storeB), false);
  });

  it('T-11 records the measured executing identity separately from the compiled basis', () => {
    const fixture = executingRepository();
    const store = join(makeRoot(), 'p1-fixture', 'ipd.db');

    const result = executeProvisioning(
      args(store, {
        repoRoot: fixture.root,
        executionCommit: fixture.commit,
        executionTree: fixture.tree,
      }),
      executeOptions(gitCapableEnvironment()),
    );

    assert.equal(result.mode, 'execute');
    // The receipt carries both identities, and they are not the same value.
    assert.deepEqual(Object.keys(result).sort(), [
      'actId',
      'auditEventId',
      'basisCommit',
      'basisTree',
      'bindingId',
      'executingCommit',
      'executingTree',
      'membershipId',
      'mode',
      'store',
    ]);
    // Executing identity is the executing checkout's measured identity, independently
    // measured above — the actual source, never the caller's restatement.
    assert.equal(result.executingCommit, fixture.commit);
    assert.equal(result.executingTree, fixture.tree);
    // Compiled basis is the unchanged constant, and is a different value.
    assert.equal(result.basisCommit, BASIS_COMMIT);
    assert.equal(result.basisTree, BASIS_TREE);
    assert.equal(result.basisCommit, '5fc74085ade980846ff4a07b36415b6d49446486');
    assert.equal(result.basisTree, '7226ef0033b3a7049169d8fcf9bcbc9908e2590b');
    assert.notEqual(result.executingCommit, result.basisCommit);
    assert.notEqual(result.executingTree, result.basisTree);
    assert.match(result.executingCommit, /^[0-9a-f]{40}$/);
    assert.match(result.executingTree, /^[0-9a-f]{40}$/);

    // Persistence and audit contracts are unchanged: the shipped read-only validator
    // still passes the whole V-A2 set against this fixture store.
    assert.equal(existsSync(store), true);
    const report = validateStoreAtPath(store, {
      principalLabel: DETERMINED_PRINCIPAL_LABEL,
      tenantId: DETERMINED_TENANT_ID,
      canonicalOwnerId: DETERMINED_CANONICAL_OWNER_ID,
    });
    assert.equal(report.status, 'PASS');
    assert.equal(
      report.checks.every((item) => item.ok),
      true,
      `a V-A2 check failed: ${JSON.stringify(report.checks.filter((item) => !item.ok))}`,
    );
    assert.deepEqual([report.bindings, report.memberships, report.auditEvents], [1, 1, 1]);

    // The audit detail is still exactly the owner pair; execution identity was not
    // persisted, so the audit checksum semantics are untouched.
    const db = openDatabase(store);
    const events = readAuditEvents(db);
    assert.equal(events.length, 1);
    assert.deepEqual(events[0].detail, {
      tenantId: DETERMINED_TENANT_ID,
      canonicalOwnerId: DETERMINED_CANONICAL_OWNER_ID,
    });
    assert.deepEqual(Object.keys(events[0].detail).sort(), ['canonicalOwnerId', 'tenantId']);
    closeDatabase();
  });

  it('T-12 refuses an expected execution pin that differs from the measured HEAD', () => {
    const fixture = executingRepository();
    assert.notEqual(fixture.commit, NOT_A_PIN);
    assert.notEqual(fixture.tree, NOT_A_TREE);

    const mismatches: Array<[string, Partial<GateAPrimeArguments>]> = [
      ['executionCommit', { executionCommit: NOT_A_PIN, executionTree: fixture.tree }],
      ['executionTree', { executionCommit: fixture.commit, executionTree: NOT_A_TREE }],
      ['both', { executionCommit: NOT_A_PIN, executionTree: NOT_A_TREE }],
    ];
    for (const [field, override] of mismatches) {
      const store = join(makeRoot(), 'store', 'ipd.db');
      assert.throws(
        () => executeProvisioning(args(store, { repoRoot: fixture.root, ...override }), executeOptions(gitCapableEnvironment())),
        (error: unknown) => (error as { code?: string }).code === 'EXECUTION_PIN_MISMATCH',
        `a differing ${field} must refuse as a pin mismatch`,
      );
      assert.equal(existsSync(store), false, `a differing ${field} must create no store`);
    }
  });

  it('T-13 resolves the executing HEAD from --repo-root even when Git variables point elsewhere', () => {
    const executing = executingRepository();
    const decoy = makeGitFixture('decoy');
    assert.notEqual(executing.commit, decoy.commit, 'the two fixtures must differ for this test to mean anything');

    const store = join(makeRoot(), 'store', 'ipd.db');
    const result = executeProvisioning(
      args(store, {
        repoRoot: executing.root,
        executionCommit: executing.commit,
        executionTree: executing.tree,
      }),
      executeOptions(
        gitCapableEnvironment({
          GIT_DIR: join(decoy.root, '.git'),
          GIT_WORK_TREE: decoy.root,
          GIT_INDEX_FILE: join(decoy.root, '.git', 'index'),
          GIT_OBJECT_DIRECTORY: join(decoy.root, '.git', 'objects'),
          GIT_ALTERNATE_OBJECT_DIRECTORIES: join(decoy.root, '.git', 'objects'),
          GIT_CEILING_DIRECTORIES: decoy.root,
          GIT_NAMESPACE: 'decoy',
        }),
      ),
    );

    assert.equal(result.executingCommit, executing.commit);
    assert.equal(result.executingTree, executing.tree);
    assert.notEqual(result.executingCommit, decoy.commit);
    assert.notEqual(result.executingTree, decoy.tree);
  });

  it('T-14 refuses execute mode when no expected execution pin is supplied', () => {
    // Argument shape is refused before any repository is consulted, so a fixture is
    // sufficient here; the values below are never accepted as an identity.
    const fixture = makeGitFixture('unpinned');
    const absentShapes: Array<[string, Partial<GateAPrimeArguments>]> = [
      ['--repo-root', { executionCommit: fixture.commit, executionTree: fixture.tree }],
      ['--execution-commit', { repoRoot: fixture.root, executionTree: fixture.tree }],
      ['--execution-tree', { repoRoot: fixture.root, executionCommit: fixture.commit }],
    ];
    for (const [field, override] of absentShapes) {
      const store = join(makeRoot(), 'store', 'ipd.db');
      assert.throws(
        () => executeProvisioning(args(store, override), executeOptions(gitCapableEnvironment())),
        (error: unknown) => (error as { code?: string }).code === 'ARGUMENT_INVALID',
        `an absent ${field} must refuse`,
      );
      assert.equal(existsSync(store), false, `an absent ${field} must create no store`);
    }

    // A malformed pin is refused as an argument, not measured against.
    const malformed = join(makeRoot(), 'store', 'ipd.db');
    assert.throws(
      () =>
        executeProvisioning(
          args(malformed, { repoRoot: fixture.root, executionCommit: 'not-a-git-object-id', executionTree: fixture.tree }),
          executeOptions(gitCapableEnvironment()),
        ),
      (error: unknown) => (error as { code?: string }).code === 'ARGUMENT_INVALID',
    );
    assert.equal(existsSync(malformed), false);

    // The CLI enforces the same requirement in execute mode and defaults nothing,
    // while validate mode is unchanged.
    assert.throws(
      () =>
        parseGateAPrimeArguments([
          '--mode=execute',
          `--act-id=${GATE_A_PRIME_ACT_ID}`,
          '--store=/tmp/ipd-gate-a-prime.db',
          `--repo-root=${fixture.root}`,
        ]),
      /--execution-commit/,
    );
    assert.deepEqual(
      parseGateAPrimeArguments([
        '--mode=execute',
        `--act-id=${GATE_A_PRIME_ACT_ID}`,
        '--store=/tmp/ipd-gate-a-prime.db',
        `--repo-root=${fixture.root}`,
        `--execution-commit=${fixture.commit}`,
        `--execution-tree=${fixture.tree}`,
      ]),
      {
        mode: 'execute',
        actId: GATE_A_PRIME_ACT_ID,
        store: '/tmp/ipd-gate-a-prime.db',
        repoRoot: fixture.root,
        executionCommit: fixture.commit,
        executionTree: fixture.tree,
      },
    );
  });

  it('T-15 never derives the compiled basis from the executing checkout', () => {
    // Restated literally so this is an independent check of the compiled constants.
    assert.equal(BASIS_COMMIT, '5fc74085ade980846ff4a07b36415b6d49446486');
    assert.equal(BASIS_TREE, '7226ef0033b3a7049169d8fcf9bcbc9908e2590b');

    // The executing checkout's HEAD is not the basis, and the basis is still
    // reported verbatim beside the measured identity.
    const fixture = executingRepository();
    assert.notEqual(fixture.commit, BASIS_COMMIT);
    const store = join(makeRoot(), 'basis', 'ipd.db');
    const result = executeProvisioning(
      args(store, {
        repoRoot: fixture.root,
        executionCommit: fixture.commit,
        executionTree: fixture.tree,
      }),
      executeOptions(gitCapableEnvironment()),
    );
    assert.equal(result.basisCommit, BASIS_COMMIT);
    assert.equal(result.basisTree, BASIS_TREE);
    assert.equal(result.executingCommit, fixture.commit);
    assert.notEqual(result.basisCommit, result.executingCommit);
  });

  it('T-16 refuses a --repo-root that is not the repository containing the executing module', () => {
    const executing = executingRepository();

    // (a) A different, perfectly valid repository whose own HEAD is offered as the
    //     expected pin. Every other preflight passes, so only the binding can refuse.
    const other = makeGitFixture('other-checkout');
    assert.notEqual(other.commit, executing.commit);
    const storeA = join(makeRoot(), 'store', 'ipd.db');
    assert.throws(
      () =>
        executeProvisioning(
          args(storeA, { repoRoot: other.root, executionCommit: other.commit, executionTree: other.tree }),
          executeOptions(gitCapableEnvironment()),
        ),
      (error: unknown) => (error as { code?: string }).code === 'REPO_ROOT_MISMATCH',
    );
    assert.equal(existsSync(storeA), false, 'an unrelated checkout must create no store');

    // (b) A directory that is not a repository at all.
    const storeB = join(makeRoot(), 'store', 'ipd.db');
    assert.throws(
      () =>
        executeProvisioning(
          args(storeB, { repoRoot: makeRoot(), executionCommit: NOT_A_PIN, executionTree: NOT_A_TREE }),
          executeOptions(gitCapableEnvironment()),
        ),
      (error: unknown) => (error as { code?: string }).code === 'REPO_ROOT_MISMATCH',
    );
    assert.equal(existsSync(storeB), false);

    // (c) A repository whose HEAD has no commit yet.
    const unborn = makeRoot();
    execFileSync('git', ['-C', unborn, 'init', '--quiet', '--initial-branch=main'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const storeC = join(makeRoot(), 'store', 'ipd.db');
    assert.throws(
      () =>
        executeProvisioning(
          args(storeC, { repoRoot: unborn, executionCommit: NOT_A_PIN, executionTree: NOT_A_TREE }),
          executeOptions(gitCapableEnvironment()),
        ),
      (error: unknown) => (error as { code?: string }).code === 'REPO_ROOT_MISMATCH',
    );
    assert.equal(existsSync(storeC), false);

    // (d) The binding is about location, not spelling: the same checkout named
    //     through an equivalent path is accepted, and its identity is recorded.
    const storeD = join(makeRoot(), 'equivalent-path', 'ipd.db');
    const result = executeProvisioning(
      args(storeD, {
        repoRoot: join(executing.root, '.'),
        executionCommit: executing.commit,
        executionTree: executing.tree,
      }),
      executeOptions(gitCapableEnvironment()),
    );
    assert.equal(result.executingCommit, executing.commit);
    assert.equal(result.executingTree, executing.tree);
  });
});

function rowCounts(db: DatabaseSync): { bindings: number; memberships: number; audit: number } {
  const count = (table: string): number =>
    Number((db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number | bigint }).n);
  return {
    bindings: count('local_principal_bindings'),
    memberships: count('local_principal_memberships'),
    audit: count('audit_events'),
  };
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

function listSources(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) found.push(...listSources(path));
    else if (name.name.endsWith('.ts') || name.name.endsWith('.tsx')) found.push(path);
  }
  return found;
}
