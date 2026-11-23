/**
 * Institutional Investment Platform System (IIPS)
 * DHAN-W27 — repeatable mapping-expansion pipeline (PROPOSAL GENERATOR).
 *
 * PURPOSE
 *   DHAN-P7 was a one-off: it qualified one retained snapshot against the P04
 *   master and published the result. W-27 turns that into an operator-rerunnable
 *   pipeline that GROWS mapping coverage and shows, for every input row, exactly
 *   what happened to it and why.
 *
 * WHAT THIS MODULE IS NOT
 *   It is NOT a qualification authority and NOT an identity rule. It does not
 *   re-implement, relax or extend the P7 identity relationship. Every row is
 *   first qualified by `qualifyInstrumentMaster` (P7, unchanged) and only then
 *   classified by this module. If P7 rejects a row, this module can only pass
 *   that rejection through with an expanded reason.
 *
 * PROPOSED IS NOT QUALIFIED
 *   Rows this pipeline would ADD are emitted as `PROPOSED_ADDITION`. Nothing
 *   here writes, upgrades or mutates the P7 qualification manifest; promotion of
 *   a proposal to a qualified mapping is W-14 work performed by an authorized
 *   operator, never by this pipeline. The runtime daemon
 *   (`loadGovernedP7InstrumentRegistry`) reads `disposition === 'QUALIFIED'` only,
 *   so a proposed row is inert by construction.
 *
 * ADDITIONAL PROPOSAL GATE (stricter than P7, never weaker)
 *   P7 may qualify several exchange series for one company (for example ISIN:X:EQ
 *   and ISIN:X:BE). A proposal has to be STRONGER than that, because adding a row
 *   changes what the platform serves for a company. So a row is only proposed
 *   when all of the following hold:
 *     - the (companyId, exchangeSegment) pair is currently unmapped, and
 *     - the snapshot offers exactly ONE series for that (companyId, segment, ISIN).
 *   A company+segment that is already served by another series of the same ISIN
 *   is a same-company/wrong-series near-match: it is rejected, never proposed.
 *   Several competing series with no authoritative series evidence is ambiguous:
 *   it is rejected, never decided by preference, ordering or name.
 *   Symbol, company name and display name are never read by this module.
 *
 * DETERMINISM
 *   No clock, no randomness, no I/O, no network, no environment. Identical inputs
 *   produce a byte-identical manifest. The manifest therefore carries no
 *   wall-clock generation time; the inputs carry their own recorded retrieval
 *   instants and SHA-256 digests, and those are what the manifest proves.
 */

import { buildD114SecurityIdentity } from '../../contracts/types.js';
import type { SecurityMaster } from '../../identity/security_master.js';
import {
  qualifyInstrumentMaster,
  type QualificationManifest,
  type QualifiedRecord,
} from './dhan_instrument_master_qualification.js';
import type { DhanInstrumentMapping } from './dhan_instrument_map.js';
import type { DhanExchangeSegment } from './dhan_dto.js';
import { parseInstrumentMasterCsv } from './dhan_instrument_master_parser.js';
import type { SourceRetrievalEvidence } from './dhan_instrument_master_source.js';

export const DHAN_MAPPING_EXPANSION_NAME = 'dhan-w27-mapping-expansion' as const;
export const DHAN_MAPPING_EXPANSION_VERSION = 1 as const;

/** Maximum number of distinct series accepted for one (companyId, segment, ISIN) before the row is ambiguous. */
const SINGLE_SERIES_REQUIRED = 1;

/**
 * A repository-held snapshot. The caller reads the bytes and computes the digest;
 * this module records and format-checks them but never downloads anything and
 * never hashes on its own (that keeps it free of node:crypto and byte-order
 * assumptions, and makes the provenance checkable by the caller's tool).
 */
export interface ExpansionInputSnapshot {
  readonly filename: string;
  readonly sourceUrl: string;
  /** Recorded retrieval instant of the snapshot (ISO-8601 UTC), taken from the retrieval manifest. */
  readonly retrievedAtUtc: string;
  /** SHA-256 of the exact bytes parsed, 64 hex characters. */
  readonly sha256: string;
  readonly sizeBytes: number;
  readonly text: string;
}

/**
 * Disposition vocabulary. Deliberately distinct from P7's `RecordDisposition`:
 * `QUALIFIED` never appears here, because this pipeline produces proposals only.
 */
