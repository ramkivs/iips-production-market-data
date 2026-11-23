/**
 * Institutional Investment Platform System (IIPS)
 * D02 freshness projection from retained historical evidence (W-19 / D-4.3)
 *
 * Governed under: D-4.3 (approved under D-4 Option C), AD-12
 *
 * D-4.3 requires D02 freshness to be reported strictly from IPD evidence and requires
 * unavailable evidence to stay unavailable. This module is the read-only projection
 * from a retained historical observation into the existing `FreshnessStatus` shape.
 *
 * Which instant backs `verdict`:
 *   `verdict` answers "how old is the OBSERVATION". The only instant IPD can load-bear
 *   for that is the source-DECLARED market instant (`marketTimestamp`). IPD does not
 *   infer an availability instant from a candle, so `asOf`, `observationEvaluatedAt`
 *   and `timestampEvidence` stay unset/NOT_AVAILABLE and the declared market instant
 *   is reported in its own labelled field.
 *   `retrievalTimestamp` and `cacheTimestamp` are reported as independent evidence and
 *   are NEVER substituted into `asOf` — a recent fetch does not make old data fresh.
 *
 * No clock is read here: `evaluatedAt` is supplied by the caller's injected clock.
 */
import { DEFAULT_FRESHNESS_CONFIG, evaluateFreshness } from '../../quality/freshness_evaluator.js';
import { istDate, type TradingCalendar } from '../../quality/trading_calendar.js';
import type { DhanHistoricalCacheEntry } from './dhan_operational_controls.js';
import type { DhanFreshnessTimestamps, DhanHistoricalProvenance } from './dhan_historical_provenance.js';

const isInstant = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.trim() !== '' && Number.isFinite(Date.parse(value));

/** The freshness fields this projection owns; the service adds domain, clock and refresh state. */
export interface HistoricalFreshnessEvidence {
  readonly calendarMode: 'LEGACY_ELAPSED_UNQUALIFIED' | 'SESSION_CALENDAR_CONFIGURED';
  readonly calendarAssessment: 'NOT_CONFIGURED' | 'NOT_EVALUATED' | 'COVERED' | 'UNAVAILABLE';
  readonly cacheState: 'CURRENT' | 'STALE' | 'UNAVAILABLE';
  readonly asOf: null;
  readonly timestampEvidence: 'NOT_AVAILABLE';
  readonly receivedAt: string | null;
  readonly observationEvaluatedAt: null;
  readonly ageSeconds: number | null;
  readonly verdict: 'GOOD' | 'STALE' | 'UNAVAILABLE' | 'UNKNOWN';
  readonly staleConcessionActive: boolean;
  readonly suppressExecution: boolean;
  readonly eligibleForUse: boolean;
  readonly timestamps: DhanFreshnessTimestamps;
  readonly timestampStates: DhanFreshnessTimestamps['evidence'];
  /** Null only when no revision evidence exists — never a fabricated state. */
  readonly revision: DhanHistoricalProvenance['revision'] | null;
  readonly evidenceSource: 'HISTORICAL_CACHE';
  readonly basis?: 'SESSION_TIME' | 'COMPLETED_TRADING_DAYS';
  readonly sessionState?: 'OPEN' | 'CLOSED';
  readonly calendarVersion?: string;
  readonly completedTradingDays?: number;
  readonly calendarIssue?: 'INVALID_CALENDAR' | 'MISSING_COVERAGE' | 'INVALID_OBSERVATION';
}

/**
 * Projects one retained historical entry into freshness evidence.
 *
 * `cachedAt` is the entry's own storage instant on a cache hit, and `null` for a
 * just-fetched observation that has not been stored at the moment it is served. The two
 * are never conflated: a fresh fetch has no cache instant, and reporting one would
 * fabricate a storage event that did not happen.
 */
