/**
 * D112-D Dynamic Engine Runner Contract.
 *
 * Responsibilities:
 * - Define type-safe inputs and outputs for dynamic sector engine execution.
 * - Distinguish between execution branch (dataMode: LIVE) and development-only
 *   freshness (DEVELOPMENT_MIXED_VINTAGE).
 * - Enforce explicit failure states (UNMAPPED_SECURITY, INVALID_EOD, SECTOR_UNSUPPORTED, etc.).
 * - Require DYNAMIC_EXECUTION_COMPLETED status upon valid execution (no production LIVE claim).
 */

export type DynamicExecutionStatus =
  | 'DYNAMIC_EXECUTION_COMPLETED'
  | 'UNMAPPED_SECURITY'
  | 'INVALID_EOD'
  | 'FUNDAMENTALS_UNAVAILABLE'
  | 'FUNDAMENTALS_STALE'
  | 'VALUATION_UNAVAILABLE'
  | 'SECTOR_UNSUPPORTED'
  | 'ENGINE_INPUT_INCOMPLETE'
  | 'ENGINE_EXECUTION_ERROR'
  | 'INVALID_ENGINE_OUTPUT';

export interface DynamicEngineRequest {
  /** NSE Ticker Symbol (e.g. 'RELIANCE', 'TCS') or ISIN */
  readonly symbolOrIsin: string;

  /** Trade date of the EOD market-data observation (YYYY-MM-DD) */
  readonly tradeDate: string;

  /** Canonical EOD closing price */
  readonly eodClosePrice: number;

  /** Optional SHA-256 hash of the source Bhavcopy archive */
  readonly archiveSha256?: string;
}

export interface DynamicEngineProvenanceDto {
  readonly dataMode: 'LIVE'; // Execution branch (non-SNAPSHOT)
  readonly dataSource: string;
  readonly freshness: 'DEVELOPMENT_MIXED_VINTAGE';
  readonly eodTradeDate: string;
  readonly eodArchiveSha256: string;
  readonly fundamentalsVintage: 'v1.1-reference';
  readonly securityMasterVersion: string;
  readonly valuationMethodologyVersion: string;
  readonly engineVersion: string;
  readonly executionStatus: DynamicExecutionStatus;
  readonly transportSemantics: string;
}

export interface DynamicEngineResult {
  readonly canonicalSecurityId: string | null;
  readonly tickerSymbol: string | null;
  readonly sector: string | null;
  readonly status: DynamicExecutionStatus;
  readonly composite: number | null;
  readonly verdict: string | null;
  readonly pillars: Record<string, number | null>;
  readonly valuationMultipleType?: string;
  readonly calculatedMultiple?: number;
  readonly valuationScore?: number | null;
  readonly provenance: DynamicEngineProvenanceDto;
  readonly reason?: string;
}
