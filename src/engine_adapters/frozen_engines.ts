/**
 * Institutional Investment Platform System (IIPS)
 * Frozen Certified Sector Scoring Engines & CSIP (P11-01 / AD-04 / AD-16)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 * Methodological Invariant: 100% FROZEN CERTIFIED BASELINE
 */

import { CertifiedSectorEngineId, EngineScoreOutput } from './types.js';
import { GOVERNED_SECTOR_DEFAULTS } from './sector_defaults.js';

export interface EvaluatedFactors {
  valuationScore: number;
  profitabilityScore: number;
  returnScore: number;
  momentumScore: number;
  [key: string]: number;
}

export class FrozenEngines {
  /**
   * Evaluates the 13 certified sector scoring models using frozen deterministic math
   * calibrated against certified sector benchmarks.
   */
  public static executeSectorEngine(
    engineId: CertifiedSectorEngineId,
    inputs: Record<string, number>
  ): { rawScore: number; normalizedScore: number; grade: EngineScoreOutput['grade']; factors: EvaluatedFactors } {
    const benchmarks = GOVERNED_SECTOR_DEFAULTS[engineId];

    const pe = inputs.pe ?? benchmarks.benchmarkPe;
    const pb = inputs.pb ?? benchmarks.benchmarkPb;
    const roe = inputs.roe ?? benchmarks.benchmarkRoe;
    const roce = inputs.roce ?? benchmarks.benchmarkRoce;
    const opMargin = inputs.operatingMargin ?? benchmarks.benchmarkOperatingMargin;
    const momentum = inputs.momentum ?? 0;

    // 1. Valuation Factor (30% weight): Relative to sector benchmark PE and PB
    const peRatio = Math.max(0.1, pe / benchmarks.benchmarkPe);
    const pbRatio = Math.max(0.1, pb / benchmarks.benchmarkPb);
    const valPeScore = Math.max(0, Math.min(100, 100 - (peRatio - 1) * 50));
    const valPbScore = Math.max(0, Math.min(100, 100 - (pbRatio - 1) * 50));
    const valuationScore = Math.round((valPeScore * 0.6 + valPbScore * 0.4) * 100) / 100;

    // 2. Profitability & Margins Factor (30% weight): Relative to sector benchmark margin
    const marginRatio = opMargin / Math.max(1, benchmarks.benchmarkOperatingMargin);
    const profitabilityScore = Math.max(0, Math.min(100, Math.round((50 + (marginRatio - 1) * 50) * 100) / 100));

    // 3. Return Ratios Factor (25% weight): Relative to sector benchmark ROE & ROCE
    const roeScore = Math.max(0, Math.min(100, (roe / Math.max(1, benchmarks.benchmarkRoe)) * 50));
    const roceScore = Math.max(0, Math.min(100, (roce / Math.max(1, benchmarks.benchmarkRoce)) * 50));
    const returnScore = Math.round(((roeScore + roceScore) / 2) * 100) / 100;

    // 4. Momentum / Price Strength (15% weight)
    const momentumScore = Math.max(0, Math.min(100, Math.round((50 + momentum * 2) * 100) / 100));

    // Composite Weighted Raw Score (30% Val + 30% Profit + 25% Return + 15% Momentum)
    const rawScore = Math.round(
      (valuationScore * 0.3 + profitabilityScore * 0.3 + returnScore * 0.25 + momentumScore * 0.15) * 100
    ) / 100;

    const normalizedScore = Math.max(0, Math.min(100, rawScore));

    // Grade assignment
    let grade: EngineScoreOutput['grade'] = 'F';
    if (normalizedScore >= 85) grade = 'A+';
    else if (normalizedScore >= 75) grade = 'A';
    else if (normalizedScore >= 65) grade = 'B+';
    else if (normalizedScore >= 55) grade = 'B';
    else if (normalizedScore >= 45) grade = 'C';
    else if (normalizedScore >= 35) grade = 'D';

    return {
      rawScore,
      normalizedScore,
      grade,
      factors: {
        valuationScore,
        profitabilityScore,
        returnScore,
        momentumScore,
      },
    };
  }

  /**
   * Evaluates the Composite Sector Intelligence Program (CSIP) ranking.
   */
  public static executeCSIP(scores: Array<{ companyId: string; normalizedScore: number }>): Array<{ companyId: string; rank: number; percentile: number }> {
    const sorted = [...scores].sort((a, b) => b.normalizedScore - a.normalizedScore);
    const n = sorted.length;

    return sorted.map((item, idx) => {
      const rank = idx + 1;
      const percentile = n > 1 ? Math.round(((n - rank) / (n - 1)) * 100 * 100) / 100 : 100;
      return {
        companyId: item.companyId,
        rank,
        percentile,
      };
    });
  }
}
