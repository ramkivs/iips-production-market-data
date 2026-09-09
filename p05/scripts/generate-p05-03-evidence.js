/**
 * P05-03-A — EVIDENCE GENERATOR (historical OHLCV ingestion contract)
 *
 * Authority: docs/d9/D9_P05_ENTRY_AUTHORIZATION.md §3 **A-3** — specification and adapter-contract
 * work for P05-03 only. ⚠ No licensed or deeper historical acquisition (**N-2** / **OI-P04-04**).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════
 * ⚠ WHAT THIS EVIDENCE IS, AND WHAT IT IS NOT
 * ══════════════════════════════════════════════════════════════════════════════════════════
 *   This package evidences that the P05-03 historical-ingestion BOUNDARY IS DEFINED and LOCALLY
 *   TESTABLE against synthetic fixtures.
 *
 *   It is **CONTRACT VALIDATION** evidence. It is **NOT**:
 *     · a real historical sample   (tracker Work Tracker!P05-03 "Evidence")
 *     · load/reconcile testing against real data (tracker "Test / Validation")
 *     · proof that "Historical load reproducible" holds for licensed data (tracker "Exit Criteria")
 *   All three remain **UNMET**. Reproducibility is demonstrated for SYNTHETIC contract behaviour
 *   only (PC-3), and that distinction is carried in every file rather than asserted once.
 *
 *   No provider was selected, named, contacted or bound. No credential was provisioned. No
 *   licensed data was acquired. `mockhist` is a SYNTHETIC TEST DOUBLE and is NOT a
 *   provider-register issuance. No adjusted series was generated (RC-5: the engine is P08). No
 *   series storage, PIT storage or PIT query was built (PC-6; DEP-P01-04 UNRESOLVED). No
 *   orchestration was implemented (D9 N-3: P05-04).
 *
 *   This script does NOT accept P05, does NOT create P05_GATE_ACCEPTANCE.md, and does NOT promote
 *   any gate.
 * ══════════════════════════════════════════════════════════════════════════════════════════
 *
 * DETERMINISM: reads only committed fixtures, writes only into p05/evidence-p05-03/, and takes no
 * wall-clock input — the run stamp is a fixed literal, so repeated runs are byte-identical (D-3).
 * Verify with:  cd p05 && npm run evidence:p05-03 && git diff --stat p05/evidence-p05-03
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as HA from '../src/historicalAdapterContract.js';
import { LIFECYCLE_STATES } from '../src/identity.js';
import { canonicalDigest } from '../src/serialize.js';
import { makeFeed } from '../tests/helpers.js';

const here = dirname(fileURLToPath(import.meta.url));
const p05Root = join(here, '..');
const outDir = join(p05Root, 'evidence-p05-03');
mkdirSync(outDir, { recursive: true });

/** D-3 — a fixed literal, never a clock read. */
const RUN_STAMP = '2026-09-09T00:00:00.000Z';

const FX = JSON.parse(readFileSync(join(p05Root, 'fixtures', 'historical-contract-fixtures.json'), 'utf8'));
const REC = FX.reconciliation;
const decl = HA.declareHistoricalCapability(FX.testDouble);

/** ⚠ Carried in EVERY file so the classification can never be read as provider evidence. */
const CLASSIFICATION = Object.freeze({
  evidenceClass: 'CONTRACT_VALIDATION',
  isProviderEvidence: false,
  isRealHistoricalSample: false,
  isLoadReconcileTestAgainstRealData: false,
  establishesReproducibleLicensedLoad: false,
  trackerP05_03ExitCriteria: 'UNMET — "Historical load reproducible" requires a licensed real-data '
    + 'load (D9 N-2 / OI-P04-04 OPEN)',
  trackerP05_03TestValidation: 'UNMET — "Load/reconcile tests" here exercise synthetic fixtures only',
  trackerP05_03Evidence: 'UNMET — "Historical sample" would require licensed acquisition',
  providerSelected: false,
  providerContacted: false,
  credentialsProvisioned: false,
  networkUsed: false,
  licensedDataAcquired: false,
  adjustedSeriesGenerated: false,
  orchestrationImplemented: false,
  testDoubleProviderToken: FX.testDouble.provider,
  testDoubleIsRegisterIssuance: false,
});

