/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: W04 — approval of an identity-source installation (IAP-*)
 *
 * Covers `src/identity/irr_identity_approval.ts`, the approval enforcement of
 * `src/identity/irr_identity_provisioning.ts`, the commands `review`, `check-approval` and
 * `install` of `scripts/provision-irr-identity-sources.mjs`, the blank template, and the text of
 * the Windows wrapper.
 *
 * ONE APPROVER. The governed policy names Ramki as the only approver. There is no second approver
 * and the record has no place for one.
 *
 * NO APPROVAL EXISTS. Decision D1 is not approved. No test holds, builds or writes an approval in
 * the approver's name. Acceptance is shown under a test policy whose approver does not exist
 * (`tests/support/irr_identity_approval_fixture.ts`), with a tool commit that is no commit; the
 * governed entry point and the command line are shown refusing those records. One consequence is
 * stated here plainly: the success output of `install` on the command line is exercised by no test.
 *
 * WHAT THIS SUITE DOES NOT SHOW. The Windows wrapper is read as text, not executed: no PowerShell
 * runtime is available. The IRR loader is not available either; the gate answer is built as in
 * `tests/irr_identity_provisioning.test.ts`.
 */
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import {
  D05_AUTHENTICATED_UNIVERSE_ENTITIES,
  D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION,
  type SecurityMasterEntity,
} from '../src/identity/index.js';
import {
  IRR_IDENTITY_FILE_NAMES,
  buildIrrIdentitySources,
  computeSecurityMasterChecksum,
  type IrrIdentityExportInput,
  type IrrIdentityExportResult,
} from '../src/identity/irr_identity_source_export.js';
import {
  IDENTITY_APPROVAL_POLICY,
  IDENTITY_APPROVAL_SCHEMA,
  IDENTITY_REVIEW_SCHEMA,
  additionalLimitationCodesFor,
  buildReviewRecord,
  evaluateIdentityApproval,
  parseApprovalTimestamp,
  policyIsUsable,
  type ApprovalEvaluation,
  type IdentityApprovalPolicy,
  type ToolIdentity,
} from '../src/identity/irr_identity_approval.js';
import {
  APPROVAL_RECORD_MAX_BYTES,
  ApprovalRefusedError,
  INSTALL_RECEIPT_SCHEMA,
  IPD_TOOL_SOURCE_PATHS,
  LOADER_GATE_SCHEMA,
  ProvisioningError,
  STAGED_INSTALL_RECEIPT_FILE,
  STAGED_REVIEW_FILE,
  checkIdentityApproval,
  identityDirOf,
  installStagedIdentity,
  installStagedIdentityUnderPolicy,
  readIdentityDirectoryDigests,
  readIpdToolIdentity,
  readStagedExport,
  readToolIdentityAt,
  recordGate,
  recordInstallation,
  stageExport,
  writeReviewRecord,
  type StagedExport,
} from '../src/identity/irr_identity_provisioning.js';
import {
  TEST_APPROVAL_POLICY,
  TEST_AUTHORITY,
  TEST_TOOL,
  TEST_TOOL_COMMIT,
  testApprovalFor,
  utc,
  writeApprovalFile,
  type LooseApproval,
} from './support/irr_identity_approval_fixture.js';

const ROOT = process.cwd();
const CLI = join(ROOT, 'scripts', 'provision-irr-identity-sources.mjs');
const WRAPPER = join(ROOT, 'scripts', 'Invoke-IrrIdentityProvisioning.ps1');
const TEMPLATE = join(ROOT, 'docs', 'integration', 'w04-identity-approval', 'IRR-IDENTITY-APPROVAL-RECORD-TEMPLATE.json');
const ROSTER = IRR_IDENTITY_FILE_NAMES.roster;
const LISTING_MAP = IRR_IDENTITY_FILE_NAMES.listingMap;
const CORPORATE_ACTIONS = IRR_IDENTITY_FILE_NAMES.corporateActions;
const FILES = [ROSTER, LISTING_MAP, CORPORATE_ACTIONS] as const;
const IRR_COMMIT = 'c'.repeat(40);
const OTHER_COMMIT = 'd'.repeat(40);

const scratch = mkdtempSync(join(tmpdir(), 'ipd-irr-approval-'));
after(() => rmSync(scratch, { recursive: true, force: true }));

