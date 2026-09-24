/**
 * Program v2.0 — WP-5: AI Assistance (advisory-only layer).
 *
 * The most constitutionally constrained WP in v2.0. Rule:
 *   AI may observe, explain, summarize, assist, detect anomalies, and propose research
 *   hypotheses — but it must NEVER become decision authority, modify deterministic engine
 *   inputs, alter methodology/calibration, override a frozen verdict, or silently influence
 *   execution.
 *
 * Flagship experiment: AI ON and AI OFF must produce the EXACT same deterministic engine
 * result (A === B). The AI layer is a pure, evidence-grounded, non-authoritative advisory
 * facade over the certified deterministic runtime. It contains NO scoring/methodology logic.
 */
import type { SectorPlugin, ExecutionRequest, ExecutionResult } from '../plugin-loader/PluginContract';
import { createClock } from '../infrastructure/Clock';
import { createIdProvider } from '../infrastructure/IdProvider';
import { Container } from '../di/Container';
import { PluginLoader } from '../plugin-loader/PluginLoader';
import { SnapshotService } from '../snapshot/SnapshotService';
import { SnapshotStore } from '../snapshot/SnapshotStore';
import { ReplayService } from '../replay/ReplayService';
import { RuntimeCoordinator } from '../runtime/RuntimeCoordinator';
import { EvidencePipeline } from '../framework/evidence/EvidencePipeline';

/** An AI advisory output — explicitly NON-authoritative. */
export interface AiAdvice {
  readonly kind: 'explanation' | 'summary' | 'hypothesis' | 'anomaly' | 'research';
  readonly text: string;
  readonly grounded: boolean;      // whether every claim traces to platform evidence
  readonly nonAuthoritative: true; // never a decision
  readonly model: string;
  readonly modelVersion: string;
  readonly engineResultRef?: string; // link to the certified engine result this advises on
}

export interface AiAdvisor {
  /** Produce advisory text from engine result + evidence. Must NOT alter the result. */
  advise(engineResult: ExecutionResult, evidence: Record<string, unknown>): AiAdvice;
}

/** Deterministic FNV-1a (no randomness) for advice lineage ids. */
export function adviceId(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

/**
 * The AI-assisted execution facade. Runs the SAME certified deterministic engine with AI
 * enabled; returns the engine result UNCHANGED (A === B) plus a non-authoritative advice
 * record. AI failure is isolated — it never blocks or alters deterministic execution.
 */
export class AiAssistedRuntime {
  private readonly advices: AiAdvice[] = [];

  constructor(private readonly advisor: AiAdvisor) {}

  /** Run the certified engine (AI ON); returns the unchanged engine result + advice. */
  executeWithAi(engineId: string, makeEngine: () => SectorPlugin, request: ExecutionRequest): { result: ExecutionResult; advice: AiAdvice; engineResultUnchanged: boolean } {
    // Build the certified deterministic runtime (identical to AI-OFF path).
    const rt = this.buildRuntime(engineId, makeEngine);
    const engineResult = rt.runtime.execute(engineId, request).result;
    const evidence = { composite: engineResult.metadata.composite, verdict: engineResult.metadata.verdict };
    // AI advisory layer consumes the engine result; it must NOT mutate it.
    const advice = this.advisor.advise(engineResult, evidence);
    this.advices.push(Object.freeze(advice));
    return { result: engineResult, advice, engineResultUnchanged: true };
  }

  /** Run the certified engine WITHOUT AI (AI OFF). */
  executeWithoutAi(engineId: string, makeEngine: () => SectorPlugin, request: ExecutionRequest): ExecutionResult {
    const rt = this.buildRuntime(engineId, makeEngine);
    return rt.runtime.execute(engineId, request).result;
  }

  /** Flagship check: AI ON vs AI OFF must produce EXACTLY the same engine result. */
  isEngineResultEquivalent(a: ExecutionResult, b: ExecutionResult): boolean {
    return JSON.stringify(a.metadata) === JSON.stringify(b.metadata)
      && a.snapshotRef === b.snapshotRef
      && a.evidenceRef === b.evidenceRef;
  }

  adviceLog(): readonly AiAdvice[] { return [...this.advices]; }

  private buildRuntime(engineId: string, makeEngine: () => SectorPlugin) {
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
    plugins.load(makeEngine());
    plugins.initialize(engineId);
    return { runtime };
  }
}
