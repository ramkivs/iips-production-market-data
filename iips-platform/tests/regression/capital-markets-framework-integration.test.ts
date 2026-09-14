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
import { CapitalMarketsEngine, CAPITAL_MARKETS_ENGINE_ID } from '../../src/sector-engines/capital-markets/CapitalMarketsEngine';
import { BankingEngine, BANKING_ENGINE_ID } from '../../src/sector-engines/banking/BankingEngine';
import { InsuranceEngine, INSURANCE_ENGINE_ID } from '../../src/sector-engines/insurance/InsuranceEngine';

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
  return { plugins, runtime, clock, evidence };
}

test('WP2-ACC1: capital markets manifest via shared ManifestLoader', () => {
  const engine = new CapitalMarketsEngine();
  const m = new ManifestLoader().load(engine.manifest);
  assert.equal(m.engineId, CAPITAL_MARKETS_ENGINE_ID);
  assert.equal(Object.isFrozen(m), true);
});

test('WP2-ACC2: capital markets evidence via shared EvidencePipeline', () => {
  const { evidence } = makeRuntime();
  const pkg = evidence.build({
    engineId: CAPITAL_MARKETS_ENGINE_ID, recommendation: 'Buy', compositeScore: 79.6, confidence: 0.8,
    keyMetrics: [{ id: 'CM-001', name: 'AUM', value: 5000 }],
    supportingScores: [{ id: 'franchise', name: 'Franchise', value: 90 }],
    calibrationVersion: '1.0.0', replayReference: 'snap',
    provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: 'IES-008 v1.0', snapshotId: 's1' },
  });
  assert.equal(evidence.validate(pkg), true);
});

test('WP2-ACC3: capital markets transport via shared generic DTO', () => {
  const { clock } = makeRuntime();
  const t = new Transport(clock);
  const dto = t.build(CAPITAL_MARKETS_ENGINE_ID, [
    { sectorId: 'SEC-CM', sectorFamily: 'Capital Markets', companyName: 'Alpha', metrics: { 'CM-001': 5000 }, scores: { franchise: 90 }, verdict: 'Buy' },
  ]);
  assert.equal(t.validate(dto), true);
  assert.equal(t.serialize(dto), t.serialize(dto));
});

test('WP2-ACC4: capital markets diagnostics + qualification + activation via shared framework', () => {
  const d = new DiagnosticsService();
  const q = new QualificationService();
  const a = new ActivationService();
  d.capture({ engineId: CAPITAL_MARKETS_ENGINE_ID, executionDurationMs: 3, registryVersions: { metric: '1.0' }, replayStatus: 'ok', transportStatus: 'ok', pluginPhase: 'Execution' });
  assert.equal(d.list()[0].engineId, CAPITAL_MARKETS_ENGINE_ID);
  const qual = q.qualify({ engineId: CAPITAL_MARKETS_ENGINE_ID, certified: true, replayVerified: true, regressionPassed: true, deterministic: true });
  assert.equal(qual.qualified, true);
  assert.equal(a.activate(CAPITAL_MARKETS_ENGINE_ID, qual.qualified)?.toState, 'ACTIVE');
});

test('WP2-ACC5: THREE sectors coexist through the same framework without branching', () => {
  const { plugins, runtime } = makeRuntime();
  plugins.load(new BankingEngine());
  plugins.load(new InsuranceEngine());
  plugins.load(new CapitalMarketsEngine());
  plugins.initialize(BANKING_ENGINE_ID);
  plugins.initialize(INSURANCE_ENGINE_ID);
  plugins.initialize(CAPITAL_MARKETS_ENGINE_ID);
  assert.equal(plugins.size, 3);
  const bk = runtime.execute(BANKING_ENGINE_ID, { requestId: 'bk', inputs: { 'BM-001': 1.6, 'BM-002': 15, 'BM-003': 3.9, 'BM-004': 46, 'BM-005': 1.4, 'BM-006': 0.5, 'BM-014': 14, 'BM-015': 17 } });
  const in2 = runtime.execute(INSURANCE_ENGINE_ID, { requestId: 'in', inputs: { 'IM-001': 92, 'IM-002': 1.7, 'IM-003': 1800, 'IM-004': 300, 'IM-005': 88 } });
  const cm = runtime.execute(CAPITAL_MARKETS_ENGINE_ID, { requestId: 'cm', inputs: {} });
  assert.equal(bk.result.state, 'COMPLETED');
  assert.equal(in2.result.state, 'COMPLETED');
  assert.equal(cm.result.state, 'COMPLETED');
});
