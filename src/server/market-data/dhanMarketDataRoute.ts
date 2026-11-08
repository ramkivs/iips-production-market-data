/**
 * Institutional Investment Platform System (IIPS)
 * IRR Stage 2 — Provider-Neutral IPD Market-Data Consumer Boundary
 *
 * Reference location in the IRR repository (`ramkivs/iips-review-recovered`):
 *   frontend/server/market-data/dhanMarketDataRoute.ts
 *
 * This IPD workspace copy is the server-side consumer boundary IRR stages onto
 * IPD's provider-neutral `MarketDataTransportClient`. It is deliberately placed
 * under `src/server/` (not `frontend/server/`): IPD operates a structural gate
 * (`tests/q1_ipc_read_contract_conformance.test.ts`) that forbids a
 * `frontend/server` route tier in this repository — that tier belongs to IRR.
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-17 (Zero-Plaintext)
 * Mode: PRE_ACCESS / SYNTHETIC / OFFLINE
 *
 * IRR is a PROVIDER-NEUTRAL consumer of IPD's market data. This module consumes
 * IPD's provider-neutral `MarketDataTransportClient` (published on
 * `iips-production-market-data/dhan-server`) over local loopback HTTP,
 * authenticated with the server-side transport token (`IIPS_MARKET_DATA_TRANSPORT_TOKEN`).
 *
 * BOUNDARY RULES (never violated by this module):
 *  - Loopback HTTP only: the transport client rejects any non-`http://` loopback
 *    baseUrl before opening a socket; this module adds no other network target and
 *    performs no network access at construction time.
 *  - No direct Dhan vendor requests from IRR.
 *  - No Dhan-specific credential handling: this module never reads `IIPS_DHAN_*`,
 *    resolves Dhan `SecretRef`s, or touches Dhan access-token/client-id material.
 *  - No provider-specific client instantiation: only `MarketDataTransportClient`
 *    from IPD's `./dhan-server` package surface is instantiated.
 *  - Transport token remains server-side: never logged, echoed or returned.
 *  - Typed outcomes preserved: every failure is returned as an explicit typed
 *    fail-closed outcome; failures are never converted into fabricated market data.
 *  - Server-only: this module must never be imported by browser bundles; the
 *    constructor fails if a browser `window` global is present.
 *
 * Readiness model (daemon availability vs live provider qualification):
 *  - `daemonAvailable` — whether the local IPD market-data daemon answered the
 *    request (any HTTP response, including failures). Absence of an HTTP response
 *    (connection refused, timeout, preflight refusal) resolves to `false`.
 *  - `providerQualification` — always `SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED`
 *    pre-access; live provider qualification is never claimed.
 *  - `liveProviderConnectivity` — always `NOT_CHECKED_PRE_ACCESS`.
 *  - `providerConfiguration` — observed from the daemon's health; defaults to the
 *    fail-closed `PRE_ACCESS_CREDENTIALS_UNAVAILABLE` when the daemon cannot be
 *    confirmed.
 */

import type { CanonicalEnvelope } from '../../contracts/envelope.js';
import type { MarketQuotePayload } from '../../contracts/d01_quotes.js';
import type { QualityState } from '../../contracts/types.js';
import { deriveMarketDataState } from '../../providers/market_data_route.js';
import {
  DhanHistoricalNormalizationResult,
  HistoricalServiceRequest,
  MarketDataTransportClient,
  type MarketDataTransportFailure,
  type MarketDataTransportFailureCode,
  type QuoteRequest,
  type ServiceHealth,
  MARKET_DATA_TRANSPORT_TOKEN_ENV,
} from '../../providers/dhan/package.js';

export const IRR_MARKET_DATA_ROUTE_DISCLOSURE =
  'PRE_ACCESS / SYNTHETIC / OFFLINE: IRR consumes IPD\u2019s provider-neutral ' +
  'MarketDataTransportClient over local loopback; not live Dhan provider data';

export interface DhanMarketDataReadiness {
  /** True only when the local IPD market-data daemon answered the request. */
  readonly daemonAvailable: boolean;
  /** Provider credential configuration observed from the daemon (never the credentials). */
  readonly providerConfiguration: 'CONFIGURED' | 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE';
  /** Live provider connectivity is never checked in pre-access mode. */
  readonly liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS';
  /** Provider qualification: synthetic only, never live-qualified. */
  readonly providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED';
  /** Mandatory pre-access disclosure. */
  readonly disclosure: string;
}

function daemonUnavailableReadiness(disclosure: string): DhanMarketDataReadiness {
  return {
    daemonAvailable: false,
    providerConfiguration: 'PRE_ACCESS_CREDENTIALS_UNAVAILABLE',
    liveProviderConnectivity: 'NOT_CHECKED_PRE_ACCESS',
    providerQualification: 'SYNTHETIC_ONLY_NOT_LIVE_QUALIFIED',
    disclosure,
  };
}

export type DhanMarketDataRouteFailureCode = MarketDataTransportFailureCode | 'QUALITY_FLOOR_NOT_MET';

export interface DhanMarketDataRouteFailure {
  readonly code: DhanMarketDataRouteFailureCode;
  readonly message: string;
  readonly httpStatus?: number;
}

export interface DhanMarketDataQuoteSuccess {
  readonly ok: true;
  readonly state: 'CURRENT' | 'STALE';
  readonly quality: QualityState;
  readonly envelope: CanonicalEnvelope<MarketQuotePayload>;
  readonly freshness: 'CURRENT' | 'STALE';
  readonly readiness: DhanMarketDataReadiness;
}

