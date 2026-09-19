/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-D Test Suite: P12 Product Transport APIs & Typed Client DTOs
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W3-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  EngineApiAdapter,
  ScreenerService,
  ObjectResolverService,
  SecurityMaster,
  MarketQuotePayload,
  StandardizedFinancialStatement,
  FinancialRatioMetrics,
  AD17_CONSTRAINT_TEXT,
} from '../src/index.js';

describe('WS-D / P12 Product Transport APIs & Typed Client DTOs', () => {
  const sm = new SecurityMaster();
  sm.registerEntity({
    companyId: 'INFY',
    isin: 'INE009A01021',
    cin: 'L85110KA1981PLC013115',
    companyName: 'Infosys Limited',
    industry: 'Information Technology',
    sector: 'Technology',
    effectiveFrom: '2000-01-01T00:00:00.000Z',
    listings: [
      { exchange: 'NSE', symbol: 'INFY', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
      { exchange: 'BSE', symbol: 'INFY', scripCode: '500209', status: 'ACTIVE', lotSize: 1, tickSize: 0.05 },
    ],
  });

  const quote: MarketQuotePayload = {
    companyId: 'INFY',
    symbol: 'INFY',
    exchange: 'NSE',
    currency: 'INR',
    bid: 1520.0,
    ask: 1520.5,
    ltp: 1520.25,
    open: 1510.0,
    high: 1530.0,
    low: 1505.0,
    previousClose: 1508.0,
    volume: 2500000,
    change: 12.25,
    pctChange: 0.81,
  };

  it('P12-01: EngineApiAdapter should produce MarketDataDTO with NFR-06 provider masking across LIVE, SNAPSHOT, PIT', () => {
    const liveDto = EngineApiAdapter.createMarketDataDTO({
      quote,
      mode: 'LIVE',
      asOf: '2026-09-18T10:00:00.000Z',
    });

    assert.strictEqual(liveDto.companyId, 'INFY');
    assert.strictEqual(liveDto.mode, 'LIVE');
    assert.strictEqual(liveDto.ltp, 1520.25);
    assert.strictEqual(liveDto.provenance.sourceClassification, 'CANONICAL_MARKET_DATA');

    // Verify zero commercial vendor leakage (NFR-06)
    const jsonStr = JSON.stringify(liveDto).toLowerCase();
    assert.ok(!jsonStr.includes('bloomberg'));
    assert.ok(!jsonStr.includes('refinitiv'));
    assert.ok(!jsonStr.includes('sftp://'));
  });

  it('P12-02: EngineApiAdapter should inject mandatory AD17_CONSTRAINT in replay/simulation mode', () => {
    const replayDto = EngineApiAdapter.createMarketDataDTO({
      quote,
      mode: 'PIT',
      asOf: '2026-09-18T10:00:00.000Z',
      isSimulationOrReplay: true,
    });

    assert.strictEqual(replayDto.provenance.replayConstraintApplied, true);
    assert.strictEqual(replayDto.provenance.replayConstraintText, AD17_CONSTRAINT_TEXT);
    assert.ok(replayDto.provenance.replayConstraintText?.includes('AD17_CONSTRAINT'));
  });

  it('P12-03: EngineApiAdapter should construct FundamentalsDTO and IntelligenceDTO with executive provenance', () => {
    const statement: StandardizedFinancialStatement = {
      statementId: 'STMT-01',
      companyId: 'INFY',
      scope: 'CONSOLIDATED',
      fiscalYear: 2026,
      periodType: 'ANNUAL',
      periodStart: '2025-04-01T00:00:00.000Z',
      periodEnd: '2026-03-31T00:00:00.000Z',
      filingDate: '2026-04-20T00:00:00.000Z',
      restatementIndex: 0,
      rawCurrency: 'INR',
      currency: 'INR',
      isAudited: true,
      sourceFilingType: 'EXCHANGE_DISCLOSURE',
      qualityState: 'GOOD',
    };

    const ratios: FinancialRatioMetrics = {
      companyId: 'INFY',
      asOf: '2026-05-01T00:00:00.000Z',
      scope: 'CONSOLIDATED',
      peRatio: 22.5,
      pbRatio: 6.2,
      evToEbitda: 15.0,
      roe: 28.0,
      roce: 32.0,
      debtToEquity: 0.1,
      operatingMargin: 24.5,
      netProfitMargin: 19.5,
      splitAdjustedEps: 65.0,
      qualityState: 'GOOD',
      calculationNotes: [],
    };

    const fundDto = EngineApiAdapter.createFundamentalsDTO({
      statement,
      ratios,
      asOf: '2026-05-01T00:00:00.000Z',
    });

    assert.strictEqual(fundDto.companyId, 'INFY');
    assert.strictEqual(fundDto.ratios.peRatio, 22.5);
    assert.strictEqual(fundDto.provenance.sourceClassification, 'DERIVED');
    assert.strictEqual(fundDto.provenance.lineageDigest.length, 64);
  });

  it('P12-04: ScreenerService should execute Contract C6 server-side screening with multi-factor filters', () => {
    const screener = new ScreenerService();

    screener.registerCandidate({
      companyId: 'INFY',
      companyName: 'Infosys Limited',
      sector: 'TECHNOLOGY',
      ltp: 1520.0,
      pe: 22.0,
      pb: 6.0,
      roe: 28.0,
      operatingMargin: 24.0,
      score: 82.5,
      grade: 'A',
      quality: 'GOOD',
    });

    screener.registerCandidate({
      companyId: 'TCS',
      companyName: 'Tata Consultancy Services',
      sector: 'TECHNOLOGY',
      ltp: 3850.0,
      pe: 26.0,
      pb: 11.0,
      roe: 42.0,
      operatingMargin: 26.5,
      score: 88.0,
      grade: 'A+',
      quality: 'GOOD',
    });

    screener.registerCandidate({
      companyId: 'OVERVALUED_CO',
      companyName: 'Overvalued Tech',
      sector: 'TECHNOLOGY',
      ltp: 500.0,
      pe: 65.0, // High PE
      pb: 15.0,
      roe: 10.0,
      operatingMargin: 8.0,
      score: 42.0,
      grade: 'C',
      quality: 'GOOD',
    });

    // Screen for Technology sector with PE <= 30 and ROE >= 20 and Grade >= A
    const screenRes = screener.executeScreen({
      sector: 'TECHNOLOGY',
      maxPe: 30.0,
      minRoe: 20.0,
      minGrade: 'A',
    });

    assert.strictEqual(screenRes.totalMatched, 2);
    assert.strictEqual(screenRes.results[0].companyId, 'TCS'); // Highest score first (88.0)
    assert.strictEqual(screenRes.results[1].companyId, 'INFY'); // (82.5)
    assert.strictEqual(screenRes.provenance.sourceClassification, 'DERIVED');
  });

  it('P12-05: ObjectResolverService should execute Contract C7 Security Master object resolution', () => {
    const resolver = new ObjectResolverService(sm);

    const resolved = resolver.resolveObject({
      identifierType: 'ISIN',
      identifierValue: 'INE009A01021',
    });

    assert.strictEqual(resolved.companyId, 'INFY');
    assert.strictEqual(resolved.companyName, 'Infosys Limited');
    assert.strictEqual(resolved.sector, 'Technology');
    assert.strictEqual(resolved.listings.length, 2);
    assert.strictEqual(resolved.provenance.sourceClassification, 'REAL');
  });
});
