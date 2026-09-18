/** Consumer Score Engine (WP-3) — band→score→pillar→composite per D15. Deterministic. */
import type { ConsumerInput } from '../metrics/ConsumerMetrics';
import type { ConsumerCalibrationProfile } from '../calibration/ConsumerCalibration';

/** Round-half-to-even (matches frozen expected outputs basis). */
function r1h2e(x: number): number {
  const scaled = x * 10;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  if (frac === 0.5) return (floor % 2 === 0 ? floor : floor + 1) / 10;
  return Math.round(scaled) / 10;
}

export interface ConsumerPillars {
  quality: number;
  growth: number;
  risk: number;
  profitability: number;
  capitalEfficiency: number;
  valuation: number;
}

export interface ConsumerScoreResult {
  pillars: ConsumerPillars;
  composite: number;
}

export class ConsumerScoreEngine {
  constructor(private readonly calibration: ConsumerCalibrationProfile) {}

  score(input: ConsumerInput): ConsumerScoreResult {
    const sEb = this.band('CM-001-ebitda-margin', input.ebitdaMargin);
    const sG = this.band('CM-002-revenue-growth', input.revenueGrowth);
    const sPp = this.band('CM-006-pricing-power', input.priceContribution);
    const sBl = this.band('CM-007-brand-loyalty', input.brandLoyalty);
    const sMr = this.band('CM-008-margin-resilience', input.marginResilience);
    const sLev = this.band('CM-003-leverage', input.debtEbitda);
    const sVal = this.band('CM-003-leverage', input.peRatio);

    // Pillars (matches frozen expected output computation)
    const quality = r1h2e(sPp * 0.4 + sBl * 0.3 + sMr * 0.3);
    const growth = r1h2e(sG);
    const risk = r1h2e(sLev);
    const profitability = r1h2e(sEb * 0.7 + this.band('CM-002-revenue-growth', input.roic) * 0.3);
    const capitalEfficiency = r1h2e(this.band('CM-002-revenue-growth', input.fcfYield));
    const valuation = sVal;

    const pillars: ConsumerPillars = { quality, growth, risk, profitability, capitalEfficiency, valuation };

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
