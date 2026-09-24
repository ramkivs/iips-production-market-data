/** Runtime Coordinator — execution orchestration (IES-005 P4 §3/§6/§7, IES-006.2A). */
import type { Container } from '../di/Container';
import type { PluginLoader } from '../plugin-loader/PluginLoader';
import type { ExecutionRequest, ExecutionResult } from '../plugin-loader/PluginContract';
import type { SnapshotService } from '../snapshot/SnapshotService';
import type { SnapshotStore } from '../snapshot/SnapshotStore';
import type { ReplayService } from '../replay/ReplayService';

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

  constructor(
    private readonly container: Container,
    private readonly plugins: PluginLoader,
    private readonly snapshotService: SnapshotService,
    private readonly snapshotStore: SnapshotStore,
    private readonly replayService: ReplayService,
  ) {}

  getState(): RuntimeState {
    return this.state;
  }

  initialize(): void {
    this.state = 'INITIALIZED';
  }

  /** Execute a plugin request and produce a snapshot. */
  execute(engineId: string, request: ExecutionRequest): { result: ExecutionResult; snapshotId?: string } {
    this.state = 'RUNNING';
    const result = this.plugins.execute(engineId, request);
    if (!result) {
      this.state = 'FAILED';
      throw new Error(`Unknown engine: ${engineId}`);
    }
    if (result.state === 'COMPLETED') {
      this.state = 'COMPLETED';
      return { result, snapshotId: result.snapshotRef };
    }
    this.state = result.state === 'CANCELLED' ? 'CANCELLED' : 'FAILED';
    return { result };
  }

  /** Create + store a snapshot from computed outputs. */
  recordSnapshot(engineId: string, metrics: Record<string, number>, scores: Record<string, number>, verdict?: string) {
    const snapshot = this.snapshotService.create({ engineId, metrics, scores, verdict });
    this.snapshotStore.append(snapshot);
    return snapshot;
  }

  replay(snapshotId: string) {
    this.state = 'REPLAYING';
    const r = this.replayService.replay(snapshotId);
    this.state = 'COMPLETED';
    return r;
  }
}
