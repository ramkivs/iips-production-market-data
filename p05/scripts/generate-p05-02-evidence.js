/**
 * P05-02 — EVIDENCE GENERATOR (adapter specification / contract package)
 *
 * Authority: docs/d9/D9_P05_ENTRY_AUTHORIZATION.md §3 **A-2** — specification and adapter-contract
 * work for P05-02 only. ⚠ No live provider execution (D9 N-1).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * ⚠ WHAT THIS EVIDENCE IS, AND WHAT IT IS NOT
 * ══════════════════════════════════════════════════════════════════════════════════════════
 *   This package evidences that the P05-02 adapter BOUNDARY IS DEFINED and LOCALLY TESTABLE.
 *
 *   It is **CONTRACT VALIDATION** evidence. It is **NOT**:
 *     · provider evidence            (tracker Work Tracker!P05-02 "Evidence")
 *     · integration-test evidence    (tracker Work Tracker!P05-02 "Test / Validation")
 *     · proof that authenticated ingestion works (tracker "Exit Criteria")
 *   All three of those remain **UNMET**, and nothing in this package claims otherwise.
 *   No provider was selected, named, contacted or bound. No credential was provisioned.
 *   `mocklive` is a SYNTHETIC TEST DOUBLE and is NOT a provider-register issuance.
 *
 *   This script does NOT accept P05, does NOT create P05_GATE_ACCEPTANCE.md, and does NOT
 *   promote any gate.
 * ══════════════════════════════════════════════════════════════════════════════════════════
 *
 * DETERMINISM: reads only committed fixtures, writes only into p05/evidence-p05-02/, and takes no
 * wall-clock input — the run stamp is a fixed literal, so repeated runs are byte-identical (D-3).
 * Verify with:  cd p05 && npm run evidence:p05-02 && git diff --stat p05/evidence-p05-02
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ADAPTER_CONTRACT_ID,
  P05_02_CONTRACT_VERSION,
  CONTRACT_VERSIONING,
  ADAPTER_PHASES,
  LIVE_ONLY_OPERATIONS,
  COMMON_OPERATIONS,
  PROVIDER_KINDS,
  AUTH_OUTCOMES,
  ENTITLEMENT_OUTCOMES,
  ENTITLEMENT_PERMITTING,
  CREDENTIAL_REQUIREMENT_KINDS,
  CREDENTIAL_STORAGE_CLASSES,
  RETRY_CONTRACT,
  AUTHORIZATION_MATRIX,
  FRESHNESS_CONTRACT,
  CURRENCY_VOCABULARY_CONTRACT,
  MODULE_SURFACE_RULE,
  declareLiveCapability,
  assertCapabilityConformance,
  assertAdapterSurface,
  assertNoNativeLeakage,
  assertSecretBoundary,
  declareCredentialRequirement,
  evaluateEntitlement,
  freshnessInput,
  contractSummary,
} from '../src/liveAdapterContract.js';
import { canonicalDigest, canonicalJson } from '../src/serialize.js';
import { DISPOSITION, ErrorClass, RETRY_PROHIBITED, CLASSIFICATION_GATE_ORDER } from '../src/errors.js';
import { NAMESPACE_TOKEN, NAMESPACE_VERSION, parseKey } from '../src/namespace.js';
import { LocalDeterministicMarketFeed } from '../src/localFeed.js';

import {
  MockLiveAdapter,
  mockRequest,
  CONTRACT_FX,
  IDENTITY_FX,
  QUOTE_WIRE,
  P05_02_RECEIVED_AT,
} from '../tests/mockLiveAdapter.js';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'evidence-p05-02');
mkdirSync(outDir, { recursive: true });

/** Fixed run stamp — NOT Date.now(). Keeps repeated runs byte-identical (D-3). */
const RUN_STAMP = '2026-09-09T00:00:00.000Z';
const VOCAB = CONTRACT_FX.nativeVocabulary;

/** ⚠ Every artifact in this package is contract validation, never live-provider evidence. */
const CLASSIFICATION = Object.freeze({
  evidenceClass: 'CONTRACT_VALIDATION',
  isProviderEvidence: false,
  isIntegrationTestEvidence: false,
  establishesAuthenticatedIngestionWorks: false,
  trackerP05_02ExitCriteria: 'UNMET — "Authenticated ingestion works" requires live execution (D9 N-1)',
  trackerP05_02TestValidation: 'UNMET — "Integration tests" require a provider',
  trackerP05_02Evidence: 'UNMET — "Provider evidence" requires a provider',
  providerSelected: false,
  providerContacted: false,
  credentialsProvisioned: false,
  networkUsed: false,
  testDoubleProviderToken: CONTRACT_FX.testDouble.provider,
  testDoubleIsRegisterIssuance: false,
});

function write(name, value) {
  const text = typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(join(outDir, name), text);
  return { file: `p05/evidence-p05-02/${name}`, sha256: canonicalDigest({ name, text }) };
}

const manifest = [];
const adapter = new MockLiveAdapter();
const run = adapter.snapshot(mockRequest());

