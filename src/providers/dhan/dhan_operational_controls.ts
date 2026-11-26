import { parseTradingCalendar, type TradingCalendar, type EquityExchange } from '../../quality/trading_calendar.js';
/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Provider-Side Operational Controls (DHAN-P4)
 *
 * Gate: DHAN-P4 PROVIDER OPERATIONAL CONTROLS — PRE-ACCESS / SYNTHETIC / OFFLINE.
 *
 * Scope: refresh orchestration, bounded quote/historical caches, rate limiting,
 * concurrency control and duplicate-request coalescing — all INSIDE the Dhan
 * provider boundary, all provider-neutral at the outward contract (canonical
 * envelopes only; no Dhan identifiers or credentials leave this module).
 *
 * No background timers: refresh is explicit and caller-driven; start/stop are
 * deterministic. Rate-limit defaults are conservative OPERATIONAL SAFEGUARDS,
 * not vendor-certified Dhan limits (live qualification pending).
 */

import { CanonicalEnvelope } from '../../contracts/envelope.js';
import { MarketQuotePayload } from '../../contracts/d01_quotes.js';
import { evaluateFreshness } from '../../quality/freshness_evaluator.js';
import { DhanResult, DhanFailureCode } from './dhan_failures.js';
import { DhanHistoricalNormalizationResult } from './dhan_historical_adapter.js';
import type { DhanHistoricalProvenance } from './dhan_historical_provenance.js';
import { DhanExchangeSegment } from './dhan_dto.js';

// ── Cache identity (security level, never company level) ─────────────────────

export interface DhanSecurityScope {
  companyId: string;
  exchangeSegment: DhanExchangeSegment;
  isin?: string;
  /** Exact P04 exchange series from the canonical D114 identity; part of the cache key. */
  series?: string;
}

export function dhanQuoteCacheKey(scope: DhanSecurityScope): string {
  return `${scope.companyId.trim().toUpperCase()}|${scope.exchangeSegment}|${(scope.isin ?? '').trim().toUpperCase()}|${(scope.series ?? '').trim().toUpperCase()}`;
}

export function dhanHistoricalCacheKey(req: {
  companyId: string;
  exchangeSegment: DhanExchangeSegment;
  isin?: string;
  interval: string;
  fromDate: string;
  toDate: string;
  isAdjusted?: boolean;
}): string {
  // Full request identity: security + segment + interval + range + adjustment.
  return [req.companyId.trim().toUpperCase(), req.exchangeSegment, (req.isin ?? '').trim().toUpperCase(),
    req.interval, req.fromDate, req.toDate, req.isAdjusted ? 'ADJ' : 'UNADJ'].join('|');
}

// ── Bounded LRU cache ────────────────────────────────────────────────────────

export type CacheLookupState = 'CURRENT' | 'STALE' | 'UNAVAILABLE' | 'MISS';

export type DhanAggregateCacheState =
  | 'EMPTY'
  | 'CURRENT'
  | 'STALE'
  | 'UNAVAILABLE'
  | 'MIXED';

export interface DhanQuoteCacheDiagnostics {
  readonly size: number;
  readonly capacity: number;
  readonly state: DhanAggregateCacheState;
  readonly currentEntries: number;
  readonly staleEntries: number;
  readonly unavailableEntries: number;
}

export interface CacheLookup<T> {
  state: CacheLookupState;
  entry?: T;
}

/**
 * Bounded LRU cache. Freshness is ALWAYS derived from the observation `asOf`
 * (provenance), never from cache insertion time: re-reading old data does not
 * make it fresh. Expired-beyond-concession data is UNAVAILABLE, never CURRENT.
 */
