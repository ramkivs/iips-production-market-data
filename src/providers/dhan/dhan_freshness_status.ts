/** Read-only freshness projection. Evaluation is owned by the P07 evaluator. */
import { DEFAULT_FRESHNESS_CONFIG, evaluateFreshness } from '../../quality/freshness_evaluator.js';
import type { CacheLookup } from './dhan_operational_controls.js';

export type FreshnessDomain = 'D01_QUOTES' | 'D02_OHLCV';
export interface RefreshStatus {
  readonly outcome: 'SUCCESS' | 'SKIPPED_FRESH' | 'FAILURE' | 'UNKNOWN';
  /** Failure details deliberately exclude provider messages, codes and secret references. */
  readonly lastFailure: { readonly code: 'REFRESH_FAILED'; readonly priorPreserved: boolean } | null;
}
export interface FreshnessStatus {
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
}

const validTime = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '' && Number.isFinite(Date.parse(value));
type Observation = { provenance?: { asOf?: unknown; receivedAt?: unknown; evaluatedAt?: unknown } };

/** Internal adapter over the evaluator, also handles absent or malformed evidence. */
export function freshnessStatus(domain: FreshnessDomain, lookup: CacheLookup<Observation> | null, evaluatedAt: string, lastRefresh: RefreshStatus): FreshnessStatus {
  const provenance = lookup?.entry?.provenance;
  const raw = provenance?.asOf;
  const timestampEvidence = !lookup || !lookup.entry ? 'NOT_AVAILABLE' : raw === undefined || raw === null || raw === '' ? 'MISSING' : validTime(raw) ? 'VALID' : 'INVALID';
  // An invalid timestamp is evaluated by P07 too; Infinity is represented as null in JSON.
  const evaluation = lookup?.entry ? evaluateFreshness(typeof raw === 'string' ? raw : '', domain, evaluatedAt) : null;
  const suppressExecution = evaluation?.suppressExecution ?? true;
  return {
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
