/**
 * Institutional Investment Platform System (IIPS)
 * W04 — governance approval of an IRR identity-source installation: the contract and its check.
 *
 * WHAT THIS IS
 *   `installStagedIdentity` (`irr_identity_provisioning.ts`) places three files in the IRR data
 *   directory. Decision D1 of `docs/integration/IIPS-W04-IDENTITY-PROVISIONING-DECISIONS-D1-D4-2026-11-13.md`
 *   says that this needs the approval of the required authority, for exactly those bytes and for
 *   one bounded use. This module defines the approval record (`IPD_IRR_IDENTITY_APPROVAL_V1`) and
 *   decides whether a given record authorizes a given staged export. Installation calls it before
 *   it touches the file system and refuses on any failure.
 *
 * WHAT A RECORD BINDS
 *   - the SHA-256 and the size of each of the three files;
 *   - the generation that produced them: mapping version, master batch, master checksum, the
 *     corroboration and supplement inputs, the required-ISIN coverage, the counts;
 *   - the IRR commit whose loader accepted the files;
 *   - the permitted scope, the limitations accepted, the records excluded;
 *   - the approving authorities, the time of approval, the date the approval lapses;
 *   - the governance decision the approval is made under, and an explicit determination of each
 *     governance question that the decision record leaves open.
 *
 * WHAT THIS MODULE DOES NOT DO
 *   - It creates no approval. Nothing here, and nothing in the provisioning tool, writes a record
 *     of this schema or derives one from a report. A person authors the record.
 *   - It does not authenticate the author. A record is a JSON document; this check establishes
 *     that the document is complete, current, made in the names the policy requires, and bound to
 *     these bytes. That the named authorities really made it is established by where the record is
 *     published (the decision record asks for IPD `main`), not by this code.
 *   - It decides no open governance question. Where the records do not say who must approve
 *     (`requiredAuthorities.status === 'UNRESOLVED'`), every authority the records name is
 *     required, which is the only reading under which an approval is valid whatever the answer
 *     turns out to be. Where the records do not say whether a prerequisite applies, the approval
 *     record must state the determination and its basis; an absent determination is a refusal.
 *
 * Pure: no file access, no clock (the caller supplies `now`), no environment.
 */
import {
  IRR_IDENTITY_EXPORT_MAPPING_VERSION,
  IRR_IDENTITY_FILE_NAMES,
  type FileDigest,
  type IrrIdentityExportReport,
  type IrrIdentityFileName,
} from './irr_identity_source_export.js';

export const IDENTITY_APPROVAL_SCHEMA = 'IPD_IRR_IDENTITY_APPROVAL_V1' as const;
export const IDENTITY_REVIEW_SCHEMA = 'IPD_IRR_IDENTITY_REVIEW_V1' as const;

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
}

export interface RecognisedAuthority {
  readonly authorityId: string;
  readonly name: string;
  readonly designation: string;
}

export type RequiredAuthoritiesRule =
  | {
      /** The records do not settle which of the recognised authorities must approve. */
      readonly status: 'UNRESOLVED';
      readonly questionRef: string;
    }
  | {
      readonly status: 'RESOLVED';
      /** The authorities whose approval is required. Every one must be a recognised authority. */
      readonly authorityIds: ReadonlyArray<string>;
      /** The governance record that settled the question. */
      readonly resolutionRef: string;
    };

