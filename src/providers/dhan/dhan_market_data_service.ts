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

import { CanonicalEnvelope } from '../../contracts/envelope.js';
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
  isin?: string;
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
            parameters: { exchangeSegment: scope.exchangeSegment, isin: scope.isin },
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
    if (request.isin !== undefined && !/^[A-Za-z0-9]{12}$/.test(request.isin.trim())) {
      return { ok: false, failure: dhanFailure('MALFORMED_RESPONSE', 'isin must be 12 characters', { field: 'isin' }).failure };
    }
    if (request.exchangeSegment !== undefined && request.exchangeSegment !== 'NSE_EQ' && request.exchangeSegment !== 'BSE_EQ') {
      return { ok: false, failure: dhanFailure('MALFORMED_RESPONSE', 'unsupported exchangeSegment', { field: 'exchangeSegment' }).failure };
    }

    // Fail closed on ambiguous identity at the governed mapping boundary:
    // resolve through P04 + the Prompt 3B registry BEFORE any provider call.
    const scope: DhanSecurityScope = {
      companyId: request.companyId,
      exchangeSegment: request.exchangeSegment ?? 'NSE_EQ',
      isin: request.isin?.trim().toUpperCase(),
    };
    const mapping = this.resolution.resolveProviderMapping(scope.companyId, scope.exchangeSegment, scope.isin);
    if (!mapping.ok) {
      return { ok: false, failure: mapping.failure };
    }

    const outcomes = await this.orchestrator.refresh([scope]);
    const outcome = outcomes[0]!;
    if (outcome.status === 'SKIPPED_FRESH' || outcome.status === 'SUCCESS') {
      const entry = this.cache.get(dhanQuoteCacheKey(scope), this.now().toISOString());
      if (entry.entry) {
        return { ok: true, envelope: entry.entry, freshness: entry.state === 'CURRENT' ? 'CURRENT' : 'STALE' };
      }
    }
    if (outcome.status === 'FAILURE') {
      return { ok: false, failure: { code: outcome.code, message: 'quote refresh failed' } };
    }
    return { ok: false, failure: dhanFailure('PROVIDER_STATUS_FAILURE', 'no quote produced').failure };
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
