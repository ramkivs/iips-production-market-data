/**
 * P12-02 — QUALITY / FRESHNESS / COMPLETENESS PROPAGATION
 *
 * Authority:
 *   D29 P12 Implementation Authorization (commit f03967e)
 *   D4_09_P12_CONTRACT_DELTA.md K.2.2
 *
 * Purpose:
 *   Every data-bearing DTO must carry, at the granularity at which quality can
 *   vary (per-value where values differ in vintage, else per-payload):
 *   `quality`, `completenessPct`, `asOf`, `mode`.
 *
 *   Rules (from D4_09 K.2.2):
 *     - Prohibited: dropping quality on aggregation
 *     - Prohibited: presenting `partial`/`stale` as `good`
 *     - Prohibited: defaulting absent quality to `good`
 *     - Prohibited: aggregating mixed-quality values without declaring worst-case (NFR-04)
 *
 * Boundaries (hard):
 *   ⚠ **QP-1** Quality is never coerced or dropped during propagation (INV-7)
 *   ⚠ **QP-2** No silent upgrade of quality (NFR-04)
 *   ⚠ **QP-3** Absent quality is explicit ABSENT, never defaulted to 'good'
 *   ⚠ **QP-4** Aggregation always declares worst-case quality (NFR-04)
 *   ⚠ **QP-5** Completeness on aggregation: worst-case pct (floor)
 *   ⚠ **QP-6** Reuses P05 QUALITY and QUALITY_RANK (no new states)
 *   ⚠ **QP-7** No P07 modification — reads P07 quality, does not redefine it
 */

import { QUALITY, QUALITY_RANK } from '../../p05/src/contract.js';
import { buildDataProvenance, ProvenanceViolation } from './dataProvenanceDto.js';

export const P12_02_MODULE = 'P12-02-QUALITY-PROPAGATION';

/**
 * QP-1 / QP-2 — Determine the worst (lowest) quality from a set of quality values.
 *
 * Uses the P05 QUALITY_RANK: good(0) < stale(1) < partial(2) < unavailable(3).
 * The worst quality is the one with the highest rank.
 *
 * @param {string[]} qualities — array of P05 QUALITY values
 * @returns {string} the worst quality
 */
export function worstQuality(qualities) {
  if (!Array.isArray(qualities) || qualities.length === 0) {
    throw new ProvenanceViolation(['QP-1'], 'worstQuality requires at least one quality value');
  }

  let worst = qualities[0];
  let worstRank = QUALITY_RANK[worst];

  if (worstRank === undefined) {
    throw new ProvenanceViolation(['QP-6'], `unknown quality '${worst}'`);
  }

  for (let i = 1; i < qualities.length; i++) {
    const q = qualities[i];
    const rank = QUALITY_RANK[q];
    if (rank === undefined) {
      throw new ProvenanceViolation(['QP-6'], `unknown quality '${q}'`);
    }
    if (rank > worstRank) {
      worst = q;
      worstRank = rank;
    }
  }

  return worst;
}

/**
 * QP-5 — Determine the worst (lowest) completeness percentage.
 *
 * @param {number[]} pcts
 * @returns {number}
 */
export function worstCompleteness(pcts) {
  if (!Array.isArray(pcts) || pcts.length === 0) {
    throw new ProvenanceViolation(['QP-5'], 'worstCompleteness requires at least one value');
  }
  return Math.min(...pcts);
}

/**
 * QP-4 / QP-5 — Aggregate provenance from multiple source provenances.
 *
 * The aggregated provenance declares the worst-case across all inputs:
 *   - quality = worst (highest rank) of all inputs
 *   - completenessPct = minimum of all inputs
 *   - asOf = earliest (oldest) of all inputs
 *   - mode = all must be the same; if mixed, fails closed (QP-8)
 *   - contributingSnapshotIds = union of all inputs
 *
 * QP-8: Mixed mode is PROHIBITED. All contributing provenances must share
 * the same mode, or the aggregation fails closed. This prevents silent
 * mixing of LIVE, SNAPSHOT, and PIT data (SPEC ¶17).
 *
 * @param {object} args
 * @param {Readonly<object>[]} args.provenances — array of P12-01 provenance DTOs
 * @param {string} args.dataSource — governed source descriptor for the aggregate
 * @param {string} args.classification — classification for the aggregate
 * @returns {Readonly<object>} aggregated provenance DTO
 */
