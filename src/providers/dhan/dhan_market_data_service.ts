/**
 * Institutional Investment Platform System (IIPS)
 * IPD-Owned Composed Dhan Market-Data Service (DHAN-P5)
 *
 * Gate: DHAN-P5 COMPOSED SERVICE — composes the EXISTING Dhan provider
 * primitives (client, quote source, historical adapter, governed mapping,
 * Prompt 4 operational controls) into one IPD-owned service. It introduces no
 * duplicate DTOs, normalizers, caches, limiters or registries, and exposes
 * ONLY canonical provider-neutral contracts outward (D01/D02 envelopes).
 *
 * PRE-ACCESS: no live Dhan call is possible; all behaviour is synthetic-safe.
 */

import { freshnessStatus, type FreshnessStatus, type RefreshStatus } from './dhan_freshness_status.js';
import { CanonicalEnvelope } from '../../contracts/envelope.js';
import { isD114SecurityIdentity, type D114SecurityIdentity } from '../../contracts/types.js';
import { MarketQuotePayload } from '../../contracts/d01_quotes.js';
import { SecurityMaster } from '../../identity/security_master.js';
import { DhanApiClient } from './dhan_api_client.js';
import { DhanHistoricalAdapter, DhanHistoricalNormalizationResult } from './dhan_historical_adapter.js';
import { DhanHistoricalRequest } from './dhan_historical_dto.js';
import { DhanExchangeSegment } from './dhan_dto.js';
import { DhanResult, DhanFailure, dhanFailure } from './dhan_failures.js';
import { DhanInstrumentResolutionService } from './dhan_instrument_mapping_integration.js';
import { DhanInstrumentRegistry } from './dhan_instrument_map.js';
import { DhanMarketDataSource } from './dhan_market_data_source.js';
import {
  DhanBoundedCache,
  DhanConcurrencyLimiter,
  DhanRateLimiter,
  DhanRefreshOrchestrator,
  DhanRequestCoalescer,
  DhanSecurityScope,
  dhanQuoteCacheKey,
} from './dhan_operational_controls.js';

// ── Consumer-facing (provider-neutral) request/response contracts ────────────

export interface QuoteRequest {
  companyId: string;
  /**
   * The complete canonical P04 `D114SecurityIdentity` (`ISIN:<isin>:<series>`).
   * Quote resolution REQUIRES it: companyId, ISIN-only or segment-only requests
   * fail closed before any provider invocation. Typically sourced from the
   * G-2 persisted holding identity.
   */
  securityIdentity: D114SecurityIdentity;
  exchangeSegment?: DhanExchangeSegment;
}

export type QuoteResponse =
  | { ok: true; envelope: CanonicalEnvelope<MarketQuotePayload>; freshness: 'CURRENT' | 'STALE' }
  | { ok: false; failure: DhanFailure };

export interface HistoricalServiceRequest extends DhanHistoricalRequest {}

export type HistoricalResponse =
  | { ok: true; result: DhanHistoricalNormalizationResult }
  | { ok: false; failure: DhanFailure };

export interface ServiceHealth {
  /** Process-level availability of the composed service. */
  service: 'UP' | 'DOWN';
  /** Provider credential configuration state (never the credentials). */
  providerConfiguration: 'CONFIGURED' | 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE';
  /** Live provider connectivity is NEVER claimed pre-access. */
  liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS';
  /** Provider qualification status. */
  providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED';
}

export interface DhanMarketDataServiceOptions {
  client: DhanApiClient;
  securityMaster: SecurityMaster;
  instrumentRegistry: DhanInstrumentRegistry;
  cache?: DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>;
  limiter?: DhanRateLimiter;
  concurrency?: DhanConcurrencyLimiter;
  coalescer?: DhanRequestCoalescer;
  now?: () => Date;
}

/**
 * Composed IPD-owned market-data service. Consumers (e.g. IRR backend) call
 * this service or its transport — they never construct Dhan primitives.
 */
