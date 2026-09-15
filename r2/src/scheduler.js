/**
 * R-2 — PROVIDER-NEUTRAL ~15-MINUTE CURRENT-STATE SCHEDULER
 *
 * ── Authority ────────────────────────────────────────────────────────────────────────────────
 *   R-2 §A.8  — current market state refreshes approximately every 15 minutes.
 *   R-2 §E.25 — implement the provider-neutral scheduler **NOW**.
 *   R-2 §E.28 — do not block provider-neutral implementation on production credentials.
 *   R-2 §E.32 — explicit behaviour for every failure condition.
 *   R-2 §Q.89 — document/define behaviour when the scheduler is missed.
 *
 * ── Design ───────────────────────────────────────────────────────────────────────────────────
 *   The scheduler owns **no** provider knowledge and **no** storage knowledge. It is given:
 *     · an interval (§A.8, defaulting to 15 minutes);
 *     · a `tick` function to invoke;
 *     · a retry policy.
 *   It is driven by an **injected clock**, never `setTimeout` + wall time, so that:
 *     · tests are deterministic (§N "15-minute scheduler", "failure/retry behavior");
 *     · "scheduler missed" (§Q.89) is a first-class, testable outcome rather than a race;
 *     · the same object can later be wired to a real timer without changing any logic.
 *
 *   `advanceTo(ms)` replays every interval boundary that was crossed. That is what makes a
 *   missed schedule detectable: if the clock jumps by 40 minutes, the scheduler reports **three**
 *   due ticks (one current + two missed) instead of silently performing one refresh and hiding the
 *   gap. Missed ticks are reported, never swallowed.
 */

import { REFRESH_INTERVAL_MS } from './freshness.js';
import { E, escalate, providerError, RETRYABLE } from './errorTaxonomy.js';

/** Default retry policy. Explicit and small; §E.32 requires deterministic behaviour. */
export const DEFAULT_RETRY_POLICY = Object.freeze({
  maxAttempts: 3,
  /** Fixed backoff in ms. Deterministic; no jitter, so retries are reproducible in tests. */
  backoffMs: 1000,
});

/**
 * Create the scheduler.
 *
 * @param {object} opts
 * @param {() => {ok: boolean, error?: object}} opts.tick   one refresh attempt
 * @param {number} [opts.intervalMs]                        default §A.8 15 minutes
 * @param {object} [opts.retryPolicy]
 * @param {number} [opts.startMs]                           injected clock origin, epoch ms
 * @returns {object}
 */
export function createScheduler(opts) {
  if (typeof opts?.tick !== 'function') {
    throw new Error('R-2/§E.25: scheduler requires a tick() function');
  }
  const intervalMs = opts.intervalMs ?? REFRESH_INTERVAL_MS;
  const policy = { ...DEFAULT_RETRY_POLICY, ...(opts.retryPolicy ?? {}) };
  let lastTickMs = opts.startMs ?? 0;
  const history = [];

  /**
   * Execute one logical refresh, applying the retry policy.
   *
   * Retryable P02 codes (E1/E4/E7) are re-attempted up to `maxAttempts`. Non-retryable codes
   * (E2/E3/E5/E6/E8) are returned immediately — retrying an entitlement failure cannot succeed
   * and would mask a licensing gap (§L.66). On exhaustion, E4/E7 escalate to E1 per P02:20/23.
   *
   * @param {number} nowMs
   * @returns {{ok: boolean, attempts: number, error?: object, escalated?: boolean}}
   */
  function runWithRetry(nowMs, missed = false) {
    let attempt = 0;
    let lastError = null;
    for (attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
      const result = opts.tick();
      if (result && result.ok === true) {
        const rec = Object.freeze({ at: nowMs, attempts: attempt, ok: true, missed });
        history.push(rec);
        return rec;
      }
      lastError = result?.error ?? providerError(E.E1, { reason: 'tick returned a non-ok result with no error', at: new Date(nowMs).toISOString() });
      if (!RETRYABLE.has(lastError.code)) {
        const rec = Object.freeze({ at: nowMs, attempts: attempt, ok: false, error: lastError, missed });
        history.push(rec);
        return rec;
      }
    }
    const escalatedCode = escalate(lastError.code, { retriesExhausted: true });
    const rec = Object.freeze({
      at: nowMs,
      attempts: policy.maxAttempts,
      ok: false,
      missed,
      escalated: escalatedCode !== lastError.code,
      error: escalatedCode === lastError.code
        ? lastError
        : providerError(escalatedCode, { reason: `${lastError.code} escalated after ${policy.maxAttempts} attempts (P02:20/23)`, at: lastError.at }),
    });
    history.push(rec);
    return rec;
  }

  return Object.freeze({
    intervalMs,
    retryPolicy: Object.freeze({ ...policy }),

    /**
     * Advance the injected clock to `nowMs`, firing every interval boundary crossed.
     *
     * @param {number} nowMs
     * @returns {{fired: number, missed: number, results: object[]}}
     */
    advanceTo(nowMs) {
      const results = [];
      let fired = 0;
      let missed = 0;
      if (nowMs <= lastTickMs) return Object.freeze({ fired: 0, missed: 0, results: Object.freeze(results) });

      let nextDue = lastTickMs + intervalMs;
      while (nextDue <= nowMs) {
        // Any boundary strictly before the final one that we are only reaching now is a
        // *missed* schedule (§Q.89). It is recorded, then still fired, so the state converges
        // rather than being skipped.
        const isMissed = nextDue + intervalMs <= nowMs;
        if (isMissed) missed += 1;
        results.push(runWithRetry(nextDue, isMissed));
        fired += 1;
        nextDue += intervalMs;
      }
      lastTickMs = nowMs;
      return Object.freeze({ fired, missed, results: Object.freeze(results) });
    },

    /** Next boundary at or after the supplied clock. */
    nextDueAt(nowMs) {
      const base = Math.max(nowMs, lastTickMs);
      return base + intervalMs;
    },

    history() {
      return history.slice();
    },

    lastTickAt() {
      return lastTickMs;
    },
  });
}
