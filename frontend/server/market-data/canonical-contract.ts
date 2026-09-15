/**
 * Canonical IIPS Market Data Contract (R-2).
 *
 * Requirements:
 * - Instrument universe: NSE-listed EQUITIES ONLY (read/analysis only).
 * - Provider-neutral canonical interface.
 * - Explicit typing for canonical records, ingestion metrics, quality, freshness, and status.
 */

export const CANONICAL_MARKET_DATA_VERSION = '1.0';

export type MarketDataQuality = 'good' | 'partial' | 'stale' | 'unavailable';

export type MarketDataFreshness = 'CURRENT' | 'STALE' | 'UNAVAILABLE';

export interface CanonicalEquityEodRecord {
  readonly tradeDate: string; // ISO date 'YYYY-MM-DD'
  readonly exchange: 'NSE';
  readonly isin: string;
  readonly symbol: string;
  readonly securityName: string;
  readonly securitySeries: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly lastPrice: number;
  readonly previousClose: number;
  readonly volume: number;
  readonly tradedValue: number;
  readonly transactionCount: number | null;
  readonly sourceIdentifier: string;
  readonly sourceFile: string;
  readonly sourceTimestamp: string;
  readonly ingestionTimestamp: string;
  readonly quality: MarketDataQuality;
}

export interface CanonicalCurrentStateRecord {
  readonly symbol: string;
  readonly isin: string;
  readonly exchange: 'NSE';
  readonly lastPrice: number;
  readonly change: number;
  readonly pChange: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly previousClose: number;
  readonly volume: number;
  readonly tradedValue: number;
  readonly timestamp: string; // Time of current quote
  readonly receivedAt: string; // Time of ingestion
  readonly quality: MarketDataQuality;
}

export interface IngestionMetrics {
  readonly sourceRecordCount: number;
  readonly eligibleEquityCount: number;
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly quarantinedCount: number;
  readonly duplicateCount: number;
  readonly processingTimestamp: string;
  readonly freshnessState: MarketDataFreshness;
}

export interface QuarantinedRecord {
  readonly rawRecord: Record<string, unknown>;
  readonly reason: string;
  readonly rule: string;
  readonly timestamp: string;
}

export interface EodIngestionResult {
  readonly tradeDate: string;
  readonly sourceFile: string;
  readonly metrics: IngestionMetrics;
  readonly records: readonly CanonicalEquityEodRecord[];
  readonly quarantined: readonly QuarantinedRecord[];
}

export interface MarketDataStatus {
  readonly isLiveProvisioned: boolean;
  readonly provider: string;
  readonly refreshCadenceMinutes: number;
  readonly lastSuccessfulRefresh: string | null;
  readonly lastAttemptTimestamp: string | null;
  readonly freshness: MarketDataFreshness;
  readonly currentRecordCount: number;
  readonly historicalDayCount: number;
  readonly historicalRange: {
    readonly earliestDate: string | null;
    readonly latestDate: string | null;
  };
  readonly activeLicensingGate: {
    readonly state: 'EXTERNALLY_BLOCKED' | 'PROVISIONED';
    readonly reason: string;
    readonly providerSelection: string;
    readonly requiredEntitlements: readonly string[];
  };
}
