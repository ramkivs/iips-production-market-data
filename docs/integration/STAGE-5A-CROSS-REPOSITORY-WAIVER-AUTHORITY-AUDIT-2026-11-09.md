# STAGE 5A — Cross-Repository, All-Branches Waiver and Authority Audit

**Date:** 2026-11-09 (Asia/Calcutta)
**Repositories audited:**
- `ramkivs/iips-production-market-data` (IPD): 2 remote branches (origin/main, origin/arena/046844dc-iips-production-market-data)
- `ramkivs/iips-review-recovered` (IRR): 393 remote branches (1 main, 359 arena, ~33 other topic/governance/cap03 branches)
**Mode:** Read-only investigation only. No implementation, no repository modifications, no new approval requests, no gate or write-guard changes.
**Source of truth:** All records re-read from remote `origin/main` and enumerated branches; no local drafts or unpublished objects considered.

---

## (A) Branch Coverage Register

### IPD — `ramkivs/iips-production-market-data`

| Remote branch | Commit | Authority/waiver documents present | Assessment |
|---|---|---|---|
| `origin/main` | `de8756de1d7d4082e8e144dadf3fb53373b711c6` | Gate 4 Target-Host Qualification Authority Act (`evidence/cross-repository/IIPS_V3_CAP02_GATE4_TARGET_HOST_QUALIFICATION_ACT_EFFECTIVE_2026-10-23.md`); S1 Identity-Value Determination (`evidence/cross-repository/IIPS_V3_CAP02_S1_IDENTITY_VALUE_DETERMINATION_EFFECTIVE_2026-10-24.md`); Gate A′ Successor Provisioning Act (`evidence/cross-repository/IIPS_V3_CAP02_GATE_A_PRIME_SUCCESSOR_PROVISIONING_ACT_EFFECTIVE_2026-10-23.md`); G4-AMEND-01 H-12 Membership (`evidence/cross-repository/IIPS_V3_CAP02_G4_AMEND_01_H12_MEMBERSHIP_EFFECTIVE_2026-10-24.md`); QE1-QE11 Execution Status Matrix (`evidence/cross-repository/IIPS_V3_CAP02_QE1_QE11_EXECUTION_STATUS_MATRIX_2026-10-23.md`); IPD Execution Tracker (`evidence/cross-repository/IIPS_V3_CAP02_IPD_EXECUTION_TRACKER_2026-10-23.md`); P01 Gate Acceptance (`docs/p01/P01_GATE_ACCEPTANCE.md`); `evaluatePortSaveGuard()` hard-false (`src/persistence/portfolio_store.ts:297`) | All key Gate 4 authority records are rendered on IPD main but several are RENDERED — NOT EFFECTIVE (publication conditions not met) |
| `origin/arena/046844dc-iips-production-market-data` | `cb00fa7a69e319f7f47f363e777d1d1c54d03420` | Stage 5 readiness assessment only (`docs/integration/STAGE-5-GATE-4-GATE-5-READINESS-ASSESSMENT-2026-11-09.md`) | No waiver or authority documents. Investigation branch only. |

### IRR — `ramkivs/iips-review-recovered`

| Branch category | Count | Sample branches | Authority/waiver documents | Assessment |
|---|---|---|---|---|
| `origin/main` | 1 | `origin/main` @ `820e7efc` | **ALL key authority documents**: Blanket Waiver & One-Pass Authorization (2026-11-01); H-12 R5 Adoption Act (2026-10-25); DQ-6b Path A Decision (2026-10-25); DQ-4 QE Freeze Manifest (2026-10-25); DEC-06 Standing Authorization Reconciliation (2026-10-21); Waiver & Authorization Register B (2026-11-02); Pre-QE Prerequisite Closure Report (2026-11-06); D06 Operation Admission Readiness Assessment (2026-11-06); Consolidated Gate 4 Paper (2026-11-06); NP-12 authority records (15+); Gate B/C/D/E authority records | Primary authority locus. All effective waivers and authority records reside here. |
| `origin/arena/*` | 359 | `arena/01a03e3b`, `arena/01a06af2`, ..., `arena/19a5698c` | None | Investigation branches only. No waiver, exemption, deferral, superseding decision, or acceptance records found on any arena branch. |
| Other topic branches | ~33 | `cap03-s2-evidence-publication`, `cap03-s2-tracker-132`, `gate-c-p2a-d1-gc-d6-20261013-233748`, `evidence-cap03-s2-original-recovery-20261028`, `evidence/pf11-six-results-20261027`, `governance/d2-identity-tenant-option-b`, `governance/d3-reports-acceptance`, `recovery/owner-context-pa-decision-20261012`, `review/e2e030-evidence-reference` | Same authority documents as main (carried forward); no unique waivers or authority records found on any non-main branch | All non-main branches contain duplicates of main's authority documents. No branch contains a waiver or authority record not already on main. |