export interface IdentityApprovalPolicy {
  readonly policyVersion: string;
  readonly governance: { readonly decisionId: string; readonly decisionRecord: string };
  readonly scope: ApprovalScope;
  readonly recognisedAuthorities: ReadonlyArray<RecognisedAuthority>;
  readonly requiredAuthorities: RequiredAuthoritiesRule;
  /** Limitations found by the D1 investigation that the export report does not carry. */
  readonly additionalLimitationCodes: ReadonlyArray<string>;
  /** Qualifications of the decision record that the approval must dispose of explicitly. */
  readonly qualificationIds: ReadonlyArray<string>;
  /** The qualification that is met only by a generation that counted required-ISIN coverage. */
  readonly coverageQualificationId: string | null;
  readonly cv22OptionC: { readonly decisionRef: string; readonly prerequisiteIds: ReadonlyArray<string> };
  readonly irrRosterContentDecision: { readonly decisionRef: string; readonly issuerCap: number };
  /** Approvals withdrawn after they were issued. A record with one of these identifiers is refused. */
  readonly revokedApprovalIds: ReadonlyArray<string>;
}

/**
 * The governed policy. `installStagedIdentity` always uses this object.
 *
 * `requiredAuthorities` is `UNRESOLVED` on purpose: the decision record's question U-2 (is one
 * approver sufficient, given "Sai/Ramki" as the authority of record) has no answer in any record of
 * either repository. Changing it to `RESOLVED` is a governance act and belongs in a reviewed commit
 * that names the record which settled it.
 */
export const IDENTITY_APPROVAL_POLICY: IdentityApprovalPolicy = Object.freeze({
  policyVersion: 'IPD-IRR-IDENTITY-APPROVAL-POLICY-1',
  governance: Object.freeze({
    decisionId: 'IIPS-W04-D1',
    decisionRecord: 'docs/integration/IIPS-W04-IDENTITY-PROVISIONING-DECISIONS-D1-D4-2026-11-13.md',
  }),
  scope: Object.freeze({
    environment: 'LOCAL_SINGLE_USER_IIPS',
    consumer: 'IRR_INVESTMENT_IDENTITY_SOURCES',
    rosterDataClass: 'OPERATOR_SUPPLIED',
    productWideAuthoritativeUse: false,
    productionUse: false,
  }),
  recognisedAuthorities: Object.freeze([
    Object.freeze({ authorityId: 'PROGRAM_AUTHORITY_RAMKI', name: 'Ramki', designation: 'Program Authority' }),
    Object.freeze({ authorityId: 'PROGRAM_AUTHORITY_SAI', name: 'Sai', designation: 'Program Authority' }),
  ]),
  requiredAuthorities: Object.freeze({ status: 'UNRESOLVED' as const, questionRef: 'U-2' }),
  additionalLimitationCodes: Object.freeze(['NON_EQ_SERIES_HOLDINGS_UNRESOLVED', 'NSE_SOURCE_FILE_WITHOUT_RETRIEVAL_RECEIPT']),
  qualificationIds: Object.freeze(['Q-1', 'Q-2']),
  coverageQualificationId: 'Q-1',
  cv22OptionC: Object.freeze({
    decisionRef: 'IIPS-V3-CV22-OPTION-C-PA-DISPOSITION-2026-10-19-01',
    prerequisiteIds: Object.freeze([
      'CV22-1-IDENTITY-AND-ELIGIBILITY-CONTRACT',
      'CV22-2-APPROVED-ROSTER-AND-CORPUS-REVISION',
      'CV22-3-EXACT-MAPPING-TO-IRR-IDENTITY',
      'CV22-4-CONSUMER-ACCEPTANCE-CRITERIA',
      'CV22-5-IMPLEMENTATION-AUTHORITY',
    ]),
  }),
  irrRosterContentDecision: Object.freeze({
    decisionRef: 'IRR-IID-DESIGN-REFINEMENT-2026-11-05-R19-Q2',
    issuerCap: 200,
  }),
  revokedApprovalIds: Object.freeze([]),
});

/** The authorities whose approval the policy requires, or null when the policy itself is unusable. */
export function requiredAuthorityIds(policy: IdentityApprovalPolicy): ReadonlyArray<string> | null {
  const recognised = policy.recognisedAuthorities.map((authority) => authority.authorityId);
  if (recognised.length === 0 || new Set(recognised).size !== recognised.length) return null;
  if (policy.requiredAuthorities.status === 'UNRESOLVED') return recognised;
  const required = policy.requiredAuthorities.authorityIds;
  if (required.length === 0 || new Set(required).size !== required.length) return null;
  if (required.some((id) => !recognised.includes(id))) return null;
  if (policy.requiredAuthorities.resolutionRef.trim().length === 0) return null;
  return required;
}

