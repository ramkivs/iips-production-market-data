/**
 * Institutional Investment Platform System (IIPS)
 * Freshness Evaluator & AD-12 Stale Concession Logic (P07 / AD-12)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 */

import { DataDomain, QualityState } from '../contracts/types.js';
import { explicitInstant, istDate, parseTradingCalendar, type SessionFreshnessContext } from './trading_calendar.js';

export interface FreshnessThresholdConfig {
  domain: DataDomain;
  nominalThresholdSeconds: number;
}

/**
 * W-25: the per-domain thresholds an evaluation is conducted against.
 *
 * `DEFAULT_FRESHNESS_CONFIG` satisfies this shape directly, so an unconfigured caller
 * needs no adapter. A configured caller passes the map resolved by
 * `resolveFreshnessThresholds` (`freshness_thresholds.ts`), which is complete for every
 * domain by construction.
 */
export type FreshnessThresholds = Readonly<Record<DataDomain, number>>;

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
  /** Active-session seconds, completed-day equivalents, or legacy elapsed seconds (see basis). */
  ageSeconds: number;
  basis?: 'SESSION_TIME' | 'COMPLETED_TRADING_DAYS';
  sessionState?: 'OPEN' | 'CLOSED';
  calendarVersion?: string;
  completedTradingDays?: number;
  calendarIssue?: 'INVALID_CALENDAR' | 'MISSING_COVERAGE' | 'INVALID_OBSERVATION';
  quality: QualityState;
  nominalThresholdSeconds: number;
  staleConcessionActive: boolean;
  suppressExecution: boolean;
}

/**
 * Resolves the threshold a single evaluation will use.
 *
 * A supplied map is authoritative. A missing or non-finite entry falls back to the
 * compiled default rather than to a constant the configuration never mentioned — an
 * unevaluable threshold must degrade to the built-in contract, not to an invention.
 * (Configuration never produces such a value; this guards a hand-built map.)
 */
function resolveThreshold(domain: DataDomain, thresholds?: FreshnessThresholds): number {
  const supplied = thresholds?.[domain];
  if (typeof supplied === 'number' && Number.isFinite(supplied) && supplied > 0) return supplied;
  return DEFAULT_FRESHNESS_CONFIG[domain];
}

/**
 * Evaluates the freshness of a dataset timestamp under AD-12 concession rules:
 * - Age <= Threshold: GOOD
 * - Threshold < Age <= 2 * Threshold: STALE (Concession active; usable with warning)
 * - Age > 2 * Threshold: UNAVAILABLE (Suppressed from engine execution)
 *
 * W-25: `thresholds` optionally carries configured per-domain thresholds resolved by
 * `freshness_thresholds.ts`. It defaults to `DEFAULT_FRESHNESS_CONFIG`, so a caller that
 * does not configure anything keeps exactly the compiled numbers. This function remains
 * the sole owner of the AD-12 arithmetic — configuration changes WHICH threshold is used,
 * never how the bands are applied, and the `2 ×` concession edge is always derived from
 * the effective threshold so both edges move together.
 */
