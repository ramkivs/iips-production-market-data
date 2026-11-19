/**
 * Daily full-snapshot broker import — successor revision, reconciliation,
 * partial acceptance and integrity.
 *
 * The 29 mandatory behaviours are numbered in the test titles (§11 of the
 * authorization). Everything runs against a REAL in-memory SQLite store built
 * from the shipped `GATE3_MIGRATIONS` chain, through the shipped persistence
 * workflow — no mocks of the store, the ledger or the identity gate.
 *
 * The identity resolver is a deterministic fixture resolver so that unresolved
 * rows are reproducible WITHOUT touching the authoritative P7 manifest. The
 * production resolver is exercised separately by the existing broker-import
 * suites; nothing here weakens or bypasses it.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';
import { GATE3_MIGRATIONS } from '../src/ipc/entrypoint.js';
import { DurablePortfolioStore, type HoldingInput, type OwnerRef } from '../src/persistence/portfolio_store.js';
import type { BrokerObservationResolver } from '../src/identity/broker_observation_resolver.js';
import type { BrokerImportHolding, BrokerImportRequest } from '../src/contracts/broker_import_ipc.js';
import {
  deriveImportId,
  persistDailySnapshot,
} from '../src/persistence/daily_snapshot_import.js';
import {
  countOutstandingUnresolved,
  readUnresolvedEvidence,
  resolveUnresolvedRow,
  recordUnresolvedEvidence,
} from '../src/persistence/broker_snapshot_ledger.js';
import {
  reconcileFullSnapshot,
  findDuplicateSymbols,
  deriveWeights,
} from '../src/persistence/daily_snapshot_reconciliation.js';

const OWNER: OwnerRef = { canonicalOwnerId: 'snapshot-owner', tenantId: 'snapshot-tenant' };
const OPERATOR = OWNER.canonicalOwnerId;
const DIGEST_A = 'a'.repeat(64);
const DIGEST_B = 'b'.repeat(64);

function sha(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/** Deterministic fixture resolver: `UNK*` symbols stay unresolved, others resolve. */
const fixtureResolver: BrokerObservationResolver = {
  resolve(observation) {
    const symbol = String((observation as { symbol: string }).symbol);
    if (symbol.startsWith('UNK')) {
      return {
        status: 'UNMAPPED',
        reason: `MISSING_P7_MAPPING:${symbol}`,
        sourceRevision: 'P7_FIXTURE',
      } as ReturnType<BrokerObservationResolver['resolve']>;
    }
    return {
      status: 'RESOLVED',
      companyId: `company-${symbol}`,
      sourceRevision: 'P7_FIXTURE',
    } as ReturnType<BrokerObservationResolver['resolve']>;
  },
};

interface Harness {
  readonly db: DatabaseSync;
  readonly store: DurablePortfolioStore;
}

function newHarness(): Harness {
  const db = new DatabaseSync(':memory:');
  ensureMigrations(db, GATE3_MIGRATIONS);
  db.prepare(
    "INSERT INTO local_principal_bindings (binding_id, principal_label, status, created_at, updated_at, revoked_at) VALUES ('b1','operator','ACTIVE',?,?,NULL)",
  ).run('2026-11-18T00:00:00.000Z', '2026-11-18T00:00:00.000Z');
  db.prepare(
    "INSERT INTO local_principal_memberships (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at) VALUES ('m1','b1',?,?,'ACTIVE',?,?,NULL)",
  ).run(OWNER.tenantId, OWNER.canonicalOwnerId, '2026-11-18T00:00:00.000Z', '2026-11-18T00:00:00.000Z');
  const store = new DurablePortfolioStore(db, undefined, { revisionCap: 500 });
  return { db, store };
}

function brokerHolding(
  symbol: string,
  quantity: number,
  overrides: Partial<BrokerImportHolding> = {},
): BrokerImportHolding {
  const currentPrice = overrides.currentPrice ?? 10;
  return {
    symbol,
    isin: `INE${symbol}P01010`,
    exchange: 'NSE',
    series: 'EQ',
    quantity,
    averageBuyPrice: 5,
    currentPrice,
    marketValue: quantity * currentPrice,
    weightPercentage: 0,
    active: quantity > 0,
    sourceBroker: 'DHAN',
    lineageDigest: DIGEST_A,
    ...overrides,
  };
}

/** Seeds revision 1 through the plain store path (the historical revision). */
function seedRevisionOne(
  harness: Harness,
  holdings: readonly { symbol: string; quantity: number; price?: number }[],
  contentDigest = DIGEST_A,
): number {
  const rows: HoldingInput[] = holdings.map((holding) => {
    const price = holding.price ?? 10;
    return {
      symbol: holding.symbol,
      companyId: `company-${holding.symbol}`,
      quantity: holding.quantity,
      averageBuyPrice: 5,
      currentPrice: price,
      marketValue: holding.quantity * price,
      weightPercentage: 0,
      active: holding.quantity > 0,
      sourceBroker: 'DHAN',
      lineageDigest: DIGEST_A,
      identityStatus: 'RESOLVED',
      resolutionDisposition: 'CANONICAL_P04',
    };
  });
  return harness.store.create(OWNER, 'p1', {
    holdings: rows,
    provenanceDigest: DIGEST_B,
    contentDigest,
  });
}

