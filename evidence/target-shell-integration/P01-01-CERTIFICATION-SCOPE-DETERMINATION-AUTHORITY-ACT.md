# Institutional Investment Platform System (IIPS)
# P01-01 — CERTIFICATION-SCOPE DETERMINATION (PROGRAM AUTHORITY ACT)

**Act ID:** `p01-01-certification-scope-determination-2026-09-28-001`
**Act Type:** PROGRAM-AUTHORITY CERTIFICATION-SCOPE DETERMINATION (governance record)
**Gate:** `PROGRAM AUTHORITY P01-01 CERTIFICATION-SCOPE DETERMINATION`
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01 / P00 phase-gate model
**Decision Authority:** **RAMKI — PROGRAM AUTHORITY**
**Recorded At (local, Asia/Calcutta):** 2026-09-28
**Repository / Branch:** `ramkivs/iips-production-market-data` /
`arena/01a0e6d9-iips-production-market-data`

---

## 0. ANTECEDENT

This act records the explicit Program Authority determination supplied for the gate
`PROGRAM AUTHORITY P01-01 CERTIFICATION-SCOPE DETERMINATION`, which follows the completed
gate `P01-01-CERTIFICATION-SCOPE-DETERMINATION` (result: **C — P01-01 CERTIFICATION SCOPE
REQUIRES PROGRAM GOVERNANCE DETERMINATION**).

That gate determined that the authoritative certification model does **not** currently resolve
whether P01-01 is certification-bearing: P01-01 is not among the C1–C12 certification
requirements, C1–C12 is not established as exhaustive, `Cert. before progression? = No` is a
progression-sequencing statement rather than an exclusion, and no record explicitly includes or
explicitly excludes P01-01. It stopped at the Program Authority boundary, as required.

**This act supplies and records that boundary decision. It does not reinterpret, replace, or
extend it.**

---

## 1. DETERMINATION

> # `P01-01 = ACCEPTANCE-GOVERNED ONLY / NOT CERTIFICATION-BEARING`

**Artifact:** `P01-01 — Canonical Identifier Specification v1.0.0`
(`src/contracts/canonical_id_specification.ts`)

> **RAMKI, acting as the established IIPS Program Authority within the bounded governance scope,
> explicitly determines:**
>
> ### **P01-01 — Canonical Identifier Specification v1.0.0 is an ACCEPTANCE-GOVERNED ARTIFACT ONLY
> ### and is NOT CERTIFICATION-BEARING under the current IIPS certification model.**

### 1.1 The nine express terms of the determination

| # | Program Authority determination | Recorded disposition |
|---|---|---|
| 1 | P01-01 does **not** require a separate A2 certification authority designation | **NO P01-01 A2 DESIGNATION REQUIRED** |
| 2 | No P01-01 certification act is required | **NO P01-01 CERTIFICATION ACT** |
| 3 | The existing P01-01 acceptance, acceptance-criteria authority, A3 acceptance authority, and acceptance re-exercise remain valid | **ALL REMAIN IN FORCE — UNCHANGED** |
| 4 | P01-01 must not be retroactively represented as certified | **NOT CERTIFIED — NO C1–C12 CLAIM ATTRIBUTABLE** |
| 5 | No C1–C12 certification claim may be attributed to P01-01 merely because the artifact participates in or is consumed by later certified capabilities | **CONSUMPTION ≠ CERTIFICATION** |
| 6 | Existing later-phase certification requirements remain unchanged | **UNCHANGED** |
| 7 | This decision does not alter the certification scope of P07/P08/P09/P10/P11/P12/P15/P16/P17 or any other phase | **NO OTHER-PHASE SCOPE CHANGE** |
| 8 | This decision does not waive, discharge, or reclassify any outstanding P01 obligations routed to P05/P06/P15 | **DEFERRED P01 OBLIGATIONS UNAFFECTED** |
| 9 | This decision does not authorize implementation, integration, production activation, Dhan activation, NSE activation, or any unrelated work | **NO IMPLEMENTATION / INTEGRATION / PRODUCTION AUTHORITY** |

