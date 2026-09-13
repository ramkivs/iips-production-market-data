# INCIDENT-03 — THIRD SANDBOX RE-CLONE: PERMANENT LOSS OF THE EXISTING-IIPS COMMITS, AND LOSS + RECOVERY OF D12 / P06 ACCEPTANCE

> **This is a NEW historical incident record.**
> It **modifies no accepted P00–P06 artifact**, **no checkpoint artifact**, and **no gate record**.
> It records a **provenance event**, not a gate review.
>
> **Incident classification: E — exact git history absent locally AND remotely, and the underlying
> CONTENT is also lost.** ⚠ This is a **worse classification than INCIDENT-01 and INCIDENT-02**,
> both of which were classification **D** (history absent, content survived byte-identical).
>
> **⚠ This is the THIRD occurrence of the same failure mode. The mitigations recorded by
> INCIDENT-01 §7 and INCIDENT-02 §8 did not hold. See §8.**
>
> **Predecessor records:** `docs/INCIDENT-01_HISTORY_LOSS.md` (eight lost commits) ·
> `docs/INCIDENT-02_SANDBOX_RECLONE.md` (three lost commits).

---

## 1. Incident summary

| Field | Value |
|---|---|
| **Incident** | **INCIDENT-03** |
| **Type** | **Git history loss + permanent content loss** — provenance event |
| **Classification** | **E — exact history absent locally and remotely; content also lost** |
| **Detected** | 2026-09-11, on attempting the authorized existing-IIPS durability push |
| **Detected by** | Pre-push verification step **A** — `git rev-parse HEAD` returned the baseline `5decdca93e5d…` instead of the expected `4292fff6fe81…` |
| **Cause** | Two independent failures, both stemming from the same environmental behaviour. **(1)** The Arena sandbox was **re-cloned from `origin` between turns**, discarding the object database — the eighth such re-clone this session. **(2)** `/tmp` is **ephemeral and is wiped between turns**; the existing-IIPS clone lived at `/tmp/iipsrev` |
| **Content loss** | ⚠ **NOT ZERO** — the existing-IIPS work is **permanently lost** (§3.1). The market-data work survived byte-identical and was recovered (§3.2) |
| **Git-history loss** | **COMPLETE** for the four commits listed in §3 |
| **Accepted gate outcomes changed** | **NONE** — P06 remains **ACCEPTED** on its own evidence |
| **Program authorization state changed** | **NONE** |
| **NEW BLOCKER DISCOVERED** | ⚠ **The sandbox identity has NO WRITE ACCESS to `ramkivs/iips-review-recovered`** — **HTTP 403**. This was not known before this incident and independently prevents the durability push (§5) |

---

## 2. Evidence of the incident

Established by read-only investigation **before any mutation**.

### 2.1 Existing-IIPS — the permanent loss

| Observation | Value |
|---|---|
| `/tmp/iipsrev/.git` at detection | **ABSENT** — `/tmp` contained only two empty systemd stubs and an empty `arena-workspace` |
| Fresh clone `git rev-parse HEAD` | `5decdca93e5d3b90ec94ca902ff73af45574a6ac` — the AD-15 baseline, **not** `4292fff…` |
| `git cat-file -e 4292fff6fe81…` | **fails — object does not exist** |
| `git cat-file -e 64797d6d87e7…` | **fails — object does not exist** |
| `git ls-remote origin \| grep <sha>` | **0 refs** for both |
| `git fetch origin <sha>` | `fatal: remote error: upload-pack: not our ref` for both |
| GitHub API `GET /repos/…/commits/<sha>` | **HTTP 422 "No commit found for SHA"** for both — control `5decdca…` resolves normally |
| `git fsck --unreachable --dangling` on the only surviving object DB | **0 objects** |
| Filesystem-wide `find` for `*.patch` / `*.bundle` / `*.diff` / other clones | **none** — the earlier backups `/tmp/ADR01-full-2commits.patch` and `/tmp/0001-0002-series.patch` were destroyed with `/tmp` |
| Other five `arena/*-iips-review-recovered` branches, searched for `NamespaceCollisionGuard` | **0 matches on all five** — no equivalent work exists on any remote ref |
| Baseline confirmed genuinely **pre-guard** | `LiveDataRuntime.ts:78` still holds the unguarded `const inputs = { ...bound.data.fields, ...bound.companyInputs };`; **0** `NamespaceCollisionGuard` references in `iips-platform/src` |

