import { evaluateFreshness, type FreshnessEvaluationResult } from '../../quality/freshness_evaluator.js';
import { istDate, parseTradingCalendar, type TradingCalendar } from '../../quality/trading_calendar.js';
/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Historical Adapter — Canonical D02 Normalization (DHAN-D2)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-12
 * Gate: DHAN-D2 INTEGRATION & QUALIFICATION HARNESS
 * Mode: PRE_ACCESS / SYNTHETIC / OFFLINE
 *
 * Normalizes the vendor historical payload into the EXISTING canonical historical
 * contract `OHLCVCandle` (src/contracts/d02_ohlcv.ts). No new historical contract is
 * introduced and no live request is performed.
 *
 * ACCESS-PENDING: real historical coverage/depth is unknown and is NOT claimed.
 */

import { OHLCVCandle, validateOHLCVCandle } from '../../contracts/d02_ohlcv.js';
import { DhanApiClient } from './dhan_api_client.js';
import { DhanResult, dhanFailure, dhanOk } from './dhan_failures.js';
import { DhanInstrumentMapping, DhanInstrumentRegistry } from './dhan_instrument_map.js';
import {
  DHAN_HISTORICAL_PATH,
  DhanHistoricalRequest,
  DhanHistoricalResponseDto,
  buildDhanHistoricalRequestBody,
  dhanIntervalMs,
  dhanIntervalToCanonical,
  parseDhanHistoricalResponse,
  validateDhanHistoricalRequest,
} from './dhan_historical_dto.js';
import { DhanExchangeSegment } from './dhan_dto.js';
import {
  dhanFreshnessTimestamps,
  dhanHistoricalContentDigest,
  type DhanHistoricalProvenance,
  type DhanHistoricalRevision,
} from './dhan_historical_provenance.js';

export interface DhanHistoricalNormalizationResult {
  candles: OHLCVCandle[];
  /** Optional per-candle D02 assessment; never a live quote or IID five-day verdict. */
  dailyFreshness?: readonly (Omit<FreshnessEvaluationResult, 'ageSeconds'> & { ageSeconds: number | null })[];
  requestedFromDate: string;
  requestedToDate: string;
  /** Candle count actually returned; never presented as coverage evidence. */
  returnedCandleCount: number;
  coverageClaim: 'ACCESS_PENDING_UNVERIFIED';
  /**
   * W-19 / D-4.3: source provenance and the four freshness instants. Present on every
   * result this module produces; `null` only when an observation was assembled outside
   * the governed path, in which case every instant stays explicitly unknown.
   */
  provenance?: DhanHistoricalProvenance | null;
}

/**
 * Transforms one columnar vendor payload into validated canonical daily candles.
 * Every candle is validated with the existing D02 validator; a single invalid candle
 * fails the whole batch closed (no partial historical series is emitted).
 */
