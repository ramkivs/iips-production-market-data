/**
 * Institutional Investment Platform System (IIPS)
 * W04 — approval of an IRR identity-source installation: the contract and its check.
 *
 * OPERATING MODEL
 *   IIPS is a personal application: one user, one local machine, no production, hosted, multi-user
 *   or commercial use. Ramki is its sole decision authority and the only approver. There is no
 *   second approver, no committee and no approval step other than the record defined here.
 *
 * WHAT THIS IS
 *   `installStagedIdentity` (`irr_identity_provisioning.ts`) places three files in the IRR data
 *   directory. This module defines the approval record (`IPD_IRR_IDENTITY_APPROVAL_V2`) and decides
 *   whether a given record authorizes a given staged export. Installation calls it before it
 *   touches the file system and refuses on any failure.
 *
 * WHAT A RECORD BINDS
 *   - the SHA-256 and the size of each of the three files;
 *   - the P04 source they were generated from: batch, authorization reference, operating mode,
 *     checksum, record count;
 *   - the generation: mapping version, corroboration and supplement inputs, required-ISIN
 *     coverage, counts;
 *   - the IRR commit whose loader accepted the files;
 *   - the IPD commit of the provisioning tool that performs the installation;
 *   - the permitted scope, the limitations accepted, the records excluded;
 *   - the approver, the time of approval and the review date;
 *   - the version of the policy below, and with it the two determinations the policy records.
 *
 * VALIDITY
 *   A record is valid from `approvedAtUtc` until `reviewDateUtc`. From the review date on,
 *   installation is refused. Renewal is a new record written by the approver; there is no other
 *   review step. Files installed earlier are not removed when the date passes.
 *
 * WHAT THIS MODULE DOES NOT DO
 *   - It creates no approval. Nothing here, and nothing in the provisioning tool, writes a record
 *     of this schema or derives one from a report. The approver authors the record.
 *   - It does not authenticate the author. A record is a local JSON file; this check establishes
 *     that the file is complete, current, made in the approver's name and bound to these bytes and
 *     this tool. On a single-user machine the file is the approver's own.
 *
 * Pure: no file access, no clock (the caller supplies `now`), no environment, no process.
 */
import {
  IRR_IDENTITY_EXPORT_MAPPING_VERSION,
  IRR_IDENTITY_FILE_NAMES,
  type FileDigest,
  type IrrIdentityExportReport,
  type IrrIdentityFileName,
} from './irr_identity_source_export.js';

export const IDENTITY_APPROVAL_SCHEMA = 'IPD_IRR_IDENTITY_APPROVAL_V2' as const;
export const IDENTITY_REVIEW_SCHEMA = 'IPD_IRR_IDENTITY_REVIEW_V2' as const;

const IDENTITY_FILES: ReadonlyArray<IrrIdentityFileName> = Object.freeze([
  IRR_IDENTITY_FILE_NAMES.roster,
  IRR_IDENTITY_FILE_NAMES.listingMap,
  IRR_IDENTITY_FILE_NAMES.corporateActions,
]);

/* ------------------------------------------------------------------------------------------ *
 * Policy: the part of the contract that the repository fixes and an approval record cannot change
 * ------------------------------------------------------------------------------------------ */

export interface ApprovalScope {
  /** Where the files may be installed and used. */
  readonly environment: string;
  /** The one consumer the files are for. */
  readonly consumer: string;
  /** The standing IRR gives the roster: operator attestation, not independent verification. */
  readonly rosterDataClass: string;
  /** P01 rule ID-4: P04 is not product-wide authoritative identity. An approval cannot say otherwise. */
  readonly productWideAuthoritativeUse: boolean;
  readonly productionUse: boolean;
  readonly hostedUse: boolean;
  readonly multiUserUse: boolean;
  readonly commercialUse: boolean;
}

const SCOPE_TEXT_FIELDS = Object.freeze(['environment', 'consumer', 'rosterDataClass'] as const);
const SCOPE_FLAG_FIELDS = Object.freeze(['productWideAuthoritativeUse', 'productionUse', 'hostedUse', 'multiUserUse', 'commercialUse'] as const);
const SCOPE_FIELDS: ReadonlyArray<keyof ApprovalScope> = Object.freeze([...SCOPE_TEXT_FIELDS, ...SCOPE_FLAG_FIELDS]);

/** The one person whose approval is required and sufficient. */
export interface ApprovalAuthority {
  readonly authorityId: string;
  readonly name: string;
  /** Descriptive. Not part of an approval record and not compared with one. */
  readonly role: string;
}

/**
 * A determination of how an existing rule bears on this installation. It is made once, here, from
 * the text of the rule; an approval record does not answer it again. The record names the policy
 * version, so an approval is always given under a known determination.
 */
export interface RuleDetermination {
  readonly rule: string;
  readonly source: string;
  readonly determination: string;
  readonly basis: ReadonlyArray<string>;
  readonly consequence: string;
}

