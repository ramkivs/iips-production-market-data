/**
 * Institutional Investment Platform System (IIPS)
 * UIRegistry: Centralized UI Surface Registry & Surface Governance (P13 / P14)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { UISurfaceId } from './types.js';

export class UIRegistry {
  private static readonly AUTHORIZED_SURFACES: ReadonlySet<UISurfaceId> = new Set<UISurfaceId>([
    'UI01_REPLAY_STUDIO',
    'UI02_EXECUTIVE_SUMMARY',
    'UI03_FUNDAMENTAL_ANALYSIS',
    'UI04_DOMAIN_INTELLIGENCE',
    'UI05_SECTOR_SCORING_RADAR',
    'UI06_MULTIFACTOR_SCREENER',
    'UI07_PIT_CORPORATE_ACTIONS',
    'UI08_SECURITY_MASTER_MODAL',
    'UI09_RESTATEMENT_TIMELINE',
    'UI10_ANOMALY_MONITOR',
    'UI11_PROVENANCE_AUDITOR',
    'UI12_ESTIMATES_DISTRIBUTION',
    'UI13_MACRO_VINTAGE_TRACKER',
    'UI14_ALTDATA_AUDITOR',
  ]);

  /**
   * Returns list of all 14 authorized UI surfaces
   */
  public static getAuthorizedSurfaces(): UISurfaceId[] {
    return Array.from(UIRegistry.AUTHORIZED_SURFACES);
  }

  /**
   * Validates whether a surface ID is authorized under Wave 4.
   * Explicitly rejects decommissioned UI17 (M-6 defect containment).
   */
  public static isSurfaceAuthorized(surfaceId: string): boolean {
    if (surfaceId === 'UI17' || surfaceId === 'UI17_DECOMMISSIONED') {
      return false; // Permanently decommissioned under M-6
    }
    return UIRegistry.AUTHORIZED_SURFACES.has(surfaceId as UISurfaceId);
  }

  /**
   * Enforces presentation-only governance check: verifies that view models contain zero proprietary vendor branding.
   */
  public static verifyProviderMasking(text: string): boolean {
    const commercialVendors = [
      'BLOOMBERG',
      'REFINITIV',
      'FACTSET',
      'CAPITAL_IQ',
      'MORNINGSTAR_DIRECT',
      'NSE_DIRECT_FEED',
      'BSE_DIRECT_FEED',
    ];
    const upper = text.toUpperCase();
    return !commercialVendors.some((vendor) => upper.includes(vendor));
  }
}
