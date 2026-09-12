/**
 * P09-02 — PUBLICATION TIME vs EFFECTIVE TIME (D03 fundamentals)
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   TRACKER `Work Tracker`!P09: Minimum evidence *Fundamentals lineage; publication vs
 *   effective time*.
 *
 *   `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1:
 *     T4  effectiveTime  — When the datum becomes economically effective (fiscal period end)
 *     T5  publicationTime — When the source published/released it
 *
 *   §1.1: Fundamentals (D03) requires T1, T2, T4, T5 (+ T6 where scoring contributes).
 *
 *   `P01_DATA_CONTRACT.md` §10:
 *     PIT-4: Publication time and effective time are both preserved for revision-bearing data;
 *            collapsing them is prohibited.
 *
 * ── The publication/effective distinction ──────────────────────────────────────────────────
 *   For fundamentals data, the two times represent fundamentally different facts:
 *
 *   **effectiveTime** = the fiscal period end date (e.g. 2025-03-31 for Q1 FY2025)
 *     — When the financial results became economically effective
 *     — This is the "as of" for the financial data
 *     — Used for PIT queries: "what were the fundamentals as of fiscal period end X?"
 *
 *   **publicationTime** = the filing/report date (e.g. 2025-05-15 when Q1 results were filed)
 *     — When the data was published/released by the company
 *     — This is the "when we learned it" timestamp
 *     — Critical for PIT: data is only knowable AFTER publication
 *     — A restatement has a NEW publicationTime but the SAME effectiveTime
 *
 *   ⚠ **PT-1** Collapsing these two times is PROHIBITED (PIT-4).
 *   ⚠ **PT-2** Both times are REQUIRED for every fundamentals data field (P01 §1.1).
 *   ⚠ **PT-3** effectiveTime ≤ publicationTime in normal course (results precede filing).
 *   ⚠ **PT-4** A negative gap (publication before effective) is NOT rejected — it may occur
 *     with forward-looking guidance or pre-announcements. It is FLAGGED, not rejected.
 *   ⚠ **PT-5** The gap between publication and effective is the "reporting lag" — a first-class
 *     datum, not an error.
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **NOT P07-02.** No freshness threshold evaluation. No threshold comparison.
 *   ⚠ **NOT P08.** No PIT storage. No vintage query.
 *   ⚠ **No wall clock, no randomness, no ambient input.**
 *   ⚠ **No coercion** — INV-7 preserved.
 *   ⚠ **No acceptance, no certification, no production activation.**
 *
 * ── Reuse, not duplication ─────────────────────────────────────────────────────────────────
 *   ⚠ `assertIsoUtc` imported from `p05/src/serialize.js`.
 *   ⚠ `ContractViolation` imported from `p05/src/serialize.js`.
 */

import { assertIsoUtc, ContractViolation } from '../../p05/src/serialize.js';

export const P09_02_MODULE = 'P09-02-PUBLICATION-EFFECTIVE-TIME';

/**
 * PT-1/PT-2 — Build a publication/effective time pair.
 *
 * @param {object} args
 * @param {string} args.effectiveTime    ISO-8601 UTC — fiscal period end
 * @param {string} args.publicationTime  ISO-8601 UTC — filing/report date
 * @returns {Readonly<Record<string, unknown>>}
 */
export function buildPublicationEffectivePair({ effectiveTime, publicationTime }) {
  // PT-2 — both REQUIRED
  if (typeof effectiveTime !== 'string') {
    throw new ContractViolation(['PT-2', 'SM-10'],
      'effectiveTime is REQUIRED for fundamentals — fiscal period end', { effectiveTime });
  }
  if (typeof publicationTime !== 'string') {
    throw new ContractViolation(['PT-2', 'SM-10', 'PIT-4'],
      'publicationTime is REQUIRED for fundamentals — filing/report date', { publicationTime });
  }

  assertIsoUtc(effectiveTime, 'effectiveTime');
  assertIsoUtc(publicationTime, 'publicationTime');

  const effectiveMs = Date.parse(effectiveTime);
  const publicationMs = Date.parse(publicationTime);
  const lagMs = publicationMs - effectiveMs;

  // PT-4 — negative gap flagged, not rejected
  const negativeLag = lagMs < 0;

  return Object.freeze({
    effectiveTime,
    publicationTime,
    /** PT-5 — reporting lag in milliseconds. Positive = publication after effective (normal). */
    reportingLagMs: lagMs,
    /** PT-5 — reporting lag in days. */
    reportingLagDays: Math.round(lagMs / (24 * 60 * 60 * 1000)),
    /** PT-4 — true if publication precedes effective (forward-looking guidance). */
    negativeLagFlagged: negativeLag,
    /** PT-1 — the two times are distinct (never collapsed). */
    collapsed: false,
    module: P09_02_MODULE,
  });
}

