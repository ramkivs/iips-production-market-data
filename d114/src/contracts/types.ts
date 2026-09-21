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

/**
 * Source-level security identity carried by D114's canonical D01/D02 records.
 *
 * The PIT series key is namespaced so an exchange symbol is never promoted to identity. ISIN is
 * retained as the stable source identifier and is explicitly NON_AUTHORITATIVE, as required by
 * the P04 external-identifier contract; this block is not a P04 program-internal IdentityRef and
 * does not invent a canonical-security-master mapping. SERIES remains explicit metadata rather
 * than being discarded during normalization.
 */
export interface D114SecurityIdentity {
  readonly securityId: string;
  readonly isin: string;
  readonly isinAuthority: 'NON_AUTHORITATIVE';
  readonly series: string;
}

/** Construct the one governed source-identity shape used by both D114 archive eras. */
export function buildD114SecurityIdentity(isin: string, series: string): D114SecurityIdentity {
  return {
    securityId: `ISIN:${isin}`,
    isin,
    isinAuthority: 'NON_AUTHORITATIVE',
    series,
  };
}

/** Runtime guard shared by the D01/D02 validators; no coercion or fallback is performed. */
export function isD114SecurityIdentity(value: unknown): value is D114SecurityIdentity {
  if (value === null || typeof value !== 'object') return false;
  const identity = value as Partial<D114SecurityIdentity>;
  return (
    typeof identity.isin === 'string' && identity.isin.length === 12 &&
    identity.isin === identity.isin.trim() &&
    typeof identity.series === 'string' && identity.series.length > 0 &&
    identity.series === identity.series.trim() &&
    identity.isinAuthority === 'NON_AUTHORITATIVE' &&
    identity.securityId === `ISIN:${identity.isin}`
  );
}

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
