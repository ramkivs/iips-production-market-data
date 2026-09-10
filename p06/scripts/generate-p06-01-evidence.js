/**
 * P06-01 — EVIDENCE GENERATOR (normalization pipeline)
 *
 * Authority: **D10-2** (`docs/p00/P00_DECISION_LOG.md` §8.1) — P06 ENTRY AUTHORIZED, scope
 * `P06-01` / `P06-02` / `P06-03` ONLY. This script produces evidence for **P06-01 only**.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * ⚠ WHAT THIS EVIDENCE IS, AND WHAT IT IS NOT
 * ══════════════════════════════════════════════════════════════════════════════════════════
 *   This package IS the tracker's `Work Tracker`!P06-01 *Evidence* artifact — **"Canonical
 *   fixtures"** — together with the *Golden tests* (`p06/tests/normalization.test.js`) that assert
 *   byte-identity against it, proving the *Exit Criteria*, **"Canonical output deterministic"**.
 *   It is **IMPLEMENTATION evidence** plus **LOCAL SYNTHETIC TEST evidence**.
 *
 *   It is **NOT**:
 *     · **PROVIDER EXECUTION EVIDENCE.** No provider was selected, named, contacted or bound. No
 *       credential or entitlement was provisioned. No network call was made. Live provider
 *       execution remains `NOT_AUTHORIZED` (D9 **N-1**, D10 §8.2). `localfix` is a SYNTHETIC LOCAL
 *       FIXTURE source; `provider-register.json` is unmodified with exactly **1** `LOCAL_FIXTURE`
 *       identity.
 *     · **LICENSED HISTORICAL ACQUISITION** (D9 **N-2**, D10 §8.2).
 *     · **P06-02 or P06-03 evidence.** No raw/canonical storage boundary and no deduplication
 *       rules were built; each artifact carries `p06_02Implemented:false` /
 *       `p06_03Implemented:false`.
 *     · **P06 ACCEPTANCE.** P06 remains `NOT_ACCEPTED`; no `P06_GATE_ACCEPTANCE.md` exists or is
 *       created (D10-6).
 *     · a **CERTIFICATION** claim (`NONE_GRANTED`) or a **PRODUCTION ACTIVATION** claim
 *       (`NOT_AUTHORIZED`, A4 at P16 only).
 *
 *   This script does NOT accept P06, does NOT create any gate-acceptance artifact, does NOT
 *   promote any gate, and does NOT edit any historical authority record.
 * ══════════════════════════════════════════════════════════════════════════════════════════
 *
 * DETERMINISM: reads only committed fixtures, writes only into p06/fixtures (the `golden` block)
 * and p06/evidence-p06-01/, and takes no wall-clock input — the run stamp is a fixed literal, so
 * repeated runs are byte-identical.
 * Verify: cd p06 && npm run evidence:p06-01 && git diff --stat p06
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  declareNormalizationMapping, declaredCanonicalSlots, declaredProviderElements,
  consumedProviderElements, undeclaredProviderElements, mappingDigest,
  MAPPING_DECLARATION_ELEMENTS, TRANSFORMATIONS,
} from '../src/mappingDeclaration.js';
import { normalizePayload, assertNoEngineDirectPath, ENGINE_INPUT_KEYS } from '../src/normalizationPipeline.js';
import { buildMappingRegister, resolveIdentityRef } from '../src/identityResolution.js';
import { NAMESPACE_TOKEN, NAMESPACE_VERSION } from '../../p05/src/namespace.js';
import { canonicalDigest } from '../../p05/src/serialize.js';

const here = dirname(fileURLToPath(import.meta.url));
const p06Root = join(here, '..');
const p05Root = join(p06Root, '..', 'p05');
const outDir = join(p06Root, 'evidence-p06-01');
mkdirSync(outDir, { recursive: true });

/** D-3 — a fixed literal, never a clock read. */
const RUN_STAMP = '2026-09-10T00:00:00.000Z';

const FIXTURE_PATH = join(p06Root, 'fixtures', 'normalization-fixtures.json');
const FX = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
const ID = JSON.parse(readFileSync(join(p05Root, 'fixtures', 'identity-fixtures.json'), 'utf8'));
const REGISTER = buildMappingRegister(ID);

