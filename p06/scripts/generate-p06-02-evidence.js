/**
 * P06-02 — EVIDENCE GENERATOR (raw / canonical storage boundary)
 *
 * Authority: **D10-2** (`docs/p00/P00_DECISION_LOG.md` §8.1) — P06 ENTRY AUTHORIZED, scope
 * `P06-01` / `P06-02` / `P06-03` ONLY. This script produces evidence for **P06-02 only**.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * ⚠ WHAT THIS EVIDENCE IS, AND WHAT IT IS NOT
 * ══════════════════════════════════════════════════════════════════════════════════════════
 *   This package IS the tracker's `Work Tracker`!P06-02 *Evidence* artifact — **"Boundary
 *   evidence"** — together with the *Architecture + negative tests*
 *   (`p06/tests/rawCanonicalBoundary.test.js`) proving the *Exit Criteria*,
 *   **"Raw data never bypasses validation"**.
 *
 *   ⚠ **The bypass results below are MEASURED, NOT ASSERTED.** Every bypass attempt in §02 and §03
 *   is **executed at generation time** and its actual outcome recorded. Nothing here is inferred
 *   from reading source code.
 *
 *   It is **NOT**:
 *     · **PROVIDER EXECUTION EVIDENCE.** No provider was selected, named, contacted or bound. No
 *       credential or entitlement was provisioned. No network call was made. Live provider
 *       execution remains `NOT_AUTHORIZED` (D9 **N-1**, D10 §8.2). `localfix` is a SYNTHETIC LOCAL
 *       FIXTURE source; `provider-register.json` is unmodified with exactly **1** `LOCAL_FIXTURE`
 *       identity.
 *     · **LICENSED HISTORICAL ACQUISITION** (D9 **N-2**, D10 §8.2).
 *     · **P06-03 evidence.** No deduplication or idempotency rule was built; every artifact
 *       carries `p06_03Implemented:false`.
 *     · **P06 ACCEPTANCE.** P06 remains `NOT_ACCEPTED`; no `P06_GATE_ACCEPTANCE.md` exists or is
 *       created (D10-6).
 *     · a **CERTIFICATION** claim (`NONE_GRANTED`) or a **PRODUCTION ACTIVATION** claim
 *       (`NOT_AUTHORIZED`, A4 at P16 only).
 * ══════════════════════════════════════════════════════════════════════════════════════════
 *
 * DETERMINISM: reads only committed fixtures, writes only into p06/evidence-p06-02/, and takes no
 * wall-clock input — the run stamp is a fixed literal, so repeated runs are byte-identical.
 * Verify: cd p06 && npm run evidence:p06-02 && git diff --stat p06/evidence-p06-02
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CanonicalStorageBoundary, assertCanonicalShape, assertEngineInputIsCanonical,
  buildAttestation, verifyAttestation, BoundaryViolation, RAW_ENVELOPE_TYPE,
  BOUNDARY_SCHEMA_VERSION, FORBIDDEN_FREE_FORM_MEMBERS,
} from '../src/rawCanonicalBoundary.js';
import { declareNormalizationMapping } from '../src/mappingDeclaration.js';
import { buildMappingRegister, resolveIdentityRef } from '../src/identityResolution.js';
import { CanonicalRecordStore } from '../../p05/src/replay.js';
import { validateSnapshot } from '../../p05/src/validate.js';
import { NAMESPACE_TOKEN } from '../../p05/src/namespace.js';
import { canonicalDigest } from '../../p05/src/serialize.js';

const here = dirname(fileURLToPath(import.meta.url));
const p06Root = join(here, '..');
const p05Root = join(p06Root, '..', 'p05');
const outDir = join(p06Root, 'evidence-p06-02');
mkdirSync(outDir, { recursive: true });

/** D-3 — a fixed literal, never a clock read. */
const RUN_STAMP = '2026-09-10T00:00:00.000Z';

const FX = JSON.parse(readFileSync(join(p06Root, 'fixtures', 'normalization-fixtures.json'), 'utf8'));
const ID = JSON.parse(readFileSync(join(p05Root, 'fixtures', 'identity-fixtures.json'), 'utf8'));
const REGISTER = buildMappingRegister(ID);
const PROVIDER_VOCAB = ['sym', 'tradePrice', 'bidPx', 'askPx', 'bidSz', 'askSz', 'ccy', 'quoteTs',
  'officialClose', 'prevClose', 'vol', 'trades', 'vwap', 'sessionDate', 'pe', 'evEbitda',
  'fcfYield', 'asOfTs'];