export function normalizeDhanHistoricalToCandles(params: {
  tradingCalendar?: TradingCalendar;
  evaluationTime?: string;
  dto: DhanHistoricalResponseDto;
  mapping: DhanInstrumentMapping;
  interval: DhanHistoricalRequest['interval'];
  fromDate: string;
  toDate: string;
  /**
   * W-19: IPD receipt instant of the provider response that carried this payload.
   * Supplied ONLY by the fetch boundary that actually received the response; when a
   * caller normalizes a payload it did not receive from the provider, it is absent and
   * the retrieval instant stays explicitly NOT_AVAILABLE rather than being stamped
   * with a fabricated clock read.
   */
  retrievalTimestamp?: string;
  /** W-19: revision context (retained digest for this identity), when one is known. */
  priorContentDigest?: string | null;
}): DhanResult<DhanHistoricalNormalizationResult> {
  const { dto, mapping } = params;
  const interval = params.interval;
  const intervalMs = dhanIntervalMs(interval);
  const canonicalInterval = dhanIntervalToCanonical(interval);
  const candles: OHLCVCandle[] = [];
  let previousStartMs = -Infinity;

  for (let i = 0; i < dto.timestamp.length; i++) {
    const epochSeconds = dto.timestamp[i];
    if (!Number.isFinite(epochSeconds) || epochSeconds <= 0) {
      return dhanFailure('MALFORMED_RESPONSE', `Historical timestamp at index ${i} is not a valid epoch`, {
        field: `timestamp[${i}]`,
      });
    }

    // Timestamps are epoch SECONDS at candle START (provisional vendor semantics);
    // duplicates and out-of-order series fail closed rather than being silently fixed.
    const startMs = Math.trunc(epochSeconds) * 1000;
    if (startMs === previousStartMs) {
      return dhanFailure('MALFORMED_RESPONSE', `Duplicate historical timestamp at index ${i}`, {
        field: `timestamp[${i}]`,
      });
    }
    if (startMs < previousStartMs) {
      return dhanFailure('MALFORMED_RESPONSE', `Historical series is out of order at index ${i}`, {
        field: `timestamp[${i}]`,
      });
    }
    previousStartMs = startMs;

    const candle: OHLCVCandle = {
      companyId: mapping.companyId,
      symbol: mapping.symbol,
      interval: canonicalInterval,
      candleStart: new Date(startMs).toISOString(),
      candleEnd: new Date(startMs + intervalMs).toISOString(),
      open: dto.open[i],
      high: dto.high[i],
      low: dto.low[i],
      close: dto.close[i],
      volume: dto.volume[i], // zero volume is legitimate and preserved; missing series is rejected at parse
      // Adjustment status is unverified pre-access; declared unadjusted rather than assumed.
      isAdjusted: false,
    };

    const validation = validateOHLCVCandle(candle);
    if (!validation.isValid) {
      const first = validation.errors[0];
      return dhanFailure(
        'CANONICAL_VALIDATION_FAILURE',
        `Historical candle at index ${i} failed canonical D02 validation: ${first.field}: ${first.message}`,
        { field: `candles[${i}].${first.field}` }
      );
    }

    candles.push(candle);
  }

  // W-19: the market instant is the newest source-DECLARED candle period start. It is
  // reported as a market instant only; it never becomes the observation's `asOf`.
  const contentDigest = dhanHistoricalContentDigest(candles);
  const prior = params.priorContentDigest ?? null;
  const revision: DhanHistoricalRevision = {
    state: prior === null ? 'BASELINE' : prior === contentDigest ? 'UNCHANGED' : 'REVISED',
    contentDigest,
    priorContentDigest: prior !== null && prior !== contentDigest ? prior : null,
  };
  const retrievalTimestamp = params.retrievalTimestamp ?? null;
  const timestamps = dhanFreshnessTimestamps({
    marketTimestamp: candles.length > 0 ? candles[candles.length - 1]!.candleStart : null,
    marketTimestampDerivation: 'SOURCE_DECLARED_CANDLE_PERIOD_START',
    retrievalTimestamp,
    // The cache instant exists only once the observation is stored; see the cache path.
    cacheTimestamp: null,
  });
  const provenance: DhanHistoricalProvenance = Object.freeze({
    domain: 'D02_OHLCV',
    observationScope: Object.freeze({
      companyId: mapping.companyId,
      exchangeSegment: mapping.exchangeSegment,
      isin: mapping.isin ?? null,
      interval: canonicalInterval,
    }),
    retrievalTimestamp: timestamps.retrievalTimestamp,
    providerResponseTimestamp: null,
    timestamps,
    revision,
    servedFromCache: false,
    isAdjusted: false,
    coverageClaim: 'ACCESS_PENDING_UNVERIFIED',
  });

  return dhanOk({
    candles,
    requestedFromDate: params.fromDate,
    requestedToDate: params.toDate,
    returnedCandleCount: candles.length, // 0 is a valid empty result, never a failure
    coverageClaim: 'ACCESS_PENDING_UNVERIFIED',
    provenance,
    ...(params.tradingCalendar && interval === '1D' ? { dailyFreshness: candles.map(c => {
      const observationDate = istDate(Date.parse(c.candleStart));
      const assessment = evaluateFreshness(c.candleStart, 'D02_OHLCV', params.evaluationTime ?? '', {
        kind: 'DAILY_CLOSE', calendar: params.tradingCalendar!, exchange: mapping.exchange,
        observationDate, completed: !!params.evaluationTime && Number.isFinite(Date.parse(params.evaluationTime)) && observationDate < istDate(Date.parse(params.evaluationTime)),
      });
      return { ...assessment, ageSeconds: Number.isFinite(assessment.ageSeconds) ? assessment.ageSeconds : null };
    }) } : {}),
  });
}

