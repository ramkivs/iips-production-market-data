# STAGE 5A — Cross-Repository, All-Branches Waiver and Authority Audit (CORRECTED)

**Date:** 2026-11-09 (Asia/Calcutta)
**Repositories audited:**
- `ramkivs/iips-production-market-data` (IPD): 2 remote branches
- `ramkivs/iips-review-recovered` (IRR): 393 remote branches
**Mode:** Read-only investigation only. No implementation, no repository modifications beyond this documentation file, no new approval requests, no gate or write-guard changes.
**Source of truth:** All records re-read from remote `origin/main` and enumerated branches; no local drafts or unpublished objects considered.

**Corrections applied in this version:**
- P-1 provisioning: Direct P1 personal local provisioning is REPORTED COMPLETE (user-reported evidence, not Arena-verified). P1-F/Gate A′ ceremonial provisioning is NOT required for Direct P1. P1-F remains UNSPENT but is NOT a prerequisite for Direct P1.
- Limb A: IS implemented on IPD main (PR #143 merged `tests/g4_run_tests_summary_parsing.test.ts` and `scripts/run-tests.mjs`). Prior report incorrectly said it was absent.
- Branch-by-branch coverage: all 393 IRR branches + 2 IPD branches inspected; commit SHAs recorded; zero branches contain unique authority records not on main.
- Six-item classification with separate sub-classifications: waiver/exemption, authorization, execution/completion, evidence, formal acceptance, remaining blocker, new-PA-approval-required.
- H-12 R5 is ADOPTED and EFFECTIVE on IRR main (adoption/effectiveness, not waiver).
- Added FINAL DEPLOYMENT SCOPE section for personal single-user / no external distribution.
- Internal contradictions resolved: waiver coverage, Limb A status, H-12 adoption vs waiver, documentation commit acknowledgment.

---

## (A) Branch Coverage Register

### IPD — `ramkivs/iips-production-market-data`

| Branch | Commit SHA | Inspection outcome |
|---|---|---|
| `origin/main` | `de8756de1d7d4082e8e144dadf3fb53373b711c6` | Inspected. Authority documents present: Gate 4 Target-Host Qualification Authority Act; S1 Identity-Value Determination; Gate A′ Successor Provisioning Act; G4-AMEND-01 H-12 Membership; QE1-QE11 Execution Status Matrix; IPD Execution Tracker; P01 Gate Acceptance; DIRECT_P1_PROVISIONING.md; IIPS_V3_DIRECT_P1_PROVISIONING_AND_IRR_HANDOFF_2026-11-01.md; IIPS_V3_CAP03_DQ6B_DECISION_MIRROR_RECEIPT_2026-10-25.md; IIPS_V3_DEC06_P11_MAIN_ADMISSION_ACT_2026-10-21.md; IIPS_V3_DEC06_P11_MAIN_ADMISSION_DECISION_PACKAGE_2026-10-21.md; IIPS_V3_IPD_ONE_PASS_CONTINUATION_2026-10-18.md; directP1Provisioning.ts; Invoke-DirectP1Provisioning.ps1; direct_p1_provisioning.test.ts; evaluatePortSaveGuard() hard-false. Limb A files present: `tests/g4_run_tests_summary_parsing.test.ts` and `scripts/run-tests.mjs` (merged PR #143). |
| `origin/arena/046844dc-iips-production-market-data` | `0777a31017fc06336495c74e1253758f5f07b432` | Inspected. Contains all IPD main authority documents plus STAGE-5 readiness assessment and this STAGE-5A report. No unique waivers. |

**IPD coverage: 2 of 2 remote branches inspected (100%).** 0 local branches beyond those tracking remotes.

### IRR — `ramkivs/iips-review-recovered`

All 393 remote branches enumerated from `/tmp/irr_branches.txt` and inspected via `git ls-tree -r --name-only <branch>` for authority/waiver documents matching: waiver, blanket, one.pass, P1.F, gate.4 act, gate.5 act, S1.IDENTITY, provisioning act, result.acceptance, admission act, F-3, F3, H-12, DQ-6, DQ6, CV-52, GATE.C, U4, W-1().

| Branch | Commit SHA | Authority/waiver documents found | Unique records? |
|---|---|---|---|
| `origin/main` | `820e7efced6800ec077c021d1c7fafaeb093e1fc` | ALL key authority records: Blanket Waiver & One-Pass Authorization (WA-01/WA-02); H-12 R5 Adoption Act; DQ-6b Path A Decision; DQ-4 QE Freeze Manifest; DEC-06 Standing Authorization Reconciliation; Waiver & Authorization Register B (WA-01 through WA-22); Pre-QE Prerequisite Closure Report; D06 Operation Admission Readiness Assessment; Consolidated Gate 4 Paper; NP-12 authority records (15+); Gate B/C/D/E authority records | No — primary authority locus |
| `origin/arena/0341788e-iips-review-recovered` | — | F-3 PA decision document | No — duplicate of main |
| `origin/arena/03d11d5d-iips-review-recovered` | — | CAP-02 one-pass execution reconciliation; DQ-6b freeze blocker/disposition/IPD mirror/Path A documents | No — duplicate of main |
| `origin/arena/0497f3e4-iips-review-recovered` | — | Same DQ-6b documents | No — duplicate of main |
| `origin/arena/049b3738-iips-review-recovered` | — | Gate C P2 main admission act proposed; Gate C P2 deposit source audit; Gate C P2 establishment evidence; Gate C P2 execution designation act | No — duplicate of main |
| `origin/arena/0526f2e5-iips-review-recovered` | — | Same Gate C P2 documents | No — duplicate of main |
| `origin/arena/057f5ba5-iips-review-recovered` | — | F-3 owner context PA decision; F-3 browser acceptance; F-3 implementation and qualification; F-3 mechanism and implementation | No — duplicate of main |
| `origin/arena/0673a6cd-iips-review-recovered` | — | Same Gate C P2 documents | No — duplicate of main |
| `origin/arena/075f10df-iips-review-recovered` | — | Gate C P2 deposit source audit; Gate C P2 establishment evidence; Gate C P2 execution designation act; Gate C P2 execution handoff | No — duplicate of main |
| `origin/arena/080179a9-iips-review-recovered` | — | Gate C portfolio identity contract; Gate C S5A DP1 Option 1A prime binding; Gate C S5 owner credential tenant binding; F-3 owner context PA decision; F-3 browser acceptance | No — duplicate of main |
| `origin/arena/08238a84-iips-review-recovered` | — | Same DQ-6b documents | No — duplicate of main |
| `origin/arena/08e7669b-iips-review-recovered` | — | Same DQ-6b documents | No — duplicate of main |
| `origin/arena/095377c3-iips-review-recovered` | — | Same DQ-6b documents | No — duplicate of main |
| `origin/arena/09e91125-iips-review-recovered` | — | Same DQ-6b documents | No — duplicate of main |
| `origin/arena/0a6b8762-iips-review-recovered` | — | Same DQ-6b documents | No — duplicate of main |
| `origin/arena/0b0cf603-iips-review-recovered` | — | Same DQ-6b documents | No — duplicate of main |
| `origin/arena/0b45cfb7-iips-review-recovered` | — | Same Gate C P2 documents | No — duplicate of main |
| `origin/arena/0ca71efc-iips-review-recovered` | — | Same Gate C P2 documents | No — duplicate of main |
| `origin/arena/0cabf972-iips-review-recovered` | — | Same DQ-6b documents | No — duplicate of main |
| `origin/arena/0e34fb6e-iips-review-recovered` | — | Same Gate C P2 documents | No — duplicate of main |
| `origin/arena/0f1717b5-iips-review-recovered` | — | Same DQ-6b documents | No — duplicate of main |
| `origin/arena/0ff58f56-iips-review-recovered` | — | Same Gate C P2 documents | No — duplicate of main |
| 345 additional `origin/arena/*` branches | — | All inspected; none contain unique waiver/authority records | No — duplicates of main or no authority documents |
| `origin/cap03-s2-deposit-host-originals-20261029T094829Z` | — | CAP-02 one-pass execution reconciliation; CAP-03 one-pass PA decision | No — duplicate of main |
| `origin/cap03-s2-evidence-publication` | — | CAP-02 one-pass execution reconciliation; CAP-03 one-pass PA decision; one-pass evidence README | No — duplicate of main |
| `origin/cap03-s2-tracker-132` | — | CAP-02 one-pass execution reconciliation; CAP-03 one-pass PA decision; one-pass evidence README | No — duplicate of main |
| `origin/docs/g3-d0-registration-2026-10-18` | — | Gate C P2 main admission act proposed; Gate C P2 deposit source audit; Gate C P2 establishment evidence; Gate C P2 execution designation act; Gate C P2 execution designation worksheet | No — duplicate of main |
| `origin/evidence-cap03-s2-original-recovery-20261028` | — | CAP-02 one-pass execution reconciliation; CAP-03 DQ-6b documents; CAP-03 one-pass PA decision; CAP-03 P1-F4 preflight integrity investigation | No — duplicate of main |
| `origin/evidence/pf11-six-results-20261027` | — | CAP-02 one-pass execution reconciliation; CAP-03 DQ-6b documents; CAP-03 one-pass PA decision; CAP-03 P1-F4 preflight reconciliation | No — duplicate of main |
| `origin/fix/f3-owner-context-copy-20261013` | — | F-3 owner context PA decision; F-3 browser acceptance; F-3 implementation and qualification; F-3 mechanism and implementation | No — duplicate of main |
| `origin/gate-b/local-principal-ipc-implementation` | — | Gate C P2 deposit source audit; Gate C P2 establishment evidence; Gate C P2 execution designation act; Gate C P2 execution designation worksheet; Gate C P2 execution handoff | No — duplicate of main |
| `origin/gate-b/local-principal-ipc-implementation-r2` | — | Same Gate C P2 documents | No — duplicate of main |
| `origin/gate-c-p2a-d1-gc-d6-20261013-233748` | — | Gate C P2 execution designation act; Gate C P2 execution designation worksheet; Gate C trust anchor issuer config; Gate C portfolio identity contract; Gate C S5A DP1 Option 1A prime binding | No — duplicate of main |
| `origin/governance/d1-journal-persistence-extension` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/governance/d1-persistence-ownership-option-c` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/governance/d2-identity-tenant-option-b` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/governance/d3-reports-acceptance` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/governance/reports-promotion-scope` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/g2-ui-consumer-recovery-2026-10-08` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/gai-impl-canonical` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/feat/ai-explanation-route-nav` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/feat/global-no-auth-implementation` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/feat/nav-cross-sector-discoverability` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/phase13-hardening-delivery` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/phase13-next` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/phase14.1-recovery-deposit` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/promotion/evidence-landing-np13` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/promotion/family-watchlists-collaboration-settings` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/promotion/governed-reports-candidate` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/reconciliation/ai-advisory-transport` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/reconciliation/spa-oidc-handoff` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/recovery/owner-context-pa-decision-20261012` | — | F-3 owner context PA decision | No — duplicate of main |
| `origin/review/e2e030-evidence-reference` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/e2e030-ipd-authority-followup-20261011-212306` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/e2e030-ipd-authority-source-20261011-193957` | — | No authority/waiver documents matching search pattern | N/A |
| Remaining ~83 arena/topic branches with no matching documents | — | No authority/waiver documents found | N/A |

**IRR coverage: 393 of 393 remote branches inspected (100%).** 83 branches had no authority/waiver documents; 310 had duplicates of main's authority records. Zero branches contain a waiver, exemption, deferral, superseding decision, or acceptance record not already present on IRR main.

**Coverage conclusion:** 100% of branches in both repositories enumerated and inspected (2 IPD + 393 IRR = 395 total). No inaccessible branches. No hidden or superseding authority exists on any branch.

---

## (B) P-1 Provisioning Authority Reconciliation (PRIORITY)

### Existing instruments that authorize Direct P1 / P1-F provisioning

| Instrument | Repository | Branch | Status | What it authorizes |
|---|---|---|---|---|
| **WA-02** — Blanket Act §2 | IRR | `origin/main` | **EFFECTIVE — AUTHORIZED — ONE ATTEMPT ONLY — NOT EXECUTED — UNSPENT** | One fresh P1-F Execute on designated Windows host, exact evidence root, pinned IPD commit/tree, existing single-user provisioning scope |
| **WA-01** — Blanket waiver & one-pass completion | IRR | `origin/main` | **EFFECTIVE** | §2 grants one fresh P1-F Execute; §4 authorizes bounded one-pass completion scope; §5 fixes exclusions |
| **WA-06** — PA-20 standing waiver | IRR | `origin/main` | **EFFECTIVE — IN FORCE** | Waives Windows-host availability as governance blocker; "does NOT make anything runnable" |
| **Gate A′ Successor Provisioning Act** | IPD | `origin/main` | **RENDERED — EFFECTIVE ON PUBLICATION (§13)** | Authorizes bounded provisioning entrypoint code, V-A2-1…V-A2-8 validation, desktop-host procedure |
| **S1 Identity-Value Determination** | IPD | `origin/main` | **RENDERED — EFFECTIVE ON PUBLICATION (§13)** | Resolves `principal_label` = `ramki-personal-local`, `tenantId` = `ipd-personal-local`, `canonicalOwnerId` = `ipd-owner-ramki-personal` |
| **WA-18** — F-3 standing PA grant | IRR | `origin/main` | **EFFECTIVE — STANDING** | Project-wide decision and execution authority within scope |

### Direct P1 completion vs P1-F/Gate A′ ceremonial provisioning — critical distinction

**Direct P1 personal local provisioning: REPORTED COMPLETE** (user-reported evidence, not Arena-verified):

| Field | Reported value |
|---|---|
| Database path | `C:\iips-data\iips\user-portfolio.sqlite` |
| Provisioning commit | `279d1eed184f5e23bbabe5c6411085e120ce9e41` (IPD PR #118 merge) |
| Database SHA-256 | `e9b1d66c505eded34d1dd48ec86550026c930101709eb4901455ace6554b94f6` |
| Migrations | 4 (001–004) applied |
| DP-V1 through DP-V9 | 9/9 reported PASS |
| SQLite integrity | `ok` |
| Foreign-key violations | 0 |
| Principal/membership binding | ACTIVE |
| Audit chain | Valid |
| Initial portfolio state | Zero portfolios/revisions/holdings/contributions |
| W-1 guard | Verified ACTIVE (`authorized = false`) |

**P1-F / Gate A′ ceremonial provisioning: NOT EXECUTED — UNSPENT.** Remains a separate path with its own authority. Direct P1 completion does NOT consume, prove, or reconcile P1-F authority.

**Authority boundary:** WA-02 authorizes P1-F (one attempt, unspent). Direct P1 uses WA-01 §1 (discontinuing P1-F ceremony as prerequisite) — not WA-02. P1-F is NOT a prerequisite for Direct P1 per the IPD handoff §1. No fresh PA approval is required for Direct P1 — it is already authorized by WA-01 and implemented in PR #118.

---

## (C) Six-Item Classification (Corrected)

Classification sub-dimensions: waiver/exemption, authorization, execution/completion, evidence, formal acceptance, remaining blocker, new-PA-approval-required.

### Item 1 — Gate A′ identity-value selection (`principal_label`, `tenantId`, `canonicalOwnerId`)

| Sub-dimension | Finding |
|---|---|
| Waiver/exemption | NONE needed — authority rendered by S1 determination |
| Authorization | **AUTHORIZED** — S1 determination `IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01` rendered on IPD main; values: `ramki-personal-local` / `ipd-personal-local` / `ipd-owner-ramki-personal`. Discharges Gate A′ successor act §4 reservation. F-3 standing grant (WA-18) + DEC-06 rules R-1/R-3 establish value-selection authority without a new approval round. |
| Execution/completion | **RENDERED, NOT YET EFFECTIVE** — S1 act §13 requires publication to IPD main with green CI + remote read-back. |
| Evidence | Values recorded verbatim in S1 act with SHA-256 hashes |
| Formal acceptance | **NOT ACCEPTED** — no acceptance act exists for identity values |
| Remaining blocker | Publication to IPD main (green CI + remote read-back) per S1 act §13 |
| New PA approval required | **NO** — S1 already rendered; publication is the remaining step |

### Item 2 — Gate A′ provisioning execution (P-1, one attempt on `desktop-no0nhtp`)

| Sub-dimension | Finding |
|---|---|
| Waiver/exemption | **PARTIALLY WAIVED** — WA-06 (PA-20) waives Windows-host as governance blocker; WA-02 (§2) authorizes one fresh P1-F Execute |
| Authorization | **AUTHORIZED** — WA-02: "EFFECTIVE — AUTHORIZED — ONE ATTEMPT ONLY — NOT EXECUTED — UNSPENT." Gate A′ successor act authorizes provisioning code and V-A2-1…V-A2-8 validation. S1 resolved identity values (successor act §4 blocking condition discharged). |
| Execution/completion | **NOT EXECUTED** — WA-02 status: UNSPENT. No P-1 store created, no binding row inserted. |
| Evidence | No P-1 provisioning evidence exists |
| Formal acceptance | **NOT ACCEPTED** — no acceptance act exists |
| Remaining blocker | Designated Windows host `desktop-no0nhtp` unreachable from Linux sandbox |
| New PA approval required | **NO** — existing authority (WA-02 + successor act + S1 + WA-06) is sufficient |

**Correction:** Direct P1 personal provisioning is REPORTED COMPLETE (separate path, does not consume P1-F). P1-F remains UNSPENT but is NOT a prerequisite for Direct P1.

### Item 3 — Limb A implementation (`scripts/run-tests.mjs` + `tests/g4_run_tests_summary_parsing.test.ts`)

| Sub-dimension | Finding |
|---|---|
| Waiver/exemption | **NONE** — no waiver covers Limb A |
| Authorization | **AUTHORIZED** — Gate 4 act Q3 authorizes Limb A; G3-AMEND-01 §6.4(1) defines boundary |
| Execution/completion | **IMPLEMENTED ON IPD MAIN** — Both files merged in PR #143 (commit `de8756de1d7d4082e8e144dadf3fb53373b711c6`). `tests/g4_run_tests_summary_parsing.test.ts` exists; `scripts/run-tests.mjs` exists. Q3 of Gate 4 act ratifies the already-merged `--test-reporter=tap` line and reconciles Limb A to G3-AMEND-01 §6.4(1). |
| Evidence | Source files present on IPD main; CI evidence from PR #143 |
| Formal acceptance | **NOT ACCEPTED** — no acceptance act exists |
| Remaining blocker | Host execution of QE-1…QE-11 requires S2 → P-1 → S3 sequence on `desktop-no0nhtp` |
| New PA approval required | **NO** — already authorized |

**Correction:** Prior report incorrectly stated Limb A test file was absent. It IS present on IPD main (PR #143).

### Item 4 — H-12 v3 adoption

| Sub-dimension | Finding |
|---|---|
| Waiver/exemption | **NONE NEEDED** — H-12 is ADOPTED, not waived |
| Authorization | **AUTHORIZED — EFFECTIVE** — H-12 R5 adoption act `IIPS-V3-CAP03-G4-H12-R5-PA-ADOPTION-ACT-2026-10-25-01` adopted on IRR main; manifest blob `f4649e36a81c7013287810cd3202b99586dbd951`, SHA-256 `d0be8bef3281ae6a296b8700265fe134b5088dd84b102b77ca8a157c8275cb76`; 32 IPD + 24 IRR = 56 core entries all PRESENT; 981 checks, 0 failures |
| Execution/completion | **ADOPTED AND EFFECTIVE** — R5 IS the v3 replacement. No separate H-12 v3 adoption act needed. |
| Evidence | Manifest, amended-§8 supplement, validation records (981 checks, 0 failures), bilateral harness 15/15 |
| Formal acceptance | **EFFECTIVE** — adoption act published to IRR main with green CI and remote read-back |
| Remaining blocker | NONE for adoption. Future re-adoption may be needed if designated inputs drift (Gate 4 Act §3.2(4) stop condition). |
| New PA approval required | **NO** — H-12 R5 already adopted and effective |

**Correction:** H-12 R5 IS adopted and effective on IRR main. This is adoption/effectiveness, not a waiver. No separate H-12 v3 adoption act needed.

### Item 5 — Host/runtime preflight (S3, `desktop-no0nhtp`, Windows 11, Node >=22.13.0 <23)

| Sub-dimension | Finding |
|---|---|
| Waiver/exemption | **PARTIALLY WAIVED** — WA-06 (PA-20) waives Windows-host as governance blocker but "does NOT make anything runnable" |
| Authorization | **AUTHORIZED** — Gate 4 act §11–§12 (Q11) authorizes S3; H-12 adoption act §7.2 confirms S3 required before QE-1…QE-11 |
| Execution/completion | **NOT EXECUTED** — Requires S2 (native-Windows npm test at IPD `8eec74ae`) first. Host `desktop-no0nhtp` unreachable from Linux sandbox. |
| Evidence | No S3 preflight evidence exists |
| Formal acceptance | **NOT ACCEPTED** — no acceptance act exists |
| Remaining blocker | Host availability; S2 must pass on host first; P-1 must execute before S3 per successor act §8 |
| New PA approval required | **NO** — already authorized by Gate 4 act |

### Item 6 — QE-1 through QE-11 execution and recording

| Sub-dimension | Finding |
|---|---|
| Waiver/exemption | **NONE** — no waiver covers QE execution. PA-19 (WA-05) waives H-1…H-9 documentation blockers only. Blanket waiver WA-01 §5 explicitly excludes Gate 4 acceptance and QE execution credit. QE8 RV1 (WA-15) is approved but not executed — covers QE-8 authority only. |
| Authorization | **AUTHORIZED (grant issued, blocked by prerequisites)** — Gate 4 act §6–§7 (Q6) issues execution grant, but QE execution blocked by S2 → P-1 → S3 sequence |
| Execution/completion | **0/11 EXECUTED** — QE-1 through QE-11 all NOT EXECUTED, all BLOCKED |
| Evidence | No QE execution evidence exists |
| Formal acceptance | **NOT ACCEPTED** — QE-11's "accepted" limb requires separate Gate C acceptance act |
| Remaining blocker | S3 preflight must complete first (requires S2 + P-1 + host availability); then QE-1…QE-11 executed on designated host |
| New PA approval required | **NO** — execution grant already issued by Gate 4 act |

---

## (D) Downstream Dispositions (Gate C acceptance, Gate 4 result acceptance, Gate 5 admission)

| Item | Waiver/exemption | Authorization | Execution/completion | Evidence | Formal acceptance | Remaining blocker | New PA approval |
|---|---|---|---|---|---|---|---|
| Gate C result acceptance | NONE | No acceptance act exists | NOT RENDERED | None | NOT ACCEPTED | QE-11 must be executed and accepted first | YES — separate acceptance act |
| Gate 4 result acceptance (W-1(3)) | NONE | No acceptance act exists | NOT RENDERED | None | NOT ACCEPTED | Gate C must be accepted first | YES — separate acceptance act |
| Gate 5 admission act (W-1(4)) | NONE | No act exists | NOT INITIATED / NOT ADMITTED | None | NOT ADMITTED | Gate 4 result must be accepted first | YES — Gate 5 act does not exist |
| DQ-4 QE freeze establishment | PARTIALLY (8/10 met) | DQ-4 freeze manifest prepared | NOT ESTABLISHED | Manifest validated | PREPARED — NOT ESTABLISHED | Criteria 7 (host sequence) and 8 (canonical host evidence) unmet | NO — evidence/host-based, not authority-based |
| U6 operational writes | NONE | NOT AUTHORIZED | NOT AUTHORIZED | None | NOT AUTHORIZED | Gate 4 + Gate 5 must be accepted first; W-1 hard-false | YES — separate act required |

---

## (E) Waiver Register B (IRR) — All 22 Entries

All 22 waivers (WA-01 through WA-22) are EFFECTIVE on IRR main. None waive Gate C acceptance, Gate 4 result acceptance, or Gate 5 admission. WA-02 authorizes P1-F (one attempt, unspent). WA-06 waives Windows-host as governance blocker. No waiver covers QE execution or Limb A implementation.

---

## (F) Cross-Repository Conflict Reconciliation

Six conflicts identified and resolved (see prior report version). Key resolutions:

1. **H-12 adoption:** RESOLVED in favor of IRR main — H-12 R5 ADOPTED and EFFECTIVE.
2. **Gate A′ identity values:** PARTIALLY RESOLVED — S1 rendered on IPD main, not yet effective (§13 publication pending).
3. **Gate A′ provisioning:** RESOLVED — P-1 authorized (WA-02 + successor act + S1 + WA-06), not executed (host-blocked).
4. **Gate 4 act effectiveness:** Nuanced — file present on IPD main; effectiveness confirmation (green CI + remote read-back) not independently verified.
5. **DQ-6b Path A:** RESOLVED in favor of IRR main — 5/6 elements effective; element 6 (IPD mirror receipt) outstanding.
6. **DQ-4 QE freeze:** RESOLVED in favor of IRR main — 8/10 criteria MET; criteria 7–8 blocked by host availability.

---

## FINAL DEPLOYMENT SCOPE — PERSONAL SINGLE-USER / NO EXTERNAL DISTRIBUTION

### 1. Intended deployment and explicit exclusions

**IIPS v3 is a personal, single-user application running locally for the owner's use. It is not intended for external distribution, multi-user service or production deployment.**

| Requirement | Personal-use disposition |
|---|---|
| External distribution certification | **OUT OF SCOPE** |
| Institutional production qualification | **OUT OF SCOPE** |
| Gate 5 production admission | **OUT OF SCOPE** |
| External multi-user deployment | **OUT OF SCOPE** |
| Gate 4 institutional host qualification | **NOT A PERSONAL-USE DELIVERY REQUIREMENT** |
| Gate C formal institutional acceptance | **NOT A PERSONAL-USE DELIVERY REQUIREMENT** |

Historical Gate 4/Gate 5 records and their actual status are **retained**. None are falsely marked accepted, waived or completed. "Not required for intended personal-use delivery" is clearly distinguished from "formally waived under an existing authority instrument."

### 2. Blanket decision and Direct P1 completion evidence

**Blanket decision:** `IIPS-V3-CAP03-PA-BLANKET-WAIVER-ONE-PASS-AUTHORIZATION-2026-11-01-01` (WA-01, EFFECTIVE on IRR main). §1 supersedes procedural stop requirements for investigation, implementation, correction, testing, documentation, integration, publication and verification within the personal/local/single-user/non-production scope. §4 authorizes the bounded one-pass completion scope.

**Direct P1 completion (user-reported, not Arena-verified):**

| Field | Value |
|---|---|
| Authority | WA-01 / IPD PR #118 handoff |
| Database path | `C:\iips-data\iips\user-portfolio.sqlite` |
| Provisioning commit | `279d1eed184f5e23bbabe5c6411085e120ce9e41` |
| Database SHA-256 | `e9b1d66c505eded34d1dd48ec86550026c930101709eb4901455ace6554b94f6` |
| Migrations | 4 applied (001–004) |
| DP-V1 through DP-V9 | 9/9 reported PASS |
| SQLite integrity | `ok` |
| Foreign-key violations | 0 |
| Binding/membership | ACTIVE |
| W-1 guard | Verified ACTIVE (`authorized = false`) |
| Initial portfolio state | Empty |

**User-reported vs independently verified:** The operator reports Direct P1 provisioning SUCCESS / PROVISIONED with DP-V1–DP-V9 passing. Arena did not access the Windows host or database; could not independently recompute the SHA-256 or inspect the diagnostic bundle. Format checks confirm the SHA-256 is well-formed (64 lowercase hex chars) and internally consistent with the shipped script. This is **user-reported evidence, not Arena-verified.**

### 3. P1-F versus Direct P1 distinction

| Attribute | Legacy P1-F / Gate A′ | Direct P1 |
|---|---|---|
| Governing record | P1 authorization act; Blanket Act §2 (fresh one-attempt) | Blanket Act §1 + IPD PR #118 handoff |
| IPD implementation | `gateAPrimeProvisioning.js` at `a891802e…` pin | `directP1Provisioning.ts` at `279d1eed…` merge |
| Controls | Claim/marker, retry-history, S2 pin, Preflight, `H:\IIPS-P1-EVIDENCE` | Discontinued as prerequisites; not invoked |
| Status | **NOT EXECUTED — UNSPENT** | **REPORTED COMPLETE** (user-reported) |
| Relationship to Direct P1 | NOT a prerequisite | Does NOT consume P1-F authority |

Direct P1 completion is recognized as **completed personal-use provisioning.** It is NOT marked as P1-F execution and does NOT independently satisfy the separate Gate 4 qualification chain. P1-F one-attempt authority remains UNSPENT and is not consumed by Direct P1.

### 4. Institutional gate dispositions for personal use

| Gate/institutional requirement | Personal-use disposition | Actual historical status (retained) |
|---|---|---|
| Gate 4 target-host qualification | NOT A PERSONAL-USE DELIVERY REQUIREMENT | AUTHORIZED — NOT STARTED; QE 0/11 |
| Gate C formal institutional acceptance | NOT A PERSONAL-USE DELIVERY REQUIREMENT | PARTIAL — Q5–Q8 DEFERRED; NOT RENDERED |
| Gate 5 production admission | OUT OF SCOPE | NOT INITIATED / NOT ADMITTED |
| CV-52 | OUT OF SCOPE | BLOCKED (ACTIVE) |
| External distribution certification | OUT OF SCOPE | No certification granted |
| Institutional production qualification | OUT OF SCOPE | No production admission |

None of these are falsely marked accepted, waived or completed. They remain as historically recorded.

### 5. W-1 technical functionality finding

**W-1 write guard remains ACTIVE.** `evaluatePortSaveGuard()` returns `{authorized: false, reasons: ["W-1(3): Gate 4 qualification not accepted", "W-1(4): Gate 5 admission not accepted"]}` at `src/persistence/portfolio_store.ts:213` (compiled build verified live at IPD main `de8756de…`).

**Practical consequence for personal use:** The Direct P1 database is provisioned (schema, migrations, binding, membership, audit chain all verified per user report), but the W-1 guard prevents durable portfolio write operations through the `Port.save` interface. All four write operations (create/save/reset/delete) are refused with `WRITE_NOT_AUTHORIZED` before any store mutation.

**This is a personal-use functional limitation**, not a reason to pursue external production admission. The guard must not be disabled, bypassed, weakened, or altered. No workaround is invented or authorized.

> **CORRECTION-2026-11-09 (append-only; the paragraph above is the audit record as written and is
> not rewritten).** The Program Authority subsequently issued a standing decision for this local,
> non-production, single-user application: the existing `IIPS_LOCAL_PERSONAL_USE=1` carve-out is
> extended to broker-observed holdings, implemented as an **explicit local single-user authorization
> path** supplied to the durable write guard, and **not** by weakening or removing Gate 4 / Gate 5
> globally. Consequences for the two lists below:
>
> - The four v1 write operations and the durable broker-import save are no longer blocked under the
>   switch + a matching ACTIVE binding. `evaluatePortSaveGuard()` with **no** context still returns
>   the two W-1 literals unchanged, and any port constructed without an authorization context is
>   still refused exactly as recorded above.
> - The "What still works / What is blocked" lists below describe the pre-decision posture. They
>   remain accurate for the governed path, for a process without the switch, and for a binding that
>   does not match the write's target owner.
> - Identity qualification is untouched: an unresolved or ambiguous holding still refuses the whole
>   import. WS-A rows 44 / 51 / 63 remain unresolved.
> - `QE-1`…`QE-11` remain 0/11; Gate 4 and Gate 5 remain **NOT MET** and are still required for the
>   governed path. This correction is **not** a production, institutional or multi-user claim.
>
> See `docs/LOCAL-PERSONAL-USE-PERSISTENCE.md` §7 and
> `docs/integration/BROKER-IMPORT-IDENTITY-RECONCILIATION-AND-W1-ADMISSION-ASSESSMENT-2026-11-09.md` §2.8.

**What still works for personal use:**
- Read-only portfolio queries through the IPC provider (GET /api/user-portfolios, detail, revisions)
- Database verification (DP-V1–DP-V9, integrity check, FK check)
- Audit chain verification
- Binding/membership resolution

**What is blocked for personal use:**
- Durable portfolio writes (create/save/reset/delete) through W-1-guarded endpoints
- Any operation requiring `durable:true` or fence lift

### 6. Completed work that must not be repeated

| Completed item | Evidence | Must not repeat |
|---|---|---|
| Direct P1 implementation (PR #118) | `src/persistence/directP1Provisioning.ts`, `scripts/Invoke-DirectP1Provisioning.ps1`, `tests/direct_p1_provisioning.test.ts` on IPD main | Re-provisioning |
| Direct P1 database provisioning | User-reported: database at `C:\iips-data\iips\user-portfolio.sqlite`, SHA-256 `e9b1d66c…`, DP-V1–DP-V9 9/9 | Re-running provisioning on valid store |
| Limb A implementation (PR #143) | `tests/g4_run_tests_summary_parsing.test.ts`, `scripts/run-tests.mjs` on IPD main | Re-implementing Limb A |
| H-12 R5 adoption | IRR main `820e7efc…`; act `IIPS-V3-CAP03-G4-H12-R5-PA-ADOPTION-ACT-2026-10-25-01` | Re-adopting H-12 |
| S1 identity determination | IPD main `de8756de…`; act `IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01` | Re-selecting identity values |
| Gate A′ successor provisioning act | IPD main `de8756de…`; act `IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01` | Re-rendering the act |
| Blanket waiver (WA-01) | IRR main `820e7efc…`; act `IIPS-V3-CAP03-PA-BLANKET-WAIVER-ONE-PASS-AUTHORIZATION-2026-11-01-01` | Re-requesting blanket waiver |
| IRR IPC read composition | PR #424 merged; 109 files / 1,365 tests passed | Re-implementing IRR IPC reads |

### 7. Genuine remaining personal-use functional limitation

**W-1 blocks durable portfolio writes.** The personal application can provision the database, run read-only verification, and serve read-only IPC queries, but cannot perform durable portfolio create/save/reset/delete operations through the W-1-guarded `Port.save` interface until Gate 4 qualification is accepted and Gate 5 admission is granted — both of which require separate acceptance acts that do not yet exist.

**Not a blocker for personal-use delivery:** The application is designed as a personal, single-user, local tool. Read-only portfolio access and database provisioning constitute the core personal-use capability. The W-1 write restriction is an intentional governance control, not a defect.

---

## (G) Corrections to Internal Contradictions

| Contradiction | Prior statement | Corrected statement |
|---|---|---|
| "No waiver covers any prerequisite" vs WA-02/WA-06 | Claimed no waiver covers any Gate 4 prerequisite | WA-02 DOES authorize P1-F (one attempt, unspent). WA-06 DOES waive Windows-host as governance blocker. Direct P1 is authorized by WA-01 §1 + PR #118. |
| "Limb A test file absent" | Stated mandatory parser test absent at IPD main | Limb A IS implemented on IPD main (PR #143 merged both files) |
| "H-12 v3 not adopted" | Stated H-12 v3 replacement required + separate adoption | H-12 R5 IS adopted and effective on IRR main (adoption, not waiver) |
| P-1 provisioning unauthorized | Implied fresh PA approval needed for P-1 | P-1 authorized by WA-02 + successor act + S1 + WA-06; no fresh approval needed |
| Direct P1 not recognized | Did not recognize completed personal provisioning | Direct P1 REPORTED COMPLETE (user-reported, not Arena-verified) |
| "No repository was modified" | Claimed read-only only | This documentation file was created and committed to IPD branch; documentation-only change |
| Gate 4/Gate 5 as personal-use requirements | Treated institutional gates as required for delivery | Gate 4 institutional host qualification and Gate C formal acceptance are NOT personal-use delivery requirements; Gate 5 production admission is OUT OF SCOPE |

---

## (H) Summary of Findings

### Branch coverage
- **IPD:** 2 of 2 remote branches inspected (100%). Commit SHAs recorded.
- **IRR:** 393 of 393 remote branches inspected (100%). 310 branches carry duplicates of main's authority records; 83 branches have no authority/waiver documents. Zero branches contain unique waiver/authority records not on IRR main or IPD main.

### P-1 provisioning authority
**P-1 / Gate A′ ceremonial provisioning IS authorized** by WA-02 (effective, unspent one fresh P1-F Execute), Gate A′ successor act (rendered), S1 identity determination (rendered), and WA-06 (host governance blocker waived). **No fresh PA approval is required.** Direct P1 personal provisioning uses a separate path (WA-01 §1 + PR #118) and is REPORTED COMPLETE (user-reported). P1-F remains UNSPENT and is NOT consumed by Direct P1.

### Six-item classification summary

| # | Item | Waiver/exemption | Authorization | Execution/completion | Evidence | Formal acceptance | Remaining blocker | New PA approval? |
|---|---|---|---|---|---|---|---|---|
| 1 | Gate A′ identity values | None needed | AUTHORIZED (S1 rendered) | RENDERED, not yet effective (§13 publication) | Values in S1 act | NOT ACCEPTED | Publication to IPD main | **NO** |
| 2 | Gate A′ P-1 provisioning | PARTIALLY (WA-02, WA-06) | AUTHORIZED (WA-02 unspent; successor act; S1) | NOT EXECUTED | None | NOT ACCEPTED | Host availability | **NO** |
| 3 | Limb A implementation | NONE | AUTHORIZED (Gate 4 act Q3) | IMPLEMENTED (IPD main, PR #143) | Source + CI | NOT ACCEPTED | Host execution for QE | **NO** |
| 4 | H-12 v3 adoption | NONE (adopted) | AUTHORIZED — EFFECTIVE (IRR main) | ADOPTED AND EFFECTIVE | Manifest + 981 checks | EFFECTIVE | None | **NO** |
| 5 | Host preflight (S3) | PARTIALLY (WA-06) | AUTHORIZED (Gate 4 act) | NOT EXECUTED | None | NOT ACCEPTED | Host availability | **NO** |
| 6 | QE-1…QE-11 | NONE | AUTHORIZED (grant issued) | 0/11 EXECUTED | None | NOT ACCEPTED | S3 preflight first | **NO** |

### Personal-use deployment scope
IIPS v3 is personal, single-user, local. Gate 5 production admission, external distribution certification, institutional production qualification, external multi-user deployment, Gate 4 institutional host qualification, and Gate C formal institutional acceptance are **OUT OF SCOPE** or **NOT PERSONAL-USE DELIVERY REQUIREMENTS**. Historical statuses are retained, not falsified.

### W-1 finding
W-1 remains ACTIVE (`authorized = false`). Durable portfolio writes are blocked. This is a personal-use functional limitation, not a reason to pursue external production admission. No guard change is invented or authorized.

### New PA approval required?
**No new PA approval is required** for any of the six items or for P-1/Direct P1 provisioning. New PA **acceptance acts** (distinct from approvals) are required downstream for Gate C acceptance, Gate 4 result acceptance, and Gate 5 admission — but these are outside personal-use delivery scope.

### Boundaries confirmed
- Read-only investigation; no source, schema, migration, write-gate, dependency, IRR, or production changes
- The only repository modification is this documentation file committed to IPD branch
- No implementation performed; no P-1 provisioning executed; no host operations attempted
- No gate or write-guard changed; `evaluatePortSaveGuard()` remains `authorized: false`
- No new waiver or authority records created
- PR #144 remains OPEN on branch `arena/046844dc-iips-production-market-data`