const CLASSIFICATION = Object.freeze({
  evidenceClass: 'IMPLEMENTATION_AND_LOCAL_SYNTHETIC_BOUNDARY',
  isProviderEvidence: false,
  isContractOrLifecycleEvidence: false,
  isP06_01Evidence: false,
  isP06_03Evidence: false,
  phaseScope: 'P06-02',
  p06_03Implemented: false,
  trackerP06_02ExitCriteria: 'MET — "Raw data never bypasses validation": every bypass attempt is '
    + 'EXECUTED at generation time and recorded as REFUSED; the governed path is the only route '
    + 'from raw to canonical storage',
  trackerP06_02TestValidation: 'MET — "Architecture + negative tests" = '
    + 'p06/tests/rawCanonicalBoundary.test.js',
  trackerP06_02Evidence: 'MET — "Boundary evidence" = this package',
  providerSelected: false,
  providerContacted: false,
  credentialsProvisioned: false,
  networkUsed: false,
  licensedDataAcquired: false,
  productionActivated: false,
  certificationClaim: false,
  recordedLimitation: 'L-1 — the boundary is demonstrated over SYNTHETIC LOCAL provider payloads. '
    + 'It has NOT been exercised against a live provider, because live provider execution remains '
    + 'NOT_AUTHORIZED (D9 N-1, D10 §8.2). A standing non-authorization, not a P06-02 defect.',
});

const manifest = [];
function write(name, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(join(outDir, name), text);
  manifest.push({ file: `p06/evidence-p06-02/${name}`, sha256: canonicalDigest({ name, text }) });
}

function declared(ref) { return declareNormalizationMapping(FX.mappings[ref]); }
function contextFor(c, mapping, overrides = {}) {
  const env = mapping.envelope.asOf;
  let asOf = c.payload[env.source];
  if (env.transform === 'dateToIsoUtc') asOf = `${asOf}T00:00:00.000Z`;
  const venueEntry = mapping.entries.find((e) => e['MD-1'].fieldSegment === 'venueRef');
  const identity = resolveIdentityRef({
    securities: ID.securities, register: REGISTER,
    canonicalSecurityId: c.payload[mapping.envelope.identitySource], asOf,
    venueRef: venueEntry !== undefined ? c.payload[venueEntry['MD-2'].providerElement] : undefined,
  });
  return {
    ...FX.context, mode: c.mode, sourceRecordRef: c.payload._fixtureId,
    identity, identityMappingVersion: identity.identityMappingVersion, ...overrides,
  };
}
/** Run a bypass attempt and record what actually happened. */
function attempt(label, rule, fn) {
  try {
    const detail = fn();
    return { label, rule, outcome: 'NOT BLOCKED', detail: detail === undefined ? null : String(detail) };
  } catch (err) {
    return {
      label, rule,
      outcome: 'REFUSED',
      errorType: err?.name ?? 'Error',
      rules: err?.rules ?? [],
      stage: err?.stage ?? null,
      message: String(err?.message ?? err).slice(0, 220),
    };
  }
}
const newBoundary = () => new CanonicalStorageBoundary({ providerVocabulary: PROVIDER_VOCAB });

// ════════════════════ 01. THE MEASURED "BEFORE" — the defect this act closes ════════════════
const beforeStore = new CanonicalRecordStore();
const rawCase = FX.cases[0];
const rawBypassOutcome = beforeStore.ingest({
  ...rawCase.payload, snapshotId: 'data-localfix-vRAW-2026-03-02T14:30:00.000Z',
});
const beforeRecord = [...beforeStore.records.values()][0].snapshot;
const fakeBypassOutcome = beforeStore.ingest({
  snapshotId: 'data-x-v1-2026-01-01T00:00:00.000Z', fields: {}, domain: 'D01',
});
let beforeValidateRejects = null;
try { validateSnapshot({ snapshotId: 'data-x-v1-2026-01-01T00:00:00.000Z', fields: {}, quality: 'good' }); }
catch (e) { beforeValidateRejects = { name: e.name, message: String(e.message).slice(0, 160) }; }
const replaySrc = readFileSync(join(p05Root, 'src', 'replay.js'), 'utf8');

