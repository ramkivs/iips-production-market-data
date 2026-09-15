/**
 * R-2 — DETERMINISTIC FILE-BASED REFERENCE ADAPTER
 *
 * ── Authority ────────────────────────────────────────────────────────────────────────────────
 *   R-2 §E.26 — implement a **deterministic mock/file-based adapter**.
 *   R-2 §E.27 — the real authorised NSE acquisition adapter remains an EXTERNAL CONFIGURATION /
 *               ENTITLEMENT GATE. This adapter is **not** that adapter and does not pretend to be.
 *   R-2 §G.46/§G.48 — synthetic/reference fixtures must be clearly labelled as test data and must
 *               never be represented as official NSE data.
 *   R-2 §I.56 — historical loading must not silently substitute synthetic data for real data.
 *
 * ── Determinism ──────────────────────────────────────────────────────────────────────────────
 *   The adapter is a pure function of (fixture contents, requested date). It performs no network
 *   I/O, reads no clock, and returns identical bytes for identical input. Its `dataVersion` is
 *   derived from the source file name, so P01 DV-2 (any source-content change ⇒ new dataVersion)
 *   holds without an external version service.
 *
 * ── Provenance honesty (§I.56, §G.48) ────────────────────────────────────────────────────────
 *   Every record this adapter returns carries `sourceId: 'r2-reference-file'` and a `sourceRef`
 *   naming the fixture. `isSynthetic` is exposed on the descriptor so a caller can assert that
 *   synthetic data never reaches a claim of real historical coverage.
 */

import { CAPABILITY } from './providerAdapter.js';
import { parseCmUdiff, parseUdiffFileName } from './cmudiffParser.js';
import { E, providerError } from './errorTaxonomy.js';

/** Stable provider identity for the reference adapter (P01 §3 row 2). */
export const REFERENCE_PROVIDER_ID = 'r2-reference-file';

/**
 * Create the deterministic file-based reference adapter.
 *
 * @param {object} input
 * @param {Record<string,string>} input.files   map of filename → file text
 * @param {object} [input.behaviour]            optional fault injection, for testing §E.32
 * @param {string} [input.behaviour.failWith]   a P02 code to fail every call with
 * @param {string[]} [input.behaviour.failFor]  fail only for these dates
 * @param {string} [input.behaviour.truncateAfter]  drop rows after this symbol (partial refresh)
 * @param {string} [input.asOfSource]           ISO-8601 UTC source publication instant
 * @returns {object} an object satisfying the provider port
 */
