/**
 * P10-04 — D09 ALTERNATIVE DATA CANONICAL MODEL
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   `P01_SCHEMA_CATALOG.md` D09; `P01_FIELD_DICTIONARY.md` §11.
 *   Authorized by **P10 Entry Authorization Adjudication**.
 *
 * ── D09 field contract ─────────────────────────────────────────────────────────────────────
 *   | Canonical key                    | Req. | Type | PIT          |
 *   |----------------------------------|------|------|--------------|
 *   | <NS>alt.datasetId                | R    | id   | Per dataset  |
 *   | <NS>alt.classification           | R    | enum | Per dataset  |
 *   | <NS>alt.region                   | R    | str  | Per dataset  |
 *   | <NS>alt.retentionDays            | R    | int  | Per dataset  |
 *   | <NS>alt.approvalRef              | R    | ref  | Per dataset  |
 *   | <NS>alt.<datasetField>           | C    | any  | Declared per dataset |
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **AD-1** REQUIREMENT MODE IS CONDITIONAL — "required by applicability" (OI-05).
 *   ⚠ **AD-2** OI-05 applicability criteria are UNDEFINED — fail closed where applicability
 *     cannot be established.
 *   ⚠ **AD-3** M-6: retention is NOT enforced by existing-IIPS. Recording `retentionDays` is
 *     NOT an enforcement claim. This module MUST NOT claim retention enforcement.
 *   ⚠ **AD-4** Governance classification via AD-11 — same closed set as D06.
 *   ⚠ **AD-5** approvalRef is REQUIRED — no ungoverned alternative data.
 *   ⚠ **AD-6** No live provider execution. LOCAL_FIXTURE only.
 *   ⚠ **AD-7** No wall clock, no randomness, no ambient input.
 *   ⚠ **AD-8** No acceptance, no certification, no production activation.
 *
 * ── Reuse ─────────────────────────────────────────────────────────────────────────────────
 *   buildSnapshot, buildField from p05.
 */

import {
  buildSnapshot, buildField, QUALITY, AVAILABILITY, MODES, deepFreeze,
} from '../../p05/src/contract.js';
import { NAMESPACE_TOKEN, buildKey, NAMESPACE_VERSION } from '../../p05/src/namespace.js';
import { assertIsoUtc, ContractViolation } from '../../p05/src/serialize.js';

export const P10_04_MODULE = 'P10-04-ALTERNATIVE-DATA-MODEL';
export const ALT_SEGMENT = 'alt';
export const ALT_DOMAIN = 'D09';

/** AD-4 — CLOSED governance classifications (AD-11, same as D06). */
export const GOVERNANCE_CLASSIFICATIONS = Object.freeze([
  'public', 'internal', 'confidential', 'restricted',
]);

/**
 * AD-2 — Applicability status.
 * OI-05 applicability criteria are UNDEFINED. This enum tracks whether
 * applicability has been explicitly established.
 */
export const APPLICABILITY = Object.freeze([
  'ESTABLISHED',   // Applicability explicitly established by authority
  'UNDEFINED',     // OI-05 — applicability criteria undefined
  'NOT_APPLICABLE', // Explicitly not applicable
]);

export function altKey(fieldSegment) {
  return buildKey(ALT_SEGMENT, fieldSegment);
}

/**
 * AD-2 — Assert applicability before admitting alternative data.
 * Fail closed where applicability cannot be established.
 */
export function assertApplicability(applicability) {
  if (!APPLICABILITY.includes(applicability)) {
    throw new ContractViolation(['AD-2', 'OI-05'],
      `applicability '${applicability}' is not in the closed set ${APPLICABILITY.join('|')}`,
      { applicability });
  }
  if (applicability === 'UNDEFINED') {
    throw new ContractViolation(['AD-2', 'OI-05'],
      'alternative data admission FAILS CLOSED when applicability is UNDEFINED (OI-05) — ' +
      'applicability criteria must be explicitly established before admission',
      { applicability });
  }
  if (applicability === 'NOT_APPLICABLE') {
    throw new ContractViolation(['AD-2'],
      'alternative data admission FAILS CLOSED when applicability is NOT_APPLICABLE',
      { applicability });
  }
  return true;
}

/**
 * AD-3 — Build the retentionDays field.
 * ⚠ Records the value but does NOT claim enforcement.
 * M-6: isWithinRetention() is a stub in existing-IIPS.
 */
export function buildRetentionDaysField(retentionDays, provenance) {
  if (!Number.isInteger(retentionDays) || retentionDays < 0) {
    throw new ContractViolation(['AD-3'],
      `retentionDays must be a non-negative integer, got ${retentionDays}`, { retentionDays });
  }
  return buildField({
    key: altKey('retentionDays'),
    dataType: 'integer',
    availability: 'PRESENT',
    provenance,
    pitEligible: true,
    value: retentionDays,
    monetary: 'no',
    dimension: 'dimensionless',
  });
}

