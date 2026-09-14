/**
 * Telecommunications Metrics (D16) — metric evaluation + multi-subsegment resolution per IES-016.
 *
 * Resolution (D16 §4), deterministic:
 *  - Single subsegment -> that subsegment.
 *  - Multi-subsegment + declared subsegmentDominant in the set -> dominant.
 *  - Multi-subsegment, no dominant -> most conservative risk profile (highest leverageAlert,
 *    tie-break lexicographically smallest subsegment id).
 *  - Archetype 'hybrid' -> resolved via hybridDominant (default 'hybrid').
 * Frozen. No Math.random/Date.now.
 *
 * Defensive default subsegment = 'wireless-mno' (mirrors the certified template's default);
 * unreachable for the 13 certified providers (all declare a subsegment).
 */
export interface TelecommunicationsInput {
  subsegment?: string;
  subsegments?: string[];
  subsegmentDominant?: string;
  archetype: string;
  hybridDominant?: string;

  // TC-001..TC-012 (metric values; omitted -> missing primitive)
  ebitdaMargin?: number;         // TC-001 %
  revenueGrowth?: number;        // TC-002 %
  debtEbitda?: number;           // TC-003 x
  arpu?: number;                 // TC-004 USD/month (per-site for tower-infra)
  churnRate?: number;            // TC-005 %/year
  postpaidMix?: number;          // TC-006 %
  fcfYield?: number;             // TC-007 %
  roic?: number;                 // TC-008 %
  capexIntensity?: number;       // TC-009 %
  spectrumCost?: number;         // TC-010 USD/pop
  evEbitda?: number;             // TC-011 x
  usageGrowth?: number;          // TC-012 %

  // Override flags (D16 §10)
  governance?: boolean;
  regulatoryRisk?: boolean;
  competitionPressure?: boolean;
  subscriberCollapse?: boolean;
  capexOverrun?: boolean;
  marginCompression?: boolean;
}

export interface TelecommunicationsResolution {
  subsegment: string;
  declaredSubsegments: string[];
  archetype: string; // resolved archetype (hybridDominant if hybrid)
}

export class TelecommunicationsMetricsEvaluator {
  resolve(input: TelecommunicationsInput, leverageAlert: (sub: string) => number): TelecommunicationsResolution {
    let declared: string[];
    if (Array.isArray(input.subsegments) && input.subsegments.length > 0) {
      declared = [...input.subsegments];
    } else if (input.subsegment) {
      declared = [input.subsegment];
    } else {
      declared = ['wireless-mno'];
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

export type TelecommunicationsMetrics = TelecommunicationsInput;
