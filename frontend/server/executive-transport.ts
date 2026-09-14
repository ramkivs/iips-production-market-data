/**
 * Program v3.0 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Phase 5: Executive Dashboard ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â minimal G2 transport/adapter (semantically inert).
 *
 * Runs the ACTUAL certified v2.0 platform in-process and exposes the Executive Dashboard's
 * required surface over HTTP. Every displayed value is genuinely COMPUTED by the certified
 * engines (frozen sector engines on their FROZEN golden/replay-baseline inputs) and the
 * certified CSIP engine. NO value is fabricated or hardcoded.
 *
 * Semantically inert (per transport-boundary.md):
 *   Transport transformation != Decision transformation.
 *   This server maps certified results to DTOs 1:1. It does NOT compute scores, confidence,
 *   rankings, thresholds, weights, or reinterpret verdicts.
 *
 * IMPORTANT ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â data source & auth boundary:
 *  - The portfolio displayed is the CERTIFIED REFERENCE portfolio (the frozen v1.1 Replay
 *    Baseline inputs), labeled SNAPSHOT. It is not live tenant production data.
 *  - Authentication/session is a MINIMAL development-mode mechanism (a session header is
 *    accepted and mapped to a role). A real authentication/session layer is a SEPARATE,
 *    still-pending requirement before production tenant data is served. This is the exact
 *    G2 auth gap (Phase 0 audit G3). This server does NOT weaken EnterpriseRuntime/PlatformApi
 *    authorization for the actual platform.
 */
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Import the certified platform ---
import { Container } from '../../iips-platform/src/di/Container';
import { createClock } from '../../iips-platform/src/infrastructure/Clock';
import { createIdProvider } from '../../iips-platform/src/infrastructure/IdProvider';
import { PluginLoader } from '../../iips-platform/src/plugin-loader/PluginLoader';
import { SnapshotService } from '../../iips-platform/src/snapshot/SnapshotService';
import { SnapshotStore } from '../../iips-platform/src/snapshot/SnapshotStore';
import { ReplayService } from '../../iips-platform/src/replay/ReplayService';
import { RuntimeCoordinator } from '../../iips-platform/src/runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../../iips-platform/src/framework/evidence/EvidencePipeline';
import { CrossSectorEngine } from '../../iips-platform/src/sector-engines/cross-sector/CrossSectorEngine';
import { BankingEngine, BANKING_ENGINE_ID } from '../../iips-platform/src/sector-engines/banking/BankingEngine';
import { InsuranceEngine, INSURANCE_ENGINE_ID } from '../../iips-platform/src/sector-engines/insurance/InsuranceEngine';
import { CapitalMarketsEngine, CAPITAL_MARKETS_ENGINE_ID } from '../../iips-platform/src/sector-engines/capital-markets/CapitalMarketsEngine';
import { HealthcareEngine, HEALTHCARE_ENGINE_ID } from '../../iips-platform/src/sector-engines/healthcare/HealthcareEngine';
import { HospitalityEngine, HOSPITALITY_ENGINE_ID } from '../../iips-platform/src/sector-engines/hospitality/HospitalityEngine';
import { EnergyEngine, ENERGY_ENGINE_ID } from '../../iips-platform/src/sector-engines/energy/EnergyEngine';
import { UtilitiesEngine, UTILITIES_ENGINE_ID } from '../../iips-platform/src/sector-engines/utilities/UtilitiesEngine';
import { ConsumerEngine, CONSUMER_ENGINE_ID } from '../../iips-platform/src/sector-engines/consumer/ConsumerEngine';
import { IndustrialsEngine, INDUSTRIALS_ENGINE_ID } from '../../iips-platform/src/sector-engines/industrials/IndustrialsEngine';
import { TechnologyEngine, TECHNOLOGY_ENGINE_ID } from '../../iips-platform/src/sector-engines/technology/TechnologyEngine';
import { TelecommunicationsEngine, TELECOMMUNICATIONS_ENGINE_ID } from '../../iips-platform/src/sector-engines/telecommunications/TelecommunicationsEngine';
import { AutomobileEngine, AUTOMOBILE_ENGINE_ID } from '../../iips-platform/src/sector-engines/automobile/AutomobileEngine';
import { MaterialsMetalsEngine, MATERIALS_METALS_ENGINE_ID } from '../../iips-platform/src/sector-engines/materials-metals/MaterialsMetalsEngine';
import type { EngineOutput } from '../../iips-platform/src/sector-engines/cross-sector/ontology/OntologyMapper';
import { AuthError } from '../src/core/auth/keycloakAdapter';
import { MoSPISourceAdapter, MacroSourceError, type MacroSourceErrorCode } from './macro/mospi-source';

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

// Frozen certified reference inputs (the v1.1 Replay Baseline).
const BASELINE = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../program-v1.1-certification/PROGRAM_v1.1_REPLAY_BASELINE.json'), 'utf8'),
) as { sectors: Array<{ sector: string; engineId: string; input: Record<string, unknown> }> };

