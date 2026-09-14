import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBankingHarness } from './banking-helpers';
import { BANKING_ENGINE_ID } from '../../src/sector-engines/banking/BankingEngine';
import { BankingMetrics } from '../../src/sector-engines/banking/metrics/BankingMetrics';
import { BankingScoreEngine } from '../../src/sector-engines/banking/scoring/BankingScoreEngine';
import { loadBankingCalibration } from '../../src/sector-engines/banking/calibration/BankingCalibration';
import { BankingDecision } from '../../src/sector-engines/banking/decision/BankingDecision';
import { BankingEvidence } from '../../src/sector-engines/banking/evidence/BankingEvidence';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';
import { createClock } from '../../src/infrastructure/Clock';
import golden from '../../src/sector-engines/banking/frozen-assets/banking-golden-reference-1.0.0.json';
import expectedOutputs from '../../src/sector-engines/banking/frozen-assets/banking-expected-outputs-1.0.0.json';

type Bank = { id: string; name: string; category: string; inputs: Record<string, number> };

function runBank(inputs: Record<string, number>) {
  const h = buildBankingHarness();
  const r = h.plugins.execute(BANKING_ENGINE_ID, { requestId: 'req', inputs });
  return { h, r };
}

test('WP3-ACC1: every frozen golden bank reproduces the frozen expected output', () => {
  const banks = (golden as { banks: Bank[] }).banks;
  const expected = (expectedOutputs as { expected: { bankId: string; compositeScore: number; verdict: string }[] }).expected;

  for (const bank of banks) {
    const exp = expected.find((e) => e.bankId === bank.id);
    assert.ok(exp, `no expected output for ${bank.id}`);
    const { r } = runBank(bank.inputs);
    assert.equal(r?.metadata.verdict, exp.verdict, `verdict mismatch for ${bank.id}`);
    assert.equal(r?.metadata.composite, exp.compositeScore, `composite mismatch for ${bank.id}`);
  }
  console.log('WP3-ACC1 golden dataset reproducibility PASS');
});

test('WP3-ACC2: same dataset twice produces identical evidence + verdict (replay determinism)', () => {
  const banks = (golden as { banks: Bank[] }).banks;
  const first = banks.map((b) => runBank(b.inputs).r!);
  const second = banks.map((b) => runBank(b.inputs).r!);
  for (let i = 0; i < first.length; i++) {
    assert.equal(first[i].metadata.verdict, second[i].metadata.verdict);
    assert.equal(first[i].metadata.composite, second[i].metadata.composite);
    assert.equal(first[i].evidenceRef, second[i].evidenceRef);
  }
  console.log('WP3-ACC2 replay determinism PASS');
});

test('WP3-ACC3: changing calibration profile changes behavior without code changes', () => {
  // Same metrics, two different calibration profiles → different verdicts (proves calibration isolation).
  const calibration = loadBankingCalibration();
  const metrics = new BankingMetrics().evaluate({ 'BM-001': 1.6, 'BM-002': 15, 'BM-003': 3.9, 'BM-004': 46, 'BM-005': 1.4, 'BM-006': 0.5, 'BM-014': 14, 'BM-015': 17 });
  const score = new BankingScoreEngine().score(metrics);

  const frozenVerdict = new BankingDecision(calibration).decide({ composite: score.composite, assetQuality: score.pillars['asset-quality'], capitalStrength: score.pillars['capital-strength'], gnpa: metrics['BM-005'], confidence: 0.8 }).verdict;
  assert.equal(frozenVerdict, 'Buy');

  const strictCalibration = { ...calibration, verdictMapping: [{ minScore: 90, maxScore: 100, verdict: 'Strong Buy' }, { minScore: 0, maxScore: 90, verdict: 'Hold' }] };
  const strictVerdict = new BankingDecision(strictCalibration).decide({ composite: score.composite, assetQuality: score.pillars['asset-quality'], capitalStrength: score.pillars['capital-strength'], gnpa: metrics['BM-005'], confidence: 0.8 }).verdict;
  assert.equal(strictVerdict, 'Hold');

  assert.notEqual(frozenVerdict, strictVerdict);
  console.log('WP3-ACC3 calibration isolation PASS');
});

test('WP3-ACC4: every verdict is traceable Metric→Band→Score→Pillar→Composite→Verdict', () => {
  const h = buildBankingHarness();
  const metrics = new BankingMetrics().evaluate({ 'BM-001': 1.6, 'BM-002': 15, 'BM-003': 3.9, 'BM-004': 46, 'BM-005': 1.4, 'BM-006': 0.5, 'BM-014': 14, 'BM-015': 17 });
  const score = new BankingScoreEngine().score(metrics);
  const calibration = loadBankingCalibration();
  const decision = new BankingDecision(calibration).decide({ composite: score.composite, assetQuality: score.pillars['asset-quality'], capitalStrength: score.pillars['capital-strength'], gnpa: metrics['BM-005'], confidence: 0.8 });
  const evidence = new BankingEvidence(h.evidence).build({
    engineId: BANKING_ENGINE_ID, metrics, score, decision,
    calibrationVersion: calibration.version, snapshotId: 'snap', frameworkVersion: '1.0', methodologyVersion: 'IES-006 v1.0',
  });

  // Traceability chain captured in the evidence package:
  assert.equal(evidence.recommendation, 'Buy');                                   // Verdict
  assert.equal(evidence.compositeScore, 72.2);                                    // Composite
  assert.ok(evidence.supportingScores.length >= 7);                               // Pillars
  assert.ok(evidence.keyMetrics.length >= 6);                                     // Metrics
  assert.equal(evidence.calibrationVersion, '1.0.0');                             // Calibration
  assert.ok(Object.isFrozen(evidence));                                           // Immutable
  assert.equal(new EvidencePipeline(createClock('fixed')).validate(evidence), true); // evidence valid

  // Full chain is derivable: BM-001=1.6 → band 75 → profitability pillar → composite 72.2 → Buy.
  assert.equal(score.pillars['profitability'], 73.5);
  assert.equal(score.pillars['asset-quality'], 75);
  console.log('WP3-ACC4 evidence completeness PASS');
});
