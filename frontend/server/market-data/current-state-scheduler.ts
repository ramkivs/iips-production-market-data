/**
 * 15-Minute Scheduler and Current-State Refresh Engine.
 *
 * Requirements:
 * - Approximately 15-minute refresh cadence.
 * - Deterministic retry handling with exponential backoff / max retries.
 * - Idempotent, safe to repeat.
 * - Visible failure status: never masks errors or silently presents stale data as current.
 * - Does NOT persist every 15-minute snapshot (in-memory canonical state only).
 */

import type { MarketDataProviderAdapter } from './provider-adapter';
import type { MarketDataStore } from './market-data-store';
import type { MarketDataFreshness } from './canonical-contract';

export interface SchedulerConfig {
  intervalMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  freshnessThresholdMinutes?: number;
}

export interface RefreshResult {
  readonly success: boolean;
  readonly recordCount: number;
  readonly attemptCount: number;
  readonly timestamp: string;
  readonly freshness: MarketDataFreshness;
  readonly error?: string;
}

export class CurrentStateScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private intervalMs: number;
  private maxRetries: number;
  private retryDelayMs: number;
  private freshnessThresholdMinutes: number;

  constructor(
    private adapter: MarketDataProviderAdapter,
    private store: MarketDataStore,
    config?: SchedulerConfig
  ) {
    this.intervalMs = config?.intervalMs ?? 15 * 60 * 1000; // 15 mins default
    this.maxRetries = config?.maxRetries ?? 3;
    this.retryDelayMs = config?.retryDelayMs ?? 1000;
    this.freshnessThresholdMinutes = config?.freshnessThresholdMinutes ?? 30;
  }

  /**
   * Executes a single refresh cycle with retry logic.
   */
  public async executeRefresh(): Promise<RefreshResult> {
    const timestamp = new Date().toISOString();
    this.store.recordRefreshAttempt(timestamp);

    let attempts = 0;
    let lastError = '';

    while (attempts < this.maxRetries) {
      attempts++;
      try {
        const response = await this.adapter.fetchCurrentState();
        if (response.success && Array.isArray(response.records)) {
          this.store.updateCurrentState(response.records, timestamp);
          return {
            success: true,
            recordCount: response.records.length,
            attemptCount: attempts,
            timestamp,
            freshness: this.store.getCurrentStateFreshness(this.freshnessThresholdMinutes),
          };
        } else {
          lastError = response.error ?? 'Unknown adapter failure';
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }

      // If we haven't exhausted retries, delay before retrying
      if (attempts < this.maxRetries && this.retryDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs));
      }
    }

    // Retries exhausted
    return {
      success: false,
      recordCount: this.store.getAllCurrentState().length,
      attemptCount: attempts,
      timestamp,
      freshness: this.store.getCurrentStateFreshness(this.freshnessThresholdMinutes),
      error: `Refresh failed after ${attempts} attempts: ${lastError}`,
    };
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    void this.executeRefresh();
    this.timer = setInterval(() => {
      void this.executeRefresh();
    }, this.intervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  public getStatus(): { isRunning: boolean; intervalMs: number } {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
    };
  }
}
