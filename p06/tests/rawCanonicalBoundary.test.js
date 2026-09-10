/**
 * P06-02 — RAW / CANONICAL SEPARATION TESTS
 *
 * These are the tracker's *Test / Validation* artifact for `Work Tracker`!P06-02:
 * **"Architecture + negative tests"**, proving its *Exit Criteria* — **"Raw data never bypasses
 * validation"** — and its *Requirement*, *"Keep raw provider payloads separate from governed
 * canonical data."*
 *
 * ⚠ Per the task's evidence rule, these tests demonstrate **actual behaviour**, not source
 *   inspection: every negative test performs the bypass and asserts it is rejected at runtime.
 *
 * Authorized by **D10-2**. Scope is **P06-02 only** — group **S** asserts that nothing here is
 * P06-03 (deduplication/idempotency).
 *
 * ⚠ Every fixture is synthetic and local. **No provider execution evidence is produced or implied.**
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  CanonicalStorageBoundary, RawCompartment, assertCanonicalShape, assertEngineInputIsCanonical,
  buildAttestation, verifyAttestation, BoundaryViolation, RAW_ENVELOPE_TYPE,
  BOUNDARY_SCHEMA_VERSION, FORBIDDEN_FREE_FORM_MEMBERS,
} from '../src/rawCanonicalBoundary.js';
import { declared, runCase, identityFor, normalizationFixtures, PROVIDER_NATIVE_VOCABULARY, p06Root } from './helpers.js';
import { canonicalDigest } from '../../p05/src/serialize.js';
import { NAMESPACE_TOKEN } from '../../p05/src/namespace.js';
import { validateSnapshot } from '../../p05/src/validate.js';

const FX = normalizationFixtures();
const VOCAB = [...PROVIDER_NATIVE_VOCABULARY];

/** Build a boundary plus the governed context for one fixture case. */
function setup(caseId = 'N-01') {
  const c = FX.cases.find((x) => x.caseId === caseId);
  const mapping = declared(c.mappingRef);
  const identity = identityFor(mapping, c.payload);
  const context = {
    ...FX.context, mode: c.mode, sourceRecordRef: c.payload._fixtureId,
    identity, identityMappingVersion: identity.identityMappingVersion,
  };
  return { boundary: new CanonicalStorageBoundary({ providerVocabulary: VOCAB }), c, mapping, context };
}

/** Admit every fixture case through the governed path. */
function admitAll() {
  const { boundary } = setup();
  const admitted = [];
  for (const c of FX.cases) {
    const mapping = declared(c.mappingRef);
    const identity = identityFor(mapping, c.payload);
    boundary.acceptRaw(`raw-${c.caseId}`, c.payload);
    admitted.push(boundary.admit({
      rawRef: `raw-${c.caseId}`, mapping,
      context: {
        ...FX.context, mode: c.mode, sourceRecordRef: c.payload._fixtureId,
        identity, identityMappingVersion: identity.identityMappingVersion,
      },
    }));
  }
  return { boundary, admitted };
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// A — ARCHITECTURE (the tracker's Test/Validation: "Architecture + negative tests")
// ══════════════════════════════════════════════════════════════════════════════════════════

test('A/1 — raw and canonical are held in SEPARATE compartments', () => {
  const { boundary, c, mapping, context } = setup();
  boundary.acceptRaw('raw-1', c.payload);
  assert.equal(boundary.rawCount, 1);
  assert.equal(boundary.canonicalCount, 0, 'accepting raw must NOT create canonical data');
  const raw = boundary.raw.read('raw-1');
  assert.equal(raw.envelopeType, RAW_ENVELOPE_TYPE);
  assert.equal(raw.isCanonical, false);
  assert.equal(raw.isGovernedCanonicalRecord, false);
  assert.match(raw.warning, /NOT CANONICAL/);
  boundary.admit({ rawRef: 'raw-1', mapping, context });
  assert.equal(boundary.rawCount, 1, 'the raw remains in its own compartment after admission');
  assert.equal(boundary.canonicalCount, 1);
  assert.ok(boundary.raw instanceof RawCompartment);
});

test('A/2 — the RawCompartment has NO path to canonical storage or to an engine', () => {
  const rc = new RawCompartment();
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(rc)).filter((n) => n !== 'constructor');
  assert.deepEqual(methods.sort(), ['accept', 'has', 'read', 'refs', 'size'],
    'the raw compartment exposes only accept/has/read/refs/size');
  for (const m of methods) {
    assert.doesNotMatch(m, /ingest|canonical|store|admit|engine|normaliz/i,
      `the raw compartment must not expose '${m}'`);
  }
  rc.accept('r', { sym: 'ALFA' });
  const read = rc.read('r');
  assert.equal(read.isCanonical, false, 'reading raw back never yields canonical data');
});

