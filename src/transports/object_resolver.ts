/**
 * Institutional Investment Platform System (IIPS)
 * Security Master Object Resolution Service (P12 / Contract C7)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 *                 IIPS-V3-IPD-PROVENANCE-ELIGIBILITY-PROGRAM-AUTHORITY-DECISION-2026-10-19-01 (C1–C7)
 *                 IIPS-V3-IPD-SECURITY-MASTER-INTEGRITY-IMPLEMENTATION-ACT-2026-10-19-01
 *
 * ══ ASSERTION SEMANTICS (evidence-based; see the implementation act §3) ══════════════════
 *  Each resolved object keeps SEVEN concerns distinct. None of them implies another.
 *   1. Identity resolution  — effective-dated identifier → companyId (IdentityMappingStore).
 *   2. Source provenance    — which governed corpus revision was resolved (sourceRevision),
 *                              or null when the master was not hydrated from a governed
 *                              deposition. Provenance never implies record origin.
 *   3. Record origin        — ALWAYS 'UNKNOWN' / sourceClassification 'UNCLASSIFIED': no D05
 *                              row carries record-specific, independently verifiable origin
 *                              evidence (C1/C2). Corpus membership, ISIN validity, successful
 *                              resolution and deposition authorization are NOT such evidence.
 *   4. Descriptor completeness — faceValue / currency are SOURCE_PROVIDED, MISSING or INVALID.
 *                              Missing/invalid values are returned as null — never substituted
 *                              (C4). No arbitrary replacement value is introduced.
 *   5. Data quality         — derived from (4) and (6): GOOD only when every assessed
 *                              descriptor is source-provided and the descriptor is the current
 *                              snapshot for a current query; otherwise PARTIAL with anomaly
 *                              codes. Quality is not origin and not eligibility (C3).
 *   6. Temporal semantics   — asOf governs identity resolution only. The descriptor (incl.
 *                              listings) is the single current governed snapshot; it is never
 *                              asserted to be historically correct. Listings are not
 *                              effective-dated. A historical asOf is disclosed, not hidden.
 *   7. Consumer eligibility — 'NOT_ASSERTED'. IPD publishes producer-scoped assertions only;
 *                              each consumer decides its own admission (C6/C7).
 */

import { SecurityMaster, GovernedSourceRevision } from '../identity/security_master.js';
import { IdentityQuery } from '../identity/mapping_store.js';
import { ExecutiveProvenance } from './types.js';
import { computeLineageHash } from '../contracts/provenance.js';
import { QualityState, SourceClassification } from '../contracts/types.js';

/** Evidence status of an individual descriptor attribute in the source record. */
export type DescriptorFieldStatus = 'SOURCE_PROVIDED' | 'MISSING' | 'INVALID';

/**
 * Temporal relationship between the requested asOf and the returned descriptor.
 *  - CURRENT_SNAPSHOT: no historical asOf was requested; the current governed snapshot is
 *    exactly what was asked for.
 *  - AS_OF_NOT_VERSIONED: a historical asOf was requested and falls inside the record's
 *    declared effective window, but descriptor values are not versioned — the current
 *    snapshot is returned and historical correctness is NOT verified.
 *  - OUTSIDE_RECORD_EFFECTIVE_WINDOW: identity resolved at asOf (e.g. via a historical
 *    alias), but the resolved record's own declared effective window does not cover asOf.
 */
export type DescriptorTemporalStatus =
  | 'CURRENT_SNAPSHOT'
  | 'AS_OF_NOT_VERSIONED'
  | 'OUTSIDE_RECORD_EFFECTIVE_WINDOW';

