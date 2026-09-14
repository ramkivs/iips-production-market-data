/**
 * IES-010 WP-2 — Framework Integration.
 * Proves Hospitality integrates through all shared framework services unchanged (manifest,
 * evidence, transport, diagnostics, qualification, activation, replay), coexists as a sixth
 * plugin with the four sector engines + CSIP, and preserves replay determinism.
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
import { HospitalityEngine, HOSPITALITY_ENGINE_ID } from '../../src/sector-engines/hospitality/HospitalityEngine';
import { BankingEngine, BANKING_ENGINE_ID } from '../../src/sector-engines/banking/BankingEngine';
import { InsuranceEngine, INSURANCE_ENGINE_ID } from '../../src/sector-engines/insurance/InsuranceEngine';
import { CapitalMarketsEngine, CAPITAL_MARKETS_ENGINE_ID } from '../../src/sector-engines/capital-markets/CapitalMarketsEngine';
import { HealthcareEngine, HEALTHCARE_ENGINE_ID } from '../../src/sector-engines/healthcare/HealthcareEngine';
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

test('IES010-WP2-ACC1: hospitality manifest via shared ManifestLoader', () => {
  const engine = new HospitalityEngine();
  const m = new ManifestLoader().load(engine.manifest);
  assert.equal(m.engineId, HOSPITALITY_ENGINE_ID);
  assert.equal(Object.isFrozen(m), true);
  assert.ok(m.capabilities.includes('calibration'));
});

test('IES010-WP2-ACC2: hospitality evidence via shared EvidencePipeline', () => {
  const { evidence } = makeRuntime();
  const pkg = evidence.build({
    engineId: HOSPITALITY_ENGINE_ID, recommendation: 'Buy', compositeScore: 78.6, confidence: 0.8,
    supportingScores: [{ id: 'occupancy', name: 'Occupancy', value: 68 }],
    calibrationVersion: 'hospitality-calibration-1.0.0', replayReference: 'snap',
    provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: 'IES-010 v1.0', snapshotId: 's1' },
  });
  assert.equal(evidence.validate(pkg), true);
});

test('IES010-WP2-ACC3: hospitality transport via shared generic DTO', () => {
  const { clock } = makeRuntime();
  const t = new Transport(clock);
  const dto = t.build(HOSPITALITY_ENGINE_ID, [
    { sectorId: 'SEC-HP', sectorFamily: 'Hospitality', companyName: 'Asset-light Mixed', metrics: { revpar: 5440, occupancy: 68 }, scores: { composite: 78.6 }, verdict: 'Buy' },
  ]);
  assert.equal(t.validate(dto), true);
  assert.equal(t.serialize(dto), t.serialize(dto));
});

test('IES010-WP2-ACC4: hospitality diagnostics + qualification + activation via shared framework', () => {
  const d = new DiagnosticsService();
  const q = new QualificationService();
  const a = new ActivationService();
  d.capture({ engineId: HOSPITALITY_ENGINE_ID, executionDurationMs: 3, registryVersions: { transport: '1.0' }, replayStatus: 'ok', transportStatus: 'ok', pluginPhase: 'Execution' });
  assert.equal(d.list()[0].engineId, HOSPITALITY_ENGINE_ID);
  const qual = q.qualify({ engineId: HOSPITALITY_ENGINE_ID, certified: true, replayVerified: true, regressionPassed: true, deterministic: true });
  assert.equal(qual.qualified, true);
  assert.equal(a.activate(HOSPITALITY_ENGINE_ID, qual.qualified)?.toState, 'ACTIVE');
});

test('IES010-WP2-ACC5: hospitality produces replay-compatible evidence + snapshot via shared services', () => {
  const { plugins, runtime } = makeRuntime();
  plugins.load(new HospitalityEngine());
  plugins.initialize(HOSPITALITY_ENGINE_ID);
  const r = runtime.execute(HOSPITALITY_ENGINE_ID, { requestId: 'hp-ev', inputs: { businessModel: 'asset-light', occupancy: 68, adr: 8000, revpar: 5440, revparGrowth: 8, gopMargin: 28, ebitdaMargin: 30, feeMix: 55, demandQualityMix: 68, debtEbitda: 2.8, roic: 15 } });
  assert.equal(r.result.state, 'COMPLETED');
  assert.ok(r.result.evidenceRef);
});

test('IES010-WP2-ACC6: SIX plugins coexist through the same framework without branching', () => {
  const { plugins, runtime, store } = makeRuntime();
  plugins.load(new BankingEngine());
  plugins.load(new InsuranceEngine());
  plugins.load(new CapitalMarketsEngine());
  plugins.load(new HealthcareEngine());
  plugins.load(new CrossSectorPlugin());
  plugins.load(new HospitalityEngine());
  plugins.initialize(BANKING_ENGINE_ID);
  plugins.initialize(INSURANCE_ENGINE_ID);
  plugins.initialize(CAPITAL_MARKETS_ENGINE_ID);
  plugins.initialize(HEALTHCARE_ENGINE_ID);
  plugins.initialize(CROSS_SECTOR_PLUGIN_ID);
  plugins.initialize(HOSPITALITY_ENGINE_ID);
  assert.equal(plugins.size, 6);

  runtime.execute(BANKING_ENGINE_ID, { requestId: 'bk', inputs: { 'BM-001': 1.6, 'BM-002': 15, 'BM-003': 3.9, 'BM-004': 46, 'BM-005': 1.4, 'BM-006': 0.5, 'BM-014': 14, 'BM-015': 17 } });
  runtime.execute(INSURANCE_ENGINE_ID, { requestId: 'in', inputs: { 'IM-001': 92, 'IM-002': 1.7, 'IM-003': 1800, 'IM-004': 300, 'IM-005': 88 } });
  runtime.execute(CAPITAL_MARKETS_ENGINE_ID, { requestId: 'cm', inputs: {} });
  runtime.execute(HEALTHCARE_ENGINE_ID, { requestId: 'hc', inputs: {} });
  runtime.execute(CROSS_SECTOR_PLUGIN_ID, { requestId: 'csip', inputs: { portfolioId: 'PF-05', scenario: 'Balanced', strategy: 'Balanced', outputs: [] } });
  const hp = runtime.execute(HOSPITALITY_ENGINE_ID, { requestId: 'hp', inputs: { businessModel: 'owned', occupancy: 78, adr: 12000, revpar: 9360, revparGrowth: 12, gopMargin: 40, ebitdaMargin: 32, feeMix: 10, demandQualityMix: 70, debtEbitda: 3.0, roic: 12 } });

  assert.equal(hp.result.state, 'COMPLETED');
  assert.ok(hp.result.evidenceRef);
  assert.equal(store.size, 6);
});

test('IES010-WP2-ACC7: hospitality replay determinism (identical metadata + evidence across independent runs)', () => {
  const run = () => {
    const { plugins, runtime } = makeRuntime();
    plugins.load(new HospitalityEngine());
    plugins.initialize(HOSPITALITY_ENGINE_ID);
    return runtime.execute(HOSPITALITY_ENGINE_ID, { requestId: 'hp-replay', inputs: { businessModel: 'franchised', occupancy: 65, adr: 7000, revpar: 4550, revparGrowth: 14, gopMargin: 40, ebitdaMargin: 45, feeMix: 70, demandQualityMix: 65, debtEbitda: 2.0, roic: 25 } });
  };
  const a = run();
  const b = run();
  assert.deepEqual(a.result.metadata, b.result.metadata);
  assert.equal(a.result.evidenceRef, b.result.evidenceRef);
});
