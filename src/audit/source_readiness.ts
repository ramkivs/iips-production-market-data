/**
 * Institutional Investment Platform System (IIPS)
 * D05 Wave-3 — Authoritative Source Readiness Tool (read-only, deterministic)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 *
 * Validates LOCALLY SUPPLIED source files intended for a governed Wave-3 deposit:
 *   NSE equity listing master · BSE equity listing master · MCA company master ·
 *   authoritative industry/sector taxonomy.
 *
 * This tool NEVER downloads anything, never treats third-party mirrors as evidence,
 * and never writes into the corpus or revises any manifest. Absent sources, malformed
 * files, duplicate/conflicting identifiers and unresolved mappings are reported with
 * the exact additional evidence required. Tick sizes are never defaulted.
 *
 * Determinism: no clock, no randomness. Identical inputs produce byte-identical reports.
 */

import { isIsinCheckDigitValid } from './d05_corpus_audit.js';

export type SourceKey = 'nse' | 'bse' | 'mca' | 'taxonomy';

export interface SourceBytes {
  bytes: Uint8Array;
  /** Label used in reports only (never written to). */
  path: string;
  /** Caller-computed sha256 hex digest for the exact bytes supplied. */
  sha256?: string | null;
}

export type SourceInputs = Partial<Record<SourceKey, SourceBytes>>;

export type FieldCoverageStatus = 'SOURCE_PROVIDED' | 'DERIVED' | 'UNRESOLVED';

export interface FieldCoverageRow {
  field: string;
  status: FieldCoverageStatus;
  source: SourceKey | 'derived' | null;
  note: string;
}

export interface SourceReadinessSourceReport {
  key: SourceKey;
  path: string;
  present: true;
  sha256: string | null;
  bytes: number;
  headerStatus: 'OK' | 'MISSING_COLUMNS' | 'UNUSABLE';
  matchedColumns: Record<string, string>;
  missingRequiredColumns: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
  invalidRowSamples: Array<{ line: number; reason: string }>;
  distinctIsins: number;
  distinctCins: number;
  duplicateIsinCount: number;
  duplicateCinCount: number;
  duplicateIsinSamples: Array<{ isin: string; rows: number }>;
  seriesDistribution?: Record<string, number>;
  outOfTier2ScopeRows?: number;
}

export interface SourceReadinessReport {
  reportVersion: 1;
  tool: { name: 'source-readiness'; version: 1 };
  verdict: 'DEPOSITION_READY' | 'DEPOSITION_BLOCKED';
  blockingReasons: string[];
  warnings: string[];
  sources: SourceReadinessSourceReport[];
  missingSources: SourceKey[];
  crossSource: {
    unionIsins: number;
    isinsPresentInAll?: number;
    nseWithoutBse: number;
    nseWithoutMca: number;
    nseWithoutTaxonomy: number;
    mcaUnmapped: number;
    mcaAmbiguousNameBridge: number;
    taxonomyUnmapped: number;
    conflicts: Array<{ kind: string; isin?: string; detail: string }>;
    mcaUnmappedSamples: string[];
    mcaAmbiguousNameSamples: string[];
    taxonomyUnmappedSamples: string[];
  };
  d05FieldCoverage: FieldCoverageRow[];
  requiredEvidenceForFullCoverage: string[];
  disclaimers: string[];
}

/* ── small deterministic CSV reader ───────────────────────────────────────── */

export interface CsvTable {
  header: string[];
  rows: string[][];
  lineErrors: Array<{ line: number; reason: string }>;
}

export function parseCsv(text: string): { table: CsvTable | null; errors: string[] } {
  const errors: string[] = [];
  const records: Array<{ line: number; cells: string[] }> = [];
  let line = 1;
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const pushField = () => { row.push(field); field = ''; };
  const pushRow = (lineNo: number) => {
    pushField();
    const isEmpty = row.length === 1 && row[0] === '';
    if (!isEmpty) records.push({ line: lineNo, cells: row });
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else {
        field += ch;
        if (ch === '\n') line++;
      }
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ',') { pushField(); continue; }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      pushRow(line);
      line++;
      continue;
    }
    field += ch;
  }
  if (inQuotes) errors.push('unterminated quoted field at end of file');
  if (field !== '' || row.length > 0) pushRow(line);
  if (records.length === 0) {
    return { table: null, errors: ['no rows found'] };
  }
  const header = records[0].cells.map((c) => c.trim());
  const body = records.slice(1);
  const lineErrors: Array<{ line: number; reason: string }> = [];
  const width = header.length;
  const cleanRows: string[][] = [];
  for (const r of body) {
    if (r.cells.length !== width) {
      lineErrors.push({ line: r.line, reason: `field count ${r.cells.length} != header ${width}` });
      continue;
    }
    cleanRows.push(r.cells.map((c) => c.trim()));
  }
  return { table: { header, rows: cleanRows, lineErrors }, errors };
}