export interface SecurityMasterIntegrity {
  recordOrigin: {
    classification: 'UNKNOWN';
    basis: 'NO_RECORD_SPECIFIC_ORIGIN_EVIDENCE';
  };
  /** Governed corpus revision resolved (provenance), or null for an ungoverned registration. */
  sourceRevision: GovernedSourceRevision | null;
  descriptor: {
    faceValue: DescriptorFieldStatus;
    currency: DescriptorFieldStatus;
    complete: boolean;
  };
  temporal: {
    identityResolution: 'EFFECTIVE_DATED_AS_OF';
    identityAsOf: string;
    historicalAsOfRequested: boolean;
    descriptorBasis: 'CURRENT_SNAPSHOT';
    descriptorStatus: DescriptorTemporalStatus;
    descriptorHistoricallyVerified: false;
    listingsEffectiveDated: false;
  };
  /** Reasons the quality is below GOOD (empty when GOOD). */
  qualityAnomalyCodes: string[];
  consumerEligibility: 'NOT_ASSERTED';
}

export interface ResolvedSecurityObject {
  companyId: string;
  isin: string;
  cin?: string;
  companyName: string;
  industry: string;
  sector: string;
  listings: Array<{
    exchange: 'NSE' | 'BSE';
    symbol: string;
    scripCode?: string;
    status: string;
    lotSize: number;
    tickSize: number;
  }>;
  /** Source-provided face value, or null when missing/invalid in the source (never defaulted). */
  faceValue: number | null;
  /** Source-provided supported currency, or null when missing/unsupported (never defaulted). */
  currency: 'INR' | 'USD' | null;
  provenance: ExecutiveProvenance;
  integrity: SecurityMasterIntegrity;
}

/** Classification emitted for Security Master records: no origin evidence exists (C1/C2). */
const SECURITY_MASTER_SOURCE_CLASSIFICATION: SourceClassification = 'UNCLASSIFIED';
const SECURITY_MASTER_DATA_VERSION = 'v1.0.0-sec-master';
const MS_PER_DAY = 86_400_000;

function assessFaceValue(raw: unknown): { value: number | null; status: DescriptorFieldStatus } {
  if (raw === undefined || raw === null) return { value: null, status: 'MISSING' };
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return { value: raw, status: 'SOURCE_PROVIDED' };
  return { value: null, status: 'INVALID' };
}

function assessCurrency(raw: unknown): { value: 'INR' | 'USD' | null; status: DescriptorFieldStatus } {
  if (raw === undefined || raw === null || raw === '') return { value: null, status: 'MISSING' };
  if (raw === 'INR' || raw === 'USD') return { value: raw, status: 'SOURCE_PROVIDED' };
  return { value: null, status: 'INVALID' };
}

export class ObjectResolverService {
  private securityMaster: SecurityMaster;

  constructor(securityMaster?: SecurityMaster) {
    this.securityMaster = securityMaster || new SecurityMaster();
  }

