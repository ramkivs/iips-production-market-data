/**
 * P05-01 TESTS — EXISTING-IIPS NON-REGRESSION BOUNDARY
 *
 * Authority: P04_DEPENDENCY_REGISTER §5 (depend on, never modify);
 *            P02_PROVIDER_ABSTRACTION_CONTRACT §1.2 / §8;
 *            CHECKPOINT-03 recovery rule 13 (AD-17 replay firewall preserved).
 *
 * ⚠ This repository contains NO existing-IIPS executable source — `git ls-files` returns 0
 *   matches for iips-platform / LiveDataRuntime / DataBoundExecutor / ReplayService /
 *   NormalizedHolding / cross-sector / EngineRegistry / OntologyMapper. The boundary is
 *   therefore verified STRUCTURALLY: nothing here can touch it, and nothing here claims to.
 *   Per the task instruction, that fact is RECORDED rather than a test being manufactured.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { p05Root, readRepo } from './helpers.js';

const repoRoot = join(p05Root, '..');

function git(...args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

test('RECORDED FACT — this repository contains no existing-IIPS executable source', () => {
  const tracked = git('ls-files').split('\n').filter(Boolean);
  const existingIips = tracked.filter((f) =>
    /iips-platform|LiveDataRuntime|DataBoundExecutor|ReplayService|NormalizedHolding|cross-sector|EngineRegistry|OntologyMapper|RankingEngine/i.test(f));
  assert.deepEqual(existingIips, [], 'no existing-IIPS source file is tracked in this repository');

  const executables = tracked.filter((f) =>
    /\.(py|ts|tsx|js|jsx|java|cs|go|rs|sh|sql|yaml|yml)$/.test(f) && !f.startsWith('p05/'));
  assert.deepEqual(executables, [], 'P05-01 introduces the only executable source in the repository');
});

test('RECORDED FACT — no methodology, scoring or calibration SOURCE exists', () => {
  // Scoped to executable source: `P02_ERROR_TAXONOMY.md` is an accepted P02 documentation
  // artifact (the provider error taxonomy), not methodology/scoring/calibration source.
  const tracked = git('ls-files').split('\n').filter(Boolean);
  const sources = tracked.filter((f) => /\.(py|ts|tsx|js|jsx|java|cs|go|rs|sh|sql|yaml|yml)$/.test(f));
  const methodology = sources.filter((f) => /scoring|calibrat|methodolog/i.test(f));
  assert.deepEqual(methodology, [], 'no methodology/scoring/calibration source is tracked');
  // And no such source exists outside the P05-01 package at all.
  assert.deepEqual(sources.filter((f) => !f.startsWith('p05/')), []);
});

test('the AD-17 replay firewall is preserved — ReplayService and friends are untouched', () => {
  const changed = git('diff', '--name-only', 'efe33ea', 'HEAD').split('\n').filter(Boolean);
  for (const f of changed) {
    assert.doesNotMatch(f, /ReplayService|DataBoundExecutor|LiveDataRuntime|REPLAY_BASELINE/i,
      `${f} must not be an existing-IIPS artifact`);
  }
  // And the P05-01 replay harness says so itself, in the source.
  const replay = readFileSync(join(p05Root, 'src', 'replay.js'), 'utf8');
  assert.match(replay, /AD-17/);
  assert.match(replay, /NOT the existing-IIPS `ReplayService`/);
  assert.match(replay, /UNTOUCHED/);
});

test('P05-01 makes no certification, activation or E2E-030 claim', () => {
  const files = ['src/replay.js', 'src/localFeed.js', 'src/contract.js', 'src/validate.js',
    'src/identity.js', 'src/namespace.js', 'src/errors.js', 'src/serialize.js'];
  for (const f of files) {
    const text = readFileSync(join(p05Root, f), 'utf8');
    assert.doesNotMatch(text, /certified|certification granted|E2E-030 (passed|renewed)/i,
      `${f} must make no certification claim`);
    assert.doesNotMatch(text, /production activation (granted|authorized)/i,
      `${f} must make no activation claim`);
  }
});

test('the certified CSIP boundary is untouched — companyId is a mapping TARGET only', () => {
  const idfx = JSON.parse(readFileSync(join(p05Root, 'fixtures', 'identity-fixtures.json'), 'utf8'));
  // MC-6: synthetic ${sector}-H1 values are mapping targets, never modelled as entities.
  for (const m of idfx.mappings) assert.match(m.targetCompanyId, /^[a-z]+-H1$/);
  // PR-2/PR-3: nothing adds identity fields to NormalizedHolding or retypes companyId.
  const identity = readFileSync(join(p05Root, 'src', 'identity.js'), 'utf8');
  assert.match(identity, /RF-3/);
  // The JSDoc wraps across lines, so normalise whitespace before matching.
  assert.match(identity.replace(/\s*\n\s*\*?\s*/g, ' '), /never by the data plane, never coerced/);
});

