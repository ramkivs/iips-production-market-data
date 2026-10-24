# CAP-03 — Host Qualification Readiness Packet and Precise Blocker

> ## STATUS: **NOT READY — NOT EXECUTED — NO HOST CONTACT — 0/11 QE ITEMS**
>
> This is a preparation and blocker record. It names no final pin, no store path, no endpoint and no
> result. It contains **no executable provisioning invocation**, no identity value and no QE outcome.
> Every table cell that could be mistaken for evidence is marked **NOT RUN** or **NOT DESIGNATED**.
>
> The designated host is unreachable from the preparing environment, no PA freeze/order/adoption act
> exists, no H-12 manifest is adopted, and no P-1 store has been selected. Execution therefore stops at
> this boundary. Linux/CI/fixtures/mocks are not substituted for host evidence.

| Field | Value |
|---|---|
| **Record ID** | `IIPS-V3-CAP03-HOST-READINESS-PACKET-2026-10-24-01` (census before this record: `0` in IPD and IRR) |
| **Record type** | Readiness checklist, procedure template, evidence template and blocker record. Not an execution receipt, qualification result or acceptance |
| **Prepared** | `2026-10-24` (UTC) |
| **Prepared by** | Arena Agent Mode — preparation and publication only; never host execution |
| **Designated host (effective acts)** | `desktop-no0nhtp`, Windows 11 Home Single Language, **non-elevated** operator account, `process.platform === 'win32'`, Node `22.x` satisfying `>=22.13.0 <23`, flag-free `node:sqlite`, clean tracked worktrees at designated commits |
| **Designated operator** | Ramki — the only QE executor under the effective Gate 4 act |
| **Preparing environment** | Linux `6.1.158+` x86_64, `process.platform = 'linux'`, Node `v22.22.3`. This is **not** the host |
| **Host reachability probe** | `ping desktop-no0nhtp` → `Name or service not known` (fresh reproduction) — **no DNS resolution, no access channel** |
| **Store** | **NONE SELECTED.** No P-1 path exists; no store file exists anywhere in the repository; no row, binding or audit event exists |
| **Endpoint / local state** | **NOT DESIGNATED.** No endpoint was opened; `IIPS_G3_IPC_BINDING_PROVISIONED` remains unset and may not be enabled |
| **Pins** | **NO FINAL FREEZE PINS.** Current consumer pin is `4740ba21ea6103f1a7ebc9768269ae7795920698`, but it is not a final freeze designation and may change under a rendered DQ act |
| **H-12** | **NOT ADOPTED.** R2 is stale after the S1 binding commit; no replacement candidate exists at a final execution commit |
| **QE status** | **0 executed · 0 pass · 0 fail · 0 inconclusive · 11 blocked / not run** |
| **Authority** | No DQ-4, DQ-5 or H-12 adoption act rendered. Gate 4 is `AUTHORIZED — NOT STARTED`; P-1 is authorized in principle but not executable at this readiness state |

---

## 1. Exact blockers, in dependency order

| # | Blocker | Owner | Exact closure evidence required |
|---|---|---|---|
| **B-1** | DQ-1/DQ-2/DQ-3 not rendered | PA | merged DQ act(s), green exact-head and post-merge CI, remote blob read-back |
| **B-2** | Selected contract implementations not merged | IPD/IRR implementers under rendered manifests | merged PRs, full validation, remote read-back |
| **B-3** | No final IPD QE pin / IRR consumer pin | PA under DQ-4 | verbatim commit + tree designation in an effective act |
| **B-4** | H-12 candidate stale; replacement not generated | preparation authority after B-1/B-2 | candidate at final freeze with full 56/1/7/1,140 validation, published read-back |
| **B-5** | H-12 not adopted | PA, separate express act | adoption act naming candidate digests; never inferred from candidate validation |
| **B-6** | Execution order not confirmed | PA under DQ-4 | exact amended ordering, or express adoption of the existing order |
| **B-7** | Host/operator/store not confirmed | PA under DQ-5 | host + operator + exact absolute non-existent store + endpoint/local-state + raw-capture location |
| **B-8** | Host unreachable; no host runtime evidence | operator | raw preflight transcript from the host itself |
| **B-9** | P-1 single execution not performed | operator | V-A2-1…V-A2-8 receipt with raw bytes, exactly 1 binding / 1 membership / 1 audit, zero portfolio rows |
| **B-10** | Native-Windows canonical test not performed | operator | `npm test` guarded transcript at the freeze pin, plus typecheck/build/package consumer |
| **B-11** | QE-1…QE-11 not executed | operator | raw per-item transcripts bound to pins, host, store and run |
| **B-12** | Acceptance/admission absent | PA | separate P10/P11 acts; green CI is never acceptance |

