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
 * asserted, so an unauthorized package fails rather than being silently absorbed.
 *
 * ⚠ DISCLOSED SCOPE CORRECTION (P07-01-A) — replaced, not weakened. This list was `['p05/',
 *   'p06/']` while P07 was NOT_AUTHORIZED for implementation. The Program Authority
 *   implementation authorization act (commit `c91690b`) explicitly authorizes P07
 *   implementation scoped to P07-01 through P07-04. The list widens to include `p07/` —
 *   and the enumeration assertion itself is tightened so a fourth unauthorized package
 *   (`p08/`, …) still fails this test.
 */
// ⚠ DISCLOSED SCOPE CORRECTION (P08-01) — replaced, not weakened. **F-6 / D22**
//   (`docs/D22_F6_PHASE_08_IMPLEMENTATION_AUTHORIZATION.md`) authorizes P08 implementation, which
//   adds `p08/` as a fourth authorized program package. The list stays ENUMERATED and is itself
//   asserted below, so a fifth unauthorized package (`p09/`, …) still fails these tests.
const PROGRAM_SOURCE_PACKAGES = Object.freeze(['p05/', 'p06/', 'p07/', 'p08/']);

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
  // ⚠ DISCLOSED SCOPE CORRECTION (P07-01-A) — replaced, not weakened. The P07 implementation
  // authorization act (c91690b) adds p07/ as a third authorized program package.
  assert.deepEqual([...PROGRAM_SOURCE_PACKAGES], ['p05/', 'p06/', 'p07/', 'p08/'],
    'only the P05, the D10-2-authorized P06, the c91690b-authorized P07 and the F-6/D22-authorized '
    + 'P08 package may hold program source');
  const executables = tracked.filter((f) =>
    /\.(py|ts|tsx|js|jsx|java|cs|go|rs|sh|sql|yaml|yml)$/.test(f)
    && !PROGRAM_SOURCE_PACKAGES.some((pkg) => f.startsWith(pkg)));
  assert.deepEqual(executables, [],
    'all executable source in the repository belongs to an authorized program package (p05/, p06/, p07/, p08/)');
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
    'no executable source exists outside the authorized program packages (p05/, p06/, p07/, p08/)');
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
 * ⚠ SUPERSEDED GUARD — REPLACED, NOT WEAKENED (D10-2 + P07-01-A).
 *
 * This test formerly read *"P06 / P07 / P08 remain untouched — no artifacts, no implementation"*
 * and asserted, for all three phases, that `docs/pNN` did not exist and that no tracked file
 * matched `PNN[_-]`. That was **correct and load-bearing** while those phases were
 * `NOT_AUTHORIZED`: it made an unauthorized build-out impossible to commit silently.
 *
 * **D10-2** is precisely the explicit act the P06 arm was waiting for — rescoped accordingly.
 * **The P07 implementation authorization act (c91690b)** is precisely the explicit act the P07
 * arm was waiting for — rescoped accordingly (P07-01-A).
 *
 *   · The **P08 arm is RESCOPED** (F-6 / D22) — see the disclosed correction in the body.
 *   · The **P06 arm is RESCOPED** (D10-2), tightened beyond the old absence check.
 *   · The **P07 arm is RESCOPED** (P07-01-A + P07-02-A + P07-03-A + P07-04-A): `p07/`
 *     source is now authorized for P07-01, P07-02, P07-03, and P07-04. `docs/p07` still
 *     must not exist (P07 governance records use `PHASE_07_` prefix per D13 §8 G-3).
 *     No `P07_GATE_ACCEPTANCE.md` may exist (P07 overall acceptance is NOT ESTABLISHED).
 *     The protective surface is enlarged, not reduced.
 */
