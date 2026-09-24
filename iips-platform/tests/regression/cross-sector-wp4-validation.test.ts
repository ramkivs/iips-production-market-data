/**
 * CSIP WP-4 — Validation, Replay, Regression, Evidence.
 * Validates the implementation against the ACTUAL frozen CSIP reference assets
 * (loaded from the standards repo), covering: golden regression (6/6), replay (5/5
 * assertions), allocation fixtures (8/8), diversification fixtures (5/5), ranking,
 * and cross-sector evidence hierarchy.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CrossSectorEngine } from '../../src/sector-engines/cross-sector/CrossSectorEngine';
import type { EngineOutput } from '../../src/sector-engines/cross-sector/ontology/OntologyMapper';

// Frozen reference assets live in the standards repo (sibling of iips-platform).
const CSIP_DIR = path.resolve(__dirname, '../../../iips-cross-sector');

function readJson(rel: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(CSIP_DIR, rel), 'utf8'));
}

// Golden dataset holdings use normalized fields (conviction/quality/risk) -> convert to
// EngineOutput (composite/qualityScore/riskScore). This mirrors the ontology mapping.
function goldenToOutputs(holdings: any[]): EngineOutput[] {
  return holdings.map((h) => ({
    companyId: h.companyId,
    sector: h.sector,
    composite: h.conviction,
    confidence: h.confidence ?? 0.8,
    qualityScore: h.quality,
    riskScore: h.risk,
  }));
}

const engine = new CrossSectorEngine();

test('WP4-ACC1: golden dataset regression — all 6 frozen expected outputs reproduced exactly', () => {
  const golden = readJson('portfolios/PORTFOLIO_GOLDEN_DATASET.json') as { portfolios: any[] };
  const expected = readJson('expected-outputs/PORTFOLIO_EXPECTED_OUTPUTS.json') as {
    expected: Array<Record<string, any>>;
  };

  for (const p of golden.portfolios) {
    const eo = expected.expected.find((e) => e.portfolioId === p.id)!;
    const res = engine.run({ portfolioId: p.id, scenario: p.scenario, strategy: 'Balanced', outputs: goldenToOutputs(p.holdings) });
    const it = res.intelligence;

    assert.deepEqual(it.sectorExposure, eo.sectorExposure, `${p.id} sectorExposure`);
    assert.equal(it.concentration, eo.concentration, `${p.id} concentration`);
    assert.equal(it.diversificationScore, eo.diversificationScore, `${p.id} diversification`);
    assert.equal(it.avgConviction, eo.avgConviction, `${p.id} avgConviction`);
    assert.equal(it.avgQuality, eo.avgQuality, `${p.id} avgQuality`);
    assert.equal(it.avgRisk, eo.avgRisk, `${p.id} avgRisk`);

    // Ranking matches frozen expected ranking (companyId order).
    const frozenRanking = (eo.ranking as any[]).map((r) => r.companyId);
    const implRanking = res.ranking.map((r) => r.companyId);
    assert.deepEqual(implRanking, frozenRanking, `${p.id} ranking`);
  }
});

test('WP4-ACC2: replay dataset validation — identical rankings/allocations/reports/diversification/evidence (PF-05)', () => {
  const replay = readJson('replay-datasets/PORTFOLIO_REPLAY_DATASET.json') as { holdings: any[]; replayAssertions: string[] };
  const outputs = goldenToOutputs(replay.holdings);
  const run = () => engine.run({ portfolioId: 'PF-05', scenario: 'Balanced', strategy: 'Balanced', outputs });
  const a = run();
  const b = run();
  const assertions = replay.replayAssertions;

  if (assertions.includes('identical rankings')) assert.deepEqual(a.ranking, b.ranking);
  if (assertions.includes('identical allocations')) assert.deepEqual(a.allocation, b.allocation);
  if (assertions.includes('identical reports')) assert.equal(JSON.stringify(a.reports), JSON.stringify(b.reports));
  if (assertions.includes('identical diversification scores')) assert.equal(a.diversification.diversificationScore, b.diversification.diversificationScore);
  if (assertions.includes('identical evidence')) assert.equal(JSON.stringify(a.evidence), JSON.stringify(b.evidence));
});

test('WP4-ACC3: allocation fixtures — all 8 expected actions reproduced', () => {
  const fx = readJson('fixtures/ALLOCATION_FIXTURES.json') as { scenarios: Array<{ id: string; scenario: string; strategy: string; expectedAction: string }> };

  // Representative portfolios per allocation scenario (published engine outputs).
  const casePf: Record<string, { strategy: string; outputs: EngineOutput[] }> = {
    'ALLOC-01': { strategy: 'Balanced', outputs: [
      { companyId: 'BK-001', sector: 'Banking', composite: 58, confidence: 0.8, qualityScore: 55, riskScore: 30, verdict: 'Accumulate' },
      { companyId: 'BK-002', sector: 'Banking', composite: 55, confidence: 0.8, qualityScore: 52, riskScore: 32, verdict: 'Accumulate' },
      { companyId: 'BK-003', sector: 'Banking', composite: 52, confidence: 0.8, qualityScore: 50, riskScore: 34, verdict: 'Accumulate' },
      { companyId: 'IN-001', sector: 'Insurance', composite: 58, confidence: 0.8, qualityScore: 55, riskScore: 22, verdict: 'Accumulate' },
    ] },
    'ALLOC-02': { strategy: 'Balanced', outputs: [
      { companyId: 'CM-001', sector: 'Capital Markets', composite: 70, confidence: 0.8, qualityScore: 68, riskScore: 30, verdict: 'Buy' },
      { companyId: 'CM-002', sector: 'Capital Markets', composite: 68, confidence: 0.8, qualityScore: 66, riskScore: 32, verdict: 'Buy' },
      { companyId: 'IN-001', sector: 'Insurance', composite: 66, confidence: 0.8, qualityScore: 64, riskScore: 24, verdict: 'Buy' },
    ] },
    'ALLOC-03': { strategy: 'Conservative', outputs: [
      { companyId: 'BK-001', sector: 'Banking', composite: 40, confidence: 0.8, qualityScore: 42, riskScore: 45, verdict: 'Watch' },
      { companyId: 'BK-002', sector: 'Banking', composite: 38, confidence: 0.8, qualityScore: 40, riskScore: 48, verdict: 'Watch' },
      { companyId: 'BK-003', sector: 'Banking', composite: 36, confidence: 0.8, qualityScore: 38, riskScore: 50, verdict: 'Watch' },
    ] },
    'ALLOC-04': { strategy: 'Growth', outputs: [
      { companyId: 'BK-001', sector: 'Banking', composite: 80, confidence: 0.8, qualityScore: 78, riskScore: 28, verdict: 'Strong Buy' },
      { companyId: 'BK-002', sector: 'Banking', composite: 78, confidence: 0.8, qualityScore: 76, riskScore: 30, verdict: 'Buy' },
      { companyId: 'BK-003', sector: 'Banking', composite: 75, confidence: 0.8, qualityScore: 74, riskScore: 32, verdict: 'Buy' },
    ] },
    'ALLOC-05': { strategy: 'Balanced', outputs: [
      { companyId: 'BK-002', sector: 'Banking', composite: 72, confidence: 0.8, qualityScore: 78, riskScore: 25, verdict: 'Buy' },
      { companyId: 'IN-001', sector: 'Insurance', composite: 72, confidence: 0.8, qualityScore: 75, riskScore: 20, verdict: 'Accumulate' },
      { companyId: 'CM-005', sector: 'Capital Markets', composite: 82, confidence: 0.8, qualityScore: 80, riskScore: 30, verdict: 'Buy' },
      { companyId: 'HC-006', sector: 'Healthcare', composite: 82, confidence: 0.8, qualityScore: 80, riskScore: 35, verdict: 'Strong Buy' },
    ] },
    'ALLOC-06': { strategy: 'Conservative', outputs: [
      { companyId: 'BK-005', sector: 'Banking', composite: 34, confidence: 0.8, qualityScore: 40, riskScore: 70, verdict: 'Avoid' },
      { companyId: 'IN-005', sector: 'Insurance', composite: 34, confidence: 0.8, qualityScore: 35, riskScore: 75, verdict: 'Avoid' },
    ] },
    'ALLOC-07': { strategy: 'Income', outputs: [
      { companyId: 'BK-002', sector: 'Banking', composite: 72, confidence: 0.8, qualityScore: 78, riskScore: 25, verdict: 'Buy' },
      { companyId: 'IN-001', sector: 'Insurance', composite: 72, confidence: 0.8, qualityScore: 75, riskScore: 20, verdict: 'Accumulate' },
    ] },
    'ALLOC-08': { strategy: 'Growth', outputs: [
      { companyId: 'CM-006', sector: 'Capital Markets', composite: 85, confidence: 0.8, qualityScore: 82, riskScore: 40, verdict: 'Buy' },
      { companyId: 'HC-006', sector: 'Healthcare', composite: 82, confidence: 0.8, qualityScore: 80, riskScore: 35, verdict: 'Strong Buy' },
    ] },
  };

  for (const s of fx.scenarios) {
    const spec = casePf[s.id];
    assert.ok(spec, `no representative portfolio for ${s.id}`);
    const res = engine.run({ portfolioId: s.id, scenario: s.scenario, strategy: spec.strategy as any, outputs: spec.outputs });
    assert.ok(
      res.allocation.recommendation.toLowerCase().includes(s.expectedAction.toLowerCase()),
      `${s.id}: expected "${s.expectedAction}" got "${res.allocation.recommendation}"`,
    );
  }
});

test('WP4-ACC4: diversification fixtures — all 5 expected concentration + band reproduced', () => {
  const fx = readJson('fixtures/DIVERSIFICATION_FIXTURES.json') as {
    scenarios: Array<{ id: string; portfolio: string; expectedConcentration: number; expectedDiversification: string; detect: string }>;
  };
  const golden = readJson('portfolios/PORTFOLIO_GOLDEN_DATASET.json') as { portfolios: any[] };
  // Map fixture portfolio label (e.g. "PF-05 ...") to golden portfolio id.
  for (const s of fx.scenarios) {
    const pid = s.portfolio.split(' ')[0];
    const p = golden.portfolios.find((g) => g.id === pid)!;
    const res = engine.run({ portfolioId: pid, scenario: p.scenario, outputs: goldenToOutputs(p.holdings) });
    assert.equal(res.diversification.concentration, s.expectedConcentration, `${s.id} concentration`);
    assert.equal(res.diversification.diversificationBand, s.expectedDiversification, `${s.id} band`);
    assert.ok(res.diversification.flags.length > 0, `${s.id} has a detection flag`);
  }
});

test('WP4-ACC5: cross-sector evidence hierarchy validated', () => {
  const golden = readJson('portfolios/PORTFOLIO_GOLDEN_DATASET.json') as { portfolios: any[] };
  const p = golden.portfolios.find((g) => g.id === 'PF-05')!;
  const res = engine.run({ portfolioId: 'PF-05', scenario: p.scenario, outputs: goldenToOutputs(p.holdings) });
  const ev = res.evidence;
  // Hierarchy: Recommendation -> Sector Contribution -> Portfolio Impact -> Allocation Rationale -> Diversification Impact.
  assert.ok(ev.recommendation.length > 0);
  assert.ok(ev.sectorContribution.sectors.length >= 1);
  assert.ok(ev.sectorContribution.engineVersions.length === 4);
  assert.equal(typeof ev.portfolioImpact.concentration, 'number');
  assert.ok(ev.allocationRationale.rulesApplied.length > 0);
  assert.ok(ev.diversificationImpact.band.length > 0);
  // Why-this-stock / why-this-sector present in opportunity rationale.
  assert.match(res.opportunity.rationale[0], /Why-this-stock/);
  assert.match(res.opportunity.rationale[0], /Why-this-sector/);
});

test('WP4-ACC6: deterministic repeatability across full pipeline runs', () => {
  const golden = readJson('portfolios/PORTFOLIO_GOLDEN_DATASET.json') as { portfolios: any[] };
  const p = golden.portfolios.find((g) => g.id === 'PF-05')!;
  const run = () => engine.run({ portfolioId: 'PF-05', scenario: p.scenario, strategy: 'Balanced', outputs: goldenToOutputs(p.holdings) });
  assert.equal(JSON.stringify(run()), JSON.stringify(run()));
});
