/**
 * P11-01 — ENGINE INGRESS PATH (C1)
 *
 * MarketDataSource → DataSnapshot → DataBoundRequest → DataBoundExecutor
 *
 * Authority:
 *   D26 P11 Entry Authorization Adjudication (2026-09-12, Program Authority)
 *   D4_08 §J.1 — Non-negotiable statements
 *   D4_08 §J.4 — Per-engine provenance, replay and certification implications
 *   ADR-01 C1 — Market-data ingress path certification
 *
 * Purpose:
 *   Implement the canonical market-data ingress path that feeds data to the
 *   13 certified engines. The path is:
 *
 *   1. MarketDataSource — raw provider data (P02 abstraction)
 *   2. DataSnapshot — canonical frozen snapshot (P05 contract)
 *   3. DataBoundRequest — merge of snapshot fields + company inputs
 *   4. DataBoundExecutor — dispatch to engine via ExecutionRequest.inputs
 *
 * Boundaries (hard):
 *   ⚠ **IP-1** No engine modification — engines read only ExecutionRequest.inputs
 *   ⚠ **IP-2** No engine can distinguish market-data-sourced from fixture-sourced input
 *   ⚠ **IP-3** Namespace/collision guard (C1–C6) MUST pass before dispatch
 *   ⚠ **IP-4** Contributing snapshot IDs recorded in execution provenance
 *   ⚠ **IP-5** Deterministic merge order — no wall clock, no randomness
 *   ⚠ **IP-6** Frozen snapshots — deepFreeze at every stage
 *   ⚠ **IP-7** AD-4 revalidation DEFERRED to P15 — no certification claim
 *   ⚠ **IP-8** AD-17/M-2 UNRESOLVED — no replay reproducibility claim
 */

import { deepFreeze, buildSnapshotId } from '../../p05/src/contract.js';
import { NAMESPACE_TOKEN, NAMESPACE_VERSION } from '../../p05/src/namespace.js';
import { canonicalJson, canonicalDigest } from '../../p05/src/serialize.js';
import {
  assertEngineDispatchGuard,
  validateEngineDispatch,
  detectBareEngineCollisionKeys,
} from './namespaceCollisionGuard.js';
import { getEngine, CERTIFIED_ENGINE_COUNT } from './engineRegistry.js';

export const P11_01_MODULE = 'P11-01-ENGINE-INGRESS-PATH';

/**
 * IP-1/IP-6 — Build a DataBoundRequest from a DataSnapshot and company inputs.
 *
 * The DataBoundRequest is the merge of:
 *   - Snapshot fields (namespaced: MD:<domain>.<field>)
 *   - Company inputs (non-namespaced: engine-specific keys)
 *
 * The merge is deterministic: snapshot fields first (sorted by key), then
 * company inputs (sorted by key). No wall clock, no randomness.
 *
 * @param {object} args
 * @param {object} args.snapshot — the DataSnapshot (P05 canonical snapshot)
 * @param {object} args.companyInputs — the company-specific inputs (non-namespaced)
 * @param {string} args.engineId — the target engine ID
 * @returns {object} frozen DataBoundRequest
 */
export function buildDataBoundRequest(args) {
  const { snapshot, companyInputs, engineId } = args;

  // IP-3 — validate engine exists in registry
  const engine = getEngine(engineId);

  // Extract field keys from snapshot
  const fieldKeys = Object.keys(snapshot.fields || {}).sort();
  const companyInputKeys = Object.keys(companyInputs || {}).sort();

  // IP-3 — C1–C6 guard MUST pass before dispatch
  // C4 expects contributing as [{ snapshotId, keys }]
  const contributingForGuard = [{
    snapshotId: snapshot.snapshotId,
    keys: fieldKeys,
  }];
  assertEngineDispatchGuard({
    fieldKeys,
    companyInputKeys,
    contributing: contributingForGuard,
  });

  // IP-5 — deterministic merge: snapshot fields first (sorted), then company inputs (sorted)
  const inputs = {};
  for (const key of fieldKeys) {
    inputs[key] = snapshot.fields[key];
  }
  for (const key of companyInputKeys) {
    inputs[key] = companyInputs[key];
  }

  const request = {
    engineId,
    engineVersion: engine.engineVersion,
    calibrationVersion: engine.calibrationVersion,
    ontologyDimensions: engine.ontologyDimensions,
    snapshotId: snapshot.snapshotId,
    inputs: Object.freeze(inputs),
    provenance: Object.freeze({
      contributingSnapshots: Object.freeze([snapshot.snapshotId]),
      provider: snapshot.provider,
      dataVersion: snapshot.dataVersion,
      asOf: snapshot.asOf,
      namespaceVersion: NAMESPACE_VERSION,
      identityMappingVersion: snapshot.identityMappingVersion || '1.0',
      module: P11_01_MODULE,
    }),
  };

  return deepFreeze(request);
}