### 1.2 What the determination does and does not mean

**"Acceptance-governed only" means** that P01-01's governance disposition is **acceptance rather
than a separate certification act**.

**It does not mean** that P01-01 is unimportant, unverified, untested, or exempt from all future
contractual use. P01-01 was executed under bounded execution authority, accepted by the designated
A3 acceptor, re-exercised against explicitly authorized criteria, and passed on all six criteria
(C1–C6) with the fixture/grammar correspondence independently re-derived. That verification is
**unchanged and undisturbed**; only the certification disposition is settled.

---

## 2. AUTHORITY

> # `Program Authority = RAMKI`

**Evidence supporting that authority** (all resident on PMD `main` @
`4d3e1cdca3a33da0ec3be8b336b17128108a502c`, verified before recording):

| # | Evidence | Location |
|---|---|---|
| 1 | `**Authority Holder:** RAMKI` | `evidence/target-shell-integration/NEXT-PRODUCT-SURFACE-AUTHORITY-DESIGNATION-PACKET.md` line 8 |
| 2 | `**Governing Authority:** RAMKI (Designating Authority)` | `evidence/target-shell-integration/PHASE1C-INTELLIGENCE-PAYLOAD-AUTHORITY-DESIGNATION.md` line 6 |
| 3 | `"decisionAuthority": "RAMKI (Designating Authority)"` | `evidence/target-shell-integration/phase1c-intelligence-payload-authority-designation.json` |
| 4 | Same holder-reserved designation lineage | `PHASE3-EXECUTIVE-SURFACE-…`, `PHASE4-RESEARCH-IDENTITY-DESIGNATION-AUTHORITY-ACT.md`, `PHASE-F3-UI08-…`, `PHASE-F8-UI06-…`, `PHASE5-…` |

**Scope of this authority:** the bounded P01-01 certification-scope determination only. This act
does not extend Program Authority to any other artifact, phase, or decision.

---

## 3. CONSEQUENCES

> ### `P01-01 A2 designation = NOT REQUIRED`
>
> ### `P01-01 certification act = NOT REQUIRED / NOT PERFORMED`
>
> ### `P01-01 = ACCEPTED` — existing acceptance remains in force, unchanged

No A2 certification-authority designation is created, required, or implied by this act. No
certification act is performed. No certification result, certificate, evidence package, or release
certification is produced.

**Acceptance consequence:** the existing P01-01 acceptance @ `9c9e606d` remains valid, in force,
and byte-identical to its published commit. It is **not** revoked, superseded, amended, or
re-exercised by this act.

---

## 4. VERIFICATION PERFORMED BEFORE RECORDING

30 fail-closed invariants were evaluated; **all 30 PASS**. No fail-closed condition was triggered.

| # | Check | Result |
|---|---|---|
| 1 | **Program Authority** — RAMKI verified as Program Authority | **PASS** (3 independent forms above) |
| 2 | **Existing acceptance intact, not revoked/superseded** — acceptance act blob `5f355db6…` byte-identical to `9c9e606d`; disposition `P01-01 ACCEPTED`; contains no revocation/supersession | **PASS** |
| 3 | **Acceptance-criteria authority intact** — blob `69871fa6…` byte-identical to `7eec2d1` | **PASS** |
| 4 | **A3 authority intact and not converted to A2** — A3 act blob `5af8eee3…` byte-identical to `4dda3edd`; scoped to acceptance authority only; acceptor SAI; confers no A2 authority | **PASS** |
| 5 | **Certification separation** — the determination creates and implies no A2 certification act | **PASS** |
| 6 | **Existing certification framework not contradicted** | **PASS** — see below |
| 7 | Re-exercise record @ `412b2638` byte-identical | **PASS** |
| 8 | PMD `main` @ `4d3e1cdc…` unchanged | **PASS** |
| 9 | Candidate `arena/01a0e30c` @ `e716bf1f…` unchanged | **PASS** |
| 10 | Frozen trees `src/identity` / `src/d114` / `frontend/src/features/portfolio` / `src/ui` unchanged | **PASS** ×4 |
| 11 | No tracked modifications; no unstaged tracked changes; local HEAD == prior session tip | **PASS** |

