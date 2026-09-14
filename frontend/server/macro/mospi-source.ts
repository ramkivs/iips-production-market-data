/**
 * Program v3.0 — WP-MACRO-01: MoSPI / National Statistical Office source adapter.
 *
 * A SOURCE / NORMALIZATION component ONLY — not a Macro intelligence engine, not a UI,
 * not an API surface. This file implements the approved Macro Context source-adapter layer:
 *
 *   1. the official MoSPI/eSankhyiki discovery model:
 *        listDatasets() → getIndicators(dataset) → getMetadata(dataset, …) → getData(dataset, filters)
 *      (the first three methods are served by the official MoSPI MCP endpoint at
 *       https://mcp.mospi.gov.in — tool names list_datasets / get_indicators / get_metadata;
 *       verified live on 2026-08-21),
 *   2. data retrieval against the authoritative MoSPI API (https://api.mospi.gov.in) using the
 *      official endpoint map (nso-india/esankhyiki-mcp `mospi/client.py`), and
 *   3. fail-closed normalization of raw rows into the normalized MacroObservation contract.
 *
 * APPROVED v1 dataset families (frozen contract): NAS, CPI, IIP.
 * EXPLICITLY EXCLUDED (fail-closed): WPI, RBI, and every other dataset.
 *
 * No indicator/filter codes are invented here: indicator identities and dimension values are
 * taken verbatim from authoritative rows; the series policy below records only the base
 * years / series / frequencies that were VERIFIED against the live authoritative metadata on
 * 2026-08-21 (see the implementation report). If authoritative metadata conflicts with this
 * frozen contract, the adapter fails closed with a MacroSourceError — it never silently
 * adapts, substitutes, or synthesizes.
 */

// ---------------------------------------------------------------------------
// Errors (controlled, fail-closed)
// ---------------------------------------------------------------------------

export type MacroSourceErrorCode =
  | 'SOURCE_UNAVAILABLE' // live source unreachable or HTTP failure
  | 'SOURCE_CONTRACT' // authoritative metadata/response conflicts with the frozen contract
  | 'EXCLUDED_DATASET' // a dataset outside the approved {NAS, CPI, IIP} families
  | 'INVALID_FILTER'; // a filter/dimension outside the verified series policy

export class MacroSourceError extends Error {
  constructor(readonly code: MacroSourceErrorCode, message: string) {
    super(message);
    this.name = 'MacroSourceError';
  }
}

// ---------------------------------------------------------------------------
// Frozen contract (WP-MACRO-01)
// ---------------------------------------------------------------------------

/** Source identifier recorded on every observation's provenance. */
export const SOURCE_ID = 'MoSPI';

export const APPROVED_DATASETS = ['NAS', 'CPI', 'IIP'] as const;
export type ApprovedDataset = (typeof APPROVED_DATASETS)[number];

/** Datasets known to exist in the MoSPI API but explicitly OUT of the approved v1 contract. */
export const EXCLUDED_DATASETS: readonly string[] = ['WPI', 'RBI'];

/**
 * Authoritative data endpoints (verified from nso-india/esankhyiki-mcp `mospi/client.py`).
 * CPI v1 uses the group/state-level endpoint; item-level routing is out of v1 scope.
 */
const DATA_ENDPOINTS: Readonly<Record<ApprovedDataset, string>> = {
  NAS: '/api/nas/getNASData',
  CPI: '/api/cpi/getCPIIndex',
  IIP: '/api/iip/getIipData',
};

export interface SeriesPolicy {
  /** Verified base-year identities, as exposed by the live authoritative metadata. */
  readonly baseYears: readonly string[];
  /** Verified series identities (Current/Back) where the dataset exposes a series dimension. */
  readonly series: readonly string[] | null;
  /** Verified frequency values where the dataset exposes a frequency dimension. */
  readonly frequencies: readonly string[] | null;
  /** Series values permitted per base year (verified). Missing base year → all series allowed. */
  readonly seriesByBaseYear?: Readonly<Record<string, readonly string[]>>;
}

