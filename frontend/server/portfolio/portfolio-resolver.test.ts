/**
 * Tests for Portfolio Resolver (DEC-PORTFOLIO-IDENTITY-01)
 */
import { describe, it, expect } from 'vitest';
import {
  resolveSecurity,
  PortfolioResolutionError,
  AUTHORIZED_SECTORS,
  GOVERNED_SECURITIES,
} from './portfolio-resolver';

describe('Portfolio Resolver — Governed Identity Resolution', () => {
  const tenantId = 'tenant-test-01';

  it('resolves by symbol to canonical security and authoritative sector', () => {
    const res = resolveSecurity({ symbol: 'TCS' }, tenantId);
    expect(res.canonicalSecurityId).toBe('sec-tcs-in');
    expect(res.symbol).toBe('TCS');
    expect(res.sector).toBe('Technology');
    expect(res.identifiers.FIGI).toBe('BBG000BD72Y4');
    expect(res.identifiers.ISIN).toBe('INE467B01029');
  });

  it('resolves by canonicalSecurityId', () => {
    const res = resolveSecurity({ canonicalSecurityId: 'sec-hdfcbank-in' }, tenantId);
    expect(res.symbol).toBe('HDFCBANK');
    expect(res.sector).toBe('Banking');
  });

  it('resolves by authoritative external identifier FIGI', () => {
    const res = resolveSecurity({ figi: 'BBG000BDC0Q5' }, tenantId);
    expect(res.symbol).toBe('RELIANCE');
    expect(res.sector).toBe('Energy');
  });

  it('resolves by interoperable ISIN', () => {
    const res = resolveSecurity({ isin: 'INE018A01030' }, tenantId);
    expect(res.symbol).toBe('LT');
    expect(res.sector).toBe('Industrials');
  });

  it('resolves governed sector proxy entities (${sector}-H1)', () => {
    const res = resolveSecurity({ symbol: 'Banking-H1' }, tenantId);
    expect(res.canonicalSecurityId).toBe('Banking-H1');
    expect(res.sector).toBe('Banking');
  });

  it('fails closed when security is unresolved', () => {
    expect(() => resolveSecurity({ symbol: 'NONEXISTENT_TICKER' }, tenantId)).toThrow(PortfolioResolutionError);
    try {
      resolveSecurity({ symbol: 'NONEXISTENT_TICKER' }, tenantId);
    } catch (e) {
      expect((e as PortfolioResolutionError).code).toBe('UNRESOLVED_SECURITY');
    }
  });

  it('fails closed on missing tenantId', () => {
    expect(() => resolveSecurity({ symbol: 'TCS' }, '')).toThrow(PortfolioResolutionError);
    try {
      resolveSecurity({ symbol: 'TCS' }, '');
    } catch (e) {
      expect((e as PortfolioResolutionError).code).toBe('MISSING_TENANT');
    }
  });

  it('fails closed on missing identifier', () => {
    expect(() => resolveSecurity({}, tenantId)).toThrow(PortfolioResolutionError);
    try {
      resolveSecurity({}, tenantId);
    } catch (e) {
      expect((e as PortfolioResolutionError).code).toBe('MISSING_IDENTIFIER');
    }
  });

  it('fails closed on conflicting/ambiguous identifiers (symbol and canonicalSecurityId mismatch)', () => {
    expect(() =>
      resolveSecurity({ canonicalSecurityId: 'sec-tcs-in', symbol: 'INFY' }, tenantId),
    ).toThrow(PortfolioResolutionError);
    try {
      resolveSecurity({ canonicalSecurityId: 'sec-tcs-in', symbol: 'INFY' }, tenantId);
    } catch (e) {
      expect((e as PortfolioResolutionError).code).toBe('AMBIGUOUS_SECURITY');
    }
  });

  it('fails closed when user-supplied sector mismatches authoritative sector', () => {
    expect(() =>
      resolveSecurity({ symbol: 'TCS', sector: 'Banking' }, tenantId),
    ).toThrow(PortfolioResolutionError);
    try {
      resolveSecurity({ symbol: 'TCS', sector: 'Banking' }, tenantId);
    } catch (e) {
      expect((e as PortfolioResolutionError).code).toBe('SECTOR_MISMATCH');
    }
  });

  it('accepts correct user-supplied sector matching authoritative sector', () => {
    const res = resolveSecurity({ symbol: 'TCS', sector: 'Technology' }, tenantId);
    expect(res.sector).toBe('Technology');
  });

  it('guarantees that all governed securities belong to authorized 13 sectors', () => {
    for (const sec of GOVERNED_SECURITIES) {
      expect(AUTHORIZED_SECTORS).toContain(sec.sector);
    }
  });
});
