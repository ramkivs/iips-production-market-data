#!/usr/bin/env node
/**
 * Governed authoritative-source readiness CLI (read-only).
 *
 * Validates LOCALLY supplied files (no downloads, no mirrors-as-truth):
 *   --nse <file.csv> --bse <file.csv> --mca <file.csv> --taxonomy <file.csv>
 *   [--tick-rules <isin,tickSize CSV>]   per-ISIN tick bands (0.01|0.05|0.10|0.25|0.50|1.00|5.00 incl. price-linked regimes) for the act-governed universe
 *   [--tick-size-uniform <0.01|0.05|0.10|0.25|0.50|1.00|5.00>]  uniform value explicitly bound in the Wave-3 act
 *   [--pa-decisions <pa_decisions.json>]  act-bound governed exceptions (2026-11-08 directive):
 *       {"authorizationRef":"...","effectiveDate":"YYYY-MM-DD",
 *        "bseExclusionIsins":[...],"mcaExemptionIsins":[...],"mcaAliasIsins":[...],
 *        "mcaUnlinkedRescindedIsins":[...],"faceValueSource":"NSE_LISTING_MASTER"}
 * Writes: ONLY <output-dir>/source-readiness.{json,csv,md} (default audits/source-readiness/)
 *
 * Exit codes: 0 = DEPOSITION_READY; 4 = DEPOSITION_BLOCKED; 2 = usage error; 3 = input read error.
 * This tool never modifies any deposit, manifest or corpus.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateSourceReadiness, readinessToJson, readinessToCsv, readinessToMarkdown } from '../dist/src/audit/source_readiness.js';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : undefined;
}
function fail(code, msg) { process.stderr.write(`source_readiness: ${msg}\n`); process.exit(code); }

const outDirRel = argValue('--output-dir') ?? 'audits/source-readiness';
const outDir = resolve(repoRoot, outDirRel);
const forbiddenRoots = [resolve(repoRoot, 'evidence'), resolve(repoRoot, 'src'), resolve(repoRoot, 'tests'), resolve(repoRoot, 'docs')];
for (const bad of forbiddenRoots) {
  if (outDir === bad || outDir.startsWith(bad + sep)) {
    fail(2, `--output-dir must not be inside ${bad}`);
  }
}

const TICK_BANDS = [0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 5.0];
const tickRulesArg = argValue('--tick-rules');
const uniformArg = argValue('--tick-size-uniform');
const paArg = argValue('--pa-decisions');

const KEYS = ['nse', 'bse', 'mca', 'taxonomy'];
const inputs = {};
for (const key of KEYS) {
  const v = argValue(`--${key}`);
  if (!v) continue;
  const p = resolve(process.cwd(), v);
  let st;
  try { st = statSync(p); } catch (err) { fail(3, `${key} source unreadable at ${p}: ${err.message}`); }
  if (!st.isFile()) fail(3, `${key} source is not a file: ${p}`);
  let bytes;
  try { bytes = readFileSync(p); } catch (err) { fail(3, `${key} source unreadable at ${p}: ${err.message}`); }
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  inputs[key] = { bytes, path: v.replace(/\\/g, '/'), sha256 };
}

if (tickRulesArg !== undefined) {
  const p = resolve(process.cwd(), tickRulesArg);
  let st;
  try { st = statSync(p); } catch (err) { fail(3, `tick-rules unreadable at ${p}: ${err.message}`); }
  if (!st.isFile()) fail(3, `tick-rules is not a file: ${p}`);
  let bytes;
  try { bytes = readFileSync(p); } catch (err) { fail(3, `tick-rules unreadable at ${p}: ${err.message}`); }
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  inputs.tickRules = { bytes, path: tickRulesArg.replace(/\\/g, '/'), sha256 };
}

if (uniformArg !== undefined) {
  const v = Number(uniformArg);
  if (!Number.isFinite(v) || !TICK_BANDS.some((b) => Math.abs(b - v) < 1e-9)) {
    fail(2, `--tick-size-uniform must be one of 0.01, 0.05, 0.10, 0.25, 0.50, 1.00, 5.00 (got: ${uniformArg})`);
  }
  inputs.tickSizeUniform = TICK_BANDS.find((b) => Math.abs(b - v) < 1e-9);
}

if (paArg !== undefined) {
  const p = resolve(process.cwd(), paArg);
  let st;
  try { st = statSync(p); } catch (err) { fail(3, `pa-decisions unreadable at ${p}: ${err.message}`); }
  if (!st.isFile()) fail(3, `pa-decisions is not a file: ${p}`);
  let parsed;
  try { parsed = JSON.parse(readFileSync(p, 'utf8')); } catch (err) { fail(2, `pa-decisions is not valid JSON: ${err.message}`); }
  const need = ['authorizationRef', 'effectiveDate', 'faceValueSource'];
  for (const k of need) if (typeof parsed[k] !== 'string' || parsed[k].length === 0) fail(2, `pa-decisions: missing/invalid '${k}'`);
  if (parsed.faceValueSource !== 'NSE_LISTING_MASTER') fail(2, `pa-decisions: faceValueSource must be 'NSE_LISTING_MASTER'`);
  const isIsin = (s) => /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(s);
  const lists = ['bseExclusionIsins', 'mcaExemptionIsins', 'mcaAliasIsins', 'mcaUnlinkedRescindedIsins'];
  const clean = {};
  const seen = new Map();
  for (const k of lists) {
    const arr = parsed[k];
    if (!Array.isArray(arr)) fail(2, `pa-decisions: '${k}' must be an array`);
    const out = [];
    const dup = new Set();
    for (const v of arr) {
      if (typeof v !== 'string' || !isIsin(v)) fail(2, `pa-decisions: '${k}' contains a non-ISIN value: ${JSON.stringify(v)}`);
      if (out.includes(v)) dup.add(v);
      out.push(v);
    }
    if (dup.size) fail(2, `pa-decisions: '${k}' contains duplicate ISIN(s): ${[...dup].join(', ')}`);
    clean[k] = out;
  }
  /* Cross-field overlaps are legal (independent facts on one record) but must be visible in the echo. */
  const overlaps = [];
  const cross = (a, b) => { const bs = new Set(clean[b]); for (const v of clean[a]) if (bs.has(v)) overlaps.push({ isin: v, bse: a, mca: b }); };
  for (const b of lists.filter((x) => x.startsWith('bse'))) {
    for (const m of lists.filter((x) => x.startsWith('mca'))) cross(b, m);
  }
  const seenMca = new Map();
  for (const m of lists.filter((x) => x.startsWith('mca'))) {
    for (const v of clean[m]) {
      if (seenMca.has(v)) fail(2, `pa-decisions: ISIN ${v} appears in both '${seenMca.get(v)}' and '${m}' — an MCA record cannot carry two MCA governed dispositions`);
      seenMca.set(v, m);
    }
  }
  if (overlaps.length) process.stderr.write(`pa-decisions: note — ${overlaps.length} ISIN(s) carry dispositions for both BSE and MCA fields (legal; independent facts)\n`);
  inputs.paDecisions = {
    authorizationRef: parsed.authorizationRef,
    effectiveDate: parsed.effectiveDate,
    faceValueSource: parsed.faceValueSource,
    ...clean,
  };
}

const report = evaluateSourceReadiness(inputs);

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'source-readiness.json'), readinessToJson(report));
writeFileSync(resolve(outDir, 'source-readiness.csv'), readinessToCsv(report));
writeFileSync(resolve(outDir, 'source-readiness.md'), readinessToMarkdown(report));

process.stdout.write(`source_readiness: verdict=${report.verdict} unionIsins=${report.crossSource.unionIsins} conflicts=${report.crossSource.conflicts.length} blockingReasons=${report.blockingReasons.length} tickMode=${report.tickSizeEvidence.mode}\n`);
process.stdout.write(`source_readiness: outputs written to ${outDir}\n`);
process.exit(report.verdict === 'DEPOSITION_READY' ? 0 : 4);
