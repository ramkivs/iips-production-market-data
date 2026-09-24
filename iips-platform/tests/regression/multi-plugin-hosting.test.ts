import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { makeStubPlugin } from './helpers';

test('REGRESSION: two independent stub plugins coexist without runtime modification', () => {
  const container = new Container({ clock: createClock('fixed'), idProvider: createIdProvider('deterministic') });
  const loader = new PluginLoader(container);
  loader.load(makeStubPlugin('sector.banking', 'Banking', 'bank'));
  loader.load(makeStubPlugin('sector.insurance', 'Insurance', 'ins'));
  loader.initialize('sector.banking');
  loader.initialize('sector.insurance');

  assert.equal(loader.size, 2);
  assert.deepEqual(loader.list().sort(), ['sector.banking', 'sector.insurance']);

  const bank = loader.execute('sector.banking', { requestId: 'b', inputs: {} });
  const ins = loader.execute('sector.insurance', { requestId: 'i', inputs: {} });
  assert.equal(bank?.metadata.tag, 'bank');
  assert.equal(ins?.metadata.tag, 'ins');
});