### 2.2 Market-data — the loss that was recovered

| Observation | Value |
|---|---|
| `git rev-parse HEAD` at detection | `eae2ff6937b257883433348560ae92f5485629e5` — the clone base |
| `git reflog` | `clone: from …` then `checkout: moving from main to arena/01a0853c-…` — **nothing else** |
| `git ls-files \| wc -l` | **2** (the SPEC `.docx` and TRACKER `.xlsx` only) |
| `git status --porcelain` | `?? docs/` `?? p05/` `?? p06/` — the entire corpus present but **untracked** |
| `git cat-file -e 3f79e612… / 4b4a5193…` | both **absent** locally, **0** remote refs |
| `git cat-file -e 73f44a3d…` (D11) | ✅ **present** — it had been pushed to Track B and was re-fetchable |
| Files on disk vs Track B tree | **232 vs 231** — the one extra being `docs/p06/P06_GATE_ACCEPTANCE.md` |
| Blob-hash comparison, all 231 Track B files | **226 byte-identical · 5 differ · 0 missing** — the 5 differing being exactly the D12 and P06-acceptance files |

---

## 3. The four lost commits

### 3.1 ⚠ PERMANENTLY LOST — existing-IIPS, content and history both gone

| SHA | Subject | Status |
|---|---|---|
| **`64797d6d87e7daa468752fc23cdca763566c4228`** | ADR-01 C1–C6 `NamespaceCollisionGuard` + guarded merge at `LiveDataRuntime.ts:83`, replacing the unguarded spread at `:78` · option (ii) partition correction in the two WP test files | ❌ **UNRECOVERABLE** |
| **`4292fff6fe81e8b7a4d9c0a1079091f54eeee826`** | Final M-1 wiring — `ALL_ENGINES` 10→13 in both WP files (`TelecomEngine`/`AutoEngine`/`MaterialsEngine`) + `O2-CERT-08` stale-count correction | ❌ **UNRECOVERABLE** |

| # | Why recovery is impossible, not merely pending |
|---|---|
| **U-1** | The commits existed **only** in `/tmp/iipsrev` and were **never pushed to any remote ref**. There was no second copy |
| **U-2** | GitHub confirms the objects are **not on the server** (`upload-pack: not our ref`; API `422 No commit found`). They cannot be fetched |
| **U-3** | ⚠ **The SHAs can never be reproduced even from a perfect reconstruction.** A Git commit SHA is a hash of the exact tree contents **plus** author identity, author timestamp, committer identity, committer timestamp and message. The original file bytes and timestamps are gone, so any rebuild necessarily yields **different SHAs** |
| **U-4** | What is lost is therefore **provenance and the verification evidence**, not the *design*. The **D11 authority record survives** (`P00_DECISION_LOG.md` §9, committed at `73f44a3` and pushed), and it specifies the guard and the M-1 reconciliation in full. A rebuild is **possible**; it would simply be a **new** act with new hashes and would require the verification to be **re-performed**, not re-cited |

### 3.2 LOST BUT RECOVERED — market-data

| Lost SHA | Subject | Restored as |
|---|---|---|
| **`3f79e612e06afcd87f09c199665b12354b233e42`** | **D12** — ADR-01 §B.2 / D4 Part I collision-census authority reconciliation | **`895e215`** — verified **110 insertions / 0 deletions**, 1 file, byte-identical content |
| **`4b4a5193d2d919a51ef71b088696965e4ab0a3b7`** | **P06 GATE ACCEPTED** — explicit A3 act, 7 of 18 | **`dc713bb`** — verified 5 files, **516 insertions / 49 deletions** |

---

## 4. Recovery procedure and proof of losslessness — market-data

