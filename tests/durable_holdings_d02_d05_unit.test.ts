/**D02/D03/D05 — durable holdings unit tests, isolated synthetic fixtures.

Authority: IIPS-V3-PA-D02-D03-D05-ENGINEERING-2026-11-06-01 (adopted 2026-11-06),
D02 IIPS-V3-G2-HOLDINGS-OWNER-BINDING-2026-11-06-01, D03
IIPS-V3-G2-SNAPSHOT-CONTRACT-V2-2026-11-06-01, D05
IIPS-V3-G2-BOUNDED-SNAPSHOT-ENGINEERING-2026-11-06-01 (bounded synthetic
engineering only).

Every fixture below is SYNTHETIC and DISPOSABLE: temporary directories,
synthetic binding rows created directly in the test. No operational database,
no genuine broker evidence, no provisioning path. Synthetic results are not
native-host, genuine-broker, QE or admission evidence (H01–H12 all remain
NOT QUALIFIED); product writes remain WRITE_NOT_AUTHORIZED end to end.

These tests cover units that the existing contract/recovery suites exercise
only indirectly through IPC dispatch or DurablePortfolioStore: direct binding
resolution, source normalization, identity gating, provenance computation,
port save guard, and caller-supplied key detection.
*/

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase, closeDatabase } from '../src/persistence/connection.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import {
  resolveActiveBinding,
  resolveActiveHoldingsBinding,
  resolveD02PortfolioAccess,
  resolveD02PortfolioAccessInCurrentTransaction,
  D02RelationshipAbsentError,
  HOLDINGS_CANONICAL_OWNER_ID,
  HOLDINGS_TENANT_ID,
  BindingAbsentError,
  BindingInvalidError,
  type ActiveOwner,
} from '../src/persistence/binding.js';
import {
  evaluatePortSaveGuard,
  findCallerSuppliedIdentityKeys,
  type OwnerRef,
  type HoldingInput,
} from '../src/persistence/portfolio_store.js';
import {
  mapBrokerImportHoldings,
  evaluateBrokerImportIdentityGate,
  computeBrokerImportProvenance,
  type ResolvedBrokerImportHolding,
} from '../src/persistence/brokerImportPersistence.js';
import type { BrokerObservationResolver } from '../src/identity/broker_observation_resolver.js';
import {
  verifyD5ReadOnly,
  type D5VerificationResult,
} from '../src/persistence/d5-readonly-verifier.js';

const HOLDINGS_OWNER = HOLDINGS_CANONICAL_OWNER_ID;
const HOLDINGS_TENANT = HOLDINGS_TENANT_ID;
// Approved S1 identity values (architecture decision, D01–D02).
const S1_PRINCIPAL_LABEL = 'ramki-personal-local';
const S1_BINDING_ID = 'c5808abaffd072d6401ce63ad86c6ac0';
const S1_MEMBERSHIP_ID = 'd25dcc5370100b00766efc5166f65cf3';
const S1_MEMBERSHIP_OWNER = 'ipd-owner-ramki-personal';
const S1_OWNER = S1_MEMBERSHIP_OWNER;
const S1_TENANT = 'ipd-personal-local';

const root = mkdtempSync(join(tmpdir(), 'iips-d02-d05-unit-'));

let db: DatabaseSync | null = null;

function freshDb(name = 'fixture.db'): DatabaseSync {
  const instance = openDatabase(join(root, name));
  ensureMigrations(instance, GATE3_MIGRATIONS);
  return instance;
}

function seedBinding(
  db: DatabaseSync,
  options: {
    owner?: string;
    tenant?: string;
    bindingId?: string;
    membershipId?: string;
    status?: 'ACTIVE' | 'REVOKED';
    principalLabel?: string;
  } = {},
): ActiveOwner {
  const {
    owner = HOLDINGS_OWNER,
    tenant = HOLDINGS_TENANT,
    bindingId = 'fx-b-1',
    membershipId = 'fx-m-1',
    status = 'ACTIVE',
    principalLabel = 'fixture-operator',
  } = options;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at)
     VALUES (?, ?, ?, ?, ?, NULL)`,
  ).run(bindingId, principalLabel, status, now, now);
  db.prepare(
    `INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
  ).run(membershipId, bindingId, tenant, owner, status, now, now);
  return {
    bindingId,
    principalLabel: 'fixture-operator',
    membershipId,
    tenantId: tenant,
    canonicalOwnerId: owner,
  };
}

