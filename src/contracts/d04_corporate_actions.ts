/**
 * Institutional Investment Platform System (IIPS)
 * Domain D04: Corporate Actions Canonical Contract
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { ValidationResult, ValidationIssue } from './types.js';

export type CorporateActionType = 'SPLIT' | 'BONUS' | 'DIVIDEND' | 'RIGHTS' | 'SPINOFF';
export type ActionStatus = 'ANNOUNCED' | 'EFFECTIVE' | 'CANCELLED';

export interface CorporateActionPayload {
  companyId: string;
  actionId: string;
  actionType: CorporateActionType;
  status: ActionStatus;
  exDate: string;     // ISO-8601 UTC date
  recordDate: string; // ISO-8601 UTC date
  ratioNumerator?: number;
  ratioDenominator?: number;
  dividendAmount?: number; // In INR base units per share
  adjustmentFactor: number; // Multiplier for unadjusted historical price
}

export function validateCorporateAction(action: CorporateActionPayload): ValidationResult {
  const errors: ValidationIssue[] = [];
  const anomalyCodes: string[] = [];

  if (!action.companyId) {
    errors.push({ field: 'companyId', code: 'MISSING_MANDATORY_FIELD', message: 'companyId is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }
  if (!action.actionId) {
    errors.push({ field: 'actionId', code: 'MISSING_MANDATORY_FIELD', message: 'actionId is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }
  if (!['SPLIT', 'BONUS', 'DIVIDEND', 'RIGHTS', 'SPINOFF'].includes(action.actionType)) {
    errors.push({ field: 'actionType', code: 'UNRECOGNIZED_ENUM_OR_CODE', message: `Invalid action type: ${action.actionType}`, severity: 'CRITICAL' });
    anomalyCodes.push('UNRECOGNIZED_ENUM_OR_CODE');
  }

  if (typeof action.adjustmentFactor !== 'number' || action.adjustmentFactor <= 0) {
    errors.push({ field: 'adjustmentFactor', code: 'OUT_OF_RANGE_VALUE', message: 'adjustmentFactor must be strictly positive', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }

  if (['SPLIT', 'BONUS'].includes(action.actionType)) {
    if (!action.ratioNumerator || !action.ratioDenominator || action.ratioNumerator <= 0 || action.ratioDenominator <= 0) {
      errors.push({ field: 'ratio', code: 'OUT_OF_RANGE_VALUE', message: 'Split/Bonus requires positive ratioNumerator and ratioDenominator', severity: 'CRITICAL' });
      anomalyCodes.push('OUT_OF_RANGE_VALUE');
    }
  }

  if (action.actionType === 'DIVIDEND') {
    if (action.dividendAmount === undefined || action.dividendAmount <= 0) {
      errors.push({ field: 'dividendAmount', code: 'OUT_OF_RANGE_VALUE', message: 'Dividend requires positive dividendAmount', severity: 'CRITICAL' });
      anomalyCodes.push('OUT_OF_RANGE_VALUE');
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