export class DhanBoundedCache<T extends { provenance: { asOf: string } }> {
  private readonly map = new Map<string, T>();
  private tradingCalendar?: TradingCalendar;
  /** Session policy is shared with normalization/status; existing entries are re-evaluated. */
  public setTradingCalendar(calendar?: TradingCalendar): void {
    this.tradingCalendar = calendar ? parseTradingCalendar(calendar) : undefined;
  }
  constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) throw new Error('cache capacity must be a positive integer');
  }

  public get(key: string, nowIso: string): CacheLookup<T> {
    const entry = this.map.get(key);
    if (!entry) return { state: 'MISS' };
    // LRU touch
    this.map.delete(key);
    this.map.set(key, entry);
    return this.classify(entry, nowIso);
  }

  /** Inspect without touching LRU order or otherwise changing the cache. */
  public peek(key: string, nowIso: string): CacheLookup<T> {
    const entry = this.map.get(key);
    if (!entry) return { state: 'MISS' };
    // Malformed runtime evidence must never be exposed as CURRENT by status reads.
    if (typeof entry.provenance?.asOf !== 'string') return { state: 'UNAVAILABLE', entry };
    return this.classify(entry, nowIso);
  }

  public classify(entry: T, nowIso: string): CacheLookup<T> {
    const freshness = evaluateFreshness(entry.provenance?.asOf, 'D01_QUOTES', nowIso, this.tradingCalendar ? { kind: 'QUOTE', calendar: this.tradingCalendar, exchange: (entry as T & { payload?: { exchange?: EquityExchange } }).payload?.exchange as EquityExchange } : undefined);
    if (freshness.suppressExecution) return { state: 'UNAVAILABLE', entry };
    return { state: freshness.quality === 'GOOD' ? 'CURRENT' : 'STALE', entry };
  }

  /** Only successful, validated observations are cached — never fabricated values. */
  public set(key: string, entry: T): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, entry);
    while (this.map.size > this.capacity) {
      const oldest = this.map.keys().next();
      if (oldest.done) break;
      this.map.delete(oldest.value);
    }
  }

  public invalidate(key: string): boolean {
    return this.map.delete(key);
  }

  public clear(): void {
    this.map.clear();
  }

  /**
   * W-23: the current entries in LRU order (least-recently-used first), without touching
   * that order and without exposing it for mutation.
   *
   * A snapshot is evidence, not a live view: the caller persists it and the entries keep
   * their original provenance instants. Nothing here re-stamps or re-classifies.
   */
  public snapshotInLruOrder(): ReadonlyArray<{ readonly key: string; readonly entry: T }> {
    return Array.from(this.map.entries(), ([key, entry]) => ({ key, entry }));
  }

  /**
   * W-23: admits ONE restored entry, in ascending LRU order.
   *
   * Deliberately not `set`: `set` evicts from the tail when over capacity and touches no
   * freshness, which is right for a live observation and wrong for a restore. This method
   * is the restore path's only entry point, and it refuses to admit an entry whose
   * classification under the CURRENT clock and thresholds is UNAVAILABLE.
   *
   * That refusal is the freshness-consistency guarantee: an entry that has aged past
   * suppression during the outage is not resurrected, so the cache never reports a size
   * that includes evidence no caller is allowed to use. The caller counts the refusals.
   *
   * `classification` is supplied by the caller because the cache has no clock of its own —
   * `nowIso` is always passed in elsewhere in this class for the same reason.
   */
  public restoreEntry(key: string, entry: T, classification: 'CURRENT' | 'STALE' | 'UNAVAILABLE'): boolean {
    if (classification === 'UNAVAILABLE') return false;
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, entry);
    return true;
  }

  /** W-23: true when the cache holds no entries — used to assert a genuinely cold start. */
  public get isEmpty(): boolean {
    return this.map.size === 0;
  }

  public get size(): number {
    return this.map.size;
  }

  public get maxEntries(): number {
    return this.capacity;
  }

  /**
   * Pure observation-only summary of cached entry counts and aggregate freshness
   * state at `nowIso`. Never touches LRU order, never invokes the provider, and
   * never exposes cache keys, identities, or cached payloads (W-09 / D-7 §4).
   */
  public inspectStateSummary(nowIso: string): DhanQuoteCacheDiagnostics {
    const size = this.map.size;
    if (size === 0) {
      return Object.freeze({
        size: 0,
        capacity: this.capacity,
        state: 'EMPTY',
        currentEntries: 0,
        staleEntries: 0,
        unavailableEntries: 0,
      });
    }

    let currentEntries = 0;
    let staleEntries = 0;
    let unavailableEntries = 0;
    for (const entry of this.map.values()) {
      const classified =
        typeof entry?.provenance?.asOf === 'string'
          ? this.classify(entry, nowIso).state
          : 'UNAVAILABLE';
      if (classified === 'CURRENT') {
        currentEntries += 1;
      } else if (classified === 'STALE') {
        staleEntries += 1;
      } else {
        unavailableEntries += 1;
      }
    }

    let state: DhanAggregateCacheState;
    if (currentEntries === size) {
      state = 'CURRENT';
    } else if (staleEntries === size) {
      state = 'STALE';
    } else if (unavailableEntries === size) {
      state = 'UNAVAILABLE';
    } else {
      state = 'MIXED';
    }

    return Object.freeze({
      size,
      capacity: this.capacity,
      state,
      currentEntries,
      staleEntries,
      unavailableEntries,
    });
  }
}

