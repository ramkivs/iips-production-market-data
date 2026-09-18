/** Banking Metric Evaluation (WP-3) — computes BM-001…BM-006 + capital metrics from frozen input schema. */
export interface BankingInput {
  readonly 'BM-001'?: number; // ROA
  readonly 'BM-002'?: number; // ROE
  readonly 'BM-003'?: number; // NIM
  readonly 'BM-004'?: number; // CASA
  readonly 'BM-005'?: number; // GNPA
  readonly 'BM-006'?: number; // NNPA
  readonly 'BM-014'?: number; // CET1
  readonly 'BM-015'?: number; // CAR
  readonly governanceFlag?: string;
}

/** Evaluated metric values keyed by metric id (frozen scope). */
export type BankingMetricValues = Record<string, number>;

export class BankingMetrics {
  /** Evaluate available metrics, preserving only those provided (null = missing → confidence reduction). */
  evaluate(input: BankingInput): BankingMetricValues {
    const out: BankingMetricValues = {};
    const defs = ['BM-001', 'BM-002', 'BM-003', 'BM-004', 'BM-005', 'BM-006', 'BM-014', 'BM-015'] as const;
    for (const id of defs) {
      const v = input[id];
      if (v !== undefined && v !== null) out[id] = v;
    }
    return out;
  }
}
