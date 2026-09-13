# INCIDENT-01 — GIT HISTORY LOSS AND CONTENT RESTORATION

> **This is a NEW historical incident record.**
> It **modifies no accepted P00 / P01 / P02 / P03 artifact** and **no checkpoint artifact**.
> It records a **provenance event**, not a gate review.
>
> **Incident classification: D — exact original git history is absent locally.**

---

## 1. Incident summary

| Field | Value |
|---|---|
| **Incident** | **INCIDENT-01** |
| **Type** | **Git history loss** — provenance event |
| **Classification** | **D — exact history absent locally** |
| **Detected** | 2026-09-09, at the mandatory integrity precondition of the P04 entry assessment |
| **Detected by** | HEAD verification: expected `0a7bb929…` (CHECKPOINT-02), found `eae2ff69…` (baseline) |
| **Cause** | The sandbox was **recreated as a fresh shallow clone** of `origin`. The prior sandbox's git object database was discarded with it |
| **Content loss** | **ZERO** — every accepted artifact survives byte-identical |
| **Git-history loss** | **COMPLETE** for the eight session commits listed in §3 |
| **Accepted gate outcomes changed** | **NONE** |

---

## 2. Evidence of the incident

Established by read-only investigation. **No repository state was mutated during investigation.**

| # | Finding |
|---|---|
| E-1 | `git rev-parse HEAD` = **`eae2ff6937b257883433348560ae92f5485629e5`** — the pre-session baseline |
| E-2 | **The reflog contains five entries only**, all `clone:` / `checkout:` / `branch: Created from`, timestamped `2026-09-09 04:37:42–43 +0000`. **There is no record of any session commit ever existing in this repository** |
| E-3 | All refs — `refs/heads/arena/01a0814b-…`, `refs/heads/main`, `refs/remotes/origin/HEAD`, `refs/remotes/origin/main`, `packed-refs`, `FETCH_HEAD` — resolve to `eae2ff69…`. **No tags. No stash. No `ORIG_HEAD`** |
| E-4 | **`.git/shallow` exists** and contains `eae2ff69…` ⇒ this is a **depth-1 shallow clone**. No ancestor or descendant history was ever fetched |
| E-5 | `git count-objects -v` → `count: 78 · in-pack: 4 · packs: 1`. The 4-object pack is the baseline commit and its tree |
| E-6 | `git fsck --full --no-reflogs --unreachable --dangling` → **78 lines, every one `unreachable blob`. Zero unreachable commits. Zero dangling commits. Zero unreachable trees** |
| E-7 | The 78 unreachable blobs were resolved by `git hash-object` (read-only, no `-w`): **78 of 78 are blobs of the CURRENT working tree**, written by the platform's patch-capture tooling. **They are not remnants of the lost commits** |
| E-8 | `.git/objects/info/alternates` **does not exist**. No alternate object store |
| E-9 | Filesystem sweep: **`/home/user/iips-production-market-data/.git` is the only git repository on the machine**. No secondary clone, no linked worktree, no submodule |
| E-10 | `git ls-remote origin refs/heads/main` → **`eae2ff69…`**. **The lost commits were never pushed, so `origin` never held them** |
| E-11 | `/tmp/arena-workspace/coding.patch` replays all 78 files as `new file mode 100644` additions against an empty base. It preserves **content only** — no commit objects, no parent links, no author/committer metadata, **no original hashes** |

**Conclusion:** the commit objects are absent from the local object store, absent from the
remote, and unreconstructible from the surviving patchset. **No exact local recovery is
possible.**

---

## 3. The eight lost commits

Each was verified individually with `git cat-file -t` and `git cat-file -p`. **All eight return
`Not a valid object name`.**

| # | Full hash | Subject | Status |
|---|---|---|---|
| 1 | `d29ad2fa4dac37180a1437eb2d29832372a6f205` | CHECKPOINT-01: preserve D4-D8 and P00 program baseline | **NOT FOUND LOCALLY** |
| 2 | `94ee5333c67f517577f2ce306133ff3893639575` | P00 GATE ACCEPTED: Scope/authority baseline | **NOT FOUND LOCALLY** |
| 3 | `547de1bf411aeab19b186be43f7a4dcee0857ff5` | P01: canonical market-data contract specification package | **NOT FOUND LOCALLY** |
| 4 | `7c4614146af98b914c786ea8c1d25699c55d7ec9` | P01 GATE ACCEPTED: Canonical contract gate | **NOT FOUND LOCALLY** |
| 5 | `2dd43cd0585cce056de69c9878ae138146fb23f5` | P02: provider abstraction specification package | **NOT FOUND LOCALLY** |
| 6 | `d99c557fe2af158a02474b37cc2c02809dc058bc` | P02 GATE ACCEPTED: Provider abstraction/entitlement gate | **NOT FOUND LOCALLY** |
| 7 | `7b8fa9dab11f1d0c0f873d1dfbc0a318bc5e1581` | P03 GATE ACCEPTED: Security gate | **NOT FOUND LOCALLY** |
| 8 | `0a7bb929df5f87fffc2deb15401cc2b3fa3085d9` | CHECKPOINT-02: preserve P03 accepted state | **NOT FOUND LOCALLY** |

