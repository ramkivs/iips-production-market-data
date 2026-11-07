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
 * the exact additional evidence required. Tick sizes are never defaulted:
 * DEPOSITION_READY is reachable only when every MANDATORY D05 field is positively
 * established (SOURCE_PROVIDED) or explicitly derived and stated (DERIVED).
 * ADVISORY rows (kind=ADVISORY) never affect the verdict.
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

export type SourceInputs = Partial<Record<SourceKey, SourceBytes>> & {
  /** Optional per-ISIN tick-band extract (CSV: isin,tickSize — a member of the CM cash tick set {0.01,0.05,0.10,0.25,0.50,1.00,5.00}; the act binds the applicable regime via evidence). */
  tickRules?: SourceBytes;
  /** Optional act-bound uniform tickSize; member of the CM cash tick set. */
  tickSizeUniform?: number;
};

export const TICK_SIZE_BANDS = [0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 5.0] as const;
export function isTickSizeBand(v: number): boolean {
  return Number.isFinite(v) && TICK_SIZE_BANDS.some((b) => Math.abs(b - v) < 1e-9);
}

export type FieldCoverageStatus = 'SOURCE_PROVIDED' | 'DERIVED' | 'UNRESOLVED';
export type FieldCoverageKind = 'MANDATORY' | 'ADVISORY';

export interface FieldCoverageRow {
  field: string;
  status: FieldCoverageStatus;
  source: SourceKey | 'derived' | 'tickRules' | null;
  /** MANDATORY rows block DEPOSITION_READY when UNRESOLVED. ADVISORY rows never block. */
  kind: FieldCoverageKind;
  note: string;
}

