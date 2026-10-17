# IIPS v3.0 — G-2 — **GATE C: WINDOWS READINESS MATRIX AND EXECUTION PACKAGE**

> ## STATUS: **PREPARED — NOT EXECUTED — NO QUALIFICATION RESULT EXISTS**
>
> This record does two things and claims nothing more: it **verifies the Gate C prerequisites**
> against live state, and it **packages the Windows deployment-host run** so that the operator can
> execute it without re-deriving anything. **No check was executed.** No POSIX or Ubuntu result in
> this repository is a Gate C result (`D-GC-F`). Gate C acceptance requires evidence produced on the
> Windows laptop, in the format of §14, and a separate rendered acceptance act (§16).
>
> **Two blockers were found that a plan alone cannot clear** — the provisioned store does not exist
> (§5.1) and the build does not exit 0 (§5.2). Both are stated with their evidence and their exact
> resolution path. Neither was worked around, and no acceptance criterion was weakened.

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-G2-IPD-GATE-C-WINDOWS-READINESS-AND-PACKAGE-2026-10-17-01` |
| **Type** | Readiness verification + execution package (**no authority rendered, nothing executed**) |
| **Governing act** | `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-AUTHORITY-2026-10-17-01` (rendered; blob `9befe6d8…`) — `D-GC-A` … `D-GC-I` |
| **Procedure adopted** | `IIPS-V3-G2-IPD-GATE-C-QUALIFICATION-PROCEDURE-2026-10-17-01` (blob `a263a05c…`), adopted by `D-GC-E1` |
| **Implementation under qualification** | `refs/heads/gate-b/local-principal-ipc-implementation` @ **`cec7080252183a6a5332efe351e61c254d342a2d`**, tree **`22a7438bc41e5b9853700c5a3737702898da8c53`** |
| **Repository** | `ramkivs/iips-production-market-data` only; IRR read-only |
| **Prepared** | 2026-10-17 (Asia/Calcutta) |
| **Production status** | NON_PRODUCTION — one user, one personal laptop (H-18) |

---

# PART I — READINESS

## 1. LIVE STATE AT PREPARATION (re-read, not carried over)

| # | Item | Verified value |
|---|---|---|
| 1 | IPD `main` | `e040002a85097050720748af4e2cace06842700c`, tree `1a29f567…` |
| 2 | PR #9 | `MERGED` 2026-10-17T13:30:33Z; merge `e040002…`; post-merge CI run `39036851167` **success**, 542 executed / 0 failed |
| 3 | PR #8 | **OPEN, unmerged** (`mergedAt: null`), head `89ee6c99f90330f9b7312bee3211a7b0e8d19133`, 38 files, +12 520 / −62, `MERGEABLE`/`CLEAN`; CI run `39039272494` success (556 executed / 0 failed) |
| 4 | `gate-a` | `2ded0e981407b38c73bdea164153f53856aa7217` — unmoved |
| 5 | `gate-b` | `cec7080252183a6a5332efe351e61c254d342a2d`, tree `22a7438bc41e5b9853700c5a3737702898da8c53` — unmoved |
| 6 | `np04-governed-persistence-windows` | `2e11fa3b689d1a3674a5e4ba1f1de9a559e20494` — unmoved, still the only ref containing that commit |
| 7 | Tags | **4**, unchanged; none at `2e11fa3b` or `6828155e` |
| 8 | `6828155e` | exactly one ref (`arena/01a0f308-…`); untouched |
| 9 | Gate C authority | **granted** for Q1–Q4, Q9–Q11 (`D-GC-A`); Q5–Q8 deferred; **not executed** |
| 10 | Qualification environment | **Windows deployment laptop only** (`D-GC-F`); Arena has no path to that host |

---

## 2. DO THE OPEN AUTHORITY HOLDS BLOCK GATE C?

**No — and they do not block it uniformly either.** Each was tested against what the check actually
needs:

| Hold | Blocks preparation? | Blocks execution? | Why |
|---|---|---|---|
| **PR #8 unmerged** | **No** | **No** | The object under qualification is `gate-b` @ `cec7080`, a **different ref**. Gate C never reads PR #8. Its merge is a separate act with its own prohibitions. |
| **CV-25: no tag** | **No** | **No** | Q11 pins by **commit SHA** (`cec7080` / tree `22a7438c…`), not by tag. A tag would add durability, not qualification value. |
| **G24 `6828155e` prohibition** | **No** | **No** | No Gate C check reads, copies, promotes or re-pins that lineage. Fixtures derive from a *provisioned store*, not from the G24 tree. |
| **Gate D / E ungranted** | No | **Yes, for Q5–Q8** | Q5–Q8 are already deferred (`D-GC-A`, `D-GC-C` option 1). They are out of scope, not blocked. |
| **Gate C not executed** | — | — | That is this record's subject, not a dependency. |

**Consequence:** the authority holds are irrelevant to Gate C's *technical* prerequisites. The two
blockers that do matter are in §5, and neither is an authority hold in the PR #8 / CV-25 sense.

---

## 3. PREREQUISITE VERIFICATION AGAINST THE ADOPTED PROCEDURE (§4.7)

| # | Prerequisite (`§4.7`) | Verified state | Result |
|---|---|---|---|
| 1 | Gate C authority act on file naming the procedure and subset | Rendered; procedure adopted by `D-GC-E1`; subset Q1–Q4, Q9–Q11 | **MET** |
| 2 | G-1, G-2, G-3, G-7, G-8, G-9 resolved or explicitly scoped | G-1 `D-GC-B`; G-2 `D-GC-C` option 1; G-3 `D-GC-D`; G-7 `D-GC-G`; G-8 `D-GC-H` (H-1…H-13 ratified); G-9 `D-GC-I` | **MET** |
| 3 | Pinned checkout at `cec7080`; tree `22a7438c…` | Verified live: commit and tree match exactly | **MET** |
| 4 | Build succeeds with the existing scripts; no repository file changed | `npx tsc` **emits** the runtime artefacts but **exits 2** (4 pre-existing errors in 2 test files); `npm run build` exits 2 and never reaches vite. Working tree unchanged | **NOT MET as written — see §5.2** |
| 5 | Disposable copies created from a copy of the provisioned store | **No provisioned store exists anywhere durable**; the Gate A store was created inside an ephemeral Arena sandbox and is gone; the Windows host has never been provisioned | **NOT MET — see §5.1** |
| 6 | Harness + client + frame generator present with recorded `sha256` | Authored, syntax-checked, self-tested (§9–§11); hashes below | **MET (prepared)** |
| 7 | Drift manifest recorded **before** any probe | Expected values computed and frozen (§12.1); the *before* manifest must be produced on the host | **PREPARED** |
| 8 | Operator present on the Windows host; no elevation | Operator exists (Gate V evidence: `desktop-no0nhtp\user`, non-elevated); **Arena has no access to the host** | **EXTERNAL DEPENDENCY** |

**Toolchain identities used for the static checks in this record:** Node `v22.22.3`, libuv `1.51.0`,
TypeScript `5.9.3`, `better-sqlite3` `13.0.3`. **The host runs Node `v24.14.0`** (Gate V evidence) —
a runtime difference recorded in §5.3.

---

## 4. PREREQUISITE MATRIX — ONE ROW PER AUTHORIZED CHECK

| Field | **Q1** | **Q2** | **Q3** | **Q4** | **Q9** | **Q10** | **Q11** |
|---|---|---|---|---|---|---|---|
| **Purpose** | Record the V-5 endpoint-phase inventory on the real host | Prove startup fails closed on every refused precondition | Prove caller-supplied authority gets **zero bytes**, indistinguishably, for 7 classes + nested | Prove reads succeed only for the bound `(applicationUserId, tenantId, portfolioId)` triple | **Mandatory** C5.1 probe: a read-only connection receives **zero bytes** | Prove **exactly one** portfolio store and one owning process | Prove no drift in the 15 files / tree / configs |
| **Existing governed definition** | §6/Q1, S-1 §10 Q1, S-1 §9; V-1–V-4 waived (`D-GC-B`), V-6 out of scope (`D-GC-D`) | §6/Q2; clauses C2, C5.3, C5.5, C6 | §6/Q3; C7 + C6 | §6/Q4; C3, C5.5, C6 | §7 (full spec); S-1 C5.1; S-2 §4.3(3), §6(1); S-3 §5.4 | §6/Q10; C11 | §6/Q11 |
| **Prerequisites** | Running endpoint (depends on Q2/S4); host manifest | Copies **C-E** (control), **C-B** (no ACTIVE binding), **C-D** (A-2 table dropped); plus **S1** env-unset (no store needed) | **C-A**; frame generator; store `sha256` before/after | **C-A** (own / foreign-owner / other-tenant), **C-C** (second principal), **C-B** | Live endpoint on **C-E**; read-only client; direction + liveness controls; counters | C-E endpoint; filesystem inventory; static census | Checkout at `cec7080`; digest tooling |
| **Exact required artifacts / environment** | Windows host, endpoint process, `process.versions` | 4 fixture copies + 1 no-store scenario | Frames file (`gq-frames.mjs` output), 8 probe invocations + 8 controls | Frames file, isolation copies, 5 cases | Frames file, N≥10 cold + 10 warm, 6.5 s window | `dir` inventory of the DB directory, `Get-Process`, census text | `git`, `certutil`/`Get-FileHash` |
| **Execution location** | **Windows host** | **Windows host** (S1 only needs the code, still must be the host) | Windows host | Windows host | Windows host | Windows host (runtime half) + **Arena** (static half) | Windows host (manifests); **Arena** computed the expected values |
| **Procedure** | §12.2 → Q1 | §12.2 → Q2 | §12.2 → Q3 | §12.2 → Q4 | §12.2 → Q9 | §12.2 → Q10 | §12.2 → Q11 |
| **Expected result** | Complete inventory matching the V-P values (`build 26200`, Node `v24.14.0`, libuv `1.51.0`), deviations reconciled | S1–S3: **no connectable endpoint at any point**; S4: pipe present and a control request succeeds | 8/8 classes: **0 bytes**, byte-identical, store unchanged, endpoint still live | Success **iff** the triple matches; all other cases byte-identical to "not found" | **0 bytes** on every read-only probe; liveness + direction controls non-zero | Exactly one `.sqlite`, one owning process, one store module on the IPC path | 15/15 digests + tree identical before and after |
| **Acceptance criterion (existing)** | Inventory complete, deviations reconciled against F-1…F-9 with no design change; the act's recorded reading present | S1–S3 no listener/no fallback; S4 control succeeds — C2/C5.3/C5.5 | 7/7 + nested ⇒ 0 bytes, indistinguishable, store unchanged — C7/C6 | Success iff the triple matches — C3/C5.5/C6 | §7.4 rows 1–8 (0 bytes; admitted; idle-timeout closure; counters; liveness; direction; refusal paths; N/N) | Exactly one store, one owning process, no second store module on the IPC path — C11 | 15/15 identical, tree identical, before and after |
| **Evidence to preserve** | `V5-endpoint-inventory.json` + raw console + host manifest | per-scenario raw logs + `Q2-matrix.json` | `Q3-matrix.jsonl` (one row per class) + raw client output + store digests | `Q4-matrix.jsonl` + raw outputs | `Q9-<runid>.jsonl`, raw client console, raw harness log, manifests | `Q10-inventory.txt`, `Q10-static.txt` | `Q11-manifest-before.json`, `Q11-manifest-after.json` |
| **Status** | **BLOCKED** — store not provisioned (§5.1); *authorized*, not executed | **BLOCKED** — S1 needs the host build run only; S2/S3/S4 need the store | **BLOCKED** (§5.1) | **BLOCKED** (§5.1) | **BLOCKED** (§5.1) | **PARTIAL** — static half prepared (§5.4); runtime half blocked (§5.1) | **BLOCKED on the build prerequisite** — no store needed; `dist` is |
| **Blocker** | Store not provisioned (§5.1) | S1: host build run under B-GC-1; S2–S4: store | C-A cannot be constructed | C-A/C-C cannot be constructed | C-E cannot be constructed | Runtime inventory needs a live endpoint | Host build run under B-GC-1 |

**Reading of the matrix** *(as prepared, 2026-10-17)*. Q11 is the only check with **no** store
dependency; Q2/S1 is a genuine sub-case that also needs no store. Everything else depends on the
provisioned-store defect in §5.1.

**Reconciled 2026-10-17 (after the two renderings).** Both prerequisites are now **authorized** — the
store by `IIPS-V3-G2-IPD-GATE-A-PRIME-PA-DECISION-2026-10-17-01`, the build by
`IIPS-V3-G2-IPD-GATE-C-BUILD-EXCEPTION-PA-DECISION-2026-10-17-01` — and **neither has been
executed**. The statement that Q11 is the only store-independent check stands. **The earlier
implication that Q11 or Q2/S1 could run before the build question was settled is withdrawn**: every
check's runbook compiles the tree and imports `dist/src/ipc/entrypoint.js`, so those two require the
**B-GC-1 host build run** to be recorded first. **No check is runnable on 2026-10-17.**
**Nothing in the matrix depends on PR #8, on a tag, or on the G24 lineage.**

---

## 5. VERIFIED FINDINGS — THE PRECISE BLOCKERS

### 5.1 **BLOCKER 1 — No provisioned store exists; provisioning is not authorized**

*Evidence.* The Gate A execution record states its store was
`/home/user/gate-a-store/ipd-portfolio.sqlite`, created by the Gate A act “once”, offline, “against a
local checkout”. That path is an **Arena sandbox path**, and the sandbox is ephemeral: the directory
is **absent today** (`ls: cannot access`). The record preserves only the **pre-provision backup's**
sha256 (`b100eb7a…`) — and that backup contains **zero provisioned rows** by its own description, so
it cannot substitute.

The Windows host has **never** been provisioned. The Gate V run there used a **disposable probe**
that created a bare named-pipe server — no store, no bindings, no principal.

*Why that blocks Gate C.* Every fixture in §4.4 (C-A … C-E) is defined as “a disposable copy of the
provisioned store”. Without one:

- Q2/S2, S3, S4 have nothing to start (needs C-B, C-D, C-E);
- Q3 and Q4 need C-A (bound principal + owned, foreign-owner and other-tenant portfolios);
- Q9 and Q10 runtime need C-E.

*Why it cannot simply be worked around.* Creating the store means inserting an `application_users`
row, a `tenant_memberships` row and a `local_principal_bindings` row — i.e. **provisioning**. The
governing record is explicit:

> **Tenant administration = NOT AUTHORIZED**
> **Tenant-admin authorization = NOT AUTHORIZED**
> — `NP04-GOVERNANCE-AUTHORITY-RECORD.md` §5.1 (G31/D115 disposition, commit `6828155`)

The Gate A act authorised **one** provisioning, executed **once**, in Arena. It is spent. A second
provisioning — on the Windows host — is a **new act**, not a re-run.

*Smallest resolution paths (either one unblocks Q1–Q4, Q9, Q10):*

- **(a) Re-provision on the Windows host** under a new, bounded Gate A′ act naming that host, the
  store path, and the single-row invariant; **or**
- **(b) Authorise transporting a provisioned store to the host** — which requires the store to exist
  somewhere first, so in practice (a) is the shorter path; **or**
- **(c) Re-scope Gate C to the checks that need no store** (Q11 and Q2/S1 only) — lawful but yields a
  result that cannot close C2/C3/C6/C11 qualification.

**No fixture was created for this record.** Creating one would have been the unauthorized act.

**Resolution instrument (added 2026-10-17; reconciled the same day):** the bounded act for path (a)
was proposed in `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PRIME_WINDOWS_STORE_PROVISIONING_AUTHORITY_REQUEST_2026-10-17.md`
and is now **rendered** as `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PRIME_PA_DECISION_RENDERED_2026-10-17.md`
(`IIPS-V3-G2-IPD-GATE-A-PRIME-PA-DECISION-2026-10-17-01`) — disposition **`APPROVED`**, rule **P-1**
adopted. **The store still does not exist**: a rendered authorization is not an execution, and no
provisioning has occurred.

### 5.2 **BLOCKER 2 — The build does not exit 0 on `cec7080`**

*Evidence (executed on the pinned commit, working tree unchanged afterwards):*
```
$ npm run build          → exit 2   (tsc fails, so `vite build` never runs)
$ npx tsc                → exit 2   (but dist/ is emitted — noEmitOnError is not set)
$ npx tsc --noEmit       → exit 2   (4 errors)
```

The four errors are all in **two pre-existing test files**, not in the fifteen Gate B files:

| File | Errors |
|---|---|
| `tests/wsj_iu3_pit_read_boundary.test.ts` | 3 (`TS2345` ×2, `TS2339`) |
| `tests/wsi_iu1_pit_series_aware_keying.test.ts` | 1 (`TS2322`) |

Cause: the lineage's contracts require `interval` on `OHLCVCandle` while these two older tests still
construct envelope payloads without it. **The Gate B completion handoff already recorded exactly this**
(“0 errors in new scope; 4 errors remain, all pre-existing … `npx tsc` emitted the suite artefacts”).

*Why it matters here.* Procedure §4.7(4) says “Build succeeds with the existing scripts”. At exit-code
level it does **not**. The harness imports `dist/src/ipc/entrypoint.js`, which **is** produced — so the
package remains executable — but the prerequisite as written is unmet.

*Smallest resolution:* a one-line **scoping decision** in the Gate C act or its addendum —
*“build” for this qualification means `npx tsc` emitting the runtime artefacts, with the four
pre-existing test-file errors recorded and excluded* — **or** a bounded repair act for the two test
files. This record does not choose, and does not fix them.

**Resolution instrument (added 2026-10-17; reconciled the same day):** both routes were costed, and a
rule was proposed, in
`evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_BUILD_PREREQUISITE_ACCEPTANCE_REQUEST_2026-10-17.md`; it is
now **rendered** as
`evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_BUILD_EXCEPTION_PA_DECISION_RENDERED_2026-10-17.md`
(`IIPS-V3-G2-IPD-GATE-C-BUILD-EXCEPTION-PA-DECISION-2026-10-17-01`) — rule **B-GC-1** (`C1`–`C8`)
adopted. That round also established, by measurement, that the four diagnostics leave all 644
emitted `dist/src` artefacts byte-identical. **§4.7(4) remains UNSATISFIED in fact**: it may be
recorded as `§4.7(4) SATISFIED UNDER BUILD EXCEPTION` only after the Windows host reproduces C1–C8.

### 5.3 **Deviations to reconcile at execution (not blockers)**

| # | Deviation | Handling |
|---|---|---|
| D-1 | Host runs **Node v24.14.0**; the Gate B suites were executed on **v22.22.3** | Record the host runtime in the manifest; reconcile libuv (`1.51.0` in both, per the Gate V record) exactly as Gate V did. If any observable differs, that is a **V-5 re-read trigger**, not a pass. |
| D-2 | `better-sqlite3@13.0.3` is a **native** module | `npm ci` on the host needs either a prebuilt binary (network) or MSVC build tools + Python. Record which path was used in the environment manifest. |
| D-3 | Q10 static census finds **two** `DurablePortfolioStore` construction sites in `src/` | `src/ipc/entrypoint.ts:252` (the IPC path) and `src/server/http-server.ts:59` (the HTTP path, not started for Gate C). Q10's criterion is “no second store module **on the IPC path**” — met statically — but the runtime inventory must confirm only one process/one file, and the record must state the two sites rather than hide them. |
| D-4 | `IpcServer.stats.activeConnections` lags | Read counters from the harness's STATS stream with a settle interval; do not sample once. |

### 5.4 Arena-executable preparation actually completed (and its limits)

| Work | Result |
|---|---|
| Pinned checkout + build | `cec7080`, tree verified; `dist/src/ipc/entrypoint.js` emitted (11 342 B); **no repository file changed** |
| Harness module resolution | `gq-harness.mjs --self-test` → imports `dist/src/ipc/entrypoint.js`, reports 6 phases, 4 operations, protocol v1, framing round-trip — **no endpoint started, no store opened** |
| Frame generation | 19 frames encoded through the pinned encoder; sample written and inspected |
| Q10 static census | two construction sites (above); **one** `initializePersistenceWithConfig` call site in `src/` (`entrypoint.ts:214`); one `net.createServer` (`server.ts:119`) and one `listen` (`entrypoint.ts:262`) on the IPC path |
| Q11 expected manifest | 15 file digests + `package.json` + `tsconfig.json` + tree hash frozen (§12.1) |

**Not done, deliberately:** no store created, no endpoint started, no probe executed, no fixture
copied. Every one of those would have been either unauthorized or non-qualifying.

---

# PART II — WINDOWS EXECUTION PACKAGE

## 6. IDENTITIES (immutable inputs)

| Element | Value |
|---|---|
| Repository | `https://github.com/ramkivs/iips-production-market-data` |
| Commit | **`cec7080252183a6a5332efe351e61c254d342a2d`** (`refs/heads/gate-b/local-principal-ipc-implementation`) |
| Tree | **`22a7438bc41e5b9853700c5a3737702898da8c53`** |
| Parent | `2ded0e981407b38c73bdea164153f53856aa7217` |
| Changed files | **15 added, +3 139 / −0** |
| `package.json` sha256 | `5346edfdd9dc9048dd0c15635678b1e858346ed2b47bf9ebeae1eeb5e53efacc` |
| `tsconfig.json` sha256 | `ecdcea2f07cacbda5f70b036144e41b893bf7cfbc79cfbf6b0b7f017d07cb119` |
| Built entry point | `dist/src/ipc/entrypoint.js` (ESM; package `"type": "module"`) |
| Store location source | `IPD_PORTFOLIO_DB_PATH` (absolute path; relative ⇒ refused) |
| Endpoint name rule | `^[a-z0-9][a-z0-9._-]{0,63}$`, e.g. `iips-gq-20261018` |
| Protocol | v1; 4-byte BE length + UTF-8 JSON; ops `portfolio.list|get|analytics|save` |
| Limits | request 64 KiB · response 256 KiB · 8 concurrent · **idle timeout 5 000 ms** |
| Startup phases | `VALIDATE_CONFIGURATION → CONNECT_STORE → APPLY_MIGRATIONS → VERIFY_SCHEMA → RESOLVE_PRINCIPAL → BIND_ENDPOINT` |

