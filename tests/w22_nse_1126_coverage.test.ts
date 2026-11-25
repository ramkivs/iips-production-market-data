import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseTradingCalendar } from '../src/quality/trading_calendar.js';
import { evaluateFreshness } from '../src/quality/freshness_evaluator.js';

// W06 sub-task D: NSE coverage extended to 2026-11-26 so the next AGI quote/freshness
// measurement can be session-qualified. Local snapshot only; no network access in tests.
const prior = JSON.parse(readFileSync('calendars/ipd-equity-2026.v2026-11-19.2.json', 'utf8'));
const oldest = JSON.parse(readFileSync('calendars/ipd-equity-2026.v2026-11-19.1.json', 'utf8'));
const raw = JSON.parse(readFileSync('calendars/ipd-equity-2026.v2026-11-26.3.json', 'utf8'));
const calendar = parseTradingCalendar(raw);
const priorCalendar = parseTradingCalendar(prior);
const row = (date: string, exchange: 'NSE' | 'BSE' = 'NSE') => calendar.days.find(d => d.exchange === exchange && d.date === date);
// `dayKind`/`evidenceGrade` are snapshot-only metadata, not part of TradingCalendarDay.
type RawDay = { exchange: string; date: string; status: string; dayKind?: string; evidenceGrade?: string; source: string };
const rawRow = (date: string, exchange = 'NSE') => (raw.days as RawDay[]).find(d => d.exchange === exchange && d.date === date)!;
const quote = (timestamp: string, at: string) => evaluateFreshness(timestamp, 'D01_QUOTES', at, { kind: 'QUOTE', calendar, exchange: 'NSE' });
const TARGET = '2026-11-26';

test('W06 D: NSE snapshot .3 validates and extends coverage to 2026-11-26 without touching BSE', () => {
  assert.equal(calendar.version, '2026-11-26.3');
  assert.equal(calendar.days.length, 74);
  assert(Object.isFrozen(calendar.days));
  assert.equal(calendar.days.filter(d => d.exchange === 'NSE').length, 40);
  assert.equal(calendar.days.filter(d => d.exchange === 'BSE').length, 34);
  const nseCoverage = raw.qualification.continuousCoverage.find((c: { exchange: string }) => c.exchange === 'NSE');
  assert.deepEqual(nseCoverage, { exchange: 'NSE', segment: 'NSE_EQ', startDate: '2026-11-01', endDate: '2026-11-26' });
  // BSE qualification and rows are deliberately unchanged by an NSE-only extension.
  const bseCoverage = raw.qualification.continuousCoverage.find((c: { exchange: string }) => c.exchange === 'BSE');
  assert.deepEqual(bseCoverage, { exchange: 'BSE', segment: 'BSE_EQ', startDate: '2026-11-01', endDate: '2026-11-19' });
  assert.deepEqual(raw.days.filter((d: { exchange: string }) => d.exchange === 'BSE'), prior.days.filter((d: { exchange: string }) => d.exchange === 'BSE'));
});

test('W06 D: every prior row survives byte-for-byte, so no evidence is silently rewritten', () => {
  for (const d of prior.days) assert.deepEqual(calendar.days.find(n => n.exchange === d.exchange && n.date === d.date), d);
  for (const d of oldest.days) {
    const found = calendar.days.find(n => n.exchange === d.exchange && n.date === d.date);
    if (found) assert.deepEqual(found, d);
  }
});

