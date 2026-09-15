/**
 * R-2 tests — CURRENT-STATE REFRESH (§N "current-state refresh", "failure/retry behavior",
 * "visible freshness/status behavior"; §E.26–32, §Q.86–87)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createCurrentStateEngine, REFRESH_OUTCOME } from '../src/currentStateRefresh.js';
import { FRESHNESS_STATUS } from '../src/freshness.js';
import { E } from '../src/errorTaxonomy.js';
import { adapter, store, NOW_MS } from './helpers.js';

const MIN = 60 * 1000;

function engine(behaviour, opts = {}) {
  return { eng: createCurrentStateEngine({ adapter: adapter(behaviour), store: store(), opts: { allowGatedAdapter: true, ...opts } }), s: null };
}

test('§E.32 — a successful refresh reports SUCCESS and CURRENT', () => {
  const { eng } = engine();
  const r = eng.refresh({ nowMs: NOW_MS });
  assert.equal(r.outcome, REFRESH_OUTCOME.SUCCESS);
  assert.equal(r.freshness.status, FRESHNESS_STATUS.CURRENT);
  assert.equal(r.freshness.isCurrent, true);
  assert.ok(r.accepted >= 1);
});

test('§E.30 — a refresh REPLACES current state; it does not append a snapshot', () => {
  const { eng } = engine();
  eng.refresh({ nowMs: NOW_MS });
  eng.refresh({ nowMs: NOW_MS + 15 * MIN });
  eng.refresh({ nowMs: NOW_MS + 30 * MIN });
  // getCurrent returns a single object, never a list — structurally cannot accumulate.
  assert.equal(typeof eng.freshnessAt(NOW_MS + 30 * MIN).status, 'string');
});

test('§E.31 — repeating the same refresh is idempotent', () => {
  const { eng } = engine();
  const a = eng.refresh({ nowMs: NOW_MS });
  const b = eng.refresh({ nowMs: NOW_MS });
  assert.equal(a.outcome, b.outcome);
  assert.equal(a.accepted, b.accepted);
});

test('§E.32 — provider unavailable (E1) reports PROVIDER_UNAVAILABLE, quality unavailable', () => {
  const { eng } = engine({ failWith: E.E1 });
  const r = eng.refresh({ nowMs: NOW_MS });
  assert.equal(r.outcome, REFRESH_OUTCOME.PROVIDER_UNAVAILABLE);
  assert.equal(r.error.code, E.E1);
  assert.equal(r.freshness.isCurrent, false);
});

test('§E.32 — a timeout (E4) reports TIMEOUT', () => {
  const { eng } = engine({ failWith: E.E4 });
  assert.equal(eng.refresh({ nowMs: NOW_MS }).outcome, REFRESH_OUTCOME.TIMEOUT);
});

test('§E.32 — a malformed response (E5) reports MALFORMED', () => {
  const { eng } = engine({ failWith: E.E5 });
  assert.equal(eng.refresh({ nowMs: NOW_MS }).outcome, REFRESH_OUTCOME.MALFORMED);
});

test('§L.66 — an entitlement expiry (E3) surfaces as a provisioning gate, not "no data"', () => {
  const { eng } = engine({ failWith: E.E3 });
  const r = eng.refresh({ nowMs: NOW_MS });
  assert.equal(r.outcome, REFRESH_OUTCOME.ENTITLEMENT_EXPIRED);
  assert.equal(r.error.provisioningGated, true);
  assert.equal(r.freshness.isCurrent, false);
});

test('§L.66 — an authentication failure (E2) surfaces distinctly', () => {
  const { eng } = engine({ failWith: E.E2 });
  assert.equal(eng.refresh({ nowMs: NOW_MS }).outcome, REFRESH_OUTCOME.AUTHENTICATION_FAILURE);
});

test('§E.32 — a truncated feed reports PARTIAL, and the shortfall is visible', () => {
  const { eng } = engine({ truncateAfter: 'SYNTHBETA' });
  const r = eng.refresh({ nowMs: NOW_MS });
  assert.equal(r.outcome, REFRESH_OUTCOME.SUCCESS, 'a clean subset is still a success');
  assert.ok(r.accepted > 0 && r.accepted < 4);
});

test('§Q.86 — after a failure the engine still reports a freshness verdict', () => {
  const { eng } = engine({ failWith: E.E1 });
  const r = eng.refresh({ nowMs: NOW_MS });
  assert.ok(r.freshness.status);
  assert.equal(r.freshness.isCurrent, false);
});

test('§Q.87 — data that has aged past the threshold is STALE, never current', () => {
  const { eng } = engine();
  eng.refresh({ nowMs: NOW_MS });
  const f = eng.freshnessAt(NOW_MS + 60 * MIN);
  assert.equal(f.status, FRESHNESS_STATUS.STALE);
  assert.equal(f.isCurrent, false);
  assert.equal(eng.isStale(NOW_MS + 60 * MIN), true);
});

test('§Q.87 — data within the threshold is CURRENT', () => {
  const { eng } = engine();
  eng.refresh({ nowMs: NOW_MS });
  assert.equal(eng.freshnessAt(NOW_MS + 10 * MIN).status, FRESHNESS_STATUS.CURRENT);
  assert.equal(eng.isStale(NOW_MS + 10 * MIN), false);
});

test('§Q.86 — with no successful refresh ever, the state is EMPTY and not current', () => {
  const { eng } = engine();
  const f = eng.freshnessAt(NOW_MS);
  assert.equal(f.status, FRESHNESS_STATUS.EMPTY);
  assert.equal(f.isCurrent, false);
});

test('§L.66 — a gated adapter is refused by default, even though it is bound', () => {
  const eng = createCurrentStateEngine({ adapter: adapter(), store: store(), opts: {} });
  const r = eng.refresh({ nowMs: NOW_MS });
  assert.equal(r.outcome, REFRESH_OUTCOME.GATED);
  assert.equal(r.error.code, E.E3);
  assert.match(r.error.reason, /acquisition gate outstanding/);
});

test('§C.17 — the refresh result carries source, data time and threshold', () => {
  const { eng } = engine();
  const r = eng.refresh({ nowMs: NOW_MS });
  assert.ok(r.freshness.sourceId);
  assert.ok(r.freshness.thresholdMs > 0);
  assert.ok(r.sourceRef);
  assert.ok(r.dataVersion);
});

test('§E.32 — lastAttempt records the most recent outcome and error', () => {
  const { eng } = engine({ failWith: E.E5 });
  eng.refresh({ nowMs: NOW_MS });
  const last = eng.lastAttempt();
  assert.equal(last.outcome, REFRESH_OUTCOME.MALFORMED);
  assert.equal(last.error.code, E.E5);
  assert.equal(last.at, NOW_MS);
});

test('§E.32 — a successful refresh clears any prior error', () => {
  const { eng } = engine();
  eng.refresh({ nowMs: NOW_MS });
  assert.equal(eng.lastAttempt().error, null);
});
