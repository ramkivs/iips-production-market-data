# CAP-02 — Gate 4 Target-Host Qualification Authority Act — **RENDERED — EFFECTIVE ON PUBLICATION**

> ## STATUS: **RENDERED — EFFECTIVE ONLY ON PUBLICATION TO IPD `main` (§15) · GATE 4 = `AUTHORIZED — NOT STARTED` ON EFFECTIVENESS · Act ID assigned · Q1–Q12 determined · Limb A and Limb B authority granted · NOTHING EXECUTED**
>
> **Until this content is merged to `ramkivs/iips-production-market-data` `refs/heads/main` with green CI and remote read-back, this instrument is `RENDERED — NOT EFFECTIVE` and Gate 4 remains `NOT AUTHORIZED / NOT STARTED`.**
>
> This instrument is the express Program Authority determination that the Gate 4 proposal's own §9
> required, and it resolves the twelve determination questions against the **current** authoritative
> implementation and evidence basis. The proposal
> (`IIPS_v3.0_G4_TARGET_HOST_QUALIFICATION_AUTHORITY_ACT_PROPOSED_2026-10-22.md`, corrective revision 4,
> IRR blob `c02093e051155ac54adc56985bcef0d819b06fa5`, **PROPOSED — NOT EFFECTIVE**) is **adopted with
> the recorded changes at §2** and preserved unmodified as the historical statement of what was put to
> the Program Authority.
>
> **No QE item was executed. No test was changed. No runner was modified. No host was contacted. No
> result was accepted, no gate admitted, no write enabled, no fence lifted.** Gate 4 is
> `AUTHORIZED — NOT STARTED`; both limbs are blocked from *execution* by named prerequisites in §6.

