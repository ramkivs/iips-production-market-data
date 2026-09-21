/**
 * Institutional Investment Platform System (IIPS)
 * Canonical Domain Types & Contract Definitions (P01)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

export type OperatingMode = 'LIVE' | 'SNAPSHOT' | 'PIT';

export type QualityState = 'GOOD' | 'STALE' | 'PARTIAL' | 'UNAVAILABLE';

export const QUALITY_HIERARCHY: Record<QualityState, number> = {
  GOOD: 1,
  STALE: 2,
  PARTIAL: 3,
  UNAVAILABLE: 4,
};

export type SourceClassification =
  | 'CANONICAL_MARKET_DATA'
  | 'REAL'
  | 'DERIVED'
  | 'CERTIFIED_ENGINE';

export type VendorTier =
  | 'TIER_1_EXCHANGE'
  | 'TIER_2_COMMERCIAL'
  | 'OFFLINE_BOOTSTRAP'
  | 'MOCK_FIXTURE';

export type DataDomain =
  | 'D01_QUOTES'
  | 'D02_OHLCV'
  | 'D03_FUNDAMENTALS'
  | 'D04_CORPORATE_ACTIONS'
  | 'D05_SECURITY_MASTER'
  | 'D06_NEWS'
  | 'D07_ESTIMATES'
  | 'D08_MACRO'
  | 'D09_ALTDATA';

export type CurrencyCode = 'INR' | 'USD';

export interface ValidationIssue {
  field: string;
  code: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING';
}

export interface ValidationResult {
  isValid: boolean;
  quality: QualityState;
  errors: ValidationIssue[];
  anomalyCodes: string[];
}
