/**
 * D89 — shared client-side guard for governed degraded responses.
 *
 * Authority: D88 = A (global UI12 data-mode semantics).
 *
 * Every mode-aware market-data route may now return a governed degraded response instead of the
 * certified SNAPSHOT payload. Per the D86 lesson, a consumer must NEVER assume that a non-null
 * response has the SNAPSHOT shape: `PortfolioWorkspace` did exactly that and crashed on
 * `portfolio.holdings` before the governed state could render.
 *
 * This module supplies one narrowing helper so every surface answers identically and no consumer
 * re-implements the check.
 *
 * ⚠ Mirrors the server contract 1:1 and does NOT alter it.
 * ⚠ `/api/macro` is EXEMPT (WP-MACRO-03: LIVE, never SNAPSHOT) and never returns this shape.
 */

export type DegradedState = 'LIVE_UNAVAILABLE' | 'PIT_UNAVAILABLE';

/** The governed degraded response shared by every mode-aware surface. Carries NO market data. */
export interface DegradedData {
  readonly surface: string;
  readonly dataMode: 'LIVE' | 'PIT';
  readonly state: DegradedState;
  /** Literal `false` — the discriminant. */
  readonly dataAvailable: false;
  /** Server-authored explanation, rendered verbatim. */
  readonly reason: string;
  /** Server-authored blocking dependency (e.g. R-2), rendered verbatim. */
  readonly dependency: string;
  readonly provenance: {
    readonly dataSource: string;
    readonly freshness: 'UNAVAILABLE';
    readonly mode: 'LIVE' | 'PIT';
    readonly transportSemantics: string;
  };
}

/**
 * True when the server returned a governed degraded state rather than certified data.
 *
 * Accepts `unknown` so it can guard any surface's response without each client widening its own
 * type first; callers narrow immediately after.
 */
export function isDegraded(d: unknown): d is DegradedData {
  return (
    typeof d === 'object' &&
    d !== null &&
    (d as { dataAvailable?: unknown }).dataAvailable === false
  );
}
