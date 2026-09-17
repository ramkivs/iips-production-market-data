import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { EodValuationSynthesizer } from './eod-valuation-synthesizer.ts';
import type { ValuationInputPayload } from './valuation-contract.ts';

describe('D113-STAGE2 Banking P/ABV Calibration Verification Suite', () => {
  const synthesizer = new EodValuationSynthesizer();

  // Baseline mock input: Net Worth 450,000 Cr, Net NPA 9,000 Cr, Shares 760 Cr
  // ABV = 441,000 Cr, ABVPS = 580.263 INR
  const baseBankingInput: ValuationInputPayload = {
    canonicalSecurityId: 'BANK-H1',
    sector: 'Banking',
    eodClosePrice: 1650.0,
    tradeDate: '2026-09-17',
    archiveSha256: '88e9098861ffa5a5f774ebf5c31e156a3f8eb3e8429e5b988d88660633e6fce9',
    fundamentals: {
      canonicalSecurityId: 'BANK-H1',
      sector: 'Banking',
      sharesOutstanding: 760.0,
      debt: 0,
      cash: 0,
      tangibleNetWorth: 450000.0,
      netNpa: 9000.0,
    },
  };

  /** Helper to adjust EOD price to hit specific P/ABV multiples exactly (ABVPS = 580.263158) */
  function inputForMultiple(targetMultiple: number): ValuationInputPayload {
    const abv = 450000.0 - 9000.0;
    const abvps = abv / 760.0;
    return {
      ...baseBankingInput,
      eodClosePrice: Math.round(targetMultiple * abvps * 100) / 100,
    };
  }

  // ---------------------------------------------------------------------------
  // 1. EXACT CALIBRATION BOUNDARY TESTS (Q-CAL-04)
  // ---------------------------------------------------------------------------

  it('1.1. [TIER 1: VALUE BELOW 1.2x] P/ABV = 1.0x produces valuationScore 90.0', () => {
    const input = inputForMultiple(1.0); // P/ABV ~1.0 < 1.2
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.multipleType, 'P/ABV');
    assert.equal(result.valuationScore, 90.0);
    assert.ok(result.calculatedMultiple! < 1.2);
    assert.equal(result.provenance.calibrationProfileId, 'banking-valuation-calibration');
    assert.equal(result.provenance.calibrationVersion, '1.0.0');
  });

  it('1.2. [BOUNDARY 1.2x: EXACT] P/ABV = 1.200x produces valuationScore 75.0 (Tier 2 lower boundary)', () => {
    const input = inputForMultiple(1.200);
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.calculatedMultiple, 1.2);
    assert.equal(result.valuationScore, 75.0);
  });

  it('1.3. [TIER 2: JUST BELOW 1.8x] P/ABV = 1.790x produces valuationScore 75.0', () => {
    const input = inputForMultiple(1.790);
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.ok(result.calculatedMultiple! >= 1.2 && result.calculatedMultiple! < 1.8);
    assert.equal(result.valuationScore, 75.0);
  });

  it('1.4. [BOUNDARY 1.8x: EXACT] P/ABV = 1.800x produces valuationScore 60.0 (Tier 3 lower boundary)', () => {
    const input = inputForMultiple(1.800);
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.calculatedMultiple, 1.8);
    assert.equal(result.valuationScore, 60.0);
  });

  it('1.5. [TIER 3: JUST BELOW 2.5x] P/ABV = 2.490x produces valuationScore 60.0', () => {
    const input = inputForMultiple(2.490);
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.ok(result.calculatedMultiple! >= 1.8 && result.calculatedMultiple! < 2.5);
    assert.equal(result.valuationScore, 60.0);
  });

  it('1.6. [BOUNDARY 2.5x: EXACT] P/ABV = 2.500x produces valuationScore 45.0 (Tier 4 lower boundary)', () => {
    const input = inputForMultiple(2.500);
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.calculatedMultiple, 2.5);
    assert.equal(result.valuationScore, 45.0);
  });

  it('1.7. [TIER 4: JUST BELOW 3.2x] P/ABV = 3.190x produces valuationScore 45.0', () => {
    const input = inputForMultiple(3.190);
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.ok(result.calculatedMultiple! >= 2.5 && result.calculatedMultiple! < 3.2);
    assert.equal(result.valuationScore, 45.0);
  });

  it('1.8. [BOUNDARY 3.2x: EXACT] P/ABV = 3.200x produces valuationScore 20.0 (Tier 5 lower boundary)', () => {
    const input = inputForMultiple(3.200);
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.equal(result.calculatedMultiple, 3.2);
    assert.equal(result.valuationScore, 20.0);
  });

  it('1.9. [TIER 5: ABOVE 3.2x] P/ABV = 4.500x produces valuationScore 20.0', () => {
    const input = inputForMultiple(4.500);
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'CALCULATED');
    assert.ok(result.calculatedMultiple! > 3.2);
    assert.equal(result.valuationScore, 20.0);
  });

  // ---------------------------------------------------------------------------
  // 2. FAIL-CLOSED AND DISTRESSED ABV GUARDS (Q-CAL-05)
  // ---------------------------------------------------------------------------

  it('2.1. [DISTRESSED / NON-POSITIVE ABV] fails closed with UNAVAILABLE when Net NPA >= Net Worth', () => {
    const distressedInput: ValuationInputPayload = {
      ...baseBankingInput,
      fundamentals: {
        ...baseBankingInput.fundamentals,
        tangibleNetWorth: 20000.0,
        netNpa: 25000.0, // Distressed: ABV = -5000 <= 0
      },
    };
    const result = synthesizer.synthesize(distressedInput);
    assert.equal(result.status, 'UNAVAILABLE');
    assert.equal(result.valuationScore, null, 'Must NEVER assign arbitrary score to insolvent bank');
    assert.ok(result.reason?.includes('NON_POSITIVE_ADJUSTED_BOOK_VALUE'));
  });

  it('2.2. [NEGATIVE NET NPA] fails closed when netNpa is negative', () => {
    const input: ValuationInputPayload = {
      ...baseBankingInput,
      fundamentals: {
        ...baseBankingInput.fundamentals,
        netNpa: -500,
      },
    };
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'UNAVAILABLE');
    assert.equal(result.valuationScore, null);
    assert.ok(result.reason?.includes('INVALID_NET_NPA'));
  });

  it('2.3. [MISSING NET WORTH] fails closed when neither tangibleNetWorth nor totalEquity is provided', () => {
    const input: ValuationInputPayload = {
      ...baseBankingInput,
      fundamentals: {
        canonicalSecurityId: 'BANK-H1',
        sector: 'Banking',
        sharesOutstanding: 760.0,
        debt: 0,
        cash: 0,
      },
    };
    const result = synthesizer.synthesize(input);
    assert.equal(result.status, 'BLOCKED_UNCALIBRATED');
    assert.equal(result.valuationScore, null);
  });

  it('2.4. [EXCEPTIONAL EVENT EXCLUSION (Q-CAL-06)] fails closed when exceptionalEventFlag is set', () => {
    const exceptionalInput: ValuationInputPayload = {
      ...baseBankingInput,
      fundamentals: {
        ...baseBankingInput.fundamentals,
        exceptionalEventFlag: true,
        exceptionalEventReason: 'STATUTORY_MORATORIUM_RECAPITALIZATION',
      },
    };
    const result = synthesizer.synthesize(exceptionalInput);
    assert.equal(result.status, 'UNAVAILABLE');
    assert.equal(result.valuationScore, null);
    assert.ok(result.reason?.includes('EXCEPTIONAL_EVENT_EXCLUDED'));
  });

  // ---------------------------------------------------------------------------
  // 3. DETERMINISM, PROVENANCE & SECTOR ISOLATION
  // ---------------------------------------------------------------------------

  it('3.1. [DETERMINISTIC INVARIANCE] repeated executions produce bit-identical results', () => {
    const run1 = synthesizer.synthesize(baseBankingInput);
    const run2 = synthesizer.synthesize(baseBankingInput);
    assert.deepEqual(run1, run2);
    assert.equal(run1.valuationScore, 45.0); // P/ABV = 2.844 (in 2.5..3.2 -> 45.0)
  });

  it('3.2. [SECTOR ISOLATION] Insurance, CapMarkets, Healthcare, and Hospitality remain BLOCKED_UNCALIBRATED', () => {
    for (const sec of ['Insurance', 'Capital Markets', 'Healthcare', 'Hospitality']) {
      const res = synthesizer.synthesize({
        ...baseBankingInput,
        sector: sec,
        canonicalSecurityId: `${sec.toUpperCase()}-H1`,
      });
      assert.equal(res.status, 'BLOCKED_UNCALIBRATED', `Sector ${sec} must remain blocked`);
      assert.equal(res.valuationScore, null);
    }
  });
});
