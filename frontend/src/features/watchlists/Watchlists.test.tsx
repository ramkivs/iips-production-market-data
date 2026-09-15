/**
 * UI07 (D81) — Watchlists surface component tests.
 *
 * Verifies list/membership rendering, baseline-vs-current delta presentation, trigger display,
 * the frozen-baseline disclosure, and that the client sends only identifiers — never governed
 * values or tenant/owner identity.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Watchlists } from './Watchlists';

const PROVENANCE = {
  dataSource: 'governed:certified-v2.0-reference-universe',
  asOf: '2026-08-09T00:00:00.000Z',
  dataVersion: 'v1.1-replay-baseline',
  mode: 'SNAPSHOT',
  freshness: 'SNAPSHOT',
  authority: 'PLATFORM',
  transportSemantics:
    'owner-scoped watchlists (append-only journal). Deltas compare each item PERSISTED BASELINE against the CURRENT governed value. Values derive from the frozen v1.1 replay baseline — this is NOT a live feed and NOT a time series.',
};

function item(overrides: Record<string, unknown> = {}) {
  return {
    canonicalSecurityId: 'Banking',
    baseline: { composite: 72 },
    baselineAsOf: '2026-08-09T00:00:00.000Z',
    addedAt: '2026-08-09T00:00:00.000Z',
    triggers: [],
    deltas: [{ field: 'composite', baselineValue: 72, currentValue: 72, delta: 0, changed: false }],
    current: { composite: 72 },
    currentAsOf: '2026-08-09T00:00:00.000Z',
    _quality: 'good',
    ...overrides,
  };
}

function envelope(items: Record<string, unknown>[] = [item()]) {
  return {
    data: [{
      surfaceName: 'UI07', disposition: 'NEW', watchlistId: 'wl-1', name: 'Core banks',
      createdAt: '2026-08-09T00:00:00.000Z', totalItems: items.length, items,
    }],
    provenance: PROVENANCE,
  };
}

function mockFetch(body: unknown) {
  return vi.fn((_url: string, _init?: { method?: string; body?: string }) =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response));
}

afterEach(() => { vi.restoreAllMocks(); });

describe('UI07 — Watchlists surface', () => {
  it('renders a persistent list with its members', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope()));
    render(<Watchlists />);
    await waitFor(() => expect(screen.getByTestId('watchlists-surface')).toBeInTheDocument());
    expect(screen.getByTestId('watchlist-wl-1')).toHaveTextContent('Core banks');
    expect(screen.getByTestId('watchlist-item-Banking')).toBeInTheDocument();
  });

  it('shows baseline, current and a zero delta against the frozen baseline', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope()));
    render(<Watchlists />);
    await waitFor(() => expect(screen.getByTestId('baseline-Banking')).toHaveTextContent('72'));
    expect(screen.getByTestId('current-Banking')).toHaveTextContent('72');
    expect(screen.getByTestId('delta-Banking')).toHaveTextContent('0');
  });

  it('shows a signed delta when the governed value has moved', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope([item({
      deltas: [{ field: 'composite', baselineValue: 72, currentValue: 80, delta: 8, changed: true }],
      current: { composite: 80 },
    })])));
    render(<Watchlists />);
    await waitFor(() => expect(screen.getByTestId('delta-Banking')).toHaveTextContent('+8'));
  });

  it('renders "unavailable" rather than 0 when a governed value is missing', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope([item({
      deltas: [{ field: 'composite', baselineValue: 72, currentValue: null, delta: null, changed: false }],
      current: null,
    })])));
    render(<Watchlists />);
    await waitFor(() => expect(screen.getByTestId('current-Banking')).toHaveTextContent('unavailable'));
    expect(screen.getByTestId('delta-Banking')).toHaveTextContent('unavailable');
  });

  it('shows trigger state, including not-evaluated on unavailable data', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope([item({
      triggers: [
        { field: 'composite', op: 'gt', value: 50, fired: true, reason: 'evaluated' },
        { field: 'valuation', op: 'gt', value: 1, fired: null, reason: 'governed value unavailable' },
      ],
    })])));
    render(<Watchlists />);
    await waitFor(() => expect(screen.getByTestId('triggers-Banking')).toHaveTextContent('FIRED'));
    expect(screen.getByTestId('triggers-Banking')).toHaveTextContent('not evaluated');
  });

  it('discloses that values derive from the frozen baseline and are not a time series', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope()));
    render(<Watchlists />);
    await waitFor(() => expect(screen.getByTestId('watchlists-provenance')).toBeInTheDocument());
    const text = screen.getByTestId('watchlists-provenance').textContent ?? '';
    expect(text).toMatch(/frozen v1\.1 replay baseline/);
    expect(text).toMatch(/NOT a live feed and NOT a time series/);
  });

  it('sends only an identifier when adding a security — never governed values or identity', async () => {
    const f = mockFetch(envelope());
    vi.stubGlobal('fetch', f);
    render(<Watchlists />);
    await waitFor(() => expect(screen.getByTestId('watchlist-add-wl-1')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('watchlist-add-id-wl-1'), { target: { value: 'Telecom' } });
    fireEvent.click(screen.getByTestId('watchlist-add-wl-1'));

    await waitFor(() => {
      const post = f.mock.calls.find((c) => c[1]?.method === 'POST');
      expect(post).toBeDefined();
      const sent = JSON.parse(post![1]!.body!) as Record<string, unknown>;
      expect(Object.keys(sent).sort()).toEqual(['canonicalSecurityId', 'triggers']);
      expect(sent.canonicalSecurityId).toBe('Telecom');
      expect(JSON.stringify(sent)).not.toMatch(/tenant|owner|composite|verdict/i);
    });
  });

  it('shows an empty state when the principal has no watchlists', async () => {
    vi.stubGlobal('fetch', mockFetch({ data: [], provenance: PROVENANCE }));
    render(<Watchlists />);
    await waitFor(() => expect(screen.getByText(/No watchlists yet/)).toBeInTheDocument());
  });

  it('surfaces a load failure rather than inventing lists', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) } as Response)));
    render(<Watchlists />);
    await waitFor(() => expect(screen.getByText(/watchlists request failed: 401/)).toBeInTheDocument());
    expect(screen.queryByTestId('watchlists-surface')).not.toBeInTheDocument();
  });
});