export interface IdentityApprovalPolicy {
  readonly policyVersion: string;
  readonly decision: { readonly decisionId: string; readonly decisionRecord: string };
  readonly scope: ApprovalScope;
  readonly approver: ApprovalAuthority;
  /** Limitations that hold for every export of this tool and that the export report does not carry. */
  readonly fixedLimitationCodes: ReadonlyArray<string>;
  /**
   * The roster-content default of IRR's Investment Intelligence design. It is a design default,
   * not an enforced limit: a roster beyond it is installable, and the excess is a limitation the
   * approval must accept by name.
   */
  readonly rosterContentDefault: { readonly issuerCap: number; readonly limitationCode: string };
  /** The limitation that holds when the generation did not count coverage of a required-ISIN list. */
  readonly coverageNotMeasuredLimitationCode: string;
  readonly determinations: { readonly cv22OptionC: RuleDetermination; readonly iidRosterContentDefault: RuleDetermination };
  /** Approvals withdrawn after they were issued. A record with one of these identifiers is refused. */
  readonly revokedApprovalIds: ReadonlyArray<string>;
}

/** The governed policy. `installStagedIdentity` always uses this object. */
export const IDENTITY_APPROVAL_POLICY: IdentityApprovalPolicy = Object.freeze({
  policyVersion: 'IPD-IRR-IDENTITY-APPROVAL-POLICY-2',
  decision: Object.freeze({
    decisionId: 'IIPS-W04-D1',
    decisionRecord: 'docs/integration/IIPS-W04-IDENTITY-PROVISIONING-DECISIONS-D1-D4-2026-11-13.md',
  }),
  scope: Object.freeze({
    environment: 'LOCAL_SINGLE_USER_IIPS',
    consumer: 'IRR_INVESTMENT_IDENTITY_SOURCES',
    rosterDataClass: 'OPERATOR_SUPPLIED',
    productWideAuthoritativeUse: false,
    productionUse: false,
    hostedUse: false,
    multiUserUse: false,
    commercialUse: false,
  }),
  approver: Object.freeze({
    authorityId: 'PROGRAM_AUTHORITY_RAMKI',
    name: 'Ramki',
    role: 'Sole decision authority and approver of the local, single-user, non-production IIPS personal application',
  }),
  fixedLimitationCodes: Object.freeze(['NON_EQ_SERIES_HOLDINGS_UNRESOLVED', 'NSE_SOURCE_FILE_WITHOUT_RETRIEVAL_RECEIPT']),
  rosterContentDefault: Object.freeze({ issuerCap: 200, limitationCode: 'ROSTER_LARGER_THAN_IID_DESIGN_DEFAULT' }),
  coverageNotMeasuredLimitationCode: 'HOLDINGS_COVERAGE_NOT_MEASURED',
  determinations: Object.freeze({
    cv22OptionC: Object.freeze({
      rule: 'CV-22 Option C: five prerequisites before any expansion of the governed sector-reference universe',
      source: 'IRR docs/integration/IIPS_v3.0_CV22_OPTION_C_PA_DECISION_2026-10-19.md, section 3',
      determination: 'DOES_NOT_APPLY',
      basis: Object.freeze([
        'The rule governs proposals to expand the 13-row sector-reference universe that IRR serves to its Executive and Watchlists surfaces, with D05 as the possible source.',
        'This installation writes three files to <data root>/investment/identity and nothing else. The sector-reference universe is another data set, read by other code, and is not changed by it.',
        'Section 3.3 of the rule itself separates the sector-reference canonicalSecurityId from other identities.',
        'The files are an operator-supplied roster for one local user. They are not a product-wide universe, and the scope of this policy forbids that use.',
        'The rule also says that D05 is not an admitted IRR owner-data universe. It describes the earlier D05 payload of 2,250 records. These files are generated from the P04 master of a later replacement batch, which the rule did not assess, and they are installed as an operator-supplied roster, not admitted as an owner-data universe.',
      ]),
      consequence: 'No CV-22 prerequisite is checked. The installation target is fixed to the identity directory, so the tool cannot change the sector-reference universe.',
    }),
    iidRosterContentDefault: Object.freeze({
      rule: 'IID roster content, item Q-2: operator-curated file, seeded from holdings and watchlist, capped at 200, every row requiring an ISIN',
      source: 'IRR docs/integration/IIPS_V3_IID_INVESTMENT_INTELLIGENCE_DESIGN_REFINEMENT_2026-11-05.md, section 7.2 and R-19',
      determination: 'APPLIES_AS_DESIGN_DEFAULT_NOT_AS_LIMIT',
      basis: Object.freeze([
        'The item is about this file, the eligible roster, so it is in scope.',
        'It is recorded as a default, and R-19 calls it a data decision, not a technical blocker. The document states that it is not an authority act and creates no implementation obligation.',
        'Its stated reason is the effort of entering data for each company, not correctness. The same document says missing data degrades to partial adequacy and withheld valuation.',
        'IRR enforces no roster size: its loader accepted 2,388 issuers at the gated commit.',
        'R-17 makes the roster an operator-maintained data file; the operator is the approver.',
      ]),
      consequence:
        'A roster above 200 issuers is not refused. It carries the limitation ROSTER_LARGER_THAN_IID_DESIGN_DEFAULT, which the approval record must accept by name. A roster of 200 issuers or fewer does not carry it.',
    }),
  }),
  revokedApprovalIds: Object.freeze([]),
});

/** Whether a policy names one usable approver. A policy that does not can authorize nothing. */
export function policyIsUsable(policy: IdentityApprovalPolicy): boolean {
  return (
    policy.approver.authorityId.trim().length > 0 &&
    policy.approver.name.trim().length > 0 &&
    policy.policyVersion.trim().length > 0 &&
    Number.isInteger(policy.rosterContentDefault.issuerCap) &&
    policy.rosterContentDefault.issuerCap > 0
  );
}

