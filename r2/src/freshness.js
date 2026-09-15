/**
 * R-2 — FRESHNESS / STALENESS CONTROL
 *
 * ── Authority ────────────────────────────────────────────────────────────────────────────────
 *   R-2 §A.8  — current market state refreshes approximately **EVERY 15 MINUTES**.
 *   R-2 §C.17 — visible freshness/status: current-vs-stale, last successful refresh, data source,
 *               data date/time, ingestion/availability status.
 *   R-2 §Q.86 — if current data cannot be refreshed, IIPS must clearly identify it as
 *               stale/unavailable.
 *   R-2 §Q.87 — **never present an old market price as current.**
 *   R-2 §Q.88 — define a **deterministic** freshness threshold.
 *   R-2 §Q.90 — downstream scoring/analytics must be able to distinguish valid current data from
 *               stale/unavailable data.
 *
 * ── §Q.88 — the threshold, and why it is derived rather than chosen ──────────────────────────
 *   `staleAfterMs = refreshIntervalMs × staleAfterIntervals`. With the §A.8 15-minute interval and
 *   `staleAfterIntervals = 2`, data is stale once it is older than 30 minutes — i.e. after one
 *   missed refresh. Deriving the threshold from the interval means changing the refresh cadence
 *   cannot silently leave a stale threshold behind, and the number is never a magic constant.
 *
 *   Two intervals (not one) is deliberate: a single missed tick must not flip the UI to "stale",
 *   because §A.8 says *approximately* 15 minutes and network jitter is normal. Two missed ticks
 *   is a real outage. The multiplier is configuration, not a hard-coded assumption.
 *
 * ── §Q.87 — how "never present an old price as current" is enforced structurally ─────────────
 *   `describeState` never returns `isCurrent: true` unless the data is within threshold AND the
 *   last refresh outcome was a success. A stale record therefore carries `isCurrent: false` and a
 *   `status` of `STALE`; `uiDataContract.js` refuses to project prices as current when
 *   `isCurrent` is false. The guarantee is not a convention — it is the only code path.
 */

/** §A.8 — the accepted refresh interval. */
export const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

/** Missed refreshes tolerated before data is declared stale. */
export const DEFAULT_STALE_AFTER_INTERVALS = 2;

/** Visibility states. Uppercase, stable, and safe to render verbatim. */
export const FRESHNESS_STATUS = Object.freeze({
  CURRENT: 'CURRENT',
  STALE: 'STALE',
  UNAVAILABLE: 'UNAVAILABLE',
  EMPTY: 'EMPTY',
});

/**
 * Compute the deterministic staleness threshold.
 *
 * @param {object} [opts]
 * @param {number} [opts.refreshIntervalMs]
 * @param {number} [opts.staleAfterIntervals]
 * @returns {number} milliseconds
 */
export function staleAfterMs(opts = {}) {
  const interval = opts.refreshIntervalMs ?? REFRESH_INTERVAL_MS;
  const multiplier = opts.staleAfterIntervals ?? DEFAULT_STALE_AFTER_INTERVALS;
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new Error('R-2/§Q.88: refreshIntervalMs must be a positive finite number');
  }
  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    throw new Error('R-2/§Q.88: staleAfterIntervals must be a positive finite number');
  }
  return interval * multiplier;
}

/**
 * Describe the freshness of current market state.
 *
 * Pure: the clock is injected (`nowMs`), so tests are deterministic and the function cannot
 * disagree with itself across a run.
 *
 * @param {object} state
 * @param {number|null} [state.lastSuccessfulRefreshMs]  epoch ms of last SUCCESSFUL refresh
 * @param {string|null} [state.asOf]                    market-data time, ISO-8601 UTC
 * @param {boolean} [state.hasData]
 * @param {string|null} [state.sourceId]
 * @param {object} [opts]
 * @param {number} [opts.nowMs]        injected clock, epoch ms
 * @param {number} [opts.refreshIntervalMs]
 * @param {number} [opts.staleAfterIntervals]
 * @returns {{status: string, isCurrent: boolean, ageMs: number|null, thresholdMs: number,
 *            lastSuccessfulRefresh: string|null, asOf: string|null, sourceId: string|null,
 *            missedRefreshes: number|null, reason: string}}
 */
export function describeState(state = {}, opts = {}) {
  const nowMs = opts.nowMs ?? 0;
  const thresholdMs = staleAfterMs(opts);
  const last = state.lastSuccessfulRefreshMs ?? null;
  const asOf = state.asOf ?? null;
  const sourceId = state.sourceId ?? null;
  const hasData = state.hasData === true;

  const base = { thresholdMs, lastSuccessfulRefresh: last === null ? null : new Date(last).toISOString(), asOf, sourceId };

  if (!hasData) {
    return Object.freeze({
      ...base, status: FRESHNESS_STATUS.EMPTY, isCurrent: false, ageMs: null,
      missedRefreshes: null, reason: 'no current market state has ever been successfully loaded',
    });
  }
  if (last === null) {
    return Object.freeze({
      ...base, status: FRESHNESS_STATUS.UNAVAILABLE, isCurrent: false, ageMs: null,
      missedRefreshes: null, reason: 'data present but no successful refresh recorded (§Q.86)',
    });
  }

  const ageMs = nowMs - last;
  const interval = opts.refreshIntervalMs ?? REFRESH_INTERVAL_MS;
  const missedRefreshes = Math.max(0, Math.floor(ageMs / interval) - 1);

  if (ageMs > thresholdMs) {
    return Object.freeze({
      ...base, status: FRESHNESS_STATUS.STALE, isCurrent: false, ageMs, missedRefreshes,
      reason: `age ${ageMs}ms exceeds the deterministic threshold ${thresholdMs}ms (§Q.88); data must not be presented as current (§Q.87)`,
    });
  }
  return Object.freeze({
    ...base, status: FRESHNESS_STATUS.CURRENT, isCurrent: true, ageMs, missedRefreshes,
    reason: `age ${ageMs}ms is within the deterministic threshold ${thresholdMs}ms`,
  });
}

/**
 * §Q.90 — the discrimination contract downstream engines consume.
 *
 * Returns a small, closed enumeration rather than a boolean, because "stale" and "unavailable"
 * require different handling: stale data may still be usable for a clearly-labelled historical
 * view, whereas unavailable data must produce no verdict at all. Collapsing them would make
 * §Q.90 unsatisfiable.
 *
 * @param {ReturnType<typeof describeState>} freshness
 * @returns {'USABLE_CURRENT'|'STALE_NOT_CURRENT'|'NOT_USABLE'}
 */
export function usability(freshness) {
  if (!freshness || freshness.isCurrent !== true) {
    return freshness && freshness.status === FRESHNESS_STATUS.STALE ? 'STALE_NOT_CURRENT' : 'NOT_USABLE';
  }
  return 'USABLE_CURRENT';
}
