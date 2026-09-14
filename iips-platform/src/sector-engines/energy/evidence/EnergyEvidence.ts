/** Energy Evidence (WP-3) — evidence packages per D11. Reuses EvidencePipeline. */
import type { EvidencePipeline, EvidencePackage } from '../../../framework/evidence/EvidencePipeline';
import type { DecisionResult } from '../decision/EnergyDecision';
import type { EnergyScoreResult } from '../scoring/EnergyScoreEngine';

export interface EnergyEvidenceInput {
  segment: string;
  decision: DecisionResult;
  score: EnergyScoreResult;
  calibrationVersion: string;
  snapshotId: string;
}

export class EnergyEvidence {
  constructor(private readonly pipeline: EvidencePipeline) {}

  build(input: EnergyEvidenceInput): Readonly<EvidencePackage> {
    return this.pipeline.build({
      engineId: 'sector.energy',
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
        methodologyVersion: 'IES-011 v1.0',
        snapshotId: input.snapshotId,
      },
    });
  }
}