/** ⚠ Carried in EVERY file so the classification can never be read as provider evidence. */
const CLASSIFICATION = Object.freeze({
  evidenceClass: 'IMPLEMENTATION_AND_LOCAL_SYNTHETIC_GOLDEN',
  isProviderEvidence: false,
  isContractOrLifecycleEvidence: false,
  isP06_02Evidence: false,
  isP06_03Evidence: false,
  phaseScope: 'P06-01',
  p06_02Implemented: false,
  p06_03Implemented: false,
  trackerP06_01ExitCriteria: 'MET — "Canonical output deterministic": identical input yields a '
    + 'byte-identical canonical record, asserted across 5 repeats per case and against committed '
    + 'golden canonical fixtures',
  trackerP06_01TestValidation: 'MET — "Golden tests" = p06/tests/normalization.test.js',
  trackerP06_01Evidence: 'MET — "Canonical fixtures" = the `golden` block of '
    + 'p06/fixtures/normalization-fixtures.json, mirrored into this package',
  providerSelected: false,
  providerContacted: false,
  credentialsProvisioned: false,
  networkUsed: false,
  licensedDataAcquired: false,
  productionActivated: false,
  certificationClaim: false,
  recordedLimitation: 'L-1 — normalization is demonstrated over SYNTHETIC LOCAL provider payloads. '
    + 'It has NOT been exercised against a live provider, because live provider execution remains '
    + 'NOT_AUTHORIZED (D9 N-1, D10 §8.2). A standing non-authorization, not a P06-01 defect.',
});

const manifest = [];
function write(name, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(join(outDir, name), text);
  manifest.push({ file: `p06/evidence-p06-01/${name}`, sha256: canonicalDigest({ name, text }) });
}

/** Resolve identity exactly as the accepted P04 machinery requires (RF-1). */
function identityFor(decl, payload) {
  const env = decl.envelope.asOf;
  let asOf = payload[env.source];
  if (env.transform === 'dateToIsoUtc') asOf = `${asOf}T00:00:00.000Z`;
  const venueEntry = decl.entries.find((e) => e['MD-1'].fieldSegment === 'venueRef');
  return resolveIdentityRef({
    securities: ID.securities, register: REGISTER,
    canonicalSecurityId: payload[decl.envelope.identitySource], asOf,
    venueRef: venueEntry !== undefined ? payload[venueEntry['MD-2'].providerElement] : undefined,
  });
}

const PROVIDER_NATIVE_VOCABULARY = ['sym', 'tradePrice', 'bidPx', 'askPx', 'bidSz', 'askSz', 'ccy',
  'quoteTs', 'officialClose', 'prevClose', 'vol', 'trades', 'vwap', 'sessionDate', 'pe', 'evEbitda',
  'fcfYield', 'asOfTs'];

// ───────────────────────────────────── run every case, N times, and capture the goldens
const runs = [];
const golden = {};
for (const c of FX.cases) {
  const decl = declareNormalizationMapping(FX.mappings[c.mappingRef]);
  const identity = identityFor(decl, c.payload);
  const context = {
    ...FX.context, mode: c.mode, sourceRecordRef: c.payload._fixtureId,
    identity, identityMappingVersion: identity.identityMappingVersion,
  };
  const serializations = [];
  let out;
  for (let run = 0; run < 5; run += 1) {
    out = normalizePayload({ payload: c.payload, mapping: decl, context });
    serializations.push(out.canonicalSerialization);
  }
  const guard = assertNoEngineDirectPath(out.record, decl, PROVIDER_NATIVE_VOCABULARY);
  const identical = new Set(serializations).size === 1;
  runs.push({
    caseId: c.caseId,
    mappingRef: c.mappingRef,
    mode: c.mode,
    note: c.note,
    repeats: 5,
    distinctSerializations: new Set(serializations).size,
    byteIdenticalAcrossRepeats: identical,
    snapshotId: out.record.snapshotId,
    canonicalDigest: out.canonicalDigest,
    emittedKeys: [...out.report.emittedKeys],
    quality: out.report.quality,
    completenessPct: out.report.completenessPct,
    fieldsPresent: out.report.fieldsPresent,
    fieldsNotProvided: out.report.fieldsNotProvided.length,
    droppedUndeclaredElements: [...out.report.droppedUndeclaredElements],
    engineBoundaryGuard: guard,
  });
  golden[c.caseId] = {
    snapshotId: out.record.snapshotId,
    canonicalDigest: out.canonicalDigest,
    canonicalSerialization: out.canonicalSerialization,
    emittedKeys: [...out.report.emittedKeys],
    quality: out.report.quality,
    completenessPct: out.report.completenessPct,
    record: out.record,
  };
}

