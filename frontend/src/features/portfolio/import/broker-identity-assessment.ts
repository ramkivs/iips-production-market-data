/**
 * Institutional Investment Platform System (IIPS)
 * Broker Identity Assessment & Lookup Evidence (BI-03 / P04)
 *
 * WHY THIS MODULE EXISTS
 *   The BI-03 mapper resolved identity inside a `try/catch` that (a) aborted the whole
 *   mapping at the FIRST unresolved security, and (b) surfaced only the LAST speculative
 *   lookup's error (the `BSE_SYMBOL` fallback) as the row's reason. A 68-row Dhan Web UI
 *   import therefore produced one refusal message and zero per-row lookup evidence, which is
 *   not an auditable identity outcome.
 *
 *   This module performs the same governed lookups but RECORDS every attempt for every row:
 *   what identifier the broker actually supplied, which identifier namespace was queried, in
 *   which order, what each lookup returned, and — when nothing resolved — the exact missing
 *   evidence. It never fabricates, never widens a namespace, and never infers a mapping from
 *   name similarity: the identifier value is used verbatim, exactly as the broker supplied it.
 *
 * IDENTIFIER CLASSIFICATION (evidence, not intent)
 *   'ISIN'                      — the row supplied an ISIN; it is queried first and alone.
 *   'EXCHANGE_SCOPED_SYMBOL'    — the row supplied a symbol AND an exchange; ONLY that
 *                                 exchange's namespace is queried (a BSE row is never
 *                                 resolved through NSE and vice versa).
 *   'UNSCOPED_NAME_OR_SYMBOL'   — the row supplied a display name/symbol with no ISIN and no
 *                                 exchange (e.g. DHAN_WEB_UI_SUMMARY_V1). Both symbol
 *                                 namespaces are queried verbatim, in order, because the
 *                                 governed master only holds exact keys; an exact governed
 *                                 alias (e.g. the authorized `AGI GREENPAC` → `EQ_AGI_IN`
 *                                 alias) resolves, and anything else stays unmapped. The
 *                                 classification is retained so no consumer can present such
 *                                 a row as an exchange-verified identity.
 *
 * Execution Mode: NON_PRODUCTION / OFFLINE_BOOTSTRAP_AND_LOCAL_DEV. No I/O, no network.
 */

import { IdentityAmbiguityError } from '../../../../../src/identity/quarantine.js';
import type { IdentityQuarantineRecord } from '../../../../../src/identity/quarantine.js';
import type { SecurityMaster } from '../../../../../src/identity/security_master.js';

export type BrokerIdentifierClass =
  | 'ISIN'
  | 'EXCHANGE_SCOPED_SYMBOL'
  | 'UNSCOPED_NAME_OR_SYMBOL'
  | 'NONE';

export type BrokerIdentifierType = 'ISIN' | 'NSE_SYMBOL' | 'BSE_SYMBOL';

export type BrokerLookupOutcome =
  | 'RESOLVED'
  | 'UNMAPPED_IDENTIFIER'
  | 'AMBIGUOUS_COLLISION'
  | 'EXPIRED_EFFECTIVE_DATE'
  | 'LOOKUP_ERROR';

/** One authoritative lookup, recorded as it happened. */
export interface BrokerIdentityLookup {
  readonly identifierType: BrokerIdentifierType;
  readonly identifierValue: string;
  readonly asOf: string;
  readonly outcome: BrokerLookupOutcome;
  readonly companyId?: string;
  readonly quarantineRecordId?: string;
  readonly details?: string;
}

/**
 * Why the row is in this state. Closed vocabulary — a consumer must not have to parse prose.
 */
export type BrokerIdentityRefusalCode =
  /** No identifier at all was supplied (no symbol, no ISIN). */
  | 'NO_IDENTIFIER_SUPPLIED'
  /** The security master was not supplied, so no lookup was possible (NOT an unmapped result). */
  | 'IDENTITY_NOT_EVALUATED'
  /** An exchange-scoped / ISIN identifier was queried and is absent from the governed master. */
  | 'UNMAPPED_IDENTIFIER'
  /** Two supplied identifiers, or one identifier, resolved to more than one canonical identity. */
  | 'AMBIGUOUS_COLLISION'
  /** The mapping exists but its effective dates exclude the observation instant. */
  | 'EXPIRED_EFFECTIVE_DATE'
  /** An unscoped display name/symbol found no exact governed key in either namespace. */
  | 'NO_AUTHORITATIVE_IDENTIFIER_MATCH'
  /** A numeric/schema exclusion (non-positive quantity, missing price) — not an identity result. */
  | 'EXCLUDED_BY_ROW_VALIDATION';

