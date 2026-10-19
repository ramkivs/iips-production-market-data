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
import { QualityState } from '../../contracts/types.js';
import { computeLineageHash } from '../../contracts/provenance.js';
import { rollupQuality } from '../../quality/quality_rollup.js';

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
    const hasSample = params.samplePayload !== undefined && Object.keys(params.samplePayload).length > 0;
    const anomalyReport = hasSample
      ? params.anomalyDetector.evaluatePayload(params.samplePayload!, {
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

    let sampleQuality: QualityState;
    if (!hasSample) {
      sampleQuality = 'UNAVAILABLE';
    } else if (anomalyReport.detected) {
      sampleQuality = anomalyReport.categories.includes('STRUCTURAL_MALFORMATION')
        ? 'UNAVAILABLE'
        : 'PARTIAL';
    } else {
      sampleQuality = 'GOOD';
    }
    const qualityState = rollupQuality([sampleQuality, freshnessRes.quality]);

    const evaluatedAt = new Date().toISOString();
    const provenance: ExecutiveProvenance = {
      sourceClassification: 'DERIVED',
      asOf: asOfTime,
      evaluatedAt,
      dataVersion: 'ui10-anomaly-monitor-v1',
      lineageDigest: computeLineageHash(
        {
          companyId: params.companyId,
          samplePayload: hasSample ? params.samplePayload : null,
          activeAnomalies,
          freshness: freshnessRes,
          quarantineCount: deadLetterCount,
        },
        {
          sourceClassification: 'DERIVED',
          asOf: asOfTime,
          dataVersion: 'ui10-anomaly-monitor-v1',
        }
      ),
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
