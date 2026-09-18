/**
 * Program v3.0 — Phase 11: Typed API client for the Replay Explorer.
 * Governed ReplayResult surface only. No replay/diff computation in the client.
 */
import type { Verdict } from '../components/decision/DecisionComponents';
import type { ExecutiveProvenance } from './executive';
import { authFetch } from './authFetch';

export interface ReplayData {
  readonly original: {
    readonly snapshotId: string;
    readonly engineId: string;
    readonly schemaVersion: string;
    readonly calibrationVersion: string;
    readonly generatedAt: string;
    readonly verdict: Verdict;
    readonly composite: number;
    readonly confidence: number | null;
    readonly provenance: { readonly frameworkVersion: string; readonly engineVersion: string; readonly methodologyVersion: string; readonly snapshotId: string };
  };
  readonly replay: { readonly snapshotId: string; readonly reproduced: boolean; readonly byteIdentical: boolean; readonly evidenceRefs: readonly string[] };
  readonly differenceAvailable: boolean;
  readonly note: string;
  readonly evidenceRefs: readonly string[];
  readonly provenance: ExecutiveProvenance;
}

export async function fetchReplayData(sector: string, baseUrl = ''): Promise<ReplayData> {
  const res = await authFetch(`${baseUrl}/api/replay/${encodeURIComponent(sector)}`);
  if (!res.ok) throw new Error(`replay transport returned ${res.status}`);
  return (await res.json()) as ReplayData;
}
