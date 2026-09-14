/** Hospitality Decision Engine (WP-3) — composite→verdict + overrides + precedence (D10, frozen). */
import type { HospitalityCalibrationProfile } from '../calibration/HospitalityCalibration';
import type { HospitalityInput } from '../metrics/HospitalityMetrics';

export interface DecisionInput {
  composite: number;
  businessModel: string;
  debtEbitda: number;
  demandShock?: boolean;
  occupancyCollapse?: boolean;
  brandDeterioration?: boolean;
  governance?: boolean;
}

export interface DecisionResult {
  verdict: string;
  composite: number;
  overridesApplied: string[];
}

const CAP_RANK: Record<string, number> = { 'Strong Buy': 6, Buy: 5, Accumulate: 4, Hold: 3, Watch: 2, Avoid: 1 };

export class HospitalityDecision {
  constructor(private readonly calibration: HospitalityCalibrationProfile) {}

  decide(input: DecisionInput): DecisionResult {
    let verdict = this.verdictFor(input.composite);
    const overridesApplied: string[] = [];
    const cap = (v: string, vcap: string): string => (CAP_RANK[v] > CAP_RANK[vcap] ? vcap : v);

    // Precedence (highest first): Governance → Brand → OccupancyCollapse → DemandShock → Leverage.
    if (input.governance) {
      verdict = cap(verdict, 'Avoid');
      overridesApplied.push('governance');
    }
    if (input.brandDeterioration) {
      verdict = cap(verdict, 'Avoid');
      overridesApplied.push('brand-deterioration');
    }
    if (input.occupancyCollapse) {
      verdict = cap(verdict, 'Avoid');
      overridesApplied.push('occupancy-collapse');
    }
    if (input.demandShock) {
      verdict = cap(verdict, 'Watch');
      overridesApplied.push('demand-shock');
    }
    const alert = this.calibration.businessModels[input.businessModel]?.leverageAlert ?? 3.0;
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
