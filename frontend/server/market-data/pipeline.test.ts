import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MarketDataStore } from './market-data-store';
import { CurrentStateScheduler } from './current-state-scheduler';
import {
  ReferenceFileBasedAdapter,
  NseProductionAcquisitionAdapter,
} from './provider-adapter';
import { EodIngestionPipeline } from './eod-pipeline';
import {
  SYNTHETIC_VALID_BHAVCOPY_2026_09_14,
  SYNTHETIC_ANOMALOUS_BHAVCOPY,
} from './fixtures/synthetic-fixtures';
import type { CanonicalCurrentStateRecord } from './canonical-contract';

describe('MarketDataStore & CurrentStateScheduler (R-2)', () => {
  let store: MarketDataStore;
  let adapter: ReferenceFileBasedAdapter;

  beforeEach(() => {
    store = new MarketDataStore();
    adapter = new ReferenceFileBasedAdapter();
  });

  afterEach(() => {
    store.clear();
  });

  it('updates current state in-memory and accurately tracks freshness', () => {
    const mockQuote: CanonicalCurrentStateRecord = {
      symbol: 'TCS',
      isin: 'INE467B01029',
      exchange: 'NSE',
      lastPrice: 4150.0,
      change: 40.0,
      pChange: 0.97,
      open: 4120.0,
      high: 4165.0,
      low: 4105.0,
      close: 4150.8,
      previousClose: 4110.0,
      volume: 1825000,
      tradedValue: 7580000000,
      timestamp: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      quality: 'good',
    };

    expect(store.getCurrentStateFreshness()).toBe('UNAVAILABLE');

    store.updateCurrentState([mockQuote]);
    expect(store.getCurrentStateFreshness()).toBe('CURRENT');
    expect(store.getCurrentStateRecord('TCS')?.lastPrice).toBe(4150.0);
    expect(store.getAllCurrentState()).toHaveLength(1);
  });

  it('detects stale current state beyond the freshness threshold', () => {
    const fortyMinsAgo = new Date(Date.now() - 40 * 60 * 1000).toISOString();
    store.updateCurrentState([], fortyMinsAgo);

    // With 30 min threshold, 40 mins is STALE
    expect(store.getCurrentStateFreshness(30)).toBe('STALE');
  });

  it('executes 15-minute refresh cycle via scheduler and handles retries upon failure', async () => {
    const mockQuote: CanonicalCurrentStateRecord = {
      symbol: 'INFY',
      isin: 'INE009A01021',
      exchange: 'NSE',
      lastPrice: 1910.0,
      change: 38.0,
      pChange: 2.03,
      open: 1880.0,
      high: 1915.0,
      low: 1875.0,
      close: 1908.45,
      previousClose: 1872.0,
      volume: 3410000,
      tradedValue: 6500000000,
      timestamp: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      quality: 'good',
    };
    adapter.setMockCurrentState([mockQuote]);

    const scheduler = new CurrentStateScheduler(adapter, store, {
      intervalMs: 15 * 60 * 1000,
      maxRetries: 2,
      retryDelayMs: 10,
    });

    const refreshRes = await scheduler.executeRefresh();
    expect(refreshRes.success).toBe(true);
    expect(refreshRes.recordCount).toBe(1);
    expect(refreshRes.freshness).toBe('CURRENT');
    expect(store.getCurrentStateRecord('INFY')?.lastPrice).toBe(1910.0);

    // Simulate adapter failure and verify retry exhaustion
    adapter.setFailureMode(true, 'NSE_FEED_UNAVAILABLE');
    const failedRes = await scheduler.executeRefresh();
    expect(failedRes.success).toBe(false);
    expect(failedRes.attemptCount).toBe(2);
    expect(failedRes.error).toContain('Refresh failed after 2 attempts: NSE_FEED_UNAVAILABLE');
  });

  it('enforces production acquisition entitlement gate on NseProductionAcquisitionAdapter', async () => {
    // Unprovisioned adapter
    const unprovisioned = new NseProductionAcquisitionAdapter();
    expect(unprovisioned.isEntitled).toBe(false);

    const res = await unprovisioned.fetchCurrentState();
    expect(res.success).toBe(false);
    expect(res.error).toContain('EXTERNALLY_BLOCKED: Production NSE credentials');

    const eodRes = await unprovisioned.fetchEodBhavcopy('2026-09-14');
    expect(eodRes.success).toBe(false);
    expect(eodRes.error).toContain('EXTERNALLY_BLOCKED');
  });
});

