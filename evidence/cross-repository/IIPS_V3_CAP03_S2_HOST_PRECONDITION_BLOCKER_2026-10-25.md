# CAP-03 — `S2` canonical native-Windows host verification: **NOT EXECUTED** — precondition blocker record (2026-10-25)

> ## **RESULT: `S2` NOT EXECUTED — MANDATORY PRECONDITION FAILED — NO SUBSTITUTION**
>
> The designated host `desktop-no0nhtp` is unreachable from the executing environment, and the executing
> environment is not that host. Not one command of `S2`'s prescribed sequence was run. No Linux, WSL,
> elevated shell, alternate commit, alternate Node runtime or synthetic transcript was substituted, and no
> `dist/**` count, test total or package-consumer result is claimed anywhere in this locus as host evidence.
> Because the sequence never started, there is **no failed-run evidence to preserve** and **nothing was
> rerun over a failure**. `P-1` remains `NOT EXECUTED` and `S3` remains `NOT REACHED`.

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-CAP03-G4-H12-R5-S2-HOST-PRECONDITION-BLOCKER-2026-10-25-01` (census before this record: **`0`** occurrences in IPD and IRR) |
| Record type | Precondition blocker record — **not** an execution receipt, not a qualification result, not a gate record |
| Recorded (UTC) | `2026-10-25` |
| Authorized by | The Program Authority's `2026-10-25` CAP-03 instruction directing `S2` on the designated host and directing that **any mandatory precondition failure stops `S2` with exact evidence** |
| Designated host | `desktop-no0nhtp` — native Windows 11 Home Single Language, non-elevated operator **Ramki**, operator-supplied Node `>=22.13.0 <23`, flag-free `node:sqlite` |
| Designated commit / tree | `8eec74ae27cda09f3c368b9c299895eae41554db` / `4eba29029f8d95cfe483e615a7047426b298ce50` |
| Executing environment | `e2b.local`, Linux `6.1.158+` x86_64, Debian GNU/Linux 12 (bookworm), uid `1001`, Node `v22.22.3` — **not the designated host** |
| Raw transcript | `evidence/cross-repository/cap03_h12r5_2026-10-25_adoption_mirror/30_s2_host_precondition_probe.txt` (captured outside every Git worktree, deposited read-only) |
| Disposition | **`NOT EXECUTED — designated-host precondition failed`**; the `S2` step remains the single next dependency-respecting action |

## 1. Precondition evaluation — every required value re-measured, none inferred

| # | Mandatory precondition | Required value | Observed value | Verdict |
|---|---|---|---|---|
| 1 | Host identity | `desktop-no0nhtp` | executing host `e2b.local`; `getent hosts desktop-no0nhtp` → exit `2` (no record), `getent ahostsv4` → exit `2`, `ping` → `Name or service not known` (exit `2`), TCP `5985`, `5986`, `3389`, `22` all refused/unresolved | **FAIL** |
| 2 | OS | native Windows 11 | `Linux e2b.local 6.1.158+ #1 SMP PREEMPT_DYNAMIC … x86_64 GNU/Linux`; `PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"`; `powershell`, `pwsh`, `cmd.exe` all **ABSENT** | **FAIL** |
| 3 | Platform | `process.platform === 'win32'` | `{"platform":"linux","node":"v22.22.3","arch":"x64"}` | **FAIL** |
| 4 | Operator | Ramki, **not** elevated | `user` (uid `1001`), groups `user sudo users` — not the designated operator, and not a Windows account context at all | **FAIL** |
| 5 | Node | operator-supplied, `>=22.13.0 <23` | `v22.22.3` at `/usr/local/bin/node` — numerically in range, but **not** the operator-supplied designated-host runtime, so the value cannot be reported for the host | **UNVERIFIED ON HOST** |
| 6 | `node:sqlite` without experimental flags | loads and operates flag-free | loads on this runtime (`DatabaseSync=function`) **but emits `(node:2678) ExperimentalWarning: SQLite is an experimental feature`**; the host observation remains unmade, and this warning differs from the host's expected flag-free behaviour | **UNVERIFIED ON HOST** |
| 7 | Clean full-history checkout | `8eec74ae…` / `4eba2902…`, `is-shallow=false`, no tracked changes | worktree is clean and **non-shallow**, but at `c6b540af…` / `b18b5d8d…` — the wrong commit for `S2` | **FAIL** (wrong commit; not re-pointed, since the host requirement had already failed) |

