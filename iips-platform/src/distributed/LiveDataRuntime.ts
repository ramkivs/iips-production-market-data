/**
 * Program v2.0 — WP-3: Live Data Integration.
 *
 * The data-determinism proving ground. Establishes the live-data ingestion/versioning/replay
 * boundary. The governing invariant:
 *
 *   Live data is external, mutable infrastructure; the engine NEVER consumes mutable live
 *   state. It consumes an IMMUTABLE, VERSIONED data snapshot whose identity (dataVersion +
 *   asOf + provider + lineage) is part of the replay lineage.
 *
 * This module is the input boundary for the frozen engines: it produces immutable versioned
 * data snapshots. Same data snapshot -> identical engine result; different data snapshot ->
 * explicitly different input lineage (never silent drift). Replay always uses the ORIGINAL
 * data snapshot, not today's market data. Cloud/provider is substrate only.
 */
import type { SectorPlugin, ExecutionRequest, ExecutionResult } from '../plugin-loader/PluginContract';

/** Provider identity + quality status of a market-data source. */
export interface DataSourceMeta {
  readonly provider: string;
  readonly dataVersion: string;
  readonly asOf: string;            // market-data time (snapshot point)
  readonly quality: 'good' | 'stale' | 'partial' | 'unavailable';
  readonly completenessPct: number; // 0-100
}

/** An immutable, versioned market-data snapshot (the ONLY input boundary for engines). */
export interface DataSnapshot<T> {
  readonly snapshotId: string;
  readonly dataVersion: string;
  readonly asOf: string;             // market-data time
  readonly provider: string;
  readonly quality: DataSourceMeta['quality'];
  readonly completenessPct: number;
  readonly fields: Readonly<T>;      // immutable field set
}

/**
 * The market-data source. `latest()` returns a deterministic snapshot keyed by the provider's
 * dataVersion/asOf. A source change produces a NEW dataVersion (explicit lineage), never a
 * silent mutation of an existing snapshot.
 */
export class MarketDataSource<T> {
  constructor(private readonly provider: string) {}

  /** Create a deterministic immutable snapshot from the current market-data fields. */
  snapshot(dataVersion: string, asOf: string, quality: DataSourceMeta['quality'], completenessPct: number, fields: T): DataSnapshot<T> {
    const meta: DataSourceMeta = { provider: this.provider, dataVersion, asOf, quality, completenessPct };
    return Object.freeze({
      snapshotId: this.snapshotId(meta),
      ...meta,
      fields: Object.freeze({ ...fields } as unknown as T),
    });
  }

  private snapshotId(meta: DataSourceMeta): string {
    return `data-${this.provider}-${meta.dataVersion}-${meta.asOf}`;
  }
}

/** Attach a versioned data snapshot to an engine execution request (immutable input boundary). */
export interface DataBoundRequest {
  readonly engineId: string;
  readonly requestId: string;
  readonly data: DataSnapshot<Record<string, unknown>>; // immutable snapshot
  readonly companyInputs: Record<string, unknown>;      // the company's fundamental inputs (frozen baseline fields)
}

/**
 * Executes a frozen engine against a data snapshot. The engine consumes ONLY the immutable
 * snapshot + company inputs; it never reads mutable live state. Replay uses the snapshot's
 * dataVersion/asOf identity.
 */
export class DataBoundExecutor {
  constructor(private readonly exec: (engineId: string, request: ExecutionRequest) => ExecutionResult) {}

  execute(bound: DataBoundRequest): { result: ExecutionResult; snapshotIdentity: string } {
    const inputs = { ...bound.data.fields, ...bound.companyInputs };
    const result = this.exec(bound.engineId, {
      requestId: bound.requestId,
      inputs: inputs as unknown as Record<string, unknown>,
    });
    return { result, snapshotIdentity: bound.data.snapshotId };
  }
}
