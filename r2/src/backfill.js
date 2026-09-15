/**
 * R-2 — CONFIGURABLE HISTORICAL BACKFILL
 *
 * ── Authority ────────────────────────────────────────────────────────────────────────────────
 *   R-2 §A.11 — historical requirement: TEN YEARS of DAILY equity data.
 *   R-2 §I.50 — implement **configurable** backfill.
 *   R-2 §I.51 — default range: most recent ten years of daily equity history.
 *   R-2 §I.52 — do **NOT** hard-code a permanent fixed ten-year window.
 *   R-2 §I.53 — support explicit start, explicit end, default 10-year range, incremental
 *               backfill, restart/resume, idempotent reprocessing.
 *   R-2 §I.54 — historical **availability** must be reported **separately** from requested range.
 *   R-2 §I.55 — do NOT claim ten years are populated until actual source data has been
 *               successfully loaded and reconciled.
 *   R-2 §I.56 — must not silently substitute synthetic data for real historical data.
 *   R-2 §I.57 — where production data cannot yet be obtained, implement and test the mechanism
 *               with clearly labelled synthetic fixtures and **report the external dependency**.
 *
 * ── §I.52 — how "not hard-coded" is enforced ─────────────────────────────────────────────────
 *   Ten years exists exactly once, as `DEFAULT_BACKFILL_YEARS = 10`, and only as a **default**
 *   that any caller may override. `planBackfill` never consults it unless `years` is supplied and
 *   `from`/`to` are not. A permanent fixed window is therefore structurally impossible.
 *
 * ── §I.54/§I.55 — the requested/populated separation ─────────────────────────────────────────
 *   `planBackfill` returns `requested`, which is pure intent. Only `runBackfill` — after real
 *   ingestion — returns `populated`, derived from what the store actually holds. The two are
 *   different objects on purpose: a caller cannot accidentally report `requested` as coverage,
 *   which is exactly the failure §I.55 prohibits.
 */

import { ingestFile } from './eodIngestion.js';

/** §I.51 default. The ONLY place ten years appears, and only as an overridable default. */
export const DEFAULT_BACKFILL_YEARS = 10;

/**
 * Enumerate ISO trading *calendar* days in a range.
 *
 * NSE market holidays are **not** encoded here: doing so would require an authoritative holiday
 * calendar that this repository does not contain, and inventing one would silently mark real
 * trading days as expected-absent. Instead every calendar day is a candidate and a missing day is
 * reported as `unavailable`, so absence is visible rather than assumed (§I.54).
 *
 * @param {string} from  YYYY-MM-DD inclusive
 * @param {string} to    YYYY-MM-DD inclusive
 * @returns {string[]}
 */
export function enumerateDays(from, to) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw new Error('R-2/§I.53: from/to must be YYYY-MM-DD');
  }
  if (from > to) throw new Error(`R-2/§I.53: from (${from}) must not be after to (${to})`);
  const out = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

/**
 * Build a backfill plan (§I.53).
 *
 * @param {object} [opts]
 * @param {string} [opts.from]          explicit start
 * @param {string} [opts.to]            explicit end
 * @param {number} [opts.years]         default-range length in years (§I.51/§I.52)
 * @param {number} [opts.nowMs]         injected clock; anchors the default range
 * @param {string[]} [opts.completedDays]  days already done, for incremental/resume (§I.53)
 * @returns {{requested: {from: string, to: string, days: number}, pendingDays: string[],
 *            completedDays: string[], incremental: boolean, resumed: boolean}}
 */
