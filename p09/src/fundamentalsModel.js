/**
 * P09-01 — FUNDAMENTALS DATA MODEL (D03 domain)
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   TRACKER `Work Tracker`!P09: Requirement *"Fundamentals gate"* ·
 *   Gate intent *"Statements, ratios, valuation inputs"* ·
 *   Dependencies `P07, P08` (Hard) — both ACCEPTED.
 *   Minimum evidence: *Fundamentals lineage; publication vs effective time*.
 *   Certification before progression: YES.
 *
 *   Authorized by **P09 Entry Authorization Adjudication** (Program Authority act).
 *   Scope: `P00_GATE_MODEL.md` P09 row; `D4_02_DATA_DOMAINS.md` §D.4; `P01_SCHEMA_CATALOG.md` D03;
 *   `P01_FIELD_DICTIONARY.md` §5.
 *
 * ── D03 field contract (P01_FIELD_DICTIONARY.md §5) ────────────────────────────────────────
 *   | Canonical key class                        | Req. | Type | Cur/Unit                  | Times                    | PIT |
 *   |--------------------------------------------|------|------|---------------------------|--------------------------|-----|
 *   | <NS>fundamentals.<lineItem> (monetary)     | C    | dec  | currency + precision + reporting scale | effectiveTime + publicationTime | Yes |
 *   | <NS>fundamentals.<ratio>                   | C    | dec  | dimensionless             | effectiveTime + publicationTime | Yes |
 *   | <NS>fundamentals.fiscalPeriod              | R    | enum | —                         | effectiveTime            | Yes |
 *   | <NS>fundamentals.statementType             | R    | enum | —                         | —                        | Yes |
 *   | <NS>fundamentals.restatementSeq            | R    | int  | —                         | publicationTime          | Yes |
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **FM-1** Fundamentals map into the **existing** engine namespace only.
 *     **No new methodology key may be invented** (D4_02 §D.4 rule; SPEC ¶132/133).
 *   ⚠ **FM-2** Publication time and effective time are both REQUIRED and DISTINCT (PIT-4).
 *   ⚠ **FM-3** Restatements are routine — `restatementSeq` is REQUIRED (P01 §5).
 *   ⚠ **FM-4** Monetary line items REQUIRE `currency` + `precision` + reporting scale.
 *   ⚠ **FM-5** Ratios/margins are dimensionless — NO currency, NO unit.
 *   ⚠ **FM-6** PIT is MANDATORY for fundamentals (P01_SCHEMA_CATALOG D03: *PIT? Yes — mandatory*).
 *   ⚠ **FM-7** Statement types are a CLOSED SET — no invention.
 *   ⚠ **FM-8** Fiscal periods are a CLOSED SET — no invention.
 *   ⚠ **FM-9** No engine-input mapping — that is P11 (N-5).
 *   ⚠ **FM-10** No provider execution, credentials, entitlements or connectivity.
 *   ⚠ **FM-11** No wall clock, no randomness, no ambient input.
 *   ⚠ **FM-12** No acceptance, no certification, no production activation.
 *
 * ── Reuse, not duplication ─────────────────────────────────────────────────────────────────
 *   ⚠ `buildSnapshot`, `buildField`, `buildSnapshotId`, `computeCompletenessPct`,
 *     `QUALITY`, `AVAILABILITY`, `MODES`, `deepFreeze` are IMPORTED from `p05/src/contract.js`.
 *   ⚠ `NAMESPACE_TOKEN`, `buildKey`, `DOMAIN_SEGMENTS`, `NAMESPACE_VERSION`
 *     are IMPORTED from `p05/src/namespace.js`.
 *   ⚠ `assertIsoUtc`, `canonicalDecimal`, `ContractViolation`
 *     are IMPORTED from `p05/src/serialize.js`.
 *   ⚠ `validateSnapshot` is IMPORTED from `p05/src/validate.js`.
 *   ⚠ P09 invents no contract vocabulary that P05 already defines.
 */