/* ── hashing ─────────────────── intentionally none here: caller provides bytes; hashing is fs work ── */

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');

type ColSpec = { canonical: string; synonyms: string[]; required: boolean };

const SPECS: Record<SourceKey | 'taxonomy', ColSpec[]> = {
  nse: [
    { canonical: 'isin', synonyms: ['isin', 'isinnumber', 'isincode'], required: true },
    { canonical: 'symbol', synonyms: ['symbol'], required: true },
    { canonical: 'name', synonyms: ['nameofcompany', 'companyname', 'securityname', 'name'], required: true },
    { canonical: 'series', synonyms: ['series'], required: false },
    { canonical: 'listing_date', synonyms: ['dateoflisting', 'listingdate'], required: false },
    { canonical: 'market_lot', synonyms: ['marketlot', 'marketlotshare'], required: false },
    { canonical: 'paid_up_value', synonyms: ['paidupvalue'], required: false },
    { canonical: 'face_value', synonyms: ['facevalue', 'facevalueofsecurity'], required: false },
  ],
  bse: [
    { canonical: 'scrip_code', synonyms: ['scripcode', 'securitycode', 'code', 'bssescripcode'], required: true },
    { canonical: 'isin', synonyms: ['isin', 'isinnumber', 'isinno', 'isinnumberbse'], required: true },
    { canonical: 'name', synonyms: ['securityname', 'companyname', 'name', 'security'], required: true },
  ],
  mca: [
    { canonical: 'cin', synonyms: ['cin', 'cinnumber', 'corporateidentificationnumber', 'cinno'], required: true },
    { canonical: 'name', synonyms: ['companyname', 'company', 'name', 'company_name'], required: true },
    { canonical: 'face_value', synonyms: ['facevalue', 'facevalueofequityshare', 'facevaluepershare'], required: false },
    { canonical: 'isin', synonyms: ['isin', 'isinnumber', 'isincode'], required: false },
    { canonical: 'symbol', synonyms: ['symbol'], required: false },
  ],
  taxonomy: [
    { canonical: 'isin', synonyms: ['isin', 'isinnumber', 'isincode'], required: false },
    { canonical: 'cin', synonyms: ['cin', 'cinnumber', 'corporateidentificationnumber'], required: false },
    { canonical: 'industry', synonyms: ['industry', 'industryname', 'basicindustry'], required: true },
    { canonical: 'sector', synonyms: ['sector', 'sectorname'], required: true },
    { canonical: 'basic_industry', synonyms: ['basicindustry', 'subindustry'], required: false },
  ],
};

const CIN_MCA_REGEX = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const ISIN_REGEX = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;


