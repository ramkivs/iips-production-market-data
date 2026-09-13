# D44 — External Remediation Authorization

---

## Authority Decision

| Field | Value |
|---|---|
| **Decision** | **A) AUTHORIZE EXTERNAL REMEDIATION** |
| **Authority / Actor** | **Program Authority** (Sai / Ramki) |
| **Date** | 2026-09-13 |
| **Source** | D41 External Remediation Work Request (commit `a604c5c`) |
| **Binding basis** | D40 P15 External Blocker Disposition (commit `989b750`) |
| **Decision type** | External remediation execution authorization |

---

## Exact Decision

**EXTERNAL REMEDIATION IS AUTHORIZED** for execution in the Existing-IIPS external repository.

The Existing-IIPS program owner is authorized to execute the remediation work defined by D41 in the external repository `ramkivs/iips-review-recovered`.

---

## Scope

| Field | Value |
|---|---|
| **Authorized scope** | D41 workstreams A, B, and C only |
| **External repository** | `ramkivs/iips-review-recovered` |
| **Internal repository** | NOT MODIFIED by this act |

---

## Workstream Authorizations

### Workstream A: M-1 / AD-4

| Field | Value |
|---|---|
| **Remediation** | ✅ **AUTHORIZED** |
| **Closure certified?** | ⛔ **NO** — closure NOT certified by this act |
| **Required** | ENGINE_FACTORY 13-engine repair, validation, evidence, authority acceptance |
| **Evidence return** | Required — must return to this program for separate review/acceptance |

### Workstream B: E2E-030 Revalidation

| Field | Value |
|---|---|
| **Revalidation** | ✅ **AUTHORIZED** |
| **Closure certified?** | ⛔ **NO** — closure NOT certified by this act |
| **Required** | E2E-030 re-execution after M-1 closure, validation, evidence, authority acceptance |
| **Evidence return** | Required — must return to this program for separate review/acceptance |

### Workstream C: AD-17 / M-2 ReplayService Remediation

| Field | Value |
|---|---|
| **Remediation** | ✅ **AUTHORIZED** |
| **Closure certified?** | ⛔ **NO** — closure NOT certified by this act |
| **Required** | ReplayService recomputation repair, validation, evidence, authority acceptance |
| **Evidence return** | Required — must return to this program for separate review/acceptance |

---

## Explicit Separation

```
EXTERNAL EXECUTION AUTHORIZED          ← This act (D44)
          ≠
INTERNAL BLOCKER RESOLUTION ACCEPTED   ← Requires separate Program Authority act
          ≠
D40 LIFTED                             ← Requires separate Program Authority act
          ≠
P15 ENTRY AUTHORIZED                   ← Requires separate Program Authority act
          ≠
PRODUCTION ACTIVATED                   ← Requires P15 completion + separate act
```

Each transition requires its own explicit authority act. No transition is implied, inferred, or automatic.

---

## Preserved Authority State

### D40 Remains Binding

| Item | Status | Change |
|---|---|---|
| **D40** | ⛔ **BINDING** | **NONE** |
| **P15 entry** | ⛔ **ENTRY-BLOCKED** | **NONE** |
| **P15 implementation** | ⛔ **NOT AUTHORIZED** | **NONE** |
| **P15 acceptance** | ⛔ **NOT PERFORMED** | **NONE** |
| **P15 certification** | ⛔ **NONE** | **NONE** |
| **Production activation** | ⛔ **NOT AUTHORIZED** | **NONE** |

### Blocker Status

| Blocker | Status | Change |
|---|---|---|
| **M-1 / AD-4** | ⛔ UNRESOLVED — remediation authorized, closure NOT certified | **NONE** (execution not yet performed) |
| **E2E-030** | ⛔ REVALIDATION REQUIRED — authorized, closure NOT certified | **NONE** (execution not yet performed) |
| **AD-17 / M-2** | ⛔ UNRESOLVED — remediation authorized, closure NOT certified | **NONE** (execution not yet performed) |

---

## Evidence Return Requirement

When external remediation is complete, the Existing-IIPS program must return:

| # | Deliverable | Workstream |
|---|---|---|
| 1 | M-1 closure record with evidence (E-A1 through E-A4) | A |
| 2 | E2E-030 revalidation/closure record with evidence (E-B1 through E-B4) | B |
| 3 | AD-17/M-2 resolution/closure record with evidence (E-C1 through E-C4) | C |
| 4 | Durable commit SHAs for all three closures | All |
| 5 | Existing-IIPS Program Authority acceptance decisions | All |

### Post-Return Process

| Step | Action | Authority |
|---|---|---|
| 1 | **Import** — Evidence imported into this repository | Program Authority |
| 2 | **Review** — Evidence reviewed against D41 closure criteria | Program Authority |
| 3 | **Accept** — Program Authority issues acceptance decision | Program Authority |
| 4 | **Reconsider** — Program Authority reconsiders D40 and P15 entry | Program Authority |

**Until all four steps are complete, P15 remains ENTRY-BLOCKED under D40.**

---

## What This Act Does and Does Not Do

| This act DOES | This act does NOT |
|---|---|
| ✅ Authorize external implementation in `ramkivs/iips-review-recovered` | ❌ Authorize P15 entry |
| ✅ Authorize external validation and evidence generation | ❌ Authorize P15 implementation |
| ✅ Authorize external remediation commits and closure artifacts | ❌ Authorize P15 certification |
| ✅ Authorize external authority acceptance decisions | ❌ Authorize production activation |
| ✅ Require evidence return for internal review | ❌ Certify M-1/AD-4 as resolved |
| ✅ Define the post-return review process | ❌ Certify E2E-030 as revalidated |
| | ❌ Certify AD-17/M-2 as resolved |
| | ❌ Lift D40 |
| | ❌ Change any internal authority state |
| | ❌ Modify any source code in this repository |

---

## No Implementation Statement

| Statement | Value |
|---|---|
| **Implementation occurred?** | **NO** — no source code, tracker, or artifact was modified by this act (other than this record) |
| **External remediation executed?** | **NO** — this act authorizes but does not execute |
| **External repository modified?** | **NO** — not modified by this act |
| **P15 work items created?** | **NO** |
| **P15 A3 designated?** | **NO** |
| **Any authority boundary changed?** | **NO** — all boundaries preserved |

---

## Final Authority State

| Item | Status |
|---|---|
| **D40** | ⛔ BINDING — P15 ENTRY-BLOCKED MAINTAINED |
| **D41** | ✅ DURABLE — external remediation work request (commit `a604c5c`) |
| **D44** | ✅ **AUTHORIZED** — external remediation execution permitted (this act) |
| **P15 entry** | ⛔ ENTRY-BLOCKED |
| **P15 implementation** | ⛔ NOT AUTHORIZED |
| **P15 certification** | ⛔ NONE |
| **P16–P17** | ⛔ NOT AUTHORIZED |
| **Production** | ⛔ NOT AUTHORIZED |
| **M-1 / AD-4** | ⛔ UNRESOLVED — external remediation authorized, closure NOT certified |
| **E2E-030** | ⛔ REVALIDATION REQUIRED — external remediation authorized, closure NOT certified |
| **AD-17 / M-2** | ⛔ UNRESOLVED — external remediation authorized, closure NOT certified |

---

**External remediation authorized. D40 binding. P15 ENTRY-BLOCKED. No internal implementation. No authority boundaries changed.**
