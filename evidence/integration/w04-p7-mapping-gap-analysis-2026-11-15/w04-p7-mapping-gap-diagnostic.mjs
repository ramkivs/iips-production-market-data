#!/usr/bin/env node
/**
 * W04 - read-only diagnostic: for every holding of the original broker CSV, why does the
 * security-identity qualification of an IPD checkout qualify it or return a typed reason, and
 * where on the path from the governed source data to the runtime does a missing mapping arise?
 *
 * PURPOSE
 *   The qualification diagnostic of 2026-11-15 gave counts: 1 QUALIFIED, 63 MISSING_P7_MAPPING.
 *   This diagnostic gives one pseudonymised row per holding (H01, H02, ...) and compares the
 *   holding with four things:
 *     1. the P04 master compiled into the checkout (company, active listing on the exchange);
 *     2. the tracked P7 registry (the QUALIFIED records of the qualification manifest);
 *     3. the retained official Dhan instrument master (the authoritative source of a mapping);
 *     4. the registry the UNCHANGED generator of the checkout produces, in memory, from that
 *        retained source and the P04 master of today.
 *   It then states one category per holding from a closed list.
 *
 * READ-ONLY
 *   Node built-ins used: node:crypto, node:fs, node:path, node:url. No network module, no child
 *   process, no database module. Every file is opened with the 'r' flag. There is no write,
 *   rename, delete or mkdir call. It does not start, stop or contact IPD or IRR, does not open
 *   the portfolio database or any journal, and does not run git. The registry of item 4 exists
 *   only in the memory of this process; no manifest is written and no registry is changed.
 *
 *   It loads six COMPILED modules of the named checkout, and the seven they import:
 *     dist/src/identity/governed_fixture_master.js                     (the P04 masters, compiled in)
 *     dist/src/identity/broker_observation_resolver.js                 (the company-level gate)
 *     dist/src/providers/dhan/dhan_instrument_map.js                   (the P7 registry class)
 *     dist/src/providers/dhan/dhan_security_identity_service.js        (the runtime qualification)
 *     dist/src/providers/dhan/dhan_instrument_master_parser.js         (the generator's parser)
 *     dist/src/providers/dhan/dhan_instrument_master_qualification.js  (the generator's rule)
 *   At the reviewed commits these thirteen modules import no Node built-in and no package. The
 *   diagnostic checks that for the files it is about to load and refuses to load them otherwise.
 *   It never loads `scripts/dhan-p7-qualify.mjs` (the generator's runner, which writes the
 *   manifest) and never loads `dhan_local_daemon.js`.
 *
 * INPUTS
 *   --csv <file>        the original broker CSV.
 *   --ipd-root <dir>    the IPD checkout whose compiled code, P7 manifest and retained Dhan
 *                       master are examined.
 *
 * LABELS
 *   A holding is the mapper's group (by ISIN when present, else by symbol). Labels H01, H02, ...
 *   are given in ascending order of SHA-256("<ISIN>|<exchange>"). The order does not follow the
 *   file and says nothing about a holding. The hash itself is never printed.
 *
 * SANITIZED OUTPUT
 *   Labels, counts, SHA-256 digests of whole files, Git object ids of source files, one commit
 *   id, yes/no answers, exchange (NSE/BSE), series codes of at most three characters and values
 *   from closed vocabularies. It never prints a symbol, ISIN, company identifier, security
 *   identifier, provider identifier, line number of the source, file name, path, quantity,
 *   price, value or weight.
 *
 * WHAT IT IS NOT
 *   Not an identity assignment, not a registry regeneration and not a repair. It writes nothing.
 */
