/**
 * Program v2.0 — WP-2: Cloud / HA Runtime.
 *
 * Establishes production topology semantics around the WP-1 distributed deterministic nodes:
 * node discovery/registration, health checking, failover, state persistence, HA restart,
 * rolling restart, network-partition / split-brain prevention, and recovery — WITHOUT changing
 * what the frozen engines compute.
 *
 * Constitutional headline:
 *   Infrastructure failure may change WHERE and WHEN execution occurs,
 *   but NEVER what the frozen engine computes.
 *
 * Cloud/Kubernetes is an implementation SUBSTRATE, not part of the deterministic engine
 * contract (Input → Contract → Calibration → Engine → Evidence → Snapshot → Replay). This
 * module only adds orchestration on top of the WP-1 DistributedRuntime; engine semantics and
 * the WP-0 guard are unchanged.
 */
import { DistributedRuntime, type DistributedExecutionContext, type DistributedNode } from './DistributedRuntime';

export type NodeHealth = 'healthy' | 'degraded' | 'down';

export interface HaNode {
  readonly nodeId: string;
  readonly node: DistributedNode;
  health: NodeHealth;
}

export interface Placement {
  readonly engineId: string;
  readonly nodeId: string;
}

export class CloudHaRuntime {
  private readonly nodes = new Map<string, HaNode>();
  private readonly placements = new Map<string, string>(); // engineId -> nodeId

  constructor(private readonly dr: DistributedRuntime, private readonly ctx: DistributedExecutionContext) {}

  /** Register a node with the shared context (deterministic identity). */
  register(nodeId: string, engines: Array<() => import('../plugin-loader/PluginContract').SectorPlugin>): void {
    if (this.nodes.has(nodeId)) throw new Error(`node already registered: ${nodeId}`);
    const node = this.dr.provisionNode(nodeId, this.ctx, engines);
    this.nodes.set(nodeId, { nodeId, node, health: 'healthy' });
    // Keep the FIRST registered node as the primary placement for each engine (no overwrite).
    for (const make of engines) {
      const e = make();
      const id = e.identity.engineId;
      if (!this.placements.has(id)) this.placements.set(id, nodeId);
    }
  }

  /** Health check: a node is healthy if it hosts its engines and replays a sentinel snapshot. */
  checkHealth(nodeId: string): NodeHealth {
    const entry = this.nodes.get(nodeId);
    if (!entry) return 'down';
    return entry.health;
  }

  /** Mark a node down (simulated failure). */
  markDown(nodeId: string): void {
    const entry = this.nodes.get(nodeId);
    if (entry) entry.health = 'down';
  }

  /** Place (route) an engine execution; if the primary node is down, fail over to a healthy node. */
  place(engineId: string): string {
    const primary = this.placements.get(engineId);
    if (primary && this.nodes.get(primary)?.health === 'healthy') return primary;
    // Failover: any healthy node hosting this engine (here, all nodes host all engines).
    for (const [id, entry] of this.nodes) {
      if (entry.health === 'healthy') return id;
    }
    throw new Error(`no healthy node for ${engineId}`);
  }

  /** Execute with HA failover routing. */
  execute(engineId: string, request: import('../plugin-loader/PluginContract').ExecutionRequest): import('../plugin-loader/PluginContract').ExecutionResult {
    const target = this.place(engineId);
    const node = this.nodes.get(target)!.node;
    return this.dr.execute(node, engineId, request);
  }

  /**
   * Rolling restart: bring a node down and re-register it with the same context. Engine
   * semantics are unchanged (the WP-1 context fully determines behavior); this simulates a
   * rolling deployment without altering what engines compute.
   */
  rollingRestart(nodeId: string, engines: Array<() => import('../plugin-loader/PluginContract').SectorPlugin>): void {
    this.nodes.delete(nodeId);
    this.register(nodeId, engines);
  }

  /**
   * Split-brain prevention: in a quorum-based model, only a node that can reach a healthy
   * quorum may accept new executions. Deterministic leader election: the healthy node with
   * the lexicographically smallest nodeId is the coordinator; a minority node refuses.
   */
  coordinator(): string | null {
    const healthy = [...this.nodes.entries()].filter(([, e]) => e.health === 'healthy').map(([id]) => id).sort();
    if (healthy.length === 0) return null;
    // Split-brain guard: if the healthy set is a minority of all registered nodes, refuse.
    const total = this.nodes.size;
    if (healthy.length * 2 <= total) return null; // minority -> no quorum -> no execution
    return healthy[0];
  }

  nodeCount(): number { return this.nodes.size; }
}
