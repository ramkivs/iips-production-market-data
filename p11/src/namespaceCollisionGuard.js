/**
 * P11-02 — NAMESPACE + COLLISION GUARD (C1–C6)
 *
 * Authority:
 *   D26 P11 Entry Authorization Adjudication (2026-09-12, Program Authority)
 *   ADR-01 C1–C6 — UNCHANGED (docs/p05/P05_GATE_ACCEPTANCE.md)
 *   OI-10 RESOLVED — token `MD:`, form `MD:<domain>.<field>` (docs/CHECKPOINT-03.md §3)
 *   D4_08 §J.3 — Per-engine collision risk specification
 *
 * Purpose:
 *   Integrate the P05 namespace/collision guard into the engine dispatch path.
 *   Ensure no un-namespaced keys reach engines. Ensure no collision between
 *   snapshot fields and company inputs. Fail closed on any violation.
 *
 * Boundaries (hard):
 *   ⚠ **NG-1** Reuses P05 namespace.js (C1–C6) — does NOT redefine or modify
 *   ⚠ **NG-2** Fail-closed: any violation aborts the engine dispatch
 *   ⚠ **NG-3** No engine modification — guard is in the ingress path, not the engine
 *   ⚠ **NG-4** No existing-IIPS modification
 *   ⚠ **NG-5** Engine-input collision surface: peRatio, evEbitda, evRevenue, fcfYield
 *     are HIGH-RISK keys that MUST be namespaced when sourced from market data
 *   ⚠ **NG-6** AD-17/M-2 UNRESOLVED — this guard does NOT claim replay certification
 */

import {
  NAMESPACE_TOKEN,
  isNamespaced,
  parseKey,
  assertC1,
  assertC2,
  assertC3,
  assertC4,
  assertCollisionGuard,
  NamespaceViolation,
} from '../../p05/src/namespace.js';

export const P11_02_MODULE = 'P11-02-NAMESPACE-COLLISION-GUARD';

/**
 * NG-5 — Engine-input collision surface (D4_08 §J.3).
 * These keys are HIGH-RISK because they appear in both market-data snapshots
 * and engine company inputs. When sourced from market data, they MUST be
 * namespaced (MD:<domain>.<field>), NEVER bare.
 */
export const ENGINE_COLLISION_SURFACE = Object.freeze([
  'peRatio', 'evEbitda', 'evRevenue', 'fcfYield',
  'roic', 'roce', 'ebitdaMargin', 'debtEbitda',
  'revenueGrowth', 'segment', 'id',
  'archetype', 'subsegment', 'businessModel',
]);

/**
 * NG-1/NG-2 — Assert the full C1–C6 collision guard before engine dispatch.
 *
 * This is the integration point: P05's namespace guard is called here in the
 * engine dispatch path. Any violation aborts the dispatch (fail-closed).
 *
 * @param {object} args
 * @param {string[]} args.fieldKeys — snapshot field keys (must be namespaced)
 * @param {string[]} args.companyInputKeys — company input keys (must NOT be namespaced)
 * @param {string[]} args.contributing — contributing snapshot IDs (must be unique)
 * @returns {{ valid: true, guard: 'C1-C6' }}
 * @throws {NamespaceViolation} if any C1–C6 rule is violated
 */
export function assertEngineDispatchGuard(args) {
  const { fieldKeys, companyInputKeys = [], contributing = [] } = args;

  // NG-1 — delegate to P05 C1–C6 (UNCHANGED)
  // Note: P05 assertCollisionGuard expects { fields, companyInputKeys, contributing }
  assertCollisionGuard({ fields: fieldKeys, companyInputKeys, contributing });

  return Object.freeze({ valid: true, guard: 'C1-C6', module: P11_02_MODULE });
}

/**
 * NG-5 — Detect bare (un-namespaced) engine collision keys in a field set.
 *
 * When market data provides values for engine-input keys (peRatio, evEbitda, etc.),
 * those values MUST be namespaced. This function detects any bare collision keys
 * that would indicate a provider-native name leaking into the engine dispatch.
 *
 * @param {string[]} keys — all keys in the dispatch payload
 * @returns {{ offenders: string[], safe: boolean }}
 */
export function detectBareEngineCollisionKeys(keys) {
  const offenders = [];
  for (const key of keys) {
    if (isNamespaced(key)) continue; // namespaced = safe
    if (ENGINE_COLLISION_SURFACE.includes(key)) {
      offenders.push(key);
    }
  }
  return Object.freeze({
    offenders: Object.freeze(offenders.sort()),
    safe: offenders.length === 0,
  });
}

/**
 * NG-2/NG-5 — Assert no bare engine collision keys in a dispatch payload.
 *
 * @param {string[]} keys — all keys in the dispatch payload
 * @throws {NamespaceViolation} if any bare collision key is found
 */
export function assertNoBareEngineCollisionKeys(keys) {
  const { offenders, safe } = detectBareEngineCollisionKeys(keys);
  if (!safe) {
    throw new NamespaceViolation(
      ['C1', 'FD-3', 'NG-5'],
      `bare engine collision keys detected in dispatch payload: ${offenders.join(', ')}. ` +
      `These MUST be namespaced (MD:<domain>.<field>) when sourced from market data.`,
      { offenders },
    );
  }
  return true;
}

/**
 * NG-1 — Validate that a set of snapshot fields passes the C1–C6 guard
 * AND that no bare engine collision keys are present.
 *
 * This is the complete pre-dispatch validation.
 *
 * @param {object} args
 * @param {string[]} args.fieldKeys — snapshot field keys
 * @param {string[]} args.companyInputKeys — company input keys
 * @param {string[]} args.contributing — contributing snapshot IDs
 * @returns {{ valid: true, guard: 'C1-C6+NG-5', collisionSurfaceChecked: boolean }}
 * @throws {NamespaceViolation} if any rule is violated
 */
export function validateEngineDispatch(args) {
  const { fieldKeys, companyInputKeys = [], contributing = [] } = args;

  // NG-1 — C1–C6 guard
  assertEngineDispatchGuard({ fieldKeys, companyInputKeys, contributing });

  // NG-5 — bare engine collision key check
  // IMPORTANT: Only check field keys (snapshot fields), NOT company input keys.
  // Company inputs are intentionally non-namespaced (C2). The collision guard
  // prevents provider-native names from leaking via market data, not via company inputs.
  assertNoBareEngineCollisionKeys(fieldKeys);

  return Object.freeze({
    valid: true,
    guard: 'C1-C6+NG-5',
    collisionSurfaceChecked: true,
    module: P11_02_MODULE,
  });
}

export {
  NAMESPACE_TOKEN,
  isNamespaced,
  parseKey,
  NamespaceViolation,
};
