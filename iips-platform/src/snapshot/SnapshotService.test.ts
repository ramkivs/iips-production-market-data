import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SnapshotService } from './SnapshotService';
import { SnapshotStore } from './SnapshotStore';
import { createClock } from '../infrastructure/Clock';
import { createIdProvider } from '../infrastructure/IdProvider';

const svc = () => new SnapshotService(createClock('fixed'), createIdProvider('deterministic'));

test('snapshot service creates immutable snapshot', () => {
  const s = svc().create({ engineId: 'banking', metrics: { ROA: 1.5 }, scores: { Quality: 80 }, verdict: 'Buy' });
  assert.equal(s.engineId, 'banking');
  assert.equal(s.verdict, 'Buy');
  assert.equal(Object.isFrozen(s), true);
  assert.equal(Object.isFrozen(s.metrics), true);
});

test('snapshot id is deterministic', () => {
  const a = svc().create({ engineId: 'banking', metrics: { ROA: 1.5 }, scores: {} });
  const b = svc().create({ engineId: 'banking', metrics: { ROA: 1.5 }, scores: {} });
  assert.equal(a.snapshotId, b.snapshotId);
});

test('snapshot store appends and retrieves', () => {
  const store = new SnapshotStore();
  const snap = svc().create({ engineId: 'banking', metrics: {}, scores: {} });
  store.append(snap);
  assert.equal(store.get(snap.snapshotId), snap);
  assert.equal(store.size, 1);
});

test('snapshot store rejects duplicate ids', () => {
  const store = new SnapshotStore();
  const snap = svc().create({ engineId: 'banking', metrics: {}, scores: {} });
  store.append(snap);
  assert.throws(() => store.append(snap), /already exists/);
});