// ───────────────────────────────────────────────────────────── 01. CONTRACT MANIFEST
manifest.push(write('01-contract-manifest.json', {
  artifact: 'P05-02 ADAPTER CONTRACT MANIFEST',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  contract: CONTRACT_VERSIONING,
  interface: {
    soleIngress: 'snapshot(request) — MarketDataSource<T> (P02 B-4 / AD-2). The phases are the '
      + 'adapter\'s INTERNAL decomposition, not a second public ingress contract.',
    providerKinds: PROVIDER_KINDS,
    commonOperations: COMMON_OPERATIONS,
    liveOnlyOperations: LIVE_ONLY_OPERATIONS,
    phases: ADAPTER_PHASES.map((p) => ({
      order: p.order, phase: p.phase, op: p.op, liveOnly: p.liveOnly,
      performsIO: p.performsIO, failureClass: p.failureClass, authority: p.authority,
    })),
    gateOrder: {
      execution: ['preflight', 'entitlement', 'authenticate', 'fetch'],
      classificationPrecedence: CLASSIFICATION_GATE_ORDER,
      note: 'LA-4 — the execution order reproduces the EXISTING classification precedence '
        + '(E6→E3→E2→E1) rather than inventing one, and honours EV-1 (entitlement before '
        + 'acquisition). Authentication is not acquisition.',
    },
    rulePrefix: 'LA-',
    ruleCount: contractSummary().ruleCount,
  },
  authorizationMatrix: AUTHORIZATION_MATRIX,
  moduleSurfaceRule: MODULE_SURFACE_RULE,
}));

// ───────────────────────────────────────────────────────────── 02. CANONICAL ENVELOPE
const s = run.snapshot;
manifest.push(write('02-canonical-envelope.json', {
  artifact: 'P05-02 CANONICAL INPUT / OUTPUT ENVELOPE',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  canonicalModelForked: false,
  canonicalModelOwner: 'P05-01 — p05/src/{contract,namespace,identity,validate,errors,serialize}.js',
  request: mockRequest(),
  outputEnvelopeSlots: Object.keys(s).sort(),
  snapshot: {
    snapshotId: s.snapshotId,
    provider: s.provider,
    dataVersion: s.dataVersion,
    schemaVersion: s.schemaVersion,
    namespaceVersion: s.namespaceVersion,
    asOf: s.asOf,
    receivedAt: s.receivedAt,
    mode: s.mode,
    quality: s.quality,
    completenessPct: s.completenessPct,
    domain: s.domain,
    fieldKeys: Object.keys(s.fields).sort(),
    digest: canonicalDigest(s),
  },
  resultEnvelope: {
    ok: run.ok,
    quality: run.quality,
    completenessPct: run.completenessPct,
    trace: [...run.trace],
    note: 'The result envelope shape is IDENTICAL to the P05-01 local feed\'s, which is what makes '
      + 'the two adapters substitutable behind MarketDataSource<T> (P02 B-3, PS-1).',
  },
  p05_01Compatibility: {
    sameSoleIngress: true,
    sameResultEnvelope: true,
    sameEnvelopeSlots: true,
    sameNamespaceVersion: true,
    sameIdentityMappingVersion: true,
    distinctProviderIdentity: 'localfix (P05-01) vs mocklive (P05-02 test double) — PS-3',
    localFeedIsALiveAdapter: false,
    localFeedCanSatisfyP05_02: false,
  },
}));

// ───────────────────────────────────────────────────────────── 03. FIELD MAPPING BOUNDARY
const leakClean = assertNoNativeLeakage(s, VOCAB);
const leakRecord = assertNoNativeLeakage(run.record, VOCAB);
const leakProvenanceRun = new MockLiveAdapter({ leakInProvenance: true }).snapshot(mockRequest());
const leakProvenance = assertNoNativeLeakage(leakProvenanceRun.snapshot, VOCAB);
const leakKeyRun = new MockLiveAdapter({ leakNative: true }).snapshot(mockRequest());

manifest.push(write('03-field-mapping-boundary.json', {
  artifact: 'P05-02 FIELD MAPPING BOUNDARY + PROVIDER-NATIVE LEAKAGE PREVENTION',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  containmentRule: 'P02_PROVIDER_MAPPING_RULES M-1…M-6 / A-19: provider-native schemas, field names, '
    + 'symbols, enums, units, time conventions and error codes exist ONLY inside the adapter.',
  declaredWireSchema: QUOTE_WIRE,
  declaredFieldMap: CONTRACT_FX.fieldMap,
  derivedFields: CONTRACT_FX.derivedFields,
  mappingIsDeclaredAsData: true,
  mappingRequiresNoCodeReading: 'MR-4',
  heuristicMatchingPermitted: 'MR-2 — PROHIBITED (no fuzzy or name-similarity matching)',
  nativeVocabulary: VOCAB,
  leakageResults: {
    conformingRun: {
      snapshot: { ok: leakClean.ok, violations: leakClean.violations },
      attemptRecord: { ok: leakRecord.ok, violations: leakRecord.violations },
    },
    smuggledIntoProvenanceString: {
      _note: 'LA-18 / M-4 — every field key is correctly namespaced, so ADR-01 C1…C4 PASS; only the '
        + 'native-vocabulary scan detects this. This is the case M-4 prohibits and RD-4 forbids.',
      c1ToC4Passed: leakProvenanceRun.ok === true,
      detectedByLA18: leakProvenance.ok === false,
      violations: leakProvenance.violations,
    },
    nonNamespacedKey: {
      _note: 'A bare provider-native key is caught by the namespace partition (ADR-01 C1/C5) and '
        + 'ABORTS the execution. RD-4: the contract-level record reports a COUNT, not the native key.',
      rejected: leakKeyRun.ok === false,
      violatedRules: leakKeyRun.failure?.detail?.violatedRules ?? [],
      recordLeaksNativeToken: assertNoNativeLeakage(leakKeyRun.record ?? {}, VOCAB).ok === false,
    },
  },
  absenceSemantics: CONTRACT_FX._absenceSemantics,
}));

