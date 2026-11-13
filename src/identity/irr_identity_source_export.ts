/**
 * Institutional Investment Platform System (IIPS)
 * W04 — export of the governed P04 security master into IRR identity sources.
 *
 * IRR's identity endpoint reads three operator-provisioned files from
 * `<IIPS_DATA_DIR>/investment/identity/` (schema `IIPS_INVESTMENT_IDENTITY_V1`):
 * `eligible-roster.json`, `listing-map.json` and `corporate-actions.json`. No repository produced
 * them. This module derives them from the governed P04 security master, the only governed
 * security master the two repositories hold. IRR stays the owner of the schema, the loader and the
 * resolver: the files written here are a candidate, and the gate is IRR's own loader, run on the
 * staged files before anything is installed (`scripts/provision-irr-identity-sources.mjs`).
 *
 * AUTHORITY. This module does not widen the authority of P04. `docs/p01/P01_IDENTITY_AND_LINEAGE.md`
 * ID-4 states that P04 is not authorized as product-wide authoritative identity, and the deposited
 * master is a one-time `OFFLINE_BOOTSTRAP` deposition. Installing the export as IRR's eligible
 * roster is an operator decision; IRR records the roster as `OPERATOR_SUPPLIED`. Every report
 * states this as limitation `SOURCE_AUTHORITY_CONDITIONAL`.
 *
 * MAPPING `IPD-IRR-IDENTITY-EXPORT-MAPPING-1` — only fields the P04 deposition binds to the
 * exchange listing master are exported:
 *
 *   P04 `isin`                         → security `IN:ISIN:<isin>`, issuer `equityIsin`
 *   P04 `companyName`                  → issuer `legalName` (display only; IRR never matches names)
 *   P04 NSE listing `symbol`           → listing `IN:NSE:<symbol>:EQ:EQUITY`
 *   P04 universe (NSE CM, series EQ)   → listing `series` EQ, `instrumentType` EQUITY. P04 has no
 *                                        series field: series EQ is the selection rule of the
 *                                        deposited universe, known per batch (see
 *                                        `SERIES_EQ_UNIVERSE_BATCHES`); any other batch is refused
 *   P04 `effectiveFrom`                → listing `effectiveFrom` (NSE date of listing, date part)
 *   P04 `listingStatus` ACTIVE         → issuer `ELIGIBLE`, security `ASSESSABLE`, open window
 *
 * NOT exported, each for a stated reason (see `EXPORT_LIMITATIONS`):
 *
 *   P04 `cin`            recorded by the deposition as not independently verified; issuers are
 *                        keyed `IN:EQISIN:<isin>` unless an issuer-key supplement supplies a CIN
 *   P04 `sector`/`industry`  a different vocabulary with a disclosed classification limitation;
 *                        issuers are exported `UNCLASSIFIED`
 *   BSE listings         P04 carries neither a BSE listing date nor a series IRR can represent
 *   corporate actions    no approved source exists; the table is exported empty
 *
 * FAIL-CLOSED RULES
 *   - A master record with missing or conflicting identity data is WITHHELD: it is never
 *     exported, and it is listed with its reasons.
 *   - Nothing is exported unless the number of withheld records equals the number the caller
 *     explicitly acknowledged, and the same holds for required ISINs that are not covered.
 *   - An input that fails its integrity check (count, checksum, malformed or conflicting
 *     supplement) refuses the whole run.
 *
 * DETERMINISM
 *   Pure function of its inputs. No clock, no environment, no file access. Records are ordered by
 *   identifier in code-unit order and serialised with a fixed key order, so identical inputs give
 *   byte-identical files.
 *
 * Node-only (uses `node:crypto`). Deliberately not re-exported from `src/identity/index.ts`, which
 * is imported by browser bundles.
 */
import { createHash } from 'node:crypto';

import type { GovernedSourceRevision, SecurityMasterEntity } from './security_master.js';

export const IRR_IDENTITY_SCHEMA = 'IIPS_INVESTMENT_IDENTITY_V1' as const;
export const IRR_IDENTITY_EXPORT_REPORT_SCHEMA = 'IPD_IRR_IDENTITY_SOURCE_EXPORT_V1' as const;
export const IRR_IDENTITY_EXPORT_MAPPING_VERSION = 'IPD-IRR-IDENTITY-EXPORT-MAPPING-1' as const;
export const ISSUER_KEY_SUPPLEMENT_SCHEMA = 'IPD_IRR_ISSUER_KEY_SUPPLEMENT_V1' as const;

export const IRR_IDENTITY_FILE_NAMES = Object.freeze({
  roster: 'eligible-roster.json',
  listingMap: 'listing-map.json',
  corporateActions: 'corporate-actions.json',
} as const);

export type IrrIdentityFileName = (typeof IRR_IDENTITY_FILE_NAMES)[keyof typeof IRR_IDENTITY_FILE_NAMES];

/* ------------------------------------------------------------------------------------------ *
 * Identifier rules. These mirror IRR `iips-platform/src/investment/contracts/ids.ts` so that a
 * record IRR would refuse is withheld here with a reason instead of rejecting the whole set
 * later. They are a pre-check only: IRR's loader remains the gate.
 * ------------------------------------------------------------------------------------------ */

const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;
const CIN_PATTERN = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
const LISTING_SYMBOL_PATTERN = /^[A-Z0-9&\-]{1,32}$/;
const MASTER_INSTANT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T00:00:00\.000Z$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

/** ISO 6166 check: 12 characters, Luhn check digit over the expanded body. */
export function isValidIsin(value: unknown): value is string {
  if (typeof value !== 'string' || !ISIN_PATTERN.test(value)) return false;
  let digits = '';
  for (const ch of value.slice(0, 11)) {
    digits += ch >= '0' && ch <= '9' ? ch : String(ch.charCodeAt(0) - 55);
  }
  let sum = 0;
  let double = true;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = digits.charCodeAt(index) - 48;
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    double = !double;
    sum += digit;
  }
  return (10 - (sum % 10)) % 10 === Number(value[11]);
}

/** MCA company identification number, structure only. A CIN has no check digit. */
export function isStructurallyValidCin(value: unknown): value is string {
  return typeof value === 'string' && CIN_PATTERN.test(value);
}

/** The four-character issuer code of an Indian ISIN (`IN` + type + issuer code + ...). */
function indianIsinIssuerCode(isin: string): string {
  return isin.slice(3, 7);
}

function calendarDateOf(instant: unknown): string | null {
  if (typeof instant !== 'string') return null;
  const match = MASTER_INSTANT_PATTERN.exec(instant);
  if (match === null) return null;
  const [, year, month, day] = match as unknown as [string, string, string, string];
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const valid =
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day);
  return valid ? `${year}-${month}-${day}` : null;
}

export function sha256Hex(text: string | Uint8Array): string {
  return createHash('sha256').update(text).digest('hex');
}

/** Code-unit ordering. `localeCompare` is locale-dependent and would make the output host-dependent. */
function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * The checksum the P04 deposition manifest pins: SHA-256 of the record array serialised with a
 * two-space indent (`scripts/build_d05_authenticated_universe.py`). Recomputed here so an export
 * is bound to the records actually loaded, not to the label they carry.
 */
