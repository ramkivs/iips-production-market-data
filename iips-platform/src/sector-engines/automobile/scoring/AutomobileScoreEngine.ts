/**
 * Automobile Score Engine (D17) — effective band-table resolution
 * (calibrated ?? baseline, boundaries + scores together), metric-specific band cardinality,
 * band -> score -> pillar -> composite. Deterministic.
 *
 * Effective band-table resolution (D17 §6): for the resolved subsegment, a calibrated band
 * table for a metric supersedes the complete baseline table (boundaries AND scores). If no
 * calibrated table exists, or the calibrated table has a band count != baseline (cardinality
 * defect), the baseline table applies in full. Never mix calibrated boundaries with baseline scores.
 *
 * Pillar composition (D17 §7) and composite (D17 §8 / M15): left-to-right summation,
 * round-half-to-even at the composite only (pillars full precision).
 */
import type { AutomobileCalibrationProfile } from '../calibration/AutomobileCalibration';
import type { AutomobileInput } from '../metrics/AutomobileMetrics';

/** Round-half-to-even (applied at composite only; pillars kept at full precision). */
function r1h2e(x: number): number {
  const scaled = x * 10;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  if (frac === 0.5) return (floor % 2 === 0 ? floor : floor + 1) / 10;
  return Math.round(scaled) / 10;
}

export interface AutomobilePillars {
  quality: number;
  growth: number;
  risk: number;
  profitability: number;
  capitalEfficiency: number;
  valuation: number;
}

export interface AutomobileScoreResult {
  pillars: AutomobilePillars;
  composite: number;
}

type BandTuple = Array<string | number>;

export class AutomobileScoreEngine {
  constructor(private readonly calibration: AutomobileCalibrationProfile) {}

  /** Effective band table for a resolved subsegment + metric (calibrated ?? baseline). */
  effectiveBands(subsegment: string, metric: string): BandTuple[] {
    const baseline = this.calibration.bandScores[metric] as unknown as BandTuple[];
    const cal = this.calibration.calibratedBandTables[subsegment]?.[metric] as unknown as BandTuple[] | undefined;
    if (cal !== undefined && cal.length === baseline.length) {
      // cardinality-valid calibrated table supersedes the complete baseline table (D17 §6)
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

  score(input: AutomobileInput, subsegment: string, archetype: string): AutomobileScoreResult {
    const metric = (code: string): number | null => {
      const v = this.band(subsegment, code, input[inputFieldFor(code) as keyof AutomobileInput] as number | undefined);
      return v === undefined || Number.isNaN(v) ? null : v;
    };

    // D17 §7 — pillar composition (weights renormalize over available metrics).
    const quality = renorm(pair(metric('AB-004'), 0.35), pair(metric('AB-005'), 0.35), pair(metric('AB-012'), 0.30));
    const growth = renorm(pair(metric('AB-002'), 0.50), pair(metric('AB-006'), 0.50));
    const risk = renorm(pair(metric('AB-003'), 0.40), pair(metric('AB-010'), 0.35), pair(metric('AB-009'), 0.25));
    const profitability = renorm(pair(metric('AB-001'), 0.55), pair(metric('AB-008'), 0.45));
    const capitalEfficiency = renorm(pair(metric('AB-007'), 1.00));
    const valuation = renorm(pair(metric('AB-011'), 1.00));

    const pillars: AutomobilePillars = { quality, growth, risk, profitability, capitalEfficiency, valuation };

    const seg = this.calibration.segments[subsegment];
    const w = [...seg.w];
    w[2] = w[2] * (this.calibration.archetypeRisk[archetype] ?? 1.0);

    // D17 §8 / M15 — left-to-right summation, round-half-to-even at composite only.
    const composite = r1h2e(
      pillars.quality * w[0] + pillars.growth * w[1] + pillars.risk * w[2] +
      pillars.profitability * w[3] + pillars.capitalEfficiency * w[4] + pillars.valuation * w[5],
    );

    return { pillars, composite };
  }
}

function inputFieldFor(code: string): string {
  const map: Record<string, string> = {
    'AB-001': 'ebitdaMargin', 'AB-002': 'revenueGrowth', 'AB-003': 'debtEbitda',
    'AB-004': 'vehicleMargin', 'AB-005': 'capacityUtilization', 'AB-006': 'evMix',
    'AB-007': 'fcfYield', 'AB-008': 'roic', 'AB-009': 'capexIntensity',
    'AB-010': 'inventoryDays', 'AB-011': 'evEbitda', 'AB-012': 'aftersalesMix',
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
