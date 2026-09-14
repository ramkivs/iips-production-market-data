/**
 * Technology Evidence (WP-3) — evidence packages per D11. Reuses EvidencePipeline.
 */
import type { EvidencePipeline, EvidencePackage } from '../../../framework/evidence/EvidencePipeline';
import type { TechnologyDecisionResult } from '../decision/TechnologyDecision';
import type { TechnologyScoreResult } from '../scoring/TechnologyScoreEngine';

export interface TechnologyEvidenceInput {
  subsegment: string;
  archetype: string;
  decision: TechnologyDecisionResult;
  score: TechnologyScoreResult;
  calibrationVersion: string;
  snapshotId: string;
}

export class TechnologyEvidence {
  constructor(private readonly pipeline: EvidencePipeline) {}

  build(input: TechnologyEvidenceInput): Readonly<EvidencePackage> {
    return this.pipeline.build({
      engineId: 'sector.technology',
      recommendation: input.decision.verdict,
      compositeScore: input.score.composite,
      confidence: 0.8,
      supportingScores: [
        { id: 'quality', name: 'Quality', value: input.score.pillars.quality },
        { id: 'growth', name: 'Growth', value: input.score.pillars.growth },
        { id: 'risk', name: 'Risk', value: input.score.pillars.risk },
        { id: 'profitability', name: 'Profitability', value: input.score.pillars.profitability },
      ],
      decisionRulesApplied: input.decision.overridesApplied,
      calibrationVersion: input.calibrationVersion,
      replayReference: input.snapshotId,
      provenance: {
        frameworkVersion: '1.0',
        engineVersion: '1.0.0',
        methodologyVersion: 'IES-015 v1.0',
        snapshotId: input.snapshotId,
      },
    });
  }
}
