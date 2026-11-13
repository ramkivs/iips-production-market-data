/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: W04 — governance approval of an identity-source installation (IAP-*)
 *
 * Covers `src/identity/irr_identity_approval.ts`, the approval enforcement of
 * `src/identity/irr_identity_provisioning.ts`, the commands `review`, `check-approval` and
 * `install` of `scripts/provision-irr-identity-sources.mjs`, the blank template, and the text of
 * the Windows wrapper.
 *
 * NO APPROVAL EXISTS. Decision D1 is not approved. No test holds, builds or writes an approval in
 * the name of a real authority. Acceptance is shown under a test policy whose authorities do not
 * exist (`tests/support/irr_identity_approval_fixture.ts`); the governed entry point and the
 * command line are shown refusing those records. One consequence is stated here plainly: the
 * success output of `install` on the command line is exercised by no test.
 *
 * WHAT THIS SUITE DOES NOT SHOW. The Windows wrapper is read as text, not executed: no PowerShell
 * runtime is available. The IRR loader is not available either; the gate answer is built as in
 * `tests/irr_identity_provisioning.test.ts`.
 */
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
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
  buildReviewRecord,
  evaluateIdentityApproval,
  parseApprovalTimestamp,
  requiredAuthorityIds,
  type ApprovalEvaluation,
  type IdentityApprovalPolicy,
} from '../src/identity/irr_identity_approval.js';
import {
  APPROVAL_RECORD_MAX_BYTES,
  ApprovalRefusedError,
  LOADER_GATE_SCHEMA,
  ProvisioningError,
  STAGED_INSTALL_RECEIPT_FILE,
  STAGED_REVIEW_FILE,
  checkIdentityApproval,
  identityDirOf,
  installStagedIdentity,
  installStagedIdentityUnderPolicy,
  readIdentityDirectoryDigests,
  readStagedExport,
  recordGate,
  recordInstallation,
  stageExport,
  writeReviewRecord,
  type StagedExport,
} from '../src/identity/irr_identity_provisioning.js';
import {
  TEST_APPROVAL_POLICY,
  TEST_AUTHORITY_ONE,
  TEST_AUTHORITY_TWO,
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

function evaluate(record: unknown, staged: StagedExport | null, overrides: { policy?: IdentityApprovalPolicy; now?: Date; gateCommit?: string | null | undefined } = {}): ApprovalEvaluation {
  return evaluateIdentityApproval({
    record,
    now: overrides.now ?? new Date(),
    policy: overrides.policy ?? TEST_APPROVAL_POLICY,
    staged,
    gate: staged === null || overrides.gateCommit === undefined ? (staged === null ? null : { irrCommit: IRR_COMMIT }) : { irrCommit: overrides.gateCommit },
  });
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
    assert.deepEqual(result.checked, { record: true, stagedFiles: true, loaderGate: true });
    assert.equal(result.authorizesInstallation, true);
    assert.equal(result.approval?.approvalId, baseRecord.approvalId);
    for (const name of FILES) assert.equal(result.approval?.subject.files[name].sha256, base.staged.digests[name].sha256);
  });

  it('IAP-02 a record that was not compared with the staged files and the gate authorizes nothing', () => {
    const alone = evaluateIdentityApproval({ record: baseRecord, now: new Date(), policy: TEST_APPROVAL_POLICY, staged: null, gate: null });
    assert.deepEqual(alone.failures, []);
    assert.equal(alone.authorizesInstallation, false);
    const ungated = evaluateIdentityApproval({ record: baseRecord, now: new Date(), policy: TEST_APPROVAL_POLICY, staged: base.staged, gate: null });
    assert.deepEqual(ungated.failures, []);
    assert.equal(ungated.authorizesInstallation, false);
  });

  it('IAP-03 the record binds the generation, not only the digests', () => {
    const subject = baseRecord.subject.generation;
    const report = base.staged.report;
    assert.equal(subject.mappingVersion, report.mappingVersion);
    assert.equal(subject.masterBatchId, report.inputs.p04SecurityMaster.batchId);
    assert.equal(subject.masterChecksumSha256, report.inputs.p04SecurityMaster.observedChecksumSha256);
    assert.equal(subject.masterRecordCount, 5);
    assert.equal(subject.securitiesExported, 5);
    assert.equal(subject.requiredIsins, null);
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
      ['no approvals', (copy) => delete copy.approvals],
      ['no expiry', (copy) => delete copy.expiresAtUtc],
      ['no revocation field', (copy) => delete copy.revocation],
      ['no scope', (copy) => delete copy.scope],
      ['no accepted', (copy) => delete copy.accepted],
      ['no determinations', (copy) => delete copy.determinations],
      ['unknown top-level field', (copy) => { copy.amendments = 'the roster may also be used elsewhere'; }],
      ['unknown scope field', (copy) => { copy.scope.alsoPermitted = 'production'; }],
      ['unknown subject field', (copy) => { copy.subject.anyOtherFiles = true; }],
      ['missing file', (copy) => delete copy.subject.files[LISTING_MAP]],
      ['extra file', (copy) => { copy.subject.files['other.json'] = { sha256: 'a'.repeat(64), bytes: 1 }; }],
      ['missing generation field', (copy) => delete copy.subject.generation.masterChecksumSha256],
      ['unknown approver field', (copy) => { copy.approvals[0].onBehalfOf = 'someone'; }],
      ['unknown determination', (copy) => { copy.determinations.waivedEverything = true; }],
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
      ['count negative', (copy) => { copy.subject.generation.recordsWithheld = -1; }],
      ['count fractional', (copy) => { copy.subject.generation.securitiesExported = 4.5; }],
      ['scope flag as text', (copy) => { copy.scope.productionUse = 'false'; }],
      ['scope empty', (copy) => { copy.scope.environment = ''; }],
      ['limitations not a list', (copy) => { copy.accepted.exportLimitationCodes = 'all'; }],
      ['limitation empty', (copy) => { copy.accepted.exportLimitationCodes[0] = ''; }],
      ['act reference empty', (copy) => { copy.governance.approvalActRef = ''; }],
      ['act reference blank', (copy) => { copy.governance.approvalActRef = '   '; }],
      ['act reference placeholder', (copy) => { copy.governance.approvalActRef = '<pull request>'; }],
      ['statement missing', (copy) => { copy.approvals[0].statement = null; }],
      ['approvals empty', (copy) => { copy.approvals = []; }],
      ['approvals not a list', (copy) => { copy.approvals = { [TEST_AUTHORITY_ONE.authorityId]: true }; }],
      ['time without zone', (copy) => { copy.approvedAtUtc = '2026-11-13T10:00:00'; }],
      ['time with offset', (copy) => { copy.expiresAtUtc = '2027-01-01T00:00:00+05:30'; }],
      ['date only', (copy) => { copy.expiresAtUtc = '2027-01-01'; }],
      ['impossible date', (copy) => { copy.expiresAtUtc = '2027-02-30T00:00:00Z'; }],
      ['revocation of the wrong shape', (copy) => { copy.revocation = true; }],
      ['qualification reference missing', (copy) => { copy.qualifications[0].ref = ''; }],
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
  it('IAP-20 refuses an approver that is not a recognised authority', () => {
    const cases: Array<[string, (copy: LooseApproval) => void]> = [
      ['an unknown authority instead of a required one', (copy) => { copy.approvals[1] = { ...copy.approvals[1], authorityId: 'INVESTIGATING_AGENT', name: 'Agent', designation: 'Investigator' }; }],
      ['an unknown authority in addition', (copy) => { copy.approvals.push({ ...copy.approvals[0], authorityId: 'OPERATOR_FRIEND', name: 'Friend', designation: 'None' }); }],
      ['the right identifier under another name', (copy) => { copy.approvals[0].name = 'Somebody Else'; }],
      ['the right identifier with another designation', (copy) => { copy.approvals[0].designation = 'Gate Acceptor'; }],
      ['one authority named twice', (copy) => { copy.approvals[1] = { ...copy.approvals[0] }; }],
    ];
    for (const [label, change] of cases) {
      const result = evaluate(changed(baseRecord, change), base.staged);
      assert.ok(codes(result).includes('APPROVER_NOT_AUTHORIZED'), label);
      assert.equal(result.authorizesInstallation, false, label);
    }
  });

  it('IAP-21 refuses a record that lacks the approval of a required authority', () => {
    for (const keep of [0, 1]) {
      const result = evaluate(changed(baseRecord, (copy) => { copy.approvals = [copy.approvals[keep]]; }), base.staged);
      assert.deepEqual(codes(result), ['REQUIRED_AUTHORITY_MISSING']);
      assert.equal(result.failures.length, 1);
      assert.match(result.failures[0]!.detail, keep === 0 ? /TEST_AUTHORITY_TWO/ : /TEST_AUTHORITY_ONE/);
      assert.match(result.failures[0]!.detail, /unresolved/);
    }
    // An approver who is named but did not approve has not approved.
    const rejected = evaluate(changed(baseRecord, (copy) => { copy.approvals[1].decision = 'REJECTED'; }), base.staged);
    assert.deepEqual(codes(rejected), ['APPROVER_DID_NOT_APPROVE']);
    const withAmendments = evaluate(changed(baseRecord, (copy) => { copy.approvals[0].decision = 'APPROVED WITH AMENDMENTS'; }), base.staged);
    assert.deepEqual(codes(withAmendments), ['APPROVER_DID_NOT_APPROVE']);
  });

  it('IAP-22 the governed policy leaves the authority question unresolved and therefore requires every authority the records name', () => {
    assert.equal(IDENTITY_APPROVAL_POLICY.requiredAuthorities.status, 'UNRESOLVED');
    assert.deepEqual(requiredAuthorityIds(IDENTITY_APPROVAL_POLICY), ['PROGRAM_AUTHORITY_RAMKI', 'PROGRAM_AUTHORITY_SAI']);
    assert.deepEqual(IDENTITY_APPROVAL_POLICY.revokedApprovalIds, []);
    assert.equal(IDENTITY_APPROVAL_POLICY.governance.decisionId, 'IIPS-W04-D1');
    assert.ok(existsSync(join(ROOT, IDENTITY_APPROVAL_POLICY.governance.decisionRecord)), 'the decision record the policy cites is tracked');
    assert.deepEqual(IDENTITY_APPROVAL_POLICY.scope, {
      environment: 'LOCAL_SINGLE_USER_IIPS',
      consumer: 'IRR_INVESTMENT_IDENTITY_SOURCES',
      rosterDataClass: 'OPERATOR_SUPPLIED',
      productWideAuthoritativeUse: false,
      productionUse: false,
    });
    assert.equal(IDENTITY_APPROVAL_POLICY.cv22OptionC.prerequisiteIds.length, 5);

    // A record made by the fictitious test authorities is nothing under the governed policy.
    const governed = evaluate(baseRecord, base.staged, { policy: IDENTITY_APPROVAL_POLICY });
    assert.ok(codes(governed).includes('APPROVER_NOT_AUTHORIZED'));
    assert.ok(codes(governed).includes('REQUIRED_AUTHORITY_MISSING'));
    assert.ok(codes(governed).includes('GOVERNANCE_REFERENCE_MISMATCH'));
    assert.equal(governed.failures.filter((failure) => failure.code === 'REQUIRED_AUTHORITY_MISSING').length, 2);
    assert.equal(governed.authorizesInstallation, false);
  });

  it('IAP-23 a resolved authority rule requires exactly the authorities it names; an unusable rule authorizes nothing', () => {
    const oneOnly = changed(baseRecord, (copy) => { copy.approvals = [copy.approvals[0]]; });
    const resolved = (authorityIds: string[], resolutionRef = 'a governance record'): IdentityApprovalPolicy => ({
      ...TEST_APPROVAL_POLICY,
      requiredAuthorities: { status: 'RESOLVED', authorityIds, resolutionRef },
    });
    assert.deepEqual(evaluate(oneOnly, base.staged, { policy: resolved([TEST_AUTHORITY_ONE.authorityId]) }).failures, []);
    assert.deepEqual(codes(evaluate(oneOnly, base.staged, { policy: resolved([TEST_AUTHORITY_TWO.authorityId]) })), ['REQUIRED_AUTHORITY_MISSING']);
    assert.deepEqual(codes(evaluate(oneOnly, base.staged, { policy: resolved([TEST_AUTHORITY_ONE.authorityId, TEST_AUTHORITY_TWO.authorityId]) })), ['REQUIRED_AUTHORITY_MISSING']);
    // A further recognised authority may sign as well.
    assert.deepEqual(evaluate(baseRecord, base.staged, { policy: resolved([TEST_AUTHORITY_ONE.authorityId]) }).failures, []);

    for (const unusable of [
      resolved([]),
      resolved(['NOBODY_RECOGNISED']),
      resolved([TEST_AUTHORITY_ONE.authorityId, TEST_AUTHORITY_ONE.authorityId]),
      resolved([TEST_AUTHORITY_ONE.authorityId], '  '),
      { ...TEST_APPROVAL_POLICY, recognisedAuthorities: [] },
      { ...TEST_APPROVAL_POLICY, recognisedAuthorities: [TEST_AUTHORITY_ONE, TEST_AUTHORITY_ONE] },
    ] as IdentityApprovalPolicy[]) {
      assert.equal(requiredAuthorityIds(unusable), null);
      const result = evaluate(baseRecord, base.staged, { policy: unusable });
      assert.ok(codes(result).includes('APPROVAL_POLICY_UNUSABLE'));
      assert.equal(result.authorizesInstallation, false);
    }
  });
});

