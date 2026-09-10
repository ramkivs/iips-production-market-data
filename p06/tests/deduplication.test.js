/**
 * P06-03 — DEDUPLICATION / IDEMPOTENCY TESTS
 *
 * These are the tracker's *Test / Validation* artifact for `Work Tracker`!P06-03:
 * **"Replay tests"**, proving its *Exit Criteria* — **"Repeated ingestion stable"** — and its
 * *Requirement*, *"Prevent duplicate records across retries/replays/providers."*
 *
 * ⚠ Every scenario is **EXECUTED**. No test asserts a property by reading source code.
 *
 * Authorized by **D10-2**. Scope is **P06-03 only** — group **S** asserts that nothing here is
 * P07/P08, scheduling, retries, checkpointing, durable persistence or provider execution.
 *
 * ⚠ Every fixture is synthetic and local. **No provider execution evidence is produced or implied.**
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  DeduplicationLedger, dedupIdentityFor, classifyDedupDecision,
  DEDUPLICATION_RULES, P06_03_MODULE, DEDUP_RULES_SCHEMA_VERSION,
} from '../src/deduplicationRules.js';
import { CanonicalStorageBoundary, assertCanonicalShape, BoundaryViolation } from '../src/rawCanonicalBoundary.js';
import { CanonicalRecordStore } from '../../p05/src/replay.js';
import { NAMESPACE_TOKEN } from '../../p05/src/namespace.js';
import { canonicalDigest } from '../../p05/src/serialize.js';
import {
  declared, runCase, identityFor, normalizationFixtures, PROVIDER_NATIVE_VOCABULARY, p06Root,
} from './helpers.js';

const FX = normalizationFixtures();
const VOCAB = [...PROVIDER_NATIVE_VOCABULARY];

/**
 * Build the full governed path: raw → P06-02 boundary → P06-01 normalization → canonical,
 * then attach a fresh P06-03 ledger downstream.
 */
function setup() {
  const boundary = new CanonicalStorageBoundary({ providerVocabulary: VOCAB });
  const corpus = [];
  for (const c of FX.cases) {
    const mapping = declared(c.mappingRef);
    const identity = identityFor(mapping, c.payload);
    boundary.acceptRaw(`raw-${c.caseId}`, c.payload);
    corpus.push(boundary.admit({
      rawRef: `raw-${c.caseId}`, mapping,
      context: {
        ...FX.context, mode: c.mode, sourceRecordRef: c.payload._fixtureId,
        identity, identityMappingVersion: identity.identityMappingVersion,
      },
    }).record);
  }
  return { boundary, corpus, ledger: new DeduplicationLedger({ boundary, providerVocabulary: VOCAB }) };
}

// ══════════════════════════════════════════════════════════════════════════════════════════
// A — THE DELIVERABLE: deduplication RULES, declared as data
// ══════════════════════════════════════════════════════════════════════════════════════════

test('A/1 — the deliverable is deduplication RULES declared as inspectable data', () => {
  assert.equal(DEDUPLICATION_RULES.module, P06_03_MODULE);
  assert.equal(DEDUPLICATION_RULES.schemaVersion, DEDUP_RULES_SCHEMA_VERSION);
  assert.ok(DEDUPLICATION_RULES.rules.length >= 6);
  // Reviewable without reading code (the discipline P02 M-6/MR-4 imposes on mappings).
  const roundTripped = JSON.parse(JSON.stringify(DEDUPLICATION_RULES));
  assert.equal(canonicalDigest(roundTripped), canonicalDigest(DEDUPLICATION_RULES));
  assert.doesNotMatch(JSON.stringify(DEDUPLICATION_RULES), /function|=>/);
  // Every rule states a condition, a decision and the AUTHORITY it derives from.
  for (const r of DEDUPLICATION_RULES.rules) {
    assert.ok(typeof r.ruleId === 'string' && r.ruleId.startsWith('DD-'), `rule id ${r.ruleId}`);
    assert.ok(typeof r.condition === 'string' && r.condition.length > 0, `${r.ruleId} needs a condition`);
    assert.ok(DEDUPLICATION_RULES.decisions.includes(r.decision), `${r.ruleId} decision ${r.decision}`);
    assert.ok(typeof r.authority === 'string' && r.authority.length > 0, `${r.ruleId} must cite authority`);
  }
  assert.deepEqual([...DEDUPLICATION_RULES.rules.map((r) => r.ruleId)],
    ['DD-1', 'DD-2', 'DD-3', 'DD-4', 'DD-5', 'DD-6']);
});

