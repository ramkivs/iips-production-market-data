/**
 * Layer-2 Monthly Incremental EOD Batch Scheduler.
 *
 * Requirements:
 * - Orchestrates monthly batch EOD refresh.
 * - Preserves daily EOD observation granularity.
 * - Reuses existing EodIngestionPipeline and MarketDataStore.
 * - 100% idempotent: skips already ingested trading sessions or duplicates.
 * - Fails closed on missing entitlement or provider errors.
 * - Tracks execution timestamps, metrics, and failure status.
 */

import { EodIngestionPipeline, type BackfillProgress } from './eod-pipeline';
import { NseTradingCalendar } from './nse-trading-calendar';
import type { MarketDataStore } from './market-data-store';
import type { MarketDataProviderAdapter } from './provider-adapter';

export interface MonthlySchedulerConfig {
  readonly lookbackDays?: number;
  readonly autoStart?: boolean;
}

export interface MonthlyBatchRunResult {
  readonly success: boolean;
  readonly executionTimestamp: string;
  readonly targetDatesCount: number;
  readonly newlyIngestedDays: number;
  readonly totalRecordsAccepted: number;
  readonly errors: ReadonlyArray<{ tradeDate: string; error: string }>;
}

export class EodMonthlyScheduler {
  private isRunning: boolean = false;
  private readonly store: MarketDataStore;
  private readonly adapter: MarketDataProviderAdapter;
  private readonly pipeline: EodIngestionPipeline;
  private readonly lookbackDays: number;
  private lastRunResult: MonthlyBatchRunResult | null = null;

  constructor(
    store: MarketDataStore,
    adapter: MarketDataProviderAdapter,
    config?: MonthlySchedulerConfig
  ) {
    this.store = store;
    this.adapter = adapter;
    this.pipeline = new EodIngestionPipeline(this.store, this.adapter);
    this.lookbackDays = config?.lookbackDays ?? 35; // Default: ~1 month + 5 days buffer
  }

  /**
   * Executes an incremental monthly refresh:
   * Generates calendar dates for the lookback window, filters out dates already in store,
   * and runs pipeline.executeBackfill() across remaining uningested sessions.
   */
  public async executeMonthlyBatch(): Promise<MonthlyBatchRunResult> {
    const executionTimestamp = new Date().toISOString();
    const today = executionTimestamp.split('T')[0];

    const lookbackStart = new Date();
    lookbackStart.setDate(lookbackStart.getDate() - this.lookbackDays);
    const startDate = lookbackStart.toISOString().split('T')[0];

    // Generate potential trading sessions in the lookback window
    const windowSessions = NseTradingCalendar.generateTradingDays(startDate, today);

    // Identify already-ingested dates in the store
    const existingDates = new Set(this.store.getDistinctTradeDates());
    const pendingDates = windowSessions.filter((d) => !existingDates.has(d));

    if (pendingDates.length === 0) {
      const result: MonthlyBatchRunResult = {
        success: true,
        executionTimestamp,
        targetDatesCount: 0,
        newlyIngestedDays: 0,
        totalRecordsAccepted: 0,
        errors: [],
      };
      this.lastRunResult = result;
      return result;
    }

    try {
      const progress: BackfillProgress = await this.pipeline.executeBackfill(pendingDates, {
        startDate,
        endDate: today,
        stopOnError: false,
      });

      const result: MonthlyBatchRunResult = {
        success: progress.failedDays === 0,
        executionTimestamp,
        targetDatesCount: pendingDates.length,
        newlyIngestedDays: progress.successfulDays,
        totalRecordsAccepted: progress.totalRecordsAccepted,
        errors: progress.errors,
      };

      this.lastRunResult = result;
      return result;
    } catch (err) {
      const result: MonthlyBatchRunResult = {
        success: false,
        executionTimestamp,
        targetDatesCount: pendingDates.length,
        newlyIngestedDays: 0,
        totalRecordsAccepted: 0,
        errors: [{ tradeDate: today, error: err instanceof Error ? err.message : String(err) }],
      };

      this.lastRunResult = result;
      return result;
    }
  }

  public getLastRunResult(): MonthlyBatchRunResult | null {
    return this.lastRunResult;
  }
}
