/**
 * UI12 — SETTINGS (first-class governed surface).
 *
 * Authority: D80 (UI12 Settings recovery), authorized by D80-R1.
 * Requirement: `docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md` INT-014b and
 *              `docs/d4/D4_03_UI_BASELINE.md` "UI12 Settings — ADAPT" —
 *              *data preferences + user configuration*; validation = authorization + tenant scoping.
 *
 * Route: /settings (viewer+ may READ; saving requires analyst-and-above, enforced server-side).
 *
 * ⚠ RECOVERY NOTE. `docs/P13_UI_SURFACE_COMPONENT_RECONCILIATION.md`:167-174 recorded UI12 as
 *   "Current Component: NONE (embedded in UI11)… Implemented elsewhere". That was inaccurate as
 *   to the INT-014b requirement: UI11 Administration is ADMIN-ONLY, so non-admin users had NO
 *   settings surface at all, and no user-preference persistence existed. This component is the
 *   dedicated UI12 surface. The historical record is NOT edited — it is corrected by addition in
 *   the D80 governance record.
 *
 * Governance boundaries:
 *   - Tenant and owner are SERVER-DERIVED from the authenticated principal; this component never
 *     sends, and has no access to, tenant/owner identity.
 *   - Values are validated server-side against closed sets; invalid values are rejected (422),
 *     never coerced. No client-side authority.
 *   - No preference here governs authentication, session, tenancy or entitlement.
 *     ⚠ M-5 / G3 remains OPEN and is NOT remediated by this surface.
 *   - Theme is applied locally on save via the existing `core/theme` authority — no new theming.
 */
import { useEffect, useState } from 'react';
import {
  fetchSettings,
  saveSettings,
  type DataMode,
  type DensityMode,
  type ThemeMode,
  type UserPreferences,
} from '../../api/settings';
import { applyTheme } from '../../core/theme/theme';
import { LoadingState, ErrorState } from '../../components/state/StateComponents';

const THEMES: readonly ThemeMode[] = ['light', 'dark'];
const DENSITIES: readonly DensityMode[] = ['comfortable', 'compact'];
const DATA_MODES: readonly DataMode[] = ['LIVE', 'SNAPSHOT', 'PIT'];

const FIELD: React.CSSProperties = { display: 'block', margin: '16px 0 4px', fontSize: 13, fontWeight: 600 };

export function Settings() {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [revision, setRevision] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [provenance, setProvenance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetchSettings()
      .then((env) => {
        if (!active) return;
        setPrefs(env.data.preferences);
        setRevision(env.data.revision);
        setUpdatedAt(env.data.updatedAt);
        setProvenance(env.provenance.dataSource);
      })
      .catch((e: unknown) => { if (active) setError(String(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function update<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
    setPrefs((p) => (p === null ? p : { ...p, [key]: value }));
    setSaved(false);
  }

  async function onSave(): Promise<void> {
    if (prefs === null) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const env = await saveSettings(prefs);
      setPrefs(env.data.preferences);
      setRevision(env.data.revision);
      setUpdatedAt(env.data.updatedAt);
      // Reuse the EXISTING theme authority; no new theming mechanism is introduced.
      applyTheme(env.data.preferences.theme);
      setSaved(true);
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error !== null && prefs === null) return <ErrorState message={error} />;
  if (prefs === null) return <ErrorState message="settings unavailable" />;

  return (
    <section data-testid="settings-surface">
      <h1 style={{ fontSize: 22, margin: 0 }}>Settings</h1>
      <p style={{ color: 'var(--color-ink-secondary)', fontSize: 13, margin: '6px 0 0' }}>
        Your data preferences and configuration. These apply to your account only.
      </p>

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Data preferences</h2>

      <label style={FIELD} htmlFor="pref-data-mode">Default data mode</label>
      <select
        id="pref-data-mode"
        data-testid="pref-defaultDataMode"
        value={prefs.defaultDataMode}
        onChange={(e) => update('defaultDataMode', e.target.value as DataMode)}
      >
        {DATA_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      <label style={{ ...FIELD, fontWeight: 400 }}>
        <input
          type="checkbox"
          data-testid="pref-showDegradedDetail"
          checked={prefs.showDegradedDetail}
          onChange={(e) => update('showDegradedDetail', e.target.checked)}
        />{' '}
        Show degraded-data detail
      </label>

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Appearance</h2>

      <label style={FIELD} htmlFor="pref-theme">Theme</label>
      <select
        id="pref-theme"
        data-testid="pref-theme"
        value={prefs.theme}
        onChange={(e) => update('theme', e.target.value as ThemeMode)}
      >
        {THEMES.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      <label style={FIELD} htmlFor="pref-density">Density</label>
      <select
        id="pref-density"
        data-testid="pref-density"
        value={prefs.density}
        onChange={(e) => update('density', e.target.value as DensityMode)}
      >
        {DENSITIES.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      <div style={{ marginTop: 24 }}>
        <button type="button" data-testid="settings-save" onClick={() => { void onSave(); }} disabled={saving}>
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
        {saved && <span data-testid="settings-saved" style={{ marginLeft: 12, fontSize: 13 }}>Saved</span>}
        {error !== null && <span data-testid="settings-error" style={{ marginLeft: 12, fontSize: 13 }}>{error}</span>}
      </div>

      <p data-testid="settings-provenance" style={{ color: 'var(--color-ink-secondary)', fontSize: 12, marginTop: 20 }}>
        {provenance} · revision {revision}
        {updatedAt === null ? ' (governed defaults in effect — never saved)' : ` · updated ${updatedAt}`}
      </p>
    </section>
  );
}

export default Settings;
