/**
 * Automobile Metrics (D17) — metric evaluation + multi-subsegment resolution per IES-017.
 *
 * Resolution (D17 §4), deterministic:
 *  - Single subsegment -> that subsegment.
 *  - Multi-subsegment + declared subsegmentDominant in the set -> dominant.
 *  - Multi-subsegment, no dominant -> most conservative risk profile (highest leverageAlert,
 *    tie-break lexicographically smallest subsegment id).
 *  - Archetype 'hybrid' -> resolved via hybridDominant (default 'hybrid').
 * Frozen. No Math.random/Date.now.
 *
 * Defensive default subsegment = 'mass-market-oem' (mirrors the certified template's default);
 * unreachable for the 13 certified providers (all declare a subsegment).
 */
export interface AutomobileInput {
  subsegment?: string;
  subsegments?: string[];
  subsegmentDominant?: string;
  archetype: string;
  hybridDominant?: string;

  // AB-001..AB-012 (metric values; omitted -> missing primitive)
  ebitdaMargin?: number;         // AB-001 %
  revenueGrowth?: number;        // AB-002 %
  debtEbitda?: number;           // AB-003 x
  vehicleMargin?: number;        // AB-004 %
  capacityUtilization?: number;  // AB-005 %
  evMix?: number;                // AB-006 %
  fcfYield?: number;             // AB-007 %
  roic?: number;                 // AB-008 %
  capexIntensity?: number;       // AB-009 %
  inventoryDays?: number;        // AB-010 days
  evEbitda?: number;             // AB-011 x
  aftersalesMix?: number;        // AB-012 %

  // Override flags (D17 §10)
  governance?: boolean;
  recallRisk?: boolean;
  batteryCostShock?: boolean;
  demandCollapse?: boolean;
  capexOverrun?: boolean;
  marginCompression?: boolean;
  competitionPressure?: boolean;
}

export interface AutomobileResolution {
  subsegment: string;
  declaredSubsegments: string[];
  archetype: string; // resolved archetype (hybridDominant if hybrid)
}

export class AutomobileMetricsEvaluator {
  resolve(input: AutomobileInput, leverageAlert: (sub: string) => number): AutomobileResolution {
    let declared: string[];
    if (Array.isArray(input.subsegments) && input.subsegments.length > 0) {
      declared = [...input.subsegments];
    } else if (input.subsegment) {
      declared = [input.subsegment];
    } else {
      declared = ['mass-market-oem'];
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

export type AutomobileMetrics = AutomobileInput;
