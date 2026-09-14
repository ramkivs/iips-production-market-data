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

test('REGRESSION: plugin identity engineId is the registration key', () => {
  const container = new Container({ clock: createClock('fixed'), idProvider: createIdProvider('deterministic') });
  const loader = new PluginLoader(container);

  const first = makeStubPlugin('sector.banking', 'Banking');
  const second = makeStubPlugin('sector.energy', 'Energy');

  assert.equal(loader.load(first), true);
  assert.equal(loader.load(second), true);

  assert.equal(loader.has('sector.banking'), true);
  assert.equal(loader.has('sector.energy'), true);
  assert.deepEqual(loader.list().sort(), ['sector.banking', 'sector.energy']);
  assert.equal(loader.size, 2);
});

test('REGRESSION: same engineId remains rejected even when plugin instances differ', () => {
  const container = new Container({ clock: createClock('fixed'), idProvider: createIdProvider('deterministic') });
  const loader = new PluginLoader(container);

  const first = makeStubPlugin('sector.banking', 'Banking');
  const duplicate = makeStubPlugin('sector.banking', 'Banking');

  assert.equal(loader.load(first), true);
  assert.equal(loader.load(duplicate), false);

  assert.equal(loader.size, 1);
  assert.deepEqual(loader.list(), ['sector.banking']);
});

test('REGRESSION: bounded plugin namespace is keyed by identity engineId', () => {
  const container = new Container({ clock: createClock('fixed'), idProvider: createIdProvider('deterministic') });
  const loader = new PluginLoader(container);

  const banking = makeStubPlugin('sector.banking', 'Banking');
  const energy = makeStubPlugin('sector.energy', 'Energy');

  assert.equal(loader.load(banking), true);
  assert.equal(loader.load(energy), true);

  assert.equal(loader.has('sector.banking'), true);
  assert.equal(loader.has('sector.energy'), true);
  assert.deepEqual(loader.list().sort(), ['sector.banking', 'sector.energy']);
  assert.equal(loader.size, 2);
});
