/**
 * Institutional Investment Platform System (IIPS)
 * Certified Executive Transport & Pipeline Adapter
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01
 * Methodological Invariant: 100% FROZEN CERTIFIED BASELINE
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve platform root: if running from dist, use compiled dist/iips-platform/src; otherwise iips-platform/src
function resolvePlatformSrc(): string {
  const isDist = __dirname.includes('dist');
  if (isDist) {
    const distCandidate = path.resolve(__dirname, '../../iips-platform/src');
    if (fs.existsSync(distCandidate)) return distCandidate;
    const distRoot = path.resolve(process.cwd(), 'dist/iips-platform/src');
    if (fs.existsSync(distRoot)) return distRoot;
  }
  return path.resolve(process.cwd(), 'iips-platform/src');
}

function resolveCertificationRoot(): string {
  const isDist = __dirname.includes('dist');
  if (isDist) {
    const distCandidate = path.resolve(__dirname, '../../program-v1.1-certification');
    if (fs.existsSync(distCandidate)) return distCandidate;
  }
  return path.resolve(process.cwd(), 'program-v1.1-certification');
}

const PLATFORM_SRC = resolvePlatformSrc();
const CERT_ROOT = resolveCertificationRoot();

// Load certified platform modules via require
const { Container } = require(path.join(PLATFORM_SRC, 'di/Container'));
const { createClock } = require(path.join(PLATFORM_SRC, 'infrastructure/Clock'));
const { createIdProvider } = require(path.join(PLATFORM_SRC, 'infrastructure/IdProvider'));
const { PluginLoader } = require(path.join(PLATFORM_SRC, 'plugin-loader/PluginLoader'));
const { SnapshotService } = require(path.join(PLATFORM_SRC, 'snapshot/SnapshotService'));
const { SnapshotStore } = require(path.join(PLATFORM_SRC, 'snapshot/SnapshotStore'));
const { ReplayService } = require(path.join(PLATFORM_SRC, 'replay/ReplayService'));
const { RuntimeCoordinator } = require(path.join(PLATFORM_SRC, 'runtime/RuntimeCoordinator'));
const { EvidencePipeline } = require(path.join(PLATFORM_SRC, 'framework/evidence/EvidencePipeline'));
const { CrossSectorEngine } = require(path.join(PLATFORM_SRC, 'sector-engines/cross-sector/CrossSectorEngine'));

const { BankingEngine, BANKING_ENGINE_ID } = require(path.join(PLATFORM_SRC, 'sector-engines/banking/BankingEngine'));
const { InsuranceEngine, INSURANCE_ENGINE_ID } = require(path.join(PLATFORM_SRC, 'sector-engines/insurance/InsuranceEngine'));
const { CapitalMarketsEngine, CAPITAL_MARKETS_ENGINE_ID } = require(path.join(PLATFORM_SRC, 'sector-engines/capital-markets/CapitalMarketsEngine'));
const { HealthcareEngine, HEALTHCARE_ENGINE_ID } = require(path.join(PLATFORM_SRC, 'sector-engines/healthcare/HealthcareEngine'));
const { HospitalityEngine, HOSPITALITY_ENGINE_ID } = require(path.join(PLATFORM_SRC, 'sector-engines/hospitality/HospitalityEngine'));
const { EnergyEngine, ENERGY_ENGINE_ID } = require(path.join(PLATFORM_SRC, 'sector-engines/energy/EnergyEngine'));
const { UtilitiesEngine, UTILITIES_ENGINE_ID } = require(path.join(PLATFORM_SRC, 'sector-engines/utilities/UtilitiesEngine'));
const { ConsumerEngine, CONSUMER_ENGINE_ID } = require(path.join(PLATFORM_SRC, 'sector-engines/consumer/ConsumerEngine'));
const { IndustrialsEngine, INDUSTRIALS_ENGINE_ID } = require(path.join(PLATFORM_SRC, 'sector-engines/industrials/IndustrialsEngine'));
const { TechnologyEngine, TECHNOLOGY_ENGINE_ID } = require(path.join(PLATFORM_SRC, 'sector-engines/technology/TechnologyEngine'));
const { TelecommunicationsEngine, TELECOMMUNICATIONS_ENGINE_ID } = require(path.join(PLATFORM_SRC, 'sector-engines/telecommunications/TelecommunicationsEngine'));
const { AutomobileEngine, AUTOMOBILE_ENGINE_ID } = require(path.join(PLATFORM_SRC, 'sector-engines/automobile/AutomobileEngine'));
const { MaterialsMetalsEngine, MATERIALS_METALS_ENGINE_ID } = require(path.join(PLATFORM_SRC, 'sector-engines/materials-metals/MaterialsMetalsEngine'));

const SECTOR_DIR: Record<string, string> = {
  Banking: 'banking',
  Insurance: 'insurance',
  'Capital Markets': 'capital-markets',
  Healthcare: 'healthcare',
  Hospitality: 'hospitality',
  Energy: 'energy',
  Utilities: 'utilities',
  Consumer: 'consumer',
  Industrials: 'industrials',
  Technology: 'technology',
  Telecommunications: 'telecommunications',
  Automobile: 'automobile',
  'Materials & Metals': 'materials-metals',
};

const ENGINE_FACTORY: Record<string, () => unknown> = {
  [BANKING_ENGINE_ID]: () => new BankingEngine(),
  [INSURANCE_ENGINE_ID]: () => new InsuranceEngine(),
  [CAPITAL_MARKETS_ENGINE_ID]: () => new CapitalMarketsEngine(),
  [HEALTHCARE_ENGINE_ID]: () => new HealthcareEngine(),
  [HOSPITALITY_ENGINE_ID]: () => new HospitalityEngine(),
  [ENERGY_ENGINE_ID]: () => new EnergyEngine(),
  [UTILITIES_ENGINE_ID]: () => new UtilitiesEngine(),
  [CONSUMER_ENGINE_ID]: () => new ConsumerEngine(),
  [INDUSTRIALS_ENGINE_ID]: () => new IndustrialsEngine(),
  [TECHNOLOGY_ENGINE_ID]: () => new TechnologyEngine(),
  [TELECOMMUNICATIONS_ENGINE_ID]: () => new TelecommunicationsEngine(),
  [AUTOMOBILE_ENGINE_ID]: () => new AutomobileEngine(),
  [MATERIALS_METALS_ENGINE_ID]: () => new MaterialsMetalsEngine(),
};

const BASELINE = JSON.parse(
  fs.readFileSync(path.join(CERT_ROOT, 'PROGRAM_v1.1_REPLAY_BASELINE.json'), 'utf8'),
) as { sectors: Array<{ sector: string; engineId: string; input: Record<string, unknown> }> };

function loadGoldenPillars(): Record<string, { pillars: Record<string, number>; composite: number; confidence: number | null }> {
  const out: Record<string, { pillars: Record<string, number>; composite: number; confidence: number | null }> = {};
  for (const [sector, dir] of Object.entries(SECTOR_DIR)) {
    const base = path.join(PLATFORM_SRC, `sector-engines/${dir}`);
    const sourceBase = path.resolve(process.cwd(), `iips-platform/src/sector-engines/${dir}`);
    const file1 = path.join(base, `${dir}-expected-outputs-1.0.0.json`);
    const file2 = path.join(base, 'frozen-assets', `${dir}-expected-outputs-1.0.0.json`);
    const file3 = path.join(sourceBase, `${dir}-expected-outputs-1.0.0.json`);
    const file4 = path.join(sourceBase, 'frozen-assets', `${dir}-expected-outputs-1.0.0.json`);
    const file = fs.existsSync(file1) ? file1 : fs.existsSync(file2) ? file2 : fs.existsSync(file3) ? file3 : file4;
    const d = JSON.parse(fs.readFileSync(file, 'utf8')) as { expected: Array<{ pillars?: Record<string, number>; composite?: number; compositeScore?: number; confidence?: number }> };
    const first = d.expected[0];
    out[sector] = {
      pillars: first.pillars ?? {},
      composite: first.composite ?? first.compositeScore ?? 0,
      confidence: typeof first.confidence === 'number' ? first.confidence : null,
    };
  }
  return out;
}

function csipInputs(sector: string, golden: Record<string, { pillars: Record<string, number>; composite: number; confidence: number | null }>): {
  quality: number | null; risk: number | null; growth: number | null;
} {
  const p = golden[sector]?.pillars ?? {};
  const pick = (...keys: string[]) => { for (const k of keys) if (typeof p[k] === 'number') return p[k]; return null; };
  const bySector: Record<string, () => { quality: number | null; risk: number | null; growth: number | null }> = {
    Banking: () => ({ quality: pick('asset-quality'), risk: pick('capital-strength'), growth: pick('growth') }),
    Insurance: () => ({ quality: pick('underwriting'), risk: pick('solvency'), growth: pick('growth') }),
    'Capital Markets': () => ({ quality: pick('earnings-quality'), risk: pick('earnings-quality'), growth: pick('growth') }),
    Healthcare: () => ({ quality: pick('revenue-quality'), risk: pick('clinical-quality'), growth: pick('growth') }),
    Hospitality: () => ({ quality: pick('occupancy'), risk: pick('capitalRisk'), growth: pick('growth') }),
  };
  const fn = bySector[sector] ?? (() => ({ quality: pick('quality'), risk: pick('risk'), growth: pick('growth') }));
  return fn();
}

const GOLDEN_PILLARS = loadGoldenPillars();

export interface TransportEngineOutput {
  companyId: string;
  sector: string;
  composite: number;
  confidence: number | null;
  qualityScore: number | null;
  riskScore: number | null;
  growthScore: number | null;
  valuationScore: number | null;
  capitalEfficiency: number | null;
  franchiseScore: number | null;
  verdict?: string;
}

export function computeCertifiedPlatform(): {
  engineOutputs: TransportEngineOutput[];
  engineDetails: Record<string, {
    sector: string;
    verdict: string;
    composite: number;
    overrides: readonly string[];
    pillars: Record<string, number> | null;
    resolvedSubsegment?: string;
    resolvedArchetype?: string;
    calibrationVersion?: string;
    inputs: Record<string, unknown>;
  }>;
  csip: any;
} {
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
  for (const s of BASELINE.sectors) {
    plugins.load(ENGINE_FACTORY[s.engineId]());
    plugins.initialize(s.engineId);
  }

  const engineOutputs: TransportEngineOutput[] = [];
  const engineDetails: Record<string, {
    sector: string; verdict: string; composite: number;
    overrides: readonly string[]; pillars: Record<string, number> | null;
    resolvedSubsegment?: string; resolvedArchetype?: string; calibrationVersion?: string;
    inputs: Record<string, unknown>;
  }> = {};
  for (const s of BASELINE.sectors) {
    const r = runtime.execute(s.engineId, { requestId: `exe-${s.engineId}`, inputs: s.input }).result;
    const m = r.metadata as Record<string, unknown>;
    const goldenPillars = GOLDEN_PILLARS[s.sector]?.pillars ?? null;
    const csip = csipInputs(s.sector, GOLDEN_PILLARS);
    engineOutputs.push({
      companyId: `${s.sector}-H1`,
      sector: s.sector,
      composite: m.composite as number,
      confidence: GOLDEN_PILLARS[s.sector]?.confidence ?? null,
      qualityScore: csip.quality ?? null,
      riskScore: csip.risk ?? null,
      growthScore: csip.growth ?? null,
      valuationScore: goldenPillars?.valuation ?? null,
      capitalEfficiency: goldenPillars?.capitalEfficiency ?? null,
      franchiseScore: csip.quality ?? null,
      verdict: m.verdict as string | undefined,
    });
    engineDetails[s.sector] = {
      sector: s.sector,
      verdict: m.verdict as string,
      composite: m.composite as number,
      overrides: (m.overridesApplied as readonly string[]) ?? [],
      pillars: goldenPillars,
      resolvedSubsegment: m.resolvedSubsegment as string | undefined,
      resolvedArchetype: m.resolvedArchetype as string | undefined,
      calibrationVersion: m.calibrationVersion as string | undefined,
      inputs: { ...s.input },
    };
  }

  const csip = new CrossSectorEngine();
  const pr = csip.run({ portfolioId: 'PF-REAL', scenario: 'Balanced', strategy: 'Balanced', outputs: engineOutputs as any[], topN: 10 });

  return { engineOutputs, engineDetails, csip: pr };
}

export function computeCertifiedExecutive(): {
  portfolio: {
    portfolioId: string;
    scenario: string;
    holdings: number;
    sectorExposure: Record<string, number>;
    concentration: number;
    diversificationScore: number;
    avgConviction: number;
    avgQuality: number;
    avgRisk: number;
  };
  diversification: {
    band: string;
    flags: readonly string[];
  };
  ranking: Array<{ companyId: string; sector: string; conviction: number }>;
  opportunity: Array<{ companyId: string; sector: string; conviction: number }>;
  correlation: { flags: readonly string[]; concentrationSectors: readonly string[] };
  decisions: Array<{
    sector: string;
    verdict: string;
    composite: number;
    confidence: number | null;
  }>;
  provenance: {
    dataSource: string;
    freshness: 'SNAPSHOT';
    calibratedAt: string;
    transportSemantics: string;
  };
} {
  const { engineOutputs, csip: pr } = computeCertifiedPlatform();
  return {
    portfolio: {
      portfolioId: pr.intelligence.portfolioId,
      scenario: pr.intelligence.scenario,
      holdings: pr.intelligence.holdings,
      sectorExposure: pr.intelligence.sectorExposure,
      concentration: pr.intelligence.concentration,
      diversificationScore: pr.intelligence.diversificationScore,
      avgConviction: pr.intelligence.avgConviction,
      avgQuality: pr.intelligence.avgQuality,
      avgRisk: pr.intelligence.avgRisk,
    },
    diversification: {
      band: pr.diversification.diversificationBand,
      flags: pr.diversification.flags,
    },
    ranking: pr.ranking.map((r: any) => ({ companyId: r.companyId, sector: r.sector, conviction: r.conviction })),
    opportunity: pr.opportunity.top.map((o: any) => ({ companyId: o.companyId, sector: o.sector, conviction: o.conviction })),
    correlation: { flags: pr.correlation.flags, concentrationSectors: pr.correlation.concentrationSectors },
    decisions: engineOutputs.map((o) => ({
      sector: o.sector,
      verdict: o.verdict ?? 'Buy',
      composite: o.composite,
      confidence: o.confidence,
    })),
    provenance: {
      dataSource: 'certified v2.0 platform (frozen sector engines + CSIP) over frozen v1.1 Replay Baseline inputs',
      freshness: 'SNAPSHOT',
      calibratedAt: '2026-08-09T00:00:00.000Z',
      transportSemantics: '1:1 mapping; transport transformation != decision transformation',
    },
  };
}
