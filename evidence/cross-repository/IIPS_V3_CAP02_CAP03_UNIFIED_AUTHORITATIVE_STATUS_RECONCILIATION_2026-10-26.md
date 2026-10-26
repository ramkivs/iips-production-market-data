# IPD-locus durable copy — IRR tracker publication blocked by session permission (403)

> The authoritative tracker lives in `ramkivs/iips-review-recovered`. This session's GitHub integration is scoped to `ramkivs/iips-production-market-data`; both `git push` and REST blob/ref writes to IRR returned HTTP 403. The complete reconciliation below and `TRACKER_PATCH_PROPOSED.diff` are published on the IPD session branch so an IRR-capable session can register §16.139 without re-investigation.

# IIPS v3.0 — CAP-02 + CAP-03 Unified Authoritative Status Reconciliation (`2026-10-26`, final pass)

> **STATUS: CURRENT-STATE RECONCILIATION ONLY.** Renders **no Program Authority (PA) decision**, executes
> **no host command**, consumes **no P-1 attempt**, credits **no QE item**, accepts **no gate result**,
> admits **no Gate 5**, lifts **no fence**, changes **no pin** and writes **no IPD `main` object**.
> It supersedes, **as current labels only**, stale "S2 NOT EXECUTED / 0 of 5" labels in §§16.125–16.129,
> §§16.130–16.131, the IPD S2 precondition blocker and the CAP-02 QE matrix. The corrected-candidate
> Windows S2 result (`924/920/0/4` + package-consumer `PASS`) is **reused, not rerun**.

| Field | Value |
|---|---|
| Record ID | `IIPS-V3-CAP02-CAP03-UNIFIED-STATUS-RECONCILIATION-2026-10-26-01` |
| Record type | Cross-workstream status/dependency/evidence reconciliation + component S2 evidence acceptance into the record (not a PA act, not gate acceptance) |
| Tracker registration | **Proposed IRR tracker §16.139 (`CV-CORR-119`, `CHG-2026-10-26-19`, `V889`–`V905`) — NOT PUBLISHED TO IRR FROM THIS SESSION.** This IPD-locus copy is the durable authoritative reconciliation; the exact tracker patch is `TRACKER_PATCH_PROPOSED.diff` in the companion evidence directory. GitHub REST/git write to `ramkivs/iips-review-recovered` returned `403 Resource not accessible by integration` for this session; an IRR-capable session must apply the patch. |
| Governing locus | IRR `ramkivs/iips-review-recovered` `refs/heads/main`; IPD inspected read-only |
| Reserved decision-maker | **Ramki — Program Authority**; the preparing capacity may not invent, select, default or infer PA-reserved values |
| Verification evidence | `evidence/integration/cap02-cap03-unified-reconciliation-2026-10-26/` (IRR) and `evidence/cross-repository/cap02_cap03_unified_reconciliation_2026-10-26/` (IPD session-branch mirror) |

---

## 1. Verified baseline (A)

Final verified remote state (`2026-10-26T14:11Z`; independent GitHub REST/Git/Actions/Blobs APIs,
non-shallow local history, Git Blobs API byte read-back — replayable `verify_unified_status.py`,
**44 PASS / 0 FAIL**):

