/**
 * UI07 WATCHLISTS — governed persistent lists, membership, triggers and baseline deltas.
 *
 * Authority: D81-R1 decision A (bounded UI07 recovery), under the D82 recovery adjudication.
 * Requirement: `docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md` **INT-011a** and
 *              `docs/d4/D4_03_UI_BASELINE.md` "UI07 Watchlists — NEW":
 *                required delta  = persistent lists, triggers, score-change detection
 *                validation      = persistence; trigger correctness; freshness
 *                phase/gate      = P13 ONLY (no P10 dependency — unlike UI09 Alerts)
 *
 * ⚠ NotesDrawer is NOT the watchlists implementation. INT-011a records `grep -i watchlist` → 0
 *   hits, evidence status NOT FOUND (positive absence), disposition NEW.
 *
 * PATTERN
 *   Mirrors the D75 saved-screen store and the D80 settings service: a dedicated
 *   `PersistenceService` instance over its own data subdir, tenant+owner supplied by the caller
 *   from the authenticated principal. `persistence-service.ts` is NOT modified.
 *
 * ⚠ APPEND-ONLY EVENT MODEL
 *   `PersistenceService` is an append-only journal whose only mutation primitive is
 *   `updateReadState`, and `append()` de-duplicates. Lists therefore cannot be mutated in place.
 *   Every operation is recorded as an EVENT (`list-created`, `item-added`, `item-removed`,
 *   `list-deleted`) with a unique dedup key, and current state is FOLDED from the event log in
 *   deterministic `seq` order. This preserves the journal's audit semantics — the full history
 *   of a list remains inspectable — and requires no change to the accepted persistence authority.
 *
 * ⚠ SCORE-CHANGE DETECTION — BASELINE vs CURRENT ONLY (D81 §10)
 *   The governed universe derives from the FROZEN v1.1 replay baseline; governed values do not
 *   move because there is no live provider feed (that is R-2, externally blocked). Change
 *   detection is therefore implemented HONESTLY as: the governed value observed when an item was
 *   added is PERSISTED as its baseline, and the surface reports the delta against the current
 *   governed value. NO history is fabricated, NO time series is synthesized, and no live
 *   monitoring is claimed. When R-2 lands this becomes genuinely temporal with no redesign.
 *
 * SECURITY
 *   `PersistenceService` is a library authority, NOT an HTTP/RBAC boundary (TD-2 §5). Tenant and
 *   owner are ALWAYS server-derived by the caller from the authenticated principal and are never
 *   read from a request body or query. Every read is tenant+owner scoped by the service.
 */
import path from 'node:path';
import {
  PersistenceService,
  resolveDataDir,
  type PersistedRecord,
} from '../persistence/persistence-service';

export const WATCHLISTS_DATA_SUBDIR = 'watchlists';

/** Dedup namespace so watchlist events never collide with another consumer's records. */
const EVENT_PREFIX = 'watchlist-event\u0000';

/** Closed trigger operator set. An unknown operator is REJECTED, never coerced. */
export const TRIGGER_OPERATORS = Object.freeze(['gt', 'gte', 'lt', 'lte', 'eq', 'changed'] as const);
export type TriggerOperator = (typeof TRIGGER_OPERATORS)[number];

/** A user-defined deterministic trigger over a governed field. */
export interface WatchlistTrigger {
  readonly field: string;
  readonly op: TriggerOperator;
  /** Threshold; ignored (and may be null) for `changed`, which compares against the baseline. */
  readonly value: number | null;
}

/** A governed item snapshot captured at add-time — the baseline for delta reporting. */
export interface WatchlistItem {
  readonly canonicalSecurityId: string;
  /** Governed values observed when the item was added. NEVER re-derived or invented. */
  readonly baseline: Readonly<Record<string, unknown>>;
  readonly baselineAsOf: string;
  readonly addedAt: string;
  readonly triggers: readonly WatchlistTrigger[];
}

export interface Watchlist {
  readonly watchlistId: string;
  readonly name: string;
  readonly createdAt: string;
  readonly items: readonly WatchlistItem[];
}

type EventKind = 'list-created' | 'item-added' | 'item-removed' | 'list-deleted';

interface WatchlistEvent {
  readonly kind: EventKind;
  readonly watchlistId: string;
  readonly name?: string;
  readonly item?: WatchlistItem;
  readonly canonicalSecurityId?: string;
  readonly at: string;
}

/** Raised on an invalid payload. The caller maps this to 400/422 — never coerced. */
export class WatchlistValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WatchlistValidationError';
  }
}

let persistence: PersistenceService | null = null;

export function resolveWatchlistsDataDir(): string {
  return path.join(resolveDataDir(), WATCHLISTS_DATA_SUBDIR);
}

/** The UI07 PF-1 handle — a SEPARATE PersistenceService instance, mirroring notes/settings. */
export function getWatchlistsPersistence(): PersistenceService {
  if (!persistence) persistence = new PersistenceService({ dataDir: resolveWatchlistsDataDir() });
  return persistence;
}

/** Test/process-boundary seam: drop the cached instance so the next call re-reads the journal. */
export function resetWatchlistsPersistence(): void {
  persistence = null;
}

