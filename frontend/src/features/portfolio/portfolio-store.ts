/**
 * Institutional Investment Platform System (IIPS)
 * Portfolio Domain Store & Atomic Persistence Boundary (BI-07)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { UserHoldingInput } from './import/types.js';
import { computeLineageHash } from '../../../../src/contracts/provenance.js';

export interface PortfolioRecord {
  portfolioId: string;
  portfolioName: string;
  holdings: UserHoldingInput[];
  totalMarketValue: number;
  totalHoldingsCount: number;
  weightSumPercentage: number;
  lastUpdated: string;
  provenanceDigest: string;
  isSaved: boolean;
}

export interface PortfolioSaveResult {
  success: boolean;
  portfolio: PortfolioRecord;
  holdingsSavedCount: number;
  totalMarketValue: number;
  weightSumPercentage: number;
  savedAt: string;
  provenanceDigest: string;
  error?: string;
}

export interface PortfolioAnalyticsSummary {
  portfolioId: string;
  totalMarketValue: number;
  holdingsCount: number;
  topHoldings: Array<{
    symbol: string;
    companyId: string;
    weightPercentage: number;
    marketValue: number;
  }>;
  sectorAllocation: Record<string, number>;
  lineageHash: string;
}

export class PortfolioStore {
  private portfolios: Map<string, PortfolioRecord> = new Map();

  constructor() {
    // Initialize default institutional portfolio
    this.portfolios.set('DEFAULT_PORTFOLIO', {
      portfolioId: 'DEFAULT_PORTFOLIO',
      portfolioName: 'Institutional Flagship Portfolio',
      holdings: [],
      totalMarketValue: 0,
      totalHoldingsCount: 0,
      weightSumPercentage: 0.0,
      lastUpdated: new Date().toISOString(),
      provenanceDigest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // SHA-256 of empty
      isSaved: false,
    });
  }

  /**
   * Retrieves portfolio state by ID.
   */
  public getPortfolio(portfolioId: string = 'DEFAULT_PORTFOLIO'): PortfolioRecord | undefined {
    return this.portfolios.get(portfolioId);
  }

  /**
   * Atomic batch persistence boundary: Receives the full validated UserHoldingInput vector
   * in one governed atomic operation. Disallows individual partial writes.
   */
  public saveHoldings(
    portfolioId: string = 'DEFAULT_PORTFOLIO',
    holdings: UserHoldingInput[],
    provenanceMetadata?: Record<string, unknown>
  ): PortfolioSaveResult {
    // Save Guard 1: Empty holding write check
    if (!holdings || holdings.length === 0) {
      return {
        success: false,
        portfolio: this.getOrCreatePortfolio(portfolioId),
        holdingsSavedCount: 0,
        totalMarketValue: 0,
        weightSumPercentage: 0.0,
        savedAt: new Date().toISOString(),
        provenanceDigest: '',
        error: 'Save Guard Violation: Cannot save empty holdings vector.',
      };
    }

    // Save Guard 2: Strict weight sum validation (must equal 100.0000%)
    const weightSum = Math.round(holdings.reduce((sum, h) => sum + h.weightPercentage, 0) * 10000) / 10000;
    if (Math.abs(weightSum - 100.0) > 0.001) {
      return {
        success: false,
        portfolio: this.getOrCreatePortfolio(portfolioId),
        holdingsSavedCount: 0,
        totalMarketValue: 0,
        weightSumPercentage: weightSum,
        savedAt: new Date().toISOString(),
        provenanceDigest: '',
        error: `Save Guard Violation: Total holding weights (${weightSum}%) do not sum to 100.0%.`,
      };
    }

    // Save Guard 3: Strict entity authority check (every holding must have resolved companyId)
    for (const h of holdings) {
      if (!h.companyId || !h.symbol || h.quantity <= 0 || h.marketValue <= 0) {
        return {
          success: false,
          portfolio: this.getOrCreatePortfolio(portfolioId),
          holdingsSavedCount: 0,
          totalMarketValue: 0,
          weightSumPercentage: weightSum,
          savedAt: new Date().toISOString(),
          provenanceDigest: '',
          error: `Save Guard Violation: Holding '${h.symbol}' missing companyId or has invalid quantity/marketValue.`,
        };
      }
    }

    const savedAt = new Date().toISOString();
    const totalMarketValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);

    const provenanceDigest = computeLineageHash(
      {
        portfolioId,
        holdings: holdings.map((h) => ({
          companyId: h.companyId,
          symbol: h.symbol,
          quantity: h.quantity,
          weightPercentage: h.weightPercentage,
          marketValue: h.marketValue,
          lineageDigest: h.lineageDigest,
        })),
        totalMarketValue,
        savedAt,
        provenanceMetadata,
      },
      { sourceClassification: 'REAL', asOf: savedAt, dataVersion: 'v1.0.0-bi07' }
    );

    const updatedPortfolio: PortfolioRecord = {
      portfolioId,
      portfolioName: this.portfolios.get(portfolioId)?.portfolioName || 'Institutional Flagship Portfolio',
      holdings: [...holdings], // Atomic snapshot copy
      totalMarketValue,
      totalHoldingsCount: holdings.length,
      weightSumPercentage: weightSum,
      lastUpdated: savedAt,
      provenanceDigest,
      isSaved: true,
    };

    this.portfolios.set(portfolioId, updatedPortfolio);

    return {
      success: true,
      portfolio: updatedPortfolio,
      holdingsSavedCount: holdings.length,
      totalMarketValue,
      weightSumPercentage: weightSum,
      savedAt,
      provenanceDigest,
    };
  }

  /**
   * Generates downstream portfolio analytics summary consuming saved holdings directly.
   * Does NOT re-calculate weights independently in client; consumes authoritative BI-03/BI-05 weights.
   */
  public getAnalytics(portfolioId: string = 'DEFAULT_PORTFOLIO'): PortfolioAnalyticsSummary {
    const portfolio = this.getPortfolio(portfolioId);
    if (!portfolio || portfolio.holdings.length === 0) {
      return {
        portfolioId,
        totalMarketValue: 0,
        holdingsCount: 0,
        topHoldings: [],
        sectorAllocation: {},
        lineageHash: portfolio?.provenanceDigest || '',
      };
    }

    const sorted = [...portfolio.holdings].sort((a, b) => b.weightPercentage - a.weightPercentage);
    const topHoldings = sorted.slice(0, 5).map((h) => ({
      symbol: h.symbol,
      companyId: h.companyId,
      weightPercentage: h.weightPercentage,
      marketValue: h.marketValue,
    }));

    return {
      portfolioId,
      totalMarketValue: portfolio.totalMarketValue,
      holdingsCount: portfolio.holdings.length,
      topHoldings,
      sectorAllocation: {},
      lineageHash: portfolio.provenanceDigest,
    };
  }

  private getOrCreatePortfolio(portfolioId: string): PortfolioRecord {
    let p = this.portfolios.get(portfolioId);
    if (!p) {
      p = {
        portfolioId,
        portfolioName: 'Institutional Portfolio',
        holdings: [],
        totalMarketValue: 0,
        totalHoldingsCount: 0,
        weightSumPercentage: 0.0,
        lastUpdated: new Date().toISOString(),
        provenanceDigest: '',
        isSaved: false,
      };
      this.portfolios.set(portfolioId, p);
    }
    return p;
  }
}
