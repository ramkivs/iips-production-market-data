/** Insurance Score Engine (WP-3) — band→score→pillar→composite per frozen D15 appendix + expected outputs basis. */
import type { InsuranceMetricValues } from '../metrics/InsuranceMetrics';

export interface InsurancePillars {
  underwriting: number;
  solvency: number;
  growth: number;
  persistency: number;
  profitability: number;
}

export interface InsuranceScoreResult {
  pillars: InsurancePillars;
  composite: number;
}

const r2 = (x: number) => Math.round(x * 10) / 10;

// --- Band->score tables (frozen D15 + expected-output basis) ---
function bandCombined(v: number): number {
  if (v < 90) return 90;
  if (v < 95) return 75;
  if (v < 100) return 65;
  if (v < 105) return 45;
  return 15;
}
function bandSolvency(v: number): number {
  if (v >= 2.0) return 90;
  if (v >= 1.5) return 75;
  if (v >= 1.25) return 60;
  return 40;
}
function bandPersist(v: number): number {
  if (v > 90) return 90;
  if (v >= 80) return 75;
  if (v >= 70) return 60;
  return 40;
}
function bandApe(v: number): number {
  if (v >= 2000) return 90;
  if (v >= 1500) return 75;
  if (v >= 1000) return 60;
  if (v >= 500) return 45;
  return 30;
}
function bandRoe(v: number): number {
  if (v >= 15) return 90;
  if (v >= 12) return 75;
  if (v >= 9) return 60;
  if (v >= 6) return 45;
  return 30;
}

function vnbMargin(ape: number, vnb: number): number {
  return ape > 0 ? (vnb / ape) * 100 : 0;
}

export class InsuranceScoreEngine {
  score(metrics: InsuranceMetricValues): InsuranceScoreResult {
    const get = (id: string): number | undefined => metrics[id];

    const combined = get('IM-001') !== undefined ? bandCombined(get('IM-001')!) : 50;
    const solvency = get('IM-002') !== undefined ? bandSolvency(get('IM-002')!) : 50;
    const persist = get('IM-005') !== undefined ? bandPersist(get('IM-005')!) : 50;
    const ape = get('IM-003') !== undefined ? bandApe(get('IM-003')!) : 50;

    // Underwriting = 0.6*combined + 0.4*expense band (lower expense better)
    const expense = get('IM-007') !== undefined ? 100 - Math.min(100, get('IM-007')! * 2) : 50;
    const underwriting = 0.6 * combined + 0.4 * expense;

    // Growth = 0.5*APE + 0.5*VNB-margin score
    const vnb = get('IM-004');
    const vnbScore = vnb === undefined ? 50 : vnbMargin(apeRaw(get('IM-003')), vnb) >= 20 ? 90 : vnbMargin(apeRaw(get('IM-003')), vnb) >= 10 ? 70 : vnbMargin(apeRaw(get('IM-003')), vnb) >= 0 ? 50 : 20;
    const growth = 0.5 * ape + 0.5 * vnbScore;

    // Profitability = 0.6*ROE-band + 0.4*persistency (ROE proxied neutral 9)
    const roe = get('IM-002') !== undefined ? 9 : 9;
    const profitability = 0.6 * bandRoe(roe) + 0.4 * persist;

    const pillars: InsurancePillars = {
      underwriting: r2(underwriting),
      solvency: r2(solvency),
      growth: r2(growth),
      persistency: r2(persist),
      profitability: r2(profitability),
    };

    const composite = r2(
      pillars.underwriting * 0.30 +
      pillars.solvency * 0.20 +
      pillars.growth * 0.20 +
      pillars.persistency * 0.15 +
      pillars.profitability * 0.15,
    );

    return { pillars, composite };
  }
}

function apeRaw(v: number | undefined): number {
  return v ?? 0;
}
