/**
 * Institutional Investment Platform System (IIPS)
 * Broker Holdings Mapper & Normalization Engine (BI-03)
 *
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-03-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { computeLineageHash } from '../../../../../src/contracts/provenance.js';
import { IdentityAmbiguityError } from '../../../../../src/identity/quarantine.js';
import {
  FinappBrokerParseResult,
  FinappHolding,
  FinappBrokerType,
  UserHoldingInput,
  BrokerMappingOptions,
  BrokerMappingResult,
} from './types.js';

interface RawHoldingGroup {
  primaryKey: string;
  symbol: string;
  isin?: string;
  exchange?: 'NSE' | 'BSE';
  items: FinappHolding[];
}

/**
 * Maps raw/parsed broker holding outputs to canonical IIPS UserHoldingInput records.
 *
 * Governance & Transformation Rules:
 * 1. Accepts FINAPP parse results or raw FINAPP holding arrays.
 * 2. Excludes inactive, zero/negative-quantity, or non-positive value holdings.
 * 3. Aggregates duplicate securities with volume-weighted average buy price calculation.
 * 4. Resolves security identity via P04/P12 Security Master with strict fail-closed option:
 *    - For detailed formats with ISIN (e.g. DHAN_DETAILED_HOLDINGS_V1): queries primary ISIN.
 *    - For summary formats without ISIN/Exchange (e.g. DHAN_WEB_UI_SUMMARY_V1): queries NSE_SYMBOL, then BSE_SYMBOL.
 *    - Fails closed on unmapped identity or ambiguous collision (never fabricates or guesses identity).
 * 5. Derives portfolio market values and normalizes weights to sum to exactly 100.0%.
 * 6. Attaches cryptographic lineage digests for tamper-proof auditability.
 */
