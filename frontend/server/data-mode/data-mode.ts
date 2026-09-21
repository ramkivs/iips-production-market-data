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
 *   PIT      → governed `PIT_UNAVAILABLE` when no PIT retrieval is bound or no vintage is
 *              found. D-PIT-WIRE-01 (authorized): IN-SCOPE routes may bind a governed PIT
 *              retrieval hook (`forMode`'s optional 4th parameter); a bound retrieval that
 *              resolves a vintage returns the governed PIT SUCCESS response
 *              (`dataAvailable: true`). Out-of-scope routes bind nothing and are unchanged.
 *              The degraded family below is BYTE-IDENTICAL to its pre-D-PIT form.
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
 * `forMode` is declared ONCE, in the D-PIT-WIRE-01 section below. Its SNAPSHOT and LIVE
 * branch bodies are byte-identical to the pre-D-PIT form, and its PIT branch behaves
 * identically when no retrieval hook is bound (the 4th parameter is optional) — so every
 * pre-D-PIT call site behaves exactly as before.
 */

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
  const mode = resolveModeForPrincipal(principal, store);
  return forMode(surface, mode, computeSnapshot);
}

/**
 * Resolve the effective data mode for a principal WITHOUT applying it (D-PIT-WIRE-01).
 * Extracted VERBATIM from dispatchForPrincipal's body so transports that must inspect the
 * mode first (the asOf request contract) resolve it through the SAME governed logic.
 * Length stays ≤ 2; resolveDataMode's length pin (≤ 3) is untouched.
 */
