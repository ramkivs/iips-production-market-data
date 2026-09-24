/**
 * Technology Score Engine (WP-3) — D15 v1.3 contract: effective band-table resolution
 * (calibrated ?? baseline, boundaries + scores together), metric-specific band cardinality
 * (TM-009 = 3), band -> score -> pillar -> composite. Deterministic.
 *
 * Effective band-table resolution (D15 §6a): for the resolved subsegment, a calibrated band
 * table for a metric supersedes the complete baseline table (boundaries AND scores). If no
 * calibrated table exists, or the calibrated table has a band count != baseline (cardinality
 * defect), the baseline table applies in full. Never mix calibrated boundaries with baseline scores.
 */
import type { TechnologyCalibrationProfile } from '../calibration/TechnologyCalibration';
import type { TechnologyInput } from '../metrics/TechnologyMetrics';

/** Round-half-to-even (applied at composite only; pillars kept at full precision). */
function r1h2e(x: number): number {
  const scaled = x * 10;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  if (frac === 0.5) return (floor % 2 === 0 ? floor : floor + 1) / 10;
  return Math.round(scaled) / 10;
}

export interface TechnologyPillars {
  quality: number;
  growth: number;
  risk: number;
  profitability: number;
  capitalEfficiency: number;
  valuation: number;
}

export interface TechnologyScoreResult {
  pillars: TechnologyPillars;
  composite: number;
}

type BandTuple = Array<string | number>;

export class TechnologyScoreEngine {
  constructor(private readonly calibration: TechnologyCalibrationProfile) {}

  /** Effective band table for a resolved subsegment + metric (calibrated ?? baseline). */
  effectiveBands(subsegment: string, metric: string): BandTuple[] {
    const baseline = this.calibration.bandScores[metric] as unknown as BandTuple[];
    const cal = this.calibration.calibratedBandTables[subsegment]?.[metric] as unknown as BandTuple[] | undefined;
    if (cal !== undefined && cal.length === baseline.length) {
      // cardinality-valid calibrated table supersedes the complete baseline table (D15 §6a.2)
      return cal;
    }
    return baseline;
  }

  /** Band count invariant: a calibrated table must preserve the baseline cardinality. */
  cardinalityOk(subsegment: string, metric: string): boolean {
    const baseline = this.calibration.bandScores[metric] as unknown as BandTuple[];
    const cal = this.calibration.calibratedBandTables[subsegment]?.[metric] as unknown as BandTuple[] | undefined;
    if (cal === undefined) return true;
    return cal.length === baseline.length;
  }

  /** Band -> score using the effective table (lower-inclusive / upper-exclusive). */
  band(subsegment: string, metric: string, value: number | null | undefined): number {
    if (value === null || value === undefined) return Number.NaN; // missing sentinel
    const bands = this.effectiveBands(subsegment, metric);
    for (const b of bands) {
      const op = b[0] as string;
      if (op === 'lt' && value < (b[1] as number)) return b[2] as number;
      if (op === 'gte' && value >= (b[1] as number)) return b[2] as number;
      if (op === 'range' && value >= (b[1] as number) && value < (b[2] as number)) return b[3] as number;
    }
    throw new Error(`no band for ${metric} value ${value}`);
  }

  score(input: TechnologyInput, subsegment: string, archetype: string): TechnologyScoreResult {
    const metric = (code: string): number | null => {
      const v = this.band(subsegment, code, input[inputFieldFor(code) as keyof TechnologyInput] as number | undefined);
      return v === undefined || Number.isNaN(v) ? null : v;
    };

    const quality = renorm(pair(metric('TM-006'), 0.40), pair(metric('TM-007'), 0.30), pair(metric('TM-008'), 0.30));
    const growth = renorm(pair(metric('TM-002'), 0.40), pair(metric('TM-012'), 0.35), pair(metric('TM-009'), 0.25));
    const risk = renorm(pair(metric('TM-003'), 0.40), pair(metric('TM-010'), 0.35), pair(metric('TM-011'), 0.25));
    const profitability = renorm(pair(metric('TM-001'), 0.50), pair(metric('TM-008'), 0.50));
    const capitalEfficiency = renorm(pair(metric('TM-005'), 1.00));
    const valuation = renorm(pair(metric('TM-004'), 1.00));

    const pillars: TechnologyPillars = { quality, growth, risk, profitability, capitalEfficiency, valuation };

    const seg = this.calibration.segments[subsegment];
    const w = [...seg.w];
    w[2] = w[2] * (this.calibration.archetypeRisk[archetype] ?? 1.0);

    const composite = r1h2e(
      pillars.quality * w[0] + pillars.growth * w[1] + pillars.risk * w[2] +
      pillars.profitability * w[3] + pillars.capitalEfficiency * w[4] + pillars.valuation * w[5],
    );

    return { pillars, composite };
  }
}

function inputFieldFor(code: string): string {
  const map: Record<string, string> = {
    'TM-001': 'ebitdaMargin', 'TM-002': 'revenueGrowth', 'TM-003': 'debtEbitda',
    'TM-004': 'evRevenue', 'TM-005': 'fcfYield', 'TM-006': 'recurringRevenuePct',
    'TM-007': 'nrr', 'TM-008': 'grossMargin', 'TM-009': 'rdIntensity',
    'TM-010': 'customerConcentration', 'TM-011': 'capexIntensity', 'TM-012': 'usageGrowth',
  };
  return map[code];
}

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
