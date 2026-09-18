/** Utilities Decision Engine (WP-3) — composite→verdict + overrides + precedence (D10, frozen). */
import type { UtilitiesCalibrationProfile } from '../calibration/UtilitiesCalibration';
import type { UtilitiesInput } from '../metrics/UtilitiesMetrics';

export interface DecisionInput {
  composite: number;
  segment: string;
  debtEbitda: number;
  governance?: boolean;
  adverseRateCase?: boolean;
  regulatoryLag?: boolean;
  capexOverrun?: boolean;
  strandedAsset?: boolean;
}

export interface DecisionResult {
  verdict: string;
  composite: number;
  overridesApplied: string[];
}

const CAP_RANK: Record<string, number> = { 'Strong Buy': 6, Buy: 5, Accumulate: 4, Hold: 3, Watch: 2, Avoid: 1 };

export class UtilitiesDecision {
  constructor(private readonly calibration: UtilitiesCalibrationProfile) {}

  decide(input: DecisionInput): DecisionResult {
    let verdict = this.verdictFor(input.composite);
    const overridesApplied: string[] = [];
    const cap = (v: string, vcap: string): string => (CAP_RANK[v] > CAP_RANK[vcap] ? vcap : v);

    // Precedence: governance → adverse rate case → regulatory lag → capex overrun → stranded asset → leverage.
    if (input.governance) {
      verdict = cap(verdict, 'Avoid');
      overridesApplied.push('governance');
    }
    if (input.adverseRateCase) {
      verdict = cap(verdict, 'Watch');
      overridesApplied.push('adverse-rate-case');
    }
    if (input.regulatoryLag) {
      verdict = cap(verdict, 'Watch');
      overridesApplied.push('regulatory-lag');
    }
    if (input.capexOverrun) {
      verdict = cap(verdict, 'Watch');
      overridesApplied.push('capex-overrun');
    }
    if (input.strandedAsset) {
      verdict = cap(verdict, 'Watch');
      overridesApplied.push('stranded-asset');
    }
    const alert = this.calibration.segments[input.segment]?.leverageAlert ?? 5.5;
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