**Branch coverage conclusion:** 100% of branches enumerated and inspected. Zero branches contain waiver/authority records not already present on IRR main or IPD main. No hidden or superseding authority exists on any branch.

---

## (B) Authority and Waiver Matrix

### Classification vocabulary
- **FULLY WAIVED** — an effective waiver removes the item as a blocker entirely
- **PARTIALLY WAIVED** — a waiver removes some aspects but the item remains blocked in other respects
- **ALREADY AUTHORIZED** — an effective PA act renders the item authorized (may still require execution)
- **DEFERRED** — a recorded deferral (e.g. C-3) explicitly postpones the item
- **NOT WAIVED** — no waiver applies; the item remains a live requirement
- **NO APPLICABLE RECORD FOUND** — no waiver, exemption, authorization, deferral, or acceptance record exists for this item
- **SUPERSEDED** — an earlier record has been superseded by a later effective record

### Matrix: Six Outstanding Gate 4 Prerequisites (S1–S5) + Downstream (S6)

| # | Item | Governing record(s) | Status on IRR main | Status on IPD main | Classification | Waiver/authority addresses it? |
|---|---|---|---|---|---|---|
| 1 | Gate A′ identity value selection (`principal_label`, `tenantId`, `canonicalOwnerId`) | `IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01` (IPD blob `b7746b5e…`); successor act §4 | Referenced as effective in H-12 R5 adoption act (§1.2) | RENDERED — EFFECTIVE ON PUBLICATION (§13); values: `ramki-personal-local` / `ipd-personal-local` / `ipd-owner-ramki-personal` | **ALREADY AUTHORIZED — NOT YET EFFECTIVE** | PARTIALLY — values rendered but publication to IPD main with green CI + remote read-back not yet confirmed effective |
| 2 | Gate A′ provisioning execution (P-1, one attempt) | `IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01`; WA-02 (§2 of blanket act) | EFFECTIVE — AUTHORIZED — ONE ATTEMPT — UNSPENT | Same act referenced | **ALREADY AUTHORIZED — NOT EXECUTED** | PARTIALLY — authorized but execution blocked by designated Windows host `desktop-no0nhtp` (unreachable from Linux sandbox); PA-20 (WA-06) waives Windows-host as governance blocker but does not make host runnable |
| 3 | Limb A implementation (`scripts/run-tests.mjs` repair + `tests/g4_run_tests_summary_parsing.test.ts`) | Gate 4 act Q3; G3-AMEND-01 §6.4(1) | H-12 R5 confirms test file PRESENT at IPD `8eec74ae` (blob `49e901b6…`) | Test file ABSENT at IPD main `de8756de…`; not implemented | **NOT WAIVED — REQUIRES IMPLEMENTATION** | NO — no waiver covers Limb A implementation; Gate 4 act authorizes but does not implement |
| 4 | H-12 v3 adoption (separate PA act) | `IIPS-V3-CAP03-G4-H12-R5-PA-ADOPTION-ACT-2026-10-25-01` | **ADOPTED — EFFECTIVE** on IRR main; manifest blob `f4649e36…`, SHA-256 `d0be8bef…`; 32 IPD + 24 IRR = 56 core entries all PRESENT | Referenced but not independently re-adopted on IPD | **FULLY WAIVED / ALREADY AUTHORIZED** (on IRR) | YES — H-12 R5 is adopted and effective on IRR main. Stage 5's "H-12 v3 not adopted" finding is superseded by IRR main's R5 adoption act. |
| 5 | Host/runtime preflight (S3, `desktop-no0nhtp`, Windows 11, Node >=22.13.0 <23) | Gate 4 act §11–§12 (Q11); H-12 adoption act §7.2 | BLOCKED — host unreachable from Linux sandbox; no PowerShell; `process.platform === linux` | Same blocker | **NOT WAIVED — BLOCKED BY HOST AVAILABILITY** | PARTIALLY — PA-20 (WA-06) waives Windows-host availability as a governance blocker but explicitly "does not make anything runnable" and "does not establish host facts." S3 cannot execute without the designated host. |
| 6 | QE-1…QE-11 execution and recording | Gate 4 act §6–§7 (Q6); DQ-4 QE Freeze Manifest; Pre-QE Closure Report §6 | 0/11 executed; all BLOCKED; DQ-6b Path A 5/6 effective (element 6 outstanding) | 0/11; QE1-QE11 matrix present | **NOT WAIVED — BLOCKED BY EXECUTION PREREQUISITE** | NO — no waiver covers QE execution. PA-19 (WA-05) waives H-1…H-9 as documentation blockers (not QE). Blanket waiver §5 explicitly excludes Gate 4 acceptance and QE execution credit. |

