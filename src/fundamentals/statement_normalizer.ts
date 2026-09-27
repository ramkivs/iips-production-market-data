/**
 * Institutional Investment Platform System (IIPS)
 * Financial Statement Normalizer & Fiscal Calendar Engine (P09 / D03)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W2-AUTH-2026-01
 */

import {
  StandardizedFinancialStatement,
  StatementScope,
  FiscalQuarter,
  FiscalPeriodType,
} from './types.js';
import { normalizeFinancialAmount, FinancialUnit } from '../normalization/unit_normalizer.js';
import { normalizeToUtcIso } from '../normalization/time_normalizer.js';
import { CurrencyNormalizer } from '../normalization/currency_normalizer.js';

export interface RawFinancialStatementInput {
  statementId: string;
  companyId: string;
  scope?: StatementScope; // Default CONSOLIDATED
  fiscalYear: number;
  quarter?: FiscalQuarter;
  periodType: FiscalPeriodType;
  periodStart: string;
  periodEnd: string;
  filingDate: string;
  restatementIndex?: number;
  rawCurrency?: string;
  unitMultiplier?: FinancialUnit;
  isAudited?: boolean;
  sourceFilingType?: 'MCA_XBRL' | 'EXCHANGE_DISCLOSURE' | 'ANNUAL_REPORT' | 'PRESS_RELEASE';
  incomeStatement?: {
    revenue: number;
    otherIncome?: number;
    operatingExpenses?: number;
    ebitda?: number;
    depreciationAndAmort?: number;
    ebit?: number;
    financeCosts?: number;
    pbt?: number;
    taxExpense?: number;
    pat?: number;
    epsBasic?: number;
    epsDiluted?: number;
    sharesOutstanding?: number;
  };
  balanceSheet?: {
    totalEquityShareCapital?: number;
    reservesAndSurplus?: number;
    netWorth?: number;
    totalDebt?: number;
    nonCurrentLiabilities?: number;
    currentLiabilities?: number;
    totalLiabilities?: number;
    propertyPlantEquipment?: number;
    intangibleAssets?: number;
    nonCurrentInvestments?: number;
    otherNonCurrentAssets?: number;
    cashAndEquivalents?: number;
    currentInvestments?: number;
    inventories?: number;
    tradeReceivables?: number;
    otherCurrentAssets?: number;
    totalAssets?: number;
  };
  cashFlow?: {
    cashFromOperatingActivities?: number;
    capitalExpenditure?: number;
    freeCashFlow?: number;
    cashFromInvestingActivities?: number;
    cashFromFinancingActivities?: number;
    netChangeInCash?: number;
  };
}

export class StatementNormalizer {
  private currencyNormalizer: CurrencyNormalizer;

  constructor(currencyNormalizer?: CurrencyNormalizer) {
    this.currencyNormalizer = currencyNormalizer || new CurrencyNormalizer();
  }

