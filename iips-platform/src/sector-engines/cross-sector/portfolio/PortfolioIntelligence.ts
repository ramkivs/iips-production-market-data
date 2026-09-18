/**
 * Portfolio Intelligence Service — stage 2 of the CSIP execution pipeline.
 * Computes sector exposure, concentration, diversification score, and aggregate
 * conviction/quality/risk for a portfolio of normalized holdings.
 *
 * Deterministic formulas (frozen CSIP v1.0.0):
 *   sectorExposure[sector] = count(sector) / total × 100   (1 decimal)
 *   concentration          = max sectorExposure
 *   diversificationScore   = max(0, 100 − concentration + (holdings−1)·3)   (1 decimal)
 *   avgConviction/Quality/Risk = mean, rounded to 1 decimal
 */
import type { NormalizedHolding, PortfolioIntelligenceReport } from '../types';

/** Round to 1 decimal using round-half-to-even (matches frozen expected outputs basis). */
const r1 = (x: number): number => {
  const scaled = x * 10;
  const floor = Math.floor(scaled);
  const frac = scaled - floor;
  if (frac === 0.5) {
    return (floor % 2 === 0 ? floor : floor + 1) / 10;
  }
  return Math.round(scaled) / 10;
};

export class PortfolioIntelligenceService {
  compute(portfolioId: string, scenario: string, holdings: NormalizedHolding[]): PortfolioIntelligenceReport {
    const total = holdings.length;
    const sectorCounts = new Map<string, number>();
    let convSum = 0;
    let qualitySum = 0;
    let riskSum = 0;
    for (const h of holdings) {
      sectorCounts.set(h.sector, (sectorCounts.get(h.sector) ?? 0) + 1);
      convSum += h.conviction;
      qualitySum += h.quality;
      riskSum += h.risk;
    }

    const sectorExposure: Record<string, number> = {};
    let concentration = 0;
    for (const [sector, count] of sectorCounts) {
      const pct = total === 0 ? 0 : r1((count / total) * 100);
      sectorExposure[sector] = pct;
      if (pct > concentration) concentration = pct;
    }
    concentration = r1(concentration);

    const diversification = total === 0 ? 0 : r1(Math.max(0, 100 - concentration + (total - 1) * 3));
    const avgConviction = total === 0 ? 0 : r1(convSum / total);
    const avgQuality = total === 0 ? 0 : r1(qualitySum / total);
    const avgRisk = total === 0 ? 0 : r1(riskSum / total);

    return {
      portfolioId,
      scenario,
      holdings: total,
      sectorExposure,
      concentration,
      diversificationScore: diversification,
      avgConviction,
      avgQuality,
      avgRisk,
    };
  }
}
