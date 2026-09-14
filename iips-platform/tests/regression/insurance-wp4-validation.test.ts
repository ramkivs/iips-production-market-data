/**
 * IES-007 WP-4 - Validation, Replay, Regression, Evidence (Insurance).
 * Tier-2 regression evidence (A2->A1). Validates the Insurance implementation against the
 * ACTUAL frozen reference assets bundled with the engine, covering: golden regression
 * (5/5 incl. pillar reproduction), replay determinism, validation fixtures (8/8 within
 * frozen caps), calibration integrity, override precedence, evidence completeness.
 * Per governance: no methodology changes during validation; reference assets are the oracle.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';
import { InsuranceEngine, INSURANCE_ENGINE_ID } from '../../src/sector-engines/insurance/InsuranceEngine';
import { InsuranceMetrics } from '../../src/sector-engines/insurance/metrics/InsuranceMetrics';
import { InsuranceScoreEngine } from '../../src/sector-engines/insurance/scoring/InsuranceScoreEngine';
import { loadInsuranceCalibration } from '../../src/sector-engines/insurance/calibration/InsuranceCalibration';
import { InsuranceDecision } from '../../src/sector-engines/insurance/decision/InsuranceDecision';
import { InsuranceEvidence } from '../../src/sector-engines/insurance/evidence/InsuranceEvidence';
import golden from '../../src/sector-engines/insurance/insurance-golden-reference-1.0.0.json';
import expectedOutputs from '../../src/sector-engines/insurance/insurance-expected-outputs-1.0.0.json';
import fixtures from '../../src/sector-engines/insurance/insurance-validation-fixtures-1.0.0.json';
import calibrationJson from '../../src/sector-engines/insurance/insurance-calibration-1.0.0.json';

type Inputs = Record<string, number | string | null | undefined>;
type Entity = { id: string; name: string; category: string; inputs: Inputs };
type Expected = { insurerId: string; pillars: Record<string, number>; compositeScore: number; verdict: string; confidence: number };
type Fixture = { id: string; name: string; inputs: Inputs; expectedOutcome: string };

const GOLDEN = (golden as unknown as { insurers: Entity[] }).insurers;
const EXPECTED = (expectedOutputs as unknown as { expected: Expected[] }).expected;
const FIXTURES = (fixtures as unknown as { scenarios: Fixture[] }).scenarios;

/** Verdict ladder (weak -> strong); overrides may only move a verdict DOWN this ladder. */
const LADDER = ['Avoid', 'Watch', 'Hold', 'Accumulate', 'Buy', 'Strong Buy'];
const rank = (v: string) => LADDER.indexOf(v);

/** Frozen fixture acceptance oracle (IES-007 WP-4 Validation Fixture Acceptance Report). */
const FIXTURE_ORACLE: Record<string, { verdict: string; composite: number; overrides: string[]; cap?: string }> = {
  'FIX-I-01': { verdict: 'Buy', composite: 72.6, overrides: [] },
  'FIX-I-02': { verdict: 'Watch', composite: 60.6, overrides: ['critical-combined-ratio'], cap: 'Watch' },
  'FIX-I-03': { verdict: 'Watch', composite: 63.3, overrides: ['solvency-breach'], cap: 'Watch' },
  'FIX-I-04': { verdict: 'Accumulate', composite: 68.1, overrides: [] },
  'FIX-I-05': { verdict: 'Accumulate', composite: 64.7, overrides: [], cap: 'Accumulate' },
  'FIX-I-06': { verdict: 'Accumulate', composite: 65.1, overrides: [] },
  'FIX-I-07': { verdict: 'Avoid', composite: 82, overrides: ['governance-failure'], cap: 'Avoid' },
  'FIX-I-08': { verdict: 'Watch', composite: 42.8, overrides: [], cap: 'Hold' },
};

function makeRuntime() {
  const clock = createClock('fixed');
  const id = createIdProvider('deterministic');
  const evidence = new EvidencePipeline(clock);
  const container = new Container({ clock, idProvider: id, evidenceService: evidence });
  const plugins = new PluginLoader(container);
  const snap = new SnapshotService(clock, id);
  const store = new SnapshotStore();
  const replay = new ReplayService(store);
  const runtime = new RuntimeCoordinator(container, plugins, snap, store, replay);
  container.register('runtimeCoordinator', runtime);
  return { plugins, runtime, store, replay, evidence };
}

