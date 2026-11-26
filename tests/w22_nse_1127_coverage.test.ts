import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseTradingCalendar } from '../src/quality/trading_calendar.js';
import { evaluateFreshness } from '../src/quality/freshness_evaluator.js';

// W06 NSE calendar coverage extension through Friday, 27 November 2026.
// Local snapshots only; no network access in tests.
const sha256File = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');

const V1_PATH = 'calendars/ipd-equity-2026.v2026-11-19.1.json';
const V2_PATH = 'calendars/ipd-equity-2026.v2026-11-19.2.json';
const V3_PATH = 'calendars/ipd-equity-2026.v2026-11-26.3.json';
const V4_PATH = 'calendars/ipd-equity-2026.v2026-11-27.4.json';

const v1 = JSON.parse(readFileSync(V1_PATH, 'utf8'));
const v2 = JSON.parse(readFileSync(V2_PATH, 'utf8'));
const v3 = JSON.parse(readFileSync(V3_PATH, 'utf8'));
const raw = JSON.parse(readFileSync(V4_PATH, 'utf8'));

const calendar = parseTradingCalendar(raw);
const priorV3 = parseTradingCalendar(v3);
const priorV2 = parseTradingCalendar(v2);

const row = (date: string, exchange: 'NSE' | 'BSE' = 'NSE') =>
  calendar.days.find(d => d.exchange === exchange && d.date === date);

type RawDay = {
  exchange: string;
  date: string;
  status: string;
  sessions: { opensAt: string; closesAt: string }[];
  dayKind?: string;
  evidenceGrade?: string;
  description?: string;
  source: string;
};
const rawRow = (date: string, exchange = 'NSE') =>
  (raw.days as RawDay[]).find(d => d.exchange === exchange && d.date === date)!;

const quote = (timestamp: string, at: string, exchange: 'NSE' | 'BSE' = 'NSE') =>
  evaluateFreshness(timestamp, 'D01_QUOTES', at, { kind: 'QUOTE', calendar, exchange });

const TARGET = '2026-11-27';

test('W06 11-27: NSE snapshot .4 validates and extends coverage to 2026-11-27 without touching BSE', () => {
  assert.equal(calendar.schemaVersion, 1);
  assert.equal(calendar.id, 'IPD-EQUITY-2026-BOUNDED');
  assert.equal(calendar.version, '2026-11-27.4');
  assert.equal(calendar.days.length, 75);
  assert(Object.isFrozen(calendar.days));
  assert.equal(calendar.days.filter(d => d.exchange === 'NSE').length, 41);
  assert.equal(calendar.days.filter(d => d.exchange === 'BSE').length, 34);

  const nseCoverage = raw.qualification.continuousCoverage.find((c: { exchange: string }) => c.exchange === 'NSE');
  assert.deepEqual(nseCoverage, { exchange: 'NSE', segment: 'NSE_EQ', startDate: '2026-11-01', endDate: '2026-11-27' });

  // BSE qualification and rows are deliberately unchanged by an NSE-only extension.
  const bseCoverage = raw.qualification.continuousCoverage.find((c: { exchange: string }) => c.exchange === 'BSE');
  assert.deepEqual(bseCoverage, { exchange: 'BSE', segment: 'BSE_EQ', startDate: '2026-11-01', endDate: '2026-11-19' });
  assert.deepEqual(
    raw.days.filter((d: { exchange: string }) => d.exchange === 'BSE'),
    v2.days.filter((d: { exchange: string }) => d.exchange === 'BSE')
  );
  assert.deepEqual(
    raw.days.filter((d: { exchange: string }) => d.exchange === 'BSE'),
    v3.days.filter((d: { exchange: string }) => d.exchange === 'BSE')
  );
});