## 7. HOST AND ENVIRONMENT

| Item | Requirement | How to record |
|---|---|---|
| OS | Windows 11 **build 26200**, 64-bit (the V-P host) | `[System.Environment]::OSVersion.Version` + `winver` capture |
| Account | `desktop-no0nhtp\user`, **not elevated** | `whoami`, SID, `net session` (must fail) |
| Node | **v24.14.0** at `C:\Program Files\nodejs\node.exe` | `node -v`, `node -p "process.versions.uv"` |
| npm | bundled | `npm -v` |
| Native module | `better-sqlite3@13.0.3` must install | `npm ci` log; record prebuild-vs-compile |
| Shell | Windows PowerShell 5.1 or PowerShell 7 | `$PSVersionTable.PSVersion` |
| Location | **Temp directory outside the repository**, e.g. `%TEMP%\iips-gq-<yyyymmdd>` | path recorded |
| Store | **disposable copies only** (`D-GC-I`); the authoritative store is never opened | every DB path recorded |

**Setup:**
```powershell
$root = "C:\iips-gq"                      # any absolute path outside the repo
$repo = "$root\src"                        # checkout of the pinned commit
$work = "$root\run-<yyyymmdd>-01"          # temp package + evidence
New-Item -ItemType Directory -Force $work | Out-Null

git init $repo; git -C $repo remote add origin https://github.com/ramkivs/iips-production-market-data.git
git -C $repo fetch --depth 1 origin cec7080252183a6a5332efe351e61c254d342a2d
git -C $repo checkout cec7080252183a6a5332efe351e61c254d342a2d
git -C $repo rev-parse HEAD; git -C $repo rev-parse "HEAD^{tree}"      # must equal §6
cd $repo; npm ci --no-audit --no-fund; npx tsc                             # emit (see §5.2)
Test-Path .\dist\src\ipc\entrypoint.js                                  # must be True
git -C $repo status --porcelain                                            # must be empty
```

