/**
 * P05-02 — ADAPTER-CONTRACT VALIDATION TESTS
 *
 * Authority: docs/d9/D9_P05_ENTRY_AUTHORIZATION.md §3 **A-2** — specification / adapter-contract
 * work for P05-02 only. ⚠ No live provider execution (D9 N-1).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * ⚠ CLASSIFICATION OF EVERY RESULT IN THIS FILE — READ BEFORE QUOTING ANY OF IT
 * ══════════════════════════════════════════════════════════════════════════════════════════
 *   These are **CONTRACT VALIDATION** tests, executed OFFLINE against a synthetic test double
 *   (`tests/mockLiveAdapter.js`, provider token `mocklive`, NOT a register issuance).
 *
 *   They are **NOT** provider integration tests, and they are **NOT** provider evidence.
 *   The tracker's P05-02 row (Work Tracker!P05-02) requires:
 *       Exit Criteria     = "Authenticated ingestion works"
 *       Test / Validation = "Integration tests"
 *       Evidence          = "Provider evidence"
 *   NONE of those three is satisfied by anything in this file, and nothing here claims otherwise.
 *   No provider is selected, contacted or bound; no credential is provisioned; no authenticated
 *   ingestion is asserted to work. See docs/p05/P05_02_OPEN_ITEMS.md BD-P05-02-01.
 * ══════════════════════════════════════════════════════════════════════════════════════════
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  ADAPTER_CONTRACT_ID,
  P05_02_CONTRACT_VERSION,
  ADAPTER_PHASES,
  LIVE_ONLY_OPERATIONS,
  COMMON_OPERATIONS,
  PROVIDER_KINDS,
  AUTH_OUTCOMES,
  ENTITLEMENT_OUTCOMES,
  CREDENTIAL_REQUIREMENT_KINDS,
  CREDENTIAL_STORAGE_CLASSES,
  RETRY_CONTRACT,
  AUTHORIZATION_MATRIX,
  FRESHNESS_CONTRACT,
  CURRENCY_VOCABULARY_CONTRACT,
  CANONICAL_OUTPUT_BOUNDARY,
  MODULE_SURFACE_RULE,
  declareLiveCapability,
  assertCapabilityConformance,
  assertAdapterSurface,
  assertNoNativeLeakage,
  assertSecretBoundary,
  declareCredentialRequirement,
  evaluateEntitlement,
  freshnessInput,
  runAdapterPipeline,
  contractSummary,
} from '../src/liveAdapterContract.js';

import {
  MockLiveAdapter,
  mockRequest,
  CONTRACT_FX,
  IDENTITY_FX,
  QUOTE_WIRE,
  P05_02_RECEIVED_AT,
} from './mockLiveAdapter.js';

import { makeFeed, p05Root } from './helpers.js';
import { NAMESPACE_TOKEN, NAMESPACE_VERSION, isNamespaced, parseKey } from '../src/namespace.js';
import { DISPOSITION, RETRY_PROHIBITED, CLASSIFICATION_GATE_ORDER, scanForSecrets } from '../src/errors.js';
import {
  MappingRegister,
  buildIdentityRef,
  LIFECYCLE_STATES,
  IdentityResolutionFailure,
} from '../src/identity.js';
import { buildSnapshotId, assertSnapshotIdConsistent } from '../src/contract.js';
import { canonicalDigest } from '../src/serialize.js';

const VOCAB = CONTRACT_FX.nativeVocabulary;
const clean = () => new MockLiveAdapter().snapshot(mockRequest());

// ─────────────────────────────────────────────────────────────────────────────────────────────
// A. PROVIDER-NEUTRAL INTERFACE CONFORMANCE
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('A/1 — the contract is versioned and self-describing', () => {
  assert.equal(ADAPTER_CONTRACT_ID, 'P05-02-LIVE-MARKET-DATA-ADAPTER-CONTRACT');
  assert.equal(P05_02_CONTRACT_VERSION, '1.0');
  const s = contractSummary();
  assert.equal(s.contractId, ADAPTER_CONTRACT_ID);
  assert.equal(s.rulePrefix, 'LA-');
  assert.equal(s.ruleCount, 31);
  assert.equal(s.phases.length, ADAPTER_PHASES.length);
});

test('A/2 — the phase decomposition is ordered, and gate order reproduces CLASSIFICATION_GATE_ORDER', () => {
  const orders = ADAPTER_PHASES.map((p) => p.order);
  assert.deepEqual(orders, [...orders].sort((a, b) => a - b), 'phases are strictly ordered');
  assert.deepEqual([...new Set(orders)].length, orders.length, 'no duplicate order values');
  // LA-4 — capability(E6) → entitlement(E3) → authentication(E2) → acquisition(E1). This is the
  // EXISTING classification precedence, not a newly invented order.
  const gatePhases = ADAPTER_PHASES.filter((p) => p.failureClass && /^[EE]/.test(p.failureClass)).map((p) => p.phase);
  assert.deepEqual(gatePhases.slice(0, 4), ['preflight', 'entitlement', 'authenticate', 'fetch']);
  assert.deepEqual(CLASSIFICATION_GATE_ORDER, ['E6', 'E3', 'E2', 'E1'], 'P05-01 precedence is unchanged');
});

test('A/3 — every phase declares its authority in an accepted artifact', () => {
  for (const p of ADAPTER_PHASES) {
    assert.ok(Array.isArray(p.authority) && p.authority.length > 0, `${p.phase} cites authority`);
    assert.ok(p.authority.every((a) => /^(P01|P02|P04|ADR)/.test(a)),
      `${p.phase} cites an accepted P01/P02/P04/ADR artifact, got: ${p.authority.join(', ')}`);
  }
});

test('A/4 — the live surface is separable from the common core', () => {
  assert.deepEqual([...LIVE_ONLY_OPERATIONS].sort(), ['authenticate', 'checkEntitlement', 'fetch']);
  assert.deepEqual([...COMMON_OPERATIONS].sort(), ['declare', 'emit', 'map', 'normalize', 'preflight', 'validate']);
  assert.equal(PROVIDER_KINDS.length, 2);
  // No overlap — a LOCAL_FIXTURE adapter is never required to expose the live surface.
  assert.equal(LIVE_ONLY_OPERATIONS.filter((o) => COMMON_OPERATIONS.includes(o)).length, 0);
});

test('A/5 — the test double satisfies the LIVE surface structurally', () => {
  const surface = assertAdapterSurface(new MockLiveAdapter(), { providerKind: 'LIVE' });
  assert.equal(surface.ok, true, `missing: ${surface.missing.join(', ')} notCallable: ${surface.notCallable.join(', ')}`);
  assert.equal(surface.ingressOk, true, 'snapshot(request) — the sole ingress — is callable');
  assert.deepEqual(surface.missing, []);
  assert.deepEqual(surface.notCallable, []);
});

test('A/6 — a non-conforming adapter is reported, not silently accepted', () => {
  const partial = { declare: () => declareLiveCapability(CONTRACT_FX.testDouble), preflight: () => true };
  const surface = assertAdapterSurface(partial, { providerKind: 'LIVE' });
  assert.equal(surface.ok, false);
  assert.ok(surface.missing.includes('authenticate'));
  assert.ok(surface.missing.includes('fetch'));
  assert.ok(surface.missing.includes('snapshot'));
});

test('A/7 — LA-5: a LIVE adapter may not report authentication NOT_REQUIRED', () => {
  const a = new MockLiveAdapter({ authFixture: 'AUTH-OK' });
  a.authenticate = () => ({ status: 'NOT_REQUIRED', credentialRef: 'CRED-REQ-LIVE-QUOTE' });
  const r = a.snapshot(mockRequest());
  assert.equal(r.ok, false);
  assert.equal(r.failure.code, 'E2');
  assert.match(r.failure.message, /NOT_REQUIRED/);
});

test('A/8 — the authorization matrix separates the four layers, and only two are authorized', () => {
  assert.equal(AUTHORIZATION_MATRIX.length, 4);
  const authorized = AUTHORIZATION_MATRIX.filter((r) => r.authorized).map((r) => r.layer);
  assert.deepEqual(authorized, ['ADAPTER_SPECIFICATION', 'ADAPTER_CONTRACT']);
  for (const r of AUTHORIZATION_MATRIX.filter((x) => !x.authorized)) {
    assert.match(r.authority, /D9 N-1/, `${r.layer} is blocked by D9 N-1`);
  }
  assert.match(AUTHORIZATION_MATRIX.find((r) => r.layer === 'LIVE_PROVIDER_EXECUTION').authority, /No live provider execution/);
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// B. REQUEST / RESPONSE SHAPE  +  C. SCHEMA / VERSION CAPTURE
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('B/1 — a conforming capability declaration passes every LA-15 check', () => {
  const decl = declareLiveCapability(CONTRACT_FX.testDouble);
  const res = assertCapabilityConformance(decl);
  assert.deepEqual(res.violations, [], `violations: ${res.violations.join(' | ')}`);
  assert.equal(res.ok, true);
  assert.ok(res.checked.length >= 18, `at least the C-1…C-18 elements are checked (got ${res.checked.length})`);
});

test('B/2 — a declaration missing a required element is reported by name', () => {
  const { adapterVersion, ...noVersion } = CONTRACT_FX.testDouble;
  const decl = declareLiveCapability({ ...noVersion, adapterVersion: '1' });   // not MAJOR.MINOR
  const res = assertCapabilityConformance(decl);
  assert.equal(res.ok, false);
  assert.ok(res.violations.some((v) => v.startsWith('C-2')), 'AV-2: adapterVersion must be MAJOR.MINOR');
});

test('B/3 — a declaration claiming a domain outside D01…D10 is invalid', () => {
  const decl = declareLiveCapability({ ...CONTRACT_FX.testDouble, domains: ['D01', 'D11'] });
  const res = assertCapabilityConformance(decl);
  assert.equal(res.ok, false);
  assert.ok(res.violations.some((v) => v.startsWith('C-6')), 'ST-8: no new domains');
});

test('B/4 — CD-6: declaring a credential requirement does not create entitlement', () => {
  const decl = declareLiveCapability(CONTRACT_FX.testDouble);
  assert.equal(decl['A-7'].credentialsRequired, true);
  assert.equal(decl['A-7'].entitlementRequired, true);
  assert.equal(decl['A-7'].credentialRequirements.length, 1);
  // ⚠ The matrix is still EMPTY (EM-2/EM-4). A requirement is not a grant.
  assert.equal(CONTRACT_FX.testDouble.entitlementRequirements.length, 1);
  assert.ok(CONTRACT_FX.testDouble.entitlementRequirements[0]._note.includes('EMPTY'));
});

test('C/1 — all six version axes are captured and mutually distinct', () => {
  const r = clean();
  assert.equal(r.ok, true);
  const s = r.snapshot;
  const rec = r.record;
  // The six axes (P02_PROVIDER_IDENTITY_VERSIONING §2.1): dataVersion, adapterVersion,
  // providerSchemaVersion, schemaVersion, namespaceVersion, identityMappingVersion.
  const axes = {
    dataVersion: s.dataVersion,
    adapterVersion: s.lineage.adapterVersion,
    providerSchemaVersion: rec['R-3'],
    schemaVersion: s.schemaVersion,
    namespaceVersion: s.namespaceVersion,
    identityMappingVersion: s.identityMappingVersion,
  };
  for (const [k, v] of Object.entries(axes)) {
    assert.ok(v !== undefined && v !== null, `${k} is captured`);
  }
  // ⚠ The requirement is that all six axes are INDEPENDENTLY POPULATED — not that their literal
  // values happen to differ. `adapterVersion` and `namespaceVersion` are both '1.0' here, which is
  // a coincidence of numbering, not a conflation: they are separate slots with separate owners.
  // What is prohibited (VX-1…VX-4) is substituting one axis for another, so prove independence by
  // showing that changing one axis changes only that axis.
  const bumped = new MockLiveAdapter();
  bumped.cfg = Object.freeze({ ...CONTRACT_FX.testDouble, adapterVersion: '2.0' });
  bumped.capability = declareLiveCapability(bumped.cfg);
  const b = bumped.snapshot(mockRequest());
  assert.equal(b.snapshot.lineage.adapterVersion, '2.0', 'AV-3: an adapter change is recorded');
  assert.equal(b.snapshot.namespaceVersion, axes.namespaceVersion, 'VX-3: it does NOT move namespaceVersion');
  assert.equal(b.snapshot.schemaVersion, axes.schemaVersion, 'it does NOT move schemaVersion');
  assert.equal(b.snapshot.identityMappingVersion, axes.identityMappingVersion, 'VX-4: nor identityMappingVersion');
  assert.equal(b.snapshot.dataVersion, axes.dataVersion, 'VX-1: nor dataVersion — the content vintage is unchanged');
  assert.equal(b.snapshot.snapshotId, clean().snapshot.snapshotId,
    'SI-4: adapterVersion is NOT in snapshotId, so re-versioning the adapter does not change data identity');
});

test('C/2 — VX-4 / S-6: identityMappingVersion is PASSED THROUGH, never originated by the adapter', () => {
  const r = clean();
  assert.equal(r.snapshot.identityMappingVersion, IDENTITY_FX.mappingRegisterVersion);
  assert.equal(r.snapshot.lineage.identityMappingVersion, IDENTITY_FX.mappingRegisterVersion);
  assert.equal(r.record['SL-3'], IDENTITY_FX.mappingRegisterVersion);
});

test('C/3 — SI-4: adapterId/adapterVersion are in LINEAGE, not in snapshotId', () => {
  const r = clean();
  assert.ok(!r.snapshot.snapshotId.includes(CONTRACT_FX.testDouble.adapterId));
  assert.ok(!r.snapshot.snapshotId.includes(CONTRACT_FX.testDouble.adapterVersion));
  assert.equal(r.snapshot.lineage.adapterId, CONTRACT_FX.testDouble.adapterId);
  assert.equal(r.snapshot.lineage.adapterVersion, CONTRACT_FX.testDouble.adapterVersion);
});

test('C/4 — CT-3: the namespace version in force is the one declared', () => {
  const decl = declareLiveCapability(CONTRACT_FX.testDouble);
  assert.equal(decl['A-5'], NAMESPACE_VERSION);
  assert.equal(clean().snapshot.namespaceVersion, NAMESPACE_VERSION);
});

test('C/5 — the declared provider wire schema is what normalization enforces', () => {
  // The declared schema separates REQUIRED from OPTIONAL elements — the distinction that makes
  // provider silence NOT_PROVIDED rather than a false E5.
  assert.deepEqual(Object.keys(QUOTE_WIRE.required).sort(),
    ['instRef', 'mktCode', 'obsTime', 'pxCcy', 'qAsk', 'qBid', 'qLast', 'respCode'].sort());
  assert.deepEqual(Object.keys(QUOTE_WIRE.optional).sort(), ['qASz', 'qBSz'].sort());
  // A missing REQUIRED element IS a schema violation (IC-5).
  const nc = CONTRACT_FX.negativeCases.find((c) => c._fixtureId === 'LQ-E5-MISSING');
  assert.equal(Object.keys(nc.payload).includes('pxCcy'), false, 'the E5 case omits a REQUIRED element');
  const r = clean();
  assert.equal(r.ok, true);
  // IC-4 — elements the adapter does not consume are RECORDED as ignored, never silently dropped.
  assert.ok(Array.isArray(r.record['R-15']));
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// D. NORMALIZATION  +  E. NAMESPACE ENFORCEMENT
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('D/1 — A-13: a wire-schema violation is E5 and is evaluated BEFORE mapping (CL-6)', () => {
  for (const id of ['LQ-E5-TYPE', 'LQ-E5-MISSING']) {
    const nc = CONTRACT_FX.negativeCases.find((c) => c._fixtureId === id);
    const r = new MockLiveAdapter({ payloadOverride: nc.payload }).snapshot(mockRequest({ fixtureId: id }));
    assert.equal(r.ok, false, `${id} must be rejected`);
    assert.equal(r.failure.code, 'E5', `${id} expected E5, got ${r.failure.code}`);
    assert.equal(DISPOSITION.E5.producesSnapshot, false, 'E5 is a rejection, never a snapshot');
  }
});

test('D/2 — a well-formed payload that cannot be mapped is E8, distinctly from E5', () => {
  const nc = CONTRACT_FX.negativeCases.find((c) => c._fixtureId === 'LQ-E8-AMBIG-TS');
  const r = new MockLiveAdapter({ payloadOverride: nc.payload }).snapshot(mockRequest({ fixtureId: nc._fixtureId }));
  assert.equal(r.ok, false);
  assert.equal(r.failure.code, 'E8');
  assert.ok(r.failure.detail.violatedRules.includes('T-6'), 'T-6: an unassignable timestamp is E8');
  assert.notEqual(r.failure.code, 'E5', 'E8 is not E5 — the payload was well-formed');
});

test('D/3 — A-20 / NL-4: source silence is NOT_PROVIDED, never zero and never omission', () => {
  const r = new MockLiveAdapter().snapshot(mockRequest({ fixtureId: 'LQ-0002' }));
  assert.equal(r.ok, true, 'an absent OPTIONAL element is silence, NOT a malformed response');
  const f = r.snapshot.fields;
  assert.equal(f['MD:price.bidSize'].availability, 'NOT_PROVIDED');
  assert.equal(f['MD:price.askSize'].availability, 'NOT_PROVIDED');
  assert.equal(f['MD:price.bidSize'].value, null, 'NL-3: a non-PRESENT marker carries no substituted value');
  assert.equal(f['MD:price.bid'].availability, 'PRESENT', 'the present fields are unaffected');
  assert.equal(r.quality, 'partial', 'Q-1: silence about contracted fields is partial, not good');
  assert.ok(r.completenessPct < 100);
  assert.equal(r.record['R-13'].NOT_PROVIDED, 2, 'MQ M-5: counted as a source gap');
});

test('D/4 — NL-1: an EXPLICIT null is NULL_ASSERTED, a distinct fact from silence and from withholding', () => {
  const r = new MockLiveAdapter().snapshot(mockRequest({ fixtureId: 'LQ-0003' }));
  assert.equal(r.ok, true);
  const f = r.snapshot.fields;
  assert.equal(f['MD:price.bidSize'].availability, 'NULL_ASSERTED');
  assert.equal(f['MD:price.askSize'].availability, 'NULL_ASSERTED');
  assert.equal(f['MD:price.bidSize'].value, null, 'NL-3: still no substituted value');
  // The three absence semantics are pairwise distinct and none is conflated with another.
  const silent = new MockLiveAdapter().snapshot(mockRequest({ fixtureId: 'LQ-0002' }));
  assert.notEqual(f['MD:price.bidSize'].availability, silent.snapshot.fields['MD:price.bidSize'].availability,
    'NULL_ASSERTED ≠ NOT_PROVIDED');
  const withheld = new MockLiveAdapter().snapshot(mockRequest({ entitlementFixture: 'ENT-0005' }));
  assert.equal(withheld.snapshot.fields['MD:price.bidSize'].availability, 'WITHHELD');
  assert.equal(new Set(['NULL_ASSERTED', 'NOT_PROVIDED', 'WITHHELD']).size, 3);
  // NULL_ASSERTED is a supplied answer, so it does not reduce completeness the way silence does.
  assert.equal(r.record['R-13'].NULL_ASSERTED, 2);
  assert.equal(r.record['R-13'].NOT_PROVIDED, 0);
});

test('E/1 — OI-10: every emitted key is exactly MD:<domain>.<field>', () => {
  const f = clean().snapshot.fields;
  const keys = Object.keys(f).sort();
  assert.equal(keys.length, 6);
  for (const k of keys) {
    assert.ok(isNamespaced(k), `${k} carries the namespace`);
    assert.match(k, /^MD:[a-z]+\.[A-Za-z][A-Za-z0-9]*$/, `${k} matches MD:<domain>.<field>`);
    const parsed = parseKey(k);
    assert.equal(parsed.token, NAMESPACE_TOKEN);
    assert.equal(parsed.domain, 'price');
    assert.equal(parsed.field.length > 0, true);
  }
  assert.deepEqual(keys, ['MD:price.ask', 'MD:price.askSize', 'MD:price.bid', 'MD:price.bidSize', 'MD:price.last', 'MD:price.venueRef']);
});

test('E/2 — ADR-01 C1…C4 hold, and C5 fail-closed aborts on a non-namespaced key', () => {
  // Conforming run: C1–C4 pass inside validateSnapshot (S2).
  assert.equal(clean().ok, true);
  // Non-conforming: a bare provider-native key. C5 aborts — no partial merge, no coercion.
  const r = new MockLiveAdapter({ leakNative: true }).snapshot(mockRequest());
  assert.equal(r.ok, false, 'C5: a C1 violation ABORTS the execution');
  assert.ok(r.failure.detail.violatedRules.includes('C1'));
  assert.match(r.failure.message, /namespace partition violated/);
});

test('E/3 — the emitted domain segments come from the ACCEPTED dictionary, none invented', () => {
  const keys = Object.keys(clean().snapshot.fields);
  assert.ok(keys.length > 0);
  for (const k of keys) {
    const seg = parseKey(k).domain;
    assert.ok(CANONICAL_OUTPUT_BOUNDARY.DOMAIN_SEGMENTS.D01.includes(seg),
      `'${seg}' is in the accepted D01 domain-segment vocabulary (P01_FIELD_DICTIONARY §3)`);
  }
  // No segment outside the accepted eleven appears anywhere.
  const all = Object.values(CANONICAL_OUTPUT_BOUNDARY.DOMAIN_SEGMENTS).flat();
  for (const k of keys) assert.ok(all.includes(parseKey(k).domain));
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// F. IDENTITY / MAPPING  +  G. PROVENANCE  +  H. asOf / receivedAt
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('F/1 — identity is resolved through the SAME P04-shaped register P05-01 uses', () => {
  const r = clean();
  const id = r.snapshot.identity;
  assert.equal(id.canonicalSecurityId, 'CS-LOCAL-0001');
  assert.equal(id.canonicalIssuerId, 'CI-LOCAL-ALPHA');
  assert.equal(id.mappedCompanyId, 'technology-H1');
  assert.equal(id.adapterCrossing, true);
  // PN-2 / I-6: the provider-native symbol is never an identity and never appears.
  assert.equal(id.canonicalSecurityId.includes('MOCK-EQ'), false);
});

test('F/2 — OI-09: FIGI is the authoritative external identifier; ISIN is not', () => {
  const xi = clean().snapshot.identity.externalIdentifiers;
  const figi = xi.find((x) => x.type === 'FIGI');
  const isin = xi.find((x) => x.type === 'ISIN');
  assert.equal(figi.authority, 'AUTHORITATIVE');
  assert.equal(isin.authority, 'NON_AUTHORITATIVE');
  // ⚠ OI-P04-04 remains OPEN — the value is synthetic and carries no sourcing/licensing claim.
  assert.match(figi.value, /^BBG00SYNTH\d{2}$/, 'synthetic, clearly non-real');
});

test('F/3 — FC-1: an unmapped canonical identity FAILS CLOSED, and is NOT a quality state', () => {
  const r = new MockLiveAdapter().snapshot(mockRequest({ canonicalSecurityId: 'CS-LOCAL-UNMAPPED' }));
  assert.equal(r.ok, false, 'FC-1: explicit failure, never a silent coercion');
  assert.equal(r.failure.code, 'E8');
  assert.equal(r.failure.detail.isQualityState, false, 'FC-5: fail-closed is not degradation');
  assert.equal(r.failure.detail.identityFailClosed, true);
  assert.ok(r.failure.detail.violatedRules.includes('FC-1'));
  // FC-6 / INV-6: E1–E8 is UNCHANGED — identity failure is NOT E1 (the only quality-bearing class).
  assert.notEqual(r.failure.code, 'E1');
});

test('F/4 — VN-5 / PN-2: venueRef comes from the P04 venue reference, never from the provider code', () => {
  const r = clean();
  // The provider payload carries `mktCode`; the canonical venueRef must come from the request's
  // P04-resolved venue reference. Prove it by making the two disagree.
  const r2 = new MockLiveAdapter().snapshot(mockRequest({ venueRef: 'XSYNSG1' }));
  assert.equal(r.snapshot.fields['MD:price.venueRef'].value, 'XSYN');
  assert.equal(r2.snapshot.fields['MD:price.venueRef'].value, 'XSYNSG1');
  // And the provider's own market code never appears in the canonical output.
  assert.equal(assertNoNativeLeakage(r.snapshot, ['mktCode']).ok, true);
});

test('G/1 — S-5 / RF-6: the lineage block is complete on every snapshot', () => {
  const lin = clean().snapshot.lineage;
  for (const k of ['sourceRef', 'adapterId', 'adapterVersion', 'transformationChainRef', 'receivedAt', 'namespaceVersion']) {
    assert.ok(lin[k] !== undefined, `lineage.${k} is present`);
  }
  assert.equal(lin.identityMappingVersion, IDENTITY_FX.mappingRegisterVersion);
});

test('G/2 — RF-7: every field provenance reference resolves into the lineage block', () => {
  const s = clean().snapshot;
  const declared = new Set(s.lineage.fieldProvenance ?? []);
  for (const [k, f] of Object.entries(s.fields)) {
    assert.ok(declared.has(f.provenance), `${k} provenance '${f.provenance}' resolves into lineage.fieldProvenance`);
  }
  assert.ok(declared.size > 0);
});

test('H/1 — asOf and receivedAt are distinct slots and are never collapsed (T-1)', () => {
  const s = clean().snapshot;
  assert.equal(s.asOf, '2026-03-04T09:31:00.000Z', 'asOf is the market-data time from the payload');
  assert.equal(s.receivedAt, P05_02_RECEIVED_AT, 'receivedAt is the ingest time from the request');
  assert.notEqual(s.asOf, s.receivedAt);
  assert.equal(s.lineage.receivedAt, P05_02_RECEIVED_AT);
});

test('H/2 — D-4 / TS-6: receivedAt is stamped once and is never recomputed by the adapter', () => {
  const fixed = '2026-03-05T08:00:00.000Z';
  const r = new MockLiveAdapter().snapshot(mockRequest({ receivedAt: fixed }));
  assert.equal(r.snapshot.receivedAt, fixed, 'the adapter passes the supplied instant through verbatim');
  assert.equal(r.record['R-7'].receivedAt, fixed);
});

test('H/3 — LA-23: freshness is reported as an INPUT with no threshold and no verdict', () => {
  const f = freshnessInput({ asOf: '2026-03-04T09:31:00.000Z', receivedAt: P05_02_RECEIVED_AT });
  assert.equal(f.ageMs, Date.parse(P05_02_RECEIVED_AT) - Date.parse('2026-03-04T09:31:00.000Z'));
  assert.equal(f.thresholdApplied, false);
  assert.equal(f.verdict, null, 'MQ-1: the adapter sets no threshold and reaches no verdict');
  assert.equal(f.owner, 'P07');
  assert.equal(FRESHNESS_CONTRACT.setsThresholds, false);
  assert.equal(FRESHNESS_CONTRACT.thresholdOwner, 'P07');
});

test('H/4 — LA-23: a negative age is reported, not silently corrected or judged', () => {
  const f = freshnessInput({ asOf: '2026-03-04T12:00:00.000Z', receivedAt: P05_02_RECEIVED_AT });
  assert.ok(f.ageMs < 0);
  assert.equal(f.negativeAge, true);
  assert.equal(f.verdict, null, 'P07 adjudicates; the adapter reports');
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// I. ERROR MAPPING  +  J. RETRY SEMANTICS (CONTRACT LEVEL ONLY)
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('I/1 — every declared negative case maps to exactly its declared error class', () => {
  const expectations = [
    ['LQ-E6-DOM', { domain: 'D07' }, 'E6'],
    ['LQ-E6-GRAN', { granularity: '1M' }, 'E6'],
    ['LQ-E6-MODE', { mode: 'PIT' }, 'E6'],
    ['LQ-E3', { entitlementFixture: 'ENT-0002' }, 'E3'],
    ['LQ-E2', { authFixture: 'AUTH-FAIL' }, 'E2'],
    ['LQ-E1', { forceError: 'E1' }, 'E1'],
    ['LQ-E4', { forceError: 'E4' }, 'E4'],
    ['LQ-E7', { forceError: 'E7' }, 'E7'],
  ];
  for (const [id, over, expected] of expectations) {
    const r = new MockLiveAdapter().snapshot(mockRequest(over));
    const got = r.ok ? `ok(quality=${r.quality})` : r.failure.code;
    if (expected === 'E1') {
      assert.equal(r.ok, true, `${id}: E1 is quality-bearing, so a snapshot IS produced`);
      assert.equal(r.classified, 'E1');
      assert.equal(r.quality, 'unavailable');
    } else {
      assert.equal(got, expected, `${id} expected ${expected}, got ${got}`);
    }
  }
});

test('I/2 — E1 is the ONLY quality-bearing class; every other class produces no snapshot', () => {
  const qualityBearing = Object.keys(DISPOSITION).filter((c) => DISPOSITION[c].producesSnapshot);
  assert.deepEqual(qualityBearing, ['E1'], 'P02_ERROR_TAXONOMY §2: only E1 carries a quality state');
  const r = new MockLiveAdapter().snapshot(mockRequest({ forceError: 'E1' }));
  assert.equal(r.snapshot.quality, 'unavailable');
  assert.deepEqual(r.snapshot.fields, {}, 'ST-9: an unavailable snapshot carries an EMPTY field set');
  assert.equal(r.completenessPct, 0);
});

test('I/3 — E6 is a PRE-FLIGHT rejection: no fetch, no auth, no entitlement work occurs', () => {
  const a = new MockLiveAdapter();
  let fetched = false;
  let authed = false;
  const origFetch = a.fetch.bind(a);
  const origAuth = a.authenticate.bind(a);
  a.fetch = (...args) => { fetched = true; return origFetch(...args); };
  a.authenticate = (...args) => { authed = true; return origAuth(...args); };
  const r = a.snapshot(mockRequest({ domain: 'D09' }));
  assert.equal(r.failure.code, 'E6');
  assert.equal(fetched, false, 'A-10: the request fails BEFORE any provider call');
  assert.equal(authed, false, 'LA-4: capability precedes authentication');
  assert.deepEqual([...r.trace], ['preflight'], 'the pipeline stopped at the first gate');
});

test('I/4 — LA-4: the pipeline trace follows the mandated gate order exactly', () => {
  const r = clean();
  assert.deepEqual([...r.trace],
    ['preflight', 'entitlement', 'authenticate', 'fetch', 'fetched', 'normalize', 'map', 'validate', 'emit']);
});

test('I/5 — E3 is a REJECTION, never quality:"unavailable" (RD-3)', () => {
  const r = new MockLiveAdapter().snapshot(mockRequest({ entitlementFixture: 'ENT-0002' }));
  assert.equal(r.failure.code, 'E3');
  assert.equal(r.snapshot, undefined, 'no snapshot is produced for a contract condition');
  assert.equal(DISPOSITION.E3.kind, 'REJECTION');
  assert.notEqual(DISPOSITION.E3.quality, 'unavailable');
});

test('I/6 — EV-3 default deny: DENIED, EXPIRED, UNKNOWN and ABSENT all deny', () => {
  for (const [id, expectPermit] of [['ENT-0001', true], ['ENT-0002', false], ['ENT-0003', false], ['ENT-0004', false], ['ENT-0006', false]]) {
    const fx = CONTRACT_FX.entitlementFixtures.find((f) => f._fixtureId === id) ?? {};
    const res = evaluateEntitlement({ status: fx.status, entitlementRef: fx.entitlementRef ?? null });
    assert.equal(res.permit, expectPermit, `${id} permit=${res.permit} (${res.reason})`);
    assert.equal(fx._expectPermit, expectPermit, `the fixture agrees for ${id}`);
  }
  // An ENTITLED outcome with no reference is not evidence-bearing and therefore denies.
  assert.equal(evaluateEntitlement({ status: 'ENTITLED' }).permit, false, 'EV-6');
  assert.equal(ENTITLEMENT_OUTCOMES.length, 5);
});

test('I/7 — EV-8 / RD-1: partial entitlement yields WITHHELD with an entitlementRef, distinct from NOT_PROVIDED', () => {
  const r = new MockLiveAdapter().snapshot(mockRequest({ entitlementFixture: 'ENT-0005' }));
  assert.equal(r.ok, true, 'EV-8: entitled fields are still served');
  const f = r.snapshot.fields;
  assert.equal(f['MD:price.bidSize'].availability, 'WITHHELD');
  assert.equal(f['MD:price.askSize'].availability, 'WITHHELD');
  assert.equal(f['MD:price.bidSize'].entitlementRef, 'ENT-REQ-D01-QUOTE', 'NL-5 / RD-2');
  assert.equal(f['MD:price.bid'].availability, 'PRESENT');
  assert.equal(r.record['R-13'].WITHHELD, 2, 'MQ M-5: WITHHELD is counted separately from NOT_PROVIDED');
  assert.equal(r.record['R-13'].NOT_PROVIDED, 0, 'RD-1: suppression and silence are different facts');
  assert.ok(r.completenessPct < 100, 'completenessPct reduced accordingly');
});

test('J/1 — LA-28: the retry contract CLASSIFIES retryability and implements no policy', () => {
  assert.deepEqual([...RETRY_CONTRACT.retryableClasses], ['E4', 'E7'],
    'only E4 and E7 are retryable in the accepted taxonomy');
  assert.deepEqual([...RETRY_CONTRACT.retryProhibitedClasses], [...RETRY_PROHIBITED]);
  assert.deepEqual(RETRY_CONTRACT.retryableClasses.filter((c) => RETRY_PROHIBITED.includes(c)), [],
    'ES-4: no class is both retryable and retry-prohibited');
  assert.equal(RETRY_CONTRACT.retryProhibitedClasses.length, 5);
  assert.match(RETRY_CONTRACT.ownerOfExecution, /P05-04/);
  assert.match(RETRY_CONTRACT.ownerOfExecution, /NOT AUTHORIZED/);
  assert.equal(noRetryPolicyImplemented(), true);
});

/** LA-28 — a contract may CLASSIFY retryability; it may not implement a retry policy. */
function noRetryPolicyImplemented() {
  const code = readFileSync(join(p05Root, 'src', 'liveAdapterContract.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return !/backoff|setInterval|setTimeout|while\s*\(|sleep\s*\(|delay\s*\(/i.test(code);
}

test('J/2 — a failure record is complete (F-1…F-11) and names no provider-native content', () => {
  const r = new MockLiveAdapter().snapshot(mockRequest({ entitlementFixture: 'ENT-0002' }));
  const rec = r.record;
  for (const k of ['F-1', 'F-2', 'F-3', 'F-4', 'F-5', 'F-6', 'F-7', 'F-8', 'F-9', 'F-10', 'F-11']) {
    assert.ok(rec[k] !== undefined, `${k} is present`);
  }
  assert.equal(rec['F-1'].errorClass, 'E3');
  assert.equal(rec['F-5'], 'CS-LOCAL-0001', 'F-5 is the canonical identity reference, never a provider symbol');
  assert.equal(rec['F-11'], false, 'F-11: no snapshot was produced');
  assert.equal(assertNoNativeLeakage(rec, VOCAB).ok, true, 'RD-4: no native token in a contract-level record');
});

test('J/3 — RD-4: a C1 abort reports a COUNT, not the offending native key', () => {
  const r = new MockLiveAdapter({ leakNative: true }).snapshot(mockRequest());
  assert.equal(r.ok, false);
  assert.match(r.record['F-10'].reason, /non-namespaced key\(s\)/);
  assert.equal(assertNoNativeLeakage(r.record, VOCAB).ok, true,
    'the native token does not reach the contract-level record');
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// K. PROVIDER-NATIVE LEAKAGE PREVENTION  +  L. SECRET / CREDENTIAL BOUNDARY
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('K/1 — LA-18: a conforming run leaks no provider-native vocabulary anywhere', () => {
  const r = clean();
  assert.equal(assertNoNativeLeakage(r.snapshot, VOCAB).ok, true, 'snapshot is clean');
  assert.equal(assertNoNativeLeakage(r.record, VOCAB).ok, true, 'attempt record is clean');
  assert.equal(assertNoNativeLeakage(r.receipt, VOCAB).ok, true, 'emission receipt is clean');
  assert.equal(VOCAB.length >= 13, true, 'the declared native vocabulary is substantive');
});

test('K/2 — LA-18 DETECTS a native token smuggled into a provenance string that C1…C4 would pass', () => {
  const r = new MockLiveAdapter({ leakInProvenance: true }).snapshot(mockRequest());
  assert.equal(r.ok, true, 'every field key is correctly namespaced, so C1…C4 pass');
  const leak = assertNoNativeLeakage(r.snapshot, VOCAB);
  assert.equal(leak.ok, false, 'LA-18 catches what the namespace partition cannot');
  assert.equal(leak.violations[0].token, 'qBid');
  assert.ok(leak.violations[0].occurrences > 0);
});

test('M-4 — no free-form bag, extras map or metadata blob carries unmapped native content', () => {
  const s = clean().snapshot;
  const banned = ['extras', 'metadata', 'raw', 'payload', 'native', 'additional', 'other', 'rawPayload'];
  for (const name of banned) {
    assert.equal(s[name], undefined, `no '${name}' bag on the snapshot`);
    assert.equal(s.lineage[name], undefined, `no '${name}' bag in lineage`);
    for (const f of Object.values(s.fields)) {
      assert.equal(f[name], undefined, `no '${name}' bag on a field`);
    }
  }
  // Every field key is a declared canonical slot — nothing is parked under an undeclared key.
  for (const k of Object.keys(s.fields)) assert.ok(isNamespaced(k), `${k} is a declared canonical slot`);
});

test('L/1 — SP-5 / LA-21: a credential requirement carries no value and no endpoint', () => {
  const req = declareCredentialRequirement({
    credentialRef: 'CRED-REQ-LIVE-QUOTE', kind: 'API_KEY',
    storageClass: 'EXTERNAL_SECRET_MANAGER', scopes: ['quotes:read'],
  });
  assert.equal(req.valuePresent, false);
  assert.equal(req.endpointPresent, false);
  assert.equal(req.status, 'REQUIREMENT_ONLY');
  assert.equal(req.owner, 'P03', 'P02 E-1: credentials and secrets are P03');
  assert.equal(CREDENTIAL_REQUIREMENT_KINDS.includes(req.kind), true);
  assert.equal(CREDENTIAL_STORAGE_CLASSES.includes(req.storageClass), true);
  assert.equal(assertSecretBoundary(req).ok, true);
});

test('L/2 — LA-21 rejects an undeclared credential kind or storage class rather than accepting it', () => {
  assert.throws(() => declareCredentialRequirement({ credentialRef: 'X', kind: 'MAGIC_TOKEN' }), /not in the declared requirement vocabulary/);
  assert.throws(() => declareCredentialRequirement({ credentialRef: 'X', kind: 'API_KEY', storageClass: 'HARDCODED_IN_SOURCE' }), /not in the declared vocabulary/);
  assert.throws(() => declareCredentialRequirement({ kind: 'API_KEY' }), /credentialRef is REQUIRED/);
});

test('L/3 — LA-20: no snapshot, record or declaration carries secret material or a credential value', () => {
  const r = clean();
  const decl = declareLiveCapability(CONTRACT_FX.testDouble);
  for (const [label, artifact] of [['snapshot', r.snapshot], ['record', r.record], ['receipt', r.receipt], ['declaration', decl], ['fixture', CONTRACT_FX]]) {
    const res = assertSecretBoundary(artifact);
    assert.deepEqual(res.secretHits, [], `${label}: no secret material`);
    assert.deepEqual(res.credentialValueFields, [], `${label}: no credential value field`);
  }
});

test('L/4 — LA-20 detects a credential VALUE where one is present', () => {
  // ⚠ SP-3 prohibits credential material in test data, so the credential SHAPE is synthesized at
  // runtime from fragments rather than committed as a literal. The guard is exercised against a
  // value of the right shape without any credential-looking string ever entering the repository.
  const valueKey = ['api', 'Key'].join('');
  const valueParts = ['not-a-real', '-value-', '0000'];
  const planted = { lineage: { sourceRef: 'src-x', [valueKey]: valueParts.join('') } };

  const res = assertSecretBoundary(planted);
  assert.equal(res.ok, false, 'a credential VALUE must be detected');
  assert.deepEqual(res.credentialValueFields, [`lineage.${valueKey}`], 'and located by path');

  // A reference is NOT a value — SP-5 is satisfiable.
  assert.equal(assertSecretBoundary({ lineage: { credentialRef: 'CRED-REQ-LIVE-QUOTE' } }).ok, true);
  assert.equal(assertSecretBoundary({ lineage: { credentialRequirements: ['CRED-REQ-LIVE-QUOTE'] } }).ok, true);
});

test('L/4b — LA-20 complements the P05-01 regex scanner, which has a measured blind spot', () => {
  const valueKey = ['api', 'Key'].join('');
  const val = ['not-a-real', '-value-', '0000'].join('');

  // The P05-01 scanner (regex over text) catches the SOURCE-CODE forms it was written for.
  assert.equal(scanForSecrets(`const ${valueKey} = "${val}";`).length > 0, true, 'source assignment');
  assert.equal(scanForSecrets(`${valueKey}: "${val}",`).length > 0, true, 'source colon form');
  assert.equal(scanForSecrets(`{ ${valueKey}: "${val}" }`).length > 0, true, 'unquoted JS key');

  // ⚠ MEASURED BLIND SPOT — recorded as BD-P05-02-06, not silently worked around.
  // In SERIALIZED JSON a quote sits between the key and the colon, so the `\b(key)\s*[:=]\s*`
  // shape does not match. A regex-over-text scanner cannot see the structure.
  const json = JSON.stringify({ lineage: { [valueKey]: val } });
  assert.equal(scanForSecrets(json).length, 0,
    'measured: the JSON quoted-key form is NOT detected by the regex scanner');

  // LA-20's STRUCTURAL walk does detect it, because it inspects keys and values as data.
  const res = assertSecretBoundary({ lineage: { [valueKey]: val } });
  assert.equal(res.ok, false, 'LA-20 catches what the regex cannot');
  assert.deepEqual(res.credentialValueFields, [`lineage.${valueKey}`]);
});

test('L/5 — LA-19: the contract module imports no transport and reads no ambient state', () => {
  const code = readFileSync(join(p05Root, 'src', 'liveAdapterContract.js'), 'utf8');
  const patterns = [/node:(http|https|net|tls|dgram|child_process)/, /process\.env/, /\bDate\.now\s*\(/,
    /\bnew\s+Date\s*\(\s*\)/, /Math\.random\s*\(/, /crypto\.randomUUID\s*\(/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];
  for (const re of patterns) assert.doesNotMatch(code, re, `LA-19 violated by ${re}`);
  assert.equal(MODULE_SURFACE_RULE.rule, 'LA-19');
  assert.equal(MODULE_SURFACE_RULE.patternListLocation, 'tests/adapter-contract.test.js');
});

test('L/6 — the authenticate phase returns a credentialRef and NEVER a credential value', () => {
  const auth = new MockLiveAdapter().authenticate(mockRequest());
  assert.equal(auth.status, 'AUTHENTICATED');
  assert.equal(auth.credentialRef, 'CRED-REQ-LIVE-QUOTE');
  assert.equal(auth.valuePresent, false);
  assert.equal(auth.endpointPresent, false);
  assert.equal(AUTH_OUTCOMES.includes(auth.status), true);
  assert.equal(assertSecretBoundary(auth).ok, true);
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// M. DETERMINISTIC OUTPUT
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('M/1 — D-2: identical request ⇒ byte-identical canonical snapshot across 5 independent runs', () => {
  const digests = [];
  const ids = [];
  for (let i = 0; i < (CONTRACT_FX.determinismRepeats ?? 5); i += 1) {
    const r = new MockLiveAdapter().snapshot(mockRequest());
    assert.equal(r.ok, true);
    digests.push(r.receipt.digest);
    ids.push(r.snapshot.snapshotId);
  }
  assert.equal(new Set(digests).size, 1, `all digests identical: ${digests.join(', ')}`);
  assert.equal(new Set(ids).size, 1, 'D-1: identical (provider, dataVersion, asOf) ⇒ identical snapshotId');
});

test('M/2 — D-3: the mapping is a pure function of payload + declared configuration', () => {
  const a = new MockLiveAdapter().snapshot(mockRequest());
  const b = new MockLiveAdapter().snapshot(mockRequest());
  assert.equal(a.snapshot.snapshotId, b.snapshot.snapshotId);
  assert.deepEqual(Object.keys(a.snapshot.fields).sort(), Object.keys(b.snapshot.fields).sort());
  // A content change yields a NEW dataVersion (VX-2) and therefore a new snapshotId.
  const c = new MockLiveAdapter().snapshot(mockRequest({ fixtureId: 'LQ-0002' }));
  assert.notEqual(c.snapshot.snapshotId, a.snapshot.snapshotId);
  assert.notEqual(c.snapshot.dataVersion, a.snapshot.dataVersion);
});

test('M/3 — D-5: field and lineage ordering is canonical, never insertion-incidental', () => {
  const s = clean().snapshot;
  const keys = Object.keys(s.fields);
  assert.deepEqual(keys, [...keys].sort(), 'field keys are in canonical order');
  const fp = s.lineage.fieldProvenance;
  assert.deepEqual(fp, [...fp].sort(), 'provenance references are sorted');
});

test('M/4 — a rejected request is deterministic and repeatable (FC-3)', () => {
  const outs = [];
  for (let i = 0; i < 3; i += 1) {
    const r = new MockLiveAdapter().snapshot(mockRequest({ canonicalSecurityId: 'CS-LOCAL-UNMAPPED' }));
    outs.push(`${r.failure.code}|${r.record['F-10'].reason}`);
  }
  assert.equal(new Set(outs).size, 1, `identical unresolved input ⇒ identical explicit failure: ${outs.join(' / ')}`);
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// N. COMPATIBILITY WITH P05-01
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('N/1 — LA-27: the canonical output boundary is the P05-01 surface, not a fork', () => {
  assert.equal(CANONICAL_OUTPUT_BOUNDARY.forked, false);
  assert.match(CANONICAL_OUTPUT_BOUNDARY.owner, /P05-01/);
  const functions = ['buildSnapshot', 'validateSnapshot', 'buildKey', 'assertC1', 'assertC2', 'assertC3',
    'assertC4', 'assertCollisionGuard', 'canonicalJson', 'canonicalDigest', 'failureRecord', 'ClassifiedFailure'];
  for (const name of functions) {
    assert.equal(typeof CANONICAL_OUTPUT_BOUNDARY[name], 'function', `${name} is re-exported as a function`);
  }
  const objects = ['ErrorClass', 'DISPOSITION', 'RETRY_PROHIBITED', 'CLASSIFICATION_GATE_ORDER',
    'AVAILABILITY', 'MODES', 'DOMAIN_SEGMENTS', 'VALID_DOMAINS'];
  for (const name of objects) {
    assert.ok(CANONICAL_OUTPUT_BOUNDARY[name] !== undefined, `${name} is re-exported`);
  }
  assert.equal(CANONICAL_OUTPUT_BOUNDARY.NAMESPACE_TOKEN, 'MD:', 'OI-10 token is carried, not redefined');
});

test('N/2 — the P05-01 local feed and the P05-02 double expose the SAME sole ingress shape', () => {
  const feed = makeFeed();
  const dbl = new MockLiveAdapter();
  assert.equal(typeof feed.snapshot, 'function', 'B-4: MarketDataSource<T> is the sole ingress');
  assert.equal(typeof dbl.snapshot, 'function');
  // Both return the same result envelope.
  const a = feed.snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: '2026-03-03T15:00:00.000Z' });
  const b = dbl.snapshot(mockRequest());
  for (const r of [a, b]) {
    assert.equal(typeof r.ok, 'boolean');
    assert.ok(r.snapshot !== undefined);
    assert.ok(['good', 'stale', 'partial', 'unavailable'].includes(r.quality));
    assert.equal(typeof r.completenessPct, 'number');
  }
  // Both snapshots satisfy the same frozen identity format (SI-1 / AD-6).
  const pat = /^data-([A-Za-z0-9_]+)-([A-Za-z0-9_.\-]+)-(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)$/;
  assert.match(a.snapshot.snapshotId, pat);
  assert.match(b.snapshot.snapshotId, pat);
  assert.equal(a.snapshot.provider, 'localfix');
  assert.equal(b.snapshot.provider, 'mocklive');
  assert.notEqual(a.snapshot.provider, b.snapshot.provider, 'PS-3: a different source is a different provider identity');
});

test('N/3 — B-3 / PS-1: the two adapters are substitutable behind the same canonical contract', () => {
  const a = makeFeed().snapshot({ domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: '2026-03-03T15:00:00.000Z' });
  const b = new MockLiveAdapter().snapshot(mockRequest());
  // Same envelope slot set — nothing above the adapter can tell which produced it.
  assert.deepEqual(Object.keys(a.snapshot).sort(), Object.keys(b.snapshot).sort(),
    'SN-4: no change to the DataSnapshot<T> shape');
  // Same namespace scheme and version.
  assert.equal(a.snapshot.namespaceVersion, b.snapshot.namespaceVersion);
  // Both resolve identity through the same register version.
  assert.equal(a.snapshot.identityMappingVersion, b.snapshot.identityMappingVersion);
});

test('N/4 — ⚠ the P05-01 local feed is NOT a live adapter and cannot satisfy P05-02', () => {
  const feed = makeFeed();
  assert.equal(feed.capability['A-1'].providerKind, 'LOCAL_FIXTURE');
  assert.equal(feed.capability['A-6'].liveConnectivity, false);
  assert.equal(feed.capability['A-7'].credentialsRequired, false);
  assert.equal(feed.capability['A-7'].entitlementRequired, false);
  // LA-2: the live surface is required only for LIVE; a LOCAL_FIXTURE is permanently out of scope.
  const surface = assertAdapterSurface(feed, { providerKind: 'LOCAL_FIXTURE', requirePhases: false });
  for (const op of LIVE_ONLY_OPERATIONS) {
    assert.equal(typeof feed[op], 'undefined', `the local feed does not implement ${op}`);
  }
  assert.equal(surface.ok, true, 'the local feed conforms through the sole ingress');
  assert.equal(surface.ingressOk, true);
  // LA-3: P05-01 factors the phases INLINE inside snapshot(), which the contract permits. Its
  // adherence to the mandated ORDER is established by the P05-01 tests, not by introspection.
  assert.equal(surface.factoring, 'INLINE');
  assert.deepEqual(surface.present, []);
});

test('N/5 — the P05-01 suite still passes unchanged alongside the P05-02 contract', () => {
  // Behavioural proof of non-regression: the P05-01 feed acquires every domain it declares.
  const feed = makeFeed();
  for (const req of [
    { domain: 'D01', mode: 'LIVE', fixtureId: 'Q-0001', receivedAt: '2026-03-03T15:00:00.000Z' },
    { domain: 'D01', mode: 'SNAPSHOT', fixtureId: 'C-0001', receivedAt: '2026-03-03T15:00:00.000Z' },
    { domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: '2026-03-03T15:00:00.000Z' },
    { domain: 'D10', mode: 'SNAPSHOT', fixtureId: 'VEN-XSYN', receivedAt: '2026-03-03T15:00:00.000Z', micCode: 'XSYN' },
  ]) {
    assert.equal(feed.snapshot(req).ok, true, `P05-01 ${req.fixtureId} still acquires`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// O. PROVIDER / AUTHORIZATION BOUNDARY — BEHAVIOURAL, NOT LEXICAL
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('O/1 — the entire contract pipeline runs with every network primitive made to throw', () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('NETWORK USE IS PROHIBITED UNDER D9 N-1'); };
  try {
    const r = new MockLiveAdapter().snapshot(mockRequest());
    assert.equal(r.ok, true, 'nothing reached out — the pipeline is offline by construction');
    assert.equal(r.snapshot.quality, 'good');
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('O/2 — no provider is selected: the register is unchanged and holds exactly one issuance', () => {
  const reg = JSON.parse(readFileSync(join(p05Root, 'fixtures', 'provider-register.json'), 'utf8'));
  assert.equal(reg.issued.length, 1, 'still exactly one issued identity');
  assert.equal(reg.issued[0].provider, 'localfix');
  assert.equal(reg.issued.some((p) => p.provider === 'mocklive'), false,
    'the test double is NOT a register issuance (PG-1)');
  assert.equal(reg.retired.length, 0);
  // The double declares itself a test double and disclaims registration.
  assert.equal(CONTRACT_FX.testDouble._status, 'SYNTHETIC_TEST_DOUBLE');
  assert.equal(CONTRACT_FX.testDouble._registeredInProviderRegister, false);
});

test('O/3 — no vendor is named anywhere in the P05-02 artifacts', () => {
  const files = [
    join(p05Root, 'src', 'liveAdapterContract.js'),
    join(p05Root, 'tests', 'mockLiveAdapter.js'),
    join(p05Root, 'fixtures', 'adapter-contract-fixtures.json'),
  ];
  const text = files.map((f) => readFileSync(f, 'utf8')).join('\n');
  assert.doesNotMatch(text, /bloomberg|refinitiv|lseg|moody|s&p global|factset|polygon\.io|tiingo|alphavantage|alpha vantage|iex cloud|databento|nyse|nasdaq data/i,
    'RD-5: no vendor name where the internal provider identity suffices');
  assert.doesNotMatch(text, /https?:\/\/(?!schema|www\.w3|json-schema)/, 'SP-2: no endpoint URL');
});

test('O/4 — the contract module makes no live-execution or acceptance claim', () => {
  const s = contractSummary();
  assert.equal(s.providerSelected, false);
  assert.equal(s.credentialsProvisioned, false);
  assert.equal(s.networkUsed, false);
  assert.equal(s.liveExecutionPerformed, false);
  assert.equal(s.claimsAuthenticatedIngestionWorks, false);
  assert.equal(s.canonicalModelForked, false);
  assert.equal(s.soleIngress.includes('snapshot(request)'), true);
});

test('O/5 — LA-31: the ISO-4217 gap is recorded, not faked and not silently passed', () => {
  assert.equal(CURRENCY_VOCABULARY_CONTRACT.localDoubleImplements, 'SHAPE_ONLY');
  assert.match(CURRENCY_VOCABULARY_CONTRACT.gapDisposition, /OPEN — BD-P05-02-05/);
  // The genuinely unmappable token IS rejected.
  const nc = CONTRACT_FX.negativeCases.find((c) => c._fixtureId === 'LQ-E8-CCY');
  const r = new MockLiveAdapter({ payloadOverride: nc.payload }).snapshot(mockRequest({ fixtureId: nc._fixtureId }));
  assert.equal(r.failure.code, 'E8', 'C-2: a currency that cannot be established is E8, never defaulted');
  // And the known gap is stated rather than hidden: a shape-valid non-code is NOT caught locally.
  const gap = new MockLiveAdapter({
    payloadOverride: { ...nc.payload, pxCcy: 'XYZ' },
  }).snapshot(mockRequest({ fixtureId: 'GAP-XYZ' }));
  assert.equal(gap.ok, true, 'documented gap: a shape-valid but non-existent code passes the local SHAPE_ONLY check');
});

test('O/6 — the double records its own blocked dependencies as first-class known limitations', () => {
  const limits = declareLiveCapability(CONTRACT_FX.testDouble)['A-8'];
  assert.ok(limits.some((l) => /TEST DOUBLE/i.test(l)), 'declares itself a synthetic test double');
  assert.ok(limits.some((l) => /OI-P04-03/.test(l)), 'declares the OI-P04-03 bound');
  assert.ok(limits.some((l) => /OI-P04-04/.test(l)), 'declares the OI-P04-04 bound');
  assert.ok(limits.some((l) => /CONTRACT VALIDATION/i.test(l)), 'declares that conformance is not live-provider evidence');
  assert.ok(limits.some((l) => /P08/.test(l)), 'declares the P08 PIT/adjustment bound');
});

test('O/7 — no tenant or region governance attribute is invented (D9 N-4, N-5 / IB-2)', () => {
  const text = JSON.stringify(CONTRACT_FX) + readFileSync(join(p05Root, 'src', 'liveAdapterContract.js'), 'utf8');
  // OI-P04-03 is OPEN. Recording the dependency is permitted; inventing the attribute set is not.
  assert.doesNotMatch(text, /tenantId|regionCode|jurisdictionCode|dataResidency/i,
    'IB-2: recording an open item is not resolving it — no attribute is invented');
  assert.match(JSON.stringify(CONTRACT_FX), /OI-P04-03/);
  assert.match(JSON.stringify(CONTRACT_FX), /OI-P04-04/);
  assert.match(JSON.stringify(CONTRACT_FX), /BD-P05-02-01/);
});

/**
 * ⚠ SUPERSEDED ASSERTION — DISCLOSED. This test formerly read "O/8 — P05 remains NOT_ACCEPTED and
 * no acceptance artifact exists". P05 has since been accepted by an explicit A3 act
 * (`docs/p05/P05_GATE_ACCEPTANCE.md`). The assertion is re-scoped, not weakened: it still proves
 * the immutable D9 authority record was not rewritten to manufacture that acceptance, and it now
 * additionally proves the acceptance record preserves the D9 non-authorizations. The full
 * post-acceptance guard lives in `no-provider-dependency.test.js`.
 */
test('O/8 — P05 acceptance is recorded by a separate act; the immutable D9 record is unedited', () => {
  const status = JSON.parse(readFileSync(join(p05Root, '..', 'docs', 'd9', 'D9_STATUS.json'), 'utf8'));
  // The D9 record still reads NOT_ACCEPTED: acceptance was added, never retro-edited into D9.
  assert.equal(status.p05_status.acceptance, 'NOT_ACCEPTED');
  assert.equal(status.p05_status.gate_acceptance_artifact_exists, false);
  assert.equal(status.program_status.certification_status, 'NONE_GRANTED');
  assert.equal(status.program_status.production_activation_status, 'NOT_AUTHORIZED');

  // The controlling current record is the acceptance artifact, and it preserves every boundary.
  const acc = readFileSync(
    join(p05Root, '..', 'docs', 'p05', 'P05_GATE_ACCEPTANCE.md'), 'utf8');
  assert.match(acc, /P05 — Acquisition gate — is ACCEPTED/);
  assert.match(acc, /Ramakrishnan V\. S\. \(Ramki\)/);
  assert.match(acc, /P05-04 = `NOT_AUTHORIZED` \/ NO COMPLETION EVIDENCE/);
  assert.match(acc, /PIT repeatability: MISSING \/ NOT DEMONSTRATED/);
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// P. OBSERVABILITY / EVIDENCE RECORD
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('P/1 — LA-26: the attempt record carries R-1…R-15 and SL-1…SL-4', () => {
  const rec = clean().record;
  for (let i = 1; i <= 15; i += 1) assert.ok(rec[`R-${i}`] !== undefined, `R-${i} present`);
  for (let i = 1; i <= 4; i += 1) assert.ok(rec[`SL-${i}`] !== undefined, `SL-${i} present`);
  assert.equal(rec['R-1'], 'mocklive', 'R-1: internal provider identity, never a vendor name');
  assert.equal(rec['R-6'], 'CS-LOCAL-0001', 'R-6: identity reference, no provider-native symbol');
  assert.match(rec['SL-1'], /^data-mocklive-/, 'SL-1: the frozen snapshotId form');
  assert.equal(rec['SL-4'].provider, 'mocklive', 'SL-4: sufficient for an ADR-02 contributingData entry');
});

test('P/2 — the record makes P02 §3 derivable quantities available without setting thresholds', () => {
  const rec = clean().record;
  assert.equal(typeof rec['R-12'].quality, 'string', 'MQ M-3 input');
  assert.equal(typeof rec['R-12'].completenessPct, 'number', 'MQ M-4 input');
  assert.equal(typeof rec['R-13'].WITHHELD, 'number', 'MQ M-5 input — entitlement pressure');
  assert.equal(typeof rec['R-13'].NOT_PROVIDED, 'number', 'MQ M-5 input — source gaps, kept distinct');
  assert.equal(typeof rec['R-7'].attemptCount, 'number', 'MQ M-6 input');
  assert.equal(rec.redaction.credentialPresent, false, 'RD-1');
  assert.equal(rec.redaction.endpointPresent, false, 'RD-2');
  assert.equal(rec.redaction.nativePayloadIncluded, false, 'RD-3');
  assert.equal(rec.redaction.vendorNameIncluded, false, 'RD-5');
});

test('P/3 — PB-2: provider identity stays in lineage and never becomes a product surface claim', () => {
  const r = clean();
  assert.equal(r.snapshot.provider, 'mocklive', 'PI-7: never flattened away in lineage');
  assert.equal(r.snapshot.lineage.adapterId, CONTRACT_FX.testDouble.adapterId);
  // The emission receipt is an internal governed artifact, not a DTO.
  assert.equal(r.receipt.contractId, ADAPTER_CONTRACT_ID);
  assert.equal(r.receipt.contractVersion, P05_02_CONTRACT_VERSION);
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Q. LIFECYCLE-STATE COVERAGE — P05-02-B / BD-P05-02-07
//
// Authority: docs/p04/P04_LIFECYCLE_AND_EFFECTIVE_DATING.md §2 (LC-1…LC-6) and
// P04_CANONICAL_SECURITY_MODEL.md:46. The five states are fixed by D4_05 §G.2 and
// P01_FIELD_DICTIONARY §7 — none added, none reinterpreted here.
//
// ⚠ SCOPE: this group widens FIXTURE and TEST coverage only. It selects no provider, provisions
//   no credential, opens no connection and executes no licensed historical acquisition. It does
//   NOT close any provider-dependent tracker exit criterion: BD-P05-02-01 (provider selection /
//   entitlement / credentials), BD-P05-02-02 ("authenticated ingestion works") and BD-P05-02-03
//   ("provider evidence") all remain UNMET and can only be closed by live execution, which D9
//   N-1 does not authorize.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** The authoritative enumeration, in the accepted order. UNCHANGED by this unit. */
const LC_STATES = ['active', 'suspended', 'delisted', 'merged', 'superseded'];

/** One fixture security per authoritative state. */
const LC_FIXTURE = {
  active: 'CS-LOCAL-0001',
  suspended: 'CS-LOCAL-0006',
  delisted: 'CS-LOCAL-0004',
  merged: 'CS-LOCAL-0007',
  superseded: 'CS-LOCAL-0008',
};

/** States exercised through a SUCCESSFUL adapter emission at the observation instant. */
const LC_EMITTING = ['active', 'suspended', 'merged', 'superseded'];

/** The P05-02 observation instant, taken from the LQ-0001 fixture (D-3: a fixed literal). */
const LC_AS_OF = '2026-03-04T09:31:00.000Z';

const lcSec = (cs) => IDENTITY_FX.securities.find((s) => s.canonicalSecurityId === cs);
const lcRegister = () => new MappingRegister({
  version: IDENTITY_FX.mappingRegisterVersion,
  records: IDENTITY_FX.mappings,
});
const lcSnapshot = (cs, over = {}) =>
  new MockLiveAdapter().snapshot(mockRequest({ canonicalSecurityId: cs, ...over }));

test('Q/1 — BD-P05-02-07: all five authoritative lifecycle states are now exercised by the fixtures', () => {
  const exercised = [...new Set(IDENTITY_FX.securities.map((s) => s.lifecycleStatus))].sort();
  assert.deepEqual(exercised, [...LC_STATES].sort(),
    'every authoritative state is carried by at least one fixture security');
  // The vocabulary itself is UNCHANGED — this unit widened coverage, it did not extend the enum.
  assert.deepEqual([...LIFECYCLE_STATES], LC_STATES, 'the lifecycle vocabulary is exactly the accepted five');
  assert.equal(LIFECYCLE_STATES.length, 5, 'no state was added');
  for (const [state, cs] of Object.entries(LC_FIXTURE)) {
    assert.equal(lcSec(cs).lifecycleStatus, state, `${cs} must carry '${state}'`);
  }
  assert.deepEqual(LC_STATES.filter((st) => !IDENTITY_FX.securities.some((s) => s.lifecycleStatus === st)), [],
    'no authoritative state is left unexercised');
});

test('Q/2 — LC-1: each state is carried verbatim through the adapter into the canonical identity ref', () => {
  for (const state of LC_EMITTING) {
    const cs = LC_FIXTURE[state];
    const r = lcSnapshot(cs);
    assert.equal(r.ok, true, `${cs} (${state}) must emit through the sole ingress`);
    assert.equal(r.snapshot.identity.lifecycleStatus, state, 'the state is carried, never rewritten');
    assert.equal(r.snapshot.identity.canonicalSecurityId, cs, 'CS-1: the anchor is the fixture identity');
    assert.ok(LIFECYCLE_STATES.includes(r.snapshot.identity.lifecycleStatus));
    // The state arrives from the P04-shaped register, not from the provider payload.
    assert.equal(r.snapshot.identity.lifecycleStatus, lcSec(cs).lifecycleStatus);
  }
  // 'delisted' at the observation instant is FAIL-CLOSED rather than emitted — see Q/5.
  const delisted = lcSnapshot(LC_FIXTURE.delisted);
  assert.equal(delisted.ok, false,
    'ADP-7: its mapping window closed before the observation instant, so resolution fails closed');
  assert.equal(delisted.failure.code, 'E8');
  assert.equal(delisted.failure.detail.isQualityState, false, 'FC-5: identity failure is not a quality state');
});

test('Q/3 — LC-2: a lifecycle transition never mutates the immutable canonical security ID', () => {
  const anchorId = 'CS-LOCAL-0007';
  const base = lcSec(anchorId);
  const anchors = new Set();
  for (const state of LC_STATES) {
    const ref = buildIdentityRef({
      canonicalSecurityId: base.canonicalSecurityId,
      canonicalIssuerId: base.canonicalIssuerId,
      instrumentType: base.instrumentType,
      lifecycleStatus: state,
      validFrom: base.validFrom,
      ...(base.validTo !== null ? { validTo: base.validTo } : {}),
      externalIdentifiers: base.externalIdentifiers,
    });
    assert.equal(ref.canonicalSecurityId, anchorId, `${state}: the anchor is unchanged`);
    assert.equal(ref.lifecycleStatus, state, 'only the STATE moves');
    anchors.add(ref.canonicalSecurityId);
  }
  assert.equal(anchors.size, 1, 'LC-2: one immutable anchor across all five states');
  // A successor is a NEW canonical identity; it never reuses the predecessor anchor.
  for (const pre of ['CS-LOCAL-0007', 'CS-LOCAL-0008']) {
    const succ = lcSec(pre).successorRef.canonicalSecurityId;
    assert.notEqual(succ, pre, 'a successor is a distinct canonical identity');
    assert.equal(lcSec(succ).lifecycleStatus, 'active', 'the successor is itself active');
  }
});

test('Q/4 — LC-4: merged and superseded REQUIRE an effective-dated successor reference', () => {
  for (const pre of ['CS-LOCAL-0007', 'CS-LOCAL-0008']) {
    const s = lcSec(pre);
    assert.ok(['merged', 'superseded'].includes(s.lifecycleStatus));
    assert.ok(s.successorRef, `${pre} (${s.lifecycleStatus}) must carry a successor reference`);
    assert.equal(typeof s.successorRef.canonicalSecurityId, 'string');
    assert.equal(typeof s.successorRef.effective.from, 'string', 'LC-4: the link is itself effective-dated');
    assert.ok(lcSec(s.successorRef.canonicalSecurityId),
      'the successor must exist in the register — a dangling successor would be an invented identity');
    assert.ok(s.validTo !== null && s.successorRef.effective.from >= s.validTo,
      `${pre}: the successor link is effective no earlier than the predecessor closes (ED-2)`);
  }
  // States that do NOT require a successor must not claim one: a fabricated link would assert a
  // corporate event that never happened.
  for (const s of IDENTITY_FX.securities) {
    if (!['merged', 'superseded'].includes(s.lifecycleStatus)) {
      assert.equal(s.successorRef, undefined,
        `${s.canonicalSecurityId} (${s.lifecycleStatus}) must carry no successor reference`);
    }
  }
});

test('Q/5 — LC-3: retired identities stay resolvable for PIT; outside the window resolution fails closed', () => {
  const reg = lcRegister();
  for (const state of LC_EMITTING) {
    const cs = LC_FIXTURE[state];
    const r = reg.resolveCanonicalToCompany(cs, LC_AS_OF);
    assert.equal(typeof r.companyId, 'string', `${cs} (${state}) remains resolvable — LC-3`);
    assert.equal(r.mappingVersion, IDENTITY_FX.mappingRegisterVersion, 'ADP-4: versioned');
  }
  // A merged predecessor and its successor are DISTINCT securities under ONE companyId.
  const pred = reg.resolveCanonicalToCompany('CS-LOCAL-0007', LC_AS_OF);
  const succ = reg.resolveCanonicalToCompany('CS-LOCAL-0009', LC_AS_OF);
  assert.equal(pred.companyId, succ.companyId, 'MC-2: an expected N:1 projection after a merger');
  const set = reg.resolveCompanyToCanonical(pred.companyId, LC_AS_OF);
  assert.deepEqual([...set].map((x) => x.canonicalSecurityId).sort(), ['CS-LOCAL-0007', 'CS-LOCAL-0009'],
    'MC-4: two DISTINCT securities, never collapsed into one');
  // delisted: resolvable INSIDE its effective window, FAIL-CLOSED outside it.
  assert.equal(reg.resolveCanonicalToCompany('CS-LOCAL-0004', '2023-06-01T00:00:00.000Z').companyId, 'realty-H1');
  assert.throws(
    () => reg.resolveCanonicalToCompany('CS-LOCAL-0004', '2024-06-01T00:00:00.000Z'),
    (e) => e instanceof IdentityResolutionFailure && e.rules.includes('ADP-2') && e.rules.includes('FC-1'),
    'LC-6: an expired window is an explicit failure, never an inferred lifecycle change');
});

test('Q/6 — LC-6: absence of data is never read as a lifecycle change, and absence semantics are state-independent', () => {
  // The three absence semantics must behave IDENTICALLY for every state:
  //   key absent from the payload  => NOT_PROVIDED   (A-20, NL-4)
  //   explicit null in the payload => NULL_ASSERTED  (NL-1)
  //   present                      => PRESENT        (NL-2)
  const expected = {
    'LQ-0001': { 'MD:price.bidSize': 'PRESENT', 'MD:price.askSize': 'PRESENT' },
    'LQ-0002': { 'MD:price.bidSize': 'NOT_PROVIDED', 'MD:price.askSize': 'NOT_PROVIDED' },
    'LQ-0003': { 'MD:price.bidSize': 'NULL_ASSERTED', 'MD:price.askSize': 'NULL_ASSERTED' },
  };
  for (const state of LC_EMITTING) {
    for (const [fid, exp] of Object.entries(expected)) {
      const r = lcSnapshot(LC_FIXTURE[state], { fixtureId: fid });
      assert.equal(r.ok, true, `${state}/${fid} must emit`);
      for (const [k, a] of Object.entries(exp)) {
        assert.equal(r.snapshot.fields[k].availability, a, `${state}/${fid}/${k}`);
        if (a !== 'PRESENT') {
          assert.equal(r.snapshot.fields[k].value, null,
            `NL-3/NL-7: ${a} never carries a substituted value (no zero, no carry-forward)`);
        }
      }
      // LC-6 — the state comes from the identity register, never from payload silence.
      assert.equal(r.snapshot.identity.lifecycleStatus, state,
        'LC-6: missing market data did not turn this instrument into a delisting or any other state');
    }
  }
});

test('Q/7 — D-1/LC-2: snapshot identity does not depend on lifecycle state', () => {
  const ids = new Set();
  for (const state of LC_EMITTING) {
    const r = lcSnapshot(LC_FIXTURE[state]);
    assert.equal(r.ok, true);
    const s = r.snapshot;
    // ST-2 — the snapshotId is a function of (provider, dataVersion, asOf) and nothing else.
    assert.equal(s.snapshotId, buildSnapshotId(s.provider, s.dataVersion, s.asOf));
    // ST-3 — and it is consistent with its own parts.
    assertSnapshotIdConsistent(s.snapshotId,
      { provider: s.provider, dataVersion: s.dataVersion, asOf: s.asOf });
    ids.add(s.snapshotId);
  }
  assert.equal(ids.size, 1,
    'LC-2: a lifecycle transition changes state and relationships, never the snapshot anchor');
  // By construction: lifecycleStatus is not an input to snapshot identity at all.
  assert.equal(buildSnapshotId.length, 3, 'buildSnapshotId takes exactly (provider, dataVersion, asOf)');
  assert.equal(
    buildSnapshotId('mocklive', 'v1', LC_AS_OF),
    buildSnapshotId('mocklive', 'v1', LC_AS_OF),
    'D-1: identical (provider, dataVersion, asOf) => identical snapshotId');
});

test('Q/8 — the widened lifecycle coverage stays deterministic and offline', () => {
  const digests = new Set();
  for (let run = 0; run < 5; run += 1) {
    const parts = [];
    for (const state of LC_EMITTING) {
      // A brand-new adapter instance each time — no shared state between runs.
      const r = lcSnapshot(LC_FIXTURE[state]);
      assert.equal(r.ok, true, `${state} must emit on run ${run}`);
      assert.match(canonicalDigest(r.snapshot), /^[0-9a-f]{64}$/);
      parts.push(canonicalDigest(r.snapshot));
    }
    digests.add(parts.join('|'));
  }
  assert.equal(digests.size, 1, 'D-3: repeated execution across all states is byte-reproducible');
});
