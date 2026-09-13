/**
 * P11-03 — EVIDENCE / SNAPSHOT / REPLAY ADAPTATION (INT-003 ADAPT)
 *
 * Authority:
 *   D26 P11 Entry Authorization Adjudication (2026-09-12, Program Authority)
 *   D4_01 INT-003 — Evidence/snapshot/replay mechanisms: ADAPT treatment
 *   D4_08 §J.4 — Per-engine provenance, replay and certification implications
 *   P05 replay.js — CanonicalRecordStore (UNTOUCHED)
 *
 * Purpose:
 *   Adapt the existing evidence, snapshot, and replay mechanisms for P11
 *   engine integration. This is ADAPT treatment per INT-003:
 *
 *   - Carry provider + dataVersion + asOf + contributing DataSnapshot.snapshotId(s)
 *     into engine-result lineage
 *   - Additive extension; existing SNAPSHOT-only executions unchanged
 *   - Deterministic serialization for replay identity
 *
 * Boundaries (hard):
 *   ⚠ **ES-1** ADAPT only — no modification of P05 CanonicalRecordStore
 *   ⚠ **ES-2** Additive extension — existing SNAPSHOT-only executions unchanged
 *   ⚠ **ES-3** Deterministic replay identity — same inputs → same executionId
 *   ⚠ **ES-4** AD-17/M-2 UNRESOLVED — no replay reproducibility certification
 *   ⚠ **ES-5** AD-4 revalidation DEFERRED — no 13-engine baseline certification
 *   ⚠ **ES-6** M-2 (ReplayService literal returns) — recorded, not repaired
 */

import { canonicalJson, canonicalDigest } from '../../p05/src/serialize.js';
import { NAMESPACE_VERSION } from '../../p05/src/namespace.js';
import { deepFreeze } from '../../p05/src/contract.js';
import { P11_01_MODULE } from './engineIngressPath.js';

export const P11_03_MODULE = 'P11-03-EVIDENCE-SNAPSHOT-REPLAY-ADAPTATION';

/**
 * ES-1/ES-2 — Build engine execution provenance (additive extension).
 *
 * Carries the contributing DataSnapshot metadata into the engine execution
 * result. This is the additive extension point: existing SNAPSHOT-only
 * executions are unchanged; data-bound executions carry additional provenance.
 *
 * @param {object} args
 * @param {string} args.engineId — engine identifier
 * @param {string} args.engineVersion — engine version (frozen 1.0.0)
 * @param {string[]} args.contributingSnapshotIds — contributing DataSnapshot IDs
 * @param {object} args.snapshotProvenance — snapshot-level provenance (provider, dataVersion, asOf)
 * @param {string} args.identityMappingVersion — identity mapping version
 * @returns {object} frozen engine execution provenance
 */
export function buildEngineExecutionProvenance(args) {
  const {
    engineId,
    engineVersion,
    contributingSnapshotIds,
    snapshotProvenance,
    identityMappingVersion = '1.0',
  } = args;

  const provenance = {
    // Engine-side provenance (UNCHANGED)
    engineId,
    engineVersion,
    // Data-plane provenance (additive)
    contributingSnapshots: Object.freeze(
      contributingSnapshotIds.map((id) => Object.freeze({ snapshotId: id })),
    ),
    provider: snapshotProvenance.provider,
    dataVersion: snapshotProvenance.dataVersion,
    asOf: snapshotProvenance.asOf,
    // Namespace and identity versions
    namespaceVersion: NAMESPACE_VERSION,
    identityMappingVersion,
    // Module identity
    module: P11_03_MODULE,
    // Treatment classification
    treatment: 'ADAPT',
    intRef: 'INT-003',
  };

  return deepFreeze(provenance);
}

/**
 * ES-3 — Compute deterministic replay identity for an engine execution.
 *
 * The replay identity is a deterministic digest of:
 *   - engineId + engineVersion
 *   - contributing snapshot IDs (sorted)
 *   - company inputs digest
 *   - namespace version
 *
 * Same inputs → same replay identity. No wall clock, no randomness.
 *
 * ⚠ ES-4: This is the P11 replay identity, NOT the existing-IIPS ReplayService
 * replay identity. AD-17/M-2 remains UNRESOLVED — the existing-IIPS ReplayService
 * returns literals (M-2), and this program does not repair it.
 *
 * @param {object} args
 * @param {string} args.engineId
 * @param {string} args.engineVersion
 * @param {string[]} args.contributingSnapshotIds
 * @param {object} args.companyInputs
 * @returns {{ replayIdentity: string, components: object }}
 */
