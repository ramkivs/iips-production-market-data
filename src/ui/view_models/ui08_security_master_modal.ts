/**
 * Institutional Investment Platform System (IIPS)
 * UI08: Security Master Resolution Modal View Model Builder (Contract C7 / AD-15)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { ObjectResolverService } from '../../transports/object_resolver.js';
import { IdentityQuery } from '../../identity/mapping_store.js';
import { UI08SecurityMasterModalViewModel, ResponsiveTier } from '../types.js';
import { AccessibilityEngine } from '../accessibility_engine.js';
import { ResponsiveEngine } from '../responsive_engine.js';

export class UI08SecurityMasterModalBuilder {
  public static build(params: {
    query: IdentityQuery;
    resolverService: ObjectResolverService;
    isModalOpen?: boolean;
    viewportWidth?: number;
  }): UI08SecurityMasterModalViewModel {
    const tier: ResponsiveTier = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280).tier;
    const bp = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280);

    // Call server-side ObjectResolverService (Contract C7) - fails closed on unmapped/ambiguous identity
    const resolution = params.resolverService.resolveObject(params.query);

    return {
      surfaceId: 'UI08_SECURITY_MASTER_MODAL',
      companyId: resolution.companyId,
      companyName: resolution.companyName,
      asOf: params.query.asOf || new Date().toISOString(),
      query: params.query,
      resolution,
      isModalOpen: params.isModalOpen ?? true,
      trapFocus: params.isModalOpen ?? true,
      qualityIndicator: AccessibilityEngine.getQualityIndicator('GOOD'),
      provenance: resolution.provenance,
      responsiveLayout: {
        tier,
        columns: bp.columns,
        pinnedColumn: bp.pinPrimaryColumn ? 'identifierType' : undefined,
      },
      accessibility: {
        ariaLive: 'assertive',
        ariaRole: 'dialog',
        focusElementId: 'ui08-modal-close-btn',
        tableCaption: `Security Master Object Resolution Details for ${resolution.companyName}`,
      },
    };
  }
}
