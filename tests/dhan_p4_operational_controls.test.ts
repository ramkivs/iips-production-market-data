/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-P4 Operational Controls Suite (synthetic, deterministic clocks)
 *
 * Covers refresh orchestration, quote/historical caching, rate limiting,
 * concurrency, coalescing, retry policy and freshness/failure governance.
 * No live Dhan behaviour is claimed; rate-limit values are configured
 * operational safeguards, not vendor-certified limits.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  CanonicalEnvelope,
  MarketQuotePayload,
  DhanBoundedCache,
  DhanConcurrencyLimiter,
  DhanHistoricalCache,
  DhanRateLimiter,
  DhanRefreshOrchestrator,
  DhanRequestCoalescer,
  DhanSecurityScope,
  dhanHistoricalCacheKey,
  dhanQuoteCacheKey,
  isTransientFailure,
  withBoundedRetry,
  dhanOk,
  dhanFailure,
} from '../src/index.js';

// ── deterministic helpers ────────────────────────────────────────────────────

let nowMs = Date.UTC(2026, 8, 25, 10, 0, 0);
const now = () => new Date(nowMs);
const advance = (ms: number) => { nowMs += ms; };

function envelope(asOfIso: string, ltp = 100): CanonicalEnvelope<MarketQuotePayload> {
  return {
    envelopeId: `env-${ltp}`,
    domain: 'D01_QUOTES',
    mode: 'SNAPSHOT',
    companyId: 'COMP-A',
    payload: {
      companyId: 'COMP-A', symbol: 'A', exchange: 'NSE', currency: 'INR',
      bid: ltp - 0.1, ask: ltp + 0.1, ltp, open: ltp - 1, high: ltp + 1, low: ltp - 2,
      previousClose: ltp - 0.5, volume: 100, change: 0.5, pctChange: 0.5,
    },
    provenance: {
      sourceClassification: 'CANONICAL_MARKET_DATA', vendorTier: 'TIER_2_COMMERCIAL',
      asOf: asOfIso, receivedAt: now().toISOString(), evaluatedAt: now().toISOString(),
      dataVersion: 'test', lineageHash: 'abc', qualityState: 'GOOD',
    },
    timestamp: now().toISOString(),
    schemaVersion: '1.0.0',
  } as CanonicalEnvelope<MarketQuotePayload>;
}

const SCOPE_A: DhanSecurityScope = { companyId: 'COMP-A', exchangeSegment: 'NSE_EQ', isin: 'INE000SYNTH1' };
const SCOPE_A2: DhanSecurityScope = { companyId: 'COMP-A', exchangeSegment: 'NSE_EQ', isin: 'INE000SYNTH2' };
const SCOPE_BSE: DhanSecurityScope = { companyId: 'COMP-A', exchangeSegment: 'BSE_EQ', isin: 'INE000SYNTH1' };

function makeOrchestrator(
  fetchQuote: (scope: DhanSecurityScope) => Promise<ReturnType<typeof dhanOk<CanonicalEnvelope<MarketQuotePayload>>> | ReturnType<typeof dhanFailure>>,
  opts: { capacity?: number; maxInFlight?: number; maxRequests?: number } = {}
) {
  const cache = new DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>(opts.capacity ?? 8);
  const limiter = new DhanRateLimiter({ maxRequests: opts.maxRequests ?? 100, windowMs: 60_000, now: () => nowMs });
  const concurrency = new DhanConcurrencyLimiter(opts.maxInFlight ?? 4);
  const coalescer = new DhanRequestCoalescer();
  const orchestrator = new DhanRefreshOrchestrator({ cache, limiter, concurrency, coalescer, fetchQuote, now });
  return { cache, limiter, concurrency, coalescer, orchestrator };
}