describe('EOD Ingestion Pipeline & Historical Backfill (R-2)', () => {
  let store: MarketDataStore;
  let adapter: ReferenceFileBasedAdapter;
  let pipeline: EodIngestionPipeline;

  beforeEach(() => {
    store = new MarketDataStore();
    adapter = new ReferenceFileBasedAdapter();
    pipeline = new EodIngestionPipeline(store, adapter);
  });

  afterEach(() => {
    store.clear();
  });

  it('ingests valid Bhavcopy, filters eligible equities, and stores idempotent canonical records', () => {
    const ingestRes = pipeline.ingestBhavcopyCsv(
      SYNTHETIC_VALID_BHAVCOPY_2026_09_14,
      'bhavcopy_2026_09_14.csv'
    );

    expect(ingestRes.metrics.sourceRecordCount).toBe(5);
    expect(ingestRes.metrics.eligibleEquityCount).toBe(5);
    expect(ingestRes.metrics.acceptedCount).toBe(5);
    expect(ingestRes.metrics.quarantinedCount).toBe(0);
    expect(ingestRes.metrics.duplicateCount).toBe(0);

    const relRec = store.getEodRecord('RELIANCE', '2026-09-14');
    expect(relRec).not.toBeNull();
    expect(relRec?.close).toBe(2972.25);

    // Re-ingest the exact same file -> must be idempotent with 0 duplicates inserted
    const repeatRes = pipeline.ingestBhavcopyCsv(
      SYNTHETIC_VALID_BHAVCOPY_2026_09_14,
      'bhavcopy_2026_09_14.csv'
    );
    expect(repeatRes.metrics.acceptedCount).toBe(0);
    expect(repeatRes.metrics.duplicateCount).toBe(5);
    expect(store.getDistinctTradeDates()).toEqual(['2026-09-14']);
  });

  it('quarantines contradictory duplicate EOD records during reconciliation', () => {
    pipeline.ingestBhavcopyCsv(SYNTHETIC_VALID_BHAVCOPY_2026_09_14, 'bhavcopy_v1.csv');

    // Create contradictory Bhavcopy where RELIANCE close is changed from 2972.25 to 2960.00 without versioning (High is 2985.50, Low is 2940.00 so 2960.00 is a valid OHLC close)
    const contradictory = SYNTHETIC_VALID_BHAVCOPY_2026_09_14.replace('2972.25', '2960.00');
    const conflictRes = pipeline.ingestBhavcopyCsv(contradictory, 'bhavcopy_v2_conflict.csv');

    expect(conflictRes.metrics.quarantinedCount).toBe(1);
    expect(conflictRes.quarantined[0].rule).toBe('RECONCILIATION_CONFLICT');
    expect(conflictRes.quarantined[0].reason).toContain('Contradictory duplicate EOD record');

    // Original record must survive unchanged
    const surviving = store.getEodRecord('RELIANCE', '2026-09-14');
    expect(surviving?.close).toBe(2972.25);
  });

  it('executes configurable historical backfill across trading dates', async () => {
    adapter.registerMockBhavcopy('2026-09-11', SYNTHETIC_VALID_BHAVCOPY_2026_09_14.replace(/2026-09-14/g, '2026-09-11'), 'bhavcopy_2026-09-11.csv');
    adapter.registerMockBhavcopy('2026-09-12', SYNTHETIC_VALID_BHAVCOPY_2026_09_14.replace(/2026-09-14/g, '2026-09-12'), 'bhavcopy_2026-09-12.csv');
    adapter.registerMockBhavcopy('2026-09-13', SYNTHETIC_VALID_BHAVCOPY_2026_09_14.replace(/2026-09-14/g, '2026-09-13'), 'bhavcopy_2026-09-13.csv');

    const calendar = ['2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14'];

    const progress = await pipeline.executeBackfill(calendar, {
      startDate: '2026-09-11',
      endDate: '2026-09-13',
    });

    expect(progress.totalRequestedDays).toBe(3);
    expect(progress.successfulDays).toBe(3);
    expect(progress.failedDays).toBe(0);
    expect(progress.totalRecordsAccepted).toBe(15);
    expect(store.getDistinctTradeDates()).toHaveLength(3);

    const history = store.getEodHistory('TCS', '2026-09-11', '2026-09-13');
    expect(history).toHaveLength(3);
    expect(history[0].tradeDate).toBe('2026-09-11');
    expect(history[2].tradeDate).toBe('2026-09-13');
  });

  it('discloses honest status including active licensing gate and zero historical coverage claims', () => {
    const status = store.getStatus();
    expect(status.isLiveProvisioned).toBe(false);
    expect(status.refreshCadenceMinutes).toBe(15);
    expect(status.activeLicensingGate.state).toBe('EXTERNALLY_BLOCKED');
    expect(status.activeLicensingGate.requiredEntitlements).toContain(
      'NSE CM-UDiFF Common Bhavcopy Final distribution entitlement'
    );
  });
});