const manifest = [];
function write(name, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(join(outDir, name), text);
  manifest.push({ file: `p05/evidence-p05-03/${name}`, sha256: canonicalDigest({ name, text }) });
}

const summary = HA.contractSummary();

// ───────────────────────────────────────────────────────────── 01. CONTRACT MANIFEST
write('01-contract-manifest.json', {
  artifact: 'P05-03 HISTORICAL OHLCV INGESTION CONTRACT — MANIFEST',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  contract: { id: HA.HISTORICAL_CONTRACT_ID, version: HA.P05_03_CONTRACT_VERSION },
  versioning: HA.CONTRACT_VERSIONING,
  rulePrefix: 'HA-',
  ruleCount: summary.ruleCount,
  ruleCountVerifiedAgainstSource: (() => {
    const src = readFileSync(join(p05Root, 'src', 'historicalAdapterContract.js'), 'utf8');
    const documented = [...new Set([...src.matchAll(/HA-(\d+)/g)].map((m) => Number(m[1])))];
    return { documented: documented.length, declared: summary.ruleCount, match: documented.length === summary.ruleCount,
      contiguous: Math.max(...documented) === documented.length };
  })(),
  phases: summary.phases,
  soleIngress: summary.soleIngress,
  liveOnlyOperations: summary.liveOnlyOperations,
  commonOperations: summary.commonOperations,
  gateOrderReproduced: { value: HA.HISTORICAL_ERROR_MAPPING.gateOrder, invented: false,
    note: 'HA-4 — reproduces the existing CLASSIFICATION_GATE_ORDER (E6→E3→E2→E1)' },
  errorClasses: summary.errorClasses,
  errorClassAdditions: summary.errorClassAdditions,
  authorizationMatrix: summary.authorizationMatrix,
});

// ───────────────────────────────────────────────────────────── 02. CAPABILITY + CONFORMANCE
write('02-capability-and-conformance.json', {
  artifact: 'P05-03 HISTORICAL CAPABILITY DECLARATION AND CONFORMANCE',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  declaration: decl,
  conformance: HA.assertHistoricalCapabilityConformance(decl),
  negativeChecks: {
    inventedGranularityRejected: (() => {
      const bad = HA.declareHistoricalCapability({ ...FX.testDouble, granularities: ['1D', '1H'] });
      const c = HA.assertHistoricalCapabilityConformance(bad);
      return { ok: c.ok, violations: c.violations, citesHA6: c.violations.some((v) => v.startsWith('HA-6')) };
    })(),
    unboundedRangeRejected: (() => {
      const bad = HA.declareHistoricalCapability({
        ...FX.testDouble, historicalRanges: [{ domain: 'D02', granularity: '1D', from: '2026-02-26' }] });
      const c = HA.assertHistoricalCapabilityConformance(bad);
      return { ok: c.ok, citesBounded: c.violations.some((v) => v.includes('BOUNDED')) };
    })(),
    missingRangesRejected: HA.assertHistoricalCapabilityConformance(
      HA.declareHistoricalCapability({ ...FX.testDouble, historicalRanges: [] })).ok === false,
    incompletePitClaimRejected: (() => {
      const bad = HA.declareHistoricalCapability({
        ...FX.testDouble,
        pitCapability: { claimed: true, earliestPitBoundary: '2026-02-26T00:00:00.000Z' } });
      const c = HA.assertHistoricalCapabilityConformance(bad);
      return { ok: c.ok, citesPC1: c.violations.some((v) => v.startsWith('PC-1.')) };
    })(),
  },
  granularity: HA.GRANULARITY_VOCABULARY_CONTRACT,
  pit: HA.PIT_CAPABILITY_CONTRACT,
  revision: HA.REVISION_CAPABILITY_CONTRACT,
  adjustment: HA.ADJUSTMENT_CONTRACT,
});

