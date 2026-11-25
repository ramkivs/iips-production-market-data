import type { SessionFreshnessContext } from '../../quality/trading_calendar.js';
/** Read-only freshness projection. Evaluation is owned by the P07 evaluator. */
import { DEFAULT_FRESHNESS_CONFIG, evaluateFreshness } from '../../quality/freshness_evaluator.js';
import type { CacheLookup } from './dhan_operational_controls.js';
import type {
  DhanFreshnessTimestamps,
  DhanHistoricalRevision,
  DhanHistoricalRevisionState,
  DhanMarketTimestampDerivation,
  DhanTimestampEvidence,
  DhanTimestampState,
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
  readonly basis?: 'SESSION_TIME' | 'COMPLETED_TRADING_DAYS';
  readonly sessionState?: 'OPEN' | 'CLOSED';
  readonly calendarVersion?: string;
  readonly completedTradingDays?: number;
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

/** Internal adapter over the evaluator, also handles absent or malformed evidence. */
export function freshnessStatus(domain: FreshnessDomain, lookup: CacheLookup<Observation> | null, evaluatedAt: string, lastRefresh: RefreshStatus, session?: SessionFreshnessContext): FreshnessStatus {
  const provenance = lookup?.entry?.provenance;
  const raw = provenance?.asOf;
  const timestampEvidence = !lookup || !lookup.entry ? 'NOT_AVAILABLE' : raw === undefined || raw === null || raw === '' ? 'MISSING' : validTime(raw) ? 'VALID' : 'INVALID';
  // An invalid timestamp is evaluated by P07 too; Infinity is represented as null in JSON.
  const evaluation = lookup?.entry ? evaluateFreshness(typeof raw === 'string' ? raw : '', domain, evaluatedAt, session) : null;
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
    thresholdSeconds: evaluation?.nominalThresholdSeconds ?? DEFAULT_FRESHNESS_CONFIG[domain],
    ageSeconds: evaluation && Number.isFinite(evaluation.ageSeconds) ? evaluation.ageSeconds : null,
    verdict: evaluation?.quality === 'GOOD' || evaluation?.quality === 'STALE' || evaluation?.quality === 'UNAVAILABLE' ? evaluation.quality : 'UNKNOWN',
    staleConcessionActive: evaluation?.staleConcessionActive ?? false,
    suppressExecution,
    eligibleForUse: !suppressExecution,
    lastRefresh,
  };
}

const FRESHNESS_DOMAINS: ReadonlySet<string> = new Set<FreshnessDomain>(['D01_QUOTES', 'D02_OHLCV']);
const CACHE_STATES: ReadonlySet<string> = new Set<FreshnessStatus['cacheState']>([
  'CURRENT',
  'STALE',
  'UNAVAILABLE',
  'MISS',
  'NOT_AVAILABLE',
]);
const TIMESTAMP_EVIDENCE_VALUES: ReadonlySet<string> = new Set<FreshnessStatus['timestampEvidence']>([
  'VALID',
  'MISSING',
  'INVALID',
  'NOT_AVAILABLE',
]);
const VERDICTS: ReadonlySet<string> = new Set<FreshnessStatus['verdict']>([
  'GOOD',
  'STALE',
  'UNAVAILABLE',
  'UNKNOWN',
]);
const REFRESH_OUTCOMES: ReadonlySet<string> = new Set<RefreshStatus['outcome']>([
  'SUCCESS',
  'SKIPPED_FRESH',
  'FAILURE',
  'UNKNOWN',
]);
const CALENDAR_MODES: ReadonlySet<string> = new Set<FreshnessStatus['calendarMode']>([
  'LEGACY_ELAPSED_UNQUALIFIED',
  'SESSION_CALENDAR_CONFIGURED',
  'NOT_APPLICABLE',
]);
const CALENDAR_ASSESSMENTS: ReadonlySet<string> = new Set<FreshnessStatus['calendarAssessment']>([
  'NOT_CONFIGURED',
  'NOT_EVALUATED',
  'COVERED',
  'UNAVAILABLE',
]);
const AGE_BASES: ReadonlySet<string> = new Set<'SESSION_TIME' | 'COMPLETED_TRADING_DAYS'>([
  'SESSION_TIME',
  'COMPLETED_TRADING_DAYS',
]);
const SESSION_STATES: ReadonlySet<string> = new Set<'OPEN' | 'CLOSED'>(['OPEN', 'CLOSED']);
const CALENDAR_ISSUES: ReadonlySet<string> = new Set<
  'INVALID_CALENDAR' | 'MISSING_COVERAGE' | 'INVALID_OBSERVATION'