**These eight hashes are permanently unavailable. They will never resolve again.**

---

## 4. The critical distinction — historical acceptance record vs. git commit provenance

This is the single most important statement in this record.

| | **HISTORICAL ACCEPTANCE RECORD** | **GIT COMMIT PROVENANCE** |
|---|---|---|
| **What it is** | The governance act: a gate was explicitly accepted, against stated criteria, recorded in a durable artifact | The git object that happened to carry that artifact into the repository at a moment in time |
| **Where it lives** | `P00_GATE_ACCEPTANCE.md`, `P01_GATE_ACCEPTANCE.md`, `P02_GATE_ACCEPTANCE.md`, `P03_GATE_ACCEPTANCE.md`, `CHECKPOINT-02.md` | The eight commit hashes in §3 |
| **Status after INCIDENT-01** | ✅ **INTACT — byte-identical, unedited** | ❌ **LOST — unrecoverable** |

| # | Consequence |
|---|---|
| D-1 | **The acceptance acts occurred.** They were performed against stated criteria, reviewed, and recorded. Losing the commit that transported an artifact does not un-perform the act the artifact records |
| D-2 | **The artifacts are the authoritative record of those acts**, and they survive intact and unedited |
| D-3 | ⚠ **What IS lost is cryptographic provenance** — the ability to prove, from git alone, when each artifact entered the repository and in what order. **This is a genuine and permanent reduction in evidentiary strength, and it is recorded here rather than glossed over** |
| D-4 | **INCIDENT-01 is a provenance/history-loss event. It is NOT a new gate review**, not a re-acceptance, and not a re-litigation of any accepted outcome |

---

## 5. Invalidated commit pins — recorded, deliberately NOT corrected

Surviving accepted artifacts cite the lost hashes as pinned evidence, per
`docs/p00/P00_EVIDENCE_CONVENTIONS.md`. **Those citations no longer resolve.**

| Artifact | Contains pins to | Now resolves? |
|---|---|---|
| `docs/p00/P00_GATE_ACCEPTANCE.md` | `d29ad2f` | **NO** |
| `docs/p00/P00_GATE_MODEL.md` | `d29ad2f`, `547de1b`, `2dd43cd`, `d99c557` | **NO** |
| `docs/p01/P01_GATE_ACCEPTANCE.md`, `docs/p01/P01_EVIDENCE.md` | `d29ad2f`, `547de1b` | **NO** |
| `docs/p02/P02_GATE_ACCEPTANCE.md`, `docs/p02/P02_EVIDENCE.md` | `d29ad2f`, `94ee533`, `7c46141`, `2dd43cd` | **NO** |
| `docs/p03/P03_GATE_ACCEPTANCE.md` | `94ee533`, `7c46141`, `d99c557`, `d29ad2f`, `7b8fa9d` | **NO** |
| `docs/p03/P03_EVIDENCE.md` §3 | `d29ad2f`, `d99c557`, `547de1b`, `7c46141`, `2dd43cd`, `eae2ff6` | **NO**, except `eae2ff6` which **still resolves** |
| `docs/CHECKPOINT-02.md` | `7b8fa9d`, `d29ad2f`, `94ee533`, `7c46141`, `d99c557` | **NO** |
| `docs/PROGRAM_STATE.md` | `d29ad2f`, `547de1b`, `2dd43cd`, `d99c557`, `7b8fa9d` | **NO** |

| # | Rule |
|---|---|
| P-1 | **These artifacts are intentionally NOT edited.** They are accepted historical records; rewriting them to swap in a new hash would falsify the record of what was actually pinned at acceptance time |
| P-2 | **The correction is made by ADDITION and CITATION — this document — never by editing history.** This follows the standing rule: *"Corrections go in new artifacts that cite the original — never by editing history"* |
| P-3 | A reader encountering an unresolvable pin in any accepted artifact **must consult this record**. The pin is historically accurate and presently unresolvable; both facts are true |
| P-4 | **`eae2ff6937b257883433348560ae92f5485629e5` remains valid** and is the sole surviving pin |