| # | Step | Result |
|---|---|---|
| **1** | Whole-tree `sha256` digest taken **before** any mutation | `4714d6ba331df761e10f33999b440038efecb28253f48b046a84c07940dc891e` over **232 files** |
| **2** | `git fetch origin refs/heads/arena/01a0853c-…:refs/remotes/origin/trackb` — the refspec is `main`-only, so Track B must be fetched explicitly | `origin/trackb` = `73f44a3` |
| **3** | `git merge-base --is-ancestor 73f44a3 HEAD` | ✅ local was a **strict ancestor** — 18 behind, **0 ahead**, so recovery is a **pure fast-forward** |
| **4** | `git reset --mixed refs/remotes/origin/trackb` — ⚠ **never `--hard`**, which would have destroyed the surviving working tree | HEAD `eae2ff6` → `73f44a3`; index **2 → 231 files** |
| **5** | Digest re-taken **after** | `4714d6ba331df761e10f33999b440038efecb28253f48b046a84c07940dc891e` — **IDENTICAL. Zero files altered by the recovery** |
| **6** | Working-tree delta after reset | **exactly 6 files** — the 5 D12/P06 files plus the new acceptance record. Nothing unexpected |
| **7** | Committed as **TWO** commits, mirroring the original structure (D12 is an authority act; P06 acceptance is a separate A3 act) | `895e215` then `dc713bb` |
| **8** | Suite re-run at the committed state | **377 / 377 PASS** (P05 264 + P06 113) |
| **9** | Guard teeth re-verified — the superseded P06-acceptance guards must not be vacuous | record removed → **2 fail** · AD-17 disclosure removed → **2 fail** · restored byte-identical |
| **10** | Pushed to **Track B only**, fast-forward `73f44a3..dc713bb` | ✅ |
| **11** | **Durability verified from a fresh clone**, fetching by SHA from the server | `dc713bb` ✅ · `895e215` ✅ · `73f44a3` ✅ — **22 commits** reachable; `P06_GATE_ACCEPTANCE.md` **256 lines**, `P00_DECISION_LOG.md` **437 lines** with `## 10. D12`, gate model **7 of 18**, tree **232 files** |

⚠ **`origin/main` was never touched** — it remains `eae2ff6937b257883433348560ae92f5485629e5`. No merge, no force, no other branch moved (`arena/01a0814b-…` still `07ad52fa…`; 3 branches, 0 tags).

---

## 5. ⚠ NEW BLOCKER — no write access to the existing-IIPS repository

Discovered during this incident and **not previously known**. It is **independent** of the content loss and would have blocked the durability push on its own.

| Test | Result |
|---|---|
| `git push --dry-run origin refs/heads/main:refs/heads/main` (a **no-op** — would change nothing) | `remote: Permission to ramkivs/iips-review-recovered.git denied to arena-ai-coding-agent[bot].` → **HTTP 403** |
| `git branch arena/01a0853c-iips-review-recovered 4292fff…` | `fatal: not a valid branch point` — the object does not exist |
| Control: identical no-op dry-run against `ramkivs/iips-production-market-data` | **`Everything up-to-date`** — authentication succeeds |

| # | Consequence |
|---|---|
| **W-1** | The sandbox identity `arena-ai-coding-agent[bot]` has **read** access to `ramkivs/iips-review-recovered` (clone and `ls-remote` both work) and **no write** access |
| **W-2** | ⚠ **The durability plan for existing-IIPS was never executable from this sandbox**, regardless of the `/tmp` wipes. The branch name was authorized on paper; the credential to push it did not exist |
| **W-3** | Any future existing-IIPS durability push requires **either** that write access be granted to this identity, **or** that the work be preserved inside `ramkivs/iips-production-market-data`, where write access is confirmed working |
| **W-4** | No branch was created and no push succeeded against that repository at any point in this session. Remote state is unchanged: **9 branches, 2 tags, `main` = `5decdca93e5d3b90ec94ca902ff73af45574a6ac`, `arena/01a0853c-iips-review-recovered` = 0 refs** |

---

## 6. Invalidated statements — recorded, deliberately NOT corrected

Five committed statements assert that the two existing-IIPS commits "remain local, unpushed". **That is no longer true.**

