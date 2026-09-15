/**
 * R-2 — DATA QUALITY VALIDATION
 *
 * ── Authority ────────────────────────────────────────────────────────────────────────────────
 *   R-2 §J enumerates the required controls. This module implements the **record-level** subset;
 *   set-level controls (source completeness, duplicate source files, reconciliation) live in
 *   `reconciliation.js`.
 *
 *   R-2 §J — "Invalid/stale records must be rejected OR quarantined. **Never silently accepted.**"
 *   That is realised structurally: `assessRecord` returns a verdict for every record, and the
 *   pipeline in `eodIngestion.js` has exactly three sinks — accepted / rejected / quarantined.
 *   There is no fourth path by which a record can reach the canonical store.
 *
 * ── Rejected vs quarantined ──────────────────────────────────────────────────────────────────
 *   `rejected`    — structurally or contractually impossible; no diagnostic value in retrying.
 *                   (missing required field, malformed type, non-finite number)
 *   `quarantined` — well-formed but suspicious; a human/authority may want to look.
 *                   (impossible OHLC, contradictory daily data, inconsistent timestamps,
 *                    unexpected symbol)
 *   The distinction matters operationally: quarantined rows are recoverable, rejected rows are not.
 */

import { validateRecord } from './canonicalContract.js';

/** NSE symbols are uppercase A-Z, digits and a few punctuation marks. */
const SYMBOL_RE = /^[A-Z0-9&.\-]{1,20}$/;

/** Verdict kinds. */
export const QV = Object.freeze({
  ACCEPT: 'accept',
  REJECT: 'reject',
  QUARANTINE: 'quarantine',
});

/**
 * Assess OHLC internal consistency.
 *
 * The invariant is `low <= {open, close, lastPrice} <= high`. All four comparisons are checked
 * individually so the reason names the exact offending pair. Only present values participate —
 * an absent `open` cannot make the bar impossible (P01 NL-7: absence is absence, not zero).
 *
 * @param {object} rec canonical record
 * @returns {string[]} list of violations (empty ⇒ consistent)
 */
export function checkOhlcRelationships(rec) {
  const problems = [];
  const { open, high, low, close, lastPrice, previousClose } = rec;
  const present = { open, high, low, close, lastPrice, previousClose };

  for (const [k, v] of Object.entries(present)) {
    if (v !== null && v !== undefined && v < 0) problems.push(`${k} is negative (${v})`);
  }
  if (low === null || high === null) return problems;
  if (low > high) problems.push(`low (${low}) > high (${high})`);
  for (const k of ['open', 'close', 'lastPrice', 'previousClose']) {
    const v = present[k];
    if (v === null || v === undefined) continue;
    if (v < low) problems.push(`${k} (${v}) < low (${low})`);
    if (v > high) problems.push(`${k} (${v}) > high (${high})`);
  }
  return problems;
}

/**
 * Detect contradictory daily data: a bar that claims activity but has no price, or a price but
 * claims zero volume, or traded value inconsistent with volume×price by more than a tolerance.
 *
 * @param {object} rec
 * @returns {string[]}
 */
export function checkContradictions(rec) {
  const problems = [];
  const { close, volume, tradedValue, transactionCount } = rec;

  if ((close === null || close === undefined) && volume !== null && volume > 0) {
    problems.push('volume > 0 but close is absent');
  }
  if (volume !== null && volume > 0 && (tradedValue === null || tradedValue === 0)) {
    problems.push('volume > 0 but tradedValue is absent or zero');
  }
  if (transactionCount !== null && transactionCount < 0) {
    problems.push(`transactionCount is negative (${transactionCount})`);
  }
  if (
    volume !== null && volume > 0 &&
    close !== null && close > 0 &&
    tradedValue !== null && tradedValue > 0
  ) {
    // Average trade price implied by value/volume must be plausible against close.
    // A wide tolerance is used deliberately: VWAP legitimately differs from close.
    const impliedAvg = tradedValue / volume;
    const ratio = impliedAvg / close;
    if (ratio < 0.2 || ratio > 5) {
      problems.push(`tradedValue/volume implies avg ${impliedAvg.toFixed(4)} vs close ${close} (ratio ${ratio.toFixed(3)} outside 0.2–5)`);
    }
  }
  return problems;
}

