/**
 * Institutional Investment Platform System (IIPS)
 * UI09: Restatement Timeline Comparison View Model Builder (P13 / P14)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { RestatementTracker } from '../../fundamentals/restatement_tracker.js';
import { StandardizedFinancialStatement, FiscalQuarter, StatementScope } from '../../fundamentals/types.js';
import { UI09RestatementTimelineViewModel, ResponsiveTier } from '../types.js';
import { AccessibilityEngine } from '../accessibility_engine.js';
import { ResponsiveEngine } from '../responsive_engine.js';
import { ExecutiveProvenance } from '../../transports/types.js';

export class UI09RestatementTimelineBuilder {
  public static build(params: {
    tracker: RestatementTracker;
    companyId: string;
    fiscalYear: number;
    quarter?: FiscalQuarter;
    scope?: StatementScope;
    companyName: string;
    asOf: string;
    originalStatement: StandardizedFinancialStatement;
    latestStatement: StandardizedFinancialStatement;
    viewportWidth?: number;
  }): UI09RestatementTimelineViewModel {
    const tier: ResponsiveTier = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280).tier;
    const bp = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280);

    const originalRevenue = params.originalStatement.incomeStatement?.revenue ?? 0;
    const latestRevenue = params.latestStatement.incomeStatement?.revenue ?? originalRevenue;
    const originalNetIncome = params.originalStatement.incomeStatement?.pat ?? 0;
    const latestNetIncome = params.latestStatement.incomeStatement?.pat ?? originalNetIncome;

    const deltaRevenuePct = originalRevenue > 0 ? ((latestRevenue - originalRevenue) / originalRevenue) * 100 : 0;
    const deltaNetIncomePct = originalNetIncome > 0 ? ((latestNetIncome - originalNetIncome) / originalNetIncome) * 100 : 0;
    const isMaterialDelta = Math.abs(deltaRevenuePct) > 0.5 || Math.abs(deltaNetIncomePct) > 0.5;

    const provenance: ExecutiveProvenance = {
      sourceClassification: 'REAL',
      asOf: params.asOf,
      evaluatedAt: new Date().toISOString(),
      dataVersion: 'v1.0.0',
      lineageDigest: 'restatement-tracker-lineage-hash-0000000000000000000000000000000',
      quality: isMaterialDelta ? 'PARTIAL' : 'GOOD',
      replayConstraintApplied: false,
    };

    return {
      surfaceId: 'UI09_RESTATEMENT_TIMELINE',
      companyId: params.companyId,
      companyName: params.companyName,
      asOf: params.latestStatement.filingDate,
      pinnedVintage: {
        filingDate: params.latestStatement.filingDate,
        periodEndDate: `${params.fiscalYear}-03-31`,
        restatementIndex: params.latestStatement.restatementIndex,
      },
      originalFiling: {
        filingDate: params.originalStatement.filingDate,
        revenue: originalRevenue,
        netIncome: originalNetIncome,
        restatementIndex: params.originalStatement.restatementIndex,
      },
      restatedFiling: {
        filingDate: params.latestStatement.filingDate,
        revenue: latestRevenue,
        netIncome: latestNetIncome,
        restatementIndex: params.latestStatement.restatementIndex,
      },
      deltaRevenuePct: Math.round(deltaRevenuePct * 100) / 100,
      deltaNetIncomePct: Math.round(deltaNetIncomePct * 100) / 100,
      isMaterialDelta,
      qualityIndicator: AccessibilityEngine.getQualityIndicator(isMaterialDelta ? 'PARTIAL' : 'GOOD'),
      provenance,
      responsiveLayout: {
        tier,
        columns: bp.columns,
        pinnedColumn: bp.pinPrimaryColumn ? 'restatementIndex' : undefined,
      },
      accessibility: {
        ariaLive: 'polite',
        ariaRole: 'table',
        focusElementId: 'ui09-restatement-grid',
        tableCaption: `Filing Restatement Timeline & Delta Comparison for ${params.companyName}`,
      },
    };
  }
}
