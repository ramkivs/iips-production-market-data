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
  contributions?: BrokerContributionRecord[];
}

export interface BrokerContributionRecord {
  sourceBroker: string;
  fileName: string;
  contentDigest: string;
  lineageDigest: string;
  importedAt: string;
  holdingsCount: number;
  totalMarketValue: number;
}

export interface PortfolioSaveOptions {
  mode?: 'MERGE' | 'REPLACE'; // Default: 'MERGE' (Governed Multi-Broker Atomic Merge)
  sourceBroker?: string;
  fileName?: string;
  contentDigest?: string;
  lineageDigest?: string;
  [key: string]: unknown;
}

export interface PortfolioSaveResult {
  success: boolean;
  isDuplicate?: boolean;
  disposition?: 'SAVED_NEW_BATCH' | 'MERGED_INTO_EXISTING' | 'ALREADY_IMPORTED_NO_OP';
  message?: string;
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
   * Resets portfolio to clean uncommitted initial state.
   */
  public resetPortfolio(portfolioId: string = 'DEFAULT_PORTFOLIO'): PortfolioRecord {
    const initialRecord: PortfolioRecord = {
      portfolioId,
      portfolioName: portfolioId === 'DEFAULT_PORTFOLIO' ? 'Institutional Flagship Portfolio' : 'Institutional Portfolio',
      holdings: [],
      totalMarketValue: 0,
      totalHoldingsCount: 0,
      weightSumPercentage: 0.0,
      lastUpdated: new Date().toISOString(),
      provenanceDigest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // SHA-256 of empty
      isSaved: false,
      contributions: [],
    };
    this.portfolios.set(portfolioId, initialRecord);
    return initialRecord;
  }

