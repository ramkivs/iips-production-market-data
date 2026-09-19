/**
 * Institutional Investment Platform System (IIPS)
 * Freshness Evaluator & AD-12 Stale Concession Logic (P07 / AD-12)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { DataDomain, QualityState } from '../contracts/types.js';

export interface FreshnessThresholdConfig {
  domain: DataDomain;
  nominalThresholdSeconds: number;
}

export const DEFAULT_FRESHNESS_CONFIG: Record<DataDomain, number> = {
  D01_QUOTES: 15 * 60,                // 15 minutes intraday
  D02_OHLCV: 24 * 60 * 60,            // 24 hours EOD
  D03_FUNDAMENTALS: 105 * 24 * 60 * 60,// 105 days statutory quarterly filing
  D04_CORPORATE_ACTIONS: 7 * 24 * 60 * 60, // 7 days
  D05_SECURITY_MASTER: 30 * 24 * 60 * 60, // 30 days
  D06_NEWS: 6 * 60 * 60,              // 6 hours
  D07_ESTIMATES: 30 * 24 * 60 * 60,   // 30 days
  D08_MACRO: 45 * 24 * 60 * 60,       // 45 days
  D09_ALTDATA: 14 * 24 * 60 * 60,     // 14 days
};

export interface FreshnessEvaluationResult {
  ageSeconds: number;
  quality: QualityState;
  nominalThresholdSeconds: number;
  staleConcessionActive: boolean;
  suppressExecution: boolean;
}

/**
 * Evaluates the freshness of a dataset timestamp under AD-12 concession rules:
 * - Age <= Threshold: GOOD
 * - Threshold < Age <= 2 * Threshold: STALE (Concession active; usable with warning)
 * - Age > 2 * Threshold: UNAVAILABLE (Suppressed from engine execution)
 */
export function evaluateFreshness(
  timestamp: string,
  domain: DataDomain,
  evaluationTime: string = new Date().toISOString()
): FreshnessEvaluationResult {
  const dataTimeMs = Date.parse(timestamp);
  const evalTimeMs = Date.parse(evaluationTime);

  if (isNaN(dataTimeMs) || isNaN(evalTimeMs)) {
    return {
      ageSeconds: Infinity,
      quality: 'UNAVAILABLE',
      nominalThresholdSeconds: DEFAULT_FRESHNESS_CONFIG[domain],
      staleConcessionActive: false,
      suppressExecution: true,
    };
  }

  const ageSeconds = Math.max(0, (evalTimeMs - dataTimeMs) / 1000);
  const threshold = DEFAULT_FRESHNESS_CONFIG[domain] || 3600;

  if (ageSeconds <= threshold) {
    return {
      ageSeconds,
      quality: 'GOOD',
      nominalThresholdSeconds: threshold,
      staleConcessionActive: false,
      suppressExecution: false,
    };
  }

  if (ageSeconds <= 2 * threshold) {
    return {
      ageSeconds,
      quality: 'STALE',
      nominalThresholdSeconds: threshold,
      staleConcessionActive: true,
      suppressExecution: false,
    };
  }

  return {
    ageSeconds,
    quality: 'UNAVAILABLE',
    nominalThresholdSeconds: threshold,
    staleConcessionActive: false,
    suppressExecution: true,
  };
}