| Artifact | Line | Statement | Now true? |
|---|---|---|---|
| `docs/p06/P06_GATE_ACCEPTANCE.md` | :53 | *"…with the D11 guard and M-1 work as **local commits `64797d6` → `4292fff`, UNPUSHED, no branch created**"* | ❌ **NO** — the commits no longer exist |
| `docs/p06/P06_GATE_ACCEPTANCE.md` | :227 | *"Existing-IIPS \| **UNCHANGED by this act** — `64797d6` / `4292fff` remain local, unpushed, no branch created"* | ⚠ **PARTLY** — existing-IIPS *was* unchanged by the acceptance act (true, and still true); the claim that the commits *remain* is **false** |
| `docs/PROGRAM_STATE.md` | :30 | *"(`64797d6` / `4292fff` remain local, **unpushed**, no branch created)."* | ❌ **NO** |
| `docs/PROGRAM_STATE.md` | :663 | *"**UNCHANGED by this act.** `64797d6` → `4292fff` remain **local, unpushed, no branch created**"* | ⚠ **PARTLY** — as above |
| `docs/PROGRAM_STATE.md` | :1007 (row 8l) | *"`64797d6`/`4292fff` local, unpushed"* | ❌ **NO** |

| # | Rule — identical to INCIDENT-01 §5 and INCIDENT-02 §6 |
|---|---|
| **P-1** | **These artifacts are intentionally NOT edited.** Each statement was **accurate when written**; rewriting it would falsify the record of what was known at the moment of the act. In particular, **`P06_GATE_ACCEPTANCE.md` is an accepted gate record and is not retro-edited** |
| **P-2** | **The correction is made by ADDITION and CITATION — this document — never by editing history** |
| **P-3** | A reader encountering either SHA **must consult this record**. The statement was accurate when written and is presently false; **both facts are true** |
| **P-4** | ⚠ **P06 acceptance is NOT weakened by this loss.** The acceptance rests on evidence that was **executed and observed at the time** — the 13/13 · 97/97 · 97/97 · 97/97 oracle, the 11/11 guard tests with mutation proof, and the 377/377 suite. That evidence is recorded in the acceptance record itself and in §9 of the decision log. The loss is of **commit provenance in a different repository**, not of the basis for the acceptance |
| **P-5** | **`5decdca93e5d…` and `73f44a3` both resolve** and are the surviving pins for this era |

---

## 7. What this incident does and does not do

| # | Statement |
|---|---|
| **R-1** | It **performs no gate acceptance**, changes no methodology, grants no certification, authorizes no activation, resolves no open item, and starts no P07/P08 work |
| **R-2** | It **does not repair M-1, M-5, M-6 or AD-17**. **AD-17 remains `UNRESOLVED`** |
| **R-3** | It **does not re-perform D11 or D12**. Both are carried forward as recorded authority content; the D12 restoration commit reproduces the **same bytes** under a new hash and says so in its own message |
| **R-4** | ⚠ **The two restoration commits are NOT recreations of `3f79e612` / `4b4a5193`.** They cannot reproduce those hashes, timestamps or provenance — see **U-3** |
| **R-5** | It **creates no concessions register**, invokes no concession mechanism, and invents no concessions authority |
| **R-6** | It **touches no existing-IIPS file**. No branch was created there, nothing was pushed there, and `main` is unchanged |
| **R-7** | Every accepted artifact (`P00…P06_GATE_ACCEPTANCE.md`, all six byte-identical; P05 blob `94f87c614795fc47692d924a8490bc8d41e98d5a`), `P00_DECISION_LOG.md` §1–§9, `P00_AUTHORITY_REGISTER.md`, `P00_OPEN_ITEMS_REGISTER.md`, `P00_EVIDENCE_CONVENTIONS.md`, `ADR-01` (**§B.2 and §I both unmodified**), `ADR-02`, `D4_07`, `D8`, `D11`, `CHECKPOINT-01/02/03`, `INCIDENT-01/02`, all three `P06_0X_EVIDENCE.md`, and both binary baselines are **byte-identical** |

---

## 8. ⚠ Lessons — third occurrence, and a new finding

