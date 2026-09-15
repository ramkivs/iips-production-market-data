/**
 * R-2 — PROVIDER / ADAPTER BOUNDARY
 *
 * ── Authority ────────────────────────────────────────────────────────────────────────────────
 *   R-2 §B    — an explicit PROVIDER/ADAPTER boundary between external acquisition and the IIPS
 *               canonical contract. A future authorised provider must be replaceable **without**
 *               redesigning scoring engines, analytics, the database contract, downstream
 *               services or UI data contracts.
 *   R-2 §P.82 — no engine or UI component may parse NSE raw files, provider API responses or
 *               provider-specific field names.
 *   R-2 §E.27 — the real authorised NSE acquisition adapter remains an EXTERNAL CONFIGURATION /
 *               ENTITLEMENT GATE.
 *   R-2 §L.66 — licensing, credentials, exchange/data entitlements, provider agreement and
 *               production access are explicit production gates.
 *   R-2 §M.69 — credentials must never be hard-coded.
 *
 *   P01 INV-10 / NFR-06 (`docs/p01/P01_DATA_CONTRACT.md`:60) — **no provider leakage to product
 *   DTOs**. This boundary is where that invariant is enforced.
 *
 * ── How replaceability is actually guaranteed here ───────────────────────────────────────────
 *   Not by a naming convention. `assertAdapterShape` is called at bind time, and the adapter's
 *   declared `capabilities` are checked **pre-flight** against the request: a request outside the
 *   declared capability fails with P02 **E6 UNSUPPORTED_CAPABILITY** *before* any provider call is
 *   made (`docs/p02/P02_ERROR_TAXONOMY.md`:22). So swapping the NSE adapter for a future
 *   authorised one is a substitution behind a checked interface, not a refactor.
 *
 * ── §M.69 / §M.71 — credential handling ──────────────────────────────────────────────────────
 *   An adapter receives credentials only as an opaque `secretRef` **name**, never a value. This
 *   module never reads, logs, serialises or transports a secret; it records which secret an
 *   adapter *would* need so that provisioning is an explicit, auditable act. There is no code
 *   path here that could leak a credential into a commit, a log or a DTO.
 */

import { E, providerError } from './errorTaxonomy.js';

/**
 * Capabilities an adapter may declare. Requests outside this set fail pre-flight with E6.
 */
export const CAPABILITY = Object.freeze({
  CURRENT_STATE: 'currentState',
  EOD_DAILY: 'eodDaily',
  HISTORICAL_RANGE: 'historicalRange',
});

/**
 * Assert a candidate satisfies the adapter port. Called by `bindAdapter`.
 *
 * @param {object} adapter
 * @returns {true}
 * @throws {Error} listing every deficiency
 */
export function assertAdapterShape(adapter) {
  const problems = [];
  if (!adapter || typeof adapter !== 'object') problems.push('adapter is not an object');
  else {
    if (typeof adapter.id !== 'string' || adapter.id === '') problems.push('adapter.id must be a non-empty string');
    if (typeof adapter.describe !== 'function') problems.push('adapter.describe() is required');
    if (typeof adapter.fetchEodDaily !== 'function') problems.push('adapter.fetchEodDaily() is required');
    if (typeof adapter.fetchCurrentState !== 'function') problems.push('adapter.fetchCurrentState() is required');
    if (!Array.isArray(adapter.capabilities)) problems.push('adapter.capabilities must be an array');
    else {
      const bad = adapter.capabilities.filter((c) => !Object.values(CAPABILITY).includes(c));
      if (bad.length) problems.push(`adapter declares unknown capabilities: ${bad.join(', ')}`);
    }
    if (adapter.gate !== undefined && typeof adapter.gate !== 'object') problems.push('adapter.gate must be an object when present');
  }
  if (problems.length) throw new Error(`R-2: adapter does not satisfy the provider port — ${problems.join('; ')}`);
  return true;
}

/**
 * Bind an adapter, validating its shape and freezing it.
 *
 * @param {object} adapter
 * @returns {Readonly<object>} the bound adapter
 */
export function bindAdapter(adapter) {
  assertAdapterShape(adapter);
  return Object.freeze(adapter);
}

/**
 * Pre-flight capability check (P02 E6). Runs before any provider call.
 *
 * @param {object} adapter
 * @param {string} capability  a member of `CAPABILITY`
 * @returns {{ok: boolean, error?: object}}
 */
export function requireCapability(adapter, capability) {
  if (!Object.values(CAPABILITY).includes(capability)) {
    return { ok: false, error: providerError(E.E6, { reason: `'${capability}' is not a known capability` }) };
  }
  if (!adapter.capabilities.includes(capability)) {
    return {
      ok: false,
      error: providerError(E.E6, {
        reason: `adapter '${adapter.id}' does not declare capability '${capability}' (pre-flight, no provider call made)`,
      }),
    };
  }
  return { ok: true };
}

/**
 * The external provisioning gate (§E.27, §L.66).
 *
 * An adapter whose gate is not satisfied cannot be used for production acquisition. The gate is
 * data, not a boolean buried in code, so that:
 *   · the exact missing item is reportable (§R.22);
 *   · a readiness report can state precisely what remains externally blocked (§R.21);
 *   · no code path can "just try it anyway".
 *
 * @param {object} adapter
 * @returns {{open: boolean, satisfied: string[], outstanding: string[]}}
 */
export function describeGate(adapter) {
  const gate = adapter.gate ?? {};
  const items = [
    'acquisitionMechanismAuthorized',
    'credentialsAvailable',
    'licensingInPlace',
    'exchangeEntitlementsGranted',
    'providerAgreementExecuted',
    'productionAccessValidated',
  ];
  const satisfied = items.filter((i) => gate[i] === true);
  const outstanding = items.filter((i) => gate[i] !== true);
  return Object.freeze({
    open: outstanding.length > 0,
    satisfied: Object.freeze(satisfied),
    outstanding: Object.freeze(outstanding),
  });
}

/**
 * Guard §L.67 — the prohibited acquisition mechanisms. Recorded as data so the prohibition is
 * auditable and testable rather than a comment.
 */
export const PROHIBITED_ACQUISITION = Object.freeze([
  'scraping',
  'undocumented-endpoint',
  'unauthorised-redistribution',
  'unofficial-feed',
  'unverified-usage-rights',
]);

/**
 * Refuse to bind an adapter whose declared mechanism is prohibited by §L.67.
 *
 * @param {object} adapter
 * @returns {true}
 * @throws {Error} when `adapter.mechanism` is prohibited
 */
export function assertMechanismPermitted(adapter) {
  const mech = String(adapter.mechanism ?? '').trim();
  if (mech !== '' && PROHIBITED_ACQUISITION.includes(mech)) {
    throw new Error(
      `R-2/§L.67: acquisition mechanism '${mech}' is prohibited (scraping / undocumented endpoints / ` +
      'unauthorised redistribution / unofficial feeds / unverified usage rights)',
    );
  }
  return true;
}