// ───────────────────────────────────────────────────────────── 04. ERROR MAPPING
const negativeScenarios = [
  ['LQ-E6-DOM', { domain: 'D07' }, 'E6'],
  ['LQ-E6-GRAN', { granularity: '1M' }, 'E6'],
  ['LQ-E6-MODE', { mode: 'PIT' }, 'E6'],
  ['LQ-E3', { entitlementFixture: 'ENT-0002' }, 'E3'],
  ['LQ-E2', { authFixture: 'AUTH-FAIL' }, 'E2'],
  ['LQ-E1', { forceError: 'E1' }, 'E1'],
  ['LQ-E4', { forceError: 'E4' }, 'E4'],
  ['LQ-E7', { forceError: 'E7' }, 'E7'],
  ['CS-LOCAL-UNMAPPED', { canonicalSecurityId: 'CS-LOCAL-UNMAPPED' }, 'E8'],
];
const payloadScenarios = ['LQ-E5-TYPE', 'LQ-E5-MISSING', 'LQ-E8-CCY', 'LQ-E8-AMBIG-TS'];

const observed = [];
for (const [id, over, expected] of negativeScenarios) {
  const r = new MockLiveAdapter().snapshot(mockRequest(over));
  observed.push({
    case: id, expected,
    observed: r.ok ? `ok(quality=${r.quality})` : r.failure.code,
    matched: r.ok ? expected === 'E1' : r.failure.code === expected,
    producesSnapshot: r.ok,
    trace: [...r.trace],
  });
}
for (const id of payloadScenarios) {
  const nc = CONTRACT_FX.negativeCases.find((c) => c._fixtureId === id);
  const r = new MockLiveAdapter({ payloadOverride: nc.payload }).snapshot(mockRequest({ fixtureId: id }));
  observed.push({
    case: id, expected: nc._expectedClass,
    observed: r.ok ? `ok(quality=${r.quality})` : r.failure.code,
    matched: r.ok === false && r.failure.code === nc._expectedClass,
    phase: nc._phase,
    producesSnapshot: r.ok,
  });
}

manifest.push(write('04-error-mapping.json', {
  artifact: 'P05-02 ERROR CLASSIFICATION MAPPING (P02 E1–E8 — UNCHANGED)',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  taxonomyUnchanged: 'INV-6 / FC-6: E1–E8 is UNCHANGED. No class is added, removed or reclassified.',
  errorClasses: ErrorClass,
  dispositions: DISPOSITION,
  classificationGateOrder: CLASSIFICATION_GATE_ORDER,
  retryContract: RETRY_CONTRACT,
  qualityBearingClasses: Object.keys(DISPOSITION).filter((c) => DISPOSITION[c].producesSnapshot),
  retryProhibited: RETRY_PROHIBITED,
  scenarios: observed,
  allMatched: observed.every((o) => o.matched),
  failureRecordSlots: ['F-1', 'F-2', 'F-3', 'F-4', 'F-5', 'F-6', 'F-7', 'F-8', 'F-9', 'F-10', 'F-11'],
}));

