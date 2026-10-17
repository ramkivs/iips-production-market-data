# IIPS v3.0 — GROUP 1B — AUTHORITY HOLDS AND PROPOSED ACTS (PR #8 MERGE · CV-25 PIN TAG)

> ## STATUS: **PROPOSED ONLY — NO AUTHORITY RENDERED — NOTHING EXECUTED**
>
> This document **prepares** the two authority instruments that the Program Authority has, so far,
> declined to render. It is a **proposal**, not an act. **Nothing in it authorises anything.**
>
> By the standing rule of this program — and by explicit instruction in the task that commissioned
> this record — **a proposed act in an evidence document is not authorization to execute it.** Only a
> rendered act, recorded by the Program Authority, can lift a prohibition or authorise a ref.
>
> The holds stand and are not reversed here: **PR #8 is not merged**; **no tag exists** for
> `2e11fa3b` or `6828155e`; **no ref moved**; **Gate C was not executed**.

| Field | Value |
|---|---|
| **Document ID** | `IIPS-V3-GROUP1B-AUTHORITY-HOLDS-PROPOSED-ACTS-2026-10-17-01` |
| **Type** | Authority-hold record + **proposed** act text (renders no authority) |
| **Repository** | `ramkivs/iips-production-market-data` only; IRR inspected read-only, not modified |
| **Verification instant** | `2026-10-17T14:0xZ` — live `git ls-remote`, `gh pr view`, `gh api .../check-runs` |
| **Supersedes** | nothing; complements `IIPS-V3-GROUP1B-IPD-CI-PUBLICATION-VALIDATION-2026-10-17-01` |

---

## 1. VERIFIED STATE AT THIS INSTANT (checkpoints re-read, not assumed)

| # | Item | Verified value |
|---|---|---|
| 1 | IPD `main` | **`e040002a85097050720748af4e2cace06842700c`**, tree `1a29f56737b375e80bd281738391c65a71d16ffc` |
| 2 | `main` CI artefacts | `.github/workflows/ci.yml`, `scripts/run-tests.mjs` present |
| 3 | PR #9 | **`MERGED`** at `2026-10-17T13:30:33Z`; merge commit `e040002…`; head `59e555d…` |
| 4 | Post-merge CI on `main` | run `39036851167` (push) **success**; check "executed test count" = **"542 tests executed, 0 failed"** |
| 5 | PR #8 | **`OPEN`**, `mergedAt: null`, head **`dec1659d0ff420c302e0953f97fc4f0b07b85f83`**, base `main`, 37 files, +12 317 / −62, 42 commits, `MERGEABLE` / `CLEAN`, 0 reviews, 0 comments |
| 6 | PR #8 CI at that exact head | run `39037463297` **success**; "executed test count" = **"556 tests executed, 0 failed"**; "typecheck · build · test" success |
| 7 | Tags | **4**, unchanged: `p14-r7-65b78f7`, `portfolio-option-a-cb969b6`, `post-cleanup-baseline-b46b4f4`, `temporary-cleanup-caf73ba` — none at either pin |
| 8 | `2e11fa3b` reachability | **exactly one ref**: `refs/heads/np04-governed-persistence-windows` |
| 9 | `6828155e` reachability | **exactly one ref**: `refs/heads/arena/01a0f308-iips-production-market-data` |
| 10 | Store port | **`SESSION_ONLY` / `durable:false`** — no durable persistence exists or is admitted |

---

## 2. PROPOSED ACT A — PR #8 MERGE ACT

**Act ID:** `IIPS-V3-GROUP1B-PR8-MERGE-ACT-2026-10-17-01`
**Act type:** merge authority act — one pull request, one method, one target.
**Decision authority:** RAMKI / Program Authority (IPD side).
**Status:** **`PROPOSED — NOT APPROVED — NOT AUTHORITY TO EXECUTE`**

### A.1 What the act would authorise

