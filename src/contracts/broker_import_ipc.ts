/** Browser-safe broker-import IPC vocabulary. No runtime transport or authority. */
import type { IdentityQuarantineRecord } from '../identity/quarantine.js';

/**
 * The four broker-reported daily fields carried by the Dhan detailed export.
 *
 * They are stored VERBATIM as the broker reported them. `null`/absent means
 * "the broker file did not report this field" and is never replaced by a
 * value this application calculated. `dpQty` is the depository (demat)
 * quantity and `availableQty` the quantity available to sell; they are not
 * interchangeable with `quantity` and are not used to derive it.
 */
export interface BrokerDailyFields {
  readonly dpQty?: number | null;
  readonly availableQty?: number | null;
  readonly profitLoss?: number | null;
  readonly pnlPercentage?: number | null;
}

/** Raw broker-observed holding only: canonical identity claims are forbidden. */
export interface BrokerImportHolding extends BrokerDailyFields {
  readonly symbol: string;
  readonly isin?: string;
  readonly exchange?: 'NSE' | 'BSE';
  /**
   * The exchange series (e.g. `EQ`). Only together with an explicit ISIN does
   * this form an exact P04 D114 identity; either one alone stays unresolved.
   */
  readonly series?: string;
  readonly quantity: number;
  readonly averageBuyPrice: number;
  readonly currentPrice: number;
  readonly marketValue: number;
  readonly weightPercentage: number;
  readonly active: boolean;
  readonly sourceBroker: string;
  readonly lineageDigest: string;
}

export interface BrokerImportRequest {
  readonly portfolioId: string;
  readonly expectedRevision: number;
  readonly holdings: readonly BrokerImportHolding[];
  readonly contentDigest: string;
  readonly fileName: string;
  readonly sourceBroker: string;
  readonly importedAt: string;
  readonly mode?: 'MERGE' | 'REPLACE';
  /**
   * Durable identity of this import OPERATION (required for daily snapshots).
   *
   * Distinct from `contentDigest`, which identifies the source BYTES. Two
   * genuinely different daily observations can have identical bytes, so the
   * bytes cannot be the operation identity. A retry of the same operation id
   * is idempotent; the same bytes under a new operation id are a new revision.
   */
  readonly importId?: string;
  /** True when this file is a complete daily book rather than a partial batch. */
  readonly fullSnapshot?: boolean;
  /**
   * Explicit operator approval of a partially resolvable snapshot. Without it,
   * a snapshot with any unresolved row is refused outright.
   */
  readonly partialAcceptance?: BrokerPartialAcceptanceApproval;
}

/**
 * Explicit confirmation that a partially resolvable snapshot may be persisted.
 *
 * The operator sees the totals, the resolved and unresolved rows with their
 * original identifiers and exact refusal reasons, and approves THAT summary.
 * The approval is bound to the summary digest so an approval cannot be replayed
 * against a different set of rows.
 */
export interface BrokerPartialAcceptanceApproval {
  readonly approved: true;
  readonly approvedAt: string;
  readonly approvedBy: string;
  /** Digest of the exact partial-acceptance summary the operator saw. */
  readonly summaryDigest: string;
}

/** Per-row disposition of one candidate snapshot, in original file order. */
export interface SnapshotRowDisposition {
  readonly kind:
    | 'OBSERVED'
    | 'EXITED_ZERO_QUANTITY'
    | 'CARRIED_FORWARD_ABSENT'
    | 'UNRESOLVED_IDENTITY'
    | 'DUPLICATE_SYMBOL';
  readonly symbol: string;
  readonly isin?: string;
  readonly quantity?: number;
  readonly reason?: string;
}

/** One row the snapshot could not resolve when the operator approved a partial import. */
export interface BrokerSnapshotUnresolvedRow extends BrokerDailyFields {
  readonly symbol: string;
  readonly isin?: string;
  readonly exchange?: 'NSE' | 'BSE';
  readonly series?: string;
  readonly quantity: number;
  readonly averageBuyPrice: number;
  readonly currentPrice: number;
  readonly marketValue: number;
  readonly sourceBroker: string;
  readonly lineageDigest: string;
  /** The exact reason identity qualification failed. Never a generic message. */
  readonly reason: string;
  readonly sourceRevision?: string;
}

/** A holding the latest snapshot did not mention; carried forward, not dropped. */
export interface BrokerSnapshotAbsentHolding {
  readonly symbol: string;
  readonly quantity: number;
  readonly marketValue: number;
  readonly reason: 'ABSENT_FROM_LATEST_SNAPSHOT';
}

/** What the caller must show before it may ask for partial acceptance. */
export interface BrokerPartialAcceptanceSummary {
  readonly importId: string;
  readonly totalRows: number;
  readonly resolvedCount: number;
  readonly unresolvedCount: number;
  readonly resolvedMarketValue: number;
  readonly refusedHoldings: readonly BrokerSnapshotUnresolvedRow[];
  readonly duplicateSymbols: readonly { readonly symbol: string; readonly occurrences: number }[];
  readonly summaryDigest: string;
}

