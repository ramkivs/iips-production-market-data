/**
 * IES-020 D20 WP-4 — Validation, Replay, Regression, Evidence.
 * Validates the Materials & Metals implementation against the ACTUAL frozen reference assets
 * (loaded from the standards delivery unit ies-020-materials-metals), covering: golden
 * regression (13/13), replay (byte-identical metadata), validation fixtures (MM-014 missing
 * primitive, MM-015 calibrated boundary), replay-dataset integrity, and calibration integrity.
 * Per governance: no methodology changes during validation; reference assets are the oracle.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { MaterialsMetalsEngine, MATERIALS_METALS_ENGINE_ID } from '../../src/sector-engines/materials-metals/MaterialsMetalsEngine';
import { loadMaterialsMetalsCalibration } from '../../src/sector-engines/materials-metals/calibration/MaterialsMetalsCalibration';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';

const STANDARDS_DIR = path.resolve(__dirname, '../../../ies-020-materials-metals');

function readJson(rel: string): any {
  return JSON.parse(fs.readFileSync(path.join(STANDARDS_DIR, rel), 'utf8'));
}

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
  return runtime.execute(MATERIALS_METALS_ENGINE_ID, { requestId: 'mm-wp4', inputs: input as never });
}

test('IES020-WP4-ACC1: golden regression — all 13 frozen expected outputs from the standards unit', () => {
  const golden = readJson('fixtures/materials-metals-golden-reference-1.0.0.json');
  const expected = readJson('expected-outputs/materials-metals-expected-outputs-1.0.0.json');
  assert.equal(golden.providers.length, 13);
  for (const p of golden.providers) {
    const eo = expected.expected.find((e: any) => e.providerId === p.id);
    const r = execute(p);
    assert.equal(r.result.state, 'COMPLETED', `${p.id} state`);
    assert.equal(r.result.metadata.composite, eo.composite, `${p.id} composite`);
    assert.equal(r.result.metadata.verdict, eo.verdict, `${p.id} verdict`);
    assert.equal(r.result.metadata.resolvedSubsegment, eo.subsegment, `${p.id} subsegment`);
    assert.equal(r.result.metadata.resolvedArchetype, eo.archetype, `${p.id} archetype`);
    assert.deepEqual(r.result.metadata.overridesApplied, eo.overrides, `${p.id} overrides`);
  }
});

test('IES020-WP4-ACC2: replay — byte-identical across repeated runs (calibration version bound)', () => {
  const golden = readJson('fixtures/materials-metals-golden-reference-1.0.0.json');
  const run = () => execute(golden.providers[0]);
  const a = run();
  const b = run();
  assert.equal(a.result.metadata.composite, b.result.metadata.composite, 'identical composite scores');
  assert.equal(a.result.metadata.verdict, b.result.metadata.verdict, 'identical verdicts');
  assert.equal(JSON.stringify(a.result.metadata.overridesApplied), JSON.stringify(b.result.metadata.overridesApplied), 'identical overrides');
  assert.equal(a.result.metadata.calibrationVersion, b.result.metadata.calibrationVersion, 'identical calibration version');
  assert.equal(JSON.stringify(a.result.metadata), JSON.stringify(b.result.metadata), 'identical metadata');
});

test('IES020-WP4-ACC3: validation fixtures — missing primitive + calibrated boundary', () => {
  const vf = readJson('fixtures/materials-metals-validation-fixtures-1.0.0.json');
  const mm014 = vf.edgeCases.find((x: any) => x.id === 'MM-014');
  const mm015 = vf.edgeCases.find((x: any) => x.id === 'MM-015');
  for (const ec of [mm014, mm015]) {
    const { id, name, expected: _exp, ...inputs } = ec;
    const r = execute(inputs);
    assert.equal(r.result.metadata.composite, ec.expected.composite, `${ec.id} composite`);
    assert.equal(r.result.metadata.verdict, ec.expected.verdict, `${ec.id} verdict`);
    assert.deepEqual(r.result.metadata.overridesApplied, ec.expected.overrides, `${ec.id} overrides`);
  }
  // MM-014 specifically: empty pillar renormalization, never fabricated.
  {
    const { id, name, expected: _exp, ...inputs } = mm014;
    const r = execute(inputs);
    assert.equal(r.result.metadata.pillars.capitalEfficiency, 0.0);
  }
});

test('IES020-WP4-ACC4: replay dataset integrity — derived 1:1 from approved inputs + expected outputs', () => {
  const rd = readJson('replay-datasets/materials-metals-replay-dataset-1.0.0.json');
  const golden = readJson('fixtures/materials-metals-golden-reference-1.0.0.json');
  const expected = readJson('expected-outputs/materials-metals-expected-outputs-1.0.0.json');
  assert.equal(rd.sectors.length, 13);
  for (const s of rd.sectors) {
    const gold = golden.providers.find((p: any) => p.id === s.providerId);
    const exp = expected.expected.find((e: any) => e.providerId === s.providerId);
    assert.ok(gold, `golden provider ${s.providerId}`);
    const inputs = Object.fromEntries(Object.entries(gold).filter(([k]) => k !== 'id' && k !== 'name'));
    assert.deepEqual(s.inputs, inputs, `${s.providerId} inputs match golden`);
    assert.equal(s.expected.composite, exp.composite, `${s.providerId} composite`);
    assert.equal(s.expected.verdict, exp.verdict, `${s.providerId} verdict`);
    assert.deepEqual(s.expected.overrides, exp.overrides, `${s.providerId} overrides`);
    assert.equal(s.reproduced, true, `${s.providerId} reproduced`);
    assert.equal(s.byteIdentical, true, `${s.providerId} byteIdentical`);
  }
});

test('IES020-WP4-ACC5: calibration integrity — 12 band tables, 5 subsegments, 6 archetypes, 6 verdict bands', () => {
  const cal = loadMaterialsMetalsCalibration();
  assert.equal(Object.keys(cal.bandScores).length, 12);
  assert.equal(Object.keys(cal.segments).length, 5);
  assert.equal(Object.keys(cal.archetypeRisk).length, 6);
  assert.equal(cal.verdictMapping.length, 6);
  assert.equal(cal.version, '1.0.0');
  // subsegment weight vectors sum to 1.0.
  for (const [name, seg] of Object.entries(cal.segments)) {
    const sum = seg.w.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1.0) < 1e-12, `${name} weights sum ${sum}`);
  }
});
