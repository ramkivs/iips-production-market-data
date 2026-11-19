import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseTradingCalendar, type EquityExchange } from '../src/quality/trading_calendar.js';
import { evaluateFreshness } from '../src/quality/freshness_evaluator.js';
import { freshnessStatus } from '../src/providers/dhan/dhan_freshness_status.js';
import { normalizeDhanHistoricalToCandles } from '../src/providers/dhan/dhan_historical_adapter.js';

// Local, real source-derived calendar only. No source/provider/network access during tests.
const raw = JSON.parse(readFileSync('calendars/ipd-equity-2026.v2026-11-19.1.json', 'utf8'));
const calendar = parseTradingCalendar(raw);
const row = (exchange: EquityExchange, date: string) => calendar.days.find(d => d.exchange === exchange && d.date === date);
const quote = (timestamp: string, at: string, exchange: EquityExchange = 'NSE') => evaluateFreshness(timestamp, 'D01_QUOTES', at, { kind: 'QUOTE', calendar, exchange });
const daily = (at: string, exchange: EquityExchange = 'NSE') => evaluateFreshness('2026-11-05T18:30:00Z', 'D02_OHLCV', at, { kind: 'DAILY_CLOSE', calendar, exchange, observationDate: '2026-11-06', completed: true });
const unknown = { outcome: 'UNKNOWN' as const, lastFailure: null };

test('W22 real snapshot validates, pins coverage/version, classifies days and retains official source provenance', () => {
  assert.equal(calendar.schemaVersion, 1);
  assert.equal(calendar.version, '2026-11-19.1');
  assert(Object.isFrozen(calendar.days));
  assert.equal(calendar.days.length, 51);
  assert.deepEqual(raw.qualification.continuousCoverage, [{ exchange: 'NSE', segment: 'NSE_EQ', startDate: '2026-11-01', endDate: '2026-11-19' }]);
  assert.deepEqual(raw.qualification.incompleteExchanges, ['BSE']);
  for (let day = 1; day <= 19; day++) assert(row('NSE', `2026-11-${String(day).padStart(2, '0')}`));
  assert.equal(row('NSE', '2026-11-20'), undefined);
  for (const d of raw.days) {
    assert(['ORDINARY_TRADING_DAY', 'ORDINARY_WEEKEND', 'EXCHANGE_HOLIDAY', 'EXCEPTIONAL_LIVE_SESSION'].includes(d.dayKind));
    assert(d.source.includes('https://'));
  }
  for (const source of raw.sources) {
    assert(['NSE', 'BSE'].includes(source.exchange));
    assert(/\.(?:nseindia|bseindia)\.(?:com|in)$/.test(new URL(source.url).hostname));
    assert(source.publicationDate === null || /^\d{4}-\d{2}-\d{2}$/.test(source.publicationDate));
    assert.equal(source.retrievedOn, '2026-11-19');
  }
  assert.throws(() => parseTradingCalendar({ ...raw, days: [...raw.days, raw.days[0]] }), /DUPLICATE/);
  const open = row('NSE', '2026-11-09')!;
  assert.throws(() => parseTradingCalendar({ ...raw, days: [{ ...open, sessions: [{ opensAt: '2026-11-09T09:15:00', closesAt: '2026-11-09T16:00:00' }] }] }), /INVALID/);
});

test('W22 official annual equity holiday lists and January amendment are closures, not inferred full-year coverage', () => {
  const dates = ['01-15', '01-26', '03-03', '03-26', '03-31', '04-03', '04-14', '05-01', '05-28', '06-26', '09-14', '10-02', '10-20', '11-10', '11-24', '12-25'];
  for (const exchange of ['NSE', 'BSE'] as const) {
    for (const md of dates) {
      const d = row(exchange, `2026-${md}`)!;
      assert.equal(d.status, 'CLOSED'); assert.deepEqual(d.sessions, []);
      assert(d.source.includes(exchange === 'NSE' ? (md === '01-15' ? 'CMTR72260' : 'CMTR71775') : (md === '01-15' ? '20260112-8' : '20251212-8')));
    }
    assert.equal(row(exchange, '2026-01-16'), undefined);
    // Clearing-only holiday must not be silently imported as an equity closure.
    assert.equal(row(exchange, '2026-04-01'), undefined);
  }
});

