/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-B Test Suite: P06 Normalization Precision & Transforms
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  paisaToInr,
  inrToPaisa,
  normalizeShareQuantity,
  normalizeFinancialAmount,
  normalizeToUtcIso,
  isStrictUtcIso,
  CurrencyNormalizer,
} from '../src/index.js';

describe('WS-B / P06 Normalization Precision & Formats', () => {
  it('P06-01: should convert Paisa to INR and back without floating point drift', () => {
    assert.strictEqual(paisaToInr(152035), 1520.35);
    assert.strictEqual(paisaToInr(100n), 1.0);
    assert.strictEqual(paisaToInr(5n), 0.05);
    assert.strictEqual(paisaToInr(123456789n), 1234567.89);

    assert.strictEqual(inrToPaisa(1520.35), 152035);
    assert.strictEqual(inrToPaisa(0.05), 5);
  });

  it('P06-02: should normalize financial units (Lakhs, Crores, Millions) accurately', () => {
    // 5 Crores INR = 50,000,000 INR
    assert.strictEqual(normalizeFinancialAmount(5, 'CRORES'), 50000000);
    // 2.5 Lakhs INR = 250,000 INR
    assert.strictEqual(normalizeFinancialAmount(2.5, 'LAKHS'), 250000);
    // 10 Millions INR = 10,000,000 INR
    assert.strictEqual(normalizeFinancialAmount(10, 'MILLIONS'), 10000000);
  });

  it('P06-03: should normalize share quantities to non-negative integers', () => {
    assert.strictEqual(normalizeShareQuantity(1500.8), 1500);
    assert.strictEqual(normalizeShareQuantity(0), 0);
    assert.throws(() => normalizeShareQuantity(-10));
  });

  it('P06-04: should normalize various date representations to strict UTC ISO-8601', () => {
    // Epoch timestamp
    const epochSec = 1726653600; // 2024-09-18T10:00:00.000Z
    const isoFromEpoch = normalizeToUtcIso(epochSec);
    assert.strictEqual(isStrictUtcIso(isoFromEpoch), true);

    // Indian DD/MM/YYYY date
    const ddmmyyyy = '18/09/2026';
    const isoFromIndian = normalizeToUtcIso(ddmmyyyy);
    assert.strictEqual(isoFromIndian, '2026-09-18T00:00:00.000Z');

    // Strict validation
    assert.strictEqual(isStrictUtcIso('2026-09-18T10:00:00.000Z'), true);
    assert.strictEqual(isStrictUtcIso('2026-09-18 10:00:00'), false);
  });

  it('P06-05: should normalize foreign currency to base INR', () => {
    const currNorm = new CurrencyNormalizer();
    assert.strictEqual(currNorm.convertToBaseCurrency(1000, 'INR'), 1000);
    // 100 USD at rate 83.50 = 8350 INR
    assert.strictEqual(currNorm.convertToBaseCurrency(100, 'USD'), 8350);
  });
});
