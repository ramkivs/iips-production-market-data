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
  | 'CERTIFIED_ENGINE'
  /**
   * No evidence-backed source / record-origin classification is asserted (PA decision
   * IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-PROGRAM-AUTHORITY-DECISION-2026-10-19-01, C1/C2).
   * Emitted where record-specific, independently verifiable origin evidence is absent,
   * e.g. every governed D05 Security Master record. It is NOT a synonym for synthetic.
   */
  | 'UNCLASSIFIED';

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

/* ------------------------------------------------------------------ *
 * D114 series-aware security identity
 *
 * This is market-data identity, not company, tenant, owner or human identity.
 * Structural ISIN validation identifies a record; it does not certify issuer
 * truth, eligibility or entitlement.
 * ------------------------------------------------------------------ */

export const D114_SECURITY_ID_PREFIX = 'ISIN' as const;
export const D114_ISIN_AUTHORITY = 'NON_AUTHORITATIVE' as const;
export const D114_ISIN_LENGTH = 12;
export const D114_ISIN_PATTERN = /^[A-Za-z0-9]{12}$/;

export type D114IsinAuthority = typeof D114_ISIN_AUTHORITY;

export interface D114SecurityIdentity {
  readonly securityId: string;
  readonly isin: string;
  readonly series: string;
  readonly isinAuthority: D114IsinAuthority;
}

/** Validates the exact canonical `ISIN:<isin>:<series>` grammar. */
export function isD114SecurityId(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const segments = value.split(':');
  if (segments.length !== 3) return false;
  const [prefix, isin, series] = segments as [string, string, string];
  return (
    prefix === D114_SECURITY_ID_PREFIX &&
    isin.length === D114_ISIN_LENGTH &&
    D114_ISIN_PATTERN.test(isin) &&
    series.length > 0 &&
    series === series.trim()
  );
}

/**
 * Builds an identity only from explicit source values. Missing or malformed
 * input returns null; no series is inferred and no companyId is consulted.
 */
export function buildD114SecurityIdentity(
  isin: unknown,
  series: unknown,
): D114SecurityIdentity | null {
  if (typeof isin !== 'string' || typeof series !== 'string') return null;
  const normalizedIsin = isin.trim();
  const normalizedSeries = series.trim();
  const securityId = `${D114_SECURITY_ID_PREFIX}:${normalizedIsin}:${normalizedSeries}`;
  if (!isD114SecurityId(securityId)) return null;
  return Object.freeze({
    securityId,
    isin: normalizedIsin,
    series: normalizedSeries,
    isinAuthority: D114_ISIN_AUTHORITY,
  });
}

/** Validates both the identity components and their canonical reconstruction. */
export function isD114SecurityIdentity(value: unknown): value is D114SecurityIdentity {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.isinAuthority !== D114_ISIN_AUTHORITY) return false;
  if (typeof candidate.securityId !== 'string' || !isD114SecurityId(candidate.securityId)) {
    return false;
  }
  const rebuilt = buildD114SecurityIdentity(candidate.isin, candidate.series);
  return rebuilt !== null && rebuilt.securityId === candidate.securityId;
}
