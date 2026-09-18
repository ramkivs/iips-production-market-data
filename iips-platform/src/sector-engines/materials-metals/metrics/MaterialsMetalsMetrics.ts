/**
 * Materials & Metals Metrics (D20) — metric evaluation + multi-subsegment resolution per IES-020.
 *
 * Resolution (D20 §4), deterministic:
 *  - Single subsegment -> that subsegment.
 *  - Multi-subsegment + declared subsegmentDominant in the set -> dominant.
 *  - Multi-subsegment, no dominant -> most conservative risk profile (highest leverageAlert,
 *    tie-break lexicographically smallest subsegment id).
 *  - Archetype 'hybrid' -> resolved via hybridDominant (default 'hybrid').
 * Frozen. No Math.random/Date.now.
 *
 * Defensive default subsegment = 'diversified-miners' (mirrors the certified template's default);
 * unreachable for the 13 certified providers (all declare a subsegment).
 */
export interface MaterialsMetalsInput {
  subsegment?: string;
  subsegments?: string[];
  subsegmentDominant?: string;
  archetype: string;
  hybridDominant?: string;

  // MM-001..MM-012 (metric values; omitted -> missing primitive)
  ebitdaMargin?: number;         // MM-001 %
  revenueGrowth?: number;        // MM-002 %
  debtEbitda?: number;           // MM-003 x
  reserveLife?: number;          // MM-004 years
  cashCostCurve?: number;        // MM-005 %
  realizedPriceSpread?: number;  // MM-006 %
  fcfYield?: number;             // MM-007 %
  roic?: number;                 // MM-008 %
  capexIntensity?: number;       // MM-009 %
  inventoryDays?: number;        // MM-010 days
  evEbitda?: number;             // MM-011 x
  recyclingInputMix?: number;    // MM-012 %

  // Override flags (D20 §10)
  governance?: boolean;
  tailingsFailure?: boolean;
  permittingRevocation?: boolean;
  strikeDisruption?: boolean;
  capexOverrun?: boolean;
  marginCompression?: boolean;
  competitionPressure?: boolean;
}

export interface MaterialsMetalsResolution {
  subsegment: string;
  declaredSubsegments: string[];
  archetype: string; // resolved archetype (hybridDominant if hybrid)
}

export class MaterialsMetalsMetricsEvaluator {
  resolve(input: MaterialsMetalsInput, leverageAlert: (sub: string) => number): MaterialsMetalsResolution {
    let declared: string[];
    if (Array.isArray(input.subsegments) && input.subsegments.length > 0) {
      declared = [...input.subsegments];
    } else if (input.subsegment) {
      declared = [input.subsegment];
    } else {
      declared = ['diversified-miners'];
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

export type MaterialsMetalsMetrics = MaterialsMetalsInput;
