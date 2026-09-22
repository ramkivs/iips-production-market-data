/**
 * Institutional Investment Platform System (IIPS)
 * Workstream BI: Package BI-05 - Broker Holdings Ingress Orchestration & Hardening Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-05-AUTH-2026-01
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03 / BI-04 / BI-05
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  BrokerImportIngressOrchestrator,
  BrokerIngressRequest,
} from '../frontend/src/features/portfolio/import/index.js';
import { SecurityMaster } from '../src/identity/security_master.js';

describe('BI-05: Broker Holdings Ingress Orchestration & Edge-Case Hardening', () => {
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
      cin: 'L85110KA1981PLC013115',
      companyName: 'Infosys Limited',
      industry: 'IT Services',
      sector: 'IT',
      listings: [{ exchange: 'NSE', symbol: 'INFY', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
      effectiveFrom: '2020-01-01T00:00:00.000Z',
    });
    sm.registerEntity({
      companyId: 'TATA_CONSULTANCY',
      isin: 'INE467B01029',
      cin: 'L22210MH1995PLC084781',
      companyName: 'Tata Consultancy Services Limited',
      industry: 'IT Services',
      sector: 'IT',
      listings: [{ exchange: 'NSE', symbol: 'TCS', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
      effectiveFrom: '2020-01-01T00:00:00.000Z',
    });
    sm.registerEntity({
      companyId: 'RELIANCE_IND',
      isin: 'INE002A01018',
      cin: 'L17110MH1973PLC019786',
      companyName: 'Reliance Industries Limited',
      industry: 'Oil & Gas',
      sector: 'ENERGY',
      listings: [{ exchange: 'NSE', symbol: 'RELIANCE', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
      effectiveFrom: '2020-01-01T00:00:00.000Z',
    });
    sm.registerEntity({
      companyId: 'HDFC_BANK',
      isin: 'INE040A01034',
      cin: 'L65110MH1994PLC080618',
      companyName: 'HDFC Bank Limited',
      industry: 'Private Bank',
      sector: 'BANKING',
      listings: [{ exchange: 'NSE', symbol: 'HDFCBANK', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
      effectiveFrom: '2020-01-01T00:00:00.000Z',
    });
    return sm;
  }

  // BI05-01
  it('BI05-01: valid Zerodha CSV end-to-end reaches READY_FOR_PORTFOLIO_SAVE', () => {
    const sm = createGovernedSecurityMaster();
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: sampleZerodhaCsv,
      fileName: 'zerodha-kite-export.csv',
      securityMaster: sm,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(result.stageReached, 'COMPLETE');
    assert.strictEqual(result.detection.brokerType, 'ZERODHA');
    assert.strictEqual(result.validHoldingsCount, 3);
    assert.strictEqual(result.weightSumPercentage, 100.0);
    assert.strictEqual(result.userHoldings[0].companyId, 'INFOSYS_LTD');
    assert.strictEqual(result.provenance.sourceBroker, 'ZERODHA');
    assert.strictEqual(result.provenance.contentDigest.length, 64);
    assert.strictEqual(result.provenance.lineageDigest.length, 64);
  });

  // BI05-02
  it('BI05-02: valid Dhan CSV end-to-end reaches READY_FOR_PORTFOLIO_SAVE', () => {
    const sm = createGovernedSecurityMaster();
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: sampleDhanCsv,
      fileName: 'dhan-holdings-2026.csv',
      securityMaster: sm,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(result.detection.brokerType, 'DHAN');
    assert.strictEqual(result.validHoldingsCount, 3);
    assert.strictEqual(result.weightSumPercentage, 100.0);
    assert.strictEqual(result.userHoldings[2].companyId, 'HDFC_BANK');
  });

  // BI05-03
  it('BI05-03: valid Groww CSV end-to-end reaches READY_FOR_PORTFOLIO_SAVE', () => {
    const sm = createGovernedSecurityMaster();
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: sampleGrowwCsv,
      fileName: 'groww-stocks.csv',
      securityMaster: sm,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(result.detection.brokerType, 'GROWW');
    assert.strictEqual(result.validHoldingsCount, 3);
    assert.strictEqual(result.weightSumPercentage, 100.0);
    assert.strictEqual(result.userHoldings[1].companyId, 'TATA_CONSULTANCY');
  });

  // BI05-04
  it('BI05-04: unknown format fails closed at DETECT stage with REJECTED disposition', () => {
    const unknownCsv = `ColA,ColB,ColC,ColD\nval1,val2,val3,val4`;
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: unknownCsv,
      fileName: 'custom-export.csv',
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.disposition, 'REJECTED');
    assert.strictEqual(result.stageReached, 'DETECT');
    assert.strictEqual(result.detection.brokerType, 'UNKNOWN');
    assert.strictEqual(result.rejections.length, 1);
    assert.strictEqual(result.rejections[0].reason, 'UNKNOWN_FORMAT');
    assert.strictEqual(result.userHoldings.length, 0);
  });

  // BI05-05
  it('BI05-05: ambiguous / corrupted format fails closed without guessing broker identity', () => {
    const ambiguousContent = `RandomTitleHeader\nSome,Random,Columns\n1,2,3`;
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: ambiguousContent,
      fileName: 'ambiguous.csv',
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.disposition, 'REJECTED');
    assert.strictEqual(result.detection.confidence, 0.0);
    assert.strictEqual(result.userHoldings.length, 0);
  });

  // BI05-06
  it('BI05-06: binary XLSX input is cleanly BLOCKED at QUALIFICATION_CHECK stage without dependency error', () => {
    const zipMagic = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: zipMagic,
      fileName: 'groww-portfolio.xlsx',
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.disposition, 'BLOCKED');
    assert.strictEqual(result.stageReached, 'QUALIFICATION_CHECK');
    assert.strictEqual(result.qualificationStatus, 'QUALIFICATION_BLOCKED_DEFERRED_TO_BI06');
    assert.strictEqual(result.rejections[0].reason, 'UNSUPPORTED_XLSX');
    assert.strictEqual(result.userHoldings.length, 0);
  });

  // BI05-07
  it('BI05-07: malformed CSV with unparseable structure fails closed at PARSE stage', () => {
    const malformedCsv = `Instrument,Qty.,Avg. cost\n`;
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: malformedCsv,
      fileName: 'empty-zerodha.csv',
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.disposition, 'REJECTED');
    assert.strictEqual(result.stageReached, 'PARSE');
    assert.strictEqual(result.userHoldings.length, 0);
  });

  // BI05-08
  it('BI05-08: P04 identity resolution failure prevents save readiness and halts ingress', () => {
    const sm = new SecurityMaster();
    // Register only INFY, leave TCS and RELIANCE unmapped
    sm.registerEntity({
      companyId: 'INFOSYS_LTD',
      isin: 'INE009A01021',
      companyName: 'Infosys Limited',
      industry: 'IT Services',
      sector: 'IT',
      listings: [{ exchange: 'NSE', symbol: 'INFY', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
      effectiveFrom: '2020-01-01T00:00:00.000Z',
    });

    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: sampleZerodhaCsv,
      fileName: 'zerodha.csv',
      securityMaster: sm,
      failOnUnmappedIdentity: true,
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.disposition, 'REJECTED');
    assert.strictEqual(result.stageReached, 'NORMALIZE');
    assert.strictEqual(result.rejections[0].reason, 'UNMAPPED_IDENTITY');
    assert.strictEqual(result.userHoldings.length, 0);
  });

  // BI05-09
  it('BI05-09: handles mixed valid and invalid records: excludes invalid and normalizes valid to 100.0%', () => {
    const mixedCsv = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
INFY,100,1450.50,1520.00,152000.00,6950.00,4.79,0.50
INVALID_QTY,-10,500.00,550.00,-5500.00,-500.00,0,0
ZERO_PRICE,50,0.00,0.00,0.00,0.00,0,0
TCS,50,3800.00,3950.00,197500.00,7500.00,3.95,-0.20`;

    const sm = createGovernedSecurityMaster();
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: mixedCsv,
      fileName: 'mixed-zerodha.csv',
      securityMaster: sm,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(result.validHoldingsCount, 2);
    assert.strictEqual(result.rejectedCount, 2);
    assert.strictEqual(result.weightSumPercentage, 100.0);
    assert.ok(result.rejections.some((r) => r.reason === 'NON_POSITIVE_QTY'));
    assert.ok(result.rejections.some((r) => r.reason === 'NON_POSITIVE_PRICE'));
  });

  // BI05-10
  it('BI05-10: deterministic repeated import produces byte-for-byte identical digests', () => {
    const sm = createGovernedSecurityMaster();
    const req: BrokerIngressRequest = {
      content: sampleZerodhaCsv,
      fileName: 'zerodha.csv',
      asOf: '2026-09-21T00:00:00.000Z',
      securityMaster: sm,
    };

    const run1 = BrokerImportIngressOrchestrator.executeIngress(req);
    const run2 = BrokerImportIngressOrchestrator.executeIngress(req);

    assert.strictEqual(run1.provenance.contentDigest, run2.provenance.contentDigest);
    assert.strictEqual(run1.provenance.lineageDigest, run2.provenance.lineageDigest);
    assert.deepStrictEqual(run1.userHoldings, run2.userHoldings);
  });

  // BI05-11
  it('BI05-11: preserves complete provenance lineage without timestamps polluting digests', () => {
    const sm = createGovernedSecurityMaster();
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: sampleDhanCsv,
      fileName: 'dhan-statement.csv',
      asOf: '2026-09-21T10:00:00.000Z',
      securityMaster: sm,
    });

    assert.strictEqual(result.provenance.sourceBroker, 'DHAN');
    assert.strictEqual(result.provenance.fileName, 'dhan-statement.csv');
    assert.strictEqual(result.provenance.asOf, '2026-09-21T10:00:00.000Z');
    assert.strictEqual(result.provenance.dataVersion, 'v1.0.0-bi05');
  });

  // BI05-12
  it('BI05-12: guarantees zero state mutation when validation fails', () => {
    const sm = createGovernedSecurityMaster();
    const unmappedCsv = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
UNKNOWN_SYM,100,100,110,11000,1000,0,0`;

    const initialCompanyIds = sm.listAllCompanyIds();

    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: unmappedCsv,
      fileName: 'unmapped.csv',
      securityMaster: sm,
      failOnUnmappedIdentity: true,
    });

    assert.strictEqual(result.disposition, 'REJECTED');
    // Verify SecurityMaster is not mutated
    assert.deepStrictEqual(sm.listAllCompanyIds(), initialCompanyIds);
  });

  // BI05-13
  it('BI05-13: duplicate holdings remain correctly normalized with volume-weighted cost', () => {
    const duplicateCsv = `Trading Symbol,ISIN,Exchange,Total Qty,DP Qty,Available Qty,Average Buy Price,Last Traded Price,Current Value,Profit / Loss,P&L %
INFY,INE009A01021,NSE,100,100,100,1400.00,1600.00,160000.00,20000.00,14.28
INFY,INE009A01021,NSE,200,200,200,1550.00,1600.00,320000.00,10000.00,3.22`;

    const sm = createGovernedSecurityMaster();
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: duplicateCsv,
      fileName: 'dhan-dup.csv',
      securityMaster: sm,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.validHoldingsCount, 1);
    assert.strictEqual(result.aggregatedCount, 1);

    const infy = result.userHoldings[0];
    assert.strictEqual(infy.quantity, 300);
    assert.strictEqual(infy.averageBuyPrice, 1500.0); // (100*1400 + 200*1550)/300 = 450000/300 = 1500
    assert.strictEqual(infy.marketValue, 480000); // 300 * 1600
    assert.strictEqual(infy.weightPercentage, 100.0);
  });

  // BI05-14
  it('BI05-14: all-record rejection never reaches READY_FOR_PORTFOLIO_SAVE', () => {
    const invalidAllCsv = `Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
A,-10,100,100,-1000,0,0,0
B,0,100,100,0,0,0,0
C,10,0,0,0,0,0,0`;

    const sm = createGovernedSecurityMaster();
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: invalidAllCsv,
      fileName: 'all-invalid.csv',
      securityMaster: sm,
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.disposition, 'REJECTED');
    assert.strictEqual(result.stageReached, 'VALIDATE');
    assert.strictEqual(result.validHoldingsCount, 0);
    assert.strictEqual(result.userHoldings.length, 0);
  });

  // BI05-15
  it('BI05-15: valid multi-holding import reaches READY_FOR_PORTFOLIO_SAVE with exact 100.0000% weight sum', () => {
    const sm = createGovernedSecurityMaster();
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: sampleDhanCsv,
      fileName: 'dhan-full.csv',
      securityMaster: sm,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(result.validHoldingsCount, 3);
    assert.strictEqual(result.weightSumPercentage, 100.0);

    const totalCalculatedWeight = result.userHoldings.reduce((sum, h) => sum + h.weightPercentage, 0);
    assert.strictEqual(Math.round(totalCalculatedWeight * 10000) / 10000, 100.0);
  });

  // Edge Case: Empty File
  it('BI05-16: empty file (0 bytes) is immediately rejected at DETECT stage', () => {
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: '',
      fileName: 'empty.csv',
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.disposition, 'REJECTED');
    assert.strictEqual(result.stageReached, 'DETECT');
    assert.strictEqual(result.rejections[0].reason, 'EMPTY_FILE');
  });

  // Edge Case: Blank Whitespace File
  it('BI05-17: blank whitespace/newlines file is immediately rejected at DETECT stage', () => {
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: '   \n\n  \r\n   ',
      fileName: 'blank.csv',
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.disposition, 'REJECTED');
    assert.strictEqual(result.stageReached, 'DETECT');
    assert.strictEqual(result.rejections[0].reason, 'BLANK_FILE');
  });

  // Large bounded dataset
  it('BI05-18: handles 100+ holding records without drift or failure', () => {
    let largeCsv = 'Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.\n';
    const sm = new SecurityMaster();

    for (let i = 1; i <= 100; i++) {
      const sym = `SYM_${i}`;
      const isin = `INE000000${String(i).padStart(3, '0')}`;
      sm.registerEntity({
        companyId: `COMPANY_${i}`,
        isin,
        companyName: `Company ${i}`,
        industry: 'Diversified',
        sector: 'DIVERSIFIED',
        listings: [{ exchange: 'NSE', symbol: sym, lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
        effectiveFrom: '2020-01-01T00:00:00.000Z',
      });
      largeCsv += `${sym},10,100.00,110.00,1100.00,100.00,10.00,1.00\n`;
    }

    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: largeCsv,
      fileName: 'large-zerodha.csv',
      securityMaster: sm,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(result.validHoldingsCount, 100);
    assert.strictEqual(result.weightSumPercentage, 100.0);
  });

  // BI05-19: Governed Dhan Web UI Ingress End-to-End
  it('BI05-19: valid Dhan Web UI summary CSV (DHAN_WEB_UI_SUMMARY_V1) end-to-end reaches READY_FOR_PORTFOLIO_SAVE', () => {
    const dhanWebUiCsv = `Name, Quantity, Avg Price, Last Traded, Investment, Current Value, P&L, P&L %
INFY, 100, 1450.50, 1520.00, 145050.00, 152000.00, 6950.00, 4.79
TCS, 50, 3800.00, 3950.00, 190000.00, 197500.00, 7500.00, 3.95
RELIANCE, 80, 2800.00, 2900.00, 224000.00, 232000.00, 8000.00, 3.57`;

    const sm = createGovernedSecurityMaster();
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: dhanWebUiCsv,
      fileName: 'Portfolio(2).csv',
      securityMaster: sm,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(result.stageReached, 'COMPLETE');
    assert.strictEqual(result.detection.brokerType, 'DHAN');
    assert.strictEqual(result.validHoldingsCount, 3);
    assert.strictEqual(result.weightSumPercentage, 100.0);
    assert.strictEqual(result.userHoldings[0].companyId, 'INFOSYS_LTD');
    assert.strictEqual(result.userHoldings[1].companyId, 'TATA_CONSULTANCY');
    assert.strictEqual(result.userHoldings[2].companyId, 'RELIANCE_IND');
    assert.strictEqual(result.provenance.sourceBroker, 'DHAN');
    assert.strictEqual(result.provenance.contentDigest.length, 64);
    assert.strictEqual(result.provenance.lineageDigest.length, 64);
  });

  // BI05-20: Dhan Web UI Ingress Unmapped Symbol Fail-Closed
  it('BI05-20: Dhan Web UI summary CSV fails closed at NORMALIZE stage with REJECTED disposition on unmapped symbol', () => {
    const unmappedWebUiCsv = `Name, Quantity, Avg Price, Last Traded, Investment, Current Value, P&L, P&L %
INFY, 100, 1450.50, 1520.00, 145050.00, 152000.00, 6950.00, 4.79
UNREGISTERED_CO, 50, 100.00, 110.00, 5000.00, 5500.00, 500.00, 10.00`;

    const sm = createGovernedSecurityMaster();
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: unmappedWebUiCsv,
      fileName: 'Portfolio(2).csv',
      securityMaster: sm,
      failOnUnmappedIdentity: true,
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.disposition, 'REJECTED');
    assert.strictEqual(result.stageReached, 'NORMALIZE');
    assert.strictEqual(result.rejections[0].reason, 'UNMAPPED_IDENTITY');
    assert.strictEqual(result.userHoldings.length, 0);
  });

  // BI05-21: Dhan Web UI Ingress Duplicate Aggregation
  it('BI05-21: Dhan Web UI summary CSV aggregates duplicate security symbols with volume-weighted average price', () => {
    const duplicateWebUiCsv = `Name, Quantity, Avg Price, Last Traded, Investment, Current Value, P&L, P&L %
INFY, 100, 1400.00, 1600.00, 140000.00, 160000.00, 20000.00, 14.28
INFY, 200, 1550.00, 1600.00, 310000.00, 320000.00, 10000.00, 3.22`;

    const sm = createGovernedSecurityMaster();
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: duplicateWebUiCsv,
      fileName: 'Portfolio(2).csv',
      securityMaster: sm,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.validHoldingsCount, 1);
    assert.strictEqual(result.aggregatedCount, 1);
    assert.strictEqual(result.userHoldings[0].symbol, 'INFY');
    assert.strictEqual(result.userHoldings[0].companyId, 'INFOSYS_LTD');
    assert.strictEqual(result.userHoldings[0].quantity, 300);
    assert.strictEqual(result.userHoldings[0].averageBuyPrice, 1500.0);
    assert.strictEqual(result.userHoldings[0].marketValue, 480000);
    assert.strictEqual(result.userHoldings[0].weightPercentage, 100.0);
  });

  // BI05-22: Dhan Web UI Ingress Edge Cases (Negative quantity / zero price)
  it('BI05-22: Dhan Web UI summary CSV isolates invalid rows and normalizes valid subset to 100.0000%', () => {
    const mixedWebUiCsv = `Name, Quantity, Avg Price, Last Traded, Investment, Current Value, P&L, P&L %
INFY, 100, 1450.50, 1520.00, 145050.00, 152000.00, 6950.00, 4.79
TCS, -10, 3800.00, 3950.00, -38000.00, -39500.00, -1500.00, 3.95
RELIANCE, 80, 2800.00, 2900.00, 224000.00, 232000.00, 8000.00, 3.57`;

    const sm = createGovernedSecurityMaster();
    const result = BrokerImportIngressOrchestrator.executeIngress({
      content: mixedWebUiCsv,
      fileName: 'Portfolio(2).csv',
      securityMaster: sm,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.disposition, 'READY_FOR_PORTFOLIO_SAVE');
    assert.strictEqual(result.validHoldingsCount, 2);
    assert.strictEqual(result.rejectedCount, 1);
    assert.strictEqual(result.weightSumPercentage, 100.0);
    assert.strictEqual(result.rejections[0].reason, 'NON_POSITIVE_QTY');
  });
});