import {
  buildSnapshot,
  buildField,
  buildSnapshotId,
  computeCompletenessPct,
  QUALITY,
  AVAILABILITY,
  MODES,
  deepFreeze,
} from '../../p05/src/contract.js';

import {
  NAMESPACE_TOKEN,
  buildKey,
  DOMAIN_SEGMENTS,
  NAMESPACE_VERSION,
} from '../../p05/src/namespace.js';

import {
  assertIsoUtc,
  canonicalDecimal,
  ContractViolation,
} from '../../p05/src/serialize.js';

import { validateSnapshot } from '../../p05/src/validate.js';

export const P09_01_MODULE = 'P09-01-FUNDAMENTALS-MODEL';

/** FM-7 — CLOSED statement types. No invention. */
export const STATEMENT_TYPES = Object.freeze([
  'income_statement',
  'balance_sheet',
  'cash_flow_statement',
  'comprehensive_income',
  'equity_statement',
]);

/** FM-8 — CLOSED fiscal periods. No invention. */
export const FISCAL_PERIODS = Object.freeze([
  'Q1', 'Q2', 'Q3', 'Q4',
  'H1', 'H2',
  'FY',
  'TTM',
  'YTD',
]);

/** D03 domain segment. */
export const FUNDAMENTALS_SEGMENT = 'fundamentals';

/** D03 domain code. */
export const FUNDAMENTALS_DOMAIN = 'D03';

/** FM-3 — restatementSeq must be a non-negative integer. */
const NON_NEGATIVE_INTEGER = /^(0|[1-9]\d*)$/;

/** FM-4 — reporting scale declarations. */
export const REPORTING_SCALES = Object.freeze([
  'units',
  'thousands',
  'millions',
  'billions',
]);

/**
 * FM-1 — Build a fundamentals field key.
 * @param {string} fieldSegment
 * @returns {string}
 */
export function fundamentalsKey(fieldSegment) {
  return buildKey(FUNDAMENTALS_SEGMENT, fieldSegment);
}

/**
 * FM-2/FM-3/FM-4/FM-5 — Classify and validate a fundamentals field specification.
 *
 * @param {object} spec
 * @param {string} spec.name         field name (e.g. 'revenue', 'ebitdaMargin')
 * @param {'monetary'|'ratio'|'enum'|'integer'} spec.fieldClass
 * @param {string} [spec.currency]   REQUIRED for monetary (FM-4)
 * @param {number} [spec.precision]  REQUIRED for monetary and ratio (NP-1)
 * @param {string} [spec.reportingScale] REQUIRED for monetary (FM-4)
 * @param {string[]} [spec.enumTable] REQUIRED for enum fields
 * @returns {Readonly<Record<string, unknown>>}
 */