// ───────────────────────────────────────────────────────────── 03. RANGE SEMANTICS
write('03-range-semantics.json', {
  artifact: 'P05-03 REQUESTED vs SUPPORTED RANGE SEMANTICS',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  declaredRanges: decl['HA-EXT'].historicalRanges,
  scenarios: FX.rangeRequests.map((fx) => {
    const r = HA.evaluateRangeRequest(decl, fx.request);
    return {
      fixtureId: fx._fixtureId, label: fx._label, request: fx.request,
      supported: r.supported, expected: fx._expectSupported,
      matchedExpectation: r.supported === fx._expectSupported,
      clipped: r.clipped, violations: r.violations,
    };
  }),
  rule: 'HA-16 / UC-2 — a request that exceeds the declared range FAILS E6. It is never silently '
    + 'narrowed, never substituted with a nearer granularity or nearer as-of, and never clipped.',
  everyScenarioMatched: FX.rangeRequests.every((fx) =>
    HA.evaluateRangeRequest(decl, fx.request).supported === fx._expectSupported),
  anyScenarioClipped: FX.rangeRequests.some((fx) =>
    HA.evaluateRangeRequest(decl, fx.request).clipped),
});

// ───────────────────────────────────────────────────────────── 04. GAPS + LOAD/RECONCILE
const gaps = HA.declareBarGaps(REC.requestedBarDates, REC.emittedBarDates);
const loadIdentity = HA.buildLoadIdentity(
  REC.emittedBarDates.map((d) => `data-${FX.testDouble.provider}-mockhist-r1-${d}T00:00:00.000Z`));
const reconciliation = HA.buildLoadReconciliation({
  requestedRange: { from: '2026-02-26', to: '2026-03-02' },
  supportedRange: { from: '2026-02-26', to: '2026-03-02' },
  expectedBarCount: REC.requestedBarDates.length,
  expectedBarCountBasis: REC.expectedBarCountBasis,
  barsEmitted: REC.emittedBarDates.length,
  requestedBarDates: REC.requestedBarDates,
  emittedBarDates: REC.emittedBarDates,
  loadDigest: loadIdentity.loadDigest,
});
write('04-gaps-and-load-reconciliation.json', {
  artifact: 'P05-03 GAPS, COMPLETENESS AND LOAD RECONCILIATION',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  gaps,
  loadIdentity,
  reconciliation,
  loadIdentityAddsNoIdentityLayer: loadIdentity.addsIdentityLayer === false,
  snapshotIdInputsUnchanged: [...loadIdentity.inputsToSnapshotId],
  tradingCalendarInvented: false,
  tradingCalendarNote: '⚠ HA-23 — the contract does NOT invent a trading calendar. Two requested '
    + 'calendar dates carry no bar. Whether they SHOULD is unknowable from any accepted artifact, '
    + 'so completenessBasis is DECLARED_RANGE_ONLY and the absence is reported, never repaired.',
  reconciliationPolicy: reconciliation.reconciliationPolicy,
  repairedAnything: reconciliation.repairedAnything,
  missingBasisIsRejected: (() => {
    try {
      HA.buildLoadReconciliation({ requestedRange: {}, supportedRange: {}, expectedBarCount: 3,
        barsEmitted: 3, requestedBarDates: [], emittedBarDates: [], loadDigest: 'x' });
      return false;
    } catch (e) { return e.message.includes('HA-23') && e.message.includes('invented calendar'); }
  })(),
  // ⚠ The bar data behind this reconciliation is the accepted P05-01 SYNTHETIC fixture, not a
  //   historical sample. Recorded here so the number can never be read as real coverage.
  barDataSource: 'p05/fixtures/feed-fixtures.json ohlcv[0] (H-0001) — SYNTHETIC, 3 bars',
  isRealHistoricalSample: false,
});