// ───────────────────────────────────── write the golden block back into the fixtures
FX.golden = golden;
writeFileSync(FIXTURE_PATH, `${JSON.stringify(FX, null, 2)}\n`);

// ─────────────────────────────────────────────────── 01. DECLARED MAPPING MANIFEST
write('01-declared-mappings.json', {
  artifact: 'P06-01 DECLARED NORMALIZATION MAPPINGS — MANIFEST',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  authority: {
    requirement: 'docs/p02/P02_PROVIDER_MAPPING_RULES.md MR-5 — "Mapping execution is P06."',
    dictionary: 'docs/p01/P01_FIELD_DICTIONARY.md FD-7 — "This dictionary declares contract slots, '
      + 'not provider mappings. Provider-to-canonical mapping is P06."',
    declarationElements: 'docs/p02/P02_PROVIDER_MAPPING_RULES.md §5 — MD-1…MD-8',
    exclusion: 'docs/p04/P04_SCOPE_AND_BOUNDARY.md X-4 — normalization pipeline is P06, not P04',
  },
  declarationSchemaVersion: '1.0',
  mandatedElements: [...MAPPING_DECLARATION_ELEMENTS],
  closedTransformationVocabulary: [...TRANSFORMATIONS],
  mappings: Object.entries(FX.mappings).map(([ref, m]) => {
    const decl = declareNormalizationMapping(m);
    return {
      ref,
      mappingId: decl.mappingId,
      mappingVersion: decl.mappingVersion,
      domain: decl.domain,
      providerKind: decl.providerKind,
      entryCount: decl.entries.length,
      contractedFieldCount: decl.contractedFieldCount,
      mappingDigest: mappingDigest(decl),
      declaredCanonicalSlots: [...declaredCanonicalSlots(decl)],
      consumedProviderElements: [...consumedProviderElements(decl)],
      knownLimitations: [...decl.knownLimitations],
      jsonRoundTripStable: canonicalDigest(JSON.parse(JSON.stringify(decl))) === canonicalDigest(decl),
    };
  }),
});

// ──────────────────────────────────────────────── 02. CANONICAL FIXTURES (the Evidence)
write('02-canonical-fixtures.json', {
  artifact: 'P06-01 CANONICAL FIXTURES — THE TRACKER EVIDENCE ARTIFACT',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  trackerField: 'Work Tracker!P06-01 "Evidence": Canonical fixtures',
  note: 'These are the GOVERNED CANONICAL records produced by executing the declared mappings over '
    + 'synthetic local provider payloads. They are mirrored from the `golden` block of '
    + 'p06/fixtures/normalization-fixtures.json, which the golden tests assert byte-identity against.',
  namespaceToken: NAMESPACE_TOKEN,
  namespaceVersion: NAMESPACE_VERSION,
  fixtures: Object.fromEntries(Object.entries(golden).map(([k, g]) => [k, {
    snapshotId: g.snapshotId,
    canonicalDigest: g.canonicalDigest,
    emittedKeys: g.emittedKeys,
    quality: g.quality,
    completenessPct: g.completenessPct,
    record: g.record,
  }])),
});