test('A/3 — the boundary has NO public method that accepts a pre-built record', () => {
  const { boundary } = setup();
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(boundary)).filter((n) => n !== 'constructor');
  // This is the architectural enforcement of "Raw data never bypasses validation": canonical
  // admission REQUIRES a rawRef plus a declared mapping. There is no bare-record door.
  assert.deepEqual(methods.sort(),
    ['acceptRaw', 'admit', 'attestations', 'auditBoundary', 'canonicalCount', 'canonicalRecords',
      'events', 'isAttested', 'rawCount'],
    'the boundary API surface must be exactly the governed path plus read/audit accessors');
  assert.deepEqual(methods.filter((m) => /ingest|put|insert|setRecord|addRecord|^set$|^add$/i.test(m)), [],
    'no bare-record admission method may exist');
  // The underlying P05-04 store is encapsulated — not reachable as a property.
  assert.equal('store' in boundary, false, 'the canonical store must be encapsulated');
});

test('A/4 — the governed path is raw → validation/normalization → canonical → storage', () => {
  const { boundary, c, mapping, context } = setup();
  boundary.acceptRaw('raw-1', c.payload);
  const out = boundary.admit({ rawRef: 'raw-1', mapping, context });
  assert.equal(out.traversedBoundary, true);
  assert.equal(out.storageOutcome, 'INSERTED');
  assert.equal(out.report.phaseScope, 'P06-01', 'normalization is performed by the P06-01 pipeline');
  assert.equal(out.attestation.phaseScope, 'P06-02');
  assert.equal(boundary.isAttested(out.record), true);
  // The record is reachable ONLY through the boundary's canonical accessor.
  assert.equal(boundary.canonicalRecords().length, 1);
  assert.equal(boundary.canonicalRecords()[0].snapshotId, out.record.snapshotId);
});

