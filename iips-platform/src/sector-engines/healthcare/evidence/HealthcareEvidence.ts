/** Healthcare Evidence Generation (WP-3) — traceable evidence per frozen D11. */
import type { EvidencePipeline, EvidencePackage } from '../../../framework/evidence/EvidencePipeline';
import type { HealthcareMetricValues } from '../metrics/HealthcareMetrics';
import type { HealthcareScoreResult } from '../scoring/HealthcareScoreEngine';
import type { HealthcareDecisionResult } from '../decision/HealthcareDecision';

export interface HealthcareEvidenceInput {
  engineId: string;
  metrics: HealthcareMetricValues;
  score: HealthcareScoreResult;
  decision: HealthcareDecisionResult;
  calibrationVersion: string;
  snapshotId: string;
  frameworkVersion: string;
  methodologyVersion: string;
}

export class HealthcareEvidence {
  constructor(private readonly pipeline: EvidencePipeline) {}

  build(input: HealthcareEvidenceInput): Readonly<EvidencePackage> {
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
