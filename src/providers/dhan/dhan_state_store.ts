/**
 * Institutional Investment Platform System (IIPS)
 * Dhan persisted-state wire contract and storage port (W-23)
 *
 * Governed under: AD-12 / AD-17 (zero plaintext) / W-19 / W-25
 *
 * W-23 requires the quote cache, refresh state and observed provider state to survive a
 * daemon restart. The roadmap fixes one constraint that shapes this whole module:
 *
 *   > `src/providers/dhan/**` currently imports nothing from `src/persistence/**` or
 *   > `src/ipc/**`; preserve that by defining a small storage port injected by the daemon
 *   > (or a self-contained local store inside the provider package).
 *
 * So the PORT is declared here, inside the provider package, and depends on nothing. The
 * daemon supplies an implementation. Consequence: this file must never import from
 * `../../persistence/` or `../../ipc/`, and a grep assertion in the W-23 suite enforces it.
 *
 * Two rules that the rest of the module exists to uphold:
 *  1. Restoring state may NEVER invent evidence. Every field is validated against its
 *     declared type, and anything that does not parse makes the whole store CORRUPT rather
 *     than silently admitting a subset (a partial admission is how a cache comes to report
 *     a size it cannot justify).
 *  2. A store outcome may NEVER throw or refuse boot. Absent, corrupt, unreadable and
 *     oversized all degrade to the same externally-visible cold start; only the recorded
 *     reason differs.
 */

import type { CanonicalEnvelope } from '../../contracts/envelope.js';
import type { MarketQuotePayload } from '../../contracts/d01_quotes.js';

/** Schema marker. Any other value is CORRUPT — a future schema must be migrated, not guessed. */
export const DHAN_PERSISTED_STATE_SCHEMA_VERSION = 1 as const;

/**
 * Upper bound on the serialized store, enforced on both read and write.
 *
 * The quote cache is bounded (256 by default) and the file is bounded with it; this cap
 * exists so a substituted or swollen file cannot be turned into an unbounded parse at
 * start-up. 8 MiB comfortably exceeds 256 full quote envelopes.
 */
export const DHAN_PERSISTED_STATE_MAX_BYTES = 8 * 1024 * 1024;

/** One cached quote, with its LRU order preserved so restore does not reshuffle the cache. */
export interface DhanPersistedQuoteEntry {
  readonly key: string;
  readonly envelope: CanonicalEnvelope<MarketQuotePayload>;
  /** 0 = least recently used. Rebuilt in ascending order on load. */
  readonly order: number;
}

/** Last-known refresh outcome for one cache identity, exactly as `RefreshStatus` reports it. */
export interface DhanPersistedRefreshEntry {
  readonly key: string;
  readonly outcome: 'SUCCESS' | 'SKIPPED_FRESH' | 'FAILURE' | 'UNKNOWN';
  readonly lastFailure: { readonly code: 'REFRESH_FAILED'; readonly priorPreserved: boolean } | null;
}

/**
 * Observed provider state as reported history.
 *
 * Deliberately absent: the recorder's monotonic interaction counters and
 * `localReadinessVerified`. Those describe what THIS process did; carrying them across a
 * restart would let a fresh process claim interactions it never performed.
 */
export interface DhanPersistedObservedState {
  readonly lastSuccessAt: string | null;
  readonly lastFailure: { readonly category: string; readonly at: string } | null;
  readonly lastAuthOutcome: string;
  readonly lastLatencyMs: number | null;
  /** The previous process reached the latch. See `restoreObservedState` for what it does with it. */
  readonly authLatched: boolean;
  readonly consecutiveAuthFailures: number;
}

export interface DhanPersistedState {
  readonly schemaVersion: typeof DHAN_PERSISTED_STATE_SCHEMA_VERSION;
  readonly writtenAt: string;
  readonly quotes: readonly DhanPersistedQuoteEntry[];
  readonly refresh: readonly DhanPersistedRefreshEntry[];
  readonly observed: DhanPersistedObservedState | null;
}

/**
 * Why a load did not produce usable state. All four cause the same cold start; they are
 * reported separately so an operator can tell "first ever run" from "your store is broken".
 */
export type DhanStateLoadFailureReason =
  | 'FILE_ABSENT'
  | 'INVALID_JSON'
  | 'SCHEMA_MISMATCH'
  | 'INVALID_SHAPE'
  | 'TOO_LARGE'
  | 'READ_ERROR';

export type DhanStateLoadOutcome =
  | { readonly status: 'ABSENT' }
  | { readonly status: 'CORRUPT'; readonly reason: DhanStateLoadFailureReason }
  | { readonly status: 'LOADED'; readonly state: DhanPersistedState };

