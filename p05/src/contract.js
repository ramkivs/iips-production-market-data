/**
 * P05-01 — CANONICAL CONTRACT CONSTRUCTION (P01 CanonicalSnapshot / CanonicalField)
 *
 * Authority: docs/p01/P01_DATA_CONTRACT.md §3.1 (envelope), §3.2 (field), §8 (DV-*), §9 (SN-*)
 *            docs/p01/P01_IDENTITY_AND_LINEAGE.md §2 (SI-*), §4 (L-1…L-11)
 *            docs/p02/P02_PROVIDER_ABSTRACTION_CONTRACT.md §6 (S-1…S-9), §4 (D-1…D-6)
 *
 * ⚠ `CanonicalSnapshot` is the contract shape carried as the `T` of `DataSnapshot<T>`.
 *   It is NOT a parallel ingress type — INV-1 / AD-2 (sole ingress) is preserved: the feed
 *   emits through a single `MarketDataSource`-shaped boundary (see localFeed.js).
 */

import { ContractViolation, assertIsoUtc, canonicalDecimal } from './serialize.js';
import { buildKey, isNamespaced, NAMESPACE_TOKEN, NAMESPACE_VERSION, VALID_DOMAINS } from './namespace.js';

/** Frozen snapshotId format (AD-6, SI-1, S-2, ST-2). */
export const SNAPSHOT_ID_PATTERN = /^data-([A-Za-z0-9_]+)-([A-Za-z0-9_.\-]+)-(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)$/;

/** Q-1: existing enum, unchanged. */
export const QUALITY = Object.freeze(['good', 'stale', 'partial', 'unavailable']);
/** Q-6 / SM-13 severity rank — a field may only be EQUAL OR WORSE than its snapshot. */
export const QUALITY_RANK = Object.freeze({ good: 0, stale: 1, partial: 2, unavailable: 3 });

/** INV-6 / MD-1: mode is explicit, never inferred. */
export const MODES = Object.freeze(['LIVE', 'SNAPSHOT', 'PIT']);

/** P01_VALIDATION_RULES.md §4 — absence is always explicit and typed. */
export const AVAILABILITY = Object.freeze(['PRESENT', 'NULL_ASSERTED', 'NOT_APPLICABLE', 'NOT_PROVIDED', 'WITHHELD']);
/** NL-6: only these contribute to incompleteness. */
export const INCOMPLETENESS_MARKERS = Object.freeze(['NOT_PROVIDED', 'WITHHELD']);

/** P01_DATA_CONTRACT.md §3.2 row 3. */
export const DATA_TYPES = Object.freeze(['decimal', 'integer', 'string', 'boolean', 'timestamp', 'enum', 'identifier']);

/**
 * ST-2 / SI-4 / D-1 — build the frozen snapshot identity deterministically.
 * @param {string} provider
 * @param {string} dataVersion
 * @param {string} asOf  ISO-8601 UTC
 * @returns {string}
 */
export function buildSnapshotId(provider, dataVersion, asOf) {
  assertIsoUtc(asOf, 'asOf');
  if (typeof provider !== 'string' || !/^[A-Za-z0-9_]+$/.test(provider)) {
    throw new ContractViolation(['PI-1', 'ST-2'], `provider '${provider}' is not a stable program-internal identity token`, { provider });
  }
  if (typeof dataVersion !== 'string' || dataVersion.length === 0) {
    throw new ContractViolation(['DV-1', 'ST-2'], `dataVersion '${dataVersion}' is not a valid opaque version token`, { dataVersion });
  }
  return `data-${provider}-${dataVersion}-${asOf}`;
}

/**
 * ST-3 — the snapshotId must be consistent with its own provider/dataVersion/asOf.
 * @param {string} snapshotId
 * @param {{provider:string,dataVersion:string,asOf:string}} parts
 * @throws {ContractViolation}
 */
export function assertSnapshotIdConsistent(snapshotId, { provider, dataVersion, asOf }) {
  const m = SNAPSHOT_ID_PATTERN.exec(snapshotId);
  if (!m) {
    throw new ContractViolation(['ST-2'], `snapshotId '${snapshotId}' does not match data-\${provider}-\${dataVersion}-\${asOf}`, { snapshotId });
  }
  if (m[1] !== provider || m[2] !== dataVersion || m[3] !== asOf) {
    throw new ContractViolation(['ST-3'],
      `snapshotId '${snapshotId}' is inconsistent with its own provider/dataVersion/asOf ` +
      `(${provider}/${dataVersion}/${asOf})`,
      { snapshotId, provider, dataVersion, asOf });
  }
  return true;
}