### 4.1 Framework-compatibility detail (check 6)

| Governing record | Finding | Contradiction? |
|---|---|---|
| `docs/d4/D4_11_CERTIFICATION_MATRIX.md` | P01-01 is **not** listed among C1–C12; the matrix makes **no exhaustiveness claim** (M.6 lists five non-claims, exhaustiveness not among them) | **NO** |
| `docs/p00/P00_GATE_MODEL.md` | Legend: *"Cert. before progression? — whether a certification act is required **before the next phase**."* P01 = `No`, a sequencing statement; P01 is not a certification-bearing phase | **NO** |
| `docs/p00/P00_AUTHORITY_REGISTER.md` | *"Authority to proceed ≠ gate acceptance ≠ certification ≠ production activation"* — the four dimensions are separate; A2 cleared for the program, **no person named**, `NONE_GRANTED` | **NO** |
| `docs/d7/D7_AUTHORITY_ROLE_ASSIGNMENT.md` | A2 required scope = *"Ownership of certification requirements C1–C12"*; P01-01 is not among them | **NO** |
| `docs/d8/D8_AUTHORITY_RECONCILIATION.md` | *"Require certification before promotion \| P07, P09, P10, P12, P15"* — P01 absent; *"CERTIFICATION \| NONE GRANTED"*; A2 *"NO CERTIFICATION IS GRANTED"* | **NO** |
| `docs/p01/P01_GATE_ACCEPTANCE.md` | criteria 17/18/22: no certification work performed; *"No certification granted"*; `NONE_GRANTED`; *"no certification artifact produced"* | **NO** |

**No governing record directly contradicts the Program Authority determination.** No newer
authoritative certification rule materially changing the question was found. The determination is
therefore **compatible with the governing framework** and is recorded.

---

## 5. ROLE SEPARATION PRESERVED

The following distinction remains explicit and is **not** collapsed by this act:

> # `execution authority ≠ acceptance-criteria authority ≠ A3 acceptance authority ≠ A2 certification authority ≠ production authorization`

| Role | Holder | Artifact | Scope | Applies to P01-01 |
|---|---|---|---|---|
| Program Authority | **RAMKI** | `NEXT-PRODUCT-SURFACE-…-PACKET.md` + `PHASE1C-…` (PMD `main`) | Program governance | ✅ This act |
| Execution Authority | Arena (Recording Agent) | `P01-WAVE1-EXECUTION-AUTHORITY-DESIGNATION-ACT.md` @ `6b7552b` | P01-01 + P01-02 | ✅ Already exercised |
| Acceptance-Criteria Authority | Tracker explicitly authorized by RAMKI | `P01-01-ACCEPTANCE-CRITERIA-AUTHORITY-ACT.md` @ `7eec2d1` | P01-01 only | ✅ Established |
| A3 Acceptance Authority | **SAI** | `P01-01-A3-ACCEPTANCE-AUTHORITY-DESIGNATION-ACT.md` @ `4dda3edd` | P01-01, acceptance only | ✅ Exercised; re-exercise PASSED @ `412b2638` |
| **A2 Certification Authority** | **NONE** | — | — | ❌ **NOT REQUIRED — NOT DESIGNATED** |
| Production Authorization | **NONE** | — | — | ❌ **NOT AUTHORIZED** |

**SAI's A3 acceptance designation is not converted into A2 certification authority.** No person is
named as, or inferred to be, a P01-01 certification authority.

---

## 6. BOUNDARIES (explicit)

1. **No other-phase certification change.** This decision does **not** modify the certification
   scope of P07, P08, P09, P10, P11, P12, P15, P16, P17, or any other phase. Existing later-phase
   certification requirements remain exactly as recorded.
