/**
 * Institutional Investment Platform System (IIPS)
 * G24 — Phase C / Phase J Portfolio Durability Tests (NP04-G24 / §17)
 *
 * Covers: save, read, MERGE, REPLACE, RESET, DELETE/tombstone, revision
 * conflict, restart persistence, idempotency, provenance/lineage.
 *
 * The parity tests execute the SAME scenario against the certified in-memory
 * PortfolioStore (unmodified) and the durable store, proving the durable
 * implementation preserves existing domain semantics rather than replacing them.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { DurablePortfolioStore } from '../src/portfolio/durable-store.js';
import { IdentityService } from '../src/app_identity/service.js';
import { RevisionConflictError } from '../src/persistence/index.js';
import { ResourceNotFoundError } from '../src/persistence/errors.js';
import { PortfolioStore } from '../frontend/src/features/portfolio/portfolio-store.js';
import type { UserHoldingInput } from '../frontend/src/features/portfolio/import/types.js';
import {
  closeTestPersistence,
  dhanBatch,
  openTestPersistence,
  tempDatabasePath,
  weightedBatch,
  zerodhaBatch,
} from './g24_test_support.js';
import { initializePersistenceWithConfig } from '../src/persistence/bootstrap.js';
import { temporaryPersistenceConfig } from '../src/persistence/config.js';

const ACTOR = { actor: 'g24-test-harness', context: 'NP04-G24 unit test' };

interface Fixture {
  store: DurablePortfolioStore;
  close: () => void;
  applicationUserId: string;
  tenantId: string;
}

function provision(): Fixture {
  const handle = openTestPersistence('c');
  const identity = new IdentityService(handle.connection);
  const mapping = identity.provisionExternalIdentityMapping({
    issuer: 'https://issuer.test/realms/ipd',
    subject: 'user-subject-c',
    actor: ACTOR.actor,
  });
  identity.approveMapping(mapping.mapping.mappingId, ACTOR);
  identity.activateMapping(mapping.mapping.mappingId, ACTOR);
  identity.provisionTenantMembership({
    applicationUserId: mapping.applicationUser.applicationUserId,
    tenantId: 'TENANT-C',
    actor: ACTOR.actor,
  });

  return {
    store: new DurablePortfolioStore(handle.connection),
    close: () => closeTestPersistence(handle),
    applicationUserId: mapping.applicationUser.applicationUserId,
    tenantId: 'TENANT-C',
  };
}

function sortHoldings(holdings: readonly UserHoldingInput[]): UserHoldingInput[] {
  return [...holdings].sort((a, b) => a.companyId.localeCompare(b.companyId));
}

test('G24-C1: a created portfolio starts at revision 0 and is unsaved', () => {
  const fixture = provision();
  try {
    const created = fixture.store.createPortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C1',
      portfolioName: 'Institutional Flagship Portfolio',
    });
    assert.equal(created.revision, 0);
    assert.equal(created.holdings.length, 0);
    assert.equal(created.isSaved, false);
    assert.equal(created.totalMarketValue, 0);
  } finally {
    fixture.close();
  }
});

test('G24-C2: an initial batch save creates revision 1 and persists holdings', () => {
  const fixture = provision();
  try {
    fixture.store.createPortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C2',
    });

    const result = fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C2',
      holdings: dhanBatch(),
      options: {
        mode: 'MERGE',
        sourceBroker: 'DHAN',
        fileName: 'dhan.csv',
        contentDigest: 'digest-c2-dhan',
        lineageDigest: 'lineage-c2-dhan',
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.disposition, 'SAVED_NEW_BATCH');
    assert.equal(result.revision, 1);
    assert.equal(result.holdingsSavedCount, 2);
    assert.equal(result.portfolio.isSaved, true);
    assert.ok(result.provenanceDigest.length > 0);

    const reread = fixture.store.getPortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C2',
    });
    assert.equal(reread.revision, 1);
    assert.equal(reread.holdings.length, 2);
    assert.equal(reread.totalMarketValue, result.totalMarketValue);
  } finally {
    fixture.close();
  }
});

test('G24-C3: MERGE consolidates by canonical companyId and creates a new revision', () => {
  const fixture = provision();
  try {
    fixture.store.createPortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C3',
    });

    fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C3',
      holdings: dhanBatch(),
      options: { mode: 'MERGE', sourceBroker: 'DHAN', contentDigest: 'd-c3-a' },
    });

    const merged = fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C3',
      holdings: zerodhaBatch(),
      options: { mode: 'MERGE', sourceBroker: 'ZERODHA', contentDigest: 'd-c3-b' },
    });

    assert.equal(merged.disposition, 'MERGED_INTO_EXISTING');
    assert.equal(merged.revision, 2);
    assert.equal(merged.holdingsSavedCount, 3, 'RELIANCE merged, INFY added, TCS preserved');

    const reliance = merged.portfolio.holdings.find((h) => h.companyId === 'CMP-RELIANCE')!;
    assert.equal(reliance.quantity, 15, 'quantity must be summed across brokers');

    // Volume-weighted average cost: (10*2500 + 5*2700) / 15 = 2566.666...
    const expectedAverage = (10 * 2500 + 5 * 2700) / 15;
    assert.ok(
      Math.abs(reliance.averageBuyPrice - expectedAverage) < 1e-9,
      'cost basis must be aggregated and volume-weighted'
    );

    const weightSum = merged.portfolio.holdings.reduce((s, h) => s + h.weightPercentage, 0);
    assert.ok(Math.abs(weightSum - 100.0) < 1e-9, 'merged weights must sum to 100.0000%');
  } finally {
    fixture.close();
  }
});

test('G24-C4: REPLACE creates a new authoritative revision', () => {
  const fixture = provision();
  try {
    fixture.store.createPortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C4',
    });

    fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C4',
      holdings: dhanBatch(),
      options: { mode: 'MERGE', sourceBroker: 'DHAN', contentDigest: 'd-c4-a' },
    });

    const replaced = fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C4',
      holdings: zerodhaBatch(),
      options: { mode: 'REPLACE', sourceBroker: 'ZERODHA', contentDigest: 'd-c4-b' },
    });

    assert.equal(replaced.revision, 2);
    assert.equal(replaced.holdingsSavedCount, 2, 'REPLACE discards the prior holding set');
    const symbols = replaced.portfolio.holdings.map((h) => h.symbol).sort();
    assert.deepEqual(symbols, ['INFY', 'RELIANCE']);
  } finally {
    fixture.close();
  }
});

test('G24-C5: duplicate content is a durable no-op (no revision written)', () => {
  const fixture = provision();
  try {
    fixture.store.createPortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C5',
    });

    const options = {
      mode: 'MERGE' as const,
      sourceBroker: 'DHAN' as const,
      fileName: 'dhan.csv',
      contentDigest: 'digest-c5-repeat',
      lineageDigest: 'lineage-c5',
    };

    const first = fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C5',
      holdings: dhanBatch(),
      options,
    });
    assert.equal(first.revision, 1);

    const repeat = fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C5',
      holdings: dhanBatch(),
      options,
    });

    assert.equal(repeat.success, true);
    assert.equal(repeat.isDuplicate, true);
    assert.equal(repeat.disposition, 'ALREADY_IMPORTED_NO_OP');
    assert.equal(repeat.revision, 1, 'no new revision may be written for duplicate content');

    const history = fixture.store.revisionHistory({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C5',
    });
    assert.equal(history.length, 2, 'only INITIAL + one save revision exist');
  } finally {
    fixture.close();
  }
});

test('G24-C6: save guards are preserved and reject without writing a revision', () => {
  const fixture = provision();
  try {
    fixture.store.createPortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C6',
    });

    const empty = fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C6',
      holdings: [],
    });
    assert.equal(empty.success, false);
    assert.match(empty.error ?? '', /Cannot save empty holdings vector/);

    // The explicit non-production operator bypass remains honoured
    // (LOCAL_FIXTURE_AND_OFFLINE_DEV behaviour preserved).
    const bypassed = fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C6',
      holdings: weightedBatch([
        {
          symbol: 'BYPASSCO',
          companyId: '',
          quantity: 10,
          averageBuyPrice: 100,
          currentPrice: 120,
          identityStatus: 'UNRESOLVED',
          resolutionDisposition: 'NON_PRODUCTION_OPERATOR_BYPASS',
        },
      ]),
      options: { mode: 'REPLACE' },
    });
    assert.equal(bypassed.success, true, bypassed.error);

    // The same unresolved identity WITHOUT the bypass disposition is rejected.
    const nonBypassed = fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C6',
      holdings: weightedBatch([
        {
          symbol: 'NOBYPASS',
          companyId: '',
          quantity: 10,
          averageBuyPrice: 100,
          currentPrice: 120,
          identityStatus: 'UNRESOLVED',
          resolutionDisposition: 'CANONICAL_P04',
        },
      ]),
      options: { mode: 'REPLACE' },
    });
    assert.equal(nonBypassed.success, false);
    assert.match(nonBypassed.error ?? '', /Save Guard Violation/);

    const history = fixture.store.revisionHistory({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C6',
    });
    assert.equal(history.length, 2, 'rejected saves must not create revisions');
  } finally {
    fixture.close();
  }
});

test('G24-C7: RESET preserves portfolio identity and creates the governed empty revision', () => {
  const fixture = provision();
  try {
    fixture.store.createPortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C7',
    });
    fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C7',
      holdings: dhanBatch(),
      options: { mode: 'MERGE', contentDigest: 'd-c7' },
    });

    const reset = fixture.store.resetPortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C7',
    });

    assert.equal(reset.portfolioId, 'P-C7', 'portfolio identity is preserved');
    assert.equal(reset.holdings.length, 0);
    assert.equal(reset.isSaved, false);
    assert.equal(reset.revision, 2);

    const history = fixture.store.revisionHistory({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C7',
    });
    assert.equal(history.length, 3, 'history is retained');
    assert.equal(history[2]!.operation, 'RESET');
  } finally {
    fixture.close();
  }
});

test('G24-C8: DELETE tombstones the portfolio and prevents resurrection', () => {
  const fixture = provision();
  try {
    fixture.store.createPortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C8',
    });
    fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C8',
      holdings: dhanBatch(),
      options: { mode: 'MERGE', contentDigest: 'd-c8' },
    });

    const deleted = fixture.store.deletePortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C8',
    });
    assert.ok(deleted.deletedAt);

    // Reading a tombstoned portfolio is indistinguishable from a missing one.
    assert.throws(
      () =>
        fixture.store.getPortfolio({
          applicationUserId: fixture.applicationUserId,
          tenantId: fixture.tenantId,
          portfolioId: 'P-C8',
        }),
      ResourceNotFoundError
    );

    // No resurrection through the write paths.
    assert.throws(
      () =>
        fixture.store.saveHoldings({
          applicationUserId: fixture.applicationUserId,
          tenantId: fixture.tenantId,
          portfolioId: 'P-C8',
          holdings: dhanBatch(),
        }),
      ResourceNotFoundError
    );
  } finally {
    fixture.close();
  }
});

test('G24-C9: a stale expected revision is rejected', () => {
  const fixture = provision();
  try {
    fixture.store.createPortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C9',
    });

    assert.throws(
      () =>
        fixture.store.saveHoldings({
          applicationUserId: fixture.applicationUserId,
          tenantId: fixture.tenantId,
          portfolioId: 'P-C9',
          holdings: dhanBatch(),
          expectedRevision: 99,
        }),
      (error: unknown) =>
        error instanceof RevisionConflictError && error.code === 'REVISION_CONFLICT'
    );

    // The matching revision is accepted.
    const ok = fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C9',
      holdings: dhanBatch(),
      expectedRevision: 0,
    });
    assert.equal(ok.success, true);
  } finally {
    fixture.close();
  }
});

test('G24-C10: portfolio state survives a process restart (no in-memory fallback)', () => {
  const databasePath = tempDatabasePath('c10');

  const firstHandle = initializePersistenceWithConfig(temporaryPersistenceConfig(databasePath));
  let applicationUserId: string;
  let expectedValue: number;
  let expectedDigest: string;

  try {
    const identity = new IdentityService(firstHandle.connection);
    const mapping = identity.provisionExternalIdentityMapping({
      issuer: 'https://issuer.test/realms/ipd',
      subject: 'user-c10',
      actor: ACTOR.actor,
    });
    identity.approveMapping(mapping.mapping.mappingId, ACTOR);
    identity.activateMapping(mapping.mapping.mappingId, ACTOR);
    identity.provisionTenantMembership({
      applicationUserId: mapping.applicationUser.applicationUserId,
      tenantId: 'TENANT-C10',
      actor: ACTOR.actor,
    });
    applicationUserId = mapping.applicationUser.applicationUserId;

    const store = new DurablePortfolioStore(firstHandle.connection);
    store.createPortfolio({
      applicationUserId,
      tenantId: 'TENANT-C10',
      portfolioId: 'P-C10',
    });
    const saved = store.saveHoldings({
      applicationUserId,
      tenantId: 'TENANT-C10',
      portfolioId: 'P-C10',
      holdings: dhanBatch(),
      options: { mode: 'MERGE', sourceBroker: 'DHAN', contentDigest: 'd-c10' },
    });
    expectedValue = saved.totalMarketValue;
    expectedDigest = saved.provenanceDigest;
  } finally {
    closeTestPersistence(firstHandle);
  }

  // Restart: new process state, same durable file.
  const secondHandle = initializePersistenceWithConfig(temporaryPersistenceConfig(databasePath));
  try {
    const store = new DurablePortfolioStore(secondHandle.connection);
    const portfolio = store.getPortfolio({
      applicationUserId,
      tenantId: 'TENANT-C10',
      portfolioId: 'P-C10',
    });
    assert.equal(portfolio.revision, 1);
    assert.equal(portfolio.holdings.length, 2);
    assert.equal(portfolio.totalMarketValue, expectedValue);
    assert.equal(portfolio.provenanceDigest, expectedDigest);
    assert.equal(portfolio.isSaved, true);
  } finally {
    closeTestPersistence(secondHandle);
  }
});

test('G24-C11: provenance and lineage are recorded and deterministic', () => {
  const fixture = provision();
  try {
    fixture.store.createPortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C11',
    });

    const savedAt = '2026-09-30T00:00:00.000Z';
    const options = {
      mode: 'MERGE' as const,
      sourceBroker: 'DHAN' as const,
      fileName: 'dhan.csv',
      contentDigest: 'digest-c11',
      lineageDigest: 'lineage-c11',
    };

    const first = fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C11',
      holdings: dhanBatch(),
      options,
      savedAt,
    });
    assert.ok(/^[0-9a-f]{64}$/.test(first.provenanceDigest));

    // The MERGE path regenerates per-holding lineage digests over the
    // consolidated state (identical to the certified in-memory behaviour).
    const merged = fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C11',
      holdings: zerodhaBatch(),
      options: { ...options, sourceBroker: 'ZERODHA', contentDigest: 'digest-c11-b' },
      savedAt: '2026-09-30T00:00:01.000Z',
    });

    for (const holding of merged.portfolio.holdings) {
      assert.ok(
        /^[0-9a-f]{64}$/.test(holding.lineageDigest),
        `holding ${holding.symbol} must carry a SHA-256 lineage digest`
      );
    }
    assert.ok(/^[0-9a-f]{64}$/.test(merged.provenanceDigest));

    const history = fixture.store.revisionHistory({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'P-C11',
    });
    assert.equal(history[1]!.provenanceDigest, first.provenanceDigest);
  } finally {
    fixture.close();
  }
});

test('G24-C12: PARITY — durable MERGE matches the certified in-memory PortfolioStore', () => {
  const fixture = provision();
  try {
    const memoryStore = new PortfolioStore();

    const memoryFirst = memoryStore.saveHoldings('DEFAULT_PORTFOLIO', dhanBatch(), {
      mode: 'MERGE',
      sourceBroker: 'DHAN',
      fileName: 'dhan.csv',
      contentDigest: 'digest-c12-dhan',
      lineageDigest: 'lineage-c12-dhan',
    });
    const memoryMerged = memoryStore.saveHoldings('DEFAULT_PORTFOLIO', zerodhaBatch(), {
      mode: 'MERGE',
      sourceBroker: 'ZERODHA',
      fileName: 'zerodha.csv',
      contentDigest: 'digest-c12-zerodha',
      lineageDigest: 'lineage-c12-zerodha',
    });

    fixture.store.createPortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'DEFAULT_PORTFOLIO',
      portfolioName: 'Institutional Flagship Portfolio',
    });

    const durableFirst = fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'DEFAULT_PORTFOLIO',
      holdings: dhanBatch(),
      options: {
        mode: 'MERGE',
        sourceBroker: 'DHAN',
        fileName: 'dhan.csv',
        contentDigest: 'digest-c12-dhan',
        lineageDigest: 'lineage-c12-dhan',
      },
      savedAt: memoryFirst.savedAt,
    });

    const durableMerged = fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'DEFAULT_PORTFOLIO',
      holdings: zerodhaBatch(),
      options: {
        mode: 'MERGE',
        sourceBroker: 'ZERODHA',
        fileName: 'zerodha.csv',
        contentDigest: 'digest-c12-zerodha',
        lineageDigest: 'lineage-c12-zerodha',
      },
      savedAt: memoryMerged.savedAt,
    });

    // Holdings parity (the governed arithmetic).
    assert.deepEqual(
      sortHoldings(durableFirst.portfolio.holdings),
      sortHoldings(memoryFirst.portfolio.holdings),
      'initial batch holdings must match the certified store'
    );
    assert.deepEqual(
      sortHoldings(durableMerged.portfolio.holdings),
      sortHoldings(memoryMerged.portfolio.holdings),
      'merged holdings must match the certified store'
    );

    // Aggregate parity.
    assert.equal(durableMerged.totalMarketValue, memoryMerged.totalMarketValue);
    assert.equal(durableMerged.weightSumPercentage, memoryMerged.weightSumPercentage);
    assert.equal(durableMerged.holdingsSavedCount, memoryMerged.holdingsSavedCount);

    // Provenance parity at the same timestamp.
    assert.equal(
      durableMerged.provenanceDigest,
      memoryMerged.provenanceDigest,
      'provenance digest must match the certified store at the same timestamp'
    );

    // Contribution (provenance/lineage) parity.
    assert.deepEqual(
      durableMerged.portfolio.contributions,
      memoryMerged.portfolio.contributions,
      'contribution records must match the certified store'
    );
  } finally {
    fixture.close();
  }
});

test('G24-C13: PARITY — duplicate no-op matches the certified in-memory behaviour', () => {
  const fixture = provision();
  try {
    const memoryStore = new PortfolioStore();
    const options = {
      mode: 'MERGE' as const,
      sourceBroker: 'DHAN' as const,
      fileName: 'dhan.csv',
      contentDigest: 'digest-c13',
      lineageDigest: 'lineage-c13',
    };

    memoryStore.saveHoldings('DEFAULT_PORTFOLIO', dhanBatch(), options);
    const memoryRepeat = memoryStore.saveHoldings('DEFAULT_PORTFOLIO', dhanBatch(), options);

    fixture.store.createPortfolio({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'DEFAULT_PORTFOLIO',
    });
    fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'DEFAULT_PORTFOLIO',
      holdings: dhanBatch(),
      options,
    });
    const durableRepeat = fixture.store.saveHoldings({
      applicationUserId: fixture.applicationUserId,
      tenantId: fixture.tenantId,
      portfolioId: 'DEFAULT_PORTFOLIO',
      holdings: dhanBatch(),
      options,
    });

    assert.equal(memoryRepeat.isDuplicate, true);
    assert.equal(durableRepeat.isDuplicate, true);
    assert.equal(memoryRepeat.disposition, 'ALREADY_IMPORTED_NO_OP');
    assert.equal(durableRepeat.disposition, 'ALREADY_IMPORTED_NO_OP');
    assert.deepEqual(
      sortHoldings(durableRepeat.portfolio.holdings),
      sortHoldings(memoryRepeat.portfolio.holdings)
    );
  } finally {
    fixture.close();
  }
});
