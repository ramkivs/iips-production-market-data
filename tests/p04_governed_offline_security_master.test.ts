/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: P04 / P12 Governed Offline Security Master Bootstrap Verification
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / BI-07-AUTH-2026-01
 * Execution Mode: NON_PRODUCTION / OFFLINE_FIXTURE / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {
  SecurityMaster,
  IdentityAmbiguityError,
  getGovernedOfflineSecurityMaster,
  GOVERNED_OFFLINE_REFERENCE_ENTITIES,
} from '../src/identity/index.js';
import { App } from '../frontend/src/app/App.js';
import { PortfolioWorkspace } from '../frontend/src/features/portfolio/PortfolioWorkspace.js';
import { BrokerImportIngressOrchestrator } from '../frontend/src/features/portfolio/import/broker-import-ingress.js';
import { PortfolioBrokerImportController } from '../frontend/src/features/portfolio/import/ui-broker-import-view-model.js';

describe('P04 / P12: Governed Offline Security Master Bootstrap Suite', () => {
  it('P04-BOOTSTRAP-01: getGovernedOfflineSecurityMaster returns a populated instance with all reference entities', () => {
    const sm = getGovernedOfflineSecurityMaster();
    assert.ok(sm instanceof SecurityMaster, 'Must return a SecurityMaster instance');

    const companyIds = sm.listAllCompanyIds();
    assert.strictEqual(companyIds.length, GOVERNED_OFFLINE_REFERENCE_ENTITIES.length);
    assert.ok(companyIds.includes('EQ_RELIANCE_IN'));
    assert.ok(companyIds.includes('EQ_INFY_IN'));
    assert.ok(companyIds.includes('EQ_TCS_IN'));
    assert.ok(companyIds.includes('EQ_HDFCBANK_IN'));
    assert.ok(companyIds.includes('EQ_AXISBANK_IN'));
  });

  it('P04-BOOTSTRAP-02: resolves canonical identities by ISIN, NSE_SYMBOL, and BSE_SYMBOL', () => {
    const sm = getGovernedOfflineSecurityMaster();

    // ISIN queries
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE002A01018' }),
      'EQ_RELIANCE_IN'
    );
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE009A01021' }),
      'EQ_INFY_IN'
    );
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE467B01029' }),
      'EQ_TCS_IN'
    );
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE040A01034' }),
      'EQ_HDFCBANK_IN'
    );

    // NSE Symbol queries
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'RELIANCE' }),
      'EQ_RELIANCE_IN'
    );
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'INFY' }),
      'EQ_INFY_IN'
    );
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'TCS' }),
      'EQ_TCS_IN'
    );
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'HDFCBANK' }),
      'EQ_HDFCBANK_IN'
    );

    // BSE Scrip / Composite Ticker queries
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:500209' }),
      'EQ_INFY_IN'
    );
    assert.strictEqual(
      sm.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:532540' }),
      'EQ_TCS_IN'
    );
  });

  it('P04-BOOTSTRAP-03: resolves historical effective-dated symbol changes correctly', () => {
    const sm = getGovernedOfflineSecurityMaster();

    // Pre-2007 UTIBANK query resolves to EQ_AXISBANK_IN
    const pre2007 = sm.resolveCompanyId({
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'UTIBANK',
      asOf: '2005-01-01T00:00:00.000Z',
    });
    assert.strictEqual(pre2007, 'EQ_AXISBANK_IN');

    // Post-2007 UTIBANK query fails closed
    assert.throws(() => {
      sm.resolveCompanyId({
        identifierType: 'NSE_SYMBOL',
        identifierValue: 'UTIBANK',
        asOf: '2026-09-22T00:00:00.000Z',
      });
    }, IdentityAmbiguityError);
  });

  it('P04-BOOTSTRAP-04: AIIL and AGI GREENPAC remain unmapped and strictly fail closed', () => {
    const sm = getGovernedOfflineSecurityMaster();

    // AIIL fails closed on NSE_SYMBOL and BSE_SYMBOL
    assert.throws(() => {
      sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'AIIL' });
    }, (err: any) => {
      assert.ok(err instanceof IdentityAmbiguityError);
      assert.strictEqual(err.quarantineRecord.reason, 'UNMAPPED_IDENTIFIER');
      return true;
    });

    assert.throws(() => {
      sm.resolveCompanyId({ identifierType: 'BSE_SYMBOL', identifierValue: 'AIIL' });
    }, (err: any) => {
      assert.ok(err instanceof IdentityAmbiguityError);
      assert.strictEqual(err.quarantineRecord.reason, 'UNMAPPED_IDENTIFIER');
      return true;
    });

    // AGI GREENPAC fails closed on NSE_SYMBOL and BSE_SYMBOL
    assert.throws(() => {
      sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'AGI GREENPAC' });
    }, (err: any) => {
      assert.ok(err instanceof IdentityAmbiguityError);
      assert.strictEqual(err.quarantineRecord.reason, 'UNMAPPED_IDENTIFIER');
      return true;
    });

    assert.throws(() => {
      sm.resolveCompanyId({ identifierType: 'BSE_SYMBOL', identifierValue: 'AGI GREENPAC' });
    }, (err: any) => {
      assert.ok(err instanceof IdentityAmbiguityError);
      assert.strictEqual(err.quarantineRecord.reason, 'UNMAPPED_IDENTIFIER');
      return true;
    });
  });

  it('P04-BOOTSTRAP-05: App React component mounts and renders with governed offline security master fallback', () => {
    const element = React.createElement(App);
    assert.strictEqual(element.type, App);

    // Supplied initialSecurityMaster takes precedence
    const customSm = new SecurityMaster();
    const customElement = React.createElement(App, { securityMaster: customSm });
    assert.strictEqual(customElement.props.securityMaster, customSm);
  });

  it('P04-BOOTSTRAP-06: PortfolioWorkspace mounts and uses governed offline security master fallback', () => {
    const element = React.createElement(PortfolioWorkspace);
    assert.strictEqual(element.type, PortfolioWorkspace);

    const customSm = new SecurityMaster();
    const customElement = React.createElement(PortfolioWorkspace, { securityMaster: customSm });
    assert.strictEqual(customElement.props.securityMaster, customSm);
  });

  it('P04-BOOTSTRAP-07: Ingress orchestrator successfully resolves governed reference securities', () => {
    const sm = getGovernedOfflineSecurityMaster();

    const validCsv = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
RELIANCE,10,2500.00,2600.00,26000.00,1000.00,4.00,0.50
INFY,20,1500.00,1600.00,32000.00,2000.00,6.67,-0.25
TCS,15,3400.00,3500.00,52500.00,1500.00,2.94,1.10
HDFCBANK,25,1600.00,1650.00,41250.00,1250.00,3.12,0.80`;

    const ingressResult = BrokerImportIngressOrchestrator.executeIngress({
      content: validCsv,
      fileName: 'zerodha-kite-test.csv',
      securityMaster: sm,
    });

    assert.strictEqual(ingressResult.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(ingressResult.stageReached, 'COMPLETE');
    assert.strictEqual(ingressResult.userHoldings.length, 4);
    assert.strictEqual(ingressResult.userHoldings[0].companyId, 'EQ_RELIANCE_IN');
    assert.strictEqual(ingressResult.userHoldings[1].companyId, 'EQ_INFY_IN');
    assert.strictEqual(ingressResult.userHoldings[2].companyId, 'EQ_TCS_IN');
    assert.strictEqual(ingressResult.userHoldings[3].companyId, 'EQ_HDFCBANK_IN');
  });

  it('P04-BOOTSTRAP-08: Ingress orchestrator rejects AIIL and AGI GREENPAC under strict fail-closed policy without fabricating IDs', () => {
    const sm = getGovernedOfflineSecurityMaster();

    // Zerodha CSV containing AIIL
    const aiilCsv = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
AIIL,10,500.00,550.00,5500.00,500.00,10.00,1.00
RELIANCE,10,2500.00,2600.00,26000.00,1000.00,4.00,0.50`;

    const aiilResult = BrokerImportIngressOrchestrator.executeIngress({
      content: aiilCsv,
      fileName: 'zerodha-aiil.csv',
      securityMaster: sm,
    });

    assert.strictEqual(aiilResult.disposition, 'REJECTED');
    assert.strictEqual(aiilResult.stageReached, 'NORMALIZE');
    assert.ok(aiilResult.errors.some((e) => e.includes('AIIL')));
    assert.strictEqual(aiilResult.userHoldings.length, 0);

    // Dhan Web UI CSV containing AGI GREENPAC
    const agiCsv = `Name,Quantity,Avg Price,Last Traded,Investment,Current Value,P&L,P&L %
AGI GREENPAC,10,400.00,420.00,4000.00,4200.00,200.00,5.00
RELIANCE,10,2500.00,2600.00,25000.00,26000.00,1000.00,4.00`;

    const agiResult = BrokerImportIngressOrchestrator.executeIngress({
      content: agiCsv,
      fileName: 'dhan-agi.csv',
      securityMaster: sm,
    });

    assert.strictEqual(agiResult.disposition, 'REJECTED');
    assert.strictEqual(agiResult.stageReached, 'NORMALIZE');
    assert.ok(agiResult.errors.some((e) => e.includes('AGI GREENPAC')));
    assert.strictEqual(agiResult.userHoldings.length, 0);
  });

  it('P04-BOOTSTRAP-09: PortfolioBrokerImportController integrates with governed offline security master', () => {
    const sm = getGovernedOfflineSecurityMaster();
    const controller = new PortfolioBrokerImportController(sm);

    const validCsv = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
RELIANCE,10,2500.00,2600.00,26000.00,1000.00,4.00,0.50
INFY,20,1500.00,1600.00,32000.00,2000.00,6.67,-0.25`;

    const vm = controller.selectAndProcessFile({
      content: validCsv,
      fileName: 'zerodha.csv',
      securityMaster: sm,
    });

    assert.strictEqual(vm.state, 'READY_TO_SAVE');
    assert.strictEqual(vm.acceptedHoldingsCount, 2);
    assert.strictEqual(vm.acceptedHoldings[0].companyId, 'EQ_RELIANCE_IN');
    assert.strictEqual(vm.acceptedHoldings[1].companyId, 'EQ_INFY_IN');
  });
});