let counter = 0;
function freshDir(name: string): string {
  counter += 1;
  const dir = join(scratch, `${String(counter).padStart(3, '0')}-${name}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function exportOfSlice(from: number, to: number, extra: Partial<IrrIdentityExportInput> = {}): IrrIdentityExportResult {
  const entities: SecurityMasterEntity[] = D05_AUTHENTICATED_UNIVERSE_ENTITIES.slice(from, to);
  return buildIrrIdentitySources({
    masterEntities: entities,
    masterRevision: { ...D05_AUTHENTICATED_UNIVERSE_SOURCE_REVISION, recordCount: entities.length, fileChecksumSha256: computeSecurityMasterChecksum(entities) },
    ...extra,
  });
}

/** A document of the shape the IRR loader gate prints when IRR accepts the files. */
function loaderAnswerFor(staged: StagedExport): Record<string, unknown> {
  const n = staged.report.coverage.securities.exported;
  return {
    gate: LOADER_GATE_SCHEMA,
    ran: true,
    asOf: '2026-11-13',
    files: JSON.parse(JSON.stringify(staged.digests)),
    available: true,
    issueCount: 0,
    rosterLabel: staged.report.outputs!.rosterLabel,
    rosterDataClass: 'OPERATOR_SUPPLIED',
    versions: {
      rosterVersion: `sha256:${'1'.repeat(64)}`,
      listingMapVersion: `sha256:${'2'.repeat(64)}`,
      corporateActionTableVersion: `sha256:${'3'.repeat(64)}`,
    },
    counts: { issuers: n, securities: n, listings: n, corporateActions: 0 },
    resolverSelfCheck: {
      byIsin: { observed: n, resolvedToTheSameRecord: n },
      byExchangeAndSymbol: { observed: n, resolvedToTheSameRecord: n },
    },
  };
}

/** A staging directory holding a passing export and, unless told otherwise, an accepted gate record. */
function staging(name: string, from = 0, to = 5, options: { gate?: boolean; extra?: Partial<IrrIdentityExportInput>; irrCommit?: string | null } = {}): { stagingDir: string; staged: StagedExport } {
  const stagingDir = freshDir(name);
  stageExport(stagingDir, exportOfSlice(from, to, options.extra));
  const staged = readStagedExport(stagingDir);
  if (options.gate !== false) {
    recordGate(staged, loaderAnswerFor(staged), { irrCommit: options.irrCommit === undefined ? IRR_COMMIT : options.irrCommit, irrWorktreeClean: true, asOf: '2026-11-13' });
  }
  return { stagingDir, staged };
}

function evaluate(
  record: unknown,
  staged: StagedExport | null,
  overrides: { policy?: IdentityApprovalPolicy; now?: Date; gateCommit?: string | null | undefined; tool?: ToolIdentity | null } = {},
): ApprovalEvaluation {
  return evaluateIdentityApproval({
    record,
    now: overrides.now ?? new Date(),
    policy: overrides.policy ?? TEST_APPROVAL_POLICY,
    staged,
    gate: staged === null || overrides.gateCommit === undefined ? (staged === null ? null : { irrCommit: IRR_COMMIT }) : { irrCommit: overrides.gateCommit },
    tool: overrides.tool === undefined ? TEST_TOOL : overrides.tool,
  });
}

/** Installation under the test policy and the test tool identity. */
function installUnderTest(options: Parameters<typeof installStagedIdentityUnderPolicy>[0], tool: ToolIdentity = TEST_TOOL) {
  return installStagedIdentityUnderPolicy(options, TEST_APPROVAL_POLICY, tool);
}

function codes(evaluation: ApprovalEvaluation): string[] {
  return [...new Set(evaluation.failures.map((failure) => failure.code))].sort();
}

function refusal(run: () => unknown): { code: string; codes: string[] } {
  try {
    run();
  } catch (error) {
    assert.ok(error instanceof ProvisioningError, `expected a ProvisioningError, got ${String(error)}`);
    const all = error instanceof ApprovalRefusedError ? [...new Set(error.failures.map((failure) => failure.code as string))].sort() : [];
    return { code: error.code, codes: all };
  }
  return { code: 'NO_ERROR', codes: [] };
}

/** Every file below a directory with its size, content digest and modification time. */
function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (current: string): void => {
    for (const name of readdirSync(current).sort()) {
      const path = join(current, name);
      const stats = statSync(path);
      if (stats.isDirectory()) {
        out[`${relative(dir, path)}/`] = 'directory';
        walk(path);
      } else {
        out[relative(dir, path)] = `${stats.size}:${createHash('sha256').update(readFileSync(path)).digest('hex')}:${stats.mtimeMs}`;
      }
    }
  };
  walk(dir);
  return out;
}

function clone(record: LooseApproval): LooseApproval {
  return JSON.parse(JSON.stringify(record)) as LooseApproval;
}

/** A copy of a record with one change applied. */
function changed(record: LooseApproval, change: (copy: LooseApproval) => void): LooseApproval {
  const copy = clone(record);
  change(copy);
  return copy;
}

const base = staging('base');
const baseRecord = testApprovalFor(base.staged, IRR_COMMIT);

/* ============================================================================================ */

describe('W04 identity approval — the contract: a valid record', () => {
  it('IAP-01 a complete, current record for exactly the staged files authorizes the installation', () => {
    const result = evaluate(baseRecord, base.staged);
    assert.deepEqual(result.failures, []);
    assert.deepEqual(result.checked, { record: true, stagedFiles: true, loaderGate: true, tool: true });
    assert.equal(result.authorizesInstallation, true);
    assert.equal(result.approval?.approver.authorityId, TEST_AUTHORITY.authorityId);
    assert.equal(result.approval?.approvalId, baseRecord.approvalId);
    for (const name of FILES) assert.equal(result.approval?.subject.files[name].sha256, base.staged.digests[name].sha256);
  });

  it('IAP-02 a record that was not compared with the staged files, the gate and the tool authorizes nothing', () => {
    const at = (staged: StagedExport | null, gate: boolean, tool: ToolIdentity | null) =>
      evaluateIdentityApproval({ record: baseRecord, now: new Date(), policy: TEST_APPROVAL_POLICY, staged, gate: gate ? { irrCommit: IRR_COMMIT } : null, tool });
    for (const partial of [at(null, false, null), at(base.staged, false, null), at(base.staged, true, null), at(base.staged, false, TEST_TOOL), at(null, false, TEST_TOOL)]) {
      assert.deepEqual(partial.failures, []);
      assert.equal(partial.authorizesInstallation, false);
    }
    assert.equal(at(base.staged, true, TEST_TOOL).authorizesInstallation, true);
  });

  it('IAP-03 the record binds the P04 source, the generation and both commits, not only the digests', () => {
    const report = base.staged.report;
    assert.deepEqual(baseRecord.subject.p04Source, {
      batchId: report.inputs.p04SecurityMaster.batchId,
      authorizationRef: report.inputs.p04SecurityMaster.authorizationRef,
      operatingMode: 'OFFLINE_BOOTSTRAP',
      checksumSha256: report.inputs.p04SecurityMaster.observedChecksumSha256,
      recordCount: 5,
    });
    const generation = baseRecord.subject.generation;
    assert.equal(generation.mappingVersion, report.mappingVersion);
    assert.equal(generation.securitiesExported, 5);
    assert.equal(generation.requiredIsins, null);
    assert.equal(baseRecord.subject.irrCommit, IRR_COMMIT);
    assert.equal(baseRecord.subject.ipdToolCommit, TEST_TOOL_COMMIT);
  });
});

describe('W04 identity approval — the contract: structure', () => {
  it('IAP-10 refuses a document that is not a record', () => {
    for (const value of [null, undefined, 'approved', 1, true, [], [baseRecord]]) {
      assert.deepEqual(codes(evaluate(value, base.staged)), ['APPROVAL_UNREADABLE'], JSON.stringify(value));
    }
    for (const value of [{}, { schemaVersion: 'OTHER' }, { ...baseRecord, schemaVersion: IDENTITY_REVIEW_SCHEMA }, { ...baseRecord, schemaVersion: null }]) {
      assert.deepEqual(codes(evaluate(value, base.staged)), ['APPROVAL_SCHEMA_UNKNOWN']);
    }
  });

  it('IAP-11 refuses a missing field and a field that is not part of the record, at every level', () => {
    const cases: Array<[string, (copy: LooseApproval) => void]> = [
      ['no status', (copy) => delete copy.status],
      ['no approver', (copy) => delete copy.approver],
      ['no review date', (copy) => delete copy.reviewDateUtc],
      ['no policy version', (copy) => delete copy.policyVersion],
      ['no P04 source', (copy) => delete copy.subject.p04Source],
      ['no IPD tool commit', (copy) => delete copy.subject.ipdToolCommit],
      ['no revocation field', (copy) => delete copy.revocation],
      ['no scope', (copy) => delete copy.scope],
      ['no accepted', (copy) => delete copy.accepted],
      ['unknown top-level field', (copy) => { copy.amendments = 'the roster may also be used elsewhere'; }],
      ['unknown scope field', (copy) => { copy.scope.alsoPermitted = 'production'; }],
      ['unknown subject field', (copy) => { copy.subject.anyOtherFiles = true; }],
      ['missing file', (copy) => delete copy.subject.files[LISTING_MAP]],
      ['extra file', (copy) => { copy.subject.files['other.json'] = { sha256: 'a'.repeat(64), bytes: 1 }; }],
      ['missing generation field', (copy) => delete copy.subject.generation.mappingVersion],
      ['missing source field', (copy) => delete copy.subject.p04Source.checksumSha256],
      ['unknown approver field', (copy) => { copy.approver.onBehalfOf = 'someone'; }],
      ['a missing scope flag', (copy) => delete copy.scope.commercialUse],
      // Fields of the two-approver record of the earlier schema are not fields of this one.
      ['a list of approvers', (copy) => { copy.approvals = [copy.approver]; }],
      ['a second approver', (copy) => { copy.secondApprover = { ...copy.approver }; }],
      ['a determination answered in the record', (copy) => { copy.determinations = { cv22OptionC: { applicability: 'DOES_NOT_APPLY' } }; }],
      ['a qualification disposed of in the record', (copy) => { copy.qualifications = []; }],
      ['the earlier expiry field', (copy) => { copy.expiresAtUtc = copy.reviewDateUtc; }],
    ];
    for (const [label, change] of cases) {
      const result = evaluate(changed(baseRecord, change), base.staged);
      assert.deepEqual(codes(result), ['APPROVAL_MALFORMED'], label);
      assert.equal(result.authorizesInstallation, false, label);
      assert.equal(result.approval, null, label);
    }
  });

  it('IAP-12 refuses a field of the wrong kind, an empty field and a placeholder', () => {
    const cases: Array<[string, (copy: LooseApproval) => void]> = [
      ['approval id too short', (copy) => { copy.approvalId = 'A-1'; }],
      ['approval id lower case', (copy) => { copy.approvalId = 'approval-of-the-roster'; }],
      ['status another word', (copy) => { copy.status = 'PENDING'; }],
      ['status lower case', (copy) => { copy.status = 'approved'; }],
      ['digest upper case', (copy) => { copy.subject.files[ROSTER].sha256 = copy.subject.files[ROSTER].sha256.toUpperCase().replace(/[0-9]/g, 'A'); }],
      ['digest shortened', (copy) => { copy.subject.files[ROSTER].sha256 = copy.subject.files[ROSTER].sha256.slice(0, 12); }],
      ['digest with ellipsis', (copy) => { copy.subject.files[ROSTER].sha256 = '078e89cc…e937'; }],
      ['bytes as text', (copy) => { copy.subject.files[ROSTER].bytes = String(copy.subject.files[ROSTER].bytes); }],
      ['bytes zero', (copy) => { copy.subject.files[ROSTER].bytes = 0; }],
      ['commit short', (copy) => { copy.subject.irrCommit = '08411bc'; }],
      ['tool commit short', (copy) => { copy.subject.ipdToolCommit = '550e5ae'; }],
      ['tool commit upper case', (copy) => { copy.subject.ipdToolCommit = 'E'.repeat(40); }],
      ['tool commit a branch name', (copy) => { copy.subject.ipdToolCommit = 'main'; }],
      ['source checksum shortened', (copy) => { copy.subject.p04Source.checksumSha256 = 'b555fd28'; }],
      ['source record count as text', (copy) => { copy.subject.p04Source.recordCount = '2390'; }],
      ['policy version empty', (copy) => { copy.policyVersion = ''; }],
      ['count negative', (copy) => { copy.subject.generation.recordsWithheld = -1; }],
      ['count fractional', (copy) => { copy.subject.generation.securitiesExported = 4.5; }],
      ['scope flag as text', (copy) => { copy.scope.productionUse = 'false'; }],
      ['scope empty', (copy) => { copy.scope.environment = ''; }],
      ['limitations not a list', (copy) => { copy.accepted.exportLimitationCodes = 'all'; }],
      ['limitation empty', (copy) => { copy.accepted.exportLimitationCodes[0] = ''; }],
      ['statement missing', (copy) => { copy.approver.statement = null; }],
      ['statement empty', (copy) => { copy.approver.statement = ''; }],
      ['statement blank', (copy) => { copy.approver.statement = '   '; }],
      ['statement a placeholder', (copy) => { copy.approver.statement = '<the approver writes this>'; }],
      ['approver a list', (copy) => { copy.approver = [copy.approver]; }],
      ['approver a name only', (copy) => { copy.approver = 'Fictitious Test Authority'; }],
      ['approver absent', (copy) => { copy.approver = null; }],
      ['time without zone', (copy) => { copy.approvedAtUtc = '2026-11-13T10:00:00'; }],
      ['time with offset', (copy) => { copy.reviewDateUtc = '2027-01-01T00:00:00+05:30'; }],
      ['review date absent', (copy) => { copy.reviewDateUtc = null; }],
      ['review date empty', (copy) => { copy.reviewDateUtc = ''; }],
      ['review date only a date', (copy) => { copy.reviewDateUtc = '2027-01-01'; }],
      ['review date never', (copy) => { copy.reviewDateUtc = 'never'; }],
      ['impossible date', (copy) => { copy.reviewDateUtc = '2027-02-30T00:00:00Z'; }],
      ['revocation of the wrong shape', (copy) => { copy.revocation = true; }],
    ];
    for (const [label, change] of cases) {
      const result = evaluate(changed(baseRecord, change), base.staged);
      assert.deepEqual(codes(result), ['APPROVAL_MALFORMED'], label);
      assert.equal(result.authorizesInstallation, false, label);
    }
  });

  it('IAP-13 reads a time only when it is a real UTC instant', () => {
    assert.equal(parseApprovalTimestamp('2026-11-13T10:00:00Z'), Date.UTC(2026, 10, 13, 10, 0, 0));
    assert.equal(parseApprovalTimestamp('2026-11-13T10:00:00.250Z'), Date.UTC(2026, 10, 13, 10, 0, 0, 250));
    for (const text of ['2026-11-13', '2026-11-13T10:00:00', '2026-13-01T00:00:00Z', '2026-02-30T00:00:00Z', '2026-11-13T25:00:00Z', '', null, 0, 'never']) {
      assert.equal(parseApprovalTimestamp(text), null, String(text));
    }
  });
});

describe('W04 identity approval — the contract: who approved', () => {
  it('IAP-20 refuses a record that is not made by the one approver of the policy', () => {
    const cases: Array<[string, (copy: LooseApproval) => void]> = [
      ['another authority', (copy) => { copy.approver = { ...copy.approver, authorityId: 'INVESTIGATING_AGENT', name: 'Agent' }; }],
      ['another identifier under the approver name', (copy) => { copy.approver.authorityId = 'OPERATOR_FRIEND'; }],
      ['the right identifier under another name', (copy) => { copy.approver.name = 'Somebody Else'; }],
      ['the governed approver, under the test policy', (copy) => { copy.approver = { ...copy.approver, authorityId: IDENTITY_APPROVAL_POLICY.approver.authorityId, name: IDENTITY_APPROVAL_POLICY.approver.name }; }],
    ];
    for (const [label, change] of cases) {
      const result = evaluate(changed(baseRecord, change), base.staged);
      assert.deepEqual(codes(result), ['APPROVER_NOT_AUTHORIZED'], label);
      assert.equal(result.failures.length, 1, label);
      assert.equal(result.authorizesInstallation, false, label);
    }
  });

  it('IAP-21 refuses a record whose approver did not approve', () => {
    for (const decision of ['REJECTED', 'APPROVED WITH AMENDMENTS', 'approved', 'PENDING', '', null, true]) {
      const result = evaluate(changed(baseRecord, (copy) => { copy.approver.decision = decision; }), base.staged);
      assert.deepEqual(codes(result), ['APPROVER_DID_NOT_APPROVE'], String(decision));
      assert.equal(result.authorizesInstallation, false);
    }
  });

  it('IAP-22 the governed policy names Ramki as the only approver, for local single-user non-production use', () => {
    assert.deepEqual(
      { authorityId: IDENTITY_APPROVAL_POLICY.approver.authorityId, name: IDENTITY_APPROVAL_POLICY.approver.name },
      { authorityId: 'PROGRAM_AUTHORITY_RAMKI', name: 'Ramki' },
    );
    assert.equal(policyIsUsable(IDENTITY_APPROVAL_POLICY), true);
    // The policy has one approver and no structure that could hold another.
    const policyKeys = Object.keys(IDENTITY_APPROVAL_POLICY).sort();
    assert.deepEqual(policyKeys, ['approver', 'coverageNotMeasuredLimitationCode', 'decision', 'determinations', 'fixedLimitationCodes', 'policyVersion', 'revokedApprovalIds', 'rosterContentDefault', 'scope']);
    assert.equal(Array.isArray(IDENTITY_APPROVAL_POLICY.approver), false);
    const moduleText = readFileSync(join(ROOT, 'src', 'identity', 'irr_identity_approval.ts'), 'utf8');
    for (const gone of ['PROGRAM_AUTHORITY_SAI', "name: 'Sai'", 'requiredAuthorities', 'recognisedAuthorities', "'UNRESOLVED'", 'REQUIRED_AUTHORITY_MISSING', 'designation', 'approvalActRef']) {
      assert.ok(!moduleText.includes(gone), `the approval module no longer contains ${gone}`);
    }

    assert.equal(IDENTITY_APPROVAL_POLICY.policyVersion, 'IPD-IRR-IDENTITY-APPROVAL-POLICY-2');
    assert.deepEqual(IDENTITY_APPROVAL_POLICY.revokedApprovalIds, []);
    assert.equal(IDENTITY_APPROVAL_POLICY.decision.decisionId, 'IIPS-W04-D1');
    assert.ok(existsSync(join(ROOT, IDENTITY_APPROVAL_POLICY.decision.decisionRecord)), 'the decision record the policy cites is tracked');
    assert.deepEqual(IDENTITY_APPROVAL_POLICY.scope, {
      environment: 'LOCAL_SINGLE_USER_IIPS',
      consumer: 'IRR_INVESTMENT_IDENTITY_SOURCES',
      rosterDataClass: 'OPERATOR_SUPPLIED',
      productWideAuthoritativeUse: false,
      productionUse: false,
      hostedUse: false,
      multiUserUse: false,
      commercialUse: false,
    });

    // A record made by the fictitious test authority is nothing under the governed policy.
    const governed = evaluate(baseRecord, base.staged, { policy: IDENTITY_APPROVAL_POLICY });
    assert.deepEqual(codes(governed), ['APPROVER_NOT_AUTHORIZED', 'DECISION_REFERENCE_MISMATCH', 'POLICY_VERSION_MISMATCH']);
    assert.equal(governed.authorizesInstallation, false);
  });

  it('IAP-23 one approval is sufficient, and a policy without a usable approver authorizes nothing', () => {
    // The valid record carries exactly one approver entry and is complete.
    assert.equal(typeof baseRecord.approver, 'object');
    assert.equal(Array.isArray(baseRecord.approver), false);
    assert.equal(evaluate(baseRecord, base.staged).authorizesInstallation, true);

    for (const approver of [
      { ...TEST_AUTHORITY, authorityId: '' },
      { ...TEST_AUTHORITY, authorityId: '   ' },
      { ...TEST_AUTHORITY, name: '' },
    ]) {
      const unusable: IdentityApprovalPolicy = { ...TEST_APPROVAL_POLICY, approver };
      assert.equal(policyIsUsable(unusable), false);
      const result = evaluate(baseRecord, base.staged, { policy: unusable });
      assert.deepEqual(codes(result), ['APPROVAL_POLICY_UNUSABLE']);
      assert.equal(result.authorizesInstallation, false);
    }
    for (const issuerCap of [0, -1, 1.5, Number.NaN]) {
      const unusable: IdentityApprovalPolicy = { ...TEST_APPROVAL_POLICY, rosterContentDefault: { ...TEST_APPROVAL_POLICY.rosterContentDefault, issuerCap } };
      assert.ok(codes(evaluate(baseRecord, base.staged, { policy: unusable })).includes('APPROVAL_POLICY_UNUSABLE'), String(issuerCap));
    }
  });
});

describe('W04 identity approval — the contract: status and time', () => {
  it('IAP-30 the review date: an approval is valid from its approval time until its review date, and at no other time', () => {
    const passed = changed(baseRecord, (copy) => { copy.approvedAtUtc = utc(-7200); copy.reviewDateUtc = utc(-60); });
    const expired = evaluate(passed, base.staged);
    assert.deepEqual(codes(expired), ['APPROVAL_EXPIRED']);
    assert.match(expired.failures[0]!.detail, /a new approval record is needed/);

    // The review date is the instant the validity ends: at that instant it has ended.
    const now = new Date(Date.UTC(2026, 10, 20, 12, 0, 0));
    const at = (approved: string, review: string) => changed(baseRecord, (copy) => { copy.approvedAtUtc = approved; copy.reviewDateUtc = review; });
    assert.deepEqual(codes(evaluate(at('2026-11-13T00:00:00Z', '2026-11-20T12:00:00Z'), base.staged, { now })), ['APPROVAL_EXPIRED']);
    assert.deepEqual(codes(evaluate(at('2026-11-13T00:00:00Z', '2026-11-20T12:00:01Z'), base.staged, { now })), []);
    assert.deepEqual(codes(evaluate(at('2026-11-20T12:00:01Z', '2026-12-20T00:00:00Z'), base.staged, { now })), ['APPROVAL_NOT_YET_VALID']);
    assert.deepEqual(codes(evaluate(at('2026-11-20T12:00:00Z', '2026-12-20T00:00:00Z'), base.staged, { now })), []);

    // Nothing but the two times decides it: there is no maximum period and no other review step.
    assert.deepEqual(codes(evaluate(at('2026-11-13T00:00:00Z', '2036-11-13T00:00:00Z'), base.staged, { now })), []);
    assert.equal(evaluate(at('2026-11-13T00:00:00Z', '2036-11-13T00:00:00Z'), base.staged, { now }).authorizesInstallation, true);

    // A window that is empty or runs backwards is not a validity period.
    assert.deepEqual(codes(evaluate(at('2026-11-13T00:00:00Z', '2026-11-13T00:00:00Z'), base.staged, { now: new Date(Date.UTC(2026, 10, 13)) })), ['APPROVAL_EXPIRED', 'APPROVAL_MALFORMED']);
    assert.ok(codes(evaluate(at('2026-11-14T00:00:00Z', '2026-11-13T00:00:00Z'), base.staged, { now })).includes('APPROVAL_MALFORMED'));

    // A clock that cannot be read is not evidence that the approval is current.
    assert.deepEqual(codes(evaluate(baseRecord, base.staged, { now: new Date(Number.NaN) })), ['APPROVAL_EXPIRED']);
  });

  it('IAP-31 refuses a revoked approval, however it is marked', () => {
    const revocation = { revokedAtUtc: utc(-600), reason: 'test' };
    assert.deepEqual(codes(evaluate(changed(baseRecord, (copy) => { copy.status = 'REVOKED'; copy.revocation = revocation; }), base.staged)), ['APPROVAL_REVOKED']);
    assert.deepEqual(codes(evaluate(changed(baseRecord, (copy) => { copy.status = 'REVOKED'; }), base.staged)), ['APPROVAL_REVOKED']);
    assert.deepEqual(codes(evaluate(changed(baseRecord, (copy) => { copy.revocation = revocation; }), base.staged)), ['APPROVAL_REVOKED']);
    // Withdrawn in the policy: the record file still says APPROVED.
    const withdrawn: IdentityApprovalPolicy = { ...TEST_APPROVAL_POLICY, revokedApprovalIds: [baseRecord.approvalId] };
    const result = evaluate(baseRecord, base.staged, { policy: withdrawn });
    assert.deepEqual(codes(result), ['APPROVAL_REVOKED']);
    assert.equal(result.authorizesInstallation, false);
  });
});

describe('W04 identity approval — the contract: decision reference, policy version and scope', () => {
  it('IAP-40 refuses an approval made under another decision, citing another record, or written under another policy version', () => {
    const cases: Array<[string, string, (copy: LooseApproval) => void]> = [
      ['another decision', 'DECISION_REFERENCE_MISMATCH', (copy) => { copy.decision.decisionId = 'IIPS-W04-D2'; }],
      ['the governed decision, under the test policy', 'DECISION_REFERENCE_MISMATCH', (copy) => { copy.decision.decisionId = IDENTITY_APPROVAL_POLICY.decision.decisionId; }],
      ['another decision record', 'DECISION_REFERENCE_MISMATCH', (copy) => { copy.decision.decisionRecord = 'docs/integration/IIPS-W04-IRR-IDENTITY-SOURCE-PROVISIONING-2026-11-13.md'; }],
      // The policy version carries the determinations: an approval given under other ones is not this approval.
      ['the earlier two-approver policy', 'POLICY_VERSION_MISMATCH', (copy) => { copy.policyVersion = 'IPD-IRR-IDENTITY-APPROVAL-POLICY-1'; }],
      ['the governed policy version, under the test policy', 'POLICY_VERSION_MISMATCH', (copy) => { copy.policyVersion = IDENTITY_APPROVAL_POLICY.policyVersion; }],
    ];
    for (const [label, expected, change] of cases) {
      const result = evaluate(changed(baseRecord, change), base.staged);
      assert.deepEqual(codes(result), [expected], label);
      assert.equal(result.authorizesInstallation, false, label);
    }
    // A record of the earlier schema is not a record of this one, whatever it says.
    assert.deepEqual(codes(evaluate({ ...baseRecord, schemaVersion: 'IPD_IRR_IDENTITY_APPROVAL_V1' }, base.staged)), ['APPROVAL_SCHEMA_UNKNOWN']);
  });

  it('IAP-41 refuses any scope other than the one permitted scope', () => {
    const cases: Array<[string, (copy: LooseApproval) => void, RegExp]> = [
      ['another environment', (copy) => { copy.scope.environment = 'SHARED_MULTI_USER_IIPS'; }, /environment/],
      ['another consumer', (copy) => { copy.scope.consumer = 'ALL_CONSUMERS'; }, /consumer/],
      ['a stronger roster class', (copy) => { copy.scope.rosterDataClass = 'INDEPENDENTLY_VERIFIED'; }, /rosterDataClass/],
      ['product-wide authoritative use', (copy) => { copy.scope.productWideAuthoritativeUse = true; }, /productWideAuthoritativeUse/],
      ['production use', (copy) => { copy.scope.productionUse = true; }, /productionUse/],
      ['hosted use', (copy) => { copy.scope.hostedUse = true; }, /hostedUse/],
      ['multi-user use', (copy) => { copy.scope.multiUserUse = true; }, /multiUserUse/],
      ['commercial use', (copy) => { copy.scope.commercialUse = true; }, /commercialUse/],
    ];
    for (const [label, change, field] of cases) {
      const result = evaluate(changed(baseRecord, change), base.staged);
      assert.deepEqual(codes(result), ['SCOPE_MISMATCH'], label);
      assert.match(result.failures[0]!.detail, field, label);
      assert.equal(result.authorizesInstallation, false, label);
    }
  });
});

describe('W04 identity approval — the contract: limitations and exclusions', () => {
  it('IAP-50 refuses any difference between the limitations accepted and the limitations of the export', () => {
    assert.equal(baseRecord.accepted.exportLimitationCodes.length, 8);
    assert.deepEqual(baseRecord.accepted.additionalLimitationCodes, ['NON_EQ_SERIES_HOLDINGS_UNRESOLVED', 'NSE_SOURCE_FILE_WITHOUT_RETRIEVAL_RECEIPT', 'HOLDINGS_COVERAGE_NOT_MEASURED']);
    const cases: Array<[string, (copy: LooseApproval) => void]> = [
      ['one export limitation left out', (copy) => { copy.accepted.exportLimitationCodes.pop(); }],
      ['none accepted', (copy) => { copy.accepted.exportLimitationCodes = []; }],
      ['one renamed', (copy) => { copy.accepted.exportLimitationCodes[0] = 'CIN_EXPORTED'; }],
      ['one added', (copy) => { copy.accepted.exportLimitationCodes.push('SOMETHING_ELSE'); }],
      ['one stated twice', (copy) => { copy.accepted.exportLimitationCodes.push(copy.accepted.exportLimitationCodes[0]); }],
      ['one additional limitation left out', (copy) => { copy.accepted.additionalLimitationCodes.pop(); }],
      ['a fixed additional limitation left out', (copy) => { copy.accepted.additionalLimitationCodes.shift(); }],
      ['an additional limitation stated twice', (copy) => { copy.accepted.additionalLimitationCodes.push(copy.accepted.additionalLimitationCodes[0]); }],
      ['an additional limitation nobody defined', (copy) => { copy.accepted.additionalLimitationCodes.push('EVERYTHING_ELSE_TOO'); }],
      ['an additional limitation renamed', (copy) => { copy.accepted.additionalLimitationCodes[0] = 'NON_EQ_SERIES_RESOLVED'; }],
      ['additional limitations none', (copy) => { copy.accepted.additionalLimitationCodes = []; }],
    ];
    for (const [label, change] of cases) {
      const result = evaluate(changed(baseRecord, change), base.staged);
      assert.deepEqual(codes(result), ['LIMITATION_MISMATCH'], label);
      assert.equal(result.authorizesInstallation, false, label);
    }
    // The order in which they are written does not matter.
    const reordered = changed(baseRecord, (copy) => { copy.accepted.exportLimitationCodes.reverse(); copy.accepted.additionalLimitationCodes.reverse(); });
    assert.deepEqual(evaluate(reordered, base.staged).failures, []);

    // Checked without a staged export: the fixed limitations must be there and no unknown one may be.
    assert.deepEqual(evaluate(baseRecord, null).failures, []);
    assert.deepEqual(codes(evaluate(changed(baseRecord, (copy) => { copy.accepted.additionalLimitationCodes = ['HOLDINGS_COVERAGE_NOT_MEASURED']; }), null)), ['LIMITATION_MISMATCH']);
    assert.deepEqual(codes(evaluate(changed(baseRecord, (copy) => { copy.accepted.additionalLimitationCodes.push('EVERYTHING_ELSE_TOO'); }), null)), ['LIMITATION_MISMATCH']);
  });

  it('IAP-51 refuses any difference between the exclusions accepted and the records the export withholds (the two Jain Irrigation records)', () => {
    // The slice holds the two master records the full export withholds: both ISINs of Jain Irrigation.
    const withheld = staging('withheld', 1050, 1060, { extra: { acceptedWithheld: 2 } });
    assert.equal(withheld.staged.report.coverage.master.withheld, 2);
    const record = testApprovalFor(withheld.staged, IRR_COMMIT);
    assert.deepEqual(record.accepted.withheldRecords, [
      { isin: 'IN9175A01010', reasons: ['ISSUER_SHARED_ACROSS_ISINS'] },
      { isin: 'INE175A01038', reasons: ['ISSUER_SHARED_ACROSS_ISINS'] },
    ]);
    // Withheld, not resolved: neither ISIN is in the staged roster or listing map.
    for (const name of [ROSTER, LISTING_MAP]) {
      const text = readFileSync(join(withheld.stagingDir, 'identity', name), 'utf8');
      assert.ok(!text.includes('INE175A01038') && !text.includes('IN9175A01010'), `${name} holds neither withheld ISIN`);
    }
    assert.deepEqual(evaluate(record, withheld.staged).failures, []);

    const cases: Array<[string, (copy: LooseApproval) => void]> = [
      ['one exclusion left out', (copy) => { copy.accepted.withheldRecords.pop(); }],
      ['no exclusion accepted', (copy) => { copy.accepted.withheldRecords = []; }],
      ['another record named', (copy) => { copy.accepted.withheldRecords[0].isin = 'INE002A01018'; }],
      ['another reason given', (copy) => { copy.accepted.withheldRecords[0].reasons = ['ISIN_DUPLICATE']; }],
      ['a reason left out', (copy) => { copy.accepted.withheldRecords[0].reasons = []; }],
      ['one more record', (copy) => { copy.accepted.withheldRecords.push({ isin: 'INE002A01018', reasons: ['ISIN_DUPLICATE'] }); }],
      ['one record twice', (copy) => { copy.accepted.withheldRecords.push({ ...copy.accepted.withheldRecords[0] }); }],
    ];
    for (const [label, change] of cases) {
      const result = evaluate(changed(record, change), withheld.staged);
      assert.deepEqual(codes(result), ['EXCLUSION_MISMATCH'], label);
      assert.equal(result.authorizesInstallation, false, label);
    }
    // An exclusion accepted for an export that withholds nothing is also a difference.
    const extra = changed(baseRecord, (copy) => { copy.accepted.withheldRecords = record.accepted.withheldRecords; });
    assert.deepEqual(codes(evaluate(extra, base.staged)), ['EXCLUSION_MISMATCH']);
    // The withheld count of the generation is bound separately.
    const miscounted = changed(record, (copy) => { copy.subject.generation.recordsWithheld = 0; });
    assert.deepEqual(codes(evaluate(miscounted, withheld.staged)), ['GENERATION_MISMATCH']);
  });
});

describe('W04 identity approval — the contract: the exact files and generation', () => {
  const flip = (sha: string): string => (sha.startsWith('0') ? `1${sha.slice(1)}` : `0${sha.slice(1)}`);

  for (const [id, name] of [['IAP-60', ROSTER], ['IAP-61', LISTING_MAP], ['IAP-62', CORPORATE_ACTIONS]] as const) {
    it(`${id} refuses a digest mismatch of ${name}`, () => {
      const result = evaluate(changed(baseRecord, (copy) => { copy.subject.files[name].sha256 = flip(copy.subject.files[name].sha256); }), base.staged);
      assert.deepEqual(codes(result), ['DIGEST_MISMATCH']);
      assert.equal(result.failures.length, 1, 'only the altered file is reported');
      assert.ok(result.failures[0]!.detail.startsWith(`${name}:`));
      assert.equal(result.authorizesInstallation, false);

      const size = evaluate(changed(baseRecord, (copy) => { copy.subject.files[name].bytes += 1; }), base.staged);
      assert.deepEqual(codes(size), ['DIGEST_MISMATCH']);
      assert.ok(size.failures[0]!.detail.startsWith(`${name}:`));
    });
  }

  it('IAP-63 an approval of one set of files never authorizes another set', () => {
    const other = staging('other', 5, 10);
    assert.notEqual(other.staged.digests[ROSTER].sha256, base.staged.digests[ROSTER].sha256);
    assert.notEqual(other.staged.digests[LISTING_MAP].sha256, base.staged.digests[LISTING_MAP].sha256);
    // Both exports have an empty corporate-action table, so that one file is the same file.
    assert.equal(other.staged.digests[CORPORATE_ACTIONS].sha256, base.staged.digests[CORPORATE_ACTIONS].sha256);

    const result = evaluate(baseRecord, other.staged);
    // Another slice of the master: other bytes, another source checksum, and a roster label that names it.
    assert.deepEqual(codes(result), ['DIGEST_MISMATCH', 'GENERATION_MISMATCH', 'SOURCE_MISMATCH']);
    assert.deepEqual(result.failures.filter((failure) => failure.code === 'DIGEST_MISMATCH').map((failure) => failure.detail.split(':')[0]), [ROSTER, LISTING_MAP]);
    assert.equal(result.authorizesInstallation, false);
    assert.equal(evaluate(testApprovalFor(other.staged, IRR_COMMIT), base.staged).authorizesInstallation, false);
  });

  it('IAP-64 refuses another generation even when the digests are stated correctly', () => {
    const cases: Array<[string, (copy: LooseApproval) => void, RegExp]> = [
      ['another mapping version', (copy) => { copy.subject.generation.mappingVersion = 'IPD-IRR-IDENTITY-EXPORT-MAPPING-2'; }, /mappingVersion/],
      ['another roster label', (copy) => { copy.subject.generation.rosterLabel = 'another label'; }, /rosterLabel/],
      ['a P7 manifest that was not used', (copy) => { copy.subject.generation.p7ManifestSha256 = 'a'.repeat(64); }, /p7ManifestSha256/],
      ['a supplement that was not used', (copy) => { copy.subject.generation.issuerKeySupplementSha256 = 'a'.repeat(64); }, /issuerKeySupplementSha256/],
      ['another exported count', (copy) => { copy.subject.generation.securitiesExported += 1; }, /securitiesExported/],
      ['another report schema', (copy) => { copy.subject.generation.reportSchemaVersion = 'IPD_IRR_IDENTITY_SOURCE_EXPORT_V0'; }, /reportSchemaVersion/],
    ];
    for (const [label, change, field] of cases) {
      const result = evaluate(changed(baseRecord, change), base.staged);
      assert.deepEqual(codes(result), ['GENERATION_MISMATCH'], label);
      assert.match(result.failures[0]!.detail, field, label);
      assert.equal(result.authorizesInstallation, false, label);
    }
    // A coverage count that was not made changes the generation and the limitations that follow from it.
    const claimed = changed(baseRecord, (copy) => { copy.subject.generation.requiredIsins = { listSha256: 'a'.repeat(64), requested: 64, covered: 64, uncovered: 0 }; });
    assert.deepEqual(codes(evaluate(claimed, base.staged)), ['GENERATION_MISMATCH']);
  });

  it('IAP-65 refuses another IRR commit than the one whose loader accepted the files', () => {
    assert.deepEqual(codes(evaluate(changed(baseRecord, (copy) => { copy.subject.irrCommit = OTHER_COMMIT; }), base.staged)), ['IRR_COMMIT_MISMATCH']);
    assert.deepEqual(codes(evaluate(baseRecord, base.staged, { gateCommit: OTHER_COMMIT })), ['IRR_COMMIT_MISMATCH']);
    // A gate that could not determine the IRR commit matches no approval.
    assert.deepEqual(codes(evaluate(baseRecord, base.staged, { gateCommit: null })), ['IRR_COMMIT_MISMATCH']);
  });

  it('IAP-66 refuses another P04 source than the one the staged export was generated from', () => {
    const cases: Array<[string, (copy: LooseApproval) => void, RegExp]> = [
      ['another batch', (copy) => { copy.subject.p04Source.batchId = 'BATCH-OTHER'; }, /batchId/],
      ['another authorization', (copy) => { copy.subject.p04Source.authorizationRef = 'AUTH-OTHER'; }, /authorizationRef/],
      ['another operating mode', (copy) => { copy.subject.p04Source.operatingMode = 'LIVE_REGISTRY_VERIFIED'; }, /operatingMode/],
      ['another checksum', (copy) => { copy.subject.p04Source.checksumSha256 = 'f'.repeat(64); }, /checksumSha256/],
      ['another record count', (copy) => { copy.subject.p04Source.recordCount += 1; }, /recordCount/],
    ];
    for (const [label, change, field] of cases) {
      const result = evaluate(changed(baseRecord, change), base.staged);
      assert.deepEqual(codes(result), ['SOURCE_MISMATCH'], label);
      assert.equal(result.failures.length, 1, label);
      assert.match(result.failures[0]!.detail, field, label);
      assert.equal(result.authorizesInstallation, false, label);
    }
  });

  it('IAP-67 refuses another IPD tool commit than the one the tool runs from, and a tool whose commit cannot be established', () => {
    // The record names another commit.
    assert.deepEqual(codes(evaluate(changed(baseRecord, (copy) => { copy.subject.ipdToolCommit = OTHER_COMMIT; }), base.staged)), ['IPD_TOOL_COMMIT_MISMATCH']);
    // The tool runs from another commit.
    assert.deepEqual(codes(evaluate(baseRecord, base.staged, { tool: { commit: OTHER_COMMIT, unmodified: true, detail: '' } })), ['IPD_TOOL_COMMIT_MISMATCH']);

    // The commit is not known, is not a commit, or does not describe the code that runs.
    const undetermined: ToolIdentity[] = [
      { commit: null, unmodified: false, detail: 'the tool does not run from a git checkout of IPD' },
      { commit: null, unmodified: true, detail: '' },
      { commit: 'main', unmodified: true, detail: '' },
      { commit: TEST_TOOL_COMMIT.slice(0, 7), unmodified: true, detail: '' },
      { commit: TEST_TOOL_COMMIT, unmodified: false, detail: 'tracked files of the tool differ from the commit; commit or discard the changes' },
      { commit: TEST_TOOL_COMMIT, unmodified: false, detail: 'the compiled tool is older than its source; build it again' },
    ];
    for (const tool of undetermined) {
      const result = evaluate(baseRecord, base.staged, { tool });
      assert.deepEqual(codes(result), ['IPD_TOOL_COMMIT_UNDETERMINED'], JSON.stringify(tool));
      assert.equal(result.failures.length, 1);
      if (tool.detail.length > 0) assert.ok(result.failures[0]!.detail.endsWith(tool.detail));
      assert.equal(result.authorizesInstallation, false);
    }
    // A record cannot name the commit as "whatever runs".
    for (const value of ['', 'HEAD', 'any', null]) {
      assert.deepEqual(codes(evaluate(changed(baseRecord, (copy) => { copy.subject.ipdToolCommit = value; }), base.staged)), ['APPROVAL_MALFORMED'], String(value));
    }
    // A tool that was not compared leaves the approval short of an authorization.
    const unchecked = evaluate(baseRecord, base.staged, { tool: null });
    assert.deepEqual(unchecked.failures, []);
    assert.equal(unchecked.checked.tool, false);
    assert.equal(unchecked.authorizesInstallation, false);
  });
});

describe('W04 identity approval — the two rules that were examined, and what follows from each', () => {
  it('IAP-70 CV-22 Option C is determined not to apply: the policy records it, the record is not asked, and the tool cannot touch what the rule governs', () => {
    const determination = IDENTITY_APPROVAL_POLICY.determinations.cv22OptionC;
    assert.equal(determination.determination, 'DOES_NOT_APPLY');
    assert.match(determination.source, /IIPS_v3\.0_CV22_OPTION_C_PA_DECISION_2026-10-19\.md/);
    assert.ok(determination.basis.length >= 3 && determination.basis.every((line) => line.trim().length > 40));
    assert.match(determination.consequence, /No CV-22 prerequisite is checked/);

    // The record carries no CV-22 answer and has no place for one; a complete record is valid without it.
    assert.equal(Object.prototype.hasOwnProperty.call(baseRecord, 'determinations'), false);
    assert.equal(evaluate(baseRecord, base.staged).authorizesInstallation, true);
    const answered = changed(baseRecord, (copy) => { copy.determinations = { cv22OptionC: { applicability: 'APPLIES', prerequisites: [] } }; });
    assert.deepEqual(codes(evaluate(answered, base.staged)), ['APPROVAL_MALFORMED']);
    // No failure code about CV-22 exists any more.
    const moduleText = readFileSync(join(ROOT, 'src', 'identity', 'irr_identity_approval.ts'), 'utf8');
    assert.ok(!/CV22_NOT_DETERMINED|CV22_PREREQUISITE_NOT_MET|prerequisiteIds/.test(moduleText));

    // What makes the determination safe is technical: the only place written is the identity directory.
    const dataDir = freshDir('cv22-data');
    mkdirSync(join(dataDir, 'governed-universe'), { recursive: true });
    writeFileSync(join(dataDir, 'governed-universe', 'sector-reference.json'), '{"rows":13}\n');
    const neighbours = snapshot(join(dataDir, 'governed-universe'));
    const { stagingDir, staged } = staging('cv22');
    installUnderTest({ stagingDir, dataDir, approvalFile: writeApprovalFile(freshDir('approval'), testApprovalFor(staged, IRR_COMMIT)) });
    assert.equal(identityDirOf(dataDir), join(dataDir, 'investment', 'identity'));
    assert.deepEqual(readdirSync(dataDir).sort(), ['governed-universe', 'investment']);
    assert.deepEqual(readdirSync(join(dataDir, 'investment')), ['identity']);
    assert.deepEqual(readdirSync(identityDirOf(dataDir)).sort(), [...FILES].sort());
    assert.deepEqual(snapshot(join(dataDir, 'governed-universe')), neighbours, 'nothing beside the identity directory was touched');
    // The scope the determination relies on cannot be widened by a record.
    assert.deepEqual(codes(evaluate(changed(baseRecord, (copy) => { copy.scope.productWideAuthoritativeUse = true; }), base.staged)), ['SCOPE_MISMATCH']);
  });

  it('IAP-71 the IID roster default of 200 is a default, not a limit: a larger roster installs, and only with the excess accepted by name', () => {
    const rule = IDENTITY_APPROVAL_POLICY.determinations.iidRosterContentDefault;
    assert.equal(rule.determination, 'APPLIES_AS_DESIGN_DEFAULT_NOT_AS_LIMIT');
    assert.match(rule.source, /IIPS_V3_IID_INVESTMENT_INTELLIGENCE_DESIGN_REFINEMENT_2026-11-05\.md/);
    assert.deepEqual(IDENTITY_APPROVAL_POLICY.rosterContentDefault, { issuerCap: 200, limitationCode: 'ROSTER_LARGER_THAN_IID_DESIGN_DEFAULT' });
    const code = IDENTITY_APPROVAL_POLICY.rosterContentDefault.limitationCode;

    // Five issuers: within the default. The limitation does not exist for this export and may not be claimed.
    assert.ok(!additionalLimitationCodesFor(TEST_APPROVAL_POLICY, base.staged.report).includes(code));
    assert.ok(!baseRecord.accepted.additionalLimitationCodes.includes(code));
    assert.deepEqual(codes(evaluate(changed(baseRecord, (copy) => { copy.accepted.additionalLimitationCodes.push(code); }), base.staged)), ['LIMITATION_MISMATCH']);

    // Exactly 200 issuers: still within it.
    const atCap = staging('at-cap', 100, 300);
    assert.equal(atCap.staged.report.coverage.issuers.exported, 200);
    assert.ok(!additionalLimitationCodesFor(TEST_APPROVAL_POLICY, atCap.staged.report).includes(code));

    // 250 issuers: beyond it. Not refused for its size, and not installable in silence either.
    const large = staging('large', 100, 350);
    assert.equal(large.staged.report.coverage.issuers.exported, 250);
    assert.ok(additionalLimitationCodesFor(TEST_APPROVAL_POLICY, large.staged.report).includes(code));
    const largeRecord = testApprovalFor(large.staged, IRR_COMMIT);
    assert.ok(largeRecord.accepted.additionalLimitationCodes.includes(code));
    assert.equal(evaluate(largeRecord, large.staged).authorizesInstallation, true);
    const silent = changed(largeRecord, (copy) => { copy.accepted.additionalLimitationCodes = copy.accepted.additionalLimitationCodes.filter((item: string) => item !== code); });
    const refused = evaluate(silent, large.staged);
    assert.deepEqual(codes(refused), ['LIMITATION_MISMATCH']);
    assert.match(refused.failures[0]!.detail, new RegExp(code));
    assert.equal(refused.authorizesInstallation, false);

    // The same through the installation: refused without the acceptance, installed with it.
    const dataDir = freshDir('large-data');
    const dir = freshDir('large-approvals');
    assert.equal(refusal(() => installUnderTest({ stagingDir: large.stagingDir, dataDir, approvalFile: writeApprovalFile(dir, silent, 'silent.json') })).code, 'LIMITATION_MISMATCH');
    assert.deepEqual(readdirSync(dataDir), []);
    assert.equal(installUnderTest({ stagingDir: large.stagingDir, dataDir, approvalFile: writeApprovalFile(dir, largeRecord, 'accepted.json') }).action, 'INSTALLED');
    assert.deepEqual(readIdentityDirectoryDigests(identityDirOf(dataDir)), large.staged.digests);
  });

  it('IAP-72 holdings coverage: a generation that did not count it carries that as a limitation; one that did binds the counts', () => {
    const code = IDENTITY_APPROVAL_POLICY.coverageNotMeasuredLimitationCode;
    assert.equal(code, 'HOLDINGS_COVERAGE_NOT_MEASURED');
    // The base generation counted no coverage.
    assert.ok(baseRecord.accepted.additionalLimitationCodes.includes(code));
    const silent = changed(baseRecord, (copy) => { copy.accepted.additionalLimitationCodes = copy.accepted.additionalLimitationCodes.filter((item: string) => item !== code); });
    assert.deepEqual(codes(evaluate(silent, base.staged)), ['LIMITATION_MISMATCH']);

    const covered = D05_AUTHENTICATED_UNIVERSE_ENTITIES[0]!.isin;
    const counted = staging('coverage', 0, 5, { extra: { requiredIsins: [covered] } });
    const record = testApprovalFor(counted.staged, IRR_COMMIT);
    assert.deepEqual(record.subject.generation.requiredIsins, {
      listSha256: (counted.staged.report.inputs.requiredIsins as { listSha256: string }).listSha256,
      requested: 1,
      covered: 1,
      uncovered: 0,
    });
    assert.ok(!record.accepted.additionalLimitationCodes.includes(code), 'coverage was counted, so the limitation does not exist');
    assert.equal(evaluate(record, counted.staged).authorizesInstallation, true);
    // The coverage the approver saw is part of what was approved.
    assert.deepEqual(codes(evaluate(changed(record, (copy) => { copy.subject.generation.requiredIsins.covered = 0; copy.subject.generation.requiredIsins.uncovered = 1; }), counted.staged)), ['GENERATION_MISMATCH']);
    // The same files generated without the coverage count are another generation, with another limitation.
    assert.deepEqual(counted.staged.digests, base.staged.digests);
    assert.deepEqual(codes(evaluate(record, base.staged)), ['GENERATION_MISMATCH', 'LIMITATION_MISMATCH']);
  });
});

describe('W04 identity approval — the blank template and the repository', () => {
  it('IAP-80 the tracked template is a complete form with nothing decided, and is refused', () => {
    const template = JSON.parse(readFileSync(TEMPLATE, 'utf8')) as LooseApproval;
    assert.equal(template.schemaVersion, IDENTITY_APPROVAL_SCHEMA);
    for (const policy of [IDENTITY_APPROVAL_POLICY, TEST_APPROVAL_POLICY]) {
      const result = evaluate(template, base.staged, { policy });
      assert.equal(result.authorizesInstallation, false);
      assert.equal(result.approval, null);
      assert.equal(result.failures.length, 29, 'the blank form is refused for 29 reasons');
      // Complete: no field of the contract is absent from the form and the form has no other field.
      assert.deepEqual(result.failures.filter((failure) => / is missing$| is not a field of this record$/.test(failure.detail)), []);
      assert.deepEqual(codes(result), ['APPROVAL_MALFORMED', 'APPROVER_DID_NOT_APPROVE']);
    }

    // Nothing that decides anything is filled in.
    assert.equal(template.approvalId, null);
    assert.equal(template.status, null);
    assert.equal(template.approvedAtUtc, null);
    assert.equal(template.reviewDateUtc, null);
    assert.equal(template.revocation, null);
    assert.equal(template.subject.irrCommit, null);
    assert.equal(template.subject.ipdToolCommit, null);
    for (const name of FILES) assert.deepEqual(template.subject.files[name], { sha256: null, bytes: null });
    assert.ok(Object.values(template.subject.p04Source).every((value) => value === null));
    assert.ok(Object.values(template.subject.generation).every((value) => value === null));
    assert.deepEqual(template.accepted, { exportLimitationCodes: [], additionalLimitationCodes: [], withheldRecords: [] });
    // One approver entry, with the decision and the statement left to the approver.
    assert.deepEqual(template.approver, { authorityId: null, name: null, decision: null, statement: null });
    for (const gone of ['approvals', 'determinations', 'qualifications', 'governance', 'expiresAtUtc']) {
      assert.equal(Object.prototype.hasOwnProperty.call(template, gone), false, `the form has no ${gone}`);
    }

    // What is printed on the form is what an approval cannot change: the form's identity and the one permitted scope.
    assert.equal(template.policyVersion, IDENTITY_APPROVAL_POLICY.policyVersion);
    assert.deepEqual(template.decision, IDENTITY_APPROVAL_POLICY.decision);
    assert.deepEqual(template.scope, IDENTITY_APPROVAL_POLICY.scope);
    // The approver's identifier is not printed on the form: the approver writes it.
    assert.ok(!readFileSync(TEMPLATE, 'utf8').includes(IDENTITY_APPROVAL_POLICY.approver.authorityId));
  });

  it('IAP-81 the repository tracks no document of the approval schema other than the blank template', () => {
    const found: string[] = [];
    const skipped = new Set(['.git', 'node_modules', 'dist']);
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir).sort()) {
        if (skipped.has(name)) continue;
        const path = join(dir, name);
        const stats = statSync(path);
        if (stats.isDirectory()) {
          walk(path);
        } else if (name.endsWith('.json') && stats.size <= APPROVAL_RECORD_MAX_BYTES) {
          const text = readFileSync(path, 'utf8');
          if (!text.includes(IDENTITY_APPROVAL_SCHEMA)) continue;
          let value: unknown = null;
          try {
            value = JSON.parse(text.replace(/^\uFEFF/, ''));
          } catch {
            value = null;
          }
          // A file that names the schema and cannot be parsed is reported too: it is not the template.
          if (!(typeof value === 'object' && value !== null) || (value as LooseApproval).schemaVersion === IDENTITY_APPROVAL_SCHEMA) found.push(relative(ROOT, path));
        }
      }
    };
    walk(ROOT);
    assert.deepEqual(found, [relative(ROOT, TEMPLATE)]);
  });
});

/* ============================================================================================ */

describe('W04 identity approval — enforcement in the installation', () => {
  it('IAP-100 no installation without an approval record, by any route', () => {
    const { stagingDir } = staging('missing');
    const dataDir = freshDir('data');
    const before = snapshot(stagingDir);
    const absent = join(freshDir('nowhere'), 'approval.json');
    const directory = freshDir('a-directory');

    // The governed entry point. The option is required by its type; a caller that omits it anyway is refused.
    const withoutOption = { stagingDir, dataDir } as unknown as Parameters<typeof installStagedIdentity>[0];
    assert.deepEqual(refusal(() => installStagedIdentity(withoutOption)), { code: 'APPROVAL_MISSING', codes: ['APPROVAL_MISSING'] });
    for (const approvalFile of ['', '   ', absent, directory]) {
      assert.equal(refusal(() => installStagedIdentity({ stagingDir, dataDir, approvalFile })).code, 'APPROVAL_MISSING');
      assert.equal(refusal(() => installUnderTest({ stagingDir, dataDir, approvalFile })).code, 'APPROVAL_MISSING');
    }
    for (const approvalFile of [null, undefined, 0, true, {}, ['x']]) {
      const options = { stagingDir, dataDir, approvalFile } as unknown as Parameters<typeof installStagedIdentity>[0];
      assert.equal(refusal(() => installStagedIdentity(options)).code, 'APPROVAL_MISSING');
    }
    assert.deepEqual(readdirSync(dataDir), []);
    assert.deepEqual(snapshot(stagingDir), before, 'the staging directory is untouched');
    assert.equal(existsSync(absent), false, 'no approval file was created');
  });

  it('IAP-101 refuses an approval file that cannot be read as a record', () => {
    const { stagingDir, staged } = staging('unreadable');
    const dataDir = freshDir('data');
    const dir = freshDir('approvals');
    const attempt = (approvalFile: string) => refusal(() => installUnderTest({ stagingDir, dataDir, approvalFile })).code;

    writeFileSync(join(dir, 'not-json.json'), '{ "schemaVersion": ');
    assert.equal(attempt(join(dir, 'not-json.json')), 'APPROVAL_UNREADABLE');
    writeFileSync(join(dir, 'empty.json'), '');
    assert.equal(attempt(join(dir, 'empty.json')), 'APPROVAL_UNREADABLE');
    writeFileSync(join(dir, 'text.json'), 'APPROVED by the approver\n');
    assert.equal(attempt(join(dir, 'text.json')), 'APPROVAL_UNREADABLE');
    writeFileSync(join(dir, 'list.json'), '[]');
    assert.equal(attempt(join(dir, 'list.json')), 'APPROVAL_UNREADABLE');
    writeFileSync(join(dir, 'huge.json'), `{"schemaVersion":"${IDENTITY_APPROVAL_SCHEMA}","padding":"${'x'.repeat(APPROVAL_RECORD_MAX_BYTES)}"}`);
    assert.equal(attempt(join(dir, 'huge.json')), 'APPROVAL_UNREADABLE');
    // The staged report, the gate record and a review record are not approvals.
    assert.equal(attempt(join(stagingDir, 'provisioning-report.json')), 'APPROVAL_SCHEMA_UNKNOWN');
    assert.equal(attempt(join(stagingDir, 'irr-loader-gate.json')), 'APPROVAL_SCHEMA_UNKNOWN');
    assert.equal(attempt(writeReviewRecord(stagingDir).path), 'APPROVAL_SCHEMA_UNKNOWN');
    assert.equal(attempt(TEMPLATE), 'APPROVAL_MALFORMED');
    assert.deepEqual(readdirSync(dataDir), []);

    // A byte-order mark, which Windows editors write, is not part of the document.
    const withBom = join(dir, 'bom.json');
    writeFileSync(withBom, `\uFEFF${JSON.stringify(testApprovalFor(staged, IRR_COMMIT))}`);
    assert.equal(installUnderTest({ stagingDir, dataDir, approvalFile: withBom }).action, 'INSTALLED');
  });

  it('IAP-102 one valid approval by the one approver, for exactly the staged files, installs them, and the receipt names the approval', () => {
    const { stagingDir, staged } = staging('valid');
    const dataDir = freshDir('data');
    const record = testApprovalFor(staged, IRR_COMMIT);
    const approvalFile = writeApprovalFile(freshDir('approval'), record);
    const approvalBytes = readFileSync(approvalFile);

    const outcome = installUnderTest({ stagingDir, dataDir, approvalFile });
    assert.equal(outcome.action, 'INSTALLED');
    assert.deepEqual(readIdentityDirectoryDigests(identityDirOf(dataDir)), staged.digests);
    for (const name of FILES) assert.equal(outcome.installedFiles[name].sha256, record.subject.files[name].sha256, 'what was installed is what was approved');
    assert.deepEqual(outcome.approval, {
      approvalId: record.approvalId,
      recordSha256: createHash('sha256').update(approvalBytes).digest('hex'),
      policyVersion: TEST_APPROVAL_POLICY.policyVersion,
      decisionId: TEST_APPROVAL_POLICY.decision.decisionId,
      approver: TEST_AUTHORITY.authorityId,
      approvedAtUtc: record.approvedAtUtc,
      reviewDateUtc: record.reviewDateUtc,
      ipdToolCommit: TEST_TOOL_COMMIT,
    });
    assert.equal(recordInstallation(stagingDir, outcome, '2026-11-13T00:00:00.000Z'), true);
    const receipt = JSON.parse(readFileSync(join(stagingDir, STAGED_INSTALL_RECEIPT_FILE), 'utf8')) as LooseApproval;
    assert.equal(receipt.schemaVersion, INSTALL_RECEIPT_SCHEMA);
    assert.equal(INSTALL_RECEIPT_SCHEMA, 'IPD_IRR_IDENTITY_INSTALL_RECEIPT_V3');
    assert.deepEqual(receipt.approval, outcome.approval);
    // The approval file is read, never written.
    assert.deepEqual(readFileSync(approvalFile), approvalBytes);
  });

  it('IAP-103 the governed entry point refuses a record of the test authority, and the test policy is not the governed one', () => {
    const { stagingDir, staged } = staging('governed');
    const dataDir = freshDir('data');
    const approvalFile = writeApprovalFile(freshDir('approval'), testApprovalFor(staged, IRR_COMMIT));
    const refused = refusal(() => installStagedIdentity({ stagingDir, dataDir, approvalFile }));
    assert.equal(refused.code, 'POLICY_VERSION_MISMATCH');
    assert.deepEqual(refused.codes, ['APPROVER_NOT_AUTHORIZED', 'DECISION_REFERENCE_MISMATCH', 'POLICY_VERSION_MISMATCH']);

    // The same record relabelled with everything the governed policy prints on its form: the approver is still nobody.
    const relabelled = changed(testApprovalFor(staged, IRR_COMMIT), (copy) => {
      copy.policyVersion = IDENTITY_APPROVAL_POLICY.policyVersion;
      copy.decision = { ...IDENTITY_APPROVAL_POLICY.decision };
    });
    const relabelledRefusal = refusal(() => installStagedIdentity({ stagingDir, dataDir, approvalFile: writeApprovalFile(freshDir('approval'), relabelled) }));
    assert.deepEqual(relabelledRefusal, { code: 'APPROVER_NOT_AUTHORIZED', codes: ['APPROVER_NOT_AUTHORIZED'] });
    assert.deepEqual(readdirSync(dataDir), []);

    assert.notEqual(TEST_APPROVAL_POLICY.policyVersion, IDENTITY_APPROVAL_POLICY.policyVersion);
    assert.notEqual(TEST_APPROVAL_POLICY.approver.authorityId, IDENTITY_APPROVAL_POLICY.approver.authorityId);
    assert.notEqual(TEST_APPROVAL_POLICY.approver.name, IDENTITY_APPROVAL_POLICY.approver.name);
    assert.notEqual(TEST_APPROVAL_POLICY.decision.decisionId, IDENTITY_APPROVAL_POLICY.decision.decisionId);
    // The tool commit the fixture names is no commit of this repository.
    assert.notEqual(readIpdToolIdentity().commit, TEST_TOOL_COMMIT);
  });

  it('IAP-104 the approval is checked before the gate, and a valid approval does not replace the gate', () => {
    const { stagingDir, staged } = staging('ungated', 0, 5, { gate: false });
    const dataDir = freshDir('data');
    const dir = freshDir('approvals');
    const good = writeApprovalFile(dir, testApprovalFor(staged, IRR_COMMIT), 'good.json');
    const expired = writeApprovalFile(dir, changed(testApprovalFor(staged, IRR_COMMIT), (copy) => { copy.reviewDateUtc = utc(-1); }), 'expired.json');
    assert.equal(refusal(() => installUnderTest({ stagingDir, dataDir, approvalFile: expired })).code, 'APPROVAL_EXPIRED');
    assert.equal(refusal(() => installUnderTest({ stagingDir, dataDir, approvalFile: good })).code, 'GATE_NOT_RUN');

    // The order is part of the contract. A record that is invalid in itself is refused before the
    // staging directory is read: it is reported even where nothing is staged.
    const nothingStaged = freshDir('nothing-staged');
    assert.equal(refusal(() => installUnderTest({ stagingDir: nothingStaged, dataDir, approvalFile: expired })).code, 'APPROVAL_EXPIRED');
    assert.equal(refusal(() => installUnderTest({ stagingDir: nothingStaged, dataDir, approvalFile: good })).code, 'STAGING_REPORT_ABSENT');
    assert.deepEqual(readdirSync(nothingStaged), []);
    // The tool commit is compared next, also before the staging directory is read: a record that
    // is valid in itself and names another tool commit is refused even where nothing is staged.
    const otherTool: ToolIdentity = { commit: OTHER_COMMIT, unmodified: true, detail: '' };
    const dirtyTool: ToolIdentity = { commit: TEST_TOOL_COMMIT, unmodified: false, detail: 'tracked files of the tool differ from the commit; commit or discard the changes' };
    assert.equal(refusal(() => installUnderTest({ stagingDir: nothingStaged, dataDir, approvalFile: good }, otherTool)).code, 'IPD_TOOL_COMMIT_MISMATCH');
    assert.equal(refusal(() => installUnderTest({ stagingDir: nothingStaged, dataDir, approvalFile: good }, dirtyTool)).code, 'IPD_TOOL_COMMIT_UNDETERMINED');
    // ... and after the record itself: an expired record is reported as expired whatever the tool is.
    assert.deepEqual(refusal(() => installUnderTest({ stagingDir: nothingStaged, dataDir, approvalFile: expired }, otherTool)), { code: 'APPROVAL_EXPIRED', codes: ['APPROVAL_EXPIRED'] });
    assert.deepEqual(readdirSync(nothingStaged), []);
    // With files staged and gated, a tool mismatch still stops the installation.
    const gated = staging('gated-other-tool');
    const gatedApproval = writeApprovalFile(dir, testApprovalFor(gated.staged, IRR_COMMIT), 'gated.json');
    assert.equal(refusal(() => installUnderTest({ stagingDir: gated.stagingDir, dataDir, approvalFile: gatedApproval }, otherTool)).code, 'IPD_TOOL_COMMIT_MISMATCH');
    assert.equal(refusal(() => installUnderTest({ stagingDir: gated.stagingDir, dataDir, approvalFile: gatedApproval }, dirtyTool)).code, 'IPD_TOOL_COMMIT_UNDETERMINED');
    // A record for other files is refused before the gate is considered.
    const forOtherFiles = writeApprovalFile(dir, testApprovalFor(staging('other-files', 5, 10).staged, IRR_COMMIT), 'other-files.json');
    assert.equal(refusal(() => installUnderTest({ stagingDir, dataDir, approvalFile: forOtherFiles })).code, 'DIGEST_MISMATCH');

    // A gate that could not determine the IRR commit: the approval cannot be matched to it.
    const unknownCommit = staging('unknown-commit', 0, 5, { irrCommit: null });
    const approval = writeApprovalFile(dir, testApprovalFor(unknownCommit.staged, IRR_COMMIT), 'unknown-commit.json');
    assert.equal(refusal(() => installUnderTest({ stagingDir: unknownCommit.stagingDir, dataDir, approvalFile: approval })).code, 'IRR_COMMIT_MISMATCH');
    assert.deepEqual(readdirSync(dataDir), []);
  });

  it('IAP-105 a repeated run that would change nothing still requires a valid approval', () => {
    const { stagingDir, staged } = staging('repeat');
    const dataDir = freshDir('data');
    const dir = freshDir('approvals');
    const good = writeApprovalFile(dir, testApprovalFor(staged, IRR_COMMIT), 'good.json');
    assert.equal(installUnderTest({ stagingDir, dataDir, approvalFile: good }).action, 'INSTALLED');
    assert.equal(installUnderTest({ stagingDir, dataDir, approvalFile: good }).action, 'ALREADY_INSTALLED');

    const before = snapshot(dataDir);
    const revoked = writeApprovalFile(dir, changed(testApprovalFor(staged, IRR_COMMIT), (copy) => { copy.status = 'REVOKED'; }), 'revoked.json');
    assert.equal(refusal(() => installUnderTest({ stagingDir, dataDir, approvalFile: revoked })).code, 'APPROVAL_REVOKED');
    assert.equal(refusal(() => installStagedIdentity({ stagingDir, dataDir, approvalFile: '' })).code, 'APPROVAL_MISSING');
    assert.deepEqual(snapshot(dataDir), before);
  });

  it('IAP-106 a rejected approval never modifies installed files, a fresh data directory or the staging directory', () => {
    // Version 1 is installed. Version 2 is staged, gated and waiting; every attempt below asks to replace.
    const first = staging('installed-v1', 0, 5);
    const dataDir = freshDir('data-with-v1');
    const dir = freshDir('approvals');
    installUnderTest({ stagingDir: first.stagingDir, dataDir, approvalFile: writeApprovalFile(dir, testApprovalFor(first.staged, IRR_COMMIT), 'v1.json') });
    mkdirSync(join(dataDir, 'investment', 'theses'), { recursive: true });
    writeFileSync(join(dataDir, 'investment', 'theses', 'kept.json'), '{"kept":true}\n');

    const second = staging('staged-v2', 1050, 1060, { extra: { acceptedWithheld: 2 } });
    const emptyData = freshDir('data-empty');
    const valid = testApprovalFor(second.staged, IRR_COMMIT);
    const flip = (sha: string): string => (sha.startsWith('0') ? `1${sha.slice(1)}` : `0${sha.slice(1)}`);

    const rejected: Array<[string, string, LooseApproval | string | null]> = [
      ['missing approval', 'APPROVAL_MISSING', null],
      ['approval file absent', 'APPROVAL_MISSING', join(dir, 'does-not-exist.json')],
      ['not JSON', 'APPROVAL_UNREADABLE', '{ not json'],
      ['another kind of document', 'APPROVAL_SCHEMA_UNKNOWN', buildReviewRecord(second.staged, { accepted: true, irrCommit: IRR_COMMIT }, TEST_TOOL) as unknown as LooseApproval],
      ['a record of the earlier two-approver schema', 'APPROVAL_SCHEMA_UNKNOWN', { ...valid, schemaVersion: 'IPD_IRR_IDENTITY_APPROVAL_V1' }],
      ['invalid structure: field missing', 'APPROVAL_MALFORMED', changed(valid, (copy) => delete copy.scope)],
      ['invalid structure: unknown field', 'APPROVAL_MALFORMED', changed(valid, (copy) => { copy.note = 'approved verbally'; })],
      ['invalid structure: blank template', 'APPROVAL_MALFORMED', JSON.parse(readFileSync(TEMPLATE, 'utf8')) as LooseApproval],
      ['invalid structure: no review date', 'APPROVAL_MALFORMED', changed(valid, (copy) => { copy.reviewDateUtc = null; })],
      ['unauthorized approver', 'APPROVER_NOT_AUTHORIZED', changed(valid, (copy) => { copy.approver = { ...copy.approver, authorityId: 'SOMEONE_ELSE' }; })],
      ['approver did not approve', 'APPROVER_DID_NOT_APPROVE', changed(valid, (copy) => { copy.approver.decision = 'REJECTED'; })],
      ['expired', 'APPROVAL_EXPIRED', changed(valid, (copy) => { copy.reviewDateUtc = utc(-1); })],
      ['not yet valid', 'APPROVAL_NOT_YET_VALID', changed(valid, (copy) => { copy.approvedAtUtc = utc(3600); copy.reviewDateUtc = utc(7200); })],
      ['revoked', 'APPROVAL_REVOKED', changed(valid, (copy) => { copy.status = 'REVOKED'; copy.revocation = { revokedAtUtc: utc(-60), reason: 'test' }; })],
      ['another policy version', 'POLICY_VERSION_MISMATCH', changed(valid, (copy) => { copy.policyVersion = 'IPD-IRR-IDENTITY-APPROVAL-POLICY-1'; })],
      ['incorrect decision reference', 'DECISION_REFERENCE_MISMATCH', changed(valid, (copy) => { copy.decision.decisionId = 'SOME-OTHER-DECISION'; })],
      ['scope: product-wide authoritative use', 'SCOPE_MISMATCH', changed(valid, (copy) => { copy.scope.productWideAuthoritativeUse = true; })],
      ['scope: production use', 'SCOPE_MISMATCH', changed(valid, (copy) => { copy.scope.productionUse = true; })],
      ['scope: hosted use', 'SCOPE_MISMATCH', changed(valid, (copy) => { copy.scope.hostedUse = true; })],
      ['scope: multi-user use', 'SCOPE_MISMATCH', changed(valid, (copy) => { copy.scope.multiUserUse = true; })],
      ['scope: commercial use', 'SCOPE_MISMATCH', changed(valid, (copy) => { copy.scope.commercialUse = true; })],
      ['modified limitation', 'LIMITATION_MISMATCH', changed(valid, (copy) => { copy.accepted.exportLimitationCodes.pop(); })],
      ['additional limitation not accepted', 'LIMITATION_MISMATCH', changed(valid, (copy) => { copy.accepted.additionalLimitationCodes.pop(); })],
      ['modified exclusion', 'EXCLUSION_MISMATCH', changed(valid, (copy) => { copy.accepted.withheldRecords.pop(); })],
      ['roster digest mismatch', 'DIGEST_MISMATCH', changed(valid, (copy) => { copy.subject.files[ROSTER].sha256 = flip(copy.subject.files[ROSTER].sha256); })],
      ['listing-map digest mismatch', 'DIGEST_MISMATCH', changed(valid, (copy) => { copy.subject.files[LISTING_MAP].sha256 = flip(copy.subject.files[LISTING_MAP].sha256); })],
      ['corporate-actions digest mismatch', 'DIGEST_MISMATCH', changed(valid, (copy) => { copy.subject.files[CORPORATE_ACTIONS].sha256 = flip(copy.subject.files[CORPORATE_ACTIONS].sha256); })],
      ['roster size mismatch', 'DIGEST_MISMATCH', changed(valid, (copy) => { copy.subject.files[ROSTER].bytes += 1; })],
      ['approval of the installed version, not the staged one', 'DIGEST_MISMATCH', testApprovalFor(first.staged, IRR_COMMIT)],
      ['another P04 source', 'SOURCE_MISMATCH', changed(valid, (copy) => { copy.subject.p04Source.batchId = 'BATCH-OTHER'; })],
      ['another generation', 'GENERATION_MISMATCH', changed(valid, (copy) => { copy.subject.generation.mappingVersion = 'IPD-IRR-IDENTITY-EXPORT-MAPPING-2'; })],
      ['another IRR commit', 'IRR_COMMIT_MISMATCH', changed(valid, (copy) => { copy.subject.irrCommit = OTHER_COMMIT; })],
      ['another IPD tool commit', 'IPD_TOOL_COMMIT_MISMATCH', changed(valid, (copy) => { copy.subject.ipdToolCommit = OTHER_COMMIT; })],
    ];

    const installedBefore = snapshot(dataDir);
    const stagingBefore = snapshot(second.stagingDir);
    assert.deepEqual(readIdentityDirectoryDigests(identityDirOf(dataDir)), first.staged.digests);

    for (const [index, [label, expected, content]] of rejected.entries()) {
      let approvalFile: string | undefined;
      if (content === null) approvalFile = undefined;
      else if (typeof content === 'string' && !content.startsWith('{')) approvalFile = content;
      else {
        approvalFile = join(dir, `rejected-${index}.json`);
        writeFileSync(approvalFile, typeof content === 'string' ? content : JSON.stringify(content));
      }
      for (const target of [dataDir, emptyData]) {
        const options = { stagingDir: second.stagingDir, dataDir: target, approvalFile, replace: true } as Parameters<typeof installStagedIdentity>[0];
        const outcome = refusal(() => installUnderTest(options));
        assert.equal(outcome.code === expected || outcome.codes.includes(expected), true, `${label}: got ${outcome.code} [${outcome.codes.join(', ')}]`);
        assert.ok(outcome.codes.length > 0, `${label}: the refusal is an approval refusal`);
      }
      assert.deepEqual(snapshot(dataDir), installedBefore, `${label}: the installed files, their times and their neighbours are unchanged`);
      assert.deepEqual(readdirSync(emptyData), [], `${label}: nothing was created in a fresh data directory`);
      assert.deepEqual(snapshot(second.stagingDir), stagingBefore, `${label}: no backup, no receipt and no other file was written to the staging directory`);
    }
    assert.equal(rejected.length, 33);
    assert.deepEqual(readIdentityDirectoryDigests(identityDirOf(dataDir)), first.staged.digests, 'version 1 is still installed');

    // The same request with the valid approval is what replaces version 1, with its backup.
    const outcome = installUnderTest({ stagingDir: second.stagingDir, dataDir, approvalFile: writeApprovalFile(dir, valid, 'v2.json'), replace: true });
    assert.equal(outcome.action, 'REPLACED');
    assert.deepEqual(readIdentityDirectoryDigests(identityDirOf(dataDir)), second.staged.digests);
    assert.ok(outcome.previousFilesBackup !== null);
    assert.deepEqual(readIdentityDirectoryDigests(outcome.previousFilesBackup!), first.staged.digests, 'the backup safeguard is intact');
    assert.equal(readFileSync(join(dataDir, 'investment', 'theses', 'kept.json'), 'utf8'), '{"kept":true}\n');
  });

  it('IAP-107 checkIdentityApproval is read-only and says what it compared', () => {
    const { stagingDir, staged } = staging('check');
    const dir = freshDir('approvals');
    const good = writeApprovalFile(dir, testApprovalFor(staged, IRR_COMMIT), 'good.json');
    const before = { staging: snapshot(stagingDir), approvals: snapshot(dir) };

    // It applies the governed policy and the real tool, so a record of the test authority is refused.
    const alone = checkIdentityApproval({ approvalFile: good });
    assert.deepEqual(alone.evaluation.checked, { record: true, stagedFiles: false, loaderGate: false, tool: true });
    assert.equal(alone.evaluation.authorizesInstallation, false);
    assert.ok(alone.evaluation.failures.some((failure) => failure.code === 'APPROVER_NOT_AUTHORIZED'));
    // The fixture names a commit that is no commit: whatever state the checkout is in, the tool is not that commit.
    assert.ok(alone.evaluation.failures.some((failure) => failure.code === 'IPD_TOOL_COMMIT_MISMATCH' || failure.code === 'IPD_TOOL_COMMIT_UNDETERMINED'));
    assert.equal(alone.recordSha256, createHash('sha256').update(readFileSync(good)).digest('hex'));

    const withStaging = checkIdentityApproval({ approvalFile: good, stagingDir });
    assert.deepEqual(withStaging.evaluation.checked, { record: true, stagedFiles: true, loaderGate: true, tool: true });
    assert.equal(withStaging.evaluation.authorizesInstallation, false);

    const missing = checkIdentityApproval({ approvalFile: join(dir, 'absent.json'), stagingDir });
    assert.deepEqual(missing.evaluation.failures.map((failure) => failure.code), ['APPROVAL_MISSING']);
    assert.equal(missing.recordSha256, null);

    assert.deepEqual({ staging: snapshot(stagingDir), approvals: snapshot(dir) }, before);
  });

  it('IAP-108 the tool reports the commit of its own checkout, and calls itself unmodified only when it can show that', () => {
    const git = (...args: string[]) => spawnSync('git', ['-C', ROOT, ...args], { encoding: 'utf8' });
    const head = git('rev-parse', 'HEAD');
    assert.equal(head.status, 0, 'the tests run in a git checkout');
    const status = git('status', '--porcelain', '--untracked-files=no', '--', ...IPD_TOOL_SOURCE_PATHS);
    assert.equal(status.status, 0);
    assert.deepEqual([...IPD_TOOL_SOURCE_PATHS], ['src', 'scripts', 'package.json', 'tsconfig.json']);

    const tool = readIpdToolIdentity();
    assert.equal(tool.commit, head.stdout.trim());
    assert.match(tool.commit ?? '', /^[0-9a-f]{40}$/);
    // Reading the identity changes nothing and gives the same answer again.
    assert.deepEqual(readIpdToolIdentity(), tool);
    if (status.stdout.trim().length > 0) {
      // A checkout with uncommitted changes to the tool: the commit does not describe the code.
      assert.equal(tool.unmodified, false);
      assert.match(tool.detail, /tracked files of the tool differ from the commit/);
    } else {
      // A clean checkout whose build this test run has just used: the commit describes the code.
      assert.equal(tool.unmodified, true, tool.detail);
      assert.equal(tool.detail, '');
    }
    // Under the governed entry point a record that is valid in itself but names another tool
    // commit is refused. No such record can exist for the governed approver, so this is shown on
    // the evaluation with the real tool identity and the test policy.
    const real = evaluate(baseRecord, base.staged, { tool });
    assert.deepEqual(codes(real), [tool.unmodified ? 'IPD_TOOL_COMMIT_MISMATCH' : 'IPD_TOOL_COMMIT_UNDETERMINED']);
    if (tool.unmodified) {
      const forThisCommit = testApprovalFor(base.staged, IRR_COMMIT, TEST_APPROVAL_POLICY, tool.commit!);
      assert.equal(evaluate(forThisCommit, base.staged, { tool }).authorizesInstallation, true);
    }
    // The governed entry point reads the tool identity itself; the seam takes it from the test.
    const provisioningModule = readFileSync(join(ROOT, 'src', 'identity', 'irr_identity_provisioning.ts'), 'utf8');
    assert.equal((provisioningModule.match(/installUnderPolicy\(options, IDENTITY_APPROVAL_POLICY, readIpdToolIdentity\)/g) ?? []).length, 1);
  });

  it('IAP-109 the tool identity of a checkout: unmodified only at a commit, with no changed tool file and a current build', () => {
    const repo = freshDir('tool-checkout');
    const git = (...args: string[]) => {
      const result = spawnSync('git', ['-C', repo, '-c', 'user.name=Test Fixture', '-c', 'user.email=test-fixture@example.invalid', '-c', 'commit.gpgsign=false', ...args], { encoding: 'utf8' });
      assert.equal(result.status, 0, `git ${args.join(' ')}: ${result.stderr}`);
      return result.stdout.trim();
    };
    // Not a checkout at all, and a directory that does not exist.
    assert.deepEqual(readToolIdentityAt(repo, false), { commit: null, unmodified: false, detail: 'the tool does not run from a git checkout of IPD' });
    assert.equal(readToolIdentityAt(null, false).commit, null);
    assert.equal(readToolIdentityAt(join(repo, 'absent'), false).unmodified, false);

    git('init', '--quiet');
    // A repository without a commit has no commit to bind.
    const empty = readToolIdentityAt(repo, false);
    assert.equal(empty.commit, null);
    assert.equal(empty.unmodified, false);

    mkdirSync(join(repo, 'src', 'identity'), { recursive: true });
    mkdirSync(join(repo, 'scripts'), { recursive: true });
    mkdirSync(join(repo, 'docs'), { recursive: true });
    writeFileSync(join(repo, 'src', 'identity', 'irr_identity_tool.ts'), 'export const tool = 1;\n');
    writeFileSync(join(repo, 'scripts', 'run.mjs'), '// tool\n');
    writeFileSync(join(repo, 'package.json'), '{"name":"fixture"}\n');
    writeFileSync(join(repo, 'tsconfig.json'), '{}\n');
    writeFileSync(join(repo, 'docs', 'note.md'), 'note\n');
    git('add', '-A');
    git('commit', '--quiet', '-m', 'fixture');
    const head = git('rev-parse', 'HEAD');

    const clean = readToolIdentityAt(repo, false);
    assert.deepEqual(clean, { commit: head, unmodified: true, detail: '' });

    // Files that are not the tool do not matter: an untracked file (an approval record kept beside
    // the checkout, a staging directory) and a changed document.
    writeFileSync(join(repo, 'approval-record.json'), '{}\n');
    writeFileSync(join(repo, 'src', 'untracked.ts'), 'export {};\n');
    writeFileSync(join(repo, 'docs', 'note.md'), 'note, changed\n');
    assert.deepEqual(readToolIdentityAt(repo, false), clean);

    // A changed tool file does, wherever in the tool it is; restoring it restores the identity.
    for (const path of [['src', 'identity', 'irr_identity_tool.ts'], ['scripts', 'run.mjs'], ['package.json'], ['tsconfig.json']]) {
      const file = join(repo, ...path);
      const original = readFileSync(file, 'utf8');
      writeFileSync(file, `${original}// changed\n`);
      const changedTool = readToolIdentityAt(repo, false);
      assert.equal(changedTool.commit, head, path.join('/'));
      assert.equal(changedTool.unmodified, false, path.join('/'));
      assert.match(changedTool.detail, /tracked files of the tool differ from the commit/);
      writeFileSync(file, original);
      assert.deepEqual(readToolIdentityAt(repo, false), clean, path.join('/'));
    }
    // A staged change counts too.
    writeFileSync(join(repo, 'scripts', 'run.mjs'), '// tool, staged change\n');
    git('add', 'scripts/run.mjs');
    assert.equal(readToolIdentityAt(repo, false).unmodified, false);
    git('reset', '--quiet', '--hard', head);

    // Running from a build: no build, a stale build and a current build.
    const built = join(repo, 'dist', 'src', 'identity', 'irr_identity_tool.js');
    const noBuild = readToolIdentityAt(repo, true);
    assert.deepEqual(noBuild, { commit: head, unmodified: false, detail: 'the compiled tool is older than its source; build it again' });
    mkdirSync(join(repo, 'dist', 'src', 'identity'), { recursive: true });
    writeFileSync(built, 'export const tool = 1;\n');
    const source = join(repo, 'src', 'identity', 'irr_identity_tool.ts');
    const sourceTime = statSync(source).mtime;
    utimesSync(built, new Date(sourceTime.getTime() - 60_000), new Date(sourceTime.getTime() - 60_000));
    assert.equal(readToolIdentityAt(repo, true).unmodified, false);
    utimesSync(built, new Date(sourceTime.getTime() + 60_000), new Date(sourceTime.getTime() + 60_000));
    assert.deepEqual(readToolIdentityAt(repo, true), clean);

    // A new commit is another identity: an approval for the earlier commit no longer matches.
    writeFileSync(join(repo, 'scripts', 'run.mjs'), '// tool, next version\n');
    git('add', '-A');
    git('commit', '--quiet', '-m', 'next');
    const next = readToolIdentityAt(repo, false);
    assert.notEqual(next.commit, head);
    assert.equal(next.unmodified, true);
    const forEarlier = testApprovalFor(base.staged, IRR_COMMIT, TEST_APPROVAL_POLICY, head);
    assert.equal(evaluate(forEarlier, base.staged, { tool: clean }).authorizesInstallation, true);
    assert.deepEqual(codes(evaluate(forEarlier, base.staged, { tool: next })), ['IPD_TOOL_COMMIT_MISMATCH']);
  });
});

