import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { EodValuationSynthesizer } from './eod-valuation-synthesizer.ts';
import { DynamicEngineRunner } from '../dynamic-runner/dynamic-engine-runner.ts';
import { SecurityMasterService } from '../security-master/security-master-service.ts';
import type { ValuationInputPayload } from './valuation-contract.ts';

describe('D115-STAGE2 Group 2 Numerical Calibration Verification Suite', () => {
  const synthesizer = new EodValuationSynthesizer();
  const securityMaster = new SecurityMasterService();
  const runner = new DynamicEngineRunner(securityMaster, synthesizer);

  // ---------------------------------------------------------------------------
  // 1. LIFE INSURANCE P/EV BOUNDARY TESTS (Q-GRP2-CAL-04)
  // Bands: < 1.800 -> 90; 1.800..2.400 -> 75; 2.400..3.200 -> 60; 3.200..4.000 -> 45; >= 4.000 -> 20
  // Standard setup: Shares = 100 Cr, EV = 10,000 Cr => EVPS = 100 INR
  // Price = targetMultiple * 100
  // ---------------------------------------------------------------------------
  const baseLifeInput: ValuationInputPayload = {
    canonicalSecurityId: 'INS-LIFE-TEST',
    sector: 'Insurance',
    eodClosePrice: 100.0,
    tradeDate: '2026-09-17',
    archiveSha256: '88e9098861ffa5a5f774ebf5c31e156a3f8eb3e8429e5b988d88660633e6fce9',
    fundamentals: {
      canonicalSecurityId: 'INS-LIFE-TEST',
      sector: 'Insurance',
      insuranceCategory: 'Life',
      sharesOutstanding: 100.0,
      debt: 0,
      cash: 0,
      embeddedValue: 10000.0,
      solvencyRatio: 1.80,
    },
  };

  function lifeInputForMultiple(multiple: number): ValuationInputPayload {
    return {
      ...baseLifeInput,
      eodClosePrice: Math.round(multiple * 100.0 * 1000) / 1000,
    };
  }

  it('1.1. [LIFE: TIER 1 JUST BELOW 1.800] P/EV = 1.799 produces score 90.0', () => {
    const res = synthesizer.synthesize(lifeInputForMultiple(1.799));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 1.799);
    assert.equal(res.valuationScore, 90.0);
    assert.equal(res.multipleType, 'P/EV');
    assert.equal(res.provenance.calibrationProfileId, 'insurance-valuation-calibration');
    assert.equal(res.provenance.calibrationVersion, '1.0.0');
  });

  it('1.2. [LIFE: TIER 2 EXACT 1.800] P/EV = 1.800 produces score 75.0', () => {
    const res = synthesizer.synthesize(lifeInputForMultiple(1.800));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 1.800);
    assert.equal(res.valuationScore, 75.0);
  });

  it('1.3. [LIFE: TIER 2 JUST BELOW 2.400] P/EV = 2.399 produces score 75.0', () => {
    const res = synthesizer.synthesize(lifeInputForMultiple(2.399));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 2.399);
    assert.equal(res.valuationScore, 75.0);
  });

  it('1.4. [LIFE: TIER 3 EXACT 2.400] P/EV = 2.400 produces score 60.0', () => {
    const res = synthesizer.synthesize(lifeInputForMultiple(2.400));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 2.400);
    assert.equal(res.valuationScore, 60.0);
  });

  it('1.5. [LIFE: TIER 3 JUST BELOW 3.200] P/EV = 3.199 produces score 60.0', () => {
    const res = synthesizer.synthesize(lifeInputForMultiple(3.199));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 3.199);
    assert.equal(res.valuationScore, 60.0);
  });

  it('1.6. [LIFE: TIER 4 EXACT 3.200] P/EV = 3.200 produces score 45.0', () => {
    const res = synthesizer.synthesize(lifeInputForMultiple(3.200));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 3.200);
    assert.equal(res.valuationScore, 45.0);
  });

  it('1.7. [LIFE: TIER 4 JUST BELOW 4.000] P/EV = 3.999 produces score 45.0', () => {
    const res = synthesizer.synthesize(lifeInputForMultiple(3.999));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 3.999);
    assert.equal(res.valuationScore, 45.0);
  });

  it('1.8. [LIFE: TIER 5 EXACT 4.000] P/EV = 4.000 produces score 20.0', () => {
    const res = synthesizer.synthesize(lifeInputForMultiple(4.000));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 4.000);
    assert.equal(res.valuationScore, 20.0);
  });

  it('1.9. [LIFE: TIER 5 DEEP EXPENSIVE 5.500] P/EV = 5.500 produces score 20.0', () => {
    const res = synthesizer.synthesize(lifeInputForMultiple(5.500));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 5.500);
    assert.equal(res.valuationScore, 20.0);
  });

  // ---------------------------------------------------------------------------
  // 2. CAPITAL MARKETS AMC MARKET CAP / AUM (%) BOUNDARY TESTS (Q-GRP2-CAL-04)
  // Bands: < 6.000% -> 90; 6.000%..9.000% -> 75; 9.000%..13.000% -> 60; 13.000%..17.000% -> 45; >= 17.000% -> 20
  // Standard setup: Shares = 10 Cr, Total AUM = 100,000 Cr. MCap = Price * 10
  // MCap / AUM % = (Price * 10 / 100000) * 100 = Price / 100
  // Price = targetMultiple * 100
  // ---------------------------------------------------------------------------
  const baseAmcInput: ValuationInputPayload = {
    canonicalSecurityId: 'CAP-AMC-TEST',
    sector: 'Capital Markets',
    eodClosePrice: 500.0,
    tradeDate: '2026-09-17',
    archiveSha256: '88e9098861ffa5a5f774ebf5c31e156a3f8eb3e8429e5b988d88660633e6fce9',
    fundamentals: {
      canonicalSecurityId: 'CAP-AMC-TEST',
      sector: 'Capital Markets',
      capitalMarketsCategory: 'AMC',
      sharesOutstanding: 10.0,
      debt: 0,
      cash: 0,
      totalAum: 100000.0,
    },
  };

  function amcInputForMultiple(targetPercent: number): ValuationInputPayload {
    return {
      ...baseAmcInput,
      eodClosePrice: Math.round(targetPercent * 100.0 * 1000) / 1000,
    };
  }

  it('2.1. [AMC: TIER 1 JUST BELOW 6.000%] MCap/AUM = 5.990% produces score 90.0', () => {
    const res = synthesizer.synthesize(amcInputForMultiple(5.990));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 5.990);
    assert.equal(res.valuationScore, 90.0);
    assert.equal(res.multipleType, 'Market Cap / AUM (%)');
    assert.equal(res.provenance.calibrationProfileId, 'capital-markets-valuation-calibration');
    assert.equal(res.provenance.calibrationVersion, '1.0.0');
  });

  it('2.2. [AMC: TIER 2 EXACT 6.000%] MCap/AUM = 6.000% produces score 75.0', () => {
    const res = synthesizer.synthesize(amcInputForMultiple(6.000));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 6.000);
    assert.equal(res.valuationScore, 75.0);
  });

  it('2.3. [AMC: TIER 2 JUST BELOW 9.000%] MCap/AUM = 8.990% produces score 75.0', () => {
    const res = synthesizer.synthesize(amcInputForMultiple(8.990));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 8.990);
    assert.equal(res.valuationScore, 75.0);
  });

  it('2.4. [AMC: TIER 3 EXACT 9.000%] MCap/AUM = 9.000% produces score 60.0', () => {
    const res = synthesizer.synthesize(amcInputForMultiple(9.000));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 9.000);
    assert.equal(res.valuationScore, 60.0);
  });

  it('2.5. [AMC: TIER 3 JUST BELOW 13.000%] MCap/AUM = 12.990% produces score 60.0', () => {
    const res = synthesizer.synthesize(amcInputForMultiple(12.990));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 12.990);
    assert.equal(res.valuationScore, 60.0);
  });

  it('2.6. [AMC: TIER 4 EXACT 13.000%] MCap/AUM = 13.000% produces score 45.0', () => {
    const res = synthesizer.synthesize(amcInputForMultiple(13.000));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 13.000);
    assert.equal(res.valuationScore, 45.0);
  });

  it('2.7. [AMC: TIER 4 JUST BELOW 17.000%] MCap/AUM = 16.990% produces score 45.0', () => {
    const res = synthesizer.synthesize(amcInputForMultiple(16.990));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 16.990);
    assert.equal(res.valuationScore, 45.0);
  });

  it('2.8. [AMC: TIER 5 EXACT 17.000%] MCap/AUM = 17.000% produces score 20.0', () => {
    const res = synthesizer.synthesize(amcInputForMultiple(17.000));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 17.000);
    assert.equal(res.valuationScore, 20.0);
  });

  it('2.9. [AMC: TIER 5 DEEP EXPENSIVE 25.000%] MCap/AUM = 25.000% produces score 20.0', () => {
    const res = synthesizer.synthesize(amcInputForMultiple(25.000));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 25.000);
    assert.equal(res.valuationScore, 20.0);
  });

  // ---------------------------------------------------------------------------
  // 3. CAPITAL MARKETS NON-AMC P/E BOUNDARY TESTS (Q-GRP2-CAL-04)
  // Bands: < 18.000 -> 90; 18.000..26.000 -> 75; 26.000..38.000 -> 60; 38.000..52.000 -> 45; >= 52.000 -> 20
  // Standard setup: EPS = 100 INR. Price = targetMultiple * 100
  // ---------------------------------------------------------------------------
  const baseNonAmcInput: ValuationInputPayload = {
    canonicalSecurityId: 'CAP-NONAMC-TEST',
    sector: 'Capital Markets',
    eodClosePrice: 1000.0,
    tradeDate: '2026-09-17',
    archiveSha256: '88e9098861ffa5a5f774ebf5c31e156a3f8eb3e8429e5b988d88660633e6fce9',
    fundamentals: {
      canonicalSecurityId: 'CAP-NONAMC-TEST',
      sector: 'Capital Markets',
      capitalMarketsCategory: 'NON-AMC',
      sharesOutstanding: 10.0,
      debt: 0,
      cash: 0,
      ltmEps: 100.0,
    },
  };

  function nonAmcInputForMultiple(targetPe: number): ValuationInputPayload {
    return {
      ...baseNonAmcInput,
      eodClosePrice: Math.round(targetPe * 100.0 * 1000) / 1000,
    };
  }

  it('3.1. [NON-AMC: TIER 1 JUST BELOW 18.000] P/E = 17.990 produces score 90.0', () => {
    const res = synthesizer.synthesize(nonAmcInputForMultiple(17.990));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 17.990);
    assert.equal(res.valuationScore, 90.0);
    assert.equal(res.multipleType, 'P/E');
    assert.equal(res.provenance.calibrationProfileId, 'capital-markets-valuation-calibration');
    assert.equal(res.provenance.calibrationVersion, '1.0.0');
  });

  it('3.2. [NON-AMC: TIER 2 EXACT 18.000] P/E = 18.000 produces score 75.0', () => {
    const res = synthesizer.synthesize(nonAmcInputForMultiple(18.000));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 18.000);
    assert.equal(res.valuationScore, 75.0);
  });

  it('3.3. [NON-AMC: TIER 2 JUST BELOW 26.000] P/E = 25.990 produces score 75.0', () => {
    const res = synthesizer.synthesize(nonAmcInputForMultiple(25.990));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 25.990);
    assert.equal(res.valuationScore, 75.0);
  });

  it('3.4. [NON-AMC: TIER 3 EXACT 26.000] P/E = 26.000 produces score 60.0', () => {
    const res = synthesizer.synthesize(nonAmcInputForMultiple(26.000));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 26.000);
    assert.equal(res.valuationScore, 60.0);
  });

  it('3.5. [NON-AMC: TIER 3 JUST BELOW 38.000] P/E = 37.990 produces score 60.0', () => {
    const res = synthesizer.synthesize(nonAmcInputForMultiple(37.990));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 37.990);
    assert.equal(res.valuationScore, 60.0);
  });

  it('3.6. [NON-AMC: TIER 4 EXACT 38.000] P/E = 38.000 produces score 45.0', () => {
    const res = synthesizer.synthesize(nonAmcInputForMultiple(38.000));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 38.000);
    assert.equal(res.valuationScore, 45.0);
  });

  it('3.7. [NON-AMC: TIER 4 JUST BELOW 52.000] P/E = 51.990 produces score 45.0', () => {
    const res = synthesizer.synthesize(nonAmcInputForMultiple(51.990));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 51.990);
    assert.equal(res.valuationScore, 45.0);
  });

  it('3.8. [NON-AMC: TIER 5 EXACT 52.000] P/E = 52.000 produces score 20.0', () => {
    const res = synthesizer.synthesize(nonAmcInputForMultiple(52.000));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 52.000);
    assert.equal(res.valuationScore, 20.0);
  });

  it('3.9. [NON-AMC: TIER 5 DEEP EXPENSIVE 75.000] P/E = 75.000 produces score 20.0', () => {
    const res = synthesizer.synthesize(nonAmcInputForMultiple(75.000));
    assert.equal(res.status, 'CALCULATED');
    assert.equal(res.calculatedMultiple, 75.000);
    assert.equal(res.valuationScore, 20.0);
  });

  // ---------------------------------------------------------------------------
  // 4. FAIL-CLOSED AND NEGATIVE INPUT TESTING (Q-GRP2-CAL-05 & 06)
  // ---------------------------------------------------------------------------

  it('4.1. [FAIL-CLOSED: EV <= 0] Life insurance fails closed as UNAVAILABLE with valuationScore null', () => {
    const zeroEv = { ...baseLifeInput, fundamentals: { ...baseLifeInput.fundamentals, embeddedValue: 0 } };
    const resZero = synthesizer.synthesize(zeroEv);
    assert.equal(resZero.status, 'UNAVAILABLE');
    assert.equal(resZero.valuationScore, null);

    const negEv = { ...baseLifeInput, fundamentals: { ...baseLifeInput.fundamentals, embeddedValue: -100 } };
    const resNeg = synthesizer.synthesize(negEv);
    assert.equal(resNeg.status, 'UNAVAILABLE');
    assert.equal(resNeg.valuationScore, null);
  });

  it('4.2. [FAIL-CLOSED: SOLVENCY < 1.50] Life insurance fails closed with UNAVAILABLE', () => {
    const breachInput = { ...baseLifeInput, fundamentals: { ...baseLifeInput.fundamentals, solvencyRatio: 1.49 } };
    const res = synthesizer.synthesize(breachInput);
    assert.equal(res.status, 'UNAVAILABLE');
    assert.equal(res.valuationScore, null);
    assert.ok(res.reason?.includes('SOLVENCY_BELOW_REGULATORY_MINIMUM'));
  });

  it('4.3. [FAIL-CLOSED: AUM <= 0] Capital Markets AMC fails closed as UNAVAILABLE with valuationScore null', () => {
    const zeroAum = { ...baseAmcInput, fundamentals: { ...baseAmcInput.fundamentals, totalAum: 0 } };
    const resZero = synthesizer.synthesize(zeroAum);
    assert.equal(resZero.status, 'UNAVAILABLE');
    assert.equal(resZero.valuationScore, null);

    const negAum = { ...baseAmcInput, fundamentals: { ...baseAmcInput.fundamentals, totalAum: -500 } };
    const resNeg = synthesizer.synthesize(negAum);
    assert.equal(resNeg.status, 'UNAVAILABLE');
    assert.equal(resNeg.valuationScore, null);
  });

  it('4.4. [FAIL-CLOSED: EPS <= 0] Capital Markets Non-AMC fails closed as UNAVAILABLE with valuationScore null', () => {
    const zeroEps = { ...baseNonAmcInput, fundamentals: { ...baseNonAmcInput.fundamentals, ltmEps: 0 } };
    const resZero = synthesizer.synthesize(zeroEps);
    assert.equal(resZero.status, 'UNAVAILABLE');
    assert.equal(resZero.valuationScore, null);

    const negEps = { ...baseNonAmcInput, fundamentals: { ...baseNonAmcInput.fundamentals, ltmEps: -12.5 } };
    const resNeg = synthesizer.synthesize(negEps);
    assert.equal(resNeg.status, 'UNAVAILABLE');
    assert.equal(resNeg.valuationScore, null);
  });

  it('4.5. [FAIL-CLOSED: MISSING DENOMINATORS] missing embeddedValue, totalAum, or eps fails closed', () => {
    const missingEv = { ...baseLifeInput, fundamentals: { ...baseLifeInput.fundamentals, embeddedValue: undefined } };
    const resEv = synthesizer.synthesize(missingEv);
    assert.equal(resEv.status, 'BLOCKED_UNCALIBRATED');
    assert.equal(resEv.valuationScore, null);

    const missingAum = { ...baseAmcInput, fundamentals: { ...baseAmcInput.fundamentals, totalAum: undefined } };
    const resAum = synthesizer.synthesize(missingAum);
    assert.equal(resAum.status, 'UNAVAILABLE');
    assert.equal(resAum.valuationScore, null);

    const missingEps = { ...baseNonAmcInput, fundamentals: { ...baseNonAmcInput.fundamentals, ltmEps: undefined, ltmNetIncome: undefined } };
    const resEps = synthesizer.synthesize(missingEps);
    assert.equal(resEps.status, 'UNAVAILABLE');
    assert.equal(resEps.valuationScore, null);
  });

  it('4.6. [FAIL-CLOSED: EXCEPTIONAL EVENTS (Q-GRP2-CAL-05)] exceptionalEventFlag = true fails closed as UNAVAILABLE across all sectors', () => {
    const resLife = synthesizer.synthesize({
      ...baseLifeInput,
      fundamentals: { ...baseLifeInput.fundamentals, exceptionalEventFlag: true, exceptionalEventReason: 'Court merger order' },
    });
    assert.equal(resLife.status, 'UNAVAILABLE');
    assert.equal(resLife.valuationScore, null);

    const resAmc = synthesizer.synthesize({
      ...baseAmcInput,
      fundamentals: { ...baseAmcInput.fundamentals, exceptionalEventFlag: true, exceptionalEventReason: 'Trustee takeover' },
    });
    assert.equal(resAmc.status, 'UNAVAILABLE');
    assert.equal(resAmc.valuationScore, null);

    const resNonAmc = synthesizer.synthesize({
      ...baseNonAmcInput,
      fundamentals: { ...baseNonAmcInput.fundamentals, exceptionalEventFlag: true, exceptionalEventReason: 'SEBI trading ban' },
    });
    assert.equal(resNonAmc.status, 'UNAVAILABLE');
    assert.equal(resNonAmc.valuationScore, null);
  });

  // ---------------------------------------------------------------------------
  // 5. SEGMENTATION & CROSS-FALLBACK ISOLATION (Q-GRP2-CAL-03)
  // ---------------------------------------------------------------------------

  it('5.1. [SEGMENTATION ISOLATION: AMC NO P/E FALLBACK] AMC with valid EPS still computes Market Cap / AUM', () => {
    const amcWithEps = {
      ...baseAmcInput,
      fundamentals: { ...baseAmcInput.fundamentals, ltmEps: 50.0 },
    };
    const res = synthesizer.synthesize(amcWithEps);
    assert.equal(res.multipleType, 'Market Cap / AUM (%)');
    assert.notEqual(res.multipleType, 'P/E');
  });

  it('5.2. [SEGMENTATION ISOLATION: NON-AMC NO MCAP/AUM FALLBACK] Non-AMC with valid totalAum still computes P/E', () => {
    const nonAmcWithAum = {
      ...baseNonAmcInput,
      fundamentals: { ...baseNonAmcInput.fundamentals, totalAum: 500000.0 },
    };
    const res = synthesizer.synthesize(nonAmcWithAum);
    assert.equal(res.multipleType, 'P/E');
    assert.notEqual(res.multipleType, 'Market Cap / AUM (%)');
  });

  // ---------------------------------------------------------------------------
  // 6. RUNNER SAFETY GATES & INVARIANCE (Q-GRP2-CAL-10)
  // ---------------------------------------------------------------------------

  it('6.1. [RUNNER GATE: INSURANCE BLOCKED] DynamicEngineRunner keeps Insurance in blockedSectors failing as SECTOR_UNSUPPORTED', () => {
    // Provide a mocked SecurityMaster with mapped Insurance security to verify blockedSectors filter
    const customMaster = new SecurityMasterService({
      schemaVersion: '1.0.0',
      publishedDate: '2026-09-17',
      authoritativeSource: 'Test',
      description: 'Test',
      entries: [
        {
          canonicalSecurityId: 'INS-01',
          tickerSymbol: 'MOCKINS',
          isin: 'INE795G01014',
          exchange: 'NSE',
          series: 'EQ',
          sector: 'Insurance',
          companyName: 'Mock Insurance Ltd',
          listingStatus: 'ACTIVE',
          effectiveFrom: '2000-01-01',
          mappingVersion: '1.0.0',
        },
      ],
      excludedCandidateMappings: [],
    });
    const customRunner = new DynamicEngineRunner(customMaster, synthesizer);
    const res = customRunner.execute({
      symbolOrIsin: 'MOCKINS',
      eodClosePrice: 650.0,
      tradeDate: '2026-09-17',
    });
    assert.equal(res.status, 'SECTOR_UNSUPPORTED');
    assert.equal(res.composite, null);
    assert.equal(res.verdict, null);
    assert.ok(res.reason?.includes('SECTOR_UNSUPPORTED'));
  });

  it('6.2. [RUNNER GATE: CAPITAL MARKETS BLOCKED] DynamicEngineRunner keeps Capital Markets in blockedSectors failing as SECTOR_UNSUPPORTED', () => {
    const customMaster = new SecurityMasterService({
      schemaVersion: '1.0.0',
      publishedDate: '2026-09-17',
      authoritativeSource: 'Test',
      description: 'Test',
      entries: [
        {
          canonicalSecurityId: 'CAP-01',
          tickerSymbol: 'MOCKCAP',
          isin: 'INE118H01025',
          exchange: 'NSE',
          series: 'EQ',
          sector: 'Capital Markets',
          companyName: 'Mock Cap Markets Ltd',
          listingStatus: 'ACTIVE',
          effectiveFrom: '2000-01-01',
          mappingVersion: '1.0.0',
        },
      ],
      excludedCandidateMappings: [],
    });
    const customRunner = new DynamicEngineRunner(customMaster, synthesizer);
    const res = customRunner.execute({
      symbolOrIsin: 'MOCKCAP',
      eodClosePrice: 3200.0,
      tradeDate: '2026-09-17',
    });
    assert.equal(res.status, 'SECTOR_UNSUPPORTED');
    assert.equal(res.composite, null);
    assert.equal(res.verdict, null);
    assert.ok(res.reason?.includes('SECTOR_UNSUPPORTED'));
  });

  it('6.3. [RUNNER GATE: HEALTHCARE & HOSPITALITY BLOCKED] Healthcare and Hospitality remain blocked per Decision C2', () => {
    const customMaster = new SecurityMasterService({
      schemaVersion: '1.0.0',
      publishedDate: '2026-09-17',
      authoritativeSource: 'Test',
      description: 'Test',
      entries: [
        {
          canonicalSecurityId: 'HLTH-01',
          tickerSymbol: 'MOCKHLTH',
          isin: 'INE044A01036',
          exchange: 'NSE',
          series: 'EQ',
          sector: 'Healthcare',
          companyName: 'Mock Health Ltd',
          listingStatus: 'ACTIVE',
          effectiveFrom: '2000-01-01',
          mappingVersion: '1.0.0',
        },
        {
          canonicalSecurityId: 'HOSP-01',
          tickerSymbol: 'MOCKHOSP',
          isin: 'INE053A01029',
          exchange: 'NSE',
          series: 'EQ',
          sector: 'Hospitality',
          companyName: 'Mock Hosp Ltd',
          listingStatus: 'ACTIVE',
          effectiveFrom: '2000-01-01',
          mappingVersion: '1.0.0',
        },
      ],
      excludedCandidateMappings: [],
    });
    const customRunner = new DynamicEngineRunner(customMaster, synthesizer);
    for (const ticker of ['MOCKHLTH', 'MOCKHOSP']) {
      const res = customRunner.execute({
        symbolOrIsin: ticker,
        eodClosePrice: 1500.0,
        tradeDate: '2026-09-17',
      });
      assert.equal(res.status, 'SECTOR_UNSUPPORTED');
      assert.equal(res.composite, null);
    }
  });

  it('6.4. [BANKING OPERATIONAL INVARIANCE] DynamicEngineRunner maintains Banking fully operational per D113-QCAL09', () => {
    const res = runner.execute({
      symbolOrIsin: 'HDFCBANK',
      eodClosePrice: 1650.0,
      tradeDate: '2026-09-17',
    });
    assert.equal(res.status, 'DYNAMIC_EXECUTION_COMPLETED');
    assert.equal(res.valuationMultipleType, 'P/ABV');
    assert.equal(typeof res.composite, 'number');
    assert.equal(typeof res.verdict, 'string');
    assert.equal(res.valuationScore, 45.0);
  });
});
