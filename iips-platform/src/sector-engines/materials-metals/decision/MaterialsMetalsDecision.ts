/**
 * Materials & Metals Decision Engine (D20) — verdict mapping + min-rank overrides. Deterministic.
 *
 * Formal operator (D20 §10): finalVerdict = min_rank(baseVerdict, all applicable override caps).
 * Evaluation order (leverage-breach -> governance -> tailings-failure -> permitting-revocation ->
 * strike-disruption -> capex-overrun -> margin-compression -> competition-pressure) is audit
 * order only; the final verdict is the lowest rank among the base verdict and all applicable caps.
 *
 * M14: leverage-breach applies automatically when debtEbitda >= subsegment.leverageAlert -> cap Watch.
 */
import type { MaterialsMetalsCalibrationProfile } from '../calibration/MaterialsMetalsCalibration';
import type { MaterialsMetalsInput } from '../metrics/MaterialsMetalsMetrics';

export interface MaterialsMetalsDecisionInput {
  composite: number;
  subsegment: string;
  debtEbitda?: number;
  governance?: boolean;
  tailingsFailure?: boolean;
  permittingRevocation?: boolean;
  strikeDisruption?: boolean;
  capexOverrun?: boolean;
  marginCompression?: boolean;
  competitionPressure?: boolean;
}

export interface MaterialsMetalsDecisionResult {
  verdict: string;
  composite: number;
  overridesApplied: string[];
}

const RANK: Record<string, number> = { 'Strong Buy': 6, Buy: 5, Accumulate: 4, Hold: 3, Watch: 2, Avoid: 1 };
const CAP: Record<string, string> = {
  governance: 'Avoid',
  'tailings-failure': 'Watch',
  'permitting-revocation': 'Watch',
  'strike-disruption': 'Watch',
  'capex-overrun': 'Watch',
  'margin-compression': 'Watch',
  'competition-pressure': 'Watch',
  'leverage-breach': 'Watch',
};

export class MaterialsMetalsDecision {
  constructor(private readonly calibration: MaterialsMetalsCalibrationProfile) {}

  decide(input: MaterialsMetalsDecisionInput): MaterialsMetalsDecisionResult {
    let verdict = this.verdictFor(input.composite);
    const overridesApplied: string[] = [];

    // M14 — leverage breach override (raw debt/ebitda >= subsegment alert)
    const alert = this.calibration.segments[input.subsegment]?.leverageAlert ?? 3.0;
    if (input.debtEbitda !== undefined && input.debtEbitda >= alert) {
      overridesApplied.push('leverage-breach');
    }

    if (input.governance) overridesApplied.push('governance');
    if (input.tailingsFailure) overridesApplied.push('tailings-failure');
    if (input.permittingRevocation) overridesApplied.push('permitting-revocation');
    if (input.strikeDisruption) overridesApplied.push('strike-disruption');
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
export function toDecisionInput(input: MaterialsMetalsInput, composite: number, subsegment: string): MaterialsMetalsDecisionInput {
  return {
    composite,
    subsegment,
    debtEbitda: input.debtEbitda,
    governance: input.governance,
    tailingsFailure: input.tailingsFailure,
    permittingRevocation: input.permittingRevocation,
    strikeDisruption: input.strikeDisruption,
    capexOverrun: input.capexOverrun,
    marginCompression: input.marginCompression,
    competitionPressure: input.competitionPressure,
  };
}