**The present stop is B-1…B-8.** B-9…B-12 are downstream and cannot be started to manufacture progress.

---

## 2. Preflight checklist — read-only, run only after pins and order are designated

The following is a **checklist template, not an executable script**. It is deliberately not a file that
can be run with missing values. The operator copies the commands into a recorded PowerShell session only
after a rendered DQ-4/DQ-5 act supplies every designated value. Any missing value stops before execution.

Set `$ErrorActionPreference = 'Stop'`. Capture UTC start time, raw stdout, raw stderr and exit code for
every command. Do not normalize output. Do not create the store during preflight.

| # | Check | Command / observation | Pass condition |
|---|---|---|---|
| **PF-01** | Host identity | `hostname` | exactly the PA-designated host |
| **PF-02** | OS edition | `(Get-CimInstance Win32_OperatingSystem).Caption` | exactly the designated Windows edition |
| **PF-03** | Non-elevation | `[Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()` → `.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)` | **False**; record the current account SID separately |
| **PF-04** | Platform/runtime | `node -p "JSON.stringify({platform:process.platform,node:process.version,arch:process.arch})"` | `platform='win32'`; Node `>=22.13.0 <23`; architecture recorded |
| **PF-05** | Flag-free SQLite | `node --input-type=module -e "import { DatabaseSync } from 'node:sqlite'; console.log(typeof DatabaseSync)"` | loads **without** an experimental flag; output recorded |
| **PF-06** | No runtime switch/install | inspect the invoked `node` path; confirm no installation occurred | same designated runtime; no install or switch evidence |
| **PF-07** | IPD clean tree | `git rev-parse HEAD`, `git rev-parse "HEAD^{tree}"`, `git status --porcelain`, `git diff --exit-code`, `git diff --cached --exit-code` | commit/tree exactly the freeze designation; no tracked changes |
| **PF-08** | IRR clean tree | same commands at the designated consumer pin | commit/tree exactly the freeze designation; no tracked changes |
| **PF-09** | Full history available | `git rev-parse --is-shallow-repository` | `false`; ancestry claims cannot rest on a shallow clone |
| **PF-10** | No enabling flags | enumerate `IIPS_G3_IPC_BINDING_PROVISIONED`, `IIPS_ENABLE_WRITES`, `IIPS_G3_ENABLE_WRITES`, `GATE_E_OVERRIDE` | all absent; no workaround value set |
| **PF-11** | Store path syntax | `$StorePath` supplied verbatim by the PA act; `[IO.Path]::IsPathRooted($StorePath)` | absolute; outside every Git worktree; not synchronized; local fixed NTFS; operator-writable without elevation |
| **PF-12** | Store absence | `Test-Path -LiteralPath $StorePath` | **False**; the path is recorded verbatim; no directory/file is created by preflight |
| **PF-13** | Parent location | `Split-Path -Parent $StorePath`; volume/filesystem/synchronization inspection | parent exists and is local fixed NTFS; not a cloud-synced or network path |
| **PF-14** | Raw evidence location | `$EvidenceRoot` designated outside every worktree | absolute, writable, not the store path, not synchronized |
| **PF-15** | Endpoint/state designation | read the PA-designated endpoint/local-state directory | **NOT DESIGNATED today**; execution stops here until named |
| **PF-16** | Authority text | read the rendered DQ-4/DQ-5/H-12 adoption acts | exact Act IDs, pins, store, order and adoption digest confirmed; no placeholder accepted |
| **PF-17** | No prior P-1 consumption | compare the PA consumption register/receipt with the act | execution unspent; any prior attempt or failure means a fresh act is required |

**Any failure or ambiguity ⇒ STOP. Record `NOT EXECUTED — <exact reason>` and do not proceed.** No retry,
repair, fallback, store deletion, elevation or runtime switch is permitted.

