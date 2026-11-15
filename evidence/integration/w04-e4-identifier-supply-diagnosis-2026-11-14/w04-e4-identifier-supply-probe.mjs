#!/usr/bin/env node
/**
 * W04 - E4: read-only identifier-supply diagnosis (host probe).
 *
 * PURPOSE
 *   For the owner-bound portfolio revision held in one exact W11-DEP1 capture, determine how the
 *   holdings whose D114 `securityIdentity` is null divide by what the committed import input
 *   supplied (ISIN present or absent, exchange present or absent).
 *
 * READ-ONLY
 *   The probe opens files with the 'r' flag only. It imports node:crypto, node:fs and node:path
 *   and nothing else: no network module, no child process, no write, rename, delete or mkdir call.
 *   It does not start, stop or contact IPD or IRR, and it does not open the portfolio database.
 *   Inputs: (1) the exact capture file, (2) the IRR broker-import evidence journal(s),
 *   (3) optionally the tracked P7 qualification manifest in an IPD checkout.
 *
 * SANITIZED OUTPUT
 *   Counts, SHA-256 digests, yes/no answers and values from closed vocabularies only. The probe
 *   never prints a symbol, ISIN, company identifier, file name, tenant or owner identifier,
 *   quantity, price, value, timestamp, directory or file path. Error text is reduced to an error
 *   code and the name of the step that failed.
 *
 * METHOD (sources: IPD frontend/src/features/portfolio/import/broker-holdings-mapper.ts,
 *         IPD src/persistence/brokerImportPersistence.ts, IPD src/contracts/provenance.ts,
 *         IRR frontend/src/api/brokerImportStage4.ts, IRR frontend/server/broker-import/
 *         brokerImportEvidenceStore.ts)
 *   A. Each stored holding carries `lineageDigest` = SHA-256 of
 *        JSON.stringify({symbol, companyId, isin?, exchange?, quantity, averageBuyPrice,
 *        currentPrice, marketValue, weightPercentage, active, sourceBroker, identityStatus,
 *        resolutionDisposition}) + 'UNCLASSIFIED' + importedAt + 'v1.0.0-bi03'.
 *      Every member except `isin` and `exchange` is in the capture. The probe recomputes the
 *      digest under each hypothesis and keeps the hypothesis that reproduces the stored digest.
 *      Hypotheses without an ISIN need no identifier at all. A hypothesis with an ISIN is tested
 *      only with (a) the ISIN of the holding's own stored D114 identity or (b) an ISIN retained in
 *      the evidence-journal record of the SAME import (equal content digest). No identifier is
 *      taken from any other source, none is inferred, and none is written or printed.
 *   B. The import as a whole carries a provenance digest over every holding's symbol, ISIN,
 *      exchange and measures. When step A determined every holding, the probe recomputes it and
 *      compares it with the stored value. Equality proves the reconstruction for the revision.
 *   C. E4 as specified: the evidence-journal record whose `contentDigest` equals the content
 *      digest of the committed import, by exact equality only, and its row counts.
 *
 * EXIT CODES
 *   0  RESULT: COMPLETE      every null-identity holding was assigned an evidenced input class
 *   1  RESULT: PARTIAL       the probe ran; some holdings are undetermined or a check failed
 *   2  RESULT: INCONCLUSIVE  an input was missing or not the expected one; nothing was classified
 *
 * USAGE
 *   node w04-e4-identifier-supply-probe.mjs [--capture <file>] [--data-dir <dir>]...
 *        [--ipd-root <dir>] [--expected-capture-sha256 <hex>]
 */
