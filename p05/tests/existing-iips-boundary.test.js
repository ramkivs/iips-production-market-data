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
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { p05Root, readRepo } from './helpers.js';

/**
 * The executable packages this program has authored. ENUMERATED, and the enumeration is itself
 * asserted, so a third unauthorized package fails rather than being silently absorbed.
 */
const PROGRAM_SOURCE_PACKAGES = Object.freeze(['p05/', 'p06/']);

const repoRoot = join(p05Root, '..');

function git(...args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

test('RECORDED FACT — this repository contains no existing-IIPS executable source', () => {
  const tracked = git('ls-files').split('\n').filter(Boolean);
  const existingIips = tracked.filter((f) =>
    /iips-platform|LiveDataRuntime|DataBoundExecutor|ReplayService|NormalizedHolding|cross-sector|EngineRegistry|OntologyMapper|RankingEngine/i.test(f));
  assert.deepEqual(existingIips, [], 'no existing-IIPS source file is tracked in this repository');

  // ⚠ DISCLOSED SCOPE CORRECTION (P06-01-A), of exactly the same kind as the P05-03-A and
  // P05-04-A corrections in `no-provider-dependency.test.js`. This clause read
  // `!f.startsWith('p05/')` and its message said "P05-01 introduces the only executable source in
  // the repository". That was true when `p05/` was the program's only executable package. **D10-2**
  // authorizes P06 entry, and P06-01 adds a second PROGRAM package.
  //
  // ⚠ This is NOT a weakening. The protection this test exists to provide is the assertion ABOVE —
  // that no existing-IIPS source file is tracked — and that assertion is **byte-for-byte
  // unchanged**. What is rescoped is only *which program packages may hold source*, and the list
  // is ENUMERATED and itself asserted, so a third unauthorized package (`p07/`, `p08/`, …) still
  // fails this test.
  assert.deepEqual([...PROGRAM_SOURCE_PACKAGES], ['p05/', 'p06/'],
    'only the P05 and the D10-2-authorized P06 package may hold program source');
  const executables = tracked.filter((f) =>
    /\.(py|ts|tsx|js|jsx|java|cs|go|rs|sh|sql|yaml|yml)$/.test(f)
    && !PROGRAM_SOURCE_PACKAGES.some((pkg) => f.startsWith(pkg)));
  assert.deepEqual(executables, [],
    'all executable source in the repository belongs to an authorized program package (p05/, p06/)');
});

test('RECORDED FACT — no methodology, scoring or calibration SOURCE exists', () => {
  // Scoped to executable source: `P02_ERROR_TAXONOMY.md` is an accepted P02 documentation
  // artifact (the provider error taxonomy), not methodology/scoring/calibration source.
  const tracked = git('ls-files').split('\n').filter(Boolean);
  const sources = tracked.filter((f) => /\.(py|ts|tsx|js|jsx|java|cs|go|rs|sh|sql|yaml|yml)$/.test(f));
  const methodology = sources.filter((f) => /scoring|calibrat|methodolog/i.test(f));
  assert.deepEqual(methodology, [], 'no methodology/scoring/calibration source is tracked');
  // And no such source exists outside the authorized program packages at all. The
  // methodology/scoring/calibration assertion above is UNCHANGED and applies to every source
  // file including the P06-01 package.
  assert.deepEqual(sources.filter((f) => !PROGRAM_SOURCE_PACKAGES.some((pkg) => f.startsWith(pkg))), [],
    'no executable source exists outside the authorized program packages');
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

/**
 * ⚠ SUPERSEDED GUARD — REPLACED, NOT WEAKENED (D10-2).
 *
 * This test formerly read *"P06 / P07 / P08 remain untouched — no artifacts, no implementation"*
 * and asserted, for all three phases, that `docs/pNN` did not exist and that no tracked file
 * matched `PNN[_-]`. That was **correct and load-bearing** while P06 was `NOT_AUTHORIZED`: it made
 * an unauthorized P06 build-out impossible to commit silently. **D10-2 is precisely the explicit
 * act that guard was waiting for** (*"P06 ENTRY is AUTHORIZED … Scope = `P06-01`, `P06-02`,
 * `P06-03` ONLY"*), so the P06 arm is replaced — on the same terms `P05_GATE_ACCEPTANCE.md` §9 and
 * `P05_04_EVIDENCE.md` §7 set for the analogous tripwires: *the protective surface is enlarged,
 * not reduced.*
 *
 *   · The **P07 and P08 arms are UNCHANGED**, asserted byte-for-byte as before.
 *   · The **P06 arm is RESCOPED**, because D10-2 authorizes exactly that directory — and then
 *     tightened beyond the old absence check: `docs/p06` may exist but may hold **only P06-01**
 *     artifacts; **no `P06_GATE_ACCEPTANCE.md` may exist anywhere**; and **no P06-02 / P06-03
 *     artifact or implementation may exist**, which the old test could not even express.
 *   · **NEW:** the P06-01 evidence index must classify itself as non-provider, non-P06-02 and
 *     non-P06-03 evidence, so a mislabelled package is a test failure.
 */
test('P07 / P08 remain untouched; P06 exists ONLY as authorized P06-01 work (D10-2)', () => {
  // ── UNCHANGED: P07 and P08 must have no artifacts and no implementation. ──
  for (const p of ['07', '08']) {
    assert.equal(existsSync(join(repoRoot, 'docs', `p${p}`)), false, `docs/p${p} must not exist`);
    const named = git('ls-files').split('\n').filter((f) => new RegExp(`P${p}[_-]`).test(f));
    assert.deepEqual(named, [], `no P${p} artifact may be tracked`);
  }
  const text = ['src/localFeed.js', 'src/replay.js']
    .map((f) => readFileSync(join(p05Root, f), 'utf8')).join('\n');
  assert.match(text, /PIT storage is P08/, 'P08 ownership is declared, not implemented');

  // ── RESCOPED: P06 is authorized for entry, so it may exist — but only as P06-01. ──
  const docsP06 = join(repoRoot, 'docs', 'p06');
  if (existsSync(docsP06)) {
    const artifacts = readdirSync(docsP06);
    for (const f of artifacts) {
      assert.match(f, /^P06_01_/,
        `docs/p06 may hold ONLY P06-01 artifacts (D10-2 authorizes entry; P06-02/P06-03 are not implemented) — found '${f}'`);
    }
  }

  // ── TIGHTENED BEYOND THE OLD TEST: no P06 acceptance artifact may exist ANYWHERE. ──
  // D10-6 — "P06 AUTHORIZATION IS NOT P06 ACCEPTANCE."
  const allTracked = git('ls-files').split('\n').filter(Boolean);
  assert.deepEqual(allTracked.filter((f) => /P06_GATE_ACCEPTANCE/.test(f)), [],
    'no P06 gate-acceptance artifact may exist — D10-6: authorization is not acceptance');
  assert.equal(existsSync(join(repoRoot, 'docs', 'p06', 'P06_GATE_ACCEPTANCE.md')), false);

  // ── NEW: no P06-02 or P06-03 artifact or implementation may exist. ──
  assert.deepEqual(allTracked.filter((f) => /P06[_-]0[23]/.test(f)), [],
    'no P06-02 / P06-03 artifact may be tracked — those work items are not implemented');
  const p06Src = join(repoRoot, 'p06', 'src');
  if (existsSync(p06Src)) {
    for (const f of readdirSync(p06Src).filter((x) => x.endsWith('.js'))) {
      const code = readFileSync(join(p06Src, f), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/[^\n]*$/gm, '');
      assert.doesNotMatch(code, /class\s+\w*(RawStore|RawPayloadStore|StorageBoundary)/,
        `${f} must not implement the P06-02 storage boundary`);
      assert.doesNotMatch(code, /dedup|deduplicat|crossProviderMerge|idempotencyKey/i,
        `${f} must not implement P06-03 deduplication rules`);
    }
  }

  // ── NEW: the P06-01 evidence index must classify itself honestly. ──
  const idxPath = join(repoRoot, 'p06', 'evidence-p06-01', '00-INDEX.json');
  if (existsSync(idxPath)) {
    const idx = JSON.parse(readFileSync(idxPath, 'utf8'));
    assert.equal(idx.classification.isProviderEvidence, false);
    assert.equal(idx.classification.phaseScope, 'P06-01');
    assert.equal(idx.classification.p06_02Implemented, false);
    assert.equal(idx.classification.p06_03Implemented, false);
    assert.equal(idx.gateStatus.p06Acceptance.includes('NOT_ACCEPTED'), true);
  }
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