/**
 * Series policy — verified against live MoSPI authoritative metadata on 2026-08-21:
 *   - IIP get_indicators returned base_year = ["2022-23","2011-12","2004-05","1993-94"];
 *     live get_data with base_year=2022-23 returned records (current accepted series).
 *     frequency is required (Annually | Monthly). No series dimension (WPI-based weighting
 *     is not selectable inside the IIP endpoint — the WPI DATASET is excluded wholesale).
 *   - CPI get_indicators returned base_year = ["2010","2012","2024"], series Current/Back.
 *     CPI has no frequency parameter (rows carry year + month).
 *   - NAS get_metadata api_params: base_year ["2022-23","2011-12"], series Current/Back with
 *     2022-23 → Current only; frequency_code Annually/Quarterly.
 */
export const SERIES_POLICY: Readonly<Record<ApprovedDataset, SeriesPolicy>> = {
  NAS: {
    baseYears: ['2022-23', '2011-12'],
    series: ['Current', 'Back'],
    frequencies: ['Annually', 'Quarterly'],
    seriesByBaseYear: { '2022-23': ['Current'], '2011-12': ['Current', 'Back'] },
  },
  CPI: {
    baseYears: ['2012', '2010', '2024'],
    series: ['Current', 'Back'],
    frequencies: null,
  },
  IIP: {
    baseYears: ['2022-23', '2011-12', '2004-05', '1993-94'],
    series: null,
    frequencies: ['Annually', 'Monthly'],
  },
};

// ---------------------------------------------------------------------------
// Normalized contract
// ---------------------------------------------------------------------------

export interface MacroProvenance {
  readonly source: string; // 'MoSPI'
  readonly baseUrl: string;
  readonly endpoint: string;
  readonly freshness: 'LIVE' | 'SNAPSHOT';
  readonly transportSemantics: '1:1 normalization; no derivation';
}

/**
 * Minimum normalized macro observation. Value-bearing fields are preserved where supplied by
 * the authority; nothing is manufactured (missing → null, raw values kept in `dimensions`).
 */
export interface MacroObservation {
  readonly dataset: string;
  /** Stable indicator identity composed from authoritative identity fields (never invented). */
  readonly indicator: string | null;
  /** The authoritative value-field name this observation was normalized from. */
  readonly measure: string | null;
  /** Parsed numeric value; null when the authority supplied none or a non-numeric value. */
  readonly value: number | null;
  /** Unit supplied by the authority only (e.g. NAS '₹ Crore'); never invented. */
  readonly unit: string | null;
  /** Frequency where supplied (NAS row.frequency, IIP request frequency); else null. */
  readonly frequency: string | null;
  /** Reference period as supplied (year, or year + month). */
  readonly referencePeriod: string | null;
  /** ALL remaining authoritative row fields, verbatim (strings; null when absent). */
  readonly dimensions: Readonly<Record<string, string | null>>;
  readonly baseYear: string | null;
  readonly series: string | null;
  /** Release/publication status where supplied (NAS `revision`, CPI `status`). */
  readonly status: string | null;
  readonly source: string;
  /** Adapter fetch time (ISO-8601). */
  readonly retrievedAt: string;
  readonly provenance: MacroProvenance;
}

// ---------------------------------------------------------------------------
// Discovery result types
// ---------------------------------------------------------------------------

export interface DatasetCatalogEntry {
  readonly name: string;
  readonly description: string;
  readonly useFor: string;
  /** true when the dataset is outside the approved {NAS, CPI, IIP} families. */
  readonly excluded: boolean;
}

export interface DatasetCatalog {
  readonly totalDatasets: number;
  readonly datasets: Readonly<Record<string, DatasetCatalogEntry>>;
}

