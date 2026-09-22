/**
 * Institutional Investment Platform System (IIPS)
 * Gate: GATE-E2E-BROAD-UNIVERSE-MULTI-BROKER-INTEGRATION-VERIFICATION
 * Dedicated End-to-End Multi-Broker & Application Surface Integration Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001
 * Execution Mode: OFFLINE / NON_PRODUCTION / GOVERNED E2E QUALIFICATION
 *
 * Platform Policy:
 * - Live Providers = 0
 * - Commercial Providers = 0
 * - Production Feeds = NOT AUTHORIZED
 */

import { describe, it, before } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import {
  SecurityMaster,
  getGovernedBroadSecurityMaster,
  IdentityAmbiguityError,
} from '../src/identity/index.js';
import {
  BrokerImportIngressOrchestrator,
  BrokerIngressRequest,
  UserHoldingInput,
} from '../frontend/src/features/portfolio/import/index.js';
import {
  PortfolioStore,
  getDefaultPortfolioStore,
  resetDefaultPortfolioStore,
} from '../frontend/src/features/portfolio/portfolio-store.js';
import { ObjectResolverService } from '../src/transports/object_resolver.js';
import { UI08SecurityMasterModalBuilder } from '../src/ui/view_models/ui08_security_master_modal.js';
import { UI02ExecutiveSummaryBuilder } from '../src/ui/view_models/ui02_executive_summary.js';
import { EngineApiAdapter } from '../src/transports/engine_api_adapter.js';

