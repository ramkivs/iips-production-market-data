/**
 * Institutional Investment Platform System (IIPS)
 * Domain D08: Macroeconomic Data Canonical Contract
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { ValidationResult, ValidationIssue } from './types.js';

export type MacroSeriesId = 'CPI' | 'IIP' | 'GDP' | 'REPO_RATE' | '10Y_GSEC' | 'WPI' | 'TRADE_DEFICIT';
export type MacroFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'DAILY';

export interface MacroDataPayload {
  seriesId: MacroSeriesId;
  seriesName: string;
  vintageDate: string; // ISO-8601 UTC date (when the data became known / published)
  releaseDate: string; // ISO-8601 UTC date
  period: string;      // e.g. "2026-08", "Q1-FY2027"
  value: number;
  unit: string;        // "%", "Index Base 2012=100", "Billion INR", "bps"
  frequency: MacroFrequency;
  sourceAgency: string;// e.g. "MoSPI", "RBI"
}

export function validateMacroData(payload: MacroDataPayload): ValidationResult {
  const errors: ValidationIssue[] = [];
  const anomalyCodes: string[] = [];

  if (!payload.seriesId) {
    errors.push({ field: 'seriesId', code: 'MISSING_MANDATORY_FIELD', message: 'seriesId is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }
  if (isNaN(Date.parse(payload.vintageDate))) {
    errors.push({ field: 'vintageDate', code: 'STRUCTURAL_MALFORMATION', message: 'vintageDate must be valid ISO-8601', severity: 'CRITICAL' });
    anomalyCodes.push('STRUCTURAL_MALFORMATION');
  }
  if (typeof payload.value !== 'number' || isNaN(payload.value)) {
    errors.push({ field: 'value', code: 'OUT_OF_RANGE_VALUE', message: 'value must be a valid number', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }

  const isValid = errors.length === 0;
  return {
    isValid,
    quality: isValid ? 'GOOD' : 'UNAVAILABLE',
    errors,
    anomalyCodes,
  };
}
