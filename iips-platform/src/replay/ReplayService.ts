/**
 * Replay Service — reproduce completed executions (IES-005 P4 §10, IES-006.2A).
 *
 * M-2 REPAIR (D41 Workstream C):
 *   Replay now INDEPENDENTLY RECOMPUTES the engine result from the stored snapshot's
 *   execution context. `reproduced` and `byteIdentical` are COMPUTED, not literal.
 *
 *   The replay process:
 *   1. Retrieve the stored snapshot
 *   2. Re-execute the engine using the stored execution context (input, versions)
 *   3. Compare the re-execution output with the stored snapshot output
 *   4. Return computed flags:
 *      - reproduced: true if re-execution completed successfully
 *      - byteIdentical: true if re-execution output matches stored output byte-for-byte
 *
 *   Failure modes:
 *   - Missing snapshot: returns undefined
 *   - Re-execution failure: reproduced=false, byteIdentical=false
 *   - Output mismatch: reproduced=true, byteIdentical=false
 *   - Output match: reproduced=true, byteIdentical=true
 */
import type { Snapshot } from '../snapshot/SnapshotService';
import { SnapshotStore } from '../snapshot/SnapshotStore';
import { createHash } from 'node:crypto';

export interface ReplayResult {
  readonly snapshotId: string;
  readonly reproduced: boolean;
  readonly byteIdentical: boolean;
  readonly evidenceRefs: readonly string[];
  readonly recomputedMetrics?: Readonly<Record<string, number>>;
  readonly recomputedScores?: Readonly<Record<string, number>>;
  readonly recomputedVerdict?: string;
  readonly diagnostic?: string;
}

/** Execution context stored with the snapshot for replay. */
export interface ExecutionContext {
  readonly engineId: string;
  readonly requestId: string;
  readonly inputs: Readonly<Record<string, unknown>>;
  readonly contractVersion?: string;
  readonly calibrationVersion?: string;
}

/** Executor function type for replay recomputation. */
export type ReplayExecutor = (
  engineId: string,
  requestId: string,
  inputs: Record<string, unknown>
) => { metrics: Record<string, number>; scores: Record<string, number>; verdict?: string } | null;

/**
 * Compute a deterministic hash of an object for byte-identity comparison.
 */
function hashObject(obj: unknown): string {
  const json = JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort());
  return createHash('sha256').update(json).digest('hex');
}

export class ReplayService {
  private executor: ReplayExecutor | null = null;

  constructor(private readonly store: SnapshotStore) {}

  /**
   * Register the executor function for replay recomputation.
   * Must be called before replay() to enable actual recomputation.
   */
  setExecutor(executor: ReplayExecutor): void {
    this.executor = executor;
  }

  /**
   * Replay a snapshot by independently recomputing the engine result.
   *
   * M-2 REPAIR: This method now actually re-executes the engine and compares
   * the output with the stored snapshot. `reproduced` and `byteIdentical` are
   * COMPUTED, not literal.
   */
  replay(snapshotId: string): ReplayResult | undefined {
    const snapshot = this.store.get(snapshotId);
    if (!snapshot) return undefined;

    // If no executor is registered, we cannot perform actual recomputation
    if (!this.executor) {
      return {
        snapshotId,
        reproduced: false,
        byteIdentical: false,
        evidenceRefs: snapshot.evidenceRefs,
        diagnostic: 'No executor registered — cannot perform replay recomputation',
      };
    }

    // Retrieve the execution context from the snapshot's provenance
    const executionContext = this.extractExecutionContext(snapshot);
    if (!executionContext) {
      return {
        snapshotId,
        reproduced: false,
        byteIdentical: false,
        evidenceRefs: snapshot.evidenceRefs,
        diagnostic: 'No execution context available for replay',
      };
    }

    // Re-execute the engine
    let recomputed: { metrics: Record<string, number>; scores: Record<string, number>; verdict?: string } | null;
    try {
      recomputed = this.executor(
        executionContext.engineId,
        executionContext.requestId,
        { ...executionContext.inputs }
      );
    } catch (err) {
      return {
        snapshotId,
        reproduced: false,
        byteIdentical: false,
        evidenceRefs: snapshot.evidenceRefs,
        diagnostic: `Re-execution failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    if (!recomputed) {
      return {
        snapshotId,
        reproduced: false,
        byteIdentical: false,
        evidenceRefs: snapshot.evidenceRefs,
        diagnostic: 'Re-execution returned null',
      };
    }

    // Compare re-execution output with stored snapshot
    const metricsMatch = hashObject(recomputed.metrics) === hashObject(snapshot.metrics);
    const scoresMatch = hashObject(recomputed.scores) === hashObject(snapshot.scores);
    const verdictMatch = recomputed.verdict === snapshot.verdict;
    const byteIdentical = metricsMatch && scoresMatch && verdictMatch;

    return {
      snapshotId,
      reproduced: true,
      byteIdentical,
      evidenceRefs: snapshot.evidenceRefs,
      recomputedMetrics: Object.freeze({ ...recomputed.metrics }),
      recomputedScores: Object.freeze({ ...recomputed.scores }),
      recomputedVerdict: recomputed.verdict,
      diagnostic: byteIdentical ? 'Replay successful — byte-identical' : 'Replay completed — output differs',
    };
  }

  replayAll(): ReplayResult[] {
    return this.store.list().map((s) => this.replay(s.snapshotId)!);
  }

  /**
   * Extract execution context from snapshot provenance.
   * The provenance map stores the original execution parameters.
   */
  private extractExecutionContext(snapshot: Snapshot): ExecutionContext | null {
    const p = snapshot.provenance;
    if (!p || !p.engineId || !p.requestId) {
      return null;
    }

    // Reconstruct inputs from provenance
    const inputs: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(p)) {
      if (key.startsWith('input.')) {
        inputs[key.slice(6)] = value;
      }
    }

    return {
      engineId: p.engineId,
      requestId: p.requestId,
      inputs,
      contractVersion: p.contractVersion,
      calibrationVersion: p.calibrationVersion,
    };
  }
}

export type { Snapshot };
