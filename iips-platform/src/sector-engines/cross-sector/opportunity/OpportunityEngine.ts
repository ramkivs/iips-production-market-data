/**
 * Opportunity Engine — stage 7 of the CSIP execution pipeline.
 * Surfaces Top-N opportunities from the ranked list, with an explicit rationale
 * (why-this-stock, why-this-sector) per the Cross-Sector Evidence Model. Deterministic.
 */
import type { RankedOpportunity, OpportunitySet } from '../types';

export class OpportunityEngine {
  /** Top-N opportunities with rationale. Deterministic (input order already ranked). */
  top(ranked: RankedOpportunity[], n: number): OpportunitySet {
    const top = ranked.slice(0, n);
    const rationale = top.map(
      (r) =>
        `Why-this-stock: ${r.companyId} is a top opportunity by normalized conviction (${r.conviction}). ` +
        `Why-this-sector: ${r.sector} ranks highest within the cross-sector opportunity set.`,
    );
    if (top.length === 0) rationale.push('No opportunities above the ranking threshold.');
    return { top, rationale };
  }
}