// ── Rate limiter (shared token bucket; conservative defaults, NOT vendor limits) ─

export interface DhanRateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  /** Earliest time (epoch ms) at which requests are blocked due to a throttle. */
  now?: () => number;
}

export class DhanRateLimiter {
  private tokens: number;
  private windowStart: number;
  private blockedUntil = 0;
  constructor(private readonly options: DhanRateLimiterOptions) {
    this.tokens = options.maxRequests;
    this.windowStart = options.now?.() ?? Date.now();
  }

  /** Shared budget: concurrent callers draw from the same bucket. */
  public tryAcquire(nowMs?: number): boolean {
    const now = nowMs ?? (this.options.now?.() ?? Date.now());
    if (now < this.blockedUntil) return false;
    if (now - this.windowStart >= this.options.windowMs) {
      this.windowStart = now;
      this.tokens = this.options.maxRequests;
    }
    if (this.tokens <= 0) return false;
    this.tokens -= 1;
    return true;
  }

  /** Observe a provider throttle; respects Retry-After when safely interpretable. */
  public observeThrottle(retryAfterSeconds: number | undefined, nowMs?: number): void {
    const now = nowMs ?? (this.options.now?.() ?? Date.now());
    const seconds = typeof retryAfterSeconds === 'number' && Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0
      ? retryAfterSeconds
      : 0;
    this.blockedUntil = Math.max(this.blockedUntil, now + seconds * 1000);
    this.tokens = 0; // burst protection: a throttled window refills only after the block
    this.windowStart = this.blockedUntil;
  }

  public get blocked(): boolean {
    const now = this.options.now?.() ?? Date.now();
    return now < this.blockedUntil;
  }
}

// ── Concurrency limiter (bounded queue; failed/timeout paths always release) ──

export class DhanConcurrencyLimiter {
  private inFlight = 0;
  private readonly waiters: Array<() => void> = [];
  constructor(private readonly maxInFlight: number, private readonly maxQueue = 1024) {
    if (!Number.isInteger(maxInFlight) || maxInFlight <= 0) throw new Error('maxInFlight must be a positive integer');
  }

  public async acquire(): Promise<boolean> {
    if (this.inFlight < this.maxInFlight) {
      this.inFlight++;
      return true;
    }
    if (this.waiters.length >= this.maxQueue) return false; // controlled rejection, no unbounded queue
    return new Promise<boolean>((resolvePromise) => {
      this.waiters.push(() => {
        this.inFlight++;
        resolvePromise(true);
      });
    });
  }

  public release(): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
    const next = this.waiters.shift();
    if (next) next();
  }

  public get currentInFlight(): number {
    return this.inFlight;
  }
}

// ── Duplicate-request coalescing ─────────────────────────────────────────────

/**
 * Coalesces concurrent identical requests into one shared execution.
 * Different keys never share. A caller cannot cancel the shared request
 * for others: the shared promise always runs to completion.
 */
export class DhanRequestCoalescer {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  public run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) return existing as Promise<T>;
    const promise = fn().finally(() => {
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, promise);
    return promise;
  }

  public get pendingCount(): number {
    return this.inFlight.size;
  }
}

// ── Retry policy (bounded; permanent failures never retried) ─────────────────

const TRANSIENT_CODES: ReadonlySet<DhanFailureCode> = new Set([
  'RATE_LIMITED', 'TIMEOUT', 'TRANSPORT_FAILURE', 'HTTP_ERROR',
]);

