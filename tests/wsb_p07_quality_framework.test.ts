/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-B Test Suite: P07 Data Quality, Anomaly Detection & Rollup
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

import {
  AnomalyDetector,
  evaluateFreshness,
  rollupQuality,
  combineQualityWithFreshness,
  QualityState,
} from '../src/index.js';

describe('WS-B / P07 Data Quality Framework & Anomaly Rules', () => {
  it('P07-01: should detect all 12 anomaly categories', () => {
    const detector = new AnomalyDetector();

    // 1. MISSING_MANDATORY_FIELD
    assert.ok(detector.evaluatePayload({}, { expectedDomain: 'D01_QUOTES' }).categories.includes('MISSING_MANDATORY_FIELD'));

    // 2. OUT_OF_RANGE_VALUE
    assert.ok(detector.evaluatePayload({ price: NaN }, { expectedDomain: 'D01_QUOTES' }).categories.includes('OUT_OF_RANGE_VALUE'));

    // 4. OUT_OF_ORDER_SEQUENCE
    const ooo = detector.evaluatePayload({ ltp: 100 }, {
      expectedDomain: 'D01_QUOTES',
      previousTimestamp: '2026-09-18T10:00:00.000Z',
      currentTimestamp: '2026-09-18T09:55:00.000Z',
    });
    assert.ok(ooo.categories.includes('OUT_OF_ORDER_SEQUENCE'));

    // 6. NAMESPACE_COLLISION_OR_VIOLATION
    const nsViolation = detector.evaluatePayload({ 'RAW_VENDOR_PRICE': 1500 }, { expectedDomain: 'D01_QUOTES' });
    assert.ok(nsViolation.categories.includes('NAMESPACE_COLLISION_OR_VIOLATION'));

    // 7. IDENTITY_AMBIGUITY
    assert.ok(detector.evaluatePayload({ symbol: 'INFY' }, { expectedDomain: 'D01_QUOTES' }).categories.includes('IDENTITY_AMBIGUITY'));

    // 8. CONTRADICTORY_CROSS_FIELD
    assert.ok(detector.evaluatePayload({ high: 100, low: 150 }, { expectedDomain: 'D01_QUOTES' }).categories.includes('CONTRADICTORY_CROSS_FIELD'));

    // 9. CORPORATE_ACTION_UNADJUSTED_SPIKE
    const spike = detector.evaluatePayload({ ltp: 200 }, {
      expectedDomain: 'D01_QUOTES',
      previousClose: 100,
      currentPrice: 200,
      isCorporateActionAdjusted: false,
    });
    assert.ok(spike.categories.includes('CORPORATE_ACTION_UNADJUSTED_SPIKE'));

    // 10. UNRECOGNIZED_ENUM_OR_CODE
    assert.ok(detector.evaluatePayload({ exchange: 'NASDAQ' }, { expectedDomain: 'D01_QUOTES' }).categories.includes('UNRECOGNIZED_ENUM_OR_CODE'));

    // 11. CURRENCY_MISMATCH
    assert.ok(detector.evaluatePayload({ currency: 'EUR' }, { expectedDomain: 'D01_QUOTES' }).categories.includes('CURRENCY_MISMATCH'));

    // 12. UNAUTHORIZED_SOURCE_LEAK
    assert.ok(detector.evaluatePayload({ vendorNote: 'data from Bloomberg L.P.' }, { expectedDomain: 'D01_QUOTES' }).categories.includes('UNAUTHORIZED_SOURCE_LEAK'));
  });

  it('P07-02: should evaluate freshness and enforce AD-12 stale concession band', () => {
    const baseTime = '2026-09-18T10:00:00.000Z'; // D01 nominal threshold is 15 min (900s)

    // Scenario 1: 5 minutes old (300s <= 900s) -> GOOD
    const evalGood = evaluateFreshness('2026-09-18T09:55:00.000Z', 'D01_QUOTES', baseTime);
    assert.strictEqual(evalGood.quality, 'GOOD');
    assert.strictEqual(evalGood.staleConcessionActive, false);
    assert.strictEqual(evalGood.suppressExecution, false);

    // Scenario 2: 20 minutes old (1200s, between 900s and 1800s) -> STALE (AD-12 Concession Active)
    const evalStale = evaluateFreshness('2026-09-18T09:40:00.000Z', 'D01_QUOTES', baseTime);
    assert.strictEqual(evalStale.quality, 'STALE');
    assert.strictEqual(evalStale.staleConcessionActive, true);
    assert.strictEqual(evalStale.suppressExecution, false);

    // Scenario 3: 40 minutes old (2400s > 1800s) -> UNAVAILABLE (Suppressed from execution)
    const evalUnavail = evaluateFreshness('2026-09-18T09:20:00.000Z', 'D01_QUOTES', baseTime);
    assert.strictEqual(evalUnavail.quality, 'UNAVAILABLE');
    assert.strictEqual(evalUnavail.staleConcessionActive, false);
    assert.strictEqual(evalUnavail.suppressExecution, true);
  });

  it('P07-03: should strictly calculate worst-case quality floor without silent upgrades', () => {
    // GOOD + GOOD = GOOD
    assert.strictEqual(rollupQuality(['GOOD', 'GOOD']), 'GOOD');
    // GOOD + STALE = STALE
    assert.strictEqual(rollupQuality(['GOOD', 'STALE']), 'STALE');
    // STALE + PARTIAL = PARTIAL
    assert.strictEqual(rollupQuality(['STALE', 'PARTIAL']), 'PARTIAL');
    // GOOD + UNAVAILABLE = UNAVAILABLE
    assert.strictEqual(rollupQuality(['GOOD', 'PARTIAL', 'UNAVAILABLE']), 'UNAVAILABLE');
    // Empty = UNAVAILABLE
    assert.strictEqual(rollupQuality([]), 'UNAVAILABLE');

    // Combination with freshness
    assert.strictEqual(combineQualityWithFreshness('GOOD', 'STALE'), 'STALE');
    assert.strictEqual(combineQualityWithFreshness('PARTIAL', 'GOOD'), 'PARTIAL');
  });
});
