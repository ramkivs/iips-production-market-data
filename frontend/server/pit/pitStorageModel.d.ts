/**
 * Type declarations for the ACCEPTED P08 PIT storage model (`p08/src/pitStorageModel.js`).
 *
 * D-PIT-WIRE-01 — the transport-side PIT modules are the FIRST legitimate consumers of the
 * frozen P08 capability (previously "p08 imports in frontend/server: 0", D89 §3). P08 source
 * is FROZEN (plain ESM JavaScript, no types); this hand-written declaration mirrors its
 * exported surface exactly as implemented. It grants NO licence to modify p08: PS-1…PS-13
 * semantics are consumed, never amended. If p08 ever changes, these declarations must be
 * reconciled by a separate governed act.
 *
 * P08 authority: F-6 / D22 (docs/D22_F6_PHASE_08_IMPLEMENTATION_AUTHORIZATION.md) §5 —
 * in-memory only; no disk persistence, no network, no credentials.
 */

/** Structural error carrying a stable machine-readable code (PS-E1…PS-E9). */
export declare class PitStorageError extends Error {
  readonly code: string;
  constructor(code: string, message: string);
}

/** PS-3 — the accepted `snapshotId` composition. Re-asserted, never re-derived. */
export declare const SNAPSHOT_ID_PATTERN: RegExp;

/** PS-4 — the four-state quality vocabulary. No fifth state. */
export declare const QUALITY: readonly string[];

/** PS-5 — the six accepted version axes. No seventh axis. */
export declare const VERSION_AXES: readonly string[];

/** PS-1 — DEP-P01-04 resolution (ORDERED_SET_OF_SNAPSHOTS). */
export declare const SERIES_STRUCTURE_DECISION: Readonly<{
  depP01_04: string;
  owner: string;
  resolvedBy: string;
  decision: string;
  rejectedAlternative: string;
  rejectionReason: string;
  asOfIsScalar: boolean;
  barsPerSnapshot: number;
  defaultedFromP05: boolean;
  adjustedSeriesResolved: boolean;
  adjustedSeriesOwner: string;
  certificationGranted: boolean;
}>;

/** PS-2 — the P08-side PIT capability declaration. */
export declare const PIT_CAPABILITY: Readonly<{
  owner: string;
  mode: string;
  storage: 'IN_MEMORY_ONLY';
  durableMediaAuthorized: false;
  persistenceAuthorized: false;
  networkAuthorized: false;
  credentialsAuthorized: false;
  p05RefusalModified: false;
}>;

/**
 * A canonical snapshot admissible by `store.append()` (PS-6):
 * required string fields snapshotId/provider/dataVersion/asOf/domain/quality;
 * quality ∈ good|stale|partial|unavailable; asOf = ISO-8601 UTC with milliseconds;
 * snapshotId = `data-${provider}-${dataVersion}-${asOf}`; no unknown `*Version` axis.
 * `pitBoundary` is REQUIRED IFF the snapshot's mode is PIT (P01 ST-5 / MD-3).
 */
export declare interface PitSnapshot {
  readonly snapshotId: string;
  readonly provider: string;
  readonly dataVersion: string;
  readonly asOf: string;
  readonly domain: string;
  readonly quality: string;
  readonly securityId?: string;
  readonly pitBoundary?: string;
  readonly [field: string]: unknown;
}

/**
 * PS-7 — THE PIT STORE. Append-only, immutable, in-memory, deterministic.
 * PS-9 `asOfQuery` returns the latest vintage whose asOf is <= the requested instant, or null.
 */
export declare interface PitStore {
  append(snapshot: PitSnapshot): PitSnapshot;
  asOfQuery(domain: string, securityId: string | undefined, asOf: string): PitSnapshot | null;
  seriesOf(domain: string, securityId: string | undefined): readonly PitSnapshot[];
  detectVintageAmbiguity(domain: string, securityId: string | undefined): readonly unknown[];
  size(): number;
}

/** Create the frozen in-memory PIT store. */
export declare function createPitStore(): PitStore;

/** PS-13 — implementation evidence surface (NOT certification evidence). */
export declare const PIT_EVIDENCE: Readonly<{
  workItem: string;
  requirement: string;
  exitCriterion: string;
  dependencies: readonly string[];
  depP01_04: string;
  pitEvidenceSource: string;
  p05_04Relied: boolean;
  acceptance: string;
  a3Acceptor: string;
  c7: string;
  certification: string;
  productionActivation: string;
  downstreamPhases: string;
  deferred: readonly string[];
}>;
