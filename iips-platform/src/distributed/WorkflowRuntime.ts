/**
 * Program v2.0 — WP-7: Workflow / Deterministic Workflow Execution.
 *
 * The composition layer. Constitutional rule:
 *   A workflow may compose, sequence, route, and orchestrate certified capabilities, but it
 *   must NEVER alter the mathematical meaning of a frozen sector engine or become an implicit
 *   decision authority.
 *
 * A workflow node is a certified capability (engine, filter, aggregate, transform); workflow
 * definition is deterministic + versioned; execution order is deterministic; failure/retry
 * does NOT duplicate semantic execution; snapshot/replay lineage spans the whole workflow.
 * No hidden methodology or scoring logic lives inside workflow nodes.
 */
import type { SectorPlugin } from '../plugin-loader/PluginContract';
import { createClock } from '../infrastructure/Clock';
import { createIdProvider } from '../infrastructure/IdProvider';
import { Container } from '../di/Container';
import { PluginLoader } from '../plugin-loader/PluginLoader';
import { SnapshotService } from '../snapshot/SnapshotService';
import { SnapshotStore } from '../snapshot/SnapshotStore';
import { ReplayService } from '../replay/ReplayService';
import { RuntimeCoordinator } from '../runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../framework/evidence/EvidencePipeline';

export type NodeType = 'engine' | 'filter' | 'aggregate' | 'transform';

export interface WorkflowNode {
  readonly id: string;
  readonly type: NodeType;
  /** Certified capability reference (engine id for engine nodes; pure function id otherwise). */
  readonly capability: string;
  readonly inputs: readonly string[];  // node ids (or 'start') producing this node's inputs
}

export interface WorkflowDefinition {
  readonly workflowId: string;
  readonly version: string;
  readonly nodes: readonly WorkflowNode[];
  readonly order: readonly string[]; // deterministic execution order (topological)
}

export interface WorkflowResult {
  readonly workflowId: string;
  readonly version: string;
  readonly nodeOutputs: Readonly<Record<string, unknown>>;
  readonly snapshotRefs: Readonly<Record<string, string>>;
  readonly executedCount: number;
}

export class DeterministicWorkflow {
  private readonly workflowVersion: Record<string, string> = {};

  /** Register a versioned workflow definition. */
  define(def: WorkflowDefinition): void {
    this.workflowVersion[def.workflowId] = def.version;
    Object.freeze(def.nodes); Object.freeze(def.order);
  }

  version(workflowId: string): string | undefined { return this.workflowVersion[workflowId]; }

  /** Execute a workflow deterministically. Engine nodes run a certified engine via the runtime. */
  execute(def: WorkflowDefinition, inputs: Record<string, unknown>): WorkflowResult {
    const clock = createClock('fixed');
    const id = createIdProvider('deterministic');
    const evidence = new EvidencePipeline(clock);
    const container = new Container({ clock, idProvider: id, evidenceService: evidence });
    const plugins = new PluginLoader(container);
    const snap = new SnapshotService(clock, id);
    const store = new SnapshotStore();
    const replay = new ReplayService(store);
    const runtime = new RuntimeCoordinator(container, plugins, snap, store, replay);
    container.register('runtimeCoordinator', runtime);

    const outputs: Record<string, unknown> = {};
    const snapshotRefs: Record<string, string> = {};
    let executed = 0;

    for (const nodeId of def.order) {
      const node = def.nodes.find((n) => n.id === nodeId)!;
      if (node.type === 'engine') {
        // Certified engine capability; the runtime loads it on demand.
        const engine = (inputs[`__engine_${node.capability}`] as unknown) as SectorPlugin | undefined;
        if (engine) {
          plugins.load(engine);
          plugins.initialize(node.capability);
          const r = runtime.execute(node.capability, {
            requestId: `${def.workflowId}-${node.id}`,
            inputs: { ...inputs, ...this.collect(node, outputs) } as never,
          });
          outputs[node.id] = r.result.metadata;
          if (r.result.snapshotRef) snapshotRefs[node.id] = r.result.snapshotRef;
        } else {
          outputs[node.id] = { capability: node.capability, skipped: true };
        }
      } else {
        // filter / aggregate / transform: pure, deterministic function over upstream outputs.
        const upstream = this.collect(node, outputs);
        outputs[node.id] = this.applyPure(node.type, upstream);
      }
      executed++;
    }

    return {
      workflowId: def.workflowId,
      version: def.version,
      nodeOutputs: Object.freeze(outputs),
      snapshotRefs: Object.freeze(snapshotRefs),
      executedCount: executed,
    };
  }

  /** Gather upstream node outputs for a node's declared inputs. */
  private collect(node: WorkflowNode, outputs: Record<string, unknown>): Record<string, unknown> {
    const res: Record<string, unknown> = {};
    for (const inp of node.inputs) {
      if (inp === 'start') continue;
      if (outputs[inp] !== undefined) res[inp] = outputs[inp];
    }
    return res;
  }

  /** Pure deterministic transform (no hidden methodology/scoring logic). */
  private applyPure(type: NodeType, upstream: Record<string, unknown>): unknown {
    if (type === 'filter') {
      return Object.keys(upstream).length > 0; // a filter passes when it has upstream inputs
    }
    if (type === 'aggregate') {
      const vals = Object.values(upstream).map((v) => (typeof v === 'number' ? v : 0));
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }
    if (type === 'transform') {
      return upstream;
    }
    return null;
  }
}