function snapshotRequest(overrides: Partial<BrokerImportRequest> & { holdings: BrokerImportHolding[] }): BrokerImportRequest {
  return {
    portfolioId: 'p1',
    expectedRevision: 0,
    contentDigest: DIGEST_A,
    fileName: 'dhan-holdings.csv',
    sourceBroker: 'DHAN',
    importedAt: '2026-11-19T10:00:00.000Z',
    ...overrides,
  } as BrokerImportRequest;
}

function run(harness: Harness, request: BrokerImportRequest, options: { resolver?: BrokerObservationResolver; observationTime?: string } = {}) {
  return persistDailySnapshot(harness.store, harness.db, OWNER, request, {
    resolver: options.resolver ?? fixtureResolver,
    observationTime: options.observationTime ?? request.importedAt,
    operator: OPERATOR,
  });
}

/** Broad read of a possibly-refused/unknown outcome's committed revision. */
function revisionOf(outcome: unknown): number | undefined {
  const value = (outcome as { revision?: unknown }).revision;
  return typeof value === 'number' ? value : undefined;
}

function currentRows(harness: Harness): Array<Record<string, unknown>> {
  return harness.db
    .prepare(
      `SELECT revision, symbol, quantity, market_value, dp_qty, available_qty, profit_loss,
              pnl_percentage, reconciliation_state, active
         FROM portfolio_holdings
        WHERE canonical_owner_id = ? AND portfolio_id = ?
        ORDER BY revision, symbol`,
    )
    .all(OWNER.canonicalOwnerId, 'p1') as Array<Record<string, unknown>>;
}

function revisionsOf(harness: Harness): number[] {
  return (
    harness.db
      .prepare('SELECT revision FROM portfolio_revisions WHERE canonical_owner_id = ? AND portfolio_id = ? ORDER BY revision')
      .all(OWNER.canonicalOwnerId, 'p1') as Array<{ revision: number }>
  ).map((row) => row.revision);
}

function contributionsOf(harness: Harness): Array<Record<string, unknown>> {
  return harness.db
    .prepare(
      `SELECT contribution_id, content_digest, import_id, snapshot_state, unresolved_count, file_name, source_broker
         FROM portfolio_contributions WHERE canonical_owner_id = ? AND portfolio_id = ?
        ORDER BY created_at, import_id`,
    )
    .all(OWNER.canonicalOwnerId, 'p1') as Array<Record<string, unknown>>;
}

function revisionOneRows(harness: Harness): Array<Record<string, unknown>> {
  return harness.db
    .prepare(
      `SELECT symbol, quantity, current_price, market_value, source_broker, lineage_digest
         FROM portfolio_holdings WHERE canonical_owner_id = ? AND portfolio_id = ? AND revision = 1
        ORDER BY symbol`,
    )
    .all(OWNER.canonicalOwnerId, 'p1') as Array<Record<string, unknown>>;
}