export function computeSecurityMasterChecksum(entities: ReadonlyArray<SecurityMasterEntity>): string {
  return sha256Hex(JSON.stringify(entities, null, 2));
}

/* ------------------------------------------------------------------------------------------ *
 * Inputs
 * ------------------------------------------------------------------------------------------ */

/** One record of the P7 qualification manifest (`evidence/dhan-p7/qualification-manifest.json`). */
export interface P7QualificationRecord {
  readonly disposition?: unknown;
  readonly exchange?: unknown;
  readonly isin?: unknown;
  readonly series?: unknown;
  readonly companyId?: unknown;
  readonly dhanSecurityId?: unknown;
}

/**
 * P7 is vendor evidence that IPD itself labels `NON_AUTHORITATIVE`. It supplies no exported field.
 * It is used to corroborate the series and to detect a conflict.
 */
export interface P7CorroborationInput {
  /** SHA-256 of the manifest file bytes, computed by the caller. */
  readonly sha256: string;
  readonly generatedAtUtc: string | null;
  readonly records: ReadonlyArray<P7QualificationRecord>;
}

export interface IssuerKeySupplementEntry {
  readonly isin?: unknown;
  readonly cin?: unknown;
  readonly sourceRef?: unknown;
}

/**
 * Optional, operator-supplied CINs from an authoritative registry source. An issuer named here is
 * keyed `IN:CIN:<cin>` instead of `IN:EQISIN:<isin>`. Every entry must name its source.
 */
export interface IssuerKeySupplementInput {
  /** SHA-256 of the supplement file bytes, computed by the caller. */
  readonly sha256: string;
  readonly schemaVersion?: unknown;
  readonly sourceLabel?: unknown;
  readonly entries?: unknown;
}

export interface IrrIdentityExportInput {
  readonly masterEntities: ReadonlyArray<SecurityMasterEntity>;
  readonly masterRevision: Readonly<GovernedSourceRevision>;
  readonly p7?: P7CorroborationInput | null;
  readonly issuerKeySupplement?: IssuerKeySupplementInput | null;
  /**
   * ISINs the roster is required to cover (for example the ISINs of a portfolio). Host-local: the
   * report carries counts and a digest only, never the values.
   */
  readonly requiredIsins?: ReadonlyArray<string> | null;
  /** Exact number of withheld master records the operator has reviewed and accepts. Default 0. */
  readonly acceptedWithheld?: number;
  /** Exact number of uncovered required ISINs the operator has reviewed and accepts. Default 0. */
  readonly acceptedUncovered?: number;
}

/* ------------------------------------------------------------------------------------------ *
 * Outputs
 * ------------------------------------------------------------------------------------------ */

export type WithheldReason =
  | 'ISIN_INVALID'
  | 'ISIN_NOT_INDIAN'
  | 'ISIN_DUPLICATE'
  | 'ISSUER_SHARED_ACROSS_ISINS'
  | 'ENTITY_NOT_ACTIVE'
  | 'LEGAL_NAME_MISSING'
  | 'NSE_LISTING_MISSING'
  | 'NSE_LISTING_INCONSISTENT'
  | 'NSE_LISTING_NOT_ACTIVE'
  | 'NSE_SYMBOL_NOT_REPRESENTABLE'
  | 'NSE_SYMBOL_DUPLICATE'
  | 'LISTING_DATE_INVALID'
  | 'P7_NSE_SERIES_CONFLICT';

export const WITHHELD_REASON_TEXT: Readonly<Record<WithheldReason, string>> = Object.freeze({
  ISIN_INVALID: 'The ISIN is not a 12-character ISIN with a valid check digit.',
  ISIN_NOT_INDIAN: 'The ISIN does not carry the IN country prefix.',
  ISIN_DUPLICATE: 'More than one master record carries this ISIN.',
  ISSUER_SHARED_ACROSS_ISINS:
    'More than one master ISIN carries this issuer code, so one legal entity has several equity securities and the master has no issuer-level key to bind them.',
  ENTITY_NOT_ACTIVE: 'The master record is not ACTIVE or carries an end date.',
  LEGAL_NAME_MISSING: 'The master record has no company name.',
  NSE_LISTING_MISSING: 'The master record has no NSE listing or no NSE symbol.',
  NSE_LISTING_INCONSISTENT: 'The NSE symbol and the NSE listing rows of the master record disagree.',
  NSE_LISTING_NOT_ACTIVE: 'The NSE listing of the master record is not ACTIVE.',
  NSE_SYMBOL_NOT_REPRESENTABLE: 'The NSE symbol is outside the symbol grammar of an IRR listing identifier.',
  NSE_SYMBOL_DUPLICATE: 'More than one master record carries this NSE symbol.',
  LISTING_DATE_INVALID: 'The listing date is not a valid calendar date at midnight UTC.',
  P7_NSE_SERIES_CONFLICT: 'The P7 vendor master records an NSE series other than EQ for this ISIN.',
});

export interface WithheldRecord {
  readonly isin: string;
  readonly nseSymbol: string | null;
  readonly reasons: ReadonlyArray<WithheldReason>;
}

export type RefusalCode =
  | 'MASTER_EMPTY'
  | 'MASTER_UNIVERSE_BASIS_UNKNOWN'
  | 'MASTER_RECORD_COUNT_MISMATCH'
  | 'MASTER_CHECKSUM_MISMATCH'
  | 'P7_MANIFEST_MALFORMED'
  | 'SUPPLEMENT_MALFORMED'
  | 'SUPPLEMENT_ENTRY_INVALID'
  | 'SUPPLEMENT_DUPLICATE_ISIN'
  | 'SUPPLEMENT_CIN_CLAIMED_TWICE'
  | 'SUPPLEMENT_ISIN_NOT_EXPORTED'
  | 'REQUIRED_ISIN_INVALID'
  | 'ACKNOWLEDGEMENT_INVALID'
  | 'OUTPUT_INVARIANT_VIOLATION';

export interface Refusal {
  readonly code: RefusalCode;
  readonly detail: string;
}

export type IncompleteCode = 'WITHHELD_NOT_ACKNOWLEDGED' | 'REQUIRED_ISINS_NOT_COVERED';

export interface Incomplete {
  readonly code: IncompleteCode;
  readonly detail: string;
}

export interface ExportLimitation {
  readonly code:
    | 'CIN_NOT_EXPORTED'
    | 'SECTOR_UNCLASSIFIED'
    | 'BSE_LISTINGS_NOT_EXPORTED'
    | 'CORPORATE_ACTIONS_EMPTY'
    | 'NO_SYMBOL_HISTORY'
    | 'ELIGIBLE_MEANS_ACTIVE_NSE_LISTING'
    | 'SERIES_FROM_UNIVERSE_DEFINITION'
    | 'SOURCE_AUTHORITY_CONDITIONAL';
  readonly detail: string;
  readonly missingDataset: string | null;
  readonly requiredFields: ReadonlyArray<string>;
}

