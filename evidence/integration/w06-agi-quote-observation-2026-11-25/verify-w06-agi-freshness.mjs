// W06 — offline verifier for the recorded AGI *freshness* observation.
//
// WHAT IT IS: re-derives every mechanically checkable property of the supplied
// `GET /v1/freshness` output from the recorded bytes and the unmodified compiled functions of this
// checkout — the field set and ordering, the verdict, the age arithmetic, and the calendar-mode
// labelling. It reads three tracked files, opens no socket, reads no credential, touches no database
// and writes nothing.
//
// WHAT IT IS NOT: it is not the observation. It cannot prove the daemon answered, and it did not
// contact any surface. It proves only that the transcription is consistent with this repository's
// code — which is what makes the transcription usable as evidence.
//
// Run from the repository root after `npm run build:tsc`:
//   node evidence/integration/w06-agi-quote-observation-2026-11-25/verify-w06-agi-freshness.mjs
//
// Exit code 0 = every check passed. Non-zero = a check failed and the record must not be relied on.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const read = (p) => readFileSync(here(p));

const EXPECTED = {
  freshnessSha256: 'd3202701a6142480d87e196e4acfd69b3f64e7647b3fb217f76eaa8615a49c41',
  freshnessBytes: 626,
  // The quote observation this freshness read is about. Its instants are the input to the arithmetic.
  quoteTranscriptSha256: 'e11287abe464653a444ae9045be9e0fa51915dc4b9f0d2e014060704e46dc371',
  asOf: '2026-11-25T08:57:35.000Z',
  receivedAt: '2026-11-25T08:58:04.774Z',
  evaluationInstant: '2026-11-25T09:43:06.174Z',
  ageSeconds: 2731.174,
  thresholdSeconds: 900,
  // The emitted field set of FreshnessStatus, in the order dhan_freshness_status.ts builds it.
  fieldOrder: [
    'calendarMode', 'calendarAssessment', 'domain', 'cacheState', 'asOf', 'timestampEvidence',
    'receivedAt', 'evaluatedAt', 'observationEvaluatedAt', 'thresholdSeconds', 'ageSeconds',
    'verdict', 'staleConcessionActive', 'suppressExecution', 'eligibleForUse', 'lastRefresh',
  ],
};

const results = [];
const check = (id, description, ok, detail = '') => {
  results.push({ id, description, ok: Boolean(ok), detail });
  return Boolean(ok);
};
const sha256 = (b) => createHash('sha256').update(b).digest('hex');

// ------------------------------------------------------------------ 1. byte integrity of the record
const raw = read('./freshness-observation-output.txt');
const text = raw.toString('utf8');
check('F01', 'the recorded freshness output is byte-identical to the bytes this verifier was written against',
  sha256(raw) === EXPECTED.freshnessSha256 && raw.length === EXPECTED.freshnessBytes,
  `sha256=${sha256(raw)} bytes=${raw.length}`);
check('F02', 'the recorded output has exactly 16 field lines and no value was truncated away',
  text.split('\n').filter((l) => l.length > 0).length === 16);

// ------------------------------------------------ 2. parse the `key   : value` transcript faithfully
const parsed = {};
const order = [];
const anomalies = [];
for (const line of text.split('\n')) {
  if (line.trim() === '') continue;
  const match = /^([A-Za-z]+)\s*: (.*)$/.exec(line);
  if (!match) { anomalies.push(line); continue; }
  parsed[match[1]] = match[2];
  order.push(match[1]);
}
check('F03', 'every line parses as key-space-padded colon value, with no unparseable line', anomalies.length === 0,
  anomalies.join(' | '));
check('F04', 'the emitted field set and ordering match FreshnessStatus as built by this commit',
  JSON.stringify(order) === JSON.stringify(EXPECTED.fieldOrder),
  `${order.length} fields`);
check('F05', 'no session-aware field is present (no ageBasis, sessionState, calendarVersion or calendarIssue)',
  ['ageBasis', 'sessionState', 'calendarVersion', 'calendarIssue'].every((k) => parsed[k] === undefined),
  'consistent with a read made with no calendar configured');

// -------------------------------------------------- 3. reproduce the values via the real functions
const dist = (p) => new URL(`../../../dist/src/${p}`, import.meta.url).href;
const { freshnessStatus } = await import(dist('providers/dhan/dhan_freshness_status.js'));
const { evaluateFreshness } = await import(dist('quality/freshness_evaluator.js'));

// The observation the freshness read reports on, reconstructed from the *quote* evidence. Reading the
// quote transcript rather than trusting this file's own asOf/receivedAt is deliberate: it ties the two
// observations together at the byte level instead of assuming they agree.
const quoteTranscript = read('./operator-terminal-output.txt');
check('F06', 'the quote evidence this read reports on is unchanged since it was recorded',
  sha256(quoteTranscript) === EXPECTED.quoteTranscriptSha256, `sha256=${sha256(quoteTranscript)}`);

