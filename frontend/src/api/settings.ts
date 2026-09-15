/**
 * UI12 — typed API client for the governed Settings surface.
 *
 * Authority: D80 (UI12 Settings recovery). Requirement: D4_01 INT-014b / D4_03 UI12.
 *
 * Consumes GET /api/settings and PUT /api/settings ONLY. Mirrors the server contract 1:1 —
 * no derivation, no transformation, no client-side authority.
 *
 * Recorded constraints reflected here:
 *   - Tenant and owner are SERVER-DERIVED. The client never supplies tenant, owner or user id.
 *   - The request carries ONLY `preferences`.
 *   - Values are validated server-side against closed sets; an invalid value is rejected (422),
 *     never coerced. The client performs no fallback of its own.
 *   - `revision` and `updatedAt` are server-authoritative.
 */
import { authFetch } from './authFetch';

export type ThemeMode = 'light' | 'dark';
export type DensityMode = 'comfortable' | 'compact';
export type DataMode = 'LIVE' | 'SNAPSHOT' | 'PIT';

export interface UserPreferences {
  readonly theme: ThemeMode;
  readonly density: DensityMode;
  readonly defaultDataMode: DataMode;
  readonly showDegradedDetail: boolean;
}

export interface SettingsProvenance {
  readonly dataSource: string;
  readonly freshness: string;
  readonly authority: string;
  readonly transportSemantics: string;
}

export interface UserPreferencesDto {
  readonly preferences: UserPreferences;
  /** 0 means "never saved — governed defaults in effect". */
  readonly revision: number;
  readonly updatedAt: string | null;
}

export interface SettingsEnvelope {
  readonly data: UserPreferencesDto;
  readonly provenance: SettingsProvenance;
}

/** Fetch the authenticated principal's OWN effective preferences (server-scoped). */
export async function fetchSettings(): Promise<SettingsEnvelope> {
  const res = await authFetch('/api/settings');
  if (!res.ok) throw new Error(`settings request failed: ${res.status}`);
  return (await res.json()) as SettingsEnvelope;
}

/** Save a new preference revision. Only preference VALUES are sent. */
export async function saveSettings(preferences: UserPreferences): Promise<SettingsEnvelope> {
  const res = await authFetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preferences }),
  });
  if (!res.ok) throw new Error(`save settings failed: ${res.status}`);
  return (await res.json()) as SettingsEnvelope;
}
