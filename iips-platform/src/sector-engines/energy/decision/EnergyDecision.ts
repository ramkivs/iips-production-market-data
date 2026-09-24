/** Energy Decision Engine (WP-3) — composite→verdict + overrides + precedence (D10, frozen). */
import type { EnergyCalibrationProfile } from '../calibration/EnergyCalibration';
import type { EnergyInput } from '../metrics/EnergyMetrics';

export interface DecisionInput {
  composite: number;
  segment: string;
  debtEbitda: number;
  governance?: boolean;
  strandedAsset?: boolean;
  reserveWriteDown?: boolean;
  costBlowout?: boolean;
  priceCollapse?: boolean;
}

export interface DecisionResult {
  verdict: string;
  composite: number;
  overridesApplied: string[];
}

const CAP_RANK: Record<string, number> = { 'Strong Buy': 6, Buy: 5, Accumulate: 4, Hold: 3, Watch: 2, Avoid: 1 };

export class EnergyDecision {
  constructor(private readonly calibration: EnergyCalibrationProfile) {}

  decide(input: DecisionInput): DecisionResult {
    let verdict = this.verdictFor(input.composite);
    const overridesApplied: string[] = [];
    const cap = (v: string, vcap: string): string => (CAP_RANK[v] > CAP_RANK[vcap] ? vcap : v);

    // Precedence: governance → stranded asset → reserve write-down → cost blowout → price collapse → leverage.
    if (input.governance) {
      verdict = cap(verdict, 'Avoid');
      overridesApplied.push('governance');
    }
    if (input.strandedAsset) {
      verdict = cap(verdict, 'Watch');
      overridesApplied.push('stranded-asset');
    }
    if (input.reserveWriteDown) {
      verdict = cap(verdict, 'Watch');
      overridesApplied.push('reserve-write-down');
    }
    if (input.costBlowout) {
      verdict = cap(verdict, 'Watch');
      overridesApplied.push('cost-blowout');
    }
    if (input.priceCollapse) {
      verdict = cap(verdict, 'Watch');
      overridesApplied.push('price-collapse');
    }
    const alert = this.calibration.segments[input.segment]?.leverageAlert ?? 3.5;
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