| Field | Value |
|---|---|
| **Act ID** | `IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01` (census: absent from both repositories before this record; the `2026-10-22-01` candidate string was never assigned) |
| **Record type** | Rendered Program Authority decision — Gate 4 qualification authority, Q1–Q12 determinations, pins, evidence, failure and registration rules |
| **Rendered / decision date** | `2026-10-23` (UTC) — actual date, not backdated |
| **Deciding authority** | **Ramki — Program Authority**, cross-repository capacity (IRR + IPD), the capacity that rendered Gate 3 and `G3-AMEND-01` |
| **Authority exercised** | Standing grant F-3 §1.2 (IRR blob `c4c9f7d79ef181af96f6c4e5cc108288ef22fd02`) as construed by DEC-06 (IRR blob `4be3ea57…`, rules R-1/R-3), **plus** the Program Authority's explicit direction of `2026-10-23` to render this determination in this pass |
| **Adopted proposal (preserved)** | IRR `docs/integration/IIPS_v3.0_G4_TARGET_HOST_QUALIFICATION_AUTHORITY_ACT_PROPOSED_2026-10-22.md`, blob `c02093e0…`, revision 4 — **adopted with the §2 changes**; its text is not edited |
| **Companions read and preserved** | Determination packet `7d3b143e…` (D-1…D-12, PA decision sheet §6); QE matrix `b18a48a2…` (rev 4, authoritative QE-1…QE-11 text); H-12 candidate `3b64c4ac…` + validation report; Gate 3 act `4744e6f4…`; `G3-AMEND-01` `85ba78e6…`; Gate 3 acceptance `f3a6c9a3…`; Q1 act `de786032…`; Gate E policy (IPD) `4a9501bf…` |
| **Repository and locus** | `ramkivs/iips-production-market-data` — rendered in the PA's cross-repository capacity, per the Program Authority's direction. IRR is **read-only** in this pass |
| **IPD basis (selected)** | `refs/heads/main` @ **`5fc74085ade980846ff4a07b36415b6d49446486`**, tree **`7226ef0033b3a7049169d8fcf9bcbc9908e2590b`** (live `ls-remote` = fetched tip; designated blobs unchanged; drift record at §3.1) |
| **IRR basis (read-only, selected)** | `refs/heads/main` @ **`4740ba21ea6103f1a7ebc9768269ae7795920698`**, tree **`23c5ca4ae1bfd481bcfc911c70b9e7dc090e1162** |
| **Status** | **RENDERED — EFFECTIVE** on publication (§15). Gate 4: **`AUTHORIZED — NOT STARTED`** |
| **QE execution state** | **0 of 11 executed · 0 pass · 0 fail · 11 BLOCKED** (unchanged by this act) |
| **Publication receipt** | Recorded in the CAP-02 tracker **after** merge; this file is not edited after merge |

---

## 1. What this act decides, and what it deliberately does not

**It decides:** the Act ID; the adoption of the proposal with recorded changes; the exact implementation
and consumer pins and the commit-designation rule; the Limb A boundary reconciled with the effective
`G3-AMEND-01` §6.4(1) restriction, including the disposition of the already-merged
`--test-reporter=tap` line; the qualification execution tiers and the PASS-versus-limitation
distinction; the dependency ordering; the QE execution grant; the H-12 adoption/replacement rule;
evidence, failure, fixture, durability, executor and registration rules.

**It does not decide or authorize:** Gate A′ provisioning or its identity values; QE execution (blocked
by §6 prerequisites); H-12 adoption (a separate express act, §8); Gate C result acceptance; Gate 4
result acceptance; Gate 5 admission; operational writes or any W-1 change; any `503` lift; any
`durable:true` claim; production eligibility; any IRR mutation; any runtime installation; any
qualification-mode bypass; and any promotion of an off-`main` lineage.

## 2. Q1 — Act identity, disposition of the proposed act, effectiveness

| Element | Determination |
|---|---|
| **Act ID** | `IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01` assigned. The unassigned candidate `…-2026-10-22-01` is **not** adopted: a same-dated identifier would falsely imply a 2026-10-22 determination |
| **Disposition** | **ADOPTED WITH RECORDED CHANGES** (listed below). The proposal remains `PROPOSED — NOT EFFECTIVE` as an artifact and is preserved byte-identically; this instrument is the operative text |
| **Effectiveness** | On publication of this exact content to IPD `main` with green CI and remote read-back (§15). Publication alone never confers effectiveness on a *proposal*; it is the publication of the *determination* that matters here |
| **Gate 4 status** | `AUTHORIZED — NOT STARTED` (was `NOT AUTHORIZED / NOT STARTED`) |

**Recorded changes to the proposal:** (1) pins re-derived against live remote (§4); (2) the consumer pin
moved to current IRR `main` (§4.2), with the Gate 3 accepted consumer identity retained separately;
(3) Q3 now **ratifies** the already-merged `--test-reporter=tap` line instead of treating it as an
unimplemented defect, and reconciles Limb A to `G3-AMEND-01` §6.4(1) expressly (§5); (4) Q7 **replaces**
the deferred-adoption default with a mandatory regeneration-plus-separate-adoption rule (§8); (5) the
G-12 reading is settled at Q6; (6) the proposal's §14.6 "no provisioning entrypoint" statement is
superseded as a *proposal-side* statement only, because the successor Gate A′ act
(`IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01`) now grants that authority — the
Gate A′ *execution* prerequisite is unchanged and still unmet.

**Governing evidence.** Proposal §9; packet §4.1/§6 Q1; identifier census (0 hits in both repositories).
**Rationale.** Without an assigned Act ID no effectiveness is possible; without a recorded determination
the proposal authorizes nothing.
**Limitation.** This act is effective for authority only. It moves no QE item, and it does not make the
proposal effective.

## 3. Q2 — Implementation and consumer pins, and the commit rule

### 3.1 Pins (verified live in this pass)

| Role | Repository | Commit | Tree |
|---|---|---|---|
| **IPD implementation / reconciliation base** | `ramkivs/iips-production-market-data` | **`5fc74085ade980846ff4a07b36415b6d49446486`** | `7226ef0033b3a7049169d8fcf9bcbc9908e2590b` |
| **IPD QE execution pin** | IPD | **NOT YET EXISTENT** — designated only after Limb A merge (§3.2) | — |
| **IRR consumer pin (QE)** | `ramkivs/iips-review-recovered` | **`4740ba21ea6103f1a7ebc9768269ae7795920698`** | `23c5ca4ae1bfd481bcfc911c70b9e7dc090e1162` |
| **IRR Gate 3 acceptance identity (historical, retained)** | IRR | `d355d904aa52988e70a98324714886f6a1c0ea2a` (ancestor of current `main`) | `e631cf3287fc19a2d1c8f73a0eb5f8d640370e27` |
| **IRR Gate 3 acceptance record baseline (historical)** | IRR | `f2c2d3fa180f4cbc1db1e61f98b92a023b67fa61` | — |

> **IPD drift audit (documentation-only).** The basis moved from `ddaaef98…`/`29cdf772…` to `5fc74085…`/`7226ef00…` in **8 commits** (PRs **#64–#66**: 51×17 capability-matrix reconstruction, artifacts and receipts). `git diff <old> <new>` over `src`, `tests`, `scripts`, `frontend`, `package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts` and `.github` returns **0 paths**; all twelve designated implementation blobs are object-identical at the new tip; the mandatory parser test remains **ABSENT**. Re-pinned to the live tip rather than left stale — no QE criterion, pin role or non-grant changes.

**Why the consumer pin is the current IRR `main` and not `d355d904…`.** `d355d904…` is the accepted
Gate 3 consumer identity and stays recorded as such. It is **no longer the code that would run**: IRR
`main` has since advanced with effective CAP-02 surface acts — notably PR #227 merge `b321882`
(commit `04af98a`, `feat(cap02): integrate BrokerImportModal, IrrBrokerImportStorePortAdapter, and
revision-read route`, 13 paths) — under effective decisions. Qualifying a consumer commit that will not
execute would qualify a refusal, not the capability. Both identities are therefore recorded separately
and neither is silently substituted for the other.

### 3.2 The four-part commit rule

1. **Merge + green + read-back.** Any commit cited as a qualification basis must be merged `--merge`,
   have green PR-head and post-merge CI, and be `ls-remote`-agreed with remote blob read-back.
2. **Designation before the run.** The IPD QE execution pin is the **final post-merge Limb A commit**,
   and is recorded verbatim (commit, tree, blob identities) **before** host preflight and **before**
   QE-1. No future SHA is asserted, guessed or inferred here.
3. **Before/after digests.** The adopted H-12 digest set is recorded at run start **and** run end; any
   drift invalidates the run.
4. **Stop, never silent re-pin.** Any non-documentary drift in either pinned repository between this
   act and execution is a **stop condition** requiring explicit PA re-designation.

**Governing evidence.** Gate E §4 ("at recorded digests"); Gate 3 act §§2, 10; `G3-AMEND-01` `Q1-B`;
live remote state. **Rationale.** The prior proposed pins were 33+ commits stale; a stale pin severs the
identity between what is tested and what runs. **Limitation.** The IPD QE pin cannot exist until Limb A
is implemented and merged; until then no QE item may start.

## 4. Q3 — Limb A: scope, implementation boundary, regression test, and reconciliation with `G3-AMEND-01` §6.4(1)

**Governing restriction, quoted.** `G3-AMEND-01` §6.4(1) (IRR blob `85ba78e6…`, **EFFECTIVE**): *"Any
bounded repair of `scripts/run-tests.mjs`'s Windows summary parsing is **deferred to a separate PA act
within Gate 4**. It is **not** authorized here, and it may not be introduced as a Gate 3 manifest
addition."* **This act is that separate Gate 4 PA act.** It does not amend, widen or reinterpret
`G3-AMEND-01`, the Gate 3 act, the Gate 3 acceptance, or any Gate 3 manifest; the deferral is
discharged prospectively and only for the paths below.

### 4.1 Disposition of the already-merged `--test-reporter=tap` line

| Element | Determination |
|---|---|
| Fact | `scripts/run-tests.mjs` differs from the Gate 3-accepted baseline (`fe1ab1a3…`) by one line, `--test-reporter=tap`, added by PR #45 (commit `196a0e88…`) and merged; current blob `4a90d935bc74bac03902d43906ddef32e582c7b7` |
| Authority status before this act | Named by **no** effective act; treated as outside effective authority in prior records. It cannot be "implemented" retroactively because it is already on `main` |
| **Determination** | **RATIFIED prospectively** as the adopted canonical runner invocation for the qualified build. It is **not** removed, **not** re-implemented, **not** treated as proof of anything, and its presence is **not** retrospectively authorized for any Gate 3 purpose (Gate 3 acceptance stands on its own evidence) |
| Rationale | The forced TAP reporter makes the child summary shape deterministic (`# tests N`) on every platform, which is exactly what a fail-closed summary guard needs; removing it would reintroduce reporter-shape dependence and require a further act. Ratifying it prospectively is narrower than either deletion or a runner redesign |
| Limitation | Ratification confers no Windows behaviour: the recorded native-Windows canonical `npm test` failure remains **FAILED** history, and whether the wrapper passes on the designated host under Node `>=22.13.0 <23` remains **host-provable only** |

