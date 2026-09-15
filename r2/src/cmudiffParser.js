/**
 * R-2 — NSE CM-UDiFF COMMON BHAVCOPY FINAL PARSER
 *
 * ── Authority / scope ────────────────────────────────────────────────────────────────────────
 *   R-2 §F.34 — target the **current** NSE CM-UDiFF Common Bhavcopy Final contract.
 *   R-2 §F.35 — do **NOT** build new production logic around the discontinued legacy CM Bhavcopy
 *               CSV format (`SYMBOL,SERIES,OPEN,HIGH,LOW,CLOSE,LAST,PREVCLOSE,TOTTRDQTY,
 *               TOTTRDVAL,TIMESTAMP,TOTALTRADES,ISIN,DELIV_QTY,DELIV_PER`).
 *               `LEGACY_COLUMNS` is exported **only** so a test can prove the parser rejects it.
 *
 * ── ⚠ DESIGN DECISION: HEADER-DRIVEN, NOT POSITIONAL ─────────────────────────────────────────
 *   The published UDiFF BhavCopy column list is `TradDt, BizDt, Sgmt, Src, FinInstrmTp,
 *   FinInstrmId, ISIN, TckrSymb, SctySrs, XpryDt, …`. I have **not** been able to verify NSE's
 *   current authoritative column *order* from inside this environment, and R-2 §F.34 forbids
 *   inventing the contract. So the parser binds **by header name**, never by index:
 *     · it is correct under any column ordering NSE chooses;
 *     · it fails loudly (E5) when a required tag is missing, instead of silently mis-binding;
 *     · it removes any need for me to assert an order I cannot check.
 *   The exact required-tag set MUST still be reconciled against NSE's current Format Master
 *   catalogue before production use — see `docs/r2/R2_READINESS_REPORT.md` §9.
 *
 * ── §G.46 / §G.48 — synthetic data discipline ────────────────────────────────────────────────
 *   Nothing in this module fabricates values presented as official NSE data. Parsing is pure;
 *   every output row carries `sourceRef` back to the file it came from.
 */

import { E, providerError } from './errorTaxonomy.js';

/** The discontinued legacy CM CSV header. Rejected by design (§F.35). */
export const LEGACY_COLUMNS = Object.freeze([
  'SYMBOL', 'SERIES', 'OPEN', 'HIGH', 'LOW', 'CLOSE', 'LAST', 'PREVCLOSE',
  'TOTTRDQTY', 'TOTTRDVAL', 'TIMESTAMP', 'TOTALTRADES', 'ISIN', 'DELIV_QTY', 'DELIV_PER',
]);

/** ISO tags that MUST be present for an NSE CM equity row to be usable. */
export const REQUIRED_TAGS = Object.freeze([
  'TradDt', 'Sgmt', 'Src', 'ISIN', 'TckrSymb', 'SctySrs', 'ClsPric',
]);

/**
 * ISO tags whose value MUST be numeric when non-empty.
 *
 * Used to distinguish **absent** from **corrupt**. P01 NL-7 says absence never becomes `0` — but
 * silently turning `"NOT_A_NUMBER"` into `null` would breach R-2 §J ("invalid numeric values …
 * never silently accepted") by laundering a corrupt source value into a legitimate-looking gap.
 */
export const NUMERIC_TAGS = Object.freeze([
  'OpnPric', 'HighPric', 'LowPric', 'ClsPric', 'LastPric', 'PrvsClsgPric',
  'TtlTradgQty', 'TtlTradgVal', 'TtlNbOfTxsExctd', 'NewBrdLotQty', 'FaceVal',
]);

/**
 * Find numeric tags whose value is present but not a finite number.
 * @param {object} row  a parsed row
 * @returns {string[]} descriptions of each invalid value
 */
export function findInvalidNumerics(row) {
  const bad = [];
  for (const tag of NUMERIC_TAGS) {
    const v = row[tag];
    if (v === null || v === undefined || String(v).trim() === '') continue;
    if (!Number.isFinite(Number(String(v).trim()))) {
      bad.push(`${tag}='${v}' is not a valid number`);
    }
  }
  return bad;
}

/** ISO tags we consume when present; absence is legal and yields `null` (P01 NL-7, no coercion). */
export const OPTIONAL_TAGS = Object.freeze([
  'BizDt', 'FinInstrmTp', 'FinInstrmId', 'XpryDt', 'PrvsClsgPric', 'OpnPric', 'HighPric',
  'LowPric', 'LastPric', 'TtlTradgQty', 'TtlTradgVal', 'TtlNbOfTxsExctd', 'NewBrdLotQty',
  'FaceVal', 'RptdTxSts', 'SsnId',
]);

/**
 * Minimal RFC-4180-ish CSV line splitter.
 *
 * Deliberately dependency-free (repository convention: `p05`/`p06` carry zero dependencies).
 * Handles quoted fields, escaped quotes (`""`) and embedded commas — UDiFF security names
 * contain commas and `&`.
 *
 * @param {string} line
 * @returns {string[]}
 */
export function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i += 1; } else { inQuotes = false; }
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/**
 * Detect the legacy CM CSV format so it can be refused rather than silently mis-parsed.
 * @param {string[]} header
 * @returns {boolean}
 */
export function isLegacyCmFormat(header) {
  const upper = header.map((h) => h.toUpperCase());
  return LEGACY_COLUMNS.filter((c) => upper.includes(c)).length >= 8;
}

