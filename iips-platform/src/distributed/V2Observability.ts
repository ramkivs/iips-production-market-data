/**
 * Program v2.0 — WP-10: Observability (v2.0 distributed observability).
 *
 * Extends the v1.1 IES-005.3 observability contract across the v2.0 distributed + live-data
 * chain. Telemetry is OBSERVATION, never decision authority. It traces:
 *   live-data acquisition -> snapshot creation -> dataVersion/asOf -> engine execution
 *   -> evidence -> snapshot -> replay -> distributed node -> HA/DR
 *
 * Invariants: telemetry cannot modify deterministic outputs; replay telemetry identifies the
 * ORIGINAL data snapshot (not current market data); sector identity isolated; no secrets leak;
 * overhead measured (not SLA). Built on the immutable, versioned live-data snapshots (WP-3)
 * and the distributed/HA/DR nodes (WP-1/WP-2/WP-13).
 */
export type TraceEvent =
  | 'live-data.acquired'
  | 'snapshot.created'
  | 'execution.start'
  | 'execution.completed'
  | 'evidence.created'
  | 'snapshot.recorded'
  | 'replay.issued'
  | 'replay.completed'
  | 'node.transition'
  | 'ha.failover'
  | 'dr.recovery'
  | 'provider.failure';

export interface TraceRecord {
  readonly traceId: string;
  readonly engineId?: string;
  readonly nodeId?: string;
  readonly dataVersion?: string;
  readonly asOf?: string;
  readonly provider?: string;
  readonly quality?: string;
  readonly completenessPct?: number;
  readonly snapshotId?: string;
  readonly evidenceRef?: string;
  readonly event: TraceEvent;
  readonly requestId?: string;
  readonly [k: string]: unknown;
}

export class V2Observability {
  private readonly records: TraceRecord[] = [];

  /** Deterministic trace id from lineage + request (no randomness). */
  traceId(lineage: string, requestId: string): string {
    let h = 0x811c9dc5;
    const input = `${lineage}|${requestId}`;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return `T-${(h >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
  }

  private emit(record: TraceRecord): void {
    this.records.push(Object.freeze({ ...record }));
  }

  recordLiveDataAcquired(lineage: string, req: string, p: { dataVersion: string; asOf: string; provider: string; quality: string; completenessPct: number }) {
    this.emit({ traceId: this.traceId(lineage, req), event: 'live-data.acquired', ...p });
  }
  recordSnapshotCreated(lineage: string, req: string, snapshotId: string, p: { dataVersion: string; asOf: string; provider: string; quality: string }) {
    this.emit({ traceId: this.traceId(lineage, req), event: 'snapshot.created', snapshotId, ...p });
  }
  recordExecution(lineage: string, engineId: string, nodeId: string, req: string, state: string, p: { dataVersion: string; asOf: string; snapshotId: string }) {
    this.emit({ traceId: this.traceId(lineage, req), engineId, nodeId, requestId: req, event: state === 'COMPLETED' ? 'execution.completed' : 'execution.start', state, ...p });
  }
  recordEvidence(lineage: string, engineId: string, req: string, evidenceRef: string, snapshotId: string) {
    this.emit({ traceId: this.traceId(lineage, req), engineId, requestId: req, event: 'evidence.created', evidenceRef, snapshotId });
  }
  recordSnapshotRecorded(lineage: string, engineId: string, req: string, snapshotRef: string) {
    this.emit({ traceId: this.traceId(lineage, req), engineId, requestId: req, event: 'snapshot.recorded', snapshotRef });
  }
  recordReplay(lineage: string, engineId: string, req: string, snapshotId: string, originalDataVersion: string, reproduced: boolean) {
    this.emit({ traceId: this.traceId(lineage, req), engineId, requestId: req, event: reproduced ? 'replay.completed' : 'replay.issued', snapshotId, originalDataVersion, reproduced });
  }
  recordNodeTransition(lineage: string, req: string, nodeId: string, from: string, to: string) {
    this.emit({ traceId: this.traceId(lineage, req), nodeId, requestId: req, event: 'node.transition', from, to });
  }
  recordFailover(lineage: string, req: string, nodeId: string, reason: string) {
    this.emit({ traceId: this.traceId(lineage, req), nodeId, requestId: req, event: 'ha.failover', reason });
  }
  recordDrRecovery(lineage: string, req: string, nodeId: string) {
    this.emit({ traceId: this.traceId(lineage, req), nodeId, requestId: req, event: 'dr.recovery' });
  }
  recordProviderFailure(lineage: string, req: string, provider: string) {
    this.emit({ traceId: this.traceId(lineage, req), provider, requestId: req, event: 'provider.failure' });
  }

  list(): readonly TraceRecord[] { return [...this.records]; }

  byTrace(traceId: string): TraceRecord[] { return this.records.filter((r) => r.traceId === traceId); }

  clear(): void { this.records.length = 0; }
}