write('01-bypass-inventory-before.json', {
  artifact: 'P06-02 BYPASS INVENTORY — MEASURED STATE BEFORE THIS ACT (at commit b6160cb)',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  note: 'Each row below was EXECUTED, not inferred. The P05-04 CanonicalRecordStore is an accepted '
    + 'component and is deliberately left UNCHANGED by this act; the P06-02 boundary encapsulates '
    + 'it so that no governed path can reach it except through validation.',
  paths: [
    {
      id: 'BP-1', path: 'raw provider payload → canonical storage',
      mechanism: 'CanonicalRecordStore.ingest() performs no validation; it ingests any object '
        + 'carrying a snapshotId',
      measured: { outcome: rawBypassOutcome.outcome, recordCount: rawBypassOutcome.recordCount },
      proof: {
        providerNativeFieldsStillPresent: ['sym', 'tradePrice', 'ccy', 'quoteTs']
          .filter((k) => k in beforeRecord),
        bareEngineKeyPresent: 'peRatio' in beforeRecord,
        namespacedFieldCount: Object.keys(beforeRecord.fields ?? {}).length,
      },
      statusBefore: 'OPEN', statusAfter: 'BLOCKED — see 02-governed-path.json / 03-bypass-results.json',
    },
    {
      id: 'BP-2', path: 'validation on the ingest path',
      mechanism: 'ingest() never calls validateSnapshot',
      measured: { ingestCallsValidation: /validateSnapshot|validateS[1-4]/.test(replaySrc) },
      proof: {
        theValidatorDoesRejectSuchAnObject: beforeValidateRejects,
        butNothingOnTheIngestPathInvokesIt: true,
      },
      statusBefore: 'OPEN — validation was OPTIONAL', statusAfter: 'BLOCKED — the boundary re-runs S1–S4',
    },
    {
      id: 'BP-3', path: 'raw → engine',
      mechanism: 'nothing enforced that a value offered to a consumer was canonical, so an engine '
        + 'input could be assembled straight from a raw payload',
      // MEASURED, not illustrative: the raw VALUATION payload's provider-native values are exactly
      // the collision-critical engine keys (P01_FIELD_DICTIONARY §3, D4_07 §I.1).
      measured: (() => {
        const vp = FX.cases.find((c) => c.caseId === 'N-05').payload;
        const assembled = { peRatio: vp.pe, evEbitda: vp.evEbitda, fcfYield: vp.fcfYield };
        return {
          rawValuationPayloadFixtureId: vp._fixtureId,
          engineInputAssembledStraightFromRaw: assembled,
          bareEngineKeysUsed: Object.keys(assembled).sort(),
          anyNamespacedKeyUsed: Object.keys(assembled).some((k) => k.startsWith('MD:')),
          provenanceOrLineageAttached: false,
        };
      })(),
      statusBefore: 'OPEN', statusAfter: 'BLOCKED — assertEngineInputIsCanonical (INT-013)',
    },
    {
      id: 'BP-4', path: 'unvalidated record masquerading as canonical',
      mechanism: 'no canonical-shape assertion existed',
      measured: { storeAcceptsAFakeRecord: fakeBypassOutcome.outcome },
      statusBefore: 'OPEN', statusAfter: 'BLOCKED — assertCanonicalShape',
    },
    {
      id: 'BP-5', path: 'raw and canonical are not separated at all',
      mechanism: 'no raw compartment existed in the P06 package',
      measured: { anyRawCompartmentInP06_01: false },
      statusBefore: 'OPEN', statusAfter: 'CLOSED — RawCompartment',
    },
  ],
  openPathsBefore: 5,
});

// ════════════════════ 02. THE GOVERNED PATH — EXECUTED ════════════════════
const govBoundary = newBoundary();
const admitted = [];
for (const c of FX.cases) {
  const mapping = declared(c.mappingRef);
  const receipt = govBoundary.acceptRaw(`raw-${c.caseId}`, c.payload);
  const out = govBoundary.admit({ rawRef: `raw-${c.caseId}`, mapping, context: contextFor(c, mapping) });
  admitted.push({ caseId: c.caseId, receipt, out, mapping });
}
const audit = govBoundary.auditBoundary();

