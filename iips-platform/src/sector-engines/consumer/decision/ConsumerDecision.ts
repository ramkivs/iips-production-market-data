/** Consumer Decision Engine (WP-3) — composite→verdict + overrides + precedence (D10, frozen). */
import type { ConsumerCalibrationProfile } from '../calibration/ConsumerCalibration';
import type { ConsumerInput } from '../metrics/ConsumerMetrics';

export interface DecisionInput {
  composite: number;
  segment: string;
  debtEbitda: number;
  governance?: boolean;
  brandErosion?: boolean;
  categoryDisruption?: boolean;
  inputCostSqueeze?: boolean;
  channelLoss?: boolean;
}

export interface DecisionResult {
  verdict: string;
  composite: number;
  overridesApplied: string[];
}

const CAP_RANK: Record<string, number> = { 'Strong Buy': 6, Buy: 5, Accumulate: 4, Hold: 3, Watch: 2, Avoid: 1 };

export class ConsumerDecision {
  constructor(private readonly calibration: ConsumerCalibrationProfile) {}

  decide(input: DecisionInput): DecisionResult {
    let verdict = this.verdictFor(input.composite);
    const overridesApplied: string[] = [];
    const cap = (v: string, vcap: string): string => (CAP_RANK[v] > CAP_RANK[vcap] ? vcap : v);

    // Precedence: governance → brand erosion → category disruption → input-cost squeeze → channel loss → leverage.
    if (input.governance) {
      verdict = cap(verdict, 'Avoid');
      overridesApplied.push('governance');
    }
    if (input.brandErosion) {
      verdict = cap(verdict, 'Avoid');
      overridesApplied.push('brand-erosion');
    }
    if (input.categoryDisruption) {
      verdict = cap(verdict, 'Watch');
      overridesApplied.push('category-disruption');
    }
    if (input.inputCostSqueeze) {
      verdict = cap(verdict, 'Watch');
      overridesApplied.push('input-cost-squeeze');
    }
    if (input.channelLoss) {
      verdict = cap(verdict, 'Watch');
      overridesApplied.push('channel-loss');
    }
    const alert = this.calibration.segments[input.segment]?.leverageAlert ?? 3.0;
    if (input.debtEbitda > alert) {
      verdict = cap(verdict, 'Watch');
      overridesApplied.push('leverage-alert');
    }

    return { verdict, composite: input.composite, overridesApplied };
  }

  private verdictFor(composite: number): string {
    for (const b of this.calibration.verdictMapping) {
      if (composite >= b.min && composite <= b.max) return b.verdict;
    }
    return 'Avoid';
  }
}
