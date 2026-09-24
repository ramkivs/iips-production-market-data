import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EvidencePipeline } from './EvidencePipeline';
import { createClock } from '../../infrastructure/Clock';

const clock = createClock('fixed');
const pipeline = new EvidencePipeline(clock);

function baseInput(engineId: string) {
  return {
    engineId,
    recommendation: 'Buy',
    compositeScore: 72.2,
    confidence: 0.8,
    keyMetrics: [{ id: 'M1', name: 'Metric1', value: 1.5 }],
    supportingScores: [{ id: 'S1', name: 'Score1', value: 80 }],
    calibrationVersion: '1.0.0',
    decisionRulesApplied: ['rule-1'],
    replayReference: 'snap-ref',
    provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: 'v1', snapshotId: 's1' },
  };
}

test('evidence pipeline builds immutable package', () => {
  const pkg = pipeline.build(baseInput('sector.banking'));
  assert.equal(pkg.engineId, 'sector.banking');
  assert.equal(Object.isFrozen(pkg), true);
  assert.equal(pkg.recommendation, 'Buy');
  assert.equal(pipeline.validate(pkg), true);
});

test('evidence pipeline validates failure for malformed package', () => {
  const pkg = pipeline.build(baseInput('sector.banking'));
  const bad = { ...pkg, compositeScore: 'high' as unknown as number };
  assert.equal(pipeline.validate(bad), false);
});
