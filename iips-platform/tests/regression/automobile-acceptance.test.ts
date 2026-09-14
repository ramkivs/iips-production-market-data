/**
 * IES-017 D17 — Automobile Engine acceptance.
 * Reproduces the 13 frozen expected outputs (automobile-expected-outputs-1.0.0.json)
 * from the golden dataset, and exercises metrics/scoring/calibration/decision/overrides/
 * evidence/ontology, effective band-table resolution, multi-subsegment/hybrid resolution,
 * missing-data renormalization, round-half-to-even, and deterministic replay.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AutomobileEngine, AUTOMOBILE_ENGINE_ID, AUTOMOBILE_ONTOLOGY_METADATA } from '../../src/sector-engines/automobile/AutomobileEngine';
import { loadAutomobileCalibration } from '../../src/sector-engines/automobile/calibration/AutomobileCalibration';
import { AutomobileScoreEngine } from '../../src/sector-engines/automobile/scoring/AutomobileScoreEngine';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';

const ASSET_DIR = path.resolve(__dirname, '../../src/sector-engines/automobile/');
const golden = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'automobile-golden-reference-1.0.0.json'), 'utf8'));
const expected = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'automobile-expected-outputs-1.0.0.json'), 'utf8'));
const validationFixtures = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'automobile-validation-fixtures-1.0.0.json'), 'utf8'));

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
  plugins.load(new AutomobileEngine());
  plugins.initialize(AUTOMOBILE_ENGINE_ID);
  return runtime.execute(AUTOMOBILE_ENGINE_ID, { requestId: 'ab-acc', inputs: input as never });
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

test('IES017-D17-ACC1: metric evaluation + engine executes (AB-001 -> Buy)', () => {
  const r = execute({ subsegment: 'mass-market-oem', archetype: 'full-line', ebitdaMargin: 12, revenueGrowth: 8, debtEbitda: 1.8, vehicleMargin: 9, capacityUtilization: 85, evMix: 30, fcfYield: 5, roic: 12, capexIntensity: 12, inventoryDays: 45, evEbitda: 5.5, aftersalesMix: 18 });
  assert.equal(r.result.state, 'COMPLETED');
  assert.equal(r.result.metadata.verdict, 'Buy');
});

test('IES017-D17-ACC2: all 13 frozen expected outputs reproduced exactly (composite + verdict + subsegment + archetype + overrides)', () => {
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

test('IES017-D17-ACC3: pillars match frozen expected outputs (round-half-to-even at 1dp)', () => {
  const engine = new AutomobileEngine();
  engine.onRegister(new Container({} as never));
  const scoreEngine = new AutomobileScoreEngine(loadAutomobileCalibration());
  for (const p of golden.providers) {
    const exp = expected.expected.find((e: { providerId: string }) => e.providerId === p.id);
    const resolution = engine['metrics'].resolve(p, (s) => engine['calibration'].segments[s]?.leverageAlert ?? 3.0);
    const score = scoreEngine.score(p, resolution.subsegment, resolution.archetype);
    for (const k of PILLAR_KEYS) {
      assert.equal(round1HalfEven(score.pillars[k]), exp.pillars[k], `${p.id} pillar ${k}`);
    }
  }
});

test('IES017-D17-ACC4: effective band-table resolution (calibrated ?? baseline, boundaries+scores together)', () => {
  const eng = new AutomobileScoreEngine(loadAutomobileCalibration());
  // ev-native: calibrated AB-004 (thinner per-vehicle margin) + AB-009 (heavier EV capex).
  assert.equal(eng.band('ev-native', 'AB-004', 8), 75, 'calibrated ev-native vehicleMargin @8 -> 75 (baseline would be 60)');
  assert.equal(eng.band('ev-native', 'AB-009', 20), 75, 'calibrated ev-native capexIntensity @20 -> 75 (baseline would be 55)');
  // tier-1-supplier: calibrated AB-005 (higher utilization floor).
  assert.equal(eng.band('tier-1-supplier', 'AB-005', 75), 60, 'calibrated tier-1 utilization @75 -> 60 (baseline would be 75)');
  // Baseline fallback: mass-market-oem has no calibrated tables.
  assert.equal(eng.band('mass-market-oem', 'AB-004', 10), 75, 'baseline vehicleMargin @10 -> 75 (no calibrated table)');
  // Cardinality invariant preserved for all calibrated tables.
  assert.equal(eng.cardinalityOk('ev-native', 'AB-004'), true);
  assert.equal(eng.cardinalityOk('tier-1-supplier', 'AB-005'), true);
});

test('IES017-D17-ACC5: composite round-half-to-even (AB-010 raw 56.25 -> 56.2, ties-to-even)', () => {
  const p = golden.providers.find((x: { id: string }) => x.id === 'AB-010');
  const r = execute(p);
  assert.equal(r.result.metadata.composite, 56.2);
  assert.equal(r.result.metadata.verdict, 'Hold');
  // Independent recomputation of the raw (unrounded) composite: a genuine .x5 tie.
  const engine = new AutomobileEngine();
  engine.onRegister(new Container({} as never));
  const scoreEngine = new AutomobileScoreEngine(loadAutomobileCalibration());
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

test('IES017-D17-ACC6: multi-subsegment + hybrid resolution (AB-009)', () => {
  const engine = new AutomobileEngine();
  engine.onRegister(new Container({} as never));
  // Hybrid archetype resolved via hybridDominant -> luxury.
  const hyb = engine['metrics'].resolve({ subsegment: 'premium-oem', archetype: 'hybrid', hybridDominant: 'luxury', revenueGrowth: 9 }, () => 3.0);
  assert.equal(hyb.archetype, 'luxury');
  // Multi-subsegment dominant.
  const dom = engine['metrics'].resolve({ subsegments: ['mass-market-oem', 'premium-oem'], subsegmentDominant: 'premium-oem', archetype: 'hybrid', hybridDominant: 'luxury' }, () => 3.0);
  assert.equal(dom.subsegment, 'premium-oem');
  // Multi-subsegment no dominant -> most conservative (highest leverageAlert = premium-oem 3.5 / ev-native 3.5 vs mass-market-oem 3.0).
  const cons = engine['metrics'].resolve({ subsegments: ['mass-market-oem', 'premium-oem', 'commercial-vehicles'], archetype: 'full-line', revenueGrowth: 4 }, (s) => ({ 'mass-market-oem': 3.0, 'premium-oem': 3.5, 'commercial-vehicles': 3.0 } as Record<string, number>)[s] ?? 3.0);
  assert.equal(cons.subsegment, 'premium-oem');
});

test('IES017-D17-ACC7: override / min-rank deterministic (AB-006, AB-011)', () => {
  // AB-006: leverage-breach + margin-compression + competition-pressure -> Watch.
  const r1 = execute(golden.providers.find((x: { id: string }) => x.id === 'AB-006'));
  assert.equal(r1.result.metadata.verdict, 'Watch');
  assert.deepEqual(r1.result.metadata.overridesApplied, ['leverage-breach', 'margin-compression', 'competition-pressure']);
  // AB-011: governance -> Avoid (min_rank over Watch base + leverage-breach).
  const r2 = execute(golden.providers.find((x: { id: string }) => x.id === 'AB-011'));
  assert.equal(r2.result.metadata.verdict, 'Avoid');
  assert.deepEqual(r2.result.metadata.overridesApplied, ['leverage-breach', 'governance']);
});

test('IES017-D17-ACC8: missing-data renormalization (AB-014: fcfYield omitted -> capitalEfficiency 0.0)', () => {
  const ab014 = validationFixtures.edgeCases.find((x: { id: string }) => x.id === 'AB-014');
  const { id, name, expected: _exp, ...inputs } = ab014;
  const r = execute(inputs);
  assert.equal(r.result.metadata.composite, 63.8);
  assert.equal(r.result.metadata.verdict, 'Accumulate');
  assert.equal(r.result.metadata.pillars.capitalEfficiency, 0.0, 'empty pillar renormalizes to 0.0 (never fabricated)');
});

test('IES017-D17-ACC9: calibrated band-boundary semantics (AB-015)', () => {
  const ab015 = validationFixtures.edgeCases.find((x: { id: string }) => x.id === 'AB-015');
  const { id, name, expected: _exp, ...inputs } = ab015;
  const r = execute(inputs);
  assert.equal(r.result.metadata.composite, 73.1);
  assert.equal(r.result.metadata.verdict, 'Buy');
  assert.deepEqual(r.result.metadata.overridesApplied, []);
});

test('IES017-D17-ACC10: all 6 verdict bands exercised across the 13 providers', () => {
  const bands = new Set<string>();
  for (const p of golden.providers) {
    const exp = expected.expected.find((e: { providerId: string }) => e.providerId === p.id);
    bands.add(exp.verdict);
  }
  for (const v of ['Strong Buy', 'Buy', 'Accumulate', 'Hold', 'Watch', 'Avoid']) {
    assert.ok(bands.has(v), `missing verdict band ${v}`);
  }
});

test('IES017-D17-ACC11: ontology registration — 8/8 dimensions (CSIP-compatible)', () => {
  const meta = AUTOMOBILE_ONTOLOGY_METADATA;
  const dims = ['Conviction', 'Confidence', 'Quality', 'Growth', 'Risk', 'Profitability', 'Capital Efficiency', 'Valuation'];
  const mapped = Object.values(meta);
  for (const d of dims) assert.ok(mapped.includes(d), `missing ${d}`);
  assert.equal(mapped.length, 8);
  assert.equal(Object.keys(meta).length, 8);
});

test('IES017-D17-ACC12: evidence complete for every provider + replay deterministic', () => {
  for (const p of golden.providers) {
    const r = execute(p as Record<string, unknown>);
    assert.equal(r.result.state, 'COMPLETED');
    assert.ok(r.result.evidenceRef);
    assert.equal(r.result.metadata.verdict, expected.expected.find((e: { providerId: string }) => e.providerId === p.id).verdict);
  }
  // Replay determinism in an isolated runtime: identical snapshot inputs -> reproduced.
  {
    const { plugins, runtime, replay } = makeRuntime();
    plugins.load(new AutomobileEngine());
    plugins.initialize(AUTOMOBILE_ENGINE_ID);
    const snap = runtime.recordSnapshot(AUTOMOBILE_ENGINE_ID, { revenueGrowth: 8 }, { quality: 65.25 }, 'AUTOMOBILE_SUMMARY');
    assert.equal(replay.replay(snap.snapshotId)?.reproduced, true);
  }
});

test('IES017-D17-ACC13: leverage alert + archetype risk applied (AB-005 ev-native vs AB-006 mass-market-oem)', () => {
  // AB-005: ev-native (leverageAlert 3.5) — debtEbitda 3.2 < 3.5 -> NO leverage-breach.
  const r = execute(golden.providers.find((x: { id: string }) => x.id === 'AB-005'));
  assert.equal(r.result.metadata.composite, 66.9);
  assert.equal(r.result.metadata.verdict, 'Accumulate');
  assert.deepEqual(r.result.metadata.overridesApplied, [], 'no leverage-breach under ev-native 3.5 alert');
  // Contrast: AB-006 mass-market-oem (leverageAlert 3.0) with debtEbitda 3.6 -> leverage-breach.
  const r2 = execute(golden.providers.find((x: { id: string }) => x.id === 'AB-006'));
  assert.ok(r2.result.metadata.overridesApplied.includes('leverage-breach'));
});
