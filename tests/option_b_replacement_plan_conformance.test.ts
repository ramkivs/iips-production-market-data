/**
 * Option B replacement plan — documentation conformance guards (2026-11-07).
 *
 * The PA selected Option B (Governed Replacement). This suite pins the *published
 * plan* to the *verified implementation reality*, so neither can silently drift:
 * if a future PR re-pins, re-renders or otherwise alters the Wave-1/legacy surfaces,
 * these guards fail loudly and the plan — not just the code — must move with it.
 *
 * Documentation-only. Reads the repository tree; opens no database, runs no server,
 * mutates nothing.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

import { D05_BROAD_UNIVERSE_SOURCE_REVISION } from '../src/identity/governed_fixture_master.js';

const PLAN = 'evidence/cross-repository/IIPS_V3_D05_WAVE3_OPTION_B_GOVERNED_REPLACEMENT_PLAN_2026-11-07.md';
const ASSESSMENT = 'evidence/cross-repository/IIPS_V3_D05_WAVE3_MIGRATION_OPTIONS_ASSESSMENT_2026-11-07.md';
const CORPUS = 'evidence/operator_drop/d05_security_master_broad_universe.json';
const RESOLVER = 'src/identity/broker_observation_resolver.ts';
const FIXTURE_PROVIDER = 'src/identity/governed_fixture_master.ts';

function repo(relativePath: string): string {
  const full = resolve(process.cwd(), relativePath);
  assert.ok(existsSync(full), `expected ${relativePath} in the repository root`);
  return readFileSync(full, 'utf8');
}

describe('D05 Option B replacement plan — conformance', () => {
  it('plan exists, is dated and declares the PA Option B decision with the verified main baseline', () => {
    const plan = repo(PLAN);
    assert.match(plan, /Option B — Governed Replacement of the D05 Security Master/);
    assert.match(plan, /fb6cf91219c0a270d42c3618aa20ed6682699817/);
    assert.ok(plan.includes('Governing authorization:** Program Authority decision, 2026-11-07'));
  });

  it('plan grounds itself in the real contract (5 enforced rules, tickSize positivity)', () => {
    const plan = repo(PLAN);
    assert.match(plan, /OUT_OF_RANGE_VALUE/);
    assert.match(plan, /tickSize/);
  });

  it('plan mandates categorical exclusion of the 2,198 generated records and individual revalidation of the 52', () => {
    const plan = repo(PLAN);
    assert.match(plan, /2,198/);
    assert.match(plan, /categorical exclusion/i);
    assert.match(plan, /52 previously/i);
    assert.match(plan, /individual revalidation/i);
    assert.match(plan, /EQ_AIIL_IN/);
    assert.match(plan, /539177/); // AIIL evidence-bound BSE scrip, never 543989 for replacement
  });

  it('plan keeps tickSize mandatory and DEPOSITION_READY as the act precondition', () => {
    const plan = repo(PLAN);
    assert.match(plan, /DEPOSITION_READY/);
    assert.match(plan, /--tick-rules/);
    assert.match(plan, /--tick-size-uniform/);
  });

  it('plan defines non-silent rollback semantics (R-8) and preserves Wave-1 as evidence', () => {
    const plan = repo(PLAN);
    assert.match(plan, /R-8/);
    assert.match(plan, /7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5/);
    assert.match(plan, /batch `BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001`/);
  });

  it('plan enumerates the broker_observation_resolver 2250 hard guard and the 23-row re-pin blast radius', () => {
    const plan = repo(PLAN);
    assert.match(plan, /broker_observation_resolver\.ts/);
    assert.match(plan, /recordCount === 2250|recordCount !== 2250/);
    assert.match(plan, /23 rows|23 enumerated/);
    // and the pin really exists in the implementation this plan describes
    const resolver = repo(RESOLVER);
    assert.match(resolver, /recordCount !== 2250/);
  });

  it('plan forbids fuzzy mapping and operational promotion; defines phases P0–P9', () => {
    const plan = repo(PLAN);
    assert.match(plan, /Fuzzy matching is forbidden/i);
    assert.match(plan, /P9/);
    assert.match(plan, /B-06/);
  });

  it('migration options assessment carries the append-only Option B amendment closing A and C', () => {
    const amendment = repo(ASSESSMENT);
    assert.match(amendment, /Amendment — PA Decision \(2026-11-07\): Option B selected/);
    assert.match(amendment, /options A .* and C .* are \*\*closed\*\*/s);
  });

  it('the live corpus still equals the plan’s Wave-1 pin (plan not fantasy)', () => {
    const bytes = readFileSync(resolve(process.cwd(), CORPUS));
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      '7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5',
      'Wave-1 corpus drifted — plan §1 table is stale',
    );
    assert.equal(D05_BROAD_UNIVERSE_SOURCE_REVISION.fileChecksumSha256, '7f53540b6532e7718e3a03a729766c12c73cc2549e450e3c2f356aa64a2b74b5');
    assert.equal(D05_BROAD_UNIVERSE_SOURCE_REVISION.recordCount, 2250);
    const provider = repo(FIXTURE_PROVIDER);
    assert.match(provider, /D05_BROAD_UNIVERSE_SOURCE_REVISION/);
    assert.match(provider, /BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001/);
  });
});
