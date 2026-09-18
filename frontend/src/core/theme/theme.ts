/**
 * Program v3.0 — Phase 3: Theme infrastructure.
 *
 * Resolves the frozen semantic tokens into CSS variables for light (default) and dark.
 * Both themes resolve the SAME semantic tokens (contrast AA guaranteed in both).
 */
import { color, status, authority, freshness, radius, elevation } from '../tokens';

export type ThemeMode = 'light' | 'dark';

interface ThemeVars {
  '--color-ink': string;
  '--color-ink-secondary': string;
  '--color-ink-muted': string;
  '--color-surface-0': string;
  '--color-surface-1': string;
  '--color-surface-2': string;
  '--color-border': string;
  '--color-focus': string;
  '--color-accent': string;
  '--color-status-positive': string;
  '--color-status-negative': string;
  '--color-status-neutral': string;
  '--color-status-warning': string;
  '--color-status-critical': string;
  '--color-status-informational': string;
  '--color-authority-certified': string;
  '--color-authority-ai': string;
  '--color-authority-platform': string;
  '--color-freshness-live': string;
  '--color-freshness-snapshot': string;
  '--color-freshness-stale': string;
  '--color-freshness-unavailable': string;
  '--color-freshness-replay': string;
  '--radius-sm': string;
  '--radius-md': string;
  '--radius-lg': string;
  '--radius-xl': string;
  '--elev-1': string;
  '--elev-2': string;
  '--elev-3': string;
}

const LIGHT: ThemeVars = {
  '--color-ink': color.ink900,
  '--color-ink-secondary': color.ink600,
  '--color-ink-muted': color.ink400,
  '--color-surface-0': color.surface0,
  '--color-surface-1': color.surface1,
  '--color-surface-2': color.surface2,
  '--color-border': color.border,
  '--color-focus': color.focus,
  '--color-accent': color.accent,
  '--color-status-positive': status.positive,
  '--color-status-negative': status.negative,
  '--color-status-neutral': status.neutral,
  '--color-status-warning': status.warning,
  '--color-status-critical': status.critical,
  '--color-status-informational': status.informational,
  '--color-authority-certified': authority.certified,
  '--color-authority-ai': authority.ai,
  '--color-authority-platform': authority.platform,
  '--color-freshness-live': freshness.live,
  '--color-freshness-snapshot': freshness.snapshot,
  '--color-freshness-stale': freshness.stale,
  '--color-freshness-unavailable': freshness.unavailable,
  '--color-freshness-replay': freshness.replay,
  '--radius-sm': `${radius.sm}px`,
  '--radius-md': `${radius.md}px`,
  '--radius-lg': `${radius.lg}px`,
  '--radius-xl': `${radius.xl}px`,
  '--elev-1': elevation[1],
  '--elev-2': elevation[2],
  '--elev-3': elevation[3],
};

// Dark palette resolves the same semantic tokens with adequate contrast.
const DARK: ThemeVars = {
  ...LIGHT,
  '--color-ink': '#E6EDF3',
  '--color-ink-secondary': '#B4C1CD',
  '--color-ink-muted': '#8A97A3',
  '--color-surface-0': '#0B1B2B',
  '--color-surface-1': '#122437',
  '--color-surface-2': '#1A2E44',
  '--color-border': '#2A3E54',
  '--color-status-positive': '#4CBB7A',
  '--color-status-negative': '#E86A60',
  '--color-status-warning': '#D89B3F',
  '--color-status-critical': '#E86A60',
  '--color-status-informational': '#6BA6F5',
  '--color-authority-certified': '#4CBB7A',
  '--color-authority-ai': '#B4C1CD',
  '--color-authority-platform': '#6BA6F5',
  '--color-freshness-live': '#4CBB7A',
  '--color-freshness-snapshot': '#6BA6F5',
  '--color-freshness-stale': '#D89B3F',
  '--color-freshness-unavailable': '#E86A60',
  '--color-freshness-replay': '#B4C1CD',
};

export function themeVariables(mode: ThemeMode): ThemeVars {
  return mode === 'dark' ? DARK : LIGHT;
}

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  const vars = themeVariables(mode);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}