Merge **PR #8** (`arena/21c63aef-iips-production-market-data` → `main` in
`ramkivs/iips-production-market-data`) using **`--merge`** — a single merge commit preserving the
branch's commit identities — and nothing else. No squash, no rebase, no force-push, no file edit
before the merge, no other ref moved, no tag created.

### A.2 The exact object of the act

| Field | Value |
|---|---|
| PR | **#8**, base `main` |
| Head at preparation | `dec1659d0ff420c302e0953f97fc4f0b07b85f83` |
| **Head at render** | `________________________________` *(to be completed by the PA when rendering — publishing this document advances the branch, so the executable head cannot be the one above)* |
| Method | `gh pr merge 8 --merge` |
| Required precondition at render | the named head is the tip of `refs/heads/arena/21c63aef-…` at that moment |

### A.3 The prohibition this act must explicitly lift

Verbatim from
`evidence/np04/IIPS_v3.0_G2_IPD_GATE_B_IMPLEMENTATION_AUTHORITY_PA_DECISION_RECORD_RENDERED_2026-10-17.md`
(blob `ee6122e82581c9b1496a4b7413933c499db71446`), §4, final sentence:

> **Not authorized:** Gate D route admission (the IRR **HTTP 503 `owner-context-unavailable`** fence
> remains in force) · Gate E write policy · **durable portfolio writes** · **P-6** · **P-8** ·
> production eligibility, certification or deployment · **G24 promotion, merge, cherry-pick, re-pin,
> or admission** · moving `main` or any other ref · modifying the baseline commit ·
> **merging PR #8** (or any IRR PR) · **opening a PR from the implementation ref**.

The act must name and lift **only** the clause "*merging PR #8*". Every other clause in that sentence
**remains in force**.

### A.4 Conditions precedent (all must hold at execution, verified live)

1. The head named at render is the current PR head and equals the tip of the branch.
2. CI at that exact head is **success**, the "executed test count" check reports a **non-zero** count
   with **0 failures**, and the "typecheck · build · test" check is success.
3. The PR diff against `main` is **exactly** the 36 validated files — whose sorted file-list digest is
   `b5e485fc3449b5d4d5a0a90d7c0b1997dde8824ddd3a50ed1fe6e0ec35c7e63b` — **plus** zero or more
   additional files whose paths begin `evidence/np04/IIPS_v3.0_GROUP1B_`. Any other path fails the
   condition.
4. Each of the 36 validated files is **byte-identical** to the validated heads (`e01d8d8`/`db952ef`).
5. `mergeable` is `MERGEABLE` and `mergeStateStatus` is `CLEAN`; no competing PR exists for this
   workstream; 0 unresolved reviews.
6. `main` is still `e040002…` or any later commit whose tree contains the CI files and whose advance
   is recorded.

### A.5 What the merge would **not** authorise

- **Gate B IPC publication.** `cec7080` (`gate-b/local-principal-ipc-implementation`) is a different
  ref and is **not** in PR #8. Merging PR #8 leaves it unmerged and unqualified.
- **Gate C.** No qualification item is executed, granted or implied; the Windows deployment-host run
  is still required.
- **Gate D** route admission and **Gate E** write policy — untouched; the IRR 503 fence stays.
- **G24 lineage.** No promotion, merge, cherry-pick, re-pin or admission of `6828155e`.
- **Portfolio admission**, and **any durability claim**: the portfolio UI store port is
  `SESSION_ONLY` / `durable:false`. Publication does not make it durable.
- **Production** eligibility, certification or deployment.
- **Any IRR change**, any tag, any ref move, any post-merge edit to `main` outside a new act.

### A.6 Evidence required after the merge

Merge commit SHA and both parents; `main` tree; a CI run on `main` reporting a non-zero executed
count with 0 failures; tag count still 4 and every other head unmoved; PR #8 `state: MERGED` with
`mergedAt`; and a dated addendum to the Group 1B record.

### A.7 Reversibility

**None.** The merge is forward-only. A revert would require its own act and would not restore the
pre-merge ref state.

---

## 3. PROPOSED ACT B — CV-25 PIN TAG ACT (`2e11fa3b` only)

