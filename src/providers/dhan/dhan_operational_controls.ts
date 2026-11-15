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

  private classify(entry: T, nowIso: string): CacheLookup<T> {
    const freshness = evaluateFreshness(entry.provenance?.asOf, 'D01_QUOTES', nowIso);
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

  public get size(): number {
    return this.map.size;
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

// Cancellation is local control flow, never a provider response.
function cancelled(): Error { return Object.assign(new Error('quote request cancelled; provider receipt may be unknown'), { name: 'AbortError' }); }
function checkCancelled(signal?: AbortSignal): void { if (signal?.aborted) throw cancelled(); }
function abortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(cancelled());
  return new Promise<T>((resolve, reject) => {
    const abort = () => { cleanup(); reject(cancelled()); };
    const cleanup = () => signal.removeEventListener('abort', abort);
    signal.addEventListener('abort', abort, { once: true });
    promise.then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
  });
}
function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (!signal) return new Promise(resolve => setTimeout(resolve, ms));
  if (signal.aborted) return Promise.reject(cancelled());
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    const abort = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); reject(cancelled()); };
    signal.addEventListener('abort', abort, { once: true });
  });
}

// ── Concurrency limiter (bounded queue; failed/timeout paths always release) ──

export class DhanConcurrencyLimiter {
  private inFlight = 0;
  private readonly waiters: Array<() => void> = [];
  constructor(private readonly maxInFlight: number, private readonly maxQueue = 1024) {
    if (!Number.isInteger(maxInFlight) || maxInFlight <= 0) throw new Error('maxInFlight must be a positive integer');
  }