## 8. FIXTURES — CONSTRUCTION AND ITS BLOCKER

| Copy | Definition (adopted procedure §4.4) | Construct by | Status |
|---|---|---|---|
| **C-E** | Untouched valid copy — control | Copy the provisioned store file | **IMPOSSIBLE — no provisioned store (§5.1)** |
| **C-B** | Zero `ACTIVE` bindings (revoked) | Copy C-E, then revoke the single binding by the documented one-way revocation | **IMPOSSIBLE** |
| **C-D** | A-2 table removed, ledger still at `003` | Copy C-E, then `DROP TABLE local_principal_bindings` | **IMPOSSIBLE** |
| **C-A** | Bound principal + one owned portfolio + one foreign-owner + one other-tenant portfolio | Copy C-E, then seed the three portfolios through the store’s own write API **in the copy** | **IMPOSSIBLE** |
| **C-C** | Second principal bound; a portfolio owned by the first | Copy C-A, then bind a second principal | **IMPOSSIBLE** |

**Rule that does not change:** every fixture is a **copy**; the authoritative store is never opened,
written or used (`D-GC-I`). **Rule added by this record:** no fixture may be created until the store
question in §5.1 is resolved by act — creating one is provisioning.

## 9. HARNESS — `gq-harness.mjs` (sha256 `ba508083…`, 156 lines)

