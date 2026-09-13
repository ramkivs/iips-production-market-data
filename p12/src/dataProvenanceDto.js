/**
 * P12-01 — DATA PROVENANCE DTO
 *
 * Authority:
 *   D29 P12 Implementation Authorization (commit f03967e)
 *   D4_09_P12_CONTRACT_DELTA.md K.2.1
 *   D4_09_P12_CONTRACT_DELTA.md K.2.2
 *
 * Purpose:
 *   Extend the existing `ExecutiveProvenance` shape with additive fields that
 *   carry governed data provenance through every DTO. This is the foundational
 *   DTO for P12 — all other P12 work items build on it.
 *
 *   Existing ExecutiveProvenance (from D4_09 K.1):
 *     { dataSource, freshness, calibratedAt, transportSemantics }
 *
 *   Additive P12 fields:
 *     { asOf, receivedAt, dataVersion, mode, quality, completenessPct,
 *       contributingSnapshotIds, identityMappingVersion, namespaceVersion,
 *       classification }
 *
 * Boundaries (hard):
 *   ⚠ **DP-1** Additive only — no existing field removed or renamed
 *   ⚠ **DP-2** Existing field semantics REUSED (derived, not literal)
 *   ⚠ **DP-3** Provider identity NEVER exposed in DTOs (NFR-06)
 *   ⚠ **DP-4** Deep-frozen structures — no mutation after construction
 *   ⚠ **DP-5** Classification vocabulary is a CLOSED set — no invented classes
 *   ⚠ **DP-6** Mode is EXPLICIT — no silent mixing (LIVE | SNAPSHOT | PIT)
 *   ⚠ **DP-7** Quality vocabulary reuses P05 QUALITY enum (Q-1: no fifth state)
 *   ⚠ **DP-8** No P01 canonical contract modification
 */

import { QUALITY, QUALITY_RANK, MODES } from '../../p05/src/contract.js';
import { NAMESPACE_VERSION } from '../../p05/src/namespace.js';

export const P12_01_MODULE = 'P12-01-DATA-PROVENANCE-DTO';

/** DP-5: Classification vocabulary — CLOSED set (D4_09 K.2.1). */
export const CLASSIFICATIONS = Object.freeze([
  'REAL',
  'CERTIFIED-ENGINE',
  'CERTIFIED-PRODUCT',
  'DERIVED',
  'SYNTHESIZED',
  'PRESENTATIONAL',
]);

/** Existing ExecutiveProvenance field names — preserved (DP-1). */
export const EXECUTIVE_PROVENANCE_FIELDS = Object.freeze([
  'dataSource',
  'freshness',
  'calibratedAt',
  'transportSemantics',
]);

/** P12 additive field names. */
export const P12_PROVENANCE_FIELDS = Object.freeze([
  'asOf',
  'receivedAt',
  'dataVersion',
  'mode',
  'quality',
  'completenessPct',
  'contributingSnapshotIds',
  'identityMappingVersion',
  'namespaceVersion',
  'classification',
]);

/**
 * DP-4 / DP-6 / DP-7 — Build a governed data provenance DTO.
 *
 * The result is deep-frozen. All fields are validated against closed vocabularies.
 * Provider identity is NEVER included (DP-3 / NFR-06).
 *
 * @param {object} args
 * @param {string} args.dataSource — governed source descriptor (derived, NOT a provider name)
 * @param {string} args.freshness — 'LIVE' | 'SNAPSHOT' | 'STALE' | 'UNAVAILABLE' | 'REPLAY'
 * @param {string} args.calibratedAt — ISO-8601 UTC
 * @param {string} args.transportSemantics — transport description
 * @param {string} args.asOf — market-data observation time (ISO-8601 UTC)
 * @param {string} args.receivedAt — acquisition time (ISO-8601 UTC)
 * @param {string} args.dataVersion — vintage identity (opaque string)
 * @param {string} args.mode — 'LIVE' | 'SNAPSHOT' | 'PIT' (explicit; DP-6)
 * @param {string} args.quality — 'good' | 'stale' | 'partial' | 'unavailable' (P05 QUALITY; DP-7)
 * @param {number} args.completenessPct — 0–100
 * @param {string[]} [args.contributingSnapshotIds] — Part 7 lineage
 * @param {string} [args.identityMappingVersion] — Part 6 (default '1.0')
 * @param {string} [args.namespaceVersion] — Part 5 (default NAMESPACE_VERSION)
 * @param {string} args.classification — per-field provenance class (DP-5 closed set)
 * @returns {Readonly<object>} deep-frozen data provenance DTO
 */
