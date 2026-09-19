/**
 * Institutional Investment Platform System (IIPS)
 * UI13: Macro Vintage Tracker View Model Builder (P13 / P14)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { MacroSeriesId } from '../../contracts/d08_macro.js';
import { MacroEngine } from '../../intelligence/macro_engine.js';
import { UI13MacroVintageTrackerViewModel, ResponsiveTier } from '../types.js';
import { AccessibilityEngine } from '../accessibility_engine.js';
import { ResponsiveEngine } from '../responsive_engine.js';
import { ExecutiveProvenance } from '../../transports/types.js';

export class UI13MacroVintageTrackerBuilder {
  public static build(params: {
    macroEngine: MacroEngine;
    seriesIds: MacroSeriesId[];
    companyName: string;
    asOf: string;
    viewportWidth?: number;
  }): UI13MacroVintageTrackerViewModel {
    const tier: ResponsiveTier = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280).tier;
    const bp = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280);

    const indicatorSeries = params.seriesIds
      .map((sid) => params.macroEngine.queryAsOf(sid, params.asOf))
      .filter((q): q is NonNullable<typeof q> => q !== null)
      .map((q) => ({
        indicatorCode: q.seriesId,
        period: q.matchedPeriod,
        releaseDate: q.releaseDate,
        vintageDate: q.vintageDate,
        value: q.value,
        isCarriedForward: q.isStepwiseCarryForward,
      }));

    const provenance: ExecutiveProvenance = {
      sourceClassification: 'REAL',
      asOf: params.asOf,
      evaluatedAt: new Date().toISOString(),
      dataVersion: 'v1.0.0',
      lineageDigest: 'macro-vintage-tracker-lineage-hash-00000000000000000000000000000',
      quality: 'GOOD',
      replayConstraintApplied: false,
    };

    return {
      surfaceId: 'UI13_MACRO_VINTAGE_TRACKER',
      companyId: 'MACRO_ECONOMY_IN',
      companyName: params.companyName,
      asOf: params.asOf,
      indicatorSeries,
      qualityIndicator: AccessibilityEngine.getQualityIndicator('GOOD'),
      provenance,
      responsiveLayout: {
        tier,
        columns: bp.columns,
        pinnedColumn: bp.pinPrimaryColumn ? 'indicatorCode' : undefined,
      },
      accessibility: {
        ariaLive: 'polite',
        ariaRole: 'region',
        focusElementId: 'ui13-macro-vintage-timeline',
        tableCaption: `Macroeconomic Indicator Release & Vintage Sequence (Zero Lookahead)`,
      },
    };
  }
}
