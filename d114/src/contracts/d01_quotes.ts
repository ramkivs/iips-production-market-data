/**
 * Institutional Investment Platform System (IIPS)
 * Domain D01: Market Quotes & Prices Canonical Contract
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import {
  D114SecurityIdentity,
  ValidationResult,
  ValidationIssue,
  isD114SecurityIdentity,
} from './types.js';

export interface MarketQuotePayload {
  companyId: string;
  symbol: string;
  securityIdentity: D114SecurityIdentity;
  exchange: 'NSE' | 'BSE';
  currency: 'INR' | 'USD';
  bid: number;
  ask: number;
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
  if (!isD114SecurityIdentity(payload.securityIdentity)) {
    errors.push({
      field: 'securityIdentity',
      code: 'INVALID_SECURITY_IDENTITY',
      message: 'securityIdentity requires a namespaced ISIN key, non-authoritative ISIN metadata, and SERIES',
      severity: 'CRITICAL',
    });
    anomalyCodes.push('INVALID_SECURITY_IDENTITY');
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

  // Cross-field logic: High >= Low, Ask >= Bid
  if (payload.high < payload.low) {
    errors.push({ field: 'high/low', code: 'CONTRADICTORY_CROSS_FIELD', message: `High (${payload.high}) cannot be lower than Low (${payload.low})`, severity: 'CRITICAL' });
    anomalyCodes.push('CONTRADICTORY_CROSS_FIELD');
  }
  if (payload.ask < payload.bid && payload.bid > 0 && payload.ask > 0) {
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
