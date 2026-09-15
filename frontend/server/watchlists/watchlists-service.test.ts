/**
 * UI07 (D81) — watchlists persistence, membership, triggers and baseline-delta tests.
 *
 * Covers the D81 §12 criteria at the service layer: create/list/delete, membership,
 * persistence, restart/journal reconstruction, tenant isolation, owner scoping,
 * cross-tenant denial, trigger evaluation and baseline/current delta behaviour.
 *
 * Offline and deterministic — node:fs/os/path via the existing PersistenceService only.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PersistenceService } from '../persistence/persistence-service';
import {
  WatchlistValidationError,
  addItem,
  createWatchlist,
  deleteWatchlist,
  evaluateItem,
  listWatchlists,
  readWatchlist,
  removeItem,
  resetWatchlistsPersistence,
  validateTriggers,
} from './watchlists-service';

const TENANT_A = 'tenant-A';
const TENANT_B = 'tenant-B';
const OWNER_1 = 'user-1';
const OWNER_2 = 'user-2';

/** A governed row shaped exactly like `deriveScreenerUniverse` output. */
const ROW = Object.freeze({
  canonicalSecurityId: 'Banking',
  companyId: 'Banking',
  sector: 'Banking',
  verdict: 'BUY',
  composite: 72,
  qualityAxis: 80,
  valuation: 61,
  quality: 'good',
  completenessPct: 100,
  asOf: '2026-08-09T00:00:00.000Z',
});

const FIELDS = ['composite', 'qualityAxis', 'valuation'] as const;

let dataDir: string;
const svc = () => new PersistenceService({ dataDir });

beforeEach(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui07-watchlists-'));
  resetWatchlistsPersistence();
});
afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  resetWatchlistsPersistence();
});

describe('UI07 — create / list / delete', () => {
  it('creates a watchlist and lists it', () => {
    const s = svc();
    const wl = createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'Core banks', s);
    expect(wl.watchlistId).toBe('wl-1');
    expect(wl.name).toBe('Core banks');
    expect(listWatchlists(TENANT_A, OWNER_1, s)).toHaveLength(1);
  });

  it('defaults the name to the id when omitted', () => {
    expect(createWatchlist(TENANT_A, OWNER_1, 'wl-1', undefined, svc()).name).toBe('wl-1');
  });

  it('rejects an empty watchlistId', () => {
    expect(() => createWatchlist(TENANT_A, OWNER_1, '', 'x', svc())).toThrow(WatchlistValidationError);
  });

  it('rejects a duplicate watchlistId', () => {
    const s = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', s);
    expect(() => createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'b', s)).toThrow(/watchlist-exists/);
  });

  it('deletes a watchlist and reports unknown deletes as false', () => {
    const s = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', s);
    expect(deleteWatchlist(TENANT_A, OWNER_1, 'wl-1', s)).toBe(true);
    expect(listWatchlists(TENANT_A, OWNER_1, s)).toHaveLength(0);
    expect(deleteWatchlist(TENANT_A, OWNER_1, 'nope', s)).toBe(false);
  });
});

