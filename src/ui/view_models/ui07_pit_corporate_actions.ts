/**
 * Institutional Investment Platform System (IIPS)
 * UI07: Point-in-Time Corporate Actions View Model Builder (P13 / P14)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { PointInTimeStore } from '../../pit/pit_store.js';
import { UI07PitCorporateActionsViewModel, ResponsiveTier } from '../types.js';
import { AccessibilityEngine } from '../accessibility_engine.js';
import { ResponsiveEngine } from '../responsive_engine.js';
import { ExecutiveProvenance } from '../../transports/types.js';
import { CorporateActionPayload } from '../../contracts/d04_corporate_actions.js';

export class UI07PitCorporateActionsBuilder {
  public static build(params: {
    pitStore: PointInTimeStore<CorporateActionPayload>;
    companyId: string;
    companyName: string;
    asOf: string;
    viewportWidth?: number;
  }): UI07PitCorporateActionsViewModel {
    const tier: ResponsiveTier = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280).tier;
    const bp = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280);

    const caEnvelopes = params.pitStore.queryRange(params.companyId, 'D04_CORPORATE_ACTIONS', '1900-01-01T00:00:00.000Z', params.asOf);

    let cumulativeFactor = 1.0;
    const corporateActions = caEnvelopes.map((env) => {
      const p = env.payload;
      cumulativeFactor *= (p.adjustmentFactor ?? 1.0);
      return {
        actionId: p.actionId,
        actionType: p.actionType,
        exDate: p.exDate,
        recordDate: p.recordDate,
        ratio: p.ratioNumerator && p.ratioDenominator ? `${p.ratioNumerator}:${p.ratioDenominator}` : 'N/A',
        factor: p.adjustmentFactor ?? 1.0,
      };
    });

    const provenance: ExecutiveProvenance = {
      sourceClassification: 'REAL',
      asOf: params.asOf,
      evaluatedAt: new Date().toISOString(),
      dataVersion: 'v1.0.0',
      lineageDigest: 'ca-pit-store-lineage-hash-0000000000000000000000000000000000000000',
      quality: 'GOOD',
      replayConstraintApplied: false,
    };

    return {
      surfaceId: 'UI07_PIT_CORPORATE_ACTIONS',
      companyId: params.companyId,
      companyName: params.companyName,
      asOf: params.asOf,
      corporateActions,
      adjustmentFactorCumulative: Math.round(cumulativeFactor * 10000) / 10000,
      qualityIndicator: AccessibilityEngine.getQualityIndicator('GOOD'),
      provenance,
      responsiveLayout: {
        tier,
        columns: bp.columns,
        pinnedColumn: bp.pinPrimaryColumn ? 'actionId' : undefined,
      },
      accessibility: {
        ariaLive: 'polite',
        ariaRole: 'region',
        focusElementId: 'ui07-ca-timeline',
        tableCaption: `Point-in-Time Corporate Actions and Adjustment Factor Ledger for ${params.companyName}`,
      },
    };
  }
}
