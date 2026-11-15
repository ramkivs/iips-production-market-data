#!/usr/bin/env node
/**
 * W04 - E4: read-only reproduction of the stored lineage digests from the original broker CSV.
 *
 * PURPOSE
 *   One exact W11-DEP1 capture holds the holdings of an owner-bound portfolio revision. Each
 *   holding carries a `lineageDigest` that the import pipeline computed from the broker file. This
 *   utility recomputes those digests from the original CSV, with the production algorithm, and
 *   reports which stored digests are reproduced exactly.
 *
 *   A reproduced digest proves what the committed input of that holding carried (ISIN present or
 *   absent, exchange present or absent, and every measure). It is NOT an identity classification:
 *   the utility assigns no security identity, no cause and no acceptance.
 *
 * READ-ONLY
 *   Imports node:crypto, node:fs and node:path and nothing else: no network module, no child
 *   process. Every file is opened with the 'r' flag. There is no write, rename, delete or mkdir
 *   call. It does not start, stop or contact IPD or IRR, does not open the portfolio database, does
 *   not read or create `journal.ndjson`, and reads no repository checkout.
 *   Inputs: (1) the CSV named by --csv, (2) the exact capture found under --capture-dir.
 *
 * SANITIZED OUTPUT
 *   Counts, SHA-256 digests of whole files, yes/no answers, values from closed vocabularies, and
 *   ordinal numbers only: H<n> is the n-th holding in the capture, G<n> the n-th holding derived
 *   from the CSV, and a CSV line number is the physical line of the file. The utility never prints
 *   a symbol, ISIN, company identifier, file name, path, quantity, price, value, weight, timestamp
 *   or per-holding digest. Error text is reduced to an error code and the name of the step.
 *
 * ALGORITHM (production sources, IPD ramkivs/iips-production-market-data; identical blobs at
 *            1aee57f, 1fded9d, a624d06 and 81b5178)
 *   content digest   src/contracts/provenance.ts `computeSha256` over the text the browser decoded
 *                    from the file (IRR BrokerHoldingsPreview.tsx `file.text()`): SHA-256 of the
 *                    UTF-8 encoding of the UTF-8 decoded text. Whether the decoder dropped a
 *                    leading byte-order mark is browser behaviour, not repository source, so
 *                    both readings are computed and the one equal to the expected digest is used.
 *   detection        frontend/src/features/portfolio/import/broker-format-detector.ts
 *   CSV parsing      frontend/src/features/portfolio/import/adapters/csv-parser-helper.ts
 *   Dhan rows        frontend/src/features/portfolio/import/adapters/dhan-holdings-adapter.ts
 *   holdings         frontend/src/features/portfolio/import/broker-holdings-mapper.ts
 *                    `mapBrokerOutputToUserHoldings`: exclusion, grouping, aggregation, weights
 *   lineage digest   same file + src/contracts/provenance.ts `computeLineageHash`:
 *                      SHA-256( JSON.stringify({symbol, companyId, isin?, exchange?, quantity,
 *                        averageBuyPrice, currentPrice, marketValue, weightPercentage, active,
 *                        sourceBroker, identityStatus, resolutionDisposition})
 *                        + 'UNCLASSIFIED' + asOf + 'v1.0.0-bi03' )
 *                    `persistBrokerImport` (src/persistence/brokerImportPersistence.ts) stores
 *                    that digest unchanged. It is the only lineage form this utility computes.
 *   not computed     `rowLineageDigestOf` (same file) is a different per-row digest that IPD
 *                    computes on the snapshot-v2 save. That save requires expectedRevision >= 1
 *                    and so cannot create revision 1, and the dispatcher emits no v2 write. The
 *                    manual-portfolio digest belongs to manual entry. Neither is ported.
 *   whole import     src/persistence/brokerImportPersistence.ts `computeBrokerImportProvenance`
 *
 *   The functions between the PORT markers below are those production functions with the type
 *   annotations removed and the binary-input branches omitted (the input here is always text).
 *   The self-test beside this file runs the unmodified compiled production pipeline on the same
 *   synthetic inputs and requires every digest to be reproduced.
 *
 * WHAT THE CSV DOES NOT CONTAIN
 *   Three members of the digest are outputs of the identity authority at import time, not of the
 *   file: `companyId`, `identityStatus`, `resolutionDisposition`. The fourth is the import instant
 *   `asOf`. All four are stored in the capture and are read from it. Every other member is derived
 *   from the CSV.
 *
 * MATCHING
 *   For every pair of a stored holding H and a CSV-derived holding G the digest is computed from
 *   G's CSV-derived members and H's four stored members, and compared with H's stored digest.
 *   Nothing is paired by symbol, name or similarity. A match is exact digest equality.
 *     REPRODUCED                   exactly one G reproduces H, and that G reproduces only H
 *     AMBIGUOUS                    more than one G reproduces H, or its G reproduces several H
 *     REPRODUCED_IDENTIFIERS_ONLY  no G reproduces H, but H's digest is reproduced from H's own
 *                                  stored measures with an ISIN that occurs in the CSV (or none)
 *                                  and an exchange of the closed set. A weaker, separate result.
 *     NOT_REPRODUCED               none of the above
 *
 * EXIT CODES
 *   0  RESULT: REPRODUCED_ALL  every target digest reproduced one-to-one from the CSV, the
 *                              whole-import digest equals the stored one, no check failed and
 *                              nothing is listed as unresolved
 *   1  RESULT: PARTIAL         the utility ran; something is unmatched, ambiguous or failed
 *   2  RESULT: INCONCLUSIVE    an input was missing or not the expected one; nothing was compared
 *
 * USAGE
 *   node w04-e4-csv-lineage-reproduction.mjs --csv <file> --capture-dir <dir>
 *        [--expected-csv-sha256 <hex>] [--expected-capture-sha256 <hex>]
 */
import { createHash } from 'node:crypto';
import { closeSync, existsSync, openSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const TOOL_VERSION = 'w04-e4-csv-lineage/1';

/* ---------------------------------------------------------------- recorded facts */
const RECORDED = Object.freeze({
  csvSha256: 'a3c3ee7635e24e56d1d2d6b9411a6de561f554addd382ab163344706e7b63107',
  captureSha256: 'c5dd51f51025e3e17e3b798164c6b8078fa5487392d8f0dfd96be9bb7c79eda3',
  portfolioId: 'DHAN_PORTFOLIO',
  revision: 1,
  holdings: 64,
  identityObject: 1,
  identityNull: 63,
});
const EXACT_CAPTURE_SCHEMA = 'iips.w11-dep1.owner-bound-portfolio-capture.exact/v1';
const LOCAL_ONLY_DIRECTORY = 'LOCAL-ONLY-DO-NOT-PUBLISH';
const EXACT_CAPTURE_FILE = 'exact-owner-bound-portfolio-capture.json';
const PREVIEW_TEXT_LIMIT_BYTES = 1048576; // IRR brokerHoldingsPreview.ts: 1 MiB of CSV text
const CAPTURE_LIMIT_BYTES = 67108864;
const CSV_READ_LIMIT_BYTES = 16777216;

/* Closed vocabularies. A value outside its list is reported as OTHER, never echoed. */
const VOCAB = Object.freeze({
  broker: ['ZERODHA', 'DHAN', 'GROWW', 'GENERIC', 'UNKNOWN'],
  variant: ['DHAN_DETAILED_HOLDINGS_V1', 'DHAN_WEB_UI_SUMMARY_V1'],
  identityStatus: ['RESOLVED', 'UNRESOLVED'],
  resolutionDisposition: ['CANONICAL_P04', 'NON_PRODUCTION_OPERATOR_BYPASS'],
  semantics: ['SAVED_NEW_BATCH', 'MERGED_INTO_EXISTING', 'RESET', 'REPLACE'],
  operation: ['INITIAL', 'MERGE', 'REPLACE', 'RESET', 'DELETE'],
  eligibility: ['NO_CAPTURE', 'NOT_EVIDENCE_SYNTHETIC_TEST_PEER', 'NOT_EVIDENCE_NOT_A_WINDOWS_HOST',
    'HOST_CAPTURE_SUBJECT_TO_REVIEW'],
  systemError: ['ENOENT', 'EACCES', 'EPERM', 'EISDIR', 'ENOTDIR', 'EBUSY', 'EMFILE', 'ENAMETOOLONG',
    'ERR_ACCESS_DENIED', 'ERR_STRING_TOO_LONG', 'ERR_FS_FILE_TOO_LARGE'],
  errorName: ['TypeError', 'RangeError', 'ReferenceError', 'SyntaxError'],
});
const MEASURES = Object.freeze(['quantity', 'averageBuyPrice', 'currentPrice', 'marketValue', 'weightPercentage']);

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
function note(code, text) {
  unresolved.push(code);
  line('WARN', 'unresolved', `${code}: ${text}`);
}

/* ---------------------------------------------------------------- helpers */
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const sha256Text = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
const isHex64 = (value) => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const pad = (n, width) => String(n).padStart(width, '0');

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

/** Sorted keys, undefined members dropped. Used only to compare two reads of the capture. */
function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

class Stop extends Error {
  constructor(code) {
    super(code);
    this.name = 'Stop';
    this.stopCode = code;
  }
}

/* ============================================================================================
 * PORT BEGIN - production functions, type annotations removed, text input only.
 * ========================================================================================== */

/* ---- IPD frontend/src/features/portfolio/import/adapters/csv-parser-helper.ts -------------- */

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
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

function parseCsvRows(csvText) {
  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalized.split('\n');
  const rows = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    rows.push(parseCsvLine(trimmed));
  }

  return rows;
}

