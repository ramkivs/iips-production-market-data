/**
 * IIPS — BI-03: focused unit tests for the broker holdings mapper contract.
 *
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03
 *
 * Covers the BI-03 mapper contract: exclusion rules, duplicate aggregation,
 * market-value weight derivation, exact 100.0% normalization (largest
 * remainder over tenths), identity preservation, and the fail-closed result
 * contract. P04/P12 preservation is asserted explicitly: the mapper never
 * emits canonicalSecurityId / figi / sector.
 */
import { describe, expect, it } from 'vitest';
import { adaptFinappHoldings } from './compatibility';
import { mapBrokerOutputToUserHoldings, type BrokerMappingResult } from './mapper';
import type { NormalizedBrokerHolding } from './types';

function holding(
  spec: Partial<Omit<NormalizedBrokerHolding, 'instrumentName'>> & { instrumentName: string },
): NormalizedBrokerHolding {
  return Object.freeze({
    broker: spec.broker ?? 'ZERODHA',
    instrumentName: spec.instrumentName,
    quantity: spec.quantity ?? 1,
    currentPrice: spec.currentPrice ?? 1,
    marketValue: spec.marketValue ?? 1,
    active: spec.active ?? true,
    ...(spec.symbol !== undefined ? { symbol: spec.symbol } : {}),
    ...(spec.isin !== undefined ? { isin: spec.isin } : {}),
  });
}

/** Exact tenths-of-a-percent sum of the mapped weights (integer-safe). */
function tenthsSum(result: BrokerMappingResult): number {
  if (!result.ok) throw new Error('expected a successful mapping');
  return result.holdings.reduce((sum, h) => sum + Math.round(h.weight * 10), 0);
}

describe('mapBrokerOutputToUserHoldings — fail-closed contract', () => {
  it('fails closed with EMPTY_INPUT on an empty batch', () => {
    const result = mapBrokerOutputToUserHoldings([]);
    expect(result).toEqual({ ok: false, code: 'EMPTY_INPUT', detail: expect.any(String) });
  });

  it('fails closed with NON_FINITE_VALUE when any holding carries NaN (whole batch rejected)', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'INFY', symbol: 'INFY', marketValue: 100 }),
      holding({ instrumentName: 'TCS', symbol: 'TCS', marketValue: Number.NaN }),
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('NON_FINITE_VALUE');
      expect(result.detail).toContain('holding[1]');
    }
  });

  it('fails closed with NON_FINITE_VALUE on Infinity price', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'RELIANCE', symbol: 'RELIANCE', currentPrice: Number.POSITIVE_INFINITY, marketValue: 50 }),
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('NON_FINITE_VALUE');
  });

  it('fails closed with UNIDENTIFIABLE_HOLDING when no symbol, ISIN or name is available', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: '  ' }),
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('UNIDENTIFIABLE_HOLDING');
  });

  it('fails closed with NO_CONSUMABLE_HOLDINGS when every holding is inactive', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'INFY', symbol: 'INFY', marketValue: 100, active: false }),
      holding({ instrumentName: 'TCS', symbol: 'TCS', marketValue: 50, active: false }),
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('NO_CONSUMABLE_HOLDINGS');
  });

  it('fails closed with NO_CONSUMABLE_HOLDINGS when every holding has non-positive value', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'INFY', symbol: 'INFY', marketValue: 0 }),
      holding({ instrumentName: 'TCS', symbol: 'TCS', marketValue: -25 }),
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('NO_CONSUMABLE_HOLDINGS');
  });

  it('fails closed with WEIGHT_BELOW_MINIMUM when a consumable holding rounds below 0.1%', () => {
    // 1 unit out of 100,000 → 0.01% → 0 tenths → unrepresentable at one decimal.
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'INFY', symbol: 'INFY', marketValue: 99999 }),
      holding({ instrumentName: 'SMALL', symbol: 'SMALL', marketValue: 1 }),
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('WEIGHT_BELOW_MINIMUM');
      expect(result.detail).toContain('SMALL');
    }
  });
});