function revokeBinding(db: DatabaseSync): void {
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE local_principal_bindings SET status = 'REVOKED', revoked_at = ? WHERE binding_id = 'fx-b-1'`,
  ).run(now);
  db.prepare(
    `UPDATE local_principal_memberships SET status = 'REVOKED', revoked_at = ? WHERE membership_id = 'fx-m-1'`,
  ).run(now);
}

const resolvedResolver: BrokerObservationResolver = {
  resolve: (observation) => ({
    status: 'RESOLVED',
    companyId: `company-${observation.symbol}`,
    sourceRevision: 'a'.repeat(64),
  }),
};

const unresolvedResolver: BrokerObservationResolver = {
  resolve: (observation) => ({
    status: 'UNMAPPED',
    reason: 'UNMAPPED_IDENTIFIER',
    sourceRevision: 'b'.repeat(64),
  }),
};

function observedHolding(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    symbol: 'AAA',
    isin: 'INE000A01001',
    exchange: 'NSE',
    quantity: 10,
    averageBuyPrice: 100,
    currentPrice: 110,
    marketValue: 1100,
    weightPercentage: 60,
    active: true,
    sourceBroker: 'DHAN',
    ...overrides,
  };
}

function resolvedHolding(overrides: Record<string, unknown> = {}): ResolvedBrokerImportHolding {
  return {
    symbol: 'AAA',
    isin: 'INE000A01001',
    exchange: 'NSE',
    quantity: 10,
    averageBuyPrice: 100,
    currentPrice: 110,
    marketValue: 1100,
    weightPercentage: 60,
    active: true,
    sourceBroker: 'DHAN',
    lineageDigest: 'c'.repeat(64),
    companyId: 'company-AAA',
    identityStatus: 'RESOLVED',
    resolutionDisposition: 'CANONICAL_P04',
    ...overrides,
  } as ResolvedBrokerImportHolding;
}

beforeEach(() => {
  db = freshDb();
});

afterEach(() => {
  if (db) {
    closeDatabase();
    db = null;
  }
  rmSync(root, { recursive: true, force: true });
});

describe('D02 — holdings binding contract (direct resolution)', () => {
  it('resolves exactly one ACTIVE binding/membership to the holdings owner pair', () => {
    const owner = seedBinding(db!);
    const resolved = resolveActiveHoldingsBinding(db!);
    assert.equal(resolved.canonicalOwnerId, HOLDINGS_OWNER);
    assert.equal(resolved.tenantId, HOLDINGS_TENANT);
    assert.equal(resolved.bindingId, owner.bindingId);
    assert.equal(resolved.membershipId, owner.membershipId);
    assert.equal(resolved.principalLabel, 'fixture-operator');
  });

  it('pre-extension S1 owner on the same tenant fails closed', () => {
    seedBinding(db!, { owner: S1_OWNER, tenant: S1_TENANT });
    assert.throws(() => resolveActiveHoldingsBinding(db!), BindingInvalidError);
  });

  it('foreign tenant fails closed', () => {
    seedBinding(db!, { owner: HOLDINGS_OWNER, tenant: 'irr-personal-073dd1c8' });
    assert.throws(() => resolveActiveHoldingsBinding(db!), BindingInvalidError);
  });

  it('absent binding fails closed', () => {
    assert.throws(() => resolveActiveHoldingsBinding(db!), BindingAbsentError);
  });

  it('absent membership for an ACTIVE binding fails closed', () => {
    const now = new Date().toISOString();
    db!.prepare(
      `INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at)
       VALUES ('fx-b-1', 'fixture-operator', 'ACTIVE', ?, ?, NULL)`,
    ).run(now, now);
    assert.throws(() => resolveActiveHoldingsBinding(db!), BindingAbsentError);
  });

  it('revoked binding fails closed', () => {
    seedBinding(db!);
    revokeBinding(db!);
    assert.throws(() => resolveActiveHoldingsBinding(db!), BindingAbsentError);
  });

  it('multiple active bindings fail closed (storage-level partial index)', () => {
    seedBinding(db!);
    const now = new Date().toISOString();
    assert.throws(() =>
      db!.prepare(
        `INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at)
         VALUES ('fx-b-2', 'other', 'ACTIVE', ?, ?, NULL)`,
      ).run(now, now),
    );
  });

  it('resolveActiveBinding is unchanged for S1/Direct P1 (returns S1 owner)', () => {
    const owner = seedBinding(db!, { owner: S1_OWNER, tenant: S1_TENANT });
    const resolved = resolveActiveBinding(db!);
    assert.equal(resolved.canonicalOwnerId, S1_OWNER);
    assert.equal(resolved.tenantId, S1_TENANT);
    assert.equal(resolved.bindingId, owner.bindingId);
  });

  it('HOLDINGS constants match the approved D02 pair', () => {
    assert.equal(HOLDINGS_CANONICAL_OWNER_ID, 'owner-4dc756b3');
    assert.equal(HOLDINGS_TENANT_ID, 'ipd-personal-local');
  });
});

describe('D02 — relationship resolver (fail-closed until separately provisioned)', () => {
  function seedRelationshipTables(db: DatabaseSync): void {
    const now = new Date().toISOString();
    // Owner registry: approved D02 target on the retained technical tenant.
    db.prepare(
      `INSERT INTO portfolio_owner_registry (tenant_id, portfolio_owner_id, owner_kind, status, created_at, updated_at, revoked_at)
       VALUES (?, ?, 'PERSONAL_OVERALL', 'ACTIVE', ?, ?, NULL)`,
    ).run(HOLDINGS_TENANT, HOLDINGS_OWNER, now, now);
    // Relationship: S1 membership -> D02 overall owner.
    db.prepare(
      `INSERT INTO personal_identity_owner_relationships
       (relationship_id, membership_id, membership_tenant_id, owner_tenant_id, portfolio_owner_id,
        relationship_type, status, authority_record_ref, created_at, updated_at, revoked_at)
       VALUES (?, ?, ?, ?, ?, 'OVERALL_PERSONAL_PORTFOLIO_OWNER', 'ACTIVE',
        'docs/integration/IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md#d04', ?, ?, NULL)`,
    ).run(
      'fx-r-1',
      S1_MEMBERSHIP_ID,
      S1_TENANT,
      HOLDINGS_TENANT,
      HOLDINGS_OWNER,
      now,
      now,
    );
  }

  function seedRelationshipSchema(db: DatabaseSync): void {
    const now = new Date().toISOString();
    db.prepare(
      `CREATE TABLE IF NOT EXISTS portfolio_owner_registry (
        tenant_id TEXT NOT NULL,
        portfolio_owner_id TEXT NOT NULL,
        owner_kind TEXT NOT NULL CHECK (owner_kind = 'PERSONAL_OVERALL'),
        status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        revoked_at TEXT,
        PRIMARY KEY (tenant_id, portfolio_owner_id),
        CHECK ((status = 'ACTIVE' AND revoked_at IS NULL) OR
               (status = 'REVOKED' AND revoked_at IS NOT NULL))
      )`,
    ).run();
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_membership_id_tenant
       ON local_principal_memberships (membership_id, tenant_id)`,
    ).run();
    db.prepare(
      `CREATE TABLE IF NOT EXISTS personal_identity_owner_relationships (
        relationship_id TEXT NOT NULL PRIMARY KEY,
        membership_id TEXT NOT NULL,
        membership_tenant_id TEXT NOT NULL,
        owner_tenant_id TEXT NOT NULL,
        portfolio_owner_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL CHECK (relationship_type = 'OVERALL_PERSONAL_PORTFOLIO_OWNER'),
        status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
        authority_record_ref TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        revoked_at TEXT,
        CHECK (membership_tenant_id = owner_tenant_id),
        CHECK ((status = 'ACTIVE' AND revoked_at IS NULL) OR
               (status = 'REVOKED' AND revoked_at IS NOT NULL)),
        FOREIGN KEY (membership_id, membership_tenant_id)
          REFERENCES local_principal_memberships (membership_id, tenant_id) ON DELETE RESTRICT,
        FOREIGN KEY (owner_tenant_id, portfolio_owner_id)
          REFERENCES portfolio_owner_registry (tenant_id, portfolio_owner_id) ON DELETE RESTRICT
      )`,
    ).run();
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_active_relationship_per_membership
       ON personal_identity_owner_relationships (membership_id, relationship_type) WHERE status = 'ACTIVE'`,
    ).run();
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_active_membership_per_overall_owner
       ON personal_identity_owner_relationships (owner_tenant_id, portfolio_owner_id, relationship_type) WHERE status = 'ACTIVE'`,
    ).run();
  }

  function seedS1Tuple(db: DatabaseSync): void {
    seedBinding(db, {
      owner: S1_MEMBERSHIP_OWNER,
      tenant: S1_TENANT,
      bindingId: S1_BINDING_ID,
      membershipId: S1_MEMBERSHIP_ID,
      principalLabel: S1_PRINCIPAL_LABEL,
    });
  }

  it('fails closed when relationship tables are not provisioned', () => {
    // The current schema has no personal_identity_owner_relationships or
    // portfolio_owner_registry tables. Resolution must fail closed, not
    // fabricate a D02 context from the S1 tuple or the D02 constant.
    seedS1Tuple(db!);
    assert.throws(() => resolveD02PortfolioAccess(db!), D02RelationshipAbsentError);
  });

  it('resolves the distinct D02 portfolio-owner context when relationship exists', () => {
    seedRelationshipSchema(db!);
    seedS1Tuple(db!);
    seedRelationshipTables(db!);
    const access = resolveD02PortfolioAccess(db!);
    assert.equal(access.principalLabel, S1_PRINCIPAL_LABEL);
    assert.equal(access.bindingId, S1_BINDING_ID);
    assert.equal(access.membershipId, S1_MEMBERSHIP_ID);
    assert.equal(access.membershipOwnerId, S1_MEMBERSHIP_OWNER);
    assert.equal(access.tenantId, S1_TENANT);
    assert.equal(access.relationshipId, 'fx-r-1');
    assert.equal(access.portfolioOwnerId, HOLDINGS_OWNER);
    // Membership owner and portfolio owner remain strictly distinct.
    assert.notEqual(access.membershipOwnerId, access.portfolioOwnerId);
  });

  it('fails closed when S1 binding ID does not match the approved tuple', () => {
    seedRelationshipSchema(db!);
    seedBinding(db!, { owner: S1_MEMBERSHIP_OWNER, tenant: S1_TENANT });
    assert.throws(() => resolveD02PortfolioAccess(db!), D02RelationshipAbsentError);
  });

  it('fails closed when S1 principal label does not match', () => {
    seedRelationshipSchema(db!);
    seedBinding(db!, {
      owner: S1_MEMBERSHIP_OWNER,
      tenant: S1_TENANT,
      bindingId: S1_BINDING_ID,
      membershipId: S1_MEMBERSHIP_ID,
    });
    // Corrupt the principal label after seeding.
    const now = new Date().toISOString();
    db!.prepare(
      `UPDATE local_principal_bindings SET principal_label = 'wrong-principal' WHERE binding_id = ?`,
    ).run(S1_BINDING_ID);
    assert.throws(() => resolveD02PortfolioAccess(db!), D02RelationshipAbsentError);
  });

  it('fails closed when no ACTIVE relationship exists for the membership', () => {
    seedRelationshipSchema(db!);
    seedS1Tuple(db!);
    // Owner registry exists but no relationship row.
    const now = new Date().toISOString();
    db!.prepare(
      `INSERT INTO portfolio_owner_registry (tenant_id, portfolio_owner_id, owner_kind, status, created_at, updated_at, revoked_at)
       VALUES (?, ?, 'PERSONAL_OVERALL', 'ACTIVE', ?, ?, NULL)`,
    ).run(S1_TENANT, HOLDINGS_OWNER, now, now);
    assert.throws(() => resolveD02PortfolioAccess(db!), D02RelationshipAbsentError);
  });

  it('fails closed when the relationship is revoked', () => {
    seedRelationshipSchema(db!);
    seedS1Tuple(db!);
    seedRelationshipTables(db!);
    const now = new Date().toISOString();
    db!.prepare(
      `UPDATE personal_identity_owner_relationships SET status = 'REVOKED', revoked_at = ? WHERE relationship_id = 'fx-r-1'`,
    ).run(now);
    assert.throws(() => resolveD02PortfolioAccess(db!), D02RelationshipAbsentError);
  });

  it('fails closed when the owner registry is REVOKED', () => {
    seedRelationshipSchema(db!);
    seedS1Tuple(db!);
    seedRelationshipTables(db!);
    const now = new Date().toISOString();
    db!.prepare(
      `UPDATE portfolio_owner_registry SET status = 'REVOKED', revoked_at = ? WHERE tenant_id = ? AND portfolio_owner_id = ?`,
    ).run(now, S1_TENANT, HOLDINGS_OWNER);
    assert.throws(() => resolveD02PortfolioAccess(db!), D02RelationshipAbsentError);
  });

  it('fails closed when the relationship names a wrong portfolio owner', () => {
    seedRelationshipSchema(db!);
    seedS1Tuple(db!);
    const now = new Date().toISOString();
    db!.prepare(
      `INSERT INTO portfolio_owner_registry (tenant_id, portfolio_owner_id, owner_kind, status, created_at, updated_at, revoked_at)
       VALUES (?, ?, 'PERSONAL_OVERALL', 'ACTIVE', ?, ?, NULL)`,
    ).run(S1_TENANT, 'wrong-owner-12345678', now, now);
    db!.prepare(
      `INSERT INTO personal_identity_owner_relationships
       (relationship_id, membership_id, membership_tenant_id, owner_tenant_id, portfolio_owner_id,
        relationship_type, status, authority_record_ref, created_at, updated_at, revoked_at)
       VALUES ('fx-r-2', ?, ?, ?, ?, 'OVERALL_PERSONAL_PORTFOLIO_OWNER', 'ACTIVE',
        'docs/integration/IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md#d04', ?, ?, NULL)`,
    ).run(S1_MEMBERSHIP_ID, S1_TENANT, S1_TENANT, 'wrong-owner-12345678', now, now);
    assert.throws(() => resolveD02PortfolioAccess(db!), D02RelationshipAbsentError);
  });

  it('fails closed when more than one ACTIVE relationship exists', () => {
    seedRelationshipSchema(db!);
    seedS1Tuple(db!);
    seedRelationshipTables(db!);
    const now = new Date().toISOString();
    // Temporarily drop the partial unique index to simulate a corrupted or
    // legacy database where the storage-level guard is absent. The resolver's
    // cardinality check is defense in depth and must still fail closed.
    db!.prepare(`DROP INDEX IF EXISTS uq_active_relationship_per_membership`).run();
    // Second owner registry entry for a different owner.
    db!.prepare(
      `INSERT INTO portfolio_owner_registry (tenant_id, portfolio_owner_id, owner_kind, status, created_at, updated_at, revoked_at)
       VALUES (?, ?, 'PERSONAL_OVERALL', 'ACTIVE', ?, ?, NULL)`,
    ).run(S1_TENANT, 'owner-second-12345678', now, now);
    // Second active relationship for the same membership.
    db!.prepare(
      `INSERT INTO personal_identity_owner_relationships
       (relationship_id, membership_id, membership_tenant_id, owner_tenant_id, portfolio_owner_id,
        relationship_type, status, authority_record_ref, created_at, updated_at, revoked_at)
       VALUES ('fx-r-4', ?, ?, ?, ?, 'OVERALL_PERSONAL_PORTFOLIO_OWNER', 'ACTIVE',
        'docs/integration/IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md#d04', ?, ?, NULL)`,
    ).run(S1_MEMBERSHIP_ID, S1_TENANT, S1_TENANT, 'owner-second-12345678', now, now);
    assert.throws(() => resolveD02PortfolioAccess(db!), D02RelationshipAbsentError);
  });

  it('resolveD02PortfolioAccessInCurrentTransaction requires an active transaction', () => {
    seedRelationshipSchema(db!);
    seedS1Tuple(db!);
    assert.throws(() =>
      resolveD02PortfolioAccessInCurrentTransaction(db!),
      /requires an active transaction/,
    );
  });
});