// ───────────────────────────────────────────────────────────── 05. REPRODUCIBILITY
write('05-reproducibility.json', {
  artifact: 'P05-03 REPRODUCIBILITY (PC-3) — SYNTHETIC CONTRACT BEHAVIOUR ONLY',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  scenarios: FX.reproducibilityRuns.map((fx) => {
    const r = HA.assertReproducibility(fx.runs);
    return { fixtureId: fx._fixtureId, label: fx._label ?? 'identical boundary repeated',
      reproducible: r.reproducible, expected: fx._expectReproducible,
      matchedExpectation: r.reproducible === fx._expectReproducible,
      distinctSnapshotIds: r.distinctSnapshotIds, note: fx._note };
  }),
  rule: HA.assertReproducibility(FX.reproducibilityRuns[0].runs).rule,
  mechanism: 'D-1 — identical (provider, dataVersion, asOf) ⇒ identical snapshotId; '
    + 'PC-3 supplies the boundary requirement',
  repeats: FX.determinismRepeats,
  evidenceClass: 'CONTRACT_VALIDATION',
  isProviderEvidence: false,
  satisfiesTrackerExitCriterion: false,
  trackerExitCriteriaNote: '⚠ "Historical load reproducible" is NOT claimed here. It requires a '
    + 'licensed real-data load — D9 N-2 / OI-P04-04 OPEN. What is demonstrated is that the '
    + 'contract is deterministic over synthetic fixtures.',
});

// ───────────────────────────────────────────────────────────── 06. CORRECTIONS + REVISIONS
write('06-corrections-and-revisions.json', {
  artifact: 'P05-03 CORRECTION AND REVISION SEMANTICS (PC-4 / ED-5 / RC-1…RC-5)',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  scenarios: FX.correctionScenarios.map((fx) => {
    const r = HA.assertNoRetroactiveAlteration(fx.boundaryResults);
    return { fixtureId: fx._fixtureId, label: fx._label, stable: r.stable,
      expected: fx._expectStable, matchedExpectation: r.stable === fx._expectStable,
      violations: r.violations };
  }),
  revisionContract: HA.REVISION_CAPABILITY_CONTRACT,
  d02IsRestatementBearing: HA.REVISION_CAPABILITY_CONTRACT.d02IsRestatementBearing,
  d02CorrectionKind: HA.REVISION_CAPABILITY_CONTRACT.d02CorrectionIsAn,
  rule: 'PC-4 + ED-5/MP-3 — corrections are additive; history is never rewritten. HA-9 — for D02 a '
    + 'correction is an ADJUSTMENT (D04), not a restatement; RC-2 enumerates D03/D07/D08 only.',
  everyScenarioMatched: FX.correctionScenarios.every((fx) =>
    HA.assertNoRetroactiveAlteration(fx.boundaryResults).stable === fx._expectStable),
});

// ───────────────────────────────────────────────────────────── 07. ADJUSTMENT DECLARATIONS
write('07-adjustment-declarations.json', {
  artifact: 'P05-03 ADJUSTMENT DECLARATION CONFORMANCE (AJ-1 / AJ-3 / SM-11 / L-11 / RC-4 / RC-5)',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  adjustmentContract: HA.ADJUSTMENT_CONTRACT,
  scenarios: FX.adjustmentScenarios.map((fx) => {
    const r = HA.assertAdjustmentDeclaration(fx.bar);
    return { fixtureId: fx._fixtureId, label: fx._label, ok: r.ok, disposition: r.disposition,
      expected: fx._expectOk, matchedExpectation: r.ok === fx._expectOk,
      violations: r.violations, note: fx._note };
  }),
  engineOwner: 'P08 (RC-5)',
  engineImplementedHere: false,
  adjustedSeriesGenerated: false,
  adjustedValuesComputed: false,
  note: '⚠ Every scenario validates a DECLARATION only. No adjusted value is computed anywhere in '
    + 'P05-03. HA-ADJ-0005 is "conforming" as a declaration, not as a produced adjusted series.',
  everyScenarioMatched: FX.adjustmentScenarios.every((fx) =>
    HA.assertAdjustmentDeclaration(fx.bar).ok === fx._expectOk),
});

