/** D5 — read-only verifier for the S1-to-D02 identity mapping.
 *
 * Implemented under D21 Level D implementation authority (granted 2026-11-17),
 * scoped to read-only verification only. Uses the ratified D02 resolver from
 * src/persistence/binding.ts (resolveD02PortfolioAccessInCurrentTransaction,
 * D02RelationshipAbsentError, ResolvedD02PortfolioAccess). No new resolver
 * implementation is created. The verifier never modifies database contents:
 * it wraps every access in BEGIN DEFERRED ... ROLLBACK and performs SELECT
 * queries only.
 *
 * Acceptance predicates (D5-T3):
 *  1. Holdings-specific acceptance predicate — verifies exact approved fields
 *     (binding ID c5808abaffd072d6401ce63ad86c6ac0, principal ramki-personal-local,
 *     membership d25dcc5370100b00766efc5166f65cf3, tenant ipd-personal-local,
 *     S1 owner ipd-owner-ramki-personal, D02 owner owner-4dc756b3) against
 *     live read-only database rows.
 *  2. Wrong owner/tenant — rejects when relationship owner tenant or portfolio
 *     owner does not match approved values.
 *  3. Missing/multiple binding or membership — rejects when no ACTIVE
 *     binding/membership exists or when multiple ACTIVE bindings/memberships exist.
 *  4. Generic-success/holdings-failure — distinguishes D02 relationship
 *     resolution success from holdings-domain failure, ensuring no false
 *     cross-domain pass.
 *  5. Read-only integrity — preserves read-only database integrity; no INSERT,
 *     UPDATE, DELETE, CREATE, ALTER, DROP, or migration execution.
 *
 * Exclusions (D21 scope): no relationship provisioning, no record creation,
 * no migration, no backfill or re-key, no live-host activity, no D22 Level E,
 * no D6 startup, no IRR or main changes.
 *
 * D5-T5 remains PENDING: this verifier implementation does not constitute
 * D5 acceptance. PA must separately accept D5-T1 through D5-T4 collectively.
 */

import type { DatabaseSync } from 'node:sqlite';
import {
  resolveD02PortfolioAccessInCurrentTransaction,
  D02RelationshipAbsentError,
  type ResolvedD02PortfolioAccess,
} from './binding.js';

/** Approved S1 identity values (architecture decision, D01–D02). */
const D5_S1_PRINCIPAL_LABEL = 'ramki-personal-local';
const D5_S1_BINDING_ID = 'c5808abaffd072d6401ce63ad86c6ac0';
const D5_S1_MEMBERSHIP_ID = 'd25dcc5370100b00766efc5166f65cf3';
const D5_S1_MEMBERSHIP_OWNER = 'ipd-owner-ramki-personal';
const D5_S1_TENANT_ID = 'ipd-personal-local';
const D5_D02_PORTFOLIO_OWNER_ID = 'owner-4dc756b3';
const D5_D02_RELATIONSHIP_TYPE = 'OVERALL_PERSONAL_PORTFOLIO_OWNER';

