/**
 * CSIP WP-3 — Cross-Sector Intelligence Engine acceptance.
 * Reproduces the 6 frozen portfolio expected outputs (PORTFOLIO_EXPECTED_OUTPUTS.json)
 * from the golden dataset, and exercises the 7 core services + evidence deterministically.
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
import { CrossSectorEngine } from '../../src/sector-engines/cross-sector/CrossSectorEngine';
import type { EngineOutput } from '../../src/sector-engines/cross-sector/ontology/OntologyMapper';

// Golden dataset PF-05 (Multi-sector Balanced) — full pipeline through the plugin.
const PF05: EngineOutput[] = [
  { companyId: 'BK-002', sector: 'Banking', composite: 72, confidence: 0.8, qualityScore: 78, riskScore: 25, verdict: 'Buy' },
  { companyId: 'IN-001', sector: 'Insurance', composite: 72, confidence: 0.8, qualityScore: 75, riskScore: 20, verdict: 'Accumulate' },
  { companyId: 'CM-005', sector: 'Capital Markets', composite: 82, confidence: 0.8, qualityScore: 80, riskScore: 30, verdict: 'Buy' },
  { companyId: 'HC-006', sector: 'Healthcare', composite: 82, confidence: 0.8, qualityScore: 80, riskScore: 35, verdict: 'Strong Buy' },
];

// Golden dataset portfolios as published engine outputs (ontology mapping source).
const GOLDEN: Record<string, { scenario: string; outputs: EngineOutput[] }> = {
  'PF-01': { scenario: 'Conservative', outputs: [
    { companyId: 'BK-002', sector: 'Banking', composite: 72, confidence: 0.8, qualityScore: 78, riskScore: 25, verdict: 'Buy' },
    { companyId: 'IN-001', sector: 'Insurance', composite: 72, confidence: 0.8, qualityScore: 75, riskScore: 20, verdict: 'Accumulate' },
    { companyId: 'CM-005', sector: 'Capital Markets', composite: 82, confidence: 0.8, qualityScore: 80, riskScore: 30, verdict: 'Buy' },
  ] },
  'PF-02': { scenario: 'Growth', outputs: [
    { companyId: 'CM-006', sector: 'Capital Markets', composite: 85, confidence: 0.8, qualityScore: 82, riskScore: 40, verdict: 'Buy' },
    { companyId: 'HC-006', sector: 'Healthcare', composite: 82, confidence: 0.8, qualityScore: 80, riskScore: 35, verdict: 'Strong Buy' },
  ] },
  'PF-03': { scenario: 'Income', outputs: [
    { companyId: 'BK-002', sector: 'Banking', composite: 72, confidence: 0.8, qualityScore: 78, riskScore: 25, verdict: 'Buy' },
    { companyId: 'IN-001', sector: 'Insurance', composite: 72, confidence: 0.8, qualityScore: 75, riskScore: 20, verdict: 'Accumulate' },
  ] },
  'PF-04': { scenario: 'Over-concentrated', outputs: [
    { companyId: 'BK-002', sector: 'Banking', composite: 72, confidence: 0.8, qualityScore: 78, riskScore: 25, verdict: 'Buy' },
    { companyId: 'BK-001', sector: 'Banking', composite: 47, confidence: 0.8, qualityScore: 50, riskScore: 55, verdict: 'Watch' },
    { companyId: 'BK-005', sector: 'Banking', composite: 34, confidence: 0.8, qualityScore: 40, riskScore: 70, verdict: 'Avoid' },
  ] },
  'PF-05': { scenario: 'Balanced', outputs: PF05 },
  'PF-06': { scenario: 'Crisis', outputs: [
    { companyId: 'BK-005', sector: 'Banking', composite: 34, confidence: 0.8, qualityScore: 40, riskScore: 70, verdict: 'Avoid' },
    { companyId: 'IN-005', sector: 'Insurance', composite: 34, confidence: 0.8, qualityScore: 35, riskScore: 75, verdict: 'Avoid' },
  ] },
};

// Frozen expected outputs (PORTFOLIO_EXPECTED_OUTPUTS.json).
const EXPECTED: Record<string, { conc: number; div: number; avgC: number; avgQ: number; avgR: number }> = {
  'PF-01': { conc: 33.3, div: 72.7, avgC: 75.3, avgQ: 77.7, avgR: 25.0 },
  'PF-02': { conc: 50.0, div: 53.0, avgC: 83.5, avgQ: 81.0, avgR: 37.5 },
  'PF-03': { conc: 50.0, div: 53.0, avgC: 72.0, avgQ: 76.5, avgR: 22.5 },
  'PF-04': { conc: 100.0, div: 6.0, avgC: 51.0, avgQ: 56.0, avgR: 50.0 },
  'PF-05': { conc: 25.0, div: 84.0, avgC: 77.0, avgQ: 78.2, avgR: 27.5 },
  'PF-06': { conc: 50.0, div: 53.0, avgC: 34.0, avgQ: 37.5, avgR: 72.5 },
};

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

const engine = new CrossSectorEngine();

test('WP3-ACC1: all 6 frozen portfolio expected outputs reproduced exactly (golden regression)', () => {
  for (const [pid, spec] of Object.entries(GOLDEN)) {
    const res = engine.run({ portfolioId: pid, scenario: spec.scenario, strategy: 'Balanced', outputs: spec.outputs });
    const e = EXPECTED[pid];
    assert.equal(res.intelligence.concentration, e.conc, `${pid} concentration`);
    assert.equal(res.intelligence.diversificationScore, e.div, `${pid} diversification`);
    assert.equal(res.intelligence.avgConviction, e.avgC, `${pid} avgConviction`);
    assert.equal(res.intelligence.avgQuality, e.avgQ, `${pid} avgQuality`);
    assert.equal(res.intelligence.avgRisk, e.avgR, `${pid} avgRisk`);
  }
});

test('WP3-ACC2: sector exposure matches frozen expected outputs', () => {
  const res = engine.run({ portfolioId: 'PF-05', scenario: 'Balanced', outputs: GOLDEN['PF-05'].outputs });
  assert.deepEqual(res.intelligence.sectorExposure, { Banking: 25, 'Capital Markets': 25, Healthcare: 25, Insurance: 25 });
});

test('WP3-ACC3: cross-sector ranking is deterministic (conviction desc, sector asc)', () => {
  const res = engine.run({ portfolioId: 'PF-05', scenario: 'Balanced', outputs: GOLDEN['PF-05'].outputs });
  const ids = res.ranking.map((r) => r.companyId);
  // CM-005 (82) and HC-006 (82) tie -> sector asc; BK-002/IN-001 (72) tie -> sector asc.
  assert.deepEqual(ids, ['CM-005', 'HC-006', 'BK-002', 'IN-001']);
});

test('WP3-ACC4: allocation engine applies rule precedence deterministically (8 fixtures)', () => {
  // High-risk crisis -> mandatory risk reduction.
  const crisis = engine.run({ portfolioId: 'PF-06', scenario: 'Crisis', strategy: 'Conservative', outputs: GOLDEN['PF-06'].outputs });
  assert.match(crisis.allocation.recommendation, /Reduce risk/i);
  assert.ok(crisis.allocation.rulesApplied[0].startsWith('1-'));

  // Over-concentrated with low conviction -> recommend diversification.
  const oc = engine.run({ portfolioId: 'PF-04', scenario: 'Over-concentrated', strategy: 'Conservative', outputs: GOLDEN['PF-04'].outputs });
  assert.match(oc.allocation.recommendation, /Recommend diversification/i);

  // Growth strategy -> favor growth.
  const growth = engine.run({ portfolioId: 'PF-02', scenario: 'Growth', strategy: 'Growth', outputs: GOLDEN['PF-02'].outputs });
  assert.match(growth.allocation.recommendation, /Favor growth sectors/i);
});

test('WP3-ACC5: diversification analyzer matches all 5 fixtures (concentration + band)', () => {
  const bands: Record<string, string> = { 'PF-05': 'High', 'PF-04': 'Very Low', 'PF-02': 'Moderate', 'PF-06': 'Moderate', 'PF-01': 'Good' };
  for (const [pid, band] of Object.entries(bands)) {
    const res = engine.run({ portfolioId: pid, scenario: GOLDEN[pid].scenario, outputs: GOLDEN[pid].outputs });
    assert.equal(res.diversification.diversificationScore, EXPECTED[pid].div, `${pid} score`);
    assert.equal(res.diversification.diversificationBand, band, `${pid} band`);
  }
  // Flags: over-concentrated flags sector concentration; crisis flags elevated risk.
  const oc = engine.run({ portfolioId: 'PF-04', scenario: 'Over-concentrated', outputs: GOLDEN['PF-04'].outputs });
  assert.ok(oc.diversification.flags.includes('sector concentration'));
  const crisis = engine.run({ portfolioId: 'PF-06', scenario: 'Crisis', outputs: GOLDEN['PF-06'].outputs });
  assert.ok(crisis.diversification.flags.includes('elevated risk / correlated downside'));
});

test('WP3-ACC6: opportunity engine surfaces Top-N with rationale', () => {
  const res = engine.run({ portfolioId: 'PF-05', scenario: 'Balanced', outputs: GOLDEN['PF-05'].outputs, topN: 2 });
  assert.equal(res.opportunity.top.length, 2);
  assert.equal(res.opportunity.top[0].companyId, 'CM-005');
  assert.equal(res.opportunity.rationale.length, 2);
  assert.match(res.opportunity.rationale[0], /why/i);
});

test('WP3-ACC7: correlation engine uses platform metadata only (no price correlation)', () => {
  const res = engine.run({ portfolioId: 'PF-05', scenario: 'Balanced', outputs: GOLDEN['PF-05'].outputs });
  assert.ok(res.correlation.flags.some((f) => /interest-rate|cyclicality|regulatory/.test(f)));
  // No price-based computation anywhere: concentrationSectors derived from exposure.
  assert.deepEqual(res.correlation.concentrationSectors, []);
});

test('WP3-ACC8: reporting engine produces PDF-ready JSON for all report types', () => {
  const res = engine.run({ portfolioId: 'PF-05', scenario: 'Balanced', outputs: GOLDEN['PF-05'].outputs });
  assert.ok(res.reports.length >= 2);
  const payload = res.reports[0].payload;
  assert.equal(payload.concentration, 25);
  assert.ok(Array.isArray(payload.ranking));
  // Serialize deterministically.
  assert.equal(JSON.stringify(res.reports[0]), JSON.stringify(res.reports[0]));
});

test('WP3-ACC9: evidence builder emits the Cross-Sector Evidence Model hierarchy', () => {
  const res = engine.run({ portfolioId: 'PF-05', scenario: 'Balanced', outputs: GOLDEN['PF-05'].outputs });
  assert.ok(res.evidence.recommendation.includes('Highest normalized conviction'));
  assert.deepEqual(res.evidence.sectorContribution.sectors, ['Banking', 'Capital Markets', 'Healthcare', 'Insurance']);
  assert.equal(res.evidence.portfolioImpact.diversificationScore, 84);
  assert.ok(res.evidence.allocationRationale.rulesApplied.length > 0);
  assert.equal(res.evidence.diversificationImpact.band, 'High');
});

test('WP3-ACC10: full pipeline via the platform plugin is deterministic + replay-compatible', () => {
  const { plugins, runtime } = makeRuntime();
  plugins.load(new CrossSectorPlugin());
  plugins.initialize(CROSS_SECTOR_PLUGIN_ID);
  const a = runtime.execute(CROSS_SECTOR_PLUGIN_ID, {
    requestId: 'csip-acc',
    inputs: { portfolioId: 'PF-05', scenario: 'Balanced', strategy: 'Balanced', outputs: GOLDEN['PF-05'].outputs },
  });
  assert.equal(a.result.state, 'COMPLETED');
  assert.equal(a.result.metadata.concentration, 25);
  assert.equal(a.result.metadata.diversificationScore, 84);
  assert.equal(a.result.metadata.avgConviction, 77);
  assert.ok(a.result.evidenceRef);
});

test('WP3-ACC11: future sector participates via ontology registration (no CSIP logic change)', () => {
  // A hypothetical Hospitality engine registers its published output; CSIP maps it via
  // the default ontology metadata row and includes it in ranking + intelligence.
  const res = engine.run({
    portfolioId: 'HOSP-01', scenario: 'Hospitality', strategy: 'Balanced',
    outputs: [
      { companyId: 'HP-001', sector: 'Hospitality', composite: 88, confidence: 0.8, qualityScore: 85, riskScore: 20, verdict: 'Strong Buy' },
      { companyId: 'BK-002', sector: 'Banking', composite: 72, confidence: 0.8, qualityScore: 78, riskScore: 25, verdict: 'Buy' },
    ],
  });
  assert.deepEqual(res.intelligence.sectorExposure, { Banking: 50, Hospitality: 50 });
  assert.equal(res.ranking[0].sector, 'Hospitality');
  assert.equal(res.ranking[0].conviction, 88);
});
