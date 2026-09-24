/** Banking Score Engine (WP-3) — band→score→pillar→composite per frozen Calculation Appendix. */
import type { BankingMetricValues } from '../metrics/BankingMetrics';

export interface BankingPillars {
  'asset-quality': number;
  'profitability': number;
  'funding-quality': number;
  'capital-strength': number;
  'growth': number;
  'operating-efficiency': number;
  'valuation': number;
}

export interface BankingScoreResult {
  pillars: BankingPillars;
  composite: number;
}

// --- Band→score tables (frozen from BANKING_CALCULATION_APPENDIX.md) ---
function bandROA(v: number): number {
  if (v > 1.8) return 90;
  if (v >= 1.5) return 75;
  if (v >= 1.2) return 65;
  if (v >= 0.9) return 55;
  return 35;
}
function bandROE(v: number): number {
  if (v >= 16) return 90;
  if (v >= 13) return 75;
  if (v >= 10) return 60;
  if (v >= 6) return 50;
  return 30;
}
function bandNIM(v: number): number {
  if (v >= 4.0) return 85;
  if (v >= 3.0) return 70;
  if (v >= 2.0) return 55;
  return 40;
}
function bandCASA(v: number): number {
  if (v > 45) return 90;
  if (v >= 35) return 75;
  if (v >= 25) return 60;
  return 40;
}
function bandGNPA(v: number): number {
  if (v < 1.0) return 90;
  if (v < 2.0) return 75;
  if (v < 3.0) return 65;
  if (v < 5.0) return 45;
  return 15;
}
function bandNNPA(v: number): number {
  if (v < 0.5) return 90;
  if (v < 1.0) return 75;
  if (v < 1.5) return 65;
  if (v < 2.5) return 45;
  return 15;
}
function bandCapital(v: number, isCAR: boolean): number {
  const t = isCAR ? [15, 13, 11] : [13, 11, 9];
  if (v >= t[0]) return 85;
  if (v >= t[1]) return 70;
  if (v >= t[2]) return 55;
  return 30;
}

const r2 = (x: number) => Math.round(x * 10) / 10;

export class BankingScoreEngine {
  score(metrics: BankingMetricValues): BankingScoreResult {
    const get = (id: string): number | undefined => metrics[id];

    // Pillars (frozen composition). Missing input → pillar is null-driven to neutral handling.
    const profitability = this.pillarProfitability(get('BM-001'), get('BM-002'), get('BM-003'));
    const assetQuality = this.pillarAssetQuality(get('BM-005'), get('BM-006'));
    const fundingQuality = get('BM-004') !== undefined ? bandCASA(get('BM-004')!) : 50;
    const capitalStrength = this.pillarCapital(get('BM-014'), get('BM-015'));

    const pillars: BankingPillars = {
      'asset-quality': r2(assetQuality),
      'profitability': r2(profitability),
      'funding-quality': r2(fundingQuality),
      'capital-strength': r2(capitalStrength),
      'growth': 50,
      'operating-efficiency': 50,
      'valuation': 50,
    };

    const composite = r2(
      pillars['asset-quality'] * 0.25 +
      pillars['profitability'] * 0.2 +
      pillars['funding-quality'] * 0.15 +
      pillars['capital-strength'] * 0.15 +
      pillars['growth'] * 0.1 +
      pillars['operating-efficiency'] * 0.1 +
      pillars['valuation'] * 0.05,
    );

    return { pillars, composite };
  }

  private pillarProfitability(roa?: number, roe?: number, nim?: number): number {
    const parts: number[] = [];
    const weights: number[] = [];
    if (roa !== undefined) { parts.push(bandROA(roa)); weights.push(0.4); }
    if (roe !== undefined) { parts.push(bandROE(roe)); weights.push(0.3); }
    if (nim !== undefined) { parts.push(bandNIM(nim)); weights.push(0.3); }
    if (parts.length === 0) return 50;
    const wsum = weights.reduce((a, b) => a + b, 0);
    return parts.reduce((a, v, i) => a + v * weights[i], 0) / wsum;
  }

  private pillarAssetQuality(gnpa?: number, nnpa?: number): number {
    const parts: number[] = [];
    if (gnpa !== undefined) parts.push(bandGNPA(gnpa));
    if (nnpa !== undefined) parts.push(bandNNPA(nnpa));
    if (parts.length === 0) return 50;
    return parts.reduce((a, b) => a + b, 0) / parts.length;
  }

  private pillarCapital(cet1?: number, car?: number): number {
    const parts: number[] = [];
    if (cet1 !== undefined) parts.push(bandCapital(cet1, false));
    if (car !== undefined) parts.push(bandCapital(car, true));
    if (parts.length === 0) return 50;
    return parts.reduce((a, b) => a + b, 0) / parts.length;
  }
}
