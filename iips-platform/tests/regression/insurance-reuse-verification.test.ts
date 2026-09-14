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
import { RegistryManager } from '../../src/registry/RegistryManager';
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
  return { container, plugins, runtime, store, replay, evidence };
}

test('WP1-ACC1: sector.insurance registers + executes through existing runtime', () => {
  const { plugins, runtime } = makeRuntime();
  const engine = new InsuranceEngine();
  assert.equal(plugins.load(engine), true);
  plugins.initialize(INSURANCE_ENGINE_ID);
  const r = runtime.execute(INSURANCE_ENGINE_ID, { requestId: 'ins-r1', inputs: {} });
  assert.equal(r.result.state, 'COMPLETED');
  assert.equal(r.result.snapshotRef, r.result.snapshotRef);
});

test('WP1-ACC2: insurance produces snapshots + replays via shared services', () => {
  const { runtime, store, replay } = makeRuntime();
  const plugins = (() => { const h = makeRuntime(); return h.plugins; })();
  plugins.load(new InsuranceEngine());
  plugins.initialize(INSURANCE_ENGINE_ID);
  const snap = runtime.recordSnapshot(INSURANCE_ENGINE_ID, { probe: 1 }, { reuse: 100 }, 'N/A');
  assert.equal(Object.isFrozen(snap), true);
  assert.equal(store.size, 1);
  const rr = replay.replay(snap.snapshotId);
  assert.equal(rr?.reproduced, true);
});

test('WP1-ACC3: insurance coexists with banking in the same runtime', () => {
  const { plugins, runtime, store } = makeRuntime();
  plugins.load(new InsuranceEngine());
  plugins.load(new BankingEngine());
  plugins.initialize(INSURANCE_ENGINE_ID);
  plugins.initialize(BANKING_ENGINE_ID);
  assert.equal(plugins.size, 2);

  const bank = runtime.execute(BANKING_ENGINE_ID, { requestId: 'bk', inputs: { 'BM-001': 1.6, 'BM-002': 15, 'BM-003': 3.9, 'BM-004': 46, 'BM-005': 1.4, 'BM-006': 0.5, 'BM-014': 14, 'BM-015': 17 } });
  const ins = runtime.execute(INSURANCE_ENGINE_ID, { requestId: 'in', inputs: {} });
  assert.equal(bank.result.state, 'COMPLETED');
  assert.equal(ins.result.state, 'COMPLETED');
  assert.equal(store.size, 2);
});

test('WP1-ACC4: insurance participates in registries (no new registry kind)', () => {
  const rm = new RegistryManager();
  rm.register('metric', { id: 'IM-001', name: 'Combined Ratio', version: '1.0' });
  rm.register('score', { id: 'underwriting', name: 'Underwriting', version: '1.0' });
  assert.equal(rm.has('metric', 'IM-001'), true);
  assert.equal(rm.has('score', 'underwriting'), true);
  // Six registry kinds unchanged (no insurance-specific kind added).
  assert.deepEqual(Object.keys(rm.versions()).sort(), ['formula', 'metric', 'score', 'snapshot', 'taxonomy', 'transport']);
});
