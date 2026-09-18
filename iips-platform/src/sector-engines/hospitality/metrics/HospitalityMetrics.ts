/** Hospitality Metrics (WP-3) — metric evaluation per IES-010 Metric Library (D06). Frozen. */
export interface HospitalityInput {
  businessModel: string;      // owned | leased | managed | franchised | asset-light
  occupancy: number;          // HM-005 %
  adr: number;                // HM-006
  revpar: number;             // HM-007
  revparGrowth: number;       // HM-009 %
  gopMargin: number;          // HM-008 %
  ebitdaMargin: number;       // HM-001 %
  feeMix: number;             // HM-010 %
  demandQualityMix: number;   // HM-011 %
  debtEbitda: number;         // HM-003 x
  roic: number;               // HM-012 %
  demandShock?: boolean;
  occupancyCollapse?: boolean;
  brandDeterioration?: boolean;
  governance?: boolean;
}

export type HospitalityMetrics = HospitalityInput;

export class HospitalityMetricsEvaluator {
  evaluate(input: HospitalityInput): HospitalityMetrics {
    return input;
  }
}