export type BrokerSnapshotState = 'ACCEPTED' | 'PARTIALLY_ACCEPTED';

/** Explicit reconciliation report attached to a committed snapshot. */
export interface BrokerSnapshotReconciliation {
  readonly observed: number;
  readonly exitedZeroQuantity: number;
  readonly carriedForwardAbsent: number;
  readonly unresolved: number;
  readonly stale: boolean;
  readonly complete: boolean;
  readonly totalMarketValue: number;
  readonly absent: readonly BrokerSnapshotAbsentHolding[];
}

export type BrokerImportRefusalCode =
  | 'REFUSED_UNRESOLVED_IDENTITY'
  | 'REFUSED_STORE_GUARD'
  | 'WRITE_NOT_AUTHORIZED'
  | 'INVALID_REQUEST'
  | 'REVISION_CONFLICT'
  | 'RESOURCE_UNAVAILABLE'
  /** Duplicated symbol rows: refused explicitly, never summed or deduplicated. */
  | 'REFUSED_DUPLICATE_ROWS'
  /** Nothing to import: an empty snapshot is not evidence about a book. */
  | 'REFUSED_EMPTY_SNAPSHOT'
  /** The source bytes are not identified by a 64-hex digest. */
  | 'REFUSED_INVALID_SOURCE_DIGEST'
  /** The approval does not bind to the summary the operator was shown. */
  | 'REFUSED_APPROVAL_MISMATCH';

export interface BrokerImportRefusedHolding {
  readonly symbol: string;
  readonly reason: string;
  readonly sourceRevision?: string;
  readonly quarantineRecord?: IdentityQuarantineRecord;
}

export type BrokerImportDisposition =
  | 'SAVED_NEW_BATCH'
  | 'MERGED_INTO_EXISTING'
  | 'ALREADY_IMPORTED_NO_OP'
  /** Cancelled by the operator at the partial-acceptance prompt: nothing persisted. */
  | 'DECLINED_NO_OP';
export type BrokerImportStoreEffect = 'NONE' | 'REVISION_COMMITTED';

export interface BrokerImportSuccess {
  readonly ok: true;
  readonly disposition: BrokerImportDisposition;
  readonly revision: number;
  readonly noOp: boolean;
  readonly storeEffect: BrokerImportStoreEffect;
  readonly holdingsPersisted: number;
  readonly totalMarketValue: number;
  readonly contributions: number;
  readonly message: string;
  /** Durable identity of the import operation that produced this outcome. */
  readonly importId?: string;
  /** ACCEPTED, or PARTIALLY_ACCEPTED when unresolved rows were retained. */
  readonly snapshotState?: BrokerSnapshotState;
  /** Outstanding unresolved rows retained as evidence and still awaiting resolution. */
  readonly unresolvedCount?: number;
  /** Snapshot reconciliation detail, present for full-snapshot imports. */
  readonly reconciliation?: BrokerSnapshotReconciliation;
}

export interface BrokerImportRefusal {
  readonly ok: false;
  readonly code: BrokerImportRefusalCode;
  readonly message: string;
  readonly storeEffect: 'NONE';
  readonly refusedHoldings: readonly BrokerImportRefusedHolding[];
  readonly revision?: number;
}

export interface BrokerImportOutcomeUnknown {
  readonly ok: 'unknown';
  readonly code: 'OUTCOME_UNKNOWN';
  readonly message: string;
  readonly storeEffect: 'OUTCOME_UNKNOWN';
  readonly portfolioId: string;
  readonly contentDigest: string;
  readonly importId?: string;
}

/** Returned when the snapshot needs explicit approval before anything is written. */
export interface BrokerPartialAcceptanceRequired {
  readonly ok: false;
  readonly code: 'PARTIAL_ACCEPTANCE_REQUIRED';
  readonly message: string;
  readonly storeEffect: 'NONE';
  readonly summary: BrokerPartialAcceptanceSummary;
}

export type BrokerImportOutcome =
  | BrokerImportSuccess
  | BrokerImportRefusal
  | BrokerImportOutcomeUnknown
  | BrokerPartialAcceptanceRequired;

/** The operation's v1 payload is BrokerImportRequest; result is BrokerImportOutcome. */
export type BrokerImportIpcOperation = 'portfolio.importBroker';

export interface BrokerImportIpcRequest {
  readonly v: 1;
  readonly op: BrokerImportIpcOperation;
  readonly payload: BrokerImportRequest;
  readonly requestId?: string;
}
/** The envelope acknowledges dispatch only; inspect result.ok for the commit outcome. */
export type BrokerImportIpcResponse =
  | { readonly v: 1; readonly ok: true; readonly op: BrokerImportIpcOperation; readonly requestId?: string; readonly result: BrokerImportOutcome }
  | { readonly v: 1; readonly ok: false; readonly op: BrokerImportIpcOperation; readonly requestId?: string; readonly outcome: 'WRITE_NOT_AUTHORIZED' | 'INVALID_REQUEST' | 'RESOURCE_UNAVAILABLE' | 'REVISION_CONFLICT' | 'UNAVAILABLE'; readonly detail?: string };
