/**
 * P05-01 TESTS — REPLAY AND IDEMPOTENCY
 *
 * Required test surface 2: replay of the same input does not create duplicate canonical records.
 *
 * ⚠ S-8 / AD-17: this exercises a LOCAL P05-01 canonical record store. It is NOT the
 *   existing-IIPS `ReplayService`, which is UNTOUCHED. AD-17 (literal `reproduced:true` /
 *   `byteIdentical:true`) remains UNRESOLVED and is an existing-IIPS authority matter.
 *   Nothing here claims replay verification is adequate.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeFeed, RECEIVED_AT } from './helpers.js';
import { CanonicalRecordStore, compareReplayIdentities } from '../src/replay.js';

const RECEIVED = RECEIVED_AT;

function acquireAll() {
  const feed = makeFeed();
  const reqs = [
    { domain: 'D01', mode: 'LIVE',     fixtureId: 'Q-0001', receivedAt: RECEIVED },
    { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: RECEIVED },
    { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'V-0001', receivedAt: RECEIVED, fixtureKind: 'valuation' },
    { domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: RECEIVED },
    { domain: 'D10', mode: 'SNAPSHOT', fixtureId: 'VEN-XSYN', receivedAt: RECEIVED, micCode: 'XSYN' },
  ];
  return reqs.map((r) => feed.snapshot(r).snapshot);
}

test('2. replaying the same input creates NO duplicate canonical records', () => {
  const store = new CanonicalRecordStore();
  const snapshots = acquireAll();

  const first = snapshots.map((s) => store.ingest(s));
  assert.deepEqual(first.map((r) => r.outcome), snapshots.map(() => 'INSERTED'));
  assert.equal(store.size, snapshots.length);

  // Replay the SAME inputs three more times.
  for (let round = 0; round < 3; round += 1) {
    for (const s of acquireAll()) {
      const r = store.ingest(s);
      assert.equal(r.outcome, 'IDEMPOTENT_NOOP', `${s.snapshotId} must be idempotent`);
    }
  }
  assert.equal(store.size, snapshots.length, 'record count must not grow on replay');
  assert.equal(store.events.filter((e) => e.type === 'INSERTED').length, snapshots.length);
  assert.equal(store.events.filter((e) => e.type === 'IDEMPOTENT_NOOP').length, snapshots.length * 3);
});

test('INV-2 — a conflicting payload at the same snapshotId is rejected, never overwritten', () => {
  const store = new CanonicalRecordStore();
  const original = acquireAll()[0];
  assert.equal(store.ingest(original).outcome, 'INSERTED');

  // Same identity triple, different content: forbidden. A correction must be a NEW dataVersion.
  const forged = { ...original, quality: 'stale' };
  Object.defineProperty(forged, 'snapshotId', { value: original.snapshotId, enumerable: true });
  const res = store.ingest(Object.freeze(forged));
  assert.equal(res.outcome, 'CONFLICT_REJECTED');
  assert.equal(store.size, 1);
  const conflict = store.events.find((e) => e.type === 'CONFLICT_REJECTED');
  assert.match(conflict.reason, /INV-2/);
});

test('SN-4 / RI-2 — replay of an ORDERED contributing set is deterministic and order-significant', () => {
  const store = new CanonicalRecordStore();
  const snapshots = acquireAll();
  snapshots.forEach((s) => store.ingest(s));
  const ids = snapshots.map((s) => s.snapshotId);

  const a = store.replay(ids);
  const b = store.replay(ids);
  assert.equal(a.effectiveReplayIdentity, b.effectiveReplayIdentity, 'same order ⇒ same identity');
  assert.equal(a.canonicalSerialization, b.canonicalSerialization);

  // A different ORDER is a different effective replay identity (merge order is significant).
  const reversed = [...ids].reverse();
  const c = store.replay(reversed);
  assert.notEqual(a.effectiveReplayIdentity, c.effectiveReplayIdentity);
});

test('RI-1 — every contributing entry carries the full ADR-02 contributingData element set', () => {
  const store = new CanonicalRecordStore();
  acquireAll().forEach((s) => store.ingest(s));
  const ids = [...store.records.keys()];
  const { contributing } = store.replay(ids);

  const required = ['dataSnapshotId', 'provider', 'dataVersion', 'asOf', 'receivedAt',
    'mode', 'quality', 'completenessPct', 'lineage'];
  for (const entry of contributing) {
    for (const k of required) {
      assert.notEqual(entry[k], undefined, `contributing entry missing ${k}`);
    }
  }
});

test('RI-3 — provider identity is never flattened away in lineage', () => {
  const store = new CanonicalRecordStore();
  acquireAll().forEach((s) => store.ingest(s));
  const { contributing } = store.replay([...store.records.keys()]);
  for (const entry of contributing) {
    assert.equal(entry.provider, 'localfix');
    assert.equal(entry.lineage.adapterId, 'adapter-localfix');
    assert.match(entry.lineage.adapterVersion, /^\d+\.\d+$/, 'AV-2: MAJOR.MINOR at minimum');
  }
});

test('RI-4 — differing contributing vintage yields a DIFFERENT effective replay identity', () => {
  const store = new CanonicalRecordStore();
  const feed = makeFeed();
  const c1 = feed.snapshot({ domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: RECEIVED }).snapshot;
  const c2 = feed.snapshot({ domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0002', receivedAt: RECEIVED }).snapshot;
  const h1 = feed.snapshot({ domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: RECEIVED }).snapshot;
  [c1, c2, h1].forEach((s) => store.ingest(s));

  const cmp = compareReplayIdentities(store, [c1.snapshotId, h1.snapshotId], [c2.snapshotId, h1.snapshotId]);
  assert.equal(cmp.differ, true, 'silent vintage drift is prohibited');
  assert.notEqual(cmp.identityA, cmp.identityB);
});

test('replay of an absent snapshotId fails explicitly rather than silently skipping', () => {
  const store = new CanonicalRecordStore();
  assert.throws(() => store.replay(['data-localfix-nope-2026-01-01T00:00:00.000Z']),
    /is not present in the canonical store/);
});

test('replay identity is reproducible across independent store instances', () => {
  const build = () => {
    const s = new CanonicalRecordStore();
    acquireAll().forEach((x) => s.ingest(x));
    return s.replay([...s.records.keys()].sort()).effectiveReplayIdentity;
  };
  assert.equal(build(), build());
});
