/**
 * Institutional Investment Platform System (IIPS)
 * Canonical Fundamentals Product Transport DTO (P12 / D03)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 */

import { ExecutiveProvenance } from './types.js';
import { QualityState } from '../contracts/types.js';
import {
  StatementScope,
  FiscalQuarter,
  FiscalPeriodType,
  FinancialRatioMetrics,
  StandardizedIncomeStatement,
  StandardizedBalanceSheet,
  StandardizedCashFlow,
} from '../fundamentals/types.js';
import { TTMFinancialStatement } from '../fundamentals/ttm_calculator.js';

export interface FundamentalsDTO {
  companyId: string;
  scope: StatementScope;
  fiscalYear: number;
  quarter?: FiscalQuarter;
  periodType: FiscalPeriodType;
  ratios: FinancialRatioMetrics;
  ttmStatement?: TTMFinancialStatement | null;
  incomeStatement?: StandardizedIncomeStatement;
  balanceSheet?: StandardizedBalanceSheet;
  cashFlow?: StandardizedCashFlow;
  quality: QualityState;
  provenance: ExecutiveProvenance;
}
