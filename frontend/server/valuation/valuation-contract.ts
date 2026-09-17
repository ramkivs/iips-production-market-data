/**
 * D112-C / D113-STAGE2 Valuation Synthesizer Contract.
 *
 * Responsibilities:
 * - Define type-safe inputs and outputs for dynamic valuation synthesis.
 * - Enforce DEVELOPMENT_MIXED_VINTAGE provenance contract (D112-B).
 * - Distinguish between successfully synthesized scores, explicit unavailable states,
 *   blocked uncalibrated sectors, and calibration-pending states.
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
  // Banking fundamental inputs (P/ABV methodology)
  readonly netNpa?: number;           // Net NPA absolute in Crores
  readonly tangibleNetWorth?: number; // Tangible Net Worth in Crores (or total equity if tangible)
  // Optional flag for defined exceptional events (Q-CAL-06)
  readonly exceptionalEventFlag?: boolean;
  readonly exceptionalEventReason?: string;
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
  readonly calibrationProfileId?: string;
  readonly calibrationVersion?: string;
}

export type ValuationStatus = 'CALCULATED' | 'UNAVAILABLE' | 'BLOCKED_UNCALIBRATED' | 'CALIBRATION_PENDING';

export interface ValuationResult {
  readonly canonicalSecurityId: string;
  readonly sector: string;
  readonly status: ValuationStatus;
  readonly valuationScore: number | null; // 0..100 score or null
  readonly multipleType?: 'EV/Revenue' | 'EV/EBITDA' | 'P/E' | 'P/B' | 'P/ABV';
  readonly calculatedMultiple?: number;
  readonly marketCap?: number;
  readonly enterpriseValue?: number;
  readonly adjustedBookValue?: number;    // Absolute Adjusted Book Value in Crores
  readonly adjustedBookValuePerShare?: number; // ABVPS in INR per share
  readonly reason?: string;
  readonly provenance: ValuationProvenanceDto;
}
