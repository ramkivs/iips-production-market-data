/** Capital Markets Decision Engine (WP-3) — composite→verdict + overrides (frozen). */
import type { CapitalMarketsCalibrationProfile } from '../calibration/CapitalMarketsCalibration';

export interface CapitalMarketsDecisionInput {
  composite: number;
  costToIncome: number | undefined;
  aumGrowth?: number;
  regulatoryFlag?: string;
  governanceFlag?: string;
  marketCycleFlag?: string;
  confidence: number;
}

export interface CapitalMarketsDecisionResult {
  verdict: string;
  composite: number;
  confidence: number;
  overridesApplied: readonly string[];
}

export class CapitalMarketsDecision {
  constructor(private readonly calibration: CapitalMarketsCalibrationProfile) {}

  decide(input: CapitalMarketsDecisionInput): CapitalMarketsDecisionResult {
    let verdict = this.verdictFor(input.composite);
    const overridesApplied: string[] = [];

    for (const rule of this.calibration.overrideRules) {
      if (rule.rule === 'regulatory-breach' && input.regulatoryFlag === 'BREACH') {
        if (this.capRank(verdict) > this.capRank('Avoid')) { verdict = 'Avoid'; overridesApplied.push('regulatory-breach'); }
      }
      if (rule.rule === 'governance-failure' && input.governanceFlag === 'SEVERE_GOVERNANCE_FAILURE') {
        if (this.capRank(verdict) > this.capRank('Avoid')) { verdict = 'Avoid'; overridesApplied.push('governance-failure'); }
      }
      if (rule.rule === 'cost-blowout' && input.costToIncome !== undefined && input.costToIncome > 70) {
        if (this.capRank(verdict) > this.capRank('Watch')) { verdict = 'Watch'; overridesApplied.push('cost-blowout'); }
      }
      if (rule.rule === 'market-cycle-stress' && input.marketCycleFlag === 'STRESS') {
        if (this.capRank(verdict) > this.capRank('Accumulate')) { verdict = 'Accumulate'; overridesApplied.push('market-cycle-stress'); }
      }
      if (rule.rule === 'severe-aum-outflow' && input.aumGrowth !== undefined && input.aumGrowth < -5) {
        if (this.capRank(verdict) > this.capRank('Accumulate')) { verdict = 'Accumulate'; overridesApplied.push('severe-aum-outflow'); }
      }
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
