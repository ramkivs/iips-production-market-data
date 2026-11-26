/**
 * Institutional Investment Platform System (IIPS)
 * W-24 — Bounded In-Memory Diagnostic Ring (D-7 §4.6–§4.8)
 *
 * Governed under: D-7 §4.5–§4.10 (amended 2026-11-20)
 *
 * PURPOSE:
 *  Stores structured W-24 diagnostic events for IPD (capacity 1,024) and IRR
 *  (capacity 512, same implementation). Process-lifetime memory only, never
 *  persisted, never external sink, oldest-eviction (§4.8).
 *
 * SECURITY (D-7 §4.2, §4.9):
 *  - Exactly 12 allowlisted fields (D-7 §4.6); no secret, token, vault://, path,
 *    URL, payload, DTO, business identifier/hash, exception/child text.
 *  - 1 KiB serialized ceiling (§4.6 rule 4): drop, never trim prohibited value.
 *  - Never grows/spills/blocks; eviction count tracked.
 *  - Sequence monotonically increasing, exposed as eviction indicator.
 */

export const W24_RING_CAPACITY_IPD = 1024 as const;
export const W24_RING_CAPACITY_IRR = 512 as const;
export const W24_EVENT_SCHEMA_VERSION = 1 as const;
export const W24_MAX_EVENT_BYTES = 1024 as const; // 1 KiB

export type W24Component = 'IRR' | 'IPD';
export type W24Operation = 'QUOTE' | 'HISTORY' | 'FRESHNESS';
export type W24EventName =
  | 'ACTION_START'
  | 'ACTION_END'
  | 'REQUEST_ADMITTED'
  | 'REQUEST_END'
  | 'CACHE_HIT'
  | 'WORK_START'
  | 'WORK_JOIN'
  | 'ATTEMPT_START'
  | 'ATTEMPT_END'
  | 'TIMEOUT'
  | 'LATE_COMPLETION';
export type W24Outcome = 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'NOT_ATTEMPTED' | 'UNKNOWN';

/**
 * Closed 13-value failureCategory enumeration (§4.7).
 * Unknown maps to INTERNAL_ERROR; never free-text.
 */
export type W24FailureCategory =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_FAILED'
  | 'AUTHORIZATION_FAILED'
  | 'CONFIGURATION_ERROR'
  | 'READINESS_FAILED'
  | 'IDENTITY_REJECTED'
  | 'RATE_LIMITED'
  | 'CACHE_ERROR'
  | 'TRANSPORT_ERROR'
  | 'PROVIDER_ERROR'
  | 'TIMEOUT'
  | 'CONTRACT_MISMATCH'
  | 'INTERNAL_ERROR';

export const W24_FAILURE_CATEGORIES: readonly W24FailureCategory[] = [
  'VALIDATION_ERROR',
  'AUTHENTICATION_FAILED',
  'AUTHORIZATION_FAILED',
  'CONFIGURATION_ERROR',
  'READINESS_FAILED',
  'IDENTITY_REJECTED',
  'RATE_LIMITED',
  'CACHE_ERROR',
  'TRANSPORT_ERROR',
  'PROVIDER_ERROR',
  'TIMEOUT',
  'CONTRACT_MISMATCH',
  'INTERNAL_ERROR',
] as const;

const W24_FAILURE_CATEGORY_SET: ReadonlySet<string> = new Set(W24_FAILURE_CATEGORIES);

export function isW24FailureCategory(value: unknown): value is W24FailureCategory {
  return typeof value === 'string' && W24_FAILURE_CATEGORY_SET.has(value);
}

export const W24_COMPONENTS: readonly W24Component[] = ['IRR', 'IPD'] as const;
export const W24_OPERATIONS: readonly W24Operation[] = ['QUOTE', 'HISTORY', 'FRESHNESS'] as const;
export const W24_EVENT_NAMES: readonly W24EventName[] = [
  'ACTION_START',
  'ACTION_END',
  'REQUEST_ADMITTED',
  'REQUEST_END',
  'CACHE_HIT',
  'WORK_START',
  'WORK_JOIN',
  'ATTEMPT_START',
  'ATTEMPT_END',
  'TIMEOUT',
  'LATE_COMPLETION',
] as const;
export const W24_OUTCOMES: readonly W24Outcome[] = [
  'SUCCESS',
  'FAILURE',
  'TIMEOUT',
  'NOT_ATTEMPTED',
  'UNKNOWN',
] as const;

const W24_COMPONENT_SET = new Set<string>(W24_COMPONENTS);
const W24_OPERATION_SET = new Set<string>(W24_OPERATIONS);
const W24_EVENT_SET = new Set<string>(W24_EVENT_NAMES);
const W24_OUTCOME_SET = new Set<string>(W24_OUTCOMES);

