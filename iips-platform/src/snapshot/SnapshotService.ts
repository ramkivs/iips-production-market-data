/**
 * Snapshot Service — immutable snapshot creation (IES-005 P4 §11, IES-006.2A).
 *
 * M-2 REPAIR (D41 Workstream C):
 *   Snapshots now store execution context in provenance for replay recomputation.
 *   The provenance map includes engineId, requestId, and input parameters.
 */
import type { Clock } from '../infrastructure/Clock';
import type { IdProvider } from '../infrastructure/IdProvider';
import { deepFreeze } from '../infrastructure/deepFreeze';

export interface SnapshotInput {
  readonly engineId: string;
  readonly metrics: Readonly<Record<string, number>>;
  readonly scores: Readonly<Record<string, number>>;
  readonly verdict?: string;
  readonly evidenceRefs?: readonly string[];
  readonly provenance?: Readonly<Record<string, string>>;
  readonly executionContext?: {
    readonly requestId: string;
    readonly inputs: Readonly<Record<string, unknown>>;
    readonly contractVersion?: string;
    readonly calibrationVersion?: string;
  };
  readonly marketDataLineage?: string; // P15: optional market-data snapshot ID for lineage propagation
}

export interface Snapshot {
  readonly snapshotId: string;
  readonly engineId: string;
  readonly schemaVersion: string;
  readonly generatedAt: string;
  readonly metrics: Readonly<Record<string, number>>;
  readonly scores: Readonly<Record<string, number>>;
  readonly verdict?: string;
  readonly evidenceRefs: readonly string[];
  readonly provenance: Readonly<Record<string, string>>;
}

export class SnapshotService {
  constructor(
    private readonly clock: Clock,
    private readonly idProvider: IdProvider,
    private readonly schemaVersion = 'snapshot-1.0',
  ) {}

  create(input: SnapshotInput): Readonly<Snapshot> {
    // Build provenance map with execution context for replay
    const provenance: Record<string, string> = { ...(input.provenance ?? {}) };
    
    // M-2 REPAIR: Store execution context in provenance for replay recomputation
    if (input.executionContext) {
      provenance.engineId = input.engineId;
      provenance.requestId = input.executionContext.requestId;
      if (input.executionContext.contractVersion) {
        provenance.contractVersion = input.executionContext.contractVersion;
      }
      if (input.executionContext.calibrationVersion) {
        provenance.calibrationVersion = input.executionContext.calibrationVersion;
      }
      // Store inputs with 'input.' prefix for reconstruction during replay
      for (const [key, value] of Object.entries(input.executionContext.inputs)) {
        provenance[`input.${key}`] = JSON.stringify(value);
      }
    }
    
    // P15: Store market-data lineage in provenance for immutable lineage tracking
    if (input.marketDataLineage) {
      provenance.marketDataLineage = input.marketDataLineage;
    }

    const snapshot: Snapshot = {
      snapshotId: this.idProvider.generate('SNAP', `${input.engineId}|${this.clock.now()}`),
      engineId: input.engineId,
      schemaVersion: this.schemaVersion,
      generatedAt: this.clock.now(),
      metrics: Object.freeze({ ...input.metrics }),
      scores: Object.freeze({ ...input.scores }),
      verdict: input.verdict,
      evidenceRefs: Object.freeze([...(input.evidenceRefs ?? [])]),
      provenance: Object.freeze(provenance),
    };
    return deepFreeze(snapshot);
  }
}