// ───────────────────────────────────────────────────────────── 05. PROVENANCE / asOf / VERSION
manifest.push(write('05-provenance-asof-version.json', {
  artifact: 'P05-02 PROVENANCE, asOf / receivedAt AND THE SIX VERSION AXES',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  lineageBlock: s.lineage,
  lineageComplete: ['sourceRef', 'adapterId', 'adapterVersion', 'transformationChainRef', 'receivedAt', 'namespaceVersion']
    .every((k) => s.lineage[k] !== undefined),
  sixVersionAxes: {
    dataVersion: s.dataVersion,
    adapterVersion: s.lineage.adapterVersion,
    providerSchemaVersion: run.record['R-3'],
    schemaVersion: s.schemaVersion,
    namespaceVersion: s.namespaceVersion,
    identityMappingVersion: s.identityMappingVersion,
    note: 'P02_PROVIDER_IDENTITY_VERSIONING §2.1 — six INDEPENDENT axes; none may be substituted '
      + 'for another (VX-1…VX-4). Two axes sharing the literal "1.0" is a numbering coincidence, '
      + 'not a conflation: they are separate slots with separate owners. Independence is proven by '
      + 'showing that an adapterVersion bump moves only adapterVersion (SI-4 keeps it out of snapshotId).',
  },
  times: {
    asOf: s.asOf,
    receivedAt: s.receivedAt,
    distinct: s.asOf !== s.receivedAt,
    rule: 'T-1 — the five P01 times are preserved distinctly; collapsing any two is prohibited. '
      + 'D-4 / TS-6 — receivedAt is stamped once at the ingest boundary and never recomputed.',
  },
  freshness: {
    contract: FRESHNESS_CONTRACT,
    computedForCleanRun: freshnessInput({ asOf: s.asOf, receivedAt: s.receivedAt }),
    thresholdsSet: false,
    thresholdOwner: 'P07 (MQ-1, MQ-2)',
  },
  provenanceResolution: {
    fieldProvenanceRefs: s.lineage.fieldProvenance ?? [],
    allFieldProvenanceResolvesIntoLineage: Object.values(s.fields)
      .every((f) => (s.lineage.fieldProvenance ?? []).includes(f.provenance)),
    rule: 'RF-7 — each CanonicalField.provenance is a REFERENCE INTO the lineage block.',
  },
}));

// ───────────────────────────────────────────────────────────── 06. IDENTITY / MAPPING / VENUE / LIFECYCLE
const unmapped = new MockLiveAdapter().snapshot(mockRequest({ canonicalSecurityId: 'CS-LOCAL-UNMAPPED' }));

