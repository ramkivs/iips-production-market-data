import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { EodValuationSynthesizer } from './eod-valuation-synthesizer.ts';
import type { ValuationInputPayload } from './valuation-contract.ts';

describe('D113-STAGE1 Banking Valuation Layer-2.5 Scaffold Verification Suite', () => {
  const synthesizer = new EodValuationSynthesizer();

  const validBankingInput: ValuationInputPayload = {
    canonicalSecurityId: 'BANK-H1',
    sector: 'Banking',
    eodClosePrice: 1650.0, // HDFC Bank mock EOD close
    tradeDate: '2026-09-14',
    archiveSha256: '88e9098861ffa5a5f774ebf5c31e156a3f8eb3e8429e5b988d88660633e6fce9',
    fundamentals: {
      canonicalSecurityId: 'BANK-H1',
      sector: 'Banking',
      sharesOutstanding: 760.0, // 760 Cr shares
      debt: 0,
      cash: 0,
      tangibleNetWorth: 450000.0, // 450,000 Cr net worth
      netNpa: 9000.0,             // 9,000 Cr net NPA
    },
  };

  it('A. [VALID BANKING CALIBRATION] produces raw P/ABV metric and evaluates calibrated score (D113 Stage 2)', () => {
    // ABV = 450000 - 9000 = 441000 Cr
    // ABVPS = 441000 / 760 = 580.26315 INR
    // P/ABV = 1650 / 580.26315 = 2.844 (in range 2.5..3.2 -> Score 45.0)
    const result = synthesizer.synthesize(validBankingInput);

    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.valuationScore, 45.0, 'Valuation score evaluated via approved calibration profile');
    assert.equal(result.multipleType, 'P/ABV');
    assert.equal(result.calculatedMultiple, 2.844);
    assert.equal(result.adjustedBookValue, 441000.0);
    assert.equal(result.adjustedBookValuePerShare, 580.26);
    assert.equal(result.provenance.dataMode, 'LIVE');
    assert.equal(result.provenance.freshness, 'DEVELOPMENT_MIXED_VINTAGE');
    assert.equal(result.provenance.fundamentalsVintage, 'v1.1-reference');
    assert.equal(result.provenance.calibrationProfileId, 'banking-valuation-calibration');
    assert.equal(result.provenance.calibrationVersion, '1.0.0');
  });

  it('B. [TOTAL EQUITY FALLBACK] derives ABV using totalEquity when tangibleNetWorth is omitted', () => {
    const input: ValuationInputPayload = {
      ...validBankingInput,
      fundamentals: {
        canonicalSecurityId: 'BANK-H1',
        sector: 'Banking',
        sharesOutstanding: 500.0,
        debt: 0,
        cash: 0,
        totalEquity: 250000.0,
        netNpa: 5000.0,
      },
    };
    // ABV = 250000 - 5000 = 245000; ABVPS = 245000 / 500 = 490; P/ABV = 1650 / 490 = 3.367 (>= 3.2 -> Score 20.0)
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.calculatedMultiple, 3.367);
    assert.equal(result.valuationScore, 20.0);
    assert.equal(result.adjustedBookValue, 245000.0);
  });

  it('C. [ZERO NET NPA] computes ABV cleanly when bank reports 0 Net NPA', () => {
    const input: ValuationInputPayload = {
      ...validBankingInput,
      fundamentals: {
        ...validBankingInput.fundamentals,
        netNpa: 0,
      },
    };
    // ABV = 450000 - 0 = 450000; ABVPS = 450000 / 760 = 592.105; P/ABV = 1650 / 592.105 = 2.787 (in 2.5..3.2 -> Score 45.0)
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.calculatedMultiple, 2.787);
    assert.equal(result.valuationScore, 45.0);
  });

  it('D. [NEGATIVE NET NPA] fails closed if netNpa is negative', () => {
    const input: ValuationInputPayload = {
      ...validBankingInput,
      fundamentals: {
        ...validBankingInput.fundamentals,
        netNpa: -100,
      },
    };
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'UNAVAILABLE');
    assert.equal(result.valuationScore, null);
    assert.ok(result.reason?.includes('INVALID_NET_NPA'));
  });

  it('E. [ZERO OR NEGATIVE ADJUSTED BOOK VALUE] fails closed if Net NPA >= Net Worth', () => {
    const distressedInput: ValuationInputPayload = {
      ...validBankingInput,
      fundamentals: {
        ...validBankingInput.fundamentals,
        tangibleNetWorth: 10000.0,
        netNpa: 15000.0, // Distressed / Insolvent: ABV = -5000
      },
    };
    const result = synthesizer.synthesize(distressedInput);
    assert.equal(result.status, 'UNAVAILABLE');
    assert.equal(result.valuationScore, null);
    assert.ok(result.reason?.includes('NON_POSITIVE_ADJUSTED_BOOK_VALUE'));
  });

  it('F. [MISSING NET WORTH] fails closed if neither tangibleNetWorth nor totalEquity is provided', () => {
    const missingEquityInput: ValuationInputPayload = {
      ...validBankingInput,
      fundamentals: {
        canonicalSecurityId: 'BANK-H1',
        sector: 'Banking',
        sharesOutstanding: 760.0,
        debt: 0,
        cash: 0,
      },
    };
    const result = synthesizer.synthesize(missingEquityInput);
    assert.equal(result.status, 'BLOCKED_UNCALIBRATED');
    assert.equal(result.valuationScore, null);
  });

  it('G. [ZERO OR NEGATIVE SHARES] fails closed for invalid share count', () => {
    const invalidSharesInput: ValuationInputPayload = {
      ...validBankingInput,
      fundamentals: {
        ...validBankingInput.fundamentals,
        sharesOutstanding: -10,
      },
    };
    const result = synthesizer.synthesize(invalidSharesInput);
    assert.equal(result.status, 'UNAVAILABLE');
    assert.equal(result.valuationScore, null);
    assert.ok(result.reason?.includes('INVALID_SHARES_OUTSTANDING'));
  });

  it('H. [INVALID EOD PRICE] fails closed for negative or zero close price', () => {
    const invalidPriceInput: ValuationInputPayload = {
      ...validBankingInput,
      eodClosePrice: 0,
    };
    const result = synthesizer.synthesize(invalidPriceInput);
    assert.equal(result.status, 'UNAVAILABLE');
    assert.equal(result.valuationScore, null);
    assert.ok(result.reason?.includes('INVALID_EOD_CLOSE_PRICE'));
  });

  it('I. [MISSING FUNDAMENTALS] fails closed if fundamentals object is null', () => {
    const nullFundInput = {
      ...validBankingInput,
      fundamentals: null as unknown as typeof validBankingInput.fundamentals,
    };
    const result = synthesizer.synthesize(nullFundInput);
    assert.equal(result.status, 'UNAVAILABLE');
    assert.equal(result.valuationScore, null);
    assert.ok(result.reason?.includes('MISSING_FUNDAMENTALS'));
  });

  it('J. [APPROVED CALIBRATION PROFILE MAPPING] confirms evaluation against banking-valuation-calibration-1.0.0.json', () => {
    const result = synthesizer.synthesize(validBankingInput);
    assert.equal(result.valuationScore, 45.0);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.provenance.calibrationProfileId, 'banking-valuation-calibration');
  });

  it('K. [DETERMINISTIC INVARIANCE] repeated synthesis produces strictly identical calculations', () => {
    const run1 = synthesizer.synthesize(validBankingInput);
    const run2 = synthesizer.synthesize(validBankingInput);
    assert.deepEqual(run1, run2);
  });

  it('L. [OTHER BLOCKED SECTORS INTACT] Insurance, CapMarkets, Healthcare, and Hospitality remain BLOCKED_UNCALIBRATED', () => {
    for (const sec of ['Insurance', 'Capital Markets', 'Healthcare', 'Hospitality']) {
      const res = synthesizer.synthesize({
        ...validBankingInput,
        sector: sec,
        canonicalSecurityId: `${sec.toUpperCase()}-H1`,
      });
      assert.equal(res.status, 'BLOCKED_UNCALIBRATED', `Sector ${sec} must remain BLOCKED_UNCALIBRATED`);
      assert.equal(res.valuationScore, null);
    }
  });
});