function execute(inputs: Inputs) {
  const h = makeRuntime();
  h.plugins.load(new InsuranceEngine());
  h.plugins.initialize(INSURANCE_ENGINE_ID);
  const r = h.runtime.execute(INSURANCE_ENGINE_ID, { requestId: 'in-wp4', inputs: inputs as never });
  return { ...h, r };
}

/** Re-derive the decision through the frozen component chain (Metric -> Score -> Decision). */
function decide(inputs: Inputs) {
  const calibration = loadInsuranceCalibration();
  const metrics = new InsuranceMetrics().evaluate(inputs as never);
  const score = new InsuranceScoreEngine().score(metrics);
  const decision = new InsuranceDecision(calibration).decide({ composite: score.composite, combinedRatio: metrics['IM-001'], solvency: score.pillars.solvency, solvencyRatio: metrics['IM-002'], persistency: metrics['IM-005'], governanceFlag: (inputs as { governanceFlag?: string }).governanceFlag, catastropheFlag: (inputs as { catastropheFlag?: string }).catastropheFlag, confidence: 0.8 });
  return { calibration, metrics, score, decision };
}

test('IES007-WP4-ACC1: golden regression - all 5 frozen expected outputs reproduce (verdict + composite + pillars)', () => {
  assert.equal(GOLDEN.length, 5);
  assert.equal(EXPECTED.length, 5);
  for (const e of GOLDEN) {
    const eo = EXPECTED.find((x) => x.insurerId === e.id);
    assert.ok(eo, `no expected output for ${e.id}`);
    const { r, store } = execute(e.inputs);
    assert.equal(r.result.state, 'COMPLETED', `${e.id} state`);
    assert.equal(r.result.metadata.composite, eo.compositeScore, `${e.id} composite`);
    assert.equal(r.result.metadata.verdict, eo.verdict, `${e.id} verdict`);
    const snap = store.get(r.result.snapshotRef as string);
    assert.ok(snap, `${e.id} snapshot`);
    for (const [pillar, value] of Object.entries(eo.pillars)) {
      assert.equal(snap.scores[pillar], value, `${e.id} pillar ${pillar}`);
    }
    assert.equal(Object.keys(snap.scores).length, Object.keys(eo.pillars).length, `${e.id} pillar count`);
  }
});

test('IES007-WP4-ACC2: replay - identical verdict, composite, evidenceRef, snapshotRef and snapshot payload across repeated runs', () => {
  for (const e of GOLDEN) {
    const a = execute(e.inputs);
    const b = execute(e.inputs);
    assert.equal(a.r.result.metadata.verdict, b.r.result.metadata.verdict, `${e.id} verdict`);
    assert.equal(a.r.result.metadata.composite, b.r.result.metadata.composite, `${e.id} composite`);
    assert.equal(a.r.result.evidenceRef, b.r.result.evidenceRef, `${e.id} evidenceRef`);
    assert.equal(a.r.result.snapshotRef, b.r.result.snapshotRef, `${e.id} snapshotRef`);
    assert.equal(JSON.stringify(a.r.result.metadata), JSON.stringify(b.r.result.metadata), `${e.id} metadata`);
    const sa = a.store.get(a.r.result.snapshotRef as string);
    const sb = b.store.get(b.r.result.snapshotRef as string);
    assert.equal(JSON.stringify(sa), JSON.stringify(sb), `${e.id} snapshot payload`);
    const rr = a.replay.replay(a.r.result.snapshotRef as string);
    assert.equal(rr?.reproduced, true, `${e.id} replay reproduced`);
    assert.equal(rr?.byteIdentical, true, `${e.id} replay byte-identical`);
  }
});

test('IES007-WP4-ACC3: validation fixtures - all 8 frozen scenarios deterministic and within expected caps', () => {
  assert.equal(FIXTURES.length, 8);
  for (const f of FIXTURES) {
    const oracle = FIXTURE_ORACLE[f.id];
    assert.ok(oracle, `no oracle for ${f.id}`);
    const first = execute(f.inputs).r;
    const second = execute(f.inputs).r;
    assert.equal(first.result.state, 'COMPLETED', `${f.id} state`);
    assert.equal(first.result.metadata.verdict, oracle.verdict, `${f.id} (${f.name}) verdict`);
    assert.equal(first.result.metadata.composite, oracle.composite, `${f.id} (${f.name}) composite`);
    assert.equal(JSON.stringify(first.result.metadata), JSON.stringify(second.result.metadata), `${f.id} determinism`);
    if (oracle.cap) {
      assert.ok(rank(first.result.metadata.verdict as string) <= rank(oracle.cap), `${f.id} must not exceed ${oracle.cap}`);
    }
    const { decision } = decide(f.inputs);
    assert.equal(decision.verdict, first.result.metadata.verdict, `${f.id} component-chain verdict parity`);
    assert.deepEqual([...decision.overridesApplied], oracle.overrides, `${f.id} overrides applied`);
  }
});