test('W06 11-27: immutable snapshots .1/.2/.3 and all 74 prior rows survive byte-for-byte', () => {
  assert.equal(sha256File(V1_PATH), '56a39d28f7d3d0883eb7d432758d2948d1be131b75a1e3c457ca11eb21f5e345');
  assert.equal(sha256File(V2_PATH), 'b7cc69ddbffd826d7bf37f42a3fae1e8c9f1a65964f13fe6a88f3d5994a650ff');
  assert.equal(sha256File(V3_PATH), 'd1749bc09c26cd2f63a1e9208c654735b49e1b93e0a7960e62510116cb24ee43');
  assert.equal(sha256File(V4_PATH), 'cece6d8f657617ca157782271782962c90982d0e7235cf3bc482dad66a50286a');

  for (const d of v3.days) {
    assert.deepEqual(raw.days.find((n: RawDay) => n.exchange === d.exchange && n.date === d.date), d);
  }
  for (const d of v2.days) {
    assert.deepEqual(raw.days.find((n: RawDay) => n.exchange === d.exchange && n.date === d.date), d);
  }
  for (const d of v1.days) {
    const found = raw.days.find((n: RawDay) => n.exchange === d.exchange && n.date === d.date);
    if (found) assert.deepEqual(found, d);
  }
  // All 22 prior source entries from .3 are preserved verbatim at the prefix of sources.
  assert.deepEqual(raw.sources.slice(0, v3.sources.length), v3.sources);
  assert(raw.sources.length > v3.sources.length);
});

test('W06 11-27: full 2026-11-01..2026-11-27 NSE continuity and provenance consistency', () => {
  for (let day = 1; day <= 27; day++) {
    const date = `2026-11-${String(day).padStart(2, '0')}`;
    const d = row(date, 'NSE');
    assert(d, `missing NSE row for ${date}`);
    assert(['OPEN', 'CLOSED'].includes(d!.status), `unexpected status for ${date}: ${d!.status}`);
  }

  // Preserved holiday and weekend classifications.
  assert.equal(row('2026-11-24')!.status, 'CLOSED');
  assert.equal(rawRow('2026-11-24').dayKind, 'EXCHANGE_HOLIDAY');
  assert.equal(rawRow('2026-11-24').description, 'Prakash Gurpurb Sri Guru Nanak Dev');
  for (const date of ['2026-11-21', '2026-11-22']) {
    assert.equal(row(date)!.status, 'CLOSED');
    assert.equal(rawRow(date).dayKind, 'ORDINARY_WEEKEND');
    assert.equal(rawRow(date).evidenceGrade, 'WEEKEND_RULE');
  }

  // Preserved prior provenance grades for 20, 23, 25, 26 November.
  assert.equal(rawRow('2026-11-20').evidenceGrade, 'NOT_A_DECLARED_HOLIDAY_NO_DATED_ARTIFACT_OBSERVED');
  assert.equal(rawRow('2026-11-23').evidenceGrade, 'DATED_REPORT_ARTIFACT');
  assert.equal(rawRow('2026-11-25').evidenceGrade, 'DATED_REPORT_ARTIFACT');
  assert.equal(rawRow('2026-11-26').evidenceGrade, 'NOT_A_DECLARED_HOLIDAY_FORWARD_SESSION');

  // New 27 November row: explicit ordinary session intervals and authoritative provenance.
  const nov27 = rawRow(TARGET);
  assert.equal(nov27.status, 'OPEN');
  assert.equal(nov27.dayKind, 'ORDINARY_TRADING_DAY');
  assert.equal(nov27.evidenceGrade, 'NOT_A_DECLARED_HOLIDAY_FORWARD_SESSION');
  assert.deepEqual(nov27.sessions, [
    { opensAt: '2026-11-27T09:15:00+05:30', closesAt: '2026-11-27T15:35:00+05:30' },
    { opensAt: '2026-11-27T15:50:00+05:30', closesAt: '2026-11-27T16:00:00+05:30' },
  ]);
  for (const token of [
    'CMTR71775.pdf',
    'api/holiday-master?type=trading',
    'exchange-communication-holidays',
    'fromDate=01-11-2026&toDate=27-11-2026&dept=CMTR',
    'CML77632.pdf',
    'CML77624.pdf',
    'PR_List_26112026_20261126185758.pdf',
    'CMPT77621.pdf',
    'C_VAR1_27112026_1.DAT',
    'had not yet occurred',
  ]) {
    assert(nov27.source.includes(token), `2026-11-27 source missing expected provenance token: ${token}`);
  }
});