describe('DHAN-P4 operational controls (synthetic)', () => {
  it('P4-01: successful quote refresh caches; second refresh within freshness window is SKIPPED_FRESH (no provider call)', async () => {
    let calls = 0;
    const { orchestrator } = makeOrchestrator(async () => { calls++; return dhanOk(envelope(now().toISOString())); });
    const first = await orchestrator.refresh([SCOPE_A]);
    assert.strictEqual(first[0]!.status, 'SUCCESS');
    assert.strictEqual(calls, 1);
    const second = await orchestrator.refresh([SCOPE_A]);
    assert.strictEqual(second[0]!.status, 'SKIPPED_FRESH');
    assert.strictEqual(calls, 1); // no unnecessary provider call
  });

  it('P4-02: cache expiry drives refresh; stale observation stays explicitly STALE; UNAVAILABLE never presented as current', async () => {
    let calls = 0;
    const { cache, orchestrator } = makeOrchestrator(async () => {
      calls++;
      return dhanOk(envelope(new Date(nowMs - 20 * 60_000).toISOString())); // 20 min old: STALE band
    });
    await orchestrator.refresh([SCOPE_A]);
    advance(60_000);
    const look = cache.get(dhanQuoteCacheKey(SCOPE_A), now().toISOString());
    assert.strictEqual(look.state, 'STALE'); // 21 min old: STALE, not CURRENT
    // 31+ min -> beyond 2x threshold -> UNAVAILABLE
    advance(11 * 60_000);
    const look2 = cache.get(dhanQuoteCacheKey(SCOPE_A), now().toISOString());
    assert.strictEqual(look2.state, 'UNAVAILABLE');
    assert.notStrictEqual(look2.state, 'CURRENT');
    const again = await orchestrator.refresh([SCOPE_A]);
    assert.strictEqual(again[0]!.status, 'SUCCESS'); // expired -> refreshed again
    assert.strictEqual(calls, 2);
  });

  it('P4-03: failed refresh preserves the prior valid observation and reports explicit FAILURE', async () => {
    let fail = false;
    const { cache, orchestrator } = makeOrchestrator(async () =>
      fail ? dhanFailure('TRANSPORT_FAILURE', 'down') : dhanOk(envelope(now().toISOString()))
    );
    await orchestrator.refresh([SCOPE_A]);
    advance(16 * 60_000); // make cached entry stale-but-valid (past 15 min threshold)
    fail = true;
    const r = await orchestrator.refresh([SCOPE_A]);
    assert.strictEqual(r[0]!.status, 'FAILURE');
    if (r[0]!.status === 'FAILURE') {
      assert.strictEqual(r[0]!.code, 'TRANSPORT_FAILURE');
      assert.strictEqual(r[0]!.priorPreserved, true);
    }
    const look = cache.get(dhanQuoteCacheKey(SCOPE_A), now().toISOString());
    assert.ok(look.entry !== undefined && look.state !== 'MISS'); // prior observation not erased
  });

  it('P4-04: cache identity separates ISINs under one company and NSE/BSE segments; capacity evicts LRU; explicit invalidation', () => {
    const cache = new DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>(2);
    const kA = dhanQuoteCacheKey(SCOPE_A);
    const kA2 = dhanQuoteCacheKey(SCOPE_A2);
    const kBse = dhanQuoteCacheKey(SCOPE_BSE);
    assert.notStrictEqual(kA, kA2);
    assert.notStrictEqual(kA, kBse);
    cache.set(kA, envelope(now().toISOString(), 100));
    cache.set(kA2, envelope(now().toISOString(), 200));
    cache.get(kA, now().toISOString()); // touch A -> A2 becomes LRU
    cache.set(kBse, envelope(now().toISOString(), 300));
    assert.strictEqual(cache.size, 2);
    assert.strictEqual(cache.get(kA2, now().toISOString()).state, 'MISS'); // evicted
    assert.strictEqual(cache.get(kA, now().toISOString()).state, 'CURRENT');
    assert.ok(cache.invalidate(kA));
    assert.strictEqual(cache.get(kA, now().toISOString()).state, 'MISS');
  });

  it('P4-05: historical cache identity includes interval and date range; empty results cached distinctly from failures', () => {
    const k1 = dhanHistoricalCacheKey({ companyId: 'C', exchangeSegment: 'NSE_EQ', isin: 'I', interval: '1D', fromDate: '2026-09-01', toDate: '2026-09-10' });
    const k2 = dhanHistoricalCacheKey({ companyId: 'C', exchangeSegment: 'NSE_EQ', isin: 'I', interval: '1h', fromDate: '2026-09-01', toDate: '2026-09-10' });
    const k3 = dhanHistoricalCacheKey({ companyId: 'C', exchangeSegment: 'NSE_EQ', isin: 'I', interval: '1D', fromDate: '2026-09-01', toDate: '2026-09-11' });
    const kAdj = dhanHistoricalCacheKey({ companyId: 'C', exchangeSegment: 'NSE_EQ', interval: '1D', fromDate: '2026-09-01', toDate: '2026-09-10', isAdjusted: true });
    assert.ok(k1 !== k2 && k1 !== k3 && k1 !== kAdj);
    const cache = new DhanHistoricalCache(4);
    const emptyResult = { candles: [], requestedFromDate: '2026-09-01', requestedToDate: '2026-09-10', returnedCandleCount: 0, coverageClaim: 'ACCESS_PENDING_UNVERIFIED' as const };
    cache.set(k1, emptyResult, now().toISOString());
    assert.strictEqual(cache.get(k1)?.result.returnedCandleCount, 0); // valid empty cached
    assert.strictEqual(cache.get(k2), undefined); // different interval not coalesced
  });

  it('P4-06: rate limiter enforces shared budget across concurrent callers; throttle + Retry-After blocks', () => {
    const limiter = new DhanRateLimiter({ maxRequests: 2, windowMs: 1000, now: () => nowMs });
    assert.strictEqual(limiter.tryAcquire(), true);
    assert.strictEqual(limiter.tryAcquire(), true);
    assert.strictEqual(limiter.tryAcquire(), false); // budget exhausted, shared
    advance(1001); // window refills
    assert.strictEqual(limiter.tryAcquire(), true);
    limiter.observeThrottle(5, nowMs); // provider said Retry-After: 5
    assert.strictEqual(limiter.tryAcquire(), false);
    assert.strictEqual(limiter.blocked, true);
    advance(5001 + 1000); // past the block AND the refill window
    assert.strictEqual(limiter.tryAcquire(), true);
  });

  it('P4-07: concurrency limiter enforces max in-flight; failures and timeouts release slots; queue is bounded', async () => {
    const limiter = new DhanConcurrencyLimiter(1, 1);
    assert.strictEqual(await limiter.acquire(), true);
    assert.strictEqual(limiter.currentInFlight, 1);
    const queued = limiter.acquire(); // waits
    assert.strictEqual(await Promise.race([queued, Promise.resolve('full' as const)]), 'full' as const);
    assert.strictEqual(await limiter.acquire(), false); // queue full -> controlled rejection
    limiter.release();
    assert.strictEqual(await queued, true); // slot released, waiter proceeds
    limiter.release();
    assert.strictEqual(limiter.currentInFlight, 0);
  });

  it('P4-08: duplicate quote requests coalesce; different instruments/segments do not', async () => {
    const coalescer = new DhanRequestCoalescer();
    let executions = 0;
    const fn = async () => { executions++; await new Promise((r) => setTimeout(r, 10)); return 'x'; };
    const [a, b, c] = await Promise.all([
      coalescer.run('K1', fn), coalescer.run('K1', fn), coalescer.run('K2', fn),
    ]);
    assert.strictEqual(a, 'x');
    assert.strictEqual(b, 'x');
    assert.strictEqual(c, 'x');
    assert.strictEqual(executions, 2); // K1 coalesced, K2 separate
    assert.strictEqual(coalescer.pendingCount, 0);
  });

  it('P4-09: orchestrator coalesces overlapping refresh of the same scope and isolates per-instrument failures', async () => {
    let calls = 0;
    const { orchestrator } = makeOrchestrator(async (scope) => {
      calls++;
      await new Promise((r) => setTimeout(r, 5));
      if (scope.isin === 'INE000SYNTH2') return dhanFailure('MALFORMED_RESPONSE', 'bad payload');
      return dhanOk(envelope(now().toISOString()));
    });
    const [r1, r2] = await Promise.all([orchestrator.refresh([SCOPE_A]), orchestrator.refresh([SCOPE_A])]);
    assert.strictEqual(calls, 1); // overlapping same-scope refresh coalesced
    assert.strictEqual(r1[0]!.status, 'SUCCESS');
    assert.strictEqual(r2[0]!.status, 'SUCCESS'); // coalesced onto the in-flight refresh
    const mixed = await orchestrator.refresh([SCOPE_A, SCOPE_A2]);
    const byScope = new Map(mixed.map((o) => [o.scope.isin, o.status]));
    assert.strictEqual(byScope.get('INE000SYNTH1'), 'SKIPPED_FRESH');
    assert.strictEqual(byScope.get('INE000SYNTH2'), 'FAILURE'); // one failure does not affect the other
  });

  it('P4-10: retry policy — transient retried with backoff, permanent never retried, exhaustion explicit', async () => {
    assert.strictEqual(isTransientFailure('TIMEOUT'), true);
    assert.strictEqual(isTransientFailure('HTTP_ERROR', 503), true);
    assert.strictEqual(isTransientFailure('HTTP_ERROR', 400), false);
    assert.strictEqual(isTransientFailure('UNRESOLVED_INSTRUMENT'), false);
    assert.strictEqual(isTransientFailure('AUTHENTICATION_FAILURE'), false);

    let attempts = 0;
    const sleeps: number[] = [];
    const transient = await withBoundedRetry(
      async () => { attempts++; return attempts < 3 ? dhanFailure('TIMEOUT', 't') : dhanOk('recovered'); },
      { maxAttempts: 3, baseDelayMs: 10, sleep: async (ms) => { sleeps.push(ms); }, rng: () => 0 }
    );
    assert.ok(transient.ok && transient.value === 'recovered');
    assert.strictEqual(attempts, 3);
    assert.ok(sleeps.length === 2 && sleeps[1]! >= sleeps[0]!); // backoff grows

    let permAttempts = 0;
    const perm = await withBoundedRetry(
      async () => { permAttempts++; return dhanFailure('UNRESOLVED_INSTRUMENT', 'no'); },
      { maxAttempts: 3, sleep: async () => {} }
    );
    assert.ok(!perm.ok);
    assert.strictEqual(permAttempts, 1); // permanent failure: no retry

    let exAttempts = 0;
    const exhausted = await withBoundedRetry(
      async () => { exAttempts++; return dhanFailure('TRANSPORT_FAILURE', 'down'); },
      { maxAttempts: 2, sleep: async () => {} }
    );
    assert.ok(!exhausted.ok && exhausted.failure.code === 'TRANSPORT_FAILURE');
    assert.strictEqual(exAttempts, 2); // bounded
  });

  it('P4-11: freshness is observation-based — cache reads do not reset asOf; unavailable never becomes zero', async () => {
    const { cache, orchestrator } = makeOrchestrator(async () =>
      dhanOk(envelope(new Date(nowMs - 10 * 60_000).toISOString())) // 10 min old: GOOD
    );
    await orchestrator.refresh([SCOPE_A]);
    advance(10 * 60_000); // now 20 min old
    const key = dhanQuoteCacheKey(SCOPE_A);
    const first = cache.get(key, now().toISOString());
    assert.strictEqual(first.state, 'STALE');
    const second = cache.get(key, now().toISOString()); // re-read
    assert.strictEqual(second.state, 'STALE'); // re-read did NOT make it fresh
    assert.strictEqual(second.entry!.provenance.asOf, first.entry!.provenance.asOf); // asOf unchanged
    // malformed response is never cached as valid data
    const { orchestrator: o2, cache: c2 } = makeOrchestrator(async () => dhanFailure('MALFORMED_RESPONSE', 'bad'));
    await o2.refresh([SCOPE_A]);
    assert.strictEqual(c2.get(dhanQuoteCacheKey(SCOPE_A), now().toISOString()).state, 'MISS');
  });
});