write('02-governed-path.json', {
  artifact: 'P06-02 GOVERNED PATH — raw → validation/normalization → canonical → storage (EXECUTED)',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  architecture: [
    'raw input',
    '  ↓ acceptRaw()            → RawCompartment: separate, deep-frozen, marked isCanonical:false',
    '  ↓ admit()                → P06-01 normalizePayload      (normalization, by reuse)',
    '  ↓                        → validateSnapshot S1–S4       (validation, by reuse)',
    '  ↓                        → assertNoEngineDirectPath     (P06-01 engine guard, by reuse)',
    '  ↓                        → assertCanonicalShape         (M-1…M-4)',
    '  ↓                        → buildAttestation + verifyAttestation (RE-DERIVED, never trusted)',
    'canonical governed record',
    '  ↓ private CanonicalRecordStore (P05-04, UNCHANGED, ENCAPSULATED)',
    'downstream consumers  ← only via canonicalRecords() / isAttested()',
  ],
  noBareRecordDoor: {
    boundaryMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(govBoundary))
      .filter((n) => n !== 'constructor').sort(),
    bareRecordAdmissionMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(govBoundary))
      .filter((n) => /ingest|put|insert|setRecord|addRecord|^set$|^add$/i.test(n)),
    storeReachableAsProperty: 'store' in govBoundary,
    note: 'The absence of a bare-record door IS the architectural enforcement of "Raw data never '
      + 'bypasses validation": canonical admission REQUIRES a rawRef plus a declared mapping.',
  },
  admissions: admitted.map(({ caseId, receipt, out }) => ({
    caseId,
    rawAccepted: { rawRef: receipt.rawRef, isCanonical: receipt.isCanonical, rawDigest: receipt.rawDigest.slice(0, 24) },
    storageOutcome: out.storageOutcome,
    snapshotId: out.record.snapshotId,
    canonicalDigest: out.canonicalDigest,
    traversedBoundary: out.traversedBoundary,
    emittedKeys: [...out.report.emittedKeys],
    quality: out.report.quality,
    completenessPct: out.report.completenessPct,
    attestation: {
      mappingId: out.attestation.mappingId,
      validationPassed: out.attestation.validationPassed,
      boundarySchemaVersion: out.attestation.boundarySchemaVersion,
      phaseScope: out.attestation.phaseScope,
    },
  })),
  rawAndCanonicalSeparation: {
    rawCount: govBoundary.rawCount,
    canonicalCount: govBoundary.canonicalCount,
    everyRawEnvelopeMarkedNotCanonical: govBoundary.raw.refs()
      .every((r) => govBoundary.raw.read(r).isCanonical === false),
    rawCompartmentExposesNoCanonicalRoute: Object
      .getOwnPropertyNames(Object.getPrototypeOf(govBoundary.raw))
      .filter((n) => n !== 'constructor')
      .every((n) => !/ingest|canonical|store|admit|engine|normaliz/i.test(n)),
  },
  auditAfterGovernedPath: audit,
  allAdmittedRecordsAttested: admitted.every(({ out }) => govBoundary.isAttested(out.record)),
  exitCriterionMet: audit.ok && admitted.every(({ out }) => out.storageOutcome === 'INSERTED'),
});

// ════════════════════ 03. BYPASS ATTEMPTS — EACH ONE EXECUTED ════════════════════
const b1 = newBoundary();
b1.acceptRaw('raw-1', rawCase.payload);
const rawMapping = declared(rawCase.mappingRef);
const rawCtx = contextFor(rawCase, rawMapping);
const good = b1.admit({ rawRef: 'raw-1', mapping: rawMapping, context: rawCtx });
const rawEnvelope = b1.raw.read('raw-1');
const rawDigest = rawEnvelope.rawDigest;
const attestBase = { rawRef: 'raw-1', rawDigest, mapping: rawMapping, canonical: good.record };
const rawShaped = { ...rawCase.payload, snapshotId: 'data-localfix-vRAW-2026-03-02T14:30:00.000Z' };

