/**
 * R-2 — RECONCILIATION AND SOURCE COMPLETENESS
 *
 * ── Authority ────────────────────────────────────────────────────────────────────────────────
 *   R-2 §F.36 — RECONCILIATION is a named pipeline stage before the historical store.
 *   R-2 §F.40 — preserve sufficient source provenance for reconciliation/audit.
 *   R-2 §F.43 — reprocessing must not create duplicate canonical records.
 *   R-2 §J    — controls for duplicate records, duplicate source files, source completeness,
 *               reconciliation failures; and measurable metrics.
 *   R-2 §I.55 — do not claim coverage until data is loaded **and reconciled**.
 *
 * ── Reconciliation identity ──────────────────────────────────────────────────────────────────
 *   The reconciliation check is: for every source row the parser produced, exactly one of
 *   {accepted, rejected, quarantined} must account for it. If the counts do not balance, the run
 *   has **lost** a row somewhere, which is a reconciliation failure and must be reported rather
 *   than absorbed. `assertRowAccounting` makes that balance a hard, testable invariant.
 */

/**
 * §J row-accounting reconciliation.
 *
 * @param {{sourceRecordCount: number, eligibleEquityCount: number, acceptedCount: number,
 *          rejectedCount: number, quarantinedCount: number}} metrics
 * @returns {{balanced: boolean, unaccounted: number, detail: string}}
 */
export function assertRowAccounting(metrics) {
  const { sourceRecordCount, acceptedCount, rejectedCount, quarantinedCount } = metrics;
  // A duplicate is a source row that was seen but not admitted, so it belongs in the identity;
  // §J lists duplicateCount as a distinct metric precisely because it is not a rejection.
  const duplicateCount = metrics.duplicateCount ?? 0;
  const accounted = acceptedCount + rejectedCount + quarantinedCount + duplicateCount;
  const unaccounted = sourceRecordCount - accounted;
  return Object.freeze({
    balanced: unaccounted === 0,
    unaccounted,
    detail: unaccounted === 0
      ? `all ${sourceRecordCount} source rows accounted for (${acceptedCount} accepted + ${rejectedCount} rejected + ${quarantinedCount} quarantined + ${duplicateCount} duplicate)`
      : `RECONCILIATION FAILURE: ${unaccounted} of ${sourceRecordCount} source rows are unaccounted for`,
  });
}

/**
 * Detect duplicate canonical records inside an accepted set (§J "duplicate records").
 *
 * @param {ReadonlyArray<object>} records
 * @param {(r: object) => string} keyFn
 * @returns {{duplicates: string[], duplicateCount: number}}
 */
