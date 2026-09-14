/**
 * IES-009 WP-4 - Validation, Replay, Regression, Evidence (Healthcare).
 * Tier-2 regression evidence (A2->A1). Validates the Healthcare implementation against the
 * ACTUAL frozen reference assets bundled with the engine, covering: golden regression
 * (7/7 incl. pillar reproduction), replay determinism, validation fixtures (7/7 within
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
import { HealthcareEngine, HEALTHCARE_ENGINE_ID } from '../../src/sector-engines/healthcare/HealthcareEngine';
import { HealthcareMetrics } from '../../src/sector-engines/healthcare/metrics/HealthcareMetrics';
import { HealthcareScoreEngine } from '../../src/sector-engines/healthcare/scoring/HealthcareScoreEngine';
import { loadHealthcareCalibration } from '../../src/sector-engines/healthcare/calibration/HealthcareCalibration';
import { HealthcareDecision } from '../../src/sector-engines/healthcare/decision/HealthcareDecision';
import { HealthcareEvidence } from '../../src/sector-engines/healthcare/evidence/HealthcareEvidence';
import golden from '../../src/sector-engines/healthcare/healthcare-golden-reference-1.0.0.json';
import expectedOutputs from '../../src/sector-engines/healthcare/healthcare-expected-outputs-1.0.0.json';
import fixtures from '../../src/sector-engines/healthcare/healthcare-validation-fixtures-1.0.0.json';
import calibrationJson from '../../src/sector-engines/healthcare/healthcare-calibration-1.0.0.json';

type Inputs = Record<string, number | string | null | undefined>;
type Entity = { id: string; name: string; category: string; inputs: Inputs };
type Expected = { providerId: string; pillars: Record<string, number>; compositeScore: number; verdict: string; confidence: number };
type Fixture = { id: string; name: string; inputs: Inputs; expectedOutcome: string };

const GOLDEN = (golden as unknown as { providers: Entity[] }).providers;
const EXPECTED = (expectedOutputs as unknown as { expected: Expected[] }).expected;
const FIXTURES = (fixtures as unknown as { scenarios: Fixture[] }).scenarios;

/** Verdict ladder (weak -> strong); overrides may only move a verdict DOWN this ladder. */
const LADDER = ['Avoid', 'Watch', 'Hold', 'Accumulate', 'Buy', 'Strong Buy'];
const rank = (v: string) => LADDER.indexOf(v);

/** Frozen fixture acceptance oracle (IES-009 WP-4 Validation Fixture Acceptance Report). */
const FIXTURE_ORACLE: Record<string, { verdict: string; composite: number; overrides: string[]; cap?: string }> = {
  'FIX-HC-01': { verdict: 'Buy', composite: 75.5, overrides: [] },
  'FIX-HC-02': { verdict: 'Avoid', composite: 53.8, overrides: ['clinical-quality-failure'], cap: 'Avoid' },
  'FIX-HC-03': { verdict: 'Watch', composite: 71, overrides: ['regulatory-action'], cap: 'Watch' },
  'FIX-HC-04': { verdict: 'Watch', composite: 61, overrides: ['occupancy-collapse'], cap: 'Watch' },
  'FIX-HC-05': { verdict: 'Accumulate', composite: 77.8, overrides: ['pipeline-failure'], cap: 'Accumulate' },
  'FIX-HC-06': { verdict: 'Accumulate', composite: 65, overrides: [] },
  'FIX-HC-07': { verdict: 'Buy', composite: 74.8, overrides: [] },
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
  h.plugins.load(new HealthcareEngine());
  h.plugins.initialize(HEALTHCARE_ENGINE_ID);
  const r = h.runtime.execute(HEALTHCARE_ENGINE_ID, { requestId: 'hc-wp4', inputs: inputs as never });
  return { ...h, r };
}

