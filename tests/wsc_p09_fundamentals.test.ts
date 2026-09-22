/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-C Test Suite: P09 Fundamentals & Financial Analysis
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W2-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  StatementNormalizer,
  RestatementTracker,
  FinancialConflictError,
  TTMCalculator,
  RatioEngine,
  MarketQuotePayload,
} from '../src/index.js';

describe('WS-C / P09 Fundamentals & Financial Analysis Engine', () => {
  const normalizer = new StatementNormalizer();

  it('P09-01: should enforce Indian statutory calendar and strict FY vs. Q4 duration distinction', () => {
    // Valid Q4 statement (3 months duration: Jan 1 to Mar 31)
    const validQ4 = normalizer.normalize({
      statementId: 'STMT-INFY-2026-Q4',
      companyId: 'INFY',
      scope: 'CONSOLIDATED',
      fiscalYear: 2026,
      quarter: 'Q4',
      periodType: 'QUARTERLY',
      periodStart: '2026-01-01T00:00:00.000Z',
      periodEnd: '2026-03-31T00:00:00.000Z',
      filingDate: '2026-04-15T00:00:00.000Z',
      incomeStatement: { revenue: 38000000000, pat: 6500000000, epsBasic: 15.5 },
    });
    assert.strictEqual(validQ4.quarter, 'Q4');
    assert.strictEqual(validQ4.periodType, 'QUARTERLY');

    // Valid Annual FY statement (12 months duration: Apr 1 to Mar 31)
    const validFY = normalizer.normalize({
      statementId: 'STMT-INFY-2026-FY',
      companyId: 'INFY',
      scope: 'CONSOLIDATED',
      fiscalYear: 2026,
      periodType: 'ANNUAL',
      periodStart: '2025-04-01T00:00:00.000Z',
      periodEnd: '2026-03-31T00:00:00.000Z',
      filingDate: '2026-04-20T00:00:00.000Z',
      incomeStatement: { revenue: 153670000000, pat: 26248000000, epsBasic: 63.25 },
    });
    assert.strictEqual(validFY.periodType, 'ANNUAL');

    // Invalid duration for Annual (only 3 months given for ANNUAL) -> Throws
    assert.throws(() => {
      normalizer.normalize({
        statementId: 'STMT-ERR',
        companyId: 'INFY',
        fiscalYear: 2026,
        periodType: 'ANNUAL',
        periodStart: '2026-01-01T00:00:00.000Z',
        periodEnd: '2026-03-31T00:00:00.000Z',
        filingDate: '2026-04-20T00:00:00.000Z',
        incomeStatement: { revenue: 1000 },
      });
    });
  });

  it('P09-02: should validate Balance Sheet accounting identity (Assets = Liabilities + Net Worth)', () => {
    // Valid Balance Sheet
    const validBS = normalizer.normalize({
      statementId: 'STMT-BS-01',
      companyId: 'INFY',
      fiscalYear: 2026,
      periodType: 'ANNUAL',
      periodStart: '2025-04-01T00:00:00.000Z',
      periodEnd: '2026-03-31T00:00:00.000Z',
      filingDate: '2026-04-20T00:00:00.000Z',
      balanceSheet: {
        totalAssets: 120000000000,
        totalLiabilities: 30000000000,
        netWorth: 90000000000,
      },
    });
    assert.ok(validBS.balanceSheet);
    assert.strictEqual(validBS.balanceSheet.totalAssets, 120000000000);

    // Invalid Balance Sheet (Assets 120B != Liab 30B + Equity 50B) -> Throws
    assert.throws(() => {
      normalizer.normalize({
        statementId: 'STMT-BS-ERR',
        companyId: 'INFY',
        fiscalYear: 2026,
        periodType: 'ANNUAL',
        periodStart: '2025-04-01T00:00:00.000Z',
        periodEnd: '2026-03-31T00:00:00.000Z',
        filingDate: '2026-04-20T00:00:00.000Z',
        balanceSheet: {
          totalAssets: 120000000000,
          totalLiabilities: 30000000000,
          netWorth: 50000000000, // Sum = 80B != 120B
        },
      });
    });
  });

  it('P09-03: RestatementTracker should track restatement index and support PIT sequence retrieval', () => {
    const tracker = new RestatementTracker();

    // Original filing on 2025-04-20 (restatementIndex = 0, revenue = 100B)
    const originalFiling = normalizer.normalize({
      statementId: 'STMT-ORIG',
      companyId: 'TCS',
      scope: 'CONSOLIDATED',
      fiscalYear: 2025,
      periodType: 'ANNUAL',
      periodStart: '2024-04-01T00:00:00.000Z',
      periodEnd: '2025-03-31T00:00:00.000Z',
      filingDate: '2025-04-20T00:00:00.000Z',
      restatementIndex: 0,
      incomeStatement: { revenue: 100000000000, pat: 20000000000, epsBasic: 50 },
    });
    tracker.registerStatement(originalFiling);

    // Restatement filed on 2025-10-15 (restatementIndex = 1, revised revenue = 102B)
    const restatementFiling = normalizer.normalize({
      statementId: 'STMT-RESTATE',
      companyId: 'TCS',
      scope: 'CONSOLIDATED',
      fiscalYear: 2025,
      periodType: 'ANNUAL',
      periodStart: '2024-04-01T00:00:00.000Z',
      periodEnd: '2025-03-31T00:00:00.000Z',
      filingDate: '2025-10-15T00:00:00.000Z',
      restatementIndex: 1,
      incomeStatement: { revenue: 102000000000, pat: 20500000000, epsBasic: 51 },
    });
    tracker.registerStatement(restatementFiling);

    // PIT Query as of 2025-06-01 (before restatement) -> Returns Original (index 0, rev 100B)
    const pitPre = tracker.queryAsOf('TCS', 2025, undefined, '2025-06-01T00:00:00.000Z');
    assert.ok(pitPre);
    assert.strictEqual(pitPre.restatementIndex, 0);
    assert.strictEqual(pitPre.incomeStatement?.revenue, 100000000000);

    // PIT Query as of 2025-11-01 (after restatement) -> Returns Restatement (index 1, rev 102B)
    const pitPost = tracker.queryAsOf('TCS', 2025, undefined, '2025-11-01T00:00:00.000Z');
    assert.ok(pitPost);
    assert.strictEqual(pitPost.restatementIndex, 1);
    assert.strictEqual(pitPost.incomeStatement?.revenue, 102000000000);
  });

  it('P09-04: should quarantine material financial conflict (>0.5%) across duplicate filing sources', () => {
    const tracker = new RestatementTracker();

    const filingA = normalizer.normalize({
      statementId: 'STMT-SRC-A',
      companyId: 'RELIANCE',
      fiscalYear: 2026,
      periodType: 'ANNUAL',
      periodStart: '2025-04-01T00:00:00.000Z',
      periodEnd: '2026-03-31T00:00:00.000Z',
      filingDate: '2026-04-25T00:00:00.000Z',
      restatementIndex: 0,
      incomeStatement: { revenue: 9000000000000, pat: 700000000000 },
    });
    tracker.registerStatement(filingA);

    // Conflicting filing at same restatementIndex with 2% revenue discrepancy (9.18T vs 9.0T)
    const conflictingFiling = normalizer.normalize({
      statementId: 'STMT-SRC-B',
      companyId: 'RELIANCE',
      fiscalYear: 2026,
      periodType: 'ANNUAL',
      periodStart: '2025-04-01T00:00:00.000Z',
      periodEnd: '2026-03-31T00:00:00.000Z',
      filingDate: '2026-04-25T00:00:00.000Z',
      restatementIndex: 0,
      incomeStatement: { revenue: 9180000000000, pat: 700000000000 }, // 2% higher
    });

    assert.throws(() => {
      tracker.registerStatement(conflictingFiling);
    }, FinancialConflictError);

    const quarantined = tracker.getQuarantinedConflicts();
    assert.strictEqual(quarantined.length, 1);
    assert.strictEqual(quarantined[0].reason, 'MATERIAL_FINANCIAL_CONFLICT_EXCEEDS_0_5_PERCENT');
  });

  it('P09-05: TTMCalculator should aggregate trailing 4 quarters and fail if incomplete', () => {
    const tracker = new RestatementTracker();
    const ttmCalc = new TTMCalculator(tracker);

    // Register Q1, Q2, Q3, Q4 for FY2026
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
    const revs = [25000000000, 26000000000, 27000000000, 28000000000];
    const starts = ['2025-04-01T00:00:00.000Z', '2025-07-01T00:00:00.000Z', '2025-10-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'];
    const ends = ['2025-06-30T00:00:00.000Z', '2025-09-30T00:00:00.000Z', '2025-12-31T00:00:00.000Z', '2026-03-31T00:00:00.000Z'];
    const filings = ['2025-07-15T00:00:00.000Z', '2025-10-15T00:00:00.000Z', '2026-01-15T00:00:00.000Z', '2026-04-15T00:00:00.000Z'];

    for (let i = 0; i < 4; i++) {
      tracker.registerStatement(
        normalizer.normalize({
          statementId: `STMT-HDFC-${quarters[i]}`,
          companyId: 'HDFCBANK',
          fiscalYear: 2026,
          quarter: quarters[i],
          periodType: 'QUARTERLY',
          periodStart: starts[i],
          periodEnd: ends[i],
          filingDate: filings[i],
          incomeStatement: { revenue: revs[i], ebitda: revs[i] * 0.4, ebit: revs[i] * 0.35, pat: revs[i] * 0.2 },
          balanceSheet: { netWorth: 100000000000 + i * 5000000000, totalDebt: 50000000000, totalAssets: 150000000000 + i * 5000000000 },
        })
      );
    }

    // Complete 4-quarter TTM calculation
    const ttmResult = ttmCalc.computeTTM('HDFCBANK', 2026, 'Q4', '2026-05-01T00:00:00.000Z');
    assert.ok(ttmResult);
    assert.strictEqual(ttmResult.isComplete, true);
    assert.strictEqual(ttmResult.revenueTTM, 106000000000); // 25 + 26 + 27 + 28 = 106B
    assert.strictEqual(ttmResult.coveredQuarters.length, 4);

    // Incomplete TTM calculation (requesting FY2027 Q1 when only FY2026 Q4 is available) -> Returns null
    const incompleteTTM = ttmCalc.computeTTM('HDFCBANK', 2027, 'Q1', '2026-05-01T00:00:00.000Z');
    assert.strictEqual(incompleteTTM, null);
  });

  it('P09-06: RatioEngine should compute ratios, handle negative/zero denominators safely, and apply split adjustment', () => {
    const ratioEngine = new RatioEngine();

    const statement = normalizer.normalize({
      statementId: 'STMT-INFY-ANNUAL',
      companyId: 'INFY',
      fiscalYear: 2026,
      periodType: 'ANNUAL',
      periodStart: '2025-04-01T00:00:00.000Z',
      periodEnd: '2026-03-31T00:00:00.000Z',
      filingDate: '2026-04-20T00:00:00.000Z',
      incomeStatement: {
        revenue: 150000000000,
        ebitda: 45000000000,
        ebit: 37500000000,
        pat: 30000000000,
        epsBasic: 75.0,
        sharesOutstanding: 400000000,
      },
      balanceSheet: {
        netWorth: 100000000000,
        totalDebt: 20000000000,
        cashAndEquivalents: 10000000000,
        totalAssets: 120000000000,
        totalLiabilities: 20000000000,
      },
    });

    const quote: MarketQuotePayload = {
      companyId: 'INFY',
      symbol: 'INFY',
      exchange: 'NSE',
      currency: 'INR',
      bid: 1500,
      ask: 1500,
      ltp: 1500,
      open: 1480,
      high: 1510,
      low: 1475,
      previousClose: 1480,
      volume: 1000000,
      change: 20,
      pctChange: 1.35,
    };

    // Calculate with 1:2 split factor (0.5) from P08
    const ratios = ratioEngine.computeRatios({
      companyId: 'INFY',
      asOf: '2026-05-01T00:00:00.000Z',
      marketQuote: quote,
      statement,
      cumulativeSplitFactor: 0.5,
    });

    assert.strictEqual(ratios.peRatio, 20); // 1500 / 75 = 20.0
    assert.strictEqual(ratios.pbRatio, 6); // MarketCap 600B / NetWorth 100B = 6.0
    assert.strictEqual(ratios.debtToEquity, 0.2); // 20B / 100B = 0.2
    assert.strictEqual(ratios.operatingMargin, 25); // 37.5B / 150B = 25%
    assert.strictEqual(ratios.roe, 30); // 30B / 100B = 30%
    assert.strictEqual(ratios.splitAdjustedEps, 37.5); // 75.0 * 0.5 = 37.5
    assert.strictEqual(ratios.qualityState, 'GOOD');

    // Negative Denominator / Loss Making Company Scenario (PAT < 0, Net Worth < 0)
    const lossStatement = normalizer.normalize({
      statementId: 'STMT-LOSS',
      companyId: 'DISTRESSED_CO',
      fiscalYear: 2026,
      periodType: 'ANNUAL',
      periodStart: '2025-04-01T00:00:00.000Z',
      periodEnd: '2026-03-31T00:00:00.000Z',
      filingDate: '2026-04-20T00:00:00.000Z',
      incomeStatement: { revenue: 10000000, pat: -5000000, epsBasic: -12.5 },
      balanceSheet: { netWorth: -2000000, totalDebt: 10000000, totalAssets: 8000000, totalLiabilities: 10000000 },
    });

    const lossRatios = ratioEngine.computeRatios({
      companyId: 'DISTRESSED_CO',
      asOf: '2026-05-01T00:00:00.000Z',
      marketQuote: quote,
      statement: lossStatement,
    });

    assert.strictEqual(lossRatios.peRatio, null);
    assert.strictEqual(lossRatios.pbRatio, null);
    assert.strictEqual(lossRatios.roe, null);
    assert.ok(lossRatios.calculationNotes.length >= 2);
  });
});