export function resolveModeForPrincipal(
  principal: ModePrincipal,
  store?: Parameters<typeof readPreferences>[2],
): DataMode {
  return principal.ownerUserId === undefined || principal.ownerUserId === ''
    ? 'SNAPSHOT'
    : resolveDataMode(principal.tenantId, principal.ownerUserId, store);
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// D-PIT-WIRE-01 — GOVERNED PIT REQUEST/RESPONSE CONTRACT (additive).
//
// Authority: D-PIT-WIRE-01 = AUTHORIZED over docs/PIT_TRANSPORT_WIRING_SCOPE_PREPARATION.md
// @ 79d05d7. This extension converts the PIT branch from a hardcoded dead-end into a governed
// retrieval-or-fail-closed branch for IN-SCOPE routes only. It does NOT alter: the SNAPSHOT
// branch (byte-identical, D54 §97 gate), the LIVE branch (R-2), the degraded response family,
// the Macro exemption, or the mode-authority model (UI12, server-derived — asOf is DATA
// SELECTION, never a mode authority; no client/query/body-supplied mode exists anywhere).
// ════════════════════════════════════════════════════════════════════════════════════════════

/** The governed asOf grammar — the P08 PS-E3 ISO-8601 UTC instant with milliseconds. */
export const AS_OF_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/** The resolved vintage handed back by a bound PIT retriever, or null (fail-closed). */
export interface PitQueryResult {
  readonly found: true;
  /** The instant the request asked for (echoed verbatim). */
  readonly requestedAsOf: string;
  /** The RESOLVED vintage instant — satisfies `resolvedAsOf <= requestedAsOf` (P08 PS-9). */
  readonly resolvedAsOf: string;
  /** The stored canonical snapshot, VERBATIM (deep-frozen by the P08 store at admission). */
  readonly snapshot: Readonly<Record<string, unknown>>;
}

export type PitQueryHook = (asOf: string) => PitQueryResult | null;

/**
 * The per-request PIT binding passed to `forMode` by IN-SCOPE routes.
 * `domain`/`securityId` are disclosed in the response's query block; identity/tenant remain
 * server-derived from the authenticated principal (unchanged).
 */
export interface PitRequestBinding {
  readonly asOf: string;
  readonly domain: string;
  readonly securityId: string;
  readonly queryPit: PitQueryHook;
}

export type AsOfValidation =
  | { readonly ok: true; readonly asOf?: string }
  | { readonly ok: false; readonly status: 400; readonly error: string };

/**
 * The governed asOf request contract (server-enforced):
 *   • PIT + absent/malformed asOf           → 400 (no default instant is ever invented).
 *   • SNAPSHOT/LIVE + any asOf              → 400 (never silently ignored — an ignored
 *                                             selection parameter is a hidden mode change).
 *   • PIT + well-formed asOf                → ok, asOf flows to the retrieval hook.
 *   • SNAPSHOT/LIVE + no asOf               → ok (pre-D89/D-PIT behaviour, unchanged).
 */
export function validateAsOfRequest(mode: DataMode, rawAsOf: string | undefined | null): AsOfValidation {
  if (mode === 'PIT') {
    if (
      typeof rawAsOf !== 'string' || rawAsOf === '' || !AS_OF_PATTERN.test(rawAsOf) ||
      Number.isNaN(Date.parse(rawAsOf)) || new Date(rawAsOf).toISOString() !== rawAsOf
    ) {
      return {
        ok: false,
        status: 400,
        error:
          'asOf is REQUIRED under the PIT data mode and must be a valid ISO-8601 UTC instant with milliseconds (YYYY-MM-DDTHH:MM:SS.sssZ). No default instant is invented.',
      };
    }
    return { ok: true, asOf: rawAsOf };
  }
  if (typeof rawAsOf === 'string' && rawAsOf !== '') {
    return {
      ok: false,
      status: 400,
      error: `asOf is only valid under the PIT data mode; the effective data mode is ${mode}. asOf is data selection, never a mode authority — the request is refused rather than silently ignored.`,
    };
  }
  return { ok: true };
}

/**
 * The governed PIT SUCCESS response (new response family — never emitted before this act).
 * `dataAvailable: true` is the discriminant; the degraded family keeps `dataAvailable: false`
 * byte-identical. Distinguishes requested vs resolved asOf; carries the snapshot VERBATIM and
 * the D114 dual-era provenance (era, archiveRef, sha256) where the corpus attests them.
 */
export function buildPitVintageResponse(
  surface: string,
  result: PitQueryResult,
  binding: Pick<PitRequestBinding, 'asOf' | 'domain' | 'securityId'>,
): unknown {
  const s = result.snapshot as {
    snapshotId?: string; provider?: string; dataVersion?: string; quality?: string;
    pitBoundary?: string; historicalProvenance?: Record<string, unknown>;
  };
  const hp = s.historicalProvenance ?? {};
  return Object.freeze({
    surface,
    dataMode: 'PIT' as const,
    dataAvailable: true as const,
    query: Object.freeze({
      asOf: binding.asOf,
      domain: binding.domain,
      securityId: binding.securityId,
    }),
    vintage: Object.freeze({
      found: true as const,
      /** REQUESTED as of — what was asked. */
      requestedAsOf: result.requestedAsOf,
      /** RESOLVED vintage instant — what is served; satisfies resolvedAsOf <= requestedAsOf. */
      resolvedAsOf: result.resolvedAsOf,
      snapshotId: s.snapshotId ?? null,
      provider: s.provider ?? null,
      dataVersion: s.dataVersion ?? null,
      quality: s.quality ?? null,
      /** D114 dual-era disclosure: LEGACY_BHAVCOPY | CM_UDIFF. */
      era: (hp.era as string) ?? null,
      /** P01 ST-5/MD-3 — pitBoundary present IFF the snapshot's mode is PIT. */
      pitBoundary: s.pitBoundary ?? null,
      /** The stored canonical snapshot VERBATIM (byte-identity through the admission bridge). */
      record: result.snapshot,
    }),
    provenance: Object.freeze({
      dataSource:
        'NSE historical archives via governed D114 dual-era ingestion (LEGACY_BHAVCOPY 2016-09-20→2024-07-07; CM_UDIFF 2024-07-08→2026-09-18) served from the frozen P08 PIT store (IN_MEMORY_ONLY)',
      freshness: 'PIT' as const,
      mode: 'PIT' as const,
      archiveRef: (hp.archiveRef as string) ?? null,
      sha256: (hp.sha256 as string) ?? null,
      corpusId: (hp.corpusId as string) ?? null,
      certification: 'NONE — application verification only; NOT a certification claim (c7 NOT CERTIFIED, certification NONE_GRANTED)',
      transportSemantics:
        'Resolved vintage satisfies resolved asOf <= requested asOf. Missing vintages fail closed as PIT_UNAVAILABLE. No fallback to SNAPSHOT or LIVE; the frozen replay baseline is never substituted.',
    }),
  });
}

/**
 * Apply the data-mode contract to one surface — now with the governed PIT retrieval hook
 * (D-PIT-WIRE-01, in-scope routes only).
 *
 * @param surface          governed surface name, used only in the disclosure
 * @param mode             server-resolved data mode
 * @param computeSnapshot  the EXISTING certified computation, invoked UNCHANGED for SNAPSHOT
 * @param pit              OPTIONAL PIT binding. UNDEFINED/UNBOUND ⇒ exactly the pre-D-PIT
 *                         behaviour (PIT_UNAVAILABLE). Bound + vintage found ⇒ governed PIT
 *                         success response. Bound + not-found/error ⇒ PIT_UNAVAILABLE.
 * @returns the certified payload verbatim for SNAPSHOT, a governed PIT vintage for a bound
 *          PIT hit, otherwise the governed degraded response
 */
export function forMode(
  surface: string,
  mode: DataMode,
  computeSnapshot: () => unknown,
  pit?: PitRequestBinding,
): unknown {
  if (mode === 'SNAPSHOT') return computeSnapshot();
  if (mode === 'PIT' && pit !== undefined && typeof pit.queryPit === 'function') {
    let result: PitQueryResult | null = null;
    try {
      result = pit.queryPit(pit.asOf);
    } catch {
      result = null; // retriever error → fail-closed degraded
    }
    if (
      result !== null &&
      typeof result === 'object' &&
      (result as PitQueryResult).found === true &&
      typeof (result as PitQueryResult).resolvedAsOf === 'string' &&
      (result as PitQueryResult).snapshot !== null &&
      typeof (result as PitQueryResult).snapshot === 'object'
    ) {
      return buildPitVintageResponse(surface, result as PitQueryResult, pit);
    }
  }
  return buildDegradedResponse(surface, mode);
}