test('the sector taxonomy is mapped onto, never redefined (TX-1/TX-2)', () => {
  const text = ['src/identity.js', 'src/localFeed.js']
    .map((f) => readFileSync(join(p05Root, f), 'utf8')).join('\n');
  assert.doesNotMatch(text, /IES-0\d\d/, 'P05-01 does not redefine certified taxonomy codes');
  assert.doesNotMatch(text, /new engine metric|engineMetricKey/i, 'INV-8: no methodology invention');
});

test('no new engine metric key is introduced (INV-8 / SPEC ¶132-133)', () => {
  const text = ['src/namespace.js', 'src/localFeed.js']
    .map((f) => readFileSync(join(p05Root, f), 'utf8')).join('\n');
  // The only keys produced are MD:<domain>.<field> from the accepted dictionary.
  const produced = [...new Set([...text.matchAll(/buildKey\('([a-z]+)', '([A-Za-z]+)'\)/g)]
    .map((m) => `MD:${m[1]}.${m[2]}`))].sort();
  for (const key of produced) assert.match(key, /^MD:[a-z]+\.[A-Za-z][A-Za-z0-9]*$/);
  assert.ok(produced.length > 0);
});

test('P06 / P07 / P08 remain untouched — no artifacts, no implementation', () => {
  for (const p of ['06', '07', '08']) {
    assert.equal(existsSync(join(repoRoot, 'docs', `p${p}`)), false, `docs/p${p} must not exist`);
    const named = git('ls-files').split('\n').filter((f) => new RegExp(`P${p}[_-]`).test(f));
    assert.deepEqual(named, [], `no P${p} artifact may be tracked`);
  }
  const text = ['src/localFeed.js', 'src/replay.js']
    .map((f) => readFileSync(join(p05Root, f), 'utf8')).join('\n');
  assert.match(text, /PIT storage is P08/, 'P08 ownership is declared, not implemented');
});

test('the accepted P00–P04 gate-acceptance records are unmodified', () => {
  const changed = git('diff', '--name-only', 'efe33ea', 'HEAD').split('\n').filter(Boolean);
  const acceptances = changed.filter((f) => /P0[0-4]_GATE_ACCEPTANCE\.md$/.test(f));
  assert.deepEqual(acceptances, [], 'no gate-acceptance record may be modified');
});

test('CHECKPOINT-03 and D8_STATUS are unmodified (immutable historical records)', () => {
  const changed = git('diff', '--name-only', 'efe33ea', 'HEAD').split('\n').filter(Boolean);
  assert.ok(!changed.includes('docs/CHECKPOINT-03.md'));
  assert.ok(!changed.includes('docs/d8/D8_STATUS.json'));
});

test('the tracker XLSX and SPEC DOCX are unmodified (AD-14 corrections not applied)', () => {
  const changed = git('diff', '--name-only', 'efe33ea', 'HEAD').split('\n').filter(Boolean);
  assert.deepEqual(changed.filter((f) => /\.(xlsx|docx)$/.test(f)), []);
});