describe('UI07 — membership', () => {
  it('adds an item and captures the governed values as its baseline', () => {
    const s = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', s);
    const wl = addItem(TENANT_A, OWNER_1, 'wl-1', ROW, [], s);
    expect(wl.items).toHaveLength(1);
    expect(wl.items[0].canonicalSecurityId).toBe('Banking');
    expect(wl.items[0].baseline.composite).toBe(72);
    expect(wl.items[0].baselineAsOf).toBe(ROW.asOf);
  });

  it('removes an item and reports unknown removals as false', () => {
    const s = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', s);
    addItem(TENANT_A, OWNER_1, 'wl-1', ROW, [], s);
    expect(removeItem(TENANT_A, OWNER_1, 'wl-1', 'Banking', s)).toBe(true);
    expect(readWatchlist(TENANT_A, OWNER_1, 'wl-1', s)!.items).toHaveLength(0);
    expect(removeItem(TENANT_A, OWNER_1, 'wl-1', 'Banking', s)).toBe(false);
  });

  it('re-adding the same security re-baselines rather than duplicating', () => {
    const s = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', s);
    addItem(TENANT_A, OWNER_1, 'wl-1', ROW, [], s);
    const wl = addItem(TENANT_A, OWNER_1, 'wl-1', { ...ROW, composite: 90 }, [], s);
    expect(wl.items).toHaveLength(1);
    expect(wl.items[0].baseline.composite).toBe(90);
  });

  it('refuses to add to a non-existent watchlist', () => {
    expect(() => addItem(TENANT_A, OWNER_1, 'nope', ROW, [], svc())).toThrow(/watchlist-not-found/);
  });

  it('refuses a row without canonicalSecurityId or asOf — never invents them', () => {
    const s = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', s);
    expect(() => addItem(TENANT_A, OWNER_1, 'wl-1', { asOf: ROW.asOf }, [], s)).toThrow(/canonicalSecurityId-required/);
    expect(() => addItem(TENANT_A, OWNER_1, 'wl-1', { canonicalSecurityId: 'X' }, [], s)).toThrow(/asOf-required/);
  });
});

describe('UI07 — persistence and restart/journal reconstruction', () => {
  it('a watchlist and its members survive a fresh service instance', () => {
    const first = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'Core banks', first);
    addItem(TENANT_A, OWNER_1, 'wl-1', ROW, [{ field: 'composite', op: 'gt', value: 50 }], first);

    // A brand-new instance folds the event log from the journal alone.
    const after = readWatchlist(TENANT_A, OWNER_1, 'wl-1', svc());
    expect(after!.name).toBe('Core banks');
    expect(after!.items).toHaveLength(1);
    expect(after!.items[0].baseline.composite).toBe(72);
    expect(after!.items[0].triggers).toHaveLength(1);
  });

  it('a deletion survives a restart — the list does not resurrect', () => {
    const first = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', first);
    addItem(TENANT_A, OWNER_1, 'wl-1', ROW, [], first);
    deleteWatchlist(TENANT_A, OWNER_1, 'wl-1', first);
    expect(listWatchlists(TENANT_A, OWNER_1, svc())).toHaveLength(0);
  });

  it('an item removal survives a restart', () => {
    const first = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', first);
    addItem(TENANT_A, OWNER_1, 'wl-1', ROW, [], first);
    removeItem(TENANT_A, OWNER_1, 'wl-1', 'Banking', first);
    expect(readWatchlist(TENANT_A, OWNER_1, 'wl-1', svc())!.items).toHaveLength(0);
  });
});

describe('UI07 — tenant isolation and owner scoping', () => {
  it('another tenant sees nothing', () => {
    const s = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', s);
    expect(listWatchlists(TENANT_B, OWNER_1, s)).toHaveLength(0);
    expect(readWatchlist(TENANT_B, OWNER_1, 'wl-1', s)).toBeUndefined();
  });

  it('another owner in the same tenant sees nothing', () => {
    const s = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', s);
    expect(listWatchlists(TENANT_A, OWNER_2, s)).toHaveLength(0);
    expect(readWatchlist(TENANT_A, OWNER_2, 'wl-1', s)).toBeUndefined();
  });

  it('the same watchlistId in two tenants stays independent', () => {
    const s = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'A list', s);
    createWatchlist(TENANT_B, OWNER_1, 'wl-1', 'B list', s);
    addItem(TENANT_A, OWNER_1, 'wl-1', ROW, [], s);
    expect(readWatchlist(TENANT_A, OWNER_1, 'wl-1', s)!.items).toHaveLength(1);
    expect(readWatchlist(TENANT_B, OWNER_1, 'wl-1', s)!.items).toHaveLength(0);
    expect(readWatchlist(TENANT_B, OWNER_1, 'wl-1', s)!.name).toBe('B list');
  });

  it('ignores records written by another consumer of the same journal', () => {
    const s = svc();
    s.append({ tenantId: TENANT_A, ownerUserId: OWNER_1, dedupKey: 'notification\u0000n-1', payload: { kind: 'other' } });
    expect(listWatchlists(TENANT_A, OWNER_1, s)).toHaveLength(0);
  });
});