/**
 * Construct a CanonicalField (P01_DATA_CONTRACT.md §3.2). Deep-frozen.
 *
 * @param {object} spec
 * @param {string} spec.key          namespaced canonical key (C1 / FD-1)
 * @param {'decimal'|'integer'|'string'|'boolean'|'timestamp'|'enum'|'identifier'} spec.dataType
 * @param {string} spec.availability one of AVAILABILITY
 * @param {string} spec.provenance   reference into the snapshot lineage block (RF-7)
 * @param {boolean} spec.pitEligible
 * @param {unknown} [spec.value]     REQUIRED iff availability === 'PRESENT' (NL-2)
 * @param {string} [spec.currency]   ISO-4217, REQUIRED for monetary (SM-1, CU-2)
 * @param {number} [spec.precision]  REQUIRED for decimal (SM-5, NP-1)
 * @param {string} [spec.unit]       REQUIRED for dimensioned, PROHIBITED for dimensionless (SM-3, UN-1)
 * @param {string} [spec.observationTime]
 * @param {string} [spec.effectiveTime]
 * @param {string} [spec.publicationTime]
 * @param {string} [spec.quality]    field override; equal or worse than snapshot (SM-13)
 * @param {string} [spec.entitlementRef] REQUIRED for WITHHELD (NL-5)
 * @param {string} [spec.monetary]   'yes' | 'no' — declares the currency obligation class (FD-5)
 * @param {string} [spec.dimension]  'dimensioned' | 'dimensionless' (FD-5)
 * @returns {Readonly<Record<string, unknown>>}
 */
export function buildField(spec) {
  const {
    key, dataType, availability, provenance, pitEligible,
    value, currency, precision, unit,
    observationTime, effectiveTime, publicationTime, quality, entitlementRef,
    monetary = 'no', dimension = 'dimensionless',
  } = spec;

  if (!isNamespaced(key)) {
    throw new ContractViolation(['C1', 'FD-1', 'ST-11'], `field key '${key}' does not carry the namespace '${NAMESPACE_TOKEN}'`, { key });
  }
  if (!DATA_TYPES.includes(dataType)) {
    throw new ContractViolation(['ST-11'], `dataType '${dataType}' is not one of ${DATA_TYPES.join('|')}`, { key, dataType });
  }
  if (!AVAILABILITY.includes(availability)) {
    throw new ContractViolation(['NL-1', 'ST-11'], `availability '${availability}' is not one of ${AVAILABILITY.join('|')}`, { key, availability });
  }
  if (typeof provenance !== 'string' || provenance.length === 0) {
    throw new ContractViolation(['ST-11', 'RF-7'], `field '${key}' has no provenance reference`, { key });
  }
  if (typeof pitEligible !== 'boolean') {
    throw new ContractViolation(['ST-11'], `field '${key}' pitEligible must be a boolean`, { key, pitEligible });
  }

  // NL-2: PRESENT requires a value.
  if (availability === 'PRESENT' && (value === undefined || value === null)) {
    throw new ContractViolation(['NL-2'], `field '${key}' is PRESENT but carries no value`, { key });
  }
  // NL-3: any non-PRESENT marker PROHIBITS a substituted value.
  if (availability !== 'PRESENT' && value !== undefined && value !== null) {
    throw new ContractViolation(['NL-3', 'NL-7'],
      `field '${key}' is ${availability} but carries a substituted value — coercion is prohibited`, { key, availability });
  }
  // NL-5: WITHHELD must carry an entitlementRef.
  if (availability === 'WITHHELD' && (typeof entitlementRef !== 'string' || entitlementRef.length === 0)) {
    throw new ContractViolation(['NL-5'], `field '${key}' is WITHHELD but has no entitlementRef`, { key });
  }

  let canonicalValue = value;
  if (availability === 'PRESENT') {
    // SM-6: value must satisfy its declared dataType.
    switch (dataType) {
      case 'decimal': {
        if (precision === undefined) {
          throw new ContractViolation(['SM-5', 'NP-1'], `decimal field '${key}' has no declared precision`, { key });
        }
        canonicalValue = canonicalDecimal(value, precision);
        break;
      }
      case 'integer':
        if (!Number.isInteger(value)) {
          throw new ContractViolation(['SM-6', 'UN-6'], `field '${key}' is not an integer`, { key, value });
        }
        break;
      case 'string':
      case 'enum':
      case 'identifier':
        if (typeof value !== 'string' || value.length === 0) {
          throw new ContractViolation(['SM-6'], `field '${key}' is not a non-empty string`, { key, value });
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new ContractViolation(['SM-6'], `field '${key}' is not a boolean`, { key, value });
        }
        break;
      case 'timestamp':
        assertIsoUtc(value, `field '${key}'`);
        break;
      default:
        throw new ContractViolation(['SM-6'], `unhandled dataType '${dataType}'`, { key });
    }

    // SM-1 / CU-2 / FD-5 — monetary ⇒ currency REQUIRED, and ISO-4217 (SM-2).
    if (monetary === 'yes') {
      if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) {
        throw new ContractViolation(['SM-1', 'SM-2', 'CU-2', 'FD-5'],
          `monetary field '${key}' has no ISO-4217 currency — rejected, not defaulted`, { key, currency });
      }
    } else if (currency !== undefined) {
      throw new ContractViolation(['FD-5'], `non-monetary field '${key}' must not carry a currency`, { key, currency });
    }

    // SM-3 / UN-1 / FD-5 — dimensioned ⇒ unit REQUIRED; dimensionless ⇒ PROHIBITED.
    if (dimension === 'dimensioned') {
      if (typeof unit !== 'string' || unit.length === 0) {
        throw new ContractViolation(['SM-3', 'UN-1', 'FD-5'], `dimensioned field '${key}' has no unit`, { key });
      }
    } else if (unit !== undefined) {
      throw new ContractViolation(['SM-3', 'UN-1', 'FD-5'], `dimensionless field '${key}' must not carry a unit`, { key, unit });
    }
  }

  for (const [label, v] of [['observationTime', observationTime], ['effectiveTime', effectiveTime], ['publicationTime', publicationTime]]) {
    if (v !== undefined) assertIsoUtc(v, `field '${key}' ${label}`);
  }
  if (quality !== undefined && !QUALITY.includes(quality)) {
    throw new ContractViolation(['Q-1'], `field '${key}' quality '${quality}' is not in the existing enum`, { key, quality });
  }

  return Object.freeze({
    key,
    value: availability === 'PRESENT' ? Object.freeze(canonicalValue && typeof canonicalValue === 'object' ? canonicalValue : canonicalValue) : null,
    dataType,
    ...(currency !== undefined ? { currency } : {}),
    ...(precision !== undefined ? { precision } : {}),
    ...(unit !== undefined ? { unit } : {}),
    ...(observationTime !== undefined ? { observationTime } : {}),
    ...(effectiveTime !== undefined ? { effectiveTime } : {}),
    ...(publicationTime !== undefined ? { publicationTime } : {}),
    availability,
    ...(quality !== undefined ? { quality } : {}),
    ...(entitlementRef !== undefined ? { entitlementRef } : {}),
    provenance,
    pitEligible,
    monetary,
    dimension,
  });
}

