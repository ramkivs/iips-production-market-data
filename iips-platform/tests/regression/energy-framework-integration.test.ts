/**
 * IES-011 WP-2 — Framework Integration.
 * Proves Energy integrates through all shared framework services unchanged, coexists as a
 * seventh plugin, and preserves replay determinism.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';
import { ManifestLoader } from '../../src/framework/manifest/ManifestLoader';
import { Transport } from '../../src/framework/transport/Transport';
import { DiagnosticsService } from '../../src/framework/diagnostics/DiagnosticsService';
import { QualificationService } from '../../src/framework/qualification/QualificationService';
import { ActivationService } from '../../src/framework/activation/ActivationService';
import { EnergyEngine, ENERGY_ENGINE_ID } from '../../src/sector-engines/energy/EnergyEngine';
import { BankingEngine, BANKING_ENGINE_ID } from '../../src/sector-engines/banking/BankingEngine';
import { InsuranceEngine, INSURANCE_ENGINE_ID } from '../../src/sector-engines/insurance/InsuranceEngine';
import { CapitalMarketsEngine, CAPITAL_MARKETS_ENGINE_ID } from '../../src/sector-engines/capital-markets/CapitalMarketsEngine';
import { HealthcareEngine, HEALTHCARE_ENGINE_ID } from '../../src/sector-engines/healthcare/HealthcareEngine';
import { HospitalityEngine, HOSPITALITY_ENGINE_ID } from '../../src/sector-engines/hospitality/HospitalityEngine';
import { CrossSectorPlugin, CROSS_SECTOR_PLUGIN_ID } from '../../src/sector-engines/cross-sector/CrossSectorPlugin';

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
  return { plugins, runtime, clock, evidence, store, replay };
}

test('IES011-WP2-ACC1: energy manifest via shared ManifestLoader', () => {
  const engine = new EnergyEngine();
  const m = new ManifestLoader().load(engine.manifest);
  assert.equal(m.engineId, ENERGY_ENGINE_ID);
  assert.equal(Object.isFrozen(m), true);
  assert.ok(m.capabilities.includes('calibration'));
});

test('IES011-WP2-ACC2: energy evidence via shared EvidencePipeline', () => {
  const { evidence } = makeRuntime();
  const pkg = evidence.build({
    engineId: ENERGY_ENGINE_ID, recommendation: 'Buy', compositeScore: 76.4, confidence: 0.8,
    supportingScores: [{ id: 'productionGrowth', name: 'Production Growth', value: 8 }],
    calibrationVersion: 'energy-calibration-1.0.0', replayReference: 'snap',
    provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: 'IES-011 v1.0', snapshotId: 's1' },
  });
  assert.equal(evidence.validate(pkg), true);
});

test('IES011-WP2-ACC3: energy produces deterministic snapshot via shared Snapshot', () => {
  const { plugins, runtime, store } = makeRuntime();
  plugins.load(new EnergyEngine());
  plugins.initialize(ENERGY_ENGINE_ID);
  const r = runtime.execute(ENERGY_ENGINE_ID, { requestId: 'en-snap', inputs: { segment: 'upstream', commodityExposure: 'price-taker', productionGrowth: 8, liftingCost: 18, reserveReplacement: 1.3, ebitdaMargin: 45, revenueGrowth: 9, debtEbitda: 2.2, roce: 16, transitionMix: 5, fcfYield: 10, evEbitda: 4 } });
  assert.equal(r.result.state, 'COMPLETED');
  assert.equal(store.size, 1);
  assert.ok(r.result.snapshotRef);
});

test('IES011-WP2-ACC4: energy replay byte-identical via shared Replay', () => {
  const { plugins, runtime, replay } = makeRuntime();
  plugins.load(new EnergyEngine());
  plugins.initialize(ENERGY_ENGINE_ID);
  const snap = runtime.recordSnapshot(ENERGY_ENGINE_ID, { productionGrowth: 8 }, { ebitdaMargin: 45 }, 'ENERGY_SUMMARY');
  assert.equal(replay.replay(snap.snapshotId)?.reproduced, true);
});

test('IES011-WP2-ACC5: energy diagnostics via shared DiagnosticsService (observational)', () => {
  const d = new DiagnosticsService();
  d.capture({ engineId: ENERGY_ENGINE_ID, executionDurationMs: 3, registryVersions: { transport: '1.0' }, replayStatus: 'ok', transportStatus: 'ok', pluginPhase: 'Execution' });
  assert.equal(d.list()[0].engineId, ENERGY_ENGINE_ID);
});

test('IES011-WP2-ACC6: energy transport via shared generic DTO', () => {
  const { clock } = makeRuntime();
  const t = new Transport(clock);
  const dto = t.build(ENERGY_ENGINE_ID, [
    { sectorId: 'SEC-EN', sectorFamily: 'Energy', companyName: 'Upstream E&P', metrics: { productionGrowth: 8 }, scores: { composite: 76.4 }, verdict: 'Buy' },
  ]);
  assert.equal(t.validate(dto), true);
  assert.equal(t.serialize(dto), t.serialize(dto));
});

test('IES011-WP2-ACC7: energy qualification via shared QualificationService', () => {
  const q = new QualificationService();
  const qual = q.qualify({ engineId: ENERGY_ENGINE_ID, certified: true, replayVerified: true, regressionPassed: true, deterministic: true });
  assert.equal(qual.qualified, true);
});

test('IES011-WP2-ACC8: energy activation via shared ActivationService', () => {
  const q = new QualificationService();
  const a = new ActivationService();
  const qual = q.qualify({ engineId: ENERGY_ENGINE_ID, certified: true, replayVerified: true, regressionPassed: true, deterministic: true });
  assert.equal(a.activate(ENERGY_ENGINE_ID, qual.qualified)?.toState, 'ACTIVE');
});

test('IES011-WP2-ACC9: SEVEN plugins coexist through the same framework without branching', () => {
  const { plugins, runtime, store } = makeRuntime();
  plugins.load(new BankingEngine());
  plugins.load(new InsuranceEngine());
  plugins.load(new CapitalMarketsEngine());
  plugins.load(new HealthcareEngine());
  plugins.load(new HospitalityEngine());
  plugins.load(new CrossSectorPlugin());
  plugins.load(new EnergyEngine());
  plugins.initialize(BANKING_ENGINE_ID);
  plugins.initialize(INSURANCE_ENGINE_ID);
  plugins.initialize(CAPITAL_MARKETS_ENGINE_ID);
  plugins.initialize(HEALTHCARE_ENGINE_ID);
  plugins.initialize(HOSPITALITY_ENGINE_ID);
  plugins.initialize(CROSS_SECTOR_PLUGIN_ID);
  plugins.initialize(ENERGY_ENGINE_ID);
  assert.equal(plugins.size, 7);

  runtime.execute(BANKING_ENGINE_ID, { requestId: 'bk', inputs: { 'BM-001': 1.6, 'BM-002': 15, 'BM-003': 3.9, 'BM-004': 46, 'BM-005': 1.4, 'BM-006': 0.5, 'BM-014': 14, 'BM-015': 17 } });
  runtime.execute(INSURANCE_ENGINE_ID, { requestId: 'in', inputs: { 'IM-001': 92, 'IM-002': 1.7, 'IM-003': 1800, 'IM-004': 300, 'IM-005': 88 } });
  runtime.execute(CAPITAL_MARKETS_ENGINE_ID, { requestId: 'cm', inputs: {} });
  runtime.execute(HEALTHCARE_ENGINE_ID, { requestId: 'hc', inputs: {} });
  runtime.execute(HOSPITALITY_ENGINE_ID, { requestId: 'hp', inputs: { businessModel: 'owned', occupancy: 78, adr: 12000, revpar: 9360, revparGrowth: 12, gopMargin: 40, ebitdaMargin: 32, feeMix: 10, demandQualityMix: 70, debtEbitda: 3.0, roic: 12 } });
  runtime.execute(CROSS_SECTOR_PLUGIN_ID, { requestId: 'csip', inputs: { portfolioId: 'PF-05', scenario: 'Balanced', strategy: 'Balanced', outputs: [] } });
  const en = runtime.execute(ENERGY_ENGINE_ID, { requestId: 'en', inputs: { segment: 'upstream', commodityExposure: 'price-taker', productionGrowth: 8, liftingCost: 18, reserveReplacement: 1.3, ebitdaMargin: 45, revenueGrowth: 9, debtEbitda: 2.2, roce: 16, transitionMix: 5, fcfYield: 10, evEbitda: 4 } });

  assert.equal(en.result.state, 'COMPLETED');
  assert.ok(en.result.evidenceRef);
  assert.equal(store.size, 7);
});

test('IES011-WP2-ACC10: energy replay determinism (identical metadata + evidence across independent runs)', () => {
  const run = () => {
    const { plugins, runtime } = makeRuntime();
    plugins.load(new EnergyEngine());
    plugins.initialize(ENERGY_ENGINE_ID);
    return runtime.execute(ENERGY_ENGINE_ID, { requestId: 'en-replay', inputs: { segment: 'renewables', commodityExposure: 'contracted-revenue', productionGrowth: 25, liftingCost: 22, reserveReplacement: 1.0, ebitdaMargin: 50, revenueGrowth: 30, debtEbitda: 3.5, roce: 10, transitionMix: 90, fcfYield: 4, evEbitda: 12 } });
  };
  const a = run();
  const b = run();
  assert.equal(JSON.stringify(a.result.metadata), JSON.stringify(b.result.metadata));
  assert.equal(a.result.evidenceRef, b.result.evidenceRef);
});
