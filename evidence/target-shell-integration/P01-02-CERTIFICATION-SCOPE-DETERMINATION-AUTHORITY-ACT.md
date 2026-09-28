# Institutional Investment Platform System (IIPS)
# P01-02 — PROGRAM AUTHORITY CERTIFICATION-SCOPE DETERMINATION

**Act ID:** `p01-02-certification-scope-determination-2026-09-28-001`
**Act Type:** PROGRAM-AUTHORITY CERTIFICATION-SCOPE DETERMINATION (governance record)
**Gate:** `PROGRAM AUTHORITY P01-02 CERTIFICATION-SCOPE DETERMINATION`
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01 / P00 phase-gate model
**Decision Authority:** **RAMKI — Program Authority**
**Recording Agent:** Arena (recording only)
**Recorded At (local, Asia/Calcutta):** 2026-09-28
**Repository / Branch:** `ramkivs/iips-production-market-data` /
`arena/01a0e6d9-iips-production-market-data`

---

## 0. ANTECEDENT

This act records the Program Authority determination supplied for the gate
`PROGRAM AUTHORITY P01-02 CERTIFICATION-SCOPE DETERMINATION`, which follows the completed gate
`P01-02 CERTIFICATION-SCOPE DETERMINATION`.

That gate determined that the authoritative certification framework **neither explicitly includes
nor explicitly excludes** P01-02: P01-02 is not among the C1–C12 certification requirements; C1–C12
is not established as exhaustive; P01's `Cert. before progression? = No` is a
progression-sequencing statement rather than an exclusion; and **no explicit inclusion or exclusion
for P01-02 exists anywhere in the authoritative record**. It correctly stopped at the Program
Authority boundary. **This act supplies and records that boundary decision. It does not reinterpret,
replace, or extend it.**

---

## 1. DETERMINATION

> # `P01-02 = ACCEPTANCE-GOVERNED ONLY / NOT CERTIFICATION-BEARING`

**Artifact:** `P01-02 — Timestamp/as-of semantics`

> **RAMKI, acting as the established IIPS Program Authority, explicitly determines:**
>
> ### **P01-02 — Timestamp/as-of semantics is an ACCEPTANCE-GOVERNED ARTIFACT ONLY and is NOT
> ### CERTIFICATION-BEARING under the current IIPS certification model.**

This determination is **specifically bounded to `P01-02 — Timestamp/as-of semantics`** and does not
modify the certification status or certification requirements of any other phase, work item, or
certification requirement.

---

## 2. AUTHORITY

> # `Program Authority = RAMKI`

| # | Evidence | Location |
|---|---|---|
| 1 | `**Authority Holder:** RAMKI` | `evidence/target-shell-integration/NEXT-PRODUCT-SURFACE-AUTHORITY-DESIGNATION-PACKET.md` line 8 — **resident on PMD `main`** |
| 2 | `**Governing Authority:** RAMKI (Designating Authority)` | `evidence/target-shell-integration/PHASE1C-INTELLIGENCE-PAYLOAD-AUTHORITY-DESIGNATION.md` line 6 — **resident on PMD `main`** |
| 3 | `"decisionAuthority": "RAMKI (Designating Authority)"` | `evidence/target-shell-integration/phase1c-intelligence-payload-authority-designation.json` — **resident on PMD `main`** |

**Scope of this authority:** the bounded P01-02 certification-scope determination only. This act
does not extend Program Authority to any other artifact, phase, or decision.

---

## 3. CONSEQUENCES

> ### `P01-02 A2 designation = NOT REQUIRED`
>
> ### `P01-02 certification act = NOT REQUIRED / NOT PERFORMED`
>
> ### `P01-02 acceptance = NOT YET PERFORMED`

| # | Consequence | Recorded disposition |
|---|---|---|
| 1 | **P01-02 A2 designation** | **NOT REQUIRED.** No P01-02 A2 certification-authority designation shall be created. **No person shall be named or inferred as P01-02 A2 authority.** |
| 2 | **P01-02 certification** | **NOT REQUIRED / NOT PERFORMED.** No certification act, certificate, certification PASS, or certification evidence package shall be created. |
| 3 | **P01-02 acceptance** | **NOT YET PERFORMED.** The existing P01-02 acceptance-criteria authority and A3 designation remain intact. **SAI remains the designated A3 acceptor, `P01-02 only`.** **This decision does NOT itself constitute acceptance.** |
| 4 | **P01-02 implementation** | **NOT AUTHORIZED** by this decision. |
| 5 | **Deferred contract-test obligation** | **TIME-SCOPED DEP-P01-07 REMAINS OUTSTANDING.** See §6. |
| 6 | **Other phases** | **NO CHANGE.** See §7. |