Runs outside the repository against the built checkout. Starts the endpoint, logs JSONL, polls the
endpoint's own counters and local refusal sink, and shuts down on a stop file (Windows has no clean
SIGTERM from PowerShell). Contains **no protocol logic** and **no repository change**.
```javascript
#!/usr/bin/env node
/**
 * Gate C operator harness (server side).
 *
 * Runs OUTSIDE the repository, from a temp directory, against a BUILT checkout.
 * It starts the Gate B IPC endpoint, logs JSONL evidence, and polls the endpoint's own
 * counters and local refusal sink — nothing is added to the repository, no package.json
 * script is created, and no protocol logic lives here (framing is generated offline).
 *
 * Usage:
 *   node gq-harness.mjs --module <abs path to dist/src/ipc/entrypoint.js>
 *                       --endpoint <pipe name> --db <abs path to disposable .sqlite>
 *                       --log <abs path to .jsonl> [--stopfile <abs path>]
 *                       [--scenario <tag>] [--self-test]
 */
import { appendFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const arg = (name, fallback = undefined) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const flag = (name) => process.argv.includes(`--${name}`);

const modulePath = arg('module');
const endpointName = arg('endpoint');
const dbPath = arg('db');
const logPath = arg('log');
const stopFile = arg('stopfile');
const scenario = arg('scenario', 'unspecified');

if (!modulePath) {
  console.error('HARNESS_ERROR missing --module');
  process.exit(64);
}

const mod = await import(pathToFileURL(modulePath).href);

// ---- self-test: import + version + framing only. Starts NO endpoint, opens NO store.
if (flag('self-test')) {
  const framing = await import(pathToFileURL(modulePath.replace(/entrypoint\.js$/, 'framing.js')).href);
  const sample = framing.encodeFrame({ v: 1, op: 'portfolio.list', requestId: 'self-test' });
  const decoded = framing.decodeEnvelope(sample.subarray(4));
  console.log(JSON.stringify({
    selfTest: 'OK',
    node: process.version,
    uv: process.versions.uv,
    platform: process.platform,
    phases: mod.IPC_STARTUP_PHASES,
    operations: framing.IPC_OPERATIONS,
    protocolVersion: framing.IPC_PROTOCOL_VERSION,
    sampleFrameBytes: sample.length,
    decoded,
  }, null, 2));
  process.exit(0);
}

if (!endpointName || !dbPath || !logPath) {
  console.error('HARNESS_ERROR --endpoint, --db and --log are all required');
  process.exit(64);
}

// The endpoint reads its store location exclusively from this variable.
process.env.IPD_PORTFOLIO_DB_PATH = dbPath;

const runId = arg('runid', `GQ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`);
const write = (record) => appendFileSync(logPath, `${JSON.stringify({ runId, scenario, at: new Date().toISOString(), ...record })}\n`);

write({
  event: 'HARNESS_START',
  node: process.version,
  uv: process.versions.uv,
  platform: process.platform,
  arch: process.arch,
  endpointName,
  dbPath,
  modulePath,
  cwd: process.cwd(),
  pid: process.pid,
});

let handle;
try {
  handle = await mod.startIpcEndpoint({
    endpointName,
    onPhase: (phase) => write({ event: 'PHASE', phase }),
    refusalSink: undefined, // default sink is created by the endpoint; read below
  });
} catch (error) {
  write({
    event: 'START_REFUSED',
    errorName: error?.constructor?.name ?? 'Error',
    errorCode: error?.code ?? null,
    errorMessage: String(error?.message ?? error),
    phases: error?.phases ?? null,
  });
  console.error(`HARNESS_START_REFUSED ${error?.code ?? ''} ${error?.message ?? error}`);
  process.exit(75); // EX_TEMPFAIL: the run produced a refusal, not a result
}

write({
  event: 'HARNESS_READY',
  phases: handle.phases,
  principal: handle.principal,
  schemaVersion: handle.schemaVersion,
  layout: { path: handle.layout?.path ?? null, modeEnforced: handle.layout?.modeEnforced ?? null },
});

// Publish a single machine-readable ready line the orchestrator waits for.
console.log(`HARNESS_READY ${JSON.stringify({ endpointName, pid: process.pid, phases: handle.phases })}`);

let last = { acceptedConnections: -1, refusedConnections: -1, activeConnections: -1, sink: -1 };
const timer = setInterval(() => {
  const stats = handle.server.stats;
  const sinkCount = handle.server.refusalSink.count();
  if (
    stats.acceptedConnections !== last.acceptedConnections ||
    stats.refusedConnections !== last.refusedConnections ||
    stats.activeConnections !== last.activeConnections ||
    sinkCount !== last.sink
  ) {
    last = { ...stats, sink: sinkCount };
    write({
      event: 'STATS',
      stats,
      refusalCount: sinkCount,
      // Reasons are operator-side only; they are never transmitted to a client (C6).
      refusalReasons: handle.server.refusalSink.reasons().slice(-12),
    });
  }
}, 250);

const shutdown = async (signal) => {
  clearInterval(timer);
  const stats = handle.server.stats;
  const reasons = handle.server.refusalSink.reasons();
  write({ event: 'HARNESS_STOP', signal, stats, refusalReasons: reasons });
  try {
    await handle.close();
  } finally {
    write({ event: 'HARNESS_CLOSED', stats });
    process.exit(0);
  }
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

// Windows has no clean SIGTERM from PowerShell; the operator creates a stop file instead.
if (stopFile) {
  const watcher = setInterval(() => {
    if (existsSync(stopFile)) {
      clearInterval(watcher);
      void shutdown('stop-file');
    }
  }, 250);
}
```

**Self-test (executed here, POSIX, non-qualifying):**
```
$ node gq-harness.mjs --module dist/src/ipc/entrypoint.js --self-test
{ "selfTest": "OK", "node": "v22.22.3", "uv": "1.51.0", "platform": "linux",
  "phases": [6 phases], "operations": [4 ops], "protocolVersion": 1,
  "sampleFrameBytes": 57, "decoded": {"v":1,"op":"portfolio.list","requestId":"self-test"} }
```

**Exit codes:** `0` closed cleanly · `64` bad arguments · `75` **startup refused** (a real observation
for Q2/S1–S3, not an error) · `1` unexpected failure.

## 10. CLIENT — `gq-client.ps1` (sha256 `c9916c8c…`, 116 lines)

One connection per invocation. Implements no protocol: it writes a pre-built hex frame and counts
bytes. Records `connected`, `bytesReceived`, `firstByteMs`, `closeReason`, `exceptionType`,
`nativeErrorCode`, `elapsedMs`, machine/account. Exit `0` = observation recorded (any byte count);
exit `2` = connect/IO failure (the expected outcome for Q2/S1–S3).
```powershell
<#
  Gate C operator client. One connection per invocation.

  Implements NO protocol: it writes a pre-built frame supplied as hex (generated offline by
  the frame generator) and counts bytes received. Refusal paths receive zero bytes and a
  closed connection — that is the observation, not an error to be retried.

  Output: one JSON object on stdout (also appended to -OutFile when supplied).
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$PipeName,
  [Parameter(Mandatory = $true)][ValidateSet('In', 'Out', 'InOut')][string]$Direction,
  [string]$FrameHex = '',
  [int]$WindowMs = 6500,
  [switch]$NoFrame,
  [string]$OutFile = ''
)

$ErrorActionPreference = 'Stop'
$result = [ordered]@{
  utc            = (Get-Date).ToUniversalTime().ToString('o')
  pipeName       = $PipeName
  direction      = $Direction
  frameBytes     = 0
  frameSent      = $false
  connected      = $false
  connectMs      = $null
  bytesReceived  = 0
  receivedHex    = ''
  elapsedMs      = $null
  firstByteMs    = $null
  closeReason    = $null
  exceptionType  = $null
  exceptionMsg   = $null
  nativeErrorCode = $null
  machine        = $env:COMPUTERNAME
  user           = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
}

$pipePath = "\\.\pipe\$PipeName"
$stream = $null
$sw = [System.Diagnostics.Stopwatch]::StartNew()

try {
  $dir = [System.IO.Pipes.PipeDirection]$Direction
  $stream = New-Object System.IO.Pipes.NamedPipeClientStream('.', $PipeName, $dir)

  # F-5: a read-only open of a duplex pipe must be admitted; refusal here is recorded
  # as a distinct outcome, never as a zero-byte result.
  $stream.Connect(5000)
  $result.connected = $true
  $result.connectMs = $sw.ElapsedMilliseconds

  if (-not $NoFrame -and -not [string]::IsNullOrWhiteSpace($FrameHex) -and $Direction -ne 'In') {
    $bytes = [byte[]]::new($FrameHex.Length / 2)
    for ($i = 0; $i -lt $bytes.Length; $i++) {
      $bytes[$i] = [Convert]::ToByte($FrameHex.Substring($i * 2, 2), 16)
    }
    $result.frameBytes = $bytes.Length
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Flush()
    $result.frameSent = $true
  }

  $buffer = [byte[]]::new(8192)
  $all = New-Object System.Collections.Generic.List[byte]
  while ($sw.ElapsedMilliseconds -lt $WindowMs) {
    if (-not $stream.IsConnected) { $result.closeReason = 'server-closed'; break }
    if ($stream.CanRead) {
      try {
        $read = $stream.Read($buffer, 0, $buffer.Length)
      } catch {
        $result.closeReason = 'read-exception'
        $result.exceptionType = $_.Exception.GetType().FullName
        $result.exceptionMsg = $_.Exception.Message
        break
      }
      if ($read -le 0) { $result.closeReason = 'eof'; break }
      if ($null -eq $result.firstByteMs) { $result.firstByteMs = $sw.ElapsedMilliseconds }
      for ($j = 0; $j -lt $read; $j++) { $all.Add($buffer[$j]) }
      $result.bytesReceived += $read
      # A response frame is complete once its 4-byte big-endian length is satisfied.
      if ($all.Count -ge 4) {
        $declared = ([int]$all[0] -shl 24) -bor ([int]$all[1] -shl 16) -bor ([int]$all[2] -shl 8) -bor [int]$all[3]
        if ($all.Count -ge 4 + $declared) { $result.closeReason = 'frame-complete'; break }
      }
    } else {
      Start-Sleep -Milliseconds 50
    }
  }
  if ($null -eq $result.closeReason) { $result.closeReason = 'window-expired' }
} catch {
  $result.exceptionType = $_.Exception.GetType().FullName
  $result.exceptionMsg = $_.Exception.Message
  $inner = $_.Exception.InnerException
  while ($null -ne $inner) {
    if ($inner -is [System.ComponentModel.Win32Exception]) { $result.nativeErrorCode = $inner.NativeErrorCode; break }
    $inner = $inner.InnerException
  }
  if ($null -eq $result.closeReason) { $result.closeReason = 'connect-or-io-failure' }
} finally {
  $result.elapsedMs = $sw.ElapsedMilliseconds
  if ($null -ne $stream) { try { $stream.Dispose() } catch { } }
}

if ($result.bytesReceived -gt 0) {
  $result.receivedHex = -join ($all.GetRange(0, [Math]::Min(64, $all.Count)) | ForEach-Object { $_.ToString('x2') })
}

$json = ($result | ConvertTo-Json -Compress)
Write-Output $json
if (-not [string]::IsNullOrWhiteSpace($OutFile)) { Add-Content -Path $OutFile -Value $json -Encoding UTF8 }

# Exit codes: 0 observation recorded (any byte count); 2 connect/IO failure.
if ($result.connected -eq $false) { exit 2 } else { exit 0 }
```

## 11. FRAME GENERATOR — `gq-frames.mjs` (sha256 `a0927473…`, 74 lines)

