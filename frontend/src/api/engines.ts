/**
 * IIPS v3.0 — E2E-025 Engine Integration — Typed API client for the Engine Registry / Dispatch.
 *
 * Mirrors the additive `GET /api/engines` and `POST /api/engines/:engineId/execute` surfaces
 * exposed by the EngineApiAdapter (certified-engine dispatch, not a scoring recomputation).
 * Semantically inert — maps governed fields only; never computes scores or thresholds.
 */

export interface EngineRegistryEntry {
  readonly engineId: string;
  readonly ies: string;
  readonly iesTitle: string;
  readonly sectorFamily: string;
  readonly engineVersion: string;
  readonly secVersion: string;
  readonly semcVersion: string;
  readonly calibrationProfile: string;
  readonly calibrationVersion: string;
  readonly capabilities: readonly string[];
}

export interface EngineListData {
  readonly apiVersion: string;
  readonly engines: readonly EngineRegistryEntry[];
  readonly provenance: {
    readonly certifiedCount: number;
    readonly source: string;
    readonly freshness: 'FROZEN';
    readonly runtimeConfig: { readonly clock: string; readonly idProvider: string };
  };
}

export interface EngineExecuteRequest {
  readonly apiVersion: '1.0';
  readonly engineId: string;
  readonly requestId: string;
  readonly inputs: Record<string, unknown>;
}

export interface EngineExecuteResponse {
  readonly apiVersion: string;
  readonly engineId: string;
  readonly requestId: string;
  readonly ies: string;
  readonly engineVersion: string;
  readonly state: 'COMPLETED' | 'DENIED' | 'FAILED';
  readonly verdict?: string;
  readonly composite?: number;
  readonly snapshotRef?: string;
  readonly evidenceRef?: string;
  readonly provenance: {
    readonly engineId: string;
    readonly ies: string;
    readonly engineVersion: string;
    readonly secVersion: string;
    readonly semcVersion: string;
    readonly calibrationProfile: string;
    readonly calibrationVersion: string;
    readonly snapshotId?: string;
    readonly evidenceId?: string;
    readonly deterministic: true;
    readonly runtimeConfig: {
      readonly clock: string;
      readonly idProvider: string;
      readonly schemaVersion: string;
      readonly transportVersion: string;
    };
  };
  readonly reason?: string;
}

const BASE = '/api/engines';

export async function fetchEngines(baseUrl = ''): Promise<EngineListData> {
  const res = await fetch(`${baseUrl}${BASE}`);
  if (!res.ok) throw new Error(`engines transport returned ${res.status}`);
  return (await res.json()) as EngineListData;
}

export async function executeEngine(
  engineId: string,
  inputs: Record<string, unknown>,
  requestId?: string,
  baseUrl = '',
): Promise<EngineExecuteResponse> {
  const body: EngineExecuteRequest = {
    apiVersion: '1.0',
    engineId,
    requestId: requestId ?? `req-${Date.now()}`,
    inputs,
  };
  const res = await fetch(`${baseUrl}${BASE}/${encodeURIComponent(engineId)}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 400 || res.status === 404 || res.status === 422) {
    const err = (await res.json().catch(() => ({}))) as { error?: string; reason?: string };
    throw new Error(err.error ?? err.reason ?? `engine execute returned ${res.status}`);
  }
  if (!res.ok) throw new Error(`engine execute returned ${res.status}`);
  return (await res.json()) as EngineExecuteResponse;
}
