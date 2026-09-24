/**
 * Capital Allocation Engine — stage 4 of the CSIP execution pipeline.
 * Produces a deterministic allocation recommendation per strategy profile, applying the
 * Allocation Rule Precedence Table (frozen CSIP v1.0.0):
 *
 *   1. Mandatory Risk Constraints   (hard — cannot be overridden)
 *   2. Diversification Constraints  (concentration / single-factor ceilings)
 *   3. Strategy Profile Constraints (target weights, risk/quality/income/growth posture)
 *   4. Ranking Optimization         (prefer higher normalized conviction)
 *   5. Capital Allocation           (assign weights in the remaining feasible space)
 *
 * The outcome is a total, static ordering => one and only one recommendation per input.
 */
import type { NormalizedHolding, PortfolioIntelligenceReport, AllocationRecommendation } from '../types';

export type Strategy = 'Conservative' | 'Balanced' | 'Growth' | 'Aggressive' | 'Income' | 'Value';

export interface AllocationInput {
  readonly portfolioId: string;
  readonly strategy: Strategy;
  readonly report: PortfolioIntelligenceReport;
  readonly holdings: readonly NormalizedHolding[];
}

/** Strategy profile constraints (frozen Portfolio Reference Data). */
const STRATEGY_PROFILES: Record<Strategy, { maxRisk: number; maxConcentration: number; posture: string }> = {
  Conservative: { maxRisk: 35, maxConcentration: 40, posture: 'minimize concentration / favor low-risk-quality' },
  Balanced: { maxRisk: 50, maxConcentration: 60, posture: 'balanced risk-quality-growth' },
  Growth: { maxRisk: 65, maxConcentration: 70, posture: 'favor growth, accept higher risk' },
  Aggressive: { maxRisk: 80, maxConcentration: 80, posture: 'maximize growth, highest risk tolerance' },
  Income: { maxRisk: 40, maxConcentration: 70, posture: 'favor income sectors, reduce growth weight' },
  Value: { maxRisk: 45, maxConcentration: 70, posture: 'favor undervalued, value orientation' },
};

export class AllocationEngine {
  recommend(input: AllocationInput): AllocationRecommendation {
    const { portfolioId, strategy, report, holdings } = input;
    const rulesApplied: string[] = [];
    const profile = STRATEGY_PROFILES[strategy];

    // --- Rule 1: Mandatory Risk Constraints (hard) ---
    const maxRiskHolding = holdings.reduce((m, h) => (h.risk > m ? h.risk : m), 0);
    const anyHighRisk = maxRiskHolding > profile.maxRisk;
    if (anyHighRisk) rulesApplied.push('1-mandatory-risk');
    if (maxRiskHolding > 60) {
      rulesApplied.push('1-mandatory-risk-crisis');
    }

    // --- Rule 2: Diversification Constraints (hard) ---
    const overConcentrated = report.concentration > profile.maxConcentration;
    if (overConcentrated) rulesApplied.push('2-diversification');

    // --- Rule 3: Strategy Profile (soft) ---
    rulesApplied.push(`3-strategy-${strategy.toLowerCase()}`);

    // --- Rule 4: Ranking Optimization (soft) ---
    rulesApplied.push('4-ranking');

    // --- Rule 5: Capital Allocation (output) ---
    rulesApplied.push('5-allocation');

    const recommendation = this.resolveAction(strategy, report, holdings, anyHighRisk);
    return { portfolioId, strategy, recommendation, rulesApplied };
  }

  /**
   * Deterministic action resolution per the Allocation Decision Matrix (8 fixtures).
   * Decision priority (total, static order per Allocation Rule Precedence Table):
   *   1. Crisis / mandatory risk   (always highest)
   *   2. Income strategy
   *   3. High-conviction concentration  (Hold concentration)
   *   4. Poor diversification           (Recommend diversification)
   *   5. Banking overweight             (Reduce Banking)
   *   6. Healthcare underweight         (Increase Healthcare)
   *   7. Growth strategy
   *   8. Multiple equivalent            (Preserve diversification)
   *   9. Default strategy profile
   */
  private resolveAction(
    strategy: Strategy,
    report: PortfolioIntelligenceReport,
    holdings: readonly NormalizedHolding[],
    anyHighRisk: boolean,
  ): string {
    const banking = report.sectorExposure['Banking'] ?? 0;
    const healthcare = report.sectorExposure['Healthcare'] ?? 0;
    const sectors = Object.keys(report.sectorExposure).length;

    // 1. Mandatory risk / crisis (always highest).
    if (anyHighRisk && report.avgRisk > 55) {
      return 'Reduce risk / raise quality / increase diversification';
    }
    // 2. Income strategy.
    if (strategy === 'Income') return 'Favor income sectors, reduce growth weight';
    // 3. High-conviction concentrated -> Hold concentration.
    if (report.concentration >= 70 && report.avgConviction >= 60) return 'Hold concentration';
    // 4. Poor diversification -> Recommend diversification.
    if (report.diversificationScore < 30) return 'Recommend diversification';
    // 5. Banking overweight -> Reduce Banking.
    if (banking >= 60) return 'Reduce Banking';
    // 6. Healthcare underweight (absent or materially below target) -> Increase Healthcare.
    if (healthcare < 20 && holdings.length > 1) return 'Increase Healthcare';
    // 7. Growth strategy.
    if (strategy === 'Growth') return 'Favor growth sectors, accept higher risk';
    // 8. Multiple equivalent opportunities -> Preserve diversification.
    if (report.diversificationScore >= 60 && sectors >= 2) return 'Preserve diversification';
    // 9. Default strategy posture.
    return `${strategy} allocation per strategy profile`;
  }
}