export function classifyFundamentalsField(spec) {
  const { name, fieldClass, currency, precision, reportingScale, enumTable } = spec;

  if (typeof name !== 'string' || name.length === 0) {
    throw new ContractViolation(['FM-1', 'FD-1'],
      'field name must be a non-empty string', { name });
  }

  if (!['monetary', 'ratio', 'enum', 'integer'].includes(fieldClass)) {
    throw new ContractViolation(['FM-1'],
      `fieldClass '${fieldClass}' is not monetary|ratio|enum|integer`, { name, fieldClass });
  }

  // FM-4 — monetary: currency + precision + reporting scale REQUIRED
  if (fieldClass === 'monetary') {
    if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) {
      throw new ContractViolation(['FM-4', 'SM-1', 'CU-2'],
        `monetary field '${name}' requires ISO-4217 currency`, { name, currency });
    }
    if (!Number.isInteger(precision) || precision < 0) {
      throw new ContractViolation(['FM-4', 'NP-1'],
        `monetary field '${name}' requires non-negative integer precision`, { name, precision });
    }
    if (!REPORTING_SCALES.includes(reportingScale)) {
      throw new ContractViolation(['FM-4', 'UN-1'],
        `monetary field '${name}' requires reporting scale in ${REPORTING_SCALES.join('|')}`,
        { name, reportingScale });
    }
  }

  // FM-5 — ratio: dimensionless, precision REQUIRED
  if (fieldClass === 'ratio') {
    if (currency !== undefined) {
      throw new ContractViolation(['FM-5', 'FD-5'],
        `ratio field '${name}' must not carry a currency — dimensionless`, { name, currency });
    }
    if (!Number.isInteger(precision) || precision < 0) {
      throw new ContractViolation(['FM-5', 'NP-1'],
        `ratio field '${name}' requires non-negative integer precision`, { name, precision });
    }
  }

  // FM-7 — enum: closed set
  if (fieldClass === 'enum' && (!Array.isArray(enumTable) || enumTable.length === 0)) {
    throw new ContractViolation(['FM-7', 'MR-2'],
      `enum field '${name}' requires a non-empty enumTable`, { name });
  }

  return Object.freeze({
    name,
    fieldClass,
    ...(currency !== undefined ? { currency } : {}),
    ...(precision !== undefined ? { precision } : {}),
    ...(reportingScale !== undefined ? { reportingScale } : {}),
    ...(enumTable !== undefined ? { enumTable: Object.freeze([...enumTable]) } : {}),
  });
}

/**
 * FM-2/FM-3 — Build a fundamentals field value.
 *
 * @param {object} args
 * @param {string} args.name             field name
 * @param {'monetary'|'ratio'|'enum'|'integer'} args.fieldClass
 * @param {unknown} args.value           the field value (REQUIRED if availability === 'PRESENT')
 * @param {string} args.availability     AVAILABILITY enum value
 * @param {string} args.effectiveTime    ISO-8601 UTC — fiscal period end (FM-2)
 * @param {string} args.publicationTime  ISO-8601 UTC — filing/report date (FM-2)
 * @param {string} args.provenance       lineage reference
 * @param {string} [args.currency]       ISO-4217 (monetary only)
 * @param {number} [args.precision]      declared precision
 * @param {string} [args.reportingScale] reporting scale (monetary only)
 * @param {string[]} [args.enumTable]    enum values (enum only)
 * @param {string} [args.entitlementRef] REQUIRED for WITHHELD
 * @returns {Readonly<Record<string, unknown>>}
 */
