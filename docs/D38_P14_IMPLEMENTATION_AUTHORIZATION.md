# D38 — P14 Implementation Authorization

**Program Authority Act — F-4: P14 Implementation Authorization**

| Field | Value |
|---|---|
| **Record** | **D38** |
| **Act** | F-4 — P14 implementation authorization |
| **Authority** | **Program Authority** — explicit authorization |
| **Date** | 2026-09-13 |
| **Baseline** | `d107c41dc9a2293f6f55d48fc353ab4664a2a7b8` (D37 + P00–P13 durable baseline) |
| **Decision** | **P14 IMPLEMENTATION = AUTHORIZED** |

---

## 0. Authorization Statement

> # ✅ **P14 IMPLEMENTATION AUTHORIZED**
>
> **Scope: P14 gate only. Six formally defined work items (P14-01 through P14-06).**
> **A3: Sai — P14 acceptance only, P14 gate only.**

The Program Authority authorizes P14 implementation, strictly limited to the P14 gate and the six formally defined P14 work items.

---

## 1. Authorized Implementation Scope

### 1.1 P14 Purpose

UX/visual/browser gate — harden UX and qualify against screenshot targets.

### 1.2 P14 Scope

- Parity evidence
- Accessibility
- No fabricated provenance

### 1.3 Special Gate

Non-regression oracle gate — Part 11 M.4.

### 1.4 Reference Artifact

INT-017 — reference screenshot (`word/media/image1.png` embedded in the new-program SPEC). Disposition: **REUSE / reference only**.

⚠ The reference screenshot defines target product surface coverage; it does not authorize a visual-only rebuild. **Functional parity governs over pixel similarity.**

---

## 2. Authorized Work Items

| ID | Name | Objective |
|---|---|---|
| **P14-01** | Provenance Integrity Validation | Verify all P13 UI surfaces preserve governed provenance and do not fabricate data |
| **P14-02** | Visual Parity Baseline Establishment | Establish visual parity baseline from INT-017 reference screenshot and P13 UI surfaces |
| **P14-03** | Visual Parity Qualification | Qualify P13 UI surfaces against visual parity baseline (P14-02) |
| **P14-04** | Accessibility Conformance Validation | Validate P13 UI surfaces for accessibility conformance |
| **P14-05** | Browser Compatibility Qualification | Qualify P13 UI surfaces for browser compatibility |
| **P14-06** | Non-Regression Oracle Gate Validation | Validate P13 UI surfaces against non-regression oracle gate (Part 11 M.4) |

Work-item definitions are authoritative per **D36** (`df73d3e`). Implementation must preserve the six work-item definitions and their boundaries.

### Critical Path

```
P14-01 → P14-02 → P14-03 → P14-04 → P14-05 → P14-06
                        ↓
              (P14-04 and P14-05 may parallelize after P14-03)
```

---

## 3. Prerequisites Considered

| Prerequisite | Status | Source |
|---|---|---|
| P14 entry authorization | ✅ AUTHORIZED | D35 (`1492808`) |
| P14 work items defined | ✅ DEFINED (P14-01 through P14-06) | D36 (`df73d3e`) |
| P14 A3 designated | ✅ DESIGNATED: Sai (P14 acceptance only) | D37 (`d107c41`) |
| P13 acceptance | ✅ ACCEPTED by Sai (P13 gate only) | P13 acceptance record |
| P12 certification | ✅ CERTIFIED (C6, C7 within P12 scope) | P12 certification record |
| P11 certification | ✅ CERTIFIED (C1, C2 within P11 scope) | P11 certification record |
| P10 certification | ✅ CERTIFIED (C3, C8 within P10 scope) | P10 certification record |
| P09 certification | ✅ CERTIFIED (C3, C4, C8, C11 within D03 scope) | P09 certification record |
| Repository synchronized | ✅ Local HEAD = Remote HEAD | `d107c41` |
| Regression status | ✅ No new failures (6 pre-existing P05/P08 stale assertions) | Full suite |

All prerequisites for P14 implementation authorization are satisfied.

---

## 4. A3 Designation (Preserved from D37)

| Field | Value |
|---|---|
| **Designated A3** | **Sai** |
| **Authority scope** | P14 acceptance only |
| **Gate scope** | P14 gate only |
| **Decision authority** | Program Authority (explicit designation via D37) |

⚠ **A3 Sai's acceptance decision occurs ONLY after implementation evidence is complete and a separate F-5 acceptance act is authorized/performed.** This implementation authorization does NOT constitute acceptance authorization.

---

## 5. Implementation Rules

The following rules govern P14 implementation:

1. **Inspect D35, D36, and D37** before implementation begins.
2. **Preserve** the six P14 work-item definitions and their boundaries (D36).
3. **Define/create** the required P14-specific oracle/tooling as part of implementation where permitted by D36.
4. **Preserve the distinction** between:
   - Reference screenshot vs. authoritative product evidence
   - Visual parity evidence vs. acceptance
   - Accessibility qualification vs. certification
   - Browser qualification vs. production authorization
   - Non-regression testing vs. authority certification
