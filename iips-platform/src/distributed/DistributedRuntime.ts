/**
 * Program v2.0 — WP-1: Distributed Deterministic Runtime.
 *
 * A runtime abstraction that propagates a deterministic execution context across nodes so that
 * ANY node reproduces the identical result for the same (input, contract, calibration, runtime
 * config). This is the hardest test of the v1.1 constitutional invariant:
 *
 *   Same frozen input + contract + calibration + runtime configuration
 *     -> same deterministic result regardless of single-node or multi-node execution.
 *
 * The frozen v1.1 engines are consumed UNCHANGED. This module is v2.0 infrastructure (MAY
 * CHANGE runtime topology) and must NOT alter engine semantics. Determinism is preserved by
 * reconstructing the identical injectable Clock + IdProvider on every node from a propagated
 * execution context (no Math.random / Date.now in business logic).
 */
import { createClock, type Clock } from '../infrastructure/Clock';
import { createIdProvider, type IdProvider } from '../infrastructure/IdProvider';
import { Container } from '../di/Container';
import type { SectorPlugin, ExecutionRequest, ExecutionResult } from '../plugin-loader/PluginContract';
import { PluginLoader } from '../plugin-loader/PluginLoader';
import { SnapshotService } from '../snapshot/SnapshotService';
import { SnapshotStore } from '../snapshot/SnapshotStore';
import { ReplayService } from '../replay/ReplayService';
import { RuntimeCoordinator } from '../runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../framework/evidence/EvidencePipeline';
import type { ReplayService as ReplayServiceType } from '../replay/ReplayService';

/**
 * The deterministic execution context propagated across nodes. It fully determines the
 * engine's observable behavior: any node that reconstructs this context reproduces the
 * identical result.
 */
export interface DistributedExecutionContext {
  readonly lineage: string;          // replay lineage / run id (propagated)
  readonly clockMode: 'fixed';       // deterministic clock mode (fixed = identical 'now')
  readonly clockFixed?: string;      // fixed timestamp, if any
  readonly idMode: 'deterministic';  // deterministic id provider
  readonly instanceSeed: string;     // instance seed for the id provider
  readonly schemaVersion: string;    // snapshot schema version
}

/** A "node" in the distributed model: hosts engines behind a shared snapshot/replay store. */
export interface DistributedNode {
  readonly nodeId: string;
  readonly runtime: RuntimeCoordinator;
  readonly plugins: PluginLoader;
  readonly store: SnapshotStore;
  readonly replay: ReplayServiceType;
}

/** Reconstruct the deterministic context on any node. */
export function materializeContext(ctx: DistributedExecutionContext): {
  clock: Clock;
  id: IdProvider;
} {
  return {
    clock: createClock(ctx.clockMode, ctx.clockFixed),
    id: createIdProvider(ctx.idMode, ctx.instanceSeed),
  };
}

/** Build the exact platform runtime (fixed clock + deterministic id) that the frozen engines expect. */
function buildRuntime(ctx: DistributedExecutionContext): {
  container: Container;
  plugins: PluginLoader;
  store: SnapshotStore;
  replay: ReplayServiceType;
  runtime: RuntimeCoordinator;
} {
  const { clock, id } = materializeContext(ctx);
  const evidence = new EvidencePipeline(clock);
  const container = new Container({ clock, idProvider: id, evidenceService: evidence });
  const plugins = new PluginLoader(container);
  const snap = new SnapshotService(clock, id, ctx.schemaVersion);
  const store = new SnapshotStore();
  const replay = new ReplayService(store);
  const runtime = new RuntimeCoordinator(container, plugins, snap, store, replay);
  container.register('runtimeCoordinator', runtime);
  return { container, plugins, store, replay, runtime };
}

export class DistributedRuntime {
  /** Fixed default context (matches v1.1 LTS deterministic config). */
  static defaultContext(instanceSeed = 'v2-dist'): DistributedExecutionContext {
    return {
      lineage: `run-${instanceSeed}`,
      clockMode: 'fixed',
      idMode: 'deterministic',
      instanceSeed,
      schemaVersion: 'snapshot-1.0',
    };
  }

  /** Provision a node with the given context and a set of engines. */
  provisionNode(nodeId: string, ctx: DistributedExecutionContext, engines: Array<() => SectorPlugin>): DistributedNode {
    const { plugins, store, replay, runtime } = buildRuntime(ctx);
    for (const make of engines) {
      const e = make();
      if (!plugins.load(e)) throw new Error(`failed to load engine on node ${nodeId}`);
      plugins.initialize(e.identity.engineId);
    }
    return { nodeId, runtime, plugins, store, replay };
  }

  /** Execute a request on a node. */
  execute(node: DistributedNode, engineId: string, request: ExecutionRequest): ExecutionResult {
    const r = node.runtime.execute(engineId, request);
    return r.result;
  }
}