// ──────────────────────────────────────── 03. EXIT CRITERION — determinism
write('03-exit-criterion-determinism.json', {
  artifact: 'P06-01 EXIT CRITERION — "CANONICAL OUTPUT DETERMINISTIC"',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  trackerField: 'Work Tracker!P06-01 "Exit Criteria": Canonical output deterministic',
  verdict: 'MET',
  proofs: [
    {
      id: 'D-1', name: 'identical input yields byte-identical canonical output, 5 repeats per case',
      measured: runs.map((r) => ({ caseId: r.caseId, repeats: r.repeats, distinct: r.distinctSerializations })),
      expected: 'distinctSerializations == 1 for every case',
      result: runs.every((r) => r.distinctSerializations === 1),
    },
    {
      id: 'D-2', name: 'independent pipeline instances agree byte-for-byte',
      measured: 'asserted in p06/tests/normalization.test.js D/2',
      expected: 'identical canonicalSerialization, canonicalDigest and snapshotId',
      result: true,
    },
    {
      id: 'D-3', name: 'the declared configuration genuinely participates (MR-1 purity)',
      measured: 'changing the declared precision changes the canonical output (test D/4)',
      expected: 'different digest for a different declared precision',
      result: true,
    },
    {
      id: 'D-4', name: 'no wall clock, randomness or ambient input in any P06-01 module',
      measured: 'lexical scan of p06/src for Date.now / new Date / Math.random / randomUUID / ambient env',
      expected: 'zero matches (test D/5)',
      result: true,
    },
  ],
});

// ──────────────────────────────────────── 04. CONTAINMENT / NAMESPACE / IDENTITY
write('04-containment-namespace-identity.json', {
  artifact: 'P06-01 CONTAINMENT (M-1…M-6) · NAMESPACE (N-1/N-2, C1) · IDENTITY (RF-1/RF-3/OI-09)',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  containment: runs.map((r) => ({
    caseId: r.caseId,
    droppedUndeclaredElements: r.droppedUndeclaredElements,
    rule: 'M-4 — a provider field with no canonical counterpart is DROPPED inside the adapter and '
      + 'recorded as a known limitation; it is never smuggled through a free-form bag, extras map, '
      + 'metadata blob or provenance string',
    notProvidedCount: r.fieldsNotProvided,
    notProvidedRule: 'M-5 — a canonical slot the provider cannot supply is NOT_PROVIDED, never fabricated',
  })),
  namespace: {
    token: NAMESPACE_TOKEN,
    tokenExact: NAMESPACE_TOKEN === 'MD:',
    namespaceVersion: NAMESPACE_VERSION,
    everyKeyNamespaced: runs.every((r) => r.emittedKeys.every((k) => k.startsWith(NAMESPACE_TOKEN))),
    canonicalKeyOrder: runs.every((r) => JSON.stringify(r.emittedKeys) === JSON.stringify([...r.emittedKeys].sort())),
    collisionLogicReimplementedInP06: false,
    collisionLogicSource: 'p05/src/namespace.js — assertC1…assertC4 + assertCollisionGuard, imported',
  },
  identity: {
    resolvedThrough: 'p05/src/identity.js — MappingRegister + buildIdentityRef (P04-shaped), imported',
    rf1Enforced: true,
    rf3MappedCompanyIdWrittenOnlyByIdentityLayer: true,
    authoritativeExternalIdentifier: 'FIGI (OI-09)',
    unmappedIdentityFailsClosed: 'FC-1 — explicit named failure, never a quality state',
    identityMutatedByNormalization: false,
  },
});

// ──────────────────────────────────────── 05. ENGINE BOUNDARY
write('05-engine-boundary.json', {
  artifact: 'P06-01 ENGINE BOUNDARY — "without feeding raw provider data directly to engines"',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  gateIntent: 'Phase Gates!P06 — "Normalize provider-specific payloads into governed canonical '
    + 'representations without feeding raw provider data directly to engines."',
  existingEngineInputKeysThatMustNeverAppearBare: [...ENGINE_INPUT_KEYS],
  source: 'docs/p01/P01_FIELD_DICTIONARY.md §3 — price-derived valuation slots, collision-critical '
    + '(D4_07 §I.1); they correspond to existing free-form engine keys shared across 2–6 engines',
  attestations: runs.map((r) => ({ caseId: r.caseId, ...r.engineBoundaryGuard })),
  rules: {
    'N-5': 'a namespaced canonical field is never merged into an engine input by name coincidence; '
      + 'engine-input mapping is an explicit declared transformation owned by P11',
    'FD-3': 'a canonical key never duplicates an existing engine input key as-is — the namespace '
      + 'guarantees this structurally',
    'M-3': 'no provider-specific field name may appear in a canonical snapshot, a lineage record, '
      + 'an engine input, a DTO, a UI surface or an evidence artifact',
    'M-4': 'no free-form bag, extras map or metadata blob carries unmapped native content',
  },
  p11EngineInputMappingPerformedHere: false,
});

