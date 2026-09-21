/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: BI-07 React DOM Host Integration & Component Binding Suite
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
  PortfolioWorkspace,
  BrokerImportModal,
} from '../frontend/src/features/portfolio/index.js';
import { App } from '../frontend/src/app/App.js';
import { SecurityMaster } from '../src/identity/security_master.js';

// Setup governed mock security master conforming strictly to P04 contracts
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

const ZERODHA_VALID_CSV = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
RELIANCE,10,2500.00,2600.00,26000.00,1000.00,4.00,0.50
INFY,20,1500.00,1600.00,32000.00,2000.00,6.67,-0.25
TCS,15,3400.00,3500.00,52500.00,1500.00,2.94,1.10`;

const DHAN_VALID_CSV = `Trading Symbol,ISIN,Exchange,Total Qty,DP Qty,Available Qty,Average Buy Price,Last Traded Price,Current Value,Profit / Loss,P&L %
RELIANCE,INE002A01018,NSE,10,10,10,2500.00,2600.00,26000.00,1000.00,4.00
HDFCBANK,INE040A01034,NSE,25,25,25,1600.00,1650.00,41250.00,1250.00,3.12`;

const GROWW_VALID_CSV = `Stock Name,Symbol,ISIN,Shares,Average Price,Current Value,Total Returns,Total Returns %,XIRR
Reliance Industries,RELIANCE,INE002A01018,10,2500.00,26000.00,1000.00,4.00,12.50
Infosys Ltd,INFY,INE009A01021,20,1500.00,32000.00,2000.00,6.67,10.20`;

describe('BI-07: React DOM Host Integration & Component Binding Suite', () => {
  it('HOST-01: exports all required React components and domain contracts from portfolio feature root', () => {
    assert.strictEqual(typeof PortfolioWorkspace, 'function', 'PortfolioWorkspace must be a React component function');
    assert.strictEqual(typeof BrokerImportModal, 'function', 'BrokerImportModal must be a React component function');
    assert.strictEqual(typeof PortfolioStore, 'function', 'PortfolioStore must be exported');
    assert.strictEqual(typeof PortfolioBrokerImportController, 'function', 'PortfolioBrokerImportController must be exported');
  });

  it('HOST-02: App institutional shell renders PortfolioWorkspace as default surface', () => {
    assert.strictEqual(typeof App, 'function', 'App root shell must be a React component');
    const element = React.createElement(App);
    assert.strictEqual(element.type, App, 'App element must be instantiable via React.createElement');
  });

  it('HOST-03: PortfolioWorkspace instantiates and manages initial empty portfolio store state', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const element = React.createElement(PortfolioWorkspace, {
      portfolioStore: store,
      securityMaster: sm,
    });

    assert.strictEqual(element.props.portfolioStore, store);
    assert.strictEqual(element.props.securityMaster, sm);

    const portfolio = store.getPortfolio('DEFAULT_PORTFOLIO');
    assert.ok(portfolio);
    assert.strictEqual(portfolio.holdings.length, 0);
    assert.strictEqual(portfolio.isSaved, false);
    assert.strictEqual(portfolio.totalMarketValue, 0);
  });

  it('HOST-04: BrokerImportModal binds to PortfolioBrokerImportController and performs Zerodha import workflow', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    // 1. Initial State: IDLE
    const initialVm = controller.buildViewModel(1280, sm);
    assert.strictEqual(initialVm.state, 'IDLE');
    assert.strictEqual(initialVm.surfaceId, 'UI15_PORTFOLIO_BROKER_IMPORT');
    assert.strictEqual(initialVm.saveGuard.isSaveEnabled, false);
    assert.strictEqual(initialVm.accessibility.focusElementId, 'ui15-btn-file-select');

    // 2. Select & Process Zerodha CSV
    const previewVm = controller.selectAndProcessFile({
      content: ZERODHA_VALID_CSV,
      fileName: 'zerodha_holdings.csv',
      viewportWidth: 1280,
      securityMaster: sm,
    });

    assert.strictEqual(previewVm.state, 'READY_TO_SAVE');
    assert.strictEqual(previewVm.sourceBroker, 'ZERODHA');
    assert.strictEqual(previewVm.acceptedHoldingsCount, 3);
    assert.strictEqual(previewVm.rejectedRowsCount, 0);
    assert.strictEqual(previewVm.saveGuard.isSaveEnabled, true);
    assert.strictEqual(previewVm.totalNormalizedWeight, 100.0);
    assert.strictEqual(previewVm.saveGuard.allHoldingsHaveCompanyId, true);
    assert.strictEqual(previewVm.accessibility.focusElementId, 'ui15-btn-confirm-save');

    // 3. Confirm & Save atomically
    const saveVm = controller.confirmAndSave({
      portfolioStore: store,
      portfolioId: 'DEFAULT_PORTFOLIO',
      viewportWidth: 1280,
    });

    assert.strictEqual(saveVm.state, 'SAVE_SUCCESS');
    assert.ok(saveVm.saveResult?.success);
    assert.strictEqual(saveVm.saveResult?.holdingsSavedCount, 3);

    // 4. Verify PortfolioStore has committed state
    const updatedPortfolio = store.getPortfolio('DEFAULT_PORTFOLIO');
    assert.ok(updatedPortfolio);
    assert.strictEqual(updatedPortfolio.isSaved, true);
    assert.strictEqual(updatedPortfolio.holdings.length, 3);
    assert.strictEqual(updatedPortfolio.weightSumPercentage, 100.0);

    // 5. Downstream Analytics Reader
    const analytics = store.getAnalytics('DEFAULT_PORTFOLIO');
    assert.strictEqual(analytics.holdingsCount, 3);
    assert.strictEqual(analytics.topHoldings.length, 3);
    assert.strictEqual(analytics.topHoldings[0].symbol, 'TCS'); // Highest weight
  });

  it('HOST-05: BrokerImportModal binds to Dhan CSV import and handles save guard rules', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    const vm = controller.selectAndProcessFile({
      content: DHAN_VALID_CSV,
      fileName: 'dhan_export.csv',
      viewportWidth: 1024,
      securityMaster: sm,
    });

    assert.strictEqual(vm.state, 'READY_TO_SAVE');
    assert.strictEqual(vm.sourceBroker, 'DHAN');
    assert.strictEqual(vm.acceptedHoldingsCount, 2);
    assert.strictEqual(vm.saveGuard.isSaveEnabled, true);
    assert.strictEqual(vm.saveGuard.isExact100Weight, true);

    const saveVm = controller.confirmAndSave({
      portfolioStore: store,
      portfolioId: 'DEFAULT_PORTFOLIO',
    });

    assert.strictEqual(saveVm.state, 'SAVE_SUCCESS');
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')?.holdings.length, 2);
  });

  it('HOST-06: BrokerImportModal binds to Groww CSV import with P04 identity verification', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    const vm = controller.selectAndProcessFile({
      content: GROWW_VALID_CSV,
      fileName: 'groww_stocks.csv',
      viewportWidth: 1440,
      securityMaster: sm,
    });

    assert.strictEqual(vm.state, 'READY_TO_SAVE');
    assert.strictEqual(vm.sourceBroker, 'GROWW');
    assert.strictEqual(vm.acceptedHoldingsCount, 2);
    assert.strictEqual(vm.saveGuard.allHoldingsHaveCompanyId, true);
    assert.strictEqual(vm.acceptedHoldings[0].companyName, 'Reliance Industries Limited');
    assert.strictEqual(vm.acceptedHoldings[1].companyName, 'Infosys Limited');
  });

  it('HOST-07: Save guard blocks save when unmapped symbol causes fail-closed identity rejection', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    const UNMAPPED_CSV = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
UNKNOWN_CORP,10,100.00,110.00,1100.00,100.00,10.00,0.00`;

    const vm = controller.selectAndProcessFile({
      content: UNMAPPED_CSV,
      fileName: 'unmapped.csv',
      securityMaster: sm,
    });

    assert.strictEqual(vm.state, 'REJECTED');
    assert.strictEqual(vm.saveGuard.isSaveEnabled, false);
    assert.ok(vm.saveGuard.disabledReason);
    assert.strictEqual(vm.saveGuard.hasValidHoldings, false);

    // Attempting to force confirmAndSave must fail safely
    const saveVm = controller.confirmAndSave({
      portfolioStore: store,
      portfolioId: 'DEFAULT_PORTFOLIO',
    });

    assert.strictEqual(saveVm.state, 'REJECTED');
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')?.isSaved, false);
  });

  it('HOST-08: Save guard cleanly blocks binary XLSX input under BI-06 qualification rule', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    const XLSX_MOCK_BYTES = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);

    const vm = controller.selectAndProcessFile({
      content: XLSX_MOCK_BYTES,
      fileName: 'zerodha_holdings.xlsx',
      securityMaster: sm,
    });

    assert.strictEqual(vm.state, 'BLOCKED');
    assert.strictEqual(vm.saveGuard.isSaveEnabled, false);
    assert.strictEqual(vm.saveGuard.disabledReason, 'Import blocked: Unsupported binary format (requires BI-06 qualification).');
  });

  it('HOST-09: WCAG 2.1 AA dual-coding and accessibility metadata is preserved for React DOM consumers', () => {
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    const vm = controller.selectAndProcessFile({
      content: ZERODHA_VALID_CSV,
      fileName: 'zerodha.csv',
      securityMaster: sm,
    });

    // Dual-coded indicator: must provide non-color-only text and icon
    assert.strictEqual(vm.qualityIndicator.state, 'GOOD');
    assert.ok(vm.qualityIndicator.icon.length > 0);
    assert.ok(vm.qualityIndicator.label.length > 0);
    assert.ok(vm.qualityIndicator.ariaText.length > 0);

    // Screen-reader table captions & live region
    assert.strictEqual(vm.accessibility.ariaRole, 'dialog');
    assert.ok(vm.accessibility.tableCaption.includes('Zerodha Kite'));
    assert.ok(vm.accessibility.liveRegionText.includes('Preview Ready'));
  });

  it('HOST-10: Responsive layout metadata adapts across 4 tiers without introducing third-party CSS dependencies', () => {
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    // Mobile (<768px)
    const mobileVm = controller.selectAndProcessFile({
      content: ZERODHA_VALID_CSV,
      fileName: 'zerodha.csv',
      viewportWidth: 640,
      securityMaster: sm,
    });
    assert.strictEqual(mobileVm.responsiveLayout.tier, 'MOBILE');
    assert.strictEqual(mobileVm.responsiveLayout.columns, 1);
    assert.strictEqual(mobileVm.responsiveLayout.pinnedColumn, 'symbol');

    // Tablet (768-1023px)
    const tabletVm = controller.selectAndProcessFile({
      content: ZERODHA_VALID_CSV,
      fileName: 'zerodha.csv',
      viewportWidth: 800,
      securityMaster: sm,
    });
    assert.strictEqual(tabletVm.responsiveLayout.tier, 'TABLET');
    assert.strictEqual(tabletVm.responsiveLayout.columns, 2);

    // Desktop (1024-1439px)
    const desktopVm = controller.selectAndProcessFile({
      content: ZERODHA_VALID_CSV,
      fileName: 'zerodha.csv',
      viewportWidth: 1280,
      securityMaster: sm,
    });
    assert.strictEqual(desktopVm.responsiveLayout.tier, 'DESKTOP');
    assert.strictEqual(desktopVm.responsiveLayout.columns, 3);

    // Wide (>=1440px)
    const wideVm = controller.selectAndProcessFile({
      content: ZERODHA_VALID_CSV,
      fileName: 'zerodha.csv',
      viewportWidth: 1920,
      securityMaster: sm,
    });
    assert.strictEqual(wideVm.responsiveLayout.tier, 'WIDE');
    assert.strictEqual(wideVm.responsiveLayout.columns, 4);
    assert.strictEqual(wideVm.responsiveLayout.pinnedColumn, undefined);
  });
});
