/**
 * IES-006.2A WP-1 - Platform Reuse Verification (Banking).
 * Proves sector.banking is hosted by the existing platform runtime with zero platform
 * changes: governed plugin lifecycle, shared snapshot + replay services, coexistence with
 * another sector plugin, and participation in the six frozen registry kinds.
 * Tier-2 regression evidence (A2->A1). Reference assets are the oracle; no engine changes.
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
import { RegistryManager } from '../../src/registry/RegistryManager';
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
  return { container, plugins, runtime, store, replay, evidence };
}

test('WP1-ACC1: sector.banking registers + executes through the existing runtime', () => {
  const { plugins, runtime } = makeRuntime();
  const engine = new BankingEngine();
  assert.equal(engine.identity.engineId, BANKING_ENGINE_ID);
  assert.equal(plugins.load(engine), true);
  assert.equal(plugins.has(BANKING_ENGINE_ID), true);
  assert.equal(plugins.initialize(BANKING_ENGINE_ID), true);
  const r = runtime.execute(BANKING_ENGINE_ID, { requestId: 'bk-r1', inputs: BANK_INPUT });
  assert.equal(r.result.state, 'COMPLETED');
  assert.equal(runtime.getState(), 'COMPLETED');
  assert.ok(r.result.snapshotRef, 'snapshotRef must be present');
  assert.ok(r.result.evidenceRef, 'evidenceRef must be present');
  assert.equal(r.snapshotId, r.result.snapshotRef);
  assert.equal(r.result.metadata.verdict, 'Buy');
  assert.equal(r.result.metadata.composite, 72.2);
});

test('WP1-ACC2: banking follows the governed plugin lifecycle (Discovered -> Registration -> Initialization -> Execution -> Completion)', () => {
  const { plugins } = makeRuntime();
  const engine = new BankingEngine();
  assert.equal(plugins.phase(BANKING_ENGINE_ID), undefined);
  plugins.load(engine);
  assert.equal(plugins.phase(BANKING_ENGINE_ID), 'Registration');
  plugins.initialize(BANKING_ENGINE_ID);
  assert.equal(plugins.phase(BANKING_ENGINE_ID), 'Initialization');
  const r = plugins.execute(BANKING_ENGINE_ID, { requestId: 'bk-lc', inputs: BANK_INPUT });
  assert.equal(r?.state, 'COMPLETED');
  assert.equal(plugins.phase(BANKING_ENGINE_ID), 'Completion');
  // Duplicate registration is rejected by the loader (no engine-side branching).
  assert.equal(plugins.load(new BankingEngine()), false);
  assert.equal(plugins.size, 1);
});

test('WP1-ACC3: banking produces snapshots + replays via shared services', () => {
  const { plugins, runtime, store, replay } = makeRuntime();
  plugins.load(new BankingEngine());
  plugins.initialize(BANKING_ENGINE_ID);
  const r = runtime.execute(BANKING_ENGINE_ID, { requestId: 'bk-snap', inputs: BANK_INPUT });
  assert.equal(store.size, 1);
  const snap = store.get(r.result.snapshotRef as string);
  assert.ok(snap, 'snapshot must be stored by the shared SnapshotStore');
  assert.equal(Object.isFrozen(snap), true);
  assert.equal(snap.engineId, BANKING_ENGINE_ID);
  assert.equal(snap.verdict, 'Buy');
  assert.equal(snap.metrics['BM-001'], 1.6);
  assert.equal(snap.scores['asset-quality'], 75);
  const rr = replay.replay(snap.snapshotId);
  assert.equal(rr?.reproduced, true);
  assert.equal(rr?.byteIdentical, true);
  const viaRuntime = runtime.replay(snap.snapshotId);
  assert.equal(viaRuntime?.snapshotId, snap.snapshotId);
  assert.equal(runtime.getState(), 'COMPLETED');
});

test('WP1-ACC4: banking coexists with another sector plugin in the same runtime', () => {
  const { plugins, runtime, store } = makeRuntime();
  plugins.load(new BankingEngine());
  plugins.load(new InsuranceEngine());
  plugins.initialize(BANKING_ENGINE_ID);
  plugins.initialize(INSURANCE_ENGINE_ID);
  assert.equal(plugins.size, 2);
  assert.deepEqual(plugins.list().sort(), [BANKING_ENGINE_ID, INSURANCE_ENGINE_ID].sort());
  const bank = runtime.execute(BANKING_ENGINE_ID, { requestId: 'bk', inputs: BANK_INPUT });
  const ins = runtime.execute(INSURANCE_ENGINE_ID, { requestId: 'in', inputs: {} });
  assert.equal(bank.result.state, 'COMPLETED');
  assert.equal(ins.result.state, 'COMPLETED');
  assert.equal(store.size, 2);
  assert.equal(store.get(bank.result.snapshotRef as string)?.engineId, BANKING_ENGINE_ID);
  assert.equal(store.get(ins.result.snapshotRef as string)?.engineId, INSURANCE_ENGINE_ID);
});

test('WP1-ACC5: banking participates in registries (no new registry kind)', () => {
  const rm = new RegistryManager();
  rm.register('metric', { id: 'BM-001', name: 'Return on Assets', version: '1.0' });
  rm.register('metric', { id: 'BM-005', name: 'Gross NPA', version: '1.0' });
  rm.register('score', { id: 'asset-quality', name: 'Asset Quality', version: '1.0' });
  assert.equal(rm.has('metric', 'BM-001'), true);
  assert.equal(rm.has('metric', 'BM-005'), true);
  assert.equal(rm.has('score', 'asset-quality'), true);
  assert.equal(rm.size('metric'), 2);
  // Six registry kinds unchanged (no banking-specific kind added).
  assert.deepEqual(Object.keys(rm.versions()).sort(), ['formula', 'metric', 'score', 'snapshot', 'taxonomy', 'transport']);
});

test('WP1-ACC6: unknown engine is rejected by the shared runtime (fail-closed hosting)', () => {
  const { plugins, runtime } = makeRuntime();
  plugins.load(new BankingEngine());
  plugins.initialize(BANKING_ENGINE_ID);
  assert.throws(() => runtime.execute('sector.does-not-exist', { requestId: 'x', inputs: {} }), /Unknown engine/);
  assert.equal(runtime.getState(), 'FAILED');
});