| # | Lesson |
|---|---|
| **L-1** | ⚠ **`/tmp` must never hold anything that is not yet pushed.** The existing-IIPS clone, its patch backups and the oracle driver all lived in `/tmp` and were all destroyed together in one wipe. INCIDENT-01 and INCIDENT-02 both survived only because their content happened to live in the **workspace**, which is snapshotted. **This is the first time the distinction cost real work** |
| **L-2** | ⚠ **"Do not push unless instructed" is now a demonstrated hazard, not merely a theoretical one.** INCIDENT-02 §8 L-4 recorded the same finding. The market-data commits survived this incident **only by luck** — the working tree happened to persist. Had the re-clone also cleared the working tree, D12 and the P06 acceptance would have been lost exactly as the existing-IIPS commits were |
| **L-3** | **Verify write access BEFORE relying on a push destination.** Five turns were spent diagnosing an object-loss problem when a **second, independent** blocker — HTTP 403 — made the push impossible regardless. A one-line `git push --dry-run` at the start would have surfaced it immediately |
| **L-4** | **A whole-tree digest before and after a `--mixed` reset is what makes recovery provable.** Step 5 above is the only reason "zero files altered" is a verified claim rather than an assertion |
| **L-5** | ⚠ **`git reset --hard` would have been catastrophic here.** The surviving content existed **only** as untracked files in the working tree. `--mixed` preserves it; `--hard` deletes it |
| **L-6** | **The limited fetch refspec hides divergence.** `remote.origin.fetch` is `+refs/heads/main:refs/remotes/origin/main`, so `origin/<session-branch>` does not exist locally and `git status` reports no ahead/behind even when the branch is 18 commits behind. Track B must be fetched explicitly, and divergence must be checked against it |
| **L-7** | **Commit early, push often, and never let verified work wait in an ephemeral location between turns.** This is the third incident; the first two were survived by luck, and this one was not |

---

## 9. Program state — unchanged by this incident

| Field | Value |
|---|---|
| `formal_gate_status` | **7 of 18 accepted — P00, P01, P02, P03, P04, P05, P06** *(unchanged)* |
| **P06** | **✅ ACCEPTED** *(unchanged — see P-4)* |
| `p06_acceptance_status` | **`ACCEPTED`** — now committed **and pushed** at `dc713bb` |
| `collision_census_status` | **`RECONCILED — 60 coded controlling`** *(unchanged — D12, restored as `895e215`)* |
| `ad_17_status` | **`UNRESOLVED`** *(unchanged)* |
| `certification_status` | **`NONE_GRANTED`** *(unchanged)* |
| `production_activation_status` | **`NOT_AUTHORIZED`** *(unchanged — A4 at P16 only)* |
| Provider / licensed execution | **`NOT_AUTHORIZED`** *(unchanged — N-1 / N-2)* |
| **Track B → `origin/main`** | **`NOT AUTHORIZED`** *(unchanged)* — `origin/main` = `eae2ff6937b257883433348560ae92f5485629e5` |
| **P07 / P08** | **`NOT_AUTHORIZED`** *(unchanged)* — 0 tracked artifacts |
| **P07–P17 A3 acceptors** | **NOT designated** *(unchanged)* |
| Existing-IIPS commits `64797d6` / `4292fff` | ⚠ **PERMANENTLY LOST** — this is the only state change recorded by this incident, and it is a change in **what exists**, not in what is authorized |
| Named historical digest triples | **`NOT REPRODUCED`** *(unchanged)* |
| Historical 54 free-form census figure | **`UNREPRODUCED`** — preserved, not erased *(unchanged)* |

---

**INCIDENT-03 recorded. Classification E — third occurrence of the same failure mode.**
**The existing-IIPS commits `64797d6` and `4292fff` are PERMANENTLY LOST — content and history.**
**D12 and the P06 acceptance were lost and RECOVERED — restored as `895e215` and `dc713bb`, pushed to Track B, durability verified from a fresh clone.**
**No accepted gate outcome changed. No program authorization state changed. P06 remains ACCEPTED.**
**NEW BLOCKER: the sandbox identity has no write access to `ramkivs/iips-review-recovered` (HTTP 403).**