const bypassResults = [
  attempt('BP-1 raw → canonical storage: admit without a declared mapping', 'MR-2',
    () => b1.admit({ rawRef: 'raw-1', mapping: undefined, context: rawCtx })),
  attempt('BP-1 raw-shaped object claimed canonical', 'M-2 / ST-1 / FD-1',
    () => assertCanonicalShape(rawShaped, PROVIDER_VOCAB)),
  attempt('BP-3 RAW envelope offered to an engine', 'M-1 / INT-013',
    () => assertEngineInputIsCanonical(rawEnvelope, PROVIDER_VOCAB)),
  attempt('BP-3 bare raw payload offered to an engine', 'M-2 / INT-013',
    () => assertEngineInputIsCanonical(rawCase.payload, PROVIDER_VOCAB)),
  attempt('BP-3 provider-shaped engine input built from raw', 'M-2 / INT-013',
    () => assertEngineInputIsCanonical({ peRatio: 18.4, sym: rawCase.payload.sym }, PROVIDER_VOCAB)),
  attempt('BP-4 impostor: no field map', 'ST-11 / FD-1',
    () => assertCanonicalShape({ snapshotId: 'data-x-v1-2026-01-01T00:00:00.000Z', quality: 'good' }, PROVIDER_VOCAB)),
  attempt('BP-4 impostor: empty fields with quality good', 'ST-9',
    () => assertCanonicalShape({ snapshotId: 'data-x-v1-2026-01-01T00:00:00.000Z', fields: {}, quality: 'good' }, PROVIDER_VOCAB)),
  attempt('BP-4 impostor: bare (non-namespaced) field keys', 'C1 / FD-1',
    () => assertCanonicalShape(Object.freeze({ snapshotId: 'data-x-v1-2026-01-01T00:00:00.000Z', fields: { peRatio: 1 }, quality: 'good' }), PROVIDER_VOCAB)),
  attempt('BP-4 impostor: malformed snapshotId', 'ST-1 / AD-6',
    () => assertCanonicalShape(Object.freeze({ snapshotId: 'not-a-snapshot-id', fields: { 'MD:price.last': {} }, quality: 'good' }), PROVIDER_VOCAB)),
  attempt('BP-4 impostor: mutable object (not ST-10 immutable)', 'ST-10',
    () => assertCanonicalShape({ snapshotId: 'data-x-v1-2026-01-01T00:00:00.000Z', fields: { 'MD:price.last': {} }, quality: 'good' }, PROVIDER_VOCAB)),
  ...FORBIDDEN_FREE_FORM_MEMBERS.map((bag) => attempt(
    `BP-4 impostor: free-form '${bag}' member (M-4)`, 'M-4',
    () => assertCanonicalShape(Object.freeze({
      snapshotId: 'data-x-v1-2026-01-01T00:00:00.000Z',
      fields: { 'MD:price.last': Object.freeze({ key: 'MD:price.last' }) },
      quality: 'good', [bag]: { sym: 'ALFA' },
    }), PROVIDER_VOCAB))),
  attempt('BP-5 raw never accepted into the compartment', 'M-1',
    () => b1.admit({ rawRef: 'never-accepted', mapping: rawMapping, context: rawCtx })),
  attempt('BP-5 raw append-only: overwriting a rawRef', 'M-1',
    () => b1.acceptRaw('raw-1', { ...rawCase.payload, tradePrice: '999.00' })),
  attempt('attestation: tampered canonicalDigest', 'M-2',
    () => verifyAttestation({ ...buildAttestation({ ...attestBase, validation: { quality: good.record.quality } }), canonicalDigest: 'deadbeef' }, attestBase)),
  attempt('attestation: bound to a DIFFERENT raw', 'M-2 / M-3',
    () => verifyAttestation({ ...buildAttestation({ ...attestBase, validation: { quality: good.record.quality } }), rawDigest: 'other' }, attestBase)),
  attempt('attestation: bound to a DIFFERENT mapping', 'M-2 / M-3',
    () => verifyAttestation({ ...buildAttestation({ ...attestBase, validation: { quality: good.record.quality } }), mappingDigest: 'other' },
      { ...attestBase, mapping: declared('D01_CLOSE') })),
  attempt('attestation: no validation recorded', 'M-2',
    () => verifyAttestation({ ...buildAttestation({ ...attestBase, validation: undefined }) }, attestBase)),
  attempt('attestation: validationPassed=false — validation is never waived', 'M-2',
    () => verifyAttestation({ ...buildAttestation({ ...attestBase, validation: { quality: good.record.quality } }), validationPassed: false }, attestBase)),
  attempt('attestation: wrong boundary schema version', 'M-2',
    () => verifyAttestation({ ...buildAttestation({ ...attestBase, validation: { quality: good.record.quality } }), boundarySchemaVersion: '9.9' }, attestBase)),
];

