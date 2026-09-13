/**
 * P10-02 — D07 ANALYST ESTIMATES / CONSENSUS CANONICAL MODEL
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   `P01_SCHEMA_CATALOG.md` D07; `P01_FIELD_DICTIONARY.md` §9.
 *   Authorized by **P10 Entry Authorization Adjudication**.
 *
 * ── D07 field contract ─────────────────────────────────────────────────────────────────────
 *   | Canonical key                              | Req. | Type | Cur/Unit          | PIT |
 *   |--------------------------------------------|------|------|-------------------|-----|
 *   | <NS>estimates.metricRef                    | R    | id   | —                 | Yes |
 *   | <NS>estimates.consensusMean/.median/.high/.low | C | dec | currency where monetary | Yes |
 *   | <NS>estimates.estimateCount                | R    | int  | dimensionless     | Yes |
 *   | <NS>estimates.revisionSeq                  | R    | int  | —                 | Yes |
 *   | <NS>estimates.forecastPeriod               | R    | enum | —                 | Yes |
 *   | <NS>estimates.priceTarget                  | O    | dec  | currency+precision| Yes |
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **EC-1** PIT is MANDATORY — consensus is inherently revision-bearing.
 *   ⚠ **EC-2** revisionSeq is REQUIRED and monotonically increasing.
 *   ⚠ **EC-3** Publication time and effective time (forecast period) both REQUIRED.
 *   ⚠ **EC-4** Collision surface: peRatio/evEbitda/evRevenue are free-form shared engine keys.
 *     Estimate-derived values MUST be namespaced (MD:estimates.*), NEVER merged by name.
 *   ⚠ **EC-5** Feeds D03 valuation pillars via mapping rules — P11 owns the mapping.
 *   ⚠ **EC-6** No engine-input mapping — that is P11 (N-5).
 *   ⚠ **EC-7** No live provider execution. LOCAL_FIXTURE only.
 *   ⚠ **EC-8** No wall clock, no randomness, no ambient input.
 *
 * ── Reuse ─────────────────────────────────────────────────────────────────────────────────
 *   buildSnapshot, buildField, canonicalDecimal from p05.
 */

import {
  buildSnapshot, buildField, QUALITY, AVAILABILITY, MODES, deepFreeze,
} from '../../p05/src/contract.js';
import { NAMESPACE_TOKEN, buildKey, NAMESPACE_VERSION } from '../../p05/src/namespace.js';
import { assertIsoUtc, canonicalDecimal, ContractViolation } from '../../p05/src/serialize.js';

export const P10_02_MODULE = 'P10-02-ESTIMATES-CONSENSUS-MODEL';
export const ESTIMATES_SEGMENT = 'estimates';
export const ESTIMATES_DOMAIN = 'D07';

/** EC-2 — CLOSED forecast periods. */
export const FORECAST_PERIODS = Object.freeze([
  'Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', 'FY', 'NTM', 'LTM',
]);

/** EC-4 — Engine key collision surface (D4_02 §D.8). */
export const ENGINE_COLLISION_KEYS = Object.freeze([
  'peRatio', 'evEbitda', 'evRevenue',
]);

export function estimatesKey(fieldSegment) {
  return buildKey(ESTIMATES_SEGMENT, fieldSegment);
}

/**
 * EC-1/EC-3 — Build an estimates consensus field with both times.
 */
export function buildConsensusField(args) {
  const {
    name, value, availability, effectiveTime, publicationTime,
    provenance, currency, precision,
  } = args;

  if (typeof effectiveTime !== 'string') {
    throw new ContractViolation(['EC-3'],
      `estimates field '${name}' requires effectiveTime (forecast period)`, { name });
  }
  if (typeof publicationTime !== 'string') {
    throw new ContractViolation(['EC-3'],
      `estimates field '${name}' requires publicationTime`, { name });
  }
  assertIsoUtc(effectiveTime, `estimates '${name}' effectiveTime`);
  assertIsoUtc(publicationTime, `estimates '${name}' publicationTime`);

  const key = estimatesKey(name);
  let resolvedValue = value;
  let dataType = 'decimal';

  if (availability === 'PRESENT' && precision !== undefined) {
    resolvedValue = canonicalDecimal(value, precision);
  }

  return buildField({
    key, dataType, availability, provenance,
    pitEligible: true,
    value: resolvedValue,
    ...(currency !== undefined ? { currency } : {}),
    ...(precision !== undefined ? { precision } : {}),
    effectiveTime, publicationTime,
    monetary: currency !== undefined ? 'yes' : 'no',
    dimension: currency !== undefined ? 'dimensioned' : 'dimensionless',
  });
}

/**
 * EC-2 — Build the required revisionSeq field.
 */
export function buildRevisionSeqField(revisionSeq, publicationTime, provenance) {
  if (!Number.isInteger(revisionSeq) || revisionSeq < 0) {
    throw new ContractViolation(['EC-2'],
      `revisionSeq must be a non-negative integer, got ${revisionSeq}`, { revisionSeq });
  }
  assertIsoUtc(publicationTime, 'revisionSeq publicationTime');
  return buildField({
    key: estimatesKey('revisionSeq'),
    dataType: 'integer',
    availability: 'PRESENT',
    provenance,
    pitEligible: true,
    value: revisionSeq,
    publicationTime,
    monetary: 'no',
    dimension: 'dimensionless',
  });
}

