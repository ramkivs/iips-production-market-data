/** Banking Evidence Generation (WP-3) — traceable evidence per frozen evidence schema. */
import type { EvidencePipeline, EvidencePackage } from '../../../framework/evidence/EvidencePipeline';
import type { BankingMetricValues } from '../metrics/BankingMetrics';
import type { BankingScoreResult } from '../scoring/BankingScoreEngine';
import type { BankingDecisionResult } from '../decision/BankingDecision';

export interface BankingEvidenceInput {
  engineId: string;
  metrics: BankingMetricValues;
  score: BankingScoreResult;
  decision: BankingDecisionResult;
  calibrationVersion: string;
  snapshotId: string;
  frameworkVersion: string;
  methodologyVersion: string;
}

/** Build a full traceable evidence package (Metric→Band→Score→Pillar→Composite→Verdict). */
export class BankingEvidence {
  constructor(private readonly pipeline: EvidencePipeline) {}

  build(input: BankingEvidenceInput): Readonly<EvidencePackage> {
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