describe('daily full-snapshot import — §11 mandatory behaviours', () => {
  let h: Harness;

  beforeEach(() => {
    h = newHarness();
  });

  // ── Successor import (1–3) ───────────────────────────────────────────────

  it('1. imports a successor revision while importing every holding with a qualified identity', () => {
    seedRevisionOne(h, [
      { symbol: 'AAA', quantity: 10 },
      { symbol: 'BBB', quantity: 5 },
    ]);
    const outcome = run(
      h,
      snapshotRequest({
        expectedRevision: 1,
        importId: deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR),
        holdings: [brokerHolding('AAA', 10), brokerHolding('BBB', 5)],
      }),
    );
    assert.equal(outcome.ok, true);
    assert.equal(outcome.ok === true ? outcome.revision : 0, 2);
    assert.deepEqual(revisionsOf(h), [1, 2]);
    const revisionTwo = currentRows(h).filter((row) => row.revision === 2);
    assert.equal(revisionTwo.length, 2);
    // Every persisted row carries a resolved canonical identity.
    const identities = h.db
      .prepare('SELECT symbol, company_id, identity_status FROM portfolio_holdings WHERE revision = 2 ORDER BY symbol')
      .all() as Array<{ symbol: string; company_id: string; identity_status: string }>;
    assert.deepEqual(identities.map((row) => [row.symbol, row.company_id, row.identity_status]), [
      ['AAA', 'company-AAA', 'RESOLVED'],
      ['BBB', 'company-BBB', 'RESOLVED'],
    ]);
  });

  it('2. preserves broker data and source provenance on the successor revision', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    run(
      h,
      snapshotRequest({
        expectedRevision: 1,
        importId: deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR),
        fileName: 'dhan-2026-11-19.csv',
        holdings: [brokerHolding('AAA', 12, { currentPrice: 11, dpQty: 12, availableQty: 10, profitLoss: 72, pnlPercentage: 12.5 })],
      }),
    );
    const revision = h.db
      .prepare('SELECT operation, holdings_count, provenance_digest, content_digest, import_id FROM portfolio_revisions WHERE revision = 2')
      .get() as Record<string, unknown>;
    assert.equal(revision.operation, 'MERGE');
    // The revision's own digest is the DERIVED revision-content digest (existing
    // contract, unchanged); it is not the source-file digest.
    assert.match(String(revision.content_digest), /^[0-9a-f]{64}$/);
    assert.notEqual(revision.content_digest, DIGEST_A);
    assert.equal(revision.import_id, deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR));
    const contribution = contributionsOf(h).find((row) => row.import_id === revision.import_id);
    assert.ok(contribution);
    assert.equal(contribution?.file_name, 'dhan-2026-11-19.csv');
    assert.equal(contribution?.source_broker, 'DHAN');
    // The SOURCE bytes are identified here, verbatim.
    assert.equal(contribution?.content_digest, DIGEST_A);
  });

  it('3. never alters revision 1 and never creates duplicate securities or holdings', () => {
    seedRevisionOne(h, [
      { symbol: 'AAA', quantity: 10 },
      { symbol: 'BBB', quantity: 5 },
    ]);
    const before = revisionOneRows(h);
    for (const day of ['2026-11-19T10:00:00.000Z', '2026-11-20T10:00:00.000Z', '2026-11-21T10:00:00.000Z']) {
      const revision = h.store.list(OWNER).find((p) => p.portfolioId === 'p1')!.revision;
      run(
        h,
        snapshotRequest({
          expectedRevision: revision,
          importedAt: day,
          importId: deriveImportId(DIGEST_A, day, OPERATOR),
          holdings: [brokerHolding('AAA', 10), brokerHolding('BBB', 5)],
        }),
        { observationTime: day },
      );
    }
    assert.deepEqual(revisionOneRows(h), before, 'revision 1 must be byte-identical');
    // No duplicate (revision, symbol) pair anywhere.
    const duplicates = h.db
      .prepare(
        `SELECT revision, symbol, COUNT(*) AS c FROM portfolio_holdings
          WHERE canonical_owner_id = ? AND portfolio_id = ?
          GROUP BY revision, symbol HAVING c > 1`,
      )
      .all(OWNER.canonicalOwnerId, 'p1');
    assert.deepEqual(duplicates, []);
    assert.deepEqual(revisionsOf(h), [1, 2, 3, 4]);
  });

  // ── Daily reconciliation (4–14) ──────────────────────────────────────────

  it('4. records an unchanged quantity as a new observation without duplicating the holding', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const outcome = run(
      h,
      snapshotRequest({
        expectedRevision: 1,
        importId: deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR),
        holdings: [brokerHolding('AAA', 10)],
      }),
    );
    assert.equal(outcome.ok === true && 'revision' in outcome ? outcome.revision : 0, 2);
    const rows = currentRows(h);
    assert.equal(rows.filter((row) => row.revision === 2 && row.symbol === 'AAA').length, 1);
    assert.equal(rows.find((row) => row.revision === 2)?.reconciliation_state, 'OBSERVED_IN_SNAPSHOT');
  });

  it('5. reconciles a quantity increase', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    run(
      h,
      snapshotRequest({
        expectedRevision: 1,
        importId: deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR),
        holdings: [brokerHolding('AAA', 25)],
      }),
    );
    const row = currentRows(h).find((r) => r.revision === 2)!;
    assert.equal(row.quantity, 25);
    assert.equal(row.market_value, 250);
  });

  it('6. reconciles a partial sale', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 100 }]);
    run(
      h,
      snapshotRequest({
        expectedRevision: 1,
        importId: deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR),
        holdings: [brokerHolding('AAA', 40)],
      }),
    );
    const row = currentRows(h).find((r) => r.revision === 2)!;
    assert.equal(row.quantity, 40);
    assert.equal(row.active, 1);
  });

  it('7. records zero quantity as exited while retaining the holding historically', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    run(
      h,
      snapshotRequest({
        expectedRevision: 1,
        importId: deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR),
        holdings: [brokerHolding('AAA', 0, { currentPrice: 10 })],
      }),
    );
    const revisionTwo = currentRows(h).filter((row) => row.revision === 2);
    assert.equal(revisionTwo.length, 1);
    assert.equal(revisionTwo[0].quantity, 0);
    assert.equal(revisionTwo[0].active, 0);
    assert.equal(revisionTwo[0].reconciliation_state, 'EXITED_ZERO_QUANTITY');
    // Historically retained: revision 1 still holds the pre-exit quantity.
    assert.equal(revisionOneRows(h).find((row) => row.symbol === 'AAA')?.quantity, 10);
  });

  it('8. adds a new security that was not previously held', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    run(
      h,
      snapshotRequest({
        expectedRevision: 1,
        importId: deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR),
        holdings: [brokerHolding('AAA', 10), brokerHolding('CCC', 7, { currentPrice: 20 })],
      }),
    );
    const revisionTwo = currentRows(h).filter((row) => row.revision === 2);
    assert.deepEqual(revisionTwo.map((row) => row.symbol), ['AAA', 'CCC']);
    assert.equal(revisionTwo.find((row) => row.symbol === 'CCC')?.market_value, 140);
  });

  it('9. records changed prices for an unchanged quantity', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10, price: 10 }]);
    run(
      h,
      snapshotRequest({
        expectedRevision: 1,
        importId: deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR),
        holdings: [brokerHolding('AAA', 10, { currentPrice: 13 })],
      }),
    );
    const row = currentRows(h).find((r) => r.revision === 2)!;
    assert.equal(row.quantity, 10);
    assert.equal(row.market_value, 130);
  });

  it('10. retains previous data and flags a holding absent from the latest snapshot', () => {
    seedRevisionOne(h, [
      { symbol: 'AAA', quantity: 10, price: 12 },
      { symbol: 'BBB', quantity: 5, price: 20 },
    ]);
    const outcome = run(
      h,
      snapshotRequest({
        expectedRevision: 1,
        importId: deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR),
        holdings: [brokerHolding('AAA', 10, { currentPrice: 12 })],
      }),
    );
    assert.equal(outcome.ok, true);
    const revisionTwo = currentRows(h).filter((row) => row.revision === 2);
    const absent = revisionTwo.find((row) => row.symbol === 'BBB');
    assert.ok(absent, 'an absent holding must NOT be dropped');
    assert.equal(absent?.reconciliation_state, 'ABSENT_FROM_LATEST_SNAPSHOT');
    // Previous values carried forward unchanged, not zeroed and not recomputed.
    assert.equal(absent?.quantity, 5);
    assert.equal(absent?.market_value, 100);
    // The snapshot is reported as incomplete rather than fully reconciled.
    assert.equal(outcome.ok === true ? outcome.reconciliation?.complete : true, false);
    assert.equal(outcome.ok === true ? outcome.reconciliation?.stale : false, true);
    assert.deepEqual(outcome.ok === true ? outcome.reconciliation?.absent.map((a) => a.symbol) : [], ['BBB']);
  });

  it('11. assesses each row independently and never states identity the broker did not supply', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const outcome = run(
      h,
      snapshotRequest({
        expectedRevision: 1,
        importId: deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR),
        holdings: [brokerHolding('AAA', 10), { ...brokerHolding('UNK2', 3), isin: undefined, series: undefined }],
      }),
    );
    // UNK2 has no governed mapping → unresolved; AAA is still assessed on its own.
    assert.equal(outcome.ok, false);
    assert.equal(outcome.ok === false && 'summary' in outcome ? outcome.summary.resolvedCount : -1, 1);
    assert.equal(outcome.ok === false && 'summary' in outcome ? outcome.summary.unresolvedCount : -1, 1);
    const refused = outcome.ok === false && 'summary' in outcome ? outcome.summary.refusedHoldings[0] : undefined;
    assert.equal(refused?.symbol, 'UNK2');
    assert.match(String(refused?.reason), /ISIN|SERIES|IDENTITY|MISSING/i);
    // Nothing was written: assessment never mutates.
    assert.deepEqual(revisionsOf(h), [1]);
  });

  it('12. refuses duplicate symbol rows with an explicit deterministic policy', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const outcome = run(
      h,
      snapshotRequest({
        expectedRevision: 1,
        importId: deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR),
        holdings: [brokerHolding('AAA', 10), brokerHolding('AAA', 5)],
      }),
    );
    assert.equal(outcome.ok, false);
    assert.equal(outcome.ok === false ? outcome.code : '', 'REFUSED_DUPLICATE_ROWS');
    assert.deepEqual(
      outcome.ok === false && 'refusedHoldings' in outcome ? outcome.refusedHoldings : [],
      [{ symbol: 'AAA', reason: 'DUPLICATE_SYMBOL_ROWS' }],
    );
    assert.deepEqual(revisionsOf(h), [1]);
    // Deterministic: the same input yields the identical finding, twice.
    assert.deepEqual(findDuplicateSymbols([{ symbol: 'AAA' }, { symbol: 'AAA' }]), [
      { symbol: 'AAA', occurrences: 2, reason: 'DUPLICATE_SYMBOL_ROWS' },
    ]);
  });

  it('13. stores the four daily fields verbatim and distinguishes "not reported" from zero', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }, { symbol: 'BBB', quantity: 4 }]);
    run(
      h,
      snapshotRequest({
        expectedRevision: 1,
        importId: deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR),
        holdings: [
          brokerHolding('AAA', 10, { dpQty: 10, availableQty: 8, profitLoss: 55.25, pnlPercentage: 11.05 }),
          // BBB reports an explicit ZERO profit/loss and no dp/available qty.
          brokerHolding('BBB', 4, { dpQty: null, availableQty: null, profitLoss: 0, pnlPercentage: null }),
        ],
      }),
    );
    const rows = currentRows(h).filter((row) => row.revision === 2);
    const aaa = rows.find((row) => row.symbol === 'AAA')!;
    const bbb = rows.find((row) => row.symbol === 'BBB')!;
    assert.equal(aaa.dp_qty, 10);
    assert.equal(aaa.available_qty, 8);
    assert.equal(aaa.profit_loss, 55.25);
    assert.equal(aaa.pnl_percentage, 11.05);
    // Explicit zero stays zero; a missing field stays NULL — never a calculation.
    assert.equal(bbb.profit_loss, 0);
    assert.equal(bbb.pnl_percentage, null);
    assert.equal(bbb.dp_qty, null);
    assert.equal(bbb.available_qty, null);
  });

  it('14. exposes carried-forward and unresolved state instead of presenting data as fully reconciled', () => {
    seedRevisionOne(h, [
      { symbol: 'AAA', quantity: 10 },
      { symbol: 'BBB', quantity: 5 },
    ]);
    const request = snapshotRequest({
      expectedRevision: 1,
      importId: deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR),
      holdings: [brokerHolding('AAA', 10)],
    });
    const outcome = run(h, request);
    assert.equal(outcome.ok, true);
    // Weights remain DERIVED and the incomplete snapshot says so.
    const revision = outcome.ok === true ? outcome.revision : 0;
    const weights = h.db
      .prepare('SELECT symbol, weight_percentage FROM portfolio_holdings WHERE revision = ? ORDER BY symbol')
      .all(revision) as Array<{ symbol: string; weight_percentage: number }>;
    const sum = weights.reduce((total, row) => total + row.weight_percentage, 0);
    assert.ok(Math.abs(sum - 100) < 1e-6, `derived weights must total 100, got ${sum}`);
    assert.equal(outcome.ok === true ? outcome.reconciliation?.complete : true, false);
    assert.equal(outcome.ok === true ? outcome.reconciliation?.carriedForwardAbsent : 0, 1);
  });

  // ── Partial resolution and user approval (15–24) ─────────────────────────

  const mixedSnapshot = () =>
    snapshotRequest({
      expectedRevision: 1,
      importId: deriveImportId(DIGEST_B, '2026-11-20T10:00:00.000Z', OPERATOR),
      contentDigest: DIGEST_B,
      importedAt: '2026-11-20T10:00:00.000Z',
      holdings: [brokerHolding('AAA', 10), brokerHolding('UNK1', 6, { currentPrice: 50 })],
    });

  it('15. requires explicit approval and writes nothing before it is given', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const outcome = run(h, mixedSnapshot());
    assert.equal(outcome.ok, false);
    assert.equal(outcome.ok === false ? outcome.code : '', 'PARTIAL_ACCEPTANCE_REQUIRED');
    assert.deepEqual(revisionsOf(h), [1]);
    assert.equal(contributionsOf(h).filter((row) => row.import_id).length, 0);
    assert.equal(countOutstandingUnresolved(h.db, OWNER.canonicalOwnerId, 'p1'), 0);
  });

  it('16. never treats partial acceptance as all-or-nothing: resolved rows are not blocked by unresolved ones', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const pending = run(h, mixedSnapshot());
    const summary = pending.ok === false && 'summary' in pending ? pending.summary : undefined;
    assert.ok(summary);
    const accepted = run(h, { ...mixedSnapshot(), partialAcceptance: { approved: true, approvedAt: '2026-11-20T10:05:00.000Z', approvedBy: OPERATOR, summaryDigest: summary!.summaryDigest } });
    assert.equal(accepted.ok, true);
    assert.deepEqual(revisionsOf(h), [1, 2]);
  });

  it('17. reports totals, resolved and unresolved counts in the confirmation prompt', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const pending = run(h, mixedSnapshot());
    const summary = pending.ok === false && 'summary' in pending ? pending.summary : undefined;
    assert.equal(summary?.totalRows, 2);
    assert.equal(summary?.resolvedCount, 1);
    assert.equal(summary?.unresolvedCount, 1);
    assert.equal(summary?.resolvedMarketValue, 100);
    assert.equal(typeof summary?.summaryDigest, 'string');
  });

  it('18. shows the original broker identifiers for each unresolved row', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const pending = run(h, mixedSnapshot());
    const row = pending.ok === false && 'summary' in pending ? pending.summary.refusedHoldings[0] : undefined;
    assert.equal(row?.symbol, 'UNK1');
    assert.equal(row?.isin, 'INEUNK1P01010');
    assert.equal(row?.exchange, 'NSE');
    assert.equal(row?.series, 'EQ');
    assert.equal(row?.quantity, 6);
  });

  it('19. shows the exact failure reason per unresolved row', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const pending = run(h, mixedSnapshot());
    const row = pending.ok === false && 'summary' in pending ? pending.summary.refusedHoldings[0] : undefined;
    assert.equal(row?.reason, 'MISSING_P7_MAPPING:UNK1');
  });

  it('20. persists only the resolved rows when the operator accepts', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const pending = run(h, mixedSnapshot());
    const summary = pending.ok === false && 'summary' in pending ? pending.summary : undefined;
    run(h, { ...mixedSnapshot(), partialAcceptance: { approved: true, approvedAt: '2026-11-20T10:05:00.000Z', approvedBy: OPERATOR, summaryDigest: summary!.summaryDigest } });
    const revisionTwo = currentRows(h).filter((row) => row.revision === 2);
    assert.deepEqual(revisionTwo.map((row) => row.symbol), ['AAA']);
    assert.equal(revisionTwo.length, 1);
  });

  it('21. retains the unresolved rows as a durable unresolved-import record', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const request = mixedSnapshot();
    const pending = run(h, request);
    const summary = pending.ok === false && 'summary' in pending ? pending.summary : undefined;
    const accepted = run(h, { ...request, partialAcceptance: { approved: true, approvedAt: '2026-11-20T10:05:00.000Z', approvedBy: OPERATOR, summaryDigest: summary!.summaryDigest } });
    assert.equal(accepted.ok, true);
    const evidence = readUnresolvedEvidence(h.db, OWNER.canonicalOwnerId, 'p1', request.importId!);
    assert.equal(evidence.length, 1);
    assert.equal(evidence[0].symbol, 'UNK1');
    assert.equal(evidence[0].isin, 'INEUNK1P01010');
    assert.equal(evidence[0].quantity, 6);
    assert.equal(evidence[0].marketValue, 300);
    assert.equal(evidence[0].reason, 'MISSING_P7_MAPPING:UNK1');
    assert.equal(evidence[0].resolutionStatus, 'OUTSTANDING');
  });

  it('22. records the snapshot as PARTIALLY_ACCEPTED with an outstanding count', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const request = mixedSnapshot();
    const pending = run(h, request);
    const summary = pending.ok === false && 'summary' in pending ? pending.summary : undefined;
    const accepted = run(h, { ...request, partialAcceptance: { approved: true, approvedAt: '2026-11-20T10:05:00.000Z', approvedBy: OPERATOR, summaryDigest: summary!.summaryDigest } });
    assert.equal(accepted.ok === true ? accepted.snapshotState : '', 'PARTIALLY_ACCEPTED');
    assert.equal(accepted.ok === true ? accepted.unresolvedCount : -1, 1);
    const contribution = contributionsOf(h).find((row) => row.import_id === request.importId);
    assert.equal(contribution?.snapshot_state, 'PARTIALLY_ACCEPTED');
    assert.equal(contribution?.unresolved_count, 1);
    assert.equal(countOutstandingUnresolved(h.db, OWNER.canonicalOwnerId, 'p1'), 1);
  });

  it('23. resolves an outstanding row later without re-importing and without duplication', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const request = mixedSnapshot();
    const pending = run(h, request);
    const summary = pending.ok === false && 'summary' in pending ? pending.summary : undefined;
    run(h, { ...request, partialAcceptance: { approved: true, approvedAt: '2026-11-20T10:05:00.000Z', approvedBy: OPERATOR, summaryDigest: summary!.summaryDigest } });
    const resolved = resolveUnresolvedRow(
      h.db,
      OWNER.canonicalOwnerId,
      'p1',
      request.importId!,
      0,
      'company-UNK1',
      '2026-11-20T12:00:00.000Z',
    );
    assert.ok(resolved);
    assert.equal(resolved?.resolutionStatus, 'RESOLVED');
    assert.equal(resolved?.symbol, 'UNK1');
    // The original broker values survive the resolution — no re-read of the file.
    assert.equal(resolved?.quantity, 6);
    assert.equal(countOutstandingUnresolved(h.db, OWNER.canonicalOwnerId, 'p1'), 0);
    // Resolving twice is refused rather than duplicated.
    assert.equal(
      resolveUnresolvedRow(h.db, OWNER.canonicalOwnerId, 'p1', request.importId!, 0, 'company-UNK1', '2026-11-20T12:30:00.000Z'),
      null,
    );
    // No holding was written for the unresolved row.
    assert.equal(currentRows(h).filter((row) => row.symbol === 'UNK1').length, 0);
  });

  it('24. persists nothing when the operator declines at the prompt', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const before = currentRows(h);
    const pending = run(h, mixedSnapshot());
    // Declining = not supplying an approval. A refusal that names the prompt is
    // the decline: no state changed.
    assert.equal(pending.ok, false);
    assert.deepEqual(currentRows(h), before);
    assert.deepEqual(revisionsOf(h), [1]);
    assert.equal(countOutstandingUnresolved(h.db, OWNER.canonicalOwnerId, 'p1'), 0);
  });

  // ── Integrity and failure (25–29) ────────────────────────────────────────

  it('25. treats identical bytes on a new day as a new import operation and revision', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const dayOne = deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR);
    const dayTwo = deriveImportId(DIGEST_A, '2026-11-20T10:00:00.000Z', OPERATOR);
    assert.notEqual(dayOne, dayTwo, 'identical bytes must not collapse into one operation');
    const first = run(h, snapshotRequest({ expectedRevision: 1, importId: dayOne, holdings: [brokerHolding('AAA', 10)] }));
    assert.equal(revisionOf(first), 2);
    const second = run(
      h,
      snapshotRequest({
        expectedRevision: 2,
        importId: dayTwo,
        importedAt: '2026-11-20T10:00:00.000Z',
        holdings: [brokerHolding('AAA', 10)],
      }),
      { observationTime: '2026-11-20T10:00:00.000Z' },
    );
    assert.equal(revisionOf(second), 3);
    assert.deepEqual(revisionsOf(h), [1, 2, 3]);
    assert.equal(contributionsOf(h).filter((row) => row.import_id).length, 2);
  });

  it('26. makes a retry of the same import operation idempotent', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const importId = deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR);
    const request = snapshotRequest({ expectedRevision: 1, importId, holdings: [brokerHolding('AAA', 12)] });
    const first = run(h, request);
    assert.equal(revisionOf(first), 2);
    const snapshotAfterFirst = currentRows(h);
    const retry = run(h, { ...request, expectedRevision: 2 });
    assert.equal(retry.ok, true);
    assert.equal(retry.ok === true ? retry.disposition : '', 'ALREADY_IMPORTED_NO_OP');
    assert.equal(retry.ok === true ? retry.storeEffect : '', 'NONE');
    assert.deepEqual(currentRows(h), snapshotAfterFirst, 'a retry must not change any row');
    assert.deepEqual(revisionsOf(h), [1, 2]);
    assert.equal(contributionsOf(h).length, 2);
  });

  it('27. persists import id ↔ source digest ↔ observation time ↔ revision transactionally', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const importId = deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR);
    run(h, snapshotRequest({ expectedRevision: 1, importId, holdings: [brokerHolding('AAA', 12)] }));
    const binding = h.db
      .prepare(
        `SELECT r.import_id, r.revision, r.content_digest, c.imported_at, c.content_digest AS contribution_digest
           FROM portfolio_revisions r
           JOIN portfolio_contributions c
             ON c.canonical_owner_id = r.canonical_owner_id AND c.portfolio_id = r.portfolio_id
            AND c.import_id = r.import_id
          WHERE r.portfolio_id = ? AND r.revision = 2`,
      )
      .get('p1') as Record<string, unknown>;
    assert.equal(binding.import_id, importId);
    // Source digest and observation time are bound on the contribution; the
    // revision is bound to the import operation by `import_id`.
    assert.match(String(binding.content_digest), /^[0-9a-f]{64}$/);
    assert.equal(binding.contribution_digest, DIGEST_A);
    assert.equal(binding.imported_at, '2026-11-19T10:00:00.000Z');
  });

  it('28. rolls back atomically when the write fails part-way', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const importId = deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR);
    const failingStore = new DurablePortfolioStore(h.db, {
      afterMutation: (step) => {
        if (step.startsWith('holding-insert')) throw new Error('injected mid-write failure');
      },
    }, { revisionCap: 500 });
    const outcome = persistDailySnapshot(
      failingStore,
      h.db,
      OWNER,
      snapshotRequest({ expectedRevision: 1, importId, holdings: [brokerHolding('AAA', 12)] }),
      { resolver: fixtureResolver, operator: OPERATOR },
    );
    assert.equal(outcome.ok, false);
    assert.equal(outcome.ok === false ? outcome.storeEffect : '', 'NONE');
    // Nothing partial survived: no revision 2, no contribution for this import.
    assert.deepEqual(revisionsOf(h), [1]);
    assert.equal(contributionsOf(h).filter((row) => row.import_id === importId).length, 0);
    assert.equal(currentRows(h).filter((row) => row.revision === 2).length, 0);
  });

  it('29. refuses an approval that does not bind to the summary the operator saw', () => {
    seedRevisionOne(h, [{ symbol: 'AAA', quantity: 10 }]);
    const request = mixedSnapshot();
    const pending = run(h, request);
    assert.equal(pending.ok, false);
    const tampered = run(h, {
      ...request,
      partialAcceptance: {
        approved: true,
        approvedAt: '2026-11-20T10:05:00.000Z',
        approvedBy: OPERATOR,
        summaryDigest: sha('a different summary'),
      },
    });
    assert.equal(tampered.ok, false);
    assert.equal(tampered.ok === false ? tampered.code : '', 'REFUSED_APPROVAL_MISMATCH');
    assert.deepEqual(revisionsOf(h), [1]);
    // An approval supplied for a snapshot with nothing unresolved is also refused.
    const unnecessary = run(h, {
      ...snapshotRequest({
        expectedRevision: 1,
        importId: deriveImportId(DIGEST_A, '2026-11-19T10:00:00.000Z', OPERATOR),
        holdings: [brokerHolding('AAA', 10)],
      }),
      partialAcceptance: {
        approved: true,
        approvedAt: '2026-11-19T10:05:00.000Z',
        approvedBy: OPERATOR,
        summaryDigest: 'c'.repeat(64),
      },
    });
    assert.equal(unnecessary.ok, false);
    assert.deepEqual(revisionsOf(h), [1]);
  });
});

