/**
 * Institutional Investment Platform System (IIPS)
 * Portfolio ⇄ Canonical Market Data Binding (DHAN-D2)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-12 / NFR-06
 * Gate: DHAN-D2 INTEGRATION & QUALIFICATION HARNESS
 * Mode: PRE_ACCESS / SYNTHETIC / OFFLINE
 *
 * PROVIDER NEUTRALITY:
 *  This module consumes ONLY the existing canonical product transport DTO
 *  (`MarketDataDTO`). It contains no provider response parsing, no vendor field names and
 *  no provider identifiers. Any provider that emits canonical market data — Dhan included —
 *  is consumed identically.
 *
 * FAIL-CLOSED RULE:
 *  A position is revalued only when canonical market data exists AND its data state is
 *  CURRENT or STALE. Unavailable or quality-floor-failing data leaves the position
 *  explicitly unpriced; it is never silently valued at cost or at a stale price presented
 *  as current. Existing import-time portfolio calculations are left untouched.
 */

import { UserHoldingInput } from '../import/types.js';
import { MarketDataDTO } from '../../../../../src/transports/market_data_dto.js';
import { QualityState } from '../../../../../src/contracts/types.js';
import {
  MarketDataPresentationState,
  deriveMarketDataState,
} from '../../../../../src/providers/market_data_route.js';

export type PositionPricingDisposition =
  | 'PRICED_FROM_CANONICAL_MARKET_DATA'
  | 'UNPRICED_NO_MARKET_DATA'
  | 'UNPRICED_QUALITY_FLOOR_NOT_MET';

export interface RevaluedPosition {
  companyId: string;
  symbol: string;
  quantity: number;
  averageBuyPrice: number;
  investedValue: number;

  /** Null whenever the position is unpriced — never substituted with cost or stale proxies. */
  ltp: number | null;
  previousClose: number | null;
  dayChangePerShare: number | null;
  dayChangeValue: number | null;
  dayChangePct: number | null;
  currentValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPct: number | null;
  weightPercentage: number | null;

  marketDataState: MarketDataPresentationState;
  quality: QualityState;
  disposition: PositionPricingDisposition;
  asOf: string | null;
  lineageDigest: string | null;
  sourceClassification: string | null;
}

