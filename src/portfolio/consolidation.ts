/**
 * Institutional Investment Platform System (IIPS)
 * Governed Portfolio Consolidation — PURE DOMAIN LOGIC (NP04-G24 / Phase C)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01 / BI-08
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 *
 * This module is a faithful, behaviour-preserving extraction of the consolidation
 * rules implemented by the certified in-memory PortfolioStore
 * (frontend/src/features/portfolio/portfolio-store.ts).
 *
 * It is PURE: no I/O, no database, no clock coupling beyond an injectable
 * timestamp. The durable store and the in-memory store therefore execute the
 * identical arithmetic, which is asserted by the G24 parity tests.
 *
 * The in-memory PortfolioStore is NOT modified by this extraction.
 */

import { computeLineageHash } from '../contracts/provenance.js';
import type {
  BrokerContributionRecord,
  PortfolioSaveOptions,
} from '../../frontend/src/features/portfolio/portfolio-store.js';
import type { UserHoldingInput } from '../../frontend/src/features/portfolio/import/types.js';

/** Digest of an empty holding set (SHA-256 of empty), matching the certified store. */
export const EMPTY_PROVENANCE_DIGEST =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

/** Lineage data version used by the certified BI-07 persistence boundary. */
export const PORTFOLIO_LINEAGE_DATA_VERSION = 'v1.0.0-bi07';

export type SaveDisposition =
  | 'SAVED_NEW_BATCH'
  | 'MERGED_INTO_EXISTING'
  | 'ALREADY_IMPORTED_NO_OP';

export interface ConsolidatedSave {
  readonly disposition: SaveDisposition;
  readonly isDuplicate: boolean;
  readonly holdings: UserHoldingInput[];
  readonly contributions: BrokerContributionRecord[];
  readonly totalMarketValue: number;
  readonly weightSumPercentage: number;
  readonly holdingsCount: number;
  readonly provenanceDigest: string;
  readonly savedAt: string;
}

export interface ConsolidationRejection {
  readonly error: string;
  readonly weightSumPercentage?: number;
}

export type ConsolidationOutcome =
  | { readonly ok: true; readonly value: ConsolidatedSave }
  | { readonly ok: false; readonly rejection: ConsolidationRejection };

export interface ConsolidationInput {
  readonly portfolioId: string;
  readonly holdings: readonly UserHoldingInput[];
  readonly options?: PortfolioSaveOptions | Record<string, unknown>;
  /**
   * Current committed state of the portfolio, or undefined when the portfolio
   * has never been saved.
   */
  readonly existing?: {
    readonly isSaved: boolean;
    readonly holdings: readonly UserHoldingInput[];
    readonly contributions?: readonly BrokerContributionRecord[];
  };
  /** Injectable timestamp (ISO-8601). Enables deterministic tests. */
  readonly savedAt?: string;
}

/** Deterministic consolidation key: canonical companyId, else ISIN, else symbol. */
export function holdingKey(holding: UserHoldingInput): string {
  if (holding.companyId) {
    return holding.companyId;
  }
  if (holding.isin) {
    return `UNRESOLVED:ISIN:${holding.isin}`;
  }
  return `UNRESOLVED:SYM:${holding.symbol}`;
}

/**
 * Executes the governed save guards and, on success, the consolidation.
 *
 * Save Guard 1 — an empty holdings vector is rejected.
 * Save Guard 2 — every holding must be entity-resolved (or carry the explicit
 *                non-production operator bypass) and carry positive
 *                quantity and market value.
 * Save Guard 2b — a non-merging batch must have weights summing to 100.0%.
 */
