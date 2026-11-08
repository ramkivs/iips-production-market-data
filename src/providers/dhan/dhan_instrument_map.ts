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
import { isD114SecurityId, type D114SecurityIdentity } from '../../contracts/types.js';

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
  /**
   * Canonical P04/D114 security identity (`ISIN:<isin>:<series>`), where the
   * authoritative source provides it. Distinct from the Dhan provider id.
   */
  securityId?: string;
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
   * Mappings are keyed at SECURITY level: `${companyId}|${exchangeSegment}|${isin}`.
   * companyId is COMPANY-level identity only; exchangeSegment is the listing scope;
   * isin is the P04 security-level discriminator. One company may legitimately own
   * several securities (different ISINs) on the SAME segment — they coexist as
   * distinct keys and are never treated as conflicts.
   */
  private readonly bySecurityListingKey = new Map<string, DhanInstrumentMapping>();
  /** Provider instrument identity is scoped to (exchangeSegment, dhanSecurityId). */
  private readonly bySecurityKey = new Map<string, string>();

  private static keyOf(companyId: string, exchangeSegment: DhanExchangeSegment, isin?: string, series?: string): string {
    return `${companyId.trim().toUpperCase()}|${exchangeSegment}|${(isin ?? '').trim().toUpperCase()}|${(series ?? '').trim().toUpperCase()}`;
  }

  /** The exchange series of a mapping, taken only from the canonical P04 securityId — never inferred. */
  private static seriesOf(mapping: DhanInstrumentMapping): string {
    if (typeof mapping.securityId !== 'string' || !mapping.securityId.trim()) return '';
    const parts = mapping.securityId.trim().split(':');
    return parts.length === 3 ? parts[2]!.toUpperCase() : '';
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
    if (mapping.isin !== undefined && !/^[A-Za-z0-9]{12}$/i.test(mapping.isin.trim())) {
      throw new Error('DhanInstrumentRegistry: isin must be a 12-character security identifier when present');
    }
    if (mapping.securityId !== undefined) {
      // Canonical P04 security id must follow the ISIN:<isin>:<series> grammar and,
      // when isin is also present, must embed the same ISIN (no conflation).
      if (!isD114SecurityId(mapping.securityId.trim())) {
        throw new Error('DhanInstrumentRegistry: securityId must follow the ISIN:<isin>:<series> grammar');
      }
      if (mapping.isin !== undefined && !mapping.securityId.trim().includes(`:${mapping.isin.trim().toUpperCase()}:`)) {
        throw new Error('DhanInstrumentRegistry: securityId and isin disagree');
      }
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

    const isin = mapping.isin?.trim().toUpperCase();
    const series = DhanInstrumentRegistry.seriesOf(mapping);
    const key = DhanInstrumentRegistry.keyOf(mapping.companyId, mapping.exchangeSegment, isin, series);
    // Dhan instrument ids are namespaced by exchange segment: the same id on
    // NSE_EQ and BSE_EQ is NOT a conflict (provider-wide uniqueness is not
    // assumed; remains subject to live qualification).
    const securityKey = `${mapping.exchangeSegment}:${mapping.dhanSecurityId.trim()}`;

    const existing = this.bySecurityListingKey.get(key);
    if (existing) {
      if (existing.exchange !== mapping.exchange) {
        throw new DhanInstrumentMappingConflictError(
          mapping.companyId,
          'EXCHANGE_MISMATCH',
          `security ${key} already recorded on exchange ${existing.exchange}; conflicting ${mapping.exchange}`
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
          `security ${key} already mapped as ${existing.instrumentType}; conflicting ${mapping.instrumentType}`
        );
      }
      const identical =
        existing.dhanSecurityId === mapping.dhanSecurityId && existing.symbol === mapping.symbol;
      if (!identical) {
        throw new DhanInstrumentMappingConflictError(
          mapping.companyId,
          'SECURITY_MAPPING_CONFLICT',
          `security ${key} is already mapped to provider instrument '${existing.dhanSecurityId}'; conflicting '${mapping.dhanSecurityId}'`
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
      ...(isin !== undefined ? { isin } : {}),
      ...(mapping.securityId !== undefined ? { securityId: mapping.securityId.trim() } : {}),
    };
    this.bySecurityListingKey.set(key, normalized);
    this.bySecurityKey.set(securityKey, key);
  }

  public registerAll(mappings: readonly DhanInstrumentMapping[]): void {
    for (const m of mappings) this.register(m);
  }

  public get size(): number {
    return this.bySecurityListingKey.size;
  }

  public isEmpty(): boolean {
    return this.bySecurityListingKey.size === 0;
  }

  private static emptyResult(companyId: string): DhanInstrumentResolution {
    return {
      status: 'UNRESOLVED',
      reason: 'NO_MAPPING_DATA_LOADED',
      companyId,
      details:
        'No Dhan instrument mapping data is loaded. Real Dhan security identifiers are unavailable in the pre-access gate.',
    };
  }

  private static notFound(companyId: string, scope: string): DhanInstrumentResolution {
    return {
      status: 'UNRESOLVED',
      reason: 'UNMAPPED_COMPANY_ID',
      companyId,
      details: `No Dhan instrument mapping registered for ${scope}.`,
    };
  }

  private checkActive(mapping: DhanInstrumentMapping, companyId: string): DhanInstrumentResolution {
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

  private listFor(prefix: string): DhanInstrumentMapping[] {
    return Array.from(this.bySecurityListingKey.entries())
      .filter(([k]) => k.startsWith(prefix))
      .map(([, m]) => m);
  }

  /**
   * Company-level resolution. Fails closed as AMBIGUOUS_MAPPING whenever more than
   * one security/listing exists for the company — never silently selects one.
   */
  public resolve(companyId: string): DhanInstrumentResolution {
    const key = (companyId || '').trim().toUpperCase();
    if (this.bySecurityListingKey.size === 0) return DhanInstrumentRegistry.emptyResult(companyId);
    const matches = this.listFor(`${key}|`);
    if (matches.length === 0) return DhanInstrumentRegistry.notFound(companyId, `companyId '${companyId}'`);
    if (matches.length > 1) {
      return {
        status: 'UNRESOLVED',
        reason: 'AMBIGUOUS_MAPPING',
        companyId,
        details: `companyId '${companyId}' has ${matches.length} mapped securities; a complete security identity (segment + ISIN) is required.`,
      };
    }
    return this.checkActive(matches[0]!, companyId);
  }

  /**
   * Listing-level resolution (company + segment). Fails closed as AMBIGUOUS_MAPPING
   * when several securities of the same company exist on the same segment.
   */
  public resolveListing(companyId: string, exchangeSegment: DhanExchangeSegment): DhanInstrumentResolution {
    const key = (companyId || '').trim().toUpperCase();
    if (this.bySecurityListingKey.size === 0) return DhanInstrumentRegistry.emptyResult(companyId);
    const matches = this.listFor(`${key}|${exchangeSegment}|`);
    if (matches.length === 0) {
      return DhanInstrumentRegistry.notFound(companyId, `companyId '${companyId}' on segment ${exchangeSegment}`);
    }
    if (matches.length > 1) {
      return {
        status: 'UNRESOLVED',
        reason: 'AMBIGUOUS_MAPPING',
        companyId,
        details: `companyId '${companyId}' has ${matches.length} securities on segment ${exchangeSegment}; an ISIN is required to disambiguate.`,
      };
    }
    return this.checkActive(matches[0]!, companyId);
  }

  /**
   * Security-level resolution with complete identity (company + segment + ISIN).
   * This is the only resolution that may return a mapping when several securities
   * of one company share a segment. Missing/unknown ISIN fails closed.
   */
  public resolveSecurity(companyId: string, exchangeSegment: DhanExchangeSegment, isin: string): DhanInstrumentResolution {
    const key = (companyId || '').trim().toUpperCase();
    if (this.bySecurityListingKey.size === 0) return DhanInstrumentRegistry.emptyResult(companyId);
    if (!isin || !isin.trim()) {
      return {
        status: 'UNRESOLVED',
        reason: 'AMBIGUOUS_MAPPING',
        companyId,
        details: 'A canonical ISIN (security identity) is required to resolve a mapping; company + segment alone may be ambiguous.',
      };
    }
    const matches = this.listFor(`${key}|${exchangeSegment}|${isin.trim().toUpperCase()}|`);
    if (matches.length === 0) {
      return DhanInstrumentRegistry.notFound(
        companyId,
        `security ${isin} of companyId '${companyId}' on segment ${exchangeSegment}`
      );
    }
    if (matches.length > 1) {
      return {
        status: 'UNRESOLVED',
        reason: 'AMBIGUOUS_MAPPING',
        companyId,
        details: `security ${isin} of companyId '${companyId}' on segment ${exchangeSegment} has ${matches.length} series; the exact P04 D114 series is required to disambiguate.`,
      };
    }
    return this.checkActive(matches[0]!, companyId);
  }

  /**
   * Exact-identity resolution: the complete canonical P04 `D114SecurityIdentity`
   * (ISIN + series) plus company and segment must match ONE registered mapping.
   * There is deliberately NO fallback to company-only, ISIN-only or segment-only
   * resolution — a missing exact match fails closed.
   */
  public resolveExactIdentity(
    companyId: string,
    exchangeSegment: DhanExchangeSegment,
    identity: D114SecurityIdentity,
  ): DhanInstrumentResolution {
    const key = (companyId || '').trim().toUpperCase();
    if (this.bySecurityListingKey.size === 0) return DhanInstrumentRegistry.emptyResult(companyId);
    const mapping = this.bySecurityListingKey.get(
      DhanInstrumentRegistry.keyOf(key, exchangeSegment, identity.isin, identity.series),
    );
    if (!mapping) {
      return DhanInstrumentRegistry.notFound(
        companyId,
        `exact security identity ${identity.securityId} of companyId '${companyId}' on segment ${exchangeSegment}`,
      );
    }
    if (mapping.securityId !== undefined && mapping.securityId.trim().toUpperCase() !== identity.securityId.toUpperCase()) {
      return {
        status: 'UNRESOLVED',
        reason: 'AMBIGUOUS_MAPPING',
        companyId,
        details: `mapping for ${identity.securityId} disagrees with its registered canonical identity ${mapping.securityId}.`,
      };
    }
    return this.checkActive(mapping, companyId);
  }

  public list(): readonly DhanInstrumentMapping[] {
    return Array.from(this.bySecurityListingKey.values());
  }
}
