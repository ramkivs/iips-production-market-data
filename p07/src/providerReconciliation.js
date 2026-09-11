/**
 * P07-03 — PROVIDER RECONCILIATION SERVICE
 *
 * ── Authority ──────────────────────────────────────────────────────────────────────────────
 *   TRACKER `Work Tracker`!P07-03: Requirement *"Compare overlapping provider/reference
 *   values and resolve policy"* · Dependencies `P02-03, P07-01` · Hard ·
 *   entry *"Providers selected"* · exit *"Discrepancies classified"* ·
 *   test *"Reconciliation tests"* · evidence *"Reconciliation reports"* ·
 *   authority/gate *"Phase gate"*.
 *
 *   Authorized by Program Authority implementation authorization (commit `c91690b`).
 *   Contract basis: `docs/D14_PHASE_07_CONTRACT_BASIS.md` §6.
 *   Policy/state: `docs/D15_PHASE_07_POLICY_STATE_CONTRACT.md` §3.
 *   Resolution policy: `docs/PHASE_07_O2_ACT_C_RESOLUTION_POLICY.md` (O-2 Act C v1.0).
 *   Provider selection: `docs/PHASE_07_O3_ACT_B_SELECTION.md` (O-3 Act B — NSE).
 *
 * ── Selected provider ──────────────────────────────────────────────────────────────────────
 *   **NSE (National Stock Exchange of India)** — selected by Program Authority (O-3 Act B).
 *   Coverage: D01–D06, D10 (7 of 10 domains).
 *   NOT covered: D07 (analyst estimates), D08 (macro), D09 (alt data).
 *
 * ── Disposition types — closed set [O-2 Act C §1] ─────────────────────────────────────────
 *   | Disposition               | Definition                                              |
 *   |---------------------------|---------------------------------------------------------|
 *   | CLASSIFIED_PRESENTED      | Discrepancy classified, annotated, both records shown   |
 *   | UNRESOLVED_PRESENTED      | Classification failed, annotated unresolved, both shown|
 *
 *   **NO** `RESOLVED`, `MERGED`, `COLLAPSED`, `DROPPED`, or `OVERRIDDEN` disposition exists.
 *
 * ── Comparison dimensions — [D15 §3.4] ─────────────────────────────────────────────────────
 *   | Dimension | Description                                           |
 *   |-----------|-------------------------------------------------------|
 *   | CD-1      | Field-value equality/difference for overlapping keys  |
 *   | CD-2      | `asOf` alignment                                      |
 *   | CD-3      | `completenessPct` difference                          |
 *   | CD-4      | `quality` difference                                  |
 *   | CD-5      | Lineage/version difference (`dataVersion`)            |
 *
 * ── Boundaries (hard) ──────────────────────────────────────────────────────────────────────
 *   ⚠ **DC-5** NO precedence-based value collapse. NO "last wins". NO silent overwrite.
 *   ⚠ **RJ-6** Prohibited without exception: silent overwrite, precedence rules, "last wins",
 *     dropping a field, substituting a default, downgrading a rejection to quality:'partial'.
 *   ⚠ **C5** Fail-closed. No partial merge, no precedence, no coercion, no warning-and-continue.
 *   ⚠ **PN-5** Two providers asserting the same instrument produce two canonical identities.
 *   ⚠ **RI-3** Provider identity is never flattened.
 *   ⚠ **L-2** Cross-provider distinctness is structural.
 *   ⚠ **CR-1** Consumers see both records and the classification.
 *   ⚠ **CR-2** Quality/completeness propagate unchanged (INV-7).
 *   ⚠ **CR-3** No new quality state (Q-1).
 *   ⚠ **Q-5** A discrepancy is not a contract violation.
 *   ⚠ **Tolerance** Exact-match baseline — no numeric tolerance [O-2 Act C §3].
 *   ⚠ **Tie-breaking** NONE — all records presented [O-2 Act C §4].
 *   ⚠ **Precedence** Reporting order only (CD-1→CD-5); NOT value-collapse [O-2 Act C §5].
 *
 * ── Reuse, not duplication ─────────────────────────────────────────────────────────────────
 *   ⚠ QUALITY imported from `p05/src/contract.js`.
 *   ⚠ evaluateQualityRules from `./qualityRuleFramework.js` (P07-01).
 *   ⚠ evaluateFreshness from `./freshnessEvaluation.js` (P07-02).
 *   ⚠ classifyDataCondition from `./degradedStateContract.js` (P07-04).
 */

