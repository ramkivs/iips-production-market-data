/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-E Test Suite: UI01–UI14 Functional Surfaces
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  UI01ReplayStudioBuilder,
  UI02ExecutiveSummaryBuilder,
  UI03FundamentalAnalysisBuilder,
  UI04DomainIntelligenceBuilder,
  UI05SectorScoringRadarBuilder,
  UI06MultiFactorScreenerBuilder,
  UI07PitCorporateActionsBuilder,
  UI08SecurityMasterModalBuilder,
  UI09RestatementTimelineBuilder,
  UI10AnomalyMonitorBuilder,
  UI11ProvenanceAuditorBuilder,
  UI12EstimatesDistributionBuilder,
  UI13MacroVintageTrackerBuilder,
  UI14AltDataAuditorBuilder,
  PointInTimeStore,
  SecurityMaster,
  ObjectResolverService,
  ScreenerService,
  RestatementTracker,
  AnomalyDetector,
  EstimatesEngine,
  MacroEngine,
  AltDataEngine,
  AD17_CONSTRAINT_TEXT,
  UIRegistry,
} from '../src/index.js';

describe('WS-E / UI01–UI14 Functional Surfaces Qualification', () => {
  const sm = new SecurityMaster();
  sm.registerEntity({
    companyId: 'INFY',
    isin: 'INE009A01021',
    companyName: 'Infosys Limited',
    industry: 'Information Technology',
    sector: 'Technology',
    effectiveFrom: '2000-01-01T00:00:00.000Z',
    listings: [{ exchange: 'NSE', symbol: 'INFY', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 }],
  });

  const resolver = new ObjectResolverService(sm);
  const screener = new ScreenerService();
  screener.registerCandidate({
    companyId: 'INFY',
    companyName: 'Infosys Limited',
    sector: 'Technology',
    ltp: 1850.5,
    pe: 24.5,
    pb: 6.2,
    roe: 28.5,
    operatingMargin: 24.0,
    score: 82.5,
    grade: 'A',
    quality: 'GOOD',
  });

  it('UI01: Replay & Simulation Studio should render with AD17 disclosure', () => {
    const vm = UI01ReplayStudioBuilder.build({
      marketSnapshot: {
        companyId: 'INFY',
        symbol: 'INFY',
        exchange: 'NSE',
        ltp: 1850.5,
        open: 1840.0,
        high: 1865.0,
        low: 1835.0,
        previousClose: 1830.0,
        change: 20.5,
        pctChange: 1.12,
        volume: 2500000,
        mode: 'SNAPSHOT',
        quality: 'GOOD',
        provenance: {
          sourceClassification: 'REAL',
          asOf: '2026-09-18T10:00:00.000Z',
          evaluatedAt: '2026-09-18T10:00:01.000Z',
          dataVersion: 'v1.0.0',
          lineageDigest: 'hash1',
          quality: 'GOOD',
          replayConstraintApplied: false,
        },
      },
      engineScore: {
        companyId: 'INFY',
        engineId: 'SECTOR_IT',
        rawScore: 82.5,
        normalizedScore: 82.5,
        grade: 'A',
        factorBreakdown: { valuation: 78.0, quality: 88.0, profitability: 84.0, momentum: 80.0 },
        qualityState: 'GOOD',
        provenance: {
          sourceClassification: 'CERTIFIED_ENGINE',
          vendorTier: 'OFFLINE_BOOTSTRAP',
          asOf: '2026-09-18T10:00:00.000Z',
          receivedAt: '2026-09-18T10:00:00.000Z',
          evaluatedAt: '2026-09-18T10:00:01.000Z',
          dataVersion: 'v1.0.0-certified-frozen',
          lineageHash: 'hash2',
          qualityState: 'GOOD',
        },
        versionVector: {
          schemaVersion: '1.0.0',
          engineVersion: 'v1.0.0-certified-frozen',
          securityMasterVersion: '2026.09.19',
          dataVersionVector: { D01_QUOTES: 'v1.0' },
        },
        executionId: 'exec-01',
        evaluatedAt: '2026-09-18T10:00:01.000Z',
        isFallbackApplied: false,
        fallbackFields: [],
      },
      companyName: 'Infosys Limited',
    });

    assert.strictEqual(vm.surfaceId, 'UI01_REPLAY_STUDIO');
    assert.strictEqual(vm.ad17MandatoryDisclosure, AD17_CONSTRAINT_TEXT);
  });

  it('UI02: Executive Summary Dashboard should synthesize multi-domain metrics', () => {
    const vm = UI02ExecutiveSummaryBuilder.build({
      marketData: {
        companyId: 'INFY',
        symbol: 'INFY',
        exchange: 'NSE',
        ltp: 1850.5,
        open: 1840.0,
        high: 1865.0,
        low: 1835.0,
        previousClose: 1830.0,
        change: 20.5,
        pctChange: 1.12,
        volume: 2500000,
        mode: 'SNAPSHOT',
        quality: 'GOOD',
        provenance: {
          sourceClassification: 'REAL',
          asOf: '2026-09-18T10:00:00.000Z',
          evaluatedAt: '2026-09-18T10:00:01.000Z',
          dataVersion: 'v1.0.0',
          lineageDigest: 'hash1',
          quality: 'GOOD',
          replayConstraintApplied: false,
        },
      },
      engineScore: {
        companyId: 'INFY',
        engineId: 'SECTOR_IT',
        rawScore: 82.5,
        normalizedScore: 82.5,
        grade: 'A',
        factorBreakdown: { valuation: 78.0, quality: 88.0, profitability: 84.0, momentum: 80.0 },
        qualityState: 'GOOD',
        provenance: {
          sourceClassification: 'CERTIFIED_ENGINE',
          vendorTier: 'OFFLINE_BOOTSTRAP',
          asOf: '2026-09-18T10:00:00.000Z',
          receivedAt: '2026-09-18T10:00:00.000Z',
          evaluatedAt: '2026-09-18T10:00:01.000Z',
          dataVersion: 'v1.0.0-certified-frozen',
          lineageHash: 'hash2',
          qualityState: 'GOOD',
        },
        versionVector: {
          schemaVersion: '1.0.0',
          engineVersion: 'v1.0.0-certified-frozen',
          securityMasterVersion: '2026.09.19',
          dataVersionVector: { D01_QUOTES: 'v1.0' },
        },
        executionId: 'exec-01',
        evaluatedAt: '2026-09-18T10:00:01.000Z',
        isFallbackApplied: false,
        fallbackFields: [],
      },
      intelligence: {
        companyId: 'INFY',
        news: {
          newsItems: [],
          totalAvailable: 0,
          filteredCount: 0,
          dominantSentiment: 'NEUTRAL',
          averageSentimentScore: 0.1,
          qualityState: 'GOOD',
        },
        estimates: {
          companyId: 'INFY',
          metric: 'TARGET_PRICE',
          targetPeriod: 'FY2027',
          asOf: '2026-09-18T10:00:00.000Z',
          isConsensusValid: true,
          analystCount: 5,
          mean: 2100.0,
          median: 2080.0,
          high: 2300.0,
          low: 1950.0,
          standardDeviation: 120.5,
          excludedStaleCount: 0,
          qualityState: 'GOOD',
        },
        quality: 'GOOD',
        provenance: {
          sourceClassification: 'DERIVED',
          asOf: '2026-09-18T10:00:00.000Z',
          evaluatedAt: '2026-09-18T10:00:01.000Z',
          dataVersion: 'v1.0.0',
          lineageDigest: 'hash3',
          quality: 'GOOD',
          replayConstraintApplied: false,
        },
      },
      companyName: 'Infosys Limited',
      rank: 1,
    });

    assert.strictEqual(vm.surfaceId, 'UI02_EXECUTIVE_SUMMARY');
    assert.strictEqual(vm.quote.lastPrice, 1850.5);
    assert.strictEqual(vm.compositeScore.grade, 'A');
  });

  it('UI03: Fundamental Analysis View should present TTM statements and ratios', () => {
    const vm = UI03FundamentalAnalysisBuilder.build({
      fundamentals: {
        companyId: 'INFY',
        scope: 'CONSOLIDATED',
        fiscalYear: 2026,
        quarter: 'Q1',
        periodType: 'QUARTERLY',
        ratios: {
          companyId: 'INFY',
          asOf: '2026-09-18T10:00:00.000Z',
          scope: 'CONSOLIDATED',
          peRatio: 24.5,
          pbRatio: 6.2,
          evToEbitda: 16.8,
          roe: 28.5,
          roce: 32.0,
          debtToEquity: 0.05,
          operatingMargin: 24.0,
          netProfitMargin: 19.5,
          splitAdjustedEps: 68.5,
          qualityState: 'GOOD',
          calculationNotes: [],
        },
        ttmStatement: {
          companyId: 'INFY',
          scope: 'CONSOLIDATED',
          asOf: '2026-09-18T10:00:00.000Z',
          coveredQuarters: ['FY2025-Q2', 'FY2025-Q3', 'FY2025-Q4', 'FY2026-Q1'],
          revenueTTM: 153670,
          ebitdaTTM: 38400,
          ebitTTM: 34500,
          patTTM: 26200,
          operatingCashFlowTTM: 28000,
          freeCashFlowTTM: 24000,
          latestNetWorth: 85000,
          latestTotalDebt: 4200,
          latestTotalAssets: 125000,
          qualityState: 'GOOD',
          isComplete: true,
        },
        balanceSheet: {
          totalEquityShareCapital: 2000,
          reservesAndSurplus: 83000,
          netWorth: 85000,
          totalDebt: 4200,
          nonCurrentLiabilities: 15800,
          currentLiabilities: 20000,
          totalLiabilities: 40000,
          propertyPlantEquipment: 45000,
          intangibleAssets: 10000,
          nonCurrentInvestments: 20000,
          otherNonCurrentAssets: 10000,
          cashAndEquivalents: 15000,
          currentInvestments: 10000,
          inventories: 0,
          tradeReceivables: 10000,
          otherCurrentAssets: 5000,
          totalAssets: 125000,
        },
        quality: 'GOOD',
        provenance: {
          sourceClassification: 'REAL',
          asOf: '2026-09-18T10:00:00.000Z',
          evaluatedAt: '2026-09-18T10:00:01.000Z',
          dataVersion: 'v1.0.0',
          lineageDigest: 'hash4',
          quality: 'GOOD',
          replayConstraintApplied: false,
        },
      },
      companyName: 'Infosys Limited',
    });

    assert.strictEqual(vm.surfaceId, 'UI03_FUNDAMENTAL_ANALYSIS');
    assert.strictEqual(vm.ttmStatements.revenue, 153670);
    assert.strictEqual(vm.balanceSheetIdentityValid, true);
  });

  it('UI04: Domain Intelligence View should present PIT news and consensus signals', () => {
    const vm = UI04DomainIntelligenceBuilder.build({
      intelligence: {
        companyId: 'INFY',
        news: {
          newsItems: [
            {
              newsId: 'news-01',
              companyId: 'INFY',
              headline: 'Infosys announces major cloud deal',
              summary: 'Cloud migration partnership signed',
              publishedAt: '2026-09-18T08:00:00.000Z',
              category: 'CORPORATE',
              sentimentScore: 0.65,
              relevanceScore: 0.95,
              sourcePublisher: 'GOVERNED_EXCHANGE_DISCLOSURE',
              tags: ['CLOUD', 'DEAL'],
            },
          ],
          totalAvailable: 1,
          filteredCount: 1,
          dominantSentiment: 'BULLISH',
          averageSentimentScore: 0.65,
          qualityState: 'GOOD',
        },
        quality: 'GOOD',
        provenance: {
          sourceClassification: 'DERIVED',
          asOf: '2026-09-18T10:00:00.000Z',
          evaluatedAt: '2026-09-18T10:00:01.000Z',
          dataVersion: 'v1.0.0',
          lineageDigest: 'hash5',
          quality: 'GOOD',
          replayConstraintApplied: false,
        },
      },
      companyName: 'Infosys Limited',
    });

    assert.strictEqual(vm.surfaceId, 'UI04_DOMAIN_INTELLIGENCE');
    assert.strictEqual(vm.newsSignals.length, 1);
    assert.strictEqual(vm.newsSignals[0].isOfficialExchange, true);
  });

  it('UI05: Sector Engine Scoring Radar should present frozen factor weights', () => {
    const vm = UI05SectorScoringRadarBuilder.build({
      engineScore: {
        companyId: 'INFY',
        engineId: 'SECTOR_IT',
        rawScore: 85.0,
        normalizedScore: 85.0,
        grade: 'A',
        factorBreakdown: { valuation: 80.0, quality: 90.0, profitability: 85.0, momentum: 82.0 },
        qualityState: 'GOOD',
        provenance: {
          sourceClassification: 'CERTIFIED_ENGINE',
          vendorTier: 'OFFLINE_BOOTSTRAP',
          asOf: '2026-09-18T10:00:00.000Z',
          receivedAt: '2026-09-18T10:00:00.000Z',
          evaluatedAt: '2026-09-18T10:00:01.000Z',
          dataVersion: 'v1.0.0-certified-frozen',
          lineageHash: 'hash6',
          qualityState: 'GOOD',
        },
        versionVector: {
          schemaVersion: '1.0.0',
          engineVersion: 'v1.0.0-certified-frozen',
          securityMasterVersion: '2026.09.19',
          dataVersionVector: { D01_QUOTES: 'v1.0' },
        },
        executionId: 'exec-05',
        evaluatedAt: '2026-09-18T10:00:01.000Z',
        isFallbackApplied: false,
        fallbackFields: [],
      },
      companyName: 'Infosys Limited',
    });

    assert.strictEqual(vm.surfaceId, 'UI05_SECTOR_SCORING_RADAR');
    assert.strictEqual(vm.factorBreakdown.length, 4);
    assert.strictEqual(vm.factorBreakdown[0].factor, 'Valuation');
    assert.strictEqual(vm.factorBreakdown[0].weight, 0.3);
  });

  it('UI06: Screener View should integrate Contract C6 server-side results', () => {
    const vm = UI06MultiFactorScreenerBuilder.build({
      criteria: { sector: 'Technology' },
      screenerService: screener,
    });
    assert.strictEqual(vm.surfaceId, 'UI06_MULTIFACTOR_SCREENER');
    assert.strictEqual(vm.totalMatches, 1);
  });

  it('UI07: PIT Corporate Actions should calculate cumulative adjustment factors', () => {
    const pitStore = new PointInTimeStore<any>();
    pitStore.append({
      envelopeId: 'env-ca-01',
      domain: 'D04_CORPORATE_ACTIONS',
      companyId: 'INFY',
      timestamp: '2018-09-04T00:00:00.000Z',
      mode: 'PIT',
      schemaVersion: '1.0.0',
      payload: {
        companyId: 'INFY',
        actionId: 'CA-SPLIT-01',
        actionType: 'SPLIT',
        status: 'EFFECTIVE',
        exDate: '2018-09-04',
        recordDate: '2018-09-05',
        ratioNumerator: 1,
        ratioDenominator: 2,
        adjustmentFactor: 0.5,
      },
      provenance: {
        sourceClassification: 'REAL',
        vendorTier: 'OFFLINE_BOOTSTRAP',
        asOf: '2018-09-04T00:00:00.000Z',
        receivedAt: '2018-09-04T00:00:00.000Z',
        evaluatedAt: '2018-09-04T00:00:00.000Z',
        dataVersion: 'v1.0',
        lineageHash: 'hash-ca-01',
        qualityState: 'GOOD',
      },
    });

    const vm = UI07PitCorporateActionsBuilder.build({
      pitStore,
      companyId: 'INFY',
      companyName: 'Infosys Limited',
      asOf: '2026-09-18T10:00:00.000Z',
    });

    assert.strictEqual(vm.surfaceId, 'UI07_PIT_CORPORATE_ACTIONS');
    assert.strictEqual(vm.corporateActions.length, 1);
    assert.strictEqual(vm.adjustmentFactorCumulative, 0.5);
  });

  it('UI08: Security Master Modal should resolve identity with focus trap', () => {
    const vm = UI08SecurityMasterModalBuilder.build({
      query: { identifierType: 'NSE_SYMBOL', identifierValue: 'INFY' },
      resolverService: resolver,
    });

    assert.strictEqual(vm.surfaceId, 'UI08_SECURITY_MASTER_MODAL');
    assert.strictEqual(vm.isModalOpen, true);
    assert.strictEqual(vm.trapFocus, true);
  });

  it('UI09: Restatement Timeline Comparison should calculate delta percentages', () => {
    const tracker = new RestatementTracker();
    const origStmt = {
      statementId: 'stmt-orig',
      companyId: 'INFY',
      scope: 'CONSOLIDATED' as const,
      fiscalYear: 2026,
      periodType: 'ANNUAL' as const,
      periodStart: '2025-04-01T00:00:00.000Z',
      periodEnd: '2026-03-31T00:00:00.000Z',
      filingDate: '2026-05-15T12:00:00.000Z',
      restatementIndex: 0,
      rawCurrency: 'INR',
      currency: 'INR' as const,
      isAudited: true,
      sourceFilingType: 'MCA_XBRL' as const,
      incomeStatement: { revenue: 100000, otherIncome: 2000, totalIncome: 102000, operatingExpenses: 75000, ebitda: 25000, depreciationAndAmort: 4000, ebit: 21000, financeCosts: 1000, pbt: 20000, taxExpense: 5000, pat: 15000, epsBasic: 35.0, epsDiluted: 35.0, sharesOutstanding: 428000000 },
      qualityState: 'GOOD' as const,
    };
    const restatedStmt = {
      ...origStmt,
      statementId: 'stmt-restated',
      filingDate: '2026-07-20T12:00:00.000Z',
      restatementIndex: 1,
      incomeStatement: { ...origStmt.incomeStatement, revenue: 102000, pat: 15300 },
    };

    const vm = UI09RestatementTimelineBuilder.build({
      tracker,
      companyId: 'INFY',
      fiscalYear: 2026,
      companyName: 'Infosys Limited',
      asOf: '2026-09-18T10:00:00.000Z',
      originalStatement: origStmt,
      latestStatement: restatedStmt,
    });

    assert.strictEqual(vm.surfaceId, 'UI09_RESTATEMENT_TIMELINE');
    assert.strictEqual(vm.deltaRevenuePct, 2.0); // +2%
    assert.strictEqual(vm.isMaterialDelta, true);
    assert.strictEqual(vm.qualityIndicator.state, 'PARTIAL');
  });

  it('UI10: Data Quality Anomaly Monitor should report active anomalies', () => {
    const detector = new AnomalyDetector();
    const vm = UI10AnomalyMonitorBuilder.build({
      anomalyDetector: detector,
      companyId: 'INFY',
      companyName: 'Infosys Limited',
      samplePayload: { high: 1800, low: 1900 }, // High < Low violation
    });

    assert.strictEqual(vm.surfaceId, 'UI10_ANOMALY_MONITOR');
    assert.strictEqual(vm.activeAnomalies.length, 1);
    assert.strictEqual(vm.activeAnomalies[0].category, 'CONTRADICTORY_CROSS_FIELD');
  });

  it('UI11: Executive Provenance Auditor should display lineage hash and version vector', () => {
    const vm = UI11ProvenanceAuditorBuilder.build({
      provenance: {
        sourceClassification: 'CERTIFIED_ENGINE',
        asOf: '2026-09-18T10:00:00.000Z',
        evaluatedAt: '2026-09-18T10:00:01.000Z',
        dataVersion: 'v1.0.0-certified-frozen',
        lineageDigest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        quality: 'GOOD',
        replayConstraintApplied: false,
      },
      companyId: 'INFY',
      companyName: 'Infosys Limited',
    });

    assert.strictEqual(vm.surfaceId, 'UI11_PROVENANCE_AUDITOR');
    assert.strictEqual(vm.lineageHash.length, 64);
  });

  it('UI12: Consensus Estimates Distribution should compute analyst spread', () => {
    const engine = new EstimatesEngine();
    engine.submitEstimate({
      estimateId: 'est-01',
      companyId: 'INFY',
      analystId: 'ANON_01',
      metric: 'TARGET_PRICE',
      targetPeriod: 'FY2027',
      estimatedValue: 2000,
      submittedAt: '2026-09-01T00:00:00.000Z',
      currency: 'INR',
    });
    engine.submitEstimate({
      estimateId: 'est-02',
      companyId: 'INFY',
      analystId: 'ANON_02',
      metric: 'TARGET_PRICE',
      targetPeriod: 'FY2027',
      estimatedValue: 2100,
      submittedAt: '2026-09-02T00:00:00.000Z',
      currency: 'INR',
    });
    engine.submitEstimate({
      estimateId: 'est-03',
      companyId: 'INFY',
      analystId: 'ANON_03',
      metric: 'TARGET_PRICE',
      targetPeriod: 'FY2027',
      estimatedValue: 2200,
      submittedAt: '2026-09-03T00:00:00.000Z',
      currency: 'INR',
    });

    const vm = UI12EstimatesDistributionBuilder.build({
      estimatesEngine: engine,
      estimatesList: [],
      companyId: 'INFY',
      companyName: 'Infosys Limited',
      metric: 'TARGET_PRICE',
      targetPeriod: 'FY2027',
      asOf: '2026-09-18T10:00:00.000Z',
    });

    assert.strictEqual(vm.surfaceId, 'UI12_ESTIMATES_DISTRIBUTION');
    assert.strictEqual(vm.analystCount, 3);
    assert.strictEqual(vm.isConsensusSufficient, true);
    assert.strictEqual(vm.meanTargetPrice, 2100);
  });

  it('UI13: Macro Vintage Tracker should track macroeconomic series releases', () => {
    const engine = new MacroEngine();
    engine.ingestMacroData({
      seriesId: 'CPI',
      seriesName: 'Consumer Price Index',
      vintageDate: '2026-08-12T12:00:00.000Z',
      releaseDate: '2026-08-12T12:00:00.000Z',
      period: '2026-07',
      value: 5.4,
      unit: '%',
      frequency: 'MONTHLY',
      sourceAgency: 'MoSPI',
    });

    const vm = UI13MacroVintageTrackerBuilder.build({
      macroEngine: engine,
      seriesIds: ['CPI'],
      companyName: 'National Economy',
      asOf: '2026-09-18T10:00:00.000Z',
    });

    assert.strictEqual(vm.surfaceId, 'UI13_MACRO_VINTAGE_TRACKER');
    assert.strictEqual(vm.indicatorSeries.length, 1);
    assert.strictEqual(vm.indicatorSeries[0].indicatorCode, 'CPI');
    assert.strictEqual(vm.indicatorSeries[0].value, 5.4);
  });

  it('UI14: Alternative Data Signal Auditor should verify approvalRef governance', () => {
    const engine = new AltDataEngine();
    const signal = {
      companyId: 'INFY',
      signalId: 'ALT-01',
      datasetName: 'Hiring Trends',
      signalType: 'TECH_HIRING_INDEX',
      observedAt: '2026-09-10T00:00:00.000Z',
      value: 115.0,
      unit: 'Index',
      confidenceScore: 0.85,
      approvalRef: 'REG-AUTH-2026-ALT-99',
      coverage: 'NATIONAL',
    };
    engine.ingestSignal(signal);

    const vm = UI14AltDataAuditorBuilder.build({
      altDataEngine: engine,
      signalsList: [signal],
      companyId: 'INFY',
      signalType: 'TECH_HIRING_INDEX',
      companyName: 'Infosys Limited',
      asOf: '2026-09-18T10:00:00.000Z',
    });

    assert.strictEqual(vm.surfaceId, 'UI14_ALTDATA_AUDITOR');
    assert.strictEqual(vm.signals.length, 1);
    assert.strictEqual(vm.signals[0].isGovernanceApproved, true);
    assert.strictEqual(vm.signals[0].approvalRef, 'REG-AUTH-2026-ALT-99');
  });
});