/* ------------------------------------------------------------------------------------------ *
 * The approval record
 * ------------------------------------------------------------------------------------------ */

/** The P04 security master the files were generated from. Compared with the staged report. */
export interface ApprovalSource {
  readonly batchId: string;
  readonly authorizationRef: string;
  readonly operatingMode: string;
  readonly checksumSha256: string;
  readonly recordCount: number;
}

export interface ApprovalRequiredIsins {
  readonly listSha256: string;
  readonly requested: number;
  readonly covered: number;
  readonly uncovered: number;
}

/** The generation an approval is given for. Every field is compared with the staged report. */
export interface ApprovalGeneration {
  readonly reportSchemaVersion: string;
  readonly mappingVersion: string;
  readonly rosterLabel: string;
  readonly p7ManifestSha256: string | null;
  readonly issuerKeySupplementSha256: string | null;
  readonly requiredIsins: ApprovalRequiredIsins | null;
  readonly issuersExported: number;
  readonly securitiesExported: number;
  readonly nseListingsExported: number;
  readonly corporateActionsExported: number;
  readonly recordsWithheld: number;
}

export interface ApprovalSubject {
  readonly files: Readonly<Record<IrrIdentityFileName, FileDigest>>;
  readonly p04Source: ApprovalSource;
  readonly generation: ApprovalGeneration;
  /** The IRR commit whose loader gate accepted the files. */
  readonly irrCommit: string;
  /** The IPD commit of the provisioning tool that is to perform the installation. */
  readonly ipdToolCommit: string;
}

export interface ApprovalWithheldRecord {
  readonly isin: string;
  readonly reasons: ReadonlyArray<string>;
}

export interface ApproverEntry {
  readonly authorityId: string;
  readonly name: string;
  readonly decision: 'APPROVED';
  /** The approver's own words. */
  readonly statement: string;
}

export interface IdentityApprovalRecord {
  readonly schemaVersion: typeof IDENTITY_APPROVAL_SCHEMA;
  readonly approvalId: string;
  readonly status: 'APPROVED' | 'REVOKED';
  readonly policyVersion: string;
  readonly decision: { readonly decisionId: string; readonly decisionRecord: string };
  readonly subject: ApprovalSubject;
  readonly scope: ApprovalScope;
  readonly accepted: {
    readonly exportLimitationCodes: ReadonlyArray<string>;
    readonly additionalLimitationCodes: ReadonlyArray<string>;
    readonly withheldRecords: ReadonlyArray<ApprovalWithheldRecord>;
  };
  readonly approver: ApproverEntry;
  readonly approvedAtUtc: string;
  /** The review date. The approval is valid until this instant; renewal is a new record. */
  readonly reviewDateUtc: string;
  readonly revocation: { readonly revokedAtUtc: string; readonly reason: string } | null;
}

/* ------------------------------------------------------------------------------------------ *
 * Evaluation
 * ------------------------------------------------------------------------------------------ */

export type ApprovalFailureCode =
  | 'APPROVAL_MISSING'
  | 'APPROVAL_UNREADABLE'
  | 'APPROVAL_SCHEMA_UNKNOWN'
  | 'APPROVAL_MALFORMED'
  | 'APPROVAL_POLICY_UNUSABLE'
  | 'APPROVAL_REVOKED'
  | 'APPROVAL_EXPIRED'
  | 'APPROVAL_NOT_YET_VALID'
  | 'APPROVER_NOT_AUTHORIZED'
  | 'APPROVER_DID_NOT_APPROVE'
  | 'POLICY_VERSION_MISMATCH'
  | 'DECISION_REFERENCE_MISMATCH'
  | 'SCOPE_MISMATCH'
  | 'LIMITATION_MISMATCH'
  | 'EXCLUSION_MISMATCH'
  | 'DIGEST_MISMATCH'
  | 'SOURCE_MISMATCH'
  | 'GENERATION_MISMATCH'
  | 'IRR_COMMIT_MISMATCH'
  | 'IPD_TOOL_COMMIT_UNDETERMINED'
  | 'IPD_TOOL_COMMIT_MISMATCH';

export interface ApprovalFailure {
  readonly code: ApprovalFailureCode;
  readonly detail: string;
}

export interface StagedForApproval {
  readonly digests: Readonly<Record<IrrIdentityFileName, FileDigest>>;
  readonly report: IrrIdentityExportReport;
}

/**
 * What the running provisioning tool is: the commit of its checkout, and whether the code that
 * runs is the code of that commit.
 */
export interface ToolIdentity {
  /** The commit of the IPD checkout the tool runs from, or null when it could not be read. */
  readonly commit: string | null;
  /** True only when the tool's tracked source is unmodified and its build is not older than it. */
  readonly unmodified: boolean;
  /** Why `commit` is null or `unmodified` is false. Empty otherwise. No path. */
  readonly detail: string;
}

export interface ApprovalEvaluationInput {
  /** The parsed approval document, of unknown shape. */
  readonly record: unknown;
  readonly now: Date;
  readonly policy: IdentityApprovalPolicy;
  /** The staged export the approval is to authorize. Null checks the record by itself. */
  readonly staged: StagedForApproval | null;
  /** The accepted loader gate of the staged export. Null leaves the IRR commit unchecked. */
  readonly gate: { readonly irrCommit: string | null } | null;
  /** The running tool. Null leaves the IPD tool commit unchecked. */
  readonly tool: ToolIdentity | null;
}

