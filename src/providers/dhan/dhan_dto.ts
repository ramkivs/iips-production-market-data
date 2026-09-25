/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Vendor DTO Boundary (DHAN-D1)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / NFR-06 (Provider Masking)
 * Gate: DHAN-D1 PRE-ACCESS PROVIDER FOUNDATION
 *
 * SCOPE:
 *  Vendor-shaped structures ONLY. These types are strictly internal to the Dhan
 *  provider package and MUST NOT be exported to or referenced by IIPS consumers.
 *  Consumers only ever observe the existing canonical contract
 *  (CanonicalEnvelope<MarketQuotePayload>).
 *
 * PROVISIONAL SHAPE NOTICE:
 *  Field names below follow Dhan's published market-quote response documentation.
 *  They remain PROVISIONAL until real access is granted and a live response can be
 *  observed under a later gate. No live response has been observed in DHAN-D1.
 */

import { DhanResult, dhanFailure, dhanOk } from './dhan_failures.js';

/** Dhan exchange segment enum, restricted to the cash-equity scope of DHAN-D1. */
export type DhanExchangeSegment = 'NSE_EQ' | 'BSE_EQ';

export interface DhanOhlcDto {
  open: number;
  close: number;
  high: number;
  low: number;
}

export interface DhanDepthLevelDto {
  quantity: number;
  orders: number;
  price: number;
}

export interface DhanDepthDto {
  buy: DhanDepthLevelDto[];
  sell: DhanDepthLevelDto[];
}

/** Single instrument quote block as returned under data[segment][securityId]. */
export interface DhanQuoteDto {
  last_price: number;
  ohlc: DhanOhlcDto;
  volume: number;
  last_trade_time: string;
  average_price?: number;
  net_change?: number;
  buy_quantity?: number;
  sell_quantity?: number;
  last_quantity?: number;
  upper_circuit_limit?: number;
  lower_circuit_limit?: number;
  depth?: DhanDepthDto;
}

