/** Capital Markets Evidence Generation (WP-3) — traceable evidence per frozen D11. */
import type { EvidencePipeline, EvidencePackage } from '../../../framework/evidence/EvidencePipeline';
import type { CapitalMarketsMetricValues } from '../metrics/CapitalMarketsMetrics';
import type { CapitalMarketsScoreResult } from '../scoring/CapitalMarketsScoreEngine';
import type { CapitalMarketsDecisionResult } from '../decision/CapitalMarketsDecision';

export interface CapitalMarketsEvidenceInput {
  engineId: string;
  metrics: CapitalMarketsMetricValues;
  score: CapitalMarketsScoreResult;
  decision: CapitalMarketsDecisionResult;
  calibrationVersion: string;
  snapshotId: string;
  frameworkVersion: string;
  methodologyVersion: string;
}

export class CapitalMarketsEvidence {
  constructor(private readonly pipeline: EvidencePipeline) {}

  build(input: CapitalMarketsEvidenceInput): Readonly<EvidencePackage> {
    const keyMetrics = Object.entries(input.metrics).map(([id, value]) => ({ id, name: id, value }));
    const supportingScores = Object.entries(input.score.pillars).map(([id, value]) => ({ id, name: id, value }));

    return this.pipeline.build({
      engineId: input.engineId,
      recommendation: input.decision.verdict,
      compositeScore: input.decision.composite,
      confidence: input.decision.confidence,
      keyMetrics,
      supportingScores,
      calibrationVersion: input.calibrationVersion,
      decisionRulesApplied: input.decision.overridesApplied,
      replayReference: input.snapshotId,
      provenance: {
        frameworkVersion: input.frameworkVersion,
        engineVersion: '1.0.0',
        methodologyVersion: input.methodologyVersion,
        snapshotId: input.snapshotId,
      },
    });
  }
}
