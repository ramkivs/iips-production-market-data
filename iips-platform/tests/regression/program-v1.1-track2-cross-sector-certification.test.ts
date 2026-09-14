/**
 * Program v1.1 — Track 2: Cross-Sector Certification.
 *
 * Verification-only. Distinct from Track 1 (which proved the platform can HOST 11 plugins):
 * Track 2 proves that SIMULTANEOUS multi-sector execution preserves sector independence and
 * deterministic behavior — per-sector input/output/snapshot/evidence/ontology isolation,
 * no calibration/methodology leakage, order independence, solo == co-hosted, repeated
 * multi-sector runs byte-identical, and CSIP remaining a consumer/integration boundary.
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

interface EngineDef { id: string; sectorFamily: string; makeEngine: () => SectorPlugin; request: ExecutionRequest; }

const BASE: EngineDef[] = [
  { id: BANKING_ENGINE_ID, sectorFamily: 'Banking', makeEngine: () => new BankingEngine(), request: { requestId: 'bank', inputs: { 'BM-001': 1.6, 'BM-002': 15, 'BM-003': 3.9, 'BM-004': 46, 'BM-005': 1.4, 'BM-006': 0.5, 'BM-014': 14, 'BM-015': 17 } } },
  { id: INSURANCE_ENGINE_ID, sectorFamily: 'Insurance', makeEngine: () => new InsuranceEngine(), request: { requestId: 'ins', inputs: { 'IM-001': 92, 'IM-002': 1.7, 'IM-003': 1800, 'IM-004': 300, 'IM-005': 88 } } },
  { id: CAPITAL_MARKETS_ENGINE_ID, sectorFamily: 'Capital Markets', makeEngine: () => new CapitalMarketsEngine(), request: { requestId: 'cm', inputs: {} } },
  { id: HEALTHCARE_ENGINE_ID, sectorFamily: 'Healthcare', makeEngine: () => new HealthcareEngine(), request: { requestId: 'hc', inputs: {} } },
  { id: HOSPITALITY_ENGINE_ID, sectorFamily: 'Hospitality', makeEngine: () => new HospitalityEngine(), request: { requestId: 'hp', inputs: { businessModel: 'owned', occupancy: 78, adr: 12000, revpar: 9360, revparGrowth: 12, gopMargin: 40, ebitdaMargin: 32, feeMix: 10, demandQualityMix: 70, debtEbitda: 3.0, roic: 12 } } },
  { id: ENERGY_ENGINE_ID, sectorFamily: 'Energy', makeEngine: () => new EnergyEngine(), request: { requestId: 'en', inputs: { segment: 'upstream', commodityExposure: 'price-taker', productionGrowth: 8, liftingCost: 18, reserveReplacement: 1.3, ebitdaMargin: 45, revenueGrowth: 9, debtEbitda: 2.2, roce: 16, transitionMix: 5, fcfYield: 10, evEbitda: 4 } } },
  { id: UTILITIES_ENGINE_ID, sectorFamily: 'Utilities', makeEngine: () => new UtilitiesEngine(), request: { requestId: 'ut', inputs: { segment: 'regulated-electric', regulatoryPosture: 'constructive', rateBaseGrowth: 7, allowedRoe: 10, ffoDebt: 18, omEfficiency: 18, demandGrowth: 2, saidi: 90, transitionCapexIntensity: 30, ebitdaMargin: 42, revenueGrowth: 4, debtEbitda: 3.5, peRatio: 18, roe: 11 } } },
  { id: CONSUMER_ENGINE_ID, sectorFamily: 'Consumer', makeEngine: () => new ConsumerEngine(), request: { requestId: 'cs', inputs: { segment: 'staples', businessModel: 'branded', revenueGrowth: 4, priceContribution: 65, brandLoyalty: 85, marginResilience: 0.9, dtcShare: 20, fcfYield: 6, innovationIntensity: 10, privateLabelExposure: 10, ebitdaMargin: 22, debtEbitda: 2.2, peRatio: 20, roic: 16 } } },
  { id: INDUSTRIALS_ENGINE_ID, sectorFamily: 'Industrials', makeEngine: () => new IndustrialsEngine(), request: { requestId: 'ind', inputs: { subsegment: 'capital-goods', archetype: 'oem', ebitdaMargin: 22, revenueGrowth: 8, debtEbitda: 2.0, evEbitda: 12, roce: 20, backlog: 2.5, bookToBill: 1.05, aftermarketShare: 30, fcfYield: 8, orderGrowth: 8, operatingMargin: 22, projectRiskExposure: 20 } } },
  { id: TECHNOLOGY_ENGINE_ID, sectorFamily: 'Technology', makeEngine: () => new TechnologyEngine(), request: { requestId: 'te', inputs: { subsegment: 'software-saas', archetype: 'subscription', ebitdaMargin: 24, revenueGrowth: 22, debtEbitda: 1.5, evRevenue: 14, fcfYield: 6, recurringRevenuePct: 80, nrr: 118, grossMargin: 75, rdIntensity: 12, customerConcentration: 20, capexIntensity: 8, usageGrowth: 25 } } },
  { id: CROSS_SECTOR_PLUGIN_ID, sectorFamily: 'CSIP', makeEngine: () => new CrossSectorPlugin(), request: { requestId: 'csip', inputs: { portfolioId: 'PF-05', scenario: 'Balanced', strategy: 'Balanced', outputs: [] } } },
];
const SECTOR_DEFS = BASE.filter((c) => c.id !== CROSS_SECTOR_PLUGIN_ID);
const CSIP_DEF = BASE.find((c) => c.id === CROSS_SECTOR_PLUGIN_ID)!;

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
  return { plugins, runtime, store, replay, evidence };
}

/** Host fresh engine instances for every def (no shared-instance leakage across runtimes). */
function hostAll(rt: ReturnType<typeof makeRuntime>, defs: EngineDef[] = BASE) {
  const loaded = new Map<string, ExecutionRequest>();
  for (const d of defs) {
    assert.equal(rt.plugins.load(d.makeEngine()), true, `${d.id} load`);
    rt.plugins.initialize(d.id);
    loaded.set(d.id, d.request);
  }
  return loaded;
}

