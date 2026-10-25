# CAP-03 — Gate 4 H-12 R5 Adoption mirrored into the IPD locus: publication receipt (2026-10-25)

**Receipt:** `IIPS-V3-CAP03-G4-H12-R5-ADOPTION-IPD-MIRROR-RECEIPT-2026-10-25-01` — the prepared IRR
mirror text of the same identifier, published in the authoritative IPD locus. **Registration only:**
this receipt renders no IPD decision, adopts nothing on IPD's behalf, moves no pin, relaxes no guard,
credits no QE item and admits nothing.

| Field | Value |
|---|---|
| IPD Receipt ID | `IIPS-V3-CAP03-G4-H12-R5-ADOPTION-IPD-MIRROR-RECEIPT-2026-10-25-01` |
| Publication locus | `ramkivs/iips-production-market-data` → `evidence/cross-repository/IIPS_V3_CAP03_G4_H12_R5_ADOPTION_IPD_MIRROR_RECEIPT_2026-10-25.md` |
| Prepared in locus | `ramkivs/iips-review-recovered` → `docs/integration/IIPS_v3.0_CAP03_G4_H12_R5_ADOPTION_IPD_MIRROR_RECEIPT_PREPARED_2026-10-25.md` (blob `d84549515d299397db879c2e96ad33de9b430fd2`, `4,686` B, SHA-256 `604f39c23292be416ec27f5de9cdb6e28580e5113591900c8b1b5cdc837a0784`) |
| Governing PA act mirrored | `IIPS-V3-CAP03-G4-H12-R5-PA-ADOPTION-ACT-2026-10-25-01` — IRR `docs/integration/IIPS_v3.0_CAP03_G4_H12_R5_PA_ADOPTION_ACT_EFFECTIVE_2026-10-25.md`, blob `9f3aa377ab6468e8a27ec2d30bb2fc6d9395e1ff`, `30,278` B, SHA-256 `d29781bc5be47498a12caf00b797d9adbb3f0d55209039aa2755ebbaf8f5c1fd` — **EFFECTIVE in the governing IRR locus** (PR #279, merge `ae82be857a554d96e6c2cffc0d519e99135effdd`, exact-head CI `40228792767`, post-merge CI `40228968888`, §6 below) |
| Adopted manifest mirrored | `G4-H12-MANIFEST-v2-CANDIDATE-2026-10-25-R5` — blob `f4649e36a81c7013287810cd3202b99586dbd951`, `143,813` B, SHA-256 `d0be8bef3281ae6a296b8700265fe134b5088dd84b102b77ca8a157c8275cb76` (re-verified byte-identical in §5) |
| IPD Step 0 baseline | `c6b540afd1fd3da5f18d029a54d1d89331916ead` / tree `b18b5d8d2fbd5bf11a174f0e5578314ead5cbf76`, `0` open PRs, `main` CI `40225262938` success — **zero drift** |
| Designated IPD primary QE pin (unchanged) | `8eec74ae27cda09f3c368b9c299895eae41554db` / tree `4eba29029f8d95cfe483e615a7047426b298ce50` |
| Designated IPD broker-import alias pin (unchanged) | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` / tree `cc0f0117822850f9046e9a51bd05c1d45f80cd57` |
| Designated IRR QE consumer pin (unchanged) | `ba64b2d5927c2f872560710cf1474c25a5cde0d5` / tree `5e4262f1cd75bf13b76ced5b45058f31434b5dad` |
| Changed IPD paths | documentation and evidence only — this receipt, the append-only tracker entry, the S2 precondition blocker record and its 13 annex files. **No** IPD source, test, script, package manifest, export, `files` entry, schema, migration, protocol, route, CI workflow, fence or pin |
| Status | **PUBLISHED IN IPD — registration only; no IPD decision, gate, pin, guard or QE movement** |

§§1–§3 below are the prepared IRR text **reproduced verbatim** (31 lines, SHA-256
`912b0e6845936559f91fa312f615a8328459a4ebee1067cf949a000d132c4af7`, identical to prepared source lines
13–43). The prepared text has three sections, not five; §3's status table records the **pre-publication**
state at IRR preparation time and is superseded as *current state* — not as text — by §§4–8 below.
Sections 4–8 are new to this locus.

---

## 1. What the IPD Locus Receives

| Item | Value to Record in IPD |
|---|---|
| Determination | **Gate 4 H-12 Authorized Manifest (`R5`) ADOPTED by Express PA Act** (`IIPS-V3-CAP03-G4-H12-R5-PA-ADOPTION-ACT-2026-10-25-01`) |
| Adopted Primary Manifest | `G4-H12-MANIFEST-v2-CANDIDATE-2026-10-25-R5` (`docs/integration/G4-H12-MANIFEST-v2-CANDIDATE-2026-10-25-R5.json` in IRR; Git blob SHA-1 `f4649e36a81c7013287810cd3202b99586dbd951`; `143,813` bytes; raw SHA-256 `d0be8bef3281ae6a296b8700265fe134b5088dd84b102b77ca8a157c8275cb76`) |
| Bound Amended-§8 Supplement | `IIPS-V3-CAP03-G4-H12-R5-AMENDED-S8-SUPPLEMENT-2026-10-25-01` (`evidence/integration/cap03-h12-r5-adoption-2026-10-25/20-amended-s8-supplemental-inventory.json` in IRR; Git blob SHA-1 `6c777de6f36bfd06ff89373540d755cc367744f2`; `287,101` bytes; raw SHA-256 `87442b0adbd061a700aa468bdd97e8b049819cc599f5ae50d7a94cfc2f33fdbf`) |
| Core Membership | **`32` IPD + `24` IRR = `56` `PRESENT` entries** (`G4-AMEND-01` Alternative A; `0` absent, `0` duplicates) + `1` conditional helper (`scripts/test-summary-parser.mjs`, `15c849fa739765af501182919748e4610acc4157`) |
| Designated IPD Primary QE Pin | `8eec74ae27cda09f3c368b9c299895eae41554db` / root tree `4eba29029f8d95cfe483e615a7047426b298ce50` (`32/32` core + `1/1` helper + `7/7` post-Gate-3 CAP-02 surface entries verified `PRESENT` and byte-unchanged at IPD `main@c6b540afd1fd3da5f18d029a54d1d89331916ead`) |
| Designated IPD Broker-Import Alias Pin | `70b24f029842a7e9b7f615e4d9df7376fd4ff817` / root tree `cc0f0117822850f9046e9a51bd05c1d45f80cd57` (`14/14` raw sources bound under 6/6 effective DQ-6b Path A; `10` identical, `4` divergent; strictly limited to IRR non-durable `build:broker-import` / DB-C1 preview) |
| Designated IRR QE Consumer Pin | `ba64b2d5927c2f872560710cf1474c25a5cde0d5` / root tree `5e4262f1cd75bf13b76ced5b45058f31434b5dad` (`24/24` core entries verified `PRESENT` and byte-unchanged) |
| Validation Basis | `981` R5 checks / `0` failures + `1,606` adoption-criteria checks / `0` failures; clean 2-build `1,140`-file `dist/**` reproducibility baseline (`81bddd5cdd007bccb391759d765f57d780cb3a9db886299890a5c0fa5c4311b2`, `npm pack` shasum `cc2aa70186b8fd7bc7255452ac8d8b00d094f53e`); `evidence_deposit_set = ABSENT_PENDING_EXECUTION` |
| IRR Publication Coordinates | To be copied by the IPD session from IRR Master Tracker `§16.123.12` post-merge publication receipt via independent GitHub API read-back |

---

## 2. Preserved Downstream Boundaries in IPD

1. **DQ-4 final QE freeze:** remains **`PREPARED AND VALIDATED — NOT ESTABLISHED`** (`8/10` criteria met; criteria `7` and `8` — native-Windows host sequence `S2 → one bounded P-1 → S3` and native-Windows canonical host evidence — remain `NOT MET`).
2. **Gate 4 & Qualification Execution:** Gate 4 remains **`AUTHORIZED — NOT STARTED`**; **`QE` remains `0/11` executed**; `S2`, `P-1` (strictly single-use), and `S3` remain **unexecuted**.
3. **Gate 5, Durable Reads, and Fences:** Gate 5 remains **`NOT INITIATED / NOT ADMITTED`**; DR-4r / DQ-3 Option B (`durable: false`) and all twelve IRR `/api/user-portfolios*` `HTTP 503` fences remain preserved unchanged; production eligibility remains **`NOT ADMITTED`**.

---

## 3. Non-Effectiveness of This Prepared File Prior to IPD Publication

| Check | Status |
|---|---|
| Published in `ramkivs/iips-production-market-data` by this IRR pass | **NO — `0` IPD writes** |
| This prepared file claimed as an IPD-side publication | **NO — prepared in IRR only** |
| Governing IRR H-12 R5 adoption act effective on IRR `main` upon IRR merge + CI + remote read-back | **YES** (`Gate 4 Act` §§8, 13, 15.3; `§16.123.12`) |


---

## 4. Step 0 verification before any write

Every value below was measured against the remotes **before** this receipt was written; nothing was
inferred from a prior record.

| Check | Observed |
|---|---|
| IPD `origin/main` | `c6b540afd1fd3da5f18d029a54d1d89331916ead`, tree `b18b5d8d2fbd5bf11a174f0e5578314ead5cbf76`; local worktree clean and **non-shallow**, exactly that commit |
| IPD open PRs | **0** |
| IPD `main` CI at the tip | run `40225262938` (push) — `success`; prior runs `40224953361`, `40196407747`, `40196130030` all `success` |
| IRR `main` | `c23069013965226c0ee3bdbd82fcfe2e0f7aa1db` (PR #280 receipt merge) |
| IRR open PRs | **0** |
| Adoption act at IRR `main` | blob `9f3aa377ab6468e8a27ec2d30bb2fc6d9395e1ff`, `30,278` B, SHA-256 `d29781bc…` — **identical** to §16.123.12's recorded identity |
| Prepared mirror text at IRR `main` | blob `d84549515d299397db879c2e96ad33de9b430fd2` , `4,686` B, SHA-256 `604f39c2…` — **identical** |
| Bound Amended-§8 supplement | blob `6c777de6f36bfd06ff89373540d755cc367744f2`, `287,101` B, SHA-256 `87442b0adbd061a700aa468bdd97e8b049819cc599f5ae50d7a94cfc2f33fdbf` — **identical** to the act's record |
| Adoption act effectiveness elements | 2-parent `--merge` into IRR `main` (parents `ac6d45b69…` + `19e5e28a5…`), exact-head CI `40228792767` `success`, post-merge CI `40228968888` `success`, IRR tip CI `40229467244` `success`, remote blob read-back identical — **all four elements satisfied** |

## 5. Independent verification of the adopted manifest against the act and against the exact R5 bytes

Two independent read-only validators were executed in this pass, writing their transcripts outside every
Git worktree and then depositing them as annex (§9):

| Validator | Scope | Result |
|---|---|---|
| `11_h12_r5_manifest_verification.txt` | manifest byte identity (blob, length, SHA-256) and every act-recorded structural term, plus per-entry re-hash of **32 IPD core + 1 conditional helper + 9 criteria basis + 10 preserved Gate 3 anchors + 10 re-measured anchors** from the local IPD object store at each entry's recorded `commit`, **24 IRR core + 3 IRR criteria/anchor** entries from the GitHub Contents API at their recorded pins, and **14/14 alias raw sources** at both designated coordinates | **374 checks executed, 0 failures** |
| `10_h12_r5_drift_and_supplement_verification.txt` | `32/32` core + `1/1` helper byte-identical at the designated pin **and** at live `main`; `7/7` post-Gate-3 CAP-02 surface entries at the designated pin and unchanged at live `main`; `11/11` companion CAP-03 conformance/consumer guards; `14/14` alias raw sources at both coordinates with the `10`-identical / `4`-divergent classification re-derived rather than assumed; the 15 intervening IPD paths between `8eec74ae…` and live `main` | **138 checks executed, 0 failures**; all 15 intervening paths are under `evidence/cross-repository/` and none is an H-12 core entry |

Confirmed in particular: `entry_count = 56`, `present_entry_count = 56`, `absent_required_or_future_count = 0`,
`ipd_entry_count = 32`, `irr_entry_count = 24`, no duplicate `(repository, path)` pair, `entries[23] =
tests/g4_run_tests_summary_parsing.test.ts` at blob `49e901b6ca957a5cc705b42e96cdeaf0365cfbc9`, the single
conditional helper `scripts/test-summary-parser.mjs` at `15c849fa739765af501182919748e4610acc4157`, and
the manifest's own `validation_state.adoption_status` still reading `NOT ADOPTED` — **the manifest bytes were
not edited by adoption**; adoption is the act's determination, and this receipt mirrors the act.

## 6. IRR publication coordinates copied from §16.123.12 by independent API read-back

| Item | Verified value |
|---|---|
| IRR PR | **#279** — `docs(cap03): adopt Gate 4 H-12 R5 manifest by PA act and reconcile DQ-6b element 6` |
| Tested head / tree | `19e5e28a540a00b2af458e4475529ab9b4f1c99b` / `8339a3b70d23113ea317ec1d2dd78269d832f7ab` |
| Exact-head CI | run `40228792767` (event `pull_request`) — **`success`**, `2026-10-25T20:01:27Z`→`20:03:21Z` |
| Merge | **MERGED** `2026-10-25T20:03:37Z` as `ae82be857a554d96e6c2cffc0d519e99135effdd`, parents `ac6d45b695bf9b79c0ec7af7d4656dc914ffccb2` + `19e5e28a540a00b2af458e4475529ab9b4f1c99b` (regular 2-parent `--merge`, tree `8339a3b7…`) |
| Post-merge `main` CI | run `40228968888` (event `push`, head `ae82be85…`) — **`success`** |
| IRR `main` after | `c2306901…` (PR #280 receipt merge); tip CI `40229467244` — **`success`** |
| Remote read-back | act `9f3aa377…`, prepared text `d8454951…`, supplement `6c777de6…`, manifest `f4649e36…` — **4/4 identical** to §16.123.12 and to this receipt's front matter |

## 7. S2 — attempted dispatch, **NOT EXECUTED**

`S2` was the second authorized action of this pass. Its mandatory preconditions were tested and **the
designated host is not reachable from this execution environment**, which is not that host:

| Precondition | Required | Observed |
|---|---|---|
| Host | `desktop-no0nhtp` | running environment is `e2b.local`; `desktop-no0nhtp` does **not** resolve (`getent hosts` / `getent ahostsv4` exit `2`), `ping` reports `Name or service not known`, and TCP `5985`/`5986`/`3389`/`22` are all unreachable |
| OS | native Windows 11 | `Linux e2b.local 6.1.158+ … x86_64`, Debian 12 (bookworm); no PowerShell / `pwsh` / `cmd.exe` |
| `process.platform` | `win32` | `linux` |
| Operator | Ramki, **not elevated** | `user`, uid `1001` (not the designated operator, on the wrong platform) |
| Node | `>=22.13.0 <23`, operator-supplied | `v22.22.3` at `/usr/local/bin/node` — in range but **not** the operator-supplied host runtime |
| `node:sqlite` | operates without experimental flags | works on this runtime, but emits `ExperimentalWarning`; the host observation is still **unmade** |
| Checkout | clean full-history `8eec74ae…` / `4eba2902…` | worktree is a clean **non-shallow** checkout of `c6b540af…` / `b18b5d8d…` — the wrong commit for S2 |

Consequence: **no S2 command was executed** — not `npm ci`, not `npx tsc --noEmit`, not `npm run build`,
not canonical guarded `npm test`, not `npm run test:package-consumer` — and **no substitute was used**:
no Linux, no WSL, no elevated shell, no alternate commit, no `dist/**` count claim, no test-total claim.
The 1,140-file `dist/**` and the 924-executed-test figures remain **pre-freeze Linux baseline** values and
are not claimed as host evidence here or anywhere in IPD. Nothing was rerun over a failure; there was no
failed run to preserve — the sequence never started.

Exact record: `IIPS-V3-CAP03-G4-H12-R5-S2-HOST-PRECONDITION-BLOCKER-2026-10-25-01`
(`evidence/cross-repository/IIPS_V3_CAP03_S2_HOST_PRECONDITION_BLOCKER_2026-10-25.md`), raw probe
transcript `30_s2_host_precondition_probe.txt`.

## 8. What this publication establishes, and what it does not

**Establishes:** the effective IRR `IIPS-V3-CAP03-G4-H12-R5-PA-ADOPTION-ACT-2026-10-25-01` is registered
in the IPD locus at a named path and blob, together with the adopted `R5` manifest identity and its bound
Amended-§8 supplement, each independently re-verified against the IPD object store, the IRR remote and the
act's own recorded digests; and the IPD qualified surface is byte-unchanged by the registration.

**Does not establish, and does not perform:** the DQ-4 final QE freeze (still `PREPARED AND VALIDATED —
NOT ESTABLISHED`, now `8/10`); any QE credit (`0/11`); Gate 4 start (`AUTHORIZED — NOT STARTED`); Gate 5
initiation or admission; any write authorization; any `503` fence lift; durable-read acceptance;
production eligibility; `S2`, `P-1` or `S3`; any `dist/**` host inventory; any pin change, re-pin,
alias modernization, re-pin retirement or lineage reclassification; any IPD decision of its own.

## 9. Annex

`evidence/cross-repository/cap03_h12r5_2026-10-25_adoption_mirror/` — `00` (Step 0 baseline and remote
state), `01` (identifier census), `02` (IRR locus read-back), `10`–`11` (manifest and drift/supplement
validators), `20` (IRR adoption-act effectiveness checks), `30` (S2 host-precondition probe), `40`–`42`
(local publication checks), `50`–`51` (independent remote read-back and CI runs). `SHA256SUMS.txt` covers
every annex file except itself.

*End of IPD mirror-receipt registration — `IIPS-V3-CAP03-G4-H12-R5-ADOPTION-IPD-MIRROR-RECEIPT-2026-10-25-01`.*
