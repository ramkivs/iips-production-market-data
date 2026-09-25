/**
 * Institutional Investment Platform System (IIPS)
 * Provider-Neutral Market-Data Route & Data-State Integration (DHAN-D2)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-12 / NFR-06
 * Gate: DHAN-D2 INTEGRATION & QUALIFICATION HARNESS
 * Mode: PRE_ACCESS / SYNTHETIC / OFFLINE
 *
 * This module contains NO vendor-specific code. It accepts any implementation of the
 * existing `MarketDataSource<MarketQuotePayload>` SPI and converts its canonical output
 * into the EXISTING product transport DTO plus the CURRENT / STALE / UNAVAILABLE
 * presentation state used by product surfaces.
 *
 * FAIL-CLOSED RULE:
 *  A route result is only CURRENT when the canonical quality state is GOOD. Any failure,
 *  degradation or absence resolves to STALE (explicitly flagged) or UNAVAILABLE — stale or
 *  invalid data can never present itself as current.
 */

import { CanonicalEnvelope } from '../contracts/envelope.js';
import { MarketQuotePayload } from '../contracts/d01_quotes.js';
import { QualityState } from '../contracts/types.js';
import { MarketDataSource, SnapshotQuery } from '../spi/provider_spi.js';
import { EngineApiAdapter } from '../transports/engine_api_adapter.js';
import { MarketDataDTO } from '../transports/market_data_dto.js';
import { ProductTransportMode } from '../transports/types.js';
import { AccessibilityEngine } from '../ui/accessibility_engine.js';
import { UIQualityIndicator } from '../ui/types.js';

/** Product-surface data state. Derived from canonical quality only. */
export type MarketDataPresentationState = 'CURRENT' | 'STALE' | 'UNAVAILABLE';

/**
 * Maps the canonical QualityState onto the product data state.
 * GOOD → CURRENT, STALE → STALE, everything else (PARTIAL / UNAVAILABLE) → UNAVAILABLE.
 */
export function deriveMarketDataState(quality: QualityState): MarketDataPresentationState {
  if (quality === 'GOOD') return 'CURRENT';
  if (quality === 'STALE') return 'STALE';
  return 'UNAVAILABLE';
}

export interface ProviderRouteQuoteResult {
  /** Symbolic SPI provider id (e.g. DHAN_PROVIDER). Operator/route metadata only. */
  providerRouteId: string;
  companyId: string;
  state: MarketDataPresentationState;
  quality: QualityState;
  /** Present only when canonical data was produced. */
  envelope?: CanonicalEnvelope<MarketQuotePayload>;
  /** Existing product transport DTO; the only shape handed to consumers. */
  marketData?: MarketDataDTO;
  asOf?: string;
  failureCode?: string;
  failureMessage?: string;
}

function extractFailureCode(err: unknown): { code: string; message: string } {
  const candidate = err as { code?: unknown; message?: unknown } | null;
  const code = candidate && typeof candidate.code === 'string' ? candidate.code : 'PROVIDER_ERROR';
  const message =
    candidate && typeof candidate.message === 'string' ? candidate.message : 'Provider call failed closed';
  return { code, message };
}

/**
 * Provider-neutral read path used by qualification harnesses and product consumers.
 * Never throws: every provider failure is converted into an UNAVAILABLE result carrying a
 * deterministic failure code.
 */
export class ProviderMarketDataRoute {
  private readonly source: MarketDataSource<MarketQuotePayload>;
  private readonly mode: ProductTransportMode;

  constructor(source: MarketDataSource<MarketQuotePayload>, mode: ProductTransportMode = 'SNAPSHOT') {
    this.source = source;
    this.mode = mode;
  }

  public get providerRouteId(): string {
    return this.source.providerId;
  }

  public async getQuote(companyId: string, asOf?: string): Promise<ProviderRouteQuoteResult> {
    const query: SnapshotQuery = { companyId, domain: 'D01_QUOTES', asOf };

    let envelope: CanonicalEnvelope<MarketQuotePayload>;
    try {
      envelope = await this.source.fetchSnapshot(query);
    } catch (err: unknown) {
      const { code, message } = extractFailureCode(err);
      return {
        providerRouteId: this.source.providerId,
        companyId,
        state: 'UNAVAILABLE',
        quality: 'UNAVAILABLE',
        failureCode: code,
        failureMessage: message,
      };
    }

    const quality = envelope.provenance.qualityState;
    const state = deriveMarketDataState(quality);

    if (state === 'UNAVAILABLE') {
      return {
        providerRouteId: this.source.providerId,
        companyId,
        state,
        quality,
        asOf: envelope.provenance.asOf,
        failureCode: 'QUALITY_FLOOR_NOT_MET',
        failureMessage: `Canonical quality '${quality}' is below the presentation floor`,
      };
    }

    const marketData = EngineApiAdapter.createMarketDataDTO({
      quote: envelope.payload,
      mode: this.mode,
      asOf: envelope.provenance.asOf,
      quality,
    });

    return {
      providerRouteId: this.source.providerId,
      companyId,
      state,
      quality,
      envelope,
      marketData,
      asOf: envelope.provenance.asOf,
    };
  }

  public async getQuotes(companyIds: readonly string[], asOf?: string): Promise<ProviderRouteQuoteResult[]> {
    const results: ProviderRouteQuoteResult[] = [];
    for (const companyId of companyIds) {
      results.push(await this.getQuote(companyId, asOf));
    }
    return results;
  }
}

/**
 * Operator/product data-state view.
 *
 * NFR-06 NOTE: `providerRouteId` / `providerDisplayLabel` are ROUTE-level operator metadata
 * sourced from the SPI's symbolic provider id. They are not part of the canonical envelope,
 * the MarketDataDTO or any consumer contract, and no vendor field or credential is carried.
 */
export interface ProviderRouteDataStateView {
  providerRouteId: string;
  providerDisplayLabel: string;
  companyId: string;
  symbol: string | null;
  state: MarketDataPresentationState;
  displayPrice: number | null;
  displayTimestamp: string | null;
  quality: QualityState;
  qualityIndicator: UIQualityIndicator;
  isDegraded: boolean;
  unavailableReason?: string;
  /** Mandatory pre-access labelling: this route is not live-provider data. */
  disclosure: string;
}

export const PRE_ACCESS_ROUTE_DISCLOSURE =
  'PRE_ACCESS / SYNTHETIC / OFFLINE: qualification harness output; not live provider data';

export function buildProviderRouteDataStateView(
  result: ProviderRouteQuoteResult,
  options: { disclosure?: string } = {}
): ProviderRouteDataStateView {
  const qualityIndicator = AccessibilityEngine.getQualityIndicator(result.quality);
  const priced = result.state !== 'UNAVAILABLE' && result.marketData !== undefined;

  return {
    providerRouteId: result.providerRouteId,
    providerDisplayLabel: result.providerRouteId.replace(/_PROVIDER$/, ''),
    companyId: result.companyId,
    symbol: priced ? (result.marketData as MarketDataDTO).symbol : null,
    state: result.state,
    displayPrice: priced ? (result.marketData as MarketDataDTO).ltp : null,
    displayTimestamp: priced ? result.asOf ?? null : null,
    quality: result.quality,
    qualityIndicator,
    isDegraded: result.state !== 'CURRENT',
    unavailableReason: result.state === 'UNAVAILABLE' ? result.failureCode ?? 'UNAVAILABLE' : undefined,
    disclosure: options.disclosure ?? PRE_ACCESS_ROUTE_DISCLOSURE,
  };
}
