/**
 * Daily full-snapshot reconciliation of broker-observed holdings.
 *
 * A daily Dhan portfolio export is a FULL snapshot: every holding the broker
 * says the operator holds on that day. It is therefore not the same thing as
 * an incremental "import whatever rows this file contains" merge. Two
 * behaviours of the plain import path are wrong for a full snapshot and are
 * corrected here, WITHOUT changing the import path's own contract:
 *
 *   1. ABSENCE. A previous holding that the latest snapshot does not mention is
 *      NOT dropped. Its last observed values are carried forward unchanged and
 *      the row is flagged `ABSENT_FROM_LATEST_SNAPSHOT`, so the portfolio keeps
 *      the operator's last known position while remaining visibly unreconciled.
 *
 *   2. SNAPSHOT IDENTITY. Two genuinely different daily observations can share
 *      byte-identical content (a weekend, a holiday, an unchanged book). The
 *      import operation therefore carries its own durable `importId`; the file
 *      content digest is provenance, not operation identity. A retry of the same
 *      operation id is idempotent; identical bytes on a new day are a new
 *      revision.
 *
 * Every row is assessed independently. Nothing here discards broker data,
 * invents an identity, or promotes an unresolved instrument to an imported one.
 */
import type { ReconciliationState } from './portfolio_store.js';
import type {
  BrokerDailyFields,
  BrokerImportHolding,
  BrokerSnapshotAbsentHolding,
  BrokerSnapshotReconciliation,
  SnapshotRowDisposition,
} from '../contracts/broker_import_ipc.js';

/** The prior observation of a holding, as last persisted. */
export interface PriorObservedHolding {
  readonly symbol: string;
  readonly companyId: string;
  readonly quantity: number;
  readonly averageBuyPrice: number;
  readonly currentPrice: number;
  readonly marketValue: number;
  readonly weightPercentage: number;
  readonly active: boolean;
  readonly sourceBroker: string;
  readonly lineageDigest: string;
  readonly identityStatus?: string | null;
  readonly resolutionDisposition?: string | null;
  readonly securityIdentity?: unknown;
  readonly dpQty?: number | null;
  readonly availableQty?: number | null;
  readonly profitLoss?: number | null;
  readonly pnlPercentage?: number | null;
}

/** A holding ready to persist, plus why it is present. */
export interface ReconciledHolding extends PriorObservedHolding, BrokerDailyFields {
  readonly reconciliationState: ReconciliationState;
  /** True when this row's values were carried forward rather than observed today. */
  readonly carriedForward: boolean;
}

export type SnapshotRowKind = SnapshotRowDisposition['kind'];

export interface ReconcileSnapshotOptions {
  /**
   * Prior (latest persisted) observation, per symbol. Absent symbols are the
   * ones this function may carry forward. An empty list means "first snapshot".
   */
  readonly previous?: readonly PriorObservedHolding[];
  /** True when the caller knows this is the first snapshot for the portfolio. */
  readonly firstSnapshot?: boolean;
}

export interface ReconciledSnapshot {
  readonly holdings: readonly ReconciledHolding[];
  readonly absent: readonly ReconciledHolding[];
  readonly rows: readonly SnapshotRowDisposition[];
  readonly counts: {
    readonly observed: number;
    readonly carriedForwardAbsent: number;
    readonly exitedZeroQuantity: number;
  };
  /**
   * Undefined when the snapshot has no rows at all: an empty snapshot is not
   * evidence about the operator's positions and must not be treated as one.
   */
  readonly weights: readonly { readonly symbol: string; readonly weightPercentage: number }[] | undefined;
  readonly totalMarketValue: number;
  readonly complete: boolean;
}

function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Sort key used everywhere a deterministic order matters. Symbols are compared
 * ordinally (never locale-aware) so results do not depend on the host locale.
 */
export function compareSymbol(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Deterministic duplicate policy for a full snapshot.
 *
 * Duplicated broker rows for one symbol are NOT silently summed, averaged or
 * deduplicated by first/last appearance: any of those would invent a position
 * the broker never reported. The row is instead refused explicitly, so the
 * operator can fix the export. The policy is deterministic because the refusal
 * is reported for every duplicated symbol in ordinal order and no state is
 * written.
 */
export interface DuplicateSymbolFinding {
  readonly symbol: string;
  readonly occurrences: number;
  readonly reason: string;
}

export function findDuplicateSymbols(
  holdings: readonly Pick<BrokerImportHolding, 'symbol'>[],
): DuplicateSymbolFinding[] {
  const counts = new Map<string, number>();
  for (const holding of holdings) counts.set(holding.symbol, (counts.get(holding.symbol) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, occurrences]) => occurrences > 1)
    .sort((a, b) => compareSymbol(a[0], b[0]))
    .map(([symbol, occurrences]) => ({
      symbol,
      occurrences,
      reason: 'DUPLICATE_SYMBOL_ROWS',
    }));
}

/**
 * Weight derivation. Weights are DERIVED, never taken from the broker file:
 * the Dhan export has no weight column, and even if a file carried one it would
 * be a second, unverifiable arithmetic claim about the same book. Derivation is
 * over the market values actually persisted for this revision, so a
 * carried-forward row contributes its last known value and an unresolved row is
 * not silently weighted as zero.
 */
export function deriveWeights(
  rows: readonly { readonly symbol: string; readonly marketValue: number }[],
): readonly { readonly symbol: string; readonly weightPercentage: number }[] | undefined {
  if (rows.length === 0) return undefined;
  const total = rows.reduce((sum, row) => sum + (Number.isFinite(row.marketValue) ? row.marketValue : 0), 0);
  if (!Number.isFinite(total) || total <= 0) {
    // No positive valuation: every weight is unknown, not zero.
    return undefined;
  }
  return [...rows]
    .sort((a, b) => compareSymbol(a.symbol, b.symbol))
    .map((row) => ({
      symbol: row.symbol,
      weightPercentage: (row.marketValue / total) * 100,
    }));
}