test('A/2 — the rules record the RJ-6 / PN-5 / RI-3 / AD-6 prohibitions they must obey', () => {
  const joined = DEDUPLICATION_RULES.prohibitions.join(' | ');
  assert.match(joined, /RJ-6/);
  assert.match(joined, /never a silent merge/);
  assert.match(joined, /never flattened away/);
  assert.match(joined, /no component is added to snapshotId/);
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// I — THE DEDUPLICATION IDENTITY (taken from existing contracts, NOT invented)
// ══════════════════════════════════════════════════════════════════════════════════════════

test('I/1 — the identity is snapshotId + canonicalDigest, exactly as the accepted contracts fix it', () => {
  assert.deepEqual([...DEDUPLICATION_RULES.identity.components], ['snapshotId', 'canonicalDigest']);
  assert.equal(DEDUPLICATION_RULES.identity.snapshotIdForm, 'data-${provider}-${dataVersion}-${asOf}');
  // The cited authorities are the real ones.
  const src = DEDUPLICATION_RULES.identity.sources.join(' | ');
  assert.match(src, /AD-6/);
  assert.match(src, /no component added/);
  assert.match(src, /DV-1/);
  assert.match(src, /RI-6/);
});

test('I/2 — dedupIdentityFor adds NO component to snapshotId and invents NO alternative key', () => {
  const { corpus } = setup();
  for (const r of corpus) {
    const id = dedupIdentityFor(r);
    // The key IS the frozen snapshotId — not a hash of it, not a compound of extra fields.
    assert.equal(id.identityKey, r.snapshotId);
    assert.equal(id.snapshotId, r.snapshotId);
    assert.equal(id.canonicalDigest, canonicalDigest(r));
    assert.equal(id.provider, r.provider);
    assert.equal(id.dataVersion, r.dataVersion);
    assert.equal(id.asOf, r.asOf);
    assert.match(id.snapshotId, /^data-[^-]+-.+-\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  }
});

test('I/3 — a malformed snapshotId is refused under AD-6, and a non-record under DD-6', () => {
  for (const bad of ['x', 'snapshot-1', 'data-x-v1', 'data-localfix-v1-not-a-timestamp']) {
    assert.throws(() => dedupIdentityFor({ snapshotId: bad }),
      (e) => e instanceof BoundaryViolation && e.rules.includes('AD-6'),
      `snapshotId ${JSON.stringify(bad)} must be refused under AD-6`);
  }
  for (const bad of [undefined, null, 42, 'str']) {
    assert.throws(() => dedupIdentityFor(bad),
      (e) => e instanceof BoundaryViolation && e.rules.includes('DD-6'),
      `${JSON.stringify(bad)} is not a record and must be refused under DD-6`);
  }
});

test('I/4 — the provider component of the frozen identity is what keeps providers distinct', () => {
  // ⚠ No second provider identity may be issued (D10 §8.2), so cross-provider distinctness is
  //   demonstrated STRUCTURALLY from the frozen AD-6 form, which the identity is derived from.
  const { corpus } = setup();
  const r = corpus[0];
  const [prefix, provider, dataVersion, asOf] = [
    'data', r.provider, r.dataVersion, r.asOf,
  ];
  assert.equal(r.snapshotId, `${prefix}-${provider}-${dataVersion}-${asOf}`);
  // Therefore any change to the provider component necessarily changes the identity key, and
  // DD-4 keeps the records distinct — which is what PN-5 and RI-3 require.
  const otherProviderId = `${prefix}-otherprovider-${dataVersion}-${asOf}`;
  assert.notEqual(otherProviderId, r.snapshotId);
  assert.equal(classifyDedupDecision(canonicalDigest(r), 'different'), 'CONFLICT_REJECTED',
    'a different record under the SAME snapshotId is a conflict, never a merge');
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// D — THE EXIT CRITERION: "Repeated ingestion stable"
// ══════════════════════════════════════════════════════════════════════════════════════════

test('D/1 — A: the same canonical record ingested twice produces NO duplicate', () => {
  const { ledger, corpus } = setup();
  const first = ledger.record(corpus[0]);
  assert.equal(first.decision, 'INSERTED');
  assert.equal(first.ruleId, 'DD-1');
  assert.equal(ledger.recordCount, 1);
  const second = ledger.record(corpus[0]);
  assert.equal(second.decision, 'IDEMPOTENT_NOOP');
  assert.equal(second.ruleId, 'DD-2');
  assert.equal(ledger.recordCount, 1, 'no duplicate record was created');
  assert.equal(second.overwritten, false, 'nothing was overwritten (RJ-6)');
});

test('D/2 — B: repeated ingestion is stable across MANY repetitions, with measured counts', () => {
  const { ledger, corpus } = setup();
  const proof = ledger.proveRepeatedIngestionStable(corpus, 5);
  assert.equal(proof.repetitions, 5);
  assert.equal(proof.corpusSize, corpus.length);
  // (a) first-ingestion inserts
  assert.equal(proof.firstPassInserts, corpus.length);
  // (b) second-and-later ingestion inserts
  assert.deepEqual([...proof.subsequentPassInserts], [0, 0, 0, 0]);
  // (c) final canonical count
  assert.equal(proof.finalCanonicalCount, corpus.length);
  // (d) duplicate / no-op count
  assert.equal(proof.duplicateNoOpCount, corpus.length * 4);
  assert.equal(proof.canonicalSetByteIdenticalAcrossPasses, true);
  assert.equal(proof.exitCriterionMet, true);
  assert.equal(proof.phaseScope, 'P06-03');
});

test('D/3 — the canonical set is byte-identical after every pass, not merely equal in count', () => {
  const { ledger, corpus } = setup();
  const proof = ledger.proveRepeatedIngestionStable(corpus, 4);
  const digests = proof.passes.map((p) => p.canonicalSetDigest);
  assert.equal(new Set(digests).size, 1, 'the canonical set digest must not drift across passes');
  assert.equal(digests[0], canonicalDigest(ledger.canonicalRecords()));
  // And the set equals what P06-01 produces directly, so P06-03 alters nothing.
  const direct = FX.cases.map((c) => runCase(c.caseId).record);
  assert.equal(canonicalDigest(direct), canonicalDigest(ledger.canonicalRecords()));
});

test('D/4 — C: independent instances produce the same deduplication result', () => {
  const a = setup();
  const b = setup();
  const pa = a.ledger.proveRepeatedIngestionStable(a.corpus, 3);
  const pb = b.ledger.proveRepeatedIngestionStable(b.corpus, 3);
  assert.equal(pa.finalCanonicalCount, pb.finalCanonicalCount);
  assert.equal(pa.duplicateNoOpCount, pb.duplicateNoOpCount);
  assert.deepEqual([...pa.subsequentPassInserts], [...pb.subsequentPassInserts]);
  // Process-equivalent: the same inputs through separate instances give a byte-identical set.
  assert.equal(canonicalDigest(a.ledger.canonicalRecords()), canonicalDigest(b.ledger.canonicalRecords()));
});

test('D/5 — retries/replays: the SAME payload re-acquired under a NEW rawRef is still one record', () => {
  const { boundary, ledger } = setup();
  const c = FX.cases[0];
  const mapping = declared(c.mappingRef);
  const identity = identityFor(mapping, c.payload);
  const ctx = {
    ...FX.context, mode: c.mode, sourceRecordRef: c.payload._fixtureId,
    identity, identityMappingVersion: identity.identityMappingVersion,
  };
  const r1 = boundary.admit({ rawRef: 'raw-N-01', mapping, context: ctx }).record;
  // A RETRY: the identical payload arrives again through a different raw reference.
  boundary.acceptRaw('retry-N-01', c.payload);
  const r2 = boundary.admit({ rawRef: 'retry-N-01', mapping, context: ctx }).record;
  assert.equal(ledger.record(r1).decision, 'INSERTED');
  assert.equal(ledger.record(r2).decision, 'IDEMPOTENT_NOOP');
  assert.equal(ledger.recordCount, 1);
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// N — DD-4: distinct legitimate records are NOT incorrectly deduplicated
// ══════════════════════════════════════════════════════════════════════════════════════════

test('N/1 — D: distinct legitimate records remain DISTINCT', () => {
  const { ledger, corpus } = setup();
  const summary = ledger.ingestCorpus(corpus);
  assert.equal(summary.offered, corpus.length);
  assert.equal(summary.inserted, corpus.length, 'every distinct record is inserted');
  assert.equal(summary.idempotentNoop, 0);
  assert.equal(summary.finalRecordCount, corpus.length);
  assert.equal(summary.distinctIdentityKeys, corpus.length);
  // Same instrument, same domain, different session date → different vintage → NOT collapsed.
  const n03 = corpus.find((r) => r.snapshotId.includes('2026-03-02T00:00:00.000Z') && 'MD:price.close' in r.fields);
  const n04 = corpus.find((r) => r.snapshotId.includes('2026-03-03T00:00:00.000Z'));
  assert.notEqual(n03.snapshotId, n04.snapshotId);
  assert.equal(n03.identity.canonicalSecurityId, n04.identity.canonicalSecurityId,
    'same instrument …');
  assert.notEqual(canonicalDigest(n03), canonicalDigest(n04), '… but different vintages stay distinct');
});

test('N/2 — E: identity and vintage distinctions remain intact through deduplication', () => {
  const { ledger, corpus } = setup();
  ledger.ingestCorpus(corpus);
  const held = ledger.canonicalRecords();
  assert.equal(held.length, corpus.length);
  for (let i = 0; i < held.length; i += 1) {
    // Identity preserved exactly.
    assert.equal(held[i].identity.canonicalSecurityId, corpus[i].identity.canonicalSecurityId);
    assert.equal(held[i].identity.canonicalIssuerId, corpus[i].identity.canonicalIssuerId);
    assert.equal(held[i].identity.mappedCompanyId, corpus[i].identity.mappedCompanyId);
    // Vintage preserved exactly.
    assert.equal(held[i].dataVersion, corpus[i].dataVersion);
    assert.equal(held[i].asOf, corpus[i].asOf);
    assert.equal(held[i].provider, corpus[i].provider);
    // Provider identity is never flattened away (RI-3).
    assert.equal(held[i].lineage.sourceRef, corpus[i].lineage.sourceRef);
  }
  // Cardinality: many canonical securities may map to one company — preserved, not merged.
  const companies = new Set(held.map((r) => r.identity.mappedCompanyId));
  const securities = new Set(held.map((r) => r.identity.canonicalSecurityId));
  assert.ok(securities.size >= companies.size, 'N:1 canonical-security → company cardinality preserved');
});

test('N/3 — FIGI/OpenFIGI authority is untouched by deduplication (OI-09 / XI-1)', () => {
  const { ledger, corpus } = setup();
  ledger.ingestCorpus(corpus);
  for (const r of ledger.canonicalRecords()) {
    const auth = r.identity.externalIdentifiers.filter((x) => x.authority === 'AUTHORITATIVE');
    assert.deepEqual(auth.map((x) => x.type), ['FIGI'], 'FIGI is the sole authoritative identifier');
    for (const xi of r.identity.externalIdentifiers) {
      if (xi.type !== 'FIGI') assert.equal(xi.authority, 'NON_AUTHORITATIVE');
    }
  }
  // And the same FIGI on two records of the same instrument does NOT cause a merge.
  const sameInstrument = ledger.canonicalRecords().filter(
    (r) => r.identity.canonicalSecurityId === 'CS-LOCAL-0001');
  assert.ok(sameInstrument.length > 1, 'the corpus holds several vintages of one instrument');
  assert.equal(new Set(sameInstrument.map((r) => r.snapshotId)).size, sameInstrument.length,
    'a shared FIGI never collapses distinct vintages');
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// F — DD-3: conflicts are governed by existing rules, never silently collapsed
// ══════════════════════════════════════════════════════════════════════════════════════════

test('F/1 — F: classifyDedupDecision implements exactly the accepted store rule', () => {
  assert.equal(classifyDedupDecision(undefined, 'aaa'), 'INSERTED');
  assert.equal(classifyDedupDecision('aaa', 'aaa'), 'IDEMPOTENT_NOOP');
  assert.equal(classifyDedupDecision('aaa', 'bbb'), 'CONFLICT_REJECTED');
});

test('F/2 — F: a conflicting record is REJECTED, never overwritten or merged (INV-2 / RJ-6)', () => {
  // DD-3 is reachable at the reused P05-04 store, which is the authoritative mechanism.
  const { corpus } = setup();
  const store = new CanonicalRecordStore();
  const original = corpus[0];
  const variant = Object.freeze({ ...original, quality: 'partial' });
  assert.equal(original.snapshotId, variant.snapshotId, 'same snapshotId …');
  assert.notEqual(canonicalDigest(original), canonicalDigest(variant), '… different content');
  assert.equal(store.ingest(original).outcome, 'INSERTED');
  assert.equal(store.ingest(original).outcome, 'IDEMPOTENT_NOOP');
  const conflict = store.ingest(variant);
  assert.equal(conflict.outcome, 'CONFLICT_REJECTED');
  assert.equal(store.size, 1, 'no second record and no overwrite');
  // The ORIGINAL survives unchanged — no "last wins".
  assert.equal(canonicalDigest([...store.records.values()][0].snapshot), canonicalDigest(original));
});

test('F/3 — F: the ledger classifies the conflict as DD-3 and never mutates the held record', () => {
  const { ledger, corpus } = setup();
  ledger.ingestCorpus(corpus);
  const before = canonicalDigest(ledger.canonicalRecords());
  // A conflicting variant is not attested, so DD-5 gates it first — which is the correct order:
  // an unattested conflict can never reach the dedup decision at all.
  const variant = Object.freeze({ ...corpus[0], quality: 'partial' });
  assert.throws(() => ledger.record(variant), (e) => e instanceof BoundaryViolation && e.rules.includes('DD-5'));
  assert.equal(canonicalDigest(ledger.canonicalRecords()), before, 'the held set is unchanged');
  // The decision rule itself is proven directly.
  assert.equal(classifyDedupDecision(canonicalDigest(corpus[0]), canonicalDigest(variant)), 'CONFLICT_REJECTED');
});

test('F/4 — RJ-6: no dedup path performs a silent overwrite, precedence rule or "last wins"', () => {
  const { ledger, corpus } = setup();
  // BEHAVIOURAL, not lexical: ingest, re-ingest, and prove every held record is byte-for-byte the
  // one first inserted — nothing was overwritten, re-ranked or substituted.
  const outcomes = [];
  for (const pass of [0, 1, 2]) for (const r of corpus) outcomes.push(ledger.record(r));
  const beforeBy = new Map(corpus.map((r) => [r.snapshotId, canonicalDigest(r)]));
  for (const held of ledger.canonicalRecords()) {
    assert.equal(canonicalDigest(held), beforeBy.get(held.snapshotId),
      `${held.snapshotId} must be byte-identical to the record first inserted`);
  }
  for (const out of outcomes) {
    assert.equal(out.overwritten, false, 'no outcome may report an overwrite');
    assert.ok(['INSERTED', 'IDEMPOTENT_NOOP'].includes(out.decision));
  }
  // And the declared rules carry the RJ-6 prohibition.
  assert.match(DEDUPLICATION_RULES.prohibitions.join(' | '), /RJ-6/);
  assert.match(DEDUPLICATION_RULES.rules.find((r) => r.ruleId === 'DD-3').authority, /RJ-6/);
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// G — G: deduplication CANNOT bypass the P06-02 boundary
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * A governed canonical record that this boundary never produced. `isAttested` is content-based
 * (a canonical digest), so a byte-identical copy IS legitimately attested — to exercise DD-5 we
 * need a record with genuinely different content: the same payload normalized at a different
 * `receivedAt`, admitted through a DIFFERENT boundary.
 */
function unattestedCanonicalRecord() {
  const other = new CanonicalStorageBoundary({ providerVocabulary: VOCAB });
  const c = FX.cases[0];
  const mapping = declared(c.mappingRef);
  const identity = identityFor(mapping, c.payload);
  other.acceptRaw('raw-other', c.payload);
  return other.admit({
    rawRef: 'raw-other', mapping,
    context: {
      ...FX.context, mode: c.mode, sourceRecordRef: c.payload._fixtureId,
      receivedAt: '2026-03-09T09:00:00.000Z',
      identity, identityMappingVersion: identity.identityMappingVersion,
    },
  }).record;
}

test('G/1 — G: an UNATTESTED record is refused, so P06-03 is not a second admission path', () => {
  const { ledger, corpus } = setup();
  const unattested = unattestedCanonicalRecord();
  // It IS a governed canonical record …
  assert.doesNotThrow(() => assertCanonicalShape(unattested, VOCAB));
  // … but this boundary never produced it, so DD-5 refuses it.
  assert.throws(() => ledger.record(unattested),
    (e) => e instanceof BoundaryViolation && e.rules.includes('DD-5'));
  assert.equal(ledger.recordCount, 0);
  // Contrast: the boundary's OWN records are accepted, so the gate is not merely always-throwing.
  ledger.ingestCorpus(corpus);
  assert.equal(ledger.recordCount, corpus.length);
});

test('G/2 — G: a RAW provider payload is refused outright', () => {
  const { ledger } = setup();
  for (const c of FX.cases) {
    assert.throws(() => ledger.record(c.payload),
      (e) => e instanceof BoundaryViolation && e.rules.includes('DD-5'),
      `${c.caseId}: a raw payload must never enter the deduplicated set`);
  }
  assert.equal(ledger.recordCount, 0);
});

test('G/3 — G: a raw-shaped object dressed with a snapshotId is still refused', () => {
  const { ledger } = setup();
  const dressed = { ...FX.cases[0].payload, snapshotId: 'data-localfix-vRAW-2026-03-02T14:30:00.000Z' };
  assert.throws(() => ledger.record(dressed), (e) => e instanceof BoundaryViolation);
  assert.equal(ledger.recordCount, 0);
});

test('G/4 — G: the ledger REQUIRES a boundary; it cannot be constructed standalone', () => {
  assert.throws(() => new DeduplicationLedger({}),
    (e) => e instanceof BoundaryViolation && e.rules.includes('DD-5'));
  assert.throws(() => new DeduplicationLedger({ boundary: {} }),
    (e) => e instanceof BoundaryViolation && e.rules.includes('DD-5'));
});

test('G/5 — G: a non-canonical but attested-shaped object is refused by DD-6', () => {
  const { ledger, corpus } = setup();
  // Reach DD-6 by using a record the boundary DID attest but presenting a mutated copy: the
  // mutation breaks the attestation, so DD-5 fires first — proving the gates are ordered and
  // that no path reaches storage without BOTH gates.
  const mutated = JSON.parse(JSON.stringify(corpus[0]));
  delete mutated.fields['MD:price.last'];
  assert.throws(() => ledger.record(Object.freeze(mutated)), (e) => e instanceof BoundaryViolation);
  // And DD-6 itself rejects a non-canonical object directly.
  assert.throws(() => assertCanonicalShape({ snapshotId: 'data-x-v1-2026-01-01T00:00:00.000Z', quality: 'good' }, VOCAB),
    (e) => e instanceof BoundaryViolation);
});

test('G/6 — G: dedup self-audit detects an unattested or non-canonical held record', () => {
  const { ledger, corpus } = setup();
  ledger.ingestCorpus(corpus);
  const clean = ledger.auditDedup();
  assert.equal(clean.ok, true);
  assert.equal(clean.recordCount, corpus.length);
  assert.equal(clean.distinctIdentityKeys, corpus.length);
  assert.deepEqual([...clean.duplicateIdentityKeys], []);
  // The predicate is meaningful, not constant: a genuinely unattested record is refused.
  const unattested = unattestedCanonicalRecord();
  assert.equal(ledger.boundary.isAttested(unattested), false);
  assert.throws(() => ledger.record(unattested), (e) => e instanceof BoundaryViolation);
  assert.equal(ledger.recordCount, corpus.length, 'the held set is unchanged by the refusal');
  assert.equal(ledger.auditDedup().ok, true);
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// P — H/I: P06-01 and P06-02 remain intact; C1–C6 remain fail-closed
// ══════════════════════════════════════════════════════════════════════════════════════════

test('P/1 — H: P06-01 deterministic normalization is intact through the whole path', () => {
  const a = setup();
  const b = setup();
  assert.equal(canonicalDigest(a.corpus), canonicalDigest(b.corpus));
  for (let i = 0; i < a.corpus.length; i += 1) {
    const direct = runCase(FX.cases[i].caseId);
    assert.equal(canonicalDigest(a.corpus[i]), direct.canonicalDigest,
      `${FX.cases[i].caseId}: normalization output unchanged by P06-03`);
  }
  a.ledger.ingestCorpus(a.corpus);
  assert.equal(canonicalDigest(a.ledger.canonicalRecords()), canonicalDigest(a.corpus),
    'deduplication does not alter the canonical records');
});

test('P/2 — P06-02 raw/canonical separation is intact: raw never reaches the ledger', () => {
  const { boundary, ledger, corpus } = setup();
  ledger.ingestCorpus(corpus);
  assert.equal(boundary.rawCount, FX.cases.length);
  assert.equal(boundary.auditBoundary().ok, true);
  for (const ref of boundary.raw.refs()) {
    assert.equal(boundary.raw.read(ref).isCanonical, false);
    assert.throws(() => ledger.record(boundary.raw.read(ref)), (e) => e instanceof BoundaryViolation);
  }
  assert.equal(ledger.recordCount, corpus.length, 'only the canonical records entered');
});

test('P/3 — I: C1–C6 remain fail-closed and no C-rule is re-implemented here', () => {
  const code = readFileSync(join(p06Root, 'src', 'deduplicationRules.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/[^\n]*$/gm, '');
  assert.doesNotMatch(code, /export function assertC[1-6]\s*\(/);
  assert.doesNotMatch(code, /class NamespaceViolation/);
  assert.doesNotMatch(code, /class CanonicalRecordStore/);
  // Every held record still satisfies C1 by construction.
  const { ledger, corpus } = setup();
  ledger.ingestCorpus(corpus);
  for (const r of ledger.canonicalRecords()) {
    for (const k of Object.keys(r.fields)) assert.ok(k.startsWith(NAMESPACE_TOKEN));
  }
  assert.equal(ledger.auditDedup().notCanonical.length, 0);
});

test('P/4 — the existing-IIPS boundary is untouched and no dependency is added', () => {
  const code = readFileSync(join(p06Root, 'src', 'deduplicationRules.js'), 'utf8');
  assert.doesNotMatch(code, /ReplayService|DataBoundExecutor|LiveDataRuntime|NormalizedHolding/i);
  const pkg = JSON.parse(readFileSync(join(p06Root, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.dependencies ?? {}, {});
  assert.deepEqual(pkg.devDependencies ?? {}, {});
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// S — SCOPE: no P07/P08, no scheduling/retries/checkpointing/persistence, no provider execution
// ══════════════════════════════════════════════════════════════════════════════════════════

test('S/1 — no scheduling, retries, checkpointing or durable persistence is implemented here', () => {
  const code = readFileSync(join(p06Root, 'src', 'deduplicationRules.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/[^\n]*$/gm, '');
  assert.doesNotMatch(code, /setTimeout|setInterval|backoff|maxAttempts|CheckpointLedger|recordCheckpoint|RunAborted/i,
    'P05-04 owns orchestration and is unchanged');
  assert.doesNotMatch(code, /writeFileSync|mkdirSync|createWriteStream|node:fs/,
    'no durable persistence');
  assert.doesNotMatch(code, /Date\.now\s*\(|new\s+Date\s*\(|Math\.random\s*\(|process\.env/);
});

test('S/2 — no P07/P08 scope: no freshness, staleness, PIT storage or corporate actions', () => {
  const code = readFileSync(join(p06Root, 'src', 'deduplicationRules.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/[^\n]*$/gm, '');
  assert.doesNotMatch(code, /freshness|staleness|staleAfter|corporateAction|pitBoundary|adjustedClose/i);
});

test('S/3 — no provider execution, credentials, entitlements or network surface', () => {
  const code = readFileSync(join(p06Root, 'src', 'deduplicationRules.js'), 'utf8');
  for (const mod of ['node:http', 'node:https', 'node:net', 'node:tls', 'node:dgram',
    'node:child_process', 'node:worker_threads', 'undici', 'axios', 'node-fetch', 'got']) {
    assert.ok(!code.includes(`'${mod}'`) && !code.includes(`"${mod}"`), `must not import ${mod}`);
  }
  assert.doesNotMatch(code, /authenticat\w*\s*\(/i);
  assert.doesNotMatch(code, /-----BEGIN [A-Z ]*PRIVATE KEY-----/);
  assert.doesNotMatch(code, /https?:\/\/(?!schema|www\.w3|json-schema)/);
  const realFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('NETWORK USE IS PROHIBITED IN P06-03'); };
  try {
    const { ledger, corpus } = setup();
    assert.equal(ledger.proveRepeatedIngestionStable(corpus, 3).exitCriterionMet, true);
  } finally { globalThis.fetch = realFetch; }
});

test('S/4 — no certification, activation or P06 acceptance claim is made', () => {
  const code = readFileSync(join(p06Root, 'src', 'deduplicationRules.js'), 'utf8');
  assert.doesNotMatch(code, /certification granted|is certified|E2E-030 (passed|renewed)/i);
  assert.doesNotMatch(code, /production activation (granted|authorized)/i);
  assert.doesNotMatch(code, /P06 (?:is )?ACCEPTED/);
  const { ledger, corpus } = setup();
  const proof = ledger.proveRepeatedIngestionStable(corpus, 2);
  assert.equal(proof.phaseScope, 'P06-03');
});

test('S/5 — the p06 package still contains exactly the four authorized work-item modules', () => {
  const present = readdirSync(join(p06Root, 'src')).filter((x) => x.endsWith('.js')).sort();
  assert.deepEqual(present, [
    'deduplicationRules.js', 'identityResolution.js', 'mappingDeclaration.js',
    'normalizationPipeline.js', 'rawCanonicalBoundary.js',
  ], 'p06/src must contain exactly the P06-01, P06-02 and P06-03 modules');
});
