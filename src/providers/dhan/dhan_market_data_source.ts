import { parseTradingCalendar, type TradingCalendar } from '../../quality/trading_calendar.js';
/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Provider Adapter behind the Provider-Neutral SPI (DHAN-D1)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / NFR-06
 * Gate: DHAN-D1 PRE-ACCESS PROVIDER FOUNDATION
 *
 * ARCHITECTURE:
 *   Dhan API -> DhanApiClient -> DhanMarketDataSource (this adapter)
 *            -> EXISTING CanonicalEnvelope<MarketQuotePayload> -> IIPS consumers
 *
 * The adapter implements the existing MarketDataSource<T> SPI (src/spi).
 * No Dhan-specific contract is exposed to IIPS consumers.
 *
 * PRE-ACCESS NOTICE: no live Dhan authentication or connectivity exists in this gate.
 */

import { CanonicalEnvelope } from '../../contracts/envelope.js';
import { MarketQuotePayload } from '../../contracts/d01_quotes.js';
import { buildD114SecurityIdentity,  SourceClassification } from '../../contracts/types.js';
import {
  MarketDataSource,
  ProviderHealth,
  SnapshotQuery,
  StreamSubscription,
} from '../../spi/provider_spi.js';
import { DhanApiClient } from './dhan_api_client.js';
import { DHAN_PROVIDER_ID, DhanProviderConfig } from './dhan_config.js';
import { selectDhanQuote } from './dhan_dto.js';
import { DhanFailure, DhanProviderError } from './dhan_failures.js';
import { DhanInstrumentRegistry } from './dhan_instrument_map.js';
import { normalizeDhanQuoteToCanonical } from './dhan_normalizer.js';
import type { DhanProviderObservedState } from './dhan_provider_state_recorder.js';

export interface DhanMarketDataSourceOptions {
  tradingCalendar?: TradingCalendar;
  client: DhanApiClient;
  instrumentRegistry: DhanInstrumentRegistry;
  /** Injected clock so envelopes and health are deterministic under test. */
  now?: () => Date;
}

export class DhanMarketDataSource implements MarketDataSource<MarketQuotePayload> {
  public readonly providerId = DHAN_PROVIDER_ID;

  private readonly client: DhanApiClient;
  private readonly instrumentRegistry: DhanInstrumentRegistry;
  private readonly now: () => Date;
  private readonly tradingCalendar?: TradingCalendar;
  private lastFailure: DhanFailure | null = null;

  constructor(options: DhanMarketDataSourceOptions) {
    this.tradingCalendar = options.tradingCalendar ? parseTradingCalendar(options.tradingCalendar) : undefined;
    this.client = options.client;
    this.instrumentRegistry = options.instrumentRegistry;
    this.now = options.now ?? (() => new Date());
  }

  public getSourceClassification(): SourceClassification {
    return 'CANONICAL_MARKET_DATA';
  }

  public getConfig(): DhanProviderConfig {
    return this.client.getConfig();
  }

  /** Last deterministic failure observed, for operator diagnostics. */
  public getLastFailure(): DhanFailure | null {
    return this.lastFailure;
  }

  /** Observation-only snapshot of the shared W-08 provider state recorder. */
  public getObservedState(): DhanProviderObservedState {
    return this.client.getObservedState();
  }