export type BrokerIdentityStatus = 'RESOLVED' | 'UNRESOLVED' | 'AMBIGUOUS' | 'NOT_EVALUATED' | 'EXCLUDED';

/** Per-native-row identity assessment: the durable evidence unit. */
export interface BrokerIdentityAssessment {
  /** 1-based native row index in the broker file. */
  readonly rowIndex: number;
  /** The identifier value exactly as supplied by the broker (native evidence). */
  readonly suppliedIdentifier: string;
  readonly suppliedIsin?: string;
  readonly suppliedExchange?: 'NSE' | 'BSE';
  readonly identifierClass: BrokerIdentifierClass;
  readonly lookups: readonly BrokerIdentityLookup[];
  readonly status: BrokerIdentityStatus;
  readonly refusalCode?: BrokerIdentityRefusalCode;
  readonly companyId?: string;
  /** First quarantine record for this row (P04 identity evidence). */
  readonly quarantineRecord?: IdentityQuarantineRecord;
  /** Every quarantine record produced by this row's lookups, in attempt order. */
  readonly quarantineRecords: readonly IdentityQuarantineRecord[];
  /** For unresolved rows: the precise identifier evidence the broker file must supply. */
  readonly missingEvidence?: string;
  /** Where the identity came from. `NONE` means no master was supplied (not an identity claim). */
  readonly identitySource: 'GOVERNED_SECURITY_MASTER' | 'NONE';
  readonly masterRevision?: string;
}

export interface BrokerIdentitySummary {
  readonly evaluated: number;
  readonly resolved: number;
  readonly unresolved: number;
  readonly ambiguous: number;
  readonly notEvaluated: number;
  readonly excluded: number;
  readonly identitySource: 'GOVERNED_SECURITY_MASTER' | 'NONE';
  readonly masterRevision?: string;
  /** True only when every assessed row is RESOLVED (the P04 whole-import condition). */
  readonly saveable: boolean;
  readonly refusalCodes: Readonly<Record<string, number>>;
}

export interface BrokerIdentityAssessmentRequest {
  readonly rowIndex: number;
  readonly symbol: string;
  readonly isin?: string;
  readonly exchange?: 'NSE' | 'BSE';
  readonly master?: SecurityMaster;
  readonly asOf: string;
  /** Set when the row was already excluded by row-level validation (qty/price). */
  readonly excludedReason?: string;
}

function classify(isin?: string, exchange?: 'NSE' | 'BSE', symbol?: string): BrokerIdentifierClass {
  if (isin && isin.trim()) return 'ISIN';
  if (symbol && symbol.trim()) return exchange ? 'EXCHANGE_SCOPED_SYMBOL' : 'UNSCOPED_NAME_OR_SYMBOL';
  return 'NONE';
}

function missingEvidenceFor(identifierClass: BrokerIdentifierClass): string {
  switch (identifierClass) {
    case 'ISIN':
      return 'The supplied ISIN is not registered in the governed security master; an authoritative mapping (governed deposition) is required.';
    case 'EXCHANGE_SCOPED_SYMBOL':
      return 'The exchange-scoped symbol is not registered in the governed security master; a governed mapping for that exchange listing is required.';
    case 'UNSCOPED_NAME_OR_SYMBOL':
      return 'The broker file supplies neither an ISIN nor an exchange, and the supplied name/symbol is not an exact governed mapping key or governed alias; the ISIN (preferred) or an exchange-scoped trading symbol must be supplied by the broker export.';
    case 'NONE':
    default:
      return 'The broker row supplied no identifier at all.';
  }
}

function masterRevisionOf(master?: SecurityMaster): string | undefined {
  const revision = master?.sourceRevision;
  return revision ? `${revision.batchId}:${revision.fileChecksumSha256}` : undefined;
}

