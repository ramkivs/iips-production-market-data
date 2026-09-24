import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QualificationService } from './QualificationService';

const service = new QualificationService();

test('qualification passes when all gates pass', () => {
  const r = service.qualify({ engineId: 'sector.banking', certified: true, replayVerified: true, regressionPassed: true, deterministic: true });
  assert.equal(r.qualified, true);
  assert.equal(r.gates.length, 4);
});

test('qualification fails when a gate fails', () => {
  const r = service.qualify({ engineId: 'sector.banking', certified: false, replayVerified: true, regressionPassed: true, deterministic: true });
  assert.equal(r.qualified, false);
  assert.equal(r.reason, 'Gated: certified');
});
