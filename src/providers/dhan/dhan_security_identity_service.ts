/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Security Identity Ingestion & Qualification Service (IPD)
 *
 * Implements the Stage 4 non-production security identity ingestion path
 * established by Stage 3A/3B/3C/3D:
 *
 *   IRR holding input (ISIN + exchange)
 *   → P04 exact company correspondence + ACTIVE exchange listing
 *   → P7 vendor-master series evidence + qualification
 *   → D114 canonical identity (ISIN:<isin>:<series>)
 *   → existing durable security_identity field (migration 005)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-12 (Fail Closed)
 * Mode: NON_PRODUCTION / PRE_ACCESS / SYNTHETIC / OFFLINE
 *
 * isinAuthority is preserved as NON_AUTHORITATIVE on every qualified
 * identity. No issuer-verified or exchange-certified identity is ever
 * claimed. The resulting identity is a conditionally qualified identity,
 * not independently issuer-verified identity.
 *
 * IRR is never modified: IRR supplies ISIN + exchange only; series
 * resolution and canonical identity construction are IPD-owned.
 */

import { IdentityAmbiguityError } from '../../identity/quarantine.js';
import {
  buildD114SecurityIdentity,
  isD114SecurityIdentity,
  isD114SecurityId,
  D114_ISIN_AUTHORITY,
  D114_ISIN_LENGTH,
  D114_ISIN_PATTERN,
  type D114SecurityIdentity,
} from '../../contracts/types.js';
import { SecurityMaster } from '../../identity/security_master.js';
import {
  DhanExchangeSegment,
} from './dhan_dto.js';
import {
  DhanInstrumentRegistry,
  type DhanInstrumentMapping,
} from './dhan_instrument_map.js';

const EXCHANGE_TO_SEGMENT: Readonly<Record<'NSE' | 'BSE', DhanExchangeSegment>> = {
  NSE: 'NSE_EQ',
  BSE: 'BSE_EQ',
};

/**
 * IRR-supplied holding identity input. IRR provides available ISIN and
 * exchange only; series is never supplied or inferred by IRR.
 */
export interface HoldingIdentityInput {
  /** 12-character ISIN (syntax validated, not authority-certified). */
  readonly isin: string;
  /** Listing exchange: 'NSE' or 'BSE'. */
  readonly exchange: 'NSE' | 'BSE';
  /** Optional holding symbol for error context only. */
  readonly symbol?: string;
}

/** Qualified D114 canonical identity with preserved NON_AUTHORITATIVE authority. */
export interface SecurityIdentityQualified {
  readonly status: 'QUALIFIED';
  readonly securityIdentity: D114SecurityIdentity;
  readonly companyId: string;
  readonly exchange: 'NSE' | 'BSE';
  readonly isinAuthority: typeof D114_ISIN_AUTHORITY;
}

/** Unresolved identity outcome with a typed fail-closed reason. */
export interface SecurityIdentityUnresolved {
  readonly status: 'UNRESOLVED';
  readonly reason:
    | 'MISSING_ISIN'
    | 'INVALID_ISIN_SYNTAX'
    | 'MISSING_P04_CORRESPONDENCE'
    | 'INACTIVE_OR_MISSING_LISTING'
    | 'MISSING_SERIES_EVIDENCE'
    | 'MISSING_P7_MAPPING'
    | 'AMBIGUOUS_PROVIDER_MAPPING'
    | 'CONFLICTING_ISIN'
    | 'CONFLICTING_SERIES'
    | 'EXCHANGE_MISMATCH'
    | 'STALE_SOURCE_EVIDENCE';
  readonly details: string;
  readonly isin?: string;
  readonly exchange?: 'NSE' | 'BSE';
  readonly companyId?: string;
}

export type SecurityIdentityQualificationResult =
  | SecurityIdentityQualified
  | SecurityIdentityUnresolved;

/**
 * Qualifies a single holding's security identity through the governed
 * P04 → P7 joint path.
 *
 * Returns QUALIFIED only when ALL checks succeed:
 *   1. ISIN present and syntactically valid (12-char D114 grammar)
 *   2. Exact P04 ISIN correspondence (resolveCompanyId)
 *   3. P04 entity ISIN agrees with input ISIN (no conflict)
 *   4. ACTIVE P04 listing on the specified exchange
 *   5. P7 registry has an unambiguous mapping for (companyId, segment, ISIN)
 *   6. P7 mapping carries a canonical D114 securityId (series evidence)
 *   7. P7 mapping ISIN agrees with input ISIN (no conflict)
 *   8. Source evidence is usable (lastVerifiedAt present on master rows)
 *
 * Returns UNRESOLVED with a typed reason on any failure. Never infers
 * series, never defaults exchange, never selects an arbitrary listing,
 * never resolves ambiguous mappings by approximation.
 *
 * Fail-closed: any missing or conflicting evidence yields UNRESOLVED.
 */
