#!/usr/bin/env node
/**
 * Governed authoritative-source readiness CLI (read-only).
 *
 * Validates LOCALLY supplied files (no downloads, no mirrors-as-truth):
 *   --nse <file.csv> --bse <file.csv> --mca <file.csv> --taxonomy <file.csv>
 *   [--tick-rules <isin,tickSize CSV>]   per-ISIN tick bands (0.01|0.05|0.10|0.25|0.50|1.00|5.00 incl. price-linked regimes) for the act-governed universe
 *   [--tick-size-uniform <0.01|0.05|0.10|0.25|0.50|1.00|5.00>]  uniform value explicitly bound in the Wave-3 act
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

const report = evaluateSourceReadiness(inputs);

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'source-readiness.json'), readinessToJson(report));
writeFileSync(resolve(outDir, 'source-readiness.csv'), readinessToCsv(report));
writeFileSync(resolve(outDir, 'source-readiness.md'), readinessToMarkdown(report));

process.stdout.write(`source_readiness: verdict=${report.verdict} unionIsins=${report.crossSource.unionIsins} conflicts=${report.crossSource.conflicts.length} blockingReasons=${report.blockingReasons.length} tickMode=${report.tickSizeEvidence.mode}\n`);
process.stdout.write(`source_readiness: outputs written to ${outDir}\n`);
process.exit(report.verdict === 'DEPOSITION_READY' ? 0 : 4);
