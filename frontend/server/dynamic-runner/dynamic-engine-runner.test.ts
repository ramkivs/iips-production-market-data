import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { SecurityMasterService } from '../security-master/security-master-service.ts';
import { EodValuationSynthesizer } from '../valuation/eod-valuation-synthesizer.ts';
import { DynamicEngineRunner } from './dynamic-engine-runner.ts';
import type { DynamicEngineRequest } from './dynamic-runner-contract.ts';

describe('D112-D Dynamic Engine Runner Invariant & Fail-Closed Suite', () => {
  const securityMaster = new SecurityMasterService();
  const valuationSynthesizer = new EodValuationSynthesizer();
  const runner = new DynamicEngineRunner(securityMaster, valuationSynthesizer);

  // 1. Valid Execution across Evidenced Calibrated Sectors
  it('1. [TECHNOLOGY EXECUTION] evaluates dynamic score for TCS (TECH-H1)', () => {
    const req: DynamicEngineRequest = {
      symbolOrIsin: 'TCS',
      tradeDate: '2026-09-14',
      eodClosePrice: 4150.0,
      archiveSha256: '88e9098861ffa5a5f774ebf5c31e156a3f8eb3e8429e5b988d88660633e6fce9',
    };
    const result = runner.execute(req);
    assert.equal(result.status, 'DYNAMIC_EXECUTION_COMPLETED');
    assert.equal(result.canonicalSecurityId, 'TECH-H1');
    assert.equal(result.sector, 'Technology');
    assert.ok(result.composite! > 0 && result.composite! <= 100);
    assert.ok(result.verdict !== null);
    assert.equal(result.provenance.dataMode, 'LIVE');
    assert.equal(result.provenance.freshness, 'DEVELOPMENT_MIXED_VINTAGE');
    assert.equal(result.provenance.fundamentalsVintage, 'v1.1-reference');
    assert.equal(result.provenance.executionStatus, 'DYNAMIC_EXECUTION_COMPLETED');
    assert.equal(result.valuationMultipleType, 'EV/Revenue');
  });

  it('2. [ENERGY EXECUTION] evaluates dynamic score for RELIANCE (ENERGY-H1)', () => {
    const req: DynamicEngineRequest = {
      symbolOrIsin: 'RELIANCE',
      tradeDate: '2026-09-14',
      eodClosePrice: 2950.0,
      archiveSha256: '88e9098861ffa5a5f774ebf5c31e156a3f8eb3e8429e5b988d88660633e6fce9',
    };
    const result = runner.execute(req);
    assert.equal(result.status, 'DYNAMIC_EXECUTION_COMPLETED');
    assert.equal(result.canonicalSecurityId, 'ENERGY-H1');
    assert.equal(result.sector, 'Energy');
    assert.ok(result.composite! > 0 && result.composite! <= 100);
    assert.ok(result.verdict !== null);
    assert.equal(result.valuationMultipleType, 'EV/EBITDA');
  });

  it('3. [ISIN RESOLUTION] resolves and executes via ISIN INE467B01029', () => {
    const req: DynamicEngineRequest = {
      symbolOrIsin: 'INE467B01029',
      tradeDate: '2026-09-14',
      eodClosePrice: 4150.0,
    };
    const result = runner.execute(req);
    assert.equal(result.status, 'DYNAMIC_EXECUTION_COMPLETED');
    assert.equal(result.canonicalSecurityId, 'TECH-H1');
    assert.equal(result.tickerSymbol, 'TCS');
  });

  it('4. [CANONICAL ID RESOLUTION] resolves and executes via canonical ID ENERGY-H1', () => {
    const req: DynamicEngineRequest = {
      symbolOrIsin: 'ENERGY-H1',
      tradeDate: '2026-09-14',
      eodClosePrice: 2950.0,
    };
    const result = runner.execute(req);
    assert.equal(result.status, 'DYNAMIC_EXECUTION_COMPLETED');
    assert.equal(result.canonicalSecurityId, 'ENERGY-H1');
    assert.equal(result.tickerSymbol, 'RELIANCE');
  });

  // 2. Dynamic Execution for Calibrated Banking (D113-QCAL09)
  it('5. [BANKING CALIBRATED EXECUTION] evaluates dynamic score for HDFCBANK (BANK-H1)', () => {
    const req: DynamicEngineRequest = {
      symbolOrIsin: 'HDFCBANK',
      tradeDate: '2026-09-14',
      eodClosePrice: 1650.0,
    };
    const result = runner.execute(req);
    assert.equal(result.status, 'DYNAMIC_EXECUTION_COMPLETED');
    assert.equal(result.canonicalSecurityId, 'BANK-H1');
    assert.equal(result.sector, 'Banking');
    assert.equal(result.valuationMultipleType, 'P/ABV');
    assert.equal(result.valuationScore, 45.0); // P/ABV = 2.844 (Tier 4 -> 45.0)
    assert.ok(result.composite! > 0 && result.composite! <= 100);
    assert.ok(result.verdict !== null);
  });

  it('6. [UNMAPPED SECURITY] fails closed for unmapped equities', () => {
    const req: DynamicEngineRequest = {
      symbolOrIsin: 'UNKNOWN_EQUITY',
      tradeDate: '2026-09-14',
      eodClosePrice: 500.0,
    };
    const result = runner.execute(req);
    assert.equal(result.status, 'UNMAPPED_SECURITY');
    assert.equal(result.composite, null);
    assert.equal(result.verdict, null);
    assert.ok(result.reason?.includes('UNMAPPED_SECURITY'));
  });

  it('7. [INVALID EOD PRICE] fails closed for negative or zero price', () => {
    const req: DynamicEngineRequest = {
      symbolOrIsin: 'TCS',
      tradeDate: '2026-09-14',
      eodClosePrice: -50.0,
    };
    const result = runner.execute(req);
    assert.equal(result.status, 'INVALID_EOD');
    assert.equal(result.composite, null);
    assert.equal(result.verdict, null);
    assert.ok(result.reason?.includes('INVALID_EOD'));
  });

  it('8. [DETERMINISTIC INVARIANCE] produces identical scores on repeated execution', () => {
    const req: DynamicEngineRequest = {
      symbolOrIsin: 'TCS',
      tradeDate: '2026-09-14',
      eodClosePrice: 4150.0,
      archiveSha256: '88e9098861ffa5a5f774ebf5c31e156a3f8eb3e8429e5b988d88660633e6fce9',
    };
    const run1 = runner.execute(req);
    const run2 = runner.execute(req);
    assert.deepEqual(run1, run2);
    assert.equal(run1.composite, run2.composite);
    assert.equal(run1.verdict, run2.verdict);
  });

  it('9. [NO SILENT SNAPSHOT FALLBACK] failures on blocked sectors never return snapshot composite', () => {
    // Test with unmapped equity in uncalibrated sector to ensure fail-closed
    const req: DynamicEngineRequest = {
      symbolOrIsin: 'UNKNOWN_INSURANCE',
      tradeDate: '2026-09-14',
      eodClosePrice: 1650.0,
    };
    const result = runner.execute(req);
    assert.equal(result.composite, null);
    assert.equal(result.status, 'UNMAPPED_SECURITY');
  });

  it('10. [TEMPORAL LISTING STATUS] fails closed if queried prior to listing date', () => {
    // TCS listed 2004-08-25
    const req: DynamicEngineRequest = {
      symbolOrIsin: 'TCS',
      tradeDate: '2000-01-01',
      eodClosePrice: 4150.0,
    };
    const result = runner.execute(req);
    assert.equal(result.status, 'UNMAPPED_SECURITY');
    assert.equal(result.composite, null);
  });

  // 3. Four Blocked Sectors Invariant Check
  it('11. [FOUR SECTORS REMAIN BLOCKED] Insurance, Capital Markets, Healthcare, and Hospitality fail closed', () => {
    const blockedCandidates = [
      { sym: 'HDFCLIFE', sec: 'Insurance' },
      { sym: 'BSE', sec: 'Capital Markets' },
      { sym: 'SUNPHARMA', sec: 'Healthcare' },
      { sym: 'INDHOTEL', sec: 'Hospitality' },
    ];
    for (const item of blockedCandidates) {
      const res = runner.execute({
        symbolOrIsin: item.sym,
        tradeDate: '2026-09-14',
        eodClosePrice: 1000.0,
      });
      // In Security Master these are in excludedCandidateMappings, so they resolve to UNMAPPED_SECURITY
      assert.equal(res.status, 'UNMAPPED_SECURITY');
      assert.equal(res.composite, null);
    }
  });
});