describe('D03 — port save guard and caller-supplied key detection', () => {
  it('evaluatePortSaveGuard with no context returns default deny', () => {
    const decision = evaluatePortSaveGuard(undefined);
    assert.equal(decision.authorized, false);
    assert.ok(decision.reasons.some((r) => r.includes('Gate 4')));
    assert.ok(decision.reasons.some((r) => r.includes('Gate 5')));
  });

  it('evaluatePortSaveGuard with env switch but no binding context returns default deny', () => {
    const decision = evaluatePortSaveGuard({
      env: { IIPS_LOCAL_PERSONAL_USE: '1' },
    });
    assert.equal(decision.authorized, false);
    assert.ok(decision.reasons.some((r) => r.includes('no validated principal')));
  });

  it('evaluatePortSaveGuard with env switch and binding context authorizes', () => {
    const decision = evaluatePortSaveGuard({
      env: { IIPS_LOCAL_PERSONAL_USE: '1' },
      canonicalOwnerId: HOLDINGS_OWNER,
      tenantId: HOLDINGS_TENANT,
    });
    assert.equal(decision.authorized, true);
    assert.ok(decision.reasons.some((r) => r.includes('personal-local authorization')));
  });

  it('findCallerSuppliedIdentityKeys detects top-level identity keys', () => {
    const found = findCallerSuppliedIdentityKeys({ owner: 'attacker', payload: {} });
    assert.ok(found.includes('owner'));
  });

  it('findCallerSuppliedIdentityKeys detects nested identity keys', () => {
    const found = findCallerSuppliedIdentityKeys({
      payload: { holdings: [{ owner: 'attacker-in-nested' }] },
    });
    assert.ok(found.includes('owner'));
  });

  it('findCallerSuppliedIdentityKeys returns empty for clean objects', () => {
    const found = findCallerSuppliedIdentityKeys({
      portfolioId: 'portfolio-1',
      expectedRevision: 1,
      holdings: [{ symbol: 'AAA', sourceBroker: 'DHAN', lineageDigest: 'c'.repeat(64) }],
    });
    assert.equal(found.length, 0);
  });
});