/**
 * Assesses ONE native broker row. Never throws for an unmapped identifier: the outcome is
 * returned as evidence. It performs at most three exact lookups (ISIN, then the declared
 * exchange's namespace, or both namespaces when the row is unscoped).
 */
export function assessBrokerRowIdentity(request: BrokerIdentityAssessmentRequest): BrokerIdentityAssessment {
  const symbol = (request.symbol ?? '').trim();
  const isin = request.isin && request.isin.trim() ? request.isin.trim().toUpperCase() : undefined;
  const identifierClass = classify(isin, request.exchange, symbol);
  const identitySource: BrokerIdentityAssessment['identitySource'] = request.master
    ? 'GOVERNED_SECURITY_MASTER'
    : 'NONE';
  const masterRevision = masterRevisionOf(request.master);

  const base = {
    rowIndex: request.rowIndex,
    suppliedIdentifier: symbol || isin || '',
    ...(isin ? { suppliedIsin: isin } : {}),
    ...(request.exchange ? { suppliedExchange: request.exchange } : {}),
    identifierClass,
    identitySource,
    ...(masterRevision ? { masterRevision } : {}),
  } as const;

  if (request.excludedReason) {
    return {
      ...base,
      lookups: [],
      quarantineRecords: [],
      status: 'EXCLUDED',
      refusalCode: 'EXCLUDED_BY_ROW_VALIDATION',
      missingEvidence: request.excludedReason,
    };
  }

  if (!request.master) {
    // NOT an unmapped result: no lookup happened, so no identity may be claimed.
    return {
      ...base,
      lookups: [],
      quarantineRecords: [],
      status: 'NOT_EVALUATED',
      refusalCode: 'IDENTITY_NOT_EVALUATED',
      missingEvidence: 'A governed security master was not supplied to this mapping call; identity was not evaluated.',
    };
  }

  if (identifierClass === 'NONE') {
    return {
      ...base,
      lookups: [],
      quarantineRecords: [],
      status: 'UNRESOLVED',
      refusalCode: 'NO_IDENTIFIER_SUPPLIED',
      missingEvidence: missingEvidenceFor('NONE'),
    };
  }

  // The exact lookup plan for this identifier class. Never widened, never reordered.
  const plan: Array<BrokerIdentifierType> = [];
  if (identifierClass === 'ISIN') {
    plan.push('ISIN');
  } else if (identifierClass === 'EXCHANGE_SCOPED_SYMBOL') {
    plan.push(request.exchange === 'BSE' ? 'BSE_SYMBOL' : 'NSE_SYMBOL');
  } else {
    plan.push('NSE_SYMBOL', 'BSE_SYMBOL');
  }

  const lookups: BrokerIdentityLookup[] = [];
  const quarantineRecords: IdentityQuarantineRecord[] = [];
  let resolvedCompanyId: string | undefined;
  let resolvedBy: BrokerIdentifierType | undefined;
  let firstQuarantine: IdentityQuarantineRecord | undefined;
  let ambiguous = false;
  let expired = false;

  for (const identifierType of plan) {
    const identifierValue = identifierType === 'ISIN' ? (isin as string) : symbol;
    if (resolvedCompanyId !== undefined) {
      // An earlier authoritative lookup already resolved this row; the remaining namespaces
      // are not queried (a resolved identity is not re-derived through a weaker identifier).
      lookups.push({
        identifierType,
        identifierValue,
        asOf: request.asOf,
        outcome: 'UNMAPPED_IDENTIFIER',
        details: `Not queried: the row was already resolved by ${resolvedBy}.`,
      });
      continue;
    }
    try {
      const companyId = request.master.resolveCompanyId({ identifierType, identifierValue, asOf: request.asOf });
      lookups.push({ identifierType, identifierValue, asOf: request.asOf, outcome: 'RESOLVED', companyId });
      resolvedCompanyId = companyId;
      resolvedBy = identifierType;
    } catch (error) {
      if (error instanceof IdentityAmbiguityError) {
        const record = error.quarantineRecord;
        quarantineRecords.push(record);
        firstQuarantine ??= record;
        if (record.reason === 'AMBIGUOUS_COLLISION') ambiguous = true;
        if (record.reason === 'EXPIRED_EFFECTIVE_DATE') expired = true;
        lookups.push({
          identifierType,
          identifierValue,
          asOf: request.asOf,
          outcome: record.reason === 'AMBIGUOUS_COLLISION'
            ? 'AMBIGUOUS_COLLISION'
            : record.reason === 'EXPIRED_EFFECTIVE_DATE'
              ? 'EXPIRED_EFFECTIVE_DATE'
              : 'UNMAPPED_IDENTIFIER',
          quarantineRecordId: record.quarantineId,
          details: record.details,
        });
        continue;
      }
      lookups.push({
        identifierType,
        identifierValue,
        asOf: request.asOf,
        outcome: 'LOOKUP_ERROR',
        details: String(error),
      });
    }
  }

  if (resolvedCompanyId !== undefined) {
    return {
      ...base,
      lookups,
      quarantineRecords,
      status: 'RESOLVED',
      companyId: resolvedCompanyId,
    };
  }

  const status: BrokerIdentityStatus = ambiguous ? 'AMBIGUOUS' : 'UNRESOLVED';
  const refusalCode: BrokerIdentityRefusalCode = ambiguous
    ? 'AMBIGUOUS_COLLISION'
    : expired
      ? 'EXPIRED_EFFECTIVE_DATE'
      : identifierClass === 'UNSCOPED_NAME_OR_SYMBOL'
        ? 'NO_AUTHORITATIVE_IDENTIFIER_MATCH'
        : 'UNMAPPED_IDENTIFIER';

  return {
    ...base,
    lookups,
    quarantineRecords,
    status,
    refusalCode,
    ...(firstQuarantine ? { quarantineRecord: firstQuarantine } : {}),
    missingEvidence: missingEvidenceFor(identifierClass),
  };
}