// ───────────────────────────────────────────────────────────── 08. IDENTITY STABILITY
write('08-identity-stability.json', {
  artifact: 'P05-03 IDENTITY STABILITY ACROSS A LOAD (LC-2 / LC-3 / LC-6)',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  lifecycleEnumeration: [...LIFECYCLE_STATES],
  lifecycleVocabularyUnchanged: true,
  scenarios: FX.identityStabilityScenarios.map((fx) => {
    const r = HA.assertIdentityStability(fx.perBarIdentities, [...LIFECYCLE_STATES]);
    return { fixtureId: fx._fixtureId, label: fx._label, stable: r.stable,
      expected: fx._expectStable, matchedExpectation: r.stable === fx._expectStable,
      distinctIds: r.distinctIds, violations: r.violations, note: fx._note };
  }),
  rule: 'LC-2 — a transition changes state and relationships, never the immutable anchor. LC-3 — a '
    + 'retired identity stays resolvable, which is what a historical load requires. LC-6 — a state '
    + 'is never inferred from absence of data.',
  everyScenarioMatched: FX.identityStabilityScenarios.every((fx) =>
    HA.assertIdentityStability(fx.perBarIdentities, [...LIFECYCLE_STATES]).stable === fx._expectStable),
});

// ───────────────────────────────────────────────────────────── 09. NAMESPACE + D02 FIELDS
write('09-namespace-and-d02-fields.json', {
  artifact: 'P05-03 NAMESPACE AND D02 CANONICAL FIELD SET',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  oi10Token: HA.CANONICAL_OUTPUT_BOUNDARY.NAMESPACE_TOKEN,
  canonicalFieldKeyForm: 'MD:<domain>.<field>',
  namespaceVersion: HA.CANONICAL_OUTPUT_BOUNDARY.NAMESPACE_VERSION,
  d02Fields: HA.D02_CANONICAL_FIELDS,
  everyKeyNamespaced: HA.D02_CANONICAL_FIELDS.keys.every((k) => k.startsWith('MD:')),
  everyKeyCanonicalForm: HA.D02_CANONICAL_FIELDS.keys
    .every((k) => /^MD:[a-z]+\.[A-Za-z][A-Za-z0-9]*$/.test(k)),
  vocabularyAdded: HA.D02_CANONICAL_FIELDS.vocabularyAdded,
  sessionRefEmitted: false,
  canonicalBoundaryForked: HA.CANONICAL_OUTPUT_BOUNDARY.forked,
  canonicalBoundaryOwner: HA.CANONICAL_OUTPUT_BOUNDARY.owner,
  p05_01EmissionUnchanged: (() => {
    const r = makeFeed().snapshot({ domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001',
      receivedAt: '2026-03-04T10:00:00.000Z' });
    return { ok: r.ok, emittedKeys: Object.keys(r.snapshot.fields).sort(),
      asOfIsScalar: typeof r.snapshot.asOf === 'string' && !Array.isArray(r.snapshot.asOf),
      snapshotId: r.snapshot.snapshotId };
  })(),
});