export interface ApprovalEvaluation {
  readonly failures: ReadonlyArray<ApprovalFailure>;
  /** What was compared. An approval authorizes an installation only when all four were. */
  readonly checked: { readonly record: true; readonly stagedFiles: boolean; readonly loaderGate: boolean; readonly tool: boolean };
  /** True only when nothing failed AND the staged files, the loader gate and the tool were all compared. */
  readonly authorizesInstallation: boolean;
  readonly approval: IdentityApprovalRecord | null;
}

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const APPROVAL_ID_PATTERN = /^[A-Z0-9][A-Z0-9._-]{7,127}$/;
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

/** A UTC instant written `YYYY-MM-DDTHH:MM:SS[.sss]Z` that names a real calendar time, or null. */
export function parseApprovalTimestamp(text: unknown): number | null {
  if (typeof text !== 'string' || !TIMESTAMP_PATTERN.test(text)) return null;
  const millis = Date.parse(text);
  if (!Number.isFinite(millis)) return null;
  // Date.parse rolls an impossible day over (2026-02-30 becomes 2 March). Refuse those.
  return new Date(millis).toISOString().slice(0, 19) === text.slice(0, 19) ? millis : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A reference or a statement a person wrote: not empty, and not a template placeholder. */
function isWritten(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && !/[<>]/.test(value) && value === value.trim();
}

function sortedCopy(values: ReadonlyArray<string>): string[] {
  return [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function sameStringSet(a: ReadonlyArray<string>, b: ReadonlyArray<string>): boolean {
  if (a.length !== b.length || new Set(a).size !== a.length || new Set(b).size !== b.length) return false;
  const left = sortedCopy(a);
  const right = sortedCopy(b);
  return left.every((value, index) => value === right[index]);
}

/** The P04 source of a staged report, in the form an approval record states it. */
export function approvalSourceOf(report: IrrIdentityExportReport): ApprovalSource {
  const master = report.inputs.p04SecurityMaster;
  return {
    batchId: master.batchId,
    authorizationRef: master.authorizationRef,
    operatingMode: master.operatingMode,
    checksumSha256: master.observedChecksumSha256,
    recordCount: master.observedRecordCount,
  };
}

/** The generation identity of a staged report, in the form an approval record states it. */
export function approvalGenerationOf(report: IrrIdentityExportReport): ApprovalGeneration {
  const p7 = report.inputs.p7QualificationManifest;
  const supplement = report.inputs.issuerKeySupplement;
  const required = report.inputs.requiredIsins;
  const coverage = report.coverage.requiredIsins;
  return {
    reportSchemaVersion: report.schemaVersion,
    mappingVersion: report.mappingVersion,
    rosterLabel: report.outputs?.rosterLabel ?? '',
    p7ManifestSha256: p7.supplied ? p7.sha256 : null,
    issuerKeySupplementSha256: supplement.supplied ? supplement.sha256 : null,
    requiredIsins:
      required.supplied && coverage !== null
        ? { listSha256: required.listSha256, requested: coverage.requested, covered: coverage.covered, uncovered: coverage.uncovered }
        : null,
    issuersExported: report.coverage.issuers.exported,
    securitiesExported: report.coverage.securities.exported,
    nseListingsExported: report.coverage.listings.nse.exported,
    corporateActionsExported: report.coverage.corporateActions.exported,
    recordsWithheld: report.coverage.master.withheld,
  };
}

/** The withheld records of a staged report, in the form an approval record lists them. */
export function approvalWithheldOf(report: IrrIdentityExportReport): ApprovalWithheldRecord[] {
  return [...report.withheld]
    .map((record) => ({ isin: record.isin, reasons: sortedCopy(record.reasons) }))
    .sort((a, b) => (a.isin < b.isin ? -1 : a.isin > b.isin ? 1 : 0));
}

/**
 * The limitations, beyond those the export reports, that an approval of this staged export must
 * accept by name: the fixed ones, and the ones that follow from the staged generation.
 */
export function additionalLimitationCodesFor(policy: IdentityApprovalPolicy, report: IrrIdentityExportReport): string[] {
  const codes = [...policy.fixedLimitationCodes];
  if (report.coverage.issuers.exported > policy.rosterContentDefault.issuerCap) codes.push(policy.rosterContentDefault.limitationCode);
  if (approvalGenerationOf(report).requiredIsins === null) codes.push(policy.coverageNotMeasuredLimitationCode);
  return codes;
}

/** Every additional limitation code the policy knows, whether or not a given export carries it. */
function knownAdditionalLimitationCodes(policy: IdentityApprovalPolicy): string[] {
  return [...policy.fixedLimitationCodes, policy.rosterContentDefault.limitationCode, policy.coverageNotMeasuredLimitationCode];
}

/**
 * What the approver needs in order to write an approval record for a staged export: the facts the
 * record must bind, and the items it must accept explicitly. This is NOT an approval and cannot be
 * read as one: it has another schema and carries no approver, no decision and no date.
 *
 * `subject`, `scope` and `toBeAcceptedExplicitly` have the shape of the record's `subject`,
 * `scope` and `accepted`, so that they can be carried over without retyping a digest.
 */
export interface IdentityReviewRecord {
  readonly schemaVersion: typeof IDENTITY_REVIEW_SCHEMA;
  readonly notice: string;
  readonly installed: false;
  readonly subject: {
    readonly files: Readonly<Record<IrrIdentityFileName, FileDigest>>;
    readonly p04Source: ApprovalSource;
    readonly generation: ApprovalGeneration;
    /** Null until the IRR loader gate has accepted these files. */
    readonly irrCommit: string | null;
    /** Null unless the tool runs unmodified from a commit. */
    readonly ipdToolCommit: string | null;
  };
  readonly loaderGate: { readonly recorded: boolean; readonly accepted: boolean | null };
  readonly tool: ToolIdentity;
  readonly scope: ApprovalScope;
  readonly toBeAcceptedExplicitly: {
    readonly exportLimitationCodes: ReadonlyArray<string>;
    readonly additionalLimitationCodes: ReadonlyArray<string>;
    readonly withheldRecords: ReadonlyArray<ApprovalWithheldRecord>;
  };
  readonly approvalPolicy: {
    readonly policyVersion: string;
    readonly decisionId: string;
    readonly decisionRecord: string;
    readonly approver: { readonly authorityId: string; readonly name: string };
    readonly validity: string;
    readonly determinations: IdentityApprovalPolicy['determinations'];
  };
  /** True when every fact an approval record must bind is known. */
  readonly readyForApproval: boolean;
}

export function buildReviewRecord(
  staged: StagedForApproval,
  gate: { readonly accepted: boolean; readonly irrCommit: string | null } | null,
  tool: ToolIdentity,
  policy: IdentityApprovalPolicy = IDENTITY_APPROVAL_POLICY,
): IdentityReviewRecord {
  const irrCommit = gate !== null && gate.accepted ? gate.irrCommit : null;
  const ipdToolCommit = tool.unmodified ? tool.commit : null;
  return {
    schemaVersion: IDENTITY_REVIEW_SCHEMA,
    notice:
      'Review record. It states what an approval record for these files would have to bind. It is not an approval, it was written by the tool, and it authorizes nothing.',
    installed: false,
    subject: {
      files: Object.fromEntries(IDENTITY_FILES.map((name) => [name, { sha256: staged.digests[name].sha256, bytes: staged.digests[name].bytes }])) as Record<
        IrrIdentityFileName,
        FileDigest
      >,
      p04Source: approvalSourceOf(staged.report),
      generation: approvalGenerationOf(staged.report),
      irrCommit,
      ipdToolCommit,
    },
    loaderGate: { recorded: gate !== null, accepted: gate === null ? null : gate.accepted },
    tool: { commit: tool.commit, unmodified: tool.unmodified, detail: tool.detail },
    scope: { ...policy.scope },
    toBeAcceptedExplicitly: {
      exportLimitationCodes: staged.report.limitations.map((limitation) => limitation.code),
      additionalLimitationCodes: additionalLimitationCodesFor(policy, staged.report),
      withheldRecords: approvalWithheldOf(staged.report),
    },
    approvalPolicy: {
      policyVersion: policy.policyVersion,
      decisionId: policy.decision.decisionId,
      decisionRecord: policy.decision.decisionRecord,
      approver: { authorityId: policy.approver.authorityId, name: policy.approver.name },
      validity: 'Valid from approvedAtUtc until reviewDateUtc. From the review date on, installation is refused; renewal is a new record by the approver.',
      determinations: policy.determinations,
    },
    readyForApproval: irrCommit !== null && ipdToolCommit !== null,
  };
}

/* ---- structure ----------------------------------------------------------------------------- */

class Collector {
  readonly failures: ApprovalFailure[] = [];
  add(code: ApprovalFailureCode, detail: string): void {
    this.failures.push({ code, detail });
  }
  malformed(detail: string): void {
    this.add('APPROVAL_MALFORMED', detail);
  }
}

/** An object with exactly the named keys, or null (with the reason recorded). */
function objectWithKeys(value: unknown, path: string, keys: ReadonlyArray<string>, out: Collector): Record<string, unknown> | null {
  if (!isPlainObject(value)) {
    out.malformed(`${path} must be an object`);
    return null;
  }
  let ok = true;
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      out.malformed(`${path}.${key} is missing`);
      ok = false;
    }
  }
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) {
      out.malformed(`${path}.${key} is not a field of this record`);
      ok = false;
    }
  }
  return ok ? value : null;
}

