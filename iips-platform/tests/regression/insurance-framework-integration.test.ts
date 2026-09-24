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
import { InsuranceEngine, INSURANCE_ENGINE_ID } from '../../src/sector-engines/insurance/InsuranceEngine';
import { BankingEngine, BANKING_ENGINE_ID } from '../../src/sector-engines/banking/BankingEngine';

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
  return { container, plugins, runtime, store, replay, evidence, clock, id };
}

test('WP2-ACC1: insurance manifest loaded through shared ManifestLoader', () => {
  const { plugins } = makeRuntime();
  const engine = new InsuranceEngine();
  const loader = new ManifestLoader();
  const manifest = loader.load(engine.manifest);
  assert.equal(manifest.engineId, INSURANCE_ENGINE_ID);
  assert.equal(Object.isFrozen(manifest), true);
});

test('WP2-ACC2: insurance evidence produced through shared EvidencePipeline', () => {
  const { evidence } = makeRuntime();
  const pkg = evidence.build({
    engineId: INSURANCE_ENGINE_ID,
    recommendation: 'Buy',
    compositeScore: 72.3,
    confidence: 0.8,
    keyMetrics: [{ id: 'IM-001', name: 'Combined Ratio', value: 92 }],
    supportingScores: [{ id: 'underwriting', name: 'Underwriting', value: 66 }],
    calibrationVersion: '1.0.0',
    replayReference: 'snap',
    provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: 'IES-007 v1.0', snapshotId: 's1' },
  });
  assert.equal(evidence.validate(pkg), true);
  assert.equal(pkg.engineId, INSURANCE_ENGINE_ID);
});

test('WP2-ACC3: insurance transport via shared generic DTO', () => {
  const { clock } = makeRuntime();
  const transport = new Transport(clock);
  const dto = transport.build(INSURANCE_ENGINE_ID, [
    { sectorId: 'SEC-INS', sectorFamily: 'Insurance', companyName: 'Alpha', metrics: { 'IM-001': 92 }, scores: { underwriting: 66 }, verdict: 'Buy' },
  ]);
  assert.equal(transport.validate(dto), true);
  assert.equal(transport.serialize(dto), transport.serialize(dto));
  assert.equal(transport.checksum(dto), transport.checksum(dto));
});

test('WP2-ACC4: insurance diagnostics + qualification + activation via shared framework', () => {
  const diagnostics = new DiagnosticsService();
  const qualification = new QualificationService();
  const activation = new ActivationService();

  diagnostics.capture({ engineId: INSURANCE_ENGINE_ID, executionDurationMs: 4, registryVersions: { metric: '1.0' }, replayStatus: 'ok', transportStatus: 'ok', pluginPhase: 'Execution' });
  assert.equal(diagnostics.list()[0].engineId, INSURANCE_ENGINE_ID);

  const qual = qualification.qualify({ engineId: INSURANCE_ENGINE_ID, certified: true, replayVerified: true, regressionPassed: true, deterministic: true });
  assert.equal(qual.qualified, true);

  const act = activation.activate(INSURANCE_ENGINE_ID, qual.qualified);
  assert.equal(act?.toState, 'ACTIVE');
  assert.equal(activation.getState(INSURANCE_ENGINE_ID), 'ACTIVE');
});

test('WP2-ACC5: insurance + banking coexist through the same framework services without branching', () => {
  const { plugins, runtime } = makeRuntime();
  plugins.load(new InsuranceEngine());
  plugins.load(new BankingEngine());
  plugins.initialize(INSURANCE_ENGINE_ID);
  plugins.initialize(BANKING_ENGINE_ID);
  assert.equal(plugins.size, 2);

  const bank = runtime.execute(BANKING_ENGINE_ID, { requestId: 'bk', inputs: { 'BM-001': 1.6, 'BM-002': 15, 'BM-003': 3.9, 'BM-004': 46, 'BM-005': 1.4, 'BM-006': 0.5, 'BM-014': 14, 'BM-015': 17 } });
  const ins = runtime.execute(INSURANCE_ENGINE_ID, { requestId: 'in', inputs: {} });
  assert.equal(bank.result.state, 'COMPLETED');
  assert.equal(ins.result.state, 'COMPLETED');
});
