/** Industrials Decision Engine (WP-3) — D10/D15 v1.2: verdict mapping + min-rank overrides. Deterministic. */
import type { IndustrialsCalibrationProfile } from '../calibration/IndustrialsCalibration';
import type { IndustrialsInput } from '../metrics/IndustrialsMetrics';

export interface DecisionInput {
  composite: number;
  subsegment: string;
  debtEbitda: number;
  governance?: boolean;
  orderCancellation?: boolean;
  epcCostOverrun?: boolean;
  defenseProgramFail?: boolean;
  marginCompression?: boolean;
}

export interface DecisionResult {
  verdict: string;
  composite: number;
  overridesApplied: string[];
}

const RANK: Record<string, number> = { 'Strong Buy': 6, Buy: 5, Accumulate: 4, Hold: 3, Watch: 2, Avoid: 1 };
const CAP: Record<string, string> = {
  governance: 'Avoid',
  'defense-program': 'Watch',
  'epc-overrun': 'Watch',
  'order-cancellation': 'Watch',
  'margin-compression': 'Watch',
  'leverage-breach': 'Watch',
};

export class IndustrialsDecision {
  constructor(private readonly calibration: IndustrialsCalibrationProfile) {}

  decide(input: DecisionInput): DecisionResult {
    let verdict = this.verdictFor(input.composite);
    const overridesApplied: string[] = [];

    // Leverage breach override (raw debt/ebitda >= subsegment alert)
    const alert = this.calibration.segments[input.subsegment]?.leverageAlert ?? 3.5;
    if (input.debtEbitda >= alert) {
      overridesApplied.push('leverage-breach');
    }

    // Collect all applicable override caps
    if (input.governance) overridesApplied.push('governance');
    if (input.defenseProgramFail) overridesApplied.push('defense-program');
    if (input.epcCostOverrun) overridesApplied.push('epc-overrun');
    if (input.orderCancellation) overridesApplied.push('order-cancellation');
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