describe('W04 identity approval — review only', () => {
  it('IAP-110 the review record states what an approval would bind, is removed when it goes stale, and is not an approval', () => {
    const { stagingDir, staged } = staging('review');
    const { review, path } = writeReviewRecord(stagingDir);
    assert.equal(path, join(stagingDir, STAGED_REVIEW_FILE));
    assert.equal(review.schemaVersion, IDENTITY_REVIEW_SCHEMA);
    assert.equal(review.installed, false);
    assert.deepEqual(review.subject.files, staged.digests);
    assert.equal(review.subject.irrCommit, IRR_COMMIT);
    assert.deepEqual(review.loaderGate, { recorded: true, accepted: true });
    assert.equal(review.toBeAcceptedExplicitly.exportLimitationCodes.length, 8);
    assert.deepEqual(review.toBeAcceptedExplicitly.additionalLimitationCodes, additionalLimitationCodesFor(IDENTITY_APPROVAL_POLICY, staged.report));
    assert.deepEqual(review.approvalPolicy.approver, { authorityId: 'PROGRAM_AUTHORITY_RAMKI', name: 'Ramki' });
    assert.equal(review.approvalPolicy.policyVersion, IDENTITY_APPROVAL_POLICY.policyVersion);
    assert.match(review.approvalPolicy.validity, /until reviewDateUtc/);
    assert.equal(review.approvalPolicy.determinations.cv22OptionC.determination, 'DOES_NOT_APPLY');
    assert.equal(review.approvalPolicy.determinations.iidRosterContentDefault.determination, 'APPLIES_AS_DESIGN_DEFAULT_NOT_AS_LIMIT');
    assert.deepEqual(review.scope, IDENTITY_APPROVAL_POLICY.scope);
    // The tool commit is stated only when the tool can show it runs unmodified from that commit.
    const tool = readIpdToolIdentity();
    assert.deepEqual(review.tool, tool);
    assert.equal(review.subject.ipdToolCommit, tool.unmodified ? tool.commit : null);
    assert.equal(review.readyForApproval, tool.unmodified);
    // The three blocks an approval record repeats have the record's own shape.
    assert.deepEqual(Object.keys(review.subject), Object.keys(baseRecord.subject));
    assert.deepEqual(Object.keys(review.subject.p04Source), Object.keys(baseRecord.subject.p04Source));
    assert.deepEqual(Object.keys(review.subject.generation), Object.keys(baseRecord.subject.generation));
    assert.deepEqual(Object.keys(review.scope), Object.keys(baseRecord.scope));
    assert.deepEqual(Object.keys(review.toBeAcceptedExplicitly), Object.keys(baseRecord.accepted));
    for (const key of ['approver', 'approvals', 'status', 'approvalId', 'approvedAtUtc', 'reviewDateUtc', 'decision', 'accepted']) {
      assert.equal(Object.prototype.hasOwnProperty.call(review, key), false, `the review record has no ${key}`);
    }
    // Pure construction: an unmodified tool and an accepted gate make the review ready; either one missing does not.
    assert.equal(buildReviewRecord(staged, { accepted: true, irrCommit: IRR_COMMIT }, TEST_TOOL).readyForApproval, true);
    assert.equal(buildReviewRecord(staged, { accepted: true, irrCommit: IRR_COMMIT }, TEST_TOOL).subject.ipdToolCommit, TEST_TOOL_COMMIT);
    assert.equal(buildReviewRecord(staged, null, TEST_TOOL).readyForApproval, false);
    assert.equal(buildReviewRecord(staged, { accepted: false, irrCommit: IRR_COMMIT }, TEST_TOOL).subject.irrCommit, null);
    const modified = buildReviewRecord(staged, { accepted: true, irrCommit: IRR_COMMIT }, { commit: TEST_TOOL_COMMIT, unmodified: false, detail: 'modified' });
    assert.equal(modified.subject.ipdToolCommit, null);
    assert.equal(modified.readyForApproval, false);
    // Deterministic: the same staged export gives the same review record.
    const bytes = readFileSync(path, 'utf8');
    assert.equal(readFileSync(writeReviewRecord(stagingDir).path, 'utf8'), bytes);
    // It is refused as an approval under either policy.
    for (const policy of [IDENTITY_APPROVAL_POLICY, TEST_APPROVAL_POLICY]) {
      assert.deepEqual(codes(evaluate(JSON.parse(bytes), staged, { policy })), ['APPROVAL_SCHEMA_UNKNOWN']);
    }

    // Without a gate the IRR commit is not available, and the record says so.
    const ungated = staging('review-ungated', 0, 5, { gate: false });
    const early = writeReviewRecord(ungated.stagingDir).review;
    assert.equal(early.subject.irrCommit, null);
    assert.deepEqual(early.loaderGate, { recorded: false, accepted: null });
    // A new gate or a new generation removes the review record of the earlier state.
    recordGate(ungated.staged, loaderAnswerFor(ungated.staged), { irrCommit: IRR_COMMIT, irrWorktreeClean: true, asOf: '2026-11-13' });
    assert.equal(existsSync(join(ungated.stagingDir, STAGED_REVIEW_FILE)), false);
    writeReviewRecord(ungated.stagingDir);
    stageExport(ungated.stagingDir, exportOfSlice(5, 10));
    assert.equal(existsSync(join(ungated.stagingDir, STAGED_REVIEW_FILE)), false);
  });
});

