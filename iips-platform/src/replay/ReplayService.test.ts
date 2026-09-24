import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SnapshotService } from '../snapshot/SnapshotService';
import { SnapshotStore } from '../snapshot/SnapshotStore';
import { ReplayService } from './ReplayService';
import { createClock } from '../infrastructure/Clock';
import { createIdProvider } from '../infrastructure/IdProvider';

function setup() {
  const clock = createClock('fixed');
  const id = createIdProvider('deterministic');
  const snapService = new SnapshotService(clock, id);
  const store = new SnapshotStore();
  const replay = new ReplayService(store);
  return { snapService, store, replay };
}

test('replay reproduces a stored snapshot', () => {
  const { snapService, store, replay } = setup();
  const snap = snapService.create({ engineId: 'banking', metrics: { ROA: 1.5 }, scores: { Q: 80 } });
  store.append(snap);
  const r = replay.replay(snap.snapshotId);
  assert.equal(r?.reproduced, true);
  assert.equal(r?.byteIdentical, true);
});

test('replay returns undefined for unknown snapshot', () => {
  const { replay } = setup();
  assert.equal(replay.replay('missing'), undefined);
});
