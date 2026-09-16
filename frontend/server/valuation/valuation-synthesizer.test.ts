import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { EodValuationSynthesizer } from './eod-valuation-synthesizer.ts';
import type { ValuationInputPayload } from './valuation-contract.ts';

describe('D112-C EOD Valuation Synthesizer Verification Suite', () => {
  const synthesizer = new EodValuationSynthesizer();

  const baseInput: ValuationInputPayload = {
    canonicalSecurityId: 'TECH-H1',
    sector: 'Technology',
    eodClosePrice: 4150.0,
    tradeDate: '2026-09-14',
    archiveSha256: '88e9098861ffa5a5f774ebf5c31e156a3f8eb3e8429e5b988d88660633e6fce9',
    fundamentals: {
      canonicalSecurityId: 'TECH-H1',
      sector: 'Technology',
      sharesOutstanding: 36.18, // 36.18 Cr shares
      debt: 5000,              // 5000 Cr debt
      cash: 12000,             // 12000 Cr cash
      ltmRevenue: 240000,      // 240,000 Cr revenue
      ltmEbitda: 60000,
      ltmEps: 125.5,
    },
  };

  it('1. [VALID TECHNOLOGY VALUATION] correctly synthesizes EV/Revenue multiple and calibrated band score', () => {
    // MC = 4150 * 36.18 = 150,147 Cr; EV = 150147 + 5000 - 12000 = 143,147 Cr
    // EV / Rev = 143147 / 240000 = 0.596 (< 8.0 -> Score 90.0)
    const result = synthesizer.synthesize(baseInput);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.multipleType, 'EV/Revenue');
    assert.equal(result.valuationScore, 90.0);
    assert.ok(result.calculatedMultiple! < 8.0);
    assert.equal(result.provenance.freshness, 'DEVELOPMENT_MIXED_VINTAGE');
    assert.equal(result.provenance.fundamentalsVintage, 'v1.1-reference');
  });

  it('2. [VALID INDUSTRIALS VALUATION] correctly evaluates EV/EBITDA multiple', () => {
    const input: ValuationInputPayload = {
      ...baseInput,
      canonicalSecurityId: 'INDUSTRIALS-H1',
      sector: 'Industrials',
      eodClosePrice: 3500.0,
      fundamentals: {
        ...baseInput.fundamentals,
        canonicalSecurityId: 'INDUSTRIALS-H1',
        sector: 'Industrials',
        sharesOutstanding: 13.7,
        debt: 20000,
        cash: 5000,
        ltmEbitda: 15000, // EV = 47950 + 15000 = 62950; EV/EBITDA = 4.19 (< 8 -> Score 90.0)
      },
    };
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.multipleType, 'EV/EBITDA');
    assert.equal(result.valuationScore, 90.0);
  });

  it('3. [VALID ENERGY VALUATION] correctly evaluates EV/EBITDA multiple for Energy', () => {
    const input: ValuationInputPayload = {
      ...baseInput,
      canonicalSecurityId: 'ENERGY-H1',
      sector: 'Energy',
      eodClosePrice: 2950.0,
      fundamentals: {
        ...baseInput.fundamentals,
        canonicalSecurityId: 'ENERGY-H1',
        sector: 'Energy',
        sharesOutstanding: 67.6,
        debt: 300000,
        cash: 100000,
        ltmEbitda: 180000, // EV = 199420 + 200000 = 399420; EV/EBITDA = 2.21 (range 1.5..2.5 -> Score 75.0)
      },
    };
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.multipleType, 'EV/EBITDA');
    assert.equal(result.valuationScore, 75.0);
  });

  it('4. [VALID AUTOMOBILE VALUATION] correctly evaluates P/E multiple', () => {
    const input: ValuationInputPayload = {
      ...baseInput,
      canonicalSecurityId: 'AUTO-H1',
      sector: 'Automobile',
      eodClosePrice: 1000.0,
      fundamentals: {
        ...baseInput.fundamentals,
        canonicalSecurityId: 'AUTO-H1',
        sector: 'Automobile',
        ltmEps: 200.0, // PE = 1000 / 200 = 5.0 (range 4..7 -> Score 75.0)
      },
    };
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.multipleType, 'P/E');
    assert.equal(result.valuationScore, 75.0);
  });

  it('5. [VALID CONSUMER VALUATION] correctly evaluates P/E multiple for Consumer', () => {
    const input: ValuationInputPayload = {
      ...baseInput,
      canonicalSecurityId: 'CONSUMER-H1',
      sector: 'Consumer',
      eodClosePrice: 2500.0,
      fundamentals: {
        ...baseInput.fundamentals,
        canonicalSecurityId: 'CONSUMER-H1',
        sector: 'Consumer',
        ltmEps: 1250.0, // PE = 2.0 (range 1.5..2.5 -> Score 75.0)
      },
    };
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.multipleType, 'P/E');
    assert.equal(result.valuationScore, 75.0);
  });

  it('6. [VALID UTILITIES VALUATION] correctly evaluates P/E multiple for Utilities', () => {
    const input: ValuationInputPayload = {
      ...baseInput,
      canonicalSecurityId: 'UTILITIES-H1',
      sector: 'Utilities',
      eodClosePrice: 400.0,
      fundamentals: {
        ...baseInput.fundamentals,
        canonicalSecurityId: 'UTILITIES-H1',
        sector: 'Utilities',
        ltmEps: 100.0, // PE = 4.0 (range 3..4.5 -> Score 75.0)
      },
    };
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.multipleType, 'P/E');
    assert.equal(result.valuationScore, 75.0);
  });

  it('7. [VALID TELECOMMUNICATIONS VALUATION] correctly evaluates EV/EBITDA multiple for Telecom', () => {
    const input: ValuationInputPayload = {
      ...baseInput,
      canonicalSecurityId: 'TELECOM-H1',
      sector: 'Telecommunications',
      eodClosePrice: 1500.0,
      fundamentals: {
        ...baseInput.fundamentals,
        canonicalSecurityId: 'TELECOM-H1',
        sector: 'Telecommunications',
        sharesOutstanding: 60.0,
        debt: 200000,
        cash: 20000,
        ltmEbitda: 45000, // EV = 90000 + 180000 = 270000; EV/EBITDA = 6.0 (range 5..7 -> Score 75.0)
      },
    };
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.multipleType, 'EV/EBITDA');
    assert.equal(result.valuationScore, 75.0);
  });

  it('8. [VALID MATERIALS & METALS VALUATION] correctly evaluates EV/EBITDA multiple', () => {
    const input: ValuationInputPayload = {
      ...baseInput,
      canonicalSecurityId: 'METALS-H1',
      sector: 'Materials & Metals',
      eodClosePrice: 150.0,
      fundamentals: {
        ...baseInput.fundamentals,
        canonicalSecurityId: 'METALS-H1',
        sector: 'Materials & Metals',
        sharesOutstanding: 1250.0,
        debt: 80000,
        cash: 10000,
        ltmEbitda: 50000, // EV = 187500 + 70000 = 257500; EV/EBITDA = 5.15 (range 4..7 -> Score 75.0)
      },
    };
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.multipleType, 'EV/EBITDA');
    assert.equal(result.valuationScore, 75.0);
  });

  it('9. [MISSING / INVALID EOD PRICE] fails closed with UNAVAILABLE', () => {
    const invalidPriceInput: ValuationInputPayload = {
      ...baseInput,
      eodClosePrice: -10.0,
    };
    const result = synthesizer.synthesize(invalidPriceInput);
    assert.equal(result.status, 'UNAVAILABLE');
    assert.equal(result.valuationScore, null);
    assert.ok(result.reason?.includes('INVALID_EOD_CLOSE_PRICE'));
  });

  it('10. [ZERO / NEGATIVE SHARES] fails closed with UNAVAILABLE', () => {
    const invalidSharesInput: ValuationInputPayload = {
      ...baseInput,
      fundamentals: {
        ...baseInput.fundamentals,
        sharesOutstanding: 0,
      },
    };
    const result = synthesizer.synthesize(invalidSharesInput);
    assert.equal(result.status, 'UNAVAILABLE');
    assert.equal(result.valuationScore, null);
    assert.ok(result.reason?.includes('INVALID_SHARES_OUTSTANDING'));
  });

  it('11. [NEGATIVE / ZERO REVENUE] fails closed for Technology', () => {
    const zeroRevInput: ValuationInputPayload = {
      ...baseInput,
      fundamentals: {
        ...baseInput.fundamentals,
        ltmRevenue: -500,
      },
    };
    const result = synthesizer.synthesize(zeroRevInput);
    assert.equal(result.status, 'UNAVAILABLE');
    assert.equal(result.valuationScore, null);
    assert.ok(result.reason?.includes('NON_POSITIVE_REVENUE'));
  });

  it('12. [NEGATIVE / ZERO EBITDA] fails closed for Energy', () => {
    const zeroEbitdaInput: ValuationInputPayload = {
      ...baseInput,
      sector: 'Energy',
      fundamentals: {
        ...baseInput.fundamentals,
        sector: 'Energy',
        ltmEbitda: 0,
      },
    };
    const result = synthesizer.synthesize(zeroEbitdaInput);
    assert.equal(result.status, 'UNAVAILABLE');
    assert.equal(result.valuationScore, null);
    assert.ok(result.reason?.includes('NON_POSITIVE_EBITDA'));
  });

  it('13. [NEGATIVE / ZERO EPS] fails closed for Automobile', () => {
    const zeroEpsInput: ValuationInputPayload = {
      ...baseInput,
      sector: 'Automobile',
      fundamentals: {
        ...baseInput.fundamentals,
        sector: 'Automobile',
        ltmEps: -12.5,
        ltmNetIncome: 0,
      },
    };
    const result = synthesizer.synthesize(zeroEpsInput);
    assert.equal(result.status, 'UNAVAILABLE');
    assert.equal(result.valuationScore, null);
    assert.ok(result.reason?.includes('NON_POSITIVE_EARNINGS'));
  });

  it('14. [BANKING BLOCKED] explicitly blocked as uncalibrated', () => {
    const bankingInput: ValuationInputPayload = {
      ...baseInput,
      canonicalSecurityId: 'BANK-H1',
      sector: 'Banking',
    };
    const result = synthesizer.synthesize(bankingInput);
    assert.equal(result.status, 'BLOCKED_UNCALIBRATED');
    assert.equal(result.valuationScore, null);
    assert.ok(result.reason?.includes('UNCALIBRATED_SECTOR'));
  });

  it('15. [INSURANCE BLOCKED] explicitly blocked as uncalibrated', () => {
    const insuranceInput: ValuationInputPayload = {
      ...baseInput,
      canonicalSecurityId: 'INSURANCE-H1',
      sector: 'Insurance',
    };
    const result = synthesizer.synthesize(insuranceInput);
    assert.equal(result.status, 'BLOCKED_UNCALIBRATED');
    assert.equal(result.valuationScore, null);
    assert.ok(result.reason?.includes('UNCALIBRATED_SECTOR'));
  });

  it('16. [CAPITAL MARKETS BLOCKED] explicitly blocked as uncalibrated', () => {
    const capMarketsInput: ValuationInputPayload = {
      ...baseInput,
      canonicalSecurityId: 'CAPMARKETS-H1',
      sector: 'Capital Markets',
    };
    const result = synthesizer.synthesize(capMarketsInput);
    assert.equal(result.status, 'BLOCKED_UNCALIBRATED');
    assert.equal(result.valuationScore, null);
    assert.ok(result.reason?.includes('UNCALIBRATED_SECTOR'));
  });

  it('17. [HEALTHCARE & HOSPITALITY BLOCKED] audited sectors without valuation pillars blocked', () => {
    const healthResult = synthesizer.synthesize({ ...baseInput, sector: 'Healthcare' });
    assert.equal(healthResult.status, 'BLOCKED_UNCALIBRATED');

    const hospResult = synthesizer.synthesize({ ...baseInput, sector: 'Hospitality' });
    assert.equal(hospResult.status, 'BLOCKED_UNCALIBRATED');
  });

  it('18. [DETERMINISM & PROVENANCE INVARIANCE] returns identical score on repeated calculation', () => {
    const run1 = synthesizer.synthesize(baseInput);
    const run2 = synthesizer.synthesize(baseInput);
    assert.deepEqual(run1, run2);
    assert.equal(run1.provenance.freshness, 'DEVELOPMENT_MIXED_VINTAGE');
    assert.equal(run1.provenance.fundamentalsVintage, 'v1.1-reference');
  });
});