/**
 * AD-4 — Build the governance classification field.
 */
export function buildAltClassificationField(classification, provenance) {
  if (!GOVERNANCE_CLASSIFICATIONS.includes(classification)) {
    throw new ContractViolation(['AD-4', 'AD-11'],
      `classification '${classification}' is not in the closed set`,
      { classification });
  }
  return buildField({
    key: altKey('classification'),
    dataType: 'enum',
    availability: 'PRESENT',
    provenance,
    pitEligible: true,
    value: classification,
    monetary: 'no',
    dimension: 'dimensionless',
  });
}

/**
 * AD-5 — Build the required approvalRef field.
 */
export function buildApprovalRefField(approvalRef, provenance) {
  if (typeof approvalRef !== 'string' || approvalRef.length === 0) {
    throw new ContractViolation(['AD-5'],
      'approvalRef must be a non-empty string — no ungoverned alternative data',
      { approvalRef });
  }
  return buildField({
    key: altKey('approvalRef'),
    dataType: 'identifier',
    availability: 'PRESENT',
    provenance,
    pitEligible: true,
    value: approvalRef,
    monetary: 'no',
    dimension: 'dimensionless',
  });
}

/**
 * AD-1/AD-2 — Build a D09 alternative data snapshot.
 * Fails closed if applicability is not established.
 */
export function buildAlternativeDataSnapshot(args) {
  const {
    provider, dataVersion, schemaVersion, asOf, receivedAt,
    quality, completenessPct,
    identity, lineage, fields,
    applicability,
  } = args;

  // AD-2 — fail closed if applicability not established
  assertApplicability(applicability);

  // AD-4 — classification must be present
  const classKey = altKey('classification');
  if (!fields[classKey]) {
    throw new ContractViolation(['AD-4', 'AD-11'],
      'governance classification field is REQUIRED for D09 alternative data');
  }

  // AD-5 — approvalRef must be present
  const approvalKey = altKey('approvalRef');
  if (!fields[approvalKey]) {
    throw new ContractViolation(['AD-5'],
      'approvalRef field is REQUIRED for D09 alternative data');
  }

  // D09 PIT is dataset-dependent — mode may be PIT or SNAPSHOT
  const mode = args.pitBoundary !== undefined ? 'PIT' : 'SNAPSHOT';

  return buildSnapshot({
    provider, dataVersion, schemaVersion, asOf, receivedAt,
    mode,
    ...(args.pitBoundary !== undefined ? { pitBoundary: args.pitBoundary } : {}),
    quality, completenessPct,
    domain: ALT_DOMAIN,
    identity,
    lineage, fields,
  });
}

/**
 * AD-3 — Explicit statement that retention enforcement is NOT claimed.
 */
export const RETENTION_ENFORCEMENT_CLAIM = Object.freeze({
  enforced: false,
  reason: 'M-6: isWithinRetention() is a stub in existing-IIPS. ' +
    'Recording retentionDays is NOT an enforcement claim. ' +
    'Retention enforcement remains OPEN.',
  m6Status: 'OPEN',
  module: P10_04_MODULE,
});

/**
 * Validate a D09 alternative data snapshot.
 */
export function validateAlternativeDataSnapshot(snapshot) {
  const findings = [];

  if (snapshot.domain !== ALT_DOMAIN) {
    findings.push(`AD-1: domain must be D09, got '${snapshot.domain}'`);
  }

  const fields = snapshot.fields ?? {};

  // Required fields
  for (const key of [altKey('classification'), altKey('approvalRef'), altKey('retentionDays')]) {
    if (!fields[key]) {
      findings.push(`AD-4/5: required field '${key}' is missing`);
    }
  }

  // AD-4 — classification must be in closed set
  const classField = fields[altKey('classification')];
  if (classField?.value && !GOVERNANCE_CLASSIFICATIONS.includes(classField.value)) {
    findings.push(`AD-4: classification '${classField.value}' is not in the closed set`);
  }

  // AD-3 — retention enforcement NOT claimed
  // This is verified by the RETENTION_ENFORCEMENT_CLAIM constant, not per-snapshot

  return Object.freeze({
    valid: findings.length === 0,
    findings: Object.freeze(findings),
    retentionEnforcementClaimed: false,
    fieldCount: Object.keys(fields).length,
    module: P10_04_MODULE,
  });
}

export { NAMESPACE_TOKEN, NAMESPACE_VERSION, buildKey, QUALITY, AVAILABILITY, MODES, deepFreeze, assertIsoUtc, ContractViolation };