import { QUALITY } from '../../p05/src/contract.js';

// ── Disposition types — closed set [O-2 Act C §1] ──────────────────────────────────────────

/** The exactly-two authoritative disposition types. Closed set. */
export const DISPOSITION_TYPES = Object.freeze([
  'CLASSIFIED_PRESENTED',
  'UNRESOLVED_PRESENTED',
]);

// ── Comparison dimensions — [D15 §3.4] ─────────────────────────────────────────────────────

/** The exactly-five comparison dimensions. Reporting order. */
export const COMPARISON_DIMENSIONS = Object.freeze([
  'CD-1', // field-value equality/difference
  'CD-2', // asOf alignment
  'CD-3', // completenessPct difference
  'CD-4', // quality difference
  'CD-5', // lineage/version difference
]);

// ── NSE provider identity and coverage ────────────────────────────────────────────────────

/** Selected provider identity [O-3 Act B]. */
export const SELECTED_PROVIDER_ID = 'NSE';

/**
 * NSE domain coverage assessment [O-3 Act B rubric evaluation].
 *
 * | Domain | Status       | Evidence                              |
 * |--------|--------------|---------------------------------------|
 * | D01    | COVERED      | NSE CM, FO, CDS real-time L1          |
 * | D02    | COVERED      | Bhavcopy, historical intraday         |
 * | D03    | PARTIAL      | Corporate financials, limited standard|
 * | D04    | COVERED      | Corporate announcements, ex-dates     |
 * | D05    | COVERED      | Listing info, symbol metadata         |
 * | D06    | PARTIAL      | Exchange announcements only           |
 * | D07    | NOT_COVERED  | NSE does not provide analyst estimates|
 * | D08    | NOT_COVERED  | NSE does not provide macro data       |
 * | D09    | NOT_COVERED  | NSE does not provide alt data         |
 * | D10    | COVERED      | Market status, turnover, statistics   |
 */
export const NSE_DOMAIN_COVERAGE = Object.freeze({
  D01: 'COVERED',
  D02: 'COVERED',
  D03: 'PARTIAL',
  D04: 'COVERED',
  D05: 'COVERED',
  D06: 'PARTIAL',
  D07: 'NOT_COVERED',
  D08: 'NOT_COVERED',
  D09: 'NOT_COVERED',
  D10: 'COVERED',
});

/** Coverage statuses — closed set. */
export const COVERAGE_STATUSES = Object.freeze([
  'COVERED',
  'PARTIAL',
  'NOT_COVERED',
]);

// ── Tolerance policy — exact-match baseline [O-2 Act C §3] ─────────────────────────────────

/**
 * Compare two values with exact-match semantics.
 * No numeric tolerance. No epsilon. No fuzzy matching.
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean}
 */
function exactMatch(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a === 'object') {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();
    if (keysA.length !== keysB.length) return false;
    for (let i = 0; i < keysA.length; i++) {
      if (keysA[i] !== keysB[i]) return false;
      if (!exactMatch(a[keysA[i]], b[keysB[i]])) return false;
    }
    return true;
  }
  return false;
}

// ── Snapshot validation ────────────────────────────────────────────────────────────────────

/**
 * Validate that an input is a canonical snapshot with required fields.
 * Throws TypeError if invalid.
 */
function validateSnapshot(snapshot, label) {
  if (snapshot === null || typeof snapshot !== 'object') {
    throw new TypeError(`${label} must be a non-null object`);
  }
  if (typeof snapshot.snapshotId !== 'string' || !snapshot.snapshotId) {
    throw new TypeError(`${label} must have a string snapshotId`);
  }
  if (typeof snapshot.domain !== 'string' || !snapshot.domain) {
    throw new TypeError(`${label} must have a string domain`);
  }
  if (!snapshot.fields || typeof snapshot.fields !== 'object') {
    throw new TypeError(`${label} must have a fields object`);
  }
}

