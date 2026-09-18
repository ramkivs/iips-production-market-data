/** Healthcare Decision Engine (WP-3) — composite→verdict + clinical-quality constraint + overrides + precedence (frozen). */
import type { HealthcareCalibrationProfile } from '../calibration/HealthcareCalibration';

export interface HealthcareDecisionInput {
  composite: number;
  clinicalQualityFail: boolean;
  occupancy: number | undefined;
  regulatoryFlag?: string;
  pipelineFlag?: string;
  confidence: number;
}

export interface HealthcareDecisionResult {
  verdict: string;
  composite: number;
  confidence: number;
  overridesApplied: readonly string[];
}

export class HealthcareDecision {
  constructor(private readonly calibration: HealthcareCalibrationProfile) {}

  decide(input: HealthcareDecisionInput): HealthcareDecisionResult {
    let verdict = this.verdictFor(input.composite);
    const overridesApplied: string[] = [];

    // Precedence: regulatory → clinical-quality → occupancy → pipeline → normal
    if (input.regulatoryFlag === 'ACTION') {
      if (this.capRank(verdict) > this.capRank('Watch')) { verdict = 'Watch'; overridesApplied.push('regulatory-action'); }
    }
    if (input.clinicalQualityFail) {
      if (this.capRank(verdict) > this.capRank('Avoid')) { verdict = 'Avoid'; overridesApplied.push('clinical-quality-failure'); }
    }
    if (input.occupancy !== undefined && input.occupancy < 50) {
      if (this.capRank(verdict) > this.capRank('Watch')) { verdict = 'Watch'; overridesApplied.push('occupancy-collapse'); }
    }
    if (input.pipelineFlag === 'FAIL') {
      if (this.capRank(verdict) > this.capRank('Accumulate')) { verdict = 'Accumulate'; overridesApplied.push('pipeline-failure'); }
    }

    return { verdict, composite: input.composite, confidence: input.confidence, overridesApplied };
  }

  private verdictFor(composite: number): string {
    const bands = [...this.calibration.verdictMapping].sort((a, b) => a.minScore - b.minScore);
    for (const b of bands) if (composite >= b.minScore && composite <= b.maxScore) return b.verdict;
    return 'Avoid';
  }

  private capRank(v: string): number {
    return ['Avoid', 'Watch', 'Hold', 'Accumulate', 'Buy', 'Strong Buy'].indexOf(v);
  }
}
