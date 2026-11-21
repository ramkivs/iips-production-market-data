/**
 * Institutional Investment Platform System (IIPS)
 * Domain D01: Market Quotes & Prices Canonical Contract
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 * Plus decision D-5 (bid/ask representation and validation), approved
 * 2026-11-21 — see docs/integration/
 * D-5-BID-ASK-REPRESENTATION-AND-VALIDATION-DECISION-2026-11-21.md
 */

import { ValidationResult, ValidationIssue } from './types.js';
import type { D114SecurityIdentity } from './types.js';

/**
 * D01 schema version.
 *
 * D-5 (approved 2026-11-21) made unavailable bid/ask an explicit `null`,
 * which is a breaking change to the payload type, so D01 moves to 2.0.0.
 * The shared canonical envelope version stays 1.0.0 and is deliberately
 * NOT bumped by this constant.
 */
export const D01_SCHEMA_VERSION = '2.0.0';

export interface MarketQuotePayload {
  companyId: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  currency: 'INR' | 'USD';
  /**
   * Best bid, or `null` when no bid is available.
   *
   * D-5: a missing side is `null`, never `0`. Availability is independent
   * per side. A supplied value must be a finite, strictly positive number.
   */
  bid: number | null;
  /**
   * Best ask, or `null` when no ask is available.
   *
   * D-5: a missing side is `null`, never `0`. Availability is independent
   * per side. A supplied value must be a finite, strictly positive number.
   */
  ask: number | null;
  ltp: number; // Last Traded Price
  open: number;
  high: number;
  low: number;
  close?: number;
  previousClose: number;
  volume: number; // Integer shares
  vwap?: number;
  turnover?: number;
  change: number;
  pctChange: number;
  tradeCount?: number;
  /** Optional series-aware D114 identity; companyId remains distinct. */
  securityIdentity?: D114SecurityIdentity;
}

/**
 * Validates one bid/ask side under D-5.
 *
 * `null` means "unavailable" and is valid. Anything else must be a finite,
 * strictly positive number. Zero is rejected: under D-5 zero is not a market
 * price and must never stand in for missing data.
 */
function validateBidAskSide(
  payload: MarketQuotePayload,
  side: 'bid' | 'ask',
  errors: ValidationIssue[],
  anomalyCodes: string[],
): void {
  const value: unknown = payload[side];

  if (value === null) return; // unavailable — valid, and never coerced to 0

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    errors.push({
      field: side,
      code: 'INVALID_TYPE',
      message: `${side} must be a finite number or null (got ${describeValue(value)})`,
      severity: 'CRITICAL',
    });
    anomalyCodes.push('INVALID_TYPE');
    return;
  }

  if (value <= 0) {
    errors.push({
      field: side,
      code: 'OUT_OF_RANGE_VALUE',
      message: `${side} must be strictly positive when supplied (got ${value}); use null for unavailable`,
      severity: 'CRITICAL',
    });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }
}

/** Short, safe rendering of an invalid value for an error message. */
function describeValue(value: unknown): string {
  if (typeof value === 'number') return String(value);
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `a string ${JSON.stringify(value)}`;
  return typeof value;
}

export function validateMarketQuotePayload(payload: MarketQuotePayload): ValidationResult {
  const errors: ValidationIssue[] = [];
  const anomalyCodes: string[] = [];

  if (!payload.companyId) {
    errors.push({ field: 'companyId', code: 'MISSING_MANDATORY_FIELD', message: 'companyId is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }
  if (!payload.symbol) {
    errors.push({ field: 'symbol', code: 'MISSING_MANDATORY_FIELD', message: 'symbol is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }
  if (!['NSE', 'BSE'].includes(payload.exchange)) {
    errors.push({ field: 'exchange', code: 'UNRECOGNIZED_ENUM_OR_CODE', message: `Invalid exchange: ${payload.exchange}`, severity: 'CRITICAL' });
    anomalyCodes.push('UNRECOGNIZED_ENUM_OR_CODE');
  }
  if (!['INR', 'USD'].includes(payload.currency)) {
    errors.push({ field: 'currency', code: 'CURRENCY_MISMATCH', message: `Invalid currency: ${payload.currency}`, severity: 'CRITICAL' });
    anomalyCodes.push('CURRENCY_MISMATCH');
  }

  // Price non-negativity
  if (typeof payload.ltp !== 'number' || payload.ltp <= 0) {
    errors.push({ field: 'ltp', code: 'OUT_OF_RANGE_VALUE', message: 'ltp must be positive', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }
  if (typeof payload.open !== 'number' || payload.open <= 0) {
    errors.push({ field: 'open', code: 'OUT_OF_RANGE_VALUE', message: 'open must be positive', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }
  if (typeof payload.high !== 'number' || payload.high <= 0) {
    errors.push({ field: 'high', code: 'OUT_OF_RANGE_VALUE', message: 'high must be positive', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }
  if (typeof payload.low !== 'number' || payload.low <= 0) {
    errors.push({ field: 'low', code: 'OUT_OF_RANGE_VALUE', message: 'low must be positive', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }
  if (typeof payload.volume !== 'number' || payload.volume < 0 || !Number.isInteger(payload.volume)) {
    errors.push({ field: 'volume', code: 'OUT_OF_RANGE_VALUE', message: 'volume must be a non-negative integer', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }

  // Cross-field logic: High >= Low, Ask >= Bid.
  //
  // D-5 (approved 2026-11-21): bid/ask are validated strictly, and a side may
  // legitimately be `null` (unavailable) without invalidating the quote. A
  // supplied side must be a finite, strictly positive number — zero and
  // negative values are rejected, and no sentinel is accepted as "missing".
  validateBidAskSide(payload, 'bid', errors, anomalyCodes);
  validateBidAskSide(payload, 'ask', errors, anomalyCodes);

  if (payload.high < payload.low) {
    errors.push({ field: 'high/low', code: 'CONTRADICTORY_CROSS_FIELD', message: `High (${payload.high}) cannot be lower than Low (${payload.low})`, severity: 'CRITICAL' });
    anomalyCodes.push('CONTRADICTORY_CROSS_FIELD');
  }
  // Ordering is only meaningful when BOTH sides are supplied. A null side means
  // "unavailable", which cannot contradict the other side.
  if (typeof payload.bid === 'number' && typeof payload.ask === 'number'
      && Number.isFinite(payload.bid) && Number.isFinite(payload.ask)
      && payload.ask < payload.bid) {
    errors.push({ field: 'bid/ask', code: 'CONTRADICTORY_CROSS_FIELD', message: `Ask (${payload.ask}) cannot be lower than Bid (${payload.bid})`, severity: 'CRITICAL' });
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