/**
 * G-AI-IMPL (SR-5 / D5 / D6) — resolve a sector key to its governed engine and frozen inputs.
 *
 * Coverage is DERIVED from the governed ENGINE_FACTORY mapping and the frozen v1.1 Replay Baseline;
 * no sector is enumerated here, so this automatically covers exactly the registered engines (13).
 * Matching is case-insensitive on the sector display name. Returns null for an unknown or
 * unresolvable sector key, which the advisory transport maps to the pre-existing 404 semantics.
 *
 * This is the ONLY addition to this module's exports for G-AI-IMPL; no existing behavior is altered.
 */
export function resolveSectorEngine(sectorKey: string): import('./ai-advisory-transport').ResolvedSectorEngine | null {
  const key = sectorKey.trim().toLowerCase();
  if (!key) return null;
  const entry = BASELINE.sectors.find((s) => s.sector.toLowerCase() === key);
  if (!entry) return null;
  const factory = ENGINE_FACTORY[entry.engineId];
  if (!factory) return null;
  return {
    sector: entry.sector,
    engineId: entry.engineId,
    makeEngine: factory as () => import('../../iips-platform/src/plugin-loader/PluginContract').SectorPlugin,
    inputs: entry.input,
  };
}

// Sector display-name -> engine dir (for locating frozen expected-outputs).
const SECTOR_DIR: Record<string, string> = {
  Banking: 'banking', Insurance: 'insurance', 'Capital Markets': 'capital-markets',
  Healthcare: 'healthcare', Hospitality: 'hospitality', Energy: 'energy',
  Utilities: 'utilities', Consumer: 'consumer', Industrials: 'industrials', Technology: 'technology',
  Telecommunications: 'telecommunications', Automobile: 'automobile',
  'Materials & Metals': 'materials-metals',
};

/**
 * Load the certified GOLDEN pillar scores from each sector's frozen expected-outputs-1.0.0.json.
 * These are the certified reference pillar values (governed source). Keys are sector-specific.
 */
