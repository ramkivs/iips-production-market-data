/**
 * Program v3.0 — P-1: Command Palette tests (offline).
 *
 * Covers the approved P-1 v1 composition: Global Search (decision-matrix universe,
 * case-insensitive substring/prefix, no ranking), Command Palette (visibleNav(role) commands),
 * Account Context (username/tenant/role/auth-state/sign-out, no email), the Ctrl/Cmd+K +
 * Escape keyboard contract, deep-linking, and the re-used interaction/state primitives.
 * No deferred features are tested.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';
import { AppShell } from '../../app/AppShell';
import { SessionProvider } from '../../core/session/SessionContext';
import type { DecisionMatrixData } from '../../api/decisionMatrix';
import type { Session } from '../../core/session/session';

// Mock the auth provider so the account-context + sign-out behavior is controllable offline.
const authState = vi.hoisted(() => ({
  status: 'unauthenticated' as 'loading' | 'authenticated' | 'unauthenticated' | 'error',
  logout: vi.fn(async () => {}),
}));

vi.mock('../../core/auth/AuthProvider', () => ({
  useAuth: () => ({
    status: authState.status,
    session: { userId: 'u', tenantId: 't', role: 'viewer' as const, authenticated: true },
    login: async () => {},
    logout: authState.logout,
    getAccessToken: async () => null,
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AuthProvider: (props: any) => props.children,
}));

const PROVENANCE = {
  dataSource: 'fixture (test-only)', freshness: 'SNAPSHOT', calibratedAt: '2026-08-01T00:00:00.000Z', transportSemantics: '1:1',
} as const;

const DIRECTORY: DecisionMatrixData = {
  matrixType: 'scatter',
  note: 'test',
  companies: [
    { companyId: 'Banking-H1', sector: 'Banking', verdict: 'Watch', composite: 47.1, quality: 52, valuation: 47 },
    { companyId: 'Technology-H1', sector: 'Technology', verdict: 'Buy', composite: 76.3, quality: 85, valuation: 60 },
    { companyId: 'Energy-H1', sector: 'Energy', verdict: 'Hold', composite: 55, quality: null, valuation: null },
  ],
  universe: { avgConviction: 60, avgQuality: 57, holdings: 3 },
  provenance: PROVENANCE,
};

const SESSION: Session = { userId: 'analyst-a', tenantId: 'tenant-A', role: 'analyst', authenticated: true, roles: ['analyst'] };
const VIEWER: Session = { userId: 'viewer-a', tenantId: 'tenant-A', role: 'viewer', authenticated: true, roles: ['viewer'] };

function matrixMock(opts: { fail?: boolean; hang?: boolean } = {}): ReturnType<typeof vi.fn> {
  return vi.fn((input: unknown) => {
    const url = String(input);
    if (url.includes('/api/decision-matrix')) {
      if (opts.fail) return Promise.reject(new Error('matrix down')) as never;
      if (opts.hang) return new Promise(() => {}) as never;
      return Promise.resolve({ ok: true, status: 200, json: async () => DIRECTORY } as unknown as Response);
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) } as unknown as Response);
  });
}

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="location">{loc.pathname}</div>;
}

function renderPalette(session: Session = SESSION) {
  return render(
    <MemoryRouter initialEntries={['/executive']}>
      <SessionProvider session={session}>
        <Routes>
          <Route path="*" element={<><CommandPalette open onClose={() => {}} /><LocationProbe /></>} />
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );
}

function renderShell(session: Session = SESSION) {
  return render(
    <MemoryRouter initialEntries={['/executive']}>
      <SessionProvider session={session}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/executive" element={<div>executive</div>} />
          </Route>
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  authState.status = 'unauthenticated';
  authState.logout.mockClear();
  globalThis.fetch = vi.fn() as never;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Command Palette — open/close (keyboard contract)', () => {
  it('opens from the TopBar affordance', async () => {
    globalThis.fetch = matrixMock();
    renderShell();
    fireEvent.click(screen.getByTestId('palette-trigger'));
    expect(await screen.findByTestId('palette-search')).toBeInTheDocument();
  });

  it('Ctrl+K opens the palette', async () => {
    globalThis.fetch = matrixMock();
    renderShell();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(await screen.findByTestId('palette-search')).toBeInTheDocument();
  });

  it('Cmd+K opens the palette', async () => {
    globalThis.fetch = matrixMock();
    renderShell();
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(await screen.findByTestId('palette-search')).toBeInTheDocument();
  });

  it('Escape closes the palette via the existing dialog mechanism', async () => {
    globalThis.fetch = matrixMock();
    renderShell();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    await screen.findByTestId('palette-search');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByTestId('palette-search')).not.toBeInTheDocument());
  });

  it('moves focus into the palette dialog on open (existing dialog focus)', async () => {
    globalThis.fetch = matrixMock();
    renderPalette();
    await screen.findByTestId('palette-search');
    await waitFor(() => {
      // Existing useDialogFocus behavior: focus enters the dialog (its first focusable).
      const dialog = screen.getByRole('dialog', { name: 'Command Palette' });
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
  });
});

describe('Command Palette — role-filtered commands', () => {
  it('shows visibleNav(role) commands for an analyst', async () => {
    globalThis.fetch = matrixMock();
    renderPalette(SESSION);
    await screen.findByTestId('palette-search');
    expect(screen.getByText('Executive')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
    expect(screen.getByText('Research')).toBeInTheDocument();
  });

  it('does not show unauthorized (admin) commands to a viewer', async () => {
    globalThis.fetch = matrixMock();
    renderPalette(VIEWER);
    await screen.findByTestId('palette-search');
    expect(screen.queryByText('Administration')).not.toBeInTheDocument();
  });
});

describe('Command Palette — Global Search', () => {
  it('uses Decision-Matrix data and deep-links to an existing route', async () => {
    globalThis.fetch = matrixMock();
    renderPalette();
    fireEvent.change(await screen.findByTestId('palette-search'), { target: { value: 'Banking' } });
    fireEvent.click(await screen.findByText('Banking'));
    expect(screen.getByTestId('location').textContent).toBe('/research/company/Banking');
  });

  it('is case-insensitive', async () => {
    globalThis.fetch = matrixMock();
    renderPalette();
    fireEvent.change(await screen.findByTestId('palette-search'), { target: { value: 'banking' } });
    expect(await screen.findByText('Banking')).toBeInTheDocument();
  });

  it('supports substring/prefix matching', async () => {
    globalThis.fetch = matrixMock();
    renderPalette();
    fireEvent.change(await screen.findByTestId('palette-search'), { target: { value: 'Tech' } });
    expect(await screen.findByText('Technology')).toBeInTheDocument();
    expect(screen.queryByText('Banking')).not.toBeInTheDocument();
  });

  it('preserves payload order (no ranking)', async () => {
    globalThis.fetch = matrixMock();
    renderPalette();
    fireEvent.change(await screen.findByTestId('palette-search'), { target: { value: 'e' } });
    // payload order: Banking, Technology, Energy → matches with 'e': Technology, Energy
    const entries = screen.getAllByRole('tab').map((t) => t.textContent);
    expect(entries).toEqual(['Technology', 'Energy']);
  });

  it('shows an empty state for no matches (no fuzzy/ranked behavior)', async () => {
    globalThis.fetch = matrixMock();
    renderPalette();
    fireEvent.change(await screen.findByTestId('palette-search'), { target: { value: 'zzz' } });
    expect(await screen.findByTestId('state-empty')).toHaveTextContent('No matching sector');
  });
});

describe('Command Palette — account context', () => {
  it('displays username/userId, tenant, role(s), and auth state', async () => {
    globalThis.fetch = matrixMock();
    renderPalette(SESSION);
    await screen.findByTestId('palette-account');
    expect(screen.getByTestId('palette-username')).toHaveTextContent('analyst-a');
    expect(screen.getByTestId('palette-tenant')).toHaveTextContent('tenant-A');
    expect(screen.getByTestId('palette-role')).toHaveTextContent('analyst');
    expect(screen.getByTestId('palette-auth-status')).toHaveTextContent('unauthenticated');
  });

  it('uses the existing sign-out action when authenticated', async () => {
    authState.status = 'authenticated';
    globalThis.fetch = matrixMock();
    renderPalette(SESSION);
    fireEvent.click(await screen.findByTestId('palette-sign-out'));
    expect(authState.logout).toHaveBeenCalledTimes(1);
  });

  it('does not display email', async () => {
    globalThis.fetch = matrixMock();
    renderPalette(SESSION);
    await screen.findByTestId('palette-account');
    expect(screen.queryByText(/email/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });
});

describe('Command Palette — states + endpoint discipline', () => {
  it('shows the loading state while the search universe loads', async () => {
    globalThis.fetch = matrixMock({ hang: true });
    renderPalette();
    expect(await screen.findByTestId('state-loading')).toBeInTheDocument();
  });

  it('shows the error state when the search universe fails', async () => {
    globalThis.fetch = matrixMock({ fail: true });
    renderPalette();
    expect(await screen.findByTestId('state-error')).toBeInTheDocument();
  });

  it('calls only the existing governed decision-matrix endpoint', async () => {
    globalThis.fetch = matrixMock();
    renderPalette();
    await screen.findByTestId('palette-search');
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((c) => String(c[0]));
    expect(calls.length).toBeGreaterThan(0);
    for (const url of calls) expect(url).toContain('/api/decision-matrix');
  });
});