function written(value: unknown, path: string, out: Collector): boolean {
  if (isWritten(value)) return true;
  out.malformed(`${path} must be stated (it is empty, padded or a placeholder)`);
  return false;
}

function stringArray(value: unknown, path: string, out: Collector): boolean {
  if (Array.isArray(value) && value.every((item) => isWritten(item))) return true;
  out.malformed(`${path} must be a list of stated values`);
  return false;
}

function count(value: unknown, path: string, out: Collector): boolean {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return true;
  out.malformed(`${path} must be a non-negative whole number`);
  return false;
}

function sha256OrNull(value: unknown, path: string, out: Collector): boolean {
  if (value === null || (typeof value === 'string' && SHA256_PATTERN.test(value))) return true;
  out.malformed(`${path} must be a lower-case SHA-256 value or null`);
  return false;
}

function timestamp(value: unknown, path: string, out: Collector): boolean {
  if (parseApprovalTimestamp(value) !== null) return true;
  out.malformed(`${path} must be a UTC time written YYYY-MM-DDTHH:MM:SSZ`);
  return false;
}

const TOP_LEVEL_KEYS = Object.freeze([
  'schemaVersion',
  'approvalId',
  'status',
  'policyVersion',
  'decision',
  'subject',
  'scope',
  'accepted',
  'approver',
  'approvedAtUtc',
  'reviewDateUtc',
  'revocation',
]);