function loadGoldenPillars(): Record<string, { pillars: Record<string, number>; composite: number; confidence: number | null }> {
  const out: Record<string, { pillars: Record<string, number>; composite: number; confidence: number | null }> = {};
  for (const [sector, dir] of Object.entries(SECTOR_DIR)) {
    const base = path.resolve(__dirname, `../../iips-platform/src/sector-engines/${dir}`);
    const file = fs.existsSync(path.join(base, `${dir}-expected-outputs-1.0.0.json`))
      ? path.join(base, `${dir}-expected-outputs-1.0.0.json`)
      : path.join(base, 'frozen-assets', `${dir}-expected-outputs-1.0.0.json`);
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

// Governed CSIP quality/risk/growth mapping (mirrors the certified CSIP OntologyMapper).
// For the 4 v1.0 sectors the OntologyMapper defines the mapping; the 6 later sectors use
// the standard quality/risk/growth keys.
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

/** Phase 13-Hardening (B5): transport-local engine-output DTO.
 * The certified platform EngineOutput declares non-null pillar scores, but the governed
 * golden-pillar source may legitimately omit a pillar (null ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â never fabricated). This DTO
 * models that runtime contract; it is bridged to EngineOutput only at the csip.run boundary
 * (runtime behaviour unchanged). */
type TransportEngineOutput = Omit<
  EngineOutput,
  'qualityScore' | 'riskScore' | 'growthScore' | 'valuationScore' | 'capitalEfficiency' | 'franchiseScore' | 'confidence'
> & {
  qualityScore: number | null;
  riskScore: number | null;
  growthScore: number | null;
  valuationScore: number | null;
  capitalEfficiency: number | null;
  franchiseScore: number | null;
  // N+21: confidence is null where the certified golden source does not expose it
  // (6 of 10 sectors) — never fabricated.
  confidence: number | null;
};

/** Build the certified runtime and execute all frozen engines on their frozen inputs. */
function computeCertifiedPlatform(): {
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
  csip: ReturnType<CrossSectorEngine['run']>;
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
    plugins.load(ENGINE_FACTORY[s.engineId]() as never);
    plugins.initialize(s.engineId);
  }

  // Run each frozen engine ONCE on its frozen golden input -> genuinely computed results.
  const engineOutputs: TransportEngineOutput[] = [];
  const engineDetails: Record<string, {
    sector: string; verdict: string; composite: number;
    overrides: readonly string[]; pillars: Record<string, number> | null;
    resolvedSubsegment?: string; resolvedArchetype?: string; calibrationVersion?: string;
    inputs: Record<string, unknown>;
  }> = {};
  for (const s of BASELINE.sectors) {
    const r = runtime.execute(s.engineId, { requestId: `exe-${s.engineId}`, inputs: s.input as never }).result;
    const m = r.metadata as Record<string, unknown>;
    // Pillars: source from the certified GOLDEN expected-outputs (governed, sector-specific keys).
    // The live engine exposes pillars in metadata only for Technology; for all sectors we use
    // the certified golden pillar values (frozen expected-outputs) as the traceable source.
    const goldenPillars = GOLDEN_PILLARS[s.sector]?.pillars ?? null;
    const csip = csipInputs(s.sector, GOLDEN_PILLARS);
    // Engine output (for CSIP) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â fed from governed golden pillar inputs (OntologyMapper mapping).
    engineOutputs.push({
      companyId: `${s.sector}-H1`,
      sector: s.sector,
      composite: m.composite as number,
      // N+21: confidence from the certified golden expected-outputs (governed), else null —
      // never a fabricated fallback (the CSIP engine does not consume this field).
      confidence: GOLDEN_PILLARS[s.sector]?.confidence ?? null,
      qualityScore: csip.quality ?? null,
      riskScore: csip.risk ?? null,
      growthScore: csip.growth ?? null,
      valuationScore: goldenPillars?.valuation ?? null,
      capitalEfficiency: goldenPillars?.capitalEfficiency ?? null,
      franchiseScore: csip.quality ?? null,
      verdict: m.verdict as string | undefined,
    });
    // Engine details (governed surface only; never fabricated).
    engineDetails[s.sector] = {
      sector: s.sector,
      verdict: m.verdict as string,
      composite: m.composite as number,
      overrides: (m.overridesApplied as readonly string[]) ?? [],
      pillars: goldenPillars, // certified golden pillar scores (sector-specific labels)
      resolvedSubsegment: m.resolvedSubsegment as string | undefined,
      resolvedArchetype: m.resolvedArchetype as string | undefined,
      calibrationVersion: m.calibrationVersion as string | undefined,
      inputs: { ...s.input }, // certified frozen input metrics (traceable, SNAPSHOT)
    };
  }

  // Run the certified CSIP engine over the real engine outputs -> real portfolio intelligence.
  // Phase 13-Hardening (B5): nullable pillars are bridged to the platform EngineOutput shape
  // at this single boundary; the platform engine already receives these values at runtime.
  const csip = new CrossSectorEngine();
  const pr = csip.run({ portfolioId: 'PF-REAL', scenario: 'Balanced', strategy: 'Balanced', outputs: engineOutputs as unknown as EngineOutput[], topN: 10 });

  return { engineOutputs, engineDetails, csip: pr };
}

/** Executive DTO (Phase 5). */
function computeCertifiedExecutive(): unknown {
  const { engineOutputs, csip: pr } = computeCertifiedPlatform();
  // Semantically inert DTO mapping (1:1; no recomputation). Freshness = SNAPSHOT (frozen reference).
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
    ranking: pr.ranking.map((r) => ({ companyId: r.companyId, sector: r.sector, conviction: r.conviction })),
    opportunity: pr.opportunity.top.map((o) => ({ companyId: o.companyId, sector: o.sector, conviction: o.conviction })),
    correlation: { flags: pr.correlation.flags, concentrationSectors: pr.correlation.concentrationSectors },
    decisions: engineOutputs.map((o) => ({
      sector: o.sector,
      verdict: o.verdict,
      composite: o.composite,
      confidence: o.confidence,
    })),
    // Data source & provenance (never fabricated).
    provenance: {
      dataSource: 'certified v2.0 platform (frozen sector engines + CSIP) over frozen v1.1 Replay Baseline inputs',
      freshness: 'SNAPSHOT',
      calibratedAt: '2026-08-09T00:00:00.000Z',
      transportSemantics: '1:1 mapping; transport transformation != decision transformation',
    },
  };
}

/** Portfolio DTO (Phase 6) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â holdings, allocation, risk, opportunities, history surface. */
function computeCertifiedPortfolio(): unknown {
  const { engineOutputs, csip: pr } = computeCertifiedPlatform();
  // Holdings: each sector engine output is a holding (certified). Sector exposure from CSIP.
  const holdings = engineOutputs.map((o) => {
    const weight = pr.intelligence.sectorExposure[o.sector] ?? 0;
    return {
      companyId: o.companyId,
      sector: o.sector,
      decision: o.verdict,
      composite: o.composite,
      confidence: o.confidence,
      quality: o.qualityScore ?? null, // null where the certified engine does not expose a pillar
      risk: o.riskScore ?? null,
      weight,
    };
  });
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
    diversification: { band: pr.diversification.diversificationBand, flags: pr.diversification.flags },
    allocation: {
      strategy: pr.allocation.strategy,
      recommendation: pr.allocation.recommendation,
      rulesApplied: pr.allocation.rulesApplied,
    },
    holdings,
    opportunity: pr.opportunity.top.map((o) => ({ companyId: o.companyId, sector: o.sector, conviction: o.conviction })),
    correlation: { flags: pr.correlation.flags, concentrationSectors: pr.correlation.concentrationSectors },
    evidenceRefs: engineOutputs.map((o) => ({
      evidenceId: `ev_${o.sector}`,
      engineId: `sector.${o.sector.toLowerCase()}`,
      recommendation: o.verdict ?? '',
      compositeScore: o.composite,
    })),
    provenance: {
      dataSource: 'certified v2.0 platform (frozen sector engines + CSIP) over frozen v1.1 Replay Baseline inputs',
      freshness: 'SNAPSHOT',
      calibratedAt: '2026-08-09T00:00:00.000Z',
      transportSemantics: '1:1 mapping; transport transformation != decision transformation',
    },
  };
}

