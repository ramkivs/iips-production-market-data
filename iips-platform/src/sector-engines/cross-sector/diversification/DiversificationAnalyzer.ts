/**
 * Diversification Analyzer — stage 6 of the CSIP execution pipeline.
 * Computes the diversification score (frozen formula) and flags concentration /
 * single-factor exposure. Deterministic.
 *
 *   diversificationScore = max(0, 100 − concentration + (holdings−1)·3)  (1 decimal)
 */
import type { NormalizedHolding, PortfolioIntelligenceReport, DiversificationAnalysis } from '../types';

const r1 = (x: number): number => Math.round(x * 10) / 10;

export class DiversificationAnalyzer {
  analyze(report: PortfolioIntelligenceReport, holdings: NormalizedHolding[]): DiversificationAnalysis {
    const concentration = report.concentration;
    const diversificationScore = report.diversificationScore;
    const band = this.band(diversificationScore);
    const flags: string[] = [];

    if (concentration >= 80) flags.push('sector concentration');
    else if (concentration >= 50) flags.push('elevated concentration');

    // Single-factor exposure: detect a dominant quality/risk tilt from aggregate means.
    if (report.avgRisk > 55) flags.push('elevated risk / correlated downside');
    if (report.avgRisk < 30 && report.avgQuality >= 70) flags.push('quality tilt');

    const growthHeavy = holdings.filter((h) => (h.growth ?? 0) >= 70).length / Math.max(holdings.length, 1);
    if (growthHeavy > 0.5) flags.push('single-factor exposure (growth)');

    if (flags.length === 0) flags.push('balanced');

    return { concentration, diversificationScore, diversificationBand: band, flags };
  }

  private band(score: number): 'Very Low' | 'Low' | 'Moderate' | 'Good' | 'High' {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Low';
    return 'Very Low';
  }
}
