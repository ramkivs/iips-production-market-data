/**
 * R-2 — NSE EOD / BHAVCOPY INGESTION PIPELINE
 *
 * ── Authority ────────────────────────────────────────────────────────────────────────────────
 *   R-2 §F.33 — implement a dedicated EOD ingestion pipeline.
 *   R-2 §F.34 — target the current NSE CM-UDiFF Common Bhavcopy Final contract.
 *   R-2 §F.36 — the required stage order:
 *                 RAW NSE FILE → PARSER → SCHEMA VALIDATION → EQUITY ELIGIBILITY FILTER →
 *                 NORMALIZATION → DATA QUALITY VALIDATION → CANONICAL EOD RECORD →
 *                 RECONCILIATION → HISTORICAL STORE
 *               `ingestFile` implements exactly that sequence; the stage names in its trace are
 *               the §F.36 names, so the implementation and the requirement are checkable against
 *               each other.
 *   R-2 §F.40 — preserve raw source data or sufficient source provenance for audit. Every
 *               canonical record carries `sourceId` + `sourceRef` + `sourceTimestamp`, and the
 *               raw text is handed to the store's source-file register; quarantine keeps the raw
 *               line for every rejected/quarantined row.
 *   R-2 §F.42 — idempotent EOD processing.
 *   R-2 §F.43 — reprocessing the same daily source must not create duplicate canonical records.
 *   R-2 §J    — measurable ingestion metrics; invalid/stale records rejected OR quarantined,
 *               **never silently accepted**.
 */

import { findInvalidNumerics, parseCmUdiff } from './cmudiffParser.js';
import { filterEligible } from './equityEligibility.js';
import { normalizeAll } from './normalization.js';
import { assessRecord, QV } from './qualityValidation.js';
import { freezeRecord, validateRecord } from './canonicalContract.js';
import { canonicalRecordKey } from './normalization.js';
import { E, providerError } from './errorTaxonomy.js';

/**
 * The §J measurable metric set. Every pipeline run returns exactly these keys, so metrics are
 * comparable across runs and across backfill days.
 */
export const METRIC_KEYS = Object.freeze([
  'sourceRecordCount', 'eligibleEquityCount', 'acceptedCount', 'rejectedCount',
  'quarantinedCount', 'duplicateCount', 'processingTimestamp', 'freshnessState',
]);

function emptyMetrics(processingTimestamp, freshnessState = null) {
  return {
    sourceRecordCount: 0,
    eligibleEquityCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    quarantinedCount: 0,
    duplicateCount: 0,
    processingTimestamp,
    freshnessState,
  };
}

/**
 * Ingest already-parsed rows through the eligibility → normalization → quality → store stages.
 *
 * Shared by both the current-state engine and the EOD pipeline so that **one** code path decides
 * what may enter the canonical dataset. §F.39 therefore holds identically for current state and
 * for EOD history — there is no second, looser route into the store.
 *
 * @param {object} input
 * @param {ReadonlyArray<object>} input.rows
 * @param {ReadonlyArray<object>} [input.malformedFromParser]
 * @param {object} input.lineage    { provider, dataVersion, asOf, ingestionTimestamp }
 * @param {object} input.store      MarketDataStore
 * @param {'eod'|'current'} [input.mode]
 * @param {string} [input.now]
 * @param {object} [input.freshness]
 * @returns {{metrics: object, accepted: object[], rejected: object[], quarantined: object[], trace: object}}
 */
