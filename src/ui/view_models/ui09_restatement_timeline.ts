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
import { QualityState } from '../../contracts/types.js';
import { computeLineageHash } from '../../contracts/provenance.js';
import { rollupQuality } from '../../quality/quality_rollup.js';

type ComparisonMetric = 'revenue' | 'pat';

function sourceMetric(
  statement: StandardizedFinancialStatement,
  metric: ComparisonMetric,
  side: 'original' | 'restated',
  anomalyCodes: string[]
): number | null {
  const key = `MISSING_SOURCE_FIELD:incomeStatement.${metric}`;
  const sectionKey = 'MISSING_SOURCE_BLOCK:incomeStatement';
  const value = statement.incomeStatement?.[metric];
  if (
    !statement.incomeStatement ||
    statement.normalizationAnomalyCodes?.includes(sectionKey) ||
    statement.normalizationAnomalyCodes?.includes(key) ||
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    anomalyCodes.push(`${side.toUpperCase()}_SOURCE_METRIC_UNAVAILABLE:${metric}`);
    return null;
  }
  return value;
}

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

    const qualityAnomalyCodes: string[] = [];
    const originalRevenue = sourceMetric(params.originalStatement, 'revenue', 'original', qualityAnomalyCodes);
    const latestRevenue = sourceMetric(params.latestStatement, 'revenue', 'restated', qualityAnomalyCodes);
    const originalNetIncome = sourceMetric(params.originalStatement, 'pat', 'original', qualityAnomalyCodes);
    const latestNetIncome = sourceMetric(params.latestStatement, 'pat', 'restated', qualityAnomalyCodes);

    let deltaRevenuePct: number | null = null;
    if (originalRevenue !== null && latestRevenue !== null && originalRevenue > 0) {
      deltaRevenuePct = ((latestRevenue - originalRevenue) / originalRevenue) * 100;
    } else {
      qualityAnomalyCodes.push('REVENUE_DELTA_UNAVAILABLE');
    }

    let deltaNetIncomePct: number | null = null;
    if (originalNetIncome !== null && latestNetIncome !== null && originalNetIncome > 0) {
      deltaNetIncomePct = ((latestNetIncome - originalNetIncome) / originalNetIncome) * 100;
    } else {
      qualityAnomalyCodes.push('NET_INCOME_DELTA_UNAVAILABLE');
    }

    const isMaterialDelta: boolean | null = deltaRevenuePct !== null && deltaNetIncomePct !== null
      ? Math.abs(deltaRevenuePct) > 0.5 || Math.abs(deltaNetIncomePct) > 0.5
      : null;

    // Materiality is a business comparison result, not a data-quality grade. Quality follows
    // the input statements and degrades only when required comparison values are unavailable.
    const statementQualities: QualityState[] = [
      params.originalStatement.qualityState,
      params.latestStatement.qualityState,
    ];
    const quality: QualityState = qualityAnomalyCodes.length > 0
      ? rollupQuality([...statementQualities, 'PARTIAL'])
      : rollupQuality(statementQualities);

    const provenance: ExecutiveProvenance = {
      sourceClassification: 'DERIVED',
      asOf: params.asOf,
      evaluatedAt: new Date().toISOString(),
      dataVersion: 'ui09-restatement-timeline-v1',
      lineageDigest: computeLineageHash(
        {
          companyId: params.companyId,
          fiscalYear: params.fiscalYear,
          quarter: params.quarter,
          scope: params.scope,
          originalStatement: params.originalStatement,
          latestStatement: params.latestStatement,
          comparison: {
            originalRevenue,
            latestRevenue,
            originalNetIncome,
            latestNetIncome,
            deltaRevenuePct,
            deltaNetIncomePct,
            isMaterialDelta,
            qualityAnomalyCodes,
          },
        },
        {
          sourceClassification: 'DERIVED',
          asOf: params.asOf,
          dataVersion: 'ui09-restatement-timeline-v1',
        }
      ),
      quality,
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
      deltaRevenuePct: deltaRevenuePct === null ? null : Math.round(deltaRevenuePct * 100) / 100,
      deltaNetIncomePct: deltaNetIncomePct === null ? null : Math.round(deltaNetIncomePct * 100) / 100,
      isMaterialDelta,
      qualityAnomalyCodes: [...new Set(qualityAnomalyCodes)],
      qualityIndicator: AccessibilityEngine.getQualityIndicator(quality),
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