// ── Comparison functions — one per dimension ───────────────────────────────────────────────

/**
 * CD-1: Field-value equality/difference for overlapping namespaced keys.
 *
 * Compares all keys present in both snapshots. Uses exact-match (no tolerance).
 *
 * @returns {object[]} Array of discrepancy records for CD-1
 */
function compareFieldValues(fieldsA, fieldsB, idA, idB) {
  const discrepancies = [];
  const allKeys = new Set([...Object.keys(fieldsA), ...Object.keys(fieldsB)]);

  for (const key of allKeys) {
    const inA = key in fieldsA;
    const inB = key in fieldsB;

    if (inA && inB) {
      // Both have the key — compare values
      if (!exactMatch(fieldsA[key], fieldsB[key])) {
        discrepancies.push({
          dimension: 'CD-1',
          key,
          recordA: idA,
          recordB: idB,
          valueA: fieldsA[key],
          valueB: fieldsB[key],
          classification: 'FIELD_VALUE_DIFFERENCE',
        });
      }
    } else if (inA && !inB) {
      discrepancies.push({
        dimension: 'CD-1',
        key,
        recordA: idA,
        recordB: idB,
        valueA: fieldsA[key],
        valueB: null,
        classification: 'FIELD_PRESENT_ONLY_IN_A',
      });
    } else {
      discrepancies.push({
        dimension: 'CD-1',
        key,
        recordA: idA,
        recordB: idB,
        valueA: null,
        valueB: fieldsB[key],
        classification: 'FIELD_PRESENT_ONLY_IN_B',
      });
    }
  }

  return discrepancies;
}

/**
 * CD-2: asOf alignment — whether the compared snapshots describe the same instant.
 */
function compareAsOf(snapshotA, snapshotB) {
  const discrepancies = [];
  const asOfA = snapshotA.asOf || null;
  const asOfB = snapshotB.asOf || null;

  if (!exactMatch(asOfA, asOfB)) {
    discrepancies.push({
      dimension: 'CD-2',
      recordA: snapshotA.snapshotId,
      recordB: snapshotB.snapshotId,
      valueA: asOfA,
      valueB: asOfB,
      classification: 'ASOF_MISALIGNED',
    });
  }

  return discrepancies;
}

/**
 * CD-3: completenessPct difference.
 */
function compareCompleteness(snapshotA, snapshotB) {
  const discrepancies = [];
  const cA = snapshotA.completenessPct ?? null;
  const cB = snapshotB.completenessPct ?? null;

  if (!exactMatch(cA, cB)) {
    discrepancies.push({
      dimension: 'CD-3',
      recordA: snapshotA.snapshotId,
      recordB: snapshotB.snapshotId,
      valueA: cA,
      valueB: cB,
      classification: 'COMPLETENESS_DIFFERENCE',
    });
  }

  return discrepancies;
}

/**
 * CD-4: quality difference.
 */
function compareQuality(snapshotA, snapshotB) {
  const discrepancies = [];
  const qA = snapshotA.quality || null;
  const qB = snapshotB.quality || null;

  if (!exactMatch(qA, qB)) {
    discrepancies.push({
      dimension: 'CD-4',
      recordA: snapshotA.snapshotId,
      recordB: snapshotB.snapshotId,
      valueA: qA,
      valueB: qB,
      classification: 'QUALITY_DIFFERENCE',
    });
  }

  return discrepancies;
}

/**
 * CD-5: Lineage/version difference (dataVersion).
 */
function compareLineage(snapshotA, snapshotB) {
  const discrepancies = [];
  const vA = snapshotA.dataVersion || null;
  const vB = snapshotB.dataVersion || null;

  if (!exactMatch(vA, vB)) {
    discrepancies.push({
      dimension: 'CD-5',
      recordA: snapshotA.snapshotId,
      recordB: snapshotB.snapshotId,
      valueA: vA,
      valueB: vB,
      classification: 'LINEAGE_VERSION_DIFFERENCE',
    });
  }

  return discrepancies;
}

