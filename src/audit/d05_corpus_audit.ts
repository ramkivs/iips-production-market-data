/**
 * Institutional Investment Platform System (IIPS)
 * D05 Security Master — Corpus Audit Tool (read-only, deterministic)
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01
 * Audit role: P04/D05 inspection only. This module NEVER writes to the corpus,
 * NEVER asserts record authenticity, and never changes runtime identity resolution.
 *
 * Output taxonomy (origin policy, PA decision 2026-10-19-01 C1–C3):
 *  - every record is reported with origin classification UNCLASSIFIED;
 *  - `generatorMarkerCount` / `markerFreeCount` are COUNTS OF DETECTABLE MARKERS of
 *    algorithmically generated series, not authenticity verdicts. 52 marker-free
 *    records are NOT verified as real, and a marker is not proof of fabrication.
 *
 * Determinism: no clock, no randomness, no I/O in the compute core. Identical inputs
 * produce byte-identical reports. Caller supplies evidence hashes (CLI computes them).
 */

export type AuditSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface CorpusAuditFinding {
  index: number;
  companyId: string;
  code: string;
  severity: AuditSeverity;
  field: string;
  detail: string;
}

export interface CorpusAuditCheck {
  id: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'INFO';
  detail: string;
  count: number;
}

export interface EvidenceRef {
  ref: string;
  path: string | null;
  sha256: string | null;
  present: boolean;
  note?: string;
}

export interface CorpusAuditReport {
  reportVersion: 1;
  tool: { name: 'd05-corpus-audit'; version: 1 };
  input: { path: string; sha256: string; recordCount: number };
  originPolicy: {
    perRecordClassification: 'UNCLASSIFIED';
    markerCount: number;
    markerFreeCount: number;
    disclaimer: string;
  };
  counts: Record<string, number>;
  distributions: Record<string, Record<string, number>>;
  checks: CorpusAuditCheck[];
  findings: CorpusAuditFinding[];
  evidenceRefs: EvidenceRef[];
  nextSteps: string[];
}

export interface AuditInputOptions {
  /** Path or label used in the report (never written to). */
  path: string;
  /** sha256 of the corpus bytes (computed by caller). */
  corpusSha256: string;
  /** Evidence references to embed (caller computes hashes; never mutated). */
  evidenceRefs?: EvidenceRef[];
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

const ISIN_REGEX = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;
const COMPANY_ID_REGEX = /^EQ_[A-Z0-9-]+_IN$/;
const CIN_MCA_REGEX = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const ISO_INSTANT_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

export function isIsinCheckDigitValid(isin: string): boolean {
  if (!ISIN_REGEX.test(isin)) return false;
  const digits = isin.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let total = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = digits.charCodeAt(digits.length - 1 - i) - 48;
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    total += d;
  }
  return total % 10 === 0;
}

function nonBlank(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}
function positiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0;
}
function positiveFinite(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}
function isIsoInstant(v: unknown): v is string {
  return typeof v === 'string' && ISO_INSTANT_REGEX.test(v) && !Number.isNaN(Date.parse(v));
}
/** Detect markers of algorithmic record series. A marker is NOT an authenticity verdict. */
export function detectGeneratorMarker(record: { companyId: string; companyName: string; isin?: string }): string[] {
  const evidence: string[] = [];
  const nameMatch = /^([A-Z]{2,4}\d{4}) India Limited$/.exec(record.companyName);
  const idMatch = /^EQ_([A-Z]{2,4}\d{4})_IN$/.exec(record.companyId);
  if (nameMatch && idMatch && nameMatch[1] === idMatch[1]) {
    evidence.push(`companyName numeric token ${nameMatch[1]} equals companyId token`);
  }
  if (/\b(\d{6})\d*/.test(record.isin ?? '')) {
    // ISIN carries a run of digits; informational only, never alone decisive.
    // (kept intentionally out of the verdict to avoid false positives)
  }
  return evidence;
}