**Act ID:** `IIPS-V3-GROUP1B-CV25-PIN-TAG-ACT-2026-10-17-01`
**Act type:** ref-creation act — one annotated tag, one target.
**Decision authority:** RAMKI / Program Authority (IPD side).
**Status:** **`PROPOSED — NOT APPROVED — NOT AUTHORITY TO EXECUTE`**

### B.1 What the act would authorise

Create **exactly one annotated tag** and nothing else:

| Field | Value |
|---|---|
| Tag name | **`iips-pin-np04-2e11fa3b`** |
| Target | **`2e11fa3b689d1a3674a5e4ba1f1de9a559e20494`** |
| Tag type | **annotated** (`git tag -a`), lightweight not acceptable |
| Tag message | `IIPS v3.0 NP04 governed-persistence runtime pin — 2e11fa3b — CV-25 durable reference` |
| Tagger | repository-configured maintainer identity (`ramkivs <302525469+ramkivs@users.noreply.github.com>`) |
| Signing | not required; if signing is unavailable the tag is unsigned and that fact is recorded |

### B.2 Preconditions

1. `2e11fa3b` is reachable and is the same commit object that IRR's `frontend/package.json` and
   lockfile pin (verified read-only: `git+ssh` SHA `2e11fa3b…`).
2. No tag named `iips-pin-np04-2e11fa3b` exists.
3. `2e11fa3b` exports `./pit`, `./d114-non-production`, `./persistence` via
   `tsconfig.pit-package.json` — i.e. it is the pin IRR actually consumes.
4. The only ref containing `2e11fa3b` remains `refs/heads/np04-governed-persistence-windows`.

### B.3 Evidence required after the act

1. `git ls-remote --tags origin` shows the tag object SHA **and** the peeled `^{}` line equals
   `2e11fa3b…`.
2. A **fresh clone** resolves the tag to that commit (`git rev-parse iips-pin-np04-2e11fa3b^{commit}`).
3. **IRR dependency verification** (read-only, performed by the IRR-bound session): `npm ci` still
   resolves the existing SHA pin; and, if IRR later chooses to re-pin to the tag, that is a
   **separate IRR-owned act** — this act does not change IRR's `package.json` or lockfile.
4. Tag count **4 → 5**; every branch head unmoved; `main` unmoved.

### B.4 What the act would **not** authorise

Moving the `np04` branch; re-pinning IRR; tagging any other commit; tagging `6828155e`; creating
branches; any promotion, admission or production claim. The tag is a durable **reference**, not an
approval of the pinned code.

---

## 4. ITEM C — G24 LINEAGE `6828155e` — **NO ACT PROPOSED, AUTHORITY ABSENT**

`6828155e` is covered by a standing prohibition that a tag would touch in substance. The rendered
records state the lineage is **"not promoted, merged, cherry-picked, re-pinned, or admitted"**
(Gate A derivative-ref record §"G24 lineage"; Gate A execution record; rendered Gate B decision §4:
"**G24 promotion, merge, cherry-pick, re-pin, or admission** · moving `main` or any other ref").

A tag is a durable reference and thus a durable **re-pin** in substance. No act is proposed here,
because any such act would have to **resolve** that prohibition rather than assume around it. The
Program Authority would need to state, explicitly, whether a read-only durable tag on `6828155e` is
compatible with "not re-pinned", and if so under what wording. Until then: **untouched — one ref,
no tag.**

---

## 5. EXECUTION GATE

Neither proposed act may be executed until:

1. the Program Authority **renders** it (accept/amend/reject), in this repository's record trail;
2. the rendered text names the exact object — for Act A, the head SHA at render (§A.2); for Act B, the
   immutable tag target;
3. the acting session re-verifies every condition precedent **live** at execution time and records
   the verification.

A green CI run, a merged CI PR, an expired deadline, or a task instruction to "prepare" an act is
**not** a rendering. This document is evidence that the work is prepared — not that it is authorised.

*End of proposed acts.*
