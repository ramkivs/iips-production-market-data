# INCIDENT-02 — SECOND SANDBOX RE-CLONE: LOSS OF D9 / P05-01 / P05-02 COMMIT HISTORY

> **This is a NEW historical incident record.**
> It **modifies no accepted P00–P04 artifact**, **no checkpoint artifact**, and **no gate record**.
> It records a **provenance event**, not a gate review.
>
> **Incident classification: D — exact original git history is absent locally.**
> **⚠ This is the SECOND occurrence of the same failure mode. See §8 — the mitigation recorded
> by INCIDENT-01 did not hold.**
>
> **Predecessor record:** `docs/INCIDENT-01_HISTORY_LOSS.md` (first occurrence, eight lost commits).

---

## 1. Incident summary

| Field | Value |
|---|---|
| **Incident** | **INCIDENT-02** |
| **Type** | **Git history loss** — provenance event |
| **Classification** | **D — exact history absent locally** |
| **Detected** | 2026-09-09, when `git show --name-status HEAD` returned **2 files** (the two binary baselines) instead of the 24 files of the commit made earlier the same session |
| **Detected by** | Post-delivery verification of the P05-02 commit |
| **Cause** | The sandbox was **re-cloned from `origin` between turns**. The clone started at `eae2ff6937b257883433348560ae92f5485629e5` with **2 tracked files**, and the branch `arena/01a0853c-iips-production-market-data` was recreated from `main`. The reflog contained only `clone` and `checkout` — the prior object database was discarded |
| **Content loss** | **ZERO** — every artifact survives byte-identical (§3, §4) |
| **Git-history loss** | **COMPLETE** for the three session commits listed in §3 |
| **Accepted gate outcomes changed** | **NONE** |
| **Program state changed** | **NONE** |

---

## 2. Evidence of the incident

Established by read-only investigation **before any mutation**.

| Observation | Value |
|---|---|
| `git rev-parse HEAD` at detection | `eae2ff6937b257883433348560ae92f5485629e5` — **not** the expected `cdc40dc…` |
| `git log --oneline` | **1 commit** — the clone base |
| `git reflog` | `clone: from …` then `checkout: moving from main to arena/01a0853c-…` — **nothing else** |
| `git ls-files \| wc -l` | **2** (the SPEC `.docx` and TRACKER `.xlsx` only) |
| `git status --porcelain` | `?? docs/` and `?? p05/` — the entire corpus present but **untracked** |
| `git cat-file -t cdc40dc / bf66c99 / 31c2655` | `fatal: Not a valid object name` for all three |
| `git fsck --lost-found` | **empty** — no dangling copies |

---

## 3. The three lost commits

| Hash (as it was) | Subject | Recoverable as an object? |
|---|---|---|
| `cdc40dcd02fb68f11b85389e9c53b62a7e447145` | P05-02 SPECIFICATION + ADAPTER-CONTRACT (D9 A-2) | ❌ **NO** |
| `bf66c99cec1f7e43ae4dbc3ab5e77c23a27b014d` | P05-01 IMPLEMENTED + EVIDENCED (D9 A-1) | ❌ **NO** |
| `31c26553554f021928a4f9e4f41b6ee90cdfa453` | D9: P05 ENTRY AUTHORIZED | ❌ **NO** |

None was ever pushed. None exists in this clone's object database. **Per rule `O-4`
(`docs/CHECKPOINT-03.md`:34), no substitute hash is invented for them.**

**What WAS recoverable.** `efe33eae287d2181cfdd5a838b0d9e5112fcdad3` (CHECKPOINT-03) still exists
on the remote as `refs/heads/arena/01a0814b-iips-production-market-data`. Fetching it restored the
entire accepted object graph:

```
eae2ff6  chore: align program baseline with IIPS integration boundary
9a26ac7  RESTORE: accepted P00-P03 + CHECKPOINT-02 after sandbox re-clone   ← INCIDENT-01
6ec3b28  P04: instrument/security master work package (specification only)
faf1317  P04 GATE ACCEPTED: Identity/master gate (5 of 18)
efe33ea  CHECKPOINT-03: post-P04 / OI-10 resolved / pre-P05 boundary        ← RECOVERED
```

So the loss is bounded to the three post-CHECKPOINT-03 commits. Everything at or before
CHECKPOINT-03 is intact and pinned by live hash.

---

## 4. Content survival — verified, not assumed

The working tree survived the re-clone as **untracked** content.

