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

function makeEngine(id: string): SectorPlugin {
  return {
    identity: { engineId: id, sectorFamily: 'Test', engineVersion: '1.0.0', secVersion: '1.0', semcVersion: '1.0' },
    manifest: { engineId: id, sectorFamily: 'Test', engineVersion: '1.0.0', capabilities: ['run'], compatibility: { framework: '1.0' } },
    onDiscover() {},
    onRegister() { return true; },
    onInitialize() {},
    execute(_ctx, req) { return { state: 'COMPLETED', metadata: { requestId: req.requestId } }; },
    onComplete() {},
  };
}

function makeCoordinator() {
  const clock = createClock('fixed');
  const id = createIdProvider('deterministic');
  const container = new Container({ clock, idProvider: id });
  const plugins = new PluginLoader(container);
  const snapService = new SnapshotService(clock, id);
  const store = new SnapshotStore();
  const replay = new ReplayService(store);
  const runtime = new RuntimeCoordinator(container, plugins, snapService, store, replay);
  return { runtime, plugins, store };
}

test('runtime coordinator drives full lifecycle + snapshot', () => {
  const { runtime, plugins, store } = makeCoordinator();
  plugins.load(makeEngine('banking'));
  plugins.initialize('banking');
  runtime.initialize();
  assert.equal(runtime.getState(), 'INITIALIZED');

  const { result } = runtime.execute('banking', { requestId: 'r1', inputs: {} });
  assert.equal(result.state, 'COMPLETED');
  assert.equal(runtime.getState(), 'COMPLETED');

  const snap = runtime.recordSnapshot('banking', { ROA: 1.5 }, { Quality: 80 }, 'Buy');
  assert.equal(store.size, 1);
  assert.equal(snap.verdict, 'Buy');

  const r = runtime.replay(snap.snapshotId);
  assert.equal(r?.byteIdentical, true);
});

test('runtime throws for unknown engine', () => {
  const { runtime } = makeCoordinator();
  assert.throws(() => runtime.execute('nope', { requestId: 'x', inputs: {} }), /Unknown engine/);
});
