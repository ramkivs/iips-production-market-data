import type { SessionFreshnessContext } from '../../quality/trading_calendar.js';
/** Read-only freshness projection. Evaluation is owned by the P07 evaluator. */
import { DEFAULT_FRESHNESS_CONFIG, evaluateFreshness, type FreshnessThresholds } from '../../quality/freshness_evaluator.js';
import type { CacheLookup } from './dhan_operational_controls.js';
import type {
  DhanFreshnessTimestamps,
  DhanHistoricalRevision,
  DhanTimestampEvidence,
} from './dhan_historical_provenance.js';

export type FreshnessDomain = 'D01_QUOTES' | 'D02_OHLCV';
export interface RefreshStatus {
  readonly outcome: 'SUCCESS' | 'SKIPPED_FRESH' | 'FAILURE' | 'UNKNOWN';
  /** Failure details deliberately exclude provider messages, codes and secret references. */
  readonly lastFailure: { readonly code: 'REFRESH_FAILED'; readonly priorPreserved: boolean } | null;
}
export interface FreshnessStatus {
  /** Configuration is not source qualification; COVERED means the evaluator found explicit rows. */
  readonly calendarMode: 'LEGACY_ELAPSED_UNQUALIFIED' | 'SESSION_CALENDAR_CONFIGURED' | 'NOT_APPLICABLE';
  readonly calendarAssessment: 'NOT_CONFIGURED' | 'NOT_EVALUATED' | 'COVERED' | 'UNAVAILABLE';
  readonly ageBasis?: 'SESSION_TIME' | 'COMPLETED_TRADING_DAYS';
  readonly sessionState?: 'OPEN' | 'CLOSED';
  readonly calendarVersion?: string;
  readonly calendarIssue?: 'INVALID_CALENDAR' | 'MISSING_COVERAGE' | 'INVALID_OBSERVATION';
  readonly domain: FreshnessDomain;
  readonly cacheState: 'CURRENT' | 'STALE' | 'UNAVAILABLE' | 'MISS' | 'NOT_AVAILABLE';
  readonly asOf: string | null;
  readonly timestampEvidence: 'VALID' | 'MISSING' | 'INVALID' | 'NOT_AVAILABLE';
  readonly receivedAt: string | null;
  /** Time of this read's evaluation, not the observation's original evaluation time. */
  readonly evaluatedAt: string;
  readonly observationEvaluatedAt: string | null;
  readonly thresholdSeconds: number;
  readonly ageSeconds: number | null;
  readonly verdict: 'GOOD' | 'STALE' | 'UNAVAILABLE' | 'UNKNOWN';
  readonly staleConcessionActive: boolean;
  readonly suppressExecution: boolean;
  readonly eligibleForUse: boolean;
  readonly lastRefresh: RefreshStatus;
  /**
   * W-19 / D-4.3 four-timestamp evidence. Optional so every existing consumer keeps
   * compiling unchanged; absent means "this surface does not report it", never
   * "fresh". Read it as evidence, not as a verdict — `verdict`/`suppressExecution`
   * remain the authority, and an unknown instant is never inferred.
   */
  readonly timestamps?: DhanFreshnessTimestamps;
  /** W-19: the four-field independent evidence state, when `timestamps` is present. */
  readonly timestampStates?: DhanTimestampEvidence;
  /** W-19: revision state of the served historical observation (D02 only). */
  readonly revision?: DhanHistoricalRevision | null;
  /**
   * W-19: how D02 freshness was sourced. `HISTORICAL_CACHE` means retained IPD
   * evidence backed the report; `NO_OBSERVATION` means this process holds no
   * historical observation yet, so the report is honestly unknown — not fabricated.
   */
  readonly evidenceSource?: 'HISTORICAL_CACHE' | 'NO_OBSERVATION';
  /**
   * Session history, independent of whether an observation is retained: the outcome of
   * the most recent historical request in this process, `UNKNOWN` before the first one.
   * It is deliberately NOT `SKIPPED_FRESH` merely because something is retained — a
   * cache hit is an observation fact, not the last attempt's outcome.
   */
  readonly refreshOutcome?: 'SUCCESS' | 'SKIPPED_FRESH' | 'FAILURE' | 'UNKNOWN';
}

const validTime = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '' && Number.isFinite(Date.parse(value));
type Observation = { provenance?: { asOf?: unknown; receivedAt?: unknown; evaluatedAt?: unknown } };

/**
 * Internal adapter over the evaluator, also handles absent or malformed evidence.
 *
 * W-25: `thresholds` carries the effective per-domain thresholds. It is passed straight to
 * the evaluator (which stays the owner of the arithmetic) and is also the fallback on the
 * unevaluated paths, so the reported `thresholdSeconds` is the effective value in every
 * branch — never the compiled default when an override is configured.
 */
export function freshnessStatus(domain: FreshnessDomain, lookup: CacheLookup<Observation> | null, evaluatedAt: string, lastRefresh: RefreshStatus, session?: SessionFreshnessContext, thresholds?: FreshnessThresholds): FreshnessStatus {
  const provenance = lookup?.entry?.provenance;
  const raw = provenance?.asOf;
  const timestampEvidence = !lookup || !lookup.entry ? 'NOT_AVAILABLE' : raw === undefined || raw === null || raw === '' ? 'MISSING' : validTime(raw) ? 'VALID' : 'INVALID';
  // An invalid timestamp is evaluated by P07 too; Infinity is represented as null in JSON.
  const evaluation = lookup?.entry ? evaluateFreshness(typeof raw === 'string' ? raw : '', domain, evaluatedAt, session, thresholds) : null;
  const suppressExecution = evaluation?.suppressExecution ?? true;
  return {
    calendarMode: domain === 'D02_OHLCV' && !lookup?.entry ? 'NOT_APPLICABLE' : session ? 'SESSION_CALENDAR_CONFIGURED' : 'LEGACY_ELAPSED_UNQUALIFIED',
    calendarAssessment: domain === 'D02_OHLCV' && !lookup?.entry ? 'NOT_EVALUATED' : !session ? 'NOT_CONFIGURED' : !evaluation ? 'NOT_EVALUATED' : evaluation.calendarIssue || !evaluation.basis ? 'UNAVAILABLE' : 'COVERED',
    ...(evaluation?.basis ? { ageBasis: evaluation.basis, sessionState: evaluation.sessionState, calendarVersion: evaluation.calendarVersion, ...(evaluation.calendarIssue ? { calendarIssue: evaluation.calendarIssue } : {}) } : {}),
    domain,
    cacheState: lookup?.state ?? 'NOT_AVAILABLE',
    asOf: validTime(raw) ? raw : null,
    timestampEvidence,
    receivedAt: validTime(provenance?.receivedAt) ? provenance.receivedAt : null,
    evaluatedAt,
    observationEvaluatedAt: validTime(provenance?.evaluatedAt) ? provenance.evaluatedAt : null,
    thresholdSeconds: evaluation?.nominalThresholdSeconds ?? thresholds?.[domain] ?? DEFAULT_FRESHNESS_CONFIG[domain],
    ageSeconds: evaluation && Number.isFinite(evaluation.ageSeconds) ? evaluation.ageSeconds : null,
    verdict: evaluation?.quality === 'GOOD' || evaluation?.quality === 'STALE' || evaluation?.quality === 'UNAVAILABLE' ? evaluation.quality : 'UNKNOWN',
    staleConcessionActive: evaluation?.staleConcessionActive ?? false,
    suppressExecution,
    eligibleForUse: !suppressExecution,
    lastRefresh,
  };
}
