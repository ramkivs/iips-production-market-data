/**
 * Institutional Investment Platform System (IIPS)
 * Block 3M-A: Non-Production Single-Operator Identity Bypass Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / NON_PRODUCTION_SINGLE_OPERATOR_IDENTITY_BYPASS
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

// Realistic broker test CSV fixtures containing D05 unmapped securities
const ZERODHA_OPERATOR_CSV = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
ASK AUTOMOTIVE,100,300.00,350.00,35000.00,5000.00,16.67,1.20
AMBUJACEM,50,600.00,620.00,31000.00,1000.00,3.33,0.50
RELIANCE,10,2500.00,2600.00,26000.00,1000.00,4.00,-0.20
TCS,20,3500.00,3600.00,72000.00,2000.00,2.86,0.10`;

const DHAN_DETAILED_OPERATOR_CSV = `Trading Symbol,Exchange,Security ID,ISIN,Quantity,Buy Avg,Last Traded Price,Value at Cost,Current Value,Realized Profit/Loss,Unrealized Profit/Loss,P&L(%)
ZOMATO,NSE,ZOMATO,INE758T01015,200,150.00,180.00,30000.00,36000.00,0.00,6000.00,20.00
PAYTM,NSE,PAYTM,INE982J01019,50,400.00,420.00,20000.00,21000.00,0.00,1000.00,5.00
INFY,NSE,INFY,INE009A01021,40,1400.00,1500.00,56000.00,60000.00,0.00,4000.00,7.14`;

const DHAN_WEB_UI_OPERATOR_CSV = `Name, Quantity, Avg Price, Last Traded, Investment, Current Value, P&L, P&L %
SUZLON, 1000, 40.00, 45.00, 40000.00, 45000.00, 5000.00, 12.50
YESBANK, 500, 20.00, 22.00, 10000.00, 11000.00, 1000.00, 10.00
AIIL, 100, 150.00, 160.00, 15000.00, 16000.00, 1000.00, 6.67
AGI GREENPAC, 50, 800.00, 850.00, 40000.00, 42500.00, 2500.00, 6.25`;

test('Block 3M-A: Non-Production Operator Identity Bypass Architecture', async (t) => {
  const securityMaster = getGovernedBroadSecurityMaster();

  await t.test('Criterion A: Zero fabricated companyId values are introduced', () => {
    const res = BrokerImportIngressOrchestrator.executeIngress({
      content: ZERODHA_OPERATOR_CSV,
      fileName: 'zerodha-operator.csv',
      securityMaster,
      allowNonProductionBypass: true,
      executionEnvironment: 'NON_PRODUCTION',
    });

    assert.strictEqual(res.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(res.userHoldings.length, 4);

    const ask = res.userHoldings.find((h: UserHoldingInput) => h.symbol === 'ASK AUTOMOTIVE');
    assert.ok(ask, 'ASK AUTOMOTIVE holding should exist');
    assert.strictEqual(ask.identityStatus, 'UNRESOLVED');
    assert.strictEqual(ask.resolutionDisposition, 'NON_PRODUCTION_OPERATOR_BYPASS');
    assert.strictEqual(ask.companyId, '', 'companyId MUST be empty string, never fabricated');

    const ambuja = res.userHoldings.find((h: UserHoldingInput) => h.symbol === 'AMBUJACEM');
    assert.ok(ambuja, 'AMBUJACEM holding should exist');
    assert.strictEqual(ambuja.identityStatus, 'UNRESOLVED');
    assert.strictEqual(ambuja.companyId, '', 'companyId MUST be empty string');
  });

  await t.test('Criterion B & C: Preserves broker identity fields for unmapped equities', () => {
    const res = BrokerImportIngressOrchestrator.executeIngress({
      content: DHAN_DETAILED_OPERATOR_CSV,
      fileName: 'dhan-detailed.csv',
      securityMaster,
      allowNonProductionBypass: true,
      executionEnvironment: 'NON_PRODUCTION',
    });

    assert.strictEqual(res.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    const zomato = res.userHoldings.find((h: UserHoldingInput) => h.symbol === 'ZOMATO');
    assert.ok(zomato);
    assert.strictEqual(zomato.isin, 'INE758T01015');
    assert.strictEqual(zomato.exchange, 'NSE');
    assert.strictEqual(zomato.quantity, 200);
    assert.strictEqual(zomato.averageBuyPrice, 150.0);
    assert.strictEqual(zomato.currentPrice, 180.0);
    assert.strictEqual(zomato.marketValue, 36000.0);
    assert.strictEqual(zomato.identityStatus, 'UNRESOLVED');
  });

  await t.test('Criterion D: Production boundary strictly preserved with fail-closed rejection', () => {
    // Attempting bypass with executionEnvironment: 'PRODUCTION' must fail closed
    const prodRes = BrokerImportIngressOrchestrator.executeIngress({
      content: ZERODHA_OPERATOR_CSV,
      fileName: 'zerodha-operator.csv',
      securityMaster,
      allowNonProductionBypass: true,
      executionEnvironment: 'PRODUCTION', // Production mode overrides bypass flag!
    });

    assert.strictEqual(prodRes.disposition, 'REJECTED');
    assert.strictEqual(prodRes.userHoldings.length, 0);
    assert.ok(prodRes.errors.length > 0, 'Should log fail-closed rejection errors');
    assert.ok(
      prodRes.errors.some((e: string) => e.includes('Identity Ambiguity Quarantine') || e.includes('identity resolution failed')),
      'Should log identity quarantine error under strict production governance'
    );
  });

  await t.test('Criterion E, F & G: Governed Multi-Broker Atomic Merge with mixed mapped/unmapped holdings', () => {
    const store = new PortfolioStore();

    // Import 1: Zerodha (ASK AUTOMOTIVE [unresolved], AMBUJACEM [unresolved], RELIANCE [mapped], TCS [mapped])
    const res1 = BrokerImportIngressOrchestrator.executeIngress({
      content: ZERODHA_OPERATOR_CSV,
      fileName: 'zerodha-operator.csv',
      securityMaster,
      allowNonProductionBypass: true,
      executionEnvironment: 'NON_PRODUCTION',
    });

    const save1 = store.saveHoldings('DEFAULT_PORTFOLIO', res1.userHoldings, {
      sourceBroker: 'ZERODHA',
      fileName: 'zerodha-operator.csv',
      contentDigest: res1.provenance.contentDigest,
      lineageDigest: res1.provenance.lineageDigest,
    });

    assert.strictEqual(save1.success, true);
    assert.strictEqual(store.getPortfolio('DEFAULT_PORTFOLIO')?.holdings.length, 4);

    // Import 2: Dhan Web UI with overlapping unmapped SUZLON and YESBANK plus AIIL (dual BSE) and AGI (alias)
    const res2 = BrokerImportIngressOrchestrator.executeIngress({
      content: DHAN_WEB_UI_OPERATOR_CSV,
      fileName: 'dhan-web-ui.csv',
      securityMaster,
      allowNonProductionBypass: true,
      executionEnvironment: 'NON_PRODUCTION',
    });

    const save2 = store.saveHoldings('DEFAULT_PORTFOLIO', res2.userHoldings, {
      sourceBroker: 'DHAN_WEB_UI_SUMMARY_V1',
      fileName: 'dhan-web-ui.csv',
      contentDigest: res2.provenance.contentDigest,
      lineageDigest: res2.provenance.lineageDigest,
    });

    assert.strictEqual(save2.success, true);
    const mergedHoldings = store.getPortfolio('DEFAULT_PORTFOLIO')?.holdings || [];

    // 4 from Zerodha + 4 from Dhan = 8 distinct holdings
    assert.strictEqual(mergedHoldings.length, 8);

    // Verify exact 100.0000% weight sum
    const totalWeight = mergedHoldings.reduce((sum: number, h: UserHoldingInput) => sum + h.weightPercentage, 0);
    assert.strictEqual(Number(totalWeight.toFixed(4)), 100.0);

    // Verify AIIL resolved to canonical P04
    const aiil = mergedHoldings.find((h: UserHoldingInput) => h.symbol === 'AIIL');
    assert.ok(aiil);
    assert.strictEqual(aiil.identityStatus, 'RESOLVED');
    assert.strictEqual(aiil.resolutionDisposition, 'CANONICAL_P04');
    assert.ok(aiil.companyId.length > 0);

    // Verify AGI resolved to canonical P04
    const agi = mergedHoldings.find((h: UserHoldingInput) => h.symbol === 'AGI' || h.symbol === 'AGI GREENPAC');
    assert.ok(agi);
    assert.strictEqual(agi.identityStatus, 'RESOLVED');
    assert.strictEqual(agi.resolutionDisposition, 'CANONICAL_P04');

    // Verify ASK AUTOMOTIVE is unmapped bypass
    const ask = mergedHoldings.find((h: UserHoldingInput) => h.symbol === 'ASK AUTOMOTIVE');
    assert.ok(ask);
    assert.strictEqual(ask.identityStatus, 'UNRESOLVED');
    assert.strictEqual(ask.companyId, '');

    // Now import another broker batch that adds MORE quantity to ASK AUTOMOTIVE
    const MORE_ASK_CSV = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
ASK AUTOMOTIVE,100,320.00,350.00,35000.00,3000.00,9.38,1.20`;

    const res3 = BrokerImportIngressOrchestrator.executeIngress({
      content: MORE_ASK_CSV,
      fileName: 'more-ask.csv',
      securityMaster,
      allowNonProductionBypass: true,
      executionEnvironment: 'NON_PRODUCTION',
    });

    const save3 = store.saveHoldings('DEFAULT_PORTFOLIO', res3.userHoldings, {
      sourceBroker: 'ZERODHA',
      fileName: 'more-ask.csv',
      contentDigest: res3.provenance.contentDigest,
      lineageDigest: res3.provenance.lineageDigest,
    });

    assert.strictEqual(save3.success, true);
    const postMergeAsk = store.getPortfolio('DEFAULT_PORTFOLIO')?.holdings.find((h: UserHoldingInput) => h.symbol === 'ASK AUTOMOTIVE');
    assert.ok(postMergeAsk);
    // 100 @ 300 + 100 @ 320 => 200 @ 310
    assert.strictEqual(postMergeAsk.quantity, 200);
    assert.strictEqual(postMergeAsk.averageBuyPrice, 310.0);
    assert.strictEqual(postMergeAsk.marketValue, 70000.0);
    assert.strictEqual(postMergeAsk.identityStatus, 'UNRESOLVED');
    assert.strictEqual(postMergeAsk.companyId, '');
  });

  await t.test('Criterion H & I: Switching bypass OFF enforces fail-closed behavior', () => {
    const failRes = BrokerImportIngressOrchestrator.executeIngress({
      content: ZERODHA_OPERATOR_CSV,
      fileName: 'zerodha-operator.csv',
      securityMaster,
      allowNonProductionBypass: false, // Default fail-closed mode
      executionEnvironment: 'NON_PRODUCTION',
    });

    assert.strictEqual(failRes.disposition, 'REJECTED');
    assert.strictEqual(failRes.userHoldings.length, 0);
    assert.ok(failRes.errors.length > 0);
  });

  await t.test('Criterion J: Governed D05 Entities Resolve Deterministically', () => {
    const D05_CSV = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
RELIANCE,10,2500.00,2600.00,26000.00,1000.00,4.00,0.10
TCS,10,3500.00,3600.00,36000.00,1000.00,2.86,0.10
INFY,10,1400.00,1500.00,15000.00,1000.00,7.14,0.10
HDFCBANK,10,1600.00,1700.00,17000.00,1000.00,6.25,0.10
ICICIBANK,10,1000.00,1100.00,11000.00,1000.00,10.00,0.10`;

    const res = BrokerImportIngressOrchestrator.executeIngress({
      content: D05_CSV,
      fileName: 'd05-nifty.csv',
      securityMaster,
      allowNonProductionBypass: false,
    });

    assert.strictEqual(res.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(res.userHoldings.length, 5);
    for (const h of res.userHoldings) {
      assert.strictEqual(h.identityStatus, 'RESOLVED');
      assert.strictEqual(h.resolutionDisposition, 'CANONICAL_P04');
      assert.ok(h.companyId.length > 0);
    }
  });

  await t.test('Criterion K: Controller view-model builds non-production bypass indicators', () => {
    const controller = new PortfolioBrokerImportController(securityMaster);
    const vm = controller.selectAndProcessFile({
      content: ZERODHA_OPERATOR_CSV,
      fileName: 'zerodha-operator.csv',
      allowNonProductionBypass: true,
      executionEnvironment: 'NON_PRODUCTION',
    });

    assert.strictEqual(vm.state, 'READY_TO_SAVE');
    assert.strictEqual(vm.identityResolutionStatus, 'NON_PRODUCTION_OPERATOR_BYPASS_ACTIVE');
    assert.strictEqual(vm.saveGuard.isSaveEnabled, true);
    assert.strictEqual(vm.saveGuard.allHoldingsHaveCompanyId, true); // Qualified under non-production bypass
    assert.strictEqual(vm.acceptedHoldingsCount, 4);
    assert.strictEqual(Number(vm.totalNormalizedWeight.toFixed(4)), 100.0);
  });
});
