import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseTradingCalendar, type EquityExchange } from '../src/quality/trading_calendar.js';
import { evaluateFreshness } from '../src/quality/freshness_evaluator.js';
import { freshnessStatus } from '../src/providers/dhan/dhan_freshness_status.js';

const old = JSON.parse(readFileSync('calendars/ipd-equity-2026.v2026-11-19.1.json', 'utf8'));
const raw = JSON.parse(readFileSync('calendars/ipd-equity-2026.v2026-11-19.2.json', 'utf8'));
const calendar = parseTradingCalendar(raw);
const context = { kind: 'QUOTE' as const, calendar, exchange: 'BSE' as const };
const quote = (timestamp: string, at: string) => evaluateFreshness(timestamp, 'D01_QUOTES', at, context);
const daily = (at: string, completed = true) => evaluateFreshness('2026-11-05T18:30:00Z', 'D02_OHLCV', at, { kind: 'DAILY_CLOSE', calendar, exchange: 'BSE', observationDate: '2026-11-06', completed });
const row = (date: string) => calendar.days.find(d => d.exchange === 'BSE' && d.date === date)!;

test('W22 BSE bounded snapshot validates all 19 dates with explicit model provenance, independent of NSE rows', () => {
  assert.equal(calendar.version, '2026-11-19.2');
  assert.equal(calendar.days.length, 68);
  assert.deepEqual(raw.qualification.incompleteExchanges, []);
  assert.deepEqual(raw.qualification.continuousCoverage, ['NSE', 'BSE'].map(exchange => ({ exchange, segment: exchange + '_EQ', startDate: '2026-11-01', endDate: '2026-11-19' })));
  assert(raw.qualification.boundedModel.limitation.includes('not a claim that unread 20260430-18 explicitly states trading weekdays'));
  for (let day = 1; day <= 19; day++) {
    const d = row(`2026-11-${String(day).padStart(2, '0')}`); assert(d);
    assert(['OPEN', 'CLOSED'].includes(d.status));
    if (day !== 8 && day !== 10) {
      assert(d.source.includes('Owner-directed bounded weekday/weekend model'));
      assert(d.source.includes('20251212-8')); assert(!d.source.includes('nseindia'));
    }
  }
  assert(Object.isFrozen(calendar.days));
  // Sourced BSE closures/special session and every NSE row survive byte-for-byte as JSON values.
  for (const d of old.days) assert.deepEqual(calendar.days.find(n => n.exchange === d.exchange && n.date === d.date), d);
  for (const s of raw.sources) assert(/\.(nseindia|bseindia)\.(com|in)$/.test(new URL(s.url).hostname));
});

test('W22 BSE normal weekday: pre-open excluded, active-session thresholds unchanged and deterministic', () => {
  assert.equal(row('2026-11-09').status, 'OPEN');
  for (const seconds of [0, 600, 900, 901, 1800, 1801]) {
    const at = new Date(Date.parse('2026-11-09T04:00:00Z') + seconds * 1000).toISOString();
    const r = quote('2026-11-09T04:00:00Z', at);
    assert.equal(r.ageSeconds, seconds); assert.equal(r.sessionState, 'OPEN');
    assert.equal(r.quality, seconds <= 900 ? 'GOOD' : seconds <= 1800 ? 'STALE' : 'UNAVAILABLE');
    assert.deepEqual(r, quote('2026-11-09T04:00:00Z', at));
  }
  // No quote observed only in pre-open is silently qualified as a regular-session tick.
  assert.equal(quote('2026-11-09T03:35:00Z', '2026-11-09T04:00:00Z').calendarIssue, 'INVALID_OBSERVATION');
});

test('W22 BSE weekday holiday and first trading day after it preserve accumulated age, without reopening reset', () => {
  assert.equal(row('2026-11-10').status, 'CLOSED');
  assert.equal(raw.days.find((d: { exchange: string; date: string }) => d.exchange === 'BSE' && d.date === '2026-11-10').dayKind, 'EXCHANGE_HOLIDAY');
  const observed = '2026-11-09T10:29:00Z';
  for (const at of ['2026-11-09T12:00:00Z', '2026-11-10T06:00:00Z', '2026-11-11T03:44:59Z']) {
    const r = quote(observed, at); assert.equal(r.ageSeconds, 60); assert.equal(r.sessionState, 'CLOSED');
  }
  assert.equal(quote(observed, '2026-11-11T03:45:00Z').ageSeconds, 60);
  assert.equal(quote(observed, '2026-11-11T03:46:00Z').ageSeconds, 120);
});

test('W22 BSE ordinary Saturday/Sunday are explicit closures; November 8 overrides Sunday independently', () => {
  for (const date of ['2026-11-01', '2026-11-07', '2026-11-14', '2026-11-15']) assert.equal(row(date).status, 'CLOSED');
  for (const at of ['2026-11-14T06:00:00Z', '2026-11-15T12:00:00Z', '2026-11-16T03:44:59Z']) assert.equal(quote('2026-11-13T10:29:00Z', at).ageSeconds, 60);
  assert.equal(row('2026-11-08').status, 'OPEN'); assert(row('2026-11-08').source.includes('20261019-9'));
  assert.equal(quote('2026-11-08T08:50:00Z', '2026-11-08T08:51:00Z').ageSeconds, 60);
  assert.equal(quote('2026-11-08T08:50:00Z', '2026-11-08T08:51:00Z').sessionState, 'OPEN');
});

