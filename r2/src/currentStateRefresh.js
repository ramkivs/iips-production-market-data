/**
 * R-2 — CURRENT-STATE REFRESH ENGINE
 *
 * ── Authority ────────────────────────────────────────────────────────────────────────────────
 *   R-2 §A.9/§A.10 — do **not** persist every 15-minute snapshot; refresh the current canonical
 *                    market state and retain the ingestion/freshness metadata needed for audit.
 *   R-2 §E.26 — current-state refresh/update logic, freshness tracking, failure handling, retry.
 *   R-2 §E.31 — current-state updates must be **idempotent and safe to repeat**.
 *   R-2 §E.32 — explicit behaviour for: successful refresh, partial refresh, no data, stale data,
 *               provider unavailable, malformed response, timeout, retry exhaustion.
 *   R-2 §Q.86 — if current data cannot be refreshed, clearly identify it as stale/unavailable.
 *   R-2 §Q.87 — never present an old market price as current.
 *
 * ── §A.9 — how "do not persist every snapshot" is satisfied ──────────────────────────────────
 *   `putCurrent` **replaces** the single current-state row; it never appends. Only the audit
 *   trail and the freshness metadata accumulate (§A.10). Repeating the same refresh therefore
 *   produces no additional stored snapshot — which is precisely §E.31 idempotency, and is
 *   asserted by `currentStateRefresh.test.js` ("repeat refresh stores no additional snapshot").
 *
 * ── §E.32 / §Q.86 — the previous state is never silently overwritten ─────────────────────────
 *   On any non-success the engine **retains** the last known data but marks it non-current, so
 *   the UI can show "last successful refresh 14:05 — STALE" instead of either (a) implying the
 *   old price is current, or (b) blanking a surface that legitimately has a recent value.
 *   `preserveLastKnown: true` is the default and is what makes §Q.87 hold while §Q.86 also holds.
 */

import { E, providerError, classifyQuality } from './errorTaxonomy.js';
import { describeState, FRESHNESS_STATUS, staleAfterMs } from './freshness.js';
import { filterEligible } from './equityEligibility.js';
import { normalizeAll } from './normalization.js';
import { assessRecord, QV } from './qualityValidation.js';
import { requireCapability, CAPABILITY, describeGate } from './providerAdapter.js';
import { ingestEodRows } from './eodIngestion.js';

/** Outcomes of a refresh attempt. Closed enumeration; §E.32 names each one. */
export const REFRESH_OUTCOME = Object.freeze({
  SUCCESS: 'success',
  PARTIAL: 'partial',
  NO_DATA: 'noData',
  STALE: 'stale',
  PROVIDER_UNAVAILABLE: 'providerUnavailable',
  MALFORMED: 'malformed',
  TIMEOUT: 'timeout',
  RETRY_EXHAUSTED: 'retryExhausted',
  AUTHENTICATION_FAILURE: 'authenticationFailure',
  ENTITLEMENT_EXPIRED: 'entitlementExpired',
  CAPABILITY_UNSUPPORTED: 'capabilityUnsupported',
  GATED: 'externallyGated',
});

const CODE_TO_OUTCOME = Object.freeze({
  [E.E1]: REFRESH_OUTCOME.PROVIDER_UNAVAILABLE,
  [E.E2]: REFRESH_OUTCOME.AUTHENTICATION_FAILURE,
  [E.E3]: REFRESH_OUTCOME.ENTITLEMENT_EXPIRED,
  [E.E4]: REFRESH_OUTCOME.TIMEOUT,
  [E.E5]: REFRESH_OUTCOME.MALFORMED,
  [E.E6]: REFRESH_OUTCOME.CAPABILITY_UNSUPPORTED,
  [E.E7]: REFRESH_OUTCOME.PROVIDER_UNAVAILABLE,
  [E.E8]: REFRESH_OUTCOME.MALFORMED,
});

/**
 * Create the current-state refresh engine.
 *
 * @param {object} deps
 * @param {object} deps.adapter   bound provider adapter
 * @param {object} deps.store     a `MarketDataStore`
 * @param {object} [deps.opts]
 * @param {number} [deps.opts.refreshIntervalMs]
 * @param {number} [deps.opts.staleAfterIntervals]
 * @param {boolean} [deps.opts.preserveLastKnown]  default true (§Q.86 + §Q.87 together)
 * @param {boolean} [deps.opts.allowGatedAdapter]  default false — a gated adapter may not serve production
 * @returns {object}
 */