test('W22 real D01 before open, normal open, after close, holiday and first reopening preserve observation time and thresholds', () => {
  const observed = '2026-11-09T10:29:00Z'; // 15:59 IST, explicit post-close session
  for (const at of ['2026-11-09T12:00:00Z', '2026-11-10T06:00:00Z', '2026-11-11T03:44:59Z']) {
    const r = quote(observed, at);
    assert.equal(r.ageSeconds, 60); assert.equal(r.quality, 'GOOD'); assert.equal(r.sessionState, 'CLOSED');
  }
  assert.equal(quote(observed, '2026-11-11T03:45:00Z').ageSeconds, 60);
  assert.equal(quote(observed, '2026-11-11T03:46:00Z').ageSeconds, 120);
  for (const seconds of [0, 900, 901, 1800, 1801]) {
    const at = new Date(Date.parse('2026-11-11T04:00:00Z') + seconds * 1000).toISOString();
    const r = quote('2026-11-11T04:00:00Z', at);
    assert.equal(r.ageSeconds, seconds);
    assert.equal(r.quality, seconds <= 900 ? 'GOOD' : seconds <= 1800 ? 'STALE' : 'UNAVAILABLE');
    assert.deepEqual(r, quote('2026-11-11T04:00:00Z', at));
  }
});

test('W22 real ordinary weekend and mock-only Saturdays do not age observations or count completed live days', () => {
  assert.equal(row('NSE', '2026-11-07')?.status, 'CLOSED');
  assert(row('NSE', '2026-11-07')?.source.includes('CMTR77334'));
  assert.equal(row('NSE', '2026-11-14')?.status, 'CLOSED');
  assert(row('NSE', '2026-11-14')?.source.includes('CMTR77415'));
  for (const at of ['2026-11-14T06:00:00Z', '2026-11-15T12:00:00Z', '2026-11-16T03:44:00Z']) {
    assert.equal(quote('2026-11-13T10:29:00Z', at).ageSeconds, 60);
    assert.equal(daily(at).completedTradingDays, 5);
  }
});

test('W22 November 8 Sunday cash-equity live session is independently sourced for each venue, not from derivatives', () => {
  for (const exchange of ['NSE', 'BSE'] as const) {
    const d = row(exchange, '2026-11-08')!;
    assert.equal(d.status, 'OPEN');
    assert(d.source.includes(exchange === 'NSE' ? 'CMTR76941' : '20261019-9'));
    assert(!d.source.includes('FAOP76940'));
    assert.deepEqual(d.sessions, [
      { opensAt: '2026-11-08T14:20:00+05:30', closesAt: '2026-11-08T15:35:00+05:30' },
      { opensAt: '2026-11-08T15:50:00+05:30', closesAt: '2026-11-08T16:00:00+05:30' },
    ]);
    const r = quote('2026-11-08T08:50:00Z', '2026-11-08T08:51:00Z', exchange);
    assert.equal(r.ageSeconds, 60); assert.equal(r.sessionState, 'OPEN');
    assert.equal(quote('2026-11-08T10:04:00Z', '2026-11-08T10:15:00Z', exchange).ageSeconds, 60); // transition excluded
  }
  assert.equal(daily('2026-11-08T08:49:59Z').completedTradingDays, 0);
  assert.equal(daily('2026-11-08T10:29:59Z').completedTradingDays, 0);
  assert.equal(daily('2026-11-08T10:30:00Z').completedTradingDays, 1);
});

test('W22 real completed-date count reaches five then six; holiday/weekend excluded, Sunday included, no IID policy change', () => {
  // After Nov 6: Nov 8, 9, 11, 12, 13 = five; Nov 16 = six.
  assert.equal(daily('2026-11-13T10:30:00Z').completedTradingDays, 5);
  assert.equal(daily('2026-11-16T10:29:59Z').completedTradingDays, 5);
  assert.equal(daily('2026-11-16T10:30:00Z').completedTradingDays, 6);
  assert.equal(daily('2026-11-10T12:00:00Z').completedTradingDays, 2);
  // D02 one/two-day runtime contract is deliberately not IRR's inclusive five-day allowance.
  assert.equal(daily('2026-11-08T10:30:00Z').quality, 'GOOD');
  assert.equal(daily('2026-11-09T10:30:00Z').quality, 'STALE');
  assert.equal(daily('2026-11-13T10:30:00Z').quality, 'UNAVAILABLE');
});