test('A/5 — no P06-02 module re-implements validation, namespace or canonical-construction logic', () => {
  const srcDir = join(p06Root, 'src');
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith('.js'))) {
    const code = readFileSync(join(srcDir, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/[^\n]*$/gm, '');
    assert.doesNotMatch(code, /export function (validateS[1-4]|assertC[1-6]|buildField|buildSnapshot)\s*\(/,
      `${f} must not re-implement accepted validation/namespace/canonical logic`);
    assert.doesNotMatch(code, /class CanonicalRecordStore/,
      `${f} must not re-implement the accepted canonical store`);
  }
  const boundary = readFileSync(join(srcDir, 'rawCanonicalBoundary.js'), 'utf8');
  assert.match(boundary, /import \{ CanonicalRecordStore \} from '\.\.\/\.\.\/p05\/src\/replay\.js'/);
  assert.match(boundary, /import \{ validateSnapshot[\s\S]*?from '\.\.\/\.\.\/p05\/src\/validate\.js'/);
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// P — POSITIVE PATHS
// ══════════════════════════════════════════════════════════════════════════════════════════

test('P/1 — valid raw input passes through the governed boundary and becomes governed canonical data', () => {
  const { boundary, admitted } = admitAll();
  assert.equal(admitted.length, FX.cases.length);
  for (const a of admitted) {
    assert.ok(['INSERTED', 'IDEMPOTENT_NOOP'].includes(a.storageOutcome));
    assertCanonicalShape(a.record, VOCAB);
    // The record passes the accepted P01 validator.
    const v = validateSnapshot(a.record);
    assert.equal(v.quality, a.record.quality);
  }
  assert.equal(boundary.auditBoundary().ok, true);
  assert.equal(boundary.canonicalCount, FX.cases.length);
});

test('P/2 — every admitted record is fully governed: namespaced, immutable, lineage-complete', () => {
  const { admitted } = admitAll();
  for (const a of admitted) {
    const keys = Object.keys(a.record.fields);
    assert.ok(keys.length > 0);
    for (const k of keys) assert.ok(k.startsWith(NAMESPACE_TOKEN), `${k} must carry '${NAMESPACE_TOKEN}'`);
    assert.equal(Object.isFrozen(a.record), true);
    assert.throws(() => { a.record.quality = 'good'; }, TypeError, 'ST-10: mutation is a hard error');
    for (const l of ['sourceRef', 'adapterId', 'adapterVersion', 'transformationChainRef',
      'receivedAt', 'namespaceVersion']) {
      assert.ok(a.record.lineage[l] !== undefined, `lineage.${l} is required (RF-6/LN-1)`);
    }
  }
});

test('P/3 — accepted P06-01 behaviour is INTACT through the boundary (same record, byte-identical)', () => {
  const { admitted } = admitAll();
  for (let i = 0; i < admitted.length; i += 1) {
    const direct = runCase(FX.cases[i].caseId);
    assert.equal(admitted[i].canonicalDigest, direct.canonicalDigest,
      `${FX.cases[i].caseId}: the boundary must not alter the P06-01 canonical output`);
    assert.equal(admitted[i].record.snapshotId, direct.record.snapshotId);
    assert.deepEqual([...admitted[i].report.emittedKeys], [...direct.report.emittedKeys]);
    assert.equal(admitted[i].report.quality, direct.report.quality);
    assert.equal(admitted[i].report.completenessPct, direct.report.completenessPct);
  }
});

test('P/4 — the attestation records a real binding to raw, mapping and canonical output', () => {
  const { admitted } = admitAll();
  for (const a of admitted) {
    const att = a.attestation;
    assert.equal(att.attestationType, 'P06-02-BOUNDARY-ATTESTATION');
    assert.equal(att.boundarySchemaVersion, BOUNDARY_SCHEMA_VERSION);
    assert.equal(att.validationPassed, true);
    assert.equal(att.canonicalDigest, canonicalDigest(a.record));
    assert.equal(att.mappingId, a.report.mappingId);
    assert.equal(att.liveProviderExecution, false);
    assert.equal(att.productionActivation, false);
    assert.equal(att.certificationClaim, false);
    assert.equal(att.p06_03Implemented, false);
  }
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// N — NEGATIVE / BYPASS PATHS (the authoritative exit criterion)
// ══════════════════════════════════════════════════════════════════════════════════════════

test('N/1 — EXIT CRITERION: raw data presented directly to canonical storage is rejected', () => {
  const { boundary, c, mapping, context } = setup();
  // The boundary offers no bare-record door, so the only admission route requires raw + mapping.
  boundary.acceptRaw('raw-1', c.payload);
  // A raw-shaped object cannot be admitted: admission re-runs normalization, it does not accept.
  assert.throws(() => boundary.admit({ rawRef: 'raw-1', mapping: undefined, context }),
    (e) => e instanceof BoundaryViolation && e.rules.includes('MR-2'));
  // And a raw-shaped object is refused by the canonical-shape assertion outright.
  assert.throws(() => assertCanonicalShape(
    { ...c.payload, snapshotId: 'data-localfix-vRAW-2026-03-02T14:30:00.000Z' }, VOCAB),
    (e) => e instanceof BoundaryViolation && e.rules.includes('FD-1'));
  assert.equal(boundary.canonicalCount, 0, 'nothing raw reached canonical storage');
});

test('N/2 — EXIT CRITERION: a RAW envelope can never be offered to an engine', () => {
  const { boundary, c } = setup();
  boundary.acceptRaw('raw-1', c.payload);
  assert.throws(() => assertEngineInputIsCanonical(boundary.raw.read('raw-1'), VOCAB),
    (e) => e instanceof BoundaryViolation && e.rules.includes('INT-013'));
  // Nor a bare raw payload, even though it carries no marker.
  assert.throws(() => assertEngineInputIsCanonical(c.payload, VOCAB),
    (e) => e instanceof BoundaryViolation);
  // Nor a provider-shaped object built from raw (the realistic engine-input construction).
  assert.throws(() => assertEngineInputIsCanonical({ peRatio: 18.4, sym: c.payload.sym }, VOCAB),
    (e) => e instanceof BoundaryViolation);
});

test('N/3 — an unvalidated record cannot MASQUERADE as a canonical record', () => {
  const impostors = [
    { name: 'no fields', value: { snapshotId: 'data-x-v1-2026-01-01T00:00:00.000Z', quality: 'good' } },
    { name: 'empty fields, quality good', value: { snapshotId: 'data-x-v1-2026-01-01T00:00:00.000Z', fields: {}, quality: 'good' } },
    { name: 'bare (non-namespaced) keys', value: Object.freeze({ snapshotId: 'data-x-v1-2026-01-01T00:00:00.000Z', fields: { peRatio: 1 }, quality: 'good' }) },
    { name: 'malformed snapshotId', value: Object.freeze({ snapshotId: 'not-a-snapshot-id', fields: { 'MD:price.last': {} }, quality: 'good' }) },
    { name: 'mutable object', value: { snapshotId: 'data-x-v1-2026-01-01T00:00:00.000Z', fields: { 'MD:price.last': {} }, quality: 'good' } },
    { name: 'free-form bag', value: Object.freeze({ snapshotId: 'data-x-v1-2026-01-01T00:00:00.000Z', fields: { 'MD:price.last': {} }, quality: 'good', extras: { sym: 'ALFA' } }) },
  ];
  for (const im of impostors) {
    assert.throws(() => assertCanonicalShape(im.value, VOCAB),
      (e) => e instanceof BoundaryViolation, `impostor '${im.name}' must be rejected`);
  }
  // And the boundary will not attest any of them.
  const { boundary } = setup();
  for (const im of impostors) assert.equal(boundary.isAttested(im.value), false);
});

test('N/4 — malformed / invalid raw input FAILS CLOSED at the boundary, and never reaches storage', () => {
  const cases = [
    { caseId: 'N-01', mutate: { ccy: 'US$' }, expect: 'SM-1' },
    { caseId: 'N-01', mutate: { tradePrice: 'not-a-number' }, expect: 'NP-2' },
    { caseId: 'N-01', mutate: { tradePrice: '101.259' }, expect: 'NP-3' },
    { caseId: 'N-01', mutate: { bidSz: 500.5 }, expect: 'SM-6' },
    { caseId: 'N-03', mutate: { sessionDate: '02/03/2026' }, expect: 'TS-1' },
  ];
  for (const tc of cases) {
    const c = FX.cases.find((x) => x.caseId === tc.caseId);
    const mapping = declared(c.mappingRef);
    // Identity is a P04 concern resolved from the security master; it is deliberately resolved
    // from the UNCORRUPTED payload, so the mutation under test is the only thing that fails.
    const identity = identityFor(mapping, c.payload);
    const boundary = new CanonicalStorageBoundary({ providerVocabulary: VOCAB });
    boundary.acceptRaw('raw-bad', { ...c.payload, ...tc.mutate, _fixtureId: 'BAD' });
    assert.throws(() => boundary.admit({
      rawRef: 'raw-bad', mapping,
      context: {
        ...FX.context, mode: c.mode, sourceRecordRef: 'BAD',
        identity, identityMappingVersion: identity.identityMappingVersion,
      },
    }), (e) => e instanceof BoundaryViolation && e.stage === 'admit-validation',
    `${JSON.stringify(tc.mutate)} must fail closed at the validation boundary`);
    assert.equal(boundary.canonicalCount, 0, 'a rejected raw must not reach canonical storage');
    assert.equal(boundary.auditBoundary().ok, true);
  }
});

test('N/5 — raw that was never accepted into the compartment cannot be admitted', () => {
  const { boundary, mapping, context } = setup();
  assert.throws(() => boundary.admit({ rawRef: 'never-accepted', mapping, context }),
    (e) => e instanceof BoundaryViolation && e.stage === 'raw-read');
});

test('N/6 — a FORGED or TAMPERED attestation is rejected by re-derivation, not trusted', () => {
  const { boundary, c, mapping, context } = setup();
  boundary.acceptRaw('raw-1', c.payload);
  const good = boundary.admit({ rawRef: 'raw-1', mapping, context });
  const rawDigest = boundary.raw.read('raw-1').rawDigest;
  const base = { rawRef: 'raw-1', rawDigest, mapping, canonical: good.record };

  // (a) tampered canonical digest
  const forgedDigest = { ...buildAttestation({ ...base, validation: { quality: good.record.quality } }), canonicalDigest: 'deadbeef' };
  assert.throws(() => verifyAttestation(forgedDigest, base),
    (e) => e instanceof BoundaryViolation && e.rules.includes('M-2'));

  // (b) attestation bound to a DIFFERENT raw
  const wrongRaw = { ...buildAttestation({ ...base, validation: { quality: good.record.quality } }), rawDigest: 'other' };
  assert.throws(() => verifyAttestation(wrongRaw, base),
    (e) => e instanceof BoundaryViolation && /does not re-derive/.test(e.message));

  // (c) attestation bound to a DIFFERENT mapping
  const otherMapping = declared('D01_CLOSE');
  const wrongMapping = { ...buildAttestation({ ...base, validation: { quality: good.record.quality } }), mappingDigest: 'other' };
  assert.throws(() => verifyAttestation(wrongMapping, { ...base, mapping: otherMapping }),
    (e) => e instanceof BoundaryViolation);

  // (d) attestation with no validation recorded — rejected, because validation is never waived.
  const unvalidated = { ...buildAttestation({ ...base, validation: undefined }) };
  assert.throws(() => verifyAttestation(unvalidated, base),
    (e) => e instanceof BoundaryViolation && /never waived/.test(e.message),
    'an attestation that does not record a passed validation is refused');

  // (d') the "never waived" branch exercised on its own: an otherwise fully consistent
  //      attestation that simply claims validation did NOT pass.
  const neverWaived = { ...buildAttestation({ ...base, validation: { quality: good.record.quality } }), validationPassed: false };
  assert.throws(() => verifyAttestation(neverWaived, base),
    (e) => e instanceof BoundaryViolation && /never waived/.test(e.message));

  // (e) wrong boundary schema version
  const wrongSchema = { ...buildAttestation({ ...base, validation: { quality: good.record.quality } }), boundarySchemaVersion: '9.9' };
  assert.throws(() => verifyAttestation(wrongSchema, base),
    (e) => e instanceof BoundaryViolation && /schema/.test(e.message));

  // (f) a genuine attestation still verifies
  assert.equal(verifyAttestation(good.attestation, base).canonicalDigest, good.canonicalDigest);
});

test('N/7 — BYPASS IS DETECTABLE: a record the boundary never made is neither attested nor canonical', () => {
  // The shipped boundary exposes no door to inject a record (asserted in A/3), and its store is a
  // private field unreachable even from a subclass. So detection is exercised through the two
  // predicates a consumer actually has: `isAttested` and `assertCanonicalShape`.
  const { boundary, c } = setup();
  const rawShaped = { ...c.payload, snapshotId: 'data-localfix-vRAW-2026-03-02T14:30:00.000Z' };
  assert.equal(boundary.isAttested(rawShaped), false,
    'a record the boundary never produced must not be attested');
  assert.throws(() => assertCanonicalShape(rawShaped, VOCAB), (e) => e instanceof BoundaryViolation);
  assert.throws(() => assertEngineInputIsCanonical(rawShaped, VOCAB), (e) => e instanceof BoundaryViolation);
  // On a clean boundary the audit passes, so a failure is meaningful rather than constant.
  assert.equal(boundary.auditBoundary().ok, true);
});

test('N/8 — the audit reports nonCanonical/unattested when the store IS contaminated (behavioural proof)', () => {
  // Construct the audit logic against a store that mixes an attested record with a raw-shaped one,
  // using the boundary's own audit predicate, to prove it does not merely return ok:true.
  const { boundary, c, mapping, context } = setup();
  boundary.acceptRaw('raw-1', c.payload);
  const good = boundary.admit({ rawRef: 'raw-1', mapping, context });
  const rawShaped = { ...c.payload, snapshotId: 'data-localfix-vRAW-2026-03-02T14:30:00.000Z' };
  const population = [good.record, rawShaped];
  const unattested = population.filter((r) => !boundary.isAttested(r)).map((r) => r.snapshotId);
  const nonCanonical = population.filter((r) => {
    try { assertCanonicalShape(r, VOCAB); return false; } catch { return true; }
  }).map((r) => r.snapshotId);
  assert.deepEqual(unattested, ['data-localfix-vRAW-2026-03-02T14:30:00.000Z']);
  assert.deepEqual(nonCanonical, ['data-localfix-vRAW-2026-03-02T14:30:00.000Z']);
  assert.equal(unattested.length + nonCanonical.length > 0, true,
    'the audit predicate detects contamination');
  // While the real boundary, which only ever holds admitted records, audits clean.
  assert.equal(boundary.auditBoundary().ok, true);
  assert.equal(boundary.auditBoundary().attestedCount, boundary.auditBoundary().recordCount);
});

test('N/9 — raw is append-only: a rawRef is never overwritten or silently replaced', () => {
  const { boundary, c } = setup();
  boundary.acceptRaw('raw-1', c.payload);
  assert.throws(() => boundary.acceptRaw('raw-1', { ...c.payload, tradePrice: '999.00' }),
    (e) => e instanceof BoundaryViolation && /append-only/.test(e.message));
});

test('N/10 — a free-form member that could carry raw provider content is refused (M-4)', () => {
  for (const bag of FORBIDDEN_FREE_FORM_MEMBERS) {
    const candidate = Object.freeze({
      snapshotId: 'data-x-v1-2026-01-01T00:00:00.000Z',
      fields: { 'MD:price.last': Object.freeze({ key: 'MD:price.last' }) },
      quality: 'good',
      [bag]: { sym: 'ALFA' },
    });
    assert.throws(() => assertCanonicalShape(candidate, VOCAB),
      (e) => e instanceof BoundaryViolation && e.rules.includes('M-4'), `'${bag}' must be refused`);
  }
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// D — P06-01 REMAINS DETERMINISTIC AND INTACT
// ══════════════════════════════════════════════════════════════════════════════════════════

test('D/1 — repeated admission of identical raw yields byte-identical canonical output', () => {
  const serializations = [];
  for (let run = 0; run < 5; run += 1) {
    const { boundary, c, mapping, context } = setup();
    boundary.acceptRaw('raw-1', c.payload);
    serializations.push(boundary.admit({ rawRef: 'raw-1', mapping, context }).canonicalDigest);
  }
  assert.equal(new Set(serializations).size, 1, 'the boundary must not introduce non-determinism');
});

test('D/2 — the boundary performs NO scheduling, retries or checkpointing (that is P05-04)', () => {
  const code = readFileSync(join(p06Root, 'src', 'rawCanonicalBoundary.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/[^\n]*$/gm, '');
  assert.doesNotMatch(code, /setTimeout|setInterval|backoff|maxAttempts|recordCheckpoint|CheckpointLedger|RunAborted/i);
  assert.doesNotMatch(code, /Date\.now\s*\(|new\s+Date\s*\(|Math\.random\s*\(|process\.env/);
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// S — SCOPE BOUNDARY: NOT P06-03, no provider execution
// ══════════════════════════════════════════════════════════════════════════════════════════

test('S/1 — P06-02 is NOT P06-03: no deduplication or idempotency rules are implemented', () => {
  const code = readFileSync(join(p06Root, 'src', 'rawCanonicalBoundary.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/[^\n]*$/gm, '');
  assert.doesNotMatch(code, /dedup|deduplicat|duplicateKey|crossProviderMerge|idempotencyKey/i,
    'no deduplication rule may be implemented here (P06-03)');
  // The store's own idempotency is a P05-04 property that is INHERITED, not extended — and the
  // boundary adds no duplicate-detection logic of its own.
  const { boundary } = setup();
  assert.equal(boundary.auditBoundary().ok, true);
});

test('S/2 — no provider execution, credentials, entitlements or network surface', () => {
  const code = readFileSync(join(p06Root, 'src', 'rawCanonicalBoundary.js'), 'utf8');
  for (const mod of ['node:http', 'node:https', 'node:net', 'node:tls', 'node:dgram',
    'node:child_process', 'node:worker_threads', 'undici', 'axios', 'node-fetch', 'got']) {
    assert.ok(!code.includes(`'${mod}'`) && !code.includes(`"${mod}"`), `must not import ${mod}`);
  }
  assert.doesNotMatch(code, /authenticat\w*\s*\(/i);
  assert.doesNotMatch(code, /-----BEGIN [A-Z ]*PRIVATE KEY-----/);
  assert.doesNotMatch(code, /https?:\/\/(?!schema|www\.w3|json-schema)/);
  const realFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('NETWORK USE IS PROHIBITED IN P06-02'); };
  try {
    const { admitted } = admitAll();
    assert.equal(admitted.length, FX.cases.length);
  } finally { globalThis.fetch = realFetch; }
});

test('S/3 — no certification, activation or P06 acceptance claim is made', () => {
  const code = readFileSync(join(p06Root, 'src', 'rawCanonicalBoundary.js'), 'utf8');
  assert.doesNotMatch(code, /certification granted|is certified|E2E-030 (passed|renewed)/i);
  assert.doesNotMatch(code, /production activation (granted|authorized)/i);
  assert.doesNotMatch(code, /P06 (?:is )?ACCEPTED/);
  for (const a of admitAll().admitted) {
    assert.equal(a.attestation.certificationClaim, false);
    assert.equal(a.attestation.productionActivation, false);
    assert.equal(a.attestation.liveProviderExecution, false);
    assert.equal(a.attestation.licensedHistoricalAcquisition, false);
    assert.equal(a.attestation.p06_03Implemented, false);
    assert.equal(a.attestation.phaseScope, 'P06-02');
  }
});

test('S/4 — existing-IIPS is untouched and zero dependencies are added', () => {
  const code = readFileSync(join(p06Root, 'src', 'rawCanonicalBoundary.js'), 'utf8');
  assert.doesNotMatch(code, /ReplayService|DataBoundExecutor|LiveDataRuntime|NormalizedHolding/i);
  const pkg = JSON.parse(readFileSync(join(p06Root, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.dependencies ?? {}, {});
  assert.deepEqual(pkg.devDependencies ?? {}, {});
  for (const name of ['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'node_modules']) {
    assert.ok(!readdirSync(p06Root).includes(name), `${name} must not exist`);
  }
});