  public async acquire(signal?: AbortSignal): Promise<boolean> {
    checkCancelled(signal);
    if (this.inFlight < this.maxInFlight) {
      this.inFlight++;
      return true;
    }
    if (this.waiters.length >= this.maxQueue) return false; // controlled rejection, no unbounded queue
    return new Promise<boolean>((resolvePromise) => {
      const abort = () => {
        const index = this.waiters.indexOf(wake);
        if (index >= 0) this.waiters.splice(index, 1);
        resolvePromise(false);
      };
      const wake = () => {
        signal?.removeEventListener('abort', abort);
        this.inFlight++;
        resolvePromise(true);
      };
      this.waiters.push(wake);
      signal?.addEventListener('abort', abort, { once: true });
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
 * Different keys never share. A caller cannot cancel work still needed by
 * others; the shared operation is aborted when its last caller leaves.
 */
export class DhanRequestCoalescer {
  private readonly inFlight = new Map<string, { promise: Promise<unknown>; controller: AbortController; users: number }>();

  public run<T>(key: string, fn: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) return Promise.reject(cancelled());
    let entry = this.inFlight.get(key);
    if (!entry) {
      const controller = new AbortController();
      const created = { controller, users: 0, promise: undefined as unknown as Promise<T> };
      created.promise = Promise.resolve().then(() => fn(controller.signal)).finally(() => {
        if (this.inFlight.get(key) === created) this.inFlight.delete(key);
      });
      entry = created;
      this.inFlight.set(key, entry);
    }
    entry.users++;
    const current = entry;
    return abortable(current.promise as Promise<T>, signal).finally(() => {
      current.users--;
      if (current.users === 0 && this.inFlight.get(key) === current) {
        this.inFlight.delete(key);
        current.controller.abort();
      }
    });
  }

  public get pendingCount(): number { return this.inFlight.size; }
}

// ── Retry policy (bounded; permanent failures never retried) ─────────────────

const TRANSIENT_CODES: ReadonlySet<DhanFailureCode> = new Set([
  'RATE_LIMITED', 'TIMEOUT', 'TRANSPORT_FAILURE', 'HTTP_ERROR',
]);

export function isTransientFailure(code: DhanFailureCode, httpStatus?: number): boolean {
  if (!TRANSIENT_CODES.has(code)) return false;
  if (code === 'HTTP_ERROR') return httpStatus !== undefined && [500, 502, 503, 504].includes(httpStatus);
  return true;
}

export interface RetryOptions {
  maxAttempts?: number; // total attempts, default 3
  baseDelayMs?: number; // default 100
  sleep?: (ms: number) => Promise<void>;
  rng?: () => number; // jitter source, default Math.random
  beforeAttempt?: () => Promise<void>;
  onAttempt?: (event: RetryAttemptEvent) => void;
  maxRetryDelayMs?: number;
  signal?: AbortSignal;
}

/** Safe categories only; no provider body, headers, identity or credentials. */
export interface RetryAttemptEvent {
  attempt: number;
  durationMs: number;
  outcome: 'SUCCESS' | 'FAILURE' | 'CANCELLED';
  code?: DhanFailureCode;
  httpStatus?: number;
  retryDelayMs?: number;
  final: boolean;
}

export async function withBoundedRetry<T>(
  fn: () => Promise<DhanResult<T>>,
  options: RetryOptions = {}
): Promise<DhanResult<T>> {
  const maxAttempts = options.maxAttempts ?? 3;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) throw new RangeError('maxAttempts must be between 1 and 10');
  const baseDelayMs = options.baseDelayMs ?? 100;
  const sleep = options.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const rng = options.rng ?? Math.random;
  for (let attempt = 1; ; attempt++) {
    checkCancelled(options.signal);
    await options.beforeAttempt?.();
    checkCancelled(options.signal);
    const start = Date.now();
    let result: DhanResult<T>;
    try { result = await fn(); }
    catch (error) {
      if (options.signal?.aborted) options.onAttempt?.({ attempt, durationMs: Math.max(0, Date.now() - start), outcome: 'CANCELLED', code: 'TIMEOUT', final: true });
      throw error;
    }
    const durationMs = Math.max(0, Date.now() - start);
    if (options.signal?.aborted) {
      options.onAttempt?.({ attempt, durationMs, outcome: 'CANCELLED', code: 'TIMEOUT', final: true });
      throw cancelled();
    }
    let delay: number | undefined;
    if (!result.ok && attempt < maxAttempts && isTransientFailure(result.failure.code, result.failure.httpStatus)) {
      const backoff = baseDelayMs * 2 ** (attempt - 1);
      const jitter = Math.max(0, Math.min(1, rng())) * backoff * 0.5;
      delay = Math.max(backoff + jitter, result.failure.retryAfterMs ?? 0);
      // Never shorten a server-requested delay. Return the original failure if
      // it exceeds the bounded operation budget.
      if (!Number.isFinite(delay) || delay > (options.maxRetryDelayMs ?? 30000)) delay = undefined;
    }
    options.onAttempt?.({ attempt, durationMs, outcome: result.ok ? 'SUCCESS' : 'FAILURE', ...(!result.ok ? { code: result.failure.code, ...(result.failure.httpStatus !== undefined ? { httpStatus: result.failure.httpStatus } : {}) } : {}), ...(delay !== undefined ? { retryDelayMs: delay } : {}), final: delay === undefined });
    if (delay === undefined) {
      if (!result.ok && attempt >= maxAttempts && isTransientFailure(result.failure.code, result.failure.httpStatus) && maxAttempts > 1) {
        return { ok: false, failure: { ...result.failure, message: `quote retry attempts exhausted after ${attempt} attempts` } };
      }
      return result;
    }
    try {
      if (options.sleep) await abortable(sleep(delay), options.signal);
      else await wait(delay, options.signal);
    } catch (error) {
      if (options.signal?.aborted) options.onAttempt?.({ attempt, durationMs, outcome: 'CANCELLED', code: 'TIMEOUT', final: true });
      throw error;
    }
  }
}

// ── Refresh orchestration ────────────────────────────────────────────────────

export type RefreshOutcome =
  | { status: 'SUCCESS'; scope: DhanSecurityScope; cacheState: 'CURRENT' | 'STALE' | 'UNAVAILABLE' }
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
  fetchQuote: (scope: DhanSecurityScope, signal?: AbortSignal) => Promise<DhanResult<CanonicalEnvelope<MarketQuotePayload>>>;
  now?: () => Date;
  /** Quote attempt limits and optional test seams. */
  retry?: RetryOptions;
}

/**
 * Explicit, caller-driven refresh (no background timers). Per instrument:
 * fresh cache → SKIPPED_FRESH unless forceProvider is requested; otherwise a
 * coalesced, rate-limited, concurrency-bounded fetch with bounded retries.
 * Success updates cache; failure preserves the prior observation.
 * One instrument's failure never affects another's outcome.
 */
export class DhanRefreshOrchestrator {
  private readonly cache: DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>;
  private readonly limiter: DhanRateLimiter;
  private readonly concurrency: DhanConcurrencyLimiter;
  private readonly coalescer: DhanRequestCoalescer;
  private readonly fetchQuote: DhanRefreshOrchestratorOptions['fetchQuote'];
  private readonly now: () => Date;
  private readonly retry: RetryOptions;
  private pacing: Promise<void> = Promise.resolve();
  private nextAttemptAt = 0;
  private readonly attempts: RetryAttemptEvent[] = [];
  private stopped = false;

  constructor(options: DhanRefreshOrchestratorOptions) {
    this.cache = options.cache;
    this.limiter = options.limiter;
    this.concurrency = options.concurrency;
    this.coalescer = options.coalescer;
    this.fetchQuote = options.fetchQuote;
    this.now = options.now ?? (() => new Date());
    this.retry = options.retry ?? {};
    const max = this.retry.maxAttempts ?? 3;
    if (!Number.isInteger(max) || max < 1 || max > 10) throw new RangeError('maxAttempts must be between 1 and 10');
  }

  /** Sanitized bounded diagnostics, oldest first. */
  public getAttemptDiagnostics(): readonly RetryAttemptEvent[] { return this.attempts.map(event => ({ ...event })); }

