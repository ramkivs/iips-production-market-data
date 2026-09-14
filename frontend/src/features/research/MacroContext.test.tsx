/**
 * Program v3.0 — WP-MACRO-03: Macro Context tests (offline, 1:1 / LIVE / null-honest).
 *
 * Fixtures mirror the certified MacroObservation contract (values are real captured MoSPI
 * samples, used only to exercise rendering). The component consumes GET /api/macro ONLY —
 * never api.mospi.gov.in. Covers the WP-MACRO-03 authorized test matrix (1–20).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MacroContext } from './MacroContext';
import { App } from '../../app/App';
import { SessionProvider } from '../../core/session/SessionContext';
import type { MacroData, MacroObservation } from '../../api/macro';

const PROV_ENV = {
  dataSource: 'MoSPI National Statistical Office',
  freshness: 'LIVE' as const,
  transportSemantics: '1:1 normalization; no derivation',
};

const OBS_PROV = {
  source: 'MoSPI',
  baseUrl: 'https://api.mospi.gov.in',
  endpoint: '/api/iip/getIipData',
  freshness: 'LIVE' as const,
  transportSemantics: '1:1 normalization; no derivation',
};

function iipObs(measure: 'index' | 'growth_rate', indicator: string, value: number | null, raw: string | null): MacroObservation {
  return {
    dataset: 'IIP',
    indicator,
    measure,
    value,
    unit: null,
    frequency: 'Annually',
    referencePeriod: '2025-26',
    dimensions: { type: 'General', category: 'General', sub_category: '', index: raw, growth_rate: raw },
    baseYear: '2022-23',
    series: null,
    status: null,
    source: 'MoSPI',
    retrievedAt: '2026-08-21T10:00:00.000Z',
    provenance: OBS_PROV,
  };
}

const IIP_DATA: MacroData = {
  data: [
    iipObs('index', 'General › General', 117.7, '117.7'),
    iipObs('growth_rate', 'General › General', 4.3, '4.3'),
    iipObs('index', 'Sectoral › Mining & Quarrying › Fuel Minerals', 103.6, '103.6'),
    iipObs('growth_rate', 'Sectoral › Mining & Quarrying › Fuel Minerals', -2.0, '-2.0'),
  ],
  provenance: PROV_ENV,
};

const NULL_DATA: MacroData = {
  data: [iipObs('index', 'General › General', null, 'N/A'), iipObs('growth_rate', 'General › General', 4.3, '4.3')],
  provenance: PROV_ENV,
};

function urlAwareMock(payload: MacroData | { status: number; code: string; error: string }): ReturnType<typeof vi.fn> {
  return vi.fn((input: unknown) => {
    const url = String(input);
    if (url.startsWith('/api/macro') || url.includes('/api/macro')) {
      if ('status' in payload) {
        return Promise.resolve({
          ok: false,
          status: payload.status,
          json: async () => ({ code: payload.code, error: payload.error }),
        } as unknown as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => payload } as unknown as Response);
    }
    return Promise.resolve({ ok: false, status: 404, json: async () => ({}) } as unknown as Response);
  });
}

function renderMacro() {
  return render(
    <MemoryRouter initialEntries={['/research/macro']}>
      <MacroContext />
    </MemoryRouter>,
  );
}

beforeEach(() => { globalThis.fetch = vi.fn() as never; });

describe('Macro Context — dataset selector (frozen allowlist)', () => {
  it('contains exactly NAS / CPI / IIP', async () => {
    globalThis.fetch = urlAwareMock(IIP_DATA);
    renderMacro();
    expect(await screen.findByTestId('macro-dataset-select')).toBeInTheDocument();
    const options = screen.getAllByRole('option').map((o) => o.getAttribute('value'));
    expect(options).toEqual(['NAS', 'CPI', 'IIP']);
  });
});

describe('Macro Context — request + filters', () => {
  it('requests /api/macro (never MoSPI directly)', async () => {
    globalThis.fetch = urlAwareMock(IIP_DATA);
    renderMacro();
    await screen.findByTestId('macro-dataset-select');
    const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((c) => String(c[0]));
    expect(calls.some((u) => u.includes('/api/macro'))).toBe(true);
    expect(calls.some((u) => u.includes('api.mospi.gov.in'))).toBe(false);
    expect(calls.some((u) => u.includes('mcp.mospi.gov.in'))).toBe(false);
  });

  it('sends IIP defaults base_year=2022-23 & frequency=Annually', async () => {
    globalThis.fetch = urlAwareMock(IIP_DATA);
    renderMacro();
    await screen.findByTestId('macro-dataset-select');
    const url = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('dataset=IIP');
    expect(url).toContain('base_year=2022-23');
    expect(url).toContain('frequency=Annually');
  });

  it('sends NAS filters (base_year, series, frequency_code) on switch', async () => {
    globalThis.fetch = urlAwareMock(IIP_DATA);
    renderMacro();
    const select = await screen.findByTestId('macro-dataset-select');
    await userEvent.selectOptions(select, 'NAS');
    await waitFor(() => {
      const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((c) => String(c[0]));
      const nas = calls.find((u) => u.includes('dataset=NAS'));
      expect(nas).toContain('base_year=2022-23');
      expect(nas).toContain('series=Current');
      expect(nas).toContain('frequency_code=Annually');
    });
  });

  it('sends CPI filters (base_year, series) on switch', async () => {
    globalThis.fetch = urlAwareMock(IIP_DATA);
    renderMacro();
    const select = await screen.findByTestId('macro-dataset-select');
    await userEvent.selectOptions(select, 'CPI');
    await waitFor(() => {
      const calls = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((c) => String(c[0]));
      const cpi = calls.find((u) => u.includes('dataset=CPI'));
      expect(cpi).toContain('base_year=2012');
      expect(cpi).toContain('series=Current');
    });
  });
});

describe('Macro Context — 1:1 rendering', () => {
  it('renders observations 1:1 (values verbatim)', async () => {
    globalThis.fetch = urlAwareMock(IIP_DATA);
    renderMacro();
    expect(await screen.findByText('117.7')).toBeInTheDocument();
    expect(screen.getByText('103.6')).toBeInTheDocument();
    expect(screen.getByText('4.3')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
  });

  it('keeps multiple measures visible (index + growth_rate)', async () => {
    globalThis.fetch = urlAwareMock(IIP_DATA);
    renderMacro();
    expect((await screen.findAllByText('General › General')).length).toBe(2); // index + growth_rate rows
    const table = screen.getByTestId('data-table');
    expect(table.querySelectorAll('tbody tr')).toHaveLength(4); // one row per measure
    expect(screen.getAllByText('index').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('growth_rate').length).toBeGreaterThanOrEqual(1);
  });

  it('displays null value as unavailable (never 0)', async () => {
    globalThis.fetch = urlAwareMock(NULL_DATA);
    renderMacro();
    expect(await screen.findByText('unavailable')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows LIVE freshness (never snapshot)', async () => {
    globalThis.fetch = urlAwareMock(IIP_DATA);
    renderMacro();
    await screen.findByTestId('macro-dataset-select');
    expect(screen.getByTestId('freshness-live')).toBeInTheDocument();
    expect(screen.queryByTestId('freshness-snapshot')).not.toBeInTheDocument();
  });

  it('presents retrievedAt as fetch time, not a publication date', async () => {
    globalThis.fetch = urlAwareMock(IIP_DATA);
    renderMacro();
    await screen.findByTestId('macro-retrieved-at');
    expect(screen.getByTestId('macro-retrieved-at')).toHaveTextContent('Retrieved at (fetch time)');
    expect(screen.queryByText(/published/i)).not.toBeInTheDocument();
  });

  it('shows provenance (dataSource + freshness + transport semantics)', async () => {
    globalThis.fetch = urlAwareMock(IIP_DATA);
    renderMacro();
    await screen.findByTestId('macro-provenance');
    expect(screen.getByTestId('macro-provenance')).toHaveTextContent('MoSPI National Statistical Office');
    expect(screen.getByTestId('macro-provenance')).toHaveTextContent('LIVE');
  });

  it('renders no CSIP sector-context content (no duplication)', async () => {
    globalThis.fetch = urlAwareMock(IIP_DATA);
    renderMacro();
    await screen.findByTestId('macro-dataset-select');
    expect(screen.queryByText(/sector ranking/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/opportunities/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/concentration/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/decision distribution/i)).not.toBeInTheDocument();
  });
});

describe('Macro Context — error states (honest, code-aware)', () => {
  it('SOURCE_UNAVAILABLE → honest unavailable state (no stale/substitute data)', async () => {
    globalThis.fetch = urlAwareMock({ status: 503, code: 'SOURCE_UNAVAILABLE', error: 'MoSPI API unreachable' });
    renderMacro();
    expect(await screen.findByTestId('state-error')).toHaveTextContent(/currently unavailable/i);
    expect(screen.queryByTestId('data-table')).not.toBeInTheDocument();
  });

  it('SOURCE_CONTRACT → honest contract-error state', async () => {
    globalThis.fetch = urlAwareMock({ status: 502, code: 'SOURCE_CONTRACT', error: 'unexpected response' });
    renderMacro();
    expect(await screen.findByTestId('state-error')).toHaveTextContent(/unexpected response/i);
  });

  it('INVALID_FILTER → honest unsupported-request state', async () => {
    globalThis.fetch = urlAwareMock({ status: 422, code: 'INVALID_FILTER', error: 'invalid base year' });
    renderMacro();
    expect(await screen.findByTestId('state-error')).toHaveTextContent(/not supported by the certified source contract/i);
  });

  it('EXCLUDED_DATASET → honest unsupported-request state', async () => {
    globalThis.fetch = urlAwareMock({ status: 422, code: 'EXCLUDED_DATASET', error: 'excluded dataset' });
    renderMacro();
    expect(await screen.findByTestId('state-error')).toHaveTextContent(/not supported by the certified source contract/i);
  });

  it('shows the loading state before data resolves', async () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as never; // never resolves
    renderMacro();
    expect(await screen.findByTestId('state-loading')).toBeInTheDocument();
  });
});

describe('Macro Context — route integration', () => {
  it('/research/macro renders MacroContext instead of the placeholder (viewer+)', async () => {
    globalThis.fetch = urlAwareMock(IIP_DATA);
    render(
      <MemoryRouter initialEntries={['/research/macro']}>
        <SessionProvider session={{ userId: 'u1', tenantId: 'tenant-A', role: 'viewer', authenticated: true }}>
          <App />
        </SessionProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Macro' })).toBeInTheDocument();
    expect(screen.queryByTestId('shell-not-authorized')).not.toBeInTheDocument();
  });
});