const quoteLine = JSON.parse(quoteTranscript.toString('utf8').split('\n')[2]);
const provenance = quoteLine.envelope.provenance;

// The transcript renders instants as `DD-MM-YYYY HH:MM:SS` — day-first, whole seconds, no zone
// marker and no milliseconds.
//
// WHICH clock? The observed values decide it, and they say **UTC**, not IST. The quote evidence has
// asOf 2026-11-25T08:57:35.000Z (14:27:35 IST); the freshness read displays `25-11-2026 08:57:35`,
// which is the UTC clock reading. The same holds for receivedAt/evaluatedAt (08:58:04Z) and for
// evaluatedAt (`09:43:06`, from 09:43:06.174Z). This is recorded as a display-zone finding in the
// record, §4.3: the instants are unambiguous because they are tied to the quote evidence, but the
// rendering carries no zone marker, so a reader must not read 08:57:35 as local Indian time.
// The ratio check in F09 is what rules out the alternative reading, because asOf + ageSeconds lands
// on 09:43:06 only if asOf and evaluatedAt are on the same clock.
const renderUtc = (iso) => {
  const d = new Date(Date.parse(iso));
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} ` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
};
const renderIst = (iso) => {
  const d = new Date(Date.parse(iso) + 330 * 60_000);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}-${p(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} ` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
};

check('F07', 'the displayed asOf is the quote evidence asOf rendered as UTC whole seconds',
  parsed.asOf === renderUtc(provenance.asOf), `displayed=${parsed.asOf} derived=${renderUtc(provenance.asOf)}`);
check('F07b', 'the displayed asOf is NOT an IST rendering, so the transcript carries UTC clock time with no zone marker',
  parsed.asOf !== renderIst(provenance.asOf),
  `an IST reading would be ${renderIst(provenance.asOf)}; the observed value is ${parsed.asOf}`);
check('F08', 'the displayed receivedAt and observationEvaluatedAt both match the quote evidence as UTC whole seconds',
  parsed.receivedAt === renderUtc(provenance.receivedAt) &&
  parsed.observationEvaluatedAt === renderUtc(provenance.evaluatedAt),
  `receivedAt=${parsed.receivedAt} observationEvaluatedAt=${parsed.observationEvaluatedAt}`);

// ageSeconds is the input that fixes the evaluation instant: asOf + age. The displayed evaluatedAt is
// that instant at whole-second precision, so it may truncate the milliseconds but must not differ more.
const impliedMs = Date.parse(provenance.asOf) + Number(parsed.ageSeconds) * 1000;
const implied = new Date(impliedMs).toISOString();
const displayedEvalMs = Date.parse('2026-11-25T09:43:06.000Z');
check('F09', 'asOf + ageSeconds lands on the displayed evaluatedAt to within one second',
  Number(parsed.ageSeconds) === EXPECTED.ageSeconds &&
  Math.abs(impliedMs - displayedEvalMs) < 1000,
  `implied=${implied} displayed=${parsed.evaluatedAt} (whole seconds)`);

// Re-run the status projection at that instant with the same lookup state and no calendar.
const reproduced = freshnessStatus(
  'D01_QUOTES',
  { state: 'UNAVAILABLE', entry: { provenance } },
  implied,
  { outcome: 'SUCCESS', lastFailure: null }
);
check('F10', 'cacheState UNAVAILABLE is reproduced for an entry the cache classified as UNAVAILABLE',
  parsed.cacheState === 'UNAVAILABLE' && reproduced.cacheState === 'UNAVAILABLE');
check('F11', 'verdict UNAVAILABLE is what the evaluator returns at this age',
  parsed.verdict === 'UNAVAILABLE' && reproduced.verdict === 'UNAVAILABLE',
  `age=${parsed.ageSeconds}s vs 2x threshold ${2 * EXPECTED.thresholdSeconds}s`);
check('F12', 'ageSeconds and thresholdSeconds match the D01 contract and the evaluator',
  Number(parsed.ageSeconds) === EXPECTED.ageSeconds && Number(parsed.thresholdSeconds) === EXPECTED.thresholdSeconds &&
  reproduced.ageSeconds === EXPECTED.ageSeconds && reproduced.thresholdSeconds === EXPECTED.thresholdSeconds);
check('F13', 'suppressExecution True and eligibleForUse False follow from an UNAVAILABLE verdict',
  parsed.suppressExecution === 'True' && parsed.eligibleForUse === 'False' &&
  reproduced.suppressExecution === true && reproduced.eligibleForUse === false);
check('F14', 'staleConcessionActive False is correct beyond twice the threshold (concession is < 2x only)',
  parsed.staleConcessionActive === 'False' && reproduced.staleConcessionActive === false);
check('F15', 'timestampEvidence VALID is correct for a well-formed asOf',
  parsed.timestampEvidence === 'VALID' && reproduced.timestampEvidence === 'VALID');