describe('daily snapshot reconciliation primitives', () => {
  it('derives weights over persisted values and never invents them when valuation is zero', () => {
    const weights = deriveWeights([
      { symbol: 'AAA', marketValue: 75 },
      { symbol: 'BBB', marketValue: 25 },
    ]);
    assert.deepEqual(weights?.map((row) => [row.symbol, row.weightPercentage]), [
      ['AAA', 75],
      ['BBB', 25],
    ]);
    assert.equal(deriveWeights([]), undefined);
    assert.equal(deriveWeights([{ symbol: 'AAA', marketValue: 0 }]), undefined);
  });

  it('carries forward absent rows and keeps an explicit zero distinct from absence', () => {
    const reconciled = reconcileFullSnapshot(
      [{ symbol: 'AAA', companyId: 'c', quantity: 0, averageBuyPrice: 5, currentPrice: 10, marketValue: 0, weightPercentage: 0, active: false, sourceBroker: 'DHAN', lineageDigest: DIGEST_A }],
      {
        previous: [
          { symbol: 'AAA', companyId: 'c', quantity: 10, averageBuyPrice: 5, currentPrice: 10, marketValue: 100, weightPercentage: 100, active: true, sourceBroker: 'DHAN', lineageDigest: DIGEST_A },
          { symbol: 'BBB', companyId: 'c', quantity: 4, averageBuyPrice: 5, currentPrice: 10, marketValue: 40, weightPercentage: 0, active: true, sourceBroker: 'DHAN', lineageDigest: DIGEST_A },
        ],
      },
    );
    assert.equal(reconciled.counts.exitedZeroQuantity, 1);
    assert.equal(reconciled.counts.carriedForwardAbsent, 1);
    assert.equal(reconciled.complete, false);
    assert.equal(reconciled.absent[0].symbol, 'BBB');
    assert.equal(reconciled.absent[0].quantity, 4);
    assert.equal(reconciled.absent[0].reconciliationState, 'ABSENT_FROM_LATEST_SNAPSHOT');
  });

  it('does not infer absence on the first snapshot', () => {
    const reconciled = reconcileFullSnapshot(
      [{ symbol: 'AAA', companyId: 'c', quantity: 1, averageBuyPrice: 5, currentPrice: 10, marketValue: 10, weightPercentage: 0, active: true, sourceBroker: 'DHAN', lineageDigest: DIGEST_A }],
      { previous: [{ symbol: 'ZZZ', companyId: 'c', quantity: 9, averageBuyPrice: 5, currentPrice: 10, marketValue: 90, weightPercentage: 0, active: true, sourceBroker: 'DHAN', lineageDigest: DIGEST_A }], firstSnapshot: true },
    );
    assert.equal(reconciled.counts.carriedForwardAbsent, 0);
    assert.equal(reconciled.complete, true);
  });

  it('persists unresolved evidence verbatim, including fields this schema does not model', () => {
    const db = new DatabaseSync(':memory:');
    ensureMigrations(db, GATE3_MIGRATIONS);
    const written = recordUnresolvedEvidence(
      db,
      {
        canonicalOwnerId: 'o',
        portfolioId: 'p',
        importId: DIGEST_A,
        observationTime: '2026-11-19T10:00:00.000Z',
        createdAt: '2026-11-19T10:00:00.000Z',
      },
      [{
        symbol: 'UNK9',
        isin: 'INEUNK9P01019',
        exchange: 'BSE',
        series: 'EQ',
        quantity: 3,
        averageBuyPrice: 7,
        currentPrice: 9,
        marketValue: 27,
        dpQty: 3,
        availableQty: 2,
        profitLoss: -1.5,
        pnlPercentage: -5.2,
        sourceBroker: 'DHAN',
        lineageDigest: DIGEST_B,
        reason: 'MISSING_P7_MAPPING:UNK9',
      }],
    );
    assert.equal(written, 1);
    const raw = db.prepare('SELECT raw_payload FROM broker_snapshot_unresolved_rows').get() as { raw_payload: string };
    const parsed = JSON.parse(raw.raw_payload) as Record<string, unknown>;
    assert.equal(parsed.symbol, 'UNK9');
    assert.equal(parsed.availableQty, 2);
    assert.equal(parsed.pnlPercentage, -5.2);
  });
});
