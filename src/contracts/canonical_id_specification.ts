/**
 * Institutional Investment Platform System (IIPS)
 * P01-01 Canonical Identifier Specification — Versioned Contract Module
 *
 * Governing record: P01-WAVE1-EXECUTION-AUTHORITY-DESIGNATION-ACT.md (authority commit 6b7552b…)
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * Reuse declarations (evidence-based; these are NOT reimplementations):
 *  - ISIN structural grammar identical to src/contracts/d05_security_master.ts.
 *  - Normalization semantics identical to src/identity/mapping_store.ts resolveCompanyId
 *    (identifierValue.trim().toUpperCase()).
 *  - Composite-ticker shape identical to src/identity/security_master.ts mapping construction
 *    (NSE:<SYMBOL> | BSE:<SYMBOL> | BSE:<SCRIPCODE>).
 *  - Cross-provider mapping semantics are a NORMATIVE REFERENCE to
 *    src/identity/mapping_store.ts (point-in-time effective-dated, fail-closed quarantine);
 *    this module declares them and does not reimplement them.
 *  - Error-code vocabulary consistent with src/contracts/types.ts
 *    (MISSING_MANDATORY_FIELD / STRUCTURAL_MALFORMATION).
 */

export const CANONICAL_ID_SPECIFICATION_ID = 'P01-01-CANONICAL-ID-SPECIFICATION' as const;

/** MAJOR.MINOR.PATCH — pinned by the P01-01 fixture set; bumping requires a new fixture pin. */
export const CANONICAL_ID_SPECIFICATION_VERSION = '1.0.0' as const;

export type CanonicalIdKind =
  | 'COMPANY_ID'
  | 'PORTFOLIO_ID'
  | 'RESEARCH_ID'
  | 'EVENT_ID'
  | 'ISIN'
  | 'EXCHANGE_SYMBOL'
  | 'COMPOSITE_TICKER';

export type CanonicalIdValidationCode =
  | 'MISSING_MANDATORY_FIELD'
  | 'STRUCTURAL_MALFORMATION';

export interface CanonicalIdValidationResult {
  isValid: boolean;
  kind: CanonicalIdKind;
  value: string;
  code: CanonicalIdValidationCode | null;
  message: string | null;
}

/**
 * Deterministic identifier grammars.
 * Evidence basis:
 *  - COMPANY_ID: governed fixture master + broad-universe dataset convention EQ_<BASE>_IN
 *    (observed base length 3–8; grammar bounded to 3–20 uppercase alphanumeric).
 *  - PORTFOLIO_ID / RESEARCH_ID / EVENT_ID: NEW program definitions (no certified-baseline
 *    precedent). EVENT_ID is modeled on the recorded D06 fixture news-id shape
 *    NEWS-<SYM>-<YYYYMMDD>-<NN> → canonical EVT_<BASE>_<YYYYMMDD>_<SEQ>.
 *  - ISIN: identical to d05 contract regex (structural only; no check-digit verification).
 *  - EXCHANGE_SYMBOL: observed governed symbols (RELIANCE, HDFCBANK, …); 2–20 chars, first a letter.
 *  - COMPOSITE_TICKER: EXCHANGE:SYMBOL or BSE:6-digit scrip code, per security_master construction
 *    (observed governed scrip codes are 6-digit; bound chosen conservatively).
 */
const CANONICAL_ID_GRAMMARS: Readonly<Record<CanonicalIdKind, RegExp>> = Object.freeze({
  COMPANY_ID: /^EQ_[A-Z0-9]{3,20}_IN$/,
  PORTFOLIO_ID: /^PF_[A-Z0-9][A-Z0-9_]{1,30}$/,
  RESEARCH_ID: /^RSRCH_[A-Z0-9][A-Z0-9_-]{0,38}$/,
  EVENT_ID: /^EVT_[A-Z0-9]{2,14}_[0-9]{8}_[0-9]{2,4}$/,
  ISIN: /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/,
  EXCHANGE_SYMBOL: /^[A-Z][A-Z0-9]{1,19}$/,
  COMPOSITE_TICKER: /^(NSE|BSE):([A-Z][A-Z0-9]{1,19}|[0-9]{6})$/,
});

