/**
 * Program v3.0 — Phase 7: Typed API client for the Company Intelligence workspace.
 *
 * ADAPTER of the donor `api/company.ts`. Mirrors the certified v2.0 transport DTO.
 * Semantically inert; presentation-only. Pillars are null where the certified engine does
 * not expose them (never fabricated).
 *
 * ══ SCOPE ADAPTATIONS (Prompt 2C) ══════════════════════════════════════════════════════════
 *   · The donor's `fetchCompanyPayload` / `CompanyPayload` PIT-vintage variant was NOT carried
 *     over: this gate is SNAPSHOT-only, `asOf` is not supported, and no PIT client type is
 *     introduced (PitVintageProvider / data-mode PIT branch EXCLUDED).
 *   · `fetchCompanyData` is otherwise the donor body verbatim, plus the current-lineage
 *     NodeNext `.js` import specifiers.
 *
 * The four read authorities are served over HTTP by the current-lineage server transport
 * (`frontend/server/research-sector-transport.ts`). Browser code reaches them through
 * `authFetch` only — no server module is ever imported here.
 */
import type { Verdict } from '../components/decision/DecisionComponents.js';
import type { ExecutiveProvenance } from './executive.js';
import { authFetch } from './authFetch.js';

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

/**
 * GET /api/company/:sector — the certified SNAPSHOT company payload.
 *
 * SNAPSHOT-only: no `asOf` is sent, because `asOf` is a PIT data-selection parameter and the
 * server refuses it under SNAPSHOT rather than ignoring it. There is no client-side mode.
 */
export async function fetchCompanyData(sector: string, baseUrl = ''): Promise<CompanyData> {
  const res = await authFetch(`${baseUrl}/api/company/${encodeURIComponent(sector)}`);
  if (!res.ok) throw new Error(`company transport returned ${res.status}`);
  return (await res.json()) as CompanyData;
}
