// W06 — offline verifier for the recorded AGI quote observation.
//
// WHAT IT IS: re-derives, from the recorded bytes and the unmodified compiled functions of this
// checkout, every mechanically checkable property of the supplied terminal output. It reads two
// tracked files, opens no socket, reads no credential, touches no database and writes nothing.
//
// WHAT IT IS NOT: it is not the observation. It cannot prove a vendor answered, and it did not
// contact Dhan. It proves only that the transcription is *internally consistent with this
// repository's code* — which is what makes the transcription usable as evidence.
//
// Run from the repository root after `npm run build:tsc`:
//   node evidence/integration/w06-agi-quote-observation-2026-11-25/verify-w06-agi-evidence.mjs
//
// Exit code 0 = every check passed. Non-zero = a check failed and the record must not be relied on.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const read = (p) => readFileSync(here(p));

const EXPECTED = {
  transcriptSha256: 'e11287abe464653a444ae9045be9e0fa51915dc4b9f0d2e014060704e46dc371',
  envelopeSha256: '7658684fe71be35d49077685d44078411fa0a0aad16053dfb28774c37666c98b',
  lineageHash: 'f464ef3b8313b9cd6777e1627a2df8de7b9f7efe269fb02ff816dfebbac047d3',
  envelopeId: 'env-d01-f464ef3b8313b9cd',
  companyId: 'EQ_AGI_IN',
  securityId: 'ISIN:INE415A01038:EQ',
  asOf: '2026-11-25T08:57:35.000Z',
  receivedAt: '2026-11-25T08:58:04.774Z',
  dataVersion: 'v1.0.0-d01-provider-foundation',
  schemaVersion: '2.0.0',
};

const results = [];
const check = (id, description, ok, detail = '') => {
  results.push({ id, description, ok: Boolean(ok), detail });
  return Boolean(ok);
};

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

// ---------------------------------------------------------------- 1. byte-integrity of the record
const transcriptBytes = read('./operator-terminal-output.txt');
const envelopeBytes = read('./agi-quote-envelope.json');

check(
  'V01',
  'the recorded transcript is byte-identical to the bytes this verifier was written against',
  sha256(transcriptBytes) === EXPECTED.transcriptSha256,
  `sha256=${sha256(transcriptBytes)}`
);
check(
  'V02',
  'the recorded response line is byte-identical to its own recorded copy',
  sha256(envelopeBytes) === EXPECTED.envelopeSha256 && transcriptBytes.toString('utf8').split('\n')[2] + '\n' === envelopeBytes.toString('utf8'),
  `sha256=${sha256(envelopeBytes)}`
);

// ------------------------------------------------------ 2. the transcript still says what it claims
const lines = transcriptBytes.toString('utf8').split('\n');
check('V03', 'the transcript declares exactly one request', lines[0] === 'Sending exactly one AGI quote request...', JSON.stringify(lines[0]));
check('V04', 'the recorded HTTP status is 200', lines[1] === 'HTTP Status: 200', JSON.stringify(lines[1]));

let response;
try {
  response = JSON.parse(lines[2]);
  check('V05', 'the response line parses as JSON', true);
} catch (error) {
  check('V05', 'the response line parses as JSON', false, String(error));
  response = null;
}

// --------------------------------------------------- 3. canonical contract, via compiled functions
const dist = (p) => new URL(`../../../dist/src/${p}`, import.meta.url).href;
const { validateMarketQuotePayload, D01_SCHEMA_VERSION } = await import(dist('contracts/d01_quotes.js'));
const { computeLineageHash } = await import(dist('contracts/provenance.js'));
const { buildD114SecurityIdentity, isD114SecurityIdentity } = await import(dist('contracts/types.js'));
const { evaluateFreshness } = await import(dist('quality/freshness_evaluator.js'));

