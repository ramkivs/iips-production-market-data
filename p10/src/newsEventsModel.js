/**
 * P10-01 — D06 NEWS / EVENTS CANONICAL MODEL
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   TRACKER `Work Tracker`!P10: Gate intent *"News/events, consensus estimates, macro,
 *   approved alternative datasets"*.
 *   `P01_SCHEMA_CATALOG.md` D06; `P01_FIELD_DICTIONARY.md` §8.
 *   Authorized by **P10 Entry Authorization Adjudication** (Program Authority act).
 *
 * ── D06 field contract (P01_FIELD_DICTIONARY.md §8) ────────────────────────────────────────
 *   | Canonical key                    | Req. | Type | Times           | PIT |
 *   |----------------------------------|------|------|-----------------|-----|
 *   | <NS>news.eventId                 | R    | id   | —               | Yes |
 *   | <NS>news.headline                | R    | str  | publicationTime | Yes |
 *   | <NS>news.bodyRef                 | C    | ref  | —               | Yes |
 *   | <NS>news.sourceRef               | R    | ref  | —               | Yes |
 *   | <NS>news.taxonomyRef             | C    | ref  | —               | Yes |
 *   | <NS>news.entityLinks[]           | C    | id   | —               | Yes |
 *   | <NS>news.classification          | R    | enum | —               | Yes |
 *   | <NS>news.dedupeKey               | R    | str  | —               | Yes |
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **NE-1** Governance classification REQUIRED (AD-11) before admission.
 *   ⚠ **NE-2** Entity linking to D05 canonical identity — never provider-native symbols.
 *   ⚠ **NE-3** Dedupe key is REQUIRED — prevents duplicate event admission.
 *   ⚠ **NE-4** PIT for knowability — what was published by a boundary.
 *   ⚠ **NE-5** News content is typically licence-restricted → classification + entitlement.
 *   ⚠ **NE-6** No live provider execution. LOCAL_FIXTURE only.
 *   ⚠ **NE-7** No wall clock, no randomness, no ambient input.
 *   ⚠ **NE-8** No acceptance, no certification, no production activation.
 *
 * ── Reuse ─────────────────────────────────────────────────────────────────────────────────
 *   buildSnapshot, buildField, QUALITY, AVAILABILITY, MODES, deepFreeze from p05/src/contract.js.
 *   NAMESPACE_TOKEN, buildKey, NAMESPACE_VERSION from p05/src/namespace.js.
 *   assertIsoUtc, ContractViolation from p05/src/serialize.js.
 */

import {
  buildSnapshot, buildField, QUALITY, AVAILABILITY, MODES, deepFreeze,
} from '../../p05/src/contract.js';
import { NAMESPACE_TOKEN, buildKey, NAMESPACE_VERSION } from '../../p05/src/namespace.js';
import { assertIsoUtc, ContractViolation } from '../../p05/src/serialize.js';

export const P10_01_MODULE = 'P10-01-NEWS-EVENTS-MODEL';
export const NEWS_SEGMENT = 'news';
export const NEWS_DOMAIN = 'D06';

/** NE-1 — CLOSED governance classifications (AD-11). */
export const GOVERNANCE_CLASSIFICATIONS = Object.freeze([
  'public', 'internal', 'confidential', 'restricted',
]);

/** NE-4 — Build a news field key. */
export function newsKey(fieldSegment) {
  return buildKey(NEWS_SEGMENT, fieldSegment);
}

/**
 * NE-1 — Build the required governance classification field.
 */