  /**
   * Resolves an incoming identifier query to the authoritative canonical object descriptor (Contract C7).
   * Fails closed (IdentityAmbiguityError) on unmapped/ambiguous identity, exactly as before.
   */
  public resolveObject(query: IdentityQuery): ResolvedSecurityObject {
    const companyId = this.securityMaster.resolveCompanyId(query);
    const entity = this.securityMaster.getEntity(companyId);

    if (!entity) {
      throw new Error(`Integrity error: Company '${companyId}' mapped but entity record missing in Security Master`);
    }

    const evaluated = new Date();
    const evaluatedAt = evaluated.toISOString();
    const asOf = query.asOf || evaluatedAt;
    const asOfMs = Date.parse(asOf);

    // ── (4) Descriptor completeness — no substitution of missing/invalid values (C4).
    const faceValue = assessFaceValue(entity.faceValue);
    const currency = assessCurrency(entity.currency);
    const qualityAnomalyCodes: string[] = [];
    if (faceValue.status === 'MISSING') qualityAnomalyCodes.push('MISSING_MANDATORY_FIELD:faceValue');
    if (faceValue.status === 'INVALID') qualityAnomalyCodes.push('OUT_OF_RANGE_VALUE:faceValue');
    if (currency.status === 'MISSING') qualityAnomalyCodes.push('MISSING_MANDATORY_FIELD:currency');
    if (currency.status === 'INVALID') qualityAnomalyCodes.push('CURRENCY_MISMATCH:currency');

    // ── (6) Temporal semantics — asOf scopes identity only; the descriptor is one snapshot.
    const historicalAsOfRequested =
      query.asOf !== undefined && Math.floor(asOfMs / MS_PER_DAY) < Math.floor(evaluated.getTime() / MS_PER_DAY);
    const recordFromMs = Date.parse(entity.effectiveFrom);
    const recordToMs = entity.effectiveTo ? Date.parse(entity.effectiveTo) : Infinity;
    const outsideRecordWindow = asOfMs < recordFromMs || asOfMs > recordToMs;

    let descriptorStatus: DescriptorTemporalStatus = 'CURRENT_SNAPSHOT';
    if (outsideRecordWindow) {
      descriptorStatus = 'OUTSIDE_RECORD_EFFECTIVE_WINDOW';
      qualityAnomalyCodes.push('DESCRIPTOR_RECORD_NOT_EFFECTIVE_AT_AS_OF');
    } else if (historicalAsOfRequested) {
      descriptorStatus = 'AS_OF_NOT_VERSIONED';
    }
    if (descriptorStatus !== 'CURRENT_SNAPSHOT') qualityAnomalyCodes.push('DESCRIPTOR_NOT_AS_OF_SCOPED');

    // ── (5) Data quality — derived, never a literal.
    const quality: QualityState = qualityAnomalyCodes.length === 0 ? 'GOOD' : 'PARTIAL';

    // ── (2) Provenance — bound to the governed corpus revision when one exists.
    const sourceRevision = this.securityMaster.sourceRevision ? { ...this.securityMaster.sourceRevision } : null;

    const lineageDigest = computeLineageHash(entity, {
      sourceClassification: SECURITY_MASTER_SOURCE_CLASSIFICATION,
      asOf,
      dataVersion: SECURITY_MASTER_DATA_VERSION,
      parentHash: sourceRevision?.fileChecksumSha256,
    });

    const provenance: ExecutiveProvenance = {
      sourceClassification: SECURITY_MASTER_SOURCE_CLASSIFICATION,
      asOf,
      evaluatedAt,
      dataVersion: SECURITY_MASTER_DATA_VERSION,
      lineageDigest,
      quality,
      replayConstraintApplied: false,
    };

    return {
      companyId: entity.companyId,
      isin: entity.isin,
      cin: entity.cin,
      companyName: entity.companyName,
      industry: entity.industry,
      sector: entity.sector,
      listings: entity.listings.map((l) => ({
        exchange: l.exchange,
        symbol: l.symbol,
        scripCode: l.scripCode,
        status: l.status,
        lotSize: l.lotSize,
        tickSize: l.tickSize,
      })),
      faceValue: faceValue.value,
      currency: currency.value,
      provenance,
      integrity: {
        recordOrigin: { classification: 'UNKNOWN', basis: 'NO_RECORD_SPECIFIC_ORIGIN_EVIDENCE' },
        sourceRevision,
        descriptor: {
          faceValue: faceValue.status,
          currency: currency.status,
          complete: faceValue.status === 'SOURCE_PROVIDED' && currency.status === 'SOURCE_PROVIDED',
        },
        temporal: {
          identityResolution: 'EFFECTIVE_DATED_AS_OF',
          identityAsOf: asOf,
          historicalAsOfRequested,
          descriptorBasis: 'CURRENT_SNAPSHOT',
          descriptorStatus,
          descriptorHistoricallyVerified: false,
          listingsEffectiveDated: false,
        },
        qualityAnomalyCodes,
        consumerEligibility: 'NOT_ASSERTED',
      },
    };
  }
}
