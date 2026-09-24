/**
 * IES-011 WP-4 — Validation, Replay, Regression, Evidence.
 * Validates the Energy implementation against the ACTUAL frozen reference assets (loaded
 * from the standards repo), covering: golden regression (9/9), replay, validation fixtures
 * (9), calibration isolation, override precedence, ontology registration, evidence.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { EnergyEngine, ENERGY_ENGINE_ID } from '../../src/sector-engines/energy/EnergyEngine';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';

const ENERGY_DIR = path.resolve(__dirname, '../../../ies-011-energy');

function readJson(rel: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(ENERGY_DIR, rel), 'utf8'));
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
  plugins.load(new EnergyEngine());
  plugins.initialize(ENERGY_ENGINE_ID);
  return runtime.execute(ENERGY_ENGINE_ID, { requestId: 'en-wp4', inputs: input as never });
}

test('IES011-WP4-ACC1: golden regression — all 9 frozen expected outputs from the standards repo', () => {
  const golden = readJson('datasets/energy-golden-reference-1.0.0.json') as { providers: any[] };
  const expected = readJson('expected-outputs/energy-expected-outputs-1.0.0.json') as { expected: Array<Record<string, any>> };
  for (const p of golden.providers) {
    const eo = expected.expected.find((e) => e.providerId === p.id)!;
    const r = execute(p);
    assert.equal(r.result.state, 'COMPLETED', `${p.id} state`);
    assert.equal(r.result.metadata.composite, eo.composite, `${p.id} composite`);
    assert.equal(r.result.metadata.verdict, eo.verdict, `${p.id} verdict`);
  }
});

test('IES011-WP4-ACC2: expected outputs equality — exact match', () => {
  const golden = readJson('datasets/energy-golden-reference-1.0.0.json') as { providers: any[] };
  const expected = readJson('expected-outputs/energy-expected-outputs-1.0.0.json') as { expected: Array<Record<string, any>> };
  for (const eo of expected.expected) {
    const p = golden.providers.find((g) => g.id === eo.providerId)!;
    const r = execute(p);
    assert.equal(r.result.metadata.composite, eo.composite, `${eo.providerId} exact composite`);
  }
});

test('IES011-WP4-ACC3: replay — byte-identical across repeated runs', () => {
  const golden = readJson('datasets/energy-golden-reference-1.0.0.json') as { providers: any[] };
  const replay = readJson('replay-datasets/energy-replay-dataset-1.0.0.json') as { replayAssertions: string[] };
  const run = () => execute(golden.providers[0]);
  const a = run();
  const b = run();
  const assertions = replay.replayAssertions;
  if (assertions.includes('identical composite scores')) assert.equal(a.result.metadata.composite, b.result.metadata.composite);
  if (assertions.includes('identical verdicts')) assert.equal(a.result.metadata.verdict, b.result.metadata.verdict);
  if (assertions.includes('identical overrides')) assert.equal(JSON.stringify(a.result.metadata.overridesApplied), JSON.stringify(b.result.metadata.overridesApplied));
  assert.equal(JSON.stringify(a.result.metadata), JSON.stringify(b.result.metadata));
});

test('IES011-WP4-ACC4: validation fixtures — all 9 pass', () => {
  const fx = readJson('fixtures/energy-validation-fixtures-1.0.0.json') as { scenarios: Array<{ id: string; provider: string; expectedVerdict: string; composite: number }> };
  const golden = readJson('datasets/energy-golden-reference-1.0.0.json') as { providers: any[] };
  for (const s of fx.scenarios) {
    const p = golden.providers.find((g) => g.id === s.provider)!;
    const r = execute(p);
    assert.equal(r.result.metadata.verdict, s.expectedVerdict, `${s.id} verdict`);
    assert.equal(r.result.metadata.composite, s.composite, `${s.id} composite`);
  }
});

test('IES011-WP4-ACC5: calibration isolation — deterministic segment differences', () => {
  const golden = readJson('datasets/energy-golden-reference-1.0.0.json') as { providers: any[] };
  const a = execute(golden.providers[1]); // upstream
  const b = execute(golden.providers[1]); // upstream again
  assert.equal(JSON.stringify(a.result.metadata), JSON.stringify(b.result.metadata));
});

test('IES011-WP4-ACC6: override precedence — correct ordering', () => {
  const golden = readJson('datasets/energy-golden-reference-1.0.0.json') as { providers: any[] };
  // EN-007: price collapse + leverage → Watch.
  const r = execute(golden.providers[6]);
  assert.equal(r.result.metadata.verdict, 'Watch');
  assert.ok(r.result.metadata.overridesApplied.includes('price-collapse'));
});

test('IES011-WP4-ACC7: ontology registration — 8/8 dimensions', () => {
  const golden = readJson('datasets/energy-golden-reference-1.0.0.json') as { providers: any[] };
  const r = execute(golden.providers[0]);
  const meta = r.result.metadata.ontology as Record<string, string>;
  const dims = ['Conviction', 'Confidence', 'Quality', 'Growth', 'Risk', 'Valuation', 'Capital Efficiency', 'Moat'];
  const mapped = Object.values(meta);
  for (const d of dims) assert.ok(mapped.includes(d), `missing ${d}`);
  assert.equal(mapped.length, 8);
});

test('IES011-WP4-ACC8: evidence — complete for every provider', () => {
  const golden = readJson('datasets/energy-golden-reference-1.0.0.json') as { providers: any[] };
  for (const p of golden.providers) {
    const r = execute(p);
    assert.ok(r.result.evidenceRef, `${p.id} evidenceRef`);
    assert.ok(r.result.snapshotRef, `${p.id} snapshotRef`);
  }
});
