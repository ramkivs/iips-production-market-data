/**
 * Institutional Investment Platform System (IIPS)
 * Workstream BI: Package BI-03 - Finapp Broker Adapter Foundation & Normalization Tests
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / BI-03-AUTH-2026-01
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  mapBrokerOutputToUserHoldings,
  FinappHolding,
  FinappBrokerParseResult,
  FinappBrokerType,
  UserHoldingInput,
} from '../frontend/src/features/portfolio/import/index.js';
import { SecurityMaster } from '../src/identity/security_master.js';
import { IdentityAmbiguityError } from '../src/identity/quarantine.js';

describe('BI-03: Broker Adapter Foundation & Holdings Mapper Contract', () => {
  const sampleHoldings: FinappHolding[] = [
    {
      symbol: 'INFY',
      isin: 'INE009A01021',
      quantity: 100,
      averagePrice: 1450.5,
      currentPrice: 1520.0,
      exchange: 'NSE',
      assetClass: 'EQUITY',
    },
    {
      symbol: 'TCS',
      isin: 'INE467B01029',
      quantity: 50,
      averagePrice: 3800.0,
      currentPrice: 3950.0,
      exchange: 'NSE',
      assetClass: 'EQUITY',
    },
    {
      symbol: 'RELIANCE',
      isin: 'INE002A01018',
      quantity: 80,
      averagePrice: 2800.0,
      currentPrice: 2900.0,
      exchange: 'NSE',
      assetClass: 'EQUITY',
    },
  ];

  it('BI03-01: maps standard FINAPP holding array to normalized UserHoldingInput records', () => {
    const result = mapBrokerOutputToUserHoldings(sampleHoldings);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.userHoldings.length, 3);
    assert.strictEqual(result.totalHoldingsCount, 3);
    assert.strictEqual(result.excludedHoldingsCount, 0);
    assert.strictEqual(result.aggregatedHoldingsCount, 0);

    // Verify market values
    // INFY: 100 * 1520 = 152,000
    // TCS: 50 * 3950 = 197,500
    // RELIANCE: 80 * 2900 = 232,000
    // Total = 581,500
    assert.strictEqual(result.totalMarketValue, 581500);

    const infy = result.userHoldings.find((h) => h.symbol === 'INFY')!;
    assert.ok(infy);
    assert.strictEqual(infy.quantity, 100);
    assert.strictEqual(infy.averageBuyPrice, 1450.5);
    assert.strictEqual(infy.currentPrice, 1520.0);
    assert.strictEqual(infy.marketValue, 152000);
    assert.strictEqual(infy.isin, 'INE009A01021');
    assert.strictEqual(infy.active, true);
    assert.ok(infy.lineageDigest.length === 64);

    // Weight sum must be exactly 100.0%
    assert.strictEqual(result.weightSumPercentage, 100.0);
  });

  it('BI03-02: maps FinappBrokerParseResult with broker metadata and warnings', () => {
    const parseResult: FinappBrokerParseResult = {
      success: true,
      brokerType: 'ZERODHA',
      holdings: sampleHoldings,
      totalHoldings: 3,
      metadata: {
        fileFormat: 'csv',
        sourceFileName: 'holdings-zerodha-2026-09-21.csv',
      },
      warnings: ['Custom broker warning: fractional tax adjustments pending'],
    };

    const result = mapBrokerOutputToUserHoldings(parseResult);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.provenance.sourceBroker, 'ZERODHA');
    assert.strictEqual(result.userHoldings[0].sourceBroker, 'ZERODHA');
    assert.ok(result.warnings.includes('Custom broker warning: fractional tax adjustments pending'));
  });

  it('BI03-03: excludes inactive, zero-quantity, negative-quantity, and zero-price holdings', () => {
    const dirtyHoldings: FinappHolding[] = [
      ...sampleHoldings,
      {
        symbol: 'ZERO_QTY',
        isin: 'INE000Z01001',
        quantity: 0,
        averagePrice: 100,
        currentPrice: 120,
      },
      {
        symbol: 'NEG_QTY',
        isin: 'INE000N01001',
        quantity: -25,
        averagePrice: 200,
        currentPrice: 210,
      },
      {
        symbol: 'ZERO_PRICE',
        isin: 'INE000P01001',
        quantity: 50,
        averagePrice: 0,
        currentPrice: 0,
      },
      {
        symbol: '',
        quantity: 10,
        averagePrice: 50,
        currentPrice: 50,
      },
    ];

    const result = mapBrokerOutputToUserHoldings(dirtyHoldings);

    assert.strictEqual(result.totalHoldingsCount, 7);
    assert.strictEqual(result.validHoldingsCount, 3);
    assert.strictEqual(result.excludedHoldingsCount, 4);
    assert.strictEqual(result.userHoldings.length, 3);
    assert.strictEqual(result.weightSumPercentage, 100.0);
  });

  it('BI03-04: aggregates duplicate securities and computes volume-weighted average buy price', () => {
    const duplicateLots: FinappHolding[] = [
      {
        symbol: 'INFY',
        isin: 'INE009A01021',
        quantity: 100,
        averagePrice: 1400.0,
        currentPrice: 1600.0,
      },
      {
        symbol: 'INFY',
        isin: 'INE009A01021',
        quantity: 200,
        averagePrice: 1550.0,
        currentPrice: 1600.0,
      },
      {
        symbol: 'TCS',
        isin: 'INE467B01029',
        quantity: 50,
        averagePrice: 3500.0,
        currentPrice: 3800.0,
      },
    ];

    const result = mapBrokerOutputToUserHoldings(duplicateLots);

    assert.strictEqual(result.totalHoldingsCount, 3);
    assert.strictEqual(result.validHoldingsCount, 2);
    assert.strictEqual(result.aggregatedHoldingsCount, 1);

    const infy = result.userHoldings.find((h) => h.symbol === 'INFY')!;
    assert.ok(infy);
    assert.strictEqual(infy.quantity, 300);
    // Weighted Average Price: (100 * 1400 + 200 * 1550) / 300 = (140,000 + 310,000) / 300 = 450,000 / 300 = 1500.0
    assert.strictEqual(infy.averageBuyPrice, 1500.0);
    assert.strictEqual(infy.currentPrice, 1600.0);
    assert.strictEqual(infy.marketValue, 480000); // 300 * 1600
    assert.strictEqual(result.weightSumPercentage, 100.0);
  });

  it('BI03-05: guarantees exact 100.0000% weight normalization across fractional splits', () => {
    const threeEqualHoldings: FinappHolding[] = [
      { symbol: 'A', quantity: 10, averagePrice: 100, currentPrice: 100 }, // MV: 1000
      { symbol: 'B', quantity: 10, averagePrice: 100, currentPrice: 100 }, // MV: 1000
      { symbol: 'C', quantity: 10, averagePrice: 100, currentPrice: 100 }, // MV: 1000
    ];

    const result = mapBrokerOutputToUserHoldings(threeEqualHoldings);

    assert.strictEqual(result.validHoldingsCount, 3);
    assert.strictEqual(result.totalMarketValue, 3000);

    const weights = result.userHoldings.map((h) => h.weightPercentage);
    const sum = weights.reduce((s, w) => s + w, 0);

    assert.strictEqual(Math.round(sum * 10000) / 10000, 100.0);
    assert.strictEqual(result.weightSumPercentage, 100.0);
  });

  it('BI03-06: integrates with P04/P12 Security Master and resolves authoritative companyId', () => {
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

    const holdings: FinappHolding[] = [
      { symbol: 'INFY', isin: 'INE009A01021', quantity: 10, averagePrice: 1500, currentPrice: 1550 },
      { symbol: 'TCS', quantity: 5, averagePrice: 3800, currentPrice: 3900 },
    ];

    const result = mapBrokerOutputToUserHoldings(holdings, {
      securityMaster: sm,
      failOnUnmappedIdentity: true,
      asOf: '2026-01-01T00:00:00.000Z',
    });

    assert.strictEqual(result.userHoldings[0].companyId, 'INFOSYS_LTD');
    assert.strictEqual(result.userHoldings[1].companyId, 'TATA_CONSULTANCY');
  });

  it('BI03-07: fails closed with IdentityAmbiguityError when unmapped symbol is encountered under P04 governance', () => {
    const sm = new SecurityMaster();
    // Register only INFY
    sm.registerEntity({
      companyId: 'INFOSYS_LTD',
      isin: 'INE009A01021',
      companyName: 'Infosys Limited',
      industry: 'IT Services',
      sector: 'IT',
      listings: [{ exchange: 'NSE', symbol: 'INFY', lotSize: 1, tickSize: 0.05, status: 'ACTIVE' }],
      effectiveFrom: '2020-01-01T00:00:00.000Z',
    });

    const holdingsWithUnmapped: FinappHolding[] = [
      { symbol: 'INFY', isin: 'INE009A01021', quantity: 10, averagePrice: 1500, currentPrice: 1550 },
      { symbol: 'UNMAPPED_CO', quantity: 5, averagePrice: 100, currentPrice: 110 },
    ];

    assert.throws(() => {
      mapBrokerOutputToUserHoldings(holdingsWithUnmapped, {
        securityMaster: sm,
        failOnUnmappedIdentity: true,
      });
    }, (err: unknown) => {
      return err instanceof IdentityAmbiguityError;
    });
  });

  it('BI03-08: allows non-fail-closed fallback when explicitly requested with warning', () => {
    const sm = new SecurityMaster();

    const holdingsWithUnmapped: FinappHolding[] = [
      { symbol: 'UNMAPPED_CO', quantity: 5, averagePrice: 100, currentPrice: 110 },
    ];

    const result = mapBrokerOutputToUserHoldings(holdingsWithUnmapped, {
      securityMaster: sm,
      failOnUnmappedIdentity: false,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.userHoldings[0].companyId, 'UNMAPPED_CO');
    assert.ok(result.warnings.some((w) => w.includes('Identity resolution unmapped for \'UNMAPPED_CO\'')));
  });

  it('BI03-09: handles empty or zero-value portfolio gracefully', () => {
    const emptyResult = mapBrokerOutputToUserHoldings([]);

    assert.strictEqual(emptyResult.success, true);
    assert.strictEqual(emptyResult.userHoldings.length, 0);
    assert.strictEqual(emptyResult.totalMarketValue, 0);
    assert.strictEqual(emptyResult.weightSumPercentage, 0.0);
    assert.ok(emptyResult.provenance.lineageHash.length === 64);
  });

  it('BI03-10: enforces deterministic cryptographic lineage hashing', () => {
    const result1 = mapBrokerOutputToUserHoldings(sampleHoldings, { asOf: '2026-09-21T00:00:00.000Z' });
    const result2 = mapBrokerOutputToUserHoldings(sampleHoldings, { asOf: '2026-09-21T00:00:00.000Z' });

    assert.strictEqual(result1.provenance.lineageHash, result2.provenance.lineageHash);

    // Altering quantity must change hash deterministically
    const alteredHoldings = [
      { ...sampleHoldings[0], quantity: 101 },
      sampleHoldings[1],
      sampleHoldings[2],
    ];
    const resultAltered = mapBrokerOutputToUserHoldings(alteredHoldings, { asOf: '2026-09-21T00:00:00.000Z' });
    assert.notStrictEqual(result1.provenance.lineageHash, resultAltered.provenance.lineageHash);
  });
});
