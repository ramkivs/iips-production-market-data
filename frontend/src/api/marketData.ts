/**
 * Frontend Client for the Canonical IIPS Market Data API (R-2).
 */

import { authFetch } from './authFetch';

export interface MarketDataStatus {
  readonly isLiveProvisioned: boolean;
  readonly provider: string;
  readonly refreshCadenceMinutes: number;
  readonly lastSuccessfulRefresh: string | null;
  readonly lastAttemptTimestamp: string | null;
  readonly freshness: 'CURRENT' | 'STALE' | 'UNAVAILABLE';
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

export interface CanonicalEquityCurrentQuote {
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
  readonly timestamp: string;
  readonly receivedAt: string;
  readonly quality: string;
}

export interface CanonicalCurrentStateResponse {
  readonly records: readonly CanonicalEquityCurrentQuote[];
  readonly total: number;
  readonly freshness: 'CURRENT' | 'STALE' | 'UNAVAILABLE';
}

export interface CanonicalHistoryResponse {
  readonly symbol: string;
  readonly count: number;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly records: ReadonlyArray<{
    readonly tradeDate: string;
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
    readonly quality: string;
  }>;
}

export async function fetchMarketDataStatus(): Promise<MarketDataStatus> {
  const res = await authFetch('/api/market-data/status');
  if (!res.ok) {
    throw new Error(`Failed to fetch market data status: ${res.status}`);
  }
  return res.json() as Promise<MarketDataStatus>;
}

export async function fetchMarketDataCurrent(): Promise<CanonicalCurrentStateResponse> {
  const res = await authFetch('/api/market-data/current');
  if (!res.ok) {
    throw new Error(`Failed to fetch current market data: ${res.status}`);
  }
  return res.json() as Promise<CanonicalCurrentStateResponse>;
}

export async function fetchMarketDataHistory(
  symbol: string,
  startDate?: string,
  endDate?: string
): Promise<CanonicalHistoryResponse> {
  const params = new URLSearchParams({ symbol });
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const res = await authFetch(`/api/market-data/history?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch history for ${symbol}: ${res.status}`);
  }
  return res.json() as Promise<CanonicalHistoryResponse>;
}
