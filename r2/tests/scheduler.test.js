/**
 * R-2 tests — 15-MINUTE SCHEDULER + RETRY (§N "15-minute scheduler", "failure/retry behavior")
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createScheduler, DEFAULT_RETRY_POLICY } from '../src/scheduler.js';
import { REFRESH_INTERVAL_MS } from '../src/freshness.js';
import { E, providerError } from '../src/errorTaxonomy.js';

const T0 = Date.parse('2026-01-05T09:00:00Z');
const MIN = 60 * 1000;

test('§E.25 — a tick function is required', () => {
  assert.throws(() => createScheduler({}), /§E\.25/);
});

test('§A.8 — the default interval is 15 minutes', () => {
  assert.equal(createScheduler({ tick: () => ({ ok: true }) }).intervalMs, REFRESH_INTERVAL_MS);
});

test('§E.25 — no tick fires before the first interval elapses', () => {
  const s = createScheduler({ tick: () => ({ ok: true }), startMs: T0 });
  assert.equal(s.advanceTo(T0 + 14 * MIN).fired, 0);
  assert.equal(s.history().length, 0);
});

test('§A.8 — exactly one tick fires at the 15-minute boundary', () => {
  let calls = 0;
  const s = createScheduler({ tick: () => { calls += 1; return { ok: true }; }, startMs: T0 });
  const r = s.advanceTo(T0 + 15 * MIN);
  assert.equal(r.fired, 1);
  assert.equal(calls, 1);
  assert.equal(s.history()[0].ok, true);
});

test('§A.8 — three intervals produce exactly three ticks', () => {
  const s = createScheduler({ tick: () => ({ ok: true }), startMs: T0 });
  assert.equal(s.advanceTo(T0 + 45 * MIN).fired, 3);
  assert.equal(s.history().length, 3);
});

test('§Q.89 — a skipped schedule is REPORTED, not silently collapsed into one refresh', () => {
  const s = createScheduler({ tick: () => ({ ok: true }), startMs: T0 });
  const r = s.advanceTo(T0 + 40 * MIN);
  assert.equal(r.fired, 2, 'both boundaries are still fired so state converges');
  assert.equal(r.missed, 1, 'the earlier boundary is flagged as missed');
  assert.equal(s.history()[0].missed, true);
  assert.equal(s.history()[1].missed, false);
});

test('§E.32 — a retryable failure (E4 timeout) is retried up to maxAttempts', () => {
  let calls = 0;
  const s = createScheduler({
    tick: () => { calls += 1; return calls < 3 ? { ok: false, error: providerError(E.E4, { reason: 'timeout' }) } : { ok: true }; },
    startMs: T0,
  });
  const r = s.advanceTo(T0 + 15 * MIN);
  assert.equal(calls, 3);
  assert.equal(r.results[0].ok, true);
  assert.equal(r.results[0].attempts, 3);
});

test('§E.32 — retry exhaustion escalates E4 → E1 (P02:20)', () => {
  const s = createScheduler({
    tick: () => ({ ok: false, error: providerError(E.E4, { reason: 'timeout' }) }),
    startMs: T0,
  });
  const r = s.advanceTo(T0 + 15 * MIN);
  assert.equal(r.results[0].ok, false);
  assert.equal(r.results[0].attempts, DEFAULT_RETRY_POLICY.maxAttempts);
  assert.equal(r.results[0].escalated, true);
  assert.equal(r.results[0].error.code, E.E1);
});

test('§E.32 — E7 rate-limit also escalates to E1 on exhaustion (P02:23)', () => {
  const s = createScheduler({ tick: () => ({ ok: false, error: providerError(E.E7, { reason: 'throttled' }) }), startMs: T0 });
  assert.equal(s.advanceTo(T0 + 15 * MIN).results[0].error.code, E.E1);
});

test('§L.66 — an entitlement failure (E3) is NOT retried; it surfaces immediately', () => {
  let calls = 0;
  const s = createScheduler({
    tick: () => { calls += 1; return { ok: false, error: providerError(E.E3, { reason: 'entitlement expired' }) }; },
    startMs: T0,
  });
  const r = s.advanceTo(T0 + 15 * MIN);
  assert.equal(calls, 1, 'retrying an entitlement failure cannot succeed and would mask a licensing gap');
  assert.equal(r.results[0].error.code, E.E3);
  assert.equal(r.results[0].error.provisioningGated, true);
});

test('§L.66 — an authentication failure (E2) is NOT retried either', () => {
  let calls = 0;
  const s = createScheduler({
    tick: () => { calls += 1; return { ok: false, error: providerError(E.E2, { reason: 'auth' }) }; },
    startMs: T0,
  });
  s.advanceTo(T0 + 15 * MIN);
  assert.equal(calls, 1);
});

test('§E.32 — a malformed response (E5) is not retried', () => {
  let calls = 0;
  const s = createScheduler({
    tick: () => { calls += 1; return { ok: false, error: providerError(E.E5, { reason: 'bad schema' }) }; },
    startMs: T0,
  });
  s.advanceTo(T0 + 15 * MIN);
  assert.equal(calls, 1);
});

test('the retry policy is configurable', () => {
  let calls = 0;
  const s = createScheduler({
    tick: () => { calls += 1; return { ok: false, error: providerError(E.E4, { reason: 'x' }) }; },
    retryPolicy: { maxAttempts: 5, backoffMs: 0 },
    startMs: T0,
  });
  s.advanceTo(T0 + 15 * MIN);
  assert.equal(calls, 5);
});

test('the clock is injected — advancing backwards fires nothing', () => {
  const s = createScheduler({ tick: () => ({ ok: true }), startMs: T0 });
  s.advanceTo(T0 + 15 * MIN);
  const r = s.advanceTo(T0 + 10 * MIN);
  assert.equal(r.fired, 0);
});

test('nextDueAt reports the next boundary', () => {
  const s = createScheduler({ tick: () => ({ ok: true }), startMs: T0 });
  assert.equal(s.nextDueAt(T0), T0 + REFRESH_INTERVAL_MS);
});
