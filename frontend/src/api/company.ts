/**
 * Program v3.0 — Phase 7: Typed API client for the Company Intelligence workspace.
 * Mirrors the certified v2.0 transport DTO. Semantically inert; presentation-only.
 * Pillars are null where the certified engine does not expose them (never fabricated).
 */
import type { Verdict } from '../components/decision/DecisionComponents';
import type { ExecutiveProvenance } from './executive';
import type { DegradedData, PitVintageData } from './dataMode';
import { authFetch } from './authFetch';

export interface CompanyData {
  readonly companyId: string;
  readonly sector: string;
  readonly decision: { readonly verdict: Verdict; readonly composite: number; readonly confidence: number | null };
  readonly overrides: readonly string[];
  readonly pillars: Readonly<Record<string, number>> | null;
  readonly resolvedSubsegment: string | null;
  readonly resolvedArchetype: string | null;
  readonly calibrationVersion: string | null;
  readonly inputs: readonly { readonly key: string; readonly value: unknown }[];
  readonly evidence: { readonly evidenceId: string; readonly engineId: string; readonly recommendation: string; readonly compositeScore: number };
  readonly provenance: ExecutiveProvenance;
}

export async function fetchCompanyData(sector: string, baseUrl = ''): Promise<CompanyData> {
  const res = await authFetch(`${baseUrl}/api/company/${encodeURIComponent(sector)}`);
  if (!res.ok) throw new Error(`company transport returned ${res.status}`);
  return (await res.json()) as CompanyData;
}

/**
 * D-PIT-WIRE-01 — the mode-aware company payload, UNINTERPRETED.
 *
 * The caller MUST discriminate before use:
 *   • isPitVintage(payload) → governed PIT vintage (render via PitVintagePanel);
 *   • isDegraded(payload)   → governed degraded state (render via DataModeUnavailable);
 *   • otherwise             → the certified SNAPSHOT CompanyData shape.
 * Mode (and asOf selection under PIT) is resolved SERVER-SIDE; this client sends no mode
 * and no asOf — the server derives both from the authenticated principal's request.
 */
export type CompanyPayload = CompanyData | DegradedData | PitVintageData;

export async function fetchCompanyPayload(
  sector: string,
  asOf?: string,
  baseUrl = '',
): Promise<CompanyPayload> {
  // D-PIT-WIRE-01: asOf is forwarded ONLY as a data-selection instant. No client-supplied
  // mode exists; the server still resolves UI12 mode from the authenticated principal and
  // refuses asOf under SNAPSHOT/LIVE. `URLSearchParams` performs the only encoding.
  const query = asOf === undefined ? '' : `?${new URLSearchParams({ asOf }).toString()}`;
  const res = await authFetch(`${baseUrl}/api/company/${encodeURIComponent(sector)}${query}`);
  if (!res.ok) throw new Error(`company transport returned ${res.status}`);
  return (await res.json()) as CompanyPayload;
}
