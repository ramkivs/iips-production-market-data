/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Instrument Mapping Boundary (DHAN-D1)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-12 (Fail Closed)
 * Gate: DHAN-D1 PRE-ACCESS PROVIDER FOUNDATION
 *
 * SCOPE:
 *  Defines HOW an IIPS companyId resolves to a Dhan securityId + exchange segment.
 *  The registry ships EMPTY: no real Dhan security identifiers are invented or
 *  committed in this gate. Real mapping data is loaded later from the Dhan
 *  instrument master once access is granted.
 *
 *  Every unresolved instrument yields an explicit UNRESOLVED result. There is no
 *  fallback, no ticker guessing and no implicit identifier synthesis.
 */

import { DhanExchangeSegment } from './dhan_dto.js';

/**
 * Declares where a mapping row came from. Synthetic rows exist only for
 * pre-access testing and are never treated as authoritative production mappings.
 */
export type DhanMappingProvenance = 'SYNTHETIC_PRE_ACCESS_FIXTURE' | 'DHAN_INSTRUMENT_MASTER';

/** Cash-equity scope of the pre-access foundation; other instrument types are out of scope. */
export type DhanInstrumentType = 'EQUITY';

export type DhanMappingValidationStatus = 'VALIDATED' | 'UNVALIDATED';

export interface DhanInstrumentMapping {
  /** Authoritative IIPS company identifier (COMPANY-level identity; NOT unique per security). */
  companyId: string;
  /**
   * Canonical security-level identity (ISIN) where the authoritative source
   * (P04 SecurityMaster) provides it. One company may have several securities;
   * companyId alone never identifies a security.
   */
  isin?: string;
  /** Canonical IIPS exchange for the listing. */
  exchange: 'NSE' | 'BSE';
  /** Canonical IIPS trading symbol for the listing. */
  symbol: string;
  /** Dhan exchange segment enum. */
  exchangeSegment: DhanExchangeSegment;
  /** Dhan security identifier (opaque string). */
  dhanSecurityId: string;
  /** Origin of this mapping row. */
  mappingProvenance: DhanMappingProvenance;
  /** Instrument type; cash equity only in the pre-access scope. */
  instrumentType?: DhanInstrumentType;
  /** Active/inactive status, where the mapping source provides it. */
  active?: boolean;
  /** Mapping row version from the mapping source. */
  mappingVersion?: string;
  /** Effective/observation date of the mapping row (ISO-8601 date), where supported. */
  effectiveDate?: string;
  /** Validation status of the mapping row. */
  validationStatus?: DhanMappingValidationStatus;
  /**
   * Last provider-side verification instant (ISO-8601 UTC). Only legitimate on
   * DHAN_INSTRUMENT_MASTER rows; synthetic rows must never carry it (no fabricated
   * provider verification dates).
   */
  lastVerifiedAt?: string;
}

export type DhanInstrumentResolution =
  | { status: 'RESOLVED'; mapping: DhanInstrumentMapping }
  | {
      status: 'UNRESOLVED';
      reason: 'NO_MAPPING_DATA_LOADED' | 'UNMAPPED_COMPANY_ID' | 'INSTRUMENT_INACTIVE' | 'AMBIGUOUS_MAPPING';
      companyId: string;
      details: string;
    };

export class DhanInstrumentMappingError extends Error {
  public readonly resolution: Extract<DhanInstrumentResolution, { status: 'UNRESOLVED' }>;

  constructor(resolution: Extract<DhanInstrumentResolution, { status: 'UNRESOLVED' }>) {
    super(`Dhan instrument mapping unresolved for '${resolution.companyId}': ${resolution.reason}`);
    this.name = 'DhanInstrumentMappingError';
    this.resolution = resolution;
  }
}

/**
 * In-memory instrument mapping registry.
 * Empty by construction: DHAN-D1 does not ship instrument master data.
 */
/** Raised when a registration would conflict with an existing mapping row (DHAN-D2). */
export class DhanInstrumentMappingConflictError extends Error {
  public readonly companyId: string;
  public readonly conflictKind:
    | 'SECURITY_MAPPING_CONFLICT'
    | 'SECURITY_ID_REUSED'
    | 'EXCHANGE_MISMATCH'
    | 'INSTRUMENT_TYPE_MISMATCH';

