/**
 * IES-006.2A WP-2 - Framework Integration (Banking).
 * Proves sector.banking consumes the shared framework services without any sector-specific
 * branching: ManifestLoader, EvidencePipeline, Transport DTO, DiagnosticsService,
 * QualificationService, ActivationService, and coexistence with another sector engine.
 * Tier-2 regression evidence (A2->A1). No engine or framework changes.
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
import { BankingEngine, BANKING_ENGINE_ID } from '../../src/sector-engines/banking/BankingEngine';
import { InsuranceEngine, INSURANCE_ENGINE_ID } from '../../src/sector-engines/insurance/InsuranceEngine';

const BANK_INPUT = { 'BM-001': 1.6, 'BM-002': 15, 'BM-003': 3.9, 'BM-004': 46, 'BM-005': 1.4, 'BM-006': 0.5, 'BM-014': 14, 'BM-015': 17 };

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

test('WP2-ACC1: banking manifest loaded through shared ManifestLoader', () => {
  const engine = new BankingEngine();
  const loader = new ManifestLoader();
  assert.equal(loader.validate(engine.manifest), true);
  const manifest = loader.load(engine.manifest);
  assert.equal(manifest.engineId, BANKING_ENGINE_ID);
  assert.equal(manifest.sectorFamily, 'Banking');
  assert.equal(manifest.engineVersion, '1.0.0');
  assert.deepEqual([...manifest.capabilities], ['metrics', 'scoring', 'calibration', 'decision', 'evidence']);
  assert.equal(manifest.compatibility.framework, '1.0');
  assert.equal(manifest.compatibility.methodology, 'IES-006 v1.0');
  assert.equal(Object.isFrozen(manifest), true);
  assert.equal(Object.isFrozen(manifest.capabilities), true);
});

test('WP2-ACC2: banking evidence produced through shared EvidencePipeline', () => {
  const { evidence } = makeRuntime();
  const pkg = evidence.build({
    engineId: BANKING_ENGINE_ID,
    recommendation: 'Buy',
    compositeScore: 72.2,
    confidence: 0.8,
    keyMetrics: [{ id: 'BM-001', name: 'Return on Assets', value: 1.6 }],
    supportingScores: [{ id: 'asset-quality', name: 'Asset Quality', value: 75 }],
    calibrationVersion: '1.0.0',
    replayReference: 'snap',
    provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: 'IES-006 v1.0', snapshotId: 's1' },
  });
  assert.equal(evidence.validate(pkg), true);
  assert.equal(pkg.engineId, BANKING_ENGINE_ID);
  assert.equal(pkg.calibrationVersion, '1.0.0');
  assert.equal(Object.isFrozen(pkg), true);
  assert.equal(Object.isFrozen(pkg.provenance), true);
});

test('WP2-ACC3: banking transport via shared generic DTO', () => {
  const { clock } = makeRuntime();
  const transport = new Transport(clock);
  const dto = transport.build(BANKING_ENGINE_ID, [
    { sectorId: 'SEC-BK', sectorFamily: 'Banking', companyName: 'Private-Bank-Beta', metrics: { 'BM-001': 1.6 }, scores: { 'asset-quality': 75 }, verdict: 'Buy' },
  ]);
  assert.equal(transport.validate(dto), true);
  assert.equal(dto.metadata.engineId, BANKING_ENGINE_ID);
  assert.equal(transport.serialize(dto), transport.serialize(dto));
  assert.equal(transport.checksum(dto), transport.checksum(dto));
  assert.equal(dto.rows.length, 1);
});

test('WP2-ACC4: banking diagnostics + qualification + activation via shared framework', () => {
  const diagnostics = new DiagnosticsService();
  const qualification = new QualificationService();
  const activation = new ActivationService();

  diagnostics.capture({ engineId: BANKING_ENGINE_ID, executionDurationMs: 4, registryVersions: { metric: '1.0' }, replayStatus: 'ok', transportStatus: 'ok', pluginPhase: 'Execution' });
  assert.equal(diagnostics.list().length, 1);
  assert.equal(diagnostics.list()[0].engineId, BANKING_ENGINE_ID);

  const qual = qualification.qualify({ engineId: BANKING_ENGINE_ID, certified: true, replayVerified: true, regressionPassed: true, deterministic: true });
  assert.equal(qual.qualified, true);

  const act = activation.activate(BANKING_ENGINE_ID, qual.qualified);
  assert.equal(act?.toState, 'ACTIVE');
  assert.equal(activation.getState(BANKING_ENGINE_ID), 'ACTIVE');

  // Qualification failure blocks activation (shared gate, no sector branch).
  const bad = qualification.qualify({ engineId: BANKING_ENGINE_ID, certified: true, replayVerified: false, regressionPassed: true, deterministic: true });
  assert.equal(bad.qualified, false);
});

test('WP2-ACC5: banking end-to-end through shared runtime yields snapshot + evidence refs', () => {
  const { plugins, runtime, store, replay } = makeRuntime();
  plugins.load(new BankingEngine());
  plugins.initialize(BANKING_ENGINE_ID);
  const r = runtime.execute(BANKING_ENGINE_ID, { requestId: 'bk-e2e', inputs: BANK_INPUT });
  assert.equal(r.result.state, 'COMPLETED');
  assert.equal(store.size, 1);
  assert.ok(r.result.snapshotRef);
  assert.ok(r.result.evidenceRef);
  assert.equal(r.result.metadata.evidenceId, r.result.evidenceRef);
  assert.equal(replay.replay(r.result.snapshotRef as string)?.reproduced, true);
});

test('WP2-ACC6: banking + insurance coexist through the same framework services without branching', () => {
  const { plugins, runtime, store } = makeRuntime();
  plugins.load(new BankingEngine());
  plugins.load(new InsuranceEngine());
  plugins.initialize(BANKING_ENGINE_ID);
  plugins.initialize(INSURANCE_ENGINE_ID);
  assert.equal(plugins.size, 2);

  const bank = runtime.execute(BANKING_ENGINE_ID, { requestId: 'bk', inputs: BANK_INPUT });
  const ins = runtime.execute(INSURANCE_ENGINE_ID, { requestId: 'in', inputs: {} });
  assert.equal(bank.result.state, 'COMPLETED');
  assert.equal(ins.result.state, 'COMPLETED');
  assert.equal(store.size, 2);
  assert.notEqual(bank.result.snapshotRef, ins.result.snapshotRef);
});
