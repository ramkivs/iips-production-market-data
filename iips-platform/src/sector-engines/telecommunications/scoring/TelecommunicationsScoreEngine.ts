/**
 * Telecommunications Score Engine (D16) — effective band-table resolution
 * (calibrated ?? baseline, boundaries + scores together), metric-specific band cardinality,
 * band -> score -> pillar -> composite. Deterministic.
 *
 * Effective band-table resolution (D16 §6): for the resolved subsegment, a calibrated band
 * table for a metric supersedes the complete baseline table (boundaries AND scores). If no
 * calibrated table exists, or the calibrated table has a band count != baseline (cardinality
 * defect), the baseline table applies in full. Never mix calibrated boundaries with baseline scores.
 *
 * Pillar composition (D16 §7) and composite (D16 §8 / M15): left-to-right summation,
 * round-half-to-even at the composite only (pillars full precision).
 */
import type { TelecommunicationsCalibrationProfile } from '../calibration/TelecommunicationsCalibration';
import type { TelecommunicationsInput } from '../metrics/TelecommunicationsMetrics';

/** Round-half-to-even (applied at composite only; pillars kept at full precision). */
function r1h2e(x: number): number {
  const scaled = x * 10;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  if (frac === 0.5) return (floor % 2 === 0 ? floor : floor + 1) / 10;
  return Math.round(scaled) / 10;
}

export interface TelecommunicationsPillars {
  quality: number;
  growth: number;
  risk: number;
  profitability: number;
  capitalEfficiency: number;
  valuation: number;
}

export interface TelecommunicationsScoreResult {
  pillars: TelecommunicationsPillars;
  composite: number;
}

type BandTuple = Array<string | number>;

export class TelecommunicationsScoreEngine {
  constructor(private readonly calibration: TelecommunicationsCalibrationProfile) {}

  /** Effective band table for a resolved subsegment + metric (calibrated ?? baseline). */
  effectiveBands(subsegment: string, metric: string): BandTuple[] {
    const baseline = this.calibration.bandScores[metric] as unknown as BandTuple[];
    const cal = this.calibration.calibratedBandTables[subsegment]?.[metric] as unknown as BandTuple[] | undefined;
    if (cal !== undefined && cal.length === baseline.length) {
      // cardinality-valid calibrated table supersedes the complete baseline table (D16 §6)
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

  score(input: TelecommunicationsInput, subsegment: string, archetype: string): TelecommunicationsScoreResult {
    const metric = (code: string): number | null => {
      const v = this.band(subsegment, code, input[inputFieldFor(code) as keyof TelecommunicationsInput] as number | undefined);
      return v === undefined || Number.isNaN(v) ? null : v;
    };

    // D16 §7 — pillar composition (weights renormalize over available metrics).
    const quality = renorm(pair(metric('TC-006'), 0.35), pair(metric('TC-004'), 0.35), pair(metric('TC-005'), 0.30));
    const growth = renorm(pair(metric('TC-002'), 0.50), pair(metric('TC-012'), 0.50));
    const risk = renorm(pair(metric('TC-003'), 0.40), pair(metric('TC-010'), 0.35), pair(metric('TC-009'), 0.25));
    const profitability = renorm(pair(metric('TC-001'), 0.55), pair(metric('TC-008'), 0.45));
    const capitalEfficiency = renorm(pair(metric('TC-007'), 1.00));
    const valuation = renorm(pair(metric('TC-011'), 1.00));

    const pillars: TelecommunicationsPillars = { quality, growth, risk, profitability, capitalEfficiency, valuation };

    const seg = this.calibration.segments[subsegment];
    const w = [...seg.w];
    w[2] = w[2] * (this.calibration.archetypeRisk[archetype] ?? 1.0);

    // D16 §8 / M15 — left-to-right summation, round-half-to-even at composite only.
    const composite = r1h2e(
      pillars.quality * w[0] + pillars.growth * w[1] + pillars.risk * w[2] +
      pillars.profitability * w[3] + pillars.capitalEfficiency * w[4] + pillars.valuation * w[5],
    );

    return { pillars, composite };
  }
}

function inputFieldFor(code: string): string {
  const map: Record<string, string> = {
    'TC-001': 'ebitdaMargin', 'TC-002': 'revenueGrowth', 'TC-003': 'debtEbitda',
    'TC-004': 'arpu', 'TC-005': 'churnRate', 'TC-006': 'postpaidMix',
    'TC-007': 'fcfYield', 'TC-008': 'roic', 'TC-009': 'capexIntensity',
    'TC-010': 'spectrumCost', 'TC-011': 'evEbitda', 'TC-012': 'usageGrowth',
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
