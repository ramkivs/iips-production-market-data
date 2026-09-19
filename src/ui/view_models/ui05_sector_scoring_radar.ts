/**
 * Institutional Investment Platform System (IIPS)
 * UI05: Sector Engine Scoring Radar View Model Builder (P13 / P14 / AD-14)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { EngineScoreOutput } from '../../engine_adapters/types.js';
import { GOVERNED_SECTOR_DEFAULTS } from '../../engine_adapters/sector_defaults.js';
import { UI05SectorScoringRadarViewModel, ResponsiveTier } from '../types.js';
import { AccessibilityEngine } from '../accessibility_engine.js';
import { ResponsiveEngine } from '../responsive_engine.js';
import { ExecutiveProvenance } from '../../transports/types.js';

export class UI05SectorScoringRadarBuilder {
  public static build(params: {
    engineScore: EngineScoreOutput;
    companyName: string;
    viewportWidth?: number;
  }): UI05SectorScoringRadarViewModel {
    const tier: ResponsiveTier = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280).tier;
    const bp = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280);

    const benchmark = GOVERNED_SECTOR_DEFAULTS[params.engineScore.engineId] || GOVERNED_SECTOR_DEFAULTS.CSIP_COMPOSITE;

    const factorBreakdown = [
      {
        factor: 'Valuation',
        score: params.engineScore.factorBreakdown.valuation ?? 50,
        weight: 0.3,
        sectorBenchmark: benchmark.benchmarkPe,
        delta: (params.engineScore.factorBreakdown.valuation ?? 50) - 50,
      },
      {
        factor: 'Quality',
        score: params.engineScore.factorBreakdown.quality ?? 50,
        weight: 0.3,
        sectorBenchmark: benchmark.benchmarkRoe,
        delta: (params.engineScore.factorBreakdown.quality ?? 50) - 50,
      },
      {
        factor: 'Profitability',
        score: params.engineScore.factorBreakdown.profitability ?? 50,
        weight: 0.25,
        sectorBenchmark: benchmark.benchmarkOperatingMargin,
        delta: (params.engineScore.factorBreakdown.profitability ?? 50) - 50,
      },
      {
        factor: 'Risk / Momentum',
        score: params.engineScore.factorBreakdown.momentum ?? 50,
        weight: 0.15,
        sectorBenchmark: benchmark.defaultBeta,
        delta: (params.engineScore.factorBreakdown.momentum ?? 50) - 50,
      },
    ];

    const provenance: ExecutiveProvenance = {
      sourceClassification: 'CERTIFIED_ENGINE',
      asOf: params.engineScore.provenance.asOf,
      evaluatedAt: params.engineScore.evaluatedAt,
      dataVersion: params.engineScore.versionVector.engineVersion,
      lineageDigest: params.engineScore.provenance.lineageHash,
      quality: params.engineScore.qualityState,
      replayConstraintApplied: false,
    };

    return {
      surfaceId: 'UI05_SECTOR_SCORING_RADAR',
      companyId: params.engineScore.companyId,
      companyName: params.companyName,
      asOf: params.engineScore.evaluatedAt,
      engineId: params.engineScore.engineId,
      rawScore: params.engineScore.rawScore,
      normalizedScore: params.engineScore.normalizedScore,
      grade: params.engineScore.grade,
      factorBreakdown,
      isFallbackApplied: params.engineScore.isFallbackApplied,
      fallbackFields: params.engineScore.fallbackFields,
      qualityIndicator: AccessibilityEngine.getQualityIndicator(params.engineScore.qualityState),
      provenance,
      responsiveLayout: {
        tier,
        columns: bp.columns,
        pinnedColumn: bp.pinPrimaryColumn ? 'factor' : undefined,
      },
      accessibility: {
        ariaLive: 'polite',
        ariaRole: 'region',
        focusElementId: 'ui05-radar-chart',
        tableCaption: `Frozen 13 Sector Model Factor Breakdown for ${params.companyName}`,
      },
    };
  }
}