### 4.2 Limb A implementation boundary (exhaustive)

| # | Path | Permitted change |
|---|---|---|
| 1 | `scripts/run-tests.mjs` | Summary-parsing region only: line-ending normalization, the two `$`-anchored summary matches, directly associated reporting and adjacent comments. **No** change to discovery, inventory, staleness/compiled-counterpart checks, zero-test guard, child-exit propagation, the command interface, or the reporter invocation |
| 2 | `tests/g4_run_tests_summary_parsing.test.ts` | **Mandatory new file** — the §4.3 matrix |
| 3 | `scripts/test-summary-parser.mjs` | **Conditional** pure helper (no fs, exit, network, child-process or env access), only if the parser must be extracted to be testable. Present-with-digest, or recorded `ABSENT`; later appearance is drift |

**Prohibited:** any change to `package.json`, `package-lock.json`, `tsconfig*.json`,
`vite.config.ts`, `.github/workflows/**`, any `src/**` path, any existing test, any migration, and any
IRR path. **No runner redesign, no second helper, no CI change.**

### 4.3 Required regression matrix (all in the new test file)

TAP summary LF · TAP summary CRLF · spec `ℹ` summary LF · spec `ℹ` summary CRLF · zero-count summary
(must trigger the zero-guard failure, not pass) · missing summary (fail-closed) · malformed count
(fail-closed) · non-zero child exit propagation · stale/missing compiled counterpart (fail-closed).
Each case asserts **fail-closed** behaviour; none may weaken CV-35.

