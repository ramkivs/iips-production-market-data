/**
 * Institutional Investment Platform System (IIPS)
 * Test support: approval records for the W04 identity-provisioning tests.
 *
 * READ THIS BEFORE USING IT.
 *
 * The governed approval policy (`IDENTITY_APPROVAL_POLICY`) names one real approver. No test may
 * hold an approval made in that name, because such a document would be a forged approval. The
 * tests therefore run acceptance under `TEST_APPROVAL_POLICY`, whose approver does not exist and
 * whose decision is not a decision. A record built here:
 *
 *   - is refused by `installStagedIdentity` and by the command line, which use the governed policy
 *     (the tests IAP-103 and IAP-122 assert exactly that);
 *   - is accepted only by `installStagedIdentityUnderPolicy` when a test passes this test policy;
 *   - names a tool commit that is not a commit of any repository;
 *   - lives in a temporary directory that the test removes.
 *
 * Nothing in `src/` or `scripts/` imports this file.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  IDENTITY_APPROVAL_POLICY,
  IDENTITY_APPROVAL_SCHEMA,
  additionalLimitationCodesFor,
  approvalGenerationOf,
  approvalSourceOf,
  approvalWithheldOf,
  type IdentityApprovalPolicy,
  type ToolIdentity,
} from '../../src/identity/irr_identity_approval.js';
import type { StagedExport } from '../../src/identity/irr_identity_provisioning.js';

export const TEST_AUTHORITY = Object.freeze({
  authorityId: 'TEST_AUTHORITY_NOT_A_PERSON',
  name: 'Fictitious Test Authority',
  role: 'Test authority (does not exist)',
});

/**
 * The governed policy with its approver and its decision replaced by fictitious ones. Everything
 * else (scope, limitations, the roster-content default, the determinations) is the governed
 * policy's, so the tests exercise the governed rules.
 */
export const TEST_APPROVAL_POLICY: IdentityApprovalPolicy = Object.freeze({
  ...IDENTITY_APPROVAL_POLICY,
  policyVersion: 'TEST-POLICY-NOT-GOVERNED',
  decision: Object.freeze({
    decisionId: 'TEST-DECISION-NOT-A-DECISION',
    decisionRecord: 'tests/support/not-a-decision-record.md',
  }),
  approver: TEST_AUTHORITY,
});

/** A tool identity for the tests. The commit is not a commit of any repository. */
export const TEST_TOOL_COMMIT = 'e'.repeat(40);
export const TEST_TOOL: ToolIdentity = Object.freeze({ commit: TEST_TOOL_COMMIT, unmodified: true, detail: '' });

/** A UTC time `offsetSeconds` from now, in the form an approval record states it. */
export function utc(offsetSeconds: number, from: Date = new Date()): string {
  return new Date(Math.floor(from.getTime() / 1000) * 1000 + offsetSeconds * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// The record is deliberately loosely typed: the tests break it in every way.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LooseApproval = Record<string, any>;

let serial = 0;

/**
 * A record that `TEST_APPROVAL_POLICY` accepts for the given staged export, gated IRR commit and
 * test tool. Approved one hour ago, with a review date thirty days ahead.
 */
export function testApprovalFor(
  staged: StagedExport,
  irrCommit: string,
  policy: IdentityApprovalPolicy = TEST_APPROVAL_POLICY,
  ipdToolCommit: string = TEST_TOOL_COMMIT,
): LooseApproval {
  serial += 1;
  return {
    schemaVersion: IDENTITY_APPROVAL_SCHEMA,
    approvalId: `TEST-FIXTURE-NOT-AN-APPROVAL-${String(serial).padStart(4, '0')}`,
    status: 'APPROVED',
    policyVersion: policy.policyVersion,
    decision: { decisionId: policy.decision.decisionId, decisionRecord: policy.decision.decisionRecord },
    subject: {
      files: JSON.parse(JSON.stringify(staged.digests)),
      p04Source: approvalSourceOf(staged.report),
      generation: approvalGenerationOf(staged.report),
      irrCommit,
      ipdToolCommit,
    },
    scope: { ...policy.scope },
    accepted: {
      exportLimitationCodes: staged.report.limitations.map((limitation) => limitation.code),
      additionalLimitationCodes: additionalLimitationCodesFor(policy, staged.report),
      withheldRecords: approvalWithheldOf(staged.report),
    },
    approver: {
      authorityId: policy.approver.authorityId,
      name: policy.approver.name,
      decision: 'APPROVED',
      statement: 'test fixture; nobody approved anything',
    },
    approvedAtUtc: utc(-3600),
    reviewDateUtc: utc(30 * 24 * 3600),
    revocation: null,
  };
}

/** Write a record (or any other value) as a JSON file in `dir` and return its path. */
export function writeApprovalFile(dir: string, record: unknown, name = 'approval-under-test.json'): string {
  mkdirSync(dir, { recursive: true });
  const path = join(dir, name);
  writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  return path;
}