Builds all 19 frames through the **pinned** encoder, so the bytes cannot drift from the
implementation. Requires the real portfolio ids from the fixtures.
```javascript
#!/usr/bin/env node
/**
 * Offline frame generator — builds the exact request frames for Q3/Q4/Q9 as hex.
 * Imports the PINNED build's encoder so the bytes cannot drift from the implementation.
 * Opens no store and starts no endpoint.
 *
 * Usage:
 *   node gq-frames.mjs --framing <abs>/dist/src/ipc/framing.js \
 *        --owned <portfolioId of the bound principal> \
 *        --foreign <portfolioId owned by another owner> \
 *        --tenant <portfolioId of another tenant> \
 *        --out frames.json
 */
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const arg = (n, d = undefined) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};

const framingPath = arg('framing');
const owned = arg('owned');
const foreign = arg('foreign', 'PORTFOLIO_FOREIGN_OWNER');
const tenant = arg('tenant', 'PORTFOLIO_OTHER_TENANT');
const out = arg('out', 'frames.json');

if (!framingPath || !owned) {
  console.error('FRAMEGEN_ERROR --framing and --owned are required');
  process.exit(64);
}

const framing = await import(pathToFileURL(framingPath).href);
const hex = (o) => framing.encodeFrame(o).toString('hex');

// Q3 classes: the claim key is carried in the payload of an operation that accepts one.
const claim = (key, value) => hex({ v: 1, op: 'portfolio.get', payload: { portfolioId: owned, [key]: value }, requestId: `q3-${key}` });

const frames = {
  // Controls and positive reads
  'control.list':            hex({ v: 1, op: 'portfolio.list', requestId: 'ctl-list' }),
  'control.get.owned':       hex({ v: 1, op: 'portfolio.get', payload: { portfolioId: owned }, requestId: 'ctl-get' }),
  'analytics.owned':         hex({ v: 1, op: 'portfolio.analytics', payload: { portfolioId: owned }, requestId: 'q3-analytics' }),
  'save.refusal':            hex({ v: 1, op: 'portfolio.save', payload: { portfolioId: owned, holdings: [] }, requestId: 'q3-save' }),

  // Q4 isolation cases
  'isolation.foreign-owner': hex({ v: 1, op: 'portfolio.get', payload: { portfolioId: foreign }, requestId: 'q4-foreign' }),
  'isolation.other-tenant':  hex({ v: 1, op: 'portfolio.get', payload: { portfolioId: tenant }, requestId: 'q4-tenant' }),
  'isolation.missing-id':    hex({ v: 1, op: 'portfolio.get', payload: { portfolioId: 'pf-00000000-0000-4000-8000-000000000000' }, requestId: 'q4-missing' }),

  // Q3 seven claim classes + one nested case
  'claim.principal':         claim('principal', 'caller-chosen'),
  'claim.owner':             claim('ownerId', 'caller-chosen'),
  'claim.tenant':            claim('tenantId', 'caller-chosen'),
  'claim.scope':             claim('scope', 'caller-chosen'),
  'claim.companyId':         claim('companyId', 'caller-chosen'),
  'claim.identityStatus':    claim('identityStatus', 'RESOLVED'),
  'claim.resolution':        claim('resolutionDisposition', 'RESOLVED'),
  'claim.nested':            hex({
                               v: 1, op: 'portfolio.get',
                               payload: { portfolioId: owned, holdings: [{ owner: 'caller-chosen' }] },
                               requestId: 'q3-nested',
                             }),

  // Q9 refusal paths
  'refusal.malformed-json':   Buffer.from('{{{{', 'utf8').toString('hex'),
  'refusal.unknown-version':  hex({ v: 99, op: 'portfolio.list', requestId: 'q9-version' }),
  'refusal.unknown-operation': hex({ v: 1, op: 'portfolio.delete', requestId: 'q9-operation' }),
  // Declared length 65537 > maxRequestBytes (65536): header only, no body.
  'refusal.oversize':          Buffer.from([0x00, 0x01, 0x00, 0x01]).toString('hex'),
};

writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), owned, foreign, tenant, frames }, null, 2));
console.log(`FRAMES_WRITTEN ${out} keys=${Object.keys(frames).length}`);
```

Worked values (placeholders as shown; regenerate with the real ids on the host):

| Frame | Bytes | Hex (prefix) |
|---|---|---|
| `control.list` | 52 | `000000347b2276223a312c226f70223a22706f7274666f6c696f2e6c69737422…` |
| `refusal.malformed-json` | 4 | `7b7b7b7b` |
| `refusal.oversize` | 4 | `00010001` (declared 65 537 > 65 536) |

## 11A. OPERATOR HELPERS — `gq-lib.ps1` (sha256 `ddd1289dfc15e5f1…`, 75 lines)

Dot-source this beside the harness. It starts the harness with a log and stop file, waits for the
`HARNESS_READY` record (or a `START_REFUSED` record), stops it gracefully, reads the last counter
sample, and wraps the client so a probe returns a parsed object.

```powershell
<#
  Gate C operator helpers. Dot-source this file:  . .\gq-lib.ps1
  Requires $GqDir (the temp package directory) and $Node (node.exe path) to be set.
#>

function Start-GqHarness {
  param(
    [Parameter(Mandatory)][string]$Scenario,
    [Parameter(Mandatory)][string]$Endpoint,
    [Parameter(Mandatory)][string]$Db,
    [Parameter(Mandatory)][string]$Log,
    [string]$Module = "$PSScriptRoot\dist\src\ipc\entrypoint.js"
  )
  $stop = "$Log.stop"
  Remove-Item -Force -ErrorAction SilentlyContinue $stop, $Log
  $err = "$Log.stderr.txt"
  $args = @(
    "$PSScriptRoot\gq-harness.mjs",
    '--module', $Module, '--endpoint', $Endpoint, '--db', $Db,
    '--log', $Log, '--stopfile', $stop, '--scenario', $Scenario
  )
  $p = Start-Process -FilePath $Node -ArgumentList $args -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput "$Log.stdout.txt" -RedirectStandardError $err
  $deadline = (Get-Date).AddSeconds(30)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 200
    if (Test-Path $Log) {
      $lines = Get-Content $Log
      if ($lines | Where-Object { $_ -match '"event":"HARNESS_READY"' }) {
        return [pscustomobject]@{ Pid = $p.Id; Ready = $true; Refused = $false; Log = $Log; StopFile = $stop }
      }
      if ($lines | Where-Object { $_ -match '"event":"START_REFUSED"' }) {
        return [pscustomobject]@{ Pid = $p.Id; Ready = $false; Refused = $true; Log = $Log; StopFile = $stop }
      }
    }
    if ($p.HasExited) { break }
  }
  return [pscustomobject]@{ Pid = $p.Id; Ready = $false; Refused = $false; Log = $Log; StopFile = $stop }
}

function Stop-GqHarness {
  param([Parameter(Mandatory)]$Handle)
  New-Item -ItemType File -Force -Path $Handle.StopFile | Out-Null
  $deadline = (Get-Date).AddSeconds(20)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 200
    if (Get-Content $Handle.Log -ErrorAction SilentlyContinue | Where-Object { $_ -match '"event":"HARNESS_CLOSED"' }) { break }
  }
  $proc = Get-Process -Id $Handle.Pid -ErrorAction SilentlyContinue
  if ($proc) { Stop-Process -Id $Handle.Pid -Force; Write-Warning "harness $($Handle.Pid) required forced stop" }
  return ($Handle.Log -replace '\.jsonl$', '') + '.final.jsonl'
}

function Get-GqStats {
  param([Parameter(Mandatory)][string]$Log)
  $last = Get-Content $Log | Where-Object { $_ -match '"event":"STATS"' } | Select-Object -Last 1
  if (-not $last) { return $null }
  return ($last | ConvertFrom-Json)
}

function Invoke-GqProbe {
  param(
    [Parameter(Mandatory)][string]$Endpoint,
    [Parameter(Mandatory)][ValidateSet('In', 'Out', 'InOut')][string]$Direction,
    [string]$FrameHex = '',
    [int]$WindowMs = 6500,
    [string]$OutFile = ''
  )
  $p = @{ PipeName = $Endpoint; Direction = $Direction; WindowMs = $WindowMs }
  if ($FrameHex) { $p.FrameHex = $FrameHex }
  if ($OutFile) { $p.OutFile = $OutFile }
  $json = & "$PSScriptRoot\gq-client.ps1" @p
  if ($LASTEXITCODE -ne 0 -and -not $json) { return $null }
  return ($json | ConvertFrom-Json)
}
```

## 12. RUNBOOK — ONE COMMAND BLOCK PER CHECK, IN THE ADOPTED ORDER

> Order is fixed by procedure §5: **Q11-before → Q2 → Q10 → Q9 → Q3 → Q4 → Q1 → Q11-after**.
> Do not reorder, and do not run Q3/Q4/Q9 before Q2/S4 shows a live endpoint.

### 12.0 Session setup (once)

**Build gate — before any command in this runbook.** `dist\src\ipc\entrypoint.js` must exist and the
build must be recorded under **B-GC-1** (`IIPS-V3-G2-IPD-GATE-C-BUILD-EXCEPTION-PA-DECISION-2026-10-17-01`):
run `npx tsc`, `npm run build`, `npx vite build`, and the C5/C6 scratch-copy causality check, each
with its exit code and full output, then record the eight conditions. **If the disposition recorded is
`INVALID` — or the build has not been run — no check in this runbook may proceed.**

