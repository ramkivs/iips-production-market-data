/**
 * Technology Sector Engine (WP-3) — implements SectorPlugin, consumes platform services, frozen assets.
 *
 * Implements the IES-015 D15 v1.3 contract exactly: hybrid/multi-subsegment resolution ->
 * effective band-table resolution (calibrated ?? baseline, boundaries+scores together) ->
 * metric -> band -> score -> pillar -> subsegment + archetype calibration -> composite
 * (round-half-to-even) -> min-rank override -> verdict -> evidence -> ontology registration.
 * Reproduces the 13/13 frozen expected outputs. Zero platform/framework/CSIP changes.
 */
import type { SectorPlugin, ExecutionRequest, ExecutionResult, PluginManifest } from '../../plugin-loader/PluginContract';
import type { Container } from '../../di/Container';
import type { RuntimeCoordinator } from '../../runtime/RuntimeCoordinator';
import type { EvidencePipeline } from '../../framework/evidence/EvidencePipeline';
import { TechnologyMetricsEvaluator, type TechnologyInput } from './metrics/TechnologyMetrics';
import { TechnologyScoreEngine } from './scoring/TechnologyScoreEngine';
import { loadTechnologyCalibration, type TechnologyCalibrationProfile } from './calibration/TechnologyCalibration';
import { TechnologyDecision } from './decision/TechnologyDecision';
import { TechnologyEvidence } from './evidence/TechnologyEvidence';

export const TECHNOLOGY_ENGINE_ID = 'sector.technology';

/** Engine-declared ontology metadata (Universal Investment Ontology) — for CSIP, zero CSIP change. */
export const TECHNOLOGY_ONTOLOGY_METADATA = {
  composite: 'Conviction',
  confidence: 'Confidence',
  qualityScore: 'Quality',
  growthScore: 'Growth',
  riskScore: 'Risk',
  profitabilityScore: 'Profitability',
  capitalEfficiency: 'Capital Efficiency',
  valuationScore: 'Valuation',
} as const;

export class TechnologyEngine implements SectorPlugin {
  readonly identity = {
    engineId: TECHNOLOGY_ENGINE_ID,
    sectorFamily: 'Technology',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
  };
  readonly manifest: PluginManifest = {
    engineId: TECHNOLOGY_ENGINE_ID,
    sectorFamily: 'Technology',
    engineVersion: '1.0.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    compatibility: { framework: '1.0', methodology: 'IES-015 v1.0' },
  };

  private calibration: TechnologyCalibrationProfile = loadTechnologyCalibration();
  private metrics = new TechnologyMetricsEvaluator();
  private scoreEngine!: TechnologyScoreEngine;
  private decision!: TechnologyDecision;
  private evidence!: TechnologyEvidence;
  private runtime!: RuntimeCoordinator;
  private evidencePipeline!: EvidencePipeline;

  onDiscover(): void { /* no-op */ }

  onRegister(_ctx: Container): boolean {
    this.scoreEngine = new TechnologyScoreEngine(this.calibration);
    this.decision = new TechnologyDecision(this.calibration);
    return true;
  }

  onInitialize(ctx: Container): void {
    this.evidencePipeline = ctx.resolve<EvidencePipeline>('evidenceService');
    this.runtime = ctx.resolve<RuntimeCoordinator>('runtimeCoordinator');
    this.evidence = new TechnologyEvidence(this.evidencePipeline);
  }

  execute(_ctx: Container, request: ExecutionRequest): ExecutionResult {
    const input = request.inputs as unknown as TechnologyInput;

    // Hybrid / multi-subsegment resolution (deterministic; single profile, no branch)
    const resolution = this.metrics.resolve(input, (sub) => this.calibration.segments[sub]?.leverageAlert ?? 3.0);

    const score = this.scoreEngine.score(input, resolution.subsegment, resolution.archetype);
    const decision = this.decision.decide({
      composite: score.composite,
      subsegment: resolution.subsegment,
      debtEbitda: input.debtEbitda,
      governance: input.governance,
      disruption: input.disruption,
      churnCollapse: input.churnCollapse,
      customerLoss: input.customerLoss,
      capexOverrun: input.capexOverrun,
      marginCompression: input.marginCompression,
    });

    const snapshot = this.runtime.recordSnapshot(
      TECHNOLOGY_ENGINE_ID,
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
        ontology: TECHNOLOGY_ONTOLOGY_METADATA,
      },
    };
  }

  onComplete(): void { /* no-op */ }
}
