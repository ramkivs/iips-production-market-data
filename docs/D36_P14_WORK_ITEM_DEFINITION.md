# D36 — P14 Work-Item Definition

**Tracker Change Authority Act — F-2: P14 Work-Item Definition**

| Field | Value |
|---|---|
| **Record** | **D36** |
| **Act** | F-2 — P14 work-item definition |
| **Authority** | **Tracker Change Authority** — explicit definition act |
| **Date** | 2026-09-12 |
| **Baseline** | `14928087cdd5041ed152c2b237a0202011b4fd32` (D35 + P00–P13 durable baseline) |
| **Decision** | **P14 WORK ITEMS DEFINED** |

---

## 0. Definition Statement

> # ✅ **P14 WORK ITEMS DEFINED**
>
> **Six work items (P14-01 through P14-06) formally defined.**
> **This definition does NOT authorize P14 implementation.**

---

## 1. Authoritative P14 Scope (Preserved from Repository)

| Aspect | Content | Source |
|---|---|---|
| **Purpose** | UX/visual/browser gate — Harden UX; qualify against screenshot targets | `P00_GATE_MODEL.md`:51 |
| **Exit criteria** | Parity evidence; accessibility; no fabricated provenance | `P00_GATE_MODEL.md`:51 |
| **Dependencies** | P13 (sole hard dependency, satisfied) | `P00_GATE_MODEL.md`:51; `D4_12`:38 |
| **Special gate** | Non-regression oracle gate (Part 11 M.4) | `D4_12`:38 |
| **Certification before progression** | No | `P00_GATE_MODEL.md`:51 |
| **Reference artifact** | INT-017 — reference screenshot (REUSE, reference only) | `D4_01_INTEGRATION_REUSE_BASELINE.md` |

---

## 2. P14 Work Items

### P14-01: Provenance Integrity Validation

| Field | Value |
|---|---|
| **Work-item ID** | **P14-01** |
| **Name** | Provenance Integrity Validation |
| **Objective** | Verify all P13 UI surfaces preserve governed provenance and do not fabricate data |
| **Scope** | Validate U1–U10 cross-surface rules enforcement in P13 UI integration |
| **Inputs/dependencies** | P13 ACCEPTED; P13 source (8 modules, 85 tests); P12 C6/C7 certified contracts |
| **Expected artifact/evidence** | Provenance integrity test suite; violation report; U1–U10 enforcement evidence |
| **Validation method** | Automated test execution against P13 UI surfaces; manual review of provenance classification |
| **Completion criteria** | All P13 surfaces pass provenance integrity tests; zero fabricated provenance violations; U1–U10 rules enforced |
| **Authority owner** | Program Authority |
| **Requires browser execution** | No (unit/integration tests) |
| **Requires screenshot comparison** | No |
| **Requires accessibility validation** | No |
| **Consumes P12/P13 contracts** | Yes (P12 C6/C7 DTOs; P13 UI surfaces) |
| **Explicit exclusions** | Does not validate visual appearance; does not validate accessibility; does not validate browser compatibility |

---

### P14-02: Visual Parity Baseline Establishment

| Field | Value |
|---|---|
| **Work-item ID** | **P14-02** |
| **Name** | Visual Parity Baseline Establishment |
| **Objective** | Establish visual parity baseline from INT-017 reference screenshot and P13 UI surfaces |
| **Scope** | Extract reference targets; define visual parity criteria; establish golden screenshot set |
| **Inputs/dependencies** | INT-017 reference screenshot (`word/media/image1.png`); P13 UI surfaces; P14-01 completion |
| **Expected artifact/evidence** | Golden screenshot set (P14 UI surfaces); visual parity criteria document; baseline manifest |
| **Validation method** | Manual extraction from INT-017; automated screenshot capture from P13 UI; diff analysis |
| **Completion criteria** | Golden screenshots captured for all 19 P13 UI surfaces; visual parity criteria defined; baseline manifest created |
| **Authority owner** | Program Authority |
| **Requires browser execution** | Yes (screenshot capture) |
| **Requires screenshot comparison** | Yes (baseline establishment) |
| **Requires accessibility validation** | No |
| **Consumes P12/P13 contracts** | Yes (P13 UI surfaces) |
| **Explicit exclusions** | Does not validate against external Existing-IIPS UI; does not claim pixel-perfect match; functional parity governs over pixel similarity (INT-017) |

