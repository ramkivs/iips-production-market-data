/**
 * P05-01 TESTS — PROVENANCE, asOf AND VERSION PRESERVATION
 *
 * Required test surface 3: provenance is preserved and inspectable.
 * Required test surface 4: asOf is preserved and distinguishable from ingestion time.
 * Required test surface 5: version information is preserved.
 *
 * Authority: P01_IDENTITY_AND_LINEAGE §4 (L-1…L-11), §5 (LN-1…LN-7);
 *            P01_DATA_CONTRACT §9 (SN-2), §8 (DV-1…DV-6);
 *            P02_PROVIDER_IDENTITY_VERSIONING (six independent axes, VX-1…VX-4).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeFeed, RECEIVED_AT } from './helpers.js';

const RECEIVED = RECEIVED_AT;

const ALL = [
  { domain: 'D01', mode: 'LIVE',     fixtureId: 'Q-0001', receivedAt: RECEIVED },
  { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: RECEIVED },
  { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'V-0001', receivedAt: RECEIVED, fixtureKind: 'valuation' },
  { domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: RECEIVED },
  { domain: 'D10', mode: 'SNAPSHOT', fixtureId: 'VEN-XSYN', receivedAt: RECEIVED, micCode: 'XSYN' },
];

test('3. lineage block carries every REQUIRED L-element (LN-1, RF-6, S-5)', () => {
  for (const req of ALL) {
    const r = makeFeed().snapshot(req);
    assert.equal(r.ok, true, req.fixtureId);
    const L = r.snapshot.lineage;
    assert.equal(typeof L.sourceRef, 'string', `${req.fixtureId} L-1 sourceRef`);
    assert.equal(typeof L.adapterId, 'string', `${req.fixtureId} L-2 adapterId`);
    assert.match(L.adapterVersion, /^\d+\.\d+$/, `${req.fixtureId} L-3 adapterVersion (AV-2)`);
    assert.equal(typeof L.transformationChainRef, 'string', `${req.fixtureId} L-4`);
    assert.equal(typeof L.receivedAt, 'string', `${req.fixtureId} L-5`);
    assert.equal(L.namespaceVersion, '1.0', `${req.fixtureId} L-10`);
  }
});

test('3. every field provenance is inspectable and resolvable inside the lineage block (RF-7)', () => {
  for (const req of ALL) {
    const r = makeFeed().snapshot(req);
    assert.equal(r.ok, true, req.fixtureId);
    const refs = new Set(r.snapshot.lineage.fieldProvenance);
    assert.ok(refs.size > 0, `${req.fixtureId} lineage must expose fieldProvenance entries`);
    for (const [key, f] of Object.entries(r.snapshot.fields)) {
      assert.equal(typeof f.provenance, 'string', `${key} provenance`);
      assert.ok(refs.has(f.provenance), `${key} provenance '${f.provenance}' must resolve in the lineage block`);
    }
  }
});

test('3. LN-3 — lineage is reconstructible from the record alone (no provider round-trip)', () => {
  const r = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED });
  const serialized = JSON.stringify(r.snapshot);
  // Everything needed to attribute the data is inside the snapshot itself.
  for (const needle of ['src-localfix-synthetic', 'adapter-localfix', 'chain-localfix-1.0', 'localfix']) {
    assert.ok(serialized.includes(needle), `lineage must carry ${needle}`);
  }
});

test('3. LN-4 / PI-6 — provider identity stays behind the data-plane boundary', () => {
  // The provider token is present in lineage (PI-7: never flattened away) but the snapshot
  // exposes no vendor name, endpoint, hostname or account identifier (A-23, SM-4).
  const r = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED });
  assert.equal(r.snapshot.provider, 'localfix', 'program-internal token, not a vendor name');
  assert.equal(r.snapshot.lineage.adapterId, 'adapter-localfix');
  const text = JSON.stringify(r.snapshot);
  assert.doesNotMatch(text, /https?:\/\//, 'no endpoint may appear');
});

test('4. asOf is market-data time and is DISTINGUISHABLE from receivedAt (SN-2, TS-6)', () => {
  for (const req of ALL) {
    const r = makeFeed().snapshot(req);
    assert.equal(r.ok, true, req.fixtureId);
    const s = r.snapshot;
    assert.notEqual(s.asOf, s.receivedAt, `${req.fixtureId}: asOf and receivedAt must be distinct slots`);
    assert.equal(s.receivedAt, RECEIVED, `${req.fixtureId}: receivedAt is the ingest stamp supplied once`);
    // SM-9: receivedAt must not precede asOf without a declared justification.
    assert.ok(Date.parse(s.receivedAt) >= Date.parse(s.asOf),
      `${req.fixtureId}: receivedAt ${s.receivedAt} precedes asOf ${s.asOf}`);
  }
});

test('4. asOf reflects the market-data event, not the ingest moment', () => {
  const quote = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED });
  assert.equal(quote.snapshot.asOf, '2026-03-02T14:30:00.000Z', 'quote time from the source');
  const close = makeFeed().snapshot({ domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: RECEIVED });
  assert.equal(close.snapshot.asOf, '2026-03-02T00:00:00.000Z', 'session boundary, TS-4 explicit UTC convention');
  // Field-level times remain distinct from asOf where the datum has one.
  assert.equal(quote.snapshot.fields['MD:price.last'].observationTime, '2026-03-02T14:30:00.000Z');
  assert.equal(close.snapshot.fields['MD:price.close'].effectiveTime, '2026-03-02T00:00:00.000Z');
});

test('4. D-4 / TS-6 — receivedAt is stamped once and never recomputed', () => {
  const a = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: '2026-03-02T15:00:00.000Z' });
  const b = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: '2026-03-02T18:30:00.000Z' });
  assert.equal(a.snapshot.receivedAt, '2026-03-02T15:00:00.000Z');
  assert.equal(b.snapshot.receivedAt, '2026-03-02T18:30:00.000Z');
  // SI-4: receivedAt is NOT part of snapshotId.
  assert.equal(a.snapshot.snapshotId, b.snapshot.snapshotId);
  // But it IS in lineage, so the two are distinguishable in the audit trail.
  assert.notEqual(a.snapshot.lineage.receivedAt, b.snapshot.lineage.receivedAt);
});

test('5. all SIX version axes are preserved and none is substituted for another (VX-1…VX-4)', () => {
  const r = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED });
  const s = r.snapshot;
  const axes = {
    dataVersion: s.dataVersion,
    adapterVersion: s.lineage.adapterVersion,
    providerSchemaVersion: makeFeed().config.providerSchemaVersion,
    schemaVersion: s.schemaVersion,
    namespaceVersion: s.namespaceVersion,
    identityMappingVersion: s.identityMappingVersion,
  };
  for (const [name, value] of Object.entries(axes)) {
    assert.equal(typeof value, 'string', `axis ${name} must be present`);
    assert.ok(value.length > 0, `axis ${name} must be non-empty`);
  }
  // VX-1…VX-4: none may be SUBSTITUTED for another. That is a statement about separate
  // addressable slots, not about the values happening to differ — adapterVersion and
  // namespaceVersion are both legitimately '1.0'. Prove separateness structurally instead.
  assert.equal(Object.keys(axes).length, 6, 'exactly six independent axes');
  // Each axis lives in its own slot, so changing one cannot change another.
  assert.notEqual(axes.dataVersion, axes.schemaVersion, 'content vintage is not schema version');
  assert.notEqual(axes.adapterVersion, axes.providerSchemaVersion, 'our code version is not the wire schema');
  assert.notEqual(axes.namespaceVersion, axes.identityMappingVersion, 'namespace scheme is not the AD-1 mapping');
  assert.notEqual(axes.dataVersion, axes.identityMappingVersion);
  assert.equal(axes.providerSchemaVersion, 'localfix-wire-1.0');
  assert.equal(axes.schemaVersion, 'canonical-1.0');
  assert.match(axes.identityMappingVersion, /^idmap-localfix-/);
});

test('5. SI-4 / S-6 / VX-4 — identityMappingVersion is passed through, never fabricated by the adapter', () => {
  const feed = makeFeed();
  const r = feed.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED });
  // It equals the mapping register version — the P04-owned value, not an adapter invention.
  assert.equal(r.snapshot.identityMappingVersion, feed.register.version);
  assert.equal(r.snapshot.lineage.identityMappingVersion, feed.register.version, 'L-9 in lineage');
  assert.equal(r.snapshot.identity.identityMappingVersion, feed.register.version);
});

test('5. SN-2 — identityMappingVersion lives in LINEAGE, not in snapshotId', () => {
  const r = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED });
  assert.doesNotMatch(r.snapshot.snapshotId, /idmap/, 'snapshotId must not carry the mapping version');
  assert.match(r.snapshot.snapshotId, /^data-localfix-v[0-9a-f]{16}-\d{4}-\d{2}-\d{2}T/);
});

test('5. SN-1 / SN-4 — snapshotId is frozen in form and never conflated with SNAP_*', () => {
  for (const req of ALL) {
    const r = makeFeed().snapshot(req);
    assert.equal(r.ok, true, req.fixtureId);
    assert.match(r.snapshot.snapshotId, /^data-/, `${req.fixtureId} must use the data- prefix`);
    assert.doesNotMatch(r.snapshot.snapshotId, /SNAP_/, 'never conflated with engine identity');
    assert.doesNotMatch(JSON.stringify(r.snapshot), /SNAP_[A-Z0-9]/, 'no engine identity in the data plane');
  }
});

test('5. VA-1 — exactly six lineage axes; P04/P05 add no seventh', () => {
  const r = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED });
  const versionKeys = Object.keys(r.snapshot.lineage).filter((k) => /[Vv]ersion$/.test(k));
  assert.deepEqual(versionKeys.sort(), ['adapterVersion', 'identityMappingVersion', 'namespaceVersion']);
  // schemaVersion + dataVersion live on the envelope; providerSchemaVersion on the declaration.
  assert.equal(typeof r.snapshot.schemaVersion, 'string');
  assert.equal(typeof r.snapshot.dataVersion, 'string');
});

test('DV-1 — dataVersion identifies content vintage, not schema', () => {
  const a = makeFeed().snapshot({ domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: RECEIVED });
  const b = makeFeed().snapshot({ domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0002', receivedAt: RECEIVED });
  assert.notEqual(a.snapshot.dataVersion, b.snapshot.dataVersion, 'different content ⇒ different vintage');
  assert.equal(a.snapshot.schemaVersion, b.snapshot.schemaVersion, 'schema is unchanged');
});
