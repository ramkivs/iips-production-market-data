# IIPS v3.0 — IPD GROUP 1 / `D2b` — PR #8 MERGE ACT — DETERMINATION (`HOLD`)

> ## STATUS: **MERGE ACT NOT ESTABLISHED · HOLD PRESERVED · NO MERGE · NO REF MOVED · PR #8 UNCHANGED**
> The Program Authority's instruction of 2026-10-18 directs the IPD-bound Group 1 items to proceed.
> It does **not** supply the separate, explicit merge act that Gate B §4 requires, and — independently
> of that — **the governing act's own condition A.4(3) cannot be satisfied by the current PR head**,
> because the PR now carries six documentation paths that the act does not admit. **The merge is
> therefore not executed.** The precise missing authorisation is stated in §4; nothing is improvised.

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-GROUP1-D2B-PR8-MERGE-DETERMINATION-2026-10-18-01` |
| **Type** | Authority determination (records a hold; renders no merge authority) |
| **Repository** | `ramkivs/iips-production-market-data` — documentation only |
| **Subject** | PR **#8**, `arena/21c63aef-iips-production-market-data` → `main` |
| **Governing record** | `IIPS_v3.0_GROUP1B_AUTHORITY_HOLDS_AND_PROPOSED_ACTS_2026-10-17.md` §2 (Proposed Act A), §5; `IIPS_v3.0_GROUP1B_IPD_CI_PUBLICATION_AND_VALIDATION_RECORD_2026-10-17.md` §3.4 |
| **Prohibition relied upon** | Gate B rendered decision §4 (blob `ee6122e82581c9b1496a4b7413933c499db71446`): *"… · **merging PR #8** (or any IRR PR) · …"* |
| **Determination** | **`HOLD` — the merge act is not established; no merge performed** |
| **Production status** | NON_PRODUCTION |

---

## 1. Verified live state (2026-10-18)

| # | Item | Verified value |
|---|---|---|
| 1 | IPD `main` | **`e040002a85097050720748af4e2cace06842700c`**, tree `1a29f56737b375e80bd281738391c65a71d16ffc` |
| 2 | PR #8 | **`OPEN`**, `mergedAt: null`, base `main`, head **`afa09e719f548031d50155cf978eb1572be390c4`**, **44 files**, **+15,056 / −62**, **49 commits** |
| 3 | Mergeability | **`MERGEABLE` / `CLEAN`** |
| 4 | CI at the live head | run **`39099776551`** — **success**; `typecheck · build · test` success; *"556 tests executed, 0 failed"* |
| 5 | Reviews / comments | **0 reviews, 0 comments**; no unresolved review |
| 6 | Competing PR | **none** for this workstream |
| 7 | Tags | **4** before this round (`p14-r7-65b78f7`, `portfolio-option-a-cb969b6`, `post-cleanup-baseline-b46b4f4`, `temporary-cleanup-caf73ba`) |
| 8 | Protected ref | `6828155e…` on `refs/heads/arena/01a0f308-iips-production-market-data` — **untouched** |

Publication of this record advances the branch, so the head named above will no longer be the tip when
a future act is rendered. **Act A already anticipates this** (§A.2 `HEAD_AT_RENDER`), which is why the
head must be named *at render*, not inherited from this record.

---

## 2. What the governing record requires

The missing decision, in the governing record's own terms (§3.4), is a rendered act that:

> **(a)** cites and lifts the §4 limit as it applies to PR #8, **(b)** names the head commit it
> authorises, **(c)** states the merge method, and **(d)** states what the merge does **not** publish.

Proposed Act A adds an execution gate (§5) — the PA must render the act, and **the rendered text must
name the exact object**, i.e. the head SHA at render — and six conditions precedent (§A.4), of which
two are decisive here:

| Condition | Text (abridged) |
|---|---|
| **A.4(1)** | *"The head named at render is the current PR head and equals the tip of the branch."* |
| **A.4(3)** | *"The PR diff against `main` is **exactly** the 36 validated files — whose sorted file-list digest is `b5e485fc3449b5d4d5a0a90d7c0b1997dde8824ddd3a50ed1fe6e0ec35c7e63b` — **plus** zero or more additional files whose paths begin `evidence/np04/IIPS_v3.0_GROUP1B_`. **Any other path fails the condition.**"* |

---

## 3. Condition-by-condition assessment

| # | Requirement / condition | Result | Evidence |
|---|---|---|---|
| (a) | Cites and lifts the Gate B §4 clause *"merging PR #8"* | **NOT MET** | No rendered merge act exists. The 2026-10-18 instruction is a direction to proceed with pending items; it does not cite, quote or lift §4, and the §4 prohibition stands until an act does |
| (b) | Names the head commit authorised | **NOT MET** | The instruction names no commit; the head has moved this round (`eb028c6` → `5b5b290` → `afa09e7` → this record's commits) |
| (c) | States the merge method | **NOT MET** in the instruction; the *proposed* act fixes `--merge` | Act A §A.1 |
| (d) | States non-grants | **NOT MET** in the instruction; the *proposed* act states them | Act A §A.5 |
| **A.4(1)** | Head named at render = current PR head | **NOT MET** | no head is named at all |
| **A.4(2)** | CI at that exact head success, non-zero count, 0 failed | **MET at `afa09e7`** (`556/0`) — but not at a *named* head | run `39099776551` |
| **A.4(3)** | Diff = 36 validated files + only `evidence/np04/IIPS_v3.0_GROUP1B_*` additions | **FAILS** | see §3.1 |
| **A.4(4)** | Each of the 36 validated files byte-identical to `db952ef` | **MET** | 36/36 blobs identical at `afa09e7`; 0 changed; digest recomputed = `b5e485fc…` |
| **A.4(5)** | `MERGEABLE`/`CLEAN`, no competing PR, 0 unresolved reviews | **MET** | §1 rows 3, 5, 6 |
| **A.4(6)** | `main` still `e040002…` or a recorded advance | **MET** | §1 row 1 |

### 3.1 A.4(3) — the six paths the act does not admit

The 44-path diff is the 36 validated files **+ 2 permitted `GROUP1B` evidence files + 6 paths outside
the permitted pattern**:

| # | Path (not admitted by A.4(3)) |
|---|---|
| 1 | `evidence/np04/IIPS_v3.0_D4_BROKER_PREVIEW_OWNER_ACCEPTANCE_RECORD_2026-10-18.md` |
| 2 | `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PRIME_PA_DECISION_RENDERED_2026-10-17.md` |
| 3 | `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PRIME_WINDOWS_STORE_PROVISIONING_AUTHORITY_REQUEST_2026-10-17.md` |
| 4 | `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_BUILD_EXCEPTION_PA_DECISION_RENDERED_2026-10-17.md` |
| 5 | `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_BUILD_PREREQUISITE_ACCEPTANCE_REQUEST_2026-10-17.md` |
| 6 | `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_WINDOWS_READINESS_AND_EXECUTION_PACKAGE_2026-10-17.md` |

These are the rendered Gate A′/B-GC-1 decisions, their source proposals, the Gate C readiness package
and the D4 acceptance record — all published on this branch by earlier authorized acts. They cannot be
removed without rewriting published governance records, and no authority exists to do that.

**Consequence:** the act as written cannot authorise merging **this** head, even if the Authority
rendered it verbatim. The condition is part of the act, not of CI or of this session's judgement.

---

## 4. Determination — and the exact missing authorisation

**No merge is performed. PR #8 remains `OPEN` at head `afa09e7…` (plus this publication's commits),
unmerged and unmodified. Gate B §4 is not lifted.**

The precise missing authorisation is a **rendered, amended merge act** that:

1. **cites and lifts** the Gate B §4 clause *"merging PR #8"* **only**, leaving every other clause in
   that sentence in force;
2. **names the head commit at render** (the tip after this publication) and requires that head to equal
   the branch tip and the PR head at execution;
3. **amends condition A.4(3)** to admit the six documentation paths listed in §3.1 — or restates the
   scope as the full 44-path diff with the 36 validated files still required to be byte-identical
   (A.4(4), which holds);
4. **states the method** (`gh pr merge 8 --merge` — a single merge commit, not squash, not rebase);
5. **repeats the non-grants** of Act A §A.5 (no Gate B IPC, no Gate C/D/E, no G24, no admission, no
   durability claim, no production, no IRR change, no tag).

Until that act exists and names its head, **no merge is lawful**, regardless of green CI, the earlier
IRR merge, or the branch's mergeability.

---

## 5. Boundaries preserved

| Item | State |
|---|---|
| Gate B §4 clause *"merging PR #8"* | **NOT lifted** |
| PR #8 | **OPEN**, unmerged, unmodified; no push to its branch beyond documentation commits by this session's own branch |
| Gate B implementation ref `cec7080` | Unmerged, unqualified, not in PR #8 — unchanged |
| Gate C / D / E | Unexecuted; no qualification, no route admission, no write policy; IRR `503` fence in force |
| G24 `6828155e` | Not tagged, moved, promoted, merged, cherry-picked, re-pinned or admitted |
| Tags | Only the CV-25 `2e11fa3b` tag created by the companion act; **no tag on `6828155e`** |
| Other refs | No branch created, moved or deleted |
| Durability / production | `SESSION_ONLY` / `durable:false` portfolio store unchanged; production NOT AUTHORIZED |

---

## 6. Publication and remote verification

Appended by a **subsequent** commit after publication, so the record is not self-referential.

---

*End of determination `IIPS-V3-GROUP1-D2B-PR8-MERGE-DETERMINATION-2026-10-18-01` — **HOLD · MERGE ACT
NOT ESTABLISHED · NO MERGE · NON_PRODUCTION**.*