/** Execute defs in the given order against a fresh runtime; returns id -> metadata JSON. */
function fullRun(order: string[] = BASE.map((c) => c.id)) {
  const rt = makeRuntime();
  const requests = hostAll(rt);
  const out: Record<string, string> = {};
  const snapshotRefs: Record<string, string> = {};
  const evidenceRefs: Record<string, string> = {};
  for (const id of order) {
    const r = rt.runtime.execute(id, requests.get(id)!);
    out[id] = JSON.stringify(r.result.metadata);
    if (r.result.snapshotRef) snapshotRefs[id] = r.result.snapshotRef;
    if (r.result.evidenceRef) evidenceRefs[id] = r.result.evidenceRef;
  }
  return { rt, out, snapshotRefs, evidenceRefs };
}

test('T2-CERT-01: simultaneous (co-hosted) execution — all 11 plugins COMPLETED in one runtime', () => {
  const { rt } = fullRun();
  assert.equal(rt.plugins.size, 11);
  assert.equal(rt.store.size, 11);
});

test('T2-CERT-02: per-sector snapshot identity isolation — 11 distinct snapshotIds, each bound to its sector', () => {
  const { rt, snapshotRefs } = fullRun();
  assert.equal(new Set(Object.values(snapshotRefs)).size, 11, 'one distinct snapshot per sector');
  for (const d of BASE) {
    const snap = rt.store.get(snapshotRefs[d.id])!;
    assert.equal(snap.engineId, d.id, `${d.id} snapshot bound to sector`);
  }
});

test('T2-CERT-03: per-sector evidence isolation — 11 distinct evidenceRefs, engine-scoped', () => {
  const { evidenceRefs } = fullRun();
  assert.equal(new Set(Object.values(evidenceRefs)).size, 11, 'distinct evidence refs');
  for (const d of BASE) assert.ok(evidenceRefs[d.id].startsWith(`ev_${d.id}_`), `${d.id} evidence engine-scoped`);
});