export class DhanMarketDataService {
  private readonly source: DhanMarketDataSource;
  private readonly historical: DhanHistoricalAdapter;
  private readonly resolution: DhanInstrumentResolutionService;
  private readonly orchestrator: DhanRefreshOrchestrator;
  private readonly cache: DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>;
  private readonly limiter: DhanRateLimiter;
  private readonly client: DhanApiClient;
  private readonly now: () => Date;
  // Bounded diagnostic history, separate from observation cache; never affects execution.
  private readonly refreshStatus = new Map<string, RefreshStatus>();
  private running = false;

  constructor(options: DhanMarketDataServiceOptions) {
    this.client = options.client;
    this.now = options.now ?? (() => new Date());
    this.source = new DhanMarketDataSource({
      client: options.client,
      instrumentRegistry: options.instrumentRegistry,
      now: this.now,
    });
    this.historical = new DhanHistoricalAdapter({
      client: options.client,
      instrumentRegistry: options.instrumentRegistry,
    });
    this.resolution = new DhanInstrumentResolutionService(options.securityMaster, options.instrumentRegistry);
    this.cache = options.cache ?? new DhanBoundedCache<CanonicalEnvelope<MarketQuotePayload>>(256);
    this.limiter = options.limiter ?? new DhanRateLimiter({ maxRequests: 60, windowMs: 60_000, now: () => this.now().getTime() });
    const concurrency = options.concurrency ?? new DhanConcurrencyLimiter(8);
    const coalescer = options.coalescer ?? new DhanRequestCoalescer();
    this.orchestrator = new DhanRefreshOrchestrator({
      cache: this.cache,
      limiter: this.limiter,
      concurrency,
      coalescer,
      now: this.now,
      fetchQuote: async (scope: DhanSecurityScope) => {
        try {
          const envelope = await this.source.fetchSnapshot({
            companyId: scope.companyId,
            domain: 'D01_QUOTES',
            parameters: { exchangeSegment: scope.exchangeSegment, isin: scope.isin, series: scope.series },
          });
          return { ok: true as const, value: envelope };
        } catch (err) {
          const failure = (err as { failure?: DhanFailure }).failure;
          return { ok: false as const, failure: failure ?? dhanFailure('TRANSPORT_FAILURE', 'unknown provider failure').failure };
        }
      },
    });
  }

  /** Deterministic lifecycle. */
  public start(): void {
    this.running = true;
  }

  public stop(): void {
    this.running = false;
    this.orchestrator.stop();
  }

  public get isRunning(): boolean {
    return this.running;
  }

  /**
   * Canonical quote request. Identity is validated first; ambiguous or
   * incomplete identity fails closed before any provider invocation.
   * Goes through the Prompt 4 orchestrator (cache, rate limit, coalescing,
   * concurrency), never directly to the provider.
   */
  public async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    if (!this.running) return { ok: false, failure: dhanFailure('PROVIDER_STATUS_FAILURE', 'service not started').failure };
    if (!request || typeof request.companyId !== 'string' || !request.companyId.trim()) {
      return { ok: false, failure: dhanFailure('MISSING_REQUIRED_FIELD', 'companyId is required', { field: 'companyId' }).failure };
    }
    // The exact canonical D114 identity is MANDATORY — validated with the
    // authoritative P04 validator before anything else, never reconstructed.
    if (!request.securityIdentity || !isD114SecurityIdentity(request.securityIdentity)) {
      return {
        ok: false,
        failure: dhanFailure('MISSING_REQUIRED_FIELD', 'a valid canonical D114 securityIdentity (ISIN:<isin>:<series>) is required', { field: 'securityIdentity' }).failure,
      };
    }
    if (request.exchangeSegment !== undefined && request.exchangeSegment !== 'NSE_EQ' && request.exchangeSegment !== 'BSE_EQ') {
      return { ok: false, failure: dhanFailure('MALFORMED_RESPONSE', 'unsupported exchangeSegment', { field: 'exchangeSegment' }).failure };
    }

