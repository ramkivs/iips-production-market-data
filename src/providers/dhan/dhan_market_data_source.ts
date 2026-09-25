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
import { SourceClassification } from '../../contracts/types.js';
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

export interface DhanMarketDataSourceOptions {
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
  private lastFailure: DhanFailure | null = null;
  private lastSuccessAt: string | null = null;
  private lastLatencyMs = 0;

  constructor(options: DhanMarketDataSourceOptions) {
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

    const resolution = this.instrumentRegistry.resolve(query.companyId);
    if (resolution.status === 'UNRESOLVED') {
      throw this.fail({
        code: 'UNRESOLVED_INSTRUMENT',
        message: `${resolution.reason}: ${resolution.details}`,
        field: 'companyId',
      });
    }

    const mapping = resolution.mapping;
    const callResult = await this.client.fetchMarketQuotes([
      { exchangeSegment: mapping.exchangeSegment, dhanSecurityId: mapping.dhanSecurityId },
    ]);

    if (!callResult.ok) {
      throw this.fail(callResult.failure);
    }

    const selected = selectDhanQuote(callResult.value.dto, mapping.exchangeSegment, mapping.dhanSecurityId);
    if (!selected.ok) {
      throw this.fail(selected.failure);
    }

    const receivedAt = this.now().toISOString();
    const normalized = normalizeDhanQuoteToCanonical({
      quote: selected.value,
      mapping,
      receivedAt,
      evaluatedAt: receivedAt,
      mode: query.asOf ? 'PIT' : 'SNAPSHOT',
    });

    if (!normalized.ok) {
      throw this.fail(normalized.failure);
    }

    this.lastFailure = null;
    this.lastSuccessAt = receivedAt;
    this.lastLatencyMs = callResult.value.metrics.latencyMs;
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
   * Reports provider health WITHOUT performing any network call.
   * Pre-access (no credentials configured) is reported as DOWN, never HEALTHY.
   */
  public async healthCheck(): Promise<ProviderHealth> {
    const config = this.client.getConfig();
    const heartbeat = this.now().toISOString();

    if (config.readiness === 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE') {
      return { status: 'DOWN', latencyMs: 0, lastHeartbeat: heartbeat };
    }
    if (this.lastFailure) {
      return { status: 'DOWN', latencyMs: this.lastLatencyMs, lastHeartbeat: heartbeat };
    }
    if (!this.lastSuccessAt) {
      return { status: 'DEGRADED', latencyMs: 0, lastHeartbeat: heartbeat };
    }
    return { status: 'HEALTHY', latencyMs: this.lastLatencyMs, lastHeartbeat: this.lastSuccessAt };
  }

  private fail(failure: DhanFailure): DhanProviderError {
    this.lastFailure = failure;
    return new DhanProviderError(failure);
  }
}
