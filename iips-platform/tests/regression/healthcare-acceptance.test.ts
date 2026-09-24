import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildHealthcareHarness } from './healthcare-helpers';
import { HEALTHCARE_ENGINE_ID } from '../../src/sector-engines/healthcare/HealthcareEngine';
import { HealthcareMetrics } from '../../src/sector-engines/healthcare/metrics/HealthcareMetrics';
import { HealthcareScoreEngine } from '../../src/sector-engines/healthcare/scoring/HealthcareScoreEngine';
import { loadHealthcareCalibration } from '../../src/sector-engines/healthcare/calibration/HealthcareCalibration';
import { HealthcareDecision } from '../../src/sector-engines/healthcare/decision/HealthcareDecision';
import { HealthcareEvidence } from '../../src/sector-engines/healthcare/evidence/HealthcareEvidence';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';
import { createClock } from '../../src/infrastructure/Clock';
import golden from '../../src/sector-engines/healthcare/healthcare-golden-reference-1.0.0.json';
import expected from '../../src/sector-engines/healthcare/healthcare-expected-outputs-1.0.0.json';

type Provider = { id: string; category: string; inputs: Record<string, number> & { qualityFlag?: string } };

test('WP3-ACC1: every frozen golden provider reproduces the frozen expected output', () => {
  const prov = (golden as { providers: Provider[] }).providers;
  const exp = (expected as { expected: { providerId: string; compositeScore: number; verdict: string }[] }).expected;
  for (const p of prov) {
    const e = exp.find((x) => x.providerId === p.id);
    assert.ok(e, `no expected for ${p.id}`);
    const h = buildHealthcareHarness();
    const r = h.plugins.execute(HEALTHCARE_ENGINE_ID, { requestId: p.id, inputs: p.inputs });
    assert.equal(r?.metadata.verdict, e.verdict, `verdict mismatch ${p.id}`);
    assert.equal(r?.metadata.composite, e.compositeScore, `composite mismatch ${p.id}: got ${r?.metadata.composite}`);
  }
  console.log('WP3-ACC1 healthcare golden reproducibility PASS');
});

test('WP3-ACC2: same dataset twice produces identical evidence + verdict (replay determinism)', () => {
  const prov = (golden as { providers: Provider[] }).providers;
  const first = prov.map((p) => buildHealthcareHarness().plugins.execute(HEALTHCARE_ENGINE_ID, { requestId: 'a', inputs: p.inputs }));
  const second = prov.map((p) => buildHealthcareHarness().plugins.execute(HEALTHCARE_ENGINE_ID, { requestId: 'b', inputs: p.inputs }));
  for (let i = 0; i < first.length; i++) {
    assert.equal(first[i]?.metadata.verdict, second[i]?.metadata.verdict);
    assert.equal(first[i]?.metadata.composite, second[i]?.metadata.composite);
    assert.equal(first[i]?.evidenceRef, second[i]?.evidenceRef);
  }
  console.log('WP3-ACC2 healthcare replay determinism PASS');
});

test('WP3-ACC3: changing calibration profile changes behavior without code changes', () => {
  const calibration = loadHealthcareCalibration();
  const metrics = new HealthcareMetrics().evaluate({ 'HC-001': 85, 'HC-004': 28, 'HC-005': 15, 'HC-007': 45 });
  const score = new HealthcareScoreEngine().score(metrics, false);
  const base = new HealthcareDecision(calibration).decide({ composite: score.composite, clinicalQualityFail: false, occupancy: metrics['HC-001'], confidence: 0.8 }).verdict;
  assert.equal(base, 'Buy');
  const strict = { ...calibration, verdictMapping: [{ minScore: 90, maxScore: 100, verdict: 'Strong Buy' }, { minScore: 0, maxScore: 90, verdict: 'Hold' }] };
  const sv = new HealthcareDecision(strict).decide({ composite: score.composite, clinicalQualityFail: false, occupancy: metrics['HC-001'], confidence: 0.8 }).verdict;
  assert.equal(sv, 'Hold');
  assert.notEqual(base, sv);
  console.log('WP3-ACC3 healthcare calibration isolation PASS');
});

test('WP3-ACC4: every verdict traceable + clinical-quality constraint applied', () => {
  const h = buildHealthcareHarness();
  const metrics = new HealthcareMetrics().evaluate({ 'HC-001': 85, 'HC-004': 28, 'HC-005': 15, 'HC-007': 45 });
  const score = new HealthcareScoreEngine().score(metrics, false);
  const calibration = loadHealthcareCalibration();
  const decision = new HealthcareDecision(calibration).decide({ composite: score.composite, clinicalQualityFail: false, occupancy: metrics['HC-001'], confidence: 0.8 });
  const evidence = new HealthcareEvidence(h.evidence).build({
    engineId: HEALTHCARE_ENGINE_ID, metrics, score, decision,
    calibrationVersion: calibration.version, snapshotId: 'snap', frameworkVersion: '1.0', methodologyVersion: 'IES-009 v1.0',
  });
  assert.equal(evidence.recommendation, 'Buy');
  assert.equal(evidence.compositeScore, 75.5);
  assert.ok(evidence.supportingScores.length >= 5);
  assert.equal(new EvidencePipeline(createClock('fixed')).validate(evidence), true);

  // Clinical-quality constraint: HC-007 inputs with qualityFlag FAIL → Avoid despite composite 53 (would be Hold)
  const h2 = buildHealthcareHarness();
  const hc007 = (golden as { providers: Provider[] }).providers.find((p) => p.id === 'HC-007')!;
  const r = h2.plugins.execute(HEALTHCARE_ENGINE_ID, { requestId: 'hc007', inputs: hc007.inputs });
  assert.equal(r?.metadata.verdict, 'Avoid');
  console.log('WP3-ACC4 healthcare evidence + clinical-quality constraint PASS');
});