```powershell
. "$work\gq-lib.ps1"                                     # sha256 ddd1289d…
$Node     = "C:\Program Files\nodejs\node.exe"
$Module   = "$repo\dist\src\ipc\entrypoint.js"
$runId    = "GQ-$(Get-Date -Format yyyyMMdd)-01"
$endpoint = "iips-gq-$(Get-Date -Format yyyyMMdd)"
$ev       = "$work\evidence"; New-Item -ItemType Directory -Force $ev | Out-Null
# Build the frames from the PINNED encoder, then load them:
#   node gq-frames.mjs --framing "$repo\dist\src\ipc\framing.js" --owned <C-A owned id> \
#        --foreign <C-A foreign-owner id> --tenant <C-A other-tenant id> --out "$work\frames.json"
$frames   = Get-Content "$work\frames.json" | ConvertFrom-Json

# Host manifest
$hostManifest = [ordered]@{
  runId = $runId; utc = (Get-Date).ToUniversalTime().ToString('o')
  os = [System.Environment]::OSVersion.VersionString
  account = (whoami); elevated = [bool](net session 2>$null)
  node = (& $Node -v); uv = (& $Node -p "process.versions.uv")
  npm = (npm -v); ps = $PSVersionTable.PSVersion.ToString()
  commit = (git -C $repo rev-parse HEAD); tree = (git -C $repo rev-parse 'HEAD^{tree}')
  endpointName = $endpoint
}
$hostManifest | ConvertTo-Json | Tee-Object "$ev\host-manifest.json"
```

### 12.1 **Q11-before** — drift manifest (no store, no endpoint)
```powershell
$files = @(
 'src/ipc/endpoint.ts','src/ipc/entrypoint.ts','src/ipc/errors.ts','src/ipc/framing.ts',
 'src/ipc/index.ts','src/ipc/server.ts','src/user_portfolio/canonical_identity.ts',
 'src/user_portfolio/errors.ts','src/user_portfolio/index.ts','src/user_portfolio/operations.ts',
 'tests/gate_b_canonical_identity.test.ts','tests/gate_b_ipc_endpoint.test.ts',
 'tests/gate_b_ipc_refusals.test.ts','tests/gate_b_support.test.ts',
 'tests/gate_b_user_portfolio_operations.test.ts','package.json','tsconfig.json')
$before = [ordered]@{ runId=$runId; phase='before'; tree=(git -C $repo rev-parse 'HEAD^{tree}'); files=[ordered]@{} }
foreach ($f in $files) { $before.files[$f] = (Get-FileHash "$repo\$f" -Algorithm SHA256).Hash.ToLower() }
$before | ConvertTo-Json -Depth 5 | Tee-Object "$ev\Q11-manifest-before.json"
```

**Expected values — frozen here, compare verbatim.** Any mismatch is a **drift / invalid run**, not a
failure of the implementation:

| File | Expected sha256 |
|---|---|
| `src/ipc/endpoint.ts` | `4179c45f6500c938e12a15a487d58f5b82c40c25515088c01d210a42861cf8ac` |
| `src/ipc/entrypoint.ts` | `3ce845b1670ef0d4b71533ffbe18f0b0841413a7917d98dbeac7bccd1b90602b` |
| `src/ipc/errors.ts` | `617905b7d3a518eed829e3e0032befe1a2ab5776428569a21f7e1b6066af8e30` |
| `src/ipc/framing.ts` | `afc71ddbe138875266fb5c4652aaf9ae4e187252b34b13e02bc497d3b2652da9` |
| `src/ipc/index.ts` | `7bb015d31fb13539f6167885ed96e0b91e613c4a695d9e7d7d5e408a5be42612` |
| `src/ipc/server.ts` | `7e24cee082b0c427d2f9171575bd37a3c221dff3271a858ff1397e4b56d3939d` |
| `src/user_portfolio/canonical_identity.ts` | `81701c47aaafdc5fdd446746d24a121d666f98580f83783da064e6dd6103631b` |
| `src/user_portfolio/errors.ts` | `8c0745c7e77012f043878bcf556b08014f6159a3e137d91d699de150070ad908` |
| `src/user_portfolio/index.ts` | `c915618b495e364beda4efc49b6a04f3ae242471767447a89a1c52026cb44bbd` |
| `src/user_portfolio/operations.ts` | `d141dd583dba937f0e10584e67bdc0fe2e5146ef5a6d3f47f9f22e541728e8a4` |
| `tests/gate_b_canonical_identity.test.ts` | `e46c94d0ba3fd65afe8f2a334cd1b9a74d8c4b5620b3db6151f1d881e268914c` |
| `tests/gate_b_ipc_endpoint.test.ts` | `c4e2146ed965cb41da3eac89e983db3e96df6034fa82491250da1a91e8bc2250` |
| `tests/gate_b_ipc_refusals.test.ts` | `bb6cfe8678e4e97991cc48a6fcec4e7bb7968402183720a0dd1e6c5ca661771b` |
| `tests/gate_b_support.test.ts` | `730445f79904f9594b4175292d755b082abc441192ae6e706de429806c9ef4a2` |
| `tests/gate_b_user_portfolio_operations.test.ts` | `015352c3e137297b09cf0a027821bd97964efd7dcb249f23fb833126d98bad9e` |
| `package.json` | `5346edfdd9dc9048dd0c15635678b1e858346ed2b47bf9ebeae1eeb5e53efacc` |
| `tsconfig.json` | `ecdcea2f07cacbda5f70b036144e41b893bf7cfbc79cfbf6b0b7f017d07cb119` |

Tree must be `22a7438bc41e5b9853700c5a3737702898da8c53`.

### 12.2 Per check

> **One harness process per scenario, one endpoint name per scenario.** A second process on the same
> pipe name is refused (`EADDRINUSE`/bind-refusal) by design — that is not a Q2 observation, it is an
> operator error. Use `$ep = "$endpoint-$tag"` with a distinct `$tag` per scenario, and confirm the
> previous harness logged `HARNESS_CLOSED` before starting the next one.

**Q2 — startup fail-closed** (S1 needs **no store**; S2–S4 need C-B / C-D / C-E)

```powershell
# ---- S1: IPD_PORTFOLIO_DB_PATH unset. No store involved at all.
$ep = "$endpoint-s1"; Remove-Item Env:\IPD_PORTFOLIO_DB_PATH -ErrorAction SilentlyContinue
$h = Start-GqHarness -Scenario 'Q2-S1-env-unset' -Endpoint $ep -Db "$work\unused.sqlite" -Log "$ev\Q2-S1.jsonl" -Module $Module
# Expect: Refused=$true  (START_REFUSED, phases = VALIDATE_CONFIGURATION only, exit 75)
Test-Path "\\.\pipe\$ep"                       # must be False
Invoke-GqProbe -Endpoint $ep -Direction In     # must exit 2 (no pipe)

# ---- S2: zero ACTIVE bindings (C-B)
$ep = "$endpoint-s2"; $env:IPD_PORTFOLIO_DB_PATH = "$work\fixtures\C-B.sqlite"
$h = Start-GqHarness -Scenario 'Q2-S2-no-binding' -Endpoint $ep -Db $env:IPD_PORTFOLIO_DB_PATH -Log "$ev\Q2-S2.jsonl" -Module $Module
Test-Path "\\.\pipe\$ep"                       # must be False

# ---- S3: A-2 table dropped, ledger at 003 (C-D)
$ep = "$endpoint-s3"; $env:IPD_PORTFOLIO_DB_PATH = "$work\fixtures\C-D.sqlite"
$h = Start-GqHarness -Scenario 'Q2-S3-no-table' -Endpoint $ep -Db $env:IPD_PORTFOLIO_DB_PATH -Log "$ev\Q2-S3.jsonl" -Module $Module
Test-Path "\\.\pipe\$ep"                       # must be False

# ---- S4: control — valid copy binds and answers
$ep = "$endpoint-s4"; $env:IPD_PORTFOLIO_DB_PATH = "$work\fixtures\C-E.sqlite"
$h = Start-GqHarness -Scenario 'Q2-S4-control' -Endpoint $ep -Db $env:IPD_PORTFOLIO_DB_PATH -Log "$ev\Q2-S4.jsonl" -Module $Module
$ctl = Invoke-GqProbe -Endpoint $ep -Direction InOut -FrameHex $frames.frames.'control.list' -OutFile "$ev\Q2-client.jsonl"
$ctl.bytesReceived                             # must be > 0  (control direction proven)
Stop-GqHarness -Handle $h
[pscustomobject]@{ S1=(Test-Path "$ev\Q2-S1.jsonl"); S2=(Test-Path "$ev\Q2-S2.jsonl"); S3=(Test-Path "$ev\Q2-S3.jsonl"); S4=($ctl.bytesReceived -gt 0) } |
  ConvertTo-Json | Tee-Object "$ev\Q2-matrix.json"
```

**Q10 — exactly one portfolio store** (static half can be done anywhere; runtime half needs C-E)

```powershell
# Static census — expected: 2 constructions (src/ipc/entrypoint.ts:252, src/server/http-server.ts:59);
# exactly 1 initializePersistenceWithConfig CALL SITE (src/ipc/entrypoint.ts:214).
Get-ChildItem "$repo\src" -Recurse -Filter *.ts |
  Select-String -Pattern 'new DurablePortfolioStore|initializePersistenceWithConfig\(' |
  Select-Object Path, LineNumber, Line | Tee-Object "$ev\Q10-static.txt"

# Runtime inventory — one store file, one owning process
$ep = "$endpoint-q10"; $env:IPD_PORTFOLIO_DB_PATH = "$work\fixtures\C-E.sqlite"
$h = Start-GqHarness -Scenario 'Q10' -Endpoint $ep -Db $env:IPD_PORTFOLIO_DB_PATH -Log "$ev\Q10.jsonl" -Module $Module
Get-ChildItem (Split-Path $env:IPD_PORTFOLIO_DB_PATH) -Force |
  Select-Object Name, Length, LastWriteTimeUtc | Tee-Object "$ev\Q10-inventory.txt"
Get-Process -Id $h.Pid | Select-Object Id, ProcessName, StartTimeUtc | Tee-Object -Append "$ev\Q10-inventory.txt"
Stop-GqHarness -Handle $h
# Acceptance: exactly one *.sqlite in the directory (plus its -wal/-shm while open), one owning PID.
```

