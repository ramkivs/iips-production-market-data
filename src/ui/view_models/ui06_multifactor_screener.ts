/**
 * Institutional Investment Platform System (IIPS)
 * UI06: Multi-Factor Screener View Model Builder (Contract C6 / AD-15)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { ScreenerFilter, ScreenerService } from '../../transports/screener_service.js';
import { UI06MultiFactorScreenerViewModel, ResponsiveTier } from '../types.js';
import { AccessibilityEngine } from '../accessibility_engine.js';
import { ResponsiveEngine } from '../responsive_engine.js';

export class UI06MultiFactorScreenerBuilder {
  public static build(params: {
    criteria: ScreenerFilter;
    screenerService: ScreenerService;
    viewportWidth?: number;
  }): UI06MultiFactorScreenerViewModel {
    const tier: ResponsiveTier = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280).tier;
    const bp = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280);

    // Invoke server-side ScreenerService (Contract C6) - zero client-side filtering
    const screenResponse = params.screenerService.executeScreen(params.criteria);

    return {
      surfaceId: 'UI06_MULTIFACTOR_SCREENER',
      companyId: 'MULTI_ENTITY_PORTFOLIO',
      companyName: 'Institutional Screener Results',
      asOf: screenResponse.asOf,
      filterCriteria: params.criteria,
      totalMatches: screenResponse.totalMatched,
      results: screenResponse.results,
      qualityIndicator: AccessibilityEngine.getQualityIndicator('GOOD'),
      provenance: screenResponse.provenance,
      responsiveLayout: {
        tier,
        columns: bp.columns,
        pinnedColumn: bp.pinPrimaryColumn ? 'symbol' : undefined,
      },
      accessibility: {
        ariaLive: 'polite',
        ariaRole: 'table',
        focusElementId: 'ui06-screener-filter-bar',
        tableCaption: `Institutional Multi-Factor Screener Results (${screenResponse.totalMatched} matched entities)`,
      },
    };
  }
}
