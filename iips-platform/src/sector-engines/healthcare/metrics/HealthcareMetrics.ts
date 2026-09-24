/** Healthcare Metric Evaluation (WP-3) — HC-001…HC-012 from frozen metric library. */
export interface HealthcareInput {
  'HC-001'?: number; // Bed Occupancy
  'HC-002'?: number; // ARPOB
  'HC-003'?: number; // ALOS
  'HC-004'?: number; // EBITDA Margin
  'HC-005'?: number; // Revenue Growth
  'HC-006'?: number; // Debt/Equity
  'HC-007'?: number; // Working Capital / Receivables (proxy for payer mix)
  'HC-008'?: number; // Test Volume Growth
  'HC-009'?: number; // R&D Intensity
  'HC-010'?: number; // Pipeline/Approvals
  'HC-011'?: number; // Book-to-Bill
  'HC-012'?: number; // Recurring Revenue %
  qualityFlag?: string;
  regulatoryFlag?: string;
  pipelineFlag?: string;
}

export type HealthcareMetricValues = Record<string, number>;

export class HealthcareMetrics {
  evaluate(input: HealthcareInput): HealthcareMetricValues {
    const out: HealthcareMetricValues = {};
    const defs = ['HC-001','HC-002','HC-003','HC-004','HC-005','HC-006','HC-007','HC-008','HC-009','HC-010','HC-011','HC-012'] as const;
    for (const id of defs) {
      const v = input[id];
      if (v !== undefined && v !== null) out[id] = v;
    }
    return out;
  }
}
