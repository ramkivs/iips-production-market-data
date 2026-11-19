/**
 * Daily-snapshot operator surfaces.
 *
 * The acceptance prompt and the reconciliation report are the only places the
 * operator can learn that a snapshot is incomplete or that rows are still
 * outstanding, so they are asserted directly rather than through a DOM.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPartialAcceptancePrompt,
  deriveDisplayWeights,
  outstandingLabel,
  presentSnapshotReconciliation,
} from '../frontend/src/features/portfolio/import/daily-snapshot-view.js';
import type { BrokerPartialAcceptanceSummary } from '../src/contracts/broker_import_ipc.js';

const SUMMARY: BrokerPartialAcceptanceSummary = {
  importId: 'a'.repeat(64),
  totalRows: 64,
  resolvedCount: 63,
  unresolvedCount: 1,
  resolvedMarketValue: 12_345_678.9,
  refusedHoldings: [
    {
      symbol: 'SOMESYM',
      isin: 'INE000A01019',
      exchange: 'BSE',
      series: 'EQ',
      quantity: 12,
      averageBuyPrice: 100,
      currentPrice: 120,
      marketValue: 1440,
      dpQty: 12,
      availableQty: 10,
      profitLoss: 240,
      pnlPercentage: 20,
      sourceBroker: 'DHAN',
      lineageDigest: 'b'.repeat(64),
      reason: 'MISSING_P7_MAPPING',
      sourceRevision: 'P7',
    },
  ],
  duplicateSymbols: [],
  summaryDigest: 'c'.repeat(64),
};

describe('partial-acceptance prompt', () => {
  it('states totals, resolved and unresolved counts', () => {
    const prompt = buildPartialAcceptancePrompt(SUMMARY);
    assert.equal(prompt.totalRows, 64);
    assert.equal(prompt.resolvedCount, 63);
    assert.equal(prompt.unresolvedCount, 1);
    assert.equal(prompt.resolvedMarketValue, 12_345_678.9);
    assert.equal(prompt.outstandingAfterAcceptance, 1);
  });

  it('shows the original broker identifiers and the exact failure reason', () => {
    const prompt = buildPartialAcceptancePrompt(SUMMARY);
    const row = prompt.unresolvedRows[0];
    assert.equal(row.identifier, 'SOMESYM');
    assert.equal(row.isin, 'INE000A01019');
    assert.equal(row.exchange, 'BSE');
    assert.equal(row.series, 'EQ');
    assert.equal(row.quantity, 12);
    assert.equal(row.failureReason, 'MISSING_P7_MAPPING');
  });

  it('requires explicit confirmation and binds the approval to a digest', () => {
    const prompt = buildPartialAcceptancePrompt(SUMMARY);
    assert.equal(prompt.requiresExplicitConfirmation, true);
    assert.equal(prompt.summaryDigest, SUMMARY.summaryDigest);
    assert.match(prompt.confirmLabel, /Save 63 resolved/);
    assert.match(prompt.declineLabel, /save nothing/i);
  });

  it('states plainly what accepting and declining each do', () => {
    const prompt = buildPartialAcceptancePrompt(SUMMARY);
    assert.match(prompt.consequence, /retained/i);
    assert.match(prompt.consequence, /without re-importing/i);
    assert.match(prompt.declineConsequence, /Nothing is written/i);
  });

  it('never presents a refusal reason as generic', () => {
    const prompt = buildPartialAcceptancePrompt(SUMMARY);
    assert.doesNotMatch(prompt.unresolvedRows[0].failureReason, /^unknown$/i);
    assert.equal(prompt.unresolvedRows[0].failureReason.includes('MISSING_P7_MAPPING'), true);
  });
});

describe('reconciliation report', () => {
  it('labels an incomplete snapshot as partially reconciled with its flags', () => {
    const presentation = presentSnapshotReconciliation({
      observed: 63,
      exitedZeroQuantity: 1,
      carriedForwardAbsent: 2,
      unresolved: 1,
      stale: true,
      complete: false,
      totalMarketValue: 1000,
      absent: [
        { symbol: 'AAA', quantity: 5, marketValue: 50, reason: 'ABSENT_FROM_LATEST_SNAPSHOT' },
        { symbol: 'BBB', quantity: 3, marketValue: 30, reason: 'ABSENT_FROM_LATEST_SNAPSHOT' },
      ],
    });
    assert.ok(presentation);
    assert.equal(presentation?.complete, false);
    assert.equal(presentation?.stale, true);
    assert.deepEqual(presentation?.carriedForwardIdentifiers, ['AAA', 'BBB']);
    assert.match(String(presentation?.statusLabel), /Partially reconciled/);
    assert.equal(presentation?.notes.length, 3);
  });

  it('labels a complete snapshot as fully reconciled only when nothing is absent', () => {
    const presentation = presentSnapshotReconciliation({
      observed: 10,
      exitedZeroQuantity: 0,
      carriedForwardAbsent: 0,
      unresolved: 0,
      stale: false,
      complete: true,
      totalMarketValue: 500,
      absent: [],
    });
    assert.equal(presentation?.complete, true);
    assert.match(String(presentation?.statusLabel), /Fully reconciled/);
    assert.deepEqual(presentation?.notes, []);
  });

  it('returns nothing when there is no reconciliation evidence at all', () => {
    assert.equal(presentSnapshotReconciliation(undefined), undefined);
  });
});

describe('derived weights', () => {
  it('derives weights from market values and marks every row derived', () => {
    const weights = deriveDisplayWeights([
      { symbol: 'BBB', marketValue: 25 },
      { symbol: 'AAA', marketValue: 75 },
    ]);
    assert.deepEqual(weights?.map((row) => [row.symbol, row.weightPercentage, row.derived]), [
      ['AAA', 75, true],
      ['BBB', 25, true],
    ]);
    assert.ok(Math.abs((weights ?? []).reduce((sum, row) => sum + row.weightPercentage, 0) - 100) < 1e-9);
  });

  it('returns no weights rather than zeros when total valuation is zero', () => {
    assert.equal(deriveDisplayWeights([]), undefined);
    assert.equal(deriveDisplayWeights([{ symbol: 'AAA', marketValue: 0 }]), undefined);
  });
});

describe('outstanding unresolved label', () => {
  it('states the outstanding count when rows remain', () => {
    assert.match(outstandingLabel(3), /3 unresolved row/);
  });

  it('states that nothing is outstanding when all rows are resolved', () => {
    assert.equal(outstandingLabel(0), 'No unresolved rows outstanding');
  });
});
