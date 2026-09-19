/**
 * Institutional Investment Platform System (IIPS)
 * Fundamentals Domain Types & Constants (P09 / D03)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W2-AUTH-2026-01
 * Operating Mode: LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { QualityState } from '../contracts/types.js';

export type StatementScope = 'CONSOLIDATED' | 'STANDALONE';
export type FiscalQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type FiscalPeriodType = 'QUARTERLY' | 'ANNUAL' | 'TTM';

export interface StandardizedIncomeStatement {
  revenue: number;           // Topline Operating Revenue in base INR
  otherIncome: number;
  totalIncome: number;
  operatingExpenses: number;
  ebitda: number;            // Operating Profit before D&A
  depreciationAndAmort: number;
  ebit: number;              // Operating Profit
  financeCosts: number;      // Interest expense
  pbt: number;               // Profit Before Tax
  taxExpense: number;
  pat: number;               // Profit After Tax (Net Income)
  epsBasic: number;          // Unadjusted EPS
  epsDiluted: number;
  sharesOutstanding: number;
}

export interface StandardizedBalanceSheet {
  totalEquityShareCapital: number;
  reservesAndSurplus: number;
  netWorth: number;          // Total Shareholder Equity
  totalDebt: number;         // Long-term + Short-term Borrowings
  nonCurrentLiabilities: number;
  currentLiabilities: number;
  totalLiabilities: number;
  propertyPlantEquipment: number;
  intangibleAssets: number;
  nonCurrentInvestments: number;
  otherNonCurrentAssets: number;
  cashAndEquivalents: number;
  currentInvestments: number;
  inventories: number;
  tradeReceivables: number;
  otherCurrentAssets: number;
  totalAssets: number;
}

export interface StandardizedCashFlow {
  cashFromOperatingActivities: number;
  capitalExpenditure: number; // CapEx (usually negative or magnitude)
  freeCashFlow: number;       // Operating Cash Flow - CapEx
  cashFromInvestingActivities: number;
  cashFromFinancingActivities: number;
  netChangeInCash: number;
}

export interface StandardizedFinancialStatement {
  statementId: string;
  companyId: string;
  scope: StatementScope;
  fiscalYear: number;        // e.g. 2026 for FY 2025-26
  quarter?: FiscalQuarter;   // 'Q1' | 'Q2' | 'Q3' | 'Q4' or undefined for Annual
  periodType: FiscalPeriodType;
  periodStart: string;       // ISO-8601 UTC
  periodEnd: string;         // ISO-8601 UTC
  filingDate: string;        // ISO-8601 UTC
  restatementIndex: number;  // 0 = original, 1+ = restatements
  rawCurrency: string;       // Original filing currency (e.g. 'INR', 'USD')
  currency: 'INR';           // Standardized base currency
  isAudited: boolean;
  sourceFilingType: 'MCA_XBRL' | 'EXCHANGE_DISCLOSURE' | 'ANNUAL_REPORT' | 'PRESS_RELEASE';
  incomeStatement?: StandardizedIncomeStatement;
  balanceSheet?: StandardizedBalanceSheet;
  cashFlow?: StandardizedCashFlow;
  qualityState: QualityState;
}

export interface FinancialRatioMetrics {
  companyId: string;
  asOf: string;
  scope: StatementScope;
  peRatio: number | null;              // Price to Earnings
  pbRatio: number | null;              // Price to Book Value
  evToEbitda: number | null;           // Enterprise Value to EBITDA
  roe: number | null;                  // Return on Equity (PAT / NetWorth) %
  roce: number | null;                 // Return on Capital Employed (EBIT / Capital Employed) %
  debtToEquity: number | null;         // Total Debt / NetWorth
  operatingMargin: number | null;      // EBIT / Revenue %
  netProfitMargin: number | null;      // PAT / Revenue %
  splitAdjustedEps: number | null;     // EPS * P08 CA split factor
  qualityState: QualityState;
  calculationNotes: string[];
}
