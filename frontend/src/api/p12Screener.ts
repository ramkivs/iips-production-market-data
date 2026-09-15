/**
 * P13-B-05 — Typed API client for the GOVERNED SCREENER (C6).
 *
 * Authority: D54 P13-B Implementation Authorization (commit dce5cdb4)
 * D90: mode-aware return type (P12Envelope<P12ScreenResult> | DegradedData).
 *
 * Reuses the EXISTING typed-API pattern: `authFetch` + `${baseUrl}/api/...`, identical to
 * `decisionMatrix.ts`. No new transport, no new auth mechanism.
 *
 * ⚠ The screen is executed SERVER-SIDE by the certified C6 contract. This client performs
 *   NO filtering, NO sorting and NO degradation classification — doing so in React would
 *   move a governed decision into the presentation layer.
 * ⚠ UI05 implementation is NOT UI05 certification.
 */
import { authFetch } from './authFetch';
import type { DegradedData } from './dataMode';

/** P12 closed quality set (P05). Mirrors the certified contract; not redefined here. */
export type P12Quality = 'good' | 'stale' | 'partial' | 'unavailable';

/** Degradation labels produced by the certified `classifyRowDegradation`. */
export type P12Degradation = 'good' | 'degraded-stale' | 'degraded-partial' | 'degraded-unavailable';

/** The closed filter-operator set enforced by C6. Client-side use is for UI affordances only. */
export const P12_FILTER_OPERATORS = [
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn', 'contains', 'isNull', 'isNotNull',
] as const;
export type P12FilterOperator = (typeof P12_FILTER_OPERATORS)[number];

export interface P12Filter {
  readonly field: string;
  readonly operator: P12FilterOperator;
  readonly operand: unknown;
}

export interface P12Sort {
  readonly field: string;
  readonly direction: 'asc' | 'desc';
}

/** A governed screen row as returned by the certified contract. */
export interface P12ScreenRow {
  readonly rank: number;
  readonly canonicalSecurityId: string;
  readonly sector: string;
  readonly verdict: string;
  readonly composite: number;
  readonly qualityAxis: number | null;
  readonly valuation: number | null;
  readonly _degradation: P12Degradation;
  readonly _rowQuality: P12Quality;
  readonly _rowCompleteness: number;
  readonly _rowAsOf: string;
}

export interface P12ScreenResult {
  readonly screenId: string;
  readonly tenantId: string;
  readonly asOf: string;
  readonly executedAt: string;
  readonly mode: string;
  readonly totalRows: number;
  readonly quality: P12Quality;
  readonly filters: readonly P12Filter[];
  readonly sort: readonly P12Sort[];
  readonly tieBreakField: string;
  readonly rows: readonly P12ScreenRow[];
}

/** The derived provenance DTO carried on every P12 response (P13-B-03). */
export interface P12Provenance {
  readonly dataSource: string;
  readonly freshness: string;
  readonly calibratedAt: string;
  readonly transportSemantics: string;
  readonly asOf: string;
  readonly receivedAt: string;
  readonly dataVersion: string;
  readonly mode: string;
  readonly quality: P12Quality;
  readonly completenessPct: number;
  readonly contributingSnapshotIds: readonly string[];
  readonly identityMappingVersion: string;
  readonly namespaceVersion: string;
  readonly classification: string;
}

/** P13-B-08 — the explicit dual-transport disclosure carried on every P12 response. */
export interface TransportDisclosure {
  readonly dualTransport: boolean;
  readonly statement: string;
  readonly p12Scope: string;
  readonly v2Scope: string;
  readonly certificationNote: string;
}

export interface GovernanceLimitations {
  readonly ad17: Readonly<Record<string, unknown>>;
  readonly security: Readonly<Record<string, unknown>>;
  readonly ui05Certified: boolean;
  readonly uiSurfaceCertified: boolean;
  readonly productionAuthorized: boolean;
}

/** The governed P12 response envelope. */
export interface P12Envelope<T> {
  readonly apiVersion: string;
  readonly endpoint: string;
  readonly tenantId: string;
  readonly data: T;
  readonly provenance: P12Provenance;
  readonly responseGeneratedAt: string;
  readonly lineage: 'P12-GOVERNED' | 'V2.0-CERTIFIED' | 'DUAL';
  readonly transportDisclosure: TransportDisclosure;
  readonly governanceLimitations: GovernanceLimitations;
}

/** A governed contract failure (C6 violation, tenant refusal, unresolved identity). */
export class P12ApiError extends Error {
  constructor(readonly status: number, message: string, readonly rules: readonly string[] = []) {
    super(message);
    this.name = 'P12ApiError';
  }
}

async function readError(res: Response): Promise<never> {
  let message = `p12 transport returned ${res.status}`;
  let rules: readonly string[] = [];
  try {
    const body = (await res.json()) as { error?: string; rules?: string[] };
    if (body?.error) message = body.error;
    if (Array.isArray(body?.rules)) rules = body.rules;
  } catch {
    // Non-JSON error body — keep the status-derived message rather than inventing detail.
  }
  throw new P12ApiError(res.status, message, rules);
}

/**
 * P13-B-05 — Execute a governed screen (C6, server-side).
 * D90: returns SNAPSHOT envelope OR governed DegradedData when LIVE/PIT is requested.
 *
 * A C6 contract violation (unknown operator, missing tie-break, invalid sort) FAILS
 * CLOSED with a 400 and is surfaced as a `P12ApiError` — never silently degraded.
 */
export async function executeScreen(
  args: {
    filters?: readonly P12Filter[];
    sort: readonly P12Sort[];
    tieBreakField?: string;
    screenId?: string;
    asOf?: string;
  },
  baseUrl = '',
): Promise<P12Envelope<P12ScreenResult> | DegradedData> {
  const res = await authFetch(`${baseUrl}/api/screener/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: args.filters ?? [],
      sort: args.sort,
      tieBreakField: args.tieBreakField ?? 'canonicalSecurityId',
      ...(args.screenId ? { screenId: args.screenId } : {}),
      ...(args.asOf ? { asOf: args.asOf } : {}),
    }),
  });
  if (!res.ok) return readError(res);
  return (await res.json()) as P12Envelope<P12ScreenResult> | DegradedData;
}

/** P13-B-05 — Validate + build a saved screen definition through the certified contract. */
export async function saveScreenDefinition(
  args: { screenId: string; filters: readonly P12Filter[]; sort: readonly P12Sort[]; tieBreakField: string },
  baseUrl = '',
): Promise<P12Envelope<Record<string, unknown>>> {
  const res = await authFetch(`${baseUrl}/api/screener/saved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) return readError(res);
  return (await res.json()) as P12Envelope<Record<string, unknown>>;
}
