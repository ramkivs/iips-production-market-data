#!/usr/bin/env node
/**
 * DHAN-P7 evidence runner (offline, deterministic).
 *
 * Consumes the RETAINED official snapshots under evidence/dhan-p7/source/
 * (never redownloads), verifies their SHA-256 against
 * source-retrieval-manifest.json, parses detailed + compact masters from
 * their observed headers, reconciles them, qualifies equity candidates
 * against the authoritative governed P04 SecurityMaster and emits the
 * qualification manifest + reports under evidence/dhan-p7/.
 *
 * No credentials, no live quote requests, no claim of live qualification.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

import {
  parseInstrumentMasterCsv,
  qualifyInstrumentMaster,
  indexCompactMaster,
  compactConsistency,
  DETAILED_REQUIRED_COLUMNS,
  COMPACT_REQUIRED_COLUMNS,
} from '../dist/src/providers/dhan/index.js';
import { getGovernedBroadSecurityMaster } from '../dist/src/identity/governed_fixture_master.js';

const srcDir = resolve(process.cwd(), 'evidence/dhan-p7/source');
const outDir = resolve(process.cwd(), 'evidence/dhan-p7');
mkdirSync(outDir, { recursive: true });

const retrievalManifest = JSON.parse(readFileSync(join(outDir, 'source-retrieval-manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

function loadVerified(file) {
  const expected = retrievalManifest.files.find((f) => f.filename === file);
  if (!expected) throw new Error(`no manifest entry for ${file}`);
  const bytes = readFileSync(join(srcDir, file));
  const actual = createHash('sha256').update(bytes).digest('hex').toUpperCase();
  if (actual !== expected.sha256.toUpperCase()) {
    throw new Error(`hash mismatch for ${file}: manifest ${expected.sha256} != actual ${actual}`);
  }
  return { text: bytes.toString('utf8'), expected, actual };
}

const detailed = loadVerified('api-scrip-master-detailed.csv');
const compact = loadVerified('api-scrip-master.csv');

const parsedDetailed = parseInstrumentMasterCsv(detailed.text, DETAILED_REQUIRED_COLUMNS);
const parsedCompact = parseInstrumentMasterCsv(compact.text, COMPACT_REQUIRED_COLUMNS);
if (parsedDetailed.schemaError) throw new Error(`detailed schema: ${parsedDetailed.schemaError}`);
if (parsedCompact.schemaError) throw new Error(`compact schema: ${parsedCompact.schemaError}`);

const compactIndex = indexCompactMaster(parsedCompact);
const securityMaster = getGovernedBroadSecurityMaster();
const sourceEvidence = {
  url: retrievalManifest.files[0].sourceUrl,
  retrievedAtUtc: retrievalManifest.files[0].retrievedAtUtc,
  httpStatus: 200,
  contentType: 'text/csv',
  contentLength: detailed.expected.sizeBytes,
  rawSha256: detailed.actual.toLowerCase(),
  byteSize: detailed.expected.sizeBytes,
  ok: true,
};

const { manifest, registry } = qualifyInstrumentMaster(parsedDetailed, securityMaster, sourceEvidence);

// Reconciliation stats over equity candidates.
const recon = { consistent: 0, missingInCompact: 0, seriesMismatch: 0, notEquitySkipped: 0 };
for (const rec of parsedDetailed.records) {
  const v = rec.values;
  if (v['SEGMENT'] !== 'E' || v['INSTRUMENT'] !== 'EQUITY') { recon.notEquitySkipped++; continue; }
  const r = compactConsistency(compactIndex, v['EXCH_ID'], v['SEGMENT'], v['SECURITY_ID'], v['SERIES']);
  if (r === 'CONSISTENT') recon.consistent++;
  else if (r === 'MISSING_IN_COMPACT') recon.missingInCompact++;
  else recon.seriesMismatch++;
}

const byCategory = {};
for (const rec of parsedDetailed.records) {
  const key = `${rec.values['SEGMENT'] ?? '?'}|${rec.values['INSTRUMENT'] ?? '?'}`;
  byCategory[key] = (byCategory[key] ?? 0) + 1;
}

const full = {
  task: 'DHAN-P7',
  generatedAtUtc: new Date().toISOString(),
  pipelineCommit: commit,
  sources: retrievalManifest.files.map((f) => ({
    filename: f.filename,
    sourceUrl: f.sourceUrl,
    retrievedAtUtc: f.retrievedAtUtc,
    sha256: f.sha256,
    sha256Verified: true,
    sizeBytes: f.sizeBytes,
    dataRows: f.dataRows,
    observedColumns: f.columns.filter(Boolean),
  })),
  schemas: {
    detailedRequired: DETAILED_REQUIRED_COLUMNS,
    compactRequired: COMPACT_REQUIRED_COLUMNS,
    detailedHeadersObserved: parsedDetailed.headers,
    compactHeadersObserved: parsedCompact.headers,
  },
  totals: {
    detailedRows: manifest.totalRows,
    compactRows: parsedCompact.records.length,
    equityCandidates: manifest.equityCandidates,
    qualified: manifest.qualified,
    registrySize: registry.size,
  },
  countsByDisposition: manifest.counts,
  countsByCategory: byCategory,
  coverageByExchangeSeries: manifest.coverageByExchangeSeries,
  reconciliation: recon,
  registryEntries: manifest.registryEntries,
  // Bounded per-record evidence: every QUALIFIED record plus the first 500 non-qualified.
  records: [
    ...manifest.records.filter((r) => r.disposition === 'QUALIFIED'),
    ...manifest.records.filter((r) => r.disposition !== 'QUALIFIED').slice(0, 500),
  ],
  identityLimitation:
    'P04 establishes companyId from exact ISIN and the active exchange listing; it does not independently carry exchange series. ' +
    'The D114 series component is sourced from the official Dhan master SERIES column (vendor evidence). ' +
    'Dhan does not independently verify P04 series; no symbol/name fallback is used.',
};
writeFileSync(join(outDir, 'qualification-manifest.json'), JSON.stringify(full, null, 2) + '\n');

const lines = [
  '# DHAN-P7 Qualification Report',
  '',
  `- Pipeline commit: ${commit}`,
  `- Detailed: ${detailed.expected.sourceUrl} sha256=${detailed.actual} rows=${manifest.totalRows}`,
  `- Compact: ${compact.expected.sourceUrl} sha256=${compact.actual} rows=${parsedCompact.records.length}`,
  `- Snapshots verified against source-retrieval-manifest.json: yes (immutable, not redownloaded)`,
  `- Equity candidates: ${manifest.equityCandidates}; QUALIFIED: ${manifest.qualified}; registry size: ${registry.size}`,
  `- Dispositions: ${JSON.stringify(manifest.counts)}`,
  `- Reconciliation (equity): ${JSON.stringify(recon)}`,
  `- Coverage by exchange:series: ${JSON.stringify(manifest.coverageByExchangeSeries)}`,
  '',
  'Static instrument-master evidence only: no live quote qualification, no production readiness claim.',
].join('\n');
writeFileSync(join(outDir, 'qualification-report.md'), lines + '\n');
writeFileSync(
  join(outDir, 'source-reconciliation-report.md'),
  [
    '# DHAN-P7 Source Reconciliation Report',
    '',
    `- Detailed vs compact join key: EXCH_ID/SEM_EXM_EXCH_ID + SEGMENT/SEM_SEGMENT + SECURITY_ID/SEM_SMST_SECURITY_ID (provider scope; IDs are not globally unique).`,
    `- Equity-candidate reconciliation: ${JSON.stringify(recon)}`,
    `- Category counts: ${JSON.stringify(byCategory)}`,
    `- Compact master carries no ISIN; ISIN exists only in the detailed master.`,
  ].join('\n') + '\n',
);

console.log(JSON.stringify({
  commit,
  detailedRows: manifest.totalRows,
  compactRows: parsedCompact.records.length,
  equityCandidates: manifest.equityCandidates,
  qualified: manifest.qualified,
  registrySize: registry.size,
  counts: manifest.counts,
  reconciliation: recon,
}, null, 2));
