/**
 * Institutional Investment Platform System (IIPS)
 * Analyst Estimates Consensus Engine (P10 / D07)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W2-AUTH-2026-01
 */

import { EstimateMetric } from '../contracts/d07_estimates.js';
import { QualityState } from '../contracts/types.js';

export interface IndividualAnalystEstimate {
  estimateId: string;
  companyId: string;
  analystId: string; // Governed anonymous analyst code, e.g. "ANON_BROKER_01"
  metric: EstimateMetric;
  targetPeriod: string; // e.g. "FY2027"
  estimatedValue: number;
  submittedAt: string; // ISO-8601 UTC
  currency: 'INR' | 'USD';
}

export interface AggregatedConsensusResult {
  companyId: string;
  metric: EstimateMetric;
  targetPeriod: string;
  asOf: string;
  isConsensusValid: boolean;
  analystCount: number;
  mean: number | null;
  median: number | null;
  high: number | null;
  low: number | null;
  standardDeviation: number | null;
  excludedStaleCount: number;
  qualityState: QualityState;
  statusMessage?: string;
}

export class EstimatesEngine {
  private estimates: IndividualAnalystEstimate[] = [];

  public submitEstimate(estimate: IndividualAnalystEstimate): void {
    if (estimate.estimatedValue <= 0) {
      throw new Error('Estimated value must be strictly positive');
    }
    this.estimates.push(Object.freeze({ ...estimate }));
  }

  /**
   * Computes consensus metrics at a point in time (PIT).
   * Enforces N >= 3 minimum analyst threshold and 90-day staleness cutoff.
   */
  public computeConsensus(params: {
    companyId: string;
    metric: EstimateMetric;
    targetPeriod: string;
    asOf: string;
  }): AggregatedConsensusResult {
    const { companyId, metric, targetPeriod, asOf } = params;
    const asOfMs = Date.parse(asOf);
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    // Filter estimates submitted <= asOf
    const eligiblePIT = this.estimates.filter((e) => {
      const subMs = Date.parse(e.submittedAt);
      return (
        e.companyId === companyId &&
        e.metric === metric &&
        e.targetPeriod === targetPeriod &&
        subMs <= asOfMs
      );
    });

    // Group by analystId to take the most recent estimate per analyst prior to asOf
    const latestPerAnalyst: Map<string, IndividualAnalystEstimate> = new Map();
    for (const est of eligiblePIT) {
      const existing = latestPerAnalyst.get(est.analystId);
      if (!existing || Date.parse(est.submittedAt) > Date.parse(existing.submittedAt)) {
        latestPerAnalyst.set(est.analystId, est);
      }
    }

    const allAnalystEstimates = Array.from(latestPerAnalyst.values());
    let excludedStaleCount = 0;

    // Filter out stale estimates older than 90 days from asOf
    const activeEstimates = allAnalystEstimates.filter((est) => {
      const ageMs = asOfMs - Date.parse(est.submittedAt);
      if (ageMs > ninetyDaysMs) {
        excludedStaleCount++;
        return false;
      }
      return true;
    });

    const analystCount = activeEstimates.length;

    // Minimum analyst count rule: N >= 3
    if (analystCount < 3) {
      return {
        companyId,
        metric,
        targetPeriod,
        asOf,
        isConsensusValid: false,
        analystCount,
        mean: null,
        median: null,
        high: null,
        low: null,
        standardDeviation: null,
        excludedStaleCount,
        qualityState: 'UNAVAILABLE',
        statusMessage: `Insufficient active analysts: ${analystCount} (Minimum 3 required for governed consensus; ${excludedStaleCount} stale excluded)`,
      };
    }

    const values = activeEstimates.map((e) => e.estimatedValue).sort((a, b) => a - b);
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    const mean = Math.round((sum / analystCount) * 100) / 100;

    // Median calculation
    let median: number;
    const mid = Math.floor(analystCount / 2);
    if (analystCount % 2 === 0) {
      median = Math.round(((values[mid - 1] + values[mid]) / 2) * 100) / 100;
    } else {
      median = values[mid];
    }

    const high = values[values.length - 1];
    const low = values[0];

    // Standard deviation
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / analystCount;
    const standardDeviation = Math.round(Math.sqrt(variance) * 100) / 100;

    return {
      companyId,
      metric,
      targetPeriod,
      asOf,
      isConsensusValid: true,
      analystCount,
      mean,
      median,
      high,
      low,
      standardDeviation,
      excludedStaleCount,
      qualityState: 'GOOD',
      statusMessage: 'Consensus computed successfully',
    };
  }
}