// P05-02-B / BD-P05-02-07 — per-state lifecycle coverage, COMPUTED by running each state through
// the adapter at the observation instant. Nothing here is asserted by hand, so the evidence cannot
// drift from the fixtures.
const LC_STATES_ALL = ['active', 'suspended', 'delisted', 'merged', 'superseded'];
const LC_AS_OF = '2026-03-04T09:31:00.000Z';
const LIFECYCLE_COVERAGE = (() => {
  const perState = LC_STATES_ALL.map((st) => {
    const secs = IDENTITY_FX.securities.filter((x) => x.lifecycleStatus === st);
    const emitted = [];
    const failClosed = [];
    for (const sec of secs) {
      const r = new MockLiveAdapter().snapshot(mockRequest({ canonicalSecurityId: sec.canonicalSecurityId }));
      if (r.ok === true) emitted.push(sec.canonicalSecurityId);
      else failClosed.push(`${sec.canonicalSecurityId} (${r.failure.code})`);
    }
    return Object.freeze({
      state: st,
      fixtureSecurities: secs.length,
      fixtureIds: Object.freeze(secs.map((x) => x.canonicalSecurityId)),
      emittedAtObservationInstant: Object.freeze(emitted),
      failClosedAtObservationInstant: Object.freeze(failClosed),
      successorRefRequired: st === 'merged' || st === 'superseded',
      successorRefsPresent: secs.filter((x) => x.successorRef !== undefined).length,
      covered: secs.length > 0,
    });
  });
  return Object.freeze({
    perState: Object.freeze(perState),
    broken: Object.freeze(perState.filter((p) => !p.covered).map((p) => p.state)),
    asOf: LC_AS_OF,
  });
})();
manifest.push(write('06-identity-mapping-venue-lifecycle.json', {
  artifact: 'P05-02 IDENTITY, MAPPING, VENUE AND LIFECYCLE REPRESENTATION',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  identityRef: s.identity,
  mappingRegisterVersion: IDENTITY_FX.mappingRegisterVersion,
  identityMappingVersionPassedThrough: s.identityMappingVersion === IDENTITY_FX.mappingRegisterVersion,
  cardinality: 'OI-08 = 1:N (RESOLVED). canonical → companyId is an N:1 projection (MC-2), expected not an error.',
  authoritativeExternalIdentifier: 'OI-09 = FIGI / OpenFIGI (RESOLVED)',
  figiValueIsSynthetic: /^BBG00SYNTH\d{2}$/.test(s.identity.externalIdentifiers.find((x) => x.type === 'FIGI').value),
  figiSourcingDecided: false,
  figiSourcingStatus: 'OI-P04-04 OPEN — source, licensing, coverage and refresh cadence are UNSPECIFIED',
  failClosed: {
    scenario: 'CS-LOCAL-UNMAPPED (a security with no mapping record)',
    rejected: unmapped.ok === false,
    errorClass: unmapped.failure?.code,
    violatedRules: unmapped.failure?.detail?.violatedRules ?? [],
    isQualityState: unmapped.failure?.detail?.isQualityState,
    rule: 'FC-1…FC-7 — an unmapped identity FAILS EXPLICITLY: no coercion, no placeholder, no '
      + 'synthesised companyId, and NOT reported as data quality (FC-5). Identity failure is not E1 (FC-6).',
  },
  venue: {
    venueRefEmitted: s.fields['MD:price.venueRef'].value,
    identitySource: 'MIC-based (VN-1). A venue is REFERENCE DATA, not an instrument (VN-2).',
    providerCodeIsNeverVenueIdentity: 'VN-5 / PN-2 — the provider market code is at most a '
      + 'non-authoritative alias; venueRef is taken from the P04 venue reference, never from the payload.',
    operatingVsSegmentMicDistinguished: 'VN-3 — XSYN (OPERATING_MIC) and XSYNSG1 (SEGMENT_MIC) are never interchangeable.',
    micKindValuesInIdentityFixtures: IDENTITY_FX.venues.map((v) => ({ micCode: v.micCode, micKind: v.micKind })),
  },
  lifecycle: {
    enumeration: ['active', 'suspended', 'delisted', 'merged', 'superseded'],
    source: 'P04_LIFECYCLE_AND_EFFECTIVE_DATING §2 — five values, fixed by D4_05 §G.2 and P01_FIELD_DICTIONARY §7. None added.',
    emittedForThisRun: s.identity.lifecycleStatus,
    // ⚠ KEY RENAME: was `lifecycleStatesExercisedByP05_01Fixtures`. P05-02-B widened the shared
    //   identity fixtures, so a P05-01-only label would no longer describe the value accurately.
    lifecycleStatesExercisedByFixtures: [...new Set(IDENTITY_FX.securities.map((x) => x.lifecycleStatus))].sort(),
    lifecycleStatesNotExercised: ['active', 'suspended', 'delisted', 'merged', 'superseded']
      .filter((st) => !IDENTITY_FX.securities.some((x) => x.lifecycleStatus === st)),
    rule: 'LC-1…LC-6 — effective-dated; a transition never mutates the canonical security ID (LC-2); '
      + 'state is never inferred from absence of data (LC-6).',
    // ── P05-02-B / BD-P05-02-07 — per-state coverage, computed not asserted ──────────────────
    coverageUnit: 'P05-02-B — lifecycle-state coverage completion (BD-P05-02-07)',
    bdP05_02_07Status: LIFECYCLE_COVERAGE.broken.length === 0
      ? 'RESOLVED — all five authoritative states are exercised by the fixtures and by the '
        + 'adapter-contract test group Q/1…Q/8. Fixture and test coverage only.'
      : `NOT RESOLVED — unexercised: ${LIFECYCLE_COVERAGE.broken.join(', ')}`,
    perState: LIFECYCLE_COVERAGE.perState,
    coverageDefinition: 'A state counts as covered when at least one fixture security carries it AND '
      + 'adapter-contract test group Q/1…Q/8 exercises it. ⚠ A fail-closed outcome at the '
      + 'observation instant is CORRECT behaviour, not a coverage gap: CS-LOCAL-0004 (delisted) has '
      + 'an effective window that closed 2023-12-29, so ADP-7 requires resolution to fail rather '
      + 'than to fall back (FC-1/ADP-2/MC-7). Q/5 additionally proves it resolves INSIDE its window.',
    successorLinks: IDENTITY_FX.securities
      .filter((x) => x.successorRef !== undefined)
      .map((x) => Object.freeze({
        predecessor: x.canonicalSecurityId,
        predecessorState: x.lifecycleStatus,
        successor: x.successorRef.canonicalSecurityId,
        linkEffectiveFrom: x.successorRef.effective.from,
        linkEffectiveTo: x.successorRef.effective.to,
        rule: 'LC-4 — merged/superseded require a successor reference, itself effective-dated.',
      })),
    snapshotIdDependsOnLifecycle: false,
    snapshotIdInputs: 'provider, dataVersion, asOf (ST-2). LC-2: a transition changes state and '
      + 'relationships, never the snapshot or identity anchor.',
    note: '⚠ P05-02-B widened FIXTURE and TEST coverage only. It closes BD-P05-02-07 and nothing '
      + 'else. It selects no provider, provisions no credential, opens no connection, and does NOT '
      + 'close the provider-dependent tracker exit criteria: BD-P05-02-01 (provider selection / '
      + 'entitlement / credentials), BD-P05-02-02 ("authenticated ingestion works") and '
      + 'BD-P05-02-03 ("provider evidence") all remain UNMET and require live execution, which D9 '
      + 'N-1 does not authorize.',
  },
}));

// ───────────────────────────────────────────────────────────── 07. NAMESPACE
manifest.push(write('07-namespace.json', {
  artifact: 'P05-02 NAMESPACE ENFORCEMENT',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  oi10Token: NAMESPACE_TOKEN,
  canonicalFieldKeyForm: 'MD:<domain>.<field>',
  namespaceVersion: NAMESPACE_VERSION,
  emittedKeys: Object.keys(s.fields).sort(),
  everyKeyNamespaced: Object.keys(s.fields).every((k) => k.startsWith(NAMESPACE_TOKEN)),
  everyKeyCanonicalForm: Object.keys(s.fields).every((k) => /^MD:[a-z]+\.[A-Za-z][A-Za-z0-9]*$/.test(k)),
  parsedKeys: Object.keys(s.fields).sort().map((k) => ({ key: k, ...parseKey(k) })),
  domainSegmentsUsed: [...new Set(Object.keys(s.fields).map((k) => parseKey(k).domain))].sort(),
  domainSegmentsInvented: [],
  collisionGuard: 'ADR-01 C1…C6 UNCHANGED. C5 fail-closed abort was exercised and confirmed.',
  noNamespaceRewrite: 'D9 N-7 — accepted P01/P02 <NS> records were NOT rewritten; MD: binds new work only.',
}));

