/**
 * R-2 tests — FRESHNESS / STALENESS (§N "stale-data detection", "freshness calculation"; §Q.86–90)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_STALE_AFTER_INTERVALS, describeState, FRESHNESS_STATUS, REFRESH_INTERVAL_MS,
  staleAfterMs, usability,
} from '../src/freshness.js';

const NOW = Date.parse('2026-01-05T09:15:00Z');
const MIN = 60 * 1000;

test('§A.8 — the accepted refresh interval is 15 minutes', () => {
  assert.equal(REFRESH_INTERVAL_MS, 15 * MIN);
});

test('§Q.88 — the threshold is DERIVED from the interval, not a magic constant', () => {
  assert.equal(staleAfterMs(), REFRESH_INTERVAL_MS * DEFAULT_STALE_AFTER_INTERVALS);
  assert.equal(staleAfterMs(), 30 * MIN);
  assert.equal(staleAfterMs({ refreshIntervalMs: 5 * MIN }), 10 * MIN);
  assert.equal(staleAfterMs({ staleAfterIntervals: 4 }), 60 * MIN);
});

test('§Q.88 — an invalid threshold configuration throws rather than defaulting silently', () => {
  assert.throws(() => staleAfterMs({ refreshIntervalMs: 0 }), /§Q\.88/);
  assert.throws(() => staleAfterMs({ refreshIntervalMs: -1 }), /§Q\.88/);
  assert.throws(() => staleAfterMs({ staleAfterIntervals: 0 }), /§Q\.88/);
});

test('data refreshed 1 minute ago is CURRENT', () => {
  const f = describeState({ lastSuccessfulRefreshMs: NOW - MIN, asOf: '2026-01-05T09:14:00Z', sourceId: 's', hasData: true }, { nowMs: NOW });
  assert.equal(f.status, FRESHNESS_STATUS.CURRENT);
  assert.equal(f.isCurrent, true);
  assert.equal(f.ageMs, MIN);
});

test('§Q.88 — one missed refresh (16 min) is still CURRENT; two (45 min) is STALE', () => {
  const one = describeState({ lastSuccessfulRefreshMs: NOW - 16 * MIN, hasData: true }, { nowMs: NOW });
  assert.equal(one.status, FRESHNESS_STATUS.CURRENT, 'a single missed tick must not flip to stale (§A.8 says *approximately*)');
  const two = describeState({ lastSuccessfulRefreshMs: NOW - 45 * MIN, hasData: true }, { nowMs: NOW });
  assert.equal(two.status, FRESHNESS_STATUS.STALE);
  assert.equal(two.isCurrent, false);
});

test('§Q.87 — a STALE record reports isCurrent false and says it must not be shown as current', () => {
  const f = describeState({ lastSuccessfulRefreshMs: NOW - 60 * MIN, hasData: true }, { nowMs: NOW });
  assert.equal(f.isCurrent, false);
  assert.match(f.reason, /must not be presented as current/);
});

test('§Q.89 — missedRefreshes counts how many intervals were skipped', () => {
  const f = describeState({ lastSuccessfulRefreshMs: NOW - 61 * MIN, hasData: true }, { nowMs: NOW });
  assert.equal(f.missedRefreshes, 3);
});

test('§Q.86 — data with no successful refresh is UNAVAILABLE, not silently current', () => {
  const f = describeState({ lastSuccessfulRefreshMs: null, hasData: true }, { nowMs: NOW });
  assert.equal(f.status, FRESHNESS_STATUS.UNAVAILABLE);
  assert.equal(f.isCurrent, false);
  assert.match(f.reason, /§Q\.86/);
});

test('§Q.86 — no data at all is EMPTY', () => {
  const f = describeState({ hasData: false }, { nowMs: NOW });
  assert.equal(f.status, FRESHNESS_STATUS.EMPTY);
  assert.equal(f.isCurrent, false);
});

test('§C.17 — the freshness view carries source, data time and last refresh', () => {
  const f = describeState(
    { lastSuccessfulRefreshMs: NOW - MIN, asOf: '2026-01-05T09:14:00Z', sourceId: 'r2-reference-file', hasData: true },
    { nowMs: NOW },
  );
  assert.equal(f.sourceId, 'r2-reference-file');
  assert.equal(f.asOf, '2026-01-05T09:14:00Z');
  assert.equal(f.lastSuccessfulRefresh, new Date(NOW - MIN).toISOString());
  assert.equal(f.thresholdMs, 30 * MIN);
});

test('§Q.90 — usability distinguishes current / stale / unusable', () => {
  assert.equal(usability(describeState({ lastSuccessfulRefreshMs: NOW - MIN, hasData: true }, { nowMs: NOW })), 'USABLE_CURRENT');
  assert.equal(usability(describeState({ lastSuccessfulRefreshMs: NOW - 60 * MIN, hasData: true }, { nowMs: NOW })), 'STALE_NOT_CURRENT');
  assert.equal(usability(describeState({ hasData: false }, { nowMs: NOW })), 'NOT_USABLE');
  assert.equal(usability(null), 'NOT_USABLE');
});

test('describeState is pure: the same inputs always give the same output', () => {
  const a = JSON.stringify(describeState({ lastSuccessfulRefreshMs: NOW - 5 * MIN, hasData: true }, { nowMs: NOW }));
  const b = JSON.stringify(describeState({ lastSuccessfulRefreshMs: NOW - 5 * MIN, hasData: true }, { nowMs: NOW }));
  assert.equal(a, b);
});