import { createHash } from 'node:crypto';
import { closeSync, existsSync, openSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const PROBE_VERSION = 'w04-e4-probe/1';

/* ---------------------------------------------------------------- recorded facts */
const RECORDED = Object.freeze({
  captureSha256: 'c5dd51f51025e3e17e3b798164c6b8078fa5487392d8f0dfd96be9bb7c79eda3',
  portfolioId: 'DHAN_PORTFOLIO',
  revision: 1,
  holdings: 64,
  identityObject: 1,
  identityNull: 63,
});
const EXACT_CAPTURE_SCHEMA = 'iips.w11-dep1.owner-bound-portfolio-capture.exact/v1';
const EVIDENCE_SCHEMA = 'IIPS_BROKER_IMPORT_EVIDENCE_V1';
const LOCAL_ONLY_DIRECTORY = 'LOCAL-ONLY-DO-NOT-PUBLISH';
const EXACT_CAPTURE_FILE = 'exact-owner-bound-portfolio-capture.json';
const JOURNAL_FILE = 'journal.ndjson';
const RESET_DIRECTORY = 'broker-evidence-reset';
const MANIFEST_RELATIVE = ['evidence', 'dhan-p7', 'qualification-manifest.json'];
const MANIFEST_SHA256 = '13bd2ef18b3dc79ed3d78e78126c4c4ee431e83665847bcb948f6184e14078bc';
const DEFAULT_DATA_DIR = 'H:\\IIPS\\runtime\\iips-data';

/**
 * Broker files tracked in the two public repositories, as the SHA-256 the import pipeline would
 * record for them: the digest of the UTF-8 text a browser decodes (byte-order mark removed), with
 * the committed LF line endings and with CRLF line endings. Equality with the committed import's
 * content digest is evidence; inequality is not (a re-encoded file has another digest).
 */
const TRACKED_CANDIDATES = Object.freeze([
  { label: 'IRR:evidence/broker-import/operator-supplied/dhan-holdings-withisin.csv',
    lf: '4f035cdf623d9223afdf935cda39faf2d8bc0aa1264daa2954ff691a63fbe237',
    crlf: '4ceb1a93fe0d3ede8365065085bd7e53c898bf4c6c26ab2c98d9e783f531eb5a' },
  { label: 'IRR:evidence/broker-import/operator-supplied/dhan-holdings.csv',
    lf: '5d69ba629f51b3efb3b56c32f85f9c6d4cfa44b125c6a3c1d09e6a4271acc4d7',
    crlf: 'e16281be6c0c99a8e79d8a526034fb838d18615b7935e23d06c5a6af2fcbf42b' },
  { label: 'IRR:evidence/broker-import/operator-supplied/zerodha-holdings.csv',
    lf: '6c74a84ab325817637dad4a5605b614c6da6129860f39bfee897ede5233f82f6',
    crlf: '512da43b96e5c11ee7001ab579cf8d310d7e282c23c3d5adfc45a3949d1e0b65' },
  { label: 'IPD:evidence/operator_drop/wave2-2026-11-06/source.csv',
    lf: '2dc1d1fba6e183cfa657652d0dab98daac570df6e3ef3adbbc8f2a397fcabd0d',
    crlf: '4b5d0934003080065c689157fd80c8080f01422fc7a4124f426a78d9fbba9dac' },
]);

/* Closed vocabularies. A value outside its list is reported as OTHER, never echoed. */
const VOCAB = Object.freeze({
  broker: ['ZERODHA', 'DHAN', 'GROWW', 'GENERIC', 'UNKNOWN'],
  variant: ['DHAN_DETAILED_HOLDINGS_V1', 'DHAN_WEB_UI_SUMMARY_V1'],
  status: ['BLOCKED', 'REJECTED', 'PARSED_IDENTITIES_RESOLVED', 'PARSED_UNRESOLVED'],
  identityStatus: ['RESOLVED', 'UNRESOLVED'],
  resolutionDisposition: ['CANONICAL_P04', 'NON_PRODUCTION_OPERATOR_BYPASS'],
  identityBasis: ['PIPELINE_RESOLVED', 'PIPELINE_ASSESSED_UNRESOLVED', 'PIPELINE_ASSESSED_AMBIGUOUS',
    'PIPELINE_ASSESSED_EXCLUDED', 'FILE_LEVEL_P04_REFUSAL', 'NOT_EVALUATED'],
  refusalCode: ['NO_IDENTIFIER_SUPPLIED', 'IDENTITY_NOT_EVALUATED', 'UNMAPPED_IDENTIFIER', 'AMBIGUOUS_COLLISION',
    'EXPIRED_EFFECTIVE_DATE', 'NO_AUTHORITATIVE_IDENTIFIER_MATCH', 'EXCLUDED_BY_ROW_VALIDATION'],
  semantics: ['SAVED_NEW_BATCH', 'MERGED_INTO_EXISTING'],
  operation: ['INITIAL', 'MERGE', 'REPLACE', 'RESET', 'DELETE'],
  eligibility: ['NO_CAPTURE', 'NOT_EVIDENCE_SYNTHETIC_TEST_PEER', 'NOT_EVIDENCE_NOT_A_WINDOWS_HOST',
    'HOST_CAPTURE_SUBJECT_TO_REVIEW'],
  outcome: ['CONSISTENT_CAPTURE'],
  authority: ['IPD_GOVERNED_D05_SECURITY_MASTER'],
  slot: ['DEFAULT_PORTFOLIO'],
  exchange: ['NSE', 'BSE'],
  isinAuthority: ['NON_AUTHORITATIVE'],
});

/* ---------------------------------------------------------------- output */
const counters = { PASS: 0, FAIL: 0, WARN: 0, INFO: 0, SKIP: 0 };
let currentStep = 'startup';
function line(level, id, text) {
  counters[level] += 1;
  process.stdout.write(`[${level}] ${id}: ${text}\n`);
}
const yn = (value) => (value ? 'yes' : 'no');
function check(id, ok, text) {
  line(ok ? 'PASS' : 'FAIL', id, `${text}: ${yn(ok)}`);
  return ok;
}
function section(title) {
  currentStep = title;
  process.stdout.write(`\n== ${title}\n`);
}

/* ---------------------------------------------------------------- helpers */
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const sha256Text = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
const isHex64 = (value) => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const digestOrNote = (value) => (isHex64(value) ? value : typeof value === 'string' && value.length === 0 ? '(empty)' : '(not a SHA-256 value)');

/** A member of a closed vocabulary, or a fixed placeholder. Never the raw value. */
function vocab(list, value) {
  if (value === null) return 'null';
  if (value === undefined) return 'absent';
  return typeof value === 'string' && VOCAB[list].includes(value) ? value : 'OTHER';
}
function tally(target, key) {
  target[key] = (target[key] ?? 0) + 1;
}
function sortedObject(counts) {
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

/** Read a whole file through a descriptor opened read-only. */
function readFileReadOnly(file) {
  const fd = openSync(file, 'r');
  try {
    return readFileSync(fd);
  } finally {
    closeSync(fd);
  }
}

/** IRR brokerImportEvidenceStore.ts `canonicalJson`: sorted keys, undefined members dropped. */
function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

/** IPD broker-holdings-mapper.ts + provenance.ts `computeLineageHash` for one committed holding. */
function holdingLineageDigest(holding, isin, exchange, asOf) {
  const payload = {
    symbol: holding.symbol,
    companyId: holding.companyId,
    isin,
    exchange,
    quantity: holding.quantity,
    averageBuyPrice: holding.averageBuyPrice,
    currentPrice: holding.currentPrice,
    marketValue: holding.marketValue,
    weightPercentage: holding.weightPercentage,
    active: true,
    sourceBroker: holding.sourceBroker,
    identityStatus: holding.identityStatus,
    resolutionDisposition: holding.resolutionDisposition,
  };
  return sha256Text(`${JSON.stringify(payload)}UNCLASSIFIED${asOf}v1.0.0-bi03`);
}

/** IPD brokerImportPersistence.ts `computeBrokerImportProvenance` for the whole import. */
function importProvenanceDigest(portfolioId, evidence, holdings, inputs) {
  const rows = holdings.map((h, index) => ({ h, input: inputs[index] }));
  rows.sort((a, b) => (a.h.symbol < b.h.symbol ? -1 : a.h.symbol > b.h.symbol ? 1 : 0));
  const canonical = [
    `portfolio:${portfolioId}`,
    `file:${evidence.fileName}`,
    `broker:${evidence.sourceBroker}`,
    `imported:${evidence.importedAt}`,
    `content:${evidence.contentDigest}`,
    ...rows.map(({ h, input }) =>
      `${h.symbol}|${input.isin ?? ''}|${input.exchange ?? ''}|${h.quantity}|${h.averageBuyPrice}|${h.currentPrice}|${h.marketValue}|${h.weightPercentage}|${h.active}|${h.sourceBroker}|${h.lineageDigest}`),
  ].join('\n');
  return sha256Text(canonical);
}

const normalizeIsin = (value) => value.trim().toUpperCase();
const ISIN_SYNTAX = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

/* ---------------------------------------------------------------- arguments */
function parseArguments(argv) {
  const options = { capture: null, dataDirs: [], ipdRoot: null, expectedCaptureSha256: RECORDED.captureSha256, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = () => {
      i += 1;
      if (i >= argv.length) throw new ProbeStop('ARGUMENT_VALUE_MISSING');
      return argv[i];
    };
    if (flag === '--capture') options.capture = value();
    else if (flag === '--data-dir') options.dataDirs.push(value());
    else if (flag === '--ipd-root') options.ipdRoot = value();
    else if (flag === '--expected-capture-sha256') options.expectedCaptureSha256 = value().toLowerCase();
    else if (flag === '--help' || flag === '-h') options.help = true;
    else throw new ProbeStop('ARGUMENT_UNKNOWN');
  }
  if (!isHex64(options.expectedCaptureSha256)) throw new ProbeStop('ARGUMENT_EXPECTED_DIGEST_NOT_SHA256');
  return options;
}

class ProbeStop extends Error {
  constructor(code) {
    super(code);
    this.name = 'ProbeStop';
    this.stopCode = code;
  }
}

/* ---------------------------------------------------------------- step 1: capture */
function locateCapture(options) {
  section('1. Exact capture (input 1)');
  if (options.capture !== null) {
    if (!existsSync(options.capture) || !statSync(options.capture).isFile()) throw new ProbeStop('CAPTURE_FILE_NOT_FOUND');
    const bytes = readFileReadOnly(options.capture);
    line('INFO', 'capture.source', 'capture file given with --capture');
    return bytes;
  }
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) throw new ProbeStop('LOCALAPPDATA_NOT_DEFINED_PASS_CAPTURE');
  const root = path.join(localAppData, 'IIPS', 'w11-dep1-capture');
  if (!existsSync(root)) throw new ProbeStop('DEFAULT_CAPTURE_ROOT_NOT_FOUND_PASS_CAPTURE');
  let examined = 0;
  let selected = null;
  let equal = 0;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(root, entry.name, LOCAL_ONLY_DIRECTORY, EXACT_CAPTURE_FILE);
    if (!existsSync(candidate)) continue;
    examined += 1;
    const bytes = readFileReadOnly(candidate);
    if (sha256(bytes) === options.expectedCaptureSha256) {
      equal += 1;
      if (selected === null) selected = bytes;
    }
  }
  line('INFO', 'capture.source', `default capture root searched: ${examined} exact capture file(s) examined, ${equal} with the expected SHA-256`);
  if (selected === null) throw new ProbeStop('NO_CAPTURE_WITH_EXPECTED_SHA256');
  return selected;
}

