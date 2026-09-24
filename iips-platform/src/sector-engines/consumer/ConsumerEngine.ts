/**
 * Consumer Sector Engine (WP-3) — implements SectorPlugin, consumes platform services, frozen assets.
 *
 * Implements the IES-013 deterministic pipeline: metric eval → band → score → pillar →
 * segment/business-model calibration → composite → override → verdict → evidence → ontology
 * registration. Reproduces the 10/10 frozen expected outputs. Zero platform/framework/CSIP changes.
 */
import type { SectorPlugin, ExecutionRequest, ExecutionResult, PluginManifest } from '../../plugin-loader/PluginContract';
import type { Container } from '../../di/Container';
import type { RuntimeCoordinator } from '../../runtime/RuntimeCoordinator';
import type { EvidencePipeline } from '../../framework/evidence/EvidencePipeline';
import { ConsumerMetricsEvaluator, type ConsumerInput } from './metrics/ConsumerMetrics';
import { ConsumerScoreEngine } from './scoring/ConsumerScoreEngine';
import { loadConsumerCalibration, type ConsumerCalibrationProfile } from './calibration/ConsumerCalibration';
import { ConsumerDecision } from './decision/ConsumerDecision';
import { ConsumerEvidence } from './evidence/ConsumerEvidence';

export const CONSUMER_ENGINE_ID = 'sector.consumer';

/** Engine-declared ontology metadata (Universal Investment Ontology) — for CSIP, zero CSIP change. */
export const CONSUMER_ONTOLOGY_METADATA = {
  composite: 'Conviction',
  confidence: 'Confidence',
  qualityScore: 'Quality',
  growthScore: 'Growth',
  riskScore: 'Risk',
  valuationScore: 'Valuation',
  capitalEfficiency: 'Capital Efficiency',
  franchiseScore: 'Moat',
} as const;

export class ConsumerEngine implements SectorPlugin {
  readonly identity = {
    engineId: CONSUMER_ENGINE_ID,
    sectorFamily: 'Consumer',
    engineVersion: '1.0.0',
    secVersion: '1.0',
    semcVersion: '1.0',
  };
  readonly manifest: PluginManifest = {
    engineId: CONSUMER_ENGINE_ID,
    sectorFamily: 'Consumer',
    engineVersion: '1.0.0',
    capabilities: ['metrics', 'scoring', 'calibration', 'decision', 'evidence', 'ontology'],
    compatibility: { framework: '1.0', methodology: 'IES-013 v1.0' },
  };

  private calibration: ConsumerCalibrationProfile = loadConsumerCalibration();
  private metrics = new ConsumerMetricsEvaluator();
  private scoreEngine!: ConsumerScoreEngine;
  private decision!: ConsumerDecision;
  private evidence!: ConsumerEvidence;
  private runtime!: RuntimeCoordinator;
  private evidencePipeline!: EvidencePipeline;

  onDiscover(): void { /* no-op */ }

  onRegister(_ctx: Container): boolean {
    this.scoreEngine = new ConsumerScoreEngine(this.calibration);
    this.decision = new ConsumerDecision(this.calibration);
    return true;
  }

  onInitialize(ctx: Container): void {
    this.evidencePipeline = ctx.resolve<EvidencePipeline>('evidenceService');
    this.runtime = ctx.resolve<RuntimeCoordinator>('runtimeCoordinator');
    this.evidence = new ConsumerEvidence(this.evidencePipeline);
  }

  execute(_ctx: Container, request: ExecutionRequest): ExecutionResult {
    const input = request.inputs as unknown as ConsumerInput;
    const metrics = this.metrics.evaluate(input);
    const score = this.scoreEngine.score(metrics);
    const decision = this.decision.decide({
      composite: score.composite,
      segment: input.segment,
      debtEbitda: input.debtEbitda,
      governance: input.governance,
      brandErosion: input.brandErosion,
      categoryDisruption: input.categoryDisruption,
      inputCostSqueeze: input.inputCostSqueeze,
      channelLoss: input.channelLoss,
    });

    const snapshot = this.runtime.recordSnapshot(
      CONSUMER_ENGINE_ID,
      { revenueGrowth: input.revenueGrowth },
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
        ontology: CONSUMER_ONTOLOGY_METADATA,
      },
    };
  }

  onComplete(): void { /* no-op */ }
}
