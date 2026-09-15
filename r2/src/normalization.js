/**
 * R-2 — DETERMINISTIC NORMALIZATION
 *
 * ── Authority ────────────────────────────────────────────────────────────────────────────────
 *   R-2 §F.41 — implement **deterministic** normalization.
 *   R-2 §B    — normalization sits between the equity filter and validation, inside the adapter
 *               boundary; the canonical contract is its only output shape.
 *
 * ── Determinism contract ─────────────────────────────────────────────────────────────────────
 *   Same input row + same lineage + same ingestion timestamp ⇒ **byte-identical** output.
 *   Therefore this module:
 *     · uses no randomness, no `Date.now()`, no ambient clock (the caller supplies `now`);
 *     · uses no locale-dependent conversion (`Number()` only, never `parseFloat` on localised text);
 *     · never coerces absence into a value — P01 `NL-7` ("absence never becomes 0, "" or false").
 *       An absent numeric stays `null` and is reported, so a genuinely zero volume remains
 *       distinguishable from a missing one.
 *   `normalization.test.js` asserts byte-identical repeated output.
 *
 * ── §F.41 / §H — price scale ─────────────────────────────────────────────────────────────────
 *   CM-UDiFF prices are already in rupees with 2 decimals; legacy CSV `TOTTRDVAL` was in lakhs.
 *   Because §F.35 excludes the legacy format, **no lakh→rupee rescaling is applied** here.
 *   Introducing one "just in case" would silently corrupt values, so it is explicitly not done.
 */

import { buildSnapshotId, PRICE_CURRENCY } from './canonicalContract.js';

/** Parse a UDiFF numeric string to a finite number, or `null` when absent/unparseable. */
function num(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Uppercase + collapse whitespace + trim. Deterministic; no locale folding. */
function text(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/\s+/g, ' ').trim();
  return s === '' ? null : s.toUpperCase();
}

/** Preserve-case trim for security names (upper-casing a company name would lose information). */
function nameText(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/\s+/g, ' ').trim();
  return s === '' ? null : s;
}

/**
 * Normalise one eligible parsed CM row into a canonical record.
 *
 * @param {object} row       output of `parseCmUdiff` (already equity-eligible)
 * @param {object} lineage
 * @param {string} lineage.provider
 * @param {string} lineage.dataVersion
 * @param {string} lineage.asOf                ISO-8601 UTC
 * @param {string} lineage.ingestionTimestamp  ISO-8601 UTC — caller-supplied, never `Date.now()`
 * @param {object} [freshness]                 freshness metadata (§H, §Q)
 * @returns {object} canonical candidate record (not yet validated/frozen)
 */
export function normalizeRow(row, lineage, freshness) {
  const { provider, dataVersion, asOf, ingestionTimestamp } = lineage;
  return Object.freeze({
    tradeDate: String(row.TradDt ?? '').trim() || null,
    exchange: 'NSE',
    isin: text(row.ISIN),
    symbol: text(row.TckrSymb),
    securityName: nameText(row.FinInstrmId ?? null) ?? nameText(row.TckrSymb ?? null),
    series: text(row.SctySrs),

    open: num(row.OpnPric),
    high: num(row.HighPric),
    low: num(row.LowPric),
    close: num(row.ClsPric),
    lastPrice: num(row.LastPric),
    previousClose: num(row.PrvsClsgPric),

    volume: intOrNull(row.TtlTradgQty),
    tradedValue: num(row.TtlTradgVal),
    transactionCount: intOrNull(row.TtlNbOfTxsExctd),

    sourceId: row._sourceId ?? null,
    sourceRef: row._sourceRef ?? null,
    sourceTimestamp: row._sourceTimestamp ?? null,
    ingestionTimestamp: ingestionTimestamp ?? null,

    provider,
    dataVersion,
    asOf,
    snapshotId: buildSnapshotId({ provider, dataVersion, asOf }),

    priceCurrency: PRICE_CURRENCY,
    freshness: freshness ?? null,
  });
}

function intOrNull(value) {
  const n = num(value);
  if (n === null) return null;
  return Number.isInteger(n) ? n : null;
}

/**
 * Normalise a whole eligible set.
 *
 * @param {ReadonlyArray<object>} rows
 * @param {object} lineage  as for `normalizeRow`
 * @param {object} [freshness]
 * @returns {object[]}
 */
export function normalizeAll(rows, lineage, freshness) {
  return Object.freeze(rows.map((r) => normalizeRow(r, lineage, freshness)));
}

/**
 * The canonical record **identity** used for idempotency (§F.42/§F.43) and duplicate detection.
 *
 * A daily equity bar is uniquely identified by (exchange, isin, tradeDate). `isin` — not symbol
 * — is the key, because NSE symbols are reused/renamed across corporate actions while the ISIN
 * is stable; P04 owns security identity and this choice does not invent a new identity rule,
 * it uses the ISIN that P01 §H already makes REQUIRED.
 *
 * `dataVersion` is deliberately **excluded**: reprocessing the same source at a new dataVersion
 * must upsert the same logical bar (§F.43 — no duplicate canonical records), not add a second.
 *
 * @param {object} rec
 * @returns {string}
 */
export function canonicalRecordKey(rec) {
  return `${rec.exchange}|${rec.isin}|${rec.tradeDate}`;
}