---

## 4. P01-02 GOVERNANCE STATE AFTER THIS DETERMINATION

| Dimension | State | Artifact / basis |
|---|---|---|
| **Execution authority** | **ESTABLISHED** | `P01-WAVE1-EXECUTION-AUTHORITY-DESIGNATION-ACT.md` @ `6b7552b` (bounded P01 Wave-1 = P01-01 + P01-02) |
| **Acceptance-criteria authority** | **ESTABLISHED** | `P01-02-ACCEPTANCE-CRITERIA-AUTHORITY-ACT.md` @ `d712c31` (Work Tracker authorized for P01-02 only) |
| **A3 acceptance authority** | **ESTABLISHED — SAI, P01-02 only** | `P01-02-A3-ACCEPTANCE-AUTHORITY-DESIGNATION-ACT.md` @ `26b6def` |
| **Certification scope** | **ACCEPTANCE-GOVERNED ONLY / NOT CERTIFICATION-BEARING** | **This act** |
| **A2 certification authority** | **NOT REQUIRED** | This act |
| **Production authority** | **NOT ESTABLISHED** | — |
| **Integration authority** | **NOT ESTABLISHED** | — |
| **Implementation** | **NOT STARTED** | — |
| **Acceptance** | **NOT PERFORMED** | — |

### 4.1 Role separation preserved

> # `execution authority ≠ acceptance-criteria authority ≠ A3 acceptance authority ≠ A2 certification authority ≠ production authorization`

The separation is **not** collapsed by this act. No role is merged into another; no person is
inferred into a role they were not designated for.

---

## 5. WHAT THIS DETERMINATION DOES AND DOES NOT MEAN

**It means** that P01-02's governance disposition is **acceptance rather than a separate
certification act**.

**It does not mean** that P01-02 is unimportant, unverified, or exempt from all future contractual
use. The authorized P01-02 acceptance criteria remain fully in force, the designated A3 acceptor
remains empowered to adjudicate against them, and any future P01-02 acceptance must be exercised
against those authorized criteria in a separate governed gate.

**It does not authorize implementation.** Execution of the deferred P01-02 obligations requires its
own separately governed gate under the holder's subsequent explicit execution instruction, exactly
as `P01-WAVE1` §6 requires.

---

## 6. DEFERRED OBLIGATIONS — NOT DISCHARGED

> ## **TIME-SCOPED DEP-P01-07 REMAINS OUTSTANDING**

This decision does **not** discharge:

| Obligation | Status |
|---|---|
| **P01-02 contract tests** | **OUTSTANDING** — no P01-02 contract test exists anywhere in the four-repository universe |
| **Time-semantics executable validation** | **OUTSTANDING** |
| **P05/P06 execution obligations** | **OUTSTANDING — unchanged** |
| **P15 obligations** | **OUTSTANDING — unchanged** |

The original routing stands: `docs/p01/P01_DEPENDENCY_REGISTER.md` DEP-P01-07 routes the deferred
contract tests to **P05/P06 execution + P15**. The identifier-scoped portion was previously
recognized as satisfied for **P01-01** only; the **time-scoped portion remains outstanding** and is
untouched by this act.

> **Certification disposition and execution of deferred obligations remain separate.**

---

## 7. OTHER-PHASE BOUNDARY — NO CHANGE

This decision does **not** modify:

| Not modified | Status |
|---|---|
| **P07 certification** (C7, C8) | **UNCHANGED** |
| **P08 certification** (C3, C4, C11) | **UNCHANGED** |
| **P09 certification** | **UNCHANGED** |
| **P10 certification** | **UNCHANGED** |
| **P11 certification** (C1, C2) | **UNCHANGED** |
| **P12 certification** (C6, C7) | **UNCHANGED** |
| **P15 certification** | **UNCHANGED** |
| **P16 certification** | **UNCHANGED** |
| **P17 certification** | **UNCHANGED** |
| **C1–C12** | **UNCHANGED** |
| **Any other certification requirement** | **UNCHANGED** |

**No other phase may inherit or lose certification scope because of this decision.**

---

## 8. P01-01 BOUNDARY

**P01-01 is NOT modified.** P01-01's existing determination
`ACCEPTANCE-GOVERNED ONLY / NOT CERTIFICATION-BEARING` @ `54ecee08…` remains **its own bounded
Program Authority decision**. P01-02 receives **its own independent determination here**.

> **The two decisions are not merged into one generic P01 certification disposition.**

