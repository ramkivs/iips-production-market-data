/**
 * EOD Ingestion and Configurable Historical Backfill Pipeline.
 *
 * Requirements:
 * - Dedicated EOD ingestion pipeline targeting CM-UDiFF Common Bhavcopy Final.
 * - Multi-stage pipeline: RAW -> PARSE -> EQUITY ELIGIBILITY FILTER -> VALIDATION/QC -> NORMALIZATION -> RECONCILIATION -> CANONICAL STORE.
 * - Configurable historical backfill (default: 10 years / 2500 trading days).
 * - Explicit start date, end date, resumption, idempotency, and metric tracking.
 * - Does not claim data is populated until source files are ingested and reconciled.
 */

import { parseUdiffCsv, isEligibleEquity } from './cm-udiff-parser';
import { validateAndNormalizeRecord } from './normalizer';
import type { MarketDataStore } from './market-data-store';
import type { MarketDataProviderAdapter } from './provider-adapter';
import type {
  CanonicalEquityEodRecord,
  EodIngestionResult,
  IngestionMetrics,
  QuarantinedRecord,
} from './canonical-contract';

export interface BackfillOptions {
  startDate?: string;
  endDate?: string;
  defaultYears?: number;
  stopOnError?: boolean;
}

export interface BackfillProgress {
  totalRequestedDays: number;
  processedDays: number;
  successfulDays: number;
  failedDays: number;
  totalRecordsAccepted: number;
  totalQuarantined: number;
  earliestDateProcessed: string | null;
  latestDateProcessed: string | null;
  errors: Array<{ tradeDate: string; error: string }>;
}

export class EodIngestionPipeline {
  constructor(
    private store: MarketDataStore,
    private adapter?: MarketDataProviderAdapter
  ) {}

  /**
   * Ingests a raw CM-UDiFF Bhavcopy CSV content string.
   */
  public ingestBhavcopyCsv(csvContent: string, sourceFile: string): EodIngestionResult {
    const timestamp = new Date().toISOString();
    const parseRes = parseUdiffCsv(csvContent);

    let eligibleCount = 0;
    const acceptedRecords: CanonicalEquityEodRecord[] = [];
    const quarantinedRecords: QuarantinedRecord[] = [];

    // Derive tradeDate from rows if possible, or fallback to file name
    let detectedTradeDate = '';

    for (const rawRow of parseRes.rows) {
      if (!detectedTradeDate && (rawRow.TradDt || rawRow.BizDt)) {
        detectedTradeDate = String(rawRow.TradDt || rawRow.BizDt);
      }

      // Equity eligibility filter (Non-equities like debt/mutual funds/derivatives rejected)
      if (!isEligibleEquity(rawRow)) {
        continue;
      }
      eligibleCount++;

      // Quality and OHLC validation
      const normRes = validateAndNormalizeRecord(rawRow, sourceFile);
      if (normRes.valid) {
        acceptedRecords.push(normRes.record);
      } else {
        quarantinedRecords.push(normRes.quarantine);
      }
    }

    if (!detectedTradeDate) {
      detectedTradeDate = new Date().toISOString().split('T')[0];
    }

    // Ingest into canonical historical store (handles deduplication and reconciliation)
    const storeRes = this.store.ingestEodRecords(acceptedRecords, detectedTradeDate, sourceFile);

    // Merge quarantined records
    const allQuarantined = [...quarantinedRecords, ...storeRes.quarantined];

    const metrics: IngestionMetrics = Object.freeze({
      sourceRecordCount: parseRes.rawCount,
      eligibleEquityCount: eligibleCount,
      acceptedCount: storeRes.metrics.acceptedCount,
      rejectedCount: parseRes.rawCount - eligibleCount,
      quarantinedCount: allQuarantined.length,
      duplicateCount: storeRes.metrics.duplicateCount,
      processingTimestamp: timestamp,
      freshnessState: 'CURRENT',
    });

    return {
      tradeDate: detectedTradeDate,
      sourceFile,
      metrics,
      records: acceptedRecords,
      quarantined: allQuarantined,
    };
  }

  /**
   * Runs configurable historical backfill across a trading calendar.
   * If dates are omitted, defaults to the specified number of years (default: 10 years).
   */
  public async executeBackfill(
    calendarDates: readonly string[],
    options?: BackfillOptions
  ): Promise<BackfillProgress> {
    if (!this.adapter) {
      throw new Error('An adapter must be configured to run historical backfill');
    }

    const defaultYears = options?.defaultYears ?? 10;
    let startDate = options?.startDate;
    let endDate = options?.endDate;

    if (!endDate) {
      endDate = new Date().toISOString().split('T')[0];
    }
    if (!startDate) {
      const d = new Date(endDate);
      d.setFullYear(d.getFullYear() - defaultYears);
      startDate = d.toISOString().split('T')[0];
    }

    // Filter calendar to date range
    const targetDates = calendarDates.filter((d) => d >= startDate! && d <= endDate!);

    const progress: BackfillProgress = {
      totalRequestedDays: targetDates.length,
      processedDays: 0,
      successfulDays: 0,
      failedDays: 0,
      totalRecordsAccepted: 0,
      totalQuarantined: 0,
      earliestDateProcessed: null,
      latestDateProcessed: null,
      errors: [],
    };

    for (const tradeDate of targetDates) {
      progress.processedDays++;
      try {
        const fetchRes = await this.adapter.fetchEodBhavcopy(tradeDate);
        if (!fetchRes.success || !fetchRes.csvContent) {
          progress.failedDays++;
          progress.errors.push({
            tradeDate,
            error: fetchRes.error ?? 'Missing CSV content from provider',
          });
          if (options?.stopOnError) {
            break;
          }
          continue;
        }

        const ingestRes = this.ingestBhavcopyCsv(
          fetchRes.csvContent,
          fetchRes.sourceFile ?? `bhavcopy_${tradeDate}.csv`
        );

        progress.successfulDays++;
        progress.totalRecordsAccepted += ingestRes.metrics.acceptedCount;
        progress.totalQuarantined += ingestRes.metrics.quarantinedCount;

        if (!progress.earliestDateProcessed || tradeDate < progress.earliestDateProcessed) {
          progress.earliestDateProcessed = tradeDate;
        }
        if (!progress.latestDateProcessed || tradeDate > progress.latestDateProcessed) {
          progress.latestDateProcessed = tradeDate;
        }
      } catch (err) {
        progress.failedDays++;
        progress.errors.push({
          tradeDate,
          error: err instanceof Error ? err.message : String(err),
        });
        if (options?.stopOnError) {
          break;
        }
      }
    }

    return progress;
  }
}