const LOWERCASE_UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CANONICAL_ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isLowercaseUuidV4Strict(value: unknown): boolean {
  return typeof value === 'string' && LOWERCASE_UUID_V4_PATTERN.test(value);
}

function isCanonicalIsoUtc(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    CANONICAL_ISO_UTC_PATTERN.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

/**
 * Structured diagnostic event (§4.6) — exactly 12 fields, closed enums.
 * No index signature, no passthrough, never secret-bearing.
 */
export interface DhanDiagnosticEvent {
  readonly schemaVersion: typeof W24_EVENT_SCHEMA_VERSION;
  readonly timestampUtc: string;
  readonly component: W24Component;
  readonly operation: W24Operation;
  readonly event: W24EventName;
  readonly actionId: string;
  readonly workId: string;
  readonly attemptId: string;
  readonly outcome: W24Outcome;
  readonly failureCategory: W24FailureCategory | null;
  readonly durationMs: number;
  readonly sequence: number;
}

/**
 * Maps DhanFailureCode and trace rejection into W24FailureCategory.
 * Closed table, unknown → INTERNAL_ERROR. Never raw message.
 */
export function mapDhanFailureToW24Category(code: string): W24FailureCategory {
  switch (code) {
    case 'MISSING_REQUIRED_FIELD':
    case 'MALFORMED_INSTRUMENT_MAPPING':
    case 'MALFORMED_RESPONSE':
    case 'MALFORMED_REQUEST':
    case 'REQUEST_TOO_LARGE':
    case 'CANONICAL_VALIDATION_FAILURE':
      return 'VALIDATION_ERROR';
    case 'AUTHENTICATION_FAILURE':
    case 'UNAUTHENTICATED':
      return 'AUTHENTICATION_FAILED';
    case 'PRODUCTION_NOT_AUTHORIZED':
    case 'UNSUPPORTED_DOMAIN':
    case 'UNSUPPORTED_PRE_ACCESS_OPERATION':
      return 'AUTHORIZATION_FAILED';
    case 'CONFIGURATION_INCOMPLETE':
      return 'CONFIGURATION_ERROR';
    case 'CREDENTIALS_UNAVAILABLE':
    case 'CREDENTIALS_EXPIRED':
    case 'TRANSPORT_TOKEN_MISSING':
    case 'TRANSPORT_TOKEN_NOT_ASCII':
    case 'TRANSPORT_TOKEN_WHITESPACE':
      return 'READINESS_FAILED';
    case 'UNRESOLVED_INSTRUMENT':
    case 'INSTRUMENT_NOT_IN_RESPONSE':
    case 'IDENTITY_RESOLUTION_FAILURE':
    case 'CONFLICTING_INSTRUMENT_MAPPING':
      return 'IDENTITY_REJECTED';
    case 'RATE_LIMITED':
      return 'RATE_LIMITED';
    case 'STALE_DATA_SUPPRESSED':
    case 'EMPTY_HISTORICAL_SERIES':
      return 'CACHE_ERROR';
    case 'TRANSPORT_FAILURE':
    case 'TRANSPORT_NOT_CONFIGURED':
      return 'TRANSPORT_ERROR';
    case 'HTTP_ERROR':
    case 'PROVIDER_STATUS_FAILURE':
    case 'UNSUPPORTED_INTERVAL':
    case 'INVALID_DATE_RANGE':
      return 'PROVIDER_ERROR';
    case 'TIMEOUT':
    case 'REQUEST_TIMEOUT':
      return 'TIMEOUT';
    case 'CONTRACT_MISMATCH':
      return 'CONTRACT_MISMATCH';
    default:
      return 'INTERNAL_ERROR';
  }
}

export function validateDhanDiagnosticEvent(input: unknown): DhanDiagnosticEvent | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const p = input as Record<string, unknown>;
  if (p.schemaVersion !== W24_EVENT_SCHEMA_VERSION) return null;
  if (!isCanonicalIsoUtc(p.timestampUtc)) return null;
  if (typeof p.component !== 'string' || !W24_COMPONENT_SET.has(p.component)) return null;
  if (typeof p.operation !== 'string' || !W24_OPERATION_SET.has(p.operation)) return null;
  if (typeof p.event !== 'string' || !W24_EVENT_SET.has(p.event)) return null;
  if (!isLowercaseUuidV4Strict(p.actionId)) return null;
  if (!isLowercaseUuidV4Strict(p.workId)) return null;
  if (!isLowercaseUuidV4Strict(p.attemptId)) return null;
  if (typeof p.outcome !== 'string' || !W24_OUTCOME_SET.has(p.outcome)) return null;
  if (p.failureCategory !== null && !isW24FailureCategory(p.failureCategory)) return null;
  if (typeof p.durationMs !== 'number' || !Number.isFinite(p.durationMs) || p.durationMs < 0) return null;
  if (!Number.isSafeInteger(p.sequence as number) || (p.sequence as number) < 0) return null;
  // Never allow extra fields: exhaustive allowlist.
  const allowed = new Set([
    'schemaVersion',
    'timestampUtc',
    'component',
    'operation',
    'event',
    'actionId',
    'workId',
    'attemptId',
    'outcome',
    'failureCategory',
    'durationMs',
    'sequence',
  ]);
  if (Object.keys(p).some((k) => !allowed.has(k))) return null;

  const serialized = JSON.stringify(p);
  if (Buffer.byteLength(serialized, 'utf8') > W24_MAX_EVENT_BYTES) return null;

  return Object.freeze({ ...p } as unknown as DhanDiagnosticEvent);
}

