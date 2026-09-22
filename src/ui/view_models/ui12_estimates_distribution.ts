/**
 * Institutional Investment Platform System (IIPS)
 * UI12: Consensus Estimates Distribution View Model Builder (P13 / P14)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { EstimatesEngine, IndividualAnalystEstimate } from '../../intelligence/estimates_engine.js';
import { EstimateMetric } from '../../contracts/d07_estimates.js';
import { UI12EstimatesDistributionViewModel, ResponsiveTier } from '../types.js';
import { AccessibilityEngine } from '../accessibility_engine.js';
import { ResponsiveEngine } from '../responsive_engine.js';
import { ExecutiveProvenance } from '../../transports/types.js';

export class UI12EstimatesDistributionBuilder {
  public static build(params: {
    estimatesEngine: EstimatesEngine;
    estimatesList: IndividualAnalystEstimate[];
    companyId: string;
    companyName: string;
    metric: EstimateMetric;
    targetPeriod: string;
    asOf: string;
    viewportWidth?: number;
  }): UI12EstimatesDistributionViewModel {
    const tier: ResponsiveTier = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280).tier;
    const bp = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280);

    // Compute consensus using server-side EstimatesEngine
    const consensus = params.estimatesEngine.computeConsensus({
      companyId: params.companyId,
      metric: params.metric,
      targetPeriod: params.targetPeriod,
      asOf: params.asOf,
    });

    const isConsensusSufficient = consensus.isConsensusValid; // N >= 3 check
    const qualityState = consensus.qualityState;

    const provenance: ExecutiveProvenance = {
      sourceClassification: 'DERIVED',
      asOf: params.asOf,
      evaluatedAt: new Date().toISOString(),
      dataVersion: 'v1.0.0',
      lineageDigest: 'estimates-distribution-lineage-hash-00000000000000000000000000000',
      quality: qualityState,
      replayConstraintApplied: false,
    };

    return {
      surfaceId: 'UI12_ESTIMATES_DISTRIBUTION',
      companyId: params.companyId,
      companyName: params.companyName,
      asOf: params.asOf,
      meanTargetPrice: consensus.mean,
      medianTargetPrice: consensus.median,
      highTargetPrice: consensus.high,
      lowTargetPrice: consensus.low,
      analystCount: consensus.analystCount,
      standardDeviation: consensus.standardDeviation,
      isConsensusSufficient,
      qualityIndicator: AccessibilityEngine.getQualityIndicator(qualityState),
      provenance,
      responsiveLayout: {
        tier,
        columns: bp.columns,
        pinnedColumn: bp.pinPrimaryColumn ? 'brokerId' : undefined,
      },
      accessibility: {
        ariaLive: 'polite',
        ariaRole: 'region',
        focusElementId: 'ui12-consensus-summary',
        tableCaption: `Consensus Target Price & EPS Estimates Distribution for ${params.companyName}`,
      },
    };
  }
}