export type ExpansionDisposition =
  | 'PROPOSED_ADDITION'
  | 'ALREADY_QUALIFIED'
  | 'REJECTED_NOT_EQUITY'
  | 'REJECTED_INVALID_FIELD'
  | 'REJECTED_NO_P04_CORRESPONDENCE'
  | 'REJECTED_AMBIGUOUS_IDENTITY'
  | 'REJECTED_DUPLICATE_IDENTITY'
  | 'REJECTED_CONFLICTING_PROVIDER_ID'
  | 'REJECTED_WRONG_SERIES';

/** Closed set of reasons why a row did not become a proposal. Machine-readable, stable. */
export type ExpansionReasonCode =
  | 'PROPOSED_EXACT_IDENTITY_UNMAPPED'
  | 'ALREADY_MAPPED_BY_QUALIFIED_IDENTITY'
  | 'OUT_OF_CASH_EQUITY_SCOPE'
  | 'MALFORMED_PROVIDER_IDENTITY'
  | 'NO_P04_COMPANY_FOR_ISIN'
  | 'NO_ACTIVE_P04_LISTING_FOR_EXCHANGE'
  | 'P04_IDENTITY_DISAGREEMENT'
  | 'MULTIPLE_SERIES_NO_SERIES_AUTHORITY'
  | 'SAME_ISIN_OTHER_SERIES_ALREADY_SERVED'
  | 'DUPLICATE_INPUT_ROW'
  | 'CONFLICTING_PROVIDER_ID_FOR_IDENTITY';

export interface ExpansionRecord {
  readonly inputRow: number;
  readonly disposition: ExpansionDisposition;
  readonly reasonCode: ExpansionReasonCode;
  readonly reason: string;
  readonly exchange?: string;
  readonly segment?: string;
  readonly isin?: string;
  readonly series?: string;
  readonly companyId?: string;
  /** Canonical D114 identity (`ISIN:<isin>:<series>`), when the input values form one. */
  readonly securityIdentity?: string;
  /** Dhan provider identifiers observed on the input row (evidence, not authority). */
  readonly dhanSecurityId?: string;
  /** Present only for PROPOSED_ADDITION and ALREADY_QUALIFIED. */
  readonly mapping?: DhanInstrumentMapping;
}

export interface ExpansionInputProvenance {
  readonly filename: string;
  readonly sourceUrl: string;
  readonly retrievedAtUtc: string;
  readonly sha256: string;
  readonly sizeBytes: number;
  readonly dataRows: number;
  readonly schemaError: string | null;
  readonly role: 'PRIMARY_QUALIFICATION_SOURCE' | 'RECONCILIATION_ONLY_NO_ISIN';
}

export interface ExpansionCounts {
  /** Rows read from the input snapshot; equals the number of dispositions recorded. */
  readonly inputRows: number;
  readonly proposedAdditions: number;
  readonly alreadyQualified: number;
  readonly rejected: number;
  /** Rejections that indicate two sources disagree about the same thing. */
  readonly conflicts: number;
  /** Rejections that are the pipeline's stricter proposal gate rather than a malformed input. */
  readonly heldForSeriesAuthority: number;
  /** Rows outside the cash-equity scope; counted, aggregated, and never proposed. */
  readonly outOfScope: number;
}