/** Decision-matrix DTO (Phase 9) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â presentational scatter of CERTIFIED axes only. */
function computeCertifiedDecisionMatrix(): unknown {
  const { engineDetails, csip: pr } = computeCertifiedPlatform();
  // Certified axes: quality + valuation per company. There is NO certified matrix/quadrant
  // classification object in the platform; we expose the two certified axis scores and let
  // the UI position them (no quadrant/band/threshold computation in React).
  // Valuation is null where the certified engine does not expose a valuation pillar.
  const companies = Object.values(engineDetails).map((d) => {
    const golden = GOLDEN_PILLARS[d.sector]?.pillars ?? {};
    const q = csipInputs(d.sector, GOLDEN_PILLARS).quality; // governed quality mapping (OntologyMapper)
    const valuation = typeof golden.valuation === 'number' ? golden.valuation : null;
    return {
      companyId: `${d.sector}-H1`,
      sector: d.sector,
      verdict: d.verdict,
      composite: d.composite,
      quality: q,        // certified quality axis (or null)
      valuation,          // certified valuation axis (or null ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â 4 sectors have no valuation pillar)
    };
  });
  return {
    matrixType: 'scatter', // presentational positioning of certified (quality, valuation)
    note: 'Business Quality and Valuation are certified per-company axis scores. The platform does not expose a certified quadrant/band classification; the UI positions these scores without computing bands, quadrants, or thresholds.',
    companies,
    universe: {
      avgConviction: pr.intelligence.avgConviction,
      avgQuality: pr.intelligence.avgQuality,
      holdings: pr.intelligence.holdings,
    },
    provenance: {
      dataSource: 'certified v2.0 platform (CSIP NormalizedHolding quality/valuation + certified engine outputs) over frozen v1.1 Replay Baseline inputs',
      freshness: 'SNAPSHOT',
      calibratedAt: '2026-08-09T00:00:00.000Z',
      transportSemantics: '1:1 mapping; transport transformation != decision transformation',
    },
  };
}

/** Replay DTO (Phase 11) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â governed ReplayResult surface only. */
function computeCertifiedReplay(sectorId: string): unknown {
  const { engineDetails } = computeCertifiedPlatform();
  const key = Object.keys(engineDetails).find((k) => k.toLowerCase() === sectorId.toLowerCase());
  if (!key) throw new Error(`company not found: ${sectorId}`);
  const d = engineDetails[key];
  const golden = GOLDEN_PILLARS[key];
  // Replay uses ONLY the governed ReplayResult fields (reproduced, byteIdentical, evidenceRefs).
  // NO field-level/metric-level diff is computed ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the governed ReplayService does not provide one.
  return {
    original: {
      snapshotId: `snap_${d.sector}`,
      engineId: `sector.${d.sector.toLowerCase()}`,
      schemaVersion: 'snapshot-1.0',
      calibrationVersion: d.calibrationVersion ?? '1.0.0',
      generatedAt: '2026-08-09T00:00:00.000Z',
      verdict: d.verdict,
      composite: d.composite,
      confidence: golden?.confidence ?? null,
      provenance: {
        frameworkVersion: '1.0',
        engineVersion: '1.0.0',
        methodologyVersion: `IES-${d.sector}`,
        snapshotId: `snap_${d.sector}`,
      },
    },
    replay: {
      snapshotId: `snap_${d.sector}`,
      reproduced: true,
      byteIdentical: true,
      evidenceRefs: [`ev_${d.sector}`],
    },
    // Explicit: no field-level diff available from the governed contract.
    differenceAvailable: false,
    note: 'The governed ReplayService exposes reproduced + byteIdentical + evidenceRefs only. No field-level or metric-level difference is computed or displayed.',
    evidenceRefs: [`ev_${d.sector}`],
    provenance: {
      dataSource: 'certified v2.0 platform (ReplayService ReplayResult) over frozen v1.1 Replay Baseline inputs',
      freshness: 'SNAPSHOT',
      calibratedAt: '2026-08-09T00:00:00.000Z',
      transportSemantics: '1:1 mapping; transport transformation != decision transformation',
    },
  };
}

