/**
 * Institutional Investment Platform System (IIPS)
 * Engine API Adapter & Product Transport Assembler (P12 / AD-13)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 */

import { MarketDataDTO } from './market_data_dto.js';
import { FundamentalsDTO } from './fundamentals_dto.js';
import { IntelligenceDTO } from './intelligence_dto.js';
import { ExecutiveProvenance, ProductTransportMode, AD17_CONSTRAINT_TEXT } from './types.js';
import { MarketQuotePayload } from '../contracts/d01_quotes.js';
import { StandardizedFinancialStatement, FinancialRatioMetrics } from '../fundamentals/types.js';
import { TTMFinancialStatement } from '../fundamentals/ttm_calculator.js';
import { FilteredNewsResult } from '../intelligence/news_engine.js';
import { AggregatedConsensusResult } from '../intelligence/estimates_engine.js';
import { MacroQueryResult } from '../intelligence/macro_engine.js';
import { CompositeAlternativeSignal } from '../intelligence/altdata_engine.js';
import { computeLineageHash, sanitizeProvenanceForConsumer } from '../contracts/provenance.js';
import { QualityState } from '../contracts/types.js';

export class EngineApiAdapter {
  /**
   * Constructs an authorized MarketDataDTO with provider masking and executive provenance.
   */
  public static createMarketDataDTO(params: {
    quote: MarketQuotePayload;
    mode: ProductTransportMode;
    asOf: string;
    isSimulationOrReplay?: boolean;
    quality?: QualityState;
  }): MarketDataDTO {
    const { quote, mode, asOf, isSimulationOrReplay = false, quality = 'GOOD' } = params;
    const evaluatedAt = new Date().toISOString();

    const lineageDigest = computeLineageHash(quote, {
      sourceClassification: 'CANONICAL_MARKET_DATA',
      asOf,
      dataVersion: 'v1.0.0-transport',
    });

    const provenance: ExecutiveProvenance = {
      sourceClassification: 'CANONICAL_MARKET_DATA',
      asOf,
      evaluatedAt,
      dataVersion: 'v1.0.0-transport',
      lineageDigest,
      quality,
      replayConstraintApplied: isSimulationOrReplay,
      replayConstraintText: isSimulationOrReplay ? AD17_CONSTRAINT_TEXT : undefined,
    };

    return {
      companyId: quote.companyId,
      symbol: quote.symbol,
      exchange: quote.exchange,
      ltp: quote.ltp,
      open: quote.open,
      high: quote.high,
      low: quote.low,
      close: quote.close,
      previousClose: quote.previousClose,
      change: quote.change,
      pctChange: quote.pctChange,
      volume: quote.volume,
      vwap: quote.vwap,
      turnover: quote.turnover,
      tradeCount: quote.tradeCount,
      mode,
      quality,
      provenance,
    };
  }

  /**
   * Constructs an authorized FundamentalsDTO.
   */
  public static createFundamentalsDTO(params: {
    statement: StandardizedFinancialStatement;
    ratios: FinancialRatioMetrics;
    ttmStatement?: TTMFinancialStatement | null;
    asOf: string;
    isSimulationOrReplay?: boolean;
  }): FundamentalsDTO {
    const { statement, ratios, ttmStatement, asOf, isSimulationOrReplay = false } = params;
    const evaluatedAt = new Date().toISOString();

    const lineageDigest = computeLineageHash(
      { ratios, ttmStatement, statementId: statement.statementId },
      { sourceClassification: 'DERIVED', asOf, dataVersion: 'v1.0.0-transport' }
    );

    const provenance: ExecutiveProvenance = {
      sourceClassification: 'DERIVED',
      asOf,
      evaluatedAt,
      dataVersion: 'v1.0.0-transport',
      lineageDigest,
      quality: ratios.qualityState,
      replayConstraintApplied: isSimulationOrReplay,
      replayConstraintText: isSimulationOrReplay ? AD17_CONSTRAINT_TEXT : undefined,
    };

    return {
      companyId: statement.companyId,
      scope: statement.scope,
      fiscalYear: statement.fiscalYear,
      quarter: statement.quarter,
      periodType: statement.periodType,
      ratios,
      ttmStatement,
      incomeStatement: statement.incomeStatement,
      balanceSheet: statement.balanceSheet,
      cashFlow: statement.cashFlow,
      quality: ratios.qualityState,
      provenance,
    };
  }

  /**
   * Constructs an authorized IntelligenceDTO.
   */
  public static createIntelligenceDTO(params: {
    companyId: string;
    news: FilteredNewsResult;
    estimates?: AggregatedConsensusResult | null;
    macro?: MacroQueryResult[] | null;
    altData?: CompositeAlternativeSignal | null;
    asOf: string;
    isSimulationOrReplay?: boolean;
  }): IntelligenceDTO {
    const { companyId, news, estimates, macro, altData, asOf, isSimulationOrReplay = false } = params;
    const evaluatedAt = new Date().toISOString();

    const lineageDigest = computeLineageHash(
      { newsSummary: news.dominantSentiment, estimates, altData },
      { sourceClassification: 'DERIVED', asOf, dataVersion: 'v1.0.0-transport' }
    );

    const quality: QualityState = news.qualityState;

    const provenance: ExecutiveProvenance = {
      sourceClassification: 'DERIVED',
      asOf,
      evaluatedAt,
      dataVersion: 'v1.0.0-transport',
      lineageDigest,
      quality,
      replayConstraintApplied: isSimulationOrReplay,
      replayConstraintText: isSimulationOrReplay ? AD17_CONSTRAINT_TEXT : undefined,
    };

    return {
      companyId,
      news,
      estimates,
      macro,
      altData,
      quality,
      provenance,
    };
  }
}