export interface ExpansionManifest {
  readonly task: 'DHAN-W27';
  readonly pipeline: { readonly name: string; readonly version: number };
  readonly authority: {
    readonly qualification: 'DHAN-P7 qualifyInstrumentMaster (unchanged)';
    readonly identity: 'companyId + exchangeSegment + ISIN + series (exact)';
    readonly seriesEvidence: string;
    readonly promotion: 'PROPOSED rows are not qualified; promotion is W-14 and out of scope.';
  };
  readonly inputs: readonly ExpansionInputProvenance[];
  readonly p04SourceRevision: unknown;
  readonly baseline: {
    readonly source: string;
    readonly qualifiedMappings: number;
    readonly distinctCompanies: number;
    readonly distinctIsins: number;
  };
  readonly counts: ExpansionCounts;
  readonly countsByDisposition: Readonly<Record<ExpansionDisposition, number>>;
  readonly countsByReasonCode: Readonly<Partial<Record<ExpansionReasonCode, number>>>;
  readonly coverage: {
    readonly qualifiedBefore: number;
    readonly qualifiedAfterPromotion: number;
    readonly potentialGain: number;
    readonly coverageByExchangeSeriesBefore: Readonly<Record<string, number>>;
    readonly coverageByExchangeSeriesProposed: Readonly<Record<string, number>>;
  };
  /**
   * The actionable output of this pipeline: the rows an authorised operator would
   * review for promotion (W-14). Empty is a valid, meaningful result.
   */
  readonly proposedMappings: readonly DhanInstrumentMapping[];
  /** Every in-scope row, in input order; one disposition per row. */
  readonly records: readonly ExpansionRecord[];
  /** Out-of-scope rows aggregated deterministically; totals reconcile to `counts.inputRows`. */
  readonly outOfScopeSummary: readonly {
    readonly exchange: string;
    readonly segment: string;
    readonly instrument: string;
    readonly rows: number;
  }[];
  /** Rows that could not be mapped, grouped by reason, with an exact count each. */
  readonly unmappedByReason: readonly {
    readonly reasonCode: ExpansionReasonCode;
    readonly rows: number;
    readonly explanation: string;
  }[];
  /** Size of the vendor-vs-P04 universe gap; the reason the gain can be zero. */
  readonly p04UniverseGap: {
    readonly distinctIsinsOfferedByVendor: number;
    readonly distinctIsinsWithoutP04Company: number;
    readonly explanation: string;
  };
  readonly reconciliation: {
    readonly inputRows: number;
    readonly inScopeRows: number;
    readonly outOfScopeRows: number;
    readonly dispositionTotal: number;
    readonly reconciles: boolean;
  };
}

export interface BuildExpansionOptions {
  readonly snapshot: ExpansionInputSnapshot;
  /** Optional compact master; used only to cross-check provider ids. Never carries ISIN. */
  readonly reconciliationSnapshot?: ExpansionInputSnapshot;
  readonly securityMaster: SecurityMaster;
  /** The mappings the runtime currently loads. Proposals never enter this set. */
  readonly baselineMappings: readonly DhanInstrumentMapping[];
  readonly baselineSource?: string;
  readonly p04SourceRevision?: unknown;
}

const DISPOSITIONS: readonly ExpansionDisposition[] = [
  'PROPOSED_ADDITION',
  'ALREADY_QUALIFIED',
  'REJECTED_NOT_EQUITY',
  'REJECTED_INVALID_FIELD',
  'REJECTED_NO_P04_CORRESPONDENCE',
  'REJECTED_AMBIGUOUS_IDENTITY',
  'REJECTED_DUPLICATE_IDENTITY',
  'REJECTED_CONFLICTING_PROVIDER_ID',
  'REJECTED_WRONG_SERIES',
];

const REASON_EXPLANATIONS: Readonly<Record<ExpansionReasonCode, string>> = {
  PROPOSED_EXACT_IDENTITY_UNMAPPED:
    'The row resolved to an exact P04 company by ISIN, the company has an ACTIVE listing on the row exchange, and that company+segment had no mapping. Proposed only.',
  ALREADY_MAPPED_BY_QUALIFIED_IDENTITY:
    'The exact identity is already present in the qualified registry, so the row adds nothing; it is not a gain and is not proposed again.',
  OUT_OF_CASH_EQUITY_SCOPE:
    'The row is not a cash-equity row (segment, instrument or exchange outside NSE/BSE equity); it is counted and never proposed.',
  MALFORMED_PROVIDER_IDENTITY:
    'A required provider field (security id, ISIN grammar, exchange series) is missing or malformed, so no exact identity can be formed.',
  NO_P04_COMPANY_FOR_ISIN:
    'The Dhan master carries the ISIN but the P04 master has no company with that ISIN, so no companyId can be assigned. The blocking authority is P04 coverage (universe expansion), not this pipeline.',
  NO_ACTIVE_P04_LISTING_FOR_EXCHANGE:
    'The ISIN resolves to a P04 company, but that company has no ACTIVE listing on the row exchange, so the identity would contradict P04 listing evidence.',
  P04_IDENTITY_DISAGREEMENT:
    'The P04 entity reached by the ISIN does not carry that same ISIN, so the join is not an exact identity.',
  MULTIPLE_SERIES_NO_SERIES_AUTHORITY:
    'The snapshot offers more than one exchange series for the same company+segment+ISIN and nothing authoritative selects one; choosing by row order, preference or name would be a guess.',
  SAME_ISIN_OTHER_SERIES_ALREADY_SERVED:
    'The company+segment is already served by a different exchange series of the same ISIN. This is a same-company/wrong-series near-match: it is rejected so the served security is never silently replaced.',
  DUPLICATE_INPUT_ROW:
    'An earlier row already established this exact identity with the same provider id; the later row is a duplicate of the input file.',
  CONFLICTING_PROVIDER_ID_FOR_IDENTITY:
    'An earlier row established this exact identity with a DIFFERENT provider id; two provider ids for one identity is a conflict and cannot be resolved by preference.',
};

