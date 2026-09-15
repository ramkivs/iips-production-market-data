/**
 * UI12 SETTINGS — governed user data preferences / configuration.
 *
 * Authority: D80-R1 (UI12 Settings recovery, bounded scope).
 * Requirement: `docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md` INT-014b and
 *              `docs/d4/D4_03_UI_BASELINE.md` "UI12 Settings — ADAPT":
 *              *data preferences + user configuration*; validation = authorization + tenant scoping.
 *
 * PATTERN
 *   Mirrors the promoted P-2 notes surface and the D75 saved-screen store: a dedicated
 *   `PersistenceService` instance over its own data subdir, with tenant+owner supplied by the
 *   caller from the authenticated principal. No new persistence technology, no new dependency,
 *   no second RBAC model.
 *
 * ⚠ APPEND-ONLY REVISION MODEL (why settings are event-sourced)
 *   `PersistenceService` is an append-only journal whose ONLY mutation primitive is
 *   `updateReadState`. `append()` de-duplicates: re-appending an existing dedupKey is a no-op
 *   returning the existing record. A preference update therefore CANNOT overwrite in place.
 *   Rather than modify the accepted persistence authority (explicitly out of scope), each save
 *   is written as a NEW revision with a unique dedupKey, and the EFFECTIVE preferences are the
 *   most recent revision. This preserves the journal's audit semantics — prior preference
 *   states remain inspectable — and requires no change to `persistence-service.ts`.
 *
 * SECURITY
 *   `PersistenceService` is a library authority, NOT an HTTP/RBAC boundary (TD-2 §5). Tenant and
 *   owner are ALWAYS server-derived by the caller from the authenticated principal and are never
 *   read from a request body or query. Every read is tenant+owner scoped by the service, so a
 *   cross-tenant or cross-owner read returns the defaults, never another principal's data.
 *
 * ⚠ M-5 / G3 BOUNDARY
 *   INT-014b records an authority dependency on the unresolved G3 authentication/session gap
 *   (M-5). This module CONSUMES the existing authenticated principal boundary exactly as the
 *   notes surface does; it introduces NO identity/session semantics and NO authentication
 *   preference. M-5 remains OPEN and is not remediated here.
 */
import path from 'node:path';
import {
  PersistenceService,
  resolveDataDir,
  type PersistedRecord,
} from '../persistence/persistence-service';

export const SETTINGS_DATA_SUBDIR = 'settings';

/** Dedup namespace so settings revisions never collide with another consumer's records. */
const REVISION_PREFIX = 'user-settings\u0000';

/** Closed value sets — an unknown value is rejected, never coerced. */
export const THEME_MODES = Object.freeze(['light', 'dark'] as const);
export const DENSITY_MODES = Object.freeze(['comfortable', 'compact'] as const);
export const DATA_MODES = Object.freeze(['LIVE', 'SNAPSHOT', 'PIT'] as const);

export type ThemeMode = (typeof THEME_MODES)[number];
export type DensityMode = (typeof DENSITY_MODES)[number];
export type DataMode = (typeof DATA_MODES)[number];

/**
 * The governed UI12 preference set (INT-014b "data preferences + user configuration").
 *
 * `defaultDataMode` and `showDegradedDetail` are the DATA preferences; `theme` and `density`
 * are the user-configuration preferences. Deliberately narrow: no preference here governs
 * authentication, session, tenancy, entitlement or any authority decision.
 */
export interface UserPreferences {
  readonly theme: ThemeMode;
  readonly density: DensityMode;
  readonly defaultDataMode: DataMode;
  readonly showDegradedDetail: boolean;
}

export interface UserPreferencesDto {
  readonly preferences: UserPreferences;
  /** Revision count; 0 means "never saved — defaults in effect". */
  readonly revision: number;
  /** ISO timestamp of the effective revision, or null when defaults are in effect. */
  readonly updatedAt: string | null;
}

/** Governed defaults applied when a principal has never saved preferences. */
export const DEFAULT_PREFERENCES: UserPreferences = Object.freeze({
  theme: 'light',
  density: 'comfortable',
  defaultDataMode: 'SNAPSHOT',
  showDegradedDetail: true,
});