function readCapture(bytes, options) {
  const result = {};
  const digest = sha256(bytes);
  const recorded = options.expectedCaptureSha256 === RECORDED.captureSha256;
  result.captureSha256 = digest;
  result.captureIsRecordedCapture = digest === RECORDED.captureSha256;
  line('INFO', 'capture.sha256', digest);
  if (!check('capture.sha256.expected', digest === options.expectedCaptureSha256, 'capture SHA-256 equals the expected digest')) {
    throw new ProbeStop('CAPTURE_SHA256_NOT_EXPECTED');
  }
  if (!recorded) line('WARN', 'capture.override', 'the expected digest was overridden; the facts recorded for the 2026-11-13 capture are reported for information only');

  let doc;
  try {
    doc = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
  } catch {
    throw new ProbeStop('CAPTURE_NOT_JSON');
  }
  if (!isObject(doc)) throw new ProbeStop('CAPTURE_NOT_AN_OBJECT');
  if (!check('capture.schema', doc.schema === EXACT_CAPTURE_SCHEMA, 'schema is the exact-capture schema v1')) throw new ProbeStop('CAPTURE_SCHEMA_UNEXPECTED');
  check('capture.outcome', doc.outcome === 'CONSISTENT_CAPTURE', 'outcome is CONSISTENT_CAPTURE');
  result.evidenceEligibility = vocab('eligibility', doc.evidenceEligibility);
  line('INFO', 'capture.evidenceEligibility', result.evidenceEligibility);

  const reads = Array.isArray(doc.reads) ? doc.reads : [];
  const gets = reads.filter((r) => isObject(r) && r.operation === 'portfolio.get' && isObject(r.wireResult));
  const revisionsRead = reads.find((r) => isObject(r) && r.operation === 'portfolio.revisions' && Array.isArray(r.wireResult));
  line('INFO', 'capture.reads', `${reads.length} read(s); portfolio.get with a result: ${gets.length}; portfolio.revisions with a result: ${revisionsRead ? 1 : 0}`);
  if (gets.length === 0) throw new ProbeStop('CAPTURE_HAS_NO_PORTFOLIO_GET_RESULT');
  const firstCanonical = canonicalJson(gets[0].wireResult);
  check('capture.reads.agree', gets.every((r) => canonicalJson(r.wireResult) === firstCanonical), 'every portfolio.get result in the capture is identical');

  const detail = gets[0].wireResult;
  const holdings = Array.isArray(detail.holdings) ? detail.holdings : null;
  if (holdings === null) throw new ProbeStop('CAPTURE_DETAIL_HAS_NO_HOLDINGS_ARRAY');
  const selectedId = isObject(doc.selection) ? doc.selection.portfolioId : undefined;
  result.portfolioIdIsRecorded = detail.portfolioId === RECORDED.portfolioId && selectedId === RECORDED.portfolioId;
  result.revision = Number.isSafeInteger(detail.revision) ? detail.revision : null;
  result.holdingsCountField = Number.isSafeInteger(detail.holdingsCount) ? detail.holdingsCount : null;
  result.holdings = holdings.length;

  const identity = { object: 0, null: 0, other: 0 };
  const identityStatus = {};
  const resolutionDisposition = {};
  const sourceBroker = {};
  let activeTrue = 0;
  let lineagePresent = 0;
  for (const h of holdings) {
    if (!isObject(h)) throw new ProbeStop('CAPTURE_HOLDING_NOT_AN_OBJECT');
    if (h.securityIdentity === null) identity.null += 1;
    else if (isObject(h.securityIdentity) && typeof h.securityIdentity.isin === 'string') identity.object += 1;
    else identity.other += 1;
    tally(identityStatus, vocab('identityStatus', h.identityStatus));
    tally(resolutionDisposition, vocab('resolutionDisposition', h.resolutionDisposition));
    tally(sourceBroker, vocab('broker', h.sourceBroker));
    if (h.active === true) activeTrue += 1;
    if (isHex64(h.lineageDigest)) lineagePresent += 1;
  }
  result.identity = identity;
  result.identityStatus = sortedObject(identityStatus);
  result.resolutionDisposition = sortedObject(resolutionDisposition);
  result.holdingsPerSourceBroker = sortedObject(sourceBroker);
  result.holdingsActive = activeTrue;
  result.holdingsWithLineageDigest = lineagePresent;

  const factLevel = (ok) => (ok ? 'PASS' : recorded ? 'FAIL' : 'WARN');
  const fact = (id, ok, text) => line(factLevel(ok), id, `${text}: ${yn(ok)}`);
  fact('capture.portfolio', result.portfolioIdIsRecorded, `portfolio selected and returned is ${RECORDED.portfolioId}`);
  fact('capture.revision', result.revision === RECORDED.revision, `revision is ${RECORDED.revision} (observed ${result.revision})`);
  fact('capture.holdings', holdings.length === RECORDED.holdings && result.holdingsCountField === RECORDED.holdings,
    `holdings array and holdingsCount are ${RECORDED.holdings} (observed ${holdings.length} and ${result.holdingsCountField})`);
  fact('capture.identity.null', identity.null === RECORDED.identityNull, `securityIdentity null on ${RECORDED.identityNull} (observed ${identity.null})`);
  fact('capture.identity.object', identity.object === RECORDED.identityObject, `securityIdentity object on ${RECORDED.identityObject} (observed ${identity.object})`);
  check('capture.identity.wellformed', identity.other === 0, 'every securityIdentity is an object or null');
  line('INFO', 'capture.identityStatus', JSON.stringify(result.identityStatus));
  line('INFO', 'capture.resolutionDisposition', JSON.stringify(result.resolutionDisposition));
  line('INFO', 'capture.holdingsPerSourceBroker', JSON.stringify(result.holdingsPerSourceBroker));
  line('INFO', 'capture.holdings.active', `${activeTrue} of ${holdings.length}`);
  line('INFO', 'capture.holdings.lineageDigest', `${lineagePresent} of ${holdings.length} carry a SHA-256 lineage digest`);

  result.provenanceDigest = digestOrNote(detail.provenanceDigest);
  line('INFO', 'capture.revision.provenanceDigest', result.provenanceDigest);
  const revisions = revisionsRead ? revisionsRead.wireResult : [];
  result.revisionEntries = revisions.length;
  const entry = revisions.find((r) => isObject(r) && r.revision === detail.revision);
  result.revisionEntry = entry
    ? { operation: vocab('operation', entry.operation), revisionContentDigest: digestOrNote(entry.contentDigest), provenanceDigest: digestOrNote(entry.provenanceDigest) }
    : null;
  line('INFO', 'capture.revisions', `${revisions.length} history entr(ies); entry for the examined revision: ${JSON.stringify(result.revisionEntry)}`);
  line('INFO', 'capture.revisions.note', 'revisionContentDigest is the digest of the stored revision. It is NOT the digest of the imported file and is never used as the match key');

  const importEvidence = Array.isArray(detail.importEvidence) ? detail.importEvidence.filter(isObject) : null;
  result.wireType = importEvidence === null ? 'PortfolioDetail' : 'LocalPortfolioDetail';
  line('INFO', 'capture.wireType', result.wireType);
  result.importEvidence = (importEvidence ?? []).map((e) => ({
    contentDigest: digestOrNote(e.contentDigest),
    importProvenanceDigest: digestOrNote(e.lineageDigest),
    sourceBroker: vocab('broker', e.sourceBroker),
    semantics: vocab('semantics', e.semantics),
    importedAtIsIsoUtc: typeof e.importedAt === 'string' && Number.isFinite(Date.parse(e.importedAt)) && new Date(e.importedAt).toISOString() === e.importedAt,
    equalsRevisionProvenanceDigest: isHex64(e.lineageDigest) && e.lineageDigest === detail.provenanceDigest,
  }));
  line('INFO', 'capture.importEvidence', `${result.importEvidence.length} committed import(s) on the wire`);
  result.importEvidence.forEach((e, i) => line('INFO', `capture.importEvidence[${i + 1}]`, JSON.stringify(e)));
  const matchKeys = (importEvidence ?? []).map((e) => e.contentDigest).filter(isHex64);
  result.matchKeyAvailable = matchKeys.length > 0;
  check('capture.matchKey', result.matchKeyAvailable, 'match key available (content digest of a committed import)');

  result.trackedCandidateEquality = TRACKED_CANDIDATES.map((c) => ({
    label: c.label,
    equalAsCommittedLf: matchKeys.includes(c.lf),
    equalWithCrlf: matchKeys.includes(c.crlf),
  }));
  for (const c of result.trackedCandidateEquality) {
    line('INFO', 'capture.trackedCandidate', `${c.label}: digest equal as committed (LF) ${yn(c.equalAsCommittedLf)}; with CRLF ${yn(c.equalWithCrlf)}`);
  }
  line('INFO', 'capture.trackedCandidate.note', 'only equality is evidence; a file that was re-encoded or edited has another digest');

  return { result, detail, holdings, importEvidence: importEvidence ?? [], matchKeys };
}

