/**
 * Telecommunications Evidence (D16) — evidence packages per D11. Reuses EvidencePipeline.
 *
 * Maintainer decision (Option A, recorded): `confidence: 0.8` is used ONLY as the required
 * internal EvidencePipeline.build() plumbing value (the certified platform evidence-package
 * field is non-nullable). It is NOT added to engine metadata and does NOT fabricate a
 * governed confidence — the v3.0 transport reports golden confidence as `null` for sectors
 * whose certified expected outputs carry none (rendered "unavailable").
 */
import type { EvidencePipeline, EvidencePackage } from '../../../framework/evidence/EvidencePipeline';
import type { TelecommunicationsDecisionResult } from '../decision/TelecommunicationsDecision';
import type { TelecommunicationsScoreResult } from '../scoring/TelecommunicationsScoreEngine';

export interface TelecommunicationsEvidenceInput {
  subsegment: string;
  archetype: string;
  decision: TelecommunicationsDecisionResult;
  score: TelecommunicationsScoreResult;
  calibrationVersion: string;
  snapshotId: string;
}

export class TelecommunicationsEvidence {
  constructor(private readonly pipeline: EvidencePipeline) {}

  build(input: TelecommunicationsEvidenceInput): Readonly<EvidencePackage> {
    return this.pipeline.build({
      engineId: 'sector.telecommunications',
      recommendation: input.decision.verdict,
      compositeScore: input.score.composite,
      confidence: 0.8, // internal platform plumbing only — never surfaced as governed confidence
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
        methodologyVersion: 'IES-016 v1.0',
        snapshotId: input.snapshotId,
      },
    });
  }
}
