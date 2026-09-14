/** Healthcare Score Engine (WP-3) — band→score→pillar→composite per frozen D15 + clinical-quality constraint. */
import type { HealthcareMetricValues } from '../metrics/HealthcareMetrics';

export interface HealthcarePillars {
  utilization: number;
  'revenue-quality': number;
  profitability: number;
  'clinical-quality': number;
  efficiency: number;
}

export interface HealthcareScoreResult {
  pillars: HealthcarePillars;
  composite: number;
  clinicalQualityFail: boolean;
}

/** Round to 1 decimal using round-half-to-even (matches the frozen baseline generator). */
function roundHalfEven(x: number): number {
  const scaled = x * 10;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  if (Math.abs(frac - 0.5) < 1e-9) {
    return floor % 2 === 0 ? floor / 10 : (floor + 1) / 10;
  }
  return Math.round(scaled) / 10;
}
const r2 = roundHalfEven;

// --- Band->score tables (frozen D15 basis) ---
function bandOcc(v: number): number { if (v > 80) return 90; if (v >= 70) return 75; if (v >= 60) return 60; return 35; }
function bandEbit(v: number): number { if (v > 25) return 90; if (v >= 15) return 75; if (v >= 10) return 60; return 40; }
function bandGrowth(v: number): number { if (v > 20) return 90; if (v >= 10) return 75; if (v >= 5) return 60; return 40; }
// Payer-mix/recurring proxy (HC-007 receivables-based or HC-012 recurring)
function bandRevenueQuality(v: number): number { if (v >= 70) return 90; if (v >= 50) return 70; return 40; }
// Efficiency proxy: lower receivables (HC-007) better
function bandEff(v: number): number { if (v < 30) return 90; if (v < 40) return 75; if (v < 50) return 60; return 35; }

export class HealthcareScoreEngine {
  score(metrics: HealthcareMetricValues, qualityFail: boolean): HealthcareScoreResult {
    const get = (id: string): number | undefined => metrics[id];

    const utilization = get('HC-001') !== undefined ? bandOcc(get('HC-001')!) : 75; // bandOcc(70)=75
    const rqInput = get('HC-012') !== undefined ? get('HC-012')! : (get('HC-007') !== undefined ? get('HC-007')! : 55);
    const revenueQuality = bandRevenueQuality(rqInput);
    const profitability = get('HC-004') !== undefined ? bandEbit(get('HC-004')!) : 60;
    const clinicalQuality = qualityFail ? 0 : 90;
    const efficiency = get('HC-007') !== undefined ? bandEff(get('HC-007')!) : 60;

    const pillars: HealthcarePillars = {
      utilization: r2(utilization),
      'revenue-quality': r2(revenueQuality),
      profitability: r2(profitability),
      'clinical-quality': r2(clinicalQuality),
      efficiency: r2(efficiency),
    };

    const composite = r2(
      pillars.utilization * 0.25 +
      pillars['revenue-quality'] * 0.20 +
      pillars.profitability * 0.20 +
      pillars['clinical-quality'] * 0.20 +
      pillars.efficiency * 0.15,
    );

    return { pillars, composite, clinicalQualityFail: qualityFail };
  }
}