### 4.4 Fail-closed rule

If any of §4.2's conditions cannot hold — an unlisted path becomes necessary, a forbidden file must
change, or a matrix case cannot be made to fail closed — **stop and return for PA disposition**. A
partially green Limb A is not Limb A.

**Limitation.** Limb A is a *test-wrapper* change. It cannot qualify Windows behaviour and does not by
itself make any QE item pass.

## 5. Q4 — Qualification execution tiers, and PASS versus limitation

The three-tier, fence-preserving mechanism of the determination packet §4.4 (D-4) is **ADOPTED**.

| Tier | What runs | Fences | What it can prove |
|---|---|---|---|
| **Tier 1** | The real IPC endpoint and dispatcher with **all** production fences on (`WRITE_NOT_AUTHORIZED` before mutation; `evaluatePortSaveGuard()` hard-false) | Fully on | Refusal classes, zero-byte/zero-effect behaviour, identity and binding resolution, read-path behaviour, caller-key rejection |
| **Tier 2** | The real `DurablePortfolioStore` / domain store against **disposable copies** of the store, exercising the governed write semantics directly (the established `g3_write_gate` precedent) | Production path untouched | Revision/lifecycle, idempotency, lineage, restart and crash behaviour **of the store component** |
| **Tier 3** | The identity-refusal boundary at the session port (`portfolioStorePort.ts`, a Gate 3 §4.1 frozen anchor) with real `SecurityMaster` fixtures | Unchanged | DP-2 2F refusal semantics, quarantine detail, no mutation on refusal |

**Adopted rules.**

1. **Rejected alternatives:** any "qualification mode", any "as-if W-1" switch, any environment flag,
   any weakened guard, and any direct operational write. Each would violate W-1 or the "no local flag,
   environment variable, test result, default configuration or operator assertion substitutes for any
   predicate" rule.
2. **PASS** requires the criterion to be satisfied by an executed scenario at the designated commit on
   the designated host, with raw evidence, in the tier that can reach it.
3. **LIMITATION** is a recorded finding that a criterion is *structurally unreachable* through the
   currently authorized paths (e.g. no canonical-identity resolution in the durable write path; no
   in-transaction binding re-read inside the store). A limitation is **never** a PASS, never a silent
   omission, and never a FAIL of the implementer.
4. Tiered evidence must label its tier per scenario. **Component evidence is not full-path
   qualification.**

**Limitation.** QE-2…QE-9's admitted-write limbs will necessarily be recorded as limitations under
current authority; that is an honest measurement of the current build, not a defect this act repairs.