---

## 3. Canonical host test (S2) template

Run only if the PA-confirmed order places this step before P-1, and only at the exact freeze pin with
clean tracked trees. This is **host implementation evidence**, not QE and not acceptance.

```powershell
# Values come from the rendered DQ-4 act and actual host state. No defaults.
$IpdRoot = $env:IIPS_FREEZE_WORKTREE          # operator-supplied, outside this packet
$EvidenceRoot = $env:IIPS_RAW_EVIDENCE_ROOT    # operator-supplied, outside every worktree
Set-Location -LiteralPath $IpdRoot
npm ci --no-audit --no-fund
npx tsc --noEmit
npm run build
npm test 2>&1 | Tee-Object -FilePath (Join-Path $EvidenceRoot 's2-canonical-npm-test.txt')
npm run test:package-consumer 2>&1 | Tee-Object -FilePath (Join-Path $EvidenceRoot 's2-package-consumer.txt')
```

The guarded `npm test` count is authoritative. Direct TAP is supplemental only and may not replace or
upgrade the canonical result. A zero, missing, partial or stale count is a failure. Record the actual
executed count at the freeze pin; do not reuse the pre-freeze `897` count as a host claim. Any non-zero
exit stops the sequence.

---

## 4. Single P-1 provisioning procedure — template only, not an execution instruction

**No execution is authorized from this packet.** The invocation below is intentionally symbolic; the
act ID, store path and identity values are read verbatim from effective acts and are **not copied into this
record**. The identity values have already been determined by the PA and are not selected, inferred or
reopened here. Do not set them in environment variables.

**Pre-state — read-only**

1. Confirm PF-01…PF-17 all pass.
2. Run the entrypoint's `--mode=validate` against the designated path **only after** the store exists?
   **No:** pre-state validation of a non-existent store is expected to fail closed. Record the fail-closed
   output; it is not permission to create the store.
3. Record the exact absence proof (`Test-Path` false), directory listing, and pre-run store sha256 status
   (`ABSENT`).
4. Confirm zero bindings, zero memberships, zero audit rows and zero portfolio/revision/holding/
   contribution rows. A pre-existing binding or membership in **any** state means the act does not apply.

**Single execution — once**

5. Invoke the effective successor act §8 command **verbatim**, with the rendered Act ID, absolute store,
   and the three already-determined values supplied explicitly as command arguments (never environment
   variables). Capture stdout, stderr, exit code, UTC start/end and the command line with secret-free
   evidence only.
6. On success, record store SHA-256, byte length, ledger checksums and table counts.
7. On refusal or error: record the exact code, capture the absence/rollback proof, mark the act
   **FAILED / ROLLED BACK** or **NOT EXECUTED — reason**, and **consume** the single execution. Do not
   retry or repair.

**Post-state — read-only**

8. Run `--mode=validate` and capture the full V-A2-1…V-A2-8 report.
9. Confirm exactly 1/1/1 and zero portfolio rows; verify the hash chain.
10. Verify `WRITE_NOT_AUTHORIZED` remains enforced and `evaluatePortSaveGuard()` is hard-false.
11. Invoke a **second** execute attempt solely as the V-A2-8 refusal check; confirm refusal, zero change,
    and store SHA-256 identical. If this second attempt could be mistaken for a provisioning retry, record
    it explicitly as the mandated idempotence/consumption check, not a retry.
12. Copy raw evidence into the publication packet only after the run; never edit it.

### 4.1 V-A2 receipt template

| Check | Required observation | Result | Raw evidence path |
|---|---|---|---|
| **V-A2-1** | `_migration_ledger` holds `001`–`004` with computed checksums; schema 004; migration `001` blob `f594a182…` | **NOT RUN** | — |
| **V-A2-2** | exactly 1 binding, `ACTIVE`, `revoked_at IS NULL`, deterministic `binding_id` | **NOT RUN** | — |
| **V-A2-3** | exactly 1 membership, `ACTIVE`, attached to the binding, designated tenant/owner | **NOT RUN** | — |
| **V-A2-4** | portfolios, revisions, holdings, contributions all **0** | **NOT RUN** | — |
| **V-A2-5** | exactly 1 hash-chained audit event, correct type/subject/detail; chain verifies | **NOT RUN** | — |
| **V-A2-6** | `resolveActiveBinding()` returns exactly the provisioned context; absence before | **NOT RUN** | — |
| **V-A2-7** | IPC still `WRITE_NOT_AUTHORIZED` before mutation; guard still hard-false | **NOT RUN** | — |
| **V-A2-8** | second invocation refused, zero change, act consumed | **NOT RUN** | — |

