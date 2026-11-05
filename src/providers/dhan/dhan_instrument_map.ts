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
  /** Authoritative IIPS company identifier. */
  companyId: string;
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
      reason: 'NO_MAPPING_DATA_LOADED' | 'UNMAPPED_COMPANY_ID' | 'INSTRUMENT_INACTIVE';
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
    | 'COMPANY_ID_REMAPPED'
    | 'SECURITY_ID_REUSED'
    | 'EXCHANGE_MISMATCH'
    | 'INSTRUMENT_TYPE_MISMATCH';

  constructor(
    companyId: string,
    conflictKind:
      | 'COMPANY_ID_REMAPPED'
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
  private readonly byCompanyId = new Map<string, DhanInstrumentMapping>();
  private readonly bySecurityKey = new Map<string, string>();

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

    const key = mapping.companyId.trim().toUpperCase();
    const securityKey = `${mapping.exchangeSegment}:${mapping.dhanSecurityId}`;

    // DHAN-D2/D3B: duplicate/conflicting mapping detection. Identical re-registration is
    // idempotent; any divergent remap, cross-company security-id reuse, exchange or
    // instrument-type conflict fails closed.
    const existing = this.byCompanyId.get(key);
    if (existing) {
      if (existing.exchange !== mapping.exchange || existing.exchangeSegment !== mapping.exchangeSegment) {
        throw new DhanInstrumentMappingConflictError(
          mapping.companyId,
          'EXCHANGE_MISMATCH',
          `companyId already mapped on exchange ${existing.exchange}/${existing.exchangeSegment}; conflicting ${mapping.exchange}/${mapping.exchangeSegment}`
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
          `companyId already mapped as ${existing.instrumentType}; conflicting ${mapping.instrumentType}`
        );
      }
      const identical =
        existing.dhanSecurityId === mapping.dhanSecurityId &&
        existing.exchangeSegment === mapping.exchangeSegment &&
        existing.exchange === mapping.exchange &&
        existing.symbol === mapping.symbol;
      if (!identical) {
        throw new DhanInstrumentMappingConflictError(
          mapping.companyId,
          'COMPANY_ID_REMAPPED',
          `companyId is already mapped to a different provider instrument (${existing.exchangeSegment})`
        );
      }
    }

    const ownerOfSecurity = this.bySecurityKey.get(securityKey);
    if (ownerOfSecurity && ownerOfSecurity !== key) {
      throw new DhanInstrumentMappingConflictError(
        mapping.companyId,
        'SECURITY_ID_REUSED',
        `provider instrument is already mapped to companyId '${ownerOfSecurity}'`
      );
    }

    this.byCompanyId.set(key, { ...mapping });
    this.bySecurityKey.set(securityKey, key);
  }

  public registerAll(mappings: readonly DhanInstrumentMapping[]): void {
    for (const m of mappings) this.register(m);
  }

  public get size(): number {
    return this.byCompanyId.size;
  }

  public isEmpty(): boolean {
    return this.byCompanyId.size === 0;
  }

  /** Resolves a companyId, failing closed with an explicit unresolved result. */
  public resolve(companyId: string): DhanInstrumentResolution {
    const key = (companyId || '').trim().toUpperCase();

    if (this.byCompanyId.size === 0) {
      return {
        status: 'UNRESOLVED',
        reason: 'NO_MAPPING_DATA_LOADED',
        companyId,
        details:
          'No Dhan instrument mapping data is loaded. Real Dhan security identifiers are unavailable in the pre-access gate.',
      };
    }

    const mapping = key ? this.byCompanyId.get(key) : undefined;
    if (!mapping) {
      return {
        status: 'UNRESOLVED',
        reason: 'UNMAPPED_COMPANY_ID',
        companyId,
        details: `No Dhan instrument mapping registered for companyId '${companyId}'.`,
      };
    }

    // Inactive instruments are eligible for registration (audit trail) but never
    // resolve to routable market data — fail closed, never substitute another instrument.
    if (mapping.active === false) {
      return {
        status: 'UNRESOLVED',
        reason: 'INSTRUMENT_INACTIVE',
        companyId,
        details: `Dhan instrument for companyId '${companyId}' is marked inactive; no quote can be produced.`,
      };
    }

    return { status: 'RESOLVED', mapping };
  }

  public list(): readonly DhanInstrumentMapping[] {
    return Array.from(this.byCompanyId.values());
  }
}
