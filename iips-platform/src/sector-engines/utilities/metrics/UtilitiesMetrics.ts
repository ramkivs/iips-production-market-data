/** Utilities Metrics (WP-3) — metric evaluation per IES-012 Metric Library (D06). Frozen. */
export interface UtilitiesInput {
  segment: string;              // regulated-electric | gas-distribution | water-utilities | ipp-merchant | multi-utility
  regulatoryPosture: string;    // constructive | neutral | adversarial
  rateBaseGrowth: number;       // UM-006 %
  allowedRoe: number;           // UM-007 %
  ffoDebt: number;              // UM-008 %
  omEfficiency: number;         // UM-009 %
  demandGrowth: number;         // UM-010 %
  saidi: number;                // UM-011 minutes
  transitionCapexIntensity: number; // UM-012 %
  ebitdaMargin: number;         // UM-001 %
  revenueGrowth: number;        // UM-002 %
  debtEbitda: number;           // UM-003 x
  peRatio: number;              // UM-004
  roe: number;                  // UM-005 %
  governance?: boolean;
  adverseRateCase?: boolean;
  regulatoryLag?: boolean;
  capexOverrun?: boolean;
  strandedAsset?: boolean;
}

export type UtilitiesMetrics = UtilitiesInput;

export class UtilitiesMetricsEvaluator {
  evaluate(input: UtilitiesInput): UtilitiesMetrics {
    return input;
  }
}