/* ------------------------------------------------------------------------------------------ *
 * The approval record
 * ------------------------------------------------------------------------------------------ */

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
  readonly masterBatchId: string;
  readonly masterAuthorizationRef: string;
  readonly masterChecksumSha256: string;
  readonly masterRecordCount: number;
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
  readonly generation: ApprovalGeneration;
  /** The IRR commit whose loader gate accepted the files. */
  readonly irrCommit: string;
}

export interface ApprovalWithheldRecord {
  readonly isin: string;
  readonly reasons: ReadonlyArray<string>;
}

export type QualificationDisposition = 'SATISFIED' | 'WAIVED';
export type Applicability = 'APPLIES' | 'DOES_NOT_APPLY';
export type PrerequisiteDetermination = 'SATISFIED' | 'NOT_APPLICABLE';

export interface ApproverEntry {
  readonly authorityId: string;
  readonly name: string;
  readonly designation: string;
  readonly decision: 'APPROVED';
  readonly approvedAtUtc: string;
  /** The approver's own words. */
  readonly statement: string;
}

export interface IdentityApprovalRecord {
  readonly schemaVersion: typeof IDENTITY_APPROVAL_SCHEMA;
  readonly approvalId: string;
  readonly status: 'APPROVED' | 'REVOKED';
  readonly governance: {
    readonly decisionId: string;
    readonly decisionRecord: string;
    /** Where the act of approval is recorded, for example the pull request that put this record on `main`. */
    readonly approvalActRef: string;
  };
  readonly subject: ApprovalSubject;
  readonly scope: ApprovalScope;
  readonly accepted: {
    readonly exportLimitationCodes: ReadonlyArray<string>;
    readonly additionalLimitationCodes: ReadonlyArray<string>;
    readonly withheldRecords: ReadonlyArray<ApprovalWithheldRecord>;
  };
  readonly qualifications: ReadonlyArray<{ readonly id: string; readonly disposition: QualificationDisposition; readonly ref: string }>;
  readonly determinations: {
    readonly cv22OptionC: {
      readonly decisionRef: string;
      readonly applicability: Applicability;
      readonly basisRef: string;
      readonly prerequisites: ReadonlyArray<{ readonly id: string; readonly determination: PrerequisiteDetermination; readonly evidenceRef: string }>;
    };
    readonly irrRosterContentDecision: {
      readonly decisionRef: string;
      readonly applicability: Applicability;
      readonly basisRef: string;
    };
  };
  readonly approvals: ReadonlyArray<ApproverEntry>;
  readonly approvedAtUtc: string;
  /** The review date. The approval lapses at this instant unless it is renewed by a new record. */
  readonly expiresAtUtc: string;
  readonly revocation: { readonly revokedAtUtc: string; readonly revokedBy: string; readonly reason: string } | null;
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
  | 'REQUIRED_AUTHORITY_MISSING'
  | 'GOVERNANCE_REFERENCE_MISMATCH'
  | 'SCOPE_MISMATCH'
  | 'LIMITATION_MISMATCH'
  | 'EXCLUSION_MISMATCH'
  | 'DIGEST_MISMATCH'
  | 'GENERATION_MISMATCH'
  | 'IRR_COMMIT_MISMATCH'
  | 'QUALIFICATION_NOT_DISPOSED'
  | 'QUALIFICATION_NOT_MET'
  | 'CV22_NOT_DETERMINED'
  | 'CV22_PREREQUISITE_NOT_MET'
  | 'ROSTER_CONTENT_DECISION_NOT_DETERMINED'
  | 'ROSTER_CONTENT_DECISION_NOT_MET';

export interface ApprovalFailure {
  readonly code: ApprovalFailureCode;
  readonly detail: string;
}

export interface StagedForApproval {
  readonly digests: Readonly<Record<IrrIdentityFileName, FileDigest>>;
  readonly report: IrrIdentityExportReport;
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
}

export interface ApprovalEvaluation {
  readonly failures: ReadonlyArray<ApprovalFailure>;
  /** What was compared. An approval authorizes an installation only when all three were. */
  readonly checked: { readonly record: true; readonly stagedFiles: boolean; readonly loaderGate: boolean };
  /** True only when nothing failed AND the staged files and the loader gate were both compared. */
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

/** The generation identity of a staged report, in the form an approval record states it. */
export function approvalGenerationOf(report: IrrIdentityExportReport): ApprovalGeneration {
  const p7 = report.inputs.p7QualificationManifest;
  const supplement = report.inputs.issuerKeySupplement;
  const required = report.inputs.requiredIsins;
  const coverage = report.coverage.requiredIsins;
  return {
    reportSchemaVersion: report.schemaVersion,
    mappingVersion: report.mappingVersion,
    masterBatchId: report.inputs.p04SecurityMaster.batchId,
    masterAuthorizationRef: report.inputs.p04SecurityMaster.authorizationRef,
    masterChecksumSha256: report.inputs.p04SecurityMaster.observedChecksumSha256,
    masterRecordCount: report.inputs.p04SecurityMaster.observedRecordCount,
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
 * What a reviewer needs in order to write an approval record for a staged export: the facts the
 * record must bind, and the items it must accept explicitly. This is NOT an approval and cannot be
 * read as one: it has another schema and carries no approver, no decision and no date.
 */
export interface IdentityReviewRecord {
  readonly schemaVersion: typeof IDENTITY_REVIEW_SCHEMA;
  readonly notice: string;
  readonly installed: false;
  readonly subject: {
    readonly files: Readonly<Record<IrrIdentityFileName, FileDigest>>;
    readonly generation: ApprovalGeneration;
    readonly irrCommit: string | null;
  };
  readonly loaderGate: { readonly recorded: boolean; readonly accepted: boolean | null };
  readonly toBeAcceptedExplicitly: {
    readonly exportLimitationCodes: ReadonlyArray<string>;
    readonly additionalLimitationCodes: ReadonlyArray<string>;
    readonly withheldRecords: ReadonlyArray<ApprovalWithheldRecord>;
  };
  readonly approvalPolicy: {
    readonly policyVersion: string;
    readonly governanceDecisionId: string;
    readonly requiredAuthorities: ReadonlyArray<string> | null;
    readonly requiredAuthoritiesRule: 'UNRESOLVED' | 'RESOLVED';
  };
}

export function buildReviewRecord(
  staged: StagedForApproval,
  gate: { readonly accepted: boolean; readonly irrCommit: string | null } | null,
  policy: IdentityApprovalPolicy = IDENTITY_APPROVAL_POLICY,
): IdentityReviewRecord {
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
      generation: approvalGenerationOf(staged.report),
      irrCommit: gate !== null && gate.accepted ? gate.irrCommit : null,
    },
    loaderGate: { recorded: gate !== null, accepted: gate === null ? null : gate.accepted },
    toBeAcceptedExplicitly: {
      exportLimitationCodes: staged.report.limitations.map((limitation) => limitation.code),
      additionalLimitationCodes: [...policy.additionalLimitationCodes],
      withheldRecords: approvalWithheldOf(staged.report),
    },
    approvalPolicy: {
      policyVersion: policy.policyVersion,
      governanceDecisionId: policy.governance.decisionId,
      requiredAuthorities: requiredAuthorityIds(policy),
      requiredAuthoritiesRule: policy.requiredAuthorities.status,
    },
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
  'governance',
  'subject',
  'scope',
  'accepted',
  'qualifications',
  'determinations',
  'approvals',
  'approvedAtUtc',
  'expiresAtUtc',
  'revocation',
]);

const GENERATION_KEYS: ReadonlyArray<keyof ApprovalGeneration> = Object.freeze([
  'reportSchemaVersion',
  'mappingVersion',
  'masterBatchId',
  'masterAuthorizationRef',
  'masterChecksumSha256',
  'masterRecordCount',
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

  const governance = objectWithKeys(top.governance, 'record.governance', ['decisionId', 'decisionRecord', 'approvalActRef'], out);
  if (governance !== null) {
    written(governance.decisionId, 'record.governance.decisionId', out);
    written(governance.decisionRecord, 'record.governance.decisionRecord', out);
    written(governance.approvalActRef, 'record.governance.approvalActRef', out);
  }

  const subject = objectWithKeys(top.subject, 'record.subject', ['files', 'generation', 'irrCommit'], out);
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
    const generation = objectWithKeys(subject.generation, 'record.subject.generation', GENERATION_KEYS, out);
    if (generation !== null) {
      for (const key of ['reportSchemaVersion', 'mappingVersion', 'masterBatchId', 'masterAuthorizationRef', 'rosterLabel'] as const) {
        written(generation[key], `record.subject.generation.${key}`, out);
      }
      if (typeof generation.masterChecksumSha256 !== 'string' || !SHA256_PATTERN.test(generation.masterChecksumSha256)) {
        out.malformed('record.subject.generation.masterChecksumSha256 must be a lower-case SHA-256 value');
      }
      for (const key of ['masterRecordCount', 'issuersExported', 'securitiesExported', 'nseListingsExported', 'corporateActionsExported', 'recordsWithheld'] as const) {
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
  }

  const scope = objectWithKeys(top.scope, 'record.scope', ['environment', 'consumer', 'rosterDataClass', 'productWideAuthoritativeUse', 'productionUse'], out);
  if (scope !== null) {
    written(scope.environment, 'record.scope.environment', out);
    written(scope.consumer, 'record.scope.consumer', out);
    written(scope.rosterDataClass, 'record.scope.rosterDataClass', out);
    if (typeof scope.productWideAuthoritativeUse !== 'boolean') out.malformed('record.scope.productWideAuthoritativeUse must be true or false');
    if (typeof scope.productionUse !== 'boolean') out.malformed('record.scope.productionUse must be true or false');
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

  if (!Array.isArray(top.qualifications)) {
    out.malformed('record.qualifications must be a list');
  } else {
    top.qualifications.forEach((item, index) => {
      const entry = objectWithKeys(item, `record.qualifications[${index}]`, ['id', 'disposition', 'ref'], out);
      if (entry === null) return;
      written(entry.id, `record.qualifications[${index}].id`, out);
      if (entry.disposition !== 'SATISFIED' && entry.disposition !== 'WAIVED') {
        out.add('QUALIFICATION_NOT_DISPOSED', `record.qualifications[${index}].disposition must be SATISFIED or WAIVED`);
      }
      written(entry.ref, `record.qualifications[${index}].ref`, out);
    });
  }

  const determinations = objectWithKeys(top.determinations, 'record.determinations', ['cv22OptionC', 'irrRosterContentDecision'], out);
  if (determinations !== null) {
    const cv22 = objectWithKeys(determinations.cv22OptionC, 'record.determinations.cv22OptionC', ['decisionRef', 'applicability', 'basisRef', 'prerequisites'], out);
    if (cv22 !== null) {
      written(cv22.decisionRef, 'record.determinations.cv22OptionC.decisionRef', out);
      if (cv22.applicability !== 'APPLIES' && cv22.applicability !== 'DOES_NOT_APPLY') {
        out.add('CV22_NOT_DETERMINED', 'record.determinations.cv22OptionC.applicability must be APPLIES or DOES_NOT_APPLY');
      }
      if (!isWritten(cv22.basisRef)) out.add('CV22_NOT_DETERMINED', 'record.determinations.cv22OptionC.basisRef must name the record on which the determination rests');
      if (!Array.isArray(cv22.prerequisites)) {
        out.malformed('record.determinations.cv22OptionC.prerequisites must be a list');
      } else {
        cv22.prerequisites.forEach((item, index) => {
          const path = `record.determinations.cv22OptionC.prerequisites[${index}]`;
          const entry = objectWithKeys(item, path, ['id', 'determination', 'evidenceRef'], out);
          if (entry === null) return;
          written(entry.id, `${path}.id`, out);
          if (entry.determination !== 'SATISFIED' && entry.determination !== 'NOT_APPLICABLE') {
            out.add('CV22_NOT_DETERMINED', `${path}.determination must be SATISFIED or NOT_APPLICABLE`);
          }
          if (typeof entry.evidenceRef !== 'string') out.malformed(`${path}.evidenceRef must be text`);
        });
      }
    }
    const roster = objectWithKeys(determinations.irrRosterContentDecision, 'record.determinations.irrRosterContentDecision', ['decisionRef', 'applicability', 'basisRef'], out);
    if (roster !== null) {
      written(roster.decisionRef, 'record.determinations.irrRosterContentDecision.decisionRef', out);
      if (roster.applicability !== 'APPLIES' && roster.applicability !== 'DOES_NOT_APPLY') {
        out.add('ROSTER_CONTENT_DECISION_NOT_DETERMINED', 'record.determinations.irrRosterContentDecision.applicability must be APPLIES or DOES_NOT_APPLY');
      }
      if (!isWritten(roster.basisRef)) {
        out.add('ROSTER_CONTENT_DECISION_NOT_DETERMINED', 'record.determinations.irrRosterContentDecision.basisRef must name the record on which the determination rests');
      }
    }
  }

  if (!Array.isArray(top.approvals) || top.approvals.length === 0) {
    out.malformed('record.approvals must list at least one approver');
  } else {
    top.approvals.forEach((item, index) => {
      const path = `record.approvals[${index}]`;
      const entry = objectWithKeys(item, path, ['authorityId', 'name', 'designation', 'decision', 'approvedAtUtc', 'statement'], out);
      if (entry === null) return;
      written(entry.authorityId, `${path}.authorityId`, out);
      written(entry.name, `${path}.name`, out);
      written(entry.designation, `${path}.designation`, out);
      if (entry.decision !== 'APPROVED') out.add('APPROVER_DID_NOT_APPROVE', `${path}.decision is not APPROVED`);
      timestamp(entry.approvedAtUtc, `${path}.approvedAtUtc`, out);
      written(entry.statement, `${path}.statement`, out);
    });
  }

  timestamp(top.approvedAtUtc, 'record.approvedAtUtc', out);
  timestamp(top.expiresAtUtc, 'record.expiresAtUtc', out);

  if (top.revocation !== null) {
    const revocation = objectWithKeys(top.revocation, 'record.revocation', ['revokedAtUtc', 'revokedBy', 'reason'], out);
    if (revocation !== null) {
      timestamp(revocation.revokedAtUtc, 'record.revocation.revokedAtUtc', out);
      written(revocation.revokedBy, 'record.revocation.revokedBy', out);
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

  const approvedAt = parseApprovalTimestamp(record.approvedAtUtc) as number;
  const expiresAt = parseApprovalTimestamp(record.expiresAtUtc) as number;
  const nowMillis = now.getTime();
  if (!Number.isFinite(nowMillis)) {
    out.add('APPROVAL_EXPIRED', 'the current time could not be determined, so the approval cannot be shown to be current');
  } else {
    if (approvedAt > nowMillis) out.add('APPROVAL_NOT_YET_VALID', 'the approval is dated in the future');
    if (expiresAt <= nowMillis) out.add('APPROVAL_EXPIRED', `the approval lapsed at its review date ${record.expiresAtUtc}`);
  }
  if (expiresAt <= approvedAt) out.malformed('record.expiresAtUtc must be later than record.approvedAtUtc');
  for (const [index, approver] of record.approvals.entries()) {
    const signedAt = parseApprovalTimestamp(approver.approvedAtUtc) as number;
    if (signedAt > approvedAt) out.malformed(`record.approvals[${index}].approvedAtUtc is later than record.approvedAtUtc`);
  }

  if (record.governance.decisionId !== policy.governance.decisionId) {
    out.add('GOVERNANCE_REFERENCE_MISMATCH', `the approval is made under decision ${record.governance.decisionId}; installation requires an approval of ${policy.governance.decisionId}`);
  }
  if (record.governance.decisionRecord !== policy.governance.decisionRecord) {
    out.add('GOVERNANCE_REFERENCE_MISMATCH', 'the approval does not cite the decision record that defines the proposal it approves');
  }
  if (record.determinations.cv22OptionC.decisionRef !== policy.cv22OptionC.decisionRef) {
    out.add('GOVERNANCE_REFERENCE_MISMATCH', 'the CV-22 determination does not cite the CV-22 Option C disposition');
  }
  if (record.determinations.irrRosterContentDecision.decisionRef !== policy.irrRosterContentDecision.decisionRef) {
    out.add('GOVERNANCE_REFERENCE_MISMATCH', 'the roster-content determination does not cite the IRR roster-content decision');
  }

  const scopeFields = (['environment', 'consumer', 'rosterDataClass', 'productWideAuthoritativeUse', 'productionUse'] as const).filter(
    (field) => record.scope[field] !== policy.scope[field],
  );
  if (scopeFields.length > 0) {
    out.add('SCOPE_MISMATCH', `the approved scope differs from the only permitted scope in: ${scopeFields.join(', ')}`);
  }

  const required = requiredAuthorityIds(policy);
  if (required === null) {
    out.add('APPROVAL_POLICY_UNUSABLE', 'the approval policy does not name a usable set of required authorities; nothing can be authorized under it');
  } else {
    const seen = new Set<string>();
    for (const [index, approver] of record.approvals.entries()) {
      const authority = policy.recognisedAuthorities.find((candidate) => candidate.authorityId === approver.authorityId);
      if (authority === undefined) {
        out.add('APPROVER_NOT_AUTHORIZED', `record.approvals[${index}] names an approver that is not a recognised approving authority`);
        continue;
      }
      if (authority.name !== approver.name || authority.designation !== approver.designation) {
        out.add('APPROVER_NOT_AUTHORIZED', `record.approvals[${index}] does not carry the name and designation recorded for ${authority.authorityId}`);
        continue;
      }
      if (seen.has(approver.authorityId)) {
        out.add('APPROVER_NOT_AUTHORIZED', `record.approvals[${index}] repeats ${authority.authorityId}`);
        continue;
      }
      seen.add(approver.authorityId);
    }
    for (const id of required) {
      if (!seen.has(id)) {
        const reason =
          policy.requiredAuthorities.status === 'UNRESOLVED'
            ? ` (question ${policy.requiredAuthorities.questionRef} is unresolved, so every recognised authority is required)`
            : '';
        out.add('REQUIRED_AUTHORITY_MISSING', `the approval of ${id} is required and is not in the record${reason}`);
      }
    }
  }

  if (!sameStringSet(record.accepted.additionalLimitationCodes, policy.additionalLimitationCodes)) {
    out.add(
      'LIMITATION_MISMATCH',
      `the additional limitations accepted must be exactly: ${sortedCopy(policy.additionalLimitationCodes).join(', ')}`,
    );
  }

  if (!sameStringSet(record.qualifications.map((item) => item.id), policy.qualificationIds)) {
    out.add('QUALIFICATION_NOT_DISPOSED', `the record must dispose of exactly these qualifications, each once: ${policy.qualificationIds.join(', ')}`);
  }

  const cv22 = record.determinations.cv22OptionC;
  if (!sameStringSet(cv22.prerequisites.map((item) => item.id), policy.cv22OptionC.prerequisiteIds)) {
    out.add('CV22_NOT_DETERMINED', 'the record must state a determination for each of the five CV-22 Option C prerequisites, each once');
  } else if (cv22.applicability === 'APPLIES') {
    for (const item of cv22.prerequisites) {
      if (item.determination !== 'SATISFIED' || !isWritten(item.evidenceRef)) {
        out.add('CV22_PREREQUISITE_NOT_MET', `the record says the CV-22 prerequisites apply, and ${item.id} is not recorded as satisfied with its evidence`);
      }
    }
  } else {
    for (const item of cv22.prerequisites) {
      if (item.determination !== 'NOT_APPLICABLE') {
        out.add('CV22_NOT_DETERMINED', `the record says the CV-22 prerequisites do not apply, yet records ${item.id} as ${item.determination}`);
      }
    }
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

  const withheld = approvalWithheldOf(staged.report);
  const acceptedWithheld = [...record.accepted.withheldRecords]
    .map((item) => ({ isin: item.isin, reasons: sortedCopy(item.reasons) }))
    .sort((a, b) => (a.isin < b.isin ? -1 : a.isin > b.isin ? 1 : 0));
  const duplicateIsin = new Set(acceptedWithheld.map((item) => item.isin)).size !== acceptedWithheld.length;
  if (duplicateIsin || JSON.stringify(acceptedWithheld) !== JSON.stringify(withheld)) {
    out.add('EXCLUSION_MISMATCH', 'the excluded records accepted are not exactly the records the staged export withholds, with their reasons');
  }

  if (policy.coverageQualificationId !== null) {
    const coverage = record.qualifications.find((item) => item.id === policy.coverageQualificationId);
    if (coverage !== undefined && coverage.disposition === 'SATISFIED' && expected.requiredIsins === null) {
      out.add(
        'QUALIFICATION_NOT_MET',
        `${policy.coverageQualificationId} is recorded as satisfied, but the staged generation counted no required-ISIN coverage`,
      );
    }
  }

  if (record.determinations.irrRosterContentDecision.applicability === 'APPLIES' && expected.issuersExported > policy.irrRosterContentDecision.issuerCap) {
    out.add(
      'ROSTER_CONTENT_DECISION_NOT_MET',
      `the record says the IRR roster-content decision applies; it caps the roster at ${policy.irrRosterContentDecision.issuerCap} and the staged roster has ${expected.issuersExported} issuers`,
    );
  }
}

/**
 * Decide whether an approval document authorizes a staged export.
 *
 * Fail-closed: a document that is not exactly a complete record is refused before its content is
 * considered, and `authorizesInstallation` is true only when the staged files and the loader gate
 * were both supplied and nothing failed.
 */
export function evaluateIdentityApproval(input: ApprovalEvaluationInput): ApprovalEvaluation {
  const out = new Collector();
  const checked = { record: true as const, stagedFiles: input.staged !== null, loaderGate: input.gate !== null };
  const record = parseStructure(input.record, out);
  if (record === null) {
    return { failures: out.failures, checked, authorizesInstallation: false, approval: null };
  }
  checkRecord(record, input.now, input.policy, out);
  if (input.staged !== null) checkSubject(record, input.staged, input.policy, out);
  if (input.gate !== null && record.subject.irrCommit !== input.gate.irrCommit) {
    out.add('IRR_COMMIT_MISMATCH', 'the approval names another IRR commit than the one whose loader accepted the staged files');
  }
  return {
    failures: out.failures,
    checked,
    authorizesInstallation: out.failures.length === 0 && checked.stagedFiles && checked.loaderGate,
    approval: record,
  };
}
