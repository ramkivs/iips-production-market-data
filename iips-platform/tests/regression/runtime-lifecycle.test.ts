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
import { makeStubPlugin } from './helpers';

test('REGRESSION: runtime drives full lifecycle deterministically', () => {
  const clock = createClock('fixed');
  const id = createIdProvider('deterministic');
  const container = new Container({ clock, idProvider: id });
  const plugins = new PluginLoader(container);
  const snap = new SnapshotService(clock, id);
  const store = new SnapshotStore();
  const replay = new ReplayService(store);
  const runtime = new RuntimeCoordinator(container, plugins, snap, store, replay);

  plugins.load(makeStubPlugin('sector.banking', 'Banking'));
  plugins.initialize('sector.banking');
  runtime.initialize();
  assert.equal(runtime.getState(), 'INITIALIZED');
  const { result } = runtime.execute('sector.banking', { requestId: 'r1', inputs: {} });
  assert.equal(result.state, 'COMPLETED');
  assert.equal(runtime.getState(), 'COMPLETED');
});