function isEvent(r: PersistedRecord): boolean {
  return typeof r.dedupKey === 'string' && r.dedupKey.startsWith(EVENT_PREFIX);
}

/**
 * Fold the append-only event log into current state.
 *
 * Deterministic: events are replayed in ascending `seq`, which is the journal's write order.
 * `listOrdered` returns newest-first, so it is reversed here.
 */
function fold(store: PersistenceService, tenantId: string, ownerUserId: string): Map<string, Watchlist> {
  const records = store.listOrdered(tenantId, ownerUserId).filter(isEvent);
  const ordered = [...records].sort((a, b) => a.seq - b.seq);
  const lists = new Map<string, Watchlist>();

  for (const r of ordered) {
    const e = r.payload as WatchlistEvent;
    if (e.kind === 'list-created') {
      if (!lists.has(e.watchlistId)) {
        lists.set(e.watchlistId, { watchlistId: e.watchlistId, name: e.name ?? e.watchlistId, createdAt: e.at, items: [] });
      }
      continue;
    }
    const current = lists.get(e.watchlistId);
    if (!current) continue; // event for an unknown/deleted list — ignored, never resurrected
    if (e.kind === 'list-deleted') {
      lists.delete(e.watchlistId);
    } else if (e.kind === 'item-added' && e.item) {
      // Re-adding the same security replaces its baseline (a deliberate re-baseline).
      const kept = current.items.filter((i) => i.canonicalSecurityId !== e.item!.canonicalSecurityId);
      lists.set(e.watchlistId, { ...current, items: [...kept, e.item] });
    } else if (e.kind === 'item-removed' && e.canonicalSecurityId) {
      lists.set(e.watchlistId, {
        ...current,
        items: current.items.filter((i) => i.canonicalSecurityId !== e.canonicalSecurityId),
      });
    }
  }
  return lists;
}

function appendEvent(
  store: PersistenceService,
  tenantId: string,
  ownerUserId: string,
  event: WatchlistEvent,
): void {
  // A monotonically increasing suffix keeps every event distinct under the dedup contract.
  const seqHint = store.listOrdered(tenantId, ownerUserId).filter(isEvent).length + 1;
  store.append({
    tenantId,
    ownerUserId,
    dedupKey: `${EVENT_PREFIX}${seqHint}\u0000${event.kind}\u0000${event.watchlistId}\u0000${event.canonicalSecurityId ?? ''}`,
    payload: event,
  });
}

function requireNonEmpty(v: unknown, field: string): string {
  if (typeof v !== 'string' || v.trim() === '') throw new WatchlistValidationError(`${field}-required`);
  return v;
}

/** Validate user-defined triggers against the closed operator set. */
export function validateTriggers(input: unknown): readonly WatchlistTrigger[] {
  if (input === undefined || input === null) return Object.freeze([]);
  if (!Array.isArray(input)) throw new WatchlistValidationError('invalid-triggers');
  return Object.freeze(
    input.map((t) => {
      if (t === null || typeof t !== 'object') throw new WatchlistValidationError('invalid-trigger');
      const o = t as Record<string, unknown>;
      const field = requireNonEmpty(o.field, 'trigger-field');
      const op = o.op as TriggerOperator;
      if (!TRIGGER_OPERATORS.includes(op)) throw new WatchlistValidationError('invalid-trigger-op');
      const rawValue = o.value;
      if (op !== 'changed' && typeof rawValue !== 'number') {
        throw new WatchlistValidationError('invalid-trigger-value');
      }
      return Object.freeze({ field, op, value: typeof rawValue === 'number' ? rawValue : null });
    }),
  );
}

// ── Commands ────────────────────────────────────────────────────────────────────────────────

export function listWatchlists(
  tenantId: string,
  ownerUserId: string,
  store: PersistenceService = getWatchlistsPersistence(),
): readonly Watchlist[] {
  return Object.freeze([...fold(store, tenantId, ownerUserId).values()]);
}

export function readWatchlist(
  tenantId: string,
  ownerUserId: string,
  watchlistId: string,
  store: PersistenceService = getWatchlistsPersistence(),
): Watchlist | undefined {
  return fold(store, tenantId, ownerUserId).get(watchlistId);
}

export function createWatchlist(
  tenantId: string,
  ownerUserId: string,
  watchlistId: unknown,
  name: unknown,
  store: PersistenceService = getWatchlistsPersistence(),
  now: string = new Date().toISOString(),
): Watchlist {
  const id = requireNonEmpty(watchlistId, 'watchlistId');
  const label = typeof name === 'string' && name.trim() !== '' ? name : id;
  if (fold(store, tenantId, ownerUserId).has(id)) throw new WatchlistValidationError('watchlist-exists');
  appendEvent(store, tenantId, ownerUserId, { kind: 'list-created', watchlistId: id, name: label, at: now });
  return readWatchlist(tenantId, ownerUserId, id, store)!;
}

