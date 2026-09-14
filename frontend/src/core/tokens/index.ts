/**
 * Program v3.0 — Phase 3: Semantic design tokens (FROZEN from Phase 2).
 *
 * These tokens express the Experience Constitution. Components MUST consume semantic tokens,
 * never invent raw visual values. If a token is missing, document the gap and propose an
 * amendment — do NOT silently create an arbitrary token.
 *
 * Authority / freshness / status are meaning-bearing semantic tokens (non-color-only).
 */

// --- Color primitives (light, institutional) ---
export const color = {
  ink900: '#0B1B2B',
  ink600: '#3D4E5E',
  // Phase 13-Hardening (A5): #7A8794 = 3.67:1 (below WCAG AA). #5C6875 = 5.69:1 on white.
  ink400: '#5C6875',
  surface0: '#FFFFFF',
  surface1: '#F7F9FB',
  surface2: '#EDF1F5',
  border: '#D5DCE3',
  focus: '#1F6FEB',
  // Phase 13-Hardening (A1): primary interactive accent (matches focus). Used as a solid
  // fill under white text (selected admin tab, primary action buttons). White-on-accent = 4.63:1 (AA).
  accent: '#1F6FEB',
} as const;

// --- Semantic status (non-color-only: always paired with icon + label) ---
export const status = {
  positive: '#1E7A46',
  negative: '#B3261E',
  neutral: '#5A6672',
  // Phase 13-Hardening (A5): #B26A00 = 4.24:1 (below AA). #965C00 = 5.49:1 on white.
  warning: '#965C00',
  critical: '#B3261E',
  informational: '#1F6FEB',
} as const;

// --- Authority (constitution-critical: CERTIFIED != AI != PLATFORM) ---
export const authority = {
  certified: '#1E7A46',   // v1.1 result / v2.0 evidence — primary
  ai: '#5A6672',          // advisory explanation — distinct, non-authoritative
  platform: '#1F6FEB',    // operational information
} as const;

// --- Freshness states ---
export const freshness = {
  live: '#1E7A46',
  snapshot: '#1F6FEB',
  // Phase 13-Hardening (A5): matches the corrected warning treatment (AA on white + surface-1).
  stale: '#965C00',
  unavailable: '#B3261E',
  replay: '#5A6672',
} as const;

// --- Typography ---
export const typeScale = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 40 } as const;
export const typeWeight = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;

// --- Spacing / layout ---
export const space = { unit: 4, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48 } as const;
export const layout = { gridCols: 12, gutterSm: 16, gutterLg: 24, max: 1440 } as const;

// --- Density / sizing ---
export const density = { compact: 'compact', comfortable: 'comfortable' } as const;
export const control = { sm: 28, md: 32, lg: 40 } as const;

// --- Borders / radius / elevation ---
export const radius = { sm: 2, md: 4, lg: 6, xl: 8 } as const;
export const elevation = { 0: 'none', 1: '0 1px 2px rgba(11,27,43,0.08)', 2: '0 2px 8px rgba(11,27,43,0.12)', 3: '0 8px 24px rgba(11,27,43,0.18)' } as const;

// --- Responsive breakpoints ---
export const breakpoints = { sm: 640, md: 960, lg: 1280, xl: 1600 } as const;