---

### P14-03: Visual Parity Qualification

| Field | Value |
|---|---|
| **Work-item ID** | **P14-03** |
| **Name** | Visual Parity Qualification |
| **Objective** | Qualify P13 UI surfaces against visual parity baseline (P14-02) |
| **Scope** | Automated visual regression testing; diff analysis; concession recording |
| **Inputs/dependencies** | P14-02 completion; golden screenshot set; P13 UI surfaces |
| **Expected artifact/evidence** | Visual regression test suite; diff reports; concession register (where applicable) |
| **Validation method** | Automated screenshot comparison; pixel diff analysis; manual review of concessions |
| **Completion criteria** | Visual regression tests pass for all 19 P13 UI surfaces; diffs within tolerance; concessions recorded and justified |
| **Authority owner** | Program Authority |
| **Requires browser execution** | Yes (screenshot capture) |
| **Requires screenshot comparison** | Yes (regression testing) |
| **Requires accessibility validation** | No |
| **Consumes P12/P13 contracts** | Yes (P13 UI surfaces) |
| **Explicit exclusions** | Does not validate against external Existing-IIPS UI; does not require pixel-perfect match; functional parity governs |

---

### P14-04: Accessibility Conformance Validation

| Field | Value |
|---|---|
| **Work-item ID** | **P14-04** |
| **Name** | Accessibility Conformance Validation |
| **Objective** | Validate P13 UI surfaces for accessibility conformance |
| **Scope** | WCAG 2.1 AA compliance validation; screen reader testing; keyboard navigation testing |
| **Inputs/dependencies** | P13 UI surfaces; P14-01 completion; accessibility conformance target (TBD by Program Authority) |
| **Expected artifact/evidence** | Accessibility audit report; WCAG 2.1 AA compliance matrix; screen reader test results; keyboard navigation test results |
| **Validation method** | Automated accessibility scanning (e.g., axe-core); manual screen reader testing; keyboard navigation testing |
| **Completion criteria** | WCAG 2.1 AA compliance validated for all 19 P13 UI surfaces; zero critical accessibility violations; screen reader and keyboard navigation tested |
| **Authority owner** | Program Authority |
| **Requires browser execution** | Yes (accessibility testing) |
| **Requires screenshot comparison** | No |
| **Requires accessibility validation** | Yes (primary objective) |
| **Consumes P12/P13 contracts** | Yes (P13 UI surfaces) |
| **Explicit exclusions** | Does not validate WCAG 2.1 AAA; does not validate against external Existing-IIPS UI; accessibility conformance target must be defined by Program Authority before implementation |

---

### P14-05: Browser Compatibility Qualification

| Field | Value |
|---|---|
| **Work-item ID** | **P14-05** |
| **Name** | Browser Compatibility Qualification |
| **Objective** | Qualify P13 UI surfaces for browser compatibility |
| **Scope** | Cross-browser testing; responsive design validation; browser-specific regression testing |
| **Inputs/dependencies** | P13 UI surfaces; P14-01 completion; P14-03 completion; browser compatibility matrix (TBD by Program Authority) |
| **Expected artifact/evidence** | Browser compatibility test matrix; cross-browser test results; responsive design validation report |
| **Validation method** | Automated cross-browser testing (e.g., Playwright, Selenium); manual responsive design testing; browser-specific regression testing |
| **Completion criteria** | Browser compatibility validated for target browsers (TBD); responsive design validated for target breakpoints (TBD); zero critical browser-specific violations |
| **Authority owner** | Program Authority |
| **Requires browser execution** | Yes (primary objective) |
| **Requires screenshot comparison** | Yes (visual regression across browsers) |
| **Requires accessibility validation** | No |
| **Consumes P12/P13 contracts** | Yes (P13 UI surfaces) |
| **Explicit exclusions** | Does not validate against legacy browsers (IE11, etc.); browser compatibility matrix and responsive breakpoints must be defined by Program Authority before implementation |

