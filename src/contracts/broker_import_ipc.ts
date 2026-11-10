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
