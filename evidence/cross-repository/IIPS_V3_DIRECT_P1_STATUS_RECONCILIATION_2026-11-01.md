# IIPS v3.0 — Direct P1 provisioning status reconciliation (companion record)

> **STATUS: PUBLISHED AUTHORITATIVE IPD RECORD.** Prepared 2026-11-01; revalidated and published
> 2026-11-02 against current `main`. This is a status and governance record. It grants no
> Program Authority decision, admission, acceptance, qualification, write authority or production
> authority. Publication of this document confers **no** implementation authority.
>
> **Companion document:** [`IIPS_V3_IPD_SCOPED_WORKPACKAGE_REGISTER_2026-11-02.md`](./IIPS_V3_IPD_SCOPED_WORKPACKAGE_REGISTER_2026-11-02.md)
> is the primary record of the scoped six-work-package IPD investigation (IPD-1 … IPD-6).
> **This document is the separate Direct P1 status and governance history.** They are complementary:
> the register answers *"what is the scoped work-package state?"*; this document answers *"what
> exactly was provisioned on the Windows host, by whom, and what does that not mean?"*.

| Field | Value |
|---|---|
| Prepared | `2026-11-01` |
| Revalidated & published | `2026-11-02` (UTC) |
| **Authoritative IPD baseline** | **`main@56959fc33416ce53b142b39cbe4bd8a7ba5e077d`**, tree `ee8b0d4f42d10e92b5811fcfffb5a80a9c09cc32` |
| Original drafting baseline | `main@0a3b5f0f038e13305a3b927865acc349e19f043f` (PR #119). **Superseded — see §0.1** |
| Published via | IPD PR #123 (same PR as the companion register) |
| Scope | Investigation, status reconciliation and recorded corrections **only** |
| Mutation | **None.** No database was provisioned, reset, opened for write or mutated. No IRR write. No authorization, P1-F boundary, write guard, gate status or ref was altered |

---

## 0. Baseline revalidation (2026-11-02)

### 0.1 The original baseline is stale

The 2026-11-01 draft stated *"main unchanged since PR #119"* and inspected `main@0a3b5f0f`. **That
statement is no longer true.** `main` has advanced by **6 commits** across three merged PRs:

| PR | Merge commit | Effect on this document |
|---|---|---|
| #120 | `852b511e…` | Tracker + reconciliation sections; added `tests/iu6_recovered_d114_population_invariants.test.ts` |
| #121 | `d4c40770…` | Tracker continuation |
| #122 | `56959fc3…` | B1R package-blocker status correction (tracker +33/−1; B1R doc +1/−1) |

`0a3b5f0f` is verified to be an **ancestor** of current `main`, so nothing was lost — the record
simply moved forward. Consequences, both handled below:

1. **Tracker line numbers shifted.** `IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md` grew by
   **+244/−1** lines between the two baselines. All tracker citations in this document are given at
   **current-`main` line numbers**, with the original numbers retained for traceability (§4).
2. **No cited source file changed.** `scripts/Invoke-DirectP1Provisioning.ps1`,
   `src/persistence/directP1Provisioning.ts`, `tests/direct_p1_provisioning.test.ts`,
   `docs/DIRECT_P1_PROVISIONING.md`, the IRR handoff document and the capability-matrix
   reconstruction are **byte-identical** between the two baselines (verified by
   `git diff --name-only 0a3b5f0f origin/main -- <each path>` → empty). **Every source, test and
   capability-matrix line citation in this document therefore still holds unmodified.**

### 0.2 What was re-verified this pass

**57 line-and-value citations were re-checked programmatically against `main@56959fc3`; 57 matched,
0 mismatched.** In addition, the write guard was re-evaluated **live** from the compiled build
(§5). The revalidation log is at Appendix A.

Three items **were** stale and are corrected here: the baseline (§0.1), the tracker line numbers
(§4) and the IRR head reference (§7 item 2). No substantive finding changed.

---

## 1. The discrepancy being reconciled

The PR #119 completion report stated that **"Windows provisioning is still unexecuted."** That
statement is **incorrect**. It conflated two different propositions:

| Proposition | Truth |
|---|---|
| *Arena* did not execute provisioning on the Windows host | **TRUE**, and remains true |
| Provisioning *has not been executed* | **FALSE** — the operator executed it on 2026-11-01 |

The tracker sentence this was drawn from (now **L3406**) is itself true as far as it goes but is
**materially incomplete**, because it leaves the authoritative record reading as though the local
database state were unknown or uninitialized.

## 2. Operator-reported evidence, and what it maps to in the merged source

The following is **USER-EXECUTED / USER-REPORTED**. **Arena has not independently verified any of
it** and cannot: the Windows host and `C:\iips-data\iips\user-portfolio.sqlite` are unreachable from
this environment. What Arena *did* verify is that each reported field corresponds to a real emitted
identifier or a real check in the merged implementation — i.e. the evidence is **structurally
consistent with the shipped contract**.

| Reported evidence | Corresponding locus in merged `main` | Verified by Arena |
|---|---|---|
| `DIRECT_P1_PROVISIONING_STATE=SUCCESS` | `scripts/Invoke-DirectP1Provisioning.ps1` **L607**, emitted on the success path only (failure path L633 emits `=FAILURE`) | key + emission site confirmed |
| `DIRECT_P1_PROVISIONING_DISPOSITION=PROVISIONED` | same script **L608**, from `$script:Diag.disposition`; `PROVISIONED` is the fresh-destination disposition (`src/persistence/directP1Provisioning.ts` **L1792**; the alternative is `ALREADY_PROVISIONED`, **L1710**; union declared **L242**) | vocabulary confirmed |
| Database `C:\iips-data\iips\user-portfolio.sqlite` | the designated Windows default in `docs/DIRECT_P1_PROVISIONING.md` **L6** and §5.1 | path matches designation |
| Migrations: 4 | **DP-V1** — "Migration ledger table DDL + ordered 001..004 checksums" (**L891/L959**) | check text confirmed |
| SQLite integrity `ok`; FK violations 0 | **DP-V4** — "`PRAGMA integrity_check`, `foreign_key_check`, `foreign_key_list` & `CHECK` constraints" (**L1099/L1154**) | check text confirmed |
| Audit chain verified | **DP-V7** — "Hash-chained `audit_events` ledger and genesis provisioning event" (**L1316/L1385**) | check text confirmed |
| Write guard verified | **DP-V9** — "Portfolio tables accessible & W-1 write guard active" (**L1431/L1474**) | check text confirmed; **see §5** |
| Binding and membership ACTIVE | **DP-V5** (binding, **L1164/L1223**), **DP-V6** (membership, **L1233/L1306**), **DP-V8** (live transactional ACTIVE resolution, **L1395/L1421**) | check text confirmed |
| DP-V1…DP-V9: 9/9 passed | the nine checks above; `tests/direct_p1_provisioning.test.ts` **L487** comments *"All 9 DP-V1..DP-V9 checks pass"* | count and set confirmed |

Note: the module also emits a `DP-V0` (**L841/L867**), so **ten** distinct `DP-V` identifiers exist
(`DP-V0`…`DP-V9`, confirmed by enumeration this pass); the operator's "9/9" refers to the
DP-V1…DP-V9 verification set, which is the set the test suite pins.

### 2.1 The two remaining success-path fields — supplied by the operator

An earlier version of the 2026-11-01 draft recorded `DIRECT_P1_DATABASE_SHA256` and
`DIRECT_P1_DIAGNOSTIC_DIR` as *"not supplied."* **That was wrong.** Both were supplied in the
original Windows provisioning execution evidence:

| Field | Supplied value | Emission site |
|---|---|---|
| `DIRECT_P1_DATABASE_SHA256` | `e9b1d66c505eded34d1dd48ec86550026c930101709eb4901455ace6554b94f6` | ps1 **L610**, `$afterVerifySha256` — the digest taken *after* the independent `--mode=verify` pass |
| `DIRECT_P1_DIAGNOSTIC_DIR` | `C:\Users\USER\AppData\Local\Temp\iips-direct-p1-provisioning\direct-p1-20261101T162755373Z-d4ac31ea` | ps1 **L611**, `$script:RunLogDir` |

**Distinction that must be preserved:** these values were **not available inside this Arena
session** — the Windows host, its `%TEMP%` tree and the database file are unreachable from here.
That is a limit on what Arena could *inspect*, **not** a statement that the operator failed to
supply them. They **were** supplied. Nothing in this reconciliation questions their provenance.

**Format verification Arena *was* able to perform** (against the merged script, not against the
host) — re-run this pass, both values match the real emission contract exactly:

- The SHA-256 is **64 characters, lowercase hexadecimal only** (`[0-9a-f]{64}` fullmatch: **true**).
- The diagnostic directory decomposes exactly as `Join-Path $DiagnosticRoot $RunId` (ps1 **L56**):
  - `DiagnosticRoot` = `C:\Users\USER\AppData\Local\Temp\iips-direct-p1-provisioning`, precisely the
    script **default** at **L43** — `Join-Path ([System.IO.Path]::GetTempPath())
    'iips-direct-p1-provisioning'` — so no `-DiagnosticRoot` override was used.
  - `RunId` = `direct-p1-20261101T162755373Z-d4ac31ea`, matching **L55**'s construction
    `'direct-p1-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + (GUID 'N' fragment,
    8 chars)`. It decodes to **2026-11-01 16:27:55.373 UTC** with an 8-hex-character nonce
    `d4ac31ea`.
- **Chronological consistency:** PR #118 — the PR that first delivered
  `scripts/Invoke-DirectP1Provisioning.ps1` to `main` — merged at **2026-11-01T14:55:34Z**
  (`279d1eed…`, re-confirmed this pass). The RunId timestamp is **92 minutes later**, so the run
  postdates the script's availability. **Consistent.**

**Verification status remains unchanged:** these are **USER-REPORTED** values. Arena has confirmed
they are *well-formed and internally consistent with the shipped script*; Arena has **not**
independently recomputed the digest or read the diagnostic bundle, and cannot from this environment.

## 3. Required status distinctions (must be kept explicit)

| # | Item | Status |
|---|---|---|
| 1 | **Direct P1 database provisioning** (`C:\iips-data\iips\user-portfolio.sqlite`) | **COMPLETE — USER-EXECUTED / USER-REPORTED EVIDENCE.** Not Arena-verified. |
| 2 | **Windows IPC provider startup** (`node dist\src\ipc\entrypoint.js`) | **PENDING — external operator requirement.** Documented in `docs/DIRECT_P1_PROVISIONING.md` §6 (PR #119); no operator-reported start. |
| 3 | **IRR-to-IPD Windows named-pipe smoke test** (`\\.\pipe\iips-user-portfolio-v1`) | **PENDING — external operator requirement.** |
| 4 | **P-31 native endpoint / ACL evidence** | **PENDING.** **`P-31` occurs in ZERO files in IPD** — re-verified this pass by `git grep -l 'P-31' origin/main` across **all** tracked file types: **0 files**. It is **not an IPD identifier** and must not be given an IPD locus; record it as an IRR-side / externally-tracked pending item and assign it an owner before it is tracked in IPD. |

**Arena performed no native Windows execution.** Items 2, 3 and 4 remain **external operator
obligations**. Linux, CI and synthetic IPC results are **not** Windows named-pipe evidence, and
nothing in this document claims otherwise.

## 4. Exact affected files and recorded corrections

**Status of these corrections: PROPOSED, NOT APPLIED.** This document records them. Applying them to
the tracker requires a separate documentation change; publication of this record does not apply
them, and they must not be read as already landed.

> **Line-number note.** The tracker grew +244/−1 between `0a3b5f0f` and `56959fc3`. Citations below
> give **current-`main`** line numbers first, with the original drafting line numbers in brackets.

### 4.1 `evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md` — **L3406** [was L3374] (primary)

**Current (verbatim, confirmed at L3406 on current `main`):**
> `   - **Execution Boundary:** Arena has **not** executed provisioning on the user's Windows laptop and makes **no** claim that the local Windows database has been initialized; local execution is performed solely by the operator on Windows using `scripts/Invoke-DirectP1Provisioning.ps1`.`

**Defect:** the Arena-boundary clause is correct and must be preserved, but the sentence as a whole
now understates the record — the operator has since initialized the database and reported success.

**Proposed correction** — preserve the existing sentence verbatim (historical) and append a dated
overlay immediately after it:

> `   - **Execution Boundary:** Arena has **not** executed provisioning … using `scripts/Invoke-DirectP1Provisioning.ps1`.` *(retained verbatim)*
>
> `   - **Dated status update (2026-11-01, supersedes the state implied above):** The operator reports Direct P1 provisioning **EXECUTED and SUCCESSFUL** on the personal Windows installation: `DIRECT_P1_PROVISIONING_STATE=SUCCESS`, `DIRECT_P1_PROVISIONING_DISPOSITION=PROVISIONED`, store `C:\iips-data\iips\user-portfolio.sqlite`, SQLite integrity `ok`, 4 migrations, 0 foreign-key violations, write guard and audit chain verified, DP-V1…DP-V9 **9/9**, binding and membership `ACTIVE`. This is **USER-REPORTED evidence, NOT independently verified by Arena**; the Windows host and the database file are unreachable from the IPD execution environment. The Arena-boundary clause above remains true and is not withdrawn. **Direct P1 database provisioning: COMPLETE (user-reported). Windows IPC provider startup, the IRR↔IPD named-pipe smoke test and P-31 native endpoint/ACL evidence remain PENDING.**`

### 4.2 Same file — **L3481** [was L3449] (introduced by PR #119)

**Current (verbatim, confirmed at L3481 on current `main`):**
> `  and is not production activation. `O-05` remains **OPEN**.`

**Defect — category error.** In the authoritative IPD locus
(`evidence/cross-repository/IIPS_V3_CAPABILITY_MATRIX_51x17_RECONSTRUCTION_2026-10-23.md` **L274**),
**`O-05` is "Reports (rows 35, 36, 37 / CV-21, CV-51)"** with status **BLOCKED** — the Reports
domain, entirely unrelated to P1 provisioning. Citing it as a Direct-P1 boundary is a
misattribution, and "OPEN" is also not its authoritative status word.

**Proposed correction:** delete the `O-05` clause from this Direct-P1 boundary list and replace with
the items that actually bound the work:

> `  and is not production activation. **Direct P1 database provisioning: COMPLETE (user-reported,**
> `**not Arena-verified). Windows IPC provider startup, the IRR↔IPD named-pipe smoke test and P-31**
> `**native endpoint/ACL evidence remain PENDING.** Gate E W-1 remains hard-false (`authorized =
> `false`); Gate 4 remains `AUTHORIZED — NOT STARTED` with `QE 0/11`; Gate 5 / `CV-52` is not
> `initiated. P-1 (P1-F ceremonial / Gate A′ successor) remains `NOT EXECUTED / UNSPENT`.`

