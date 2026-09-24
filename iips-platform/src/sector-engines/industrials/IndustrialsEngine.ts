/**
 * Industrials Sector Engine (WP-3) — implements SectorPlugin, consumes platform services, frozen assets.
 *
 * Implements the IES-014 D15 v1.2 contract exactly: metric eval → band → score → pillar →
 * subsegment + archetype calibration → composite → min-rank override → verdict → evidence →
 * ontology registration. Reproduces the 10/10 frozen expected outputs. Zero platform/framework/CSIP changes.
 */
import type { SectorPlugin, ExecutionRequest, ExecutionResult, PluginManifest } from '../../plugin-loader/PluginContract';
import type { Container } from '../../di/Container';
import type { RuntimeCoordinator } from '../../runtime/RuntimeCoordinator';
import type { EvidencePipeline } from '../../framework/evidence/EvidencePipeline';
import { IndustrialsMetricsEvaluator, type IndustrialsInput } from './metrics/IndustrialsMetrics';
import { IndustrialsScoreEngine } from './scoring/IndustrialsScoreEngine';
import { loadIndustrialsCalibration, type IndustrialsCalibrationProfile } from './calibration/IndustrialsCalibration';
import { IndustrialsDecision } from './decision/IndustrialsDecision';
import { IndustrialsEvidence } from './evidence/IndustrialsEvidence';

export const INDUSTRIALS_ENGINE_ID = 'sector.industrials';

/** Engine-declared ontology metadata (Universal Investment Ontology) — for CSIP, zero CSIP change. */
export const INDUSTRIALS_ONTOLOGY_METADATA = {
  composite: 'Conviction',
  confidence: 'Confidence',
  qualityScore: 'Quality',
  growthScore: 'Growth',
  riskScore: 'Risk',
  valuationScore: 'Valuation',
  capitalEfficiency: 'Capital Efficiency',
  franchiseScore: 'Moat',
} as const;

export class IndustrialsEngine implements SectorPlugin {
  readonly identity = {
    engineId: INDUSTRIALS_ENGINE_ID,
    sectorFamily: 'Industrials',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
  };
  readonly manifest: PluginManifest = {
    engineId: INDUSTRIALS_ENGINE_ID,
    sectorFamily: 'Industrials',
    engineVersion: '1.0.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    compatibility: { framework: '1.0', methodology: 'IES-014 v1.0' },
  };

  private calibration: IndustrialsCalibrationProfile = loadIndustrialsCalibration();
  private metrics = new IndustrialsMetricsEvaluator();
  private scoreEngine!: IndustrialsScoreEngine;
  private decision!: IndustrialsDecision;
  private evidence!: IndustrialsEvidence;
  private runtime!: RuntimeCoordinator;
  private evidencePipeline!: EvidencePipeline;

  onDiscover(): void { /* no-op */ }

  onRegister(_ctx: Container): boolean {
    this.scoreEngine = new IndustrialsScoreEngine(this.calibration);
    this.decision = new IndustrialsDecision(this.calibration);
    return true;
  }

  onInitialize(ctx: Container): void {
    this.evidencePipeline = ctx.resolve<EvidencePipeline>('evidenceService');
    this.runtime = ctx.resolve<RuntimeCoordinator>('runtimeCoordinator');
    this.evidence = new IndustrialsEvidence(this.evidencePipeline);
  }

  execute(_ctx: Container, request: ExecutionRequest): ExecutionResult {
    const input = request.inputs as unknown as IndustrialsInput;
    const metrics = this.metrics.evaluate(input);
    const score = this.scoreEngine.score(metrics);
    const decision = this.decision.decide({
      composite: score.composite,
      subsegment: input.subsegment,
      debtEbitda: input.debtEbitda,
      governance: input.governance,
      orderCancellation: input.orderCancellation,
      epcCostOverrun: input.epcCostOverrun,
      defenseProgramFail: input.defenseProgramFail,
      marginCompression: input.marginCompression,
    });

    const snapshot = this.runtime.recordSnapshot(
      INDUSTRIALS_ENGINE_ID,
      { revenueGrowth: input.revenueGrowth },
      score.pillars as unknown as Record<string, number>,
      decision.verdict,
    );
    const evidence = this.evidence.build({
      subsegment: input.subsegment,
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
        ontology: INDUSTRIALS_ONTOLOGY_METADATA,
      },
    };
  }

  onComplete(): void { /* no-op */ }
}
