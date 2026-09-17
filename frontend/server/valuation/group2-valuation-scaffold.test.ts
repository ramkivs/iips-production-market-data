import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { EodValuationSynthesizer } from './eod-valuation-synthesizer.ts';
import type { ValuationInputPayload } from './valuation-contract.ts';

describe('D115-STAGE1 Group 2 Valuation Scaffold Verification Suite (Life Insurance & Capital Markets)', () => {
  const synthesizer = new EodValuationSynthesizer();

  const baseLifeInsuranceInput: ValuationInputPayload = {
    canonicalSecurityId: 'INS-LIFE-01',
    sector: 'Insurance',
    eodClosePrice: 650.0, // Mock Life Insurance close price (e.g. HDFC Life scale)
    tradeDate: '2026-09-17',
    archiveSha256: '88e9098861ffa5a5f774ebf5c31e156a3f8eb3e8429e5b988d88660633e6fce9',
    fundamentals: {
      canonicalSecurityId: 'INS-LIFE-01',
      sector: 'Insurance',
      insuranceCategory: 'Life',
      sharesOutstanding: 215.0, // 215 Cr shares
      debt: 0,
      cash: 0,
      embeddedValue: 45000.0,   // 45,000 Cr Embedded Value (IM-006)
      solvencyRatio: 1.85,      // 185% Solvency (IM-002, statutory minimum 150%)
    },
  };

  const baseAmcInput: ValuationInputPayload = {
    canonicalSecurityId: 'CAP-AMC-01',
    sector: 'Capital Markets',
    eodClosePrice: 3200.0, // Mock AMC close price (e.g. HDFC AMC scale)
    tradeDate: '2026-09-17',
    archiveSha256: '88e9098861ffa5a5f774ebf5c31e156a3f8eb3e8429e5b988d88660633e6fce9',
    fundamentals: {
      canonicalSecurityId: 'CAP-AMC-01',
      sector: 'Capital Markets',
      capitalMarketsCategory: 'AMC',
      sharesOutstanding: 21.3, // 21.3 Cr shares
      debt: 0,
      cash: 2500,
      totalAum: 650000.0,      // 650,000 Cr AUM (CM-001)
    },
  };

  const baseNonAmcInput: ValuationInputPayload = {
    canonicalSecurityId: 'CAP-EXCH-01',
    sector: 'Capital Markets',
    eodClosePrice: 2450.0, // Mock Exchange / Broker close price (e.g. BSE scale)
    tradeDate: '2026-09-17',
    archiveSha256: '88e9098861ffa5a5f774ebf5c31e156a3f8eb3e8429e5b988d88660633e6fce9',
    fundamentals: {
      canonicalSecurityId: 'CAP-EXCH-01',
      sector: 'Capital Markets',
      capitalMarketsCategory: 'NON-AMC',
      sharesOutstanding: 13.5, // 13.5 Cr shares
      debt: 0,
      cash: 1200,
      ltmEps: 70.0,            // INR 70 per share EPS
    },
  };

  // ==========================================
  // SECTION 1: LIFE INSURANCE (P/EV)
  // ==========================================

  it('1.1. [LIFE INSURANCE: VALID P/EV] computes raw P/EV multiple and outputs CALIBRATION_PENDING with valuationScore null', () => {
    // EVPS = 45000 / 215 = 209.30232558 INR
    // P/EV = 650 / 209.30232558 = 3.105555... -> rounded to 3 decimal places = 3.106x
    const res = synthesizer.synthesize(baseLifeInsuranceInput);

    assert.equal(res.status, 'CALIBRATION_PENDING');
    assert.equal(res.valuationScore, null, 'Valuation score must be strictly null (Q-GRP2-12 = C)');
    assert.equal(res.multipleType, 'P/EV');
    assert.equal(res.calculatedMultiple, 3.106);
    assert.equal(res.embeddedValue, 45000.0);
    assert.equal(res.embeddedValuePerShare, 209.3);
    assert.ok(res.reason?.includes('CALIBRATION_PENDING'));
    assert.equal(res.provenance.dataMode, 'LIVE');
    assert.equal(res.provenance.freshness, 'DEVELOPMENT_MIXED_VINTAGE');
    assert.equal(res.provenance.fundamentalsVintage, 'v1.1-reference');
  });

  it('1.2. [LIFE INSURANCE: MISSING EV] fails closed with UNAVAILABLE when embeddedValue is undefined', () => {
    const input: ValuationInputPayload = {
      ...baseLifeInsuranceInput,
      fundamentals: {
        canonicalSecurityId: 'INS-LIFE-01',
        sector: 'Insurance',
        insuranceCategory: 'Life',
        sharesOutstanding: 215.0,
        debt: 0,
        cash: 0,
      },
    };
    const res = synthesizer.synthesize(input);
    assert.equal(res.status, 'BLOCKED_UNCALIBRATED');
    assert.equal(res.valuationScore, null);
    assert.ok(res.reason?.includes('UNCALIBRATED_SECTOR'));
  });

  it('1.3. [LIFE INSURANCE: NON-POSITIVE EV] fails closed with UNAVAILABLE when embeddedValue <= 0', () => {
    const inputZero: ValuationInputPayload = {
      ...baseLifeInsuranceInput,
      fundamentals: {
        ...baseLifeInsuranceInput.fundamentals,
        embeddedValue: 0,
      },
    };
    const resZero = synthesizer.synthesize(inputZero);
    assert.equal(resZero.status, 'UNAVAILABLE');
    assert.equal(resZero.valuationScore, null);
    assert.ok(resZero.reason?.includes('NON_POSITIVE_EMBEDDED_VALUE'));

    const inputNeg: ValuationInputPayload = {
      ...baseLifeInsuranceInput,
      fundamentals: {
        ...baseLifeInsuranceInput.fundamentals,
        embeddedValue: -500,
      },
    };
    const resNeg = synthesizer.synthesize(inputNeg);
    assert.equal(resNeg.status, 'UNAVAILABLE');
    assert.equal(resNeg.valuationScore, null);
    assert.ok(resNeg.reason?.includes('NON_POSITIVE_EMBEDDED_VALUE'));
  });

  it('1.4. [LIFE INSURANCE: INVALID EOD PRICE] fails closed with UNAVAILABLE for non-positive close', () => {
    const input: ValuationInputPayload = {
      ...baseLifeInsuranceInput,
      eodClosePrice: 0,
    };
    const res = synthesizer.synthesize(input);
    assert.equal(res.status, 'UNAVAILABLE');
    assert.equal(res.valuationScore, null);
    assert.ok(res.reason?.includes('INVALID_EOD_CLOSE_PRICE'));
  });

  it('1.5. [LIFE INSURANCE: INVALID SHARES] fails closed with UNAVAILABLE for non-positive shares', () => {
    const input: ValuationInputPayload = {
      ...baseLifeInsuranceInput,
      fundamentals: {
        ...baseLifeInsuranceInput.fundamentals,
        sharesOutstanding: -10,
      },
    };
    const res = synthesizer.synthesize(input);
    assert.equal(res.status, 'UNAVAILABLE');
    assert.equal(res.valuationScore, null);
    assert.ok(res.reason?.includes('INVALID_SHARES_OUTSTANDING'));
  });

  it('1.6. [LIFE INSURANCE: SOLVENCY BELOW 1.50] fails closed with UNAVAILABLE per Q-GRP2-05', () => {
    const input: ValuationInputPayload = {
      ...baseLifeInsuranceInput,
      fundamentals: {
        ...baseLifeInsuranceInput.fundamentals,
        solvencyRatio: 1.42, // Statutory breach (IRDAI minimum 1.50)
      },
    };
    const res = synthesizer.synthesize(input);
    assert.equal(res.status, 'UNAVAILABLE');
    assert.equal(res.valuationScore, null);
    assert.ok(res.reason?.includes('SOLVENCY_BELOW_REGULATORY_MINIMUM'));
  });

  it('1.7. [LIFE INSURANCE: SOLVENCY AT/ABOVE 1.50] succeeds when solvency meets statutory threshold', () => {
    const inputExact: ValuationInputPayload = {
      ...baseLifeInsuranceInput,
      fundamentals: {
        ...baseLifeInsuranceInput.fundamentals,
        solvencyRatio: 1.50, // Exactly at statutory boundary
      },
    };
    const resExact = synthesizer.synthesize(inputExact);
    assert.equal(resExact.status, 'CALIBRATION_PENDING');
    assert.equal(resExact.multipleType, 'P/EV');
    assert.equal(resExact.valuationScore, null);
  });

  it('1.8. [LIFE INSURANCE: EXCEPTIONAL EVENT] fails closed when exceptionalEventFlag === true per Q-GRP2-13', () => {
    const input: ValuationInputPayload = {
      ...baseLifeInsuranceInput,
      fundamentals: {
        ...baseLifeInsuranceInput.fundamentals,
        exceptionalEventFlag: true,
        exceptionalEventReason: 'Demutualization and amalgamation scheme',
      },
    };
    const res = synthesizer.synthesize(input);
    assert.equal(res.status, 'UNAVAILABLE');
    assert.equal(res.valuationScore, null);
    assert.ok(res.reason?.includes('EXCEPTIONAL_EVENT_EXCLUDED'));
  });

  it('1.9. [LIFE INSURANCE: NON-LIFE BLOCKED] General and Health categories remain BLOCKED_UNCALIBRATED per Q-GRP2-01/04', () => {
    const nonLifeCategories = ['General', 'General Insurance', 'Health', 'Health Insurance', 'Reinsurance'];
    for (const cat of nonLifeCategories) {
      const input: ValuationInputPayload = {
        ...baseLifeInsuranceInput,
        fundamentals: {
          ...baseLifeInsuranceInput.fundamentals,
          insuranceCategory: cat,
        },
      };
      const res = synthesizer.synthesize(input);
      assert.equal(res.status, 'BLOCKED_UNCALIBRATED', `Category ${cat} must be BLOCKED_UNCALIBRATED`);
      assert.equal(res.valuationScore, null);
      assert.ok(res.reason?.includes('NON_LIFE_INSURANCE_EXCLUDED'));
    }
  });

  // ==========================================
  // SECTION 2: CAPITAL MARKETS — AMC
  // ==========================================

  it('2.1. [CAPITAL MARKETS AMC: VALID MCAP/AUM] computes Market Cap / AUM (%) and outputs CALIBRATION_PENDING with valuationScore null', () => {
    // Market Cap = 3200 * 21.3 = 68,160 Cr
    // Total AUM = 650,000 Cr
    // MCap / AUM (%) = (68160 / 650000) * 100 = 10.486%
    const res = synthesizer.synthesize(baseAmcInput);

    assert.equal(res.status, 'CALIBRATION_PENDING');
    assert.equal(res.valuationScore, null, 'Valuation score must be strictly null (Q-GRP2-12 = C)');
    assert.equal(res.multipleType, 'Market Cap / AUM (%)');
    assert.equal(res.calculatedMultiple, 10.486);
    assert.equal(res.marketCap, 68160.0);
    assert.equal(res.totalAum, 650000.0);
    assert.ok(res.reason?.includes('CALIBRATION_PENDING'));
  });

  it('2.2. [CAPITAL MARKETS AMC: MISSING AUM] fails closed with UNAVAILABLE when totalAum is undefined', () => {
    const input: ValuationInputPayload = {
      ...baseAmcInput,
      fundamentals: {
        canonicalSecurityId: 'CAP-AMC-01',
        sector: 'Capital Markets',
        capitalMarketsCategory: 'AMC',
        sharesOutstanding: 21.3,
        debt: 0,
        cash: 0,
      },
    };
    const res = synthesizer.synthesize(input);
    assert.equal(res.status, 'UNAVAILABLE');
    assert.equal(res.valuationScore, null);
    assert.ok(res.reason?.includes('MISSING_TOTAL_AUM'));
  });

  it('2.3. [CAPITAL MARKETS AMC: NON-POSITIVE AUM] fails closed with UNAVAILABLE when totalAum <= 0', () => {
    const inputZero: ValuationInputPayload = {
      ...baseAmcInput,
      fundamentals: {
        ...baseAmcInput.fundamentals,
        totalAum: 0,
      },
    };
    const resZero = synthesizer.synthesize(inputZero);
    assert.equal(resZero.status, 'UNAVAILABLE');
    assert.equal(resZero.valuationScore, null);
    assert.ok(resZero.reason?.includes('NON_POSITIVE_TOTAL_AUM'));

    const inputNeg: ValuationInputPayload = {
      ...baseAmcInput,
      fundamentals: {
        ...baseAmcInput.fundamentals,
        totalAum: -1000,
      },
    };
    const resNeg = synthesizer.synthesize(inputNeg);
    assert.equal(resNeg.status, 'UNAVAILABLE');
    assert.equal(resNeg.valuationScore, null);
    assert.ok(resNeg.reason?.includes('NON_POSITIVE_TOTAL_AUM'));
  });

  it('2.4. [CAPITAL MARKETS AMC: INVALID CLOSE & SHARES] fails closed with UNAVAILABLE for invalid price/shares', () => {
    const resPrice = synthesizer.synthesize({ ...baseAmcInput, eodClosePrice: -10 });
    assert.equal(resPrice.status, 'UNAVAILABLE');
    assert.equal(resPrice.valuationScore, null);

    const resShares = synthesizer.synthesize({
      ...baseAmcInput,
      fundamentals: { ...baseAmcInput.fundamentals, sharesOutstanding: 0 },
    });
    assert.equal(resShares.status, 'UNAVAILABLE');
    assert.equal(resShares.valuationScore, null);
  });

  it('2.5. [CAPITAL MARKETS AMC: EXCEPTIONAL EVENT] fails closed when exceptionalEventFlag === true', () => {
    const input: ValuationInputPayload = {
      ...baseAmcInput,
      fundamentals: {
        ...baseAmcInput.fundamentals,
        exceptionalEventFlag: true,
        exceptionalEventReason: 'Sponsor change and regulatory penalty',
      },
    };
    const res = synthesizer.synthesize(input);
    assert.equal(res.status, 'UNAVAILABLE');
    assert.equal(res.valuationScore, null);
    assert.ok(res.reason?.includes('EXCEPTIONAL_EVENT_EXCLUDED'));
  });

  // ==========================================
  // SECTION 3: CAPITAL MARKETS — NON-AMC
  // ==========================================

  it('3.1. [CAPITAL MARKETS NON-AMC: VALID P/E] computes raw P/E multiple and outputs CALIBRATION_PENDING with valuationScore null', () => {
    // P/E = 2450 / 70 = 35.0x
    const res = synthesizer.synthesize(baseNonAmcInput);

    assert.equal(res.status, 'CALIBRATION_PENDING');
    assert.equal(res.valuationScore, null, 'Valuation score must be strictly null (Q-GRP2-12 = C)');
    assert.equal(res.multipleType, 'P/E');
    assert.equal(res.calculatedMultiple, 35.0);
    assert.ok(res.reason?.includes('CALIBRATION_PENDING'));
  });

  it('3.2. [CAPITAL MARKETS NON-AMC: MISSING EPS] fails closed with UNAVAILABLE when ltmEps and ltmNetIncome are missing', () => {
    const input: ValuationInputPayload = {
      ...baseNonAmcInput,
      fundamentals: {
        canonicalSecurityId: 'CAP-EXCH-01',
        sector: 'Capital Markets',
        capitalMarketsCategory: 'NON-AMC',
        sharesOutstanding: 13.5,
        debt: 0,
        cash: 0,
      },
    };
    const res = synthesizer.synthesize(input);
    assert.equal(res.status, 'UNAVAILABLE');
    assert.equal(res.valuationScore, null);
    assert.ok(res.reason?.includes('NON_POSITIVE_EARNINGS'));
  });

  it('3.3. [CAPITAL MARKETS NON-AMC: NON-POSITIVE EPS] fails closed with UNAVAILABLE when ltmEps <= 0', () => {
    const inputZero: ValuationInputPayload = {
      ...baseNonAmcInput,
      fundamentals: {
        ...baseNonAmcInput.fundamentals,
        ltmEps: 0,
      },
    };
    const resZero = synthesizer.synthesize(inputZero);
    assert.equal(resZero.status, 'UNAVAILABLE');
    assert.equal(resZero.valuationScore, null);
    assert.ok(resZero.reason?.includes('NON_POSITIVE_EARNINGS'));

    const inputNeg: ValuationInputPayload = {
      ...baseNonAmcInput,
      fundamentals: {
        ...baseNonAmcInput.fundamentals,
        ltmEps: -5.5,
      },
    };
    const resNeg = synthesizer.synthesize(inputNeg);
    assert.equal(resNeg.status, 'UNAVAILABLE');
    assert.equal(resNeg.valuationScore, null);
    assert.ok(resNeg.reason?.includes('NON_POSITIVE_EARNINGS'));
  });

  it('3.4. [CAPITAL MARKETS NON-AMC: EXCEPTIONAL EVENT] fails closed when exceptionalEventFlag === true', () => {
    const input: ValuationInputPayload = {
      ...baseNonAmcInput,
      fundamentals: {
        ...baseNonAmcInput.fundamentals,
        exceptionalEventFlag: true,
        exceptionalEventReason: 'License suspension investigation',
      },
    };
    const res = synthesizer.synthesize(input);
    assert.equal(res.status, 'UNAVAILABLE');
    assert.equal(res.valuationScore, null);
    assert.ok(res.reason?.includes('EXCEPTIONAL_EVENT_EXCLUDED'));
  });

  // ==========================================
  // SECTION 4: SEGMENTATION & CROSS-FALLBACK
  // ==========================================

  it('4.1. [SEGMENTATION ISOLATION] AMC strictly selects Market Cap / AUM; Non-AMC strictly selects P/E with zero cross-fallback', () => {
    // If an AMC payload also contains EPS, it must still evaluate Market Cap / AUM
    const amcWithEps: ValuationInputPayload = {
      ...baseAmcInput,
      fundamentals: {
        ...baseAmcInput.fundamentals,
        ltmEps: 45.0, // Should be ignored in AMC branch
      },
    };
    const resAmc = synthesizer.synthesize(amcWithEps);
    assert.equal(resAmc.multipleType, 'Market Cap / AUM (%)');
    assert.notEqual(resAmc.multipleType, 'P/E');

    // If a Non-AMC payload also contains totalAum, it must still evaluate P/E
    const nonAmcWithAum: ValuationInputPayload = {
      ...baseNonAmcInput,
      fundamentals: {
        ...baseNonAmcInput.fundamentals,
        totalAum: 50000.0, // Should be ignored in Non-AMC branch
      },
    };
    const resNonAmc = synthesizer.synthesize(nonAmcWithAum);
    assert.equal(resNonAmc.multipleType, 'P/E');
    assert.notEqual(resNonAmc.multipleType, 'Market Cap / AUM (%)');
  });

  it('4.2. [DETERMINISTIC INVARIANCE] repeated executions produce bit-identical scaffold results', () => {
    const run1 = synthesizer.synthesize(baseLifeInsuranceInput);
    const run2 = synthesizer.synthesize(baseLifeInsuranceInput);
    assert.deepEqual(run1, run2);

    const runAmc1 = synthesizer.synthesize(baseAmcInput);
    const runAmc2 = synthesizer.synthesize(baseAmcInput);
    assert.deepEqual(runAmc1, runAmc2);

    const runNonAmc1 = synthesizer.synthesize(baseNonAmcInput);
    const runNonAmc2 = synthesizer.synthesize(baseNonAmcInput);
    assert.deepEqual(runNonAmc1, runNonAmc2);
  });
});
