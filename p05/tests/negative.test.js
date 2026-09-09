/**
 * P05-01 TESTS — NEGATIVE AND ERROR CONTRACTS
 *
 * Required test surface 6: invalid/malformed input produces deterministic failure behavior.
 * Required test surface 7: missing required data produces the defined negative/error behavior.
 *
 * Authority: P02_ERROR_TAXONOMY (E1–E8, CL-1…CL-7, PR-1…PR-9, F-1…F-11, FR-1…FR-3);
 *            P01_VALIDATION_RULES §4 (NL-1…NL-7), §7 (RJ-1…RJ-8), Q-5;
 *            P04_IDENTITY_ADAPTER_CONTRACT §6 (FC-1…FC-7).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeFeed, RECEIVED_AT, readFixture } from './helpers.js';
import { validateSnapshot, SnapshotRejection, rejectionEvent } from '../src/validate.js';
import { DISPOSITION, RETRY_PROHIBITED, scanForSecrets } from '../src/errors.js';
import { buildField, buildSnapshot, deepFreeze } from '../src/contract.js';

const RECEIVED = RECEIVED_AT;
const fx = readFixture('feed-fixtures.json');

test('6. every malformed fixture produces its DECLARED class, deterministically', () => {
  const feed = makeFeed();
  for (const m of fx.malformed) {
    const r = feed.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: m._fixtureId, receivedAt: RECEIVED });
    assert.equal(r.ok, false, `${m._fixtureId} must be rejected`);
    assert.equal(r.failure.code, m._expectedClass,
      `${m._fixtureId}: expected ${m._expectedClass}, got ${r.failure.code} (${r.failure.reason})`);
    if (m._expectedViolatedRules) {
      assert.deepEqual([...r.failure.detail.violatedRules].sort(), [...m._expectedViolatedRules].sort(),
        `${m._fixtureId} violated rules`);
    }
    // Determinism: the same input always produces the same explicit failure (FC-3).
    const again = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: m._fixtureId, receivedAt: RECEIVED });
    assert.equal(again.failure.code, r.failure.code);
    assert.equal(again.failure.reason, r.failure.reason);
  }
});

test('6. E5 is a provider-schema violation; E8 is well-formed-but-unmappable (CL-6)', () => {
  const feed = makeFeed();
  const e5 = feed.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'M-0001', receivedAt: RECEIVED });
  assert.equal(e5.failure.code, 'E5');
  assert.equal(e5.failure.kind, 'REJECTION');
  assert.equal(e5.failure.producesSnapshot, false);

  const e8 = feed.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'M-0002', receivedAt: RECEIVED });
  assert.equal(e8.failure.code, 'E8');
  assert.match(e8.failure.reason, /ISO-4217/);
});

test('6. CL-1 — every failure is classified into exactly one class; no UNKNOWN', () => {
  const feed = makeFeed();
  for (const m of fx.malformed) {
    const r = feed.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: m._fixtureId, receivedAt: RECEIVED });
    assert.match(r.failure.code, /^E[1-8]$/, 'must be one of E1..E8');
    assert.equal(typeof r.failure.class, 'string');
    assert.notEqual(r.failure.class, 'UNKNOWN');
  }
});

test('6. E6 is evaluated PRE-FLIGHT, before any acquisition (CL-4)', () => {
  const feed = makeFeed();
  const r = feed.snapshot({ domain: 'D07', mode: 'LIVE', fixtureId: 'U-0001', receivedAt: RECEIVED });
  assert.equal(r.failure.code, 'E6');
  assert.equal(r.failure.kind, 'REJECTION');
  // A PIT request is also pre-flight E6: this feed declares LIVE|SNAPSHOT only (PIT is P08).
  const pit = feed.snapshot({ domain: 'D01', mode: 'PIT', fixtureId: 'U-0002', receivedAt: RECEIVED });
  assert.equal(pit.failure.code, 'E6');
});

test('7. E1 is the ONLY quality-bearing class and yields an EMPTY-field snapshot', () => {
  const feed = makeFeed();
  const r = feed.snapshot({
    domain: 'D01', mode: 'LIVE', fixtureId: 'X-0001', receivedAt: RECEIVED,
    asOf: '2026-03-02T14:30:00.000Z',
  });
  assert.equal(r.ok, true, 'E1 produces a snapshot');
  assert.equal(r.quality, 'unavailable');
  assert.equal(Object.keys(r.snapshot.fields).length, 0, 'ST-9 permits empty fields only for unavailable');
  assert.equal(r.snapshot.completenessPct, 0);
  // The single quality-bearing class.
  const qualityBearing = Object.entries(DISPOSITION).filter(([, d]) => d.producesSnapshot).map(([k]) => k);
  assert.deepEqual(qualityBearing, ['E1']);
});

test('7. PR-2 — E2–E8 are never expressed as a quality value', () => {
  for (const code of ['E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8']) {
    assert.equal(DISPOSITION[code].producesSnapshot, false, `${code} must not produce a snapshot`);
    assert.equal(DISPOSITION[code].kind, 'REJECTION');
    assert.equal(DISPOSITION[code].quality, null);
  }
});

test('7. NL-4 / NL-7 / A-20 — silence is NOT_PROVIDED, never zero, never empty string', () => {
  const r = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0002', receivedAt: RECEIVED });
  assert.equal(r.ok, true);
  const bid = r.snapshot.fields['MD:price.bid'];
  assert.equal(bid.availability, 'NOT_PROVIDED');
  assert.equal(bid.value, null, 'no substituted value');
  assert.notEqual(bid.value, 0);
  assert.notEqual(bid.value, '');
  // NULL_ASSERTED and NOT_PROVIDED are never conflated (NL-4).
  assert.notEqual(bid.availability, 'NULL_ASSERTED');
  // Q-2 / NL-6: incompleteness is reflected accurately.
  assert.equal(r.snapshot.quality, 'partial');
  assert.ok(r.snapshot.completenessPct < 100);
});

test('7. RJ-2 — a rejected snapshot is never admitted downstream in any degraded form', () => {
  const feed = makeFeed();
  for (const m of fx.malformed) {
    const r = feed.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: m._fixtureId, receivedAt: RECEIVED });
    assert.equal(r.ok, false);
    assert.equal(r.snapshot, undefined, 'no snapshot may be returned alongside a rejection');
  }
});

test('7. RJ-4 / F-1…F-11 — every rejection emits a complete evidence-bearing record', () => {
  const feed = makeFeed();
  const r = feed.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'M-0002', receivedAt: RECEIVED });
  const rec = r.record;
  for (const f of ['F-1','F-2','F-3','F-4','F-5','F-6','F-7','F-8','F-9','F-10','F-11']) {
    assert.ok(f in rec, `failure record must carry ${f}`);
  }
  assert.equal(rec['F-1'].errorClass, 'E8');
  assert.equal(rec['F-2'], 'localfix');
  assert.equal(rec['F-3'].adapterId, 'adapter-localfix');
  assert.deepEqual([...rec['F-10'].violatedRules].sort(), ['CU-1', 'CU-2', 'SM-2']);
  assert.equal(rec['F-11'], false, 'no snapshot produced');
});

test('7. FR-1 — failure records are counted and reportable', () => {
  const feed = makeFeed();
  assert.equal(feed.failureLog.length, 0);
  for (const m of fx.malformed) {
    feed.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: m._fixtureId, receivedAt: RECEIVED });
  }
  assert.equal(feed.failureLog.length, fx.malformed.length, 'no failure may be silently discarded');
});

test('7. FR-2 / PR-8 / A-23 — no secret, credential or endpoint in any record', () => {
  const feed = makeFeed();
  for (const m of fx.malformed) {
    feed.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: m._fixtureId, receivedAt: RECEIVED });
  }
  for (const rec of feed.failureLog) {
    assert.deepEqual(scanForSecrets(rec), [], 'a failure record must never carry secret material');
  }
  const ok = feed.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED });
  assert.deepEqual(scanForSecrets(ok.snapshot), []);
});

test('7. ES-4 — retry is prohibited for deterministic failure classes', () => {
  assert.deepEqual([...RETRY_PROHIBITED], ['E2', 'E3', 'E5', 'E6', 'E8']);
  for (const code of RETRY_PROHIBITED) {
    assert.equal(DISPOSITION[code].retryable, false, `${code} must not be retryable`);
  }
});

test('S1 — structural rejection of an invalid envelope', () => {
  const good = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED }).snapshot;
  const tamper = (mut) => {
    const copy = JSON.parse(JSON.stringify(good));
    mut(copy);
    return Object.freeze(copy);
  };
  assert.throws(() => validateSnapshot(tamper((s) => { delete s.mode; })),
    (e) => e instanceof SnapshotRejection && e.stage === 'S1' && e.rules.includes('ST-1'));
  assert.throws(() => validateSnapshot(tamper((s) => { s.snapshotId = 'wrong-format'; })),
    (e) => e.rules.includes('ST-2'));
  assert.throws(() => validateSnapshot(tamper((s) => { s.snapshotId = 'data-other-v1-2026-03-02T14:30:00.000Z'; })),
    (e) => e.rules.includes('ST-3'));
  assert.throws(() => validateSnapshot(tamper((s) => { s.mode = 'MAYBE'; })),
    (e) => e.rules.includes('ST-4'));
  assert.throws(() => validateSnapshot(tamper((s) => { s.quality = 'fine'; })),
    (e) => e.rules.includes('ST-6'));
  assert.throws(() => validateSnapshot(tamper((s) => { s.completenessPct = 140; })),
    (e) => e.rules.includes('ST-7'));
  assert.throws(() => validateSnapshot(tamper((s) => { s.domain = 'D11'; })),
    (e) => e.rules.includes('ST-8'));
});

test('S1 ST-9 — empty fields are permitted ONLY when quality is unavailable', () => {
  assert.throws(() => buildSnapshot({
    provider: 'localfix', dataVersion: 'v1', schemaVersion: 'canonical-1.0',
    asOf: '2026-03-02T00:00:00.000Z', receivedAt: RECEIVED, mode: 'SNAPSHOT',
    quality: 'good', completenessPct: 100, domain: 'D01',
    lineage: { sourceRef: 's', adapterId: 'a', adapterVersion: '1.0', transformationChainRef: 'c', receivedAt: RECEIVED, namespaceVersion: '1.0' },
    fields: {},
  }), (e) => e.rules.includes('ST-9'));
});

test('S1 ST-10 — mutation of a constructed snapshot is impossible, not a silent no-op', () => {
  const s = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED }).snapshot;
  assert.ok(Object.isFrozen(s));
  assert.ok(Object.isFrozen(s.fields));
  assert.ok(Object.isFrozen(s.lineage));
  assert.throws(() => { 'use strict'; s.quality = 'stale'; }, TypeError);
  assert.throws(() => { 'use strict'; s.fields['MD:price.last'] = null; }, TypeError);
  assert.throws(() => { 'use strict'; delete s.lineage.adapterVersion; }, TypeError);
});

test('S3 SM-13 / Q-6 — a field may not claim BETTER quality than its snapshot', () => {
  const good = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0002', receivedAt: RECEIVED }).snapshot;
  const copy = JSON.parse(JSON.stringify(good));
  copy.quality = 'partial';
  copy.fields['MD:price.last'].quality = 'good'; // better than the snapshot
  assert.throws(() => validateSnapshot(deepFreeze(copy)), (e) => e.rules.includes('SM-13'));
});

test('S3 SM-7 / FD-6 / MD-4 — a PIT snapshot may not carry a non-PIT-eligible field', () => {
  const key = 'MD:price.last';
  const field = buildField({
    key, dataType: 'decimal', availability: 'PRESENT', value: '101.25',
    currency: 'USD', precision: 2, monetary: 'yes', dimension: 'dimensionless',
    effectiveTime: '2026-03-02T00:00:00.000Z', provenance: 'lineage:src-localfix-synthetic', pitEligible: false,
  });
  // SM-7 is an S3 SEMANTIC rule, so it is enforced by the validation pipeline (S1→S4),
  // not by the constructor. Constructing then validating is the correct sequence.
  const built = buildSnapshot({
    provider: 'localfix', dataVersion: 'v1', schemaVersion: 'canonical-1.0',
    asOf: '2026-03-02T00:00:00.000Z', receivedAt: RECEIVED, mode: 'PIT',
    pitBoundary: '2026-03-02T00:00:00.000Z',
    quality: 'good', completenessPct: 100, domain: 'D01',
    identity: { canonicalSecurityId: 'CS-LOCAL-0001', canonicalIssuerId: 'CI-LOCAL-ALPHA',
      instrumentType: 'EQUITY', lifecycleStatus: 'active', validFrom: '2020-01-01T00:00:00.000Z' },
    lineage: { sourceRef: 'src-localfix-synthetic', adapterId: 'adapter-localfix', adapterVersion: '1.0',
      transformationChainRef: 'chain', receivedAt: RECEIVED, namespaceVersion: '1.0',
      fieldProvenance: ['lineage:src-localfix-synthetic'] },
    fields: { [key]: field },
  });
  assert.throws(() => validateSnapshot(built), (e) => e.rules.includes('SM-7') || e.rules.includes('FD-6'));
});

test('S3 SM-9 — receivedAt before asOf without justification is rejected', () => {
  // SM-9 is an S3 rule; the snapshot is structurally valid, so it constructs and is then rejected.
  const venueField = buildField({
    key: 'MD:venue.micCode', dataType: 'identifier', availability: 'PRESENT', value: 'XSYN',
    dimension: 'dimensionless', effectiveTime: '2026-03-05T00:00:00.000Z',
    provenance: 'lineage:src-localfix-synthetic', pitEligible: true,
  });
  const built = buildSnapshot({
    provider: 'localfix', dataVersion: 'v1', schemaVersion: 'canonical-1.0',
    asOf: '2026-03-05T00:00:00.000Z', receivedAt: '2026-03-01T00:00:00.000Z', mode: 'SNAPSHOT',
    quality: 'good', completenessPct: 100, domain: 'D10',
    identity: { venueIdentity: 'XSYN', micKind: 'OPERATING_MIC', adapterCrossing: false },
    lineage: { sourceRef: 'src-localfix-synthetic', adapterId: 'adapter-localfix', adapterVersion: '1.0',
      transformationChainRef: 'chain', receivedAt: '2026-03-01T00:00:00.000Z', namespaceVersion: '1.0',
      fieldProvenance: ['lineage:src-localfix-synthetic'] },
    fields: { 'MD:venue.micCode': venueField },
  });
  assert.throws(() => validateSnapshot(built), (e) => e.rules.includes('SM-9'));
});

test('S4 RF-6 — an incomplete lineage block is a rejection, not a degradation', () => {
  const venueField = buildField({
    key: 'MD:venue.micCode', dataType: 'identifier', availability: 'PRESENT', value: 'XSYN',
    dimension: 'dimensionless', effectiveTime: '2026-03-02T00:00:00.000Z',
    provenance: 'lineage:src-localfix-synthetic', pitEligible: true,
  });
  assert.throws(() => buildSnapshot({
    provider: 'localfix', dataVersion: 'v1', schemaVersion: 'canonical-1.0',
    asOf: '2026-03-02T00:00:00.000Z', receivedAt: RECEIVED, mode: 'SNAPSHOT',
    quality: 'good', completenessPct: 100, domain: 'D10',
    // A non-empty field set, so ST-9 does not pre-empt the lineage check under test.
    lineage: { sourceRef: 's', adapterId: 'a' }, // missing adapterVersion, chain, receivedAt, namespaceVersion
    fields: { 'MD:venue.micCode': venueField },
  }), (e) => e.rules.includes('RF-6') || e.rules.includes('LN-1'));
});

test('RJ-4 — a rejection event is explicit, typed and never downgraded to partial', () => {
  const good = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED }).snapshot;
  const copy = JSON.parse(JSON.stringify(good));
  copy.fields['peRatio'] = { key: 'peRatio', value: '1', dataType: 'decimal', availability: 'PRESENT',
    provenance: 'x', pitEligible: true, precision: 2 };
  let caught;
  try { validateSnapshot(deepFreeze(copy)); } catch (e) { caught = e; }
  assert.ok(caught instanceof SnapshotRejection);
  const ev = rejectionEvent(caught, { provider: 'localfix', domain: 'D01', schemaVersion: 'canonical-1.0', namespaceVersion: '1.0' });
  assert.equal(ev.disposition, 'REJECTED_FAIL_CLOSED');
  assert.equal(ev.admittedDownstream, false);
  assert.deepEqual(ev.offendingKeys, ['peRatio']);
  assert.notEqual(ev.disposition, 'PARTIAL');
});

test('Q-5 — a contract violation is never representable as a quality state', () => {
  // A namespace collision must abort, not degrade to quality:'partial'.
  const good = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED }).snapshot;
  const copy = JSON.parse(JSON.stringify(good));
  copy.fields['sector'] = { key: 'sector', value: 'tech', dataType: 'string', availability: 'PRESENT',
    provenance: 'x', pitEligible: true };
  assert.throws(() => validateSnapshot(deepFreeze(copy)), (e) => {
    assert.equal(e.stage, 'S2');
    assert.deepEqual(e.rules, ['C1']);
    return true;
  });
});
