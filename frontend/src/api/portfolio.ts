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

/**
 * D86 — governed degraded Portfolio response (D85 contract, consumer side).
 *
 * `/api/portfolio` honours the authenticated principal's UI12 `defaultDataMode`. For LIVE and
 * PIT the server returns this shape instead of portfolio data: **no `portfolio` object, no
 * holdings, no fallback to SNAPSHOT and no substituted provider values** (D85 A–C).
 *
 * ⚠ Mirrors the server contract 1:1 and does NOT alter it. The consumer must narrow on
 *   `dataAvailable` BEFORE dereferencing any SNAPSHOT-only field.
 */
export interface PortfolioUnavailableData {
  readonly dataMode: 'LIVE' | 'PIT';
  readonly state: 'LIVE_UNAVAILABLE' | 'PIT_UNAVAILABLE';
  /** Literal `false` — the discriminant. This response carries NO portfolio data. */
  readonly dataAvailable: false;
  readonly holdings: readonly [];
  /** Server-authored explanation, rendered verbatim. */
  readonly reason: string;
  /** Server-authored blocking dependency (e.g. R-2), rendered verbatim. */
  readonly dependency: string;
  readonly provenance: {
    readonly dataSource: string;
    readonly freshness: string;
    readonly mode: 'LIVE' | 'PIT';
    readonly transportSemantics: string;
  };
}

/** The certified SNAPSHOT payload — unchanged by D86. */
export interface PortfolioSnapshotData {
  readonly dataAvailable?: undefined;
  readonly portfolio: {
    readonly portfolioId: string;
    readonly name?: string;
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

/**
 * D86 — discriminated union on `dataAvailable`.
 *
 * TypeScript now FORCES the consumer to narrow before touching `portfolio`, so the LIVE/PIT
 * degraded response can no longer reach a SNAPSHOT-only dereference at compile time.
 */
export type PortfolioData = PortfolioSnapshotData | PortfolioUnavailableData;

/** Narrowing helper — true when the server returned a governed degraded state. */
export function isPortfolioUnavailable(d: PortfolioData): d is PortfolioUnavailableData {
  return (d as PortfolioUnavailableData).dataAvailable === false;
}

export async function fetchPortfolioData(baseUrl = ''): Promise<PortfolioData> {
  const res = await authFetch(`${baseUrl}/api/portfolio`);
  if (!res.ok) throw new Error(`portfolio transport returned ${res.status}`);
  return (await res.json()) as PortfolioData;
}

export interface UserHoldingInput {
  readonly symbol?: string;
  readonly canonicalSecurityId?: string;
  readonly figi?: string;
  readonly isin?: string;
  readonly sector?: string;
  readonly weight: number;
}

export interface UserPortfolioPayload {
  readonly portfolioId?: string;
  readonly name: string;
  readonly holdings: readonly UserHoldingInput[];
}

export interface UserPortfolioSummary {
  readonly portfolioId: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly holdings: readonly unknown[];
}

export async function fetchUserPortfolio(portfolioId: string, baseUrl = ''): Promise<PortfolioData> {
  const res = await authFetch(`${baseUrl}/api/portfolio?portfolioId=${encodeURIComponent(portfolioId)}`);
  if (!res.ok) throw new Error(`portfolio transport returned ${res.status}`);
  return (await res.json()) as PortfolioData;
}

export async function listUserPortfolios(baseUrl = ''): Promise<readonly UserPortfolioSummary[]> {
  const res = await authFetch(`${baseUrl}/api/portfolio?list=true`);
  if (!res.ok) throw new Error(`portfolio transport returned ${res.status}`);
  const json = (await res.json()) as { portfolios: readonly UserPortfolioSummary[] };
  return json.portfolios ?? [];
}

export async function saveUserPortfolio(payload: UserPortfolioPayload, baseUrl = ''): Promise<PortfolioData> {
  const res = await authFetch(`${baseUrl}/api/portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `portfolio save returned ${res.status}`);
  }
  return (await res.json()) as PortfolioData;
}

export async function deleteUserPortfolio(portfolioId: string, baseUrl = ''): Promise<{ deleted: boolean }> {
  const res = await authFetch(`${baseUrl}/api/portfolio/${encodeURIComponent(portfolioId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`portfolio delete returned ${res.status}`);
  return (await res.json()) as { deleted: boolean };
}
