# D54 — P13-B IMPLEMENTATION AUTHORIZATION

**Artifact ID:** D54
**Title:** P13-B Product-UI Integration — Implementation Authorization
**Act type:** IMPLEMENTATION AUTHORIZATION (not certification, not acceptance, not production authorization)
**Issuing authority:** Program Authority
**Baseline commit:** `bff5ada4bd32a098526a1602073f9fb40c32488c`
**Supersedes:** nothing
**Status:** ACTIVE

---

## 1. DECISION

**A — AUTHORIZE P13-B IMPLEMENTATION.**

Implementation of the bounded P13-B Product-UI Integration work package,
as defined by the P13-B work-item definition (work items P13-B-01 through
P13-B-09), is **AUTHORIZED**.

Implementation may now begin, strictly within the scope of §3 and strictly
subject to the execution boundaries of §5.

---

## 2. AUTHORITY BASIS

This authorization rests on the following recorded prerequisites, each
verified against the repository at the baseline commit above:

| Prerequisite | Status | Evidence |
|---|---|---|
| P13-B Product-UI Integration authorized | ✅ AUTHORIZED | `P13-B-PRODUCT-UI-INTEGRATION-AUTHORITY-01`, Decision A |
| P13-B work-item definition complete | ✅ COMPLETE | `P13-B-WORK-ITEM-DEFINITION-01`, items P13-B-01…-09 |
| AD-9 / C6-before-UI05 sequencing | ✅ **CLEARED** | `P13-B-AD9-C6-UI05-AUTHORITY-ADJUDICATION-01`, Decision A |
| P13-B A3 gate acceptor designated | ✅ **Sai** | `docs/D53_P13B_A3_ACCEPTOR_DESIGNATION.md` @ `bff5ada` |
| C6 / C7 certified (contracts consumed by P13-B) | ✅ CERTIFIED | `docs/PHASE_12_CERTIFICATION_DECISION.md` — *"A — CERTIFY (C6, C7 within P12 API/DTO Gate scope)"* |

Both previously recorded blockers are cleared:

- **BLK-1** (AD-9 / C6-before-UI05 sequencing) — cleared by adjudication.
- **BLK-2** (no designated P13-B A3 acceptor) — cleared by D53.

**BLK-3** (implementation authorization not granted) — **cleared by this act.**

---

## 3. AUTHORIZED SCOPE

The following nine work items are **within** authorized scope:

| Item | Work |
|---|---|
| P13-B-01 | Transport adapter for P12 modules |
| P13-B-02 | Tenant / security enforcement |
| P13-B-03 | Provenance DTO pipeline |
| P13-B-04 | Quality / degradation propagation |
| P13-B-05 | Screener → C6 |
| P13-B-06 | Search / object resolution → C7 |
| P13-B-07 | Evidence / replay linkage |
| P13-B-08 | Dual-transport disclosure |
| P13-B-09 | As-of display |

Nothing outside these nine items is authorized by this act.

---

## 4. A3 ACCEPTANCE AUTHORITY

**P13-B A3 gate acceptor: Sai**, designated by `docs/D53_P13B_A3_ACCEPTOR_DESIGNATION.md`.

That designation is for **P13-B gate acceptance ONLY**. It does not
authorize implementation (this record does), does not grant certification,
and does not grant production authorization.

The A2/A3 separation note recorded in D53 §3 remains in force and is not
modified by this act: Sai also holds A2 authority (`2d28e42`) and certified
the C6/C7 contracts that P13-B consumes. The concern was raised before
designation; the Program Authority designated notwithstanding. The roles
remain **distinct acts, not merged by common identity**.

---

## 5. MANDATORY EXECUTION BOUNDARIES

These boundaries are binding on all P13-B implementation work.

1. **Reuse** the existing React / API / transport architecture. **No UI rebuild.**
2. **AD-17 / M-2 are PRESERVED, not remediated.** **UI17 MUST NOT assert
   verified replay or byte-identity verification.** UI17 may display raw
   `reproduced` / `byteIdentical` / `evidenceRefs` values **only** alongside
   an explicit AD-17 disclosure that replay is not verified.
3. **Provenance must be derived.** No fabricated U1 provenance.
4. **Lineage must be explicitly distinguishable** as P12-fed, v2.0-fed, or
   transitional/dual. No surface may be labelled P12-fed on the basis of
   structural similarity alone — only on a verified P12 import path.
5. **All 13 existing v2.0 routes must remain byte-unchanged.**
6. **P12 endpoints are additive only.**
7. **No modification to `iips-platform`.**
8. **No modification** to engines, methodology, scoring, taxonomy, or Existing-IIPS.
9. **UI10 Collaboration remains deferred** and must not be pulled into P13-B scope.
10. **Evidence re-anchoring of `510b453` / `2f131d9` remains a separate authority act.**
11. **No reopening or modification of accepted P00–P16 records.**
12. **No certification of any kind.**
13. **No production authorization.**

### 5.1 Recorded execution risk

`frontend/src/features/replay/ReplayExplorer.tsx` (L72-75) **already renders
`byteIdentical` as a pass/fail colour**, fed by a stub. This is the highest
AD-17 risk point in the package. P13-B-07 must call
`assertAd17ConstraintPreserved` and add a UI17 guard test.

### 5.2 Recorded scoping note

`frontend/src/features/screener/Screener.tsx` currently imports
`fetchDecisionMatrixData` and is **not a genuine screener**. P13-B-05 is
therefore the program's **first genuine screener implementation**, not a
transport rebinding, and should be planned as new build.

---

## 6. WHAT THIS ACT DOES **NOT** DO

| Item | Status |
|---|---|
| P13-B implementation | **AUTHORIZED — NOT YET PERFORMED** |
| P13-B acceptance | ⛔ **NOT PERFORMED** (reserved to A3 Sai, separate act) |
| Certification of any kind | ⛔ **NOT GRANTED** |
| UI05 certification | ⛔ **NOT GRANTED** — UI05 *implementation* is **NOT** UI05 *certification* |
| C6 / C7 certification scope | **UNCHANGED** — P12 API/DTO Gate scope ONLY, not broadened |
| Production authorization / activation | ⛔ **NOT GRANTED** |
| P13 / P14 / P15 / P16 reopening | ⛔ **NOT AUTHORIZED** |
| AD-17 / M-2 remediation | ⛔ **NOT AUTHORIZED** — preserved unresolved |
| Evidence re-anchoring (`510b453` / `2f131d9`) | ⛔ **NOT AUTHORIZED** — separate act |
| UI10 Collaboration implementation | ⛔ **NOT AUTHORIZED** — deferred |
| P00–P16 status | **UNCHANGED** |
| Source code | **UNMODIFIED by this act** |

**Implementation authorization does not constitute certification, acceptance,
or production authorization.** These remain distinct acts and are not
collapsed by this record.

---

## 7. ACCEPTANCE PATH

The ordered remaining sequence for P13-B is:

1. **Implementation** of P13-B-01…-09 (authorized by this record).
2. **Evidence production** demonstrating the §5 boundaries held.
3. **P13-B gate acceptance** by A3 **Sai** (D53) — a separate act.

Certification and production authorization are **not** on this path and
require further, separate authority acts.

---

## 8. SCOPE OF THIS RECORD

This act **records and executes the authority decision only.**
**It does NOT implement P13-B.** No source file is modified by this record.

---

**Recorded by:** Program Authority
**Baseline:** `bff5ada4bd32a098526a1602073f9fb40c32488c`
**Artifact:** `docs/D54_P13B_IMPLEMENTATION_AUTHORIZATION.md`
