#!/usr/bin/env node
/**
 * Governed D05 corpus audit CLI (read-only).
 *
 * Reads: the deposit corpus (default evidence/operator_drop/d05_security_master_broad_universe.json)
 * Writes: ONLY <output-dir>/corpus-audit.{json,csv,md} (default audits/d05-corpus/)
 *
 * Exit codes: 0 = audit produced; 2 = usage/input error; 3 = corpus unreadable.
 * NOTE: findings do NOT fail the CLI. Publication remains a governed decision.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditCorpus, reportToJson, reportToCsv, reportToMarkdown } from '../dist/src/audit/d05_corpus_audit.js';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : undefined;
}
function fail(code, msg) { process.stderr.write(`d05_corpus_audit: ${msg}\n`); process.exit(code); }

const corpusRel = argValue('--corpus') ?? 'evidence/operator_drop/d05_security_master_broad_universe.json';
const outDirRel = argValue('--output-dir') ?? 'audits/d05-corpus';
const corpusPath = resolve(repoRoot, corpusRel);
const outDir = resolve(repoRoot, outDirRel);

/* Refuse to write into governed source-data areas. */
const forbiddenRoots = [resolve(repoRoot, 'evidence'), resolve(repoRoot, 'src'), resolve(repoRoot, 'tests'), resolve(repoRoot, 'docs')];
for (const bad of forbiddenRoots) {
  if (outDir === bad || outDir.startsWith(bad + sep)) {
    fail(2, `--output-dir must not be inside ${bad}`);
  }
}

let rawBytes;
try { rawBytes = readFileSync(corpusPath); }
catch (err) { fail(3, `corpus unreadable at ${corpusPath}: ${err.message}`); }
const corpusSha256 = createHash('sha256').update(rawBytes).digest('hex');

let parsed;
try { parsed = JSON.parse(rawBytes.toString('utf8')); }
catch (err) { fail(3, `corpus is not valid JSON: ${err.message}`); }
const records = Array.isArray(parsed) ? parsed : parsed?.records;
if (!Array.isArray(records)) fail(3, 'corpus JSON must be an array or an object with a "records" array');

/* Evidence references: hash what is present, record present:false otherwise. Never throws. */
const evidenceCandidates = [
  { ref: 'WAVE1-BROAD-UNIVERSE-MANIFEST', path: 'evidence/operator_drop/d05_security_master_manifest.json', note: 'Wave-1 OFFLINE_BOOTSTRAP deposition act' },
  { ref: 'WAVE2-DISPOSITION-MANIFEST', path: 'evidence/operator_drop/d05_security_master_wave2_disposition_manifest.json', note: 'Wave-2 disposition manifest' },
  { ref: 'WAVE2-DISPOSITION-2026-11-06', path: 'evidence/operator_drop/wave2-2026-11-06/disposition-2026-11-06.json', note: 'Wave-2 disposition record' },
  { ref: 'WAVE3-ACQUISITION-ATTEMPT-LOG', path: 'evidence/operator_drop/wave3-2026-11-06/acquisition-attempt-log.json', note: 'Wave-3 acquisition attempt log (blocked, 2026-11-06)' },
  { ref: 'WAVE3-DEPOSITION-RECEIPT', path: 'evidence/cross-repository/IIPS_V3_D05_WAVE3_UNIVERSE_EXPANSION_RECEIPT_2026-11-06.md', note: 'Wave-3 universe expansion receipt (blocked)' },
  { ref: 'BROWSER-RUNTIME-HYDRATION-REPORT', path: 'evidence/operator_drop/d05_browser_runtime_hydration_report.json', note: 'browser runtime hydration report' },
];
const evidenceRefs = evidenceCandidates.map(({ ref, path, note }) => {
  const p = resolve(repoRoot, path);
  try {
    const st = statSync(p);
    if (!st.isFile()) return { ref, path, sha256: null, present: false, note: `${note} (present but not a file)` };
    const sha256 = createHash('sha256').update(readFileSync(p)).digest('hex');
    return { ref, path, sha256, present: true, note };
  } catch {
    return { ref, path, sha256: null, present: false, note: `${note} (absent)` };
  }
});

const report = auditCorpus(records, { path: corpusRel.replace(/\\/g, '/'), corpusSha256, evidenceRefs });

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'corpus-audit.json'), reportToJson(report));
writeFileSync(resolve(outDir, 'corpus-audit.csv'), reportToCsv(report));
writeFileSync(resolve(outDir, 'corpus-audit.md'), reportToMarkdown(report));

const c = report.counts;
process.stdout.write(`d05_corpus_audit: records=${c.records} critical=${c.criticalFindings} warning=${c.warningFindings} info=${c.infoFindings} markers=${report.originPolicy.markerCount} markerFree=${report.originPolicy.markerFreeCount}\n`);
process.stdout.write(`d05_corpus_audit: outputs written to ${outDir}\n`);