export function findDuplicateKeys(records, keyFn) {
  const seen = new Map();
  const duplicates = [];
  for (const r of records) {
    const k = keyFn(r);
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  for (const [k, n] of seen) if (n > 1) duplicates.push(k);
  return Object.freeze({ duplicates: Object.freeze(duplicates), duplicateCount: duplicates.length });
}

/**
 * Source completeness: compare the set of expected trading days against what the store holds.
 *
 * Expected days come from the caller (§I.54) — this module does not invent a holiday calendar.
 * A day present in the store but not expected is reported as `unexpected`, which catches both
 * date-parsing errors and mis-dated source files.
 *
 * @param {object} input
 * @param {ReadonlyArray<string>} input.expectedDays
 * @param {ReadonlyArray<object>} input.records
 * @returns {{expected: number, present: number, missingDays: string[], unexpectedDays: string[],
 *            complete: boolean, coveragePct: number}}
 */
export function assessCompleteness({ expectedDays, records }) {
  const present = new Set(records.map((r) => r.tradeDate));
  const expected = new Set(expectedDays);
  const missingDays = [...expected].filter((d) => !present.has(d)).sort();
  const unexpectedDays = [...present].filter((d) => !expected.has(d)).sort();
  const coveragePct = expected.size === 0 ? 0 : ((expected.size - missingDays.length) / expected.size) * 100;
  return Object.freeze({
    expected: expected.size,
    present: present.size,
    missingDays: Object.freeze(missingDays),
    unexpectedDays: Object.freeze(unexpectedDays),
    complete: missingDays.length === 0 && unexpectedDays.length === 0,
    coveragePct: Number(coveragePct.toFixed(4)),
  });
}

/**
 * Detect contradictory daily data **across** records for the same instrument: the same
 * (isin, tradeDate) carrying different closes, which cannot both be true.
 *
 * @param {ReadonlyArray<object>} records
 * @returns {{conflicts: object[], conflictCount: number}}
 */
export function findContradictoryDaily(records) {
  const byKey = new Map();
  for (const r of records) {
    const k = `${r.exchange}|${r.isin}|${r.tradeDate}`;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(r);
  }
  const conflicts = [];
  for (const [k, group] of byKey) {
    if (group.length < 2) continue;
    const closes = new Set(group.map((r) => r.close));
    if (closes.size > 1) {
      conflicts.push(Object.freeze({
        key: k,
        reason: `${group.length} canonical records disagree on close: ${[...closes].join(', ')}`,
        dataVersions: Object.freeze(group.map((r) => r.dataVersion)),
      }));
    }
  }
  return Object.freeze({ conflicts: Object.freeze(conflicts), conflictCount: conflicts.length });
}

/**
 * Detect inconsistent timestamps across a set: `ingestionTimestamp` earlier than
 * `sourceTimestamp`, or `asOf` earlier than `tradeDate`.
 *
 * @param {ReadonlyArray<object>} records
 * @returns {{inconsistencies: object[], count: number}}
 */
export function findTimestampInconsistencies(records) {
  const out = [];
  for (const r of records) {
    const src = r.sourceTimestamp ? Date.parse(r.sourceTimestamp) : null;
    const ing = r.ingestionTimestamp ? Date.parse(r.ingestionTimestamp) : null;
    const asOf = r.asOf ? Date.parse(r.asOf) : null;
    const trade = r.tradeDate ? Date.parse(`${r.tradeDate}T00:00:00Z`) : null;
    const reasons = [];
    if (src !== null && ing !== null && ing < src) reasons.push('ingestion precedes source publication');
    if (asOf !== null && trade !== null && asOf < trade) reasons.push('asOf precedes tradeDate');
    if (reasons.length) out.push(Object.freeze({ key: `${r.isin}|${r.tradeDate}`, reasons: Object.freeze(reasons) }));
  }
  return Object.freeze({ inconsistencies: Object.freeze(out), count: out.length });
}

/**
 * Full reconciliation report for one ingestion run.
 *
 * @param {object} input
 * @param {object} input.metrics
 * @param {ReadonlyArray<object>} input.accepted
 * @param {(r: object) => string} input.keyFn
 * @param {ReadonlyArray<string>} [input.expectedDays]
 * @returns {{reconciled: boolean, failures: string[], rowAccounting: object, duplicates: object,
 *            completeness: object|null, contradictions: object, timestamps: object}}
 */
export function reconcile(input) {
  const { metrics, accepted, keyFn, expectedDays } = input;
  const rowAccounting = assertRowAccounting(metrics);
  const duplicates = findDuplicateKeys(accepted, keyFn);
  const contradictions = findContradictoryDaily(accepted);
  const timestamps = findTimestampInconsistencies(accepted);
  const completeness = expectedDays ? assessCompleteness({ expectedDays, records: accepted }) : null;

  const failures = [];
  if (!rowAccounting.balanced) failures.push(rowAccounting.detail);
  if (duplicates.duplicateCount > 0) failures.push(`${duplicates.duplicateCount} duplicate canonical key(s) in the accepted set`);
  if (contradictions.conflictCount > 0) failures.push(`${contradictions.conflictCount} contradictory daily record group(s)`);
  if (timestamps.count > 0) failures.push(`${timestamps.count} record(s) with inconsistent timestamps`);
  if (completeness && !completeness.complete) {
    failures.push(`completeness: ${completeness.missingDays.length} expected day(s) missing, ${completeness.unexpectedDays.length} unexpected day(s)`);
  }

  return Object.freeze({
    reconciled: failures.length === 0,
    failures: Object.freeze(failures),
    rowAccounting,
    duplicates,
    completeness,
    contradictions,
    timestamps,
  });
}