**Q9 — mandatory zero-bytes probe** (needs C-E; N = 10 cold + 10 warm; window 6 500 ms > 5 000 ms idle timeout)

```powershell
$ep = "$endpoint-q9"; $env:IPD_PORTFOLIO_DB_PATH = "$work\fixtures\C-E.sqlite"
$h = Start-GqHarness -Scenario 'Q9' -Endpoint $ep -Db $env:IPD_PORTFOLIO_DB_PATH -Log "$ev\Q9.jsonl" -Module $Module

# 1) liveness control, immediately before the probes
$live1 = Invoke-GqProbe -Endpoint $ep -Direction InOut -FrameHex $frames.frames.'control.list' -OutFile "$ev\Q9-client.jsonl"
# 2) direction control (same closed connection type, valid frame)
$dir   = Invoke-GqProbe -Endpoint $ep -Direction InOut -FrameHex $frames.frames.'control.get.owned' -OutFile "$ev\Q9-client.jsonl"
# 3) read-only probes: Direction In, NO frame written, 6.5 s window
$probes = 1..10 | ForEach-Object {
  $r = Invoke-GqProbe -Endpoint $ep -Direction In -WindowMs 6500 -OutFile "$ev\Q9-client.jsonl"
  [pscustomobject]@{ i=$_; connected=$r.connected; bytes=$r.bytesReceived; close=$r.closeReason; elapsed=$r.elapsedMs }
}
$probes | Export-Csv "$ev\Q9-probes.csv" -NoTypeInformation
# 4) refusal paths — each must yield 0 bytes and a closed connection
$ref = foreach ($k in 'refusal.malformed-json','refusal.oversize','refusal.unknown-version','refusal.unknown-operation') {
  $r = Invoke-GqProbe -Endpoint $ep -Direction InOut -FrameHex $frames.frames.$k -OutFile "$ev\Q9-client.jsonl"
  [pscustomobject]@{ path=$k; bytes=$r.bytesReceived; close=$r.closeReason }
}
$ref | Export-Csv "$ev\Q9-refusals.csv" -NoTypeInformation
# 5) liveness control after, then stop
$live2 = Invoke-GqProbe -Endpoint $ep -Direction InOut -FrameHex $frames.frames.'control.list' -OutFile "$ev\Q9-client.jsonl"
Stop-GqHarness -Handle $h
Get-GqStats -Log "$ev\Q9.jsonl" | Tee-Object -Append "$ev\Q9-counters.txt"

[pscustomobject]@{ live1=$live1.bytesReceived; direction=$dir.bytesReceived; live2=$live2.bytesReceived;
                   maxProbeBytes=($probes.bytes | Measure-Object -Maximum).Maximum;
                   maxRefusalBytes=($ref.bytes | Measure-Object -Maximum).Maximum } |
  ConvertTo-Json | Tee-Object "$ev\Q9-summary.json"
# Repeat steps 1–5 once "cold" (fresh process) and once "warm" (process restarted) — 10 probes each.
```

**Q3 — claim-refusal matrix** (needs C-A; 8 classes + a control after each; store digest before/after)

```powershell
$ep = "$endpoint-q3"; $env:IPD_PORTFOLIO_DB_PATH = "$work\fixtures\C-A.sqlite"
$before = (Get-FileHash $env:IPD_PORTFOLIO_DB_PATH -Algorithm SHA256).Hash.ToLower()
$h = Start-GqHarness -Scenario 'Q3' -Endpoint $ep -Db $env:IPD_PORTFOLIO_DB_PATH -Log "$ev\Q3.jsonl" -Module $Module
$rows = foreach ($k in @($frames.frames.PSObject.Properties.Name | Where-Object { $_ -like 'claim.*' })) {
  $r = Invoke-GqProbe -Endpoint $ep -Direction InOut -FrameHex $frames.frames.$k -OutFile "$ev\Q3-client.jsonl"
  $c = Invoke-GqProbe -Endpoint $ep -Direction InOut -FrameHex $frames.frames.'control.list' -OutFile "$ev\Q3-client.jsonl"
  [pscustomobject]@{ class=$k; bytes=$r.bytesReceived; connected=$r.connected; close=$r.closeReason; controlBytes=$c.bytesReceived }
}
$rows | Export-Csv "$ev\Q3-matrix.csv" -NoTypeInformation
Stop-GqHarness -Handle $h
$after = (Get-FileHash $env:IPD_PORTFOLIO_DB_PATH -Algorithm SHA256).Hash.ToLower()
"before=$before`nafter=$after`nunchanged=$($before -eq $after)" | Tee-Object "$ev\Q3-store-digests.txt"
# Acceptance: every row bytes=0, connected=$true, controlBytes>0, digest unchanged.
```

**Q4 — owner/tenant isolation** (needs C-A, C-C, C-B)

```powershell
# (a) own portfolio ⇒ success payload       (C-A, bound principal is principal-1)
$ep = "$endpoint-q4a"; $env:IPD_PORTFOLIO_DB_PATH = "$work\fixtures\C-A.sqlite"
$h = Start-GqHarness -Scenario 'Q4-a-own' -Endpoint $ep -Db $env:IPD_PORTFOLIO_DB_PATH -Log "$ev\Q4a.jsonl" -Module $Module
$own = Invoke-GqProbe -Endpoint $ep -Direction InOut -FrameHex $frames.frames.'control.get.owned' -OutFile "$ev\Q4-client.jsonl"
# (b) foreign owner ⇒ 0 bytes               (c) other tenant ⇒ 0 bytes
$foreign = Invoke-GqProbe -Endpoint $ep -Direction InOut -FrameHex $frames.frames.'isolation.foreign-owner' -OutFile "$ev\Q4-client.jsonl"
$tenant  = Invoke-GqProbe -Endpoint $ep -Direction InOut -FrameHex $frames.frames.'isolation.other-tenant'  -OutFile "$ev\Q4-client.jsonl"
Stop-GqHarness -Handle $h

# (d) C-B ⇒ startup refuses — cross-check of Q2/S2 on the isolation fixture
$ep = "$endpoint-q4d"; $env:IPD_PORTFOLIO_DB_PATH = "$work\fixtures\C-B.sqlite"
$hD = Start-GqHarness -Scenario 'Q4-d-revoked' -Endpoint $ep -Db $env:IPD_PORTFOLIO_DB_PATH -Log "$ev\Q4d.jsonl" -Module $Module

# (e) C-C: second principal bound; request the FIRST principal's portfolio ⇒ 0 bytes,
#     byte-identical to a nonexistent id (compare the two observations, not the code paths)
$ep = "$endpoint-q4e"; $env:IPD_PORTFOLIO_DB_PATH = "$work\fixtures\C-C.sqlite"
$h = Start-GqHarness -Scenario 'Q4-e-second-principal' -Endpoint $ep -Db $env:IPD_PORTFOLIO_DB_PATH -Log "$ev\Q4e.jsonl" -Module $Module
$cross   = Invoke-GqProbe -Endpoint $ep -Direction InOut -FrameHex $frames.frames.'control.get.owned' -OutFile "$ev\Q4-client.jsonl"
$missing = Invoke-GqProbe -Endpoint $ep -Direction InOut -FrameHex $frames.frames.'isolation.missing-id' -OutFile "$ev\Q4-client.jsonl"
Stop-GqHarness -Handle $h

[pscustomobject]@{
  a_own_bytes=$own.bytesReceived; b_foreign_bytes=$foreign.bytesReceived; c_tenant_bytes=$tenant.bytesReceived
  d_refused=$hD.Refused; e_cross_bytes=$cross.bytesReceived; e_missing_bytes=$missing.bytesReceived
  isolationIndistinguishable=($cross.bytesReceived -eq $missing.bytesReceived -and $cross.bytesReceived -eq 0)
} | ConvertTo-Json | Tee-Object "$ev\Q4-matrix.json"
```

**Q1 — V-5 endpoint-phase inventory** (needs a running endpoint; **records only**, never a PASS)

```powershell
$ep = "$endpoint-q1"; $env:IPD_PORTFOLIO_DB_PATH = "$work\fixtures\C-E.sqlite"
$h = Start-GqHarness -Scenario 'Q1' -Endpoint $ep -Db $env:IPD_PORTFOLIO_DB_PATH -Log "$ev\Q1.jsonl" -Module $Module
[ordered]@{
  osBuild=[System.Environment]::OSVersion.Version.Build
  node=(& $Node -v); uv=(& $Node -p 'process.versions.uv')
  account=(whoami); sid=([System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value)
  elevated=[bool](net session 2>$null); endpointName=$ep
  phases=@(Get-Content "$ev\Q1.jsonl" | Select-String '"event":"PHASE"').Count
  # Paste the Gate C act's waiver reading VERBATIM — do not paraphrase and do not choose a
  # reading: G-1 and G-3 are settled by the act, not by the operator.
  waiverReading=$(if ([string]::IsNullOrWhiteSpace($env:GQ_WAIVER_READING)) {
                    throw 'Q1 requires $env:GQ_WAIVER_READING set to the act text verbatim' } else { $env:GQ_WAIVER_READING })
  v6='NOT TESTED — out of Q1 scope (D-GC-D); never recorded as satisfied'
} | ConvertTo-Json | Tee-Object "$ev\V5-endpoint-inventory.json"
Stop-GqHarness -Handle $h
```

