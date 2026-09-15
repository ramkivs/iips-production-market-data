/**
 * UI08 (D82) — Reports surface component tests.
 *
 * Verifies template selection, generation, PIT pinning display, lineage/source/timestamp,
 * byte-identity reporting, the explicit historical-as-of limitation, and that the client sends
 * only a template selection — never report content or identity.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Reports } from './Reports';

const TEMPLATES = ['Executive', 'Investment Committee', 'Portfolio Summary', 'Allocation Recommendation', 'Sector Dashboard'];

const PIT_LIMITATION = {
  pinAndStore: 'Stored reports pin dataVersion/asOf/mode and re-open byte-identically (hash-verified).',
  sameVintageRegeneration: 'Regeneration from the same pinned vintage is byte-identical.',
  historicalAsOf:
    'UNAVAILABLE — only the frozen v1.1 replay baseline vintage exists. Arbitrary historical as-of regeneration requires historical governed vintages (R-2, externally blocked). No historical vintage is fabricated.',
  replayReproducibilityClaimed: false,
};

const PROVENANCE = {
  dataSource: 'governed:certified-v2.0-reference-universe',
  asOf: '2026-08-09T00:00:00.000Z',
  dataVersion: 'v1.1-replay-baseline',
  mode: 'SNAPSHOT',
  freshness: 'SNAPSHOT',
  authority: 'PLATFORM',
  transportSemantics: 'owner-scoped reports…',
};

function report(overrides: Record<string, unknown> = {}) {
  return {
    surfaceName: 'UI08',
    disposition: 'EXTEND',
    reportId: 'report-executive-PF-REAL@2026-08-09T00:00:00.000Z',
    reportType: 'Executive',
    portfolioId: 'PF-REAL',
    reportBody: { portfolioId: 'PF-REAL', diversificationScore: 71 },
    pitPinning: { dataVersion: 'v1.1-replay-baseline', asOf: '2026-08-09T00:00:00.000Z', mode: 'SNAPSHOT' },
    lineage: {
      dataSource: 'governed:certified-v2.0-reference-universe',
      classification: 'REAL',
      contributingSnapshotIds: ['snap_Banking'],
      generatedAt: '2026-09-15T00:00:00.000Z',
    },
    payloadHash: 'fnv1a-deadbeef',
    storedIntegrityVerified: true,
    regeneration: { sameVintage: true, byteIdentical: true, reason: 'same pinned vintage' },
    pitLimitation: PIT_LIMITATION,
    pitReproducible: true,
    replayReproducibilityClaimed: false,
    ...overrides,
  };
}

function envelope(data: Record<string, unknown>[] = [report()]) {
  return { data, templates: TEMPLATES, provenance: PROVENANCE };
}

function mockFetch(body: unknown) {
  return vi.fn((_url: string, _init?: { method?: string; body?: string }) =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response));
}

afterEach(() => { vi.restoreAllMocks(); });

describe('UI08 — Reports surface', () => {
  it('renders the five certified templates', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope([])));
    render(<Reports />);
    await waitFor(() => expect(screen.getByTestId('report-template')).toBeInTheDocument());
    const options = Array.from(screen.getByTestId('report-template').querySelectorAll('option')).map((o) => o.textContent);
    expect(options).toEqual(TEMPLATES);
  });

  it('renders a generated report with its content', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope()));
    render(<Reports />);
    await waitFor(() => expect(screen.getByTestId('reports-surface')).toBeInTheDocument());
    expect(screen.getByTestId(`body-${report().reportId}`)).toHaveTextContent('diversificationScore');
  });

  it('displays the pinned vintage (dataVersion / asOf / mode)', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope()));
    render(<Reports />);
    await waitFor(() => expect(screen.getByTestId(`pit-${report().reportId}`)).toBeInTheDocument());
    const pit = screen.getByTestId(`pit-${report().reportId}`);
    expect(pit).toHaveTextContent('2026-08-09T00:00:00.000Z');
    expect(pit).toHaveTextContent('v1.1-replay-baseline');
    expect(pit).toHaveTextContent('SNAPSHOT');
  });

  it('displays lineage with source, classification, timestamp and snapshots', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope()));
    render(<Reports />);
    await waitFor(() => expect(screen.getByTestId(`lineage-${report().reportId}`)).toBeInTheDocument());
    const lineage = screen.getByTestId(`lineage-${report().reportId}`);
    expect(lineage).toHaveTextContent('governed:certified-v2.0-reference-universe');
    expect(lineage).toHaveTextContent('REAL');
    expect(lineage).toHaveTextContent('2026-09-15T00:00:00.000Z');
    expect(lineage).toHaveTextContent('snap_Banking');
  });

  it('reports byte-identical stored content and same-vintage regeneration', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope()));
    render(<Reports />);
    await waitFor(() => expect(screen.getByTestId(`repro-${report().reportId}`)).toBeInTheDocument());
    const repro = screen.getByTestId(`repro-${report().reportId}`);
    expect(repro).toHaveTextContent('byte-identical (hash verified)');
    expect(repro).toHaveTextContent('same-vintage regeneration: byte-identical');
  });

  it('reports a different vintage as NOT comparable rather than a failure', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope([report({
      regeneration: { sameVintage: false, byteIdentical: null, reason: 'different governed vintage' },
    })])));
    render(<Reports />);
    await waitFor(() => expect(screen.getByTestId(`repro-${report().reportId}`)).toHaveTextContent('not comparable'));
  });

  it('discloses that arbitrary historical as-of regeneration is UNAVAILABLE', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope()));
    render(<Reports />);
    await waitFor(() => expect(screen.getByTestId('reports-pit-limitation')).toBeInTheDocument());
    const text = screen.getByTestId('reports-pit-limitation').textContent ?? '';
    expect(text).toMatch(/UNAVAILABLE/);
    expect(text).toMatch(/No historical vintage is fabricated/);
  });

  it('sends only a template selection when generating — never content or identity', async () => {
    const f = mockFetch(envelope([]));
    vi.stubGlobal('fetch', f);
    render(<Reports />);
    await waitFor(() => expect(screen.getByTestId('report-generate')).toBeInTheDocument());

    fireEvent.change(screen.getByTestId('report-template'), { target: { value: 'Portfolio Summary' } });
    fireEvent.click(screen.getByTestId('report-generate'));

    await waitFor(() => {
      const post = f.mock.calls.find((c) => c[1]?.method === 'POST');
      expect(post).toBeDefined();
      const sent = JSON.parse(post![1]!.body!) as Record<string, unknown>;
      expect(Object.keys(sent)).toEqual(['reportType']);
      expect(sent.reportType).toBe('Portfolio Summary');
      expect(JSON.stringify(sent)).not.toMatch(/tenant|owner|payload|diversification/i);
    });
  });

  it('shows an empty state when no reports exist', async () => {
    vi.stubGlobal('fetch', mockFetch(envelope([])));
    render(<Reports />);
    await waitFor(() => expect(screen.getByText(/No reports generated yet/)).toBeInTheDocument());
  });

  it('surfaces a load failure rather than inventing reports', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) } as Response)));
    render(<Reports />);
    await waitFor(() => expect(screen.getByText(/reports request failed: 401/)).toBeInTheDocument());
    expect(screen.queryByTestId('reports-surface')).not.toBeInTheDocument();
  });
});