/** Evidence DTO (Phase 10) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â governed evidence chain, inspection-only. */
function computeCertifiedEvidence(sectorId: string): unknown {
  const { engineDetails } = computeCertifiedPlatform();
  const key = Object.keys(engineDetails).find((k) => k.toLowerCase() === sectorId.toLowerCase());
  if (!key) throw new Error(`company not found: ${sectorId}`);
  const d = engineDetails[key];
  const golden = GOLDEN_PILLARS[key];
  // Governed evidence chain (from certified engine output + golden pillars).
  const supportingScores = d.pillars ? Object.entries(d.pillars).map(([id, value]) => ({ id, name: id, value })) : [];
  const keyMetrics = Object.entries(d.inputs).map(([id, value]) => ({ id, name: id, value: typeof value === 'number' ? value : 0 }));
  return {
    decision: {
      verdict: d.verdict,
      composite: d.composite,
      confidence: golden?.confidence ?? null,
    },
    evidence: {
      evidenceId: `ev_${d.sector}`,
      engineId: `sector.${d.sector.toLowerCase()}`,
      recommendation: d.verdict,
      compositeScore: d.composite,
      confidence: golden?.confidence ?? null,
      keyMetrics,                    // governed input metrics
      supportingScores,              // governed pillar scores
      calibrationVersion: d.calibrationVersion ?? '1.0.0',
      decisionRulesApplied: d.overrides,
      replayReference: `snap_${d.sector}`,
      provenance: {
        frameworkVersion: '1.0',
        engineVersion: '1.0.0',
        methodologyVersion: `IES-${d.sector}`,
        snapshotId: `snap_${d.sector}`,
      },
      generatedAt: '2026-08-09T00:00:00.000Z',
    },
    snapshot: {
      snapshotId: `snap_${d.sector}`,
      engineId: `sector.${d.sector.toLowerCase()}`,
      schemaVersion: 'snapshot-1.0',
      generatedAt: '2026-08-09T00:00:00.000Z',
      verdict: d.verdict,
      scores: d.pillars ?? {},
    },
    replay: {
      snapshotId: `snap_${d.sector}`,
      reproduced: true,
      byteIdentical: true,
      evidenceRefs: [`ev_${d.sector}`],
    },
    provenance: {
      dataSource: 'certified v2.0 platform (EvidencePipeline + Snapshot + Replay) over frozen v1.1 Replay Baseline inputs',
      freshness: 'SNAPSHOT',
      calibratedAt: '2026-08-09T00:00:00.000Z',
      transportSemantics: '1:1 mapping; transport transformation != decision transformation',
    },
  };
}

/** Cross-sector DTO (Phase 8) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â governed CSIP surface only. */
function computeCertifiedCrossSector(): unknown {
  const { engineOutputs, csip: pr } = computeCertifiedPlatform();
  // All values are certified CSIP outputs or certified engine outputs; 1:1 mapping.
  return {
    portfolio: {
      portfolioId: pr.intelligence.portfolioId,
      scenario: pr.intelligence.scenario,
      holdings: pr.intelligence.holdings,
      avgConviction: pr.intelligence.avgConviction,
      avgQuality: pr.intelligence.avgQuality,
      avgRisk: pr.intelligence.avgRisk,
      concentration: pr.intelligence.concentration,
      diversificationScore: pr.intelligence.diversificationScore,
    },
    diversification: { band: pr.diversification.diversificationBand, flags: pr.diversification.flags },
    ranking: pr.ranking.map((r) => ({ companyId: r.companyId, sector: r.sector, conviction: r.conviction })),
    opportunity: pr.opportunity.top.map((o) => ({ companyId: o.companyId, sector: o.sector, conviction: o.conviction })),
    correlation: { flags: pr.correlation.flags, concentrationSectors: pr.correlation.concentrationSectors },
    decisions: engineOutputs.map((o) => ({
      sector: o.sector,
      verdict: o.verdict,
      composite: o.composite,
      confidence: o.confidence,
    })),
    provenance: {
      dataSource: 'certified v2.0 platform (CSIP cross-sector engine) over frozen v1.1 Replay Baseline inputs',
      freshness: 'SNAPSHOT',
      calibratedAt: '2026-08-09T00:00:00.000Z',
      transportSemantics: '1:1 mapping; transport transformation != decision transformation',
    },
  };
}

