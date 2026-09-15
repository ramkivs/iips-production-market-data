/**
 * R-2 — UI / PRODUCT DATA CONTRACT (provider-neutral projection)
 *
 * ── Authority ────────────────────────────────────────────────────────────────────────────────
 *   R-2 §B      — a future authorised provider must be replaceable **without** redesigning UI data
 *                 contracts. This projection is that contract: it is expressed only in
 *                 program-internal terms, so swapping the acquisition mechanism cannot change it.
 *   R-2 §C.16   — the canonical market-data contract must become the interface consumed by
 *                 downstream IIPS components, including existing UI integration points.
 *   R-2 §C.17   — add visible freshness/status: current-vs-stale, last successful refresh, data
 *                 source, data date/time, ingestion/availability status.
 *   R-2 §C.18/19 — do not redesign unrelated UI surfaces; no unrelated UX work.
 *   R-2 §C.20 / §P.82 — the objective is specifically that the existing IIPS UI does **not**
 *                 consume raw/provider-specific market-data structures.
 *   R-2 §P.83   — expose current state, freshness, source, timestamp, availability/status.
 *   R-2 §P.84/85 — preserve existing UI architecture and styling; make only the changes needed to
 *                 consume and visibly represent R-2 market-data status.
 *   R-2 §Q.87   — never present an old market price as current.
 *
 *   P01 INV-10 / NFR-06 (`docs/p01/P01_DATA_CONTRACT.md`:60) — **no provider leakage to product
 *   DTOs**. `assertNoProviderLeakage` enforces this at runtime, not by convention.
 *
 * ── ⚠ SCOPE LIMIT RECORDED HONESTLY ──────────────────────────────────────────────────────────
 *   R-2 §C.15 asks for existing UI integration "where the existing architecture permits it".
 *   On this branch (`arena/01a0853c-iips-production-market-data`) there is **no** UI to integrate
 *   with: `git ls-files` returns 0 files under `frontend/` and 0 under `iips-platform/`. The UI
 *   exists only on `arena/01a0853d-iips-production-market-data` and `m1-ad4-repair`, which this
 *   session may not switch to. So this module delivers the **contract** the UI will consume and
 *   the freshness view it must render; wiring it into `frontend/src/...` is reported as
 *   REQUIRES AUTHORITY DECISION in `docs/r2/R2_READINESS_REPORT.md` §5, not claimed as done.
 *
 * ── §Q.87 — enforcement, not convention ──────────────────────────────────────────────────────
 *   `projectQuote` nulls the price fields whenever freshness is not CURRENT. There is no code
 *   path that returns a price alongside a non-current status, so a UI rendering this DTO cannot
 *   present an old price as current even if it tried.
 */

import { PROVIDER_NATIVE_FIELDS } from './canonicalContract.js';
import { FRESHNESS_STATUS, usability } from './freshness.js';

/**
 * Assert that a product DTO carries no provider-native field name.
 *
 * @param {object} dto
 * @returns {true}
 * @throws {Error} naming the offending field
 */
export function assertNoProviderLeakage(dto) {
  const walk = (obj, path) => {
    for (const [k, v] of Object.entries(obj ?? {})) {
      if (PROVIDER_NATIVE_FIELDS.includes(k)) {
        throw new Error(`R-2/INV-10 (NFR-06) violation: provider-native field '${k}' at ${path}${k} reached a product DTO`);
      }
      if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, `${path}${k}.`);
    }
  };
  walk(dto, '');
  return true;
}

/**
 * The §C.17 visible status block. Field names are chosen to be render-ready so a UI needs no
 * further mapping — and so no provider term can creep in at the presentation layer.
 *
 * @param {ReturnType<import('./freshness.js').describeState>} freshness
 * @returns {object}
 */
export function projectStatus(freshness) {
  return Object.freeze({
    /** §C.17 current vs stale. */
    isCurrent: freshness.isCurrent === true,
    status: freshness.status,
    /** §Q.90 — what a scoring engine may do with this data. */
    usability: usability(freshness),
    /** §C.17 last successful refresh timestamp. */
    lastSuccessfulRefresh: freshness.lastSuccessfulRefresh,
    /** §C.17 data date/time. */
    dataDateTime: freshness.asOf,
    /** §C.17 data source. Program-internal identity, never an endpoint or filename. */
    dataSource: freshness.sourceId,
    ageMs: freshness.ageMs,
    thresholdMs: freshness.thresholdMs,
    missedRefreshes: freshness.missedRefreshes,
    /** Human-readable, safe to render verbatim. */
    statusNote: freshness.reason,
    /** §Q.86 — explicit instruction to the presentation layer. */
    renderGuidance: freshness.isCurrent
      ? 'may present as current market data'
      : `MUST be labelled ${freshness.status}; MUST NOT be presented as current (§Q.87)`,
  });
}

/**
 * Project a canonical bar into a product quote DTO.
 *
 * Prices are present **only** when the data is CURRENT (§Q.87). Values are otherwise `null`,
 * never a stale number, so no consumer can accidentally display them.
 *
 * @param {object} rec        canonical record
 * @param {ReturnType<import('./freshness.js').describeState>} freshness
 * @returns {object}
 */
export function projectQuote(rec, freshness) {
  const current = freshness.isCurrent === true;
  const dto = Object.freeze({
    instrument: Object.freeze({
      isin: rec.isin,
      symbol: rec.symbol,
      securityName: rec.securityName,
      exchange: rec.exchange,
      series: rec.series,
    }),
    tradeDate: rec.tradeDate,
    prices: Object.freeze({
      currency: rec.priceCurrency ?? 'INR',
      // §Q.87 — nulled unless current.
      open: current ? rec.open : null,
      high: current ? rec.high : null,
      low: current ? rec.low : null,
      close: current ? rec.close : null,
      lastPrice: current ? rec.lastPrice : null,
      previousClose: current ? rec.previousClose : null,
      pricesSuppressedBecauseNotCurrent: !current,
    }),
    activity: Object.freeze({
      volume: current ? rec.volume : null,
      tradedValue: current ? rec.tradedValue : null,
      transactionCount: current ? rec.transactionCount : null,
    }),
    status: projectStatus(freshness),
  });
  assertNoProviderLeakage(dto);
  return dto;
}

/**
 * Project the current market-state surface (§P.83): current state + freshness + source +
 * timestamp + availability/status, with quotes only when current.
 *
 * @param {object} input
 * @param {ReadonlyArray<object>} input.records   canonical records forming current state
 * @param {object} input.freshness
 * @param {number} [input.limit]
 * @returns {object}
 */
export function projectCurrentState({ records, freshness, limit = 50 }) {
  const rows = records.slice(0, limit).map((r) => projectQuote(r, freshness));
  const dto = Object.freeze({
    contract: Object.freeze({ name: 'iips.marketData.currentState', version: '1.0.0' }),
    status: projectStatus(freshness),
    count: records.length,
    quotes: Object.freeze(rows),
    /** §Q.86 — availability is stated even when there is nothing to show. */
    availability: freshness.status === FRESHNESS_STATUS.EMPTY
      ? 'NO_DATA_LOADED'
      : freshness.status === FRESHNESS_STATUS.UNAVAILABLE
        ? 'UNAVAILABLE'
        : freshness.status === FRESHNESS_STATUS.STALE
          ? 'STALE'
          : 'AVAILABLE',
  });
  assertNoProviderLeakage(dto);
  return dto;
}