2. **No discharge of deferred obligations.** This decision does **not** waive, discharge, or
   reclassify any outstanding P01 obligation routed to **P05/P06 execution + P15**. The
   identifier-scoped portion of DEP-P01-07 remains the only portion recognized as satisfied for
   P01-01; the time (P01-02), mode (P01-04), provenance (P01-05) contract tests and the P01-03
   golden measurement fixtures remain outstanding under their original routing. The historical
   DEP-P01-07 record remains intact.
3. **No retroactive certification.** P01-01 must not be represented as certified. No C1–C12
   certification claim may be attributed to P01-01 merely because it participates in or is
   consumed by later certified capabilities.
4. **No implementation / integration / production authorization.** This act authorizes no
   implementation, no integration into PMD `main`, no production activation, no Dhan activation,
   no NSE activation, and no unrelated work.
5. **No historical rewrite.** No historical acceptance record is modified to restate this decision.

---

## 7. SINGLE-ARTIFACT ATTESTATION

This is the **only artifact created by this act**. No source, test, fixture, acceptance record,
certification requirement, or unrelated governance record was created, modified, renamed, deleted,
or regenerated in this pass.

---

## 8. REPOSITORY INTEGRITY

| Check | Result |
|---|---|
| PMD `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` — **UNCHANGED** |
| Candidate `arena/01a0e30c` | `e716bf1f4bb1c32199f57f43de54f0b67daa6b72` — **UNCHANGED** |
| Acceptance act @ `9c9e606d` | blob `5f355db6…` — **UNCHANGED** |
| Criteria-authority act @ `7eec2d1` | blob `69871fa6…` — **UNCHANGED** |
| Re-exercise record @ `412b2638` | **UNCHANGED** |
| A3 designation act @ `4dda3edd` | blob `5af8eee3…` — **UNCHANGED** |
| P00-02, P01 package, `D4_12`, `D4_11`, `P00_GATE_MODEL`, `P00_AUTHORITY_REGISTER`, `D7`, `D8` | **UNCHANGED** |
| Source / tests / fixtures | **UNCHANGED** |
| Frozen trees | `9080e997` / `0062ad52` / `8491efdc` / `1597ed06` — **UNCHANGED** |
| Unauthorized diff count | **0** |

---

## 9. NEXT GOVERNED GATE

The next gate is identified strictly from the authoritative governance model, not invented.

P01-01's governance chain is now **complete**: accepted, criteria-authorized, re-exercised and
passed, and dispositioned as **acceptance-governed only / not certification-bearing**. No A2
designation and no certification act follow.

The next governed gate in the authoritative model is therefore the **next independent governed
item in the IIPS program**, not a P01-01 continuation. Per `docs/p00/P00_GATE_MODEL.md` and
`docs/d8/D8_AUTHORITY_RECONCILIATION.md`, P01-02 remains the immediate successor item within the
bounded P01 Wave-1 execution scope (`P01-WAVE1` §5 holder decision option C), and it must be
exercised through **its own separate governed execution gate** under a subsequent explicit Program
Authority instruction — exactly as `P01-WAVE1` §6 requires (*"each item is exercised through its
own separate governed execution gate"*).

> ## **`P01-02 — TIMESTAMP / AS-OF SEMANTICS` — SEPARATE GOVERNED EXECUTION GATE**

That gate is **not** performed in this execution. Any gate beyond it is likewise not named or
performed here.

---

**Authority attestation:** Determined and recorded by **RAMKI**, Program Authority, under the
explicit determination supplied for this gate. The determination was verified compatible with the
governing framework (30/30 fail-closed invariants) **before** recording. It grants no A2
certification authority, performs no certification, authorizes no integration and no production
activation, changes no other phase's certification scope, and discharges no deferred P01
obligation. The existing P01-01 acceptance, acceptance-criteria authority, A3 acceptance
authority, and acceptance re-exercise remain in force and byte-identical to their published
commits.