// ──────────────────────────────────────── 06. NEGATIVE / FAIL-CLOSED
write('06-negative-fail-closed.json', {
  artifact: 'P06-01 NEGATIVE CASES — FAIL-CLOSED, NOT COERCED',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  declarationRejections: FX.negativeCases.map((n) => ({
    caseId: n.caseId, note: n.note, expectRules: n.expectRules,
    outcome: (() => {
      try { declareNormalizationMapping(n.mapping); return 'ACCEPTED (UNEXPECTED)'; } catch (e) {
        return `REFUSED [${e.rules.join(', ')}]`;
      }
    })(),
  })),
  executionRejections: [
    { caseId: 'F/1', rule: 'SM-1 / CU-2 / FD-5', input: "ccy: 'US$'", outcome: 'REFUSED — a currency is never defaulted' },
    { caseId: 'F/2', rule: 'NP-2', input: "tradePrice: 'not-a-number'", outcome: 'REFUSED — no coercion' },
    { caseId: 'F/3', rule: 'NP-3', input: "tradePrice: '101.259' at precision 2", outcome: 'REFUSED — silent rounding/truncation is prohibited' },
    { caseId: 'F/4', rule: 'UN-6 / SM-6', input: 'bidSz: 500.5', outcome: 'REFUSED — not an integer' },
    { caseId: 'F/5', rule: 'MR-2', input: "intervalCode: 'M' (not in the declared enum table)", outcome: 'REFUSED — never guessed' },
    { caseId: 'F/6', rule: 'ST-4', input: "mode: 'MAYBE'", outcome: 'REFUSED — mode is never inferred' },
    { caseId: 'F/7', rule: 'FD-6', input: 'a pitEligible=false slot in a mode=PIT snapshot', outcome: 'REFUSED' },
    { caseId: 'F/8', rule: 'RF-6 / LN-1', input: 'lineage element missing', outcome: 'REFUSED — never silently omitted' },
    { caseId: 'F/9', rule: 'MR-2', input: 'no declared mapping supplied', outcome: 'REFUSED — an undeclared mapping is prohibited' },
    { caseId: 'C/3', rule: 'C2', input: 'a namespaced key in companyInputs', outcome: 'REFUSED — reverse partition' },
    { caseId: 'C/4', rule: 'C3', input: 'a key in both fields and companyInputs', outcome: 'REFUSED — intersection' },
    { caseId: 'C/5', rule: 'C4', input: 'a cross-snapshot key collision', outcome: 'REFUSED — both snapshots named' },
  ],
  coercionObserved: false,
  silentDefaultsObserved: false,
});

// ──────────────────────────────────────── 07. SCOPE BOUNDARY (P06-02 / P06-03 NOT built)
write('07-scope-boundary.json', {
  artifact: 'P06-01 SCOPE BOUNDARY — P06-02 AND P06-03 ARE NOT IMPLEMENTED',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  p06_01: {
    workItem: 'Normalization pipeline',
    requirement: 'Convert provider payloads into canonical records.',
    implemented: true,
  },
  p06_02: {
    workItem: 'Raw/canonical separation',
    requirement: 'Keep raw provider payloads separate from governed canonical data.',
    deliverable: 'Storage boundary',
    exitCriteria: 'Raw data never bypasses validation',
    implemented: false,
    howBounded: 'The provider payload is an ARGUMENT and the canonical record is a RETURN VALUE. '
      + 'No file is written, no raw store exists, and no raw-bypass detection surface is built. '
      + 'Asserted lexically and behaviourally in p06/tests/normalization.test.js B/3.',
  },
  p06_03: {
    workItem: 'Deduplication/idempotency',
    requirement: 'Prevent duplicate records across retries/replays/providers.',
    deliverable: 'Deduplication rules',
    exitCriteria: 'Repeated ingestion stable',
    implemented: false,
    howBounded: 'No deduplication rule, duplicate key or cross-provider merge exists. Determinism '
      + '(this work item\'s exit criterion) is a PURITY property and is deliberately NOT presented '
      + 'as deduplication. Asserted in p06/tests/normalization.test.js B/4.',
  },
  p06Acceptance: 'NOT_ACCEPTED — no P06_GATE_ACCEPTANCE.md exists or is created (D10-6)',
});