export function consolidatePortfolioSave(input: ConsolidationInput): ConsolidationOutcome {
  const { portfolioId, holdings, options } = input;
  const savedAt = input.savedAt ?? new Date().toISOString();

  // Save Guard 1: Empty holding write check.
  if (!holdings || holdings.length === 0) {
    return {
      ok: false,
      rejection: { error: 'Save Guard Violation: Cannot save empty holdings vector.' },
    };
  }

  // Save Guard 2: Strict entity authority check.
  for (const h of holdings) {
    const isResolved = h.identityStatus !== 'UNRESOLVED' && !!h.companyId;
    const isBypass =
      h.identityStatus === 'UNRESOLVED' &&
      h.resolutionDisposition === 'NON_PRODUCTION_OPERATOR_BYPASS';

    if (!h.symbol || (!isResolved && !isBypass) || h.quantity <= 0 || h.marketValue <= 0) {
      return {
        ok: false,
        rejection: {
          error: `Save Guard Violation: Holding '${h.symbol}' missing companyId or has invalid quantity/marketValue.`,
        },
      };
    }
  }

  const opt = (options ?? {}) as PortfolioSaveOptions;
  const saveMode = opt.mode || 'MERGE';
  const incomingContentDigest = opt.contentDigest;
  const existing = input.existing;

  // BI-08 Content-Hash Idempotency Guard (Option A).
  // Identical source content committed to a saved portfolio is an idempotent no-op.
  if (
    saveMode !== 'REPLACE' &&
    existing &&
    existing.isSaved &&
    incomingContentDigest &&
    existing.contributions &&
    existing.contributions.some((c) => c.contentDigest === incomingContentDigest)
  ) {
    return {
      ok: true,
      value: {
        disposition: 'ALREADY_IMPORTED_NO_OP',
        isDuplicate: true,
        holdings: [...existing.holdings],
        contributions: [...existing.contributions],
        totalMarketValue: existing.holdings.reduce((sum, h) => sum + h.marketValue, 0),
        weightSumPercentage: round4(
          existing.holdings.reduce((sum, h) => sum + h.weightPercentage, 0)
        ),
        holdingsCount: existing.holdings.length,
        provenanceDigest: EMPTY_PROVENANCE_DIGEST,
        savedAt,
      },
    };
  }

  const shouldMerge =
    saveMode === 'MERGE' && !!existing && existing.isSaved && existing.holdings.length > 0;

  let finalHoldings: UserHoldingInput[] = [];

  if (!shouldMerge) {
    // Save Guard 2b: strict weight sum check for an initial/standalone batch.
    const weightSum = round4(holdings.reduce((sum, h) => sum + h.weightPercentage, 0));
    if (Math.abs(weightSum - 100.0) > 0.001) {
      return {
        ok: false,
        rejection: {
          error: `Save Guard Violation: Total holding weights (${weightSum}%) do not sum to 100.0%.`,
          weightSumPercentage: weightSum,
        },
      };
    }
    finalHoldings = holdings.map((h) => ({ ...h }));
  } else {
    finalHoldings = mergeByCanonicalKey(existing!.holdings, holdings, savedAt);
  }

  const totalMarketValue = finalHoldings.reduce((sum, h) => sum + h.marketValue, 0);
  const finalWeightSum = round4(
    finalHoldings.reduce((sum, h) => sum + h.weightPercentage, 0)
  );

  // Contribution (provenance/lineage) tracking.
  const existingContributions = shouldMerge ? existing?.contributions ?? [] : [];
  const newContribution: BrokerContributionRecord = {
    sourceBroker: opt.sourceBroker || 'GENERIC',
    fileName: opt.fileName || 'unknown.csv',
    contentDigest: opt.contentDigest || '',
    lineageDigest: opt.lineageDigest || '',
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
      options,
    },
    {
      sourceClassification: 'REAL',
      asOf: savedAt,
      dataVersion: PORTFOLIO_LINEAGE_DATA_VERSION,
    }
  );

  return {
    ok: true,
    value: {
      disposition: shouldMerge ? 'MERGED_INTO_EXISTING' : 'SAVED_NEW_BATCH',
      isDuplicate: false,
      holdings: finalHoldings,
      contributions,
      totalMarketValue,
      weightSumPercentage: finalWeightSum,
      holdingsCount: finalHoldings.length,
      provenanceDigest,
      savedAt,
    },
  };
}