5. **Do not fabricate** screenshot, provenance, accessibility, browser, or oracle evidence.
6. **Do not claim P14 completion** merely because tooling is created.
7. **Do not perform P14 acceptance.** Sai's A3 acceptance decision occurs only after implementation evidence is complete and a separate F-5 act is authorized/performed.
8. **Do not perform P14 certification.**
9. **Do not authorize production.**

---

## 6. Explicit Authority Exclusions

This implementation authorization does **NOT**:

| Exclusion | Status |
|---|---|
| Authorize production activation | ⛔ NOT AUTHORIZED |
| Authorize P14 acceptance | ⛔ NOT AUTHORIZED (requires F-5) |
| Authorize P14 certification | ⛔ NOT AUTHORIZED (not required) |
| Certify any capability | ⛔ NO CERTIFICATION GRANTED |
| Alter P09 certification scope | ✅ PRESERVED (C3/C4/C8/C11 within D03 only) |
| Alter P10 certification scope | ✅ PRESERVED (C3/C8 within D06–D09 only) |
| Alter P11 certification scope | ✅ PRESERVED (C1/C2 within Engine Integration only) |
| Alter P12 certification scope | ✅ PRESERVED (C6/C7 within API/DTO Gate only) |
| Alter P13 acceptance | ✅ PRESERVED (ACCEPTED by Sai, P13 gate only) |
| Alter P13 certification status | ✅ PRESERVED (NONE) |
| Alter P01 canonical contracts | ✅ UNCHANGED |
| Alter P04 identity authority | ✅ UNCHANGED |
| Alter Existing-IIPS methodology/scoring/calibration/taxonomy | ✅ UNCHANGED |
| Resolve AD-4 | ✅ DEFERRED to P15 |
| Resolve AD-17/M-2 | ✅ UNRESOLVED (external authority) |
| Unblock C12 | ✅ BLOCKED |
| Claim M-6 retention enforcement | ✅ NOT CLAIMED |
| Claim replay reproducibility | ✅ NOT CLAIMED |
| Authorize P15 | ⛔ NOT AUTHORIZED |
| Authorize P16 | ⛔ NOT AUTHORIZED |
| Authorize P17 | ⛔ NOT AUTHORIZED |

---

## 7. Relationship to Prior Artifacts

| Artifact | Relationship |
|---|---|
| **D35** (P14 Entry Authorization) | Prerequisite: P14 entry AUTHORIZED. ✅ Satisfied. |
| **D36** (P14 Work-Item Definition) | Prerequisite: P14 work items DEFINED. ✅ Satisfied. Authoritative work-item scope. |
| **D37** (P14 A3 Designation) | Prerequisite: P14 A3 DESIGNATED. ✅ Satisfied. A3 = Sai (acceptance only). |
| **D38** (this artifact) | Authorizes P14 implementation within D36 scope. Does not alter D35, D36, or D37. |

D38 is **additive** to D35, D36, and D37. It does not modify, supersede, or revoke any prior artifact.

---

## 8. Deferred and Open Conditions (Preserved)

| Condition | Status | Resolution Gate |
|---|---|---|
| AD-4 revalidation | DEFERRED | P15 |
| AD-17/M-2 | UNRESOLVED (external authority) | P15 / external |
| Replay reproducibility | NOT CLAIMED | P15 / external |
| C12 (data-plane security) | BLOCKED | External |
| M-6 retention enforcement | NOT CLAIMED | P17 / external |
| OI-05 | OPEN | Housekeeping |
| Stale P05/P08 assertions (6) | PRE-EXISTING / NON-BLOCKING | Housekeeping |

---

## 9. Authority State After This Act

| Item | Status |
|---|---|
| **P13** | ACCEPTED by Sai (P13 gate only) |
| **P13 certification** | NONE |
| **P14 entry** | ✅ AUTHORIZED (D35) |
| **P14 work items** | ✅ DEFINED (D36) |
| **P14 A3** | ✅ DESIGNATED: Sai (D37) |
| **P14 implementation** | ✅ **AUTHORIZED** (this act) |
| **P14 acceptance** | ⛔ NOT PERFORMED |
| **P14 certification** | NONE (not required) |
| **P15–P17** | ⛔ NOT AUTHORIZED |
| **Production** | ⛔ NOT AUTHORIZED |

---

## 10. Resulting Authority Chain

```
Program Authority
  └─► D35: P14 entry AUTHORIZED
  └─► D36: P14 work items DEFINED (P14-01 through P14-06)
  └─► D37: P14 A3 DESIGNATED (Sai, P14 gate only)
  └─► D38: P14 implementation AUTHORIZED (this act)
        └─► P14 implementation proceeds (P14-01 through P14-06)
        └─► Awaits F-5: P14 acceptance (A3 Sai, after implementation)
```

---

## 11. Next Acts

| Act | Description | Authority |
|---|---|---|
| **P14 implementation** | Implement P14 work items P14-01 through P14-06 | Implementation authority (authorized by this act) |
| **F-5** | P14 acceptance | A3 Sai (after implementation complete) |

**Next act**: P14 implementation (P14-01 through P14-06), authorized by this act.

---

**D38 — P14 IMPLEMENTATION AUTHORIZED. AUTHORIZED by Program Authority (explicit). Scope = P14 gate only, six work items (P14-01 through P14-06). A3 = Sai (acceptance only). P14 acceptance = NOT PERFORMED. Production = NOT AUTHORIZED.**
