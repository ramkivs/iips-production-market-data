# Institutional Investment Platform System (IIPS)
# P01-02 — Timestamp/as-of semantics — A3 ACCEPTANCE ACT

**Act ID:** `p01-02-a3-acceptance-act-2026-09-28-001`
**Act Type:** A3 ACCEPTANCE ACT (acceptance only; **not** an implementation, **not** a certification,
**not** a certification-scope determination, **not** an A2 designation, **not** an integration
authorization, **not** a production authorization, **not** a new authority designation)
**Governing Gate:** `P01-02 SAI A3 ACCEPTANCE ACT`
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01 / P00 phase-gate model

> ## **Accepted By: SAI**
>
> ## **Acceptance Authority: SAI — designated P01-02 A3 authority**

**Accepting Authority:** **SAI** — the designated P01-02 A3 acceptance authority, designated by
`evidence/target-shell-integration/P01-02-A3-ACCEPTANCE-AUTHORITY-DESIGNATION-ACT.md`
(commit `26b6def23f29daac2ba676656612951b0f02c09f`; **ACCEPTANCE AUTHORITY ONLY**, **P01-02 only**,
bounded, one-time / non-standing)

**Recording Agent:** Arena — **recording agent only**. Arena is **not** the accepting authority.
Arena did **not** adjudicate, accept, or approve P01-02. Arena's role is confined to durably
recording the acceptance decision supplied by the designated A3 authority.

**Recorded At (local, Asia/Calcutta):** 2026-09-28
**Repository / Branch:** `ramkivs/iips-production-market-data` /
`arena/01a0e6d9-iips-production-market-data`

---

## 0. THE ACCEPTANCE DECISION (supplied by SAI; recorded verbatim)

> **"SAI, as the designated P01-02 A3 authority, accepts P01-02 against the authorized criteria.
> DEP-P01-07 remains outstanding and non-blocking."**

This statement is the **actual A3 acceptance decision supplied by the designated authority**, and is
reproduced here verbatim. It is the sole basis of this act. It is clearly distinguished from Arena's
recording activity: **Arena supplied no acceptance determination of its own.**

The decision was supplied in response to `P01-02-A3-ACCEPTANCE-STOP-RECORD.md` @ `9cd35ba`, which
had stopped at the A3 boundary because no SAI action existed and set out the exact decision
required. That stop record is **superseded by this act** and is **not** amended or deleted.

---

## 1. AUTHORITY BASIS (verified; preserved; not re-designated)

| Dimension | Artifact | Ref | Status |
|---|---|---|---|
| **Execution authority** | `P01-WAVE1-EXECUTION-AUTHORITY-DESIGNATION-ACT.md` | `6b7552b642b92c0b783d4c190e409c4ce116e932` (blob `1bfa9eff…`) | **INTACT** — bounded P01 Wave-1 = P01-01 + P01-02 |
| **Acceptance-criteria authority** | `P01-02-ACCEPTANCE-CRITERIA-AUTHORITY-ACT.md` | `d712c31beac4568c45ab4823ef127225a9f80464` | **INTACT** |
| **A3 acceptance authority** | `P01-02-A3-ACCEPTANCE-AUTHORITY-DESIGNATION-ACT.md` | `26b6def23f29daac2ba676656612951b0f02c09f` | **INTACT — SAI, P01-02 only** |
| **Certification-scope determination** | `P01-02-CERTIFICATION-SCOPE-DETERMINATION-AUTHORITY-ACT.md` | `53f01f8caff7274f9b3a370c87f872704429d281` | **INTACT** |
| **Execution record** | `P01-02-EXECUTION-RECORD.md` (+ correction addendum) | `7bd6dd3…` / `d0e3ce6…` | **INTACT** |
| **Acceptance re-exercise** | `P01-02-ACCEPTANCE-RE-EXERCISE-RECORD.md` | `77085f7a8c226b777b4453f33b5f2281262443ff` | **INTACT** |
| **SAI-action stop record** | `P01-02-A3-ACCEPTANCE-STOP-RECORD.md` | `9cd35bac894541a972f09a0b5816f33c68acaeb0` | **INTACT** |

**SAI is the designated A3 authority for `P01-02` only.** No new A3 designation was created. No
existing designation was modified. The designation's exclusions of P01-01, P01-03, P01-04, P01-05,
P02 and later phases, certification, A2, production, and integration remain in force.

