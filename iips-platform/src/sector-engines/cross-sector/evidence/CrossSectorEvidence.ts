/**
 * Cross-Sector Evidence Builder — stage 9 of the CSIP execution pipeline.
 * Assembles the Cross-Sector Evidence Model hierarchy (frozen CSIP v1.0.0):
 *
 *   Recommendation
 *     ├── Sector Contribution  (Engine Verdict, Confidence, Evidence)
 *     ├── Portfolio Impact
 *     ├── Allocation Rationale
 *     └── Diversification Impact
 *
 * Deterministic assembly of the pipeline outputs into an immutable evidence record.
 */
import type {
  PortfolioIntelligenceReport,
  RankedOpportunity,
  AllocationRecommendation,
  DiversificationAnalysis,
  CorrelationReport,
} from '../types';

export interface CrossSectorEvidence {
  readonly evidenceId: string;
  readonly portfolioId: string;
  readonly recommendation: string;
  readonly sectorContribution: {
    readonly sectors: readonly string[];
    readonly confidence: number;
    readonly engineVersions: readonly string[];
  };
  readonly portfolioImpact: {
    readonly concentration: number;
    readonly diversificationScore: number;
    readonly avgConviction: number;
    readonly avgQuality: number;
    readonly avgRisk: number;
  };
  readonly allocationRationale: {
    readonly strategy: string;
    readonly recommendation: string;
    readonly rulesApplied: readonly string[];
  };
  readonly diversificationImpact: {
    readonly band: string;
    readonly flags: readonly string[];
  };
  readonly correlationFlags: readonly string[];
}

export class CrossSectorEvidenceBuilder {
  /** Build the evidence record deterministically. */
  build(
    portfolioId: string,
    intelligence: PortfolioIntelligenceReport,
    ranking: RankedOpportunity[],
    allocation: AllocationRecommendation,
    diversification: DiversificationAnalysis,
    correlation: CorrelationReport,
  ): CrossSectorEvidence {
    const sectors = [...new Set(ranking.map((r) => r.sector))].sort();
    const best = ranking[0];
    const recommendation = best
      ? `Highest normalized conviction: ${best.companyId} (${best.sector}, conviction ${best.conviction})`
      : 'No holdings to recommend';

    return {
      evidenceId: `csip-evidence-${portfolioId}`,
      portfolioId,
      recommendation,
      sectorContribution: {
        sectors,
        confidence: intelligence.holdings > 0 ? 1 : 0,
        engineVersions: ['banking-engine-v1.0.0', 'insurance-engine-v1.0.0', 'capital-markets-engine-v1.0.0', 'healthcare-engine-v1.0.0'],
      },
      portfolioImpact: {
        concentration: intelligence.concentration,
        diversificationScore: intelligence.diversificationScore,
        avgConviction: intelligence.avgConviction,
        avgQuality: intelligence.avgQuality,
        avgRisk: intelligence.avgRisk,
      },
      allocationRationale: {
        strategy: allocation.strategy,
        recommendation: allocation.recommendation,
        rulesApplied: allocation.rulesApplied,
      },
      diversificationImpact: {
        band: diversification.diversificationBand,
        flags: diversification.flags,
      },
      correlationFlags: correlation.flags,
    };
  }
}
