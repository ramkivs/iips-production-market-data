/**
 * Institutional Investment Platform System (IIPS)
 * Dhan Observed Provider State Recorder (W-08 / D-2 / D-7)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-17 (Zero-Plaintext)
 *
 * PURPOSE:
 *  Maintains bounded, constant-space, in-process evidence of observed provider
 *  interactions (`lastSuccessAt`, `lastFailure: { category, at }`,
 *  `lastAuthOutcome`, `lastLatencyMs`, `consecutiveAuthFailures`, `authLatched`)
 *  so health/status surfaces report observed evidence rather than inference.
 *
 * DISCLOSURE & SECURITY INVARIANTS (D-7 §4 / AD-17):
 *  - Governed failure categories ONLY (`DhanFailureCode` closed enumeration).
 *  - NEVER accepts, retains, or serializes raw provider error messages,
 *    credential material, `vault://` secret references, filesystem paths, or
 *    child-process stdout/stderr.
 *  - Timestamps are canonicalized to strict ISO-8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`);
 *    malformed or untrusted strings are never echoed into recorder state.
 *  - Observation-only reads (`snapshot()`, `isAuthLatched()`) return deeply
 *    frozen snapshots and never mutate internal state.
 *
 * AUTHENTICATION COUNTING & LATCH POLICY (D-2 / W-05 / D-7 §2.2–§2.3):
 *  - `CREDENTIALS_EXPIRED` is a local pre-flight determination (zero vendor
 *    calls) and records `lastAuthOutcome = 'CREDENTIALS_EXPIRED'` without
 *    incrementing `consecutiveAuthFailures` or latching.
 *  - `AUTHENTICATION_FAILURE` is a vendor authentication rejection (HTTP 401/403)
 *    that increments `consecutiveAuthFailures`.
 *  - At `consecutiveAuthFailures >= DHAN_AUTH_LATCH_THRESHOLD` (2 — initial
 *    rejection plus at most one replacement attempt per D-2), `authLatched`
 *    transitions to `true` and stays latched for the lifetime of the process;
 *    auto-recovery out of a latched auth state without operator intervention
 *    and restart is forbidden (D-7 §2.2 / §2.3).
 *  - When `authLatched === false`, an accepted authenticated vendor interaction
 *    resets `consecutiveAuthFailures` to `0`, clears `lastFailure` to `null`,
 *    sets `lastAuthOutcome = 'AUTHENTICATED'`, and updates `lastSuccessAt` and
 *    `lastLatencyMs` (D-7 T7).
 */

import type { DhanFailureCode } from './dhan_failures.js';

/**
 * D-2 / W-05 governed vendor auth-rejection latch threshold:
 * initial HTTP 401/403 rejection (1) + at most one bounded replacement attempt (2).
 */
export const DHAN_AUTH_LATCH_THRESHOLD = 2 as const;

export type DhanObservedFailureCategory = DhanFailureCode;

const GOVERNED_FAILURE_CATEGORY_LIST: readonly DhanObservedFailureCategory[] = [
  'CREDENTIALS_UNAVAILABLE',
  'CREDENTIALS_EXPIRED',
  'CONFIGURATION_INCOMPLETE',
  'PRODUCTION_NOT_AUTHORIZED',
  'AUTHENTICATION_FAILURE',
  'RATE_LIMITED',
  'TIMEOUT',
  'TRANSPORT_FAILURE',
  'HTTP_ERROR',
  'PROVIDER_STATUS_FAILURE',
  'MALFORMED_RESPONSE',
  'MISSING_REQUIRED_FIELD',
  'INSTRUMENT_NOT_IN_RESPONSE',
  'UNRESOLVED_INSTRUMENT',
  'CANONICAL_VALIDATION_FAILURE',
  'STALE_DATA_SUPPRESSED',
  'UNSUPPORTED_DOMAIN',
  'UNSUPPORTED_PRE_ACCESS_OPERATION',
  'MALFORMED_INSTRUMENT_MAPPING',
  'CONFLICTING_INSTRUMENT_MAPPING',
  'IDENTITY_RESOLUTION_FAILURE',
  'INVALID_DATE_RANGE',
  'UNSUPPORTED_INTERVAL',
  'EMPTY_HISTORICAL_SERIES',
] as const;

