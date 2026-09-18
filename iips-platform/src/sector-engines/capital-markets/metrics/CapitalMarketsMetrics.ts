/** Capital Markets Metric Evaluation (WP-3) — CM-001…CM-008 from frozen metric library. */
export interface CapitalMarketsInput {
  'CM-001'?: number; // AUM
  'CM-002'?: number; // AUM Growth
  'CM-003'?: number; // Expense Ratio/TER
  'CM-004'?: number; // Cost-to-Income
  'CM-005'?: number; // Recurring %
  'CM-006'?: number; // Market Share
  'CM-007'?: number; // Brokerage Income
  'CM-008'?: number; // Net Flows
  regulatoryFlag?: string;
  governanceFlag?: string;
  marketCycleFlag?: string;
}

export type CapitalMarketsMetricValues = Record<string, number>;

export class CapitalMarketsMetrics {
  evaluate(input: CapitalMarketsInput): CapitalMarketsMetricValues {
    const out: CapitalMarketsMetricValues = {};
    const defs = ['CM-001', 'CM-002', 'CM-003', 'CM-004', 'CM-005', 'CM-006', 'CM-007', 'CM-008'] as const;
    for (const id of defs) {
      const v = input[id];
      if (v !== undefined && v !== null) out[id] = v;
    }
    return out;
  }
}
