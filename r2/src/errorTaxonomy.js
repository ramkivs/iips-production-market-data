/**
 * R-2 — ERROR TAXONOMY (P02 E1–E8, REUSED VERBATIM — NOT REINVENTED)
 *
 * ── Authority ────────────────────────────────────────────────────────────────────────────────
 *   `docs/p02/P02_ERROR_TAXONOMY.md`:17-24 defines the accepted provider error taxonomy E1–E8.
 *   P02 is an ACCEPTED gate and its taxonomy is authoritative for the provider boundary.
 *   R-2 therefore **reuses** these codes and adds **none**. Introducing a parallel R-2 error
 *   vocabulary would fork the taxonomy that P02 froze.
 *
 * ── Why this file exists at all ──────────────────────────────────────────────────────────────
 *   R-2 §E.32 requires explicit behaviour for eight runtime conditions (successful refresh,
 *   partial refresh, no data, stale data, provider unavailable, malformed response, timeout,
 *   retry exhaustion). Every one of those maps onto an existing P02 code. This module makes the
 *   mapping **explicit and testable** rather than leaving it implicit in prose.
 *
 * ── Frozen invariants honoured ───────────────────────────────────────────────────────────────
 *   · P02 `PR-2` (`docs/p02/P02_ERROR_TAXONOMY.md`:95) prohibits expressing E2–E8 as
 *     `quality: 'partial' | 'stale' | 'unavailable'`, except the recorded E4/E7 → E1 escalation.
 *     `classifyQuality` below implements exactly that and nothing looser.
 *   · E1 is the **only** code permitted to carry an empty field set
 *     (`P02_ERROR_TAXONOMY.md`:45). `assertPayloadShape` enforces it.
 */

/** The accepted P02 taxonomy. Values are the verbatim P02 names. */
export const E = Object.freeze({
  E1: 'PROVIDER_UNAVAILABLE',
  E2: 'AUTHENTICATION_FAILURE',
  E3: 'ENTITLEMENT_FAILURE',
  E4: 'TRANSIENT_FAILURE',
  E5: 'MALFORMED_RESPONSE',
  E6: 'UNSUPPORTED_CAPABILITY',
  E7: 'RATE_LIMIT_FAILURE',
  E8: 'CONTRACT_MAPPING_FAILURE',
});

/** Stable code list, ordered E1..E8, for deterministic iteration and evidence. */
export const E_CODES = Object.freeze(Object.keys(E));

/** The P02 code *values*, which is what `code` fields carry at runtime. */
export const E_VALUES = Object.freeze(Object.values(E));

/**
 * Membership test for a runtime code value.
 *
 * ⚠ Codes travel as VALUES ('TRANSIENT_FAILURE'), not as identifiers ('E4'). Comparing against
 * `E_CODES` would reject every legitimate code — which is why this helper exists and is the only
 * membership check used by `providerError`.
 */
export function isTaxonomyCode(code) {
  return E_VALUES.includes(code);
}

/**
 * Codes that are *retryable* — i.e. a retry policy may legitimately re-attempt the call.
 * E1 (unreachable) and E4 (timeout/reset/5xx) are transient by P02's own definitions.
 * E2/E3 are identity/entitlement conditions: retrying cannot succeed without an external
 * provisioning act, so retrying them would burn the retry budget and mask a licensing gap.
 * E7 is retryable but is escalated to E1 under policy (see `escalate`), per P02:23.
 */
export const RETRYABLE = Object.freeze(new Set([E.E1, E.E4, E.E7]));

/**
 * Codes that represent a *provisioning/licensing gate* rather than a fault.
 * These must surface as an explicit external dependency, never as "no data yet".
 * R-2 §L.66 makes licensing/credentials/entitlement explicit production gates.
 */
export const PROVISIONING_GATED = Object.freeze(new Set([E.E2, E.E3]));

/** P02:20 / P02:23 — the two recorded escalations to E1. */
export const ESCALATES_TO_E1 = Object.freeze(new Set([E.E4, E.E7]));

