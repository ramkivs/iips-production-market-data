/**
 * Telecommunications Decision Engine (D16) — verdict mapping + min-rank overrides. Deterministic.
 *
 * Formal operator (D16 §10): finalVerdict = min_rank(baseVerdict, all applicable override caps).
 * Evaluation order (leverage-breach -> governance -> regulatory-risk -> competition-pressure ->
 * subscriber-collapse -> capex-overrun -> margin-compression) is audit order only; the final
 * verdict is the lowest rank among the base verdict and all applicable caps.
 *
 * M14: leverage-breach applies automatically when debtEbitda >= subsegment.leverageAlert -> cap Watch.
 */
import type { TelecommunicationsCalibrationProfile } from '../calibration/TelecommunicationsCalibration';
import type { TelecommunicationsInput } from '../metrics/TelecommunicationsMetrics';

export interface TelecommunicationsDecisionInput {
  composite: number;
  subsegment: string;
  debtEbitda?: number;
  governance?: boolean;
  regulatoryRisk?: boolean;
  competitionPressure?: boolean;
  subscriberCollapse?: boolean;
  capexOverrun?: boolean;
  marginCompression?: boolean;
}

export interface TelecommunicationsDecisionResult {
  verdict: string;
  composite: number;
  overridesApplied: string[];
}

const RANK: Record<string, number> = { 'Strong Buy': 6, Buy: 5, Accumulate: 4, Hold: 3, Watch: 2, Avoid: 1 };
const CAP: Record<string, string> = {
  governance: 'Avoid',
  'regulatory-risk': 'Watch',
  'competition-pressure': 'Watch',
  'subscriber-collapse': 'Watch',
  'capex-overrun': 'Watch',
  'margin-compression': 'Watch',
  'leverage-breach': 'Watch',
};

export class TelecommunicationsDecision {
  constructor(private readonly calibration: TelecommunicationsCalibrationProfile) {}

  decide(input: TelecommunicationsDecisionInput): TelecommunicationsDecisionResult {
    let verdict = this.verdictFor(input.composite);
    const overridesApplied: string[] = [];

    // M14 — leverage breach override (raw debt/ebitda >= subsegment alert)
    const alert = this.calibration.segments[input.subsegment]?.leverageAlert ?? 3.0;
    if (input.debtEbitda !== undefined && input.debtEbitda >= alert) {
      overridesApplied.push('leverage-breach');
    }

    if (input.governance) overridesApplied.push('governance');
    if (input.regulatoryRisk) overridesApplied.push('regulatory-risk');
    if (input.competitionPressure) overridesApplied.push('competition-pressure');
    if (input.subscriberCollapse) overridesApplied.push('subscriber-collapse');
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

/** Decision-input adapter from the raw input contract. */
export function toDecisionInput(input: TelecommunicationsInput, composite: number, subsegment: string): TelecommunicationsDecisionInput {
  return {
    composite,
    subsegment,
    debtEbitda: input.debtEbitda,
    governance: input.governance,
    regulatoryRisk: input.regulatoryRisk,
    competitionPressure: input.competitionPressure,
    subscriberCollapse: input.subscriberCollapse,
    capexOverrun: input.capexOverrun,
    marginCompression: input.marginCompression,
  };
}