function isHexSha256(value: string): boolean {
  return /^[0-9a-f]{64}$/i.test(value);
}

function segmentOf(exchange: string): DhanExchangeSegment | null {
  if (exchange === 'NSE') return 'NSE_EQ';
  if (exchange === 'BSE') return 'BSE_EQ';
  return null;
}

/** Identity key used for the baseline comparison: company + segment + ISIN + series. */
function identityKeyOf(mapping: DhanInstrumentMapping): string {
  const series = typeof mapping.securityId === 'string' && mapping.securityId.split(':').length === 3
    ? mapping.securityId.split(':')[2]!
    : '';
  return [mapping.companyId.trim().toUpperCase(), mapping.exchangeSegment, (mapping.isin ?? '').trim().toUpperCase(), series.trim().toUpperCase()].join('|');
}

function companySegmentKey(companyId: string, segment: DhanExchangeSegment): string {
  return `${companyId.trim().toUpperCase()}|${segment}`;
}

function emptyDispositionCounts(): Record<ExpansionDisposition, number> {
  const counts = {} as Record<ExpansionDisposition, number>;
  for (const d of DISPOSITIONS) counts[d] = 0;
  return counts;
}

/**
 * Runs the P7 qualification (unchanged) and classifies every row into a W-27
 * expansion disposition. Pure and deterministic.
 */
