/**
 * Institutional Investment Platform System (IIPS)
 * Test support: approval records for the W04 identity-provisioning tests.
 *
 * READ THIS BEFORE USING IT.
 *
 * The governed approval policy (`IDENTITY_APPROVAL_POLICY`) recognises real authorities. No test
 * may hold an approval made in their names, because such a document would be a forged approval.
 * The tests therefore run acceptance under `TEST_APPROVAL_POLICY`, whose two authorities do not
 * exist and whose governance decision is not a decision. A record built here:
 *
 *   - is refused by `installStagedIdentity` and by the command line, which use the governed policy
 *     (the tests IAP-103 and IAP-122 assert exactly that);
 *   - is accepted only by `installStagedIdentityUnderPolicy` when a test passes this test policy;
 *   - lives in a temporary directory that the test removes.
 *
 * Nothing in `src/` or `scripts/` imports this file.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  IDENTITY_APPROVAL_POLICY,
  IDENTITY_APPROVAL_SCHEMA,
  approvalGenerationOf,
  approvalWithheldOf,
  type IdentityApprovalPolicy,
} from '../../src/identity/irr_identity_approval.js';
import type { StagedExport } from '../../src/identity/irr_identity_provisioning.js';

export const TEST_AUTHORITY_ONE = Object.freeze({
  authorityId: 'TEST_AUTHORITY_ONE',
  name: 'Fictitious Test Authority One',
  designation: 'Test Authority (does not exist)',
});
export const TEST_AUTHORITY_TWO = Object.freeze({
  authorityId: 'TEST_AUTHORITY_TWO',
  name: 'Fictitious Test Authority Two',
  designation: 'Test Authority (does not exist)',
});

/**
 * The governed policy with its authorities and its governance decision replaced by fictitious ones.
 * Everything else (scope, limitations, qualifications, prerequisites, the unresolved-authority
 * rule) is the governed policy's, so the tests exercise the governed rules.
 */
export const TEST_APPROVAL_POLICY: IdentityApprovalPolicy = Object.freeze({
  ...IDENTITY_APPROVAL_POLICY,
  policyVersion: 'TEST-POLICY-NOT-GOVERNED',
  governance: Object.freeze({
    decisionId: 'TEST-DECISION-NOT-A-GOVERNANCE-DECISION',
    decisionRecord: 'tests/support/not-a-decision-record.md',
  }),
  recognisedAuthorities: Object.freeze([TEST_AUTHORITY_ONE, TEST_AUTHORITY_TWO]),
  requiredAuthorities: Object.freeze({ status: 'UNRESOLVED' as const, questionRef: 'TEST-QUESTION' }),
});

/** A UTC time `offsetSeconds` from now, in the form an approval record states it. */
export function utc(offsetSeconds: number, from: Date = new Date()): string {
  return new Date(Math.floor(from.getTime() / 1000) * 1000 + offsetSeconds * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// The record is deliberately loosely typed: the tests break it in every way.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LooseApproval = Record<string, any>;

let serial = 0;

/**
 * A record that `TEST_APPROVAL_POLICY` accepts for the given staged export and gated IRR commit.
 * Approved one hour ago, lapsing in thirty days.
 */
export function testApprovalFor(staged: StagedExport, irrCommit: string, policy: IdentityApprovalPolicy = TEST_APPROVAL_POLICY): LooseApproval {
  serial += 1;
  const approvedAtUtc = utc(-3600);
  return {
    schemaVersion: IDENTITY_APPROVAL_SCHEMA,
    approvalId: `TEST-FIXTURE-NOT-AN-APPROVAL-${String(serial).padStart(4, '0')}`,
    status: 'APPROVED',
    governance: {
      decisionId: policy.governance.decisionId,
      decisionRecord: policy.governance.decisionRecord,
      approvalActRef: 'test fixture; no act of approval exists',
    },
    subject: {
      files: JSON.parse(JSON.stringify(staged.digests)),
      generation: approvalGenerationOf(staged.report),
      irrCommit,
    },
    scope: { ...policy.scope },
    accepted: {
      exportLimitationCodes: staged.report.limitations.map((limitation) => limitation.code),
      additionalLimitationCodes: [...policy.additionalLimitationCodes],
      withheldRecords: approvalWithheldOf(staged.report),
    },
    qualifications: policy.qualificationIds.map((id) => ({ id, disposition: 'WAIVED', ref: 'test fixture' })),
    determinations: {
      cv22OptionC: {
        decisionRef: policy.cv22OptionC.decisionRef,
        applicability: 'DOES_NOT_APPLY',
        basisRef: 'test fixture; no determination exists',
        prerequisites: policy.cv22OptionC.prerequisiteIds.map((id) => ({ id, determination: 'NOT_APPLICABLE', evidenceRef: '' })),
      },
      irrRosterContentDecision: {
        decisionRef: policy.irrRosterContentDecision.decisionRef,
        applicability: 'DOES_NOT_APPLY',
        basisRef: 'test fixture; no determination exists',
      },
    },
    approvals: policy.recognisedAuthorities.map((authority) => ({
      authorityId: authority.authorityId,
      name: authority.name,
      designation: authority.designation,
      decision: 'APPROVED',
      approvedAtUtc,
      statement: 'test fixture; nobody approved anything',
    })),
    approvedAtUtc,
    expiresAtUtc: utc(30 * 24 * 3600),
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
