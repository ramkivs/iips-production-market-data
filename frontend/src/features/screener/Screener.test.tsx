/**
 * Program v3.0 — P-5: Read-only Screener tests.
 *
 * Verifies the accepted v1 boundary: universe sourced ONLY from mocked /api/decision-matrix
 * (no new endpoint); the five filters (sector / verdict / composite / quality / valuation);
 * "Include unavailable" semantics for null quality/valuation; null-honest rendering (never 0);
 * no confidence/conviction; no explicit default sort (payload order preserved); result → Company
 * navigation; Screener under Research; and the governed error state.
 *
 * Note: sector/verdict names appear both as filter checkbox labels and as result links, so
 * result-row assertions use link roles to stay unambiguous.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Screener } from './Screener';
import { App } from '../../app/App';
import { SessionProvider } from '../../core/session/SessionContext';
import type { DecisionMatrixData } from '../../api/decisionMatrix';

const PROVENANCE = {
  dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1',
} as const;

const UNIVERSE: DecisionMatrixData = {
  matrixType: 'scatter',
  note: 'presentational scatter; no classification computed',
  companies: [
    { companyId: 'Banking-H1', sector: 'Banking', verdict: 'Watch', composite: 47.1, quality: 40, valuation: 50 },
    { companyId: 'Technology-H1', sector: 'Technology', verdict: 'Buy', composite: 76.3, quality: 85, valuation: 60 },
    { companyId: 'Energy-H1', sector: 'Energy', verdict: 'Hold', composite: 55, quality: null, valuation: null },
    { companyId: 'Consumer-H1', sector: 'Consumer', verdict: 'Buy', composite: 66, quality: 70, valuation: 55 },
  ],
  universe: { avgConviction: 60, avgQuality: 65, holdings: 4 },
  provenance: PROVENANCE,
};

function urlAwareMock(payload: DecisionMatrixData = UNIVERSE, opts: { fails?: boolean } = {}): ReturnType<typeof vi.fn> {
  return vi.fn((input: unknown) => {
    const url = String(input);
    if (url.includes('/api/decision-matrix')) {
      if (opts.fails) return Promise.reject(new Error('screener down')) as never;
      return Promise.resolve({ ok: true, json: async () => payload }) as never;
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) }) as never;
  });
}

function renderScreener() {
  return render(
    <MemoryRouter initialEntries={['/screener']}>
      <Routes>
        <Route path="/screener" element={<Screener />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Result-row sector links, in render order (only the result table renders links). */
function sectorLinks() {
  return screen.getAllByRole('link').map((l) => l.textContent);
}

beforeEach(() => { globalThis.fetch = vi.fn() as never; });