function inc(dist: Record<string, number>, key: string): void {
  dist[key] = (dist[key] ?? 0) + 1;
}
function sortedRecord(obj: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

const TOP_LEVEL_FIELDS = [
  'companyId', 'isin', 'cin', 'companyName', 'industry', 'sector',
  'listingStatus', 'lotSize', 'tickSize', 'faceValue', 'currency',
  'effectiveFrom', 'listings', 'nseSymbol', 'bseSymbol', 'bseScripCode',
] as const;
const LISTING_STATUS_ENUM = new Set(['ACTIVE', 'SUSPENDED', 'DELISTED']);
const CURRENCY_ENUM = new Set(['INR', 'USD']);
const EXCHANGE_ENUM = new Set(['NSE', 'BSE']);

/* ── core audit ──────────────────────────────────────────────────────────── */

export function auditCorpus(rawRecords: ReadonlyArray<Record<string, unknown>>, opts: AuditInputOptions): CorpusAuditReport {
  const findings: CorpusAuditFinding[] = [];
  const checks: CorpusAuditCheck[] = [];
  const distributions: Record<string, Record<string, number>> = {
    listingStatus: {}, currency: {}, sector: {}, industry: {},
    lotSize: {}, tickSize: {}, faceValue: {}, listingsPerRecord: {},
    exchangePairs: {}, effectiveFrom: {},
  };

  const recordCount = rawRecords.length;
  const f = (index: number, companyId: string | undefined, severity: AuditSeverity, code: string, field: string, detail: string): void => {
    findings.push({ index, companyId: nonBlank(companyId) ? companyId : '(absent)', code, severity, field, detail });
  };

  /* ── collection of identifier pools for uniqueness audit ─────────────────── */
  const companyIds: string[] = [];
  const isins: string[] = [];
  const cins: Array<{ cin: string; index: number }> = [];
  const nseSymbols: Array<{ symbol: string; index: number }> = [];
  const bseSymbols: Array<{ symbol: string; index: number }> = [];
  const bseScripCodes: Array<{ code: string; index: number }> = [];
  let markerCount = 0;

  for (let i = 0; i < recordCount; i++) {
    const r = rawRecords[i] ?? {};
    const companyId = nonBlank(r.companyId) ? r.companyId.trim() : '';
    const isin = nonBlank(r.isin) ? r.isin.trim().toUpperCase() : '';
    companyIds.push(companyId);
    if (isin) isins.push(isin);
    if (nonBlank(r.cin)) cins.push({ cin: r.cin.trim().toUpperCase(), index: i });
    if (nonBlank(r.nseSymbol)) nseSymbols.push({ symbol: r.nseSymbol.trim().toUpperCase(), index: i });
    if (nonBlank(r.bseSymbol)) bseSymbols.push({ symbol: r.bseSymbol.trim().toUpperCase(), index: i });
    if (nonBlank(r.bseScripCode)) bseScripCodes.push({ code: String(r.bseScripCode).trim(), index: i });

    if (detectGeneratorMarker({ companyId, companyName: nonBlank(r.companyName) ? String(r.companyName) : '', isin }).length > 0) {
      markerCount += 1;
    }
  }

  const duplicates = (arr: string[]): Map<string, number> => {
    const m = new Map<string, number>();
    for (const v of arr) m.set(v, (m.get(v) ?? 0) + 1);
    const out = new Map<string, number>();
    for (const [k, v] of m) if (v > 1) out.set(k, v);
    return out;
  };
  const dupIds = duplicates(companyIds.filter(nonBlank));
  const dupIsins = duplicates(isins);
  const dupCins = duplicates(cins.map((c) => c.cin));
  const dupNse = duplicates(nseSymbols.map((s) => s.symbol));
  const dupBse = duplicates(bseSymbols.map((s) => s.symbol));
  const dupScrip = duplicates(bseScripCodes.map((s) => s.code));

  for (const i of Array.from({ length: recordCount }, (_, i) => i)) {
    const r = rawRecords[i] ?? {};
    const companyId = nonBlank(r.companyId) ? String(r.companyId).trim() : '';

    /* ── mandatory top-level field presence (deposit policy) ──────────────── */
    for (const field of TOP_LEVEL_FIELDS) {
      if (!(field in r) || r[field] === undefined || r[field] === null) {
        f(i, companyId, 'CRITICAL', 'FIELD_MISSING', field, 'field absent');
      } else if (field !== 'listings' && typeof r[field] === 'string' && (r[field] as string).trim() === '') {
        f(i, companyId, 'CRITICAL', 'FIELD_BLANK', field, 'field blank string');
      }
    }

    /* ── identifier shapes ────────────────────────────────────────────────── */
    if (companyId && !COMPANY_ID_REGEX.test(companyId)) f(i, companyId, 'WARNING', 'COMPANY_ID_CONVENTION', 'companyId', `does not match EQ_<TOKEN>_IN convention: ${companyId}`);
    if (nonBlank(r.isin)) {
      const isin = String(r.isin).trim().toUpperCase();
      if (!ISIN_REGEX.test(isin)) f(i, companyId, 'CRITICAL', 'ISIN_SHAPE', 'isin', `fails ISO 6166 shape: ${isin}`);
      else if (!isIsinCheckDigitValid(isin)) f(i, companyId, 'CRITICAL', 'ISIN_LUHN', 'isin', `fails ISO 6166 check digit: ${isin}`);
    }
    if (nonBlank(r.cin) && !CIN_MCA_REGEX.test(String(r.cin).trim().toUpperCase())) {
      f(i, companyId, 'WARNING', 'CIN_PATTERN', 'cin', `does not match MCA-like CIN pattern: ${String(r.cin)}`);
    }

    /* ── enum / positivity / date validation ──────────────────────────────── */
    if (r.listingStatus !== undefined && !LISTING_STATUS_ENUM.has(String(r.listingStatus))) {
      f(i, companyId, 'CRITICAL', 'ENUM_LISTING_STATUS', 'listingStatus', `not in {ACTIVE,SUSPENDED,DELISTED}: ${String(r.listingStatus)}`);
    }
    if (r.currency !== undefined && !CURRENCY_ENUM.has(String(r.currency))) {
      f(i, companyId, 'CRITICAL', 'ENUM_CURRENCY', 'currency', `not INR/USD: ${String(r.currency)}`);
    }
    if (r.lotSize !== undefined && !positiveInt(r.lotSize)) f(i, companyId, 'CRITICAL', 'LOT_SIZE_POSITIVE_INT', 'lotSize', `must be a positive integer: ${String(r.lotSize)}`);
    if (r.tickSize !== undefined && !positiveFinite(r.tickSize)) f(i, companyId, 'CRITICAL', 'TICK_SIZE_POSITIVE', 'tickSize', `must be positive: ${String(r.tickSize)}`);
    if (r.faceValue !== undefined && !positiveFinite(r.faceValue)) f(i, companyId, 'CRITICAL', 'FACE_VALUE_POSITIVE', 'faceValue', `must be positive: ${String(r.faceValue)}`);
    if (r.effectiveFrom !== undefined) {
      if (!isIsoInstant(r.effectiveFrom)) f(i, companyId, 'CRITICAL', 'EFFECTIVE_FROM_INVALID', 'effectiveFrom', `not a parseable UTC ISO instant: ${String(r.effectiveFrom)}`);
      else distributions.effectiveFrom[String(r.effectiveFrom)] = (distributions.effectiveFrom[String(r.effectiveFrom)] ?? 0) + 1;
    }
    if (r.effectiveTo !== undefined) {
      if (!isIsoInstant(r.effectiveTo)) f(i, companyId, 'CRITICAL', 'EFFECTIVE_TO_INVALID', 'effectiveTo', `not a parseable UTC ISO instant: ${String(r.effectiveTo)}`);
      else if (isIsoInstant(r.effectiveFrom) && Date.parse(String(r.effectiveTo)) < Date.parse(String(r.effectiveFrom))) {
        f(i, companyId, 'CRITICAL', 'EFFECTIVE_WINDOW_INVERTED', 'effectiveTo', 'effectiveTo precedes effectiveFrom');
      }
    }

    /* ── listings audit ───────────────────────────────────────────────────── */
    const listings = Array.isArray(r.listings) ? (r.listings as Array<Record<string, unknown>>) : null;
    if (r.listings === undefined || r.listings === null) {
      f(i, companyId, 'CRITICAL', 'FIELD_MISSING', 'listings', 'field absent');
    } else if (!listings) {
      f(i, companyId, 'CRITICAL', 'LISTINGS_NOT_ARRAY', 'listings', 'not an array');
    } else {
      inc(distributions.listingsPerRecord, String(listings.length));
      if (listings.length === 0) f(i, companyId, 'CRITICAL', 'LISTINGS_EMPTY', 'listings', 'empty listings array');
      const exchanges = new Set<string>();
      for (let j = 0; j < listings.length; j++) {
        const l = listings[j] ?? {};
        exchanges.add(String(l.exchange ?? '(absent)'));
        if (!EXCHANGE_ENUM.has(String(l.exchange))) f(i, companyId, 'CRITICAL', 'EXCHANGE_ENUM', `listings[${j}].exchange`, `not NSE|BSE: ${String(l.exchange)}`);
        if (!nonBlank(l.symbol)) f(i, companyId, 'CRITICAL', 'LISTING_SYMBOL_MISSING', `listings[${j}].symbol`, 'blank listing symbol');
        if (l.status !== undefined && !LISTING_STATUS_ENUM.has(String(l.status))) f(i, companyId, 'CRITICAL', 'LISTING_STATUS_ENUM', `listings[${j}].status`, `not in enum: ${String(l.status)}`);
        if (!positiveInt(l.lotSize)) f(i, companyId, 'CRITICAL', 'LISTING_LOT_SIZE', `listings[${j}].lotSize`, `must be a positive integer: ${String(l.lotSize)}`);
        if (!positiveFinite(l.tickSize)) f(i, companyId, 'CRITICAL', 'LISTING_TICK_SIZE', `listings[${j}].tickSize`, `must be positive: ${String(l.tickSize)}`);
        if (l.exchange === 'BSE' && l.scripCode !== undefined && !nonBlank(String(l.scripCode))) {
          f(i, companyId, 'WARNING', 'BSE_SCRIPCODE_BLANK', `listings[${j}].scripCode`, 'scripCode present but blank');
        }
      }
      inc(distributions.exchangePairs, [...exchanges].sort().join('+'));
      const hasActiveNse = listings.some((l) => l?.exchange === 'NSE' && l?.status === 'ACTIVE' && nonBlank(l?.symbol));
      if (!hasActiveNse) f(i, companyId, 'CRITICAL', 'NO_ACTIVE_NSE_LISTING', 'listings', 'no ACTIVE NSE listing with a symbol');
    }

    /* ── distributions ─────────────────────────────────────────────────────── */
    if (r.listingStatus !== undefined) inc(distributions.listingStatus, String(r.listingStatus));
    if (r.currency !== undefined) inc(distributions.currency, String(r.currency));
    if (nonBlank(r.sector)) inc(distributions.sector, String(r.sector));
    if (nonBlank(r.industry)) inc(distributions.industry, String(r.industry));
    if (r.lotSize !== undefined && positiveFinite(r.lotSize)) inc(distributions.lotSize, String(r.lotSize));
    if (r.tickSize !== undefined && positiveFinite(r.tickSize)) inc(distributions.tickSize, String(r.tickSize));
    if (r.faceValue !== undefined && positiveFinite(r.faceValue)) inc(distributions.faceValue, String(r.faceValue));
  }

  /* ── uniqueness findings ────────────────────────────────────────────────── */
  const dupReport = (dupMap: Map<string, number>, code: string, field: string): void => {
    for (const [value, count] of [...dupMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      f(-1, '(corpus)', 'CRITICAL', code, field, `${value} appears ${count} times`);
    }
  };
  dupReport(dupIds, 'DUPLICATE_COMPANY_ID', 'companyId');
  dupReport(dupIsins, 'DUPLICATE_ISIN', 'isin');
  dupReport(dupCins, 'DUPLICATE_CIN', 'cin');
  dupReport(dupNse, 'DUPLICATE_NSE_SYMBOL', 'nseSymbol');
  dupReport(dupBse, 'DUPLICATE_BSE_SYMBOL', 'bseSymbol');
  dupReport(dupScrip, 'DUPLICATE_BSE_SCRIP_CODE', 'bseScripCode');

  findings.sort((a, b) => a.index - b.index || a.code.localeCompare(b.code) || a.field.localeCompare(b.field));

  /* ── checks summary ─────────────────────────────────────────────────────── */
  const countCode = (code: string): number => findings.filter((x) => x.code === code).length;
  const critical = findings.filter((x) => x.severity === 'CRITICAL').length;
  const warning = findings.filter((x) => x.severity === 'WARNING').length;
  const info = findings.filter((x) => x.severity === 'INFO').length;
  const push = (id: string, status: CorpusAuditCheck['status'], detail: string, count: number): void => { checks.push({ id, status, detail, count }); };

  push('CHECK-RECORD-COUNT', 'INFO', `${recordCount} records parsed and evaluated`, recordCount);
  push('CHECK-ISIN-SHAPE', countCode('ISIN_SHAPE') === 0 ? 'PASS' : 'FAIL', 'ISO 6166 structural conformance of all non-blank ISINs', countCode('ISIN_SHAPE'));
  push('CHECK-ISIN-LUHN', countCode('ISIN_LUHN') === 0 ? 'PASS' : 'FAIL', 'ISO 6166 check digit verification for all non-blank ISINs', countCode('ISIN_LUHN'));
  push('CHECK-COMPANY-ID-CONVENTION', countCode('COMPANY_ID_CONVENTION') === 0 ? 'PASS' : 'WARN', 'companyId convention EQ_<TOKEN>_IN', countCode('COMPANY_ID_CONVENTION'));
  push('CHECK-CIN-PATTERN', countCode('CIN_PATTERN') === 0 ? 'PASS' : 'WARN', 'MCA-like CIN pattern', countCode('CIN_PATTERN'));
  push('CHECK-FIELD-COMPLETENESS', countCode('FIELD_MISSING') + countCode('FIELD_BLANK') === 0 ? 'PASS' : 'FAIL', 'presence/non-blank of all 16 top-level fields', countCode('FIELD_MISSING') + countCode('FIELD_BLANK'));
  push('CHECK-LISTINGS', countCode('LISTINGS_NOT_ARRAY') + countCode('LISTINGS_EMPTY') + countCode('NO_ACTIVE_NSE_LISTING') + countCode('EXCHANGE_ENUM') + countCode('LISTING_STATUS_ENUM') + countCode('LISTING_SYMBOL_MISSING') + countCode('LISTING_LOT_SIZE') + countCode('LISTING_TICK_SIZE') === 0 ? 'PASS' : 'FAIL', 'listings structural + enum + eligibility checks', countCode('LISTINGS_NOT_ARRAY') + countCode('LISTINGS_EMPTY') + countCode('NO_ACTIVE_NSE_LISTING') + countCode('EXCHANGE_ENUM') + countCode('LISTING_STATUS_ENUM') + countCode('LISTING_SYMBOL_MISSING') + countCode('LISTING_LOT_SIZE') + countCode('LISTING_TICK_SIZE'));
  push('CHECK-POSITIVITY', countCode('LOT_SIZE_POSITIVE_INT') + countCode('TICK_SIZE_POSITIVE') + countCode('FACE_VALUE_POSITIVE') === 0 ? 'PASS' : 'FAIL', 'lotSize/tickSize/faceValue positivity', countCode('LOT_SIZE_POSITIVE_INT') + countCode('TICK_SIZE_POSITIVE') + countCode('FACE_VALUE_POSITIVE'));
  push('CHECK-EFFECTIVE-DATES', countCode('EFFECTIVE_FROM_INVALID') + countCode('EFFECTIVE_TO_INVALID') + countCode('EFFECTIVE_WINDOW_INVERTED') === 0 ? 'PASS' : 'FAIL', 'ISO-8601 UTC instants and window order', countCode('EFFECTIVE_FROM_INVALID') + countCode('EFFECTIVE_TO_INVALID') + countCode('EFFECTIVE_WINDOW_INVERTED'));
  push('CHECK-UNIQUENESS', dupIds.size + dupIsins.size + dupCins.size + dupNse.size + dupBse.size + dupScrip.size === 0 ? 'PASS' : 'FAIL', 'companyId/ISIN/CIN/NSE/BSE symbol/scripCode uniqueness', dupIds.size + dupIsins.size + dupCins.size + dupNse.size + dupBse.size + dupScrip.size);
  push('CHECK-GENERATED-MARKERS', 'INFO', 'records carrying algorithmic-series markers (not an authenticity verdict)', markerCount);
  push('CHECK-FINDING-TOTALS', critical === 0 ? (warning === 0 ? 'PASS' : 'WARN') : 'FAIL', `${critical} CRITICAL, ${warning} WARNING, ${info} INFO findings`, findings.length);

  const markerFreeCount = recordCount - markerCount;
  const report: CorpusAuditReport = {
    reportVersion: 1,
    tool: { name: 'd05-corpus-audit', version: 1 },
    input: { path: opts.path, sha256: opts.corpusSha256, recordCount },
    originPolicy: {
      perRecordClassification: 'UNCLASSIFIED',
      markerCount,
      markerFreeCount,
      disclaimer:
        'Origin classification is UNCLASSIFIED for every record (PA decision 2026-10-19-01, C1–C3). ' +
        'A generator marker identifies algorithmically generated series; it is not an authenticity verdict either way, ' +
        'and 52 marker-free records are not issuer-verified. ISIN checksum validity is a syntax property, not evidence.',
    },
    counts: {
      records: recordCount,
      distinctCompanyIds: new Set(companyIds.filter(nonBlank)).size,
      distinctIsins: new Set(isins).size,
      distinctCins: new Set(cins.map((c) => c.cin)).size,
      distinctNseSymbols: new Set(nseSymbols.map((s) => s.symbol)).size,
      distinctBseSymbols: new Set(bseSymbols.map((s) => s.symbol)).size,
      distinctBseScripCodes: new Set(bseScripCodes.map((s) => s.code)).size,
      criticalFindings: critical,
      warningFindings: warning,
      infoFindings: info,
      totalFindings: findings.length,
      uniqueFieldCount: TOP_LEVEL_FIELDS.length,
    },
    distributions: Object.fromEntries(Object.entries(distributions).map(([k, v]) => [k, sortedRecord(v)])),
    checks,
    findings,
    evidenceRefs: opts.evidenceRefs ?? [],
    nextSteps: [
      'If a Wave-3 expansion is authorized: deposit an authoritative merged dataset (NSE+BSE+MCA+taxonomy) under a new deposition act; do not infer values.',
      'Apply the migration-options assessment (evidence/cross-repository) with a PA decision before any corpus revision is created.',
      'Re-run this audit against any candidate expansion corpus; publication requires criticalFindings == 0 plus re-pinned governed constants in one reviewed PR.',
    ],
  };

  return report;
}

/* ── serialization (deterministic) ───────────────────────────────────────── */

export function reportToJson(report: CorpusAuditReport): string {
  return JSON.stringify(report, null, 2) + '\n';
}

export function reportToCsv(report: CorpusAuditReport): string {
  const esc = (v: string | number): string => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = ['index,companyId,severity,code,field,detail'];
  for (const x of report.findings) lines.push([x.index, x.companyId, x.severity, x.code, x.field, x.detail].map(esc).join(','));
  return lines.join('\n') + '\n';
}

export function reportToMarkdown(report: CorpusAuditReport): string {
  const c = report.counts;
  const lines: string[] = [
    '# D05 Security Master — Corpus Audit Summary',
    '',
    `- Records: **${c.records}** (sha256 \`${report.input.sha256}\`)`,
    `- Distinct companyId / ISIN / CIN: ${c.distinctCompanyIds} / ${c.distinctIsins} / ${c.distinctCins}`,
    `- Distinct NSE symbol / BSE symbol / BSE scripCode: ${c.distinctNseSymbols} / ${c.distinctBseSymbols} / ${c.distinctBseScripCodes}`,
    `- Origin classification of every record: **${report.originPolicy.perRecordClassification}**`,
    `- Generator-marker count: **${report.originPolicy.markerCount}** (marker-free: **${report.originPolicy.markerFreeCount}**) — markers are NOT authenticity verdicts`,
    `- Findings — CRITICAL: **${c.criticalFindings}**, WARNING: **${c.warningFindings}**, INFO: **${c.infoFindings}**`,
    '',
    '## Checks',
    '',
    '| Check | Status | Count | Detail |',
    '|---|---|---|---|',
    ...report.checks.map((x) => `| ${x.id} | ${x.status} | ${x.count} | ${x.detail} |`),
    '',
    '## Evidence references',
    '',
    '| Ref | Path | SHA-256 | Present |',
    '|---|---|---|---|',
    ...report.evidenceRefs.map((e) => `| ${e.ref} | ${e.path ?? '—'} | \`${e.sha256 ?? '—'}\` | ${e.present ? 'yes' : 'NO'} |`),
    '',
    '## Distributions',
    '',
    ...Object.entries(report.distributions).flatMap(([key, dist]) => [
      `### ${key}`,
      '',
      ...Object.entries(dist).map(([k, v]) => `- ${k}: ${v}`),
      '',
    ]),
    '## Next steps',
    '',
    ...report.nextSteps.map((s) => `- ${s}`),
    '',
  ];
  return lines.join('\n');
}
