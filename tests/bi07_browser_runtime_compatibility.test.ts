/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: BI-07 Browser Runtime Compatibility & Zero-Buffer Verification
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PortfolioStore,
  PortfolioBrokerImportController,
  BrokerImportIngressOrchestrator,
  BrokerFormatDetector,
} from '../frontend/src/features/portfolio/index.js';
import { ZerodhaHoldingsAdapter } from '../frontend/src/features/portfolio/import/adapters/zerodha-holdings-adapter.js';
import { DhanHoldingsAdapter } from '../frontend/src/features/portfolio/import/adapters/dhan-holdings-adapter.js';
import { GrowwHoldingsAdapter } from '../frontend/src/features/portfolio/import/adapters/groww-holdings-adapter.js';
import { computeSha256, computeLineageHash } from '../src/contracts/provenance.js';
import { SecurityMaster } from '../src/identity/security_master.js';

function createGovernedSecurityMaster(): SecurityMaster {
  const sm = new SecurityMaster();

  sm.registerEntity({
    companyId: 'EQ_RELIANCE_IN',
    companyName: 'Reliance Industries Limited',
    isin: 'INE002A01018',
    industry: 'Oil & Gas',
    sector: 'ENERGY',
    listings: [{ exchange: 'NSE', symbol: 'RELIANCE', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
    effectiveFrom: '2020-01-01T00:00:00.000Z',
  });

  sm.registerEntity({
    companyId: 'EQ_INFY_IN',
    companyName: 'Infosys Limited',
    isin: 'INE009A01021',
    industry: 'IT Services',
    sector: 'IT',
    listings: [{ exchange: 'NSE', symbol: 'INFY', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
    effectiveFrom: '2020-01-01T00:00:00.000Z',
  });

  sm.registerEntity({
    companyId: 'EQ_TCS_IN',
    companyName: 'Tata Consultancy Services Limited',
    isin: 'INE467B01029',
    industry: 'IT Services',
    sector: 'IT',
    listings: [{ exchange: 'NSE', symbol: 'TCS', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
    effectiveFrom: '2020-01-01T00:00:00.000Z',
  });

  return sm;
}

const ZERODHA_CSV = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
RELIANCE,10,2500.00,2600.00,26000.00,1000.00,4.00,0.50
INFY,20,1500.00,1600.00,32000.00,2000.00,6.67,-0.25`;

const DHAN_CSV = `Trading Symbol,ISIN,Exchange,Total Qty,DP Qty,Available Qty,Average Buy Price,Last Traded Price,Current Value,Profit / Loss,P&L %
RELIANCE,INE002A01018,NSE,10,10,10,2500.00,2600.00,26000.00,1000.00,4.00
INFY,INE009A01021,NSE,20,20,20,1500.00,1600.00,32000.00,2000.00,6.67`;

const GROWW_CSV = `Stock Name,Symbol,ISIN,Shares,Average Price,Current Value,Total Returns,Total Returns %,XIRR
Reliance Industries,RELIANCE,INE002A01018,10,2500.00,26000.00,1000.00,4.00,12.50
Infosys Ltd,INFY,INE009A01021,20,1500.00,32000.00,2000.00,6.67,10.20`;

/**
 * Runs a function in an environment simulating a browser where `Buffer` is undefined.
 */
function runWithoutBuffer<T>(fn: () => T): T {
  const originalBuffer = (globalThis as any).Buffer;
  try {
    delete (globalThis as any).Buffer;
    return fn();
  } finally {
    (globalThis as any).Buffer = originalBuffer;
  }
}

describe('BI-07: Browser Runtime Compatibility & Zero-Buffer Suite', () => {
  it('BROWSER-01: computeSha256 produces exact FIPS 180-4 standard digests without Buffer in browser runtime', () => {
    runWithoutBuffer(() => {
      // Empty string
      const emptyHash = computeSha256('');
      assert.strictEqual(emptyHash, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

      // Test string
      const strHash = computeSha256('Hello World! IIPS Market Data Testing 2026');
      assert.strictEqual(strHash, '5c6cfc88ec2a03914ac3af4c0fe97a7960aa48f50814378669f13d71af98c238');

      // Uint8Array input
      const bytes = new TextEncoder().encode('Hello World! IIPS Market Data Testing 2026');
      const uint8Hash = computeSha256(bytes);
      assert.strictEqual(uint8Hash, strHash);

      // ArrayBuffer input
      const abHash = computeSha256(bytes.buffer);
      assert.strictEqual(abHash, strHash);
    });
  });

  it('BROWSER-02: computeLineageHash computes deterministic digests without Buffer in browser runtime', () => {
    runWithoutBuffer(() => {
      const payload = { portfolioId: 'DEFAULT', holdings: [{ symbol: 'INFY', qty: 10 }] };
      const metadata = { sourceClassification: 'REAL', asOf: '2026-09-21T00:00:00.000Z', dataVersion: 'v1.0.0-bi07' };

      const hash1 = computeLineageHash(payload, metadata);
      const hash2 = computeLineageHash(payload, metadata);

      assert.strictEqual(typeof hash1, 'string');
      assert.strictEqual(hash1.length, 64);
      assert.strictEqual(hash1, hash2);
    });
  });

  it('BROWSER-03: BrokerFormatDetector identifies CSV formats without Buffer', () => {
    runWithoutBuffer(() => {
      const zerodhaRes = BrokerFormatDetector.detectFormat(ZERODHA_CSV, 'zerodha.csv');
      assert.strictEqual(zerodhaRes.brokerType, 'ZERODHA');
      assert.strictEqual(zerodhaRes.format, 'CSV');

      const dhanRes = BrokerFormatDetector.detectFormat(DHAN_CSV, 'dhan.csv');
      assert.strictEqual(dhanRes.brokerType, 'DHAN');

      const growwRes = BrokerFormatDetector.detectFormat(GROWW_CSV, 'groww.csv');
      assert.strictEqual(growwRes.brokerType, 'GROWW');

      // Binary XLSX detection via ArrayBuffer / Uint8Array magic bytes
      const zipBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
      const xlsxRes = BrokerFormatDetector.detectFormat(zipBytes, 'report.xlsx');
      assert.strictEqual(xlsxRes.format, 'XLSX');
      assert.strictEqual(xlsxRes.requiresXlsx, true);
    });
  });

  it('BROWSER-04: Offline Adapters parse CSV strings cleanly in browser runtime', () => {
    runWithoutBuffer(() => {
      const zerodha = new ZerodhaHoldingsAdapter();
      const zRes = zerodha.parse(ZERODHA_CSV);
      assert.strictEqual(zRes.success, true);
      assert.strictEqual(zRes.holdings.length, 2);

      const dhan = new DhanHoldingsAdapter();
      const dRes = dhan.parse(DHAN_CSV);
      assert.strictEqual(dRes.success, true);
      assert.strictEqual(dRes.holdings.length, 2);

      const groww = new GrowwHoldingsAdapter();
      const gRes = groww.parse(GROWW_CSV);
      assert.strictEqual(gRes.success, true);
      assert.strictEqual(gRes.holdings.length, 2);
    });
  });

  it('BROWSER-05: Offline Adapters handle ArrayBuffer and Uint8Array inputs without Buffer', () => {
    runWithoutBuffer(() => {
      const zerodha = new ZerodhaHoldingsAdapter();
      const encoder = new TextEncoder();
      const uint8 = encoder.encode(ZERODHA_CSV);

      const uint8Res = zerodha.parse(uint8);
      assert.strictEqual(uint8Res.success, true);
      assert.strictEqual(uint8Res.holdings.length, 2);

      const abRes = zerodha.parse(uint8.buffer);
      assert.strictEqual(abRes.success, true);
      assert.strictEqual(abRes.holdings.length, 2);
    });
  });

  it('BROWSER-06: BrokerImportIngressOrchestrator processes string content without Buffer', () => {
    runWithoutBuffer(() => {
      const sm = createGovernedSecurityMaster();
      const result = BrokerImportIngressOrchestrator.executeIngress({
        content: ZERODHA_CSV,
        fileName: 'zerodha.csv',
        securityMaster: sm,
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.disposition, 'READY_FOR_PORTFOLIO_SAVE');
      assert.strictEqual(result.validHoldingsCount, 2);
      assert.strictEqual(result.weightSumPercentage, 100.0);
      assert.ok(result.provenance.contentDigest);
      assert.ok(result.provenance.lineageDigest);
    });
  });

  it('BROWSER-07: BrokerImportIngressOrchestrator processes empty and blank files without Buffer', () => {
    runWithoutBuffer(() => {
      const emptyResult = BrokerImportIngressOrchestrator.executeIngress({
        content: '',
        fileName: 'empty.csv',
      });
      assert.strictEqual(emptyResult.success, false);
      assert.strictEqual(emptyResult.disposition, 'REJECTED');
      assert.strictEqual(emptyResult.rejections[0].reason, 'EMPTY_FILE');

      const blankResult = BrokerImportIngressOrchestrator.executeIngress({
        content: '   \n\n  \t  \n',
        fileName: 'blank.csv',
      });
      assert.strictEqual(blankResult.success, false);
      assert.strictEqual(blankResult.disposition, 'REJECTED');
      assert.strictEqual(blankResult.rejections[0].reason, 'BLANK_FILE');
    });
  });

  it('BROWSER-08: PortfolioBrokerImportController runs end-to-end selectAndProcessFile in browser runtime', () => {
    runWithoutBuffer(() => {
      const sm = createGovernedSecurityMaster();
      const controller = new PortfolioBrokerImportController(sm);

      const vm = controller.selectAndProcessFile({
        content: ZERODHA_CSV,
        fileName: 'zerodha_holdings.csv',
        viewportWidth: 1280,
        securityMaster: sm,
      });

      assert.strictEqual(vm.state, 'READY_TO_SAVE');
      assert.strictEqual(vm.sourceBroker, 'ZERODHA');
      assert.strictEqual(vm.acceptedHoldingsCount, 2);
      assert.strictEqual(vm.saveGuard.isSaveEnabled, true);
      assert.strictEqual(vm.totalNormalizedWeight, 100.0);

      const store = new PortfolioStore();
      const saveVm = controller.confirmAndSave({
        portfolioStore: store,
        portfolioId: 'DEFAULT_PORTFOLIO',
      });

      assert.strictEqual(saveVm.state, 'SAVE_SUCCESS');
      assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')?.holdings.length, 2);
    });
  });

  it('BROWSER-09: PortfolioStore saveHoldings and getAnalytics run deterministically in browser runtime', () => {
    runWithoutBuffer(() => {
      const store = new PortfolioStore();
      const holdings = [
        {
          symbol: 'RELIANCE',
          companyId: 'EQ_RELIANCE_IN',
          quantity: 10,
          averageBuyPrice: 2500,
          currentPrice: 2600,
          marketValue: 26000,
          weightPercentage: 50.0,
          active: true,
          sourceBroker: 'ZERODHA' as const,
          lineageDigest: 'abc123digest',
        },
        {
          symbol: 'INFY',
          companyId: 'EQ_INFY_IN',
          quantity: 20,
          averageBuyPrice: 1500,
          currentPrice: 1600,
          marketValue: 32000,
          weightPercentage: 50.0,
          active: true,
          sourceBroker: 'ZERODHA' as const,
          lineageDigest: 'def456digest',
        },
      ];

      const saveRes = store.saveHoldings('DEFAULT_PORTFOLIO', holdings);
      assert.strictEqual(saveRes.success, true);
      assert.strictEqual(saveRes.holdingsSavedCount, 2);
      assert.ok(saveRes.provenanceDigest);

      const analytics = store.getAnalytics('DEFAULT_PORTFOLIO');
      assert.strictEqual(analytics.holdingsCount, 2);
      assert.strictEqual(analytics.topHoldings.length, 2);
    });
  });
});
