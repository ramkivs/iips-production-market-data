/** Insurance Decision Engine (WP-3) — composite→verdict + overrides (frozen). */
import type { InsuranceCalibrationProfile } from '../calibration/InsuranceCalibration';

export interface InsuranceDecisionInput {
  composite: number;
  combinedRatio: number | undefined;
  solvency: number;
  /** Raw solvency ratio (regulatory threshold 1.25). */
  solvencyRatio?: number;
  persistency: number | undefined;
  governanceFlag?: string;
  catastropheFlag?: string;
  confidence: number;
}

export interface InsuranceDecisionResult {
  verdict: string;
  composite: number;
  confidence: number;
  overridesApplied: readonly string[];
}

export class InsuranceDecision {
  constructor(private readonly calibration: InsuranceCalibrationProfile) {}

  decide(input: InsuranceDecisionInput): InsuranceDecisionResult {
    let verdict = this.verdictFor(input.composite);
    const overridesApplied: string[] = [];

    for (const rule of this.calibration.overrideRules) {
      if (rule.rule === 'solvency-breach' && input.solvencyRatio !== undefined && input.solvencyRatio < 1.25) {
        if (this.capRank(verdict) > this.capRank('Watch')) { verdict = 'Watch'; overridesApplied.push('solvency-breach'); }
      }
      if (rule.rule === 'critical-combined-ratio' && input.combinedRatio !== undefined && input.combinedRatio >= 105) {
        if (this.capRank(verdict) > this.capRank('Watch')) { verdict = 'Watch'; overridesApplied.push('critical-combined-ratio'); }
      }
      if (rule.rule === 'governance-failure' && input.governanceFlag === 'SEVERE_GOVERNANCE_FAILURE') {
        if (this.capRank(verdict) > this.capRank('Avoid')) { verdict = 'Avoid'; overridesApplied.push('governance-failure'); }
      }
      if (rule.rule === 'catastrophic-claims' && input.catastropheFlag === 'YES') {
        if (this.capRank(verdict) > this.capRank('Hold')) { verdict = 'Hold'; overridesApplied.push('catastrophic-claims'); }
      }
      if (rule.rule === 'persistency-deterioration' && input.persistency !== undefined && input.persistency < 70) {
        if (this.capRank(verdict) > this.capRank('Accumulate')) { verdict = 'Accumulate'; overridesApplied.push('persistency-deterioration'); }
      }
    }

    return { verdict, composite: input.composite, confidence: input.confidence, overridesApplied };
  }

  private verdictFor(composite: number): string {
    const bands = [...this.calibration.verdictMapping].sort((a, b) => a.minScore - b.minScore);
    for (const b of bands) {
      if (composite >= b.minScore && composite <= b.maxScore) return b.verdict;
    }
    return 'Avoid';
  }

  private capRank(v: string): number {
    const order = ['Avoid', 'Watch', 'Hold', 'Accumulate', 'Buy', 'Strong Buy'];
    return order.indexOf(v);
  }
}
