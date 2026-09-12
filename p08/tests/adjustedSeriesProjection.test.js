/**
 * P08-03 — ADJUSTED / UNADJUSTED SERIES TESTS ("Golden scenarios" / "Adjustment evidence").
 *
 * Covers the 27 required areas, with particular weight on the AG-2 firewall: that NO adjustment
 * methodology is invented, and that refusal — not a guess — is the behaviour where the corpus is
 * silent.
 *
 * ⚠ Implementation evidence, NOT certification evidence.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

import {
  unadjustedSeries, adjustedSeries, seriesAsOf, reconcileHoldings,
  resolveDeclaredFactor, adjustmentBasisRef, AdjustmentError,
  SERIES_BASIS, ADJUSTMENT_RULES, ADJUSTMENT_EVIDENCE,
} from '../src/adjustedSeriesProjection.js';
import { createPitStore } from '../src/pitStorageModel.js';
import { createCorporateActionPipeline, caKey } from '../src/corporateActionIngestion.js';
import { DISPOSITION_TYPES } from '../../p07/src/providerReconciliation.js';
import { repoRoot, p08Root } from './helpers.js';

const git = (a) => execFileSync('git', a.split(' '), { cwd: repoRoot, encoding: 'utf8' }).trim();
const FIGI_A = 'BBG000B9XRY4';

/** Deterministic golden fixture: an unadjusted D02 bar. */
function bar(asOf, close) {
  return {
    snapshotId: `data-fixture-1.0-${asOf}`,
    provider: 'fixture', dataVersion: '1.0', schemaVersion: '1.2', namespaceVersion: 'NSv1.0',
    asOf, mode: 'PIT', quality: 'good', domain: 'D02', securityId: FIGI_A,
    fields: { 'MD:ohlcv.open': close - 1, 'MD:ohlcv.close': close, 'MD:ohlcv.volume': 1000 },
  };
}

/** A corporate action carrying a DECLARED factor. */
function caWithFactor(asOf, adjustmentFactor) {
  return {
    actionType: 'split', securityId: FIGI_A, lifecycleStatus: 'active',
    effectiveDate: '2024-03-15T00:00:00.000Z', effectiveTime: '2024-03-15T00:00:00.000Z',
    exDate: '2024-03-10T00:00:00.000Z', recordDate: '2024-03-12T00:00:00.000Z',
    payDate: '2024-03-20T00:00:00.000Z', ratio: 2, adjustmentFactor,
    __asOf: asOf,
  };
}

function seeded({ factor = 0.5, caAsOf = '2024-03-16T00:00:00.000Z' } = {}) {
  const store = createPitStore();
  store.append(bar('2024-01-02T00:00:00.000Z', 100));
  store.append(bar('2024-02-01T00:00:00.000Z', 110));
  const pipeline = createCorporateActionPipeline(store);
  const ca = pipeline.ingest(caWithFactor(caAsOf, factor),
    { provider: 'fixture', dataVersion: '1.0', asOf: caAsOf });
  return { store, ca };
}

/* ── 1-3. UNADJUSTED / PROJECTION / IMMUTABILITY ──────────────────────────────────────────── */

test('AS-5 — the unadjusted series is returned unchanged and flagged unadjusted', () => {
  const { store } = seeded();
  const s = unadjustedSeries(store, 'D02', FIGI_A);
  assert.equal(s.basis, 'unadjusted');
  assert.equal(s.adjustmentApplied, false);
  assert.equal(s.adjustmentBasisRef, null);
  assert.equal(s.bars[0].fields['MD:ohlcv.close'], 100, 'raw value untouched');
});

test('AS-6 — the adjusted series is a READ-SIDE projection; stored vintages are NOT rewritten', () => {
  const { store, ca } = seeded({ factor: 0.5 });
  const before = JSON.stringify(store.seriesOf('D02', FIGI_A));
  const adj = adjustedSeries(store, FIGI_A, [ca]);
  const after = JSON.stringify(store.seriesOf('D02', FIGI_A));
  assert.equal(after, before, '⚠ the PIT store must be byte-identical after projection');
  assert.equal(adj.bars[0].fields['MD:ohlcv.close'], 50);
  assert.equal(store.seriesOf('D02', FIGI_A)[0].fields['MD:ohlcv.close'], 100);
});

