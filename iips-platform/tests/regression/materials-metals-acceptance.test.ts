/**
 * IES-020 D20 — Materials & Metals Engine acceptance.
 * Reproduces the 13 frozen expected outputs (materials-metals-expected-outputs-1.0.0.json)
 * from the golden dataset, and exercises metrics/scoring/calibration/decision/overrides/
 * evidence/ontology, effective band-table resolution, multi-subsegment/hybrid resolution,
 * missing-data renormalization, round-half-to-even, and deterministic replay.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { MaterialsMetalsEngine, MATERIALS_METALS_ENGINE_ID, MATERIALS_METALS_ONTOLOGY_METADATA } from '../../src/sector-engines/materials-metals/MaterialsMetalsEngine';
import { loadMaterialsMetalsCalibration } from '../../src/sector-engines/materials-metals/calibration/MaterialsMetalsCalibration';
import { MaterialsMetalsScoreEngine } from '../../src/sector-engines/materials-metals/scoring/MaterialsMetalsScoreEngine';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';

const ASSET_DIR = path.resolve(__dirname, '../../src/sector-engines/materials-metals/');
const golden = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'materials-metals-golden-reference-1.0.0.json'), 'utf8'));
const expected = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'materials-metals-expected-outputs-1.0.0.json'), 'utf8'));
const validationFixtures = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'materials-metals-validation-fixtures-1.0.0.json'), 'utf8'));

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
  plugins.load(new MaterialsMetalsEngine());
  plugins.initialize(MATERIALS_METALS_ENGINE_ID);
  return runtime.execute(MATERIALS_METALS_ENGINE_ID, { requestId: 'mm-acc', inputs: input as never });
}

/** Round-half-to-even at 1dp — matches the generator oracle's pillar serialization exactly. */
function round1HalfEven(x: number): number {
  const s = x * 10;
  const f = Math.floor(s);
  const fr = s - f;
  if (fr === 0.5) return (f % 2 === 0 ? f : f + 1) / 10;
  return Math.round(s) / 10;
}

const PILLAR_KEYS = ['quality', 'growth', 'risk', 'profitability', 'capitalEfficiency', 'valuation'] as const;

test('IES020-D20-ACC1: metric evaluation + engine executes (MM-001 -> Strong Buy)', () => {
  const r = execute({ subsegment: 'diversified-miners', archetype: 'integrated', ebitdaMargin: 32, revenueGrowth: 9, debtEbitda: 1.4, reserveLife: 22, cashCostCurve: 20, realizedPriceSpread: 106, fcfYield: 8, roic: 14, capexIntensity: 11, inventoryDays: 40, evEbitda: 5.5, recyclingInputMix: 15 });
  assert.equal(r.result.state, 'COMPLETED');
  assert.equal(r.result.metadata.verdict, 'Strong Buy');
});

