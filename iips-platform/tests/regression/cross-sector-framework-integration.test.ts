/**
 * CSIP WP-2 — Framework Integration.
 * Proves CSIP integrates through all shared framework services unchanged (manifest,
 * evidence, transport, diagnostics, qualification, activation, replay), coexists as a
 * fifth plugin with the four immutable sector engines, and preserves replay determinism.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container } from '../../src/di/Container';
import { createClock } from '../../src/infrastructure/Clock';
import { createIdProvider } from '../../src/infrastructure/IdProvider';
import { PluginLoader } from '../../src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../src/snapshot/SnapshotService';
import { SnapshotStore } from '../../src/snapshot/SnapshotStore';
import { ReplayService } from '../../src/replay/ReplayService';
import { RuntimeCoordinator } from '../../src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../src/framework/evidence/EvidencePipeline';
import { ManifestLoader } from '../../src/framework/manifest/ManifestLoader';
import { Transport } from '../../src/framework/transport/Transport';
import { DiagnosticsService } from '../../src/framework/diagnostics/DiagnosticsService';
import { QualificationService } from '../../src/framework/qualification/QualificationService';
import { ActivationService } from '../../src/framework/activation/ActivationService';
import { CrossSectorPlugin, CROSS_SECTOR_PLUGIN_ID } from '../../src/sector-engines/cross-sector/CrossSectorPlugin';
import { BankingEngine, BANKING_ENGINE_ID } from '../../src/sector-engines/banking/BankingEngine';
import { InsuranceEngine, INSURANCE_ENGINE_ID } from '../../src/sector-engines/insurance/InsuranceEngine';
import { CapitalMarketsEngine, CAPITAL_MARKETS_ENGINE_ID } from '../../src/sector-engines/capital-markets/CapitalMarketsEngine';
import { HealthcareEngine, HEALTHCARE_ENGINE_ID } from '../../src/sector-engines/healthcare/HealthcareEngine';

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
  return { plugins, runtime, clock, evidence, store, replay };
}

const FOUR_SECTOR_PORTFOLIO = [
  { companyId: 'BK-002', sector: 'Banking', conviction: 72, confidence: 0.8, quality: 78, risk: 25, verdict: 'Buy' },
  { companyId: 'IN-001', sector: 'Insurance', conviction: 72, confidence: 0.8, quality: 75, risk: 20, verdict: 'Accumulate' },
  { companyId: 'CM-005', sector: 'Capital Markets', conviction: 82, confidence: 0.8, quality: 80, risk: 30, verdict: 'Buy' },
  { companyId: 'HC-006', sector: 'Healthcare', conviction: 82, confidence: 0.8, quality: 80, risk: 35, verdict: 'Strong Buy' },
];

test('WP2-ACC1: CSIP manifest via shared ManifestLoader', () => {
  const plugin = new CrossSectorPlugin();
  const m = new ManifestLoader().load(plugin.manifest);
  assert.equal(m.engineId, CROSS_SECTOR_PLUGIN_ID);
  assert.equal(Object.isFrozen(m), true);
  assert.ok(m.capabilities.includes('portfolio-intelligence'));
  assert.ok(m.capabilities.includes('reporting'));
});

test('WP2-ACC2: CSIP portfolio evidence via shared EvidencePipeline', () => {
  const { evidence } = makeRuntime();
  const pkg = evidence.build({
    engineId: CROSS_SECTOR_PLUGIN_ID, recommendation: 'PORTFOLIO_SUMMARY', compositeScore: 77, confidence: 1,
    supportingScores: [{ id: 'concentration', name: 'Concentration', value: 25 }],
    calibrationVersion: 'csip-1.0.0', replayReference: 'snap',
    provenance: { frameworkVersion: '1.0', engineVersion: '1.0.0', methodologyVersion: 'CSIP v1.0', snapshotId: 's1' },
  });
  assert.equal(evidence.validate(pkg), true);
});

test('WP2-ACC3: CSIP portfolio transport via shared generic DTO', () => {
  const { clock } = makeRuntime();
  const t = new Transport(clock);
  const dto = t.build(CROSS_SECTOR_PLUGIN_ID, [
    { sectorId: 'PF-05', sectorFamily: 'Cross-Sector', companyName: 'Balanced Portfolio', metrics: { holdings: 4 }, scores: { concentration: 25, diversification: 84 }, verdict: 'PORTFOLIO_SUMMARY' },
  ]);
  assert.equal(t.validate(dto), true);
  assert.equal(t.serialize(dto), t.serialize(dto));
});

test('WP2-ACC4: CSIP diagnostics + qualification + activation via shared framework', () => {
  const d = new DiagnosticsService();
  const q = new QualificationService();
  const a = new ActivationService();
  d.capture({ engineId: CROSS_SECTOR_PLUGIN_ID, executionDurationMs: 3, registryVersions: { transport: '1.0' }, replayStatus: 'ok', transportStatus: 'ok', pluginPhase: 'Execution' });
  assert.equal(d.list()[0].engineId, CROSS_SECTOR_PLUGIN_ID);
  const qual = q.qualify({ engineId: CROSS_SECTOR_PLUGIN_ID, certified: true, replayVerified: true, regressionPassed: true, deterministic: true });
  assert.equal(qual.qualified, true);
  assert.equal(a.activate(CROSS_SECTOR_PLUGIN_ID, qual.qualified)?.toState, 'ACTIVE');
});

test('WP2-ACC5: CSIP produces portfolio evidence end-to-end via shared pipeline', () => {
  const { plugins, runtime } = makeRuntime();
  plugins.load(new CrossSectorPlugin());
  plugins.initialize(CROSS_SECTOR_PLUGIN_ID);
  const r = runtime.execute(CROSS_SECTOR_PLUGIN_ID, { requestId: 'csip-ev', inputs: { portfolio: FOUR_SECTOR_PORTFOLIO } });
  assert.equal(r.result.state, 'COMPLETED');
  assert.ok(r.result.evidenceRef);
});

test('WP2-ACC6: FIVE plugins coexist through the same framework without branching', () => {
  const { plugins, runtime, store } = makeRuntime();
  plugins.load(new BankingEngine());
  plugins.load(new InsuranceEngine());
  plugins.load(new CapitalMarketsEngine());
  plugins.load(new HealthcareEngine());
  plugins.load(new CrossSectorPlugin());
  plugins.initialize(BANKING_ENGINE_ID);
  plugins.initialize(INSURANCE_ENGINE_ID);
  plugins.initialize(CAPITAL_MARKETS_ENGINE_ID);
  plugins.initialize(HEALTHCARE_ENGINE_ID);
  plugins.initialize(CROSS_SECTOR_PLUGIN_ID);
  assert.equal(plugins.size, 5);

  runtime.execute(BANKING_ENGINE_ID, { requestId: 'bk', inputs: { 'BM-001': 1.6, 'BM-002': 15, 'BM-003': 3.9, 'BM-004': 46, 'BM-005': 1.4, 'BM-006': 0.5, 'BM-014': 14, 'BM-015': 17 } });
  runtime.execute(INSURANCE_ENGINE_ID, { requestId: 'in', inputs: { 'IM-001': 92, 'IM-002': 1.7, 'IM-003': 1800, 'IM-004': 300, 'IM-005': 88 } });
  runtime.execute(CAPITAL_MARKETS_ENGINE_ID, { requestId: 'cm', inputs: {} });
  runtime.execute(HEALTHCARE_ENGINE_ID, { requestId: 'hc', inputs: {} });
  const csip = runtime.execute(CROSS_SECTOR_PLUGIN_ID, { requestId: 'csip', inputs: { portfolio: FOUR_SECTOR_PORTFOLIO } });

  assert.equal(csip.result.state, 'COMPLETED');
  assert.ok(csip.result.evidenceRef);
  // 4 sector snapshots + 1 CSIP snapshot = 5.
  assert.equal(store.size, 5);
});

test('WP2-ACC7: CSIP replay determinism preserved (identical metadata + evidence across independent runs)', () => {
  // Two independent runtimes with the same deterministic clock + IdProvider must produce
  // byte-identical metadata and evidence references (replay-compatible execution).
  const run = () => {
    const { plugins, runtime } = makeRuntime();
    plugins.load(new CrossSectorPlugin());
    plugins.initialize(CROSS_SECTOR_PLUGIN_ID);
    return runtime.execute(CROSS_SECTOR_PLUGIN_ID, { requestId: 'csip-replay', inputs: { portfolio: FOUR_SECTOR_PORTFOLIO } });
  };
  const a = run();
  const b = run();
  assert.deepEqual(a.result.metadata, b.result.metadata);
  assert.equal(a.result.evidenceRef, b.result.evidenceRef);
});