export function planBackfill(opts = {}) {
  const nowMs = opts.nowMs ?? 0;
  const to = opts.to ?? new Date(nowMs).toISOString().slice(0, 10);
  let from = opts.from;
  if (!from) {
    const years = opts.years ?? DEFAULT_BACKFILL_YEARS;
    const d = new Date(`${to}T00:00:00Z`);
    d.setUTCFullYear(d.getUTCFullYear() - years);
    d.setUTCDate(d.getUTCDate() + 1);
    from = d.toISOString().slice(0, 10);
  }

  const allDays = enumerateDays(from, to);
  const completed = new Set(opts.completedDays ?? []);
  const pendingDays = allDays.filter((d) => !completed.has(d));

  return Object.freeze({
    requested: Object.freeze({ from, to, days: allDays.length }),
    pendingDays: Object.freeze(pendingDays),
    completedDays: Object.freeze(allDays.filter((d) => completed.has(d))),
    incremental: completed.size > 0,
    resumed: completed.size > 0 && pendingDays.length > 0,
  });
}

/**
 * Execute a backfill plan against a file-source map.
 *
 * @param {object} input
 * @param {object} input.plan              output of `planBackfill`
 * @param {object} input.store
 * @param {(day: string) => ({text: string, sourceRef: string, sourceTimestamp: string}|null)} input.resolveDay
 *        resolve one trading day to raw source text, or `null` when unavailable. Returning `null`
 *        is how §I.54 unavailability is expressed — never by fabricating a row (§I.56).
 * @param {(day: string) => object} input.lineageFor
 * @param {object} [input.onProgress]      { onDay(day, result) }
 * @returns {{requested: object, populated: object, unavailableDays: string[], failedDays: object[],
 *            metrics: object, syntheticUsed: boolean}}
 */
export function runBackfill(input) {
  const { plan, store, resolveDay, lineageFor } = input;
  const unavailableDays = [];
  const failedDays = [];
  const agg = {
    sourceRecordCount: 0, eligibleEquityCount: 0, acceptedCount: 0, rejectedCount: 0,
    quarantinedCount: 0, duplicateCount: 0,
  };
  const populatedDays = new Set();
  let syntheticUsed = false;

  for (const day of plan.pendingDays) {
    const source = resolveDay(day);
    if (!source) {
      // §I.54 — unavailable is reported, not papered over. §I.56 — nothing is substituted.
      unavailableDays.push(day);
      if (input.onProgress) input.onProgress(day, { ok: false, unavailable: true });
      continue;
    }
    if (source.synthetic === true) syntheticUsed = true;

    const lineage = lineageFor(day);
    const result = ingestFile({
      text: source.text,
      sourceRef: source.sourceRef,
      sourceId: source.sourceId ?? lineage.provider,
      sourceTimestamp: source.sourceTimestamp,
      lineage,
      store,
      now: lineage.ingestionTimestamp,
    });

    if (!result.ok) {
      failedDays.push(Object.freeze({ day, code: result.error?.code ?? 'UNKNOWN', reason: result.error?.reason ?? 'unknown' }));
      if (input.onProgress) input.onProgress(day, result);
      continue;
    }

    for (const k of Object.keys(agg)) {
      if (typeof result.metrics[k] === 'number') agg[k] += result.metrics[k];
    }
    if (result.metrics.acceptedCount > 0) populatedDays.add(day);
    if (input.onProgress) input.onProgress(day, result);
  }

  const sortedPopulated = [...populatedDays].sort();

  // §I.55 — coverage is derived from what was actually loaded, and only reported as populated
  // when the day produced accepted canonical records. Requested range is echoed separately.
  return Object.freeze({
    requested: plan.requested,
    populated: Object.freeze({
      days: sortedPopulated.length,
      from: sortedPopulated[0] ?? null,
      to: sortedPopulated[sortedPopulated.length - 1] ?? null,
      dayList: Object.freeze(sortedPopulated),
      /** True only when the populated set exactly covers the requested set. */
      satisfiesRequestedRange: sortedPopulated.length === plan.requested.days,
    }),
    unavailableDays: Object.freeze(unavailableDays),
    failedDays: Object.freeze(failedDays),
    metrics: Object.freeze({ ...agg, daysPopulated: sortedPopulated.length, daysUnavailable: unavailableDays.length, daysFailed: failedDays.length }),
    /** §I.56 — surfaced so a report can never quietly claim synthetic data as real history. */
    syntheticUsed,
  });
}