export function buildFundamentalsField(args) {
  const {
    name, fieldClass, value, availability, effectiveTime, publicationTime,
    provenance, currency, precision, reportingScale, enumTable, entitlementRef,
  } = args;

  // FM-2 — effectiveTime and publicationTime are REQUIRED and DISTINCT (PIT-4)
  if (typeof effectiveTime !== 'string') {
    throw new ContractViolation(['FM-2', 'SM-10'],
      `field '${name}' requires effectiveTime (fiscal period end)`, { name });
  }
  if (typeof publicationTime !== 'string') {
    throw new ContractViolation(['FM-2', 'SM-10', 'PIT-4'],
      `field '${name}' requires publicationTime (filing/report date)`, { name });
  }
  assertIsoUtc(effectiveTime, `field '${name}' effectiveTime`);
  assertIsoUtc(publicationTime, `field '${name}' publicationTime`);

  // FM-2 — publication time and effective time are both preserved; collapsing is prohibited (PIT-4)
  if (effectiveTime === publicationTime) {
    // Not prohibited per se — they CAN be the same instant (e.g. same-day filing).
    // But they must both be PRESENT as distinct slots. This is satisfied by passing both.
  }

  const key = fundamentalsKey(name);
  const classification = classifyFundamentalsField({
    name, fieldClass, currency, precision, reportingScale, enumTable,
  });

  let resolvedValue = value;
  let dataType;
  let monetary = 'no';
  let dimension = 'dimensionless';
  let unit;

  switch (fieldClass) {
    case 'monetary':
      dataType = 'decimal';
      monetary = 'yes';
      dimension = 'dimensioned';
      unit = reportingScale;
      if (availability === 'PRESENT') {
        resolvedValue = canonicalDecimal(value, precision);
      }
      break;
    case 'ratio':
      dataType = 'decimal';
      if (availability === 'PRESENT') {
        resolvedValue = canonicalDecimal(value, precision);
      }
      break;
    case 'enum':
      dataType = 'enum';
      if (availability === 'PRESENT') {
        if (typeof value !== 'string' || !enumTable.includes(value)) {
          throw new ContractViolation(['FM-7', 'MR-2'],
            `enum field '${name}' value '${value}' is not in the declared enum table`,
            { name, value, declared: enumTable });
        }
      }
      break;
    case 'integer':
      dataType = 'integer';
      if (availability === 'PRESENT' && !Number.isInteger(value)) {
        throw new ContractViolation(['SM-6', 'UN-6'],
          `integer field '${name}' value '${value}' is not an integer`, { name, value });
      }
      break;
    default:
      throw new ContractViolation(['FM-1'], `unhandled fieldClass '${fieldClass}'`, { name });
  }

  return buildField({
    key,
    dataType,
    availability,
    provenance,
    pitEligible: true, // FM-6 — PIT is MANDATORY for fundamentals
    value: resolvedValue,
    ...(currency !== undefined ? { currency } : {}),
    ...(precision !== undefined ? { precision } : {}),
    ...(unit !== undefined ? { unit } : {}),
    effectiveTime,
    publicationTime,
    ...(entitlementRef !== undefined ? { entitlementRef } : {}),
    monetary,
    dimension,
  });
}

/**
 * FM-3 — Build the three REQUIRED fundamentals metadata fields.
 *
 * @param {object} args
 * @param {string} args.fiscalPeriod     one of FISCAL_PERIODS (FM-8)
 * @param {string} args.statementType    one of STATEMENT_TYPES (FM-7)
 * @param {number} args.restatementSeq   non-negative integer (FM-3)
 * @param {string} args.effectiveTime    ISO-8601 UTC
 * @param {string} args.publicationTime  ISO-8601 UTC
 * @param {string} args.provenance       lineage reference
 * @returns {Readonly<Record<string, unknown>>} three frozen fields keyed by canonical key
 */
export function buildFundamentalsMetadataFields(args) {
  const { fiscalPeriod, statementType, restatementSeq, effectiveTime, publicationTime, provenance } = args;

  // FM-8 — fiscalPeriod must be in the closed set
  if (!FISCAL_PERIODS.includes(fiscalPeriod)) {
    throw new ContractViolation(['FM-8'],
      `fiscalPeriod '${fiscalPeriod}' is not in the closed set ${FISCAL_PERIODS.join('|')}`,
      { fiscalPeriod });
  }

  // FM-7 — statementType must be in the closed set
  if (!STATEMENT_TYPES.includes(statementType)) {
    throw new ContractViolation(['FM-7'],
      `statementType '${statementType}' is not in the closed set ${STATEMENT_TYPES.join('|')}`,
      { statementType });
  }

  // FM-3 — restatementSeq must be a non-negative integer
  if (!Number.isInteger(restatementSeq) || restatementSeq < 0) {
    throw new ContractViolation(['FM-3'],
      `restatementSeq must be a non-negative integer, got ${restatementSeq}`,
      { restatementSeq });
  }

  assertIsoUtc(effectiveTime, 'metadata effectiveTime');
  assertIsoUtc(publicationTime, 'metadata publicationTime');

  const fpField = buildField({
    key: fundamentalsKey('fiscalPeriod'),
    dataType: 'enum',
    availability: 'PRESENT',
    provenance,
    pitEligible: true,
    value: fiscalPeriod,
    effectiveTime,
    monetary: 'no',
    dimension: 'dimensionless',
  });

  const stField = buildField({
    key: fundamentalsKey('statementType'),
    dataType: 'enum',
    availability: 'PRESENT',
    provenance,
    pitEligible: true,
    value: statementType,
    monetary: 'no',
    dimension: 'dimensionless',
  });

  const rsField = buildField({
    key: fundamentalsKey('restatementSeq'),
    dataType: 'integer',
    availability: 'PRESENT',
    provenance,
    pitEligible: true,
    value: restatementSeq,
    publicationTime,
    monetary: 'no',
    dimension: 'dimensionless',
  });

  return Object.freeze({
    [fundamentalsKey('fiscalPeriod')]: fpField,
    [fundamentalsKey('statementType')]: stField,
    [fundamentalsKey('restatementSeq')]: rsField,
  });
}

