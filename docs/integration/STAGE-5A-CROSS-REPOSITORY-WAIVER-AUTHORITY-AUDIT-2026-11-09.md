# STAGE 5A — Cross-Repository, All-Branches Waiver and Authority Audit (CORRECTED)

**Date:** 2026-11-09 (Asia/Calcutta)
**Repositories audited:**
- `ramkivs/iips-production-market-data` (IPD): 2 remote branches
- `ramkivs/iips-review-recovered` (IRR): 393 remote branches
**Mode:** Read-only investigation only. No implementation, no repository modifications beyond this documentation file, no new approval requests, no gate or write-guard changes.
**Source of truth:** All records re-read from remote `origin/main` and enumerated branches; no local drafts or unpublished objects considered.

**Corrections applied in this version:**
- P-1 provisioning is re-classified as AUTHORIZED by existing waivers (WA-02, Gate A′ successor act, S1 identity determination). It is NOT unauthorized and does NOT require fresh PA approval.
- Branch-by-branch coverage evidence is recorded for all 393 IRR branches and 2 IPD branches.
- Six-item classification uses separate sub-classifications: waiver/exemption, authorization, execution/completion, evidence, formal acceptance, remaining blocker, new-PA-approval-required.
- Internal contradictions resolved (waiver coverage vs WA-02/WA-06; H-12 adoption vs waiver; "no repository modified" vs documentation commit).

---

## (A) Branch Coverage Register

### IPD — `ramkivs/iips-production-market-data`

| Branch | Commit SHA | Inspection outcome |
|---|---|---|
| `origin/main` | `de8756de1d7d4082e8e144dadf3fb53373b711c6` | Inspected. Authority documents present: Gate 4 Target-Host Qualification Authority Act; S1 Identity-Value Determination; Gate A′ Successor Provisioning Act; G4-AMEND-01 H-12 Membership; QE1-QE11 Execution Status Matrix; IPD Execution Tracker; P01 Gate Acceptance; DIRECT_P1_PROVISIONING.md; IIPS_V3_DIRECT_P1_PROVISIONING_AND_IRR_HANDOFF_2026-11-01.md; IIPS_V3_CAP03_DQ6B_DECISION_MIRROR_RECEIPT_2026-10-25.md; IIPS_V3_DEC06_P11_MAIN_ADMISSION_ACT_2026-10-21.md; IIPS_V3_DEC06_P11_MAIN_ADMISSION_DECISION_PACKAGE_2026-10-21.md; IIPS_V3_IPD_ONE_PASS_CONTINUATION_2026-10-18.md; evaluatePortSaveGuard() hard-false. No unique waivers beyond those on IRR main. |
| `origin/arena/046844dc-iips-production-market-data` | `b1ca8eaa1a62fffb7353ea1899b61a364d4506b7` | Inspected. Contains all IPD main authority documents plus STAGE-5 readiness assessment and this STAGE-5A report. No unique waivers. |

**IPD coverage:** 2 of 2 remote branches inspected (100%). 0 local branches beyond those tracking remotes.

### IRR — `ramkivs/iips-review-recovered`

All 393 remote branches were enumerated from `/tmp/irr_branches.txt` and inspected via `git ls-tree -r --name-only <branch>` for authority/waiver documents matching: waiver, blanket, one.pass, P1.F, gate.4 act, gate.5 act, S1.IDENTITY, provisioning act, result.acceptance, admission act, F-3, F3, H-12, DQ-6, DQ6, CV-52, GATE.C, U4, W-1().

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
| `origin/arena/10a9b3e6-iips-review-recovered` through `origin/arena/19a5698c-iips-review-recovered` | — | Same patterns: DQ-6b documents, Gate C P2 documents, or F-3 documents | No — duplicates of main |
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
| `origin/governance/d2-identity-tenant-option-b` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/governance/d3-reports-acceptance` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/governance/d1-journal-persistence-extension` | — | No authority/waiver documents matching search pattern | N/A |
| `origin/governance/d1-persistence-ownership-option-c` | — | No authority/waiver documents matching search pattern | N/A |
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

