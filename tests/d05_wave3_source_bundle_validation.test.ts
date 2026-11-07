/**
 * D05 Wave-3 EQ bundle validation — conformance guards (2026-11-07).
 *
 * Pins the validation record, the bundle archive hash and the historical pins so the
 * readiness verdict (DEPOSITION_BLOCKED) cannot silently drift to a false claim.
 * Documentation + hash checks only. Mutates nothing.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const RECORD = 'evidence/cross-repository/IIPS_V3_D05_WAVE3_EQ_SOURCE_VALIDATION_2026-11-07.md';
const BUNDLE = 'evidence/D05-Wave3/D05_Wave3_EQ_Source_and_Evidence_Bundle_2026-11-07.zip';
const CORPUS = 'evidence/operator_drop/d05_security_master_broad_universe.json';
const RUNTIME_ASSET = 'src/identity/d05_broad_universe_data.ts';
const ACQ_PS1 = 'scripts/acquisition/Acquire-D05-Sources.ps1';

const repo = (p: string): string => {
  const full = resolve(process.cwd(), p);
  assert.ok(existsSync(full), `expected ${p}`);
  return readFileSync(full, 'utf8');
};
const sha256 = (p: string): string =>
  createHash('sha256').update(readFileSync(resolve(process.cwd(), p))).digest('hex');

describe('D05 Wave-3 EQ bundle validation — conformance', () => {
  it('bundle archive hash matches the publication record; bundle bytes untouched by validation', () => {
    assert.equal(sha256(BUNDLE).toUpperCase(), '6332B050132A160E89E5906D131E12535AC1105D4B781330FA63F0E0AF1D41F4');
  });

  it('record states DEPOSITION_BLOCKED with exactly the two genuine external blockers', () => {
    const doc = repo(RECORD);
    assert.match(doc, /DEPOSITION_BLOCKED/);
    assert.match(doc, /100 of 2390 NSE securities have no BSE listing match/);
    assert.match(doc, /94 of 2390 NSE securities have no MCA linkage/);
    assert.match(doc, /2,390/);
    assert.match(doc, /2,296/);
    assert.match(doc, /64\.1%|1,532/);
    assert.match(doc, /d3853a0dc66a218836a5ee5bc7a3ac397f1c4a0963f44a880b9fccf9e92e440c/);
  });

  it('record carries tick-evidence route outcomes (rules SOURCE_PROVIDED / uniform act-bound)', () => {
    const doc = repo(RECORD);
    assert.match(doc, /d94c5646/);
    assert.match(doc, /SOURCE_PROVIDED/);
    assert.match(doc, /DERIVED/);
    assert.match(doc, /deviation notice/i);
  });

  it('record explicitly forbids deposition and lists the external blockers with owners', () => {
    const doc = repo(RECORD);
    assert.match(doc, /NOT READY|NOT deposition-ready/i);
    assert.match(doc, /B1/);
    assert.match(doc, /B5/);
    assert.match(doc, /Jain Irrigation/);
  });

  it('corrected acquisition tool asks only for implementation-required inputs', () => {
    const ps1 = repo(ACQ_PS1);
    assert.match(ps1, /TAXONOMY/);
    assert.doesNotMatch(ps1, /ISIN_INDUSTRY_MAPPING/);
    assert.doesNotMatch(ps1, /NSE_INDICES_TAXONOMY/);
    assert.match(ps1, /SINGLE taxonomy CSV/i);
  });

  it('pinned corpus and runtime identity asset are byte-unchanged', () => {
    assert.equal(sha256(CORPUS), '7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5');
    assert.equal(sha256(RUNTIME_ASSET), '6810c28e548cf37d3efd7f06a9488cc23aca7ba05fdc06085b33870dd83a24d5');
  });
});