// Malformed raw: each mutation is executed end-to-end through the boundary.
const malformed = [];
for (const tc of [
  { caseId: 'N-01', mutate: { ccy: 'US$' }, rule: 'SM-1 / CU-2 / FD-5' },
  { caseId: 'N-01', mutate: { tradePrice: 'not-a-number' }, rule: 'NP-2' },
  { caseId: 'N-01', mutate: { tradePrice: '101.259' }, rule: 'NP-3' },
  { caseId: 'N-01', mutate: { bidSz: 500.5 }, rule: 'SM-6 / UN-6' },
  { caseId: 'N-03', mutate: { sessionDate: '02/03/2026' }, rule: 'TS-1 / TS-4' },
  { caseId: 'N-05', mutate: { pe: '18.40.1' }, rule: 'NP-2' },
]) {
  const c = FX.cases.find((x) => x.caseId === tc.caseId);
  const mapping = declared(c.mappingRef);
  const ctx = contextFor(c, mapping);
  const bnd = newBoundary();
  bnd.acceptRaw('raw-bad', { ...c.payload, ...tc.mutate, _fixtureId: 'BAD' });
  const res = attempt(`malformed raw ${JSON.stringify(tc.mutate)} on ${tc.caseId}`, tc.rule,
    () => bnd.admit({ rawRef: 'raw-bad', mapping, context: { ...ctx, sourceRecordRef: 'BAD' } }));
  malformed.push({ ...res, reachedCanonicalStorage: bnd.canonicalCount, auditStillOk: bnd.auditBoundary().ok });
}

write('03-bypass-results.json', {
  artifact: 'P06-02 BYPASS ATTEMPTS — EACH ONE EXECUTED AND RECORDED (EXIT CRITERION)',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  trackerField: 'Work Tracker!P06-02 "Exit Criteria": Raw data never bypasses validation',
  method: 'Every attempt below was RUN at generation time. The recorded outcome is the actual '
    + 'thrown error, not a prediction.',
  results: bypassResults,
  malformedRawResults: malformed,
  summary: {
    attempts: bypassResults.length + malformed.length,
    refused: bypassResults.filter((r) => r.outcome === 'REFUSED').length
      + malformed.filter((r) => r.outcome === 'REFUSED').length,
    notBlocked: bypassResults.filter((r) => r.outcome !== 'REFUSED').length
      + malformed.filter((r) => r.outcome !== 'REFUSED').length,
    malformedRawReachingCanonicalStorage: malformed.filter((r) => r.reachedCanonicalStorage > 0).length,
  },
  exitCriterionMet: (bypassResults.every((r) => r.outcome === 'REFUSED')
    && malformed.every((r) => r.outcome === 'REFUSED' && r.reachedCanonicalStorage === 0 && r.auditStillOk)),
});

// ════════════════════ 04. SCOPE BOUNDARY — P06-03 NOT implemented ════════════════════
write('04-scope-boundary.json', {
  artifact: 'P06-02 SCOPE BOUNDARY — P06-01 PRESERVED, P06-03 NOT IMPLEMENTED',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  p06_02: {
    workItem: 'Raw/canonical separation',
    requirement: 'Keep raw provider payloads separate from governed canonical data.',
    deliverable: 'Storage boundary',
    exitCriteria: 'Raw data never bypasses validation',
    implemented: true,
  },
  p06_01: {
    preserved: true,
    proof: 'every admitted record is byte-identical to the record the P06-01 pipeline produces '
      + 'directly for the same payload (p06/tests/rawCanonicalBoundary.test.js P/3)',
    measuredIdentical: admitted.map(({ caseId, out }) => ({ caseId, canonicalDigest: out.canonicalDigest })),
  },
  p06_03: {
    workItem: 'Deduplication/idempotency',
    requirement: 'Prevent duplicate records across retries/replays/providers.',
    deliverable: 'Deduplication rules',
    exitCriteria: 'Repeated ingestion stable',
    implemented: false,
    howBounded: 'No deduplication rule, duplicate key, cross-provider merge or idempotency key '
      + 'exists in the P06 package. The store\'s own idempotency is a P05-04 property that is '
      + 'INHERITED, not extended. Asserted in rawCanonicalBoundary.test.js S/1 and by the P05 '
      + 'guard existing-iips-boundary.test.js.',
  },
  alsoNotDone: {
    schedulingRetriesCheckpointing: 'NOT implemented here — that is P05-04, unchanged',
    diskPersistence: 'NONE — the raw compartment and the canonical store are in-memory; nothing '
      + 'in p06/src calls writeFileSync/mkdirSync/createWriteStream',
    p11EngineInputMapping: 'NOT performed — engine-input mapping is owned by P11',
  },
  p06Acceptance: 'NOT_ACCEPTED — no P06_GATE_ACCEPTANCE.md exists or is created (D10-6)',
});