  /**
   * Normalizes a raw financial statement into the canonical, standardized schema.
   * Validates fiscal calendar alignment and balance sheet identities.
   */
  public normalize(input: RawFinancialStatementInput): StandardizedFinancialStatement {
    if (!input.companyId) {
      throw new Error('Normalization failed: companyId is required');
    }

    const scope: StatementScope = input.scope || 'CONSOLIDATED';
    const unitMultiplier: FinancialUnit = input.unitMultiplier || 'BASE_INR';
    const rawCurrency = input.rawCurrency || 'INR';
    const isAudited = input.isAudited ?? true;
    const sourceFilingType = input.sourceFilingType || 'EXCHANGE_DISCLOSURE';
    const restatementIndex = input.restatementIndex ?? 0;

    const periodStart = normalizeToUtcIso(input.periodStart);
    const periodEnd = normalizeToUtcIso(input.periodEnd);
    const filingDate = normalizeToUtcIso(input.filingDate);

    // Verify statutory calendar mapping
    this.validateFiscalDates(input.fiscalYear, input.quarter, input.periodType, periodStart, periodEnd, filingDate);

    // Normalize Income Statement
    let incomeStatement: StandardizedFinancialStatement['incomeStatement'] = undefined;
    if (input.incomeStatement) {
      const raw = input.incomeStatement;
      const revenue = this.scale(raw.revenue, unitMultiplier, rawCurrency);
      const otherIncome = this.scale(raw.otherIncome ?? 0, unitMultiplier, rawCurrency);
      const totalIncome = revenue + otherIncome;
      const operatingExpenses = this.scale(raw.operatingExpenses ?? 0, unitMultiplier, rawCurrency);
      const ebitda = this.scale(raw.ebitda ?? (revenue - operatingExpenses), unitMultiplier, rawCurrency);
      const depreciationAndAmort = this.scale(raw.depreciationAndAmort ?? 0, unitMultiplier, rawCurrency);
      const ebit = this.scale(raw.ebit ?? (ebitda - depreciationAndAmort), unitMultiplier, rawCurrency);
      const financeCosts = this.scale(raw.financeCosts ?? 0, unitMultiplier, rawCurrency);
      const pbt = this.scale(raw.pbt ?? (ebit - financeCosts + otherIncome), unitMultiplier, rawCurrency);
      const taxExpense = this.scale(raw.taxExpense ?? 0, unitMultiplier, rawCurrency);
      const pat = this.scale(raw.pat ?? (pbt - taxExpense), unitMultiplier, rawCurrency);
      const sharesOutstanding = raw.sharesOutstanding ?? 1;
      const epsBasic = raw.epsBasic ?? (sharesOutstanding > 0 ? pat / sharesOutstanding : 0);
      const epsDiluted = raw.epsDiluted ?? epsBasic;

      incomeStatement = {
        revenue,
        otherIncome,
        totalIncome,
        operatingExpenses,
        ebitda,
        depreciationAndAmort,
        ebit,
        financeCosts,
        pbt,
        taxExpense,
        pat,
        epsBasic: Math.round(epsBasic * 100) / 100,
        epsDiluted: Math.round(epsDiluted * 100) / 100,
        sharesOutstanding,
      };
    }

    // Normalize Balance Sheet
    let balanceSheet: StandardizedFinancialStatement['balanceSheet'] = undefined;
    if (input.balanceSheet) {
      const raw = input.balanceSheet;
      const totalEquityShareCapital = this.scale(raw.totalEquityShareCapital ?? 0, unitMultiplier, rawCurrency);
      const reservesAndSurplus = this.scale(raw.reservesAndSurplus ?? 0, unitMultiplier, rawCurrency);
      const netWorth = this.scale(raw.netWorth ?? (totalEquityShareCapital + reservesAndSurplus), unitMultiplier, rawCurrency);
      const totalDebt = this.scale(raw.totalDebt ?? 0, unitMultiplier, rawCurrency);
      const nonCurrentLiabilities = this.scale(raw.nonCurrentLiabilities ?? 0, unitMultiplier, rawCurrency);
      const currentLiabilities = this.scale(raw.currentLiabilities ?? 0, unitMultiplier, rawCurrency);
      const totalLiabilities = this.scale(raw.totalLiabilities ?? (totalDebt + nonCurrentLiabilities + currentLiabilities), unitMultiplier, rawCurrency);

      const propertyPlantEquipment = this.scale(raw.propertyPlantEquipment ?? 0, unitMultiplier, rawCurrency);
      const intangibleAssets = this.scale(raw.intangibleAssets ?? 0, unitMultiplier, rawCurrency);
      const nonCurrentInvestments = this.scale(raw.nonCurrentInvestments ?? 0, unitMultiplier, rawCurrency);
      const otherNonCurrentAssets = this.scale(raw.otherNonCurrentAssets ?? 0, unitMultiplier, rawCurrency);
      const cashAndEquivalents = this.scale(raw.cashAndEquivalents ?? 0, unitMultiplier, rawCurrency);
      const currentInvestments = this.scale(raw.currentInvestments ?? 0, unitMultiplier, rawCurrency);
      const inventories = this.scale(raw.inventories ?? 0, unitMultiplier, rawCurrency);
      const tradeReceivables = this.scale(raw.tradeReceivables ?? 0, unitMultiplier, rawCurrency);
      const otherCurrentAssets = this.scale(raw.otherCurrentAssets ?? 0, unitMultiplier, rawCurrency);

      const totalAssets = this.scale(
        raw.totalAssets ??
          (propertyPlantEquipment +
            intangibleAssets +
            nonCurrentInvestments +
            otherNonCurrentAssets +
            cashAndEquivalents +
            currentInvestments +
            inventories +
            tradeReceivables +
            otherCurrentAssets),
        unitMultiplier,
        rawCurrency
      );

      // Validate Accounting Balance Sheet Identity: Assets = Liabilities + Net Worth
      this.validateBalanceSheetEquation(totalAssets, totalLiabilities, netWorth);

      balanceSheet = {
        totalEquityShareCapital,
        reservesAndSurplus,
        netWorth,
        totalDebt,
        nonCurrentLiabilities,
        currentLiabilities,
        totalLiabilities,
        propertyPlantEquipment,
        intangibleAssets,
        nonCurrentInvestments,
        otherNonCurrentAssets,
        cashAndEquivalents,
        currentInvestments,
        inventories,
        tradeReceivables,
        otherCurrentAssets,
        totalAssets,
      };
    }

    // Normalize Cash Flow
    let cashFlow: StandardizedFinancialStatement['cashFlow'] = undefined;
    if (input.cashFlow) {
      const raw = input.cashFlow;
      const cashFromOperatingActivities = this.scale(raw.cashFromOperatingActivities ?? 0, unitMultiplier, rawCurrency);
      const capitalExpenditure = this.scale(raw.capitalExpenditure ?? 0, unitMultiplier, rawCurrency);
      const freeCashFlow = this.scale(
        raw.freeCashFlow ?? (cashFromOperatingActivities - Math.abs(capitalExpenditure)),
        unitMultiplier,
        rawCurrency
      );
      const cashFromInvestingActivities = this.scale(raw.cashFromInvestingActivities ?? 0, unitMultiplier, rawCurrency);
      const cashFromFinancingActivities = this.scale(raw.cashFromFinancingActivities ?? 0, unitMultiplier, rawCurrency);
      const netChangeInCash = this.scale(
        raw.netChangeInCash ?? (cashFromOperatingActivities + cashFromInvestingActivities + cashFromFinancingActivities),
        unitMultiplier,
        rawCurrency
      );

      cashFlow = {
        cashFromOperatingActivities,
        capitalExpenditure,
        freeCashFlow,
        cashFromInvestingActivities,
        cashFromFinancingActivities,
        netChangeInCash,
      };
    }

    return {
      statementId: input.statementId,
      companyId: input.companyId,
      scope,
      fiscalYear: input.fiscalYear,
      quarter: input.quarter,
      periodType: input.periodType,
      periodStart,
      periodEnd,
      filingDate,
      restatementIndex,
      rawCurrency,
      currency: 'INR',
      isAudited,
      sourceFilingType,
      incomeStatement,
      balanceSheet,
      ...(cashFlow === undefined ? {} : { cashFlow }),
      qualityState: 'GOOD',
    };
  }