export interface PortfolioRevaluationResult {
  positions: RevaluedPosition[];
  totalInvestedValue: number;
  totalCurrentValue: number;
  totalUnrealizedPnl: number;
  totalUnrealizedPnlPct: number;
  totalDayChangeValue: number;
  pricedPositionCount: number;
  unpricedPositionCount: number;
  allPositionsPriced: boolean;
  /** Worst position state; the portfolio can never present CURRENT while any leg is degraded. */
  portfolioState: MarketDataPresentationState;
  weightBasis: 'PRICED_POSITIONS_ONLY';
  evaluatedAt: string;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Indexes canonical market data by companyId. */
export function buildMarketDataIndex(marketData: readonly MarketDataDTO[]): Map<string, MarketDataDTO> {
  const index = new Map<string, MarketDataDTO>();
  for (const dto of marketData) {
    if (dto && typeof dto.companyId === 'string' && dto.companyId.trim()) {
      index.set(dto.companyId.trim().toUpperCase(), dto);
    }
  }
  return index;
}

const STATE_SEVERITY: Record<MarketDataPresentationState, number> = {
  CURRENT: 0,
  STALE: 1,
  UNAVAILABLE: 2,
};

function worstState(
  a: MarketDataPresentationState,
  b: MarketDataPresentationState
): MarketDataPresentationState {
  return STATE_SEVERITY[b] > STATE_SEVERITY[a] ? b : a;
}

/**
 * Revalues imported holdings against canonical market data.
 * Pure and deterministic: no mutation of the input holdings, no provider access.
 */
export function revaluePortfolioHoldings(params: {
  holdings: readonly UserHoldingInput[];
  marketData: readonly MarketDataDTO[];
  evaluatedAt: string;
}): PortfolioRevaluationResult {
  const index = buildMarketDataIndex(params.marketData);
  const positions: RevaluedPosition[] = [];

  let totalInvestedValue = 0;
  let totalCurrentValue = 0;
  let totalDayChangeValue = 0;
  let pricedPositionCount = 0;
  let portfolioState: MarketDataPresentationState = 'CURRENT';

  for (const holding of params.holdings) {
    const investedValue = round2(holding.quantity * holding.averageBuyPrice);
    totalInvestedValue = round2(totalInvestedValue + investedValue);

    const dto = index.get((holding.companyId || '').trim().toUpperCase());

    if (!dto) {
      positions.push({
        companyId: holding.companyId,
        symbol: holding.symbol,
        quantity: holding.quantity,
        averageBuyPrice: holding.averageBuyPrice,
        investedValue,
        ltp: null,
        previousClose: null,
        dayChangePerShare: null,
        dayChangeValue: null,
        dayChangePct: null,
        currentValue: null,
        unrealizedPnl: null,
        unrealizedPnlPct: null,
        weightPercentage: null,
        marketDataState: 'UNAVAILABLE',
        quality: 'UNAVAILABLE',
        disposition: 'UNPRICED_NO_MARKET_DATA',
        asOf: null,
        lineageDigest: null,
        sourceClassification: null,
      });
      portfolioState = worstState(portfolioState, 'UNAVAILABLE');
      continue;
    }

    const state = deriveMarketDataState(dto.quality);
    if (state === 'UNAVAILABLE') {
      positions.push({
        companyId: holding.companyId,
        symbol: holding.symbol,
        quantity: holding.quantity,
        averageBuyPrice: holding.averageBuyPrice,
        investedValue,
        ltp: null,
        previousClose: null,
        dayChangePerShare: null,
        dayChangeValue: null,
        dayChangePct: null,
        currentValue: null,
        unrealizedPnl: null,
        unrealizedPnlPct: null,
        weightPercentage: null,
        marketDataState: 'UNAVAILABLE',
        quality: dto.quality,
        disposition: 'UNPRICED_QUALITY_FLOOR_NOT_MET',
        asOf: dto.provenance.asOf,
        lineageDigest: dto.provenance.lineageDigest,
        sourceClassification: dto.provenance.sourceClassification,
      });
      portfolioState = worstState(portfolioState, 'UNAVAILABLE');
      continue;
    }

    const currentValue = round2(holding.quantity * dto.ltp);
    const dayChangeValue = round2(holding.quantity * dto.change);
    const unrealizedPnl = round2(currentValue - investedValue);

    positions.push({
      companyId: holding.companyId,
      symbol: holding.symbol,
      quantity: holding.quantity,
      averageBuyPrice: holding.averageBuyPrice,
      investedValue,
      ltp: dto.ltp,
      previousClose: dto.previousClose,
      dayChangePerShare: dto.change,
      dayChangeValue,
      dayChangePct: dto.pctChange,
      currentValue,
      unrealizedPnl,
      unrealizedPnlPct: investedValue > 0 ? round2((unrealizedPnl / investedValue) * 100) : 0,
      weightPercentage: null, // assigned after the priced total is known
      marketDataState: state,
      quality: dto.quality,
      disposition: 'PRICED_FROM_CANONICAL_MARKET_DATA',
      asOf: dto.provenance.asOf,
      lineageDigest: dto.provenance.lineageDigest,
      sourceClassification: dto.provenance.sourceClassification,
    });

    totalCurrentValue = round2(totalCurrentValue + currentValue);
    totalDayChangeValue = round2(totalDayChangeValue + dayChangeValue);
    pricedPositionCount++;
    portfolioState = worstState(portfolioState, state);
  }

  for (const position of positions) {
    if (position.currentValue !== null && totalCurrentValue > 0) {
      position.weightPercentage = round2((position.currentValue / totalCurrentValue) * 100);
    }
  }

  const unpricedPositionCount = positions.length - pricedPositionCount;
  if (positions.length === 0 || pricedPositionCount === 0) {
    portfolioState = 'UNAVAILABLE';
  }

  const pricedInvested = positions
    .filter((p) => p.currentValue !== null)
    .reduce((sum, p) => round2(sum + p.investedValue), 0);
  const totalUnrealizedPnl = round2(totalCurrentValue - pricedInvested);

  return {
    positions,
    totalInvestedValue,
    totalCurrentValue,
    totalUnrealizedPnl,
    totalUnrealizedPnlPct: pricedInvested > 0 ? round2((totalUnrealizedPnl / pricedInvested) * 100) : 0,
    totalDayChangeValue,
    pricedPositionCount,
    unpricedPositionCount,
    allPositionsPriced: unpricedPositionCount === 0 && positions.length > 0,
    portfolioState,
    weightBasis: 'PRICED_POSITIONS_ONLY',
    evaluatedAt: params.evaluatedAt,
  };
}