export function evaluateFreshness(
  timestamp: string,
  domain: DataDomain,
  evaluationTime: string,
  session?: SessionFreshnessContext,
  thresholds?: FreshnessThresholds
): FreshnessEvaluationResult {
  // One resolution for the whole call. Previously the two early returns read the raw map
  // while the classifying return read `map[domain] || 3600`; a configured threshold could
  // therefore be reported by one return and not applied by another. The `|| 3600` fallback
  // is removed with it: it was unreachable for a valid domain and was the only place this
  // function could invent a number the configuration never stated.
  const threshold = resolveThreshold(domain, thresholds);

  const dataTimeMs = Date.parse(timestamp);
  const evalTimeMs = Date.parse(evaluationTime);

  if (isNaN(dataTimeMs) || isNaN(evalTimeMs)) {
    return {
      ageSeconds: Infinity,
      quality: 'UNAVAILABLE',
      nominalThresholdSeconds: threshold,
      staleConcessionActive: false,
      suppressExecution: true,
    };
  }

  let ageSeconds = Math.max(0, (evalTimeMs - dataTimeMs) / 1000);
  let sessionEvidence: Partial<FreshnessEvaluationResult> = {};
  if (session) {
    const basis = session.kind === 'QUOTE' ? 'SESSION_TIME' : 'COMPLETED_TRADING_DAYS';
    const invalid = (calendarIssue: NonNullable<FreshnessEvaluationResult['calendarIssue']>): FreshnessEvaluationResult => ({
      ageSeconds: Infinity, quality: 'UNAVAILABLE', nominalThresholdSeconds: threshold,
      staleConcessionActive: false, suppressExecution: true, basis, calendarIssue,
      calendarVersion: session.calendar?.version,
    });
    if (!explicitInstant(timestamp) || !explicitInstant(evaluationTime) || dataTimeMs > evalTimeMs ||
        !['NSE', 'BSE'].includes(session.exchange) ||
        (session.kind === 'QUOTE' ? domain !== 'D01_QUOTES' : domain !== 'D02_OHLCV')) return invalid('INVALID_OBSERVATION');
    let calendar;
    try { calendar = parseTradingCalendar(session.calendar); } catch { return invalid('INVALID_CALENDAR'); }
    const from = istDate(dataTimeMs), to = istDate(evalTimeMs);
    const days = new Map(calendar.days.filter(d => d.exchange === session.exchange).map(d => [d.date, d]));
    const observed = days.get(from);
    if (!observed || observed.status === 'UNKNOWN') return invalid('MISSING_COVERAGE');
    if (observed.status !== 'OPEN') return invalid('INVALID_OBSERVATION');
    if (session.kind === 'QUOTE' && !observed.sessions.some(s => Date.parse(s.opensAt) <= dataTimeMs && dataTimeMs <= Date.parse(s.closesAt))) return invalid('INVALID_OBSERVATION');
    if (session.kind === 'DAILY_CLOSE' && (!session.completed || session.observationDate !== from ||
        Date.parse(observed.sessions[observed.sessions.length - 1].closesAt) > evalTimeMs)) return invalid('INVALID_OBSERVATION');
    ageSeconds = 0;
    let completedTradingDays = 0;
    // Visit EVERY date, including weekends: missing rows are unknown, never inferred closed.
    for (let ms = Date.parse(from); ms <= Date.parse(to); ms += 86_400_000) {
      const date = new Date(ms).toISOString().slice(0, 10), day = days.get(date);
      if (!day || day.status === 'UNKNOWN') return invalid('MISSING_COVERAGE');
      if (day.status !== 'OPEN') continue;
      if (date > from && Date.parse(day.sessions[day.sessions.length - 1].closesAt) <= evalTimeMs) completedTradingDays++;
      if (session.kind === 'QUOTE') for (const interval of day.sessions) {
        ageSeconds += Math.max(0, Math.min(evalTimeMs, Date.parse(interval.closesAt)) - Math.max(dataTimeMs, Date.parse(interval.opensAt))) / 1000;
      }
    }
    // D02 retains its own 24h/48h nominal/concession contract, expressed in completed
    // exchange-day equivalents. This is NOT IID's five-trading-day eligibility verdict.
    if (session.kind === 'DAILY_CLOSE') ageSeconds = completedTradingDays * 86_400;
    sessionEvidence = { basis, sessionState: days.get(to)!.sessions.some(s => Date.parse(s.opensAt) <= evalTimeMs && evalTimeMs < Date.parse(s.closesAt)) ? 'OPEN' : 'CLOSED', calendarVersion: calendar.version, ...(session.kind === 'DAILY_CLOSE' ? { completedTradingDays } : {}) };
  }

  if (ageSeconds <= threshold) {
    return {
      ...sessionEvidence,
      ageSeconds,
      quality: 'GOOD',
      nominalThresholdSeconds: threshold,
      staleConcessionActive: false,
      suppressExecution: false,
    };
  }

  if (ageSeconds <= 2 * threshold) {
    return {
      ...sessionEvidence,
      ageSeconds,
      quality: 'STALE',
      nominalThresholdSeconds: threshold,
      staleConcessionActive: true,
      suppressExecution: false,
    };
  }

  return {
    ...sessionEvidence,
    ageSeconds,
    quality: 'UNAVAILABLE',
    nominalThresholdSeconds: threshold,
    staleConcessionActive: false,
    suppressExecution: true,
  };
}