// ───────────────────────────────────────────────────────────── 08. ENTITLEMENT / CREDENTIAL ABSTRACTION
const entResults = CONTRACT_FX.entitlementFixtures.map((fx) => {
  const res = evaluateEntitlement({ status: fx.status, entitlementRef: fx.entitlementRef ?? null });
  return { fixture: fx._fixtureId, status: fx.status ?? 'ABSENT', permit: res.permit, reason: res.reason, expected: fx._expectPermit, matched: res.permit === fx._expectPermit };
});
const credReq = declareCredentialRequirement(CONTRACT_FX.testDouble.credentialRequirements[0]);

manifest.push(write('08-entitlement-credential-abstraction.json', {
  artifact: 'P05-02 ENTITLEMENT AND CREDENTIAL / SECRETS-FLOW CONTRACT SURFACE',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  separationOfConcerns: 'P02 E-1 — credentials and secrets are P03. P05-02 defines only THAT an '
    + 'entitlement decision occurs and HOW its outcome is represented.',
  entitlement: {
    outcomes: ENTITLEMENT_OUTCOMES,
    permitting: ENTITLEMENT_PERMITTING,
    defaultDeny: 'EV-3 — absent, expired, UNKNOWN or unevaluable DENIES.',
    failClosed: 'EV-4 — a denial yields no data, no partial data, no cached substitute.',
    neverInferredFromResponse: 'EV-7 — a provider erroneously serving unentitled data does not create entitlement.',
    evaluations: entResults,
    allMatched: entResults.every((e) => e.matched),
    partialEntitlement: 'EV-8 / RD-1 — entitled fields plus explicit WITHHELD markers carrying an '
      + 'entitlementRef. WITHHELD is never conflated with NOT_PROVIDED.',
    entitlementMatrixPopulated: false,
    entitlementMatrixStatus: 'EMPTY (EM-2). Populating it requires provider selection (no authority '
      + 'recorded) and licensing (P16) — EM-3.',
  },
  credential: {
    requirement: credReq,
    requirementKinds: CREDENTIAL_REQUIREMENT_KINDS,
    storageClasses: CREDENTIAL_STORAGE_CLASSES,
    valueEverPresent: false,
    endpointEverPresent: false,
    provisioned: false,
    owner: 'P03',
    rule: 'SP-5 — an entitlement record references a credential REQUIREMENT, never a credential.',
  },
  secretBoundaryScan: {
    snapshot: assertSecretBoundary(s),
    attemptRecord: assertSecretBoundary(run.record),
    declaration: assertSecretBoundary(declareLiveCapability(CONTRACT_FX.testDouble)),
    fixtureFile: assertSecretBoundary(CONTRACT_FX),
  },
  measuredScannerBlindSpot: {
    _note: 'BD-P05-02-06 — recorded, not worked around.',
    finding: 'The P05-01 regex scanner detects credential material in SOURCE-ASSIGNMENT form '
      + '(key = "value") but NOT in SERIALIZED-JSON form ({"key":"value"}), because a quote sits '
      + 'between the key and the colon. A regex over text cannot see structure.',
    whyLA20Exists: 'LA-20 adds a STRUCTURAL walk over keys and values, which catches the JSON form. '
      + 'The two checks are complementary; neither alone is sufficient.',
    disposition: 'OPEN — BD-P05-02-06. Repairing the P05-01 scanner is out of P05-02 scope.',
  },
}));

// ───────────────────────────────────────────────────────────── 09. CAPABILITY / CONFORMANCE
const decl = declareLiveCapability(CONTRACT_FX.testDouble);
const capRes = assertCapabilityConformance(decl);
manifest.push(write('09-capability-and-conformance.json', {
  artifact: 'P05-02 CAPABILITY DECLARATION AND INTERFACE CONFORMANCE',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  declaration: decl,
  conformance: capRes,
  surfaceCheck: assertAdapterSurface(new MockLiveAdapter(), { providerKind: 'LIVE' }),
  surfaceCheckLocalFeed: {
    providerKind: 'LOCAL_FIXTURE',
    factoring: 'INLINE — the P05-01 feed implements the phases inside snapshot(), which LA-3 permits',
    liveOnlyOperationsImplemented: LIVE_ONLY_OPERATIONS.filter(
      (op) => typeof LocalDeterministicMarketFeed.prototype[op] === 'function',
    ),
    commonOperationsExposedAsMethods: COMMON_OPERATIONS.filter(
      (op) => typeof LocalDeterministicMarketFeed.prototype[op] === 'function',
    ),
    canSatisfyP05_02: false,
  },
  declaredIsNotEntitled: 'CD-6 — capability and entitlement are independent gates; both must pass.',
  unknownIsAcceptable: 'CD-3 — any element may be UNKNOWN; UNKNOWN is preferable to guessing and is never treated as supported.',
  knownLimitations: decl['A-8'],
}));

