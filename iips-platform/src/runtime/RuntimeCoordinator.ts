/**
 * Runtime Coordinator — execution orchestration (IES-005 P4 §3/§6/§7, IES-006.2A).
 *
 * M-2 REPAIR (D41 Workstream C):
 *   RuntimeCoordinator now registers a replay executor with ReplayService and
 *   passes execution context when creating snapshots for replay recomputation.
 */
import type { Container } from '../di/Container';
import type { PluginLoader } from '../plugin-loader/PluginLoader';
import type { ExecutionRequest, ExecutionResult } from '../plugin-loader/PluginContract';
import type { SnapshotService } from '../snapshot/SnapshotService';
import type { SnapshotStore } from '../snapshot/SnapshotStore';
import type { ReplayService, ReplayExecutor } from '../replay/ReplayService';

export type RuntimeState =
  | 'READY'
  | 'INITIALIZED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REPLAYING';

export class RuntimeCoordinator {
  private state: RuntimeState = 'READY';
  private lastRequest: { engineId: string; request: ExecutionRequest } | null = null;

  constructor(
    private readonly container: Container,
    private readonly plugins: PluginLoader,
    private readonly snapshotService: SnapshotService,
    private readonly snapshotStore: SnapshotStore,
    private readonly replayService: ReplayService,
  ) {
    // M-2 REPAIR: Register replay executor for actual recomputation
    this.replayService.setExecutor(this.createReplayExecutor());
  }

  getState(): RuntimeState {
    return this.state;
  }

  initialize(): void {
    this.state = 'INITIALIZED';
  }

  /** Execute a plugin request and produce a snapshot. */
  execute(engineId: string, request: ExecutionRequest): { result: ExecutionResult; snapshotId?: string } {
    this.state = 'RUNNING';
    this.lastRequest = { engineId, request };
    const result = this.plugins.execute(engineId, request);
    if (!result) {
      this.state = 'FAILED';
      throw new Error(`Unknown engine: ${engineId}`);
    }
    if (result.state === 'COMPLETED') {
      this.state = 'COMPLETED';
      // P15: Pass marketDataLineage to recordSnapshot if present
      if (request.marketDataLineage) {
        this.recordSnapshot(
          engineId,
          result.metadata.metrics as Record<string, number>,
          result.metadata.scores as Record<string, number>,
          result.metadata.verdict as string | undefined,
          request.requestId,
          request.inputs as Record<string, unknown>,
          request.marketDataLineage
        );
      }
      return { result, snapshotId: result.snapshotRef };
    }
    this.state = result.state === 'CANCELLED' ? 'CANCELLED' : 'FAILED';
    return { result };
  }

  /** Create + store a snapshot from computed outputs (with execution context for replay). */
  recordSnapshot(
    engineId: string,
    metrics: Record<string, number>,
    scores: Record<string, number>,
    verdict?: string,
    requestId?: string,
    inputs?: Record<string, unknown>,
    marketDataLineage?: string // P15: optional market-data snapshot ID for lineage propagation
  ) {
    const snapshot = this.snapshotService.create({
      engineId,
      metrics,
      scores,
      verdict,
      executionContext: requestId ? {
        requestId,
        inputs: inputs ?? {},
      } : undefined,
      marketDataLineage, // P15: pass lineage to SnapshotService
    });
    this.snapshotStore.append(snapshot);
    return snapshot;
  }

  replay(snapshotId: string) {
    this.state = 'REPLAYING';
    const r = this.replayService.replay(snapshotId);
    this.state = 'COMPLETED';
    return r;
  }

  /**
   * Create a replay executor that re-executes engines through the plugin loader.
   * The executor re-executes the engine, retrieves the newly created snapshot,
   * and returns its metrics/scores/verdict for comparison.
   */
  private createReplayExecutor(): ReplayExecutor {
    return (engineId: string, requestId: string, inputs: Record<string, unknown>) => {
      // Record the current store size to identify the new snapshot
      const storeSizeBefore = this.snapshotStore.size;
      
      // Re-execute the engine (this creates a new snapshot via recordSnapshot)
      const result = this.plugins.execute(engineId, { requestId: `replay-${requestId}`, inputs });
      if (!result || result.state !== 'COMPLETED') {
        return null;
      }
      
      // Retrieve the newly created snapshot
      const allSnapshots = this.snapshotStore.list();
      const newSnapshot = allSnapshots[storeSizeBefore]; // The snapshot created during re-execution
      
      if (!newSnapshot) {
        // Fallback: try to extract from result metadata
        const metadata = result.metadata as Record<string, unknown>;
        return {
          metrics: (metadata.metrics as Record<string, number>) ?? {},
          scores: (metadata.scores as Record<string, number>) ?? {},
          verdict: metadata.verdict as string | undefined,
        };
      }
      
      return {
        metrics: { ...newSnapshot.metrics } as Record<string, number>,
        scores: { ...newSnapshot.scores } as Record<string, number>,
        verdict: newSnapshot.verdict,
      };
    };
  }
}