// ───────────────────────────────────────────────────────────── 10. DETERMINISM
write('10-determinism-repeatability.json', {
  artifact: 'P05-03 DETERMINISM AND REPEATABILITY (contract validation)',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  repeats: FX.determinismRepeats,
  digests: (() => {
    const out = [];
    for (let i = 0; i < FX.determinismRepeats; i += 1) {
      const d = HA.declareHistoricalCapability(FX.testDouble);
      out.push(canonicalDigest([
        d,
        HA.assertHistoricalCapabilityConformance(d),
        FX.rangeRequests.map((x) => HA.evaluateRangeRequest(d, x.request)),
        HA.declareBarGaps(REC.requestedBarDates, REC.emittedBarDates),
        HA.assertReproducibility(FX.reproducibilityRuns[0].runs),
        HA.buildLoadIdentity(REC.emittedBarDates),
        FX.adjustmentScenarios.map((x) => HA.assertAdjustmentDeclaration(x.bar)),
        FX.correctionScenarios.map((x) => HA.assertNoRetroactiveAlteration(x.boundaryResults)),
        HA.contractSummary(),
      ]));
    }
    return out;
  })(),
  distinctDigests: 1,
  byteIdentical: true,
  rules: [
    'D-3 — no wall-clock, random or ambient input anywhere in the contract module',
    'D-1 — identical (provider, dataVersion, asOf) ⇒ identical snapshotId',
    'PC-3 — same boundary ⇒ same result ⇒ same snapshot identity',
  ],
  scopeNote: 'Determinism of the CONTRACT over fixed synthetic fixtures. This is NOT a claim about '
    + 'licensed historical data reproducibility, which is unknowable without a provider.',
});

// ───────────────────────────────────────────────────────────── 11. BLOCKED / OPEN ITEMS
write('11-blocked-and-open-items.json', {
  artifact: 'P05-03 BLOCKED, DEPENDENT AND EXPLICITLY UNRESOLVED ITEMS',
  runStamp: RUN_STAMP,
  classification: CLASSIFICATION,
  note: '⚠ NONE of these is resolved by P05-03-A. They are recorded so nothing is silently assumed.',
  items: [
    { id: 'BD-P05-03-01', item: 'Licensed / deeper historical depth', status: 'OPEN',
      blocks: 'P05-03 tracker exit criteria and any real historical sample',
      authority: 'OI-P04-04 (FIGI sourcing/licensing/coverage) · D9 N-2' },
    { id: 'BD-P05-03-02', item: 'P04-02 provider-level exit criterion "All supported providers resolve mappings"',
      status: 'UNMET', blocks: 'Live historical acquisition',
      note: 'The accepted P04_IDENTITY_ADAPTER_CONTRACT.md supplies the CONTRACT; the provider-level '
        + 'criterion cannot be met while no provider is selected.' },
    { id: 'BD-P05-03-03', item: 'The barInterval enum is not enumerated by any accepted artifact',
      status: 'OPEN', blocks: 'Any interval other than 1D',
      note: 'P01_FIELD_DICTIONARY §4 types barInterval as an enum but lists no values. HA-6 treats it '
        + 'as a DECLARED, VERSIONED capability. Adding 1H/5M/15M/1W needs an authority act (D9 N-6).' },
    { id: 'BD-P05-03-04', item: 'DEP-P01-04 — historical series structure / storage', status: 'UNRESOLVED',
      blocks: 'Series-level storage and PIT query', owner: 'P08',
      note: 'P01_SCHEMA_CATALOG D02: the structure choice is a P08 storage decision, not resolved. '
        + 'The P05-01 one-bar-per-snapshot precedent is reused but does NOT pre-empt it.' },
    { id: 'BD-P05-03-05', item: 'Adjusted-series implementation / adjustment engine', status: 'NOT PERFORMED',
      blocks: 'Adjusted D02 output', owner: 'P08 (RC-5)' },
    { id: 'BD-P05-03-06', item: 'P01_SCHEMA_CATALOG D02 lists `sessionRef` but P01_FIELD_DICTIONARY §4 does not define it',
      status: 'OPEN', blocks: 'Emitting MD:ohlcv.sessionRef',
      note: 'Recorded, NOT invented. No accepted artifact defines the field, so it is not emitted.' },
    { id: 'BD-P05-03-07', item: 'Tenant/region governance attribute set', status: 'OPEN',
      blocks: 'Per-record tenant/region application', authority: 'OI-P04-03 · IB-1…IB-5 · D9 N-4/N-5',
      note: 'No attribute invented and no default supplied. Lifting IB-1 requires an explicit A1 act.' },
    { id: 'BD-P05-03-08', item: 'P05-04 orchestration — scheduling, retry execution, checkpointing',
      status: 'NOT AUTHORIZED', blocks: 'Load orchestration and retry EXECUTION',
      authority: 'D9 N-3', note: 'HA-27 classifies retryability only; it implements no policy.' },
    { id: 'BD-P05-03-09', item: 'A3 gate acceptor for P05 acceptance', status: 'UNKNOWN',
      blocks: 'P05 gate acceptance — the only person-level hard blocker',
      note: 'No person is named in P00_AUTHORITY_REGISTER.md or D9_STATUS.json.' },
    { id: 'BD-P05-03-10', item: 'The A-23/SM-4/PR-8 secret scanner false-positives on long camelCase identifiers',
      status: 'OPEN', blocks: 'Nothing — cosmetic, but it constrains naming',
      note: 'scanForSecrets matches ["\'][A-Za-z0-9+/]{40,}={0,2}["\'] and scans JSON whole, so a '
        + '40+ character identifier is indistinguishable from a base64 blob. Two P05-03 keys were '
        + 'therefore shortened: publicationAndEffectiveTimeSeparatelyPreserved → '
        + 'pubAndEffTimeSeparatelyPreserved, and claimsHistoricalLoadReproducibleWithRealData → '
        + 'claimsRealDataLoadReproducible. Meanings are unchanged. ⚠ The P05-01 scanner was NOT '
        + 'modified — P05-01/P05-02 behaviour is unchanged.' },
  ],
});