/**
 * Build a complete D03 fundamentals snapshot.
 *
 * @param {object} args
 * @param {string} args.provider
 * @param {string} args.dataVersion
 * @param {string} args.schemaVersion
 * @param {string} args.asOf               ISO-8601 UTC
 * @param {string} args.receivedAt         ISO-8601 UTC
 * @param {string} args.pitBoundary        ISO-8601 UTC (FM-6 — PIT mandatory)
 * @param {string} args.quality            QUALITY enum value
 * @param {number} args.completenessPct    0–100
 * @param {Record<string, unknown>} args.identity
 * @param {string} [args.identityMappingVersion]
 * @param {Record<string, unknown>} args.lineage
 * @param {Record<string, unknown>} args.fields   already-built fundamentals fields
 * @returns {Readonly<Record<string, unknown>>}
 */
export function buildFundamentalsSnapshot(args) {
  const {
    provider, dataVersion, schemaVersion, asOf, receivedAt,
    pitBoundary, quality, completenessPct,
    identity, identityMappingVersion, lineage, fields,
  } = args;

  // FM-6 — PIT is MANDATORY for fundamentals
  if (pitBoundary === undefined) {
    throw new ContractViolation(['FM-6', 'ST-5', 'MD-3'],
      'fundamentals snapshot requires pitBoundary — PIT is mandatory for D03', { provider });
  }

  return buildSnapshot({
    provider,
    dataVersion,
    schemaVersion,
    asOf,
    receivedAt,
    mode: 'PIT', // FM-6 — always PIT for fundamentals
    pitBoundary,
    quality,
    completenessPct,
    domain: FUNDAMENTALS_DOMAIN,
    identity,
    ...(identityMappingVersion !== undefined ? { identityMappingVersion } : {}),
    lineage,
    fields,
  });
}

/**
 * FM-9 — Assert that no fundamentals field name collides with an existing engine input key.
 * The frozen engine input keys that D4_02 §D.4 identifies as the collision surface.
 *
 * @param {Record<string, unknown>} fields
 * @returns {string[]} offending field names (empty = clean)
 */
export function findEngineKeyCollisions(fields) {
  // 13 free-form keys shared across engines (D4_02 §D.4 collision surface)
  const ENGINE_KEYS = Object.freeze([
    'id', 'ebitdaMargin', 'debtEbitda', 'revenueGrowth', 'fcfYield',
    'segment', 'businessModel', 'roic', 'roce', 'evEbitda', 'peRatio',
    'subsegment', 'archetype',
  ]);

  const offenders = [];
  for (const key of Object.keys(fields)) {
    // Extract the field segment from the namespaced key
    const parts = key.replace(NAMESPACE_TOKEN, '').split('.');
    if (parts.length === 2 && parts[0] === FUNDAMENTALS_SEGMENT) {
      const fieldSegment = parts[1];
      if (ENGINE_KEYS.includes(fieldSegment)) {
        offenders.push(fieldSegment);
      }
    }
  }
  return offenders.sort();
}