/** Standing limitations of mapping 1. They hold for every run and are stated in every report. */
export const EXPORT_LIMITATIONS: ReadonlyArray<ExportLimitation> = Object.freeze([
  Object.freeze({
    code: 'CIN_NOT_EXPORTED' as const,
    detail:
      'The P04 deposition records its CIN field as carried from a published bridge file and not independently verified. A CIN has no check digit, and IRR treats the roster as the confirmation of a CIN, so an unverified CIN is not exported. Issuers are keyed IN:EQISIN:<isin> with cin null, unless an issuer-key supplement supplies the CIN.',
    missingDataset: 'Registry-verified CIN per equity ISIN (MCA company master joined to the exchange listing master).',
    requiredFields: Object.freeze(['isin', 'cin', 'sourceRef']),
  }),
  Object.freeze({
    code: 'SECTOR_UNCLASSIFIED' as const,
    detail:
      'The P04 sector and industry come from a taxonomy file with a disclosed systematic-classification limitation and use a vocabulary IRR does not use. Every issuer is exported with sector UNCLASSIFIED, the value the IRR loader itself assigns when no sector is supplied, and subSegment null.',
    missingDataset: 'Governed sector classification per issuer in the sector vocabulary of the IRR assessment engines.',
    requiredFields: Object.freeze(['isin', 'sector', 'subSegment', 'sourceRef']),
  }),
  Object.freeze({
    code: 'BSE_LISTINGS_NOT_EXPORTED' as const,
    detail:
      'P04 carries a BSE scrip code for dual-listed securities but no BSE listing date, and the BSE group is not a series the IRR listing identifier can represent. No BSE listing is exported. An observation that names BSE is therefore not resolved to a listing.',
    missingDataset: 'BSE listing master for the exported ISINs, and an IRR decision on how a BSE group maps to a listing series.',
    requiredFields: Object.freeze(['isin', 'scripCode', 'group', 'listingDate', 'status']),
  }),
  Object.freeze({
    code: 'CORPORATE_ACTIONS_EMPTY' as const,
    detail:
      'Neither repository holds an approved corporate-action dataset. corporate-actions.json is exported with an empty actions array. Empty means that no action is recorded. It does not mean that none occurred.',
    missingDataset: 'Exchange corporate-action register for the exported ISINs.',
    requiredFields: Object.freeze([
      'actionId',
      'type',
      'effectiveDate',
      'isin',
      'adjustmentFactor',
      'factorBasis',
      'successors',
      'sourceRef',
    ]),
  }),
  Object.freeze({
    code: 'NO_SYMBOL_HISTORY' as const,
    detail:
      'Each listing carries the symbol and series current in the master, with the NSE date of listing of the security as effectiveFrom. P04 has no symbol history. For a date before the master was deposited, a listing can therefore carry a symbol that was not yet in use, and a former symbol is not in the map.',
    missingDataset: 'NSE symbol-change history for the exported ISINs.',
    requiredFields: Object.freeze(['isin', 'symbol', 'series', 'effectiveFrom', 'effectiveTo', 'sourceRef']),
  }),
  Object.freeze({
    code: 'ELIGIBLE_MEANS_ACTIVE_NSE_LISTING' as const,
    detail:
      'Issuer status ELIGIBLE and security status ASSESSABLE are derived from one fact: the security is an ACTIVE NSE capital-market listing in series EQ in the P04 master. They are not an IPD eligibility or data-quality assertion.',
    missingDataset: null,
    requiredFields: Object.freeze([]),
  }),
  Object.freeze({
    code: 'SERIES_FROM_UNIVERSE_DEFINITION' as const,
    detail:
      'P04 has no series field. Every listing is exported in series EQ because the deposited universe is, by its manifest, the NSE capital-market list filtered to series EQ as of the deposition date. The series is a property of that selection, not a per-record observation, and it is as old as the deposition: a security moved to another series since then is still exported as EQ. The P7 vendor master is used to detect a contradiction, for the ISINs it covers only.',
    missingDataset: 'Current NSE listing master with the series of each ISIN, re-deposited under a governed act.',
    requiredFields: Object.freeze(['isin', 'symbol', 'series', 'asOf']),
  }),
  Object.freeze({
    code: 'SOURCE_AUTHORITY_CONDITIONAL' as const,
    detail:
      'The source is a one-time OFFLINE_BOOTSTRAP deposition of the P04 security master. P01 rule ID-4 states that P04 is not authorized as product-wide authoritative identity and that making it so requires a new ADR. This export does not change that. Using it as the IRR eligible roster is an operator decision, and IRR records the roster as OPERATOR_SUPPLIED.',
    missingDataset: null,
    requiredFields: Object.freeze([]),
  }),
]);

/**
 * Depositions whose universe is established to be the NSE capital-market list filtered to series
 * EQ. The basis is the tracked corpus manifest of each batch (`selectedTier`, `universeSource`).
 * P04 records carry no series, so a batch that is not listed here has no known series and is
 * refused: adding one is a mapping decision that must cite the manifest.
 */
export const SERIES_EQ_UNIVERSE_BATCHES: Readonly<Record<string, { readonly manifest: string; readonly selectedTier: string; readonly universeAsOf: string }>> =
  Object.freeze({
    'BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001': Object.freeze({
      manifest: 'evidence/operator_drop/d05_security_master_authenticated_universe_2026-11-08.manifest.json',
      selectedTier: 'TIER_2_ACTIVE_NSE_CM',
      universeAsOf: '2026-11-08',
    }),
  });

export interface IrrRosterIssuer {
  readonly issuerId: string;
  readonly legalName: string;
  readonly cin: string | null;
  readonly equityIsin: string;
  readonly issuerKeyBasis: 'CIN' | 'EQUITY_ISIN';
  readonly sector: 'UNCLASSIFIED';
  readonly subSegment: null;
  readonly status: 'ELIGIBLE';
  readonly statusReason: null;
  readonly foreignIssuer: false;
}

export interface IrrRosterSecurity {
  readonly securityId: string;
  readonly issuerId: string;
  readonly isin: string;
  readonly instrumentType: 'EQUITY';
  readonly status: 'ASSESSABLE';
  readonly statusReason: null;
}

export interface IrrListingEntry {
  readonly listingId: string;
  readonly securityId: string;
  readonly issuerId: string;
  readonly exchange: 'NSE';
  readonly symbol: string;
  readonly series: 'EQ';
  readonly instrumentType: 'EQUITY';
  readonly effectiveFrom: string;
  readonly effectiveTo: null;
  readonly sourceRef: string;
}

export interface IrrIdentityArtifacts {
  /** File name → exact file text (UTF-8, LF line endings, trailing newline). */
  readonly files: Readonly<Record<IrrIdentityFileName, string>>;
}

export interface FileDigest {
  readonly sha256: string;
  readonly bytes: number;
}

