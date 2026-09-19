/**
 * Institutional Investment Platform System (IIPS)
 * Domain D07: Analyst Estimates Canonical Contract
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { ValidationResult, ValidationIssue } from './types.js';

export type EstimateMetric = 'REVENUE' | 'EBITDA' | 'EPS' | 'PAT' | 'TARGET_PRICE';

export interface AnalystEstimatePayload {
  companyId: string;
  metric: EstimateMetric;
  targetPeriod: string; // e.g. FY2026, Q2FY2027
  consensusMean: number;
  consensusMedian?: number;
  highEstimate: number;
  lowEstimate: number;
  analystCount: number;
  currency: 'INR' | 'USD';
  asOfDate: string; // ISO-8601 UTC date
}

export function validateAnalystEstimate(payload: AnalystEstimatePayload): ValidationResult {
  const errors: ValidationIssue[] = [];
  const anomalyCodes: string[] = [];

  if (!payload.companyId) {
    errors.push({ field: 'companyId', code: 'MISSING_MANDATORY_FIELD', message: 'companyId is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }
  if (!payload.targetPeriod) {
    errors.push({ field: 'targetPeriod', code: 'MISSING_MANDATORY_FIELD', message: 'targetPeriod is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }
  if (payload.analystCount < 1 || !Number.isInteger(payload.analystCount)) {
    errors.push({ field: 'analystCount', code: 'OUT_OF_RANGE_VALUE', message: 'analystCount must be a positive integer', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }
  if (payload.highEstimate < payload.lowEstimate) {
    errors.push({ field: 'high/low', code: 'CONTRADICTORY_CROSS_FIELD', message: 'highEstimate cannot be lower than lowEstimate', severity: 'CRITICAL' });
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