import { createHash } from 'node:crypto';
import { closeSync, existsSync, openSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TOOL_VERSION = 'w04-p7-mapping-gap-diagnostic/1';

const RECORDED = Object.freeze({
  csvSha256: 'a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107',
  manifestSha256: '13bd2ef18b3dc79ed3d78e78126c4c4ee431e83665847bcb948f6184e14078bc',
  sourceSha256: '6f19feb4abd513843eaf2f139a27f17ccb660233f95ad385d11aa92c322a010d',
  /* Retrieval instant of the retained detailed master (evidence/dhan-p7/source-retrieval-manifest.json). */
  sourceRetrievedAtUtc: '2026-11-06T05:27:53.7922492Z',
  master: Object.freeze({
    batchId: 'BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001',
    fileChecksumSha256: 'b555fd28589a03ea5cbb11c92f880468bcc4b63f449b853a18542aca5817d4c4',
    recordCount: 2390,
  }),
  legacyMaster: Object.freeze({ batchId: 'BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001', recordCount: 2250 }),
  /* Principal-executed qualification diagnostic, 2026-11-15. */
  baseline: Object.freeze({ holdings: 64, qualified: 1, missingP7Mapping: 63, nse: 63, bse: 1 }),
  /* Measured in the sandbox on the reviewed sources (in memory, nothing written). */
  trackedRegistry: Object.freeze({ mappings: 96, isins: 48, companyIdDiffers: 6 }),
  rerun: Object.freeze({ qualified: 4680, coverage: 'BSE:A 700, BSE:B 1590, NSE:EQ 2390', trackedReproduced: 90 }),
});

/**
 * Git blob ids of the sources that decide a broker import's identity and of the two sources of
 * the registry generator. Each id is the same at IPD 1aee57f (the commit IRR pins), 1fded9d (the
 * recorded host checkout) and a6abac7, except `brokerImportPersistence.ts`, which has a second
 * accepted id: the version that keeps the qualification outcome. Its identity decision is the same.
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
  'src/providers/dhan/dhan_instrument_master_parser.ts': ['25aeb86fb9bc7a40da9c20a2572f9be4c194cfd4'],
  'src/providers/dhan/dhan_instrument_master_qualification.ts': ['08090103c6d5245989847609458029b27281f97b'],
  'src/ipc/brokerImportComposition.ts': ['b6acecd92acab211ae325b750b5780b466bfd3b2'],
  'src/ipc/brokerImportConsumer.ts': ['975db3767ecf3fe60df95da6859c54943ac22b65'],
  'src/persistence/brokerImportPersistence.ts': ['72d88d1c3d1c74c12bd3840d8d03636ae88cee14', 'bec1dc814800612d013dac81d769decc134e3926'],
});

const ENTRY_MODULES = Object.freeze({
  master: 'dist/src/identity/governed_fixture_master.js',
  gate: 'dist/src/identity/broker_observation_resolver.js',
  registry: 'dist/src/providers/dhan/dhan_instrument_map.js',
  qualification: 'dist/src/providers/dhan/dhan_security_identity_service.js',
  parser: 'dist/src/providers/dhan/dhan_instrument_master_parser.js',
  generator: 'dist/src/providers/dhan/dhan_instrument_master_qualification.js',
});
const MANIFEST_RELATIVE = 'evidence/dhan-p7/qualification-manifest.json';
const SOURCE_RELATIVE = 'evidence/dhan-p7/source/api-scrip-master-detailed.csv';
const READ_LIMIT_BYTES = 134217728;
/** The instant the company-level gate is asked about. Fixed, so two runs give the same answer. */
const DEFAULT_AS_OF = '2026-11-13T00:00:00.000Z';
const MODULE_LIMIT = 64;

const REASONS = Object.freeze([
  'MISSING_ISIN', 'INVALID_ISIN_SYNTAX', 'MISSING_P04_CORRESPONDENCE', 'INACTIVE_OR_MISSING_LISTING',
  'MISSING_SERIES_EVIDENCE', 'MISSING_P7_MAPPING', 'AMBIGUOUS_PROVIDER_MAPPING', 'CONFLICTING_ISIN',
  'CONFLICTING_SERIES', 'EXCHANGE_MISMATCH', 'STALE_SOURCE_EVIDENCE',
]);
const GATE_STATUSES = Object.freeze(['RESOLVED', 'UNMAPPED', 'AMBIGUOUS']);
const DISPOSITIONS = Object.freeze([
  'QUALIFIED', 'REJECTED_SCHEMA', 'REJECTED_NOT_EQUITY', 'REJECTED_INVALID_FIELD', 'REJECTED_NO_P04_CORRESPONDENCE',
  'REJECTED_AMBIGUOUS_IDENTITY', 'DUPLICATE_IDENTITY', 'CONFLICTING_PROVIDER_ID',
]);
const PROVENANCES = Object.freeze(['DHAN_INSTRUMENT_MASTER', 'SYNTHETIC_PRE_ACCESS_FIXTURE']);
const SEGMENTS = Object.freeze(['NSE_EQ', 'BSE_EQ']);
const CATEGORIES = Object.freeze([
  'QUALIFIED_BY_EXACT_MAPPING',
  'REGISTRY_NOT_REGENERATED__ISIN_ABSENT',
  'REGISTRY_NOT_REGENERATED__COMPANY_ID_CHANGED',
  'REGISTRY_NOT_REGENERATED__OTHER',
  'SOURCE_MAPPING_MISSING',
  'GENERATION_RULE_REJECTS_SOURCE_ROW',
  'QUALIFICATION_RULE_REJECTS_REGENERATED_MAPPING',
  'NOT_A_P7_MAPPING_GAP',
]);
const SYSTEM_ERRORS = Object.freeze(['ENOENT', 'EACCES', 'EPERM', 'EISDIR', 'ENOTDIR', 'EBUSY', 'EMFILE', 'ERR_MODULE_NOT_FOUND', 'ERR_UNSUPPORTED_DIR_IMPORT', 'ERR_ACCESS_DENIED']);
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
const upper = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');
/** A series code as the source gives it, when it is a short code; never free text. */
const seriesCode = (value) => (typeof value === 'string' && /^[A-Z0-9]{1,3}$/.test(value) ? value : 'OTHER');
const seriesOfSecurityId = (value) => (typeof value === 'string' ? seriesCode(value.split(':')[2] ?? '') : 'OTHER');
const joined = (values) => {
  const list = [...new Set(values)].sort();
  return list.length === 0 ? 'none' : list.join('+');
};
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
const withoutCrlf = (bytes) => Buffer.from(bytes.toString('latin1').replace(/\r\n/g, '\n'), 'latin1');
/** The Git blob id of a file's content, with CRLF read as LF (a Windows checkout may convert). */
function gitBlobId(bytes) {
  const hasCrlf = bytes.includes(Buffer.from('\r\n'));
  const content = hasCrlf ? withoutCrlf(bytes) : bytes;
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
 * diagnostic needs. Same functions as in the qualification diagnostic of 2026-11-15.
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
  'usage: node w04-p7-mapping-gap-diagnostic.mjs --csv <file> --ipd-root <dir>',
  '            [--as-of <UTC ISO instant>] [--expected-csv-sha256 <hex>] [--expected-source-sha256 <hex>]',
  '',
  '  --csv <file>       the original broker CSV. Opened read-only.',
  '  --ipd-root <dir>   the IPD checkout to examine. Its compiled code (dist), its P7 manifest and',
  '                     its retained Dhan instrument master must exist.',
  '  --as-of <instant>  optional: the instant the company-level gate is asked about.',
  `                     Default ${DEFAULT_AS_OF}. The qualification does not depend on it.`,
  '  The two --expected options replace the recorded digests; such a run is reported as not',
  '  being a run on the recorded inputs.',
].join('\n');

function parseArguments(argv) {
  const options = { csv: null, ipdRoot: null, asOf: DEFAULT_AS_OF, expectedCsvSha256: RECORDED.csvSha256, expectedSourceSha256: RECORDED.sourceSha256, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = () => {
      i += 1;
      if (i >= argv.length) throw new Stop('ARGUMENT_VALUE_MISSING');
      return argv[i];
    };
    if (flag === '--csv') options.csv = value();
    else if (flag === '--ipd-root') options.ipdRoot = value();
    else if (flag === '--as-of') options.asOf = value();
    else if (flag === '--expected-csv-sha256') options.expectedCsvSha256 = value().toLowerCase();
    else if (flag === '--expected-source-sha256') options.expectedSourceSha256 = value().toLowerCase();
    else if (flag === '--help' || flag === '-h') options.help = true;
    else throw new Stop('ARGUMENT_UNKNOWN');
  }
  if (options.help) return options;
  if (options.csv === null) throw new Stop('ARGUMENT_CSV_MISSING');
  if (options.ipdRoot === null) throw new Stop('ARGUMENT_IPD_ROOT_MISSING');
  if (!isHex64(options.expectedCsvSha256) || !isHex64(options.expectedSourceSha256)) throw new Stop('ARGUMENT_EXPECTED_DIGEST_NOT_SHA256');
  options.ipdRoot = path.resolve(options.ipdRoot);
  if (!Number.isFinite(Date.parse(options.asOf)) || new Date(options.asOf).toISOString() !== options.asOf) throw new Stop('ARGUMENT_AS_OF_NOT_UTC_ISO_INSTANT');
  return options;
}

/* ---------------------------------------------------------------- step 1: the CSV */
function readCsv(options, payload) {
  section('1. Original CSV: digest verification and holdings');
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
  result.holdings = groups.length;
  result.holdingsWithIsinAndExchange = groups.filter((g) => g.isin && g.exchange).length;
  result.holdingsPerExchange = sorted(groups.reduce((acc, g) => (tally(acc, g.exchange ?? 'absent'), acc), {}));
  check('csv.columns', parsed.columns.symbol && parsed.columns.isin && parsed.columns.exchange, 'the header has a symbol, an ISIN and an exchange column');
  line('INFO', 'csv.holdings', `data rows ${result.dataRows}; holdings after the mapper's grouping ${result.holdings}; with ISIN and exchange ${result.holdingsWithIsinAndExchange}; per exchange: ${show(result.holdingsPerExchange)}`);
  if (groups.length === 0) throw new Stop('CSV_HAS_NO_HOLDINGS');
  if (groups.length > 999) throw new Stop('CSV_HAS_TOO_MANY_HOLDINGS');

  /* Labels: ascending SHA-256 of "<ISIN>|<exchange>". Two holdings never share the key: the
   * mapper groups by ISIN. The hash is used for the order only and is never printed. */
  const keyed = groups.map((g) => ({ ...g, order: sha256Text(`${g.isin ?? `SYM:${g.symbol}`}|${g.exchange ?? ''}`) }));
  keyed.sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
  const width = Math.max(2, String(keyed.length).length);
  keyed.forEach((g, index) => {
    g.label = `H${String(index + 1).padStart(width, '0')}`;
  });
  return { groups: keyed };
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

/** The compiled modules reachable from the entry modules, and every specifier they import. */
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
    if (/\bprocess\b|\bglobalThis\b|\beval\s*\(|\bnew Function\b|\bimport\s*\(|\brequire\s*\(|\bfetch\s*\(|\bWebSocket\b/.test(text)) outside.add('RUNTIME_ESCAPE');
  }
  return { files, outside: [...outside].sort() };
}

function examineCheckout(options, payload) {
  section('2. IPD checkout: commit, sources, compiled code, P7 manifest and retained Dhan master');
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
  check('checkout.sources', sources.equalReviewed === total, `the ${total} source files (identity decision and registry generator) equal the reviewed versions (${sources.equalReviewed} equal, ${sources.different} different, ${sources.missing} missing)`);
  if (sources.crlfConverted > 0) line('INFO', 'checkout.sources.crlf', `${sources.crlfConverted} file(s) have CRLF line endings; compared after reading CRLF as LF`);

  const closure = compiledClosure(root);
  result.compiled = { modules: closure.files.size, importsOutsideTheSet: closure.outside };
  line('INFO', 'checkout.compiled', `${closure.files.size} compiled module(s) reachable from the six entry modules`);
  if (!check('checkout.compiled.selfContained', closure.outside.length === 0, 'the compiled modules import no Node built-in, no package and nothing outside dist, and use no process, eval or dynamic import')) {
    throw new Stop('COMPILED_MODULES_NOT_SELF_CONTAINED');
  }
  const newestSource = Math.max(...Object.keys(SOURCE_BLOBS).map((rel) => path.join(root, ...rel.split('/'))).filter(isFile).map((f) => statSync(f).mtimeMs), 0);
  const oldestCompiled = Math.min(...[...closure.files.keys()].map((f) => statSync(f).mtimeMs));
  result.compiled.notOlderThanSources = oldestCompiled >= newestSource;
  line(result.compiled.notOlderThanSources ? 'INFO' : 'WARN', 'checkout.compiled.fresh', `every compiled module is at least as new as the newest of the source files: ${yn(result.compiled.notOlderThanSources)} (file times; a hint, not proof)`);

  /* The tracked P7 manifest: what the server loads into its registry. */
  const manifestFile = path.join(root, ...MANIFEST_RELATIVE.split('/'));
  if (!check('checkout.manifest.present', isFile(manifestFile), 'the P7 qualification manifest exists in the checkout')) throw new Stop('MANIFEST_NOT_FOUND');
  const manifestBytes = readFileReadOnly(manifestFile);
  const manifestSha = sha256(manifestBytes);
  result.manifest = { sha256: manifestSha, equalsRecorded: manifestSha === RECORDED.manifestSha256 };
  line('INFO', 'checkout.manifest.sha256', manifestSha);
  line(result.manifest.equalsRecorded ? 'PASS' : 'WARN', 'checkout.manifest.recorded', `manifest SHA-256 equals the tracked one (${RECORDED.manifestSha256.slice(0, 12)}...): ${yn(result.manifest.equalsRecorded)}`);
  let manifest;
  try {
    /* The server reads this file with JSON.parse on the UTF-8 text, without removing a byte-order mark. */
    manifest = JSON.parse(manifestBytes.toString('utf8'));
  } catch {
    throw new Stop('MANIFEST_NOT_JSON');
  }
  const records = isObject(manifest) && Array.isArray(manifest.records) ? manifest.records.filter(isObject) : [];
  result.manifest.records = records.length;
  result.manifest.recordsByDisposition = sorted(records.reduce((acc, r) => (tally(acc, closed(DISPOSITIONS, r.disposition)), acc), {}));
  line('INFO', 'checkout.manifest.records', `records kept in the manifest ${records.length}; by disposition: ${show(result.manifest.recordsByDisposition)}`);

  /* The retained official Dhan instrument master: the source the generator reads. */
  const sourceFile = path.join(root, ...SOURCE_RELATIVE.split('/'));
  if (!check('checkout.source.present', isFile(sourceFile), 'the retained Dhan instrument master (detailed) exists in the checkout')) throw new Stop('SOURCE_MASTER_NOT_FOUND');
  if (statSync(sourceFile).size > READ_LIMIT_BYTES) throw new Stop('SOURCE_MASTER_TOO_LARGE');
  let sourceBytes = readFileReadOnly(sourceFile);
  let sourceSha = sha256(sourceBytes);
  result.source = { expected: options.expectedSourceSha256, expectedIsRecorded: options.expectedSourceSha256 === RECORDED.sourceSha256, crlfConverted: false };
  if (sourceSha !== options.expectedSourceSha256 && sourceBytes.includes(Buffer.from('\r\n'))) {
    const converted = withoutCrlf(sourceBytes);
    if (sha256(converted) === options.expectedSourceSha256) {
      sourceBytes = converted;
      sourceSha = options.expectedSourceSha256;
      result.source.crlfConverted = true;
      line('INFO', 'checkout.source.crlf', 'the retained master has CRLF line endings; compared and read after reading CRLF as LF');
    }
  }
  result.source.sha256 = sourceSha;
  line('INFO', 'checkout.source.sha256', sourceSha);
  if (!check('checkout.source.recorded', sourceSha === options.expectedSourceSha256, 'SHA-256 of the retained Dhan master equals the expected digest')) throw new Stop('SOURCE_MASTER_SHA256_NOT_EXPECTED');
  if (!result.source.expectedIsRecorded) line('WARN', 'checkout.source.override', 'the expected digest of the Dhan master was overridden; this is not a run on the retained official snapshot');
  return { records, sourceText: sourceBytes.toString('utf8') };
}

/* ---------------------------------------------------------------- step 3: the path */
async function tracePath(options, checkout, payload) {
  section('3. From the governed source to the registry: tracked registry and in-memory re-run');
  const result = {};
  payload.path = result;
  const load = (rel) => import(pathToFileURL(path.join(options.ipdRoot, ...rel.split('/'))).href);
  const masterModule = await load(ENTRY_MODULES.master);
  const gateModule = await load(ENTRY_MODULES.gate);
  const registryModule = await load(ENTRY_MODULES.registry);
  const qualificationModule = await load(ENTRY_MODULES.qualification);
  const parserModule = await load(ENTRY_MODULES.parser);
  const generatorModule = await load(ENTRY_MODULES.generator);

  /* P04 master of today. */
  const master = masterModule.getGovernedBroadSecurityMaster();
  const revision = master.sourceRevision ?? {};
  result.securityMaster = {
    batchId: typeof revision.batchId === 'string' && /^[A-Z0-9-]{1,80}$/.test(revision.batchId) ? revision.batchId : 'OTHER',
    fileChecksumSha256: isHex64(revision.fileChecksumSha256) ? revision.fileChecksumSha256 : null,
    recordCount: Number.isSafeInteger(revision.recordCount) ? revision.recordCount : null,
  };
  line('INFO', 'master', `P04 master compiled into the code: batch ${result.securityMaster.batchId}; records ${result.securityMaster.recordCount}; source checksum ${result.securityMaster.fileChecksumSha256}`);
  const masterIsRecorded = result.securityMaster.batchId === RECORDED.master.batchId && result.securityMaster.fileChecksumSha256 === RECORDED.master.fileChecksumSha256 && result.securityMaster.recordCount === RECORDED.master.recordCount;
  line(masterIsRecorded ? 'PASS' : 'WARN', 'master.recorded', `the P04 master is the tracked one (batch of 2026-11-08, 2390 records): ${yn(masterIsRecorded)}`);
  const p04CompanyOfIsin = (isin) => {
    try {
      const companyId = master.resolveCompanyId({ identifierType: 'ISIN', identifierValue: isin });
      return typeof companyId === 'string' && companyId ? companyId : null;
    } catch {
      return null;
    }
  };

  /* Tracked registry, filled with the same rule as `loadGovernedP7InstrumentRegistry`. */
  const trackedMappings = checkout.records.filter((r) => r.disposition === 'QUALIFIED' && isObject(r.mapping)).map((r) => r.mapping);
  const trackedRegistry = new registryModule.DhanInstrumentRegistry();
  for (const mapping of trackedMappings) trackedRegistry.register(mapping);
  const trackedByIsin = new Map();
  for (const mapping of trackedRegistry.list()) {
    const isin = upper(mapping.isin);
    if (!trackedByIsin.has(isin)) trackedByIsin.set(isin, []);
    trackedByIsin.get(isin).push(mapping);
  }
  const trackedShape = { SAME_COMPANY_ID: 0, COMPANY_ID_DIFFERS: 0, ISIN_NOT_IN_P04: 0 };
  for (const mapping of trackedRegistry.list()) {
    const companyId = p04CompanyOfIsin(upper(mapping.isin));
    tally(trackedShape, companyId === null ? 'ISIN_NOT_IN_P04' : upper(companyId) === upper(mapping.companyId) ? 'SAME_COMPANY_ID' : 'COMPANY_ID_DIFFERS');
  }
  result.trackedRegistry = {
    mappings: trackedRegistry.list().length,
    distinctIsins: trackedByIsin.size,
    exchangesPerIsin: sorted([...trackedByIsin.values()].reduce((acc, list) => (tally(acc, joined(list.map((m) => closed(['NSE', 'BSE'], m.exchange)))), acc), {})),
    coverage: sorted(trackedRegistry.list().reduce((acc, m) => (tally(acc, `${closed(['NSE', 'BSE'], m.exchange)}:${seriesOfSecurityId(m.securityId)}`), acc), {})),
    againstP04Today: trackedShape,
  };
  line('INFO', 'registry.tracked', `tracked P7 registry: ${result.trackedRegistry.mappings} mapping(s); distinct ISINs ${result.trackedRegistry.distinctIsins}; exchanges per ISIN: ${show(result.trackedRegistry.exchangesPerIsin)}; exchange:series: ${show(result.trackedRegistry.coverage)}`);
  line('INFO', 'registry.tracked.p04', `tracked mappings against the P04 master of today: company id equal ${trackedShape.SAME_COMPANY_ID}; company id different ${trackedShape.COMPANY_ID_DIFFERS}; ISIN not in P04 ${trackedShape.ISIN_NOT_IN_P04}`);
  /* Records the loader does not load: any disposition other than QUALIFIED. */
  const excludedByIsin = new Map();
  for (const record of checkout.records) {
    if (record.disposition === 'QUALIFIED') continue;
    const isin = upper(record.isin ?? (isObject(record.mapping) ? record.mapping.isin : ''));
    if (!isin) continue;
    if (!excludedByIsin.has(isin)) excludedByIsin.set(isin, []);
    excludedByIsin.get(isin).push(closed(DISPOSITIONS, record.disposition));
  }
  result.manifestRecordsNotLoaded = { withAnIsin: [...excludedByIsin.values()].reduce((n, list) => n + list.length, 0) };
  line('INFO', 'registry.tracked.notLoaded', `manifest records that are not QUALIFIED and carry an ISIN: ${result.manifestRecordsNotLoaded.withAnIsin}`);

  /* The retained source, parsed by the generator's own parser. */
  const parsed = parserModule.parseInstrumentMasterCsv(checkout.sourceText, parserModule.DETAILED_REQUIRED_COLUMNS);
  if (parsed.schemaError) throw new Stop('SOURCE_MASTER_SCHEMA_ERROR');
  const sourceEvidence = { url: 'RETAINED_SNAPSHOT', retrievedAtUtc: RECORDED.sourceRetrievedAtUtc, httpStatus: 200, contentType: 'text/csv', contentLength: 0, rawSha256: '', byteSize: 0, ok: true };

  /* Re-run A: the unchanged generator against the LEGACY P04 master (batch of 2026-09-22). */
  const mappingText = (m) => JSON.stringify([m.companyId, m.isin, m.securityId, m.exchange, m.symbol, m.exchangeSegment, m.dhanSecurityId, m.mappingProvenance, m.instrumentType, m.active, m.lastVerifiedAt]);
  const trackedText = trackedMappings.map(mappingText);
  if (typeof masterModule.getGovernedLegacyWave1SecurityMaster === 'function') {
    const legacy = masterModule.getGovernedLegacyWave1SecurityMaster();
    const legacyRevision = legacy.sourceRevision ?? {};
    const legacyRun = generatorModule.qualifyInstrumentMaster(parsed, legacy, sourceEvidence);
    const legacyText = legacyRun.manifest.records.filter((r) => r.disposition === 'QUALIFIED').map((r) => mappingText(r.mapping));
    result.rerunLegacyMaster = {
      masterIsRecorded: legacyRevision.batchId === RECORDED.legacyMaster.batchId && legacyRevision.recordCount === RECORDED.legacyMaster.recordCount,
      qualified: legacyRun.manifest.qualified,
      equalsTrackedRegistry: legacyText.length === trackedText.length && legacyText.every((t, i) => t === trackedText[i]),
    };
    line('INFO', 'rerun.legacyMaster', `unchanged generator, retained source, LEGACY P04 master (batch of 2026-09-22, ${RECORDED.legacyMaster.recordCount} records; is that master ${yn(result.rerunLegacyMaster.masterIsRecorded)}): QUALIFIED ${legacyRun.manifest.qualified}`);
    check('rerun.legacyMaster.equalsTracked', result.rerunLegacyMaster.equalsTrackedRegistry, 'that re-run gives exactly the mappings of the tracked registry, in the same order and in every member');
  } else {
    result.rerunLegacyMaster = 'LEGACY_MASTER_NOT_IN_THIS_CHECKOUT';
    line('WARN', 'rerun.legacyMaster', 'the legacy P04 master is not exported by this checkout; the origin of the tracked registry is not re-derived here');
  }

  /* Re-run B: the unchanged generator against the P04 master of today. In memory only. */
  const rerun = generatorModule.qualifyInstrumentMaster(parsed, master, sourceEvidence);
  const rerunText = new Set(rerun.registry.list().map(mappingText));
  result.rerunMasterOfToday = {
    sourceRows: rerun.manifest.totalRows,
    equityCandidates: rerun.manifest.equityCandidates,
    counts: sorted(Object.fromEntries(Object.entries(rerun.manifest.counts).map(([k, v]) => [closed(DISPOSITIONS, k), v]))),
    coverage: sorted(Object.fromEntries(Object.entries(rerun.manifest.coverageByExchangeSeries).map(([k, v]) => [`${closed(['NSE', 'BSE'], k.split(':')[0])}:${seriesCode(k.split(':')[1] ?? '')}`, v]))),
    registryMappings: rerun.registry.list().length,
    trackedMappingsReproducedIdentically: trackedText.filter((t) => rerunText.has(t)).length,
  };
  line('INFO', 'rerun.masterOfToday', `unchanged generator, retained source, P04 master of TODAY (in memory, nothing written): source rows ${rerun.manifest.totalRows}; equity candidates ${rerun.manifest.equityCandidates}; ${show(result.rerunMasterOfToday.counts)}`);
  line('INFO', 'rerun.masterOfToday.coverage', `mappings ${result.rerunMasterOfToday.registryMappings}; exchange:series: ${show(result.rerunMasterOfToday.coverage)}; tracked mappings reproduced identically ${result.rerunMasterOfToday.trackedMappingsReproducedIdentically} of ${trackedText.length}`);
  const rerunAsMeasured = rerun.manifest.qualified === RECORDED.rerun.qualified && show(result.rerunMasterOfToday.coverage) === RECORDED.rerun.coverage && result.rerunMasterOfToday.trackedMappingsReproducedIdentically === RECORDED.rerun.trackedReproduced;
  line(rerunAsMeasured ? 'PASS' : 'WARN', 'rerun.masterOfToday.asMeasured', `the re-run equals the sandbox measurement (${RECORDED.rerun.qualified} mappings; ${RECORDED.rerun.coverage}; ${RECORDED.rerun.trackedReproduced} tracked mappings reproduced): ${yn(rerunAsMeasured)}`);

  const resolver = gateModule.createGovernedBrokerObservationResolver(master);
  return { master, p04CompanyOfIsin, trackedRegistry, trackedByIsin, excludedByIsin, parsed, rerun, resolver, qualify: qualificationModule.qualifyHoldingSecurityIdentity, rerunText, mappingText };
}

/* ---------------------------------------------------------------- step 4: the holdings */
function compareHoldings(options, csv, trace, payload) {
  section('4. Holding by holding (pseudonymised)');
  const result = {};
  payload.holdings = result;
  const wanted = new Set(csv.groups.map((g) => g.isin).filter(Boolean));

  /* Source rows of the holdings' ISINs, as the generator classifies a row. */
  const sourceByIsin = new Map();
  for (const record of trace.parsed.records) {
    const v = record.values;
    const isin = upper(v.ISIN);
    if (!wanted.has(isin)) continue;
    if (!sourceByIsin.has(isin)) sourceByIsin.set(isin, []);
    sourceByIsin.get(isin).push({ exchange: v.EXCH_ID ?? '', cashEquity: v.SEGMENT === 'E' && v.INSTRUMENT === 'EQUITY' && (v.EXCH_ID === 'NSE' || v.EXCH_ID === 'BSE'), series: v.SERIES ?? '' });
  }
  /* What the in-memory re-run decided for the rows of those ISINs. */
  const rerunByIsin = new Map();
  for (const record of trace.rerun.manifest.records) {
    const isin = upper(record.isin);
    if (!wanted.has(isin)) continue;
    if (!rerunByIsin.has(isin)) rerunByIsin.set(isin, []);
    rerunByIsin.get(isin).push(record);
  }
  const status = (q) => (q.status === 'QUALIFIED' ? 'QUALIFIED' : `UNRESOLVED:${closed(REASONS, q.reason)}`);
  const segmentOf = { NSE: 'NSE_EQ', BSE: 'BSE_EQ' };

  const rows = [];
  for (const g of csv.groups) {
    const row = { label: g.label, exchange: g.exchange ?? 'absent' };
    row.gate = closed(GATE_STATUSES, trace.resolver.resolve({ symbol: g.symbol, isin: g.isin, exchange: g.exchange }, options.asOf).status);
    const attempted = Boolean(g.isin && g.exchange);
    const now = attempted ? trace.qualify({ isin: g.isin, exchange: g.exchange, symbol: g.symbol }, trace.master, trace.trackedRegistry) : null;
    row.now = attempted ? status(now) : g.isin ? 'NOT_ATTEMPTED:MISSING_EXCHANGE' : 'NOT_ATTEMPTED:MISSING_ISIN';

    /* P04 of today. */
    const companyId = g.isin ? trace.p04CompanyOfIsin(g.isin) : null;
    const entity = companyId ? trace.master.getEntity(companyId) : null;
    row.p04Isin = yn(Boolean(entity) && upper(entity.isin) === g.isin);
    row.p04ActiveListing = entity ? yn(entity.listings.some((l) => l.exchange === g.exchange && l.status === 'ACTIVE')) : 'n/a';

    /* Tracked registry. */
    const tracked = g.isin ? trace.trackedByIsin.get(g.isin) ?? [] : [];
    const onExchange = tracked.filter((m) => m.exchange === g.exchange);
    const lookup = onExchange.filter((m) => companyId !== null && upper(m.companyId) === upper(companyId) && m.exchangeSegment === segmentOf[g.exchange]);
    row.registryIsin = yn(tracked.length > 0);
    row.registryExchanges = joined(tracked.map((m) => closed(['NSE', 'BSE'], m.exchange)));
    row.exchangeMatch = yn(onExchange.length > 0);
    row.registrySeries = joined(onExchange.map((m) => seriesOfSecurityId(m.securityId)));
    row.companyIdAgrees = onExchange.length === 0 ? 'n/a' : yn(lookup.length === onExchange.length);
    row.lookupMatches = lookup.length;
    row.notLoadedRecords = g.isin ? (trace.excludedByIsin.get(g.isin) ?? []).length : 0;

    /* Retained source. */
    const source = g.isin ? sourceByIsin.get(g.isin) ?? [] : [];
    const sourceOnExchange = source.filter((s) => s.cashEquity && s.exchange === g.exchange);
    row.sourceRows = sourceOnExchange.length;
    row.sourceSeries = joined(sourceOnExchange.map((s) => seriesCode(s.series)));
    row.sourceRowsOtherExchange = source.filter((s) => s.cashEquity && s.exchange !== g.exchange).length;
    row.sourceRowsNotCashEquity = source.filter((s) => !s.cashEquity).length;

    /* In-memory re-run against the P04 master of today. */
    const rerunRecords = (g.isin ? rerunByIsin.get(g.isin) ?? [] : []).filter((r) => r.exchange === g.exchange);
    const rerunQualified = rerunRecords.filter((r) => r.disposition === 'QUALIFIED');
    row.rerunDisposition = joined(rerunRecords.map((r) => closed(DISPOSITIONS, r.disposition)));
    row.rerunSeries = joined(rerunQualified.map((r) => seriesCode(r.series ?? '')));
    const after = attempted ? trace.qualify({ isin: g.isin, exchange: g.exchange, symbol: g.symbol }, trace.master, trace.rerun.registry) : null;
    row.afterRerun = attempted ? status(after) : row.now;

    /* One category from the closed list. */
    if (row.now === 'QUALIFIED') row.category = 'QUALIFIED_BY_EXACT_MAPPING';
    else if (row.now !== 'UNRESOLVED:MISSING_P7_MAPPING') row.category = 'NOT_A_P7_MAPPING_GAP';
    else if (row.afterRerun === 'QUALIFIED') {
      if (row.registryIsin === 'no') row.category = 'REGISTRY_NOT_REGENERATED__ISIN_ABSENT';
      else if (row.exchangeMatch === 'yes' && row.companyIdAgrees === 'no') row.category = 'REGISTRY_NOT_REGENERATED__COMPANY_ID_CHANGED';
      else row.category = 'REGISTRY_NOT_REGENERATED__OTHER';
    } else if (row.sourceRows === 0) row.category = 'SOURCE_MAPPING_MISSING';
    else if (rerunQualified.length === 0) row.category = 'GENERATION_RULE_REJECTS_SOURCE_ROW';
    else row.category = 'QUALIFICATION_RULE_REJECTS_REGENERATED_MAPPING';
    row.category = closed(CATEGORIES, row.category);
    rows.push(row);

    /* The mapping that qualifies a holding: its attributes, never its identifiers. */
    if (row.now === 'QUALIFIED' && lookup.length === 1) {
      const m = lookup[0];
      row.qualifiedMapping = {
        segment: closed(SEGMENTS, m.exchangeSegment),
        series: seriesOfSecurityId(m.securityId),
        provenance: closed(PROVENANCES, m.mappingProvenance),
        instrumentType: closed(['EQUITY'], m.instrumentType),
        active: yn(m.active === true),
        verifiedAtPresent: yn(typeof m.lastVerifiedAt === 'string' && Number.isFinite(Date.parse(m.lastVerifiedAt))),
        securityIdEqualsQualifiedIdentity: yn(now.securityIdentity && now.securityIdentity.securityId === m.securityId),
        alsoProducedByTheRerun: yn(trace.rerunText.has(trace.mappingText(m))),
      };
    }
  }

  const columns = ['exchange', 'gate', 'now', 'p04Isin', 'p04ActiveListing', 'registryIsin', 'registryExchanges', 'exchangeMatch', 'companyIdAgrees', 'lookupMatches', 'registrySeries', 'notLoadedRecords', 'sourceRows', 'sourceSeries', 'sourceRowsOtherExchange', 'sourceRowsNotCashEquity', 'rerunDisposition', 'rerunSeries', 'afterRerun', 'category'];
  process.stdout.write(`[COLUMNS] label | ${columns.join(' | ')}\n`);
  for (const row of rows) process.stdout.write(`[ROW] ${row.label} | ${columns.map((c) => row[c]).join(' | ')}\n`);
  for (const row of rows) {
    if (!row.qualifiedMapping) continue;
    const m = row.qualifiedMapping;
    line('INFO', 'qualified.mapping', `${row.label} matched exactly one registry mapping for its P04 company, its exchange segment and its ISIN: segment ${m.segment}; series ${m.series}; provenance ${m.provenance}; instrument type ${m.instrumentType}; active ${m.active}; verification time present ${m.verifiedAtPresent}; its security identifier is the one qualified ${m.securityIdEqualsQualifiedIdentity}; the same mapping is produced by the re-run ${m.alsoProducedByTheRerun}`);
  }

  result.rows = rows;
  result.count = rows.length;
  result.byCategory = sorted(rows.reduce((acc, r) => (tally(acc, r.category), acc), {}));
  result.byCategoryAndExchange = sorted(rows.reduce((acc, r) => (tally(acc, `${r.exchange} ${r.category}`), acc), {}));
  result.now = sorted(rows.reduce((acc, r) => (tally(acc, r.now), acc), {}));
  result.nowPerExchange = sorted(rows.reduce((acc, r) => (tally(acc, `${r.exchange} ${r.now}`), acc), {}));
  result.afterRerun = sorted(rows.reduce((acc, r) => (tally(acc, r.afterRerun), acc), {}));
  const gap = rows.filter((r) => r.now === 'UNRESOLVED:MISSING_P7_MAPPING');
  result.missingP7Mapping = {
    holdings: gap.length,
    isinAbsentFromRegistry: gap.filter((r) => r.registryIsin === 'no').length,
    isinInRegistryOtherExchangeOnly: gap.filter((r) => r.registryIsin === 'yes' && r.exchangeMatch === 'no').length,
    isinAndExchangeInRegistryUnderAnotherCompanyId: gap.filter((r) => r.exchangeMatch === 'yes' && r.companyIdAgrees === 'no').length,
    withANotLoadedManifestRecord: gap.filter((r) => r.notLoadedRecords > 0).length,
    withACashEquitySourceRowOnTheExchange: gap.filter((r) => r.sourceRows > 0).length,
    withSeveralSourceSeriesOnTheExchange: gap.filter((r) => r.sourceSeries.includes('+')).length,
    qualifiedByTheRerunGenerator: gap.filter((r) => r.rerunDisposition === 'QUALIFIED').length,
    qualifiedAtRuntimeWithTheRerunRegistry: gap.filter((r) => r.afterRerun === 'QUALIFIED').length,
  };
  process.stdout.write('\n');
  line('INFO', 'aggregate.now', `qualification today: ${show(result.now)}`);
  line('INFO', 'aggregate.now.perExchange', show(result.nowPerExchange));
  line('INFO', 'aggregate.category', show(result.byCategory));
  line('INFO', 'aggregate.category.perExchange', show(result.byCategoryAndExchange));
  const m = result.missingP7Mapping;
  line('INFO', 'aggregate.gap.registry', `of ${m.holdings} MISSING_P7_MAPPING holding(s): ISIN absent from the registry ${m.isinAbsentFromRegistry}; ISIN in the registry on the other exchange only ${m.isinInRegistryOtherExchangeOnly}; ISIN and exchange in the registry under another company id ${m.isinAndExchangeInRegistryUnderAnotherCompanyId}; with a manifest record that is not loaded ${m.withANotLoadedManifestRecord}`);
  line('INFO', 'aggregate.gap.source', `of ${m.holdings} MISSING_P7_MAPPING holding(s): with a cash-equity row in the retained source on their exchange ${m.withACashEquitySourceRowOnTheExchange}; with several series there ${m.withSeveralSourceSeriesOnTheExchange}; qualified by the unchanged generator against the P04 master of today ${m.qualifiedByTheRerunGenerator}; QUALIFIED at runtime with that in-memory registry ${m.qualifiedAtRuntimeWithTheRerunRegistry}`);
  line('INFO', 'aggregate.afterRerun', `qualification with the in-memory registry of the re-run (nothing stored, no identity assigned): ${show(result.afterRerun)}`);

  if (payload.csv.expectedIsRecorded) {
    const b = RECORDED.baseline;
    const perExchange = payload.csv.holdingsPerExchange;
    check('baseline', rows.length === b.holdings && (result.now.QUALIFIED ?? 0) === b.qualified && (result.now['UNRESOLVED:MISSING_P7_MAPPING'] ?? 0) === b.missingP7Mapping && (perExchange.NSE ?? 0) === b.nse && (perExchange.BSE ?? 0) === b.bse,
      `the counts equal those of the qualification diagnostic of 2026-11-15 (${b.holdings} holdings; ${b.qualified} QUALIFIED; ${b.missingP7Mapping} MISSING_P7_MAPPING; NSE ${b.nse}, BSE ${b.bse})`);
  }
  return result;
}

/* ---------------------------------------------------------------- result */
function finish(resultName, exitCode, payload) {
  const body = { tool: TOOL_VERSION, ...payload, unresolved: [...new Set(unresolved)], checks: { pass: counters.PASS, fail: counters.FAIL, warn: counters.WARN }, result: resultName };
  const json = JSON.stringify(body);
  process.stdout.write('\n== Result\n');
  process.stdout.write(`W04_P7_MAPPING_GAP_RESULT_JSON: ${json}\n`);
  process.stdout.write(`W04_P7_MAPPING_GAP_RESULT_JSON_SHA256: ${sha256Text(json)}\n`);
  process.stdout.write(`checks: ${counters.PASS} pass, ${counters.FAIL} fail, ${counters.WARN} warn\n`);
  process.stdout.write(`unresolved: ${body.unresolved.length === 0 ? 'none' : body.unresolved.join(', ')}\n`);
  process.stdout.write('This is a measurement against the sources of the checkout as they are now. Nothing was written, no registry was changed and no identity was assigned.\n');
  process.stdout.write(`RESULT: ${resultName}\n`);
  process.exitCode = exitCode;
}

async function main() {
  process.stdout.write(`W04 - P7 mapping gap diagnostic (${TOOL_VERSION}). Read-only. Sanitized output.\n`);
  const payload = { recordedInputs: null, csv: null, checkout: null, path: null, holdings: null, identityAssigned: 'NONE', registryWritten: 'NONE' };
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${USAGE}\n`);
      process.exitCode = 0;
      return;
    }
    payload.recordedInputs = { csv: options.expectedCsvSha256 === RECORDED.csvSha256, source: options.expectedSourceSha256 === RECORDED.sourceSha256 };
    payload.gateAsOf = options.asOf === DEFAULT_AS_OF ? 'DEFAULT_2026-11-13' : 'OVERRIDDEN';
    const csv = readCsv(options, payload);
    const checkout = examineCheckout(options, payload);
    const trace = await tracePath(options, checkout, payload);
    compareHoldings(options, csv, trace, payload);
    if (counters.FAIL === 0) finish('ANALYSED', 0, payload);
    else finish('ANALYSED_WITH_FAILED_CHECKS', 1, payload);
  } catch (error) {
    let code = 'UNEXPECTED_ERROR';
    let where = '';
    if (error instanceof Stop) {
      code = error.stopCode;
    } else {
      /* Never the message: it can quote a path or a value. */
      if (error && typeof error.code === 'string' && SYSTEM_ERRORS.includes(error.code)) code = `UNEXPECTED_ERROR_${error.code}`;
      else if (error && ERROR_NAMES.includes(error.name)) code = `UNEXPECTED_ERROR_${error.name}`;
      const frame = String(error && error.stack).match(/w04-p7-mapping-gap-diagnostic\.mjs:(\d+):\d+/);
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