/* ---------------------------------------------------------------- step 2: lineage hypotheses */
const NO_ISIN_HYPOTHESES = Object.freeze([
  { isin: undefined, exchange: undefined },
  { isin: undefined, exchange: 'NSE' },
  { isin: undefined, exchange: 'BSE' },
]);

function inputClass(input) {
  return `${input.isin === undefined ? 'NO_ISIN' : 'ISIN'}+${input.exchange === undefined ? 'NO_EXCHANGE' : `EXCHANGE_${input.exchange}`}`;
}

/** Try every hypothesis for one holding. Returns the reproducing input, or null. */
function reproduce(holding, asOfList, isinCandidates) {
  if (!isHex64(holding.lineageDigest)) return null;
  const hypotheses = [...NO_ISIN_HYPOTHESES];
  for (const isin of isinCandidates) {
    for (const exchange of [undefined, 'NSE', 'BSE']) hypotheses.push({ isin, exchange });
  }
  for (const asOf of asOfList) {
    for (const hypothesis of hypotheses) {
      if (holdingLineageDigest(holding, hypothesis.isin, hypothesis.exchange, asOf) === holding.lineageDigest) {
        return { isin: hypothesis.isin, exchange: hypothesis.exchange, asOf };
      }
    }
  }
  return null;
}

function ownIdentityIsins(holding) {
  const identity = holding.securityIdentity;
  if (!isObject(identity) || typeof identity.isin !== 'string') return [];
  return [...new Set([identity.isin, normalizeIsin(identity.isin)])];
}

function lineageFromCaptureAlone(capture) {
  section('2. Committed input per holding, from the capture alone (lineage digest)');
  const asOfList = [...new Set(capture.importEvidence.map((e) => e.importedAt).filter((v) => typeof v === 'string'))];
  line('INFO', 'lineage.asOf', `${asOfList.length} import instant(s) available as the lineage timestamp`);
  const inputs = capture.holdings.map((h) => {
    const found = asOfList.length === 0 ? null : reproduce(h, asOfList, ownIdentityIsins(h));
    return found === null ? null : { ...found, via: found.isin === undefined ? 'NO_IDENTIFIER_NEEDED' : 'OWN_STORED_IDENTITY' };
  });
  const reproduced = inputs.filter((v) => v !== null).length;
  line('INFO', 'lineage.captureOnly', `${reproduced} of ${capture.holdings.length} stored lineage digests reproduced without the evidence journal`);
  return { asOfList, inputs };
}

