/**
 * R-2 — EQUITY ELIGIBILITY FILTER
 *
 * ── Authority ────────────────────────────────────────────────────────────────────────────────
 *   R-2 §A.1  — primary domain: **NSE Capital Market**.
 *   R-2 §A.2  — instrument universe: **NSE-listed EQUITIES ONLY**.
 *   R-2 §F.37 — do not ingest every source row blindly.
 *   R-2 §F.38 — explicitly identify eligible NSE equities.
 *   R-2 §F.39 — **debt/NCD/other non-equity instruments must NOT enter the canonical dataset**.
 *
 * ── ⚠ DEFAULT-DENY, BY DESIGN ────────────────────────────────────────────────────────────────
 *   §F.39 is a *must-not* requirement. A default-allow filter (reject a known block-list of debt
 *   series) fails open: any series NSE adds tomorrow would silently enter the equity dataset.
 *   A default-deny filter (accept only an explicit equity allow-list) fails **closed** — an
 *   unrecognised series is quarantined for review, never admitted. Only default-deny can satisfy
 *   a must-not, so that is what this implements.
 *
 * ── Evidence for the series classes ──────────────────────────────────────────────────────────
 *   Observed in real NSE CM-UDiFF Common Bhavcopy Final content: equities carry `SctySrs` of
 *   `EQ` (normal) and `BE` (trade-for-trade); debt/NCD rows carry `N`-prefixed series such as
 *   `N2`, `N5`, `N6`, `N8`, `ND`; Sovereign Gold Bonds carry `GB`. The allow-list below is
 *   therefore the **equity** classes only. Any additional equity series NSE uses must be added
 *   by explicit configuration — see `docs/r2/R2_READINESS_REPORT.md` §8.
 */

/** Segment value that denotes NSE Capital Market. Everything else is out of §A.1 scope. */
export const CM_SEGMENT = 'CM';

/**
 * Equity series permitted into the canonical dataset.
 * `EQ` — normal equity. `BE` — trade-for-trade equity (suspended/ASM category).
 * Both are equity; both are legitimately in an NSE equity universe.
 */
export const DEFAULT_EQUITY_SERIES = Object.freeze(['EQ', 'BE']);

/** Known non-equity classes. Used for *diagnosis* only — never as the admission rule. */
export const NON_EQUITY_SERIES_PATTERNS = Object.freeze([
  { pattern: /^N\d$/, class: 'DEBT_OR_NCD', note: 'NSE debt / NCD series, e.g. N2, N5, N6, N8' },
  { pattern: /^ND$/, class: 'DEBT_OR_NCD', note: 'NSE debt series' },
  { pattern: /^NC\d?$/, class: 'DEBT_OR_NCD', note: 'NSE debt / NCD series' },
  { pattern: /^G[B12]$/, class: 'GOVT_SECURITY', note: 'Government security / Sovereign Gold Bond' },
  { pattern: /^SG$/, class: 'GOVT_SECURITY', note: 'Government security' },
]);

/**
 * Classify a series string for diagnosis. Returns `UNKNOWN` rather than guessing.
 * @param {string|null|undefined} series
 * @returns {{class: string, known: boolean}}
 */
export function classifySeries(series) {
  const s = series === null || series === undefined ? '' : String(series).trim().toUpperCase();
  if (DEFAULT_EQUITY_SERIES.includes(s)) return Object.freeze({ class: 'EQUITY', known: true });
  for (const { pattern, class: cls } of NON_EQUITY_SERIES_PATTERNS) {
    if (pattern.test(s)) return Object.freeze({ class: cls, known: true });
  }
  return Object.freeze({ class: 'UNKNOWN', known: false });
}

/**
 * Decide eligibility of one parsed CM row.
 *
 * Pure and total. Returns a reason for every rejection, so the quarantine report (§J) can
 * account for 100% of source rows — `sourceRecordCount === accepted + rejected + quarantined`.
 *
 * @param {object} row  a row produced by `parseCmUdiff`
 * @param {object} [opts]
 * @param {ReadonlyArray<string>} [opts.equitySeries]  override allow-list
 * @param {string} [opts.segment]                      expected segment, default 'CM'
 * @returns {{eligible: boolean, reason: string, seriesClass: string, instrumentType: string}}
 */
export function assessEligibility(row, opts = {}) {
  const equitySeries = opts.equitySeries ?? DEFAULT_EQUITY_SERIES;
  const segment = opts.segment ?? CM_SEGMENT;

  const segm = String(row.Sgmt ?? '').trim().toUpperCase();
  if (segm !== segment) {
    return verdict(false, `segment '${segm || 'absent'}' is not ${segment} (§A.1 NSE Capital Market only)`, row);
  }

  const series = String(row.SctySrs ?? '').trim().toUpperCase();
  if (series === '') {
    return verdict(false, 'SctySrs (security series) absent — cannot establish equity eligibility', row);
  }

  const cls = classifySeries(series);
  if (!equitySeries.includes(series)) {
    const detail = cls.known ? `classified ${cls.class}` : 'unrecognised series (default-deny)';
    return verdict(false, `series '${series}' not in equity allow-list [${equitySeries.join(', ')}] — ${detail}`, row, cls.class);
  }

  // Equity instruments must not carry an expiry; an expiry means a derivative/maturity-dated
  // instrument has been mis-series'd. Rejecting it protects §F.39.
  if (row.XpryDt !== null && row.XpryDt !== undefined && String(row.XpryDt).trim() !== '') {
    return verdict(false, `equity-eligible series '${series}' carries XpryDt — inconsistent instrument type`, row, cls.class);
  }

  if (!row.ISIN) return verdict(false, 'ISIN absent — §H requires ISIN', row, cls.class);
  if (!row.TckrSymb) return verdict(false, 'TckrSymb (NSE symbol) absent — §H requires symbol', row, cls.class);

  return Object.freeze({
    eligible: true,
    reason: 'eligible NSE CM equity',
    seriesClass: 'EQUITY',
    instrumentType: 'EQUITY',
  });
}

function verdict(eligible, reason, row, seriesClass = 'UNKNOWN') {
  return Object.freeze({
    eligible,
    reason,
    seriesClass,
    instrumentType: row && row.FinInstrmTp ? String(row.FinInstrmTp) : 'UNKNOWN',
  });
}

/**
 * Partition parsed rows into eligible / ineligible.
 *
 * @param {ReadonlyArray<object>} rows
 * @param {object} [opts] forwarded to `assessEligibility`
 * @returns {{eligible: object[], ineligible: object[], eligibleCount: number, ineligibleCount: number,
 *            rejectionsByClass: Record<string, number>}}
 */
export function filterEligible(rows, opts = {}) {
  const eligible = [];
  const ineligible = [];
  const rejectionsByClass = {};
  for (const row of rows) {
    const v = assessEligibility(row, opts);
    if (v.eligible) {
      eligible.push(row);
    } else {
      ineligible.push(Object.freeze({ row, ...v }));
      rejectionsByClass[v.seriesClass] = (rejectionsByClass[v.seriesClass] ?? 0) + 1;
    }
  }
  return Object.freeze({
    eligible: Object.freeze(eligible),
    ineligible: Object.freeze(ineligible),
    eligibleCount: eligible.length,
    ineligibleCount: ineligible.length,
    rejectionsByClass: Object.freeze(rejectionsByClass),
  });
}
