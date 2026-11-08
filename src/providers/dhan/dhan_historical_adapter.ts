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

export interface DhanHistoricalNormalizationResult {
  candles: OHLCVCandle[];
  requestedFromDate: string;
  requestedToDate: string;
  /** Candle count actually returned; never presented as coverage evidence. */
  returnedCandleCount: number;
  coverageClaim: 'ACCESS_PENDING_UNVERIFIED';
}

/**
 * Transforms one columnar vendor payload into validated canonical daily candles.
 * Every candle is validated with the existing D02 validator; a single invalid candle
 * fails the whole batch closed (no partial historical series is emitted).
 */
export function normalizeDhanHistoricalToCandles(params: {
  dto: DhanHistoricalResponseDto;
  mapping: DhanInstrumentMapping;
  interval: DhanHistoricalRequest['interval'];
  fromDate: string;
  toDate: string;
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

  return dhanOk({
    candles,
    requestedFromDate: params.fromDate,
    requestedToDate: params.toDate,
    returnedCandleCount: candles.length, // 0 is a valid empty result, never a failure
    coverageClaim: 'ACCESS_PENDING_UNVERIFIED',
  });
}

/**
 * Historical read boundary: request validation → instrument resolution → client call →
 * DTO validation → canonical D02 normalization. Deterministic and fail-closed throughout.
 */
export class DhanHistoricalAdapter {
  private readonly client: DhanApiClient;
  private readonly registry: DhanInstrumentRegistry;

  constructor(options: { client: DhanApiClient; instrumentRegistry: DhanInstrumentRegistry }) {
    this.client = options.client;
    this.registry = options.instrumentRegistry;
  }

  public async fetchDailyCandles(
    request: DhanHistoricalRequest
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
      })
    );
    if (!call.ok) return call;

    const parsed = parseDhanHistoricalResponse(call.value.json);
    if (!parsed.ok) {
      return { ok: false, failure: { ...parsed.failure, httpStatus: call.value.metrics.httpStatus } };
    }

    return normalizeDhanHistoricalToCandles({
      dto: parsed.value,
      mapping,
      interval: request.interval,
      fromDate: range.value.fromDate,
      toDate: range.value.toDate,
    });
  }
}