const SOURCE_KEYS: ReadonlyArray<keyof ApprovalSource> = Object.freeze(['batchId', 'authorizationRef', 'operatingMode', 'checksumSha256', 'recordCount']);

const GENERATION_KEYS: ReadonlyArray<keyof ApprovalGeneration> = Object.freeze([
  'reportSchemaVersion',
  'mappingVersion',
  'rosterLabel',
  'p7ManifestSha256',
  'issuerKeySupplementSha256',
  'requiredIsins',
  'issuersExported',
  'securitiesExported',
  'nseListingsExported',
  'corporateActionsExported',
  'recordsWithheld',
]);

/** Check the shape of a document. Returns the record only when nothing at all is wrong with it. */
function parseStructure(value: unknown, out: Collector): IdentityApprovalRecord | null {
  if (!isPlainObject(value)) {
    out.add('APPROVAL_UNREADABLE', 'the approval record is not a JSON object');
    return null;
  }
  if (value.schemaVersion !== IDENTITY_APPROVAL_SCHEMA) {
    out.add('APPROVAL_SCHEMA_UNKNOWN', `the document is not an approval record of schema ${IDENTITY_APPROVAL_SCHEMA}`);
    return null;
  }
  const before = out.failures.length;
  const top = objectWithKeys(value, 'record', TOP_LEVEL_KEYS, out);
  if (top === null) return null;

  if (typeof top.approvalId !== 'string' || !APPROVAL_ID_PATTERN.test(top.approvalId)) {
    out.malformed('record.approvalId must be 8 to 128 characters of A-Z, 0-9, dot, underscore and hyphen');
  }
  if (top.status !== 'APPROVED' && top.status !== 'REVOKED') out.malformed('record.status must be APPROVED or REVOKED');
  written(top.policyVersion, 'record.policyVersion', out);

  const decision = objectWithKeys(top.decision, 'record.decision', ['decisionId', 'decisionRecord'], out);
  if (decision !== null) {
    written(decision.decisionId, 'record.decision.decisionId', out);
    written(decision.decisionRecord, 'record.decision.decisionRecord', out);
  }

  const subject = objectWithKeys(top.subject, 'record.subject', ['files', 'p04Source', 'generation', 'irrCommit', 'ipdToolCommit'], out);
  if (subject !== null) {
    const files = objectWithKeys(subject.files, 'record.subject.files', IDENTITY_FILES, out);
    if (files !== null) {
      for (const name of IDENTITY_FILES) {
        const digest = objectWithKeys(files[name], `record.subject.files.${name}`, ['sha256', 'bytes'], out);
        if (digest === null) continue;
        if (typeof digest.sha256 !== 'string' || !SHA256_PATTERN.test(digest.sha256)) {
          out.malformed(`record.subject.files.${name}.sha256 must be a lower-case SHA-256 value`);
        }
        if (typeof digest.bytes !== 'number' || !Number.isInteger(digest.bytes) || digest.bytes <= 0) {
          out.malformed(`record.subject.files.${name}.bytes must be a positive whole number`);
        }
      }
    }
    const source = objectWithKeys(subject.p04Source, 'record.subject.p04Source', SOURCE_KEYS, out);
    if (source !== null) {
      for (const key of ['batchId', 'authorizationRef', 'operatingMode'] as const) written(source[key], `record.subject.p04Source.${key}`, out);
      if (typeof source.checksumSha256 !== 'string' || !SHA256_PATTERN.test(source.checksumSha256)) {
        out.malformed('record.subject.p04Source.checksumSha256 must be a lower-case SHA-256 value');
      }
      count(source.recordCount, 'record.subject.p04Source.recordCount', out);
    }
    const generation = objectWithKeys(subject.generation, 'record.subject.generation', GENERATION_KEYS, out);
    if (generation !== null) {
      for (const key of ['reportSchemaVersion', 'mappingVersion', 'rosterLabel'] as const) {
        written(generation[key], `record.subject.generation.${key}`, out);
      }
      for (const key of ['issuersExported', 'securitiesExported', 'nseListingsExported', 'corporateActionsExported', 'recordsWithheld'] as const) {
        count(generation[key], `record.subject.generation.${key}`, out);
      }
      sha256OrNull(generation.p7ManifestSha256, 'record.subject.generation.p7ManifestSha256', out);
      sha256OrNull(generation.issuerKeySupplementSha256, 'record.subject.generation.issuerKeySupplementSha256', out);
      if (generation.requiredIsins !== null) {
        const required = objectWithKeys(generation.requiredIsins, 'record.subject.generation.requiredIsins', ['listSha256', 'requested', 'covered', 'uncovered'], out);
        if (required !== null) {
          if (typeof required.listSha256 !== 'string' || !SHA256_PATTERN.test(required.listSha256)) {
            out.malformed('record.subject.generation.requiredIsins.listSha256 must be a lower-case SHA-256 value');
          }
          for (const key of ['requested', 'covered', 'uncovered'] as const) count(required[key], `record.subject.generation.requiredIsins.${key}`, out);
        }
      }
    }
    if (typeof subject.irrCommit !== 'string' || !COMMIT_PATTERN.test(subject.irrCommit)) {
      out.malformed('record.subject.irrCommit must be a 40-character lower-case commit identifier');
    }
    if (typeof subject.ipdToolCommit !== 'string' || !COMMIT_PATTERN.test(subject.ipdToolCommit)) {
      out.malformed('record.subject.ipdToolCommit must be a 40-character lower-case commit identifier');
    }
  }

  const scope = objectWithKeys(top.scope, 'record.scope', SCOPE_FIELDS, out);
  if (scope !== null) {
    for (const field of SCOPE_TEXT_FIELDS) written(scope[field], `record.scope.${field}`, out);
    for (const field of SCOPE_FLAG_FIELDS) {
      if (typeof scope[field] !== 'boolean') out.malformed(`record.scope.${field} must be true or false`);
    }
  }

  const accepted = objectWithKeys(top.accepted, 'record.accepted', ['exportLimitationCodes', 'additionalLimitationCodes', 'withheldRecords'], out);
  if (accepted !== null) {
    stringArray(accepted.exportLimitationCodes, 'record.accepted.exportLimitationCodes', out);
    stringArray(accepted.additionalLimitationCodes, 'record.accepted.additionalLimitationCodes', out);
    if (!Array.isArray(accepted.withheldRecords)) {
      out.malformed('record.accepted.withheldRecords must be a list');
    } else {
      accepted.withheldRecords.forEach((item, index) => {
        const entry = objectWithKeys(item, `record.accepted.withheldRecords[${index}]`, ['isin', 'reasons'], out);
        if (entry === null) return;
        written(entry.isin, `record.accepted.withheldRecords[${index}].isin`, out);
        stringArray(entry.reasons, `record.accepted.withheldRecords[${index}].reasons`, out);
      });
    }
  }

  // One approver, stated once. A list of approvers is not a field of this record.
  const approver = objectWithKeys(top.approver, 'record.approver', ['authorityId', 'name', 'decision', 'statement'], out);
  if (approver !== null) {
    written(approver.authorityId, 'record.approver.authorityId', out);
    written(approver.name, 'record.approver.name', out);
    if (approver.decision !== 'APPROVED') out.add('APPROVER_DID_NOT_APPROVE', 'record.approver.decision is not APPROVED');
    written(approver.statement, 'record.approver.statement', out);
  }

  timestamp(top.approvedAtUtc, 'record.approvedAtUtc', out);
  timestamp(top.reviewDateUtc, 'record.reviewDateUtc', out);

  if (top.revocation !== null) {
    const revocation = objectWithKeys(top.revocation, 'record.revocation', ['revokedAtUtc', 'reason'], out);
    if (revocation !== null) {
      timestamp(revocation.revokedAtUtc, 'record.revocation.revokedAtUtc', out);
      written(revocation.reason, 'record.revocation.reason', out);
    }
  }

  return out.failures.length === before ? (value as unknown as IdentityApprovalRecord) : null;
}

