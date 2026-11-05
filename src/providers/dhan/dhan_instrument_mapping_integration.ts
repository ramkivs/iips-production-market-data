/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Instrument Mapping — Provider-Neutral Integration Boundary (DHAN-D2)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-12 (Fail Closed) / P04 Identity
 * Gate: DHAN-D2 INTEGRATION & QUALIFICATION HARNESS
 * Mode: PRE_ACCESS / SYNTHETIC / OFFLINE
 *
 * PURPOSE:
 *  Turns the D1 mapping foundation into a loadable, verifiable boundary:
 *   1. Structural validation of mapping rows (malformed rows rejected deterministically).
 *   2. Duplicate / conflicting mapping detection.
 *   3. Identity resolution through the EXISTING P04 SecurityMaster / IdentityMappingStore,
 *      so callers address instruments by IIPS identity (ISIN / symbol / companyId) and
 *      never by a Dhan identifier.
 *
 * LEAKAGE RULE:
 *  Dhan security identifiers never cross this boundary outward. Resolution results exposed
 *  to non-provider callers carry canonical identity only (companyId / exchange / symbol).
 *
 * NO real Dhan security identifiers are shipped. Synthetic rows must be explicitly tagged
 * `SYNTHETIC_PRE_ACCESS_FIXTURE`.
 */

import { IdentityAmbiguityError } from '../../identity/quarantine.js';
import { IdentityQuery } from '../../identity/mapping_store.js';
import { SecurityMaster } from '../../identity/security_master.js';
import { DhanExchangeSegment } from './dhan_dto.js';
import { DhanResult, dhanFailure, dhanOk } from './dhan_failures.js';
import {
  DhanInstrumentMapping,
  DhanInstrumentMappingConflictError,
  DhanInstrumentRegistry,
  DhanMappingProvenance,
} from './dhan_instrument_map.js';

