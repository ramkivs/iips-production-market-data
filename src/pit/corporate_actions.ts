/**
 * Institutional Investment Platform System (IIPS)
 * Corporate Actions Adjustment Engine (P08 / D04)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { CorporateActionPayload } from '../contracts/d04_corporate_actions.js';

/**
 * Calculates the adjustment factor for a stock split.
 * E.g. A 1:5 split (1 old share becomes 5 new shares) -> factor = 1 / 5 = 0.2
 */
export function calculateSplitFactor(ratioNumerator: number, ratioDenominator: number): number {
  if (ratioNumerator <= 0 || ratioDenominator <= 0) {
    throw new Error('Split ratio components must be strictly positive');
  }
  return ratioNumerator / ratioDenominator;
}

/**
 * Calculates the adjustment factor for a bonus issue.
 * E.g. A 1:1 bonus (1 bonus share for every 1 existing share) -> factor = 1 / (1 + 1) = 0.5
 */
export function calculateBonusFactor(bonusShares: number, existingShares: number): number {
  if (bonusShares <= 0 || existingShares <= 0) {
    throw new Error('Bonus ratio components must be strictly positive');
  }
  return existingShares / (existingShares + bonusShares);
}

/**
 * Calculates the adjustment factor for a cash dividend.
 * Factor = (PriceBeforeEx - Dividend) / PriceBeforeEx
 */
export function calculateDividendFactor(cumDividendPrice: number, dividendAmount: number): number {
  if (cumDividendPrice <= 0 || dividendAmount <= 0) {
    throw new Error('Price and dividend amount must be strictly positive');
  }
  if (dividendAmount >= cumDividendPrice) {
    throw new Error('Dividend amount cannot exceed or equal cum-dividend price');
  }
  return (cumDividendPrice - dividendAmount) / cumDividendPrice;
}

/**
 * Adjusts an unadjusted historical price using the cumulative adjustment factor.
 * Adjusted Price = Unadjusted Price * Cumulative Factor.
 */
export function adjustHistoricalPrice(unadjustedPrice: number, cumulativeFactor: number): number {
  return Math.round(unadjustedPrice * cumulativeFactor * 100) / 100;
}

/**
 * Adjusts historical volume using the cumulative adjustment factor.
 * Adjusted Volume = Unadjusted Volume / Cumulative Factor.
 */
export function adjustHistoricalVolume(unadjustedVolume: number, cumulativeFactor: number): number {
  if (cumulativeFactor <= 0) throw new Error('Cumulative factor must be positive');
  return Math.round(unadjustedVolume / cumulativeFactor);
}

/**
 * Computes the cumulative adjustment factor across an array of corporate actions
 * ordered chronologically up to a given query date.
 */
export function computeCumulativeFactor(actions: CorporateActionPayload[], asOfDate: string): number {
  const asOfMs = Date.parse(asOfDate);
  let cumulative = 1.0;

  for (const act of actions) {
    const exMs = Date.parse(act.exDate);
    if (exMs <= asOfMs && act.status === 'EFFECTIVE') {
      cumulative *= act.adjustmentFactor;
    }
  }

  return Math.round(cumulative * 1_000_000) / 1_000_000;
}
