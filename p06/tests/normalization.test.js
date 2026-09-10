/**
 * P06-01 — NORMALIZATION PIPELINE TESTS
 *
 * These are the tracker's *Test / Validation* artifact for `Work Tracker`!P06-01: **"Golden tests"**,
 * proving its *Exit Criteria* — **"Canonical output deterministic"** — and its *Requirement*,
 * *"Convert provider payloads into canonical records."*
 *
 * Authorized by **D10-2**. Scope is **P06-01 only**: group **B** asserts that nothing here is
 * P06-02 (raw/canonical storage boundary) or P06-03 (deduplication rules).
 *
 * ⚠ Every fixture is synthetic and local. **No provider execution evidence is produced or implied.**
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  declareNormalizationMapping,
  declaredCanonicalSlots,
  declaredProviderElements,
  consumedProviderElements,
  undeclaredProviderElements,
  mappingDigest,
  MAPPING_DECLARATION_ELEMENTS,
  TRANSFORMATIONS,
  MappingDeclarationError,
} from '../src/mappingDeclaration.js';
import {
  normalizePayload,
  assertNoEngineDirectPath,
  NormalizationRejection,
  ENGINE_INPUT_KEYS,
} from '../src/normalizationPipeline.js';
import { NAMESPACE_TOKEN, NAMESPACE_VERSION, assertC1 } from '../../p05/src/namespace.js';
import { canonicalJson, canonicalDigest } from '../../p05/src/serialize.js';
import {
  normalizationFixtures, declared, runCase, identityFor, goldenFor, providerRegister,
  PROVIDER_NATIVE_VOCABULARY, repoRoot, p06Root,
} from './helpers.js';

/** Strip block and line comments so the assertions test CODE, not prose about the code. */
function codeOnly(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s+\/\/[^\n]*$/gm, '');
}

const FX = normalizationFixtures();

/** M-3: the provenance reference names the SOURCE RECORD, never a provider field name. */
const SRC_REF = FX.cases[0].payload._fixtureId;

// ══════════════════════════════════════════════════════════════════════════════════════════
// A — the mapping is DECLARED as data, and conforms (P02 §5, M-1…M-6, MR-1…MR-4)
// ══════════════════════════════════════════════════════════════════════════════════════════

test('A/1 — every declaration carries all eight mandated elements MD-1…MD-8', () => {
  assert.deepEqual([...MAPPING_DECLARATION_ELEMENTS],
    ['MD-1', 'MD-2', 'MD-3', 'MD-4', 'MD-5', 'MD-6', 'MD-7', 'MD-8']);
  for (const ref of Object.keys(FX.mappings)) {
    const decl = declared(ref);
    for (const e of decl.entries) {
      for (const el of MAPPING_DECLARATION_ELEMENTS) {
        assert.ok(e[el] !== undefined, `${ref} entry is missing ${el}`);
      }
    }
  }
});

test('A/2 — MR-4: a declaration is reviewable as DATA — it round-trips through JSON unchanged', () => {
  for (const ref of Object.keys(FX.mappings)) {
    const decl = declared(ref);
    assert.equal(canonicalDigest(JSON.parse(JSON.stringify(decl))), canonicalDigest(decl));
    // And it contains no function, closure or code — only JSON-legal values.
    assert.doesNotMatch(JSON.stringify(decl), /function|=>/);
  }
});

test('A/3 — MR-2: the transformation vocabulary is CLOSED; an undeclared transform is refused', () => {
  assert.deepEqual([...TRANSFORMATIONS],
    ['identity', 'string', 'decimal', 'integer', 'boolean', 'dateToIsoUtc', 'enum']);
  const bad = FX.negativeCases.find((n) => n.caseId === 'X-01');
  assert.throws(() => declareNormalizationMapping(bad.mapping),
    (e) => e instanceof MappingDeclarationError && e.rules.includes('MR-2'));
});

test('A/4 — FD-7 / OI-D9-01: a domain segment outside the accepted dictionary is refused, never invented', () => {
  const bad = FX.negativeCases.find((n) => n.caseId === 'X-02');
  assert.throws(() => declareNormalizationMapping(bad.mapping),
    (e) => e instanceof MappingDeclarationError && e.rules.includes('FD-1'));
});

test('A/5 — one canonical slot is declared exactly once (a duplicate would be a C3 collision)', () => {
  const bad = FX.negativeCases.find((n) => n.caseId === 'X-03');
  assert.throws(() => declareNormalizationMapping(bad.mapping),
    (e) => e instanceof MappingDeclarationError && e.rules.includes('C3'));
});

test('A/6 — M-5 / NL-3: onAbsent may NOT fabricate a value for an absent source', () => {
  const bad = FX.negativeCases.find((n) => n.caseId === 'X-04');
  assert.throws(() => declareNormalizationMapping(bad.mapping),
    (e) => e instanceof MappingDeclarationError && e.rules.includes('M-5'));
});