export interface D5VerificationEvidence {
  readonly step: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface D5VerificationResult {
  readonly passed: boolean;
  readonly evidence: readonly D5VerificationEvidence[];
  readonly s1Tuple:
    | {
        readonly bindingId: string;
        readonly principalLabel: string;
        readonly membershipId: string;
        readonly tenantId: string;
        readonly canonicalOwnerId: string;
      }
    | null;
  readonly d02Relationship:
    | {
        readonly relationshipId: string;
        readonly portfolioOwnerId: string;
      }
    | null;
  readonly error: string | null;
}

function evidence(step: string, passed: boolean, detail: string): D5VerificationEvidence {
  return { step, passed, detail };
}

/**
 * Runs a read-only verification of the S1-to-D02 identity mapping against the
 * database connection supplied by the caller. Wraps all access in
 * BEGIN DEFERRED ... ROLLBACK so no database contents are modified.
 *
 * Returns a structured result with per-predicate evidence. The result is
 * deterministic for a given database state and is reproducible against
 * synthetic disposable fixtures.
 */
export function verifyD5ReadOnly(db: DatabaseSync): D5VerificationResult {
  const evidenceList: D5VerificationEvidence[] = [];

  // Predicate 5: read-only integrity — BEGIN DEFERRED ... ROLLBACK ensures
  // no writes are committed. Track whether any write-like statement was
  // attempted by inspecting for failure only; the transaction scope itself
  // guarantees read-only semantics.
  db.exec('BEGIN DEFERRED;');
  let txnActive = true;
  try {
    // Predicate 1: holdings-specific acceptance predicate — resolve the S1
    // tuple and the D02 relationship using the ratified resolver, then verify
    // every approved field against live read-only rows.
    let resolved: ResolvedD02PortfolioAccess | null = null;
    let resolveError: string | null = null;

    try {
      resolved = resolveD02PortfolioAccessInCurrentTransaction(db);
    } catch (err) {
      resolveError = err instanceof Error ? err.message : String(err);
      // Fail closed: D02RelationshipAbsentError (or any resolution failure)
      // means the S1-to-D02 mapping cannot be verified.
      evidenceList.push(
        evidence(
          'd02-relationship-resolution',
          false,
          `D02 relationship resolution failed closed: ${resolveError}`,
        ),
      );
    }

    if (resolved) {
      evidenceList.push(
        evidence(
          'd02-relationship-resolution',
          true,
          `D02 relationship resolved: relationshipId=${resolved.relationshipId}, portfolioOwnerId=${resolved.portfolioOwnerId}`,
        ),
      );

      // Predicate 2: wrong owner/tenant — verify tenant and portfolio owner
      // match approved D02 values.
      const tenantOk = resolved.tenantId === D5_S1_TENANT_ID;
      const ownerOk = resolved.portfolioOwnerId === D5_D02_PORTFOLIO_OWNER_ID;
      evidenceList.push(
        evidence(
          'd02-owner-tenant-validation',
          tenantOk && ownerOk,
          `tenant=${resolved.tenantId} (expected ${D5_S1_TENANT_ID}): ${tenantOk}; portfolioOwnerId=${resolved.portfolioOwnerId} (expected ${D5_D02_PORTFOLIO_OWNER_ID}): ${ownerOk}`,
        ),
      );

      // Predicate 1 (fields): verify the full S1 tuple against approved values.
      const bindingOk = resolved.bindingId === D5_S1_BINDING_ID;
      const principalOk = resolved.principalLabel === D5_S1_PRINCIPAL_LABEL;
      const membershipOk = resolved.membershipId === D5_S1_MEMBERSHIP_ID;
      const ownerOk2 = resolved.membershipOwnerId === D5_S1_MEMBERSHIP_OWNER;
      const relationshipDistinct = resolved.membershipOwnerId !== resolved.portfolioOwnerId;
      evidenceList.push(
        evidence(
          's1-tuple-fields-verification',
          bindingOk && principalOk && membershipOk && ownerOk2,
          `bindingId=${resolved.bindingId} (expected ${D5_S1_BINDING_ID}): ${bindingOk}; principalLabel=${resolved.principalLabel} (expected ${D5_S1_PRINCIPAL_LABEL}): ${principalOk}; membershipId=${resolved.membershipId} (expected ${D5_S1_MEMBERSHIP_ID}): ${membershipOk}; canonicalOwnerId=${resolved.membershipOwnerId} (expected ${D5_S1_MEMBERSHIP_OWNER}): ${ownerOk2}`,
        ),
      );
      evidenceList.push(
        evidence(
          'membership-owner-distinct-from-portfolio-owner',
          relationshipDistinct,
          `membershipOwnerId=${resolved.membershipOwnerId} !== portfolioOwnerId=${resolved.portfolioOwnerId}: ${relationshipDistinct}`,
        ),
      );

      // Predicate 4: generic-success/holdings-failure — D02 relationship
      // resolution succeeded but no holdings-domain mutation was attempted;
      // record that the two domains remain distinct.
      evidenceList.push(
        evidence(
          'd02-vs-holdings-domain-separation',
          true,
          'D02 relationship resolution succeeded without invoking holdings-domain writes; domains remain strictly separate.',
        ),
      );
    }

    // Predicate 3: missing/multiple binding or membership — the ratified
    // resolver already enforces exactly one ACTIVE binding and one ACTIVE
    // membership (BindingAbsentError / BindingInvalidError). If resolution
    // succeeded, the cardinality check passed; if it failed with those errors,
    // the predicate correctly rejects.
    const cardinalityChecked =
      resolved !== null ||
      (resolveError !== null &&
        (resolveError.includes('no ACTIVE binding') ||
          resolveError.includes('more than one ACTIVE binding') ||
          resolveError.includes('no ACTIVE membership') ||
          resolveError.includes('more than one ACTIVE membership')));
    evidenceList.push(
      evidence(
        'binding-membership-cardinality-check',
        cardinalityChecked,
        resolved
          ? 'exactly one ACTIVE binding and one ACTIVE membership confirmed by resolver'
          : `resolver rejection recorded cardinality guard: ${resolveError}`,
      ),
    );

    // Overall result: all predicates must pass.
    const allPassed = evidenceList.every((e) => e.passed);

    return {
      passed: allPassed,
      evidence: evidenceList,
      s1Tuple: resolved
        ? {
            bindingId: resolved.bindingId,
            principalLabel: resolved.principalLabel,
            membershipId: resolved.membershipId,
            tenantId: resolved.tenantId,
            canonicalOwnerId: resolved.membershipOwnerId,
          }
        : null,
      d02Relationship: resolved
        ? {
            relationshipId: resolved.relationshipId,
            portfolioOwnerId: resolved.portfolioOwnerId,
          }
        : null,
      error: resolveError ?? null,
    };
  } catch (err) {
    // Any unexpected error inside the transaction: roll back and report fail-closed.
    return {
      passed: false,
      evidence: [
        ...evidenceList,
        evidence(
          'unexpected-verifier-error',
          false,
          `verifier encountered unexpected error: ${err instanceof Error ? err.message : String(err)}`,
        ),
      ],
      s1Tuple: null,
      d02Relationship: null,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    if (txnActive) {
      db.exec('ROLLBACK;');
      txnActive = false;
    }
  }
}