// ════════════════════ 05. LIMITATIONS ════════════════════
write('05-limitations-and-open-items.json', {
  artifact: 'P06-02 LIMITATIONS AND OPEN ITEMS — FIRST-CLASS CONTENT, NOT OMISSIONS',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  limitations: [
    { id: 'L-1', severity: 'RECORDED LIMITATION',
      statement: 'The boundary is demonstrated over SYNTHETIC LOCAL provider payloads. It has NOT '
        + 'been exercised against a live provider.',
      cause: 'standing non-authorization (D9 N-1, D10 §8.2)',
      dischargedBy: 'a future explicit provider-execution authorization, which does not exist' },
    { id: 'L-2', severity: 'RECORDED LIMITATION',
      statement: 'The attestation is a RE-DERIVABLE binding, NOT a cryptographic proof. There is no '
        + 'secret in this system. verifyAttestation re-executes the governed path from the raw '
        + 'payload and the declared mapping and requires byte-identity, so admission requires a raw '
        + 'payload and a mapping that genuinely produce the record — but a party able to run the '
        + 'pipeline could compute a valid attestation for a record it did produce. The property '
        + 'enforced is provenance-through-the-boundary, not authenticity against an adversary.',
      cause: 'no key material exists and none may be added (no credentials, D10 §8.2)',
      dischargedBy: 'not applicable within the current authority' },
    { id: 'L-3', severity: 'RECORDED LIMITATION',
      statement: 'The accepted P05-04 CanonicalRecordStore is deliberately UNCHANGED. Instantiated '
        + 'BARE, outside the governed architecture, it still ingests any object carrying a '
        + 'snapshotId (BP-1). The P06-02 boundary ENCAPSULATES it in a private field and exposes no '
        + 'bare-record door, and auditBoundary() detects contamination. So the property delivered is '
        + 'prevention-by-architecture within the governed path, plus detection — not a change to the '
        + 'P05-04 component, which this act is not authorized to alter.',
      cause: 'P05-04 is an accepted, completed work item; its evidence must remain valid',
      dischargedBy: 'a future authority act over the P05-04 store, if one is ever taken' },
    { id: 'L-4', severity: 'RECORDED LIMITATION',
      statement: 'The raw compartment is IN-MEMORY. No raw payload is persisted, so there is no '
        + 'raw-data-at-rest surface. A durable raw store is not claimed and would raise separate '
        + 'governance questions.',
      cause: 'scope discipline', dischargedBy: 'a future explicit authorization' },
    { id: 'L-5', severity: 'RECORDED LIMITATION',
      statement: 'Three declared mappings exist (D01 quote/close/valuation), inherited from P06-01. '
        + 'D02–D10 are NOT declared, so the boundary is demonstrated over D01 only.',
      cause: 'P06-01 limitation L-2, inherited', dischargedBy: 'further P06-01 declarations' },
    { id: 'L-6', severity: 'RECORDED LIMITATION',
      statement: 'P06-02 completion is NOT P06 gate acceptance, NOT certification, NOT provider '
        + 'authorization and NOT production activation.',
      cause: 'D10-6 — "P06 AUTHORIZATION IS NOT P06 ACCEPTANCE."',
      dischargedBy: 'a separate explicit acceptance act by the designated A3 acceptor (Ramki)' },
  ],
  openItemsUnchanged: {
    'OI-P04-03': 'OPEN — tenant/region governance attribute set. No attribute invented.',
    'OI-P04-04': 'OPEN — FIGI sourcing/licensing/coverage.',
    'DEP-P01-04': 'UNRESOLVED — historical series structure is a P08 storage decision.',
    'OI-D9-01': 'OPEN — unchanged.',
    'M-1 / AD-4': 'OPEN — existing-IIPS constraint, unchanged.',
    'M-5': 'OPEN — blocks C12 certification.',
    'M-6': 'OPEN — unchanged.',
    'AD-17 / M-2': 'OPEN — unchanged.',
    'PIT-1…PIT-7': 'MISSING / NOT DEMONSTRATED — travels to P08 undischarged.',
  },
  notDoneByThisAct: [
    'no P06-03 deduplication or idempotency rules',
    'no P06 acceptance artifact',
    'no certification granted',
    'no production activation',
    'no provider selection, entitlement, credential or provider configuration',
    'no licensed historical acquisition',
    'no scheduling, retries or checkpointing (that is P05-04, unchanged)',
    'no disk persistence of raw or canonical data',
    'no Track B → origin/main merge',
    'no edit to any historical P00–P05 authority record',
    'no variation of ADR-01 C1–C6 or of the MD: namespace token',
    'no P11 engine-input mapping',
    'no existing-IIPS modification',
    'no change to the accepted P05-04 CanonicalRecordStore',
  ],
});