test('W06 11-27: 27 November yields session-qualified freshness and .3/.2 fail closed as MISSING_COVERAGE', () => {
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
    assert.equal(r.sessionState, 'CLOSED');
  }
  // Both .3 and .2 fail closed for 27 November, confirming .4 is load-bearing.
  assert.equal(
    evaluateFreshness(`${TARGET}T15:30:00+05:30`, 'D01_QUOTES', at, { kind: 'QUOTE', calendar: priorV3, exchange: 'NSE' }).calendarIssue,
    'MISSING_COVERAGE'
  );
  assert.equal(
    evaluateFreshness(`${TARGET}T15:30:00+05:30`, 'D01_QUOTES', at, { kind: 'QUOTE', calendar: priorV2, exchange: 'NSE' }).calendarIssue,
    'MISSING_COVERAGE'
  );
});

test('W06 11-27: 27 November outside-session observations and post-coverage dates still fail closed', () => {
  for (const asOf of [
    `${TARGET}T09:00:00+05:30`,
    `${TARGET}T09:14:59+05:30`,
    `${TARGET}T15:35:30+05:30`,
    `${TARGET}T15:40:00+05:30`,
    `${TARGET}T16:00:01+05:30`,
  ]) {
    assert.equal(quote(asOf, `${TARGET}T16:05:00+05:30`).calendarIssue, 'INVALID_OBSERVATION', asOf);
  }
  // Prior-day 26-Nov quote read on 27-Nov morning accumulates open-session seconds into STALE.
  const carried = quote('2026-11-26T15:30:00+05:30', `${TARGET}T09:20:00+05:30`);
  assert.equal(carried.calendarIssue, undefined);
  assert.equal(carried.quality, 'STALE');

  // Uncovered Saturday 28 November remains MISSING_COVERAGE (no weekend/weekday inference).
  assert.equal(
    quote('2026-11-27T15:58:00+05:30', '2026-11-28T10:00:00+05:30').calendarIssue,
    'MISSING_COVERAGE'
  );
});

test('W06 11-27: extending NSE to 2026-11-27 leaves prior NSE and BSE assessments unchanged', () => {
  const cases: readonly [string, string, 'NSE' | 'BSE'][] = [
    ['2026-11-06T10:29:00Z', '2026-11-08T08:51:00Z', 'NSE'],
    ['2026-11-09T10:29:00Z', '2026-11-11T03:44:00Z', 'NSE'],
    ['2026-11-19T10:00:00Z', '2026-11-19T12:00:00Z', 'NSE'],
    ['2026-11-26T15:30:00+05:30', '2026-11-26T16:37:00+05:30', 'NSE'],
    ['2026-11-19T10:00:00Z', '2026-11-19T12:00:00Z', 'BSE'],
  ];
  for (const [timestamp, at, exchange] of cases) {
    const run = (c: typeof calendar) => {
      const { calendarVersion: _version, ...rest } = evaluateFreshness(timestamp, 'D01_QUOTES', at, {
        kind: 'QUOTE',
        calendar: c,
        exchange,
      });
      return rest;
    };
    assert.deepEqual(run(calendar), run(priorV3));
  }
});

test('W06 11-27: chronological ordering and source register integrity', () => {
  for (const exchange of ['BSE', 'NSE'] as const) {
    const dates = (raw.days as RawDay[]).filter(d => d.exchange === exchange).map(d => d.date);
    const sorted = [...dates].sort();
    assert.deepEqual(dates, sorted, `${exchange} days are not chronologically sorted`);
  }
  const sourceIds = new Set<string>();
  for (const s of raw.sources as { id: string; exchange: string; url: string; finding: string; retrievedOn: string }[]) {
    assert(s.id && !sourceIds.has(s.id), `duplicate or empty source id: ${s.id}`);
    sourceIds.add(s.id);
    assert(['NSE', 'BSE'].includes(s.exchange));
    assert(typeof s.url === 'string' && s.url.startsWith('https://'));
    assert(typeof s.finding === 'string' && s.finding.trim().length > 0);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(s.retrievedOn));
  }
});
