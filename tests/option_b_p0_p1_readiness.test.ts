/**
 * Option B post-merge P0/P1 readiness — conformance guards (2026-11-07).
 *
 * Pins the post-merge execution record and the tick-regime correction so the two
 * cannot silently drift: if a future PR rewrites the record, reverts the union tick
 * set, or mutates a pinned artifact, these guards fail loudly.
 *
 * Documentation + pure-validation checks only. Mutates nothing.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

import { TICK_SIZE_BANDS, isTickSizeBand } from '../src/audit/source_readiness.js';

const RECORD = 'evidence/cross-repository/IIPS_V3_D05_WAVE3_P0P1_EXECUTION_RECORD_2026-11-07.md';
const PLAN = 'evidence/cross-repository/IIPS_V3_D05_WAVE3_OPTION_B_GOVERNED_REPLACEMENT_PLAN_2026-11-07.md';
const CORPUS = 'evidence/operator_drop/d05_security_master_broad_universe.json';
const RUNTIME_ASSET = 'src/identity/d05_broad_universe_data.ts';

function repo(relativePath: string): string {
  const full = resolve(process.cwd(), relativePath);
  assert.ok(existsSync(full), `expected ${relativePath} in the repository root`);
  return readFileSync(full, 'utf8');
}

function sha256(relativePath: string): string {
  return createHash('sha256').update(readFileSync(resolve(process.cwd(), relativePath))).digest('hex');
}

describe('D05 Option B post-merge P0/P1 execution record — conformance', () => {
  it('record exists, is dated, names the merged PR / merge commit / RED merged-main CI honestly', () => {
    const doc = repo(RECORD);
    assert.match(doc, /Post-Merge P0\/P1 Execution Record/);
    assert.match(doc, /2026-11-07/);
    assert.match(doc, /PR #136/);
    assert.match(doc, /bb7e103ef3dd47177d8144c386b915c8a09d849a/);
    assert.match(doc, /42346287726/);
    assert.match(doc, /1141\/1143/);
    assert.match(doc, /RED/);
  });

  it('record reaffirms the disposition constants: 2,198 excluded and 52 individually revalidated', () => {
    const doc = repo(RECORD);
    assert.match(doc, /2,198/);
    assert.match(doc, /52/);
    assert.match(doc, /never auto-authenticated|never auto-admitted/i);
    assert.match(doc, /fail.closed/i);
  });

  it('record re-verifies every Wave-1/2/3 pin and the runtime asset at bb7e103', () => {
    const doc = repo(RECORD);
    for (const pin of ['7f53540b', '063288b3', '21a6b473', '2186087c', 'a7cff9c6', '93c92ec4', '6810c28e']) {
      assert.ok(doc.includes(pin), `record must carry pin ${pin}`);
    }
  });

  it('live corpus and runtime identity asset are byte-unchanged (Wave-1/2 untouched)', () => {
    assert.equal(sha256(CORPUS), '7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5');
    assert.equal(sha256(RUNTIME_ASSET), '6810c28e548cf37d3efd7f06a9488cc23aca7ba05fdc06085b33870dd83a24d5');
  });

  it('record names acquisition locators and the external-operator boundary — no bytes committed', () => {
    const doc = repo(RECORD);
    assert.match(doc, /nsearchives\.nseindia\.com\/content\/equities\/EQUITY_L\.csv/);
    assert.match(doc, /List_Scrips\.html/);
    assert.match(doc, /mca\.gov\.in/);
    assert.match(doc, /acquisition-attempt-log\.json/);
    assert.match(doc, /DEPOSITION_READY/);
    assert.match(doc, /custody/i);
    assert.doesNotMatch(doc, /we have downloaded|has been acquired|copied from nseindia/i);
  });

  it('record contains explicit non-claims and non-goals', () => {
    const doc = repo(RECORD);
    assert.match(doc, /[Nn]othing (deposited|was deposited)|No universe is deposited/);
    assert.match(doc, /IRR/);
    assert.match(doc, /Rollback/);
  });

  it('plan carries Amendment A-1 (append-only tick-regime correction) referencing this record', () => {
    const plan = repo(PLAN);
    assert.match(plan, /Amendment A-1 \(2026-11-07/);
    assert.match(plan, /price-linked ticks/);
    assert.match(plan, /IIPS_V3_D05_WAVE3_P0P1_EXECUTION_RECORD_2026-11-07\.md/);
  });

  it('tick-size validator accepts the union of the pre-2024 and price-linked CM regimes', () => {
    assert.equal(TICK_SIZE_BANDS.length, 7);
    for (const t of [0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 5.0]) {
      assert.ok(isTickSizeBand(t), `expected ${t} to be accepted`);
    }
    for (const t of [0.07, 0.2, 0.3, 0.02, 0, -0.05, 2.5]) {
      assert.equal(isTickSizeBand(t), false, `expected ${t} to be rejected`);
    }
  });
});
