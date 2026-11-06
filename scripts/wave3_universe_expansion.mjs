#!/usr/bin/env node
/**
 * D05 Wave-3 universe expansion — offline conformance gate CLI (validation only).
 *
 * Governs the operator-deposition step for a FUTURE, separately-authorized Wave-3
 * re-deposition. This tool:
 *   - binds the candidate input file to a caller-supplied SHA-256 (fail-closed);
 *   - runs the existing identity eligibility rules (no weakening, no fabrication);
 *   - emits a vetting report ALWAYS;
 *   - emits deposition artifacts (merged corpus JSON, new manifest, runtime TS asset)
 *     ONLY into --output-dir, and ONLY when at least one record is ADDED;
 *   - NEVER writes into the repository's governed paths (evidence/, src/) itself —
 *     deposition into the repo is a separate governed act reviewed in its own PR.
 *   - exits 3 without emitting deposition artifacts when nothing would be added.
 *
 * Usage:
 *   node scripts/wave3_universe_expansion.mjs
 *     --candidate <path>            candidate records: JSON array | {entities|records:[...]}
 *     --act <authorizationRef>      e.g. AUTH-D05-WAVE3-UNIVERSE-EXPANSION-...
 *     --source-sha256 <hex64>       MUST equal the sha256 of --candidate bytes
 *     --source-description <text>   provenance, e.g. "NSE EQUITY_L export 2026-11-08, owner-verified"
 *     --batch-id <id>               batch id for the would-be manifest
 *     --output-dir <path>           artifacts destination (fresh dir; --force to reuse)
 *     [--prior-corpus <path>]       default: evidence/operator_drop/d05_security_master_broad_universe.json
 *     [--scope-isins <path>]        optional JSON array of ISINs to coverage-report (e.g. the 67)
 *     [--expected-prior-checksum <hex64>]  hard pin: prior corpus bytes must equal this
 *     [--force]                     allow writing into a non-empty output dir
 *
 * Exit codes: 0 emitted deposition artifacts (ADDED>0) · 2 usage/precondition failure ·
 *             3 nothing eligible (zero deposition by policy — no artifacts beyond the report)
 */
import nodeCrypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Map();
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i];
  if (!k.startsWith('--')) die(2, `unexpected argument: ${k}`);
  const key = k.slice(2);
  const takeValue = () => {
    const v = process.argv[++i];
    if (v === undefined || v.startsWith('--')) die(2, `missing value for --${key}`);
    return v;
  };
  if (key === 'force') args.set(key, true);
  else args.set(key, takeValue());
}

function die(code, msg) {
  process.stderr.write(`[wave3] ${msg}\n`);
  process.exit(code);
}
const sha256File = (p) => nodeCrypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const candidatePath = args.get('candidate');
const act = args.get('act');
const sourceSha = args.get('source-sha256');
const sourceDescription = args.get('source-description');
const batchId = args.get('batch-id');
const outputDir = args.get('output-dir');
const priorCorpusPath = args.get('prior-corpus') ?? path.join(ROOT, 'evidence/operator_drop/d05_security_master_broad_universe.json');
const scopeIsinsPath = args.get('scope-isins');
const expectedPriorChecksum = args.get('expected-prior-checksum');
const force = args.get('force') === true;

if (!candidatePath || !act || !sourceSha || !sourceDescription || !batchId || !outputDir) {
  die(2, 'required: --candidate --act --source-sha256 --source-description --batch-id --output-dir (see header)');
}
if (!/^[0-9a-f]{64}$/.test(sourceSha)) die(2, '--source-sha256 must be 64 lowercase hex');

const candidateBytes = fs.readFileSync(path.resolve(candidatePath));
const candidateSha = nodeCrypto.createHash('sha256').update(candidateBytes).digest('hex');
if (candidateSha !== sourceSha) {
  die(2, `source binding failed: sha256(--candidate)=${candidateSha} != --source-sha256=${sourceSha}`);
}
let candidateDoc;
try { candidateDoc = JSON.parse(candidateBytes.toString('utf8')); } catch (e) { die(2, `candidate is not JSON: ${e.message}`); }
const candidateArray = Array.isArray(candidateDoc)
  ? candidateDoc
  : Array.isArray(candidateDoc?.entities) ? candidateDoc.entities
  : Array.isArray(candidateDoc?.records) ? candidateDoc.records
  : null;
if (!candidateArray) die(2, 'candidate JSON must be an array, or { "entities": [...] } / { "records": [...] }');

const priorCorpusBytes = fs.readFileSync(path.resolve(priorCorpusPath));
const priorCorpusSha = nodeCrypto.createHash('sha256').update(priorCorpusBytes).digest('hex');
if (expectedPriorChecksum && priorCorpusSha !== expectedPriorChecksum) {
  die(2, `prior corpus binding failed: sha256(--prior-corpus)=${priorCorpusSha} != --expected-prior-checksum=${expectedPriorChecksum}`);
}
const priorCorpus = JSON.parse(priorCorpusBytes.toString('utf8'));
if (!Array.isArray(priorCorpus)) die(2, 'prior corpus must be a JSON array');

let scopeIsins;
if (scopeIsinsPath) {
  const s = JSON.parse(fs.readFileSync(path.resolve(scopeIsinsPath), 'utf8'));
  if (!Array.isArray(s) || !s.every((x) => typeof x === 'string')) die(2, '--scope-isins must be a JSON array of ISIN strings');
  scopeIsins = s;
}

if (fs.existsSync(outputDir)) {
  if (!force && fs.readdirSync(outputDir).length > 0) die(2, `output dir not empty (use --force to allow): ${outputDir}`);
} else {
  fs.mkdirSync(outputDir, { recursive: true });
}

