/**
 * Program v3.0 — Phase 6: Typed API client for the Portfolio Workspace.
 * Mirrors the certified v2.0 transport DTO. Semantically inert; presentation-only.
 */
import type { Verdict } from '../components/decision/DecisionComponents';
import type { ExecutiveProvenance } from './executive';
import { authFetch } from './authFetch';

export interface PortfolioHolding {
  readonly companyId: string;
  readonly sector: string;
  readonly decision: Verdict;
  readonly composite: number;
  readonly confidence: number | null;
  readonly quality: number;
  readonly risk: number;
  readonly weight: number;
}

export interface PortfolioData {
  readonly portfolio: {
    readonly portfolioId: string;
    readonly scenario: string;
    readonly holdings: number;
    readonly sectorExposure: Readonly<Record<string, number>>;
    readonly concentration: number;
    readonly diversificationScore: number;
    readonly avgConviction: number;
    readonly avgQuality: number;
    readonly avgRisk: number;
  };
  readonly diversification: { readonly band: string; readonly flags: readonly string[] };
  readonly allocation: { readonly strategy: string; readonly recommendation: string; readonly rulesApplied: readonly string[] };
  readonly holdings: readonly PortfolioHolding[];
  readonly opportunity: readonly { readonly companyId: string; readonly sector: string; readonly conviction: number }[];
  readonly correlation: { readonly flags: readonly string[]; readonly concentrationSectors: readonly string[] };
  readonly evidenceRefs: readonly { readonly evidenceId: string; readonly engineId: string; readonly recommendation: string; readonly compositeScore: number }[];
  readonly provenance: ExecutiveProvenance;
}

export async function fetchPortfolioData(baseUrl = ''): Promise<PortfolioData> {
  const res = await authFetch(`${baseUrl}/api/portfolio`);
  if (!res.ok) throw new Error(`portfolio transport returned ${res.status}`);
  return (await res.json()) as PortfolioData;
}