/**
 * Parse an NSE CM-UDiFF Common Bhavcopy Final file body.
 *
 * @param {object} input
 * @param {string} input.text        full file text (header + rows)
 * @param {string} input.sourceRef   source file name/reference — required provenance (§F.40)
 * @param {string} input.sourceId    stable acquisition-mechanism identifier
 * @param {string} input.sourceTimestamp  ISO-8601 UTC publication instant
 * @returns {{ok: boolean, header?: string[], rows?: object[], error?: object}}
 */
export function parseCmUdiff({ text, sourceRef, sourceId, sourceTimestamp }) {
  if (typeof text !== 'string' || text.trim() === '') {
    return { ok: false, error: providerError(E.E5, { reason: 'empty file body', at: sourceTimestamp }) };
  }
  if (!sourceRef) {
    return { ok: false, error: providerError(E.E5, { reason: 'sourceRef (source file reference) is mandatory', at: sourceTimestamp }) };
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 1) {
    return { ok: false, error: providerError(E.E5, { reason: 'no header row', at: sourceTimestamp }) };
  }

  const header = splitCsvLine(lines[0]);

  // §F.35 — refuse the discontinued legacy format explicitly rather than guessing.
  if (isLegacyCmFormat(header)) {
    return {
      ok: false,
      error: providerError(E.E5, {
        reason: 'discontinued legacy CM Bhavcopy CSV format detected; R-2 §F.35 prohibits building on it',
        at: sourceTimestamp,
      }),
    };
  }

  const missing = REQUIRED_TAGS.filter((t) => !header.includes(t));
  if (missing.length > 0) {
    return {
      ok: false,
      error: providerError(E.E5, {
        reason: `CM-UDiFF required ISO tag(s) absent from header: ${missing.join(', ')}`,
        at: sourceTimestamp,
      }),
    };
  }

  const index = new Map(header.map((h, i) => [h, i]));
  const at = (cells, tag) => {
    const i = index.get(tag);
    if (i === undefined) return null;
    const v = cells[i];
    return v === undefined || v === '' ? null : v;
  };

  const rows = [];
  const malformed = [];
  for (let n = 1; n < lines.length; n += 1) {
    const cells = splitCsvLine(lines[n]);
    // A short row is malformed, not "missing optional fields" — quarantine it (§J).
    if (cells.length < header.length - OPTIONAL_TAGS.length) {
      malformed.push({ lineNumber: n + 1, reason: 'row has fewer cells than required tags', raw: lines[n] });
      continue;
    }
    rows.push(Object.freeze({
      _lineNumber: n + 1,
      _sourceRef: sourceRef,
      _sourceId: sourceId,
      _sourceTimestamp: sourceTimestamp,
      TradDt: at(cells, 'TradDt'),
      BizDt: at(cells, 'BizDt'),
      Sgmt: at(cells, 'Sgmt'),
      Src: at(cells, 'Src'),
      FinInstrmTp: at(cells, 'FinInstrmTp'),
      FinInstrmId: at(cells, 'FinInstrmId'),
      ISIN: at(cells, 'ISIN'),
      TckrSymb: at(cells, 'TckrSymb'),
      SctySrs: at(cells, 'SctySrs'),
      XpryDt: at(cells, 'XpryDt'),
      OpnPric: at(cells, 'OpnPric'),
      HighPric: at(cells, 'HighPric'),
      LowPric: at(cells, 'LowPric'),
      ClsPric: at(cells, 'ClsPric'),
      LastPric: at(cells, 'LastPric'),
      PrvsClsgPric: at(cells, 'PrvsClsgPric'),
      TtlTradgQty: at(cells, 'TtlTradgQty'),
      TtlTradgVal: at(cells, 'TtlTradgVal'),
      TtlNbOfTxsExctd: at(cells, 'TtlNbOfTxsExctd'),
      NewBrdLotQty: at(cells, 'NewBrdLotQty'),
      FaceVal: at(cells, 'FaceVal'),
      RptdTxSts: at(cells, 'RptdTxSts'),
      SsnId: at(cells, 'SsnId'),
    }));
  }

  return Object.freeze({ ok: true, header: Object.freeze(header), rows: Object.freeze(rows), malformed: Object.freeze(malformed) });
}

/**
 * Parse the UDiFF file-name convention to recover the business date and final/provisional
 * marker, e.g. `BhavCopy_NSE_CM_0_0_0_20250829_F_0000.csv`.
 *
 * Returned as provenance only — never as market data. Used for duplicate-source-file
 * detection (§J "duplicate source files") and for reconciling file date vs `TradDt`.
 *
 * @param {string} filename
 * @returns {{parsed: boolean, exchange?: string, segment?: string, businessDate?: string, kind?: 'FINAL'|'PROVISIONAL'}}
 */
export function parseUdiffFileName(filename) {
  const m = /^BhavCopy_([A-Z]+)_([A-Z]{2})_\d+_\d+_\d+_(\d{8})_([PF])_\d{4}\.csv$/i.exec(String(filename));
  if (!m) return Object.freeze({ parsed: false });
  const [, exchange, segment, yyyymmdd, fp] = m;
  return Object.freeze({
    parsed: true,
    exchange: exchange.toUpperCase(),
    segment: segment.toUpperCase(),
    businessDate: `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`,
    kind: fp.toUpperCase() === 'F' ? 'FINAL' : 'PROVISIONAL',
  });
}
