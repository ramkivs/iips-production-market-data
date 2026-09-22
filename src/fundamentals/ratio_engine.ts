/**
 * Institutional Investment Platform System (IIPS)
 * Financial Ratio Engine & Valuation Calculator (P09 / D03)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W2-AUTH-2026-01
 */

import { StandardizedFinancialStatement, FinancialRatioMetrics } from './types.js';
import { MarketQuotePayload } from '../contracts/d01_quotes.js';
import { rollupQuality } from '../quality/quality_rollup.js';
import { QualityState } from '../contracts/types.js';

export interface RatioCalculationInput {
  companyId: string;
  asOf: string;
  marketQuote: MarketQuotePayload;
  statement: StandardizedFinancialStatement;
  cumulativeSplitFactor?: number; // From P08 corporate actions
  quoteQuality?: QualityState;
}

export class RatioEngine {
  /**
   * Computes standardized financial ratios with fail-safe zero/negative denominator handling
   * and worst-case quality floor propagation.
   */
  public computeRatios(input: RatioCalculationInput): FinancialRatioMetrics {
    const { companyId, asOf, marketQuote, statement, cumulativeSplitFactor = 1.0, quoteQuality = 'GOOD' } = input;
    const notes: string[] = [];

    const ltp = marketQuote.ltp;
    const is = statement.incomeStatement;
    const bs = statement.balanceSheet;

    const shares = is?.sharesOutstanding || (bs?.netWorth && ltp > 0 ? Math.round(bs.netWorth / ltp) : 1);
    const marketCap = ltp * shares;

    // 1. P/E Ratio: Market Price / EPS
    let peRatio: number | null = null;
    if (is && is.epsBasic > 0) {
      peRatio = Math.round((ltp / is.epsBasic) * 100) / 100;
    } else if (is && is.epsBasic <= 0) {
      peRatio = null;
      notes.push('P/E unavailable: Net profit / EPS is zero or negative');
    }

    // 2. P/B Ratio: Market Cap / Net Worth
    let pbRatio: number | null = null;
    if (bs && bs.netWorth > 0) {
      pbRatio = Math.round((marketCap / bs.netWorth) * 100) / 100;
    } else if (bs && bs.netWorth <= 0) {
      pbRatio = null;
      notes.push('P/B unavailable: Net worth is zero or negative (Eroded equity)');
    }

    // 3. EV/EBITDA Ratio: Enterprise Value / EBITDA
    // EV = Market Cap + Total Debt - Cash
    let evToEbitda: number | null = null;
    if (is && bs && is.ebitda > 0) {
      const enterpriseValue = marketCap + bs.totalDebt - bs.cashAndEquivalents;
      evToEbitda = Math.round((enterpriseValue / is.ebitda) * 100) / 100;
    } else if (is && is.ebitda <= 0) {
      evToEbitda = null;
      notes.push('EV/EBITDA unavailable: EBITDA is zero or negative');
    }

    // 4. ROE (%): (PAT / Net Worth) * 100
    let roe: number | null = null;
    if (is && bs && bs.netWorth > 0) {
      roe = Math.round(((is.pat / bs.netWorth) * 100) * 100) / 100;
    } else if (bs && bs.netWorth <= 0) {
      roe = null;
      notes.push('ROE unavailable: Net worth is zero or negative');
    }

    // 5. ROCE (%): EBIT / Capital Employed (Net Worth + Total Debt) * 100
    let roce: number | null = null;
    if (is && bs) {
      const capitalEmployed = bs.netWorth + bs.totalDebt;
      if (capitalEmployed > 0) {
        roce = Math.round(((is.ebit / capitalEmployed) * 100) * 100) / 100;
      } else {
        roce = null;
        notes.push('ROCE unavailable: Capital employed is zero or negative');
      }
    }

    // 6. Debt to Equity (D/E): Total Debt / Net Worth
    let debtToEquity: number | null = null;
    if (bs && bs.netWorth > 0) {
      debtToEquity = Math.round((bs.totalDebt / bs.netWorth) * 100) / 100;
    } else if (bs && bs.netWorth <= 0) {
      debtToEquity = null;
      notes.push('D/E unavailable: Net worth is zero or negative');
    }

    // 7. Operating Margin (%): (EBIT / Revenue) * 100
    let operatingMargin: number | null = null;
    if (is && is.revenue > 0) {
      operatingMargin = Math.round(((is.ebit / is.revenue) * 100) * 100) / 100;
    }

    // 8. Net Profit Margin (%): (PAT / Revenue) * 100
    let netProfitMargin: number | null = null;
    if (is && is.revenue > 0) {
      netProfitMargin = Math.round(((is.pat / is.revenue) * 100) * 100) / 100;
    }

    // 9. Split-Adjusted EPS: EPS * cumulative CA split factor
    let splitAdjustedEps: number | null = null;
    if (is && is.epsBasic !== undefined) {
      splitAdjustedEps = Math.round(is.epsBasic * cumulativeSplitFactor * 100) / 100;
    }

    // Worst-case quality floor
    const qualityState = rollupQuality([quoteQuality, statement.qualityState]);

    return {
      companyId,
      asOf,
      scope: statement.scope,
      peRatio,
      pbRatio,
      evToEbitda,
      roe,
      roce,
      debtToEquity,
      operatingMargin,
      netProfitMargin,
      splitAdjustedEps,
      qualityState,
      calculationNotes: notes,
    };
  }
}
