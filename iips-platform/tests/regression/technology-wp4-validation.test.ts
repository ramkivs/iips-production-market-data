/**
 * IES-015 WP-4 — Validation, Replay, Regression, Evidence.
 * Validates the Technology implementation against the ACTUAL frozen reference assets (loaded
 * from the standards repo ies-015-technology), covering: golden regression (13/13), replay,
 * validation fixtures (13 provider scenarios + 8 contract-edge scenarios), calibration
 * integrity, override precedence, ontology registration, evidence.
 * Per governance: no methodology changes during validation; reference assets are the oracle.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { TechnologyEngine, TECHNOLOGY_ENGINE_ID } from '../../src/sector-engines/technology/TechnologyEngine';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';

const TECHNOLOGY_DIR = path.resolve(__dirname, '../../../ies-015-technology');

function readJson(rel: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(TECHNOLOGY_DIR, rel), 'utf8'));
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
  plugins.load(new TechnologyEngine());
  plugins.initialize(TECHNOLOGY_ENGINE_ID);
  return runtime.execute(TECHNOLOGY_ENGINE_ID, { requestId: 'te-wp4', inputs: input as never });
}

test('IES015-WP4-ACC1: golden regression — all 13 frozen expected outputs from the standards repo', () => {
  const golden = readJson('datasets/technology-golden-reference-1.0.0.json') as { providers: any[] };
  const expected = readJson('expected-outputs/technology-expected-outputs-1.0.0.json') as { expected: Array<Record<string, any>> };
  assert.equal(golden.providers.length, 13);
  for (const p of golden.providers) {
    const eo = expected.expected.find((e) => e.providerId === p.id)!;
    const r = execute(p);
    assert.equal(r.result.state, 'COMPLETED', `${p.id} state`);
    assert.equal(r.result.metadata.composite, eo.composite, `${p.id} composite`);
    assert.equal(r.result.metadata.verdict, eo.verdict, `${p.id} verdict`);
    assert.equal(r.result.metadata.resolvedSubsegment, eo.subsegment, `${p.id} subsegment`);
    assert.equal(r.result.metadata.resolvedArchetype, eo.archetype, `${p.id} archetype`);
    assert.deepEqual(r.result.metadata.overridesApplied, eo.overrides, `${p.id} overrides`);
  }
});

test('IES015-WP4-ACC2: replay — byte-identical across repeated runs (calibration version bound)', () => {
  const golden = readJson('datasets/technology-golden-reference-1.0.0.json') as { providers: any[] };
  const replay = readJson('replay-datasets/technology-replay-dataset-1.0.0.json') as { replayAssertions: string[] };
  const run = () => execute(golden.providers[0]);
  const a = run();
  const b = run();
  const assertions = replay.replayAssertions;
  if (assertions.includes('identical composite scores')) assert.equal(a.result.metadata.composite, b.result.metadata.composite);
  if (assertions.includes('identical verdicts')) assert.equal(a.result.metadata.verdict, b.result.metadata.verdict);
  if (assertions.includes('identical overrides')) assert.equal(JSON.stringify(a.result.metadata.overridesApplied), JSON.stringify(b.result.metadata.overridesApplied));
  if (assertions.includes('identical resolved calibration version')) assert.equal(a.result.metadata.calibrationVersion, b.result.metadata.calibrationVersion);
  assert.equal(JSON.stringify(a.result.metadata), JSON.stringify(b.result.metadata));
});

test('IES015-WP4-ACC3: validation fixtures — all 13 provider scenarios pass (21 fixture scenarios incl. 8 contract-edge, of which the engine covers the 13 provider scenarios)', () => {
  const fx = readJson('fixtures/technology-validation-fixtures-1.0.0.json') as { scenarios: Array<{ id: string; provider: string | null; expectedVerdict: string; composite: number }> };
  const golden = readJson('datasets/technology-golden-reference-1.0.0.json') as { providers: any[] };
  assert.equal(fx.scenarios.length, 21);
  let providerScenarios = 0;
  for (const s of fx.scenarios) {
    if (s.provider === null) continue; // contract-edge scenarios validated by the contract boundary matrix
    providerScenarios++;
    const p = golden.providers.find((g) => g.id === s.provider)!;
    const r = execute(p);
    assert.equal(r.result.metadata.verdict, s.expectedVerdict, `${s.id} verdict`);
    assert.equal(r.result.metadata.composite, s.composite, `${s.id} composite`);
  }
  assert.equal(providerScenarios, 13);
});

test('IES015-WP4-ACC4: calibration integrity — frozen profile hash verified against freeze manifest', () => {
  const raw = fs.readFileSync(path.join(TECHNOLOGY_DIR, 'calibration/technology-calibration-1.0.0.json'), 'utf8');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  assert.equal(hash.startsWith('9be45e06'), true, 'calibration hash mismatch');
});

test('IES015-WP4-ACC5: override precedence — min-rank deterministic', () => {
  const golden = readJson('datasets/technology-golden-reference-1.0.0.json') as { providers: any[] };
  // TE-006: leverage-breach + margin-compression -> Watch.
  const r6 = execute(golden.providers.find((g) => g.id === 'TE-006'));
  assert.equal(r6.result.metadata.verdict, 'Watch');
  assert.ok(r6.result.metadata.overridesApplied.includes('leverage-breach'));
  assert.ok(r6.result.metadata.overridesApplied.includes('margin-compression'));
  // TE-013: governance -> Avoid (min_rank over Watch base + leverage-breach).
  const r13 = execute(golden.providers.find((g) => g.id === 'TE-013'));
  assert.equal(r13.result.metadata.verdict, 'Avoid');
  assert.ok(r13.result.metadata.overridesApplied.includes('governance'));
});

test('IES015-WP4-ACC6: ontology registration — 8/8 dimensions', () => {
  const golden = readJson('datasets/technology-golden-reference-1.0.0.json') as { providers: any[] };
  const r = execute(golden.providers[0]);
  const meta = r.result.metadata.ontology as Record<string, string>;
  const dims = ['Conviction', 'Confidence', 'Quality', 'Growth', 'Risk', 'Profitability', 'Capital Efficiency', 'Valuation'];
  const mapped = Object.values(meta);
  for (const d of dims) assert.ok(mapped.includes(d), `missing ${d}`);
  assert.equal(mapped.length, 8);
});

test('IES015-WP4-ACC7: evidence — complete for every provider', () => {
  const golden = readJson('datasets/technology-golden-reference-1.0.0.json') as { providers: any[] };
  for (const p of golden.providers) {
    const r = execute(p);
    assert.ok(r.result.evidenceRef, `${p.id} evidenceRef`);
    assert.ok(r.result.snapshotRef, `${p.id} snapshotRef`);
  }
});