export function buildMappingExpansionManifest(options: BuildExpansionOptions): ExpansionManifest {
  const { snapshot, securityMaster, baselineMappings } = options;

  if (!isHexSha256(snapshot.sha256)) {
    throw new Error(
      `W-27 input provenance: '${snapshot.filename}' must carry a SHA-256 (64 hex characters) of the exact bytes parsed; got '${snapshot.sha256}'`,
    );
  }
  if (options.reconciliationSnapshot && !isHexSha256(options.reconciliationSnapshot.sha256)) {
    throw new Error(
      `W-27 input provenance: '${options.reconciliationSnapshot.filename}' must carry a SHA-256 (64 hex characters) of the exact bytes parsed`,
    );
  }

  const parsed = parseInstrumentMasterCsv(snapshot.text);
  if (parsed.schemaError) {
    throw new Error(`W-27 input '${snapshot.filename}' does not carry the required columns: ${parsed.schemaError}`);
  }

  const sourceEvidence: SourceRetrievalEvidence = {
    url: snapshot.sourceUrl,
    retrievedAtUtc: snapshot.retrievedAtUtc,
    httpStatus: null,
    contentType: 'text/csv',
    contentLength: snapshot.sizeBytes,
    rawSha256: snapshot.sha256.toLowerCase(),
    byteSize: snapshot.sizeBytes,
    ok: true,
  };

  const qualification: QualificationManifest = qualifyInstrumentMaster(parsed, securityMaster, sourceEvidence).manifest;

  // ---- Baseline: what the runtime already has.
  const baselineKeys = new Set<string>(baselineMappings.map(identityKeyOf));
  const baselineCompanySegments = new Map<string, string>();
  for (const m of baselineMappings) {
    const series = typeof m.securityId === 'string' && m.securityId.split(':').length === 3 ? m.securityId.split(':')[2]! : '';
    baselineCompanySegments.set(companySegmentKey(m.companyId, m.exchangeSegment), series.trim().toUpperCase());
  }

  // ---- Snapshot grouping: how many series the input offers per company+segment+ISIN.
  const seriesByCompanySegmentIsin = new Map<string, Set<string>>();
  for (const rec of qualification.records) {
    if (rec.disposition !== 'QUALIFIED' || !rec.mapping || !rec.isin || !rec.series) continue;
    const key = `${rec.companyId!.trim().toUpperCase()}|${rec.mapping.exchangeSegment}|${rec.isin.toUpperCase()}`;
    const set = seriesByCompanySegmentIsin.get(key) ?? new Set<string>();
    set.add(rec.series.toUpperCase());
    seriesByCompanySegmentIsin.set(key, set);
  }

  const countsByDisposition = emptyDispositionCounts();
  const records: ExpansionRecord[] = [];
  const outOfScopeCounts = new Map<string, number>();
  const valuesByLine = new Map<number, Record<string, string>>();
  for (const raw of parsed.records) valuesByLine.set(raw.lineNumber, raw.values);
  const coverageBefore = new Map<string, number>();
  const coverageProposed = new Map<string, number>();

  for (const rec of qualification.records) {
    const classified = classify(rec);
    countsByDisposition[classified.disposition]++;
    if (classified.disposition === 'REJECTED_NOT_EQUITY') {
      const v = valuesByLine.get(rec.lineNumber) ?? {};
      const key = `${v['EXCH_ID'] ?? '-'}|${v['SEGMENT'] ?? '-'}|${v['INSTRUMENT'] ?? '-'}`;
      outOfScopeCounts.set(key, (outOfScopeCounts.get(key) ?? 0) + 1);
      continue;
    }
    records.push(classified);
    if (classified.disposition === 'PROPOSED_ADDITION' && classified.mapping) {
      const k = `${classified.exchange}:${classified.series}`;
      coverageProposed.set(k, (coverageProposed.get(k) ?? 0) + 1);
    }
  }

  for (const m of baselineMappings) {
    const k = `${m.exchange}:${m.securityId?.split(':')[2] ?? '-'}`;
    coverageBefore.set(k, (coverageBefore.get(k) ?? 0) + 1);
  }

  // ---- Out-of-scope aggregation (deterministic order).
  const outOfScopeSummary = [...outOfScopeCounts.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([key, rows]) => {
      const [exchange, segment, instrument] = key.split('|');
      return { exchange: exchange!, segment: segment!, instrument: instrument!, rows };
    });

  const distinctVendorIsins = new Set<string>();
  for (const r of records) {
    if (r.isin && /^[A-Za-z0-9]{12}$/.test(r.isin)) distinctVendorIsins.add(r.isin.toUpperCase());
  }

  const inScopeRows = records.length;
  const outOfScopeRows = outOfScopeSummary.reduce((sum, e) => sum + e.rows, 0);
  const dispositionTotal = DISPOSITIONS.reduce((sum, d) => sum + countsByDisposition[d], 0);
  const inputRows = qualification.totalRows;

  const counts: ExpansionCounts = {
    inputRows,
    proposedAdditions: countsByDisposition.PROPOSED_ADDITION,
    alreadyQualified: countsByDisposition.ALREADY_QUALIFIED,
    rejected: dispositionTotal - countsByDisposition.PROPOSED_ADDITION - countsByDisposition.ALREADY_QUALIFIED,
    conflicts:
      countsByDisposition.REJECTED_CONFLICTING_PROVIDER_ID +
      countsByDisposition.REJECTED_DUPLICATE_IDENTITY +
      countsByDisposition.REJECTED_WRONG_SERIES +
      countsByDisposition.REJECTED_AMBIGUOUS_IDENTITY,
    heldForSeriesAuthority:
      countsByDisposition.REJECTED_WRONG_SERIES + countsByDisposition.REJECTED_AMBIGUOUS_IDENTITY,
    outOfScope: countsByDisposition.REJECTED_NOT_EQUITY,
  };

  const countsByReasonCode: Partial<Record<ExpansionReasonCode, number>> = {};
  for (const rec of records) {
    countsByReasonCode[rec.reasonCode] = (countsByReasonCode[rec.reasonCode] ?? 0) + 1;
  }
  // Out-of-scope rows share one reason code; count them too so the totals reconcile.
  if (countsByDisposition.REJECTED_NOT_EQUITY > 0) {
    countsByReasonCode.OUT_OF_CASH_EQUITY_SCOPE = countsByDisposition.REJECTED_NOT_EQUITY;
  }

  const unmappedByReason = (Object.keys(REASON_EXPLANATIONS) as ExpansionReasonCode[])
    .filter((code) => code !== 'PROPOSED_EXACT_IDENTITY_UNMAPPED' && code !== 'ALREADY_MAPPED_BY_QUALIFIED_IDENTITY')
    .map((code) => ({ reasonCode: code, rows: countsByReasonCode[code] ?? 0, explanation: REASON_EXPLANATIONS[code] }))
    .filter((e) => e.rows > 0);

  const proposedMappings = records
    .filter((r) => r.disposition === 'PROPOSED_ADDITION' && r.mapping)
    .map((r) => r.mapping!);

  // Distinct ISINs the vendor master offers in cash-equity scope that P04 does not
  // carry. This is the precise size of the universe gap the pipeline cannot close
  // itself, because assigning a companyId without P04 ISIN evidence would be a guess.
  const unmappedIsins = new Set<string>();
  for (const r of records) {
    if (r.reasonCode === 'NO_P04_COMPANY_FOR_ISIN' && r.isin) unmappedIsins.add(r.isin.toUpperCase());
  }

  const baselineCompanies = new Set(baselineMappings.map((m) => m.companyId.trim().toUpperCase()));
  const baselineIsins = new Set(baselineMappings.map((m) => (m.isin ?? '').trim().toUpperCase()).filter(Boolean));

  const sortedRecord = (m: ReadonlyMap<string, number>): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const k of [...m.keys()].sort()) out[k] = m.get(k)!;
    return out;
  };

  const inputs: ExpansionInputProvenance[] = [
    {
      filename: snapshot.filename,
      sourceUrl: snapshot.sourceUrl,
      retrievedAtUtc: snapshot.retrievedAtUtc,
      sha256: snapshot.sha256.toLowerCase(),
      sizeBytes: snapshot.sizeBytes,
      dataRows: parsed.records.length,
      schemaError: null,
      role: 'PRIMARY_QUALIFICATION_SOURCE',
    },
  ];
  if (options.reconciliationSnapshot) {
    const recon = options.reconciliationSnapshot;
    const reconParsed = parseInstrumentMasterCsv(recon.text, [
      'SEM_EXM_EXCH_ID',
      'SEM_SEGMENT',
      'SEM_SMST_SECURITY_ID',
      'SEM_SERIES',
      'SEM_INSTRUMENT_NAME',
    ]);
    inputs.push({
      filename: recon.filename,
      sourceUrl: recon.sourceUrl,
      retrievedAtUtc: recon.retrievedAtUtc,
      sha256: recon.sha256.toLowerCase(),
      sizeBytes: recon.sizeBytes,
      dataRows: reconParsed.records.length,
      schemaError: reconParsed.schemaError,
      role: 'RECONCILIATION_ONLY_NO_ISIN',
    });
  }

  return {
    task: 'DHAN-W27',
    pipeline: { name: DHAN_MAPPING_EXPANSION_NAME, version: DHAN_MAPPING_EXPANSION_VERSION },
    authority: {
      qualification: 'DHAN-P7 qualifyInstrumentMaster (unchanged)',
      identity: 'companyId + exchangeSegment + ISIN + series (exact)',
      seriesEvidence:
        'The exchange series is taken from the official Dhan master SERIES column, the same evidence P7 qualifies on. P04 does not carry exchange series. No symbol, company-name or display-name value is read.',
      promotion: 'PROPOSED rows are not qualified; promotion is W-14 and out of scope.',
    },
    inputs,
    p04SourceRevision: options.p04SourceRevision ?? null,
    baseline: {
      source: options.baselineSource ?? 'loadGovernedP7InstrumentRegistry (runtime loader, QUALIFIED rows only)',
      qualifiedMappings: baselineMappings.length,
      distinctCompanies: baselineCompanies.size,
      distinctIsins: baselineIsins.size,
    },
    counts,
    countsByDisposition,
    countsByReasonCode,
    coverage: {
      qualifiedBefore: baselineMappings.length,
      qualifiedAfterPromotion: baselineMappings.length + countsByDisposition.PROPOSED_ADDITION,
      potentialGain: countsByDisposition.PROPOSED_ADDITION,
      coverageByExchangeSeriesBefore: sortedRecord(coverageBefore),
      coverageByExchangeSeriesProposed: sortedRecord(coverageProposed),
    },
    proposedMappings,
    records,
    outOfScopeSummary,
    unmappedByReason,
    p04UniverseGap: {
      distinctIsinsOfferedByVendor: distinctVendorIsins.size,
      distinctIsinsWithoutP04Company: unmappedIsins.size,
      explanation:
        'Cash-equity ISINs in the vendor master with no P04 company. A companyId cannot be assigned from ISIN evidence that does not exist; closing this gap is universe expansion (W-28), not a mapping rule change.',
    },
    reconciliation: {
      inputRows,
      inScopeRows,
      outOfScopeRows,
      dispositionTotal,
      reconciles:
        dispositionTotal === inputRows &&
        inScopeRows + outOfScopeRows === inputRows &&
        records.length === inScopeRows,
    },
  };

  /** Classifies one P7 record. Only P7-QUALIFIED rows can become proposals. */
  function classify(rec: QualifiedRecord): ExpansionRecord {
    const base = {
      inputRow: rec.lineNumber,
      exchange: rec.exchange,
      segment: rec.segment,
      isin: rec.isin,
      series: rec.series,
      companyId: rec.companyId,
      securityIdentity: rec.securityIdentity?.securityId,
      dhanSecurityId: rec.dhanSecurityId,
    };

    switch (rec.disposition) {
      case 'REJECTED_NOT_EQUITY':
        return { ...base, disposition: 'REJECTED_NOT_EQUITY', reasonCode: 'OUT_OF_CASH_EQUITY_SCOPE', reason: rec.reason };
      case 'REJECTED_SCHEMA':
        return { ...base, disposition: 'REJECTED_INVALID_FIELD', reasonCode: 'MALFORMED_PROVIDER_IDENTITY', reason: rec.reason };
      case 'REJECTED_INVALID_FIELD':
        return { ...base, disposition: 'REJECTED_INVALID_FIELD', reasonCode: 'MALFORMED_PROVIDER_IDENTITY', reason: rec.reason };
      case 'REJECTED_NO_P04_CORRESPONDENCE':
        return {
          ...base,
          disposition: 'REJECTED_NO_P04_CORRESPONDENCE',
          reasonCode: rec.reason.startsWith('no active P04')
            ? 'NO_ACTIVE_P04_LISTING_FOR_EXCHANGE'
            : 'NO_P04_COMPANY_FOR_ISIN',
          reason: rec.reason,
        };
      case 'REJECTED_AMBIGUOUS_IDENTITY':
        return { ...base, disposition: 'REJECTED_AMBIGUOUS_IDENTITY', reasonCode: 'P04_IDENTITY_DISAGREEMENT', reason: rec.reason };
      case 'DUPLICATE_IDENTITY':
        return { ...base, disposition: 'REJECTED_DUPLICATE_IDENTITY', reasonCode: 'DUPLICATE_INPUT_ROW', reason: rec.reason };
      case 'CONFLICTING_PROVIDER_ID':
        return { ...base, disposition: 'REJECTED_CONFLICTING_PROVIDER_ID', reasonCode: 'CONFLICTING_PROVIDER_ID_FOR_IDENTITY', reason: rec.reason };
      case 'QUALIFIED':
        break;
    }

    // P7 qualified this row on exact identity. Now apply the W-27 proposal gate.
    const mapping = rec.mapping!;
    const identity = buildD114SecurityIdentity(rec.isin, rec.series)!;
    const exactKey = [mapping.companyId.trim().toUpperCase(), mapping.exchangeSegment, identity.isin.toUpperCase(), identity.series.toUpperCase()].join('|');

    if (baselineKeys.has(exactKey)) {
      // No mapping payload: it already exists in the qualified manifest, and this
      // pipeline does not restate or re-version a qualified row.
      return {
        ...base,
        disposition: 'ALREADY_QUALIFIED',
        reasonCode: 'ALREADY_MAPPED_BY_QUALIFIED_IDENTITY',
        reason: `exact identity ${identity.securityId} is already qualified on ${mapping.exchangeSegment}`,
      };
    }

    const seg = mapping.exchangeSegment;
    const groupKey = `${mapping.companyId.trim().toUpperCase()}|${seg}|${identity.isin.toUpperCase()}`;
    const offeredSeries = seriesByCompanySegmentIsin.get(groupKey) ?? new Set<string>([identity.series.toUpperCase()]);

    if (offeredSeries.size > SINGLE_SERIES_REQUIRED) {
      return {
        ...base,
        disposition: 'REJECTED_AMBIGUOUS_IDENTITY',
        reasonCode: 'MULTIPLE_SERIES_NO_SERIES_AUTHORITY',
        reason:
          `companyId ${mapping.companyId} on ${seg} offers ${offeredSeries.size} series of ISIN ${identity.isin} ` +
          `(${[...offeredSeries].sort().join(',')}); no authoritative series evidence selects ${identity.series}`,
      };
    }

    const existingSeries = baselineCompanySegments.get(companySegmentKey(mapping.companyId, seg));
    if (existingSeries !== undefined && existingSeries !== identity.series.toUpperCase()) {
      return {
        ...base,
        disposition: 'REJECTED_WRONG_SERIES',
        reasonCode: 'SAME_ISIN_OTHER_SERIES_ALREADY_SERVED',
        reason:
          `companyId ${mapping.companyId} on ${seg} is already served by series ${existingSeries} of ISIN ${identity.isin}; ` +
          `${identity.series} is a same-company/wrong-series near-match and is not proposed`,
      };
    }

    return {
      ...base,
      disposition: 'PROPOSED_ADDITION',
      reasonCode: 'PROPOSED_EXACT_IDENTITY_UNMAPPED',
      reason: `exact identity ${identity.securityId} on ${seg} is unmapped; proposed, not qualified`,
      mapping,
    };
  }
}

