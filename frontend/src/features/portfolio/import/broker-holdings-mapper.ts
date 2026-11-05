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
import type { IdentityQuarantineRecord } from '../../../../../src/identity/quarantine.js';
import {
  assessBrokerRowIdentity,
  summariseBrokerIdentity,
  BrokerIdentityResolutionError,
} from './broker-identity-assessment.js';
import type { BrokerIdentityAssessment } from './broker-identity-assessment.js';
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
  /** 1-based native row indices aggregated into this group (identity evidence is per row). */
  rowIndices: number[];
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
 *    - Records a per-native-row identity assessment (identifier class, every lookup attempted in
 *      order, each outcome, the quarantine record and the exact missing evidence) for ALL rows,
 *      including rows aggregated into the same group and rows excluded by row validation. The
 *      whole-import P04 refusal is raised once, after every row has been assessed, carrying the
 *      complete evidence (`BrokerIdentityResolutionError`); no row's outcome is lost behind the
 *      first failure, and the surfaced reason is never a masked speculative fallback.
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
  // Per-native-row identity evidence. Populated for every row, including excluded rows.
  const assessments: BrokerIdentityAssessment[] = [];
  const assessExcluded = (rowIndex: number, raw: FinappHolding, reason: string): void => {
    assessments.push(assessBrokerRowIdentity({
      rowIndex,
      symbol: (raw.symbol ?? '').toString(),
      isin: raw.isin ? String(raw.isin) : undefined,
      exchange: raw.exchange === 'NSE' || raw.exchange === 'BSE' ? raw.exchange : undefined,
      asOf,
      excludedReason: reason,
    }));
  };

  for (let i = 0; i < rawHoldings.length; i++) {
    const raw = rawHoldings[i];

    // Validate symbol
    const symbol = (raw.symbol || '').trim().toUpperCase();
    const isin = raw.isin ? raw.isin.trim().toUpperCase() : undefined;

    if (!symbol && !isin) {
      excludedCount++;
      warnings.push(`Row ${i}: Excluded due to missing both symbol and ISIN.`);
      assessExcluded(i + 1, raw, 'The broker row supplied neither a symbol/name nor an ISIN.');
      continue;
    }

    // Validate quantity
    const qty = Number(raw.quantity);
    if (isNaN(qty) || qty <= 0) {
      excludedCount++;
      warnings.push(`Row ${i} (${symbol || isin}): Excluded due to non-positive quantity (${raw.quantity}).`);
      assessExcluded(i + 1, raw, `Non-positive or non-numeric quantity (${raw.quantity}).`);
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
      assessExcluded(i + 1, raw, 'Missing or non-positive current price and average price.');
      continue;
    }

    const calculatedMktVal = qty * currPrice;
    if (calculatedMktVal <= minThreshold) {
      excludedCount++;
      warnings.push(`Row ${i} (${symbol || isin}): Excluded due to market value (${calculatedMktVal}) <= threshold (${minThreshold}).`);
      assessExcluded(i + 1, raw, `Market value ${calculatedMktVal} is at or below the configured threshold ${minThreshold}.`);
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
        rowIndices: [],
      };
      groupedMap.set(primaryKey, group);
    }

    group.items.push(raw);
    group.rowIndices.push(i + 1);
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

  // Whole-import P04 refusal evidence, captured without aborting per-row assessment.
  let firstRefusal: { record: IdentityQuarantineRecord; quarantineRecordId?: string } | undefined;
  let firstRefusalRowIndex: number | undefined;

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

    // Resolve Identity via the governed SecurityMaster, recording the complete lookup evidence
    // for EVERY row of this group. The whole-import refusal is raised once, after every group has
    // been assessed, so one unmapped security can no longer hide the other rows' outcomes.
    let resolvedCompanyId = group.symbol;
    let identityStatus: 'RESOLVED' | 'UNRESOLVED' = 'RESOLVED';
    let resolutionDisposition: 'CANONICAL_P04' | 'NON_PRODUCTION_OPERATOR_BYPASS' = 'CANONICAL_P04';

    const groupAssessment = assessBrokerRowIdentity({
      rowIndex: group.rowIndices[0] ?? 0,
      symbol: group.symbol,
      isin: group.isin,
      exchange: group.exchange,
      master: options?.securityMaster,
      asOf,
    });

    if (groupAssessment.status === 'RESOLVED' && groupAssessment.companyId) {
      resolvedCompanyId = groupAssessment.companyId;
      identityStatus = 'RESOLVED';
      resolutionDisposition = 'CANONICAL_P04';
    } else if (!options?.securityMaster) {
      // Legacy permissive path: no master supplied. Identity was NOT evaluated; the raw symbol is
      // preserved so no identity is claimed (the assessment records NOT_EVALUATED).
      resolutionDisposition = 'CANONICAL_P04';
    } else if (isBypassAuthorized) {
      // Explicitly authorized non-production single-operator bypass (Block 3M-A)
      identityStatus = 'UNRESOLVED';
      resolutionDisposition = 'NON_PRODUCTION_OPERATOR_BYPASS';
      resolvedCompanyId = ''; // Strictly DO NOT fabricate companyId!
      warnings.push(
        `Non-production operator bypass applied for '${group.symbol}': retained as UNRESOLVED holding without fabricated companyId.`
      );
    } else if (failOnUnmapped) {
      // Record the refusal and continue assessing the remaining rows; the typed refusal is thrown
      // after the loop with the complete evidence attached.
      identityStatus = 'UNRESOLVED';
      resolvedCompanyId = '';
      if (!firstRefusal) {
        // The refusal surfaces the LAST authoritative lookup for the first refused row, exactly as
        // the pre-existing pipeline did (e.g. `BSE_SYMBOL:...` for an unscoped name), while the
        // complete ordered lookup evidence is retained per row on the assessment vector.
        const lastQuarantine =
          groupAssessment.quarantineRecords[groupAssessment.quarantineRecords.length - 1];
        firstRefusal = {
          record:
            lastQuarantine ??
            groupAssessment.quarantineRecord ??
            ({
              quarantineId: `ident-quar-${group.symbol}-${asOf}`,
              identifierType: groupAssessment.lookups[0]?.identifierType ?? 'UNKNOWN',
              rawIdentifier: group.symbol,
              reason: groupAssessment.refusalCode === 'AMBIGUOUS_COLLISION' ? 'AMBIGUOUS_COLLISION' : 'UNMAPPED_IDENTIFIER',
              asOf,
              receivedAt: new Date().toISOString(),
              details:
                groupAssessment.missingEvidence ??
                `No governed canonical identity for '${group.symbol}' at asOf ${asOf}.`,
            } satisfies IdentityQuarantineRecord),
          quarantineRecordId: lastQuarantine?.quarantineId,
        };
      }
    } else {
      warnings.push(`Identity resolution unmapped for '${group.symbol}'; preserved raw symbol.`);
      resolutionDisposition = 'CANONICAL_P04';
    }

    // One assessment per native row in this group (aggregated rows keep their own row index).
    // The row status is the group's evidence, downgraded honestly whenever the group is not a
    // canonical P04 resolution (bypass, permission-less permissive path, no master supplied).
    const assessmentStatus =
      groupAssessment.status === 'RESOLVED'
        ? (identityStatus === 'RESOLVED' ? ('RESOLVED' as const) : ('UNRESOLVED' as const))
        : groupAssessment.status;
    for (const rowIndex of group.rowIndices) {
      const rowAssessment: BrokerIdentityAssessment = {
        ...groupAssessment,
        rowIndex,
        status: assessmentStatus,
        ...(assessmentStatus === 'RESOLVED' ? { companyId: resolvedCompanyId } : {}),
      };
      assessments.push(rowAssessment);
    }
    if (identityStatus === 'UNRESOLVED' && !firstRefusalRowIndex) {
      firstRefusalRowIndex = group.rowIndices[0];
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

  // P04 whole-import refusal — raised ONCE, after every native row has been assessed, with the
  // complete per-row evidence attached. The quarantine record is the last authoritative lookup for
  // the first refused row (the same record the pre-existing refusal surfaced), so the refusal text
  // a consumer already depends on is preserved while the masked-evidence defect is removed.
  if (firstRefusal && failOnUnmapped && !isBypassAuthorized) {
    throw new BrokerIdentityResolutionError(
      firstRefusal.record,
      assessments,
      assessments
        .filter((a) => a.status === 'UNRESOLVED' || a.status === 'AMBIGUOUS')
        .map((a) => a.rowIndex),
    );
  }

  // Step 3: Compute portfolio total market value and weights
  const totalPortfolioMarketValue = intermediateHoldings.reduce((sum, h) => sum + h.marketValue, 0);

  const userHoldings: UserHoldingInput[] = [];

  if (totalPortfolioMarketValue <= 0 || intermediateHoldings.length === 0) {
    const emptyProvenanceDigest = computeLineageHash(
      { userHoldings: [], totalPortfolioMarketValue: 0, sourceBroker },
      { sourceClassification: 'UNCLASSIFIED', asOf, dataVersion: 'v1.0.0-bi03' }
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
      identityAssessments: assessments,
      identitySummary: summariseBrokerIdentity(assessments),
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
      sourceClassification: 'UNCLASSIFIED',
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
    { sourceClassification: 'UNCLASSIFIED', asOf, dataVersion: 'v1.0.0-bi03' }
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
    identityAssessments: assessments,
    identitySummary: summariseBrokerIdentity(assessments),
    provenance: {
      sourceBroker,
      mappedAt: asOf,
      lineageHash: portfolioLineageHash,
      dataVersion: 'v1.0.0-bi03',
    },
  };
}
