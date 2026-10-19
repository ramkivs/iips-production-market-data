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
import { SourceClassification, QualityState } from '../../contracts/types.js';
import { computeLineageHash } from '../../contracts/provenance.js';
import { rollupQuality } from '../../quality/quality_rollup.js';

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
    let allFactorsUsable = caEnvelopes.length > 0;
    const qualityAnomalyCodes: string[] = [];
    const corporateActions = caEnvelopes.map((env) => {
      const p = env.payload;
      const factor = typeof p.adjustmentFactor === 'number' && Number.isFinite(p.adjustmentFactor) && p.adjustmentFactor > 0
        ? p.adjustmentFactor
        : null;

      if (factor === null) {
        allFactorsUsable = false;
        qualityAnomalyCodes.push(`MISSING_OR_INVALID_ADJUSTMENT_FACTOR:${p.actionId}`);
      } else {
        cumulativeFactor *= factor;
      }

      return {
        actionId: p.actionId,
        actionType: p.actionType,
        exDate: p.exDate,
        recordDate: p.recordDate,
        ratio: p.ratioNumerator && p.ratioDenominator ? `${p.ratioNumerator}:${p.ratioDenominator}` : 'N/A',
        factor,
      };
    });

    const sourceClasses = caEnvelopes.map(
      (env) => env.provenance?.sourceClassification ?? 'UNCLASSIFIED'
    );
    const uniqueSourceClasses = [...new Set(sourceClasses)];
    // Carry through a consistent input classification; mixed or absent inputs stay unknown.
    const sourceClassification: SourceClassification = uniqueSourceClasses.length === 1
      ? uniqueSourceClasses[0]
      : 'UNCLASSIFIED';

    const inputQualityStates: QualityState[] = caEnvelopes.map(
      (env) => env.provenance?.qualityState ?? 'UNAVAILABLE'
    );
    const inputQuality = rollupQuality(inputQualityStates);
    const quality: QualityState = caEnvelopes.length === 0
      ? 'UNAVAILABLE'
      : qualityAnomalyCodes.length > 0
        ? rollupQuality([inputQuality, 'PARTIAL'])
        : inputQuality;

    const adjustmentFactorCumulative = allFactorsUsable
      ? Math.round(cumulativeFactor * 10000) / 10000
      : null;

    const provenance: ExecutiveProvenance = {
      sourceClassification,
      asOf: params.asOf,
      evaluatedAt: new Date().toISOString(),
      dataVersion: 'ui07-pit-corporate-actions-v1',
      lineageDigest: computeLineageHash(
        {
          companyId: params.companyId,
          asOf: params.asOf,
          corporateActions,
          adjustmentFactorCumulative,
          inputLineage: caEnvelopes.map((env) => ({
            envelopeId: env.envelopeId,
            lineageHash: env.provenance?.lineageHash ?? null,
            sourceClassification: env.provenance?.sourceClassification ?? 'UNCLASSIFIED',
            qualityState: env.provenance?.qualityState ?? 'UNAVAILABLE',
          })),
        },
        {
          sourceClassification,
          asOf: params.asOf,
          dataVersion: 'ui07-pit-corporate-actions-v1',
        }
      ),
      quality,
      replayConstraintApplied: false,
    };

    return {
      surfaceId: 'UI07_PIT_CORPORATE_ACTIONS',
      companyId: params.companyId,
      companyName: params.companyName,
      asOf: params.asOf,
      corporateActions,
      adjustmentFactorCumulative,
      qualityAnomalyCodes,
      qualityIndicator: AccessibilityEngine.getQualityIndicator(quality),
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