## 6. Q5 — Required execution ordering and dependencies

| Step | Action | Status after this act |
|---|---|---|
| **S0** | This determination → Gate 4 `AUTHORIZED` | **DONE** by this act |
| **S1** | **Gate A′ provisioning execution** on `desktop-no0nhtp` | **BLOCKED** — successor act effective, but its identity values are **unresolved** (successor act §4) and no store exists. Gate E §4 orders qualification *after* provisioning |
| **S2** | **Limb A** implementation → PR → CI → `--merge` → read-back → native-Windows canonical `npm test` at the post-merge commit | **AUTHORIZED — NOT STARTED** |
| **S2a** | Regenerate H-12 at the final IPD commit + fixed IRR commit; full validation; **separate express PA adoption** | **AUTHORIZED — NOT STARTED** (adoption itself is a separate act, §8) |
| **S3** | Host/runtime preflight (`win32`, non-elevated, Node `>=22.13.0 <23`, flag-free `node:sqlite`, clean trees at the designated commits) | **BLOCKED** until S1 and S2a |
| **S4** | QE-1…QE-11 execution and recording under §5 tiers, Q11-before/after ordering | **BLOCKED** until S3 |
| **S5** | Evidence integrity: manifests, before/after digests, byte hashes, publication and independent read-back | **BLOCKED** until S4 |
| **S6** | Dispositions: Gate C acceptance (QE-11's "accepted" limb) → Gate 4 result acceptance → Gate 5 | **NOT GRANTED** — separate acts |

**Dependencies are structural, not conventional:** provisioning precedes qualification (Gate E §4);
the entrypoint precedes provisioning; Limb A precedes the QE execution pin (the pin *is* the Limb A
merge commit); H-12 adoption follows Limb A (the mandatory test must exist to be hashed) and precedes
preflight; acceptance follows execution; admission follows acceptance.

**Limitation.** The chain is currently stopped at S1 by a value that no agent may select. This act
cannot and does not work around it.

## 7. Q6 — QE execution authority and its grant

The seven-item QE-11 **execution** grant of the historical D-GC record is **re-issued** inside this act
for the designated commits (the historical grant names the reference-only `cec70802…` lineage and is
**not** reused or amended):

1. Execute QE-1…QE-11 on `desktop-no0nhtp` at the designated commits and recorded digests.
2. Record every item verbatim, including attempts that fail.
3. Apply the Q11-before/after digest discipline (§3.2).
4. Execute Q9 (C5.1 zero bytes) with N ≥ 10 cold + 10 warm repetitions.
5. Execute Q11's Gate C subset (Q1–Q4, Q9–Q11) under the adopted H-12 and the ratified H-1…H-13
   operational criteria.
6. Treat every refusal with zero store effect (W-15).
7. Preserve raw output without normalization.

**Grant boundaries.** This grant is **execution and recording only**. QE-11's *"passed and accepted"*
second limb requires a **separate Gate C result-acceptance act**; Gate C remains `PARTIAL — Q5–Q8
DEFERRED` even after acceptance. *Passing tests, a green CI run, or a completed execution record never
satisfy QE-11's "accepted" limb.*

**G-12 reading (Q1 Gate-V currency) — determined:** the historical Gate V record plus the `D-GC-B`
waivers carry forward **for Q1's records-only limb**. Q1 is recorded as `AUTHORIZED — records only`
with the waivers stated **as waivers, never as technical proof**. The alternative reading (Q1 recorded
`INCONCLUSIVE` pending a current-basis Gate V run) is expressly **not** adopted, and is recorded here so
that the choice is not disguised as an oversight.

**Limitation.** QE-11 cannot be marked accepted by this act, and its Gate C subset remains deferred in
part.

## 8. Q7 — H-12: adoption or replacement (mandatory-file and validation rules)

**Determination: the candidate is NOT adopted; a replacement is required, then separately adopted.**

- `G4-H12-MANIFEST-v2-CANDIDATE-2026-10-22.json` (IRR blob `3b64c4ac…`, SHA-256 `3eedd70c…`) fails its
  own validation on a **mandatory** path: `tests/g4_run_tests_summary_parsing.test.ts` does not exist at
  the accepted baseline. Present-entry checks pass (55/55 entries, 9/9 criteria, 10/10 anchors, 17/17
  historical), which is **partial baseline integrity only, not full manifest validation**.
  Adopting it would adopt a known-incomplete baseline.
- **H-12 v3 (replacement) must contain, at the final Limb A commit:** **33 mandatory IPD paths** (the
  candidate's 32 + the mandatory parser test), **+1 conditional** helper (`scripts/test-summary-parser.mjs`,
  present-with-digest or recorded `ABSENT`), the **10 frozen anchors** (`ci.yml` `aeee464f…`,
  `vite.config.ts`, `package-lock.json`, the three `src/identity/*` files, the two frontend session-port
  files), the **criteria references**, the **IRR consumer set** at the designated IRR commit, the
  **runtime `dist/**` set** captured at build time, and the **evidence-deposit set** hashed when
  generated.
- **Validation rules:** per entry, verify commit, tree, path, Git blob (SHA-1), SHA-256 of raw blob
  bytes, byte length, and LF/CRLF/bare-CR counts; no normalization and no worktree filters. Expected-absent
  paths must be explicitly recorded as absent — **never fabricated, never omitted**. Any mismatch, any
  required path absent, any unverified set ⇒ **STOP**.
- **Adoption is a separate express PA act** after full validation at the exact final commit and before
  host preflight/QE. This act does **not** adopt H-12 and does **not** pre-approve a future digest.

**Limitation.** No H-12 baseline is effective today. Without an adopted H-12 v3, no host preflight and
no QE item may run (Q11 is a mandatory drift check).

## 9. Q8 — Evidence location, immutability, provenance and integrity

| Element | Determination |
|---|---|
| **Primary deposit (IPD)** | `evidence/cross-repository/cap02_gate4_qe_<YYYY-MM-DD>_<run-id>/` in this repository, containing raw artifacts only |
| **Required artifacts** | per item: command, exit code, UTC start/end, host identity, Node version, commit/tree, pre/post row counts, IPC transcripts, restart read-backs, refusal matrices, digest manifests (`sha256sum` output), and the execution record |
| **Immutability** | artifacts are written once and never edited; corrections are **new** files with a recorded reason. Each artifact's SHA-256 is recorded in a manifest that is itself hashed |
| **Provenance minimum** | host name, OS edition, elevation state, operator account (as recorded), runtime version, designated commit and tree, exact command line, UTC timestamp, exit code |
| **Publication and read-back** | merge → green CI → remote blob read-back → independent second read-back with byte comparison; digests reproduced from a fresh clone |
| **Sensitivity** | no credentials, tokens or OS secrets in any artifact; store paths are recorded verbatim (they are operator paths, not secrets) |

**Limitation.** The IRR-side deposit and any IRR tracker registration require a separate IRR act; IRR is
read-only in this pass, so **all deposits under this act are made in IPD**. This choice is recorded, not
inferred.

## 10. Q9 — Failure classifications, fixture controls, preservation of every attempt

**Classes (exhaustive):** `PASS` · `FAIL` · `INCONCLUSIVE` · `NOT EXECUTED — <reason>` ·
`INVALID` (basis or digest drift). There is no sixth class and no "pass with caveats".

**Rules.**

1. A failure is recorded as it occurred; it may not be re-run to replace the record. Re-attempts are
   **new attempts** with their own directory and their own timestamps.
2. No repair, no manual adjustment of a store, no editing of raw output.
3. **Fixture controls (D-GC-I extension adopted):** destructive items (QE-7 in particular, and the
   QE-4 restart limbs) run against **disposable isolated copies** of the operator store; provenance is
   recorded before the write; one copy per scenario; recovery by fresh copy; retention until the
   relevant acceptance act. The operator's authoritative store is never opened for a destructive
   scenario. The copy inherits no authority from the original.
4. Any observed partial state is a **FAIL finding** and a reportable defect — not something to fix
   inside the run.
5. Every attempt is preserved, including invalidated ones. Deleting an attempt is prohibited.

**Limitation.** Without the adopted fixture extension, QE-7 could not run at all; this act adopts it
only for the disposable-copy boundary described here.

## 11. Q10 — Permitted durability claims

| Item | Determination |
|---|---|
| **Permitted** | Recording the measured `durability`/`durable` values returned by the implementation; recording `SESSION_ONLY` / `durable:false` where the shipped adapter still reports it; recording that a durable commit was observed **in a named run at a named commit** |
| **Prohibited** | Any `durable:true` **product** claim; any claim that the UI saves durably; any claim of durability derived from a test result, a merged PR, green CI, a provisioned binding, or an executed QE item; any claim before a separate Gate 4 **result-acceptance** act |
| **Fixed non-claim sentence** | *"This run measured the durability behaviour of the named build at the named commit. It does not authorize a `durable:true` product claim, which requires a separate Gate 4 result-acceptance act."* |

**Limitation.** QE-4 can only ever produce *measurement* under this act; the claim remains prohibited
until S6.

## 12. Q11 — Named executor and target-host requirements

| Role | Assignment |
|---|---|
| **Executor / operator** | **Ramki** — on `desktop-no0nhtp` only: preflight, QE execution, fixture management, raw capture, execution-record attestation with **actual** values |
| **Preparer / recorder** | Arena Agent Mode — packets, act text, evidence-deposit assembly support, publication, remote read-back. **Not** execution; no host operation is ever attempted from the sandbox |
| **Verification** | (i) second remote read-back of every published artifact with byte comparison; (ii) fresh-clone digest reproduction. Recorded honestly as re-verification by the same session, **not** as a second human witness |
| **Escalation** | Any `FAIL`, `INCONCLUSIVE`, `INVALID` or stop ⇒ PA disposition before anything proceeds |

**Host requirements:** `desktop-no0nhtp`; Windows 11 Home Single Language; the **non-elevated** operator
account; `process.platform === 'win32'`; **Node 22.x `>=22.13.0 <23`**; `node:sqlite` available without
a flag; clean worktrees at the designated commits. The historical `v24.14.0` measurement is outside the
required major and is not preflight evidence. **No runtime installation or switch is authorized.**

**Limitation.** The host was not reachable from this environment (Linux sandbox); no host behaviour is
asserted anywhere in this act.

## 13. Q12 — Registration, act identification, tracker-transition rules

1. **Here (IPD):** this act and its publication receipt are registered in
   `evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md`. The receipt is written
   **only after** merge, CI and read-back, and is a separate row — publication coordinates are never
   embedded in the act itself.
2. **IRR master tracker (deferred):** the IRR registration required by packet §4.12 (next free section
   and identifiers at the time) is **not** performed in this pass because IRR is read-only. It must be
   performed by a separate IRR act, and its identifiers must be **census-checked at that time** — the
   values proposed in October (e.g. `§16.81`, `CV-CORR-61`) have since been consumed by later history.
3. **Status transitions are event-driven only:** `AUTHORIZED — NOT STARTED` now; `STARTED` at the first
   host command; `EXECUTED` when QE evidence exists; `ACCEPTED` only under a separate acceptance act.
   No row may state a status before its event, and no status here implies another gate moved.
4. **Preserved:** every existing section number, decision identifier (`AC-1…AC-8`, `D-GC-*`,
   `H-1…H-13`, `Q1-B/2-A/3-A`), register-count discipline, and the rule that act bodies are not edited
   after publication.

**Limitation.** The deferred IRR registration means the IRR-side record set will briefly disagree with
IPD; the tracker records this explicitly rather than implying a registration that did not occur.

## 14. Separate determinations this act does **not** disguise as approvals

Each of the following is required by an **effective** clause and is a distinct instrument:

| Required separate determination | Exact clause | Why it is not routine |
|---|---|---|
| Gate A′ identity values (`principal_label`, `tenantId`, `canonicalOwnerId`) | Successor Gate A′ act §4; F-3 "value-selection authority NOT EXERCISED" | A value-selection act; the standing grant withholds it |
| H-12 v3 adoption | this act §8; proposal §14.4 as adopted | Manifest adoption over a future commit cannot be pre-approved |
| Gate C result acceptance (QE-11 "accepted" limb) | Gate E §4 QE-11; D-GC §11 | Acceptance is never supplied by execution |
| Gate 4 result acceptance (W-1(3)) | Gate E W-1(3) | Separate act over executed host evidence |
| Gate 5 admission (W-1(4)) / any `503` lift | Gate E W-1(4); Q1-b §4 | Admission names qualified commits and operations |
| IRR publication / IRR tracker registration | Repository boundary; IRR read-only in this pass | Cross-repository act in the PA's IRR capacity |
| Any Node runtime installation or switch | Gate 3 act §§8.1/8.3 | Runtime policy is fixed; no amendment is granted |

## 15. Verification performed, stop conditions, and effectiveness

### 15.1 Verification (this pass)

| # | Check | Result |
|---|---|---|
| G4A-V1 | IPD live `main` = `5fc74085…` / tree `7226ef00…` (fetched tip); drift from `ddaaef98…` audited as documentation-only (0 source/test/script/CI/package paths) | **Verified** |
| G4A-V2 | IRR live `main` = `4740ba21…` / tree `23c5ca4a…`; `d355d904…` and `f2c2d3fa…` are ancestors; both recorded separately | **Verified** |
| G4A-V3 | Governing IRR blobs unchanged: Gate 3 act `4744e6f4…`, `G3-AMEND-01` `85ba78e6…`, acceptance `f3a6c9a3…`, Q1 act `de786032…`, F-3 `c4c9f7d7…`, proposal `c02093e0…`, packet `7d3b143e…`, matrix `b18a48a2…`, H-12 candidate `3b64c4ac…` | **Verified** byte-identical |
| G4A-V4 | IPD Gate E policy `4a9501bf…` unchanged (incl. §5 non-grant); `scripts/run-tests.mjs` blob `4a90d935…`; mandatory test path **absent** | **Verified** |
| G4A-V5 | Local suite at the selected basis: 875 executed / 874 passed / 0 failed / 1 skipped | **Verified — repository evidence only** |
| G4A-V6 | Identifier census: the assigned Act ID and the Gate A′ successor act ID appear in neither repository before this pass | **Verified (0 hits)** |
| G4A-V7 | No implementation, no test change, no QE execution, no host contact, no gate movement beyond `AUTHORIZED — NOT STARTED`, no PA decision fabricated elsewhere | **Verified** |

### 15.2 Stop conditions (mandatory, none waivable mid-act)

Any pin mismatch or non-documentary drift · no adopted H-12 v3 · no Gate A′ execution record · host not
`desktop-no0nhtp` or elevated · Node outside `>=22.13.0 <23` · any `--test-reporter`/runner change
beyond §4.2 · any fence weakened · any attempt to make a write succeed through an operational path ·
any missing mandatory artifact · any temptation to record a limitation as a pass. In every case: **stop,
record, return to the PA.**

### 15.3 Effectiveness

This instrument is the Program Authority determination. It becomes **EFFECTIVE** on publication of this
exact content to `ramkivs/iips-production-market-data` `refs/heads/main` (merge commit, green CI, remote
read-back). Its receipt is recorded separately in the tracker; this file is not edited after merge.
Effectiveness authorizes the work named in §§4–13 and **nothing else**; it executes nothing.

## 16. Non-grants (unchanged and exhaustive)

No Gate A′ execution; no identity value selection; no QE execution before S3; no H-12 adoption; no Gate C
acceptance; no Gate 4 result acceptance; no Gate 5 admission; no operational write; no W-1 change; no
`durable:true` claim; no `503` lift; no production eligibility; no change to Gate 3, `G3-AMEND-01`, Gate E,
contract v1 or Q1/Q1-b; no promotion of any off-`main` lineage; no runner redesign; no dependency, CI or
runtime change; no IRR mutation; no claim that any qualification, acceptance, admission or operability has
been established.

## 17. Attestation

| Claim | Value |
|---|---|
| PA determination rendered by this record | **YES — this record** |
| Act ID assigned | **YES** — `IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01` |
| Q1–Q12 determined | **YES** (§§2–13) |
| QE item executed | **NO — 0 of 11** |
| Test, runner, dependency, CI or source change | **NO** (documentation only) |
| H-12 adopted | **NO** — replacement + separate adoption required (§8) |
| Gate C accepted / Gate 4 result accepted / Gate 5 admitted / writes enabled | **NO / NO / NO / NO** |
| IRR modified | **NO** |
| Handwritten signature, approval number or third-party attestation claimed | **NO** |

*End of `IIPS-V3-G4-TARGET-HOST-QUALIFICATION-AUTHORITY-ACT-2026-10-23-01`. Gate 4 is
`AUTHORIZED — NOT STARTED`. Execution is blocked at S1 by the unresolved Gate A′ identity values and
would additionally require an adopted H-12 v3 and the designated Windows host.*
