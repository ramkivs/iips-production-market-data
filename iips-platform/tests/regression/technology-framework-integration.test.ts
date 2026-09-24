/**
 * IES-015 WP-2 — Framework Integration.
 * Proves Technology integrates through all shared framework services unchanged, coexists as an
 * eleventh plugin, and preserves replay determinism.
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
import { TechnologyEngine, TECHNOLOGY_ENGINE_ID } from '../../src/sector-engines/technology/TechnologyEngine';
import { BankingEngine, BANKING_ENGINE_ID } from '../../src/sector-engines/banking/BankingEngine';
import { InsuranceEngine, INSURANCE_ENGINE_ID } from '../../src/sector-engines/insurance/InsuranceEngine';
import { CapitalMarketsEngine, CAPITAL_MARKETS_ENGINE_ID } from '../../src/sector-engines/capital-markets/CapitalMarketsEngine';
import { HealthcareEngine, HEALTHCARE_ENGINE_ID } from '../../src/sector-engines/healthcare/HealthcareEngine';
import { HospitalityEngine, HOSPITALITY_ENGINE_ID } from '../../src/sector-engines/hospitality/HospitalityEngine';
import { EnergyEngine, ENERGY_ENGINE_ID } from '../../src/sector-engines/energy/EnergyEngine';
import { UtilitiesEngine, UTILITIES_ENGINE_ID } from '../../src/sector-engines/utilities/UtilitiesEngine';
import { ConsumerEngine, CONSUMER_ENGINE_ID } from '../../src/sector-engines/consumer/ConsumerEngine';
import { IndustrialsEngine, INDUSTRIALS_ENGINE_ID } from '../../src/sector-engines/industrials/IndustrialsEngine';
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

test('IES015-WP2-ACC1: technology manifest via shared ManifestLoader', () => {
  const engine = new TechnologyEngine();
  const m = new ManifestLoader().load(engine.manifest);
  assert.equal(m.engineId, TECHNOLOGY_ENGINE_ID);
  assert.equal(Object.isFrozen(m), true);
  assert.ok(m.capabilities.includes('calibration'));
});

test('IES015-WP2-ACC2: technology evidence via shared EvidencePipeline', () => {
  const { evidence } = makeRuntime();
  const pkg = evidence.build({
    engineId: TECHNOLOGY_ENGINE_ID, recommendation: 'Buy', compositeScore: 76.3, confidence: 0.8,
    supportingScores: [{ id: 'revenueGrowth', name: 'Revenue Growth', value: 22 }],
    calibrationVersion: 'technology-calibration-1.0.0', replayReference: 'snap',
    provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: 'IES-015 v1.0', snapshotId: 's1' },
  });
  assert.equal(evidence.validate(pkg), true);
});

test('IES015-WP2-ACC3: technology deterministic snapshot via shared Snapshot', () => {
  const { plugins, runtime, store } = makeRuntime();
  plugins.load(new TechnologyEngine());
  plugins.initialize(TECHNOLOGY_ENGINE_ID);
  const r = runtime.execute(TECHNOLOGY_ENGINE_ID, { requestId: 'te-snap', inputs: { subsegment: 'software-saas', revenueGrowth: 22, grossMargin: 75 } });
  assert.equal(r.result.state, 'COMPLETED');
  assert.equal(store.size, 1);
  assert.ok(r.result.snapshotRef);
});

test('IES015-WP2-ACC4: technology replay byte-identical via shared Replay', () => {
  const { plugins, runtime, replay } = makeRuntime();
  plugins.load(new TechnologyEngine());
  plugins.initialize(TECHNOLOGY_ENGINE_ID);
  const snap = runtime.recordSnapshot(TECHNOLOGY_ENGINE_ID, { revenueGrowth: 22 }, { grossMargin: 75 }, 'TECHNOLOGY_SUMMARY');
  assert.equal(replay.replay(snap.snapshotId)?.reproduced, true);
});

test('IES015-WP2-ACC5: technology diagnostics via shared DiagnosticsService (observational)', () => {
  const d = new DiagnosticsService();
  d.capture({ engineId: TECHNOLOGY_ENGINE_ID, executionDurationMs: 3, registryVersions: { transport: '1.0' }, replayStatus: 'ok', transportStatus: 'ok', pluginPhase: 'Execution' });
  assert.equal(d.list()[0].engineId, TECHNOLOGY_ENGINE_ID);
});

test('IES015-WP2-ACC6: technology qualification via shared QualificationService', () => {
  const q = new QualificationService();
  const qual = q.qualify({ engineId: TECHNOLOGY_ENGINE_ID, certified: true, replayVerified: true, regressionPassed: true, deterministic: true });
  assert.equal(qual.qualified, true);
});

test('IES015-WP2-ACC7: technology activation via shared ActivationService', () => {
  const q = new QualificationService();
  const a = new ActivationService();
  const qual = q.qualify({ engineId: TECHNOLOGY_ENGINE_ID, certified: true, replayVerified: true, regressionPassed: true, deterministic: true });
  assert.equal(a.activate(TECHNOLOGY_ENGINE_ID, qual.qualified)?.toState, 'ACTIVE');
});

test('IES015-WP2-ACC8: technology transport via shared generic DTO', () => {
  const { clock } = makeRuntime();
  const t = new Transport(clock);
  const dto = t.build(TECHNOLOGY_ENGINE_ID, [
    { sectorId: 'SEC-TE', sectorFamily: 'Technology', companyName: 'SaaS Leader', metrics: { revenueGrowth: 22 }, scores: { composite: 76.3 }, verdict: 'Buy' },
  ]);
  assert.equal(t.validate(dto), true);
  assert.equal(t.serialize(dto), t.serialize(dto));
});

test('IES015-WP2-ACC9: ELEVEN plugins coexist through the same framework without branching', () => {
  const { plugins, runtime, store } = makeRuntime();
  plugins.load(new BankingEngine());
  plugins.load(new InsuranceEngine());
  plugins.load(new CapitalMarketsEngine());
  plugins.load(new HealthcareEngine());
  plugins.load(new HospitalityEngine());
  plugins.load(new EnergyEngine());
  plugins.load(new UtilitiesEngine());
  plugins.load(new ConsumerEngine());
  plugins.load(new IndustrialsEngine());
  plugins.load(new CrossSectorPlugin());
  plugins.load(new TechnologyEngine());
  plugins.initialize(BANKING_ENGINE_ID);
  plugins.initialize(INSURANCE_ENGINE_ID);
  plugins.initialize(CAPITAL_MARKETS_ENGINE_ID);
  plugins.initialize(HEALTHCARE_ENGINE_ID);
  plugins.initialize(HOSPITALITY_ENGINE_ID);
  plugins.initialize(ENERGY_ENGINE_ID);
  plugins.initialize(UTILITIES_ENGINE_ID);
  plugins.initialize(CONSUMER_ENGINE_ID);
  plugins.initialize(INDUSTRIALS_ENGINE_ID);
  plugins.initialize(CROSS_SECTOR_PLUGIN_ID);
  plugins.initialize(TECHNOLOGY_ENGINE_ID);
  assert.equal(plugins.size, 11);

  runtime.execute(BANKING_ENGINE_ID, { requestId: 'bk', inputs: { 'BM-001': 1.6, 'BM-002': 15, 'BM-003': 3.9, 'BM-004': 46, 'BM-005': 1.4, 'BM-006': 0.5, 'BM-014': 14, 'BM-015': 17 } });
  runtime.execute(INSURANCE_ENGINE_ID, { requestId: 'in', inputs: { 'IM-001': 92, 'IM-002': 1.7, 'IM-003': 1800, 'IM-004': 300, 'IM-005': 88 } });
  runtime.execute(CAPITAL_MARKETS_ENGINE_ID, { requestId: 'cm', inputs: {} });
  runtime.execute(HEALTHCARE_ENGINE_ID, { requestId: 'hc', inputs: {} });
  runtime.execute(HOSPITALITY_ENGINE_ID, { requestId: 'hp', inputs: { businessModel: 'owned', occupancy: 78, adr: 12000, revpar: 9360, revparGrowth: 12, gopMargin: 40, ebitdaMargin: 32, feeMix: 10, demandQualityMix: 70, debtEbitda: 3.0, roic: 12 } });
  runtime.execute(ENERGY_ENGINE_ID, { requestId: 'en', inputs: { segment: 'upstream', commodityExposure: 'price-taker', productionGrowth: 8, liftingCost: 18, reserveReplacement: 1.3, ebitdaMargin: 45, revenueGrowth: 9, debtEbitda: 2.2, roce: 16, transitionMix: 5, fcfYield: 10, evEbitda: 4 } });
  runtime.execute(UTILITIES_ENGINE_ID, { requestId: 'ut', inputs: { segment: 'regulated-electric', regulatoryPosture: 'constructive', rateBaseGrowth: 7, allowedRoe: 10, ffoDebt: 18, omEfficiency: 18, demandGrowth: 2, saidi: 90, transitionCapexIntensity: 30, ebitdaMargin: 42, revenueGrowth: 4, debtEbitda: 3.5, peRatio: 18, roe: 11 } });
  runtime.execute(CONSUMER_ENGINE_ID, { requestId: 'cs', inputs: { segment: 'staples', businessModel: 'branded', revenueGrowth: 4, priceContribution: 65, brandLoyalty: 85, marginResilience: 0.9, dtcShare: 20, fcfYield: 6, innovationIntensity: 10, privateLabelExposure: 10, ebitdaMargin: 22, debtEbitda: 2.2, peRatio: 20, roic: 16 } });
  runtime.execute(INDUSTRIALS_ENGINE_ID, { requestId: 'ind', inputs: { subsegment: 'capital-goods', archetype: 'oem', ebitdaMargin: 22, revenueGrowth: 8, debtEbitda: 2.0, evEbitda: 12, roce: 20, backlog: 2.5, bookToBill: 1.05, aftermarketShare: 30, fcfYield: 8, orderGrowth: 8, operatingMargin: 22, projectRiskExposure: 20 } });
  runtime.execute(CROSS_SECTOR_PLUGIN_ID, { requestId: 'csip', inputs: { portfolioId: 'PF-05', scenario: 'Balanced', strategy: 'Balanced', outputs: [] } });
  const te = runtime.execute(TECHNOLOGY_ENGINE_ID, { requestId: 'te', inputs: { subsegment: 'digital-platforms', revenueGrowth: 30, grossMargin: 72 } });

  assert.equal(te.result.state, 'COMPLETED');
  assert.ok(te.result.evidenceRef);
  assert.equal(store.size, 11);
});

test('IES015-WP2-ACC10: technology replay determinism (identical metadata + evidence across independent runs)', () => {
  const run = () => {
    const { plugins, runtime } = makeRuntime();
    plugins.load(new TechnologyEngine());
    plugins.initialize(TECHNOLOGY_ENGINE_ID);
    return runtime.execute(TECHNOLOGY_ENGINE_ID, { requestId: 'te-replay', inputs: { subsegment: 'cybersecurity', revenueGrowth: 18, grossMargin: 78 } });
  };
  const a = run();
  const b = run();
  assert.equal(JSON.stringify(a.result.metadata), JSON.stringify(b.result.metadata));
  assert.equal(a.result.evidenceRef, b.result.evidenceRef);
});
