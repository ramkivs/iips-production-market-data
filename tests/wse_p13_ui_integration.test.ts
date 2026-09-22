/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-E Test Suite: P13 Product UI Data Integration
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  UI01ReplayStudioBuilder,
  UI02ExecutiveSummaryBuilder,
  UI03FundamentalAnalysisBuilder,
  UI06MultiFactorScreenerBuilder,
  UI08SecurityMasterModalBuilder,
  MarketDataDTO,
  FundamentalsDTO,
  IntelligenceDTO,
  ScreenerService,
  ObjectResolverService,
  SecurityMaster,
  IdentityAmbiguityError,
  AD17_CONSTRAINT_TEXT,
  UIRegistry,
} from '../src/index.js';

describe('WS-E / P13 Product UI Data Integration', () => {
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

  const mockMarketData: MarketDataDTO = {
    companyId: 'INFY',
    symbol: 'INFY',
    exchange: 'NSE',
    ltp: 1850.5,
    open: 1840.0,
    high: 1865.0,
    low: 1835.0,
    close: 1850.5,
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
      lineageDigest: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      quality: 'GOOD',
      replayConstraintApplied: false,
    },
  };

  const mockEngineScore = {
    companyId: 'INFY',
    engineId: 'SECTOR_IT' as const,
    rawScore: 82.5,
    normalizedScore: 82.5,
    grade: 'A' as const,
    factorBreakdown: { valuation: 78.0, quality: 88.0, profitability: 84.0, momentum: 80.0 },
    qualityState: 'GOOD' as const,
    provenance: {
      sourceClassification: 'CERTIFIED_ENGINE' as const,
      vendorTier: 'OFFLINE_BOOTSTRAP' as const,
      asOf: '2026-09-18T10:00:00.000Z',
      receivedAt: '2026-09-18T10:00:00.000Z',
      evaluatedAt: '2026-09-18T10:00:01.000Z',
      dataVersion: 'v1.0.0-certified-frozen',
      lineageHash: 'f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2',
      qualityState: 'GOOD' as const,
    },
    versionVector: {
      schemaVersion: '1.0.0',
      engineVersion: 'v1.0.0-certified-frozen',
      securityMasterVersion: '2026.09.19',
      dataVersionVector: { D01_QUOTES: 'v1.0' },
    },
    executionId: 'exec-test-01',
    evaluatedAt: '2026-09-18T10:00:01.000Z',
    isFallbackApplied: false,
    fallbackFields: [],
  };

  const mockIntelligence: IntelligenceDTO = {
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
      lineageDigest: 'e1d2c3b4a5f6e1d2c3b4a5f6e1d2c3b4a5f6e1d2c3b4a5f6e1d2c3b4a5f6e1d2',
      quality: 'GOOD',
      replayConstraintApplied: false,
    },
  };

  it('P13-01: UI01 should inject mandatory AD17_CONSTRAINT replay disclosure', () => {
    const vm = UI01ReplayStudioBuilder.build({
      marketSnapshot: mockMarketData,
      engineScore: mockEngineScore,
      companyName: 'Infosys Limited',
    });

    assert.strictEqual(vm.surfaceId, 'UI01_REPLAY_STUDIO');
    assert.strictEqual(vm.ad17MandatoryDisclosure, AD17_CONSTRAINT_TEXT);
    assert.strictEqual(vm.ad17Disclosure, AD17_CONSTRAINT_TEXT);
    assert.strictEqual(vm.qualityIndicator.state, 'GOOD');
  });

  it('P13-02: UI02 should synthesize cross-domain inputs and preserve worst-case quality floor', () => {
    // Degrade intelligence to PARTIAL
    const degradedIntelligence: IntelligenceDTO = {
      ...mockIntelligence,
      quality: 'PARTIAL',
    };

    const vm = UI02ExecutiveSummaryBuilder.build({
      marketData: mockMarketData,
      engineScore: mockEngineScore,
      intelligence: degradedIntelligence,
      companyName: 'Infosys Limited',
      rank: 1,
    });

    assert.strictEqual(vm.surfaceId, 'UI02_EXECUTIVE_SUMMARY');
    assert.strictEqual(vm.compositeScore.rank, 1);
    assert.strictEqual(vm.compositeScore.grade, 'A');
    assert.strictEqual(vm.qualityIndicator.state, 'PARTIAL'); // Worst-case quality floor preserved
  });

  it('P13-03: UI03 should expose pinned report vintage and normalized ratios without client calculation', () => {
    const mockFundamentals: FundamentalsDTO = {
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
      quality: 'GOOD',
      provenance: {
        sourceClassification: 'REAL',
        asOf: '2026-09-18T10:00:00.000Z',
        evaluatedAt: '2026-09-18T10:00:01.000Z',
        dataVersion: 'v1.0.0',
        lineageDigest: 'b1c2d3e4f5a6b1c2d3e4f5a6b1c2d3e4f5a6b1c2d3e4f5a6b1c2d3e4f5a6b1c2',
        quality: 'GOOD',
        replayConstraintApplied: false,
      },
    };

    const vm = UI03FundamentalAnalysisBuilder.build({
      fundamentals: mockFundamentals,
      companyName: 'Infosys Limited',
      filingDate: '2026-07-20T12:00:00.000Z',
      periodEndDate: '2026-06-30',
      restatementIndex: 0,
    });

    assert.strictEqual(vm.surfaceId, 'UI03_FUNDAMENTAL_ANALYSIS');
    assert.strictEqual(vm.pinnedVintage.filingDate, '2026-07-20T12:00:00.000Z');
    assert.strictEqual(vm.pinnedVintage.periodEndDate, '2026-06-30');
    assert.strictEqual(vm.pinnedVintage.restatementIndex, 0);
    assert.strictEqual(vm.ratios.peRatio, 24.5);
  });

  it('P13-04: UI06 should execute server-side screening (Contract C6) with zero client re-filtering', () => {
    const vm = UI06MultiFactorScreenerBuilder.build({
      criteria: { sector: 'Technology', minScore: 80.0 },
      screenerService: screener,
    });

    assert.strictEqual(vm.surfaceId, 'UI06_MULTIFACTOR_SCREENER');
    assert.strictEqual(vm.totalMatches, 1);
    assert.strictEqual(vm.results[0].companyId, 'INFY');
  });

  it('P13-05: UI08 should resolve object via P04 Security Master (Contract C7) and fail closed on unmapped identity', () => {
    const validVm = UI08SecurityMasterModalBuilder.build({
      query: { identifierType: 'NSE_SYMBOL', identifierValue: 'INFY' },
      resolverService: resolver,
    });

    assert.strictEqual(validVm.surfaceId, 'UI08_SECURITY_MASTER_MODAL');
    assert.strictEqual(validVm.resolution.companyId, 'INFY');
    assert.strictEqual(validVm.resolution.isin, 'INE009A01021');

    // Unmapped identity must throw IdentityAmbiguityError (fail closed)
    assert.throws(() => {
      UI08SecurityMasterModalBuilder.build({
        query: { identifierType: 'NSE_SYMBOL', identifierValue: 'UNMAPPED_SYMBOL_XYZ' },
        resolverService: resolver,
      });
    }, IdentityAmbiguityError);
  });

  it('P13-06: UIRegistry should verify NFR-06 provider masking and reject decommissioned UI17', () => {
    assert.strictEqual(UIRegistry.isSurfaceAuthorized('UI01_REPLAY_STUDIO'), true);
    assert.strictEqual(UIRegistry.isSurfaceAuthorized('UI14_ALTDATA_AUDITOR'), true);
    assert.strictEqual(UIRegistry.isSurfaceAuthorized('UI17'), false);
    assert.strictEqual(UIRegistry.isSurfaceAuthorized('UI17_DECOMMISSIONED'), false);

    assert.strictEqual(UIRegistry.verifyProviderMasking('Official Exchange Disclosure'), true);
    assert.strictEqual(UIRegistry.verifyProviderMasking('Bloomberg Terminal Feed'), false);
  });
});