/* ---------------------------------------------------------------- step 3: evidence journal */
function describeRows(rows) {
  const stats = {
    rows: rows.length,
    isinPresent: 0, isinNull: 0, isinEmptyString: 0, isinOtherType: 0, isinSyntaxValid: 0,
    exchange: {}, isinAndExchange: 0, isinWithoutExchange: 0, exchangeWithoutIsin: 0, neitherIsinNorExchange: 0,
    identityStatus: {}, identityBasis: {}, identityRefusalCode: {}, rowsWithQuarantineIds: 0,
    distinctIsins: 0, distinctGroupKeys: 0,
  };
  const isins = new Set();
  const groups = new Set();
  for (const row of rows) {
    const r = isObject(row) ? row : {};
    const hasIsin = typeof r.isin === 'string' && r.isin.trim() !== '';
    if (hasIsin) {
      stats.isinPresent += 1;
      const isin = normalizeIsin(r.isin);
      isins.add(isin);
      if (ISIN_SYNTAX.test(isin)) stats.isinSyntaxValid += 1;
    } else if (r.isin === null) stats.isinNull += 1;
    else if (typeof r.isin === 'string') stats.isinEmptyString += 1;
    else stats.isinOtherType += 1;
    const exchange = vocab('exchange', r.exchange);
    tally(stats.exchange, exchange);
    const hasExchange = exchange === 'NSE' || exchange === 'BSE';
    if (hasIsin && hasExchange) stats.isinAndExchange += 1;
    else if (hasIsin) stats.isinWithoutExchange += 1;
    else if (hasExchange) stats.exchangeWithoutIsin += 1;
    else stats.neitherIsinNorExchange += 1;
    tally(stats.identityStatus, vocab('identityStatus', r.identityStatus));
    tally(stats.identityBasis, vocab('identityBasis', r.identityBasis));
    tally(stats.identityRefusalCode, vocab('refusalCode', r.identityRefusalCode));
    if (Array.isArray(r.quarantineIds) && r.quarantineIds.length > 0) stats.rowsWithQuarantineIds += 1;
    const symbol = typeof r.symbol === 'string' ? r.symbol.trim().toUpperCase() : '';
    groups.add(hasIsin ? `ISIN:${normalizeIsin(r.isin)}` : `SYM:${symbol}`);
  }
  stats.exchange = sortedObject(stats.exchange);
  stats.identityStatus = sortedObject(stats.identityStatus);
  stats.identityBasis = sortedObject(stats.identityBasis);
  stats.identityRefusalCode = sortedObject(stats.identityRefusalCode);
  stats.distinctIsins = isins.size;
  stats.distinctGroupKeys = groups.size;
  return { stats, isins };
}

function readJournal(dataDir, label, capture) {
  const summary = { label, dataDirectoryExists: false, journalExists: false };
  if (!existsSync(dataDir) || !statSync(dataDir).isDirectory()) {
    line('WARN', `${label}.dataDir`, 'data directory exists: no');
    return { summary, matches: [] };
  }
  summary.dataDirectoryExists = true;
  const resetDir = path.join(dataDir, RESET_DIRECTORY);
  summary.resetRecoveryEntries = existsSync(resetDir) && statSync(resetDir).isDirectory() ? readdirSync(resetDir).length : 0;
  line('INFO', `${label}.reset`, `owner-reset recovery entries beside the journal: ${summary.resetRecoveryEntries} (not opened)`);
  const journalPath = path.join(dataDir, JOURNAL_FILE);
  if (!existsSync(journalPath) || !statSync(journalPath).isFile()) {
    line('WARN', `${label}.journal`, 'evidence journal exists: no (no broker-import evidence was ever retained in this data directory, or it was reset)');
    return { summary, matches: [] };
  }
  summary.journalExists = true;
  const bytes = readFileReadOnly(journalPath);
  summary.journalBytes = bytes.length;
  summary.journalSha256 = sha256(bytes);
  line('INFO', `${label}.journal`, `evidence journal exists: yes; ${bytes.length} bytes; SHA-256 ${summary.journalSha256}`);

  const lines = bytes.toString('utf8').split('\n').map((l) => (l.endsWith('\r') ? l.slice(0, -1) : l)).filter((l) => l.length > 0);
  const parse = (text) => {
    try {
      const value = JSON.parse(text);
      return isObject(value) ? value : null;
    } catch {
      return null;
    }
  };
  const header = lines.length > 0 ? parse(lines[0]) : null;
  summary.headerVersion1 = header !== null && header.journalFormatVersion === 1;
  check(`${label}.journal.header`, summary.headerVersion1, 'journal header is format version 1');
  const body = summary.headerVersion1 ? lines.slice(1) : lines;
  const ops = {};
  const brokers = {};
  const variants = {};
  const statuses = {};
  const slots = {};
  const contentDigests = new Set();
  const scopes = new Set();
  const trackedHits = TRACKED_CANDIDATES.map(() => 0);
  let unparseableFinal = 0;
  let unparseableOther = 0;
  let evidenceRecords = 0;
  const matches = [];
  body.forEach((text, index) => {
    const record = parse(text);
    if (record === null) {
      if (index === body.length - 1) unparseableFinal += 1;
      else unparseableOther += 1;
      return;
    }
    tally(ops, record.op === 'create' || record.op === 'readState' ? record.op : 'OTHER');
    const payload = record.payload;
    if (record.op !== 'create' || !isObject(payload) || payload.schema !== EVIDENCE_SCHEMA) return;
    evidenceRecords += 1;
    tally(brokers, vocab('broker', payload.broker));
    tally(variants, vocab('variant', payload.variant));
    tally(statuses, vocab('status', payload.status));
    tally(slots, vocab('slot', payload.portfolioSlot));
    if (typeof payload.contentDigest === 'string') contentDigests.add(payload.contentDigest);
    scopes.add(`${String(record.tenantId)}\u0000${String(record.ownerUserId)}`);
    TRACKED_CANDIDATES.forEach((c, i) => {
      if (payload.contentDigest === c.lf || payload.contentDigest === c.crlf) trackedHits[i] += 1;
    });
    if (capture.matchKeys.includes(payload.contentDigest)) matches.push({ record, payload, label });
  });
  Object.assign(summary, {
    journalLines: body.length,
    operations: sortedObject(ops),
    unparseableFinalLine: unparseableFinal,
    unparseableOtherLines: unparseableOther,
    evidenceRecords,
    distinctContentDigests: contentDigests.size,
    ownerScopes: scopes.size,
    recordsPerBroker: sortedObject(brokers),
    recordsPerVariant: sortedObject(variants),
    recordsPerStatus: sortedObject(statuses),
    recordsPerSlot: sortedObject(slots),
    recordsEqualToTrackedCandidate: Object.fromEntries(TRACKED_CANDIDATES.map((c, i) => [c.label, trackedHits[i]])),
    recordsMatchingCommittedImport: matches.length,
  });
  line('INFO', `${label}.journal.lines`, `${body.length} record line(s); operations ${JSON.stringify(summary.operations)}; unparseable final line ${unparseableFinal}; unparseable other lines ${unparseableOther}`);
  if (unparseableOther > 0) line('FAIL', `${label}.journal.malformed`, 'a non-final journal line is not valid JSON');
  line('INFO', `${label}.evidence`, `${evidenceRecords} broker-import evidence record(s); ${contentDigests.size} distinct content digest(s); ${scopes.size} owner scope(s)`);
  line('INFO', `${label}.evidence.broker`, JSON.stringify(summary.recordsPerBroker));
  line('INFO', `${label}.evidence.variant`, JSON.stringify(summary.recordsPerVariant));
  line('INFO', `${label}.evidence.status`, JSON.stringify(summary.recordsPerStatus));
  line('INFO', `${label}.evidence.slot`, JSON.stringify(summary.recordsPerSlot));
  line('INFO', `${label}.evidence.trackedCandidate`, JSON.stringify(summary.recordsEqualToTrackedCandidate));
  line('INFO', `${label}.evidence.match`, `records whose contentDigest equals the committed import's content digest: ${matches.length}`);
  return { summary, matches };
}