export interface IndicatorCatalog {
  readonly baseYears: readonly string[] | null;
  readonly frequencies: readonly string[] | null;
  readonly series: readonly string[] | null;
  readonly indicators: readonly { readonly code: number | string; readonly name: string }[] | null;
  readonly note: string | null;
}

export interface MetadataCatalog {
  readonly filterValues: Readonly<Record<string, unknown>>;
  readonly apiParams: readonly unknown[];
  readonly note: string | null;
}

export interface MacroDataQuery {
  readonly dataset: string;
  readonly filters: Readonly<Record<string, string | number>>;
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export interface MoSPISourceAdapterOptions {
  /** Raw MoSPI API base (authoritative). */
  readonly baseUrl?: string;
  /** Official MoSPI MCP endpoint (discovery model). */
  readonly mcpUrl?: string;
  /** Injectable HTTP transport (tests supply a mock; default = global fetch). */
  readonly fetchImpl?: typeof fetch;
}

type Row = Record<string, unknown>;

function isApprovedDataset(dataset: string): dataset is ApprovedDataset {
  return (APPROVED_DATASETS as readonly string[]).includes(dataset);
}

/** Parse a numeric value without ever fabricating: NaN / null / empty → null. */
function parseNum(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

export class MoSPISourceAdapter {
  private readonly baseUrl: string;
  private readonly mcpUrl: string;
  private readonly fetchImpl: typeof fetch;
  private mcpId = 0;

  constructor(opts: MoSPISourceAdapterOptions = {}) {
    this.baseUrl = opts.baseUrl ?? 'https://api.mospi.gov.in';
    this.mcpUrl = opts.mcpUrl ?? 'https://mcp.mospi.gov.in';
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
    if (typeof this.fetchImpl !== 'function') {
      // The live source also requires legacy-TLS handling at the transport layer (the official
      // MoSPI client mounts a custom SSL adapter); the runtime must supply a capable fetcher.
      throw new MacroSourceError('SOURCE_UNAVAILABLE', 'No HTTP transport available for the MoSPI source adapter');
    }
  }

  // -- Discovery model -------------------------------------------------------

  /** Step 1 — list all MoSPI datasets (approved families flagged; the rest marked excluded). */
  async listDatasets(): Promise<DatasetCatalog> {
    const payload = await this.mcpCall('list_datasets', {}) as {
      total_datasets?: number;
      datasets?: Record<string, { name?: string; description?: string; use_for?: string }>;
    };
    if (!payload.datasets || typeof payload.datasets !== 'object') {
      throw new MacroSourceError('SOURCE_CONTRACT', 'list_datasets returned no datasets catalog');
    }
    const datasets: Record<string, DatasetCatalogEntry> = {};
    for (const [key, d] of Object.entries(payload.datasets)) {
      datasets[key] = {
        name: d.name ?? key,
        description: d.description ?? '',
        useFor: d.use_for ?? '',
        excluded: !isApprovedDataset(key),
      };
    }
    return { totalDatasets: payload.total_datasets ?? Object.keys(datasets).length, datasets };
  }

  /** Step 2 — indicator / dimension discovery for one APPROVED dataset (fail-closed otherwise). */
  async getIndicators(dataset: string): Promise<IndicatorCatalog> {
    this.assertApprovedDataset(dataset);
    const payload = await this.mcpCall('get_indicators', { dataset }) as {
      data?: {
        base_year?: { base_year?: string }[];
        frequency?: { frequency?: string }[];
        series?: { series?: string }[];
        indicator?: { indicator_code?: number | string; name?: string }[];
      };
      _note?: string;
    };
    const data = payload.data ?? {};
    return {
      baseYears: data.base_year ? data.base_year.map((b) => b.base_year ?? null).filter((x): x is string => x !== null) : null,
      frequencies: data.frequency ? data.frequency.map((f) => f.frequency ?? null).filter((x): x is string => x !== null) : null,
      series: data.series ? data.series.map((s) => s.series ?? null).filter((x): x is string => x !== null) : null,
      indicators: data.indicator
        ? data.indicator.map((i) => ({ code: i.indicator_code ?? '', name: i.name ?? '' }))
        : null,
      note: payload._note ?? null,
    };
  }

  /** Step 3 — valid filter values + api params for one APPROVED dataset/indicator. */
  async getMetadata(dataset: string, indicatorCode?: number | string, baseYear?: string): Promise<MetadataCatalog> {
    this.assertApprovedDataset(dataset);
    const args: Record<string, unknown> = { dataset };
    if (indicatorCode !== undefined) args.indicator_code = indicatorCode;
    if (baseYear !== undefined) args.base_year = baseYear;
    const payload = await this.mcpCall('get_metadata', args) as {
      data?: Record<string, unknown>;
      api_params?: unknown[];
      _note?: string;
    };
    return { filterValues: payload.data ?? {}, apiParams: payload.api_params ?? [], note: payload._note ?? null };
  }

  /** Step 4 — fetch + normalize data for one APPROVED dataset (validated against the frozen policy). */
  async getData(query: MacroDataQuery): Promise<MacroObservation[]> {
    const dataset = query.dataset;
    this.assertApprovedDataset(dataset);
    this.assertValidFilters(dataset, query.filters);

    const endpoint = DATA_ENDPOINTS[dataset];
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query.filters)) params.set(k, String(v));
    params.set('Format', 'JSON');

    const retrievedAt = new Date().toISOString();
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl}${endpoint}?${params.toString()}`);
    } catch {
      throw new MacroSourceError('SOURCE_UNAVAILABLE', `MoSPI API unreachable: ${endpoint}`);
    }
    if (!res.ok) {
      throw new MacroSourceError('SOURCE_UNAVAILABLE', `MoSPI API returned ${res.status} for ${endpoint}`);
    }
    const body = (await res.json()) as { data?: unknown; statusCode?: boolean; msg?: string };
    if (body.statusCode === false) {
      throw new MacroSourceError('SOURCE_CONTRACT', `MoSPI rejected the request: ${body.msg ?? 'no message'}`);
    }
    if (!Array.isArray(body.data)) {
      throw new MacroSourceError('SOURCE_CONTRACT', `MoSPI returned no data array for ${dataset}`);
    }

    const provenance: MacroProvenance = {
      source: SOURCE_ID,
      baseUrl: this.baseUrl,
      endpoint,
      freshness: 'LIVE',
      transportSemantics: '1:1 normalization; no derivation',
    };
    return (body.data as Row[]).flatMap((row) => this.normalizeRow(dataset, row, query.filters, retrievedAt, provenance));
  }

  // -- Validation (fail-closed) ---------------------------------------------

  private assertApprovedDataset(dataset: string): asserts dataset is ApprovedDataset {
    if (EXCLUDED_DATASETS.includes(dataset)) {
      throw new MacroSourceError('EXCLUDED_DATASET', `Dataset '${dataset}' is explicitly excluded from the approved Macro v1 contract`);
    }
    if (!isApprovedDataset(dataset)) {
      throw new MacroSourceError('EXCLUDED_DATASET', `Dataset '${dataset}' is outside the approved Macro v1 families (NAS, CPI, IIP)`);
    }
  }

  private assertValidFilters(dataset: ApprovedDataset, filters: Readonly<Record<string, string | number>>): void {
    const policy = SERIES_POLICY[dataset];
    const baseYear = filters.base_year !== undefined ? String(filters.base_year) : null;
    const series = filters.series !== undefined ? String(filters.series) : null;
    const frequency = filters.frequency !== undefined ? String(filters.frequency) : null;

    if (baseYear !== null && !policy.baseYears.includes(baseYear)) {
      throw new MacroSourceError('INVALID_FILTER', `base_year '${baseYear}' is not a verified ${dataset} base year (${policy.baseYears.join(', ')})`);
    }
    if (series !== null) {
      if (policy.series === null) {
        throw new MacroSourceError('INVALID_FILTER', `${dataset} exposes no series dimension; received series '${series}'`);
      }
      if (!policy.series.includes(series)) {
        throw new MacroSourceError('INVALID_FILTER', `series '${series}' is not a verified ${dataset} series (${policy.series.join(', ')})`);
      }
      const allowed = policy.seriesByBaseYear?.[baseYear ?? ''];
      if (allowed && !allowed.includes(series)) {
        throw new MacroSourceError('INVALID_FILTER', `series '${series}' is not available for ${dataset} base_year '${baseYear}' (allowed: ${allowed.join(', ')})`);
      }
    }
    if (frequency !== null) {
      if (policy.frequencies === null) {
        throw new MacroSourceError('INVALID_FILTER', `${dataset} exposes no frequency dimension; received frequency '${frequency}'`);
      }
      if (!policy.frequencies.includes(frequency)) {
        throw new MacroSourceError('INVALID_FILTER', `frequency '${frequency}' is not a verified ${dataset} frequency (${policy.frequencies.join(', ')})`);
      }
    }
    // IIP requires an explicit frequency (authoritative api_params: frequency is required).
    if (dataset === 'IIP' && frequency === null) {
      throw new MacroSourceError('INVALID_FILTER', 'IIP requires an explicit frequency (Annually | Monthly)');
    }
  }

  // -- Normalization (1:1; nothing derived or fabricated) --------------------

  private normalizeRow(
    dataset: ApprovedDataset,
    row: Row,
    filters: Readonly<Record<string, string | number>>,
    retrievedAt: string,
    provenance: MacroProvenance,
  ): MacroObservation[] {
    switch (dataset) {
      case 'IIP': return this.normalizeIIP(row, filters, retrievedAt, provenance);
      case 'CPI': return this.normalizeCPI(row, filters, retrievedAt, provenance);
      case 'NAS': return this.normalizeNAS(row, filters, retrievedAt, provenance);
    }
  }

  private base(dataset: string, indicator: string | null, measure: string | null, value: number | null, unit: string | null, frequency: string | null, referencePeriod: string | null, dimensions: Record<string, string | null>, baseYear: string | null, series: string | null, status: string | null, retrievedAt: string, provenance: MacroProvenance): MacroObservation {
    return { dataset, indicator, measure, value, unit, frequency, referencePeriod, dimensions, baseYear, series, status, source: SOURCE_ID, retrievedAt, provenance };
  }

  private normalizeIIP(row: Row, filters: Readonly<Record<string, string | number>>, retrievedAt: string, provenance: MacroProvenance): MacroObservation[] {
    // Authoritative IIP row fields: base_year, year, type, category, sub_category, index, growth_rate.
    const type = toString(row.type);
    const category = toString(row.category);
    const subCategory = toString(row.sub_category);
    const indicator = [type, category, subCategory].filter((x): x is string => x !== null && x !== '').join(' › ') || null;
    const dimensions: Record<string, string | null> = {
      type: type,
      category: category,
      sub_category: subCategory,
      index: toString(row.index),
      growth_rate: toString(row.growth_rate),
    };
    const measures: Array<{ measure: string; raw: unknown }> = [
      { measure: 'index', raw: row.index },
      { measure: 'growth_rate', raw: row.growth_rate },
    ];
    return measures.map((m) => this.base('IIP', indicator, m.measure, parseNum(m.raw), null, toString(filters.frequency), toString(row.year), { ...dimensions }, toString(row.base_year), null, null, retrievedAt, provenance));
  }

  private normalizeCPI(row: Row, filters: Readonly<Record<string, string | number>>, retrievedAt: string, provenance: MacroProvenance): MacroObservation[] {
    // Authoritative CPI row fields: baseyear, year, month, state, sector, group, subgroup, index, inflation, status.
    const state = toString(row.state);
    const sector = toString(row.sector);
    const group = toString(row.group);
    const subgroup = toString(row.subgroup);
    const indicator = [state, sector, group, subgroup].filter((x): x is string => x !== null && x !== '').join(' › ') || null;
    const referencePeriod = [toString(row.year), toString(row.month)].filter((x): x is string => x !== null && x !== '').join(' ') || null;
    const dimensions: Record<string, string | null> = {
      state: state,
      sector: sector,
      group: group,
      subgroup: subgroup,
      month: toString(row.month),
      index: toString(row.index),
      inflation: toString(row.inflation),
    };
    const measures: Array<{ measure: string; raw: unknown }> = [
      { measure: 'index', raw: row.index },
      { measure: 'inflation', raw: row.inflation },
    ];
    return measures.map((m) => this.base('CPI', indicator, m.measure, parseNum(m.raw), null, null, referencePeriod, { ...dimensions }, toString(row.baseyear), toString(filters.series), toString(row.status), retrievedAt, provenance));
  }

  private normalizeNAS(row: Row, filters: Readonly<Record<string, string | number>>, retrievedAt: string, provenance: MacroProvenance): MacroObservation[] {
    // Authoritative NAS row fields: base_year, series, year, indicator, frequency, revision,
    // industry, subindustry, institutional_sector, quarter, current_price, constant_price, unit.
    const indicator = toString(row.indicator);
    const dimensions: Record<string, string | null> = {
      indicator: indicator,
      industry: toString(row.industry),
      subindustry: toString(row.subindustry),
      institutional_sector: toString(row.institutional_sector),
      quarter: toString(row.quarter),
      revision: toString(row.revision),
      current_price: toString(row.current_price),
      constant_price: toString(row.constant_price),
    };
    const unit = toString(row.unit);
    const measures: Array<{ measure: string; raw: unknown }> = [
      { measure: 'current_price', raw: row.current_price },
      { measure: 'constant_price', raw: row.constant_price },
    ];
    return measures.map((m) => this.base('NAS', indicator, m.measure, parseNum(m.raw), unit, toString(row.frequency), toString(row.year), { ...dimensions }, toString(row.base_year), toString(row.series), toString(row.revision), retrievedAt, provenance));
  }

  // -- Minimal MCP JSON-RPC transport (official discovery endpoint) ----------

  private async mcpCall(method: string, params: Record<string, unknown>): Promise<unknown> {
    const id = ++this.mcpId;
    let res: Response;
    try {
      res = await this.fetchImpl(this.mcpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
      });
    } catch {
      throw new MacroSourceError('SOURCE_UNAVAILABLE', `MoSPI MCP endpoint unreachable: ${this.mcpUrl}`);
    }
    if (!res.ok) {
      throw new MacroSourceError('SOURCE_UNAVAILABLE', `MoSPI MCP endpoint returned ${res.status}`);
    }
    const text = await res.text();
    const dataLines = text.split(/\r?\n/).filter((l) => l.startsWith('data: '));
    if (dataLines.length === 0) {
      throw new MacroSourceError('SOURCE_CONTRACT', `MoSPI MCP '${method}' returned no data event`);
    }
    const payload = JSON.parse(dataLines[dataLines.length - 1].slice('data: '.length)) as {
      error?: { message?: string };
      result?: { content?: Array<{ text?: string }> };
    };
    if (payload.error) {
      throw new MacroSourceError('SOURCE_CONTRACT', `MoSPI MCP '${method}' error: ${payload.error.message ?? 'unknown'}`);
    }
    const textContent = payload.result?.content?.[0]?.text;
    if (textContent === undefined) {
      throw new MacroSourceError('SOURCE_CONTRACT', `MoSPI MCP '${method}' returned no text content`);
    }
    try {
      return JSON.parse(textContent);
    } catch {
      return textContent;
    }
  }
}
