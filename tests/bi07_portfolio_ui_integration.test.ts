/**
 * Institutional Investment Platform System (IIPS)
 * Workstream BI: Package BI-07 - Portfolio UI/UX Broker Import Integration & View-Model Tests
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-07-AUTH-2026-01
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03 / BI-04 / BI-05 / BI-07
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  PortfolioStore,
  PortfolioBrokerImportController,
} from '../frontend/src/features/portfolio/index.js';
import { SecurityMaster } from '../src/identity/security_master.js';

describe('BI-07: Portfolio UI/UX Broker Import Integration & View-Model Suite', () => {
  const sampleZerodhaCsv = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
INFY,100,1450.50,1520.00,152000.00,6950.00,4.79,0.50
TCS,50,3800.00,3950.00,197500.00,7500.00,3.95,-0.20
RELIANCE,80,2800.00,2900.00,232000.00,8000.00,3.57,1.10`;

  const sampleDhanCsv = `Trading Symbol,ISIN,Exchange,Total Qty,DP Qty,Available Qty,Average Buy Price,Last Traded Price,Current Value,Profit / Loss,P&L %
INFY,INE009A01021,NSE,100,100,100,1450.50,1520.00,152000.00,6950.00,4.79
TCS,INE467B01029,NSE,50,50,50,3800.00,3950.00,197500.00,7500.00,3.95
HDFCBANK,INE040A01034,NSE,120,120,120,1600.00,1650.00,198000.00,6000.00,3.12`;

  const sampleGrowwCsv = `Stock Name,Symbol,ISIN,Shares,Average Price,Current Value,Total Returns,Total Returns %,XIRR
Infosys Ltd,INFY,INE009A01021,100,1450.50,152000.00,6950.00,4.79,12.50
Tata Consultancy Services,TCS,INE467B01029,50,3800.00,197500.00,7500.00,3.95,10.20
Reliance Industries,RELIANCE,INE002A01018,80,2800.00,232000.00,8000.00,3.57,9.80`;

  function createGovernedSecurityMaster(): SecurityMaster {
    const sm = new SecurityMaster();
    sm.registerEntity({
      companyId: 'INFOSYS_LTD',
      isin: 'INE009A01021',
      companyName: 'Infosys Limited',
      industry: 'IT Services',
      sector: 'IT',
      listings: [{ exchange: 'NSE', symbol: 'INFY', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
      effectiveFrom: '2020-01-01T00:00:00.000Z',
    });
    sm.registerEntity({
      companyId: 'TATA_CONSULTANCY',
      isin: 'INE467B01029',
      companyName: 'Tata Consultancy Services Limited',
      industry: 'IT Services',
      sector: 'IT',
      listings: [{ exchange: 'NSE', symbol: 'TCS', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
      effectiveFrom: '2020-01-01T00:00:00.000Z',
    });
    sm.registerEntity({
      companyId: 'RELIANCE_IND',
      isin: 'INE002A01018',
      companyName: 'Reliance Industries Limited',
      industry: 'Oil & Gas',
      sector: 'ENERGY',
      listings: [{ exchange: 'NSE', symbol: 'RELIANCE', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
      effectiveFrom: '2020-01-01T00:00:00.000Z',
    });
    sm.registerEntity({
      companyId: 'HDFC_BANK',
      isin: 'INE040A01034',
      companyName: 'HDFC Bank Limited',
      industry: 'Private Bank',
      sector: 'BANKING',
      listings: [{ exchange: 'NSE', symbol: 'HDFCBANK', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
      effectiveFrom: '2020-01-01T00:00:00.000Z',
    });
    return sm;
  }

  // BI07-01
  it('BI07-01: Import Holdings entry point initializes controller in IDLE state', () => {
    const controller = new PortfolioBrokerImportController();
    assert.strictEqual(controller.getState(), 'IDLE');

    const vm = controller.buildViewModel(1280);
    assert.strictEqual(vm.surfaceId, 'UI15_PORTFOLIO_BROKER_IMPORT');
    assert.strictEqual(vm.state, 'IDLE');
    assert.strictEqual(vm.saveGuard.isSaveEnabled, false);
    assert.strictEqual(vm.acceptedHoldingsCount, 0);
  });

  // BI07-02
  it('BI07-02: Zerodha CSV reaches PREVIEW_READY / READY_TO_SAVE state with populated preview items', () => {
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    const vm = controller.selectAndProcessFile({
      content: sampleZerodhaCsv,
      fileName: 'zerodha-2026.csv',
    });

    assert.strictEqual(vm.state, 'READY_TO_SAVE');
    assert.strictEqual(vm.brokerName, 'Zerodha Kite');
    assert.strictEqual(vm.sourceBroker, 'ZERODHA');
    assert.strictEqual(vm.acceptedHoldingsCount, 3);
    assert.strictEqual(vm.totalNormalizedWeight, 100.0);
    assert.strictEqual(vm.saveGuard.isSaveEnabled, true);

    const infy = vm.acceptedHoldings.find((h) => h.symbol === 'INFY')!;
    assert.ok(infy);
    assert.strictEqual(infy.companyId, 'INFOSYS_LTD');
    assert.strictEqual(infy.companyName, 'Infosys Limited');
    assert.strictEqual(infy.quantity, 100);
    assert.strictEqual(infy.marketValue, 152000);
  });

  // BI07-03
  it('BI07-03: Dhan CSV reaches preview with ISIN and company identity accurately resolved', () => {
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    const vm = controller.selectAndProcessFile({
      content: sampleDhanCsv,
      fileName: 'dhan-holdings.csv',
    });

    assert.strictEqual(vm.state, 'READY_TO_SAVE');
    assert.strictEqual(vm.brokerName, 'Dhan');
    assert.strictEqual(vm.sourceBroker, 'DHAN');
    assert.strictEqual(vm.acceptedHoldingsCount, 3);
    assert.strictEqual(vm.identityResolutionStatus, 'ALL_IDENTITIES_RESOLVED_P04');
    assert.strictEqual(vm.saveGuard.isSaveEnabled, true);
  });

  // BI07-04
  it('BI07-04: Groww CSV reaches preview and exposes correct total market value and weights', () => {
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    const vm = controller.selectAndProcessFile({
      content: sampleGrowwCsv,
      fileName: 'groww-holdings.csv',
    });

    assert.strictEqual(vm.state, 'READY_TO_SAVE');
    assert.strictEqual(vm.brokerName, 'Groww');
    assert.strictEqual(vm.totalMarketValue, 581500);
    assert.strictEqual(vm.totalNormalizedWeight, 100.0);
  });

  // BI07-05
  it('BI07-05: rejected rows are visibly represented in the preview view model', () => {
    const mixedCsv = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
INFY,100,1450.50,1520.00,152000.00,6950.00,4.79,0.50
BAD_ROW_QTY,-10,100,100,-1000,0,0,0
TCS,50,3800.00,3950.00,197500.00,7500.00,3.95,-0.20`;

    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    const vm = controller.selectAndProcessFile({
      content: mixedCsv,
      fileName: 'mixed.csv',
    });

    assert.strictEqual(vm.state, 'PARTIAL_REJECTIONS');
    assert.strictEqual(vm.acceptedHoldingsCount, 2);
    assert.strictEqual(vm.rejectedRowsCount, 1);
    assert.strictEqual(vm.rejectedRows[0].reason, 'NON_POSITIVE_QTY');
    assert.strictEqual(vm.saveGuard.isSaveEnabled, true); // Valid subset can still be saved
    assert.strictEqual(vm.qualityIndicator.state, 'PARTIAL');
  });

  // BI07-06
  it('BI07-06: XLSX file selection displays QUALIFICATION_BLOCKED_DEFERRED_TO_BI06 state to user', () => {
    const zipMagic = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    const controller = new PortfolioBrokerImportController();

    const vm = controller.selectAndProcessFile({
      content: zipMagic,
      fileName: 'groww.xlsx',
    });

    assert.strictEqual(vm.state, 'BLOCKED');
    assert.strictEqual(vm.saveGuard.isSaveEnabled, false);
    assert.ok(vm.saveGuard.disabledReason?.includes('BI-06'));
    assert.strictEqual(vm.qualityIndicator.state, 'UNAVAILABLE');
    assert.strictEqual(vm.accessibility.ariaLive, 'assertive');
  });

  // BI07-07
  it('BI07-07: confirm/import action is strictly disabled for rejected/blocked/idle states', () => {
    const controller = new PortfolioBrokerImportController();

    // 1. In IDLE state
    let vm = controller.buildViewModel();
    assert.strictEqual(vm.saveGuard.isSaveEnabled, false);

    // 2. In REJECTED state (invalid format)
    vm = controller.selectAndProcessFile({
      content: 'Unknown,Columns\n1,2',
      fileName: 'invalid.csv',
    });
    assert.strictEqual(vm.state, 'REJECTED');
    assert.strictEqual(vm.saveGuard.isSaveEnabled, false);
    assert.ok(vm.saveGuard.disabledReason);
  });

  // BI07-08
  it('BI07-08: confirm/import action is enabled ONLY when READY_FOR_PORTFOLIO_SAVE criteria are fully met', () => {
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    const vm = controller.selectAndProcessFile({
      content: sampleZerodhaCsv,
      fileName: 'zerodha.csv',
    });

    assert.strictEqual(vm.saveGuard.isSaveEnabled, true);
    assert.strictEqual(vm.saveGuard.isReadyDisposition, true);
    assert.strictEqual(vm.saveGuard.allHoldingsHaveCompanyId, true);
    assert.strictEqual(vm.saveGuard.isExact100Weight, true);
  });

  // BI07-09
  it('BI07-09: validated payload uses existing Portfolio save boundary as one atomic batch operation', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    controller.selectAndProcessFile({
      content: sampleDhanCsv,
      fileName: 'dhan.csv',
    });

    const vm = controller.confirmAndSave({ portfolioStore: store, portfolioId: 'DEFAULT_PORTFOLIO' });

    assert.strictEqual(vm.state, 'SAVE_SUCCESS');
    assert.ok(vm.saveResult);
    assert.strictEqual(vm.saveResult?.success, true);
    assert.strictEqual(vm.saveResult?.holdingsSavedCount, 3);

    // Verify store contains the saved holdings
    const portfolio = store.getPortfolio('DEFAULT_PORTFOLIO');
    assert.ok(portfolio);
    assert.strictEqual(portfolio?.isSaved, true);
    assert.strictEqual(portfolio?.holdings.length, 3);
    assert.strictEqual(portfolio?.weightSumPercentage, 100.0);
  });

  // BI07-10
  it('BI07-10: verifies no client-side weight recalculation occurs in the UI layer', () => {
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    const vm = controller.selectAndProcessFile({
      content: sampleZerodhaCsv,
      fileName: 'zerodha.csv',
    });

    // Verify weights in preview view model match exact BI-03/BI-05 orchestrator output
    const ingressRes = controller.getIngressResult()!;
    for (let i = 0; i < vm.acceptedHoldings.length; i++) {
      assert.strictEqual(
        vm.acceptedHoldings[i].weightPercentage,
        ingressRes.userHoldings[i].weightPercentage
      );
    }
  });

  // BI07-11
  it('BI07-11: preserves complete provenance and SHA-256 digests across UI transitions', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    const vm1 = controller.selectAndProcessFile({
      content: sampleGrowwCsv,
      fileName: 'groww.csv',
      asOf: '2026-09-21T00:00:00.000Z',
    });

    assert.ok(vm1.contentDigest.length === 64);
    assert.ok(vm1.lineageDigest.length === 64);

    const vm2 = controller.confirmAndSave({ portfolioStore: store });
    assert.strictEqual(vm2.contentDigest, vm1.contentDigest);
    assert.strictEqual(vm2.lineageDigest, vm1.lineageDigest);
  });

  // BI07-12
  it('BI07-12: save failure is surfaced without false success if store rejects invalid save', () => {
    const store = new PortfolioStore();
    const controller = new PortfolioBrokerImportController();

    // Force confirm without valid processing
    const vm = controller.confirmAndSave({ portfolioStore: store });

    assert.strictEqual(vm.state, 'REJECTED');
    assert.strictEqual(vm.saveResult?.success, false);
    assert.ok(vm.saveResult?.error?.includes('Save Guard Block'));
  });

  // BI07-13
  it('BI07-13: successful save refreshes Portfolio state and feeds existing analytics data path', () => {
    const store = new PortfolioStore();
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    controller.selectAndProcessFile({
      content: sampleZerodhaCsv,
      fileName: 'zerodha.csv',
    });

    controller.confirmAndSave({ portfolioStore: store });

    // Read analytics from store
    const analytics = store.getAnalytics('DEFAULT_PORTFOLIO');
    assert.strictEqual(analytics.holdingsCount, 3);
    assert.strictEqual(analytics.totalMarketValue, 581500);
    assert.strictEqual(analytics.topHoldings.length, 3);
    assert.strictEqual(analytics.topHoldings[0].companyId, 'RELIANCE_IND'); // Largest weight
  });

  // BI07-14
  it('BI07-14: accessibility engine generates WCAG 2.1 AA dual-coded indicators and semantic table captions', () => {
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    const vm = controller.selectAndProcessFile({
      content: sampleDhanCsv,
      fileName: 'dhan.csv',
    });

    assert.strictEqual(vm.qualityIndicator.state, 'GOOD');
    assert.ok(vm.qualityIndicator.icon.length > 0);
    assert.ok(vm.qualityIndicator.ariaText.includes('Good'));
    assert.strictEqual(vm.accessibility.ariaRole, 'dialog');
    assert.ok(vm.accessibility.tableCaption.includes('Dhan'));
    assert.ok(vm.accessibility.liveRegionText.includes('Preview Ready'));
  });

  // BI07-15
  it('BI07-15: responsive engine resolves 4-tier layout and pinned columns across viewports', () => {
    const sm = createGovernedSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    controller.selectAndProcessFile({
      content: sampleZerodhaCsv,
      fileName: 'zerodha.csv',
    });

    // Mobile viewport (400px)
    const mobileVm = controller.buildViewModel(400);
    assert.strictEqual(mobileVm.responsiveLayout.tier, 'MOBILE');
    assert.strictEqual(mobileVm.responsiveLayout.columns, 1);
    assert.strictEqual(mobileVm.responsiveLayout.pinnedColumn, 'symbol');

    // Desktop viewport (1280px)
    const desktopVm = controller.buildViewModel(1280);
    assert.strictEqual(desktopVm.responsiveLayout.tier, 'DESKTOP');
    assert.strictEqual(desktopVm.responsiveLayout.columns, 3);
  });
});