export function deleteWatchlist(
  tenantId: string,
  ownerUserId: string,
  watchlistId: string,
  store: PersistenceService = getWatchlistsPersistence(),
  now: string = new Date().toISOString(),
): boolean {
  if (!fold(store, tenantId, ownerUserId).has(watchlistId)) return false;
  appendEvent(store, tenantId, ownerUserId, { kind: 'list-deleted', watchlistId, at: now });
  return true;
}

/**
 * Add a governed row to a list, PERSISTING the observed governed values as the item's baseline.
 *
 * `governedRow` MUST be a real governed row supplied by the caller from the P12 universe. This
 * module never invents item data and never derives a market value of its own.
 */
export function addItem(
  tenantId: string,
  ownerUserId: string,
  watchlistId: string,
  governedRow: Readonly<Record<string, unknown>>,
  triggers: unknown,
  store: PersistenceService = getWatchlistsPersistence(),
  now: string = new Date().toISOString(),
): Watchlist {
  if (!fold(store, tenantId, ownerUserId).has(watchlistId)) throw new WatchlistValidationError('watchlist-not-found');
  if (governedRow === null || typeof governedRow !== 'object') throw new WatchlistValidationError('governed-row-required');
  const canonicalSecurityId = requireNonEmpty(governedRow.canonicalSecurityId, 'canonicalSecurityId');
  const baselineAsOf = requireNonEmpty(governedRow.asOf, 'asOf');

  const item: WatchlistItem = Object.freeze({
    canonicalSecurityId,
    baseline: Object.freeze({ ...governedRow }),
    baselineAsOf,
    addedAt: now,
    triggers: validateTriggers(triggers),
  });
  appendEvent(store, tenantId, ownerUserId, { kind: 'item-added', watchlistId, item, canonicalSecurityId, at: now });
  return readWatchlist(tenantId, ownerUserId, watchlistId, store)!;
}

export function removeItem(
  tenantId: string,
  ownerUserId: string,
  watchlistId: string,
  canonicalSecurityId: string,
  store: PersistenceService = getWatchlistsPersistence(),
  now: string = new Date().toISOString(),
): boolean {
  const list = fold(store, tenantId, ownerUserId).get(watchlistId);
  if (!list || !list.items.some((i) => i.canonicalSecurityId === canonicalSecurityId)) return false;
  appendEvent(store, tenantId, ownerUserId, { kind: 'item-removed', watchlistId, canonicalSecurityId, at: now });
  return true;
}

// ── Baseline/current evaluation ─────────────────────────────────────────────────────────────

export interface FieldDelta {
  readonly field: string;
  readonly baselineValue: number | null;
  readonly currentValue: number | null;
  /** current − baseline; null when either side is non-numeric (never coerced to 0). */
  readonly delta: number | null;
  readonly changed: boolean;
}

export interface TriggerResult {
  readonly field: string;
  readonly op: TriggerOperator;
  readonly value: number | null;
  /** null when the governed value is unavailable — a trigger NEVER fires on missing data. */
  readonly fired: boolean | null;
  readonly reason: string;
}

function numeric(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * Compare an item's persisted baseline with the CURRENT governed row.
 *
 * ⚠ This is baseline-vs-current, NOT a time series. Where the governed universe derives from the
 * frozen v1.1 replay baseline, current == baseline and every delta is legitimately 0/unchanged.
 */
export function evaluateItem(
  item: WatchlistItem,
  currentRow: Readonly<Record<string, unknown>> | undefined,
  fields: readonly string[],
): { readonly deltas: readonly FieldDelta[]; readonly triggers: readonly TriggerResult[]; readonly currentAsOf: string | null } {
  const deltas = fields.map((field) => {
    const baselineValue = numeric(item.baseline[field]);
    const currentValue = currentRow ? numeric(currentRow[field]) : null;
    const delta = baselineValue !== null && currentValue !== null ? currentValue - baselineValue : null;
    return Object.freeze({
      field,
      baselineValue,
      currentValue,
      delta,
      changed: delta !== null ? delta !== 0 : false,
    });
  });

  const triggers = item.triggers.map((t) => {
    const currentValue = currentRow ? numeric(currentRow[t.field]) : null;
    if (currentValue === null) {
      // NS-4 discipline: never fire on unavailable data.
      return Object.freeze({ field: t.field, op: t.op, value: t.value, fired: null, reason: 'governed value unavailable' });
    }
    let fired: boolean;
    if (t.op === 'changed') {
      const baselineValue = numeric(item.baseline[t.field]);
      fired = baselineValue !== null && currentValue !== baselineValue;
    } else if (t.op === 'gt') fired = currentValue > (t.value as number);
    else if (t.op === 'gte') fired = currentValue >= (t.value as number);
    else if (t.op === 'lt') fired = currentValue < (t.value as number);
    else if (t.op === 'lte') fired = currentValue <= (t.value as number);
    else fired = currentValue === (t.value as number);
    return Object.freeze({ field: t.field, op: t.op, value: t.value, fired, reason: 'evaluated against current governed value' });
  });

  return Object.freeze({
    deltas: Object.freeze(deltas),
    currentAsOf: currentRow ? (typeof currentRow.asOf === 'string' ? currentRow.asOf : null) : null,
    triggers: Object.freeze(triggers),
  });
}