export class CanonicalIdContractError extends Error {
  public readonly kind: CanonicalIdKind;
  public readonly rawValue: string;
  public readonly code: CanonicalIdValidationCode;

  constructor(result: CanonicalIdValidationResult) {
    super(
      `P01-01 canonical ID contract violation for ${result.kind} '${result.value}': ${result.code} (${result.message})`,
    );
    this.name = 'CanonicalIdContractError';
    this.kind = result.kind;
    this.rawValue = result.value;
    this.code = result.code as CanonicalIdValidationCode;
  }
}

/**
 * Deterministic normalization seam — identical semantics to
 * src/identity/mapping_store.ts resolveCompanyId (trim + uppercase).
 * Non-normalized raw values must be validated strictly; normalization is an explicit pre-step.
 */
export function normalizeCanonicalIdValue(value: string): string {
  return value.trim().toUpperCase();
}

export function validateCanonicalId(
  kind: CanonicalIdKind,
  value: string,
): CanonicalIdValidationResult {
  if (value === undefined || value === null || value.length === 0) {
    return {
      isValid: false,
      kind,
      value: value ?? '',
      code: 'MISSING_MANDATORY_FIELD',
      message: `${kind} is required`,
    };
  }
  if (!CANONICAL_ID_GRAMMARS[kind].test(value)) {
    return {
      isValid: false,
      kind,
      value,
      code: 'STRUCTURAL_MALFORMATION',
      message: `Invalid ${kind} grammar: '${value}'`,
    };
  }
  return { isValid: true, kind, value, code: null, message: null };
}

export function parseCanonicalId(kind: CanonicalIdKind, value: string): string {
  const result = validateCanonicalId(kind, value);
  if (!result.isValid) {
    throw new CanonicalIdContractError(result);
  }
  return result.value;
}

export interface CrossProviderMappingSemantics {
  normativeReference: string;
  identifierTypeTaxonomy: ReadonlyArray<string>;
  behavior: string;
  reimplemented: boolean;
}

export interface CanonicalIdSpecificationDescriptor {
  specificationId: string;
  version: string;
  kinds: ReadonlyArray<CanonicalIdKind>;
  grammars: Readonly<Record<CanonicalIdKind, string>>;
  normalization: { operation: string; consistentWith: string };
  crossProviderMappingSemantics: CrossProviderMappingSemantics;
  evidenceBasis: ReadonlyArray<string>;
  recordedLimitations: ReadonlyArray<string>;
}

/**
 * Returns a fresh, frozen, deterministic descriptor of the specification.
 * recordedLimitations is intentionally non-empty: genuinely unresolved / legacy-form
 * boundaries are recorded explicitly rather than silently decided.
 */
