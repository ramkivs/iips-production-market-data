import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DiagnosticsService } from './DiagnosticsService';

test('diagnostics captures observational snapshots', () => {
  const d = new DiagnosticsService();
  d.capture({ engineId: 'sector.banking', executionDurationMs: 5, registryVersions: { metric: '1.0' }, replayStatus: 'ok', transportStatus: 'ok', pluginPhase: 'Execution' });
  assert.equal(d.list().length, 1);
  assert.equal(d.list()[0].engineId, 'sector.banking');
  d.clear();
  assert.equal(d.list().length, 0);
});
