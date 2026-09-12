/**
 * P12-05 — EVIDENCE / REPLAY LINKAGE DTOS
 *
 * Authority:
 *   D29 P12 Implementation Authorization (commit f03967e)
 *   D4_09_P12_CONTRACT_DELTA.md K.2.5
 *
 * Purpose:
 *   Extend evidence and replay DTOs with governed lineage information:
 *     - Evidence DTO: extended with contributing DataSnapshot IDs, provider
 *       (governed-internal; exposure per NFR-06), dataVersion, asOf, mode
 *     - Replay DTO: must disambiguate data vintage (Part 7)
 *
 * Boundaries (hard):
 *   ⚠ **ER-1** AD-17/M-2 — `ReplayService` returns `reproduced/byteIdentical` as
 *     LITERALS. DTOs MUST NOT present these as verified reproduction.
 *   ⚠ **ER-2** Provider identity is governed-internal; exposure decision per NFR-06
 *   ⚠ **ER-3** No modification of P11 EvidenceSnapshotReplay (ADAPT only)
 *   ⚠ **ER-4** No repair of AD-17 — external Existing-IIPS authority
 *   ⚠ **ER-5** Replay reproducibility is NOT CLAIMED by this implementation
 *   ⚠ **ER-6** Additive only — existing evidence/replay structures preserved
 */

import { NAMESPACE_VERSION } from '../../p05/src/namespace.js';
import { ProvenanceViolation } from './dataProvenanceDto.js';

export const P12_05_MODULE = 'P12-05-EVIDENCE-REPLAY-LINKAGE';

/** ER-1: AD-17/M-2 constraint statement — carried in every replay DTO. */
export const AD17_CONSTRAINT = Object.freeze({
  ad17Status: 'UNRESOLVED',
  authority: 'existing-IIPS program',
  m2Defect: 'ReplayService returns reproduced/byteIdentical as literals',
  dtoConstraint: 'DTOs MUST NOT present these literals as verified reproduction',
  resolutionGate: 'P15 (E2E Certification)',
});

/**
 * ER-1/ER-3/ER-6 — Build an evidence linkage DTO.
 *
 * Extends the evidence surface with contributing DataSnapshot lineage.
 * Additive only — does not modify P11 evidenceSnapshotReplay.
 *
 * @param {object} args
 * @param {string} args.evidenceId — evidence identity
 * @param {string[]} args.contributingSnapshotIds — contributing DataSnapshot IDs
 * @param {string} args.provider — governed-internal provider token (ER-2)
 * @param {string} args.dataVersion — data vintage identity
 * @param {string} args.asOf — market-data observation time
 * @param {string} args.mode — 'LIVE' | 'SNAPSHOT' | 'PIT'
 * @param {string} args.engineId — engine that produced this evidence
 * @param {string} args.engineVersion — engine version
 * @param {string} [args.executionId] — execution identity (P11)
 * @param {string} [args.namespaceVersion] — defaults to NAMESPACE_VERSION
 * @returns {Readonly<object>} frozen evidence linkage DTO
 */
export function buildEvidenceLinkage(args) {
  const {
    evidenceId,
    contributingSnapshotIds,
    provider,
    dataVersion,
    asOf,
    mode,
    engineId,
    engineVersion,
    executionId = null,
    namespaceVersion = NAMESPACE_VERSION,
  } = args;

  // Validate required fields
  if (typeof evidenceId !== 'string' || evidenceId.length === 0) {
    throw new EvidenceViolation(['ER-7'], 'evidenceId must be a non-empty string');
  }
  if (!Array.isArray(contributingSnapshotIds) || contributingSnapshotIds.length === 0) {
    throw new EvidenceViolation(['ER-7'], 'contributingSnapshotIds must be a non-empty array');
  }
  if (typeof provider !== 'string' || provider.length === 0) {
    throw new EvidenceViolation(['ER-2'], 'provider must be a non-empty governed-internal token');
  }

  return Object.freeze({
    evidenceId,
    contributingSnapshotIds: Object.freeze([...contributingSnapshotIds]),
    provider,           // ER-2: governed-internal; NFR-06 exposure decision
    dataVersion,
    asOf,
    mode,
    engineId,
    engineVersion,
    executionId,
    namespaceVersion,
    // ER-5: reproducibility is NOT CLAIMED
    reproducibilityClaimed: false,
  });
}

/**
 * ER-1/ER-5 — Build a replay linkage DTO.
 *
 * Disambiguates data vintage for replay. Carries the AD-17 constraint
 * explicitly — DTOs MUST NOT present ReplayService literals as verified.
 *
 * @param {object} args
 * @param {string} args.replayId — replay identity
 * @param {string} args.originalExecutionId — the execution being replayed
 * @param {string[]} args.contributingSnapshotIds — contributing snapshots
 * @param {string} args.dataVersion — data vintage
 * @param {string} args.asOf — market-data observation time
 * @param {string} args.mode — 'LIVE' | 'SNAPSHOT' | 'PIT'
 * @param {boolean} [args.replayServiceReproduced] — literal from ReplayService (M-2)
 * @param {boolean} [args.replayServiceByteIdentical] — literal from ReplayService (M-2)
 * @returns {Readonly<object>} frozen replay linkage DTO
 */
export function buildReplayLinkage(args) {
  const {
    replayId,
    originalExecutionId,
    contributingSnapshotIds,
    dataVersion,
    asOf,
    mode,
    replayServiceReproduced = null,
    replayServiceByteIdentical = null,
  } = args;

  if (typeof replayId !== 'string' || replayId.length === 0) {
    throw new EvidenceViolation(['ER-7'], 'replayId must be a non-empty string');
  }

  return Object.freeze({
    replayId,
    originalExecutionId,
    contributingSnapshotIds: Object.freeze([...contributingSnapshotIds]),
    dataVersion,
    asOf,
    mode,

    // ER-1/ER-5: ReplayService literals are CARRIED but explicitly NOT verified
    replayServiceLiterals: Object.freeze({
      reproduced: replayServiceReproduced,
      byteIdentical: replayServiceByteIdentical,
    }),

    // ER-1: Explicit constraint — these are NOT verified claims
    verifiedReproduction: false,
    verifiedByteIdentical: false,

    // ER-1: AD-17 constraint carried in every replay DTO
    ad17Constraint: AD17_CONSTRAINT,
  });
}

/**
 * ER-1 — Assert that a replay DTO does NOT claim verified reproduction.
 *
 * This is a guard that verifies the AD-17 constraint is preserved.
 *
 * @param {object} replayDto
 * @returns {boolean} true if constraint is satisfied
 */
export function assertAd17ConstraintPreserved(replayDto) {
  if (replayDto.verifiedReproduction === true) {
    throw new EvidenceViolation(
      ['ER-1', 'AD-17'],
      'replay DTO claims verifiedReproduction=true — prohibited while AD-17/M-2 is UNRESOLVED'
    );
  }
  if (replayDto.verifiedByteIdentical === true) {
    throw new EvidenceViolation(
      ['ER-1', 'AD-17'],
      'replay DTO claims verifiedByteIdentical=true — prohibited while AD-17/M-2 is UNRESOLVED'
    );
  }
  return true;
}

/**
 * ER-typed error.
 */
export class EvidenceViolation extends Error {
  constructor(rules, message) {
    super(`${rules.join(',')}: ${message}`);
    this.name = 'EvidenceViolation';
    this.rules = Object.freeze([...rules]);
  }
}
