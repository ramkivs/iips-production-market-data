/**
 * Program v3.0 — Phase 3: AppShell / routing / navigation tests.
 * Verifies: shell renders, navigation is role-aware, routes resolve, shell states render.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionProvider } from '../core/session/SessionContext';
import { App } from './App';

const FIXTURE = {
  portfolio: { portfolioId: 'PF-T', scenario: 'Balanced', holdings: 1, sectorExposure: { A: 100 }, concentration: 100, diversificationScore: 50, avgConviction: 60, avgQuality: 70, avgRisk: 40 },
  diversification: { band: 'High', flags: [] },
  ranking: [], opportunity: [], correlation: { flags: [], concentrationSectors: [] },
  decisions: [{ sector: 'A', verdict: 'Buy', composite: 70, confidence: 0.8 }],
  provenance: { dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1' },
};

beforeEach(() => {
  // URL-aware transport mock: admin surfaces receive an admin-shaped DTO; all other
  // feature surfaces receive the executive/portfolio FIXTURE (matches the real contract).
  globalThis.fetch = vi.fn((input: unknown) => {
    const url = String(input);
    if (url.includes('/api/admin/')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          platform: { state: 'OPERATIONAL', nodesHealthy: 1, nodesTotal: 2, enginesRegistered: 10, enginesCertified: 10, liveDataQuality: 'good', recentAuditCount: 3 },
          provenance: { dataSource: 'governed', freshness: 'SNAPSHOT', authority: 'PLATFORM', transportSemantics: 'read-only' },
        }),
      }) as never;
    }
    return Promise.resolve({ ok: true, json: async () => FIXTURE }) as never;
  }) as never;
});

function renderAt(path: string, role: 'viewer' | 'analyst' | 'admin' = 'analyst') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider session={{ userId: 'u1', tenantId: 'tenant-X', role, authenticated: true }}>
        <App />
      </SessionProvider>
    </MemoryRouter>,
  );
}

describe('Application Shell', () => {
  it('renders the topbar with tenant and role', () => {
    renderAt('/executive');
    expect(screen.getByTestId('topbar-tenant')).toHaveTextContent('tenant-X');
    expect(screen.getByTestId('topbar-role')).toHaveTextContent('analyst');
  });

  it('redirects / to /executive (renders the Executive Dashboard)', async () => {
    renderAt('/');
    // / redirects to /executive which now renders the Executive Dashboard.
    // The dashboard is a React.lazy route + async fetch, so allow a realistic wait
    // budget beyond the 1000ms default (the default can be exceeded under full-suite
    // parallel load, causing a spurious timeout). The assertion itself is unchanged.
    expect(await screen.findByTestId('decision-list', {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('renders a navigation link for a role-visible surface', () => {
    renderAt('/executive', 'analyst');
    expect(screen.getByRole('link', { name: 'Executive' })).toBeInTheDocument();
  });

  it('hides Administration for non-admin roles', () => {
    renderAt('/executive', 'analyst');
    expect(screen.queryByRole('link', { name: 'Administration' })).not.toBeInTheDocument();
  });

  it('shows the Administration surface for admin role (Phase 12.1)', async () => {
    renderAt('/admin', 'admin');
    expect(screen.getByRole('link', { name: 'Administration' })).toBeInTheDocument();
    // Phase 12.1 wires the real read-only Administration surface, not the placeholder.
    expect(screen.queryByTestId('shell-not-authorized')).not.toBeInTheDocument();
    // Lazy-loaded route (Phase 13-Hardening code splitting): await the workspace.
    expect(await screen.findByRole('heading', { name: 'Administration' })).toBeInTheDocument();
  });

  it('renders the unknown-route placeholder for an unmatched route', () => {
    renderAt('/nonsense', 'analyst');
    expect(screen.getByTestId('shell-not-authorized')).toBeInTheDocument();
  });

  it('B2: provides a skip link to the main content region', () => {
    renderAt('/executive');
    const skip = screen.getByRole('link', { name: /skip to main content/i });
    expect(skip).toHaveAttribute('href', '#main-content');
    expect(document.getElementById('main-content')).toBeInTheDocument();
  });
});
