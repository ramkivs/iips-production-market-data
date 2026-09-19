/**
 * Institutional Investment Platform System (IIPS)
 * Domain D05: Instrument / Security Master Canonical Contract
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { ValidationResult, ValidationIssue } from './types.js';

export type ListingStatus = 'ACTIVE' | 'SUSPENDED' | 'DELISTED';

export interface ExchangeListingPayload {
  exchange: 'NSE' | 'BSE';
  symbol: string;
  scripCode?: string;
  status: ListingStatus;
  lotSize: number;
  tickSize: number;
}

export interface InstrumentMasterPayload {
  companyId: string;
  isin: string;
  cin?: string;
  nseSymbol?: string;
  bseSymbol?: string;
  bseScripCode?: string;
  companyName: string;
  industry: string;
  sector: string;
  listingStatus: ListingStatus;
  lotSize: number;
  tickSize: number;
  faceValue: number;
  currency: 'INR' | 'USD';
  effectiveFrom: string; // ISO-8601 UTC date
  effectiveTo?: string;   // ISO-8601 UTC date or undefined for active
  listings?: ExchangeListingPayload[];
}

export function validateInstrumentMaster(payload: InstrumentMasterPayload): ValidationResult {
  const errors: ValidationIssue[] = [];
  const anomalyCodes: string[] = [];

  if (!payload.companyId) {
    errors.push({ field: 'companyId', code: 'MISSING_MANDATORY_FIELD', message: 'companyId is required', severity: 'CRITICAL' });
    anomalyCodes.push('MISSING_MANDATORY_FIELD');
  }

  // ISIN format check: 12 alphanumeric characters (standard ISO 6166)
  const isinRegex = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;
  if (!payload.isin || !isinRegex.test(payload.isin)) {
    errors.push({ field: 'isin', code: 'STRUCTURAL_MALFORMATION', message: `Invalid ISIN format: ${payload.isin}`, severity: 'CRITICAL' });
    anomalyCodes.push('STRUCTURAL_MALFORMATION');
  }

  const hasDirectSymbol = Boolean(payload.nseSymbol || payload.bseSymbol);
  const hasListingSymbol = Boolean(payload.listings && payload.listings.some((l) => l.symbol && (l.exchange === 'NSE' || l.exchange === 'BSE')));

  if (!hasDirectSymbol && !hasListingSymbol) {
    errors.push({ field: 'symbols', code: 'IDENTITY_AMBIGUITY', message: 'At least one exchange symbol (NSE or BSE) must be provided directly or in listings', severity: 'CRITICAL' });
    anomalyCodes.push('IDENTITY_AMBIGUITY');
  }

  if (payload.lotSize <= 0 || !Number.isInteger(payload.lotSize)) {
    errors.push({ field: 'lotSize', code: 'OUT_OF_RANGE_VALUE', message: 'lotSize must be a positive integer', severity: 'CRITICAL' });
    anomalyCodes.push('OUT_OF_RANGE_VALUE');
  }

  if (payload.tickSize <= 0) {
    errors.push({ field: 'tickSize', code: 'OUT_OF_RANGE_VALUE', message: 'tickSize must be positive', severity: 'CRITICAL' });
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
