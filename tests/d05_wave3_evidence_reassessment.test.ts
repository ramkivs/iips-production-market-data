/**
 * D05 Wave-3 EQ — one-time compensated evidence reassessment (2026-11-08) conformance guards.
 * Pins the derived (corrected/reduced) artifacts under evidence/D05-Wave3/derived/,
 * the readiness-tool synonym fix, and the disposition of the 2026-11-08 submission.
 * These artifacts are PA-authorized corrections + carry-forwards, NOT re-verified registry facts.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const DERIVED = 'evidence/D05-Wave3/derived';
const MCA = `${DERIVED}/arena_mca_identity_bridged.derived.csv`;
const BSE = `${DERIVED}/arena_bse_identity_bridged.derived.csv`;
const TAXONOMY = `${DERIVED}/arena_taxonomy_submission.derived.csv`;
const TICK = `${DERIVED}/arena_tick_size_evidence.derived.csv`;
const LEDGER = `${DERIVED}/DERIVATION.md`;
const NEW_ZIP = 'evidence/D05-Wave3/arena_D05_evidence.zip';
const READINESS = 'src/audit/source_readiness.ts';

const repo = (p: string): string => {
  const full = resolve(process.cwd(), p);
  assert.ok(existsSync(full), `expected ${p}`);
  return readFileSync(full, 'utf8');
};
const sha256 = (p: string): string =>
  createHash('sha256').update(readFileSync(resolve(process.cwd(), p))).digest('hex');

/** Minimal RFC-4180 parser (handles quoted fields with embedded commas/quotes). */
const parseCsv = (text: string): Array<Record<string, string>> => {
  const rows: string[][] = [];
  let cur: string[] = []; let field = ''; let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ',') { cur.push(field); field = ''; continue; }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); cur = []; field = ''; }
      continue;
    }
    field += c;
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  const header = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
};
const load = (p: string): Array<Record<string, string>> => parseCsv(repo(p));

const CIN_RE = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;

