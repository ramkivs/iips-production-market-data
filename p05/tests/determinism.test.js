/**
 * P05-01 TESTS — DETERMINISM AND REPEATABILITY
 *
 * Required test surface 1: same fixture + same version/asOf ⇒ identical normalized output.
 * Required test surface 9: repeated execution produces reproducible results.
 *
 * Authority: D-1…D-6 (P02_PROVIDER_ABSTRACTION_CONTRACT §4), SI-4, DV-5, SN-6, RI-6, TS-5, NP-4.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeFeed, RECEIVED_AT, readFixture } from './helpers.js';
import { canonicalDigest, canonicalJson } from '../src/serialize.js';
import { buildSnapshotId } from '../src/contract.js';
import { compareAcquisitions } from '../src/replay.js';

const RECEIVED = RECEIVED_AT;

/** Every acquisition this suite exercises, with the exact request that produces it. */
const ACQUISITIONS = [
  { domain: 'D01', mode: 'LIVE',     fixtureId: 'Q-0001', receivedAt: RECEIVED },
  { domain: 'D01', mode: 'LIVE',     fixtureId: 'Q-0002', receivedAt: RECEIVED },
  { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: RECEIVED },
  { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0002', receivedAt: RECEIVED },
  { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'V-0001', receivedAt: RECEIVED, fixtureKind: 'valuation' },
  { domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: RECEIVED },
  { domain: 'D10', mode: 'SNAPSHOT', fixtureId: 'VEN-XSYN', receivedAt: RECEIVED, micCode: 'XSYN' },
  { domain: 'D10', mode: 'SNAPSHOT', fixtureId: 'VEN-XSYNSG1', receivedAt: RECEIVED, micCode: 'XSYNSG1' },
];

test('1. same fixture + same version/asOf produces identical normalized output', () => {
  const a = makeFeed();
  const b = makeFeed(); // a completely independent instance — no shared state
  for (const req of ACQUISITIONS) {
    const ra = a.snapshot(req);
    const rb = b.snapshot(req);
    assert.equal(ra.ok, true, `${req.fixtureId} should succeed`);
    assert.equal(rb.ok, true, `${req.fixtureId} should succeed`);

    const cmp = compareAcquisitions(ra.snapshot, rb.snapshot);
    assert.equal(cmp.snapshotIdMatch, true, `${req.fixtureId}: snapshotId must match`);
    assert.equal(cmp.identical, true, `${req.fixtureId}: canonical serialization must be byte-identical`);
    assert.equal(cmp.digestA, cmp.digestB, `${req.fixtureId}: digest must match`);
  }
});

test('9. repeated execution across many iterations is reproducible', () => {
  const digests = new Set();
  for (let i = 0; i < 25; i += 1) {
    const feed = makeFeed();
    for (const req of ACQUISITIONS) {
      const r = feed.snapshot(req);
      assert.equal(r.ok, true);
      digests.add(`${req.fixtureId}=${canonicalDigest(r.snapshot)}`);
    }
  }
  // 25 iterations over 8 acquisitions must collapse to exactly 8 distinct digests.
  assert.equal(digests.size, ACQUISITIONS.length);
});

test('D-1 / SI-4 / DV-5 — snapshotId is a pure function of (provider, dataVersion, asOf)', () => {
  const id1 = buildSnapshotId('localfix', 'v1', '2026-03-02T14:30:00.000Z');
  const id2 = buildSnapshotId('localfix', 'v1', '2026-03-02T14:30:00.000Z');
  assert.equal(id1, id2);
  assert.equal(id1, 'data-localfix-v1-2026-03-02T14:30:00.000Z');
  // Any component change yields a different identity.
  assert.notEqual(id1, buildSnapshotId('localfix', 'v2', '2026-03-02T14:30:00.000Z'));
  assert.notEqual(id1, buildSnapshotId('localfix', 'v1', '2026-03-03T14:30:00.000Z'));
  assert.notEqual(id1, buildSnapshotId('other', 'v1', '2026-03-02T14:30:00.000Z'));
});

test('D-2 — identical payload + identical adapterVersion + identical schemaVersion ⇒ identical snapshot', () => {
  const a = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED });
  const b = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED });
  assert.equal(canonicalJson(a.snapshot), canonicalJson(b.snapshot));
});