/* ---- meaning ------------------------------------------------------------------------------- */

function checkRecord(record: IdentityApprovalRecord, now: Date, policy: IdentityApprovalPolicy, out: Collector): void {
  // Status first: a withdrawn approval authorizes nothing, whatever else it says.
  if (record.status === 'REVOKED' || record.revocation !== null) {
    out.add('APPROVAL_REVOKED', 'the approval record is marked revoked');
  }
  if (policy.revokedApprovalIds.includes(record.approvalId)) {
    out.add('APPROVAL_REVOKED', 'the approval identifier is on the list of withdrawn approvals');
  }

  // Validity: from the time of approval until the review date. Nothing else is consulted.
  const approvedAt = parseApprovalTimestamp(record.approvedAtUtc) as number;
  const reviewAt = parseApprovalTimestamp(record.reviewDateUtc) as number;
  const nowMillis = now.getTime();
  if (!Number.isFinite(nowMillis)) {
    out.add('APPROVAL_EXPIRED', 'the current time could not be determined, so the approval cannot be shown to be current');
  } else {
    if (approvedAt > nowMillis) out.add('APPROVAL_NOT_YET_VALID', 'the approval is dated in the future');
    if (reviewAt <= nowMillis) out.add('APPROVAL_EXPIRED', `the review date ${record.reviewDateUtc} has passed; a new approval record is needed`);
  }
  if (reviewAt <= approvedAt) out.malformed('record.reviewDateUtc must be later than record.approvedAtUtc');

  if (record.policyVersion !== policy.policyVersion) {
    out.add('POLICY_VERSION_MISMATCH', `the approval was written under policy ${record.policyVersion}; this tool applies ${policy.policyVersion}`);
  }
  if (record.decision.decisionId !== policy.decision.decisionId) {
    out.add('DECISION_REFERENCE_MISMATCH', `the approval is made under decision ${record.decision.decisionId}; installation requires an approval of ${policy.decision.decisionId}`);
  }
  if (record.decision.decisionRecord !== policy.decision.decisionRecord) {
    out.add('DECISION_REFERENCE_MISMATCH', 'the approval does not cite the decision record that defines what it approves');
  }

  const scopeFields = SCOPE_FIELDS.filter((field) => record.scope[field] !== policy.scope[field]);
  if (scopeFields.length > 0) {
    out.add('SCOPE_MISMATCH', `the approved scope differs from the only permitted scope in: ${scopeFields.join(', ')}`);
  }

  if (!policyIsUsable(policy)) {
    out.add('APPROVAL_POLICY_UNUSABLE', 'the approval policy does not name a usable approver; nothing can be authorized under it');
  } else if (record.approver.authorityId !== policy.approver.authorityId || record.approver.name !== policy.approver.name) {
    out.add('APPROVER_NOT_AUTHORIZED', `the record is not made by the approver of this policy (${policy.approver.authorityId})`);
  }

  const additional = record.accepted.additionalLimitationCodes;
  const known = knownAdditionalLimitationCodes(policy);
  const missingFixed = policy.fixedLimitationCodes.filter((code) => !additional.includes(code));
  const unknown = additional.filter((code) => !known.includes(code));
  if (new Set(additional).size !== additional.length || missingFixed.length > 0 || unknown.length > 0) {
    out.add(
      'LIMITATION_MISMATCH',
      `the additional limitations accepted must each be stated once, include ${sortedCopy(policy.fixedLimitationCodes).join(', ')}, and name no limitation this tool does not know`,
    );
  }
}

