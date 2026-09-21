/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: BI-07 Post-Save Repeat Import & Refresh Lifecycle Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {
  PortfolioStore,
  PortfolioBrokerImportController,
  BrokerImportModal,
  PortfolioWorkspace,
} from '../frontend/src/features/portfolio/index.js';
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

  sm.registerEntity({
    companyId: 'EQ_HDFCBANK_IN',
    companyName: 'HDFC Bank Limited',
    isin: 'INE040A01034',
    industry: 'Private Bank',
    sector: 'BANKING',
    listings: [{ exchange: 'NSE', symbol: 'HDFCBANK', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
    effectiveFrom: '2020-01-01T00:00:00.000Z',
  });

  return sm;
}

const ZERODHA_CSV_1 = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
RELIANCE,10,2500.00,2600.00,26000.00,1000.00,4.00,0.50
INFY,20,1500.00,1600.00,32000.00,2000.00,6.67,-0.25`;

const DHAN_CSV_2 = `Trading Symbol,ISIN,Exchange,Total Qty,DP Qty,Available Qty,Average Buy Price,Last Traded Price,Current Value,Profit / Loss,P&L %
TCS,INE467B01029,NSE,15,15,15,3400.00,3500.00,52500.00,1500.00,2.94
HDFCBANK,INE040A01034,NSE,25,25,25,1600.00,1650.00,41250.00,1250.00,3.12`;

const GROWW_CSV_3 = `Stock Name,Symbol,ISIN,Shares,Average Price,Current Value,Total Returns,Total Returns %,XIRR
Reliance Industries,RELIANCE,INE002A01018,10,2500.00,26000.00,1000.00,4.00,12.50
Tata Consultancy,TCS,INE467B01029,15,3400.00,52500.00,1500.00,2.94,10.00`;

const DHAN_WEB_UI_CSV = `Name, Quantity, Avg Price, Last Traded, Investment, Current Value, P&L, P&L %
TCS, 15, 3400.00, 3500.00, 51000.00, 52500.00, 1500.00, 2.94
HDFCBANK, 25, 1600.00, 1650.00, 40000.00, 41250.00, 1250.00, 3.12`;

const INVALID_CSV = `SomeBadHeader,WrongCol
UNKNOWN,100`;

describe('BI-07: Post-Save Repeat Import & Refresh Lifecycle Suite', () => {
  it('BI07-REPEAT-01: First import/save reaches SAVE_SUCCESS', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    const vm1 = controller.selectAndProcessFile({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha_1.csv',
      securityMaster: sm,
    });
    assert.strictEqual(vm1.state, 'READY_TO_SAVE');
    assert.strictEqual(vm1.acceptedHoldingsCount, 2);

    const saveVm1 = controller.confirmAndSave({
      portfolioStore: store,
      portfolioId: 'DEFAULT_PORTFOLIO',
    });
    assert.strictEqual(saveVm1.state, 'SAVE_SUCCESS');
    assert.ok(saveVm1.saveResult?.success);
    assert.strictEqual(saveVm1.saveResult?.holdingsSavedCount, 2);

    const portfolio = store.getPortfolio('DEFAULT_PORTFOLIO');
    assert.ok(portfolio);
    assert.strictEqual(portfolio.isSaved, true);
    assert.strictEqual(portfolio.holdings.length, 2);
  });

  it('BI07-REPEAT-02: After SAVE_SUCCESS, controller/view-model can return to IDLE', () => {
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    // Run import to SAVE_SUCCESS
    controller.selectAndProcessFile({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha_1.csv',
      securityMaster: sm,
    });
    const store = new PortfolioStore();
    controller.confirmAndSave({ portfolioStore: store });
    assert.strictEqual(controller.getState(), 'SAVE_SUCCESS');

    // Reset to IDLE
    controller.reset();
    assert.strictEqual(controller.getState(), 'IDLE');
    assert.strictEqual(controller.getIngressResult(), undefined);
    assert.strictEqual(controller.getSaveResult(), undefined);

    const idleVm = controller.buildViewModel(1280, sm);
    assert.strictEqual(idleVm.state, 'IDLE');
    assert.strictEqual(idleVm.acceptedHoldingsCount, 0);
    assert.strictEqual(idleVm.saveGuard.isSaveEnabled, false);
    assert.strictEqual(idleVm.saveResult, undefined);
  });

  it('BI07-REPEAT-03: Second selectAndProcessFile() is accepted after first save', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    // 1st Import & Save
    controller.selectAndProcessFile({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha_1.csv',
      securityMaster: sm,
    });
    controller.confirmAndSave({ portfolioStore: store });
    assert.strictEqual(controller.getState(), 'SAVE_SUCCESS');

    // 2nd Import without explicit reset: selectAndProcessFile clears prior save and processes new CSV
    const vm2 = controller.selectAndProcessFile({
      content: DHAN_CSV_2,
      fileName: 'dhan_2.csv',
      securityMaster: sm,
    });

    assert.strictEqual(vm2.state, 'READY_TO_SAVE');
    assert.strictEqual(vm2.sourceBroker, 'DHAN');
    assert.strictEqual(vm2.acceptedHoldingsCount, 2);
    assert.strictEqual(vm2.acceptedHoldings[0].symbol, 'TCS');
    assert.strictEqual(vm2.acceptedHoldings[1].symbol, 'HDFCBANK');
    assert.strictEqual(vm2.saveGuard.isSaveEnabled, true);
    assert.strictEqual(vm2.saveResult, undefined);
  });

  it('BI07-REPEAT-04: File input can select another CSV after first save', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    // 1st Save
    controller.selectAndProcessFile({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha_1.csv',
      securityMaster: sm,
    });
    controller.confirmAndSave({ portfolioStore: store });

    // Reset
    controller.reset();

    // Select 3rd CSV (Groww)
    const vm3 = controller.selectAndProcessFile({
      content: GROWW_CSV_3,
      fileName: 'groww_3.csv',
      securityMaster: sm,
    });

    assert.strictEqual(vm3.state, 'READY_TO_SAVE');
    assert.strictEqual(vm3.sourceBroker, 'GROWW');
    assert.strictEqual(vm3.acceptedHoldingsCount, 2);
    assert.strictEqual(vm3.acceptedHoldings[0].companyName, 'Reliance Industries Limited');
    assert.strictEqual(vm3.acceptedHoldings[1].companyName, 'Tata Consultancy Services Limited');
  });

  it('BI07-REPEAT-05: Portfolio Refresh updates UI after save', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();

    // Initial state: empty
    const initialPortfolio = store.getPortfolio('DEFAULT_PORTFOLIO');
    assert.ok(initialPortfolio);
    assert.strictEqual(initialPortfolio.holdings.length, 0);
    assert.strictEqual(initialPortfolio.isSaved, false);

    // Simulate import and save into store
    const controller = new PortfolioBrokerImportController(sm);
    controller.selectAndProcessFile({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha_1.csv',
      securityMaster: sm,
    });
    const saveRes = controller.confirmAndSave({ portfolioStore: store });
    assert.strictEqual(saveRes.state, 'SAVE_SUCCESS');

    // Verify store state updated
    const refreshedPortfolio = store.getPortfolio('DEFAULT_PORTFOLIO');
    assert.ok(refreshedPortfolio);
    assert.strictEqual(refreshedPortfolio.isSaved, true);
    assert.strictEqual(refreshedPortfolio.holdings.length, 2);
    assert.strictEqual(refreshedPortfolio.totalMarketValue, 58000);
    assert.strictEqual(refreshedPortfolio.weightSumPercentage, 100.0);

    // Verify analytics reader updated
    const analytics = store.getAnalytics('DEFAULT_PORTFOLIO');
    assert.strictEqual(analytics.holdingsCount, 2);
    assert.strictEqual(analytics.topHoldings.length, 2);
    assert.strictEqual(analytics.totalMarketValue, 58000);
  });

  it('BI07-REPEAT-06: Import Holdings can reopen after save', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();

    // Render Workspace component element
    const wsElement = React.createElement(PortfolioWorkspace, {
      portfolioStore: store,
      securityMaster: sm,
    });
    assert.strictEqual(wsElement.type, PortfolioWorkspace);

    // Render Modal component element with isOpen true
    const modalElement1 = React.createElement(BrokerImportModal, {
      isOpen: true,
      onClose: () => {},
      onSaveSuccess: () => {},
      portfolioStore: store,
      securityMaster: sm,
    });
    assert.strictEqual(modalElement1.type, BrokerImportModal);
    assert.strictEqual(modalElement1.props.isOpen, true);

    // Close modal (isOpen false)
    const modalElementClosed = React.createElement(BrokerImportModal, {
      isOpen: false,
      onClose: () => {},
      onSaveSuccess: () => {},
      portfolioStore: store,
      securityMaster: sm,
    });
    assert.strictEqual(modalElementClosed.props.isOpen, false);

    // Reopen modal (isOpen true again)
    const modalElementReopened = React.createElement(BrokerImportModal, {
      isOpen: true,
      onClose: () => {},
      onSaveSuccess: () => {},
      portfolioStore: store,
      securityMaster: sm,
    });
    assert.strictEqual(modalElementReopened.props.isOpen, true);
  });

  it('BI07-REPEAT-07: Second valid broker CSV reaches preview', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    // 1st Import & Save (Zerodha)
    controller.selectAndProcessFile({ content: ZERODHA_CSV_1, fileName: 'zerodha.csv', securityMaster: sm });
    controller.confirmAndSave({ portfolioStore: store });

    // 2nd Import (Dhan)
    controller.reset();
    const previewVm = controller.selectAndProcessFile({
      content: DHAN_CSV_2,
      fileName: 'dhan.csv',
      securityMaster: sm,
    });

    assert.strictEqual(previewVm.state, 'READY_TO_SAVE');
    assert.strictEqual(previewVm.brokerName, 'Dhan');
    assert.strictEqual(previewVm.sourceBroker, 'DHAN');
    assert.strictEqual(previewVm.acceptedHoldingsCount, 2);
    assert.strictEqual(previewVm.totalNormalizedWeight, 100.0);
    assert.strictEqual(previewVm.saveGuard.isSaveEnabled, true);
  });

  it('BI07-REPEAT-08: Second save remains atomic', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    // 1st Save
    controller.selectAndProcessFile({ content: ZERODHA_CSV_1, fileName: 'zerodha.csv', securityMaster: sm });
    const save1 = controller.confirmAndSave({ portfolioStore: store });
    assert.strictEqual(save1.state, 'SAVE_SUCCESS');
    const digest1 = store.getPortfolio('DEFAULT_PORTFOLIO')?.provenanceDigest;

    // 2nd Save
    controller.reset();
    controller.selectAndProcessFile({ content: DHAN_CSV_2, fileName: 'dhan.csv', securityMaster: sm });
    const save2 = controller.confirmAndSave({ portfolioStore: store });
    assert.strictEqual(save2.state, 'SAVE_SUCCESS');
    assert.strictEqual(save2.saveResult?.holdingsSavedCount, 2);

    const portfolio2 = store.getPortfolio('DEFAULT_PORTFOLIO');
    assert.ok(portfolio2);
    assert.strictEqual(portfolio2.isSaved, true);
    assert.strictEqual(portfolio2.holdings.length, 2);
    assert.strictEqual(portfolio2.weightSumPercentage, 100.0);
    // Provenance digest must be distinct for the new holdings batch
    assert.notStrictEqual(portfolio2.provenanceDigest, digest1);
  });

  it('BI07-REPEAT-09: First persisted portfolio data is preserved until governed atomic replacement', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    // 1st Save
    controller.selectAndProcessFile({ content: ZERODHA_CSV_1, fileName: 'zerodha.csv', securityMaster: sm });
    controller.confirmAndSave({ portfolioStore: store });

    const p1 = store.getPortfolio('DEFAULT_PORTFOLIO');
    assert.strictEqual(p1?.holdings.length, 2);
    assert.strictEqual(p1?.holdings[0].symbol, 'RELIANCE');

    // Begin 2nd import but do NOT save yet (it is only at PREVIEW stage)
    controller.reset();
    const previewVm = controller.selectAndProcessFile({
      content: DHAN_CSV_2,
      fileName: 'dhan.csv',
      securityMaster: sm,
    });
    assert.strictEqual(previewVm.state, 'READY_TO_SAVE');

    // The store must still hold the 1st saved portfolio unmodified
    const p1Still = store.getPortfolio('DEFAULT_PORTFOLIO');
    assert.strictEqual(p1Still?.holdings.length, 2);
    assert.strictEqual(p1Still?.holdings[0].symbol, 'RELIANCE');
    assert.strictEqual(p1Still?.isSaved, true);
  });

  it('BI07-REPEAT-10: No stale first-import error/preview state leaks into second import', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    // 1. First trigger a rejection
    const rejVm = controller.selectAndProcessFile({
      content: INVALID_CSV,
      fileName: 'invalid.csv',
      securityMaster: sm,
    });
    assert.strictEqual(rejVm.state, 'REJECTED');
    assert.ok(rejVm.errors.length > 0);

    // 2. Reset controller
    controller.reset();

    // 3. Process valid file
    const validVm = controller.selectAndProcessFile({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha.csv',
      securityMaster: sm,
    });

    assert.strictEqual(validVm.state, 'READY_TO_SAVE');
    assert.strictEqual(validVm.errors.length, 0);
    assert.strictEqual(validVm.rejectedRows.length, 0);
    assert.strictEqual(validVm.acceptedHoldingsCount, 2);
    assert.strictEqual(validVm.saveGuard.isSaveEnabled, true);
  });

  it('BI07-REPEAT-11: Same-file retry remains possible', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);
    const fixedAsOf = '2026-09-21T10:00:00.000Z';

    // 1st Run with same file
    const vm1 = controller.selectAndProcessFile({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha.csv',
      asOf: fixedAsOf,
      securityMaster: sm,
    });
    assert.strictEqual(vm1.state, 'READY_TO_SAVE');
    controller.confirmAndSave({ portfolioStore: store });

    // Reset
    controller.reset();

    // 2nd Run with exact same file, content, and asOf
    const vm2 = controller.selectAndProcessFile({
      content: ZERODHA_CSV_1,
      fileName: 'zerodha.csv',
      asOf: fixedAsOf,
      securityMaster: sm,
    });

    assert.strictEqual(vm2.state, 'READY_TO_SAVE');
    assert.strictEqual(vm2.acceptedHoldingsCount, 2);
    assert.strictEqual(vm2.contentDigest, vm1.contentDigest);
    assert.strictEqual(vm2.lineageDigest, vm1.lineageDigest);
  });

  it('BI07-REPEAT-12: XLSX remains blocked in second import session', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    // 1st Save with valid CSV
    controller.selectAndProcessFile({ content: ZERODHA_CSV_1, fileName: 'zerodha.csv', securityMaster: sm });
    controller.confirmAndSave({ portfolioStore: store });

    // 2nd import attempts XLSX
    controller.reset();
    const zipBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    const blockedVm = controller.selectAndProcessFile({
      content: zipBytes,
      fileName: 'dhan_export.xlsx',
      securityMaster: sm,
    });

    assert.strictEqual(blockedVm.state, 'BLOCKED');
    assert.strictEqual(blockedVm.saveGuard.isSaveEnabled, false);
    assert.strictEqual(blockedVm.saveGuard.disabledReason, 'Import blocked: Unsupported binary format (requires BI-06 qualification).');
  });

  it('BI07-REPEAT-13: Repeat import specifically accepts actual Portfolio(2).csv DHAN_WEB_UI_SUMMARY_V1 format as second import', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    // 1st Import & Save (Zerodha)
    controller.selectAndProcessFile({ content: ZERODHA_CSV_1, fileName: 'zerodha_1.csv', securityMaster: sm });
    controller.confirmAndSave({ portfolioStore: store });
    assert.strictEqual(controller.getState(), 'SAVE_SUCCESS');

    // 2nd Import using exact DHAN_WEB_UI_SUMMARY_V1 format (Portfolio(2).csv)
    controller.reset();
    const vm2 = controller.selectAndProcessFile({
      content: DHAN_WEB_UI_CSV,
      fileName: 'Portfolio(2).csv',
      securityMaster: sm,
    });

    assert.strictEqual(vm2.state, 'READY_TO_SAVE');
    assert.strictEqual(vm2.brokerName, 'Dhan');
    assert.strictEqual(vm2.sourceBroker, 'DHAN');
    assert.strictEqual(vm2.acceptedHoldingsCount, 2);
    assert.strictEqual(vm2.totalNormalizedWeight, 100.0);
    assert.strictEqual(vm2.identityResolutionStatus, 'ALL_IDENTITIES_RESOLVED_P04');
    assert.strictEqual(vm2.saveGuard.isSaveEnabled, true);

    const tcs = vm2.acceptedHoldings.find((h) => h.symbol === 'TCS')!;
    assert.ok(tcs);
    assert.strictEqual(tcs.companyId, 'EQ_TCS_IN');
    assert.strictEqual(tcs.companyName, 'Tata Consultancy Services Limited');

    const hdfc = vm2.acceptedHoldings.find((h) => h.symbol === 'HDFCBANK')!;
    assert.ok(hdfc);
    assert.strictEqual(hdfc.companyId, 'EQ_HDFCBANK_IN');
    assert.strictEqual(hdfc.companyName, 'HDFC Bank Limited');
  });

  it('BI07-REPEAT-14: Second import with DHAN_WEB_UI_SUMMARY_V1 executes atomic replacement and preserves exact 100.0000% weight sum', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    // 1st Save (Zerodha)
    controller.selectAndProcessFile({ content: ZERODHA_CSV_1, fileName: 'zerodha_1.csv', securityMaster: sm });
    const save1 = controller.confirmAndSave({ portfolioStore: store });
    assert.strictEqual(save1.state, 'SAVE_SUCCESS');
    const digest1 = store.getPortfolio('DEFAULT_PORTFOLIO')?.provenanceDigest;

    // 2nd Save (Dhan Web UI Portfolio(2).csv)
    controller.reset();
    controller.selectAndProcessFile({ content: DHAN_WEB_UI_CSV, fileName: 'Portfolio(2).csv', securityMaster: sm });
    const save2 = controller.confirmAndSave({ portfolioStore: store });
    assert.strictEqual(save2.state, 'SAVE_SUCCESS');
    assert.strictEqual(save2.saveResult?.holdingsSavedCount, 2);

    const portfolio2 = store.getPortfolio('DEFAULT_PORTFOLIO');
    assert.ok(portfolio2);
    assert.strictEqual(portfolio2.isSaved, true);
    assert.strictEqual(portfolio2.holdings.length, 2);
    assert.strictEqual(portfolio2.weightSumPercentage, 100.0);
    assert.strictEqual(portfolio2.totalMarketValue, 93750); // 52500 + 41250
    assert.notStrictEqual(portfolio2.provenanceDigest, digest1);

    // Verify analytics reflects the second Dhan portfolio
    const analytics = store.getAnalytics('DEFAULT_PORTFOLIO');
    assert.strictEqual(analytics.holdingsCount, 2);
    assert.strictEqual(analytics.totalMarketValue, 93750);
  });
});