export interface IrrIdentityExportReport {
  readonly schemaVersion: typeof IRR_IDENTITY_EXPORT_REPORT_SCHEMA;
  readonly mappingVersion: typeof IRR_IDENTITY_EXPORT_MAPPING_VERSION;
  readonly result: 'PASS' | 'INCOMPLETE' | 'REFUSED';
  readonly identityFilesProduced: boolean;
  readonly refusals: ReadonlyArray<Refusal>;
  readonly incomplete: ReadonlyArray<Incomplete>;
  readonly inputs: {
    readonly p04SecurityMaster: {
      readonly batchId: string;
      readonly authorizationRef: string;
      readonly operatingMode: string;
      readonly declaredRecordCount: number;
      readonly observedRecordCount: number;
      readonly declaredChecksumSha256: string;
      readonly observedChecksumSha256: string;
      readonly checksumVerified: boolean;
    };
    readonly p7QualificationManifest:
      | { readonly supplied: false }
      | {
          readonly supplied: true;
          readonly role: 'CORROBORATION_ONLY';
          readonly sha256: string;
          readonly generatedAtUtc: string | null;
          readonly qualifiedRecords: number;
        };
    readonly issuerKeySupplement:
      | { readonly supplied: false }
      | { readonly supplied: true; readonly sha256: string; readonly sourceLabel: string | null; readonly entries: number };
    readonly corporateActions: { readonly supplied: false; readonly reason: 'NO_APPROVED_SOURCE' };
    readonly requiredIsins:
      | { readonly supplied: false }
      | { readonly supplied: true; readonly count: number; readonly listSha256: string };
  };
  readonly acknowledgements: { readonly acceptedWithheld: number; readonly acceptedUncovered: number };
  readonly coverage: {
    readonly master: {
      readonly records: number;
      readonly exported: number;
      readonly withheld: number;
      readonly withheldByReason: Readonly<Record<string, number>>;
    };
    readonly issuers: { readonly exported: number; readonly keyedByCin: number; readonly keyedByEquityIsin: number };
    readonly securities: { readonly exported: number };
    readonly listings: {
      readonly nse: { readonly inMaster: number; readonly exported: number };
      readonly bse: { readonly inMaster: number; readonly exported: 0 };
    };
    readonly corporateActions: { readonly exported: 0 };
    readonly masterFieldsNotExported: {
      readonly cinPresent: number;
      readonly cinStructurallyValid: number;
      readonly cinDistinct: number;
      readonly sectorPresent: number;
    };
    readonly requiredIsins: { readonly requested: number; readonly covered: number; readonly uncovered: number } | null;
  };
  readonly p7Corroboration: {
    readonly qualifiedRecords: number;
    readonly distinctIsins: number;
    readonly isinsInMaster: number;
    readonly isinsNotInMaster: number;
    readonly nseSeriesEq: number;
    readonly nseSeriesOther: number;
    readonly bseScripCodeAgrees: number;
    readonly bseScripCodeDiffers: number;
    /** P7 was built against an earlier master. A different company id is recorded; it is not an exported field. */
    readonly companyIdDiffers: number;
  } | null;
  readonly withheld: ReadonlyArray<WithheldRecord>;
  readonly limitations: ReadonlyArray<ExportLimitation>;
  readonly outputs: {
    readonly rosterLabel: string;
    readonly files: Readonly<Record<IrrIdentityFileName, FileDigest>>;
  } | null;
}

export interface IrrIdentityExportResult {
  readonly report: IrrIdentityExportReport;
  /** Present only when `report.result === 'PASS'`. */
  readonly artifacts: IrrIdentityArtifacts | null;
  /**
   * Required ISINs that are not in the exported roster. Returned to the caller for host-local
   * display only. Never part of the report.
   */
  readonly uncoveredRequiredIsins: ReadonlyArray<string>;
}

/* ------------------------------------------------------------------------------------------ *
 * Classification of master records
 * ------------------------------------------------------------------------------------------ */