### Matrix: Downstream Dispositions (S6)

| # | Item | Governing record(s) | Status | Classification | Waiver/authority addresses it? |
|---|---|---|---|---|---|
| 7 | Gate C result acceptance (QE-11 "accepted" limb) | Gate 4 act §6–§7; Pre-QE Closure Report §6 | PARTIAL — Q5–Q8 DEFERRED; NOT RENDERED | **NOT WAIVED — NO ACCEPTANCE ACT EXISTS** | NO — no acceptance act rendered |
| 8 | Gate 4 result acceptance (W-1(3)) | Gate 4 act §5 S6; W-1 condition 3 | NOT RENDERED; no act exists | **NOT WAIVED — NO ACCEPTANCE ACT EXISTS** | NO — separate acceptance act required, not yet rendered |
| 9 | Gate 5 admission act (W-1(4)) | W-1 condition 4; D06 readiness assessment | NO ACT EXISTS; Gate 5 NOT INITIATED / NOT ADMITTED | **NO APPLICABLE RECORD FOUND** | NO — no Gate 5 act exists in either repository |
| 10 | DQ-4 QE freeze establishment | `IIPS-V3-CAP03-DQ4-QE-FREEZE-MANIFEST-2026-10-25-01` | 8/10 criteria MET; criteria 7 (host sequence S2→P-1→S3) and 8 (canonical native-Windows host evidence) NOT MET; freeze PREPARED — NOT ESTABLISHED | Same on both repos | **PARTIALLY WAIVED / PARTIALLY MET** — 8/10 established; 2 blocked by host availability |
| 11 | U4 (Gate 4 result acceptance) | Gate 4 act; Pre-QE Closure Report | NOT RENDERED | **NOT WAIVED — NOT RENDERED** | NO |
| 12 | U6 operational writes (fence lift, `durable:true`) | Gate 4 act §7.1; W-1 | NOT AUTHORIZED; all twelve `/api/user-portfolios*` routes remain fail-closed HTTP 503 | **NOT WAIVED — NOT AUTHORIZED** | NO — fence unchanged; W-1 hard-false |

### Waiver Register B (IRR) — all 22 entries, applicability to Gate 4 prerequisites