test('W06 D: the full 20-26 November gap is explicit, and no weekday is OPEN by inference', () => {
  // The whole gap is materialized as rows; nothing is left to weekday inference.
  for (const day of [20, 21, 22, 23, 24, 25, 26]) {
    const d = row(`2026-11-${day}`); assert(d, `missing row for 2026-11-${day}`);
    assert(['OPEN', 'CLOSED'].includes(d!.status));
  }
  // Sourced holiday is preserved as a closure; weekends follow the accepted weekend rule.
  assert.equal(rawRow('2026-11-24').dayKind, 'EXCHANGE_HOLIDAY');
  assert.equal(row('2026-11-24')!.status, 'CLOSED');
  for (const date of ['2026-11-21', '2026-11-22']) {
    assert.equal(row(date)!.status, 'CLOSED');
    assert.equal(rawRow(date).dayKind, 'ORDINARY_WEEKEND');
  }
  // November 2026 sessions: every OPEN weekday carries a provenance grade, and only the
  // dates with an observed dated report claim that basis.
  const grade = (date: string) => rawRow(date).evidenceGrade;
  assert.equal(grade('2026-11-23'), 'DATED_REPORT_ARTIFACT');
  assert.equal(grade('2026-11-25'), 'DATED_REPORT_ARTIFACT');
  assert.equal(grade('2026-11-20'), 'NOT_A_DECLARED_HOLIDAY_NO_DATED_ARTIFACT_OBSERVED');
  // 26 November is a forward row: its own post-session reports cannot exist at authoring time.
  assert.equal(grade('2026-11-26'), 'NOT_A_DECLARED_HOLIDAY_FORWARD_SESSION');
  assert(rawRow('2026-11-26').source.includes('not yet occurred'));
});

test('W06 D: the 26 November row yields session-qualified freshness instead of missing coverage', () => {
  const at = `${TARGET}T16:37:00+05:30`;
  for (const [asOf, expected] of [
    [`${TARGET}T15:30:00+05:30`, 900],
    [`${TARGET}T15:32:00+05:30`, 780],
    [`${TARGET}T15:34:00+05:30`, 660],
    [`${TARGET}T15:53:00+05:30`, 420],
    [`${TARGET}T15:58:00+05:30`, 120],
  ] as const) {
    const r = quote(asOf, at);
    assert.equal(r.calendarIssue, undefined);
    assert.equal(r.ageSeconds, expected);
    assert.equal(r.quality, 'GOOD');
    // Age freezes at close; a post-close read stays qualified rather than expiring.
    assert.equal(r.sessionState, 'CLOSED');
  }
  // The previous version genuinely could not serve this date; the extension is load-bearing.
  assert.equal(evaluateFreshness(`${TARGET}T15:30:00+05:30`, 'D01_QUOTES', at, { kind: 'QUOTE', calendar: priorCalendar, exchange: 'NSE' }).calendarIssue, 'MISSING_COVERAGE');
});

test('W06 D: a 26 November observation outside a declared interval still fails closed', () => {
  // Pre-open and the 15:35-15:50 transition gap are not sessions. 09:15:00 itself is the
  // declared open and is therefore in-session, so the rejected boundary is 09:14:59.
  for (const asOf of [`${TARGET}T09:00:00+05:30`, `${TARGET}T09:14:59+05:30`, `${TARGET}T15:35:30+05:30`, `${TARGET}T15:40:00+05:30`]) {
    assert.equal(quote(asOf, `${TARGET}T15:41:00+05:30`).calendarIssue, 'INVALID_OBSERVATION', asOf);
  }
  // A stale quote from the preceding session is not silently qualified as current on 26 November.
  const carried = quote('2026-11-25T15:30:00+05:30', `${TARGET}T09:20:00+05:30`);
  assert.notEqual(carried.quality, 'GOOD');
  assert.equal(carried.quality, 'STALE');
});

test('W06 D: extending NSE leaves already-covered NSE assessments unchanged', () => {
  for (const [timestamp, at] of [
    ['2026-11-06T10:29:00Z', '2026-11-08T08:51:00Z'],
    ['2026-11-09T10:29:00Z', '2026-11-11T03:44:00Z'],
    ['2026-11-13T10:29:00Z', '2026-11-15T12:00:00Z'],
    ['2026-11-19T10:00:00Z', '2026-11-19T12:00:00Z'],
  ]) {
    const run = (c: typeof calendar) => {
      const { calendarVersion: _version, ...rest } = evaluateFreshness(timestamp, 'D01_QUOTES', at, { kind: 'QUOTE', calendar: c, exchange: 'NSE' });
      return rest;
    };
    assert.deepEqual(run(calendar), run(priorCalendar));
  }
});