### 4.2 Hard abort conditions

Stop on any basis commit/tree/blob mismatch; host, elevation, edition or runtime mismatch; missing or
non-flag-free `node:sqlite`; relative/inside-worktree/synchronized store path; pre-existing store or
binding/membership; identity values absent, ambiguous, mismatched or supplied by environment; any V-A2
failure; any attempt to repair, delete, re-run or adjust; any non-documentary drift after freeze. Record
and end at the boundary.

**P-1 never grants:** a second identity/binding/membership, multi-user/auth/RBAC, endpoint service
admission, operational write, `durable:true`, Gate C/Gate 4 result acceptance, Gate 5, `TD-7b` or
production eligibility. It never lifts `WRITE_NOT_AUTHORIZED` and never enables
`IIPS_G3_IPC_BINDING_PROVISIONED`.

---

## 5. QE-1 … QE-11 tier-labelled matrix at the freeze

**Pins are not designated.** The current consumer pin shown below is a baseline reference only; it is not
a final freeze pin. The IPD QE pin cannot exist before the selected DR implementations merge. Every row is
**BLOCKED / NOT RUN** and no tier assignment is an authorization to execute.

| Execution tier (effective Gate 4 §5) | What may run | Evidence ceiling |
|---|---|---|
| **Tier 1** | real IPC endpoint + dispatcher with every fence on | full-path candidate for refusal/read/identity behaviour |
| **Tier 2** | real `DurablePortfolioStore` / domain store on disposable copies | component evidence only for write/lifecycle/restart/crash |
| **Tier 3** | session-port identity refusal with real SecurityMaster fixtures | component evidence for DP-2 2F behaviour |

The tiers above are the effective mechanism. They are **not** the older assessment's "Class 1/2/3"; those
class numbers must not be renamed into a tier to make an item look executable.

| QE | Execution tier(s) | Evidence ceiling under current authority | Freeze pin(s) | Status |
|---|---|---|---|---|
| **QE-1** canonical identity, zero/conflicting refusal, caller fields | Tier 1 + Tier 3 | full-path candidate after P-1 | IPD **NOT DESIGNATED** / IRR final **NOT DESIGNATED** | **BLOCKED / NOT RUN** |
| **QE-2** DP-2 2F write refusal, no bypass, no partial revision | Tier 3 + Tier 2 | component only while W-1 refuses all writes | not designated | **BLOCKED / NOT RUN** |
| **QE-3** revision/lifecycle/tombstone/reset/delete | Tier 1 + Tier 2 | component for write semantics; read isolation at Tier 1 | not designated | **BLOCKED / NOT RUN** |
| **QE-4** durable commit → stop both processes → restart → byte-identical read-back | Tier 2 | **measurement only; limitation, never a PASS claim** until U6/acceptance | not designated | **BLOCKED / NOT RUN** |
| **QE-5** idempotent re-import before/after restart | Tier 2 | component only | not designated | **BLOCKED / NOT RUN** |
| **QE-6** contribution lineage after restart and REPLACE/RESET | Tier 2 (+ DQ-3 consumer scope) | component lineage; contributed-read mapping may remain a limitation | not designated | **BLOCKED / NOT RUN** |
| **QE-7** forced termination, atomic recovery, migration tamper refusal | Tier 2 | component only; destructive fixtures/disposable copies only | not designated | **BLOCKED / NOT RUN** |
| **QE-8** revocation, post-restart refusal, revocation/write race | Tier 1 + Tier 2 | limitation until a provisioned binding and PA-approved revocation procedure exist; never revoke the sole operator binding without express authority | not designated | **BLOCKED / NOT RUN** |
| **QE-9** full W-15 refusal matrix with zero store effect | Tier 1 + Tier 2 | refusal classes at full path where reachable; write-success path unavailable | not designated | **BLOCKED / NOT RUN** |
| **QE-10** outcome-unknown, no IRR auto-retry, reconcile-by-read | Tier 1 with the actual IRR consumer | limitation until an authorized write path can produce outcome-unknown without mock; no substitution | not designated | **BLOCKED / NOT RUN** |
| **QE-11** Gate C Q1–Q4/Q9–Q11, C5.1 zero bytes, Q11 before/after | Tier 1 | measurement; **acceptance is a separate act** | not designated | **BLOCKED / NOT RUN** |