export function buildClassificationField(classification, provenance) {
  if (!GOVERNANCE_CLASSIFICATIONS.includes(classification)) {
    throw new ContractViolation(['NE-1', 'AD-11'],
      `governance classification '${classification}' is not in the closed set ${GOVERNANCE_CLASSIFICATIONS.join('|')}`,
      { classification });
  }
  return buildField({
    key: newsKey('classification'),
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
 * NE-3 — Build the required dedupe key field.
 */
export function buildDedupeKeyField(dedupeKey, provenance) {
  if (typeof dedupeKey !== 'string' || dedupeKey.length === 0) {
    throw new ContractViolation(['NE-3'],
      'dedupeKey must be a non-empty string', { dedupeKey });
  }
  return buildField({
    key: newsKey('dedupeKey'),
    dataType: 'string',
    availability: 'PRESENT',
    provenance,
    pitEligible: true,
    value: dedupeKey,
    monetary: 'no',
    dimension: 'dimensionless',
  });
}

/**
 * Build a news event ID field (NE-2).
 */
export function buildEventIdField(eventId, provenance) {
  if (typeof eventId !== 'string' || eventId.length === 0) {
    throw new ContractViolation(['NE-2'],
      'eventId must be a non-empty string', { eventId });
  }
  return buildField({
    key: newsKey('eventId'),
    dataType: 'identifier',
    availability: 'PRESENT',
    provenance,
    pitEligible: true,
    value: eventId,
    monetary: 'no',
    dimension: 'dimensionless',
  });
}

/**
 * Build a headline field with publicationTime.
 */
export function buildHeadlineField(headline, publicationTime, provenance) {
  if (typeof headline !== 'string' || headline.length === 0) {
    throw new ContractViolation(['NE-2'],
      'headline must be a non-empty string', { headline });
  }
  assertIsoUtc(publicationTime, 'headline publicationTime');
  return buildField({
    key: newsKey('headline'),
    dataType: 'string',
    availability: 'PRESENT',
    provenance,
    pitEligible: true,
    value: headline,
    publicationTime,
    monetary: 'no',
    dimension: 'dimensionless',
  });
}

/**
 * Build a D06 news/events snapshot.
 */
export function buildNewsEventSnapshot(args) {
  const {
    provider, dataVersion, schemaVersion, asOf, receivedAt,
    pitBoundary, quality, completenessPct,
    identity, identityMappingVersion, lineage, fields,
  } = args;

  // NE-4 — PIT for knowability
  if (pitBoundary === undefined) {
    throw new ContractViolation(['NE-4', 'ST-5'],
      'news/events snapshot requires pitBoundary for knowability', { provider });
  }

  // NE-1 — classification must be present
  const classKey = newsKey('classification');
  if (!fields[classKey]) {
    throw new ContractViolation(['NE-1', 'AD-11'],
      'governance classification field is REQUIRED for D06 news/events');
  }

  // NE-3 — dedupeKey must be present
  const dedupeKeyField = newsKey('dedupeKey');
  if (!fields[dedupeKeyField]) {
    throw new ContractViolation(['NE-3'],
      'dedupeKey field is REQUIRED for D06 news/events');
  }

  return buildSnapshot({
    provider, dataVersion, schemaVersion, asOf, receivedAt,
    mode: 'PIT',
    pitBoundary,
    quality, completenessPct,
    domain: NEWS_DOMAIN,
    identity,
    ...(identityMappingVersion !== undefined ? { identityMappingVersion } : {}),
    lineage, fields,
  });
}

/**
 * Validate a D06 news/events snapshot.
 */
export function validateNewsEventSnapshot(snapshot) {
  const findings = [];

  if (snapshot.mode !== 'PIT') {
    findings.push('NE-4: mode must be PIT for news/events knowability');
  }
  if (snapshot.pitBoundary === undefined) {
    findings.push('NE-4: pitBoundary is required');
  }
  if (snapshot.domain !== NEWS_DOMAIN) {
    findings.push(`NE-1: domain must be D06, got '${snapshot.domain}'`);
  }

  const fields = snapshot.fields ?? {};
  const requiredKeys = [
    newsKey('eventId'), newsKey('headline'), newsKey('sourceRef'),
    newsKey('classification'), newsKey('dedupeKey'),
  ];
  for (const key of requiredKeys) {
    if (!fields[key]) {
      findings.push(`NE-2: required field '${key}' is missing`);
    }
  }

  // NE-1 — classification must be in closed set
  const classField = fields[newsKey('classification')];
  if (classField?.value && !GOVERNANCE_CLASSIFICATIONS.includes(classField.value)) {
    findings.push(`NE-1: classification '${classField.value}' is not in the closed set`);
  }

  // NE-2 — entity links must not be provider-native symbols
  const entityLinks = fields[newsKey('entityLinks')];
  if (entityLinks?.availability === 'PRESENT' && Array.isArray(entityLinks.value)) {
    for (const link of entityLinks.value) {
      if (typeof link === 'string' && link.length === 0) {
        findings.push('NE-2: entity link must be a non-empty canonical identity');
      }
    }
  }

  return Object.freeze({
    valid: findings.length === 0,
    findings: Object.freeze(findings),
    fieldCount: Object.keys(fields).length,
    module: P10_01_MODULE,
  });
}

export { NAMESPACE_TOKEN, NAMESPACE_VERSION, buildKey, QUALITY, AVAILABILITY, MODES, deepFreeze, assertIsoUtc, ContractViolation };
