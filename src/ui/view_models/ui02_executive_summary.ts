/**
 * Institutional Investment Platform System (IIPS)
 * UI02: Executive Summary Dashboard View Model Builder (P13 / AD-14)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { MarketDataDTO } from '../../transports/market_data_dto.js';
import { EngineScoreOutput } from '../../engine_adapters/types.js';
import { IntelligenceDTO } from '../../transports/intelligence_dto.js';
import { UI02ExecutiveSummaryViewModel, ResponsiveTier } from '../types.js';
import { AccessibilityEngine } from '../accessibility_engine.js';
import { ResponsiveEngine } from '../responsive_engine.js';
import { QualityState } from '../../contracts/types.js';

export class UI02ExecutiveSummaryBuilder {
  public static build(params: {
    marketData: MarketDataDTO;
    engineScore: EngineScoreOutput;
    intelligence: IntelligenceDTO;
    companyName: string;
    rank?: number;
    viewportWidth?: number;
  }): UI02ExecutiveSummaryViewModel {
    const tier: ResponsiveTier = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280).tier;
    const bp = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280);

    // Rollup worst-case quality across all 3 constituent inputs
    const qualityStates: QualityState[] = [
      params.marketData.quality,
      params.engineScore.qualityState,
      params.intelligence.quality,
    ];

    let effectiveQuality: QualityState = 'GOOD';
    if (qualityStates.includes('UNAVAILABLE')) {
      effectiveQuality = 'UNAVAILABLE';
    } else if (qualityStates.includes('PARTIAL')) {
      effectiveQuality = 'PARTIAL';
    } else if (qualityStates.includes('STALE')) {
      effectiveQuality = 'STALE';
    }

    const factorHighlights = Object.entries(params.engineScore.factorBreakdown).map(([factor, score]) => ({
      factor,
      score,
      weight: factor === 'valuation' ? 0.3 : factor === 'quality' ? 0.3 : factor === 'profitability' ? 0.25 : 0.15,
    }));

    return {
      surfaceId: 'UI02_EXECUTIVE_SUMMARY',
      companyId: params.marketData.companyId,
      companyName: params.companyName,
      asOf: params.marketData.provenance.asOf,
      quote: {
        lastPrice: params.marketData.ltp,
        change: params.marketData.change,
        pctChange: params.marketData.pctChange,
        volume: params.marketData.volume,
        currency: 'INR',
      },
      compositeScore: {
        score: params.engineScore.normalizedScore,
        grade: params.engineScore.grade,
        rank: params.rank,
      },
      factorHighlights,
      intelligenceSummary: {
        newsSentiment: params.intelligence.news.averageSentimentScore,
        estimatesConsensusPrice: params.intelligence.estimates?.mean ?? null,
        macroTrend: params.intelligence.macro && params.intelligence.macro.length > 0 ? 'NEUTRAL_TO_POSITIVE' : 'NO_DATA',
        altDataConfidence: params.intelligence.altData ? params.intelligence.altData.compositeConfidence : 0.8,
      },
      qualityIndicator: AccessibilityEngine.getQualityIndicator(effectiveQuality),
      provenance: params.marketData.provenance,
      responsiveLayout: {
        tier,
        columns: bp.columns,
        ...(bp.pinPrimaryColumn ? { pinnedColumn: 'companyId' } : {}),
      },
      accessibility: {
        ariaLive: 'polite',
        ariaRole: 'main',
        focusElementId: 'ui02-exec-summary-header',
        tableCaption: `Executive Summary Dashboard for ${params.companyName}`,
      },
    };
  }
}