Preconditions 1–4 and 7 are **fatal**; 5–6 are unmade observations rather than passes. The stop rule was
therefore applied at precondition 1 and `S2` was never dispatched.

## 2. Prescribed sequence — command-by-command disposition

| # | Command (per the effective acts and the readiness packet §3) | Disposition |
|---|---|---|
| 1 | `npm ci --no-audit --no-fund` | **NOT RUN** |
| 2 | `npx tsc --noEmit` | **NOT RUN** |
| 3 | `npm run build` — verify the expected **1,140** `dist/**` files | **NOT RUN**; no `dist/**` inventory produced or claimed |
| 4 | canonical guarded `npm test` | **NOT RUN**; no executed-test count produced or claimed |
| 5 | `npm run test:package-consumer` | **NOT RUN** |

The five entries above are the entire `S2` sequence. **Zero of five executed.** The Linux publication checks
run for this documentation-only PR (see §5) are **not** any of these five in any evidentiary sense.

## 3. What must be true before `S2` can execute

1. The recorded session runs **on** `desktop-no0nhtp` under the non-elevated operator account **Ramki**.
2. `process.platform === 'win32'` and a native Windows 11 edition, with `PF-03` elevation check returning
   `False` and the account SID recorded.
3. The **operator-supplied** Node runtime satisfies `>=22.13.0 <23`, and `node:sqlite` operates **without**
   experimental flags (`PF-04`, `PF-05`, `PF-06`).
4. A clean, **full-history**, tracked-clean checkout of `ramkivs/iips-production-market-data` at exactly
   `8eec74ae27cda09f3c368b9c299895eae41554db`, tree `4eba29029f8d95cfe483e615a7047426b298ce50`
   (`PF-07`, `PF-09`) — not `main`, not a later merge, not a substitute commit.
5. `IIPS_FREEZE_WORKTREE` and `IIPS_RAW_EVIDENCE_ROOT` designated **outside every Git worktree**, with raw
   stdout, raw stderr, exit codes and UTC timestamps captured per command (`PF-14`).
6. All of `IIPS_G3_IPC_BINDING_PROVISIONED`, `IIPS_ENABLE_WRITES`, `IIPS_G3_ENABLE_WRITES`,
   `GATE_E_OVERRIDE` absent (`PF-10`); any non-zero exit stops the sequence with the failure preserved.

## 4. Preserved boundaries after this record

```text
S2: NOT EXECUTED — designated host unreachable, environment is not the host
P-1 provisioning: NOT EXECUTED — remains one bounded execution, strictly after S2 passes
S3 preflight: NOT REACHED — still requires PF-15 endpoint/local-state designation first
Gate 4 H-12 R5: ADOPTED (governing IRR act) and now registered in IPD; QE still 0/11
DQ-4 final QE freeze: PREPARED AND VALIDATED — NOT ESTABLISHED (8/10); criteria 7 and 8 remain NOT MET
Gate 5: NOT INITIATED / NOT ADMITTED; durable reads NOT GRANTED; production NOT ADMITTED
WRITE_NOT_AUTHORIZED: preserved; twelve /api/user-portfolios* 503 fences preserved; durable:false preserved
```

## 5. Publication checks for this record (explicitly **not** `S2`, not QE, not host evidence)

The documentation-only PR carrying this record was validated with the repository's own gates in this
Linux environment so that the publication itself is sound; the results are recorded in
`40_publication_checks.txt`–`42_publication_tree.txt` and carry **zero** `S2`, Gate 4, QE or acceptance
credit. They are a publication-hygiene fact about this PR, nothing more.

## 6. Stop statement

`S2` stops here on exact evidence. No substitution, retry, repair, elevation or runtime switch is
permitted or performed. `P-1` is **not** authorized by this record and `S3` is **not** reached by it;
`P-1` must remain a single bounded execution consumed once, and `S3` may begin only after its required
`PF-15` endpoint/local-state designation.

*End of `IIPS-V3-CAP03-G4-H12-R5-S2-HOST-PRECONDITION-BLOCKER-2026-10-25-01` — `S2` NOT EXECUTED.*