/* ============================================================================================ */

describe('W04 identity approval — command line', () => {
  const run = (...args: string[]) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
  const hasApprovalSchema = (dir: string): string[] =>
    Object.keys(snapshot(dir)).filter((name) => !name.endsWith('/') && readFileSync(join(dir, name), 'utf8').includes(IDENTITY_APPROVAL_SCHEMA));

  it('IAP-120 review generates the proposed files and reports their digests without installing', () => {
    const stagingDir = freshDir('cli-review');
    const dataDir = freshDir('cli-review-data');

    // The withheld records have to be acknowledged, as for generate. Nothing is written until then.
    const first = run('review', '--staging', stagingDir);
    assert.equal(first.status, 3, first.stderr);
    assert.match(first.stdout, /^REVIEW ONLY: this command installs nothing and creates no approval\.$/m);
    assert.match(first.stdout, /^REVIEW RESULT: NOT COMPLETE/m);
    assert.equal(existsSync(join(stagingDir, 'identity')), false);
    assert.equal(existsSync(join(stagingDir, STAGED_REVIEW_FILE)), false);

    const second = run('review', '--staging', stagingDir, '--accept-withheld', '2');
    assert.equal(second.status, 0, second.stderr);
    // No IRR checkout was given, so the IRR commit is not available and the review says an approval cannot be written yet.
    assert.match(second.stdout, /^REVIEW RESULT: COMPLETE, NOT YET READY FOR APPROVAL - the proposed files are staged and were NOT installed\./m);
    const staged = readStagedExport(stagingDir);
    for (const name of FILES) {
      assert.ok(second.stdout.includes(`${name}: sha256 ${staged.digests[name].sha256}, ${staged.digests[name].bytes} bytes`), `the digest of ${name} is reported`);
    }
    assert.match(second.stdout, /^mapping version: IPD-IRR-IDENTITY-EXPORT-MAPPING-1$/m);
    assert.match(second.stdout, /^P04 source batch: BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001$/m);
    assert.match(second.stdout, /^P04 source operating mode: OFFLINE_BOOTSTRAP$/m);
    assert.match(second.stdout, /^P04 source records: 2390$/m);
    assert.match(second.stdout, /^P04 source checksum sha256: [0-9a-f]{64}$/m);
    assert.match(second.stdout, /^exported: issuers 2388, securities 2388, NSE listings 2388, corporate actions 0; withheld 2$/m);
    assert.match(second.stdout, /^IRR commit of the accepted loader gate: not available/m);
    assert.equal((second.stdout.match(/^export limitation: /gm) ?? []).length, 8);
    // Two fixed ones, the roster beyond the IID default of 200, and the holdings coverage that was not counted.
    assert.deepEqual((second.stdout.match(/^additional limitation: .*$/gm) ?? []), [
      'additional limitation: NON_EQ_SERIES_HOLDINGS_UNRESOLVED',
      'additional limitation: NSE_SOURCE_FILE_WITHOUT_RETRIEVAL_RECEIPT',
      'additional limitation: ROSTER_LARGER_THAN_IID_DESIGN_DEFAULT',
      'additional limitation: HOLDINGS_COVERAGE_NOT_MEASURED',
    ]);
    assert.match(second.stdout, /^withheld record: IN9175A01010: /m);
    assert.match(second.stdout, /^withheld record: INE175A01038: /m);
    assert.match(second.stdout, /^approver: Ramki \(PROGRAM_AUTHORITY_RAMKI\); one approval, no second approver$/m);
    assert.doesNotMatch(second.stdout, /PROGRAM_AUTHORITY_SAI|unresolved governance question|required authorities/);
    assert.match(second.stdout, /^IPD commit of this provisioning tool: ([0-9a-f]{40}|not available \(.+\))$/m);
    assert.match(second.stdout, /^productionUse: false$/m);
    assert.match(second.stdout, /^commercialUse: false$/m);
    assert.match(second.stdout, /^ {2}result: DOES_NOT_APPLY$/m);
    assert.match(second.stdout, /^ {2}result: APPLIES_AS_DESIGN_DEFAULT_NOT_AS_LIMIT$/m);

    const review = JSON.parse(readFileSync(join(stagingDir, STAGED_REVIEW_FILE), 'utf8')) as LooseApproval;
    assert.equal(review.schemaVersion, IDENTITY_REVIEW_SCHEMA);
    assert.deepEqual(review.subject.files, staged.digests);
    assert.equal(review.subject.generation.issuersExported, 2388);
    assert.equal(review.subject.p04Source.recordCount, 2390);
    assert.equal(review.readyForApproval, false);
    assert.deepEqual(review.toBeAcceptedExplicitly.withheldRecords, [
      { isin: 'IN9175A01010', reasons: ['ISSUER_SHARED_ACROSS_ISINS'] },
      { isin: 'INE175A01038', reasons: ['ISSUER_SHARED_ACROSS_ISINS'] },
    ]);

    // Nothing was installed, no receipt exists, and the staging directory holds exactly the review artefacts.
    assert.deepEqual(readdirSync(stagingDir).sort(), ['identity', 'provisioning-report.json', STAGED_REVIEW_FILE].sort());
    assert.deepEqual(readdirSync(dataDir), []);
    assert.deepEqual(hasApprovalSchema(stagingDir), [], 'review wrote no document of the approval schema');

    // Repeatable: the same bytes and the same review record.
    const digestsBefore = snapshot(join(stagingDir, 'identity'));
    const reviewBefore = readFileSync(join(stagingDir, STAGED_REVIEW_FILE), 'utf8');
    assert.equal(run('review', '--staging', stagingDir, '--accept-withheld', '2').status, 0);
    assert.deepEqual(Object.values(snapshot(join(stagingDir, 'identity'))).map((entry) => entry.split(':').slice(0, 2).join(':')), Object.values(digestsBefore).map((entry) => entry.split(':').slice(0, 2).join(':')));
    assert.equal(readFileSync(join(stagingDir, STAGED_REVIEW_FILE), 'utf8'), reviewBefore);

    // The review record is refused as an approval, and so the reviewed files cannot be installed with it.
    const asApproval = run('install', '--staging', stagingDir, '--data-dir', dataDir, '--approval', join(stagingDir, STAGED_REVIEW_FILE));
    assert.equal(asApproval.status, 7);
    assert.match(asApproval.stdout, /^RESULT: FAIL \(APPROVAL_SCHEMA_UNKNOWN\)/m);
    assert.deepEqual(readdirSync(dataDir), []);

    // review has no option that names a data directory or an approval.
    assert.equal(run('review', '--staging', stagingDir, '--data-dir', dataDir).status, 64);
    assert.equal(run('review', '--staging', stagingDir, '--approval', TEMPLATE).status, 64);
  });

  it('IAP-121 review with an IRR checkout that cannot run the gate is not complete, and still installs nothing', () => {
    const stagingDir = freshDir('cli-review-gate');
    const result = run('review', '--staging', stagingDir, '--accept-withheld', '2', '--irr-root', join(stagingDir, 'no-irr-here'), '--as-of', '2026-11-13');
    assert.equal(result.status, 4, result.stderr);
    assert.match(result.stdout, /IRR_RUNNER_NOT_FOUND/);
    assert.match(result.stdout, /^REVIEW RESULT: NOT COMPLETE - the proposed files are staged, but the IRR loader gate did not accept them\. Nothing was installed\.$/m);
    const review = JSON.parse(readFileSync(join(stagingDir, STAGED_REVIEW_FILE), 'utf8')) as LooseApproval;
    assert.deepEqual(review.loaderGate, { recorded: true, accepted: false });
    assert.equal(review.subject.irrCommit, null);
  });

  it('IAP-122 install on the command line refuses every record the approver did not make, and writes nothing', () => {
    const { stagingDir, staged } = staging('cli-install');
    const dataDir = freshDir('cli-install-data');
    const dir = freshDir('cli-approvals');
    const stagingBefore = snapshot(stagingDir);
    const relabelled = changed(testApprovalFor(staged, IRR_COMMIT), (copy) => {
      copy.policyVersion = IDENTITY_APPROVAL_POLICY.policyVersion;
      copy.decision = { ...IDENTITY_APPROVAL_POLICY.decision };
    });

    const attempts: Array<[string[], string]> = [
      [[], 'APPROVAL_MISSING'],
      [['--approval', join(dir, 'absent.json')], 'APPROVAL_MISSING'],
      [['--approval', TEMPLATE], 'APPROVAL_MALFORMED'],
      [['--approval', join(stagingDir, 'provisioning-report.json')], 'APPROVAL_SCHEMA_UNKNOWN'],
      [['--approval', writeApprovalFile(dir, { ...testApprovalFor(staged, IRR_COMMIT), schemaVersion: 'IPD_IRR_IDENTITY_APPROVAL_V1' }, 'earlier-schema.json')], 'APPROVAL_SCHEMA_UNKNOWN'],
      // A complete record for exactly these files, made by an approver the governed policy does not know.
      [['--approval', writeApprovalFile(dir, testApprovalFor(staged, IRR_COMMIT), 'fictitious.json')], 'POLICY_VERSION_MISMATCH'],
      // The same record relabelled with the governed policy version and decision: its approver is still nobody.
      [['--approval', writeApprovalFile(dir, relabelled, 'relabelled.json')], 'APPROVER_NOT_AUTHORIZED'],
      // The same again with its review date passed: the date alone refuses it too.
      [['--approval', writeApprovalFile(dir, changed(relabelled, (copy) => { copy.reviewDateUtc = utc(-1); }), 'relabelled-expired.json')], 'APPROVAL_EXPIRED'],
      [['--approval', writeApprovalFile(dir, changed(relabelled, (copy) => { copy.status = 'REVOKED'; }), 'relabelled-revoked.json')], 'APPROVAL_REVOKED'],
    ];
    for (const [extra, expected] of attempts) {
      for (const replace of [[], ['--replace']]) {
        const result = run('install', '--staging', stagingDir, '--data-dir', dataDir, ...extra, ...replace);
        assert.equal(result.status, 7, `${expected}: ${result.stdout}${result.stderr}`);
        assert.match(result.stdout, new RegExp(`^RESULT: FAIL \\(${expected}\\) the approval record does not authorize this installation\\. Nothing was installed or changed\\.$`, 'm'));
        assert.match(result.stdout, new RegExp(`^APPROVAL REFUSED, ${expected}: `, 'm'));
      }
    }
    assert.deepEqual(readdirSync(dataDir), []);
    assert.deepEqual(snapshot(stagingDir), stagingBefore, 'no receipt and no other file was written');

    // One approver is asked for, by name, and no second one.
    const refused = run('install', '--staging', stagingDir, '--data-dir', dataDir, '--approval', join(dir, 'relabelled.json'));
    assert.match(refused.stdout, /^APPROVAL REFUSED, APPROVER_NOT_AUTHORIZED: the record is not made by the approver of this policy \(PROGRAM_AUTHORITY_RAMKI\)$/m);
    assert.equal((refused.stdout.match(/^APPROVAL REFUSED, /gm) ?? []).length, 1);
    assert.doesNotMatch(refused.stdout, /SAI|REQUIRED_AUTHORITY_MISSING/);
  });

  it('IAP-123 check-approval is read-only, and does not call a partial check a pass', () => {
    const { stagingDir, staged } = staging('cli-check');
    const dir = freshDir('cli-check-approvals');
    const fictitious = writeApprovalFile(dir, testApprovalFor(staged, IRR_COMMIT), 'fictitious.json');
    const before = { staging: snapshot(stagingDir), approvals: snapshot(dir) };

    const missing = run('check-approval');
    assert.equal(missing.status, 7);
    assert.match(missing.stdout, /^RESULT: FAIL \(APPROVAL_MISSING\)/m);

    const template = run('check-approval', '--approval', TEMPLATE);
    assert.equal(template.status, 7);
    assert.match(template.stdout, /^RESULT: FAIL \(APPROVAL_MALFORMED\) the approval record does not authorize an installation\. Nothing was changed\.$/m);
    assert.match(template.stdout, /^compared with the running tool: yes; compared with the staged files: no; compared with the IRR commit of an accepted loader gate: no$/m);

    const withStaging = run('check-approval', '--approval', fictitious, '--staging', stagingDir);
    assert.equal(withStaging.status, 7);
    assert.match(withStaging.stdout, /^compared with the running tool: yes; compared with the staged files: yes; compared with the IRR commit of an accepted loader gate: yes$/m);
    assert.match(withStaging.stdout, /^approver named in the record: TEST_AUTHORITY_NOT_A_PERSON$/m);
    assert.match(withStaging.stdout, /^approval: TEST-FIXTURE-NOT-AN-APPROVAL-\d{4}; status APPROVED; approved \S+; review date \S+$/m);
    assert.match(withStaging.stdout, /^APPROVAL REFUSED, IPD_TOOL_COMMIT_(MISMATCH|UNDETERMINED): /m);
    assert.match(withStaging.stdout, /^APPROVAL REFUSED, APPROVER_NOT_AUTHORIZED: /m);
    assert.doesNotMatch(withStaging.stdout, /RESULT: PASS/);

    const noStaging = run('check-approval', '--approval', fictitious, '--staging', join(dir, 'no-staging-here'));
    assert.equal(noStaging.status, 5);
    assert.match(noStaging.stdout, /^RESULT: FAIL \(STAGING_REPORT_ABSENT\)/m);

    assert.equal(run('check-approval', '--approval', fictitious, '--data-dir', dir).status, 64, 'check-approval takes no data directory');
    assert.deepEqual({ staging: snapshot(stagingDir), approvals: snapshot(dir) }, before);
  });

  it('IAP-124 no command creates, completes or infers an approval', () => {
    const stagingDir = freshDir('cli-none');
    const dataDir = freshDir('cli-none-data');
    const elsewhere = freshDir('cli-none-elsewhere');
    assert.equal(run('generate', '--staging', stagingDir, '--accept-withheld', '2').status, 0);
    assert.equal(run('review', '--staging', stagingDir, '--accept-withheld', '2').status, 0);
    assert.equal(run('validate', '--staging', stagingDir, '--irr-root', elsewhere, '--as-of', '2026-11-13').status, 4);
    assert.equal(run('check-approval', '--approval', join(elsewhere, 'approval.json'), '--staging', stagingDir).status, 7);
    assert.equal(run('install', '--staging', stagingDir, '--data-dir', dataDir, '--approval', join(elsewhere, 'approval.json')).status, 7);
    assert.equal(run('install', '--staging', stagingDir, '--data-dir', dataDir).status, 7);
    for (const dir of [stagingDir, dataDir, elsewhere]) assert.deepEqual(hasApprovalSchema(dir), [], 'no document of the approval schema was written');
    assert.equal(existsSync(join(elsewhere, 'approval.json')), false);
    assert.deepEqual(readdirSync(dataDir), []);

    // There is no command or option for it.
    for (const command of ['approve', 'create-approval', 'sign', 'init-approval']) assert.equal(run(command, '--staging', stagingDir).status, 64);
    for (const option of ['--approve', '--auto-approve', '--force', '--skip-approval', '--no-approval', '--policy', '--now', '--tool-commit', '--ignore-tool-commit', '--no-review-date']) {
      assert.equal(run('install', '--staging', stagingDir, '--data-dir', dataDir, option).status, 64, option);
    }

    // The scripts reach installation through the governed entry point only, and the sources write
    // no file of the approval schema: the schema constant is used by the checker alone.
    const scripts = readdirSync(join(ROOT, 'scripts')).filter((name) => /\.(mjs|mts|ps1|js|ts)$/.test(name));
    for (const name of scripts) {
      const text = readFileSync(join(ROOT, 'scripts', name), 'utf8');
      assert.ok(!text.includes('installStagedIdentityUnderPolicy'), `${name} does not use the test seam`);
      assert.ok(!text.includes('IDENTITY_APPROVAL_SCHEMA') && !text.includes(IDENTITY_APPROVAL_SCHEMA), `${name} does not handle the approval schema itself`);
      assert.ok(!text.includes('irr_identity_approval_fixture'), `${name} does not use the test fixture`);
    }
    const approvalModule = readFileSync(join(ROOT, 'src', 'identity', 'irr_identity_approval.ts'), 'utf8');
    assert.ok(!/from 'node:fs'|from 'node:child_process'|writeFileSync|mkdirSync/.test(approvalModule), 'the approval module has no file access and starts no process');
    const provisioningModule = readFileSync(join(ROOT, 'src', 'identity', 'irr_identity_provisioning.ts'), 'utf8');
    assert.ok(!provisioningModule.includes('IDENTITY_APPROVAL_SCHEMA'), 'the provisioning module never writes the approval schema');
    assert.equal((provisioningModule.match(/installUnderPolicy\(options, IDENTITY_APPROVAL_POLICY, readIpdToolIdentity\)/g) ?? []).length, 1);
    // The tool reads its own identity with two read-only git queries and nothing else.
    assert.deepEqual([...provisioningModule.matchAll(/gitOutput\(root, \[([^\]]*)\]/g)].map((match) => match[1]!.split(',')[0]!.trim()), ["'rev-parse'", "'status'"]);
  });
});