test('IES007-WP4-ACC4: calibration integrity - frozen profile is immutable, bound to the engine, and structurally sound', () => {
  const calibration = loadInsuranceCalibration();
  const raw = calibrationJson as unknown as {
    profileId: string; version: string; engineId: string; sectorFamily: string; immutable: boolean;
    scoreWeights: { scoreId: string; weight: number }[];
    verdictMapping: { minScore: number; maxScore: number; verdict: string }[];
    overrideRules: { rule: string; description: string }[];
  };
  assert.equal(calibration.version, '1.0.0');
  assert.equal(calibration.engineId, INSURANCE_ENGINE_ID);
  assert.equal(calibration.profileId, 'insurance-calibration');
  assert.equal(raw.engineId, INSURANCE_ENGINE_ID);
  assert.equal(raw.sectorFamily, 'Insurance');
  assert.equal(raw.immutable, true);
  assert.equal(Object.isFrozen(calibration), true);
  assert.equal(Object.isFrozen(calibration.verdictMapping), true);
  assert.equal(Object.isFrozen(calibration.overrideRules), true);
  try { (calibration as { version: string }).version = '9.9.9'; } catch { /* strict-mode TypeError is acceptable */ }
  assert.equal(calibration.version, '1.0.0', 'frozen calibration must reject mutation');

  // Score weights: 5 pillars summing to 1.0.
  assert.equal(raw.scoreWeights.length, 5);
  const weightSum = raw.scoreWeights.reduce((a, w) => a + w.weight, 0);
  assert.ok(Math.abs(weightSum - 1) < 1e-9, `score weights must sum to 1 (got ${weightSum})`);

  // Verdict bands: six contiguous bands covering 0..100 with a known ladder.
  const bands = [...calibration.verdictMapping].sort((a, b) => a.minScore - b.minScore);
  assert.equal(bands.length, 6);
  assert.equal(bands[0].minScore, 0);
  assert.equal(bands[bands.length - 1].maxScore, 100);
  for (let i = 1; i < bands.length; i++) assert.equal(bands[i].minScore, bands[i - 1].maxScore, `band ${i} contiguity`);
  assert.deepEqual(bands.map((b) => b.verdict), LADDER);

  // Override rules: exactly the frozen rule set (order preserved).
  assert.deepEqual(calibration.overrideRules.map((r) => r.rule), ['solvency-breach', 'critical-combined-ratio', 'governance-failure', 'catastrophic-claims', 'persistency-deterioration']);
  assert.deepEqual(raw.overrideRules.map((r) => r.rule), ['solvency-breach', 'critical-combined-ratio', 'governance-failure', 'catastrophic-claims', 'persistency-deterioration']);

  // Calibration isolation: a different profile changes behaviour without code changes.
  const { score } = decide(GOLDEN.find((g) => g.id === 'IN-001')!.inputs);
  const strict = { ...calibration, verdictMapping: [{ minScore: 90, maxScore: 100, verdict: 'Strong Buy' }, { minScore: 0, maxScore: 90, verdict: 'Hold' }] };
  const strictVerdict = new InsuranceDecision(strict).decide({ composite: score.composite, combinedRatio: decide(GOLDEN.find((g) => g.id === 'IN-001')!.inputs).metrics['IM-001'], solvency: score.pillars.solvency, solvencyRatio: decide(GOLDEN.find((g) => g.id === 'IN-001')!.inputs).metrics['IM-002'], persistency: decide(GOLDEN.find((g) => g.id === 'IN-001')!.inputs).metrics['IM-005'], governanceFlag: undefined, catastropheFlag: undefined, confidence: 0.8 }).verdict;
  assert.equal(strictVerdict, 'Hold');
  assert.notEqual(strictVerdict, 'Buy');
});

