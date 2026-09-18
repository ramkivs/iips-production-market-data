/** Hospitality Evidence (WP-3) — evidence packages per D11. Reuses EvidencePipeline. */
import type { EvidencePipeline, EvidencePackage } from '../../../framework/evidence/EvidencePipeline';
import type { DecisionResult } from '../decision/HospitalityDecision';
import type { HospitalityScoreResult } from '../scoring/HospitalityScoreEngine';

export interface HospitalityEvidenceInput {
  businessModel: string;
  decision: DecisionResult;
  score: HospitalityScoreResult;
  calibrationVersion: string;
  snapshotId: string;
}

export class HospitalityEvidence {
  constructor(private readonly pipeline: EvidencePipeline) {}

  build(input: HospitalityEvidenceInput): Readonly<EvidencePackage> {
    return this.pipeline.build({
      engineId: 'sector.hospitality',
      recommendation: input.decision.verdict,
      compositeScore: input.score.composite,
      confidence: 0.8,
      supportingScores: [
        { id: 'occupancy', name: 'Occupancy', value: input.score.pillars.occupancy },
        { id: 'demandRevpar', name: 'Demand/RevPAR', value: input.score.pillars.demandRevpar },
        { id: 'earningsQuality', name: 'Earnings Quality', value: input.score.pillars.earningsQuality },
      ],
      decisionRulesApplied: input.decision.overridesApplied,
      calibrationVersion: input.calibrationVersion,
      replayReference: input.snapshotId,
      provenance: {
        frameworkVersion: '1.0',
        engineVersion: '1.0.0',
        methodologyVersion: 'IES-010 v1.0',
        snapshotId: input.snapshotId,
      },
    });
  }
}