**Q11-after** — repeat §12.1 with `phase='after'`, then compare field by field:

```powershell
$before = Get-Content "$ev\Q11-manifest-before.json" | ConvertFrom-Json
$after  = Get-Content "$ev\Q11-manifest-after.json"  | ConvertFrom-Json
$drift = foreach ($f in $before.files.PSObject.Properties.Name) {
  if ($before.files.$f -ne $after.files.$f) { "$f  $($before.files.$f) -> $($after.files.$f)" }
}
"tree_before=$($before.tree)`ntree_after=$($after.tree)`ndrift_count=$(@($drift).Count)" | Tee-Object "$ev\Q11-compare.txt"
$drift | Tee-Object -Append "$ev\Q11-compare.txt"
# Acceptance: tree equal AND drift_count = 0. Any drift invalidates the whole run (§13).
```

## 13. ACCEPTANCE AND FAILURE — DO NOT WEAKEN

| Check | PASS requires | FAIL if | INVALID (discard, repeat) if |
|---|---|---|---|
| **Q1** | Complete inventory; deviations reconciled against F-1…F-9 with **no design change**; the act's recorded waiver reading present verbatim | an unreconciled deviation; a missing/contradictory reading; **any attempt to record Q1 as PASS** (it is records-only) | host/profile mismatch; drift |
| **Q2** | S1–S3: no connectable endpoint at any point, no fallback, refusal recorded; S4: pipe present + control request succeeds | any listener in S1–S3; any fallback; a “successful” start with a failed precondition | control fails; harness crash |
| **Q3** | 8/8 classes ⇒ **0 bytes**, byte-identical, store sha256 unchanged, endpoint still live | any byte returned; any store change; any class distinguishable | control after a class fails |
| **Q4** | success **iff** `(applicationUserId, tenantId, portfolioId)` matches; every other case byte-identical to “not found” | any success outside the triple; foreign vs missing distinguishable | control fails |
| **Q9** | §7.4 rows 1–8: 0 bytes; connection admitted; idle-timeout closure; counters +1/no refusal; liveness and direction controls; refusal paths 0 bytes; N/N cold and warm | any byte before a valid authorized request; refusal path returns bytes | open fails (record as a distinct outcome, not a zero-byte pass); liveness/direction control fails; drift |
| **Q10** | one store file, one owning process, one store module on the IPC path | a second store file, connection or module | endpoint not live; drift |
| **Q11** | 15/15 + tree identical before and after | any drift ⇒ the **whole run is invalid**, not merely failed | — |

**Recording a failure:** write `FAIL` for that item with the raw artifact, the criterion it violated,
and the UTC time. **Never** re-run until it passes without preserving the first outcome. A FAIL is a
legitimate, publishable result.

## 14. EVIDENCE LAYOUT AND HASHING
```
$ev\
  host-manifest.json
  Q11-manifest-before.json      Q11-manifest-after.json
  Q2-S1.jsonl  Q2-S1.jsonl.stdout.txt  Q2-S1.jsonl.stderr.txt
  Q2-S2.jsonl  Q2-S3.jsonl  Q2-S4.jsonl        Q2-matrix.json
  Q10.jsonl  Q10-inventory.txt  Q10-static.txt
  Q9.jsonl  Q9-client.jsonl  Q9-counters.txt
  Q3.jsonl  Q3-client.jsonl  Q3-matrix.csv  Q3-store-digests.txt
  Q4.jsonl  Q4-client.jsonl  Q4-matrix.csv
  V5-endpoint-inventory.json
  frames.json  harness-sha256.txt  client-sha256.txt  frames-sha256.txt
  SHA256SUMS.txt
```
```powershell
Get-ChildItem $ev -File | Where-Object Name -ne 'SHA256SUMS.txt' |
  ForEach-Object { "{0}  {1}" -f (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower(), $_.Name } |
  Set-Content "$ev\SHA256SUMS.txt"
```

Rules: raw logs **unedited**; UTC timestamps; one `runId`; no synthesised or illustrative rows;
`SHA256SUMS.txt` is **integrity information**, not evidence that any test passed.

## 15. INVALID VERSUS FAILED — OPERATOR RULE

| Kind | Definition | Action |
|---|---|---|
| **Invalid** | control fails; drift; wrong host/profile; harness crash; pipe contention | Discard, **record why**, repeat |
| **Failed** | a **valid** run in which the criterion is not met | Record **FAIL**; keep the artifact; do not retry silently |

## 16. RESULT-ACCEPTANCE PROCEDURE (after the Windows run)

1. The operator produces the `$ev` bundle and its `SHA256SUMS.txt`, and **does not summarise results
   as PASS/FAIL beyond the table in §13**.
2. The bundle is deposited as an artifact and its hashes recorded in a **new** date-stamped evidence
   record on this branch (additive; no existing record rewritten).
3. That record must state the result as **`PARTIAL — Q5–Q8 DEFERRED`**, and must not describe Q1 as a
   PASS.
4. **Only a separately rendered Program Authority acceptance act** converts the run into a Gate C
   result. CI, this package, or an operator summary is **not** acceptance.
5. Gate D (route admission), Gate E (write policy), portfolio admission and production remain
   untouched by any result produced here.

## 17. STOP CONDITIONS — HALT AND REPORT

- Any fixture would require **creating** a provisioned store → **stop** (§5.1).
- Build artefacts cannot be produced → **stop** (§5.2).
- The host is not the V-P host, or the session is elevated → **stop**; record the actual profile.
- Drift at Q11-before → **stop**; the run is invalid before it starts.
- Any pressure to record a POSIX result as a Gate C result → **refuse**: `D-GC-F`.

---

# PART III — RECORD

## 18. WHAT THIS TASK CHANGED

| Change | Detail |
|---|---|
| Files added | this record only (`evidence/np04/…`) |
| Files modified | none |
| Commits | one documentation commit on `arena/21c63aef-…` (existing PR #8 branch) |
| PRs created | none (existing lifecycle reused) |
| Merges | **none** — PR #8 remains open and unmerged |
| Tags / refs | **none created or moved** (tags still 4) |
| IRR | **not modified** (read-only) |
| Gate C | **not executed** — no probe, no fixture, no endpoint |

## 19. LIMITATIONS

| Limitation | Consequence |
|---|---|
| No Windows host access from Arena | The package is prepared, not executed. Every Windows-only statement here is a **requirement**, not a result |
| No PowerShell available in Arena | `gq-client.ps1` and `gq-lib.ps1` were reviewed and syntax-structured, but **not executed**; the harness and frame generator **were** executed (Node) |
| Harness self-test ran on POSIX with Node 22 | Proves module resolution and framing only; proves nothing about Windows, pipes or zero-byte behaviour |
| The four pre-existing TypeScript errors | Unresolved; declared in §5.2, not hidden |
| Expected digests computed from git objects | They will match a clean checkout; a checkout with line-ending conversion (CRLF) would differ — **disable `core.autocrlf`** or record the mismatch explicitly as a checkout artifact, not drift |

---

## 20. DECISION RECONCILIATION — 2026-10-17 (added after §1–§19)

Two independent PA decisions were rendered and published on 2026-10-17. They **change no measured
fact** in this package; they change **what is authorized** and therefore the status of the
prerequisites. Nothing in §1–§19 is retracted except the two lines marked as reconciled in §4.

| Decision | Record | Status |
|---|---|---|
| `IIPS-V3-G2-IPD-GATE-A-PRIME-PA-DECISION-2026-10-17-01` | `evidence/np04/IIPS_v3.0_G2_IPD_GATE_A_PRIME_PA_DECISION_RENDERED_2026-10-17.md` | **RENDERED — `APPROVED`, rule P-1 adopted; not executed** |
| `IIPS-V3-G2-IPD-GATE-C-BUILD-EXCEPTION-PA-DECISION-2026-10-17-01` | `evidence/np04/IIPS_v3.0_G2_IPD_GATE_C_BUILD_EXCEPTION_PA_DECISION_RENDERED_2026-10-17.md` | **RENDERED — B-GC-1 adopted; no host run, none accepted** |

| Prerequisite | Status after decision rendering |
|---|---|
| Gate A′ authority | **AUTHORIZED** — rendered `APPROVED` (P-1) |
| Store provisioning | **NOT EXECUTED** — Windows-host operation outstanding |
| B-GC-1 | **AUTHORIZED** — rendered `ADOPTED` |
| Qualifying Windows-host build run | **OUTSTANDING** — no evidence exists |
| Gate C Q-check execution | **NOT ESTABLISHED** by rendering these decisions |
| Gate C result acceptance | **NOT ESTABLISHED** |
| Gate D/E and CV-52 admission | **NOT ESTABLISHED** |
| Production authorization | **NOT GRANTED** |
| Any check runnable today | **NONE** — §4 reconciliation |

**Hierarchy preserved:** a rendered decision is not an executed operation; this package is not
Windows-host evidence; execution evidence is not result acceptance; result acceptance is not
promotion or admission.

*End of record.*