function parseCsvToObjects(csvText, options) {
  const allRows = parseCsvRows(csvText);
  const skip = options?.skipHeaderRows ?? 0;

  if (allRows.length <= skip) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = allRows[skip];
  const headers = rawHeaders.map((h) => h.replace(/^["']|["']$/g, '').trim());

  const resultRows = [];

  for (let i = skip + 1; i < allRows.length; i++) {
    const row = allRows[i];
    const rowObj = {};
    let hasData = false;

    for (let j = 0; j < headers.length; j++) {
      const headerKey = headers[j];
      const val = row[j] !== undefined ? row[j].replace(/^["']|["']$/g, '').trim() : '';
      rowObj[headerKey] = val;
      if (val !== '') hasData = true;
    }

    if (hasData) {
      resultRows.push(rowObj);
    }
  }

  return { headers, rows: resultRows };
}

/* The production character class is [<rupee sign>$,%\s]; the rupee sign is written as \u20B9. */
function parseNumericCell(val, fallback = 0) {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;

  const str = String(val).replace(/[\u20B9$,%\s]/g, '').trim();
  if (!str) return fallback;

  const parsed = Number(str);
  return isNaN(parsed) ? fallback : parsed;
}

function parseStringCell(val) {
  if (val === undefined || val === null) return '';
  return String(val).replace(/^["']|["']$/g, '').trim();
}

/* ---- IPD frontend/src/features/portfolio/import/broker-format-detector.ts `detectFormat` ---- */

function detectFormat(textContent, fileName) {
  const fileNameLower = (fileName || '').toLowerCase().trim();
  const isXlsxExt = fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls');

  if (isXlsxExt) {
    return { brokerType: 'UNKNOWN', format: 'XLSX', requiresXlsx: true };
  }

  const rows = parseCsvRows(textContent);
  if (rows.length === 0) {
    return { brokerType: 'UNKNOWN', format: 'UNKNOWN', requiresXlsx: false };
  }

  let detectedBroker = 'UNKNOWN';

  for (let r = 0; r < Math.min(rows.length, 3); r++) {
    const candidateHeaders = rows[r].map((h) => h.toLowerCase().trim());

    const hasZerodhaInst = candidateHeaders.includes('instrument');
    const hasZerodhaQty = candidateHeaders.some((h) => h === 'qty.' || h === 'qty');
    const hasZerodhaCost = candidateHeaders.some((h) => h === 'avg. cost' || h === 'avg cost' || h === 'cur. val' || h === 'ltp');

    if (hasZerodhaInst && (hasZerodhaQty || hasZerodhaCost)) {
      detectedBroker = 'ZERODHA';
      break;
    }

    const hasDhanDetailedSymbol = candidateHeaders.includes('trading symbol') || candidateHeaders.includes('dp qty') || candidateHeaders.includes('available qty');
    const hasDhanDetailedPrice = candidateHeaders.includes('average buy price') || candidateHeaders.includes('last traded price');

    const hasDhanWebUi = candidateHeaders.includes('name') &&
      (candidateHeaders.includes('quantity') || candidateHeaders.includes('qty')) &&
      (candidateHeaders.includes('avg price') || candidateHeaders.includes('avg. price')) &&
      (candidateHeaders.includes('last traded') || candidateHeaders.includes('last traded price')) &&
      (candidateHeaders.includes('investment') || candidateHeaders.includes('invested')) &&
      (candidateHeaders.includes('current value') || candidateHeaders.includes('market value'));

    if (hasDhanDetailedSymbol || hasDhanDetailedPrice) {
      detectedBroker = 'DHAN';
      break;
    } else if (hasDhanWebUi) {
      detectedBroker = 'DHAN';
      break;
    }

    const hasGrowwStockName = candidateHeaders.includes('stock name');
    const hasGrowwShares = candidateHeaders.includes('shares') || candidateHeaders.includes('total shares');
    const hasGrowwReturns = candidateHeaders.includes('total returns') || candidateHeaders.includes('total returns %') || candidateHeaders.includes('xirr');

    if ((hasGrowwStockName && (hasGrowwShares || hasGrowwReturns)) || (hasGrowwShares && hasGrowwReturns)) {
      detectedBroker = 'GROWW';
      break;
    }
  }

  if (detectedBroker === 'UNKNOWN') {
    return { brokerType: 'UNKNOWN', format: 'CSV', requiresXlsx: false };
  }

  return { brokerType: detectedBroker, format: 'CSV', requiresXlsx: false };
}

/* ---- IPD frontend/src/features/portfolio/import/adapters/dhan-holdings-adapter.ts `parse` ---
 * Added for reporting only, never used in a digest: `columns` (which columns were located) and
 * `sourceRow` (the position of the holding's row among the parsed data rows). */

function parseDhanHoldings(textContent) {
  const warnings = [];
  const errors = [];

  const { headers, rows } = parseCsvToObjects(textContent, {
    skipHeaderRows: 0,
  });

  if (headers.length === 0 || rows.length === 0) {
    return { success: false, brokerType: 'DHAN', holdings: [], dataRows: rows.length, headerCount: headers.length, skippedEmptySymbol: 0, columns: null, dhanVariant: null, schemaValid: false };
  }

  const headerMap = new Map();
  for (const h of headers) {
    headerMap.set(h.toLowerCase().trim(), h);
  }

  const symbolCol = headerMap.get('trading symbol') || headerMap.get('symbol') || headerMap.get('stock name') || headerMap.get('name');
  const isinCol = headerMap.get('isin');
  const exchangeCol = headerMap.get('exchange');
  const qtyCol = headerMap.get('total qty') || headerMap.get('quantity') || headerMap.get('available qty') || headerMap.get('dp qty') || headerMap.get('total quantity') || headerMap.get('qty') || headerMap.get('qty.');
  const avgBuyPriceCol = headerMap.get('average buy price') || headerMap.get('average price') || headerMap.get('avg buy price') || headerMap.get('avg price') || headerMap.get('buy avg') || headerMap.get('avg. cost') || headerMap.get('buy price');
  const ltpCol = headerMap.get('last traded price') || headerMap.get('last traded') || headerMap.get('ltp') || headerMap.get('current price');
  const curValCol = headerMap.get('current value') || headerMap.get('market value');

  const isWebUiVariant = !headerMap.has('trading symbol') && headerMap.has('name') && (headerMap.has('last traded') || headerMap.has('investment'));
  const dhanVariant = isWebUiVariant ? 'DHAN_WEB_UI_SUMMARY_V1' : 'DHAN_DETAILED_HOLDINGS_V1';
  const columns = { symbol: !!symbolCol, isin: !!isinCol, exchange: !!exchangeCol, quantity: !!qtyCol, averageBuyPrice: !!avgBuyPriceCol, lastTradedPrice: !!ltpCol, currentValue: !!curValCol };

  if (!symbolCol || (!qtyCol && !avgBuyPriceCol && !ltpCol)) {
    return { success: false, brokerType: 'DHAN', holdings: [], dataRows: rows.length, headerCount: headers.length, skippedEmptySymbol: 0, columns, dhanVariant, schemaValid: false };
  }

  const holdings = [];
  let skippedEmptySymbol = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawSymbol = parseStringCell(row[symbolCol]);
    if (!rawSymbol) {
      warnings.push(`Row ${i + 1}: Skipped row with empty Symbol/Name.`);
      skippedEmptySymbol += 1;
      continue;
    }

    const isin = isinCol ? parseStringCell(row[isinCol]) : undefined;
    const rawExchange = exchangeCol ? parseStringCell(row[exchangeCol]).toUpperCase() : undefined;
    const exchange = rawExchange ? (rawExchange.includes('BSE') ? 'BSE' : 'NSE') : undefined;

    const quantity = qtyCol ? parseNumericCell(row[qtyCol], 0) : 0;
    const averagePrice = avgBuyPriceCol ? parseNumericCell(row[avgBuyPriceCol], 0) : 0;
    const ltp = ltpCol ? parseNumericCell(row[ltpCol], 0) : averagePrice;
    const curVal = curValCol ? parseNumericCell(row[curValCol], 0) : (quantity * ltp);

    const holding = {
      symbol: rawSymbol.toUpperCase(),
      isin: isin ? isin.toUpperCase() : undefined,
      quantity,
      averagePrice,
      currentPrice: ltp,
      closePrice: ltp,
      exchange,
      assetClass: 'EQUITY',
      marketValue: curVal,
      sourceRow: i,
    };

    holdings.push(holding);
  }

  return {
    success: errors.length === 0 && holdings.length > 0,
    brokerType: 'DHAN',
    holdings,
    dataRows: rows.length,
    headerCount: headers.length,
    skippedEmptySymbol,
    columns,
    dhanVariant,
    schemaValid: true,
  };
}

/* ---- IPD frontend/src/features/portfolio/import/broker-holdings-mapper.ts
 *      `mapBrokerOutputToUserHoldings`, steps 1 to 3, with the options the IRR preview passes:
 *      minHoldingValueThreshold 0, targetWeightPrecision 4.
 * The identity lookup of the production function needs the security master and is not ported.
 * Its three outputs per holding are read from the capture instead (see the header).
 * Added for reporting only: `exclusions` and `rowIndices` hold positions, never values. ------- */

function mapParsedHoldings(rawHoldings) {
  const minThreshold = 0;
  const precision = 4;
  const exclusions = [];
  let aggregatedCount = 0;

  // Step 1: Filter and group raw holdings
  const groupedMap = new Map();

  for (let i = 0; i < rawHoldings.length; i++) {
    const raw = rawHoldings[i];

    // Validate symbol
    const symbol = (raw.symbol || '').trim().toUpperCase();
    const isin = raw.isin ? raw.isin.trim().toUpperCase() : undefined;

    if (!symbol && !isin) {
      exclusions.push({ index: i, reason: 'MISSING_SYMBOL_AND_ISIN' });
      continue;
    }

    // Validate quantity
    const qty = Number(raw.quantity);
    if (isNaN(qty) || qty <= 0) {
      exclusions.push({ index: i, reason: 'NON_POSITIVE_QTY' });
      continue;
    }

    // Validate price & market value
    const avgPrice = Number(raw.averagePrice);
    const currPrice = raw.currentPrice !== undefined && !isNaN(Number(raw.currentPrice)) && Number(raw.currentPrice) > 0
      ? Number(raw.currentPrice)
      : (raw.closePrice !== undefined && !isNaN(Number(raw.closePrice)) && Number(raw.closePrice) > 0
          ? Number(raw.closePrice)
          : (avgPrice > 0 ? avgPrice : 0));

    if (currPrice <= 0) {
      exclusions.push({ index: i, reason: 'NON_POSITIVE_PRICE' });
      continue;
    }

    const calculatedMktVal = qty * currPrice;
    if (calculatedMktVal <= minThreshold) {
      exclusions.push({ index: i, reason: 'MARKET_VALUE_AT_OR_BELOW_THRESHOLD' });
      continue;
    }

    // Determine grouping key (prefer ISIN if present, fallback to uppercase symbol)
    const primaryKey = isin ? `ISIN:${isin}` : `SYM:${symbol}`;

    let group = groupedMap.get(primaryKey);
    if (!group) {
      let exchange = undefined;
      if (raw.exchange === 'NSE' || raw.exchange === 'BSE') {
        exchange = raw.exchange;
      }
      group = {
        primaryKey,
        symbol: symbol || isin || 'UNKNOWN',
        isin,
        exchange,
        items: [],
        rowIndices: [],
      };
      groupedMap.set(primaryKey, group);
    }

    group.items.push(raw);
    group.rowIndices.push(i);
  }

  // Step 2: Aggregate duplicates
  const intermediateHoldings = [];

  for (const [, group] of groupedMap.entries()) {
    if (group.items.length > 1) {
      aggregatedCount += (group.items.length - 1);
    }

    let totalQty = 0;
    let totalCostBasis = 0;
    let latestCurrentPrice = 0;

    for (const item of group.items) {
      const q = Number(item.quantity);
      const buyPrice = Number(item.averagePrice) > 0 ? Number(item.averagePrice) : 0;
      const cPrice = item.currentPrice !== undefined && Number(item.currentPrice) > 0
        ? Number(item.currentPrice)
        : (item.closePrice !== undefined && Number(item.closePrice) > 0 ? Number(item.closePrice) : buyPrice);

      totalQty += q;
      totalCostBasis += (q * buyPrice);
      if (cPrice > 0) {
        latestCurrentPrice = cPrice;
      }
    }

    const weightedAvgBuyPrice = totalQty > 0 ? (totalCostBasis / totalQty) : 0;
    const finalCurrentPrice = latestCurrentPrice > 0 ? latestCurrentPrice : weightedAvgBuyPrice;
    const marketValue = totalQty * finalCurrentPrice;

    intermediateHoldings.push({
      symbol: group.symbol,
      isin: group.isin,
      exchange: group.exchange,
      quantity: totalQty,
      averageBuyPrice: weightedAvgBuyPrice,
      currentPrice: finalCurrentPrice,
      marketValue,
      rowIndices: group.rowIndices,
    });
  }

  // Step 3: Compute portfolio total market value and weights
  const totalPortfolioMarketValue = intermediateHoldings.reduce((sum, h) => sum + h.marketValue, 0);

  if (totalPortfolioMarketValue <= 0 || intermediateHoldings.length === 0) {
    return { holdings: [], exclusions, aggregatedCount, empty: true };
  }

  // Calculate raw weights
  const scale = Math.pow(10, precision);
  let weightSum = 0;
  let maxWeightIndex = 0;
  let maxWeightVal = -1;

  const rawWeights = [];

  for (let i = 0; i < intermediateHoldings.length; i++) {
    const h = intermediateHoldings[i];
    const rawWeight = (h.marketValue / totalPortfolioMarketValue) * 100;
    const roundedWeight = Math.round(rawWeight * scale) / scale;
    rawWeights.push(roundedWeight);
    weightSum += roundedWeight;

    if (h.marketValue > maxWeightVal) {
      maxWeightVal = h.marketValue;
      maxWeightIndex = i;
    }
  }

  // Normalize weight sum to exactly 100.0% by adjusting largest holding if rounding residual exists
  const residual = Math.round((100.0 - weightSum) * scale) / scale;
  if (residual !== 0 && intermediateHoldings.length > 0) {
    rawWeights[maxWeightIndex] = Math.round((rawWeights[maxWeightIndex] + residual) * scale) / scale;
  }

  const holdings = intermediateHoldings.map((base, i) => ({ ...base, weightPercentage: rawWeights[i] }));
  return { holdings, exclusions, aggregatedCount, empty: false };
}

/* ---- IPD broker-holdings-mapper.ts `holdingPayload` + src/contracts/provenance.ts
 *      `computeLineageHash`. `measures` supplies symbol, the five measures and sourceBroker;
 *      `identity` supplies companyId, identityStatus and resolutionDisposition. -------------- */

function mapperLineageDigest(measures, isin, exchange, identity, asOf) {
  const holdingPayload = {
    symbol: measures.symbol,
    companyId: identity.companyId,
    isin,
    exchange,
    quantity: measures.quantity,
    averageBuyPrice: measures.averageBuyPrice,
    currentPrice: measures.currentPrice,
    marketValue: measures.marketValue,
    weightPercentage: measures.weightPercentage,
    active: true,
    sourceBroker: measures.sourceBroker,
    identityStatus: identity.identityStatus,
    resolutionDisposition: identity.resolutionDisposition,
  };
  const parts = [
    JSON.stringify(holdingPayload),
    'UNCLASSIFIED',
    asOf,
    'v1.0.0-bi03',
  ];
  return sha256Text(parts.join(''));
}

/* ---- IPD src/persistence/brokerImportPersistence.ts `computeBrokerImportProvenance` -------- */

function computeBrokerImportProvenance(request) {
  const canonical = [
    `portfolio:${request.portfolioId}`,
    `file:${request.fileName}`,
    `broker:${request.sourceBroker}`,
    `imported:${request.importedAt}`,
    `content:${request.contentDigest}`,
    ...[...request.holdings]
      .sort((a, b) => (a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0))
      .map((h) => `${h.symbol}|${h.isin ?? ''}|${h.exchange ?? ''}|${h.quantity}|${h.averageBuyPrice}|${h.currentPrice}|${h.marketValue}|${h.weightPercentage}|${h.active}|${h.sourceBroker}|${h.lineageDigest}`),
  ].join('\n');
  return sha256Text(canonical);
}

/* ============================================================================================
 * PORT END
 * ========================================================================================== */

/**
 * Physical 1-based line number in the file of every data row that `parseCsvToObjects` returns.
 * It repeats the two filters of the parser (blank lines; rows whose cells are all empty) and
 * computes no value. Used only to report where a row is.
 */
function dataRowLineNumbers(csvText) {
  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = normalized.split('\n');
  const physical = [];
  for (let n = 0; n < rawLines.length; n++) {
    if (rawLines[n].trim()) physical.push(n + 1);
  }
  const allRows = parseCsvRows(csvText);
  if (allRows.length !== physical.length) throw new Stop('INTERNAL_LINE_TRACE_MISMATCH');
  if (allRows.length === 0) return [];
  const headerCount = allRows[0].length;
  const lines = [];
  for (let i = 1; i < allRows.length; i++) {
    let hasData = false;
    for (let j = 0; j < headerCount; j++) {
      const val = allRows[i][j] !== undefined ? allRows[i][j].replace(/^["']|["']$/g, '').trim() : '';
      if (val !== '') hasData = true;
    }
    if (hasData) lines.push(physical[i]);
  }
  return lines;
}

function inputClass(isin, exchange) {
  return `${isin === undefined ? 'NO_ISIN' : 'ISIN'}+${exchange === undefined ? 'NO_EXCHANGE' : `EXCHANGE_${exchange}`}`;
}

/* ---------------------------------------------------------------- arguments */
const USAGE = [
  'usage: node w04-e4-csv-lineage-reproduction.mjs --csv <file> --capture-dir <dir>',
  '            [--expected-csv-sha256 <hex>] [--expected-capture-sha256 <hex>]',
  '',
  '  --csv <file>          the original broker CSV. Opened read-only.',
  '  --capture-dir <dir>   the capture root, a capture run folder, its LOCAL-ONLY folder, or the',
  '                        exact capture file itself. Searched read-only for the exact capture',
  '                        whose SHA-256 is the expected one.',
  '  The two --expected options replace the recorded digests. A run that uses either of them is',
  '  reported as not being a run on the recorded inputs.',
].join('\n');

function parseArguments(argv) {
  const options = { csv: null, captureDir: null, expectedCsvSha256: RECORDED.csvSha256, expectedCaptureSha256: RECORDED.captureSha256, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = () => {
      i += 1;
      if (i >= argv.length) throw new Stop('ARGUMENT_VALUE_MISSING');
      return argv[i];
    };
    if (flag === '--csv') options.csv = value();
    else if (flag === '--capture-dir') options.captureDir = value();
    else if (flag === '--expected-csv-sha256') options.expectedCsvSha256 = value().toLowerCase();
    else if (flag === '--expected-capture-sha256') options.expectedCaptureSha256 = value().toLowerCase();
    else if (flag === '--help' || flag === '-h') options.help = true;
    else throw new Stop('ARGUMENT_UNKNOWN');
  }
  if (options.help) return options;
  if (options.csv === null) throw new Stop('ARGUMENT_CSV_MISSING');
  if (options.captureDir === null) throw new Stop('ARGUMENT_CAPTURE_DIR_MISSING');
  if (!isHex64(options.expectedCsvSha256) || !isHex64(options.expectedCaptureSha256)) throw new Stop('ARGUMENT_EXPECTED_DIGEST_NOT_SHA256');
  return options;
}

/* ---------------------------------------------------------------- step 1: the CSV */
function readCsv(options, payload) {
  section('1. Original CSV (input 1): digest verification');
  const result = {};
  payload.inputs.csv = result;
  if (!existsSync(options.csv) || !statSync(options.csv).isFile()) throw new Stop('CSV_FILE_NOT_FOUND');
  if (statSync(options.csv).size > CSV_READ_LIMIT_BYTES) throw new Stop('CSV_FILE_TOO_LARGE');
  const bytes = readFileReadOnly(options.csv);
  const hasBom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  /* What the browser hands the pipeline is the UTF-8 decoded text, and the pipeline digests the
   * UTF-8 encoding of that text. Two readings differ only when the file starts with a byte-order
   * mark: the decoder dropped it (the standard behaviour) or kept it. Both are computed. */
  const textWithoutBom = new TextDecoder('utf-8').decode(bytes);
  const textWithBom = new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);
  const digestWithoutBom = sha256(Buffer.from(textWithoutBom, 'utf8'));
  const digestWithBom = sha256(Buffer.from(textWithBom, 'utf8'));
  result.sha256RawBytes = sha256(bytes);
  result.expected = options.expectedCsvSha256;
  result.expectedIsRecorded = options.expectedCsvSha256 === RECORDED.csvSha256;
  result.byteOrderMark = hasBom;
  result.validUtf8 = Buffer.compare(Buffer.from(textWithBom, 'utf8'), bytes) === 0;
  result.rawBytesEqualExpected = result.sha256RawBytes === options.expectedCsvSha256;
  const keepBom = hasBom && digestWithoutBom !== options.expectedCsvSha256 && digestWithBom === options.expectedCsvSha256;
  const text = keepBom ? textWithBom : textWithoutBom;
  const reencoded = Buffer.from(text, 'utf8');
  result.sha256DecodedText = keepBom ? digestWithBom : digestWithoutBom;
  result.decodedTextEqualsExpected = result.sha256DecodedText === options.expectedCsvSha256;
  result.byteOrderMarkInImportedText = keepBom;
  const crlf = (text.match(/\r\n/g) ?? []).length;
  const lf = (text.match(/\n/g) ?? []).length - crlf;
  const cr = (text.match(/\r/g) ?? []).length - crlf;
  result.lineEndings = [crlf > 0 ? 'CRLF' : null, lf > 0 ? 'LF' : null, cr > 0 ? 'CR' : null].filter(Boolean).join('+') || 'NONE';

  line('INFO', 'csv.sha256.expected', result.expected);
  line('INFO', 'csv.sha256.rawBytes', result.sha256RawBytes);
  line('INFO', 'csv.sha256.importContent', `${result.sha256DecodedText} (SHA-256 of the decoded text, as the import pipeline computes it)`);
  line('INFO', 'csv.encoding', `byte-order mark ${yn(hasBom)}${hasBom ? ` (part of the imported text: ${yn(keepBom)})` : ''}; valid UTF-8 ${yn(result.validUtf8)}; line endings ${result.lineEndings}`);
  if (!check('csv.sha256', result.decodedTextEqualsExpected, 'import-content SHA-256 of the CSV equals the expected digest')) {
    throw new Stop('CSV_SHA256_NOT_EXPECTED');
  }
  line('INFO', 'csv.sha256.rawBytesEqual', `SHA-256 of the raw file bytes also equals the expected digest: ${yn(result.rawBytesEqualExpected)}`);
  if (!result.expectedIsRecorded) line('WARN', 'csv.override', 'the expected CSV digest was overridden; this is not a run on the recorded original CSV');
  result.withinPreviewLimit = reencoded.length <= PREVIEW_TEXT_LIMIT_BYTES;
  check('csv.size', result.withinPreviewLimit, 'the text is within the 1 MiB limit of the import preview');
  return { result, text };
}

/* ---------------------------------------------------------------- step 2: the capture */
function candidateCaptureFiles(target) {
  const stat = statSync(target);
  if (stat.isFile()) return [target];
  if (!stat.isDirectory()) return [];
  const found = [];
  const consider = (file) => {
    if (existsSync(file) && statSync(file).isFile()) found.push(file);
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

function readCapture(options, payload) {
  section('2. Exact capture (input 2): digest verification and target holdings');
  const result = {};
  payload.inputs.capture = result;
  if (!existsSync(options.captureDir)) throw new Stop('CAPTURE_DIRECTORY_NOT_FOUND');
  const candidates = candidateCaptureFiles(options.captureDir);
  let selected = null;
  let equal = 0;
  let examined = 0;
  const observed = new Set();
  for (const file of candidates) {
    if (statSync(file).size > CAPTURE_LIMIT_BYTES) continue;
    examined += 1;
    const bytes = readFileReadOnly(file);
    const digest = sha256(bytes);
    observed.add(digest);
    if (digest === options.expectedCaptureSha256) {
      equal += 1;
      if (selected === null) selected = bytes;
    }
  }
  result.filesExamined = examined;
  result.filesWithExpectedSha256 = equal;
  result.expected = options.expectedCaptureSha256;
  result.expectedIsRecorded = options.expectedCaptureSha256 === RECORDED.captureSha256;
  line('INFO', 'capture.sha256.expected', result.expected);
  line('INFO', 'capture.search', `${examined} exact capture file(s) examined; ${equal} with the expected SHA-256`);
  if (selected === null) {
    for (const digest of [...observed].sort()) line('INFO', 'capture.sha256.observed', digest);
    check('capture.sha256', false, 'an exact capture with the expected SHA-256 was found');
    throw new Stop(examined === 0 ? 'NO_EXACT_CAPTURE_FILE_FOUND' : 'NO_CAPTURE_WITH_EXPECTED_SHA256');
  }
  result.sha256 = sha256(selected);
  line('INFO', 'capture.sha256', result.sha256);
  check('capture.sha256', result.sha256 === options.expectedCaptureSha256, 'capture SHA-256 equals the expected digest');
  if (!result.expectedIsRecorded) line('WARN', 'capture.override', 'the expected capture digest was overridden; the facts recorded for the 2026-11-13 capture are reported for information only');

  const facts = {};
  let doc;
  try {
    doc = JSON.parse(selected.toString('utf8').replace(/^\uFEFF/, ''));
  } catch {
    throw new Stop('CAPTURE_NOT_JSON');
  }
  if (!isObject(doc)) throw new Stop('CAPTURE_NOT_AN_OBJECT');
  if (!check('capture.schema', doc.schema === EXACT_CAPTURE_SCHEMA, 'schema is the exact-capture schema v1')) throw new Stop('CAPTURE_SCHEMA_UNEXPECTED');
  check('capture.outcome', doc.outcome === 'CONSISTENT_CAPTURE', 'outcome is CONSISTENT_CAPTURE');
  facts.evidenceEligibility = vocab('eligibility', doc.evidenceEligibility);
  line('INFO', 'capture.evidenceEligibility', facts.evidenceEligibility);

  const reads = Array.isArray(doc.reads) ? doc.reads : [];
  const gets = reads.filter((r) => isObject(r) && r.operation === 'portfolio.get' && isObject(r.wireResult));
  const revisionsRead = reads.find((r) => isObject(r) && r.operation === 'portfolio.revisions' && Array.isArray(r.wireResult));
  line('INFO', 'capture.reads', `${reads.length} read(s); portfolio.get with a result: ${gets.length}; portfolio.revisions with a result: ${revisionsRead ? 1 : 0}`);
  if (gets.length === 0) throw new Stop('CAPTURE_HAS_NO_PORTFOLIO_GET_RESULT');
  const firstCanonical = canonicalJson(gets[0].wireResult);
  check('capture.reads.agree', gets.every((r) => canonicalJson(r.wireResult) === firstCanonical), 'every portfolio.get result in the capture is identical');

  const detail = gets[0].wireResult;
  const holdings = Array.isArray(detail.holdings) ? detail.holdings : null;
  if (holdings === null) throw new Stop('CAPTURE_DETAIL_HAS_NO_HOLDINGS_ARRAY');
  if (holdings.length === 0) throw new Stop('CAPTURE_HAS_NO_HOLDINGS');
  const selectedId = isObject(doc.selection) ? doc.selection.portfolioId : undefined;
  facts.portfolioIdIsRecorded = detail.portfolioId === RECORDED.portfolioId && selectedId === RECORDED.portfolioId;
  facts.revision = Number.isSafeInteger(detail.revision) ? detail.revision : null;
  facts.holdingsCountField = Number.isSafeInteger(detail.holdingsCount) ? detail.holdingsCount : null;
  facts.holdings = holdings.length;

  const identity = { object: 0, null: 0, other: 0 };
  const identityStatus = {};
  const resolutionDisposition = {};
  const sourceBroker = {};
  let wellFormed = 0;
  const digests = new Set();
  for (const h of holdings) {
    if (!isObject(h)) throw new Stop('CAPTURE_HOLDING_NOT_AN_OBJECT');
    if (h.securityIdentity === null || h.securityIdentity === undefined) identity.null += 1;
    else if (isObject(h.securityIdentity)) identity.object += 1;
    else identity.other += 1;
    tally(identityStatus, vocab('identityStatus', h.identityStatus));
    tally(resolutionDisposition, vocab('resolutionDisposition', h.resolutionDisposition));
    tally(sourceBroker, vocab('broker', h.sourceBroker));
    const ok = typeof h.symbol === 'string' && typeof h.companyId === 'string' && typeof h.sourceBroker === 'string'
      && typeof h.identityStatus === 'string' && typeof h.resolutionDisposition === 'string'
      && MEASURES.every((m) => typeof h[m] === 'number' && Number.isFinite(h[m])) && isHex64(h.lineageDigest);
    if (ok) wellFormed += 1;
    if (isHex64(h.lineageDigest)) digests.add(h.lineageDigest);
  }
  facts.identity = identity;
  facts.identityStatus = sortedObject(identityStatus);
  facts.resolutionDisposition = sortedObject(resolutionDisposition);
  facts.holdingsPerSourceBroker = sortedObject(sourceBroker);
  facts.holdingsWellFormed = wellFormed;
  facts.distinctLineageDigests = digests.size;

  const recorded = result.expectedIsRecorded;
  const fact = (id, ok, text) => {
    line(ok ? 'PASS' : recorded ? 'FAIL' : 'WARN', id, `${text}: ${yn(ok)}`);
    if (!ok && recorded) unresolved.push(`CHECK_FAILED:${id}`);
  };
  fact('capture.portfolio', facts.portfolioIdIsRecorded, `portfolio selected and returned is ${RECORDED.portfolioId}`);
  fact('capture.revision', facts.revision === RECORDED.revision, `revision is ${RECORDED.revision} (observed ${facts.revision})`);
  fact('capture.holdings', holdings.length === RECORDED.holdings && facts.holdingsCountField === RECORDED.holdings,
    `holdings array and holdingsCount are ${RECORDED.holdings} (observed ${holdings.length} and ${facts.holdingsCountField})`);
  fact('capture.identity.null', identity.null === RECORDED.identityNull, `securityIdentity null on ${RECORDED.identityNull} (observed ${identity.null})`);
  fact('capture.identity.object', identity.object === RECORDED.identityObject, `securityIdentity object on ${RECORDED.identityObject} (observed ${identity.object})`);
  check('capture.holdings.wellformed', wellFormed === holdings.length, `every holding carries the stored members and a SHA-256 lineage digest (${wellFormed} of ${holdings.length})`);
  line('INFO', 'capture.identityStatus', JSON.stringify(facts.identityStatus));
  line('INFO', 'capture.resolutionDisposition', JSON.stringify(facts.resolutionDisposition));
  line('INFO', 'capture.holdingsPerSourceBroker', JSON.stringify(facts.holdingsPerSourceBroker));
  line('INFO', 'capture.lineageDigests', `${digests.size} distinct stored lineage digest(s) on ${holdings.length} holding(s)`);
  if (digests.size !== holdings.length) note('STORED_LINEAGE_DIGESTS_NOT_DISTINCT', 'two or more stored holdings carry the same lineage digest; a holding that reproduces one of them is reported as AMBIGUOUS');

  const revisions = revisionsRead ? revisionsRead.wireResult : [];
  facts.revisionEntries = revisions.length;
  const entry = revisions.find((r) => isObject(r) && r.revision === detail.revision);
  facts.revisionEntryOperation = entry ? vocab('operation', entry.operation) : null;
  facts.revisionProvenanceDigestPresent = isHex64(detail.provenanceDigest);
  line('INFO', 'capture.revisions', `${revisions.length} history entr(ies); operation of the examined revision: ${facts.revisionEntryOperation}`);

  const importEvidence = Array.isArray(detail.importEvidence) ? detail.importEvidence.filter(isObject) : [];
  facts.importsOnWire = importEvidence.length;
  line('INFO', 'capture.imports', `${importEvidence.length} committed import(s) on the wire`);
  return { result, facts, detail, holdings, importEvidence };
}

/* ---------------------------------------------------------------- step 3: link */
function linkImport(capture, csv) {
  section('3. Link: the committed import whose content digest is the digest of this CSV');
  const contentDigest = csv.result.sha256DecodedText;
  const linked = capture.importEvidence.filter((e) => e.contentDigest === contentDigest);
  const result = { importsWithThisContentDigest: linked.length };
  if (!check('link.contentDigest', linked.length === 1, `exactly one committed import in the capture carries the content digest of this CSV (observed ${linked.length})`)) {
    throw new Stop(linked.length === 0 ? 'CAPTURE_HAS_NO_IMPORT_WITH_THIS_CONTENT_DIGEST' : 'CAPTURE_HAS_SEVERAL_IMPORTS_WITH_THIS_CONTENT_DIGEST');
  }
  const evidence = linked[0];
  const importedAt = evidence.importedAt;
  result.importedAtIsIsoUtc = typeof importedAt === 'string' && Number.isFinite(Date.parse(importedAt)) && new Date(importedAt).toISOString() === importedAt;
  if (!check('link.importedAt', result.importedAtIsIsoUtc, 'the import instant is recorded as an ISO-8601 UTC instant')) throw new Stop('IMPORT_INSTANT_NOT_RECORDED');
  result.fileNameRecorded = typeof evidence.fileName === 'string' && evidence.fileName.length > 0;
  result.fileNameEqualsCsvBaseName = result.fileNameRecorded && evidence.fileName === path.basename(csv.path);
  result.sourceBroker = vocab('broker', evidence.sourceBroker);
  result.semantics = vocab('semantics', evidence.semantics);
  result.importProvenanceDigestPresent = isHex64(evidence.lineageDigest);
  result.importProvenanceEqualsRevisionProvenance = isHex64(evidence.lineageDigest) && evidence.lineageDigest === capture.detail.provenanceDigest;
  line('INFO', 'link.sourceBroker', result.sourceBroker);
  line('INFO', 'link.semantics', result.semantics);
  line('INFO', 'link.fileName', `file name recorded ${yn(result.fileNameRecorded)}; equal to the name of the file given with --csv ${yn(result.fileNameEqualsCsvBaseName)} (a renamed copy has the same content digest)`);
  line('INFO', 'link.importProvenance', `whole-import digest recorded ${yn(result.importProvenanceDigestPresent)}; equal to the provenance digest of the revision ${yn(result.importProvenanceEqualsRevisionProvenance)}`);
  return { result, evidence, importedAt, contentDigest };
}

/* ---------------------------------------------------------------- step 4: parse */
function deriveCsvHoldings(csv, link) {
  section('4. CSV parsed with the import format and transformation rules');
  const result = {};
  const text = csv.text;
  if (text.length === 0) throw new Stop('CSV_EMPTY_FILE');
  if (text.trim().length === 0) throw new Stop('CSV_BLANK_FILE');
  const fileName = link.result.fileNameRecorded ? link.evidence.fileName : '';
  const detection = detectFormat(text, fileName);
  result.broker = vocab('broker', detection.brokerType);
  result.format = detection.format === 'CSV' || detection.format === 'XLSX' ? detection.format : 'UNKNOWN';
  line('INFO', 'csv.detection', `broker ${result.broker}; format ${result.format}`);
  if (detection.requiresXlsx || detection.format === 'XLSX') throw new Stop('CSV_DETECTED_AS_XLSX_BY_RECORDED_FILE_NAME');
  if (!check('csv.detection.dhan', detection.brokerType === 'DHAN', 'the header is detected as a Dhan holdings export')) throw new Stop('CSV_NOT_A_DHAN_EXPORT');

  const parsed = parseDhanHoldings(text);
  result.variant = vocab('variant', parsed.dhanVariant);
  result.headerColumns = parsed.headerCount;
  result.columns = parsed.columns;
  result.dataRows = parsed.dataRows;
  result.rowsSkippedEmptySymbol = parsed.skippedEmptySymbol;
  line('INFO', 'csv.variant', result.variant);
  line('INFO', 'csv.columns', `${parsed.headerCount} header column(s); located: ${JSON.stringify(parsed.columns)}`);
  if (!check('csv.schema', parsed.schemaValid && parsed.success, 'the Dhan adapter accepts the file and returns at least one row')) throw new Stop('CSV_REJECTED_BY_THE_DHAN_ADAPTER');

  const lines = dataRowLineNumbers(text);
  if (lines.length !== parsed.dataRows) throw new Stop('INTERNAL_LINE_TRACE_MISMATCH');
  const lineOf = (holdingIndex) => lines[parsed.holdings[holdingIndex].sourceRow];

  const rows = { total: parsed.holdings.length, withIsin: 0, withoutIsin: 0, exchange: { NSE: 0, BSE: 0, none: 0 }, isinAndExchange: 0, isinWithoutExchange: 0, exchangeWithoutIsin: 0, neither: 0 };
  for (const h of parsed.holdings) {
    const hasIsin = h.isin !== undefined;
    const hasExchange = h.exchange !== undefined;
    if (hasIsin) rows.withIsin += 1; else rows.withoutIsin += 1;
    rows.exchange[h.exchange ?? 'none'] += 1;
    if (hasIsin && hasExchange) rows.isinAndExchange += 1;
    else if (hasIsin) rows.isinWithoutExchange += 1;
    else if (hasExchange) rows.exchangeWithoutIsin += 1;
    else rows.neither += 1;
  }
  result.rows = rows;
  line('INFO', 'csv.rows', `${parsed.dataRows} data row(s); ${parsed.skippedEmptySymbol} skipped for an empty symbol; ${rows.total} native row(s) passed to the mapper`);
  line('INFO', 'csv.rows.identifiers', JSON.stringify({ withIsin: rows.withIsin, withoutIsin: rows.withoutIsin, exchange: rows.exchange, isinAndExchange: rows.isinAndExchange, isinWithoutExchange: rows.isinWithoutExchange, exchangeWithoutIsin: rows.exchangeWithoutIsin, neither: rows.neither }));

  const mapped = mapParsedHoldings(parsed.holdings);
  const excluded = {};
  for (const e of mapped.exclusions) tally(excluded, e.reason);
  result.excludedRows = mapped.exclusions.length;
  result.excludedByReason = sortedObject(excluded);
  result.excludedLines = mapped.exclusions.map((e) => ({ csvLine: lineOf(e.index), reason: e.reason }));
  result.aggregatedRows = mapped.aggregatedCount;
  result.derivedHoldings = mapped.holdings.length;
  result.derivedHoldingsFromSeveralRows = mapped.holdings.filter((h) => h.rowIndices.length > 1).length;
  line('INFO', 'csv.mapper', `${mapped.holdings.length} holding(s) derived; ${mapped.aggregatedCount} row(s) aggregated into an earlier row of the same security; ${mapped.exclusions.length} row(s) excluded ${JSON.stringify(result.excludedByReason)}`);
  if (mapped.exclusions.length > 0) {
    line('WARN', 'csv.excluded.note', 'the IRR commit refuses an import with a rejected row; a file with an excluded row is not expected to have produced a stored revision');
    for (const e of result.excludedLines) line('INFO', 'csv.excluded', `CSV line ${e.csvLine}: ${e.reason}`);
  }
  if (mapped.empty) throw new Stop('CSV_YIELDS_NO_HOLDINGS');

  const sourceBroker = parsed.brokerType;
  const holdings = mapped.holdings.map((h, index) => ({
    g: index + 1,
    symbol: h.symbol,
    isin: h.isin,
    exchange: h.exchange,
    quantity: h.quantity,
    averageBuyPrice: h.averageBuyPrice,
    currentPrice: h.currentPrice,
    marketValue: h.marketValue,
    weightPercentage: h.weightPercentage,
    active: true,
    sourceBroker,
    csvLines: h.rowIndices.map(lineOf),
  }));
  const isins = new Set();
  for (const h of parsed.holdings) if (h.isin !== undefined) isins.add(h.isin.trim().toUpperCase());
  result.distinctIsins = isins.size;
  return { result, holdings, isins: [...isins] };
}

/* ---------------------------------------------------------------- step 5: reproduce */
function reproduce(capture, link, derived) {
  section('5. Lineage digests recomputed from the CSV and compared with the stored digests');
  const stored = capture.holdings;
  const asOf = link.importedAt;
  const width = Math.max(2, String(Math.max(stored.length, derived.holdings.length)).length);
  const H = (i) => `H${pad(i + 1, width)}`;
  const G = (g) => `G${pad(g, width)}`;

  /* edges[h] = list of { g, algorithm } whose recomputed digest equals the stored digest of h */
  const edges = stored.map(() => []);
  const reverse = derived.holdings.map(() => new Set());
  for (let h = 0; h < stored.length; h += 1) {
    const s = stored[h];
    if (!isHex64(s.lineageDigest)) continue;
    const identityUsable = typeof s.companyId === 'string' && typeof s.identityStatus === 'string' && typeof s.resolutionDisposition === 'string';
    for (let i = 0; i < derived.holdings.length; i += 1) {
      const g = derived.holdings[i];
      if (identityUsable && mapperLineageDigest(g, g.isin, g.exchange, s, asOf) === s.lineageDigest) {
        edges[h].push({ g: i, algorithm: 'MAPPER_BI03' });
        reverse[i].add(h);
      }
    }
  }

  const symbolIndex = new Map();
  derived.holdings.forEach((g, i) => {
    if (!symbolIndex.has(g.symbol)) symbolIndex.set(g.symbol, []);
    symbolIndex.get(g.symbol).push(i);
  });
  const isinOwner = new Map();
  derived.holdings.forEach((g, i) => {
    if (g.isin !== undefined && !isinOwner.has(g.isin)) isinOwner.set(g.isin, i);
  });

  const rows = [];
  for (let h = 0; h < stored.length; h += 1) {
    const s = stored[h];
    const storedIdentity = s.securityIdentity === null || s.securityIdentity === undefined ? 'null' : isObject(s.securityIdentity) ? 'object' : 'other';
    const row = { h: h + 1, status: 'NOT_REPRODUCED', storedIdentity };
    const distinctG = [...new Set(edges[h].map((e) => e.g))];
    if (distinctG.length === 1 && reverse[distinctG[0]].size === 1) {
      const g = derived.holdings[distinctG[0]];
      row.status = 'REPRODUCED';
      row.algorithm = edges[h].map((e) => e.algorithm).join('+');
      row.csvHolding = g.g;
      row.csvLines = g.csvLines;
      row.inputClass = inputClass(g.isin, g.exchange);
      /* The digest is reproduced from the CSV. Whether the members stored beside it are the
       * same values is a separate fact, checked here and reported by member name only. */
      row.storedMembersDiffering = ['symbol', ...MEASURES, 'sourceBroker'].filter((m) => g[m] !== s[m]);
    } else if (distinctG.length >= 1) {
      row.status = 'AMBIGUOUS';
      row.candidateCsvHoldings = distinctG.map((i) => derived.holdings[i].g);
      row.candidateCsvLines = distinctG.map((i) => derived.holdings[i].csvLines);
      row.storedHoldingsSharingACandidate = [...new Set(distinctG.flatMap((i) => [...reverse[i]]))].filter((other) => other !== h).map((other) => other + 1);
    } else {
      /* Weaker result, reported apart: H's own stored measures with an identifier pair. The only
       * ISINs tried are those that occur in this CSV; "no ISIN" needs no identifier at all. */
      const usable = typeof s.symbol === 'string' && typeof s.companyId === 'string' && isHex64(s.lineageDigest);
      const found = [];
      if (usable) {
        for (const isin of [undefined, ...derived.isins]) {
          for (const exchange of [undefined, 'NSE', 'BSE']) {
            if (mapperLineageDigest(s, isin, exchange, s, asOf) === s.lineageDigest) found.push({ isin, exchange });
          }
        }
      }
      if (found.length === 1) {
        const { isin, exchange } = found[0];
        const owner = isin === undefined ? undefined : isinOwner.get(isin);
        row.status = 'REPRODUCED_IDENTIFIERS_ONLY';
        row.algorithm = 'MAPPER_BI03';
        row.inputClass = inputClass(isin, exchange);
        row.identifierSource = isin === undefined ? 'NONE_NEEDED' : 'ISIN_OF_THIS_CSV';
        row.csvHoldingWithThatIsin = owner === undefined ? null : derived.holdings[owner].g;
        row.csvLinesWithThatIsin = owner === undefined ? null : derived.holdings[owner].csvLines;
        row.exchangeEqualsThatCsvHolding = owner === undefined ? null : derived.holdings[owner].exchange === exchange;
      } else if (found.length > 1) {
        row.status = 'AMBIGUOUS';
        row.candidateIdentifierPairs = found.length;
      }
      /* Diagnostic only. It joins on exact equality of the symbol text and names the members
       * that differ. It is never a match and classifies nothing. */
      const sameSymbol = typeof s.symbol === 'string' ? (symbolIndex.get(s.symbol) ?? []) : [];
      const diagnostic = { csvHoldingsWithEqualSymbol: sameSymbol.length };
      if (sameSymbol.length === 1) {
        const g = derived.holdings[sameSymbol[0]];
        diagnostic.csvHolding = g.g;
        diagnostic.csvLines = g.csvLines;
        diagnostic.differingMembers = [...MEASURES, 'sourceBroker'].filter((m) => g[m] !== s[m]);
        diagnostic.csvHoldingReproducesAnotherStoredHolding = reverse[sameSymbol[0]].size > 0;
      }
      row.diagnostic = diagnostic;
    }
    rows.push(row);
  }

  const unmatchedCsv = derived.holdings.filter((g, i) => reverse[i].size === 0)
    .map((g) => ({ csvHolding: g.g, csvLines: g.csvLines, inputClass: inputClass(g.isin, g.exchange) }));

  const count = (status) => rows.filter((r) => r.status === status).length;
  const summary = {
    targetHoldings: stored.length,
    csvDerivedHoldings: derived.holdings.length,
    reproduced: count('REPRODUCED'),
    ambiguous: count('AMBIGUOUS'),
    notReproducedFromCsv: stored.length - count('REPRODUCED') - count('AMBIGUOUS'),
    reproducedIdentifiersOnly: count('REPRODUCED_IDENTIFIERS_ONLY'),
    reproducedByNothing: count('NOT_REPRODUCED'),
    csvHoldingsMatchingNoStoredDigest: unmatchedCsv.length,
    reproducedWithStoredMembersDiffering: rows.filter((r) => r.status === 'REPRODUCED' && r.storedMembersDiffering.length > 0).length,
    byAlgorithm: sortedObject(rows.filter((r) => r.status === 'REPRODUCED').reduce((acc, r) => { tally(acc, r.algorithm); return acc; }, {})),
  };

  for (const r of rows) {
    const id = H(r.h - 1);
    if (r.status === 'REPRODUCED') {
      const differing = r.storedMembersDiffering.length === 0 ? '' : ` storedMembersDiffering=${r.storedMembersDiffering.join('+')}`;
      process.stdout.write(`[ROW] ${id} REPRODUCED algorithm=${r.algorithm} csvHolding=${G(r.csvHolding)} csvLines=${r.csvLines.join('+')} input=${r.inputClass} storedIdentity=${r.storedIdentity}${differing}\n`);
    } else if (r.status === 'AMBIGUOUS') {
      const detail = r.candidateCsvHoldings
        ? `candidates=${r.candidateCsvHoldings.map(G).join('+')} sharedWith=${r.storedHoldingsSharingACandidate.map((n) => H(n - 1)).join('+') || 'none'}`
        : `identifierPairs=${r.candidateIdentifierPairs}`;
      process.stdout.write(`[ROW] ${id} AMBIGUOUS ${detail} storedIdentity=${r.storedIdentity}\n`);
    } else {
      const d = r.diagnostic;
      const diag = d.csvHoldingsWithEqualSymbol === 1
        ? `equalSymbol=${G(d.csvHolding)} csvLines=${d.csvLines.join('+')} differingMembers=${d.differingMembers.join('+') || 'none'}`
        : `equalSymbol=${d.csvHoldingsWithEqualSymbol}`;
      if (r.status === 'REPRODUCED_IDENTIFIERS_ONLY') {
        const where = r.csvHoldingWithThatIsin === null ? 'isinOfCsvHolding=none' : `isinOfCsvHolding=${G(r.csvHoldingWithThatIsin)} exchangeEqualsThatCsvHolding=${yn(r.exchangeEqualsThatCsvHolding)}`;
        process.stdout.write(`[ROW] ${id} REPRODUCED_IDENTIFIERS_ONLY algorithm=${r.algorithm} input=${r.inputClass} ${where} storedIdentity=${r.storedIdentity} | diagnostic: ${diag}\n`);
      } else {
        process.stdout.write(`[ROW] ${id} NOT_REPRODUCED storedIdentity=${r.storedIdentity} | diagnostic: ${diag}\n`);
      }
    }
  }
  for (const u of unmatchedCsv) process.stdout.write(`[CSV] ${G(u.csvHolding)} MATCHES_NO_STORED_DIGEST csvLines=${u.csvLines.join('+')} input=${u.inputClass}\n`);

  line('INFO', 'reproduction.target', `${summary.targetHoldings} target holding(s); ${summary.csvDerivedHoldings} holding(s) derived from the CSV`);
  line('INFO', 'reproduction.reproduced', `${summary.reproduced} of ${summary.targetHoldings} stored lineage digests reproduced from the CSV, one-to-one ${JSON.stringify(summary.byAlgorithm)}`);
  line('INFO', 'reproduction.ambiguous', `${summary.ambiguous} ambiguous`);
  line('INFO', 'reproduction.unmatched', `${summary.notReproducedFromCsv} not reproduced from the CSV: ${summary.reproducedIdentifiersOnly} reproduced from stored measures with an identifier pair only, ${summary.reproducedByNothing} reproduced by nothing`);
  line('INFO', 'reproduction.csvUnmatched', `${summary.csvHoldingsMatchingNoStoredDigest} CSV-derived holding(s) match no stored digest`);
  if (summary.reproduced > 0) {
    check('reproduction.storedMembers', summary.reproducedWithStoredMembersDiffering === 0,
      `the symbol, measures and source broker stored beside every reproduced digest equal the values derived from the CSV (${summary.reproduced - summary.reproducedWithStoredMembersDiffering} of ${summary.reproduced})`);
  }
  if (summary.ambiguous > 0) note('AMBIGUOUS_MATCHES', 'an ambiguous holding is not counted as reproduced');
  if (summary.notReproducedFromCsv > 0) note('STORED_DIGESTS_NOT_REPRODUCED_FROM_CSV', 'see the [ROW] lines; a diagnostic names members that differ and is not a match');
  if (summary.csvHoldingsMatchingNoStoredDigest > 0) note('CSV_HOLDINGS_MATCH_NO_STORED_DIGEST', 'see the [CSV] lines');

  /* Whole-import digest: only when every stored digest was reproduced one-to-one. */
  const importProvenance = { computed: false, equalsImportEvidence: null, equalsRevisionProvenance: null };
  const complete = summary.reproduced === stored.length && derived.holdings.length === stored.length;
  if (complete && link.result.fileNameRecorded && typeof capture.detail.portfolioId === 'string' && typeof link.evidence.sourceBroker === 'string') {
    const byG = new Map(rows.map((r) => [r.csvHolding, stored[r.h - 1].lineageDigest]));
    const digest = computeBrokerImportProvenance({
      portfolioId: capture.detail.portfolioId,
      fileName: link.evidence.fileName,
      sourceBroker: link.evidence.sourceBroker,
      importedAt: link.importedAt,
      contentDigest: link.contentDigest,
      holdings: derived.holdings.map((g) => ({ ...g, lineageDigest: byG.get(g.g) })),
    });
    importProvenance.computed = true;
    importProvenance.equalsImportEvidence = digest === link.evidence.lineageDigest;
    importProvenance.equalsRevisionProvenance = digest === capture.detail.provenanceDigest;
    check('import.provenance.evidence', importProvenance.equalsImportEvidence, 'whole-import digest recomputed from the CSV equals the digest recorded for the import');
    check('import.provenance.revision', importProvenance.equalsRevisionProvenance, 'whole-import digest recomputed from the CSV equals the provenance digest of the stored revision');
  } else {
    line('INFO', 'import.provenance', 'not computed: it is defined only when every stored digest is reproduced one-to-one from the CSV');
  }

  /* Input classes. A statement about the committed input, not about identity. */
  const classes = { REPRODUCED: { storedIdentityNull: {}, storedIdentityObject: {} }, REPRODUCED_IDENTIFIERS_ONLY: { storedIdentityNull: {}, storedIdentityObject: {} } };
  for (const r of rows) {
    if (!(r.status in classes)) continue;
    tally(classes[r.status][r.storedIdentity === 'null' ? 'storedIdentityNull' : 'storedIdentityObject'], r.inputClass);
  }
  for (const status of Object.keys(classes)) for (const key of Object.keys(classes[status])) classes[status][key] = sortedObject(classes[status][key]);
  section('6. Committed input of the reproduced holdings (not an identity classification)');
  line('INFO', 'input.reproduced.storedIdentityNull', JSON.stringify(classes.REPRODUCED.storedIdentityNull));
  line('INFO', 'input.reproduced.storedIdentityObject', JSON.stringify(classes.REPRODUCED.storedIdentityObject));
  line('INFO', 'input.identifiersOnly.storedIdentityNull', JSON.stringify(classes.REPRODUCED_IDENTIFIERS_ONLY.storedIdentityNull));
  line('INFO', 'input.identifiersOnly.storedIdentityObject', JSON.stringify(classes.REPRODUCED_IDENTIFIERS_ONLY.storedIdentityObject));
  line('INFO', 'identity.classification', 'NOT_PERFORMED. A reproduced digest states what the committed input carried. It assigns no security identity and no cause, and it is not an acceptance.');

  return { summary, rows, unmatchedCsv, importProvenance, inputClassOfReproduced: classes };
}

/* ---------------------------------------------------------------- main */
function finish(resultName, exitCode, payload) {
  const body = { tool: TOOL_VERSION, ...payload, unresolved: [...new Set(unresolved)], checks: { pass: counters.PASS, fail: counters.FAIL, warn: counters.WARN }, result: resultName };
  const json = JSON.stringify(body);
  process.stdout.write('\n== Result\n');
  process.stdout.write(`E4_CSV_LINEAGE_RESULT_JSON: ${json}\n`);
  process.stdout.write(`E4_CSV_LINEAGE_RESULT_JSON_SHA256: ${sha256Text(json)}\n`);
  process.stdout.write(`checks: ${counters.PASS} pass, ${counters.FAIL} fail, ${counters.WARN} warn\n`);
  process.stdout.write(`unresolved: ${body.unresolved.length === 0 ? 'none' : body.unresolved.join(', ')}\n`);
  process.stdout.write(`RESULT: ${resultName}\n`);
  process.exitCode = exitCode;
}

function main() {
  process.stdout.write(`W04 E4 - lineage reproduction from the original CSV (${TOOL_VERSION}). Read-only. Sanitized output.\n`);
  const payload = { recordedInputs: null, inputs: {}, capture: null, link: null, csv: null, reproduction: null, importProvenance: null, inputClassOfReproduced: null, identityClassification: 'NOT_PERFORMED', holdings: [], csvHoldingsMatchingNoStoredDigest: [] };
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${USAGE}\n`);
      process.exitCode = 0;
      return;
    }
    payload.recordedInputs = { csv: options.expectedCsvSha256 === RECORDED.csvSha256, capture: options.expectedCaptureSha256 === RECORDED.captureSha256 };
    const csv = readCsv(options, payload);
    csv.path = options.csv;
    const capture = readCapture(options, payload);
    payload.capture = capture.facts;
    const link = linkImport(capture, csv);
    payload.link = link.result;
    const derived = deriveCsvHoldings(csv, link);
    payload.csv = derived.result;
    const outcome = reproduce(capture, link, derived);
    payload.reproduction = outcome.summary;
    payload.importProvenance = outcome.importProvenance;
    payload.inputClassOfReproduced = outcome.inputClassOfReproduced;
    payload.holdings = outcome.rows;
    payload.csvHoldingsMatchingNoStoredDigest = outcome.unmatchedCsv;
    const s = outcome.summary;
    const all = s.reproduced === s.targetHoldings && s.ambiguous === 0 && s.csvHoldingsMatchingNoStoredDigest === 0
      && outcome.importProvenance.computed && outcome.importProvenance.equalsImportEvidence === true
      && outcome.importProvenance.equalsRevisionProvenance === true && counters.FAIL === 0 && unresolved.length === 0;
    if (all && !(payload.recordedInputs.csv && payload.recordedInputs.capture)) {
      line('WARN', 'result.override', 'an expected digest was overridden; this result does not describe the recorded inputs');
    }
    finish(all ? 'REPRODUCED_ALL' : 'PARTIAL', all ? 0 : 1, payload);
  } catch (error) {
    let code = 'UNEXPECTED_ERROR';
    let where = '';
    if (error instanceof Stop) {
      code = error.stopCode;
    } else {
      /* Never the message: it can quote a path or a value. A code or a type name from a closed
       * list, and the line of this file where it was raised. */
      if (error && typeof error.code === 'string' && VOCAB.systemError.includes(error.code)) code = `UNEXPECTED_ERROR_${error.code}`;
      else if (error && VOCAB.errorName.includes(error.name)) code = `UNEXPECTED_ERROR_${error.name}`;
      const frame = String(error && error.stack).match(/w04-e4-csv-lineage-reproduction\.mjs:(\d+):\d+/);
      if (frame) where = ` (utility source line ${frame[1]})`;
    }
    unresolved.push(`STOPPED:${code}`);
    process.stdout.write(`\n[STOP] ${code} at step: ${currentStep}${where}\n`);
    if (code.startsWith('ARGUMENT_')) process.stdout.write(`${USAGE}\n`);
    process.stdout.write('Nothing was compared. No holding was reproduced or classified.\n');
    finish('INCONCLUSIVE', 2, payload);
  }
}

main();
