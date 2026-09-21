/**
 * IIPS — BI-03: focused unit tests for the FINAPP → IIPS compatibility
 * boundary (adaptFinappHoldings).
 *
 * Sourced from ramkivs/finapp (WP-FB-IMPORT-BROKER-01)
 * Deposited under Governed Reuse Handoff (Commit b97b103)
 * Ported to IIPS under Program BI-02 / BI-03
 *
 * Boundary discipline under test: 1:1 mapping (no filtering, no aggregation,
 * no value recomputation), identifier hygiene (trim / drop empty), status →
 * active flag, importer-supplied broker classification, provenance carry-
 * through, and ledger-field exclusion.
 */
import { describe, expect, it } from 'vitest';
import { adaptFinappHoldings } from './compatibility';
import type { FinappHoldingProjection } from './types';

function projection(spec: Partial<FinappHoldingProjection> & { instrumentName: string }): FinappHoldingProjection {
  return {
    instrumentName: spec.instrumentName,
    quantity: spec.quantity ?? 1,
    currentPrice: spec.currentPrice ?? 1,
    currentValue: spec.currentValue ?? 1,
    status: spec.status ?? 'active',
    ...(spec.ticker !== undefined ? { ticker: spec.ticker } : {}),
    ...(spec.isin !== undefined ? { isin: spec.isin } : {}),
    ...(spec.sourceFile !== undefined ? { sourceFile: spec.sourceFile } : {}),
    ...(spec.importedAt !== undefined ? { importedAt: spec.importedAt } : {}),
  };
}

describe('adaptFinappHoldings — 1:1 boundary mapping', () => {
  it('maps every holding 1:1 without filtering (inactive and zero-value included)', () => {
    const out = adaptFinappHoldings(
      [
        projection({ instrumentName: 'A', ticker: 'AAA', currentValue: 100 }),
        projection({ instrumentName: 'B', ticker: 'BBB', currentValue: 0, status: 'closed_absent' }),
        projection({ instrumentName: 'C', ticker: 'CCC', currentValue: 50 }),
      ],
      'GROWW',
    );
    expect(out).toHaveLength(3);
  });

  it('maps Finapp status to the active flag', () => {
    const out = adaptFinappHoldings(
      [
        projection({ instrumentName: 'A', status: 'active' }),
        projection({ instrumentName: 'B', status: 'closed_absent' }),
      ],
      'DHAN',
    );
    expect(out[0].active).toBe(true);
    expect(out[1].active).toBe(false);
  });

  it('assigns the IIPS-supplied broker classification to every output', () => {
    const out = adaptFinappHoldings(
      [
        projection({ instrumentName: 'A' }),
        projection({ instrumentName: 'B' }),
      ],
      'ZERODHA',
    );
    expect(out.every((h) => h.broker === 'ZERODHA')).toBe(true);
  });

  it('trims identifiers and drops whitespace-only fields', () => {
    const out = adaptFinappHoldings(
      [projection({ instrumentName: '  Infosys  ', ticker: '  INFY  ', isin: '   ' })],
      'ZERODHA',
    );
    expect(out[0].instrumentName).toBe('Infosys');
    expect(out[0].symbol).toBe('INFY');
    expect(out[0].isin).toBeUndefined();
  });

  it('carries marketValue from the parser output without recomputation', () => {
    // Parser-reported currentValue wins — the boundary never recomputes.
    const out = adaptFinappHoldings(
      [projection({ instrumentName: 'A', quantity: 3, currentPrice: 10, currentValue: 31 })],
      'GROWW',
    );
    expect(out[0].marketValue).toBe(31);
  });

  it('carries provenance fields through and omits them when absent', () => {
    const out = adaptFinappHoldings(
      [
        projection({ instrumentName: 'A', sourceFile: 'export.csv', importedAt: '2026-09-21T00:00:00.000Z' }),
        projection({ instrumentName: 'B' }),
      ],
      'DHAN',
    );
    expect(out[0].sourceFile).toBe('export.csv');
    expect(out[0].importedAt).toBe('2026-09-21T00:00:00.000Z');
    expect(out[1].sourceFile).toBeUndefined();
    expect(out[1].importedAt).toBeUndefined();
  });

  it('returns an empty array for empty input and never throws', () => {
    expect(adaptFinappHoldings([], 'ZERODHA')).toEqual([]);
  });
});