export function isTransientFailure(code: DhanFailureCode, httpStatus?: number): boolean {
  if (!TRANSIENT_CODES.has(code)) return false;
  if (code === 'HTTP_ERROR') return httpStatus !== undefined && httpStatus >= 500;
  return true;
}

export interface RetryOptions {
  maxAttempts?: number; // total attempts, default 3
  baseDelayMs?: number; // default 100
  sleep?: (ms: number) => Promise<void>;
  rng?: () => number; // jitter source, default Math.random
}

export async function withBoundedRetry<T>(
  fn: () => Promise<DhanResult<T>>,
  options: RetryOptions = {}
): Promise<DhanResult<T>> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 100;
  const sleep = options.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const rng = options.rng ?? Math.random;

  let attempt = 0;
  let result = await fn();
  while (!result.ok && attempt < maxAttempts - 1 && isTransientFailure(result.failure.code, result.failure.httpStatus)) {
    attempt++;
    const backoff = baseDelayMs * 2 ** (attempt - 1);
    const jitter = rng() * backoff * 0.5;
    await sleep(backoff + jitter);
    result = await fn();
  }
  return result;
}

// ── Refresh orchestration ────────────────────────────────────────────────────

export type RefreshOutcome =
  | { status: 'SUCCESS'; scope: DhanSecurityScope; cacheState: 'CURRENT' | 'STALE' }
  | { status: 'SKIPPED_FRESH'; scope: DhanSecurityScope; cacheState: 'CURRENT' }
  | {
      status: 'FAILURE';
      scope: DhanSecurityScope;
      code: DhanFailureCode;
      priorPreserved: boolean;
      message?: string;
      httpStatus?: number;
    };

export interface DhanRefreshOrchestratorOptions {
  cache: DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>;
  limiter: DhanRateLimiter;
  concurrency: DhanConcurrencyLimiter;
  coalescer: DhanRequestCoalescer;
  /** Provider fetch, already instrument-resolved; returns canonical envelope or deterministic failure. */
  fetchQuote: (scope: DhanSecurityScope) => Promise<DhanResult<CanonicalEnvelope<MarketQuotePayload>>>;
  now?: () => Date;
}

/**
 * Explicit, caller-driven refresh (no background timers). Per instrument:
 * fresh cache → SKIPPED_FRESH (no provider call); otherwise a coalesced,
 * rate-limited, concurrency-bounded fetch. Success → cache updated; failure →
 * explicit FAILURE outcome and any prior valid observation is PRESERVED.
 * One instrument's failure never affects another's outcome.
 */
export class DhanRefreshOrchestrator {
  private readonly cache: DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>;
  private readonly limiter: DhanRateLimiter;
  private readonly concurrency: DhanConcurrencyLimiter;
  private readonly coalescer: DhanRequestCoalescer;
  private readonly fetchQuote: DhanRefreshOrchestratorOptions['fetchQuote'];
  private readonly now: () => Date;
  private stopped = false;

  constructor(options: DhanRefreshOrchestratorOptions) {
    this.cache = options.cache;
    this.limiter = options.limiter;
    this.concurrency = options.concurrency;
    this.coalescer = options.coalescer;
    this.fetchQuote = options.fetchQuote;
    this.now = options.now ?? (() => new Date());
  }

