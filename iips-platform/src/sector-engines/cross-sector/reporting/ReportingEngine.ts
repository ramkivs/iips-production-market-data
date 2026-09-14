/**
 * Reporting Engine — stage 10 of the CSIP execution pipeline.
 * Produces PDF-ready JSON reports: Executive, Investment Committee, Portfolio Summary,
 * Allocation Recommendation, Sector Dashboard. Deterministic assembly of the pipeline
 * outputs into versioned, stable report payloads.
 */
import type {
  PortfolioIntelligenceReport,
  RankedOpportunity,
  AllocationRecommendation,
  DiversificationAnalysis,
  OpportunitySet,
  CorrelationReport,
  PortfolioReport,
} from '../types';

export type ReportType = 'Executive' | 'Investment Committee' | 'Portfolio Summary' | 'Allocation Recommendation' | 'Sector Dashboard';

export class ReportingEngine {
  build(
    reportType: ReportType,
    portfolioId: string,
    intelligence: PortfolioIntelligenceReport,
    ranking: RankedOpportunity[],
    allocation: AllocationRecommendation,
    diversification: DiversificationAnalysis,
    opportunity: OpportunitySet,
    correlation: CorrelationReport,
  ): PortfolioReport {
    const payload: Record<string, unknown> = {
      portfolioId,
      scenario: intelligence.scenario,
      sectorExposure: intelligence.sectorExposure,
      concentration: intelligence.concentration,
      diversificationScore: intelligence.diversificationScore,
      avgConviction: intelligence.avgConviction,
      avgQuality: intelligence.avgQuality,
      avgRisk: intelligence.avgRisk,
      ranking: ranking,
      allocationRecommendation: allocation.recommendation,
      allocationRules: allocation.rulesApplied,
      diversificationBand: diversification.diversificationBand,
      diversificationFlags: diversification.flags,
      topOpportunities: opportunity.top,
      opportunityRationale: opportunity.rationale,
      correlationFlags: correlation.flags,
    };

    return {
      reportId: `report-${reportType.toLowerCase().replace(/\s+/g, '-')}-${portfolioId}`,
      reportType,
      portfolioId,
      payload,
    };
  }
}