// ── Core comparison ────────────────────────────────────────────────────────────────────────

/**
 * Compare two canonical snapshots across all five dimensions (CD-1 through CD-5).
 *
 * Pure function — deterministic, no wall clock, no mutation.
 * Tolerance: exact-match only (no numeric tolerance).
 * Tie-breaking: none — all discrepancies reported.
 * Precedence: reporting order only (CD-1→CD-5).
 *
 * @param {object} snapshotA — first canonical snapshot
 * @param {object} snapshotB — second canonical snapshot
 * @returns {Readonly<{
 *   discrepancies: ReadonlyArray<object>,
 *   recordA: string,
 *   recordB: string,
 *   domain: string,
 *   comparisonDimensions: ReadonlyArray<string>,
 * }>}
 */
export function compareCanonicalSnapshots(snapshotA, snapshotB) {
  validateSnapshot(snapshotA, 'snapshotA');
  validateSnapshot(snapshotB, 'snapshotB');

  // ID-2: two snapshots from different providers are distinct records (PN-5, RI-3)
  if (snapshotA.snapshotId === snapshotB.snapshotId) {
    throw new Error(
      'ID-2 violation: snapshots must have distinct snapshotIds — ' +
      'two snapshots from different providers are distinct records (PN-5, RI-3, L-2)'
    );
  }

  const allDiscrepancies = [];

  // Reporting order: CD-1 → CD-2 → CD-3 → CD-4 → CD-5 [O-2 Act C §5]
  allDiscrepancies.push(
    ...compareFieldValues(snapshotA.fields, snapshotB.fields, snapshotA.snapshotId, snapshotB.snapshotId)
  );
  allDiscrepancies.push(...compareAsOf(snapshotA, snapshotB));
  allDiscrepancies.push(...compareCompleteness(snapshotA, snapshotB));
  allDiscrepancies.push(...compareQuality(snapshotA, snapshotB));
  allDiscrepancies.push(...compareLineage(snapshotA, snapshotB));

  return Object.freeze({
    discrepancies: Object.freeze(allDiscrepancies.map((d) => Object.freeze({ ...d }))),
    recordA: snapshotA.snapshotId,
    recordB: snapshotB.snapshotId,
    domain: snapshotA.domain,
    comparisonDimensions: COMPARISON_DIMENSIONS,
  });
}

// ── Reconciliation (full disposition) ──────────────────────────────────────────────────────

/**
 * Reconcile two canonical snapshots: compare, classify, and disposition.
 *
 * Implements the O-2 Act C resolution policy:
 * - Disposition: CLASSIFIED_PRESENTED or UNRESOLVED_PRESENTED (closed set)
 * - Tolerance: exact-match only
 * - Tie-breaking: none
 * - Precedence: reporting order only
 * - Both records always preserved (CR-1, PN-5, RI-3)
 * - Quality/completeness propagate unchanged (CR-2, INV-7)
 * - No new quality state (CR-3, Q-1)
 *
 * Fail-closed: if classification fails, disposition = UNRESOLVED_PRESENTED.
 *
 * @param {object} snapshotA — first canonical snapshot
 * @param {object} snapshotB — second canonical snapshot
 * @returns {Readonly<{
 *   disposition: string,
 *   recordA: Readonly<object>,
 *   recordB: Readonly<object>,
 *   comparison: Readonly<object>,
 *   domain: string,
 *   domainCoverage: object|null,
 *   providerA: string|null,
 *   providerB: string|null,
 * }>}
 */