### 4.3 Same file — **L3373** [was L3341] (predates PR #119; REG-06 record)

**Current (verbatim, confirmed at L3373 on current `main`):**
> `- `O-05` remains **OPEN**. `P-1-C` **NOT ESTABLISHED**. `P-1-D` **DESIGNATED, NOT VERIFIED FOR THE ATTEMPT**. `P-1` authorized by IRR P1-F (2026-10-29) — **ONE ATTEMPT ONLY — NOT EXECUTED — UNSPENT**.`

**Defect:** same `O-05` misattribution and wrong status word. The `P-1-C` / `P-1-D` / `P-1` limbs are
**correct and must be retained verbatim**.

**Proposed correction:** this is a **historical** pass record, so per the repository's own principle
(*"dated overlays govern historical text"*) do **not** rewrite it. Append a dated correction pointer
in the new overlay section instead:

> `**Correction pointer (2026-11-01):** the `O-05` reference in the REG-06 record above is a
> `misattribution. `O-05` is the **Reports** capability (rows 35/36/37, CV-21/CV-51) and its
> `authoritative status is **BLOCKED**, not OPEN; it is unrelated to P1 provisioning. Row 28's
> `durable broker-import boundary is **`O-03`** in IPD numbering (IMPLEMENTED, NOT INTEGRATED). The
> `historical text is retained; this pointer governs.`