export interface DhanMarketDataQuoteFailure {
  readonly ok: false;
  readonly state: 'UNAVAILABLE';
  readonly quality: 'UNAVAILABLE';
  readonly failure: DhanMarketDataRouteFailure;
  readonly readiness: DhanMarketDataReadiness;
}

export type DhanMarketDataQuoteOutcome = DhanMarketDataQuoteSuccess | DhanMarketDataQuoteFailure;

export type DhanMarketDataHistoricalOutcome =
  | {
      readonly ok: true;
      readonly result: DhanHistoricalNormalizationResult;
      readonly readiness: DhanMarketDataReadiness;
    }
  | {
      readonly ok: false;
      readonly failure: DhanMarketDataRouteFailure;
      readonly readiness: DhanMarketDataReadiness;
    };

export interface DhanMarketDataRouteConfig {
  /** Loopback HTTP base URL of the IPD market-data daemon (http://127.0.0.1:<port>). */
  readonly baseUrl: string;
  /** Server-side transport credential (IIPS_MARKET_DATA_TRANSPORT_TOKEN); never a Dhan credential. */
  readonly token?: string;
  /** Per-request timeout in milliseconds. */
  readonly timeoutMs?: number;
  /** Test seam only; the injected fetch implementation. */
  readonly fetchImpl?: typeof fetch;
}

function assertServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new Error('DhanMarketDataRoute is server-only: browser access to the transport client and transport token is prohibited');
  }
}

/**
 * Provider-neutral market-data consumer for IRR.
 *
 * Wraps IPD's `MarketDataTransportClient` so IRR never instantiates Dhan provider
 * primitives, never handles Dhan credentials, and never opens direct vendor egress.
 * Every outcome carries an explicit readiness block that distinguishes daemon
 * availability from live provider qualification (which is never claimed).
 */
export class DhanMarketDataRoute {
  private readonly client: MarketDataTransportClient;
  private readonly disclosure: string;

  constructor(config: DhanMarketDataRouteConfig) {
    assertServerOnly();

    const token =
      config.token ??
      (typeof process !== 'undefined' && process.env ? process.env[MARKET_DATA_TRANSPORT_TOKEN_ENV] : undefined);
    this.client = new MarketDataTransportClient(config.baseUrl, token ?? '', {
      timeoutMs: config.timeoutMs,
      fetchImpl: config.fetchImpl,
    });
    this.disclosure = IRR_MARKET_DATA_ROUTE_DISCLOSURE;
  }

  public async getQuote(request: QuoteRequest): Promise<DhanMarketDataQuoteOutcome> {
    const transport = await this.client.getQuote(request);
    const baseReadiness = this.transportReadiness(transport);

    if (transport.ok) {
      const quality = transport.envelope.provenance.qualityState;
      const state = deriveMarketDataState(quality);
      if (state === 'UNAVAILABLE') {
        return {
          ok: false,
          state: 'UNAVAILABLE',
          quality: 'UNAVAILABLE',
          failure: {
            code: 'QUALITY_FLOOR_NOT_MET',
            message: `Canonical quality '${quality}' is below the presentation floor`,
          },
          readiness: { ...baseReadiness, daemonAvailable: true },
        };
      }
      return {
        ok: true,
        state,
        quality,
        envelope: transport.envelope,
        freshness: transport.freshness,
        readiness: { ...baseReadiness, daemonAvailable: true },
      };
    }

    return {
      ok: false,
      state: 'UNAVAILABLE',
      quality: 'UNAVAILABLE',
      failure: transport.failure,
      readiness: baseReadiness,
    };
  }

  public async getHistorical(request: HistoricalServiceRequest): Promise<DhanMarketDataHistoricalOutcome> {
    const transport = await this.client.getHistorical(request);
    const baseReadiness = this.transportReadiness(transport);

    if (transport.ok) {
      return { ok: true, result: transport.result, readiness: { ...baseReadiness, daemonAvailable: true } };
    }
    return { ok: false, failure: transport.failure, readiness: baseReadiness };
  }

  /**
   * Readiness/health of the local IPD market-data daemon.
   * Never implies live provider connectivity; never throws.
   */
  public async getHealth(): Promise<DhanMarketDataReadiness> {
    const outcome = await this.client.health();
    if (outcome.ok) {
      return {
        daemonAvailable: true,
        providerConfiguration: outcome.providerConfiguration,
        liveProviderConnectivity: outcome.liveProviderConnectivity,
        providerQualification: outcome.providerQualification,
        disclosure: this.disclosure,
      };
    }
    return {
      ...daemonUnavailableReadiness(this.disclosure),
      daemonAvailable: outcome.failure.httpStatus !== undefined,
    };
  }

  /**
   * Derives the readiness block carried by every outcome. A transport failure
   * carrying an HTTP status means the daemon answered (`daemonAvailable: true`);
   * preflight, connection-refused and timeout failures carry no HTTP status and
   * resolve to `daemonAvailable: false` (fail closed).
   */
  private transportReadiness(transport: { ok: boolean } & { failure?: MarketDataTransportFailure }): DhanMarketDataReadiness {
    if (transport.ok) {
      return {
        ...daemonUnavailableReadiness(this.disclosure),
        daemonAvailable: true,
      };
    }
    const failure = transport.failure;
    return {
      ...daemonUnavailableReadiness(this.disclosure),
      daemonAvailable: failure !== undefined && failure.httpStatus !== undefined,
    };
  }
}