function parseSource(key: SourceKey, bytes: Uint8Array, label: string, sha256: string | null): {
  report: SourceReadinessSourceReport;
  rows: Array<Record<string, string>>;
} {
  const bytesN = bytes.byteLength;
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  const { table, errors } = parseCsv(text);
  if (!table) {
    return { report: {
      key, path: label, present: true, sha256, bytes: bytesN,
      headerStatus: 'UNUSABLE', matchedColumns: {}, missingRequiredColumns: SPECS[key].filter((c) => c.required).map((c) => c.canonical),
      warnings: [], totalRows: 0, validRows: 0, invalidRowSamples: [],
      distinctIsins: 0, distinctCins: 0, duplicateIsinCount: 0, duplicateCinCount: 0,
      duplicateIsinSamples: [],
    }, rows: [] };
  }
  const headerIdx = new Map(table.header.map((h, i) => [norm(h), i]));
  const matchedIdx: Record<string, number> = {};
  const missingRequired: string[] = [];
  const warnings: string[] = [];
  for (const spec of SPECS[key]) {
    const found = spec.synonyms.find((syn) => headerIdx.has(syn));
    if (found !== undefined) matchedIdx[spec.canonical] = headerIdx.get(found)!;
    else if (spec.required) missingRequired.push(spec.canonical);
  }
  const matched: Record<string, string> = {};
  for (const [k, idx] of Object.entries(matchedIdx)) matched[k] = table.header[idx];
  if (key === 'taxonomy' && matchedIdx.isin === undefined && matchedIdx.cin === undefined) {
    missingRequired.push('isin_or_cin');
  }
  if (key === 'nse' && matchedIdx.series === undefined) {
    warnings.push('series column absent — CM equity (EQ) tier filter cannot be applied; Tier-2 CM admission is not evidenceable from this file');
  }
  if (key === 'mca' && matchedIdx.isin === undefined && matchedIdx.symbol === undefined) {
    warnings.push('MCA bridge is COMPANY_NAME (exact match only); no ISIN or SYMBOL bridge column present');
  }
  if (errors.length > 0) warnings.push(...errors.map((e) => `csv: ${e}`));

  const field = (row: string[], canonical: string): string => {
    const idx = matchedIdx[canonical];
    return idx === undefined ? '' : (row[idx] ?? '').trim();
  };

  const invalidRowSamples: Array<{ line: number; reason: string }> = [];
  const rows: Array<Record<string, string>> = [];
  const isins = new Map<string, number>();
  const cins = new Map<string, number>();
  const seriesDist: Record<string, number> = {};
  let outOfTier2ScopeRows = 0;
  let validRows = 0;
  table.rows.forEach((cells, rIdx) => {
    const line = rIdx + 2;
    const rowRec: Record<string, string> = {};
    let ok = true;
    const reasons: string[] = [];
    for (const spec of SPECS[key]) {
      const v = field(cells, spec.canonical);
      if (v) rowRec[spec.canonical] = v;
    }
    const isinCell = (rowRec.isin ?? '').toUpperCase();
    const cinCell = (rowRec.cin ?? '').toUpperCase();
    if (matchedIdx.isin !== undefined) {
      if (!ISIN_REGEX.test(isinCell)) { ok = false; reasons.push(`bad ISIN shape: ${isinCell || '(blank)'}`); }
      else if (!isIsinCheckDigitValid(isinCell)) { ok = false; reasons.push(`ISIN check digit fails: ${isinCell}`); }
      else rowRec.isin = isinCell;
    }
    if (matchedIdx.cin !== undefined) {
      if (!CIN_MCA_REGEX.test(cinCell)) { ok = false; reasons.push(`bad CIN: ${cinCell || '(blank)'}`); }
      else rowRec.cin = cinCell;
    }
    if (matchedIdx.industry !== undefined && !rowRec.industry) { ok = false; reasons.push('industry blank'); }
    if (matchedIdx.sector !== undefined && !rowRec.sector) { ok = false; reasons.push('sector blank'); }
    if (matchedIdx.symbol !== undefined && !rowRec.symbol) { ok = false; reasons.push('symbol blank'); }
    if (matchedIdx.name !== undefined && !rowRec.name) { ok = false; reasons.push('name blank'); }
    if (matchedIdx.scrip_code !== undefined && !(rowRec.scrip_code ?? '').trim()) { ok = false; reasons.push('scrip_code blank'); }
    if (!ok) {
      if (invalidRowSamples.length < 10) invalidRowSamples.push({ line, reason: reasons.join('; ') });
      return;
    }
    validRows += 1;
    rows.push(rowRec);
    if (rowRec.isin) isins.set(rowRec.isin, (isins.get(rowRec.isin) ?? 0) + 1);
    if (rowRec.cin) cins.set(rowRec.cin, (cins.get(rowRec.cin) ?? 0) + 1);
    if (key === 'nse' && rowRec.series !== undefined) {
      const series = rowRec.series.toUpperCase();
      seriesDist[series] = (seriesDist[series] ?? 0) + 1;
      if (series !== 'EQ') outOfTier2ScopeRows += 1;
    }
  });
  for (const le of table.lineErrors.slice(0, 10)) invalidRowSamples.push({ line: le.line, reason: le.reason });

  const duplicateIsinSamples = [...isins.entries()].filter(([, n]) => n > 1).map(([isin, n]) => ({ isin, rows: n })).sort((a, b) => a.isin.localeCompare(b.isin));
  const report: SourceReadinessSourceReport = {
    key, path: label, present: true, sha256, bytes: bytesN,
    headerStatus: missingRequired.length > 0
      ? Object.keys(matchedIdx).length === 0
        ? 'UNUSABLE'
        : 'MISSING_COLUMNS'
      : 'OK',
    matchedColumns: matched, missingRequiredColumns: missingRequired, warnings,
    totalRows: table.rows.length, validRows, invalidRowSamples,
    distinctIsins: isins.size, distinctCins: cins.size,
    duplicateIsinCount: duplicateIsinSamples.reduce((acc, d) => acc + d.rows - 1, 0),
    duplicateCinCount: [...cins.values()].filter((n) => n > 1).reduce((acc, n) => acc + n - 1, 0),
    duplicateIsinSamples,
  };
  if (key === 'nse') {
    report.seriesDistribution = Object.fromEntries(Object.entries(seriesDist).sort(([a], [b]) => a.localeCompare(b)));
    report.outOfTier2ScopeRows = outOfTier2ScopeRows;
  }
  return { report, rows };
}

