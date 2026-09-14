/**
 * IES-014 WP-3 — Industrials Engine acceptance.
 * Reproduces the 10 frozen expected outputs (industrials-expected-outputs-1.0.0.json) from the
 * golden dataset, and exercises metrics/scoring/calibration/decision/overrides/evidence/
 * ontology registration deterministically.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { IndustrialsEngine, INDUSTRIALS_ENGINE_ID, INDUSTRIALS_ONTOLOGY_METADATA } from '../../src/sector-engines/industrials/IndustrialsEngine';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';

const ASSET_DIR = path.resolve(__dirname, '../../src/sector-engines/industrials/');
const golden = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'industrials-golden-reference-1.0.0.json'), 'utf8'));
const expected = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'industrials-expected-outputs-1.0.0.json'), 'utf8'));

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
  plugins.load(new IndustrialsEngine());
  plugins.initialize(INDUSTRIALS_ENGINE_ID);
  return runtime.execute(INDUSTRIALS_ENGINE_ID, { requestId: 'in-acc', inputs: input as never });
}

test('IES014-WP3-ACC1: metric evaluation', () => {
  const r = execute({ subsegment: 'capital-goods', archetype: 'oem', ebitdaMargin: 22, revenueGrowth: 8, debtEbitda: 2.0, evEbitda: 12, roce: 20, backlog: 2.5, bookToBill: 1.05, aftermarketShare: 30, fcfYield: 8, orderGrowth: 8, operatingMargin: 22, projectRiskExposure: 20 });
  assert.equal(r.result.state, 'COMPLETED');
});

test('IES014-WP3-ACC2..ACC6: all 10 frozen expected outputs reproduced exactly (golden regression)', () => {
  for (const p of golden.providers) {
    const r = execute(p);
    const exp = expected.expected.find((e: { providerId: string }) => e.providerId === p.id);
    assert.equal(r.result.state, 'COMPLETED', `${p.id} state`);
    assert.equal(r.result.metadata.composite, exp.composite, `${p.id} composite`);
    assert.equal(r.result.metadata.verdict, exp.verdict, `${p.id} verdict`);
  }
});

test('IES014-WP3-ACC7: override precedence (min-rank) deterministic (D15/D10)', () => {
  // IN-007 order cancellation → Watch.
  const oc = execute(golden.providers[6]);
  assert.equal(oc.result.metadata.verdict, 'Watch');
  assert.ok(oc.result.metadata.overridesApplied.includes('order-cancellation'));

  // IN-008 defense program → Watch.
  const dp = execute(golden.providers[7]);
  assert.equal(dp.result.metadata.verdict, 'Watch');
  assert.ok(dp.result.metadata.overridesApplied.includes('defense-program'));

  // IN-009 EPC overrun → Watch.
  const eo = execute(golden.providers[8]);
  assert.equal(eo.result.metadata.verdict, 'Watch');
  assert.ok(eo.result.metadata.overridesApplied.includes('epc-overrun'));

  // IN-010 margin compression + leverage → Watch.
  const mc = execute(golden.providers[9]);
  assert.equal(mc.result.metadata.verdict, 'Watch');
  assert.ok(mc.result.metadata.overridesApplied.includes('margin-compression'));
  assert.ok(mc.result.metadata.overridesApplied.includes('leverage-breach'));
});

test('IES014-WP3-ACC5: subsegment + archetype calibration isolates', () => {
  // capital-goods (IN-001) vs aero-defense (IN-002) have different weights → different composite.
  const cg = execute(golden.providers[0]);
  const ad = execute(golden.providers[1]);
  assert.notEqual(cg.result.metadata.composite, ad.result.metadata.composite);
});

test('IES014-WP3-ACC8: evidence generated via shared pipeline', () => {
  const r = execute(golden.providers[0]);
  assert.ok(r.result.evidenceRef);
  assert.ok(r.result.snapshotRef);
});

test('IES014-WP3-ACC9: ontology registration covers 8 dimensions (CSIP-compatible)', () => {
  const meta = INDUSTRIALS_ONTOLOGY_METADATA;
  const dims = ['Conviction', 'Confidence', 'Quality', 'Growth', 'Risk', 'Valuation', 'Capital Efficiency', 'Moat'];
  const mapped = Object.values(meta);
  for (const d of dims) assert.ok(mapped.includes(d), `missing ${d}`);
  assert.equal(mapped.length, 8);
});

test('IES014-WP3-ACC10: full engine replay-deterministic via shared services', () => {
  const run = () => execute(golden.providers[0]);
  const a = run();
  const b = run();
  assert.equal(a.result.state, 'COMPLETED');
  assert.equal(JSON.stringify(a.result.metadata), JSON.stringify(b.result.metadata));
});