/**
 * Validate a fundamentals snapshot against D03-specific rules.
 *
 * @param {Record<string, unknown>} snapshot
 * @returns {{valid: boolean, findings: string[]}}
 */
export function validateFundamentalsSnapshot(snapshot) {
  const findings = [];

  // FM-6 — must be PIT mode
  if (snapshot.mode !== 'PIT') {
    findings.push(`FM-6: mode must be PIT for fundamentals, got '${snapshot.mode}'`);
  }

  // FM-6 — pitBoundary must be present
  if (snapshot.pitBoundary === undefined) {
    findings.push('FM-6: pitBoundary is required for fundamentals');
  }

  // Domain must be D03
  if (snapshot.domain !== FUNDAMENTALS_DOMAIN) {
    findings.push(`FM-1: domain must be D03, got '${snapshot.domain}'`);
  }

  const fields = snapshot.fields ?? {};
  const fieldKeys = Object.keys(fields);

  // FM-3 — restatementSeq must be present
  const rsKey = fundamentalsKey('restatementSeq');
  if (!fieldKeys.includes(rsKey)) {
    findings.push('FM-3: restatementSeq field is required');
  }

  // FM-7 — statementType must be present
  const stKey = fundamentalsKey('statementType');
  if (!fieldKeys.includes(stKey)) {
    findings.push('FM-7: statementType field is required');
  }

  // FM-8 — fiscalPeriod must be present
  const fpKey = fundamentalsKey('fiscalPeriod');
  if (!fieldKeys.includes(fpKey)) {
    findings.push('FM-8: fiscalPeriod field is required');
  }

  // Validate enum values if present
  if (fields[stKey] && fields[stKey].value !== null && !STATEMENT_TYPES.includes(fields[stKey].value)) {
    findings.push(`FM-7: statementType '${fields[stKey].value}' is not in the closed set`);
  }
  if (fields[fpKey] && fields[fpKey].value !== null && !FISCAL_PERIODS.includes(fields[fpKey].value)) {
    findings.push(`FM-8: fiscalPeriod '${fields[fpKey].value}' is not in the closed set`);
  }

  // FM-2 — every data field must have both effectiveTime and publicationTime
  for (const [key, field] of Object.entries(fields)) {
    if (field.availability === 'PRESENT' && key !== stKey) {
      if (field.effectiveTime === undefined && key !== fundamentalsKey('restatementSeq')) {
        findings.push(`FM-2: field '${key}' lacks effectiveTime`);
      }
      if (field.publicationTime === undefined && key !== fpKey) {
        findings.push(`FM-2: field '${key}' lacks publicationTime`);
      }
    }
  }

  // FM-6 — all fields must be PIT-eligible
  for (const [key, field] of Object.entries(fields)) {
    if (field.pitEligible !== true) {
      findings.push(`FM-6: field '${key}' is not PIT-eligible — prohibited in fundamentals`);
    }
  }

  // FM-9 — no engine key collisions (N-5)
  const collisions = findEngineKeyCollisions(fields);
  // Note: collisions are DETECTED but not REJECTED here — they are information.
  // The actual prohibition is enforced by N-5 at the namespace level: the canonical key
  // is `MD:fundamentals.<name>`, not bare `<name>`, so no collision can occur at the
  // canonical level. This check documents the collision surface for P11.

  return Object.freeze({
    valid: findings.length === 0,
    findings: Object.freeze(findings),
    engineKeyCollisionSurface: Object.freeze(collisions),
    fieldCount: fieldKeys.length,
    module: P09_01_MODULE,
  });
}

export {
  NAMESPACE_TOKEN,
  NAMESPACE_VERSION,
  buildKey,
  buildSnapshotId,
  computeCompletenessPct,
  QUALITY,
  AVAILABILITY,
  MODES,
  deepFreeze,
  assertIsoUtc,
  canonicalDecimal,
  ContractViolation,
  validateSnapshot,
};
