/**
 * IES-010 WP-3 — Hospitality Engine acceptance.
 * Reproduces the 9 frozen expected outputs (hospitality-expected-outputs-1.0.0.json) from
 * the golden dataset, and exercises metrics/scoring/calibration/decision/overrides/evidence/
 * ontology registration deterministically.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { HospitalityEngine, HOSPITALITY_ENGINE_ID, HOSPITALITY_ONTOLOGY_METADATA } from '../../src/sector-engines/hospitality/HospitalityEngine';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';

const ASSET_DIR = path.resolve(__dirname, '../../src/sector-engines/hospitality/');
const golden = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'hospitality-golden-reference-1.0.0.json'), 'utf8'));
const expected = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, 'hospitality-expected-outputs-1.0.0.json'), 'utf8'));

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
  plugins.load(new HospitalityEngine());
  plugins.initialize(HOSPITALITY_ENGINE_ID);
  return runtime.execute(HOSPITALITY_ENGINE_ID, { requestId: 'hp-acc', inputs: input as never });
}

test('IES010-WP3-ACC1: all 9 frozen expected outputs reproduced exactly (golden regression)', () => {
  for (const p of golden.providers) {
    const r = execute({
      businessModel: p.businessModel,
      occupancy: p.occupancy, adr: p.adr, revpar: p.revpar, revparGrowth: p.revparGrowth,
      gopMargin: p.gopMargin, ebitdaMargin: p.ebitdaMargin, feeMix: p.feeMix,
      demandQualityMix: p.demandQualityMix, debtEbitda: p.debtEbitda, roic: p.roic,
      demandShock: p.demandShock, occupancyCollapse: p.occupancyCollapse,
      brandDeterioration: p.brandDeterioration, governance: p.governance,
    });
    const exp = expected.expected.find((e: { providerId: string }) => e.providerId === p.id);
    assert.equal(r.result.state, 'COMPLETED', `${p.id} state`);
    assert.equal(r.result.metadata.composite, exp.composite, `${p.id} composite`);
    assert.equal(r.result.metadata.verdict, exp.verdict, `${p.id} verdict`);
  }
});

test('IES010-WP3-ACC2: override precedence applied deterministically (D10)', () => {
  // HP-008 brand deterioration → Avoid even though composite 73.0 (would be Buy).
  const brand = execute({ businessModel: 'franchised', occupancy: 62, adr: 6500, revpar: 4030, revparGrowth: 4, gopMargin: 35, ebitdaMargin: 40, feeMix: 65, demandQualityMix: 55, debtEbitda: 2.5, roic: 20, brandDeterioration: true });
  assert.equal(brand.result.metadata.verdict, 'Avoid');
  assert.ok(brand.result.metadata.overridesApplied.includes('brand-deterioration'));

  // HP-009 occupancy collapse → Avoid.
  const occ = execute({ businessModel: 'owned', occupancy: 35, adr: 5000, revpar: 1750, revparGrowth: -35, gopMargin: 5, ebitdaMargin: 3, feeMix: 5, demandQualityMix: 45, debtEbitda: 6.5, roic: 1, occupancyCollapse: true });
  assert.equal(occ.result.metadata.verdict, 'Avoid');
  assert.ok(occ.result.metadata.overridesApplied.includes('occupancy-collapse'));

  // HP-007 demand shock → Watch.
  const shock = execute({ businessModel: 'asset-light', occupancy: 45, adr: 6000, revpar: 2700, revparGrowth: -20, gopMargin: 12, ebitdaMargin: 10, feeMix: 50, demandQualityMix: 50, debtEbitda: 3.2, roic: 5, demandShock: true });
  assert.equal(shock.result.metadata.verdict, 'Watch');
  assert.ok(shock.result.metadata.overridesApplied.includes('demand-shock'));
});

test('IES010-WP3-ACC3: business-model calibration isolates pillar weights', () => {
  // Same-ish fundamentals, different business model → different composite (calibration isolation).
  const owned = execute({ businessModel: 'owned', occupancy: 75, adr: 8500, revpar: 6375, revparGrowth: 7, gopMargin: 30, ebitdaMargin: 24, feeMix: 8, demandQualityMix: 60, debtEbitda: 3.5, roic: 10 });
  const managed = execute({ businessModel: 'managed', occupancy: 75, adr: 8500, revpar: 6375, revparGrowth: 7, gopMargin: 30, ebitdaMargin: 24, feeMix: 8, demandQualityMix: 60, debtEbitda: 3.5, roic: 10 });
  assert.notEqual(owned.result.metadata.composite, managed.result.metadata.composite);
});

test('IES010-WP3-ACC4: ontology registration covers 8 dimensions (CSIP-compatible)', () => {
  const meta = HOSPITALITY_ONTOLOGY_METADATA;
  const dims = ['Conviction', 'Confidence', 'Quality', 'Growth', 'Risk', 'Valuation', 'Capital Efficiency', 'Moat'];
  const mapped = Object.values(meta);
  for (const d of dims) assert.ok(mapped.includes(d), `missing ${d}`);
  assert.equal(mapped.length, 8);
});

test('IES010-WP3-ACC5: full engine is replay-deterministic via shared services', () => {
  const run = () => execute({ businessModel: 'asset-light', occupancy: 68, adr: 8000, revpar: 5440, revparGrowth: 8, gopMargin: 28, ebitdaMargin: 30, feeMix: 55, demandQualityMix: 68, debtEbitda: 2.8, roic: 15 });
  const a = run();
  const b = run();
  assert.equal(a.result.state, 'COMPLETED');
  assert.ok(a.result.evidenceRef);
  assert.equal(JSON.stringify(a.result.metadata), JSON.stringify(b.result.metadata));
});
