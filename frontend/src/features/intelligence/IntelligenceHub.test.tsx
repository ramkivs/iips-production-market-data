/**
 * Program v3.0 — N+15: Intelligence Hub tests (governed intelligence directory).
 *
 * Verifies: /intelligence renders IntelligenceHub instead of the FeaturePlaceholder; directory
 * data sourced ONLY from mocked /api/decision-matrix; no hardcoded sector universe; exact
 * company + workspace links; verdict/composite/quality/valuation from the payload; null axes
 * render unavailable; future surfaces marked honestly (text, no links); governed ErrorState;
 * and the future intelligence children remain placeholders.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { IntelligenceHub } from './IntelligenceHub';
import { App } from '../../app/App';
import { SessionProvider } from '../../core/session/SessionContext';
import type { DecisionMatrixData } from '../../api/decisionMatrix';

const PROVENANCE = {
  dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1',
} as const;

const DIRECTORY: DecisionMatrixData = {
  matrixType: 'scatter',
  note: 'presentational scatter; no classification computed',
  companies: [
    { companyId: 'Banking-H1', sector: 'Banking', verdict: 'Watch', composite: 47.1, quality: 40, valuation: 50 },
    { companyId: 'Technology-H1', sector: 'Technology', verdict: 'Buy', composite: 76.3, quality: 85, valuation: 60 },
    { companyId: 'Energy-H1', sector: 'Energy', verdict: 'Hold', composite: 55, quality: null, valuation: null },
  ],
  universe: { avgConviction: 60, avgQuality: 57, holdings: 3 },
  provenance: PROVENANCE,
};

function urlAwareMock(payload: DecisionMatrixData = DIRECTORY, opts: { fails?: boolean } = {}): ReturnType<typeof vi.fn> {
  return vi.fn((input: unknown) => {
    const url = String(input);
    if (url.includes('/api/decision-matrix')) {
      if (opts.fails) return Promise.reject(new Error('directory down')) as never;
      return Promise.resolve({ ok: true, json: async () => payload }) as never;
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
  });
}

function renderHub() {
  return render(
    <MemoryRouter initialEntries={['/intelligence']}>
      <Routes>
        <Route path="/intelligence" element={<IntelligenceHub />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => { globalThis.fetch = vi.fn() as never; });

describe('Intelligence Hub — governed intelligence directory', () => {
  it('renders directory data sourced from /api/decision-matrix (row count == payload count)', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    expect(await screen.findByText('Banking')).toBeInTheDocument();
    expect(screen.getByTestId('data-table').querySelectorAll('tbody tr')).toHaveLength(3);
  });

  it('does NOT hardcode sectors (custom payload sectors appear; Banking/Technology absent)', async () => {
    const custom: DecisionMatrixData = {
      matrixType: 'scatter', note: 'test',
      companies: [
        { companyId: 'X-H1', sector: 'Alpha', verdict: 'Buy', composite: 60, quality: 55, valuation: 50 },
        { companyId: 'Y-H1', sector: 'Beta', verdict: 'Hold', composite: 40, quality: 45, valuation: 55 },
      ],
      universe: { avgConviction: 50, avgQuality: 50, holdings: 2 },
      provenance: PROVENANCE,
    };
    globalThis.fetch = urlAwareMock(custom);
    renderHub();
    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Banking')).not.toBeInTheDocument();
    expect(screen.queryByText('Technology')).not.toBeInTheDocument();
  });

  it('renders the universe summary from the governed payload', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    await screen.findByText('Banking');
    expect(screen.getByText('Intelligence Universe')).toBeInTheDocument();
    const universeGroup = screen.getByTestId('metric-group');
    expect(within(universeGroup).getByText('3')).toBeInTheDocument(); // holdings
    expect(within(universeGroup).getByText('60')).toBeInTheDocument(); // avg conviction
    expect(within(universeGroup).getByText('57')).toBeInTheDocument(); // avg quality
  });

  it('links each company row to /research/company/:sector derived from the payload', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    await screen.findByText('Banking');
    const companyLinks = screen.getAllByRole('link', { name: /^(Banking|Technology|Energy)$/ });
    expect(companyLinks.map((l) => l.getAttribute('href'))).toEqual([
      '/research/company/Banking',
      '/research/company/Technology',
      '/research/company/Energy',
    ]);
  });

  it('renders primary workspace links (Decision Matrix + Cross-Sector)', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    await screen.findByText('Banking');
    expect(screen.getByRole('link', { name: 'Decision Matrix' })).toHaveAttribute('href', '/intelligence/decision-matrix');
    expect(screen.getByRole('link', { name: 'Cross-Sector Intelligence' })).toHaveAttribute('href', '/research/cross-sector');
  });

  it('renders verdict and composite from the governed payload', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    await screen.findByText('Banking');
    expect(screen.getByTestId('decision-badge-Buy')).toHaveTextContent('Buy');
    expect(screen.getByTestId('decision-badge-Watch')).toHaveTextContent('Watch');
    expect(screen.getByText('76.3')).toBeInTheDocument();
    expect(screen.getByText('47.1')).toBeInTheDocument();
  });

  it('renders quality and valuation from the governed payload', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    await screen.findByText('Banking');
    const table = screen.getByTestId('data-table');
    expect(within(table).getByText('85')).toBeInTheDocument(); // Technology quality
    expect(within(table).getByText('60')).toBeInTheDocument(); // Technology valuation
  });

  it('renders unavailable-safe state for null quality and null valuation (no zero, no fabrication)', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    await screen.findByText('Energy');
    expect(screen.getAllByText('unavailable').length).toBe(2);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('marks future intelligence surfaces honestly (text only, no fabricated links)', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    await screen.findByText('Banking');
    expect(screen.getByTestId('intelligence-future')).toHaveTextContent('Opportunities · Risks · Rankings');
    expect(screen.queryByRole('link', { name: /Opportunities/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Risks/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Rankings/ })).not.toBeInTheDocument();
  });

  it('renders the governed ErrorState when /api/decision-matrix fails', async () => {
    globalThis.fetch = urlAwareMock(DIRECTORY, { fails: true });
    renderHub();
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load intelligence directory');
  });
});

describe('Intelligence Hub — route integration', () => {
  it('/intelligence renders IntelligenceHub instead of the FeaturePlaceholder', async () => {
    globalThis.fetch = urlAwareMock();
    render(
      <MemoryRouter initialEntries={['/intelligence']}>
        <SessionProvider session={{ userId: 'u1', tenantId: 'tenant-A', role: 'analyst', authenticated: true }}>
          <App />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Intelligence' })).toBeInTheDocument();
    expect(screen.queryByTestId('shell-not-authorized')).not.toBeInTheDocument();
  });

  it('future intelligence children (/intelligence/opportunities) remain placeholders', async () => {
    globalThis.fetch = urlAwareMock();
    render(
      <MemoryRouter initialEntries={['/intelligence/opportunities']}>
        <SessionProvider session={{ userId: 'u1', tenantId: 'tenant-A', role: 'analyst', authenticated: true }}>
          <App />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByTestId('shell-not-authorized')).toBeInTheDocument();
  });
});
