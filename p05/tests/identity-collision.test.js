/**
 * P05-01 TESTS — IDENTITY AND COLLISION BEHAVIOUR
 *
 * Required test surface 8: identity/collision behaviour does not bypass ADR-01 C1–C6.
 *
 * Authority: P04_IDENTITY_ADAPTER_CONTRACT (ADP-1…ADP-8, MC-1…MC-7, MP-1…MP-5, PN-1…PN-6,
 *            FC-1…FC-7, SEC-1…SEC-5, PR-1…PR-8);
 *            P04_CANONICAL_SECURITY_MODEL (CS-1…CS-6, XI-1…XI-8);
 *            P01_IDENTITY_AND_LINEAGE (ID-1…ID-6).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeFeed, RECEIVED_AT, readFixture } from './helpers.js';
import {
  AUTHORITATIVE_EXTERNAL_IDENTIFIER, IdentityResolutionFailure, LIFECYCLE_STATES,
  MappingRegister, MAPPING_METHODS, NON_AUTHORITATIVE_IDENTIFIERS, reconcileMultiProviderAssertions,
} from '../src/identity.js';
import { validateSnapshot } from '../src/validate.js';

const RECEIVED = RECEIVED_AT;
const idfx = readFixture('identity-fixtures.json');

function register() {
  return new MappingRegister({ version: idfx.mappingRegisterVersion, records: idfx.mappings });
}

test('OI-09 — FIGI is authoritative; ISIN/CUSIP/SEDOL are explicitly non-authoritative', () => {
  assert.equal(AUTHORITATIVE_EXTERNAL_IDENTIFIER, 'FIGI');
  assert.deepEqual([...NON_AUTHORITATIVE_IDENTIFIERS], ['ISIN', 'CUSIP', 'SEDOL']);
  for (const sec of idfx.securities) {
    for (const xi of sec.externalIdentifiers) {
      if (xi.type === 'FIGI') assert.equal(xi.authority, 'AUTHORITATIVE');
      else assert.equal(xi.authority, 'NON_AUTHORITATIVE', `${xi.type} must not be authoritative`);
    }
  }
});

test('XI-1 / MP-4 — a non-authoritative standard may never be marked AUTHORITATIVE', () => {
  assert.throws(() => new MappingRegister({
    version: 'test-1.0.0',
    records: [{
      canonicalSecurityId: 'CS-X', canonicalIssuerId: 'CI-X', targetCompanyId: 'tech-H1',
      effective: { from: '2020-01-01T00:00:00.000Z', to: null },
      mappingMethod: 'AUTHORITATIVE_IDENTIFIER_MATCH', source: 'localfix', confidence: 1,
      approvalRef: 'A', auditRef: 'B',
      externalIdentifier: { type: 'ISIN', value: 'XS0000000000', authority: 'AUTHORITATIVE' },
    }],
  }), /NON-authoritative/);
});

test('MP-2 / ADP-1 — "inferred from symbol" is NOT a permitted mapping method', () => {
  assert.ok(!MAPPING_METHODS.includes('INFERRED_FROM_SYMBOL'));
  assert.throws(() => new MappingRegister({
    version: 'test-1.0.0',
    records: [{
      canonicalSecurityId: 'CS-X', canonicalIssuerId: 'CI-X', targetCompanyId: 'tech-H1',
      effective: { from: '2020-01-01T00:00:00.000Z', to: null },
      mappingMethod: 'INFERRED_FROM_SYMBOL', source: 'localfix', confidence: 1,
      approvalRef: 'A', auditRef: 'B',
    }],
  }), /MP-2\/ADP-1/);
});

test('MP-1 — every mapping record is traceable to source, method, version and approval', () => {
  for (const m of idfx.mappings) {
    for (const k of ['canonicalSecurityId', 'canonicalIssuerId', 'targetCompanyId', 'effective',
      'mappingMethod', 'source', 'confidence', 'auditRef']) {
      assert.ok(k in m, `mapping ${m.canonicalSecurityId} must carry ${k}`);
    }
    assert.ok(MAPPING_METHODS.includes(m.mappingMethod));
  }
});

test('MP-5 — confidence never substitutes for approval; an unapproved mapping is unresolved', () => {
  const reg = register();
  assert.throws(
    () => reg.resolveCanonicalToCompany('CS-LOCAL-0099', '2026-03-02T00:00:00.000Z'),
    (e) => e instanceof IdentityResolutionFailure && e.rules.includes('MP-5'),
  );
});

test('MC-1 / OI-08 — one canonical issuer maps to MULTIPLE securities (1:N)', () => {
  const alpha = idfx.securities.filter((s) => s.canonicalIssuerId === 'CI-LOCAL-ALPHA');
  assert.equal(alpha.length, 2, 'one issuer, two securities');
  assert.notEqual(alpha[0].canonicalSecurityId, alpha[1].canonicalSecurityId);
});

test('MC-2 — canonical → companyId is an N:1 projection, expected and not an error', () => {
  const reg = register();
  const asOf = '2026-03-02T00:00:00.000Z';
  const a = reg.resolveCanonicalToCompany('CS-LOCAL-0001', asOf);
  const b = reg.resolveCanonicalToCompany('CS-LOCAL-0002', asOf);
  assert.equal(a.companyId, b.companyId, 'two canonical IDs project onto one companyId');
  assert.notEqual(a.record.canonicalSecurityId, b.record.canonicalSecurityId,
    'MC-4: they remain two DISTINCT securities — never merged or collapsed');
});

test('MC-3 — companyId → canonical returns a SET, never a scalar assumed unique', () => {
  const reg = register();
  const set = reg.resolveCompanyToCanonical('technology-H1', '2026-03-02T00:00:00.000Z');
  assert.ok(Array.isArray(set));
  assert.ok(set.length >= 2, 'a set of zero, one or many');
  // MC-7: a companyId with no mapping yields an EMPTY set, an explicit unresolved state.
  const none = reg.resolveCompanyToCanonical(idfx.negativeFixtures.companyIdWithNoMapping, '2026-03-02T00:00:00.000Z');
  assert.deepEqual(none, []);
});

test('FC-1 / ADP-2 — an unmapped canonical identity FAILS EXPLICITLY, with no coercion', () => {
  const reg = register();
  assert.throws(
    () => reg.resolveCanonicalToCompany(idfx.negativeFixtures.unmappedCanonicalSecurityId, '2026-03-02T00:00:00.000Z'),
    (e) => {
      assert.ok(e instanceof IdentityResolutionFailure);
      assert.deepEqual(e.rules, ['FC-1', 'ADP-2', 'MC-7']);
      assert.equal(e.unresolvedElement, idfx.negativeFixtures.unmappedCanonicalSecurityId);
      assert.equal(e.isQualityState, false, 'FC-5: not a quality state');
      assert.equal(e.errorTaxonomyClassAdded, false, 'FC-6: E1–E8 unchanged');
      return true;
    },
  );
});

test('FC-2 / XI-6 / PN-2 — an unresolved FIGI never falls back to another standard or a symbol', () => {
  const reg = register();
  assert.throws(
    () => reg.resolveExternalIdentifier(idfx.negativeFixtures.unresolvedFigi, '2026-03-02T00:00:00.000Z'),
    (e) => e instanceof IdentityResolutionFailure && e.rules.includes('FC-2') && e.rules.includes('XI-6'),
  );
  // A resolved FIGI does work, and reports its authority flag (MP-4).
  const ok = reg.resolveExternalIdentifier('BBG00SYNTH01', '2026-03-02T00:00:00.000Z');
  assert.equal(ok.canonicalSecurityId, 'CS-LOCAL-0001');
  assert.equal(ok.identifierType, 'FIGI');
  assert.equal(ok.authorityFlag, 'AUTHORITATIVE');
});

test('FC-3 — the same unresolved input always produces the same explicit failure', () => {
  const reg = register();
  const run = () => {
    try {
      reg.resolveCanonicalToCompany(idfx.negativeFixtures.unmappedCanonicalSecurityId, '2026-03-02T00:00:00.000Z');
      return null;
    } catch (e) { return `${e.rules.join(',')}|${e.unresolvedElement}|${e.asOf}`; }
  };
  assert.equal(run(), run());
});

test('FC-4 — the failure NAMES the unresolved element, direction and as-of date', () => {
  const reg = register();
  try {
    reg.resolveCanonicalToCompany(idfx.negativeFixtures.unmappedCanonicalSecurityId, '2026-03-02T00:00:00.000Z');
    assert.fail('expected a failure');
  } catch (e) {
    assert.equal(e.direction, 'canonical->companyId');
    assert.match(e.message, /CS-LOCAL-UNMAPPED/);
    assert.match(e.message, /2026-03-02/);
  }
});

test('ADP-7 / MC-5 — mappings are effective-dated; outside the window resolution fails', () => {
  const reg = register();
  // CS-LOCAL-0004 mapping ends 2023-12-29.
  const inside = reg.resolveCanonicalToCompany('CS-LOCAL-0004', '2023-06-01T00:00:00.000Z');
  assert.equal(inside.companyId, 'realty-H1');
  assert.throws(
    () => reg.resolveCanonicalToCompany('CS-LOCAL-0004', '2024-06-01T00:00:00.000Z'),
    (e) => e instanceof IdentityResolutionFailure,
  );
});

test('LC-2 — a lifecycle transition never mutates the immutable canonical security ID', () => {
  const delisted = idfx.securities.find((s) => s.canonicalSecurityId === 'CS-LOCAL-0004');
  assert.equal(delisted.lifecycleStatus, 'delisted');
  assert.equal(delisted.canonicalSecurityId, 'CS-LOCAL-0004', 'anchor unchanged');
  assert.ok(LIFECYCLE_STATES.includes(delisted.lifecycleStatus));
  assert.deepEqual([...LIFECYCLE_STATES], ['active', 'suspended', 'delisted', 'merged', 'superseded']);
});

test('PN-2 / ID-6 — a provider symbol is never promoted to canonical identity', () => {
  assert.throws(
    () => reconcileMultiProviderAssertions([
      { canonicalSecurityId: 'ALFA', provider: 'localfix', localSymbol: 'ALFA' },
    ]),
    /PN-2\/ID-6/,
  );
});

test('PN-5 — two providers asserting one instrument yield ONE canonical ID with per-source attribution', () => {
  const out = reconcileMultiProviderAssertions([
    { canonicalSecurityId: 'CS-LOCAL-0001', provider: 'localfix', localSymbol: 'ALFA',
      externalIdentifier: { type: 'FIGI', value: 'BBG00SYNTH01' } },
    { canonicalSecurityId: 'CS-LOCAL-0001', provider: 'otherfix', localSymbol: 'ALPHA-ORD',
      externalIdentifier: { type: 'FIGI', value: 'BBG00SYNTH01' } },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].sources.length, 2);
  for (const s of out[0].sources) assert.equal(s.localSymbolAuthoritative, false);
});

test('U-7 / PR-7 — two canonical identities on one identifier is an explicit failure, never a silent merge', () => {
  assert.throws(
    () => reconcileMultiProviderAssertions([
      { canonicalSecurityId: 'CS-A', provider: 'p1', localSymbol: 'A',
        externalIdentifier: { type: 'FIGI', value: 'BBG00SYNTH01' } },
      { canonicalSecurityId: 'CS-B', provider: 'p2', localSymbol: 'B',
        externalIdentifier: { type: 'FIGI', value: 'BBG00SYNTH01' } },
    ]),
    /U-7\/PR-7/,
  );
});

test('MC-6 — a synthetic ${sector}-H1 value is a mapping TARGET only, never modelled as an entity', () => {
  for (const m of idfx.mappings) {
    assert.match(m.targetCompanyId, /^[a-z]+-H1$/, 'target is a synthetic mapping target');
  }
  const issuers = new Set(idfx.securities.map((s) => s.canonicalIssuerId));
  for (const m of idfx.mappings) {
    assert.ok(!issuers.has(m.targetCompanyId), 'a companyId is never a canonical issuer');
  }
});

test('8. the live acquisition path does not bypass C1–C6', () => {
  const feed = makeFeed();
  for (const req of [
    { domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED },
    { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: RECEIVED },
    { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'V-0001', receivedAt: RECEIVED, fixtureKind: 'valuation' },
    { domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: RECEIVED },
    { domain: 'D10', mode: 'SNAPSHOT', fixtureId: 'VEN-XSYN', receivedAt: RECEIVED, micCode: 'XSYN' },
  ]) {
    const r = feed.snapshot(req);
    assert.equal(r.ok, true, req.fixtureId);
    // Every emitted key is namespaced, so C1 holds by construction and S2 passes.
    for (const k of Object.keys(r.snapshot.fields)) assert.match(k, /^MD:[a-z]+\.[A-Za-z][A-Za-z0-9]*$/);
    // The full S1→S4 pipeline (including the C1–C6 gate) accepts it.
    const v = validateSnapshot(r.snapshot);
    assert.equal(v.snapshot.snapshotId, r.snapshot.snapshotId);
  }
});

test('8. C4 — two contributing snapshots may not share a namespaced key', () => {
  const feed = makeFeed();
  const q = feed.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED }).snapshot;
  const c = feed.snapshot({ domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: RECEIVED }).snapshot;
  // Both are D01 and both carry MD:price.venueRef — combining them is a C4 violation.
  const shared = Object.keys(q.fields).filter((k) => k in c.fields);
  assert.ok(shared.length > 0, 'the fixtures must actually collide for this test to mean anything');
  assert.throws(
    () => validateSnapshot(q, {
      contributing: [
        { snapshotId: q.snapshotId, keys: Object.keys(q.fields) },
        { snapshotId: c.snapshotId, keys: Object.keys(c.fields) },
      ],
    }),
    (e) => e.stage === 'S2' && e.rules.includes('C4'),
  );
});

test('RF-3 — mappedCompanyId is written only by the P04-shaped adapter path', () => {
  const r = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED });
  assert.equal(r.snapshot.identity.mappedCompanyId, 'technology-H1');
  assert.equal(r.snapshot.identity.adapterCrossing, true);
  assert.equal(r.snapshot.identityMappingVersion, idfx.mappingRegisterVersion);
  // D10 venue identity does NOT cross the adapter and carries no companyId.
  const v = makeFeed().snapshot({ domain: 'D10', mode: 'SNAPSHOT', fixtureId: 'VEN-XSYN', receivedAt: RECEIVED, micCode: 'XSYN' });
  assert.equal(v.snapshot.identity.mappedCompanyId, undefined);
  assert.equal(v.snapshot.identity.adapterCrossing, false);
});

test('RF-1 — an instrument-keyed snapshot always carries an identity reference', () => {
  for (const req of [
    { domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED },
    { domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: RECEIVED },
  ]) {
    const r = makeFeed().snapshot(req);
    assert.ok(r.snapshot.identity?.canonicalSecurityId, `${req.fixtureId} must carry identity`);
    assert.match(r.snapshot.identity.canonicalSecurityId, /^CS-LOCAL-\d{4}$/);
  }
});

test('VN-1 / VN-3 — venue identity is MIC-based and operating vs segment MIC are distinct', () => {
  const op = makeFeed().snapshot({ domain: 'D10', mode: 'SNAPSHOT', fixtureId: 'VEN-XSYN', receivedAt: RECEIVED, micCode: 'XSYN' });
  const seg = makeFeed().snapshot({ domain: 'D10', mode: 'SNAPSHOT', fixtureId: 'VEN-XSYNSG1', receivedAt: RECEIVED, micCode: 'XSYNSG1' });
  assert.equal(op.snapshot.fields['MD:venue.micCode'].value, 'XSYN');
  assert.equal(op.snapshot.identity.micKind, 'OPERATING_MIC');
  assert.equal(seg.snapshot.identity.micKind, 'SEGMENT_MIC');
  assert.notEqual(op.snapshot.snapshotId, seg.snapshot.snapshotId, 'never interchangeable');
});

test('SEC-4 / OI-P04-03 IB-1 — no per-record tenant/region governance is applied or invented', () => {
  const feed = makeFeed();
  for (const req of [
    { domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: RECEIVED },
    { domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: RECEIVED },
  ]) {
    const r = feed.snapshot(req);
    // D01/D02 are not licence-restricted (D06/D09), so no classification is required — and
    // critically, NO attribute set has been invented to fill the slot.
    assert.equal(r.snapshot.lineage.governanceClassification, undefined);
    assert.equal(r.snapshot.lineage.tenant, undefined);
    assert.equal(r.snapshot.lineage.region, undefined);
    assert.doesNotMatch(JSON.stringify(r.snapshot), /tenant|region/i);
  }
  // A-8 declares the limitation as first-class content rather than an omission.
  assert.ok(feed.capability['A-8'].some((l) => /OI-P04-03/.test(l) && /IB-1/.test(l)));
});