### 4.4 `docs/DIRECT_P1_PROVISIONING.md` — no false claim; one gap

This file contains **no execution-status claim** (verified: it is purely instructional; the only
`status` strings are the module's return values at **L67/L72**). Nothing here is inaccurate.

**Proposed addition (optional, low risk):** a short **"Current Status"** block at the top recording
the four-way distinction in §3, so an operator reading the instructions sees that provisioning is
done and the provider start is the next step.

### 4.5 `docs/integration/IIPS_V3_DIRECT_P1_PROVISIONING_AND_IRR_HANDOFF_2026-11-01.md` — no false claim

**L48** and **L137** are **conditional** ("Once … is provisioned locally …", "Once the operator has
provisioned …"). They remain correct as instructions and are now **satisfied** rather than false.

**Proposed addition (optional):** a one-line dated note that the provisioning precondition is
**satisfied per operator-reported evidence (not Arena-verified)**, and that the outstanding handoff
steps are the provider start, the named-pipe smoke test and P-31.

### 4.6 Files that must **NOT** be edited

| File | Why |
|---|---|
| `evidence/cross-repository/artifacts/IIPS_V3_CAPABILITY_MATRIX_51x17_2026-10-23.csv` | Dated 2026-10-23 **snapshot**, 52 rows × 17 cols, historical evidence. The ROW28 packet records that the capability-matrix **workbook is IRR-owned and "IPD must not edit it."** |
| All historical pass records carrying `P-1 NOT EXECUTED / UNSPENT` footers | **Correct as written** — see §5. |
| IRR (`ramkivs/iips-review-recovered`) | Read-only from IPD. Its `O-05` / row-28 label correction is a **separate IRR work item**. |

## 5. What is **NOT** stale — and must not be "corrected"

This is the most important negative finding. Numerous records state
**`P-1 NOT EXECUTED / UNSPENT`**, **`P-1-C NOT ESTABLISHED`**,
**`P-1-D DESIGNATED, NOT VERIFIED FOR THE ATTEMPT`** (tracker L1926, L2234, L2297, L2366, L2424,
L2509, L2583, L2692, L2751, L2780, L2889, L2896, L2920 — these predate the +244/−1 shift and are
unaffected by it — plus six other evidence files).

**These remain TRUE and unchanged.** They refer to the **P1-F ceremonial / Gate A′ successor
provisioning path (`P-1`)**, which is a **different mechanism** from Direct P1 local database
provisioning. Verified from source, not inferred — **re-verified this pass**:

- `src/persistence/directP1Provisioning.ts` contains **zero** references to
  `gateAPrimeProvisioning` (**0 occurrences, re-counted**) or `execute-claim` (**0 occurrences,
  re-counted**). Its **only** P1-F mention is a comment at **L17** noting that P1-F governance is
  discontinued.
- `tests/direct_p1_provisioning.test.ts` **L887/L960** enforces this: *"Standalone CLI & Zero P1-F
  Coupling"* / *"has zero coupling to discontinued P1-F orchestration, tokens, claims, S2 pins, or
  historical provisioning entrypoints."*

**Therefore Direct P1's completion does not spend, execute or satisfy P-1.** Any publication that
marked P-1 executed on the strength of the Direct P1 evidence would be a serious error.

**Also unchanged — `evaluatePortSaveGuard()` re-evaluated LIVE this pass** against the compiled
build at `main@56959fc3` (`src/persistence/portfolio_store.ts` **L213**, imported from
`dist/src/persistence/portfolio_store.js`):

```
authorized = false
reasons    = ["W-1(3): Gate 4 qualification not accepted",
              "W-1(4): Gate 5 admission not accepted"]
```

- **Gate E W-1 write guard: hard-false.** The operator's DP-V9 evidence (*write guard verified*)
  **confirms the guard is still active** — provisioning completion enables no write.
- **Gate 4:** `AUTHORIZED — NOT STARTED`, `QE-1…QE-11` at `0/11` (O-02). **Not initiated.**
- **Gate 5 / `CV-52`:** not initiated (O-06).
- **`GATE3_MIGRATIONS` / `DESIGNATED_MIGRATION_BLOBS` / check `V-A2-1`:** untouched.

## 6. Meaning and status of O-05 — resolved

| Locus | What "O-05" denotes there | Status |
|---|---|---|
| **IPD** capability-matrix reconstruction **L274** | **Reports** (rows 35, 36, 37 / CV-21, CV-51). Domain absent from `main`; fence `98147054…` intact; 10 implementation files only on branch refs `4906a6b`, `6a8afbb`; no Reports UI or `/reports` route. Closure needs `R1`, `R2`, `R3`, `F-7` by separate acts. | **BLOCKED** |
| **IRR** tracker §16.150.5 | The **row 28** durable broker-import boundary, whose blocker was mislabelled *"`GOV-03`/`BI-08` admission act"*. The IPD ROW28 packet establishes neither identifier is an admission act; the real instruments are the **Gate 4 result-acceptance act** and the **Gate 5 admission act (`CV-52`)**. | Correction is an **IRR-owned work item**, still outstanding |

So the IPD and IRR numbering **diverge**: IPD's row-28 item is **`O-03`** (**L261**, *IMPLEMENTED,
NOT INTEGRATED*), while IRR's §16.150.5 labels the same subject `O-05`. Neither usage has anything
to do with Direct P1 provisioning. **Both PR #119 `O-05 remains OPEN` statements are
misattributions**, recorded for correction as set out in §4.2 and §4.3.

**Both matrix line numbers (L261, L274) were re-verified on current `main` and are unchanged.**

## 7. Outstanding items

1. **Windows IPC provider startup** — operator to run the §6 command in
   `docs/DIRECT_P1_PROVISIONING.md` against the now-provisioned store, and report the
   `[g3] listening on windows-named-pipe …` line. **External operator requirement; not performed by
   Arena.**
2. **IRR↔IPD named-pipe smoke test** — one framed `portfolio.list` round trip over
   `\\.\pipe\iips-user-portfolio-v1`; expected shape is the 9-field `PortfolioSummary[]` corrected in
   PR #119. **Reference note (corrected this pass):** IRR `main` has advanced to
   **`9e0a0415b76571fc4db1747b2da63c73fa0447d3`** and published the consolidated reference-inventory
   refresh (`docs/integration/reference-inventory-refresh-2026-11-02/`, PR #432, merged commit
   `331e51459be592693395823a47b1a2d3fc4fe462`). The 2026-11-01 draft's IRR reference
   (`d451154994c6abf5682fa6b101438d255d79674d`) is **stale**. IRR still does not reference IPD
   `56959fc3`.
3. **P-31 native endpoint / ACL evidence** — pending; **not an IPD identifier** (0 tracked files
   contain it, re-verified). Assign an owner and locus before tracking it in IPD.
4. **IRR-side reconciliation** — the IRR `O-05` / row-28 label correction and any IRR record of the
   Direct P1 completion. **IRR-owned; IPD must not write it.**
5. **Evidence strengthening (optional, narrowed)** — the SHA-256 and the diagnostic directory **have
   been supplied** (§2.1). The only artifact not before this reconciliation is the **content** of the
   diagnostic bundle — `provisioning.log`, the child stdout/stderr captures and
   `diagnostic-summary.json` inside
   `…\iips-direct-p1-provisioning\direct-p1-20261101T162755373Z-d4ac31ea`. Producing it would require
   access to the Windows host, which Arena does not have. **Not required, and not to be obtained by
   re-running provisioning** — a repeat invocation on a valid store is read-only and returns
   `ALREADY_PROVISIONED` with `mutated: false`, but **no re-invocation was undertaken** for this
   reconciliation and none should be.

## 8. Relationship to the six-package register

| Concern | Where it is recorded |
|---|---|
| Scoped work-package investigation and dispositions (IPD-1 … IPD-6) | **Companion register**, `IIPS_V3_IPD_SCOPED_WORKPACKAGE_REGISTER_2026-11-02.md` |
| Durable-persistence *capability* state (IPD-1: COMPLETE / branch family OBSOLETE / write BLOCKED) | Register §IPD-1 — and this document §5 explains **why** the write is blocked |
| Direct P1 *provisioning* status, its operator evidence, and the P1-F / P-1 distinction | **This document**, §2, §3, §5 |
| Windows-native execution still outstanding (provider start, named-pipe smoke, P-31, D-PIT-WIRE-01) | This document §3 and §7; register §IPD-5 (D-PIT-WIRE-01) and §5 limitations |
| Gate 4 / Gate 5 acceptance and admission status | Both documents, consistently: **not started / not initiated** |

**There is no contradiction between the two documents.** The register states that durable writes are
gated (`authorized = false`); this document states the same and records the operator-reported
provisioning that preceded it. **Provisioning a database does not authorize a write through it.**

## 9. Non-grants

This document grants no Program Authority decision, admission, acceptance or qualification. It does
not authorize a durable portfolio write, lift any fence, move Gate 4 or Gate 5, adopt H-12, initiate
`CV-52`, execute QE-1…QE-11, execute P-1, or deploy to production. It does not represent
operator-reported evidence as Arena-verified. It does not claim that Arena performed any native
Windows execution. **Publishing this record creates no implementation, write or production
authority.**

---

## Appendix A — revalidation log (2026-11-02, against `main@56959fc3`)

| Check | Command / method | Result |
|---|---|---|
| Clone integrity | `git rev-parse --is-shallow-repository` | **`false`** (clone was shallow at turn start; unshallowed before any ancestry claim) |
| Baseline | `git rev-parse origin/main` / `origin/main^{tree}` | `56959fc33416ce53b142b39cbe4bd8a7ba5e077d` / `ee8b0d4f42d10e92b5811fcfffb5a80a9c09cc32` |
| Baseline drift since drafting | `git rev-list --count 0a3b5f0f..origin/main` | **6 commits** (PRs #120, #121, #122) — draft's "unchanged" claim **stale, corrected §0.1** |
| `0a3b5f0f` ancestry | `git merge-base --is-ancestor 0a3b5f0f origin/main` | **YES** — record advanced, nothing lost |
| Cited source files changed? | `git diff --name-only 0a3b5f0f origin/main -- <6 paths>` | **empty** — all source/test/matrix citations still valid |
| Line-citation audit | programmatic check of **57** file:line and value citations | **57 checked, 0 mismatched** |
| Tracker line shift | `grep -n` for the three cited sentences | **L3374→L3406**, **L3449→L3481**, **L3341→L3373**; old numbers now point to different text |
| Capability-matrix rows | `grep -nE 'O-0[35]'` | **L261 = O-03** (row 28 durable broker-import), **L274 = O-05** (Reports) — **unchanged** |
| Script evidence keys | `grep` on `scripts/Invoke-DirectP1Provisioning.ps1` | `…_STATE`/`…_DISPOSITION` emitted **only** on the success path (L607–L608); failure path emits `=FAILURE` (L633) |
| Disposition vocabulary | `src/persistence/directP1Provisioning.ts` L242 / L1710 / L1792 | `'PROVISIONED' \| 'ALREADY_PROVISIONED'` |
| DP-V set | `re.findall(r'DP-V\d', …)` | **10 distinct** ids `DP-V0`…`DP-V9`; the operator's 9/9 = DP-V1…DP-V9 |
| P1-F decoupling | occurrence count in the provisioning module | `gateAPrimeProvisioning` → **0**; `execute-claim` → **0** |
| P-31 in IPD | `git grep -l 'P-31' origin/main` (all tracked files) | **0 files** |
| **Gate E W-1 guard (live)** | `evaluatePortSaveGuard()` from compiled `dist/` (`portfolio_store.ts:213`) | **`authorized = false`**; `W-1(3): Gate 4 qualification not accepted`; `W-1(4): Gate 5 admission not accepted` |
| Supplied SHA-256 well-formedness | `re.fullmatch(r'[0-9a-f]{64}', …)` | **true** — 64 chars, lowercase hex only |
| Supplied diagnostic dir vs script format | regex against `DiagnosticRoot\RunId` (ps1 L43, L55, L56) | **matches**; `DiagnosticRoot` is the script default; `RunId` decodes to **2026-11-01 16:27:55.373 UTC** + nonce `d4ac31ea` |
| Chronological consistency | PR #118 `merged_at` vs RunId timestamp | `2026-11-01T14:55:34Z` vs `16:27:55Z` — run is **92 min later**; **consistent** |
| PR #119 merge proof | `gh api …/commits/0a3b5f0f…` | exactly **2 parents**: `279d1eed…`, `571de71…` |
| IRR head | `gh api …/iips-review-recovered/git/refs/heads/main` | **`9e0a0415b76571fc4db1747b2da63c73fa0447d3`** — draft's `d4511549…` **stale, corrected §7** |
| Host / database / `%TEMP%` inspection | — | **NOT PERFORMED — unreachable.** Format checks only; no independent recomputation |
| Database mutation | — | **none.** No provisioning, verify, reset or write against any store |
| Native Windows execution | — | **NOT PERFORMED.** No PowerShell/pwsh invoked; no Windows host contacted |

## Appendix B — corrections made to this record before publication

**B.1 — P-31 search scope (2026-11-01).** An earlier version asserted "P-31 … 0 hits" on the strength
of a narrow `--include='*.md' --include='*.ts' --include='*.csv'` sweep. A wider extension set
returned 4 hits, all **self-referential to the draft**. A definitive all-tracked-file `git grep`
then confirmed **0 files**. The conclusion was unchanged, but the stated evidence was weaker than
claimed and was corrected.

**B.2 — the SHA-256 and diagnostic directory were wrongly recorded as "not supplied" (2026-11-01).**
Both **were** supplied in the original Windows provisioning execution evidence and are recorded
verbatim in §2.1. The underlying mistake was conflating **"not visible inside this Arena session"**
with **"not supplied by the operator."** Only the first is true. The user-reported versus
Arena-verified boundary is **unchanged** by this correction: confirming that a supplied value is
well-formed and internally consistent with the shipped script is **not** independent verification of
the provisioning run.

**B.3 — stale baseline and tracker line numbers (2026-11-02).** The 2026-11-01 draft inspected
`main@0a3b5f0f` and stated that `main` was unchanged since PR #119. `main` has since advanced 6
commits (PRs #120, #121, #122), shifting the tracker by +244/−1 lines. The baseline is now
`56959fc3` (§0.1) and all three tracker citations are restated at current line numbers with the
originals retained (§4). The draft's IRR head reference is likewise stale and corrected (§7 item 2).
**No substantive finding changed**, and no cited source, test or capability-matrix file was modified
between the two baselines.

**B.4 — `evaluatePortSaveGuard` import path.** The guard is exported from
`src/persistence/portfolio_store.ts` **L213**, not from `durablePortfolioStorePort.ts` (which imports
and re-uses it at its own L12/L40 but does not export it). The live evaluation in §5 imports it from
the correct module.

*End of the Direct P1 provisioning status reconciliation.*