/**
 * EC-2 — Build the required forecastPeriod field.
 */
export function buildForecastPeriodField(forecastPeriod, effectiveTime, provenance) {
  if (!FORECAST_PERIODS.includes(forecastPeriod)) {
    throw new ContractViolation(['EC-2'],
      `forecastPeriod '${forecastPeriod}' is not in the closed set ${FORECAST_PERIODS.join('|')}`,
      { forecastPeriod });
  }
  return buildField({
    key: estimatesKey('forecastPeriod'),
    dataType: 'enum',
    availability: 'PRESENT',
    provenance,
    pitEligible: true,
    value: forecastPeriod,
    effectiveTime,
    monetary: 'no',
    dimension: 'dimensionless',
  });
}

/**
 * EC-2 — Build the required estimateCount field.
 */
export function buildEstimateCountField(estimateCount, effectiveTime, publicationTime, provenance) {
  if (!Number.isInteger(estimateCount) || estimateCount < 0) {
    throw new ContractViolation(['EC-2'],
      `estimateCount must be a non-negative integer, got ${estimateCount}`, { estimateCount });
  }
  return buildField({
    key: estimatesKey('estimateCount'),
    dataType: 'integer',
    availability: 'PRESENT',
    provenance,
    pitEligible: true,
    value: estimateCount,
    effectiveTime, publicationTime,
    monetary: 'no',
    dimension: 'dimensionless',
  });
}

/**
 * EC-1 — Build a D07 estimates/consensus snapshot.
 */
export function buildEstimatesSnapshot(args) {
  const {
    provider, dataVersion, schemaVersion, asOf, receivedAt,
    pitBoundary, quality, completenessPct,
    identity, identityMappingVersion, lineage, fields,
  } = args;

  if (pitBoundary === undefined) {
    throw new ContractViolation(['EC-1', 'ST-5'],
      'estimates snapshot requires pitBoundary — PIT is mandatory for D07', { provider });
  }

  return buildSnapshot({
    provider, dataVersion, schemaVersion, asOf, receivedAt,
    mode: 'PIT', pitBoundary,
    quality, completenessPct,
    domain: ESTIMATES_DOMAIN,
    identity,
    ...(identityMappingVersion !== undefined ? { identityMappingVersion } : {}),
    lineage, fields,
  });
}

/**
 * EC-4 — Detect engine key collision surface.
 */
export function findEstimatesEngineCollisions(fields) {
  const offenders = [];
  for (const key of Object.keys(fields)) {
    const parts = key.replace(NAMESPACE_TOKEN, '').split('.');
    if (parts.length === 2 && parts[0] === ESTIMATES_SEGMENT) {
      if (ENGINE_COLLISION_KEYS.includes(parts[1])) {
        offenders.push(parts[1]);
      }
    }
  }
  return offenders.sort();
}

/**
 * Validate a D07 estimates/consensus snapshot.
 */
export function validateEstimatesSnapshot(snapshot) {
  const findings = [];

  if (snapshot.mode !== 'PIT') {
    findings.push('EC-1: mode must be PIT for estimates');
  }
  if (snapshot.pitBoundary === undefined) {
    findings.push('EC-1: pitBoundary is required');
  }
  if (snapshot.domain !== ESTIMATES_DOMAIN) {
    findings.push(`EC-1: domain must be D07, got '${snapshot.domain}'`);
  }

  const fields = snapshot.fields ?? {};
  const requiredKeys = [
    estimatesKey('revisionSeq'), estimatesKey('forecastPeriod'), estimatesKey('estimateCount'),
  ];
  for (const key of requiredKeys) {
    if (!fields[key]) {
      findings.push(`EC-2: required field '${key}' is missing`);
    }
  }

  // EC-2 — revisionSeq must be non-negative integer
  const rsField = fields[estimatesKey('revisionSeq')];
  if (rsField?.value !== undefined && rsField.value !== null) {
    if (!Number.isInteger(rsField.value) || rsField.value < 0) {
      findings.push(`EC-2: revisionSeq must be non-negative integer, got ${rsField.value}`);
    }
  }

  // EC-2 — forecastPeriod must be in closed set
  const fpField = fields[estimatesKey('forecastPeriod')];
  if (fpField?.value && !FORECAST_PERIODS.includes(fpField.value)) {
    findings.push(`EC-2: forecastPeriod '${fpField.value}' is not in the closed set`);
  }

  // EC-4 — collision detection (informational)
  const collisions = findEstimatesEngineCollisions(fields);

  return Object.freeze({
    valid: findings.length === 0,
    findings: Object.freeze(findings),
    engineCollisionSurface: Object.freeze(collisions),
    fieldCount: Object.keys(fields).length,
    module: P10_02_MODULE,
  });
}

export { NAMESPACE_TOKEN, NAMESPACE_VERSION, buildKey, QUALITY, AVAILABILITY, MODES, deepFreeze, assertIsoUtc, ContractViolation };
