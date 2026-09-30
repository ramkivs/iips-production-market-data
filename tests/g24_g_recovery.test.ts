/**
 * Institutional Investment Platform System (IIPS)
 * G24 — Recovery Tests (NP04-G24 / §17)
 *
 * Covers: process restart, database survives restart, migration state survives
 * restart, no fallback to in-memory state.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { initializePersistenceWithConfig } from '../src/persistence/bootstrap.js';
import { temporaryPersistenceConfig } from '../src/persistence/config.js';
import { readAppliedMigrations, readSchemaVersion } from '../src/persistence/migrations/index.js';
import { DurablePortfolioStore } from '../src/portfolio/durable-store.js';
import { IdentityService } from '../src/app_identity/service.js';
import { closeTestPersistence, dhanBatch, tempDatabasePath, zerodhaBatch } from './g24_test_support.js';

const ACTOR = { actor: 'g24-recovery-test' };
const ISSUER = 'https://keycloak.test/realms/ipd';

test('G24-G1: the database and all portfolio revisions survive a process restart', () => {
  const databasePath = tempDatabasePath('g1');
  let applicationUserId: string;
  let digestAfterMerge: string;
  let valueAfterMerge: number;

  const first = initializePersistenceWithConfig(temporaryPersistenceConfig(databasePath));
  try {
    const identity = new IdentityService(first.connection);
    const { mapping, applicationUser } = identity.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject: 'user-g1',
      actor: ACTOR.actor,
    });
    identity.approveMapping(mapping.mappingId, ACTOR);
    identity.activateMapping(mapping.mappingId, ACTOR);
    identity.provisionTenantMembership({
      applicationUserId: applicationUser.applicationUserId,
      tenantId: 'TENANT-G1',
      actor: ACTOR.actor,
    });
    applicationUserId = applicationUser.applicationUserId;

    const store = new DurablePortfolioStore(first.connection);
    store.createPortfolio({ applicationUserId, tenantId: 'TENANT-G1', portfolioId: 'P-G1' });
    store.saveHoldings({
      applicationUserId,
      tenantId: 'TENANT-G1',
      portfolioId: 'P-G1',
      holdings: dhanBatch(),
      options: { mode: 'MERGE', contentDigest: 'd-g1-a' },
    });
    const merged = store.saveHoldings({
      applicationUserId,
      tenantId: 'TENANT-G1',
      portfolioId: 'P-G1',
      holdings: zerodhaBatch(),
      options: { mode: 'MERGE', contentDigest: 'd-g1-b' },
    });
    digestAfterMerge = merged.provenanceDigest;
    valueAfterMerge = merged.totalMarketValue;
  } finally {
    closeTestPersistence(first);
  }

  const second = initializePersistenceWithConfig(temporaryPersistenceConfig(databasePath));
  try {
    const store = new DurablePortfolioStore(second.connection);
    const portfolio = store.getPortfolio({
      applicationUserId,
      tenantId: 'TENANT-G1',
      portfolioId: 'P-G1',
    });

    assert.equal(portfolio.revision, 2);
    assert.equal(portfolio.holdings.length, 3);
    assert.equal(portfolio.totalMarketValue, valueAfterMerge);
    assert.equal(portfolio.provenanceDigest, digestAfterMerge);

    const history = store.revisionHistory({
      applicationUserId,
      tenantId: 'TENANT-G1',
      portfolioId: 'P-G1',
    });
    assert.equal(history.length, 3);
    assert.deepEqual(
      history.map((h) => h.operation),
      ['INITIAL', 'MERGE', 'MERGE']
    );
  } finally {
    closeTestPersistence(second);
  }
});

test('G24-G2: migration state survives restart and is never re-applied', () => {
  const databasePath = tempDatabasePath('g2');

  const first = initializePersistenceWithConfig(temporaryPersistenceConfig(databasePath));
  try {
    assert.deepEqual(first.startup.migrationsApplied, ['001']);
    assert.equal(readSchemaVersion(first.connection), '001');
  } finally {
    closeTestPersistence(first);
  }

  const second = initializePersistenceWithConfig(temporaryPersistenceConfig(databasePath));
  try {
    assert.deepEqual(second.startup.migrationsApplied, []);
    assert.equal(second.startup.schemaVersion, '001');
    const applied = readAppliedMigrations(second.connection);
    assert.equal(applied.length, 1);
  } finally {
    closeTestPersistence(second);
  }
});

test('G24-G3: there is no in-memory fallback — state is only ever read from the durable file', () => {
  const databasePath = tempDatabasePath('g3');

  const first = initializePersistenceWithConfig(temporaryPersistenceConfig(databasePath));
  let applicationUserId: string;
  try {
    const identity = new IdentityService(first.connection);
    const { mapping, applicationUser } = identity.provisionExternalIdentityMapping({
      issuer: ISSUER,
      subject: 'user-g3',
      actor: ACTOR.actor,
    });
    identity.approveMapping(mapping.mappingId, ACTOR);
    identity.activateMapping(mapping.mappingId, ACTOR);
    identity.provisionTenantMembership({
      applicationUserId: applicationUser.applicationUserId,
      tenantId: 'TENANT-G3',
      actor: ACTOR.actor,
    });
    applicationUserId = applicationUser.applicationUserId;

    const store = new DurablePortfolioStore(first.connection);
    store.createPortfolio({ applicationUserId, tenantId: 'TENANT-G3', portfolioId: 'P-G3' });
    store.saveHoldings({
      applicationUserId,
      tenantId: 'TENANT-G3',
      portfolioId: 'P-G3',
      holdings: dhanBatch(),
      options: { mode: 'MERGE', contentDigest: 'd-g3' },
    });
  } finally {
    closeTestPersistence(first);
  }

  // After shutdown, the closed handle yields no data and raises fail-closed errors.
  assert.equal(first.isOpen, false);
  assert.throws(() => first.connection.prepare('SELECT 1'));

  // A DIFFERENT database path is empty: proves nothing was retained in memory.
  const otherPath = tempDatabasePath('g3b');
  const other = initializePersistenceWithConfig(temporaryPersistenceConfig(otherPath));
  try {
    const identity = new IdentityService(other.connection);
    assert.throws(
      () => identity.resolveExternalIdentity(ISSUER, 'user-g3'),
      (error: unknown) => (error as { code?: string }).code === 'IDENTITY_NOT_MAPPED'
    );
  } finally {
    closeTestPersistence(other);
  }

  // The original file still holds the data.
  const reopened = initializePersistenceWithConfig(temporaryPersistenceConfig(databasePath));
  try {
    const store = new DurablePortfolioStore(reopened.connection);
    const portfolio = store.getPortfolio({
      applicationUserId,
      tenantId: 'TENANT-G3',
      portfolioId: 'P-G3',
    });
    assert.equal(portfolio.holdings.length, 2, 'data must come from the durable file, not memory');
  } finally {
    closeTestPersistence(reopened);
  }
});

test('G24-G4: the durable database file is IPD-owned and persists on disk', () => {
  const databasePath = tempDatabasePath('g4');
  const handle = initializePersistenceWithConfig(temporaryPersistenceConfig(databasePath));
  try {
    assert.ok(fs.existsSync(databasePath), 'the database file must exist on disk');
    assert.equal(path.isAbsolute(databasePath), true, 'the path must be absolute');
    assert.ok(fs.statSync(databasePath).size > 0, 'the database file must be non-empty');
  } finally {
    closeTestPersistence(handle);
  }
});