---

## 6. The restoration commit — what it is and is not

| # | Statement |
|---|---|
| R-1 | The restoration commit is a **recovery of the surviving accepted CONTENT into a NEW git history** |
| R-2 | ⚠ **It is NOT a recreation of the eight historical commits.** It does not, and cannot, reproduce their hashes, their sequence, their timestamps or their individual scopes |
| R-3 | ⚠ **It does not preserve the original commit hashes. That is impossible** — a commit hash is a function of its content, parent, author, committer and timestamps, and the originals are gone |
| R-4 | It is **ONE commit**, by authority decision, deliberately not eight. Re-creating eight commits would still produce eight *different* hashes while falsely implying the gate acts were re-performed in sequence |
| R-5 | It **performs no gate acceptance**, changes no methodology, grants no certification, authorizes no activation, and resolves no open item |
| R-6 | Its **only content change relative to the surviving tree is this incident artifact.** All 78 pre-existing files are committed byte-identical |
| R-7 | **Restoration commit hash:** this commit is the **immediately-current restoration commit** at the time this file was written. Per the git constraint that **a commit cannot contain its own hash**, the exact hash is recorded in the execution report accompanying this restoration and is resolvable as this file's introducing commit (`git log --diff-filter=A -- docs/INCIDENT-01_HISTORY_LOSS.md`). **No self-hash is embedded, because embedding an unknowable value would be a fabrication** |
| R-8 | The restoration commit is **pushed to `origin/main`** — the omission that left this work unprotected is corrected by this act |

---

## 7. Program state — unchanged by this incident

| Field | Value | Changed by INCIDENT-01? |
|---|---|---|
| **P00 / P01 / P02 / P03** | **ACCEPTED** | **NO** |
| **Formal gates accepted** | **4 of 18** | **NO** |
| **CHECKPOINT-02** | Recorded preservation checkpoint, artifact intact | **NO** |
| **P04** | **NOT ACCEPTED · NOT AUTHORIZED · does not exist** | **NO** |
| **P04 entry assessment** | ⚠ **NOT PERFORMED** — halted at the failed integrity precondition, and **not performed by this restoration** | **NO** |
| `certification_status` | **`NONE_GRANTED`** — C12 remains BLOCKED | **NO** |
| `production_activation_status` | **`NOT_AUTHORIZED`** | **NO** |
| **A1 / A2 / A3 / A4** | `PROGRAM_AUTHORITY_CLEARANCE_ESTABLISHED`, all `person_named: false` | **NO — no person assigned or inferred** |
| **OI-05, OI-06, OI-08, OI-09, OI-10, CD-01, AD-9** | **OPEN** | **NO** |
| **M-5, M-6** | **OPEN / EXISTING_IIPS** | **NO** |
| **M-1 / AD-4** | `OPEN_REVALIDATION_REQUIRED`; E2E-030 not revoked, not renewed | **NO** |
| **AD-17** | **UNRESOLVED** | **NO** |
| **DO-1 … DO-5** | **DEFERRED — NOT PASSED** | **NO** |
| **Existing-IIPS** | **UNTOUCHED** — no source, methodology, engine, scoring, calibration or certification artifact modified | **NO** |
| **Implementation** | **NONE** — zero executable source in the repository | **NO** |

---

## 8. Lessons recorded

| # | Lesson |
|---|---|
| L-1 | **Local-only commits are not durable.** Eight commits across four accepted gates existed solely in a sandbox and were lost when it was recreated. The standing local-commit-only instruction was the proximate exposure |
| L-2 | **Content survived only because the platform captures a turn-end patchset.** That is a content backstop, not a history backstop |
| L-3 | **Pinned-commit evidence conventions assume durable history.** Where history is not pushed, pins are provisional |
| L-4 | **Mitigation applied:** the restoration commit is pushed to `origin/main`, placing the accepted state under remote protection |
| L-5 | **UNKNOWN over guessing held throughout.** No hash was invented, no artifact silently rewritten, and no acceptance re-asserted without basis |

---

**INCIDENT-01 — history loss recorded. Content restored. No accepted outcome altered.**
**P04 entry assessment remains NOT PERFORMED.**