  public async refresh(scopes: readonly DhanSecurityScope[]): Promise<RefreshOutcome[]> {
    if (this.stopped) throw new Error('DhanRefreshOrchestrator: stopped');
    const nowIso = this.now().toISOString();
    const outcomes: RefreshOutcome[] = [];

    // Per-instrument results are independent; overlap for the same scope is
    // prevented by the coalescer key.
    await Promise.all(
      scopes.map(async (scope) => {
        const key = dhanQuoteCacheKey(scope);
        const cached = this.cache.get(key, nowIso);
        if (cached.state === 'CURRENT') {
          outcomes.push({ status: 'SKIPPED_FRESH', scope, cacheState: 'CURRENT' });
          return;
        }
        const outcome = await this.coalescer.run(key, async () => {
          if (!this.limiter.tryAcquire()) {
            return { status: 'FAILURE', scope, code: 'RATE_LIMITED' as DhanFailureCode, priorPreserved: cached.state !== 'MISS' } as RefreshOutcome;
          }
          const acquired = await this.concurrency.acquire();
          if (!acquired) {
            return { status: 'FAILURE', scope, code: 'TRANSPORT_FAILURE' as DhanFailureCode, priorPreserved: cached.state !== 'MISS' } as RefreshOutcome;
          }
          try {
            const result = await withBoundedRetry(() => this.fetchQuote(scope));
            if (result.ok) {
              const classified = this.cache.classify(result.value, nowIso);
              if (classified.state === 'UNAVAILABLE') return { status: 'FAILURE', scope, code: 'STALE_DATA_SUPPRESSED', priorPreserved: cached.state !== 'MISS' } as RefreshOutcome;
              this.cache.set(key, result.value);
              return {
                status: 'SUCCESS',
                scope,
                cacheState: classified.state === 'CURRENT' ? 'CURRENT' : 'STALE',
              } as RefreshOutcome;
            }
            return {
              status: 'FAILURE',
              scope,
              code: result.failure.code,
              priorPreserved: cached.state !== 'MISS',
              message: result.failure.message,
              ...(result.failure.httpStatus !== undefined ? { httpStatus: result.failure.httpStatus } : {}),
            } as RefreshOutcome;
          } finally {
            this.concurrency.release(); // timeout/cancellation/failure all release the slot
          }
        });
        outcomes.push(outcome);
      })
    );
    return outcomes;
  }

  /** Deterministic shutdown: no new refreshes; in-flight work is not interrupted. */
  public stop(): void {
    this.stopped = true;
    this.cache.clear();
  }
}

// ── Historical cache ─────────────────────────────────────────────────────────
// Justified here because historical observations are immutable and requests are
// idempotent: keyed by the COMPLETE request identity (security + segment + ISIN
// + interval + date range + adjustment), so adjusted/unadjusted and different
// ranges never mix. Valid EMPTY results are cached explicitly and kept distinct
// from failures (failures are never cached). Bounded with LRU eviction.
// This does NOT imply complete historical coverage — coverage stays
// ACCESS_PENDING_UNVERIFIED until live qualification.

export interface DhanHistoricalCacheEntry {
  result: DhanHistoricalNormalizationResult;
  cachedAt: string;
  /** W-19: provenance of the observation that produced this entry (source, instants, revision). */
  provenance?: DhanHistoricalProvenance;
}

/**
 * Bounded LRU cache for immutable historical observations.
 *
 * W-19 adds `peek`, so a read-only freshness projection can inspect an entry
 * WITHOUT mutating LRU order — the same non-mutating guarantee the quote cache
 * already provides through `peek`. `get` keeps its existing LRU-touching contract.
 */
export class DhanHistoricalCache {
  private readonly map = new Map<string, DhanHistoricalCacheEntry>();
  constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) throw new Error('cache capacity must be a positive integer');
  }

  public get(key: string): DhanHistoricalCacheEntry | undefined {
    const entry = this.map.get(key);
    if (entry) {
      this.map.delete(key);
      this.map.set(key, entry); // LRU touch
    }
    return entry;
  }

  /** Inspect without touching LRU order. Never mutates the cache. */
  public peek(key: string): DhanHistoricalCacheEntry | undefined {
    return this.map.get(key);
  }

  public set(key: string, result: DhanHistoricalNormalizationResult, cachedAt: string, provenance?: DhanHistoricalProvenance): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { result, cachedAt, ...(provenance ? { provenance } : {}) });
    while (this.map.size > this.capacity) {
      const oldest = this.map.keys().next();
      if (oldest.done) break;
      this.map.delete(oldest.value);
    }
  }

  public invalidate(key: string): boolean {
    return this.map.delete(key);
  }

  /**
   * The most recently STORED observation, without touching LRU order. Map insertion
   * order makes the final key the newest write, so this is evidence, not a guess.
   * Used only as a fallback when the last-requested identity is no longer retained.
   */
  public mostRecent(): DhanHistoricalCacheEntry | undefined {
    let newest: DhanHistoricalCacheEntry | undefined;
    for (const entry of this.map.values()) newest = entry;
    return newest;
  }

  public get size(): number {
    return this.map.size;
  }

  public get maxEntries(): number {
    return this.capacity;
  }
}
