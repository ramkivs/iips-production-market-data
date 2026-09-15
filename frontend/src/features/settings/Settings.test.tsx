/**
 * UI12 (D80) — Settings surface component tests.
 *
 * Verifies the surface renders the governed preference set, sends ONLY preference values
 * (never tenant/owner identity), and surfaces server-authoritative revision/provenance.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Settings } from './Settings';

const PROVENANCE = {
  dataSource: 'governed UI12 user preferences (PF-1 durable journal)',
  freshness: 'LIVE',
  authority: 'PLATFORM',
  transportSemantics: 'owner-scoped user preferences',
};

const DEFAULTS = { theme: 'light', density: 'comfortable', defaultDataMode: 'SNAPSHOT', showDegradedDetail: true };

function envelope(preferences: Record<string, unknown>, revision: number, updatedAt: string | null) {
  return { data: { preferences, revision, updatedAt }, provenance: PROVENANCE };
}

function mockFetch(get: unknown, put?: unknown) {
  return vi.fn((_url: string, init?: { method?: string }) => {
    const body = init?.method === 'PUT' ? (put ?? get) : get;
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
  });
}

beforeEach(() => {
  window.localStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('UI12 — Settings surface', () => {
  it('renders the governed preference controls', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope(DEFAULTS, 0, null)));
    render(<Settings />);
    await waitFor(() => expect(screen.getByTestId('settings-surface')).toBeInTheDocument());
    expect(screen.getByTestId('pref-theme')).toBeInTheDocument();
    expect(screen.getByTestId('pref-density')).toBeInTheDocument();
    expect(screen.getByTestId('pref-defaultDataMode')).toBeInTheDocument();
    expect(screen.getByTestId('pref-showDegradedDetail')).toBeInTheDocument();
  });

  it('discloses that governed defaults are in effect when never saved', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope(DEFAULTS, 0, null)));
    render(<Settings />);
    await waitFor(() => expect(screen.getByTestId('settings-provenance')).toHaveTextContent('revision 0'));
    expect(screen.getByTestId('settings-provenance')).toHaveTextContent(/governed defaults in effect/);
  });

  it('renders persisted values returned by the server', async () => {
    const saved = { theme: 'dark', density: 'compact', defaultDataMode: 'PIT', showDegradedDetail: false };
    vi.stubGlobal('fetch', mockFetch(envelope(saved, 3, '2026-09-15T00:00:00.000Z')));
    render(<Settings />);
    await waitFor(() => expect(screen.getByTestId('pref-theme')).toHaveValue('dark'));
    expect(screen.getByTestId('pref-defaultDataMode')).toHaveValue('PIT');
    expect(screen.getByTestId('pref-showDegradedDetail')).not.toBeChecked();
    expect(screen.getByTestId('settings-provenance')).toHaveTextContent('revision 3');
  });

  it('sends ONLY preference values on save — no tenant or owner identity', async () => {
    const f = mockFetch(envelope(DEFAULTS, 0, null), envelope({ ...DEFAULTS, theme: 'dark' }, 1, '2026-09-15T00:00:00.000Z'));
    vi.stubGlobal('fetch', f);
    render(<Settings />);
    await waitFor(() => expect(screen.getByTestId('pref-theme')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('pref-theme'), { target: { value: 'dark' } });
    fireEvent.click(screen.getByTestId('settings-save'));
    await waitFor(() => expect(screen.getByTestId('settings-saved')).toBeInTheDocument());

    const putCall = f.mock.calls.find((c) => (c[1] as { method?: string } | undefined)?.method === 'PUT');
    expect(putCall).toBeDefined();
    const sent = JSON.parse((putCall![1] as { body: string }).body) as Record<string, unknown>;
    expect(Object.keys(sent)).toEqual(['preferences']);
    expect(Object.keys(sent.preferences as object).sort())
      .toEqual(['defaultDataMode', 'density', 'showDegradedDetail', 'theme']);
    expect(JSON.stringify(sent)).not.toMatch(/tenant|owner|userId/i);
  });

  it('shows the server-authoritative revision after saving', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope(DEFAULTS, 0, null), envelope(DEFAULTS, 1, '2026-09-15T00:00:00.000Z')));
    render(<Settings />);
    await waitFor(() => expect(screen.getByTestId('settings-save')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('settings-save'));
    await waitFor(() => expect(screen.getByTestId('settings-provenance')).toHaveTextContent('revision 1'));
  });

  it('surfaces a load failure rather than inventing preferences', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) } as Response)));
    render(<Settings />);
    await waitFor(() => expect(screen.getByText(/settings request failed: 401/)).toBeInTheDocument());
    expect(screen.queryByTestId('settings-surface')).not.toBeInTheDocument();
  });
});
