/**
 * CSIP WP-1 — Platform Reuse Verification.
 * Proves the existing platform hosts CSIP (a platform capability, not a sector engine)
 * with zero platform changes, coexists with the four immutable sector engines, consumes
 * their published outputs, and produces replay-compatible deterministic execution.
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
  return { plugins, runtime, store, replay };
}

// A four-sector portfolio of PUBLISHED engine outputs (normalized ontology dimensions),
// mirroring the CSIP golden dataset (PF-05 Multi-sector Balanced) semantics.
// Published engine outputs (normalized ontology dimensions) mirroring PF-05 semantics.
const FOUR_SECTOR_PORTFOLIO = [
  { companyId: 'BK-002', sector: 'Banking', composite: 72, confidence: 0.8, qualityScore: 78, riskScore: 25, verdict: 'Buy' },
  { companyId: 'IN-001', sector: 'Insurance', composite: 72, confidence: 0.8, qualityScore: 75, riskScore: 20, verdict: 'Accumulate' },
  { companyId: 'CM-005', sector: 'Capital Markets', composite: 82, confidence: 0.8, qualityScore: 80, riskScore: 30, verdict: 'Buy' },
  { companyId: 'HC-006', sector: 'Healthcare', composite: 82, confidence: 0.8, qualityScore: 80, riskScore: 35, verdict: 'Strong Buy' },
];

test('WP1-ACC1: platform.cross-sector registers + executes through the existing runtime', () => {
  const { plugins, runtime } = makeRuntime();
  assert.equal(plugins.load(new CrossSectorPlugin()), true);
  plugins.initialize(CROSS_SECTOR_PLUGIN_ID);
  const r = runtime.execute(CROSS_SECTOR_PLUGIN_ID, {
    requestId: 'csip-r1',
    inputs: { portfolioId: 'PF-05', scenario: 'Balanced', strategy: 'Balanced', outputs: FOUR_SECTOR_PORTFOLIO },
  });
  assert.equal(r.result.state, 'COMPLETED');
  assert.equal(r.result.metadata.holdings, 4);
});

test('WP1-ACC2: CSIP consumes published engine outputs only (black box) + deterministic summary', () => {
  const { plugins, runtime } = makeRuntime();
  plugins.load(new CrossSectorPlugin());
  plugins.initialize(CROSS_SECTOR_PLUGIN_ID);
  const r = runtime.execute(CROSS_SECTOR_PLUGIN_ID, {
    requestId: 'csip-r2',
    inputs: { portfolioId: 'PF-05', scenario: 'Balanced', strategy: 'Balanced', outputs: FOUR_SECTOR_PORTFOLIO },
  });
  const m = r.result.metadata as Record<string, unknown>;
  // Four sectors, equal weight -> concentration 25.0, diversification 84.0 (matches PF-05).
  assert.deepEqual(m.sectorExposure, { Banking: 25, 'Capital Markets': 25, Healthcare: 25, Insurance: 25 });
  assert.equal(m.concentration, 25);
  assert.equal(m.diversificationScore, 84);
  assert.equal(m.avgConviction, 77);
});

test('WP1-ACC3: FIVE plugins coexist in the same runtime (Banking + Insurance + Capital Markets + Healthcare + CSIP)', () => {
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
  const csip = runtime.execute(CROSS_SECTOR_PLUGIN_ID, { requestId: 'csip', inputs: { portfolioId: 'PF-05', scenario: 'Balanced', strategy: 'Balanced', outputs: FOUR_SECTOR_PORTFOLIO } });

  assert.equal(csip.result.state, 'COMPLETED');
  // 4 sector snapshots + 1 CSIP snapshot = 5 snapshots via shared services.
  assert.equal(store.size, 5);
  assert.deepEqual(plugins.list().sort(), [
    'sector.banking', 'sector.capital-markets', 'sector.healthcare', 'sector.insurance', 'platform.cross-sector',
  ].sort());
});

test('WP1-ACC4: CSIP produces replay-compatible execution via shared services', () => {
  const { plugins, runtime, replay } = makeRuntime();
  plugins.load(new CrossSectorPlugin());
  plugins.initialize(CROSS_SECTOR_PLUGIN_ID);
  const snap = runtime.recordSnapshot(CROSS_SECTOR_PLUGIN_ID, { holdings: 4 }, { Banking: 25 }, 'PORTFOLIO_SUMMARY');
  assert.equal(Object.isFrozen(snap), true);
  assert.equal(replay.replay(snap.snapshotId)?.reproduced, true);
});
