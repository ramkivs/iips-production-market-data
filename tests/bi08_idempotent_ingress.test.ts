/**
 * Institutional Investment Platform System (IIPS)
 * Workstream BI-08: Idempotent Multi-Broker Ingress & Content-Hash Deduplication Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-08-AUTH-2026-01 / NON_PRODUCTION_SINGLE_OPERATOR_IDENTITY_BYPASS
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BrokerImportIngressOrchestrator,
  PortfolioBrokerImportController,
  PortfolioStore,
  UserHoldingInput,
} from '../frontend/src/features/portfolio/index.js';
import { getGovernedBroadSecurityMaster } from '../src/identity/governed_fixture_master.js';

const ZERODHA_CSV_1 = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
RELIANCE,10,2500.00,2600.00,26000.00,1000.00,4.00,0.10
TCS,20,3500.00,3600.00,72000.00,2000.00,2.86,0.10
INFY,30,1400.00,1500.00,45000.00,3000.00,7.14,0.10`;

const DHAN_WEB_UI_CSV_1 = `Name, Quantity, Avg Price, Last Traded, Investment, Current Value, P&L, P&L %
HDFCBANK, 50, 1600.00, 1650.00, 80000.00, 82500.00, 2500.00, 3.12
ICICIBANK, 40, 1000.00, 1050.00, 40000.00, 42000.00, 2000.00, 5.00
AIIL, 100, 150.00, 160.00, 15000.00, 16000.00, 1000.00, 6.67
AGI GREENPAC, 25, 800.00, 850.00, 20000.00, 21250.00, 1250.00, 6.25`;

const GROWW_CSV_1 = `Stock Name,Symbol,ISIN,Shares,Average Price,Current Value,Total Returns,Total Returns %,XIRR
State Bank of India,SBIN,INE062A01020,100,750.00,80000.00,5000.00,6.67,12.50
ITC Limited,ITC,INE154A01025,200,400.00,84000.00,4000.00,5.00,10.20`;

const UNMAPPED_OPERATOR_CSV = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
ASK AUTOMOTIVE,100,300.00,350.00,35000.00,5000.00,16.67,1.20
AMBUJACEM,50,600.00,620.00,31000.00,1000.00,3.33,0.50
RELIANCE,10,2500.00,2600.00,26000.00,1000.00,4.00,0.10`;

test('BI-08: Idempotent Multi-Broker Ingress & Content-Hash Deduplication Suite', async (t) => {
  const securityMaster = getGovernedBroadSecurityMaster();

  await t.test('AC-01: Re-uploading exact same CSV leaves valuation and quantities identical (B - A = 0)', () => {
    const store = new PortfolioStore();

    // Import 1
    const res1 = BrokerImportIngressOrchestrator.executeIngress({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha.csv',
      securityMaster,
    });
    const save1 = store.saveHoldings('DEFAULT_PORTFOLIO', res1.userHoldings, {
      sourceBroker: res1.provenance.sourceBroker,
      fileName: res1.provenance.fileName,
      contentDigest: res1.provenance.contentDigest,
      lineageDigest: res1.provenance.lineageDigest,
    });
    assert.strictEqual(save1.success, true);
    const p1 = store.getPortfolio('DEFAULT_PORTFOLIO')!;
    const valA = p1.totalMarketValue;
    const countA = p1.totalHoldingsCount;
    const relA = p1.holdings.find((h: UserHoldingInput) => h.symbol === 'RELIANCE')!.quantity;

    // Import 2 with exact same CSV bytes
    const res2 = BrokerImportIngressOrchestrator.executeIngress({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha.csv',
      securityMaster,
    });
    const save2 = store.saveHoldings('DEFAULT_PORTFOLIO', res2.userHoldings, {
      sourceBroker: res2.provenance.sourceBroker,
      fileName: res2.provenance.fileName,
      contentDigest: res2.provenance.contentDigest,
      lineageDigest: res2.provenance.lineageDigest,
    });

    assert.strictEqual(save2.success, true);
    assert.strictEqual(save2.isDuplicate, true);
    assert.strictEqual(save2.disposition, 'ALREADY_IMPORTED_NO_OP');

    const p2 = store.getPortfolio('DEFAULT_PORTFOLIO')!;
    assert.strictEqual(p2.totalMarketValue, valA, 'Market value MUST not double');
    assert.strictEqual(p2.totalHoldingsCount, countA, 'Holding count MUST remain identical');
    assert.strictEqual(
      p2.holdings.find((h: UserHoldingInput) => h.symbol === 'RELIANCE')!.quantity,
      relA,
      'Holding quantity MUST NOT double'
    );
  });

  await t.test('AC-02: Provenance digest remains invariant on duplicate re-upload', () => {
    const store = new PortfolioStore();

    const res1 = BrokerImportIngressOrchestrator.executeIngress({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha.csv',
      securityMaster,
    });
    const save1 = store.saveHoldings('DEFAULT_PORTFOLIO', res1.userHoldings, {
      contentDigest: res1.provenance.contentDigest,
      lineageDigest: res1.provenance.lineageDigest,
    });

    const digestA = store.getPortfolio('DEFAULT_PORTFOLIO')!.provenanceDigest;

    // Re-import
    const res2 = BrokerImportIngressOrchestrator.executeIngress({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha.csv',
      securityMaster,
    });
    const save2 = store.saveHoldings('DEFAULT_PORTFOLIO', res2.userHoldings, {
      contentDigest: res2.provenance.contentDigest,
      lineageDigest: res2.provenance.lineageDigest,
    });

    const digestB = store.getPortfolio('DEFAULT_PORTFOLIO')!.provenanceDigest;
    assert.strictEqual(digestB, digestA, 'Provenance digest MUST be identical on duplicate import');
  });

  await t.test('AC-03: Contributions ledger length remains 1 (zero duplicate audit records)', () => {
    const store = new PortfolioStore();

    const res1 = BrokerImportIngressOrchestrator.executeIngress({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha.csv',
      securityMaster,
    });
    store.saveHoldings('DEFAULT_PORTFOLIO', res1.userHoldings, {
      sourceBroker: res1.provenance.sourceBroker,
      fileName: res1.provenance.fileName,
      contentDigest: res1.provenance.contentDigest,
      lineageDigest: res1.provenance.lineageDigest,
    });

    // Re-import 3 times
    for (let i = 0; i < 3; i++) {
      const res = BrokerImportIngressOrchestrator.executeIngress({
        content: ZERODHA_CSV_1,
        fileName: 'zerodha.csv',
        securityMaster,
      });
      store.saveHoldings('DEFAULT_PORTFOLIO', res.userHoldings, {
        sourceBroker: res.provenance.sourceBroker,
        fileName: res.provenance.fileName,
        contentDigest: res.provenance.contentDigest,
        lineageDigest: res.provenance.lineageDigest,
      });
    }

    const contributions = store.getPortfolio('DEFAULT_PORTFOLIO')!.contributions || [];
    assert.strictEqual(contributions.length, 1, 'Contributions ledger MUST contain exactly 1 entry');
  });

  await t.test('AC-04: Multi-broker consolidation across distinct broker files preserves exact 100.0000% weight sum', () => {
    const store = new PortfolioStore();

    // Import 1: Zerodha (3 holdings)
    const res1 = BrokerImportIngressOrchestrator.executeIngress({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha.csv',
      securityMaster,
    });
    store.saveHoldings('DEFAULT_PORTFOLIO', res1.userHoldings, {
      sourceBroker: 'ZERODHA',
      fileName: 'zerodha.csv',
      contentDigest: res1.provenance.contentDigest,
      lineageDigest: res1.provenance.lineageDigest,
    });

    // Import 2: Dhan Web UI (4 holdings, distinct content digest)
    const res2 = BrokerImportIngressOrchestrator.executeIngress({
      content: DHAN_WEB_UI_CSV_1,
      fileName: 'dhan.csv',
      securityMaster,
    });
    const save2 = store.saveHoldings('DEFAULT_PORTFOLIO', res2.userHoldings, {
      sourceBroker: 'DHAN_WEB_UI_SUMMARY_V1',
      fileName: 'dhan.csv',
      contentDigest: res2.provenance.contentDigest,
      lineageDigest: res2.provenance.lineageDigest,
    });

    assert.strictEqual(save2.success, true);
    assert.strictEqual(save2.isDuplicate, undefined);

    // Import 3: Groww (2 holdings, distinct content digest)
    const res3 = BrokerImportIngressOrchestrator.executeIngress({
      content: GROWW_CSV_1,
      fileName: 'groww.csv',
      securityMaster,
    });
    const save3 = store.saveHoldings('DEFAULT_PORTFOLIO', res3.userHoldings, {
      sourceBroker: 'GROWW',
      fileName: 'groww.csv',
      contentDigest: res3.provenance.contentDigest,
      lineageDigest: res3.provenance.lineageDigest,
    });

    assert.strictEqual(save3.success, true);
    const p = store.getPortfolio('DEFAULT_PORTFOLIO')!;
    assert.strictEqual(p.totalHoldingsCount, 9); // 3 + 4 + 2
    assert.strictEqual(Number(p.weightSumPercentage.toFixed(4)), 100.0);
    assert.strictEqual(p.contributions?.length, 3);
  });

  await t.test('AC-05: UI controller & view-model report informative duplicate feedback on duplicate save', () => {
    const store = new PortfolioStore();
    const controller = new PortfolioBrokerImportController(securityMaster);

    // First save
    controller.selectAndProcessFile({ content: ZERODHA_CSV_1, fileName: 'zerodha.csv', securityMaster });
    const vm1 = controller.confirmAndSave({ portfolioStore: store });
    assert.strictEqual(vm1.state, 'SAVE_SUCCESS');

    // Second save with exact same file
    controller.selectAndProcessFile({ content: ZERODHA_CSV_1, fileName: 'zerodha.csv', securityMaster });
    const vm2 = controller.confirmAndSave({ portfolioStore: store });
    assert.strictEqual(vm2.state, 'SAVE_SUCCESS');
    assert.strictEqual(controller['lastSaveResult']?.isDuplicate, true);
    assert.ok(vm2.accessibility.liveRegionText.includes('Duplicate File Ignored'));
  });

  await t.test('AC-06: Explicit mode: REPLACE bypasses deduplication and resets portfolio state', () => {
    const store = new PortfolioStore();

    // 1st Save (Zerodha: 3 holdings)
    const res1 = BrokerImportIngressOrchestrator.executeIngress({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha.csv',
      securityMaster,
    });
    store.saveHoldings('DEFAULT_PORTFOLIO', res1.userHoldings, {
      contentDigest: res1.provenance.contentDigest,
      lineageDigest: res1.provenance.lineageDigest,
    });

    // 2nd Save with mode: 'REPLACE' using same file
    const saveReplace = store.saveHoldings('DEFAULT_PORTFOLIO', res1.userHoldings, {
      mode: 'REPLACE',
      contentDigest: res1.provenance.contentDigest,
      lineageDigest: res1.provenance.lineageDigest,
    });

    assert.strictEqual(saveReplace.success, true);
    assert.strictEqual(saveReplace.isDuplicate, undefined);
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')!.totalHoldingsCount, 3);
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')!.contributions?.length, 1);
  });

  await t.test('AC-07: Non-production operator bypass preserves unmapped securities with zero fabricated IDs', () => {
    const store = new PortfolioStore();

    const res = BrokerImportIngressOrchestrator.executeIngress({
      content: UNMAPPED_OPERATOR_CSV,
      fileName: 'unmapped.csv',
      securityMaster,
      allowNonProductionBypass: true,
      executionEnvironment: 'NON_PRODUCTION',
    });

    const save = store.saveHoldings('DEFAULT_PORTFOLIO', res.userHoldings, {
      contentDigest: res.provenance.contentDigest,
      lineageDigest: res.provenance.lineageDigest,
    });

    assert.strictEqual(save.success, true);
    const p = store.getPortfolio('DEFAULT_PORTFOLIO')!;
    const ask = p.holdings.find((h: UserHoldingInput) => h.symbol === 'ASK AUTOMOTIVE')!;
    assert.ok(ask);
    assert.strictEqual(ask.identityStatus, 'UNRESOLVED');
    assert.strictEqual(ask.companyId, '', 'Zero fake companyId');
  });

  await t.test('AC-08: Production mode fails closed against unmapped securities', () => {
    const prodRes = BrokerImportIngressOrchestrator.executeIngress({
      content: UNMAPPED_OPERATOR_CSV,
      fileName: 'unmapped.csv',
      securityMaster,
      allowNonProductionBypass: true,
      executionEnvironment: 'PRODUCTION',
    });

    assert.strictEqual(prodRes.disposition, 'REJECTED');
    assert.strictEqual(prodRes.userHoldings.length, 0);
  });

  await t.test('Recovery & Reconstruction: resetPortfolio and re-ingress test', () => {
    const store = new PortfolioStore();

    // Populate initial state
    const res1 = BrokerImportIngressOrchestrator.executeIngress({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha.csv',
      securityMaster,
    });
    store.saveHoldings('DEFAULT_PORTFOLIO', res1.userHoldings, {
      contentDigest: res1.provenance.contentDigest,
      lineageDigest: res1.provenance.lineageDigest,
    });
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')!.totalHoldingsCount, 3);

    // Reset portfolio
    const cleanRecord = store.resetPortfolio('DEFAULT_PORTFOLIO');
    assert.strictEqual(cleanRecord.holdings.length, 0);
    assert.strictEqual(cleanRecord.totalMarketValue, 0);
    assert.strictEqual(cleanRecord.isSaved, false);
    assert.strictEqual(cleanRecord.contributions?.length, 0);

    // Re-ingest
    const saveReingest = store.saveHoldings('DEFAULT_PORTFOLIO', res1.userHoldings, {
      contentDigest: res1.provenance.contentDigest,
      lineageDigest: res1.provenance.lineageDigest,
    });
    assert.strictEqual(saveReingest.success, true);
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')!.totalHoldingsCount, 3);
  });
});
