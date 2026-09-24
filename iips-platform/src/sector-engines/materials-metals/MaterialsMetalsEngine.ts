/**
 * Materials & Metals Sector Engine (D20) — implements SectorPlugin, consumes platform services,
 * frozen assets. Implements the IES-020 D20 v1.0 contract exactly (accepted M1–M15):
 * multi-subsegment resolution -> effective band-table resolution (calibrated ?? baseline) ->
 * metric -> band -> score -> pillar -> composite (round-half-to-even, left-to-right) ->
 * min-rank override -> verdict -> evidence -> ontology registration. Reproduces the 13/13
 * frozen expected outputs. Zero platform/framework/CSIP changes.
 */
import type { SectorPlugin, ExecutionRequest, ExecutionResult, PluginManifest } from '../../plugin-loader/PluginContract';
import type { Container } from '../../di/Container';
import type { RuntimeCoordinator } from '../../runtime/RuntimeCoordinator';
import type { EvidencePipeline } from '../../framework/evidence/EvidencePipeline';
import { MaterialsMetalsMetricsEvaluator, type MaterialsMetalsInput } from './metrics/MaterialsMetalsMetrics';
import { MaterialsMetalsScoreEngine } from './scoring/MaterialsMetalsScoreEngine';
import { loadMaterialsMetalsCalibration, type MaterialsMetalsCalibrationProfile } from './calibration/MaterialsMetalsCalibration';
import { MaterialsMetalsDecision, toDecisionInput } from './decision/MaterialsMetalsDecision';
import { MaterialsMetalsEvidence } from './evidence/MaterialsMetalsEvidence';

export const MATERIALS_METALS_ENGINE_ID = 'sector.materials-metals';

/** Engine-declared ontology metadata (Universal Investment Ontology) — for CSIP, zero CSIP change. */
export const MATERIALS_METALS_ONTOLOGY_METADATA = {
  composite: 'Conviction',
  confidence: 'Confidence',
  qualityScore: 'Quality',
  growthScore: 'Growth',
  riskScore: 'Risk',
  profitabilityScore: 'Profitability',
  capitalEfficiency: 'Capital Efficiency',
  valuationScore: 'Valuation',
} as const;

export class MaterialsMetalsEngine implements SectorPlugin {
  readonly identity = {
    engineId: MATERIALS_METALS_ENGINE_ID,
    sectorFamily: 'Materials & Metals',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
  };
  readonly manifest: PluginManifest = {
    engineId: MATERIALS_METALS_ENGINE_ID,
    sectorFamily: 'Materials & Metals',
    engineVersion: '1.0.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    compatibility: { framework: '1.0', methodology: 'IES-020 v1.0' },
  };

  private calibration: MaterialsMetalsCalibrationProfile = loadMaterialsMetalsCalibration();
  private metrics = new MaterialsMetalsMetricsEvaluator();
  private scoreEngine!: MaterialsMetalsScoreEngine;
  private decision!: MaterialsMetalsDecision;
  private evidence!: MaterialsMetalsEvidence;
  private runtime!: RuntimeCoordinator;
  private evidencePipeline!: EvidencePipeline;

  onDiscover(): void { /* no-op */ }

  onRegister(_ctx: Container): boolean {
    this.scoreEngine = new MaterialsMetalsScoreEngine(this.calibration);
    this.decision = new MaterialsMetalsDecision(this.calibration);
    return true;
  }

  onInitialize(ctx: Container): void {
    this.evidencePipeline = ctx.resolve<EvidencePipeline>('evidenceService');
    this.runtime = ctx.resolve<RuntimeCoordinator>('runtimeCoordinator');
    this.evidence = new MaterialsMetalsEvidence(this.evidencePipeline);
  }

  execute(_ctx: Container, request: ExecutionRequest): ExecutionResult {
    const input = request.inputs as unknown as MaterialsMetalsInput;

    // Multi-subsegment resolution (deterministic; single profile, no branch).
    const resolution = this.metrics.resolve(input, (sub) => this.calibration.segments[sub]?.leverageAlert ?? 3.0);

    const score = this.scoreEngine.score(input, resolution.subsegment, resolution.archetype);
    const decision = this.decision.decide(toDecisionInput(input, score.composite, resolution.subsegment));

    const snapshot = this.runtime.recordSnapshot(
      MATERIALS_METALS_ENGINE_ID,
      { revenueGrowth: input.revenueGrowth ?? 0 },
      score.pillars as unknown as Record<string, number>,
      decision.verdict,
    );
    const evidence = this.evidence.build({
      subsegment: resolution.subsegment,
      archetype: resolution.archetype,
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
        resolvedSubsegment: resolution.subsegment,
        resolvedArchetype: resolution.archetype,
        pillars: {
          quality: score.pillars.quality,
          growth: score.pillars.growth,
          risk: score.pillars.risk,
          profitability: score.pillars.profitability,
          capitalEfficiency: score.pillars.capitalEfficiency,
          valuation: score.pillars.valuation,
        },
        calibrationVersion: this.calibration.version,
        ontology: MATERIALS_METALS_ONTOLOGY_METADATA,
      },
    };
  }

  onComplete(): void { /* no-op */ }
}
