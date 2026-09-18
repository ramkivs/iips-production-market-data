/** Industrials Score Engine (WP-3) — D15 v1.2 contract: band→score→pillar→composite. Deterministic. */
import type { IndustrialsInput } from '../metrics/IndustrialsMetrics';
import type { IndustrialsCalibrationProfile } from '../calibration/IndustrialsCalibration';

/** Round-half-to-even (applied at composite only; pillars kept at full precision). */
function r1h2e(x: number): number {
  const scaled = x * 10;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  if (frac === 0.5) return (floor % 2 === 0 ? floor : floor + 1) / 10;
  return Math.round(scaled) / 10;
}

export interface IndustrialsPillars {
  quality: number;
  growth: number;
  risk: number;
  profitability: number;
  capitalEfficiency: number;
  valuation: number;
}

export interface IndustrialsScoreResult {
  pillars: IndustrialsPillars;
  composite: number;
}

export class IndustrialsScoreEngine {
  constructor(private readonly calibration: IndustrialsCalibrationProfile) {}

  /** Band→score (lower-inclusive / upper-exclusive). */
  band(mid: string, value: number | null | undefined): number {
    if (value === null || value === undefined) return Number.NaN; // missing sentinel
    const bands = this.calibration.bandScores[mid] as unknown as Array<string | number>[];
    // Frozen calibration encodes as: ["lt",x,score], ["range",lo,hi,score], ["gte",x,score]
    // which is exactly lower-inclusive/upper-exclusive.
    for (const b of bands) {
      const op = b[0] as string;
      if (op === 'lt' && value < (b[1] as number)) return b[2] as number;
      if (op === 'gte' && value >= (b[1] as number)) return b[2] as number;
      if (op === 'range' && value >= (b[1] as number) && value < (b[2] as number)) return b[3] as number;
    }
    throw new Error(`no band for ${mid} value ${value}`);
  }

  score(input: IndustrialsInput): IndustrialsScoreResult {
    const m: Record<string, number> = {
      'IM-001': this.band('IM-001', input.ebitdaMargin),
      'IM-002': this.band('IM-002', input.revenueGrowth),
      'IM-003': this.band('IM-003', input.debtEbitda),
      'IM-004': this.band('IM-004', input.evEbitda),
      'IM-005': this.band('IM-005', input.roce),
      'IM-006': this.band('IM-006', input.backlog),
      'IM-007': this.band('IM-007', input.bookToBill),
      'IM-008': this.band('IM-008', input.aftermarketShare),
      'IM-009': this.band('IM-009', input.fcfYield),
      'IM-010': this.band('IM-010', input.orderGrowth),
      'IM-011': this.band('IM-011', input.operatingMargin),
      'IM-012': this.band('IM-012', input.projectRiskExposure),
    };
    const metric = (code: string): number | null => {
      const v = m[code];
      return v === undefined || Number.isNaN(v) ? null : v;
    };

    // Quality: Aftermarket%(IM-008)*0.40 + CostPosition(IM-011)*0.35 + Execution((IM-001+IM-011)/2)*0.25
    // Derived-component missing rule: available constituents renormalized.
    const im001 = metric('IM-001'), im011 = metric('IM-011'), im008 = metric('IM-008');
    const cost_pos = im011; // derived = IM-011
    const exe_parts = [im001, im011].filter((s): s is number => s !== null);
    const execution = exe_parts.length ? exe_parts.reduce((a, b) => a + b, 0) / exe_parts.length : null;
    const quality = renorm(
      im008 !== null ? [im008, 0.40] : null,
      cost_pos !== null ? [cost_pos, 0.35] : null,
      execution !== null ? [execution, 0.25] : null,
    );

    // Growth: IM-006*0.40 + IM-010*0.35 + IM-002*0.25
    const growth = renorm(pair(m['IM-006'], 0.40), pair(m['IM-010'], 0.35), pair(m['IM-002'], 0.25));
    // Risk: IM-003*0.70 + IM-012*0.30
    const risk = renorm(pair(m['IM-003'], 0.70), pair(m['IM-012'], 0.30));
    // Profitability: IM-001*0.40 + IM-011*0.40 + IM-005*0.20
    const profitability = renorm(pair(m['IM-001'], 0.40), pair(m['IM-011'], 0.40), pair(m['IM-005'], 0.20));
    // Capital Efficiency: IM-009*0.50 + IM-005*0.50
    const capitalEfficiency = renorm(pair(m['IM-009'], 0.50), pair(m['IM-005'], 0.50));
    // Valuation: IM-004*1.00
    const valuation = renorm(pair(m['IM-004'], 1.00));

    const pillars: IndustrialsPillars = { quality, growth, risk, profitability, capitalEfficiency, valuation };

    const seg = this.calibration.segments[input.subsegment];
    const w = [...seg.w];
    // Archetype risk multiplier applied to Risk pillar weight (not renormalized)
    w[2] = w[2] * (this.calibration.archetypeRisk[input.archetype] ?? 1.0);

    const composite = r1h2e(
      pillars.quality * w[0] + pillars.growth * w[1] + pillars.risk * w[2] +
      pillars.profitability * w[3] + pillars.capitalEfficiency * w[4] + pillars.valuation * w[5],
    );

    return { pillars, composite };
  }
}

/** Convert a (score, weight) to a pair; null score -> null (missing). */
function pair(score: number | null, weight: number): [number, number] | null {
  return score === null ? null : [score, weight];
}

/** Renormalize weights over available (non-null) metric scores. All missing -> 0. */
function renorm(...items: Array<[number, number] | null>): number {
  const avail = items.filter((x): x is [number, number] => x !== null);
  if (avail.length === 0) return 0;
  const wsum = avail.reduce((a, [, w]) => a + w, 0);
  return avail.reduce((a, [s, w]) => a + s * w, 0) / wsum;
}
