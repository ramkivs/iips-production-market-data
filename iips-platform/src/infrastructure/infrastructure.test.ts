import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClock, FixedClock } from './Clock';
import { DeterministicIdProvider, createIdProvider } from './IdProvider';
import { deepFreeze } from './deepFreeze';

test('FixedClock returns fixed timestamp', () => {
  const c = createClock('fixed', '2026-08-06T00:00:00.000Z');
  assert.equal(c.now(), '2026-08-06T00:00:00.000Z');
});

test('DeterministicIdProvider is stable + prefixed', () => {
  const a = new DeterministicIdProvider();
  const b = new DeterministicIdProvider();
  assert.equal(a.generate('SNAP', 'seed'), b.generate('SNAP', 'seed'));
  assert.ok(a.generate('SNAP', 'seed').startsWith('SNAP_'));
});

test('DeterministicIdProvider requires prefix', () => {
  assert.throws(() => new DeterministicIdProvider().generate(''), /prefix/);
});

test('deepFreeze makes nested objects immutable', () => {
  const o = { a: 1, b: { c: 2 } };
  const f = deepFreeze(o);
  assert.equal(Object.isFrozen(f), true);
  assert.equal(Object.isFrozen(f.b), true);
});

test('createIdProvider deterministic returns stable ids', () => {
  const a = createIdProvider('deterministic');
  const b = createIdProvider('deterministic');
  assert.equal(a.generate('X', 'seed'), b.generate('X', 'seed'));
});
