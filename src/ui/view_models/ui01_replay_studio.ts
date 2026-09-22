/**
 * Institutional Investment Platform System (IIPS)
 * UI01: Replay & Simulation Studio View Model Builder (P13 / AD-17)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { AD17_CONSTRAINT_TEXT } from '../../transports/types.js';
import { MarketDataDTO } from '../../transports/market_data_dto.js';
import { EngineScoreOutput } from '../../engine_adapters/types.js';
import { UI01ReplayStudioViewModel, ResponsiveTier } from '../types.js';
import { AccessibilityEngine } from '../accessibility_engine.js';
import { ResponsiveEngine } from '../responsive_engine.js';

export class UI01ReplayStudioBuilder {
  public static build(params: {
    marketSnapshot: MarketDataDTO;
    engineScore: EngineScoreOutput;
    companyName: string;
    replaySpeed?: number;
    viewportWidth?: number;
  }): UI01ReplayStudioViewModel {
    const tier: ResponsiveTier = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280).tier;
    const bp = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280);

    // Rollup worst-case quality
    const effectiveQuality =
      params.marketSnapshot.quality === 'UNAVAILABLE' || params.engineScore.qualityState === 'UNAVAILABLE'
        ? 'UNAVAILABLE'
        : params.marketSnapshot.quality === 'PARTIAL' || params.engineScore.qualityState === 'PARTIAL'
        ? 'PARTIAL'
        : params.marketSnapshot.quality === 'STALE' || params.engineScore.qualityState === 'STALE'
        ? 'STALE'
        : 'GOOD';

    return {
      surfaceId: 'UI01_REPLAY_STUDIO',
      companyId: params.marketSnapshot.companyId,
      companyName: params.companyName,
      asOf: params.marketSnapshot.provenance.asOf,
      replaySpeed: params.replaySpeed ?? 1.0,
      simulationAsOf: params.marketSnapshot.provenance.asOf,
      ad17MandatoryDisclosure: AD17_CONSTRAINT_TEXT,
      ad17Disclosure: AD17_CONSTRAINT_TEXT,
      marketSnapshot: params.marketSnapshot,
      engineScore: params.engineScore,
      qualityIndicator: AccessibilityEngine.getQualityIndicator(effectiveQuality),
      provenance: params.marketSnapshot.provenance,
      responsiveLayout: {
        tier,
        columns: bp.columns,
        pinnedColumn: bp.pinPrimaryColumn ? 'symbol' : undefined,
      },
      accessibility: {
        ariaLive: 'polite',
        ariaRole: 'region',
        focusElementId: 'ui01-replay-controls',
        tableCaption: `Historical Replay & Simulation Studio for ${params.companyName}`,
      },
    };
  }
}
