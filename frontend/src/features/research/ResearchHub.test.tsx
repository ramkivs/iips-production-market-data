/**
 * Program v3.0 — N+13: Research Hub tests (governed company directory).
 *
 * Verifies: directory data sourced ONLY from mocked /api/decision-matrix; no hardcoded sector
 * list; rows link exactly to /research/company/:sector; verdict/composite/quality/valuation
 * render from the governed payload; null quality/valuation render the unavailable-safe state;
 * error state; and the /research route renders ResearchHub instead of the FeaturePlaceholder.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ResearchHub } from './ResearchHub';
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
    <MemoryRouter initialEntries={['/research']}>
      <Routes>
        <Route path="/research" element={<ResearchHub />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => { globalThis.fetch = vi.fn() as never; });

describe('Research Hub — governed company directory', () => {
  it('renders directory data sourced from /api/decision-matrix (row count == payload count)', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    expect(await screen.findByText('Banking')).toBeInTheDocument();
    expect(screen.getAllByTestId('data-table').length).toBe(1);
    // 3 payload companies → 3 table rows.
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

  it('links every row to the exact /research/company/:sector derived from the payload', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    await screen.findByText('Banking');
    expect(screen.getByRole('link', { name: 'Banking' })).toHaveAttribute('href', '/research/company/Banking');
    expect(screen.getByRole('link', { name: 'Technology' })).toHaveAttribute('href', '/research/company/Technology');
    expect(screen.getByRole('link', { name: 'Energy' })).toHaveAttribute('href', '/research/company/Energy');
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
    expect(screen.getByText('85')).toBeInTheDocument(); // Technology quality
    expect(screen.getByText('60')).toBeInTheDocument(); // Technology valuation
  });

  it('renders the unavailable-safe state for null quality and null valuation (no zero, no fabrication)', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    await screen.findByText('Energy');
    // Energy has null quality + null valuation → both render "unavailable" (never 0).
    expect(screen.getAllByText('unavailable').length).toBe(2);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders the governed ErrorState when /api/decision-matrix fails', async () => {
    globalThis.fetch = urlAwareMock(DIRECTORY, { fails: true });
    renderHub();
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load research directory');
  });
});

describe('Research Hub — route integration', () => {
  it('/research renders ResearchHub instead of the FeaturePlaceholder', async () => {
    globalThis.fetch = urlAwareMock();
    render(
      <MemoryRouter initialEntries={['/research']}>
        <SessionProvider session={{ userId: 'u1', tenantId: 'tenant-A', role: 'analyst', authenticated: true }}>
          <App />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Research' })).toBeInTheDocument();
    expect(screen.queryByTestId('shell-not-authorized')).not.toBeInTheDocument();
  });
});