export function reconcileCanonicalSnapshots(snapshotA, snapshotB) {
  let comparison;

  try {
    comparison = compareCanonicalSnapshots(snapshotA, snapshotB);
  } catch (err) {
    // Fail-closed: classification failure → UNRESOLVED_PRESENTED [O-2 Act C §8, UR-1, C5]
    return Object.freeze({
      disposition: 'UNRESOLVED_PRESENTED',
      recordA: snapshotA && typeof snapshotA === 'object' ? Object.freeze({ ...snapshotA }) : null,
      recordB: snapshotB && typeof snapshotB === 'object' ? Object.freeze({ ...snapshotB }) : null,
      comparison: Object.freeze({
        discrepancies: Object.freeze([]),
        recordA: (snapshotA && typeof snapshotA === 'object' && snapshotA.snapshotId) || null,
        recordB: (snapshotB && typeof snapshotB === 'object' && snapshotB.snapshotId) || null,
        error: err.message,
      }),
      domain: (snapshotA && typeof snapshotA === 'object' && snapshotA.domain) ||
              (snapshotB && typeof snapshotB === 'object' && snapshotB.domain) || null,
      domainCoverage: resolveDomainCoverage(
        (snapshotA && typeof snapshotA === 'object' && snapshotA.domain) || null
      ),
      providerA: (snapshotA && typeof snapshotA === 'object') ? extractProviderId(snapshotA) : null,
      providerB: (snapshotB && typeof snapshotB === 'object') ? extractProviderId(snapshotB) : null,
    });
  }

  // Check domain coverage for the selected provider (NSE)
  const domainCoverage = resolveDomainCoverage(snapshotA.domain);

  // Disposition: CLASSIFIED_PRESENTED [O-2 Act C §1]
  return Object.freeze({
    disposition: 'CLASSIFIED_PRESENTED',
    recordA: Object.freeze({ ...snapshotA }),
    recordB: Object.freeze({ ...snapshotB }),
    comparison,
    domain: snapshotA.domain,
    domainCoverage,
    providerA: extractProviderId(snapshotA),
    providerB: extractProviderId(snapshotB),
  });
}

/**
 * Resolve domain coverage for the selected provider (NSE).
 * Returns null if domain is not specified.
 */
function resolveDomainCoverage(domain) {
  if (!domain) return null;
  const coverage = NSE_DOMAIN_COVERAGE[domain];
  if (!coverage) return null;
  return Object.freeze({
    provider: SELECTED_PROVIDER_ID,
    domain,
    coverage,
    isSupported: coverage !== 'NOT_COVERED',
  });
}

/**
 * Extract provider identity from a snapshot's snapshotId.
 * Per AD-6 / L-2: snapshotId format is `data-${provider}-${dataVersion}-${asOf}`.
 */
function extractProviderId(snapshot) {
  if (!snapshot || !snapshot.snapshotId) return null;
  const parts = snapshot.snapshotId.split('-');
  // data-{provider}-{dataVersion}-{asOf}
  if (parts.length >= 2 && parts[0] === 'data') {
    return parts[1];
  }
  return snapshot.providerRef || null;
}

// ── Unsupported domain handling ────────────────────────────────────────────────────────────

/**
 * Check whether a domain is supported by the selected provider (NSE).
 *
 * @param {string} domain — D01 through D10
 * @returns {Readonly<{supported: boolean, coverage: string|null, provider: string}>}
 */
export function checkDomainSupport(domain) {
  const coverage = NSE_DOMAIN_COVERAGE[domain] || null;
  return Object.freeze({
    supported: coverage !== 'NOT_COVERED' && coverage !== null,
    coverage,
    provider: SELECTED_PROVIDER_ID,
  });
}

/**
 * Reconcile with unsupported-domain awareness.
 *
 * If either snapshot's domain is NOT_COVERED by the selected provider,
 * the reconciliation records this fact but still performs the comparison
 * (the data may come from a different source or a future provider).
 *
 * @param {object} snapshotA
 * @param {object} snapshotB
 * @returns {Readonly<object>}
 */
export function reconcileWithCoverageCheck(snapshotA, snapshotB) {
  const result = reconcileCanonicalSnapshots(snapshotA, snapshotB);
  const coverageA = checkDomainSupport(snapshotA?.domain);
  const coverageB = checkDomainSupport(snapshotB?.domain);

  return Object.freeze({
    ...result,
    coverageCheck: Object.freeze({
      recordA: coverageA,
      recordB: coverageB,
      bothSupported: coverageA.supported && coverageB.supported,
    }),
  });
}