test('stored vintages remain frozen and unmutated by projection', () => {
  const { store, ca } = seeded();
  adjustedSeries(store, FIGI_A, [ca]);
  const stored = store.seriesOf('D02', FIGI_A)[0];
  assert.ok(Object.isFrozen(stored));
  assert.throws(() => { stored.fields['MD:ohlcv.close'] = 1; }, TypeError);
  assert.equal(ADJUSTMENT_RULES.storedVintageMutated, false);
});

/* ── 4-9. THE AG-2 FIREWALL — declared factors only ───────────────────────────────────────── */

test('AS-4 — a declared adjustmentFactor is consumed verbatim', () => {
  const { ca } = seeded({ factor: 0.25 });
  assert.equal(resolveDeclaredFactor(ca), 0.25);
  assert.equal(ADJUSTMENT_RULES.declaredFactorOnly, true);
});

test('AS-E3 — a MISSING factor REFUSES; no factor is invented', () => {
  const store = createPitStore();
  store.append(bar('2024-01-02T00:00:00.000Z', 100));
  const p = createCorporateActionPipeline(store);
  const ca = p.ingest(
    { actionType: 'split', securityId: FIGI_A, lifecycleStatus: 'active', ratio: 2,
      effectiveDate: '2024-03-15T00:00:00.000Z', effectiveTime: '2024-03-15T00:00:00.000Z' },
    { provider: 'fixture', dataVersion: '1.0', asOf: '2024-03-16T00:00:00.000Z' },
  );
  assert.throws(() => resolveDeclaredFactor(ca), (e) => e.code === 'AS-E3');
  assert.throws(() => adjustedSeries(store, FIGI_A, [ca]), (e) => e.code === 'AS-E3');
});

test('AG-2 — a split RATIO is never converted into a factor', () => {
  const store = createPitStore();
  store.append(bar('2024-01-02T00:00:00.000Z', 100));
  const p = createCorporateActionPipeline(store);
  const ca = p.ingest(
    { actionType: 'split', securityId: FIGI_A, lifecycleStatus: 'active', ratio: 2,
      effectiveDate: '2024-03-15T00:00:00.000Z', effectiveTime: '2024-03-15T00:00:00.000Z' },
    { provider: 'fixture', dataVersion: '1.0', asOf: '2024-03-16T00:00:00.000Z' },
  );
  assert.equal(ca.fields[caKey('ratio')], 2);
  assert.throws(() => adjustedSeries(store, FIGI_A, [ca]), (e) => e.code === 'AS-E3',
    'ratio 2 must NOT silently become factor 0.5');
  assert.equal(ADJUSTMENT_RULES.factorDerivedFromRatio, false);
});

test('AG-2 — a dividend cashAmount is never converted into a factor', () => {
  const store = createPitStore();
  store.append(bar('2024-01-02T00:00:00.000Z', 100));
  const p = createCorporateActionPipeline(store);
  const ca = p.ingest(
    { actionType: 'dividend', securityId: FIGI_A, lifecycleStatus: 'active', cashAmount: 2.5,
      effectiveDate: '2024-03-15T00:00:00.000Z', effectiveTime: '2024-03-15T00:00:00.000Z' },
    { provider: 'fixture', dataVersion: '1.0', asOf: '2024-03-16T00:00:00.000Z' },
  );
  assert.throws(() => adjustedSeries(store, FIGI_A, [ca]), (e) => e.code === 'AS-E3');
  assert.equal(ADJUSTMENT_RULES.factorDerivedFromCashAmount, false);
  assert.equal(ADJUSTMENT_RULES.factorDerivedFromPrice, false);
  assert.equal(ADJUSTMENT_RULES.factorDerivedFromActionType, false);
});

test('AS-E6 — multiple actions are REFUSED; no cumulative composition is invented', () => {
  const { store, ca } = seeded();
  assert.throws(() => adjustedSeries(store, FIGI_A, [ca, ca]), (e) => e.code === 'AS-E6');
  assert.throws(() => adjustedSeries(store, FIGI_A, []), (e) => e.code === 'AS-E6');
  assert.equal(ADJUSTMENT_RULES.cumulativeCompositionImplemented, false);
  assert.equal(ADJUSTMENT_RULES.multiActionOrderingImplemented, false);
  assert.equal(ADJUSTMENT_RULES.adjustmentPrecedenceImplemented, false);
});