if (response) {
  const envelope = response.envelope ?? {};
  const provenance = envelope.provenance ?? {};
  const payload = envelope.payload ?? {};

  check('V06', 'ok is true and an envelope is present', response.ok === true && envelope.envelopeId !== undefined);
  check('V07', 'domain is D01_QUOTES and mode is SNAPSHOT', envelope.domain === 'D01_QUOTES' && envelope.mode === 'SNAPSHOT',
    `${envelope.domain}/${envelope.mode}`);
  check('V08', 'companyId is EQ_AGI_IN in both envelope and payload', envelope.companyId === EXPECTED.companyId && payload.companyId === EXPECTED.companyId);
  check('V09', 'exchange is NSE, currency is INR, symbol is AGI GREENPAC LIMITED',
    payload.exchange === 'NSE' && payload.currency === 'INR' && payload.symbol === 'AGI GREENPAC LIMITED');
  check('V10', 'bid/ask are supplied positive prices (D-5 shape), not zero and not null',
    payload.bid === 639.55 && payload.ask === 640 && payload.ask >= payload.bid, `bid=${payload.bid} ask=${payload.ask}`);

  // The payload must satisfy the same validator the daemon applies before emitting an envelope.
  const validation = validateMarketQuotePayload(payload);
  check('V11', 'the payload passes the canonical D01 validator at this commit', validation.isValid === true,
    validation.isValid ? 'valid' : JSON.stringify(validation.errors));

  check('V12', 'the emitted schemaVersion equals the D01 schema version at this commit',
    envelope.schemaVersion === D01_SCHEMA_VERSION && D01_SCHEMA_VERSION === EXPECTED.schemaVersion,
    `emitted=${envelope.schemaVersion} repo=${D01_SCHEMA_VERSION}`);

  // Lineage is a pure function of payload + asOf + dataVersion + sourceClassification.
  const recomputed = computeLineageHash(payload, {
    sourceClassification: provenance.sourceClassification,
    asOf: provenance.asOf,
    dataVersion: provenance.dataVersion,
  });
  check('V13', 'the reported lineageHash is the hash of this exact payload/asOf/dataVersion',
    recomputed === provenance.lineageHash && recomputed === EXPECTED.lineageHash, `recomputed=${recomputed}`);
  check('V14', 'the envelopeId is env-d01- plus the first 16 hex of the lineage hash',
    envelope.envelopeId === `env-d01-${provenance.lineageHash.substring(0, 16)}` && envelope.envelopeId === EXPECTED.envelopeId);

  check('V15', 'provenance instants are declared and the vendor asOf precedes receipt',
    provenance.asOf === EXPECTED.asOf && provenance.receivedAt === EXPECTED.receivedAt &&
    Date.parse(provenance.asOf) <= Date.parse(provenance.receivedAt),
    `asOf=${provenance.asOf} receivedAt=${provenance.receivedAt}`);
  check('V16', 'evaluatedAt equals receivedAt and the envelope timestamp equals receivedAt',
    provenance.evaluatedAt === provenance.receivedAt && envelope.timestamp === provenance.receivedAt);
  check('V17', 'vendorTier is the masked commercial tier and dataVersion is unchanged from the foundation constant',
    provenance.vendorTier === 'TIER_2_COMMERCIAL' && provenance.dataVersion === EXPECTED.dataVersion);

  // qualityState is asserted by the normalizer from the same evaluator; re-evaluate at the recorded instant.
  const emission = evaluateFreshness(provenance.asOf, 'D01_QUOTES', provenance.evaluatedAt);
  check('V18', 'qualityState GOOD is what the evaluator produces at the recorded evaluation instant',
    provenance.qualityState === 'GOOD' && emission.quality === 'GOOD',
    `quality=${provenance.qualityState} elapsed=${emission.ageSeconds}s`);
  check('V19', 'the envelope freshness CURRENT agrees with elapsed age under the 900 s D01 window',
    response.freshness === 'CURRENT' && emission.ageSeconds <= 900, `elapsed=${emission.ageSeconds}s`);

  // Recorded explicitly, because it is the distinction this record must not blur.
  check('V20', 'the recorded response contains no /v1/freshness evidence (no cacheState, verdict, timestamps block)',
    response.cacheState === undefined && response.verdict === undefined && response.timestamps === undefined &&
    response.timestampStates === undefined && response.lastRefresh === undefined,
    'the separate freshness observation is NOT in this evidence');

  // The security id the request must have carried, rebuilt from the payload identity components.
  const identity = buildD114SecurityIdentity('INE415A01038', 'EQ');
  check('V21', 'the D114 identity in the registry for this quote is ISIN:INE415A01038:EQ and validates',
    identity !== null && isD114SecurityIdentity(identity) && identity.securityId === EXPECTED.securityId,
    identity?.securityId ?? 'null');

  // The identity must already be a QUALIFIED row of the *tracked* P7 registry, so the quote is
  // attributable to a governed mapping rather than to whatever the payload happens to say.
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(fileURLToPath(new URL('../../../evidence/dhan-p7/qualification-manifest.json', import.meta.url)), 'utf8'));
  } catch {
    manifest = null;
  }
  const qualified = (manifest?.records ?? []).filter(
    (r) => r?.disposition === 'QUALIFIED' && r?.companyId === EXPECTED.companyId &&
      r?.exchange === 'NSE' && r?.mapping?.exchangeSegment === 'NSE_EQ' &&
      r?.isin === 'INE415A01038' && r?.series === 'EQ'
  );
  const row = qualified[0];
  check('V22', 'the tracked P7 registry holds exactly one QUALIFIED NSE row for EQ_AGI_IN/INE415A01038/EQ',
    qualified.length === 1, `qualifiedRows=${qualified.length}`);
  check('V23', 'that registry row matches the quote: symbol, exchange and numeric vendor id 1412',
    row?.mapping?.symbol === payload.symbol && row?.dhanSecurityId === '1412' && row?.mapping?.active === true,
    `symbol=${row?.mapping?.symbol} dhanSecurityId=${row?.dhanSecurityId} active=${row?.mapping?.active}`);
}