---

## 2. ACCEPTANCE BASIS (already-established findings, recorded)

| Criterion | Finding |
|---|---|
| **Requirement** — *"Define event time, received time, publication time, effective time and as-of semantics."* | **SATISFIED** |
| **Deliverable** — *"Time semantics specification"* | **SATISFIED** |
| **Entry Criterion** — *"Baseline reconciled"* | **SATISFIED** |
| **Exit Criterion** — *"All domains mapped to time semantics"* | **SATISFIED** — **all authoritative domains D01–D10 mapped** |
| **Test / Validation** — *"Contract tests"* | **OUTSTANDING** |
| **DEP-P01-07** | **OUTSTANDING / NON-BLOCKING** |

The six-time model is established: **T1 `asOf`**, **T2 `receivedAt`**, **T3 `observationTime`**,
**T4 `effectiveTime`**, **T5 `publicationTime`**, **T6 `evaluationTime`**, never collapsed, never
inferred from one another, never substituted for one another. TS-1…TS-7 and MD-1…MD-7 are in force.

**All ten authoritative domains are mapped:** D01, D02, D03, D04, D05, D06, D07, D08, D10 (accepted
§1.1) and **D09** (established by the P01-02 execution record).

**D09 mapping — preserved unchanged:**

| Time | Basis |
|---|---|
| **T1 `asOf`** | `DataProvenanceDTO.asOf` (`src/contracts/provenance.ts:13`) |
| **T2 `receivedAt`** | `DataProvenanceDTO.receivedAt` (`provenance.ts:14`) |
| **T3 `observationTime`** | `AlternativeDataPayload.observedAt` (`src/contracts/d09_altdata.ts:14`) |
| **T4 `effectiveTime`** | **NOT ASSERTED** — no authoritative D09 contract basis exists |
| **T5 `publicationTime`** | **NOT ASSERTED** — no authoritative D09 contract basis exists |

No T4/T5 semantics were invented. The specification was **not** modified to change this
determination.

---

## 3. DEFERRED OBLIGATIONS — NOT DISCHARGED BY THIS ACCEPTANCE

> ## **SAI's acceptance does NOT discharge DEP-P01-07.**

| Obligation | Status after acceptance |
|---|---|
| **P01-02 contract tests** | **OUTSTANDING** |
| **Executable time-semantics validation** | **OUTSTANDING** |
| **P05 / P06 execution obligations** | **OUTSTANDING — unchanged** |
| **P15 obligations** | **OUTSTANDING — unchanged** |

**None of these has been executed.** No contract tests were run; no executable time validation was
performed; P05, P06 and P15 were not executed. Their authoritative routing stands: **P05/P06
execution + P15**.

The non-blocking disposition rests on, and is preserved by, the authoritative record:
`P01_DEPENDENCY_REGISTER.md` — DEP-P01-07, column *"Blocking P01 gate?"* = **"No — recorded as an
obligation"**; `P01_GATE_ACCEPTANCE.md` criterion 16 — *"Deferred executables recorded as
obligations, not implemented — **PASS**"*; and the explicit statement that accepting P01 does not
discharge those obligations.

Also preserved open and **not** resolved by this acceptance: **OI-05** (D09 applicability criteria,
routed to P10), **M-6** (retention not enforced — existing-IIPS defect, must not be silently
fixed), and the recorded observation that the `DataDomain` enum omits `D10` although D10 is an
authoritative mapped domain.

---

## 4. CERTIFICATION BOUNDARY

> ## **P01-02 = ACCEPTANCE-GOVERNED ONLY / NOT CERTIFICATION-BEARING**

| Item | Status |
|---|---|
| **A2 certification-authority designation** | **NOT REQUIRED** — no A2 designation created; no person named or inferred |
| **Certification** | **NOT PERFORMED and NOT REQUIRED** |
| **C1–C12** | **UNCHANGED** |
| **D4 / D7 / D8 certification framework** | **UNCHANGED** |
| **P01-01** | **UNCHANGED** — not reopened or modified |

No certification act, certificate, certification PASS, or certification evidence package is created
by this acceptance. The P01-01 certification disposition remains P01-01's own separate bounded
determination and is not merged with this one.