/**
 * Renders the operator-facing report. Deterministic; derived only from the manifest.
 */
export function renderMappingExpansionReport(manifest: ExpansionManifest): string {
  const c = manifest.counts;
  const gain = manifest.coverage.potentialGain;
  const rows: string[] = [
    '# DHAN-W27 Mapping Expansion Report',
    '',
    'Proposal generator only. PROPOSED rows are not qualified mappings and are never loaded by the runtime daemon.',
    '',
    '## Inputs (repository-held snapshots, SHA-256 provenance)',
    '',
    '| Role | File | Rows | SHA-256 |',
    '|---|---|---|---|',
    ...manifest.inputs.map((i) => `| ${i.role} | \`${i.filename}\` | ${i.dataRows} | \`${i.sha256}\` |`),
    '',
    '## Dispositions (every input row is accounted for)',
    '',
    `- Input rows: **${c.inputRows}**`,
    `- In cash-equity scope: ${manifest.reconciliation.inScopeRows}`,
    `- Out of scope (non-equity): ${c.outOfScope}`,
    `- Proposed additions: **${c.proposedAdditions}**`,
    `- Distinct cash-equity ISINs the vendor offers: ${manifest.p04UniverseGap.distinctIsinsOfferedByVendor}`,
    `- Of those, ISINs with no P04 company (universe gap, W-28): **${manifest.p04UniverseGap.distinctIsinsWithoutP04Company}**`,
    `- Already qualified: ${c.alreadyQualified}`,
    `- Rejected: ${c.rejected} (of which conflicts/ambiguity: ${c.conflicts})`,
    `- Reconciliation holds: ${manifest.reconciliation.reconciles ? 'yes' : 'NO'}`,
    '',
    '| Disposition | Rows |',
    '|---|---|',
    ...(Object.entries(manifest.countsByDisposition) as [string, number][]).map(([k, v]) => `| ${k} | ${v} |`),
    '',
    '## Why rows were not mapped',
    '',
    '| Reason code | Rows | Explanation |',
    '|---|---|---|',
    ...manifest.unmappedByReason.map((u) => `| ${u.reasonCode} | ${u.rows} | ${u.explanation.replace(/\|/g, '\\|')} |`),
    '',
    '## Proposed mappings (review list for W-14 — not applied here)',
    '',
    manifest.proposedMappings.length === 0
      ? 'None. Every exact-identity row this snapshot offers is already qualified, so this run proposes no change.'
      : '| companyId | exchange segment | ISIN | series | Dhan security id |',
    ...(manifest.proposedMappings.length === 0
      ? []
      : [
          '|---|---|---|---|---|',
          ...manifest.proposedMappings.map(
            (m) => `| ${m.companyId} | ${m.exchangeSegment} | ${m.isin} | ${m.securityId?.split(':')[2]} | ${m.dhanSecurityId} |`,
          ),
        ]),
    '',
    '## Coverage',
    '',
    `- Qualified mappings before: ${manifest.coverage.qualifiedBefore}`,
    `- Potential gain from this snapshot: ${gain}`,
    `- Coverage if every proposal were promoted (NOT done here): ${manifest.coverage.qualifiedAfterPromotion}`,
    `- Baseline by exchange:series: ${JSON.stringify(manifest.coverage.coverageByExchangeSeriesBefore)}`,
    `- Proposed by exchange:series: ${JSON.stringify(manifest.coverage.coverageByExchangeSeriesProposed)}`,
    '',
    '## Operator rerun',
    '',
    '```',
    'npm run dhan:w27-expand            # write evidence/dhan-w27/{expansion-manifest.json,expansion-report.md}',
    'npm run dhan:w27-expand -- --check # verify a rerun is byte-identical; non-zero exit on drift',
    '```',
    '',
  ];
  return rows.join('\n');
}
