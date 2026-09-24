/** Hospitality Score Engine (WP-3) — band→score→pillar→composite per D15. Deterministic. */
import type { HospitalityInput } from '../metrics/HospitalityMetrics';
import type { HospitalityCalibrationProfile } from '../calibration/HospitalityCalibration';

const r1 = (x: number): number => Math.round(x * 10) / 10;

export interface HospitalityPillars {
  occupancy: number;
  demandRevpar: number;
  growth: number;
  profitability: number;
  earningsQuality: number;
  capitalRisk: number;
}

export interface HospitalityScoreResult {
  pillars: HospitalityPillars;
  composite: number;
}

/** Round-half-to-even (matches frozen expected outputs basis, like CSIP). */
function r1h2e(x: number): number {
  const scaled = x * 10;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  if (frac === 0.5) return (floor % 2 === 0 ? floor : floor + 1) / 10;
  return Math.round(scaled) / 10;
}

export class HospitalityScoreEngine {
  constructor(private readonly calibration: HospitalityCalibrationProfile) {}

  score(input: HospitalityInput): HospitalityScoreResult {
    // Band → score
    const sOcc = this.band('HM-005-occupancy', input.occupancy);
    const sRev = this.band('HM-007-revpar', input.revpar);
    const sGop = this.band('HM-008-gop', input.gopMargin);
    const sEbitda = this.band('HM-008-gop', input.ebitdaMargin * 2);
    const sG = this.band('HM-009-revpar-growth', input.revparGrowth);
    const sFee = this.band('HM-010-fee-mix', input.feeMix);
    const sLev = this.band('HM-003-leverage', input.debtEbitda);
    const sRoic = this.band('HM-009-revpar-growth', input.roic * 2);
    const sDq = this.demandQuality(input.demandQualityMix);

    // Pillars
    const demandRevpar = r1h2e(sRev * 0.7 + sDq * 0.3);
    const profitability = r1h2e(sGop * 0.6 + sEbitda * 0.4);
    const capitalRisk = r1h2e(sLev * 0.7 + sRoic * 0.3);
    const pillars: HospitalityPillars = {
      occupancy: sOcc,
      demandRevpar,
      growth: sG,
      profitability,
      earningsQuality: sFee,
      capitalRisk,
    };

    const w = this.calibration.businessModels[input.businessModel].weights;
    const composite = r1h2e(
      pillars.occupancy * w.occupancy +
      pillars.demandRevpar * w.demand +
      pillars.growth * w.growth +
      pillars.profitability * w.profitability +
      pillars.earningsQuality * w.earningsQuality +
      pillars.capitalRisk * w.capitalRisk,
    );
    return { pillars, composite };
  }

  private band(metricId: string, value: number): number {
    const bands = this.calibration.bandScores[metricId] as unknown as Array<string | number>[];
    for (const b of bands) {
      const op = b[0] as string;
      if (op === 'gt' && value > (b[1] as number)) return b[2] as number;
      if (op === 'lt' && value < (b[1] as number)) return b[2] as number;
      if (op === 'range' && value >= (b[1] as number) && value <= (b[2] as number)) return b[3] as number;
    }
    throw new Error(`no band for ${metricId} value ${value}`);
  }

  private demandQuality(mix: number): number {
    const dq = this.calibration.demandQualityBands;
    for (const key of ['strong', 'good', 'adequate', 'weak'] as const) {
      if (mix >= dq[key].minPct) return dq[key].score;
    }
    return dq.weak.score;
  }
}