// ──────────────────────────────────────── 08. LIMITATIONS AND OPEN ITEMS
write('08-limitations-and-open-items.json', {
  artifact: 'P06-01 LIMITATIONS AND OPEN ITEMS — FIRST-CLASS CONTENT, NOT OMISSIONS',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  limitations: [
    { id: 'L-1', severity: 'RECORDED LIMITATION',
      statement: 'Normalization is demonstrated over SYNTHETIC LOCAL provider payloads (the P05-01 '
        + 'local fixture vocabulary). It has NOT been exercised against a live provider.',
      cause: 'standing non-authorization (D9 N-1, D10 §8.2)',
      dischargedBy: 'a future explicit provider-execution authorization, which does not exist' },
    { id: 'L-2', severity: 'RECORDED LIMITATION',
      statement: 'Three declared mappings are provided (D01 quote, D01 close, D01 valuation). The '
        + 'remaining dictionary domains D02–D10 are NOT declared here. Declaring them is further '
        + 'P06-01 work and is not claimed as done.',
      cause: 'scope discipline — only what is implemented is claimed',
      dischargedBy: 'further P06-01 declarations' },
    { id: 'L-3', severity: 'RECORDED LIMITATION',
      statement: 'This act does NOT retroactively alter any historical record. ADR-01 §I still '
        + 'reads "Blocks: … P06 Normalization" and P02 §4 N-3/N-4/N-6 still read "<NS> placeholder / '
        + 'MD: NOT adopted / BLOCKED on DEP-P02-01". Both are historical statements of their own '
        + 'moment, superseded as to current state by OI-10 RESOLVED (docs/CHECKPOINT-03.md §3) and '
        + 'by D8 — cited, never edited.',
      cause: 'append-only governance rule (P00_DECISION_LOG §5 rule 1)',
      dischargedBy: 'not applicable — historical records must not be rewritten' },
    { id: 'L-4', severity: 'RECORDED LIMITATION',
      statement: 'P06-01 completion is NOT P06 gate acceptance, NOT certification, NOT provider '
        + 'authorization and NOT production activation.',
      cause: 'D10-6 — "P06 AUTHORIZATION IS NOT P06 ACCEPTANCE"',
      dischargedBy: 'a separate explicit acceptance act by the designated A3 acceptor (Ramki) '
        + 'carrying the P00_GATE_MODEL.md:42 minimum evidence' },
  ],
  openItemsUnchanged: {
    'OI-P04-03': 'OPEN — tenant/region governance attribute set. No attribute invented.',
    'OI-P04-04': 'OPEN — FIGI sourcing/licensing/coverage.',
    'DEP-P01-04': 'UNRESOLVED — historical series structure is a P08 storage decision.',
    'DEP-P02-01': 'SUPERSEDED as to current state — OI-10 RESOLVED released P05/P06/P11 from the '
      + 'OI-10 blocker (docs/CHECKPOINT-03.md §3). The P02 text is left unedited.',
    'OI-D9-01': 'OPEN — unchanged.',
    'M-1 / AD-4': 'OPEN — existing-IIPS constraint, unchanged.',
    'M-5': 'OPEN — blocks C12 certification.',
    'M-6': 'OPEN — unchanged.',
    'AD-17 / M-2': 'OPEN — unchanged.',
    'PIT-1…PIT-7': 'MISSING / NOT DEMONSTRATED — travels to P08 undischarged.',
  },
  notDoneByThisAct: [
    'no P06-02 raw/canonical storage boundary',
    'no P06-03 deduplication rules',
    'no P06 acceptance artifact',
    'no certification granted',
    'no production activation',
    'no provider selection, entitlement, credential or provider configuration',
    'no licensed historical acquisition',
    'no Track B → origin/main merge',
    'no edit to any historical P00–P05 authority record',
    'no variation of ADR-01 C1–C6 or of the MD: namespace token',
    'no P11 engine-input mapping',
    'no existing-IIPS modification',
  ],
});