export function projectHistoricalFreshness(
  entry: DhanHistoricalCacheEntry | undefined,
  cachedAt: string | null,
  evaluatedAt: string,
  tradingCalendar: TradingCalendar | undefined,
  revision: DhanHistoricalProvenance['revision'] | null
): HistoricalFreshnessEvidence | null {
  const provenance = entry?.provenance;
  // No provenance means no evidence: the caller must report unknown rather than guess.
  if (!entry || !provenance) return null;

  const base = provenance.timestamps;
  const timestamps: DhanFreshnessTimestamps = Object.freeze({
    ...base,
    cacheTimestamp: isInstant(cachedAt) ? cachedAt : null,
    evidence: Object.freeze({
      ...base.evidence,
      cacheTimestamp: isInstant(cachedAt) ? 'DECLARED' : 'NOT_AVAILABLE',
    }),
  });

  const marketTimestamp = timestamps.marketTimestamp;
  const candles = entry.result.candles;
  const latest = candles.length > 0 ? candles[candles.length - 1]! : null;

  // DAILY_CLOSE is only evaluable when a calendar is configured AND the observation is a
  // completed daily close. Otherwise the existing legacy elapsed-time basis is used
  // unchanged — the evaluator is never handed a half-specified session.
  let session;
  if (tradingCalendar && latest && latest.interval === '1d' && isInstant(marketTimestamp)) {
    const observationDate = istDate(Date.parse(marketTimestamp));
    const completed =
      isInstant(evaluatedAt) && observationDate < istDate(Date.parse(evaluatedAt));
    session = {
      kind: 'DAILY_CLOSE' as const,
      calendar: tradingCalendar,
      exchange: provenance.observationScope.exchangeSegment === 'NSE_EQ' ? ('NSE' as const) : ('BSE' as const),
      observationDate,
      completed,
    };
  }

  // A missing market instant is not evaluated at all: no age, no verdict.
  const evaluation = isInstant(marketTimestamp)
    ? evaluateFreshness(marketTimestamp, 'D02_OHLCV', evaluatedAt, session)
    : null;

  const suppressExecution = evaluation?.suppressExecution ?? true;
  // Same classification vocabulary the quote cache uses: a suppressed observation is
  // UNAVAILABLE, never CURRENT, and a conceded observation is STALE rather than fresh.
  const cacheState: 'CURRENT' | 'STALE' | 'UNAVAILABLE' =
    suppressExecution ? 'UNAVAILABLE' : evaluation?.quality === 'GOOD' ? 'CURRENT' : 'STALE';
  return {
    // A session was only attempted when a calendar AND a completed daily close existed;
    // otherwise this observation is evaluated on the legacy elapsed-time basis and the
    // calendar assessment says NOT_CONFIGURED rather than implying a session was checked.
    calendarMode: session ? 'SESSION_CALENDAR_CONFIGURED' : 'LEGACY_ELAPSED_UNQUALIFIED',
    calendarAssessment: !session
      ? 'NOT_CONFIGURED'
      : !evaluation
        ? 'NOT_EVALUATED'
        : evaluation.calendarIssue || !evaluation.basis
          ? 'UNAVAILABLE'
          : 'COVERED',
    cacheState,
    // The observation instant is deliberately NOT surfaced as `asOf` (IPD-P5: never
    // infer an availability timestamp from a candle). It lives in `timestamps`.
    asOf: null,
    timestampEvidence: 'NOT_AVAILABLE',
    receivedAt: timestamps.retrievalTimestamp,
    observationEvaluatedAt: null,
    ageSeconds: evaluation && Number.isFinite(evaluation.ageSeconds) ? evaluation.ageSeconds : null,
    verdict: evaluation?.quality === 'GOOD' || evaluation?.quality === 'STALE' || evaluation?.quality === 'UNAVAILABLE' ? evaluation.quality : 'UNKNOWN',
    staleConcessionActive: evaluation?.staleConcessionActive ?? false,
    suppressExecution,
    eligibleForUse: !suppressExecution,
    timestamps,
    timestampStates: timestamps.evidence,
    revision,
    evidenceSource: 'HISTORICAL_CACHE',
    ...(evaluation?.basis ? { basis: evaluation.basis } : {}),
    ...(evaluation?.sessionState ? { sessionState: evaluation.sessionState } : {}),
    ...(evaluation?.calendarVersion ? { calendarVersion: evaluation.calendarVersion } : {}),
    ...(evaluation?.completedTradingDays !== undefined ? { completedTradingDays: evaluation.completedTradingDays } : {}),
    ...(evaluation?.calendarIssue ? { calendarIssue: evaluation.calendarIssue } : {}),
  };
}

/** Nominal D02 threshold, exposed so the unknown projection still states its domain threshold. */
export const D02_NOMINAL_THRESHOLD_SECONDS = DEFAULT_FRESHNESS_CONFIG.D02_OHLCV;