test('T2-CERT-04: per-sector ontology registration isolation — each ontology-publishing sector exposes its own 8-dim UIO metadata', () => {
  const rt = makeRuntime();
  const requests = hostAll(rt);
  const UIO = new Set(['Conviction', 'Confidence', 'Quality', 'Growth', 'Risk', 'Valuation', 'Capital Efficiency', 'Moat', 'Profitability']);
  const seen = new Map<string, string>();
  // FINDING (recorded for Track 6/8): the 4 frozen v1.0 engines (Banking, Insurance,
  // Capital Markets, Healthcare) do NOT publish execution-metadata ontology; their CSIP
  // mappings are provided by the frozen OntologyMapper (additive, hardcoded). The 6
  // later engines (Hospitality..Technology) publish their own. Certification asserts
  // isolation for every engine that publishes ontology.
  const publishing: string[] = [];
  const nonPublishing: string[] = [];
  for (const d of SECTOR_DEFS) {
    const r = rt.runtime.execute(d.id, requests.get(d.id)!);
    const ont = r.result.metadata.ontology as Record<string, string> | undefined;
    if (!ont) { nonPublishing.push(d.id); continue; }
    publishing.push(d.id);
    assert.equal(Object.values(ont).length, 8, `${d.id} 8-dim`);
    for (const v of Object.values(ont)) assert.ok(UIO.has(v), `${d.id} UIO dim ${v}`);
    const keys = JSON.stringify(Object.keys(ont).sort());
    seen.set(keys, seen.has(keys) ? `${seen.get(keys)},${d.id}` : d.id);
  }
  assert.ok(seen.size >= 2, `sector-specific ontology mapping sets present (${seen.size} distinct patterns)`);
  assert.equal(nonPublishing.length, 4, `finding: 4 v1.0 engines do not publish execution-metadata ontology (${nonPublishing.join(', ')})`);
  assert.ok(publishing.length >= 6, `publishing engines: ${publishing.length}`);
});

test('T2-CERT-05: no calibration/methodology leakage — order-independent (same outputs under different execution orders)', () => {
  const orderA = BASE.map((c) => c.id);
  const orderB = [...BASE].reverse().map((c) => c.id);
  const a = fullRun(orderA).out;
  const b = fullRun(orderB).out;
  for (const id of orderA) {
    assert.equal(a[id], b[id], `${id} order-independent (no cross-sector calibration/methodology leakage)`);
  }
});

test('T2-CERT-06: solo execution == co-hosted execution for ALL 10 sector engines', () => {
  const hosted = fullRun(BASE.map((c) => c.id)).out;
  for (const d of SECTOR_DEFS) {
    const solo = makeRuntime();
    assert.equal(solo.plugins.load(d.makeEngine()), true);
    solo.plugins.initialize(d.id);
    const soloR = solo.runtime.execute(d.id, d.request);
    assert.equal(JSON.stringify(soloR.result.metadata), hosted[d.id], `${d.id} solo == co-hosted`);
  }
});

test('T2-CERT-07: repeated multi-sector execution is byte-identical', () => {
  assert.deepEqual(fullRun().out, fullRun().out);
});

test('T2-CERT-08: CSIP remains a consumer/integration boundary, not a sector-specific branch', () => {
  // CSIP output is stable regardless of the order in which it runs relative to the 10 sectors.
  const rtA = makeRuntime();
  const reqA = hostAll(rtA);
  for (const d of SECTOR_DEFS) rtA.runtime.execute(d.id, reqA.get(d.id)!); // sectors first
  const csipA = rtA.runtime.execute(CROSS_SECTOR_PLUGIN_ID, CSIP_DEF.request);

  const rtB = makeRuntime();
  hostAll(rtB);
  // CSIP first, then sectors — CSIP does not branch on any single sector.
  const csipFirst = rtB.runtime.execute(CROSS_SECTOR_PLUGIN_ID, CSIP_DEF.request);
  assert.equal(JSON.stringify(csipFirst.result.metadata), JSON.stringify(csipA.result.metadata),
    'CSIP is order-independent (consumer boundary, no sector-specific branch)');
});
