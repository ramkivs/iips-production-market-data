/** Banking Decision Engine (WP-3) — composite→verdict + override rules (frozen). */
import type { BankingCalibrationProfile } from '../calibration/BankingCalibration';

export interface DecisionInput {
  composite: number;
  assetQuality: number;
  capitalStrength: number;
  gnpa: number | undefined;
  governanceFlag?: string;
  confidence: number;
}

export interface BankingDecisionResult {
  verdict: string;
  composite: number;
  confidence: number;
  overridesApplied: readonly string[];
}

export class BankingDecision {
  constructor(private readonly calibration: BankingCalibrationProfile) {}

  decide(input: DecisionInput): BankingDecisionResult {
    let verdict = this.verdictFor(input.composite);
    const overridesApplied: string[] = [];

    // Override rules (frozen profile).
    for (const rule of this.calibration.overrideRules) {
      if (rule.rule === 'severe-asset-quality' && input.gnpa !== undefined && input.gnpa >= 5) {
        if (this.capRank(verdict) > this.capRank('Watch')) { verdict = 'Watch'; overridesApplied.push('severe-asset-quality'); }
      }
      if (rule.rule === 'capital-adequacy-breach' && input.capitalStrength < 40) {
        if (this.capRank(verdict) > this.capRank('Watch')) { verdict = 'Watch'; overridesApplied.push('capital-adequacy-breach'); }
      }
      if (rule.rule === 'governance-failure' && input.governanceFlag === 'SEVERE_GOVERNANCE_FAILURE') {
        if (this.capRank(verdict) > this.capRank('Avoid')) { verdict = 'Avoid'; overridesApplied.push('governance-failure'); }
      }
    }

    return {
      verdict,
      composite: input.composite,
      confidence: input.confidence,
      overridesApplied,
    };
  }

  private verdictFor(composite: number): string {
    const bands = [...this.calibration.verdictMapping].sort((a, b) => a.minScore - b.minScore);
    for (const b of bands) {
      if (composite >= b.minScore && composite <= b.maxScore) return b.verdict;
    }
    return 'Avoid';
  }

  /** Higher = stronger recommendation. */
  private capRank(v: string): number {
    const order = ['Avoid', 'Watch', 'Hold', 'Accumulate', 'Buy', 'Strong Buy'];
    return order.indexOf(v);
  }
}