describe('GATE-E2E-BROAD-UNIVERSE-MULTI-BROKER-INTEGRATION-VERIFICATION', () => {
  let securityMaster: SecurityMaster;
  let resolverService: ObjectResolverService;

  const EXPECTED_CHECKSUM = '7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5';
  const EXPECTED_RECORD_COUNT = 2250;

  before(() => {
    securityMaster = getGovernedBroadSecurityMaster();
    resolverService = new ObjectResolverService(securityMaster);
    resetDefaultPortfolioStore();
  });

  // ============================================================
  // PHASE 1 — BASELINE / LINEAGE & D05 BYTE-INTEGRITY
  // ============================================================
  it('Phase 1: D05 package and manifest remain byte-identical to qualified deposition (SHA-256 + 2250 count)', () => {
    const pkgPath = path.resolve(process.cwd(), 'evidence/operator_drop/d05_security_master_broad_universe.json');
    const manifestPath = path.resolve(process.cwd(), 'evidence/operator_drop/d05_security_master_manifest.json');

    assert.strictEqual(fs.existsSync(pkgPath), true, 'D05 package file must exist');
    assert.strictEqual(fs.existsSync(manifestPath), true, 'D05 manifest file must exist');

    const pkgBytes = fs.readFileSync(pkgPath);
    const actualChecksum = crypto.createHash('sha256').update(pkgBytes).digest('hex');
    assert.strictEqual(actualChecksum, EXPECTED_CHECKSUM, 'D05 package SHA-256 must match exactly');

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.strictEqual(manifest.fileChecksumSha256, EXPECTED_CHECKSUM, 'Manifest checksum must match');
    assert.strictEqual(manifest.recordCount, EXPECTED_RECORD_COUNT, 'Manifest record count must be 2,250');
    assert.strictEqual(manifest.selectedTier, 'TIER_2_ACTIVE_NSE_CM', 'Selected tier must be TIER_2_ACTIVE_NSE_CM');
    assert.strictEqual(manifest.aiilRuling, 'RULING_3_DUAL_EFFECTIVE_DATED_MAPPING', 'AIIL ruling must be RULING_3');

    const records = JSON.parse(pkgBytes.toString('utf8'));
    assert.strictEqual(records.length, EXPECTED_RECORD_COUNT, 'Physical record count in package must equal 2,250');
  });

  // ============================================================
  // PHASE 2 — MULTI-BROKER INGESTION E2E
  // ============================================================
  it('Phase 2A: Zerodha Kite CSV end-to-end ingestion and canonical companyId assignment', () => {
    const zerodhaCsv = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
INFY,100,1450.50,1520.00,152000.00,6950.00,4.79,0.50
TCS,50,3800.00,3950.00,197500.00,7500.00,3.95,-0.20
RELIANCE,80,2800.00,2900.00,232000.00,8000.00,3.57,1.10
HDFCBANK,120,1600.00,1650.00,198000.00,6000.00,3.12,0.80
HDFCLIFE,60,620.00,640.00,38400.00,1200.00,3.23,0.45
AIIL,200,85.00,92.00,18400.00,1400.00,8.24,1.50
AGI,150,450.00,480.00,72000.00,4500.00,6.67,0.90
INFY,-10,1450.50,1520.00,-15200.00,-695.00,0,0
TCS,50,0.00,0.00,0.00,0.00,0,0`;

    const request: BrokerIngressRequest = {
      content: zerodhaCsv,
      fileName: 'zerodha_holdings_flagship.csv',
      securityMaster,
    };

    const result = BrokerImportIngressOrchestrator.executeIngress(request);
    assert.strictEqual(result.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(result.detection.brokerType, 'ZERODHA');
    assert.strictEqual(result.userHoldings.length, 7, '7 valid rows must be parsed (malformed excluded)');

    const expectedMap: Record<string, string> = {
      INFY: 'EQ_INFY_IN',
      TCS: 'EQ_TCS_IN',
      RELIANCE: 'EQ_RELIANCE_IN',
      HDFCBANK: 'EQ_HDFCBANK_IN',
      HDFCLIFE: 'EQ_HDFCLIFE_IN',
      AIIL: 'EQ_AIIL_IN',
      AGI: 'EQ_AGI_IN',
    };

    for (const h of result.userHoldings) {
      assert.strictEqual(h.companyId, expectedMap[h.symbol], `Symbol ${h.symbol} must map to ${expectedMap[h.symbol]}`);
      assert.notStrictEqual(h.companyId, h.symbol, 'Raw broker symbol must NOT leak as companyId');
    }

    // Check weight normalization
    const totalWeight = result.userHoldings.reduce((sum: number, h: UserHoldingInput) => sum + h.weightPercentage, 0);
    assert.strictEqual(Math.round(totalWeight * 10000) / 10000, 100.0000, 'Weights must sum to exact 100%');
  });

  it('Phase 2B: Dhan Detailed V1 CSV end-to-end ingestion and ISIN-first resolution', () => {
    const dhanCsv = `Trading Symbol,ISIN,Exchange,Total Qty,DP Qty,Available Qty,Average Buy Price,Last Traded Price,Current Value,Profit / Loss,P&L %
INFY,INE009A01021,NSE,100,100,100,1450.50,1520.00,152000.00,6950.00,4.79
TCS,INE467B01029,NSE,50,50,50,3800.00,3950.00,197500.00,7500.00,3.95
HDFCBANK,INE040A01034,NSE,120,120,120,1600.00,1650.00,198000.00,6000.00,3.12
RELIANCE,INE002A01018,NSE,80,80,80,2800.00,2900.00,232000.00,8000.00,3.57
AIIL,INE206F01022,NSE,200,200,200,85.00,92.00,18400.00,1400.00,8.24
AGI,INE415A01038,NSE,150,150,150,450.00,480.00,72000.00,4500.00,6.67
HDFCLIFE,INE795G01014,NSE,60,60,60,620.00,640.00,38400.00,1200.00,3.23`;

    const request: BrokerIngressRequest = {
      content: dhanCsv,
      fileName: 'dhan_detailed_holdings.csv',
      securityMaster,
    };

    const result = BrokerImportIngressOrchestrator.executeIngress(request);
    assert.strictEqual(result.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(result.detection.brokerType, 'DHAN');
    assert.strictEqual(result.userHoldings.length, 7);

    const isinExpectedMap: Record<string, string> = {
      INE009A01021: 'EQ_INFY_IN',
      INE467B01029: 'EQ_TCS_IN',
      INE040A01034: 'EQ_HDFCBANK_IN',
      INE002A01018: 'EQ_RELIANCE_IN',
      INE206F01022: 'EQ_AIIL_IN',
      INE415A01038: 'EQ_AGI_IN',
      INE795G01014: 'EQ_HDFCLIFE_IN',
    };

    for (const h of result.userHoldings) {
      assert.ok(h.isin, `Holding ${h.symbol} must have ISIN`);
      assert.strictEqual(h.companyId, isinExpectedMap[h.isin!], `ISIN ${h.isin} must resolve to ${isinExpectedMap[h.isin!]}`);
    }
  });

  it('Phase 2C: Dhan Web UI Summary V1 ingestion with exact AGI GREENPAC alias resolution', () => {
    const dhanSummaryCsv = `Name, Quantity, Avg Price, Last Traded, Investment, Current Value, P&L, P&L %
INFY, 100, 1450.50, 1520.00, 145050.00, 152000.00, 6950.00, 4.79
TCS, 50, 3800.00, 3950.00, 190000.00, 197500.00, 7500.00, 3.95
RELIANCE, 80, 2800.00, 2900.00, 224000.00, 232000.00, 8000.00, 3.57
AGI GREENPAC, 150, 450.00, 480.00, 67500.00, 72000.00, 4500.00, 6.67`;

    const request: BrokerIngressRequest = {
      content: dhanSummaryCsv,
      fileName: 'Portfolio(1).csv',
      securityMaster,
    };

    const result = BrokerImportIngressOrchestrator.executeIngress(request);
    assert.strictEqual(result.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(result.userHoldings.length, 4);

    const agiHolding = result.userHoldings.find((h: UserHoldingInput) => h.companyId === 'EQ_AGI_IN');
    assert.ok(agiHolding, 'AGI GREENPAC must resolve to canonical EQ_AGI_IN via exact alias');
    assert.strictEqual(agiHolding.companyId, 'EQ_AGI_IN');
    assert.strictEqual(agiHolding.quantity, 150);
  });

  it('Phase 2D: Groww Stocks CSV end-to-end ingestion and canonical persistence', () => {
    const growwCsv = `Stock Name,Symbol,ISIN,Shares,Average Price,Current Value,Total Returns,Total Returns %,XIRR
Infosys Ltd,INFY,INE009A01021,100,1450.50,152000.00,6950.00,4.79,12.50
Tata Consultancy Services,TCS,INE467B01029,50,3800.00,197500.00,7500.00,3.95,10.20
Reliance Industries,RELIANCE,INE002A01018,80,2800.00,232000.00,8000.00,3.57,9.80`;

    const request: BrokerIngressRequest = {
      content: growwCsv,
      fileName: 'groww_stocks.csv',
      securityMaster,
    };

    const result = BrokerImportIngressOrchestrator.executeIngress(request);
    assert.strictEqual(result.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(result.detection.brokerType, 'GROWW');
    assert.strictEqual(result.userHoldings.length, 3);
    assert.strictEqual(result.userHoldings[0].companyId, 'EQ_INFY_IN');
    assert.strictEqual(result.userHoldings[1].companyId, 'EQ_TCS_IN');
    assert.strictEqual(result.userHoldings[2].companyId, 'EQ_RELIANCE_IN');
  });

  // ============================================================
  // PHASE 3 — ATOMIC PORTFOLIO PERSISTENCE & MULTI-BROKER MERGE
  // ============================================================
  it('Phase 3: Governed Multi-Broker Atomic Merge persistence across multiple broker imports', () => {
    const store = new PortfolioStore();

    // 1. Ingest Zerodha batch
    const zerodhaCsv = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
INFY,100,1400.00,1500.00,150000.00,10000.00,7.14,0.50
TCS,50,3800.00,4000.00,200000.00,10000.00,5.26,-0.20`;

    const zRes = BrokerImportIngressOrchestrator.executeIngress({
      content: zerodhaCsv,
      fileName: 'zerodha.csv',
      securityMaster,
    });

    const save1 = store.saveHoldings('PORTFOLIO_E2E', zRes.userHoldings, {
      mode: 'MERGE',
      sourceBroker: 'ZERODHA',
      fileName: 'zerodha.csv',
      contentDigest: zRes.provenance.contentDigest,
      lineageDigest: zRes.provenance.lineageDigest,
    });

    assert.strictEqual(save1.success, true);
    assert.strictEqual(save1.holdingsSavedCount, 2);
    assert.strictEqual(save1.weightSumPercentage, 100.0000);

    // 2. Ingest Dhan batch (with overlapping INFY and new AIIL)
    const dhanCsv = `Trading Symbol,ISIN,Exchange,Total Qty,DP Qty,Available Qty,Average Buy Price,Last Traded Price,Current Value,Profit / Loss,P&L %
INFY,INE009A01021,NSE,50,50,50,1500.00,1500.00,75000.00,0.00,0.00
AIIL,INE206F01022,NSE,100,100,100,90.00,100.00,10000.00,1000.00,11.11`;

    const dRes = BrokerImportIngressOrchestrator.executeIngress({
      content: dhanCsv,
      fileName: 'dhan.csv',
      securityMaster,
    });

    const save2 = store.saveHoldings('PORTFOLIO_E2E', dRes.userHoldings, {
      mode: 'MERGE',
      sourceBroker: 'DHAN',
      fileName: 'dhan.csv',
      contentDigest: dRes.provenance.contentDigest,
      lineageDigest: dRes.provenance.lineageDigest,
    });

    assert.strictEqual(save2.success, true);
    assert.strictEqual(save2.holdingsSavedCount, 3, 'Merged portfolio must contain exactly 3 canonical entities');
    assert.strictEqual(save2.weightSumPercentage, 100.0000, 'Merged weights must equal exact 100.0000%');

    const mergedPortfolio = store.getPortfolio('PORTFOLIO_E2E');
    assert.ok(mergedPortfolio);

    // Verify INFY aggregation:
    // Zerodha: 100 qty @ 1400 = 140,000 cost. Dhan: 50 qty @ 1500 = 75,000 cost.
    // Total Qty = 150. Volume-weighted avg price = (140,000 + 75,000) / 150 = 1433.3333333333333.
    const mergedInfy = mergedPortfolio.holdings.find((h) => h.companyId === 'EQ_INFY_IN');
    assert.ok(mergedInfy);
    assert.strictEqual(mergedInfy.quantity, 150);
    assert.strictEqual(Math.round(mergedInfy.averageBuyPrice * 100) / 100, 1433.33);

    // Verify AIIL is present
    const mergedAiil = mergedPortfolio.holdings.find((h) => h.companyId === 'EQ_AIIL_IN');
    assert.ok(mergedAiil);
    assert.strictEqual(mergedAiil.quantity, 100);

    // Verify contributions tracking
    assert.strictEqual(mergedPortfolio.contributions?.length, 2);
  });

  // ============================================================
  // PHASE 4 — IDENTITY CONSISTENCY ACROSS PRODUCT SURFACES
  // ============================================================
  it('Phase 4: Canonical entity consistency across Security Master, ObjectResolver, UI08 Modal, UI02 Exec Summary', () => {
    const traceEntities = [
      { ticker: 'INFY', isin: 'INE009A01021', companyId: 'EQ_INFY_IN', name: 'Infosys Limited' },
      { ticker: 'TCS', isin: 'INE467B01029', companyId: 'EQ_TCS_IN', name: 'Tata Consultancy Services Limited' },
      { ticker: 'RELIANCE', isin: 'INE002A01018', companyId: 'EQ_RELIANCE_IN', name: 'Reliance Industries Limited' },
      { ticker: 'HDFCBANK', isin: 'INE040A01034', companyId: 'EQ_HDFCBANK_IN', name: 'HDFC Bank Limited' },
      { ticker: 'HDFCLIFE', isin: 'INE795G01014', companyId: 'EQ_HDFCLIFE_IN', name: 'HDFC Life Insurance Company Limited' },
      { ticker: 'AIIL', isin: 'INE206F01022', companyId: 'EQ_AIIL_IN', name: 'Authum Investment & Infrastructure Limited' },
      { ticker: 'AGI', isin: 'INE415A01038', companyId: 'EQ_AGI_IN', name: 'AGI Greenpac Limited' },
    ];

    for (const ent of traceEntities) {
      // 1. SecurityMaster resolution via Symbol
      const resolvedFromSymbol = securityMaster.resolveCompanyId({
        identifierType: 'NSE_SYMBOL',
        identifierValue: ent.ticker,
      });
      assert.strictEqual(resolvedFromSymbol, ent.companyId, `Symbol ${ent.ticker} must resolve to ${ent.companyId}`);

      // 2. SecurityMaster resolution via ISIN
      const resolvedFromIsin = securityMaster.resolveCompanyId({
        identifierType: 'ISIN',
        identifierValue: ent.isin,
      });
      assert.strictEqual(resolvedFromIsin, ent.companyId, `ISIN ${ent.isin} must resolve to ${ent.companyId}`);

      // 3. ObjectResolverService (Contract C7)
      const resolvedObject = resolverService.resolveObject({
        identifierType: 'NSE_SYMBOL',
        identifierValue: ent.ticker,
      });
      assert.strictEqual(resolvedObject.companyId, ent.companyId);
      assert.strictEqual(resolvedObject.isin, ent.isin);

      // 4. UI08 Security Master Modal Builder
      const ui08Vm = UI08SecurityMasterModalBuilder.build({
        query: { identifierType: 'NSE_SYMBOL', identifierValue: ent.ticker },
        resolverService,
      });
      assert.strictEqual(ui08Vm.companyId, ent.companyId);
      assert.strictEqual(ui08Vm.surfaceId, 'UI08_SECURITY_MASTER_MODAL');

      // 5. UI02 Executive Summary Dashboard Builder
      const marketDataDto = EngineApiAdapter.createMarketDataDTO({
        quote: {
          companyId: ent.companyId,
          symbol: ent.ticker,
          exchange: 'NSE',
          currency: 'INR',
          bid: 1499.0,
          ask: 1501.0,
          ltp: 1500.0,
          open: 1480.0,
          high: 1510.0,
          low: 1475.0,
          close: 1500.0,
          previousClose: 1470.0,
          change: 30.0,
          pctChange: 2.04,
          volume: 500000,
          vwap: 1495.0,
          tradeCount: 25000,
          turnover: 747500000,
        },
        mode: 'SNAPSHOT',
        asOf: '2026-09-22T00:00:00.000Z',
      });

      const ui02Vm = UI02ExecutiveSummaryBuilder.build({
        marketData: marketDataDto,
        engineScore: {
          companyId: ent.companyId,
          engineId: 'SECTOR_IT',
          rawScore: 88,
          normalizedScore: 88,
          grade: 'A',
          qualityState: 'GOOD',
          factorBreakdown: { valuation: 85, quality: 90, profitability: 92, technical: 82 },
          provenance: {
            sourceClassification: 'REAL',
            vendorTier: 'TIER_1_EXCHANGE',
            asOf: '2026-09-22T00:00:00.000Z',
            receivedAt: '2026-09-22T00:00:00.000Z',
            evaluatedAt: '2026-09-22T00:00:00.000Z',
            dataVersion: 'v1.0.0-score',
            lineageHash: 'test-hash-01',
            qualityState: 'GOOD',
          },
          versionVector: {
            schemaVersion: 'v1.0.0',
            engineVersion: 'v1.0.0',
            securityMasterVersion: 'v1.0.0',
            dataVersionVector: {},
          },
          executionId: 'exec-01',
          evaluatedAt: '2026-09-22T00:00:00.000Z',
          isFallbackApplied: false,
          fallbackFields: [],
        },
        intelligence: {
          companyId: ent.companyId,
          news: {
            newsItems: [],
            totalAvailable: 5,
            filteredCount: 5,
            dominantSentiment: 'BULLISH',
            averageSentimentScore: 0.65,
            qualityState: 'GOOD',
          },
          quality: 'GOOD',
          provenance: marketDataDto.provenance,
        },
        companyName: ent.name,
      });

      assert.strictEqual(ui02Vm.companyId, ent.companyId);
      assert.strictEqual(ui02Vm.surfaceId, 'UI02_EXECUTIVE_SUMMARY');
    }
  });

  // ============================================================
  // PHASE 5 — AIIL END-TO-END QUALIFICATION (RULING 3)
  // ============================================================
  it('Phase 5: AIIL dual effective-dated BSE scrip codes (543989 current & 539177 historical) resolve to EQ_AIIL_IN', () => {
    // Current primary BSE listing (COMPOSITE_TICKER)
    const currentResolution = securityMaster.resolveCompanyId({
      identifierType: 'COMPOSITE_TICKER',
      identifierValue: 'BSE:543989',
      asOf: '2026-09-22T00:00:00.000Z',
    });
    assert.strictEqual(currentResolution, 'EQ_AIIL_IN', 'Current BSE scrip 543989 must resolve to EQ_AIIL_IN');

    // Historical BSE listing (COMPOSITE_TICKER)
    const historicalResolution = securityMaster.resolveCompanyId({
      identifierType: 'COMPOSITE_TICKER',
      identifierValue: 'BSE:539177',
      asOf: '2020-01-01T00:00:00.000Z',
    });
    assert.strictEqual(historicalResolution, 'EQ_AIIL_IN', 'Historical BSE scrip 539177 must resolve to EQ_AIIL_IN');

    // ISIN resolution
    const isinResolution = securityMaster.resolveCompanyId({
      identifierType: 'ISIN',
      identifierValue: 'INE206F01022',
    });
    assert.strictEqual(isinResolution, 'EQ_AIIL_IN');

    // NSE symbol resolution
    const nseResolution = securityMaster.resolveCompanyId({
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'AIIL',
    });
    assert.strictEqual(nseResolution, 'EQ_AIIL_IN');

    // BSE symbol resolution
    const bseResolution = securityMaster.resolveCompanyId({
      identifierType: 'BSE_SYMBOL',
      identifierValue: 'AIIL',
    });
    assert.strictEqual(bseResolution, 'EQ_AIIL_IN');
  });

  // ============================================================
  // PHASE 6 — AGI GREENPAC END-TO-END QUALIFICATION
  // ============================================================
  it('Phase 6: AGI, INE415A01038, BSE 500187, and AGI GREENPAC exact alias resolve to EQ_AGI_IN', () => {
    // 1. Ticker
    assert.strictEqual(
      securityMaster.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'AGI' }),
      'EQ_AGI_IN'
    );
    // 2. ISIN
    assert.strictEqual(
      securityMaster.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE415A01038' }),
      'EQ_AGI_IN'
    );
    // 3. BSE Scrip
    assert.strictEqual(
      securityMaster.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:500187' }),
      'EQ_AGI_IN'
    );
    // 4. Exact Governed Alias
    assert.strictEqual(
      securityMaster.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'AGI GREENPAC' }),
      'EQ_AGI_IN'
    );

    // 5. Ingress through Dhan Web UI summary CSV
    const csv = `Name, Quantity, Avg Price, Last Traded, Investment, Current Value, P&L, P&L %
AGI GREENPAC, 250, 440.00, 480.00, 110000.00, 120000.00, 10000.00, 9.09`;
    const ingressResult = BrokerImportIngressOrchestrator.executeIngress({
      content: csv,
      fileName: 'Portfolio(3).csv',
      securityMaster,
    });
    assert.strictEqual(ingressResult.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(ingressResult.userHoldings[0].companyId, 'EQ_AGI_IN');
  });

  // ============================================================
  // PHASE 7 — MARKET-DATA ASSOCIATION (OFFLINE/SYNTHETIC)
  // ============================================================
  it('Phase 7: Offline market data association for representative universe equities without external network', () => {
    const representativeSymbols = ['INFY', 'TCS', 'RELIANCE', 'HDFCBANK', 'HDFCLIFE', 'AIIL', 'AGI'];

    for (const sym of representativeSymbols) {
      const companyId = securityMaster.resolveCompanyId({
        identifierType: 'NSE_SYMBOL',
        identifierValue: sym,
      });

      assert.ok(companyId.startsWith('EQ_'), `Resolved companyId must be canonical format: ${companyId}`);

      const syntheticQuote = {
        companyId,
        symbol: sym,
        exchange: 'NSE' as const,
        currency: 'INR' as const,
        bid: 999.0,
        ask: 1001.0,
        ltp: 1000.0,
        open: 990.0,
        high: 1010.0,
        low: 985.0,
        close: 1000.0,
        previousClose: 995.0,
        change: 5.0,
        pctChange: 0.50,
        volume: 100000,
        vwap: 998.0,
        tradeCount: 5000,
        turnover: 99800000,
      };

      const dto = EngineApiAdapter.createMarketDataDTO({
        quote: syntheticQuote,
        mode: 'SNAPSHOT',
        asOf: '2026-09-22T00:00:00.000Z',
      });

      assert.strictEqual(dto.companyId, companyId);
      assert.strictEqual(dto.symbol, sym);
      assert.strictEqual(dto.quality, 'GOOD');
      assert.strictEqual(dto.provenance.sourceClassification, 'CANONICAL_MARKET_DATA');
    }
  });

  // ============================================================
  // PHASE 8 — DOWNSTREAM ANALYTICS CONSUMPTION & AGGREGATION
  // ============================================================
  it('Phase 8: PortfolioStore.getAnalytics() consumes authoritative canonical holdings without raw-symbol leakage', () => {
    const store = new PortfolioStore();
    store.saveHoldings(
      'ANALYTICS_TEST_PORTFOLIO',
      [
        {
          symbol: 'INFY',
          companyId: 'EQ_INFY_IN',
          quantity: 100,
          averageBuyPrice: 1450.0,
          currentPrice: 1520.0,
          marketValue: 152000.0,
          weightPercentage: 40.0,
          active: true,
          sourceBroker: 'ZERODHA',
          lineageDigest: 'hash1',
        },
        {
          symbol: 'AIIL',
          companyId: 'EQ_AIIL_IN',
          quantity: 500,
          averageBuyPrice: 85.0,
          currentPrice: 92.0,
          marketValue: 46000.0,
          weightPercentage: 12.1053,
          active: true,
          sourceBroker: 'DHAN',
          lineageDigest: 'hash2',
        },
        {
          symbol: 'AGI GREENPAC',
          companyId: 'EQ_AGI_IN',
          quantity: 200,
          averageBuyPrice: 450.0,
          currentPrice: 480.0,
          marketValue: 96000.0,
          weightPercentage: 25.2632,
          active: true,
          sourceBroker: 'DHAN',
          lineageDigest: 'hash3',
        },
        {
          symbol: 'TCS',
          companyId: 'EQ_TCS_IN',
          quantity: 20,
          averageBuyPrice: 3800.0,
          currentPrice: 4300.0,
          marketValue: 86000.0,
          weightPercentage: 22.6315,
          active: true,
          sourceBroker: 'GROWW',
          lineageDigest: 'hash4',
        },
      ],
      { mode: 'MERGE' }
    );

    const analytics = store.getAnalytics('ANALYTICS_TEST_PORTFOLIO');
    assert.strictEqual(analytics.portfolioId, 'ANALYTICS_TEST_PORTFOLIO');
    assert.strictEqual(analytics.holdingsCount, 4);
    assert.strictEqual(analytics.totalMarketValue, 380000.0);
    assert.strictEqual(analytics.topHoldings.length, 4);
    assert.strictEqual(analytics.topHoldings[0].companyId, 'EQ_INFY_IN');
    assert.strictEqual(analytics.topHoldings[0].weightPercentage, 40.0);
    assert.ok(analytics.topHoldings.some((h) => h.companyId === 'EQ_AIIL_IN'));
    assert.ok(analytics.topHoldings.some((h) => h.companyId === 'EQ_AGI_IN'));
  });

  // ============================================================
  // PHASE 9 — PERSISTENCE & RELOAD DETERMINISM
  // ============================================================
  it('Phase 9: In-memory persistence model verifies deterministic retention and reload stability', () => {
    // Contract verification: PERSISTENCE MODEL = IN-MEMORY / NO DURABLE USER PORTFOLIO STORE
    const store = getDefaultPortfolioStore();

    store.saveHoldings(
      'PERSISTENCE_TEST_PORTFOLIO',
      [
        {
          symbol: 'RELIANCE',
          companyId: 'EQ_RELIANCE_IN',
          quantity: 50,
          averageBuyPrice: 2800.0,
          currentPrice: 2900.0,
          marketValue: 145000.0,
          weightPercentage: 100.0,
          active: true,
          sourceBroker: 'ZERODHA',
          lineageDigest: 'hash-rel',
        },
      ],
      { mode: 'MERGE' }
    );

    // Verify retention via singleton
    const retrieved = getDefaultPortfolioStore().getPortfolio('PERSISTENCE_TEST_PORTFOLIO');
    assert.ok(retrieved);
    assert.strictEqual(retrieved.holdings[0].companyId, 'EQ_RELIANCE_IN');
    assert.strictEqual(retrieved.holdings[0].quantity, 50);
    assert.strictEqual(retrieved.isSaved, true);
  });

  // ============================================================
  // PHASE 10 — FAIL-CLOSED NEGATIVE QUARANTINE & CONTAMINATION DEFENSE
  // ============================================================
  it('Phase 10: Unmapped and malformed securities fail closed without partial portfolio contamination', () => {
    // 1. Unmapped symbol in CSV fails closed
    const unmappedCsv = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
INFY,100,1450.50,1520.00,152000.00,6950.00,4.79,0.50
UNMAPPED_CO,50,100.00,110.00,5500.00,500.00,10.0,1.0`;

    const request: BrokerIngressRequest = {
      content: unmappedCsv,
      fileName: 'unmapped_test.csv',
      securityMaster,
      failOnUnmappedIdentity: true,
    };

    const ingressResult = BrokerImportIngressOrchestrator.executeIngress(request);
    assert.strictEqual(ingressResult.disposition, 'REJECTED');
    assert.strictEqual(ingressResult.success, false);
    assert.ok(ingressResult.errors.some((e: string) => e.includes('UNMAPPED') || e.includes('IdentityAmbiguityError')));

    // 2. Direct SecurityMaster resolution of unmapped entities strictly throws IdentityAmbiguityError
    const unmappedQueries = ['UNMAPPED_CO', 'UNKNOWN_SYM', 'UNKNOWN_CORP', 'DISTRESSED_CO'];
    for (const sym of unmappedQueries) {
      assert.throws(
        () => securityMaster.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: sym }),
        IdentityAmbiguityError,
        `Unmapped symbol ${sym} must throw IdentityAmbiguityError`
      );
    }
  });
});
