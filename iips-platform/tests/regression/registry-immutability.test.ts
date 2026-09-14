import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RegistryManager } from '../../src/registry/RegistryManager';

test('REGRESSION: six immutable versioned registries', () => {
  const rm = new RegistryManager();
  rm.register('metric', { id: 'BM-001', name: 'ROA', version: '1.0' });
  rm.register('score', { id: 'SCORE-P', name: 'Profitability', version: '1.0' });
  rm.register('taxonomy', { id: 'SEC-BANK', name: 'Banking', version: '1.0' });
  rm.register('formula', { id: 'BF-001', name: 'ROA', version: '1.0' });
  rm.register('snapshot', { id: 'SS-1', name: 'snapshot', version: '1.0' });
  rm.register('transport', { id: 'TT-1', name: 'transport', version: '1.0' });

  const v = rm.versions();
  assert.equal(v.metric, '1.0');
  assert.deepEqual(Object.keys(v).sort(), ['formula', 'metric', 'score', 'snapshot', 'taxonomy', 'transport']);

  // Immutability: registries freeze
  const frozen = rm.freezeAll();
  assert.equal(Object.isFrozen(frozen), true);
});

test('REGRESSION: registry rejects duplicate ids', () => {
  const rm = new RegistryManager();
  rm.register('metric', { id: 'BM-001', name: 'ROA', version: '1.0' });
  assert.throws(() => rm.register('metric', { id: 'BM-001', name: 'ROA2', version: '1.1' }), /duplicate/);
});
