/**
 * Institutional Investment Platform System (IIPS)
 * D02 Historical Provenance — the four-timestamp freshness vocabulary (W-19 / D-4.3)
 *
 * Governed under: D-4.3 (approved under D-4 Option C), AD-12, AD-01..AD-18
 *
 * D-4.3 requires D02 freshness to be reported "strictly from IPD evidence, using
 * `marketTimestamp`, `providerResponseTimestamp`, `retrievalTimestamp` and
 * `cacheTimestamp`", and requires unavailable evidence to stay explicitly unknown.
 *
 * The four instants are INDEPENDENT and are never substituted for one another:
 *
 *   marketTimestamp            the market event / effective instant the observation
 *                              describes (a candle period start), as DECLARED by the
 *                              source. It is not an availability claim.
 *   providerResponseTimestamp  when the exchange/provider PUBLISHED or produced the
 *                              response. Dhan's historical payload declares no such
 *                              field, so this is structurally NOT_DECLARED — it is
 *                              never inferred from a candle or from IPD's own clock.
 *   retrievalTimestamp         when IPD actually received the provider response.
 *   cacheTimestamp             when IPD stored the observation in the historical cache.
 *
 * `marketTimestamp` never populates the observation (`asOf`) field. IPD refuses to
 * infer an availability timestamp from a candle (`docs/IPD-P5-FRESHNESS-HTTP.md`),
 * so `asOf`/`observationEvaluatedAt` stay null for D02 and `timestampEvidence` stays
 * NOT_AVAILABLE. The declared market instant is reported in its own field, labelled
 * with its derivation, so no consumer can read it as an availability claim.
 */

import { createHash } from 'node:crypto';

import type { OHLCVCandle } from '../../contracts/d02_ohlcv.js';

export type DhanTimestampState =
  /** Present in the source evidence and well formed. */
  | 'DECLARED'
  /** The source structurally does not publish this instant; it is not missing by accident. */
  | 'NOT_DECLARED'
  /** Not produced yet (for example, no historical request has been served in this process). */
  | 'NOT_AVAILABLE';

/** How `marketTimestamp` was obtained. Only source-declared evidence is accepted. */
export type DhanMarketTimestampDerivation =
  /** The newest candle period start in the returned series. Declared by the source. */
  | 'SOURCE_DECLARED_CANDLE_PERIOD_START'
  /** No candle was returned (a valid empty result), so no market instant exists. */
  | 'NO_OBSERVATION';

/** Independent, per-field evidence state for the four timestamps. */
export interface DhanTimestampEvidence {
  readonly marketTimestamp: DhanTimestampState;
  readonly providerResponseTimestamp: DhanTimestampState;
  readonly retrievalTimestamp: DhanTimestampState;
  readonly cacheTimestamp: DhanTimestampState;
}

/** The four D-4.3 instants, each reported independently and truthfully. */
export interface DhanFreshnessTimestamps {
  /** Source-declared market effective instant; never an availability claim. */
  readonly marketTimestamp: string | null;
  readonly marketTimestampDerivation: DhanMarketTimestampDerivation;
  /** Provider publication instant. Null for Dhan historical: the payload declares none. */
  readonly providerResponseTimestamp: string | null;
  /** When IPD received the provider response. */
  readonly retrievalTimestamp: string | null;
  /** When IPD stored the observation in the historical cache. */
  readonly cacheTimestamp: string | null;
  readonly evidence: DhanTimestampEvidence;
}

/**
 * Frozen all-unknown projection for a process that holds no historical observation.
 *
 * All four instants are `NOT_AVAILABLE` — including the publication instant, which is
 * `NOT_DECLARED` only once an observation exists and can be described. Nothing here is
 * derived from a clock or a vendor.
 */
export const NO_DHAN_FRESHNESS_TIMESTAMPS: DhanFreshnessTimestamps = Object.freeze({
  marketTimestamp: null,
  marketTimestampDerivation: 'NO_OBSERVATION',
  providerResponseTimestamp: null,
  retrievalTimestamp: null,
  cacheTimestamp: null,
  evidence: Object.freeze({
    marketTimestamp: 'NOT_AVAILABLE',
    providerResponseTimestamp: 'NOT_AVAILABLE',
    retrievalTimestamp: 'NOT_AVAILABLE',
    cacheTimestamp: 'NOT_AVAILABLE',
  }),
});

/**
 * Correction / revision state of one historical observation.
 *
 * Historical observations are expected to be immutable, but a re-fetch of the same
 * complete request identity can legitimately return different content (a vendor
 * correction). IPD records the content digest and states explicitly what it observed:
 *
 *   BASELINE   no observation for this identity is currently retained, so there is
 *              nothing to compare and NO revision claim is made. It does not mean
 *              "this content has never existed at the vendor".
 *   UNCHANGED  content identical to the retained observation.
 *   REVISED    content differs from the retained observation; the prior digest is
 *              reported rather than silently discarded.
 */