/**
 * IP-1/IP-2 — Execute a DataBoundRequest through the DataBoundExecutor.
 *
 * The DataBoundExecutor dispatches the request to the engine. The engine sees
 * a normal ExecutionRequest — it cannot distinguish market-data-sourced from
 * fixture-sourced input (IP-2).
 *
 * This is a LOCAL simulation — no actual engine code is called. The result
 * records the execution metadata for evidence/provenance.
 *
 * @param {object} dataBoundRequest — the DataBoundRequest (frozen)
 * @param {function} [engineDispatch] — optional engine dispatch function (for testing)
 * @returns {object} frozen ExecutionResult
 */
export function executeDataBound(dataBoundRequest, engineDispatch) {
  // IP-3 — re-validate the guard before execution
  const fieldKeys = Object.keys(dataBoundRequest.inputs || {})
    .filter((k) => k.startsWith(NAMESPACE_TOKEN))
    .sort();
  const companyInputKeys = Object.keys(dataBoundRequest.inputs || {})
    .filter((k) => !k.startsWith(NAMESPACE_TOKEN))
    .sort();

  // C4 expects contributing as [{ snapshotId, keys }]
  const contributingForGuard = dataBoundRequest.provenance.contributingSnapshots.map(
    (snapshotId) => ({ snapshotId, keys: fieldKeys })
  );

  validateEngineDispatch({
    fieldKeys,
    companyInputKeys,
    contributing: contributingForGuard,
  });

  // IP-1/IP-2 — dispatch to engine
  // The engine receives ExecutionRequest.inputs — it cannot tell the source
  const executionInputs = { ...dataBoundRequest.inputs };

  let engineResult = null;
  if (typeof engineDispatch === 'function') {
    engineResult = engineDispatch({
      engineId: dataBoundRequest.engineId,
      inputs: executionInputs,
    });
  }

  // Build execution result with provenance
  const executionId = canonicalDigest(canonicalJson({
    engineId: dataBoundRequest.engineId,
    snapshotId: dataBoundRequest.snapshotId,
    inputDigest: canonicalDigest(canonicalJson(executionInputs)),
  }));

  const result = {
    executionId,
    engineId: dataBoundRequest.engineId,
    engineVersion: dataBoundRequest.engineVersion,
    snapshotId: dataBoundRequest.snapshotId,
    inputs: Object.freeze(executionInputs),
    engineResult: engineResult ? deepFreeze(engineResult) : null,
    provenance: Object.freeze({
      ...dataBoundRequest.provenance,
      executionId,
      // IP-8 — AD-17/M-2 UNRESOLVED: replay reproducibility NOT claimed
      replayReproducibilityClaimed: false,
      ad17Status: 'UNRESOLVED',
    }),
  };

  return deepFreeze(result);
}

/**
 * IP-4/IP-5 — Build the full ingress path from MarketDataSource to ExecutionResult.
 *
 * This is the complete C1 ingress path:
 *   MarketDataSource → DataSnapshot → DataBoundRequest → DataBoundExecutor
 *
 * @param {object} args
 * @param {object} args.snapshot — the DataSnapshot (already built from MarketDataSource)
 * @param {object} args.companyInputs — company-specific inputs
 * @param {string} args.engineId — target engine ID
 * @param {function} [args.engineDispatch] — optional engine dispatch (for testing)
 * @returns {object} frozen IngressResult with full provenance chain
 */
export function executeIngressPath(args) {
  const { snapshot, companyInputs, engineId, engineDispatch } = args;

  // Stage 1: MarketDataSource → DataSnapshot (already done, snapshot provided)
  // Stage 2: DataSnapshot → DataBoundRequest
  const request = buildDataBoundRequest({ snapshot, companyInputs, engineId });

  // Stage 3: DataBoundRequest → DataBoundExecutor
  const result = executeDataBound(request, engineDispatch);

  return deepFreeze({
    ingressPath: 'MarketDataSource → DataSnapshot → DataBoundRequest → DataBoundExecutor',
    module: P11_01_MODULE,
    stage1_dataSnapshot: Object.freeze({
      snapshotId: snapshot.snapshotId,
      provider: snapshot.provider,
      dataVersion: snapshot.dataVersion,
      asOf: snapshot.asOf,
      mode: snapshot.mode,
      domain: snapshot.domain,
    }),
    stage2_dataBoundRequest: request,
    stage3_executionResult: result,
    certification: Object.freeze({
      c1_ingressPath: true,
      c2_namespaceGuard: true,
      ad4_revalidationClaimed: false,
      ad17_replayClaimed: false,
    }),
  });
}

export {
  buildSnapshotId,
  NAMESPACE_TOKEN,
  NAMESPACE_VERSION,
  deepFreeze,
  CERTIFIED_ENGINE_COUNT,
};
