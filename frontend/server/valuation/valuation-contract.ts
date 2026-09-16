/**
 * D112-C Valuation Synthesizer Contract.
 *
 * Responsibilities:
 * - Define type-safe inputs and outputs for dynamic valuation synthesis.
 * - Enforce DEVELOPMENT_MIXED_VINTAGE provenance contract (D112-B).
 * - Distinguish between successfully synthesized scores and explicit unavailable states.
 */

export interface ValuationCompanyFundamentals {
  readonly canonicalSecurityId: string;
  readonly sector: string;
  readonly sharesOutstanding: number; // In Crores or full units (consistent with price)
  readonly debt: number;              // In Crores
  readonly cash: number;              // In Crores
  readonly ltmRevenue?: number;       // In Crores
  readonly ltmEbitda?: number;        // In Crores
  readonly ltmNetIncome?: number;     // In Crores
  readonly ltmEps?: number;           // Per share
  readonly totalEquity?: number;      // Book value in Crores
}

export interface ValuationInputPayload {
  readonly canonicalSecurityId: string;
  readonly sector: string;
  readonly eodClosePrice: number;     // INR per share
  readonly tradeDate: string;         // YYYY-MM-DD
  readonly fundamentals: ValuationCompanyFundamentals;
  readonly archiveSha256?: string;
}

export interface ValuationProvenanceDto {
  readonly dataMode: 'LIVE';
  readonly dataSource: string;
  readonly freshness: 'DEVELOPMENT_MIXED_VINTAGE';
  readonly marketDataAsOf: string;
  readonly marketDataSha256: string;
  readonly fundamentalsVintage: 'v1.1-reference';
  readonly transportSemantics: string;
}

export type ValuationStatus = 'CALCULATED' | 'UNAVAILABLE' | 'BLOCKED_UNCALIBRATED';

export interface ValuationResult {
  readonly canonicalSecurityId: string;
  readonly sector: string;
  readonly status: ValuationStatus;
  readonly valuationScore: number | null; // 0..100 score or null
  readonly multipleType?: 'EV/Revenue' | 'EV/EBITDA' | 'P/E' | 'P/B';
  readonly calculatedMultiple?: number;
  readonly marketCap?: number;
  readonly enterpriseValue?: number;
  readonly reason?: string;
  readonly provenance: ValuationProvenanceDto;
}