describe('W04 identity approval — the contract: status and time', () => {
  it('IAP-30 refuses an expired approval and one that is not yet valid', () => {
    const expired = changed(baseRecord, (copy) => { copy.approvedAtUtc = utc(-7200); copy.approvals.forEach((a: LooseApproval) => { a.approvedAtUtc = utc(-7200); }); copy.expiresAtUtc = utc(-60); });
    assert.deepEqual(codes(evaluate(expired, base.staged)), ['APPROVAL_EXPIRED']);

    // The review date is the instant the approval lapses: at that instant it has lapsed.
    const now = new Date(Date.UTC(2026, 10, 20, 12, 0, 0));
    const at = (approved: string, expires: string) =>
      changed(baseRecord, (copy) => { copy.approvedAtUtc = approved; copy.approvals.forEach((a: LooseApproval) => { a.approvedAtUtc = approved; }); copy.expiresAtUtc = expires; });
    assert.deepEqual(codes(evaluate(at('2026-11-13T00:00:00Z', '2026-11-20T12:00:00Z'), base.staged, { now })), ['APPROVAL_EXPIRED']);
    assert.deepEqual(codes(evaluate(at('2026-11-13T00:00:00Z', '2026-11-20T12:00:01Z'), base.staged, { now })), []);
    assert.deepEqual(codes(evaluate(at('2026-11-20T12:00:01Z', '2026-12-20T00:00:00Z'), base.staged, { now })), ['APPROVAL_NOT_YET_VALID']);
    assert.deepEqual(codes(evaluate(at('2026-11-20T12:00:00Z', '2026-12-20T00:00:00Z'), base.staged, { now })), []);

    // A window that is empty or runs backwards is not a validity period.
    assert.deepEqual(codes(evaluate(at('2026-11-13T00:00:00Z', '2026-11-13T00:00:00Z'), base.staged, { now: new Date(Date.UTC(2026, 10, 13)) })), ['APPROVAL_EXPIRED', 'APPROVAL_MALFORMED']);
    assert.ok(codes(evaluate(at('2026-11-14T00:00:00Z', '2026-11-13T00:00:00Z'), base.staged, { now })).includes('APPROVAL_MALFORMED'));

    // An approver cannot have approved after the approval took effect.
    const late = changed(baseRecord, (copy) => { copy.approvals[1].approvedAtUtc = utc(-60); });
    assert.deepEqual(codes(evaluate(late, base.staged)), ['APPROVAL_MALFORMED']);

    // A clock that cannot be read is not evidence that the approval is current.
    assert.deepEqual(codes(evaluate(baseRecord, base.staged, { now: new Date(Number.NaN) })), ['APPROVAL_EXPIRED']);
  });

  it('IAP-31 refuses a revoked approval, however it is marked', () => {
    const revocation = { revokedAtUtc: utc(-600), revokedBy: 'Fictitious Test Authority One', reason: 'test' };
    assert.deepEqual(codes(evaluate(changed(baseRecord, (copy) => { copy.status = 'REVOKED'; copy.revocation = revocation; }), base.staged)), ['APPROVAL_REVOKED']);
    assert.deepEqual(codes(evaluate(changed(baseRecord, (copy) => { copy.status = 'REVOKED'; }), base.staged)), ['APPROVAL_REVOKED']);
    assert.deepEqual(codes(evaluate(changed(baseRecord, (copy) => { copy.revocation = revocation; }), base.staged)), ['APPROVAL_REVOKED']);
    // Withdrawn in the policy: the copy of the record on the machine still says APPROVED.
    const withdrawn: IdentityApprovalPolicy = { ...TEST_APPROVAL_POLICY, revokedApprovalIds: [baseRecord.approvalId] };
    const result = evaluate(baseRecord, base.staged, { policy: withdrawn });
    assert.deepEqual(codes(result), ['APPROVAL_REVOKED']);
    assert.equal(result.authorizesInstallation, false);
  });
});

