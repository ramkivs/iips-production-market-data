/**
 * Tests for Portfolio Intelligence Overlay UI (DEC-PORTFOLIO-PROVENANCE-01 & DEC-PORTFOLIO-IMPL-01)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PortfolioWorkspace } from './PortfolioWorkspace';
import type { PortfolioSnapshotData } from '../../api/portfolio';

const CERTIFIED_FIXTURE: PortfolioSnapshotData = {
  portfolio: {
    portfolioId: 'PF-REAL',
    scenario: 'Balanced',
    holdings: 2,
    sectorExposure: { Technology: 60, Banking: 40 },
    concentration: 60,
    diversificationScore: 46,
    avgConviction: 75,
    avgQuality: 70,
    avgRisk: 30,
  },
  diversification: { band: 'Moderate', flags: ['diversified'] },
  allocation: { strategy: 'Balanced', recommendation: 'Maintain diversification', rulesApplied: ['rules'] },
  holdings: [
    { companyId: 'Technology-H1', sector: 'Technology', decision: 'Buy', composite: 80, confidence: 0.8, quality: 75, risk: 30, weight: 60 },
    { companyId: 'Banking-H1', sector: 'Banking', decision: 'Hold', composite: 70, confidence: 0.7, quality: 65, risk: 30, weight: 40 },
  ],
  opportunity: [{ companyId: 'Technology-H1', sector: 'Technology', conviction: 80 }],
  correlation: { flags: ['low correlation'], concentrationSectors: [] },
  evidenceRefs: [{ evidenceId: 'ev_tech', engineId: 'sector.technology', recommendation: 'Buy', compositeScore: 80 }],
  provenance: {
    dataSource: 'certified v2.0 platform (frozen sector engines + CSIP) over frozen v1.1 Replay Baseline inputs',
    freshness: 'SNAPSHOT',
    calibratedAt: '2026-08-09T00:00:00.000Z',
    transportSemantics: '1:1 mapping; transport transformation != decision transformation',
  },
};

const USER_OVERLAY_FIXTURE: PortfolioSnapshotData = {
  ...CERTIFIED_FIXTURE,
  portfolio: {
    ...CERTIFIED_FIXTURE.portfolio,
    portfolioId: 'pf-user-alpha',
    name: 'Alpha Growth Overlay',
  },
  provenance: {
    dataSource: 'User Portfolio: Alpha Growth Overlay — IIPS Intelligence Overlay',
    freshness: 'SNAPSHOT',
    calibratedAt: '2026-08-09T00:00:00.000Z',
    transportSemantics: '1:1 mapping; transport transformation != decision transformation',
  },
};

beforeEach(() => {
  globalThis.fetch = vi.fn((input: unknown) => {
    const url = String(input);
    if (url.includes('/api/portfolio?list=true')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          portfolios: [{ portfolioId: 'pf-user-alpha', name: 'Alpha Growth Overlay', createdAt: '2026-08-09T00:00:00.000Z', updatedAt: '2026-08-09T00:00:00.000Z', holdings: [] }],
        }),
      }) as never;
    }
    if (url.includes('/api/portfolio?portfolioId=pf-user-alpha')) {
      return Promise.resolve({ ok: true, json: async () => USER_OVERLAY_FIXTURE }) as never;
    }
    if (url.includes('/api/portfolio')) {
      return Promise.resolve({ ok: true, json: async () => CERTIFIED_FIXTURE }) as never;
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
  }) as never;
});

describe('Portfolio Overlay — Provenance & Badge Boundary (DEC-PORTFOLIO-PROVENANCE-01)', () => {
  it('renders CertifiedBadge for certified reference portfolio and NOT PlatformBadge', async () => {
    render(<PortfolioWorkspace />);
    expect(await screen.findByTestId('badge-certified')).toBeInTheDocument();
    expect(screen.getByTestId('badge-certified')).toHaveTextContent('CERTIFIED RESULT');
    expect(screen.queryByTestId('badge-platform')).not.toBeInTheDocument();
    expect(screen.getByText(/certified v2\.0 platform/)).toBeInTheDocument();
  });

  it('renders PlatformBadge for User Intelligence Overlay and NEVER CertifiedBadge', async () => {
    const user = userEvent.setup();
    render(<PortfolioWorkspace />);
    await screen.findByTestId('portfolio-selector');

    // Switch to User Intelligence Overlay
    await user.selectOptions(screen.getByTestId('portfolio-selector'), 'pf-user-alpha');

    // Wait for overlay to load
    await waitFor(() => {
      expect(screen.getByTestId('badge-platform')).toBeInTheDocument();
    });

    expect(screen.getByTestId('badge-platform')).toHaveTextContent('PLATFORM');
    // CertifiedBadge MUST NOT be rendered for user overlay
    expect(screen.queryByTestId('badge-certified')).not.toBeInTheDocument();
    expect(screen.getByText('User Portfolio: Alpha Growth Overlay — IIPS Intelligence Overlay')).toBeInTheDocument();
    expect(screen.getByTestId('freshness-snapshot')).toHaveTextContent('SNAPSHOT');
  });

  it('provides import affordance to submit user holdings and evaluate overlay', async () => {
    const user = userEvent.setup();
    let postBody: Record<string, unknown> | null = null;

    globalThis.fetch = vi.fn((input: unknown, init?: RequestInit) => {
      const url = String(input);
      if (url === '/api/portfolio' && init?.method === 'POST') {
        postBody = JSON.parse(init.body as string);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...USER_OVERLAY_FIXTURE,
            savedPortfolioId: 'pf-newly-created',
            portfolio: { ...USER_OVERLAY_FIXTURE.portfolio, name: 'Imported Overlay' },
            provenance: {
              ...USER_OVERLAY_FIXTURE.provenance,
              dataSource: 'User Portfolio: Imported Overlay — IIPS Intelligence Overlay',
            },
          }),
        }) as never;
      }
      if (url.includes('/api/portfolio?portfolioId=pf-newly-created')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...USER_OVERLAY_FIXTURE,
            portfolio: { ...USER_OVERLAY_FIXTURE.portfolio, name: 'Imported Overlay' },
            provenance: {
              ...USER_OVERLAY_FIXTURE.provenance,
              dataSource: 'User Portfolio: Imported Overlay — IIPS Intelligence Overlay',
            },
          }),
        }) as never;
      }
      if (url.includes('/api/portfolio?list=true')) {
        return Promise.resolve({ ok: true, json: async () => ({ portfolios: [] }) }) as never;
      }
      if (url.includes('/api/portfolio')) {
        return Promise.resolve({ ok: true, json: async () => CERTIFIED_FIXTURE }) as never;
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
    }) as never;

    render(<PortfolioWorkspace />);
    await screen.findByTestId('btn-import-portfolio');

    // Open import form
    await user.click(screen.getByTestId('btn-import-portfolio'));
    expect(screen.getByTestId('portfolio-import-form')).toBeInTheDocument();

    // Fill form
    await user.type(screen.getByTestId('input-portfolio-name'), 'Imported Overlay');
    await user.type(screen.getByTestId('input-portfolio-holdings'), 'TCS: 60\nINFY: 40');

    // Submit
    await user.click(screen.getByTestId('btn-save-portfolio'));

    await waitFor(() => {
      expect(postBody).not.toBeNull();
    });

    expect(postBody).toEqual({
      name: 'Imported Overlay',
      holdings: [
        { symbol: 'TCS', weight: 60 },
        { symbol: 'INFY', weight: 40 },
      ],
    });

    // Form closes and newly evaluated overlay displays with PlatformBadge
    await waitFor(() => {
      expect(screen.getByTestId('badge-platform')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('badge-certified')).not.toBeInTheDocument();
  });
});
