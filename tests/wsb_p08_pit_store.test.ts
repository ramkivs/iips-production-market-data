/**
 * Institutional Investment Platform System (IIPS)
 * Workstream WS-B Test Suite: P08 Point-in-Time Store & Corporate Actions
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

import {
  PointInTimeStore,
  calculateSplitFactor,
  calculateBonusFactor,
  calculateDividendFactor,
  adjustHistoricalPrice,
  adjustHistoricalVolume,
  computeCumulativeFactor,
  createCanonicalEnvelope,
  computeLineageHash,
  CorporateActionPayload,
} from '../src/index.js';

describe('WS-B / P08 Point-in-Time Store & Corporate Actions', () => {
  it('P08-01: should calculate corporate action adjustment factors for Split, Bonus, Dividend', () => {
    // 1:5 Split (1 old share -> 5 new shares) -> Factor 0.2
    assert.strictEqual(calculateSplitFactor(1, 5), 0.2);

    // 1:1 Bonus (1 bonus for 1 existing) -> Factor 0.5
    assert.strictEqual(calculateBonusFactor(1, 1), 0.5);

    // Cash Dividend: Price 500, Dividend 10 -> Factor (500-10)/500 = 0.98
    assert.strictEqual(calculateDividendFactor(500, 10), 0.98);

    // Adjusting Price: Unadjusted 1000 with 0.5 factor -> 500
    assert.strictEqual(adjustHistoricalPrice(1000, 0.5), 500);

    // Adjusting Volume: Unadjusted 100 with 0.5 factor -> 200
    assert.strictEqual(adjustHistoricalVolume(100, 0.5), 200);
  });

  it('P08-02: should compound multiple corporate actions chronologically', () => {
    const actions: CorporateActionPayload[] = [
      {
        companyId: 'INFY',
        actionId: 'CA-1',
        actionType: 'BONUS',
        status: 'EFFECTIVE',
        exDate: '2020-01-01T00:00:00.000Z',
        recordDate: '2020-01-02T00:00:00.000Z',
        adjustmentFactor: 0.5,
      },
      {
        companyId: 'INFY',
        actionId: 'CA-2',
        actionType: 'SPLIT',
        status: 'EFFECTIVE',
        exDate: '2022-01-01T00:00:00.000Z',
        recordDate: '2022-01-02T00:00:00.000Z',
        adjustmentFactor: 0.5,
      },
    ];

    // As of 2019 (before both) -> Cumulative Factor 1.0
    assert.strictEqual(computeCumulativeFactor(actions, '2019-06-01T00:00:00.000Z'), 1.0);
    // As of 2021 (after bonus, before split) -> Factor 0.5
    assert.strictEqual(computeCumulativeFactor(actions, '2021-06-01T00:00:00.000Z'), 0.5);
    // As of 2023 (after both) -> Factor 0.5 * 0.5 = 0.25
    assert.strictEqual(computeCumulativeFactor(actions, '2023-06-01T00:00:00.000Z'), 0.25);
  });

  it('P08-03: PointInTimeStore should guarantee strict point-in-time invariant without future leakage', () => {
    const store = new PointInTimeStore();

    // Create 3 historical snapshots for INFY
    const dates = [
      '2026-09-01T10:00:00.000Z',
      '2026-09-10T10:00:00.000Z',
      '2026-09-18T10:00:00.000Z',
    ];

    dates.forEach((d, idx) => {
      const payload = { ltp: 1500 + idx * 10 };
      const env = createCanonicalEnvelope({
        envelopeId: `env-pit-${idx}`,
        domain: 'D01_QUOTES',
        mode: 'PIT',
        companyId: 'INFY',
        payload,
        provenance: {
          sourceClassification: 'CANONICAL_MARKET_DATA',
          vendorTier: 'MOCK_FIXTURE',
          asOf: d,
          receivedAt: d,
          evaluatedAt: d,
          dataVersion: `v${idx}`,
          lineageHash: computeLineageHash(payload, {
            sourceClassification: 'CANONICAL_MARKET_DATA',
            asOf: d,
            dataVersion: `v${idx}`,
          }),
          qualityState: 'GOOD',
        },
      });
      store.append(env);
    });

    // Query asOf 2026-09-05 (between date 0 and date 1) -> Must return snapshot 0 (ltp 1500)
    const q1 = store.queryAsOf({
      companyId: 'INFY',
      domain: 'D01_QUOTES',
      asOf: '2026-09-05T00:00:00.000Z',
    });
    assert.ok(q1);
    assert.strictEqual((q1.payload as { ltp: number }).ltp, 1500);

    // Query asOf 2026-09-15 (between date 1 and date 2) -> Must return snapshot 1 (ltp 1510)
    const q2 = store.queryAsOf({
      companyId: 'INFY',
      domain: 'D01_QUOTES',
      asOf: '2026-09-15T00:00:00.000Z',
    });
    assert.ok(q2);
    assert.strictEqual((q2.payload as { ltp: number }).ltp, 1510);

    // Query asOf 2026-08-01 (before all records) -> Returns undefined
    const q0 = store.queryAsOf({
      companyId: 'INFY',
      domain: 'D01_QUOTES',
      asOf: '2026-08-01T00:00:00.000Z',
    });
    assert.strictEqual(q0, undefined);
  });
});