function describeMatch(match, ordinal, capture) {
  const { record, payload } = match;
  const id = `match[${ordinal}]`;
  const { recordDigest, ...withoutDigest } = payload;
  const recomputedRecordDigest = sha256Text(canonicalJson(withoutDigest));
  const recomputedImportId = sha256Text(`${payload.broker}\u0000${payload.contentDigest}\u0000${payload.readAt}`);
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const { stats, isins } = describeRows(rows);
  const counts = isObject(payload.counts) ? payload.counts : {};
  const count = (key) => (Number.isSafeInteger(counts[key]) ? counts[key] : null);
  const authority = isObject(payload.identityAuthority) ? payload.identityAuthority : {};
  const described = {
    journal: match.label,
    contentDigest: digestOrNote(payload.contentDigest),
    importId: digestOrNote(payload.importId),
    recordDigest: digestOrNote(recordDigest),
    recordDigestRecomputedEqual: recomputedRecordDigest === recordDigest,
    importIdRecomputedEqual: recomputedImportId === payload.importId,
    dedupKeyConsistent: record.dedupKey === `${EVIDENCE_SCHEMA}:${payload.importId}`,
    readAtEqualsCommittedImportInstant: capture.importEvidence.some((e) => e.contentDigest === payload.contentDigest && e.importedAt === payload.readAt),
    broker: vocab('broker', payload.broker),
    variant: vocab('variant', payload.variant),
    status: vocab('status', payload.status),
    portfolioSlot: vocab('slot', payload.portfolioSlot),
    identityAuthority: { source: vocab('authority', authority.source), entities: Number.isSafeInteger(authority.entities) ? authority.entities : null },
    counts: {
      nativeRows: count('nativeRows'), identityAssessedRows: count('identityAssessedRows'),
      identityResolvedRows: count('identityResolvedRows'), identityUnresolvedRows: count('identityUnresolvedRows'), savedRows: count('savedRows'),
    },
    rows: stats,
    rowCountEqualsHoldings: rows.length === capture.holdings.length,
    groupKeyCountEqualsHoldings: stats.distinctGroupKeys === capture.holdings.length,
  };
  line('INFO', `${id}.digests`, `importId ${described.importId}; recordDigest ${described.recordDigest}`);
  check(`${id}.recordDigest`, described.recordDigestRecomputedEqual, 'stored recordDigest equals the digest recomputed from the record');
  check(`${id}.importId`, described.importIdRecomputedEqual && described.dedupKeyConsistent, 'importId and dedup key are consistent with broker, content digest and read instant');
  line('INFO', `${id}.sameSelection`, `read instant equals the committed import instant (the very selection that was committed): ${yn(described.readAtEqualsCommittedImportInstant)}`);
  line('INFO', `${id}.kind`, `broker ${described.broker}; variant ${described.variant}; status ${described.status}; slot ${described.portfolioSlot}`);
  line('INFO', `${id}.counts`, JSON.stringify(described.counts));
  line('INFO', `${id}.rows`, `rows in the record: ${stats.rows}; equals the ${capture.holdings.length} stored holdings: ${yn(described.rowCountEqualsHoldings)}`);
  line('INFO', `${id}.rows.isin`, `rows with an ISIN: ${stats.isinPresent} (syntactically valid ${stats.isinSyntaxValid}); explicit absence (null): ${stats.isinNull}; empty string: ${stats.isinEmptyString}; other: ${stats.isinOtherType}`);
  line('INFO', `${id}.rows.exchange`, `rows by exchange: ${JSON.stringify(stats.exchange)}`);
  line('INFO', `${id}.rows.cross`, `ISIN and exchange: ${stats.isinAndExchange}; ISIN only: ${stats.isinWithoutExchange}; exchange only: ${stats.exchangeWithoutIsin}; neither: ${stats.neitherIsinNorExchange}`);
  line('INFO', `${id}.rows.identity`, `status ${JSON.stringify(stats.identityStatus)}; basis ${JSON.stringify(stats.identityBasis)}; refusal ${JSON.stringify(stats.identityRefusalCode)}; rows with quarantine ids ${stats.rowsWithQuarantineIds}`);
  line('INFO', `${id}.rows.groups`, `distinct ISINs: ${stats.distinctIsins}; distinct aggregation keys before row exclusions: ${stats.distinctGroupKeys}; equals the stored holdings: ${yn(described.groupKeyCountEqualsHoldings)}`);
  return { described, isins, integrityOk: described.recordDigestRecomputedEqual && described.importIdRecomputedEqual };
}

function evidenceJournals(options, capture) {
  section('3. IRR broker-import evidence journal (input 2; E4 as specified)');
  const dataDirs = options.dataDirs.length > 0 ? options.dataDirs : [process.env.IIPS_DATA_DIR || DEFAULT_DATA_DIR];
  line('INFO', 'journal.locations', options.dataDirs.length > 0
    ? `${dataDirs.length} data director(ies) given with --data-dir`
    : `1 data directory by default (${process.env.IIPS_DATA_DIR ? 'IIPS_DATA_DIR of this shell' : 'the launcher default under the runtime root'})`);
  const journals = [];
  const matches = [];
  dataDirs.forEach((dir, index) => {
    const read = readJournal(dir, `journal[${index + 1}]`, capture);
    journals.push(read.summary);
    matches.push(...read.matches);
  });
  const described = [];
  const journalIsins = new Set();
  const journalAsOf = new Set();
  matches.forEach((match, index) => {
    const one = describeMatch(match, index + 1, capture);
    described.push(one.described);
    if (one.integrityOk) {
      one.isins.forEach((isin) => journalIsins.add(isin));
      if (typeof match.payload.readAt === 'string') journalAsOf.add(match.payload.readAt);
    } else {
      line('WARN', `match[${index + 1}].excluded`, 'the record failed its integrity check; its rows are not used in step 4');
    }
  });
  const recordFound = matches.length > 0;
  line(recordFound ? 'PASS' : 'WARN', 'e4.recordFound', `evidence record with the committed import's content digest found: ${yn(recordFound)}`);
  if (!recordFound) line('INFO', 'e4.noSubstitute', 'no record was substituted. Nothing was matched on a timestamp, a file name or a revision digest');
  return { journals, described, journalIsins, journalAsOf, recordFound };
}