describe('W04 identity approval — the Windows wrapper (read as text; not executed)', () => {
  const wrapper = readFileSync(WRAPPER, 'utf8');
  const lines = wrapper.split('\n');
  const lineOf = (needle: string | RegExp): number => lines.findIndex((line) => (typeof needle === 'string' ? line.includes(needle) : needle.test(line)));

  it('IAP-130 the wrapper cannot reach install without an approval record, and review-only never reaches it', () => {
    assert.match(wrapper, /\[string\] \$ApprovalRecordPath = ''/);
    assert.match(wrapper, /\[switch\] \$ReviewOnly/);

    // Exactly one place passes `install` to the tool, and it passes the approval record with it.
    const installLines = lines.filter((line) => /@\('install'/.test(line));
    assert.equal(installLines.length, 1);
    assert.match(installLines[0]!, /'--approval', \$ApprovalRecordPath/);

    // The refusal for want of an approval comes before the first tool call and before any step.
    const guard = lineOf("if ((-not $ReviewOnly) -and ($ApprovalRecordPath.Length -eq 0))");
    const firstToolCall = lineOf(/Invoke-Tool -ToolArguments/);
    const firstStep = lineOf(/^Write-Step 'Step/);
    assert.ok(guard > 0 && guard < firstToolCall && guard < firstStep, 'the approval guard precedes every step');
    assert.match(lines[guard]!, /Stop-NotRun/);

    // The record is checked by the tool before anything is generated; the comparison with the
    // generated files and the gated IRR commit is the tool's own, inside `install`.
    const preCheck = lineOf("@('check-approval', '--approval', $ApprovalRecordPath)");
    const generate = lineOf("$generateArguments = @('generate'");
    const validate = lineOf("@('validate', '--staging'");
    const install = lineOf("@('install'");
    assert.ok(preCheck > guard && preCheck < generate && generate < validate && validate < install);
    // A refused approval is a FAIL of the wrapper, and a missing one is NOT RUN; neither is a PASS.
    const afterInstall = lines.slice(install, install + 8).join('\n');
    assert.match(afterInstall, /if \(\$installExit -eq 7\) \{[\s\S]*?exit 1/);
    assert.match(lines.slice(preCheck, preCheck + 6).join('\n'), /if \(\$approvalExit -ne 0\) \{[\s\S]*?exit 1/);

    // Review-only ends the script before the installing part begins.
    const reviewBlockStart = lineOf(/^if \(\$ReviewOnly\) \{$/);
    assert.ok(reviewBlockStart > guard && reviewBlockStart < preCheck);
    const reviewCall = lineOf("$reviewArguments = @('review'");
    const reviewExit = lines.findIndex((line, index) => index > reviewCall && /^\s+exit 0$/.test(line));
    assert.ok(reviewCall > reviewBlockStart && reviewExit > reviewCall && reviewExit < preCheck, 'review-only exits before the approval and install steps');
    const reviewBlock = lines.slice(reviewBlockStart, reviewExit + 1).join('\n');
    assert.ok(!/'install'|'--data-dir'|'--approval'/.test(reviewBlock), 'the review-only block passes no install, data directory or approval argument');
    // Every path out of the review-only block is an exit.
    assert.ok(/^\}$/.test(lines[reviewExit + 1]!), 'the review-only block ends with its exit');

    // The wrapper writes no file and contains no approval content of its own.
    assert.ok(!/Set-Content|Out-File|Add-Content|New-Item|WriteAllText|ConvertTo-Json/.test(wrapper));
    assert.ok(!wrapper.includes(IDENTITY_APPROVAL_SCHEMA));
    assert.ok(!wrapper.includes(IDENTITY_APPROVAL_POLICY.approver.authorityId));
    // One approver: the wrapper asks for one record and names no second approver or co-approval.
    assert.ok(!/\bSai\b|both authorities|required authorities|co-approv|second approver is/i.test(wrapper));
  });

  it('IAP-131 the wrapper keeps the repository PowerShell conventions the validator checks mechanically', () => {
    // Code only: the help block, comment lines and the text of single-quoted strings are set aside.
    const code = wrapper
      .replace(/<#[\s\S]*?#>/, '')
      .split('\n')
      .filter((line) => !/^\s*#/.test(line))
      .join('\n')
      .replace(/'[^'\n]*'/g, "''");
    assert.ok(!/\belse\b|\belseif\b|\bfinally\b/.test(code), 'no else / elseif / finally');
    assert.ok(!wrapper.includes('\t'), 'no tab characters');
    assert.ok(!wrapper.includes('\r'), 'LF line endings');
    assert.match(wrapper, /^#Requires -Version 5\.1/);
    assert.match(wrapper, /Set-StrictMode -Version Latest/);
    assert.match(wrapper, /\$ErrorActionPreference = 'Stop'/);
    const exits = [...code.matchAll(/\bexit\s+(\S+)/g)].map((match) => match[1]);
    assert.ok(exits.length > 10 && exits.every((value) => /^[0-3]$/.test(value ?? '')), 'every exit code is an explicit integer from 0 to 3');
  });
});