/**
 * Deep-freeze a value so ST-10 holds: mutation is a hard error, never a silent no-op.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

/**
 * Construct a CanonicalSnapshot (P01_DATA_CONTRACT.md §3.1). Deep-frozen (SN-1, ST-10, A-22).
 *
 * @param {object} spec
 * @returns {Readonly<Record<string, unknown>>}
 */
export function buildSnapshot(spec) {
  const {
    provider, dataVersion, schemaVersion, asOf, receivedAt, mode,
    pitBoundary, quality, completenessPct, domain,
    identity, identityMappingVersion, lineage, fields,
    namespaceVersion = NAMESPACE_VERSION,
  } = spec;

  const snapshotId = buildSnapshotId(provider, dataVersion, asOf);
  assertSnapshotIdConsistent(snapshotId, { provider, dataVersion, asOf });

  if (typeof schemaVersion !== 'string' || schemaVersion.length === 0) {
    throw new ContractViolation(['ST-1'], 'schemaVersion is REQUIRED', { snapshotId });
  }
  if (!MODES.includes(mode)) {
    throw new ContractViolation(['ST-4', 'MD-1'], `mode '${mode}' is not LIVE|SNAPSHOT|PIT — mode is never inferred`, { snapshotId, mode });
  }
  // ST-5 / MD-3: pitBoundary present iff mode === PIT.
  if (mode === 'PIT' && pitBoundary === undefined) {
    throw new ContractViolation(['ST-5', 'MD-3'], `mode PIT requires pitBoundary`, { snapshotId });
  }
  if (mode !== 'PIT' && pitBoundary !== undefined) {
    throw new ContractViolation(['ST-5', 'MD-3'], `mode ${mode} PROHIBITS pitBoundary`, { snapshotId, mode });
  }
  if (pitBoundary !== undefined) assertIsoUtc(pitBoundary, 'pitBoundary');
  if (!QUALITY.includes(quality)) {
    throw new ContractViolation(['ST-6', 'Q-1'], `quality '${quality}' is not good|stale|partial|unavailable`, { snapshotId, quality });
  }
  if (typeof completenessPct !== 'number' || completenessPct < 0 || completenessPct > 100) {
    throw new ContractViolation(['ST-7'], `completenessPct ${completenessPct} is not within [0,100]`, { snapshotId, completenessPct });
  }
  if (!VALID_DOMAINS.includes(domain)) {
    throw new ContractViolation(['ST-8'], `domain '${domain}' is not in D01…D10 — no new domains`, { snapshotId, domain });
  }
  // ST-9: fields empty ONLY when quality === 'unavailable'.
  const fieldKeys = Object.keys(fields ?? {});
  if (fieldKeys.length === 0 && quality !== 'unavailable') {
    throw new ContractViolation(['ST-9'], `fields is empty but quality is '${quality}' — empty is permitted only for 'unavailable'`, { snapshotId, quality });
  }
  if (fieldKeys.length > 0 && quality === 'unavailable') {
    throw new ContractViolation(['ST-9'], `quality 'unavailable' must carry an empty field set`, { snapshotId });
  }

  // RF-6 / LN-1: complete lineage block.
  const requiredLineage = ['sourceRef', 'adapterId', 'adapterVersion', 'transformationChainRef', 'receivedAt', 'namespaceVersion'];
  const missingLineage = requiredLineage.filter((k) => lineage?.[k] === undefined);
  if (missingLineage.length > 0) {
    throw new ContractViolation(['RF-6', 'LN-1', 'S-5'],
      `lineage block is incomplete — missing ${missingLineage.join(', ')}`, { snapshotId, missingLineage });
  }
  // L-9 / RF-2: identityMappingVersion required when identity crosses the AD-1 adapter.
  const crossesAdapter = identity?.mappedCompanyId !== undefined || identity?.adapterCrossing === true;
  if (crossesAdapter && identityMappingVersion === undefined) {
    throw new ContractViolation(['RF-2', 'L-9', 'ID-3'],
      'identity crosses the AD-1 adapter but identityMappingVersion is absent', { snapshotId });
  }
  // S-6 / VX-4: identityMappingVersion is passed through, never fabricated by the adapter.
  if (identityMappingVersion !== undefined && lineage.identityMappingVersion !== identityMappingVersion) {
    throw new ContractViolation(['S-6', 'VX-4', 'L-9'],
      'identityMappingVersion must be passed through consistently into lineage', { snapshotId, identityMappingVersion });
  }

  // SN-2 / TS-6 / D-4: asOf is market-data time; receivedAt is ingest time, stamped once.
  assertIsoUtc(asOf, 'asOf');
  assertIsoUtc(receivedAt, 'receivedAt');

  const fieldRecords = Object.fromEntries(
    Object.keys(fields).sort().map((k) => [k, fields[k]]),
  );

  return deepFreeze({
    snapshotId,
    provider,
    dataVersion,
    schemaVersion,
    namespaceVersion,
    asOf,
    receivedAt,
    mode,
    ...(pitBoundary !== undefined ? { pitBoundary } : {}),
    quality,
    completenessPct,
    domain,
    ...(identity !== undefined ? { identity: deepFreeze(identity) } : {}),
    ...(identityMappingVersion !== undefined ? { identityMappingVersion } : {}),
    lineage: deepFreeze({ ...lineage }),
    fields: deepFreeze(fieldRecords),
  });
}

