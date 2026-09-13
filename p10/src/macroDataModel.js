/**
 * P10-03 — D08 MACROECONOMIC DATA CANONICAL MODEL
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   `P01_SCHEMA_CATALOG.md` D08; `P01_FIELD_DICTIONARY.md` §10.
 *   Authorized by **P10 Entry Authorization Adjudication**.
 *
 * ── D08 field contract ─────────────────────────────────────────────────────────────────────
 *   | Canonical key                    | Req. | Type | Cur/Unit            | PIT |
 *   |----------------------------------|------|------|-----------------------|-----|
 *   | <NS>macro.seriesId               | R    | id   | —                     | Yes |
 *   | <NS>macro.value                  | R    | dec  | unitOfMeasure REQUIRED| Yes |
 *   | <NS>macro.unitOfMeasure          | R    | enum | index/percent/level/rate | Yes |
 *   | <NS>macro.frequency              | R    | enum | —                     | Yes |
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **MD-1** PIT is MANDATORY — macro series are heavily revised.
 *   ⚠ **MD-2** Identity is NOT instrument-keyed — requires its own series identity.
 *     Explicitly NOT companyId and NOT an instrument IdentityRef.
 *   ⚠ **MD-3** Vintage is first-class — each revision is a new vintage.
 *   ⚠ **MD-4** unitOfMeasure is REQUIRED (index, percent, level, rate).
 *   ⚠ **MD-5** No live provider execution. LOCAL_FIXTURE only.
 *   ⚠ **MD-6** No wall clock, no randomness, no ambient input.
 *
 * ── Reuse ─────────────────────────────────────────────────────────────────────────────────
 *   buildSnapshot, buildField from p05.
 */

import {
  buildSnapshot, buildField, QUALITY, AVAILABILITY, MODES, deepFreeze,
} from '../../p05/src/contract.js';
import { NAMESPACE_TOKEN, buildKey, NAMESPACE_VERSION } from '../../p05/src/namespace.js';
import { assertIsoUtc, canonicalDecimal, ContractViolation } from '../../p05/src/serialize.js';

export const P10_03_MODULE = 'P10-03-MACRO-DATA-MODEL';
export const MACRO_SEGMENT = 'macro';
export const MACRO_DOMAIN = 'D08';

/** MD-4 — CLOSED unit of measure set. */
export const UNITS_OF_MEASURE = Object.freeze([
  'index', 'percent', 'level', 'rate', 'currency', 'count',
]);

/** MD-3 — CLOSED frequency set. */
export const FREQUENCIES = Object.freeze([
  'daily', 'weekly', 'monthly', 'quarterly', 'semi-annual', 'annual',
]);

export function macroKey(fieldSegment) {
  return buildKey(MACRO_SEGMENT, fieldSegment);
}

/**
 * MD-2 — Build a series identity. NOT companyId, NOT instrument IdentityRef.
 */
export function buildSeriesIdentity(seriesId, region) {
  if (typeof seriesId !== 'string' || seriesId.length === 0) {
    throw new ContractViolation(['MD-2'],
      'seriesId must be a non-empty string — NOT companyId, NOT instrument identity',
      { seriesId });
  }
  return Object.freeze({
    seriesId,
    ...(region !== undefined ? { region } : {}),
    identityType: 'macro-series',
  });
}

/**
 * MD-2 — Assert that a macro snapshot does NOT use instrument/company identity.
 */
export function assertSeriesIdentityDistinct(identity) {
  const violations = [];
  if (identity?.canonicalSecurityId !== undefined) {
    violations.push('MD-2: macro must NOT use canonicalSecurityId — use seriesId');
  }
  if (identity?.mappedCompanyId !== undefined) {
    violations.push('MD-2: macro must NOT use mappedCompanyId — use seriesId');
  }
  if (identity?.companyId !== undefined) {
    violations.push('MD-2: macro must NOT use companyId — use seriesId');
  }
  if (identity?.seriesId === undefined) {
    violations.push('MD-2: macro requires seriesId in identity');
  }
  return Object.freeze({
    valid: violations.length === 0,
    violations: Object.freeze(violations),
  });
}

/**
 * MD-4 — Build the required unitOfMeasure field.
 */