export type DhanHistoricalRevisionState = 'BASELINE' | 'UNCHANGED' | 'REVISED';

export interface DhanHistoricalRevision {
  readonly state: DhanHistoricalRevisionState;
  /** SHA-256 over the canonical candle series; identifies the content, not the vendor. */
  readonly contentDigest: string;
  /** Digest this observation supersedes; present only for a REVISED observation. */
  readonly priorContentDigest: string | null;
}

/**
 * Source provenance carried by every D02 result, so a cached response is
 * indistinguishable from a served response in every respect that matters:
 * source, observation instant, freshness evidence and revision state survive caching.
 */
/** The canonical, provider-neutral identity the observation belongs to. */
export interface DhanObservationScope {
  readonly companyId: string;
  readonly exchangeSegment: 'NSE_EQ' | 'BSE_EQ';
  /** Canonical ISIN where the governed mapping declares one; never a vendor id. */
  readonly isin: string | null;
  /** Requested canonical interval (for example `1d`), for disambiguating series. */
  readonly interval: string;
}

export interface DhanHistoricalProvenance {
  readonly domain: 'D02_OHLCV';
  /**
   * Deliberately carries NO provider name: this object travels to consumers, and the
   * provider-neutral boundary forbids vendor identifiers leaving IPD. Source identity
   * stays inside the provider boundary (`sourceClassification` on the envelope).
   */
  /** Identity resolved by the governed registry, not echoed from caller input. */
  readonly observationScope: DhanObservationScope;
  /** IPD receipt instant of the provider response that produced this observation. */
  readonly retrievalTimestamp: string | null;
  /** Always null: the Dhan historical payload declares no publication instant. */
  readonly providerResponseTimestamp: null;
  readonly timestamps: DhanFreshnessTimestamps;
  readonly revision: DhanHistoricalRevision;
  /** True when the observation was served from the historical cache rather than re-fetched. */
  readonly servedFromCache: boolean;
  /** Declared, never assumed: adjustment status remains unverified pre-access (D-4.4). */
  readonly isAdjusted: false;
  readonly coverageClaim: 'ACCESS_PENDING_UNVERIFIED';
}

/**
 * Builds the timestamp block from evidence actually observed. Every argument is
 * evidence or an explicit absence; nothing here reads a clock or infers a value.
 */
export function dhanFreshnessTimestamps(input: {
  marketTimestamp: string | null;
  marketTimestampDerivation: DhanMarketTimestampDerivation;
  retrievalTimestamp: string | null;
  cacheTimestamp: string | null;
}): DhanFreshnessTimestamps {
  const valid = (value: string | null): value is string =>
    typeof value === 'string' && value.trim() !== '' && Number.isFinite(Date.parse(value));
  const market = valid(input.marketTimestamp) ? input.marketTimestamp : null;
  return Object.freeze({
    marketTimestamp: market,
    marketTimestampDerivation: market ? input.marketTimestampDerivation : 'NO_OBSERVATION',
    // Structural absence, not an accident: the vendor DTO carries no publication field.
    providerResponseTimestamp: null,
    retrievalTimestamp: valid(input.retrievalTimestamp) ? input.retrievalTimestamp : null,
    cacheTimestamp: valid(input.cacheTimestamp) ? input.cacheTimestamp : null,
    evidence: Object.freeze({
      marketTimestamp: market ? 'DECLARED' : 'NOT_AVAILABLE',
      providerResponseTimestamp: 'NOT_DECLARED',
      retrievalTimestamp: valid(input.retrievalTimestamp) ? 'DECLARED' : 'NOT_AVAILABLE',
      cacheTimestamp: valid(input.cacheTimestamp) ? 'DECLARED' : 'NOT_AVAILABLE',
    }),
  });
}

/**
 * Deterministic SHA-256 over the canonical candle series.
 *
 * Identity of the CONTENT, not of the vendor, the request or the transport: the
 * digest is computed from validated canonical fields in a fixed order, so replaying
 * the same observation always yields the same digest and any change of content
 * yields a different one. Provenance (retrieval time, cache time, cache hit) is
 * deliberately excluded — a re-read of cached content must not look like a revision.
 */
export function dhanHistoricalContentDigest(candles: readonly OHLCVCandle[]): string {
  const canonical = candles.map((c) => [
    c.companyId,
    c.symbol,
    c.interval,
    c.candleStart,
    c.candleEnd,
    c.open,
    c.high,
    c.low,
    c.close,
    c.volume,
    c.vwap ?? null,
    c.tradeCount ?? null,
    c.isAdjusted ? 'ADJ' : 'UNADJ',
    c.securityIdentity?.securityId ?? null,
  ]);
  return `sha256:${createHash('sha256').update(JSON.stringify(canonical)).digest('hex')}`;
}
