/** Insurance Metric Evaluation (WP-3) — IM-001…IM-008 from frozen metric library. */
export interface InsuranceInput {
  'IM-001'?: number; // Combined Ratio
  'IM-002'?: number; // Solvency Ratio
  'IM-003'?: number; // APE
  'IM-004'?: number; // VNB
  'IM-005'?: number; // Persistency
  'IM-006'?: number; // Embedded Value
  'IM-007'?: number; // Expense Ratio
  'IM-008'?: number; // Investment Yield
  governanceFlag?: string;
  catastropheFlag?: string;
}

export type InsuranceMetricValues = Record<string, number>;

export class InsuranceMetrics {
  evaluate(input: InsuranceInput): InsuranceMetricValues {
    const out: InsuranceMetricValues = {};
    const defs = ['IM-001', 'IM-002', 'IM-003', 'IM-004', 'IM-005', 'IM-006', 'IM-007', 'IM-008'] as const;
    for (const id of defs) {
      const v = input[id];
      if (v !== undefined && v !== null) out[id] = v;
    }
    return out;
  }
}
