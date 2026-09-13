/**
 * P14-03 — VISUAL PARITY QUALIFICATION
 *
 * Authority:
 *   D36 P14 Work-Item Definition (commit df73d3e)
 *   D38 P14 Implementation Authorization (commit 22bf59e)
 *
 * Purpose:
 *   Qualify P13 UI surfaces against the visual parity baseline (P14-02).
 *   Implement visual parity qualification and structural diff analysis.
 *
 * Boundaries (hard):
 *   ⚠ **VPQ-1** Parity is structural (view model shape), not pixel-level
 *   ⚠ **VPQ-2** Functional parity governs over pixel similarity (INT-017)
 *   ⚠ **VPQ-3** Concessions must be recorded where applicable
 *   ⚠ **VPQ-4** Evidence must be preserved for A3 review
 */

import { P13_SURFACE_BASELINE, validateAgainstBaseline } from './visualParityBaseline.js';

export const P14_03_MODULE = 'P14-03-VISUAL-PARITY-QUALIFICATION';

/**
 * VPQ-5: Run visual parity qualification for a single surface.
 *
 * @param {object} viewModel — P13 view model to qualify
 * @param {string} surfaceId — surface identifier
 * @returns {{ qualified: boolean, violations: string[], surface: string, concessions: string[] }}
 */
export function qualifySurfaceParity(viewModel, surfaceId) {
  const surfaceDef = P13_SURFACE_BASELINE.find(s => s.surfaceId === surfaceId);
  if (!surfaceDef) {
    return {
      qualified: false,
      violations: [`VPQ-1: surface '${surfaceId}' not found in baseline`],
      surface: surfaceId,
      concessions: [],
    };
  }

  const baselineResult = validateAgainstBaseline(viewModel, surfaceDef);
  const concessions = [];

  // Record concessions for bounded surfaces
  if (surfaceDef.boundedCondition) {
    concessions.push(`${surfaceId}: bounded by ${surfaceDef.boundedCondition}`);
  }

  return {
    qualified: baselineResult.valid,
    violations: baselineResult.violations,
    surface: surfaceId,
    concessions,
  };
}

/**
 * VPQ-6: Run visual parity qualification across all P13 surfaces.
 *
 * @param {Array<{surfaceId: string, viewModel: object}>} surfaces
 * @returns {{ total: number, qualified: number, failed: number, results: Array }}
 */
export function qualifyAllSurfacesParity(surfaces) {
  const results = [];
  let qualified = 0;
  let failed = 0;

  for (const { surfaceId, viewModel } of surfaces) {
    const result = qualifySurfaceParity(viewModel, surfaceId);
    if (result.qualified) qualified++;
    else failed++;
    results.push(result);
  }

  return {
    total: surfaces.length,
    qualified,
    failed,
    results,
  };
}

/**
 * VPQ-7: Generate a parity report suitable for A3 review.
 *
 * @param {object} qualificationResult — result from qualifyAllSurfacesParity
 * @returns {object} parity report
 */
export function generateParityReport(qualificationResult) {
  return Object.freeze({
    module: P14_03_MODULE,
    date: new Date().toISOString(),
    summary: {
      total: qualificationResult.total,
      qualified: qualificationResult.qualified,
      failed: qualificationResult.failed,
      passRate: qualificationResult.total > 0
        ? `${((qualificationResult.qualified / qualificationResult.total) * 100).toFixed(1)}%`
        : 'N/A',
    },
    failures: qualificationResult.results
      .filter(r => !r.qualified)
      .map(r => ({ surface: r.surface, violations: r.violations })),
    concessions: qualificationResult.results
      .flatMap(r => r.concessions),
    parityRules: {
      functionalParityOverPixelSimilarity: true,
      structuralBaselineNotPixel: true,
      concessionsRecorded: true,
    },
  });
}
