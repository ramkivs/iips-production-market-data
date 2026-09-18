/**
 * Cross-Sector Ranking Engine — stage 3 of the CSIP execution pipeline.
 * Ranks opportunities across sectors by normalized conviction (desc), with a
 * deterministic tie-break by sector (asc). Uses ONLY normalized dimensions, never raw
 * sector metrics.
 */
import type { NormalizedHolding, RankedOpportunity } from '../types';

export class RankingEngine {
  /** Rank holdings by conviction desc, then sector asc. Deterministic. */
  rank(holdings: NormalizedHolding[]): RankedOpportunity[] {
    return holdings
      .map((h) => ({ companyId: h.companyId, sector: h.sector, conviction: h.conviction }))
      .sort((a, b) => {
        if (a.conviction !== b.conviction) return b.conviction - a.conviction;
        return a.sector < b.sector ? -1 : a.sector > b.sector ? 1 : 0;
      });
  }
}