/** Re-derive the decision through the frozen component chain (Metric -> Score -> Decision). */
function decide(inputs: Inputs) {
  const calibration = loadHealthcareCalibration();
  const metrics = new HealthcareMetrics().evaluate(inputs as never);
  const score = new HealthcareScoreEngine().score(metrics, (inputs as { qualityFlag?: string }).qualityFlag === 'FAIL');
  const decision = new HealthcareDecision(calibration).decide({ composite: score.composite, clinicalQualityFail: (inputs as { qualityFlag?: string }).qualityFlag === 'FAIL', occupancy: metrics['HC-001'], regulatoryFlag: (inputs as { regulatoryFlag?: string }).regulatoryFlag, pipelineFlag: (inputs as { pipelineFlag?: string }).pipelineFlag, confidence: 0.8 });
  return { calibration, metrics, score, decision };
}

test('IES009-WP4-ACC1: golden regression - all 7 frozen expected outputs reproduce (verdict + composite + pillars)', () => {
  assert.equal(GOLDEN.length, 7);
  assert.equal(EXPECTED.length, 7);
  for (const e of GOLDEN) {
    const eo = EXPECTED.find((x) => x.providerId === e.id);
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

test('IES009-WP4-ACC2: replay - identical verdict, composite, evidenceRef, snapshotRef and snapshot payload across repeated runs', () => {
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

test('IES009-WP4-ACC3: validation fixtures - all 7 frozen scenarios deterministic and within expected caps', () => {
  assert.equal(FIXTURES.length, 7);
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

test('IES009-WP4-ACC4: calibration integrity - frozen profile is immutable, bound to the engine, and structurally sound', () => {
  const calibration = loadHealthcareCalibration();
  const raw = calibrationJson as unknown as {
    profileId: string; version: string; engineId: string; sectorFamily: string; immutable: boolean;
    scoreWeights: { scoreId: string; weight: number }[];
    verdictMapping: { minScore: number; maxScore: number; verdict: string }[];
    overrideRules: { rule: string; description: string }[];
  };
  assert.equal(calibration.version, '1.0.0');
  assert.equal(calibration.engineId, HEALTHCARE_ENGINE_ID);
  assert.equal(calibration.profileId, 'healthcare-calibration');
  assert.equal(raw.engineId, HEALTHCARE_ENGINE_ID);
  assert.equal(raw.sectorFamily, 'Healthcare');
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
  assert.deepEqual(calibration.overrideRules.map((r) => r.rule), ['clinical-quality-failure', 'regulatory-action', 'occupancy-collapse', 'pipeline-failure']);
  assert.deepEqual(raw.overrideRules.map((r) => r.rule), ['clinical-quality-failure', 'regulatory-action', 'occupancy-collapse', 'pipeline-failure']);

  // Calibration isolation: a different profile changes behaviour without code changes.
  const { score } = decide(GOLDEN.find((g) => g.id === 'HC-001')!.inputs);
  const strict = { ...calibration, verdictMapping: [{ minScore: 90, maxScore: 100, verdict: 'Strong Buy' }, { minScore: 0, maxScore: 90, verdict: 'Hold' }] };
  const strictVerdict = new HealthcareDecision(strict).decide({ composite: score.composite, clinicalQualityFail: false, occupancy: decide(GOLDEN.find((g) => g.id === 'HC-001')!.inputs).metrics['HC-001'], regulatoryFlag: undefined, pipelineFlag: undefined, confidence: 0.8 }).verdict;
  assert.equal(strictVerdict, 'Hold');
  assert.notEqual(strictVerdict, 'Buy');
});

test('IES009-WP4-ACC5: override precedence - deterministic min-rank capping, never upgrades, no double-application', () => {
  const calibration = loadHealthcareCalibration();
  const decision = new HealthcareDecision(calibration);
  // regulatory-action (Watch) then clinical-quality-failure (Avoid) - precedence chain ends at Avoid
  const p1 = decision.decide({ composite: 75.5, clinicalQualityFail: true, occupancy: 85, regulatoryFlag: 'ACTION', confidence: 0.8 });
  assert.equal(p1.verdict, 'Avoid');
  assert.deepEqual([...p1.overridesApplied], ['regulatory-action', 'clinical-quality-failure']);
  // occupancy-collapse caps at Watch (occupancy < 50) from a Buy-band composite
  const p2 = decision.decide({ composite: 72.0, clinicalQualityFail: false, occupancy: 45, confidence: 0.8 });
  assert.equal(p2.verdict, 'Watch');
  assert.deepEqual([...p2.overridesApplied], ['occupancy-collapse']);
  // pipeline-failure reduces to Accumulate only; does not re-apply below an existing Watch cap
  const p3 = decision.decide({ composite: 78.0, clinicalQualityFail: false, occupancy: 45, pipelineFlag: 'FAIL', confidence: 0.8 });
  assert.equal(p3.verdict, 'Watch');
  assert.deepEqual([...p3.overridesApplied], ['occupancy-collapse']);
  // Overrides never upgrade: every fixture verdict is <= its calibration band verdict.
  for (const f of FIXTURES) {
    const { score, decision: d } = decide(f.inputs);
    const band = [...calibration.verdictMapping].find((b) => score.composite >= b.minScore && score.composite <= b.maxScore);
    assert.ok(band, `${f.id} band`);
    assert.ok(rank(d.verdict) <= rank(band.verdict), `${f.id} override must not upgrade (${band.verdict} -> ${d.verdict})`);
    if (d.overridesApplied.length === 0) assert.equal(d.verdict, band.verdict, `${f.id} no-override => band verdict`);
  }
});

test('IES009-WP4-ACC6: evidence - complete, immutable, traceable for every golden provider and fixture', () => {
  const pipeline = new EvidencePipeline(createClock('fixed'));
  for (const e of [...GOLDEN, ...FIXTURES.map((f) => ({ id: f.id, name: f.name, category: 'fixture', inputs: f.inputs }))]) {
    const { r, evidence } = execute(e.inputs);
    assert.ok(r.result.evidenceRef, `${e.id} evidenceRef`);
    assert.ok(r.result.snapshotRef, `${e.id} snapshotRef`);
    assert.equal(r.result.metadata.evidenceId, r.result.evidenceRef, `${e.id} evidenceId parity`);

    const { calibration, metrics, score, decision } = decide(e.inputs);
    const pkg = new HealthcareEvidence(evidence).build({
      engineId: HEALTHCARE_ENGINE_ID, metrics, score, decision,
      calibrationVersion: calibration.version, snapshotId: r.result.snapshotRef as string,
      frameworkVersion: '1.0', methodologyVersion: 'IES-009 v1.0',
    });
    assert.equal(pkg.evidenceId, r.result.evidenceRef, `${e.id} evidence package id parity`);
    assert.equal(pipeline.validate(pkg), true, `${e.id} evidence valid`);
    assert.equal(Object.isFrozen(pkg), true, `${e.id} evidence frozen`);
    assert.equal(pkg.engineId, HEALTHCARE_ENGINE_ID);
    assert.equal(pkg.recommendation, r.result.metadata.verdict, `${e.id} recommendation`);
    assert.equal(pkg.compositeScore, r.result.metadata.composite, `${e.id} composite`);
    assert.equal(pkg.calibrationVersion, '1.0.0');
    assert.equal(pkg.replayReference, r.result.snapshotRef);
    assert.equal(pkg.provenance.methodologyVersion, 'IES-009 v1.0');
    assert.equal(pkg.provenance.snapshotId, r.result.snapshotRef);
    assert.equal(pkg.supportingScores.length, 5, `${e.id} pillars in evidence`);
    assert.equal(pkg.keyMetrics.length, Object.keys(metrics).length, `${e.id} metrics in evidence`);
    assert.deepEqual([...pkg.decisionRulesApplied], [...decision.overridesApplied], `${e.id} decision rules traceable`);
  }
  // Spot-check of the traceability chain against a frozen golden provider.
  const { score, decision } = decide(GOLDEN.find((g) => g.id === 'HC-001')!.inputs);
  assert.equal(score.pillars['utilization'], 90);
  assert.equal(score.composite, 75.5);
  assert.equal(decision.verdict, 'Buy');
});