    // Fail closed on missing/ambiguous/inconsistent identity at the governed
    // mapping boundary: resolve the EXACT identity (ISIN + series bound to the
    // company and segment) BEFORE any provider call.
    const identity = request.securityIdentity;
    const segment = request.exchangeSegment ?? 'NSE_EQ';
    const mapping = this.resolution.resolveExactIdentity(request.companyId, segment, identity);
    if (!mapping.ok) {
      return { ok: false, failure: mapping.failure };
    }
    const scope: DhanSecurityScope = {
      companyId: request.companyId,
      exchangeSegment: segment,
      isin: identity.isin.toUpperCase(),
      series: identity.series.toUpperCase(),
    };

    const outcomes = await this.orchestrator.refresh([scope]);
    const outcome = outcomes[0]!;
    const key = dhanQuoteCacheKey(scope);
    const previous = this.refreshStatus.get(key);
    this.refreshStatus.delete(key);
    this.refreshStatus.set(key, {
      outcome: outcome.status,
      lastFailure: outcome.status === 'FAILURE'
        ? { code: 'REFRESH_FAILED', priorPreserved: outcome.priorPreserved }
        : previous?.lastFailure ?? null,
    });
    if (this.refreshStatus.size > 256) this.refreshStatus.delete(this.refreshStatus.keys().next().value!);
    if (outcome.status === 'SKIPPED_FRESH' || outcome.status === 'SUCCESS') {
      const entry = this.cache.get(dhanQuoteCacheKey(scope), this.now().toISOString());
      if (entry.entry) {
        return { ok: true, envelope: entry.entry, freshness: entry.state === 'CURRENT' ? 'CURRENT' : 'STALE' };
      }
    }
    if (outcome.status === 'FAILURE') {
      return {
        ok: false,
        failure: {
          code: outcome.code,
          message: outcome.message ?? 'quote refresh failed',
          ...(outcome.httpStatus !== undefined ? { httpStatus: outcome.httpStatus } : {}),
        },
      };
    }
    return { ok: false, failure: dhanFailure('PROVIDER_STATUS_FAILURE', 'no quote produced').failure };
  }

  /** Read-only status: never touches LRU order, refreshes or invokes the provider. */
  public getFreshness(request: { domain: 'D01_QUOTES'; companyId: string; exchangeSegment: DhanExchangeSegment; securityIdentity: D114SecurityIdentity } | { domain: 'D02_OHLCV' }): FreshnessStatus {
    const evaluatedAt = this.now().toISOString();
    const unknown: RefreshStatus = { outcome: 'UNKNOWN', lastFailure: null };
    // The composed D02 adapter does not use DhanHistoricalCache or the refresh orchestrator.
    if (request.domain === 'D02_OHLCV') return freshnessStatus(request.domain, null, evaluatedAt, unknown);
    const scope: DhanSecurityScope = { companyId: request.companyId, exchangeSegment: request.exchangeSegment, isin: request.securityIdentity.isin, series: request.securityIdentity.series };
    const key = dhanQuoteCacheKey(scope);
    return freshnessStatus(request.domain, this.cache.peek(key, evaluatedAt), evaluatedAt, this.refreshStatus.get(key) ?? unknown);
  }

  /** Canonical historical request through the existing D02 adapter path. */
  public async getHistorical(request: HistoricalServiceRequest): Promise<HistoricalResponse> {
    if (!this.running) return { ok: false, failure: dhanFailure('PROVIDER_STATUS_FAILURE', 'service not started').failure };
    if (!this.limiter.tryAcquire()) {
      return { ok: false, failure: dhanFailure('RATE_LIMITED', 'provider request budget exhausted').failure };
    }
    const result = await this.historical.fetchDailyCandles(request);
    if (result.ok) return { ok: true, result: result.value };
    return { ok: false, failure: result.failure };
  }

  /**
   * Readiness/health. A healthy process NEVER implies live Dhan connectivity.
   */
  public async health(): Promise<ServiceHealth> {
    const providerHealth = await this.source.healthCheck();
    return {
      service: this.running ? 'UP' : 'DOWN',
      providerConfiguration:
        providerHealth.status === 'DOWN' && this.client.getConfig().readiness === 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'
          ? 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE'
          : 'CONFIGURED',
      liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS',
      providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED',
    };
  }
}
