import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildInsuranceHarness } from './insurance-helpers';
import { INSURANCE_ENGINE_ID } from '../../src/sector-engines/insurance/InsuranceEngine';
import { InsuranceMetrics } from '../../src/sector-engines/insurance/metrics/InsuranceMetrics';
import { InsuranceScoreEngine } from '../../src/sector-engines/insurance/scoring/InsuranceScoreEngine';
import { loadInsuranceCalibration } from '../../src/sector-engines/insurance/calibration/InsuranceCalibration';
import { InsuranceDecision } from '../../src/sector-engines/insurance/decision/InsuranceDecision';
import { InsuranceEvidence } from '../../src/sector-engines/insurance/evidence/InsuranceEvidence';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';
import { createClock } from '../../src/infrastructure/Clock';
import golden from '../../src/sector-engines/insurance/insurance-golden-reference-1.0.0.json';
import expected from '../../src/sector-engines/insurance/insurance-expected-outputs-1.0.0.json';

type Insurer = { id: string; name: string; category: string; inputs: Record<string, number> };

test('WP3-ACC1: every frozen golden insurer reproduces the frozen expected output', () => {
  const insurers = (golden as { insurers: Insurer[] }).insurers;
  const exp = (expected as { expected: { insurerId: string; compositeScore: number; verdict: string }[] }).expected;

  for (const ins of insurers) {
    const e = exp.find((x) => x.insurerId === ins.id);
    assert.ok(e, `no expected output for ${ins.id}`);
    const h = buildInsuranceHarness();
    const r = h.plugins.execute(INSURANCE_ENGINE_ID, { requestId: ins.id, inputs: ins.inputs });
    assert.equal(r?.metadata.verdict, e.verdict, `verdict mismatch for ${ins.id}`);
    assert.equal(r?.metadata.composite, e.compositeScore, `composite mismatch for ${ins.id}: got ${r?.metadata.composite}`);
  }
  console.log('WP3-ACC1 insurance golden dataset reproducibility PASS');
});

test('WP3-ACC2: same dataset twice produces identical evidence + verdict (replay determinism)', () => {
  const insurers = (golden as { insurers: Insurer[] }).insurers;
  const first = insurers.map((i) => buildInsuranceHarness().plugins.execute(INSURANCE_ENGINE_ID, { requestId: 'a', inputs: i.inputs }));
  const second = insurers.map((i) => buildInsuranceHarness().plugins.execute(INSURANCE_ENGINE_ID, { requestId: 'b', inputs: i.inputs }));
  for (let i = 0; i < first.length; i++) {
    assert.equal(first[i]?.metadata.verdict, second[i]?.metadata.verdict);
    assert.equal(first[i]?.metadata.composite, second[i]?.metadata.composite);
    assert.equal(first[i]?.evidenceRef, second[i]?.evidenceRef);
  }
  console.log('WP3-ACC2 insurance replay determinism PASS');
});

test('WP3-ACC3: changing calibration profile changes behavior without code changes (calibration isolation)', () => {
  const calibration = loadInsuranceCalibration();
  const metrics = new InsuranceMetrics().evaluate({ 'IM-001': 92, 'IM-002': 1.7, 'IM-003': 1800, 'IM-004': 300, 'IM-005': 88, 'IM-006': 5000, 'IM-007': 16, 'IM-008': 7.2 });
  const score = new InsuranceScoreEngine().score(metrics);
  const base = new InsuranceDecision(calibration).decide({ composite: score.composite, combinedRatio: metrics['IM-001'], solvency: score.pillars.solvency, solvencyRatio: metrics['IM-002'], persistency: metrics['IM-005'], confidence: 0.8 }).verdict;
  assert.equal(base, 'Buy');

  const strictCal = { ...calibration, verdictMapping: [{ minScore: 90, maxScore: 100, verdict: 'Strong Buy' }, { minScore: 0, maxScore: 90, verdict: 'Hold' }] };
  const strict = new InsuranceDecision(strictCal).decide({ composite: score.composite, combinedRatio: metrics['IM-001'], solvency: score.pillars.solvency, solvencyRatio: metrics['IM-002'], persistency: metrics['IM-005'], confidence: 0.8 }).verdict;
  assert.equal(strict, 'Hold');
  assert.notEqual(base, strict);
  console.log('WP3-ACC3 insurance calibration isolation PASS');
});

test('WP3-ACC4: every verdict traceable Metric→Band→Score→Pillar→Composite→Verdict', () => {
  const h = buildInsuranceHarness();
  const metrics = new InsuranceMetrics().evaluate({ 'IM-001': 92, 'IM-002': 1.7, 'IM-003': 1800, 'IM-004': 300, 'IM-005': 88, 'IM-006': 5000, 'IM-007': 16, 'IM-008': 7.2 });
  const score = new InsuranceScoreEngine().score(metrics);
  const calibration = loadInsuranceCalibration();
  const decision = new InsuranceDecision(calibration).decide({ composite: score.composite, combinedRatio: metrics['IM-001'], solvency: score.pillars.solvency, solvencyRatio: metrics['IM-002'], persistency: metrics['IM-005'], confidence: 0.8 });
  const evidence = new InsuranceEvidence(h.evidence).build({
    engineId: INSURANCE_ENGINE_ID, metrics, score, decision,
    calibrationVersion: calibration.version, snapshotId: 'snap', frameworkVersion: '1.0', methodologyVersion: 'IES-007 v1.0',
  });

  assert.equal(evidence.recommendation, 'Buy');
  assert.equal(evidence.compositeScore, 72.3);
  assert.ok(evidence.supportingScores.length >= 5);
  assert.ok(evidence.keyMetrics.length >= 6);
  assert.equal(evidence.calibrationVersion, '1.0.0');
  assert.equal(new EvidencePipeline(createClock('fixed')).validate(evidence), true);
  console.log('WP3-ACC4 insurance evidence completeness PASS');
});
