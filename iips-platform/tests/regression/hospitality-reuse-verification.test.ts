/**
 * IES-010 WP-1 — Platform Reuse Verification.
 * Proves the existing platform hosts a sixth plugin (sector.hospitality) with zero
 * platform changes, coexists with the four sector engines + CSIP, and produces
 * replay-compatible deterministic execution.
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
import { HospitalityEngine, HOSPITALITY_ENGINE_ID } from '../../src/sector-engines/hospitality/HospitalityEngine';
import { BankingEngine, BANKING_ENGINE_ID } from '../../src/sector-engines/banking/BankingEngine';
import { InsuranceEngine, INSURANCE_ENGINE_ID } from '../../src/sector-engines/insurance/InsuranceEngine';
import { CapitalMarketsEngine, CAPITAL_MARKETS_ENGINE_ID } from '../../src/sector-engines/capital-markets/CapitalMarketsEngine';
import { HealthcareEngine, HEALTHCARE_ENGINE_ID } from '../../src/sector-engines/healthcare/HealthcareEngine';
import { CrossSectorPlugin, CROSS_SECTOR_PLUGIN_ID } from '../../src/sector-engines/cross-sector/CrossSectorPlugin';

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

test('IES010-WP1-ACC1: sector.hospitality registers + executes through the existing runtime', () => {
  const { plugins, runtime } = makeRuntime();
  assert.equal(plugins.load(new HospitalityEngine()), true);
  plugins.initialize(HOSPITALITY_ENGINE_ID);
  const r = runtime.execute(HOSPITALITY_ENGINE_ID, {
    requestId: 'hp-r1',
    inputs: { businessModel: 'asset-light', occupancy: 68, adr: 8000, revpar: 5440, revparGrowth: 8, gopMargin: 28, ebitdaMargin: 30, feeMix: 55, demandQualityMix: 68, debtEbitda: 2.8, roic: 15 },
  });
  assert.equal(r.result.state, 'COMPLETED');
  assert.equal(r.result.metadata.composite, 78.6);
  assert.equal(r.result.metadata.verdict, 'Buy');
});

test('IES010-WP1-ACC2: hospitality produces snapshots + replays via shared services', () => {
  const { plugins, runtime, store, replay } = makeRuntime();
  plugins.load(new HospitalityEngine());
  plugins.initialize(HOSPITALITY_ENGINE_ID);
  const snap = runtime.recordSnapshot(HOSPITALITY_ENGINE_ID, { revpar: 5440 }, { revpar: 8000 }, 'HOSPITALITY_SUMMARY');
  assert.equal(Object.isFrozen(snap), true);
  assert.equal(store.size, 1);
  assert.equal(replay.replay(snap.snapshotId)?.reproduced, true);
});

test('IES010-WP1-ACC3: SIX plugins coexist (Banking + Insurance + Capital Markets + Healthcare + CSIP + Hospitality)', () => {
  const { plugins, runtime, store } = makeRuntime();
  plugins.load(new BankingEngine());
  plugins.load(new InsuranceEngine());
  plugins.load(new CapitalMarketsEngine());
  plugins.load(new HealthcareEngine());
  plugins.load(new CrossSectorPlugin());
  plugins.load(new HospitalityEngine());
  plugins.initialize(BANKING_ENGINE_ID);
  plugins.initialize(INSURANCE_ENGINE_ID);
  plugins.initialize(CAPITAL_MARKETS_ENGINE_ID);
  plugins.initialize(HEALTHCARE_ENGINE_ID);
  plugins.initialize(CROSS_SECTOR_PLUGIN_ID);
  plugins.initialize(HOSPITALITY_ENGINE_ID);
  assert.equal(plugins.size, 6);

  runtime.execute(BANKING_ENGINE_ID, { requestId: 'bk', inputs: { 'BM-001': 1.6, 'BM-002': 15, 'BM-003': 3.9, 'BM-004': 46, 'BM-005': 1.4, 'BM-006': 0.5, 'BM-014': 14, 'BM-015': 17 } });
  runtime.execute(INSURANCE_ENGINE_ID, { requestId: 'in', inputs: { 'IM-001': 92, 'IM-002': 1.7, 'IM-003': 1800, 'IM-004': 300, 'IM-005': 88 } });
  runtime.execute(CAPITAL_MARKETS_ENGINE_ID, { requestId: 'cm', inputs: {} });
  runtime.execute(HEALTHCARE_ENGINE_ID, { requestId: 'hc', inputs: {} });
  runtime.execute(CROSS_SECTOR_PLUGIN_ID, { requestId: 'csip', inputs: { portfolioId: 'PF-05', scenario: 'Balanced', strategy: 'Balanced', outputs: [] } });
  const hp = runtime.execute(HOSPITALITY_ENGINE_ID, { requestId: 'hp', inputs: { businessModel: 'owned', occupancy: 78, adr: 12000, revpar: 9360, revparGrowth: 12, gopMargin: 40, ebitdaMargin: 32, feeMix: 10, demandQualityMix: 70, debtEbitda: 3.0, roic: 12 } });

  assert.equal(hp.result.state, 'COMPLETED');
  assert.equal(store.size, 6);
  assert.equal(plugins.size, 6);
});

test('IES010-WP1-ACC4: hospitality replay-compatible execution via shared services', () => {
  const { plugins, runtime, replay } = makeRuntime();
  plugins.load(new HospitalityEngine());
  plugins.initialize(HOSPITALITY_ENGINE_ID);
  const snap = runtime.recordSnapshot(HOSPITALITY_ENGINE_ID, { revpar: 9360 }, { revpar: 12000 }, 'HOSPITALITY_SUMMARY');
  assert.equal(replay.replay(snap.snapshotId)?.reproduced, true);
});