export interface DhanDiagnosticRingStats {
  readonly capacity: number;
  readonly size: number;
  readonly evictedCount: number;
  readonly resetCount: number;
  readonly nextSequence: number;
}

export type DhanDiagnosticEventInput = Omit<DhanDiagnosticEvent, 'sequence'>;

/**
 * Bounded in-memory diagnostic ring — oldest eviction, monotonic sequence,
 * 1 KiB ceiling, never persisted, never external sink.
 */
export class DhanDiagnosticRing {
  private readonly buffer: (DhanDiagnosticEvent | undefined)[];
  private head = 0;
  private tail = 0;
  private count = 0;
  private nextSequence = 0;
  private evictedCount = 0;
  private resetCount = 0;

  constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error('diagnostic ring capacity must be a positive integer');
    }
    this.buffer = new Array(capacity);
  }

  /**
   * Records one event, assigning the next monotonic sequence.
   * Drops if serialized size >1 KiB (never trim prohibited value).
   * Never throws, never blocks writer.
   */
  public record(input: DhanDiagnosticEventInput): DhanDiagnosticEvent | null {
    // Validate allowlisted shape before accepting sequence.
    if (
      input.schemaVersion !== W24_EVENT_SCHEMA_VERSION ||
      !isCanonicalIsoUtc(input.timestampUtc) ||
      !W24_COMPONENT_SET.has(input.component) ||
      !W24_OPERATION_SET.has(input.operation) ||
      !W24_EVENT_SET.has(input.event) ||
      !isLowercaseUuidV4Strict(input.actionId) ||
      !isLowercaseUuidV4Strict(input.workId) ||
      !isLowercaseUuidV4Strict(input.attemptId) ||
      !W24_OUTCOME_SET.has(input.outcome) ||
      (input.failureCategory !== null && !isW24FailureCategory(input.failureCategory)) ||
      typeof input.durationMs !== 'number' ||
      !Number.isFinite(input.durationMs) ||
      input.durationMs < 0
    ) {
      return null;
    }

    const event: DhanDiagnosticEvent = Object.freeze({
      ...input,
      sequence: this.nextSequence,
    });

    const serialized = JSON.stringify(event);
    if (Buffer.byteLength(serialized, 'utf8') > W24_MAX_EVENT_BYTES) {
      return null;
    }

    if (this.count === this.capacity) {
      // Evict oldest
      this.buffer[this.head] = undefined;
      this.head = (this.head + 1) % this.capacity;
      this.count -= 1;
      this.evictedCount += 1;
    }

    this.buffer[this.tail] = event;
    this.tail = (this.tail + 1) % this.capacity;
    this.count += 1;
    this.nextSequence += 1;
    return event;
  }

  /**
   * Lists events in insertion order, bounded by limit and sinceSequence.
   * Read-only, never mutates.
   */
  public list(options?: { limit?: number; sinceSequence?: number }): DhanDiagnosticEvent[] {
    const limit =
      typeof options?.limit === 'number' && Number.isFinite(options.limit) && options.limit > 0
        ? Math.min(Math.floor(options.limit), this.capacity)
        : this.capacity;
    const since = options?.sinceSequence;

    const all: DhanDiagnosticEvent[] = [];
    for (let i = 0; i < this.count; i++) {
      const idx = (this.head + i) % this.capacity;
      const ev = this.buffer[idx];
      if (ev) {
        if (since === undefined || ev.sequence >= since) {
          all.push(ev);
        }
      }
    }

    // Return most recent `limit` if more than limit
    if (all.length > limit) {
      return all.slice(all.length - limit);
    }
    return all;
  }

  public getStats(): DhanDiagnosticRingStats {
    return Object.freeze({
      capacity: this.capacity,
      size: this.count,
      evictedCount: this.evictedCount,
      resetCount: this.resetCount,
      nextSequence: this.nextSequence,
    });
  }

  public get isEmpty(): boolean {
    return this.count === 0;
  }

  /** For tests only — clears ring and bumps resetCount */
  public clearForTest(): void {
    for (let i = 0; i < this.capacity; i++) this.buffer[i] = undefined;
    this.head = 0;
    this.tail = 0;
    this.count = 0;
    this.nextSequence = 0;
    this.resetCount += 1;
  }
}