| Repository | `main` commit | Root tree | Open PRs | Latest `main` CI |
|---|---|---|---:|---|
| IRR | **`cc3c000a11fd586c540a84a8d139c4b2c39cd121`** (PR #307, 2-parent merge `2026-10-26T14:09Z`) | **`00f55e4ecbf9a7b09acb97051c59e3bb2a1de31c`** | 0 | `40336047364` chain green |
| IPD (read-only) | **`f97b17e7d04a0c5c4573c0dbe51da2c4c595d829`** (PR #97, 2-parent merge `2026-10-26T11:29:12Z`) | **`6da6f82970fd3fb836500776708bbb6ea206baa1`** | 0 | `40315422170` `success` |

**Tracker version:** ends at **§16.138.7** (`CV-CORR-118`, `CHG-2026-10-26-18`, `V888`). Remote blob
identity/size/SHA-256 read back from the Git Blobs API is in `02-verification-results.json`.

### 1.1 Mid-pass remote movement — every newer authoritative record inspected

The first read of this pass found IRR `main@e47b589…` (PR #299). Eleven further authoritative
publications landed while reconciling; each was fetched and inspected before use:

| PR(s) | Merge | Published |
|---|---|---|
| #300 / #301 | `dbe9874f…` / `11270b85…` | §16.135 + §16.135.8 receipt (prepared PF-15 act `PROPOSED`) |
| #302 / #303 | `e15b7008…` / `1bae67d0…` | **PF-15 act `-01`** (§16.136) + receipt §16.136.8 |
| #304 / #305 | `6e080f89…` / `d9345004…` | **corrected PF-15 act `-02`** (§16.137) + receipt §16.137.6 |
| #306 / #307 | `83c6219b…` / `cc3c000a…` | **§16.138 S2 evidence-manifest verification receipt** + receipt §16.138.7 |

All exact-head and post-merge CI runs for #299–#307 (and IPD #97) are `success` (verification log).
§16.138/§16.138.7 record the **user-reported** Windows final-manifest verification (`PASS`, 47 entries,
nine required S2 filenames, clean pin, 1,140 `dist` files), state that **S2 evidence receipt publication
is COMPLETE**, and preserve two boundaries: **raw Windows evidence-byte read-back PENDING / NOT COMPLETE**
and **full S2 evidence acceptance NOT RENDERED**. No S2 rerun, test rerun, build or manifest regeneration
was performed.

**Sources inspected:** master tracker §§16.91–16.95, 16.117–16.138; CAP-02 status/dependency record,
one-pass/Gate 4 blocker, QE matrix + R1–R7 repair, host runbook, QE-8 decision packet + effective `RV-1`
act; CAP-03 DQ-1…DQ-7 packet, DR-2/DQ-1 PA decision, DQ-4 pin reconciliation + freeze manifest §7,
DQ-6b Path A + IPD mirror, H-12 R5 adoption + IPD mirror, S2 host-recovery blocker, readiness matrix,
S2 operator runbook, PF-15 request + prepared act + both effective acts, S2 count reconciliation,
S2 evidence-manifest verification receipt, IPD PR #97 record; IPD CAP-02 execution tracker, Gate 4 act
Q1–Q12, Gate A′ successor act §§4/5/8/9, S1 determination + compiled constants, host readiness packet.
The Windows host was not contacted (§6).

## 2. CAP-02 status (B)

**CAP-02 overall: PARTIAL / NOT COMPLETE** — bounded preview and all authorized implementation/evidence
work complete; host qualification, result acceptance, Gate 5 admission and write authorization open.
It is **not** a hard prerequisite for CAP-03 S2 (§16.124 `V723`).

| CAP-02 item | Status | Evidence | Remaining gap / CAP-03 effect |
|---|---|---|---|
| DB-C1 bounded preview (PR #114) | **Completed and remotely verified** | merge `271ca527…`, CI `39955624531`, 14/14 blobs | preview only; no CAP-03 effect |
| U0/B-1/B-1R/U1/U2-1…12/U7 implementation + evidence | **Completed and remotely verified** | §§16.85–16.92, IPD CAP-02 tracker blob `8a2a4e45…` (162,478 B) at IPD `main`, `7/7` post-G3 H-12 supplement | none at authorized manifest; repository-level, not host qualification |
| S1 identity values + binding commit; Gate A′ successor act/entrypoint/validator; Gate 4 host authority; H-12 membership Alt A | **Completed and remotely verified (effective decisions)** | IPD PRs #67/#68/#76/#77/#80/#81; §16.125.1; S1 determination blob `b7746b5e…`; `src/persistence/gateAPrimeValidation.ts` lines 50–52 at IPD `main` hold `ramki-personal-local` / `ipd-personal-local` / `ipd-owner-ramki-personal` | **none** — this discharges the successor act §4 identity-value reservation (see §4.2 correction) |
| H-12 R5 adoption + IPD mirror | **Completed and remotely verified** | IRR #279/#280, manifest `f4649e36…`/`d0be8bef…` re-hashed; IPD #94/#95 mirror `1e71504f…`; `56/56` core + `7/7` + `11/11` + `14/14` zero drift | none |
| QE-8 `RV-1` Option A effective PA act | **Completed and remotely verified (procedure approved, not executed)** | IRR #296/#297, act `eaf8dda5…`, §16.131.7 `8/8` read-back | one Tier-2 disposable-copy QE-8 host run |
| QE matrix + R1–R7 repair + host runbook/evidence structure | **Completed and remotely verified (preparation)** | IRR #287/#288/#292/#294; §16.127/§16.130 | all 11 QE items `HOST-ONLY`, `0/11` |
| U2-13/W-1, U6 writes, 12 `503` fences, `durable:false` | **Not authorized / safety fence intact** | `WRITE_NOT_AUTHORIZED`, `evaluatePortSaveGuard()` hard-false, fence blobs `cb8db45d…`/`51704c12…`/`e6b57bb8…` | separate U6/W-1 + Gate 5 PA acts |
| U2-14 / **P-1** single-use provisioning | **Prepared but NOT executed — unspent, single attempt; authority satisfied, eligible** | successor act §§8–9 + effective S1; no P-1 receipt in either main tree | one bounded host execution |
| U3/Gate 4 QE-1…QE-11 | **AUTHORIZED — NOT STARTED; `0/11`** | no `gate-4-target-host-qualification-*` or `cap02_gate4_qe_*` deposits | all 11 host executions |
| U4 acceptance, U5 Gate 5, Gate C acceptance | **NOT RENDERED / NOT INITIATED / NOT ADMITTED** | §16.123.7, §16.137.6 | separate PA acts after executed QE |
| G2 full views, production, live broker, fence lift | **Superseded / not applicable** | effective U7 §2 | out of scope |

**Cross-gate finding:** the CAP-02 items CAP-03 depends on (S1 values, Gate A′ authority, H-12, RV-1 and
the shared P-1) are satisfied at authority/evidence level; only the shared P-1 **execution** remains.
CAP-02 U3/U4/U5/U6 share the same host evidence but no CAP-02 gate movement is needed before CAP-03 S2/P-1.

---

## 3. CAP-03 status (C)

| CAP-03 item | Status | Evidence |
|---|---|---|
| DQ-1/DR-2, DQ-2/DR-3, DQ-3/DR-4r | **Completed and remotely verified** | effective PA decision `IIPS-V3-CAP03-DR2-DQ1-PA-DECISION-2026-10-25-01`; IPD #89, IRR #265 |
| DQ-5 host/operator/store-path process | **Completed** (names no endpoint) | §16.128.5, §16.123.6 |
| DQ-6a (PR #42 closed), DQ-6b Path A `6/6`, DQ-7a/b/c off path | **Completed and remotely verified** | §§16.104/16.122/16.123; IPD #92/#93 |
| DQ-4 freeze criteria 1–6, 9, 10 | **Completed (`8/10`)** — `PREPARED AND VALIDATED — NOT ESTABLISHED` | freeze manifest §7; §16.133.2 |
| **DQ-4 criteria 7 and 8** | **NOT MET** | §16.133.2/§16.133.5; no host sequence or canonical evidence |
| S2 Linux baseline | **Completed (non-host reproducibility)** — `924/923/0/1` | §16.128.3, §16.134.1; IPD PR #97 `12-tests.txt` SHA `39ff9da3…` |
| **S2 Windows corrected candidate** | **Executed, component validation PASS; receipt published; full evidence acceptance NOT RENDERED** — `924/920/0/4`, consumer `PASS` | IPD #96; §§16.132.3/16.134.3/16.135.4/16.138.3; `C5DDFFA2…`, `9F7C6407…` |
| **S2 final manifest verification (user-reported)** | **PASS — 47 entries, nine required files present, clean pin, 1,140 `dist` files; receipt publication COMPLETE; raw-byte read-back PENDING; full acceptance NOT RENDERED** | §16.138.3/§16.138.4/§16.138.7 (PRs #306/#307) |
| Windows package-consumer | **PASS (operator-reported; raw bytes external)** | IPD #96; §16.132.3 |
| Approved pin `8eec74ae…`/`4eba2902…` | **Unchanged; no re-pin** | §16.134.2/§16.135.3; candidate `001c3c80…` ancestor of IPD `main` (`ahead 13/behind 0`) |
| **PF-15** | **DESIGNATED / EFFECTIVE** (act `-02`, PRs #302–#305) **with a residual literal-integrity defect** (§3.2) | §§16.136/16.137; act IDs `…-2026-10-26-01` and `-02` |
| **P-1** | **NOT EXECUTED — single attempt unspent; authority satisfied; gated by S2 evidence acceptance + F4 literal confirmation + host** | §16.133.5/§16.135.6/§16.138.4; no receipt (tree census) |
| **S3** preflight PF-01…PF-17 | **NOT REACHED** | readiness matrix §5/§7 |
| **QE-1…QE-11** | **`0/11` executed**; QE-8 `PROCEDURE APPROVED (RV-1, Option A) — NOT EXECUTED` | QE matrix; §16.131; no deposits |
| Gate 4 | **AUTHORIZED — NOT STARTED**; independent doc/validation work complete | §16.123.7/§16.135.8 |
| Gate 5 / `CV-52` | **NOT INITIATED / NOT ADMITTED — BLOCKED (ACTIVE)** | §16.123.7 |
| W-1/fences/`durable:false` | **Intact** | §16.137.6; environment probe (`U`-checks) |
| §16.133/§16.134 + IPD PR #97 publications | **Completed and remotely verified** | PR #299/#97 merge+CI; §16.133.8/§16.134.6 receipts |

### 3.1 S2 evidence — provenance, integrity, acceptance, limitations

| Aspect | Verified fact |
|---|---|
| Provenance | Native Windows `desktop-no0nhtp` at `001c3c80618f2ee1d40e9a90912237e1a06e7b58` / tree `399fa44a5f1953c0f61b452420fefb5985426ef1` (parent `8eec74ae…`), merged by IPD PR #96 → `1e76f4cf…`, ancestor of `f97b17e7…`. |
| Integrity | Suite SHA-256 `C5DDFFA24393AED2E391EF8A72E8BFF1F8ECD9576C4349E182B288785F1B2941` (`924/920/0/4`); consumer SHA-256 `9F7C64073A849E57D472C9CA30BB7616D04D1951626E90587241D61A470A85B1` (`PASS`). **Raw bytes are outside Git** (`C:\iips-evidence\cap03-s2\…095613Z.txt`); neither main tree contains them and IPD Actions artifacts = **0** → independent re-hash **NOT COMPLETE**. |
| Acceptance | Component validation only: proves the Windows ESM/`npm` launch fix and that no test was silently dropped; **not** full CAP-03 qualification, **not** QE, **not** Gate 4 acceptance. This §16.138 publishes its acceptance **into the record for P-1 ordering only** per S2 runbook §5 (governed IRR PR → green CI → regular merge → green post-merge CI → remote read-back). |
| Limitations | **D1 — CONTROLLING:** raw-byte verification of the 47 manifest-listed Windows files (at minimum the nine §16.138.3 files, the final manifest and the manifest-verification output) is **PENDING / NOT COMPLETE**; Arena has no read-only route to `C:\iips-evidence\cap03-s2\` and both repos have 0 Actions artifacts. **D2 (closed as reported):** §16.138.3 records all nine S2 command/evidence files present and verified against the 47-entry manifest — the earlier "only 2 of 5 commands" gap is superseded as a *reported* fact, not independently re-hashed. **D3:** coordinate differs from approved pin `8eec74ae…` (two changed paths are non-H-12 harness/test files; no silent re-pin). **D4 — CONTROLLING:** **full S2 evidence acceptance is NOT RENDERED** (§16.138.4); receipt publication alone is not acceptance, and the S2 runbook §5.2 requires evidence accepted into the record before continuing. |
| Determination | **The S2 execution itself satisfies its technical prerequisite — do not rerun it.** But the **evidence prerequisite is NOT yet satisfied**: D1 (independent raw-byte read-back) and D4 (full evidence acceptance) remain; D2 is closed only as a user-reported fact. Therefore **P-1 is not yet admissible** and **DQ-4 criterion 8 is not met**. The exact deficiency is an evidence-provenance/integrity gap, not a failed test: §16.138.4 names the exact next action — operator supplies read-only copies of the 47 manifest-listed files through an approved artifact channel; Arena recomputes SHA-256 per file, compares to the manifest, and publishes a dated addendum; only then can a distinct S2 evidence-acceptance record be rendered. No S2/test/build/manifest regeneration is authorized. |

### 3.2 Two integrity corrections to the newest PF-15 records (material to admissibility)

**(a) PF-15 was rendered effective during this pass.** Ramki supplied F1–F6 in the 2026-10-26 execution
directive; act `-01` (PR #302/#303, §16.136) and the corrected successor act `-02` (PR #304/#305, §16.137)
are effective on IRR `main` with green exact-head/post-merge CI and independent remote read-back. Current
determinations: **F1** Option A (explicit Windows named pipe); **F2** `IIPS_G2_IPC_ENDPOINT` — the pipe
literal recorded in the act; **F3** `IIPS_G3_LOCAL_STATE_DIR = N/A`; **F4** `IIPS_G3_DATABASE_PATH`/
`$StorePath` — the `C:\iips-data\iips\user-portfolio.sqlite` literal recorded in the act; **F5**
`$EvidenceRoot` — the `C:\iips-evidence\cap03-gate4` literal recorded in the act; **F6** shared
CAP-03 + CAP-02 host IPC/persistence scope. **No PF-15 value is invented, selected or normalized here**;
host use must copy the operative act bytes verbatim.

**(b) Residual literal-integrity defect (new finding, evidence-backed).** §16.137 declares act `-01`'s
F2/F4/F5 Markdown code spans contained "excess literal backslashes" and that act `-02` re-records "the
exact literal characters". A direct byte-level diff of the two published acts shows **the F1–F6 table rows
— including all three path literals — are byte-identical**; act `-02` changed only the title, status
notice, act ID, a "Correction and supersession" section and the footer (`diff` evidence in
`05-pf15-literal-integrity.txt`). Therefore, **if act `-01`'s literals were defective, act `-02`'s are
identically defective**. §16.137.6's "exact F2/F4/F5 code-point checks passed" is not sufficient evidence
that the operative bytes match the PA-approved literals. Only **Ramki (PA)** can confirm the exact code
points or render a genuinely corrected act; the preparing capacity must not normalize, unescape or guess a
Windows pipe/store/evidence path. Until that confirmation is published, the F2/F4/F5 literals are
**STOP for host use**: P-1 must not create a store at an unconfirmed F4, and S3/QE must not bind an
unconfirmed F2. This is a **technical/integrity blocker with a PA confirmation boundary**, not a new
value-selection request and not a reason to rerun S2.

**(c) False P-1 identity-value blocker corrected.** §16.136.4/§16.136.7, §16.137.3/§16.137.5 and
§16.137.6 state that P-1 execution "remains NOT AUTHORIZED while `principal_label`, `tenantId`,
`canonicalOwnerId` are unresolved" and ask for a fresh PA identity-value determination. That reading uses
the successor act §4 at its own 2026-10-23 baseline and ignores the later effective
`IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01` (IPD PR #80, determination blob
`b7746b5e…`), which names all three values, and the compiled constants at IPD `main`
(`src/persistence/gateAPrimeValidation.ts` lines 50–52: `ramki-personal-local`, `ipd-personal-local`,
`ipd-owner-ramki-personal`). §16.125.1, §16.128.4 and §16.133.5 independently record that the S1 value
blocker is discharged and that P-1 authority is issued (single-use, unspent). **No new PA identity-value
decision is outstanding.** This is a dated current-state correction only; the earlier sections are
preserved unedited as historical snapshots.

---

## 4. Unified dependency matrix (D)

Status vocabulary: **C** = completed and remotely verified; **EA** = executed, evidence acceptance
outstanding; **PNE** = prepared but not executed; **PC** = partially complete; **TI** = blocked by
technical/integrity issue; **AD** = blocked by outstanding authority decision; **NS** = not started;
**S/NA** = superseded or no longer applicable.

| # | Work item / gate | Current verified status | Authoritative evidence | Dependencies | Outstanding work | Blocks which downstream items? | Can authorized work proceed now? | Exact next action |
|---|---|---|---|---|---|---|---|---|
| 1 | CAP-02 DB-C1 / PR #114 preview | **C** (bounded) | §16.91/§16.124; `271ca527…`, CI `39955624531` | none | none | none | n/a | preserve; no restart |
| 2 | U0/B-1/B-1R/U1/U2-1…12/U7 | **C** | §§16.85–16.92; IPD tracker `8a2a4e45…` | none | none | none | n/a | preserve; no restart |
| 3 | S1 values, Gate A′ authority, Gate 4 host authority, H-12 Alt A | **C — effective; discharges successor §4** | IPD #67/#68/#76/#77/#80/#81; S1 blob `b7746b5e…`; `gateAPrimeValidation.ts:50–52` | none | none | P-1/QE | n/a | do not reopen (§3.2c) |
| 4 | H-12 R5 adoption + IPD mirror | **C** | IRR #279/#280; IPD #94/#95; `f4649e36…`/`d0be8bef…` | DQ-6b | none | Gate 4/QE | n/a | preserve zero drift |
| 5 | `RV-1` / QE-8 procedure PA act | **C — effective; not executed** | IRR #296/#297; `eaf8dda5…` | none | one Tier-2 disposable-copy run | QE-8 only | n/a | do not reopen |
| 6 | CAP-02 QE matrix + R1–R7 + host runbook | **C (preparation)** | IRR #287/#288/#292/#294 | none | QE execution | Gate 4 | n/a | preserve |
| 7 | DQ-1…3/5/6a/6b/7 decisions | **C** | §§16.117–16.123; IPD #89/#92/#93 | none | none | DQ-4 1–6 | n/a | preserve |
| 8 | §16.133/§16.134 publication + PR #299 receipt | **C** | `e47b589…`, CI `40315801301`/`40316031598`; §16.133.8/§16.134.6 | none | none | baseline | n/a | preserve |
| 9 | IPD PR #97 evidence (`16/16`) | **C** | `f97b17e7…`/`6da6f829…`, CI `40315257221`/`40315422170`, comment `6414952274` | none | none | baseline | n/a | preserve |
| 10 | IRR #300/#301 — §16.135 + receipt | **C** | `dbe9874…`/`11270b8…`; CI `40324552331`/`40324807938`/`40325596271` | none | none | baseline | n/a | preserve |
| 11 | **PF-15 designation (F1–F6)** | **C — DESIGNATED / EFFECTIVE (act `-02`)** | IRR #302/#303/#304/#305; §§16.136/16.137; CI `40330588730`/`40330902302`/`40332489138`/`40332807775` | PA directive (satisfied) | none at designation level | S3/QE prerequisite removed | n/a | do not re-render values |
| 12 | **PF-15 exact F2/F4/F5 literals** | **TI + PA confirmation boundary** — act `-02` F rows byte-identical to declared-defective act `-01` | `05-pf15-literal-integrity.txt`; §16.137.1 vs §16.137.6 | PA code-point confirmation | genuinely corrected act or explicit PA byte confirmation | P-1 store creation (F4), S3/QE endpoint (F2), evidence root (F5) | **Arena: yes** (defect record, no value change); **PA: yes now** | PA confirms exact code points in a distinct effective act/statement |
| 13 | S2 Linux baseline (`924/923/0/1`) | **C — non-host only** | §16.128.3/§16.134.1 | none | none | none | n/a | never cite as host qualification |
| 14 | **S2 Windows validation** (`924/920/0/4` + consumer `PASS`) + 47-entry manifest `PASS` | **EA** — executed and receipt published; **full evidence acceptance NOT RENDERED** | IPD #96; §§16.132.3/16.134.3/16.135.4/16.138.3/16.138.7 | two-file fix, PR #96 | independent raw-byte read-back + acceptance record | **P-1 admissibility**; DQ-4 criterion 8 | **Arena: yes** (verification/addendum once bytes arrive); **operator: yes now** (read-only transfer) | **SINGLE NEXT ACTION — read-only transfer of the 47 manifest files (§5.2)** |
| 15 | Approved pin `8eec74ae…`/`4eba2902…` | **C — unchanged** | §16.134.2/§16.135.3 | PA designation | coordinate-alignment note vs `001c3c80…` | DQ-4 establishment | Arena: yes (note); PA: re-pin only if promoted | record note at P-1/S3; no silent re-pin |
| 16 | **P-1 single-use provisioning** | **PNE — unspent; authority satisfied; NOT YET ADMISSIBLE** (S2 evidence acceptance + F4 confirmation + host outstanding) | successor act §§8–9 + effective S1; no receipt; §16.138.4 | accepted S2 evidence; effective PF-15 with confirmed F4; host; PF-01…14/16/17; non-existent NTFS store | **one bounded host execution** | S3, QE-1…11, DQ-4 7/8, U3/U4/U5 | **Arena: no** (host-only); **operator: after #14 acceptance + F4 confirmation** | after #14: execute P-1 on `desktop-no0nhtp` |
| 17 | **S3 preflight PF-01…PF-17** | **NS** | readiness matrix §5/§7 | P-1 receipt + effective PF-15 + confirmed F2 + host | host preflight evidence | QE-1…11, DQ-4 7/8 | no | after #16 and #12 |
| 18 | QE-1…QE-7, QE-9…QE-11 | **NS (`0/11`)** | QE matrix; no deposits | S3 + Q11-before + H-12 + host | 10 host executions | U4/Gate C/Gate 5 | no | after #17 |
| 19 | QE-8 | **PNE — procedure approved (`RV-1` Option A), Tier-2 ceiling** | §16.131; `eaf8dda5…` | P-1 store + S3 + disposable copy | one disposable-copy execution | U4 (component only) | no | after #17 |
| 20 | DQ-4 criterion 7 (`S2→P-1→S3`) | **NS** | freeze manifest §7 | #14 acceptance/#16/#17 | ordered host sequence + receipts | DQ-4 establishment | after #14/#16/#17 | execute ordered sequence |
| 21 | DQ-4 criterion 8 (canonical Windows evidence) | **TI** (raw-byte read-back PENDING + F2/F5 literals) | §16.135.4/§16.138.4; tree/artifact census | #14 D1/D4 + #12 + #17 + QE transcripts + `Q11-BEFORE/AFTER` + `MANIFEST.json` | read-only transfer/re-hash + full raw deposit | DQ-4 establishment | Arena: docs; host: yes | close D1/D4 at evidence deposit |
| 22 | DQ-4 freeze establishment act | **AD/NS — `8/10` NOT ESTABLISHED** | freeze manifest §7 | criteria 7/8 | distinct PA freeze act | final designation stability | no | after #20/#21 |
| 23 | Gate 4 (CAP-02 U3 / CAP-03) | **PC — AUTHORIZED, NOT STARTED; QE `0/11`** | Gate 4 act §15.3; §16.123.7 | #16–#19 | QE + result acceptance | U4, Gate 5 | **YES for independent docs/validation only** | no gate movement |
| 24 | Gate C / U4 result acceptance | **NS — NOT RENDERED** | Gate 4 act §§7/14 | executed QE evidence | separate PA acceptance acts | Gate 5, W-1 | no | after QE |
| 25 | Gate 5 / `CV-52` | **AD/NS — NOT INITIATED / NOT ADMITTED** | §16.123.7 | U4 | separate PA admission act | W-1, production | no | after #24 |
| 26 | U6/W-1 writes, 12 `503` fences, `durable:false` | **S/NA — not authorized; intact** | fence blobs; environment probe | Gate 5 | separate PA act | production | no | preserve |
| 27 | `CV-24` (`F6`/`TD-7b`) | **AD — separate, off critical path** | register §16.12 | none on this path | one combined PA act | none here | PA only, optional | no dependency change |
| 28 | Executing environment / host boundary | **TI — Linux sandbox is not `desktop-no0nhtp`** | `01-executing-environment-probe.txt` | physical host access | operator Windows session | #16, #17–#21 | Arena: docs/validation only | operator opens host session |
| 29 | **S2 raw-byte read-back + evidence acceptance** (§16.138.4 exact next action) | **TI — PENDING / NOT RENDERED** | §16.138.4/§16.138.7; 0 artifacts; no host route | read-only copy of 47 manifest files (≥ nine + final manifest + verification output) via approved artifact channel | Arena recomputes SHA-256 per file vs manifest, publishes dated addendum + distinct acceptance record | **P-1**, DQ-4 7/8, S3/QE | **Arena: yes once bytes arrive**; **operator: YES now** | **transfer read-only copies; no rerun** |

---

## 5. Cross-gate dependency sequence and the single next action (E)

### 5.1 Answers to the nine dependency questions

1. **CAP-02 outstanding:** U3/QE, U4 acceptance, U5 Gate 5, U6/W-1 and the shared P-1 execution. All
   CAP-02 decisions, implementation, H-12, RV-1 and publication work is complete.
2. **CAP-02 prerequisites for CAP-03:** S1 values, Gate A′ authority, H-12, RV-1 — **all satisfied**;
   the shared P-1 execution is the only unsatisfied CAP-02-origin prerequisite.
3. **Completed CAP-03 work not to repeat:** DQ-1…7, H-12 R5, DQ-4 1–6/9/10, S2 Linux and Windows
   component runs, package-consumer fix, PR #97 evidence, the 47-entry Windows manifest verification
   (user-reported `PASS`) and its receipt, §§16.133–16.138 publications, **PF-15 F1–F6 designation
   (PRs #302–#305)**.
4. **P-1 eligibility:** **NO — not yet admissible.** Authority is satisfied (S1 discharged, PF-15
   designated, single attempt unspent), but the S2 evidence prerequisite is not: full S2 evidence
   acceptance is NOT RENDERED and raw-byte read-back is PENDING (§16.138.4/§16.138.7). Add the host
   session and PA confirmation of the exact F4 literal (§3.2b). Arena can execute none of these.
5. **PF-15:** **no longer an outstanding PA designation decision** — rendered effective during this pass.
   The residual **exact-literal code-point confirmation** is a genuine PA boundary (§3.2b); agents may not
   normalize or invent path bytes.
6. **S3 / QE-1…QE-11 admissibility:** **NO** — require accepted S2 evidence, P-1 receipt, effective
   PF-15 with confirmed F2, green S3 preflight, Q11-before digests, host evidence root, and (QE-8) a
   disposable copy.
7. **DQ-4 criteria 7/8:** criterion 7 = ordered `S2→P-1→S3` host sequence with receipts; criterion 8 =
   canonical native-Windows evidence including D1–D4 closures, QE transcripts, `Q11-BEFORE/AFTER`, and
   `MANIFEST.json` with verbatim (PA-confirmed) endpoint/store/evidence paths. Then a distinct PA freeze act.
8. **Gate 4 / Gate 5 independent work:** Gate 4 documentation/validation/manifest evidence is complete and
   can continue; no gate movement or QE credit without host execution. Gate 5 has no independent execution
   work — only future record preparation.
9. **Other dependency changes:** §16.138 (PRs #306/#307) is the newest authoritative S2 record and
   supersedes the earlier "S2 satisfies its prerequisite / P-1 next" inference: **S2 evidence acceptance
   is the controlling gate**. The §16.136/§16.137 claim of an unresolved S1 identity-value PA decision is
   **incorrect** (§3.2c). The PF-15 literal defect (§3.2b) is a second admissibility condition. `CV-24`
   remains off-path; all 12 fences remain intact.

### 5.2 Single next action

> **Provide read-only copies of the 47 manifest-listed Windows S2 evidence files — at minimum the nine
> §16.138.3 required files, the final manifest and the manifest-verification output — from
> `C:\iips-evidence\cap03-s2\` through an approved artifact channel, without altering the originals.
> Arena then recomputes SHA-256 per file, compares each digest to the manifest, publishes a dated
> verification addendum, and only then renders the distinct S2 evidence-acceptance record.
> No S2 rerun, test rerun, build or manifest regeneration.**

- **Prerequisites:** the completed, user-reported 47-entry `PASS` (§16.138.3) and the published receipt
  (§16.138.7) already exist; no new execution is needed. An authorized read-only channel from
  `desktop-no0nhtp` to an Arena-inspectable location (e.g. a repository evidence deposit or an approved
  artifact upload) is the only missing input. Both repositories currently hold **0** Actions artifacts and
  no copy of the nine Windows files.
- **Governing procedure:** §16.138.4 "Exact next action (no rerun)"; S2 operator runbook §5 (evidence
  accepted into the record before continuing); Gate 4 act §9 (raw evidence, immutability, provenance,
  integrity, `INVALID` on digest drift); §16.130.6 publication protocol (no self-embedded coordinates).
- **Required evidence:** the nine files in order — `s2-01-npm-ci.txt`, `s2-02-tsc-noemit.txt`,
  `s2-03-build.txt`, `s2-03-dist-count.txt`, `s2-03-dist-sha256-before.txt`,
  `s2-04-guarded-npm-test.txt`, `s2-05-package-consumer.txt`, `s2-post-run-pin.txt`,
  `s2-dist-sha256-after.txt` — plus the final 47-entry manifest and the manifest-verification output;
  `windows-session-transcript.txt` is explicitly **not** one of the 47 entries (locked during hashing).
- **Acceptance condition:** every file's independently recomputed SHA-256 equals its manifest entry; all
  nine required files present; `1,140` `dist` inventory, clean pin/tree, `924/920/0/4` guard tail and
  consumer `PASS` corroborated; a dated addendum plus a **distinct S2 evidence-acceptance record** is
  published on IRR `main` with green exact-head + post-merge CI and independent remote read-back. Until
  then DQ-4 criterion 8 remains NOT MET and P-1 is not admissible.
- **Subsequent step (strict order):** with accepted S2 evidence and PA-confirmed F4, execute the **single
  bounded P-1** (`V-A2-1`…`V-A2-8`) on `desktop-no0nhtp`; then `S3` PF-01…PF-17 (confirmed F2) →
  `Q11-BEFORE` → `QE-1`…`QE-11` (QE-8 on a disposable copy) → `Q11-AFTER` + evidence integrity →
  separate Gate C/U4 acceptance acts → DQ-4 freeze establishment PA act → separate Gate 5 admission.
- **Why this is next and why nothing is repeated:** §16.138.4 (the newest authoritative record, published
  mid-pass by PRs #306/#307) explicitly names this read-only transfer as the exact next action.
  The 47-entry manifest verification is **reported complete**; repeating S2, the guarded suite, the build
  or the manifest would duplicate completed work. P-1, PF-15 and S3 are *not* automatically next:
  PF-15 has been rendered effective, S1 values are discharged, and the remaining gate is **S2 evidence
  acceptance**, which the runbook §5.2 makes a precondition of P-1. Arena cannot fetch the bytes itself
  (Linux sandbox, host unresolved, 0 artifacts) — no host work is claimed here.

---

## 6. Remaining blockers and authority boundaries (G)

| Blocker | Type | Who/what resolves it | Authorized work that can continue |
|---|---|---|---|
| Exact F2/F4/F5 code points in the PF-15 acts (§3.2b) | **Technical/integrity + PA confirmation boundary** — act `-02` did not change the operative literals | **Ramki (PA)** confirms bytes or publishes a genuinely corrected act; agents must not unescape/normalize | this reconciliation and byte-diff evidence (published here); no host use of the literals |
| ~~New PA identity-value determination for P-1~~ | **Superseded / not a blocker** (§3.2c) | already discharged by effective S1 determination + merged constants | none required |
| Native Windows host `desktop-no0nhtp` (non-elevated Ramki) | **Host boundary** — Linux sandbox, host unresolved | physical operator session | all repository-side documentation, CI/validator and tracker work |
| **S2 raw-byte read-back + full evidence acceptance** (D1/D4) | **Evidence integrity / technical** — **blocks P-1 and DQ-4 criterion 8** | operator supplies read-only copies of the 47 manifest files; Arena re-hashes + publishes addendum + distinct acceptance record | Arena publishes the disposition (this record); **no S2 rerun** |
| DQ-4 criteria 7/8 + freeze establishment | **Prerequisite-dependent + later PA act** | P-1 + S3 + QE evidence, then distinct PA freeze act | freeze manifest/validators/classification already complete |
| Gate C/U4 acceptance, Gate 5 (`CV-52`), W-1/U6 | **Reserved PA acts** | Ramki (PA) after executed, accepted QE evidence | record preparation only; no fence/pin/route change |
| Approved-pin promotion `8eec74ae…` → `001c3c80…` (only if ever needed) | **PA-governed determination** | Ramki (PA), explicit re-designation | coordinate note suffices for P-1/S3 |
| `CV-24` (`F6`/`TD-7b`) | **Separate PA decision, off critical path** | Ramki (PA), optional/scheduled | does not affect this next action |
| ~~New PA identity-value determination for P-1~~ | **Superseded / not a blocker** (§3.2c) | already discharged by effective S1 determination + merged constants | none required |

---

## 7. Scope, non-grants and verification log (F/H)

This pass changed **documentation/evidence/tracker only**. It executed **no** S2/P-1/S3/QE command,
created **no** store, binding, membership, copy, endpoint or evidence root, wrote **no** IPD `main`
object, changed **no** `src/`/`tests/`/`scripts/`/manifest/lockfile/pin/fence/route/workflow path,
rendered **no** PA decision, moved **no** gate, credited **no** QE item and claimed **no**
acceptance/admission/production eligibility. All 12 `/api/user-portfolios*` `503` fences,
`WRITE_NOT_AUTHORIZED`, `durable:false`/`SESSION_ONLY` and the `CV-*` register counts (`35` total,
`5` active outstanding) remain unchanged.

| ID | Check | Result |
|---|---|---|
| `V889`–`V891` | IRR/IPD remote refs, commit+tree SHAs, PR #97 2-parent ancestry | **PASS** |
| `V892`–`V899` | IRR #299–#307 + IPD #97 merged state/heads/merge commits/CI | **PASS** |
| `V900`–`V901` | Tracker remote blob identity/size/SHA-256 + completeness (§§16.133–16.138 + receipts) | **PASS** |
| `V902` | H-12 R5 manifest + IPD mirror integrity | **PASS** |
| `V903` | S2 provenance/digests/raw-byte absence + §16.138 receipt/47-entry report + PR #96/candidate ancestry | **PASS** |
| `V904` | Negative P-1/QE/freeze searches; S1 determination + compiled constants; PF-15 act `-01`/`-02` byte diff | **PASS as evidence of defect** |
| `V905` | Host/environment boundary + `git diff --check` + identifier census | **PASS** |
| — | Replayable verification suite | **44 PASS / 0 FAIL** (`02-verification-results.json`, `03-verification-summary.txt`) |

*End of `IIPS-V3-CAP02-CAP03-UNIFIED-STATUS-RECONCILIATION-2026-10-26-01` — current-state reconciliation
only: S2 reused and its evidence-acceptance gap identified as the exact next action, PF-15 designated
(with an exact-literal PA confirmation boundary), no gate,
fence, pin or write changed.*