---

## 5. FUNCTIONAL / INTEGRATION BOUNDARY

| Item | Status |
|---|---|
| User-facing functional blocker | **NO** |
| Integration blocker | **NO** |
| Release/production blocker | **NO** |
| DEP-P01-07 | **Governance/validation obligation, non-blocking** |

Repository evidence for the classification: the only time-handling module on PMD `main` is
`src/normalization/time_normalizer.ts` — 59 lines with 0 imports, wholly self-contained; no P01-02
contract module exists or is imported anywhere in `src/` or `tests/`. Candidate `e716bf1f` versus
`main` is purely additive (26 added, 0 modified, 0 removed, 0 renamed). Production activation is A4,
exercised at P16 only, downstream of the blocked P15, and NOT AUTHORIZED.

**This acceptance is not an implementation authorization and not an integration authorization.**

---

## 6. STRICT NON-AUTHORIZATIONS

This acceptance act does **NOT** authorize:

P05 execution · P06 execution · P15 execution · contract-test implementation · executable time
validation · production · Dhan activation · NSE activation · integration into PMD `main` · platform
integration · changes to P01-01 · changes to the certification framework.

---

## 7. REPOSITORY INTEGRITY

| Check | Result |
|---|---|
| Branch / local HEAD / remote HEAD before mutation | `arena/01a0e6d9-…` / `9cd35ba…` / `9cd35ba…` — **equal** |
| Clean worktree before mutation | **YES** |
| P01-02 governance chain (7 artifacts) | **all INTACT** |
| P01-WAVE1 execution authority | blob `1bfa9eff…` — **INTACT** |
| P01-01 governance chain (5 artifacts) | **all INTACT — not modified** |
| Certification framework | D4/D7/D8, C1–C12, PMD `main` `4d3e1cdca3a33da0ec3be8b336b17128108a502c`, candidate `arena/01a0e30c` `e716bf1f4bb1c32199f57f43de54f0b67daa6b72` — **UNCHANGED** |
| Frozen trees | `9080e997…` / `0062ad52…` / `8491efdc…` / `1597ed06…` — **UNCHANGED** |
| Blueprint `docs/FINAL_INTEGRATION_BLUEPRINT_2026-09-28.md` | **untracked, 0 commits**, sha256 `9d23f327…4ba3` — **untouched** |
| Source / tests / fixtures | **UNCHANGED** — none created or modified |
| Pre-recording invariant failures | **0 of 31** |

**31 fail-closed pre-recording invariants evaluated; all 31 PASS.** No fail-closed condition was
triggered.

---

## 8. FINAL STATE

```text
P01-02 EXECUTION AUTHORITY       = ESTABLISHED
P01-02 CRITERIA AUTHORITY        = ESTABLISHED
P01-02 A3 AUTHORITY              = SAI
P01-02 REQUIREMENT               = SATISFIED
P01-02 DELIVERABLE               = SATISFIED
P01-02 EXIT CRITERION            = SATISFIED
P01-02 ACCEPTANCE                = ACCEPTED BY SAI
P01-02 CERTIFICATION             = NOT REQUIRED
DEP-P01-07                       = OUTSTANDING / NON-BLOCKING
FUNCTIONAL BLOCKER               = NO
INTEGRATION BLOCKER              = NO
RELEASE BLOCKER                  = NO
P05/P06                          = OUTSTANDING
P15                              = OUTSTANDING
PRODUCTION AUTHORIZATION         = NONE
INTEGRATION AUTHORIZATION        = NONE
```

**The P01-02 acceptance chain is complete**, subject only to the separately governed deferred
obligations above. **No further P01-02 governance gate is opened by this act.**

---

**Acceptance attestation:** **Accepted By SAI**, the designated P01-02 A3 acceptance authority, by
the explicit decision reproduced verbatim in §0 — *"SAI, as the designated P01-02 A3 authority,
accepts P01-02 against the authorized criteria. DEP-P01-07 remains outstanding and non-blocking."*
Recorded by **Arena** as recording agent only; Arena did not adjudicate, accept, or approve P01-02.
This act authorizes no implementation, no certification, no A2 designation, no integration, and no
production activation, and does not discharge DEP-P01-07 or any P05/P06/P15 obligation.
