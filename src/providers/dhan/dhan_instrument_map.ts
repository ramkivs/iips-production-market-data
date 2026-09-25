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
}

export type DhanInstrumentResolution =
  | { status: 'RESOLVED'; mapping: DhanInstrumentMapping }
  | {
      status: 'UNRESOLVED';
      reason: 'NO_MAPPING_DATA_LOADED' | 'UNMAPPED_COMPANY_ID';
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
export class DhanInstrumentRegistry {
  private readonly byCompanyId = new Map<string, DhanInstrumentMapping>();

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
    this.byCompanyId.set(mapping.companyId.trim().toUpperCase(), { ...mapping });
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

    return { status: 'RESOLVED', mapping };
  }

  public list(): readonly DhanInstrumentMapping[] {
    return Array.from(this.byCompanyId.values());
  }
}