describe('UI07 — trigger validation and evaluation', () => {
  it('accepts the closed operator set and rejects unknown operators', () => {
    expect(validateTriggers([{ field: 'composite', op: 'gte', value: 10 }])).toHaveLength(1);
    expect(() => validateTriggers([{ field: 'composite', op: 'between', value: 10 }])).toThrow(/invalid-trigger-op/);
  });

  it('requires a numeric threshold except for `changed`', () => {
    expect(() => validateTriggers([{ field: 'composite', op: 'gt', value: 'high' }])).toThrow(/invalid-trigger-value/);
    expect(validateTriggers([{ field: 'composite', op: 'changed' }])[0].value).toBeNull();
  });

  it('evaluates thresholds deterministically against the current governed value', () => {
    const s = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', s);
    const wl = addItem(TENANT_A, OWNER_1, 'wl-1', ROW, [
      { field: 'composite', op: 'gt', value: 50 },
      { field: 'composite', op: 'lt', value: 50 },
    ], s);
    const ev = evaluateItem(wl.items[0], ROW, FIELDS);
    expect(ev.triggers[0].fired).toBe(true);
    expect(ev.triggers[1].fired).toBe(false);
    // Deterministic: identical inputs produce an identical result.
    expect(evaluateItem(wl.items[0], ROW, FIELDS)).toEqual(ev);
  });

  it('NEVER fires a trigger when the governed value is unavailable', () => {
    const s = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', s);
    const wl = addItem(TENANT_A, OWNER_1, 'wl-1', ROW, [{ field: 'composite', op: 'gt', value: 1 }], s);
    const ev = evaluateItem(wl.items[0], undefined, FIELDS);
    expect(ev.triggers[0].fired).toBeNull();
    expect(ev.triggers[0].reason).toMatch(/unavailable/);
  });
});

describe('UI07 — baseline vs current delta (NOT a time series)', () => {
  it('reports zero delta and unchanged against the frozen baseline', () => {
    const s = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', s);
    const wl = addItem(TENANT_A, OWNER_1, 'wl-1', ROW, [], s);
    const ev = evaluateItem(wl.items[0], ROW, FIELDS);
    const composite = ev.deltas.find((d) => d.field === 'composite')!;
    expect(composite.baselineValue).toBe(72);
    expect(composite.currentValue).toBe(72);
    expect(composite.delta).toBe(0);
    expect(composite.changed).toBe(false);
  });

  it('reports a signed delta when the current governed value differs', () => {
    const s = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', s);
    const wl = addItem(TENANT_A, OWNER_1, 'wl-1', ROW, [{ field: 'composite', op: 'changed', value: null }], s);
    const ev = evaluateItem(wl.items[0], { ...ROW, composite: 80 }, FIELDS);
    const composite = ev.deltas.find((d) => d.field === 'composite')!;
    expect(composite.delta).toBe(8);
    expect(composite.changed).toBe(true);
    expect(ev.triggers[0].fired).toBe(true);
  });

  it('never coerces a missing value to 0 — delta is null', () => {
    const s = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', s);
    const wl = addItem(TENANT_A, OWNER_1, 'wl-1', { ...ROW, valuation: null }, [], s);
    const ev = evaluateItem(wl.items[0], { ...ROW, valuation: null }, FIELDS);
    const valuation = ev.deltas.find((d) => d.field === 'valuation')!;
    expect(valuation.baselineValue).toBeNull();
    expect(valuation.delta).toBeNull();
    expect(valuation.changed).toBe(false);
  });

  it('surfaces the current asOf so freshness is explicit', () => {
    const s = svc();
    createWatchlist(TENANT_A, OWNER_1, 'wl-1', 'a', s);
    const wl = addItem(TENANT_A, OWNER_1, 'wl-1', ROW, [], s);
    expect(evaluateItem(wl.items[0], ROW, FIELDS).currentAsOf).toBe(ROW.asOf);
    expect(evaluateItem(wl.items[0], undefined, FIELDS).currentAsOf).toBeNull();
  });
});