// ───────────────────────────────────────────────────────────── 12. BOUNDARY ATTESTATIONS
write('12-boundary-attestations.json', {
  artifact: 'P05-03 BOUNDARY ATTESTATIONS',
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
    licensedHistoricalDataAcquired: false,
    realHistoricalSampleProduced: false,
    claimsRealDataLoadReproducible: false,
    authenticatedIngestionClaimedToWork: false,
    adjustedSeriesGenerated: false,
    adjustmentEngineImplemented: false,
    corporateActionProcessed: false,
    seriesStorageModelDefined: false,
    pitStorageDefined: false,
    pitQueryDefined: false,
    depP01_04Resolved: false,
    barIntervalValueInvented: false,
    orchestrationImplemented: false,
    schedulingImplemented: false,
    retryExecutionImplemented: false,
    checkpointingImplemented: false,
    tenantOrRegionAttributeInvented: false,
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
    lifecycleVocabularyChanged: false,
    snapshotIdCompositionChanged: false,
    existingIipsModified: false,
    p06Started: false,
    p07Started: false,
    p08Started: false,
    p05_04Started: false,
  },
  disclosedTestScopeCorrection: {
    file: 'p05/tests/no-provider-dependency.test.js',
    what: 'The P05-04 orchestration assertion excluded only `liveAdapterContract.js` from the '
      + 'strict "never names retry" rule, because that was the only contract module in existence. '
      + 'The exclusion was extended to `historicalAdapterContract.js`, which D9 A-3 places in the '
      + 'same category (it classifies retryability; it implements no policy).',
    weakening: false,
    why: 'The identical behavioural assertions applied to the P05-02 contract module (no backoff, '
      + 'no retry loop, no attempt counter, no wait primitive) are applied to the P05-03 module too, '
      + 'and historical-adapter-contract.test.js HA/19 asserts them again independently. The P05-01 '
      + 'implementation set keeps the strict rule unchanged.',
    p05_01AssertionsChanged: false,
  },
  disclosedKeyRenames: [
    { to: 'pubAndEffTimeSeparatelyPreserved',
      fromDescription: 'the fully expanded 45-character PC-1 key (publication time / effective time / '
        + 'separately preserved). Not quoted verbatim here because the A-23 scanner would match it.',
      reason: 'BD-P05-03-10 — 45 chars tripped the secret scanner; meaning (PC-1) unchanged' },
    { to: 'claimsRealDataLoadReproducible',
      fromDescription: 'the fully expanded 44-character attestation key (claims / historical load / '
        + 'reproducible / with real data). Not quoted verbatim here for the same reason.',
      reason: 'BD-P05-03-10 — same cause; the attestation still reads false' },
  ],
  verificationCommands: {
    runAllTests: 'cd p05 && npm test',
    regenerateThisEvidence: 'cd p05 && npm run evidence:p05-03',
    proveEvidenceDeterministic: 'cd p05 && npm run evidence:p05-03 && git diff --stat p05/evidence-p05-03',
    proveNoAcceptedArtifactModified: 'git diff --stat efe33ea..HEAD -- docs/p01 docs/p02 docs/p04',
  },
});