  constructor(
    companyId: string,
    conflictKind:
      | 'SECURITY_MAPPING_CONFLICT'
      | 'SECURITY_ID_REUSED'
      | 'EXCHANGE_MISMATCH'
      | 'INSTRUMENT_TYPE_MISMATCH',
    details: string
  ) {
    super(`Dhan instrument mapping conflict for '${companyId}' [${conflictKind}]: ${details}`);
    this.name = 'DhanInstrumentMappingConflictError';
    this.companyId = companyId;
    this.conflictKind = conflictKind;
  }
}

export class DhanInstrumentRegistry {
  /**
   * Mappings are keyed at SECURITY/LISTING level: `${companyId}|${exchangeSegment}`.
   * companyId alone is company-level identity and may legitimately own several
   * securities/listings (e.g. NSE_EQ and BSE_EQ) — never conflated, never a conflict.
   */
  private readonly byListingKey = new Map<string, DhanInstrumentMapping>();
  /** Provider instrument identity is scoped to (exchangeSegment, dhanSecurityId). */
  private readonly bySecurityKey = new Map<string, string>();

  private static listingKey(companyId: string, exchangeSegment: DhanExchangeSegment): string {
    return `${companyId.trim().toUpperCase()}|${exchangeSegment}`;
  }

  public register(mapping: DhanInstrumentMapping): void {
    if (!mapping.companyId || !mapping.companyId.trim()) {
      throw new Error('DhanInstrumentRegistry: companyId is required');
    }
    if (!mapping.dhanSecurityId || !mapping.dhanSecurityId.trim()) {
      throw new Error('DhanInstrumentRegistry: dhanSecurityId is required');
    }
    if (!mapping.mappingProvenance) {
      throw new Error('DhanInstrumentRegistry: mappingProvenance is required');
    }
    if (mapping.isin !== undefined && !/^[A-Z0-9]{12}$/i.test(mapping.isin.trim())) {
      throw new Error('DhanInstrumentRegistry: isin must be a 12-character security identifier when present');
    }
    if (mapping.instrumentType !== undefined && mapping.instrumentType !== 'EQUITY') {
      throw new Error('DhanInstrumentRegistry: instrumentType must be EQUITY in the cash-equity scope');
    }
    if (mapping.active !== undefined && typeof mapping.active !== 'boolean') {
      throw new Error('DhanInstrumentRegistry: active must be a boolean when present');
    }
    if (mapping.effectiveDate !== undefined && Number.isNaN(Date.parse(mapping.effectiveDate))) {
      throw new Error('DhanInstrumentRegistry: effectiveDate must be a valid ISO-8601 date');
    }
    if (
      mapping.lastVerifiedAt !== undefined &&
      (mapping.mappingProvenance !== 'DHAN_INSTRUMENT_MASTER' || Number.isNaN(Date.parse(mapping.lastVerifiedAt)))
    ) {
      throw new Error(
        'DhanInstrumentRegistry: lastVerifiedAt is only permitted as a valid ISO-8601 instant on DHAN_INSTRUMENT_MASTER rows'
      );
    }

    const key = DhanInstrumentRegistry.listingKey(mapping.companyId, mapping.exchangeSegment);
    // Dhan instrument ids are namespaced by exchange segment: the same numeric id on
    // NSE_EQ and BSE_EQ is NOT a conflict (provider-wide uniqueness is not assumed;
    // remains subject to live qualification).
    const securityKey = `${mapping.exchangeSegment}:${mapping.dhanSecurityId.trim()}`;

    // Duplicate/conflicting mapping detection at the correct identity level.
    // Identical re-registration is idempotent; any divergent security mapping,
    // cross-listing security-id reuse, or instrument-type conflict fails closed.
    const existing = this.byListingKey.get(key);
    if (existing) {
      if (existing.exchange !== mapping.exchange) {
        throw new DhanInstrumentMappingConflictError(
          mapping.companyId,
          'EXCHANGE_MISMATCH',
          `listing ${key} already recorded on exchange ${existing.exchange}; conflicting ${mapping.exchange}`
        );
      }
      if (
        mapping.instrumentType !== undefined &&
        existing.instrumentType !== undefined &&
        existing.instrumentType !== mapping.instrumentType
      ) {
        throw new DhanInstrumentMappingConflictError(
          mapping.companyId,
          'INSTRUMENT_TYPE_MISMATCH',
          `listing ${key} already mapped as ${existing.instrumentType}; conflicting ${mapping.instrumentType}`
        );
      }
      const identical =
        existing.dhanSecurityId === mapping.dhanSecurityId &&
        existing.symbol === mapping.symbol &&
        (existing.isin ?? undefined) === (mapping.isin?.trim().toUpperCase() ?? undefined);
      if (!identical) {
        throw new DhanInstrumentMappingConflictError(
          mapping.companyId,
          'SECURITY_MAPPING_CONFLICT',
          `security/listing ${key} is already mapped to provider instrument '${existing.dhanSecurityId}'; conflicting '${mapping.dhanSecurityId}'`
        );
      }
    }

    const ownerOfSecurity = this.bySecurityKey.get(securityKey);
    if (ownerOfSecurity && ownerOfSecurity !== key) {
      throw new DhanInstrumentMappingConflictError(
        mapping.companyId,
        'SECURITY_ID_REUSED',
        `provider instrument '${securityKey}' is already mapped to '${ownerOfSecurity}'`
      );
    }

    const normalized: DhanInstrumentMapping = {
      ...mapping,
      companyId: mapping.companyId.trim(),
      dhanSecurityId: mapping.dhanSecurityId.trim(),
      ...(mapping.isin !== undefined ? { isin: mapping.isin.trim().toUpperCase() } : {}),
    };
    this.byListingKey.set(key, normalized);
    this.bySecurityKey.set(securityKey, key);
  }