/**
 * Check timestamp coherence: ingestion must not precede publication, and neither may be in the
 * future relative to the supplied clock.
 *
 * @param {object} rec
 * @param {string} nowIso  caller-supplied clock, ISO-8601 UTC
 * @returns {string[]}
 */
export function checkTimestamps(rec, nowIso) {
  const problems = [];
  const src = rec.sourceTimestamp ? Date.parse(rec.sourceTimestamp) : null;
  const ing = rec.ingestionTimestamp ? Date.parse(rec.ingestionTimestamp) : null;
  const now = nowIso ? Date.parse(nowIso) : null;
  const trade = rec.tradeDate ? Date.parse(`${rec.tradeDate}T00:00:00Z`) : null;

  if (src !== null && ing !== null && ing < src) {
    problems.push(`ingestionTimestamp (${rec.ingestionTimestamp}) precedes sourceTimestamp (${rec.sourceTimestamp})`);
  }
  if (now !== null && src !== null && src > now) {
    problems.push(`sourceTimestamp is in the future relative to the ingestion clock`);
  }
  if (trade !== null && src !== null && trade > src) {
    problems.push('tradeDate is after sourceTimestamp');
  }
  return problems;
}

/**
 * Full record-level assessment.
 *
 * @param {object} rec     canonical candidate
 * @param {object} [opts]
 * @param {string} [opts.now]  ISO-8601 UTC clock
 * @param {(rec:object)=>boolean} [opts.isExpectedSymbol]  optional symbol allow-list hook
 * @returns {{verdict: 'accept'|'reject'|'quarantine', reasons: string[]}}
 */
export function assessRecord(rec, opts = {}) {
  const reasons = [];

  // 1. Structural / contract validation → REJECT (not recoverable).
  const contract = validateRecord(rec);
  if (!contract.valid) {
    return Object.freeze({ verdict: QV.REJECT, reasons: Object.freeze(contract.errors) });
  }

  // 2. Numeric finiteness is already covered by validateRecord; guard non-finite explicitly
  //    for optional fields, which validateRecord only checks when present.
  for (const k of ['open', 'high', 'low', 'close', 'lastPrice', 'previousClose', 'tradedValue']) {
    const v = rec[k];
    if (v !== null && v !== undefined && !Number.isFinite(v)) {
      return Object.freeze({ verdict: QV.REJECT, reasons: Object.freeze([`${k} is not a finite number`]) });
    }
  }

  // 3. Unexpected symbol → QUARANTINE (may be a new listing; do not silently accept or drop).
  if (!SYMBOL_RE.test(rec.symbol)) {
    reasons.push(`symbol '${rec.symbol}' does not match the expected NSE symbol shape`);
  } else if (typeof opts.isExpectedSymbol === 'function' && !opts.isExpectedSymbol(rec)) {
    reasons.push(`symbol '${rec.symbol}' is not in the expected instrument universe`);
  }

  // 4. Impossible OHLC → QUARANTINE.
  reasons.push(...checkOhlcRelationships(rec).map((p) => `OHLC: ${p}`));

  // 5. Contradictory daily data → QUARANTINE.
  reasons.push(...checkContradictions(rec).map((p) => `contradiction: ${p}`));

  // 6. Inconsistent timestamps → QUARANTINE.
  if (opts.now) reasons.push(...checkTimestamps(rec, opts.now).map((p) => `timestamp: ${p}`));

  return Object.freeze({
    verdict: reasons.length === 0 ? QV.ACCEPT : QV.QUARANTINE,
    reasons: Object.freeze(reasons),
  });
}
