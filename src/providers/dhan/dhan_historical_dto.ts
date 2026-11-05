/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Historical Vendor DTO Boundary & Request Model (DHAN-D2)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / NFR-06
 * Gate: DHAN-D2 INTEGRATION & QUALIFICATION HARNESS
 * Mode: PRE_ACCESS / SYNTHETIC / OFFLINE
 *
 * ACCESS-PENDING NOTICE:
 *  No live historical request has been made. Actual Dhan historical coverage (instrument
 *  breadth, earliest available date, adjustment policy) is UNKNOWN and is explicitly NOT
 *  claimed anywhere in this gate. The vendor shape below follows published documentation
 *  (columnar arrays) and remains PROVISIONAL until real access is granted.
 */

import { DhanResult, dhanFailure, dhanOk } from './dhan_failures.js';

/** Historical intervals the pre-access foundation is prepared for. */
export type DhanHistoricalInterval = 'DAY';

export const DHAN_SUPPORTED_HISTORICAL_INTERVALS: readonly DhanHistoricalInterval[] = ['DAY'];

export const DHAN_HISTORICAL_PATH = '/charts/historical';

/** Maximum window accepted per request by this boundary (deterministic guard, not a vendor claim). */
export const DHAN_MAX_HISTORICAL_WINDOW_DAYS = 365 * 5;

export interface DhanHistoricalRequest {
  /** IIPS canonical company identifier; provider ids are resolved internally. */
  companyId: string;
  interval: DhanHistoricalInterval;
  /** Inclusive start date, ISO calendar date (YYYY-MM-DD). */
  fromDate: string;
  /** Inclusive end date, ISO calendar date (YYYY-MM-DD). */
  toDate: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface DhanNormalizedDateRange {
  fromDate: string;
  toDate: string;
  spanDays: number;
}

/** Validates the request/date-range model. Fails closed on any ambiguity. */
export function validateDhanHistoricalRequest(
  request: DhanHistoricalRequest
): DhanResult<DhanNormalizedDateRange> {
  if (!request || typeof request !== 'object') {
    return dhanFailure('MALFORMED_RESPONSE', 'Historical request must be an object');
  }
  if (!request.companyId || !request.companyId.trim()) {
    return dhanFailure('MISSING_REQUIRED_FIELD', 'Historical request requires a companyId', {
      field: 'companyId',
    });
  }
  if (!DHAN_SUPPORTED_HISTORICAL_INTERVALS.includes(request.interval)) {
    return dhanFailure('UNSUPPORTED_INTERVAL', `Unsupported historical interval: ${String(request.interval)}`, {
      field: 'interval',
    });
  }
  if (!ISO_DATE.test(request.fromDate || '') || !ISO_DATE.test(request.toDate || '')) {
    return dhanFailure('INVALID_DATE_RANGE', 'fromDate and toDate must be ISO calendar dates (YYYY-MM-DD)', {
      field: 'fromDate/toDate',
    });
  }

  const fromMs = Date.parse(`${request.fromDate}T00:00:00.000Z`);
  const toMs = Date.parse(`${request.toDate}T00:00:00.000Z`);
  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
    return dhanFailure('INVALID_DATE_RANGE', 'fromDate/toDate are not parseable calendar dates', {
      field: 'fromDate/toDate',
    });
  }
  if (fromMs > toMs) {
    return dhanFailure('INVALID_DATE_RANGE', 'fromDate must not be after toDate', { field: 'fromDate' });
  }

  const spanDays = Math.round((toMs - fromMs) / 86400000) + 1;
  if (spanDays > DHAN_MAX_HISTORICAL_WINDOW_DAYS) {
    return dhanFailure(
      'INVALID_DATE_RANGE',
      `Requested window of ${spanDays} days exceeds the configured per-request maximum of ${DHAN_MAX_HISTORICAL_WINDOW_DAYS} days`,
      { field: 'fromDate/toDate' }
    );
  }

  return dhanOk({ fromDate: request.fromDate, toDate: request.toDate, spanDays });
}

/** Columnar historical payload as published by the vendor (PROVISIONAL shape). */
export interface DhanHistoricalResponseDto {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  timestamp: number[];
}

const SERIES_KEYS = ['open', 'high', 'low', 'close', 'volume', 'timestamp'] as const;

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'number' && Number.isFinite(v));
}

/**
 * Structurally validates the columnar historical response.
 * Ragged, non-numeric or empty series all fail closed.
 */
export function parseDhanHistoricalResponse(raw: unknown): DhanResult<DhanHistoricalResponseDto> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return dhanFailure('MALFORMED_RESPONSE', 'Dhan historical response payload is not a JSON object');
  }

  const obj = raw as Record<string, unknown>;

  for (const key of SERIES_KEYS) {
    if (obj[key] === undefined || obj[key] === null) {
      return dhanFailure('MISSING_REQUIRED_FIELD', `Dhan historical response is missing series: ${key}`, {
        field: key,
      });
    }
    if (!isNumberArray(obj[key])) {
      return dhanFailure('MALFORMED_RESPONSE', `Dhan historical series '${key}' must be an array of finite numbers`, {
        field: key,
      });
    }
  }

  const lengths = SERIES_KEYS.map((k) => (obj[k] as number[]).length);
  const expected = lengths[0];
  if (lengths.some((l) => l !== expected)) {
    return dhanFailure('MALFORMED_RESPONSE', 'Dhan historical series lengths are inconsistent (ragged payload)', {
      field: 'series',
    });
  }
  if (expected === 0) {
    return dhanFailure('EMPTY_HISTORICAL_SERIES', 'Dhan historical response contains zero candles', {
      field: 'series',
    });
  }

  return dhanOk(obj as unknown as DhanHistoricalResponseDto);
}

/** Builds the vendor request body. Contains no credential material. */
export function buildDhanHistoricalRequestBody(params: {
  dhanSecurityId: string;
  exchangeSegment: string;
  fromDate: string;
  toDate: string;
}): string {
  return JSON.stringify({
    securityId: params.dhanSecurityId,
    exchangeSegment: params.exchangeSegment,
    instrument: 'EQUITY',
    fromDate: params.fromDate,
    toDate: params.toDate,
  });
}
