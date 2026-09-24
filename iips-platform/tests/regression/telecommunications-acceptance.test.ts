/**
 * IES-016 D16 — Telecommunications Engine acceptance.
 * Reproduces the 13 frozen expected outputs (telecommunications-expected-outputs-1.0.0.json)
 * from the golden dataset, and exercises metrics/scoring/calibration/decision/overrides/
 * evidence/ontology, effective band-table resolution, multi-subsegment/hybrid resolution,
 * missing-data renormalization, round-half-to-even, and deterministic replay.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TelecommunicationsEngine, TELECOMMUNICATIONS_ENGINE_ID, TELECOMMUNICATIONS_ONTOLOGY_METADATA } from '../../src/sector-engines/telecommunications/TelecommunicationsEngine';
import { loadTelecommunicationsCalibration } from '../../src/sector-engines/telecommunications/calibration/TelecommunicationsCalibration';
import { TelecommunicationsScoreEngine } from '../../src/sector-engines/telecommunications/scoring/TelecommunicationsScoreEngine';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';

const ASSET_DIR = path.resolve(__dirname, '../../src/sector-engines/telecommunications/');
const golden = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'telecommunications-golden-reference-1.0.0.json'), 'utf8'));
const expected = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'telecommunications-expected-outputs-1.0.0.json'), 'utf8'));
const validationFixtures = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'telecommunications-validation-fixtures-1.0.0.json'), 'utf8'));

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
  plugins.load(new TelecommunicationsEngine());
  plugins.initialize(TELECOMMUNICATIONS_ENGINE_ID);
  return runtime.execute(TELECOMMUNICATIONS_ENGINE_ID, { requestId: 'tc-acc', inputs: input as never });
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

test('IES016-D16-ACC1: metric evaluation + engine executes (TC-001 -> Buy)', () => {
  const r = execute({ subsegment: 'wireless-mno', archetype: 'consumer', ebitdaMargin: 42, revenueGrowth: 6, debtEbitda: 2.2, arpu: 34, churnRate: 1.1, postpaidMix: 88, fcfYield: 6, roic: 12, capexIntensity: 15, spectrumCost: 0.8, evEbitda: 6.5, usageGrowth: 22 });
  assert.equal(r.result.state, 'COMPLETED');
  assert.equal(r.result.metadata.verdict, 'Buy');
});

test('IES016-D16-ACC2: all 13 frozen expected outputs reproduced exactly (composite + verdict + subsegment + archetype + overrides)', () => {
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

test('IES016-D16-ACC3: pillars match frozen expected outputs (round-half-to-even at 1dp)', () => {
  const engine = new TelecommunicationsEngine();
  engine.onRegister(new Container({} as never));
  const scoreEngine = new TelecommunicationsScoreEngine(loadTelecommunicationsCalibration());
  for (const p of golden.providers) {
    const exp = expected.expected.find((e: { providerId: string }) => e.providerId === p.id);
    const resolution = engine['metrics'].resolve(p, (s) => engine['calibration'].segments[s]?.leverageAlert ?? 3.0);
    const score = scoreEngine.score(p, resolution.subsegment, resolution.archetype);
    for (const k of PILLAR_KEYS) {
      assert.equal(round1HalfEven(score.pillars[k]), exp.pillars[k], `${p.id} pillar ${k}`);
    }
  }
});

test('IES016-D16-ACC4: effective band-table resolution (calibrated ?? baseline, boundaries+scores together)', () => {
  const eng = new TelecommunicationsScoreEngine(loadTelecommunicationsCalibration());
  // fixed-broadband: calibrated TC-004 (ARPU scale) — higher thresholds than baseline.
  assert.equal(eng.band('fixed-broadband', 'TC-004', 40), 75, 'calibrated fixed-broadband ARPU @40 -> 75 (baseline would be 90)');
  assert.equal(eng.band('fixed-broadband', 'TC-004', 25), 60, 'calibrated fixed-broadband ARPU @25 -> 60 (baseline would be 75)');
  // tower-infra: calibrated TC-004 (per-site recurring revenue) + TC-011 (infra premium multiple).
  assert.equal(eng.band('tower-infra', 'TC-004', 3.2), 75, 'calibrated tower ARPU @3.2 -> 75 (baseline would be 40)');
  assert.equal(eng.band('tower-infra', 'TC-011', 16), 55, 'calibrated tower EV/EBITDA @16 -> 55 (baseline would be 30)');
  // Baseline fallback: wireless-mno has no calibrated tables.
  assert.equal(eng.band('wireless-mno', 'TC-004', 40), 90, 'baseline ARPU @40 -> 90 (wireless-mno has no calibrated table)');
  // Cardinality invariant preserved for all calibrated tables.
  assert.equal(eng.cardinalityOk('fixed-broadband', 'TC-004'), true);
  assert.equal(eng.cardinalityOk('tower-infra', 'TC-011'), true);
});

test('IES016-D16-ACC5: composite round-half-to-even (TC-012 raw 55.05 -> 55.0, ties-to-even)', () => {
  const p = golden.providers.find((x: { id: string }) => x.id === 'TC-012');
  const r = execute(p);
  assert.equal(r.result.metadata.composite, 55.0);
  assert.equal(r.result.metadata.verdict, 'Hold');
  // Independent recomputation of the raw (unrounded) composite: a genuine .x05 tie.
  const engine = new TelecommunicationsEngine();
  engine.onRegister(new Container({} as never));
  const scoreEngine = new TelecommunicationsScoreEngine(loadTelecommunicationsCalibration());
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

test('IES016-D16-ACC6: multi-subsegment + hybrid resolution (TC-009)', () => {
  const engine = new TelecommunicationsEngine();
  engine.onRegister(new Container({} as never));
  // Hybrid archetype resolved via hybridDominant -> converged.
  const hyb = engine['metrics'].resolve({ subsegment: 'converged-telco', archetype: 'hybrid', hybridDominant: 'converged', revenueGrowth: 4 }, () => 3.0);
  assert.equal(hyb.archetype, 'converged');
  // Multi-subsegment dominant.
  const dom = engine['metrics'].resolve({ subsegments: ['wireless-mno', 'fixed-broadband'], subsegmentDominant: 'wireless-mno', archetype: 'hybrid', hybridDominant: 'converged' }, () => 3.0);
  assert.equal(dom.subsegment, 'wireless-mno');
  // Multi-subsegment no dominant -> most conservative (highest leverageAlert = converged-telco 3.5 vs wireless-mno 3.5 vs cable-mso 4.0).
  const cons = engine['metrics'].resolve({ subsegments: ['wireless-mno', 'fixed-broadband', 'cable-mso'], archetype: 'consumer', revenueGrowth: 4 }, (s) => ({ 'wireless-mno': 3.5, 'fixed-broadband': 3.0, 'cable-mso': 4.0 } as Record<string, number>)[s] ?? 3.0);
  assert.equal(cons.subsegment, 'cable-mso');
});

test('IES016-D16-ACC7: override / min-rank deterministic (TC-006, TC-011)', () => {
  // TC-006: leverage-breach + competition-pressure + margin-compression -> Watch.
  const r1 = execute(golden.providers.find((x: { id: string }) => x.id === 'TC-006'));
  assert.equal(r1.result.metadata.verdict, 'Watch');
  assert.deepEqual(r1.result.metadata.overridesApplied, ['leverage-breach', 'competition-pressure', 'margin-compression']);
  // TC-011: governance -> Avoid (min_rank over Watch base + leverage-breach).
  const r2 = execute(golden.providers.find((x: { id: string }) => x.id === 'TC-011'));
  assert.equal(r2.result.metadata.verdict, 'Avoid');
  assert.deepEqual(r2.result.metadata.overridesApplied, ['leverage-breach', 'governance']);
});

test('IES016-D16-ACC8: missing-data renormalization (TC-014: fcfYield omitted -> capitalEfficiency 0.0)', () => {
  const tc014 = validationFixtures.edgeCases.find((x: { id: string }) => x.id === 'TC-014');
  const { id, name, expected: _exp, ...inputs } = tc014;
  const r = execute(inputs);
  assert.equal(r.result.metadata.composite, 70.3);
  assert.equal(r.result.metadata.verdict, 'Buy');
  assert.equal(r.result.metadata.pillars.capitalEfficiency, 0.0, 'empty pillar renormalizes to 0.0 (never fabricated)');
});

test('IES016-D16-ACC9: exact band-boundary semantics (TC-015 lower-inclusive / upper-exclusive)', () => {
  const tc015 = validationFixtures.edgeCases.find((x: { id: string }) => x.id === 'TC-015');
  const { id, name, expected: _exp, ...inputs } = tc015;
  const r = execute(inputs);
  assert.equal(r.result.metadata.composite, 68.2);
  assert.equal(r.result.metadata.verdict, 'Accumulate');
  assert.deepEqual(r.result.metadata.overridesApplied, []);
});

test('IES016-D16-ACC10: all 6 verdict bands exercised across the 13 providers', () => {
  const bands = new Set<string>();
  for (const p of golden.providers) {
    const exp = expected.expected.find((e: { providerId: string }) => e.providerId === p.id);
    bands.add(exp.verdict);
  }
  for (const v of ['Strong Buy', 'Buy', 'Accumulate', 'Hold', 'Watch', 'Avoid']) {
    assert.ok(bands.has(v), `missing verdict band ${v}`);
  }
});

test('IES016-D16-ACC11: ontology registration — 8/8 dimensions (CSIP-compatible)', () => {
  const meta = TELECOMMUNICATIONS_ONTOLOGY_METADATA;
  const dims = ['Conviction', 'Confidence', 'Quality', 'Growth', 'Risk', 'Profitability', 'Capital Efficiency', 'Valuation'];
  const mapped = Object.values(meta);
  for (const d of dims) assert.ok(mapped.includes(d), `missing ${d}`);
  assert.equal(mapped.length, 8);
  assert.equal(Object.keys(meta).length, 8);
});

test('IES016-D16-ACC12: evidence complete for every provider + replay deterministic', () => {
  for (const p of golden.providers) {
    const r = execute(p as Record<string, unknown>);
    assert.equal(r.result.state, 'COMPLETED');
    assert.ok(r.result.evidenceRef);
    assert.equal(r.result.metadata.verdict, expected.expected.find((e: { providerId: string }) => e.providerId === p.id).verdict);
  }
  // Replay determinism in an isolated runtime: identical snapshot inputs -> reproduced.
  {
    const { plugins, runtime, replay } = makeRuntime();
    plugins.load(new TelecommunicationsEngine());
    plugins.initialize(TELECOMMUNICATIONS_ENGINE_ID);
    const snap = runtime.recordSnapshot(TELECOMMUNICATIONS_ENGINE_ID, { revenueGrowth: 6 }, { quality: 80.25 }, 'TELECOMMUNICATIONS_SUMMARY');
    assert.equal(replay.replay(snap.snapshotId)?.reproduced, true);
  }
});

test('IES016-D16-ACC13: leverage alert + archetype risk applied (TC-005 tower-infra infrastructure)', () => {
  // TC-005: tower-infra (leverageAlert 5.0) — debtEbitda 4.2 < 5.0 -> NO leverage-breach;
  // infrastructure archetype risk 0.8 scales the risk weight in the composite.
  const r = execute(golden.providers.find((x: { id: string }) => x.id === 'TC-005'));
  assert.equal(r.result.metadata.composite, 69.6);
  assert.equal(r.result.metadata.verdict, 'Accumulate');
  assert.deepEqual(r.result.metadata.overridesApplied, [], 'no leverage-breach under tower-infra 5.0 alert');
  // Contrast: TC-006 wireless-mno (leverageAlert 3.5) with debtEbitda 4.0 -> leverage-breach.
  const r2 = execute(golden.providers.find((x: { id: string }) => x.id === 'TC-006'));
  assert.ok(r2.result.metadata.overridesApplied.includes('leverage-breach'));
});
