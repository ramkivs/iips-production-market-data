/**
 * Automobile Decision Engine (D17) — verdict mapping + min-rank overrides. Deterministic.
 *
 * Formal operator (D17 §10): finalVerdict = min_rank(baseVerdict, all applicable override caps).
 * Evaluation order (leverage-breach -> governance -> recall-risk -> battery-cost-shock ->
 * demand-collapse -> capex-overrun -> margin-compression -> competition-pressure) is audit
 * order only; the final verdict is the lowest rank among the base verdict and all applicable caps.
 *
 * M14: leverage-breach applies automatically when debtEbitda >= subsegment.leverageAlert -> cap Watch.
 */
import type { AutomobileCalibrationProfile } from '../calibration/AutomobileCalibration';
import type { AutomobileInput } from '../metrics/AutomobileMetrics';

export interface AutomobileDecisionInput {
  composite: number;
  subsegment: string;
  debtEbitda?: number;
  governance?: boolean;
  recallRisk?: boolean;
  batteryCostShock?: boolean;
  demandCollapse?: boolean;
  capexOverrun?: boolean;
  marginCompression?: boolean;
  competitionPressure?: boolean;
}

export interface AutomobileDecisionResult {
  verdict: string;
  composite: number;
  overridesApplied: string[];
}

const RANK: Record<string, number> = { 'Strong Buy': 6, Buy: 5, Accumulate: 4, Hold: 3, Watch: 2, Avoid: 1 };
const CAP: Record<string, string> = {
  governance: 'Avoid',
  'recall-risk': 'Watch',
  'battery-cost-shock': 'Watch',
  'demand-collapse': 'Watch',
  'capex-overrun': 'Watch',
  'margin-compression': 'Watch',
  'competition-pressure': 'Watch',
  'leverage-breach': 'Watch',
};

export class AutomobileDecision {
  constructor(private readonly calibration: AutomobileCalibrationProfile) {}

  decide(input: AutomobileDecisionInput): AutomobileDecisionResult {
    let verdict = this.verdictFor(input.composite);
    const overridesApplied: string[] = [];

    // M14 — leverage breach override (raw debt/ebitda >= subsegment alert)
    const alert = this.calibration.segments[input.subsegment]?.leverageAlert ?? 3.0;
    if (input.debtEbitda !== undefined && input.debtEbitda >= alert) {
      overridesApplied.push('leverage-breach');
    }

    if (input.governance) overridesApplied.push('governance');
    if (input.recallRisk) overridesApplied.push('recall-risk');
    if (input.batteryCostShock) overridesApplied.push('battery-cost-shock');
    if (input.demandCollapse) overridesApplied.push('demand-collapse');
    if (input.capexOverrun) overridesApplied.push('capex-overrun');
    if (input.marginCompression) overridesApplied.push('margin-compression');
    if (input.competitionPressure) overridesApplied.push('competition-pressure');

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

/** Decision-input adapter from the raw input contract. */
export function toDecisionInput(input: AutomobileInput, composite: number, subsegment: string): AutomobileDecisionInput {
  return {
    composite,
    subsegment,
    debtEbitda: input.debtEbitda,
    governance: input.governance,
    recallRisk: input.recallRisk,
    batteryCostShock: input.batteryCostShock,
    demandCollapse: input.demandCollapse,
    capexOverrun: input.capexOverrun,
    marginCompression: input.marginCompression,
    competitionPressure: input.competitionPressure,
  };
}