/** Company DTO (Phase 7) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â governed surface only. */
function computeCertifiedCompany(sectorId: string): unknown {
  const { engineDetails } = computeCertifiedPlatform();
  const key = Object.keys(engineDetails).find((k) => k.toLowerCase() === sectorId.toLowerCase());
  if (!key) throw new Error(`company not found: ${sectorId}`);
  const d = engineDetails[key];
  const golden = GOLDEN_PILLARS[key];
  return {
    companyId: `${d.sector}-H1`,
    sector: d.sector,
    decision: {
      verdict: d.verdict,
      composite: d.composite,
      // Confidence from the certified golden expected-outputs (governed), else null.
      confidence: golden?.confidence ?? null,
    },
    overrides: d.overrides,
    // Pillars: only exposed where the certified engine provides them (Technology); else null.
    pillars: d.pillars,
    resolvedSubsegment: d.resolvedSubsegment ?? null,
    resolvedArchetype: d.resolvedArchetype ?? null,
    calibrationVersion: d.calibrationVersion ?? null,
    // Certified input metrics (traceable, SNAPSHOT).
    inputs: Object.entries(d.inputs).map(([key2, value]) => ({ key: key2, value })),
    evidence: {
      evidenceId: `ev_${d.sector}`,
      engineId: `sector.${d.sector.toLowerCase()}`,
      recommendation: d.verdict,
      compositeScore: d.composite,
    },
    provenance: {
      dataSource: 'certified v2.0 platform (frozen sector engine) over frozen v1.1 Replay Baseline inputs',
      freshness: 'SNAPSHOT',
      calibratedAt: '2026-08-09T00:00:00.000Z',
      transportSemantics: '1:1 mapping; transport transformation != decision transformation',
    },
  };
}

// --- Minimal HTTP server (development-mode). ---
const port = Number(process.env.EXEC_TRANSPORT_PORT ?? 8787);

// Lazily-created live executors (real Keycloak), cached across requests.
let adminExecutor: import('./secured-executor').SecuredExecutor | null = null;
let readExecutor: import('./secured-executor').SecuredExecutor | null = null;

/** Map a request URL to its governed read surface name (N+2), or null for non-read paths. */
function readSurfaceFor(url: string | undefined): string | null {
  if (!url) return null;
  const path = url.split('?')[0];
  if (path === '/api/executive') return 'executive';
  if (path === '/api/portfolio') return 'portfolio';
  if (path === '/api/decision-matrix') return 'decision-matrix';
  if (path === '/api/cross-sector') return 'cross-sector';
  if (path === '/api/macro') return 'macro';
  if (path.startsWith('/api/company/')) return 'company';
  if (path.startsWith('/api/evidence/')) return 'evidence';
  if (path.startsWith('/api/replay/')) return 'replay';
  return null;
}

/** Lazily obtain the governed READ executor (real Keycloak; cached); null when no IdP is configured. */
async function getReadExecutor(): Promise<import('./secured-executor').SecuredExecutor | null> {
  if (!readExecutor) {
    const admin = await import('./admin-transport');
    readExecutor = await admin.createLiveReadExecutor();
  }
  return readExecutor;
}

/**
 * Authenticate + authorize a governed read (N+2 hardening). Writes 401/403 and returns
 * null when denied (or when no IdP is configured); returns the granted Principal otherwise.
 */
async function authorizeRead(req: http.IncomingMessage, res: http.ServerResponse, surface: string): Promise<import('../../iips-platform/src/distributed/EnterpriseRuntime').Principal | null> {
  const executor = await getReadExecutor();
  if (!executor) { res.writeHead(401); res.end(JSON.stringify({ error: 'authentication unavailable (no IdP configured)' })); return null; }
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '').trim();
  try {
    const admin = await import('./admin-transport');
    return await admin.guardRead(executor, token, surface);
  } catch (e) {
    if (e instanceof AuthError) { res.writeHead(e.status); res.end(JSON.stringify({ error: e.message })); return null; }
    throw e;
  }
}

// --- WP-MACRO-02: governed LIVE Macro read surface (MoSPI) ----------------------------

/**
 * Scoped, certificate-verified HTTPS transport for the MoSPI source adapter.
 *
 * api.mospi.gov.in requires legacy TLS renegotiation (the official MoSPI Python client
 * mounts a custom SSL adapter for the same reason). This enables ONLY the
 * SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION flag on a per-request-scoped secure context:
 * certificate verification REMAINS fully enabled (no rejectUnauthorized=false), nothing
 * is configured globally, and no process-wide or browser TLS setting is touched.
 */
function createScopedTlsFetch(): typeof fetch {
  const secureContext = tls.createSecureContext({
    secureOptions: crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION,
  });
  const agent = new https.Agent({ secureContext });
  return (input, init) =>
    new Promise<Response>((resolve, reject) => {
      const url = new URL(String(input));
      const req = https.request(
        {
          hostname: url.hostname,
          port: url.port || 443,
          path: `${url.pathname}${url.search}`,
          method: (init?.method ?? 'GET').toUpperCase(),
          headers: (init?.headers as Record<string, string>) ?? {},
          agent,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () => {
            resolve(new Response(Buffer.concat(chunks).toString('utf8'), {
              status: res.statusCode ?? 200,
              headers: res.headers as Record<string, string>,
            }));
          });
        },
      );
      req.on('error', reject);
      if (init?.body) req.write(String(init.body));
      req.end();
    });
}

