#!/usr/bin/env node
/**
 * DHAN-W27 mapping-expansion operator runner (offline, deterministic).
 *
 *   npm run dhan:w27-expand             write evidence/dhan-w27/expansion-manifest.json
 *                                       and evidence/dhan-w27/expansion-report.md
 *   npm run dhan:w27-expand -- --check  recompute in memory and compare with the
 *                                       committed artifacts; exit 1 on any drift
 *                                       (byte-identical rerun proof)
 *
 * WHAT IT READS
 *   The RETAINED repository snapshots under evidence/dhan-p7/source/. It never
 *   downloads, never calls Dhan, needs no credentials, and has no code path that
 *   fetches a URL. The SHA-256 of each file is computed here from the exact bytes
 *   parsed and must equal the published retrieval manifest; a mismatch aborts.
 *
 * WHAT IT WRITES
 *   Only the two artifacts above. It does NOT touch
 *   evidence/dhan-p7/qualification-manifest.json: the qualified registry is not
 *   this pipeline's to change, and promotion of a proposal is W-14 work.
 *
 * EXIT CODES
 *   0  manifest written (or, with --check, committed artifacts match a fresh run)
 *   1  drift detected, or an input is missing / fails its provenance check
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { parseInstrumentMasterCsv, COMPACT_REQUIRED_COLUMNS } from '../dist/src/providers/dhan/dhan_instrument_master_parser.js';
import { buildMappingExpansionManifest, renderMappingExpansionReport } from '../dist/src/providers/dhan/dhan_mapping_expansion.js';
import { loadGovernedP7InstrumentRegistry } from '../dist/src/providers/dhan/dhan_local_daemon.js';
import { getGovernedBroadSecurityMaster } from '../dist/src/identity/governed_fixture_master.js';

const checkMode = process.argv.includes('--check');
const p7Dir = resolve(process.cwd(), 'evidence/dhan-p7');
const srcDir = join(p7Dir, 'source');
const outDir = resolve(process.cwd(), 'evidence/dhan-w27');

/** Reports the exact missing input rather than substituting anything. */
function requireFile(path, label) {
  if (!existsSync(path)) {
    console.error(`[w27] MISSING INPUT: ${label} not found at ${path}`);
    console.error('[w27] No download is attempted by design. Place the repository-held snapshot and rerun.');
    process.exit(1);
  }
  return readFileSync(path);
}

const retrievalManifestPath = join(p7Dir, 'source-retrieval-manifest.json');
const retrievalManifest = JSON.parse(requireFile(retrievalManifestPath, 'P7 source retrieval manifest').toString('utf8').replace(/^\uFEFF/, ''));

function loadVerified(filename) {
  const expected = retrievalManifest.files.find((f) => f.filename === filename);
  if (!expected) {
    console.error(`[w27] MISSING INPUT: no provenance entry for '${filename}' in source-retrieval-manifest.json`);
    process.exit(1);
  }
  const bytes = requireFile(join(srcDir, filename), `retained snapshot '${filename}'`);
  const actual = createHash('sha256').update(bytes).digest('hex').toUpperCase();
  if (actual !== String(expected.sha256).toUpperCase()) {
    console.error(`[w27] PROVENANCE FAILURE for ${filename}: retrieval manifest ${expected.sha256} != actual ${actual}`);
    process.exit(1);
  }
  return {
    filename,
    sourceUrl: expected.sourceUrl,
    retrievedAtUtc: expected.retrievedAtUtc,
    sha256: actual.toLowerCase(),
    sizeBytes: bytes.length,
    text: bytes.toString('utf8'),
  };
}

const detailed = loadVerified('api-scrip-master-detailed.csv');
const compact = loadVerified('api-scrip-master.csv');

// The compact master must parse under its own observed schema; it carries no ISIN
// and is used for reconciliation evidence only, never as a mapping source.
const compactParsed = parseInstrumentMasterCsv(compact.text, COMPACT_REQUIRED_COLUMNS);
if (compactParsed.schemaError) {
  console.error(`[w27] compact snapshot failed its schema check: ${compactParsed.schemaError}`);
  process.exit(1);
}

const securityMaster = getGovernedBroadSecurityMaster();
const p04SourceRevision = securityMaster.sourceRevision;
if (
  !p04SourceRevision ||
  typeof p04SourceRevision.batchId !== 'string' ||
  typeof p04SourceRevision.fileChecksumSha256 !== 'string' ||
  typeof p04SourceRevision.recordCount !== 'number'
) {
  console.error('[w27] the P04 master carries no governed source revision; refusing to evidence an expansion against an unnamed master');
  process.exit(1);
}

// Baseline = exactly what the runtime daemon loads today (QUALIFIED rows only).
const baselineRegistry = loadGovernedP7InstrumentRegistry();
const baselineMappings = baselineRegistry.list();

const manifest = buildMappingExpansionManifest({
  snapshot: detailed,
  reconciliationSnapshot: compact,
  securityMaster,
  baselineMappings,
  baselineSource: 'loadGovernedP7InstrumentRegistry() — evidence/dhan-p7/qualification-manifest.json, QUALIFIED rows only',
  p04SourceRevision: {
    batchId: p04SourceRevision.batchId,
    fileChecksumSha256: p04SourceRevision.fileChecksumSha256,
    recordCount: p04SourceRevision.recordCount,
  },
});

if (!manifest.reconciliation.reconciles) {
  console.error(`[w27] DISPOSITION RECONCILIATION FAILURE: ${JSON.stringify(manifest.reconciliation)}`);
  process.exit(1);
}

const manifestText = JSON.stringify(manifest, null, 2) + '\n';
const reportText = renderMappingExpansionReport(manifest);

if (checkMode) {
  const manifestPath = join(outDir, 'expansion-manifest.json');
  const reportPath = join(outDir, 'expansion-report.md');
  const problems = [];
  if (!existsSync(manifestPath)) problems.push(`${manifestPath} is absent`);
  else if (readFileSync(manifestPath, 'utf8') !== manifestText) problems.push(`${manifestPath} differs from a fresh run`);
  if (!existsSync(reportPath)) problems.push(`${reportPath} is absent`);
  else if (readFileSync(reportPath, 'utf8') !== reportText) problems.push(`${reportPath} differs from a fresh run`);
  if (problems.length > 0) {
    console.error('[w27] DETERMINISM CHECK FAILED:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log('[w27] determinism check passed: committed artifacts are byte-identical to a fresh run');
} else {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'expansion-manifest.json'), manifestText);
  writeFileSync(join(outDir, 'expansion-report.md'), reportText);
  console.log(`[w27] wrote ${join(outDir, 'expansion-manifest.json')}`);
  console.log(`[w27] wrote ${join(outDir, 'expansion-report.md')}`);
}

const sha = createHash('sha256').update(manifestText).digest('hex');
console.log(
  JSON.stringify(
    {
      inputs: manifest.inputs.map((i) => ({ file: i.filename, rows: i.dataRows, sha256: i.sha256 })),
      counts: manifest.counts,
      coverage: {
        qualifiedBefore: manifest.coverage.qualifiedBefore,
        potentialGain: manifest.coverage.potentialGain,
      },
      unmappedByReason: manifest.unmappedByReason.map((u) => `${u.reasonCode}=${u.rows}`),
      manifestSha256: sha,
    },
    null,
    2,
  ),
);