/* ---------------------------------------------------------------- step 4: join and verification */
function completeWithJournal(capture, lineage, journal) {
  section('4. Committed input per holding, with the matched evidence record');
  const inputs = [...lineage.inputs];
  if (!journal.recordFound || journal.journalIsins.size === 0) {
    line('SKIP', 'lineage.journal', 'no matched evidence record with ISINs; step 2 stands unchanged');
    return inputs;
  }
  const asOfList = [...new Set([...lineage.asOfList, ...journal.journalAsOf])];
  const candidates = [...journal.journalIsins];
  let added = 0;
  capture.holdings.forEach((h, index) => {
    if (inputs[index] !== null) return;
    const found = reproduce(h, asOfList, candidates);
    if (found !== null) {
      inputs[index] = { ...found, via: 'MATCHED_EVIDENCE_RECORD' };
      added += 1;
    }
  });
  line('INFO', 'lineage.journal', `${added} further stored lineage digest(s) reproduced with an ISIN retained in the matched evidence record`);
  return inputs;
}

function verifyWholeImport(capture, inputs) {
  section('5. Independent verification against the stored revision');
  const reproduced = inputs.filter((v) => v !== null).length;
  const verification = { holdingLineageDigestsReproduced: reproduced, holdings: capture.holdings.length, importProvenanceDigest: 'NOT_COMPUTED' };
  check('verify.holdings', reproduced === capture.holdings.length, `every stored holding lineage digest reproduced (${reproduced} of ${capture.holdings.length})`);
  if (capture.importEvidence.length !== 1) {
    line('SKIP', 'verify.import', 'the import provenance digest is recomputed only for a revision with exactly one committed import');
    verification.importProvenanceDigest = 'NOT_APPLICABLE';
    return verification;
  }
  if (reproduced !== capture.holdings.length) {
    line('SKIP', 'verify.import', 'not every holding input is determined; the import provenance digest cannot be recomputed');
    return verification;
  }
  const evidence = capture.importEvidence[0];
  const recomputed = importProvenanceDigest(capture.detail.portfolioId, evidence, capture.holdings, inputs);
  const equalImport = recomputed === evidence.lineageDigest;
  const equalRevision = recomputed === capture.detail.provenanceDigest;
  verification.importProvenanceDigest = equalImport ? 'EQUAL' : 'NOT_EQUAL';
  verification.equalsRevisionProvenanceDigest = equalRevision;
  verification.recomputedDigest = recomputed;
  check('verify.import', equalImport, 'import provenance digest recomputed from the reconstructed inputs equals the stored import provenance digest');
  line('INFO', 'verify.revision', `recomputed digest ${recomputed}; equals the provenance digest of the stored revision: ${yn(equalRevision)}`);
  return verification;
}

/* ---------------------------------------------------------------- step 6: registry cross-check */
function registryCrossCheck(options, capture, inputs) {
  section('6. Supplementary: tracked P7 qualification manifest (input 3, optional)');
  if (options.ipdRoot === null) {
    line('SKIP', 'registry', 'no --ipd-root given');
    return null;
  }
  const manifestPath = path.join(options.ipdRoot, ...MANIFEST_RELATIVE);
  if (!existsSync(manifestPath)) {
    line('WARN', 'registry.manifest', 'manifest found under --ipd-root: no');
    return null;
  }
  const bytes = readFileReadOnly(manifestPath);
  const digest = sha256(bytes);
  const expected = digest === MANIFEST_SHA256;
  line(expected ? 'PASS' : 'WARN', 'registry.manifest.sha256', `manifest SHA-256 equals the digest recorded on 2026-11-14: ${yn(expected)}`);
  let manifest;
  try {
    manifest = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
  } catch {
    line('WARN', 'registry.manifest.json', 'manifest is valid JSON: no');
    return null;
  }
  const entries = isObject(manifest) && Array.isArray(manifest.registryEntries) ? manifest.registryEntries : [];
  const pairs = new Set();
  const isins = new Set();
  let malformed = 0;
  for (const entry of entries) {
    const m = typeof entry === 'string' ? /^[^|]+\|(NSE_EQ|BSE_EQ)\|ISIN:([A-Za-z0-9]{12}):[^|]+$/.exec(entry) : null;
    if (m === null) {
      malformed += 1;
      continue;
    }
    pairs.add(`${m[2].toUpperCase()}|${m[1]}`);
    isins.add(m[2].toUpperCase());
  }
  const out = {
    manifestSha256: digest, manifestSha256IsRecorded: expected, registryEntries: entries.length, entriesNotUnderstood: malformed,
    distinctIsins: isins.size, distinctIsinSegmentPairs: pairs.size,
    nullIdentity: { isinAndExchange: 0, pairInManifest: 0, pairNotInManifest: 0 },
    withIdentity: { isinAndExchange: 0, pairInManifest: 0, pairNotInManifest: 0 },
  };
  capture.holdings.forEach((h, index) => {
    const input = inputs[index];
    if (input === null || input.isin === undefined || input.exchange === undefined) return;
    const bucket = h.securityIdentity === null ? out.nullIdentity : out.withIdentity;
    bucket.isinAndExchange += 1;
    if (pairs.has(`${normalizeIsin(input.isin)}|${input.exchange}_EQ`)) bucket.pairInManifest += 1;
    else bucket.pairNotInManifest += 1;
  });
  line('INFO', 'registry.manifest', `${entries.length} registry entr(ies); ${isins.size} distinct ISINs; ${pairs.size} ISIN and segment pairs; not understood ${malformed}`);
  line('INFO', 'registry.nullIdentity', `null-identity holdings committed with ISIN and exchange: ${out.nullIdentity.isinAndExchange}; pair in the manifest ${out.nullIdentity.pairInManifest}; pair not in the manifest ${out.nullIdentity.pairNotInManifest}`);
  line('INFO', 'registry.withIdentity', `holdings with an identity committed with ISIN and exchange: ${out.withIdentity.isinAndExchange}; pair in the manifest ${out.withIdentity.pairInManifest}; pair not in the manifest ${out.withIdentity.pairNotInManifest}`);
  line('INFO', 'registry.note', 'the manifest is the tracked file. Whether the running process loaded exactly this file when the import was committed is not established by this probe');
  return out;
}

