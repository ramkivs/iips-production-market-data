/**
 * Institutional Investment Platform System (IIPS)
 * Trailing Twelve Months (TTM) Financial Aggregator (P09 / D03)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W2-AUTH-2026-01
 */

import { StandardizedFinancialStatement, StatementScope, FiscalQuarter } from './types.js';
import { RestatementTracker } from './restatement_tracker.js';
import { rollupQuality } from '../quality/quality_rollup.js';
import { QualityState } from '../contracts/types.js';

export interface TTMFinancialStatement {
  companyId: string;
  scope: StatementScope;
  asOf: string;
  coveredQuarters: string[]; // e.g. ["FY2025-Q3", "FY2025-Q4", "FY2026-Q1", "FY2026-Q2"]
  revenueTTM: number;
  ebitdaTTM: number;
  ebitTTM: number;
  patTTM: number;
  operatingCashFlowTTM: number;
  freeCashFlowTTM: number;
  latestNetWorth: number;
  latestTotalDebt: number;
  latestTotalAssets: number;
  qualityState: QualityState;
  isComplete: boolean;
}

export class TTMCalculator {
  private tracker: RestatementTracker;

  constructor(tracker: RestatementTracker) {
    this.tracker = tracker;
  }

  /**
   * Calculates Trailing Twelve Months figures ending at a specific fiscal quarter.
   * Requires exactly 4 consecutive quarters.
   */
  public computeTTM(
    companyId: string,
    endFiscalYear: number,
    endQuarter: FiscalQuarter,
    asOf: string,
    scope: StatementScope = 'CONSOLIDATED'
  ): TTMFinancialStatement | null {
    const quartersToFetch = this.getFourConsecutiveQuarters(endFiscalYear, endQuarter);
    const fetchedStatements: StandardizedFinancialStatement[] = [];
    const qualities: QualityState[] = [];
    const coveredQuarters: string[] = [];

    for (const q of quartersToFetch) {
      const stmt = this.tracker.queryAsOf(companyId, q.fy, q.q, asOf, scope);
      if (!stmt || !stmt.incomeStatement) {
        // Missing quarterly statement -> Cannot construct valid 4-quarter TTM
        return null;
      }
      fetchedStatements.push(stmt);
      qualities.push(stmt.qualityState);
      coveredQuarters.push(`FY${q.fy}-${q.q}`);
    }

    let revenueTTM = 0;
    let ebitdaTTM = 0;
    let ebitTTM = 0;
    let patTTM = 0;
    let operatingCashFlowTTM = 0;
    let freeCashFlowTTM = 0;

    for (const stmt of fetchedStatements) {
      if (stmt.incomeStatement) {
        revenueTTM += stmt.incomeStatement.revenue;
        ebitdaTTM += stmt.incomeStatement.ebitda;
        ebitTTM += stmt.incomeStatement.ebit;
        patTTM += stmt.incomeStatement.pat;
      }
      if (stmt.cashFlow) {
        operatingCashFlowTTM += stmt.cashFlow.cashFromOperatingActivities;
        freeCashFlowTTM += stmt.cashFlow.freeCashFlow;
      }
    }

    // Latest balance sheet is taken from the most recent quarter (index 3)
    const latestStmt = fetchedStatements[3];
    const latestNetWorth = latestStmt.balanceSheet?.netWorth ?? 0;
    const latestTotalDebt = latestStmt.balanceSheet?.totalDebt ?? 0;
    const latestTotalAssets = latestStmt.balanceSheet?.totalAssets ?? 0;

    const overallQuality = rollupQuality(qualities);

    return {
      companyId,
      scope,
      asOf,
      coveredQuarters,
      revenueTTM: Math.round(revenueTTM * 100) / 100,
      ebitdaTTM: Math.round(ebitdaTTM * 100) / 100,
      ebitTTM: Math.round(ebitTTM * 100) / 100,
      patTTM: Math.round(patTTM * 100) / 100,
      operatingCashFlowTTM: Math.round(operatingCashFlowTTM * 100) / 100,
      freeCashFlowTTM: Math.round(freeCashFlowTTM * 100) / 100,
      latestNetWorth,
      latestTotalDebt,
      latestTotalAssets,
      qualityState: overallQuality,
      isComplete: true,
    };
  }

  private getFourConsecutiveQuarters(
    fy: number,
    q: FiscalQuarter
  ): Array<{ fy: number; q: FiscalQuarter }> {
    const sequence: FiscalQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
    const qIndex = sequence.indexOf(q);

    const result: Array<{ fy: number; q: FiscalQuarter }> = [];
    for (let i = 3; i >= 0; i--) {
      let targetQIndex = qIndex - i;
      let targetFY = fy;
      if (targetQIndex < 0) {
        targetQIndex += 4;
        targetFY -= 1;
      }
      result.push({ fy: targetFY, q: sequence[targetQIndex] });
    }
    return result;
  }
}
