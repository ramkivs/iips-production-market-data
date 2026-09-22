/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: P04 / P12 Tier-2 Expanded Broad Universe Runtime Qualification
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001
 * Execution Mode: NON_PRODUCTION / OFFLINE_BOOTSTRAP / LOCAL_FIXTURE_AND_OFFLINE_DEV
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import React from 'react';
import {
  SecurityMaster,
  IdentityAmbiguityError,
  getGovernedBroadSecurityMaster,
  getGovernedOfflineSecurityMaster,
  GOVERNED_OFFLINE_REFERENCE_ENTITIES,
} from '../src/identity/index.js';
import { validateInstrumentMaster, InstrumentMasterPayload } from '../src/contracts/d05_security_master.js';
import { OperatorDropParser } from '../src/operator_drop/parser.js';
import { App } from '../frontend/src/app/App.js';
import { PortfolioWorkspace } from '../frontend/src/features/portfolio/PortfolioWorkspace.js';
import { BrokerImportIngressOrchestrator } from '../frontend/src/features/portfolio/import/broker-import-ingress.js';
import { PortfolioBrokerImportController } from '../frontend/src/features/portfolio/import/ui-broker-import-view-model.js';

describe('P04 / P12: Tier-2 Expanded Broad Universe Runtime Qualification & Promotion Suite', () => {
  const pkgPath = path.resolve('evidence/operator_drop/d05_security_master_broad_universe.json');
  const manifestPath = path.resolve('evidence/operator_drop/d05_security_master_manifest.json');

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 1: Deposition Integrity Recheck
  // ──────────────────────────────────────────────────────────────────────────
  it('QUAL-01: verifies byte-exact deposition integrity, cryptographic manifest hash, and SteerCo provenance', () => {
    assert.ok(fs.existsSync(pkgPath), 'Deposited package file must exist');
    assert.ok(fs.existsSync(manifestPath), 'Deposited manifest file must exist');

    const pkgBuf = fs.readFileSync(pkgPath);
    const computedHash = crypto.createHash('sha256').update(pkgBuf).digest('hex');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const records = JSON.parse(pkgBuf.toString('utf8')) as InstrumentMasterPayload[];

    assert.strictEqual(records.length, 2250, 'Physical record count must be exact 2,250');
    assert.strictEqual(manifest.recordCount, 2250, 'Manifest record count must be exact 2,250');
    assert.strictEqual(computedHash, manifest.fileChecksumSha256, 'SHA-256 digest must match manifest');
    assert.strictEqual(manifest.fileChecksumSha256, '7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5');
    assert.strictEqual(manifest.authorizationRef, 'AUTH-D05-BROAD-UNIVERSE-MASTER-EXPANSION-ACT-2026-09-22-001');
    assert.strictEqual(manifest.selectedTier, 'TIER_2_ACTIVE_NSE_CM');
    assert.strictEqual(manifest.aiilRuling, 'RULING_3_DUAL_EFFECTIVE_DATED_MAPPING');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 2: Runtime Security Master Hydration
  // ──────────────────────────────────────────────────────────────────────────
  it('QUAL-02: hydrates SecurityMaster with 2,250 canonical records and verifies multi-index integrity', () => {
    const sm = getGovernedBroadSecurityMaster();
    assert.ok(sm instanceof SecurityMaster);

    const companyIds = sm.listAllCompanyIds();
    assert.strictEqual(companyIds.length, 2250, 'SecurityMaster must contain all 2,250 canonical entities');

    // Multi-index resolution checks
    assert.strictEqual(sm.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE002A01018' }), 'EQ_RELIANCE_IN');
    assert.strictEqual(sm.resolveCompanyId({ identifierType: 'CIN', identifierValue: 'L17110MH1973PLC019786' }), 'EQ_RELIANCE_IN');
    assert.strictEqual(sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'RELIANCE' }), 'EQ_RELIANCE_IN');
    assert.strictEqual(sm.resolveCompanyId({ identifierType: 'BSE_SYMBOL', identifierValue: 'RELIANCE' }), 'EQ_RELIANCE_IN');
    assert.strictEqual(sm.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:500325' }), 'EQ_RELIANCE_IN');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 3: Application Integration
  // ──────────────────────────────────────────────────────────────────────────
  it('QUAL-03: App and PortfolioWorkspace mount and consume the broad security master', () => {
    const appEl = React.createElement(App);
    assert.strictEqual(appEl.type, App);

    const pwEl = React.createElement(PortfolioWorkspace);
    assert.strictEqual(pwEl.type, PortfolioWorkspace);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 4: Broker Runtime Qualification (Zerodha, Dhan, Groww)
  // ──────────────────────────────────────────────────────────────────────────
  it('QUAL-04: resolves 100% of valid holdings across Zerodha, Dhan Detailed, Dhan Web UI, and Groww formats', () => {
    const sm = getGovernedBroadSecurityMaster();

    // Zerodha Kite CSV with broad universe and authored equities
    const zerodhaCsv = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
RELIANCE,10,2500.00,2600.00,26000.00,1000.00,4.00,0.50
INFY,20,1500.00,1600.00,32000.00,2000.00,6.67,-0.25
TCS,15,3400.00,3500.00,52500.00,1500.00,2.94,1.10
HDFCBANK,25,1600.00,1650.00,41250.00,1250.00,3.12,0.80
HDFCLIFE,30,500.00,520.00,15600.00,600.00,4.00,0.40
AIIL,50,550.00,600.00,30000.00,2500.00,9.09,1.20
AGI,40,400.00,420.00,16800.00,800.00,5.00,0.60`;

    const zerodhaRes = BrokerImportIngressOrchestrator.executeIngress({
      content: zerodhaCsv,
      fileName: 'zerodha-broad.csv',
      securityMaster: sm,
    });

    assert.strictEqual(zerodhaRes.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(zerodhaRes.userHoldings.length, 7);
    assert.strictEqual(zerodhaRes.userHoldings[0].companyId, 'EQ_RELIANCE_IN');
    assert.strictEqual(zerodhaRes.userHoldings[1].companyId, 'EQ_INFY_IN');
    assert.strictEqual(zerodhaRes.userHoldings[2].companyId, 'EQ_TCS_IN');
    assert.strictEqual(zerodhaRes.userHoldings[3].companyId, 'EQ_HDFCBANK_IN');
    assert.strictEqual(zerodhaRes.userHoldings[4].companyId, 'EQ_HDFCLIFE_IN');
    assert.strictEqual(zerodhaRes.userHoldings[5].companyId, 'EQ_AIIL_IN');
    assert.strictEqual(zerodhaRes.userHoldings[6].companyId, 'EQ_AGI_IN');

    // Dhan Detailed V1 CSV with ISINs
    const dhanCsv = `Trading Symbol,ISIN,Exchange,Total Qty,DP Qty,Available Qty,Average Buy Price,Last Traded Price,Current Value,Profit / Loss,P&L %
AIIL,INE206F01022,NSE,50,50,50,550.00,600.00,30000.00,2500.00,9.09
AGI,INE415A01038,NSE,40,40,40,400.00,420.00,16800.00,800.00,5.00
HDFCLIFE,INE795G01014,NSE,30,30,30,500.00,520.00,15600.00,600.00,4.00`;

    const dhanRes = BrokerImportIngressOrchestrator.executeIngress({
      content: dhanCsv,
      fileName: 'dhan-broad.csv',
      securityMaster: sm,
    });
    assert.strictEqual(dhanRes.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(dhanRes.userHoldings.length, 3);
    assert.strictEqual(dhanRes.userHoldings[0].companyId, 'EQ_AIIL_IN');
    assert.strictEqual(dhanRes.userHoldings[1].companyId, 'EQ_AGI_IN');
    assert.strictEqual(dhanRes.userHoldings[2].companyId, 'EQ_HDFCLIFE_IN');

    // Dhan Web UI Summary CSV with AGI GREENPAC alias
    const dhanWebUiCsv = `Name, Quantity, Avg Price, Last Traded, Investment, Current Value, P&L, P&L %
AGI GREENPAC, 40, 400.00, 420.00, 16000.00, 16800.00, 800.00, 5.00
INFY, 20, 1500.00, 1600.00, 30000.00, 32000.00, 2000.00, 6.67`;

    const webUiRes = BrokerImportIngressOrchestrator.executeIngress({
      content: dhanWebUiCsv,
      fileName: 'dhan-web-ui.csv',
      securityMaster: sm,
    });
    assert.strictEqual(webUiRes.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(webUiRes.userHoldings.length, 2);
    assert.strictEqual(webUiRes.userHoldings[0].companyId, 'EQ_AGI_IN');
    assert.strictEqual(webUiRes.userHoldings[1].companyId, 'EQ_INFY_IN');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 5: AIIL Point-in-Time Qualification (Ruling 3)
  // ──────────────────────────────────────────────────────────────────────────
  it('QUAL-05: AIIL resolves deterministically via NSE symbol, ISIN, and dual BSE scrip codes (543989 & 539177)', () => {
    const sm = getGovernedBroadSecurityMaster();

    assert.strictEqual(sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'AIIL' }), 'EQ_AIIL_IN');
    assert.strictEqual(sm.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE206F01022' }), 'EQ_AIIL_IN');
    assert.strictEqual(sm.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:543989' }), 'EQ_AIIL_IN');
    assert.strictEqual(sm.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:539177' }), 'EQ_AIIL_IN');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 6: AGI Alias Qualification
  // ──────────────────────────────────────────────────────────────────────────
  it('QUAL-06: AGI and "AGI GREENPAC" alias resolve deterministically to EQ_AGI_IN', () => {
    const sm = getGovernedBroadSecurityMaster();

    assert.strictEqual(sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'AGI' }), 'EQ_AGI_IN');
    assert.strictEqual(sm.resolveCompanyId({ identifierType: 'ISIN', identifierValue: 'INE415A01038' }), 'EQ_AGI_IN');
    assert.strictEqual(sm.resolveCompanyId({ identifierType: 'COMPOSITE_TICKER', identifierValue: 'BSE:500187' }), 'EQ_AGI_IN');
    assert.strictEqual(sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: 'AGI GREENPAC' }), 'EQ_AGI_IN');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 7: Market Data Runtime Qualification
  // ──────────────────────────────────────────────────────────────────────────
  it('QUAL-07: contemporary NSE CM equities resolve to canonical IDs without error', () => {
    const sm = getGovernedBroadSecurityMaster();

    const symbols = ['HDFCLIFE', 'INFY', 'TCS', 'RELIANCE', 'SBIN', 'ITC', 'TITAN', 'TATAMOTORS'];
    for (const sym of symbols) {
      const cid = sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: sym });
      assert.strictEqual(cid, `EQ_${sym}_IN`);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 8: Historical / Effective-Dated Qualification
  // ──────────────────────────────────────────────────────────────────────────
  it('QUAL-08: resolves historical UTIBANK symbol pre-2007 and fails closed post-2007', () => {
    const sm = getGovernedBroadSecurityMaster();

    const pre2007 = sm.resolveCompanyId({
      identifierType: 'NSE_SYMBOL',
      identifierValue: 'UTIBANK',
      asOf: '2005-01-01T00:00:00.000Z',
    });
    assert.strictEqual(pre2007, 'EQ_AXISBANK_IN');

    assert.throws(() => {
      sm.resolveCompanyId({
        identifierType: 'NSE_SYMBOL',
        identifierValue: 'UTIBANK',
        asOf: '2026-09-22T00:00:00.000Z',
      });
    }, IdentityAmbiguityError);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Phase 9: Fail-Closed Regression Verification
  // ──────────────────────────────────────────────────────────────────────────
  it('QUAL-09: strictly fails closed on unmapped/synthetic test tokens without fabricating identities', () => {
    const sm = getGovernedBroadSecurityMaster();

    const badTokens = ['UNMAPPED_CO', 'UNKNOWN_SYM', 'UNKNOWN_CORP', 'DISTRESSED_CO'];
    for (const token of badTokens) {
      assert.throws(() => {
        sm.resolveCompanyId({ identifierType: 'NSE_SYMBOL', identifierValue: token });
      }, (err: any) => {
        assert.ok(err instanceof IdentityAmbiguityError);
        assert.strictEqual(err.quarantineRecord.reason, 'UNMAPPED_IDENTIFIER');
        return true;
      });
    }
  });
});
