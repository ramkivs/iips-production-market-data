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

// ─────────────────────────────────────────────────────────────────────────────────────────
// D-PIT-WIRE-01 — the governed PIT SUCCESS response family (dataAvailable: true).
//
// Mirrors the server contract 1:1 (buildPitVintageResponse). A PIT vintage is NEVER a
// SNAPSHOT shape and must never be dereferenced as one — consumers narrow with isPitVintage()
// BEFORE any snapshot-shape access, exactly as isDegraded() established for the degraded
// family. The degraded family above is unchanged.
// ─────────────────────────────────────────────────────────────────────────────────────────

/** The verbatim D01/D02 canonical historical record (not the P08 storage envelope). */
export interface PitVintageRecord {
  readonly [field: string]: unknown;
}

/** The governed PIT vintage response. Carries exactly one resolved vintage. */
export interface PitVintageData {
  readonly surface: string;
  readonly dataMode: 'PIT';
  /** Literal `true` — the discriminant (the degraded family is literal `false`). */
  readonly dataAvailable: true;
  readonly query: { readonly asOf: string; readonly domain: string; readonly securityId: string };
  readonly vintage: {
    readonly found: true;
    /** What was ASKED for. */
    readonly requestedAsOf: string;
    /** What is SERVED — satisfies resolvedAsOf <= requestedAsOf (PS-9). */
    readonly resolvedAsOf: string;
    /** Governing scope's canonical alias for the resolved vintage. */
    readonly asOf: string;
    readonly snapshotId: string | null;
    readonly provider: string | null;
    readonly dataVersion: string | null;
    readonly quality: string | null;
    /** D114 dual-era disclosure: LEGACY_BHAVCOPY | CM_UDIFF. */
    readonly era: string | null;
    readonly pitBoundary: string | null;
    readonly record: PitVintageRecord;
  };
  readonly provenance: {
    readonly dataSource: string;
    readonly freshness: 'PIT';
    readonly mode: 'PIT';
    readonly archiveRef: string | null;
    readonly sha256: string | null;
    readonly sha256ManifestEntry: Readonly<Record<string, unknown>> | null;
    readonly acquisitionManifestId: string | null;
    readonly intakeLineageDigest: string | null;
    readonly failureRegisterRef: string | null;
    readonly corpusId: string | null;
    readonly certification: string;
    readonly transportSemantics: string;
  };
}

/** True when the server returned a governed PIT vintage rather than degraded or SNAPSHOT data. */
export function isPitVintage(d: unknown): d is PitVintageData {
  return (
    typeof d === 'object' &&
    d !== null &&
    (d as { dataAvailable?: unknown }).dataAvailable === true &&
    (d as { dataMode?: unknown }).dataMode === 'PIT' &&
    typeof (d as { vintage?: unknown }).vintage === 'object' &&
    (d as { vintage?: { found?: unknown } }).vintage?.found === true
  );
}
