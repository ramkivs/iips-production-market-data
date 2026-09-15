/**
 * UI08 — typed API client for the governed Reports surface.
 *
 * Authority: D82 (UI08 Reports recovery). Requirement: INT-012 / D4_01 / D4_03.
 *
 * Mirrors the server contract 1:1 — no derivation, no transformation, no client-side authority.
 *
 * Recorded constraints reflected here:
 *   - Tenant and owner are SERVER-DERIVED. The client never supplies identity.
 *   - Report CONTENT is produced by the platform ReportingEngine. The client selects a template
 *     (`reportType`) and optionally a portfolioId; it can never supply figures.
 *   - Templates are limited to the five existing PortfolioReport reportTypes.
 *   - `pitReproducible` means "this report pins its vintage" — NOT that an arbitrary past as-of
 *     can be rebuilt. `pitLimitation.historicalAsOf` states that limitation explicitly.
 */
import { authFetch } from './authFetch';

export type ReportType =
  | 'Executive'
  | 'Investment Committee'
  | 'Portfolio Summary'
  | 'Allocation Recommendation'
  | 'Sector Dashboard';

export interface PitPinning {
  readonly dataVersion: string;
  readonly asOf: string;
  readonly mode: string;
}

export interface ReportLineage {
  readonly dataSource: string;
  readonly classification: string;
  readonly contributingSnapshotIds: readonly string[];
  readonly generatedAt: string;
}

export interface PitLimitation {
  readonly pinAndStore: string;
  readonly sameVintageRegeneration: string;
  readonly historicalAsOf: string;
  readonly replayReproducibilityClaimed: boolean;
}

export interface RegenerationComparison {
  readonly sameVintage: boolean;
  /** null when the vintages differ — not comparable, not a failure. */
  readonly byteIdentical: boolean | null;
  readonly reason: string;
}

export interface ReportView {
  readonly surfaceName: string;
  readonly disposition: string;
  readonly reportId: string;
  readonly reportType: ReportType;
  readonly portfolioId: string;
  readonly reportBody: Readonly<Record<string, unknown>>;
  readonly pitPinning: PitPinning;
  readonly lineage: ReportLineage;
  readonly payloadHash: string;
  readonly storedIntegrityVerified: boolean;
  readonly regeneration: RegenerationComparison | null;
  readonly pitLimitation: PitLimitation;
  readonly pitReproducible: boolean;
  readonly replayReproducibilityClaimed: boolean;
}

export interface ReportsProvenance {
  readonly dataSource: string;
  readonly asOf: string;
  readonly dataVersion: string;
  readonly mode: string;
  readonly freshness: string;
  readonly authority: string;
  readonly transportSemantics: string;
}

export interface ReportsEnvelope {
  readonly data: readonly ReportView[];
  readonly templates: readonly ReportType[];
  readonly provenance: ReportsProvenance;
}

export async function fetchReports(): Promise<ReportsEnvelope> {
  const res = await authFetch('/api/reports');
  if (!res.ok) throw new Error(`reports request failed: ${res.status}`);
  return (await res.json()) as ReportsEnvelope;
}

/** Generate a report from an existing template. Only the template selection is sent. */
export async function generateReport(reportType: ReportType, portfolioId?: string): Promise<void> {
  const res = await authFetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(portfolioId === undefined ? { reportType } : { reportType, portfolioId }),
  });
  if (!res.ok) throw new Error(`generate report failed: ${res.status}`);
}

export async function deleteReport(reportId: string): Promise<void> {
  const res = await authFetch(`/api/reports/${encodeURIComponent(reportId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`delete report failed: ${res.status}`);
}