test('AG-2 — no rounding or precision policy is imposed', () => {
  const { store, ca } = seeded({ factor: 1 / 3 });
  const adj = adjustedSeries(store, FIGI_A, [ca]);
  assert.equal(adj.bars[0].fields['MD:ohlcv.close'], 100 * (1 / 3), 'no rounding is applied');
  assert.equal(ADJUSTMENT_RULES.roundingRuleImplemented, false);
});

test('the P08-03 source contains no invented adjustment arithmetic', () => {
  const code = readFileSync(join(p08Root, 'src', 'adjustedSeriesProjection.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/[^\n]*$/gm, '')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''").replace(/`(?:[^`\\]|\\.)*`/g, '``');
  // No derivation from ratio or cash amount; no rounding; no compounding.
  assert.doesNotMatch(code, /ratio\s*[*/+-]|1\s*\/\s*\w*[Rr]atio|cashAmount\s*[*/+-]/);
  assert.doesNotMatch(code, /Math\.(round|floor|ceil|pow)|toFixed|reduce\s*\(/);
});

/* ── 10-11. AG-1 AND THE BASIS FLAG ───────────────────────────────────────────────────────── */

test('AG-1 — the bounded actionType vocabulary is preserved and not widened', () => {
  const code = readFileSync(join(p08Root, 'src', 'adjustedSeriesProjection.js'), 'utf8');
  assert.doesNotMatch(code.replace(/\/\*[\s\S]*?\*\//g, ''), /ACTION_TYPES\s*=|'rights'|'merger'/);
  assert.match(ADJUSTMENT_EVIDENCE.openAuthorityGaps[0], /AG-1/);
});

test('AS-1 — the adjusted/unadjusted flag is a closed two-value vocabulary and is correct', () => {
  assert.deepEqual([...SERIES_BASIS], ['unadjusted', 'adjusted']);
  const { store, ca } = seeded();
  assert.equal(unadjustedSeries(store, 'D02', FIGI_A).basis, 'unadjusted');
  const adj = adjustedSeries(store, FIGI_A, [ca]);
  assert.equal(adj.basis, 'adjusted');
  for (const b of adj.bars) assert.equal(b.basis, 'adjusted', 'every projected bar is labelled');
  assert.throws(() => seriesAsOf(store, FIGI_A, '2024-06-01T00:00:00.000Z', { basis: 'raw' }),
    (e) => e.code === 'AS-E9');
});

test('an adjusted result is never presented as raw/unadjusted data', () => {
  const { store, ca } = seeded();
  const adj = adjustedSeries(store, FIGI_A, [ca]);
  assert.equal(adj.adjustmentApplied, true);
  assert.equal(adj.factorDerived, false);
  for (const b of adj.bars) assert.equal(b.fields['MD:ohlcv.adjustmentFactor'], 0.5,
    'the factor travels with the projection — never silently applied');
});

/* ── 5, 18. PROVENANCE ────────────────────────────────────────────────────────────────────── */

test('L-11 — adjustmentBasisRef is REQUIRED on an adjusted series and is deterministic', () => {
  const { store, ca } = seeded();
  const a = adjustedSeries(store, FIGI_A, [ca]);
  const b = adjustedSeries(store, FIGI_A, [ca]);
  assert.ok(a.adjustmentBasisRef.startsWith('caref:'));
  assert.equal(a.adjustmentBasisRef, b.adjustmentBasisRef, 'provenance is deterministic');
  for (const x of a.bars) assert.equal(x.adjustmentBasisRef, a.adjustmentBasisRef);
});

test('provenance is derived from the action evidence, never fabricated', () => {
  const { ca } = seeded();
  const ref = adjustmentBasisRef(ca);
  assert.ok(ref.includes(FIGI_A));
  assert.ok(ref.includes('2024-03-15T00:00:00.000Z'), 'carries the effectiveDate');
  assert.ok(ref.includes(ca.snapshotId), 'carries the source snapshot identity');
  assert.throws(() => adjustmentBasisRef({}), (e) => e.code === 'AS-E2');
});

/* ── 12-17. TIME, IDENTITY, PIT ───────────────────────────────────────────────────────────── */

test('distinct time semantics survive: asOf, effectiveDate/Time, ex/record/pay', () => {
  const { ca } = seeded();
  assert.equal(ca.asOf, '2024-03-16T00:00:00.000Z');
  assert.equal(ca.fields[caKey('effectiveDate')], '2024-03-15T00:00:00.000Z');
  assert.equal(ca.effectiveTime, '2024-03-15T00:00:00.000Z');
  assert.notEqual(ca.asOf, ca.fields[caKey('effectiveDate')], 'vintage is not effective time');
  const d = new Set([ca.fields[caKey('exDate')], ca.fields[caKey('recordDate')], ca.fields[caKey('payDate')]]);
  assert.equal(d.size, 3, 'ex/record/pay remain distinct');
});

test('FIGI identity is preserved; a mismatched instrument is refused', () => {
  const { store, ca } = seeded();
  assert.equal(adjustedSeries(store, FIGI_A, [ca]).securityId, FIGI_A);
  assert.throws(() => adjustedSeries(store, 'BBG000BLNNH6', [ca]), (e) => e.code === 'AS-E8');
});

test('a provider symbol cannot become a canonical identity in a projection', () => {
  const { store, ca } = seeded();
  const adj = adjustedSeries(store, FIGI_A, [ca]);
  assert.match(adj.securityId, /^BBG[A-Z0-9]{9}$/);
  assert.doesNotMatch(JSON.stringify(adj), /RELIANCE\.NS|-H1"/);
});

test('AS-7 — an adjusted historical query is reproducible and PIT-bounded', () => {
  const { store } = seeded({ caAsOf: '2024-06-01T00:00:00.000Z' });
  // Before the CA is knowable, an adjusted series is refused — not silently unadjusted.
  assert.throws(() => seriesAsOf(store, FIGI_A, '2024-03-01T00:00:00.000Z', { basis: 'adjusted' }),
    (e) => e.code === 'AS-E10');
  const a = JSON.stringify(seriesAsOf(store, FIGI_A, '2024-07-01T00:00:00.000Z', { basis: 'adjusted' }));
  const b = JSON.stringify(seriesAsOf(store, FIGI_A, '2024-07-01T00:00:00.000Z', { basis: 'adjusted' }));
  assert.equal(a, b, 'same PIT + same declared evidence ⇒ same result');
});

test('a later adjustment does not mutate an earlier PIT result', () => {
  const { store } = seeded({ caAsOf: '2024-06-01T00:00:00.000Z' });
  const early = JSON.stringify(seriesAsOf(store, FIGI_A, '2024-03-01T00:00:00.000Z'));
  const p = createCorporateActionPipeline(store);
  p.ingest(caWithFactor('2024-09-01T00:00:00.000Z', 0.25),
    { provider: 'fixture', dataVersion: '1.0', asOf: '2024-09-01T00:00:00.000Z' });
  assert.equal(JSON.stringify(seriesAsOf(store, FIGI_A, '2024-03-01T00:00:00.000Z')), early);
});

test('golden fixture replay is byte-identical across runs', () => {
  const runs = [0, 1, 2].map(() => {
    const { store, ca } = seeded();
    return JSON.stringify(adjustedSeries(store, FIGI_A, [ca]));
  });
  assert.equal(runs[0], runs[1]);
  assert.equal(runs[1], runs[2]);
});

/* ── 20-21. PORTFOLIO RECONCILIATION VIA P07-03 ───────────────────────────────────────────── */

test('AS-8 — holdings reconcile against the adjusted series using the P07-03 surface', () => {
  const { store, ca } = seeded();
  const series = adjustedSeries(store, FIGI_A, [ca]);
  const ok = reconcileHoldings(series, {
    securityId: FIGI_A, declaredFactor: series.declaredFactor, adjustmentBasisRef: series.adjustmentBasisRef,
  });
  assert.equal(ok.reconciled, true);
  assert.equal(ok.disposition, DISPOSITION_TYPES[0]);
  assert.equal(ok.p07_03SurfaceUsed, true);
});

test('AS-8 — a discrepancy is CLASSIFIED and PRESENTED, never collapsed', () => {
  const { store, ca } = seeded();
  const series = adjustedSeries(store, FIGI_A, [ca]);
  const bad = reconcileHoldings(series, {
    securityId: FIGI_A, declaredFactor: 0.9, adjustmentBasisRef: 'caref:other',
  });
  assert.equal(bad.reconciled, false);
  assert.equal(bad.disposition, 'UNRESOLVED_PRESENTED');
  assert.ok(bad.dimensions.includes('CD-1') && bad.dimensions.includes('CD-5'));
  assert.equal(bad.presented.series.factor, 0.5);
  assert.equal(bad.presented.holding.factor, 0.9, 'both sides are presented');
  assert.equal(bad.methodologyInvented, false);
});

test('reconciliation does not duplicate or modify P07-03 methodology', () => {
  assert.equal(ADJUSTMENT_RULES.p07_03Modified, false);
  assert.equal(ADJUSTMENT_RULES.p07_03MethodologyDuplicated, false);
  const changed = git('status --porcelain').split('\n').filter(Boolean)
    .map((l) => l.slice(3)).filter((f) => f.startsWith('p07/'));
  assert.deepEqual(changed, []);
  assert.throws(() => reconcileHoldings(unadjustedSeries(createPitStore(), 'D02', FIGI_A), {}),
    (e) => e.code === 'AS-E11');
});

/* ── 22-27. SCANS AND BOUNDARIES ──────────────────────────────────────────────────────────── */

test('AG-2 remains recorded as OPEN and non-blocking, not silently resolved', () => {
  assert.equal(ADJUSTMENT_RULES.methodologyInvented, false);
  assert.match(ADJUSTMENT_RULES.ag2Status, /OPEN/);
  assert.match(ADJUSTMENT_EVIDENCE.openAuthorityGaps[1], /AG-2/);
  assert.deepEqual([...ADJUSTMENT_EVIDENCE.notImplemented], [
    'factor derivation', 'cumulative multi-action composition', 'adjustment ordering/precedence',
    'rounding/precision policy', 'valuation or P&L arithmetic',
  ]);
});

test('the P08 source performs no persistence, no network and no credential access', () => {
  for (const f of readdirSync(join(p08Root, 'src')).filter((x) => x.endsWith('.js'))) {
    const code = readFileSync(join(p08Root, 'src', f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/[^\n]*$/gm, '');
    assert.doesNotMatch(code, /writeFileSync|mkdirSync|createWriteStream|sqlite|mongo/i, f);
    assert.doesNotMatch(code, /\bfetch\s*\(|axios|https?:\/\/|node:http/, f);
    assert.doesNotMatch(code, /process\.env\./, f);
  }
});

test('no P09–P17 leakage, no acceptance artifact, no certification change', () => {
  assert.deepEqual(git('ls-files').split('\n').filter((f) => /^p(09|1[0-7])\//.test(f)), []);
  assert.deepEqual(git('ls-files').split('\n').filter((f) => /P08_GATE_ACCEPTANCE/.test(f)), []);
  assert.equal(existsSync(join(repoRoot, 'docs', 'p08')), false);
  assert.equal(ADJUSTMENT_EVIDENCE.acceptance, 'NOT_ACCEPTED');
  assert.equal(ADJUSTMENT_EVIDENCE.a3Acceptor, 'NOT DESIGNATED');
  assert.equal(ADJUSTMENT_EVIDENCE.c7, 'NOT CERTIFIED');
  assert.equal(ADJUSTMENT_EVIDENCE.certification, 'NONE_GRANTED');
  assert.equal(ADJUSTMENT_EVIDENCE.productionActivation, 'NOT_AUTHORIZED');
});

test('P08-01 and P08-02 are not modified by P08-03', () => {
  assert.equal(ADJUSTMENT_RULES.p08_02Modified, false);
  const changed = git('status --porcelain').split('\n').filter(Boolean)
    .map((l) => l.slice(3))
    .filter((f) => /^p08\/src\/(pitStorageModel|corporateActionIngestion)\.js$/.test(f));
  assert.deepEqual(changed, []);
});

test('AD-17 and ADR-02 are neither repaired nor reinterpreted', () => {
  const code = readFileSync(join(p08Root, 'src', 'adjustedSeriesProjection.js'), 'utf8');
  assert.doesNotMatch(code, /ReplayService|DataBoundExecutor|LiveDataRuntime/);
});