export interface DhanMarketQuoteResponseDto {
  status: string;
  data: Record<string, Record<string, DhanQuoteDto>>;
  remarks?: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

const REQUIRED_QUOTE_FIELDS = ['last_price', 'ohlc', 'volume', 'last_trade_time'] as const;
const REQUIRED_OHLC_FIELDS = ['open', 'high', 'low', 'close'] as const;

/**
 * Structurally validates a single Dhan quote block. Fails closed: any missing or
 * wrongly-typed required field produces MISSING_REQUIRED_FIELD / MALFORMED_RESPONSE.
 */
export function parseDhanQuoteBlock(raw: unknown, fieldPrefix: string): DhanResult<DhanQuoteDto> {
  if (!isObject(raw)) {
    return dhanFailure('MALFORMED_RESPONSE', 'Dhan quote block is not an object', { field: fieldPrefix });
  }

  for (const key of REQUIRED_QUOTE_FIELDS) {
    if (raw[key] === undefined || raw[key] === null) {
      return dhanFailure('MISSING_REQUIRED_FIELD', `Required Dhan quote field is absent: ${key}`, {
        field: `${fieldPrefix}.${key}`,
      });
    }
  }

  if (!isFiniteNumber(raw.last_price)) {
    return dhanFailure('MALFORMED_RESPONSE', 'Dhan last_price must be a finite number', {
      field: `${fieldPrefix}.last_price`,
    });
  }

  if (!isFiniteNumber(raw.volume)) {
    return dhanFailure('MALFORMED_RESPONSE', 'Dhan volume must be a finite number', {
      field: `${fieldPrefix}.volume`,
    });
  }

  if (typeof raw.last_trade_time !== 'string' || raw.last_trade_time.trim() === '') {
    return dhanFailure('MALFORMED_RESPONSE', 'Dhan last_trade_time must be a non-empty string', {
      field: `${fieldPrefix}.last_trade_time`,
    });
  }

  if (!isObject(raw.ohlc)) {
    return dhanFailure('MALFORMED_RESPONSE', 'Dhan ohlc block must be an object', {
      field: `${fieldPrefix}.ohlc`,
    });
  }

  for (const key of REQUIRED_OHLC_FIELDS) {
    const value = (raw.ohlc as Record<string, unknown>)[key];
    if (value === undefined || value === null) {
      return dhanFailure('MISSING_REQUIRED_FIELD', `Required Dhan ohlc field is absent: ${key}`, {
        field: `${fieldPrefix}.ohlc.${key}`,
      });
    }
    if (!isFiniteNumber(value)) {
      return dhanFailure('MALFORMED_RESPONSE', `Dhan ohlc.${key} must be a finite number`, {
        field: `${fieldPrefix}.ohlc.${key}`,
      });
    }
  }

  const optionalNumeric: Array<keyof DhanQuoteDto> = [
    'average_price',
    'net_change',
    'buy_quantity',
    'sell_quantity',
    'last_quantity',
    'upper_circuit_limit',
    'lower_circuit_limit',
  ];
  for (const key of optionalNumeric) {
    const value = raw[key as string];
    if (value !== undefined && value !== null && !isFiniteNumber(value)) {
      return dhanFailure('MALFORMED_RESPONSE', `Dhan ${String(key)} must be a finite number when present`, {
        field: `${fieldPrefix}.${String(key)}`,
      });
    }
  }

  return dhanOk(raw as unknown as DhanQuoteDto);
}

/**
 * Structurally validates the Dhan market-quote envelope.
 * Performs no canonicalization: normalization is a separate, explicit stage.
 */
export function parseDhanMarketQuoteResponse(raw: unknown): DhanResult<DhanMarketQuoteResponseDto> {
  if (!isObject(raw)) {
    return dhanFailure('MALFORMED_RESPONSE', 'Dhan response payload is not a JSON object');
  }

  if (typeof raw.status !== 'string' || raw.status.trim() === '') {
    return dhanFailure('MISSING_REQUIRED_FIELD', 'Dhan response is missing the status field', { field: 'status' });
  }

  if (raw.status.toLowerCase() !== 'success') {
    return dhanFailure('PROVIDER_STATUS_FAILURE', `Dhan response reported non-success status: ${raw.status}`, {
      field: 'status',
    });
  }

  if (!isObject(raw.data)) {
    return dhanFailure('MISSING_REQUIRED_FIELD', 'Dhan response is missing the data block', { field: 'data' });
  }

  for (const [segment, segmentBlock] of Object.entries(raw.data)) {
    if (!isObject(segmentBlock)) {
      return dhanFailure('MALFORMED_RESPONSE', `Dhan data segment block must be an object: ${segment}`, {
        field: `data.${segment}`,
      });
    }
    for (const [securityId, quoteBlock] of Object.entries(segmentBlock)) {
      const parsed = parseDhanQuoteBlock(quoteBlock, `data.${segment}.${securityId}`);
      if (!parsed.ok) return parsed;
    }
  }

  return dhanOk(raw as unknown as DhanMarketQuoteResponseDto);
}

/**
 * Extracts one instrument quote from a parsed Dhan response.
 * Absence is explicit (INSTRUMENT_NOT_IN_RESPONSE) and never silently defaulted.
 */
export function selectDhanQuote(
  dto: DhanMarketQuoteResponseDto,
  segment: DhanExchangeSegment,
  securityId: string
): DhanResult<DhanQuoteDto> {
  const segmentBlock = dto.data[segment];
  if (!segmentBlock) {
    return dhanFailure('INSTRUMENT_NOT_IN_RESPONSE', `Dhan response contains no block for segment ${segment}`, {
      field: `data.${segment}`,
    });
  }
  const quote = segmentBlock[securityId];
  if (!quote) {
    return dhanFailure(
      'INSTRUMENT_NOT_IN_RESPONSE',
      `Dhan response contains no quote for the requested instrument in segment ${segment}`,
      { field: `data.${segment}.${securityId}` }
    );
  }
  return dhanOk(quote);
}

/**
 * Parses Dhan's "DD/MM/YYYY HH:mm:ss" trade timestamp (exchange local IST)
 * into a strict ISO-8601 UTC instant. Deterministic and timezone-independent.
 */
export function parseDhanTradeTimeToUtcIso(raw: string): DhanResult<string> {
  const match = raw
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    return dhanFailure('MALFORMED_RESPONSE', 'Dhan last_trade_time is not in DD/MM/YYYY HH:mm:ss form', {
      field: 'last_trade_time',
    });
  }

  const [, dd, mm, yyyy, hh, mi, ss] = match;
  const day = Number.parseInt(dd, 10);
  const month = Number.parseInt(mm, 10);
  const year = Number.parseInt(yyyy, 10);
  const hour = Number.parseInt(hh, 10);
  const minute = Number.parseInt(mi, 10);
  const second = ss ? Number.parseInt(ss, 10) : 0;

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) {
    return dhanFailure('MALFORMED_RESPONSE', 'Dhan last_trade_time contains out-of-range components', {
      field: 'last_trade_time',
    });
  }

  // IST (Asia/Kolkata) is a fixed UTC+05:30 offset with no daylight saving.
  const IST_OFFSET_MINUTES = 330;
  const utcMs = Date.UTC(year, month - 1, day, hour, minute, second) - IST_OFFSET_MINUTES * 60 * 1000;
  const iso = new Date(utcMs).toISOString();
  if (Number.isNaN(Date.parse(iso))) {
    return dhanFailure('MALFORMED_RESPONSE', 'Dhan last_trade_time could not be converted to UTC', {
      field: 'last_trade_time',
    });
  }
  return dhanOk(iso);
}