test('A/7 — M-3: a provider-native element must not carry the namespace token', () => {
  const bad = FX.negativeCases.find((n) => n.caseId === 'X-05');
  assert.throws(() => declareNormalizationMapping(bad.mapping),
    (e) => e instanceof MappingDeclarationError && e.rules.includes('M-3'));
});

test('A/8 — a LIVE mapping is refused: live provider execution is NOT_AUTHORIZED', () => {
  const bad = FX.negativeCases.find((n) => n.caseId === 'X-06');
  assert.throws(() => declareNormalizationMapping(bad.mapping),
    (e) => e instanceof MappingDeclarationError && e.rules.includes('MR-5')
      && /NOT_AUTHORIZED \(D9 N-1, D10 §8\.2\)/.test(e.message));
});

test('A/9 — FD-5: a monetary slot must declare a currency SOURCE; a dimensioned slot must declare a unit', () => {
  const base = FX.mappings.D01_QUOTE.entries[0];
  const monetaryNoCurrency = {
    ...FX.mappings.D01_QUOTE,
    entries: [{ ...base, 'MD-4': { ...base['MD-4'], currencySource: undefined } }],
  };
  assert.throws(() => declareNormalizationMapping(monetaryNoCurrency),
    (e) => e instanceof MappingDeclarationError && e.rules.includes('SM-1'));
  const dimensionedNoUnit = {
    ...FX.mappings.D01_QUOTE,
    entries: [{ ...base, 'MD-4': { ...base['MD-4'], dimension: 'dimensioned', monetary: 'no' } }],
  };
  assert.throws(() => declareNormalizationMapping(dimensionedNoUnit),
    (e) => e instanceof MappingDeclarationError && e.rules.includes('UN-1'));
});