export function aggregateProvenance(args) {
  const { provenances, dataSource, classification } = args;

  if (!Array.isArray(provenances) || provenances.length === 0) {
    throw new ProvenanceViolation(['QP-4'], 'aggregateProvenance requires at least one provenance');
  }

  // Collect all values
  const qualities = provenances.map((p) => p.quality);
  const completenesses = provenances.map((p) => p.completenessPct);
  const modes = [...new Set(provenances.map((p) => p.mode))];
  const asOfs = provenances.map((p) => p.asOf).sort(); // ISO sort = chronological
  const allSnapshotIds = provenances.flatMap(
    (p) => p.contributingSnapshotIds || []
  );
  const uniqueSnapshotIds = [...new Set(allSnapshotIds)];

  // QP-8: mixed mode is prohibited
  if (modes.length > 1) {
    throw new ProvenanceViolation(
      ['QP-8', 'DP-6'],
      `mixed mode aggregation prohibited: [${modes.join(', ')}]. ` +
      'All contributing provenances must share the same mode.'
    );
  }

  return buildDataProvenance({
    dataSource,
    freshness: worstFreshness(qualities),
    calibratedAt: asOfs[asOfs.length - 1], // latest calibration
    transportSemantics: 'aggregated',
    asOf: asOfs[0], // earliest (oldest) data point
    receivedAt: provenances[provenances.length - 1].receivedAt,
    dataVersion: provenances[0].dataVersion,
    mode: modes[0],
    quality: worstQuality(qualities), // QP-4
    completenessPct: worstCompleteness(completenesses), // QP-5
    contributingSnapshotIds: uniqueSnapshotIds,
    identityMappingVersion: provenances[0].identityMappingVersion,
    classification,
  });
}

/**
 * QP-2 — Verify that a quality transition is valid (no silent upgrade).
 *
 * Quality may only stay the same or get WORSE (higher rank).
 * A transition from 'stale' to 'good' is PROHIBITED.
 *
 * @param {string} from — source quality
 * @param {string} to — target quality
 * @returns {boolean} true if the transition is valid
 * @throws {ProvenanceViolation} if quality is silently upgraded
 */
export function assertQualityTransition(from, to) {
  const fromRank = QUALITY_RANK[from];
  const toRank = QUALITY_RANK[to];

  if (fromRank === undefined) {
    throw new ProvenanceViolation(['QP-6'], `unknown source quality '${from}'`);
  }
  if (toRank === undefined) {
    throw new ProvenanceViolation(['QP-6'], `unknown target quality '${to}'`);
  }

  if (toRank < fromRank) {
    throw new ProvenanceViolation(
      ['QP-2', 'NFR-04'],
      `silent quality upgrade prohibited: '${from}' (rank ${fromRank}) → '${to}' (rank ${toRank})`
    );
  }

  return true;
}

/**
 * QP-3 — Build provenance for data where quality is ABSENT (not defaulted).
 *
 * When quality information is missing, the provenance MUST carry an explicit
 * 'unavailable' quality, NOT default to 'good'.
 *
 * @param {object} args — same as buildDataProvenance but quality is forced
 * @returns {Readonly<object>}
 */
export function buildAbsentQualityProvenance(args) {
  return buildDataProvenance({
    ...args,
    quality: 'unavailable', // QP-3: absent quality is NEVER 'good'
  });
}

/**
 * Derive freshness from quality (convenience, not a redefinition).
 *
 * @param {string[]} qualities
 * @returns {string} 'LIVE' | 'SNAPSHOT' | 'STALE' | 'UNAVAILABLE'
 */
function worstFreshness(qualities) {
  const worst = worstQuality(qualities);
  switch (worst) {
    case 'good':
      return 'SNAPSHOT';
    case 'stale':
      return 'STALE';
    case 'partial':
      return 'STALE';
    case 'unavailable':
      return 'UNAVAILABLE';
    default:
      return 'UNAVAILABLE';
  }
}

/**
 * QP-9 — Attach provenance to a data-bearing DTO payload.
 *
 * Every data-bearing DTO must carry provenance at the granularity at which
 * quality can vary. This function creates a governed DTO with attached provenance.
 *
 * @param {object} payload — the data payload (frozen)
 * @param {Readonly<object>} provenance — P12-01 provenance DTO
 * @returns {Readonly<object>} governed DTO with provenance
 */
export function attachProvenance(payload, provenance) {
  if (!payload || typeof payload !== 'object') {
    throw new ProvenanceViolation(['QP-9'], 'payload must be a non-null object');
  }
  if (!provenance || typeof provenance !== 'object') {
    throw new ProvenanceViolation(['QP-9'], 'provenance must be a non-null object');
  }

  return Object.freeze({
    ...payload,
    _provenance: provenance,
  });
}
