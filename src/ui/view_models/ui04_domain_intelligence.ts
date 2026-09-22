/**
 * Institutional Investment Platform System (IIPS)
 * UI04: Domain Intelligence View Model Builder (P13 / P14)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { IntelligenceDTO } from '../../transports/intelligence_dto.js';
import { UI04DomainIntelligenceViewModel, ResponsiveTier } from '../types.js';
import { AccessibilityEngine } from '../accessibility_engine.js';
import { ResponsiveEngine } from '../responsive_engine.js';

export class UI04DomainIntelligenceBuilder {
  public static build(params: {
    intelligence: IntelligenceDTO;
    companyName: string;
    viewportWidth?: number;
  }): UI04DomainIntelligenceViewModel {
    const tier: ResponsiveTier = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280).tier;
    const bp = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280);

    const newsSignals = params.intelligence.news.newsItems.map((a) => ({
      headline: a.headline,
      sentiment: a.sentimentScore,
      sourceClass: a.sourcePublisher,
      isOfficialExchange: a.sourcePublisher === 'GOVERNED_EXCHANGE_DISCLOSURE',
    }));

    const macroIndicators = (params.intelligence.macro || []).map((m) => ({
      indicatorCode: m.seriesId,
      value: m.value,
      period: m.matchedPeriod,
      releaseDate: m.releaseDate,
      vintageDate: m.vintageDate,
    }));

    const altDataSignals = params.intelligence.altData
      ? [
          {
            signalName: params.intelligence.altData.signalType,
            confidence: params.intelligence.altData.compositeConfidence,
            approvalRef: params.intelligence.altData.approvalRefs.join(', '),
          },
        ]
      : [];

    return {
      surfaceId: 'UI04_DOMAIN_INTELLIGENCE',
      companyId: params.intelligence.companyId,
      companyName: params.companyName,
      asOf: params.intelligence.provenance.asOf,
      newsSignals,
      estimatesConsensus: {
        targetPrice: params.intelligence.estimates?.mean ?? null,
        analystCount: params.intelligence.estimates?.analystCount ?? 0,
        isValidConsensus: params.intelligence.estimates?.isConsensusValid ?? false,
      },
      macroIndicators,
      altDataSignals,
      qualityIndicator: AccessibilityEngine.getQualityIndicator(params.intelligence.quality),
      provenance: params.intelligence.provenance,
      responsiveLayout: {
        tier,
        columns: bp.columns,
        pinnedColumn: bp.pinPrimaryColumn ? 'signalType' : undefined,
      },
      accessibility: {
        ariaLive: 'polite',
        ariaRole: 'region',
        focusElementId: 'ui04-intelligence-feed',
        tableCaption: `Domain Intelligence and Alternative Signals for ${params.companyName}`,
      },
    };
  }
}
