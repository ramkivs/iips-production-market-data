/**
 * D89 — GLOBAL UI12 DATA-MODE PROPAGATION (shared server seam).
 *
 * Authority: **D88 = A** — UI12 "Default data mode" is the account-wide default for applicable
 * market-data surfaces, with a **bounded D54 §97 exception** permitting mode-selection and
 * degraded branches on frozen v2.0 routes **provided existing SNAPSHOT behaviour remains
 * byte-identical**.
 *
 * ══ WHY A SHARED MODULE ════════════════════════════════════════════════════════════════════
 *   D85 solved this for `/api/portfolio` alone. Copying that logic per route would duplicate
 *   settings resolution six times and invite drift. This module generalises the SAME contract
 *   so every surface answers identically, and settings logic is READ ONCE via `readPreferences`.
 *
 * ══ CONTRACT (identical on every surface) ══════════════════════════════════════════════════
 *   SNAPSHOT → the existing certified computation, invoked UNCHANGED. Byte-identical output.
 *   LIVE     → governed `LIVE_UNAVAILABLE`, citing R-2. NEVER falls back, never substitutes.
 *   PIT      → governed `PIT_UNAVAILABLE`. No PIT capability is wired to transport.
 *
 * ══ D54 §97 COMPLIANCE ═════════════════════════════════════════════════════════════════════
 *   For SNAPSHOT the certified compute function is called and its result returned verbatim —
 *   this module never rewraps, reshapes or annotates it. LIVE/PIT are branches that previously
 *   had NO behaviour, so no existing certified response is altered.
 *   ⚠ If a route cannot keep SNAPSHOT byte-identical, the exception does not cover it: STOP.
 *
 * ══ MACRO EXEMPTION (D88) ══════════════════════════════════════════════════════════════════
 *   `/api/macro` is deliberately NOT routed through this module. WP-MACRO-03 requires
 *   **LIVE, never SNAPSHOT** — a source-governance rule, not a preference default. Macro
 *   instead DISCLOSES its LIVE-only governance so the exemption is visible, never silent.
 *
 * SECURITY: tenant and owner are always server-derived from the authenticated principal.
 * No client/query/body-supplied mode is accepted anywhere in this module.
 */
import { readPreferences, type DataMode } from '../settings/settings-service';

export const DEGRADED_STATES = Object.freeze(['LIVE_UNAVAILABLE', 'PIT_UNAVAILABLE'] as const);
export type DegradedState = (typeof DEGRADED_STATES)[number];

/**
 * The governed degraded response shared by every mode-aware surface.
 *
 * `dataAvailable: false` is the discriminant consumers narrow on (the D86 pattern). The payload
 * deliberately carries NO surface data of any kind.
 */
export interface DegradedResponse {
  readonly surface: string;
  readonly dataMode: 'LIVE' | 'PIT';
  readonly state: DegradedState;
  readonly dataAvailable: false;
  readonly reason: string;
  readonly dependency: string;
  readonly provenance: {
    readonly dataSource: string;
    readonly freshness: 'UNAVAILABLE';
    readonly mode: 'LIVE' | 'PIT';
    readonly transportSemantics: string;
  };
}

const NO_FALLBACK =
  'This response deliberately contains NO market data. The request is NOT silently served from the frozen v1.1 Replay Baseline, and no provider value is substituted or fabricated. Select SNAPSHOT to receive the certified baseline data.';

/** Build the governed degraded response for a mode that cannot be served on `surface`. */
export function buildDegradedResponse(surface: string, mode: 'LIVE' | 'PIT'): DegradedResponse {
  const isLive = mode === 'LIVE';
  return Object.freeze({
    surface,
    dataMode: mode,
    state: isLive ? 'LIVE_UNAVAILABLE' : 'PIT_UNAVAILABLE',
    dataAvailable: false as const,
    reason: isLive
      ? `LIVE data is UNAVAILABLE for ${surface}. Live provider ingestion is not wired to this transport, so no live values exist to return.`
      : `PIT data is UNAVAILABLE for ${surface}. No point-in-time capability is wired to this transport, so no as-of values exist to return.`,
    dependency: isLive
      ? 'R-2 provider ingestion — OPEN and externally blocked (provider selection, licensing, credentials, entitlements).'
      : 'PIT capability exists in p08 but is NOT wired to transport; wiring it is a separate authorized act.',
    provenance: Object.freeze({
      dataSource: 'none — no governed data source is available for this data mode',
      freshness: 'UNAVAILABLE' as const,
      mode,
      transportSemantics: NO_FALLBACK,
    }),
  });
}

/**
 * Resolve the effective data mode for an authenticated principal.
 *
 * SERVER-DERIVED ONLY. A principal with no saved preference resolves to the governed default
 * (SNAPSHOT), so every surface's pre-D89 behaviour is preserved by default.
 */
export function resolveDataMode(
  tenantId: string,
  ownerUserId: string,
  store?: Parameters<typeof readPreferences>[2],
): DataMode {
  return readPreferences(tenantId, ownerUserId, store).preferences.defaultDataMode;
}

/**
 * Apply the data-mode contract to one surface.
 *
 * @param surface          governed surface name, used only in the degraded disclosure
 * @param mode             server-resolved data mode
 * @param computeSnapshot  the EXISTING certified computation, invoked UNCHANGED for SNAPSHOT
 * @returns the certified payload verbatim for SNAPSHOT, otherwise a degraded response
 */
export function forMode(surface: string, mode: DataMode, computeSnapshot: () => unknown): unknown {
  if (mode === 'SNAPSHOT') return computeSnapshot();
  return buildDegradedResponse(surface, mode);
}

/** Principal shape needed to resolve a mode. Mirrors the transport's existing resolvers. */
export interface ModePrincipal {
  readonly tenantId: string;
  readonly ownerUserId: string | undefined;
}

/**
 * Convenience for transport dispatch: resolve the mode, then apply it.
 *
 * When no owner can be resolved from the principal, the governed default (SNAPSHOT) applies and
 * behaviour is identical to pre-D89 — no owner is ever invented.
 */
export function dispatchForPrincipal(
  surface: string,
  principal: ModePrincipal,
  computeSnapshot: () => unknown,
  store?: Parameters<typeof readPreferences>[2],
): unknown {
  const mode: DataMode = principal.ownerUserId === undefined || principal.ownerUserId === ''
    ? 'SNAPSHOT'
    : resolveDataMode(principal.tenantId, principal.ownerUserId, store);
  return forMode(surface, mode, computeSnapshot);
}
