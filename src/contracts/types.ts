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

// ──────────────────────────────────────────────────────────────────────────
// D114 Series-Aware Security Identity (IU-2)
//
// A D114 security identity is a SERIES-AWARE security identity. It is a
// DISTINCT concept from human/user identity, tenant identity, owner identity,
// the security-master resource key (`companyId`), and D115 identity authority.
// `companyId` is NEVER repurposed or re-derived as the D114 security identity.
//
// Exact, authoritative identity grammar:
//
//     securityId = ISIN:<isin>:<series>
//
// `series` is MANDATORY. `isinAuthority` is NON_AUTHORITATIVE: the ISIN is
// carried exactly as supplied by the exchange feed and is NOT an authority
// assertion about the instrument.
//
// Construction is FAIL-CLOSED. No default series is ever manufactured, no
// series is ever inferred from `companyId`, and distinct series sharing one
// ISIN are never collapsed into a single identity.
// ──────────────────────────────────────────────────────────────────────────

/** Literal prefix of the D114 securityId grammar. */
export const D114_SECURITY_ID_PREFIX = 'ISIN';

/**
 * ISIN authority marker. The exchange-supplied ISIN is NON_AUTHORITATIVE:
 * it identifies, it does not certify.
 */
export const D114_ISIN_AUTHORITY = 'NON_AUTHORITATIVE';

export type D114IsinAuthority = typeof D114_ISIN_AUTHORITY;

/** ISIN structural length (ISO 6166). */
export const D114_ISIN_LENGTH = 12;

/** ISIN structural shape: exactly 12 alphanumeric characters (ISO 6166). */
export const D114_ISIN_PATTERN = /^[A-Za-z0-9]{12}$/;

/**
 * Series-aware D114 security identity.
 *
 * `securityId` is always exactly `ISIN:<isin>:<series>`; the three components
 * are never re-derived from one another, so a BL-series and an EQ-series
 * security sharing an ISIN remain two distinct identities.
 */
export interface D114SecurityIdentity {
  readonly securityId: string;
  readonly isin: string;
  readonly series: string;
  readonly isinAuthority: D114IsinAuthority;
}

/**
 * Builds the D114 series-aware security identity from a raw ISIN and a raw
 * series value.
 *
 * Returns `null` — never a fabricated identity — when the required identity
 * information is malformed or absent, including a missing/blank series.
 *
 * @param isin   raw exchange-supplied ISIN (must be 12 alphanumeric characters)
 * @param series raw exchange-supplied series (must be non-blank)
 */
export function buildD114SecurityIdentity(
  isin: unknown,
  series: unknown,
): D114SecurityIdentity | null {
  if (typeof isin !== 'string' || typeof series !== 'string') {
    return null;
  }

  const normalizedIsin = isin.trim();
  const normalizedSeries = series.trim();

  if (!D114_ISIN_PATTERN.test(normalizedIsin)) {
    return null;
  }
  if (normalizedSeries.length === 0) {
    return null;
  }

  const identity: D114SecurityIdentity = {
    securityId: `${D114_SECURITY_ID_PREFIX}:${normalizedIsin}:${normalizedSeries}`,
    isin: normalizedIsin,
    series: normalizedSeries,
    isinAuthority: D114_ISIN_AUTHORITY,
  };

  return Object.freeze(identity);
}

/**
 * Fail-closed structural validation of a D114 security identity.
 *
 * Verifies the exact grammar `ISIN:<isin>:<series>`, the mandatory series, the
 * NON_AUTHORITATIVE marker, and the ISIN shape. Returns `false` for anything
 * that does not reconstruct exactly.
 */
export function isD114SecurityIdentity(value: unknown): value is D114SecurityIdentity {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.securityId !== 'string') {
    return false;
  }
  if (typeof candidate.isin !== 'string') {
    return false;
  }
  if (typeof candidate.series !== 'string') {
    return false;
  }
  if (candidate.isinAuthority !== D114_ISIN_AUTHORITY) {
    return false;
  }

  const isin = candidate.isin as string;
  const series = candidate.series as string;

  if (!D114_ISIN_PATTERN.test(isin)) {
    return false;
  }
  if (series.length === 0) {
    return false;
  }

  const expectedSecurityId = `${D114_SECURITY_ID_PREFIX}:${isin}:${series}`;
  if (candidate.securityId !== expectedSecurityId) {
    return false;
  }

  return true;
}
