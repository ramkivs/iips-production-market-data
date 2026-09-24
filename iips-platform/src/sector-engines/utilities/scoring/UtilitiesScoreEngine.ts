/** Utilities Score Engine (WP-3) — band→score→pillar→composite per D15. Deterministic. */
import type { UtilitiesInput } from '../metrics/UtilitiesMetrics';
import type { UtilitiesCalibrationProfile } from '../calibration/UtilitiesCalibration';

/** Round-half-to-even (matches frozen expected outputs basis). */
function r1h2e(x: number): number {
  const scaled = x * 10;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  if (frac === 0.5) return (floor % 2 === 0 ? floor : floor + 1) / 10;
  return Math.round(scaled) / 10;
}

export interface UtilitiesPillars {
  quality: number;
  growth: number;
  risk: number;
  profitability: number;
  capitalEfficiency: number;
  valuation: number;
}

export interface UtilitiesScoreResult {
  pillars: UtilitiesPillars;
  composite: number;
}

export class UtilitiesScoreEngine {
  constructor(private readonly calibration: UtilitiesCalibrationProfile) {}

  score(input: UtilitiesInput): UtilitiesScoreResult {
    const sEb = this.band('UM-001-ebitda-margin', input.ebitdaMargin);
    const sRb = this.band('UM-006-rate-base-growth', input.rateBaseGrowth);
    const sFfo = this.band('UM-008-ffo-debt', input.ffoDebt);
    const sOm = this.band('UM-009-om-efficiency', input.omEfficiency);
    const sSaid = this.band('UM-011-saidi', input.saidi);
    const sLev = this.band('UM-003-leverage', input.debtEbitda);
    const sVal = this.band('UM-003-leverage', input.peRatio);

    // Pillars (matches frozen expected output computation)
    const quality = r1h2e(sOm * 0.4 + sSaid * 0.3 + sFfo * 0.3);
    const growth = r1h2e(sRb * 0.8 + sEb * 0.2);
    const risk = r1h2e(sLev);
    const profitability = r1h2e(sEb * 0.6 + sFfo * 0.4);
    const capitalEfficiency = r1h2e(sFfo);
    const valuation = sVal;

    const pillars: UtilitiesPillars = { quality, growth, risk, profitability, capitalEfficiency, valuation };

    const seg = this.calibration.segments[input.segment];
    const w = seg.weights;
    const composite = r1h2e(
      pillars.quality * w.quality + pillars.growth * w.growth + pillars.risk * w.risk +
      pillars.profitability * w.profitability + pillars.capitalEfficiency * w.capitalEfficiency + pillars.valuation * w.valuation,
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
}
