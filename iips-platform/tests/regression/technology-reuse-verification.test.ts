/**
 * IES-015 WP-1 — Platform Reuse Verification.
 * Proves the existing platform hosts an eleventh plugin (sector.technology) with zero
 * platform changes, coexists with the nine sector engines + CSIP, and produces
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
import { TechnologyEngine, TECHNOLOGY_ENGINE_ID, TECHNOLOGY_ONTOLOGY_METADATA } from '../../src/sector-engines/technology/TechnologyEngine';
import { BankingEngine, BANKING_ENGINE_ID } from '../../src/sector-engines/banking/BankingEngine';
import { InsuranceEngine, INSURANCE_ENGINE_ID } from '../../src/sector-engines/insurance/InsuranceEngine';
import { CapitalMarketsEngine, CAPITAL_MARKETS_ENGINE_ID } from '../../src/sector-engines/capital-markets/CapitalMarketsEngine';
import { HealthcareEngine, HEALTHCARE_ENGINE_ID } from '../../src/sector-engines/healthcare/HealthcareEngine';
import { HospitalityEngine, HOSPITALITY_ENGINE_ID } from '../../src/sector-engines/hospitality/HospitalityEngine';
import { EnergyEngine, ENERGY_ENGINE_ID } from '../../src/sector-engines/energy/EnergyEngine';
import { UtilitiesEngine, UTILITIES_ENGINE_ID } from '../../src/sector-engines/utilities/UtilitiesEngine';
import { ConsumerEngine, CONSUMER_ENGINE_ID } from '../../src/sector-engines/consumer/ConsumerEngine';
import { IndustrialsEngine, INDUSTRIALS_ENGINE_ID } from '../../src/sector-engines/industrials/IndustrialsEngine';
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

test('IES015-WP1-ACC1: sector.technology registers + executes through the existing runtime', () => {
  const { plugins, runtime } = makeRuntime();
  assert.equal(plugins.load(new TechnologyEngine()), true);
  plugins.initialize(TECHNOLOGY_ENGINE_ID);
  const r = runtime.execute(TECHNOLOGY_ENGINE_ID, {
    requestId: 'te-r1',
    inputs: { subsegment: 'software-saas', revenueGrowth: 22, grossMargin: 75, recurringRevenuePct: 80 },
  });
  assert.equal(r.result.state, 'COMPLETED');
  assert.equal(r.result.metadata.resolvedSubsegment, 'software-saas');
});

test('IES015-WP1-ACC2: technology produces snapshots + replays via shared services', () => {
  const { plugins, runtime, store, replay } = makeRuntime();
  plugins.load(new TechnologyEngine());
  plugins.initialize(TECHNOLOGY_ENGINE_ID);
  const snap = runtime.recordSnapshot(TECHNOLOGY_ENGINE_ID, { revenueGrowth: 22 }, { grossMargin: 75 }, 'TECHNOLOGY_SUMMARY');
  assert.equal(Object.isFrozen(snap), true);
  assert.equal(store.size, 1);
  assert.equal(replay.replay(snap.snapshotId)?.reproduced, true);
});

test('IES015-WP1-ACC3: ELEVEN plugins coexist (9 sectors + CSIP + Technology)', () => {
  const { plugins, runtime, store } = makeRuntime();
  plugins.load(new BankingEngine());
  plugins.load(new InsuranceEngine());
  plugins.load(new CapitalMarketsEngine());
  plugins.load(new HealthcareEngine());
  plugins.load(new HospitalityEngine());
  plugins.load(new EnergyEngine());
  plugins.load(new UtilitiesEngine());
  plugins.load(new ConsumerEngine());
  plugins.load(new IndustrialsEngine());
  plugins.load(new CrossSectorPlugin());
  plugins.load(new TechnologyEngine());
  plugins.initialize(BANKING_ENGINE_ID);
  plugins.initialize(INSURANCE_ENGINE_ID);
  plugins.initialize(CAPITAL_MARKETS_ENGINE_ID);
  plugins.initialize(HEALTHCARE_ENGINE_ID);
  plugins.initialize(HOSPITALITY_ENGINE_ID);
  plugins.initialize(ENERGY_ENGINE_ID);
  plugins.initialize(UTILITIES_ENGINE_ID);
  plugins.initialize(CONSUMER_ENGINE_ID);
  plugins.initialize(INDUSTRIALS_ENGINE_ID);
  plugins.initialize(CROSS_SECTOR_PLUGIN_ID);
  plugins.initialize(TECHNOLOGY_ENGINE_ID);
  assert.equal(plugins.size, 11);

  runtime.execute(BANKING_ENGINE_ID, { requestId: 'bk', inputs: { 'BM-001': 1.6, 'BM-002': 15, 'BM-003': 3.9, 'BM-004': 46, 'BM-005': 1.4, 'BM-006': 0.5, 'BM-014': 14, 'BM-015': 17 } });
  runtime.execute(INSURANCE_ENGINE_ID, { requestId: 'in', inputs: { 'IM-001': 92, 'IM-002': 1.7, 'IM-003': 1800, 'IM-004': 300, 'IM-005': 88 } });
  runtime.execute(CAPITAL_MARKETS_ENGINE_ID, { requestId: 'cm', inputs: {} });
  runtime.execute(HEALTHCARE_ENGINE_ID, { requestId: 'hc', inputs: {} });
  runtime.execute(HOSPITALITY_ENGINE_ID, { requestId: 'hp', inputs: { businessModel: 'owned', occupancy: 78, adr: 12000, revpar: 9360, revparGrowth: 12, gopMargin: 40, ebitdaMargin: 32, feeMix: 10, demandQualityMix: 70, debtEbitda: 3.0, roic: 12 } });
  runtime.execute(ENERGY_ENGINE_ID, { requestId: 'en', inputs: { segment: 'upstream', commodityExposure: 'price-taker', productionGrowth: 8, liftingCost: 18, reserveReplacement: 1.3, ebitdaMargin: 45, revenueGrowth: 9, debtEbitda: 2.2, roce: 16, transitionMix: 5, fcfYield: 10, evEbitda: 4 } });
  runtime.execute(UTILITIES_ENGINE_ID, { requestId: 'ut', inputs: { segment: 'regulated-electric', regulatoryPosture: 'constructive', rateBaseGrowth: 7, allowedRoe: 10, ffoDebt: 18, omEfficiency: 18, demandGrowth: 2, saidi: 90, transitionCapexIntensity: 30, ebitdaMargin: 42, revenueGrowth: 4, debtEbitda: 3.5, peRatio: 18, roe: 11 } });
  runtime.execute(CONSUMER_ENGINE_ID, { requestId: 'cs', inputs: { segment: 'staples', businessModel: 'branded', revenueGrowth: 4, priceContribution: 65, brandLoyalty: 85, marginResilience: 0.9, dtcShare: 20, fcfYield: 6, innovationIntensity: 10, privateLabelExposure: 10, ebitdaMargin: 22, debtEbitda: 2.2, peRatio: 20, roic: 16 } });
  runtime.execute(INDUSTRIALS_ENGINE_ID, { requestId: 'ind', inputs: { subsegment: 'capital-goods', archetype: 'oem', ebitdaMargin: 22, revenueGrowth: 8, debtEbitda: 2.0, evEbitda: 12, roce: 20, backlog: 2.5, bookToBill: 1.05, aftermarketShare: 30, fcfYield: 8, orderGrowth: 8, operatingMargin: 22, projectRiskExposure: 20 } });
  runtime.execute(CROSS_SECTOR_PLUGIN_ID, { requestId: 'csip', inputs: { portfolioId: 'PF-05', scenario: 'Balanced', strategy: 'Balanced', outputs: [] } });
  const te = runtime.execute(TECHNOLOGY_ENGINE_ID, { requestId: 'te', inputs: { subsegment: 'cybersecurity', revenueGrowth: 18, grossMargin: 78, recurringRevenuePct: 82 } });

  assert.equal(te.result.state, 'COMPLETED');
  assert.equal(store.size, 11);
  assert.equal(plugins.size, 11);
});

test('IES015-WP1-ACC4: technology ontology metadata covers 8 dimensions (CSIP-compatible)', () => {
  const meta = TECHNOLOGY_ONTOLOGY_METADATA;
  const dims = ['Conviction', 'Confidence', 'Quality', 'Growth', 'Risk', 'Profitability', 'Capital Efficiency', 'Valuation'];
  const mapped = Object.values(meta);
  for (const d of dims) assert.ok(mapped.includes(d), `missing ${d}`);
  assert.equal(mapped.length, 8);
});