---

### P14-06: Non-Regression Oracle Gate Validation

| Field | Value |
|---|---|
| **Work-item ID** | **P14-06** |
| **Name** | Non-Regression Oracle Gate Validation |
| **Objective** | Validate P13 UI surfaces against non-regression oracle gate (Part 11 M.4) |
| **Scope** | Oracle definition; non-regression testing; evidence collection; concession recording |
| **Inputs/dependencies** | P14-01 through P14-05 completion; Part 11 M.4 oracle specification (TBD by Program Authority); P13 UI surfaces |
| **Expected artifact/evidence** | Oracle specification document; non-regression test suite; oracle validation report; concession register |
| **Validation method** | Oracle-based testing; non-regression evidence collection; manual review of concessions |
| **Completion criteria** | Oracle specification defined; non-regression tests pass for all 19 P13 UI surfaces; oracle validation report complete; concessions recorded and justified |
| **Authority owner** | Program Authority |
| **Requires browser execution** | Yes (UI validation) |
| **Requires screenshot comparison** | Yes (non-regression evidence) |
| **Requires accessibility validation** | No |
| **Consumes P12/P13 contracts** | Yes (P13 UI surfaces; P12 C6/C7 DTOs) |
| **Explicit exclusions** | Does not validate against external Existing-IIPS UI; does not claim replay reproducibility (AD-17/M-2 UNRESOLVED); Part 11 M.4 oracle specification must be defined by Program Authority before implementation |

---

## 3. Work-Item Dependencies

```
P14-01 (Provenance Integrity)
  ↓
P14-02 (Visual Parity Baseline)
  ↓
P14-03 (Visual Parity Qualification)
  ↓
P14-04 (Accessibility Conformance)
  ↓
P14-05 (Browser Compatibility)
  ↓
P14-06 (Non-Regression Oracle Gate)
```

**Critical path**: P14-01 → P14-02 → P14-03 → P14-04 → P14-05 → P14-06

**Parallelization allowance**: P14-04 and P14-05 can be executed in parallel after P14-03 completion (per Parallel Execution W11).

---

## 4. Oracle / Tooling Definition

| Work Item | Existing Tooling | Tooling to Create | External Evidence | Screenshot Target |
|---|---|---|---|---|
| **P14-01** | P13 test suite (85 tests) | Provenance integrity test suite | None | None |
| **P14-02** | INT-017 reference screenshot | Screenshot capture tooling; baseline manifest generator | INT-017 (`word/media/image1.png`) | Yes (golden screenshots) |
| **P14-03** | None | Visual regression test suite; diff analysis tooling | None | Yes (regression comparison) |
| **P14-04** | None (accessibility scanners TBD) | Accessibility test suite; screen reader test harness | WCAG 2.1 AA specification | No |
| **P14-05** | None (browser testing tools TBD) | Cross-browser test suite; responsive design test harness | Browser compatibility matrix (TBD) | Yes (cross-browser comparison) |
| **P14-06** | None | Oracle specification; non-regression test suite | Part 11 M.4 specification (TBD) | Yes (oracle evidence) |

**Oracle/tooling status**: No P14-specific tooling exists. All tooling must be created as part of P14 implementation.

---

## 5. Governance Boundaries (Preserved)

