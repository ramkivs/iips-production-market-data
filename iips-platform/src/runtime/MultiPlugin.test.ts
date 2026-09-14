import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container } from '../di/Container';
import { createClock } from '../infrastructure/Clock';
import { createIdProvider } from '../infrastructure/IdProvider';
import { PluginLoader } from '../plugin-loader/PluginLoader';
import { SnapshotService } from '../snapshot/SnapshotService';
import { SnapshotStore } from '../snapshot/SnapshotStore';
import { ReplayService } from '../replay/ReplayService';
import { RuntimeCoordinator } from './RuntimeCoordinator';
import type { SectorPlugin } from '../plugin-loader/PluginContract';

/** Independent stub plugins for two different sector families. */
function makeStubPlugin(engineId: string, sectorFamily: string, tag: string): SectorPlugin {
  return {
    identity: { engineId, sectorFamily, engineVersion: '1.0.0', secVersion: '1.0', semcVersion: '1.0' },
    manifest: { engineId, sectorFamily, engineVersion: '1.0.0', capabilities: ['run'], compatibility: { framework: '1.0' } },
    onDiscover() {},
    onRegister() { return true; },
    onInitialize() {},
    execute(_ctx, req) {
      return { state: 'COMPLETED', metadata: { requestId: req.requestId, tag } };
    },
    onComplete() {},
  };
}

function makeRuntime() {
  const clock = createClock('fixed');
  const id = createIdProvider('deterministic');
  const container = new Container({ clock, idProvider: id });
  const plugins = new PluginLoader(container);
  const snap = new SnapshotService(clock, id);
  const store = new SnapshotStore();
  const replay = new ReplayService(store);
  const runtime = new RuntimeCoordinator(container, plugins, snap, store, replay);
  return { runtime, plugins, store };
}

test('two independent stub plugins coexist without runtime modification', () => {
  const { runtime, plugins, store } = makeRuntime();

  // Two different sector families (Banking + Insurance) hosted in the SAME runtime.
  plugins.load(makeStubPlugin('sector.banking', 'Banking', 'bank'));
  plugins.load(makeStubPlugin('sector.insurance', 'Insurance', 'ins'));
  plugins.initialize('sector.banking');
  plugins.initialize('sector.insurance');

  assert.equal(plugins.size, 2);
  assert.deepEqual(plugins.list().sort(), ['sector.banking', 'sector.insurance']);

  // Both execute through the same runtime, producing distinct results.
  const bank = runtime.execute('sector.banking', { requestId: 'b1', inputs: {} });
  const ins = runtime.execute('sector.insurance', { requestId: 'i1', inputs: {} });
  assert.equal(bank.result.metadata.tag, 'bank');
  assert.equal(ins.result.metadata.tag, 'ins');
  assert.equal(bank.result.state, 'COMPLETED');
  assert.equal(ins.result.state, 'COMPLETED');

  // Both can produce snapshots in the same store.
  const sb = runtime.recordSnapshot('sector.banking', { ROA: 1.5 }, { Q: 80 }, 'Buy');
  const si = runtime.recordSnapshot('sector.insurance', { COMBINED: 90 }, { Q: 75 }, 'Buy');
  assert.equal(store.size, 2);
  assert.equal(sb.engineId, 'sector.banking');
  assert.equal(si.engineId, 'sector.insurance');

  // Replay both.
  assert.equal(runtime.replay(sb.snapshotId)?.byteIdentical, true);
  assert.equal(runtime.replay(si.snapshotId)?.byteIdentical, true);
});