export const GOVERNED_PROVIDER_FAILURE_CATEGORIES: ReadonlySet<DhanObservedFailureCategory> =
  new Set<DhanObservedFailureCategory>(GOVERNED_FAILURE_CATEGORY_LIST);

export function isGovernedProviderFailureCategory(
  value: unknown
): value is DhanObservedFailureCategory {
  return (
    typeof value === 'string' &&
    GOVERNED_PROVIDER_FAILURE_CATEGORIES.has(value as DhanObservedFailureCategory)
  );
}

export interface DhanRecordedFailure {
  readonly category: DhanObservedFailureCategory;
  readonly at: string;
}

export type DhanAuthOutcome =
  | 'NOT_CHECKED'
  | 'AUTHENTICATED'
  | 'AUTHENTICATION_FAILURE'
  | 'CREDENTIALS_EXPIRED'
  | 'CREDENTIALS_UNAVAILABLE';

export interface DhanProviderObservedState {
  readonly lastSuccessAt: string | null;
  readonly lastFailure: DhanRecordedFailure | null;
  readonly lastAuthOutcome: DhanAuthOutcome;
  readonly lastLatencyMs: number | null;
  readonly consecutiveAuthFailures: number;
  readonly authLatched: boolean;
}

export type DhanVerificationMode = 'LIVE_PROBE' | 'LOCAL_ONLY';

/** D-7 §3 enumerated operator-initiated connection verification outcomes. */
export type DhanVerificationOutcomeCode =
  | 'VERIFIED_VENDOR_ACCEPTED'
  | 'VERIFIED_LOCAL_ONLY'
  | 'AUTH_REJECTED'
  | 'EXPIRED_LOCAL'
  | 'NOT_ATTEMPTED_NOT_READY'
  | 'FAILED_TRANSPORT'
  | 'FAILED_VENDOR_RESPONSE';

export interface VerifyProviderConnectionOptions {
  readonly mode?: DhanVerificationMode;
}

export interface ProviderVerificationResult {
  readonly outcome: DhanVerificationOutcomeCode;
  readonly probeAttempted: boolean;
  readonly probeCount: 0 | 1;
  readonly failureCategory: DhanObservedFailureCategory | null;
  readonly latencyMs: number | null;
  readonly checkedAt: string;
  readonly observedState: DhanProviderObservedState;
}

export interface DhanProviderStateRecorderOptions {
  /** Monotonic/wall-clock epoch ms source for deterministic fallback timestamps. */
  readonly now?: () => number;
}

export interface RecordProviderSuccessInput {
  readonly at: string;
  readonly latencyMs: number;
}

export interface RecordProviderFailureInput {
  readonly category: DhanObservedFailureCategory;
  readonly at: string;
  readonly latencyMs?: number;
}

function normalizeIsoUtcTimestamp(candidate: unknown, fallbackNowMs: () => number): string {
  if (typeof candidate === 'string' && candidate.trim() !== '') {
    const parsedMs = Date.parse(candidate);
    if (Number.isFinite(parsedMs)) {
      return new Date(parsedMs).toISOString();
    }
  }
  const fallbackMs = fallbackNowMs();
  return new Date(Number.isFinite(fallbackMs) ? fallbackMs : 0).toISOString();
}

function normalizeLatencyMs(candidate: unknown): number | null {
  if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0) {
    return candidate;
  }
  return null;
}

/**
 * Bounded O(1) in-process state recorder for observed Dhan provider interactions.
 * Never initiates I/O, timers, retries, or credential resolution.
 */
