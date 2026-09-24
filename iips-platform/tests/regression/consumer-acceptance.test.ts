/**
 * IES-013 WP-3 — Consumer Engine acceptance.
 * Reproduces the 10 frozen expected outputs (consumer-expected-outputs-1.0.0.json) from the
 * golden dataset, and exercises metrics/scoring/calibration/decision/overrides/evidence/
 * ontology registration deterministically.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ConsumerEngine, CONSUMER_ENGINE_ID, CONSUMER_ONTOLOGY_METADATA } from '../../src/sector-engines/consumer/ConsumerEngine';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';

const ASSET_DIR = path.resolve(__dirname, '../../src/sector-engines/consumer/');
const golden = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'consumer-golden-reference-1.0.0.json'), 'utf8'));
const expected = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'consumer-expected-outputs-1.0.0.json'), 'utf8'));

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
  plugins.load(new ConsumerEngine());
  plugins.initialize(CONSUMER_ENGINE_ID);
  return runtime.execute(CONSUMER_ENGINE_ID, { requestId: 'cs-acc', inputs: input as never });
}

test('IES013-WP3-ACC1: metric evaluation', () => {
  const r = execute({ segment: 'staples', businessModel: 'branded', revenueGrowth: 4, priceContribution: 65, brandLoyalty: 85, marginResilience: 0.9, dtcShare: 20, fcfYield: 6, innovationIntensity: 10, privateLabelExposure: 10, ebitdaMargin: 22, debtEbitda: 2.2, peRatio: 20, roic: 16 });
  assert.equal(r.result.state, 'COMPLETED');
});

test('IES013-WP3-ACC2..ACC6: all 10 frozen expected outputs reproduced exactly (golden regression)', () => {
  for (const p of golden.providers) {
    const r = execute(p);
    const exp = expected.expected.find((e: { providerId: string }) => e.providerId === p.id);
    assert.equal(r.result.state, 'COMPLETED', `${p.id} state`);
    assert.equal(r.result.metadata.composite, exp.composite, `${p.id} composite`);
    assert.equal(r.result.metadata.verdict, exp.verdict, `${p.id} verdict`);
  }
});

test('IES013-WP3-ACC7: override precedence applied deterministically (D10)', () => {
  // CS-003 category disruption + leverage → Watch.
  const cd = execute(golden.providers[2]);
  assert.equal(cd.result.metadata.verdict, 'Watch');
  assert.ok(cd.result.metadata.overridesApplied.includes('category-disruption'));
  assert.ok(cd.result.metadata.overridesApplied.includes('leverage-alert'));

  // CS-005 brand erosion → Avoid.
  const be = execute(golden.providers[4]);
  assert.equal(be.result.metadata.verdict, 'Avoid');
  assert.ok(be.result.metadata.overridesApplied.includes('brand-erosion'));

  // CS-006 channel loss → Watch.
  const cl = execute(golden.providers[5]);
  assert.equal(cl.result.metadata.verdict, 'Watch');
  assert.ok(cl.result.metadata.overridesApplied.includes('channel-loss'));

  // CS-008 input-cost squeeze → Watch.
  const ics = execute(golden.providers[7]);
  assert.equal(ics.result.metadata.verdict, 'Watch');
  assert.ok(ics.result.metadata.overridesApplied.includes('input-cost-squeeze'));
});

test('IES013-WP3-ACC5: segment + business-model calibration isolates', () => {
  // luxury (CS-001) vs discretionary (CS-009) have different weights → different composite.
  const lux = execute(golden.providers[0]);
  const disc = execute(golden.providers[8]);
  assert.notEqual(lux.result.metadata.composite, disc.result.metadata.composite);
});

test('IES013-WP3-ACC8: evidence generated via shared pipeline', () => {
  const r = execute(golden.providers[0]);
  assert.ok(r.result.evidenceRef);
  assert.ok(r.result.snapshotRef);
});

test('IES013-WP3-ACC9: ontology registration covers 8 dimensions (CSIP-compatible)', () => {
  const meta = CONSUMER_ONTOLOGY_METADATA;
  const dims = ['Conviction', 'Confidence', 'Quality', 'Growth', 'Risk', 'Valuation', 'Capital Efficiency', 'Moat'];
  const mapped = Object.values(meta);
  for (const d of dims) assert.ok(mapped.includes(d), `missing ${d}`);
  assert.equal(mapped.length, 8);
});

test('IES013-WP3-ACC10: full engine replay-deterministic via shared services', () => {
  const run = () => execute(golden.providers[0]);
  const a = run();
  const b = run();
  assert.equal(a.result.state, 'COMPLETED');
  assert.equal(JSON.stringify(a.result.metadata), JSON.stringify(b.result.metadata));
});