const VALID_SEGMENTS: DhanExchangeSegment[] = ['NSE_EQ', 'BSE_EQ'];
const VALID_PROVENANCE: DhanMappingProvenance[] = ['SYNTHETIC_PRE_ACCESS_FIXTURE', 'DHAN_INSTRUMENT_MASTER'];
const SEGMENT_EXCHANGE: Record<DhanExchangeSegment, 'NSE' | 'BSE'> = {
  NSE_EQ: 'NSE',
  BSE_EQ: 'BSE',
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Structurally validates a single mapping row from an external mapping source.
 * Rejects malformed rows with a deterministic MALFORMED_INSTRUMENT_MAPPING failure.
 */
export function validateDhanInstrumentMappingRow(raw: unknown): DhanResult<DhanInstrumentMapping> {
  if (!isObject(raw)) {
    return dhanFailure('MALFORMED_INSTRUMENT_MAPPING', 'Mapping row must be an object');
  }

  if (!isNonEmptyString(raw.companyId)) {
    return dhanFailure('MALFORMED_INSTRUMENT_MAPPING', 'Mapping row is missing companyId', { field: 'companyId' });
  }
  if (!isNonEmptyString(raw.symbol)) {
    return dhanFailure('MALFORMED_INSTRUMENT_MAPPING', 'Mapping row is missing symbol', { field: 'symbol' });
  }
  if (!isNonEmptyString(raw.dhanSecurityId)) {
    return dhanFailure('MALFORMED_INSTRUMENT_MAPPING', 'Mapping row is missing the provider security identifier', {
      field: 'dhanSecurityId',
    });
  }
  if (!isNonEmptyString(raw.exchangeSegment) || !VALID_SEGMENTS.includes(raw.exchangeSegment as DhanExchangeSegment)) {
    return dhanFailure('MALFORMED_INSTRUMENT_MAPPING', `Unsupported exchange segment: ${String(raw.exchangeSegment)}`, {
      field: 'exchangeSegment',
    });
  }
  if (raw.exchange !== 'NSE' && raw.exchange !== 'BSE') {
    return dhanFailure('MALFORMED_INSTRUMENT_MAPPING', `Unsupported exchange: ${String(raw.exchange)}`, {
      field: 'exchange',
    });
  }
  if (
    !isNonEmptyString(raw.mappingProvenance) ||
    !VALID_PROVENANCE.includes(raw.mappingProvenance as DhanMappingProvenance)
  ) {
    return dhanFailure(
      'MALFORMED_INSTRUMENT_MAPPING',
      'Mapping row must declare an explicit mappingProvenance (synthetic or instrument-master)',
      { field: 'mappingProvenance' }
    );
  }

  const segment = raw.exchangeSegment as DhanExchangeSegment;
  if (SEGMENT_EXCHANGE[segment] !== raw.exchange) {
    return dhanFailure(
      'MALFORMED_INSTRUMENT_MAPPING',
      `Exchange '${String(raw.exchange)}' is inconsistent with segment '${segment}'`,
      { field: 'exchange' }
    );
  }

  // Optional governed metadata (DHAN-D3B): validated when present, never invented.
  if (raw.instrumentType !== undefined && raw.instrumentType !== 'EQUITY') {
    return dhanFailure('MALFORMED_INSTRUMENT_MAPPING', `Unsupported instrumentType: ${String(raw.instrumentType)}`, {
      field: 'instrumentType',
    });
  }
  if (raw.active !== undefined && typeof raw.active !== 'boolean') {
    return dhanFailure('MALFORMED_INSTRUMENT_MAPPING', 'active must be a boolean when present', { field: 'active' });
  }
  if (raw.mappingVersion !== undefined && !isNonEmptyString(raw.mappingVersion)) {
    return dhanFailure('MALFORMED_INSTRUMENT_MAPPING', 'mappingVersion must be a non-empty string when present', {
      field: 'mappingVersion',
    });
  }
  if (raw.effectiveDate !== undefined && Number.isNaN(Date.parse(String(raw.effectiveDate)))) {
    return dhanFailure('MALFORMED_INSTRUMENT_MAPPING', 'effectiveDate must be a valid ISO-8601 date when present', {
      field: 'effectiveDate',
    });
  }
  const VALIDATION_STATUSES: Array<'VALIDATED' | 'UNVALIDATED'> = ['VALIDATED', 'UNVALIDATED'];
  if (raw.validationStatus !== undefined && !VALIDATION_STATUSES.includes(raw.validationStatus as 'VALIDATED')) {
    return dhanFailure('MALFORMED_INSTRUMENT_MAPPING', `Unsupported validationStatus: ${String(raw.validationStatus)}`, {
      field: 'validationStatus',
    });
  }
  // Synthetic rows must never claim provider-side verification (no fabricated dates).
  if (raw.lastVerifiedAt !== undefined) {
    if (raw.mappingProvenance !== 'DHAN_INSTRUMENT_MASTER') {
      return dhanFailure(
        'MALFORMED_INSTRUMENT_MAPPING',
        'lastVerifiedAt is only permitted on DHAN_INSTRUMENT_MASTER rows; synthetic rows must not claim provider verification',
        { field: 'lastVerifiedAt' }
      );
    }
    if (Number.isNaN(Date.parse(String(raw.lastVerifiedAt)))) {
      return dhanFailure('MALFORMED_INSTRUMENT_MAPPING', 'lastVerifiedAt must be a valid ISO-8601 instant', {
        field: 'lastVerifiedAt',
      });
    }
  }

  const mapping: DhanInstrumentMapping = {
    companyId: (raw.companyId as string).trim(),
    exchange: raw.exchange,
    symbol: (raw.symbol as string).trim(),
    exchangeSegment: segment,
    dhanSecurityId: (raw.dhanSecurityId as string).trim(),
    mappingProvenance: raw.mappingProvenance as DhanMappingProvenance,
  };
  if (raw.instrumentType !== undefined) mapping.instrumentType = 'EQUITY';
  if (raw.active !== undefined) mapping.active = raw.active as boolean;
  if (raw.mappingVersion !== undefined) mapping.mappingVersion = (raw.mappingVersion as string).trim();
  if (raw.effectiveDate !== undefined) mapping.effectiveDate = String(raw.effectiveDate);
  if (raw.validationStatus !== undefined) mapping.validationStatus = raw.validationStatus as 'VALIDATED' | 'UNVALIDATED';
  if (raw.lastVerifiedAt !== undefined) mapping.lastVerifiedAt = String(raw.lastVerifiedAt);
  return dhanOk(mapping);
}

export interface DhanMappingRejection {
  index: number;
  companyId?: string;
  code: 'MALFORMED_INSTRUMENT_MAPPING' | 'CONFLICTING_INSTRUMENT_MAPPING';
  message: string;
  field?: string;
}

export interface DhanMappingLoadReport {
  registry: DhanInstrumentRegistry;
  acceptedCount: number;
  rejectedCount: number;
  rejections: DhanMappingRejection[];
  syntheticCount: number;
  instrumentMasterCount: number;
}

/**
 * Loads mapping rows into a registry. Never throws: every rejected row is reported
 * deterministically so that a partially valid mapping file cannot silently half-load
 * without an audit trail.
 */
export function loadDhanInstrumentMappings(
  rows: readonly unknown[],
  registry: DhanInstrumentRegistry = new DhanInstrumentRegistry()
): DhanMappingLoadReport {
  const rejections: DhanMappingRejection[] = [];
  let acceptedCount = 0;
  let syntheticCount = 0;
  let instrumentMasterCount = 0;

  rows.forEach((row, index) => {
    const validated = validateDhanInstrumentMappingRow(row);
    if (!validated.ok) {
      rejections.push({
        index,
        companyId: isObject(row) && typeof row.companyId === 'string' ? row.companyId : undefined,
        code: 'MALFORMED_INSTRUMENT_MAPPING',
        message: validated.failure.message,
        field: validated.failure.field,
      });
      return;
    }

    try {
      registry.register(validated.value);
      acceptedCount++;
      if (validated.value.mappingProvenance === 'SYNTHETIC_PRE_ACCESS_FIXTURE') syntheticCount++;
      else instrumentMasterCount++;
    } catch (err: unknown) {
      if (err instanceof DhanInstrumentMappingConflictError) {
        rejections.push({
          index,
          companyId: validated.value.companyId,
          code: 'CONFLICTING_INSTRUMENT_MAPPING',
          message: err.message,
        });
        return;
      }
      rejections.push({
        index,
        companyId: validated.value.companyId,
        code: 'MALFORMED_INSTRUMENT_MAPPING',
        message: (err as Error).message,
      });
    }
  });

  return {
    registry,
    acceptedCount,
    rejectedCount: rejections.length,
    rejections,
    syntheticCount,
    instrumentMasterCount,
  };
}

/**
 * Canonical-only view of a resolved instrument.
 * Deliberately carries NO provider identifier: Dhan ids never leave the provider boundary.
 */
export interface CanonicalInstrumentIdentity {
  companyId: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
}

export interface DhanMappingCoverageReport {
  totalMappings: number;
  syntheticMappings: number;
  instrumentMasterMappings: number;
  /** True while zero authoritative Dhan instrument-master rows are loaded. */
  preAccessOnly: boolean;
  companyIds: string[];
}

/**
 * Resolves IIPS identity → canonical companyId (through the EXISTING P04 SecurityMaster)
 * → Dhan instrument mapping. Both stages fail closed with deterministic codes.
 */
export class DhanInstrumentResolutionService {
  private readonly securityMaster: SecurityMaster;
  private readonly registry: DhanInstrumentRegistry;

  constructor(securityMaster: SecurityMaster, registry: DhanInstrumentRegistry) {
    this.securityMaster = securityMaster;
    this.registry = registry;
  }

  /** Provider-internal accessor: returns the vendor mapping for provider wiring only. */
  public resolveProviderMapping(companyId: string): DhanResult<DhanInstrumentMapping> {
    const resolution = this.registry.resolve(companyId);
    if (resolution.status === 'UNRESOLVED') {
      return dhanFailure('UNRESOLVED_INSTRUMENT', `${resolution.reason}: ${resolution.details}`, {
        field: 'companyId',
      });
    }
    return dhanOk(resolution.mapping);
  }

  /**
   * Resolves an external identifier (ISIN / NSE_SYMBOL / …) to canonical identity, proving
   * the instrument is routable through the Dhan provider without exposing its Dhan id.
   */
  public resolveCanonicalIdentity(query: IdentityQuery): DhanResult<CanonicalInstrumentIdentity> {
    let companyId: string;
    try {
      companyId = this.securityMaster.resolveCompanyId(query);
    } catch (err: unknown) {
      if (err instanceof IdentityAmbiguityError) {
        return dhanFailure(
          'IDENTITY_RESOLUTION_FAILURE',
          `P04 identity resolution failed closed: ${err.quarantineRecord.reason}`,
          { field: query.identifierType }
        );
      }
      return dhanFailure('IDENTITY_RESOLUTION_FAILURE', 'P04 identity resolution failed closed');
    }

    const mapping = this.resolveProviderMapping(companyId);
    if (!mapping.ok) return mapping;

    return dhanOk({
      companyId: mapping.value.companyId,
      symbol: mapping.value.symbol,
      exchange: mapping.value.exchange,
    });
  }

  /** Coverage summary for evidence artefacts. Emits no provider identifiers. */
  public describeCoverage(): DhanMappingCoverageReport {
    const all = this.registry.list();
    const synthetic = all.filter((m) => m.mappingProvenance === 'SYNTHETIC_PRE_ACCESS_FIXTURE').length;
    return {
      totalMappings: all.length,
      syntheticMappings: synthetic,
      instrumentMasterMappings: all.length - synthetic,
      preAccessOnly: all.length - synthetic === 0,
      companyIds: all.map((m) => m.companyId).sort(),
    };
  }
}