/**
 * PT-3 — Classify the temporal relationship between publication and effective time.
 *
 * @param {string} effectiveTime
 * @param {string} publicationTime
 * @returns {Readonly<Record<string, unknown>>}
 */
export function classifyTemporalRelationship(effectiveTime, publicationTime) {
  assertIsoUtc(effectiveTime, 'effectiveTime');
  assertIsoUtc(publicationTime, 'publicationTime');

  const effectiveMs = Date.parse(effectiveTime);
  const publicationMs = Date.parse(publicationTime);

  let relationship;
  if (publicationMs > effectiveMs) {
    relationship = 'RETROSPECTIVE'; // normal: results published after period end
  } else if (publicationMs === effectiveMs) {
    relationship = 'SAME_DAY'; // published on the effective date
  } else {
    relationship = 'PROSPECTIVE'; // PT-4: published before effective (guidance/pre-announcement)
  }

  return Object.freeze({
    effectiveTime,
    publicationTime,
    relationship,
    lagMs: publicationMs - effectiveMs,
    lagDays: Math.round((publicationMs - effectiveMs) / (24 * 60 * 60 * 1000)),
    /** PT-4 — prospective is flagged, not rejected. */
    flagged: relationship === 'PROSPECTIVE',
    module: P09_02_MODULE,
  });
}

/**
 * PT-1 — Assert that a snapshot's fields carry BOTH effectiveTime and publicationTime
 * where required, and that they are never collapsed into a single timestamp.
 *
 * @param {Record<string, unknown>} fields
 * @returns {{violations: string[], checked: number}}
 */
export function assertPublicationEffectiveDistinct(fields) {
  const violations = [];
  let checked = 0;

  for (const [key, field] of Object.entries(fields)) {
    if (field.availability !== 'PRESENT') continue;
    checked += 1;

    // PT-2 — both times required for data-bearing fields
    if (field.effectiveTime === undefined) {
      violations.push(`PT-2: '${key}' lacks effectiveTime`);
    }
    if (field.publicationTime === undefined) {
      violations.push(`PT-2: '${key}' lacks publicationTime`);
    }

    // PT-1 — if both present, they must be carried as DISTINCT slots
    // (buildField already enforces this structurally — they are separate fields on the object)
    // Here we verify the timestamps are valid ISO-8601 if present
    if (field.effectiveTime !== undefined) {
      try {
        assertIsoUtc(field.effectiveTime, `'${key}' effectiveTime`);
      } catch (e) {
        violations.push(`PT-1: '${key}' effectiveTime is not valid ISO-8601 UTC`);
      }
    }
    if (field.publicationTime !== undefined) {
      try {
        assertIsoUtc(field.publicationTime, `'${key}' publicationTime`);
      } catch (e) {
        violations.push(`PT-1: '${key}' publicationTime is not valid ISO-8601 UTC`);
      }
    }
  }

  return Object.freeze({
    violations: Object.freeze(violations),
    checked,
    clean: violations.length === 0,
    module: P09_02_MODULE,
  });
}

/**
 * PT-5 — Compute the reporting lag distribution across a set of fundamentals fields.
 * Useful for understanding the typical lag between fiscal period end and filing.
 *
 * @param {Record<string, unknown>} fields
 * @returns {Readonly<Record<string, unknown>>}
 */
export function computeReportingLagDistribution(fields) {
  const lags = [];

  for (const [, field] of Object.entries(fields)) {
    if (field.availability !== 'PRESENT') continue;
    if (field.effectiveTime === undefined || field.publicationTime === undefined) continue;

    const effectiveMs = Date.parse(field.effectiveTime);
    const publicationMs = Date.parse(field.publicationTime);
    lags.push(publicationMs - effectiveMs);
  }

  if (lags.length === 0) {
    return Object.freeze({
      count: 0,
      minLagDays: null,
      maxLagDays: null,
      meanLagDays: null,
      allRetrospective: true,
      module: P09_02_MODULE,
    });
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const lagDays = lags.map((ms) => Math.round(ms / dayMs));
  const min = Math.min(...lagDays);
  const max = Math.max(...lagDays);
  const mean = Math.round(lagDays.reduce((a, b) => a + b, 0) / lagDays.length);

  return Object.freeze({
    count: lags.length,
    minLagDays: min,
    maxLagDays: max,
    meanLagDays: mean,
    allRetrospective: lagDays.every((d) => d >= 0),
    anyProspective: lagDays.some((d) => d < 0),
    module: P09_02_MODULE,
  });
}
