/**
 * Program v3.0 — WP-MACRO-01: MoSPI source adapter tests (offline, deterministic).
 *
 * Fixtures below are real values captured from the authoritative MoSPI API on 2026-08-21
 * (documented in the implementation report); they are used here ONLY to exercise the
 * adapter's normalization/validation — no live network is contacted by these tests.
 *
 * Coverage (WP §8): A dataset discovery · B indicator/metadata discovery · C successful
 * normalization · D provenance preservation · E revision/status preservation ·
 * F fail-closed metadata mismatch · G missing/unavailable source data ·
 * H rejection of excluded datasets.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  MoSPISourceAdapter,
  MacroSourceError,
  APPROVED_DATASETS,
  SERIES_POLICY,
  type MacroObservation,
} from './mospi-source';

// --- Real captured fixtures (MoSPI live API, 2026-08-21) --------------------

const IIP_ROWS = [
  { base_year: '2022-23', year: '2025-26', type: 'General', category: 'General', sub_category: '', index: '117.7', growth_rate: '4.3' },
  { base_year: '2022-23', year: '2025-26', type: 'Sectoral', category: 'Mining & Quarrying', sub_category: 'Fuel Minerals', index: '103.6', growth_rate: '-2.0' },
];

const CPI_ROWS = [
  { baseyear: '2012', year: 2025, month: 'December', state: 'All India', sector: 'Rural', group: 'Miscellaneous', subgroup: 'Health', index: '207.0', inflation: '3.40', status: 'F' },
];

const NAS_ROWS = [
  {
    base_year: '2022-23', series: 'Current', year: '2025-26', indicator: 'Gross Value Added', frequency: 'Annual',
    revision: 'Second Advance Estimates', industry: 'Agriculture, Livestock, Forestry and Fishing',
    subindustry: null, institutional_sector: null, quarter: null,
    current_price: '5608471', constant_price: '5208799', unit: '₹ Crore',
  },
];

// --- MCP discovery fixtures (authoritative shapes) --------------------------

const LIST_DATASETS = {
  total_datasets: 27,
  datasets: {
    NAS: { name: 'National Accounts Statistics', description: 'GDP, GVA…', use_for: 'GDP, growth' },
    CPI: { name: 'Consumer Price Index', description: 'Retail inflation…', use_for: 'inflation' },
    IIP: { name: 'Index of Industrial Production', description: 'Industrial output…', use_for: 'IIP index' },
    WPI: { name: 'Wholesale Price Index', description: 'Wholesale inflation…', use_for: 'producer prices' },
    RBI: { name: 'RBI Statistics', description: 'External sector…', use_for: 'forex, trade' },
  },
};

const IND_IIP = { data: { base_year: [{ base_year: '2022-23' }, { base_year: '2011-12' }, { base_year: '2004-05' }, { base_year: '1993-94' }], frequency: [{ frequency: 'Annually' }, { frequency: 'Monthly' }] }, _note: 'IIP has multiple base years…' };
const IND_CPI = { data: { base_year: [{ base_year: '2010' }, { base_year: '2012' }, { base_year: '2024' }], series: [{ series: 'Current' }, { series: 'Back' }] }, _note: 'CPI…' };
const IND_NAS = { data: { indicator: [{ indicator_code: 1, name: 'Gross Value Added' }, { indicator_code: 5, name: 'Gross Domestic Product' }] }, _note: 'NAS…' };

const META_NAS = {
  data: { year: [{ year: '2025-26' }, { year: '2024-25' }], revision: [{ revision_code: 2, revision_name: 'Second Advance Estimates' }] },
  api_params: [{ name: 'base_year', required: true, schema: { default: '2022-23', enum: ['2022-23', '2011-12'] } }],
  _note: '…',
};

// --- Mock transport helpers -------------------------------------------------

function sse(textContent: unknown): string {
  const text = typeof textContent === 'string' ? textContent : JSON.stringify(textContent);
  const payload = { jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text }] } };
  return `event: message\r\ndata: ${JSON.stringify(payload)}\r\n\r\n`;
}

function okResponse(body: unknown): Response {
  return { ok: true, status: 200, text: async () => sse(body), json: async () => body } as unknown as Response;
}

interface RouteOpts {
  mcp?: Record<string, unknown>; // method → returned textContent
  dataBody?: unknown; // body for data endpoint
  dataStatus?: number;
}

function routedFetch(opts: RouteOpts) {
  const mock = vi.fn((input: unknown, init?: { body?: string }) => {
    const url = String(input);
    if (url.startsWith('https://mcp.mospi.gov.in')) {
      const body = JSON.parse(init?.body ?? '{}') as { method?: string };
      const method = body.method as string;
      if (method === 'tools/list') return Promise.resolve(okResponse({ tools: [] }));
      const content = opts.mcp?.[method];
      return Promise.resolve(okResponse(content));
    }
    if (url.startsWith('https://api.mospi.gov.in')) {
      const status = opts.dataStatus ?? 200;
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        text: async () => sse(opts.dataBody),
        json: async () => opts.dataBody,
      } as unknown as Response);
    }
    return Promise.resolve({ ok: false, status: 404, text: async () => '', json: async () => ({}) } as unknown as Response);
  });
  return mock as unknown as typeof fetch;
}

const MCP = 'https://mcp.mospi.gov.in';
const BASE = 'https://api.mospi.gov.in';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

// ---------------------------------------------------------------------------

describe('WP-MACRO-01 — MoSPI source adapter', () => {
  it('A — listDatasets() discovers the catalog and flags excluded families', async () => {
    const adapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ mcp: { list_datasets: LIST_DATASETS } }) });
    const catalog = await adapter.listDatasets();
    expect(catalog.totalDatasets).toBe(27);
    expect(catalog.datasets.NAS.excluded).toBe(false);
    expect(catalog.datasets.CPI.excluded).toBe(false);
    expect(catalog.datasets.IIP.excluded).toBe(false);
    expect(catalog.datasets.WPI.excluded).toBe(true);
    expect(catalog.datasets.RBI.excluded).toBe(true);
  });

  it('B — getIndicators() returns verified base years / frequencies / series', async () => {
    const adapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ mcp: { get_indicators: IND_IIP } }) });
    const iip = await adapter.getIndicators('IIP');
    expect(iip.baseYears).toContain('2022-23');
    expect(iip.baseYears).toContain('2011-12');
    expect(iip.frequencies).toEqual(['Annually', 'Monthly']);

    const cpiAdapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ mcp: { get_indicators: IND_CPI } }) });
    const cpi = await cpiAdapter.getIndicators('CPI');
    expect(cpi.baseYears).toEqual(['2010', '2012', '2024']);
    expect(cpi.series).toEqual(['Current', 'Back']);

    const nasAdapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ mcp: { get_indicators: IND_NAS } }) });
    const nas = await nasAdapter.getIndicators('NAS');
    expect(nas.indicators?.[0]).toEqual({ code: 1, name: 'Gross Value Added' });
  });

  it('B — getMetadata() returns filter values + api params', async () => {
    const adapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ mcp: { get_metadata: META_NAS } }) });
    const meta = await adapter.getMetadata('NAS', 5);
    expect(meta.apiParams.length).toBeGreaterThan(0);
    expect(meta.filterValues).toHaveProperty('year');
  });

  it('C — getData() normalizes IIP rows (one observation per measure)', async () => {
    const adapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ dataBody: { data: IIP_ROWS, statusCode: true, msg: 'Data fetched successfully' } }) });
    const obs = await adapter.getData({ dataset: 'IIP', filters: { base_year: '2022-23', frequency: 'Annually' } });
    expect(obs).toHaveLength(4); // 2 rows × 2 measures
    const general = obs.find((o) => o.measure === 'index' && o.indicator === 'General › General');
    expect(general?.value).toBe(117.7);
    expect(general?.baseYear).toBe('2022-23');
    expect(general?.frequency).toBe('Annually');
    expect(general?.referencePeriod).toBe('2025-26');
    const fuel = obs.find((o) => o.measure === 'growth_rate' && o.indicator === 'Sectoral › Mining & Quarrying › Fuel Minerals');
    expect(fuel?.value).toBe(-2.0);
  });

  it('C — getData() normalizes CPI rows and preserves base/status identity', async () => {
    const adapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ dataBody: { data: CPI_ROWS, statusCode: true, msg: 'ok' } }) });
    const obs = await adapter.getData({ dataset: 'CPI', filters: { base_year: '2012', series: 'Current' } });
    expect(obs).toHaveLength(2);
    const idx = obs.find((o) => o.measure === 'index');
    expect(idx?.value).toBe(207.0);
    expect(idx?.baseYear).toBe('2012');
    expect(idx?.series).toBe('Current');
    expect(idx?.referencePeriod).toBe('2025 December');
    expect(idx?.status).toBe('F'); // release/status preserved verbatim
  });

  it('C — getData() normalizes NAS rows (unit + revision preserved)', async () => {
    const adapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ dataBody: { data: NAS_ROWS, statusCode: true, msg: 'ok' } }) });
    const obs = await adapter.getData({ dataset: 'NAS', filters: { base_year: '2022-23', series: 'Current', frequency_code: 'Annually' } });
    expect(obs).toHaveLength(2);
    const cp = obs.find((o) => o.measure === 'current_price');
    expect(cp?.value).toBe(5608471);
    expect(cp?.unit).toBe('₹ Crore');
    expect(cp?.indicator).toBe('Gross Value Added');
    expect(cp?.status).toBe('Second Advance Estimates');
    expect(cp?.frequency).toBe('Annual');
  });

  it('D — provenance and raw dimensions are preserved 1:1', async () => {
    const adapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ dataBody: { data: IIP_ROWS, statusCode: true, msg: 'ok' } }) });
    const obs = await adapter.getData({ dataset: 'IIP', filters: { base_year: '2022-23', frequency: 'Annually' } });
    const first = obs[0];
    expect(first.provenance.source).toBe('MoSPI');
    expect(first.provenance.endpoint).toBe('/api/iip/getIipData');
    expect(first.provenance.freshness).toBe('LIVE');
    expect(first.source).toBe('MoSPI');
    expect(first.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(first.dimensions.index).toBe('117.7'); // raw string kept verbatim
  });

  it('E — NAS revision and CPI status survive normalization', async () => {
    const adapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ dataBody: { data: [...NAS_ROWS, ...CPI_ROWS], statusCode: true, msg: 'ok' } }) });
    // NAS (revision) and CPI (status) are both asserted in their own tests above; here we
    // confirm the fields are non-null when supplied.
    const nas = await adapter.getData({ dataset: 'NAS', filters: { base_year: '2022-23', series: 'Current', frequency_code: 'Annually' } });
    expect(nas[0].status).toBe('Second Advance Estimates');
    const cpiAdapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ dataBody: { data: CPI_ROWS, statusCode: true, msg: 'ok' } }) });
    const cpi = await cpiAdapter.getData({ dataset: 'CPI', filters: { base_year: '2012', series: 'Current' } });
    expect(cpi[0].status).toBe('F');
  });

  it('F — fail-closed: unverified base_year is rejected', async () => {
    const adapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ dataBody: { data: [], statusCode: true, msg: 'ok' } }) });
    await expect(adapter.getData({ dataset: 'IIP', filters: { base_year: '1999-00', frequency: 'Annually' } }))
      .rejects.toMatchObject({ code: 'INVALID_FILTER' });
  });

  it('F — fail-closed: NAS 2022-23 forbids Back series', async () => {
    const adapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ dataBody: { data: [], statusCode: true, msg: 'ok' } }) });
    await expect(adapter.getData({ dataset: 'NAS', filters: { base_year: '2022-23', series: 'Back', frequency_code: 'Annually' } }))
      .rejects.toMatchObject({ code: 'INVALID_FILTER' });
  });

  it('F — fail-closed: IIP requires an explicit frequency', async () => {
    const adapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ dataBody: { data: [], statusCode: true, msg: 'ok' } }) });
    await expect(adapter.getData({ dataset: 'IIP', filters: { base_year: '2022-23' } }))
      .rejects.toMatchObject({ code: 'INVALID_FILTER' });
  });

  it('G — source unavailable (HTTP 500) → SOURCE_UNAVAILABLE', async () => {
    const adapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ dataStatus: 500 }) });
    await expect(adapter.getData({ dataset: 'IIP', filters: { base_year: '2022-23', frequency: 'Annually' } }))
      .rejects.toMatchObject({ code: 'SOURCE_UNAVAILABLE' });
  });

  it('G — statusCode:false → SOURCE_CONTRACT', async () => {
    const adapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ dataBody: { statusCode: false, msg: 'Requested item was not found!' } }) });
    await expect(adapter.getData({ dataset: 'NAS', filters: { base_year: '2022-23', series: 'Current', frequency_code: 'Annually' } }))
      .rejects.toMatchObject({ code: 'SOURCE_CONTRACT' });
  });

  it('G — non-array data → SOURCE_CONTRACT; non-numeric value → null (never fabricated)', async () => {
    const adapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ dataBody: { data: { not: 'an array' }, statusCode: true, msg: 'ok' } }) });
    await expect(adapter.getData({ dataset: 'IIP', filters: { base_year: '2022-23', frequency: 'Annually' } }))
      .rejects.toMatchObject({ code: 'SOURCE_CONTRACT' });

    const badRows = [{ base_year: '2022-23', year: '2025-26', type: 'General', category: 'General', sub_category: '', index: 'N/A', growth_rate: '4.3' }];
    const adapter2 = new MoSPISourceAdapter({ fetchImpl: routedFetch({ dataBody: { data: badRows, statusCode: true, msg: 'ok' } }) });
    const obs = await adapter2.getData({ dataset: 'IIP', filters: { base_year: '2022-23', frequency: 'Annually' } });
    const idx = obs.find((o) => o.measure === 'index');
    expect(idx?.value).toBeNull();
    expect(idx?.dimensions.index).toBe('N/A'); // raw preserved, nothing fabricated
  });

  it('H — excluded datasets are rejected (WPI, RBI, unknown)', async () => {
    const adapter = new MoSPISourceAdapter({ fetchImpl: routedFetch({ dataBody: { data: [], statusCode: true, msg: 'ok' } }) });
    await expect(adapter.getData({ dataset: 'WPI', filters: {} })).rejects.toMatchObject({ code: 'EXCLUDED_DATASET' });
    await expect(adapter.getData({ dataset: 'RBI', filters: {} })).rejects.toMatchObject({ code: 'EXCLUDED_DATASET' });
    await expect(adapter.getIndicators('WPI')).rejects.toMatchObject({ code: 'EXCLUDED_DATASET' });
    await expect(adapter.getIndicators('BOGUS')).rejects.toMatchObject({ code: 'EXCLUDED_DATASET' });
  });

  it('contract sanity — frozen allowlist and IIP current base year', () => {
    expect(APPROVED_DATASETS).toEqual(['NAS', 'CPI', 'IIP']);
    expect(SERIES_POLICY.IIP.baseYears[0]).toBe('2022-23');
    expect(SERIES_POLICY.IIP.series).toBeNull(); // WPI weighting is not a selectable IIP dimension
  });

  it('constructor fails closed when no HTTP transport is available', () => {
    vi.stubGlobal('fetch', undefined);
    expect(() => new MoSPISourceAdapter()).toThrow(MacroSourceError);
  });
});