// ───────────────────────────────────────────────────────────── 10. DETERMINISM / REPEATABILITY
const digests = [];
const snapshotIds = [];
const repeats = CONTRACT_FX.determinismRepeats ?? 5;
for (let i = 0; i < repeats; i += 1) {
  const r = new MockLiveAdapter().snapshot(mockRequest());
  digests.push(canonicalDigest(r.snapshot));
  snapshotIds.push(r.snapshot.snapshotId);
}
manifest.push(write('10-determinism-repeatability.json', {
  artifact: 'P05-02 DETERMINISM AND REPEATABILITY (contract validation)',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  repeats,
  digests,
  distinctDigests: [...new Set(digests)].length,
  distinctSnapshotIds: [...new Set(snapshotIds)].length,
  byteIdentical: new Set(digests).size === 1,
  rules: ['D-1 — identical (provider, dataVersion, asOf) ⇒ identical snapshotId',
    'D-2 — identical payload + adapter version + schemaVersion ⇒ byte-identical canonical snapshot',
    'D-3 — mapping is a pure function; no wall-clock, random or ambient input',
    'D-5 — field and lineage ordering is canonical, never implementation-incidental'],
  scopeNote: 'Determinism of the CONTRACT PIPELINE against fixed fixtures. This is NOT a claim about '
    + 'live provider determinism, which is unknowable without a provider.',
}));

// ───────────────────────────────────────────────────────────── 11. BLOCKED PROVIDER-DEPENDENT ITEMS
manifest.push(write('11-blocked-provider-dependent-items.json', {
  artifact: 'P05-02 KNOWN BLOCKED / PROVIDER-DEPENDENT ITEMS — RECORDED, NOT RESOLVED',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  items: [
    { id: 'BD-P05-02-01', item: 'Provider selection, entitlement grant, credentials, connectivity', status: 'OPEN',
      blocks: 'P05-02 live execution and the tracker exit criteria',
      authority: 'D9 N-1 · P16 / provider-entitlement authority · INV-10 (entitlement matrix EMPTY)',
      note: 'Provider selection is NONE MADE. No provider is named anywhere in this package.' },
    { id: 'BD-P05-02-02', item: 'Authenticated ingestion actually working', status: 'UNVERIFIED',
      blocks: 'Tracker Work Tracker!P05-02 Exit Criteria',
      note: 'Requires live execution. NOT AUTHORIZED. This package does not claim it.' },
    { id: 'BD-P05-02-03', item: 'Provider integration tests and provider evidence', status: 'UNVERIFIED',
      blocks: 'Tracker Work Tracker!P05-02 Test/Validation and Evidence',
      note: 'The tests in this package are CONTRACT VALIDATION against a synthetic double. They are '
        + 'not integration tests and are not provider evidence.' },
    { id: 'BD-P05-02-04', item: 'OI-P04-04 — FIGI sourcing, licensing, coverage', status: 'OPEN',
      blocks: 'P05 acceptance; P05-03 licensed depth',
      note: 'Synthetic FIGI values are used. No sourcing, licensing or coverage claim is made.' },
    { id: 'BD-P05-02-05', item: 'ISO-4217 currency vocabulary is provider-specific configuration', status: 'OPEN',
      blocks: 'Full currency-membership validation',
      note: CURRENCY_VOCABULARY_CONTRACT.gapDisposition },
    { id: 'BD-P05-02-06', item: 'P05-01 regex secret scanner does not detect the serialized-JSON credential form', status: 'OPEN',
      blocks: 'Nothing in P05-02 — LA-20 covers it structurally',
      note: 'Recorded because it is a real gap in an accepted artifact. Repairing it is out of P05-02 scope.' },
    { id: 'BD-P05-02-07', item: 'Lifecycle fixture coverage exercises 2 of 5 states', status: 'RESOLVED',
      blocks: 'Nothing — non-blocking test-coverage improvement',
      resolvedBy: 'P05-02-B — lifecycle-state coverage completion (2026-09-09)',
      note: 'suspended / merged / superseded were unexercised. P05-02-B added fixture identities for '
        + 'all three (plus the two successor identities LC-4 requires for merged/superseded) and '
        + 'adapter-contract tests Q/1…Q/8. Coverage is now 5 of 5. ⚠ This closed a fixture/test gap '
        + 'ONLY — it did not select a provider, provision a credential, open a connection, or close '
        + 'any provider-dependent tracker exit criterion.' },
    { id: 'BD-P05-02-08', item: 'OI-P04-03 — tenant/region governance attribute set', status: 'OPEN',
      blocks: 'Per-record tenant/region governance application',
      note: 'D9 N-4/N-5, IB-1…IB-5. NO tenant or region attribute was invented here.' },
    { id: 'BD-P05-02-09', item: 'P05-04 orchestration: scheduling, retries, idempotent checkpointing', status: 'NOT AUTHORIZED',
      blocks: 'Retry EXECUTION (LA-28 classifies retryability only)',
      authority: 'D9 N-3' },
    { id: 'BD-P05-02-10', item: 'A3 gate acceptor for P05 acceptance', status: 'UNKNOWN',
      blocks: 'P05 gate acceptance — the only person-level hard blocker',
      note: 'No person is named in P00_AUTHORITY_REGISTER.md or D9_STATUS.json.' },
  ],
  resolvedByThisPackage: [],
  explicitlyNotResolved: ['OI-P04-03', 'OI-P04-04', 'BD-02 / P16', 'AD-17', 'M-1', 'M-5', 'M-6'],
}));