describe('D05 Wave-3 EQ one-time compensated reassessment (2026-11-08)', () => {
  it('derived artifact bytes are exactly the re-derivable outputs', () => {
    assert.equal(sha256(MCA), '9e081614a6f2b0ef131cc611d0cb6db0ee4e09de8aaa558c81f56270fdf8531a');
    assert.equal(sha256(BSE), '39a4fb59aaeb6bd4339d9ef376f31be0efdce2a1ec90b973f2ddde1536a9e46f');
    assert.equal(sha256(TAXONOMY), 'f8d4beefa21db201cdecb08cd84c253ca6db2d139b880dc3875e2440dd47020e');
    assert.equal(sha256(TICK), 'f5116021fa485e5184be8f1837904206496c385fa5ae40250d28199cbfec1d84');
  });

  it('published 2026-11-08 submission zip is byte-untouched (rescission happens in derived/, never by edit)', () => {
    assert.equal(sha256(NEW_ZIP), 'c86230451ec35f6fd5aa91d20a31db9de7f38e109ea3afedb9ceffaecc1014ee');
  });

  it('all four derived files carry exactly the same 2,390 EQ ISINs in order', () => {
    const ids = (p: string) => load(p).map((r) => r.isin);
    const base = ids(MCA);
    assert.equal(base.length, 2390);
    for (const p of [BSE, TAXONOMY, TICK]) assert.deepEqual(ids(p), base);
  });

  it('B1: exactly 2,305 format-valid CINs (2,296 carried + 9 statute series), 27 governed tokens, 58 empty', () => {
    const rows = load(MCA);
    assert.equal(rows.filter((r) => CIN_RE.test(r.cin)).length, 2305);
    assert.equal(rows.filter((r) => !r.cin).length, 58);
    assert.equal(rows.filter((r) => r.cin && !CIN_RE.test(r.cin)).length, 27);
    // carried legal-entity evidence: Jain share classes share one entity CIN
    const counts = new Map<string, number>();
    for (const r of rows) if (r.cin) counts.set(r.cin, (counts.get(r.cin) ?? 0) + 1);
    assert.equal(counts.get('L29120MH1986PLC042028'), 2);
    assert.equal([...counts.keys()].filter((k) => CIN_RE.test(k)).length, 2304);
    assert.equal([...counts.keys()].filter((k) => !CIN_RE.test(k)).length, 27);
    // known unevidenced mega-caps are isolated, not populated
    for (const sym of ['ONGC', 'LT', 'M&M', 'M&MFIN', 'BANKBARODA', 'CANBK', 'TATAPOWER']) {
      assert.equal(rows.find((r) => r.symbol === sym)?.cin, '');
    }
  });

  it('B1: 9 statute-series CINs are carried attributions, never labelled as in-bundle registry matches', () => {
    const rows = load(MCA);
    for (const sym of ['FACT', 'INDIANB', 'IOB', 'LICI', 'NATIONALUM', 'PNB', 'PSB', 'SBIN', 'UCOBANK']) {
      const r = rows.find((row) => row.symbol === sym);
      assert.match(r?.mcaIdentityStatus ?? '', /statutory attribution/i);
      assert.match(r?.provenance ?? '', /not an in-bundle registry cross-walk|no registry artifact/i);
    }
  });

  it('B2: 2,290 exact-join scrips + 100 governed NSE-exclusives; placeholders rescinded; scrips unique', () => {
    const rows = load(BSE);
    const dual = rows.filter((r) => r.bseScripCode);
    const excl = rows.filter((r) => !r.bseScripCode);
    assert.equal(dual.length, 2290);
    assert.equal(excl.length, 100);
    for (const r of dual) assert.match(r.bseScripCode, /^\d{6}$/);
    assert.equal(new Set(dual.map((r) => r.bseScripCode)).size, 2290);
    for (const r of rows) assert.doesNotMatch(r.bseScripCode + r.bseIdentityStatus, /UNLISTED-BSE/);
    for (const sym of ['AAKASH', 'BSE', 'CDSL', 'ZOTA', 'MAHESHWARI', 'NBIFIN']) {
      assert.equal(excl.find((r) => r.symbol === sym)?.exchangeClassification, 'NSE-Exclusive');
    }
  });

  it('B3: classification basis is disclosed systematic (not NSE-published); 68-rule pass; sentinel fixes', () => {
    const rows = load(TAXONOMY);
    for (const r of rows) {
      assert.match(r.classificationBasis ?? '', /^PA-governed systematic classification/);
      assert.ok(r.correctionApplied === 'yes' || r.correctionApplied === 'no');
    }
    assert.equal(rows.filter((r) => r.correctionApplied === 'yes').length, 68);
    const bySym = new Map(rows.map((r) => [r.symbol, r]));
    assert.equal(bySym.get('SBIN')?.basicIndustry, 'Public Sector Bank');
    assert.equal(bySym.get('J&KBANK')?.basicIndustry, 'Private Sector Bank');
    assert.equal(bySym.get('IDBI')?.basicIndustry, 'Public Sector Bank');
    assert.equal(bySym.get('HDFCBANK')?.basicIndustry, 'Private Sector Bank');
    assert.equal(bySym.get('FINOPB')?.basicIndustry, 'Private Sector Bank');
    assert.equal(bySym.get('BANKA')?.basicIndustry, 'Industrial Products');
    assert.equal(bySym.get('FEDFINA')?.basicIndustry, 'Non Banking Financial Company (NBFC)');
    assert.equal(bySym.get('INDBANK')?.basicIndustry, 'Financial Institution');
    assert.equal(bySym.get('RECLTD')?.basicIndustry, 'Non Banking Financial Company (NBFC)');
    assert.equal(bySym.get('BAJAJFINSV')?.basicIndustry, 'Holding Company');
    assert.equal(bySym.get('HDFCLIFE')?.basicIndustry, 'Life Insurance');
    assert.equal(bySym.get('STARHEALTH')?.basicIndustry, 'General Insurance');
    assert.equal(bySym.get('DMART')?.basicIndustry, 'Speciality Retail');
    assert.equal(bySym.get('TITAN')?.basicIndustry, 'Gems, Jewellery And Watches');
    assert.equal(bySym.get('ASIANPAINT')?.basicIndustry, 'Paints');
    assert.equal(bySym.get('HEROMOTOCO')?.basicIndustry, '2/3 Wheelers');
    assert.equal(bySym.get('MARUTI')?.basicIndustry, 'Passenger Cars & Utility Vehicles');
    assert.equal(bySym.get('HINDUNILVR')?.basicIndustry, 'Personal Care');
  });

  it('B4: fabricated reference prices are absent; 0.05 is PA-act-PENDING uniform proposal, never a bound determination', () => {
    const rows = load(TICK);
    for (const r of rows) {
      assert.equal(r.referenceClosingPriceINR, '');
      assert.equal(r.minimumTickSizeINR, '0.05');
      assert.match(r.tickSizeComplianceStatus ?? '', /PENDING/);
      assert.doesNotMatch(r.tickSizeComplianceStatus ?? '', /Price-Linked Tier Verified/);
    }
  });

  it('ledger documents the DEPOSITION_BLOCKED verdict and the PA-decision mapping; nothing deposited', () => {
    const doc = repo(LEDGER);
    assert.match(doc, /DEPOSITION_BLOCKED/);
    assert.match(doc, /D-3/);
    assert.match(doc, /D-4/);
    assert.match(doc, /D-9/);
    assert.match(doc, /recordCount !== 2250|recordCount !== 2250/);
  });

  it('readiness tool accepts canonical bseScripCode header (fail-closed synonym fix retained)', () => {
    const src = repo(READINESS);
    assert.match(src, /'bsescripcode'/);
    assert.doesNotMatch(src, /'bssescripcode'/);
    assert.match(src, /placeholders are not identity claims/);
  });
});