/**
 * Historical read boundary: request validation → instrument resolution → client call →
 * DTO validation → canonical D02 normalization. Deterministic and fail-closed throughout.
 */
export class DhanHistoricalAdapter {
  private readonly tradingCalendar?: TradingCalendar;
  private readonly client: DhanApiClient;
  private readonly registry: DhanInstrumentRegistry;

  constructor(options: { client: DhanApiClient; instrumentRegistry: DhanInstrumentRegistry; tradingCalendar?: TradingCalendar }) {
    this.tradingCalendar = options.tradingCalendar ? parseTradingCalendar(options.tradingCalendar) : undefined;
    this.client = options.client;
    this.registry = options.instrumentRegistry;
  }

  public async fetchDailyCandles(
    request: DhanHistoricalRequest,
    options?: { priorContentDigest?: string | null }
  ): Promise<DhanResult<DhanHistoricalNormalizationResult>> {
    const range = validateDhanHistoricalRequest(request);
    if (!range.ok) return range;

    const resolution = request.exchangeSegment
      ? request.isin
        ? this.registry.resolveSecurity(request.companyId, request.exchangeSegment, request.isin)
        : this.registry.resolveListing(request.companyId, request.exchangeSegment)
      : this.registry.resolve(request.companyId);
    if (resolution.status === 'UNRESOLVED') {
      return dhanFailure('UNRESOLVED_INSTRUMENT', `${resolution.reason}: ${resolution.details}`, {
        field: 'companyId',
      });
    }
    const mapping = resolution.mapping;

    const call = await this.client.executeJsonPost(
      DHAN_HISTORICAL_PATH,
      buildDhanHistoricalRequestBody({
        dhanSecurityId: mapping.dhanSecurityId,
        exchangeSegment: mapping.exchangeSegment,
        interval: request.interval,
        fromDate: range.value.fromDate,
        toDate: range.value.toDate,
      }),
      { deferSuccessRecording: true }
    );
    if (!call.ok) return call;

    const latencyMs = call.value.metrics.latencyMs;
    const at = this.client.nowIso();

    const parsed = parseDhanHistoricalResponse(call.value.json);
    if (!parsed.ok) {
      this.client.getStateRecorder().recordFailure({
        category: parsed.failure.code,
        at,
        latencyMs,
      });
      return { ok: false, failure: { ...parsed.failure, httpStatus: call.value.metrics.httpStatus } };
    }

    const normalized = normalizeDhanHistoricalToCandles({
      tradingCalendar: this.tradingCalendar,
      evaluationTime: at,
      dto: parsed.value,
      mapping,
      interval: request.interval,
      fromDate: range.value.fromDate,
      toDate: range.value.toDate,
      // W-19: the response was received at `at` (captured immediately after the
      // transport call); this is the retrieval instant, not a publication instant.
      retrievalTimestamp: at,
      priorContentDigest: options?.priorContentDigest ?? null,
    });
    if (!normalized.ok) {
      this.client.getStateRecorder().recordFailure({
        category: normalized.failure.code,
        at,
        latencyMs,
      });
      return normalized;
    }

    this.client.getStateRecorder().recordSuccess({ at, latencyMs });
    return normalized;
  }
}