export function buildUnitOfMeasureField(unit, provenance) {
  if (!UNITS_OF_MEASURE.includes(unit)) {
    throw new ContractViolation(['MD-4'],
      `unitOfMeasure '${unit}' is not in the closed set ${UNITS_OF_MEASURE.join('|')}`,
      { unit });
  }
  return buildField({
    key: macroKey('unitOfMeasure'),
    dataType: 'enum',
    availability: 'PRESENT',
    provenance,
    pitEligible: true,
    value: unit,
    monetary: 'no',
    dimension: 'dimensionless',
  });
}

/**
 * MD-3 — Build the required frequency field.
 */
export function buildFrequencyField(frequency, provenance) {
  if (!FREQUENCIES.includes(frequency)) {
    throw new ContractViolation(['MD-3'],
      `frequency '${frequency}' is not in the closed set ${FREQUENCIES.join('|')}`,
      { frequency });
  }
  return buildField({
    key: macroKey('frequency'),
    dataType: 'enum',
    availability: 'PRESENT',
    provenance,
    pitEligible: true,
    value: frequency,
    monetary: 'no',
    dimension: 'dimensionless',
  });
}

/**
 * MD-1/MD-3 — Build a macro value field with vintage-aware effective/publication times.
 */
export function buildMacroValueField(value, effectiveTime, publicationTime, precision, unit, provenance) {
  assertIsoUtc(effectiveTime, 'macro value effectiveTime');
  assertIsoUtc(publicationTime, 'macro value publicationTime');

  return buildField({
    key: macroKey('value'),
    dataType: 'decimal',
    availability: 'PRESENT',
    provenance,
    pitEligible: true,
    value: canonicalDecimal(value, precision),
    precision,
    unit,
    effectiveTime, publicationTime,
    monetary: 'no',
    dimension: 'dimensioned',
  });
}

/**
 * MD-1 — Build a D08 macro data snapshot.
 */
export function buildMacroSnapshot(args) {
  const {
    provider, dataVersion, schemaVersion, asOf, receivedAt,
    pitBoundary, quality, completenessPct,
    identity, lineage, fields,
  } = args;

  if (pitBoundary === undefined) {
    throw new ContractViolation(['MD-1', 'ST-5'],
      'macro snapshot requires pitBoundary — PIT is mandatory for D08', { provider });
  }

  // MD-2 — identity must be series identity
  const idCheck = assertSeriesIdentityDistinct(identity);
  if (!idCheck.valid) {
    throw new ContractViolation(['MD-2', 'RF-9'],
      `macro identity violation: ${idCheck.violations.join('; ')}`, { identity });
  }

  return buildSnapshot({
    provider, dataVersion, schemaVersion, asOf, receivedAt,
    mode: 'PIT', pitBoundary,
    quality, completenessPct,
    domain: MACRO_DOMAIN,
    identity,
    lineage, fields,
  });
}

/**
 * Validate a D08 macro snapshot.
 */
export function validateMacroSnapshot(snapshot) {
  const findings = [];

  if (snapshot.mode !== 'PIT') {
    findings.push('MD-1: mode must be PIT for macro');
  }
  if (snapshot.pitBoundary === undefined) {
    findings.push('MD-1: pitBoundary is required');
  }
  if (snapshot.domain !== MACRO_DOMAIN) {
    findings.push(`MD-1: domain must be D08, got '${snapshot.domain}'`);
  }

  const fields = snapshot.fields ?? {};

  // Required fields
  for (const key of [macroKey('unitOfMeasure'), macroKey('frequency')]) {
    if (!fields[key]) {
      findings.push(`MD-4: required field '${key}' is missing`);
    }
  }

  // MD-2 — identity check
  const idCheck = assertSeriesIdentityDistinct(snapshot.identity ?? {});
  if (!idCheck.valid) {
    findings.push(...idCheck.violations);
  }

  // MD-4 — unitOfMeasure must be in closed set
  const uomField = fields[macroKey('unitOfMeasure')];
  if (uomField?.value && !UNITS_OF_MEASURE.includes(uomField.value)) {
    findings.push(`MD-4: unitOfMeasure '${uomField.value}' is not in the closed set`);
  }

  return Object.freeze({
    valid: findings.length === 0,
    findings: Object.freeze(findings),
    fieldCount: Object.keys(fields).length,
    module: P10_03_MODULE,
  });
}

export { NAMESPACE_TOKEN, NAMESPACE_VERSION, buildKey, QUALITY, AVAILABILITY, MODES, deepFreeze, assertIsoUtc, ContractViolation };
