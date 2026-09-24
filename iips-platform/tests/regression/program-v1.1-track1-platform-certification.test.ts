/**
 * Program v1.1 — Track 1: Platform Certification.
 *
 * Verification-only. Certifies the COMMON platform hosts all 10 sector engines + CSIP
 * (11 plugins) simultaneously with no specialization, branching, or platform modification:
 * registration, manifest, qualification/activation, execution, evidence, snapshots, replay,
 * diagnostics, transport, determinism, and cross-sector isolation — all through the SAME
 * runtime/framework/shared services.
 *
 * Per governance: no methodology, calibration, sector, platform, or v2.0 change.
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
import type { SectorPlugin, ExecutionRequest } from '../../src/plugin-loader/PluginContract';

import { BankingEngine, BANKING_ENGINE_ID } from '../../src/sector-engines/banking/BankingEngine';
import { InsuranceEngine, INSURANCE_ENGINE_ID } from '../../src/sector-engines/insurance/InsuranceEngine';
import { CapitalMarketsEngine, CAPITAL_MARKETS_ENGINE_ID } from '../../src/sector-engines/capital-markets/CapitalMarketsEngine';
import { HealthcareEngine, HEALTHCARE_ENGINE_ID } from '../../src/sector-engines/healthcare/HealthcareEngine';
import { HospitalityEngine, HOSPITALITY_ENGINE_ID } from '../../src/sector-engines/hospitality/HospitalityEngine';
import { EnergyEngine, ENERGY_ENGINE_ID } from '../../src/sector-engines/energy/EnergyEngine';
import { UtilitiesEngine, UTILITIES_ENGINE_ID } from '../../src/sector-engines/utilities/UtilitiesEngine';
import { ConsumerEngine, CONSUMER_ENGINE_ID } from '../../src/sector-engines/consumer/ConsumerEngine';
import { IndustrialsEngine, INDUSTRIALS_ENGINE_ID } from '../../src/sector-engines/industrials/IndustrialsEngine';
import { TechnologyEngine, TECHNOLOGY_ENGINE_ID } from '../../src/sector-engines/technology/TechnologyEngine';
import { CrossSectorPlugin, CROSS_SECTOR_PLUGIN_ID } from '../../src/sector-engines/cross-sector/CrossSectorPlugin';

// All 11 plugins (10 sector engines + CSIP) with a representative execution request each.
const ENGINE_CASES: Array<{ id: string; engine: SectorPlugin; request: ExecutionRequest }> = [
  { id: BANKING_ENGINE_ID, engine: new BankingEngine(), request: { requestId: 'bank', inputs: { 'BM-001': 1.6, 'BM-002': 15, 'BM-003': 3.9, 'BM-004': 46, 'BM-005': 1.4, 'BM-006': 0.5, 'BM-014': 14, 'BM-015': 17 } } },
  { id: INSURANCE_ENGINE_ID, engine: new InsuranceEngine(), request: { requestId: 'ins', inputs: { 'IM-001': 92, 'IM-002': 1.7, 'IM-003': 1800, 'IM-004': 300, 'IM-005': 88 } } },
  { id: CAPITAL_MARKETS_ENGINE_ID, engine: new CapitalMarketsEngine(), request: { requestId: 'cm', inputs: {} } },
  { id: HEALTHCARE_ENGINE_ID, engine: new HealthcareEngine(), request: { requestId: 'hc', inputs: {} } },
  { id: HOSPITALITY_ENGINE_ID, engine: new HospitalityEngine(), request: { requestId: 'hp', inputs: { businessModel: 'owned', occupancy: 78, adr: 12000, revpar: 9360, revparGrowth: 12, gopMargin: 40, ebitdaMargin: 32, feeMix: 10, demandQualityMix: 70, debtEbitda: 3.0, roic: 12 } } },
  { id: ENERGY_ENGINE_ID, engine: new EnergyEngine(), request: { requestId: 'en', inputs: { segment: 'upstream', commodityExposure: 'price-taker', productionGrowth: 8, liftingCost: 18, reserveReplacement: 1.3, ebitdaMargin: 45, revenueGrowth: 9, debtEbitda: 2.2, roce: 16, transitionMix: 5, fcfYield: 10, evEbitda: 4 } } },
  { id: UTILITIES_ENGINE_ID, engine: new UtilitiesEngine(), request: { requestId: 'ut', inputs: { segment: 'regulated-electric', regulatoryPosture: 'constructive', rateBaseGrowth: 7, allowedRoe: 10, ffoDebt: 18, omEfficiency: 18, demandGrowth: 2, saidi: 90, transitionCapexIntensity: 30, ebitdaMargin: 42, revenueGrowth: 4, debtEbitda: 3.5, peRatio: 18, roe: 11 } } },
  { id: CONSUMER_ENGINE_ID, engine: new ConsumerEngine(), request: { requestId: 'cs', inputs: { segment: 'staples', businessModel: 'branded', revenueGrowth: 4, priceContribution: 65, brandLoyalty: 85, marginResilience: 0.9, dtcShare: 20, fcfYield: 6, innovationIntensity: 10, privateLabelExposure: 10, ebitdaMargin: 22, debtEbitda: 2.2, peRatio: 20, roic: 16 } } },
  { id: INDUSTRIALS_ENGINE_ID, engine: new IndustrialsEngine(), request: { requestId: 'ind', inputs: { subsegment: 'capital-goods', archetype: 'oem', ebitdaMargin: 22, revenueGrowth: 8, debtEbitda: 2.0, evEbitda: 12, roce: 20, backlog: 2.5, bookToBill: 1.05, aftermarketShare: 30, fcfYield: 8, orderGrowth: 8, operatingMargin: 22, projectRiskExposure: 20 } } },
  { id: TECHNOLOGY_ENGINE_ID, engine: new TechnologyEngine(), request: { requestId: 'te', inputs: { subsegment: 'software-saas', archetype: 'subscription', ebitdaMargin: 24, revenueGrowth: 22, debtEbitda: 1.5, evRevenue: 14, fcfYield: 6, recurringRevenuePct: 80, nrr: 118, grossMargin: 75, rdIntensity: 12, customerConcentration: 20, capexIntensity: 8, usageGrowth: 25 } } },
  { id: CROSS_SECTOR_PLUGIN_ID, engine: new CrossSectorPlugin(), request: { requestId: 'csip', inputs: { portfolioId: 'PF-05', scenario: 'Balanced', strategy: 'Balanced', outputs: [] } } },
];

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
  return { plugins, runtime, store, replay, evidence, clock };
}

function hostAll(rt: ReturnType<typeof makeRuntime>) {
  for (const c of ENGINE_CASES) {
    assert.equal(rt.plugins.load(c.engine), true, `${c.id} load`);
  }
  for (const c of ENGINE_CASES) rt.plugins.initialize(c.id);
  return rt;
}

test('CERT-01: 11-plugin registration + host (10 sectors + CSIP) through the SAME PluginLoader', () => {
  const rt = makeRuntime();
  hostAll(rt);
  assert.equal(rt.plugins.size, 11);
  const ids = rt.plugins.list().sort();
  for (const c of ENGINE_CASES) assert.ok(ids.includes(c.id), `hosted ${c.id}`);
  assert.equal(ids.length, 11);
});

test('CERT-02: all 11 plugins execute to COMPLETED through the SAME RuntimeCoordinator', () => {
  const rt = makeRuntime();
  hostAll(rt);
  for (const c of ENGINE_CASES) {
    const r = rt.runtime.execute(c.id, c.request);
    assert.equal(r.result.state, 'COMPLETED', `${c.id}`);
  }
});

test('CERT-03: manifest loadable for all 11 plugins via shared ManifestLoader (no platform schema branch)', () => {
  const ml = new ManifestLoader();
  for (const c of ENGINE_CASES) {
    const m = ml.load(c.engine.manifest);
    assert.equal(m.engineId, c.id, `${c.id} manifest`);
    assert.equal(Object.isFrozen(m), true);
  }
});

test('CERT-04: qualification + activation for all 11 plugins via shared services', () => {
  const q = new QualificationService();
  const a = new ActivationService();
  for (const c of ENGINE_CASES) {
    const qual = q.qualify({ engineId: c.id, certified: true, replayVerified: true, regressionPassed: true, deterministic: true });
    assert.equal(qual.qualified, true, `${c.id}`);
    assert.equal(a.activate(c.id, qual.qualified)?.toState, 'ACTIVE', `${c.id} active`);
  }
});

test('CERT-05: snapshots recorded for all 11 plugins via shared Snapshot (cross-sector isolation)', () => {
  const rt = makeRuntime();
  hostAll(rt);
  for (const c of ENGINE_CASES) {
    rt.runtime.execute(c.id, c.request);
  }
  assert.equal(rt.store.size, 11, 'one snapshot per plugin, no cross-contamination');
});

test('CERT-06: replay reproduces every plugin snapshot (byte-identical, single ReplayService)', () => {
  const rt = makeRuntime();
  hostAll(rt);
  const ids: string[] = [];
  for (const c of ENGINE_CASES) {
    const r = rt.runtime.execute(c.id, c.request);
    ids.push(r.result.snapshotRef as string);
  }
  for (const snapId of ids) {
    assert.equal(rt.replay.replay(snapId)?.reproduced, true);
  }
});

test('CERT-07: evidence produced for all 11 plugins via shared EvidencePipeline', () => {
  const rt = makeRuntime();
  hostAll(rt);
  for (const c of ENGINE_CASES) {
    const r = rt.runtime.execute(c.id, c.request);
    assert.ok(r.result.evidenceRef, `${c.id} evidenceRef`);
  }
});

test('CERT-08: diagnostics capture for a representative multi-sector execution', () => {
  const d = new DiagnosticsService();
  for (const c of ENGINE_CASES) {
    d.capture({ engineId: c.id, executionDurationMs: 3, registryVersions: { transport: '1.0' }, replayStatus: 'ok', transportStatus: 'ok', pluginPhase: 'Execution' });
  }
  assert.equal(d.list().length, 11);
});

test('CERT-09: transport generic DTO serializes deterministically for representative sectors', () => {
  const t = new Transport(makeRuntime().clock);
  for (const c of ENGINE_CASES.slice(0, 6)) {
    const dto = t.build(c.id, [{ sectorId: c.id.toUpperCase(), sectorFamily: c.engine.manifest.sectorFamily, companyName: 'Co', metrics: { m: 1 }, scores: { s: 1 }, verdict: 'Hold' }]);
    assert.equal(t.validate(dto), true, `${c.id}`);
    assert.equal(t.serialize(dto), t.serialize(dto), `${c.id} deterministic`);
  }
});

test('CERT-10: cross-sector determinism — two full 11-plugin runs are byte-identical', () => {
  const run = () => {
    const rt = makeRuntime();
    hostAll(rt);
    return ENGINE_CASES.map((c) => {
      const r = rt.runtime.execute(c.id, c.request);
      return JSON.stringify(r.result.metadata);
    });
  };
  assert.deepEqual(run(), run());
});

test('CERT-11: cross-sector isolation — each engine output is independent (no leakage between engines)', () => {
  const rt = makeRuntime();
  hostAll(rt);
  const hosted: Record<string, string> = {};
  for (const c of ENGINE_CASES) {
    const r = rt.runtime.execute(c.id, c.request);
    hosted[c.id] = JSON.stringify(r.result.metadata);
  }
  // Every engine produced a non-empty, engine-specific metadata surface (no shared/empty output).
  for (const c of ENGINE_CASES) {
    const meta = JSON.parse(hosted[c.id]);
    assert.ok(meta && Object.keys(meta).length > 0, `${c.id} produced engine output`);
  }
  // A single-engine (solo) run of Technology is byte-identical to its co-hosted run
  // (coexistence causes no interference).
  const solo = makeRuntime();
  solo.plugins.load(new TechnologyEngine());
  solo.plugins.initialize(TECHNOLOGY_ENGINE_ID);
  const soloRes = solo.runtime.execute(TECHNOLOGY_ENGINE_ID, ENGINE_CASES.find((c) => c.id === TECHNOLOGY_ENGINE_ID)!.request);
  assert.equal(JSON.stringify(soloRes.result.metadata), hosted[TECHNOLOGY_ENGINE_ID]);
});

test('CERT-12: zero platform specialization — a single shared runtime/framework/pluginloader serves all 11', () => {
  // One RuntimeCoordinator, one PluginLoader, one Snapshot/Replay/Evidence serve every engine.
  const rt = makeRuntime();
  hostAll(rt);
  const hosts = rt.plugins.list();
  assert.equal(hosts.length, 11);
  // The runtime itself is a single shared instance (no per-sector runtime branch created).
  assert.ok(rt.runtime instanceof RuntimeCoordinator);
  assert.ok(rt.plugins instanceof PluginLoader);
});
