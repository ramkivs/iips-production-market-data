/**
 * Institutional Investment Platform System (IIPS)
 * UI11: Executive Provenance Auditor View Model Builder (P13 / P14 / NFR-06)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { ExecutiveProvenance } from '../../transports/types.js';
import { UI11ProvenanceAuditorViewModel, ResponsiveTier } from '../types.js';
import { AccessibilityEngine } from '../accessibility_engine.js';
import { ResponsiveEngine } from '../responsive_engine.js';

export class UI11ProvenanceAuditorBuilder {
  public static build(params: {
    provenance: ExecutiveProvenance;
    companyId: string;
    companyName: string;
    vendorTier?: string;
    versionVector?: Record<string, string>;
    tenantId?: string;
    correlationId?: string;
    viewportWidth?: number;
  }): UI11ProvenanceAuditorViewModel {
    const tier: ResponsiveTier = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280).tier;
    const bp = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280);

    const versionVector = params.versionVector ?? {
      engineVersion: 'v1.0.0-certified-frozen',
      schemaVersion: '1.0.0',
      securityMasterVersion: '2026.09.19',
    };

    return {
      surfaceId: 'UI11_PROVENANCE_AUDITOR',
      companyId: params.companyId,
      companyName: params.companyName,
      asOf: params.provenance.evaluatedAt,
      lineageHash: params.provenance.lineageDigest,
      vendorTier: params.vendorTier || 'OFFLINE_BOOTSTRAP', // NFR-06 masked tier
      sourceClassification: params.provenance.sourceClassification,
      versionVector,
      tenantId: params.tenantId || params.provenance.tenantId,
      correlationId: params.correlationId || params.provenance.correlationId,
      evaluatedAt: params.provenance.evaluatedAt,
      qualityIndicator: AccessibilityEngine.getQualityIndicator(params.provenance.quality),
      provenance: params.provenance,
      responsiveLayout: {
        tier,
        columns: bp.columns,
        pinnedColumn: bp.pinPrimaryColumn ? 'key' : undefined,
      },
      accessibility: {
        ariaLive: 'polite',
        ariaRole: 'region',
        focusElementId: 'ui11-lineage-hash-card',
        tableCaption: `Cryptographic Lineage & Governance Provenance Audit for ${params.companyName}`,
      },
    };
  }
}
