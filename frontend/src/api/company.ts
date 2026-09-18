/**
 * Program v3.0 — Phase 7: Typed API client for the Company Intelligence workspace.
 * Mirrors the certified v2.0 transport DTO. Semantically inert; presentation-only.
 * Pillars are null where the certified engine does not expose them (never fabricated).
 */
import type { Verdict } from '../components/decision/DecisionComponents';
import type { ExecutiveProvenance } from './executive';
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
