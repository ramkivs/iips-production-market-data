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
  parseDhanHistoricalResponse,
  validateDhanHistoricalRequest,
} from './dhan_historical_dto.js';

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
  fromDate: string;
  toDate: string;
}): DhanResult<DhanHistoricalNormalizationResult> {
  const { dto, mapping } = params;
  const candles: OHLCVCandle[] = [];

  for (let i = 0; i < dto.timestamp.length; i++) {
    const epochSeconds = dto.timestamp[i];
    if (!Number.isFinite(epochSeconds) || epochSeconds <= 0) {
      return dhanFailure('MALFORMED_RESPONSE', `Historical timestamp at index ${i} is not a valid epoch`, {
        field: `timestamp[${i}]`,
      });
    }

    const startMs = Math.trunc(epochSeconds) * 1000;
    const candleStart = new Date(startMs).toISOString();
    const candleEnd = new Date(startMs + 86400000).toISOString();

    const candle: OHLCVCandle = {
      companyId: mapping.companyId,
      symbol: mapping.symbol,
      interval: '1d',
      candleStart,
      candleEnd,
      open: dto.open[i],
      high: dto.high[i],
      low: dto.low[i],
      close: dto.close[i],
      volume: dto.volume[i],
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
    returnedCandleCount: candles.length,
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

    const resolution = this.registry.resolve(request.companyId);
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
      fromDate: range.value.fromDate,
      toDate: range.value.toDate,
    });
  }
}