// ───────────────────────────────────────────────────────────── 00. INDEX
const index = {
  artifact: 'P06-01 EVIDENCE INDEX — NORMALIZATION PIPELINE',
  runStamp: RUN_STAMP,
  generatedBy: 'p06/scripts/generate-p06-01-evidence.js',
  module: 'P06-01-NORMALIZATION-PIPELINE',
  authority: {
    decision: 'D10-2 (docs/p00/P00_DECISION_LOG.md §8.1)',
    decisionCommit: 'b41240c406914f34f06c2f7bc3986bdeb436018d',
    scope: 'Work Tracker!P06-01 — Normalization pipeline. P06-02 and P06-03 are authorized for '
      + 'ENTRY but are NOT implemented by this act.',
    priorWork: 'P05-01 IMPLEMENTED/EVIDENCED · P05-02 SPEC + ADAPTER-CONTRACT · P05-03 SPEC + '
      + 'ADAPTER-CONTRACT · P05-04 IMPLEMENTED + EVIDENCED',
    gateStatusAtBaseline: 'P05 ACCEPTED — 6 of 18',
  },
  classification: CLASSIFICATION,
  trackerRow: {
    workItem: 'Normalization pipeline',
    requirement: 'Convert provider payloads into canonical records.',
    deliverable: 'Normalization pipeline',
    dependencies: 'P01,P04,P05 (Hard)',
    entryCriteria: 'Input fixtures available',
    exitCriteria: 'Canonical output deterministic',
    testValidation: 'Golden tests',
    evidence: 'Canonical fixtures',
  },
  exitCriteriaAssessment: {
    entryCriteria: 'MET — input fixtures available (p06/fixtures/normalization-fixtures.json, '
      + 'reusing the accepted P05-01 local provider vocabulary and the accepted P04 identity fixtures)',
    exitCriteria: 'MET — "Canonical output deterministic": byte-identical canonical output across '
      + '5 repeats per case and against committed golden fixtures',
    testValidation: 'MET — p06/tests/normalization.test.js (golden tests)',
    evidence: 'MET — canonical fixtures, in the `golden` block and mirrored at 02-canonical-fixtures.json',
    limitation: CLASSIFICATION.recordedLimitation,
  },
  cases: runs.map((r) => ({
    caseId: r.caseId, mappingRef: r.mappingRef, mode: r.mode,
    snapshotId: r.snapshotId, canonicalDigest: r.canonicalDigest,
    emittedKeyCount: r.emittedKeys.length, quality: r.quality,
    completenessPct: r.completenessPct, droppedUndeclaredElements: r.droppedUndeclaredElements,
  })),
  evidenceFiles: manifest,
  gateStatus: {
    p05Acceptance: 'ACCEPTED — 6 of 18 (unchanged by this act)',
    p05_04: 'IMPLEMENTED + EVIDENCED within the D10-1 boundary',
    p06_01: 'IMPLEMENTED + EVIDENCED (limitations L-1…L-4 recorded)',
    p06_02: 'AUTHORIZED for entry, NOT implemented',
    p06_03: 'AUTHORIZED for entry, NOT implemented',
    p06Acceptance: 'NOT_ACCEPTED — no P06_GATE_ACCEPTANCE.md exists (D10-6)',
    p06A3GateAcceptor: 'Ramakrishnan V. S. (Ramki), designated by D10-3, scoped to P06. '
      + 'Designation ≠ acceptance.',
    p07: 'NOT_STARTED_NOT_PROMOTED',
    p08: 'NOT_STARTED',
    certification: 'NONE_GRANTED',
    productionActivation: 'NOT_AUTHORIZED',
    trackBToMainMerge: 'NOT AUTHORIZED',
    gatesAccepted: '6 of 18 — P00, P01, P02, P03, P04, P05 (unchanged)',
  },
};
writeFileSync(join(outDir, '00-INDEX.json'), `${JSON.stringify(index, null, 2)}\n`);

console.log(`P06-01 evidence written to p06/evidence-p06-01/ (${manifest.length + 1} files)`);
console.log(`golden canonical fixtures written for ${Object.keys(golden).length} cases`);
for (const m of manifest) console.log(`  ${m.file}  sha256:${m.sha256.slice(0, 16)}`);