export function createCurrentStateEngine(deps) {
  const { adapter, store } = deps;
  const opts = deps.opts ?? {};
  const preserveLastKnown = opts.preserveLastKnown !== false;
  const allowGatedAdapter = opts.allowGatedAdapter === true;

  let lastSuccessfulRefreshMs = null;
  let lastAttemptMs = null;
  let lastOutcome = null;
  let lastError = null;
  let currentAsOf = null;
  let currentSourceId = null;
  let hasData = false;

  function state(nowMs) {
    return describeState(
      { lastSuccessfulRefreshMs, asOf: currentAsOf, sourceId: currentSourceId, hasData },
      { nowMs, refreshIntervalMs: opts.refreshIntervalMs, staleAfterIntervals: opts.staleAfterIntervals },
    );
  }

  function finish(outcome, nowMs, detail = {}) {
    lastAttemptMs = nowMs;
    lastOutcome = outcome;
    return Object.freeze({
      outcome,
      at: nowMs,
      quality: detail.quality ?? null,
      error: detail.error ?? null,
      accepted: detail.accepted ?? 0,
      rejected: detail.rejected ?? 0,
      quarantined: detail.quarantined ?? 0,
      eligible: detail.eligible ?? 0,
      sourceRef: detail.sourceRef ?? null,
      dataVersion: detail.dataVersion ?? null,
      freshness: state(nowMs),
    });
  }

  return Object.freeze({
    /**
     * Perform one current-state refresh.
     *
     * @param {object} req
     * @param {number} req.nowMs              injected clock (determinism)
     * @param {string} [req.asOf]             ISO-8601 UTC market-data time
     * @param {string} [req.ingestionTimestamp]
     * @returns {object} refresh result
     */
    refresh(req) {
      const nowMs = req.nowMs ?? 0;
      const ingestionTimestamp = req.ingestionTimestamp ?? new Date(nowMs).toISOString();

      // §L.66 / §E.27 — a gated adapter must not silently serve production acquisition.
      const gate = describeGate(adapter);
      if (gate.open && !allowGatedAdapter) {
        lastError = providerError(E.E3, { reason: `acquisition gate outstanding: ${gate.outstanding.join(', ')}`, at: ingestionTimestamp });
        return finish(REFRESH_OUTCOME.GATED, nowMs, { error: lastError, quality: 'unavailable' });
      }

      // §B / P02 E6 — pre-flight capability check, before any provider call.
      const cap = requireCapability(adapter, CAPABILITY.CURRENT_STATE);
      if (!cap.ok) {
        lastError = cap.error;
        return finish(REFRESH_OUTCOME.CAPABILITY_UNSUPPORTED, nowMs, { error: cap.error, quality: null });
      }

      const result = adapter.fetchCurrentState({ asOf: req.asOf });

      if (!result || result.ok !== true) {
        const err = result?.error ?? providerError(E.E1, { reason: 'adapter returned no result', at: ingestionTimestamp });
        lastError = err;
        const outcome = err.code === E.E4 && err.retryable === false ? REFRESH_OUTCOME.RETRY_EXHAUSTED : (CODE_TO_OUTCOME[err.code] ?? REFRESH_OUTCOME.PROVIDER_UNAVAILABLE);
        return finish(outcome, nowMs, { error: err, quality: classifyQuality(err.code) ?? (preserveLastKnown && hasData ? 'stale' : 'unavailable') });
      }

      const rows = result.rows ?? [];
      if (rows.length === 0) {
        // §E.32 "no data" — distinct from a failure. Nothing was wrong; there was simply nothing.
        if (!hasData) return finish(REFRESH_OUTCOME.NO_DATA, nowMs, { quality: 'empty' });
        return finish(REFRESH_OUTCOME.NO_DATA, nowMs, { quality: preserveLastKnown ? 'stale' : 'empty' });
      }

      const lineage = {
        provider: adapter.id,
        dataVersion: result.dataVersion ?? `cur-${nowMs}`,
        asOf: result.asOf ?? req.asOf ?? ingestionTimestamp,
        ingestionTimestamp,
      };

      // Run the full pipeline: eligibility → normalize → quality. Current state obeys the same
      // §F.39 equity filter as EOD — a debt row must not enter current state either.
      const ingested = ingestEodRows({
        rows,
        malformedFromParser: result.malformed ?? [],
        lineage,
        store,
        mode: 'current',
        now: ingestionTimestamp,
      });

      const freshness = state(nowMs);
      currentAsOf = lineage.asOf;
      currentSourceId = adapter.id;
      hasData = true;
      lastSuccessfulRefreshMs = nowMs;
      lastError = null;

      // §E.30 — replace, never append.
      store.putCurrent({
        asOf: lineage.asOf,
        sourceId: adapter.id,
        sourceRef: result.sourceRef ?? null,
        dataVersion: lineage.dataVersion,
        ingestionTimestamp,
        acceptedCount: ingested.metrics.acceptedCount,
        freshnessAtUpdate: freshness,
      });

      // §E.32 "partial refresh": rows arrived but some were rejected/quarantined, or the parser
      // reported malformed lines. Reported, never hidden (§J — never silently accepted).
      // §E.32 "partial refresh": rows arrived but some were rejected/quarantined, or the parser
      // reported malformed lines. The metric keys are the §J names (…Count), and reading them
      // correctly is what makes the partial branch reachable at all.
      const m = ingested.metrics;
      const partial = m.rejectedCount > 0 || m.quarantinedCount > 0 || (result.malformed?.length ?? 0) > 0;
      const outcome = partial ? REFRESH_OUTCOME.PARTIAL : REFRESH_OUTCOME.SUCCESS;

      return finish(outcome, nowMs, {
        quality: partial ? 'partial' : 'current',
        accepted: m.acceptedCount,
        rejected: m.rejectedCount,
        quarantined: m.quarantinedCount,
        eligible: m.eligibleEquityCount,
        sourceRef: result.sourceRef ?? null,
        dataVersion: lineage.dataVersion,
      });
    },

    /** §C.17 / §Q.90 — the freshness view the UI and engines consume. */
    freshnessAt(nowMs) {
      return state(nowMs);
    },

    lastAttempt() {
      return Object.freeze({ at: lastAttemptMs, outcome: lastOutcome, error: lastError });
    },

    /**
     * §E.32 "stale data" as an explicit, callable check rather than an implicit one.
     * @param {number} nowMs
     */
    isStale(nowMs) {
      return state(nowMs).status === FRESHNESS_STATUS.STALE;
    },

    staleAfterMs: staleAfterMs(opts),
  });
}

/** Re-exported for callers that only need the eligibility/quality split. */
export { filterEligible, normalizeAll, assessRecord, QV };