/** Raised on an invalid preference payload. The caller maps this to 422 — never coerced. */
export class SettingsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SettingsValidationError';
  }
}

let persistence: PersistenceService | null = null;

export function resolveSettingsDataDir(): string {
  return path.join(resolveDataDir(), SETTINGS_DATA_SUBDIR);
}

/** The UI12 PF-1 handle — a SEPARATE PersistenceService instance, mirroring notes (S-1a). */
export function getSettingsPersistence(): PersistenceService {
  if (!persistence) persistence = new PersistenceService({ dataDir: resolveSettingsDataDir() });
  return persistence;
}

/** Test/process-boundary seam: drop the cached instance so the next call re-reads the journal. */
export function resetSettingsPersistence(): void {
  persistence = null;
}

function isRevision(r: PersistedRecord): boolean {
  return typeof r.dedupKey === 'string' && r.dedupKey.startsWith(REVISION_PREFIX);
}

/**
 * Validate a client-supplied preference payload.
 *
 * FAIL-CLOSED: unknown values are REJECTED, not defaulted; unknown extra keys are IGNORED
 * (never persisted), so a client cannot smuggle tenant/owner or any other field into storage.
 */
export function validatePreferences(input: unknown): UserPreferences {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new SettingsValidationError('preferences-object-required');
  }
  const o = input as Record<string, unknown>;

  const theme = o.theme ?? DEFAULT_PREFERENCES.theme;
  const density = o.density ?? DEFAULT_PREFERENCES.density;
  const defaultDataMode = o.defaultDataMode ?? DEFAULT_PREFERENCES.defaultDataMode;
  const showDegradedDetail = o.showDegradedDetail ?? DEFAULT_PREFERENCES.showDegradedDetail;

  if (!THEME_MODES.includes(theme as ThemeMode)) throw new SettingsValidationError('invalid-theme');
  if (!DENSITY_MODES.includes(density as DensityMode)) throw new SettingsValidationError('invalid-density');
  if (!DATA_MODES.includes(defaultDataMode as DataMode)) throw new SettingsValidationError('invalid-defaultDataMode');
  if (typeof showDegradedDetail !== 'boolean') throw new SettingsValidationError('invalid-showDegradedDetail');

  return Object.freeze({
    theme: theme as ThemeMode,
    density: density as DensityMode,
    defaultDataMode: defaultDataMode as DataMode,
    showDegradedDetail,
  });
}

/**
 * Read the EFFECTIVE preferences for a principal.
 *
 * `tenantId`/`ownerUserId` MUST be server-derived by the caller. Returns governed defaults
 * (revision 0) when nothing has been saved, and for any cross-tenant/cross-owner read —
 * disclosing nothing about another principal.
 */
export function readPreferences(
  tenantId: string,
  ownerUserId: string,
  store: PersistenceService = getSettingsPersistence(),
): UserPreferencesDto {
  const revisions = store.listOrdered(tenantId, ownerUserId).filter(isRevision);
  if (revisions.length === 0) {
    return Object.freeze({ preferences: DEFAULT_PREFERENCES, revision: 0, updatedAt: null });
  }
  // listOrdered is createdAt DESC then seq DESC — index 0 is the newest revision.
  const effective = revisions[0];
  return Object.freeze({
    preferences: Object.freeze(effective.payload as UserPreferences),
    revision: revisions.length,
    updatedAt: effective.createdAt,
  });
}

/**
 * Save a new preference revision and return the resulting effective state.
 *
 * Every save appends a NEW revision (see the append-only note above); nothing is overwritten
 * and no prior revision is destroyed.
 */
export function savePreferences(
  tenantId: string,
  ownerUserId: string,
  input: unknown,
  store: PersistenceService = getSettingsPersistence(),
): UserPreferencesDto {
  const preferences = validatePreferences(input);
  const nextRevision = store.listOrdered(tenantId, ownerUserId).filter(isRevision).length + 1;
  const record = store.append({
    tenantId,
    ownerUserId,
    dedupKey: `${REVISION_PREFIX}${nextRevision}`,
    payload: preferences,
  });
  return Object.freeze({
    preferences,
    revision: nextRevision,
    updatedAt: record.createdAt,
  });
}
