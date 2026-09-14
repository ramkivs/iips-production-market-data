/**
 * IES-014 WP-4 — Validation, Replay, Regression, Evidence.
 * Validates the Industrials implementation against the ACTUAL frozen reference assets (loaded
 * from the standards repo), covering: golden regression (10/10), replay, validation fixtures
 * (10), calibration integrity, override precedence, ontology registration, evidence.
 * Per governance: no methodology changes during validation; reference assets are the oracle.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { IndustrialsEngine, INDUSTRIALS_ENGINE_ID } from '../../src/sector-engines/industrials/IndustrialsEngine';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';

const INDUSTRIALS_DIR = path.resolve(__dirname, '../../../ies-014-industrials');

function readJson(rel: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(INDUSTRIALS_DIR, rel), 'utf8'));
}

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
  return { plugins, runtime, store, replay };
}

function execute(input: Record<string, unknown>) {
  const { plugins, runtime } = makeRuntime();
  plugins.load(new IndustrialsEngine());
  plugins.initialize(INDUSTRIALS_ENGINE_ID);
  return runtime.execute(INDUSTRIALS_ENGINE_ID, { requestId: 'in-wp4', inputs: input as never });
}

test('IES014-WP4-ACC1: golden regression — all 10 frozen expected outputs from the standards repo', () => {
  const golden = readJson('datasets/industrials-golden-reference-1.0.0.json') as { providers: any[] };
  const expected = readJson('expected-outputs/industrials-expected-outputs-1.0.0.json') as { expected: Array<Record<string, any>> };
  for (const p of golden.providers) {
    const eo = expected.expected.find((e) => e.providerId === p.id)!;
    const r = execute(p);
    assert.equal(r.result.state, 'COMPLETED', `${p.id} state`);
    assert.equal(r.result.metadata.composite, eo.composite, `${p.id} composite`);
    assert.equal(r.result.metadata.verdict, eo.verdict, `${p.id} verdict`);
  }
});

test('IES014-WP4-ACC2: replay — byte-identical across repeated runs', () => {
  const golden = readJson('datasets/industrials-golden-reference-1.0.0.json') as { providers: any[] };
  const replay = readJson('replay-datasets/industrials-replay-dataset-1.0.0.json') as { replayAssertions: string[] };
  const run = () => execute(golden.providers[0]);
  const a = run();
  const b = run();
  const assertions = replay.replayAssertions;
  if (assertions.includes('identical composite scores')) assert.equal(a.result.metadata.composite, b.result.metadata.composite);
  if (assertions.includes('identical verdicts')) assert.equal(a.result.metadata.verdict, b.result.metadata.verdict);
  if (assertions.includes('identical overrides')) assert.equal(JSON.stringify(a.result.metadata.overridesApplied), JSON.stringify(b.result.metadata.overridesApplied));
  assert.equal(JSON.stringify(a.result.metadata), JSON.stringify(b.result.metadata));
});

test('IES014-WP4-ACC3: validation fixtures — all 10 pass', () => {
  const fx = readJson('fixtures/industrials-validation-fixtures-1.0.0.json') as { scenarios: Array<{ id: string; provider: string; expectedVerdict: string; composite: number }> };
  const golden = readJson('datasets/industrials-golden-reference-1.0.0.json') as { providers: any[] };
  for (const s of fx.scenarios) {
    const p = golden.providers.find((g) => g.id === s.provider)!;
    const r = execute(p);
    assert.equal(r.result.metadata.verdict, s.expectedVerdict, `${s.id} verdict`);
    assert.equal(r.result.metadata.composite, s.composite, `${s.id} composite`);
  }
});

test('IES014-WP4-ACC4: calibration integrity — frozen profile hash verified', () => {
  const raw = fs.readFileSync(path.join(INDUSTRIALS_DIR, 'calibration/industrials-calibration-1.0.0.json'), 'utf8');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  // Verify against the freeze-manifest hash (abaa02d0...).
  assert.equal(hash.startsWith('abaa02d0'), true, 'calibration hash mismatch');
});

test('IES014-WP4-ACC5: override precedence — all override paths', () => {
  const golden = readJson('datasets/industrials-golden-reference-1.0.0.json') as { providers: any[] };
  const overrides = [
    [6, 'order-cancellation'], [7, 'defense-program'], [8, 'epc-overrun'], [9, 'margin-compression'],
  ] as const;
  for (const [idx, ovr] of overrides) {
    const r = execute(golden.providers[idx]);
    assert.ok(r.result.metadata.overridesApplied.includes(ovr), `expected ${ovr}`);
  }
  // IN-010 also triggers leverage breach (debtEbitda 4.0 >= capital-goods alert 3.5).
  const r10 = execute(golden.providers[9]);
  assert.ok(r10.result.metadata.overridesApplied.includes('leverage-breach'));
});

test('IES014-WP4-ACC6: ontology registration — 8/8 dimensions', () => {
  const golden = readJson('datasets/industrials-golden-reference-1.0.0.json') as { providers: any[] };
  const r = execute(golden.providers[0]);
  const meta = r.result.metadata.ontology as Record<string, string>;
  const dims = ['Conviction', 'Confidence', 'Quality', 'Growth', 'Risk', 'Valuation', 'Capital Efficiency', 'Moat'];
  const mapped = Object.values(meta);
  for (const d of dims) assert.ok(mapped.includes(d), `missing ${d}`);
  assert.equal(mapped.length, 8);
});

test('IES014-WP4-ACC7: evidence — complete for every provider', () => {
  const golden = readJson('datasets/industrials-golden-reference-1.0.0.json') as { providers: any[] };
  for (const p of golden.providers) {
    const r = execute(p);
    assert.ok(r.result.evidenceRef, `${p.id} evidenceRef`);
    assert.ok(r.result.snapshotRef, `${p.id} snapshotRef`);
  }
});