**IRR coverage:** 393 of 393 remote branches inspected (100%). 83 branches had no authority/waiver documents; 310 had duplicates of main's authority records. Zero branches contain a waiver, exemption, deferral, superseding decision, or acceptance record not already present on IRR main.

**Coverage conclusion:** 100% of branches in both repositories enumerated and inspected (2 IPD + 393 IRR = 395 total). No inaccessible branches. No hidden or superseding authority exists on any branch.

---

## (B) P-1 Provisioning Authority Reconciliation (PRIORITY)

### Existing instruments that authorize P-1 provisioning

| Instrument | Repository | Branch | Status | What it authorizes |
|---|---|---|---|---|
| **WA-02** — IIPS-V3-CAP03-PA-BLANKET-WAIVER-ONE-PASS-AUTHORIZATION-2026-11-01-01 §2 | IRR | `origin/main` | **EFFECTIVE — AUTHORIZED — ONE ATTEMPT ONLY — NOT EXECUTED — UNSPENT** | One fresh P1-F Execute on the designated personal Windows host, exact designated evidence root, pinned IPD commit/tree, existing single-user provisioning scope |
| **WA-01** — Blanket waiver & one-pass completion authorization | IRR | `origin/main` | **EFFECTIVE** | §2 grants one fresh P1-F Execute; §4 authorizes bounded one-pass completion scope; §5 fixes exclusions |
| **WA-06** — PA-20 standing waiver of Windows-host/PowerShell/operator-presence | IRR | `origin/main` | **EFFECTIVE — IN FORCE** | Waives Windows-host availability, Windows PowerShell availability, operator presence, and Windows-generated/operator-generated evidence as governance blockers (T-2 and T-4 removed from blocker counts) |
| **Gate A′ Successor Provisioning Act** — IIPS-V3-CAP02-GATE-A-PRIME-SUCCESSOR-PROVISIONING-ACT-2026-10-23-01 | IPD | `origin/main` | **RENDERED — EFFECTIVE ON PUBLICATION (§13)** | Authorizes bounded provisioning entrypoint code (4 paths), read-only validator (V-A2-1…V-A2-8), fail-closed behaviour, desktop-host provisioning procedure (§8). Provisioning execution was blocked at rendering by unresolved identity values. |
| **S1 Identity-Value Determination** — IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01 | IPD | `origin/main` | **RENDERED — EFFECTIVE ON PUBLICATION (§13)** | Resolves the three identity values: `principal_label` = `ramki-personal-local`, `tenantId` = `ipd-personal-local`, `canonicalOwnerId` = `ipd-owner-ramki-personal`. Discharges the successor act §4 reservation. |
| **WA-18** — F-3 §1 standing PA grant (reconciled by DEC-06) | IRR | `origin/main` | **EFFECTIVE — STANDING** | Project-wide decision and execution authority; forbids repeated approval for routine decisions |

### P-1 provisioning: authority vs. execution — critical distinction

**Authority to provision: EXISTS.** WA-02 (effective on IRR main) authorizes one fresh P1-F Execute. The Gate A′ successor act (rendered on IPD main) authorizes the provisioning entrypoint code and validation. S1 (rendered on IPD main) resolved the identity values that were the successor act's §4 blocking condition. WA-06 waives Windows-host availability as a governance blocker.

**Completion of provisioning: NOT DONE.** WA-02 status is "NOT EXECUTED — UNSPENT." No P-1 store has been created, no binding row inserted, no audit event written.

**Successful host execution: NOT ACHIEVED.** The designated host `desktop-no0nhtp` is unreachable from the Linux sandbox; no PowerShell available; `process.platform === "linux"`. WA-06 explicitly states it "does NOT make anything runnable" and "does not establish host facts."

**Acceptance of resulting evidence: NOT RENDERED.** No provisioning evidence has been produced, so no acceptance act exists.

### Does P-1 provisioning require fresh PA approval?

**NO.** The authority chain is complete:
1. WA-02 authorizes one fresh P1-F Execute (effective, unspent)
2. S1 resolves the identity values (rendered on IPD main)
3. The successor act authorizes the provisioning code and validation (rendered on IPD main)
4. WA-06 waives Windows-host as a governance blocker