export function buildDataProvenance(args) {
  const {
    dataSource,
    freshness,
    calibratedAt,
    transportSemantics,
    asOf,
    receivedAt,
    dataVersion,
    mode,
    quality,
    completenessPct,
    contributingSnapshotIds = [],
    identityMappingVersion = '1.0',
    namespaceVersion = NAMESPACE_VERSION,
    classification,
  } = args;

  // DP-7: validate quality against P05 closed set
  if (!QUALITY.includes(quality)) {
    throw new ProvenanceViolation(
      ['DP-7', 'Q-1'],
      `quality '${quality}' is not in the P05 closed set [${QUALITY.join(', ')}]`
    );
  }

  // DP-6: validate mode against closed set
  if (!MODES.includes(mode)) {
    throw new ProvenanceViolation(
      ['DP-6'],
      `mode '${mode}' is not in the closed set [${MODES.join(', ')}]`
    );
  }

  // DP-5: validate classification against closed set
  if (!CLASSIFICATIONS.includes(classification)) {
    throw new ProvenanceViolation(
      ['DP-5'],
      `classification '${classification}' is not in the closed set [${CLASSIFICATIONS.join(', ')}]`
    );
  }

  // Validate completenessPct range
  if (typeof completenessPct !== 'number' || completenessPct < 0 || completenessPct > 100) {
    throw new ProvenanceViolation(
      ['DP-9'],
      `completenessPct ${completenessPct} is outside [0, 100]`
    );
  }

  // DP-3: provider identity NEVER in dataSource
  // (dataSource must be a governed descriptor, not a raw provider name)
  if (typeof dataSource !== 'string' || dataSource.length === 0) {
    throw new ProvenanceViolation(
      ['DP-3'],
      'dataSource must be a non-empty governed source descriptor'
    );
  }

  // Validate contributingSnapshotIds is an array of strings
  if (!Array.isArray(contributingSnapshotIds)) {
    throw new ProvenanceViolation(
      ['DP-10'],
      'contributingSnapshotIds must be an array'
    );
  }
  for (const id of contributingSnapshotIds) {
    if (typeof id !== 'string' || id.length === 0) {
      throw new ProvenanceViolation(
        ['DP-10'],
        'each contributingSnapshotId must be a non-empty string'
      );
    }
  }

  // Build and deep-freeze the DTO
  const dto = Object.freeze({
    // Existing ExecutiveProvenance fields (DP-1: preserved)
    dataSource,
    freshness,
    calibratedAt,
    transportSemantics,

    // P12 additive fields
    asOf,
    receivedAt,
    dataVersion,
    mode,
    quality,
    completenessPct,
    contributingSnapshotIds: Object.freeze([...contributingSnapshotIds]),
    identityMappingVersion,
    namespaceVersion,
    classification,
  });

  return dto;
}

/**
 * DP-4 — Build a minimal provenance for SNAPSHOT-mode data.
 *
 * @param {object} snapshot — a DataSnapshot (P05 canonical)
 * @param {string} [classification] — defaults to 'REAL'
 * @returns {Readonly<object>}
 */
export function provenanceFromSnapshot(snapshot, classification = 'REAL') {
  return buildDataProvenance({
    dataSource: `governed:${snapshot.domain || 'unknown'}`,
    freshness: snapshot.mode === 'LIVE' ? 'LIVE' : 'SNAPSHOT',
    calibratedAt: snapshot.asOf,
    transportSemantics: 'canonical-snapshot',
    asOf: snapshot.asOf,
    receivedAt: snapshot.receivedAt || snapshot.asOf,
    dataVersion: snapshot.dataVersion,
    mode: snapshot.mode || 'SNAPSHOT',
    quality: 'good',
    completenessPct: 100,
    contributingSnapshotIds: [snapshot.snapshotId],
    identityMappingVersion: snapshot.identityMappingVersion || '1.0',
    namespaceVersion: NAMESPACE_VERSION,
    classification,
  });
}

/**
 * Validate that a provenance DTO conforms to the P12-01 contract.
 *
 * @param {object} provenance
 * @returns {boolean} true if valid
 * @throws {ProvenanceViolation}
 */
export function assertProvenanceValid(provenance) {
  if (!provenance || typeof provenance !== 'object') {
    throw new ProvenanceViolation(['DP-11'], 'provenance must be a non-null object');
  }

  // Check all required fields exist
  for (const field of [...EXECUTIVE_PROVENANCE_FIELDS, ...P12_PROVENANCE_FIELDS]) {
    if (!(field in provenance)) {
      throw new ProvenanceViolation(['DP-11'], `missing required field '${field}'`);
    }
  }

  // Validate closed sets
  if (!QUALITY.includes(provenance.quality)) {
    throw new ProvenanceViolation(['DP-7'], `quality '${provenance.quality}' invalid`);
  }
  if (!MODES.includes(provenance.mode)) {
    throw new ProvenanceViolation(['DP-6'], `mode '${provenance.mode}' invalid`);
  }
  if (!CLASSIFICATIONS.includes(provenance.classification)) {
    throw new ProvenanceViolation(['DP-5'], `classification '${provenance.classification}' invalid`);
  }

  return true;
}

/**
 * DP-4 — typed error for provenance contract violations.
 */
export class ProvenanceViolation extends Error {
  constructor(rules, message) {
    super(`${rules.join(',')}: ${message}`);
    this.name = 'ProvenanceViolation';
    this.rules = Object.freeze([...rules]);
  }
}
