/**
 * Institutional Investment Platform System (IIPS)
 * UI14: Alternative Data Signal Auditor View Model Builder (P13 / P14)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { GovernedAlternativeDataSignal, AltDataEngine } from '../../intelligence/altdata_engine.js';
import { UI14AltDataAuditorViewModel, ResponsiveTier } from '../types.js';
import { AccessibilityEngine } from '../accessibility_engine.js';
import { ResponsiveEngine } from '../responsive_engine.js';
import { ExecutiveProvenance } from '../../transports/types.js';

export class UI14AltDataAuditorBuilder {
  public static build(params: {
    altDataEngine: AltDataEngine;
    signalsList: GovernedAlternativeDataSignal[];
    companyId: string;
    signalType: string;
    companyName: string;
    asOf: string;
    viewportWidth?: number;
  }): UI14AltDataAuditorViewModel {
    const tier: ResponsiveTier = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280).tier;
    const bp = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280);

    const composite = params.altDataEngine.computeCompositeSignal({
      companyId: params.companyId,
      signalType: params.signalType,
      asOf: params.asOf,
    });

    const signals = params.signalsList.map((r) => ({
      signalName: r.signalType,
      rawValue: r.value,
      normalizedValue: r.value,
      confidence: r.confidenceScore,
      approvalRef: r.approvalRef,
      isGovernanceApproved: Boolean(r.approvalRef && r.approvalRef.length > 0),
    }));

    const qualityState = composite && composite.constituentCount > 0 ? composite.qualityState : 'PARTIAL';

    const provenance: ExecutiveProvenance = {
      sourceClassification: 'DERIVED',
      asOf: params.asOf,
      evaluatedAt: new Date().toISOString(),
      dataVersion: 'v1.0.0',
      lineageDigest: 'altdata-signal-auditor-lineage-hash-00000000000000000000000000000',
      quality: qualityState,
      replayConstraintApplied: false,
    };

    return {
      surfaceId: 'UI14_ALTDATA_AUDITOR',
      companyId: params.companyId,
      companyName: params.companyName,
      asOf: params.asOf,
      signals,
      qualityIndicator: AccessibilityEngine.getQualityIndicator(qualityState),
      provenance,
      responsiveLayout: {
        tier,
        columns: bp.columns,
        pinnedColumn: bp.pinPrimaryColumn ? 'signalName' : undefined,
      },
      accessibility: {
        ariaLive: 'polite',
        ariaRole: 'region',
        focusElementId: 'ui14-altdata-audit-grid',
        tableCaption: `Alternative Data Signals & Governance Approval Ref Audit for ${params.companyName}`,
      },
    };
  }
}