/* ── cross-source mapping & D05 coverage ─────────────────────────────────── */

const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '').trim();

export interface CrossSourceResult {
  unionIsins: number;
  isinsPresentInAll?: number;
  nseWithoutBse: number;
  nseWithoutMca: number;
  nseWithoutTaxonomy: number;
  mcaUnmapped: number;
  mcaAmbiguousNameBridge: number;
  taxonomyUnmapped: number;
  conflicts: Array<{ kind: string; isin?: string; detail: string }>;
  mcaUnmappedSamples: string[];
  mcaAmbiguousNameSamples: string[];
  taxonomyUnmappedSamples: string[];
}

export function evaluateSourceReadiness(inputs: SourceInputs): SourceReadinessReport {
  const sources: SourceReadinessSourceReport[] = [];
  const missingSources: SourceKey[] = [];
  const conflicts: CrossSourceResult['conflicts'] = [];
  const blockingReasons: string[] = [];
  const warnings: string[] = [];

  const KEYS: SourceKey[] = ['nse', 'bse', 'mca', 'taxonomy'];
  const rowMaps = new Map<SourceKey, Array<Record<string, string>>>();

  for (const key of KEYS) {
    const supplied = inputs[key];
    if (!supplied) { missingSources.push(key); rowMaps.set(key, []); continue; }
    const { report, rows } = parseSource(key, supplied.bytes, supplied.path, supplied.sha256 ?? null);
    sources.push(report);
    rowMaps.set(key, rows);
    if (report.headerStatus !== 'OK') {
      blockingReasons.push(`${key}: missing/unusable required columns (${report.missingRequiredColumns.join(', ') || 'structure failure'})`);
    }
  }

  const nse = sources.find((s) => s.key === 'nse');
  const bse = sources.find((s) => s.key === 'bse');
  const mca = sources.find((s) => s.key === 'mca');
  const tax = sources.find((s) => s.key === 'taxonomy');

  const keyOf = (r: Record<string, string>): string => r.isin ?? '';
  const isinSet = (k: SourceKey) => new Set((rowMaps.get(k) ?? []).map(keyOf).filter(Boolean));

  for (const rep of sources) {
    if (rep.duplicateIsinSamples.length > 0) {
      for (const d of rep.duplicateIsinSamples.slice(0, 20)) {
        conflicts.push({ kind: 'DUPLICATE_ISIN_IN_SOURCE', isin: d.isin, detail: `${rep.key}: ${d.rows} rows share ISIN ${d.isin}` });
      }
      blockingReasons.push(`${rep.key}: ${rep.duplicateIsinSamples.length} distinct ISINs duplicated within the source`);
    }
  }

  const nseRows = rowMaps.get('nse') ?? [];
  const bseSet = isinSet('bse');
  const mcaRows = rowMaps.get('mca') ?? [];
  const taxRows = rowMaps.get('taxonomy') ?? [];
  const nseSet = isinSet('nse');

  // NSE symbols for the same ISIN must not disagree
  const nseByIsin = new Map<string, Set<string>>();
  for (const r of nseRows) {
    if (!r.isin) continue;
    const s = (r.symbol ?? '').toUpperCase();
    const set = nseByIsin.get(r.isin) ?? new Set<string>();
    set.add(s);
    nseByIsin.set(r.isin, set);
  }
  for (const [isin, set] of [...nseByIsin.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (set.size > 1) conflicts.push({ kind: 'SYMBOL_MISMATCH_IN_NSE', isin, detail: `same ISIN, multiple NSE symbols: ${[...set].sort().join(' / ')}` });
  }
  // Same ISIN, multiple BSE scrip codes
  const bseByIsin = new Map<string, Set<string>>();
  for (const r of rowMaps.get('bse') ?? []) {
    if (!r.isin) continue;
    const s = String(r.scrip_code ?? '').trim();
    const set = bseByIsin.get(r.isin) ?? new Set<string>();
    if (s) set.add(s);
    bseByIsin.set(r.isin, set);
  }
  for (const [isin, set] of [...bseByIsin.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (set.size > 1) conflicts.push({ kind: 'SCRIP_MISMATCH_IN_BSE', isin, detail: `same ISIN, multiple BSE scrip codes: ${[...set].sort().join(' / ')}` });
  }

  // MCA bridge: ISIN column > SYMBOL exact > COMPANY_NAME exact-normalized (never fuzzy)
  const nameToNse = new Map<string, string[]>();
  for (const r of nseRows) {
    const key = normName(r.name ?? '');
    if (!key) continue;
    const arr = nameToNse.get(key) ?? [];
    arr.push(r.isin ?? '');
    nameToNse.set(key, arr);
  }
  const symbolToNse = new Map<string, string[]>();
  for (const r of nseRows) {
    const key = (r.symbol ?? '').toUpperCase();
    if (!key) continue;
    const arr = symbolToNse.get(key) ?? [];
    arr.push(r.isin ?? '');
    symbolToNse.set(key, arr);
  }
  let mcaUnmapped = 0;
  let mcaAmbiguousNameBridge = 0;
  const mcaUnmappedSamples: string[] = [];
  const mcaAmbiguousNameSamples: string[] = [];
  const mcaIsinSet = new Set<string>();
  const mcaCinToIsin = new Map<string, string>();
  const mcaRep = sources.find((s) => s.key === 'mca');
  for (const r of mcaRows) {
    let isin: string | undefined = r.isin?.toUpperCase();
    if (!isin && r.symbol) {
      const hit = symbolToNse.get(r.symbol.toUpperCase()) ?? [];
      if (hit.length === 1) isin = hit[0];
    }
    if (!isin && r.name) {
      const hit = nameToNse.get(normName(r.name)) ?? [];
      if (hit.length === 1) isin = hit[0];
      else if (hit.length > 1) { mcaAmbiguousNameBridge += 1; if (mcaAmbiguousNameSamples.length < 20) mcaAmbiguousNameSamples.push(r.name as string); continue; }
    }
    if (isin) { mcaIsinSet.add(isin); if (r.cin) mcaCinToIsin.set(isin, r.cin); }
    else { mcaUnmapped += 1; if (mcaUnmappedSamples.length < 20) mcaUnmappedSamples.push(r.name ?? r.cin ?? '(unidentified)'); }
  }
  if (mcaRep && mcaRep.matchedColumns.isin === undefined && mcaRep.matchedColumns.symbol === undefined && mcaRep.matchedColumns.name !== undefined) {
    warnings.push(`MCA→NSE bridge is exact normalized COMPANY_NAME match: ${mcaRows.length - mcaUnmapped - mcaAmbiguousNameBridge} mapped, ${mcaAmbiguousNameBridge} ambiguous, ${mcaUnmapped} unmatched (never fuzzy-matched)`);
  }

  // Taxonomy mapping: ISIN column preferred; else CIN→MCA isin
  const taxonomyIsinSet = new Set<string>();
  let taxonomyUnmapped = 0;
  const taxonomyUnmappedSamples: string[] = [];
  for (const r of taxRows) {
    if (r.isin) { taxonomyIsinSet.add(r.isin.toUpperCase()); continue; }
    if (r.cin) {
      const linked = [...mcaCinToIsin.entries()].find(([, cin]) => cin === r.cin)?.[0];
      if (linked) { taxonomyIsinSet.add(linked); continue; }
      taxonomyUnmapped += 1;
      if (taxonomyUnmappedSamples.length < 20) taxonomyUnmappedSamples.push(r.cin);
      continue;
    }
    taxonomyUnmapped += 1;
    if (taxonomyUnmappedSamples.length < 20) taxonomyUnmappedSamples.push(r.industry ?? r.sector ?? '(unidentified)');
  }

  const union = new Set<string>([...nseSet, ...bseSet, ...mcaIsinSet, ...taxonomyIsinSet]);
  const nseWithoutBse = [...nseSet].filter((i) => !bseSet.has(i)).length;
  const nseWithoutMca = [...nseSet].filter((i) => !mcaIsinSet.has(i)).length;
  const nseWithoutTaxonomy = [...nseSet].filter((i) => !taxonomyIsinSet.has(i)).length;
  const isinsPresentInAll = (nseSet.size > 0 && bseSet.size > 0 && mcaIsinSet.size > 0 && taxonomyIsinSet.size > 0)
    ? [...nseSet].filter((i) => bseSet.has(i) && mcaIsinSet.has(i) && taxonomyIsinSet.has(i)).length
    : undefined;

  if (conflicts.length > 0) blockingReasons.push(`${conflicts.length} cross-source identifier conflict(s) detected`);

  /* Material gaps: securities intended for deposition that cannot receive a mandatory corpus field. */
  const hasBse = bse !== undefined && bse.headerStatus === 'OK';
  const hasMca = mca !== undefined && mca.headerStatus !== 'UNUSABLE';
  const hasTaxonomy = tax !== undefined && tax.headerStatus === 'OK';
  if (nse !== undefined && nse.headerStatus === 'OK') {
    if (hasBse && nseWithoutBse > 0) blockingReasons.push(`${nseWithoutBse} of ${nseSet.size} NSE securities have no BSE listing match (bseSymbol/bseScripCode cannot be provisioned)`);
    if (hasMca && nseWithoutMca > 0) blockingReasons.push(`${nseWithoutMca} of ${nseSet.size} NSE securities have no MCA linkage (cin/faceValue cannot be provisioned)`);
    if (hasTaxonomy && nseWithoutTaxonomy > 0) blockingReasons.push(`${nseWithoutTaxonomy} of ${nseSet.size} NSE securities have no taxonomy coverage (industry/sector cannot be provisioned)`);
  }

  const coverage: FieldCoverageRow[] = [];
  const nseOk = nse !== undefined && nse.headerStatus === 'OK';
  const bseOk = bse !== undefined && bse.headerStatus === 'OK';
  const mcaOk = mca !== undefined && (mca.headerStatus === 'OK' || (mca.matchedColumns.cin !== undefined && mca.matchedColumns.name !== undefined));
  const taxOk = tax !== undefined && tax.headerStatus === 'OK';
  coverage.push({ field: 'isin', status: nseOk || bseOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: nseOk ? 'nse' : (bseOk ? 'bse' : null), note: nseOk ? 'NSE listing master' : 'supply NSE and/or BSE listing master with ISIN' });
  coverage.push({ field: 'nseSymbol', status: nseOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: nseOk ? 'nse' : null, note: nseOk ? 'NSE listing master' : 'supply NSE listing master' });
  coverage.push({ field: 'companyName', status: nseOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: nseOk ? 'nse' : null, note: nseOk ? 'NSE listing master (issuer name)' : 'supply NSE listing master' });
  coverage.push({ field: 'series/segment (Tier-2 EQ filter)', status: nseOk && nse.seriesDistribution !== undefined ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: nseOk ? 'nse' : null, note: nseOk ? (nse.seriesDistribution !== undefined ? 'series column present' : 'series column absent — Tier-2 CM EQ filter not evidenceable') : 'supply NSE listing master' });
  coverage.push({ field: 'listingStatus (as-of)', status: nseOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: nseOk ? 'nse' : null, note: nseOk ? 'status asserted for the listing as of the deposition asOf; no win guarantees future status' : 'supply NSE listing master' });
  coverage.push({ field: 'effectiveFrom (listing date)', status: nseOk && nse.matchedColumns.listing_date !== undefined ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: nseOk ? 'nse' : null, note: 'effectiveFrom ← listing date of the listing master; the deposit act must bind this mapping, or supply an act-bound asOf effective date instead' });
  coverage.push({ field: 'lotSize', status: nseOk && nse.matchedColumns.market_lot !== undefined && sources.find((s) => s.key === 'nse')?.validRows ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: nseOk ? 'nse' : null, note: 'per-row MARKET LOT column required; for non-F&O cash equities the CM default is 1 and must be recorded as such in the deposit act, not as a hidden default' });
  coverage.push({ field: 'tickSize', status: 'UNRESOLVED', source: null, note: 'tick size is price-band dependent (0.01/0.05/0.10/0.25); NO source file supplied can assert it generally. Requires an as-of price-band rule extract or an act-bound uniform value — never defaulted' });
  coverage.push({ field: 'faceValue', status: mcaOk && mca.matchedColumns.face_value !== undefined ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: mcaOk ? 'mca' : null, note: mcaOk ? 'MCA master data face value column' : 'supply MCA company master with CIN + face value' });
  coverage.push({ field: 'currency', status: 'DERIVED', source: 'derived', note: 'INR uniform for the NSE/BSE CM universe; promotion to corpus requires the deposit act to state the derivation' });
  coverage.push({ field: 'cin', status: mcaOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: mcaOk ? 'mca' : null, note: mcaOk ? 'MCA master data (bridged via ISIN/SYMBOL/exact COMPANY_NAME)' : 'supply MCA company master (CIN + company name + face value)' });
  coverage.push({ field: 'industry', status: taxOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: taxOk ? 'taxonomy' : null, note: taxOk ? 'taxonomy deposit' : 'supply an authoritative industry/sector taxonomy (named source, sha256)' });
  coverage.push({ field: 'sector', status: taxOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: taxOk ? 'taxonomy' : null, note: taxOk ? 'taxonomy deposit' : 'supply an authoritative sector taxonomy (named source, sha256)' });
  coverage.push({ field: 'bseSymbol', status: bseOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: bseOk ? 'bse' : null, note: bseOk ? 'BSE listing master' : 'supply BSE listing master' });
  coverage.push({ field: 'bseScripCode', status: bseOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: bseOk ? 'bse' : null, note: bseOk ? 'BSE listing master scrip codes' : 'supply BSE listing master' });

  const unresolved = coverage.filter((c) => c.status === 'UNRESOLVED' && c.field !== 'tickSize');
  for (const u of unresolved) blockingReasons.push(`D05 field unresolved: ${u.field} — ${u.note}`);
  for (const name of missingSources) blockingReasons.push(`${name}: source file not supplied`);

  const requiredEvidenceForFullCoverage: string[] = [
    ...missingSources.map((m) => `supply the ${m.toUpperCase()} source`),
    'tickSize: an as-of price-band rule extract (or price series + tick-band table), or an act-bound uniform tickSize with explicit deviation notice',
    'industry/sector: an authoritative taxonomy deposit with named provenance for every admitted security (e.g., NSE Indices classification or an owner-licensed taxonomy)',
    'MCA linkage: either an ISIN or SYMBOL bridge column in the MCA extract, or exact COMPANY_NAME matching against the NSE file (fuzzy is never used)',
  ];

  const report: SourceReadinessReport = {
    reportVersion: 1,
    tool: { name: 'source-readiness', version: 1 },
    verdict: blockingReasons.length === 0 ? 'DEPOSITION_READY' : 'DEPOSITION_BLOCKED',
    blockingReasons: [...new Set(blockingReasons)].sort(),
    warnings: [...new Set(warnings)].sort(),
    sources,
    missingSources,
    crossSource: {
      unionIsins: union.size,
      isinsPresentInAll,
      nseWithoutBse,
      nseWithoutMca,
      nseWithoutTaxonomy,
      mcaUnmapped,
      mcaAmbiguousNameBridge,
      taxonomyUnmapped,
      conflicts: conflicts.sort((a, b) => (a.kind + (a.isin ?? '')).localeCompare(b.kind + (b.isin ?? ''))),
      mcaUnmappedSamples,
      mcaAmbiguousNameSamples,
      taxonomyUnmappedSamples,
    },
    d05FieldCoverage: coverage,
    requiredEvidenceForFullCoverage,
    disclaimers: [
      'Source files are validated as supplied; this tool never downloads anything and never treats mirrors as authoritative.',
      'A CLEAN report means the files are structurally valid and internally consistent — it does NOT prove issuer truth, ACTIVE listing truth, realtime staleness or eligibility for any downstream use.',
      'COMPANY_NAME bridging (when no ISIN/SYMBOL bridge exists in MCA) uses exact normalized string equality only; ambiguous candidates are reported, never guessed.',
      'tickSize is never defaulted by this tool; the D05 deposit act must bind its value.',
      'A DEPOSITION_READY verdict still requires a separate Wave-3 deposition act, the merged corpus re-render, governed-constant re-pinning and a reviewed PR.',
    ],
  };
  return report;
}

/* ── serialization (deterministic) ───────────────────────────────────────── */

export function readinessToJson(report: SourceReadinessReport): string {
  return JSON.stringify(report, null, 2) + '\n';
}

export function readinessToCsv(report: SourceReadinessReport): string {
  const esc = (v: string | number): string => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = ['source,line,kind,detail'];
  for (const s of report.sources) {
    for (const inv of s.invalidRowSamples) lines.push([s.key, inv.line, 'INVALID_ROW', inv.reason].map(esc).join(','));
    for (const d of s.duplicateIsinSamples.slice(0, 100)) lines.push([s.key, '', 'DUPLICATE_ISIN', `${d.isin} x${d.rows}`].map(esc).join(','));
  }
  for (const c of report.crossSource.conflicts) lines.push(['cross-source', '', c.kind, c.detail].map(esc).join(','));
  return lines.join('\n') + '\n';
}

export function readinessToMarkdown(report: SourceReadinessReport): string {
  const lines: string[] = [
    '# D05 Wave-3 — Authoritative Source Readiness',
    '',
    `- Verdict: **${report.verdict}**`,
    `- Missing sources: ${report.missingSources.length ? report.missingSources.join(', ') : 'none'}`,
    '',
    '## Sources',
    '',
    '| Source | Path | Status | SHA-256 | Rows (valid/total) | Distinct ISIN | Duplicates |',
    '|---|---|---|---|---|---|---|',
    ...report.sources.map((s) => `| ${s.key} | ${s.path} | ${s.headerStatus} | \`${s.sha256?.slice(0, 16) ?? 'unhashed'}…\` | ${s.validRows}/${s.totalRows} | ${s.distinctIsins} | ${s.duplicateIsinCount} |`),
    '',
    '## Blocking reasons',
    '',
    ...(report.blockingReasons.length ? report.blockingReasons.map((b) => `- ${b}`) : ['- none']),
    '',
    '## D05 field coverage',
    '',
    '| Field | Status | Source | Note |',
    '|---|---|---|---|',
    ...report.d05FieldCoverage.map((c) => `| ${c.field} | ${c.status} | ${c.source ?? '—'} | ${c.note} |`),
    '',
    '## Cross-source mapping',
    '',
    `- unionIsins: ${report.crossSource.unionIsins}`,
    `- isinsPresentInAll: ${report.crossSource.isinsPresentInAll ?? 'n/a (a source is missing)'}`,
    `- NSE without BSE: ${report.crossSource.nseWithoutBse}; NSE without MCA: ${report.crossSource.nseWithoutMca}; NSE without taxonomy: ${report.crossSource.nseWithoutTaxonomy}`,
    `- MCA unmapped: ${report.crossSource.mcaUnmapped}; ambiguous name bridge: ${report.crossSource.mcaAmbiguousNameBridge}; taxonomy unmapped: ${report.crossSource.taxonomyUnmapped}`,
    `- conflicts: ${report.crossSource.conflicts.length}`,
    ...(report.crossSource.mcaUnmappedSamples.length ? [`- MCA unmapped samples: ${report.crossSource.mcaUnmappedSamples.join(', ')}`] : []),
    ...(report.crossSource.mcaAmbiguousNameSamples.length ? [`- MCA ambiguous-name samples: ${report.crossSource.mcaAmbiguousNameSamples.join(', ')}`] : []),
    ...(report.crossSource.taxonomyUnmappedSamples.length ? [`- Taxonomy unmapped samples: ${report.crossSource.taxonomyUnmappedSamples.join(', ')}`] : []),
    '',
    '## Required additional evidence',
    '',
    ...report.requiredEvidenceForFullCoverage.map((r) => `- ${r}`),
    '',
    '## Disclaimers',
    '',
    ...report.disclaimers.map((d) => `- ${d}`),
    '',
  ];
  return lines.join('\n');
}