describe('mapBrokerOutputToUserHoldings — weight derivation and normalization', () => {
  it('maps a single active holding to exactly weight 100.0', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'Infosys', symbol: 'INFY', marketValue: 75000, quantity: 100, currentPrice: 750 }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0].weight).toBe(100);
      expect(result.totalMarketValue).toBe(75000);
      expect(result.exclusions).toEqual([]);
    }
  });

  it('derives market-value weights (75 / 25)', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'Infosys', symbol: 'INFY', marketValue: 75000 }),
      holding({ instrumentName: 'Tata Consultancy Services', symbol: 'TCS', marketValue: 25000 }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holdings.map((h) => h.weight)).toEqual([75, 25]);
      expect(tenthsSum(result)).toBe(1000);
    }
  });

  it('normalizes three equal holdings to exactly 100.0 via largest remainder (33.4 / 33.3 / 33.3)', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'A', symbol: 'AAA', marketValue: 10000 }),
      holding({ instrumentName: 'B', symbol: 'BBB', marketValue: 10000 }),
      holding({ instrumentName: 'C', symbol: 'CCC', marketValue: 10000 }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holdings.map((h) => h.weight)).toEqual([33.4, 33.3, 33.3]);
      expect(tenthsSum(result)).toBe(1000);
    }
  });

  it('normalizes seven equal holdings to exactly 100.0 (six 14.3 + one 14.2)', () => {
    const result = mapBrokerOutputToUserHoldings([
      'A', 'B', 'C', 'D', 'E', 'F', 'G',
    ].map((s) => holding({ instrumentName: s, symbol: s.toUpperCase(), marketValue: 1 })));
    expect(result.ok).toBe(true);
    if (result.ok) {
      const weights = result.holdings.map((h) => h.weight);
      expect(weights.filter((w) => w === 14.3)).toHaveLength(6);
      expect(weights.filter((w) => w === 14.2)).toHaveLength(1);
      expect(tenthsSum(result)).toBe(1000);
    }
  });

  it('sums to exactly 100.0 tenths across a range of value profiles', () => {
    const profiles: number[][] = [
      [75000, 25000],
      [10000, 10000, 10000],
      [1, 1, 2],
      [33333, 33333, 33334],
      [99999, 101],
      // All holdings must stay at/above the 0.1% minimum (sub-minimum batches
      // are covered by the dedicated WEIGHT_BELOW_MINIMUM test above).
      [1234.56, 789.01, 45678.9, 120],
      [1, 1, 1, 1, 1, 1, 1],
    ];
    for (const values of profiles) {
      const result = mapBrokerOutputToUserHoldings(
        values.map((v, i) => holding({ instrumentName: `S${i}`, symbol: `S${i}`, marketValue: v })),
      );
      expect(result.ok, `profile ${values.join(',')} must map`).toBe(true);
      if (result.ok) expect(tenthsSum(result)).toBe(1000);
    }
  });

  it('orders the output deterministically by descending weight, then identity', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'Mid', symbol: 'MID', marketValue: 2000 }),
      holding({ instrumentName: 'Top', symbol: 'TOP', marketValue: 5000 }),
      holding({ instrumentName: 'Base', symbol: 'BAS', marketValue: 3000 }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holdings.map((h) => h.symbol)).toEqual(['TOP', 'BAS', 'MID']);
      expect(result.holdings.map((h) => h.weight)).toEqual([50, 30, 20]);
    }
  });
});

describe('mapBrokerOutputToUserHoldings — exclusion rules', () => {
  it('excludes inactive holdings and reports each exclusion', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'Infosys', symbol: 'INFY', marketValue: 10000 }),
      holding({ instrumentName: 'Closed One', symbol: 'CLSD', marketValue: 5000, active: false }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0].weight).toBe(100);
      expect(result.exclusions).toEqual([
        { index: 1, reason: 'INACTIVE', instrumentName: 'Closed One', symbol: 'CLSD' },
      ]);
    }
  });

  it('excludes zero and negative market values and reports each exclusion', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'Good', symbol: 'GOOD', marketValue: 3000 }),
      holding({ instrumentName: 'Flat', symbol: 'FLAT', marketValue: 0 }),
      holding({ instrumentName: 'Negative', symbol: 'NEG', marketValue: -100 }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holdings.map((h) => h.symbol)).toEqual(['GOOD']);
      expect(result.exclusions).toEqual([
        { index: 1, reason: 'NON_POSITIVE_MARKET_VALUE', instrumentName: 'Flat', symbol: 'FLAT' },
        { index: 2, reason: 'NON_POSITIVE_MARKET_VALUE', instrumentName: 'Negative', symbol: 'NEG' },
      ]);
    }
  });

  it('computes weights over consumable holdings only (exclusions do not contribute)', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'A', symbol: 'AAA', marketValue: 6000 }),
      holding({ instrumentName: 'B', symbol: 'BBB', marketValue: 4000, active: false }),
      holding({ instrumentName: 'C', symbol: 'CCC', marketValue: 0 }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holdings.map((h) => h.weight)).toEqual([100]);
      expect(result.totalMarketValue).toBe(6000);
    }
  });
});