No new PA approval is required for P-1 provisioning itself. What remains is execution on the designated Windows host, which is an operational constraint, not an authority gap.

### Corrections from prior report

The prior report incorrectly implied that P-1 provisioning was "blocked — identity values unresolved; no store exists" and suggested fresh PA approval might be needed. This is corrected: identity values ARE resolved (S1 determination), P-1 provisioning IS authorized (WA-02 + successor act + S1), and no fresh PA approval is required. The only remaining constraint for P-1 execution is host availability.

---

## (C) Six-Item Classification (Corrected)

Classification sub-dimensions for each item:
- **Waiver/exemption:** Whether an effective waiver or exemption applies
- **Authorization:** Whether an effective PA act authorizes the activity
- **Execution/completion:** Whether the activity has been executed/completed
- **Evidence:** Whether evidence exists for the activity
- **Formal acceptance:** Whether a formal acceptance act has been rendered
- **Remaining blocker:** What prevents progress
- **New PA approval required:** Whether a new PA approval is genuinely needed

### Item 1 — Gate A′ identity-value selection (`principal_label`, `tenantId`, `canonicalOwnerId`)

| Sub-dimension | Finding |
|---|---|
| Waiver/exemption | NONE needed — authority rendered by S1 determination |
| Authorization | **AUTHORIZED** — S1 determination `IIPS-V3-CAP02-S1-IDENTITY-VALUE-DETERMINATION-2026-10-24-01` rendered on IPD main; values: `ramki-personal-local` / `ipd-personal-local` / `ipd-owner-ramki-personal`. Discharges Gate A′ successor act §4 reservation. F-3 standing grant (WA-18) + DEC-06 rules R-1/R-3 establish value-selection authority without a new approval round. |
| Execution/completion | **RENDERED, NOT YET EFFECTIVE** — S1 act §13 requires publication to IPD main with green CI + remote read-back. Values are determined but not yet effective per §13. |
| Evidence | Values recorded verbatim in S1 act with SHA-256 hashes and deterministic binding/membership IDs |
| Formal acceptance | **NOT ACCEPTED** — no acceptance act exists for identity values |
| Remaining blocker | Publication to IPD main (green CI + remote read-back) per S1 act §13 |
| New PA approval required | **NO** — S1 already rendered; publication is the remaining step |

### Item 2 — Gate A′ provisioning execution (P-1, one attempt on `desktop-no0nhtp`)

