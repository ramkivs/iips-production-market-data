#!/usr/bin/env node
/**
 * W04-P7 - read-only verification: are the holdings of the original broker CSV exact members
 * of the P7 registry that is PUBLISHED on the main ref, in every identity dimension the
 * published manifest carries?
 *
 * PURPOSE
 *   The gap diagnostic of 2026-11-15 qualified 64 of 64 holdings against a registry that the
 *   unchanged generator produced IN MEMORY. The registry has since been regenerated (4,680
 *   mappings) and published. This utility repeats the per-holding comparison against the
 *   ACTUAL PUBLISHED BYTES and against nothing else: it downloads the manifest from the main
 *   ref, verifies its SHA-256 before it parses a single byte, loads the QUALIFIED records the
 *   way the runtime loader does, and compares every holding with the one published mapping
 *   it finds. It never regenerates a registry and never falls back to an in-memory re-run.
 *
 * SELF-CONTAINED
 *   One file. Node built-ins only: node:crypto and node:fs, plus the global fetch. It needs no
 *   checkout and no compiled code. It makes exactly one network request (GET of the manifest).
 *
 * READ-ONLY
 *   The CSV is opened with the 'r' flag. There is no write, rename, delete or mkdir call, no
 *   child process, no worker and no database module. It does not contact Dhan, IPD or IRR.
 *   It assigns no identity and changes no registry, holding, portfolio, revision or journal.
 *
 * WHERE THE RULES COME FROM (no second rule set is invented here)
 *   - CSV parsing, the mapper's grouping and the H-labels are the functions of the existing
 *     gap diagnostic (w04-p7-mapping-gap-diagnostic.mjs, PORT block), copied character for
 *     character. A test compares the two blocks.
 *   - The registry is filled like `loadGovernedP7InstrumentRegistry` (every record whose
 *     disposition is QUALIFIED and that has a mapping) with the acceptance rules of
 *     `DhanInstrumentRegistry.register`, and read like `DhanInstrumentRegistry.resolveSecurity`.
 *   - The per-holding decision follows `qualifyHoldingSecurityIdentity` step by step: step 1
 *     (ISIN syntax) and steps 5 to 9 (the registry lookup and the mapping checks) are ported.
 *   - Steps 2 to 4 of that function ask the P04 master, which is compiled into IPD and is NOT
 *     part of the published manifest. This utility does not have the P04 master. It takes the
 *     company from the published manifest itself (the mapping found for the ISIN on the
 *     exchange) and reports the company dimension as agreement INSIDE the manifest. See LIMITS.
 *   A test in the repository runs this utility and the real runtime qualification on every
 *   mapping of the tracked manifest and on negative cases and requires the same verdict.
 *
 * LABELS AND FINGERPRINTS
 *   A holding is the mapper's group (by ISIN when present, else by symbol). Labels H01, H02,
 *   ... are given in ascending order of SHA-256("<ISIN>|<exchange>"), exactly as in the gap
 *   diagnostic, so a label means the same holding in both outputs for the same CSV. That hash
 *   is never printed.
 *   Each row carries two fingerprints of 16 hexadecimal characters. They are HMAC-SHA-256
 *   values under a key derived from the whole content of the CSV, so they can be recomputed
 *   only by someone who holds the same CSV. `holdingFp` covers the holding's ISIN and exchange;
 *   `mappingFp` covers the published mapping (its eleven members) and its registry entry.
 *
 * SANITIZED OUTPUT
 *   Labels, counts, SHA-256 digests of whole files, the pipeline commit, the P04 batch name,
 *   yes/no answers, exchange (NSE/BSE), series codes of at most three characters, keyed
 *   fingerprints and values from closed vocabularies. It never prints a symbol, ISIN, company
 *   identifier, security identifier, provider identifier, file name, path, quantity, price,
 *   value or weight, and never an error message (a message can quote a path or a value).
 *
 * RESULT
 *   exit 0  RESULT: ALL_64_MATCH_PUBLISHED_MANIFEST   every condition holds on the recorded inputs
 *   exit 1  RESULT: NOT_ALL_MATCH                     holdings were compared; a condition failed
 *   exit 1  RESULT: FAILED_PRECONDITION               a digest or the manifest structure is wrong
 *   exit 2  RESULT: INCONCLUSIVE                      nothing could be decided (file, download, argument)
 *   exit 3  RESULT: ALL_MATCH_NOT_RECORDED_INPUTS     everything matched, but an input was overridden;
 *                                                     this is a tool check and never an acceptance result
 *
 * LIMITS
 *   - The CSV carries no series and no company identifier. The series and company columns
 *     state that the published record, its mapping, its security identity and its registry
 *     entry agree with one another and with the D114 grammar; they are not compared with a
 *     value from the CSV, because there is none.
 *   - That the company of a published mapping is the company the P04 master gives for the
 *     ISIN, with an ACTIVE listing on the exchange, is not re-derived here. It is covered for
 *     the same manifest bytes by the repository test P7-REG-02 and by the test of this utility.
 *   - A MATCH is stricter than the runtime's QUALIFIED: the runtime does not compare the
 *     record fields or the registry entry list.
 */
import { createHash, createHmac } from 'node:crypto';
import { closeSync, existsSync, openSync, readFileSync, statSync } from 'node:fs';

const TOOL_VERSION = 'w04-p7-published-manifest-qualification/1';
const READ_LIMIT_BYTES = 64 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 120000;
const HOLDING_LIMIT = 9999;

/** The inputs of record. A run with any other value is reported as not being an acceptance run. */
const RECORDED = Object.freeze({
  manifestUrl: 'https://raw.githubusercontent.com/ramkivs/iips-production-market-data/main/evidence/dhan-p7/qualification-manifest.json',
  manifestSha256: '69a918f78791114e8fb036ddfd2a2005facdddf785a7496bc28f541fd4964769',
  pipelineCommit: '325266d684f857a377d55b147e7306e02c7a495a',
  mappings: 4680,
  csvSha256: 'a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107',
  holdings: 64,
});