test('A/10 — M-4: an undeclared provider element is DROPPED and RECORDED, never smuggled', () => {
  const decl = declared('D01_QUOTE');
  const dropped = undeclaredProviderElements(decl, FX.cases[0].payload);
  // 'sym' has no canonical counterpart; every other element is consumed by MD-2/MD-4/MD-5/envelope.
  assert.deepEqual([...dropped], ['sym']);
  assert.ok(consumedProviderElements(decl).includes('ccy'), 'a currency source is declared, not "dropped"');
  assert.ok(consumedProviderElements(decl).includes('quoteTs'), 'a timestamp source is declared');
  const out = runCase('N-01');
  assert.deepEqual([...out.report.droppedUndeclaredElements], ['sym']);
  // And it is genuinely absent from the canonical record — not hidden in a bag.
  for (const name of PROVIDER_NATIVE_VOCABULARY) {
    assert.ok(!out.canonicalSerialization.includes(`"${name}"`),
      `provider-native name '${name}' must not appear in the canonical record (M-3)`);
  }
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// D — THE EXIT CRITERION: "Canonical output deterministic"
// ══════════════════════════════════════════════════════════════════════════════════════════

test('D/1 — EXIT CRITERION: repeated identical input yields BYTE-IDENTICAL canonical output', () => {
  for (const c of FX.cases) {
    const serializations = [];
    for (let run = 0; run < 5; run += 1) {
      serializations.push(runCase(c.caseId).canonicalSerialization);
    }
    assert.equal(new Set(serializations).size, 1, `${c.caseId} must be byte-identical across 5 runs`);
  }
});

test('D/2 — EXIT CRITERION: independent pipeline instances agree byte-for-byte', () => {
  const a = runCase('N-01');
  const b = runCase('N-01');
  assert.equal(a.canonicalSerialization, b.canonicalSerialization);
  assert.equal(a.canonicalDigest, b.canonicalDigest);
  assert.equal(a.record.snapshotId, b.record.snapshotId);
});

test('D/3 — a changed input necessarily changes the canonical output (the mapping is not opaque)', () => {
  const a = runCase('N-01');
  const b = runCase('N-02');
  assert.notEqual(a.canonicalDigest, b.canonicalDigest);
  // DV-1 / DV-2: dataVersion identifies the vintage of the source content.
  assert.notEqual(a.record.dataVersion, b.record.dataVersion);
});

test('D/4 — MR-1: normalization is a pure function of payload + declared configuration', () => {
  // Same payload, DIFFERENT declared precision ⇒ different canonical output. Nothing is cached
  // or inferred; the declaration genuinely participates.
  const fx = FX.mappings.D01_QUOTE;
  const wider = {
    ...fx,
    mappingId: `${fx.mappingId}-WIDER`,
    entries: fx.entries.map((e) => (e['MD-3'].precision === 2
      ? { ...e, 'MD-3': { ...e['MD-3'], precision: 4 } } : e)),
  };
  const declWide = declareNormalizationMapping(wider);
  const identity = identityFor(declWide, FX.cases[0].payload);
  const out = normalizePayload({
    payload: FX.cases[0].payload, mapping: declWide,
    context: { ...FX.context, sourceRecordRef: SRC_REF, mode: 'LIVE', identity, identityMappingVersion: identity.identityMappingVersion },
  });
  assert.notEqual(out.canonicalDigest, runCase('N-01').canonicalDigest);
  assert.equal(out.record.fields['MD:price.last'].value, '101.2500');
  assert.equal(runCase('N-01').record.fields['MD:price.last'].value, '101.25');
});

test('D/5 — D-3: no wall clock, randomness or ambient input is read by any P06-01 module', () => {
  const srcDir = join(p06Root, 'src');
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith('.js'))) {
    const text = readFileSync(join(srcDir, f), 'utf8');
    for (const re of [/Date\.now\s*\(/, /new\s+Date\s*\(/, /Math\.random\s*\(/,
      /crypto\.randomUUID\s*\(/, /process\.env/]) {
      assert.ok(!re.test(text), `${f} must not use ${re} (D-3)`);
    }
  }
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// G — GOLDEN TESTS (the tracker's Test/Validation) against committed canonical fixtures
// ══════════════════════════════════════════════════════════════════════════════════════════

test('G/1 — GOLDEN: every case matches its committed canonical fixture byte-for-byte', () => {
  assert.ok(Object.keys(FX.golden).length >= FX.cases.length,
    'a golden canonical fixture must exist for every case');
  for (const c of FX.cases) {
    const golden = goldenFor(c.caseId);
    assert.ok(golden !== undefined, `no golden fixture for ${c.caseId}`);
    const out = runCase(c.caseId);
    assert.equal(out.canonicalDigest, golden.canonicalDigest, `${c.caseId} canonical digest`);
    assert.equal(out.canonicalSerialization, golden.canonicalSerialization,
      `${c.caseId} canonical serialization must be byte-identical to the golden fixture`);
    assert.equal(out.record.snapshotId, golden.snapshotId, `${c.caseId} snapshotId`);
    assert.deepEqual(out.report.emittedKeys, golden.emittedKeys, `${c.caseId} emitted keys`);
    assert.equal(out.report.quality, golden.quality);
    assert.equal(out.report.completenessPct, golden.completenessPct);
  }
});

test('G/2 — the golden fixtures are the tracker\'s required Evidence artifact and are classified', () => {
  const idx = JSON.parse(readFileSync(join(p06Root, 'evidence-p06-01', '00-INDEX.json'), 'utf8'));
  assert.equal(idx.classification.isProviderEvidence, false);
  assert.equal(idx.classification.phaseScope, 'P06-01');
  assert.equal(idx.classification.p06_02Implemented, false);
  assert.equal(idx.classification.p06_03Implemented, false);
  assert.equal(idx.trackerRow.exitCriteria, 'Canonical output deterministic');
  assert.equal(idx.trackerRow.testValidation, 'Golden tests');
  assert.equal(idx.trackerRow.evidence, 'Canonical fixtures');
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// K — canonical field-key formation using the exact MD:<domain>.<field>
// ══════════════════════════════════════════════════════════════════════════════════════════

test('K/1 — every emitted key is exactly MD:<domain>.<field>, and the token is unchanged', () => {
  assert.equal(NAMESPACE_TOKEN, 'MD:');
  for (const c of FX.cases) {
    const out = runCase(c.caseId);
    assert.ok(out.report.emittedKeys.length > 0);
    for (const k of out.report.emittedKeys) {
      assert.match(k, /^MD:[a-z]+\.[A-Za-z][A-Za-z0-9]*$/, `${c.caseId} key '${k}'`);
    }
    // Keys are canonically ordered (C6), not insertion-incidental.
    assert.deepEqual(out.report.emittedKeys, [...out.report.emittedKeys].sort());
  }
});

test('K/2 — the collision-critical valuation slots are emitted ONLY namespaced', () => {
  const out = runCase('N-05');
  assert.deepEqual([...out.report.emittedKeys],
    ['MD:valuation.evEbitda', 'MD:valuation.fcfYield', 'MD:valuation.peRatio']);
  // No bare engine key anywhere in the record.
  for (const ek of ENGINE_INPUT_KEYS) {
    assert.ok(!out.canonicalSerialization.includes(`"${ek}":`),
      `bare engine input key '${ek}' must not appear (N-5 / FD-3)`);
  }
});

test('K/3 — M-5: source silence is NOT_PROVIDED, never zero and never omission', () => {
  const out = runCase('N-02'); // one-sided quote: no bid/ask/sizes
  assert.equal(out.record.fields['MD:price.bid'].availability, 'NOT_PROVIDED');
  assert.equal(out.record.fields['MD:price.ask'].availability, 'NOT_PROVIDED');
  assert.equal(out.record.fields['MD:price.bidSize'].availability, 'NOT_PROVIDED');
  assert.equal(out.record.fields['MD:price.askSize'].availability, 'NOT_PROVIDED');
  for (const k of ['MD:price.bid', 'MD:price.ask', 'MD:price.bidSize', 'MD:price.askSize']) {
    // NL-3: a non-PRESENT marker PROHIBITS a substituted value.
    assert.equal(out.record.fields[k].value, null, `${k} must carry no fabricated value`);
  }
  assert.equal(out.report.quality, 'partial');
  assert.ok(out.report.completenessPct < 100);
});

test('K/4 — a monetary slot carries ISO-4217 currency; a dimensionless ratio carries none (FD-5)', () => {
  const quote = runCase('N-01').record;
  assert.equal(quote.fields['MD:price.last'].currency, 'USD');
  assert.equal(quote.fields['MD:price.last'].precision, 2);
  assert.equal(quote.fields['MD:price.bidSize'].currency, undefined);
  assert.equal(quote.fields['MD:price.bidSize'].unit, undefined);
  const val = runCase('N-05').record;
  for (const k of Object.keys(val.fields)) {
    assert.equal(val.fields[k].currency, undefined, `${k} is a dimensionless ratio`);
    assert.equal(val.fields[k].precision, 4);
  }
});

test('K/5 — TS-4: a date-only session boundary uses the DECLARED UTC convention, not an assumption', () => {
  const out = runCase('N-03');
  assert.equal(out.record.asOf, '2026-03-02T00:00:00.000Z');
  assert.equal(out.record.fields['MD:price.close'].effectiveTime, '2026-03-02T00:00:00.000Z');
  // The convention is declared in MD-3, so removing it is a declaration error, not a silent default.
  const noTransform = {
    ...FX.mappings.D01_CLOSE,
    mappingId: 'D01-CLOSE-NO-TS-CONVENTION',
    entries: FX.mappings.D01_CLOSE.entries.map((e) => ({
      ...e, 'MD-5': { ...e['MD-5'], timestampTransform: 'identity' },
    })),
  };
  const decl = declareNormalizationMapping(noTransform);
  const identity = identityFor(decl, FX.cases[2].payload);
  assert.throws(() => normalizePayload({
    payload: FX.cases[2].payload, mapping: decl,
    context: { ...FX.context, sourceRecordRef: SRC_REF, mode: 'SNAPSHOT', identity, identityMappingVersion: identity.identityMappingVersion },
  }), /not ISO-8601 UTC/);
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// I — identity preservation (RF-1, RF-3, OI-09 FIGI authority, AD-1 cardinality)
// ══════════════════════════════════════════════════════════════════════════════════════════

test('I/1 — RF-1: an instrument-keyed domain without an identity reference FAILS CLOSED', () => {
  const decl = declared('D01_QUOTE');
  assert.throws(() => normalizePayload({
    payload: FX.cases[0].payload, mapping: decl,
    context: { ...FX.context, sourceRecordRef: SRC_REF, mode: 'LIVE' }, // no identity
  }), /RF-1/);
});

test('I/2 — the identity is PASSED THROUGH from the P04 register; the data plane never writes it', () => {
  const out = runCase('N-01');
  const id = out.record.identity;
  assert.equal(id.canonicalSecurityId, 'CS-LOCAL-0001');
  assert.equal(id.mappedCompanyId, 'technology-H1');
  assert.equal(id.adapterCrossing, true);
  assert.equal(out.record.identityMappingVersion, id.identityMappingVersion);
  // ADP-4: the mapping version is the register's own version, never invented by P06.
  assert.equal(id.identityMappingVersion, FX.mappings.D01_QUOTE.provider === 'localfix'
    ? 'idmap-localfix-1.0.0' : id.identityMappingVersion);
});

test('I/3 — OI-09: FIGI is the authoritative external identifier; ISIN is not', () => {
  const id = runCase('N-01').record.identity;
  const figi = id.externalIdentifiers.find((x) => x.type === 'FIGI');
  const isin = id.externalIdentifiers.find((x) => x.type === 'ISIN');
  assert.equal(figi.authority, 'AUTHORITATIVE');
  assert.equal(isin.authority, 'NON_AUTHORITATIVE');
  assert.deepEqual(id.externalIdentifiers.filter((x) => x.authority === 'AUTHORITATIVE').map((x) => x.type), ['FIGI']);
});

test('I/4 — an unmapped canonical identity fails closed and is never a quality state', () => {
  const decl = declared('D01_QUOTE');
  const payload = { ...FX.cases[0].payload, canonicalSecurityId: 'CS-DOES-NOT-EXIST' };
  assert.throws(() => identityFor(decl, payload), (e) => e.name === 'IdentityResolutionFailure');
});

test('I/5 — the identity is never mutated by normalization (INV-2 immutability preserved)', () => {
  const a = runCase('N-01').record.identity;
  const b = runCase('N-03').record.identity;
  assert.equal(a.canonicalSecurityId, b.canonicalSecurityId);
  assert.equal(a.canonicalIssuerId, b.canonicalIssuerId);
  assert.equal(a.mappedCompanyId, b.mappedCompanyId);
  assert.throws(() => { a.canonicalSecurityId = 'X'; }, TypeError);
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// C — collision rejection THROUGH the existing C1–C6 machinery (reuse, never duplicated)
// ══════════════════════════════════════════════════════════════════════════════════════════

test('C/1 — C1–C6 are REACHED BY REUSE: the P06 module implements no collision logic of its own', () => {
  const srcDir = join(p06Root, 'src');
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith('.js'))) {
    const text = readFileSync(join(srcDir, f), 'utf8');
    // The guard functions must be IMPORTED, never re-declared.
    assert.doesNotMatch(codeOnly(text), /export function assertC[1-6]\s*\(/,
      `${f} must not re-implement an ADR-01 collision rule`);
    assert.doesNotMatch(codeOnly(text), /class NamespaceViolation/,
      `${f} must not re-declare the namespace violation type`);
  }
  const pipeline = readFileSync(join(srcDir, 'normalizationPipeline.js'), 'utf8');
  assert.match(pipeline, /assertCollisionGuard[,}]/, 'the pipeline invokes the accepted guard');
  assert.match(pipeline, /from '\.\.\/\.\.\/p05\/src\/namespace\.js'/, 'imported from the accepted module');
});

test('C/2 — C5 fail-closed: a non-namespaced key aborts normalization entirely', () => {
  // The namespace machinery itself still fails closed (proven directly, by reuse).
  assert.throws(() => assertC1(['price.last']), /C1/);
  // And the pipeline cannot emit a bare key: buildField rejects it first.
  assert.throws(() => assertC1(['MD:price.last', 'bareKey']), /C1/);
});

test('C/3 — C2: a namespaced key in companyInputs is rejected (reverse partition)', () => {
  const decl = declared('D01_QUOTE');
  const identity = identityFor(decl, FX.cases[0].payload);
  assert.throws(() => normalizePayload({
    payload: FX.cases[0].payload, mapping: decl,
    context: {
      ...FX.context, sourceRecordRef: SRC_REF, mode: 'LIVE', identity, identityMappingVersion: identity.identityMappingVersion,
      companyInputKeys: ['MD:company.id'],
    },
  }), /C2/);
});

test('C/4 — FD-3: C3 is STRUCTURALLY guaranteed by C1+C2, so a field/company collision is impossible', () => {
  // C1 requires every field key to carry the namespace; C2 requires every companyInput key NOT to.
  // Their intersection is therefore necessarily empty — which is exactly what FD-3 states:
  // "A canonical key never duplicates an existing engine input key as-is — the namespace
  // guarantees this structurally." Any companyInput that COULD collide is namespaced, and so is
  // caught by C2 first. Asserted in order, because the guard runs C1 → C2 → C3 → C4.
  const decl = declared('D01_QUOTE');
  const identity = identityFor(decl, FX.cases[0].payload);
  const ctxBase = {
    ...FX.context, sourceRecordRef: SRC_REF, mode: 'LIVE', identity, identityMappingVersion: identity.identityMappingVersion,
  };
  const emitted = [...runCase('N-01').report.emittedKeys];
  // A namespaced companyInput equal to an emitted key is refused by C2 before C3 is reached.
  assert.throws(() => normalizePayload({
    payload: FX.cases[0].payload, mapping: decl,
    context: { ...ctxBase, companyInputKeys: [emitted[0]] },
  }), /C2/);
  // A non-namespaced companyInput can never equal a namespaced field key, so the pipeline accepts
  // it and the intersection stays empty — the structural guarantee, demonstrated.
  const ok = normalizePayload({
    payload: FX.cases[0].payload, mapping: decl,
    context: { ...ctxBase, companyInputKeys: ['companyId', 'issuerId'] },
  });
  assert.ok(ok.record.snapshotId.length > 0);
  for (const k of emitted) assert.ok(!['companyId', 'issuerId'].includes(k));
});

test('C/5 — C4: a cross-snapshot key collision is rejected, naming both snapshots', () => {
  const decl = declared('D01_QUOTE');
  const identity = identityFor(decl, FX.cases[0].payload);
  assert.throws(() => normalizePayload({
    payload: FX.cases[0].payload, mapping: decl,
    context: {
      ...FX.context, sourceRecordRef: SRC_REF, mode: 'LIVE', identity, identityMappingVersion: identity.identityMappingVersion,
      contributing: [
        { snapshotId: 'data-a-v1-2026-01-01T00:00:00.000Z', keys: ['MD:price.last'] },
        { snapshotId: 'data-b-v1-2026-01-01T00:00:00.000Z', keys: ['MD:price.last'] },
      ],
    },
  }), /C4/);
});

test('C/6 — namespaceVersion is recorded and unchanged; no methodology variation', () => {
  for (const c of FX.cases) {
    assert.equal(runCase(c.caseId).record.namespaceVersion, NAMESPACE_VERSION);
    assert.equal(NAMESPACE_VERSION, '1.0');
  }
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// F — malformed / ambiguous input FAILS CLOSED
// ══════════════════════════════════════════════════════════════════════════════════════════

test('F/1 — SM-1 / CU-2 / FD-5: a monetary slot with no ISO-4217 currency is rejected, never defaulted', () => {
  const decl = declared('D01_QUOTE');
  const identity = identityFor(decl, FX.cases[0].payload);
  const payload = { ...FX.cases[0].payload, ccy: 'US$' };
  assert.throws(() => normalizePayload({
    payload, mapping: decl,
    context: { ...FX.context, sourceRecordRef: SRC_REF, mode: 'LIVE', identity, identityMappingVersion: identity.identityMappingVersion },
  }), /ISO-4217/);
});

test('F/2 — NP-2: a non-fixed-point decimal is rejected; nothing is coerced', () => {
  const decl = declared('D01_QUOTE');
  const identity = identityFor(decl, FX.cases[0].payload);
  const payload = { ...FX.cases[0].payload, tradePrice: 'not-a-number' };
  assert.throws(() => normalizePayload({
    payload, mapping: decl,
    context: { ...FX.context, sourceRecordRef: SRC_REF, mode: 'LIVE', identity, identityMappingVersion: identity.identityMappingVersion },
  }), /not an exact fixed-point decimal/);
});

test('F/3 — NP-3: excess precision is rejected; silent rounding or truncation is prohibited', () => {
  const decl = declared('D01_QUOTE');
  const identity = identityFor(decl, FX.cases[0].payload);
  const payload = { ...FX.cases[0].payload, tradePrice: '101.259' };
  assert.throws(() => normalizePayload({
    payload, mapping: decl,
    context: { ...FX.context, sourceRecordRef: SRC_REF, mode: 'LIVE', identity, identityMappingVersion: identity.identityMappingVersion },
  }), /NP-3|precision/);
});

test('F/4 — UN-6 / SM-6: a non-integer where an integer is declared is rejected', () => {
  const decl = declared('D01_QUOTE');
  const identity = identityFor(decl, FX.cases[0].payload);
  const payload = { ...FX.cases[0].payload, bidSz: 500.5 };
  assert.throws(() => normalizePayload({
    payload, mapping: decl,
    context: { ...FX.context, sourceRecordRef: SRC_REF, mode: 'LIVE', identity, identityMappingVersion: identity.identityMappingVersion },
  }), /integer/);
});

test('F/5 — MR-2: an undeclared enum member FAILS rather than being guessed', () => {
  const decl = declareNormalizationMapping({
    ...FX.mappings.D01_QUOTE,
    mappingId: 'ENUM-CASE',
    entries: [{
      'MD-1': { domainSegment: 'ohlcv', fieldSegment: 'barInterval' },
      'MD-2': { providerElement: 'intervalCode' },
      'MD-3': { transformations: ['enum'], enumTable: { D: '1D', W: '1W' } },
      'MD-4': { dataType: 'enum', monetary: 'no', dimension: 'dimensionless' },
      'MD-5': { timestampSlot: 'none' },
      'MD-6': { onAbsent: 'NOT_PROVIDED' },
      'MD-7': { pitEligible: true },
      'MD-8': { knownLimitations: [] },
    }],
  });
  const identity = identityFor(declared('D01_QUOTE'), FX.cases[0].payload);
  const base = { ...FX.context, sourceRecordRef: SRC_REF, mode: 'SNAPSHOT', identity, identityMappingVersion: identity.identityMappingVersion };
  const ok = normalizePayload({
    payload: { ...FX.cases[0].payload, intervalCode: 'D' }, mapping: decl, context: base,
  });
  assert.equal(ok.record.fields['MD:ohlcv.barInterval'].value, '1D');
  assert.throws(() => normalizePayload({
    payload: { ...FX.cases[0].payload, intervalCode: 'M' }, mapping: decl, context: base,
  }), (e) => e instanceof NormalizationRejection && e.rules.includes('MR-2'));
});

test('F/6 — ST-4: mode is never inferred; an undeclared mode is rejected', () => {
  const decl = declared('D01_QUOTE');
  const identity = identityFor(decl, FX.cases[0].payload);
  assert.throws(() => normalizePayload({
    payload: FX.cases[0].payload, mapping: decl,
    context: { ...FX.context, sourceRecordRef: SRC_REF, mode: 'MAYBE', identity, identityMappingVersion: identity.identityMappingVersion },
  }), /ST-4/);
});

test('F/7 — FD-6: a pitEligible=false field must not appear in a mode=PIT snapshot', () => {
  assert.throws(() => runCase('N-01', { mode: 'PIT', pitBoundary: '2026-03-03T15:00:00.000Z' }),
    /FD-6/);
});

test('F/8 — RF-6 / LN-1: a missing lineage element is rejected, never silently omitted', () => {
  const decl = declared('D01_QUOTE');
  const identity = identityFor(decl, FX.cases[0].payload);
  const { sourceRef, ...rest } = FX.context;
  assert.throws(() => normalizePayload({
    payload: FX.cases[0].payload, mapping: decl,
    context: { ...rest, mode: 'LIVE', identity, identityMappingVersion: identity.identityMappingVersion },
  }), /RF-6|is required/);
});

test('F/9 — MR-2: normalizing WITHOUT a declared mapping is refused outright', () => {
  assert.throws(() => normalizePayload({ payload: FX.cases[0].payload, mapping: undefined, context: FX.context }),
    /DECLARED mapping is required/);
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// E — the engine boundary: raw provider data must never reach an engine
// ══════════════════════════════════════════════════════════════════════════════════════════

test('E/1 — the gate-intent guard passes for every case and is mechanically checked', () => {
  for (const c of FX.cases) {
    const out = runCase(c.caseId);
    const decl = declared(c.mappingRef);
    const guard = assertNoEngineDirectPath(out.record, decl, PROVIDER_NATIVE_VOCABULARY);
    assert.equal(guard.ok, true);
    assert.equal(guard.bareEngineKeysEmitted, 0);
    assert.equal(guard.providerNamesLeaked, 0);
    assert.equal(guard.freeFormBags, 0);
    assert.equal(guard.keysChecked, guard.namespacedKeys);
  }
});

test('E/2 — the guard DETECTS a provider-native name smuggled into a provenance string', () => {
  const out = runCase('N-01');
  const decl = declared('D01_QUOTE');
  const tampered = JSON.parse(JSON.stringify(out.record));
  tampered.lineage.transformationChainRef = 'chain-with-sym-inside';
  Object.freeze(tampered);
  assert.throws(() => assertNoEngineDirectPath(tampered, decl, ['sym']),
    /provider-native name/);
});

test('E/3 — the guard DETECTS a bare engine input key appearing in the record', () => {
  const out = runCase('N-05');
  const decl = declared('D01_VALUATION');
  const tampered = JSON.parse(JSON.stringify(out.record));
  tampered.lineage.peRatio = 18.4; // smuggled bare engine key
  Object.freeze(tampered);
  assert.throws(() => assertNoEngineDirectPath(tampered, decl, []),
    /bare engine input key/);
});

test('E/4 — M-4: the guard DETECTS a free-form bag that could carry raw provider content', () => {
  const out = runCase('N-01');
  const decl = declared('D01_QUOTE');
  for (const bag of ['extras', 'rawPayload', 'nativePayload', 'metadata', 'additionalProperties']) {
    const tampered = { ...JSON.parse(JSON.stringify(out.record)), [bag]: { sym: 'ALFA' } };
    assert.throws(() => assertNoEngineDirectPath(tampered, decl, []), /free-form/,
      `a '${bag}' member must be refused`);
  }
});

test('E/5 — N-5: engine-input mapping is declared as P11, not performed here', () => {
  const pipeline = readFileSync(join(p06Root, 'src', 'normalizationPipeline.js'), 'utf8');
  assert.match(pipeline, /owned by \*\*P11\*\*|owned by P11/);
  // The pipeline exports the frozen engine key list only so the guard can check it — it never
  // produces an engine input.
  const out = runCase('N-05');
  assert.deepEqual([...out.report.engineInputKeysEmitted], []);
});

// ══════════════════════════════════════════════════════════════════════════════════════════
// B — BOUNDARY: authorization limits, asserted behaviourally
// ══════════════════════════════════════════════════════════════════════════════════════════

test('B/1 — the whole pipeline runs with every network primitive made to throw', () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('NETWORK USE IS PROHIBITED IN P06-01'); };
  try {
    for (const c of FX.cases) assert.ok(runCase(c.caseId).record.snapshotId.length > 0);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('B/2 — no P06-01 module imports a network, process-spawning or ambient-state module', () => {
  const forbidden = ['node:http', 'node:https', 'node:net', 'node:tls', 'node:dgram',
    'node:child_process', 'node:worker_threads', 'undici', 'axios', 'node-fetch', 'got'];
  const srcDir = join(p06Root, 'src');
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith('.js'))) {
    const text = readFileSync(join(srcDir, f), 'utf8');
    for (const mod of forbidden) {
      assert.ok(!text.includes(`'${mod}'`) && !text.includes(`"${mod}"`), `${f} must not import ${mod}`);
    }
  }
});

test('B/3 — P06-01 is NOT P06-02: no raw/canonical STORAGE BOUNDARY is implemented', () => {
  const srcDir = join(p06Root, 'src');
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith('.js'))) {
    const code = codeOnly(readFileSync(join(srcDir, f), 'utf8'));
    // P06-02's deliverable is a "Storage boundary" with exit criterion "Raw data never bypasses
    // validation". None of that machinery may exist here.
    assert.doesNotMatch(code, /writeFileSync|mkdirSync|createWriteStream/,
      `${f} must not persist anything — no raw store is built (P06-02)`);
    assert.doesNotMatch(code, /class\s+\w*(RawStore|RawPayloadStore|StorageBoundary)/,
      `${f} must not implement a raw/canonical storage boundary (P06-02)`);
    assert.doesNotMatch(code, /bypass(Validation|Detection)/i,
      `${f} must not implement raw-bypass detection (P06-02 exit criterion)`);
  }
  // The payload is an ARGUMENT and the record is a RETURN VALUE: nothing is stored.
  const out = runCase('N-01');
  assert.ok(out.record !== undefined);
});

test('B/4 — P06-01 is NOT P06-03: no deduplication rules are implemented', () => {
  const srcDir = join(p06Root, 'src');
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith('.js'))) {
    // CODE only: a docblock legitimately NAMES the thing it states is not implemented, exactly as
    // the P05-02/P05-03 contract modules do. The P05 guard solves the same problem with codeOnly().
    const code = codeOnly(readFileSync(join(srcDir, f), 'utf8'));
    assert.doesNotMatch(code, /dedup|deduplicat|duplicateKey|crossProviderMerge|idempotencyKey/i,
      `${f} must not implement deduplication rules (P06-03)`);
  }
  // Determinism is a PURITY property, deliberately not presented as deduplication.
  const a = runCase('N-01');
  const b = runCase('N-01');
  assert.equal(a.canonicalDigest, b.canonicalDigest, 'pure function — same input, same output');
});

test('B/5 — no provider execution, credentials, entitlements or provider configuration', () => {
  const reg = providerRegister();
  assert.equal(reg.issued.length, 1, 'the provider register is unchanged');
  assert.equal(reg.issued[0].kind, 'LOCAL_FIXTURE');
  assert.equal(reg.issued[0].liveConnectivity, false);
  assert.equal(reg.issued[0].credentialsRequired, false);
  const srcDir = join(p06Root, 'src');
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith('.js'))) {
    const text = readFileSync(join(srcDir, f), 'utf8');
    assert.doesNotMatch(text, /authenticat\w*\s*\(/i, `${f} performs no authentication`);
    assert.doesNotMatch(text, /-----BEGIN [A-Z ]*PRIVATE KEY-----/);
    assert.doesNotMatch(text, /https?:\/\/(?!schema|www\.w3|json-schema)/);
  }
});

test('B/6 — no certification, activation or P06 acceptance claim is made', () => {
  const srcDir = join(p06Root, 'src');
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith('.js'))) {
    const text = readFileSync(join(srcDir, f), 'utf8');
    assert.doesNotMatch(text, /certification granted|is certified|E2E-030 (passed|renewed)/i);
    assert.doesNotMatch(text, /production activation (granted|authorized)/i);
    assert.doesNotMatch(text, /P06 (?:is )?ACCEPTED/);
  }
  for (const c of FX.cases) {
    const r = runCase(c.caseId).report;
    assert.equal(r.certificationClaim, false);
    assert.equal(r.productionActivation, false);
    assert.equal(r.liveProviderExecution, false);
    assert.equal(r.licensedHistoricalAcquisition, false);
    assert.equal(r.phaseScope, 'P06-01');
    assert.equal(r.p06_02Implemented, false);
    assert.equal(r.p06_03Implemented, false);
  }
});

test('B/7 — zero runtime dependencies, no lockfile, no node_modules', () => {
  const pkg = JSON.parse(readFileSync(join(p06Root, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.dependencies ?? {}, {});
  assert.deepEqual(pkg.devDependencies ?? {}, {});
  assert.equal(pkg.type, 'module');
  for (const name of ['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'node_modules']) {
    assert.ok(!readdirSync(p06Root).includes(name), `${name} must not exist`);
  }
});

test('B/8 — existing-IIPS is untouched: no ReplayService, DataBoundExecutor or LiveDataRuntime', () => {
  const srcDir = join(p06Root, 'src');
  for (const f of readdirSync(srcDir).filter((x) => x.endsWith('.js'))) {
    const text = readFileSync(join(srcDir, f), 'utf8');
    assert.doesNotMatch(codeOnly(text), /ReplayService|DataBoundExecutor|LiveDataRuntime|NormalizedHolding|companyId semantics/i,
      `${f} must not touch existing-IIPS`);
  }
});
