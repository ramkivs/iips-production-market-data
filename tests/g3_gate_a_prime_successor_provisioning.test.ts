/**
 * CAP-02 — Gate A′ successor implementation and validation boundary.
 *
 * These tests exercise the inert, published state: the exact act is effective,
 * the entrypoint is bounded, and the three identity constants remain null, so
 * no provisioning call can create a store or row on this branch.
 */
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appendAuditEvent } from '../src/persistence/audit.js';
import { closeDatabase, openDatabase } from '../src/persistence/connection.js';
import {
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
      principalLabel: 'ipd-principal-not-selected',
      tenantId: 'ipd-tenant-not-selected',
      canonicalOwnerId: 'ipd-owner-not-selected',
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

  it('T-2 and T-4 keep unresolved identity values fail-closed and inert', () => {
    assert.equal(PRINCIPAL_LABEL, null);
    assert.equal(TENANT_ID, null);
    assert.equal(CANONICAL_OWNER_ID, null);
    const store = join(makeRoot(), 'store', 'ipd.db');
    assert.throws(
      () => executeProvisioning(args(store), { platform: 'win32', nodeVersion: '22.22.3', env: {} }),
      (error: unknown) => (error as { code?: string }).code === 'IDENTITY_VALUES_UNRESOLVED',
    );
    assert.equal(existsSync(store), false);
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