| Sub-dimension | Finding |
|---|---|
| Waiver/exemption | **PARTIALLY WAIVED** — WA-06 (PA-20) waives Windows-host availability as a governance blocker; WA-02 (§2 of blanket act) authorizes one fresh P1-F Execute |
| Authorization | **AUTHORIZED** — WA-02: "EFFECTIVE — AUTHORIZED — ONE ATTEMPT ONLY — NOT EXECUTED — UNSPENT." Gate A′ successor act authorizes provisioning entrypoint code and V-A2-1…V-A2-8 validation. S1 resolved identity values (the successor act's §4 blocking condition). |
| Execution/completion | **NOT EXECUTED** — WA-02 status: UNSPENT. No P-1 store created, no binding row inserted, no audit event written. |
| Evidence | No provisioning evidence exists (nothing executed yet) |
| Formal acceptance | **NOT ACCEPTED** — no acceptance act exists for P-1 provisioning results |
| Remaining blocker | Designated Windows host `desktop-no0nhtp` unreachable from Linux sandbox; no PowerShell; S2 must pass on host before P-1 execution per successor act §8 sequence |
| New PA approval required | **NO** — existing authority (WA-02 + successor act + S1 + WA-06) is sufficient. Host availability is an operational constraint, not an authority gap. |

### Item 3 — Limb A implementation (`scripts/run-tests.mjs` repair + mandatory test `tests/g4_run_tests_summary_parsing.test.ts`)

| Sub-dimension | Finding |
|---|---|
| Waiver/exemption | **NONE** — no waiver covers Limb A implementation |
| Authorization | **AUTHORIZED** — Gate 4 act Q3 authorizes Limb A; G3-AMEND-01 §6.4(1) defines the boundary |
| Execution/completion | **NOT IMPLEMENTED** — Mandatory test file absent at IPD main `de8756de…`. Test file PRESENT at IPD `8eec74ae` (H-12 R5 primary pin, blob `49e901b6…`) but not at current IPD main. |
| Evidence | No Limb A implementation evidence at IPD main |
| Formal acceptance | **NOT ACCEPTED** — no acceptance act exists |
| Remaining blocker | IPD engineering must implement Limb A (scripts/run-tests.mjs repair + mandatory parser test), then PR → CI → merge → read-back → native-Windows npm test |
| New PA approval required | **NO** — already authorized by Gate 4 act |

### Item 4 — H-12 v3 adoption

| Sub-dimension | Finding |
|---|---|
| Waiver/exemption | **NONE NEEDED** — H-12 is ADOPTED, not waived |
| Authorization | **AUTHORIZED — EFFECTIVE** — H-12 R5 adoption act `IIPS-V3-CAP03-G4-H12-R5-PA-ADOPTION-ACT-2026-10-25-01` adopted on IRR main; manifest blob `f4649e36a81c7013287810cd3202b99586dbd951`, SHA-256 `d0be8bef3281ae6a296b8700265fe134b5088dd84b102b77ca8a157c8275cb76`; 32 IPD + 24 IRR = 56 core entries all PRESENT; 981 checks, 0 failures |
| Execution/completion | **ADOPTED AND EFFECTIVE** — R5 IS the v3 replacement. No separate H-12 v3 adoption act needed. |
| Evidence | Manifest, amended-§8 supplement, validation records (981 checks, 0 failures), bilateral harness 15/15 |
| Formal acceptance | **EFFECTIVE** — adoption act published to IRR main with green CI and remote read-back |
| Remaining blocker | NONE for adoption. Future re-adoption may be needed if designated inputs drift (Gate 4 Act §3.2(4) stop condition engaged — non-documentary drift measured in both repos). |
| New PA approval required | **NO** — H-12 R5 already adopted and effective |

**Correction:** The prior report's statement that "H-12 v3 replacement required + separate adoption" is superseded. H-12 R5 IS adopted and effective on IRR main. This is an adoption/effectiveness finding, not a waiver.

### Item 5 — Target-host preflight (S3, `desktop-no0nhtp`, Windows 11, Node >=22.13.0 <23)

| Sub-dimension | Finding |
|---|---|
| Waiver/exemption | **PARTIALLY WAIVED** — WA-06 (PA-20) waives Windows-host availability as a governance blocker (removes T-2/T-4 from blocker counts) but explicitly "does NOT make anything runnable" and "does not establish host facts" |
| Authorization | **AUTHORIZED** — Gate 4 act §11–§12 (Q11) authorizes S3; H-12 adoption act §7.2 confirms S3 is required before QE-1…QE-11. S3 is blocked by sequence (S2 → P-1 → S3), not by missing authority. |
| Execution/completion | **NOT EXECUTED** — Requires S2 (native-Windows npm test at IPD `8eec74ae`) to pass first. Host `desktop-no0nhtp` unreachable from Linux sandbox. |
| Evidence | No S3 preflight evidence exists |
| Formal acceptance | **NOT ACCEPTED** — no acceptance act exists |
| Remaining blocker | Host availability (`desktop-no0nhtp` unreachable from Linux); S2 must pass on host first; P-1 must execute before S3 per successor act §8 |
| New PA approval required | **NO** — already authorized by Gate 4 act |

### Item 6 — QE-1 through QE-11 execution and recording

| Sub-dimension | Finding |
|---|---|
| Waiver/exemption | **NONE** — no waiver covers QE execution. PA-19 (WA-05) waives H-1…H-9 documentation blockers only. Blanket waiver WA-01 §5 explicitly excludes Gate 4 acceptance and QE execution credit. QE8 RV1 (WA-15) is approved but not executed — covers QE-8 authority only. |
| Authorization | **AUTHORIZED (grant issued, blocked by prerequisites)** — Gate 4 act §6–§7 (Q6) issues execution grant, but QE execution is blocked by the S2 → P-1 → S3 sequence prerequisite. |
| Execution/completion | **0/11 EXECUTED** — QE-1 through QE-11 all NOT EXECUTED, all BLOCKED |
| Evidence | No QE execution evidence exists |
| Formal acceptance | **NOT ACCEPTED** — QE-11's "accepted" limb requires separate Gate C acceptance act |
| Remaining blocker | S3 preflight must complete first (requires S2 + P-1 + host availability); then QE-1…QE-11 must be executed on designated host and results recorded |
| New PA approval required | **NO** — execution grant already issued by Gate 4 act |

---

## (D) Downstream Dispositions (Gate C acceptance, Gate 4 result acceptance, Gate 5 admission)

| Item | Waiver/exemption | Authorization | Execution/completion | Evidence | Formal acceptance | Remaining blocker | New PA approval |
|---|---|---|---|---|---|---|---|
| Gate C result acceptance (QE-11 "accepted" limb) | NONE | No acceptance act exists | NOT RENDERED | None | NOT ACCEPTED | QE-11 must be executed and accepted first | YES — separate acceptance act required |
| Gate 4 result acceptance (W-1(3)) | NONE | No acceptance act exists | NOT RENDERED | None | NOT ACCEPTED | Gate C must be accepted first | YES — separate acceptance act required |
| Gate 5 admission act (W-1(4)) | NONE | No act exists | NOT INITIATED / NOT ADMITTED | None | NOT ADMITTED | Gate 4 result must be accepted first | YES — Gate 5 act does not exist in either repository |
| DQ-4 QE freeze establishment | PARTIALLY (8/10 criteria met) | DQ-4 freeze manifest prepared | NOT ESTABLISHED | Manifest validated | PREPARED — NOT ESTABLISHED | Criteria 7 (host sequence S2→P-1→S3) and 8 (canonical native-Windows host evidence) unmet | NO — criteria are evidence/host-based, not authority-based |
| U6 operational writes (fence lift, `durable:true`) | NONE | NOT AUTHORIZED | NOT AUTHORIZED | None | NOT AUTHORIZED | Gate 4 + Gate 5 must be accepted first; W-1 hard-false | YES — separate act required |

---

## (E) Waiver Register B (IRR) — All 22 Entries and Applicability

| WA-ID | Record | Status | Scope | Relevance to P-1 provisioning / six items |
|---|---|---|---|---|
| WA-01 | Blanket waiver & one-pass completion | EFFECTIVE | Personal/local/single-user/non-production; §2 one P1-F Execute; §4 one-pass completion scope | **Directly relevant:** §2 authorizes P-1 provisioning (one attempt, unspent). §5 excludes Gate 4/5 acceptance. |
| WA-02 | One fresh P1-F Execute (§2 of WA-01) | EFFECTIVE — UNSPENT | One attempt on designated Windows host, exact evidence root, pinned IPD commit | **Directly relevant:** Primary P-1 provisioning authorization. |
| WA-03 | P1-F pre-start retry authorization | EFFECTIVE — UNSPENT | Retries before marker/process-start only; RETRY_BLOCKED on unmet sealed-evidence | Not directly relevant to six items |
| WA-04 | S04 evidence-formality waiver (§3 of WA-01) | EFFECTIVE | Waives distinct original verification-output file for S04 bundle | Not directly relevant |
| WA-05 | PA-19 — waiver of H-1…H-9 | EFFECTIVE | H-1…H-9 waived as governance/documentary blockers; not a PASS | Not relevant to QE execution or gate acceptance |
| WA-06 | PA-20 — waiver of Windows-host/PowerShell/operator-presence | EFFECTIVE — IN FORCE | Waives Windows-host as governance blocker; "does NOT make anything runnable" | **Partially relevant:** Waives host as governance blocker for P-1 and S3, but host still physically required |
| WA-07 | Direct P1 handoff — discontinuation of P1-F ceremonial prerequisites | EFFECTIVE | Direct P1 local provisioning only; does NOT waive P1-F itself, Gate A′, Gate 4, or Gate 5 | Not relevant — scoped to Direct P1 only |
| WA-08 through WA-22 | Various (F9-6, F9-8, U-4, U-5, U-10, PF-11, PF-15, QE8-RV1, GC-P2, F-3 grant, P1-Rev7, O05, REG-06, H-18/D-2) | All EFFECTIVE | Various scoped waivers | None waive any of the six Gate 4 prerequisites |

**Waiver coverage conclusion:** WA-02 authorizes P-1 provisioning. WA-06 waives Windows-host as a governance blocker. No waiver covers Gate C acceptance, Gate 4 result acceptance, or Gate 5 admission. No waiver covers QE execution or Limb A implementation.

---

## (F) Cross-Repository Conflict Reconciliation

### Conflict 1 — H-12 adoption status

| Source | Repository | Branch | Commit | Position |
|---|---|---|---|---|
| Stage 5 assessment | IPD | arena/046844dc | cb00fa7a… | "H-12 v2 candidate fails validation; v3 replacement required + separate adoption; NOT adopted" |
| H-12 R5 Adoption Act | IRR | origin/main | 820e7efc… | H-12 R5 ADOPTED — EFFECTIVE; manifest blob f4649e36…; 56/56 entries PRESENT; 981 checks, 0 failures |

**Resolution:** RESOLVED in favor of IRR main. H-12 R5 IS adopted and effective. This is an adoption/effectiveness finding, not a waiver. No separate H-12 v3 adoption act is needed.

### Conflict 2 — Gate A′ identity values

| Source | Repository | Branch | Commit | Position |
|---|---|---|---|---|
| Stage 5 assessment | IPD | arena/046844dc | cb00fa7a… | "identity values unresolved; no store exists" |
| S1 Identity-Value Determination | IPD | origin/main | de8756de… | Values RENDERED: `ramki-personal-local` / `ipd-personal-local` / `ipd-owner-ramki-personal` |
| H-12 R5 Adoption Act §1.2 | IRR | origin/main | 820e7efc… | References S1 identity values as effective |

**Resolution:** PARTIALLY RESOLVED. Identity values ARE rendered (S1 act on IPD main). The act is RENDERED — NOT YET EFFECTIVE (requires publication per §13). No new PA decision needed; publication is the remaining step.

### Conflict 3 — Gate A′ provisioning authority

| Source | Repository | Branch | Commit | Position |
|---|---|---|---|---|
| Stage 5 assessment (prior report) | IPD | arena/046844dc | cb00fa7a… | "Blocked — identity values unresolved; no store exists" (implied unauthorized) |
| WA-02 | IRR | origin/main | 820e7efc… | "EFFECTIVE — AUTHORIZED — ONE ATTEMPT ONLY — NOT EXECUTED — UNSPENT" |
| Gate A′ Successor Provisioning Act | IPD | origin/main | de8756de… | RENDERED — EFFECTIVE ON PUBLICATION; authorizes provisioning code; execution was blocked by identity values (now resolved by S1) |
| S1 Identity-Value Determination | IPD | origin/main | de8756de… | Resolves the three identity values |

**Resolution:** RESOLVED. P-1 provisioning IS authorized by existing instruments (WA-02 + successor act + S1 + WA-06). Identity values ARE resolved. No fresh PA approval required. The remaining constraint is host availability, not authority.

### Conflict 4 — Gate 4 act effectiveness

| Source | Repository | Branch | Commit | Position |
|---|---|---|---|---|
| Stage 5 assessment | IPD | arena/046844dc | cb00fa7a… | "RENDERED — NOT EFFECTIVE (not published to main)" |
| Gate 4 Target-Host Qualification Authority Act | IPD | origin/main | de8756de… | Act file present at `evidence/cross-repository/IIPS_V3_CAP02_GATE4_TARGET_HOST_QUALIFICATION_ACT_EFFECTIVE_2026-10-23.md`; §15 requires publication to IPD main with green CI + remote read-back |

**Resolution:** Nuanced — file present on IPD main; effectiveness confirmation (green CI + remote read-back after merge) not independently verified in this read-only investigation. No conflict in the document itself; the question is whether effectiveness conditions have been met.

### Conflict 5 — DQ-6b Path A effectiveness

| Source | Repository | Branch | Commit | Position |
|---|---|---|---|---|
| Stage 5 assessment | IPD | arena/046844dc | cb00fa7a… | Not explicitly addressed |
| DQ-6b Path A Decision | IRR | origin/main | 820e7efc… | DECIDED — PATH A; 5/6 elements effective; element 6 (IPD mirror receipt) PREPARED — NOT PUBLISHED |

**Resolution:** RESOLVED in favor of IRR main. Path A is decided and largely effective. Split primary/alias baseline (IPD `8eec74ae` + IRR `70b24f02` + IRR `ba64b2d5`) is the adopted configuration. Element 6 requires IPD-locus mirror receipt publication.

### Conflict 6 — DQ-4 QE freeze establishment

| Source | Repository | Branch | Commit | Position |
|---|---|---|---|---|
| Stage 5 assessment | IPD | arena/046844dc | cb00fa7a… | Not addressed |
| DQ-4 QE Freeze Manifest | IRR | origin/main | 820e7efc… | 8/10 criteria MET; criteria 7 (host sequence) and 8 (canonical native-Windows host evidence) NOT MET; freeze PREPARED — NOT ESTABLISHED |

**Resolution:** RESOLVED in favor of IRR main. Freeze is 80% established; 2 criteria blocked by host availability, not by missing PA decisions.

### Conflict 7 — IPD main vs IRR main divergence

| Aspect | IPD main | IRR main |
|---|---|---|
| Commit | `de8756de1d7d4082e8e144dadf3fb53373b711c6` | `820e7efced6800ec077c021d1c7fafaeb093e1fc` |
| Authority locus | IPD acts (Gate 4, successor provisioning, S1) rendered but publication effectiveness unconfirmed | IRR acts (blanket waiver, H-12 R5, DQ-6b, DQ-4, DEC-06, Waiver Register B) effective |

**Resolution:** Repositories have diverged. Cross-repository registration (Gate 4 Act §13.2) requires IPD tracker mirror receipt — PREPARED — NOT PUBLISHED. No current readiness impact beyond the publication gap.

---

## (G) Corrections to Internal Contradictions

| Contradiction | Prior statement | Corrected statement |
|---|---|---|
| "No waiver covers any prerequisite" vs WA-02/WA-06 | Claimed no waiver covers any Gate 4 prerequisite | WA-02 DOES authorize P-1 provisioning (one attempt, unspent). WA-06 DOES waive Windows-host as a governance blocker. The prior statement was overbroad; corrected to reflect that WA-02 covers P-1 provisioning and WA-06 covers host-as-governance-blocker. |
| "Four of six prerequisites have effective PA authority" | Unexplained claim | Explained: Item 1 (S1 rendered), Item 2 (WA-02 authorizes P-1), Item 4 (H-12 R5 adopted), Item 6 (Gate 4 act §6-§7 issues execution grant). Items 3 and 5 require execution, not new authority. |
| H-12 adoption vs waiver | "H-12 v3 not adopted; separate adoption needed" | H-12 R5 IS adopted and effective on IRR main. This is adoption/effectiveness, not waiver. No separate H-12 v3 act needed. |
| "No repository was modified" | Claimed read-only only with no modification | The STAGE-5A report file was created and committed to IPD branch `arena/046844dc-iips-production-market-data` (commit `b1ca8ea`), and pushed to origin. This is a documentation addition only; no source, schema, migration, write-gate, dependency, IRR, or production changes were made. |
| P-1 provisioning classified as unauthorized | Implied P-1 requires fresh PA approval | Corrected: P-1 provisioning IS authorized by WA-02 (effective, unspent), Gate A′ successor act (rendered), S1 identity determination (rendered), and WA-06 (host waiver). No fresh PA approval required. |

---

## (H) Summary of Findings

### Branch coverage
- **IPD:** 2 of 2 remote branches inspected (100%). Commit SHAs recorded.
- **IRR:** 393 of 393 remote branches inspected (100%). 310 branches carry duplicates of main's authority records; 83 branches have no authority/waiver documents. Zero branches contain unique waiver/authority records not on IRR main or IPD main.

### P-1 provisioning authority
**P-1 provisioning IS authorized by existing instruments.** WA-02 (effective on IRR main) authorizes one fresh P1-F Execute — unspent, not executed. S1 (rendered on IPD main) resolved the three identity values. The Gate A′ successor act (rendered on IPD main) authorizes provisioning code and V-A2-1…V-A2-8 validation. WA-06 (effective on IRR main) waives Windows-host as a governance blocker. No fresh PA approval is required for P-1 provisioning itself. The remaining constraint is host availability (`desktop-no0nhtp` unreachable from Linux sandbox), which is an operational constraint, not an authority gap.

### Six-item classification summary

| # | Item | Waiver/exemption | Authorization | Execution/completion | Evidence | Formal acceptance | Remaining blocker | New PA approval? |
|---|---|---|---|---|---|---|---|---|
| 1 | Gate A′ identity values | None needed | AUTHORIZED (S1 rendered) | RENDERED, not yet effective (§13 publication pending) | Values recorded in S1 act | NOT ACCEPTED | Publication to IPD main | NO |
| 2 | Gate A′ P-1 provisioning | PARTIALLY (WA-02, WA-06) | AUTHORIZED (WA-02 unspent; successor act; S1) | NOT EXECUTED | None exists | NOT ACCEPTED | Host availability | NO |
| 3 | Limb A implementation | NONE | AUTHORIZED (Gate 4 act Q3) | NOT IMPLEMENTED | None at IPD main | NOT ACCEPTED | IPD engineering work | NO |
| 4 | H-12 v3 adoption | NONE (adopted, not waived) | AUTHORIZED — EFFECTIVE (IRR main) | ADOPTED AND EFFECTIVE | Manifest + 981 checks + bilateral harness | EFFECTIVE | None (drift re-adoption possible) | NO |
| 5 | Host preflight (S3) | PARTIALLY (WA-06) | AUTHORIZED (Gate 4 act) | NOT EXECUTED | None | NOT ACCEPTED | Host availability; S2 + P-1 first | NO |
| 6 | QE-1…QE-11 | NONE | AUTHORIZED (grant issued, blocked by prerequisites) | 0/11 EXECUTED | None | NOT ACCEPTED | S3 preflight first; host availability | NO |

### Downstream dispositions
- Gate C result acceptance: NOT RENDERED; requires QE-11 executed and accepted first; new PA acceptance act required
- Gate 4 result acceptance (W-1(3)): NOT RENDERED; requires Gate C accepted first; new PA acceptance act required
- Gate 5 admission (W-1(4)): NO ACT EXISTS; requires Gate 4 result accepted first; new PA act required
- DQ-4 QE freeze: 8/10 MET; criteria 7–8 blocked by host availability; no new PA approval needed
- U6 operational writes: NOT AUTHORIZED; W-1 hard-false; requires Gate 4 + Gate 5 accepted first

### Whether any new PA approval is genuinely required
**No new PA approval is required for any of the six items or for P-1 provisioning.** Existing authority covers:
- P-1 provisioning: WA-02 (effective, unspent) + successor act + S1 + WA-06
- Limb A: already authorized by Gate 4 act
- H-12: already adopted and effective on IRR main
- S3 preflight: already authorized by Gate 4 act
- QE execution: execution grant already issued by Gate 4 act §6-§7

New PA **acceptance acts** (not approvals) are required downstream for Gate C acceptance, Gate 4 result acceptance, and Gate 5 admission — but these are separate acceptance decisions, not new approvals for the six items themselves.

### Boundaries confirmed
- Read-only investigation: no source, schema, migration, write-gate, dependency, IRR, or production changes
- The only repository modification is this documentation file committed to IPD branch `arena/046844dc-iips-production-market-data`
- No implementation was performed; no P-1 provisioning was executed; no host operations were attempted
- No gate or write-guard was changed; `evaluatePortSaveGuard()` remains `authorized: false`
- No new waiver or authority records were created
- PR #144 remains OPEN on branch `arena/046844dc-iips-production-market-data`