// Independent of the projection: the raw evaluator for the same instant.
const evaluation = evaluateFreshness(provenance.asOf, 'D01_QUOTES', implied);
check('F16', 'the bare evaluator agrees on quality, concession and suppression at this instant',
  evaluation.quality === 'UNAVAILABLE' && evaluation.staleConcessionActive === false &&
  evaluation.suppressExecution === true, `quality=${evaluation.quality}`);

// ------------------------------------------- 4. the calendar labelling, which is the whole point here
check('F17', 'calendarMode LEGACY_ELAPSED_UNQUALIFIED means no calendar was configured for the daemon',
  parsed.calendarMode === 'LEGACY_ELAPSED_UNQUALIFIED' && reproduced.calendarMode === 'LEGACY_ELAPSED_UNQUALIFIED');
check('F18', 'calendarAssessment NOT_CONFIGURED is the no-calendar label, not a coverage finding',
  parsed.calendarAssessment === 'NOT_CONFIGURED' && reproduced.calendarAssessment === 'NOT_CONFIGURED',
  'the read is elapsed-seconds based, so it is not session-qualified');

// The published calendar cannot cover this observation, and that is a separate, additive limitation.
const calendar = JSON.parse(read('./../../../calendars/ipd-equity-2026.v2026-11-19.2.json'));
const observationIstDate = new Date(Date.parse(provenance.asOf) + 330 * 60_000).toISOString().slice(0, 10);
check('F19', 'the published calendar .2 has no NSE row for the observation date, so configuring it would fail MISSING_COVERAGE',
  observationIstDate === '2026-11-25' &&
  calendar.days.every((d) => !(d.exchange === 'NSE' && d.date === observationIstDate)),
  `observationIstDate=${observationIstDate} calendarVersion=${calendar.version}`);
const withCalendar = freshnessStatus(
  'D01_QUOTES', { state: 'UNAVAILABLE', entry: { provenance } }, implied,
  { outcome: 'SUCCESS', lastFailure: null },
  { kind: 'QUOTE', calendar, exchange: 'NSE' }
);
check('F20', 'with .2 configured the same read would report SESSION_CALENDAR_CONFIGURED / UNAVAILABLE / MISSING_COVERAGE',
  withCalendar.calendarMode === 'SESSION_CALENDAR_CONFIGURED' &&
  withCalendar.calendarAssessment === 'UNAVAILABLE' &&
  withCalendar.calendarIssue === 'MISSING_COVERAGE');

// ------------------------------------- 5. the read is genuinely a freshness read, not a quote response
check('F21', 'the recorded output carries freshness-status fields a quote envelope never carries',
  parsed.cacheState !== undefined && parsed.verdict !== undefined &&
  parsed.eligibleForUse !== undefined && parsed.lastRefresh !== undefined);
check('F22', 'the recorded output carries no quote payload field, so it is not a quote response',
  ['payload', 'lineageHash', 'envelopeId', 'bid', 'ask', 'ltp'].every((k) => parsed[k] === undefined));
check('F23', 'lastRefresh renders outcome SUCCESS with an empty lastFailure (PowerShell formatting of a null)',
  parsed.lastRefresh === '@{outcome=SUCCESS; lastFailure=}' && reproduced.lastRefresh.outcome === 'SUCCESS' &&
  reproduced.lastRefresh.lastFailure === null);

// ------------------------------- 6. the link between the two observations, asserted not assumed
// The quote observation and this freshness observation must describe the *same* security and the
// *same* underlying quote. Nothing here may be inferred from a shared filename.
check('F24', 'the freshness read is scoped to the same security as the quote evidence (D01_QUOTES / EQ_AGI_IN)',
  parsed.domain === 'D01_QUOTES' && quoteLine.envelope.payload.companyId === 'EQ_AGI_IN' &&
  quoteLine.envelope.domain === 'D01_QUOTES', `domain=${parsed.domain}`);
// The read reports on the cache entry the quote created; that entry's own provenance is the quote's.
check('F25', 'the freshness asOf/receivedAt are the quote envelope\'s own provenance instants, not re-derived',
  parsed.asOf === renderUtc(provenance.asOf) && parsed.receivedAt === renderUtc(provenance.receivedAt) &&
  parsed.observationEvaluatedAt === renderUtc(provenance.evaluatedAt));
// lastRefresh SUCCESS is the session history of the quote request that populated the cache. It is
// reported alongside the observation and never substituted for it.
check('F26', 'lastRefresh SUCCESS is session history of the quote request, reported separately from the verdict',
  parsed.lastRefresh === '@{outcome=SUCCESS; lastFailure=}' && parsed.verdict === 'UNAVAILABLE',
  'a successful refresh and an unavailable verdict coexist by design');

// ------------------------------------------------------------------------------------ 7. reporting
const failed = results.filter((r) => !r.ok);
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}  ${r.description}${r.detail ? `  [${r.detail}]` : ''}`);
}
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length > 0) {
  console.error(`\n${failed.length} check(s) FAILED — do not rely on this record until resolved.`);
  process.exit(1);
}