export interface TickSizeEvidence {
  mode: 'rules' | 'uniform' | 'absent';
  path: string | null;
  sha256: string | null;
  uniformValue: number | null;
  validRows: number | null;
  coveredIsins: number | null;
  denominator: number | null;
  missingSamples: string[];
  invalidSamples: Array<{ line: number; reason: string }>;
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
  reportVersion: 2;
  tool: { name: 'source-readiness'; version: 2 };
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
  tickSizeEvidence: TickSizeEvidence;
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

export interface TickRulesResult {
  map: Map<string, number>;
  validRows: number;
  duplicateAgreements: number;
  duplicateConflicts: Array<{ isin: string; detail: string }>;
  invalidSamples: Array<{ line: number; reason: string }>;
}

export function parseTickRules(bytes: Uint8Array): TickRulesResult | { error: string } {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  const { table, errors } = parseCsv(text);
  if (!table) return { error: errors.join('; ') || 'tick rules: no rows found' };
  const idx = new Map(table.header.map((h, i) => [norm(h), i]));
  const pick = (...aliases: string[]): number | undefined => aliases.map((a) => idx.get(a)).find((v) => v !== undefined);
  const isinIdx = pick('isin', 'isinnumber');
  const tickIdx = pick('ticksize', 'tick_size', 'tick', 'tickband', 'tickbandpaise');
  if (isinIdx === undefined || tickIdx === undefined) {
    return { error: 'tick rules: header must include ISIN and tickSize' };
  }
  const invalidSamples: Array<{ line: number; reason: string }> = [];
  const map = new Map<string, number>();
  const conflicts: Array<{ isin: string; detail: string }> = [];
  let duplicateAgreements = 0;
  let validRows = 0;
  table.rows.forEach((cells, rIdx) => {
    const line = rIdx + 2;
    const isin = (cells[isinIdx] ?? '').trim().toUpperCase();
    const tickRaw = (cells[tickIdx] ?? '').trim();
    const reasons: string[] = [];
    if (!ISIN_REGEX.test(isin) || !isIsinCheckDigitValid(isin)) reasons.push(`bad ISIN: ${isin || '(blank)'}`);
    const tick = tickRaw === '' ? Number.NaN : Number(tickRaw);
    if (!Number.isFinite(tick) || !isTickSizeBand(tick)) reasons.push(`tickSize not one of 0.01/0.05/0.10/0.25/0.50/1.00/5.00: ${tickRaw || '(blank)'}`);
    if (reasons.length > 0) { if (invalidSamples.length < 10) invalidSamples.push({ line, reason: reasons.join('; ') }); return; }
    validRows += 1;
    const prior = map.get(isin);
    if (prior === undefined) { map.set(isin, tick); return; }
    if (Math.abs(prior - tick) < 1e-12) { duplicateAgreements += 1; return; }
    map.delete(isin);
    conflicts.push({ isin, detail: `conflicting tickSize for ISIN ${isin} in tick rules (${prior} vs ${tick})` });
  });
  return { map, validRows, duplicateAgreements, duplicateConflicts: conflicts, invalidSamples };
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
    { canonical: 'scrip_code', synonyms: ['scripcode', 'securitycode', 'code', 'bsescripcode'], required: true },
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
// BSE scrip codes are six-digit numerics. Placeholder tokens (e.g. UNLISTED-BSE /
// NSE-EXCLUSIVE / N/A) are NOT identity claims and never satisfy the coverage rule.
const SCRIP_CODE_BSE_REGEX = /^[0-9]{6}$/;


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
    if (matchedIdx.scrip_code !== undefined) {
      const sc = (rowRec.scrip_code ?? '').trim();
      if (!sc) { ok = false; reasons.push('scrip_code blank'); }
      else if (!SCRIP_CODE_BSE_REGEX.test(sc)) { ok = false; reasons.push(`scrip_code not a 6-digit numeric BSE scrip code: ${sc || '(blank)'} (placeholders are not identity claims)`); }
      else rowRec.scrip_code = sc;
    }
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
  /* ── tick-size evidence (MANDATORY deposit field; never defaulted) ──────── */
  const nseRowsAll = rowMaps.get('nse') ?? [];
  const nseSetForTicks = new Set(nseRowsAll.map((r) => r.isin).filter(Boolean) as string[]);
  const denominatorSet = nseSetForTicks.size > 0 ? nseSetForTicks : union;
  const denominator = denominatorSet.size;
  let tickStatus: FieldCoverageStatus = 'UNRESOLVED';
  let tickSource: FieldCoverageRow['source'] = null;
  let tickNote = 'no tick-size evidence supplied; the deposit contract requires a positive tickSize per record (price-linked per NSE CM circulars: 0.01/0.05/0.10/0.25/0.50/1.00/5.00)';
  const tickSizeEvidence: TickSizeEvidence = {
    mode: 'absent', path: null, sha256: null, uniformValue: null,
    validRows: null, coveredIsins: null, denominator: denominator > 0 ? denominator : null,
    missingSamples: [], invalidSamples: [],
  };
  if (inputs.tickSizeUniform !== undefined) {
    const v = inputs.tickSizeUniform;
    tickSizeEvidence.mode = 'uniform';
    tickSizeEvidence.uniformValue = v;
    if (isTickSizeBand(v) && denominator > 0) {
      tickStatus = 'DERIVED';
      tickSource = 'derived';
      tickSizeEvidence.coveredIsins = denominator;
      tickSizeEvidence.validRows = denominator;
      tickNote = `uniform tickSize ${v} bound by the Wave-3 deposition act (as-of NSE CM price-band circular); stated explicitly by --tick-size-uniform, never a hard default`;
    } else {
      tickNote = isTickSizeBand(v)
        ? 'tickSizeUniform supplied but the deposit-intended universe is empty'
        : `tickSizeUniform ${v} is not one of 0.01/0.05/0.10/0.25/0.50/1.00/5.00`;
    }
  } else if (inputs.tickRules) {
    tickSizeEvidence.mode = 'rules';
    tickSizeEvidence.path = inputs.tickRules.path;
    tickSizeEvidence.sha256 = inputs.tickRules.sha256 ?? null;
    const parsed = parseTickRules(inputs.tickRules.bytes);
    if ('error' in parsed) {
      tickNote = `tick-rules unusable: ${parsed.error}`;
    } else {
      tickSizeEvidence.validRows = parsed.validRows;
      tickSizeEvidence.invalidSamples = parsed.invalidSamples;
      for (const c of parsed.duplicateConflicts) conflicts.push({ kind: 'TICK_RULE_DUPLICATE_ISIN', isin: c.isin, detail: c.detail });
      if (parsed.duplicateConflicts.length > 0) {
        blockingReasons.push(`${parsed.duplicateConflicts.length} ISIN(s) have conflicting tickSize values in tick-rules; those records cannot be deposited`);
      }
      if (parsed.duplicateAgreements > 0) warnings.push(`tick-rules: ${parsed.duplicateAgreements} duplicate ISIN row(s) with identical tickSize (tolerated)`);
      const missing = [...denominatorSet].filter((i) => !parsed.map.has(i)).sort();
      tickSizeEvidence.coveredIsins = denominator - missing.length;
      tickSizeEvidence.missingSamples = missing.slice(0, 20);
      if (missing.length > 0) {
        tickNote = `tick-rules cover ${denominator - missing.length}/${denominator} deposit-intended securities; missing ${missing.length} (e.g. ${missing.slice(0, 3).join(', ')}); supply complete as-of price-band rule evidence or --tick-size-uniform in the act`;
      } else if (denominator === 0) {
        tickNote = 'tick-rules supplied but the deposit-intended universe is empty';
      } else if (parsed.duplicateConflicts.length === 0 && parsed.invalidSamples.length === 0) {
        tickStatus = 'SOURCE_PROVIDED';
        tickSource = 'tickRules';
        tickNote = `per-ISIN tickSize provided by tick-rules (sha256 ${tickSizeEvidence.sha256 ?? 'unrecorded'}); every deposit-intended security covered; values restricted to 0.01/0.05/0.10/0.25/0.50/1.00/5.00`;
      } else {
        tickNote = `tick-rules present but contain ${parsed.invalidSamples.length} invalid row(s); revalidate supply`;
      }
    }
  } else {
    tickNote = 'no tick-size evidence supplied — supply --tick-rules <isin,tickSize CSV covering every deposit-intended security> or --tick-size-uniform <0.01/0.05/0.10/0.25/0.50/1.00/5.00> (act-bound). The deposit contract requires a positive tickSize; it is never defaulted';
  }

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
  const M = 'MANDATORY' as const;
  const A = 'ADVISORY' as const;
  coverage.push({ field: 'isin', status: nseOk || bseOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: nseOk ? 'nse' : (bseOk ? 'bse' : null), kind: M, note: nseOk ? 'NSE listing master' : 'supply NSE and/or BSE listing master with ISIN' });
  coverage.push({ field: 'nseSymbol', status: nseOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: nseOk ? 'nse' : null, kind: M, note: nseOk ? 'NSE listing master' : 'supply NSE listing master' });
  coverage.push({ field: 'companyName', status: nseOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: nseOk ? 'nse' : null, kind: M, note: nseOk ? 'NSE listing master (issuer name)' : 'supply NSE listing master' });
  coverage.push({ field: 'series/segment (Tier-2 EQ filter)', status: nseOk && nse.seriesDistribution !== undefined ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: nseOk ? 'nse' : null, kind: M, note: nseOk ? (nse.seriesDistribution !== undefined ? 'series column present' : 'series column absent — Tier-2 CM EQ filter not evidenceable') : 'supply NSE listing master' });
  coverage.push({ field: 'listingStatus (as-of)', status: nseOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: nseOk ? 'nse' : null, kind: M, note: nseOk ? 'status asserted for the listing as of the deposition asOf; no assertion of future status' : 'supply NSE listing master' });
  coverage.push({ field: 'effectiveFrom (listing date)', status: nseOk && nse.matchedColumns.listing_date !== undefined ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: nseOk ? 'nse' : null, kind: M, note: 'effectiveFrom ← listing date of the listing master; the deposit act must bind this mapping, or supply an act-bound asOf effective date instead' });
  coverage.push({ field: 'lotSize', status: nseOk && nse.matchedColumns.market_lot !== undefined && sources.find((s) => s.key === 'nse')?.validRows ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: nseOk ? 'nse' : null, kind: M, note: 'per-row MARKET LOT column required; for non-F&O cash equities the CM default is 1 and must be recorded as such in the deposit act, not as a hidden default' });
  coverage.push({ field: 'tickSize', status: tickStatus, source: tickSource, kind: M, note: tickNote });
  coverage.push({ field: 'faceValue', status: mcaOk && mca.matchedColumns.face_value !== undefined ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: mcaOk ? 'mca' : null, kind: M, note: mcaOk ? 'MCA master data face value column' : 'supply MCA company master with CIN + face value' });
  coverage.push({ field: 'currency', status: 'DERIVED', source: 'derived', kind: A, note: 'INR uniform for the NSE/BSE CM universe; DERIVATION must be stated by the deposit act (never inferred into corpus silently)' });
  coverage.push({ field: 'cin', status: mcaOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: mcaOk ? 'mca' : null, kind: M, note: mcaOk ? 'MCA master data (bridged via ISIN/SYMBOL/exact COMPANY_NAME)' : 'supply MCA company master (CIN + company name + face value)' });
  coverage.push({ field: 'industry', status: taxOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: taxOk ? 'taxonomy' : null, kind: M, note: taxOk ? 'taxonomy deposit' : 'supply an authoritative industry/sector taxonomy (named source, sha256)' });
  coverage.push({ field: 'sector', status: taxOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: taxOk ? 'taxonomy' : null, kind: M, note: taxOk ? 'taxonomy deposit' : 'supply an authoritative sector taxonomy (named source, sha256)' });
  coverage.push({ field: 'bseSymbol', status: bseOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: bseOk ? 'bse' : null, kind: M, note: bseOk ? 'BSE listing master' : 'supply BSE listing master' });
  coverage.push({ field: 'bseScripCode', status: bseOk ? 'SOURCE_PROVIDED' : 'UNRESOLVED', source: bseOk ? 'bse' : null, kind: M, note: bseOk ? 'BSE listing master scrip codes' : 'supply BSE listing master' });

  /* ── advisory cross-check: NSE vs MCA faceValue (never blocking) ─────────── */
  if (nseOk && nse.matchedColumns.face_value !== undefined && mcaOk && mca.matchedColumns.face_value !== undefined) {
    const mcaFaceByIsin = new Map<string, number>();
    for (const r of rowMaps.get('mca') ?? []) {
      if (!r.isin || r.face_value === undefined) continue;
      const v = Number(r.face_value);
      if (Number.isFinite(v)) mcaFaceByIsin.set(r.isin, v);
    }
    // MCA bridge rows may carry the joined ISIN; if the bridge was via name, MCA rows have no isin.
    // Re-bridge with the same exact-match rule used above (no fuzzy match).
    if (mcaFaceByIsin.size === 0) {
      for (const r of rowMaps.get('mca') ?? []) {
        if (r.face_value === undefined) continue;
        const v = Number(r.face_value);
        if (!Number.isFinite(v)) continue;
        if (r.symbol) {
          const hit = symbolToNse.get(r.symbol.toUpperCase()) ?? [];
          if (hit.length === 1) { mcaFaceByIsin.set(hit[0], v); continue; }
        }
        if (r.name) {
          const hit = nameToNse.get(normName(r.name)) ?? [];
          if (hit.length === 1) mcaFaceByIsin.set(hit[0], v);
        }
      }
    }
    let compared = 0;
    let mismatched = 0;
    for (const r of nseRows) {
      if (!r.isin || r.face_value === undefined) continue;
      const nseV = Number(r.face_value);
      const mcaV = mcaFaceByIsin.get(r.isin);
      if (mcaV === undefined || !Number.isFinite(nseV)) continue;
      compared += 1;
      if (Math.abs(nseV - mcaV) > 1e-9) mismatched += 1;
    }
    if (compared > 0) {
      if (mismatched > 0) warnings.push(`faceValue divergence: NSE vs MCA disagree for ${mismatched}/${compared} compared ISIN(s) (advisory; the deposit act must bind source precedence)`);
      coverage.push({ field: 'faceValue cross-check (NSE vs MCA)', status: mismatched > 0 ? 'UNRESOLVED' : 'DERIVED', source: 'nse', kind: A, note: `${compared} compared; ${mismatched} divergences (advisory — never blocking; the deposit act must bind source precedence)` });
    }
  }

  const unresolved = coverage.filter((c) => c.status === 'UNRESOLVED' && c.kind === 'MANDATORY');
  for (const u of unresolved) blockingReasons.push(`D05 field unresolved: ${u.field} — ${u.note}`);
  for (const name of missingSources) blockingReasons.push(`${name}: source file not supplied`);

  const requiredEvidenceForFullCoverage: string[] = [
    ...missingSources.map((m) => `supply the ${m.toUpperCase()} source`),
    ...(tickStatus === 'UNRESOLVED'
      ? ['tickSize: supply --tick-rules <isin,tickSize CSV> covering EVERY deposit-intended security (values restricted to 0.01, 0.05, 0.10, 0.25, 0.50, 1.00, 5.00, SHA-256 pinned), or pass --tick-size-uniform <0.01/0.05/0.10/0.25/0.50/1.00/5.00> with the value explicitly bound in the Wave-3 deposition act (as-of NSE CM price-band circular). Never defaulted.']
      : [`tickSize: evidence accepted (mode=${tickSizeEvidence.mode}${tickSizeEvidence.sha256 ? `; sha256 ${tickSizeEvidence.sha256}` : ''}) — record the binding in the act`]),
    'industry/sector: an authoritative taxonomy deposit with named provenance covering EVERY admitted security (a single industry/sector keyed by ISIN, or CIN bridged through MCA — no PDF or secondary mapping file is an input)',
    'MCA linkage: either an ISIN or SYMBOL bridge column in the MCA extract, or exact COMPANY_NAME matching against the NSE file (fuzzy is never used)',
  ];

  const report: SourceReadinessReport = {
    reportVersion: 2,
    tool: { name: 'source-readiness', version: 2 },
    verdict: blockingReasons.length === 0 ? 'DEPOSITION_READY' : 'DEPOSITION_BLOCKED',
    blockingReasons: [...new Set(blockingReasons)].sort(),
    warnings: [...new Set(warnings)].sort(),
    sources,
    missingSources,
    tickSizeEvidence,
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
      'tickSize is never defaulted by this tool: DEPOSITION_READY is impossible without --tick-rules covering every deposit-intended security or --tick-size-uniform bound in the act.',
      'DEPOSITION_READY means every MANDATORY D05 field is positively established from supplied local evidence (SOURCE_PROVIDED) or explicitly derived and stated (DERIVED), AND the files are structurally consistent. It does NOT authorize a deposit act, create a corpus revision, re-pin governed constants, or substitute for the Wave-3 gate and reviewed PR.',
      'ADVISORY coverage rows (kind=ADVISORY, e.g. currency derivation, NSE↔MCA faceValue cross-check) are reported for the act’s attention and never affect the verdict.',
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
  for (const s of report.tickSizeEvidence.invalidSamples) lines.push(['tick-rules', s.line, 'INVALID_TICK_RULE_ROW', s.reason].map(esc).join(','));
  for (const isin of report.tickSizeEvidence.missingSamples) lines.push(['tick-rules', '', 'TICK_SIZE_MISSING_ISIN', isin].map(esc).join(','));
  return lines.join('\n') + '\n';
}

export function readinessToMarkdown(report: SourceReadinessReport): string {
  const lines: string[] = [
    '# D05 Wave-3 — Authoritative Source Readiness',
    '',
    `- Verdict: **${report.verdict}**${report.verdict === 'DEPOSITION_READY' ? ' (all MANDATORY D05 fields are SOURCE_PROVIDED or explicitly DERIVED from supplied local evidence)' : ' (at least one MANDATORY D05 field is unresolved/conflicting — see blocking reasons)'}`,
    `- Missing sources: ${report.missingSources.length ? report.missingSources.join(', ') : 'none'}`,
    '',
    '## Tick-size evidence',
    '',
    `- mode: ${report.tickSizeEvidence.mode}`,
    ...(report.tickSizeEvidence.path ? [`- path: ${report.tickSizeEvidence.path}`, `- sha256: ${report.tickSizeEvidence.sha256 ?? 'unrecorded'}`] : []),
    ...(report.tickSizeEvidence.uniformValue !== null ? [`- uniformValue: ${report.tickSizeEvidence.uniformValue} (act-bound, never a hidden default)`] : []),
    ...(report.tickSizeEvidence.denominator !== null && report.tickSizeEvidence.validRows !== null && report.tickSizeEvidence.mode === 'rules'
      ? [`- validRows: ${report.tickSizeEvidence.validRows} · coveredIsins: ${report.tickSizeEvidence.coveredIsins}/${report.tickSizeEvidence.denominator}`]
      : report.tickSizeEvidence.denominator !== null && report.tickSizeEvidence.mode === 'uniform'
        ? [`- universe coverage denominator (securities): ${report.tickSizeEvidence.denominator}`]
        : []),
    ...(report.tickSizeEvidence.missingSamples.length ? [`- missing ISIN samples (cap 20): ${report.tickSizeEvidence.missingSamples.join(', ')}`] : []),
    ...(report.tickSizeEvidence.invalidSamples.length ? [`- invalid tick-rule rows: ${report.tickSizeEvidence.invalidSamples.map((s) => `line ${s.line}: ${s.reason}`).join(' | ')}`] : []),
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
    '| Field | Status | Source | Kind | Note |',
    '|---|---|---|---|---|',
    ...report.d05FieldCoverage.map((c) => `| ${c.field} | ${c.status} | ${c.source ?? '—'} | ${c.kind} | ${c.note} |`),
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