/**
 * Governed multi-broker atomic merge keyed by canonical identity.
 * Quantity is summed; cost basis is aggregated; the latest positive price wins;
 * the rounding residual is applied to the largest constituent so weights sum to
 * exactly 100.0000%.
 */
function mergeByCanonicalKey(
  existingHoldings: readonly UserHoldingInput[],
  incomingHoldings: readonly UserHoldingInput[],
  savedAt: string
): UserHoldingInput[] {
  interface Accumulator {
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
  }

  const consolidationMap = new Map<string, Accumulator>();

  for (const h of existingHoldings) {
    consolidationMap.set(holdingKey(h), {
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

  for (const h of incomingHoldings) {
    const key = holdingKey(h);
    const existing = consolidationMap.get(key);

    if (existing) {
      const addedQty = Number(h.quantity);
      const addedCostBasis = addedQty * Number(h.averageBuyPrice);
      existing.quantity = existing.quantity + addedQty;
      existing.totalCostBasis = existing.totalCostBasis + addedCostBasis;
      existing.currentPrice =
        Number(h.currentPrice) > 0 ? Number(h.currentPrice) : existing.currentPrice;
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

  const intermediate = Array.from(consolidationMap.values()).map((item) => {
    const averageBuyPrice = item.quantity > 0 ? item.totalCostBasis / item.quantity : 0;
    const marketValue = item.quantity * item.currentPrice;
    const sourceBroker =
      item.sourceBrokers.size === 1 ? Array.from(item.sourceBrokers)[0]! : 'GENERIC';
    return { item, averageBuyPrice, marketValue, sourceBroker };
  });

  const mergedTotalMarketValue = intermediate.reduce((sum, h) => sum + h.marketValue, 0);

  const scale = 10_000;
  const rawWeights: number[] = [];
  let weightSum = 0;
  let maxWeightIndex = 0;
  let maxWeightVal = -1;

  for (let i = 0; i < intermediate.length; i++) {
    const h = intermediate[i]!;
    const rawW = mergedTotalMarketValue > 0 ? (h.marketValue / mergedTotalMarketValue) * 100 : 0;
    const roundedW = Math.round(rawW * scale) / scale;
    rawWeights.push(roundedW);
    weightSum += roundedW;
    if (h.marketValue > maxWeightVal) {
      maxWeightVal = h.marketValue;
      maxWeightIndex = i;
    }
  }

  const residual = Math.round((100.0 - weightSum) * scale) / scale;
  if (residual !== 0 && intermediate.length > 0) {
    rawWeights[maxWeightIndex] =
      Math.round((rawWeights[maxWeightIndex]! + residual) * scale) / scale;
  }

  return intermediate.map((entry, i) => {
    const base = entry.item;
    const weight = rawWeights[i]!;
    const averageBuyPrice = entry.averageBuyPrice;
    const marketValue = entry.marketValue;

    const lineageDigest = computeLineageHash(
      {
        symbol: base.symbol,
        companyId: base.companyId,
        quantity: base.quantity,
        averageBuyPrice,
        currentPrice: base.currentPrice,
        marketValue,
        weightPercentage: weight,
        priorDigests: base.lineageDigests,
        identityStatus: base.identityStatus,
        resolutionDisposition: base.resolutionDisposition,
      },
      {
        sourceClassification: 'REAL',
        asOf: savedAt,
        dataVersion: PORTFOLIO_LINEAGE_DATA_VERSION,
      }
    );

    return {
      symbol: base.symbol,
      companyId: base.companyId,
      isin: base.isin,
      exchange: base.exchange,
      quantity: base.quantity,
      averageBuyPrice,
      currentPrice: base.currentPrice,
      marketValue,
      weightPercentage: weight,
      active: true,
      sourceBroker: entry.sourceBroker as UserHoldingInput['sourceBroker'],
      lineageDigest,
      identityStatus: base.identityStatus,
      resolutionDisposition: base.resolutionDisposition,
    } satisfies UserHoldingInput;
  });
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
