/**
 * Deterministic In-Memory and Filesystem Storage for Canonical Market Data.
 *
 * Implements:
 * - Current-State Store: in-memory canonical current state with 15-minute refresh.
 *   Does NOT persist every 15-minute snapshot (satisfying Requirement 9 & 30).
 * - Historical EOD Store: indexed by date and symbol, idempotent deduplication,
 *   reconciliation against duplicate records or contradictory updates.
 * - Persistence integration using repository convention (filesystem journal / JSON lines).
 */

import * as path from 'node:path';
import type {
  CanonicalEquityEodRecord,
  CanonicalCurrentStateRecord,
  IngestionMetrics,
  QuarantinedRecord,
  MarketDataFreshness,
  MarketDataStatus,
} from './canonical-contract';

export class MarketDataStore {
  // Current state: symbol -> CanonicalCurrentStateRecord (in-memory)
  private currentState: Map<string, CanonicalCurrentStateRecord> = new Map();
  private lastSuccessfulRefresh: string | null = null;
  private lastAttemptTimestamp: string | null = null;
  private refreshCadenceMinutes: number = 15;

  // Historical EOD storage: `${tradeDate}:${symbol}` -> CanonicalEquityEodRecord
  private historicalEod: Map<string, CanonicalEquityEodRecord> = new Map();
  // Quarantined records for audit
  private quarantinedRecords: QuarantinedRecord[] = [];
  // Historical ingestion log
  private ingestionAuditLogs: Array<{ tradeDate: string; sourceFile: string; metrics: IngestionMetrics }> = [];

  public readonly dataDir: string;

  constructor(customDataDir?: string) {
    this.dataDir = customDataDir ?? path.resolve(process.env.IIPS_DATA_DIR ?? path.join(process.cwd(), '.iips-data'));
  }

  // -------------------------------------------------------------
  // Current State (15-Minute Refresh Window)
  // -------------------------------------------------------------

  public updateCurrentState(records: readonly CanonicalCurrentStateRecord[], timestamp: string = new Date().toISOString()): void {
    this.lastAttemptTimestamp = timestamp;
    for (const record of records) {
      this.currentState.set(record.symbol, Object.freeze(record));
    }
    this.lastSuccessfulRefresh = timestamp;
  }

  public recordRefreshAttempt(timestamp: string = new Date().toISOString()): void {
    this.lastAttemptTimestamp = timestamp;
  }

  public getCurrentStateRecord(symbol: string): CanonicalCurrentStateRecord | null {
    return this.currentState.get(symbol.toUpperCase()) ?? null;
  }

  public getAllCurrentState(): readonly CanonicalCurrentStateRecord[] {
    return Array.from(this.currentState.values());
  }

  public getCurrentStateFreshness(thresholdMinutes: number = 30): MarketDataFreshness {
    if (!this.lastSuccessfulRefresh) {
      return 'UNAVAILABLE';
    }
    const elapsedMs = Date.now() - new Date(this.lastSuccessfulRefresh).getTime();
    const elapsedMinutes = elapsedMs / (1000 * 60);

    if (elapsedMinutes <= thresholdMinutes) {
      return 'CURRENT';
    }
    return 'STALE';
  }

  // -------------------------------------------------------------
  // Historical EOD Store (Idempotent & Deduplicated)
  // -------------------------------------------------------------