describe('D05 — source normalization and identity gating', () => {
  it('mapBrokerImportHoldings preserves resolved identity fields', () => {
    const resolved = [resolvedHolding()];
    const holdings = mapBrokerImportHoldings(resolved);
    assert.equal(holdings.length, 1);
    assert.equal(holdings[0].symbol, 'AAA');
    assert.equal(holdings[0].companyId, 'company-AAA');
    assert.equal(holdings[0].identityStatus, 'RESOLVED');
    assert.equal(holdings[0].resolutionDisposition, 'CANONICAL_P04');
    assert.equal(holdings[0].sourceBroker, 'DHAN');
    assert.equal(typeof holdings[0].lineageDigest, 'string');
    assert.equal(holdings[0].lineageDigest.length, 64);
  });

  it('mapBrokerImportHoldings keeps securityIdentity null when inputs are absent', () => {
    const resolved = [resolvedHolding()];
    const holdings = mapBrokerImportHoldings(resolved, {});
    assert.equal(holdings[0].securityIdentity, null);
  });

  it('mapBrokerImportHoldings sorts holdings by symbol', () => {
    const resolved = [
      resolvedHolding({ symbol: 'ZZZ', companyId: 'company-ZZZ' }),
      resolvedHolding({ symbol: 'AAA', companyId: 'company-AAA' }),
      resolvedHolding({ symbol: 'MMM', companyId: 'company-MMM' }),
    ];
    const holdings = mapBrokerImportHoldings(resolved);
    assert.equal(holdings[0].symbol, 'AAA');
    assert.equal(holdings[1].symbol, 'MMM');
    assert.equal(holdings[2].symbol, 'ZZZ');
  });

  it('evaluateBrokerImportIdentityGate returns saveable when all resolved', () => {
    const gate = evaluateBrokerImportIdentityGate(
      [observedHolding() as unknown as never, observedHolding({ symbol: 'BBB', isin: 'INE000B01002', marketValue: 2200, weightPercentage: 40 }) as unknown as never],
      resolvedResolver,
    );
    assert.equal(gate.saveable, true);
    assert.equal(gate.assessments.length, 2);
    assert.equal(gate.refusedHoldings.length, 0);
  });

  it('evaluateBrokerImportIdentityGate refuses when resolver is unresolved', () => {
    const gate = evaluateBrokerImportIdentityGate(
      [observedHolding() as unknown as never, observedHolding({ symbol: 'BBB', isin: 'INE000B01002' }) as unknown as never],
      unresolvedResolver,
    );
    assert.equal(gate.saveable, false);
    assert.equal(gate.refusedHoldings.length, 2);
  });

  it('computeBrokerImportProvenance is deterministic', () => {
    const request = {
      portfolioId: 'portfolio-1',
      expectedRevision: 1,
      holdings: [
        { symbol: 'AAA', isin: 'INE000A01001', exchange: 'NSE', quantity: 10, averageBuyPrice: 100, currentPrice: 110, marketValue: 1100, weightPercentage: 60, active: true, sourceBroker: 'DHAN', lineageDigest: 'c'.repeat(64) },
      ],
      contentDigest: 'd'.repeat(64),
      fileName: 'file.csv',
      sourceBroker: 'DHAN',
      importedAt: '2026-11-06T03:30:00.000Z',
    };
    const first = computeBrokerImportProvenance(request as never);
    const second = computeBrokerImportProvenance(request as never);
    assert.equal(first, second);
    assert.equal(first.length, 64);
    assert.ok(/^[a-f0-9]{64}$/.test(first));
  });

  it('computeBrokerImportProvenance changes when holdings change', () => {
    const base = {
      portfolioId: 'portfolio-1',
      expectedRevision: 1,
      holdings: [
        { symbol: 'AAA', isin: 'INE000A01001', exchange: 'NSE', quantity: 10, averageBuyPrice: 100, currentPrice: 110, marketValue: 1100, weightPercentage: 60, active: true, sourceBroker: 'DHAN', lineageDigest: 'c'.repeat(64) },
      ],
      contentDigest: 'd'.repeat(64),
      fileName: 'file.csv',
      sourceBroker: 'DHAN',
      importedAt: '2026-11-06T03:30:00.000Z',
    };
    const first = computeBrokerImportProvenance(base as never);
    const second = computeBrokerImportProvenance({
      ...base,
      holdings: [
        ...base.holdings,
        { symbol: 'BBB', isin: 'INE000B01002', exchange: 'NSE', quantity: 5, averageBuyPrice: 200, currentPrice: 220, marketValue: 1100, weightPercentage: 40, active: true, sourceBroker: 'DHAN', lineageDigest: 'e'.repeat(64) },
      ],
    } as never);
    assert.notEqual(first, second);
  });
});