export function mapBrokerOutputToUserHoldings(
  input: FinappBrokerParseResult | FinappHolding[],
  options?: BrokerMappingOptions
): BrokerMappingResult {
  const asOf = options?.asOf || new Date().toISOString();
  const failOnUnmapped = options?.failOnUnmappedIdentity ?? true;
  const minThreshold = options?.minHoldingValueThreshold ?? 0;
  const precision = options?.targetWeightPrecision ?? 4;

  const warnings: string[] = [];
  const errors: string[] = [];

  let rawHoldings: FinappHolding[] = [];
  let sourceBroker: FinappBrokerType = 'GENERIC';

  if (Array.isArray(input)) {
    rawHoldings = input;
  } else if (input && typeof input === 'object') {
    rawHoldings = input.holdings || [];
    sourceBroker = input.brokerType || 'GENERIC';
    if (input.warnings && input.warnings.length > 0) {
      warnings.push(...input.warnings);
    }
    if (input.errors && input.errors.length > 0) {
      errors.push(...input.errors);
    }
  }

  const totalHoldingsCount = rawHoldings.length;
  let excludedCount = 0;
  let aggregatedCount = 0;

  // Step 1: Filter and group raw holdings
  const groupedMap = new Map<string, RawHoldingGroup>();

  for (let i = 0; i < rawHoldings.length; i++) {
    const raw = rawHoldings[i];

    // Validate symbol
    const symbol = (raw.symbol || '').trim().toUpperCase();
    const isin = raw.isin ? raw.isin.trim().toUpperCase() : undefined;

    if (!symbol && !isin) {
      excludedCount++;
      warnings.push(`Row ${i}: Excluded due to missing both symbol and ISIN.`);
      continue;
    }

    // Validate quantity
    const qty = Number(raw.quantity);
    if (isNaN(qty) || qty <= 0) {
      excludedCount++;
      warnings.push(`Row ${i} (${symbol || isin}): Excluded due to non-positive quantity (${raw.quantity}).`);
      continue;
    }

    // Validate price & market value
    const avgPrice = Number(raw.averagePrice);
    const currPrice = raw.currentPrice !== undefined && !isNaN(Number(raw.currentPrice)) && Number(raw.currentPrice) > 0
      ? Number(raw.currentPrice)
      : (raw.closePrice !== undefined && !isNaN(Number(raw.closePrice)) && Number(raw.closePrice) > 0
          ? Number(raw.closePrice)
          : (avgPrice > 0 ? avgPrice : 0));

    if (currPrice <= 0) {
      excludedCount++;
      warnings.push(`Row ${i} (${symbol || isin}): Excluded due to missing/non-positive current price and average price.`);
      continue;
    }

    const calculatedMktVal = qty * currPrice;
    if (calculatedMktVal <= minThreshold) {
      excludedCount++;
      warnings.push(`Row ${i} (${symbol || isin}): Excluded due to market value (${calculatedMktVal}) <= threshold (${minThreshold}).`);
      continue;
    }

    // Determine grouping key (prefer ISIN if present, fallback to uppercase symbol)
    const primaryKey = isin ? `ISIN:${isin}` : `SYM:${symbol}`;

    let group = groupedMap.get(primaryKey);
    if (!group) {
      let exchange: 'NSE' | 'BSE' | undefined = undefined;
      if (raw.exchange === 'NSE' || raw.exchange === 'BSE') {
        exchange = raw.exchange;
      }
      group = {
        primaryKey,
        symbol: symbol || isin || 'UNKNOWN',
        isin,
        exchange,
        items: [],
      };
      groupedMap.set(primaryKey, group);
    }

    group.items.push(raw);
  }

  // Step 2: Aggregate duplicates and resolve identity
  const intermediateHoldings: Array<{
    symbol: string;
    companyId: string;
    isin?: string;
    exchange?: 'NSE' | 'BSE';
    quantity: number;
    averageBuyPrice: number;
    currentPrice: number;
    marketValue: number;
    identityStatus?: 'RESOLVED' | 'UNRESOLVED';
    resolutionDisposition?: 'CANONICAL_P04' | 'NON_PRODUCTION_OPERATOR_BYPASS';
  }> = [];

  const isProduction = options?.executionEnvironment === 'PRODUCTION';
  const isBypassAuthorized = !isProduction && options?.allowNonProductionBypass === true;

  for (const [key, group] of groupedMap.entries()) {
    if (group.items.length > 1) {
      aggregatedCount += (group.items.length - 1);
    }

    let totalQty = 0;
    let totalCostBasis = 0;
    let latestCurrentPrice = 0;

    for (const item of group.items) {
      const q = Number(item.quantity);
      const buyPrice = Number(item.averagePrice) > 0 ? Number(item.averagePrice) : 0;
      const cPrice = item.currentPrice !== undefined && Number(item.currentPrice) > 0
        ? Number(item.currentPrice)
        : (item.closePrice !== undefined && Number(item.closePrice) > 0 ? Number(item.closePrice) : buyPrice);

      totalQty += q;
      totalCostBasis += (q * buyPrice);
      if (cPrice > 0) {
        latestCurrentPrice = cPrice;
      }
    }

    const weightedAvgBuyPrice = totalQty > 0 ? (totalCostBasis / totalQty) : 0;
    const finalCurrentPrice = latestCurrentPrice > 0 ? latestCurrentPrice : weightedAvgBuyPrice;
    const marketValue = totalQty * finalCurrentPrice;

    // Resolve Identity via SecurityMaster if provided
    let resolvedCompanyId = group.symbol;
    let identityStatus: 'RESOLVED' | 'UNRESOLVED' = 'RESOLVED';
    let resolutionDisposition: 'CANONICAL_P04' | 'NON_PRODUCTION_OPERATOR_BYPASS' = 'CANONICAL_P04';

    if (options?.securityMaster) {
      try {
        if (group.isin) {
          resolvedCompanyId = options.securityMaster.resolveCompanyId({
            identifierType: 'ISIN',
            identifierValue: group.isin,
            asOf,
          });
        } else {
          try {
            resolvedCompanyId = options.securityMaster.resolveCompanyId({
              identifierType: 'NSE_SYMBOL',
              identifierValue: group.symbol,
              asOf,
            });
          } catch (nseErr) {
            resolvedCompanyId = options.securityMaster.resolveCompanyId({
              identifierType: 'BSE_SYMBOL',
              identifierValue: group.symbol,
              asOf,
            });
          }
        }
        identityStatus = 'RESOLVED';
        resolutionDisposition = 'CANONICAL_P04';
      } catch (err: unknown) {
        if (isBypassAuthorized) {
          // Explicitly authorized non-production single-operator bypass (Block 3M-A)
          identityStatus = 'UNRESOLVED';
          resolutionDisposition = 'NON_PRODUCTION_OPERATOR_BYPASS';
          resolvedCompanyId = ''; // Strictly DO NOT fabricate companyId!
          warnings.push(
            `Non-production operator bypass applied for '${group.symbol}': retained as UNRESOLVED holding without fabricated companyId.`
          );
        } else if (failOnUnmapped) {
          if (err instanceof IdentityAmbiguityError) {
            throw err;
          }
          throw new Error(`Security Master identity resolution failed for '${group.symbol}': ${String(err)}`);
        } else {
          warnings.push(`Identity resolution unmapped for '${group.symbol}'; preserved raw symbol.`);
          resolvedCompanyId = group.symbol;
        }
      }
    }

    intermediateHoldings.push({
      symbol: group.symbol,
      companyId: resolvedCompanyId,
      isin: group.isin,
      exchange: group.exchange,
      quantity: totalQty,
      averageBuyPrice: weightedAvgBuyPrice,
      currentPrice: finalCurrentPrice,
      marketValue,
      identityStatus,
      resolutionDisposition,
    });
  }

  // Step 3: Compute portfolio total market value and weights
  const totalPortfolioMarketValue = intermediateHoldings.reduce((sum, h) => sum + h.marketValue, 0);

  const userHoldings: UserHoldingInput[] = [];

  if (totalPortfolioMarketValue <= 0 || intermediateHoldings.length === 0) {
    const emptyProvenanceDigest = computeLineageHash(
      { userHoldings: [], totalPortfolioMarketValue: 0, sourceBroker },
      { sourceClassification: 'REAL', asOf, dataVersion: 'v1.0.0-bi03' }
    );

    return {
      success: errors.length === 0,
      userHoldings: [],
      totalMarketValue: 0,
      totalHoldingsCount,
      validHoldingsCount: 0,
      excludedHoldingsCount: excludedCount,
      aggregatedHoldingsCount: aggregatedCount,
      weightSumPercentage: 0.0,
      warnings,
      errors,
      provenance: {
        sourceBroker,
        mappedAt: asOf,
        lineageHash: emptyProvenanceDigest,
        dataVersion: 'v1.0.0-bi03',
      },
    };
  }

  // Calculate raw weights
  const scale = Math.pow(10, precision);
  let weightSum = 0;
  let maxWeightIndex = 0;
  let maxWeightVal = -1;

  const rawWeights: number[] = [];

  for (let i = 0; i < intermediateHoldings.length; i++) {
    const h = intermediateHoldings[i];
    const rawWeight = (h.marketValue / totalPortfolioMarketValue) * 100;
    const roundedWeight = Math.round(rawWeight * scale) / scale;
    rawWeights.push(roundedWeight);
    weightSum += roundedWeight;

    if (h.marketValue > maxWeightVal) {
      maxWeightVal = h.marketValue;
      maxWeightIndex = i;
    }
  }

  // Normalize weight sum to exactly 100.0% by adjusting largest holding if rounding residual exists
  const residual = Math.round((100.0 - weightSum) * scale) / scale;
  if (residual !== 0 && intermediateHoldings.length > 0) {
    rawWeights[maxWeightIndex] = Math.round((rawWeights[maxWeightIndex] + residual) * scale) / scale;
  }

  // Re-verify final weight sum
  const finalWeightSum = Math.round(rawWeights.reduce((s, w) => s + w, 0) * scale) / scale;

  // Build final UserHoldingInput records with lineage digests
  for (let i = 0; i < intermediateHoldings.length; i++) {
    const base = intermediateHoldings[i];
    const weight = rawWeights[i];

    const holdingPayload = {
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
      sourceBroker,
      identityStatus: base.identityStatus,
      resolutionDisposition: base.resolutionDisposition,
    };

    const lineageDigest = computeLineageHash(holdingPayload, {
      sourceClassification: 'REAL',
      asOf,
      dataVersion: 'v1.0.0-bi03',
    });

    userHoldings.push({
      ...holdingPayload,
      lineageDigest,
    });
  }

  // Compute overall portfolio lineage hash
  const portfolioLineageHash = computeLineageHash(
    {
      userHoldings: userHoldings.map((u) => ({
        companyId: u.companyId,
        quantity: u.quantity,
        weightPercentage: u.weightPercentage,
        lineageDigest: u.lineageDigest,
      })),
      totalPortfolioMarketValue,
      sourceBroker,
    },
    { sourceClassification: 'REAL', asOf, dataVersion: 'v1.0.0-bi03' }
  );

  return {
    success: errors.length === 0,
    userHoldings,
    totalMarketValue: totalPortfolioMarketValue,
    totalHoldingsCount,
    validHoldingsCount: userHoldings.length,
    excludedHoldingsCount: excludedCount,
    aggregatedHoldingsCount: aggregatedCount,
    weightSumPercentage: finalWeightSum,
    warnings,
    errors,
    provenance: {
      sourceBroker,
      mappedAt: asOf,
      lineageHash: portfolioLineageHash,
      dataVersion: 'v1.0.0-bi03',
    },
  };
}
