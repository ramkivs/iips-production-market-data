/**
 * Daily-snapshot presentation surfaces.
 *
 * Two things the operator must see before and after a daily snapshot is
 * committed, kept as pure functions so they can be tested without a DOM:
 *
 *   1. THE PARTIAL-ACCEPTANCE PROMPT (§5). Totals, resolved and unresolved
 *      counts, every unresolved row with its ORIGINAL broker identifiers and its
 *      EXACT failure reason, and the outstanding count. Nothing is written until
 *      the operator explicitly confirms; declining persists nothing.
 *
 *   2. THE RECONCILIATION REPORT (§6/§7). Weights are marked derived, and
 *      carried-forward / stale / incomplete state is stated outright, so an
 *      incomplete snapshot is never presented as fully reconciled.
 */
import type {
  BrokerPartialAcceptanceSummary,
  BrokerSnapshotReconciliation,
  BrokerSnapshotUnresolvedRow,
} from '../../../../../src/contracts/broker_import_ipc.js';

export interface UnresolvedRowPresentation {
  /** Original broker identifier, exactly as the file reported it. */
  readonly identifier: string;
  readonly isin?: string;
  readonly exchange?: string;
  readonly series?: string;
  readonly quantity: number;
  readonly marketValue: number;
  /** The exact failure reason. Never a generic "could not resolve". */
  readonly failureReason: string;
}

export interface PartialAcceptancePrompt {
  readonly title: string;
  readonly totalRows: number;
  readonly resolvedCount: number;
  readonly unresolvedCount: number;
  readonly resolvedMarketValue: number;
  readonly unresolvedRows: readonly UnresolvedRowPresentation[];
  readonly outstandingAfterAcceptance: number;
  /** The operator must confirm this exact summary; the digest binds the approval. */
  readonly summaryDigest: string;
  readonly requiresExplicitConfirmation: true;
  readonly confirmLabel: string;
  readonly declineLabel: string;
  /** Stated plainly: what accepting does, and what it retains. */
  readonly consequence: string;
  /** Stated plainly: what declining does. */
  readonly declineConsequence: string;
}

export function buildPartialAcceptancePrompt(
  summary: BrokerPartialAcceptanceSummary,
): PartialAcceptancePrompt {
  const unresolvedRows = summary.refusedHoldings.map<UnresolvedRowPresentation>((row: BrokerSnapshotUnresolvedRow) => ({
    identifier: row.symbol,
    isin: row.isin,
    exchange: row.exchange,
    series: row.series,
    quantity: row.quantity,
    marketValue: row.marketValue,
    failureReason: row.reason,
  }));
  return {
    title: 'Snapshot partially resolvable',
    totalRows: summary.totalRows,
    resolvedCount: summary.resolvedCount,
    unresolvedCount: summary.unresolvedCount,
    resolvedMarketValue: summary.resolvedMarketValue,
    unresolvedRows,
    outstandingAfterAcceptance: summary.unresolvedCount,
    summaryDigest: summary.summaryDigest,
    requiresExplicitConfirmation: true,
    confirmLabel: `Save ${summary.resolvedCount} resolved holding(s) and keep ${summary.unresolvedCount} unresolved`,
    declineLabel: 'Cancel — save nothing',
    consequence:
      'Only the resolved holdings are written as a new revision. The unresolved rows are retained, unchanged, as outstanding evidence so they can be resolved later without re-importing the file.',
    declineConsequence: 'Nothing is written. No revision, no contribution and no evidence record is created.',
  };
}

export interface SnapshotReconciliationPresentation {
  readonly observed: number;
  readonly exitedZeroQuantity: number;
  readonly carriedForwardAbsent: number;
  readonly unresolved: number;
  /** True when at least one holding was carried forward because it was absent. */
  readonly stale: boolean;
  /** False means the snapshot is NOT fully reconciled and must be labelled so. */
  readonly complete: boolean;
  readonly totalMarketValue: number;
  readonly carriedForwardIdentifiers: readonly string[];
  /** Plain-language status; shown next to the total, never hidden behind it. */
  readonly statusLabel: string;
  readonly notes: readonly string[];
}

export function presentSnapshotReconciliation(
  reconciliation: BrokerSnapshotReconciliation | undefined,
): SnapshotReconciliationPresentation | undefined {
  if (!reconciliation) return undefined;
  const notes: string[] = [];
  if (reconciliation.carriedForwardAbsent > 0) {
    notes.push(
      `${reconciliation.carriedForwardAbsent} holding(s) were not in the latest snapshot; their last known values are carried forward and flagged ABSENT_FROM_LATEST_SNAPSHOT.`,
    );
  }
  if (reconciliation.unresolved > 0) {
    notes.push(`${reconciliation.unresolved} row(s) could not be identified and are retained as outstanding evidence.`);
  }
  if (reconciliation.exitedZeroQuantity > 0) {
    notes.push(`${reconciliation.exitedZeroQuantity} holding(s) were reported at zero quantity and are recorded as exited.`);
  }
  return {
    observed: reconciliation.observed,
    exitedZeroQuantity: reconciliation.exitedZeroQuantity,
    carriedForwardAbsent: reconciliation.carriedForwardAbsent,
    unresolved: reconciliation.unresolved,
    stale: reconciliation.stale,
    complete: reconciliation.complete,
    totalMarketValue: reconciliation.totalMarketValue,
    carriedForwardIdentifiers: reconciliation.absent.map((row) => row.symbol),
    statusLabel: reconciliation.complete
      ? 'Fully reconciled against the latest snapshot'
      : 'Partially reconciled — see flags below',
    notes,
  };
}

export interface DerivedWeightRow {
  readonly symbol: string;
  readonly marketValue: number;
  readonly weightPercentage: number;
  /** Always true: weights are computed here and are never broker-reported. */
  readonly derived: true;
}

/**
 * Weights are DERIVED from persisted market values. No broker-reported weight
 * is accepted, and a zero/unknown valuation yields no weights rather than
 * weights of zero for every row.
 */
export function deriveDisplayWeights(
  rows: readonly { readonly symbol: string; readonly marketValue: number }[],
): readonly DerivedWeightRow[] | undefined {
  if (rows.length === 0) return undefined;
  const total = rows.reduce((sum, row) => sum + (Number.isFinite(row.marketValue) ? row.marketValue : 0), 0);
  if (!Number.isFinite(total) || total <= 0) return undefined;
  return [...rows]
    .sort((a, b) => (a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0))
    .map((row) => ({
      symbol: row.symbol,
      marketValue: row.marketValue,
      weightPercentage: (row.marketValue / total) * 100,
      derived: true as const,
    }));
}

/** Outstanding unresolved rows that remain to be resolved for this portfolio. */
export function outstandingLabel(count: number): string {
  if (count <= 0) return 'No unresolved rows outstanding';
  return `${count} unresolved row(s) outstanding — resolve or explicitly abandon them`;
}
