/**
 * P13-B-05 — UI05 Governed Screener tests.
 *
 * Verifies that the surface renders GOVERNED results and that governed refusals are
 * surfaced rather than approximated locally. These tests do NOT certify UI05.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GovernedScreener } from './GovernedScreener';

const ENVELOPE = {
  apiVersion: '1.0',
  endpoint: '/api/screener/execute',
  tenantId: 'tenant-a',
  responseGeneratedAt: '2026-09-14T00:00:00.000Z',
  lineage: 'DUAL',
  transportDisclosure: {
    dualTransport: true,
    statement: 'Two transports operate; they are NOT interchangeable.',
    p12Scope: 'P12 API/DTO Gate scope only.',
    v2Scope: 'The 13 pre-existing certified v2.0 read routes.',
    certificationNote: 'Transport binding does NOT certify any UI surface.',
  },
  governanceLimitations: {
    ad17: { ad17Status: 'UNRESOLVED' }, security: { c12Status: 'BLOCKED' },
    ui05Certified: false, uiSurfaceCertified: false, productionAuthorized: false,
  },
  provenance: {
    dataSource: 'governed:certified-v2.0-reference-universe', freshness: 'SNAPSHOT',
    calibratedAt: '2026-08-09T00:00:00.000Z', transportSemantics: 'p12-governed-transport',
    asOf: '2026-08-09T00:00:00.000Z', receivedAt: '2026-08-09T00:00:00.000Z',
    dataVersion: 'v1.1-replay-baseline', mode: 'SNAPSHOT', quality: 'unavailable',
    completenessPct: 33, contributingSnapshotIds: ['program-v1.1-replay-baseline'],
    identityMappingVersion: '1.0', namespaceVersion: '1.0', classification: 'CERTIFIED-ENGINE',
  },
  data: {
    screenId: 'ui05-adhoc', tenantId: 'tenant-a', asOf: '2026-08-09T00:00:00.000Z',
    executedAt: '2026-08-09T00:00:00.000Z', mode: 'PIT', totalRows: 2, quality: 'unavailable',
    filters: [], sort: [{ field: 'composite', direction: 'desc' }], tieBreakField: 'canonicalSecurityId',
    rows: [
      {
        rank: 1, canonicalSecurityId: 'Banking-H1', sector: 'Banking', verdict: 'Buy', composite: 80,
        qualityAxis: 0.8, valuation: 0.5, _degradation: 'good', _rowQuality: 'good',
        _rowCompleteness: 100, _rowAsOf: '2026-08-09T00:00:00.000Z',
      },
      {
        rank: 2, canonicalSecurityId: 'Energy-H1', sector: 'Energy', verdict: 'Sell', composite: 40,
        qualityAxis: null, valuation: null, _degradation: 'degraded-unavailable',
        _rowQuality: 'unavailable', _rowCompleteness: 33, _rowAsOf: '2026-08-09T00:00:00.000Z',
      },
    ],
  },
};

function mockOk() {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ENVELOPE }) as never;
}

beforeEach(() => { globalThis.fetch = vi.fn() as never; });

describe('UI05 Governed Screener (P13-B-05)', () => {
  it('renders governed rows returned by the C6 contract', async () => {
    mockOk();
    render(<MemoryRouter><GovernedScreener /></MemoryRouter>);
    expect(await screen.findByTestId('governed-result-count')).toHaveTextContent('2 governed rows');
    expect(screen.getByText('Banking-H1')).toBeInTheDocument();
  });

  it('preserves the contract rank order (no client re-sorting)', async () => {
    mockOk();
    render(<MemoryRouter><GovernedScreener /></MemoryRouter>);
    await screen.findByTestId('governed-result-count');
    const text = document.body.textContent ?? '';
    expect(text.indexOf('Banking-H1')).toBeLessThan(text.indexOf('Energy-H1'));
  });

  it('labels a degraded row instead of hiding it', async () => {
    mockOk();
    render(<MemoryRouter><GovernedScreener /></MemoryRouter>);
    await screen.findByTestId('governed-result-count');
    const labels = screen.getAllByTestId('degradation-label');
    expect(labels.some((l) => l.getAttribute('data-degradation') === 'degraded-unavailable')).toBe(true);
  });

  it('renders an unavailable axis as "unavailable", never as 0', async () => {
    mockOk();
    render(<MemoryRouter><GovernedScreener /></MemoryRouter>);
    await screen.findByTestId('governed-result-count');
    expect(screen.getAllByText('unavailable').length).toBeGreaterThan(0);
  });

  it('displays derived provenance and the as-of (P13-B-03 / P13-B-09)', async () => {
    mockOk();
    render(<MemoryRouter><GovernedScreener /></MemoryRouter>);
    expect(await screen.findByTestId('p12-provenance')).toBeInTheDocument();
    expect(screen.getByTestId('as-of-display')).toHaveTextContent('2026-08-09T00:00:00.000Z');
    expect(screen.getByTestId('contributing-snapshots')).toHaveTextContent('program-v1.1-replay-baseline');
  });

  it('discloses DUAL lineage explicitly (P13-B-08)', async () => {
    mockOk();
    render(<MemoryRouter><GovernedScreener /></MemoryRouter>);
    await screen.findByTestId('governed-result-count');
    expect(screen.getByTestId('transport-disclosure')).toBeInTheDocument();
    expect(screen.getByTestId('lineage-badge')).toHaveAttribute('data-lineage', 'DUAL');
  });

  it('states that the surface is NOT certified', async () => {
    mockOk();
    render(<MemoryRouter><GovernedScreener /></MemoryRouter>);
    expect(await screen.findByTestId('governance-limitations')).toHaveTextContent('not certified');
  });

  it('FAILS CLOSED on a governed refusal — no local approximation', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 400,
      json: async () => ({ error: "unknown filter operator 'regex'", rules: ['C6'] }),
    }) as never;
    render(<MemoryRouter><GovernedScreener /></MemoryRouter>);
    await waitFor(() => expect(screen.getByTestId('screener-error')).toBeInTheDocument());
    expect(screen.getByTestId('screener-error')).toHaveTextContent('Governed screen refused');
    // No table is rendered from stale or locally-filtered data.
    expect(screen.queryByTestId('governed-result-count')).not.toBeInTheDocument();
  });

  it('D90 — renders governed DataModeUnavailable on LIVE degraded response without crashing', async () => {
    const degradedLive = {
      surface: 'Governed Screener',
      dataMode: 'LIVE',
      state: 'LIVE_UNAVAILABLE',
      dataAvailable: false,
      reason: 'LIVE data is UNAVAILABLE for Governed Screener.',
      dependency: 'R-2 provider ingestion — OPEN and externally blocked.',
      provenance: {
        dataSource: 'none',
        freshness: 'UNAVAILABLE',
        mode: 'LIVE',
        transportSemantics: 'This response deliberately contains NO market data.',
      },
    };
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => degradedLive }) as never;
    render(<MemoryRouter><GovernedScreener /></MemoryRouter>);
    expect(await screen.findByTestId('data-mode-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('data-mode-unavailable-mode')).toHaveTextContent('LIVE');
    expect(screen.getByText(/LIVE data is UNAVAILABLE for Governed Screener/)).toBeInTheDocument();
    expect(screen.queryByTestId('governed-result-count')).not.toBeInTheDocument();
  });

  it('D90 — renders governed DataModeUnavailable on PIT degraded response without crashing', async () => {
    const degradedPit = {
      surface: 'Governed Screener',
      dataMode: 'PIT',
      state: 'PIT_UNAVAILABLE',
      dataAvailable: false,
      reason: 'PIT data is UNAVAILABLE for Governed Screener.',
      dependency: 'PIT capability exists in p08 but is NOT wired to transport.',
      provenance: {
        dataSource: 'none',
        freshness: 'UNAVAILABLE',
        mode: 'PIT',
        transportSemantics: 'This response deliberately contains NO market data.',
      },
    };
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => degradedPit }) as never;
    render(<MemoryRouter><GovernedScreener /></MemoryRouter>);
    expect(await screen.findByTestId('data-mode-unavailable')).toBeInTheDocument();
    expect(screen.getByTestId('data-mode-unavailable-mode')).toHaveTextContent('PIT');
    expect(screen.getByText(/PIT data is UNAVAILABLE for Governed Screener/)).toBeInTheDocument();
    expect(screen.queryByTestId('governed-result-count')).not.toBeInTheDocument();
  });
});