export class DhanProviderStateRecorder {
  private readonly now: () => number;
  private lastSuccessAt: string | null = null;
  private lastFailure: DhanRecordedFailure | null = null;
  private lastAuthOutcome: DhanAuthOutcome = 'NOT_CHECKED';
  private lastLatencyMs: number | null = null;
  private consecutiveAuthFailures = 0;
  private authLatched = false;

  constructor(options: DhanProviderStateRecorderOptions = {}) {
    this.now = options.now ?? (() => Date.now());
  }

  public isAuthLatched(): boolean {
    return this.authLatched;
  }

  /**
   * Records a vendor-accepted authenticated provider interaction.
   * Per D-2 / D-7 §2.2–§2.3, once `authLatched` is true in this process,
   * automatic recovery out of the latched auth state is forbidden.
   */
  public recordSuccess(input: RecordProviderSuccessInput): DhanProviderObservedState {
    if (this.authLatched) {
      return this.snapshot();
    }
    const at = normalizeIsoUtcTimestamp(input?.at, this.now);
    const latencyMs = normalizeLatencyMs(input?.latencyMs);
    this.lastSuccessAt = at;
    this.lastLatencyMs = latencyMs ?? 0;
    this.lastFailure = null;
    this.lastAuthOutcome = 'AUTHENTICATED';
    this.consecutiveAuthFailures = 0;
    return this.snapshot();
  }

  /**
   * Records a failed provider interaction using governed failure categories only.
   * Untrusted fields on `input` are never read or retained.
   */
  public recordFailure(input: RecordProviderFailureInput): DhanProviderObservedState {
    const rawCategory = (input as { readonly category?: unknown } | null | undefined)?.category;
    const category: DhanObservedFailureCategory = isGovernedProviderFailureCategory(rawCategory)
      ? rawCategory
      : 'PROVIDER_STATUS_FAILURE';
    const at = normalizeIsoUtcTimestamp(
      (input as { readonly at?: unknown } | null | undefined)?.at,
      this.now
    );
    const latencyMs = normalizeLatencyMs(
      (input as { readonly latencyMs?: unknown } | null | undefined)?.latencyMs
    );

    this.lastFailure = Object.freeze({ category, at });
    if (latencyMs !== null) {
      this.lastLatencyMs = latencyMs;
    }

    if (category === 'AUTHENTICATION_FAILURE') {
      this.lastAuthOutcome = 'AUTHENTICATION_FAILURE';
      this.consecutiveAuthFailures += 1;
      if (this.consecutiveAuthFailures >= DHAN_AUTH_LATCH_THRESHOLD) {
        this.authLatched = true;
      }
    } else if (!this.authLatched) {
      if (category === 'CREDENTIALS_EXPIRED') {
        this.lastAuthOutcome = 'CREDENTIALS_EXPIRED';
      } else if (
        category === 'CREDENTIALS_UNAVAILABLE' ||
        category === 'CONFIGURATION_INCOMPLETE' ||
        category === 'PRODUCTION_NOT_AUTHORIZED'
      ) {
        this.lastAuthOutcome = 'CREDENTIALS_UNAVAILABLE';
      }
    }

    return this.snapshot();
  }

  /**
   * Pure observation-only snapshot. Never mutates recorder state and returns
   * a deeply frozen object containing only governed W-08 fields.
   */
  public snapshot(): DhanProviderObservedState {
    const failureSnapshot: DhanRecordedFailure | null =
      this.lastFailure === null
        ? null
        : Object.freeze({
            category: this.lastFailure.category,
            at: this.lastFailure.at,
          });
    return Object.freeze({
      lastSuccessAt: this.lastSuccessAt,
      lastFailure: failureSnapshot,
      lastAuthOutcome: this.lastAuthOutcome,
      lastLatencyMs: this.lastLatencyMs,
      consecutiveAuthFailures: this.consecutiveAuthFailures,
      authLatched: this.authLatched,
    });
  }
}
