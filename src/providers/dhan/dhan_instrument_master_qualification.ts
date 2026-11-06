/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-P7 — exact-identity qualification of the official Dhan instrument
 * master against authoritative P04 identity data, and deterministic
 * population of the P6 Dhan mapping registry.
 *
 * Required identity relationship:
 *   companyId + exchangeSegment + ISIN + series -> Dhan securityId
 *
 * The Dhan master does NOT establish IPD companyId by itself: the join to
 * authoritative P04 data is via EXACT ISIN resolution only. companyId is never
 * inferred from company name, symbol or approximate matching. Records without
 * an authoritative P04 correspondence are preserved as source evidence but are
 * NOT inserted as qualified company mappings.
 */

import {
  buildD114SecurityIdentity,
  isD114SecurityId,
  type D114SecurityIdentity,
} from '../../contracts/types.js';
import type { SecurityMaster } from '../../identity/security_master.js';
import type { DhanExchangeSegment } from './dhan_dto.js';
import {
  DhanInstrumentRegistry,
  type DhanInstrumentMapping,
} from './dhan_instrument_map.js';
import type { ParsedInstrumentMaster, RawInstrumentRecord } from './dhan_instrument_master_parser.js';
import type { SourceRetrievalEvidence } from './dhan_instrument_master_source.js';

/** Exchanges/segments in the qualified cash-equity scope. */
const EXCHANGE_TO_SEGMENT: Readonly<Record<string, DhanExchangeSegment>> = {
  NSE: 'NSE_EQ',
  BSE: 'BSE_EQ',
};

export type RecordDisposition =
  | 'QUALIFIED'
  | 'REJECTED_SCHEMA'
  | 'REJECTED_NOT_EQUITY'
  | 'REJECTED_INVALID_FIELD'
  | 'REJECTED_NO_P04_CORRESPONDENCE'
  | 'REJECTED_AMBIGUOUS_IDENTITY'
  | 'DUPLICATE_IDENTITY'
  | 'CONFLICTING_PROVIDER_ID';

export interface QualifiedRecord {
  readonly disposition: RecordDisposition;
  readonly lineNumber: number;
  readonly reason: string;
  readonly exchange?: string;
  readonly segment?: string;
  readonly dhanSecurityId?: string;
  readonly isin?: string;
  readonly series?: string;
  readonly companyId?: string;
  readonly securityIdentity?: D114SecurityIdentity;
  readonly mapping?: DhanInstrumentMapping;
}

export interface QualificationManifest {
  readonly source: SourceRetrievalEvidence;
  readonly parserSchemaError: string | null;
  readonly observedHeaders: readonly string[];
  readonly totalRows: number;
  readonly equityCandidates: number;
  readonly qualified: number;
  readonly counts: Record<RecordDisposition, number>;
  readonly coverageByExchangeSeries: Record<string, number>;
  readonly records: readonly QualifiedRecord[];
  readonly registryEntries: readonly string[];
}

function emptyCounts(): Record<RecordDisposition, number> {
  return {
    QUALIFIED: 0,
    REJECTED_SCHEMA: 0,
    REJECTED_NOT_EQUITY: 0,
    REJECTED_INVALID_FIELD: 0,
    REJECTED_NO_P04_CORRESPONDENCE: 0,
    REJECTED_AMBIGUOUS_IDENTITY: 0,
    DUPLICATE_IDENTITY: 0,
    CONFLICTING_PROVIDER_ID: 0,
  };
}

/**
 * Qualifies every parsed record. Deterministic: same snapshot + same P04
 * master => same manifest and same registry contents.
 */