function checkSubject(record: IdentityApprovalRecord, staged: StagedForApproval, policy: IdentityApprovalPolicy, out: Collector): void {
  for (const name of IDENTITY_FILES) {
    const approved = record.subject.files[name];
    const actual = staged.digests[name];
    if (approved.sha256 !== actual.sha256 || approved.bytes !== actual.bytes) {
      out.add('DIGEST_MISMATCH', `${name}: the approval is for other bytes than the staged file`);
    }
  }

  const source = approvalSourceOf(staged.report);
  const sourceDiffering = SOURCE_KEYS.filter((key) => record.subject.p04Source[key] !== source[key]);
  if (sourceDiffering.length > 0) {
    out.add('SOURCE_MISMATCH', `the approval names another P04 source than the staged export was generated from; differing: ${sourceDiffering.join(', ')}`);
  }

  const expected = approvalGenerationOf(staged.report);
  const differing = GENERATION_KEYS.filter((key) => JSON.stringify(record.subject.generation[key]) !== JSON.stringify(expected[key]));
  if (differing.length > 0) {
    out.add('GENERATION_MISMATCH', `the approval is for another generation than the staged one; differing: ${differing.join(', ')}`);
  }
  if (expected.mappingVersion !== IRR_IDENTITY_EXPORT_MAPPING_VERSION) {
    out.add('GENERATION_MISMATCH', 'the staged report was not produced by the mapping version of this tool');
  }

  const reported = staged.report.limitations.map((limitation) => limitation.code as string);
  if (!sameStringSet(record.accepted.exportLimitationCodes, reported)) {
    out.add('LIMITATION_MISMATCH', 'the export limitations accepted are not exactly the limitations the staged export reports');
  }
  const requiredAdditional = additionalLimitationCodesFor(policy, staged.report);
  if (!sameStringSet(record.accepted.additionalLimitationCodes, requiredAdditional)) {
    out.add('LIMITATION_MISMATCH', `the additional limitations accepted must be exactly those of the staged export: ${sortedCopy(requiredAdditional).join(', ')}`);
  }

  const withheld = approvalWithheldOf(staged.report);
  const acceptedWithheld = [...record.accepted.withheldRecords]
    .map((item) => ({ isin: item.isin, reasons: sortedCopy(item.reasons) }))
    .sort((a, b) => (a.isin < b.isin ? -1 : a.isin > b.isin ? 1 : 0));
  const duplicateIsin = new Set(acceptedWithheld.map((item) => item.isin)).size !== acceptedWithheld.length;
  if (duplicateIsin || JSON.stringify(acceptedWithheld) !== JSON.stringify(withheld)) {
    out.add('EXCLUSION_MISMATCH', 'the excluded records accepted are not exactly the records the staged export withholds, with their reasons');
  }
}

function checkTool(record: IdentityApprovalRecord, tool: ToolIdentity, out: Collector): void {
  if (tool.commit === null || !COMMIT_PATTERN.test(tool.commit) || !tool.unmodified) {
    out.add(
      'IPD_TOOL_COMMIT_UNDETERMINED',
      `the running provisioning tool cannot be shown to be the code of one commit${tool.detail.length > 0 ? `: ${tool.detail}` : ''}`,
    );
    return;
  }
  if (record.subject.ipdToolCommit !== tool.commit) {
    out.add('IPD_TOOL_COMMIT_MISMATCH', 'the approval names another IPD commit than the one the provisioning tool is running from');
  }
}

/**
 * Decide whether an approval document authorizes a staged export.
 *
 * Fail-closed: a document that is not exactly a complete record is refused before its content is
 * considered, and `authorizesInstallation` is true only when the staged files, the loader gate and
 * the running tool were all supplied and nothing failed.
 */
export function evaluateIdentityApproval(input: ApprovalEvaluationInput): ApprovalEvaluation {
  const out = new Collector();
  const checked = { record: true as const, stagedFiles: input.staged !== null, loaderGate: input.gate !== null, tool: input.tool !== null };
  const record = parseStructure(input.record, out);
  if (record === null) {
    return { failures: out.failures, checked, authorizesInstallation: false, approval: null };
  }
  checkRecord(record, input.now, input.policy, out);
  if (input.tool !== null) checkTool(record, input.tool, out);
  if (input.staged !== null) checkSubject(record, input.staged, input.policy, out);
  if (input.gate !== null && record.subject.irrCommit !== input.gate.irrCommit) {
    out.add('IRR_COMMIT_MISMATCH', 'the approval names another IRR commit than the one whose loader accepted the staged files');
  }
  return {
    failures: out.failures,
    checked,
    authorizesInstallation: out.failures.length === 0 && checked.stagedFiles && checked.loaderGate && checked.tool,
    approval: record,
  };
}