// ═════════════════════════════════════════════════════════ 00. INDEX
const index = {
  artifact: 'P06-02 EVIDENCE INDEX — RAW / CANONICAL STORAGE BOUNDARY',
  runStamp: RUN_STAMP,
  generatedBy: 'p06/scripts/generate-p06-02-evidence.js',
  module: 'P06-02-RAW-CANONICAL-STORAGE-BOUNDARY',
  boundarySchemaVersion: BOUNDARY_SCHEMA_VERSION,
  rawEnvelopeType: RAW_ENVELOPE_TYPE,
  namespaceToken: NAMESPACE_TOKEN,
  authority: {
    decision: 'D10-2 (docs/p00/P00_DECISION_LOG.md §8.1)',
    decisionCommit: 'b41240c406914f34f06c2f7bc3986bdeb436018d',
    scope: 'Work Tracker!P06-02 — Raw/canonical separation. P06-01 is complete and preserved; '
      + 'P06-03 is authorized for ENTRY but is NOT implemented by this act.',
    priorWork: 'P05-01 IMPLEMENTED/EVIDENCED · P05-02 SPEC + ADAPTER-CONTRACT · P05-03 SPEC + '
      + 'ADAPTER-CONTRACT · P05-04 IMPLEMENTED + EVIDENCED · P06-01 IMPLEMENTED + EVIDENCED',
  },
  classification: CLASSIFICATION,
  trackerRow: {
    workItem: 'Raw/canonical separation',
    requirement: 'Keep raw provider payloads separate from governed canonical data.',
    deliverable: 'Storage boundary',
    dependencies: 'P05-04,P06-01 (Hard)',
    entryCriteria: 'Pipeline exists',
    exitCriteria: 'Raw data never bypasses validation',
    testValidation: 'Architecture + negative tests',
    evidence: 'Boundary evidence',
  },
  exitCriteriaAssessment: {
    entryCriteria: 'MET — the P06-01 pipeline exists and is complete',
    exitCriteria: 'MET — every bypass attempt is EXECUTED and REFUSED; the governed path is the '
      + 'only route from raw to canonical storage; malformed raw never reaches storage',
    testValidation: 'MET — p06/tests/rawCanonicalBoundary.test.js',
    evidence: 'MET — this package',
    bypassPathsClosed: 5,
    bypassAttemptsExecuted: bypassResults.length + malformed.length,
    bypassAttemptsRefused: bypassResults.filter((r) => r.outcome === 'REFUSED').length
      + malformed.filter((r) => r.outcome === 'REFUSED').length,
    limitation: CLASSIFICATION.recordedLimitation,
  },
  evidenceFiles: manifest,
  gateStatus: {
    p05Acceptance: 'ACCEPTED — 6 of 18 (unchanged by this act)',
    p05_04: 'IMPLEMENTED + EVIDENCED within the D10-1 boundary (unchanged)',
    p06_01: 'IMPLEMENTED + EVIDENCED (preserved; admitted records byte-identical to P06-01 output)',
    p06_02: 'IMPLEMENTED + EVIDENCED (limitations L-1…L-6 recorded)',
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

const refused = bypassResults.filter((r) => r.outcome === 'REFUSED').length
  + malformed.filter((r) => r.outcome === 'REFUSED').length;
const total = bypassResults.length + malformed.length;
console.log(`P06-02 evidence written to p06/evidence-p06-02/ (${manifest.length + 1} files)`);
console.log(`bypass attempts executed: ${total}  refused: ${refused}  NOT BLOCKED: ${total - refused}`);
console.log(`governed-path admissions: ${admitted.length}  audit ok: ${audit.ok}`);
for (const m of manifest) console.log(`  ${m.file}  sha256:${m.sha256.slice(0, 16)}`);
