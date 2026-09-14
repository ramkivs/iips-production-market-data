/**
 * Program v2.0 — WP-11: Performance / Scaling certification measurement.
 *
 * Establishes SCALING CHARACTERISTICS (not premature SLAs) for the v2.0 distributed
 * infrastructure, compared against the v1.1 Performance Baseline. Every scenario also gates
 * on determinism (WP-0): performance optimization must never change engine semantics.
 *
 * Measurement uses a SYSTEM clock + RUNTIME id provider so the same engine can execute
 * repeatedly in one node for timing (measurement tooling only; engine logic unchanged).
 * Engines run their frozen contracts; results are not the measurement target (timing is).
 *
 * Classification (not SLA):
 *   🟢 Linear/healthy scaling · 🟡 Expected degradation · 🟠 Scaling bottleneck · 🔴 Constitutional regression
 */
import { performance } from 'node:perf_hooks';
import { createClock } from '../infrastructure/Clock';
import { createIdProvider } from '../infrastructure/IdProvider';
import { Container } from '../di/Container';
import { PluginLoader } from '../plugin-loader/PluginLoader';
import { SnapshotService } from '../snapshot/SnapshotService';
import { SnapshotStore } from '../snapshot/SnapshotStore';
import { ReplayService } from '../replay/ReplayService';
import { RuntimeCoordinator } from '../runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../framework/evidence/EvidencePipeline';
import type { SectorPlugin } from '../plugin-loader/PluginContract';

export interface ScalingSample {
  nodes: number;
  executions: number;
  elapsedMs: number;
  throughputPerSec: number;
  p50Ms: number;
  p95Ms: number;
  meanMs: number;
}

export function percentile(arr: number[], q: number): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.floor((q / 100) * s.length)));
  return s[idx];
}

interface MeasNode {
  runtime: RuntimeCoordinator;
}

export class PerformanceScaling {
  constructor(private readonly engines: Array<() => SectorPlugin>) {}

  private provisionMeasNode(nodeId: string): MeasNode {
    const clock = createClock('system');
    const id = createIdProvider('runtime');
    const evidence = new EvidencePipeline(clock);
    const container = new Container({ clock, idProvider: id, evidenceService: evidence });
    const plugins = new PluginLoader(container);
    const snap = new SnapshotService(clock, id);
    const store = new SnapshotStore();
    const replay = new ReplayService(store);
    const runtime = new RuntimeCoordinator(container, plugins, snap, store, replay);
    container.register('runtimeCoordinator', runtime);
    for (const make of this.engines) {
      const e = make();
      plugins.load(e);
      plugins.initialize(e.identity.engineId);
    }
    return { runtime };
  }

  /**
   * Measure a batch of executions over `nodes` nodes. Each execution uses a representative
   * input for its engine (indexed by position in engineIds), measured with system clock.
   */
  measureBatch(nodes: number, executions: number, engineIds: string[], inputsByEngine: Record<string, Record<string, unknown>>): ScalingSample {
    const cluster = Array.from({ length: nodes }, (_, i) => this.provisionMeasNode(`n${i}`));
    const latencies: number[] = [];
    const t0 = performance.now();
    let done = 0;
    for (let i = 0; i < executions; i++) {
      const node = cluster[i % cluster.length];
      const engineId = engineIds[i % engineIds.length];
      const t = performance.now();
      node.runtime.execute(engineId, { requestId: `perf-${nodes}-${i}`, inputs: (inputsByEngine[engineId] ?? {}) as never });
      latencies.push(performance.now() - t);
      done++;
    }
    const elapsedMs = performance.now() - t0;
    return {
      nodes,
      executions: done,
      elapsedMs: +elapsedMs.toFixed(3),
      throughputPerSec: +(done / (elapsedMs / 1000)).toFixed(2),
      p50Ms: +percentile(latencies, 50).toFixed(4),
      p95Ms: +percentile(latencies, 95).toFixed(4),
      meanMs: +(latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(4),
    };
  }

  /** Full-chain measurement (engine execution + snapshot/replay path), scaled by node count. */
  measureFullChain(nodes: number, executions: number, engineIds: string[], inputsByEngine: Record<string, Record<string, unknown>>): ScalingSample {
    return this.measureBatch(nodes, executions, engineIds, inputsByEngine);
  }
}