export function qualifyInstrumentMaster(
  parsed: ParsedInstrumentMaster,
  securityMaster: SecurityMaster,
  source: SourceRetrievalEvidence,
): { manifest: QualificationManifest; registry: DhanInstrumentRegistry } {
  const counts = emptyCounts();
  const records: QualifiedRecord[] = [];
  const registry = new DhanInstrumentRegistry();
  const seenIdentity = new Map<string, { dhanSecurityId: string; lineNumber: number }>();
  const coverage: Record<string, number> = {};

  if (parsed.schemaError) {
    counts.REJECTED_SCHEMA = parsed.records.length;
    return {
      manifest: {
        source,
        parserSchemaError: parsed.schemaError,
        observedHeaders: parsed.headers,
        totalRows: 0,
        equityCandidates: 0,
        qualified: 0,
        counts,
        coverageByExchangeSeries: {},
        records: [],
        registryEntries: [],
      },
      registry,
    };
  }

  for (const rec of parsed.records) {
    const v = rec.values;
    const exchange = v['EXCH_ID'] ?? v['SEM_EXM_EXCH_ID'] ?? '';
    const segment = v['SEGMENT'] ?? v['SEM_SEGMENT'] ?? '';
    const dhanSecurityId = v['SEM_SMST_SECURITY_ID'] ?? '';
    const isin = v['ISIN'] ?? '';
    const instrument = v['INSTRUMENT'] ?? v['SEM_INSTRUMENT_NAME'] ?? '';
    const series = v['SERIES'] ?? v['SEM_SERIES'] ?? '';
    const instrumentType = v['INSTRUMENT_TYPE'] ?? v['SEM_EXCH_INSTRUMENT_TYPE'] ?? '';

    // Equity eligibility: cash-equity segment E + EQUITY instrument on NSE/BSE.
    if (segment !== 'E' || instrument !== 'EQUITY' || !(exchange in EXCHANGE_TO_SEGMENT)) {
      counts.REJECTED_NOT_EQUITY++;
      records.push({ disposition: 'REJECTED_NOT_EQUITY', lineNumber: rec.lineNumber, reason: `segment=${segment || '-'} instrument=${instrument || '-'} exchange=${exchange || '-'}`, exchange, segment, dhanSecurityId: dhanSecurityId || undefined });
      continue;
    }
    const exchangeSegment = EXCHANGE_TO_SEGMENT[exchange]!;

    // Field validation: Dhan security id, ISIN grammar, non-empty series.
    if (!dhanSecurityId) {
      counts.REJECTED_INVALID_FIELD++;
      records.push({ disposition: 'REJECTED_INVALID_FIELD', lineNumber: rec.lineNumber, reason: 'missing SEM_SMST_SECURITY_ID', exchange, segment, isin: isin || undefined, series: series || undefined });
      continue;
    }
    if (!isin || !/^[A-Za-z0-9]{12}$/.test(isin)) {
      counts.REJECTED_INVALID_FIELD++;
      records.push({ disposition: 'REJECTED_INVALID_FIELD', lineNumber: rec.lineNumber, reason: `invalid or missing ISIN '${isin || '-'}'`, exchange, segment, dhanSecurityId, series: series || undefined });
      continue;
    }
    if (!series) {
      counts.REJECTED_INVALID_FIELD++;
      records.push({ disposition: 'REJECTED_INVALID_FIELD', lineNumber: rec.lineNumber, reason: 'missing SERIES', exchange, segment, dhanSecurityId, isin });
      continue;
    }

    // Canonical D114 identity from exact source values only.
    const identity = buildD114SecurityIdentity(isin, series);
    if (!identity) {
      counts.REJECTED_INVALID_FIELD++;
      records.push({ disposition: 'REJECTED_INVALID_FIELD', lineNumber: rec.lineNumber, reason: 'ISIN+SERIES do not form a canonical P04 D114 identity', exchange, segment, dhanSecurityId, isin, series });
      continue;
    }

    // Exact P04 join via ISIN — never via name/symbol.
    let companyId: string | null = null;
    try {
      companyId = securityMaster.resolveCompanyId({ identifierType: 'ISIN', identifierValue: isin });
    } catch {
      companyId = null;
    }
    if (!companyId) {
      counts.REJECTED_NO_P04_CORRESPONDENCE++;
      records.push({ disposition: 'REJECTED_NO_P04_CORRESPONDENCE', lineNumber: rec.lineNumber, reason: `no authoritative P04 company for ISIN ${isin}`, exchange, segment, dhanSecurityId, isin, series, securityIdentity: identity });
      continue;
    }
    const entity = securityMaster.getEntity(companyId);
    if (!entity || entity.isin.toUpperCase() !== isin.toUpperCase()) {
      counts.REJECTED_AMBIGUOUS_IDENTITY++;
      records.push({ disposition: 'REJECTED_AMBIGUOUS_IDENTITY', lineNumber: rec.lineNumber, reason: `P04 entity for ISIN ${isin} disagrees`, exchange, segment, dhanSecurityId, isin, series, companyId });
      continue;
    }
    // Exchange evidence must agree with a P04 listing of the company.
    if (!entity.listings.some((l) => l.exchange === exchange && l.status === 'ACTIVE')) {
      counts.REJECTED_NO_P04_CORRESPONDENCE++;
      records.push({ disposition: 'REJECTED_NO_P04_CORRESPONDENCE', lineNumber: rec.lineNumber, reason: `no active P04 ${exchange} listing for companyId ${companyId}`, exchange, segment, dhanSecurityId, isin, series, companyId, securityIdentity: identity });
      continue;
    }

    const identityKey = `${companyId}|${exchangeSegment}|${identity.securityId}`;
    const prior = seenIdentity.get(identityKey);
    if (prior) {
      if (prior.dhanSecurityId === dhanSecurityId) {
        counts.DUPLICATE_IDENTITY++;
        records.push({ disposition: 'DUPLICATE_IDENTITY', lineNumber: rec.lineNumber, reason: `duplicate of line ${prior.lineNumber}`, exchange, segment, dhanSecurityId, isin, series, companyId, securityIdentity: identity });
      } else {
        counts.CONFLICTING_PROVIDER_ID++;
        records.push({ disposition: 'CONFLICTING_PROVIDER_ID', lineNumber: rec.lineNumber, reason: `line ${prior.lineNumber} has dhanSecurityId ${prior.dhanSecurityId}`, exchange, segment, dhanSecurityId, isin, series, companyId, securityIdentity: identity });
      }
      continue;
    }
    seenIdentity.set(identityKey, { dhanSecurityId, lineNumber: rec.lineNumber });

    // Registry-level validation of the Dhan security id format is provider-scoped;
    // here we require a non-empty trimmed id (already checked) and register.
    const mapping: DhanInstrumentMapping = {
      companyId,
      isin: identity.isin,
      securityId: identity.securityId,
      exchange: exchange as 'NSE' | 'BSE',
      symbol: v['SYMBOL_NAME'] ?? v['SM_SYMBOL_NAME'] ?? v['SEM_TRADING_SYMBOL'] ?? '',
      exchangeSegment,
      dhanSecurityId,
      mappingProvenance: 'DHAN_INSTRUMENT_MASTER',
      instrumentType: 'EQUITY',
      active: true,
      // Honest provider-verification instant: the master file retrieval time.
      lastVerifiedAt: source.retrievedAtUtc,
    };
    try {
      registry.register(mapping);
    } catch (error) {
      counts.CONFLICTING_PROVIDER_ID++;
      records.push({ disposition: 'CONFLICTING_PROVIDER_ID', lineNumber: rec.lineNumber, reason: error instanceof Error ? error.message : String(error), exchange, segment, dhanSecurityId, isin, series, companyId, securityIdentity: identity });
      continue;
    }
    counts.QUALIFIED++;
    coverage[`${exchange}:${series}`] = (coverage[`${exchange}:${series}`] ?? 0) + 1;
    records.push({ disposition: 'QUALIFIED', lineNumber: rec.lineNumber, reason: 'exact P04 D114 identity qualified', exchange, segment, dhanSecurityId, isin, series, companyId, securityIdentity: identity, mapping });
  }

  const equityCandidates = parsed.records.length - counts.REJECTED_NOT_EQUITY;
  return {
    manifest: {
      source,
      parserSchemaError: null,
      observedHeaders: parsed.headers,
      totalRows: parsed.records.length,
      equityCandidates,
      qualified: counts.QUALIFIED,
      counts,
      coverageByExchangeSeries: coverage,
      records,
      registryEntries: registry.list().map((m) => `${m.companyId}|${m.exchangeSegment}|${m.securityId}`),
    },
    registry,
  };
}

/** Validates an observed Dhan security id conservatively (non-empty, no whitespace). */
export function isPlausibleDhanSecurityId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && !/\s/.test(value.trim());
}

export { isD114SecurityId };
