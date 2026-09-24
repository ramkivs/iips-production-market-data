/**
 * Energy Sector Engine (WP-3) — implements SectorPlugin, consumes platform services, frozen assets.
 *
 * Implements the IES-011 deterministic pipeline: metric eval → band → score → pillar →
 * segment calibration → composite → override → verdict → evidence → ontology registration.
 * Reproduces the 9/9 frozen expected outputs. Zero platform/framework/CSIP changes.
 */
import type { SectorPlugin, ExecutionRequest, ExecutionResult, PluginManifest } from '../../plugin-loader/PluginContract';
import type { Container } from '../../di/Container';
import type { RuntimeCoordinator } from '../../runtime/RuntimeCoordinator';
import type { EvidencePipeline } from '../../framework/evidence/EvidencePipeline';
import { EnergyMetricsEvaluator, type EnergyInput } from './metrics/EnergyMetrics';
import { EnergyScoreEngine } from './scoring/EnergyScoreEngine';
import { loadEnergyCalibration, type EnergyCalibrationProfile } from './calibration/EnergyCalibration';
import { EnergyDecision } from './decision/EnergyDecision';
import { EnergyEvidence } from './evidence/EnergyEvidence';

export const ENERGY_ENGINE_ID = 'sector.energy';

/** Engine-declared ontology metadata (Universal Investment Ontology) — for CSIP, zero CSIP change. */
export const ENERGY_ONTOLOGY_METADATA = {
  composite: 'Conviction',
  confidence: 'Confidence',
  qualityScore: 'Quality',
  growthScore: 'Growth',
  riskScore: 'Risk',
  valuationScore: 'Valuation',
  capitalEfficiency: 'Capital Efficiency',
  franchiseScore: 'Moat',
} as const;

export class EnergyEngine implements SectorPlugin {
  readonly identity = {
    engineId: ENERGY_ENGINE_ID,
    sectorFamily: 'Energy',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
  };
  readonly manifest: PluginManifest = {
    engineId: ENERGY_ENGINE_ID,
    sectorFamily: 'Energy',
    engineVersion: '1.0.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    compatibility: { framework: '1.0', methodology: 'IES-011 v1.0' },
  };

  private calibration: EnergyCalibrationProfile = loadEnergyCalibration();
  private metrics = new EnergyMetricsEvaluator();
  private scoreEngine!: EnergyScoreEngine;
  private decision!: EnergyDecision;
  private evidence!: EnergyEvidence;
  private runtime!: RuntimeCoordinator;
  private evidencePipeline!: EvidencePipeline;

  onDiscover(): void { /* no-op */ }

  onRegister(_ctx: Container): boolean {
    this.scoreEngine = new EnergyScoreEngine(this.calibration);
    this.decision = new EnergyDecision(this.calibration);
    return true;
  }

  onInitialize(ctx: Container): void {
    this.evidencePipeline = ctx.resolve<EvidencePipeline>('evidenceService');
    this.runtime = ctx.resolve<RuntimeCoordinator>('runtimeCoordinator');
    this.evidence = new EnergyEvidence(this.evidencePipeline);
  }

  execute(_ctx: Container, request: ExecutionRequest): ExecutionResult {
    const input = request.inputs as unknown as EnergyInput;
    const metrics = this.metrics.evaluate(input);
    const score = this.scoreEngine.score(metrics);
    const decision = this.decision.decide({
      composite: score.composite,
      segment: input.segment,
      debtEbitda: input.debtEbitda,
      governance: input.governance,
      strandedAsset: input.strandedAsset,
      reserveWriteDown: input.reserveWriteDown,
      costBlowout: input.costBlowout,
      priceCollapse: input.priceCollapse,
    });

    const snapshot = this.runtime.recordSnapshot(
      ENERGY_ENGINE_ID,
      { productionGrowth: input.productionGrowth },
      score.pillars as unknown as Record<string, number>,
      decision.verdict,
    );
    const evidence = this.evidence.build({
      segment: input.segment,
      decision,
      score,
      calibrationVersion: this.calibration.version,
      snapshotId: snapshot.snapshotId,
    });

    return {
      state: 'COMPLETED',
      snapshotRef: snapshot.snapshotId,
      evidenceRef: evidence.evidenceId,
      metadata: {
        verdict: decision.verdict,
        composite: score.composite,
        overridesApplied: decision.overridesApplied,
        ontology: ENERGY_ONTOLOGY_METADATA,
      },
    };
  }

  onComplete(): void { /* no-op */ }
}