export function createReferenceAdapter(input) {
  const files = input.files ?? {};
  const behaviour = input.behaviour ?? {};
  const defaultSourceTimestamp = input.asOfSource ?? '2026-01-02T16:30:00Z';

  function locate(tradeDate) {
    // Prefer an exact UDiFF name for the date; else any file whose TradDt matches.
    const ymd = tradeDate.replace(/-/g, '');
    const exact = Object.keys(files).find((f) => f.includes(ymd));
    return exact ?? null;
  }

  function read(tradeDate, sourceTimestamp) {
    const filename = locate(tradeDate);
    if (filename === null) {
      return { ok: false, error: providerError(E.E1, { reason: `no reference file for trade date ${tradeDate}`, at: sourceTimestamp }) };
    }
    const parsed = parseCmUdiff({
      text: files[filename],
      sourceRef: filename,
      sourceId: REFERENCE_PROVIDER_ID,
      sourceTimestamp,
    });
    if (!parsed.ok) return parsed;

    let rows = parsed.rows;
    if (behaviour.truncateAfter) {
      const idx = rows.findIndex((r) => r.TckrSymb === behaviour.truncateAfter);
      if (idx >= 0) rows = rows.slice(0, idx + 1);
    }
    const nameMeta = parseUdiffFileName(filename);
    return {
      ok: true,
      rows,
      malformed: parsed.malformed,
      sourceRef: filename,
      dataVersion: `ref-${filename}`,
      businessDate: nameMeta.parsed ? nameMeta.businessDate : null,
      kind: nameMeta.parsed ? nameMeta.kind : null,
    };
  }

  const adapter = {
    id: REFERENCE_PROVIDER_ID,
    mechanism: 'reference-file',
    capabilities: [CAPABILITY.CURRENT_STATE, CAPABILITY.EOD_DAILY, CAPABILITY.HISTORICAL_RANGE],
    isSynthetic: true,

    /** §M.71 — declares what a real adapter would need; carries no secret value. */
    gate: Object.freeze({
      acquisitionMechanismAuthorized: false,
      credentialsAvailable: false,
      licensingInPlace: false,
      exchangeEntitlementsGranted: false,
      providerAgreementExecuted: false,
      productionAccessValidated: false,
    }),

    describe() {
      return Object.freeze({
        id: REFERENCE_PROVIDER_ID,
        synthetic: true,
        note: 'Deterministic file-based REFERENCE adapter. NOT an authorised NSE acquisition mechanism (§E.27).',
        fileCount: Object.keys(files).length,
        capabilities: adapter.capabilities,
      });
    },

    /**
     * @param {{tradeDate: string}} req
     * @returns {{ok: boolean, rows?: object[], malformed?: object[], sourceRef?: string,
     *            dataVersion?: string, sourceTimestamp?: string, error?: object}}
     */
    fetchEodDaily(req) {
      const ts = req.sourceTimestamp ?? defaultSourceTimestamp;
      if (behaviour.failWith && (!behaviour.failFor || behaviour.failFor.includes(req.tradeDate))) {
        return { ok: false, error: providerError(behaviour.failWith, { reason: 'injected fault', at: ts }) };
      }
      const r = read(req.tradeDate, ts);
      if (!r.ok) return r;
      return { ok: true, rows: r.rows, malformed: r.malformed, sourceRef: r.sourceRef, dataVersion: r.dataVersion, sourceTimestamp: ts };
    },

    /**
     * Current-state read. The reference adapter derives "current" from the most recent available
     * file, which is exactly the shape a real 15-minute feed adapter must satisfy.
     * @param {{asOf?: string}} [req]
     */
    fetchCurrentState(req = {}) {
      if (behaviour.failWith && (!behaviour.failFor || behaviour.failFor.length === 0)) {
        const ts0 = req.asOf ?? defaultSourceTimestamp;
        return { ok: false, error: providerError(behaviour.failWith, { reason: 'injected fault', at: ts0 }) };
      }
      // Select the CURRENT source by BUSINESS DATE, not by filename sort order. Alphabetical
      // ordering would make "SYNTHETIC_*" win over "BhavCopy_*" purely on spelling.
      const filename = input.currentFile ?? latestByBusinessDate(Object.keys(files));
      if (!filename) {
        const ts1 = req.asOf ?? defaultSourceTimestamp;
        return { ok: false, error: providerError(E.E1, { reason: 'no reference file available', at: ts1 }) };
      }
      // Derive the publication instant from the chosen file's own business date so that the
      // §J timestamp check (ingestion must not precede publication) is meaningful.
      const meta = parseUdiffFileName(filename);
      const derivedTs = meta.parsed ? `${meta.businessDate}T16:30:00Z` : defaultSourceTimestamp;
      const ts = req.asOf ?? input.currentSourceTimestamp ?? derivedTs;
      const parsed = parseCmUdiff({ text: files[filename], sourceRef: filename, sourceId: REFERENCE_PROVIDER_ID, sourceTimestamp: ts });
      if (!parsed.ok) return parsed;
      // Fault injection must apply on BOTH paths, or a partial-refresh test would silently
      // exercise a different code path than the one it claims to cover.
      let rows = parsed.rows;
      if (behaviour.truncateAfter) {
        const idx = rows.findIndex((r) => r.TckrSymb === behaviour.truncateAfter);
        if (idx >= 0) rows = rows.slice(0, idx + 1);
      }
      return {
        ok: true,
        rows,
        malformed: parsed.malformed,
        sourceRef: filename,
        dataVersion: `ref-${filename}`,
        sourceTimestamp: ts,
        asOf: ts,
      };
    },
  };

  return Object.freeze(adapter);
}

/**
 * Choose the file with the latest UDiFF business date. Files whose names do not follow the
 * convention are ignored rather than guessed at.
 */
function latestByBusinessDate(names) {
  let best = null;
  let bestDate = '';
  for (const n of names) {
    const m = parseUdiffFileName(n);
    if (m.parsed && m.businessDate > bestDate) { bestDate = m.businessDate; best = n; }
  }
  return best;
}
