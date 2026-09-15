/**
 * R-2 tests — HISTORICAL BACKFILL (§N "historical backfill", "incremental backfill",
 * "resume/restart"; §I.50–57)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_BACKFILL_YEARS, enumerateDays, planBackfill, runBackfill } from '../src/backfill.js';
import { resolveSyntheticDay } from '../src/fixtures.js';
import { lineage, store } from './helpers.js';

const NOW_MS = Date.parse('2026-01-10T00:00:00Z');

test('§I.51 — the default range is ten years', () => {
  const p = planBackfill({ nowMs: NOW_MS });
  assert.equal(DEFAULT_BACKFILL_YEARS, 10);
  assert.equal(p.requested.from, '2016-01-11');
  assert.equal(p.requested.to, '2026-01-10');
  assert.equal(p.requested.days, enumerateDays('2016-01-11', '2026-01-10').length);
});

test('§I.52 — the ten-year window is NOT hard-coded; it is always overridable', () => {
  assert.equal(planBackfill({ nowMs: NOW_MS, years: 2 }).requested.from, '2024-01-11');
  assert.equal(planBackfill({ nowMs: NOW_MS, years: 1 }).requested.days, 365);
  const explicit = planBackfill({ from: '2020-01-01', to: '2020-01-31' });
  assert.equal(explicit.requested.days, 31, 'explicit from/to must override the default entirely');
});

test('§I.53 — explicit start and end are honoured', () => {
  const p = planBackfill({ from: '2026-01-01', to: '2026-01-08' });
  assert.equal(p.requested.from, '2026-01-01');
  assert.equal(p.requested.to, '2026-01-08');
  assert.equal(p.pendingDays.length, 8);
});

test('§I.53 — an inverted range is refused, not silently swapped', () => {
  assert.throws(() => planBackfill({ from: '2026-02-01', to: '2026-01-01' }), /must not be after/);
});

test('§I.53 — malformed dates are refused', () => {
  assert.throws(() => planBackfill({ from: '01/02/2026', to: '2026-01-08' }), /YYYY-MM-DD/);
});

test('§I.53 — incremental: completed days are excluded from pending', () => {
  const p = planBackfill({ from: '2026-01-01', to: '2026-01-08', completedDays: ['2026-01-01', '2026-01-02'] });
  assert.equal(p.incremental, true);
  assert.equal(p.pendingDays.length, 6);
  assert.equal(p.pendingDays.includes('2026-01-01'), false);
});

test('§I.53 — restart/resume: a partially completed plan resumes where it stopped', () => {
  const full = planBackfill({ from: '2026-01-01', to: '2026-01-08' });
  const done = full.pendingDays.slice(0, 5);
  const resumed = planBackfill({ from: '2026-01-01', to: '2026-01-08', completedDays: done });
  assert.equal(resumed.resumed, true);
  assert.deepEqual(resumed.pendingDays, full.pendingDays.slice(5));
});

test('§I.54 — unavailability is reported SEPARATELY from the requested range', () => {
  const s = store();
  const p = planBackfill({ from: '2026-01-01', to: '2026-01-08' });
  const r = runBackfill({
    plan: p, store: s,
    resolveDay: (d) => resolveSyntheticDay(d),
    lineageFor: (d) => lineage({ dataVersion: `bf-${d}`, asOf: `${d}T16:30:00Z`, ingestionTimestamp: `${d}T18:30:00Z` }),
  });
  assert.equal(r.requested.days, 8);
  // 4 days have no fixture at all (01-01, 01-03, 01-04, 01-08); 3 produce accepted records
  // (01-02, 01-05, 01-06); 01-07 resolves to a source but yields no accepted record because
  // its future-dated row is quarantined. Requested ≠ populated is the point of §I.54.
  assert.equal(r.unavailableDays.length, 4);
  assert.deepEqual(r.unavailableDays, ['2026-01-01', '2026-01-03', '2026-01-04', '2026-01-08']);
  assert.equal(r.populated.days, 3);
  assert.deepEqual(r.populated.dayList, ['2026-01-02', '2026-01-05', '2026-01-06']);
  assert.notEqual(r.requested.days, r.populated.days, 'requested must never be reported as populated');
});

test('§I.55 — coverage is only claimed when populated actually covers requested', () => {
  const s = store();
  const p = planBackfill({ from: '2026-01-01', to: '2026-01-08' });
  const r = runBackfill({
    plan: p, store: s,
    resolveDay: (d) => resolveSyntheticDay(d),
    lineageFor: (d) => lineage({ dataVersion: `bf-${d}`, asOf: `${d}T16:30:00Z`, ingestionTimestamp: `${d}T18:30:00Z` }),
  });
  assert.equal(r.populated.satisfiesRequestedRange, false);
  assert.equal(r.populated.from, '2026-01-02');
  assert.equal(r.populated.to, '2026-01-06');
});

test('§I.55 — a fully populated range reports satisfiesRequestedRange true', () => {
  const s = store();
  const p = planBackfill({ from: '2026-01-02', to: '2026-01-02' });
  const r = runBackfill({
    plan: p, store: s,
    resolveDay: (d) => resolveSyntheticDay(d),
    lineageFor: (d) => lineage({ dataVersion: `bf-${d}`, asOf: `${d}T16:30:00Z`, ingestionTimestamp: `${d}T18:30:00Z` }),
  });
  assert.equal(r.populated.satisfiesRequestedRange, true);
  assert.equal(r.populated.days, 1);
});

test('§I.56 — synthetic usage is surfaced, never hidden', () => {
  const s = store();
  const p = planBackfill({ from: '2026-01-02', to: '2026-01-02' });
  const r = runBackfill({
    plan: p, store: s,
    resolveDay: (d) => resolveSyntheticDay(d),
    lineageFor: (d) => lineage({ dataVersion: `bf-${d}`, asOf: `${d}T16:30:00Z`, ingestionTimestamp: `${d}T18:30:00Z` }),
  });
  assert.equal(r.syntheticUsed, true);
});

test('§I.56 — no synthetic data is substituted for a missing day', () => {
  const s = store();
  const p = planBackfill({ from: '2026-01-03', to: '2026-01-04' });
  const r = runBackfill({
    plan: p, store: s,
    resolveDay: () => null,
    lineageFor: (d) => lineage({ dataVersion: `bf-${d}` }),
  });
  assert.equal(r.populated.days, 0);
  assert.equal(r.unavailableDays.length, 2);
  assert.equal(s.dailyCount(), 0, 'nothing may be invented to fill a gap');
});

test('§F.43 — a resumed backfill does not duplicate already-loaded days', () => {
  const s = store();
  const mk = (days) => runBackfill({
    plan: planBackfill({ from: '2026-01-01', to: '2026-01-08', completedDays: days }),
    store: s,
    resolveDay: (d) => resolveSyntheticDay(d),
    lineageFor: (d) => lineage({ dataVersion: `bf-${d}`, asOf: `${d}T16:30:00Z`, ingestionTimestamp: `${d}T18:30:00Z` }),
  });
  const first = mk([]);
  const afterFirst = s.dailyCount();
  mk(first.populated.dayList);
  assert.equal(s.dailyCount(), afterFirst, 'resume must not add rows for completed days');
});

test('§J — backfill aggregates metrics across days', () => {
  const s = store();
  const p = planBackfill({ from: '2026-01-01', to: '2026-01-08' });
  const r = runBackfill({
    plan: p, store: s,
    resolveDay: (d) => resolveSyntheticDay(d),
    lineageFor: (d) => lineage({ dataVersion: `bf-${d}`, asOf: `${d}T16:30:00Z`, ingestionTimestamp: `${d}T18:30:00Z` }),
  });
  assert.ok(r.metrics.sourceRecordCount >= 4);
  assert.equal(r.metrics.daysPopulated, r.populated.days);
  assert.equal(r.metrics.daysUnavailable, r.unavailableDays.length);
});

test('§I.53 — onProgress observes each day', () => {
  const s = store();
  const seen = [];
  runBackfill({
    plan: planBackfill({ from: '2026-01-01', to: '2026-01-03' }),
    store: s,
    resolveDay: (d) => resolveSyntheticDay(d),
    lineageFor: (d) => lineage({ dataVersion: `bf-${d}`, asOf: `${d}T16:30:00Z`, ingestionTimestamp: `${d}T18:30:00Z` }),
    onProgress: (d) => seen.push(d),
  });
  assert.deepEqual(seen, ['2026-01-01', '2026-01-02', '2026-01-03']);
});
