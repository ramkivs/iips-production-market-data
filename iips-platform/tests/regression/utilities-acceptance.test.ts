/**
 * IES-012 WP-3 — Utilities Engine acceptance.
 * Reproduces the 11 frozen expected outputs (utilities-expected-outputs-1.0.0.json) from the
 * golden dataset, and exercises metrics/scoring/calibration/decision/overrides/evidence/
 * ontology registration deterministically.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { UtilitiesEngine, UTILITIES_ENGINE_ID, UTILITIES_ONTOLOGY_METADATA } from '../../src/sector-engines/utilities/UtilitiesEngine';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';

const ASSET_DIR = path.resolve(__dirname, '../../src/sector-engines/utilities/');
const golden = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'utilities-golden-reference-1.0.0.json'), 'utf8'));
const expected = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'utilities-expected-outputs-1.0.0.json'), 'utf8'));

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
  plugins.load(new UtilitiesEngine());
  plugins.initialize(UTILITIES_ENGINE_ID);
  return runtime.execute(UTILITIES_ENGINE_ID, { requestId: 'ut-acc', inputs: input as never });
}

test('IES012-WP3-ACC1: metric evaluation (WP3-ACC1)', () => {
  const r = execute({ segment: 'regulated-electric', regulatoryPosture: 'constructive', rateBaseGrowth: 7, allowedRoe: 10, ffoDebt: 18, omEfficiency: 18, demandGrowth: 2, saidi: 90, transitionCapexIntensity: 30, ebitdaMargin: 42, revenueGrowth: 4, debtEbitda: 3.5, peRatio: 18, roe: 11 });
  assert.equal(r.result.state, 'COMPLETED');
});

test('IES012-WP3-ACC2..ACC6: all 11 frozen expected outputs reproduced exactly (golden regression)', () => {
  for (const p of golden.providers) {
    const r = execute(p);
    const exp = expected.expected.find((e: { providerId: string }) => e.providerId === p.id);
    assert.equal(r.result.state, 'COMPLETED', `${p.id} state`);
    assert.equal(r.result.metadata.composite, exp.composite, `${p.id} composite`);
    assert.equal(r.result.metadata.verdict, exp.verdict, `${p.id} verdict`);
  }
});

test('IES012-WP3-ACC7: override precedence applied deterministically (D10)', () => {
  // UT-007 adverse rate case → Watch.
  const arc = execute(golden.providers[6]);
  assert.equal(arc.result.metadata.verdict, 'Watch');
  assert.ok(arc.result.metadata.overridesApplied.includes('adverse-rate-case'));

  // UT-008 regulatory lag → Watch.
  const lag = execute(golden.providers[7]);
  assert.equal(lag.result.metadata.verdict, 'Watch');
  assert.ok(lag.result.metadata.overridesApplied.includes('regulatory-lag'));

  // UT-009 capex overrun → Watch.
  const co = execute(golden.providers[8]);
  assert.equal(co.result.metadata.verdict, 'Watch');
  assert.ok(co.result.metadata.overridesApplied.includes('capex-overrun'));

  // UT-010 merchant price stress → leverage → Watch.
  const ms = execute(golden.providers[9]);
  assert.equal(ms.result.metadata.verdict, 'Watch');
  assert.ok(ms.result.metadata.overridesApplied.includes('leverage-alert'));

  // UT-011 stranded asset → Watch.
  const sa = execute(golden.providers[10]);
  assert.equal(sa.result.metadata.verdict, 'Watch');
  assert.ok(sa.result.metadata.overridesApplied.includes('stranded-asset'));
});

test('IES012-WP3-ACC5: segment + regulatory calibration isolates', () => {
  // Regulated-electric (UT-001) vs ipp-merchant (UT-005) have different calibration weights → different composite.
  const reg = execute(golden.providers[0]);   // UT-001 regulated-electric
  const merchant = execute(golden.providers[4]); // UT-005 ipp-merchant
  assert.notEqual(reg.result.metadata.composite, merchant.result.metadata.composite);
});

test('IES012-WP3-ACC8: evidence generated via shared pipeline', () => {
  const r = execute(golden.providers[0]);
  assert.ok(r.result.evidenceRef);
  assert.ok(r.result.snapshotRef);
});

test('IES012-WP3-ACC9: ontology registration covers 8 dimensions (CSIP-compatible)', () => {
  const meta = UTILITIES_ONTOLOGY_METADATA;
  const dims = ['Conviction', 'Confidence', 'Quality', 'Growth', 'Risk', 'Valuation', 'Capital Efficiency', 'Moat'];
  const mapped = Object.values(meta);
  for (const d of dims) assert.ok(mapped.includes(d), `missing ${d}`);
  assert.equal(mapped.length, 8);
});

test('IES012-WP3-ACC10: full engine replay-deterministic via shared services', () => {
  const run = () => execute(golden.providers[0]);
  const a = run();
  const b = run();
  assert.equal(a.result.state, 'COMPLETED');
  assert.equal(JSON.stringify(a.result.metadata), JSON.stringify(b.result.metadata));
});
