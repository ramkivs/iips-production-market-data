/**
 * Technology Decision Engine (WP-3) — D10/D15 v1.3: verdict mapping + min-rank overrides. Deterministic.
 *
 * Formal operator (D15 §10): finalVerdict = min_rank(baseVerdict, all applicable override caps).
 * Evaluation order 1..7 (governance -> disruption -> churn-collapse -> customer-loss ->
 * capex-overrun -> margin-compression -> leverage-breach) is audit order only; the final verdict
 * is the lowest rank among the base verdict and all applicable caps.
 */
import type { TechnologyCalibrationProfile } from '../calibration/TechnologyCalibration';
import type { TechnologyInput } from '../metrics/TechnologyMetrics';

export interface TechnologyDecisionInput {
  composite: number;
  subsegment: string;
  debtEbitda?: number;
  governance?: boolean;
  disruption?: boolean;
  churnCollapse?: boolean;
  customerLoss?: boolean;
  capexOverrun?: boolean;
  marginCompression?: boolean;
}

export interface TechnologyDecisionResult {
  verdict: string;
  composite: number;
  overridesApplied: string[];
}

const RANK: Record<string, number> = { 'Strong Buy': 6, Buy: 5, Accumulate: 4, Hold: 3, Watch: 2, Avoid: 1 };
const CAP: Record<string, string> = {
  governance: 'Avoid',
  disruption: 'Watch',
  'churn-collapse': 'Watch',
  'customer-loss': 'Watch',
  'capex-overrun': 'Watch',
  'margin-compression': 'Watch',
  'leverage-breach': 'Watch',
};

export class TechnologyDecision {
  constructor(private readonly calibration: TechnologyCalibrationProfile) {}

  decide(input: TechnologyDecisionInput): TechnologyDecisionResult {
    let verdict = this.verdictFor(input.composite);
    const overridesApplied: string[] = [];

    // Leverage breach override (raw debt/ebitda >= subsegment alert)
    const alert = this.calibration.segments[input.subsegment]?.leverageAlert ?? 3.0;
    if (input.debtEbitda !== undefined && input.debtEbitda >= alert) {
      overridesApplied.push('leverage-breach');
    }

    if (input.governance) overridesApplied.push('governance');
    if (input.disruption) overridesApplied.push('disruption');
    if (input.churnCollapse) overridesApplied.push('churn-collapse');
    if (input.customerLoss) overridesApplied.push('customer-loss');
    if (input.capexOverrun) overridesApplied.push('capex-overrun');
    if (input.marginCompression) overridesApplied.push('margin-compression');

    // min_rank(baseVerdict, all applicable override caps)
    for (const ovr of overridesApplied) {
      const cap = CAP[ovr];
      if (RANK[verdict] > RANK[cap]) verdict = cap;
    }

    return { verdict, composite: input.composite, overridesApplied };
  }

  private verdictFor(composite: number): string {
    for (const b of this.calibration.verdictMapping) {
      // lower-inclusive / upper-exclusive; terminal (100) maps to Strong Buy
      if (composite >= b.min && composite < b.max) return b.verdict;
    }
    return 'Strong Buy'; // composite == 100 (terminal band includes upper boundary)
  }
}