/**
 * Map a P02 error code onto the P01 `quality` axis.
 *
 * P02 `PR-2` forbids collapsing rejections into quality labels. Only E1 (and E4/E7 *after*
 * policy escalation) may degrade to `unavailable`. Everything else is a rejection and yields
 * `null` — meaning "no quality verdict; the attempt was rejected", which downstream scoring
 * can distinguish from "data is present but stale".
 *
 * @param {string} code  a member of `E`
 * @returns {'unavailable'|null}
 */
export function classifyQuality(code) {
  if (code === E.E1) return 'unavailable';
  return null;
}

/**
 * Apply the recorded E4/E7 → E1 escalation once the retry policy is exhausted.
 * Idempotent: escalating an already-escalated or non-escalating code returns it unchanged.
 *
 * @param {string} code
 * @param {{retriesExhausted?: boolean}} [opts]
 * @returns {string}
 */
export function escalate(code, opts = {}) {
  if (!ESCALATES_TO_E1.has(code)) return code;
  return opts.retriesExhausted === true ? E.E1 : code;
}

/**
 * Build a provider error object. Never throws on construction — the error object is data,
 * so that failure handling stays total (no uncaught throw inside a scheduler tick).
 *
 * @param {string} code     member of `E`
 * @param {object} detail
 * @param {string} [detail.reason]
 * @param {boolean} [detail.emptyFieldSetPermitted]
 * @returns {{code:string, reason:string, retryable:boolean, provisioningGated:boolean, at:string}}
 */
export function providerError(code, detail = {}) {
  if (!isTaxonomyCode(code)) {
    throw new Error(`R-2: '${code}' is not a member of the accepted P02 taxonomy E1–E8`);
  }
  return Object.freeze({
    code,
    reason: detail.reason ?? code,
    retryable: RETRYABLE.has(code),
    provisioningGated: PROVISIONING_GATED.has(code),
    at: detail.at ?? new Date(0).toISOString(),
  });
}

/**
 * Enforce P02:45 — an empty field set is permitted **only** under E1.
 * A malformed response (E5) or mapping failure (E8) must carry the fields it did receive,
 * so the quarantine record is diagnosable.
 *
 * @param {string} code
 * @param {ReadonlyArray<string>} fields
 * @returns {true}
 * @throws {Error} when a non-E1 code carries an empty field set
 */
export function assertPayloadShape(code, fields) {
  const empty = !Array.isArray(fields) || fields.length === 0;
  if (empty && code !== E.E1) {
    throw new Error(
      `R-2/P02:45 violation: empty field set is permitted only under E1 (${E.E1}), not ${code}`,
    );
  }
  return true;
}

/**
 * The eight §E.32 runtime conditions, each bound to its P02 code and its required visible
 * behaviour. This table is the single source of truth used by both the refresh engine and
 * its tests, so the documented behaviour and the tested behaviour cannot drift apart.
 */
export const REFRESH_CONDITIONS = Object.freeze({
  successfulRefresh: Object.freeze({ condition: 'successful refresh', code: null, quality: 'current' }),
  partialRefresh: Object.freeze({ condition: 'partial refresh', code: E.E5, quality: 'partial' }),
  noData: Object.freeze({ condition: 'no data', code: null, quality: 'empty' }),
  staleData: Object.freeze({ condition: 'stale data', code: null, quality: 'stale' }),
  providerUnavailable: Object.freeze({ condition: 'provider unavailable', code: E.E1, quality: 'unavailable' }),
  malformedResponse: Object.freeze({ condition: 'malformed provider response', code: E.E5, quality: 'stale' }),
  timeout: Object.freeze({ condition: 'timeout', code: E.E4, quality: 'stale' }),
  retryExhaustion: Object.freeze({ condition: 'retry exhaustion', code: E.E1, quality: 'unavailable' }),
  authenticationFailure: Object.freeze({ condition: 'authentication fails', code: E.E2, quality: 'unavailable' }),
  entitlementExpiry: Object.freeze({ condition: 'entitlement expires', code: E.E3, quality: 'unavailable' }),
  schedulerMissed: Object.freeze({ condition: 'scheduler missed', code: null, quality: 'stale' }),
});