export function canonicalIdSpecificationDescriptor(): CanonicalIdSpecificationDescriptor {
  const grammars: Record<CanonicalIdKind, string> = {
    COMPANY_ID: CANONICAL_ID_GRAMMARS.COMPANY_ID.source,
    PORTFOLIO_ID: CANONICAL_ID_GRAMMARS.PORTFOLIO_ID.source,
    RESEARCH_ID: CANONICAL_ID_GRAMMARS.RESEARCH_ID.source,
    EVENT_ID: CANONICAL_ID_GRAMMARS.EVENT_ID.source,
    ISIN: CANONICAL_ID_GRAMMARS.ISIN.source,
    EXCHANGE_SYMBOL: CANONICAL_ID_GRAMMARS.EXCHANGE_SYMBOL.source,
    COMPOSITE_TICKER: CANONICAL_ID_GRAMMARS.COMPOSITE_TICKER.source,
  };
  return Object.freeze({
    specificationId: CANONICAL_ID_SPECIFICATION_ID,
    version: CANONICAL_ID_SPECIFICATION_VERSION,
    kinds: Object.freeze(['COMPANY_ID', 'PORTFOLIO_ID', 'RESEARCH_ID', 'EVENT_ID', 'ISIN', 'EXCHANGE_SYMBOL', 'COMPOSITE_TICKER'] as CanonicalIdKind[]),
    grammars: Object.freeze(grammars),
    normalization: Object.freeze({
      operation: 'TRIM_THEN_UPPERCASE',
      consistentWith: 'src/identity/mapping_store.ts resolveCompanyId (identifierValue.trim().toUpperCase())',
    }),
    crossProviderMappingSemantics: Object.freeze({
      normativeReference: 'src/identity/mapping_store.ts',
      identifierTypeTaxonomy: Object.freeze(['ISIN', 'CIN', 'NSE_SYMBOL', 'BSE_SYMBOL', 'COMPOSITE_TICKER']),
      behavior:
        'Point-in-time effective-dated resolution of any supported identifier type to a COMPANY_ID; fails closed with IdentityAmbiguityError (UNMAPPED_IDENTIFIER / AMBIGUOUS_COLLISION) recorded into the quarantine sink. Semantics are referenced, not reimplemented, by this module.',
      reimplemented: false,
    }),
    evidenceBasis: Object.freeze([
      'GOVERNED_COMPANY_ID_CONVENTION: src/identity/governed_fixture_master.ts and src/identity/d05_broad_universe_data.ts (EQ_<BASE>_IN; observed base length 3–8)',
      'ISIN_GRAMMAR: src/contracts/d05_security_master.ts (identical structural regex; structural-only limitation shared)',
      'COMPOSITE_TICKER_SHAPE: src/identity/security_master.ts mapping construction (NSE:<SYMBOL> | BSE:<SYMBOL> | BSE:<SCRIPCODE>)',
      'NORMALIZATION_SEMANTICS: src/identity/mapping_store.ts resolveCompanyId (trim + uppercase)',
      'EVENT_ID_MODEL: tests/fixtures/d06_fixtures.json (NEWS-INFY-20260918-01 → EVT_<BASE>_<YYYYMMDD>_<SEQ>)',
      'ERROR_CODE_VOCABULARY: src/contracts/types.ts (MISSING_MANDATORY_FIELD / STRUCTURAL_MALFORMATION)',
      'LEGACY_OPAQUE_PORTFOLIO_IDS: tests/bi07_*.test.ts (DEFAULT / DEFAULT_PORTFOLIO)',
    ]),
    recordedLimitations: Object.freeze([
      "Legacy opaque companyId values exist in certified-era fixtures (tests/fixtures/d05_fixtures.json: 'INFY', 'TCS'; tests/fixtures/d06_fixtures.json: 'INFY'). They are recorded, are non-conformant to the canonical COMPANY_ID grammar, and are NOT repaired; the D05 contract validator (src/contracts/d05_security_master.ts) remains authoritative for those payloads as opaque non-empty strings.",
      "Legacy portfolioId forms 'DEFAULT'/'DEFAULT_PORTFOLIO' (tests/bi07_*.test.ts) are recorded as non-conformant legacy evidence; no mapping is invented.",
      "Legacy event-style id 'NEWS-INFY-20260918-01' (tests/fixtures/d06_fixtures.json) is recorded; the canonical EVENT_ID grammar is a NEW program definition; no automatic rewrite is defined.",
      "Real-world exchange symbols containing '&', '-' or similar characters are excluded from the offline EXCHANGE_SYMBOL grammar by design; such cases fail closed rather than being fuzzy-mapped (consistent with src/identity fail-closed governance).",
      'ISIN validation is structural only (same limitation as src/contracts/d05_security_master.ts): the ISO-6166 check digit is not verified.',
      'PORTFOLIO_ID, RESEARCH_ID and EVENT_ID grammars are NEW program definitions with no certified-baseline precedent; designated under P01-01 scope only.',
      'COMPANY_ID grammar EQ_[A-Z0-9]{3,20}_IN is bounded from governed evidence (observed base length 3–8); the bound is a deliberate conservative choice and may be widened only by a later governed specification version.',
    ]),
  });
}
