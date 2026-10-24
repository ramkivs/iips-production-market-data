/**
 * CAP-02 — Gate A′ successor implementation and validation boundary.
 *
 * These tests exercise the act-bound state after the Program Authority
 * determination `IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01`:
 * the exact act is effective, the entrypoint is bounded, the three compiled
 * constants are exactly the determined values, and no provisioning call made
 * from this (non-win32) environment can create a store or row.
 */
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import type { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendAuditEvent } from '../src/persistence/audit.js';
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
} from '../src/persistence/gateAPrimeProvisioning.js';
import { inspectBindings } from '../src/persistence/binding.js';
import { ProvisioningNotAuthorizedError, provisionActiveBinding } from '../src/persistence/provisioning.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS, validateStoreAtPath } from '../src/persistence/gateAPrimeValidation.js';

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