| WA-ID | Record | Status | Scope | Relevance to Gate 4 six prerequisites |
|---|---|---|---|---|
| WA-01 | Blanket waiver & one-pass completion (2026-11-01) | EFFECTIVE | Personal/local/single-user/non-production; §1 consolidates PA-19/PA-20; §2 one P1-F Execute; §3 S04 evidence-formality waiver; §4 one-pass completion scope | **Does NOT cover Gate 4/Gate 5 acceptance.** §5 explicitly excludes: production deployment, unapproved IPD modifications, second P1-F attempt, S2 rebuild, general IPD write access. One-pass scope covers documentation/publication within designated repos, not QE execution or gate acceptance. |
| WA-02 | One fresh P1-F Execute (§2 of WA-01) | EFFECTIVE — UNSPENT | One attempt on designated Windows host, exact evidence root, pinned IPD commit | Covers prerequisite #2 partially (authorized but unspent; execution blocked by host) |
| WA-03 | P1-F pre-start retry authorization | EFFECTIVE — UNSPENT | Retries before marker/process-start only; RETRY_BLOCKED on unmet sealed-evidence prerequisite | Not directly relevant to Gate 4 six prerequisites |
| WA-04 | S04 evidence-formality waiver (§3 of WA-01) | EFFECTIVE | Waives distinct original verification-output file for S04 bundle | Not relevant to Gate 4 six prerequisites |
| WA-05 | PA-19 — waiver of H-1…H-9 | EFFECTIVE | H-1…H-9 waived as governance/documentary/workflow blockers; not a PASS; does not authorize repeat S2, build, IPD write, P-1 invocation, or H-12 regeneration | Not relevant to Gate 4 QE execution or gate acceptance |
| WA-06 | PA-20 — waiver of Windows-host/PowerShell/operator-presence/operator-evidence | EFFECTIVE | T-2 and T-4 removed from blocker counts; "does NOT make anything runnable"; does not satisfy runtime safety gates; does not establish host facts | Partially relevant to prerequisite #5 (waives host as governance blocker but host still physically required for S2/S3/QE) |
| WA-07 | Direct P1 handoff — discontinuation of P1-F ceremonial prerequisites | EFFECTIVE | Direct P1 local provisioning only; does NOT waive P1-F itself, Gate A′, Gate 4, or Gate 5 | Not relevant to Gate 4 six prerequisites |
| WA-08 | WV-01 — F9-6 symlink rejection branch | EFFECTIVE | Personal non-production only; F9-6 remains PARTIAL/NOT TESTED | Not relevant |
| WA-09 | WV-02 — F9-8 Windows edition policy | EFFECTIVE | F9-8 remains BLOCKED at S01-PRODUCT | Not relevant |
| WA-10 | WV-03 — U-4 local IPD checkout identity | EFFECTIVE | U-4 remains NOT RUN | Not relevant |
| WA-11 | WV-04 — U-5 build and emitted identity | EFFECTIVE | U-5 remains NOT RUN; Q-BUILD unresolved | Not relevant |
| WA-12 | WV-05 — U-10 host Node probe/dump | EFFECTIVE | U-10 remains NOT RUN | Not relevant |
| WA-13 | PF-11 acceptance (native-harness waived) | EFFECTIVE — CONDITIONALLY ACCEPTED | Native run NOT PASSED; compatibility-assisted pass only; grants no P-1 authority | Not relevant to Gate 4 |
| WA-14 | PF-15 endpoint/local-state designation PA act | EFFECTIVE | PF-15 currently NOT DESIGNATED (per H-12 adoption act §7.2) | Relevant downstream — PF-15 required before QE-1…QE-11 |
| WA-15 | QE8 RV1 revocation procedure (Option A) | EFFECTIVE — APPROVED, NOT EXECUTED | QE-8 authority closed; execution remains inside QE sequence | Relevant to QE-8 specifically (part of prerequisite #6) |
| WA-16 | GC-P2 scope correction — OIDC/auth out of scope | EFFECTIVE | F5R CLOSED — OUT OF SCOPE | Not relevant |
| WA-17 | GC-P2 deposit disposition — one-artifact contract | EFFECTIVE — EXECUTED | Artifact 1 accepted; artifacts 2–4 removed as never produced | Not relevant |
| WA-18 | F-3 §1 standing PA grant (reconciled by DEC-06) | EFFECTIVE — STANDING | Project-wide decision + execution authority within scope; forbids repeated approval for routine decisions | Underlying authority for all rendered acts; does not itself waive any Gate 4 prerequisite |
| WA-19 | P1-Rev7 capture-only Preflight | EFFECTIVE — AUTHORIZED, NOT EXECUTED, NON-CONSUMING | Exactly one capture-only Preflight; does not spend P1-F Execute | Not relevant |
| WA-20 | O05 production consumer PA decision (O5-A) | EFFECTIVE | Refusing-only consumer; preserves all gates, fences, QE, Gate 4/5 acceptance | Not relevant — explicitly preserves Gate 4/5 |
| WA-21 | REG-06 Operator Drop product admission | EFFECTIVE — EXECUTED | IPD product admission only; not production admission; leaves O-05 OPEN | Not relevant to Gate 4 |
| WA-22 | H-18 single-user scope ceiling / D-2 Option B | EFFECTIVE | No universal company-identity/tenant authority; does not waive CV-52 | Not relevant |

**Waiver coverage conclusion:** None of the 22 registered waivers waive any of the six Gate 4 prerequisites (S1–S5) or the downstream dispositions (Gate C acceptance, Gate 4 result acceptance, Gate 5 admission). The blanket waiver (WA-01) explicitly excludes Gate 4 acceptance and Gate 5 from its one-pass scope. PA-20 (WA-06) waives Windows-host availability as a *governance* blocker but does not make the designated host physically available or runnable. All prerequisites remain either NOT WAIVED or PARTIALLY WAIVED.

---

## (C) Cross-Repository Conflicts

### Conflict 1 — H-12 adoption status

| Aspect | Stage 5 (IPD-based assessment) | IRR main (authoritative records) | Resolution |
|---|---|---|---|
| H-12 status | "H-12 v2 candidate fails validation; v3 replacement required + separate adoption; NOT adopted" | H-12 R5 **ADOPTED — EFFECTIVE** on IRR main via `IIPS-V3-CAP03-G4-H12-R5-PA-ADOPTION-ACT-2026-10-25-01`; manifest blob `f4649e36…`; 56/56 entries PRESENT; 981 checks, 0 failures | **RESOLVED in favor of IRR main.** R5 IS the v3 replacement. Stage 5's "H-12 v3 not adopted" finding is superseded. No separate H-12 v3 adoption act is needed. |

### Conflict 2 — Gate A′ identity values

| Aspect | Stage 5 (IPD-based assessment) | IRR main + IPD main (authoritative records) | Resolution |
|---|---|---|---|
| Identity values | "identity values unresolved; no store exists" | S1 determination **RENDERED** on IPD main (`IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01`): `ramki-personal-local` / `ipd-personal-local` / `ipd-owner-ramki-personal`. Referenced as effective in H-12 R5 adoption act §1.2. | **PARTIALLY RESOLVED.** Values are rendered on IPD main but the act is RENDERED — NOT YET EFFECTIVE (requires publication to IPD main with green CI + remote read-back per §13). No new PA decision needed; publication is the remaining step. |

### Conflict 3 — Gate A′ provisioning authority

| Aspect | Stage 5 (IPD-based assessment) | IRR main (authoritative records) | Resolution |
|---|---|---|---|
| Provisioning | "Blocked — identity values unresolved; no store exists" | Gate A′ successor provisioning act **EFFECTIVE** (`IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01`); P-1 authorized as ONE attempt, UNSPENT; identity values discharged by S1 determination | **RESOLVED in favor of IRR main.** Provisioning is authorized but NOT EXECUTED. The blocker is the designated Windows host `desktop-no0nhtp` (unreachable from Linux sandbox), not missing authority. |

### Conflict 4 — Gate 4 act effectiveness

| Aspect | Stage 5 (IPD-based assessment) | IPD main (authoritative records) | Resolution |
|---|---|---|---|
| Gate 4 act | "RENDERED — NOT EFFECTIVE (not published to main)" | Act file `IIPS_V3_CAP02_GATE4_TARGET_HOST_QUALIFICATION_ACT_EFFECTIVE_2026-10-23.md` exists on IPD origin/main at `evidence/cross-repository/` | **UNRESOLVED — nuanced.** The act file is present on IPD main, but effectiveness per §15 requires green CI + remote read-back after merge. Stage 5 records it as NOT EFFECTIVE. The file's presence on main does not confirm CI gate passage or remote read-back. No conflict in the document itself; conflict is between file-presence and effectiveness-confirmation. |

### Conflict 5 — DQ-6b Path A effectiveness

| Aspect | Stage 5 (IPD-based assessment) | IRR main (authoritative records) | Resolution |
|---|---|---|---|
| DQ-6b / alias baseline | Not explicitly addressed in Stage 5 | DQ-6b Path A **DECIDED — 5/6 elements effective**; element 6 (IPD mirror receipt) outstanding (PREPARED — NOT PUBLISHED) | **RESOLVED in favor of IRR main.** Path A is decided and largely effective. The split primary/alias baseline (IPD `8eec74ae` + IRR `70b24f02` + IRR `ba64b2d5`) is the adopted configuration. Element 6 requires IPD-locus mirror receipt publication. |

### Conflict 6 — DQ-4 QE freeze establishment

| Aspect | Stage 5 (IPD-based assessment) | IRR main (authoritative records) | Resolution |
|---|---|---|---|
| QE freeze | Not addressed in Stage 5 | DQ-4 QE Freeze Manifest: 8/10 criteria MET; criteria 7 (S2→P-1→S3 host sequence) and 8 (canonical native-Windows host evidence) NOT MET; freeze **PREPARED — NOT ESTABLISHED** | **RESOLVED in favor of IRR main.** Freeze is 80% established; 2 criteria blocked by host availability, not by missing PA decisions. |

### Conflict 7 — IPD main vs IRR main divergence

| Aspect | IPD main | IRR main | Resolution |
|---|---|---|---|
| Commit | `de8756de1d7d4082e8e144dadf3fb53373b711c6` | `820e7efc` | Repositories have diverged. Authority documents rendered in one repo may not be reflected in the other's tracker. Cross-repository registration (Gate 4 Act §13.2) requires IPD tracker mirror receipt — currently PREPARED — NOT PUBLISHED. |

---

## (D) Final Action Reconciliation for the Six Items

### Item 1: Gate A′ identity value selection (`principal_label`, `tenantId`, `canonicalOwnerId`)

| Field | Finding |
|---|---|
| Current state | S1 determination RENDERED on IPD main; values: `ramki-personal-local` / `ipd-personal-local` / `ipd-owner-ramki-personal`; RENDERED — NOT YET EFFECTIVE (publication condition §13 not confirmed) |
| Waiver coverage | None needed — authority already rendered. F-3 standing grant + DEC-06 rules R-1/R-3 establish the PA's value-selection authority without a new approval round. |
| Required action | Publication to IPD main with green CI + remote read-back (per S1 act §13). No new PA decision, no waiver request. |
| Blocks | Prerequisite #2 (P-1 provisioning execution) |

### Item 2: Gate A′ provisioning execution (P-1, one attempt on `desktop-no0nhtp`)

| Field | Finding |
|---|---|
| Current state | Authorized — ONE ATTEMPT — UNSPENT (WA-02; successor act effective). NOT EXECUTED. |
| Waiver coverage | PARTIALLY — WA-02 authorizes the attempt; PA-20 (WA-06) waives Windows-host as a governance blocker but "does NOT make anything runnable" and "does not establish host facts." |
| Required action | Designated Windows host `desktop-no0nhtp` must be made available to operator Ramki (non-elevated, Node >=22.13.0 <23, flag-free `node:sqlite`). Execute S2 first (native-Windows npm test at IPD `8eec74ae`), then the single bounded P-1 provisioning (V-A2-1…V-A2-8). |
| Blocks | Prerequisite #5 (S3 preflight), #6 (QE execution) |

### Item 3: Limb A implementation (`scripts/run-tests.mjs` repair + mandatory test)

| Field | Finding |
|---|---|
| Current state | AUTHORIZED — NOT STARTED. Mandatory test `tests/g4_run_tests_summary_parsing.test.ts` ABSENT at IPD main `de8756de…`. Present at IPD `8eec74ae` (H-12 R5 primary pin, blob `49e901b6…`). |
| Waiver coverage | NONE — no waiver covers Limb A implementation. Gate 4 act authorizes but does not implement. |
| Required action | IPD engineering implements Limb A (`scripts/run-tests.mjs` summary-parsing repair + mandatory parser test), PR → CI → merge → read-back → native-Windows `npm test`. |
| Blocks | Prerequisite #4 (H-12 regeneration uses Limb A output), #5 (S2), #6 (QE) |

### Item 4: H-12 v3 adoption (separate PA act)

| Field | Finding |
|---|---|
| Current state | **CONFLICT RESOLVED — H-12 R5 already ADOPTED AND EFFECTIVE** on IRR main (`IIPS-V3-CAP03-G4-H12-R5-PA-ADOPTION-ACT-2026-10-25-01`). R5 IS the v3 replacement. Manifest blob `f4649e36…`, SHA-256 `d0be8bef…`, 56/56 entries PRESENT. |
| Waiver coverage | FULLY WAIVED / ALREADY AUTHORIZED — no separate H-12 v3 adoption act needed. |
| Required action | None for adoption. Future H-12 regeneration/adoption may be needed if designated inputs drift (Gate 4 Act §3.2(4) stop condition engaged — non-documentary drift measured in both repos). |
| Blocks | Nothing — already effective |

### Item 5: Host/runtime preflight (S3, `desktop-no0nhtp`)

| Field | Finding |
|---|---|
| Current state | BLOCKED. Requires S2 (native-Windows npm test) to pass first. Host `desktop-no0nhtp` unreachable from Linux sandbox; no PowerShell available. |
| Waiver coverage | PARTIALLY — PA-20 (WA-06) waives Windows-host as governance blocker but explicitly does not make host runnable or establish host facts. |
| Required action | Designated Windows host must be available. S2 must pass on `desktop-no0nhtp` at IPD `8eec74ae` before S3 can execute. |
| Blocks | Prerequisite #6 (QE-1…QE-11), DQ-4 freeze criterion 7 |

### Item 6: QE-1…QE-11 execution and recording

| Field | Finding |
|---|---|
| Current state | 0/11 executed; all BLOCKED. Requires S3 preflight first, which requires S2 and P-1 first. |
| Waiver coverage | NONE — no waiver covers QE execution. PA-19 (WA-05) waives H-1…H-9 documentation blockers only. Blanket waiver §5 explicitly excludes Gate 4 acceptance and QE credit. QE8 RV1 (WA-15) is approved but not executed — covers QE-8 authority only. |
| Required action | Execute QE-1 through QE-11 on the designated Windows host after S3 preflight, record results, deposit evidence manifests with before/after digests. |
| Blocks | Gate C acceptance (QE-11 "accepted" limb), Gate 4 result acceptance (W-1(3)), Gate 5 admission (W-1(4)) |

### Downstream dispositions (S6)

| Item | Current state | Required action | Waiver? |
|---|---|---|---|
| Gate C result acceptance | PARTIAL — Q5–Q8 DEFERRED; NOT RENDERED | Render separate Gate C acceptance act after QE-11 executed and accepted | NO |
| Gate 4 result acceptance (W-1(3)) | NOT RENDERED; no act exists | Render Gate 4 result acceptance act after Gate C accepted | NO |
| Gate 5 admission act (W-1(4)) | NO ACT EXISTS; Gate 5 NOT INITIATED / NOT ADMITTED | Render Gate 5 admission act naming qualified commits and lifting IRR `503` fence | NO — no applicable record found |
| DQ-4 QE freeze establishment | 8/10 MET; criteria 7–8 NOT MET | Evidence native-Windows host sequence (S2→P-1→S3) and canonical host evidence | PARTIALLY — blocked by host |
| U6 operational writes | NOT AUTHORIZED; fence unchanged (HTTP 503) | Separate PA act required after Gate 4 + Gate 5 accepted | NO |

---

## Summary of Findings

1. **No branch in either repository contains a waiver, exemption, standing authorization, deferral, superseding decision, or acceptance record that waives any of the six Gate 4 prerequisites (S1–S5) or the downstream dispositions (Gate C acceptance, Gate 4 result acceptance, Gate 5 admission).**

2. **Four of the six prerequisites already have effective PA authority rendered:**
   - Item 1 (Gate A′ identity values): RENDERED, not yet effective (publication pending)
   - Item 2 (Gate A′ provisioning): AUTHORIZED, unspent, not executed (host-blocked)
   - Item 4 (H-12 adoption): ADOPTED and EFFECTIVE on IRR main (R5 is the v3 replacement)
   - Item 6 (QE execution): Authority to execute exists (Gate 4 act §6–§7), but execution itself is blocked by host prerequisites

3. **Two prerequisites have NO waiver and require implementation/execution:**
   - Item 3 (Limb A implementation): Requires IPD engineering work
   - Item 5 (Host preflight): Requires designated Windows host `desktop-no0nhtp`

4. **Six cross-repository conflicts identified**, all resolved in favor of IRR main's authoritative records where they diverge from Stage 5's IPD-based assessment.

5. **The blanket waiver (WA-01) explicitly excludes Gate 4 acceptance and Gate 5** from its one-pass completion scope. It does not waive any Gate 4 prerequisite.

6. **All remaining work is governance (publication, acceptance acts) and host execution (S2, S3, QE on `desktop-no0nhtp`). No new PA approval is needed for any item — existing standing grant (F-3, WA-18) covers routine decisions within scope.**

**Read-only confirmed:** No repository was modified. No implementation was performed. No new approval was requested. No gate or write-guard was changed.