export type DhanStateSaveOutcome =
  | { readonly status: 'SAVED'; readonly bytes: number }
  | { readonly status: 'SKIPPED'; readonly reason: 'DISABLED' | 'TOO_LARGE' }
  | { readonly status: 'FAILED'; readonly reason: 'WRITE_ERROR' };

/**
 * The storage seam. Implemented by the daemon (file) and by tests (memory).
 *
 * `save` receives the state already validated and bounded by the service; an implementation
 * is still expected to be atomic (write-temp-then-rename) so a crash cannot truncate the
 * previously good store.
 */
export interface DhanStateStorePort {
  load(): DhanStateLoadOutcome;
  save(state: DhanPersistedState): DhanStateSaveOutcome;
}

// ── Fail-closed parsing ─────────────────────────────────────────────────────

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isIsoInstant = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '' && Number.isFinite(Date.parse(value));

const REFRESH_OUTCOMES = new Set(['SUCCESS', 'SKIPPED_FRESH', 'FAILURE', 'UNKNOWN']);

/**
 * Validates an untrusted store payload.
 *
 * Returns `null` on ANY defect rather than a partial result. That is the deliberate
 * fail-closed direction: a cache that silently drops half its rows still reports a size, and
 * a caller cannot tell that from a genuine cache.
 *
 * The envelope is validated structurally (identity, provenance instants, numeric payload)
 * rather than by re-running the full canonical validator, because the payload was already
 * validated when it was admitted to the cache. Re-validating the quote values here would
 * duplicate `validateMarketQuotePayload` and risk the two drifting apart.
 */
export function parseDhanPersistedState(input: unknown): DhanPersistedState | null {
  if (!isRecord(input)) return null;
  if (input.schemaVersion !== DHAN_PERSISTED_STATE_SCHEMA_VERSION) return null;
  if (!isIsoInstant(input.writtenAt)) return null;
  if (!Array.isArray(input.quotes)) return null;
  if (!Array.isArray(input.refresh)) return null;

  const quotes: DhanPersistedQuoteEntry[] = [];
  const seenKeys = new Set<string>();
  for (const raw of input.quotes) {
    if (!isRecord(raw)) return null;
    if (typeof raw.key !== 'string' || raw.key === '' || raw.key.length > 512) return null;
    if (seenKeys.has(raw.key)) return null;
    seenKeys.add(raw.key);
    if (!Number.isSafeInteger(raw.order) || (raw.order as number) < 0) return null;
    const envelope = parseEnvelope(raw.envelope);
    if (!envelope) return null;
    quotes.push({ key: raw.key, envelope, order: raw.order as number });
  }

  const refresh: DhanPersistedRefreshEntry[] = [];
  const seenRefresh = new Set<string>();
  for (const raw of input.refresh) {
    if (!isRecord(raw)) return null;
    if (typeof raw.key !== 'string' || raw.key === '' || raw.key.length > 512) return null;
    if (seenRefresh.has(raw.key)) return null;
    seenRefresh.add(raw.key);
    if (typeof raw.outcome !== 'string' || !REFRESH_OUTCOMES.has(raw.outcome)) return null;
    let lastFailure: DhanPersistedRefreshEntry['lastFailure'] = null;
    if (raw.lastFailure !== null) {
      if (!isRecord(raw.lastFailure)) return null;
      if (raw.lastFailure.code !== 'REFRESH_FAILED') return null;
      if (typeof raw.lastFailure.priorPreserved !== 'boolean') return null;
      lastFailure = { code: 'REFRESH_FAILED', priorPreserved: raw.lastFailure.priorPreserved };
    }
    refresh.push({
      key: raw.key,
      outcome: raw.outcome as DhanPersistedRefreshEntry['outcome'],
      lastFailure,
    });
  }

  let observed: DhanPersistedObservedState | null = null;
  if (input.observed !== null && input.observed !== undefined) {
    if (!isRecord(input.observed)) return null;
    const o = input.observed;
    if (o.lastSuccessAt !== null && !isIsoInstant(o.lastSuccessAt)) return null;
    if (typeof o.lastAuthOutcome !== 'string' || o.lastAuthOutcome === '') return null;
    if (o.lastAuthOutcome.length > 64) return null;
    if (o.lastLatencyMs !== null && (typeof o.lastLatencyMs !== 'number' || !Number.isFinite(o.lastLatencyMs) || o.lastLatencyMs < 0)) {
      return null;
    }
    if (typeof o.authLatched !== 'boolean') return null;
    if (!Number.isSafeInteger(o.consecutiveAuthFailures) || (o.consecutiveAuthFailures as number) < 0) return null;
    let lastFailure: DhanPersistedObservedState['lastFailure'] = null;
    if (o.lastFailure !== null) {
      if (!isRecord(o.lastFailure)) return null;
      if (typeof o.lastFailure.category !== 'string' || o.lastFailure.category === '' || o.lastFailure.category.length > 64) {
        return null;
      }
      if (!isIsoInstant(o.lastFailure.at)) return null;
      lastFailure = { category: o.lastFailure.category, at: o.lastFailure.at };
    }
    observed = {
      lastSuccessAt: o.lastSuccessAt as string | null,
      lastFailure,
      lastAuthOutcome: o.lastAuthOutcome,
      lastLatencyMs: o.lastLatencyMs as number | null,
      authLatched: o.authLatched,
      consecutiveAuthFailures: o.consecutiveAuthFailures as number,
    };
  }

  return Object.freeze({
    schemaVersion: DHAN_PERSISTED_STATE_SCHEMA_VERSION,
    writtenAt: input.writtenAt,
    quotes: Object.freeze(quotes),
    refresh: Object.freeze(refresh),
    observed: observed ? Object.freeze(observed) : null,
  });
}

