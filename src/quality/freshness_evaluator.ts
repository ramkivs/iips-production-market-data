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
 * Evaluates the freshness of a dataset timestamp under AD-12 concession rules:
 * - Age <= Threshold: GOOD
 * - Threshold < Age <= 2 * Threshold: STALE (Concession active; usable with warning)
 * - Age > 2 * Threshold: UNAVAILABLE (Suppressed from engine execution)
 */
export function evaluateFreshness(
  timestamp: string,
  domain: DataDomain,
  evaluationTime: string,
  session?: SessionFreshnessContext
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

  let ageSeconds = Math.max(0, (evalTimeMs - dataTimeMs) / 1000);
  let sessionEvidence: Partial<FreshnessEvaluationResult> = {};
  if (session) {
    const basis = session.kind === 'QUOTE' ? 'SESSION_TIME' : 'COMPLETED_TRADING_DAYS';
    const invalid = (calendarIssue: NonNullable<FreshnessEvaluationResult['calendarIssue']>): FreshnessEvaluationResult => ({
      ageSeconds: Infinity, quality: 'UNAVAILABLE', nominalThresholdSeconds: DEFAULT_FRESHNESS_CONFIG[domain],
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
  const threshold = DEFAULT_FRESHNESS_CONFIG[domain] || 3600;

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
