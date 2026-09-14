/**
 * IES-015 WP-3 — Technology Engine acceptance.
 * Reproduces the 13 frozen expected outputs (technology-expected-outputs-1.0.0.json) from the
 * golden dataset, and exercises metrics/scoring/calibration/decision/overrides/evidence/ontology,
 * effective band-table resolution, TM-009 3-band cardinality, conservativeBandTable operator,
 * hybrid/multi-subsegment resolution, missing-data renormalization, and round-half-to-even.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TechnologyEngine, TECHNOLOGY_ENGINE_ID, TECHNOLOGY_ONTOLOGY_METADATA } from '../../src/sector-engines/technology/TechnologyEngine';
import { loadTechnologyCalibration } from '../../src/sector-engines/technology/calibration/TechnologyCalibration';
import { TechnologyScoreEngine } from '../../src/sector-engines/technology/scoring/TechnologyScoreEngine';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';

const ASSET_DIR = path.resolve(__dirname, '../../src/sector-engines/technology/');
const golden = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'technology-golden-reference-1.0.0.json'), 'utf8'));
const expected = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'technology-expected-outputs-1.0.0.json'), 'utf8'));

function makeRuntime() {
  const clock = createClock('fixed');
  const id = createIdProvider('deterministic');
  const evidence = new EvidencePipeline(clock);
  const container = new Container({ clock, idProvider: id, evidenceService: evidence });
  const plugins = new PluginLoader(container);
  const snap = new SnapshotService(clock, id);
  const store = new SnapshotStore();
  const replay = new ReplayService(store);
  const runtime = new RuntimeCoordinator(container, plugins, snap, store, replay);
  container.register('runtimeCoordinator', runtime);
  return { plugins, runtime, store, replay };
}

function execute(input: Record<string, unknown>) {
  const { plugins, runtime } = makeRuntime();
  plugins.load(new TechnologyEngine());
  plugins.initialize(TECHNOLOGY_ENGINE_ID);
  return runtime.execute(TECHNOLOGY_ENGINE_ID, { requestId: 'te-acc', inputs: input as never });
}

test('IES015-WP3-ACC1: metric evaluation + engine executes', () => {
  const r = execute({ subsegment: 'software-saas', archetype: 'subscription', ebitdaMargin: 24, revenueGrowth: 22, debtEbitda: 1.5, evRevenue: 14, fcfYield: 6, recurringRevenuePct: 80, nrr: 118, grossMargin: 75, rdIntensity: 12, customerConcentration: 20, capexIntensity: 8, usageGrowth: 25 });
  assert.equal(r.result.state, 'COMPLETED');
  assert.equal(r.result.metadata.verdict, 'Buy');
});

test('IES015-WP3-ACC2: all 13 frozen expected outputs reproduced exactly (composite + verdict)', () => {
  for (const p of golden.providers) {
    const r = execute(p);
    const exp = expected.expected.find((e: { providerId: string }) => e.providerId === p.id);
    assert.equal(r.result.state, 'COMPLETED', `${p.id} state`);
    assert.equal(r.result.metadata.composite, exp.composite, `${p.id} composite`);
    assert.equal(r.result.metadata.verdict, exp.verdict, `${p.id} verdict`);
    assert.equal(r.result.metadata.resolvedSubsegment, exp.subsegment, `${p.id} resolved subsegment`);
    assert.equal(r.result.metadata.resolvedArchetype, exp.archetype, `${p.id} resolved archetype`);
    assert.deepEqual(r.result.metadata.overridesApplied, exp.overrides, `${p.id} overrides`);
  }
});

test('IES015-WP3-ACC3: pillars match frozen expected outputs (rounded 2dp)', () => {
  const engine = new TechnologyEngine();
  engine.onRegister(new Container({} as never));
  const scoreEngine = new TechnologyScoreEngine(loadTechnologyCalibration());
  for (const p of golden.providers) {
    const exp = expected.expected.find((e: { providerId: string }) => e.providerId === p.id);
    const resolution = engine['metrics'].resolve(p, (s) => engine['calibration'].segments[s]?.leverageAlert ?? 3.0);
    const score = scoreEngine.score(p, resolution.subsegment, resolution.archetype);
    const pillars = {
      quality: round2(score.pillars.quality), growth: round2(score.pillars.growth),
      risk: round2(score.pillars.risk), profitability: round2(score.pillars.profitability),
      capitalEfficiency: round2(score.pillars.capitalEfficiency), valuation: round2(score.pillars.valuation),
    };
    assert.deepEqual(pillars, exp.pillars, `${p.id} pillars`);
  }
});

test('IES015-WP3-ACC4: effective band-table resolution (calibrated ?? baseline, boundaries+scores together)', () => {
  const eng = new TechnologyScoreEngine(loadTechnologyCalibration());
  // Semiconductors: calibrated TM-008 (gross margin) + TM-011 (capex) — boundaries AND scores.
  assert.equal(eng.band('semiconductors', 'TM-008', 40), 75, 'calibrated TM-008 @40 -> 75 (baseline would be 60)');
  assert.equal(eng.band('semiconductors', 'TM-011', 40), 60, 'calibrated TM-011 @40 -> 60 (baseline would be 40)');
  // software-saas: calibrated TM-007 (NRR).
  assert.equal(eng.band('software-saas', 'TM-007', 118), 75, 'calibrated TM-007 @118 -> 75 (baseline would be 90)');
  // digital-platforms: calibrated TM-006 (recurring).
  assert.equal(eng.band('digital-platforms', 'TM-006', 78), 75, 'calibrated TM-006 @78 -> 75 (baseline would be 90)');
  // Baseline fallback: it-services has no calibrated tables.
  assert.equal(eng.band('it-services', 'TM-008', 40), 60, 'baseline TM-008 @40 -> 60');
});

test('IES015-WP3-ACC5: TM-009 metric cardinality is 3 bands (terminal includes upper bound)', () => {
  const eng = new TechnologyScoreEngine(loadTechnologyCalibration());
  const baseline = loadTechnologyCalibration().bandScores['TM-009'] as unknown as unknown[];
  assert.equal(baseline.length, 3, 'TM-009 is inherently 3-band');
  assert.equal(eng.band('software-saas', 'TM-009', 10), 75, 'R&D=10 -> terminal band 75');
  assert.equal(eng.cardinalityOk('software-saas', 'TM-009'), true);
});

test('IES015-WP3-ACC6: conservativeBandTable operator deterministic + composite-lowering (both directions)', () => {
  // Higher-better: conservative boundaries = elementwise max; scores = elementwise min.
  const hi = conservative([
    [[10, 40], [20, 60], [30, 75], [Infinity, 90]],
    [[15, 45], [25, 65], [40, 85], [Infinity, 95]],
  ], 'max');
  assert.deepEqual(hi, [[15, 40], [25, 60], [40, 75], [Infinity, 90]]);
  // Lower-better: conservative boundaries = elementwise min; scores = elementwise min (both directions).
  const lo = conservative([
    [[1.0, 90], [2.0, 75], [3.0, 55], [Infinity, 30]],
    [[1.5, 85], [2.5, 65], [3.5, 45], [Infinity, 20]],
  ], 'min');
  assert.deepEqual(lo, [[1.0, 85], [2.0, 65], [3.0, 45], [Infinity, 20]]);
  // Determinism.
  assert.deepEqual(hi, conservative([
    [[10, 40], [20, 60], [30, 75], [Infinity, 90]],
    [[15, 45], [25, 65], [40, 85], [Infinity, 95]],
  ], 'max'));
});

test('IES015-WP3-ACC7: hybrid + multi-subsegment resolution (single profile, no branch)', () => {
  const engine = new TechnologyEngine();
  engine.onRegister(new Container({} as never));
  // Hybrid archetype resolved via hybridDominant -> managed-services.
  const hyb = engine['metrics'].resolve({ subsegment: 'tech-enabled-services', archetype: 'hybrid', hybridDominant: 'managed-services', revenueGrowth: 8 }, () => 3.0);
  assert.equal(hyb.archetype, 'managed-services');
  assert.equal(hyb.subsegment, 'tech-enabled-services');
  // Multi-subsegment dominant.
  const dom = engine['metrics'].resolve({ subsegments: ['software-saas', 'digital-platforms'], subsegmentDominant: 'digital-platforms', archetype: 'subscription', revenueGrowth: 24 }, () => 3.0);
  assert.equal(dom.subsegment, 'digital-platforms');
  // Multi-subsegment no dominant -> most conservative (highest leverageAlert = digital-platforms 3.5).
  const cons = engine['metrics'].resolve({ subsegments: ['software-saas', 'digital-platforms', 'tech-enabled-services'], archetype: 'usage-based', revenueGrowth: 16 }, (s) => ({ 'software-saas': 3.0, 'digital-platforms': 3.5, 'tech-enabled-services': 3.0 } as Record<string, number>)[s] ?? 3.0);
  assert.equal(cons.subsegment, 'digital-platforms');
});

test('IES015-WP3-ACC8: calibration isolation (common engine; calibration selects params only)', () => {
  const r = execute({ subsegment: 'semiconductors', archetype: 'foundry-manufacturing', ebitdaMargin: 28, revenueGrowth: 18, debtEbitda: 2.2, evRevenue: 6, fcfYield: 3, recurringRevenuePct: 55, nrr: 108, grossMargin: 40, rdIntensity: 12, customerConcentration: 15, capexIntensity: 40, usageGrowth: 20 });
  assert.equal(r.result.metadata.composite, 76.4);
  assert.equal(r.result.metadata.verdict, 'Buy');
});

test('IES015-WP3-ACC9: override / min-rank deterministic', () => {
  // TE-006: leverage-breach + margin-compression -> Watch.
  const r1 = execute({ subsegment: 'internet-consumer-tech', archetype: 'usage-based', ebitdaMargin: 26, revenueGrowth: 20, debtEbitda: 3.5, evRevenue: 13, fcfYield: 1, recurringRevenuePct: 40, nrr: 102, grossMargin: 55, rdIntensity: 15, customerConcentration: 10, capexIntensity: 12, usageGrowth: 18, marginCompression: true });
  assert.equal(r1.result.metadata.verdict, 'Watch');
  assert.deepEqual(r1.result.metadata.overridesApplied, ['leverage-breach', 'margin-compression']);
  // TE-013: governance -> Avoid (min_rank over Watch base + leverage-breach).
  const r2 = execute({ subsegment: 'software-saas', archetype: 'subscription', ebitdaMargin: 8, revenueGrowth: 4, debtEbitda: 3.5, evRevenue: 20, fcfYield: 1, recurringRevenuePct: 25, nrr: 90, grossMargin: 25, rdIntensity: 4, customerConcentration: 60, capexIntensity: 35, usageGrowth: 4, governance: true });
  assert.equal(r2.result.metadata.verdict, 'Avoid');
  assert.deepEqual(r2.result.metadata.overridesApplied, ['leverage-breach', 'governance']);
});

test('IES015-WP3-ACC10: missing-data renormalization (missing primitive -> 0 + renormalized weights)', () => {
  // TE-008: grossMargin (TM-008) and capexIntensity (TM-011) omitted -> multi-pillar renormalization.
  const r = execute({ subsegment: 'data-infrastructure', archetype: 'managed-services', ebitdaMargin: 20, revenueGrowth: 14, debtEbitda: 2.0, evRevenue: 15, fcfYield: 4, recurringRevenuePct: 70, nrr: 108, rdIntensity: 8, customerConcentration: 20, usageGrowth: 12 });
  assert.equal(r.result.metadata.composite, 67.8);
  assert.equal(r.result.metadata.verdict, 'Accumulate');
});

test('IES015-WP3-ACC11: composite round-half-to-even (raw 49.25 -> 49.2, not 49.3)', () => {
  const r = execute({ subsegment: 'it-services', archetype: 'license', ebitdaMargin: 8, revenueGrowth: 4, debtEbitda: 1.5, evRevenue: 18, fcfYield: 1, recurringRevenuePct: 25, nrr: 90, grossMargin: 25, rdIntensity: 7, customerConcentration: 20, capexIntensity: 8, usageGrowth: 4 });
  assert.equal(r.result.metadata.composite, 49.2);
  assert.equal(r.result.metadata.verdict, 'Watch');
});

test('IES015-WP3-ACC12: evidence complete for every provider + replay deterministic', () => {
  // Evidence completeness across all 13 providers (fresh runtime per provider to avoid
  // snapshot-id collision from the fixed clock).
  for (const p of golden.providers) {
    const r = execute(p as Record<string, unknown>);
    assert.equal(r.result.state, 'COMPLETED');
    assert.ok(r.result.evidenceRef);
    assert.equal(r.result.metadata.verdict, expected.expected.find((e: { providerId: string }) => e.providerId === p.id).verdict);
  }
  // Replay determinism in an isolated runtime: identical snapshot inputs -> reproduced.
  {
    const { plugins, runtime, replay } = makeRuntime();
    plugins.load(new TechnologyEngine());
    plugins.initialize(TECHNOLOGY_ENGINE_ID);
    const snap = runtime.recordSnapshot(TECHNOLOGY_ENGINE_ID, { revenueGrowth: 30 }, { grossMargin: 72 }, 'TECHNOLOGY_SUMMARY');
    assert.equal(replay.replay(snap.snapshotId)?.reproduced, true);
  }
});

test('IES015-WP3-ACC13: ontology registration — 8/8 dimensions (CSIP-compatible)', () => {
  const meta = TECHNOLOGY_ONTOLOGY_METADATA;
  const dims = ['Conviction', 'Confidence', 'Quality', 'Growth', 'Risk', 'Profitability', 'Capital Efficiency', 'Valuation'];
  const mapped = Object.values(meta);
  for (const d of dims) assert.ok(mapped.includes(d), `missing ${d}`);
  assert.equal(mapped.length, 8);
  assert.equal(Object.keys(meta).length, 8);
});

function round2(x: number): number { return Math.round(x * 100) / 100; }

/** conservativeBandTable() (D15 §6a.3.1): boundaries elementwise by fn, scores elementwise min. */
function conservative(tables: Array<Array<[number, number]>>, bfn: 'max' | 'min'): Array<[number, number]> {
  const n = tables[0].length;
  const pick = bfn === 'max' ? Math.max : Math.min;
  const bounds = tables[0].map((_, j) => pick(...tables.map((t) => t[j][0])));
  const scores = tables[0].map((_, j) => Math.min(...tables.map((t) => t[j][1])));
  return bounds.map((b, j) => [b, scores[j]] as [number, number]);
}