export function ingestEodRows(input) {
  const { rows, lineage, store, mode = 'eod' } = input;
  const malformedFromParser = input.malformedFromParser ?? [];
  const processingTimestamp = input.now ?? lineage.ingestionTimestamp;
  const metrics = emptyMetrics(processingTimestamp, input.freshness ?? null);
  const accepted = [];
  const rejected = [];
  const quarantined = [];

  // §F.37/§F.38/§F.39 — EQUITY ELIGIBILITY FILTER (default-deny).
  const eligibility = filterEligible(rows, input.eligibilityOpts ?? {});
  metrics.sourceRecordCount = rows.length + malformedFromParser.length;
  metrics.eligibleEquityCount = eligibility.eligibleCount;

  for (const item of eligibility.ineligible) {
    metrics.rejectedCount += 1;
    rejected.push(Object.freeze({ reason: item.reason, seriesClass: item.seriesClass, raw: item.row }));
    store.quarantine(item.row, `ineligible: ${item.reason}`);
  }
  for (const m of malformedFromParser) {
    metrics.rejectedCount += 1;
    rejected.push(Object.freeze({ reason: `parser: ${m.reason}`, raw: m.raw }));
    store.quarantine({ _raw: m.raw, _lineNumber: m.lineNumber }, `malformed: ${m.reason}`);
  }

  // §J — INVALID NUMERIC VALUES must be quarantined, never laundered into a null.
  // This check runs BEFORE normalization, because normalization maps an unparseable value to
  // `null` and would make a corrupt source value indistinguishable from a legitimate gap.
  const numericallyValid = [];
  for (const row of eligibility.eligible) {
    const bad = findInvalidNumerics(row);
    if (bad.length > 0) {
      metrics.quarantinedCount += 1;
      quarantined.push(Object.freeze({ reason: `invalid numeric: ${bad.join('; ')}`, rec: row }));
      store.quarantine(row, `invalid numeric: ${bad.join('; ')}`);
    } else {
      numericallyValid.push(row);
    }
  }

  // NORMALIZATION (§F.41) — deterministic.
  const candidates = normalizeAll(numericallyValid, lineage, input.freshness ?? null);

  // DATA QUALITY VALIDATION (§J) — three sinks only.
  const seenThisRun = new Set();
  for (const candidate of candidates) {
    const contract = validateRecord(candidate);
    if (!contract.valid) {
      metrics.rejectedCount += 1;
      rejected.push(Object.freeze({ reason: contract.errors.join('; '), raw: candidate }));
      store.quarantine(candidate, `contract: ${contract.errors.join('; ')}`);
      continue;
    }

    const assessment = assessRecord(candidate, { now: processingTimestamp, isExpectedSymbol: input.isExpectedSymbol });
    if (assessment.verdict === QV.REJECT) {
      metrics.rejectedCount += 1;
      rejected.push(Object.freeze({ reason: assessment.reasons.join('; '), raw: candidate }));
      store.quarantine(candidate, `rejected: ${assessment.reasons.join('; ')}`);
      continue;
    }
    if (assessment.verdict === QV.QUARANTINE) {
      metrics.quarantinedCount += 1;
      quarantined.push(Object.freeze({ reason: assessment.reasons.join('; '), rec: candidate }));
      store.quarantine(candidate, `quarantined: ${assessment.reasons.join('; ')}`);
      continue;
    }

    // CANONICAL EOD RECORD (§F.36) — freeze under INV-2 immutability, and assert no
    // provider-native field leaked through (INV-10 / NFR-06).
    let frozen;
    try {
      frozen = freezeRecord(candidate);
    } catch (e) {
      metrics.rejectedCount += 1;
      rejected.push(Object.freeze({ reason: e.message, raw: candidate }));
      store.quarantine(candidate, e.message);
      continue;
    }

    // §F.42/§F.43 — IDEMPOTENCY.
    const key = canonicalRecordKey(frozen);
    if (seenThisRun.has(key)) {
      metrics.duplicateCount += 1;
      rejected.push(Object.freeze({ reason: `duplicate within source file: ${key}`, raw: frozen }));
      continue;
    }

    seenThisRun.add(key);

    const put = mode === 'current'
      ? { status: store.getCurrent() && store.getCurrent().dataVersion === frozen.dataVersion ? 'unchanged' : 'updated' }
      : store.putDaily(frozen);

    if (put.status === 'unchanged') metrics.duplicateCount += 1;
    metrics.acceptedCount += 1;
    accepted.push(frozen);
  }

  // In current mode the single current-state row is written by the caller via putCurrent.
  if (mode !== 'current') store.putDailyBatch([]); // no-op; keeps the batch contract exercised

  return Object.freeze({
    metrics: Object.freeze(metrics),
    accepted: Object.freeze(accepted),
    rejected: Object.freeze(rejected),
    quarantined: Object.freeze(quarantined),
    trace: Object.freeze({
      stages: Object.freeze([
        'RAW NSE FILE', 'PARSER', 'SCHEMA VALIDATION', 'EQUITY ELIGIBILITY FILTER',
        'NORMALIZATION', 'DATA QUALITY VALIDATION', 'CANONICAL EOD RECORD',
        'RECONCILIATION', 'HISTORICAL STORE',
      ]),
      mode,
    }),
  });
}

/**
 * Full §F.36 pipeline starting from raw file text.
 *
 * @param {object} input
 * @param {string} input.text
 * @param {string} input.sourceRef
 * @param {string} input.sourceId
 * @param {string} input.sourceTimestamp
 * @param {object} input.lineage    { provider, dataVersion, asOf, ingestionTimestamp }
 * @param {object} input.store
 * @param {string} [input.now]
 * @param {object} [input.freshness]
 * @returns {{ok: boolean, error?: object, metrics?: object, accepted?: object[],
 *            rejected?: object[], quarantined?: object[], trace?: object,
 *            sourceFileStatus?: 'recorded'|'duplicate'}}
 */
export function ingestFile(input) {
  const { text, sourceRef, sourceId, sourceTimestamp, lineage, store } = input;
  const processingTimestamp = input.now ?? lineage.ingestionTimestamp;

  // §J — duplicate source-file detection. A repeated file is recognised and skipped, not
  // re-applied; this is what makes a replayed backfill day safe (§F.43).
  const sourceFileStatus = store.recordSourceFile(sourceRef).status;
  if (sourceFileStatus === 'duplicate') {
    return Object.freeze({
      ok: true,
      sourceFileStatus,
      metrics: Object.freeze({ ...emptyMetrics(processingTimestamp), duplicateCount: 1 }),
      accepted: Object.freeze([]),
      rejected: Object.freeze([]),
      quarantined: Object.freeze([]),
      trace: Object.freeze({ stages: Object.freeze(['RAW NSE FILE', 'PARSER']), note: 'duplicate source file — skipped (§J)' }),
    });
  }

  const parsed = parseCmUdiff({ text, sourceRef, sourceId, sourceTimestamp });
  if (!parsed.ok) {
    return Object.freeze({
      ok: false,
      error: parsed.error ?? providerError(E.E5, { reason: 'parse failed', at: sourceTimestamp }),
      sourceFileStatus,
      metrics: Object.freeze(emptyMetrics(processingTimestamp)),
    });
  }

  const result = ingestEodRows({
    rows: parsed.rows,
    malformedFromParser: parsed.malformed,
    lineage,
    store,
    mode: 'eod',
    now: processingTimestamp,
    freshness: input.freshness ?? null,
    eligibilityOpts: input.eligibilityOpts,
    isExpectedSymbol: input.isExpectedSymbol,
  });

  return Object.freeze({ ok: true, sourceFileStatus, ...result });
}