export function computeReplayIdentity(args) {
  const {
    engineId,
    engineVersion,
    contributingSnapshotIds,
    companyInputs,
  } = args;

  const sortedSnapshotIds = [...contributingSnapshotIds].sort();
  const companyInputsDigest = canonicalDigest(canonicalJson(companyInputs));

  const components = {
    engineId,
    engineVersion,
    contributingSnapshots: sortedSnapshotIds,
    companyInputsDigest,
    namespaceVersion: NAMESPACE_VERSION,
  };

  const replayIdentity = canonicalDigest(canonicalJson(components));

  return Object.freeze({
    replayIdentity,
    components: deepFreeze(components),
  });
}

/**
 * ES-2 — Build an evidence record for an engine execution.
 *
 * The evidence record captures:
 *   - Execution provenance (engine + data-plane)
 *   - Replay identity (deterministic)
 *   - Input digest (for oracle verification)
 *   - Output digest (if engine produced a result)
 *
 * @param {object} args
 * @param {object} args.executionResult — the ExecutionResult from DataBoundExecutor
 * @param {object} args.companyInputs — the company inputs used
 * @returns {object} frozen evidence record
 */
export function buildEvidenceRecord(args) {
  const { executionResult, companyInputs } = args;

  const replayId = computeReplayIdentity({
    engineId: executionResult.engineId,
    engineVersion: executionResult.engineVersion,
    contributingSnapshotIds: executionResult.provenance.contributingSnapshots,
    companyInputs,
  });

  const inputDigest = canonicalDigest(canonicalJson(executionResult.inputs));
  const outputDigest = executionResult.engineResult
    ? canonicalDigest(canonicalJson(executionResult.engineResult))
    : null;

  const evidence = {
    evidenceId: canonicalDigest(canonicalJson({
      executionId: executionResult.executionId,
      replayIdentity: replayId.replayIdentity,
    })),
    executionId: executionResult.executionId,
    replayIdentity: replayId.replayIdentity,
    replayComponents: replayId.components,
    engineId: executionResult.engineId,
    engineVersion: executionResult.engineVersion,
    snapshotId: executionResult.snapshotId,
    inputDigest,
    outputDigest,
    provenance: executionResult.provenance,
    // ES-4/ES-5 — explicit non-claims
    claims: Object.freeze({
      replayReproducibilityCertified: false,
      ad4RevalidationCertified: false,
      ad17Resolved: false,
      m2Repaired: false,
    }),
    module: P11_03_MODULE,
  };

  return deepFreeze(evidence);
}

/**
 * ES-6 — Explicit statement of AD-17/M-2 status.
 *
 * The existing-IIPS ReplayService returns literals (M-2 defect). This program
 * does NOT repair it. AD-17 resolution is required before P15 can certify
 * replay reproducibility.
 */
export const AD17_M2_STATUS = Object.freeze({
  ad17: 'UNRESOLVED',
  m2: 'ReplayService returns literals — not repaired by this program',
  owner: 'Existing-IIPS program',
  resolutionRequiredBefore: 'P15 (E2E Certification)',
  replayReproducibilityClaimed: false,
  module: P11_03_MODULE,
});

/**
 * ES-5 — Explicit statement of AD-4 revalidation status.
 */
export const AD4_STATUS = Object.freeze({
  status: 'DEFERRED',
  reason: 'AD-4 revalidation (including M-1 repair) must be completed before P15 ' +
    'can certify the 13-engine baseline through the new ingress path.',
  deferredTo: 'P15 (E2E Certification)',
  thirteenEngineBaselineCertified: false,
  module: P11_03_MODULE,
});

export {
  canonicalJson,
  canonicalDigest,
  NAMESPACE_VERSION,
  deepFreeze,
};
