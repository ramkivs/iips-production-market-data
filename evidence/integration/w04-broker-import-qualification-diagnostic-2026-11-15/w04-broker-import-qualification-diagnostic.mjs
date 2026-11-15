#!/usr/bin/env node
/**
 * W04 - read-only diagnostic: what does the security-identity qualification of an IPD checkout
 * return TODAY for the rows of the original broker CSV, and does that agree with what
 * revision 1 stored?
 *
 * PURPOSE
 *   `DHAN_PORTFOLIO` revision 1 stores a security identity on 1 holding and null on 63. The typed
 *   reason computed at that import was not returned, stored or logged, so it cannot be read back.
 *   This diagnostic answers a different, answerable question: with the sources this checkout
 *   holds now, which rows qualify and which do not, and for what typed reason.
 *
 *   If the answer reproduces the stored state exactly (the same holdings qualified, the same
 *   holdings unresolved), the sources of this checkout are SUFFICIENT to explain revision 1.
 *   It is still a new measurement and not a record of the import. If the answer differs, the
 *   sources in force at the import were not those of this checkout.
 *
 * READ-ONLY
 *   Node built-ins used: node:crypto, node:fs, node:path, node:url. No network module, no child
 *   process, no database module. Every file is opened with the 'r' flag. There is no write,
 *   rename, delete or mkdir call. It does not start, stop or contact IPD or IRR, does not open
 *   the portfolio database or any journal, and does not run git.
 *
 *   It loads four COMPILED modules of the named checkout, and the seven they import:
 *     dist/src/identity/governed_fixture_master.js           (the P04 master, compiled in)
 *     dist/src/identity/broker_observation_resolver.js       (the company-level gate)
 *     dist/src/providers/dhan/dhan_instrument_map.js         (the P7 registry class)
 *     dist/src/providers/dhan/dhan_security_identity_service.js  (the qualification)
 *   At the reviewed commits these eleven modules import no Node built-in and no package at
 *   all: they cannot read or write a file or open a socket. The diagnostic verifies that for
 *   the files it is about to load (step 2) and refuses to load them otherwise. It never loads
 *   `dhan_local_daemon.js`, which is a start script; the registry is filled here from the
 *   manifest with the same rule that file uses (records with disposition QUALIFIED and a
 *   mapping).
 *
 * INPUTS
 *   --csv <file>          the original broker CSV.
 *   --ipd-root <dir>      the IPD checkout whose compiled code and P7 manifest are examined.
 *   --capture-dir <dir>   optional. The capture root, a run folder, its LOCAL-ONLY folder or the
 *                         exact capture file. Enables the comparison with what was stored.
 *   --server-cwd <dir>    optional. The working directory the IPD server process was started
 *                         in. The server looks for the P7 manifest there first.
 *   --as-of <instant>     optional. The instant the company-level gate is asked about; a fixed
 *                         default keeps two runs identical. The qualification ignores it.
 *
 * SANITIZED OUTPUT
 *   Counts, SHA-256 digests of whole files, Git object ids of source files, a commit id, yes/no
 *   answers and values from closed vocabularies. It never prints a symbol, ISIN, company
 *   identifier, security identifier, file name, path, quantity, price, value or weight.
 *
 * WHAT IT IS NOT
 *   Not an identity assignment and not a repair: it writes nothing and classifies no holding
 *   for the record. Not proof of the reason computed at the import.
 */