test('W22 BSE valid previous-close-time quote remains usable after market close without becoming an official daily close or live tick', () => {
  const asOf = '2026-11-09T10:00:00Z'; // Actual 15:30 IST quote; no date/price manufacturing.
  const at = '2026-11-09T12:00:00Z';
  const r = quote(asOf, at); assert.equal(r.ageSeconds, 900); assert.equal(r.quality, 'GOOD'); assert.equal(r.sessionState, 'CLOSED');
  const status = freshnessStatus('D01_QUOTES', { state: 'CURRENT', entry: { provenance: { asOf } } }, at, { outcome: 'UNKNOWN', lastFailure: null }, context);
  assert.equal(status.asOf, asOf); assert.equal(status.sessionState, 'CLOSED'); assert.equal(status.eligibleForUse, true);
  assert.equal(status.calendarMode, 'SESSION_CALENDAR_CONFIGURED'); assert.equal(status.calendarAssessment, 'COVERED');
  // Post-close interval is explicit; transition does not advance the clock.
  assert.equal(quote('2026-11-09T10:04:00Z', '2026-11-09T10:15:00Z').ageSeconds, 60);
  assert.equal(quote('2026-11-09T10:04:00Z', '2026-11-09T10:21:00Z').ageSeconds, 120);
});

test('W22 BSE five/six completed-trading-day boundary counts exceptional Sunday but not ordinary weekends/holiday', () => {
  // After Nov 6: Nov 8, 9, 11, 12, 13 = five; Nov 16 = six.
  assert.equal(daily('2026-11-08T10:29:59Z').completedTradingDays, 0);
  assert.equal(daily('2026-11-08T10:30:00Z').completedTradingDays, 1);
  assert.equal(daily('2026-11-10T12:00:00Z').completedTradingDays, 2);
  for (const at of ['2026-11-13T10:30:00Z', '2026-11-15T12:00:00Z', '2026-11-16T10:29:59Z']) assert.equal(daily(at).completedTradingDays, 5);
  assert.equal(daily('2026-11-16T10:30:00Z').completedTradingDays, 6);
  // Evidence count, not an IPD rewrite of IRR IID's five-day allowance. D02 thresholds remain distinct.
  assert.equal(daily('2026-11-08T10:30:00Z').quality, 'GOOD');
  assert.equal(daily('2026-11-09T10:30:00Z').quality, 'STALE');
  assert.equal(daily('2026-11-13T10:30:00Z').quality, 'UNAVAILABLE');
  assert.equal(daily('2026-11-06T08:00:00Z', false).calendarIssue, 'INVALID_OBSERVATION');
});

test('W22 BSE missing dates and unknown rows fail closed, never weekday or elapsed-time fallback', () => {
  for (const at of ['2026-11-20T04:00:00Z', '2026-11-24T12:00:00Z', '2027-01-01T04:00:00Z']) {
    const r = daily(at); assert.equal(r.calendarIssue, 'MISSING_COVERAGE'); assert.equal(r.suppressExecution, true);
  }
  assert.equal(quote('2026-10-30T09:00:00Z', '2026-11-02T04:00:00Z').calendarIssue, 'MISSING_COVERAGE');
  const missing = parseTradingCalendar({ ...raw, days: raw.days.filter((d: { exchange: string; date: string }) => !(d.exchange === 'BSE' && d.date === '2026-11-12')) });
  const unknown = parseTradingCalendar({ ...raw, days: raw.days.map((d: { exchange: string; date: string }) => d.exchange === 'BSE' && d.date === '2026-11-12' ? { ...d, status: 'UNKNOWN', sessions: [] } : d) });
  for (const c of [missing, unknown]) assert.equal(evaluateFreshness('2026-11-11T04:00:00Z', 'D01_QUOTES', '2026-11-13T04:00:00Z', { ...context, calendar: c }).calendarIssue, 'MISSING_COVERAGE');
});

test('W22 NSE rows and freshness are unchanged by BSE-only expansion; BSE decisions require their own explicit rows', () => {
  const prior = parseTradingCalendar(old);
  for (const [timestamp, at] of [
    ['2026-11-06T10:29:00Z', '2026-11-08T08:51:00Z'],
    ['2026-11-09T10:29:00Z', '2026-11-11T03:44:00Z'],
    ['2026-11-13T10:29:00Z', '2026-11-15T12:00:00Z'],
    ['2026-11-13T10:29:00Z', '2026-11-20T04:00:00Z'],
  ]) {
    const run = (c: typeof calendar, exchange: EquityExchange) => {
      const { calendarVersion: _version, ...rest } = evaluateFreshness(timestamp, 'D01_QUOTES', at, { kind: 'QUOTE', calendar: c, exchange }); return rest;
    };
    assert.deepEqual(run(calendar, 'NSE'), run(prior, 'NSE'));
  }
  const bseOnly = parseTradingCalendar({ ...raw, days: raw.days.filter((d: { exchange: string }) => d.exchange === 'BSE') });
  assert.equal(evaluateFreshness('2026-11-09T04:00:00Z', 'D01_QUOTES', '2026-11-09T04:01:00Z', { ...context, calendar: bseOnly }).quality, 'GOOD');
});
