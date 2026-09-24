/** Energy Score Engine (WP-3) — band→score→pillar→composite per D15. Deterministic. */
import type { EnergyInput } from '../metrics/EnergyMetrics';
import type { EnergyCalibrationProfile } from '../calibration/EnergyCalibration';

/** Round-half-to-even (matches frozen expected outputs basis). */
function r1h2e(x: number): number {
  const scaled = x * 10;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  if (frac === 0.5) return (floor % 2 === 0 ? floor : floor + 1) / 10;
  return Math.round(scaled) / 10;
}

export interface EnergyPillars {
  quality: number;
  growth: number;
  risk: number;
  profitability: number;
  capitalEfficiency: number;
  valuation: number;
}

export interface EnergyScoreResult {
  pillars: EnergyPillars;
  composite: number;
}

export class EnergyScoreEngine {
  constructor(private readonly calibration: EnergyCalibrationProfile) {}

  score(input: EnergyInput): EnergyScoreResult {
    // Base scores
    const sEb = this.band('EM-001-ebitda-margin', input.ebitdaMargin);
    const sG = this.band('EM-006-production-growth', input.productionGrowth);
    const sLc = this.band('EM-007-lifting-cost', input.liftingCost);
    const sRr = this.band('EM-008-reserve-replacement', input.reserveReplacement);
    const sLev = this.band('EM-003-leverage', input.debtEbitda);
    const sTr = this.band('EM-011-transition-mix', input.transitionMix);
    const sRoce = this.band('EM-006-production-growth', input.roce);
    const sFcf = this.band('EM-006-production-growth', input.fcfYield);
    const sVal = this.band('EM-003-leverage', input.evEbitda);

    // Pillars
    const quality = r1h2e(sLc * 0.6 + sRr * 0.4);
    const growth = r1h2e(sG * 0.7 + sTr * 0.3);
    const risk = r1h2e(sLev);
    const profitability = r1h2e(sEb * 0.7 + sRoce * 0.3);
    const capitalEfficiency = r1h2e(sRr * 0.5 + sFcf * 0.5);
    const valuation = sVal;

    const pillars: EnergyPillars = { quality, growth, risk, profitability, capitalEfficiency, valuation };

    const seg = this.calibration.segments[input.segment];
    const w = seg.weights;

    // Composite uses frozen segment weights (matches verified expected outputs).
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