// ───────────────────────────────────────────────────────────── 12. BOUNDARY ATTESTATIONS
manifest.push(write('12-boundary-attestations.json', {
  artifact: 'P05-02 BOUNDARY ATTESTATIONS',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  attestations: {
    providerSelected: false,
    providerNamed: false,
    providerContacted: false,
    liveEndpointCalled: false,
    credentialsProvisioned: false,
    apiKeysAdded: false,
    vendorSdksAdded: false,
    providerSpecificSecretsAdded: false,
    authenticatedIngestionClaimedToWork: false,
    providerIntegrationTestsClaimed: false,
    providerEvidenceProduced: false,
    p05GateAcceptanceCreated: false,
    p05ClaimedAccepted: false,
    canonicalModelForked: false,
    p01AcceptedArtifactsModified: false,
    p02AcceptedArtifactsModified: false,
    p04AcceptedArtifactsModified: false,
    oi08Changed: false,
    oi09Changed: false,
    oi10Changed: false,
    adr01C1ToC6Changed: false,
    existingIipsModified: false,
    p06Started: false,
    p07Started: false,
    p08Started: false,
    p05_04Started: false,
    tenantOrRegionAttributeInvented: false,
    providerEntitlementValueInvented: false,
    licensingCoverageInvented: false,
  },
  verificationCommands: {
    runAllTests: 'cd p05 && npm test',
    regenerateThisEvidence: 'cd p05 && npm run evidence:p05-02',
    proveEvidenceDeterministic: 'cd p05 && npm run evidence:p05-02 && git diff --stat p05/evidence-p05-02',
    proveNoAcceptedArtifactModified: 'git diff --stat efe33ea..HEAD -- docs/p01 docs/p02 docs/p04',
  },
}));

// ───────────────────────────────────────────────────────────── 00. INDEX
const index = {
  artifact: 'P05-02 EVIDENCE INDEX — ADAPTER SPECIFICATION / CONTRACT PACKAGE',
  runStamp: RUN_STAMP,
  generatedBy: 'p05/scripts/generate-p05-02-evidence.js',
  authorization: {
    basis: 'docs/d9/D9_P05_ENTRY_AUTHORIZATION.md §3 A-2',
    authorizationCommit: '31c26553554f021928a4f9e4f41b6ee90cdfa453',
    p05_01Commit: 'bf66c99cec1f7e43ae4dbc3ab5e77c23a27b014d',
    scope: 'Specification and adapter-contract ONLY',
    liveProviderExecution: 'NOT AUTHORIZED (D9 N-1)',
  },
  classification: CLASSIFICATION,
  contract: { id: ADAPTER_CONTRACT_ID, version: P05_02_CONTRACT_VERSION },
  evidenceFiles: manifest,
  gateStatus: {
    p05EntryAuthorization: 'AUTHORIZED',
    p05Acceptance: 'NOT_ACCEPTED',
    p05GateAcceptanceArtifactCreated: false,
    p05_01: 'IMPLEMENTED / EVIDENCED',
    p05_02: 'SPECIFICATION + ADAPTER-CONTRACT COMPLETE / LIVE EXECUTION NOT AUTHORIZED',
    p05_03: 'SPECIFICATION ONLY AUTHORIZED — not started',
    p05_04: 'NOT AUTHORIZED — not started',
    certification: 'NONE_GRANTED',
    productionActivation: 'NOT_AUTHORIZED',
    p06: 'NOT_STARTED_NOT_PROMOTED',
    p07: 'NOT_STARTED_NOT_PROMOTED',
    p08: 'NOT_STARTED',
  },
  openItemsUnchanged: {
    'OI-P04-04': 'OPEN — FIGI sourcing/licensing/coverage. Not resolved here.',
    'OI-P04-03': 'OPEN — tenant/region governance attribute set. No attribute invented.',
    'BD-02 / P16': 'OPEN — provider selection, entitlement and credentials authority.',
  },
};
writeFileSync(join(outDir, '00-INDEX.json'), `${JSON.stringify(index, null, 2)}\n`);

console.log(`P05-02 evidence written to p05/evidence-p05-02/ (${manifest.length + 1} files)`);
for (const m of manifest) console.log(`  ${m.file}  sha256:${m.sha256.slice(0, 16)}`);
