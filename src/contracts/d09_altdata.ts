/**
 * Institutional Investment Platform System (IIPS)
 * Domain D09: Alternative Data Canonical Contract
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { ValidationResult, ValidationIssue } from './types.js';

export interface AlternativeDataPayload {
  companyId?: string;
  datasetName: string;
  signalType: string;
  observedAt: string; // ISO-8601 UTC
  value: number;
  unit: string;
  confidenceScore: number; // 0.0 to 1.0
  coverage: string;
}

export function validateAlternativeData(payload: AlternativeDataPayload): ValidationResult {
  const errors: ValidationIssue[] = [];
  const anomalyCodes: string[] = [];

  if (!payload.datasetName) {
    errors.push({ field: 'datasetName', code: 'MISSING_MANDATORY_FIELD', message: 'datasetName is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }
  if (!payload.signalType) {
    errors.push({ field: 'signalType', code: 'MISSING_MANDATORY_FIELD', message: 'signalType is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }
  if (isNaN(Date.parse(payload.observedAt))) {
    errors.push({ field: 'observedAt', code: 'STRUCTURAL_MALFORMATION', message: 'observedAt must be valid ISO-8601', severity: 'CRITICAL' });
    anomalyCodes.push('STRUCTURAL_MALFORMATION');
  }
  if (payload.confidenceScore < 0.0 || payload.confidenceScore > 1.0) {
    errors.push({ field: 'confidenceScore', code: 'OUT_OF_RANGE_VALUE', message: 'confidenceScore must be between 0.0 and 1.0', severity: 'CRITICAL' });
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