test('IES020-D20-ACC2: all 13 frozen expected outputs reproduced exactly (composite + verdict + subsegment + archetype + overrides)', () => {
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

test('IES020-D20-ACC3: pillars match frozen expected outputs (round-half-to-even at 1dp)', () => {
  const engine = new MaterialsMetalsEngine();
  engine.onRegister(new Container({} as never));
  const scoreEngine = new MaterialsMetalsScoreEngine(loadMaterialsMetalsCalibration());
  for (const p of golden.providers) {
    const exp = expected.expected.find((e: { providerId: string }) => e.providerId === p.id);
    const resolution = engine['metrics'].resolve(p, (s) => engine['calibration'].segments[s]?.leverageAlert ?? 3.0);
    const score = scoreEngine.score(p, resolution.subsegment, resolution.archetype);
    for (const k of PILLAR_KEYS) {
      assert.equal(round1HalfEven(score.pillars[k]), exp.pillars[k], `${p.id} pillar ${k}`);
    }
  }
});

test('IES020-D20-ACC4: effective band-table resolution (calibrated ?? baseline, boundaries+scores together)', () => {
  const eng = new MaterialsMetalsScoreEngine(loadMaterialsMetalsCalibration());
  // precious-metals: calibrated MM-004 (longer reserve lives).
  assert.equal(eng.band('precious-metals', 'MM-004', 13), 60, 'calibrated precious reserveLife @13 -> 60 (baseline would be 75)');
  assert.equal(eng.band('precious-metals', 'MM-004', 22), 75, 'calibrated precious reserveLife @22 -> 75 (baseline would be 90)');
  // steel-producers: calibrated MM-005 (wider cost curve).
  assert.equal(eng.band('steel-producers', 'MM-005', 50), 75, 'calibrated steel costCurve @50 -> 75 (baseline would be 55)');
  // specialty-materials: calibrated MM-012 (lower recycling base).
  assert.equal(eng.band('specialty-materials', 'MM-012', 10), 60, 'calibrated specialty recycling @10 -> 60 (baseline would be 40)');
  // Baseline fallback: diversified-miners has no calibrated tables.
  assert.equal(eng.band('diversified-miners', 'MM-004', 22), 90, 'baseline reserveLife @22 -> 90 (no calibrated table)');
  // Cardinality invariant preserved.
  assert.equal(eng.cardinalityOk('precious-metals', 'MM-004'), true);
  assert.equal(eng.cardinalityOk('steel-producers', 'MM-005'), true);
});

test('IES020-D20-ACC5: composite round-half-to-even (MM-010 raw 63.25 -> 63.2, ties-to-even)', () => {
  const p = golden.providers.find((x: { id: string }) => x.id === 'MM-010');
  const r = execute(p);
  assert.equal(r.result.metadata.composite, 63.2);
  assert.equal(r.result.metadata.verdict, 'Accumulate');
  // Independent recomputation of the raw (unrounded) composite: a genuine .x5 tie.
  const engine = new MaterialsMetalsEngine();
  engine.onRegister(new Container({} as never));
  const scoreEngine = new MaterialsMetalsScoreEngine(loadMaterialsMetalsCalibration());
  const resolution = engine['metrics'].resolve(p, (s) => engine['calibration'].segments[s]?.leverageAlert ?? 3.0);
  const score = scoreEngine.score(p, resolution.subsegment, resolution.archetype);
  const w = [...engine['calibration'].segments[resolution.subsegment].w];
  w[2] = w[2] * (engine['calibration'].archetypeRisk[resolution.archetype] ?? 1.0);
  const raw = score.pillars.quality * w[0] + score.pillars.growth * w[1] + score.pillars.risk * w[2]
    + score.pillars.profitability * w[3] + score.pillars.capitalEfficiency * w[4] + score.pillars.valuation * w[5];
  const scaled = raw * 10; const floor = Math.floor(scaled); const frac = scaled - floor;
  assert.ok(Math.abs(frac - 0.5) < 1e-9, `expected a .5 tie, got ${raw}`);
  assert.equal(floor % 2, 0, 'ties-to-even: floor must be even to round down');
});

test('IES020-D20-ACC6: multi-subsegment + hybrid resolution (MM-009)', () => {
  const engine = new MaterialsMetalsEngine();
  engine.onRegister(new Container({} as never));
  // Hybrid archetype resolved via hybridDominant -> integrated.
  const hyb = engine['metrics'].resolve({ subsegment: 'base-metals', archetype: 'hybrid', hybridDominant: 'integrated', revenueGrowth: 9 }, () => 3.0);
  assert.equal(hyb.archetype, 'integrated');
  // Multi-subsegment dominant.
  const dom = engine['metrics'].resolve({ subsegments: ['diversified-miners', 'base-metals'], subsegmentDominant: 'base-metals', archetype: 'hybrid', hybridDominant: 'integrated' }, () => 3.0);
  assert.equal(dom.subsegment, 'base-metals');
  // Multi-subsegment no dominant -> most conservative (highest leverageAlert = base-metals 3.5).
  const cons = engine['metrics'].resolve({ subsegments: ['diversified-miners', 'base-metals', 'precious-metals'], archetype: 'integrated', revenueGrowth: 4 }, (s) => ({ 'diversified-miners': 3.0, 'base-metals': 3.5, 'precious-metals': 2.5 } as Record<string, number>)[s] ?? 3.0);
  assert.equal(cons.subsegment, 'base-metals');
});

test('IES020-D20-ACC7: override / min-rank deterministic (MM-006, MM-011)', () => {
  // MM-006: leverage-breach + margin-compression + competition-pressure -> Watch.
  const r1 = execute(golden.providers.find((x: { id: string }) => x.id === 'MM-006'));
  assert.equal(r1.result.metadata.verdict, 'Watch');
  assert.deepEqual(r1.result.metadata.overridesApplied, ['leverage-breach', 'margin-compression', 'competition-pressure']);
  // MM-011: governance -> Avoid (min_rank over Watch base + leverage-breach).
  const r2 = execute(golden.providers.find((x: { id: string }) => x.id === 'MM-011'));
  assert.equal(r2.result.metadata.verdict, 'Avoid');
  assert.deepEqual(r2.result.metadata.overridesApplied, ['leverage-breach', 'governance']);
});

test('IES020-D20-ACC8: missing-data renormalization (MM-014: fcfYield omitted -> capitalEfficiency 0.0)', () => {
  const mm014 = validationFixtures.edgeCases.find((x: { id: string }) => x.id === 'MM-014');
  const { id, name, expected: _exp, ...inputs } = mm014;
  const r = execute(inputs);
  assert.equal(r.result.metadata.composite, 73.5);
  assert.equal(r.result.metadata.verdict, 'Buy');
  assert.equal(r.result.metadata.pillars.capitalEfficiency, 0.0, 'empty pillar renormalizes to 0.0 (never fabricated)');
});

test('IES020-D20-ACC9: calibrated band-boundary semantics (MM-015)', () => {
  const mm015 = validationFixtures.edgeCases.find((x: { id: string }) => x.id === 'MM-015');
  const { id, name, expected: _exp, ...inputs } = mm015;
  const r = execute(inputs);
  assert.equal(r.result.metadata.composite, 70.1);
  assert.equal(r.result.metadata.verdict, 'Buy');
  assert.deepEqual(r.result.metadata.overridesApplied, []);
});

test('IES020-D20-ACC10: all 6 verdict bands exercised across the 13 providers', () => {
  const bands = new Set<string>();
  for (const p of golden.providers) {
    const exp = expected.expected.find((e: { providerId: string }) => e.providerId === p.id);
    bands.add(exp.verdict);
  }
  for (const v of ['Strong Buy', 'Buy', 'Accumulate', 'Hold', 'Watch', 'Avoid']) {
    assert.ok(bands.has(v), `missing verdict band ${v}`);
  }
});

test('IES020-D20-ACC11: ontology registration — 8/8 dimensions (CSIP-compatible)', () => {
  const meta = MATERIALS_METALS_ONTOLOGY_METADATA;
  const dims = ['Conviction', 'Confidence', 'Quality', 'Growth', 'Risk', 'Profitability', 'Capital Efficiency', 'Valuation'];
  const mapped = Object.values(meta);
  for (const d of dims) assert.ok(mapped.includes(d), `missing ${d}`);
  assert.equal(mapped.length, 8);
  assert.equal(Object.keys(meta).length, 8);
});

test('IES020-D20-ACC12: evidence complete for every provider + replay deterministic', () => {
  for (const p of golden.providers) {
    const r = execute(p as Record<string, unknown>);
    assert.equal(r.result.state, 'COMPLETED');
    assert.ok(r.result.evidenceRef);
    assert.equal(r.result.metadata.verdict, expected.expected.find((e: { providerId: string }) => e.providerId === p.id).verdict);
  }
  // Replay determinism in an isolated runtime: identical snapshot inputs -> reproduced.
  {
    const { plugins, runtime, replay } = makeRuntime();
    plugins.load(new MaterialsMetalsEngine());
    plugins.initialize(MATERIALS_METALS_ENGINE_ID);
    const snap = runtime.recordSnapshot(MATERIALS_METALS_ENGINE_ID, { revenueGrowth: 9 }, { quality: 90.0 }, 'MATERIALS_METALS_SUMMARY');
    assert.equal(replay.replay(snap.snapshotId)?.reproduced, true);
  }
});

test('IES020-D20-ACC13: leverage alert + archetype risk applied (MM-006 vs MM-011)', () => {
  // MM-006: base-metals (leverageAlert 3.5) — debtEbitda 3.8 >= 3.5 -> leverage-breach.
  const r = execute(golden.providers.find((x: { id: string }) => x.id === 'MM-006'));
  assert.ok(r.result.metadata.overridesApplied.includes('leverage-breach'));
  // MM-003: precious-metals (leverageAlert 2.5) — debtEbitda 0.8 < 2.5 -> NO leverage-breach.
  const r2 = execute(golden.providers.find((x: { id: string }) => x.id === 'MM-003'));
  assert.deepEqual(r2.result.metadata.overridesApplied, [], 'no leverage-breach under precious-metals 2.5 alert');
});
