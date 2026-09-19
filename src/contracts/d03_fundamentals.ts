/**
 * Institutional Investment Platform System (IIPS)
 * Domain D03: Fundamentals & Financial Statements Canonical Contract
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { ValidationResult, ValidationIssue } from './types.js';

export type StatementType = 'INCOME' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'COMPREHENSIVE';
export type PeriodType = 'ANNUAL' | 'QUARTERLY' | 'TTM';

export interface FundamentalStatementPayload {
  companyId: string;
  cin?: string;
  statementType: StatementType;
  periodType: PeriodType;
  periodStart: string; // ISO-8601 UTC date
  periodEnd: string;   // ISO-8601 UTC date
  filingDate: string;  // ISO-8601 UTC date
  restatementIndex: number; // 0 = original filing, 1+ = restatements
  currency: 'INR' | 'USD';
  revenue: number;     // INR in base units
  operatingProfit?: number;
  ebitda?: number;
  pat?: number;        // Profit After Tax
  eps?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  netWorth?: number;
  operatingCashFlow?: number;
  freeCashFlow?: number;
  isAudited: boolean;
}

export function validateFundamentalStatement(payload: FundamentalStatementPayload): ValidationResult {
  const errors: ValidationIssue[] = [];
  const anomalyCodes: string[] = [];

  if (!payload.companyId) {
    errors.push({ field: 'companyId', code: 'MISSING_MANDATORY_FIELD', message: 'companyId is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }

  const pStart = Date.parse(payload.periodStart);
  const pEnd = Date.parse(payload.periodEnd);
  const fDate = Date.parse(payload.filingDate);

  if (isNaN(pStart) || isNaN(pEnd) || pStart >= pEnd) {
    errors.push({ field: 'periodDates', code: 'STRUCTURAL_MALFORMATION', message: 'periodStart must be strictly before periodEnd', severity: 'CRITICAL' });
    anomalyCodes.push('STRUCTURAL_MALFORMATION');
  }

  if (isNaN(fDate) || fDate < pEnd) {
    errors.push({ field: 'filingDate', code: 'CONTRADICTORY_CROSS_FIELD', message: 'filingDate cannot be before periodEnd', severity: 'CRITICAL' });
    anomalyCodes.push('CONTRADICTORY_CROSS_FIELD');
  }

  if (payload.restatementIndex < 0 || !Number.isInteger(payload.restatementIndex)) {
    errors.push({ field: 'restatementIndex', code: 'OUT_OF_RANGE_VALUE', message: 'restatementIndex must be non-negative integer', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }

  if (payload.revenue < 0) {
    errors.push({ field: 'revenue', code: 'OUT_OF_RANGE_VALUE', message: 'revenue cannot be negative', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }

  // Balance sheet identity check if both assets and liabilities+netWorth are provided
  if (
    payload.totalAssets !== undefined &&
    payload.totalLiabilities !== undefined &&
    payload.netWorth !== undefined
  ) {
    const sum = payload.totalLiabilities + payload.netWorth;
    const diff = Math.abs(payload.totalAssets - sum);
    // Tolerance of 1% or 1000 base units for rounding
    if (diff > Math.max(1000, payload.totalAssets * 0.01)) {
      errors.push({
        field: 'balanceSheetEquation',
        code: 'CONTRADICTORY_CROSS_FIELD',
        message: `Total Assets (${payload.totalAssets}) != Liabilities (${payload.totalLiabilities}) + Net Worth (${payload.netWorth})`,
        severity: 'CRITICAL',
      });
      anomalyCodes.push('CONTRADICTORY_CROSS_FIELD');
    }
  }

  const isValid = errors.length === 0;
  return {
    isValid,
    quality: isValid ? 'GOOD' : 'UNAVAILABLE',
    errors,
    anomalyCodes,
  };
}