| Measure | Value |
|---|---|
| Files on disk under `docs/` | **102** |
| Files on disk under `p05/` | **53** |
| Total with the 2 binaries | **157** |
| Expected at the lost tip `cdc40dc` | **136** tracked at `bf66c99` **+ 21** new files added by `cdc40dc` = **157** ✅ |
| Whole-tree sha256 digest (`find docs p05 -type f -exec sha256sum`) | `921f7f46df89c8acf3c88c1a95a2333a86aae2a8b0c7789994f6ef062f6ed718` |
| That digest, re-taken **after** every recovery step | **IDENTICAL** — proving no working-tree file was altered during recovery |

---

## 5. Recovery procedure

| Step | Action | Safety property |
|---|---|---|
| 1 | Copied `docs/` and `p05/` to a location **outside** the repository | A recoverable state existed before anything was mutated |
| 2 | `git fetch origin arena/01a0814b-iips-production-market-data` | **Read-only.** No branch switch. **That branch was not pushed to** |
| 3 | `git reset --mixed efe33ea` | Moves the branch pointer and index **only**. `--mixed` never rewrites working-tree files — confirmed by the unchanged digest in §4 |
| 4 | `git add -A docs p05` + one RESTORE commit | 64 files: 62 added, 2 modified (+15422 / −2) |

### 5.1 The 4 test failures observed immediately after the re-clone were NOT content failures

`p05/tests/existing-iips-boundary.test.js` shells out to `git diff --name-only efe33ea HEAD` in four
tests. Immediately after the re-clone those four failed with
`fatal: ambiguous argument 'efe33ea': unknown revision`. **They were failing because the baseline
was missing, not because any artifact had changed.** All four pass once `efe33ea` was fetched —
the suite returned to **192/192**.

> This is recorded explicitly because it would have been easy to misread those four failures as
> evidence of content corruption and to "fix" artifacts that were never broken.

---

## 6. Invalidated commit pins — recorded, deliberately NOT corrected

The three lost hashes are cited throughout the D9 / P05-01 / P05-02 corpus. **Those citations no
longer resolve in this clone.**

| Artifact | Pins to | Now resolves? |
|---|---|---|
| `docs/d9/D9_P05_ENTRY_AUTHORIZATION.md`, `docs/d9/D9_STATUS.json` | `efe33ea` (baseline) | ✅ **YES** — recovered |
| `docs/p05/P05_01_{SPECIFICATION,EVIDENCE,OPEN_ITEMS}.md` | `31c2655`, `efe33ea` | ⚠ `31c2655` **NO** · `efe33ea` **YES** |
| `docs/p05/P05_02_{SPECIFICATION,EVIDENCE,OPEN_ITEMS}.md` | `31c2655`, `bf66c99` | ❌ **NO** for both |
| `p05/evidence-p05-02/00-INDEX.json` | `31c2655`, `bf66c99` | ❌ **NO** for both |
| `docs/PROGRAM_STATE.md` rows 8c, 8d, 24b, 24b-2, 24b-3 | `efe33ea`, `bf66c99` | ⚠ `efe33ea` **YES** · `bf66c99` **NO** |

| # | Rule |
|---|---|
| **P-1** | **These artifacts are intentionally NOT edited.** Rewriting them to swap in a new hash would falsify the record of what was actually pinned when they were written |
| **P-2** | **The correction is made by ADDITION and CITATION — this document — never by editing history** |
| **P-3** | A reader encountering an unresolvable pin **must consult this record**. The pin was accurate when written and is presently unresolvable; both facts are true |
| **P-4** | **`efe33ea` and `eae2ff6` both resolve** and are the surviving pins for this era |

---

## 7. The restoration commit — what it is and is not

| # | Statement |
|---|---|
| **R-1** | The restoration commit recovers the surviving **CONTENT** into a new git history |
| **R-2** | ⚠ **It is NOT a recreation of the three lost commits.** It cannot reproduce their hashes, sequence, timestamps or individual scopes |
| **R-3** | It is **ONE commit**, deliberately. Splitting it into three would still produce three *different* hashes while falsely implying the D9 authorization act and the two work packages were separately re-performed. **The D9 authorization was NOT re-performed** — it is carried forward as recorded content |
| **R-4** | It **performs no gate acceptance**, changes no methodology, grants no certification, authorizes no activation, and resolves no open item |
| **R-5** | Every accepted artifact (`docs/p01`, `p02`, `p03`, `p04`, `d4`, `d5`, `d7`, `d8`, `CHECKPOINT-02`, `CHECKPOINT-03`) and both binary baselines are **byte-identical to `efe33ea`** — `git diff --name-only efe33ea` over those paths returns **0 files** |
| **R-6** | Only **2 files differ** from `efe33ea`, both governance ledgers: `docs/PROGRAM_STATE.md` (**+107 / −2**) and `docs/p00/P00_DECISION_LOG.md` (**+38 / −0**). The 2 "deletions" are **line replacements that preserve the original text verbatim and append to it** — a section heading extended to include D9, and the closing sentence retained with a clarification appended. **No content was removed** |
| **R-7** | **Restoration commit hash:** per the constraint that **a commit cannot contain its own hash**, no self-hash is embedded. It is resolvable as `git log --diff-filter=A -- docs/INCIDENT-02_SANDBOX_RECLONE.md`, i.e. the commit that introduced this file |
| **R-8** | ⚠ **This restoration commit is NOT pushed.** The standing instruction is *"do not push unless explicitly instructed."* See **§8 L-4** — that instruction is the proximate cause of this repeat incident |