import { createHash } from 'node:crypto';
import { closeSync, existsSync, openSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TOOL_VERSION = 'w04-broker-import-qualification-diagnostic/1';

const RECORDED = Object.freeze({
  csvSha256: 'a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107',
  captureSha256: 'c5dd51f51025e3e17e3b798164c6b8078fa5487392d8f0dfd96be9bb7c79eda3',
  manifestSha256: '13bd2ef18b3dc79ed3d78e78126c4c4ee431e83665847bcb948f6184e14078bc',
  holdings: 64,
  identityObject: 1,
  identityNull: 63,
});

/**
 * Git blob ids of the sources that decide a broker import's identity. Each id is the same at
 * IPD 1aee57f (the commit IRR pins), 1fded9d (the recorded host checkout) and b0388a2.
 * `brokerImportPersistence.ts` has a second accepted id: the version that keeps the
 * qualification outcome. Its identity decision is the same.
 */
const SOURCE_BLOBS = Object.freeze({
  'src/identity/d05_authenticated_universe_data.ts': ['b8f0ec8da046b66768f265f649476a819de67b65'],
  'src/identity/d05_broad_universe_data.ts': ['ad097ab511b947e318f07d8ce60ea9732e1f921e'],
  'src/identity/d05_listing_corrections.ts': ['1c6b42483240e59e21fe73f8bb4a5ec26fb75774'],
  'src/identity/mapping_store.ts': ['eec60c09e08ec45a29979abf25b21efddef448ae'],
  'src/identity/quarantine.ts': ['70c6f6580f6ade66eb31e7dee3adc4b52b10b010'],
  'src/identity/security_master.ts': ['60030e0c17f8b2a31977ce598c80b18dc52d6727'],
  'src/identity/governed_fixture_master.ts': ['fbdb54b0a3c6b83a5ed3f1fc6ff21dae0121f2de'],
  'src/identity/broker_observation_resolver.ts': ['e426d3d58208e551dd7ca196740fca9cd456b974'],
  'src/contracts/types.ts': ['a644c83351b030b0e76d76642475420ea7ef07c0'],
  'src/providers/dhan/dhan_instrument_map.ts': ['32113a687ae3002f883a2c3fae9b863cec99be45'],
  'src/providers/dhan/dhan_security_identity_service.ts': ['ef18605a6b33d3347c60eeb57639e0a453f44cb3'],
  'src/ipc/brokerImportComposition.ts': ['b6acecd92acab211ae325b750b5780b466bfd3b2'],
  'src/ipc/brokerImportConsumer.ts': ['975db3767ecf3fe60df95da6859c54943ac22b65'],
  'src/persistence/brokerImportPersistence.ts': ['72d88d1c3d1c74c12bd3840d8d03636ae88cee14', 'bec1dc814800612d013dac81d769decc134e3926'],
});

const ENTRY_MODULES = Object.freeze({
  master: 'dist/src/identity/governed_fixture_master.js',
  gate: 'dist/src/identity/broker_observation_resolver.js',
  registry: 'dist/src/providers/dhan/dhan_instrument_map.js',
  qualification: 'dist/src/providers/dhan/dhan_security_identity_service.js',
});
const MANIFEST_RELATIVE = 'evidence/dhan-p7/qualification-manifest.json';
const EXACT_CAPTURE_SCHEMA = 'iips.w11-dep1.owner-bound-portfolio-capture.exact/v1';
const LOCAL_ONLY_DIRECTORY = 'LOCAL-ONLY-DO-NOT-PUBLISH';
const EXACT_CAPTURE_FILE = 'exact-owner-bound-portfolio-capture.json';
const READ_LIMIT_BYTES = 67108864;
/** The instant the company-level gate is asked about. Fixed, so two runs give the same answer. */
const DEFAULT_AS_OF = '2026-11-13T00:00:00.000Z';
const MODULE_LIMIT = 64;

const REASONS = Object.freeze([
  'MISSING_ISIN', 'INVALID_ISIN_SYNTAX', 'MISSING_P04_CORRESPONDENCE', 'INACTIVE_OR_MISSING_LISTING',
  'MISSING_SERIES_EVIDENCE', 'MISSING_P7_MAPPING', 'AMBIGUOUS_PROVIDER_MAPPING', 'CONFLICTING_ISIN',
  'CONFLICTING_SERIES', 'EXCHANGE_MISMATCH', 'STALE_SOURCE_EVIDENCE',
]);
const GATE_STATUSES = Object.freeze(['RESOLVED', 'UNMAPPED', 'AMBIGUOUS']);
const SYSTEM_ERRORS = Object.freeze(['ENOENT', 'EACCES', 'EPERM', 'EISDIR', 'ENOTDIR', 'EBUSY', 'EMFILE', 'ERR_MODULE_NOT_FOUND', 'ERR_UNSUPPORTED_DIR_IMPORT']);
const ERROR_NAMES = Object.freeze(['SyntaxError', 'TypeError', 'RangeError', 'ReferenceError']);

/* ---------------------------------------------------------------- output */
const counters = { PASS: 0, FAIL: 0, WARN: 0, INFO: 0 };
const unresolved = [];
let currentStep = 'startup';
function line(level, id, text) {
  counters[level] += 1;
  process.stdout.write(`[${level}] ${id}: ${text}\n`);
}
const yn = (value) => (value ? 'yes' : 'no');
function check(id, ok, text) {
  line(ok ? 'PASS' : 'FAIL', id, `${text}: ${yn(ok)}`);
  if (!ok) unresolved.push(`CHECK_FAILED:${id}`);
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
const closed = (list, value) => (typeof value === 'string' && list.includes(value) ? value : 'OTHER');
function tally(target, key) {
  target[key] = (target[key] ?? 0) + 1;
}
function sorted(counts) {
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}
const show = (counts) => {
  const entries = Object.entries(sorted(counts));
  return entries.length === 0 ? 'none' : entries.map(([k, v]) => `${k} ${v}`).join(', ');
};
function readFileReadOnly(file) {
  const fd = openSync(file, 'r');
  try {
    return readFileSync(fd);
  } finally {
    closeSync(fd);
  }
}
const isFile = (file) => existsSync(file) && statSync(file).isFile();
/** The Git blob id of a file's content, with CRLF read as LF (a Windows checkout may convert). */
function gitBlobId(bytes) {
  const hasCrlf = bytes.includes(Buffer.from('\r\n'));
  const content = hasCrlf ? Buffer.from(bytes.toString('latin1').replace(/\r\n/g, '\n'), 'latin1') : bytes;
  const id = createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
  return { id, crlfConverted: hasCrlf };
}
class Stop extends Error {
  constructor(code) {
    super(code);
    this.name = 'Stop';
    this.stopCode = code;
  }
}

/* ============================================================================================
 * PORT BEGIN - IPD frontend/src/features/portfolio/import (csv-parser-helper.ts and
 * dhan-holdings-adapter.ts), type annotations removed, reduced to the three cells this
 * diagnostic needs. Same functions as in the lineage reproduction utility of 2026-11-14.
 * ========================================================================================== */
function parseCsvLine(text) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && i + 1 < text.length && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}
function parseCsvToObjects(csvText) {
  const allRows = [];
  for (const raw of csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')) {
    const trimmed = raw.trim();
    if (trimmed) allRows.push(parseCsvLine(trimmed));
  }
  if (allRows.length === 0) return { headers: [], rows: [] };
  const headers = allRows[0].map((h) => h.replace(/^["']|["']$/g, '').trim());
  const rows = [];
  for (let i = 1; i < allRows.length; i++) {
    const rowObj = {};
    let hasData = false;
    for (let j = 0; j < headers.length; j++) {
      const val = allRows[i][j] !== undefined ? allRows[i][j].replace(/^["']|["']$/g, '').trim() : '';
      rowObj[headers[j]] = val;
      if (val !== '') hasData = true;
    }
    if (hasData) rows.push(rowObj);
  }
  return { headers, rows };
}
const parseStringCell = (val) => (val === undefined || val === null ? '' : String(val).replace(/^["']|["']$/g, '').trim());
/** Symbol, ISIN and exchange of each row, exactly as the Dhan adapter and the mapper derive them. */
function parseDhanIdentifiers(textContent) {
  const { headers, rows } = parseCsvToObjects(textContent);
  const headerMap = new Map();
  for (const h of headers) headerMap.set(h.toLowerCase().trim(), h);
  const symbolCol = headerMap.get('trading symbol') || headerMap.get('symbol') || headerMap.get('stock name') || headerMap.get('name');
  const isinCol = headerMap.get('isin');
  const exchangeCol = headerMap.get('exchange');
  const out = [];
  let skippedEmptySymbol = 0;
  for (const row of rows) {
    const rawSymbol = symbolCol ? parseStringCell(row[symbolCol]) : '';
    if (!rawSymbol) {
      skippedEmptySymbol += 1;
      continue;
    }
    const isin = isinCol ? parseStringCell(row[isinCol]) : undefined;
    const rawExchange = exchangeCol ? parseStringCell(row[exchangeCol]).toUpperCase() : undefined;
    out.push({
      symbol: rawSymbol.trim().toUpperCase(),
      isin: isin ? isin.trim().toUpperCase() : undefined,
      exchange: rawExchange ? (rawExchange.includes('BSE') ? 'BSE' : 'NSE') : undefined,
    });
  }
  return { columns: { symbol: !!symbolCol, isin: !!isinCol, exchange: !!exchangeCol }, dataRows: rows.length, skippedEmptySymbol, rows: out };
}
/** The mapper's grouping: by ISIN when present, else by symbol. The first row of a group names it. */
function groupLikeTheMapper(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = row.isin ? `ISIN:${row.isin}` : `SYM:${row.symbol}`;
    if (!groups.has(key)) groups.set(key, { symbol: row.symbol || row.isin || 'UNKNOWN', isin: row.isin, exchange: row.exchange, rows: 1 });
    else groups.get(key).rows += 1;
  }
  return [...groups.values()];
}
/* ============================================================================================
 * PORT END
 * ========================================================================================== */

const USAGE = [
  'usage: node w04-broker-import-qualification-diagnostic.mjs --csv <file> --ipd-root <dir>',
  '            [--capture-dir <dir>] [--server-cwd <dir>] [--as-of <UTC ISO instant>]',
  '            [--expected-csv-sha256 <hex>] [--expected-capture-sha256 <hex>]',
  '',
  '  --csv <file>         the original broker CSV. Opened read-only.',
  '  --ipd-root <dir>     the IPD checkout to examine. Its compiled code (dist) must exist.',
  '  --capture-dir <dir>  optional: where the exact capture is. Enables the stored-state comparison.',
  '  --server-cwd <dir>   optional: the working directory the IPD server process was started in.',
  '  --as-of <instant>    optional: the instant the company-level gate is asked about.',
  `                       Default ${DEFAULT_AS_OF}. The qualification does not depend on it.`,
  '  The two --expected options replace the recorded digests; such a run is reported as not',
  '  being a run on the recorded inputs.',
].join('\n');

function parseArguments(argv) {
  const options = { csv: null, ipdRoot: null, captureDir: null, serverCwd: null, asOf: DEFAULT_AS_OF, expectedCsvSha256: RECORDED.csvSha256, expectedCaptureSha256: RECORDED.captureSha256, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = () => {
      i += 1;
      if (i >= argv.length) throw new Stop('ARGUMENT_VALUE_MISSING');
      return argv[i];
    };
    if (flag === '--csv') options.csv = value();
    else if (flag === '--ipd-root') options.ipdRoot = value();
    else if (flag === '--capture-dir') options.captureDir = value();
    else if (flag === '--server-cwd') options.serverCwd = value();
    else if (flag === '--as-of') options.asOf = value();
    else if (flag === '--expected-csv-sha256') options.expectedCsvSha256 = value().toLowerCase();
    else if (flag === '--expected-capture-sha256') options.expectedCaptureSha256 = value().toLowerCase();
    else if (flag === '--help' || flag === '-h') options.help = true;
    else throw new Stop('ARGUMENT_UNKNOWN');
  }
  if (options.help) return options;
  if (options.csv === null) throw new Stop('ARGUMENT_CSV_MISSING');
  if (options.ipdRoot === null) throw new Stop('ARGUMENT_IPD_ROOT_MISSING');
  if (!isHex64(options.expectedCsvSha256) || !isHex64(options.expectedCaptureSha256)) throw new Stop('ARGUMENT_EXPECTED_DIGEST_NOT_SHA256');
  options.ipdRoot = path.resolve(options.ipdRoot);
  if (!Number.isFinite(Date.parse(options.asOf)) || new Date(options.asOf).toISOString() !== options.asOf) throw new Stop('ARGUMENT_AS_OF_NOT_UTC_ISO_INSTANT');
  return options;
}

/* ---------------------------------------------------------------- step 1: the CSV */
function readCsv(options, payload) {
  section('1. Original CSV: digest verification and identifiers');
  const result = {};
  payload.csv = result;
  if (!isFile(options.csv)) throw new Stop('CSV_FILE_NOT_FOUND');
  if (statSync(options.csv).size > READ_LIMIT_BYTES) throw new Stop('CSV_FILE_TOO_LARGE');
  const bytes = readFileReadOnly(options.csv);
  const hasBom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  /* The import digests the UTF-8 encoding of the text the browser decoded. The two readings
   * differ only when the file starts with a byte-order mark. Both are computed. */
  const textWithoutBom = new TextDecoder('utf-8').decode(bytes);
  const textWithBom = new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);
  const digestWithoutBom = sha256(Buffer.from(textWithoutBom, 'utf8'));
  const digestWithBom = sha256(Buffer.from(textWithBom, 'utf8'));
  const keepBom = hasBom && digestWithoutBom !== options.expectedCsvSha256 && digestWithBom === options.expectedCsvSha256;
  const text = keepBom ? textWithBom : textWithoutBom;
  result.expected = options.expectedCsvSha256;
  result.expectedIsRecorded = options.expectedCsvSha256 === RECORDED.csvSha256;
  result.sha256ImportContent = keepBom ? digestWithBom : digestWithoutBom;
  line('INFO', 'csv.sha256.expected', result.expected);
  line('INFO', 'csv.sha256.importContent', result.sha256ImportContent);
  if (!check('csv.sha256', result.sha256ImportContent === options.expectedCsvSha256, 'import-content SHA-256 of the CSV equals the expected digest')) {
    throw new Stop('CSV_SHA256_NOT_EXPECTED');
  }
  if (!result.expectedIsRecorded) line('WARN', 'csv.override', 'the expected CSV digest was overridden; this is not a run on the recorded original CSV');

  const parsed = parseDhanIdentifiers(text);
  const groups = groupLikeTheMapper(parsed.rows);
  result.columns = parsed.columns;
  result.dataRows = parsed.dataRows;
  result.rowsWithSymbol = parsed.rows.length;
  result.holdingsAfterGrouping = groups.length;
  result.groupsWithIsin = groups.filter((g) => g.isin).length;
  result.groupsPerExchange = sorted(groups.reduce((acc, g) => (tally(acc, g.exchange ?? 'absent'), acc), {}));
  result.groupsWithIsinAndExchange = groups.filter((g) => g.isin && g.exchange).length;
  result.distinctSymbols = new Set(groups.map((g) => g.symbol)).size;
  check('csv.columns', parsed.columns.symbol && parsed.columns.isin && parsed.columns.exchange, 'the header has a symbol, an ISIN and an exchange column');
  line('INFO', 'csv.rows', `data rows ${result.dataRows}; rows with a symbol ${result.rowsWithSymbol}; holdings after the mapper's grouping ${result.holdingsAfterGrouping}`);
  line('INFO', 'csv.identifiers', `holdings with an ISIN ${result.groupsWithIsin}; with ISIN and exchange ${result.groupsWithIsinAndExchange}; per exchange: ${show(result.groupsPerExchange)}`);
  check('csv.symbols.distinct', result.distinctSymbols === groups.length, 'every holding has its own symbol (needed to pair with the capture)');
  if (groups.length === 0) throw new Stop('CSV_HAS_NO_HOLDINGS');
  return { groups };
}

/* ---------------------------------------------------------------- step 2: the checkout */
function headCommit(root) {
  try {
    const gitDir = path.join(root, '.git');
    if (!existsSync(gitDir) || !statSync(gitDir).isDirectory()) return null;
    const head = readFileReadOnly(path.join(gitDir, 'HEAD')).toString('utf8').trim();
    if (/^[0-9a-f]{40}$/.test(head)) return head;
    const ref = head.match(/^ref: (refs\/[A-Za-z0-9._\/-]+)$/);
    if (!ref) return null;
    const loose = path.join(gitDir, ...ref[1].split('/'));
    if (isFile(loose)) {
      const value = readFileReadOnly(loose).toString('utf8').trim();
      return /^[0-9a-f]{40}$/.test(value) ? value : null;
    }
    const packed = path.join(gitDir, 'packed-refs');
    if (isFile(packed)) {
      for (const entry of readFileReadOnly(packed).toString('utf8').split('\n')) {
        const m = entry.match(/^([0-9a-f]{40}) (\S+)$/);
        if (m && m[2] === ref[1]) return m[1];
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** The compiled modules reachable from the four entry modules, and every specifier they import. */
function compiledClosure(root) {
  const files = new Map();
  const outside = new Set();
  const queue = Object.values(ENTRY_MODULES).map((rel) => path.join(root, ...rel.split('/')));
  const distRoot = path.join(root, 'dist');
  while (queue.length > 0) {
    const file = queue.pop();
    if (files.has(file)) continue;
    if (files.size >= MODULE_LIMIT) throw new Stop('COMPILED_CLOSURE_TOO_LARGE');
    if (!isFile(file)) throw new Stop('COMPILED_MODULE_NOT_FOUND');
    const bytes = readFileReadOnly(file);
    files.set(file, bytes);
    const text = bytes.toString('utf8');
    const pattern = /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)/g;
    for (const m of text.matchAll(pattern)) {
      const specifier = m[1] || m[2] || m[3] || m[4];
      if (specifier.startsWith('.')) {
        const target = path.resolve(path.dirname(file), specifier);
        if (!target.startsWith(distRoot + path.sep)) outside.add('RELATIVE_OUTSIDE_DIST');
        else queue.push(target);
      } else {
        outside.add(specifier.startsWith('node:') ? 'NODE_BUILTIN' : 'PACKAGE_OR_BARE');
      }
    }
    if (/\bprocess\.(binding|dlopen)\b|\bglobalThis\.fetch\b|\bfetch\(/.test(text)) outside.add('RUNTIME_ESCAPE');
  }
  return { files, outside: [...outside].sort() };
}

function manifestFacts(file) {
  const facts = { present: isFile(file) };
  if (!facts.present) return { facts, mappings: [] };
  const bytes = readFileReadOnly(file);
  facts.sha256 = sha256(bytes);
  facts.equalsRecorded = facts.sha256 === RECORDED.manifestSha256;
  let parsed = null;
  try {
    /* The server reads this file with JSON.parse on the UTF-8 text, without removing a byte-order mark. */
    parsed = JSON.parse(bytes.toString('utf8'));
    facts.parsesAsTheServerReadsIt = true;
  } catch {
    facts.parsesAsTheServerReadsIt = false;
  }
  const records = parsed && Array.isArray(parsed.records) ? parsed.records : [];
  const mappings = records.filter((r) => isObject(r) && r.disposition === 'QUALIFIED' && isObject(r.mapping)).map((r) => r.mapping);
  facts.records = records.length;
  facts.qualifiedMappings = mappings.length;
  facts.distinctIsins = new Set(mappings.map((m) => (typeof m.isin === 'string' ? m.isin.toUpperCase() : null)).filter(Boolean)).size;
  return { facts, mappings };
}

function examineCheckout(options, payload) {
  section('2. IPD checkout: commit, sources, compiled code and P7 manifest');
  const root = options.ipdRoot;
  const result = {};
  payload.checkout = result;
  if (!existsSync(root) || !statSync(root).isDirectory()) throw new Stop('IPD_ROOT_NOT_FOUND');

  result.headCommit = headCommit(root);
  line('INFO', 'checkout.commit', result.headCommit ?? 'UNAVAILABLE (no readable .git directory)');

  const sources = { examined: 0, equalReviewed: 0, different: 0, missing: 0, crlfConverted: 0 };
  for (const [rel, accepted] of Object.entries(SOURCE_BLOBS)) {
    const file = path.join(root, ...rel.split('/'));
    if (!isFile(file)) {
      sources.missing += 1;
      continue;
    }
    sources.examined += 1;
    const blob = gitBlobId(readFileReadOnly(file));
    if (blob.crlfConverted) sources.crlfConverted += 1;
    if (accepted.includes(blob.id)) sources.equalReviewed += 1;
    else sources.different += 1;
  }
  result.sources = sources;
  const total = Object.keys(SOURCE_BLOBS).length;
  check('checkout.sources', sources.equalReviewed === total, `the ${total} identity-deciding source files equal the reviewed versions (${sources.equalReviewed} equal, ${sources.different} different, ${sources.missing} missing)`);
  if (sources.crlfConverted > 0) line('INFO', 'checkout.sources.crlf', `${sources.crlfConverted} file(s) have CRLF line endings; compared after reading CRLF as LF`);

  const closure = compiledClosure(root);
  result.compiled = { modules: closure.files.size, importsOutsideTheSet: closure.outside };
  line('INFO', 'checkout.compiled', `${closure.files.size} compiled module(s) reachable from the four entry modules`);
  if (!check('checkout.compiled.selfContained', closure.outside.length === 0, 'the compiled modules import no Node built-in, no package and nothing outside dist')) {
    throw new Stop('COMPILED_MODULES_NOT_SELF_CONTAINED');
  }
  const newestSource = Math.max(...Object.keys(SOURCE_BLOBS).map((rel) => path.join(root, ...rel.split('/'))).filter(isFile).map((f) => statSync(f).mtimeMs), 0);
  const oldestCompiled = Math.min(...[...closure.files.keys()].map((f) => statSync(f).mtimeMs));
  result.compiled.notOlderThanSources = oldestCompiled >= newestSource;
  line(result.compiled.notOlderThanSources ? 'INFO' : 'WARN', 'checkout.compiled.fresh', `every compiled module is at least as new as the newest of the source files: ${yn(result.compiled.notOlderThanSources)} (file times; a hint, not proof)`);

  const manifest = manifestFacts(path.join(root, ...MANIFEST_RELATIVE.split('/')));
  result.manifest = manifest.facts;
  if (!check('checkout.manifest.present', manifest.facts.present, 'the P7 qualification manifest exists in the checkout')) throw new Stop('MANIFEST_NOT_FOUND');
  line('INFO', 'checkout.manifest.sha256', manifest.facts.sha256);
  line(manifest.facts.equalsRecorded ? 'PASS' : 'WARN', 'checkout.manifest.recorded', `manifest SHA-256 equals the tracked one (${RECORDED.manifestSha256.slice(0, 12)}...): ${yn(manifest.facts.equalsRecorded)}`);
  line('INFO', 'checkout.manifest.content', `parses as the server reads it ${yn(manifest.facts.parsesAsTheServerReadsIt)}; records ${manifest.facts.records}; QUALIFIED mappings ${manifest.facts.qualifiedMappings}; distinct ISINs ${manifest.facts.distinctIsins}`);

  if (options.serverCwd !== null) {
    const atCwd = manifestFacts(path.join(options.serverCwd, ...MANIFEST_RELATIVE.split('/')));
    result.serverCwdManifest = { present: atCwd.facts.present, equalsCheckoutManifest: atCwd.facts.present ? atCwd.facts.sha256 === manifest.facts.sha256 : null, sha256: atCwd.facts.sha256 ?? null, qualifiedMappings: atCwd.facts.qualifiedMappings ?? null };
    line('INFO', 'serverCwd.manifest', atCwd.facts.present
      ? `a manifest exists under the server working directory (the server reads this one first): SHA-256 ${atCwd.facts.sha256}; equals the checkout manifest ${yn(result.serverCwdManifest.equalsCheckoutManifest)}; QUALIFIED mappings ${atCwd.facts.qualifiedMappings}`
      : 'no manifest under the server working directory; the server then falls back to the manifest beside its own code');
  } else {
    result.serverCwdManifest = 'NOT_EXAMINED';
    line('INFO', 'serverCwd.manifest', 'not examined (no --server-cwd). The server reads <working directory>/evidence/dhan-p7/qualification-manifest.json first, when it exists.');
  }
  return { mappings: manifest.mappings };
}

/* ---------------------------------------------------------------- step 3: qualification */
async function qualify(options, csv, checkout, payload) {
  section('3. Qualification of the CSV holdings with the compiled code of the checkout');
  const result = {};
  payload.qualification = result;
  const load = (rel) => import(pathToFileURL(path.join(options.ipdRoot, ...rel.split('/'))).href);
  const masterModule = await load(ENTRY_MODULES.master);
  const gateModule = await load(ENTRY_MODULES.gate);
  const registryModule = await load(ENTRY_MODULES.registry);
  const qualificationModule = await load(ENTRY_MODULES.qualification);
  const master = masterModule.getGovernedBroadSecurityMaster();
  const revision = master.sourceRevision ?? {};
  result.securityMaster = {
    batchId: typeof revision.batchId === 'string' ? revision.batchId : null,
    fileChecksumSha256: isHex64(revision.fileChecksumSha256) ? revision.fileChecksumSha256 : null,
    recordCount: Number.isSafeInteger(revision.recordCount) ? revision.recordCount : null,
  };
  line('INFO', 'master', `P04 master compiled into the code: batch ${result.securityMaster.batchId}; records ${result.securityMaster.recordCount}; source checksum ${result.securityMaster.fileChecksumSha256}`);

  /* The same rule as `loadGovernedP7InstrumentRegistry`: QUALIFIED records with a mapping. */
  const registry = new registryModule.DhanInstrumentRegistry();
  for (const mapping of checkout.mappings) registry.register(mapping);
  result.registryMappings = registry.list().length;
  line('INFO', 'registry', `P7 registry filled from the checkout manifest: ${result.registryMappings} mapping(s)`);

  const resolver = gateModule.createGovernedBrokerObservationResolver(master);
  const asOf = options.asOf;
  result.gateAsOf = asOf === DEFAULT_AS_OF ? 'DEFAULT_2026-11-13' : 'OVERRIDDEN';
  const gate = {};
  const outcome = {};
  const perExchange = {};
  const rows = [];
  for (const group of csv.groups) {
    const gateStatus = closed(GATE_STATUSES, resolver.resolve({ symbol: group.symbol, isin: group.isin, exchange: group.exchange }, asOf).status);
    tally(gate, gateStatus);
    let status;
    let securityId = null;
    if (group.isin && group.exchange) {
      const q = qualificationModule.qualifyHoldingSecurityIdentity({ isin: group.isin, exchange: group.exchange, symbol: group.symbol }, master, registry);
      if (q.status === 'QUALIFIED') {
        status = 'QUALIFIED';
        securityId = q.securityIdentity.securityId;
      } else {
        status = `UNRESOLVED:${closed(REASONS, q.reason)}`;
      }
    } else {
      status = group.isin ? 'NOT_ATTEMPTED:MISSING_EXCHANGE' : 'NOT_ATTEMPTED:MISSING_ISIN';
    }
    tally(outcome, status);
    tally(perExchange, `${group.exchange ?? 'absent'} ${status}`);
    rows.push({ symbol: group.symbol, isin: group.isin ?? null, status, securityId });
  }
  result.holdings = csv.groups.length;
  result.companyGate = sorted(gate);
  result.outcome = sorted(outcome);
  result.outcomePerExchange = sorted(perExchange);
  line('INFO', 'gate', `company-level gate today (asked as of ${result.gateAsOf === 'OVERRIDDEN' ? 'the instant given with --as-of' : DEFAULT_AS_OF}): ${show(gate)}`);
  line('INFO', 'qualification', `security-identity qualification today: ${show(outcome)}`);
  line('INFO', 'qualification.perExchange', show(perExchange));
  return { rows };
}

/* ---------------------------------------------------------------- step 4: the capture */
function candidateCaptureFiles(target) {
  const stat = statSync(target);
  if (stat.isFile()) return [target];
  if (!stat.isDirectory()) return [];
  const found = [];
  const consider = (file) => {
    if (isFile(file)) found.push(file);
  };
  consider(path.join(target, EXACT_CAPTURE_FILE));
  consider(path.join(target, LOCAL_ONLY_DIRECTORY, EXACT_CAPTURE_FILE));
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === LOCAL_ONLY_DIRECTORY) continue;
    consider(path.join(target, entry.name, LOCAL_ONLY_DIRECTORY, EXACT_CAPTURE_FILE));
    consider(path.join(target, entry.name, EXACT_CAPTURE_FILE));
  }
  return found;
}

function compareWithCapture(options, qualified, payload) {
  section('4. Comparison with the stored state of the capture');
  const result = {};
  payload.storedStateComparison = result;
  if (!existsSync(options.captureDir)) throw new Stop('CAPTURE_DIRECTORY_NOT_FOUND');
  let selected = null;
  for (const file of candidateCaptureFiles(options.captureDir)) {
    if (statSync(file).size > READ_LIMIT_BYTES) continue;
    const bytes = readFileReadOnly(file);
    if (sha256(bytes) === options.expectedCaptureSha256) {
      selected = bytes;
      break;
    }
  }
  result.expectedIsRecorded = options.expectedCaptureSha256 === RECORDED.captureSha256;
  if (!check('capture.sha256', selected !== null, 'an exact capture with the expected SHA-256 was found')) throw new Stop('NO_CAPTURE_WITH_EXPECTED_SHA256');
  if (!result.expectedIsRecorded) line('WARN', 'capture.override', 'the expected capture digest was overridden; this is not a run on the recorded capture');
  let doc;
  try {
    doc = JSON.parse(selected.toString('utf8').replace(/^\uFEFF/, ''));
  } catch {
    throw new Stop('CAPTURE_NOT_JSON');
  }
  if (!isObject(doc) || doc.schema !== EXACT_CAPTURE_SCHEMA) throw new Stop('CAPTURE_SCHEMA_UNEXPECTED');
  const get = (Array.isArray(doc.reads) ? doc.reads : []).find((r) => isObject(r) && r.operation === 'portfolio.get' && isObject(r.wireResult));
  const holdings = get && Array.isArray(get.wireResult.holdings) ? get.wireResult.holdings : null;
  if (holdings === null || holdings.length === 0) throw new Stop('CAPTURE_HAS_NO_HOLDINGS');

  const bySymbol = new Map(qualified.rows.map((row) => [row.symbol, row]));
  const table = {};
  let paired = 0;
  let unpaired = 0;
  let storedObjects = 0;
  let storedNulls = 0;
  let objectAgreesOnSecurityId = 0;
  let agree = 0;
  for (const h of holdings) {
    if (!isObject(h)) throw new Stop('CAPTURE_HOLDING_NOT_AN_OBJECT');
    const stored = isObject(h.securityIdentity) ? 'STORED_OBJECT' : 'STORED_NULL';
    if (stored === 'STORED_OBJECT') storedObjects += 1;
    else storedNulls += 1;
    const row = typeof h.symbol === 'string' ? bySymbol.get(h.symbol) : undefined;
    if (!row) {
      unpaired += 1;
      tally(table, `${stored} -> NOT_PAIRED_WITH_A_CSV_HOLDING`);
      continue;
    }
    paired += 1;
    tally(table, `${stored} -> ${row.status}`);
    const qualifiesNow = row.status === 'QUALIFIED';
    if (stored === 'STORED_OBJECT' && qualifiesNow && h.securityIdentity.securityId === row.securityId) objectAgreesOnSecurityId += 1;
    if ((stored === 'STORED_OBJECT') === qualifiesNow && (stored === 'STORED_NULL' || h.securityIdentity.securityId === row.securityId)) agree += 1;
  }
  result.holdings = holdings.length;
  result.storedObjects = storedObjects;
  result.storedNulls = storedNulls;
  result.paired = paired;
  result.unpaired = unpaired;
  result.table = sorted(table);
  result.storedObjectsWithTheSameSecurityIdToday = objectAgreesOnSecurityId;
  result.holdingsWhoseStoredStateIsReproducedToday = agree;
  line('INFO', 'capture.holdings', `holdings ${holdings.length}; identity object ${storedObjects}; identity null ${storedNulls}`);
  if (result.expectedIsRecorded) {
    check('capture.recorded', holdings.length === RECORDED.holdings && storedObjects === RECORDED.identityObject && storedNulls === RECORDED.identityNull, `the capture has the recorded shape (${RECORDED.holdings} holdings, ${RECORDED.identityObject} object, ${RECORDED.identityNull} null)`);
  }
  check('capture.paired', unpaired === 0 && paired === qualified.rows.length, `every stored holding is paired with one CSV holding and the reverse (${paired} of ${holdings.length}; CSV holdings ${qualified.rows.length})`);
  for (const [key, value] of Object.entries(result.table)) line('INFO', 'table', `${key}: ${value}`);
  line('INFO', 'capture.objects', `stored identity objects that qualify today to the same security identifier: ${objectAgreesOnSecurityId} of ${storedObjects}`);
  result.reproducesStoredState = unpaired === 0 && agree === holdings.length && paired === qualified.rows.length;
  check('reproduction', result.reproducesStoredState, `the sources of this checkout reproduce the stored identity state of every holding (${agree} of ${holdings.length})`);
  return result;
}

/* ---------------------------------------------------------------- result */
function finish(resultName, exitCode, payload) {
  const body = { tool: TOOL_VERSION, ...payload, unresolved: [...new Set(unresolved)], checks: { pass: counters.PASS, fail: counters.FAIL, warn: counters.WARN }, result: resultName };
  const json = JSON.stringify(body);
  process.stdout.write('\n== Result\n');
  process.stdout.write(`W04_QUALIFICATION_DIAGNOSTIC_RESULT_JSON: ${json}\n`);
  process.stdout.write(`W04_QUALIFICATION_DIAGNOSTIC_RESULT_JSON_SHA256: ${sha256Text(json)}\n`);
  process.stdout.write(`checks: ${counters.PASS} pass, ${counters.FAIL} fail, ${counters.WARN} warn\n`);
  process.stdout.write(`unresolved: ${body.unresolved.length === 0 ? 'none' : body.unresolved.join(', ')}\n`);
  process.stdout.write('This is a measurement against the sources of the checkout as they are now. It is not a record of the reason computed at the import, and it assigns no identity.\n');
  process.stdout.write(`RESULT: ${resultName}\n`);
  process.exitCode = exitCode;
}

async function main() {
  process.stdout.write(`W04 - broker import qualification diagnostic (${TOOL_VERSION}). Read-only. Sanitized output.\n`);
  const payload = { recordedInputs: null, csv: null, checkout: null, qualification: null, storedStateComparison: 'NOT_PERFORMED', identityAssigned: 'NONE' };
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${USAGE}\n`);
      process.exitCode = 0;
      return;
    }
    payload.recordedInputs = { csv: options.expectedCsvSha256 === RECORDED.csvSha256, capture: options.captureDir === null ? null : options.expectedCaptureSha256 === RECORDED.captureSha256 };
    const csv = readCsv(options, payload);
    const checkout = examineCheckout(options, payload);
    const qualified = await qualify(options, csv, checkout, payload);
    if (options.captureDir === null) {
      section('4. Comparison with the stored state of the capture');
      line('INFO', 'capture', 'not performed (no --capture-dir). The counts of step 3 stand alone.');
      finish(counters.FAIL === 0 ? 'COUNTS_ONLY_NO_CAPTURE' : 'COUNTS_ONLY_WITH_FAILED_CHECKS', counters.FAIL === 0 ? 0 : 1, payload);
      return;
    }
    const comparison = compareWithCapture(options, qualified, payload);
    if (comparison.reproducesStoredState && counters.FAIL === 0) finish('REPRODUCES_STORED_STATE', 0, payload);
    else if (comparison.unpaired === 0 && comparison.paired === qualified.rows.length) finish('DIFFERS_FROM_STORED_STATE', 1, payload);
    else finish('PARTIAL', 1, payload);
  } catch (error) {
    let code = 'UNEXPECTED_ERROR';
    let where = '';
    if (error instanceof Stop) {
      code = error.stopCode;
    } else {
      /* Never the message: it can quote a path or a value. */
      if (error && typeof error.code === 'string' && SYSTEM_ERRORS.includes(error.code)) code = `UNEXPECTED_ERROR_${error.code}`;
      else if (error && ERROR_NAMES.includes(error.name)) code = `UNEXPECTED_ERROR_${error.name}`;
      const frame = String(error && error.stack).match(/w04-broker-import-qualification-diagnostic\.mjs:(\d+):\d+/);
      if (frame) where = ` (diagnostic source line ${frame[1]})`;
    }
    unresolved.push(`STOPPED:${code}`);
    process.stdout.write(`\n[STOP] ${code} at step: ${currentStep}${where}\n`);
    if (code.startsWith('ARGUMENT_')) process.stdout.write(`${USAGE}\n`);
    process.stdout.write('Nothing further was examined. No holding was classified.\n');
    finish('INCONCLUSIVE', 2, payload);
  }
}

await main();
