/**
 * Institutional Investment Platform System (IIPS)
 * Worst-Case Quality Floor Rollup (P07 / AD-13 QP-1..7)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { QualityState, QUALITY_HIERARCHY } from '../contracts/types.js';

const RANK_TO_QUALITY: Record<number, QualityState> = {
  1: 'GOOD',
  2: 'STALE',
  3: 'PARTIAL',
  4: 'UNAVAILABLE',
};

/**
 * Aggregates multiple quality states into a single composite quality state
 * according to the non-negotiable worst-case quality floor rule:
 * GOOD (1) < STALE (2) < PARTIAL (3) < UNAVAILABLE (4).
 *
 * Silent quality upgrades are mathematically impossible under this function.
 */
export function rollupQuality(qualities: QualityState[]): QualityState {
  if (!qualities || qualities.length === 0) {
    return 'UNAVAILABLE';
  }

  let maxRank = 1;
  for (const q of qualities) {
    const rank = QUALITY_HIERARCHY[q] || 4;
    if (rank > maxRank) {
      maxRank = rank;
    }
  }

  return RANK_TO_QUALITY[maxRank] || 'UNAVAILABLE';
}

/**
 * Combines a base quality with a freshness evaluation result.
 */
export function combineQualityWithFreshness(
  baseQuality: QualityState,
  freshnessQuality: QualityState
): QualityState {
  return rollupQuality([baseQuality, freshnessQuality]);
}