test('IES007-WP4-ACC5: override precedence - deterministic min-rank capping, never upgrades, no double-application', () => {
  const calibration = loadInsuranceCalibration();
  const decision = new InsuranceDecision(calibration);
  // governance-failure (Avoid) dominates critical-combined-ratio (Watch) - min-rank, deterministic
  const p1 = decision.decide({ composite: 82.0, combinedRatio: 108, solvency: 90, solvencyRatio: 2.0, persistency: 90, governanceFlag: 'SEVERE_GOVERNANCE_FAILURE', confidence: 0.8 });
  assert.equal(p1.verdict, 'Avoid');
  assert.deepEqual([...p1.overridesApplied], ['critical-combined-ratio', 'governance-failure']);
  // solvency-breach caps at Watch (raw solvency ratio < 1.25) from a Buy-band composite
  const p2 = decision.decide({ composite: 72.0, combinedRatio: 92, solvency: 40, solvencyRatio: 1.1, persistency: 84, confidence: 0.8 });
  assert.equal(p2.verdict, 'Watch');
  assert.deepEqual([...p2.overridesApplied], ['solvency-breach']);
  // catastrophic-claims (Hold) then persistency-deterioration (Accumulate) - lower cap wins, weaker cap not re-applied
  const p3 = decision.decide({ composite: 85.0, combinedRatio: 92, solvency: 90, solvencyRatio: 2.0, persistency: 62, catastropheFlag: 'YES', confidence: 0.8 });
  assert.equal(p3.verdict, 'Hold');
  assert.deepEqual([...p3.overridesApplied], ['catastrophic-claims']);
  // Overrides never upgrade: every fixture verdict is <= its calibration band verdict.
  for (const f of FIXTURES) {
    const { score, decision: d } = decide(f.inputs);
    const band = [...calibration.verdictMapping].find((b) => score.composite >= b.minScore && score.composite <= b.maxScore);
    assert.ok(band, `${f.id} band`);
    assert.ok(rank(d.verdict) <= rank(band.verdict), `${f.id} override must not upgrade (${band.verdict} -> ${d.verdict})`);
    if (d.overridesApplied.length === 0) assert.equal(d.verdict, band.verdict, `${f.id} no-override => band verdict`);
  }
});

test('IES007-WP4-ACC6: evidence - complete, immutable, traceable for every golden insurer and fixture', () => {
  const pipeline = new EvidencePipeline(createClock('fixed'));
  for (const e of [...GOLDEN, ...FIXTURES.map((f) => ({ id: f.id, name: f.name, category: 'fixture', inputs: f.inputs }))]) {
    const { r, evidence } = execute(e.inputs);
    assert.ok(r.result.evidenceRef, `${e.id} evidenceRef`);
    assert.ok(r.result.snapshotRef, `${e.id} snapshotRef`);
    assert.equal(r.result.metadata.evidenceId, r.result.evidenceRef, `${e.id} evidenceId parity`);

    const { calibration, metrics, score, decision } = decide(e.inputs);
    const pkg = new InsuranceEvidence(evidence).build({
      engineId: INSURANCE_ENGINE_ID, metrics, score, decision,
      calibrationVersion: calibration.version, snapshotId: r.result.snapshotRef as string,
      frameworkVersion: '1.0', methodologyVersion: 'IES-007 v1.0',
    });
    assert.equal(pkg.evidenceId, r.result.evidenceRef, `${e.id} evidence package id parity`);
    assert.equal(pipeline.validate(pkg), true, `${e.id} evidence valid`);
    assert.equal(Object.isFrozen(pkg), true, `${e.id} evidence frozen`);
    assert.equal(pkg.engineId, INSURANCE_ENGINE_ID);
    assert.equal(pkg.recommendation, r.result.metadata.verdict, `${e.id} recommendation`);
    assert.equal(pkg.compositeScore, r.result.metadata.composite, `${e.id} composite`);
    assert.equal(pkg.calibrationVersion, '1.0.0');
    assert.equal(pkg.replayReference, r.result.snapshotRef);
    assert.equal(pkg.provenance.methodologyVersion, 'IES-007 v1.0');
    assert.equal(pkg.provenance.snapshotId, r.result.snapshotRef);
    assert.equal(pkg.supportingScores.length, 5, `${e.id} pillars in evidence`);
    assert.equal(pkg.keyMetrics.length, Object.keys(metrics).length, `${e.id} metrics in evidence`);
    assert.deepEqual([...pkg.decisionRulesApplied], [...decision.overridesApplied], `${e.id} decision rules traceable`);
  }
  // Spot-check of the traceability chain against a frozen golden insurer.
  const { score, decision } = decide(GOLDEN.find((g) => g.id === 'IN-001')!.inputs);
  assert.equal(score.pillars['solvency'], 75);
  assert.equal(score.composite, 72.3);
  assert.equal(decision.verdict, 'Buy');
});
