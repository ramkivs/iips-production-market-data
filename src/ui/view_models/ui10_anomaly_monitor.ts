/**
 * Institutional Investment Platform System (IIPS)
 * UI10: Data Quality Anomaly Monitor View Model Builder (P13 / P14)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W4-AUTH-2026-01
 */

import { AnomalyDetector } from '../../quality/anomaly_detector.js';
import { evaluateFreshness } from '../../quality/freshness_evaluator.js';
import { DeadLetterQueue } from '../../ingress/dead_letter.js';
import { UI10AnomalyMonitorViewModel, ResponsiveTier } from '../types.js';
import { AccessibilityEngine } from '../accessibility_engine.js';
import { ResponsiveEngine } from '../responsive_engine.js';
import { ExecutiveProvenance } from '../../transports/types.js';

export class UI10AnomalyMonitorBuilder {
  public static build(params: {
    anomalyDetector: AnomalyDetector;
    deadLetterQueue?: DeadLetterQueue;
    companyId: string;
    companyName: string;
    samplePayload?: Record<string, unknown>;
    asOf?: string;
    viewportWidth?: number;
  }): UI10AnomalyMonitorViewModel {
    const tier: ResponsiveTier = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280).tier;
    const bp = ResponsiveEngine.resolveTier(params.viewportWidth ?? 1280);

    const asOfTime = params.asOf ?? new Date().toISOString();
    const anomalyReport = params.samplePayload
      ? params.anomalyDetector.evaluatePayload(params.samplePayload, {
          expectedDomain: 'D01_QUOTES',
          currentTimestamp: asOfTime,
        })
      : { detected: false, categories: [], details: [] };

    const activeAnomalies = anomalyReport.categories.map((cat, idx) => ({
      category: cat,
      description: anomalyReport.details[idx] || `Anomaly detected in category: ${cat}`,
      timestamp: asOfTime,
    }));

    const deadLetterCount = params.deadLetterQueue?.getCount() ?? 0;
    const freshnessRes = evaluateFreshness(asOfTime, 'D01_QUOTES', new Date().toISOString());
    const isStale = freshnessRes.quality === 'STALE';

    const qualityState = anomalyReport.detected || isStale
      ? anomalyReport.categories.includes('STRUCTURAL_MALFORMATION')
        ? 'UNAVAILABLE'
        : 'PARTIAL'
      : 'GOOD';

    const provenance: ExecutiveProvenance = {
      sourceClassification: 'DERIVED',
      asOf: asOfTime,
      evaluatedAt: new Date().toISOString(),
      dataVersion: 'v1.0.0',
      lineageDigest: 'quality-anomaly-monitor-lineage-hash-0000000000000000000000000000000',
      quality: qualityState,
      replayConstraintApplied: false,
    };

    return {
      surfaceId: 'UI10_ANOMALY_MONITOR',
      companyId: params.companyId,
      companyName: params.companyName,
      asOf: asOfTime,
      activeAnomalies,
      freshnessStatus: {
        isStale,
        delaySeconds: isStale ? 45 : 0,
        maxToleratedDelaySeconds: 30,
      },
      quarantineCount: deadLetterCount,
      qualityIndicator: AccessibilityEngine.getQualityIndicator(qualityState),
      provenance,
      responsiveLayout: {
        tier,
        columns: bp.columns,
        pinnedColumn: bp.pinPrimaryColumn ? 'category' : undefined,
      },
      accessibility: {
        ariaLive: 'assertive',
        ariaRole: 'alert',
        focusElementId: 'ui10-anomaly-summary',
        tableCaption: `Data Quality Anomaly & Freshness Monitor for ${params.companyName}`,
      },
    };
  }
}