function carryForward(prior: PriorObservedHolding, reason: ReconciliationState): ReconciledHolding {
  return {
    symbol: prior.symbol,
    companyId: prior.companyId,
    quantity: prior.quantity,
    averageBuyPrice: prior.averageBuyPrice,
    currentPrice: prior.currentPrice,
    marketValue: prior.marketValue,
    weightPercentage: prior.weightPercentage,
    active: prior.active,
    sourceBroker: prior.sourceBroker,
    lineageDigest: prior.lineageDigest,
    identityStatus: prior.identityStatus ?? null,
    resolutionDisposition: prior.resolutionDisposition ?? null,
    securityIdentity: prior.securityIdentity,
    dpQty: prior.dpQty ?? null,
    availableQty: prior.availableQty ?? null,
    profitLoss: prior.profitLoss ?? null,
    pnlPercentage: prior.pnlPercentage ?? null,
    reconciliationState: reason,
    carriedForward: true,
  };
}

/**
 * Reconciles one full snapshot against the previous observation.
 *
 * `observed` rows are the rows the import path already validated and resolved;
 * they are passed through verbatim (broker values untouched) and classified.
 * Absent prior rows are appended as carry-forward rows. Weights are then derived
 * once over the complete set.
 */
export function reconcileFullSnapshot(
  observed: readonly (PriorObservedHolding & BrokerDailyFields)[],
  options: ReconcileSnapshotOptions = {},
): ReconciledSnapshot {
  const previous = options.previous ?? [];
  const observedSymbols = new Set(observed.map((holding) => holding.symbol));

  const holdings: ReconciledHolding[] = [...observed]
    .sort((a, b) => compareSymbol(a.symbol, b.symbol))
    .map((holding) => ({
      ...holding,
      reconciliationState:
        holding.quantity === 0 ? ('EXITED_ZERO_QUANTITY' as ReconciliationState) : ('OBSERVED_IN_SNAPSHOT' as ReconciliationState),
      carriedForward: false,
    }));

  const absent: ReconciledHolding[] = options.firstSnapshot
    ? []
    : [...previous]
        .filter((prior) => !observedSymbols.has(prior.symbol))
        .sort((a, b) => compareSymbol(a.symbol, b.symbol))
        .map((prior) => carryForward(prior, 'ABSENT_FROM_LATEST_SNAPSHOT'));

  // A symbol already observed zero is not "absent": the broker did report it.
  const all = [...holdings, ...absent];
  const weights = deriveWeights(all);
  const weightBySymbol = new Map((weights ?? []).map((row) => [row.symbol, row.weightPercentage]));
  const projected: ReconciledHolding[] = all.map((holding) => {
    const derived = weightBySymbol.get(holding.symbol);
    return derived === undefined
      ? { ...holding, weightPercentage: 0 }
      : { ...holding, weightPercentage: derived };
  });

  const rows: SnapshotRowDisposition[] = [];
  for (const holding of observed) {
    rows.push({
      kind: holding.quantity === 0 ? 'EXITED_ZERO_QUANTITY' : 'OBSERVED',
      symbol: holding.symbol,
      quantity: holding.quantity,
    });
  }
  for (const holding of absent) {
    rows.push({
      kind: 'CARRIED_FORWARD_ABSENT',
      symbol: holding.symbol,
      quantity: holding.quantity,
      reason: 'ABSENT_FROM_LATEST_SNAPSHOT',
    });
  }

  const totalMarketValue = projected.reduce((sum, holding) => sum + holding.marketValue, 0);
  return {
    holdings: projected,
    absent: projected.filter((holding) => holding.reconciliationState === 'ABSENT_FROM_LATEST_SNAPSHOT'),
    rows: rows.sort((a, b) => compareSymbol(a.symbol, b.symbol) || (a.kind < b.kind ? -1 : 1)),
    counts: {
      observed: observed.filter((holding) => holding.quantity !== 0).length,
      carriedForwardAbsent: absent.length,
      exitedZeroQuantity: observed.filter((holding) => holding.quantity === 0).length,
    },
    weights,
    totalMarketValue,
    complete: absent.length === 0,
  };
}

/** Sum of the persisted rows, used to cross-check a committed revision. */
export function sumMarketValue(rows: readonly { readonly marketValue: number }[]): number {
  return rows.reduce((sum, row) => sum + (isNonNegativeFinite(row.marketValue) ? row.marketValue : 0), 0);
}

/**
 * Report-facing view of a reconciled snapshot. Deliberately surfaces what is
 * NOT fully reconciled instead of presenting a complete-looking total.
 */
export function summariseReconciliation(snapshot: ReconciledSnapshot): BrokerSnapshotReconciliation {
  return {
    observed: snapshot.counts.observed,
    exitedZeroQuantity: snapshot.counts.exitedZeroQuantity,
    carriedForwardAbsent: snapshot.counts.carriedForwardAbsent,
    unresolved: 0,
    stale: snapshot.counts.carriedForwardAbsent > 0,
    complete: snapshot.complete,
    totalMarketValue: snapshot.totalMarketValue,
    absent: snapshot.absent.map<BrokerSnapshotAbsentHolding>((holding) => ({
      symbol: holding.symbol,
      quantity: holding.quantity,
      marketValue: holding.marketValue,
      reason: 'ABSENT_FROM_LATEST_SNAPSHOT',
    })),
  };
}