  /**
   * Atomic batch persistence boundary: Receives a validated UserHoldingInput vector
   * and executes governed multi-broker atomic merge (or replacement if explicitly requested).
   *
   * Consolidation Rules:
   * 1. Merges incoming holdings with existing portfolio holdings keyed by canonical P04/P12 companyId.
   * 2. Where companyId overlaps across brokers:
   *    - Quantity is summed.
   *    - Cost basis is aggregated ((Q1*P1) + (Q2*P2)) and volume-weighted average price derived.
   *    - Market valuation updated (Q_total * P_latest).
   * 3. Where companyId is unique: position is preserved/added.
   * 4. Recalculates final portfolio allocation weights to sum to exactly 100.0000%.
   * 5. Computes a new deterministic SHA-256 lineage digest over the entire consolidated portfolio.
   * 6. Preserves broker contribution audit records.
   * 7. (BI-08): Enforces Content-Hash Idempotency (Option A). Re-uploading an identical source file
   *    (matching contentDigest) returns ALREADY_IMPORTED_NO_OP without mutating portfolio state.
   */
  public saveHoldings(
    portfolioId: string = 'DEFAULT_PORTFOLIO',
    holdings: UserHoldingInput[],
    options?: PortfolioSaveOptions | Record<string, unknown>
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

    // Save Guard 2: Strict entity authority check (every holding must have resolved companyId OR authorized non-production bypass)
    for (const h of holdings) {
      const isResolved = h.identityStatus !== 'UNRESOLVED' && !!h.companyId;
      const isBypass = h.identityStatus === 'UNRESOLVED' && h.resolutionDisposition === 'NON_PRODUCTION_OPERATOR_BYPASS';

      if (!h.symbol || (!isResolved && !isBypass) || h.quantity <= 0 || h.marketValue <= 0) {
        return {
          success: false,
          portfolio: this.getOrCreatePortfolio(portfolioId),
          holdingsSavedCount: 0,
          totalMarketValue: 0,
          weightSumPercentage: 0.0,
          savedAt: new Date().toISOString(),
          provenanceDigest: '',
          error: `Save Guard Violation: Holding '${h.symbol}' missing companyId or has invalid quantity/marketValue.`,
        };
      }
    }

    const savedAt = new Date().toISOString();
    const existingPortfolio = this.portfolios.get(portfolioId);
    const saveMode = (options as PortfolioSaveOptions)?.mode || 'MERGE';
    const incomingContentDigest = (options as PortfolioSaveOptions)?.contentDigest;

    // BI-08: Content-Hash Idempotency Guard (Option A)
    // If incoming contentDigest matches an already committed contribution and mode is not 'REPLACE',
    // return idempotent ALREADY_IMPORTED_NO_OP without mutating portfolio state or appending duplicate contributions.
    if (
      saveMode !== 'REPLACE' &&
      existingPortfolio &&
      existingPortfolio.isSaved &&
      incomingContentDigest &&
      existingPortfolio.contributions &&
      existingPortfolio.contributions.some((c) => c.contentDigest === incomingContentDigest)
    ) {
      return {
        success: true,
        isDuplicate: true,
        disposition: 'ALREADY_IMPORTED_NO_OP',
        message: 'Source file already committed to this portfolio. State preserved without duplication.',
        portfolio: existingPortfolio,
        holdingsSavedCount: existingPortfolio.holdings.length,
        totalMarketValue: existingPortfolio.totalMarketValue,
        weightSumPercentage: existingPortfolio.weightSumPercentage,
        savedAt: existingPortfolio.lastUpdated,
        provenanceDigest: existingPortfolio.provenanceDigest,
      };
    }

    const shouldMerge = saveMode === 'MERGE' && existingPortfolio && existingPortfolio.isSaved && existingPortfolio.holdings.length > 0;

    let finalHoldings: UserHoldingInput[] = [];

    if (!shouldMerge) {
      // Save Guard 2b: Strict weight sum check for initial/standalone batch
      const weightSum = Math.round(holdings.reduce((sum, h) => sum + h.weightPercentage, 0) * 10000) / 10000;
      if (Math.abs(weightSum - 100.0) > 0.001) {
        return {
          success: false,
          portfolio: this.getOrCreatePortfolio(portfolioId),
          holdingsSavedCount: 0,
          totalMarketValue: 0,
          weightSumPercentage: weightSum,
          savedAt,
          provenanceDigest: '',
          error: `Save Guard Violation: Total holding weights (${weightSum}%) do not sum to 100.0%.`,
        };
      }
      finalHoldings = [...holdings];
    } else {
      // Governed Multi-Broker Atomic Merge by canonical P04/P12 companyId (or unique unresolved key)
      const consolidationMap = new Map<string, {
        symbol: string;
        companyId: string;
        isin?: string;
        exchange?: 'NSE' | 'BSE';
        quantity: number;
        totalCostBasis: number;
        currentPrice: number;
        sourceBrokers: Set<string>;
        lineageDigests: string[];
        identityStatus?: 'RESOLVED' | 'UNRESOLVED';
        resolutionDisposition?: 'CANONICAL_P04' | 'NON_PRODUCTION_OPERATOR_BYPASS';
      }>();

      // 1. Populate with existing holdings
      for (const h of existingPortfolio!.holdings) {
        const key = h.companyId ? h.companyId : (h.isin ? `UNRESOLVED:ISIN:${h.isin}` : `UNRESOLVED:SYM:${h.symbol}`);
        consolidationMap.set(key, {
          symbol: h.symbol,
          companyId: h.companyId,
          isin: h.isin,
          exchange: h.exchange,
          quantity: Number(h.quantity),
          totalCostBasis: Number(h.quantity) * Number(h.averageBuyPrice),
          currentPrice: Number(h.currentPrice),
          sourceBrokers: new Set([h.sourceBroker]),
          lineageDigests: [h.lineageDigest],
          identityStatus: h.identityStatus,
          resolutionDisposition: h.resolutionDisposition,
        });
      }

      // 2. Merge incoming broker holdings
      for (const h of holdings) {
        const key = h.companyId ? h.companyId : (h.isin ? `UNRESOLVED:ISIN:${h.isin}` : `UNRESOLVED:SYM:${h.symbol}`);
        const existing = consolidationMap.get(key);

        if (existing) {
          const addedQty = Number(h.quantity);
          const addedCostBasis = addedQty * Number(h.averageBuyPrice);
          const newQty = existing.quantity + addedQty;
          const newCostBasis = existing.totalCostBasis + addedCostBasis;
          const latestPrice = Number(h.currentPrice) > 0 ? Number(h.currentPrice) : existing.currentPrice;

          existing.quantity = newQty;
          existing.totalCostBasis = newCostBasis;
          existing.currentPrice = latestPrice;
          if (h.isin && !existing.isin) existing.isin = h.isin;
          if (h.exchange && !existing.exchange) existing.exchange = h.exchange;
          existing.sourceBrokers.add(h.sourceBroker);
          existing.lineageDigests.push(h.lineageDigest);
        } else {
          consolidationMap.set(key, {
            symbol: h.symbol,
            companyId: h.companyId,
            isin: h.isin,
            exchange: h.exchange,
            quantity: Number(h.quantity),
            totalCostBasis: Number(h.quantity) * Number(h.averageBuyPrice),
            currentPrice: Number(h.currentPrice),
            sourceBrokers: new Set([h.sourceBroker]),
            lineageDigests: [h.lineageDigest],
            identityStatus: h.identityStatus,
            resolutionDisposition: h.resolutionDisposition,
          });
        }
      }

      // 3. Form intermediate consolidated holding records
      const intermediate: Array<{
        symbol: string;
        companyId: string;
        isin?: string;
        exchange?: 'NSE' | 'BSE';
        quantity: number;
        averageBuyPrice: number;
        currentPrice: number;
        marketValue: number;
        sourceBroker: any;
        lineageDigests: string[];
        identityStatus?: 'RESOLVED' | 'UNRESOLVED';
        resolutionDisposition?: 'CANONICAL_P04' | 'NON_PRODUCTION_OPERATOR_BYPASS';
      }> = [];

      for (const item of consolidationMap.values()) {
        const avgBuyPrice = item.quantity > 0 ? (item.totalCostBasis / item.quantity) : 0;
        const marketValue = item.quantity * item.currentPrice;
        const sourceBroker = item.sourceBrokers.size === 1
          ? Array.from(item.sourceBrokers)[0]
          : 'GENERIC';

        intermediate.push({
          symbol: item.symbol,
          companyId: item.companyId,
          isin: item.isin,
          exchange: item.exchange,
          quantity: item.quantity,
          averageBuyPrice: avgBuyPrice,
          currentPrice: item.currentPrice,
          marketValue,
          sourceBroker,
          lineageDigests: item.lineageDigests,
          identityStatus: item.identityStatus,
          resolutionDisposition: item.resolutionDisposition,
        });
      }

      // 4. Calculate total merged portfolio market value
      const mergedTotalMarketValue = intermediate.reduce((sum, h) => sum + h.marketValue, 0);

      // 5. Derive and normalize portfolio weights to sum to exactly 100.0000%
      const precision = 4;
      const scale = Math.pow(10, precision);
      let weightSum = 0;
      let maxWeightIndex = 0;
      let maxWeightVal = -1;
      const rawWeights: number[] = [];

      for (let i = 0; i < intermediate.length; i++) {
        const h = intermediate[i];
        const rawW = mergedTotalMarketValue > 0 ? (h.marketValue / mergedTotalMarketValue) * 100 : 0;
        const roundedW = Math.round(rawW * scale) / scale;
        rawWeights.push(roundedW);
        weightSum += roundedW;

        if (h.marketValue > maxWeightVal) {
          maxWeightVal = h.marketValue;
          maxWeightIndex = i;
        }
      }

      // Apply rounding residual to the largest constituent
      const residual = Math.round((100.0 - weightSum) * scale) / scale;
      if (residual !== 0 && intermediate.length > 0) {
        rawWeights[maxWeightIndex] = Math.round((rawWeights[maxWeightIndex] + residual) * scale) / scale;
      }

      // 6. Construct final UserHoldingInput records with updated lineage digests
      for (let i = 0; i < intermediate.length; i++) {
        const base = intermediate[i];
        const weight = rawWeights[i];

        const holdingLineage = computeLineageHash(
          {
            symbol: base.symbol,
            companyId: base.companyId,
            quantity: base.quantity,
            averageBuyPrice: base.averageBuyPrice,
            currentPrice: base.currentPrice,
            marketValue: base.marketValue,
            weightPercentage: weight,
            priorDigests: base.lineageDigests,
            identityStatus: base.identityStatus,
            resolutionDisposition: base.resolutionDisposition,
          },
          { sourceClassification: 'REAL', asOf: savedAt, dataVersion: 'v1.0.0-bi07' }
        );

        finalHoldings.push({
          symbol: base.symbol,
          companyId: base.companyId,
          isin: base.isin,
          exchange: base.exchange,
          quantity: base.quantity,
          averageBuyPrice: base.averageBuyPrice,
          currentPrice: base.currentPrice,
          marketValue: base.marketValue,
          weightPercentage: weight,
          active: true,
          sourceBroker: base.sourceBroker,
          lineageDigest: holdingLineage,
          identityStatus: base.identityStatus,
          resolutionDisposition: base.resolutionDisposition,
        });
      }
    }

    const totalMarketValue = finalHoldings.reduce((sum, h) => sum + h.marketValue, 0);
    const finalWeightSum = Math.round(finalHoldings.reduce((sum, h) => sum + h.weightPercentage, 0) * 10000) / 10000;

    // Track contributions
    const optObj = (options as PortfolioSaveOptions) || {};
    const existingContributions = shouldMerge ? (existingPortfolio?.contributions || []) : [];
    const newContribution: BrokerContributionRecord = {
      sourceBroker: optObj.sourceBroker || 'GENERIC',
      fileName: optObj.fileName || 'unknown.csv',
      contentDigest: optObj.contentDigest || '',
      lineageDigest: optObj.lineageDigest || '',
      importedAt: savedAt,
      holdingsCount: holdings.length,
      totalMarketValue: holdings.reduce((sum, h) => sum + h.marketValue, 0),
    };
    const contributions = [...existingContributions, newContribution];

    const provenanceDigest = computeLineageHash(
      {
        portfolioId,
        holdings: finalHoldings.map((h) => ({
          companyId: h.companyId,
          symbol: h.symbol,
          quantity: h.quantity,
          weightPercentage: h.weightPercentage,
          marketValue: h.marketValue,
          lineageDigest: h.lineageDigest,
        })),
        totalMarketValue,
        savedAt,
        contributions: contributions.map((c) => ({
          sourceBroker: c.sourceBroker,
          contentDigest: c.contentDigest,
          importedAt: c.importedAt,
        })),
        ...(options === undefined ? {} : { options }),
      },
      { sourceClassification: 'REAL', asOf: savedAt, dataVersion: 'v1.0.0-bi07' }
    );

    const updatedPortfolio: PortfolioRecord = {
      portfolioId,
      portfolioName: this.portfolios.get(portfolioId)?.portfolioName || 'Institutional Flagship Portfolio',
      holdings: [...finalHoldings],
      totalMarketValue,
      totalHoldingsCount: finalHoldings.length,
      weightSumPercentage: finalWeightSum,
      lastUpdated: savedAt,
      provenanceDigest,
      isSaved: true,
      contributions,
    };

    this.portfolios.set(portfolioId, updatedPortfolio);

    return {
      success: true,
      portfolio: updatedPortfolio,
      holdingsSavedCount: finalHoldings.length,
      totalMarketValue,
      weightSumPercentage: finalWeightSum,
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

/**
 * Module-level singleton instance of PortfolioStore for application-lifetime continuity (Tier-B).
 */
let defaultPortfolioStoreInstance: PortfolioStore | null = null;

export function getDefaultPortfolioStore(): PortfolioStore {
  if (!defaultPortfolioStoreInstance) {
    defaultPortfolioStoreInstance = new PortfolioStore();
  }
  return defaultPortfolioStoreInstance;
}

export function resetDefaultPortfolioStore(): void {
  defaultPortfolioStoreInstance = null;
}

