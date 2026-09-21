/**
 * Institutional Investment Platform System (IIPS)
 * Domain D02: Historical OHLCV Canonical Contract
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import {
  D114SecurityIdentity,
  ValidationResult,
  ValidationIssue,
  isD114SecurityIdentity,
} from './types.js';

export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '1d' | '1w' | '1M';

export interface OHLCVCandle {
  companyId: string;
  symbol: string;
  securityIdentity: D114SecurityIdentity;
  interval: CandleInterval;
  candleStart: string; // ISO-8601 UTC
  candleEnd: string;   // ISO-8601 UTC
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;      // Integer shares
  vwap?: number;
  tradeCount?: number;
  isAdjusted: boolean;
}

export function validateOHLCVCandle(candle: OHLCVCandle): ValidationResult {
  const errors: ValidationIssue[] = [];
  const anomalyCodes: string[] = [];

  if (!candle.companyId) {
    errors.push({ field: 'companyId', code: 'MISSING_MANDATORY_FIELD', message: 'companyId is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }
  if (!candle.symbol) {
    errors.push({ field: 'symbol', code: 'MISSING_MANDATORY_FIELD', message: 'symbol is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }
  if (!isD114SecurityIdentity(candle.securityIdentity)) {
    errors.push({
      field: 'securityIdentity',
      code: 'INVALID_SECURITY_IDENTITY',
      message: 'securityIdentity requires a series-aware namespaced ISIN key, non-authoritative raw ISIN, and SERIES',
      severity: 'CRITICAL',
    });
    anomalyCodes.push('INVALID_SECURITY_IDENTITY');
  }

  const startMs = Date.parse(candle.candleStart);
  const endMs = Date.parse(candle.candleEnd);
  if (isNaN(startMs) || isNaN(endMs) || startMs >= endMs) {
    errors.push({ field: 'candleStart/candleEnd', code: 'STRUCTURAL_MALFORMATION', message: 'candleStart must be strictly before candleEnd and valid ISO timestamps', severity: 'CRITICAL' });
    anomalyCodes.push('STRUCTURAL_MALFORMATION');
  }

  if (candle.open <= 0 || candle.high <= 0 || candle.low <= 0 || candle.close <= 0) {
    errors.push({ field: 'prices', code: 'OUT_OF_RANGE_VALUE', message: 'OHLC prices must be strictly positive', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }

  if (candle.volume < 0 || !Number.isInteger(candle.volume)) {
    errors.push({ field: 'volume', code: 'OUT_OF_RANGE_VALUE', message: 'volume must be non-negative integer', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }

  if (candle.high < Math.max(candle.open, candle.close, candle.low)) {
    errors.push({ field: 'high', code: 'CONTRADICTORY_CROSS_FIELD', message: 'High must be >= Open, Close, and Low', severity: 'CRITICAL' });
    anomalyCodes.push('CONTRADICTORY_CROSS_FIELD');
  }

  if (candle.low > Math.min(candle.open, candle.close, candle.high)) {
    errors.push({ field: 'low', code: 'CONTRADICTORY_CROSS_FIELD', message: 'Low must be <= Open, Close, and High', severity: 'CRITICAL' });
    anomalyCodes.push('CONTRADICTORY_CROSS_FIELD');
  }

  const isValid = errors.length === 0;
  return {
    isValid,
    quality: isValid ? 'GOOD' : 'UNAVAILABLE',
    errors,
    anomalyCodes,
  };
}
