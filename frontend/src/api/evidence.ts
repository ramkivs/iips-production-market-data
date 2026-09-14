/**
 * Program v3.0 — Phase 10: Typed API client for the Evidence Explorer.
 * Inspection surface over governed v2.0 evidence/snapshot/replay contracts.
 * No analytical/reasoning logic in the client.
 */
import type { Verdict } from '../components/decision/DecisionComponents';
import type { ExecutiveProvenance } from './executive';
import { authFetch } from './authFetch';

export interface EvidenceData {
  readonly decision: { readonly verdict: Verdict; readonly composite: number; readonly confidence: number | null };
  readonly evidence: {
    readonly evidenceId: string;
    readonly engineId: string;
    readonly recommendation: string;
    readonly compositeScore: number;
    readonly confidence: number | null;
    readonly keyMetrics: readonly { readonly id: string; readonly name: string; readonly value: number }[];
    readonly supportingScores: readonly { readonly id: string; readonly name: string; readonly value: number }[];
    readonly calibrationVersion: string;
    readonly decisionRulesApplied: readonly string[];
    readonly replayReference: string;
    readonly provenance: { readonly frameworkVersion: string; readonly engineVersion: string; readonly methodologyVersion: string; readonly snapshotId: string };
    readonly generatedAt: string;
  };
  readonly snapshot: {
    readonly snapshotId: string;
    readonly engineId: string;
    readonly schemaVersion: string;
    readonly generatedAt: string;
    readonly verdict: string;
    readonly scores: Readonly<Record<string, number>>;
  };
  readonly replay: { readonly snapshotId: string; readonly reproduced: boolean; readonly byteIdentical: boolean; readonly evidenceRefs: readonly string[] };
  readonly provenance: ExecutiveProvenance;
}

export async function fetchEvidenceData(sector: string, baseUrl = ''): Promise<EvidenceData> {
  const res = await authFetch(`${baseUrl}/api/evidence/${encodeURIComponent(sector)}`);
  if (!res.ok) throw new Error(`evidence transport returned ${res.status}`);
  return (await res.json()) as EvidenceData;
}
