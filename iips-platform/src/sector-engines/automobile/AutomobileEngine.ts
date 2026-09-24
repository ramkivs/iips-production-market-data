/**
 * Automobile Sector Engine (D17) — implements SectorPlugin, consumes platform services,
 * frozen assets. Implements the IES-017 D17 v1.0 contract exactly (accepted M1–M15):
 * multi-subsegment resolution -> effective band-table resolution (calibrated ?? baseline) ->
 * metric -> band -> score -> pillar -> composite (round-half-to-even) -> min-rank override ->
 * verdict -> evidence -> ontology registration. Reproduces the 13/13 frozen expected outputs.
 * Zero platform/framework/CSIP changes.
 */
import type { SectorPlugin, ExecutionRequest, ExecutionResult, PluginManifest } from '../../plugin-loader/PluginContract';
import type { Container } from '../../di/Container';
import type { RuntimeCoordinator } from '../../runtime/RuntimeCoordinator';
import type { EvidencePipeline } from '../../framework/evidence/EvidencePipeline';
import { AutomobileMetricsEvaluator, type AutomobileInput } from './metrics/AutomobileMetrics';
import { AutomobileScoreEngine } from './scoring/AutomobileScoreEngine';
import { loadAutomobileCalibration, type AutomobileCalibrationProfile } from './calibration/AutomobileCalibration';
import { AutomobileDecision, toDecisionInput } from './decision/AutomobileDecision';
import { AutomobileEvidence } from './evidence/AutomobileEvidence';

export const AUTOMOBILE_ENGINE_ID = 'sector.automobile';

/** Engine-declared ontology metadata (Universal Investment Ontology) — for CSIP, zero CSIP change. */
export const AUTOMOBILE_ONTOLOGY_METADATA = {
  composite: 'Conviction',
  confidence: 'Confidence',
  qualityScore: 'Quality',
  growthScore: 'Growth',
  riskScore: 'Risk',
  profitabilityScore: 'Profitability',
  capitalEfficiency: 'Capital Efficiency',
  valuationScore: 'Valuation',
} as const;

export class AutomobileEngine implements SectorPlugin {
  readonly identity = {
    engineId: AUTOMOBILE_ENGINE_ID,
    sectorFamily: 'Automobile',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
  };
  readonly manifest: PluginManifest = {
    engineId: AUTOMOBILE_ENGINE_ID,
    sectorFamily: 'Automobile',
    engineVersion: '1.0.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    compatibility: { framework: '1.0', methodology: 'IES-017 v1.0' },
  };

  private calibration: AutomobileCalibrationProfile = loadAutomobileCalibration();
  private metrics = new AutomobileMetricsEvaluator();
  private scoreEngine!: AutomobileScoreEngine;
  private decision!: AutomobileDecision;
  private evidence!: AutomobileEvidence;
  private runtime!: RuntimeCoordinator;
  private evidencePipeline!: EvidencePipeline;

  onDiscover(): void { /* no-op */ }

  onRegister(_ctx: Container): boolean {
    this.scoreEngine = new AutomobileScoreEngine(this.calibration);
    this.decision = new AutomobileDecision(this.calibration);
    return true;
  }

  onInitialize(ctx: Container): void {
    this.evidencePipeline = ctx.resolve<EvidencePipeline>('evidenceService');
    this.runtime = ctx.resolve<RuntimeCoordinator>('runtimeCoordinator');
    this.evidence = new AutomobileEvidence(this.evidencePipeline);
  }

  execute(_ctx: Container, request: ExecutionRequest): ExecutionResult {
    const input = request.inputs as unknown as AutomobileInput;

    // Multi-subsegment resolution (deterministic; single profile, no branch).
    const resolution = this.metrics.resolve(input, (sub) => this.calibration.segments[sub]?.leverageAlert ?? 3.0);

    const score = this.scoreEngine.score(input, resolution.subsegment, resolution.archetype);
    const decision = this.decision.decide(toDecisionInput(input, score.composite, resolution.subsegment));

    const snapshot = this.runtime.recordSnapshot(
      AUTOMOBILE_ENGINE_ID,
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
        ontology: AUTOMOBILE_ONTOLOGY_METADATA,
      },
    };
  }

  onComplete(): void { /* no-op */ }
}