  private async pacedFetch<T>(fetch: () => Promise<DhanResult<T>>, signal?: AbortSignal): Promise<DhanResult<T>> {
    const previous = this.pacing;
    let release!: () => void;
    this.pacing = new Promise<void>(resolve => { release = resolve; });
    // Keep the queue chained even if a waiting request is cancelled.
    try { await abortable(previous, signal); } catch (err) { void previous.finally(release); throw err; }
    try {
      checkCancelled(signal);
      const delay = Math.max(0, this.nextAttemptAt - Date.now());
      if (delay > 30000) return { ok: false, failure: { code: 'RATE_LIMITED', message: 'provider retry delay exceeds the local wait budget' } };
      if (delay) await wait(delay, signal);
      if (!this.limiter.tryAcquire()) return { ok: false, failure: { code: 'RATE_LIMITED', message: 'provider request budget exhausted' } };
      let result: DhanResult<T>;
      try { result = await fetch(); }
      finally { this.nextAttemptAt = Date.now() + 1000; }
      if (!result.ok && result.failure.retryAfterMs !== undefined) {
        this.nextAttemptAt = Math.max(this.nextAttemptAt, Date.now() + result.failure.retryAfterMs);
      }
      return result;
    } finally { release(); }
  }

  /** Batch and single quotes share the same pacing, budget and retry policy. */
  public async executeBatch<T>(key: string, fetch: (signal: AbortSignal) => Promise<DhanResult<T>>, signal?: AbortSignal): Promise<DhanResult<T>> {
    if (this.stopped) throw new Error('DhanRefreshOrchestrator: stopped');
    return this.coalescer.run(`batch:${key}`, async sharedSignal => {
      const acquired = await this.concurrency.acquire(sharedSignal);
      if (!acquired) {
        checkCancelled(sharedSignal);
        return { ok: false, failure: { code: 'TRANSPORT_FAILURE', message: 'provider queue is full' } };
      }
      try {
        return await withBoundedRetry(() => this.pacedFetch(() => fetch(sharedSignal), sharedSignal), {
          ...this.retry, signal: sharedSignal,
          onAttempt: event => {
            this.attempts.push(event);
            if (this.attempts.length > 256) this.attempts.shift();
            this.retry.onAttempt?.(event);
          },
        });
      } finally { this.concurrency.release(); }
    }, signal);
  }

  public async refresh(scopes: readonly DhanSecurityScope[], options: { forceProvider?: boolean; signal?: AbortSignal } = {}): Promise<RefreshOutcome[]> {
    if (this.stopped) throw new Error('DhanRefreshOrchestrator: stopped');
    const nowIso = this.now().toISOString();
    const outcomes: RefreshOutcome[] = [];

    // Per-instrument results are independent; overlap for the same scope is
    // prevented by the coalescer key.
    await Promise.all(
      scopes.map(async (scope) => {
        const key = dhanQuoteCacheKey(scope);
        const cached = this.cache.get(key, nowIso);
        if (cached.state === 'CURRENT' && !options.forceProvider) {
          outcomes.push({ status: 'SKIPPED_FRESH', scope, cacheState: 'CURRENT' });
          return;
        }
        const outcome = await this.coalescer.run(key, async sharedSignal => {
          const acquired = await this.concurrency.acquire(sharedSignal);
          if (!acquired) {
            checkCancelled(sharedSignal);
            return { status: 'FAILURE', scope, code: 'TRANSPORT_FAILURE' as DhanFailureCode, priorPreserved: cached.state !== 'MISS' } as RefreshOutcome;
          }
          try {
            checkCancelled(sharedSignal);
            const result = await withBoundedRetry(() => this.pacedFetch(() => this.fetchQuote(scope, sharedSignal), sharedSignal), {
              ...this.retry,
              signal: sharedSignal,
              onAttempt: event => {
                this.attempts.push(event);
                if (this.attempts.length > 256) this.attempts.shift();
                this.retry.onAttempt?.(event);
              },
            });
            if (result.ok) {
              this.cache.set(key, result.value);
              const freshness = evaluateFreshness(result.value.provenance.asOf, 'D01_QUOTES', nowIso);
              return {
                status: 'SUCCESS',
                scope,
                cacheState: freshness.quality === 'GOOD' ? 'CURRENT' : freshness.quality === 'STALE' ? 'STALE' : 'UNAVAILABLE',
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
        }, options.signal);
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
}

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

  public set(key: string, result: DhanHistoricalNormalizationResult, cachedAt: string): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { result, cachedAt });
    while (this.map.size > this.capacity) {
      const oldest = this.map.keys().next();
      if (oldest.done) break;
      this.map.delete(oldest.value);
    }
  }

  public invalidate(key: string): boolean {
    return this.map.delete(key);
  }

  public get size(): number {
    return this.map.size;
  }
}
