/**
 * D05 Wave-3 EQ — published consolidated evidence (2026-11-08) conformance guards.
 * Pins publication identity, the rejection verdict, the hardened validator behaviour
 * at byte level and the historical pins. Documentation + hash checks only.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const NEW_ZIP = 'evidence/D05-Wave3/arena_D05_evidence.zip';
const RECORD = 'evidence/cross-repository/IIPS_V3_D05_WAVE3_EQ_EVIDENCE_RECONCILIATION_2026-11-08.md';
const CORPUS = 'evidence/operator_drop/d05_security_master_broad_universe.json';
const RUNTIME_ASSET = 'src/identity/d05_broad_universe_data.ts';
const RESOLVER = 'src/identity/broker_observation_resolver.ts';
const READINESS = 'src/audit/source_readiness.ts';

const repo = (p: string): string => {
  const full = resolve(process.cwd(), p);
  assert.ok(existsSync(full), `expected ${p}`);
  return readFileSync(full, 'utf8');
};
const sha256 = (p: string): string =>
  createHash('sha256').update(readFileSync(resolve(process.cwd(), p))).digest('hex');

describe('D05 Wave-3 EQ consolidated evidence (2026-11-08) — conformance', () => {
  it('publication zip hash matches the PA-published record exactly; bytes untouched by validation', () => {
    assert.equal(sha256(NEW_ZIP), 'c86230451ec35f6fd5aa91d20a31db9de7f38e109ea3afedb9ceffaecc1014ee');
  });

  it('convergence report records DEPOSITION_BLOCKED with the exact blocking reasons', () => {
    const doc = repo(RECORD);
    assert.match(doc, /DEPOSITION_BLOCKED/);
    assert.match(doc, /34 of 2390 NSE securities have no MCA linkage/);
    assert.match(doc, /94 of 2390 NSE securities have no BSE listing match/);
    assert.match(doc, /c86230451ec35f6fd5aa91d20a31db9de7f38e109ea3afedb9ceffaecc1014ee/);
    assert.match(doc, /UNLISTED-BSE/);
    assert.match(doc, /L17110MH1973PLC019786/); // genuine prior CIN kept as evidence
    assert.match(doc, /L85110KA1981PLC013115/);
    assert.match(doc, /543583/);               // AWL scrip preserved
  });

  it('report distinguishes structural / identity / regulatory / authenticity / governed acceptance', () => {
    const doc = repo(RECORD);
    for (const lens of ['Structural completeness', 'Identity correctness', 'Regulatory correctness', 'Source authenticity', 'Governed acceptance']) {
      assert.match(doc, new RegExp(lens));
    }
  });

  it('hardened validator enforces 6-digit BSE scrip codes and refuses placeholders', () => {
    const src = repo(READINESS);
    assert.match(src, /SCRIP_CODE_BSE_REGEX = \/\^\[0-9\]\{6\}\$\//);
    assert.match(src, /placeholders are not identity claims/);
  });

  it('execution-stage fail-closed protection binds the 2026-11-08 authenticated universe (recordCount === 2390 hard guard, authenticated act reference)', () => {
    assert.match(repo(RESOLVER), /recordCount\s*!==\s*2390/);
    assert.match(repo(RESOLVER), /AUTH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-ACT-2026-11-08-001/);
    assert.ok(!/recordCount\s*!==\s*2250/.test(repo(RESOLVER)), 'Wave-1 execution guard must not gate broker observations');
  });

  it('Wave-1 as-deposited pins unchanged by this pass (Wave-1 corpus and its runtime asset are immutable evidence)', () => {
    assert.equal(sha256(CORPUS), '7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5');
    assert.equal(sha256(RUNTIME_ASSET), '6810c28e548cf37d3efd7f06a9488cc23aca7ba05fdc06085b33870dd83a24d5');
  });
});