test('P08 remains untouched; P07 exists ONLY as authorized P07-01/02/03/04 work (c91690b); P06 as authorized (D10-2)', () => {
  // ── RESCOPED (F-6 / D22): P08 IMPLEMENTATION is authorized. ──
  // ⚠ DISCLOSED SCOPE CORRECTION (F-6) — REPLACED, NOT WEAKENED.
  //   This arm formerly asserted `docs/p08` does not exist and that NO tracked file matches
  //   /P08[_-]/. That was correct and load-bearing while P08 implementation was NOT_AUTHORIZED:
  //   the ABSENCE of any P08 artifact was the proof that no unauthorized build-out had occurred.
  //   The explicit acts the arm was waiting for have now happened — F-1/D20 (BL-3 resolved for
  //   P08 progression), F-3/D21 (P08 ENTRY = AUTHORIZED) and F-6/D22 (P08 IMPLEMENTATION
  //   AUTHORIZED + this rescope). The bar is therefore rescoped to the authorized surface only,
  //   and TIGHTENED: content assertions now bind where an absence check could say nothing.
  //   ⚠ NOTHING IS DELETED FROM THE PROTECTIVE SURFACE.
  //
  // (a) docs/p08 must STILL NOT exist — P08 governance records use the `PHASE_08_`/`D..` prefix
  //     (D13 §8 G-3 precedent, as applied by D17/D18/D21). Unchanged bar.
  assert.equal(existsSync(join(repoRoot, 'docs', 'p08')), false,
    'docs/p08 must not exist — P08 governance records use the PHASE_08_ prefix, not docs/p08/');
  // (b) NO P08 gate-acceptance artifact may exist — P08 acceptance = NOT_ACCEPTED and no A3
  //     acceptor is designated. This is the P06 `D10-6` tripwire, applied to P08: it makes a
  //     silent or unauthorized P08 acceptance impossible to commit.
  const p08Acceptance = git('ls-files').split('\n').filter((f) => /P08_GATE_ACCEPTANCE/.test(f));
  assert.deepEqual(p08Acceptance, [],
    'no P08 gate acceptance artifact may exist — P08 acceptance is NOT_ACCEPTED and A3 is NOT DESIGNATED');
  // (c) P08 source may exist ONLY under `p08/` (authorized by F-6/D22), and — exactly as the P07
  //     arm requires — it must not persist anything to disk. PIT *storage* remains a designed
  //     capability, not an authorized side effect, until its own separate act.
  const p08Src = join(repoRoot, 'p08', 'src');
  if (existsSync(p08Src)) {
    for (const f of readdirSync(p08Src).filter((x) => x.endsWith('.js'))) {
      const code = readFileSync(join(p08Src, f), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/[^\n]*$/gm, '');
      assert.doesNotMatch(code, /writeFileSync|mkdirSync|createWriteStream/,
        `${f} must not persist anything to disk`);
      // No live acquisition, no provider credentials — neither is authorized by F-6.
      assert.doesNotMatch(code, /\bfetch\s*\(|axios|https?:\/\/|process\.env\./,
        `${f} must not perform network acquisition or read credentials — NOT AUTHORIZED by F-6`);
    }
  }
  // (d) The P08 implementation authorization record must itself carry the firewall.
  const p08ImplAuth = join(repoRoot, 'docs', 'D22_F6_PHASE_08_IMPLEMENTATION_AUTHORIZATION.md');
  if (existsSync(p08ImplAuth)) {
    const authText = readFileSync(p08ImplAuth, 'utf8');
    assert.match(authText, /NOT_ACCEPTED/,
      'the authorization record must state P08 acceptance is NOT_ACCEPTED');
    assert.match(authText, /NONE_GRANTED/,
      'the authorization record must state certification is NONE_GRANTED');
    assert.match(authText, /NOT CERTIFIED/,
      'the authorization record must state C7 is NOT CERTIFIED');
  }
  // (e) ⚠ NEW BAR — P09..P17 remain unauthorized. No such assertion existed before this act;
  //     the protective surface is ENLARGED so that authorizing P08 cannot leak downstream.
  const downstream = git('ls-files').split('\n')
    .filter((f) => /^p(09|1[0-7])\//.test(f) || /P(09|1[0-7])_GATE_ACCEPTANCE/.test(f));
  assert.deepEqual(downstream, [],
    'no P09–P17 source or acceptance artifact may exist — those phases are NOT AUTHORIZED');
  // (f) UNCHANGED: P05 still declares P08 ownership rather than implementing it.
  const text = ['src/localFeed.js', 'src/replay.js']
    .map((f) => readFileSync(join(p05Root, f), 'utf8')).join('\n');
  assert.match(text, /PIT storage is P08/, 'P08 ownership is declared, not implemented');

  // ── RESCOPED (P07-01-A): P07 implementation is authorized for P07-01 only. ──
  // docs/p07 still must not exist — P07 governance records use PHASE_07_ prefix (D13 §8 G-3).
  assert.equal(existsSync(join(repoRoot, 'docs', 'p07')), false,
    'docs/p07 must not exist — P07 governance records use PHASE_07_ prefix, not docs/p07/');
  // No P07 acceptance artifact may exist — P07 acceptance = NOT ESTABLISHED.
  const p07Acceptance = git('ls-files').split('\n').filter((f) => /P07_GATE_ACCEPTANCE/.test(f));
  assert.deepEqual(p07Acceptance, [],
    'no P07 gate acceptance artifact may exist — P07 acceptance is NOT ESTABLISHED');
  // P07 source directory may exist (authorized by c91690b) for P07-01 and P07-02 only.
  // ⚠ DISCLOSED SCOPE CORRECTION (P07-02-A) — replaced, not weakened. This clause formerly
  //   barred all P07-02 freshness code. P07-02 implementation is now authorized (P07-01
  //   accepted, P07-02 entry criteria met). P07-03 and P07-04 remain barred.
  const p07Src = join(repoRoot, 'p07', 'src');
  if (existsSync(p07Src)) {
    for (const f of readdirSync(p07Src).filter((x) => x.endsWith('.js'))) {
      // Strip comments before checking — boundary disclaimers in JSDoc are expected and correct.
      const code = readFileSync(join(p07Src, f), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/[^\n]*$/gm, '');
      // P07-01/02/03/04 are all authorized. No specific function-name bars remain.
      // The P07 gate acceptance bar (below) protects against unauthorized overall acceptance.
      assert.doesNotMatch(code, /writeFileSync|mkdirSync|createWriteStream/,
        `${f} must not persist anything to disk`);
    }
  }
  // P07 implementation must not claim acceptance or certification.
  const p07ImplAuth = join(repoRoot, 'docs', 'PHASE_07_P07_IMPLEMENTATION_AUTHORIZATION.md');
  if (existsSync(p07ImplAuth)) {
    const authText = readFileSync(p07ImplAuth, 'utf8');
    assert.match(authText, /NOT ESTABLISHED/,
      'the authorization record must state P07 acceptance is NOT ESTABLISHED');
    assert.match(authText, /NONE GRANTED/,
      'the authorization record must state P07 certification is NONE GRANTED');
  }

    // ── RESCOPED: P06 is authorized for entry, so it may exist — but only as P06-01. ──
    const docsP06 = join(repoRoot, 'docs', 'p06');
    if (existsSync(docsP06)) {
      const artifacts = readdirSync(docsP06);
      for (const f of artifacts) {
        // ⚠ DISCLOSED SCOPE CORRECTION (P06-02-B) — replaced, not weakened. This clause formerly
        //   required every docs/p06 artifact to match ^P06_01_, which was correct while P06-02 was
        //   authorized for ENTRY only. D10-2 authorizes P06-02 and it is now implemented, so the
        //   permitted prefix set widens to the two authorized work items — and P06-03 remains
        //   barred, which is the part of the original intent that still bites.
        // ⚠ DISCLOSED SCOPE CORRECTION (P06-03-B): all THREE P06 work items authorized by D10-2 are
        //   now implemented, so the permitted prefix set is the three of them. No fourth work item
        //   exists in the accepted tracker.
        // ⚠ DISCLOSED SCOPE CORRECTION (P06-ACCEPT) — replaced, not weakened. This clause formerly
        //   also barred `P06_GATE_ACCEPTANCE.md` from `docs/p06`. That ban was correct and
        //   load-bearing while P06 was unaccepted: D10-6 records "P06 AUTHORIZATION IS NOT P06
        //   ACCEPTANCE", so the artifact's ABSENCE was the proof that no silent acceptance had
        //   occurred. **The designated A3 acceptor — Ramakrishnan V. S. (Ramki), D10-3 — has now
        //   performed an EXPLICIT acceptance act** (`docs/p06/P06_GATE_ACCEPTANCE.md`), which is
        //   precisely the non-silent event the ban existed to force. The ban is therefore RESCOPED
        //   to admit exactly that one artifact — and TIGHTENED, because the acceptance-record
        //   content assertions that follow now bind, which an absence check could never express.
        //   ⚠ The tracker still defines **no fourth P06 work item**, so `^P06_0[123]_` plus the one
        //   acceptance record remains the complete permitted set and this clause still bites on
        //   anything beyond it.
        assert.ok(/^P06_0[123]_/.test(f) || f === 'P06_GATE_ACCEPTANCE.md',
          `docs/p06 may hold ONLY P06-01 / P06-02 / P06-03 artifacts (the complete D10-2 scope; no `
          + `other P06 work item exists) plus the single explicit A3 acceptance record — found '${f}'`);
      }
    }
  
    // ── RESCOPED + TIGHTENED: the P06 acceptance artifact. ──
    // ⚠ DISCLOSED SCOPE CORRECTION (P06-ACCEPT) — replaced, not weakened. The two clauses below
    //   formerly asserted that NO `P06_GATE_ACCEPTANCE` artifact exists anywhere, citing D10-6
    //   ("authorization is not acceptance"). That tripwire was correct: it made a silent or
    //   unauthorized P06 acceptance impossible to commit. `PROGRAM_STATE.md`:584 predicted this
    //   exact moment — "add `P06_GATE_ACCEPTANCE.md` → 2 P05 guards fail".
    //   ⚠ NOTHING IS DELETED FROM THE PROTECTIVE SURFACE. The old invariant "authorization alone
    //   must never manufacture acceptance" is still asserted, now MORE strongly: (a) the immutable
    //   D10 record must still read "P06 AUTHORIZATION IS NOT P06 ACCEPTANCE" and "No
    //   `P06_GATE_ACCEPTANCE.md` is created by this entry" — proving acceptance was recorded by a
    //   NEW, SEPARATE authority act and NOT by rewriting D10; (b) exactly ONE such artifact may
    //   exist, at the one canonical path; (c) the record must itself carry every limitation and
    //   non-authorization the old test protected by absence.
    const allTracked = git('ls-files').split('\n').filter(Boolean);
    const p06AcceptanceArtifacts = allTracked.filter((f) => /P06_GATE_ACCEPTANCE/.test(f));
    assert.deepEqual(p06AcceptanceArtifacts, ['docs/p06/P06_GATE_ACCEPTANCE.md'],
      'exactly ONE P06 gate-acceptance artifact may exist, at the canonical path, created by the '
      + 'explicit A3 act — not by D10 authorization and not anywhere else in the tree');
    assert.equal(existsSync(join(repoRoot, 'docs', 'p06', 'P06_GATE_ACCEPTANCE.md')), true,
      'the explicit A3 acceptance record must exist once the acceptance act has been performed');
  
    // ── NEW: the acceptance record must carry the limitations it would otherwise erase. ──
    const p06Acc = readFileSync(join(repoRoot, 'docs', 'p06', 'P06_GATE_ACCEPTANCE.md'), 'utf8');
    assert.match(p06Acc, /^# \*\*P06 — Canonical pipeline gate — is ACCEPTED\.\*\*$/m,
      'the acceptance statement must be explicit and unconditional as to P06 only');
    assert.match(p06Acc, /\*\*Ramakrishnan V\. S\. \(Ramki\)\*\*/,
      'the A3 acceptor must be named — D10-3 designates Ramakrishnan V. S. (Ramki), scoped to P06');
    // (a) D10 was NOT rewritten to manufacture the acceptance.
    const decLog = readFileSync(join(repoRoot, 'docs', 'p00', 'P00_DECISION_LOG.md'), 'utf8');
    assert.match(decLog, /P06 AUTHORIZATION IS NOT P06 ACCEPTANCE/,
      'the immutable D10 record must still read that authorization is not acceptance');
    assert.match(decLog, /No `P06_GATE_ACCEPTANCE\.md` is created by this entry/,
      'D10 must still record that IT created no acceptance artifact — supersession is by addition');
    // (b) The census disposition, the ADR-01 boundary, AD-17 and the digest gap must all be carried
    //     INSIDE the acceptance record, not merely absent from the tree.
    assert.match(p06Acc, /D12/, 'the record must cite D12 as the authority disposition of §G item 1');
    assert.match(p06Acc, /RECONCILED — 60 coded controlling/);
    assert.match(p06Acc, /UNREPRODUCED/, 'the historical 54 must remain unreproduced, not erased');
    assert.match(p06Acc, /§B\.2.*UNMODIFIED|UNMODIFIED.*§B\.2|`ADR-01 §B\.2` was NOT rewritten/,
      'the record must state that ADR-01 §B.2 was not rewritten by the acceptance');
    assert.match(p06Acc, /AD-17 remains `UNRESOLVED`|AD-17[\s\S]{0,40}UNRESOLVED/);
    assert.match(p06Acc, /NOT REPRODUCED/, 'the historical digest triples must remain not reproduced');
    assert.match(p06Acc, /`NONE_GRANTED`/, 'P06 acceptance must grant no certification');
    assert.match(p06Acc, /production activation/i);
    assert.match(p06Acc, /P07–P17 remain NOT ACCEPTED/);
    // (c) The historical P06-01 evidence index must still read NOT_ACCEPTED — it is the record of
    //     its own moment and is never retro-edited, exactly as D9_STATUS.json is treated for P05.
    const p06Idx = JSON.parse(
      readFileSync(join(repoRoot, 'p06', 'evidence-p06-01', '00-INDEX.json'), 'utf8'));
    assert.equal(p06Idx.gateStatus.p06Acceptance.includes('NOT_ACCEPTED'), true,
      'the P06-01 evidence index is a historical record of its own moment and must remain unedited');
    // (d) No concessions register anywhere, and no concession vocabulary in the acceptance record.
    const walk = (dir, acc) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) walk(join(dir, e.name), acc); else acc.push(join(dir, e.name));
      }
      return acc;
    };
    assert.deepEqual(walk(join(repoRoot, 'docs'), []).filter((f) => /concession/i.test(f)), [],
      'no concessions register may exist anywhere in docs/');
    assert.doesNotMatch(p06Acc, /waiv/i, 'the acceptance record must contain no waiver vocabulary');

  // ── no P06-03 artifact or implementation may exist. ──
  // ⚠ DISCLOSED SCOPE CORRECTION (P06-02-C): this clause formerly barred P06-02 as well, which was
  //   correct while P06-02 was authorized for ENTRY only. D10-2 authorizes P06-02 and it is now
  //   implemented, so P06-02 is permitted — and **P06-03 remains barred**, which is the part of the
  //   original intent that still bites. The P06-03 dedup prohibition below is retained unchanged.
  // ⚠ DISCLOSED SCOPE CORRECTION (P06-03-B): P06-03 is now implemented, so its artifacts are
  //   permitted. What is now barred is anything BEYOND the three authorized work items — there is
  //   no P06-04 in the accepted tracker, and no P06 acceptance artifact may exist.
  assert.deepEqual(allTracked.filter((f) => /P06[_-]0[4-9]/.test(f)), [],
    'no P06 work item beyond P06-01/P06-02/P06-03 may be tracked — the tracker defines no such item');
  const p06Src = join(repoRoot, 'p06', 'src');
  if (existsSync(p06Src)) {
    for (const f of readdirSync(p06Src).filter((x) => x.endsWith('.js'))) {
      const code = readFileSync(join(p06Src, f), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s+\/\/[^\n]*$/gm, '');
      // ⚠ DISCLOSED SCOPE CORRECTION (P06-03-B) — replaced, not weakened. P06-02 AND P06-03 are
      //   both implemented under D10-2. This clause formerly barred dedup code from every module;
      //   it now permits it in exactly ONE file — the P06-03 module — and bars it from all the
      //   others, INCLUDING the P06-02 boundary. The two universal clauses below still bind every
      //   module, so the rescope adds surface rather than removing it.
      if (f !== 'deduplicationRules.js') {
        assert.doesNotMatch(code, /dedup|deduplicat|crossProviderMerge|idempotencyKey/i,
          `${f} is not the P06-03 module and must not implement deduplication rules`);
      }
      assert.doesNotMatch(code, /writeFileSync|mkdirSync|createWriteStream/,
        `${f} must not persist anything to disk`);
      assert.doesNotMatch(code, /bypass(Validation|Detection)/i,
        `${f} must not implement a raw-bypass surface`);
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
