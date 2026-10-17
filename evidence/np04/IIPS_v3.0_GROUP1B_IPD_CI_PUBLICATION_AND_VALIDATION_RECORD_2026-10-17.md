# IIPS v3.0 — GROUP 1B (IPD) — CI, PUBLICATION AND VALIDATION RECORD

> ## STATUS: **D2a COMPLETE AND MERGED · D2b VALIDATED BUT NOT MERGED (PA DISPOSITION) · D3 NO TAG (PA DISPOSITION)**
>
> This record executes and evidences the **IPD-owned** portion of Group 1, in the roadmap's order:
> CI and runner safeguards first, then PR #8 validation, then the runtime-pin question.
>
> **Not done, by instruction or by missing authority:** PR #8 is **not merged**; no tag was created;
> Gate C was **not** started; no Gate D/E admission, lineage promotion, portfolio admission or
> persistence claim is made. The bounded portfolio UI store port remains **`SESSION_ONLY` /
> `durable:false`** — it is **not** durable persistence, and merging or publishing it would not make
> it durable.

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-GROUP1B-IPD-CI-PUBLICATION-VALIDATION-2026-10-17-01` |
| **Type** | Execution + evidence record (additive; renders only the PA dispositions recorded in §3.4 and §4.4) |
| **Repository** | `ramkivs/iips-production-market-data` (IPD) — **no IRR file, ref, PR or record was touched** |
| **Verification instant** | `2026-10-17T13:26–13:52Z` (GitHub Actions timestamps + live `gh` reads) |
| **IPD `main` before** | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` |
| **IPD `main` after** | `e040002a85097050720748af4e2cace06842700c` |
| **PR #8 head at validation** | `db952ef5471bcebdd8ae2c0530f3e4909f746a7a` |
| **PR #8 head after publishing this record** | the commit carrying this file (see the completion report for its exact SHA) — CI re-ran and passed on it |

---

## 1. ANTECEDENT STATE (verified, not assumed)

| # | Item | Verified value |
|---|---|---|
| 1 | IPD `main` | `70b24f0` — no `.github/` directory, no `scripts/` directory |
| 2 | CI | **none** — `gh api .../actions/workflows` → `total_count: 0`; `.github` absent from the tree |
| 3 | Open PRs | **#8** only (`OPEN`, `MERGEABLE`, base `main`, 36 files, 39 commits) |
| 4 | Tags / refs | **4** lightweight tags; 36+ heads; `2e11fa3b` reachable from **exactly one** ref |
| 5 | `npm test` (before) | `node --test dist/tests/*.test.js` |
| 6 | Session worktree | had been reset to `main` again; the 36 tracked changes were verified **byte-identical** to `origin/arena/21c63aef-…` before `git reset --hard` — **no work was lost** |

---

## 2. D2a — IPD CI AND RUNNER GUARD — **EXECUTED, VERIFIED, MERGED**

### 2.1 The defect being closed (CV-35), reproduced on the branch's base

```
$ rm -rf dist && npm test          # main@70b24f0, before the fix
# tests 0
# suites 0
# pass 0
# fail 0
EXIT=0                             <-- "passing" run that executed nothing
```

A command that executes zero tests returned success. Every "tests pass" claim in this program
therefore rested on the operator's word, not on the command's exit status — which is also why the
absence of CI (CV-42) mattered.

### 2.2 What was implemented — PR **#9** (`ci/cv-35-cv-42-runner-guards`)

| File | Change | Lines |
|---|---|---|
| `scripts/run-tests.mjs` | **new** — guarded runner | +129 |
| `.github/workflows/ci.yml` | **new** — the repository's first CI workflow | +94 |
| `package.json` | `"test"` → `node scripts/run-tests.mjs` (**one line**) | +1 / −1 |

**Guard semantics.** The wrapper fails closed when (1) no compiled tests exist, (2) a source test has
no compiled counterpart (partial build), (3) a compiled test is older than its source (stale build →
stale results), (4) the runner reports **zero executed tests**, or (5) the runner reports no
`# tests <n>` line at all — then propagates the runner's exit code.

**Workflow.** `push` to `main`, every `pull_request`, `workflow_dispatch` →
`npm ci --no-audit --no-fund` → `npx tsc --noEmit` → `npm run build` → `npm test` (**build first**),
with `permissions: contents: read, checks: write`, concurrency cancellation and a 25-minute timeout.
A final step publishes the executed test count as its own check run on the **PR head SHA**, so the
count is API-readable rather than inferred from a green badge.