---

## 9. VERIFICATION PERFORMED BEFORE RECORDING

**24 fail-closed invariants were evaluated; all 24 PASS.** No fail-closed condition was triggered.

| # | Precondition | Result |
|---|---|---|
| — | Authoritative remote, branch, HEAD, remote HEAD, clean worktree | **PASS** |
| — | **RAMKI's Program Authority verified** | **PASS** (3 independent forms, on PMD `main`) |
| 1 | P01-02 acceptance-criteria authority act @ `d712c31` intact | **PASS** |
| 2 | P01-02 A3 designation act @ `26b6def` intact | **PASS** |
| 3 | P01-WAVE1 execution authority intact | **PASS** (blob `1bfa9eff…`) |
| 4 | P01-01 governance chain intact (all 5 artifacts) | **PASS** |
| 5 | No newer authoritative certification rule contradicts the decision | **PASS** — `D4_11` lists no P01-02 requirement, makes no exhaustiveness claim, and PMD `main` is unchanged |
| 6 | No existing P01-02 A2 designation | **PASS** |
| 7 | No existing P01-02 certification act | **PASS** |
| 8 | No P01-02 acceptance performed | **PASS** — no P01-02 acceptance act exists; implementation status `NOT STARTED` |

---

## 10. EXPLICIT NON-AUTHORIZATIONS

This act authorizes **none** of:

* P01-02 implementation, source modules, contract tests, fixtures, or test execution;
* P01-02 acceptance;
* P01-02 certification, certificate, certification result, certification PASS, or certification
  evidence package;
* A2 certification authority, for P01-02 or any other item;
* integration into PMD `main`;
* production activation;
* Dhan activation;
* NSE activation;
* credential authorization;
* modification of D4/D7/D8 certification framework records;
* modification of P01-01 artifacts;
* modification of P01-02 acceptance criteria;
* modification of the P01-02 A3 designation;
* modification of any other phase's certification scope;
* discharge of any deferred P01 obligation.

---

## 11. SINGLE-ARTIFACT ATTESTATION

This is the **only artifact created by this act**. No source, test, fixture, acceptance record,
criteria-authority record, A3 designation record, certification-framework record, or unrelated
governance record was created, modified, renamed, deleted, or regenerated in this pass.

---

## 12. REPOSITORY INTEGRITY VERIFICATION

| Check | Result |
|---|---|
| PMD `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` — **UNCHANGED** ✓ |
| P01-02 criteria-authority act @ `d712c31` | **INTACT** ✓ |
| P01-02 A3 designation act @ `26b6def` | **INTACT** ✓ |
| P01-WAVE1 execution authority @ `6b7552b` | blob `1bfa9eff…` — **INTACT** ✓ |
| P01-01 acceptance @ `9c9e606d` | **INTACT** ✓ |
| P01-01 criteria-authority @ `7eec2d1` | **INTACT** ✓ |
| P01-01 re-exercise @ `412b2638` | **INTACT** ✓ |
| P01-01 A3 designation @ `4dda3edd` | **INTACT** ✓ |
| P01-01 cert-scope determination @ `54ecee0` | **INTACT** ✓ |
| Source / tests / fixtures | **UNCHANGED** ✓ |
| Frozen trees | `9080e997` / `0062ad52` / `8491efdc` / `1597ed06` — **UNCHANGED** ✓ |
| Unauthorized diff count | **0** ✓ |

---

## 13. NEXT GOVERNED GATE

> ## `P01-02 ACCEPTANCE RE-EXERCISE AGAINST AUTHORIZED CRITERIA`

**Not performed in this execution.**

Note for that gate: P01-02 acceptance is **not yet performed** and P01-02 implementation is
**not started**. The acceptance re-exercise gate must therefore be exercised against the authorized
P01-02 criteria established at `d712c31`, and can only produce a substantive determination once
P01-02 execution has been separately authorized and performed under the holder's subsequent explicit
execution instruction. The time-scoped DEP-P01-07 obligation remains outstanding and is not
discharged by this act.

---

**Authority attestation:** Determined and recorded by **RAMKI**, Program Authority, under the
explicit determination supplied for this gate, after verifying 24 fail-closed preconditions
including that no P01-02 A2 designation, no P01-02 certification act, and no P01-02 acceptance
already exist, and that no authoritative certification rule contradicts the decision. The
determination is bounded to **P01-02 only**, is recorded independently of P01-01's separate bounded
determination, creates no A2 authority, performs no certification, authorizes no implementation,
integration, or production activation, and discharges no deferred P01 obligation.
