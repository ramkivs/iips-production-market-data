import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCapitalMarketsHarness } from './capital-markets-helpers';
import { CAPITAL_MARKETS_ENGINE_ID } from '../../src/sector-engines/capital-markets/CapitalMarketsEngine';
import { CapitalMarketsMetrics } from '../../src/sector-engines/capital-markets/metrics/CapitalMarketsMetrics';
import { CapitalMarketsScoreEngine } from '../../src/sector-engines/capital-markets/scoring/CapitalMarketsScoreEngine';
import { loadCapitalMarketsCalibration } from '../../src/sector-engines/capital-markets/calibration/CapitalMarketsCalibration';
import { CapitalMarketsDecision } from '../../src/sector-engines/capital-markets/decision/CapitalMarketsDecision';
import { CapitalMarketsEvidence } from '../../src/sector-engines/capital-markets/evidence/CapitalMarketsEvidence';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';
import { createClock } from '../../src/infrastructure/Clock';
import golden from '../../src/sector-engines/capital-markets/capital-markets-golden-reference-1.0.0.json';
import expected from '../../src/sector-engines/capital-markets/capital-markets-expected-outputs-1.0.0.json';

type Firm = { id: string; category: string; inputs: Record<string, number> };

test('WP3-ACC1: every frozen golden firm reproduces the frozen expected output', () => {
  const firms = (golden as { firms: Firm[] }).firms;
  const exp = (expected as { expected: { firmId: string; compositeScore: number; verdict: string }[] }).expected;
  for (const f of firms) {
    const e = exp.find((x) => x.firmId === f.id);
    assert.ok(e, `no expected for ${f.id}`);
    const h = buildCapitalMarketsHarness();
    const r = h.plugins.execute(CAPITAL_MARKETS_ENGINE_ID, { requestId: f.id, inputs: f.inputs });
    assert.equal(r?.metadata.verdict, e.verdict, `verdict mismatch ${f.id}`);
    assert.equal(r?.metadata.composite, e.compositeScore, `composite mismatch ${f.id}: got ${r?.metadata.composite}`);
  }
  console.log('WP3-ACC1 capital markets golden reproducibility PASS');
});

test('WP3-ACC2: same dataset twice produces identical evidence + verdict (replay determinism)', () => {
  const firms = (golden as { firms: Firm[] }).firms;
  const first = firms.map((f) => buildCapitalMarketsHarness().plugins.execute(CAPITAL_MARKETS_ENGINE_ID, { requestId: 'a', inputs: f.inputs }));
  const second = firms.map((f) => buildCapitalMarketsHarness().plugins.execute(CAPITAL_MARKETS_ENGINE_ID, { requestId: 'b', inputs: f.inputs }));
  for (let i = 0; i < first.length; i++) {
    assert.equal(first[i]?.metadata.verdict, second[i]?.metadata.verdict);
    assert.equal(first[i]?.metadata.composite, second[i]?.metadata.composite);
    assert.equal(first[i]?.evidenceRef, second[i]?.evidenceRef);
  }
  console.log('WP3-ACC2 capital markets replay determinism PASS');
});

test('WP3-ACC3: changing calibration profile changes behavior without code changes', () => {
  const calibration = loadCapitalMarketsCalibration();
  const metrics = new CapitalMarketsMetrics().evaluate({ 'CM-001': 5000, 'CM-002': 22, 'CM-004': 45, 'CM-005': 85, 'CM-006': 12 });
  const score = new CapitalMarketsScoreEngine().score(metrics);
  const base = new CapitalMarketsDecision(calibration).decide({ composite: score.composite, costToIncome: metrics['CM-004'], confidence: 0.8 }).verdict;
  assert.equal(base, 'Strong Buy');
  const strict = { ...calibration, verdictMapping: [{ minScore: 90, maxScore: 100, verdict: 'Strong Buy' }, { minScore: 0, maxScore: 90, verdict: 'Hold' }] };
  const strictVerdict = new CapitalMarketsDecision(strict).decide({ composite: score.composite, costToIncome: metrics['CM-004'], confidence: 0.8 }).verdict;
  assert.equal(strictVerdict, 'Hold');
  assert.notEqual(base, strictVerdict);
  console.log('WP3-ACC3 capital markets calibration isolation PASS');
});

test('WP3-ACC4: every verdict traceable Metric→Band→Score→Pillar→Composite→Verdict', () => {
  const h = buildCapitalMarketsHarness();
  const metrics = new CapitalMarketsMetrics().evaluate({ 'CM-001': 5000, 'CM-002': 22, 'CM-004': 45, 'CM-005': 85, 'CM-006': 12 });
  const score = new CapitalMarketsScoreEngine().score(metrics);
  const calibration = loadCapitalMarketsCalibration();
  const decision = new CapitalMarketsDecision(calibration).decide({ composite: score.composite, costToIncome: metrics['CM-004'], confidence: 0.8 });
  const evidence = new CapitalMarketsEvidence(h.evidence).build({
    engineId: CAPITAL_MARKETS_ENGINE_ID, metrics, score, decision,
    calibrationVersion: calibration.version, snapshotId: 'snap', frameworkVersion: '1.0', methodologyVersion: 'IES-008 v1.0',
  });
  assert.equal(evidence.recommendation, 'Strong Buy');
  assert.equal(evidence.compositeScore, 84.6);
  assert.ok(evidence.supportingScores.length >= 5);
  assert.ok(evidence.keyMetrics.length >= 5);
  assert.equal(new EvidencePipeline(createClock('fixed')).validate(evidence), true);
  console.log('WP3-ACC4 capital markets evidence completeness PASS');
});
