/** Consumer Evidence (WP-3) — evidence packages per D11. Reuses EvidencePipeline. */
import type { EvidencePipeline, EvidencePackage } from '../../../framework/evidence/EvidencePipeline';
import type { DecisionResult } from '../decision/ConsumerDecision';
import type { ConsumerScoreResult } from '../scoring/ConsumerScoreEngine';

export interface ConsumerEvidenceInput {
  segment: string;
  decision: DecisionResult;
  score: ConsumerScoreResult;
  calibrationVersion: string;
  snapshotId: string;
}

export class ConsumerEvidence {
  constructor(private readonly pipeline: EvidencePipeline) {}

  build(input: ConsumerEvidenceInput): Readonly<EvidencePackage> {
    return this.pipeline.build({
      engineId: 'sector.consumer',
      recommendation: input.decision.verdict,
      compositeScore: input.score.composite,
      confidence: 0.8,
      supportingScores: [
        { id: 'quality', name: 'Quality', value: input.score.pillars.quality },
        { id: 'growth', name: 'Growth', value: input.score.pillars.growth },
        { id: 'risk', name: 'Risk', value: input.score.pillars.risk },
      ],
      decisionRulesApplied: input.decision.overridesApplied,
      calibrationVersion: input.calibrationVersion,
      replayReference: input.snapshotId,
      provenance: {
        frameworkVersion: '1.0',
        engineVersion: '1.0.0',
        methodologyVersion: 'IES-013 v1.0',
        snapshotId: input.snapshotId,
      },
    });
  }
}