  public registerAll(mappings: readonly DhanInstrumentMapping[]): void {
    for (const m of mappings) this.register(m);
  }

  public get size(): number {
    return this.byListingKey.size;
  }

  public isEmpty(): boolean {
    return this.byListingKey.size === 0;
  }

  private activeMapping(mapping: DhanInstrumentMapping, companyId: string): DhanInstrumentResolution {
    // Inactive instruments are registrable for audit but never resolve to market
    // data — fail closed, never substitute another instrument.
    if (mapping.active === false) {
      return {
        status: 'UNRESOLVED',
        reason: 'INSTRUMENT_INACTIVE',
        companyId,
        details: `Dhan instrument for '${companyId}' on ${mapping.exchangeSegment} is marked inactive; no quote can be produced.`,
      };
    }
    return { status: 'RESOLVED', mapping };
  }

  /**
   * Resolves a companyId. A company may own several securities/listings: with more
   * than one mapping this fails closed as AMBIGUOUS_MAPPING — it never silently
   * selects one instrument. Use resolveListing for an explicit segment.
   */
  public resolve(companyId: string): DhanInstrumentResolution {
    const key = (companyId || '').trim().toUpperCase();

    if (this.byListingKey.size === 0) {
      return {
        status: 'UNRESOLVED',
        reason: 'NO_MAPPING_DATA_LOADED',
        companyId,
        details:
          'No Dhan instrument mapping data is loaded. Real Dhan security identifiers are unavailable in the pre-access gate.',
      };
    }

    const matches = Array.from(this.byListingKey.entries()).filter(([k]) => k.startsWith(`${key}|`));
    if (matches.length === 0) {
      return {
        status: 'UNRESOLVED',
        reason: 'UNMAPPED_COMPANY_ID',
        companyId,
        details: `No Dhan instrument mapping registered for companyId '${companyId}'.`,
      };
    }
    if (matches.length > 1) {
      return {
        status: 'UNRESOLVED',
        reason: 'AMBIGUOUS_MAPPING',
        companyId,
        details: `companyId '${companyId}' has ${matches.length} securities/listings; an explicit exchange segment is required.`,
      };
    }
    return this.activeMapping(matches[0]![1], companyId);
  }

  /** Resolves one security/listing of a company by its Dhan exchange segment. */
  public resolveListing(companyId: string, exchangeSegment: DhanExchangeSegment): DhanInstrumentResolution {
    const key = (companyId || '').trim().toUpperCase();
    if (this.byListingKey.size === 0) {
      return {
        status: 'UNRESOLVED',
        reason: 'NO_MAPPING_DATA_LOADED',
        companyId,
        details:
          'No Dhan instrument mapping data is loaded. Real Dhan security identifiers are unavailable in the pre-access gate.',
      };
    }
    const mapping = this.byListingKey.get(DhanInstrumentRegistry.listingKey(key, exchangeSegment));
    if (!mapping) {
      return {
        status: 'UNRESOLVED',
        reason: 'UNMAPPED_COMPANY_ID',
        companyId,
        details: `No Dhan instrument mapping for companyId '${companyId}' on segment ${exchangeSegment}.`,
      };
    }
    return this.activeMapping(mapping, companyId);
  }

  public list(): readonly DhanInstrumentMapping[] {
    return Array.from(this.byListingKey.values());
  }
}