/** Aggregate over every assessed row. `saveable` is the P04 whole-import condition. */
export function summariseBrokerIdentity(
  assessments: readonly BrokerIdentityAssessment[],
): BrokerIdentitySummary {
  const counts: Record<string, number> = {};
  for (const assessment of assessments) {
    if (assessment.refusalCode) counts[assessment.refusalCode] = (counts[assessment.refusalCode] ?? 0) + 1;
  }
  const resolved = assessments.filter((a) => a.status === 'RESOLVED').length;
  const excluded = assessments.filter((a) => a.status === 'EXCLUDED').length;
  const notEvaluated = assessments.filter((a) => a.status === 'NOT_EVALUATED').length;
  const ambiguous = assessments.filter((a) => a.status === 'AMBIGUOUS').length;
  const unresolved = assessments.filter((a) => a.status === 'UNRESOLVED').length;
  const first = assessments.find((a) => a.identitySource === 'GOVERNED_SECURITY_MASTER');
  return {
    evaluated: assessments.length - notEvaluated - excluded,
    resolved,
    unresolved,
    ambiguous,
    notEvaluated,
    excluded,
    identitySource: first ? 'GOVERNED_SECURITY_MASTER' : 'NONE',
    ...(first?.masterRevision ? { masterRevision: first.masterRevision } : {}),
    saveable: assessments.length > 0 && assessments.every((a) => a.status === 'RESOLVED'),
    refusalCodes: counts,
  };
}

/**
 * The typed whole-import refusal. It IS an `IdentityAmbiguityError` (so every existing P04
 * consumer keeps refusing) and it additionally carries the complete per-row evidence, so a
 * refusal can never again be reported as a single masked lookup message.
 */
export class BrokerIdentityResolutionError extends IdentityAmbiguityError {
  readonly assessments: readonly BrokerIdentityAssessment[];
  readonly summary: BrokerIdentitySummary;
  readonly refusedRowIndices: readonly number[];

  constructor(
    record: IdentityQuarantineRecord,
    assessments: readonly BrokerIdentityAssessment[],
    refusedRowIndices: readonly number[],
  ) {
    super(record);
    this.name = 'BrokerIdentityResolutionError';
    this.assessments = assessments;
    this.summary = summariseBrokerIdentity(assessments);
    this.refusedRowIndices = refusedRowIndices;
  }
}
