/**
 * Program v3.0 — Phase 5: Typed API client for the Executive Dashboard.
 *
 * Mirrors the certified v2.0 transport DTO. Semantically inert: the client maps certified
 * results to the UI; it never computes scores/confidence/rankings/thresholds.
 * Presentation-only. No business logic.
 */
import type { Verdict } from '../components/decision/DecisionComponents';
import { authFetch } from './authFetch';

export interface PortfolioSummary {
  readonly portfolioId: string;
  readonly scenario: string;
  readonly holdings: number;
  readonly sectorExposure: Readonly<Record<string, number>>;
  readonly concentration: number;
  readonly diversificationScore: number;
  readonly avgConviction: number;
  readonly avgQuality: number;
  readonly avgRisk: number;
}

export interface Diversification {
  readonly band: string;
  readonly flags: readonly string[];
}

export interface RankedSector {
  readonly companyId: string;
  readonly sector: string;
  readonly conviction: number;
}

export interface DecisionSummary {
  readonly sector: string;
  readonly verdict: Verdict;
  readonly composite: number;
  readonly confidence: number | null;
}

export interface ExecutiveProvenance {
  readonly dataSource: string;
  readonly freshness: 'LIVE' | 'SNAPSHOT' | 'STALE' | 'UNAVAILABLE' | 'REPLAY';
  readonly calibratedAt: string;
  readonly transportSemantics: string;
}

export interface ExecutiveData {
  readonly portfolio: PortfolioSummary;
  readonly diversification: Diversification;
  readonly ranking: readonly RankedSector[];
  readonly opportunity: readonly RankedSector[];
  readonly correlation: { readonly flags: readonly string[]; readonly concentrationSectors: readonly string[] };
  readonly decisions: readonly DecisionSummary[];
  readonly provenance: ExecutiveProvenance;
}

/** Fetch the certified executive data from the v3.0 transport. */
export async function fetchExecutiveData(baseUrl = ''): Promise<ExecutiveData> {
  const res = await authFetch(`${baseUrl}/api/executive`);
  if (!res.ok) throw new Error(`executive transport returned ${res.status}`);
  return (await res.json()) as ExecutiveData;
}
