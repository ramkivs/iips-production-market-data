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

const HOLDINGS_OWNER = HOLDINGS_CANONICAL_OWNER_ID;
const HOLDINGS_TENANT = HOLDINGS_TENANT_ID;
const S1_OWNER = 'ipd-owner-ramki-personal';
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
  } = {},
): ActiveOwner {
  const {
    owner = HOLDINGS_OWNER,
    tenant = HOLDINGS_TENANT,
    bindingId = 'fx-b-1',
    membershipId = 'fx-m-1',
    status = 'ACTIVE',
  } = options;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at)
     VALUES (?, 'fixture-operator', ?, ?, ?, NULL)`,
  ).run(bindingId, status, now, now);
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