describe('mapBrokerOutputToUserHoldings — duplicate aggregation', () => {
  it('aggregates duplicate lots by ISIN into one holding with summed value', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'Infosys', isin: 'INE009A01021', marketValue: 50000, quantity: 100 }),
      holding({ instrumentName: 'Infosys Ltd', isin: 'INE009A01021', marketValue: 30000, quantity: 60 }),
      holding({ instrumentName: 'TCS', symbol: 'TCS', marketValue: 20000 }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holdings).toHaveLength(2);
      const infy = result.holdings[0];
      expect(infy.isin).toBe('INE009A01021');
      expect(infy.weight).toBe(80);
      expect(result.holdings[1].weight).toBe(20);
      expect(result.totalMarketValue).toBe(100000);
    }
  });

  it('aggregates duplicates by symbol when no ISIN is present', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'Infy row 1', symbol: 'INFY', marketValue: 100 }),
      holding({ instrumentName: 'Infy row 2', symbol: 'INFY', marketValue: 300 }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0].symbol).toBe('INFY');
      expect(result.holdings[0].weight).toBe(100);
    }
  });

  it('aggregates duplicates by instrument name as the last-resort key (Dhan name-only exports)', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'Tata Consultancy Services', marketValue: 250 }),
      holding({ instrumentName: 'tata consultancy services', marketValue: 150 }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // UserHoldingInput carries no name field: name is an aggregation key only,
      // and the emitted input preserves identifier fields (symbol/isin) alone.
      expect(result.holdings).toHaveLength(1);
      expect(result.holdings[0].weight).toBe(100);
      expect(result.holdings[0].symbol).toBeUndefined();
      expect(result.holdings[0].isin).toBeUndefined();
    }
  });

  it('keeps distinct ISINs separate even when symbols match', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'Fund A', isin: 'INF846K01EW9', symbol: 'FUND', marketValue: 100 }),
      holding({ instrumentName: 'Fund B', isin: 'INF174O01E99', symbol: 'FUND', marketValue: 100 }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holdings).toHaveLength(2);
      expect(result.holdings.map((h) => h.weight)).toEqual([50, 50]);
    }
  });
});

describe('mapBrokerOutputToUserHoldings — identity preservation and P04/P12 governance', () => {
  it('preserves both symbol and ISIN when the export provides both', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'Infosys', symbol: 'INFY', isin: 'INE009A01021', marketValue: 100 }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holdings[0].symbol).toBe('INFY');
      expect(result.holdings[0].isin).toBe('INE009A01021');
    }
  });

  it('preserves ISIN-only identity (Groww stocks export shape)', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'Infosys', isin: 'INE009A01021', marketValue: 100 }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holdings[0].isin).toBe('INE009A01021');
      expect(result.holdings[0].symbol).toBeUndefined();
    }
  });

  it('never emits canonicalSecurityId, figi or sector (P04/P12 resolution stays server-governed)', () => {
    const result = mapBrokerOutputToUserHoldings([
      holding({ instrumentName: 'Infosys', symbol: 'INFY', isin: 'INE009A01021', marketValue: 70 }),
      holding({ instrumentName: 'HDFC Bank', symbol: 'HDFCBANK', marketValue: 30 }),
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const h of result.holdings) {
        expect(h.canonicalSecurityId).toBeUndefined();
        expect(h.figi).toBeUndefined();
        expect(h.sector).toBeUndefined();
      }
    }
  });
});

describe('mapBrokerOutputToUserHoldings — end-to-end compatibility boundary', () => {
  it('pipes FINAPP Holding[] projections through the boundary into UserHoldingInput[]', () => {
    const finappHoldings = [
      {
        instrumentName: 'Infosys',
        ticker: 'INFY',
        isin: undefined,
        quantity: 100,
        currentPrice: 750,
        currentValue: 75000,
        status: 'active',
        sourceFile: 'Zerodha_holdings.csv',
        importedAt: '2026-09-21T10:00:00.000Z',
      },
      {
        instrumentName: 'Tata Consultancy Services',
        ticker: 'TCS',
        isin: undefined,
        quantity: 50,
        currentPrice: 500,
        currentValue: 25000,
        status: 'active',
      },
      {
        instrumentName: 'Old Position',
        ticker: 'OLD',
        isin: undefined,
        quantity: 10,
        currentPrice: 0,
        currentValue: 0,
        status: 'closed_absent',
      },
    ];

    const normalized = adaptFinappHoldings(finappHoldings, 'ZERODHA');
    const result = mapBrokerOutputToUserHoldings(normalized);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.holdings.map((h) => h.symbol)).toEqual(['INFY', 'TCS']);
      expect(result.holdings.map((h) => h.weight)).toEqual([75, 25]);
      expect(result.totalMarketValue).toBe(100000);
      expect(result.exclusions).toHaveLength(1);
      expect(result.exclusions[0].reason).toBe('INACTIVE');
    }
  });
});