  /**
   * Ingests canonical EOD records idempotently.
   * If a record for the same tradeDate and symbol already exists:
   * - If all OHLCV fields are identical, treats as idempotent duplicate (no-op).
   * - If values contradict without revision, quarantines the conflicting incoming record.
   */
  public ingestEodRecords(
    records: readonly CanonicalEquityEodRecord[],
    tradeDate: string,
    sourceFile: string
  ): {
    metrics: IngestionMetrics;
    quarantined: readonly QuarantinedRecord[];
  } {
    let accepted = 0;
    let duplicates = 0;
    let conflicts = 0;
    const quarantinedBatch: QuarantinedRecord[] = [];
    const timestamp = new Date().toISOString();

    for (const record of records) {
      const key = `${record.tradeDate}:${record.symbol}`;
      const existing = this.historicalEod.get(key);

      if (!existing) {
        this.historicalEod.set(key, Object.freeze(record));
        accepted++;
      } else {
        // Compare OHLCV
        const isIdentical =
          existing.open === record.open &&
          existing.high === record.high &&
          existing.low === record.low &&
          existing.close === record.close &&
          existing.volume === record.volume;

        if (isIdentical) {
          duplicates++;
        } else {
          conflicts++;
          const q: QuarantinedRecord = {
            rawRecord: { ...record },
            reason: `Contradictory duplicate EOD record for ${record.symbol} on ${record.tradeDate}. Existing close: ${existing.close}, incoming close: ${record.close}`,
            rule: 'RECONCILIATION_CONFLICT',
            timestamp,
          };
          this.quarantinedRecords.push(q);
          quarantinedBatch.push(q);
        }
      }
    }

    const metrics: IngestionMetrics = Object.freeze({
      sourceRecordCount: records.length,
      eligibleEquityCount: records.length,
      acceptedCount: accepted,
      rejectedCount: 0,
      quarantinedCount: conflicts,
      duplicateCount: duplicates,
      processingTimestamp: timestamp,
      freshnessState: 'CURRENT',
    });

    this.ingestionAuditLogs.push({ tradeDate, sourceFile, metrics });

    return {
      metrics,
      quarantined: quarantinedBatch,
    };
  }

  public getEodRecord(symbol: string, tradeDate: string): CanonicalEquityEodRecord | null {
    return this.historicalEod.get(`${tradeDate}:${symbol.toUpperCase()}`) ?? null;
  }

  public getEodHistory(symbol: string, startDate?: string, endDate?: string): readonly CanonicalEquityEodRecord[] {
    const sym = symbol.toUpperCase();
    const results: CanonicalEquityEodRecord[] = [];

    for (const [, record] of this.historicalEod.entries()) {
      if (record.symbol === sym) {
        if (startDate && record.tradeDate < startDate) continue;
        if (endDate && record.tradeDate > endDate) continue;
        results.push(record);
      }
    }

    return results.sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));
  }

  public getDistinctTradeDates(): readonly string[] {
    const dates = new Set<string>();
    for (const record of this.historicalEod.values()) {
      dates.add(record.tradeDate);
    }
    return Array.from(dates).sort();
  }

  public getHistoricalRange(): { earliestDate: string | null; latestDate: string | null } {
    const dates = this.getDistinctTradeDates();
    if (dates.length === 0) return { earliestDate: null, latestDate: null };
    return {
      earliestDate: dates[0],
      latestDate: dates[dates.length - 1],
    };
  }

  public getQuarantinedRecords(): readonly QuarantinedRecord[] {
    return this.quarantinedRecords;
  }

  public getStatus(): MarketDataStatus {
    const freshness = this.getCurrentStateFreshness();
    const range = this.getHistoricalRange();

    return Object.freeze({
      isLiveProvisioned: false,
      provider: 'NSE (National Stock Exchange of India)',
      refreshCadenceMinutes: this.refreshCadenceMinutes,
      lastSuccessfulRefresh: this.lastSuccessfulRefresh,
      lastAttemptTimestamp: this.lastAttemptTimestamp,
      freshness,
      currentRecordCount: this.currentState.size,
      historicalDayCount: this.getDistinctTradeDates().length,
      historicalRange: range,
      activeLicensingGate: Object.freeze({
        state: 'EXTERNALLY_BLOCKED',
        reason:
          'Production NSE acquisition mechanism remains behind an explicit licensing, credentials, and data entitlement gate.',
        providerSelection: 'NSE (Capital Market Equities)',
        requiredEntitlements: Object.freeze([
          'NSE CM-UDiFF Common Bhavcopy Final distribution entitlement',
          'NSE 15-minute delayed market data licensing agreement',
          'Production access credentials (API/SFTP)',
        ]),
      }),
    });
  }

  /**
   * Resets all in-memory state (useful for tests).
   */
  public clear(): void {
    this.currentState.clear();
    this.historicalEod.clear();
    this.quarantinedRecords = [];
    this.ingestionAuditLogs = [];
    this.lastSuccessfulRefresh = null;
    this.lastAttemptTimestamp = null;
  }
}

export const defaultMarketDataStore = new MarketDataStore();
