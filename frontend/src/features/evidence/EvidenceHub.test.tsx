/**
 * Program v3.0 — N+14: Evidence Hub tests (governed evidence directory).
 *
 * Verifies: /evidence renders EvidenceHub instead of FeaturePlaceholder; directory data sourced
 * ONLY from mocked /api/decision-matrix; no hardcoded sector universe; exact Evidence + Replay
 * deep links derived from the payload sector; verdict + composite from the payload; governed
 * ErrorState on failure; and no fabricated evidence/derived values.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { EvidenceHub } from './EvidenceHub';
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
  ],
  universe: { avgConviction: 60, avgQuality: 57, holdings: 2 },
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
    <MemoryRouter initialEntries={['/evidence']}>
      <Routes>
        <Route path="/evidence" element={<EvidenceHub />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => { globalThis.fetch = vi.fn() as never; });

describe('Evidence Hub — governed evidence directory', () => {
  it('renders directory data sourced from /api/decision-matrix (row count == payload count)', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    expect(await screen.findByText('Banking')).toBeInTheDocument();
    expect(screen.getByTestId('data-table').querySelectorAll('tbody tr')).toHaveLength(2);
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

  it('links Evidence to exactly /evidence/:sector derived from the payload', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    await screen.findByText('Banking');
    const links = screen.getAllByRole('link', { name: /Open evidence/ });
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/evidence/Banking', '/evidence/Technology']);
  });

  it('links Replay to exactly /evidence/replay/:sector derived from the payload', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    await screen.findByText('Banking');
    const links = screen.getAllByRole('link', { name: /Open replay/ });
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/evidence/replay/Banking', '/evidence/replay/Technology']);
  });

  it('produces Technology links /evidence/Technology and /evidence/replay/Technology', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    await screen.findByText('Technology');
    const all = screen.getAllByRole('link');
    expect(all.some((a) => a.getAttribute('href') === '/evidence/Technology')).toBe(true);
    expect(all.some((a) => a.getAttribute('href') === '/evidence/replay/Technology')).toBe(true);
  });

  it('renders verdict and composite from the governed payload (no derived values)', async () => {
    globalThis.fetch = urlAwareMock();
    renderHub();
    await screen.findByText('Banking');
    expect(screen.getByTestId('decision-badge-Buy')).toHaveTextContent('Buy');
    expect(screen.getByTestId('decision-badge-Watch')).toHaveTextContent('Watch');
    expect(screen.getByText('76.3')).toBeInTheDocument();
    expect(screen.getByText('47.1')).toBeInTheDocument();
  });

  it('renders the governed ErrorState when /api/decision-matrix fails', async () => {
    globalThis.fetch = urlAwareMock(DIRECTORY, { fails: true });
    renderHub();
    expect(await screen.findByTestId('state-error')).toHaveTextContent('Unable to load evidence directory');
  });
});

describe('Evidence Hub — route integration', () => {
  it('/evidence renders EvidenceHub instead of the FeaturePlaceholder', async () => {
    globalThis.fetch = urlAwareMock();
    render(
      <MemoryRouter initialEntries={['/evidence']}>
        <SessionProvider session={{ userId: 'u1', tenantId: 'tenant-A', role: 'analyst', authenticated: true }}>
          <App />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Evidence' })).toBeInTheDocument();
    expect(screen.queryByTestId('shell-not-authorized')).not.toBeInTheDocument();
  });
});