>(['INVALID_CALENDAR', 'MISSING_COVERAGE', 'INVALID_OBSERVATION']);
const TIMESTAMP_STATES: ReadonlySet<string> = new Set<DhanTimestampState>([
  'DECLARED',
  'NOT_DECLARED',
  'NOT_AVAILABLE',
]);
const MARKET_TIMESTAMP_DERIVATIONS: ReadonlySet<string> = new Set<DhanMarketTimestampDerivation>([
  'SOURCE_DECLARED_CANDLE_PERIOD_START',
  'NO_OBSERVATION',
]);
const REVISION_STATES: ReadonlySet<string> = new Set<DhanHistoricalRevisionState>([
  'BASELINE',
  'UNCHANGED',
  'REVISED',
]);
const EVIDENCE_SOURCES: ReadonlySet<string> = new Set<'HISTORICAL_CACHE' | 'NO_OBSERVATION'>([
  'HISTORICAL_CACHE',
  'NO_OBSERVATION',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNullableNonEmptyString(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

function validateTimestampEvidence(raw: unknown): DhanTimestampEvidence | null {
  if (!isPlainObject(raw)) return null;
  if (
    typeof raw.marketTimestamp !== 'string' ||
    !TIMESTAMP_STATES.has(raw.marketTimestamp) ||
    typeof raw.providerResponseTimestamp !== 'string' ||
    !TIMESTAMP_STATES.has(raw.providerResponseTimestamp) ||
    typeof raw.retrievalTimestamp !== 'string' ||
    !TIMESTAMP_STATES.has(raw.retrievalTimestamp) ||
    typeof raw.cacheTimestamp !== 'string' ||
    !TIMESTAMP_STATES.has(raw.cacheTimestamp)
  ) {
    return null;
  }
  return {
    marketTimestamp: raw.marketTimestamp as DhanTimestampState,
    providerResponseTimestamp: raw.providerResponseTimestamp as DhanTimestampState,
    retrievalTimestamp: raw.retrievalTimestamp as DhanTimestampState,
    cacheTimestamp: raw.cacheTimestamp as DhanTimestampState,
  };
}

function validateFreshnessTimestamps(raw: unknown): DhanFreshnessTimestamps | null {
  if (!isPlainObject(raw)) return null;
  if (
    !isNullableNonEmptyString(raw.marketTimestamp) ||
    typeof raw.marketTimestampDerivation !== 'string' ||
    !MARKET_TIMESTAMP_DERIVATIONS.has(raw.marketTimestampDerivation) ||
    !isNullableNonEmptyString(raw.providerResponseTimestamp) ||
    !isNullableNonEmptyString(raw.retrievalTimestamp) ||
    !isNullableNonEmptyString(raw.cacheTimestamp)
  ) {
    return null;
  }
  const evidence = validateTimestampEvidence(raw.evidence);
  if (evidence === null) return null;
  return {
    marketTimestamp: raw.marketTimestamp,
    marketTimestampDerivation: raw.marketTimestampDerivation as DhanMarketTimestampDerivation,
    providerResponseTimestamp: raw.providerResponseTimestamp,
    retrievalTimestamp: raw.retrievalTimestamp,
    cacheTimestamp: raw.cacheTimestamp,
    evidence,
  };
}

function validateHistoricalRevision(raw: unknown): DhanHistoricalRevision | null | undefined {
  if (raw === null) return null;
  if (!isPlainObject(raw)) return undefined;
  if (
    typeof raw.state !== 'string' ||
    !REVISION_STATES.has(raw.state) ||
    !isNonEmptyString(raw.contentDigest) ||
    !isNullableNonEmptyString(raw.priorContentDigest)
  ) {
    return undefined;
  }
  return {
    state: raw.state as DhanHistoricalRevisionState,
    contentDigest: raw.contentDigest,
    priorContentDigest: raw.priorContentDigest,
  };
}

/**
 * Validates a decoded `GET /v1/freshness` JSON payload fail-closed against the
 * governed IPD {@link FreshnessStatus} contract, preserving all W-19 D02
 * four-timestamp/revision fields and W-22 session-calendar fields verbatim
 * without fabricating absent fields.
 */
export function validateDhanFreshnessStatus(raw: unknown): FreshnessStatus | null {
  if (!isPlainObject(raw)) return null;

  if (typeof raw.domain !== 'string' || !FRESHNESS_DOMAINS.has(raw.domain)) return null;
  if (typeof raw.cacheState !== 'string' || !CACHE_STATES.has(raw.cacheState)) return null;
  if (!isNullableNonEmptyString(raw.asOf)) return null;
  if (
    typeof raw.timestampEvidence !== 'string' ||
    !TIMESTAMP_EVIDENCE_VALUES.has(raw.timestampEvidence)
  ) {
    return null;
  }
  if (!isNullableNonEmptyString(raw.receivedAt)) return null;
  if (!isNonEmptyString(raw.evaluatedAt)) return null;
  if (!isNullableNonEmptyString(raw.observationEvaluatedAt)) return null;
  if (
    typeof raw.thresholdSeconds !== 'number' ||
    !Number.isFinite(raw.thresholdSeconds) ||
    raw.thresholdSeconds <= 0
  ) {
    return null;
  }
  if (
    raw.ageSeconds !== null &&
    (typeof raw.ageSeconds !== 'number' || !Number.isFinite(raw.ageSeconds) || raw.ageSeconds < 0)
  ) {
    return null;
  }
  if (typeof raw.verdict !== 'string' || !VERDICTS.has(raw.verdict)) return null;
  if (typeof raw.staleConcessionActive !== 'boolean') return null;
  if (typeof raw.suppressExecution !== 'boolean') return null;
  if (typeof raw.eligibleForUse !== 'boolean') return null;

  if (!isPlainObject(raw.lastRefresh)) return null;
  if (
    typeof raw.lastRefresh.outcome !== 'string' ||
    !REFRESH_OUTCOMES.has(raw.lastRefresh.outcome)
  ) {
    return null;
  }
  let lastFailure: RefreshStatus['lastFailure'] = null;
  if (raw.lastRefresh.lastFailure !== null) {
    if (!isPlainObject(raw.lastRefresh.lastFailure)) return null;
    if (
      raw.lastRefresh.lastFailure.code !== 'REFRESH_FAILED' ||
      typeof raw.lastRefresh.lastFailure.priorPreserved !== 'boolean'
    ) {
      return null;
    }
    lastFailure = {
      code: 'REFRESH_FAILED',
      priorPreserved: raw.lastRefresh.lastFailure.priorPreserved,
    };
  }

  if (typeof raw.calendarMode !== 'string' || !CALENDAR_MODES.has(raw.calendarMode)) return null;
  if (
    typeof raw.calendarAssessment !== 'string' ||
    !CALENDAR_ASSESSMENTS.has(raw.calendarAssessment)
  ) {
    return null;
  }

  let ageBasis: FreshnessStatus['ageBasis'];
  if (raw.ageBasis !== undefined) {
    if (typeof raw.ageBasis !== 'string' || !AGE_BASES.has(raw.ageBasis)) return null;
    ageBasis = raw.ageBasis as FreshnessStatus['ageBasis'];
  }

  let basis: FreshnessStatus['basis'];
  if (raw.basis !== undefined) {
    if (typeof raw.basis !== 'string' || !AGE_BASES.has(raw.basis)) return null;
    basis = raw.basis as FreshnessStatus['basis'];
  }

  let sessionState: FreshnessStatus['sessionState'];
  if (raw.sessionState !== undefined) {
    if (typeof raw.sessionState !== 'string' || !SESSION_STATES.has(raw.sessionState)) return null;
    sessionState = raw.sessionState as FreshnessStatus['sessionState'];
  }

  let calendarVersion: string | undefined;
  if (raw.calendarVersion !== undefined) {
    if (!isNonEmptyString(raw.calendarVersion)) return null;
    calendarVersion = raw.calendarVersion;
  }

  let completedTradingDays: number | undefined;
  if (raw.completedTradingDays !== undefined) {
    if (
      typeof raw.completedTradingDays !== 'number' ||
      !Number.isInteger(raw.completedTradingDays) ||
      raw.completedTradingDays < 0
    ) {
      return null;
    }
    completedTradingDays = raw.completedTradingDays;
  }

  let calendarIssue: FreshnessStatus['calendarIssue'];
  if (raw.calendarIssue !== undefined) {
    if (typeof raw.calendarIssue !== 'string' || !CALENDAR_ISSUES.has(raw.calendarIssue)) {
      return null;
    }
    calendarIssue = raw.calendarIssue as FreshnessStatus['calendarIssue'];
  }

  let timestamps: DhanFreshnessTimestamps | undefined;
  if (raw.timestamps !== undefined) {
    const validated = validateFreshnessTimestamps(raw.timestamps);
    if (validated === null) return null;
    timestamps = validated;
  }

  let timestampStates: DhanTimestampEvidence | undefined;
  if (raw.timestampStates !== undefined) {
    const validated = validateTimestampEvidence(raw.timestampStates);
    if (validated === null) return null;
    timestampStates = validated;
  }

  let hasRevision = false;
  let revision: DhanHistoricalRevision | null = null;
  if (raw.revision !== undefined) {
    const validated = validateHistoricalRevision(raw.revision);
    if (validated === undefined) return null;
    hasRevision = true;
    revision = validated;
  }

  let evidenceSource: FreshnessStatus['evidenceSource'];
  if (raw.evidenceSource !== undefined) {
    if (typeof raw.evidenceSource !== 'string' || !EVIDENCE_SOURCES.has(raw.evidenceSource)) {
      return null;
    }
    evidenceSource = raw.evidenceSource as FreshnessStatus['evidenceSource'];
  }

  let refreshOutcome: FreshnessStatus['refreshOutcome'];
  if (raw.refreshOutcome !== undefined) {
    if (typeof raw.refreshOutcome !== 'string' || !REFRESH_OUTCOMES.has(raw.refreshOutcome)) {
      return null;
    }
    refreshOutcome = raw.refreshOutcome as FreshnessStatus['refreshOutcome'];
  }

  return {
    calendarMode: raw.calendarMode as FreshnessStatus['calendarMode'],
    calendarAssessment: raw.calendarAssessment as FreshnessStatus['calendarAssessment'],
    ...(ageBasis !== undefined ? { ageBasis } : {}),
    ...(basis !== undefined ? { basis } : {}),
    ...(sessionState !== undefined ? { sessionState } : {}),
    ...(calendarVersion !== undefined ? { calendarVersion } : {}),
    ...(completedTradingDays !== undefined ? { completedTradingDays } : {}),
    ...(calendarIssue !== undefined ? { calendarIssue } : {}),
    domain: raw.domain as FreshnessDomain,
    cacheState: raw.cacheState as FreshnessStatus['cacheState'],
    asOf: raw.asOf,
    timestampEvidence: raw.timestampEvidence as FreshnessStatus['timestampEvidence'],
    receivedAt: raw.receivedAt,
    evaluatedAt: raw.evaluatedAt,
    observationEvaluatedAt: raw.observationEvaluatedAt,
    thresholdSeconds: raw.thresholdSeconds,
    ageSeconds: raw.ageSeconds,
    verdict: raw.verdict as FreshnessStatus['verdict'],
    staleConcessionActive: raw.staleConcessionActive,
    suppressExecution: raw.suppressExecution,
    eligibleForUse: raw.eligibleForUse,
    lastRefresh: {
      outcome: raw.lastRefresh.outcome as RefreshStatus['outcome'],
      lastFailure,
    },
    ...(timestamps !== undefined ? { timestamps } : {}),
    ...(timestampStates !== undefined ? { timestampStates } : {}),
    ...(hasRevision ? { revision } : {}),
    ...(evidenceSource !== undefined ? { evidenceSource } : {}),
    ...(refreshOutcome !== undefined ? { refreshOutcome } : {}),
  };
}