describe('D05 — owner type exports', () => {
  it('OwnerRef and HoldingInput types are structurally sound', () => {
    const owner: OwnerRef = { canonicalOwnerId: HOLDINGS_OWNER, tenantId: HOLDINGS_TENANT };
    assert.equal(owner.canonicalOwnerId, HOLDINGS_OWNER);
    assert.equal(owner.tenantId, HOLDINGS_TENANT);

    const holding: HoldingInput = {
      symbol: 'AAA',
      companyId: 'company-AAA',
      quantity: 10,
      averageBuyPrice: 100,
      currentPrice: 110,
      marketValue: 1100,
      weightPercentage: 60,
      active: true,
      sourceBroker: 'DHAN',
      lineageDigest: 'c'.repeat(64),
      identityStatus: 'RESOLVED',
      resolutionDisposition: 'CANONICAL_P04',
    };
    assert.equal(holding.securityIdentity, undefined);
    assert.equal(holding.active, true);
  });
});

describe('D5 — read-only verifier (D21 Level D scope)', () => {
  // Approved S1 identity values (architecture decision, D01–D02), matching binding.ts.
  const D5_S1_PRINCIPAL_LABEL = 'ramki-personal-local';
  const D5_S1_BINDING_ID = 'c5808abaffd072d6401ce63ad86c6ac0';
  const D5_S1_MEMBERSHIP_ID = 'd25dcc5370100b00766efc5166f65cf3';
  const D5_S1_MEMBERSHIP_OWNER = 'ipd-owner-ramki-personal';
  const D5_S1_TENANT_ID = 'ipd-personal-local';
  const D5_D02_PORTFOLIO_OWNER_ID = 'owner-4dc756b3';

  function seedRelationshipSchemaAndS1(db: DatabaseSync): void {
    const now = new Date().toISOString();
    // Owner registry: approved D02 target on the retained technical tenant.
    db.prepare(
      `INSERT INTO portfolio_owner_registry (tenant_id, portfolio_owner_id, owner_kind, status, created_at, updated_at, revoked_at)
       VALUES (?, ?, 'PERSONAL_OVERALL', 'ACTIVE', ?, ?, NULL)`,
    ).run(D5_S1_TENANT_ID, D5_D02_PORTFOLIO_OWNER_ID, now, now);
    // Relationship: S1 membership -> D02 overall owner.
    db.prepare(
      `INSERT INTO personal_identity_owner_relationships
       (relationship_id, membership_id, membership_tenant_id, owner_tenant_id, portfolio_owner_id,
        relationship_type, status, authority_record_ref, created_at, updated_at, revoked_at)
       VALUES (?, ?, ?, ?, ?, 'OVERALL_PERSONAL_PORTFOLIO_OWNER', 'ACTIVE',
        'docs/integration/IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md#d04', ?, ?, NULL)`,
    ).run(
      'fx-r-1',
      D5_S1_MEMBERSHIP_ID,
      D5_S1_TENANT_ID,
      D5_S1_TENANT_ID,
      D5_D02_PORTFOLIO_OWNER_ID,
      now,
      now,
    );
  }

  function seedRelationshipSchema(db: DatabaseSync): void {
    const now = new Date().toISOString();
    db.prepare(
      `CREATE TABLE IF NOT EXISTS portfolio_owner_registry (
        tenant_id TEXT NOT NULL,
        portfolio_owner_id TEXT NOT NULL,
        owner_kind TEXT NOT NULL CHECK (owner_kind = 'PERSONAL_OVERALL'),
        status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        revoked_at TEXT,
        PRIMARY KEY (tenant_id, portfolio_owner_id),
        CHECK ((status = 'ACTIVE' AND revoked_at IS NULL) OR
               (status = 'REVOKED' AND revoked_at IS NOT NULL))
      )`,
    ).run();
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_membership_id_tenant
       ON local_principal_memberships (membership_id, tenant_id)`,
    ).run();
    db.prepare(
      `CREATE TABLE IF NOT EXISTS personal_identity_owner_relationships (
        relationship_id TEXT NOT NULL PRIMARY KEY,
        membership_id TEXT NOT NULL,
        membership_tenant_id TEXT NOT NULL,
        owner_tenant_id TEXT NOT NULL,
        portfolio_owner_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL CHECK (relationship_type = 'OVERALL_PERSONAL_PORTFOLIO_OWNER'),
        status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
        authority_record_ref TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        revoked_at TEXT,
        CHECK (membership_tenant_id = owner_tenant_id),
        CHECK ((status = 'ACTIVE' AND revoked_at IS NULL) OR
               (status = 'REVOKED' AND revoked_at IS NOT NULL)),
        FOREIGN KEY (membership_id, membership_tenant_id)
          REFERENCES local_principal_memberships (membership_id, tenant_id) ON DELETE RESTRICT,
        FOREIGN KEY (owner_tenant_id, portfolio_owner_id)
          REFERENCES portfolio_owner_registry (tenant_id, portfolio_owner_id) ON DELETE RESTRICT
      )`,
    ).run();
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_active_relationship_per_membership
       ON personal_identity_owner_relationships (membership_id, relationship_type) WHERE status = 'ACTIVE'`,
    ).run();
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_active_membership_per_overall_owner
       ON personal_identity_owner_relationships (owner_tenant_id, portfolio_owner_id, relationship_type) WHERE status = 'ACTIVE'`,
    ).run();
  }

  function captureRowCounts(db: DatabaseSync): Record<string, number> {
    const tables = [
      'local_principal_bindings',
      'local_principal_memberships',
      'portfolio_owner_registry',
      'personal_identity_owner_relationships',
    ];
    const counts: Record<string, number> = {};
    for (const table of tables) {
      try {
        const row = db
          .prepare(`SELECT COUNT(*) AS n FROM ${table}`)
          .get() as unknown as { n: number };
        counts[table] = row.n;
      } catch {
        counts[table] = -1; // table does not exist
      }
    }
    return counts;
  }

  it('verifier passes when S1 tuple and D02 relationship match approved values', () => {
    seedBinding(db!, {
      owner: D5_S1_MEMBERSHIP_OWNER,
      tenant: D5_S1_TENANT_ID,
      bindingId: D5_S1_BINDING_ID,
      membershipId: D5_S1_MEMBERSHIP_ID,
      principalLabel: D5_S1_PRINCIPAL_LABEL,
    });
    seedRelationshipSchema(db!);
    seedRelationshipSchemaAndS1(db!);

    const result = verifyD5ReadOnly(db!);
    assert.ok(result.passed, `verifier should pass: ${result.error ?? JSON.stringify(result.evidence)}`);
    assert.equal(result.s1Tuple?.bindingId, D5_S1_BINDING_ID);
    assert.equal(result.s1Tuple?.principalLabel, D5_S1_PRINCIPAL_LABEL);
    assert.equal(result.s1Tuple?.membershipId, D5_S1_MEMBERSHIP_ID);
    assert.equal(result.s1Tuple?.tenantId, D5_S1_TENANT_ID);
    assert.equal(result.s1Tuple?.canonicalOwnerId, D5_S1_MEMBERSHIP_OWNER);
    assert.equal(result.d02Relationship?.portfolioOwnerId, D5_D02_PORTFOLIO_OWNER_ID);
    assert.ok(result.evidence.some((e) => e.step === 'd02-relationship-resolution' && e.passed));
    assert.ok(result.evidence.some((e) => e.step === 's1-tuple-fields-verification' && e.passed));
  });

  it('verifier fails closed when relationship tables are not provisioned', () => {
    seedBinding(db!, {
      owner: D5_S1_MEMBERSHIP_OWNER,
      tenant: D5_S1_TENANT_ID,
      bindingId: D5_S1_BINDING_ID,
      membershipId: D5_S1_MEMBERSHIP_ID,
      principalLabel: D5_S1_PRINCIPAL_LABEL,
    });

    const result = verifyD5ReadOnly(db!);
    assert.ok(!result.passed, 'verifier should fail when D02 relationship tables are absent');
    assert.ok(result.error !== null);
    assert.ok(result.s1Tuple === null);
    assert.ok(result.d02Relationship === null);
  });

  it('verifier fails closed on wrong portfolio owner', () => {
    const now = new Date().toISOString();
    seedBinding(db!, {
      owner: D5_S1_MEMBERSHIP_OWNER,
      tenant: D5_S1_TENANT_ID,
      bindingId: D5_S1_BINDING_ID,
      membershipId: D5_S1_MEMBERSHIP_ID,
      principalLabel: D5_S1_PRINCIPAL_LABEL,
    });
    seedRelationshipSchema(db!);
    db!.prepare(
      `INSERT INTO portfolio_owner_registry (tenant_id, portfolio_owner_id, owner_kind, status, created_at, updated_at, revoked_at)
       VALUES (?, ?, 'PERSONAL_OVERALL', 'ACTIVE', ?, ?, NULL)`,
    ).run(D5_S1_TENANT_ID, 'wrong-owner-12345678', now, now);
    db!.prepare(
      `INSERT INTO personal_identity_owner_relationships
       (relationship_id, membership_id, membership_tenant_id, owner_tenant_id, portfolio_owner_id,
        relationship_type, status, authority_record_ref, created_at, updated_at, revoked_at)
       VALUES ('fx-r-2', ?, ?, ?, ?, 'OVERALL_PERSONAL_PORTFOLIO_OWNER', 'ACTIVE',
        'docs/integration/IPD-D02-PROGRAM-AUTHORITY-DECISION-PACKAGE-2026-11-16.md#d04', ?, ?, NULL)`,
    ).run(D5_S1_MEMBERSHIP_ID, D5_S1_TENANT_ID, D5_S1_TENANT_ID, 'wrong-owner-12345678', now, now);

    const result = verifyD5ReadOnly(db!);
    assert.ok(!result.passed, 'verifier should fail on wrong portfolio owner');
    assert.ok(result.error !== null, 'verifier should record an error');
  });

  it('verifier fails closed on wrong tenant', () => {
    const now = new Date().toISOString();
    // Seed membership with wrong tenant — resolver's S1 tenant check fails closed.
    // No relationship tables needed: resolution fails at the S1 tuple check.
    seedBinding(db!, {
      owner: D5_S1_MEMBERSHIP_OWNER,
      tenant: 'wrong-tenant-12345678',
      bindingId: D5_S1_BINDING_ID,
      membershipId: D5_S1_MEMBERSHIP_ID,
      principalLabel: D5_S1_PRINCIPAL_LABEL,
    });

    const result = verifyD5ReadOnly(db!);
    assert.ok(!result.passed, 'verifier should fail on wrong tenant');
    assert.ok(result.error !== null, 'verifier should record an error');
  });

  it('verifier fails closed when no ACTIVE binding exists', () => {
    seedRelationshipSchema(db!);
    // No binding or membership seeded — relationship tables exist but are empty.

    const result = verifyD5ReadOnly(db!);
    assert.ok(!result.passed, 'verifier should fail when no ACTIVE binding exists');
    assert.ok(result.error !== null, 'verifier should record an error');
  });

  it('verifier proves read-only integrity — database contents unchanged after verification', () => {
    seedBinding(db!, {
      owner: D5_S1_MEMBERSHIP_OWNER,
      tenant: D5_S1_TENANT_ID,
      bindingId: D5_S1_BINDING_ID,
      membershipId: D5_S1_MEMBERSHIP_ID,
      principalLabel: D5_S1_PRINCIPAL_LABEL,
    });
    seedRelationshipSchema(db!);
    seedRelationshipSchemaAndS1(db!);

    const before = captureRowCounts(db!);
    const result = verifyD5ReadOnly(db!);
    const after = captureRowCounts(db!);

    assert.deepEqual(before, after, 'verifier must not modify any table row counts');
    assert.ok(result.passed, `verifier should pass: ${result.error ?? JSON.stringify(result.evidence)}`);
  });

  it('verifier evidence covers all five acceptance predicates', () => {
    seedBinding(db!, {
      owner: D5_S1_MEMBERSHIP_OWNER,
      tenant: D5_S1_TENANT_ID,
      bindingId: D5_S1_BINDING_ID,
      membershipId: D5_S1_MEMBERSHIP_ID,
      principalLabel: D5_S1_PRINCIPAL_LABEL,
    });
    seedRelationshipSchema(db!);
    seedRelationshipSchemaAndS1(db!);

    const result = verifyD5ReadOnly(db!);
    const steps = result.evidence.map((e) => e.step);
    assert.ok(steps.includes('d02-relationship-resolution'));
    assert.ok(steps.includes('d02-owner-tenant-validation'));
    assert.ok(steps.includes('s1-tuple-fields-verification'));
    assert.ok(steps.includes('membership-owner-distinct-from-portfolio-owner'));
    assert.ok(steps.includes('d02-vs-holdings-domain-separation'));
    assert.ok(steps.includes('binding-membership-cardinality-check'));
    assert.ok(result.passed);
  });
});
