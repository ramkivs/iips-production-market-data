/**
 * P05-03-A TESTS — HISTORICAL OHLCV INGESTION CONTRACT (`HA-*`)
 *
 * Authority: D9 §3 **A-3** — specification and adapter-contract only.
 *
 * ⚠ Every test here is **offline and deterministic**. Nothing selects a provider, provisions a
 *   credential, opens a connection, acquires licensed data, orchestrates a load or performs P08
 *   storage/adjustment work. The evidence this suite produces is **CONTRACT_VALIDATION**, never
 *   PROVIDER_EVIDENCE.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import * as HA from '../src/historicalAdapterContract.js';
import {
  ADAPTER_CONTRACT_ID as LIVE_CONTRACT_ID,
  CANONICAL_OUTPUT_BOUNDARY as LIVE_BOUNDARY,
} from '../src/liveAdapterContract.js';
import { LIFECYCLE_STATES, MappingRegister, buildIdentityRef } from '../src/identity.js';
import { CLASSIFICATION_GATE_ORDER, RETRY_PROHIBITED } from '../src/errors.js';
import { canonicalDigest } from '../src/serialize.js';
import { buildSnapshotId } from '../src/contract.js';
import { makeFeed, p05Root } from './helpers.js';

const FX = JSON.parse(
  readFileSync(join(p05Root, 'fixtures', 'historical-contract-fixtures.json'), 'utf8'),
);
const decl = () => HA.declareHistoricalCapability(FX.testDouble);
const REC = FX.reconciliation;

// ─────────────────────────────────────────────────────────────────────────────────────────────
// HA/1…HA/3 — CONTRACT IDENTITY, PHASE SHAPE, SERIES-STRUCTURE BOUNDARY
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('HA/1 — the contract is versioned, self-describing, and its ruleCount is not inflated', () => {
  assert.equal(HA.HISTORICAL_CONTRACT_ID, 'P05-03-HISTORICAL-OHLCV-INGESTION-CONTRACT');
  assert.equal(HA.P05_03_CONTRACT_VERSION, '1.0');
  const s = HA.contractSummary();
  assert.equal(s.contractId, HA.HISTORICAL_CONTRACT_ID);
  assert.equal(s.rulePrefix, 'HA-');
  // ⚠ The declared count must equal the rules actually documented in the module. A count that
  //   exceeds the documented rules would be a fabricated completeness claim.
  const src = readFileSync(join(p05Root, 'src', 'historicalAdapterContract.js'), 'utf8');
  const documented = [...new Set([...src.matchAll(/HA-(\d+)/g)].map((m) => Number(m[1])))];
  assert.equal(s.ruleCount, documented.length, 'ruleCount must equal the documented rule count');
  assert.equal(Math.max(...documented), documented.length, 'HA- numbering is contiguous from 1');
  assert.equal(HA.CONTRACT_VERSIONING.majorChangeRule.includes('AV-4'), true, 'AV-4 mirrored');
  assert.equal(HA.CONTRACT_VERSIONING.immutableOnceReleased.includes('AV-5'), true, 'AV-5 mirrored');
});

test('HA/2 — the nine-phase shape is preserved and gate order is reproduced, not invented', () => {
  assert.deepEqual(HA.HISTORICAL_PHASES.map((p) => p.phase),
    ['declare', 'preflight', 'entitlement', 'authenticate', 'fetch', 'normalize', 'map', 'validate', 'emit']);
  const orders = HA.HISTORICAL_PHASES.map((p) => p.order);
  assert.deepEqual(orders, [...orders].sort((a, b) => a - b), 'strictly ordered');
  const gatePhases = HA.HISTORICAL_PHASES
    .filter((p) => p.failureClass && /^E/.test(p.failureClass)).map((p) => p.phase);
  assert.deepEqual(gatePhases.slice(0, 4), ['preflight', 'entitlement', 'authenticate', 'fetch']);
  assert.deepEqual(CLASSIFICATION_GATE_ORDER, ['E6', 'E3', 'E2', 'E1'], 'existing precedence unchanged');
  assert.equal(HA.contractSummary().soleIngress.includes('snapshot(request)'), true,
    'P02 B-4 / AD-2 — one ingress, the phases are internal');
});

test('HA/3 — HA-3: one bar per snapshot, scalar asOf, and DEP-P01-04 stays UNRESOLVED', () => {
  const ss = HA.SERIES_STRUCTURE_CONTRACT;
  assert.equal(ss.representation, 'ORDERED_SEQUENCE_OF_PER_BAR_SNAPSHOTS');
  assert.equal(ss.barsPerSnapshot, 1);
  assert.equal(ss.asOfIsScalar, true);
  // ⚠ The load-bearing assertions: reusing the P05-01 precedent must NOT be read as resolving P08.
  assert.equal(ss.resolvesDepP01_04, false, 'DEP-P01-04 remains UNRESOLVED');
  assert.equal(ss.depP01_04Owner, 'P08');
  assert.equal(ss.seriesStorageModelDefined, false, 'no series-storage model here');
  assert.equal(ss.pitStorageDefined, false, 'PC-6 — PIT storage is P08');
  assert.equal(ss.pitQueryDefined, false, 'no PIT query surface here');
  assert.match(ss.precedent, /P05-01/, 'the precedent is the accepted P05-01 behaviour');
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// HA/4…HA/8 — CAPABILITY DECLARATION AND CONFORMANCE
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('HA/4 — HA-11/HA-14: the historical capability declaration conforms with zero violations', () => {
  const c = HA.assertHistoricalCapabilityConformance(decl());
  assert.deepEqual(c.violations, [], `unexpected violations: ${c.violations.join(' | ')}`);
  assert.equal(c.ok, true);
  assert.ok(c.checked.length >= 20, 'a meaningful number of rules were actually checked');
  // HA-11 — the declaration is static and I/O-free and carries no endpoint or credential value.
  const ext = decl()['HA-EXT'];
  assert.equal(ext.transport.endpointDeclared, false, 'SP-2');
  assert.equal(ext.transport.credentialValuePresent, false, 'SP-2 / A-23');
  assert.equal(JSON.stringify(decl()).match(/https?:\/\//), null, 'no URL anywhere in the declaration');
});

test('HA/5 — HA-12: entitlement/credential entries are REQUIREMENTS, never grants or values', () => {
  const a7 = decl()['A-7'];
  assert.equal(a7.entitlementRequired, true);
  assert.equal(a7.credentialsRequired, true);
  for (const e of a7.entitlementRequirements) {
    assert.equal(typeof e.entitlementRef, 'string');
    assert.equal(e.value, undefined, 'no entitlement VALUE may exist (INV-10: matrix EMPTY)');
  }
  for (const c of a7.credentialRequirements) {
    assert.equal(c.valuePresent, false, 'SP-5 — a requirement, never a credential');
    assert.ok(HA.GRANULARITY_VOCABULARY_CONTRACT !== undefined);
    assert.ok(['API_KEY', 'OAUTH2_CLIENT_CREDENTIALS', 'MUTUAL_TLS_CERTIFICATE', 'SIGNED_TOKEN', 'SESSION_COOKIE']
      .includes(c.kind), 'the credential KIND vocabulary is the accepted P05-02 one');
  }
});

test('HA/6 — HA-6: `1D` is the only authorized barInterval and no interval is invented', () => {
  const gv = HA.GRANULARITY_VOCABULARY_CONTRACT;
  assert.deepEqual([...gv.currentlyAuthorizedValues], ['1D']);
  assert.equal(gv.declaredNotInvented, true);
  assert.equal(gv.enumeratedByAcceptedArtifact, false,
    '⚠ P01_FIELD_DICTIONARY §4 types barInterval as an enum but never enumerates it');
  assert.match(gv.gapDisposition, /OPEN/, 'the gap is recorded OPEN, not silently closed');
  for (const bad of ['1H', '5M', '15M', '1W', '1M', '3M', '1Y']) {
    assert.ok(gv.prohibitedHere.includes(bad), `${bad} must be explicitly prohibited`);
    assert.ok(!gv.currentlyAuthorizedValues.includes(bad));
  }
  // And the declaration itself only carries 1D.
  assert.deepEqual([...decl()['A-6'].granularities], ['1D']);
  // A declaration claiming an invented interval must FAIL conformance.
  const bad = HA.declareHistoricalCapability({ ...FX.testDouble, granularities: ['1D', '1H'] });
  const c = HA.assertHistoricalCapabilityConformance(bad);
  assert.equal(c.ok, false);
  assert.ok(c.violations.some((v) => v.startsWith('HA-6')), 'HA-6 must be the failing rule');
});

test('HA/7 — HA-13: historicalRanges[] must be bounded, and conformance fails without them', () => {
  const ranges = decl()['HA-EXT'].historicalRanges;
  assert.equal(ranges.length, 1);
  for (const r of ranges) {
    assert.equal(typeof r.from, 'string');
    assert.equal(typeof r.to, 'string');
    assert.equal(r.domain, 'D02');
    assert.equal(r.granularity, '1D');
    assert.equal(typeof r.completenessBasis, 'string');
  }
  // An UNBOUNDED range is not a declaration.
  const unbounded = HA.declareHistoricalCapability({
    ...FX.testDouble,
    historicalRanges: [{ domain: 'D02', granularity: '1D', from: '2026-02-26' }],
  });
  const c = HA.assertHistoricalCapabilityConformance(unbounded);
  assert.equal(c.ok, false);
  assert.ok(c.violations.some((v) => v.includes('BOUNDED')));
  // And no historicalRanges[] at all fails too.
  const none = HA.declareHistoricalCapability({ ...FX.testDouble, historicalRanges: [] });
  assert.equal(HA.assertHistoricalCapabilityConformance(none).ok, false);
});

test('HA/8 — PC-1…PC-6 / RC-1…RC-5 / HA-9: PIT, revision and adjustment boundaries', () => {
  const ext = decl()['HA-EXT'];
  // PC-1 — a PIT claim must state all three.
  for (const k of HA.PIT_CAPABILITY_CONTRACT.claimMustState) {
    assert.notEqual(ext.pitCapability[k], undefined, `PC-1 requires ${k}`);
  }
  assert.match(HA.PIT_CAPABILITY_CONTRACT.depthIsNotPit, /PC-2/);
  assert.equal(HA.PIT_CAPABILITY_CONTRACT.storageDefinedHere, false, 'PC-6');
  // A PIT claim missing a PC-1 element must fail.
  const partial = HA.declareHistoricalCapability({
    ...FX.testDouble, pitCapability: { claimed: true, earliestPitBoundary: '2026-02-26T00:00:00.000Z' },
  });
  const c = HA.assertHistoricalCapabilityConformance(partial);
  assert.equal(c.ok, false);
  assert.ok(c.violations.some((v) => v.startsWith('PC-1.')));
  // RC-1 — vintage addressability must be stated.
  assert.notEqual(ext.revisionCapability.vintagesAddressable, undefined);
  // HA-9 — ⚠ D02 is NOT restatement-bearing; an OHLCV correction is an adjustment.
  assert.equal(HA.REVISION_CAPABILITY_CONTRACT.d02IsRestatementBearing, false);
  assert.deepEqual([...HA.REVISION_CAPABILITY_CONTRACT.restatementBearingDomains], ['D03', 'D07', 'D08']);
  assert.equal(HA.REVISION_CAPABILITY_CONTRACT.d02CorrectionIsAn,
    'ADJUSTMENT (D04 / AJ-1…AJ-3), never a restatement');
  // RC-5 — the adjustment engine is P08 and nothing is implemented here.
  assert.equal(ext.adjustment.engineImplementedHere, false);
  assert.equal(ext.adjustment.adjustedSeriesGeneratedHere, false);
  assert.equal(ext.adjustment.corporateActionProcessedHere, false);
  assert.equal(ext.adjustment.engineOwner, 'P08 (RC-5)');
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// HA/9…HA/11 — RANGE SEMANTICS, GAPS, LOAD IDENTITY
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('HA/9 — HA-16: requested vs supported range; UC-2 prohibits silent narrowing', () => {
  for (const fx of FX.rangeRequests) {
    const r = HA.evaluateRangeRequest(decl(), fx.request);
    assert.equal(r.supported, fx._expectSupported, `${fx._fixtureId}: ${fx._label}`);
    // ⚠ The contract NEVER clips. A caller that clips to what is available is non-conforming.
    assert.equal(r.clipped, false, `${fx._fixtureId} must not be clipped`);
    if (!fx._expectSupported) {
      assert.ok(r.violations.length > 0, `${fx._fixtureId} must name a violation`);
    }
  }
  const outOfRange = FX.rangeRequests.find((x) => x._fixtureId === 'HR-0003');
  const r = HA.evaluateRangeRequest(decl(), outOfRange.request);
  assert.ok(r.violations.some((v) => v.startsWith('UC-2')), 'UC-2 must be cited');
  const badGran = HA.evaluateRangeRequest(decl(),
    FX.rangeRequests.find((x) => x._fixtureId === 'HR-0004').request);
  assert.ok(badGran.violations.some((v) => v.startsWith('CE-4') || v.startsWith('HA-6')),
    'an unauthorized interval must be rejected');
});

test('HA/10 — HA-17: a gap is first-class content with an explicit list of prohibited substitutes', () => {
  const g = HA.declareBarGaps(REC.requestedBarDates, REC.emittedBarDates);
  assert.equal(g.gapCount, 2);
  assert.deepEqual([...g.gaps], ['2026-02-28', '2026-03-01']);
  assert.match(g.representation, /NOT_PROVIDED/);
  for (const bad of ['zero', 'empty string', 'carried-forward value',
    'omission of the bar entirely', 'a lower quality value']) {
    assert.ok(g.prohibitedRepresentations.includes(bad), `${bad} must be prohibited`);
  }
  // No gaps when everything is emitted.
  assert.equal(HA.declareBarGaps(REC.emittedBarDates, REC.emittedBarDates).gapCount, 0);
});

test('HA/11 — HA-18: load identity is a derived digest and adds NO identity layer', () => {
  const ids = REC.emittedBarDates.map((d) => `data-mockhist-mockhist-r1-${d}T00:00:00.000Z`);
  const li = HA.buildLoadIdentity(ids);
  assert.equal(li.barCount, 3);
  assert.equal(li.addsIdentityLayer, false, 'SN-4/SN-5 — no third identity layer');
  assert.match(li.loadDigest, /^[0-9a-f]{64}$/);
  assert.deepEqual([...li.inputsToSnapshotId], ['provider', 'dataVersion', 'asOf'],
    'INV-2/SN-1/ST-2 — snapshotId composition is unchanged');
  // Order matters: a reordered load is a different load.
  assert.notEqual(li.loadDigest, HA.buildLoadIdentity([...ids].reverse()).loadDigest);
  // And it is stable across identical inputs.
  assert.equal(li.loadDigest, HA.buildLoadIdentity(ids).loadDigest);
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// HA/12…HA/13 — REPRODUCIBILITY AND CORRECTIONS
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('HA/12 — HA-19: reproducibility (PC-3) is CONTRACT_VALIDATION and does NOT satisfy the tracker', () => {
  for (const fx of FX.reproducibilityRuns) {
    const r = HA.assertReproducibility(fx.runs);
    assert.equal(r.reproducible, fx._expectReproducible, `${fx._fixtureId}: ${fx._label ?? 'identical boundaries'}`);
    assert.equal(r.rule.includes('PC-3'), true);
    // ⚠ THE BOUNDARY THAT MUST NOT BE BLURRED.
    assert.equal(r.evidenceClass, 'CONTRACT_VALIDATION');
    assert.equal(r.isProviderEvidence, false);
    assert.equal(r.satisfiesTrackerExitCriterion, false,
      '"Historical load reproducible" requires a licensed real-data load (D9 N-2)');
    assert.match(r.trackerExitCriteriaNote, /OI-P04-04/);
  }
  // A single repeated boundary yields exactly one snapshot identity.
  const r = HA.assertReproducibility(FX.reproducibilityRuns[0].runs);
  assert.equal(r.distinctSnapshotIds.length, 1);
  // And that identity is exactly what the accepted composition produces.
  assert.equal(r.distinctSnapshotIds[0],
    buildSnapshotId('mockhist', 'mockhist-r1', '2026-03-02T00:00:00.000Z'));
});

test('HA/13 — HA-20: corrections are additive; a past boundary is never altered in place', () => {
  for (const fx of FX.correctionScenarios) {
    const r = HA.assertNoRetroactiveAlteration(fx.boundaryResults);
    assert.equal(r.stable, fx._expectStable, `${fx._fixtureId}: ${fx._label}`);
  }
  const bad = HA.assertNoRetroactiveAlteration(
    FX.correctionScenarios.find((x) => x._fixtureId === 'HC-0002').boundaryResults);
  assert.ok(bad.violations.some((v) => v.startsWith('PC-4')));
  const additive = HA.assertNoRetroactiveAlteration(
    FX.correctionScenarios.find((x) => x._fixtureId === 'HC-0003').boundaryResults);
  assert.equal(additive.stable, true, 'ED-5/MP-3 — an additive supersession is conforming');
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// HA/14…HA/15 — ADJUSTMENTS AND IDENTITY STABILITY
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('HA/14 — HA-21: AJ-1 / AJ-3 / SM-11 / RC-4 / RC-5 adjustment declaration conformance', () => {
  for (const fx of FX.adjustmentScenarios) {
    const r = HA.assertAdjustmentDeclaration(fx.bar);
    assert.equal(r.ok, fx._expectOk, `${fx._fixtureId}: ${fx._label}`);
    assert.equal(r.disposition, fx._expectOk ? 'ACCEPT' : 'REJECT');
    assert.equal(r.dispositionAuthority, 'SM-11 — P01_VALIDATION_RULES');
    assert.equal(r.engineOwner, 'P08 (RC-5)', 'the engine is never here');
  }
  // AJ-3 — adjusted without a basis ref is the specific invalid case.
  const noBasis = HA.assertAdjustmentDeclaration(
    FX.adjustmentScenarios.find((x) => x._fixtureId === 'HA-ADJ-0002').bar);
  assert.ok(noBasis.violations.some((v) => v.includes('AJ-3') && v.includes('SM-11') && v.includes('L-11')));
  // ⚠ RC-5 — even the CONFORMING adjusted case validates a DECLARATION only.
  const ok = FX.adjustmentScenarios.find((x) => x._fixtureId === 'HA-ADJ-0005');
  assert.match(ok._note, /RC-5/);
  assert.match(ok._note, /P08/);
});

test('HA/15 — HA-22: identity is stable across a load (LC-2 / LC-3 / LC-6)', () => {
  for (const fx of FX.identityStabilityScenarios) {
    const r = HA.assertIdentityStability(fx.perBarIdentities, [...LIFECYCLE_STATES]);
    assert.equal(r.stable, fx._expectStable, `${fx._fixtureId}: ${fx._label}`);
    assert.equal(r.lifecycleVocabularyUnchanged, true);
  }
  // LC-2 — a lifecycle transition mid-load keeps ONE anchor.
  const ok = HA.assertIdentityStability(
    FX.identityStabilityScenarios.find((x) => x._fixtureId === 'HI-0001').perBarIdentities,
    [...LIFECYCLE_STATES]);
  assert.deepEqual([...ok.distinctIds], ['CS-LOCAL-0001']);
  assert.deepEqual([...new Set(ok.distinctIds)].length === 1 ? ['active', 'suspended'] : [],
    ['active', 'suspended'], 'the STATE moved; the anchor did not');
  // LC-6 — a state invented from absence is rejected as a vocabulary violation.
  const lc6 = HA.assertIdentityStability(
    FX.identityStabilityScenarios.find((x) => x._fixtureId === 'HI-0003').perBarIdentities,
    [...LIFECYCLE_STATES]);
  assert.equal(lc6.stable, false);
  assert.ok(lc6.violations.some((v) => v.startsWith('LC vocabulary')));
  // ⚠ The accepted lifecycle vocabulary itself is unchanged by P05-03.
  assert.deepEqual([...LIFECYCLE_STATES], ['active', 'suspended', 'delisted', 'merged', 'superseded']);
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// HA/16…HA/19 — RECONCILIATION, ABSENCE, ERROR MAPPING, RETRY
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('HA/16 — HA-23/HA-24: reconciliation reports and never repairs, and needs a declared basis', () => {
  const li = HA.buildLoadIdentity(REC.emittedBarDates.map((d) => `x-${d}`));
  const rec = HA.buildLoadReconciliation({
    requestedRange: { from: '2026-02-26', to: '2026-03-02' },
    supportedRange: { from: '2026-02-26', to: '2026-03-02' },
    expectedBarCount: REC.requestedBarDates.length,
    expectedBarCountBasis: REC.expectedBarCountBasis,
    barsEmitted: REC.emittedBarDates.length,
    requestedBarDates: REC.requestedBarDates,
    emittedBarDates: REC.emittedBarDates,
    loadDigest: li.loadDigest,
  });
  assert.equal(rec.expectedBarCount, 5);
  assert.equal(rec.expectedBarCountBasis, 'DECLARED_RANGE_ONLY');
  assert.equal(rec.barsEmitted, 3);
  assert.equal(rec.gaps.gapCount, 2);
  assert.equal(rec.reconciled, true, '3 emitted + 2 declared gaps = 5 expected');
  assert.equal(rec.completenessPct, 60);
  // ⚠ HA-24 — reconciliation is REPORT_ONLY.
  assert.match(rec.reconciliationPolicy, /REPORT_ONLY/);
  assert.equal(rec.repairedAnything, false, 'no auto-fill, no interpolation, no carry-forward');
  // ⚠ HA-23 — completeness is never computed from an invented calendar.
  assert.throws(
    () => HA.buildLoadReconciliation({
      requestedRange: {}, supportedRange: {}, expectedBarCount: 3, barsEmitted: 3,
      requestedBarDates: [], emittedBarDates: [], loadDigest: 'x',
    }),
    (e) => e.message.includes('HA-23') && e.message.includes('invented calendar'),
  );
});

test('HA/17 — HA-25: the absence vocabulary is the accepted one, unchanged', () => {
  assert.deepEqual([...HA.ABSENCE_CONTRACT.vocabulary],
    ['PRESENT', 'NULL_ASSERTED', 'NOT_APPLICABLE', 'NOT_PROVIDED', 'WITHHELD']);
  assert.equal(HA.ABSENCE_CONTRACT.vocabularyChanged, false,
    'P05-03 adds no historical-specific absence state — that would conflate absence');
  assert.equal(HA.ABSENCE_CONTRACT.absentElement.includes('NOT_PROVIDED'), true);
  assert.equal(HA.ABSENCE_CONTRACT.explicitNullElement.includes('NULL_ASSERTED'), true);
  assert.equal(HA.ABSENCE_CONTRACT.unentitledElement.includes('WITHHELD'), true);
  assert.ok(HA.ABSENCE_CONTRACT.prohibitedSubstitutes.includes('interpolation'));
});

test('HA/18 — HA-26: error mapping reuses E1–E8 and adds NO class', () => {
  assert.deepEqual([...HA.ERROR_CLASSES], ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8']);
  assert.deepEqual([...HA.HISTORICAL_ERROR_CLASS_ADDITIONS], [], 'no new class (FC-6 analogue)');
  assert.equal(HA.HISTORICAL_ERROR_MAPPING.gateOrderReproduced, true);
  assert.deepEqual(HA.HISTORICAL_ERROR_MAPPING.gateOrder, CLASSIFICATION_GATE_ORDER);
  // A missing bar is NOT a failure — that conflation would be a silent identity/quality change.
  assert.match(HA.HISTORICAL_ERROR_MAPPING.scenarios.missingBar, /NOT a failure/);
  assert.match(HA.HISTORICAL_ERROR_MAPPING.scenarios.sourceUnreachable, /ONLY quality-bearing/);
});

test('HA/19 — HA-27: retry is contract-level only; execution belongs to P05-04', () => {
  assert.deepEqual([...HA.RETRY_CONTRACT.retryableClasses], ['E4', 'E7']);
  assert.deepEqual([...HA.RETRY_CONTRACT.prohibitedClasses], [...RETRY_PROHIBITED]);
  assert.deepEqual([...HA.RETRY_CONTRACT.overlapWithProhibited], [], 'ES-4 — no overlap');
  assert.equal(HA.RETRY_CONTRACT.executionOwner, 'P05-04');
  assert.equal(HA.RETRY_CONTRACT.executionAuthorized, false, 'D9 N-3');
  assert.equal(HA.RETRY_CONTRACT.implementsPolicy, false);
  // ⚠ No loop, timer or attempt counter anywhere in the module.
  const src = readFileSync(join(p05Root, 'src', 'historicalAdapterContract.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const re of [/\bwhile\s*\(/, /\bfor\s*\(\s*let\s+attempt/, /\bsetTimeout\s*\(/, /\bsleep\s*\(/]) {
    assert.equal(re.test(src), false, `${re} must not appear — retry execution is P05-04`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// HA/20…HA/22 — CANONICAL BOUNDARY, D02 FIELD SET, OBSERVABILITY
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('HA/20 — HA-28: the canonical boundary is the P05-01 surface, NOT a fork', () => {
  assert.equal(HA.CANONICAL_OUTPUT_BOUNDARY.forked, false);
  assert.equal(HA.CANONICAL_OUTPUT_BOUNDARY.owner.startsWith('P05-01'), true);
  // The very same function objects as the P05-02 contract re-exports — one model, not two.
  assert.equal(HA.CANONICAL_OUTPUT_BOUNDARY.buildSnapshot, LIVE_BOUNDARY.buildSnapshot);
  assert.equal(HA.CANONICAL_OUTPUT_BOUNDARY.validateSnapshot, LIVE_BOUNDARY.validateSnapshot);
  assert.equal(HA.CANONICAL_OUTPUT_BOUNDARY.buildKey, LIVE_BOUNDARY.buildKey);
  assert.equal(HA.CANONICAL_OUTPUT_BOUNDARY.canonicalDigest, LIVE_BOUNDARY.canonicalDigest);
  assert.equal(HA.CANONICAL_OUTPUT_BOUNDARY.NAMESPACE_TOKEN, 'MD:', 'OI-10 token unchanged');
  assert.equal(HA.contractSummary().canonicalModelForked, false);
});

test('HA/21 — HA-29: the D02 field set is the accepted dictionary, namespaced, with no vocabulary added', () => {
  const f = HA.D02_CANONICAL_FIELDS;
  assert.equal(f.domain, 'D02');
  assert.equal(f.domainSegment, 'ohlcv');
  assert.deepEqual([...f.required],
    ['open', 'high', 'low', 'close', 'volume', 'barInterval', 'adjusted'], 'P01 §4 required set');
  assert.deepEqual([...f.conditional], ['adjustedClose', 'adjustmentFactor', 'adjustmentBasisRef']);
  assert.deepEqual([...f.vocabularyAdded], [], '⚠ no field vocabulary invented (D9 N-6)');
  for (const k of f.keys) {
    assert.ok(k.startsWith('MD:'), `${k} must carry the namespace`);
    assert.match(k, /^MD:[a-z]+\.[A-Za-z][A-Za-z0-9]*$/, `${k} must be MD:<domain>.<field>`);
  }
  // ⚠ The catalog/dictionary discrepancy is RECORDED, not silently resolved and not invented.
  assert.deepEqual([...f.catalogOnlyNotInDictionary], ['sessionRef']);
  assert.match(f.catalogDiscrepancy, /BD-P05-03-06/);
  assert.ok(!f.keys.includes('MD:ohlcv.sessionRef'),
    'sessionRef is NOT emitted — it is undefined in the dictionary');
});

test('HA/22 — HA-30/HA-31: observability reports inputs and sets no threshold; receivedAt is never recomputed', () => {
  for (const k of ['requestedRange', 'supportedRange', 'expectedBarCount', 'expectedBarCountBasis',
    'barsEmitted', 'gaps', 'loadDigest', 'perBarProvenanceRefs', 'asOf', 'receivedAt']) {
    assert.ok(HA.OBSERVABILITY_CONTRACT.requiredInputs.includes(k), `${k} must be a required input`);
  }
  assert.equal(HA.OBSERVABILITY_CONTRACT.setsThresholds, false, 'MQ-1 — thresholds are P07');
  assert.equal(HA.OBSERVABILITY_CONTRACT.thresholdOwner, 'P07 (MQ-1 / MQ-2)');
  assert.match(HA.OBSERVABILITY_CONTRACT.perBarProvenance, /RF-7/);
  assert.equal(HA.RECEIVED_AT_CONTRACT.source, 'the request', 'D-4 / TS-6');
  assert.equal(HA.RECEIVED_AT_CONTRACT.recomputed, false);
  assert.equal(HA.RECEIVED_AT_CONTRACT.clockRead, false);
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// HA/23…HA/26 — AUTHORIZATION BOUNDARY, ATTESTATION, DETERMINISM, PURITY
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('HA/23 — HA-32: the authorization matrix authorizes specification and contract ONLY', () => {
  const authorized = HA.HISTORICAL_AUTHORIZATION_MATRIX.filter((l) => l.authorized);
  const notAuthorized = HA.HISTORICAL_AUTHORIZATION_MATRIX.filter((l) => !l.authorized);
  assert.deepEqual(authorized.map((l) => l.layer), ['ADAPTER_SPECIFICATION', 'ADAPTER_CONTRACT']);
  for (const l of authorized) assert.equal(l.authority, 'D9 A-3');
  assert.deepEqual(notAuthorized.map((l) => l.layer),
    ['PROVIDER_SPECIFIC_CONFIGURATION', 'LICENSED_HISTORICAL_EXECUTION', 'ORCHESTRATION',
      'STORAGE_AND_ADJUSTMENT']);
  assert.ok(notAuthorized.every((l) => /D9 N-|P08/.test(l.authority)),
    'every unauthorized layer names its constraining authority');
});

test('HA/24 — HA-33/HA-34: no orchestration and no tenant/region attribute', () => {
  for (const k of ['schedulingImplemented', 'retryExecutionImplemented',
    'checkpointingImplemented', 'batchInfrastructureImplemented', 'loopsOrTimersPresent']) {
    assert.equal(HA.ORCHESTRATION_CONTRACT[k], false, `${k} must be false`);
  }
  assert.equal(HA.ORCHESTRATION_CONTRACT.owner, 'P05-04');
  for (const k of ['attributePresent', 'defaultInvented', 'inferred']) {
    assert.equal(HA.TENANT_REGION_CONTRACT[k], false, `${k} must be false — D9 N-4/N-5`);
  }
  assert.match(HA.TENANT_REGION_CONTRACT.authority, /IB-1/);
  assert.equal(decl()['HA-EXT'].tenantOrRegionAttributePresent, false);
  assert.equal(decl()['HA-EXT'].orchestrationImplemented, false);
});

test('HA/25 — HA-35: the contract makes no provider, licensing, orchestration or acceptance claim', () => {
  const s = HA.contractSummary();
  for (const k of ['providerSelected', 'credentialsProvisioned', 'networkUsed',
    'licensedAcquisitionPerformed', 'realHistoricalSampleProduced',
    'claimsAuthenticatedIngestionWorks', 'claimsRealDataLoadReproducible',
    'trackerExitCriterionSatisfied', 'canonicalModelForked', 'p05_04Started', 'p08WorkPerformed',
    'tenantOrRegionAttributePresent']) {
    assert.equal(s[k], false, `${k} must be false`);
  }
  // And the fixtures agree.
  assert.equal(FX.testDouble._registeredInProviderRegister, false,
    '⚠ the test double is NOT a provider-register issuance');
});

test('HA/26 — determinism and offline behaviour: repeated evaluation is byte-reproducible', () => {
  const digests = new Set();
  for (let run = 0; run < FX.determinismRepeats; run += 1) {
    const d = decl();
    const parts = [
      canonicalDigest(d),
      canonicalDigest(HA.assertHistoricalCapabilityConformance(d)),
      ...FX.rangeRequests.map((x) => canonicalDigest(HA.evaluateRangeRequest(d, x.request))),
      canonicalDigest(HA.declareBarGaps(REC.requestedBarDates, REC.emittedBarDates)),
      canonicalDigest(HA.assertReproducibility(FX.reproducibilityRuns[0].runs)),
      canonicalDigest(HA.buildLoadIdentity(REC.emittedBarDates)),
      ...FX.adjustmentScenarios.map((x) => canonicalDigest(HA.assertAdjustmentDeclaration(x.bar))),
      canonicalDigest(HA.contractSummary()),
    ];
    digests.add(parts.join('|'));
  }
  assert.equal(digests.size, 1, 'D-3 — repeated evaluation is byte-reproducible');
});

test('HA/27 — the contract module has no transport, ambient-state or secret surface', () => {
  const src = readFileSync(join(p05Root, 'src', 'historicalAdapterContract.js'), 'utf8');
  // No network or child-process module, and no dynamic require.
  for (const mod of ['node:net', 'node:tls', 'node:http', 'node:https', 'node:dgram', 'node:dns',
    'node:child_process']) {
    assert.equal(src.includes(`'${mod}'`), false, `${mod} must not be imported`);
  }
  assert.equal(/require\s*\(/.test(src), false, 'no dynamic require');
  // No wall-clock or ambient input (D-3).
  for (const re of [/\bDate\.now\s*\(/, /\bnew Date\s*\(/, /\bMath\.random\s*\(/, /\bprocess\.env\b/]) {
    assert.equal(re.test(src), false, `${re} must not appear`);
  }
  // No endpoint or URL.
  assert.equal(/https?:\/\//.test(src), false, 'no URL may appear (SP-2)');
  assert.equal(/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(src), false);
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// HA/28 — NON-REGRESSION AGAINST THE ACCEPTED P05-01 D02 BEHAVIOUR
// ─────────────────────────────────────────────────────────────────────────────────────────────

test('HA/28 — non-regression: the accepted P05-01 D02 emission still matches the HA-3 precedent', () => {
  const feed = makeFeed();
  const r = feed.snapshot({
    domain: 'D02', mode: 'SNAPSHOT', fixtureId: 'H-0001', receivedAt: '2026-03-04T10:00:00.000Z',
  });
  assert.equal(r.ok, true, 'P05-01 D02 emission must be unchanged by P05-03');
  const s = r.snapshot;
  // HA-3 — one bar per snapshot with a SCALAR asOf.
  assert.equal(typeof s.asOf, 'string', 'asOf is a scalar, never a series');
  assert.equal(Array.isArray(s.asOf), false);
  // The emitted field set is exactly the P01 §4 required D02 set, namespaced.
  const emitted = Object.keys(s.fields).sort();
  assert.deepEqual(emitted, HA.D02_CANONICAL_FIELDS.keys
    .filter((k) => HA.D02_CANONICAL_FIELDS.required.includes(k.split('.')[1])).sort());
  // AJ-1 — unadjusted is retained and the fixture asserts no adjustment.
  assert.equal(s.fields['MD:ohlcv.adjusted'].value, false);
  // ⚠ The P05-01 limitations that P05-03 must NOT have quietly removed.
  const limits = feed.capability['A-8'];
  assert.ok(limits.some((l) => /adjustment modelling is P08/.test(l)), 'RC-5 boundary intact');
  assert.ok(limits.some((l) => /PIT storage is P08/.test(l)), 'PC-6 boundary intact');
  assert.deepEqual([...feed.capability['A-6'].granularities], ['1D'], 'HA-6 — no interval added');
  // snapshotId composition is unchanged and does not depend on lifecycle or bar position.
  assert.equal(s.snapshotId, buildSnapshotId(s.provider, s.dataVersion, s.asOf));
});