interface Candidate {
  readonly entity: SecurityMasterEntity;
  readonly isin: string;
  readonly nseSymbol: string | null;
  readonly listingDate: string | null;
  readonly reasons: Set<WithheldReason>;
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function classifyMaster(
  entities: ReadonlyArray<SecurityMasterEntity>,
  p7NseSeriesByIsin: ReadonlyMap<string, ReadonlySet<string>>,
): Candidate[] {
  const candidates: Candidate[] = entities.map((entity) => {
    const reasons = new Set<WithheldReason>();
    const isin = typeof entity.isin === 'string' ? entity.isin : '';

    if (!isValidIsin(isin)) reasons.add('ISIN_INVALID');
    else if (!isin.startsWith('IN')) reasons.add('ISIN_NOT_INDIAN');

    if (entity.listingStatus !== 'ACTIVE' || entity.effectiveTo !== undefined) reasons.add('ENTITY_NOT_ACTIVE');
    if (asTrimmedString(entity.companyName) === null) reasons.add('LEGAL_NAME_MISSING');

    const listings = Array.isArray(entity.listings) ? entity.listings : [];
    const nseRows = listings.filter((listing) => listing.exchange === 'NSE');
    const declaredSymbol = typeof entity.nseSymbol === 'string' ? entity.nseSymbol : null;
    let nseSymbol: string | null = null;
    if (nseRows.length === 0 || declaredSymbol === null || declaredSymbol.length === 0) {
      reasons.add('NSE_LISTING_MISSING');
    } else if (nseRows.length !== 1 || nseRows[0]!.symbol !== declaredSymbol) {
      reasons.add('NSE_LISTING_INCONSISTENT');
    } else {
      nseSymbol = declaredSymbol;
      if (nseRows[0]!.status !== 'ACTIVE') reasons.add('NSE_LISTING_NOT_ACTIVE');
      // The symbol is exported exactly as the master carries it. A symbol that would have to be
      // trimmed or upper-cased to fit the grammar is withheld, not repaired.
      if (!LISTING_SYMBOL_PATTERN.test(declaredSymbol)) reasons.add('NSE_SYMBOL_NOT_REPRESENTABLE');
    }

    const listingDate = calendarDateOf(entity.effectiveFrom);
    if (listingDate === null) reasons.add('LISTING_DATE_INVALID');

    const p7Series = p7NseSeriesByIsin.get(isin);
    if (p7Series !== undefined && [...p7Series].some((series) => series !== 'EQ')) {
      reasons.add('P7_NSE_SERIES_CONFLICT');
    }

    return { entity, isin, nseSymbol, listingDate, reasons };
  });

  // Conflicts across records. Every record that takes part in a conflict is withheld: choosing one
  // side would be an identity decision the master does not support.
  const groupBy = (keyOf: (candidate: Candidate) => string | null): Map<string, Candidate[]> => {
    const groups = new Map<string, Candidate[]>();
    for (const candidate of candidates) {
      const key = keyOf(candidate);
      if (key === null) continue;
      const bucket = groups.get(key);
      if (bucket === undefined) groups.set(key, [candidate]);
      else bucket.push(candidate);
    }
    return groups;
  };
  const flag = (groups: Map<string, Candidate[]>, reason: WithheldReason): void => {
    for (const bucket of groups.values()) {
      if (bucket.length > 1) for (const candidate of bucket) candidate.reasons.add(reason);
    }
  };

  flag(groupBy((candidate) => (candidate.isin.length > 0 ? candidate.isin : null)), 'ISIN_DUPLICATE');
  flag(groupBy((candidate) => candidate.nseSymbol), 'NSE_SYMBOL_DUPLICATE');

  // One issuer code on several distinct ISINs: the same legal entity with more than one equity
  // security (for example ordinary shares and differential-voting-rights shares).
  const issuerGroups = new Map<string, Set<string>>();
  for (const candidate of candidates) {
    if (!isValidIsin(candidate.isin) || !candidate.isin.startsWith('IN')) continue;
    const code = indianIsinIssuerCode(candidate.isin);
    const isins = issuerGroups.get(code) ?? new Set<string>();
    isins.add(candidate.isin);
    issuerGroups.set(code, isins);
  }
  for (const candidate of candidates) {
    if (!isValidIsin(candidate.isin) || !candidate.isin.startsWith('IN')) continue;
    if ((issuerGroups.get(indianIsinIssuerCode(candidate.isin))?.size ?? 0) > 1) {
      candidate.reasons.add('ISSUER_SHARED_ACROSS_ISINS');
    }
  }

  return candidates;
}

/* ------------------------------------------------------------------------------------------ *
 * Supplement
 * ------------------------------------------------------------------------------------------ */

interface ParsedSupplement {
  readonly cinByIsin: ReadonlyMap<string, string>;
  readonly sourceLabel: string | null;
  readonly entries: number;
}

function parseSupplement(input: IssuerKeySupplementInput, refusals: Refusal[]): ParsedSupplement | null {
  if (input.schemaVersion !== ISSUER_KEY_SUPPLEMENT_SCHEMA || !Array.isArray(input.entries)) {
    refusals.push({
      code: 'SUPPLEMENT_MALFORMED',
      detail: `the issuer-key supplement must declare schemaVersion ${ISSUER_KEY_SUPPLEMENT_SCHEMA} and an entries array`,
    });
    return null;
  }
  if (!SHA256_PATTERN.test(input.sha256)) {
    refusals.push({ code: 'SUPPLEMENT_MALFORMED', detail: 'the issuer-key supplement digest is not a SHA-256 value' });
    return null;
  }
  const cinByIsin = new Map<string, string>();
  const isinByCin = new Map<string, string>();
  let failed = false;
  (input.entries as ReadonlyArray<IssuerKeySupplementEntry | null>).forEach((entry, index) => {
    const isin = entry === null || typeof entry !== 'object' ? null : entry.isin;
    const cin = entry === null || typeof entry !== 'object' ? null : entry.cin;
    const sourceRef = entry === null || typeof entry !== 'object' ? null : asTrimmedString(entry.sourceRef);
    if (!isValidIsin(isin) || !isStructurallyValidCin(cin) || sourceRef === null) {
      refusals.push({
        code: 'SUPPLEMENT_ENTRY_INVALID',
        detail: `supplement entry ${index} needs a valid isin, a structurally valid cin and a non-empty sourceRef`,
      });
      failed = true;
      return;
    }
    if (cinByIsin.has(isin)) {
      refusals.push({ code: 'SUPPLEMENT_DUPLICATE_ISIN', detail: `supplement entry ${index} repeats an ISIN` });
      failed = true;
      return;
    }
    if (isinByCin.has(cin)) {
      refusals.push({
        code: 'SUPPLEMENT_CIN_CLAIMED_TWICE',
        detail: `supplement entry ${index} assigns a CIN that another entry already assigns to a different ISIN`,
      });
      failed = true;
      return;
    }
    cinByIsin.set(isin, cin);
    isinByCin.set(cin, isin);
  });
  if (failed) return null;
  return { cinByIsin, sourceLabel: asTrimmedString(input.sourceLabel), entries: cinByIsin.size };
}

/* ------------------------------------------------------------------------------------------ *
 * Serialisation
 * ------------------------------------------------------------------------------------------ */

function serialise(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function digestOfText(text: string): FileDigest {
  const bytes = Buffer.from(text, 'utf8');
  return { sha256: sha256Hex(bytes), bytes: bytes.length };
}

export function rosterLabelFor(revision: Readonly<GovernedSourceRevision>, supplementSha256: string | null): string {
  const supplement = supplementSha256 === null ? 'none' : `sha256 ${supplementSha256}`;
  return (
    `IPD P04 security master export, NSE CM series EQ; batch ${revision.batchId}; ` +
    `master sha256 ${revision.fileChecksumSha256}; mapping ${IRR_IDENTITY_EXPORT_MAPPING_VERSION}; ` +
    `issuer-key supplement ${supplement}`
  );
}

export function listingSourceRefFor(revision: Readonly<GovernedSourceRevision>): string {
  return (
    `IPD P04 ${revision.batchId}: NSE CM listing master, series EQ. ` +
    'Symbol as carried by the master; effectiveFrom is the NSE date of listing; no symbol history.'
  );
}

/* ------------------------------------------------------------------------------------------ *
 * Independent check of the produced files
 * ------------------------------------------------------------------------------------------ */

/**
 * Check the three file texts against the structural rules of the IRR identity schema. It works on
 * the serialised text, not on the objects the generator built, so a serialisation defect is caught.
 * IRR's loader is still the gate; this refuses an export IRR would certainly refuse.
 */
export function checkIrrIdentityFiles(files: Readonly<Record<IrrIdentityFileName, string>>): string[] {
  const problems: string[] = [];
  const parse = (name: IrrIdentityFileName): Record<string, unknown> | null => {
    const text = files[name];
    if (typeof text !== 'string' || !text.endsWith('\n') || text.includes('\r')) {
      problems.push(`${name}: text must use LF line endings and end with a newline`);
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        problems.push(`${name}: root is not an object`);
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      problems.push(`${name}: not valid JSON`);
      return null;
    }
  };

  const roster = parse(IRR_IDENTITY_FILE_NAMES.roster);
  const listingMap = parse(IRR_IDENTITY_FILE_NAMES.listingMap);
  const corporateActions = parse(IRR_IDENTITY_FILE_NAMES.corporateActions);
  if (roster === null || listingMap === null || corporateActions === null) return problems;

  for (const [name, root] of [
    [IRR_IDENTITY_FILE_NAMES.roster, roster],
    [IRR_IDENTITY_FILE_NAMES.listingMap, listingMap],
    [IRR_IDENTITY_FILE_NAMES.corporateActions, corporateActions],
  ] as const) {
    if (root.schemaVersion !== IRR_IDENTITY_SCHEMA) problems.push(`${name}: schemaVersion is not ${IRR_IDENTITY_SCHEMA}`);
  }

  const label = roster.rosterLabel;
  if (typeof label !== 'string' || label.length === 0) problems.push('roster: rosterLabel is required');
  // IRR classifies a roster whose label contains this word as a fixture.
  else if (/synthetic/i.test(label)) problems.push('roster: rosterLabel must not describe the roster as synthetic');

  const issuers = Array.isArray(roster.issuers) ? (roster.issuers as Record<string, unknown>[]) : null;
  const securities = Array.isArray(roster.securities) ? (roster.securities as Record<string, unknown>[]) : null;
  const entries = Array.isArray(listingMap.entries) ? (listingMap.entries as Record<string, unknown>[]) : null;
  const actions = Array.isArray(corporateActions.actions) ? corporateActions.actions : null;
  if (issuers === null) problems.push('roster: issuers must be an array');
  if (securities === null) problems.push('roster: securities must be an array');
  if (entries === null) problems.push('listing map: entries must be an array');
  if (actions === null) problems.push('corporate actions: actions must be an array');
  if (issuers === null || securities === null || entries === null || actions === null) return problems;
  if (issuers.length === 0) problems.push('roster: no issuer');

  const issuerIds = new Set<string>();
  const claimedCins = new Set<string>();
  const claimedEquityIsins = new Set<string>();
  const equityIsinByIssuer = new Map<string, string>();
  let previous = '';
  for (const issuer of issuers) {
    const issuerId = String(issuer.issuerId);
    if (issuerId <= previous) problems.push(`roster: issuers are not strictly ordered at ${issuerId}`);
    previous = issuerId;
    if (issuerIds.has(issuerId)) problems.push(`roster: duplicate issuer ${issuerId}`);
    issuerIds.add(issuerId);
    const equityIsin = issuer.equityIsin;
    if (!isValidIsin(equityIsin)) {
      problems.push(`roster: issuer ${issuerId} has no valid equityIsin`);
      continue;
    }
    if (claimedEquityIsins.has(equityIsin)) problems.push(`roster: equity ISIN of ${issuerId} is claimed twice`);
    claimedEquityIsins.add(equityIsin);
    equityIsinByIssuer.set(issuerId, equityIsin);
    if (issuer.issuerKeyBasis === 'CIN') {
      if (!isStructurallyValidCin(issuer.cin) || issuerId !== `IN:CIN:${issuer.cin}`) {
        problems.push(`roster: issuer ${issuerId} is keyed by CIN but its cin does not match`);
      } else if (claimedCins.has(issuer.cin)) {
        problems.push(`roster: CIN of ${issuerId} is claimed twice`);
      } else {
        claimedCins.add(issuer.cin);
      }
    } else if (issuer.issuerKeyBasis === 'EQUITY_ISIN') {
      if (issuer.cin !== null || issuerId !== `IN:EQISIN:${equityIsin}`) {
        problems.push(`roster: issuer ${issuerId} is keyed by equity ISIN but its fields do not match`);
      }
    } else {
      problems.push(`roster: issuer ${issuerId} has an unknown issuerKeyBasis`);
    }
    if (typeof issuer.legalName !== 'string' || issuer.legalName.length === 0) {
      problems.push(`roster: issuer ${issuerId} has no legalName`);
    }
    if (issuer.status !== 'ELIGIBLE' || issuer.foreignIssuer !== false) {
      problems.push(`roster: issuer ${issuerId} is not exported as an eligible Indian issuer`);
    }
  }

  const securityIssuer = new Map<string, string>();
  const securityIsins = new Set<string>();
  previous = '';
  for (const security of securities) {
    const securityId = String(security.securityId);
    if (securityId <= previous) problems.push(`roster: securities are not strictly ordered at ${securityId}`);
    previous = securityId;
    const isin = security.isin;
    if (!isValidIsin(isin) || securityId !== `IN:ISIN:${isin}`) {
      problems.push(`roster: security ${securityId} is not IN:ISIN:<valid isin>`);
      continue;
    }
    if (securityIsins.has(isin)) problems.push(`roster: duplicate security ${securityId}`);
    securityIsins.add(isin);
    const issuerId = String(security.issuerId);
    if (!issuerIds.has(issuerId)) problems.push(`roster: security ${securityId} names an issuer that is not in the roster`);
    if (security.instrumentType !== 'EQUITY' || security.status !== 'ASSESSABLE') {
      problems.push(`roster: security ${securityId} is not exported as assessable equity`);
    }
    securityIssuer.set(securityId, issuerId);
  }
  for (const [issuerId, equityIsin] of equityIsinByIssuer) {
    if (securityIssuer.get(`IN:ISIN:${equityIsin}`) !== issuerId) {
      problems.push(`roster: issuer ${issuerId} declares an equity ISIN it does not own as a security`);
    }
  }

  const listingIds = new Set<string>();
  const listedSecurities = new Set<string>();
  previous = '';
  for (const entry of entries) {
    const listingId = String(entry.listingId);
    if (listingId <= previous) problems.push(`listing map: entries are not strictly ordered at ${listingId}`);
    previous = listingId;
    if (listingIds.has(listingId)) problems.push(`listing map: duplicate listing ${listingId}`);
    listingIds.add(listingId);
    const symbol = String(entry.symbol);
    if (
      entry.exchange !== 'NSE' ||
      entry.series !== 'EQ' ||
      entry.instrumentType !== 'EQUITY' ||
      !LISTING_SYMBOL_PATTERN.test(symbol) ||
      listingId !== `IN:NSE:${symbol}:EQ:EQUITY`
    ) {
      problems.push(`listing map: ${listingId} is not a canonical NSE EQ equity listing identifier`);
    }
    const securityId = String(entry.securityId);
    const issuerId = securityIssuer.get(securityId);
    if (issuerId === undefined) problems.push(`listing map: ${listingId} names a security that is not in the roster`);
    else if (entry.issuerId !== issuerId) problems.push(`listing map: ${listingId} names a different issuer than its security`);
    listedSecurities.add(securityId);
    if (typeof entry.effectiveFrom !== 'string' || calendarDateOf(`${entry.effectiveFrom}T00:00:00.000Z`) === null) {
      problems.push(`listing map: ${listingId} has no valid effectiveFrom`);
    }
    if (entry.effectiveTo !== null) problems.push(`listing map: ${listingId} must have an open window`);
    if (typeof entry.sourceRef !== 'string' || entry.sourceRef.length === 0) {
      problems.push(`listing map: ${listingId} has no sourceRef`);
    }
  }
  for (const securityId of securityIssuer.keys()) {
    if (!listedSecurities.has(securityId)) problems.push(`listing map: security ${securityId} has no listing`);
  }
  if (actions.length !== 0) problems.push('corporate actions: mapping 1 exports an empty table');

  return problems;
}

/* ------------------------------------------------------------------------------------------ *
 * The export
 * ------------------------------------------------------------------------------------------ */

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export function buildIrrIdentitySources(input: IrrIdentityExportInput): IrrIdentityExportResult {
  const refusals: Refusal[] = [];
  const incomplete: Incomplete[] = [];
  const { masterEntities, masterRevision } = input;
  const acceptedWithheld = input.acceptedWithheld ?? 0;
  const acceptedUncovered = input.acceptedUncovered ?? 0;

  if (!isNonNegativeInteger(acceptedWithheld) || !isNonNegativeInteger(acceptedUncovered)) {
    refusals.push({ code: 'ACKNOWLEDGEMENT_INVALID', detail: 'accepted counts must be non-negative integers' });
  }

  /* ---- input integrity ---- */
  const observedChecksum = computeSecurityMasterChecksum(masterEntities);
  const checksumVerified = observedChecksum === masterRevision.fileChecksumSha256;
  if (masterEntities.length === 0) {
    refusals.push({ code: 'MASTER_EMPTY', detail: 'the security master has no record' });
  }
  if (!Object.prototype.hasOwnProperty.call(SERIES_EQ_UNIVERSE_BATCHES, masterRevision.batchId)) {
    refusals.push({
      code: 'MASTER_UNIVERSE_BASIS_UNKNOWN',
      detail: 'the batch is not one whose universe is established as NSE series EQ; P04 records carry no series, so no listing series can be stated',
    });
  }
  if (masterEntities.length !== masterRevision.recordCount) {
    refusals.push({
      code: 'MASTER_RECORD_COUNT_MISMATCH',
      detail: `the revision declares ${masterRevision.recordCount} records; ${masterEntities.length} were supplied`,
    });
  }
  if (!checksumVerified) {
    refusals.push({
      code: 'MASTER_CHECKSUM_MISMATCH',
      detail: 'the supplied records do not hash to the checksum the revision declares',
    });
  }

  /* ---- P7 corroboration ---- */
  const p7NseSeriesByIsin = new Map<string, Set<string>>();
  let p7Corroboration: IrrIdentityExportReport['p7Corroboration'] = null;
  let p7Input: IrrIdentityExportReport['inputs']['p7QualificationManifest'] = { supplied: false };
  if (input.p7 !== undefined && input.p7 !== null) {
    const p7 = input.p7;
    if (!Array.isArray(p7.records) || !SHA256_PATTERN.test(p7.sha256)) {
      refusals.push({ code: 'P7_MANIFEST_MALFORMED', detail: 'the P7 manifest needs a records array and a SHA-256 digest' });
    } else {
      const masterByIsin = new Map<string, SecurityMasterEntity>();
      for (const entity of masterEntities) if (!masterByIsin.has(entity.isin)) masterByIsin.set(entity.isin, entity);
      const qualified = p7.records.filter((record) => record !== null && typeof record === 'object' && record.disposition === 'QUALIFIED');
      const distinct = new Set<string>();
      const inMaster = new Set<string>();
      const notInMaster = new Set<string>();
      let nseSeriesEq = 0;
      let nseSeriesOther = 0;
      let bseAgrees = 0;
      let bseDiffers = 0;
      const companyDiffers = new Set<string>();
      let malformed = false;
      for (const record of qualified) {
        const isin = record.isin;
        const exchange = record.exchange;
        const series = record.series;
        if (typeof isin !== 'string' || (exchange !== 'NSE' && exchange !== 'BSE') || typeof series !== 'string') {
          malformed = true;
          continue;
        }
        distinct.add(isin);
        const entity = masterByIsin.get(isin);
        if (entity === undefined) {
          notInMaster.add(isin);
          continue;
        }
        inMaster.add(isin);
        if (typeof record.companyId === 'string' && record.companyId !== entity.companyId) companyDiffers.add(isin);
        if (exchange === 'NSE') {
          const seen = p7NseSeriesByIsin.get(isin) ?? new Set<string>();
          seen.add(series);
          p7NseSeriesByIsin.set(isin, seen);
          if (series === 'EQ') nseSeriesEq += 1;
          else nseSeriesOther += 1;
        } else if (String(record.dhanSecurityId) === entity.bseScripCode) {
          bseAgrees += 1;
        } else {
          bseDiffers += 1;
        }
      }
      if (malformed) {
        refusals.push({ code: 'P7_MANIFEST_MALFORMED', detail: 'a qualified P7 record lacks an ISIN, an exchange or a series' });
      }
      p7Corroboration = {
        qualifiedRecords: qualified.length,
        distinctIsins: distinct.size,
        isinsInMaster: inMaster.size,
        isinsNotInMaster: notInMaster.size,
        nseSeriesEq,
        nseSeriesOther,
        bseScripCodeAgrees: bseAgrees,
        bseScripCodeDiffers: bseDiffers,
        companyIdDiffers: companyDiffers.size,
      };
      p7Input = {
        supplied: true,
        role: 'CORROBORATION_ONLY',
        sha256: p7.sha256,
        generatedAtUtc: p7.generatedAtUtc,
        qualifiedRecords: qualified.length,
      };
    }
  }

  /* ---- supplement ---- */
  let supplement: ParsedSupplement | null = null;
  let supplementInput: IrrIdentityExportReport['inputs']['issuerKeySupplement'] = { supplied: false };
  if (input.issuerKeySupplement !== undefined && input.issuerKeySupplement !== null) {
    supplement = parseSupplement(input.issuerKeySupplement, refusals);
    if (supplement !== null) {
      supplementInput = {
        supplied: true,
        sha256: input.issuerKeySupplement.sha256,
        sourceLabel: supplement.sourceLabel,
        entries: supplement.entries,
      };
    }
  }

  /* ---- classification ---- */
  const candidates = classifyMaster(masterEntities, p7NseSeriesByIsin);
  const exportable = candidates.filter((candidate) => candidate.reasons.size === 0);
  const withheld: WithheldRecord[] = candidates
    .filter((candidate) => candidate.reasons.size > 0)
    .map((candidate) => ({
      isin: candidate.isin,
      nseSymbol: typeof candidate.entity.nseSymbol === 'string' ? candidate.entity.nseSymbol : null,
      reasons: [...candidate.reasons].sort(byCodeUnit),
    }))
    .sort((a, b) => byCodeUnit(a.isin, b.isin) || byCodeUnit(a.nseSymbol ?? '', b.nseSymbol ?? ''));
  const withheldByReason: Record<string, number> = {};
  for (const record of withheld) {
    for (const reason of record.reasons) withheldByReason[reason] = (withheldByReason[reason] ?? 0) + 1;
  }
  const sortedWithheldByReason = Object.fromEntries(
    Object.entries(withheldByReason).sort(([a], [b]) => byCodeUnit(a, b)),
  );

  if (supplement !== null) {
    const exportableIsins = new Set(exportable.map((candidate) => candidate.isin));
    const stray = [...supplement.cinByIsin.keys()].filter((isin) => !exportableIsins.has(isin));
    if (stray.length > 0) {
      refusals.push({
        code: 'SUPPLEMENT_ISIN_NOT_EXPORTED',
        detail: `${stray.length} supplement entr${stray.length === 1 ? 'y names' : 'ies name'} an ISIN that is not an exported master record`,
      });
    }
  }

  /* ---- required ISIN coverage ---- */
  let requiredCoverage: IrrIdentityExportReport['coverage']['requiredIsins'] = null;
  let requiredInput: IrrIdentityExportReport['inputs']['requiredIsins'] = { supplied: false };
  let uncoveredRequiredIsins: string[] = [];
  if (input.requiredIsins !== undefined && input.requiredIsins !== null) {
    const invalid = input.requiredIsins.filter((isin) => !isValidIsin(isin));
    if (invalid.length > 0) {
      refusals.push({
        code: 'REQUIRED_ISIN_INVALID',
        detail: `${invalid.length} required ISIN value${invalid.length === 1 ? ' is' : 's are'} not a valid ISIN`,
      });
    }
    const required = [...new Set(input.requiredIsins.filter((isin) => isValidIsin(isin)))].sort(byCodeUnit);
    const exportableIsins = new Set(exportable.map((candidate) => candidate.isin));
    uncoveredRequiredIsins = required.filter((isin) => !exportableIsins.has(isin));
    requiredCoverage = {
      requested: required.length,
      covered: required.length - uncoveredRequiredIsins.length,
      uncovered: uncoveredRequiredIsins.length,
    };
    requiredInput = { supplied: true, count: required.length, listSha256: sha256Hex(`${required.join('\n')}\n`) };
  }

  /* ---- fail-closed completeness ---- */
  if (withheld.length !== acceptedWithheld) {
    incomplete.push({
      code: 'WITHHELD_NOT_ACKNOWLEDGED',
      detail: `${withheld.length} master record${withheld.length === 1 ? ' is' : 's are'} withheld; ${acceptedWithheld} ${acceptedWithheld === 1 ? 'was' : 'were'} acknowledged`,
    });
  }
  if (requiredCoverage !== null && requiredCoverage.uncovered !== acceptedUncovered) {
    incomplete.push({
      code: 'REQUIRED_ISINS_NOT_COVERED',
      detail: `${requiredCoverage.uncovered} required ISIN${requiredCoverage.uncovered === 1 ? ' is' : 's are'} not covered; ${acceptedUncovered} ${acceptedUncovered === 1 ? 'was' : 'were'} acknowledged`,
    });
  }

  /* ---- build the files ---- */
  let artifacts: IrrIdentityArtifacts | null = null;
  let outputs: IrrIdentityExportReport['outputs'] = null;
  let keyedByCin = 0;
  if (refusals.length === 0 && incomplete.length === 0) {
    const rosterLabel = rosterLabelFor(masterRevision, supplement === null ? null : input.issuerKeySupplement!.sha256);
    const sourceRef = listingSourceRefFor(masterRevision);
    const issuers: IrrRosterIssuer[] = [];
    const securities: IrrRosterSecurity[] = [];
    const entries: IrrListingEntry[] = [];
    for (const candidate of exportable) {
      const isin = candidate.isin;
      const cin = supplement?.cinByIsin.get(isin) ?? null;
      const issuerId = cin === null ? `IN:EQISIN:${isin}` : `IN:CIN:${cin}`;
      if (cin !== null) keyedByCin += 1;
      const securityId = `IN:ISIN:${isin}`;
      issuers.push({
        issuerId,
        legalName: (candidate.entity.companyName as string).trim(),
        cin,
        equityIsin: isin,
        issuerKeyBasis: cin === null ? 'EQUITY_ISIN' : 'CIN',
        sector: 'UNCLASSIFIED',
        subSegment: null,
        status: 'ELIGIBLE',
        statusReason: null,
        foreignIssuer: false,
      });
      securities.push({ securityId, issuerId, isin, instrumentType: 'EQUITY', status: 'ASSESSABLE', statusReason: null });
      entries.push({
        listingId: `IN:NSE:${candidate.nseSymbol!}:EQ:EQUITY`,
        securityId,
        issuerId,
        exchange: 'NSE',
        symbol: candidate.nseSymbol!,
        series: 'EQ',
        instrumentType: 'EQUITY',
        effectiveFrom: candidate.listingDate!,
        effectiveTo: null,
        sourceRef,
      });
    }
    issuers.sort((a, b) => byCodeUnit(a.issuerId, b.issuerId));
    securities.sort((a, b) => byCodeUnit(a.securityId, b.securityId));
    entries.sort((a, b) => byCodeUnit(a.listingId, b.listingId));

    const files: Record<IrrIdentityFileName, string> = {
      [IRR_IDENTITY_FILE_NAMES.roster]: serialise({ schemaVersion: IRR_IDENTITY_SCHEMA, rosterLabel, issuers, securities }),
      [IRR_IDENTITY_FILE_NAMES.listingMap]: serialise({ schemaVersion: IRR_IDENTITY_SCHEMA, entries }),
      [IRR_IDENTITY_FILE_NAMES.corporateActions]: serialise({ schemaVersion: IRR_IDENTITY_SCHEMA, actions: [] }),
    };
    const problems = checkIrrIdentityFiles(files);
    if (problems.length > 0) {
      refusals.push({
        code: 'OUTPUT_INVARIANT_VIOLATION',
        detail: `${problems.length} problem${problems.length === 1 ? '' : 's'}; first: ${problems[0]!}`,
      });
    } else {
      artifacts = { files };
      outputs = {
        rosterLabel,
        files: {
          [IRR_IDENTITY_FILE_NAMES.roster]: digestOfText(files[IRR_IDENTITY_FILE_NAMES.roster]),
          [IRR_IDENTITY_FILE_NAMES.listingMap]: digestOfText(files[IRR_IDENTITY_FILE_NAMES.listingMap]),
          [IRR_IDENTITY_FILE_NAMES.corporateActions]: digestOfText(files[IRR_IDENTITY_FILE_NAMES.corporateActions]),
        },
      };
    }
  }

  const produced = artifacts !== null;
  const cinValues = masterEntities.map((entity) => entity.cin).filter((cin): cin is string => typeof cin === 'string' && cin.length > 0);
  const report: IrrIdentityExportReport = {
    schemaVersion: IRR_IDENTITY_EXPORT_REPORT_SCHEMA,
    mappingVersion: IRR_IDENTITY_EXPORT_MAPPING_VERSION,
    result: refusals.length > 0 ? 'REFUSED' : incomplete.length > 0 ? 'INCOMPLETE' : 'PASS',
    identityFilesProduced: produced,
    refusals,
    incomplete,
    inputs: {
      p04SecurityMaster: {
        batchId: masterRevision.batchId,
        authorizationRef: masterRevision.authorizationRef,
        operatingMode: masterRevision.operatingMode,
        declaredRecordCount: masterRevision.recordCount,
        observedRecordCount: masterEntities.length,
        declaredChecksumSha256: masterRevision.fileChecksumSha256,
        observedChecksumSha256: observedChecksum,
        checksumVerified,
      },
      p7QualificationManifest: p7Input,
      issuerKeySupplement: supplementInput,
      corporateActions: { supplied: false, reason: 'NO_APPROVED_SOURCE' },
      requiredIsins: requiredInput,
    },
    acknowledgements: { acceptedWithheld, acceptedUncovered },
    coverage: {
      master: {
        records: masterEntities.length,
        exported: produced ? exportable.length : 0,
        withheld: withheld.length,
        withheldByReason: sortedWithheldByReason,
      },
      issuers: {
        exported: produced ? exportable.length : 0,
        keyedByCin: produced ? keyedByCin : 0,
        keyedByEquityIsin: produced ? exportable.length - keyedByCin : 0,
      },
      securities: { exported: produced ? exportable.length : 0 },
      listings: {
        nse: {
          inMaster: masterEntities.filter((entity) => (entity.listings ?? []).some((listing) => listing.exchange === 'NSE')).length,
          exported: produced ? exportable.length : 0,
        },
        bse: {
          inMaster: masterEntities.filter((entity) => (entity.listings ?? []).some((listing) => listing.exchange === 'BSE')).length,
          exported: 0,
        },
      },
      corporateActions: { exported: 0 },
      masterFieldsNotExported: {
        cinPresent: cinValues.length,
        cinStructurallyValid: cinValues.filter((cin) => isStructurallyValidCin(cin)).length,
        cinDistinct: new Set(cinValues).size,
        sectorPresent: masterEntities.filter((entity) => asTrimmedString(entity.sector) !== null).length,
      },
      requiredIsins: requiredCoverage,
    },
    p7Corroboration,
    withheld,
    limitations: EXPORT_LIMITATIONS,
    outputs,
  };

  return { report, artifacts, uncoveredRequiredIsins };
}

/** The report as file text. Deterministic: it carries no clock value. */
export function serialiseExportReport(report: IrrIdentityExportReport): string {
  return serialise(report);
}