  private scale(amount: number, unit: FinancialUnit, rawCurrency: string): number {
    const inBaseUnits = normalizeFinancialAmount(amount, unit);
    if (rawCurrency === 'USD') {
      return this.currencyNormalizer.convertToBaseCurrency(inBaseUnits, 'USD');
    }
    return inBaseUnits;
  }

  private validateFiscalDates(
    fiscalYear: number,
    quarter: FiscalQuarter | undefined,
    periodType: FiscalPeriodType,
    periodStart: string,
    periodEnd: string,
    filingDate: string
  ): void {
    const startMs = Date.parse(periodStart);
    const endMs = Date.parse(periodEnd);
    const filingMs = Date.parse(filingDate);

    if (startMs >= endMs) {
      throw new Error(`Period start (${periodStart}) must be strictly before period end (${periodEnd})`);
    }

    if (filingMs < endMs) {
      throw new Error(`Filing date (${filingDate}) cannot precede period end date (${periodEnd})`);
    }

    // Strict distinction: Q4 is a 3-month quarterly statement, whereas ANNUAL is a 12-month fiscal statement
    const durationDays = (endMs - startMs) / (1000 * 60 * 60 * 24);
    if (periodType === 'ANNUAL') {
      if (durationDays < 350 || durationDays > 375) {
        throw new Error(`ANNUAL statement must cover ~12 months (got ${Math.round(durationDays)} days)`);
      }
    } else if (periodType === 'QUARTERLY') {
      if (durationDays < 80 || durationDays > 105) {
        throw new Error(`QUARTERLY statement must cover ~3 months (got ${Math.round(durationDays)} days)`);
      }
    }
  }

  private validateBalanceSheetEquation(assets: number, liabilities: number, netWorth: number): void {
    const sum = liabilities + netWorth;
    const diff = Math.abs(assets - sum);
    // 0.5% material conflict threshold or 1,000 INR rounding tolerance
    const tolerance = Math.max(1000, assets * 0.005);
    if (diff > tolerance) {
      throw new Error(
        `Balance Sheet Identity Violation: Assets (${assets}) != Liabilities (${liabilities}) + Net Worth (${netWorth}) by ${diff}`
      );
    }
  }
}