/* ---------------------------------------------------------------- step 7: classification */
function classify(capture, inputs) {
  section('7. Cause distribution of the null-identity holdings');
  const byClass = { all: {}, nullIdentity: {}, withIdentity: {} };
  const via = {};
  let qualificationPathEvidenced = 0;
  capture.holdings.forEach((h, index) => {
    const input = inputs[index];
    const key = input === null ? 'UNDETERMINED' : inputClass(input);
    tally(byClass.all, key);
    tally(h.securityIdentity === null ? byClass.nullIdentity : byClass.withIdentity, key);
    tally(via, input === null ? 'NOT_REPRODUCED' : input.via);
    if (h.securityIdentity !== null && input !== null && input.isin !== undefined && input.exchange !== undefined) qualificationPathEvidenced += 1;
  });
  const n = byClass.nullIdentity;
  const get = (key) => n[key] ?? 0;
  const noIsin = get('NO_ISIN+NO_EXCHANGE') + get('NO_ISIN+EXCHANGE_NSE') + get('NO_ISIN+EXCHANGE_BSE');
  const isinNoExchange = get('ISIN+NO_EXCHANGE');
  const isinAndExchange = get('ISIN+EXCHANGE_NSE') + get('ISIN+EXCHANGE_BSE');
  const undetermined = get('UNDETERMINED');
  const total = noIsin + isinNoExchange + isinAndExchange + undetermined;
  const causes = {
    nullIdentityHoldings: total,
    A_NO_ISIN_IN_COMMITTED_INPUT: {
      count: noIsin, standing: 'CONFIRMED',
      withExchange: get('NO_ISIN+EXCHANGE_NSE') + get('NO_ISIN+EXCHANGE_BSE'), withoutExchange: get('NO_ISIN+NO_EXCHANGE'),
    },
    B_ISIN_WITHOUT_EXCHANGE_IN_COMMITTED_INPUT: { count: isinNoExchange, standing: 'CONFIRMED' },
    C_ISIN_AND_EXCHANGE_BUT_NO_IDENTITY: {
      count: isinAndExchange,
      standing: isinAndExchange === 0 ? 'NOT_APPLICABLE' : 'INPUT_CONFIRMED_REASON_UNKNOWN',
      qualificationPathEvidencedByHoldingsWithIdentity: qualificationPathEvidenced,
    },
    D_UNDETERMINED: { count: undetermined, standing: 'UNKNOWN' },
  };
  line('INFO', 'class.all', JSON.stringify(sortedObject(byClass.all)));
  line('INFO', 'class.withIdentity', JSON.stringify(sortedObject(byClass.withIdentity)));
  line('INFO', 'class.nullIdentity', JSON.stringify(sortedObject(byClass.nullIdentity)));
  line('INFO', 'class.evidence', JSON.stringify(sortedObject(via)));
  line('INFO', 'cause.A', `no ISIN in the committed input (CONFIRMED): ${noIsin} (with an exchange ${causes.A_NO_ISIN_IN_COMMITTED_INPUT.withExchange}, without ${causes.A_NO_ISIN_IN_COMMITTED_INPUT.withoutExchange})`);
  line('INFO', 'cause.B', `ISIN but no exchange in the committed input (CONFIRMED): ${isinNoExchange}`);
  line('INFO', 'cause.C', `ISIN and exchange in the committed input, no identity stored (${causes.C_ISIN_AND_EXCHANGE_BUT_NO_IDENTITY.standing}): ${isinAndExchange}; holdings of this revision that did receive an identity from ISIN and exchange: ${qualificationPathEvidenced}`);
  line('INFO', 'cause.D', `undetermined (UNKNOWN): ${undetermined}`);
  check('cause.sum', total === capture.result.identity.null, `the four classes sum to the null-identity holdings (${total} of ${capture.result.identity.null})`);
  return { classes: { all: sortedObject(byClass.all), withIdentity: sortedObject(byClass.withIdentity), nullIdentity: sortedObject(byClass.nullIdentity) }, evidenceUsed: sortedObject(via), causes, undetermined };
}

/* ---------------------------------------------------------------- main */
function main() {
  process.stdout.write(`W04 E4 read-only identifier-supply probe (${PROBE_VERSION}); node ${process.version}; ${process.platform}\n`);
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write('usage: node w04-e4-identifier-supply-probe.mjs [--capture <file>] [--data-dir <dir>]... [--ipd-root <dir>] [--expected-capture-sha256 <hex>]\n');
    return 2;
  }
  const capture = readCapture(locateCapture(options), options);
  const lineage = lineageFromCaptureAlone(capture);
  const journal = evidenceJournals(options, capture);
  const inputs = completeWithJournal(capture, lineage, journal);
  const verification = verifyWholeImport(capture, inputs);
  const registry = registryCrossCheck(options, capture, inputs);
  const classification = classify(capture, inputs);

  section('Result');
  const complete = classification.undetermined === 0 && counters.FAIL === 0;
  const result = {
    probe: PROBE_VERSION,
    result: complete ? 'COMPLETE' : 'PARTIAL',
    capture: capture.result,
    e4: {
      recordFound: journal.recordFound,
      matchedRecords: journal.described,
      journals: journal.journals,
    },
    verification,
    classification,
    registry,
    checks: { ...counters },
  };
  process.stdout.write(`E4_RESULT_JSON: ${JSON.stringify(result)}\n`);
  process.stdout.write(`E4_RESULT_JSON_SHA256: ${sha256Text(JSON.stringify(result))}\n`);
  process.stdout.write(`checks: PASS ${counters.PASS}, FAIL ${counters.FAIL}, WARN ${counters.WARN}, INFO ${counters.INFO}, SKIP ${counters.SKIP}\n`);
  process.stdout.write(`RESULT: ${result.result}\n`);
  return complete ? 0 : 1;
}

let exitCode;
try {
  exitCode = main();
} catch (error) {
  const code = error instanceof ProbeStop ? error.stopCode : typeof error?.code === 'string' && /^[A-Z0-9_]+$/.test(error.code) ? error.code : 'UNEXPECTED_ERROR';
  const kind = error instanceof ProbeStop ? 'stop' : typeof error?.name === 'string' && /^[A-Za-z]+$/.test(error.name) ? error.name : 'Error';
  process.stdout.write(`\n[FAIL] probe: ${kind} ${code} during step "${currentStep}"\n`);
  process.stdout.write('RESULT: INCONCLUSIVE\n');
  exitCode = 2;
}
process.exitCode = exitCode;