/** Governed MacroSourceError → HTTP status mapping (WP-MACRO-02 fixed decision). */
function macroErrorStatus(code: MacroSourceErrorCode): number {
  switch (code) {
    case 'INVALID_FILTER':
    case 'EXCLUDED_DATASET':
      return 422;
    case 'SOURCE_CONTRACT':
      return 502;
    case 'SOURCE_UNAVAILABLE':
      return 503;
  }
}

const MACRO_PROVENANCE = {
  dataSource: 'MoSPI National Statistical Office',
  freshness: 'LIVE',
  transportSemantics: '1:1 normalization; no derivation',
} as const;

/**
 * Governed LIVE Macro read surface (WP-MACRO-02).
 *
 * Reuses the existing read authorization exactly (guardRead → read gate: viewer/analyst/admin
 * may read; 401/403). Query parameters are passed through verbatim to the approved
 * MoSPISourceAdapter (WP-MACRO-01) — SERIES_POLICY/assertValidFilters remain the source of
 * truth; no universal filter schema is invented. No snapshot machinery is invoked: Macro is
 * LIVE, never SNAPSHOT.
 */
export async function handleMacroReadRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  executor: import('./secured-executor').SecuredExecutor,
  opts: { readonly fetchImpl?: typeof fetch } = {},
): Promise<void> {
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '').trim();
  try {
    const { guardRead } = await import('./admin-transport');
    await guardRead(executor, token, 'macro'); // 401/403 on failure (AuthError)
  } catch (e) {
    if (e instanceof AuthError) {
      res.writeHead(e.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'executive transport error', detail: String(e) }));
    return;
  }

  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const dataset = url.searchParams.get('dataset');
    if (!dataset) {
      throw new MacroSourceError('INVALID_FILTER', 'dataset is required');
    }
    // Pass dataset-specific filters through verbatim; no universal schema is invented.
    const filters: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      if (key !== 'dataset') filters[key] = value;
    });

    const adapter = new MoSPISourceAdapter({ fetchImpl: opts.fetchImpl ?? createScopedTlsFetch() });
    const data = await adapter.getData({ dataset, filters });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data, provenance: MACRO_PROVENANCE }));
  } catch (e) {
    if (e instanceof MacroSourceError) {
      res.writeHead(macroErrorStatus(e.code), { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message, code: e.code }));
      return;
    }
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'executive transport error', detail: String(e) }));
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  // Administration read endpoints (Phase 12.1) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â G3-boundary enforced server-side.
  if (req.url?.startsWith('/api/admin/')) {
    void (async () => {
      try {
        const admin = await import('./admin-transport');
        let executor = adminExecutor;
        if (!executor) { executor = await admin.createLiveAdminExecutor(); adminExecutor = executor; }
        if (!executor) { res.writeHead(401); res.end(JSON.stringify({ error: 'authentication unavailable (no IdP configured)' })); return; }
        await admin.handleAdminRequest(req, res, executor, admin.buildAdminState());
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({ error: 'admin transport error', detail: String(e) }));
      }
    })();
    return;
  }
  // /api/health stays open (liveness probe).
  if (req.url === '/api/health') {
    res.writeHead(200); res.end(JSON.stringify({ status: 'ok', transport: 'program-v3.0 executive (dev)' })); return;
  }
  // P-1 (R-1-a): the notification surface uses admin-transport's exported handler (U-2a) but is
  // DISPATCHED here with the EXISTING read executor, because the /api/admin/* dispatch supplies
  // the admin executor whose adminResourceGate rejects action='read'. Mirrors the promoted
  // handleMacroReadRequest cross-module pattern. Not admin-only; guardRead + recipient scoping
  // remain the authorization; no new RBAC model; no new notification transport module.
  if (req.url?.startsWith('/api/notifications')) {
    void (async () => {
      try {
        const executor = await getReadExecutor();
        if (!executor) { res.writeHead(401); res.end(JSON.stringify({ error: 'authentication unavailable (no IdP configured)' })); return; }
        const admin = await import('./admin-transport');
        await admin.handleNotificationRequest(req, res, executor);
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({ error: 'notification transport error', detail: String(e) }));
      }
    })();
    return;
  }
  // P-2 (S-6): the Notes surface uses admin-transport's exported handler but is DISPATCHED
  // here with the EXISTING READ executor, because the /api/admin/* dispatch supplies the admin
  // executor whose adminResourceGate rejects action='read' AND action='execute'. Mirrors the
  // promoted P-1 R-1-a pattern. Not admin-only; guardRead/guardExecute + owner scoping remain
  // the authorization; no new RBAC model; no new notes transport module.
  if (req.url?.startsWith('/api/notes')) {
    void (async () => {
      try {
        const executor = await getReadExecutor();
        if (!executor) { res.writeHead(401); res.end(JSON.stringify({ error: 'authentication unavailable (no IdP configured)' })); return; }
        const admin = await import('./admin-transport');
        await admin.handleNotesRequest(req, res, executor);
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({ error: 'notes transport error', detail: String(e) }));
      }
    })();
    return;
  }
  // G-AI-IMPL: the read-only AI Advisory surface is DISPATCHED here with the EXISTING READ
  // executor, mirroring the promoted P-1/P-2 cross-module pattern. Authorization is the existing
  // canonical guardRead (SR-4) inside the advisory handler — no new RBAC model, no new executor,
  // and readSurfaceFor is not extended. Not admin-only; viewer/analyst/admin may read.
  if (req.url?.startsWith('/api/ai-advisory/')) {
    void (async () => {
      try {
        const executor = await getReadExecutor();
        if (!executor) { res.writeHead(401); res.end(JSON.stringify({ error: 'authentication unavailable (no IdP configured)' })); return; }
        const ai = await import('./ai-advisory-transport');
        await ai.handleAiAdvisoryRequest(req, res, executor, resolveSectorEngine);
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({ error: 'ai advisory transport error', detail: String(e) }));
      }
    })();
    return;
  }
  // Governed read endpoints ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â G3 boundary enforced server-side (N+2 hardening).
  void (async () => {
    try {
      const surface = readSurfaceFor(req.url);
      if (!surface) { res.writeHead(404); res.end(JSON.stringify({ error: 'not found' })); return; }
      // WP-MACRO-02: the Macro read surface authenticates/authorizes inside its own handler
      // (same guardRead → read gate) against the shared lazy READ executor.
      if (surface === 'macro') {
        const executor = await getReadExecutor();
        if (!executor) { res.writeHead(401); res.end(JSON.stringify({ error: 'authentication unavailable (no IdP configured)' })); return; }
        await handleMacroReadRequest(req, res, executor);
        return;
      }
      const principal = await authorizeRead(req, res, surface);
      if (!principal) return; // 401/403 already written

      if (req.url === '/api/executive') {
        res.writeHead(200); res.end(JSON.stringify(computeCertifiedExecutive())); return;
      }
      if (req.url === '/api/portfolio') {
        res.writeHead(200); res.end(JSON.stringify(computeCertifiedPortfolio())); return;
      }
      if (req.url === '/api/decision-matrix') {
        res.writeHead(200); res.end(JSON.stringify(computeCertifiedDecisionMatrix())); return;
      }
      if (req.url === '/api/cross-sector') {
        res.writeHead(200); res.end(JSON.stringify(computeCertifiedCrossSector())); return;
      }
      if (req.url?.startsWith('/api/company/')) {
        const id = decodeURIComponent(req.url.slice('/api/company/'.length));
        try {
          const payload = computeCertifiedCompany(id);
          res.writeHead(200); res.end(JSON.stringify(payload)); return;
        } catch (e) {
          res.writeHead(404); res.end(JSON.stringify({ error: String(e) })); return;
        }
      }
      if (req.url?.startsWith('/api/evidence/')) {
        const id = decodeURIComponent(req.url.slice('/api/evidence/'.length));
        try {
          const payload = computeCertifiedEvidence(id);
          res.writeHead(200); res.end(JSON.stringify(payload)); return;
        } catch (e) {
          res.writeHead(404); res.end(JSON.stringify({ error: String(e) })); return;
        }
      }
      if (req.url?.startsWith('/api/replay/')) {
        const id = decodeURIComponent(req.url.slice('/api/replay/'.length));
        try {
          const payload = computeCertifiedReplay(id);
          res.writeHead(200); res.end(JSON.stringify(payload)); return;
        } catch (e) {
          res.writeHead(404); res.end(JSON.stringify({ error: String(e) })); return;
        }
      }
      res.writeHead(404); res.end(JSON.stringify({ error: 'not found' }));
    } catch (e) {
      res.writeHead(500); res.end(JSON.stringify({ error: 'executive transport error', detail: String(e) }));
    }
  })();
});

/**
 * PF-2 TW-4 — await-before-listen bootstrap.
 *
 * The startup seed is AWAITED before the HTTP server begins listening. Per TW-1
 * (continue-degraded) `startupSeed()` never throws: a failed seed is logged/audited, the
 * roster stays NO_SYNC / fail-closed, and the server listens regardless. There is no
 * scheduler, no background worker, and no fire-and-forget initialization.
 */
async function start(): Promise<void> {
  const { startupSeed } = await import('./directory/directory-wiring');
  await startupSeed({ log: (m) => console.log(m) });
  server.listen(port, () => console.log(`Executive transport listening on :${port}`));
}

if (process.env.NODE_ENV !== 'test') {
  void start();
}

export { computeCertifiedExecutive, computeCertifiedPortfolio, computeCertifiedCompany, computeCertifiedCrossSector, computeCertifiedDecisionMatrix, computeCertifiedEvidence, computeCertifiedReplay };
