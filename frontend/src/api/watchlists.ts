/**
 * UI07 — typed API client for the governed Watchlists surface.
 *
 * Authority: D81 (UI07 Watchlists recovery). Requirement: INT-011a / D4_01 / D4_03.
 *
 * Mirrors the server contract 1:1 — no derivation, no transformation, no client-side authority.
 *
 * Recorded constraints reflected here:
 *   - Tenant and owner are SERVER-DERIVED. The client never supplies identity.
 *   - Item VALUES are server-resolved from the P12 governed universe. The client supplies only a
 *     `canonicalSecurityId` to select a row; it can never send governed values.
 *   - Deltas are BASELINE vs CURRENT, not a time series. Where the governed universe derives
 *     from the frozen v1.1 replay baseline, deltas are legitimately 0.
 */
import { authFetch } from './authFetch';

export type TriggerOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'changed';

export interface WatchlistTrigger {
  readonly field: string;
  readonly op: TriggerOperator;
  readonly value: number | null;
}

export interface FieldDelta {
  readonly field: string;
  readonly baselineValue: number | null;
  readonly currentValue: number | null;
  readonly delta: number | null;
  readonly changed: boolean;
}

export interface TriggerResult {
  readonly field: string;
  readonly op: TriggerOperator;
  readonly value: number | null;
  /** null when the governed value is unavailable — a trigger never fires on missing data. */
  readonly fired: boolean | null;
  readonly reason: string;
}

export interface WatchlistItemView {
  readonly canonicalSecurityId: string;
  readonly baseline: Readonly<Record<string, unknown>>;
  readonly baselineAsOf: string;
  readonly addedAt: string;
  readonly triggers: readonly TriggerResult[];
  readonly deltas: readonly FieldDelta[];
  readonly current: Readonly<Record<string, unknown>> | null;
  readonly currentAsOf: string | null;
  readonly _quality?: string;
  readonly _degradation?: unknown;
}

/** The certified P13 UI07 view shape, plus the list's own name/createdAt. */
export interface WatchlistView {
  readonly surfaceName: string;
  readonly disposition: string;
  readonly watchlistId: string;
  readonly name: string;
  readonly createdAt: string;
  readonly totalItems: number;
  readonly items: readonly WatchlistItemView[];
}

export interface WatchlistsProvenance {
  readonly dataSource: string;
  readonly asOf: string;
  readonly dataVersion: string;
  readonly mode: string;
  readonly freshness: string;
  readonly authority: string;
  readonly transportSemantics: string;
}

export interface WatchlistsEnvelope {
  readonly data: readonly WatchlistView[];
  readonly provenance: WatchlistsProvenance;
}

export async function fetchWatchlists(): Promise<WatchlistsEnvelope> {
  const res = await authFetch('/api/watchlists');
  if (!res.ok) throw new Error(`watchlists request failed: ${res.status}`);
  return (await res.json()) as WatchlistsEnvelope;
}

export async function createWatchlist(watchlistId: string, name: string): Promise<void> {
  const res = await authFetch('/api/watchlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ watchlistId, name }),
  });
  if (!res.ok) throw new Error(`create watchlist failed: ${res.status}`);
}

export async function deleteWatchlist(watchlistId: string): Promise<void> {
  const res = await authFetch(`/api/watchlists/${encodeURIComponent(watchlistId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`delete watchlist failed: ${res.status}`);
}

/** Add a governed security. Only the identifier and optional triggers are sent. */
export async function addWatchlistItem(
  watchlistId: string,
  canonicalSecurityId: string,
  triggers: readonly WatchlistTrigger[] = [],
): Promise<void> {
  const res = await authFetch(`/api/watchlists/${encodeURIComponent(watchlistId)}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ canonicalSecurityId, triggers }),
  });
  if (!res.ok) throw new Error(`add watchlist item failed: ${res.status}`);
}

export async function removeWatchlistItem(watchlistId: string, canonicalSecurityId: string): Promise<void> {
  const res = await authFetch(
    `/api/watchlists/${encodeURIComponent(watchlistId)}/items/${encodeURIComponent(canonicalSecurityId)}`,
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error(`remove watchlist item failed: ${res.status}`);
}