describe('W04 identity approval — the contract: governance reference and scope', () => {
  it('IAP-40 refuses an approval made under another decision or citing another record', () => {
    const cases: Array<[string, (copy: LooseApproval) => void]> = [
      ['another decision', (copy) => { copy.governance.decisionId = 'IIPS-W04-D2'; }],
      ['the governed decision, under the test policy', (copy) => { copy.governance.decisionId = IDENTITY_APPROVAL_POLICY.governance.decisionId; }],
      ['another decision record', (copy) => { copy.governance.decisionRecord = 'docs/integration/IIPS-W04-IRR-IDENTITY-SOURCE-PROVISIONING-2026-11-13.md'; }],
      ['another CV-22 record', (copy) => { copy.determinations.cv22OptionC.decisionRef = 'PKG-04-GOVERNED-UNIVERSE-CV22-DECISION-PACKET'; }],
      ['another roster-content decision', (copy) => { copy.determinations.irrRosterContentDecision.decisionRef = 'IRR-IID-Q-1'; }],
    ];
    for (const [label, change] of cases) {
      const result = evaluate(changed(baseRecord, change), base.staged);
      assert.deepEqual(codes(result), ['GOVERNANCE_REFERENCE_MISMATCH'], label);
      assert.equal(result.authorizesInstallation, false, label);
    }
  });

  it('IAP-41 refuses any scope other than the one permitted scope', () => {
    const cases: Array<[string, (copy: LooseApproval) => void, RegExp]> = [
      ['another environment', (copy) => { copy.scope.environment = 'SHARED_MULTI_USER_IIPS'; }, /environment/],
      ['another consumer', (copy) => { copy.scope.consumer = 'ALL_CONSUMERS'; }, /consumer/],
      ['a stronger roster class', (copy) => { copy.scope.rosterDataClass = 'INDEPENDENTLY_VERIFIED'; }, /rosterDataClass/],
      ['product-wide authoritative use', (copy) => { copy.scope.productWideAuthoritativeUse = true; }, /productWideAuthoritativeUse/],
      ['production use', (copy) => { copy.scope.productionUse = true; }, /productionUse/],
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
    const cases: Array<[string, (copy: LooseApproval) => void]> = [
      ['one export limitation left out', (copy) => { copy.accepted.exportLimitationCodes.pop(); }],
      ['none accepted', (copy) => { copy.accepted.exportLimitationCodes = []; }],
      ['one renamed', (copy) => { copy.accepted.exportLimitationCodes[0] = 'CIN_EXPORTED'; }],
      ['one added', (copy) => { copy.accepted.exportLimitationCodes.push('SOMETHING_ELSE'); }],
      ['one stated twice', (copy) => { copy.accepted.exportLimitationCodes.push(copy.accepted.exportLimitationCodes[0]); }],
      ['one additional limitation left out', (copy) => { copy.accepted.additionalLimitationCodes.pop(); }],
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
  });

  it('IAP-51 refuses any difference between the exclusions accepted and the records the export withholds', () => {
    // The slice holds the two master records the full export withholds.
    const withheld = staging('withheld', 1050, 1060, { extra: { acceptedWithheld: 2 } });
    assert.equal(withheld.staged.report.coverage.master.withheld, 2);
    const record = testApprovalFor(withheld.staged, IRR_COMMIT);
    assert.deepEqual(record.accepted.withheldRecords.map((item: LooseApproval) => item.isin), ['IN9175A01010', 'INE175A01038']);
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
    assert.deepEqual(codes(result), ['DIGEST_MISMATCH', 'GENERATION_MISMATCH']);
    assert.deepEqual(result.failures.filter((failure) => failure.code === 'DIGEST_MISMATCH').map((failure) => failure.detail.split(':')[0]), [ROSTER, LISTING_MAP]);
    assert.equal(result.authorizesInstallation, false);
    assert.equal(evaluate(testApprovalFor(other.staged, IRR_COMMIT), base.staged).authorizesInstallation, false);
  });

  it('IAP-64 refuses another generation even when the digests are stated correctly', () => {
    const cases: Array<[string, (copy: LooseApproval) => void, RegExp]> = [
      ['another mapping version', (copy) => { copy.subject.generation.mappingVersion = 'IPD-IRR-IDENTITY-EXPORT-MAPPING-2'; }, /mappingVersion/],
      ['another master batch', (copy) => { copy.subject.generation.masterBatchId = 'BATCH-OTHER'; }, /masterBatchId/],
      ['another master checksum', (copy) => { copy.subject.generation.masterChecksumSha256 = 'f'.repeat(64); }, /masterChecksumSha256/],
      ['another authorization', (copy) => { copy.subject.generation.masterAuthorizationRef = 'AUTH-OTHER'; }, /masterAuthorizationRef/],
      ['another record count', (copy) => { copy.subject.generation.masterRecordCount += 1; }, /masterRecordCount/],
      ['another roster label', (copy) => { copy.subject.generation.rosterLabel = 'another label'; }, /rosterLabel/],
      ['a P7 manifest that was not used', (copy) => { copy.subject.generation.p7ManifestSha256 = 'a'.repeat(64); }, /p7ManifestSha256/],
      ['a supplement that was not used', (copy) => { copy.subject.generation.issuerKeySupplementSha256 = 'a'.repeat(64); }, /issuerKeySupplementSha256/],
      ['a coverage count that was not made', (copy) => { copy.subject.generation.requiredIsins = { listSha256: 'a'.repeat(64), requested: 64, covered: 64, uncovered: 0 }; }, /requiredIsins/],
      ['another exported count', (copy) => { copy.subject.generation.securitiesExported += 1; }, /securitiesExported/],
      ['another report schema', (copy) => { copy.subject.generation.reportSchemaVersion = 'IPD_IRR_IDENTITY_SOURCE_EXPORT_V0'; }, /reportSchemaVersion/],
    ];
    for (const [label, change, field] of cases) {
      const result = evaluate(changed(baseRecord, change), base.staged);
      assert.deepEqual(codes(result), ['GENERATION_MISMATCH'], label);
      assert.match(result.failures[0]!.detail, field, label);
      assert.equal(result.authorizesInstallation, false, label);
    }
  });

  it('IAP-65 refuses another IRR commit than the one whose loader accepted the files', () => {
    assert.deepEqual(codes(evaluate(changed(baseRecord, (copy) => { copy.subject.irrCommit = OTHER_COMMIT; }), base.staged)), ['IRR_COMMIT_MISMATCH']);
    assert.deepEqual(codes(evaluate(baseRecord, base.staged, { gateCommit: OTHER_COMMIT })), ['IRR_COMMIT_MISMATCH']);
    // A gate that could not determine the IRR commit matches no approval.
    assert.deepEqual(codes(evaluate(baseRecord, base.staged, { gateCommit: null })), ['IRR_COMMIT_MISMATCH']);
  });
});

describe('W04 identity approval — the contract: the open governance questions', () => {
  it('IAP-70 CV-22 Option C: the record must state whether the five prerequisites apply, and act on its own answer', () => {
    const cv22 = (change: (cv: LooseApproval) => void) => changed(baseRecord, (copy) => change(copy.determinations.cv22OptionC));
    const satisfied = (cv: LooseApproval) => {
      cv.applicability = 'APPLIES';
      cv.prerequisites.forEach((item: LooseApproval) => { item.determination = 'SATISFIED'; item.evidenceRef = `evidence for ${item.id}`; });
    };

    // Not determined.
    for (const value of [null, '', 'UNRESOLVED', 'apply / do not apply']) {
      assert.deepEqual(codes(evaluate(cv22((cv) => { cv.applicability = value; }), base.staged)), ['CV22_NOT_DETERMINED'], String(value));
    }
    assert.deepEqual(codes(evaluate(cv22((cv) => { cv.basisRef = ''; }), base.staged)), ['CV22_NOT_DETERMINED']);
    assert.deepEqual(codes(evaluate(cv22((cv) => { cv.prerequisites[2].determination = null; }), base.staged)), ['CV22_NOT_DETERMINED']);
    assert.deepEqual(codes(evaluate(cv22((cv) => { cv.prerequisites.pop(); }), base.staged)), ['CV22_NOT_DETERMINED']);
    assert.deepEqual(codes(evaluate(cv22((cv) => { cv.prerequisites = []; }), base.staged)), ['CV22_NOT_DETERMINED']);
    assert.deepEqual(codes(evaluate(cv22((cv) => { cv.prerequisites[4].id = 'CV22-6-SOMETHING-ELSE'; }), base.staged)), ['CV22_NOT_DETERMINED']);
    assert.deepEqual(codes(evaluate(cv22((cv) => { cv.prerequisites[4] = { ...cv.prerequisites[0] }; }), base.staged)), ['CV22_NOT_DETERMINED']);

    // "Do not apply" (the fixture): accepted, and inconsistent when a prerequisite is then called satisfied.
    assert.deepEqual(evaluate(baseRecord, base.staged).failures, []);
    assert.deepEqual(codes(evaluate(cv22((cv) => { cv.prerequisites[0].determination = 'SATISFIED'; }), base.staged)), ['CV22_NOT_DETERMINED']);

    // "Apply": each of the five must be recorded as satisfied, with its evidence.
    assert.deepEqual(evaluate(cv22(satisfied), base.staged).failures, []);
    assert.deepEqual(codes(evaluate(cv22((cv) => { cv.applicability = 'APPLIES'; }), base.staged)), ['CV22_PREREQUISITE_NOT_MET']);
    assert.equal(evaluate(cv22((cv) => { cv.applicability = 'APPLIES'; }), base.staged).failures.length, 5);
    for (let index = 0; index < 5; index += 1) {
      const oneOpen = evaluate(cv22((cv) => { satisfied(cv); cv.prerequisites[index].determination = 'NOT_APPLICABLE'; }), base.staged);
      assert.deepEqual(codes(oneOpen), ['CV22_PREREQUISITE_NOT_MET']);
      assert.ok(oneOpen.failures[0]!.detail.includes(TEST_APPROVAL_POLICY.cv22OptionC.prerequisiteIds[index]!));
      const noEvidence = evaluate(cv22((cv) => { satisfied(cv); cv.prerequisites[index].evidenceRef = ''; }), base.staged);
      assert.deepEqual(codes(noEvidence), ['CV22_PREREQUISITE_NOT_MET']);
    }
  });

  it('IAP-71 IRR roster-content decision: the record must state whether it applies; if it does, the roster must be within its cap', () => {
    const roster = (record: LooseApproval, change: (decision: LooseApproval) => void) => changed(record, (copy) => change(copy.determinations.irrRosterContentDecision));
    for (const value of [null, '', 'UNRESOLVED']) {
      assert.deepEqual(codes(evaluate(roster(baseRecord, (decision) => { decision.applicability = value; }), base.staged)), ['ROSTER_CONTENT_DECISION_NOT_DETERMINED']);
    }
    assert.deepEqual(codes(evaluate(roster(baseRecord, (decision) => { decision.basisRef = ''; }), base.staged)), ['ROSTER_CONTENT_DECISION_NOT_DETERMINED']);

    // Five issuers are within a cap of 200.
    assert.equal(IDENTITY_APPROVAL_POLICY.irrRosterContentDecision.issuerCap, 200);
    assert.deepEqual(evaluate(roster(baseRecord, (decision) => { decision.applicability = 'APPLIES'; }), base.staged).failures, []);

    // 250 issuers are not.
    const large = staging('large', 100, 350);
    assert.equal(large.staged.report.coverage.issuers.exported, 250);
    const largeRecord = testApprovalFor(large.staged, IRR_COMMIT);
    assert.deepEqual(evaluate(largeRecord, large.staged).failures, []);
    const applied = evaluate(roster(largeRecord, (decision) => { decision.applicability = 'APPLIES'; }), large.staged);
    assert.deepEqual(codes(applied), ['ROSTER_CONTENT_DECISION_NOT_MET']);
    assert.match(applied.failures[0]!.detail, /200/);
    assert.match(applied.failures[0]!.detail, /250/);
  });

  it('IAP-72 qualifications: each must be disposed of, and a coverage count recorded as made must have been made', () => {
    const q = (change: (items: LooseApproval[]) => void) => changed(baseRecord, (copy) => change(copy.qualifications));
    assert.deepEqual(codes(evaluate(q((items) => { items[0]!.disposition = null; }), base.staged)), ['QUALIFICATION_NOT_DISPOSED']);
    assert.deepEqual(codes(evaluate(q((items) => { items[1]!.disposition = 'required / waived'; }), base.staged)), ['QUALIFICATION_NOT_DISPOSED']);
    assert.deepEqual(codes(evaluate(q((items) => { items.pop(); }), base.staged)), ['QUALIFICATION_NOT_DISPOSED']);
    assert.deepEqual(codes(evaluate(q((items) => { items.length = 0; }), base.staged)), ['QUALIFICATION_NOT_DISPOSED']);
    assert.deepEqual(codes(evaluate(q((items) => { items[1]!.id = 'Q-9'; }), base.staged)), ['QUALIFICATION_NOT_DISPOSED']);
    assert.deepEqual(codes(evaluate(q((items) => { items.push({ ...items[0]! }); }), base.staged)), ['QUALIFICATION_NOT_DISPOSED']);

    // Q-1 is the coverage of the operator's holdings. The base generation counted none.
    assert.deepEqual(codes(evaluate(q((items) => { items[0]!.disposition = 'SATISFIED'; }), base.staged)), ['QUALIFICATION_NOT_MET']);
    // Q-2 is not something a generation can show; its disposition is the approver's statement.
    assert.deepEqual(evaluate(q((items) => { items[1]!.disposition = 'SATISFIED'; }), base.staged).failures, []);

    const covered = D05_AUTHENTICATED_UNIVERSE_ENTITIES[0]!.isin;
    const counted = staging('coverage', 0, 5, { extra: { requiredIsins: [covered] } });
    const record = testApprovalFor(counted.staged, IRR_COMMIT);
    assert.deepEqual(record.subject.generation.requiredIsins, {
      listSha256: (counted.staged.report.inputs.requiredIsins as { listSha256: string }).listSha256,
      requested: 1,
      covered: 1,
      uncovered: 0,
    });
    const satisfied = changed(record, (copy) => { copy.qualifications[0].disposition = 'SATISFIED'; });
    assert.deepEqual(evaluate(satisfied, counted.staged).failures, []);
    // The coverage the approver saw is part of what was approved.
    assert.deepEqual(codes(evaluate(changed(satisfied, (copy) => { copy.subject.generation.requiredIsins.covered = 0; copy.subject.generation.requiredIsins.uncovered = 1; }), counted.staged)), ['GENERATION_MISMATCH']);
    // The same files generated without the coverage count are another generation.
    assert.deepEqual(counted.staged.digests, base.staged.digests);
    assert.deepEqual(codes(evaluate(satisfied, base.staged)), ['GENERATION_MISMATCH', 'QUALIFICATION_NOT_MET']);
  });
});

describe('W04 identity approval — the blank template and the repository', () => {
  it('IAP-80 the tracked template is a complete form with nothing filled in, and is refused', () => {
    const template = JSON.parse(readFileSync(TEMPLATE, 'utf8')) as LooseApproval;
    assert.equal(template.schemaVersion, IDENTITY_APPROVAL_SCHEMA);
    for (const policy of [IDENTITY_APPROVAL_POLICY, TEST_APPROVAL_POLICY]) {
      const result = evaluate(template, base.staged, { policy });
      assert.equal(result.authorizesInstallation, false);
      assert.equal(result.approval, null);
      assert.ok(result.failures.length > 50, 'the blank form is refused for more than fifty reasons');
      // Complete: no field of the contract is absent from the form and the form has no other field.
      assert.deepEqual(result.failures.filter((failure) => / is missing$| is not a field of this record$/.test(failure.detail)), []);
      assert.deepEqual(codes(result), ['APPROVAL_MALFORMED', 'APPROVER_DID_NOT_APPROVE', 'CV22_NOT_DETERMINED', 'QUALIFICATION_NOT_DISPOSED', 'ROSTER_CONTENT_DECISION_NOT_DETERMINED']);
    }

    // Nothing that decides anything is filled in.
    assert.equal(template.approvalId, null);
    assert.equal(template.status, null);
    assert.equal(template.approvedAtUtc, null);
    assert.equal(template.expiresAtUtc, null);
    assert.equal(template.revocation, null);
    assert.equal(template.governance.approvalActRef, null);
    assert.equal(template.subject.irrCommit, null);
    for (const name of FILES) assert.deepEqual(template.subject.files[name], { sha256: null, bytes: null });
    assert.ok(Object.values(template.subject.generation).every((value) => value === null));
    assert.ok(Object.values(template.scope).every((value) => value === null));
    assert.deepEqual(template.accepted, { exportLimitationCodes: [], additionalLimitationCodes: [], withheldRecords: [] });
    assert.deepEqual(template.approvals, [{ authorityId: null, name: null, designation: null, decision: null, approvedAtUtc: null, statement: null }]);
    assert.equal(template.determinations.cv22OptionC.applicability, null);
    assert.equal(template.determinations.cv22OptionC.basisRef, null);
    assert.equal(template.determinations.irrRosterContentDecision.applicability, null);
    assert.ok(template.determinations.cv22OptionC.prerequisites.every((item: LooseApproval) => item.determination === null && item.evidenceRef === null));
    assert.ok(template.qualifications.every((item: LooseApproval) => item.disposition === null && item.ref === null));

    // Only what identifies the form is printed on it.
    assert.equal(template.governance.decisionId, IDENTITY_APPROVAL_POLICY.governance.decisionId);
    assert.equal(template.governance.decisionRecord, IDENTITY_APPROVAL_POLICY.governance.decisionRecord);
    assert.equal(template.determinations.cv22OptionC.decisionRef, IDENTITY_APPROVAL_POLICY.cv22OptionC.decisionRef);
    assert.equal(template.determinations.irrRosterContentDecision.decisionRef, IDENTITY_APPROVAL_POLICY.irrRosterContentDecision.decisionRef);
    assert.deepEqual(template.determinations.cv22OptionC.prerequisites.map((item: LooseApproval) => item.id), IDENTITY_APPROVAL_POLICY.cv22OptionC.prerequisiteIds);
    assert.deepEqual(template.qualifications.map((item: LooseApproval) => item.id), IDENTITY_APPROVAL_POLICY.qualificationIds);
    // No name of any authority appears in the form.
    const text = readFileSync(TEMPLATE, 'utf8');
    for (const authority of IDENTITY_APPROVAL_POLICY.recognisedAuthorities) {
      assert.ok(!text.includes(authority.authorityId) && !text.includes(`"${authority.name}"`));
    }
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
      assert.equal(refusal(() => installStagedIdentityUnderPolicy({ stagingDir, dataDir, approvalFile }, TEST_APPROVAL_POLICY)).code, 'APPROVAL_MISSING');
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
    const attempt = (approvalFile: string) => refusal(() => installStagedIdentityUnderPolicy({ stagingDir, dataDir, approvalFile }, TEST_APPROVAL_POLICY)).code;

    writeFileSync(join(dir, 'not-json.json'), '{ "schemaVersion": ');
    assert.equal(attempt(join(dir, 'not-json.json')), 'APPROVAL_UNREADABLE');
    writeFileSync(join(dir, 'empty.json'), '');
    assert.equal(attempt(join(dir, 'empty.json')), 'APPROVAL_UNREADABLE');
    writeFileSync(join(dir, 'text.json'), 'APPROVED by the Program Authority\n');
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
    assert.equal(installStagedIdentityUnderPolicy({ stagingDir, dataDir, approvalFile: withBom }, TEST_APPROVAL_POLICY).action, 'INSTALLED');
  });

  it('IAP-102 a valid approval for exactly the staged files installs them, and the receipt names the approval', () => {
    const { stagingDir, staged } = staging('valid');
    const dataDir = freshDir('data');
    const record = testApprovalFor(staged, IRR_COMMIT);
    const approvalFile = writeApprovalFile(freshDir('approval'), record);
    const approvalBytes = readFileSync(approvalFile);

    const outcome = installStagedIdentityUnderPolicy({ stagingDir, dataDir, approvalFile }, TEST_APPROVAL_POLICY);
    assert.equal(outcome.action, 'INSTALLED');
    assert.deepEqual(readIdentityDirectoryDigests(identityDirOf(dataDir)), staged.digests);
    for (const name of FILES) assert.equal(outcome.installedFiles[name].sha256, record.subject.files[name].sha256, 'what was installed is what was approved');
    assert.deepEqual(outcome.approval, {
      approvalId: record.approvalId,
      recordSha256: createHash('sha256').update(approvalBytes).digest('hex'),
      policyVersion: TEST_APPROVAL_POLICY.policyVersion,
      governanceDecisionId: TEST_APPROVAL_POLICY.governance.decisionId,
      approvalActRef: record.governance.approvalActRef,
      approvers: [TEST_AUTHORITY_ONE.authorityId, TEST_AUTHORITY_TWO.authorityId],
      approvedAtUtc: record.approvedAtUtc,
      expiresAtUtc: record.expiresAtUtc,
    });
    assert.equal(recordInstallation(stagingDir, outcome, '2026-11-13T00:00:00.000Z'), true);
    const receipt = JSON.parse(readFileSync(join(stagingDir, STAGED_INSTALL_RECEIPT_FILE), 'utf8')) as LooseApproval;
    assert.deepEqual(receipt.approval, outcome.approval);
    // The approval file is read, never written.
    assert.deepEqual(readFileSync(approvalFile), approvalBytes);
  });

  it('IAP-103 the governed entry point refuses a record of the test authorities, and the test policy is not the governed one', () => {
    const { stagingDir, staged } = staging('governed');
    const dataDir = freshDir('data');
    const approvalFile = writeApprovalFile(freshDir('approval'), testApprovalFor(staged, IRR_COMMIT));
    const refused = refusal(() => installStagedIdentity({ stagingDir, dataDir, approvalFile }));
    assert.equal(refused.code, 'GOVERNANCE_REFERENCE_MISMATCH');
    assert.deepEqual(refused.codes, ['APPROVER_NOT_AUTHORIZED', 'GOVERNANCE_REFERENCE_MISMATCH', 'REQUIRED_AUTHORITY_MISSING']);
    assert.deepEqual(readdirSync(dataDir), []);
    assert.notEqual(TEST_APPROVAL_POLICY.policyVersion, IDENTITY_APPROVAL_POLICY.policyVersion);
    for (const authority of TEST_APPROVAL_POLICY.recognisedAuthorities) {
      assert.ok(!IDENTITY_APPROVAL_POLICY.recognisedAuthorities.some((governed) => governed.authorityId === authority.authorityId));
    }
  });

  it('IAP-104 the approval is checked before the gate, and a valid approval does not replace the gate', () => {
    const { stagingDir, staged } = staging('ungated', 0, 5, { gate: false });
    const dataDir = freshDir('data');
    const dir = freshDir('approvals');
    const good = writeApprovalFile(dir, testApprovalFor(staged, IRR_COMMIT), 'good.json');
    const expired = writeApprovalFile(dir, changed(testApprovalFor(staged, IRR_COMMIT), (copy) => { copy.expiresAtUtc = utc(-1); }), 'expired.json');
    assert.equal(refusal(() => installStagedIdentityUnderPolicy({ stagingDir, dataDir, approvalFile: expired }, TEST_APPROVAL_POLICY)).code, 'APPROVAL_EXPIRED');
    assert.equal(refusal(() => installStagedIdentityUnderPolicy({ stagingDir, dataDir, approvalFile: good }, TEST_APPROVAL_POLICY)).code, 'GATE_NOT_RUN');

    // The order is part of the contract. A record that is invalid in itself is refused before the
    // staging directory is read: it is reported even where nothing is staged.
    const nothingStaged = freshDir('nothing-staged');
    assert.equal(refusal(() => installStagedIdentityUnderPolicy({ stagingDir: nothingStaged, dataDir, approvalFile: expired }, TEST_APPROVAL_POLICY)).code, 'APPROVAL_EXPIRED');
    assert.equal(refusal(() => installStagedIdentityUnderPolicy({ stagingDir: nothingStaged, dataDir, approvalFile: good }, TEST_APPROVAL_POLICY)).code, 'STAGING_REPORT_ABSENT');
    assert.deepEqual(readdirSync(nothingStaged), []);
    // A record for other files is refused before the gate is considered.
    const forOtherFiles = writeApprovalFile(dir, testApprovalFor(staging('other-files', 5, 10).staged, IRR_COMMIT), 'other-files.json');
    assert.equal(refusal(() => installStagedIdentityUnderPolicy({ stagingDir, dataDir, approvalFile: forOtherFiles }, TEST_APPROVAL_POLICY)).code, 'DIGEST_MISMATCH');

    // A gate that could not determine the IRR commit: the approval cannot be matched to it.
    const unknownCommit = staging('unknown-commit', 0, 5, { irrCommit: null });
    const approval = writeApprovalFile(dir, testApprovalFor(unknownCommit.staged, IRR_COMMIT), 'unknown-commit.json');
    assert.equal(refusal(() => installStagedIdentityUnderPolicy({ stagingDir: unknownCommit.stagingDir, dataDir, approvalFile: approval }, TEST_APPROVAL_POLICY)).code, 'IRR_COMMIT_MISMATCH');
    assert.deepEqual(readdirSync(dataDir), []);
  });

  it('IAP-105 a repeated run that would change nothing still requires a valid approval', () => {
    const { stagingDir, staged } = staging('repeat');
    const dataDir = freshDir('data');
    const dir = freshDir('approvals');
    const good = writeApprovalFile(dir, testApprovalFor(staged, IRR_COMMIT), 'good.json');
    assert.equal(installStagedIdentityUnderPolicy({ stagingDir, dataDir, approvalFile: good }, TEST_APPROVAL_POLICY).action, 'INSTALLED');
    assert.equal(installStagedIdentityUnderPolicy({ stagingDir, dataDir, approvalFile: good }, TEST_APPROVAL_POLICY).action, 'ALREADY_INSTALLED');

    const before = snapshot(dataDir);
    const revoked = writeApprovalFile(dir, changed(testApprovalFor(staged, IRR_COMMIT), (copy) => { copy.status = 'REVOKED'; }), 'revoked.json');
    assert.equal(refusal(() => installStagedIdentityUnderPolicy({ stagingDir, dataDir, approvalFile: revoked }, TEST_APPROVAL_POLICY)).code, 'APPROVAL_REVOKED');
    assert.equal(refusal(() => installStagedIdentity({ stagingDir, dataDir, approvalFile: '' })).code, 'APPROVAL_MISSING');
    assert.deepEqual(snapshot(dataDir), before);
  });

  it('IAP-106 a rejected approval never modifies installed files, a fresh data directory or the staging directory', () => {
    // Version 1 is installed. Version 2 is staged, gated and waiting; every attempt below asks to replace.
    const first = staging('installed-v1', 0, 5);
    const dataDir = freshDir('data-with-v1');
    const dir = freshDir('approvals');
    installStagedIdentityUnderPolicy(
      { stagingDir: first.stagingDir, dataDir, approvalFile: writeApprovalFile(dir, testApprovalFor(first.staged, IRR_COMMIT), 'v1.json') },
      TEST_APPROVAL_POLICY,
    );
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
      ['another kind of document', 'APPROVAL_SCHEMA_UNKNOWN', buildReviewRecord(second.staged, { accepted: true, irrCommit: IRR_COMMIT }) as unknown as LooseApproval],
      ['invalid structure: field missing', 'APPROVAL_MALFORMED', changed(valid, (copy) => delete copy.scope)],
      ['invalid structure: unknown field', 'APPROVAL_MALFORMED', changed(valid, (copy) => { copy.note = 'approved verbally'; })],
      ['invalid structure: blank template', 'APPROVAL_MALFORMED', JSON.parse(readFileSync(TEMPLATE, 'utf8')) as LooseApproval],
      ['unauthorized approver', 'APPROVER_NOT_AUTHORIZED', changed(valid, (copy) => { copy.approvals[0] = { ...copy.approvals[0], authorityId: 'SOMEONE_ELSE' }; })],
      ['missing required authority', 'REQUIRED_AUTHORITY_MISSING', changed(valid, (copy) => { copy.approvals.pop(); })],
      ['approver did not approve', 'APPROVER_DID_NOT_APPROVE', changed(valid, (copy) => { copy.approvals[1].decision = 'REJECTED'; })],
      ['expired', 'APPROVAL_EXPIRED', changed(valid, (copy) => { copy.expiresAtUtc = utc(-1); })],
      ['not yet valid', 'APPROVAL_NOT_YET_VALID', changed(valid, (copy) => { copy.approvedAtUtc = utc(3600); copy.expiresAtUtc = utc(7200); })],
      ['revoked', 'APPROVAL_REVOKED', changed(valid, (copy) => { copy.status = 'REVOKED'; copy.revocation = { revokedAtUtc: utc(-60), revokedBy: 'Fictitious Test Authority One', reason: 'test' }; })],
      ['incorrect governance reference', 'GOVERNANCE_REFERENCE_MISMATCH', changed(valid, (copy) => { copy.governance.decisionId = 'SOME-OTHER-DECISION'; })],
      ['wrong permitted scope', 'SCOPE_MISMATCH', changed(valid, (copy) => { copy.scope.productWideAuthoritativeUse = true; })],
      ['modified limitation', 'LIMITATION_MISMATCH', changed(valid, (copy) => { copy.accepted.exportLimitationCodes.pop(); })],
      ['modified exclusion', 'EXCLUSION_MISMATCH', changed(valid, (copy) => { copy.accepted.withheldRecords.pop(); })],
      ['roster digest mismatch', 'DIGEST_MISMATCH', changed(valid, (copy) => { copy.subject.files[ROSTER].sha256 = flip(copy.subject.files[ROSTER].sha256); })],
      ['listing-map digest mismatch', 'DIGEST_MISMATCH', changed(valid, (copy) => { copy.subject.files[LISTING_MAP].sha256 = flip(copy.subject.files[LISTING_MAP].sha256); })],
      ['corporate-actions digest mismatch', 'DIGEST_MISMATCH', changed(valid, (copy) => { copy.subject.files[CORPORATE_ACTIONS].sha256 = flip(copy.subject.files[CORPORATE_ACTIONS].sha256); })],
      ['approval of the installed version, not the staged one', 'DIGEST_MISMATCH', testApprovalFor(first.staged, IRR_COMMIT)],
      ['another generation', 'GENERATION_MISMATCH', changed(valid, (copy) => { copy.subject.generation.masterBatchId = 'BATCH-OTHER'; })],
      ['another IRR commit', 'IRR_COMMIT_MISMATCH', changed(valid, (copy) => { copy.subject.irrCommit = OTHER_COMMIT; })],
      ['CV-22 not determined', 'CV22_NOT_DETERMINED', changed(valid, (copy) => { copy.determinations.cv22OptionC.applicability = null; })],
      ['CV-22 applies and is not met', 'CV22_PREREQUISITE_NOT_MET', changed(valid, (copy) => { copy.determinations.cv22OptionC.applicability = 'APPLIES'; })],
      ['roster-content decision not determined', 'ROSTER_CONTENT_DECISION_NOT_DETERMINED', changed(valid, (copy) => { copy.determinations.irrRosterContentDecision.applicability = null; })],
      ['qualification not disposed', 'QUALIFICATION_NOT_DISPOSED', changed(valid, (copy) => { copy.qualifications[0].disposition = null; })],
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
        const outcome = refusal(() => installStagedIdentityUnderPolicy(options, TEST_APPROVAL_POLICY));
        assert.equal(outcome.code === expected || outcome.codes.includes(expected), true, `${label}: got ${outcome.code} [${outcome.codes.join(', ')}]`);
        assert.ok(outcome.codes.length > 0, `${label}: the refusal is an approval refusal`);
      }
      assert.deepEqual(snapshot(dataDir), installedBefore, `${label}: the installed files, their times and their neighbours are unchanged`);
      assert.deepEqual(readdirSync(emptyData), [], `${label}: nothing was created in a fresh data directory`);
      assert.deepEqual(snapshot(second.stagingDir), stagingBefore, `${label}: no backup, no receipt and no other file was written to the staging directory`);
    }
    assert.equal(rejected.length, 27);
    assert.deepEqual(readIdentityDirectoryDigests(identityDirOf(dataDir)), first.staged.digests, 'version 1 is still installed');

    // The same request with the valid approval is what replaces version 1, with its backup.
    const outcome = installStagedIdentityUnderPolicy(
      { stagingDir: second.stagingDir, dataDir, approvalFile: writeApprovalFile(dir, valid, 'v2.json'), replace: true },
      TEST_APPROVAL_POLICY,
    );
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

    // It applies the governed policy, so a record of the test authorities is refused.
    const alone = checkIdentityApproval({ approvalFile: good });
    assert.deepEqual(alone.evaluation.checked, { record: true, stagedFiles: false, loaderGate: false });
    assert.equal(alone.evaluation.authorizesInstallation, false);
    assert.ok(alone.evaluation.failures.some((failure) => failure.code === 'APPROVER_NOT_AUTHORIZED'));
    assert.equal(alone.recordSha256, createHash('sha256').update(readFileSync(good)).digest('hex'));

    const withStaging = checkIdentityApproval({ approvalFile: good, stagingDir });
    assert.deepEqual(withStaging.evaluation.checked, { record: true, stagedFiles: true, loaderGate: true });
    assert.equal(withStaging.evaluation.authorizesInstallation, false);

    const missing = checkIdentityApproval({ approvalFile: join(dir, 'absent.json'), stagingDir });
    assert.deepEqual(missing.evaluation.failures.map((failure) => failure.code), ['APPROVAL_MISSING']);
    assert.equal(missing.recordSha256, null);

    assert.deepEqual({ staging: snapshot(stagingDir), approvals: snapshot(dir) }, before);
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
    assert.deepEqual(review.toBeAcceptedExplicitly.additionalLimitationCodes, IDENTITY_APPROVAL_POLICY.additionalLimitationCodes);
    assert.deepEqual(review.approvalPolicy.requiredAuthorities, ['PROGRAM_AUTHORITY_RAMKI', 'PROGRAM_AUTHORITY_SAI']);
    assert.equal(review.approvalPolicy.requiredAuthoritiesRule, 'UNRESOLVED');
    for (const key of ['approvals', 'status', 'approvalId', 'approvedAtUtc', 'expiresAtUtc', 'scope', 'determinations']) {
      assert.equal(Object.prototype.hasOwnProperty.call(review, key), false, `the review record has no ${key}`);
    }
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
    assert.match(second.stdout, /^REVIEW RESULT: COMPLETE - the proposed files are staged and were NOT installed\. This is not an approval/m);
    const staged = readStagedExport(stagingDir);
    for (const name of FILES) {
      assert.ok(second.stdout.includes(`${name}: sha256 ${staged.digests[name].sha256}, ${staged.digests[name].bytes} bytes`), `the digest of ${name} is reported`);
    }
    assert.match(second.stdout, /^mapping version: IPD-IRR-IDENTITY-EXPORT-MAPPING-1$/m);
    assert.match(second.stdout, /^master batch: BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001$/m);
    assert.match(second.stdout, /^exported: issuers 2388, securities 2388, NSE listings 2388, corporate actions 0; withheld 2$/m);
    assert.match(second.stdout, /^IRR commit of the accepted loader gate: not available/m);
    assert.equal((second.stdout.match(/^export limitation: /gm) ?? []).length, 8);
    assert.equal((second.stdout.match(/^additional limitation: /gm) ?? []).length, 2);
    assert.match(second.stdout, /^withheld record: IN9175A01010: /m);
    assert.match(second.stdout, /^withheld record: INE175A01038: /m);
    assert.match(second.stdout, /^approval required from: PROGRAM_AUTHORITY_RAMKI, PROGRAM_AUTHORITY_SAI \(which authorities must approve is an unresolved governance question/m);

    const review = JSON.parse(readFileSync(join(stagingDir, STAGED_REVIEW_FILE), 'utf8')) as LooseApproval;
    assert.equal(review.schemaVersion, IDENTITY_REVIEW_SCHEMA);
    assert.deepEqual(review.subject.files, staged.digests);
    assert.equal(review.subject.generation.issuersExported, 2388);

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

  it('IAP-122 install on the command line refuses every record no governed authority made, and writes nothing', () => {
    const { stagingDir, staged } = staging('cli-install');
    const dataDir = freshDir('cli-install-data');
    const dir = freshDir('cli-approvals');
    const stagingBefore = snapshot(stagingDir);

    const attempts: Array<[string[], string]> = [
      [[], 'APPROVAL_MISSING'],
      [['--approval', join(dir, 'absent.json')], 'APPROVAL_MISSING'],
      [['--approval', TEMPLATE], 'APPROVAL_MALFORMED'],
      [['--approval', join(stagingDir, 'provisioning-report.json')], 'APPROVAL_SCHEMA_UNKNOWN'],
      // A complete record for exactly these files, made by authorities the governed policy does not know.
      [['--approval', writeApprovalFile(dir, testApprovalFor(staged, IRR_COMMIT), 'fictitious.json')], 'GOVERNANCE_REFERENCE_MISMATCH'],
      // The same record relabelled with the governed decision: its approvers are still nobody.
      [
        ['--approval', writeApprovalFile(dir, changed(testApprovalFor(staged, IRR_COMMIT), (copy) => { copy.governance = { ...copy.governance, ...IDENTITY_APPROVAL_POLICY.governance }; }), 'relabelled.json')],
        'APPROVER_NOT_AUTHORIZED',
      ],
    ];
    for (const [extra, expected] of attempts) {
      for (const replace of [[], ['--replace']]) {
        const result = run('install', '--staging', stagingDir, '--data-dir', dataDir, ...extra, ...replace);
        assert.equal(result.status, 7, `${expected}: ${result.stdout}${result.stderr}`);
        assert.match(result.stdout, new RegExp(`^RESULT: FAIL \\(${expected}\\) the governance approval record does not authorize this installation\\. Nothing was installed or changed\\.$`, 'm'));
        assert.match(result.stdout, new RegExp(`^APPROVAL REFUSED, ${expected}: `, 'm'));
      }
    }
    assert.deepEqual(readdirSync(dataDir), []);
    assert.deepEqual(snapshot(stagingDir), stagingBefore, 'no receipt and no other file was written');

    // The relabelled record is short of both governed authorities, and the output says so.
    const relabelled = run('install', '--staging', stagingDir, '--data-dir', dataDir, '--approval', join(dir, 'relabelled.json'));
    assert.match(relabelled.stdout, /^APPROVAL REFUSED, REQUIRED_AUTHORITY_MISSING: the approval of PROGRAM_AUTHORITY_RAMKI is required/m);
    assert.match(relabelled.stdout, /^APPROVAL REFUSED, REQUIRED_AUTHORITY_MISSING: the approval of PROGRAM_AUTHORITY_SAI is required/m);
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
    assert.match(template.stdout, /^compared with the staged files: no; compared with the IRR commit of an accepted loader gate: no$/m);

    const withStaging = run('check-approval', '--approval', fictitious, '--staging', stagingDir);
    assert.equal(withStaging.status, 7);
    assert.match(withStaging.stdout, /^compared with the staged files: yes; compared with the IRR commit of an accepted loader gate: yes$/m);
    assert.match(withStaging.stdout, /^approvers named in the record: TEST_AUTHORITY_ONE, TEST_AUTHORITY_TWO$/m);
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
    for (const option of ['--approve', '--auto-approve', '--force', '--skip-approval', '--no-approval', '--policy', '--now']) {
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
    assert.ok(!/from 'node:fs'|writeFileSync|mkdirSync/.test(approvalModule), 'the approval module has no file access');
    const provisioningModule = readFileSync(join(ROOT, 'src', 'identity', 'irr_identity_provisioning.ts'), 'utf8');
    assert.ok(!provisioningModule.includes('IDENTITY_APPROVAL_SCHEMA'), 'the provisioning module never writes the approval schema');
    assert.equal((provisioningModule.match(/installUnderPolicy\(options, IDENTITY_APPROVAL_POLICY\)/g) ?? []).length, 1);
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
    for (const authority of IDENTITY_APPROVAL_POLICY.recognisedAuthorities) assert.ok(!wrapper.includes(authority.authorityId));
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
