/**
 * Technology Metrics (WP-3) — metric evaluation + hybrid / multi-subsegment resolution per IES-015.
 *
 * Resolution (D15 v1.3 / D09 §2), deterministic:
 *  - Single subsegment -> that subsegment.
 *  - Multi-subsegment + declared subsegmentDominant in the set -> dominant.
 *  - Multi-subsegment, no dominant -> most conservative risk profile (highest leverageAlert,
 *    tie-break lexicographically smallest subsegment id).
 *  - Archetype 'hybrid' -> resolved via hybridDominant (default risk 1.0 'hybrid').
 * Frozen. No Math.random/Date.now.
 */
export interface TechnologyInput {
  subsegment?: string;
  subsegments?: string[];
  subsegmentDominant?: string;
  archetype: string;
  hybridDominant?: string;

  // TM-001..TM-012 (metric values; omitted -> missing primitive)
  ebitdaMargin?: number;            // TM-001 %
  revenueGrowth?: number;           // TM-002 %
  debtEbitda?: number;              // TM-003 x
  evRevenue?: number;               // TM-004 (EV/Revenue or EV/EBITDA per subsegment)
  fcfYield?: number;                // TM-005 %
  recurringRevenuePct?: number;     // TM-006 %
  nrr?: number;                     // TM-007 %
  grossMargin?: number;             // TM-008 %
  rdIntensity?: number;             // TM-009 % (3-band)
  customerConcentration?: number;   // TM-010 %
  capexIntensity?: number;          // TM-011 %
  usageGrowth?: number;             // TM-012 %

  // Override flags (D10 / D15 §10)
  governance?: boolean;
  disruption?: boolean;
  churnCollapse?: boolean;
  customerLoss?: boolean;
  capexOverrun?: boolean;
  marginCompression?: boolean;
}

export interface TechnologyResolution {
  subsegment: string;
  declaredSubsegments: string[];
  archetype: string; // resolved archetype (hybridDominant if hybrid)
}

export class TechnologyMetricsEvaluator {
  resolve(input: TechnologyInput, leverageAlert: (sub: string) => number): TechnologyResolution {
    let declared: string[];
    if (Array.isArray(input.subsegments) && input.subsegments.length > 0) {
      declared = [...input.subsegments];
    } else if (input.subsegment) {
      declared = [input.subsegment];
    } else {
      declared = ['software-saas'];
    }

    let subsegment: string;
    if (declared.length === 1) {
      subsegment = declared[0];
    } else if (input.subsegmentDominant && declared.includes(input.subsegmentDominant)) {
      subsegment = input.subsegmentDominant;
    } else {
      // most conservative risk profile = highest leverageAlert, tie-break lexicographic
      subsegment = [...declared].sort((a, b) => {
        const d = leverageAlert(b) - leverageAlert(a);
        return d !== 0 ? d : (a < b ? -1 : a > b ? 1 : 0);
      })[0];
    }

    const archetype = input.archetype === 'hybrid' ? (input.hybridDominant ?? 'hybrid') : input.archetype;
    return { subsegment, declaredSubsegments: declared, archetype };
  }
}

export type TechnologyMetrics = TechnologyInput;