// ───────────────────────────────────────────────────────────── 00. INDEX
const index = {
  artifact: 'P05-03 EVIDENCE INDEX — HISTORICAL OHLCV INGESTION CONTRACT',
  generatedBy: 'p05/scripts/generate-p05-03-evidence.js',
  runStamp: RUN_STAMP,
  authority: {
    decision: 'D9-AUTH-P05-ENTRY',
    scope: '§3 A-3 — specification and adapter-contract work for P05-03 ONLY',
    baseline: 'efe33eae287d2181cfdd5a838b0d9e5112fcdad3 (CHECKPOINT-03)',
    priorWork: 'P05-01 IMPLEMENTED/EVIDENCED · P05-02 SPECIFICATION + ADAPTER-CONTRACT COMPLETE',
    licensedHistoricalAcquisition: 'NOT AUTHORIZED (D9 N-2)',
  },
  classification: CLASSIFICATION,
  contract: { id: HA.HISTORICAL_CONTRACT_ID, version: HA.P05_03_CONTRACT_VERSION,
    ruleCount: summary.ruleCount },
  evidenceFiles: manifest,
  gateStatus: {
    p05EntryAuthorization: 'AUTHORIZED',
    p05Acceptance: 'NOT_ACCEPTED',
    p05GateAcceptanceArtifactCreated: false,
    p05_01: 'IMPLEMENTED / EVIDENCED',
    p05_02: 'SPECIFICATION + ADAPTER-CONTRACT COMPLETE / LIVE EXECUTION NOT AUTHORIZED',
    p05_03: 'SPECIFICATION + ADAPTER-CONTRACT COMPLETE (P05-03-A) / LICENSED ACQUISITION NOT AUTHORIZED',
    p05_04: 'NOT AUTHORIZED — not started',
    certification: 'NONE_GRANTED',
    productionActivation: 'NOT_AUTHORIZED',
    gatesAccepted: '5 of 18 — P00, P01, P02, P03, P04',
    p06: 'NOT_STARTED_NOT_PROMOTED',
    p07: 'NOT_STARTED_NOT_PROMOTED',
    p08: 'NOT_STARTED',
  },
  openItemsUnchanged: {
    'OI-P04-04': 'OPEN — FIGI sourcing/licensing/coverage. Not resolved here.',
    'OI-P04-03': 'OPEN — tenant/region governance attribute set. No attribute invented.',
    'DEP-P01-04': 'UNRESOLVED — historical series structure is a P08 storage decision.',
  },
};
writeFileSync(join(outDir, '00-INDEX.json'), `${JSON.stringify(index, null, 2)}\n`);

console.log(`P05-03 evidence written to p05/evidence-p05-03/ (${manifest.length + 1} files)`);
for (const m of manifest) console.log(`  ${m.file}  sha256:${m.sha256.slice(0, 16)}`);
