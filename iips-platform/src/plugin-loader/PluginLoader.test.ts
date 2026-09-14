import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container } from '../di/Container';
import { createClock } from '../infrastructure/Clock';
import { createIdProvider } from '../infrastructure/IdProvider';
import { PluginLoader } from './PluginLoader';
import type { ExecutionRequest, SectorPlugin } from './PluginContract';

function makePlugin(id: string): SectorPlugin {
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

const container = () => new Container({ clock: createClock('fixed'), idProvider: createIdProvider('deterministic') });

test('plugin loader discovers, registers, initializes, executes, completes', () => {
  const loader = new PluginLoader(container());
  const p = makePlugin('engine-a');
  assert.equal(loader.load(p), true);
  assert.equal(loader.phase('engine-a'), 'Registration');
  assert.equal(loader.initialize('engine-a'), true);
  assert.equal(loader.phase('engine-a'), 'Initialization');
  const req: ExecutionRequest = { requestId: 'r1', inputs: {} };
  const r = loader.execute('engine-a', req);
  assert.equal(r?.state, 'COMPLETED');
  assert.equal(loader.phase('engine-a'), 'Completion');
  assert.equal(loader.size, 1);
});

test('plugin loader rejects duplicate engine', () => {
  const loader = new PluginLoader(container());
  loader.load(makePlugin('engine-a'));
  assert.equal(loader.load(makePlugin('engine-a')), false);
});

test('plugin loader returns undefined for unknown engine', () => {
  const loader = new PluginLoader(container());
  assert.equal(loader.execute('nope', { requestId: 'x', inputs: {} }), undefined);
});