---

## 8. ⚠ Lessons — including a repeat-incident finding

INCIDENT-01 §8 recorded, verbatim:

> **L-1** — *"**Local-only commits are not durable.** Eight commits across four accepted gates
> existed solely in a sandbox and were lost when it was recreated. **The standing local-commit-only
> instruction was the proximate exposure.**"*
>
> **L-4** — *"**Mitigation applied:** the restoration commit is pushed to `origin/main`, placing the
> accepted state under remote protection."*

| # | Finding |
|---|---|
| **L-1** | ⚠ **THE INCIDENT-01 MITIGATION DID NOT HOLD.** `origin/main` is at `eae2ff6` — it does **not** contain the INCIDENT-01 restoration, the P04 acceptance, or CHECKPOINT-03. That content survives only on `arena/01a0814b-…` at `efe33ea`. Whatever push INCIDENT-01 recorded, **`main` does not carry it now** |
| **L-2** | ⚠ **THE PROXIMATE CAUSE IS UNCHANGED AND HAS NOW FIRED TWICE.** INCIDENT-01 L-1 named the standing *"do not push"* instruction as the exposure. That instruction is still in force, and three more commits — including an **explicit program-authority authorization act (D9)** — were lost to it |
| **L-3** | **Content survived only because the platform captures a turn-end patchset.** That is a **content** backstop, never a **history** backstop. It has now been relied on twice |
| **L-4** | ⚠ **RECOMMENDATION TO PROGRAM AUTHORITY (Sai / Ramki):** the *"do not push"* instruction and the durability of the governance record are in direct conflict. Either (a) authorize pushing this branch to `origin`, or (b) accept that every authorization act — **including D9** — must be re-recorded after each sandbox recreation. This is an authority decision, **not one this artifact makes or can make** |
| **L-5** | **UNKNOWN over guessing held throughout.** No hash was invented (O-4), no artifact silently rewritten, no acceptance re-asserted, and the 4 misleading test failures were diagnosed rather than "fixed" |
| **L-6** | **`git reset --mixed` is the correct recovery primitive** when a re-clone leaves content untracked: it moves the pointer and index while provably leaving the working tree alone. Verified here by whole-tree digest equality |
| **L-7** | **A boundary test that shells out to `git` couples the suite to history durability.** `existing-iips-boundary.test.js` failed 4 tests purely because a baseline hash was absent. Recorded, **not** changed — the assertion is correct and should keep failing loudly if the baseline ever disappears again |

---

## 9. Program state — unchanged by this incident

| | |
|---|---|
| **P05** | **AUTHORIZED / NOT_ACCEPTED** — still **5 of 18** gates accepted |
| **P05-01** | IMPLEMENTED / EVIDENCED |
| **P05-02** | Specification + adapter-contract complete · **live execution NOT AUTHORIZED** |
| **P05-03** | Specification only authorized — not started |
| **P05-04** | **NOT AUTHORIZED** |
| `P05_GATE_ACCEPTANCE.md` | **DOES NOT EXIST** — not created by this restoration |
| **Certification** | `NONE_GRANTED` |
| **Production activation** | `NOT_AUTHORIZED` |
| **OI-P04-04 / OI-P04-03** | **OPEN** — not resolved, not narrowed |
| **ADR-01 C1–C6** | **UNCHANGED** |
| **OI-08 / OI-09 / OI-10** | **Unaltered** |
| **P06 / P07 / P08** | **NOT STARTED / NOT PROMOTED** |
| **A3 gate acceptor** | **UNKNOWN** |
| **Suite** | **192/192 PASS** |

⚠ **This restoration re-performs no authority act.** The D9 P05 entry authorization stands **as
recorded content** in `docs/d9/`; it is **not** re-issued here, and its original commit hash
`31c2655…` is permanently unavailable.

---

**INCIDENT-02 — second history loss recorded. Content restored and verified. No accepted outcome
altered. No authority act re-performed.**

⚠ **The durability exposure identified by INCIDENT-01 remains open and has now fired twice.**
