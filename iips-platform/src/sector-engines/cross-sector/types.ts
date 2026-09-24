/**
 * CSIP shared types — normalized holdings, service outputs.
 * WP-3 (Cross-Sector Intelligence Engine), frozen baseline CSIP v1.0.0.
 */

/** A normalized holding consumed by CSIP via the ontology (published engine output). */
export interface NormalizedHolding {
  readonly companyId: string;
  readonly sector: string;
  readonly conviction: number;   // 0-100 (normalized composite)
  readonly confidence: number;   // 0-1
  readonly quality: number;      // 0-100
  readonly growth?: number;      // 0-100
  readonly risk: number;         // 0-100
  readonly valuation?: number;   // 0-100
  readonly capitalEfficiency?: number; // 0-100
  readonly moat?: number;        // 0-100
  readonly verdict?: string;
}

/** Portfolio-level analytics (Portfolio Intelligence Service). */
export interface PortfolioIntelligenceReport {
  readonly portfolioId: string;
  readonly scenario: string;
  readonly holdings: number;
  readonly sectorExposure: Readonly<Record<string, number>>; // sector -> % (1 dp)
  readonly concentration: number;                             // max sector weight (1 dp)
  readonly diversificationScore: number;                      // 1 dp
  readonly avgConviction: number;                             // 1 dp
  readonly avgQuality: number;                                // 1 dp
  readonly avgRisk: number;                                   // 1 dp
}

/** A ranked opportunity (Cross-Sector Ranking Engine). */
export interface RankedOpportunity {
  readonly companyId: string;
  readonly sector: string;
  readonly conviction: number;
}

/** Allocation recommendation (Capital Allocation Engine). */
export interface AllocationRecommendation {
  readonly portfolioId: string;
  readonly strategy: string;
  readonly recommendation: string;
  readonly rulesApplied: readonly string[];
}

/** Diversification analysis (Diversification Analyzer). */
export interface DiversificationAnalysis {
  readonly concentration: number;
  readonly diversificationScore: number;
  readonly diversificationBand: 'Very Low' | 'Low' | 'Moderate' | 'Good' | 'High';
  readonly flags: readonly string[];
}

/** Opportunity set (Opportunity Engine). */
export interface OpportunitySet {
  readonly top: readonly RankedOpportunity[];
  readonly rationale: readonly string[];
}

/** Correlation/sensitivity analysis (Correlation Engine) — platform metadata only. */
export interface CorrelationReport {
  readonly flags: readonly string[];
  readonly concentrationSectors: readonly string[];
}

/** PDF-ready JSON report (Reporting Engine). */
export interface PortfolioReport {
  readonly reportId: string;
  readonly reportType: string;
  readonly portfolioId: string;
  readonly payload: Readonly<Record<string, unknown>>;
}