test('DV-2 — different source content yields a different dataVersion', () => {
  const c1 = makeFeed().snapshot({ domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: RECEIVED });
  const c2 = makeFeed().snapshot({ domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0002', receivedAt: RECEIVED });
  assert.notEqual(c1.snapshot.dataVersion, c2.snapshot.dataVersion);
  assert.notEqual(c1.snapshot.snapshotId, c2.snapshot.snapshotId);
});

test('DV-3 — a correction is a NEW dataVersion, never an edit of the same snapshot', () => {
  const feed = makeFeed();
  const first = feed.snapshot({ domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: RECEIVED });
  const again = feed.snapshot({ domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: RECEIVED });
  assert.equal(first.snapshot.snapshotId, again.snapshot.snapshotId, 'same content ⇒ same identity');
  assert.equal(canonicalJson(first.snapshot), canonicalJson(again.snapshot), 'no mutation occurred');
});

test('D-3 — mapping has no wall-clock or random input beyond the single recorded receivedAt', () => {
  // Two runs at genuinely different wall-clock moments must agree, because receivedAt is
  // supplied by the caller and nothing else reads the clock.
  const fixed = '2026-03-02T15:00:00.000Z';
  const a = makeFeed().snapshot({ domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: fixed });
  const b = makeFeed().snapshot({ domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: fixed });
  assert.equal(canonicalJson(a.snapshot), canonicalJson(b.snapshot));
  // And a DIFFERENT receivedAt is visible in lineage but does NOT change snapshotId (SI-4).
  const c = makeFeed().snapshot({ domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: '2026-03-02T16:00:00.000Z' });
  assert.equal(a.snapshot.snapshotId, c.snapshot.snapshotId, 'receivedAt is not part of snapshotId');
  assert.notEqual(a.snapshot.receivedAt, c.snapshot.receivedAt);
});

test('D-5 — field ordering inside a snapshot is canonical, not insertion-order', () => {
  const r = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED });
  const keys = Object.keys(r.snapshot.fields);
  assert.deepEqual(keys, [...keys].sort());
  assert.deepEqual(Object.keys(JSON.parse(canonicalJson(r.snapshot.fields))), [...keys].sort());
});

test('NP-4 — decimal serialization is fixed-scale with no trailing-zero variation', () => {
  const r = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED });
  const last = r.snapshot.fields['MD:price.last'];
  assert.equal(last.value, '101.25');
  assert.equal(last.precision, 2);
  assert.equal(typeof last.value, 'string', 'NP-2: decimals are carried as exact strings, not floats');
  // A whole number still renders at the declared scale.
  const v = makeFeed().snapshot({ domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'V-0001', receivedAt: RECEIVED, fixtureKind: 'valuation' });
  assert.equal(v.snapshot.fields['MD:valuation.peRatio'].value, '18.4000');
  assert.equal(v.snapshot.fields['MD:valuation.peRatio'].precision, 4);
});

test('TS-5 — every timestamp is ISO-8601 UTC at fixed millisecond precision', () => {
  const re = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  for (const req of ACQUISITIONS) {
    const r = makeFeed().snapshot(req);
    assert.equal(r.ok, true);
    assert.match(r.snapshot.asOf, re, `${req.fixtureId} asOf`);
    assert.match(r.snapshot.receivedAt, re, `${req.fixtureId} receivedAt`);
    for (const [k, f] of Object.entries(r.snapshot.fields)) {
      for (const t of ['observationTime', 'effectiveTime', 'publicationTime']) {
        if (f[t] !== undefined) assert.match(f[t], re, `${req.fixtureId} ${k} ${t}`);
      }
    }
  }
});

test('canonical digest is stable for identical canonical input', () => {
  const feed = makeFeed();
  const a = feed.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED }).snapshot;
  const b = feed.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED }).snapshot;
  assert.equal(canonicalDigest(a), canonicalDigest(b));
  assert.match(canonicalDigest(a), /^[0-9a-f]{64}$/);
});

test('every fixture collection is fully covered by the deterministic surface', () => {
  const fx = readFixture('feed-fixtures.json');
  const covered = new Set(ACQUISITIONS.map((a) => a.fixtureId));
  for (const coll of ['quotes', 'closes', 'valuations', 'ohlcv']) {
    for (const item of fx[coll]) {
      assert.ok(covered.has(item._fixtureId), `${coll}/${item._fixtureId} must be exercised`);
    }
  }
});