export function qualifyHoldingSecurityIdentity(
  input: HoldingIdentityInput,
  securityMaster: SecurityMaster,
  registry: DhanInstrumentRegistry,
): SecurityIdentityQualificationResult {
  const { isin: rawIsin, exchange, symbol } = input;
  const context = symbol ? ` for holding '${symbol}'` : '';

  // 1. Missing ISIN.
  if (!rawIsin || !rawIsin.trim()) {
    return {
      status: 'UNRESOLVED',
      reason: 'MISSING_ISIN',
      details: `Holding input supplies no ISIN${context}.`,
      exchange,
    };
  }

  const normalizedIsin = rawIsin.trim().toUpperCase();

  // 2. Invalid ISIN syntax.
  if (normalizedIsin.length !== D114_ISIN_LENGTH || !D114_ISIN_PATTERN.test(normalizedIsin)) {
    return {
      status: 'UNRESOLVED',
      reason: 'INVALID_ISIN_SYNTAX',
      details: `ISIN '${normalizedIsin}'${context} does not conform to the ${D114_ISIN_LENGTH}-character D114 grammar.`,
      isin: normalizedIsin,
      exchange,
    };
  }

  // 3. P04 exact ISIN correspondence → companyId.
  let companyId: string;
  try {
    companyId = securityMaster.resolveCompanyId({
      identifierType: 'ISIN',
      identifierValue: normalizedIsin,
    });
  } catch (err: unknown) {
    if (err instanceof IdentityAmbiguityError) {
      return {
        status: 'UNRESOLVED',
        reason: 'MISSING_P04_CORRESPONDENCE',
        details: `No authoritative P04 company correspondence for ISIN ${normalizedIsin}${context}: ${err.quarantineRecord.reason}.`,
        isin: normalizedIsin,
        exchange,
      };
    }
    return {
      status: 'UNRESOLVED',
      reason: 'MISSING_P04_CORRESPONDENCE',
      details: `P04 identity resolution failed for ISIN ${normalizedIsin}${context}.`,
      isin: normalizedIsin,
      exchange,
    };
  }

  // 4. P04 entity: ISIN agreement + ACTIVE listing on the specified exchange.
  const entity = securityMaster.getEntity(companyId);
  if (!entity) {
    return {
      status: 'UNRESOLVED',
      reason: 'MISSING_P04_CORRESPONDENCE',
      details: `P04 entity not found for companyId ${companyId} (ISIN ${normalizedIsin}${context}).`,
      isin: normalizedIsin,
      exchange,
      companyId,
    };
  }

  if (entity.isin.toUpperCase() !== normalizedIsin) {
    return {
      status: 'UNRESOLVED',
      reason: 'CONFLICTING_ISIN',
      details: `P04 entity ISIN '${entity.isin}' disagrees with input ISIN '${normalizedIsin}'${context} for companyId ${companyId}.`,
      isin: normalizedIsin,
      exchange,
      companyId,
    };
  }

  const activeListing = entity.listings.find(
    (l) => l.exchange === exchange && l.status === 'ACTIVE',
  );
  if (!activeListing) {
    const hasListing = entity.listings.some((l) => l.exchange === exchange);
    if (!hasListing) {
      return {
        status: 'UNRESOLVED',
        reason: 'INACTIVE_OR_MISSING_LISTING',
        details: `No P04 ${exchange} listing for companyId ${companyId} (ISIN ${normalizedIsin}${context}).`,
        isin: normalizedIsin,
        exchange,
        companyId,
      };
    }
    return {
      status: 'UNRESOLVED',
      reason: 'INACTIVE_OR_MISSING_LISTING',
      details: `P04 ${exchange} listing for companyId ${companyId} (ISIN ${normalizedIsin}${context}) is not ACTIVE.`,
      isin: normalizedIsin,
      exchange,
      companyId,
    };
  }

  // 5. P7 series evidence: unambiguous mapping for (companyId, segment, ISIN).
  const exchangeSegment = EXCHANGE_TO_SEGMENT[exchange];
  const resolution = registry.resolveSecurity(companyId, exchangeSegment, normalizedIsin);
  if (resolution.status === 'UNRESOLVED') {
    if (resolution.reason === 'AMBIGUOUS_MAPPING') {
      return {
        status: 'UNRESOLVED',
        reason: 'AMBIGUOUS_PROVIDER_MAPPING',
        details: `P7 provider mapping is ambiguous for ISIN ${normalizedIsin}${context}: ${resolution.details}`,
        isin: normalizedIsin,
        exchange,
        companyId,
      };
    }
    if (resolution.reason === 'INSTRUMENT_INACTIVE') {
      return {
        status: 'UNRESOLVED',
        reason: 'INACTIVE_OR_MISSING_LISTING',
        details: `P7 provider instrument for ISIN ${normalizedIsin}${context} is inactive: ${resolution.details}`,
        isin: normalizedIsin,
        exchange,
        companyId,
      };
    }
    return {
      status: 'UNRESOLVED',
      reason: 'MISSING_P7_MAPPING',
      details: `No P7 provider mapping for ISIN ${normalizedIsin}${context}: ${resolution.details}`,
      isin: normalizedIsin,
      exchange,
      companyId,
    };
  }

  const mapping = resolution.mapping;

  // 6. Verify P7 mapping ISIN agrees with input ISIN (no conflict).
  if (mapping.isin && mapping.isin.toUpperCase() !== normalizedIsin) {
    return {
      status: 'UNRESOLVED',
      reason: 'CONFLICTING_ISIN',
      details: `P7 mapping ISIN '${mapping.isin}' disagrees with input ISIN '${normalizedIsin}'${context} for companyId ${companyId}.`,
      isin: normalizedIsin,
      exchange,
      companyId,
    };
  }

  // 7. P7 mapping must carry a canonical D114 securityId (series evidence).
  if (!mapping.securityId) {
    return {
      status: 'UNRESOLVED',
      reason: 'MISSING_SERIES_EVIDENCE',
      details: `P7 mapping for ISIN ${normalizedIsin}${context} carries no canonical security identity (series evidence missing).`,
      isin: normalizedIsin,
      exchange,
      companyId,
    };
  }

  if (!isD114SecurityId(mapping.securityId)) {
    return {
      status: 'UNRESOLVED',
      reason: 'MISSING_SERIES_EVIDENCE',
      details: `P7 mapping securityId '${mapping.securityId}' for ISIN ${normalizedIsin}${context} does not conform to the D114 grammar.`,
      isin: normalizedIsin,
      exchange,
      companyId,
    };
  }

  // Verify series ISIN segment agrees with input ISIN.
  const mappingParts = mapping.securityId.split(':');
  if (mappingParts.length !== 3 || mappingParts[1]!.toUpperCase() !== normalizedIsin) {
    return {
      status: 'UNRESOLVED',
      reason: 'CONFLICTING_ISIN',
      details: `P7 security identity '${mapping.securityId}' embeds ISIN '${mappingParts[1]}' that disagrees with input ISIN '${normalizedIsin}'${context}.`,
      isin: normalizedIsin,
      exchange,
      companyId,
    };
  }

  // 8. Stale source evidence: master-sourced mappings must carry a valid
  //    lastVerifiedAt. No arbitrary freshness period is defined here; that
  //    is a Program Authority decision (Stage 3D, G-03/G-04).
  if (
    mapping.mappingProvenance === 'DHAN_INSTRUMENT_MASTER' &&
    (!mapping.lastVerifiedAt || Number.isNaN(Date.parse(mapping.lastVerifiedAt)))
  ) {
    return {
      status: 'UNRESOLVED',
      reason: 'STALE_SOURCE_EVIDENCE',
      details: `P7 mapping for ISIN ${normalizedIsin}${context} has no valid lastVerifiedAt; source evidence is stale or unusable.`,
      isin: normalizedIsin,
      exchange,
      companyId,
    };
  }

  // 9. Construct D114 canonical identity from exact source values.
  const series = mappingParts[2]!;
  const identity = buildD114SecurityIdentity(normalizedIsin, series);
  if (!identity) {
    return {
      status: 'UNRESOLVED',
      reason: 'MISSING_SERIES_EVIDENCE',
      details: `ISIN '${normalizedIsin}' + series '${series}'${context} do not form a canonical D114 identity.`,
      isin: normalizedIsin,
      exchange,
      companyId,
    };
  }

  return {
    status: 'QUALIFIED',
    securityIdentity: identity,
    companyId,
    exchange,
    isinAuthority: D114_ISIN_AUTHORITY,
  };
}

/**
 * Converts a qualification result to the HoldingInput.securityIdentity
 * value: the qualified D114 identity, or null when unresolved. Preserves
 * migration 005 semantics: NULL = explicitly unresolved, never inferred.
 */
export function toHoldingSecurityIdentity(
  result: SecurityIdentityQualificationResult,
): D114SecurityIdentity | null {
  if (result.status === 'QUALIFIED') return result.securityIdentity;
  return null;
}

/**
 * Exchange segment for a holding's exchange.
 */
export function exchangeToSegment(exchange: 'NSE' | 'BSE'): DhanExchangeSegment {
  return EXCHANGE_TO_SEGMENT[exchange];
}

/**
 * Type guard narrowing a qualification result to the QUALIFIED variant.
 */
export function isQualifiedSecurityIdentity(
  result: SecurityIdentityQualificationResult,
): result is SecurityIdentityQualified {
  return result.status === 'QUALIFIED';
}

export type { DhanInstrumentMapping };
export { DhanInstrumentRegistry };
