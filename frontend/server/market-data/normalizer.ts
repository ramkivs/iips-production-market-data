/**
 * Quality validation, OHLC sanity checking, and normalization into Canonical Equity EOD Records.
 */

import type { CanonicalEquityEodRecord, QuarantinedRecord } from './canonical-contract';
import { isEligibleEquity, type RawUdiffRecord } from './cm-udiff-parser';

export interface ValidationSuccess {
  readonly valid: true;
  readonly record: CanonicalEquityEodRecord;
}

export interface ValidationFailure {
  readonly valid: false;
  readonly quarantine: QuarantinedRecord;
}

export type RecordValidationResult = ValidationSuccess | ValidationFailure;

function parseNumeric(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? val : Number(String(val).replace(/,/g, '').trim());
  return Number.isFinite(num) ? num : null;
}

/**
 * Validates and normalizes an eligible raw CM-UDiFF record into a CanonicalEquityEodRecord.
 * Rejects or quarantines impossible OHLC relationships, missing fields, or malformed values.
 */
export function validateAndNormalizeRecord(
  raw: RawUdiffRecord,
  sourceFile: string,
  sourceIdentifier: string = 'NSE_CM_UDIFF'
): RecordValidationResult {
  const timestamp = new Date().toISOString();

  // 1. Mandatory Identity Fields
  const symbol = String(raw.TckrSymb || '').trim().toUpperCase();
  const isin = String(raw.ISIN || '').trim().toUpperCase();
  const tradeDate = String(raw.TradDt || raw.BizDt || '').trim();
  const series = String(raw.SctySrs || 'EQ').trim().toUpperCase();
  const securityName = String(raw.FinInstrmNm || raw.TckrSymb || '').trim();

  if (!symbol || !isin || !tradeDate) {
    return {
      valid: false,
      quarantine: {
        rawRecord: raw,
        reason: 'Missing mandatory identity field (TckrSymb, ISIN, or TradDt)',
        rule: 'IDENTITY_COMPLETENESS',
        timestamp,
      },
    };
  }

  // 2. Date format check (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tradeDate)) {
    return {
      valid: false,
      quarantine: {
        rawRecord: raw,
        reason: `Malformed trade date '${tradeDate}'. Expected YYYY-MM-DD`,
        rule: 'DATE_FORMAT',
        timestamp,
      },
    };
  }

  // 3. Numeric conversions
  const open = parseNumeric(raw.OpnPric);
  const high = parseNumeric(raw.HghPric);
  const low = parseNumeric(raw.LwPric);
  const close = parseNumeric(raw.ClsPric);
  const lastPrice = parseNumeric(raw.LastPric) ?? close;
  const previousClose = parseNumeric(raw.PrvsClsgPric) ?? open;
  const volume = parseNumeric(raw.TtlTradgVol);
  const tradedValue = parseNumeric(raw.TtlTrfVal) ?? 0;
  const transactionCount = parseNumeric(raw.TtlNbOfTxsExctd);

  if (
    open === null ||
    high === null ||
    low === null ||
    close === null ||
    lastPrice === null ||
    previousClose === null ||
    volume === null
  ) {
    return {
      valid: false,
      quarantine: {
        rawRecord: raw,
        reason: 'Missing or non-numeric OHLCV price/volume fields',
        rule: 'NUMERIC_INTEGRITY',
        timestamp,
      },
    };
  }

  // 4. Positive price checks (Equities cannot trade at <= 0)
  if (open <= 0 || high <= 0 || low <= 0 || close <= 0 || lastPrice <= 0 || previousClose <= 0) {
    return {
      valid: false,
      quarantine: {
        rawRecord: raw,
        reason: 'Non-positive equity price detected (prices must be > 0)',
        rule: 'POSITIVE_PRICE',
        timestamp,
      },
    };
  }

  if (volume < 0 || tradedValue < 0) {
    return {
      valid: false,
      quarantine: {
        rawRecord: raw,
        reason: 'Negative volume or traded value detected',
        rule: 'POSITIVE_VOLUME',
        timestamp,
      },
    };
  }

  // 5. Impossible OHLC relationships:
  // High must be >= Low, High >= Open, High >= Close
  // Low must be <= Open, Low <= Close
  if (high < low || high < open || high < close || low > open || low > close) {
    return {
      valid: false,
      quarantine: {
        rawRecord: raw,
        reason: `Impossible OHLC relationship: Open=${open}, High=${high}, Low=${low}, Close=${close}`,
        rule: 'OHLC_SANITY',
        timestamp,
      },
    };
  }

  const canonical: CanonicalEquityEodRecord = Object.freeze({
    tradeDate,
    exchange: 'NSE',
    isin,
    symbol,
    securityName,
    securitySeries: series,
    open,
    high,
    low,
    close,
    lastPrice,
    previousClose,
    volume,
    tradedValue,
    transactionCount,
    sourceIdentifier,
    sourceFile,
    sourceTimestamp: String(raw.BizDt || tradeDate),
    ingestionTimestamp: timestamp,
    quality: 'good',
  });

  return {
    valid: true,
    record: canonical,
  };
}