test('W22 exchange-specific sparse BSE and outside NSE coverage are unavailable, never cross-venue or weekday fallback', () => {
  assert.equal(row('BSE', '2026-11-09'), undefined);
  assert.equal(quote('2026-11-08T10:29:00Z', '2026-11-09T04:00:00Z', 'BSE').calendarIssue, 'MISSING_COVERAGE');
  assert.equal(daily('2026-11-13T12:00:00Z', 'BSE').calendarIssue, 'MISSING_COVERAGE');
  for (const at of ['2026-11-20T04:00:00Z', '2027-01-01T04:00:00Z']) {
    const r = daily(at); assert.equal(r.calendarIssue, 'MISSING_COVERAGE'); assert.equal(r.suppressExecution, true);
  }
  assert.equal(quote('2026-10-30T09:00:00Z', '2026-11-02T04:00:00Z').calendarIssue, 'MISSING_COVERAGE');
  const c = parseTradingCalendar({ ...raw, days: raw.days.map((d: { exchange: string; date: string }) => d.exchange === 'NSE' && d.date === '2026-11-12' ? { ...d, status: 'UNKNOWN', sessions: [] } : d) });
  assert.equal(evaluateFreshness('2026-11-05T18:30:00Z', 'D02_OHLCV', '2026-11-13T12:00:00Z', { kind: 'DAILY_CLOSE', calendar: c, exchange: 'NSE', observationDate: '2026-11-06', completed: true }).calendarIssue, 'MISSING_COVERAGE');
});

test('W22 missing calendar fallback is explicitly unqualified in IPD status, including fresh legacy observations and empty cache', () => {
  const entry = { provenance: { asOf: '2026-11-09T04:00:00Z' } };
  const legacy = freshnessStatus('D01_QUOTES', { state: 'CURRENT', entry }, '2026-11-09T04:01:00Z', unknown);
  assert.equal(legacy.verdict, 'GOOD'); // Preserve existing elapsed-time contract, but never mislabel it qualified.
  assert.equal(legacy.calendarMode, 'LEGACY_ELAPSED_UNQUALIFIED');
  assert.equal(legacy.calendarAssessment, 'NOT_CONFIGURED'); assert.equal(legacy.ageBasis, undefined);
  assert.equal(freshnessStatus('D01_QUOTES', null, '2026-11-09T04:01:00Z', unknown).calendarMode, 'LEGACY_ELAPSED_UNQUALIFIED');
  const session = { kind: 'QUOTE' as const, calendar, exchange: 'NSE' as const };
  const covered = freshnessStatus('D01_QUOTES', { state: 'CURRENT', entry }, '2026-11-09T04:01:00Z', unknown, session);
  assert.equal(covered.calendarMode, 'SESSION_CALENDAR_CONFIGURED'); assert.equal(covered.calendarAssessment, 'COVERED');
  const missing = freshnessStatus('D01_QUOTES', { state: 'UNAVAILABLE', entry }, '2026-11-20T04:00:00Z', unknown, session);
  assert.equal(missing.calendarAssessment, 'UNAVAILABLE'); assert.equal(missing.calendarIssue, 'MISSING_COVERAGE');
  assert.equal(freshnessStatus('D01_QUOTES', { state: 'UNAVAILABLE', entry: { provenance: { asOf: 'bad' } } }, '2026-11-09T04:01:00Z', unknown, session).calendarAssessment, 'UNAVAILABLE');
  assert.equal(freshnessStatus('D01_QUOTES', null, '2026-11-09T04:01:00Z', unknown, session).calendarAssessment, 'NOT_EVALUATED');
  assert.equal(freshnessStatus('D02_OHLCV', null, '2026-11-09T04:01:00Z', unknown).calendarMode, 'NOT_APPLICABLE');
  assert.equal(freshnessStatus('D02_OHLCV', null, '2026-11-09T04:01:00Z', unknown).verdict, 'UNKNOWN');
});

test('W22 real daily adapter preserves close and provisional current-day exclusion, never substitutes LTP', () => {
  const input = { dto: { timestamp: [Date.parse('2026-11-05T18:30:00Z') / 1000], open: [100], high: [105], low: [99], close: [104], volume: [10] }, mapping: { companyId: 'SYNTH', exchange: 'NSE' as const, symbol: 'SYNTH', exchangeSegment: 'NSE_EQ' as const, dhanSecurityId: '123', mappingProvenance: 'SYNTHETIC_PRE_ACCESS_FIXTURE' as const }, interval: '1D' as const, fromDate: '2026-11-06', toDate: '2026-11-06' };
  const completed = normalizeDhanHistoricalToCandles({ ...input, tradingCalendar: calendar, evaluationTime: '2026-11-13T12:00:00Z' });
  const provisional = normalizeDhanHistoricalToCandles({ ...input, tradingCalendar: calendar, evaluationTime: '2026-11-06T12:00:00Z' });
  assert(completed.ok && provisional.ok);
  assert.equal(completed.value.dailyFreshness?.[0].completedTradingDays, 5);
  assert.equal(provisional.value.dailyFreshness?.[0].calendarIssue, 'INVALID_OBSERVATION');
  assert.deepEqual(completed.value.candles, provisional.value.candles);
  assert.equal(completed.value.candles[0].close, 104);
  assert.equal(completed.value.coverageClaim, 'ACCESS_PENDING_UNVERIFIED');
});
