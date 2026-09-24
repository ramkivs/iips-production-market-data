import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { makeStubPlugin } from './helpers';

test('REGRESSION: plugin registration lifecycle Discovered->Registration->Initialization->Execution->Completion', () => {
  const container = new Container({ clock: createClock('fixed'), idProvider: createIdProvider('deterministic') });
  const loader = new PluginLoader(container);
  assert.equal(loader.load(makeStubPlugin('sector.banking', 'Banking')), true);
  assert.equal(loader.phase('sector.banking'), 'Registration');
  assert.equal(loader.initialize('sector.banking'), true);
  assert.equal(loader.phase('sector.banking'), 'Initialization');
  const r = loader.execute('sector.banking', { requestId: 'x', inputs: {} });
  assert.equal(r?.state, 'COMPLETED');
  assert.equal(loader.phase('sector.banking'), 'Completion');
  assert.equal(loader.size, 1);
});

test('REGRESSION: duplicate plugin rejected', () => {
  const container = new Container({ clock: createClock('fixed'), idProvider: createIdProvider('deterministic') });
  const loader = new PluginLoader(container);
  loader.load(makeStubPlugin('sector.banking', 'Banking'));
  assert.equal(loader.load(makeStubPlugin('sector.banking', 'Banking')), false);
});
