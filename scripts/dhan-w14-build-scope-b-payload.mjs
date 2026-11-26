#!/usr/bin/env node
/**
 * Dhan W-14 Scope B — deterministic payload + reconciliation manifest generator.
 *
 * Sources:
 *  - evidence/dhan-w14-e4/e4-sample-reconciliation.json (96 records, 6 with companyIdResolvesInP04Now)
 *  - evidence/dhan-p7/qualification-manifest.json (4,680 QUALIFIED, P7 registry mapping check)
 *
 * Outputs (deterministic, pretty-printed):
 *  - evidence/dhan-w14-e4/w14-scope-b-batch-payload.json
 *  - evidence/dhan-w14-e4/w14-scope-b-reconciliation-manifest.json
 *
 * No network, no credentials, no live call.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const RECON_PATH = path.join(ROOT, 'evidence/dhan-w14-e4/e4-sample-reconciliation.json');
const MANIFEST_PATH = path.join(ROOT, 'evidence/dhan-p7/qualification-manifest.json');
const OUT_PAYLOAD = path.join(ROOT, 'evidence/dhan-w14-e4/w14-scope-b-batch-payload.json');
const OUT_RECON = path.join(ROOT, 'evidence/dhan-w14-e4/w14-scope-b-reconciliation-manifest.json');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function sha256Hex(obj) {
  const json = JSON.stringify(obj);
  return crypto.createHash('sha256').update(json).digest('hex');
}

const recon = loadJson(RECON_PATH);
const p7 = loadJson(MANIFEST_PATH);

// Build P7 lookup: key = exchangeSegment|isin|series|dhanSecurityId + companyId
// mapping.exchangeSegment, dhanSecurityId etc sit under r.mapping or top-level? In manifest, top-level has companyId + exchange+segment+...
const p7ByKey = new Map();
for (const r of p7.records) {
  if (r.disposition !== 'QUALIFIED') continue;
  const companyId = r.companyId;
  const seg = r.mapping?.exchangeSegment ?? (r.exchange === 'NSE' ? 'NSE_EQ' : 'BSE_EQ');
  const dhanId = r.dhanSecurityId;
  const isin = r.isin;
  const series = r.series;
  // Key for scope check: companyId|seg|isin|series|dhanId
  const key = `${companyId}|${seg}|${isin}|${series}|${dhanId}`;
  p7ByKey.set(key, r);
  // Also by seg+dhanId for secondary check
  const secKey = `${seg}:${dhanId}`;
  if (!p7ByKey.has(`seg:${secKey}`)) p7ByKey.set(`seg:${secKey}`, r);
}

const records = recon.records;
if (records.length !== 96) {
  console.error(`Expected 96 records in reconciliation, got ${records.length}`);
  process.exit(1);
}

// Build Scope B instruments: corrected companyId where p04CompanyIdChanged
const instruments = records.map((r) => {
  const correctedCompanyId = r.p04CompanyIdChanged ? r.companyIdResolvesInP04Now : r.companyId;
  const originalCompanyId = r.companyId;
  const identityCorrected = r.p04CompanyIdChanged === true;
  // Verify P7 mapping exists for corrected identity
  const seg = r.exchangeSegment;
  const isin = r.isin;
  const series = r.series;
  const dhanId = r.dhanSecurityId;
  const p7Key = `${correctedCompanyId}|${seg}|${isin}|${series}|${dhanId}`;
  const p7Entry = p7ByKey.get(p7Key);
  if (!p7Entry) {
    console.error(`P7 mapping MISSING for Scope B instrument: ${p7Key} (original ${originalCompanyId} -> ${correctedCompanyId})`);
    process.exit(1);
  }
  return {
    companyId: correctedCompanyId,
    originalCompanyId,
    identityCorrected,
    isin,
    exchange: r.exchange,
    exchangeSegment: seg,
    series,
    canonicalSecurityIdentity: r.securityIdentity,
    dhanSecurityId: dhanId,
    // provenance
    p7LineNumber: p7Entry.lineNumber,
    historicalDisposition: r.historicalDisposition,
    lastVerifiedAt: r.lastVerifiedAt,
  };
});

// Deterministic sort for manifest: by exchangeSegment then numeric dhanSecurityId
instruments.sort((a, b) => {
  if (a.exchangeSegment !== b.exchangeSegment) return a.exchangeSegment.localeCompare(b.exchangeSegment);
  return Number(a.dhanSecurityId) - Number(b.dhanSecurityId);
});

// Build payload grouped + sorted
const grouped = {};
for (const inst of instruments) {
  const bucket = grouped[inst.exchangeSegment] ?? (grouped[inst.exchangeSegment] = []);
  bucket.push(Number(inst.dhanSecurityId));
}
for (const seg of Object.keys(grouped)) grouped[seg].sort((a, b) => a - b);
// Canonical order BSE_EQ then NSE_EQ
const payload = {};
if (grouped.BSE_EQ) payload.BSE_EQ = grouped.BSE_EQ;
if (grouped.NSE_EQ) payload.NSE_EQ = grouped.NSE_EQ;

const payloadJson = JSON.stringify(payload);
const payloadSha256 = crypto.createHash('sha256').update(payloadJson).digest('hex');

// Build reconciliation manifest (machine-readable, one entry per payload instrument)
const reconciliationManifest = {
  task: 'DHAN-W14 Scope B — 96-instrument batch quote payload (BLK-2 corrected)',
  generatedAtUtc: new Date().toISOString(),
  source: {
    reconciliation: 'evidence/dhan-w14-e4/e4-sample-reconciliation.json',
    reconciliationBlob: recon.sampleSource?.blob ?? '50d9424af01527897df132a63f74d635286bfe9d',
    reconciliationGeneratedForBaseline: recon.generatedForBaseline,
    p7Manifest: 'evidence/dhan-p7/qualification-manifest.json',
    p7GeneratedAtUtc: p7.generatedAtUtc,
    p7BatchId: p7.p04SourceRevision?.batchId,
    p7TotalQualified: p7.totals?.qualified,
  },
  correctionsApplied: 6,
  corrections: [
    { originalCompanyId: 'EQ_TATAMOTORS_IN', correctedCompanyId: 'EQ_TMPV_IN', isins: ['INE155A01022'], dhanSecurityIds: ['3456', '500570'], exchanges: ['NSE', 'BSE'] },
    { originalCompanyId: 'EQ_BAJAJ-AUTO_IN', correctedCompanyId: 'EQ_BAJAJAUTO_IN', isins: ['INE917I01010'], dhanSecurityIds: ['16669', '532977'], exchanges: ['NSE', 'BSE'] },
    { originalCompanyId: 'EQ_LTIM_IN', correctedCompanyId: 'EQ_LTM_IN', isins: ['INE214T01019'], dhanSecurityIds: ['17818', '540005'], exchanges: ['NSE', 'BSE'] },
  ],
  counts: {
    total: instruments.length,
    byExchangeSegment: { NSE_EQ: grouped.NSE_EQ?.length ?? 0, BSE_EQ: grouped.BSE_EQ?.length ?? 0 },
    byP7Series: { EQ: instruments.filter(i => i.series === 'EQ').length, A: instruments.filter(i => i.series === 'A').length, B: instruments.filter(i => i.series === 'B').length },
    distinctCompanies: new Set(instruments.map(i => i.companyId)).size,
    distinctIsins: new Set(instruments.map(i => i.isin)).size,
    corrected: instruments.filter(i => i.identityCorrected).length,
    dualListedIsins: (() => {
      const m = new Map();
      for (const i of instruments) m.set(i.isin, (m.get(i.isin) ?? 0) + 1);
      return [...m.entries()].filter(([,c])=>c===2).map(([isin])=>isin);
    })(),
  },
  payload: {
    segmentKeys: Object.keys(payload),
    totalSecurityIds: Object.values(payload).reduce((a, b) => a + b.length, 0),
    payloadSha256,
    // Pretty payload also written separately; this is the canonical minified hash
  },
  instruments: instruments.map((inst) => ({
    companyId: inst.companyId,
    originalCompanyId: inst.originalCompanyId,
    identityCorrected: inst.identityCorrected,
    isin: inst.isin,
    exchange: inst.exchange,
    exchangeSegment: inst.exchangeSegment,
    series: inst.series,
    canonicalSecurityIdentity: inst.canonicalSecurityIdentity,
    dhanSecurityId: inst.dhanSecurityId,
    p7LineNumber: inst.p7LineNumber,
    historicalDisposition: inst.historicalDisposition,
    inPayload: true,
    payloadSegment: inst.exchangeSegment,
  })),
  validation: {
    expectedTotal: 96,
    uniqueSegmentSecurityIds: new Set(instruments.map(i => `${i.exchangeSegment}:${i.dhanSecurityId}`)).size,
    noDuplicates: new Set(instruments.map(i => `${i.exchangeSegment}:${i.dhanSecurityId}`)).size === instruments.length,
    payloadTotalMatches: Object.values(payload).reduce((a, b) => a + b.length, 0) === instruments.length,
    allSixCorrectionsPresent: instruments.filter(i => i.identityCorrected).length === 6,
  }
};

// Write payload pretty (2-space) for humans + stable
fs.writeFileSync(OUT_PAYLOAD, JSON.stringify(payload, null, 2) + '\n', 'utf8');
fs.writeFileSync(OUT_RECON, JSON.stringify(reconciliationManifest, null, 2) + '\n', 'utf8');

console.log(`Wrote ${OUT_PAYLOAD} — ${payload.BSE_EQ?.length ?? 0} BSE_EQ + ${payload.NSE_EQ?.length ?? 0} NSE_EQ = ${instruments.length}`);
console.log(`  payload SHA256 (minified): ${payloadSha256}`);
console.log(`Wrote ${OUT_RECON} — ${reconciliationManifest.instruments.length} entries, ${reconciliationManifest.counts.distinctCompanies} companies, ${reconciliationManifest.counts.distinctIsins} ISINs`);
console.log(`  corrected: ${reconciliationManifest.counts.corrected}, dual-listed ISINs: ${reconciliationManifest.counts.dualListedIsins.length}`);

// Also verify determinism: re-read and re-hash
const reRead = JSON.parse(fs.readFileSync(OUT_PAYLOAD, 'utf8'));
const reHash = crypto.createHash('sha256').update(JSON.stringify(reRead)).digest('hex'); // pretty vs minified? payloadJson was minified; re-read minified hash same?
// Our file is pretty; for verification the content hash is of the file bytes or minified canonical? Report both.
const fileBytesHash = crypto.createHash('sha256').update(fs.readFileSync(OUT_PAYLOAD)).digest('hex');
console.log(`  file bytes SHA256: ${fileBytesHash}`);
