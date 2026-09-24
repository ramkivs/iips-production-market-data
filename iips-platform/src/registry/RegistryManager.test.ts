import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RegistryManager } from './RegistryManager';

test('registry manager registers + lists six immutable registries', () => {
  const rm = new RegistryManager();
  rm.register('metric', { id: 'BM-001', name: 'ROA', version: '1.0' });
  rm.register('score', { id: 'SCORE-Q', name: 'Quality', version: '1.0' });
  assert.equal(rm.has('metric', 'BM-001'), true);
  assert.equal(rm.get('metric', 'BM-001')?.name, 'ROA');
  assert.equal(rm.list('metric').length, 1);
  assert.equal(rm.size('score'), 1);
});

test('registry rejects duplicates', () => {
  const rm = new RegistryManager();
  rm.register('metric', { id: 'BM-001', name: 'ROA', version: '1.0' });
  assert.throws(() => rm.register('metric', { id: 'BM-001', name: 'ROA2', version: '1.1' }), /duplicate/);
});

test('registry manager forces kind into the target registry', () => {
  const rm = new RegistryManager();
  // Registering an id under 'score' places it in the score registry with kind 'score'.
  rm.register('score', { id: 'SCORE-X', name: 'X', version: '1.0' });
  assert.equal(rm.has('score', 'SCORE-X'), true);
  assert.equal(rm.has('metric', 'SCORE-X'), false);
  assert.equal(rm.get('score', 'SCORE-X')?.kind, 'score');
});

test('versions are frozen', () => {
  const rm = new RegistryManager();
  const v = rm.versions();
  assert.equal(v.metric, '1.0');
  assert.equal(Object.isFrozen(v), true);
});

test('freezeAll produces immutable registries', () => {
  const rm = new RegistryManager();
  rm.register('metric', { id: 'BM-001', name: 'ROA', version: '1.0' });
  const frozen = rm.freezeAll();
  assert.equal(Object.isFrozen(frozen), true);
  assert.equal(frozen.metric.kind, 'metric');
});