/**
 * Q-2 / NL-6 — completenessPct computed from NOT_PROVIDED + WITHHELD against the
 * contracted field set. Deterministic; never coerced (Q-3).
 * @param {Record<string, {availability: string}>} fields
 * @param {number} contractedFieldCount
 * @returns {number} 0–100, fixed to 2 decimals
 */
export function computeCompletenessPct(fields, contractedFieldCount) {
  if (contractedFieldCount <= 0) return 100;
  const missing = Object.values(fields).filter((f) => INCOMPLETENESS_MARKERS.includes(f.availability)).length;
  const pct = ((contractedFieldCount - missing) / contractedFieldCount) * 100;
  return Number(pct.toFixed(2));
}

/**
 * SM-13 / Q-6 — a field-level quality may only be EQUAL OR WORSE than the snapshot-level value.
 * @param {string} snapshotQuality
 * @param {Record<string, {quality?: string}>} fields
 * @returns {string[]} offending keys
 */
export function findFieldQualityViolations(snapshotQuality, fields) {
  const snapRank = QUALITY_RANK[snapshotQuality];
  return Object.entries(fields)
    .filter(([, f]) => f.quality !== undefined && QUALITY_RANK[f.quality] < snapRank)
    .map(([k]) => k)
    .sort();
}

export { buildKey };