/** Structural validation of one cached envelope. Returns `null` if anything is off. */
function parseEnvelope(input: unknown): CanonicalEnvelope<MarketQuotePayload> | null {
  if (!isRecord(input)) return null;
  if (typeof input.envelopeId !== 'string' || input.envelopeId === '') return null;
  if (input.domain !== 'D01_QUOTES') return null;
  if (typeof input.mode !== 'string' || input.mode === '') return null;
  if (typeof input.companyId !== 'string' || input.companyId === '') return null;
  if (input.securityId !== undefined && typeof input.securityId !== 'string') return null;
  if (typeof input.schemaVersion !== 'string' || input.schemaVersion === '') return null;
  if (!isIsoInstant(input.timestamp)) return null;

  const provenance = input.provenance;
  if (!isRecord(provenance)) return null;
  if (typeof provenance.sourceClassification !== 'string' || typeof provenance.vendorTier !== 'string') return null;
  // The three instants freshness reads. `asOf` especially must parse: a cache row whose
  // `asOf` is unusable could only ever be reported UNAVAILABLE, so it is not admitted.
  if (!isIsoInstant(provenance.asOf)) return null;
  if (!isIsoInstant(provenance.receivedAt)) return null;
  if (!isIsoInstant(provenance.evaluatedAt)) return null;
  if (typeof provenance.dataVersion !== 'string' || typeof provenance.lineageHash !== 'string') return null;
  if (typeof provenance.qualityState !== 'string') return null;

  const payload = input.payload;
  if (!isRecord(payload)) return null;
  if (typeof payload.companyId !== 'string' || typeof payload.symbol !== 'string') return null;
  if (payload.exchange !== 'NSE' && payload.exchange !== 'BSE') return null;
  if (payload.currency !== 'INR' && payload.currency !== 'USD') return null;
  for (const field of ['ltp', 'open', 'high', 'low', 'previousClose', 'volume', 'change', 'pctChange'] as const) {
    if (typeof payload[field] !== 'number' || !Number.isFinite(payload[field])) return null;
  }
  for (const field of ['bid', 'ask'] as const) {
    const value = payload[field];
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) return null;
  }

  return input as unknown as CanonicalEnvelope<MarketQuotePayload>;
}

/** A disabled store: used when no state path is configured, so a caller needs no branching. */
export const NOOP_DHAN_STATE_STORE: DhanStateStorePort = Object.freeze({
  load: (): DhanStateLoadOutcome => ({ status: 'ABSENT' }),
  save: (): DhanStateSaveOutcome => ({ status: 'SKIPPED', reason: 'DISABLED' }),
});

/** In-memory store for tests and for a caller that wants persistence without a file. */
export class DhanInMemoryStateStore implements DhanStateStorePort {
  private state: DhanPersistedState | null = null;
  public loadOutcome: DhanStateLoadOutcome | null = null;
  public saveCalls = 0;

  /** Lets a test present an arbitrary outcome — including a corrupt one — without a file. */
  public forceLoadOutcome(outcome: DhanStateLoadOutcome | null): void {
    this.loadOutcome = outcome;
  }

  public load(): DhanStateLoadOutcome {
    if (this.loadOutcome) return this.loadOutcome;
    return this.state ? { status: 'LOADED', state: this.state } : { status: 'ABSENT' };
  }

  public save(state: DhanPersistedState): DhanStateSaveOutcome {
    this.saveCalls += 1;
    this.state = state;
    return { status: 'SAVED', bytes: JSON.stringify(state).length };
  }

  public peek(): DhanPersistedState | null {
    return this.state;
  }
}