**Counts: 11 blocked / 11 not run / 0 executed / 0 pass / 0 fail / 0 inconclusive.** A limitation is never
recorded as PASS. A component result is never escalated to full-path qualification.

Required discipline when eventually executed: QE-11 before-digest check first; QE-9 cold and warm;
QE-11 after-digest check last; QE-9 C5.1 N ≥ 10 cold + 10 warm; every attempt retained, including failed
attempts; raw output not normalized.

---

## 6. Before/after digest procedure and H-12 evidence template

At the freeze (after DQ acts and implementations merge, before host action):

1. Designate the final IPD commit/tree and IRR commit/tree verbatim in the rendered act. No future SHA is
   inferred here.
2. Build IPD freshly with the canonical locked install. Count `dist/**`; the current expected count is
   **1,140**. If a rendered act changes it, **STOP for PA re-designation**; do not silently accept a new
   count.
3. Generate the H-12 candidate under amended §8: **32 mandatory IPD + 1 conditional helper + 24 IRR = 56
   core**, **7** separate post-G3 entries, anchors, criteria, fresh `dist` set and an **empty** evidence
   deposit set. Validate every entry's commit/tree/path/Git blob SHA-1/raw SHA-256/byte length/line endings.
4. Publish the candidate as **CANDIDATE — NOT ADOPTED**, with its own validation record. Do not pre-approve
   a future digest and do not edit it after merge.
5. At run start, after adoption and before QE-1, re-read every adopted digest from the clean trees. Record
   UTC, host, pins, command lines and output. Compare against the adopted manifest.
6. At run end, repeat the entire read. Any mismatch, missing path, unverified set or non-documentary drift
   invalidates the run and stops for PA disposition.
7. Keep raw evidence **outside every worktree** during capture. After the run, publish it additively and
   separately hash the evidence-deposit set; never rewrite the adopted manifest.
8. A digest check is not a QE pass. Q11 is a drift check; QE-11's "accepted" limb needs a separate Gate C
   acceptance act.

---

## 7. What would make this packet executable

All of the following must exist at the same time:

- rendered DQ-1…DQ-5 acts, merged, green, remotely read back;
- selected contract implementations merged with full validation and remote read-back;
- verbatim final IPD and IRR pins at the exact freeze;
- H-12 candidate at that freeze, published and fully validated, plus its **separate adoption act**;
- PA confirmation of host, operator, exact absolute non-existent store, endpoint/local-state directory and
  raw-evidence location;
- a reachable non-elevated Windows host with the exact runtime and flag-free `node:sqlite`;
- an unspent P-1 authority in the PA-confirmed order.

**Not present today:** every item above except the effective host designation and the unspent authority
in principle. The host is unreachable and no store exists. This packet therefore ends honestly at the
boundary and records no host result.

---

## 8. Attestation

| Claim | Value |
|---|---|
| Host contacted / preflight run / P-1 executed | **NO / NO / NO** |
| Store, binding, membership or audit row created | **NO / NO / NO / NO** |
| QE item executed | **NO — 0 of 11** |
| H-12 adopted or promoted | **NO — candidate R2 is stale; NOT ADOPTED** |
| Final pins designated | **NO** |
| `WRITE_NOT_AUTHORIZED` / `SESSION_ONLY` / `durable:false` changed | **NO** |
| `IIPS_G3_IPC_BINDING_PROVISIONED` enabled | **NO** |
| 503 fence or package pin changed | **NO** |
| Reports, D115 or F6 work performed | **NO** |
| Production eligibility / production `durable:true` / `TD-7b` claimed | **NO / NO / NO** |
| IRR modified | **NO** |

*End of `IIPS-V3-CAP03-HOST-READINESS-PACKET-2026-10-24-01`. NOT READY — NOT EXECUTED.*
