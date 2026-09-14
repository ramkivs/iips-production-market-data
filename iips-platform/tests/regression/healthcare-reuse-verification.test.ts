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
import { HealthcareEngine, HEALTHCARE_ENGINE_ID } from '../../src/sector-engines/healthcare/HealthcareEngine';
import { BankingEngine, BANKING_ENGINE_ID } from '../../src/sector-engines/banking/BankingEngine';
import { InsuranceEngine, INSURANCE_ENGINE_ID } from '../../src/sector-engines/insurance/InsuranceEngine';
import { CapitalMarketsEngine, CAPITAL_MARKETS_ENGINE_ID } from '../../src/sector-engines/capital-markets/CapitalMarketsEngine';

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

test('WP1-ACC1: sector.healthcare registers + executes through existing runtime', () => {
  const { plugins, runtime } = makeRuntime();
  assert.equal(plugins.load(new HealthcareEngine()), true);
  plugins.initialize(HEALTHCARE_ENGINE_ID);
  const r = runtime.execute(HEALTHCARE_ENGINE_ID, { requestId: 'hc-r1', inputs: {} });
  assert.equal(r.result.state, 'COMPLETED');
});

test('WP1-ACC2: healthcare produces snapshots + replays via shared services', () => {
  const { plugins, runtime, store, replay } = makeRuntime();
  plugins.load(new HealthcareEngine());
  plugins.initialize(HEALTHCARE_ENGINE_ID);
  const snap = runtime.recordSnapshot(HEALTHCARE_ENGINE_ID, { probe: 1 }, { reuse: 100 }, 'N/A');
  assert.equal(Object.isFrozen(snap), true);
  assert.equal(store.size, 1);
  assert.equal(replay.replay(snap.snapshotId)?.reproduced, true);
});

test('WP1-ACC3: FOUR sectors coexist in the same runtime (Banking + Insurance + Capital Markets + Healthcare)', () => {
  const { plugins, runtime, store } = makeRuntime();
  plugins.load(new BankingEngine());
  plugins.load(new InsuranceEngine());
  plugins.load(new CapitalMarketsEngine());
  plugins.load(new HealthcareEngine());
  plugins.initialize(BANKING_ENGINE_ID);
  plugins.initialize(INSURANCE_ENGINE_ID);
  plugins.initialize(CAPITAL_MARKETS_ENGINE_ID);
  plugins.initialize(HEALTHCARE_ENGINE_ID);
  assert.equal(plugins.size, 4);

  runtime.execute(BANKING_ENGINE_ID, { requestId: 'bk', inputs: { 'BM-001': 1.6, 'BM-002': 15, 'BM-003': 3.9, 'BM-004': 46, 'BM-005': 1.4, 'BM-006': 0.5, 'BM-014': 14, 'BM-015': 17 } });
  runtime.execute(INSURANCE_ENGINE_ID, { requestId: 'in', inputs: { 'IM-001': 92, 'IM-002': 1.7, 'IM-003': 1800, 'IM-004': 300, 'IM-005': 88 } });
  runtime.execute(CAPITAL_MARKETS_ENGINE_ID, { requestId: 'cm', inputs: {} });
  const hc = runtime.execute(HEALTHCARE_ENGINE_ID, { requestId: 'hc', inputs: {} });
  assert.equal(hc.result.state, 'COMPLETED');
  assert.equal(store.size, 4);
});

test('WP1-ACC4: healthcare participates in registries (no new registry kind)', () => {
  const rm = new RegistryManager();
  rm.register('metric', { id: 'HC-001', name: 'Bed Occupancy', version: '1.0' });
  assert.equal(rm.has('metric', 'HC-001'), true);
  assert.deepEqual(Object.keys(rm.versions()).sort(), ['formula', 'metric', 'score', 'snapshot', 'taxonomy', 'transport']);
});
