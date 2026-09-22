/**
 * Institutional Investment Platform System (IIPS)
 * UI03: Fundamental Analysis View Model Builder (P13 / P14)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { FundamentalsDTO } from '../../transports/fundamentals_dto.js';
import { UI03FundamentalAnalysisViewModel, ResponsiveTier } from '../types.js';
import { AccessibilityEngine } from '../accessibility_engine.js';
import { ResponsiveEngine } from '../responsive_engine.js';

export class UI03FundamentalAnalysisBuilder {
  public static build(params: {
    fundamentals: FundamentalsDTO;
    companyName: string;
    filingDate?: string;
    periodEndDate?: string;
    restatementIndex?: number;
    viewportWidth?: number;
  }): UI03FundamentalAnalysisViewModel {
    const tier: ResponsiveTier = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280).tier;
    const bp = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280);

    const filingDate = params.filingDate || params.fundamentals.provenance.asOf;
    const periodEndDate = params.periodEndDate || `${params.fundamentals.fiscalYear}-03-31`;
    const restatementIndex = params.restatementIndex ?? 0;

    const bs = params.fundamentals.balanceSheet;
    const balanceSheetIdentityValid = bs
      ? Math.abs(bs.totalAssets - (bs.totalLiabilities + bs.netWorth)) < 0.01
      : true;

    return {
      surfaceId: 'UI03_FUNDAMENTAL_ANALYSIS',
      companyId: params.fundamentals.companyId,
      companyName: params.companyName,
      asOf: params.fundamentals.provenance.asOf,
      pinnedVintage: {
        filingDate,
        periodEndDate,
        restatementIndex,
      },
      ratios: params.fundamentals.ratios as unknown as Record<string, number | null | undefined>,
      ttmStatements: {
        revenue: params.fundamentals.ttmStatement?.revenueTTM ?? 0,
        ebitda: params.fundamentals.ttmStatement?.ebitdaTTM ?? 0,
        netIncome: params.fundamentals.ttmStatement?.patTTM ?? 0,
        operatingCashFlow: params.fundamentals.ttmStatement?.operatingCashFlowTTM ?? 0,
        quartersCount: params.fundamentals.ttmStatement?.coveredQuarters.length ?? 4,
      },
      balanceSheetIdentityValid,
      qualityIndicator: AccessibilityEngine.getQualityIndicator(params.fundamentals.quality),
      provenance: params.fundamentals.provenance,
      responsiveLayout: {
        tier,
        columns: bp.columns,
        pinnedColumn: bp.pinPrimaryColumn ? 'metric' : undefined,
      },
      accessibility: {
        ariaLive: 'polite',
        ariaRole: 'region',
        focusElementId: 'ui03-fundamental-table',
        tableCaption: `Fundamental Financial Statements and Ratios for ${params.companyName}`,
      },
    };
  }
}
