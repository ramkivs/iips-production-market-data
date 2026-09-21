/**
 * Tests for Portfolio Service (DEC-PORTFOLIO-IMPL-01 & DEC-PORTFOLIO-PROVENANCE-01)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  savePortfolio,
  getPortfolio,
  listPortfolios,
  deletePortfolio,
  validateAndResolveHoldings,
  evaluatePortfolioOverlay,
  PortfolioValidationError,
  resetPortfolioPersistence,
  resolvePortfoliosDataDir,
} from './portfolio-service';
import { PersistenceService } from '../persistence/persistence-service';

describe('Portfolio Service — Persistence, CRUD, and Multi-Tenant Isolation', () => {
  const testDataDir = path.join(process.cwd(), '.iips-data', 'test-portfolios');
  let store: PersistenceService;

  beforeEach(() => {
    resetPortfolioPersistence();
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    store = new PersistenceService({ dataDir: testDataDir });
  });

  it('creates and persists a user portfolio with normalized holdings', () => {
    const pf = savePortfolio(
      'tenant-alpha',
      'user-1',
      {
        name: 'Tech and Energy Overlay',
        holdings: [
          { symbol: 'TCS', weight: 60 },
          { symbol: 'RELIANCE', weight: 40 },
        ],
      },
      store,
    );

    expect(pf.name).toBe('Tech and Energy Overlay');
    expect(pf.holdings).toHaveLength(2);
    expect(pf.holdings[0].symbol).toBe('TCS');
    expect(pf.holdings[0].sector).toBe('Technology');
    expect(pf.holdings[0].weight).toBe(60);
    expect(pf.holdings[1].symbol).toBe('RELIANCE');
    expect(pf.holdings[1].sector).toBe('Energy');
    expect(pf.holdings[1].weight).toBe(40);

    const reloaded = getPortfolio('tenant-alpha', 'user-1', pf.portfolioId, store);
    expect(reloaded).toBeDefined();
    expect(reloaded?.name).toBe('Tech and Energy Overlay');
    expect(reloaded?.holdings).toHaveLength(2);
  });

  it('normalizes weights proportionally if they sum to something other than 100', () => {
    const holdings = validateAndResolveHoldings(
      [
        { symbol: 'TCS', weight: 3 },
        { symbol: 'INFY', weight: 1 },
      ],
      'tenant-alpha',
    );
    expect(holdings[0].weight).toBe(75); // 3/4 = 75%
    expect(holdings[1].weight).toBe(25); // 1/4 = 25%
  });

  it('rejects invalid or negative weights', () => {
    expect(() =>
      validateAndResolveHoldings([{ symbol: 'TCS', weight: -10 }], 'tenant-alpha'),
    ).toThrow(PortfolioValidationError);

    expect(() =>
      validateAndResolveHoldings([{ symbol: 'TCS', weight: 0 }], 'tenant-alpha'),
    ).toThrow(PortfolioValidationError);

    expect(() =>
      validateAndResolveHoldings([{ symbol: 'TCS', weight: 'invalid' as unknown as number }], 'tenant-alpha'),
    ).toThrow(PortfolioValidationError);
  });

  it('rejects empty holdings', () => {
    expect(() => validateAndResolveHoldings([], 'tenant-alpha')).toThrow(PortfolioValidationError);
  });

  it('enforces tenant isolation — Tenant A cannot read Tenant B portfolio', () => {
    const pf = savePortfolio(
      'tenant-A',
      'user-1',
      {
        name: 'Tenant A Portfolio',
        holdings: [{ symbol: 'TCS', weight: 100 }],
      },
      store,
    );

    // Tenant B cannot read Tenant A portfolio
    const readByB = getPortfolio('tenant-B', 'user-1', pf.portfolioId, store);
    expect(readByB).toBeUndefined();

    const listB = listPortfolios('tenant-B', 'user-1', store);
    expect(listB).toHaveLength(0);

    const listA = listPortfolios('tenant-A', 'user-1', store);
    expect(listA).toHaveLength(1);
    expect(listA[0].portfolioId).toBe(pf.portfolioId);
  });

  it('enforces owner isolation — User 1 cannot read User 2 private portfolio in same tenant', () => {
    const pf = savePortfolio(
      'tenant-A',
      'user-1',
      {
        name: 'User 1 Private Portfolio',
        holdings: [{ symbol: 'HDFCBANK', weight: 100 }],
      },
      store,
    );

    // User 2 in same tenant cannot read User 1 portfolio
    const readByUser2 = getPortfolio('tenant-A', 'user-2', pf.portfolioId, store);
    expect(readByUser2).toBeUndefined();

    const listUser2 = listPortfolios('tenant-A', 'user-2', store);
    expect(listUser2).toHaveLength(0);
  });

  it('updates portfolio holdings via append-only event fold', () => {
    const pf = savePortfolio(
      'tenant-alpha',
      'user-1',
      {
        portfolioId: 'pf-update-test',
        name: 'Initial Portfolio',
        holdings: [{ symbol: 'TCS', weight: 100 }],
      },
      store,
    );
    expect(pf.holdings).toHaveLength(1);

    const updated = savePortfolio(
      'tenant-alpha',
      'user-1',
      {
        portfolioId: 'pf-update-test',
        name: 'Updated Portfolio',
        holdings: [
          { symbol: 'TCS', weight: 50 },
          { symbol: 'INFY', weight: 50 },
        ],
      },
      store,
    );
    expect(updated.name).toBe('Updated Portfolio');
    expect(updated.holdings).toHaveLength(2);

    const reloaded = getPortfolio('tenant-alpha', 'user-1', 'pf-update-test', store);
    expect(reloaded?.holdings).toHaveLength(2);
  });

  it('deletes portfolio via append-only tombstone event', () => {
    const pf = savePortfolio(
      'tenant-alpha',
      'user-1',
      {
        portfolioId: 'pf-delete-test',
        name: 'To Delete',
        holdings: [{ symbol: 'LT', weight: 100 }],
      },
      store,
    );
    expect(getPortfolio('tenant-alpha', 'user-1', 'pf-delete-test', store)).toBeDefined();

    const deleted = deletePortfolio('tenant-alpha', 'user-1', 'pf-delete-test', store);
    expect(deleted).toBe(true);
    expect(getPortfolio('tenant-alpha', 'user-1', 'pf-delete-test', store)).toBeUndefined();

    // Subsequent delete returns false
    expect(deletePortfolio('tenant-alpha', 'user-1', 'pf-delete-test', store)).toBe(false);
  });
});

describe('Portfolio Overlay Analytics Evaluation', () => {
  const dummyPlatform = {
    engineOutputs: [
      { companyId: 'Technology-H1', sector: 'Technology', composite: 85, confidence: 0.9, qualityScore: 80, riskScore: 25, verdict: 'Buy' },
      { companyId: 'Banking-H1', sector: 'Banking', composite: 75, confidence: 0.85, qualityScore: 70, riskScore: 35, verdict: 'Buy' },
      { companyId: 'Energy-H1', sector: 'Energy', composite: 60, confidence: 0.7, qualityScore: 65, riskScore: 50, verdict: 'Hold' },
    ],
  };

  it('computes sector exposure, concentration, and diversification score', () => {
    const pf = {
      portfolioId: 'pf-eval-test',
      name: 'Evaluation Portfolio',
      createdAt: '2026-08-09T00:00:00.000Z',
      updatedAt: '2026-08-09T00:00:00.000Z',
      holdings: [
        { canonicalSecurityId: 'sec-tcs-in', symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'Technology', weight: 40 },
        { canonicalSecurityId: 'sec-infy-in', symbol: 'INFY', name: 'Infosys Limited', sector: 'Technology', weight: 20 },
        { canonicalSecurityId: 'sec-hdfcbank-in', symbol: 'HDFCBANK', name: 'HDFC Bank', sector: 'Banking', weight: 40 },
      ],
    };

    const res = evaluatePortfolioOverlay(pf, dummyPlatform);
    const p = res.portfolio as Record<string, unknown>;

    expect(p.holdings).toBe(3);
    const exposure = p.sectorExposure as Record<string, number>;
    expect(exposure.Technology).toBe(60); // 40 + 20
    expect(exposure.Banking).toBe(40);
    expect(p.concentration).toBe(60);

    // CSIP Formula: max(0, 100 - 60 + (3 - 1) * 3) = 100 - 60 + 6 = 46
    expect(p.diversificationScore).toBe(46);

    // Weighted averages:
    // avgConviction = 0.40 * 85 + 0.20 * 85 + 0.40 * 75 = 34 + 17 + 30 = 81
    expect(p.avgConviction).toBe(81);
    // avgQuality = 0.40 * 80 + 0.20 * 80 + 0.40 * 70 = 32 + 16 + 28 = 76
    expect(p.avgQuality).toBe(76);
    // avgRisk = 0.40 * 25 + 0.20 * 25 + 0.40 * 35 = 10 + 5 + 14 = 29
    expect(p.avgRisk).toBe(29);

    // Provenance verification
    const prov = res.provenance as Record<string, unknown>;
    expect(prov.dataSource).toBe('User Portfolio: Evaluation Portfolio — IIPS Intelligence Overlay');
    expect(prov.freshness).toBe('SNAPSHOT');
  });
});
