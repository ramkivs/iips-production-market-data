/**
 * Program v3.0 — WP-MACRO-03: typed API client for the certified Macro read surface.
 *
 * Consumes GET /api/macro (WP-MACRO-02) ONLY — never MoSPI directly. Mirrors the certified
 * MacroObservation / provenance contracts 1:1 (no derivation, no transformation).
 *
 * Dataset selector + default filters are the FROZEN contract (IIPS-WP-MACRO-03-DECISION.md):
 *   - dataset family allowlist = APPROVED_DATASETS (NAS / CPI / IIP) — no discovery endpoint.
 *   - the UI supplies the dataset-specific filters; the server adapter (SERIES_POLICY /
 *     assertValidFilters) remains the validation authority. No adapter-side defaults.
 *   - default filter VALUES below are taken verbatim from the certified adapter contract
 *     (SERIES_POLICY, frontend/server/macro/mospi-source.ts): IIP 2022-23/Annually ·
 *     NAS 2022-23/Current/Annually · CPI 2012/Current. Nothing invented.
 */
import { authFetch } from './authFetch';

/** Frozen approved dataset families (mirrors the certified APPROVED_DATASETS allowlist). */
export const MACRO_DATASETS = ['NAS', 'CPI', 'IIP'] as const;
export type MacroDataset = (typeof MACRO_DATASETS)[number];

export interface MacroEnvelopeProvenance {
  readonly dataSource: string;
  readonly freshness: 'LIVE' | 'SNAPSHOT' | 'STALE' | 'UNAVAILABLE' | 'REPLAY';
  readonly transportSemantics: string;
}

export interface MacroObservationProvenance {
  readonly source: string;
  readonly baseUrl: string;
  readonly endpoint: string;
  readonly freshness: 'LIVE' | 'SNAPSHOT';
  readonly transportSemantics: string;
}

export interface MacroObservation {
  readonly dataset: string;
  readonly indicator: string | null;
  readonly measure: string | null;
  readonly value: number | null;
  readonly unit: string | null;
  readonly frequency: string | null;
  readonly referencePeriod: string | null;
  readonly dimensions: Readonly<Record<string, string | null>>;
  readonly baseYear: string | null;
  readonly series: string | null;
  readonly status: string | null;
  readonly source: string;
  readonly retrievedAt: string;
  readonly provenance: MacroObservationProvenance;
}

export interface MacroData {
  readonly data: readonly MacroObservation[];
  readonly provenance: MacroEnvelopeProvenance;
}

/** Certified dataset-specific default filters (values sourced from SERIES_POLICY — not invented). */
export interface MacroDatasetConfig {
  readonly label: string;
  readonly params: Readonly<Record<string, string>>;
}

export const MACRO_DATASET_CONFIG: Readonly<Record<MacroDataset, MacroDatasetConfig>> = {
  IIP: { label: 'Index of Industrial Production', params: { base_year: '2022-23', frequency: 'Annually' } },
  NAS: { label: 'National Accounts Statistics', params: { base_year: '2022-23', series: 'Current', frequency_code: 'Annually' } },
  CPI: { label: 'Consumer Price Index', params: { base_year: '2012', series: 'Current' } },
};

/**
 * Client-side error carrying the certified API error code so the UI can distinguish
 * INVALID_FILTER (422) / EXCLUDED_DATASET (422) / SOURCE_CONTRACT (502) / SOURCE_UNAVAILABLE (503).
 */
export class MacroApiError extends Error {
  constructor(readonly code: string, readonly status: number, message: string) {
    super(message);
    this.name = 'MacroApiError';
  }
}

export async function fetchMacroData(
  dataset: MacroDataset,
  params: Readonly<Record<string, string>> = MACRO_DATASET_CONFIG[dataset].params,
  baseUrl = '',
): Promise<MacroData> {
  const query = new URLSearchParams({ dataset, ...params });
  const res = await authFetch(`${baseUrl}/api/macro?${query.toString()}`);
  if (!res.ok) {
    let code = '';
    let detail = '';
    try {
      const body = (await res.json()) as { code?: string; error?: string };
      code = body.code ?? '';
      detail = body.error ?? '';
    } catch {
      /* non-JSON error body — fall through to the status message */
    }
    throw new MacroApiError(code || String(res.status), res.status, detail || `macro transport returned ${res.status}`);
  }
  return (await res.json()) as MacroData;
}
