import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';

test('REGRESSION: snapshot created immutable and replay reproduces identically', () => {
  const clock = createClock('fixed');
  const id = createIdProvider('deterministic');
  const svc = new SnapshotService(clock, id);
  const store = new SnapshotStore();
  const replay = new ReplayService(store);

  const snap = svc.create({ engineId: 'sector.banking', metrics: { ROA: 1.5 }, scores: { Q: 80 }, verdict: 'Buy' });
  assert.equal(Object.isFrozen(snap), true);
  store.append(snap);
  const r = replay.replay(snap.snapshotId);
  assert.equal(r?.reproduced, true);
  assert.equal(r?.byteIdentical, true);
});