/* Closed vocabularies. A value outside its list is printed as OTHER. */
const VERDICTS = Object.freeze(['MATCH', 'MISSING', 'AMBIGUOUS', 'MISMATCH', 'NOT_COMPARABLE']);
const ROW_REASONS = Object.freeze([
  'EXACT_PUBLISHED_MAPPING',
  /* the holding itself */
  'HOLDING_WITHOUT_ISIN',
  'HOLDING_WITHOUT_EXCHANGE',
  'INVALID_ISIN_SYNTAX',
  /* reasons of qualifyHoldingSecurityIdentity, steps 5 to 9 */
  'MISSING_P7_MAPPING',
  'AMBIGUOUS_PROVIDER_MAPPING',
  'INACTIVE_OR_MISSING_LISTING',
  'CONFLICTING_ISIN',
  'MISSING_SERIES_EVIDENCE',
  'STALE_SOURCE_EVIDENCE',
  /* dimensions of the published record, compared by this utility */
  'ISIN_DISAGREES',
  'EXCHANGE_DISAGREES',
  'SERIES_DISAGREES',
  'COMPANY_DISAGREES',
  'NOT_IN_REGISTRY_ENTRIES',
  'UNEXPECTED_ENTRIES',
]);
const REGISTER_REJECTIONS = Object.freeze([
  'COMPANY_ID_REQUIRED',
  'PROVIDER_ID_REQUIRED',
  'PROVENANCE_REQUIRED',
  'ISIN_NOT_12_CHARACTERS',
  'SECURITY_ID_NOT_D114',
  'SECURITY_ID_AND_ISIN_DISAGREE',
  'INSTRUMENT_TYPE_NOT_EQUITY',
  'ACTIVE_NOT_BOOLEAN',
  'EFFECTIVE_DATE_INVALID',
  'LAST_VERIFIED_AT_INVALID',
  'EXCHANGE_MISMATCH',
  'INSTRUMENT_TYPE_MISMATCH',
  'SECURITY_MAPPING_CONFLICT',
  'SECURITY_ID_REUSED',
  'MAPPING_MEMBER_NOT_A_STRING',
]);
const SYSTEM_ERRORS = Object.freeze(['ENOENT', 'EACCES', 'EPERM', 'EISDIR', 'ENOTDIR', 'EBUSY', 'EMFILE', 'ERR_ACCESS_DENIED']);
const ERROR_NAMES = Object.freeze(['SyntaxError', 'TypeError', 'RangeError', 'ReferenceError']);
const SEGMENT_OF = Object.freeze({ NSE: 'NSE_EQ', BSE: 'BSE_EQ' });

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
const isHex40 = (value) => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value);
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const closed = (list, value) => (typeof value === 'string' && list.includes(value) ? value : 'OTHER');
const upper = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');
/** A series code as the source gives it, when it is a short code; never free text. */
const seriesCode = (value) => (typeof value === 'string' && /^[A-Z0-9]{1,3}$/.test(value) ? value : 'OTHER');
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
class Stop extends Error {
  /** `kind` is PRECONDITION (a definite failed condition) or INCONCLUSIVE; `evidence` is sanitized text. */
  constructor(code, kind = 'INCONCLUSIVE', evidence = []) {
    super(code);
    this.name = 'Stop';
    this.stopCode = code;
    this.kind = kind;
    this.evidence = evidence;
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

/* ============================================================================================
 * D114 BEGIN - IPD src/contracts/types.ts, type annotations removed.
 * ========================================================================================== */
const D114_SECURITY_ID_PREFIX = 'ISIN';
const D114_ISIN_AUTHORITY = 'NON_AUTHORITATIVE';
const D114_ISIN_LENGTH = 12;
const D114_ISIN_PATTERN = /^[A-Za-z0-9]{12}$/;
function isD114SecurityId(value) {
  if (typeof value !== 'string') return false;
  const segments = value.split(':');
  if (segments.length !== 3) return false;
  const [prefix, isin, series] = segments;
  return (
    prefix === D114_SECURITY_ID_PREFIX &&
    isin.length === D114_ISIN_LENGTH &&
    D114_ISIN_PATTERN.test(isin) &&
    series.length > 0 &&
    series === series.trim()
  );
}
function buildD114SecurityIdentity(isin, series) {
  if (typeof isin !== 'string' || typeof series !== 'string') return null;
  const normalizedIsin = isin.trim();
  const normalizedSeries = series.trim();
  const securityId = `${D114_SECURITY_ID_PREFIX}:${normalizedIsin}:${normalizedSeries}`;
  if (!isD114SecurityId(securityId)) return null;
  return Object.freeze({
    securityId,
    isin: normalizedIsin,
    series: normalizedSeries,
    isinAuthority: D114_ISIN_AUTHORITY,
  });
}
/* ============================================================================================
 * D114 END
 * ========================================================================================== */

/* ============================================================================================
 * REGISTRY BEGIN - IPD src/providers/dhan/dhan_instrument_map.ts (DhanInstrumentRegistry:
 * keyOf, seriesOf, register, listFor, checkActive, resolveSecurity), type annotations removed.
 * Where the class throws, `register` returns a code from a closed list instead, so that the
 * count of refused records can be reported; a refused record is not loaded, as in the class.
 * ========================================================================================== */
class PublishedRegistry {
  constructor() {
    this.bySecurityListingKey = new Map();
    this.bySecurityKey = new Map();
  }
  static keyOf(companyId, exchangeSegment, isin, series) {
    return `${companyId.trim().toUpperCase()}|${exchangeSegment}|${(isin ?? '').trim().toUpperCase()}|${(series ?? '').trim().toUpperCase()}`;
  }
  static seriesOf(mapping) {
    if (typeof mapping.securityId !== 'string' || !mapping.securityId.trim()) return '';
    const parts = mapping.securityId.trim().split(':');
    return parts.length === 3 ? parts[2].toUpperCase() : '';
  }
  /** Returns null when the mapping was registered, else the reason the class would have thrown for. */
  register(mapping) {
    for (const member of ['companyId', 'dhanSecurityId', 'exchangeSegment', 'mappingProvenance']) {
      if (mapping[member] !== undefined && mapping[member] !== null && typeof mapping[member] !== 'string') return 'MAPPING_MEMBER_NOT_A_STRING';
    }
    for (const member of ['isin', 'securityId', 'symbol', 'effectiveDate', 'lastVerifiedAt']) {
      if (mapping[member] !== undefined && typeof mapping[member] !== 'string') return 'MAPPING_MEMBER_NOT_A_STRING';
    }
    if (typeof mapping.exchangeSegment !== 'string') return 'MAPPING_MEMBER_NOT_A_STRING';
    if (!mapping.companyId || !mapping.companyId.trim()) return 'COMPANY_ID_REQUIRED';
    if (!mapping.dhanSecurityId || !mapping.dhanSecurityId.trim()) return 'PROVIDER_ID_REQUIRED';
    if (!mapping.mappingProvenance) return 'PROVENANCE_REQUIRED';
    if (mapping.isin !== undefined && !/^[A-Za-z0-9]{12}$/i.test(mapping.isin.trim())) return 'ISIN_NOT_12_CHARACTERS';
    if (mapping.securityId !== undefined) {
      if (!isD114SecurityId(mapping.securityId.trim())) return 'SECURITY_ID_NOT_D114';
      if (mapping.isin !== undefined && !mapping.securityId.trim().includes(`:${mapping.isin.trim().toUpperCase()}:`)) return 'SECURITY_ID_AND_ISIN_DISAGREE';
    }
    if (mapping.instrumentType !== undefined && mapping.instrumentType !== 'EQUITY') return 'INSTRUMENT_TYPE_NOT_EQUITY';
    if (mapping.active !== undefined && typeof mapping.active !== 'boolean') return 'ACTIVE_NOT_BOOLEAN';
    if (mapping.effectiveDate !== undefined && Number.isNaN(Date.parse(mapping.effectiveDate))) return 'EFFECTIVE_DATE_INVALID';
    if (
      mapping.lastVerifiedAt !== undefined &&
      (mapping.mappingProvenance !== 'DHAN_INSTRUMENT_MASTER' || Number.isNaN(Date.parse(mapping.lastVerifiedAt)))
    ) {
      return 'LAST_VERIFIED_AT_INVALID';
    }

    const isin = mapping.isin?.trim().toUpperCase();
    const series = PublishedRegistry.seriesOf(mapping);
    const key = PublishedRegistry.keyOf(mapping.companyId, mapping.exchangeSegment, isin, series);
    const securityKey = `${mapping.exchangeSegment}:${mapping.dhanSecurityId.trim()}`;

    const existing = this.bySecurityListingKey.get(key);
    if (existing) {
      if (existing.exchange !== mapping.exchange) return 'EXCHANGE_MISMATCH';
      if (
        mapping.instrumentType !== undefined &&
        existing.instrumentType !== undefined &&
        existing.instrumentType !== mapping.instrumentType
      ) {
        return 'INSTRUMENT_TYPE_MISMATCH';
      }
      const identical =
        existing.dhanSecurityId === mapping.dhanSecurityId && existing.symbol === mapping.symbol;
      if (!identical) return 'SECURITY_MAPPING_CONFLICT';
    }

    const ownerOfSecurity = this.bySecurityKey.get(securityKey);
    if (ownerOfSecurity && ownerOfSecurity !== key) return 'SECURITY_ID_REUSED';

    const normalized = {
      ...mapping,
      companyId: mapping.companyId.trim(),
      dhanSecurityId: mapping.dhanSecurityId.trim(),
      ...(isin !== undefined ? { isin } : {}),
      ...(mapping.securityId !== undefined ? { securityId: mapping.securityId.trim() } : {}),
    };
    this.bySecurityListingKey.set(key, normalized);
    this.bySecurityKey.set(securityKey, key);
    return null;
  }
  get size() {
    return this.bySecurityListingKey.size;
  }
  list() {
    return Array.from(this.bySecurityListingKey.values());
  }
  checkActive(mapping) {
    if (mapping.active === false) return { status: 'UNRESOLVED', reason: 'INSTRUMENT_INACTIVE' };
    return { status: 'RESOLVED', mapping };
  }
  listFor(prefix) {
    return Array.from(this.bySecurityListingKey.entries())
      .filter(([k]) => k.startsWith(prefix))
      .map(([, m]) => m);
  }
  resolveSecurity(companyId, exchangeSegment, isin) {
    const key = (companyId || '').trim().toUpperCase();
    if (this.bySecurityListingKey.size === 0) return { status: 'UNRESOLVED', reason: 'NO_MAPPING_DATA_LOADED' };
    if (!isin || !isin.trim()) return { status: 'UNRESOLVED', reason: 'AMBIGUOUS_MAPPING' };
    const matches = this.listFor(`${key}|${exchangeSegment}|${isin.trim().toUpperCase()}|`);
    if (matches.length === 0) return { status: 'UNRESOLVED', reason: 'UNMAPPED_COMPANY_ID' };
    if (matches.length > 1) return { status: 'UNRESOLVED', reason: 'AMBIGUOUS_MAPPING' };
    return this.checkActive(matches[0]);
  }
}
/* ============================================================================================
 * REGISTRY END
 * ========================================================================================== */

/* ============================================================================================
 * QUALIFY BEGIN - IPD src/providers/dhan/dhan_security_identity_service.ts
 * (qualifyHoldingSecurityIdentity), type annotations and message texts removed.
 *
 * Steps 2 to 4 of the original ask the P04 master for the company of the ISIN, for the
 * agreement of the entity's ISIN and for an ACTIVE listing on the exchange. The P04 master is
 * not part of the published manifest. `companyOfPublishedMapping` stands in their place: the
 * company is the one the PUBLISHED registry carries for the ISIN on the exchange segment.
 * Every other step is the original, in the original order.
 * ========================================================================================== */
function qualifyAgainstPublishedRegistry(input, registry, companyOfPublishedMapping) {
  const { isin: rawIsin, exchange } = input;

  // 1. Missing ISIN.
  if (!rawIsin || !rawIsin.trim()) return { status: 'UNRESOLVED', reason: 'MISSING_ISIN' };
  const normalizedIsin = rawIsin.trim().toUpperCase();
  if (normalizedIsin.length !== D114_ISIN_LENGTH || !D114_ISIN_PATTERN.test(normalizedIsin)) {
    return { status: 'UNRESOLVED', reason: 'INVALID_ISIN_SYNTAX' };
  }

  // 2 to 4. In place of the P04 master: the company the published registry states.
  const exchangeSegment = SEGMENT_OF[exchange];
  const published = companyOfPublishedMapping(exchangeSegment, normalizedIsin);
  if (published.status === 'NONE') return { status: 'UNRESOLVED', reason: 'MISSING_P7_MAPPING' };
  if (published.status === 'SEVERAL_COMPANIES') return { status: 'UNRESOLVED', reason: 'AMBIGUOUS_PROVIDER_MAPPING' };
  const companyId = published.companyId;

  // 5. P7 series evidence: unambiguous mapping for (companyId, segment, ISIN).
  const resolution = registry.resolveSecurity(companyId, exchangeSegment, normalizedIsin);
  if (resolution.status === 'UNRESOLVED') {
    if (resolution.reason === 'AMBIGUOUS_MAPPING') return { status: 'UNRESOLVED', reason: 'AMBIGUOUS_PROVIDER_MAPPING' };
    if (resolution.reason === 'INSTRUMENT_INACTIVE') return { status: 'UNRESOLVED', reason: 'INACTIVE_OR_MISSING_LISTING' };
    return { status: 'UNRESOLVED', reason: 'MISSING_P7_MAPPING' };
  }

  const mapping = resolution.mapping;

  // 6. Verify P7 mapping ISIN agrees with input ISIN (no conflict).
  if (mapping.isin && mapping.isin.toUpperCase() !== normalizedIsin) return { status: 'UNRESOLVED', reason: 'CONFLICTING_ISIN' };

  // 7. P7 mapping must carry a canonical D114 securityId (series evidence).
  if (!mapping.securityId) return { status: 'UNRESOLVED', reason: 'MISSING_SERIES_EVIDENCE' };
  if (!isD114SecurityId(mapping.securityId)) return { status: 'UNRESOLVED', reason: 'MISSING_SERIES_EVIDENCE' };

  // Verify series ISIN segment agrees with input ISIN.
  const mappingParts = mapping.securityId.split(':');
  if (mappingParts.length !== 3 || mappingParts[1].toUpperCase() !== normalizedIsin) return { status: 'UNRESOLVED', reason: 'CONFLICTING_ISIN' };

  // 8. Stale source evidence: master-sourced mappings must carry a valid lastVerifiedAt.
  if (
    mapping.mappingProvenance === 'DHAN_INSTRUMENT_MASTER' &&
    (!mapping.lastVerifiedAt || Number.isNaN(Date.parse(mapping.lastVerifiedAt)))
  ) {
    return { status: 'UNRESOLVED', reason: 'STALE_SOURCE_EVIDENCE' };
  }

  // 9. Construct D114 canonical identity from exact source values.
  const series = mappingParts[2];
  const identity = buildD114SecurityIdentity(normalizedIsin, series);
  if (!identity) return { status: 'UNRESOLVED', reason: 'MISSING_SERIES_EVIDENCE' };

  return { status: 'QUALIFIED', securityIdentity: identity, companyId, exchange, isinAuthority: D114_ISIN_AUTHORITY, mapping };
}
/* ============================================================================================
 * QUALIFY END
 * ========================================================================================== */

const USAGE = [
  'usage: node w04-p7-published-manifest-qualification.mjs --csv <file>',
  '            [--url <url>] [--expected-csv-sha256 <hex>] [--expected-manifest-sha256 <hex>]',
  '            [--expected-holdings <count>]',
  '',
  '  --csv <file>   the original broker CSV. Opened read-only.',
  '  The other options replace a recorded input. They exist for the tests of this utility. A run',
  '  with any of them is reported as not being a run on the recorded inputs and can never end',
  '  with RESULT: ALL_64_MATCH_PUBLISHED_MANIFEST.',
  '  --url accepts https, or http on the loopback address only.',
].join('\n');

function parseArguments(argv) {
  const options = { csv: null, url: RECORDED.manifestUrl, expectedCsvSha256: RECORDED.csvSha256, expectedManifestSha256: RECORDED.manifestSha256, expectedHoldings: RECORDED.holdings, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = () => {
      i += 1;
      if (i >= argv.length) throw new Stop('ARGUMENT_VALUE_MISSING');
      return argv[i];
    };
    if (flag === '--csv') options.csv = value();
    else if (flag === '--url') options.url = value();
    else if (flag === '--expected-csv-sha256') options.expectedCsvSha256 = value().toLowerCase();
    else if (flag === '--expected-manifest-sha256') options.expectedManifestSha256 = value().toLowerCase();
    else if (flag === '--expected-holdings') options.expectedHoldings = Number(value());
    else if (flag === '--help' || flag === '-h') options.help = true;
    else throw new Stop('ARGUMENT_UNKNOWN');
  }
  if (options.help) return options;
  if (options.csv === null) throw new Stop('ARGUMENT_CSV_MISSING');
  if (!isHex64(options.expectedCsvSha256) || !isHex64(options.expectedManifestSha256)) throw new Stop('ARGUMENT_EXPECTED_DIGEST_NOT_SHA256');
  if (!Number.isSafeInteger(options.expectedHoldings) || options.expectedHoldings < 1 || options.expectedHoldings > HOLDING_LIMIT) throw new Stop('ARGUMENT_EXPECTED_HOLDINGS_NOT_A_COUNT');
  let parsedUrl;
  try {
    parsedUrl = new URL(options.url);
  } catch {
    throw new Stop('ARGUMENT_URL_NOT_A_URL');
  }
  const loopback = parsedUrl.hostname === '127.0.0.1' || parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '[::1]';
  if (!(parsedUrl.protocol === 'https:' || (parsedUrl.protocol === 'http:' && loopback))) throw new Stop('ARGUMENT_URL_NOT_ALLOWED');
  options.overrides = [];
  if (options.url !== RECORDED.manifestUrl) options.overrides.push('URL');
  if (options.expectedCsvSha256 !== RECORDED.csvSha256) options.overrides.push('CSV_SHA256');
  if (options.expectedManifestSha256 !== RECORDED.manifestSha256) options.overrides.push('MANIFEST_SHA256');
  if (options.expectedHoldings !== RECORDED.holdings) options.overrides.push('HOLDINGS');
  return options;
}

/* ---------------------------------------------------------------- step 1: the CSV */
function readCsv(options, payload) {
  section('1. Original CSV: digest verification and holdings');
  const result = {};
  payload.csv = result;
  let bytes;
  try {
    if (!isFile(options.csv)) throw new Stop('CSV_FILE_NOT_FOUND');
    if (statSync(options.csv).size > READ_LIMIT_BYTES) throw new Stop('CSV_FILE_TOO_LARGE');
    bytes = readFileReadOnly(options.csv);
  } catch (error) {
    if (error instanceof Stop) throw error;
    /* Under the Node permission model a file outside --allow-fs-read is refused, not absent. */
    if (error && error.code === 'ERR_ACCESS_DENIED') throw new Stop('CSV_FILE_READ_NOT_PERMITTED');
    throw error;
  }
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
    throw new Stop('CSV_SHA256_NOT_EXPECTED', 'PRECONDITION', [`expected ${result.expected}`, `actual ${result.sha256ImportContent}`, `bytes read ${bytes.length}`, `byte-order mark present ${yn(hasBom)}`]);
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
  if (groups.length === 0) throw new Stop('CSV_HAS_NO_HOLDINGS', 'PRECONDITION');
  if (groups.length > HOLDING_LIMIT) throw new Stop('CSV_HAS_TOO_MANY_HOLDINGS', 'PRECONDITION');
  check('csv.holdings.count', groups.length === options.expectedHoldings, `the CSV has ${options.expectedHoldings} holdings (found ${groups.length})`);
  check('csv.holdings.identified', result.holdingsWithIsinAndExchange === groups.length, `every holding has an ISIN and an exchange (${result.holdingsWithIsinAndExchange} of ${groups.length})`);

  /* A group takes the exchange of its first row. Rows of one group that name another exchange
   * would make the holding's exchange a matter of row order; that is counted and must be zero. */
  const exchangesOfGroup = new Map();
  for (const row of parsed.rows) {
    const key = row.isin ? `ISIN:${row.isin}` : `SYM:${row.symbol}`;
    if (!exchangesOfGroup.has(key)) exchangesOfGroup.set(key, new Set());
    exchangesOfGroup.get(key).add(row.exchange ?? 'absent');
  }
  result.holdingsFromSeveralRows = groups.filter((g) => g.rows > 1).length;
  result.holdingsNamingSeveralExchanges = [...exchangesOfGroup.values()].filter((set) => set.size > 1).length;
  line('INFO', 'csv.rows', `holdings formed from more than one row ${result.holdingsFromSeveralRows}`);
  check('csv.oneExchangePerHolding', result.holdingsNamingSeveralExchanges === 0, `no holding has rows that name different exchanges (${result.holdingsNamingSeveralExchanges} such holdings)`);

  /* Labels: ascending SHA-256 of "<ISIN>|<exchange>". Two holdings never share the key: the
   * mapper groups by ISIN. The hash is used for the order only and is never printed. */
  const keyed = groups.map((g) => ({ ...g, order: sha256Text(`${g.isin ?? `SYM:${g.symbol}`}|${g.exchange ?? ''}`) }));
  keyed.sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
  const width = Math.max(2, String(keyed.length).length);
  keyed.forEach((g, index) => {
    g.label = `H${String(index + 1).padStart(width, '0')}`;
  });

  /* The fingerprint key: derived from the whole CSV content under a label of this utility.
   * It is not the import-content digest and it is never printed. */
  const fingerprintKey = createHash('sha256').update(`${TOOL_VERSION}|fingerprint-key\0`, 'utf8').update(Buffer.from(text, 'utf8')).digest();
  return { groups: keyed, fingerprintKey, rawSha256: sha256(bytes), rawBytes: bytes.length };
}

/* ---------------------------------------------------------------- step 2: the published manifest */
function causeCode(error) {
  for (const candidate of [error, error && error.cause, error && error.cause && error.cause.cause]) {
    if (candidate && typeof candidate.code === 'string' && /^[A-Z][A-Z0-9_]{1,47}$/.test(candidate.code)) return candidate.code;
  }
  if (error && (error.name === 'TimeoutError' || error.name === 'AbortError')) return 'TIMEOUT';
  return 'NO_CODE';
}

async function downloadManifest(options, payload) {
  section('2. Published manifest: download, SHA-256 before parsing, pipeline commit and counts');
  const result = {};
  payload.manifest = result;
  result.urlIsRecorded = options.url === RECORDED.manifestUrl;
  line('INFO', 'manifest.url', result.urlIsRecorded ? RECORDED.manifestUrl : 'OVERRIDDEN (not the recorded address of the main ref)');
  if (!result.urlIsRecorded) line('WARN', 'manifest.url.override', 'the address was overridden; this is not a run against the published manifest');

  let response;
  try {
    response = await fetch(options.url, { method: 'GET', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
  } catch (error) {
    throw new Stop('MANIFEST_DOWNLOAD_FAILED', 'INCONCLUSIVE', [`cause ${causeCode(error)}`]);
  }
  if (response.status !== 200) throw new Stop('MANIFEST_DOWNLOAD_HTTP_STATUS', 'INCONCLUSIVE', [`HTTP status ${Number(response.status)}`]);
  let bytes;
  try {
    bytes = Buffer.from(await response.arrayBuffer());
  } catch (error) {
    throw new Stop('MANIFEST_DOWNLOAD_INTERRUPTED', 'INCONCLUSIVE', [`cause ${causeCode(error)}`]);
  }
  if (bytes.length > READ_LIMIT_BYTES) throw new Stop('MANIFEST_TOO_LARGE', 'PRECONDITION', [`bytes ${bytes.length}`]);

  /* The digest is taken over the downloaded bytes BEFORE any of them is parsed. */
  const digest = sha256(bytes);
  result.bytes = bytes.length;
  result.sha256 = digest;
  result.expected = options.expectedManifestSha256;
  result.expectedIsRecorded = options.expectedManifestSha256 === RECORDED.manifestSha256;
  line('INFO', 'manifest.bytes', String(bytes.length));
  line('INFO', 'manifest.sha256.expected', result.expected);
  line('INFO', 'manifest.sha256.downloaded', digest);
  if (!check('manifest.sha256', digest === options.expectedManifestSha256, 'SHA-256 of the downloaded bytes equals the expected digest (verified before parsing)')) {
    throw new Stop('MANIFEST_SHA256_NOT_EXPECTED', 'PRECONDITION', [`expected ${result.expected}`, `downloaded ${digest}`, `bytes ${bytes.length}`, 'the bytes were not parsed']);
  }
  if (!result.expectedIsRecorded) line('WARN', 'manifest.override', 'the expected manifest digest was overridden; this is not a run against the published manifest');

  let manifest;
  try {
    /* The server reads this file with JSON.parse on the UTF-8 text, without removing a byte-order mark. */
    manifest = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new Stop('MANIFEST_NOT_JSON', 'PRECONDITION');
  }
  if (!isObject(manifest)) throw new Stop('MANIFEST_NOT_AN_OBJECT', 'PRECONDITION');
  if (!Array.isArray(manifest.records)) throw new Stop('MANIFEST_HAS_NO_RECORDS', 'PRECONDITION');
  if (!Array.isArray(manifest.registryEntries)) throw new Stop('MANIFEST_HAS_NO_REGISTRY_ENTRIES', 'PRECONDITION');

  check('manifest.task', manifest.task === 'DHAN-P7', 'the manifest is the DHAN-P7 qualification manifest');
  result.pipelineCommit = isHex40(manifest.pipelineCommit) ? manifest.pipelineCommit : 'OTHER';
  line('INFO', 'manifest.pipelineCommit', result.pipelineCommit);
  result.pipelineCommitMatches = check('manifest.pipelineCommit.expected', manifest.pipelineCommit === RECORDED.pipelineCommit, `pipeline commit equals ${RECORDED.pipelineCommit}`);

  const revision = isObject(manifest.p04SourceRevision) ? manifest.p04SourceRevision : {};
  result.p04SourceRevision = {
    batchId: typeof revision.batchId === 'string' && /^[A-Z0-9-]{1,80}$/.test(revision.batchId) ? revision.batchId : 'OTHER',
    fileChecksumSha256: isHex64(revision.fileChecksumSha256) ? revision.fileChecksumSha256 : null,
    recordCount: Number.isSafeInteger(revision.recordCount) ? revision.recordCount : null,
  };
  line('INFO', 'manifest.p04SourceRevision', `batch ${result.p04SourceRevision.batchId}; records ${result.p04SourceRevision.recordCount}; source checksum ${result.p04SourceRevision.fileChecksumSha256}`);

  const count = (value) => (Number.isSafeInteger(value) ? value : null);
  const totals = isObject(manifest.totals) ? manifest.totals : {};
  const dispositions = isObject(manifest.countsByDisposition) ? manifest.countsByDisposition : {};
  result.stated = { totalsQualified: count(totals.qualified), totalsRegistrySize: count(totals.registrySize), dispositionQualified: count(dispositions.QUALIFIED) };
  result.statedCountsMatch = check('manifest.count.stated', result.stated.totalsQualified === RECORDED.mappings && result.stated.totalsRegistrySize === RECORDED.mappings && result.stated.dispositionQualified === RECORDED.mappings,
    `the manifest states ${RECORDED.mappings} qualified mappings (totals.qualified ${result.stated.totalsQualified}; totals.registrySize ${result.stated.totalsRegistrySize}; countsByDisposition.QUALIFIED ${result.stated.dispositionQualified})`);
  return manifest;
}

/* ---------------------------------------------------------------- step 3: the published registry */
/** The registry entry of a mapping, in the form the manifest lists: company|segment|securityId. */
const entryOf = (mapping) => `${mapping.companyId}|${mapping.exchangeSegment}|${mapping.securityId}`;
/** The eleven members of a mapping, in the order of the gap diagnostic's `mappingText`. */
const mappingText = (m) => JSON.stringify([m.companyId, m.isin, m.securityId, m.exchange, m.symbol, m.exchangeSegment, m.dhanSecurityId, m.mappingProvenance, m.instrumentType, m.active, m.lastVerifiedAt]);

/** Does a QUALIFIED record agree with its own mapping, in the four dimensions and in the identity? */
function recordDimensions(record, mapping) {
  const parts = typeof mapping.securityId === 'string' ? mapping.securityId.split(':') : [];
  const isin = upper(mapping.isin);
  const series = parts.length === 3 ? parts[2] : '';
  const identity = isObject(record.securityIdentity) ? record.securityIdentity : {};
  const rebuilt = buildD114SecurityIdentity(isin, series);
  return {
    isin: isin !== '' && mapping.isin === isin && parts.length === 3 && parts[1] === isin && record.isin === isin && identity.isin === isin,
    exchange: (mapping.exchange === 'NSE' || mapping.exchange === 'BSE') && mapping.exchangeSegment === SEGMENT_OF[mapping.exchange] && record.exchange === mapping.exchange && record.segment === 'E',
    series: series !== '' && record.series === series && identity.series === series && identity.securityId === mapping.securityId && rebuilt !== null && rebuilt.securityId === mapping.securityId && identity.isinAuthority === D114_ISIN_AUTHORITY,
    company: typeof mapping.companyId === 'string' && mapping.companyId.trim() !== '' && record.companyId === mapping.companyId,
  };
}

function loadPublishedRegistry(manifest, payload) {
  section('3. Published registry: the QUALIFIED records, loaded as the runtime loads them');
  const result = {};
  payload.registry = result;

  /* Same selection as `loadGovernedP7InstrumentRegistry`: disposition QUALIFIED and a mapping. */
  const records = manifest.records.filter(isObject);
  const qualified = records.filter((r) => r.disposition === 'QUALIFIED' && isObject(r.mapping));
  result.records = manifest.records.length;
  result.qualifiedRecords = qualified.length;
  line('INFO', 'registry.records', `records kept in the manifest ${manifest.records.length}; QUALIFIED with a mapping ${qualified.length}`);
  result.qualifiedRecordsMatch = check('registry.count.records', qualified.length === RECORDED.mappings, `the manifest holds ${RECORDED.mappings} QUALIFIED records (found ${qualified.length})`);

  const registry = new PublishedRegistry();
  const refused = {};
  const recordsOfKey = new Map(); /* "<ISIN>|<exchange>" -> QUALIFIED records, loaded or not */
  const recordOfMapping = new Map(); /* registry key -> the record whose mapping is loaded */
  for (const record of qualified) {
    const mapping = record.mapping;
    const lookup = `${upper(mapping.isin)}|${typeof mapping.exchange === 'string' ? mapping.exchange : ''}`;
    if (!recordsOfKey.has(lookup)) recordsOfKey.set(lookup, []);
    recordsOfKey.get(lookup).push(record);
    const reason = registry.register(mapping);
    if (reason !== null) tally(refused, closed(REGISTER_REJECTIONS, reason));
    else recordOfMapping.set(PublishedRegistry.keyOf(mapping.companyId, mapping.exchangeSegment, upper(mapping.isin), PublishedRegistry.seriesOf(mapping)), record);
  }
  const refusedCount = Object.values(refused).reduce((a, b) => a + b, 0);
  result.loaded = registry.size;
  result.refused = sorted(refused);
  line('INFO', 'registry.loaded', `mappings loaded ${registry.size}; records the registry class would refuse ${refusedCount}${refusedCount === 0 ? '' : ` (${show(refused)})`}`);
  result.loadedMatch = check('registry.count.loaded', registry.size === RECORDED.mappings && refusedCount === 0, `the loaded registry has ${RECORDED.mappings} mappings and none was refused`);

  /* The list `registryEntries` against the entries of the loaded mappings. */
  const listed = manifest.registryEntries;
  const listedStrings = listed.filter((e) => typeof e === 'string');
  const listedCount = new Map();
  for (const entry of listedStrings) listedCount.set(entry, (listedCount.get(entry) ?? 0) + 1);
  const listedBySegmentIsin = new Map(); /* "<segment>|<ISIN>" -> listed entry strings */
  let malformed = listed.length - listedStrings.length;
  for (const entry of listedCount.keys()) {
    const parts = entry.split('|');
    const idParts = parts.length === 3 ? parts[2].split(':') : [];
    if (parts.length !== 3 || !isD114SecurityId(parts[2]) || idParts.length !== 3) {
      malformed += listedCount.get(entry);
      continue;
    }
    const lookup = `${parts[1]}|${idParts[1].toUpperCase()}`;
    if (!listedBySegmentIsin.has(lookup)) listedBySegmentIsin.set(lookup, []);
    listedBySegmentIsin.get(lookup).push(entry);
  }
  const loadedEntries = new Set(registry.list().map(entryOf));
  const listedNotLoaded = [...listedCount.keys()].filter((e) => !loadedEntries.has(e)).length;
  const loadedNotListed = [...loadedEntries].filter((e) => !listedCount.has(e)).length;
  result.registryEntries = { listed: listed.length, distinct: listedCount.size, malformed, listedNotLoaded, loadedNotListed };
  line('INFO', 'registry.entries', `registryEntries listed ${listed.length}; distinct ${listedCount.size}; malformed ${malformed}; listed without a loaded mapping ${listedNotLoaded}; loaded mappings not listed ${loadedNotListed}`);
  result.entriesMatch = check('registry.count.entries', listed.length === RECORDED.mappings && listedCount.size === RECORDED.mappings && malformed === 0, `registryEntries lists ${RECORDED.mappings} distinct, well-formed entries`);
  result.entriesEqual = check('registry.entries.equal', listedNotLoaded === 0 && loadedNotListed === 0, 'registryEntries and the loaded mappings are the same set (no unexpected entry on either side)');

  /* Every QUALIFIED record against its own mapping. */
  const disagreeing = { isin: 0, exchange: 0, series: 0, company: 0 };
  for (const record of qualified) {
    const d = recordDimensions(record, record.mapping);
    for (const key of Object.keys(disagreeing)) if (!d[key]) disagreeing[key] += 1;
  }
  result.recordsDisagreeingWithTheirMapping = disagreeing;
  result.recordsAgree = check('registry.records.agree', Object.values(disagreeing).every((n) => n === 0), `every QUALIFIED record agrees with its mapping (disagreeing: ISIN ${disagreeing.isin}; exchange ${disagreeing.exchange}; series ${disagreeing.series}; company ${disagreeing.company})`);

  /* Indexes for the holdings. */
  const bySegmentIsin = new Map(); /* "<segment>|<ISIN>" -> loaded mappings, any company, any series */
  const byIsin = new Map(); /* "<ISIN>" -> loaded mappings on any exchange */
  for (const mapping of registry.list()) {
    const isin = upper(mapping.isin);
    const lookup = `${mapping.exchangeSegment}|${isin}`;
    if (!bySegmentIsin.has(lookup)) bySegmentIsin.set(lookup, []);
    bySegmentIsin.get(lookup).push(mapping);
    if (!byIsin.has(isin)) byIsin.set(isin, []);
    byIsin.get(isin).push(mapping);
  }
  const severalCompanies = [...byIsin.values()].filter((list) => new Set(list.map((m) => upper(m.companyId))).size > 1).length;
  const severalPerExchange = [...bySegmentIsin.values()].filter((list) => list.length > 1).length;
  result.distinctIsins = byIsin.size;
  result.isinsUnderSeveralCompanies = severalCompanies;
  result.isinExchangePairsWithSeveralMappings = severalPerExchange;
  result.coverage = sorted(registry.list().reduce((acc, m) => (tally(acc, `${closed(['NSE', 'BSE'], m.exchange)}:${seriesCode(PublishedRegistry.seriesOf(m))}`), acc), {}));
  line('INFO', 'registry.shape', `distinct ISINs ${byIsin.size}; ISINs under more than one company ${severalCompanies}; ISIN and exchange pairs with more than one mapping ${severalPerExchange}; exchange:series: ${show(result.coverage)}`);

  /* Records that are not loaded and carry an ISIN (any disposition other than QUALIFIED). */
  const notLoadedByIsin = new Map();
  for (const record of records) {
    if (record.disposition === 'QUALIFIED' && isObject(record.mapping)) continue;
    const isin = upper(record.isin ?? (isObject(record.mapping) ? record.mapping.isin : ''));
    if (!isin) continue;
    if (!notLoadedByIsin.has(isin)) notLoadedByIsin.set(isin, []);
    notLoadedByIsin.get(isin).push(typeof record.exchange === 'string' ? record.exchange : '');
  }
  result.recordsNotLoadedWithAnIsin = [...notLoadedByIsin.values()].reduce((n, list) => n + list.length, 0);
  line('INFO', 'registry.notLoaded', `manifest records that are not loaded and carry an ISIN: ${result.recordsNotLoadedWithAnIsin}`);

  return { registry, recordsOfKey, recordOfMapping, listedCount, listedBySegmentIsin, bySegmentIsin, byIsin, notLoadedByIsin };
}

/* ---------------------------------------------------------------- step 4: the holdings */
function compareHoldings(csv, published, payload) {
  section('4. Holding by holding against the published mapping (pseudonymised)');
  const result = {};
  payload.holdings = result;
  const fingerprint = (text) => createHmac('sha256', csv.fingerprintKey).update(text, 'utf8').digest('hex');
  const short = (text) => fingerprint(text).slice(0, 16);

  /** In place of the P04 steps: the company the published registry carries for the ISIN on the segment. */
  const companyOfPublishedMapping = (exchangeSegment, isin) => {
    const candidates = published.bySegmentIsin.get(`${exchangeSegment}|${isin}`) ?? [];
    if (candidates.length === 0) return { status: 'NONE' };
    const companies = new Set(candidates.map((m) => upper(m.companyId)));
    if (companies.size > 1) return { status: 'SEVERAL_COMPANIES' };
    return { status: 'ONE', companyId: candidates[0].companyId };
  };

  const rows = [];
  for (const g of csv.groups) {
    const row = { label: g.label, exchange: g.exchange ?? 'absent', verdict: 'NOT_COMPARABLE', reason: 'OTHER', publishedMappings: 0, registryEntry: 'n/a', isin: 'n/a', exchangeAgrees: 'n/a', series: 'n/a', company: 'n/a', seriesCode: 'none', otherExchanges: 'none', unexpected: 0 };
    row.holdingFp = short(`holding\0${g.isin ?? `SYM:${g.symbol}`}\0${g.exchange ?? ''}`);
    row.mappingFp = 'none';
    rows.push(row);
    if (!g.isin) {
      row.reason = 'HOLDING_WITHOUT_ISIN';
      continue;
    }
    if (!g.exchange) {
      row.reason = 'HOLDING_WITHOUT_EXCHANGE';
      continue;
    }
    const segment = SEGMENT_OF[g.exchange];
    const candidates = published.bySegmentIsin.get(`${segment}|${g.isin}`) ?? [];
    const everywhere = published.byIsin.get(g.isin) ?? [];
    row.publishedMappings = candidates.length;
    row.otherExchanges = joined(everywhere.filter((m) => m.exchangeSegment !== segment).map((m) => closed(['NSE', 'BSE'], m.exchange)));

    /* Everything the manifest says about this ISIN on this exchange beyond one mapping. */
    const listedHere = published.listedBySegmentIsin.get(`${segment}|${g.isin}`) ?? [];
    const recordsHere = published.recordsOfKey.get(`${g.isin}|${g.exchange}`) ?? [];
    const notLoadedHere = (published.notLoadedByIsin.get(g.isin) ?? []).filter((exchange) => exchange === g.exchange || exchange === '').length;

    const q = qualifyAgainstPublishedRegistry({ isin: g.isin, exchange: g.exchange }, published.registry, companyOfPublishedMapping);
    if (q.status !== 'QUALIFIED') {
      row.reason = closed(ROW_REASONS, q.reason);
      row.verdict = q.reason === 'MISSING_P7_MAPPING' ? 'MISSING' : q.reason === 'AMBIGUOUS_PROVIDER_MAPPING' ? 'AMBIGUOUS' : q.reason === 'INVALID_ISIN_SYNTAX' ? 'NOT_COMPARABLE' : 'MISMATCH';
      row.unexpected = listedHere.filter((e) => !candidates.some((m) => entryOf(m) === e)).length + Math.max(0, recordsHere.length - candidates.length) + notLoadedHere;
      if (candidates.length > 0) row.seriesCode = joined(candidates.map((m) => seriesCode(PublishedRegistry.seriesOf(m))));
      continue;
    }

    /* Exactly one published mapping. Compare it, its record and its registry entry with the holding. */
    const mapping = q.mapping;
    const key = PublishedRegistry.keyOf(mapping.companyId, mapping.exchangeSegment, upper(mapping.isin), PublishedRegistry.seriesOf(mapping));
    const record = published.recordOfMapping.get(key) ?? {};
    const own = recordDimensions(record, mapping);
    const entry = entryOf(mapping);
    const oneCompany = new Set(everywhere.map((m) => upper(m.companyId))).size === 1;
    const dimensions = {
      isin: own.isin && upper(mapping.isin) === g.isin && q.securityIdentity.isin === g.isin,
      exchange: own.exchange && mapping.exchange === g.exchange && mapping.exchangeSegment === segment,
      series: own.series && q.securityIdentity.securityId === mapping.securityId,
      company: own.company && oneCompany && upper(q.companyId) === upper(mapping.companyId),
    };
    const listedOnce = (published.listedCount.get(entry) ?? 0) === 1;
    const unexpected = listedHere.filter((e) => e !== entry).length + Math.max(0, (published.listedCount.get(entry) ?? 0) - 1) + Math.max(0, recordsHere.length - 1) + notLoadedHere;
    row.registryEntry = yn(listedOnce);
    row.isin = yn(dimensions.isin);
    row.exchangeAgrees = yn(dimensions.exchange);
    row.series = yn(dimensions.series);
    row.company = yn(dimensions.company);
    row.seriesCode = seriesCode(q.securityIdentity.series);
    row.unexpected = unexpected;
    row.mappingFp = short(`mapping\0${mappingText(mapping)}\0${entry}`);
    if (!dimensions.isin) row.reason = 'ISIN_DISAGREES';
    else if (!dimensions.exchange) row.reason = 'EXCHANGE_DISAGREES';
    else if (!dimensions.series) row.reason = 'SERIES_DISAGREES';
    else if (!dimensions.company) row.reason = 'COMPANY_DISAGREES';
    else if (!listedOnce) row.reason = 'NOT_IN_REGISTRY_ENTRIES';
    else if (unexpected > 0) row.reason = 'UNEXPECTED_ENTRIES';
    else row.reason = 'EXACT_PUBLISHED_MAPPING';
    row.verdict = row.reason === 'EXACT_PUBLISHED_MAPPING' ? 'MATCH' : 'MISMATCH';
  }
  for (const row of rows) {
    row.verdict = closed(VERDICTS, row.verdict);
    row.reason = closed(ROW_REASONS, row.reason);
  }

  const columns = ['exchange', 'verdict', 'reason', 'publishedMappings', 'registryEntry', 'isin', 'exchangeAgrees', 'series', 'company', 'seriesCode', 'otherExchanges', 'unexpected', 'holdingFp', 'mappingFp'];
  process.stdout.write(`[COLUMNS] label | ${columns.join(' | ')}\n`);
  const rowLines = rows.map((row) => `[ROW] ${row.label} | ${columns.map((c) => row[c]).join(' | ')}`);
  for (const text of rowLines) process.stdout.write(`${text}\n`);

  const count = (verdict) => rows.filter((r) => r.verdict === verdict).length;
  result.rows = rows;
  result.count = rows.length;
  result.byVerdict = sorted(rows.reduce((acc, r) => (tally(acc, r.verdict), acc), {}));
  result.byVerdictAndExchange = sorted(rows.reduce((acc, r) => (tally(acc, `${r.exchange} ${r.verdict}`), acc), {}));
  result.byReason = sorted(rows.reduce((acc, r) => (tally(acc, r.reason), acc), {}));
  result.matchedSeries = sorted(rows.filter((r) => r.verdict === 'MATCH').reduce((acc, r) => (tally(acc, `${r.exchange}:${r.seriesCode}`), acc), {}));
  result.match = count('MATCH');
  result.missing = count('MISSING');
  result.ambiguous = count('AMBIGUOUS');
  result.mismatch = count('MISMATCH');
  result.notComparable = count('NOT_COMPARABLE');
  result.unexpectedEntries = rows.reduce((n, r) => n + r.unexpected, 0);
  result.withExactRegistryEntry = rows.filter((r) => r.registryEntry === 'yes').length;
  result.dimensions = {
    isin: rows.filter((r) => r.isin === 'yes').length,
    exchange: rows.filter((r) => r.exchangeAgrees === 'yes').length,
    series: rows.filter((r) => r.series === 'yes').length,
    company: rows.filter((r) => r.company === 'yes').length,
  };
  result.alsoPublishedOnTheOtherExchange = rows.filter((r) => r.otherExchanges !== 'none').length;
  result.rowsFingerprint = fingerprint(`rows\0${rowLines.join('\n')}`);

  process.stdout.write('\n');
  line('INFO', 'aggregate.verdict', `${rows.length} holding(s): ${show(result.byVerdict)}`);
  line('INFO', 'aggregate.verdict.perExchange', show(result.byVerdictAndExchange));
  line('INFO', 'aggregate.reason', show(result.byReason));
  line('INFO', 'aggregate.dimensions', `holdings whose published mapping agrees in: ISIN ${result.dimensions.isin}; exchange ${result.dimensions.exchange}; series ${result.dimensions.series}; company ${result.dimensions.company}; exact registry entry ${result.withExactRegistryEntry}`);
  line('INFO', 'aggregate.series', `matched holdings by exchange:series: ${show(result.matchedSeries)}`);
  line('INFO', 'aggregate.exceptions', `missing ${result.missing}; ambiguous ${result.ambiguous}; mismatched ${result.mismatch}; not comparable ${result.notComparable}; unexpected entries ${result.unexpectedEntries}`);
  line('INFO', 'aggregate.otherExchange', `holdings whose ISIN is also published on the other exchange (expected, not counted as unexpected): ${result.alsoPublishedOnTheOtherExchange}`);
  line('INFO', 'aggregate.fingerprint', `keyed fingerprint of the ${rows.length} rows: ${result.rowsFingerprint}`);
  return result;
}

/* ---------------------------------------------------------------- step 5: nothing changed */
function confirmReadOnly(options, csv, payload) {
  section('5. Read-only confirmation');
  const result = {};
  payload.readOnly = result;
  let unchanged = false;
  try {
    const again = readFileReadOnly(options.csv);
    unchanged = again.length === csv.rawBytes && sha256(again) === csv.rawSha256;
  } catch {
    unchanged = false;
  }
  result.csvUnchanged = unchanged;
  check('readOnly.csv', unchanged, 'the CSV has the same bytes at the end of the run as at the start');
  let model = 'NOT_ACTIVE';
  try {
    if (process.permission && typeof process.permission.has === 'function') model = process.permission.has('fs.write') ? 'ACTIVE_WRITE_ALLOWED' : 'ACTIVE_WRITE_DENIED';
  } catch {
    model = 'UNKNOWN';
  }
  result.nodePermissionModel = model;
  line('INFO', 'readOnly.permissionModel', `Node permission model: ${model}`);
  line('INFO', 'readOnly.calls', 'this utility has no write, rename, delete, mkdir, child-process or database call; its only network request was the GET of the manifest');
  return result;
}

/* ---------------------------------------------------------------- result */
function conditions(options, payload) {
  const csv = payload.csv ?? {};
  const manifest = payload.manifest ?? {};
  const registry = payload.registry ?? {};
  const holdings = payload.holdings ?? null;
  const readOnly = payload.readOnly ?? null;
  const total = holdings ? holdings.count : 0;
  const list = [
    { id: 1, text: 'CSV import-content SHA-256 equals the expected digest', value: csv.sha256ImportContent === undefined ? null : csv.sha256ImportContent === options.expectedCsvSha256 },
    { id: 2, text: 'manifest SHA-256 equals the expected digest, verified before parsing', value: manifest.sha256 === undefined ? null : manifest.sha256 === options.expectedManifestSha256 },
    { id: 3, text: `pipeline commit equals ${RECORDED.pipelineCommit}`, value: manifest.pipelineCommitMatches === undefined ? null : manifest.pipelineCommitMatches === true },
    { id: 4, text: `${RECORDED.mappings} qualified mappings (stated, QUALIFIED records, registry entries, loaded registry, all in agreement)`, value: registry.loadedMatch === undefined ? null : manifest.statedCountsMatch === true && registry.qualifiedRecordsMatch === true && registry.loadedMatch === true && registry.entriesMatch === true && registry.entriesEqual === true && registry.recordsAgree === true },
    { id: 5, text: `all ${options.expectedHoldings} holdings have an exact published entry`, value: holdings ? total === options.expectedHoldings && holdings.match === total && holdings.withExactRegistryEntry === total : null, detail: holdings ? `${holdings.match} of ${total}` : null },
    { id: 6, text: 'every identity dimension agrees (ISIN, exchange, series, company)', value: holdings ? total > 0 && holdings.dimensions.isin === total && holdings.dimensions.exchange === total && holdings.dimensions.series === total && holdings.dimensions.company === total : null, detail: holdings ? `ISIN ${holdings.dimensions.isin}, exchange ${holdings.dimensions.exchange}, series ${holdings.dimensions.series}, company ${holdings.dimensions.company} of ${total}` : null },
    { id: 7, text: 'zero missing, ambiguous, mismatched or unexpected', value: holdings ? holdings.missing === 0 && holdings.ambiguous === 0 && holdings.mismatch === 0 && holdings.notComparable === 0 && holdings.unexpectedEntries === 0 && csv.holdingsNamingSeveralExchanges === 0 : null, detail: holdings ? `missing ${holdings.missing}, ambiguous ${holdings.ambiguous}, mismatched ${holdings.mismatch}, not comparable ${holdings.notComparable}, unexpected entries ${holdings.unexpectedEntries}` : null },
    { id: 8, text: 'nothing mutated (no write call in this utility; CSV unchanged at the end)', value: readOnly ? readOnly.csvUnchanged === true : null },
    { id: 9, text: 'the inputs are the recorded ones (no override)', value: Array.isArray(options.overrides) ? options.overrides.length === 0 : null, detail: Array.isArray(options.overrides) && options.overrides.length > 0 ? `overridden: ${options.overrides.join(', ')}` : null },
  ];
  return list;
}

function finish(resultName, exitCode, options, payload) {
  const list = conditions(options, payload);
  process.stdout.write('\n== Conditions\n');
  for (const c of list) {
    process.stdout.write(`[COND] ${c.id} ${c.text}: ${c.value === null ? 'not evaluated' : yn(c.value)}${c.detail ? ` (${c.detail})` : ''}\n`);
  }
  const failed = list.filter((c) => c.value === false).map((c) => c.id);
  const notEvaluated = list.filter((c) => c.value === null).map((c) => c.id);
  const body = {
    tool: TOOL_VERSION,
    ...payload,
    conditions: Object.fromEntries(list.map((c) => [String(c.id), c.value === null ? 'NOT_EVALUATED' : yn(c.value)])),
    unresolved: [...new Set(unresolved)],
    checks: { pass: counters.PASS, fail: counters.FAIL, warn: counters.WARN },
    result: resultName,
  };
  const json = JSON.stringify(body);
  process.stdout.write('\n== Result\n');
  process.stdout.write(`W04_P7_PUBLISHED_MANIFEST_RESULT_JSON: ${json}\n`);
  process.stdout.write(`W04_P7_PUBLISHED_MANIFEST_RESULT_JSON_SHA256: ${sha256Text(json)}\n`);
  process.stdout.write(`checks: ${counters.PASS} pass, ${counters.FAIL} fail, ${counters.WARN} warn\n`);
  process.stdout.write(`failed conditions: ${failed.length === 0 ? 'none' : failed.join(', ')}\n`);
  process.stdout.write(`conditions not evaluated: ${notEvaluated.length === 0 ? 'none' : notEvaluated.join(', ')}\n`);
  process.stdout.write(`unresolved: ${body.unresolved.length === 0 ? 'none' : body.unresolved.join(', ')}\n`);
  process.stdout.write('The comparison used the downloaded manifest bytes only. No registry was regenerated, nothing was written and no identity was assigned.\n');
  process.stdout.write(`RESULT: ${resultName}\n`);
  process.exitCode = exitCode;
}

async function main() {
  process.stdout.write(`W04-P7 - published-manifest qualification of the original holdings (${TOOL_VERSION}). Read-only. Sanitized output.\n`);
  const payload = { recordedInputs: null, csv: null, manifest: null, registry: null, holdings: null, readOnly: null, identityAssigned: 'NONE', registryWritten: 'NONE', inMemoryRegeneration: 'NONE' };
  let options = { overrides: null, expectedHoldings: RECORDED.holdings, expectedCsvSha256: RECORDED.csvSha256, expectedManifestSha256: RECORDED.manifestSha256 };
  try {
    options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${USAGE}\n`);
      process.exitCode = 0;
      return;
    }
    payload.recordedInputs = options.overrides.length === 0 ? 'yes' : 'no';
    payload.overrides = options.overrides;
    line('INFO', 'inputs', options.overrides.length === 0 ? 'the recorded inputs are in force (no override)' : `overridden inputs: ${options.overrides.join(', ')} - this run is a tool check, not an acceptance run`);
    line('INFO', 'node', `Node major version ${Number.parseInt(process.versions.node, 10)}`);
    const csv = readCsv(options, payload);
    const manifest = await downloadManifest(options, payload);
    const published = loadPublishedRegistry(manifest, payload);
    compareHoldings(csv, published, payload);
    confirmReadOnly(options, csv, payload);
    const allHold = conditions(options, payload).filter((c) => c.id !== 9).every((c) => c.value === true) && counters.FAIL === 0;
    if (!allHold) finish('NOT_ALL_MATCH', 1, options, payload);
    else if (options.overrides.length === 0 && options.expectedHoldings === RECORDED.holdings) finish('ALL_64_MATCH_PUBLISHED_MANIFEST', 0, options, payload);
    else finish('ALL_MATCH_NOT_RECORDED_INPUTS', 3, options, payload);
  } catch (error) {
    let code = 'UNEXPECTED_ERROR';
    let kind = 'INCONCLUSIVE';
    let evidence = [];
    let where = '';
    if (error instanceof Stop) {
      code = error.stopCode;
      kind = error.kind;
      evidence = error.evidence;
    } else {
      /* Never the message: it can quote a path or a value. */
      if (error && typeof error.code === 'string' && SYSTEM_ERRORS.includes(error.code)) code = `UNEXPECTED_ERROR_${error.code}`;
      else if (error && ERROR_NAMES.includes(error.name)) code = `UNEXPECTED_ERROR_${error.name}`;
      const frame = String(error && error.stack).match(/w04-p7-published-manifest-qualification\.mjs:(\d+):\d+/);
      if (frame) where = ` (utility source line ${frame[1]})`;
    }
    unresolved.push(`STOPPED:${code}`);
    process.stdout.write(`\n[STOP] ${code} at step: ${currentStep}${where}\n`);
    for (const text of evidence) process.stdout.write(`[EVIDENCE] ${text}\n`);
    if (code.startsWith('ARGUMENT_')) process.stdout.write(`${USAGE}\n`);
    process.stdout.write('Nothing further was examined. No holding was compared after this point.\n');
    if (kind === 'PRECONDITION') finish('FAILED_PRECONDITION', 1, options, payload);
    else finish('INCONCLUSIVE', 2, options, payload);
  }
}

await main();
