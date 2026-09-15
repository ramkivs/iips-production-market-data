/**
 * Program v3.0 — Phase 8: Typed API client for Cross-Sector Intelligence.
 * Mirrors the certified CSIP transport DTO. Semantically inert; presentation-only.
 *
 * D96: Widened return type to represent successful CrossSectorData | DegradedData.
 */
import type { Verdict } from '../components/decision/DecisionComponents';
import type { ExecutiveProvenance } from './executive';
import type { DegradedData } from './dataMode';
import { authFetch } from './authFetch';

export interface CrossSectorData {
  readonly dataAvailable?: undefined;
  readonly portfolio: {
    readonly portfolioId: string;
    readonly scenario: string;
    readonly holdings: number;
    readonly avgConviction: number;
    readonly avgQuality: number;
    readonly avgRisk: number;
    readonly concentration: number;
    readonly diversificationScore: number;
  };
  readonly diversification: { readonly band: string; readonly flags: readonly string[] };
  readonly ranking: readonly { readonly companyId: string; readonly sector: string; readonly conviction: number }[];
  readonly opportunity: readonly { readonly companyId: string; readonly sector: string; readonly conviction: number }[];
  readonly correlation: { readonly flags: readonly string[]; readonly concentrationSectors: readonly string[] };
  readonly decisions: readonly { readonly sector: string; readonly verdict: Verdict; readonly composite: number; readonly confidence: number | null }[];
  readonly provenance: ExecutiveProvenance;
}

export type CrossSectorResponse = CrossSectorData | DegradedData;

export async function fetchCrossSectorData(baseUrl = ''): Promise<CrossSectorResponse> {
  const res = await authFetch(`${baseUrl}/api/cross-sector`);
  if (!res.ok) throw new Error(`cross-sector transport returned ${res.status}`);
  return (await res.json()) as CrossSectorResponse;
}