### 2.3 Guard verification (executed locally on the exact commit, then re-executed in CI)

| Case | Result |
|---|---|
| No build (`rm -rf dist`) | **exit 1** — "no compiled tests found — the project has not been built" |
| Partial build (source test without compiled output) | **exit 1** — "1 source test(s) have no compiled counterpart" |
| Stale build (source newer than compiled output) | **exit 1** — "the build is stale" |
| Built | **exit 0** — "542 test(s) executed, 542 passed" |
| Typecheck | `npx tsc --noEmit` exit 0 |
| Build | `npm run build` exit 0 (`dist/` + `dist-frontend/`, 1,470.60 kB / 184.25 kB gzip) |

### 2.4 CI runs (actual, from the API)

| Run | Head | Event | Conclusion | Note |
|---|---|---|---|---|
| 39036547212 (#1) | `ac10bc6` | pull_request | **success** | first workflow |
| 39036627436 (#2) | `a1c00e3` | pull_request | **failure** | my own count-publisher step failed — check-run lookup by ref returned none. **The guarded test step itself passed.** |
| 39036702995 (#3) | `587f93a` | pull_request | **failure** | my own fix introduced a temporal-dead-zone reference in the publisher |
| 39036767060 (#4) | `59e555d` | pull_request | **success** | count recorded |
| 39036851167 (#5) | `e040002` | **push to `main`** | **success** | the gate is active on `main` |
| 39036877735 (#6) | `db952ef` | pull_request | **success** | PR #8 head — see §3.3 |

Runs #2 and #3 are recorded rather than hidden: both were defects in the **evidence step**, not in the
guard, and both were fixed before merge (#4). No claim in this record rests on them.

**API-readable result at the merged head `59e555d`:**

```
check "typecheck · build · test" : success
check "executed test count"      : success — "542 tests executed, 542 passed, 0 failed."
```

### 2.5 Merge and post-merge verification

| Item | Value |
|---|---|
| Merge strategy | `--merge` (merge commit) |
| Merge commit | **`e040002a85097050720748af4e2cace06842700c`** |
| Parents | `70b24f0…` (main) and `59e555d…` (the verified head) |
| Effect | the *exact* CI-verified head is an ancestor of `main` — not a squash |
| `main` files added | `.github/workflows/ci.yml`, `scripts/run-tests.mjs`; `package.json` one line |
| Tags | **4 — unchanged** |
| Other refs | `gate-a` `2ded0e9`, `gate-b` `cec7080`, `np04` `2e11fa3b` — **all unmoved** |

---

## 3. D2b — PR #8 — **UPDATED ONTO CI-ENABLED MAIN, GREEN, NOT MERGED**

### 3.1 What was done

The session branch `arena/21c63aef-…` was updated onto the CI-enabled `main` by **merge commit**
`db952ef`, not by rebase.

**Why merge rather than rebase (deliberate, and disclosed):** the branch carries 39 published commits
whose **identities are cited throughout the governance record** (`21135b1`, `34fcafc`, `b28bdc9`,
`7b08dee`, `e01d8d8`, and IRR-side citations of PR #8 heads). A rebase rewrites those SHAs, dangles
every citation, and requires a force-push — which this workstream does not do. The merge produces the
required outcome (**PR #8 evaluated by the repository's own workflow against its exact head**) with
no history rewrite and no force-push. If linearisation is required, it must be requested explicitly
as a separate act because it destroys the cited identities.

### 3.2 Completeness verification (no evidence dropped)

| Check | Result |
|---|---|
| Files changed vs `main` before update | 36 |
| Files changed vs `main` after update | **36** |
| Sorted file-list digest before / after | `b5e485fc…` = `b5e485fc…` (**identical**) |
| Byte-identity of each of the 36 files pre-/post-merge | **identical 36, changed 0** |
| Diff stat | `+12 011 / −62` — unchanged |
| Content changed by the update | only `main`'s three CI files (no overlap with PR #8's paths) |

**Nothing was added, removed, renamed or reordered** in the PR's captured evidence, inventory or
implementation surface.

### 3.3 CI against the exact resulting head

**Head `db952ef5471bcebdd8ae2c0530f3e4909f746a7a` — run 39036877735 — `pull_request` — success.**

```
check "typecheck · build · test" : success
check "executed test count"      : success — "556 tests executed, 556 passed, 0 failed."
```

556 = 542 (main suite) + 14 (the port-conformance tests introduced by PR #8). Typecheck and build are
green in the same run. PR #8: `MERGEABLE` / `CLEAN`, 36 files, +12 011 / −62, 40 commits.

**Publication note.** Committing this record on the same branch advances PR #8's head by one commit
and re-triggers the workflow. The resulting head was verified green in CI before this record was
reported as published; the exact final SHA is stated in the completion report rather than embedded
here, because embedding it would itself change the head.

### 3.4 Merge — **NOT PERFORMED — PA disposition rendered this session**

The rendered Gate B implementation-authority decision (§4, *Limits*) states that **not authorized**
includes "… **merging PR #8** (or any IRR PR)". No later act lifts that prohibition.

Asked this session how to proceed given that prohibition, the Program Authority rendered:

> **Do not merge — keep PR #8 open pending a separate act.**

That disposition is recorded verbatim above and governs. **PR #8 therefore remains OPEN, unmerged,
green and mergeable at `db952ef`.**

**The exact missing decision** is a rendered act that (a) cites and lifts the §4 limit as it applies
to PR #8, (b) names the head commit it authorises (`db952ef…` or its successor), (c) states the merge
method, and (d) states what the merge does **not** publish — Gate B IPC (`cec7080`, a different ref),
Gate C/D/E, G24 lineage, or portfolio admission. Until that act exists, no merge is lawful regardless
of technical readiness.

---

## 4. D3 — RUNTIME-PIN TAGGING — **NO TAG CREATED — PA disposition rendered this session**

### 4.1 Verified facts

| Item | Verified value |
|---|---|
| Runtime pin consumed by IRR | `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494` (`frontend/package.json` + lockfile git dependency) |
| Reachability of `2e11fa3b` | **exactly one ref**: `refs/heads/np04-governed-persistence-windows` |
| Reachability of `6828155e` | **exactly one ref**: `refs/heads/arena/01a0f308-iips-production-market-data` |
| Existing tags | **4**, all **lightweight** (`p14-r7-65b78f7`, `portfolio-option-a-cb969b6`, `post-cleanup-baseline-b46b4f4`, `temporary-cleanup-caf73ba`) — none points at either pin |
| Tagging authority in IPD | **none in existence** — no act, record or decision authorises creating a tag |
| Register status | `CV-25` = **DECISION REQUIRED**; previous records cite "tags 4 unchanged" as evidence that refs are not created without an act |

### 4.2 Why technical possibility is not authority

A tag is a **ref creation**. Every prior IPD ref creation in this workstream (the Gate A derivative
ref, the Gate B implementation ref) required its **own rendered act**; the records deliberately count
tags to prove none was created incidentally. Repository admin rights make the tag possible in one
command — which is precisely why the act, not the permission, must be the gate.

`6828155e` carries a **stricter, distinct** restriction: the rendered decisions forbid promoting,
merging, cherry-picking, **re-pinning** or admitting the G24 lineage. A durable tag on that commit is
a durable re-pin in substance and would require an act that names it explicitly and reconciles it
with that prohibition.

### 4.3 Disposition rendered this session

> **Create no tags — record CV-25 as still decision-required.**

Recorded verbatim. **No tag was created; no ref moved. Tags remain 4.**

### 4.4 The exact act required (ready to render, not rendered)

> **IIPS-V3-GROUP1-D3-IPD-PIN-TAG-ACT** — Authorise creating **one annotated tag**
> `iips-pin-np04-2e11fa3b` on `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494` in
> `ramkivs/iips-production-market-data`, and nothing else: no branch created or moved, no IRR change,
> no pin change, no promotion or admission. Evidence required: tag object SHA, peeled commit SHA,
> fresh-clone `git ls-remote --tags` read-back, and an IRR-side `npm ci` that still resolves the pin.
> A second, separate act would be required for `6828155e` and must reconcile the G24 re-pin
> prohibition.

---

## 5. STATUS CHANGES AGAINST THE R25 INVENTORY (supersession table)

| R25 item | Old status | Now | Basis |
|---|---|---|---|
| `CV-35` IPD false-green runner | OPEN — actual defect | **Remediated in `main`** | guard merged at `e040002`; zero-test run now exits 1 (§2.3); register update belongs to the IRR tracker owner |
| `CV-42` CI — IPD half | OPEN — no workflow | **Implemented** | `.github/workflows/ci.yml` on `main`; run #5 green on `main` |
| `CV-42` CI — IRR half | already green | unchanged | not touched |
| `CV-25` pin durability | DECISION REQUIRED | **unchanged — still DECISION REQUIRED** | no tag act; PA disposition §4.3 |
| Inventory row 24 (Gate B IPC) | implemented, unmerged, unqualified | **unchanged** | PR #8 publication does not publish `cec7080` |
| Inventory rows 40/41 (PIT / user-portfolio) | connected / fenced | **unchanged** | no code or authority touched |
| Portfolio UI store port | `SESSION_ONLY` / `durable:false` | **unchanged — explicitly not durable** | §6 |

---

## 6. WHAT THIS DOES **NOT** ESTABLISH

- **Not durable persistence.** The portfolio UI store port is `SESSION_ONLY` with `durable:false`.
  Neither CI, nor PR #8's publication, nor a green suite creates a durable store, an owner, a
  transport or an admission.
- **Not Gate B published.** The Gate B IPC implementation lives on `refs/heads/gate-b/…` @ `cec7080`
  and is **not** in PR #8 and **not** in `main`.
- **Not Gate C.** No qualification item was executed; the Windows deployment-host run remains the
  required environment and remains unstarted.
- **Not Gate D or E.** No route admission, no write policy, no fence change.
- **Not lineage promotion.** `6828155e` is untouched; no promotion, merge, cherry-pick or re-pin.
- **Not portfolio admission.** The IRR `503 owner-context-unavailable` fence is unaffected.
- **Not production.** Both repositories remain non-production.

---

## 7. REMAINING GROUP 1 WORK

| # | Item | Owner | State | Next executable action |
|---|---|---|---|---|
| 1 | PR #8 merge act | **PA** | **BLOCKED on the missing decision in §3.4** | render the act, then merge |
| 2 | Tag act for `2e11fa3b` | **PA** | **BLOCKED on the missing act in §4.4** | render the act, then tag |
| 3 | Tag / re-pin disposition for `6828155e` | **PA** | blocked; conflicts with the G24 re-pin prohibition | separate act naming it |
| 4 | IRR-side pin durability follow-up | IRR session | not started | after #2: `npm ci` against the tag |
| 5 | IRR tracker reconciliation (§16.39 addendum from R25) | IRR session | prepared, unapplied | apply under an IRR documentation act |
| 6 | Gate C execution | PA / Windows host | authority granted for Q1–Q4/Q9–Q11; **not executed** | bounded run on the Windows laptop |
| 7 | IRR Gate B branch (`6c654be7`, no PR) | IRR session | unchanged | open a PR and obtain its act |

---

## 8. IRR-OWNED FOLLOW-UP (explicitly for the IRR-bound session — not done here)

1. Record that the IPD pin `2e11fa3b` now sits on a CI-gated `main` lineage but is **still untagged**
   (`CV-25` unchanged).
2. Refresh `CV-35` (IPD half remediated) and `CV-42` (IPD workflow exists; IRR half already green) —
   **tracker status changes are IRR-owned**; this record does not edit them.
3. Apply the prepared §16.39 addendum when its documentation act is rendered.
4. Keep the `503` fence and DP-2 Option 2F unchanged; nothing in this record authorises otherwise.

---

## 9. LIMITATIONS OF THIS RECORD

| Limitation | Consequence |
|---|---|
| **Runner logs are not downloadable from this sandbox** (signed URLs point at hosts outside the allow-list) | Test counts were read from the **check-run output written by the workflow itself** via `api.github.com`, not from the raw log. The counts are the workflow's own parse of the runner's `# tests` line, and the guarded step's own success is independently required |
| CI runs on `ubuntu-latest`, **not** the Windows laptop | Nothing here is a Gate C or Windows qualification result |
| Two intermediate runs failed (my evidence step) | recorded in §2.4; the guarded test step passed in both |
| Action versions use major tags (`@v5`, `@v8`) | not SHA-pinned; acceptable for a personal, non-production repository, and stated rather than implied |
| `test:direct` remains broken on `main` (pre-existing: `.js` specifiers do not resolve under `--experimental-strip-types`) | **not** fixed, **not** in scope; unchanged by this work |

---

## 10. PRESERVATIONS

No IRR file, ref, PR or record was modified. No Gate B, C, D or E item was advanced. No protected
file, waiver (`V-1`, `V-4`, `Second-account`, `Remote-machine`), DP-2 Option 2F condition, H-18 scope
limit or accepted architecture decision was altered. Every change is additive except the single
`package.json` test indirection. `PR #8` remains open at `db952ef`; `gate-a`, `gate-b` and `np04` refs
are unmoved; tags remain 4.

*End of record.*