const gatePath = path.join(ROOT, 'dist/src/identity/universe_expansion_gate.js');
if (!fs.existsSync(gatePath)) die(2, `gate not built — run npm run build:tsc first (missing ${gatePath})`);
const { evaluateWave3Expansion, materialiseMergedCorpus, D05_WAVE3_GATE_NAME, D05_WAVE3_GATE_VERSION } = await import(gatePath);

const report = evaluateWave3Expansion(priorCorpus, candidateArray, { scopeIsins });
const generatedAt = new Date().toISOString();
const reportDoc = {
  reportVersion: 1,
  generatedAt,
  gate: { name: D05_WAVE3_GATE_NAME, version: D05_WAVE3_GATE_VERSION },
  authorizationRef: act,
  source: { candidateRef: path.basename(candidatePath), sha256: candidateSha, description: sourceDescription },
  prior: { corpusRef: path.basename(priorCorpusPath), sha256: priorCorpusSha, recordCount: priorCorpus.length },
  dispositionSummary: report.counts,
  mergedRecordCount: report.mergedRecordCount,
  newCompanyIds: report.newCompanyIds,
  ...(report.scopeCoverage ? { scopeCoverage: report.scopeCoverage } : {}),
  dispositions: report.dispositions,
};
const reportPath = path.join(outputDir, 'wave3-vetting-report.json');
fs.writeFileSync(reportPath, JSON.stringify(reportDoc, null, 2) + '\n');

if (report.counts.ADDED === 0) {
  process.stderr.write(`[wave3] BLOCKED: 0 records eligible — zero deposition by policy; no deposition artifacts emitted. Vetting report: ${reportPath}\n`);
  process.exit(3);
}

const merged = materialiseMergedCorpus(priorCorpus, candidateArray).entities;
const mergedPayload = JSON.stringify(merged, null, 2) + '\n';
const mergedCorpusPath = path.join(outputDir, 'd05_security_master_broad_universe.json');
fs.writeFileSync(mergedCorpusPath, mergedPayload);
const mergedSha = sha256File(mergedCorpusPath);

const manifestDoc = {
  batchId,
  domain: 'D05_SECURITY_MASTER',
  kind: 'EXPANSION_DEPOSITION',
  fileChecksumSha256: mergedSha,
  recordCount: merged.length,
  droppedAt: generatedAt,
  operatorId: 'OPERATOR_ADMIN_GOVERNED_01',
  authorizationRef: act,
  operatingMode: 'OFFLINE_BOOTSTRAP',
  selectedTier: 'TIER_2_ACTIVE_NSE_CM',
  aiilRuling: 'RULING_3_DUAL_EFFECTIVE_DATED_MAPPING',
  priorManifest: 'evidence/operator_drop/d05_security_master_manifest.json',
  priorRevisionBatchId: 'BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001',
  priorChecksum: '7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5',
  priorRecordCount: priorCorpus.length,
  dispositionCounts: report.counts,
  newCompanyIds: report.newCompanyIds,
  source: {
    candidateRef: path.basename(candidatePath),
    sha256: candidateSha,
    description: sourceDescription,
  },
  claimBoundaries: [
    'REPO_UNCHANGED_BY_TOOL: this tool emits artifacts into its output directory only; the governed repo deposit is a separate reviewed PR',
    'NO_CLASSIFICATION_ASSERTED: deposit authorization is not a REAL/synthetic classification of any record',
    'NO_UNRESOLVED_INCORPORATED: records dispositioned UNRESOLVED are absent from the merged corpus by construction',
    'WAVE1_PRESERVED: prior records retained byte-for-byte and in order; new records appended after sorting by companyId',
  ],
};
const manifestPath = path.join(outputDir, 'd05_security_master_manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifestDoc, null, 2) + '\n');

const tsHeader = `/**
 * Institutional Investment Platform System (IIPS)
 * Governed D05 Broad Universe Canonical Dataset Asset (P04 / P12) — WAVE-3 DEPOSITION ARTIFACT.
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / ${act}
 * Scope: Tier 2 Active NSE CM Equities (${merged.length} canonical entities incl. this expansion)
 * Checksum: ${mergedSha}
 *
 * Browser-safe build-time imported canonical dataset.
 */

import { SecurityMasterEntity } from "./security_master.js";

export const D05_BROAD_UNIVERSE_ENTITIES: ReadonlyArray<SecurityMasterEntity> = `;
fs.writeFileSync(path.join(outputDir, 'd05_broad_universe_data.ts'), tsHeader + mergedPayload.trim() + ';\n');

const verificationDoc = {
  verifiedAt: generatedAt,
  mergedCorpusPath: path.basename(mergedCorpusPath),
  mergedCorpusSha256: mergedSha,
  recordCount: merged.length,
  priorRecordCount: priorCorpus.length,
  netAdditions: report.counts.ADDED,
  dispositions: report.counts,
  manifestPath: path.basename(manifestPath),
};
fs.writeFileSync(path.join(outputDir, 'wave3-verification.json'), JSON.stringify(verificationDoc, null, 2) + '\n');

process.stdout.write(`[wave3] OK — ADDED ${report.counts.ADDED}: merged ${priorCorpus.length}+${report.counts.ADDED}=${merged.length}\n`);
process.stdout.write(`[wave3] merged corpus sha256 ${mergedSha}\n`);
process.stdout.write(`[wave3] artifacts in ${outputDir}: wave3-vetting-report.json, d05_security_master_broad_universe.json, d05_security_master_manifest.json, d05_broad_universe_data.ts, wave3-verification.json\n`);
process.stdout.write(`[wave3] NEXT: file the deposition authorization (new act); land these artifacts via a dedicated PR that ALSO re-pins governed constants and test count pins; verify byte-identity after merge; then reassess the B-04 68 holdings against the NEW revision.\n`);
