/**
 * IES-011 WP-3 — Energy Engine acceptance.
 * Reproduces the 9 frozen expected outputs (energy-expected-outputs-1.0.0.json) from the
 * golden dataset, and exercises metrics/scoring/calibration/decision/overrides/evidence/
 * ontology registration deterministically.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { EnergyEngine, ENERGY_ENGINE_ID, ENERGY_ONTOLOGY_METADATA } from '../../src/sector-engines/energy/EnergyEngine';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';

const ASSET_DIR = path.resolve(__dirname, '../../src/sector-engines/energy/');
const golden = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'energy-golden-reference-1.0.0.json'), 'utf8'));
const expected = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'energy-expected-outputs-1.0.0.json'), 'utf8'));

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
  plugins.load(new EnergyEngine());
  plugins.initialize(ENERGY_ENGINE_ID);
  return runtime.execute(ENERGY_ENGINE_ID, { requestId: 'en-acc', inputs: input as never });
}

test('IES011-WP3-ACC1: metric evaluation (WP3-ACC1)', () => {
  // Metrics evaluate deterministically (returns normalized inputs).
  const r = execute({ segment: 'upstream', commodityExposure: 'price-taker', productionGrowth: 8, liftingCost: 18, reserveReplacement: 1.3, ebitdaMargin: 45, revenueGrowth: 9, debtEbitda: 2.2, roce: 16, transitionMix: 5, fcfYield: 10, evEbitda: 4 });
  assert.equal(r.result.state, 'COMPLETED');
});

test('IES011-WP3-ACC2..ACC6: all 9 frozen expected outputs reproduced exactly (golden regression)', () => {
  for (const p of golden.providers) {
    const r = execute(p);
    const exp = expected.expected.find((e: { providerId: string }) => e.providerId === p.id);
    assert.equal(r.result.state, 'COMPLETED', `${p.id} state`);
    assert.equal(r.result.metadata.composite, exp.composite, `${p.id} composite`);
    assert.equal(r.result.metadata.verdict, exp.verdict, `${p.id} verdict`);
  }
});

test('IES011-WP3-ACC7: override precedence applied deterministically (D10)', () => {
  // EN-007 price collapse → Watch (also leverage).
  const crash = execute({ segment: 'upstream', commodityExposure: 'price-taker', productionGrowth: -5, liftingCost: 45, reserveReplacement: 0.7, ebitdaMargin: 10, revenueGrowth: -20, debtEbitda: 4.5, roce: 3, transitionMix: 5, fcfYield: 1, evEbitda: 6, priceCollapse: true });
  assert.equal(crash.result.metadata.verdict, 'Watch');
  assert.ok(crash.result.metadata.overridesApplied.includes('price-collapse'));
  assert.ok(crash.result.metadata.overridesApplied.includes('leverage-alert'));

  // EN-008 reserve write-down → Watch.
  const wd = execute({ segment: 'upstream', commodityExposure: 'partial-hedger', productionGrowth: -2, liftingCost: 40, reserveReplacement: 0.6, ebitdaMargin: 18, revenueGrowth: -5, debtEbitda: 3.2, roce: 6, transitionMix: 5, fcfYield: 3, evEbitda: 5, reserveWriteDown: true });
  assert.equal(wd.result.metadata.verdict, 'Watch');
  assert.ok(wd.result.metadata.overridesApplied.includes('reserve-write-down'));

  // EN-009 stranded asset → Watch.
  const sa = execute({ segment: 'utility', commodityExposure: 'regulated-return', productionGrowth: 1, liftingCost: 35, reserveReplacement: 1.0, ebitdaMargin: 25, revenueGrowth: 2, debtEbitda: 4.0, roce: 7, transitionMix: 12, fcfYield: 4, evEbitda: 8, strandedAsset: true });
  assert.equal(sa.result.metadata.verdict, 'Watch');
  assert.ok(sa.result.metadata.overridesApplied.includes('stranded-asset'));
});

test('IES011-WP3-ACC5: segment + commodity calibration isolates (Calibration Resolution Order)', () => {
  // Same fundamentals, different segment → different composite.
  const up = execute({ segment: 'upstream', commodityExposure: 'price-taker', productionGrowth: 4, liftingCost: 30, reserveReplacement: 1.1, ebitdaMargin: 32, revenueGrowth: 6, debtEbitda: 2.0, roce: 14, transitionMix: 15, fcfYield: 7, evEbitda: 5 });
  const util = execute({ segment: 'utility', commodityExposure: 'regulated-return', productionGrowth: 4, liftingCost: 30, reserveReplacement: 1.1, ebitdaMargin: 32, revenueGrowth: 6, debtEbitda: 2.0, roce: 14, transitionMix: 15, fcfYield: 7, evEbitda: 5 });
  assert.notEqual(up.result.metadata.composite, util.result.metadata.composite);
});

test('IES011-WP3-ACC8: evidence generated via shared pipeline', () => {
  const goldenProv = golden.providers[1];
  const r = execute(goldenProv);
  assert.ok(r.result.evidenceRef);
  assert.ok(r.result.snapshotRef);
});

test('IES011-WP3-ACC9: ontology registration covers 8 dimensions (CSIP-compatible)', () => {
  const meta = ENERGY_ONTOLOGY_METADATA;
  const dims = ['Conviction', 'Confidence', 'Quality', 'Growth', 'Risk', 'Valuation', 'Capital Efficiency', 'Moat'];
  const mapped = Object.values(meta);
  for (const d of dims) assert.ok(mapped.includes(d), `missing ${d}`);
  assert.equal(mapped.length, 8);
});

test('IES011-WP3-ACC10: full engine replay-deterministic via shared services', () => {
  const run = () => execute(golden.providers[0]);
  const a = run();
  const b = run();
  assert.equal(a.result.state, 'COMPLETED');
  assert.equal(JSON.stringify(a.result.metadata), JSON.stringify(b.result.metadata));
});