// ---- 5. the calendar gap that governs the *next* step (informational for this record, not the quote)
// Repository-verifiable and decisive for the separate freshness observation: the published calendar
// must contain explicit rows for the observation's own IST date, or a session-aware read fails closed.
let calendar = null;
try {
  calendar = JSON.parse(readFileSync(fileURLToPath(new URL('../../../calendars/ipd-equity-2026.v2026-11-19.2.json', import.meta.url)), 'utf8'));
} catch {
  calendar = null;
}
const istDate = (iso) => new Date(Date.parse(iso) + 330 * 60_000).toISOString().slice(0, 10);
const observationIstDate = istDate(EXPECTED.asOf);
const calendarRow = (calendar?.days ?? []).find((d) => d.exchange === 'NSE' && d.date === observationIstDate);
check('V24', 'the published calendar .2 has NO NSE row for the observation date, so a session-aware D01 read of this quote would fail MISSING_COVERAGE',
  calendar !== null && calendarRow === undefined,
  `observationIstDate=${observationIstDate} calendarVersion=${calendar?.version ?? 'unreadable'} row=${calendarRow ? calendarRow.status : 'absent'}`);

// ---- 6. the paired freshness observation, linked by its own recorded bytes
// V24 above records what the calendar *could* not do. The freshness read that was subsequently
// performed is recorded alongside; assert it describes this quote rather than trusting a filename.
let freshness = null;
try {
  freshness = readFileSync(fileURLToPath(new URL('./freshness-observation-output.txt', import.meta.url)), 'utf8');
} catch {
  freshness = null;
}
const fresh = {};
for (const line of (freshness ?? '').split('\n')) {
  const m = /^([A-Za-z]+)\s*: (.*)$/.exec(line);
  if (m) fresh[m[1]] = m[2];
}
const utcRendered = (iso) => {
  const d = new Date(Date.parse(iso));
  const p2 = (n) => String(n).padStart(2, '0');
  return `${p2(d.getUTCDate())}-${p2(d.getUTCMonth() + 1)}-${d.getUTCFullYear()} ` +
    `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}:${p2(d.getUTCSeconds())}`;
};
const quoteProvenance = response?.envelope?.provenance ?? null;
check('V25', 'the paired freshness observation exists and reports on this quote\'s own asOf and receivedAt',
  quoteProvenance !== null && fresh.asOf === utcRendered(quoteProvenance.asOf) &&
  fresh.receivedAt === utcRendered(quoteProvenance.receivedAt),
  `freshness asOf=${fresh.asOf} quote asOf=${quoteProvenance ? utcRendered(quoteProvenance.asOf) : 'n/a'}`);
check('V26', 'that freshness observation is scoped to D01_QUOTES and carries a verdict, which this envelope does not',
  fresh.domain === 'D01_QUOTES' && fresh.verdict !== undefined && response?.verdict === undefined,
  `freshness verdict=${fresh.verdict}`);

// ------------------------------------------------------------------------------------ 4. reporting
const failed = results.filter((r) => !r.ok);
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id}  ${r.description}${r.detail ? `  [${r.detail}]` : ''}`);
}
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length > 0) {
  console.error(`\n${failed.length} check(s) FAILED — do not rely on this record until resolved.`);
  process.exit(1);
}
