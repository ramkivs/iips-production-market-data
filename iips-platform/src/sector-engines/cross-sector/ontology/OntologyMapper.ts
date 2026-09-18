/**
 * Ontology Mapper — stage 1 of the CSIP execution pipeline.
 * Maps published engine outputs into the Universal Investment Ontology's normalized
 * dimensions via engine-declared metadata. CSIP never reads engine internals; it consumes
 * only these normalized dimensions. This is the black-box contract.
 *
 * WP-3 (Cross-Sector Intelligence Engine), frozen baseline CSIP v1.0.0.
 */
import type { NormalizedHolding } from '../types';

/** A published engine output record (raw, pre-mapping). */
export interface EngineOutput {
  readonly companyId: string;
  readonly sector: string;
  readonly composite: number;      // 0-100
  readonly confidence: number;     // 0-1
  readonly qualityScore: number;   // 0-100
  readonly riskScore: number;      // 0-100
  readonly growthScore?: number;   // 0-100
  readonly valuationScore?: number; // 0-100
  readonly capitalEfficiency?: number; // 0-100
  readonly franchiseScore?: number; // 0-100 (moat)
  readonly verdict?: string;
}

/**
 * Deterministic ontology metadata mapping. Source: Universal Investment Ontology + the
 * per-engine mappings in the Ontology Consistency Matrix (frozen). Additive only — a new
 * engine registers a row here; no CSIP logic change.
 */
const ONTOLOGY_METADATA: Record<string, {
  quality: string;
  risk: string;
  moat: string;
}> = {
  Banking: { quality: 'asset-quality/funding-quality', risk: 'asset-quality/capital-strength', moat: 'funding-quality' },
  Insurance: { quality: 'underwriting', risk: 'solvency', moat: 'persistency' },
  'Capital Markets': { quality: 'earnings-quality', risk: 'earnings-quality', moat: 'franchise' },
  Healthcare: { quality: 'revenue-quality/clinical-quality', risk: 'clinical-quality', moat: 'clinical-quality' },
};

export class OntologyMapper {
  /** Map a published engine output to a normalized holding. Deterministic. */
  map(output: EngineOutput): NormalizedHolding {
    const meta = ONTOLOGY_METADATA[output.sector] ?? { quality: 'qualityScore', risk: 'riskScore', moat: 'franchiseScore' };
    return {
      companyId: output.companyId,
      sector: output.sector,
      conviction: output.composite,         // composite -> Conviction
      confidence: output.confidence,        // confidence -> Confidence
      quality: output.qualityScore,         // -> Quality
      growth: output.growthScore,           // -> Growth
      risk: output.riskScore,               // -> Risk
      valuation: output.valuationScore,     // -> Valuation
      capitalEfficiency: output.capitalEfficiency, // -> Capital Efficiency
      moat: output.franchiseScore,          // -> Moat
      verdict: output.verdict,
    };
  }

  /** Map a batch of published engine outputs. Deterministic. */
  mapAll(outputs: EngineOutput[]): NormalizedHolding[] {
    return outputs.map((o) => this.map(o));
  }

  /** Mapping provenance (for evidence). Deterministic. */
  mappingSource(sector: string): string {
    return `ontology-metadata-1.0.0:${sector}:${ONTOLOGY_METADATA[sector]?.quality ?? 'default'}`;
  }
}
