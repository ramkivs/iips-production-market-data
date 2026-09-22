/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-C Test Suite: P10 Domain Intelligence (D06, D07, D08, D09)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W2-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  NewsEngine,
  EstimatesEngine,
  MacroEngine,
  AltDataEngine,
  NewsEventPayload,
  MacroDataPayload,
  GovernedAlternativeDataSignal,
} from '../src/index.js';

describe('WS-C / P10 Domain Intelligence Engines (D06, D07, D08, D09)', () => {
  it('P10-D06: NewsEngine should enforce PIT filtering and prioritize official exchange disclosures', () => {
    const newsEngine = new NewsEngine();

    const itemPress: NewsEventPayload = {
      companyId: 'INFY',
      newsId: 'NEWS-01',
      headline: 'Tech sector outlook commentary',
      summary: 'Third-party media summary on Indian IT',
      publishedAt: '2026-09-10T10:00:00.000Z',
      category: 'MARKET_ROUNDUP',
      sentimentScore: 0.2,
      relevanceScore: 0.7,
      sourcePublisher: 'GENERAL_FINANCIAL_MEDIA',
      tags: ['IT'],
    };

    const itemOfficial: NewsEventPayload = {
      companyId: 'INFY',
      newsId: 'NEWS-02',
      headline: 'Infosys enters strategic partnership with European bank',
      summary: 'Official BSE/NSE corporate disclosure',
      publishedAt: '2026-09-10T09:00:00.000Z', // Filed 1 hour earlier
      category: 'CORPORATE',
      sentimentScore: 0.8,
      relevanceScore: 0.95,
      sourcePublisher: 'GOVERNED_EXCHANGE_DISCLOSURE',
      tags: ['Partnership', 'Banking'],
    };

    const itemFuture: NewsEventPayload = {
      companyId: 'INFY',
      newsId: 'NEWS-03',
      headline: 'Future news leaked',
      summary: 'Published on Sep 25',
      publishedAt: '2026-09-25T10:00:00.000Z',
      category: 'CORPORATE',
      sentimentScore: 0.5,
      relevanceScore: 0.9,
      sourcePublisher: 'GOVERNED_EXCHANGE_DISCLOSURE',
      tags: ['Future'],
    };

    newsEngine.ingestNews(itemPress);
    newsEngine.ingestNews(itemOfficial);
    newsEngine.ingestNews(itemFuture);

    // Query as of 2026-09-15 -> Should return NEWS-01 and NEWS-02; exclude NEWS-03 (future)
    const res = newsEngine.queryNews({
      companyId: 'INFY',
      asOf: '2026-09-15T00:00:00.000Z',
    });

    assert.strictEqual(res.totalAvailable, 2);
    // Official disclosure must rank first despite slightly earlier timestamp
    assert.strictEqual(res.newsItems[0].newsId, 'NEWS-02');
    assert.strictEqual(res.dominantSentiment, 'BULLISH');
  });

  it('P10-D07: EstimatesEngine should compute consensus, enforce N >= 3, and exclude stale estimates (>90d)', () => {
    const estEngine = new EstimatesEngine();

    // Submit 3 estimates for INFY FY2027 Revenue
    // EST-01: submitted 2026-08-01 (122 days before Dec 1 -> stale as of Dec 1)
    estEngine.submitEstimate({
      estimateId: 'EST-01',
      companyId: 'INFY',
      analystId: 'BROKER_A',
      metric: 'REVENUE',
      targetPeriod: 'FY2027',
      estimatedValue: 1650000000000,
      submittedAt: '2026-08-01T00:00:00.000Z',
      currency: 'INR',
    });

    // EST-02: submitted 2026-08-15 (108 days before Dec 1 -> stale as of Dec 1)
    estEngine.submitEstimate({
      estimateId: 'EST-02',
      companyId: 'INFY',
      analystId: 'BROKER_B',
      metric: 'REVENUE',
      targetPeriod: 'FY2027',
      estimatedValue: 1700000000000,
      submittedAt: '2026-08-15T00:00:00.000Z',
      currency: 'INR',
    });

    // EST-03: submitted 2026-10-15 (47 days before Dec 1 -> active as of Dec 1)
    estEngine.submitEstimate({
      estimateId: 'EST-03',
      companyId: 'INFY',
      analystId: 'BROKER_C',
      metric: 'REVENUE',
      targetPeriod: 'FY2027',
      estimatedValue: 1750000000000,
      submittedAt: '2026-10-15T00:00:00.000Z',
      currency: 'INR',
    });

    // Valid 3-analyst consensus as of 2026-10-20 (all 3 active, age <= 90d)
    const consensusValid = estEngine.computeConsensus({
      companyId: 'INFY',
      metric: 'REVENUE',
      targetPeriod: 'FY2027',
      asOf: '2026-10-20T00:00:00.000Z',
    });

    assert.strictEqual(consensusValid.isConsensusValid, true);
    assert.strictEqual(consensusValid.analystCount, 3);
    assert.strictEqual(consensusValid.mean, 1700000000000);
    assert.strictEqual(consensusValid.median, 1700000000000);
    assert.strictEqual(consensusValid.low, 1650000000000);
    assert.strictEqual(consensusValid.high, 1750000000000);

    // Staleness test: Query as of 2026-12-01 (EST-01 & EST-02 > 90 days old) -> Remaining active = 1 < 3 -> Consensus invalid
    const consensusStale = estEngine.computeConsensus({
      companyId: 'INFY',
      metric: 'REVENUE',
      targetPeriod: 'FY2027',
      asOf: '2026-12-01T00:00:00.000Z',
    });

    assert.strictEqual(consensusStale.isConsensusValid, false);
    assert.strictEqual(consensusStale.analystCount, 1);
    assert.strictEqual(consensusStale.excludedStaleCount, 2);
    assert.strictEqual(consensusStale.qualityState, 'UNAVAILABLE');
  });

  it('P10-D08: MacroEngine should distinguish period, releaseDate, vintageDate, and apply stepwise carry-forward without lookahead', () => {
    const macroEngine = new MacroEngine();

    // August 2026 CPI released on 2026-09-12 (Vintage 1 = 4.85%)
    const cpiAugV1: MacroDataPayload = {
      seriesId: 'CPI',
      seriesName: 'Consumer Price Index',
      period: '2026-08',
      releaseDate: '2026-09-12T12:00:00.000Z',
      vintageDate: '2026-09-12T12:00:00.000Z',
      value: 4.85,
      unit: '% YoY',
      frequency: 'MONTHLY',
      sourceAgency: 'MoSPI',
    };

    // August 2026 CPI revised on 2026-10-12 (Vintage 2 = 4.90%)
    const cpiAugV2: MacroDataPayload = {
      seriesId: 'CPI',
      seriesName: 'Consumer Price Index',
      period: '2026-08',
      releaseDate: '2026-09-12T12:00:00.000Z',
      vintageDate: '2026-10-12T12:00:00.000Z',
      value: 4.90,
      unit: '% YoY',
      frequency: 'MONTHLY',
      sourceAgency: 'MoSPI',
    };

    macroEngine.ingestMacroData(cpiAugV1);
    macroEngine.ingestMacroData(cpiAugV2);

    // Query on 2026-09-01 (before release) -> Returns null (no lookahead leakage)
    const qBeforeRelease = macroEngine.queryAsOf('CPI', '2026-09-01T00:00:00.000Z');
    assert.strictEqual(qBeforeRelease, null);

    // Query on 2026-09-20 (after release, before revision) -> Returns Vintage 1 (4.85%)
    const qVintage1 = macroEngine.queryAsOf('CPI', '2026-09-20T00:00:00.000Z');
    assert.ok(qVintage1);
    assert.strictEqual(qVintage1.value, 4.85);
    assert.strictEqual(qVintage1.isStepwiseCarryForward, true);

    // Query on 2026-10-20 (after revision) -> Returns Vintage 2 (4.90%)
    const qVintage2 = macroEngine.queryAsOf('CPI', '2026-10-20T00:00:00.000Z');
    assert.ok(qVintage2);
    assert.strictEqual(qVintage2.value, 4.90);
  });

  it('P10-D09: AltDataEngine should enforce non-empty approvalRef and compute confidence-weighted signals', () => {
    const altEngine = new AltDataEngine();

    // Signal without approvalRef -> Throws rejection
    assert.throws(() => {
      altEngine.ingestSignal({
        companyId: 'INFY',
        signalId: 'SIG-ERR-01',
        datasetName: 'UNAPPROVED_WEB_SCRAPE',
        signalType: 'HIRING_INTENT',
        observedAt: '2026-09-10T00:00:00.000Z',
        value: 120.0,
        unit: 'Index',
        confidenceScore: 0.8,
        approvalRef: '', // Empty -> Fatal governance violation
        coverage: 'TECH',
      });
    });

    // Valid signals with approved reference
    const sig1: GovernedAlternativeDataSignal = {
      companyId: 'INFY',
      signalId: 'SIG-01',
      datasetName: 'IT_TALENT_INDEX',
      signalType: 'HIRING_VELOCITY',
      observedAt: '2026-09-10T00:00:00.000Z',
      value: 100.0,
      unit: 'Index',
      confidenceScore: 0.9,
      approvalRef: 'GOV-APP-ALT-2026-001',
      coverage: 'PAN_INDIA',
    };

    const sig2: GovernedAlternativeDataSignal = {
      companyId: 'INFY',
      signalId: 'SIG-02',
      datasetName: 'CAMPUS_OFFERS',
      signalType: 'HIRING_VELOCITY',
      observedAt: '2026-09-12T00:00:00.000Z',
      value: 150.0,
      unit: 'Index',
      confidenceScore: 0.6,
      approvalRef: 'GOV-APP-ALT-2026-002',
      coverage: 'TIER_1_COLLEGES',
    };

    altEngine.ingestSignal(sig1);
    altEngine.ingestSignal(sig2);

    // Compute composite signal as of 2026-09-15
    // Weighted Value = (100 * 0.9 + 150 * 0.6) / (0.9 + 0.6) = (90 + 90) / 1.5 = 180 / 1.5 = 120.0
    const composite = altEngine.computeCompositeSignal({
      companyId: 'INFY',
      signalType: 'HIRING_VELOCITY',
      asOf: '2026-09-15T00:00:00.000Z',
    });

    assert.ok(composite);
    assert.strictEqual(composite.weightedValue, 120.0);
    assert.strictEqual(composite.constituentCount, 2);
    assert.strictEqual(composite.approvalRefs.length, 2);
    assert.strictEqual(composite.qualityState, 'GOOD');
  });
});