| Boundary | Status |
|---|---|
| P01 canonical contracts | ✅ UNCHANGED |
| P04 identity authority | ✅ UNCHANGED |
| Existing-IIPS methodology/scoring/calibration/taxonomy | ✅ UNCHANGED |
| P09 certification scope | ✅ PRESERVED (C3/C4/C8/C11 within D03 only) |
| P10 certification scope | ✅ PRESERVED (C3/C8 within D06–D09 only) |
| P11 certification scope | ✅ PRESERVED (C1/C2 within Engine Integration only) |
| P12 certification scope | ✅ PRESERVED (C6/C7 within API/DTO Gate only) |
| P13 acceptance | ✅ PRESERVED (ACCEPTED by Sai, P13 gate only) |
| P13 certification | ✅ PRESERVED (NONE) |
| AD-4 revalidation | ✅ DEFERRED to P15 |
| AD-17/M-2 | ✅ UNRESOLVED (external authority) |
| Replay reproducibility | ✅ NOT CLAIMED |
| C12 (data-plane security) | ✅ BLOCKED |
| M-6 retention enforcement | ✅ NOT CLAIMED |
| Production authorization | ✅ NOT AUTHORIZED |

---

## 6. Implementation Boundary

> # ⚠️ **P14 WORK-ITEM DEFINITION DOES NOT CONSTITUTE P14 IMPLEMENTATION AUTHORIZATION**
>
> **No P14 implementation may begin until a separate Program Authority act (F-4) authorizes it.**

This work-item definition:
- ✅ Defines P14 scope and work items
- ✅ Establishes work-item dependencies and critical path
- ✅ Identifies oracle/tooling requirements
- ⛔ Does NOT authorize P14 implementation
- ⛔ Does NOT designate P14 A3 acceptor
- ⛔ Does NOT authorize P14 acceptance
- ⛔ Does NOT grant P14 certification
- ⛔ Does NOT authorize production activation

---

## 7. Authority State (Preserved)

| Item | Status |
|---|---|
| **P13** | ACCEPTED by A3 Sai (P13 gate only) |
| **P13 certification** | NONE |
| **P14 entry** | ✅ AUTHORIZED (D35) |
| **P14 work items** | ✅ DEFINED (this act) |
| **P14 implementation** | ⛔ NOT AUTHORIZED |
| **P14 acceptance** | ⛔ NOT PERFORMED |
| **P14 certification** | NONE |
| **P15–P17** | ⛔ NOT AUTHORIZED |
| **Production** | ⛔ NOT AUTHORIZED |
| **AD-4** | DEFERRED to P15 |
| **AD-17/M-2** | UNRESOLVED (external authority) |

---

## 8. Required Next Acts

| Act | Description | Authority |
|---|---|---|
| **F-3** | P14 A3 designation | Program Authority |
| **F-4** | P14 implementation authorization | Program Authority |
| **F-5** | P14 acceptance | A3 acceptor |

**Next act**: F-3 (P14 A3 designation) or F-4 (P14 implementation authorization), in either order as determined by Program Authority.

---

## 9. Tracker Update

**Work Tracker status**: P14 work items now formally defined (P14-01 through P14-06).

**Tracker change**: This act adds 6 P14 work items to the program tracker. The tracker now contains 65 work items (59 P00–P13 + 6 P14).

**Auditability**: Work-item definition recorded in D36. No historical P00–P13 status records altered.

---

## 10. Historical Reconciliation

The historical P14 entry assessment at `389b040` identified EB14-2 (no P14 work items) as an entry condition. This act resolves EB14-2 by formally defining 6 P14 work items (P14-01 through P14-06).

| Historical Condition | Status at D36 | Resolution |
|---|---|---|
| **EB14-1**: P13 not accepted | ✅ RESOLVED | P13 ACCEPTED by Sai |
| **EB14-2**: No P14 work items | ✅ RESOLVED | P14 work items defined (this act) |
| **EB14-3**: No UI source/oracle | ⚠ BOUNDED | P13 UI exists; oracle defined in P14-06 |

---

**D36 — P14 WORK ITEMS DEFINED. DEFINED by Tracker Change Authority (explicit). P14 implementation = NOT AUTHORIZED. P14 acceptance = NOT PERFORMED. Production = NOT AUTHORIZED.**