  /**
   * Fetches a canonical D01 snapshot for a single IIPS company.
   * Throws DhanProviderError (deterministic code) on every failure path:
   * partial or unvalidated market data is never emitted.
   */
  public async fetchSnapshot(query: SnapshotQuery): Promise<CanonicalEnvelope<MarketQuotePayload>> {
    if (query.domain !== 'D01_QUOTES') {
      throw this.fail({
        code: 'UNSUPPORTED_DOMAIN',
        message: `Dhan provider foundation supports D01_QUOTES only; received ${query.domain}`,
      });
    }

    // Security-level resolution: an explicit exchange segment selects the listing;
    // otherwise a multi-listing company fails closed (AMBIGUOUS_MAPPING).
    const segmentParam = query.parameters?.['exchangeSegment'];
    const isinParam = query.parameters?.['isin'];
    const seriesParam = query.parameters?.['series'];
    let resolution: ReturnType<DhanInstrumentRegistry['resolve']>;
    if (
      (segmentParam === 'NSE_EQ' || segmentParam === 'BSE_EQ') &&
      typeof isinParam === 'string' && isinParam.trim() &&
      typeof seriesParam === 'string' && seriesParam.trim()
    ) {
      // Exact D114 path: ISIN + series must match one mapping exactly.
      const identity = buildD114SecurityIdentity(isinParam, seriesParam);
      resolution = identity
        ? this.instrumentRegistry.resolveExactIdentity(query.companyId, segmentParam, identity)
        : { status: 'UNRESOLVED', reason: 'AMBIGUOUS_MAPPING', companyId: query.companyId, details: 'ISIN + series do not form a canonical P04 D114 identity.' };
    } else if (segmentParam === 'NSE_EQ' || segmentParam === 'BSE_EQ') {
      resolution =
        typeof isinParam === 'string' && isinParam.trim()
          ? this.instrumentRegistry.resolveSecurity(query.companyId, segmentParam, isinParam)
          : this.instrumentRegistry.resolveListing(query.companyId, segmentParam);
    } else {
      resolution = this.instrumentRegistry.resolve(query.companyId);
    }
    if (resolution.status === 'UNRESOLVED') {
      throw this.fail({
        code: 'UNRESOLVED_INSTRUMENT',
        message: `${resolution.reason}: ${resolution.details}`,
        field: 'companyId',
      });
    }

    const mapping = resolution.mapping;
    const callResult = await this.client.fetchMarketQuotes(
      [{ exchangeSegment: mapping.exchangeSegment, dhanSecurityId: mapping.dhanSecurityId }],
      { deferSuccessRecording: true }
    );

    if (!callResult.ok) {
      throw this.fail(callResult.failure);
    }

    const receivedAt = this.now().toISOString();
    const latencyMs = callResult.value.metrics.latencyMs;

    const selected = selectDhanQuote(callResult.value.dto, mapping.exchangeSegment, mapping.dhanSecurityId);
    if (!selected.ok) {
      this.client.getStateRecorder().recordFailure({
        category: selected.failure.code,
        at: receivedAt,
        latencyMs,
      });
      throw this.fail(selected.failure);
    }

    const normalized = normalizeDhanQuoteToCanonical({
      tradingCalendar: this.tradingCalendar,
      quote: selected.value,
      mapping,
      receivedAt,
      evaluatedAt: receivedAt,
      mode: query.asOf ? 'PIT' : 'SNAPSHOT',
    });

    if (!normalized.ok) {
      this.client.getStateRecorder().recordFailure({
        category: normalized.failure.code,
        at: receivedAt,
        latencyMs,
      });
      throw this.fail(normalized.failure);
    }

    this.lastFailure = null;
    this.client.getStateRecorder().recordSuccess({
      at: receivedAt,
      latencyMs,
    });
    return normalized.value.envelope;
  }

  /**
   * Streaming is not part of the pre-access foundation.
   * Fails deterministically rather than emitting a silently inert subscription.
   */
  public subscribeStream(
    _subscription: StreamSubscription,
    _handler: (envelope: CanonicalEnvelope<MarketQuotePayload>) => void
  ): () => void {
    throw this.fail({
      code: 'UNSUPPORTED_PRE_ACCESS_OPERATION',
      message: 'Dhan streaming is not enabled in the pre-access provider foundation',
    });
  }

  /**
   * Reports provider health WITHOUT performing any network call or mutating
   * recorder state. Pre-access (no credentials configured) is reported as DOWN,
   * never HEALTHY.
   */
  public async healthCheck(): Promise<ProviderHealth> {
    const config = this.client.getConfig();
    const observed = this.client.getObservedState();
    const heartbeat = this.now().toISOString();

    if (config.readiness === 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE') {
      return { status: 'DOWN', latencyMs: 0, lastHeartbeat: heartbeat };
    }
    if (observed.authLatched || observed.lastFailure !== null) {
      return { status: 'DOWN', latencyMs: observed.lastLatencyMs ?? 0, lastHeartbeat: heartbeat };
    }
    if (!observed.lastSuccessAt) {
      return { status: 'DEGRADED', latencyMs: 0, lastHeartbeat: heartbeat };
    }
    return {
      status: 'HEALTHY',
      latencyMs: observed.lastLatencyMs ?? 0,
      lastHeartbeat: observed.lastSuccessAt,
    };
  }

  private fail(failure: DhanFailure): DhanProviderError {
    this.lastFailure = failure;
    return new DhanProviderError(failure);
  }
}