describe('P-5 Screener — governed read-only universe', () => {
  it('loads the universe from /api/decision-matrix (nulls excluded by default)', async () => {
    globalThis.fetch = urlAwareMock();
    renderScreener();
    expect(await screen.findByRole('link', { name: 'Banking' })).toBeInTheDocument();
    // Energy has null quality+valuation → excluded unless "Include unavailable" is on.
    expect(screen.getByText('3 of 4 companies match')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Energy' })).not.toBeInTheDocument();
  });

  it('does NOT hardcode sectors (custom payload sectors appear)', async () => {
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
    renderScreener();
    expect(await screen.findByRole('link', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Banking' })).not.toBeInTheDocument();
  });

  it('renders accepted fields only — no confidence/conviction', async () => {
    globalThis.fetch = urlAwareMock();
    renderScreener();
    await screen.findByRole('link', { name: 'Banking' });
    expect(screen.queryByText(/confidence/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/conviction/i)).not.toBeInTheDocument();
  });

  it('preserves payload order — no explicit default sort (A5)', async () => {
    globalThis.fetch = urlAwareMock();
    renderScreener();
    await screen.findByRole('link', { name: 'Banking' });
    // With "Include unavailable" on, all four rows appear in payload order.
    await userEvent.click(screen.getByTestId('include-unavailable'));
    expect(sectorLinks()).toEqual(['Banking', 'Technology', 'Energy', 'Consumer']);
  });
});

describe('P-5 Screener — the five accepted filters', () => {
  it('filters by sector', async () => {
    globalThis.fetch = urlAwareMock();
    renderScreener();
    await screen.findByRole('link', { name: 'Banking' });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Technology' }));
    expect(screen.getByText('1 of 4 companies match')).toBeInTheDocument();
    expect(sectorLinks()).toEqual(['Technology']);
  });

  it('filters by verdict', async () => {
    globalThis.fetch = urlAwareMock();
    renderScreener();
    await screen.findByRole('link', { name: 'Banking' });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Buy' }));
    expect(screen.getByText('2 of 4 companies match')).toBeInTheDocument();
    expect(sectorLinks()).toEqual(['Technology', 'Consumer']);
  });

  it('filters by composite range', async () => {
    globalThis.fetch = urlAwareMock();
    renderScreener();
    await screen.findByRole('link', { name: 'Banking' });
    await userEvent.type(screen.getByLabelText('Composite minimum'), '60');
    expect(screen.getByText('2 of 4 companies match')).toBeInTheDocument();
    expect(sectorLinks()).toEqual(['Technology', 'Consumer']);
  });

  it('filters by quality range (null excluded unless unavailable included)', async () => {
    globalThis.fetch = urlAwareMock();
    renderScreener();
    await screen.findByRole('link', { name: 'Banking' });
    await userEvent.type(screen.getByLabelText('Quality minimum'), '80');
    expect(screen.getByText('1 of 4 companies match')).toBeInTheDocument();
    expect(sectorLinks()).toEqual(['Technology']);
  });

  it('filters by valuation range', async () => {
    globalThis.fetch = urlAwareMock();
    renderScreener();
    await screen.findByRole('link', { name: 'Banking' });
    await userEvent.type(screen.getByLabelText('Valuation maximum'), '55');
    expect(screen.getByText('2 of 4 companies match')).toBeInTheDocument();
    expect(sectorLinks()).toEqual(['Banking', 'Consumer']);
  });
});

describe('P-5 Screener — null honesty + Company navigation', () => {
  it('"Include unavailable" includes null rows rendered as unavailable (never 0)', async () => {
    globalThis.fetch = urlAwareMock();
    renderScreener();
    await screen.findByRole('link', { name: 'Banking' });
    await userEvent.click(screen.getByTestId('include-unavailable'));
    expect(screen.getByText('4 of 4 companies match')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Energy' })).toBeInTheDocument();
    // Energy quality + valuation are both null → two "unavailable" cells.
    expect(screen.getAllByText('unavailable').length).toBe(2);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('links every result row to /research/company/:sector (Company trust chain)', async () => {
    globalThis.fetch = urlAwareMock();
    renderScreener();
    await screen.findByRole('link', { name: 'Banking' });
    expect(screen.getByRole('link', { name: 'Banking' })).toHaveAttribute('href', '/research/company/Banking');
    expect(screen.getByRole('link', { name: 'Technology' })).toHaveAttribute('href', '/research/company/Technology');
  });

  it('renders the governed ErrorState when /api/decision-matrix fails', async () => {
    globalThis.fetch = urlAwareMock(UNIVERSE, { fails: true });
    renderScreener();
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load screener universe');
  });
});

describe('P-5 Screener — route + navigation integration (under Research)', () => {
  it('/screener renders the Screener and appears under Research navigation', async () => {
    globalThis.fetch = urlAwareMock();
    render(
      <MemoryRouter initialEntries={['/screener']}>
        <SessionProvider session={{ userId: 'u1', tenantId: 'tenant-A', role: 'analyst', authenticated: true }}>
          <App />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Screener' })).toBeInTheDocument();
    // The Screener navigation link (sidebar, under Research) is present.
    expect(screen.getByRole('link', { name: 'Screener' })).toBeInTheDocument();
    expect(screen.queryByTestId('shell-not-authorized')).not.toBeInTheDocument();
  });
});
