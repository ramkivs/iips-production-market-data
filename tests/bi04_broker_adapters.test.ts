/**
 * Institutional Investment Platform System (IIPS)
 * Workstream BI: Package BI-04 - Broker-Specific Adapters & Format Detector Tests
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-04-AUTH-2026-01
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03 / BI-04
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  BrokerFormatDetector,
  ZerodhaHoldingsAdapter,
  DhanHoldingsAdapter,
  GrowwHoldingsAdapter,
  mapBrokerOutputToUserHoldings,
  FinappBrokerParseResult,
} from '../frontend/src/features/portfolio/import/index.js';
import { SecurityMaster } from '../src/identity/security_master.js';

describe('BI-04: Offline Broker Adapters & Format Detector Suite', () => {
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

  // BI04-01
  it('BI04-01: Zerodha supported-format detection deterministically identifies Zerodha Kite CSV', () => {
    const detection = BrokerFormatDetector.detectFormat(sampleZerodhaCsv, 'kite-holdings.csv');

    assert.strictEqual(detection.brokerType, 'ZERODHA');
    assert.strictEqual(detection.confidence, 1.0);
    assert.strictEqual(detection.format, 'CSV');
    assert.strictEqual(detection.requiresXlsx, false);
    assert.ok(detection.detectedHeaders.includes('Instrument'));
  });

  // BI04-02
  it('BI04-02: Zerodha CSV parsing extracts valid FinappHolding records with correct values', () => {
    const adapter = new ZerodhaHoldingsAdapter();
    const result = adapter.parse(sampleZerodhaCsv, { fileName: 'zerodha-2026.csv' });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.brokerType, 'ZERODHA');
    assert.strictEqual(result.totalHoldings, 3);
    assert.strictEqual(result.totalValue, 581500);

    const infy = result.holdings.find((h) => h.symbol === 'INFY')!;
    assert.ok(infy);
    assert.strictEqual(infy.quantity, 100);
    assert.strictEqual(infy.averagePrice, 1450.5);
    assert.strictEqual(infy.currentPrice, 1520);
    assert.strictEqual(infy.marketValue, 152000);
    assert.strictEqual(infy.pnl, 6950);
  });

  // BI04-03
  it('BI04-03: Dhan supported-format detection deterministically identifies Dhan CSV', () => {
    const detection = BrokerFormatDetector.detectFormat(sampleDhanCsv, 'dhan-statement.csv');

    assert.strictEqual(detection.brokerType, 'DHAN');
    assert.strictEqual(detection.confidence, 1.0);
    assert.strictEqual(detection.format, 'CSV');
    assert.strictEqual(detection.requiresXlsx, false);
    assert.ok(detection.detectedHeaders.includes('Trading Symbol'));
  });

  // BI04-04
  it('BI04-04: Dhan CSV parsing extracts valid FinappHolding records preserving ISIN and exchange', () => {
    const adapter = new DhanHoldingsAdapter();
    const result = adapter.parse(sampleDhanCsv, { fileName: 'dhan-holdings.csv' });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.brokerType, 'DHAN');
    assert.strictEqual(result.totalHoldings, 3);
    assert.strictEqual(result.totalValue, 547500);

    const hdfc = result.holdings.find((h) => h.symbol === 'HDFCBANK')!;
    assert.ok(hdfc);
    assert.strictEqual(hdfc.isin, 'INE040A01034');
    assert.strictEqual(hdfc.exchange, 'NSE');
    assert.strictEqual(hdfc.quantity, 120);
    assert.strictEqual(hdfc.averagePrice, 1600);
    assert.strictEqual(hdfc.currentPrice, 1650);
    assert.strictEqual(hdfc.marketValue, 198000);
  });

  // BI04-05
  it('BI04-05: Groww supported-format detection deterministically identifies Groww CSV', () => {
    const detection = BrokerFormatDetector.detectFormat(sampleGrowwCsv, 'groww-stocks.csv');

    assert.strictEqual(detection.brokerType, 'GROWW');
    assert.strictEqual(detection.confidence, 1.0);
    assert.strictEqual(detection.format, 'CSV');
    assert.strictEqual(detection.requiresXlsx, false);
    assert.ok(detection.detectedHeaders.includes('Stock Name'));
  });

  // BI04-06
  it('BI04-06: Groww CSV parsing extracts valid FinappHolding records without external dependencies', () => {
    const adapter = new GrowwHoldingsAdapter();
    const result = adapter.parse(sampleGrowwCsv, { fileName: 'groww-export.csv' });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.brokerType, 'GROWW');
    assert.strictEqual(result.totalHoldings, 3);
    assert.strictEqual(result.totalValue, 581500);

    const tcs = result.holdings.find((h) => h.symbol === 'TCS')!;
    assert.ok(tcs);
    assert.strictEqual(tcs.isin, 'INE467B01029');
    assert.strictEqual(tcs.quantity, 50);
    assert.strictEqual(tcs.averagePrice, 3800);
    assert.strictEqual(tcs.marketValue, 197500);
  });

  // BI04-07
  it('BI04-07: UNKNOWN / ambiguous format fails closed without guessing broker identity', () => {
    const ambiguousCsv = `RandomColA,RandomColB,RandomColC\n1,2,3\n4,5,6`;
    const detection = BrokerFormatDetector.detectFormat(ambiguousCsv);

    assert.strictEqual(detection.brokerType, 'UNKNOWN');
    assert.strictEqual(detection.confidence, 0.0);
    assert.strictEqual(detection.format, 'CSV');
    assert.ok(detection.details.includes('Fail closed'));

    const { adapter } = BrokerFormatDetector.detectAndGetAdapter(ambiguousCsv);
    assert.strictEqual(adapter, undefined);
  });

  // BI04-08
  it('BI04-08: malformed input does not produce fabricated holdings and fails gracefully', () => {
    const malformedCsv = `Instrument,Qty.,Avg. cost\n,\ninvalid,abc,xyz`;
    const adapter = new ZerodhaHoldingsAdapter();
    const result = adapter.parse(malformedCsv);

    // Quantity is parsed as 0, current price as 0 -> filtered cleanly
    assert.strictEqual(result.holdings.length, 1);
    assert.strictEqual(result.holdings[0].quantity, 0);

    // When piped to downstream mapper, fabricated/zero holdings are completely excluded
    const mapped = mapBrokerOutputToUserHoldings(result);
    assert.strictEqual(mapped.validHoldingsCount, 0);
    assert.strictEqual(mapped.userHoldings.length, 0);
  });

  // BI04-09
  it('BI04-09: adapter output seamlessly feeds BI-03 mapBrokerOutputToUserHoldings boundary', () => {
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
      companyId: 'TCS_LTD',
      isin: 'INE467B01029',
      companyName: 'Tata Consultancy Services Limited',
      industry: 'IT Services',
      sector: 'IT',
      listings: [{ exchange: 'NSE', symbol: 'TCS', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
      effectiveFrom: '2020-01-01T00:00:00.000Z',
    });
    sm.registerEntity({
      companyId: 'HDFC_BANK_LTD',
      isin: 'INE040A01034',
      companyName: 'HDFC Bank Limited',
      industry: 'Banking',
      sector: 'BANKING',
      listings: [{ exchange: 'NSE', symbol: 'HDFCBANK', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
      effectiveFrom: '2020-01-01T00:00:00.000Z',
    });

    // 1. Detect format
    const { detection, adapter } = BrokerFormatDetector.detectAndGetAdapter(sampleDhanCsv, 'dhan.csv');
    assert.strictEqual(detection.brokerType, 'DHAN');
    assert.ok(adapter);

    // 2. Parse broker CSV
    const parseResult = adapter!.parse(sampleDhanCsv) as FinappBrokerParseResult;
    assert.strictEqual(parseResult.success, true);

    // 3. Map into canonical UserHoldingInput records with P04 Security Master
    const mappedResult = mapBrokerOutputToUserHoldings(parseResult, {
      securityMaster: sm,
      failOnUnmappedIdentity: true,
    });

    assert.strictEqual(mappedResult.success, true);
    assert.strictEqual(mappedResult.validHoldingsCount, 3);
    assert.strictEqual(mappedResult.weightSumPercentage, 100.0);
    assert.strictEqual(mappedResult.userHoldings[0].companyId, 'INFOSYS_LTD');
    assert.strictEqual(mappedResult.userHoldings[1].companyId, 'TCS_LTD');
    assert.strictEqual(mappedResult.userHoldings[2].companyId, 'HDFC_BANK_LTD');
    assert.strictEqual(mappedResult.provenance.sourceBroker, 'DHAN');
  });

  // BI04-10
  it('BI04-10: detector and parser outputs are strictly deterministic across repeated runs', () => {
    const adapter = new ZerodhaHoldingsAdapter();
    const run1 = adapter.parse(sampleZerodhaCsv, { asOf: '2026-09-21T00:00:00.000Z' });
    const run2 = adapter.parse(sampleZerodhaCsv, { asOf: '2026-09-21T00:00:00.000Z' });

    assert.deepStrictEqual(run1.holdings, run2.holdings);
    assert.strictEqual(run1.totalValue, run2.totalValue);

    const map1 = mapBrokerOutputToUserHoldings(run1, { asOf: '2026-09-21T00:00:00.000Z' });
    const map2 = mapBrokerOutputToUserHoldings(run2, { asOf: '2026-09-21T00:00:00.000Z' });

    assert.strictEqual(map1.provenance.lineageHash, map2.provenance.lineageHash);
  });

  // BI04-11: Dependency and XLSX Qualification Handling
  it('BI04-11: marks XLSX input as QUALIFICATION_BLOCKED / DEFERRED TO BI-06 without adding un-governed dependencies', () => {
    const zipMagic = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    const detection = BrokerFormatDetector.detectFormat(zipMagic, 'groww-portfolio.xlsx');

    assert.strictEqual(detection.format, 'XLSX');
    assert.strictEqual(detection.requiresXlsx, true);
    assert.ok(detection.details.includes('QUALIFICATION-BLOCKED / DEFERRED TO BI-06'));

    const growwAdapter = new GrowwHoldingsAdapter();
    const parseResult = growwAdapter.parse(zipMagic, { fileName: 'groww-portfolio.xlsx' });

    assert.strictEqual(parseResult.success, false);
    assert.strictEqual(parseResult.metadata?.qualificationStatus, 'QUALIFICATION_BLOCKED_DEFERRED_TO_BI06');
    assert.strictEqual(parseResult.metadata?.requiresXlsx, true);
  });
});
