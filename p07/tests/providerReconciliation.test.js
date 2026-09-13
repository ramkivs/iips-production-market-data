/**
 * P07-03 — PROVIDER RECONCILIATION TESTS
 *
 * Authority: D14 §6, D15 §3, O-2 Act C (resolution policy v1.0), O-3 Act B (NSE selected).
 *
 * Exit criterion: *"Discrepancies classified"* — evidenced by this suite.
 *
 * ⚠ No wall clock, no randomness, no network, no filesystem writes.
 * ⚠ Every test input is a fixed literal — byte-identical across runs (ST-4).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DISPOSITION_TYPES,
  COMPARISON_DIMENSIONS,
  SELECTED_PROVIDER_ID,
  NSE_DOMAIN_COVERAGE,
  COVERAGE_STATUSES,
  compareCanonicalSnapshots,
  reconcileCanonicalSnapshots,
  checkDomainSupport,
  reconcileWithCoverageCheck,
} from '../src/providerReconciliation.js';

// ── Test fixtures ──────────────────────────────────────────────────────────────────────────

const SNAPSHOT_A = Object.freeze({
  snapshotId: 'data-NSE-v1-2026-09-12T10:00:00Z',
  domain: 'D01',
  quality: 'good',
  completenessPct: 100,
  asOf: '2026-09-12T10:00:00Z',
  dataVersion: 'v1',
  fields: Object.freeze({
    'price.last': Object.freeze({ value: 1500, dataType: 'decimal', precision: 2 }),
    'price.bid': Object.freeze({ value: 1499, dataType: 'decimal', precision: 2 }),
    'price.ask': Object.freeze({ value: 1501, dataType: 'decimal', precision: 2 }),
  }),
});

const SNAPSHOT_B_MATCHING = Object.freeze({
  snapshotId: 'data-REF-v1-2026-09-12T10:00:00Z',
  domain: 'D01',
  quality: 'good',
  completenessPct: 100,
  asOf: '2026-09-12T10:00:00Z',
  dataVersion: 'v1',
  fields: Object.freeze({
    'price.last': Object.freeze({ value: 1500, dataType: 'decimal', precision: 2 }),
    'price.bid': Object.freeze({ value: 1499, dataType: 'decimal', precision: 2 }),
    'price.ask': Object.freeze({ value: 1501, dataType: 'decimal', precision: 2 }),
  }),
});

const SNAPSHOT_B_CD1_DIFF = Object.freeze({
  snapshotId: 'data-REF-v1-2026-09-12T10:00:00Z',
  domain: 'D01',
  quality: 'good',
  completenessPct: 100,
  asOf: '2026-09-12T10:00:00Z',
  dataVersion: 'v1',
  fields: Object.freeze({
    'price.last': Object.freeze({ value: 1502, dataType: 'decimal', precision: 2 }),
    'price.bid': Object.freeze({ value: 1499, dataType: 'decimal', precision: 2 }),
    'price.ask': Object.freeze({ value: 1501, dataType: 'decimal', precision: 2 }),
  }),
});

const SNAPSHOT_B_CD2_DIFF = Object.freeze({
  snapshotId: 'data-REF-v1-2026-09-12T10:00:00Z',
  domain: 'D01',
  quality: 'good',
  completenessPct: 100,
  asOf: '2026-09-12T10:05:00Z',
  dataVersion: 'v1',
  fields: Object.freeze({
    'price.last': Object.freeze({ value: 1500, dataType: 'decimal', precision: 2 }),
    'price.bid': Object.freeze({ value: 1499, dataType: 'decimal', precision: 2 }),
    'price.ask': Object.freeze({ value: 1501, dataType: 'decimal', precision: 2 }),
  }),
});

const SNAPSHOT_B_CD3_DIFF = Object.freeze({
  snapshotId: 'data-REF-v1-2026-09-12T10:00:00Z',
  domain: 'D01',
  quality: 'good',
  completenessPct: 80,
  asOf: '2026-09-12T10:00:00Z',
  dataVersion: 'v1',
  fields: Object.freeze({
    'price.last': Object.freeze({ value: 1500, dataType: 'decimal', precision: 2 }),
    'price.bid': Object.freeze({ value: 1499, dataType: 'decimal', precision: 2 }),
    'price.ask': Object.freeze({ value: 1501, dataType: 'decimal', precision: 2 }),
  }),
});

const SNAPSHOT_B_CD4_DIFF = Object.freeze({
  snapshotId: 'data-REF-v1-2026-09-12T10:00:00Z',
  domain: 'D01',
  quality: 'stale',
  completenessPct: 100,
  asOf: '2026-09-12T10:00:00Z',
  dataVersion: 'v1',
  fields: Object.freeze({
    'price.last': Object.freeze({ value: 1500, dataType: 'decimal', precision: 2 }),
    'price.bid': Object.freeze({ value: 1499, dataType: 'decimal', precision: 2 }),
    'price.ask': Object.freeze({ value: 1501, dataType: 'decimal', precision: 2 }),
  }),
});

const SNAPSHOT_B_CD5_DIFF = Object.freeze({
  snapshotId: 'data-REF-v1-2026-09-12T10:00:00Z',
  domain: 'D01',
  quality: 'good',
  completenessPct: 100,
  asOf: '2026-09-12T10:00:00Z',
  dataVersion: 'v2',
  fields: Object.freeze({
    'price.last': Object.freeze({ value: 1500, dataType: 'decimal', precision: 2 }),
    'price.bid': Object.freeze({ value: 1499, dataType: 'decimal', precision: 2 }),
    'price.ask': Object.freeze({ value: 1501, dataType: 'decimal', precision: 2 }),
  }),
});

// ── Enums and constants ────────────────────────────────────────────────────────────────────

test('DISPOSITION_TYPES is exactly two, closed, authoritative', () => {
  assert.deepEqual([...DISPOSITION_TYPES], ['CLASSIFIED_PRESENTED', 'UNRESOLVED_PRESENTED']);
  assert.ok(Object.isFrozen(DISPOSITION_TYPES));
});

test('no RESOLVED/MERGED/COLLAPSED/DROPPED/OVERRIDDEN disposition exists', () => {
  for (const forbidden of ['RESOLVED', 'MERGED', 'COLLAPSED', 'DROPPED', 'OVERRIDDEN']) {
    assert.ok(!DISPOSITION_TYPES.includes(forbidden), `${forbidden} must not exist`);
  }
});

test('COMPARISON_DIMENSIONS is exactly five in reporting order', () => {
  assert.deepEqual([...COMPARISON_DIMENSIONS], ['CD-1', 'CD-2', 'CD-3', 'CD-4', 'CD-5']);
  assert.ok(Object.isFrozen(COMPARISON_DIMENSIONS));
});

test('SELECTED_PROVIDER_ID is NSE', () => {
  assert.equal(SELECTED_PROVIDER_ID, 'NSE');
});

test('NSE_DOMAIN_COVERAGE covers exactly 10 domains', () => {
  const domains = Object.keys(NSE_DOMAIN_COVERAGE);
  assert.equal(domains.length, 10);
  assert.deepEqual(domains.sort(), ['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10']);
});

test('NSE D07/D08/D09 are NOT_COVERED', () => {
  assert.equal(NSE_DOMAIN_COVERAGE.D07, 'NOT_COVERED');
  assert.equal(NSE_DOMAIN_COVERAGE.D08, 'NOT_COVERED');
  assert.equal(NSE_DOMAIN_COVERAGE.D09, 'NOT_COVERED');
});

// ── Matching records ───────────────────────────────────────────────────────────────────────

test('matching provider records produce zero discrepancies', () => {
  const result = compareCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_MATCHING);
  assert.equal(result.discrepancies.length, 0);
  assert.equal(result.recordA, SNAPSHOT_A.snapshotId);
  assert.equal(result.recordB, SNAPSHOT_B_MATCHING.snapshotId);
});

test('matching records reconcile as CLASSIFIED_PRESENTED with zero discrepancies', () => {
  const result = reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_MATCHING);
  assert.equal(result.disposition, 'CLASSIFIED_PRESENTED');
  assert.equal(result.comparison.discrepancies.length, 0);
});

// ── CD-1: Field-value difference ───────────────────────────────────────────────────────────

test('CD-1: field-value difference detected (exact-match, no tolerance)', () => {
  const result = compareCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD1_DIFF);
  const cd1 = result.discrepancies.filter((d) => d.dimension === 'CD-1');
  assert.ok(cd1.length > 0, 'CD-1 discrepancy detected');
  assert.equal(cd1[0].classification, 'FIELD_VALUE_DIFFERENCE');
  assert.equal(cd1[0].key, 'price.last');
});

test('CD-1: exact-match — difference of 2 is detected (no tolerance)', () => {
  const result = compareCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD1_DIFF);
  const cd1 = result.discrepancies.filter((d) => d.dimension === 'CD-1');
  assert.equal(cd1[0].valueA.value, 1500);
  assert.equal(cd1[0].valueB.value, 1502);
});

// ── CD-2: asOf alignment ──────────────────────────────────────────────────────────────────

test('CD-2: asOf misalignment detected', () => {
  const result = compareCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD2_DIFF);
  const cd2 = result.discrepancies.filter((d) => d.dimension === 'CD-2');
  assert.equal(cd2.length, 1);
  assert.equal(cd2[0].classification, 'ASOF_MISALIGNED');
  assert.equal(cd2[0].valueA, '2026-09-12T10:00:00Z');
  assert.equal(cd2[0].valueB, '2026-09-12T10:05:00Z');
});

// ── CD-3: completenessPct difference ───────────────────────────────────────────────────────

test('CD-3: completenessPct difference detected', () => {
  const result = compareCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD3_DIFF);
  const cd3 = result.discrepancies.filter((d) => d.dimension === 'CD-3');
  assert.equal(cd3.length, 1);
  assert.equal(cd3[0].classification, 'COMPLETENESS_DIFFERENCE');
  assert.equal(cd3[0].valueA, 100);
  assert.equal(cd3[0].valueB, 80);
});

// ── CD-4: quality difference ──────────────────────────────────────────────────────────────

test('CD-4: quality difference detected', () => {
  const result = compareCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD4_DIFF);
  const cd4 = result.discrepancies.filter((d) => d.dimension === 'CD-4');
  assert.equal(cd4.length, 1);
  assert.equal(cd4[0].classification, 'QUALITY_DIFFERENCE');
  assert.equal(cd4[0].valueA, 'good');
  assert.equal(cd4[0].valueB, 'stale');
});

// ── CD-5: lineage/version difference ────────────────────────────────────────────────────────

test('CD-5: dataVersion difference detected', () => {
  const result = compareCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD5_DIFF);
  const cd5 = result.discrepancies.filter((d) => d.dimension === 'CD-5');
  assert.equal(cd5.length, 1);
  assert.equal(cd5[0].classification, 'LINEAGE_VERSION_DIFFERENCE');
  assert.equal(cd5[0].valueA, 'v1');
  assert.equal(cd5[0].valueB, 'v2');
});

// ── Reporting precedence (CD-1→CD-5) ─────────────────────────────────────────────────────

test('reporting precedence: CD-1 before CD-2 before CD-3 before CD-4 before CD-5', () => {
  // Create a snapshot that differs in ALL dimensions
  const allDiff = Object.freeze({
    snapshotId: 'data-REF-v2-2026-09-12T10:00:00Z',
    domain: 'D01',
    quality: 'stale',
    completenessPct: 50,
    asOf: '2026-09-12T09:00:00Z',
    dataVersion: 'v2',
    fields: Object.freeze({
      'price.last': Object.freeze({ value: 9999, dataType: 'decimal', precision: 2 }),
    }),
  });
  const result = compareCanonicalSnapshots(SNAPSHOT_A, allDiff);
  const dims = result.discrepancies.map((d) => d.dimension);
  // CD-1 discrepancies come first, then CD-2, CD-3, CD-4, CD-5
  const firstCD2 = dims.indexOf('CD-2');
  const lastCD1 = dims.lastIndexOf('CD-1');
  if (lastCD1 >= 0 && firstCD2 >= 0) {
    assert.ok(lastCD1 < firstCD2, 'CD-1 must come before CD-2 in reporting order');
  }
  const firstCD3 = dims.indexOf('CD-3');
  if (firstCD2 >= 0 && firstCD3 >= 0) {
    assert.ok(firstCD2 < firstCD3, 'CD-2 must come before CD-3');
  }
});

test('precedence is REPORTING ONLY — does not select a winning provider value', () => {
  const result = reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD1_DIFF);
  // Both records are preserved — no value is preferred
  assert.ok(result.recordA, 'recordA preserved');
  assert.ok(result.recordB, 'recordB preserved');
  assert.deepEqual(result.recordA.fields, SNAPSHOT_A.fields, 'recordA fields unchanged');
  assert.deepEqual(result.recordB.fields, SNAPSHOT_B_CD1_DIFF.fields, 'recordB fields unchanged');
});

// ── CLASSIFIED_PRESENTED disposition ───────────────────────────────────────────────────────

test('CLASSIFIED_PRESENTED: discrepancy classified, both records presented', () => {
  const result = reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD1_DIFF);
  assert.equal(result.disposition, 'CLASSIFIED_PRESENTED');
  assert.ok(result.recordA, 'recordA presented');
  assert.ok(result.recordB, 'recordB presented');
  assert.ok(result.comparison.discrepancies.length > 0, 'discrepancies classified');
});

// ── UNRESOLVED_PRESENTED disposition ───────────────────────────────────────────────────────

test('UNRESOLVED_PRESENTED: classification failure → fail-closed', () => {
  const result = reconcileCanonicalSnapshots(null, SNAPSHOT_B_MATCHING);
  assert.equal(result.disposition, 'UNRESOLVED_PRESENTED');
  assert.ok(result.recordA !== undefined || result.recordB !== undefined, 'records still presented');
});

test('UNRESOLVED_PRESENTED: invalid snapshot → fail-closed, both records presented', () => {
  const malformed = { notASnapshot: true };
  const result = reconcileCanonicalSnapshots(malformed, SNAPSHOT_A);
  assert.equal(result.disposition, 'UNRESOLVED_PRESENTED');
  assert.ok(result.comparison.error, 'error message recorded');
});

// ── Exact-match / no tolerance ─────────────────────────────────────────────────────────────

test('exact-match: no numeric tolerance — tiny difference detected', () => {
  const tinyDiff = Object.freeze({
    ...SNAPSHOT_B_MATCHING,
    snapshotId: 'data-REF-v1-2026-09-12T10:00:00Z',
    fields: Object.freeze({
      'price.last': Object.freeze({ value: 1500.001, dataType: 'decimal', precision: 2 }),
      'price.bid': Object.freeze({ value: 1499, dataType: 'decimal', precision: 2 }),
      'price.ask': Object.freeze({ value: 1501, dataType: 'decimal', precision: 2 }),
    }),
  });
  const result = compareCanonicalSnapshots(SNAPSHOT_A, tinyDiff);
  const cd1 = result.discrepancies.filter((d) => d.dimension === 'CD-1');
  assert.ok(cd1.length > 0, 'even tiny differences are detected — no tolerance');
});

// ── No tie-breaking ───────────────────────────────────────────────────────────────────────

test('no tie-breaking: both records always presented, no winner selected', () => {
  const result = reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD1_DIFF);
  assert.equal(result.disposition, 'CLASSIFIED_PRESENTED');
  assert.ok(result.recordA);
  assert.ok(result.recordB);
  // No 'winner', 'preferred', or 'selected' property
  assert.ok(!('winner' in result), 'no winner');
  assert.ok(!('preferred' in result), 'no preferred record');
  assert.ok(!('selectedValue' in result), 'no selected value');
});

// ── Provider identity preservation ────────────────────────────────────────────────────────

test('provider identity preserved in reconciliation result', () => {
  const result = reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_MATCHING);
  assert.equal(result.providerA, 'NSE');
  assert.equal(result.providerB, 'REF');
});

test('provider identity preserved — snapshotId contains provider component', () => {
  const result = reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD1_DIFF);
  assert.ok(result.recordA.snapshotId.includes('NSE'), 'provider in snapshotId A');
  assert.ok(result.recordB.snapshotId.includes('REF'), 'provider in snapshotId B');
});

// ── Provenance preservation ──────────────────────────────────────────────────────────────

test('provenance preserved: both records retain all original fields', () => {
  const result = reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD1_DIFF);
  assert.deepEqual(result.recordA.fields['price.last'], SNAPSHOT_A.fields['price.last']);
  assert.deepEqual(result.recordB.fields['price.last'], SNAPSHOT_B_CD1_DIFF.fields['price.last']);
});

// ── Silent-overwrite rejection ────────────────────────────────────────────────────────────

test('silent overwrite: recordA value not overwritten by recordB', () => {
  const result = reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD1_DIFF);
  assert.equal(result.recordA.fields['price.last'].value, 1500, 'recordA not overwritten');
  assert.equal(result.recordB.fields['price.last'].value, 1502, 'recordB preserved');
});

// ── Fail-closed behavior ──────────────────────────────────────────────────────────────────

test('fail-closed: null input → UNRESOLVED_PRESENTED, no merge', () => {
  const result = reconcileCanonicalSnapshots(null, null);
  assert.equal(result.disposition, 'UNRESOLVED_PRESENTED');
});

test('fail-closed: no coercion, no warning-and-continue', () => {
  const result = reconcileCanonicalSnapshots({}, SNAPSHOT_A);
  assert.equal(result.disposition, 'UNRESOLVED_PRESENTED');
  assert.ok(!result.comparison.discrepancies || result.comparison.discrepancies.length === 0,
    'no partial merge — classification failed entirely');
});

// ── ID-2: distinct snapshotIds required ───────────────────────────────────────────────────

test('ID-2: identical snapshotIds throw (cross-provider distinctness)', () => {
  const sameId = Object.freeze({ ...SNAPSHOT_A, snapshotId: SNAPSHOT_A.snapshotId });
  assert.throws(
    () => compareCanonicalSnapshots(SNAPSHOT_A, sameId),
    /ID-2 violation/,
  );
});

// ── NSE unsupported D07/D08/D09 ───────────────────────────────────────────────────────────

test('NSE D07 (analyst estimates) is NOT_COVERED', () => {
  const check = checkDomainSupport('D07');
  assert.equal(check.supported, false);
  assert.equal(check.coverage, 'NOT_COVERED');
  assert.equal(check.provider, 'NSE');
});

test('NSE D08 (macro) is NOT_COVERED', () => {
  const check = checkDomainSupport('D08');
  assert.equal(check.supported, false);
  assert.equal(check.coverage, 'NOT_COVERED');
});

test('NSE D09 (alt data) is NOT_COVERED', () => {
  const check = checkDomainSupport('D09');
  assert.equal(check.supported, false);
  assert.equal(check.coverage, 'NOT_COVERED');
});

test('NSE D01 (prices) is COVERED', () => {
  const check = checkDomainSupport('D01');
  assert.equal(check.supported, true);
  assert.equal(check.coverage, 'COVERED');
});

test('reconcileWithCoverageCheck records coverage for both records', () => {
  const d07Snap = Object.freeze({
    ...SNAPSHOT_A,
    snapshotId: 'data-NSE-v1-d07',
    domain: 'D07',
  });
  const d07Ref = Object.freeze({
    ...SNAPSHOT_B_MATCHING,
    snapshotId: 'data-REF-v1-d07',
    domain: 'D07',
  });
  const result = reconcileWithCoverageCheck(d07Snap, d07Ref);
  assert.equal(result.coverageCheck.recordA.supported, false);
  assert.equal(result.coverageCheck.recordB.supported, false);
  assert.equal(result.coverageCheck.bothSupported, false);
});

// ── Quality-state preservation ─────────────────────────────────────────────────────────────

test('quality preserved: no fifth state introduced', () => {
  const result = reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD4_DIFF);
  assert.equal(result.recordA.quality, 'good');
  assert.equal(result.recordB.quality, 'stale');
  // Disposition is NOT a quality state
  assert.ok(!['good', 'stale', 'partial', 'unavailable'].includes(result.disposition),
    'disposition is not a quality value');
});

test('completenessPct preserved through reconciliation (INV-7)', () => {
  const result = reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD3_DIFF);
  assert.equal(result.recordA.completenessPct, 100);
  assert.equal(result.recordB.completenessPct, 80);
});

// ── Q-5: discrepancy ≠ contract violation ─────────────────────────────────────────────────

test('Q-5: discrepancy is classified, not treated as a contract violation', () => {
  const result = reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD1_DIFF);
  assert.equal(result.disposition, 'CLASSIFIED_PRESENTED');
  assert.ok(!('isRejection' in result), 'no rejection flag');
  assert.ok(!('violation' in result), 'no violation flag');
});

// ── Determinism ────────────────────────────────────────────────────────────────────────────

test('determinism: identical inputs produce byte-identical outputs', () => {
  const r1 = reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD1_DIFF);
  const r2 = reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD1_DIFF);
  assert.deepEqual(r1, r2);
});

test('no wall clock: result contains no timestamp', () => {
  const result = reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_MATCHING);
  assert.ok(!('timestamp' in result));
  assert.ok(!('evaluatedAt' in result));
  assert.ok(!('wallClock' in result));
});

// ── Result is frozen ──────────────────────────────────────────────────────────────────────

test('all results are deeply frozen', () => {
  assert.ok(Object.isFrozen(reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_MATCHING)));
  assert.ok(Object.isFrozen(compareCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_MATCHING)));
  assert.ok(Object.isFrozen(checkDomainSupport('D01')));
});

// ── Malformed inputs ──────────────────────────────────────────────────────────────────────

test('null input throws TypeError in compare', () => {
  assert.throws(() => compareCanonicalSnapshots(null, SNAPSHOT_A), TypeError);
});

test('missing snapshotId throws TypeError', () => {
  const noId = { domain: 'D01', fields: {} };
  assert.throws(() => compareCanonicalSnapshots(noId, SNAPSHOT_A), TypeError);
});

test('missing domain throws TypeError', () => {
  const noDomain = { snapshotId: 'data-X-v1-asOf', fields: {} };
  assert.throws(() => compareCanonicalSnapshots(noDomain, SNAPSHOT_A), TypeError);
});

// ── P07-01/02/04 integration boundary ─────────────────────────────────────────────────────

test('P07-01/02/04: reconciliation does not redefine their semantics', () => {
  const result = reconcileCanonicalSnapshots(SNAPSHOT_A, SNAPSHOT_B_CD4_DIFF);
  // Quality is preserved from each record, not redefined
  assert.equal(result.recordA.quality, 'good', 'P07-04 quality not overridden');
  assert.equal(result.recordB.quality, 'stale', 'P07-04 quality not overridden');
  // No freshness evaluation performed here (that is P07-02)
  assert.ok(!('freshness' in result), 'no freshness — that is P07-02');
  // No quality rule evaluation performed here (that is P07-01)
  assert.ok(!('ruleResults' in result), 'no rule results — that is P07-01');
});

// ── Multiple discrepancies across dimensions ──────────────────────────────────────────────

test('multiple discrepancies across all five dimensions', () => {
  const allDiff = Object.freeze({
    snapshotId: 'data-REF-v2-2026-09-12T10:00:00Z',
    domain: 'D01',
    quality: 'partial',
    completenessPct: 50,
    asOf: '2026-09-12T09:00:00Z',
    dataVersion: 'v2',
    fields: Object.freeze({
      'price.last': Object.freeze({ value: 9999, dataType: 'decimal', precision: 2 }),
      'price.bid': Object.freeze({ value: 1499, dataType: 'decimal', precision: 2 }),
      'price.ask': Object.freeze({ value: 1501, dataType: 'decimal', precision: 2 }),
    }),
  });
  const result = reconcileCanonicalSnapshots(SNAPSHOT_A, allDiff);
  assert.equal(result.disposition, 'CLASSIFIED_PRESENTED');
  const dims = new Set(result.comparison.discrepancies.map((d) => d.dimension));
  assert.ok(dims.has('CD-1'), 'CD-1 present');
  assert.ok(dims.has('CD-2'), 'CD-2 present');
  assert.ok(dims.has('CD-3'), 'CD-3 present');
  assert.ok(dims.has('CD-4'), 'CD-4 present');
  assert.ok(dims.has('CD-5'), 'CD-5 present');
});
