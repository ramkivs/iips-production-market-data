/** Browser-safe broker-import IPC vocabulary. No runtime transport or authority. */
import type { IdentityQuarantineRecord } from '../identity/quarantine.js';

/** Raw broker-observed holding only: canonical identity claims are forbidden. */
export interface BrokerImportHolding {
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
}

export type BrokerImportRefusalCode =
  | 'REFUSED_UNRESOLVED_IDENTITY'
  | 'REFUSED_STORE_GUARD'
  | 'WRITE_NOT_AUTHORIZED'
  | 'INVALID_REQUEST'
  | 'REVISION_CONFLICT'
  | 'RESOURCE_UNAVAILABLE';

export interface BrokerImportRefusedHolding {
  readonly symbol: string;
  readonly reason: string;
  readonly sourceRevision?: string;
  readonly quarantineRecord?: IdentityQuarantineRecord;
}

export type BrokerImportDisposition = 'SAVED_NEW_BATCH' | 'MERGED_INTO_EXISTING' | 'ALREADY_IMPORTED_NO_OP';
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
  /**
   * The security-identity qualification outcome of this import, by count and
   * by typed reason. Additive and optional: every member above is unchanged.
   *
   * `identityStatus: RESOLVED` / `resolutionDisposition: CANONICAL_P04` on a
   * stored holding state the COMPANY-level identity only. Whether the holding
   * also has a SECURITY-level identity (`securityIdentity`) is stated here and
   * nowhere else in the outcome.
   */
  readonly securityIdentityQualification?: BrokerImportSecurityIdentityQualificationSummary;
}

/** Security-level identity state of one imported holding. */
export type BrokerImportSecurityIdentityStatus =
  /** Qualified through the governed P04 -> P7 joint path. */
  | 'QUALIFIED'
  /**
   * Built from the import row's own ISIN and series without P04/P7
   * qualification (the pre-Stage-4 fallback). Stored, but not qualified.
   */
  | 'BROKER_SUPPLIED_UNQUALIFIED'
  /** No security identity was stored (`securityIdentity` is null). */
  | 'UNRESOLVED';

/**
 * Why a holding has no qualified security identity. The first eleven values
 * are the typed reasons of `qualifyHoldingSecurityIdentity`, passed through
 * unchanged. The last two are set by the import mapping when qualification was
 * not attempted.
 */
export type BrokerImportSecurityIdentityReason =
  | 'MISSING_ISIN'
  | 'INVALID_ISIN_SYNTAX'
  | 'MISSING_P04_CORRESPONDENCE'
  | 'INACTIVE_OR_MISSING_LISTING'
  | 'MISSING_SERIES_EVIDENCE'
  | 'MISSING_P7_MAPPING'
  | 'AMBIGUOUS_PROVIDER_MAPPING'
  | 'CONFLICTING_ISIN'
  | 'CONFLICTING_SERIES'
  | 'EXCHANGE_MISMATCH'
  | 'STALE_SOURCE_EVIDENCE'
  | 'MISSING_EXCHANGE'
  | 'IDENTITY_SOURCES_NOT_COMPOSED';

/** The identity sources in force when the qualification was computed. */
export interface BrokerImportQualificationSources {
  /** P04 security master batch, or null when no master was composed. */
  readonly securityMasterBatchId: string | null;
  /** SHA-256 of the P04 master file as recorded in its source revision, or null. */
  readonly securityMasterChecksumSha256: string | null;
  /** Number of P7 mappings loaded, or null when no registry was composed. */
  readonly registryMappingCount: number | null;
  /** SHA-256 over the loaded P7 mappings in canonical order, or null. */
  readonly registryDigest: string | null;
}

export interface BrokerImportUnqualifiedHolding {
  readonly symbol: string;
  readonly securityIdentityStatus: Exclude<BrokerImportSecurityIdentityStatus, 'QUALIFIED'>;
  /** Null only for `BROKER_SUPPLIED_UNQUALIFIED`. */
  readonly reason: BrokerImportSecurityIdentityReason | null;
}

export interface BrokerImportSecurityIdentityQualificationSummary {
  /**
   * `COMMITTED_REVISION`: the counts describe the holdings of `revision`.
   * `SUBMITTED_ROWS_NO_REVISION_WRITTEN`: the import was an idempotent no-op;
   * the counts describe the submitted rows against the sources loaded now and
   * say nothing about what an earlier import stored.
   */
  readonly appliesTo: 'COMMITTED_REVISION' | 'SUBMITTED_ROWS_NO_REVISION_WRITTEN';
  readonly holdings: number;
  /** Company-level identity. Equals `holdings`: one unresolved row refuses the whole import. */
  readonly companyIdentityResolved: number;
  readonly securityIdentityQualified: number;
  readonly securityIdentityBrokerSuppliedUnqualified: number;
  readonly securityIdentityUnresolved: number;
  /** Count of unresolved holdings per typed reason. Keys are `BrokerImportSecurityIdentityReason` values. */
  readonly unresolvedByReason: Readonly<Record<string, number>>;
  /** Every holding that is not `QUALIFIED`, in symbol order, at most 512 entries. */
  readonly unqualifiedHoldings: readonly BrokerImportUnqualifiedHolding[];
  /** True when the list above was cut at the limit. The counts are always complete. */
  readonly unqualifiedHoldingsTruncated: boolean;
  readonly sources: BrokerImportQualificationSources;
  /**
   * `RECORDED`: the full per-holding record was written to the local audit
   * chain in the same transaction as the revision.
   * `NOT_RECORDED_NO_REVISION`: no revision was written, so nothing was recorded.
   * `NOT_SUPPORTED_BY_WRITER`: the writer has no durable record surface; this
   * summary is then the only statement of the outcome.
   */
  readonly durableRecord: 'RECORDED' | 'NOT_RECORDED_NO_REVISION' | 'NOT_SUPPORTED_BY_WRITER';
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
}

export type BrokerImportOutcome = BrokerImportSuccess | BrokerImportRefusal | BrokerImportOutcomeUnknown;

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
