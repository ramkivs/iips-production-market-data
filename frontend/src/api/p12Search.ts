/**
 * P13-B-06 — Typed API client for GOVERNED SEARCH / OBJECT RESOLUTION (C7).
 *
 * Authority: D54 P13-B Implementation Authorization (commit dce5cdb4)
 *
 * Reuses the EXISTING typed-API pattern (`authFetch` + `${baseUrl}/api/...`).
 *
 * ⚠ FAIL-CLOSED (OR-2): an unresolved identity returns 404 and is surfaced as an error.
 *   This client NEVER substitutes a placeholder, a coerced match, or a synthesized result.
 * ⚠ Ordering is the certified deterministic order from C7 — the client does not re-sort.
 */
import { authFetch } from './authFetch';
import { P12ApiError, type P12Envelope } from './p12Screener';

/** Input types accepted by the certified resolution contract (closed set). */
export const P12_RESOLUTION_INPUT_TYPES = ['canonicalSecurityId', 'issuerId', 'identifier', 'symbol'] as const;
export type P12ResolutionInputType = (typeof P12_RESOLUTION_INPUT_TYPES)[number];

/** Object types searchable through the certified contract (closed set). */
export const P12_OBJECT_TYPES = [
  'company', 'research', 'holding', 'decision', 'evidence', 'alert', 'report', 'security', 'issuer',
] as const;
export type P12ObjectType = (typeof P12_OBJECT_TYPES)[number];

export interface P12SearchHit {
  readonly objectType: P12ObjectType;
  readonly id: string;
  readonly canonicalSecurityId?: string;
  readonly name?: string;
  readonly symbol?: string;
  readonly sector?: string;
  readonly quality?: string;
  readonly completenessPct?: number;
  readonly asOf: string;
}

export interface P12SearchResult {
  readonly query: string;
  readonly asOf: string;
  readonly tenantId: string;
  readonly objectTypes: readonly P12ObjectType[];
  readonly totalMatches: number;
  /** True when the certified contract truncated the result set at `maxResults`. */
  readonly truncated: boolean;
  readonly results: readonly P12SearchHit[];
}

export interface P12ResolvedObject {
  readonly resolved: true;
  readonly objectType: string;
  readonly canonicalSecurityId: string;
  readonly issuerId: string | null;
  readonly symbol: string | null;
  readonly lifecycleState: string;
  readonly asOf: string;
  readonly tenantId: string;
  readonly identifiers: Readonly<Record<string, string>>;
  readonly identityMappingVersion: string;
}

async function readError(res: Response): Promise<never> {
  let message = `p12 transport returned ${res.status}`;
  let rules: readonly string[] = [];
  try {
    const body = (await res.json()) as { error?: string; rules?: string[] };
    if (body?.error) message = body.error;
    if (Array.isArray(body?.rules)) rules = body.rules;
  } catch {
    // Non-JSON error body — do not invent detail.
  }
  throw new P12ApiError(res.status, message, rules);
}

/** P13-B-06 — Deterministic governed search (C7). */
export async function executeSearch(
  args: { q: string; objectTypes?: readonly P12ObjectType[]; maxResults?: number; asOf?: string },
  baseUrl = '',
): Promise<P12Envelope<P12SearchResult>> {
  const params = new URLSearchParams({ q: args.q });
  if (args.objectTypes?.length) params.set('objectTypes', args.objectTypes.join(','));
  if (typeof args.maxResults === 'number') params.set('maxResults', String(args.maxResults));
  if (args.asOf) params.set('asOf', args.asOf);

  const res = await authFetch(`${baseUrl}/api/search?${params.toString()}`);
  if (!res.ok) return readError(res);
  return (await res.json()) as P12Envelope<P12SearchResult>;
}

/**
 * P13-B-06 — Resolve an object identity (C7).
 *
 * ⚠ OR-2 FAIL-CLOSED: an unresolved identity throws a `P12ApiError` with status 404.
 *   Callers MUST surface the failure; they must not fall back to a guessed identity.
 */
export async function resolveObject(
  args: { inputType: P12ResolutionInputType; inputValue: string; asOf?: string },
  baseUrl = '',
): Promise<P12Envelope<P12ResolvedObject>> {
  const params = new URLSearchParams({ inputType: args.inputType, inputValue: args.inputValue });
  if (args.asOf) params.set('asOf', args.asOf);

  const res = await authFetch(`${baseUrl}/api/resolve?${params.toString()}`);
  if (!res.ok) return readError(res);
  return (await res.json()) as P12Envelope<P12ResolvedObject>;
}
