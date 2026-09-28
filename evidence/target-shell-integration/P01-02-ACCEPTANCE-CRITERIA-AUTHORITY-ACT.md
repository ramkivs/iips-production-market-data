# Institutional Investment Platform System (IIPS)
# P01-02 — ACCEPTANCE CRITERIA AUTHORITY ACT

**Act ID:** `p01-02-acceptance-criteria-authority-act-2026-09-28-001`
**Act Type:** GOVERNANCE-AUTHORITY-ACT / ACCEPTANCE-CRITERIA-AUTHORITY-ESTABLISHMENT
(**authority only — NOT an implementation, NOT a test execution, NOT an acceptance, NOT an A3
designation, NOT a certification-scope determination, NOT a certification, NOT an integration,
NOT a production authorization, NOT a Dhan/NSE activation**)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01 / P00 phase-gate model
**Program Authority:** **RAMKI** (Designating Authority / Authority Holder)
**Recording Agent:** Arena (recording only)
**Recorded At (local, Asia/Calcutta):** 2026-09-28
**Repository / Branch:** `ramkivs/iips-production-market-data` /
`arena/01a0e6d9-iips-production-market-data`

---

## 0. ANTECEDENT AND AUTHORIZATION

This act establishes the P01-02 acceptance-criteria authority identified as missing by the gate
`P01-02 — TIMESTAMP / AS-OF SEMANTICS — SEPARATE GOVERNED EXECUTION GATE`, which returned
**C. AUTHORITY DESIGNATION REQUIRED** (execution authority established; acceptance-criteria
authority, A3 acceptance authority, and certification scope not established; no P01-02
implementation or evidence existing; no mutation performed).

**The Program Authority decision recorded here, verbatim:**

> **I, RAMKI, acting as the established IIPS Program Authority within the bounded governance scope,
> explicitly authorize the following:**
>
> **The Work Tracker may be used as authoritative acceptance-criteria source for P01-02 only,
> provided that the complete P01-02 tracker row is first recovered from the authoritative tracker
> and durably preserved in the governed repository record before that tracker authority is treated
> as operative.**

This authorization is **explicitly limited to P01-02**, limited to **acceptance-criteria
authority**, and is **not** general tracker authority, **not** execution authority, **not** A3
acceptance authority, **not** A2 certification authority, **not** production authority, and **not**
integration authority. No authority granted here may be inferred to extend to P01-03, P01-04,
P01-05, P02, or any other work item.

**Condition status: SATISFIED** — see §2 and §3.

---

## 1. DETERMINATION

> # `P01-02 ACCEPTANCE-CRITERIA AUTHORITY ESTABLISHED`

> ## **P01-02 acceptance criteria authority = established for P01-02 only.**

The complete P01-02 tracker row was recovered unambiguously from the authoritative Work Tracker
and is durably preserved. No direct contradiction between any tracker criterion and any
authoritative repository requirement was found.

---

## 2. TRACKER SOURCE

| Field | Value |
|---|---|
| **Exact tracker artifact** | `IIPS_Production_Market_Data_Intelligence_Program_v1.0_TRACKER_INTEGRATION_ALIGNED.xlsx` |
| **Exact sheet** | `Work Tracker` (workbook relationship `rId5`; worksheet part `xl/worksheets/sheet5.xml`) |
| **Exact row** | **Row 7** — `Work ID = P01-02` |
| **Tracker checksum** | **MD5 `f0bd7b970c445f0a06e793256456231f`** — **MATCHES** the pin in `docs/p01/P01_EVIDENCE.md` §1 (`TRACKER checksum \| f0bd7b970c445f0a06e793256456231f \| ...TRACKER_INTEGRATION_ALIGNED.xlsx — read-only`) |
| **Tracker content sha256** | `ad821046a0c6a28558656162bab80e54e4ac7c76725b5129edb8fda4242eda92` |
| **Tracker version / date** | `v1.0 — Requirements / Development Roadmap`; Date `2026-09-08` (Program Overview sheet) |
| **Tracker self-declared status** | `PLANNING SPECIFICATION — NOT AN IMPLEMENTATION AUTHORIZATION` |
| **Git blob** | `6f4abdbceda1e75f12ea22cc0855a87d591f961c` — **identical** on PMD `main`, on candidate `e716bf1f`, and in the working tree; **tracked** at HEAD |
| **Row uniqueness** | `P01-02` occurs **exactly once** in the `Work ID` column. **No duplicate Work IDs exist anywhere in the sheet.** |

**Authorization for this inspection:** the Program Authority authorized inspection of the tracker
for the **sole purpose** of recovering the complete P01-02 row and establishing its
acceptance-criteria authority. No other tracker row was used; the tracker is not treated as
generally authoritative; tracker contents were not used for unrelated work.

---

## 3. COMPLETE PRESERVED ROW (verbatim)

Recovered from `Work Tracker` row 7 and preserved verbatim. **Every field of the row is recorded;
none is paraphrased, silently corrected, or substituted.**

| # | Field | Value (verbatim) |
|---|---|---|
| 1 | **Work ID** | `P01-02` |
| 2 | Phase | `P01` |
| 3 | Area | `Contracts` |
| 4 | Work Item | `Timestamp/as-of semantics` |
| 5 | **Requirement** | `Define event time, received time, publication time, effective time and as-of semantics.` |
| 6 | **Deliverable** | `Time semantics specification` |
| 7 | Dependencies | `P00-02` |
| 8 | Dependency Type | `Hard` |
| 9 | **Entry Criteria** | `Baseline reconciled` |
| 10 | **Exit Criteria** | `All domains mapped to time semantics` |
| 11 | **Test / Validation** | `Contract tests` |
| 12 | **Evidence** | `Time contract` |
| 13 | Authority / Gate | `Phase gate` |
| 14 | Status | `NOT STARTED` |
| 15 | Owner | *(empty in tracker)* |
| 16 | Priority | `High` |
| 17 | Notes | *(empty in tracker)* |
| 18 | Execution Wave | `W1` |
| 19 | Parallel Workstream | `WS-A Governance & Contracts` |
| 20 | Critical Path | `YES` |
| 21 | Parallel With | `—` |
| 22 | Parallelization Notes | `Phase-gate dependency controls entry/exit; no dependency bypass.` |

### 3.1 Durable preservation and cross-validation

The complete row was **already durably preserved** in the governed repository record at
`P01-WAVE1-EXECUTION-AUTHORITY-DESIGNATION-ACT.md` **§4 — "P01-02 TRACKER FACTS (verbatim, re-read
at act time from the authoritative tracker)"** @ `6b7552b642b92c0b783d4c190e409c4ce116e932`.

An independent field-by-field comparison was performed between the tracker row recovered in this
gate and the preserved §4 record:

| Result | Count |
|---|---|
| Non-empty tracker fields | **20** |
| Fields matching exactly | **18 / 18** (all non-empty fields) |
| Fields differing materially | **0** |
| Fields empty in tracker and therefore not transcribed in §4 | 2 (`Owner`, `Notes`) — **nothing lost** |

> **The recovered tracker row 7 and the preserved P01-WAVE1 §4 record agree field-for-field on
> every non-empty field.** The Program Authority's preservation condition is therefore satisfied
> both by the pre-existing governed record and by this act's independent recovery and re-recording.

---

## 4. RECONCILIATION AGAINST INDEPENDENT GOVERNANCE

### 4.A Independently grounded criteria

| Criterion | Tracker value | Independent authoritative grounding |
|---|---|---|
| **Requirement** | `Define event time, received time, publication time, effective time and as-of semantics.` | **SUBSTANTIALLY GROUNDED.** `docs/p01/P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1 defines **six distinct times** covering every term: T1 `asOf` (as-of), T2 `receivedAt` (received), T3 `observationTime` (event), T4 `effectiveTime` (effective), T5 `publicationTime` (publication), T6 `evaluationTime`; §1.1 gives obligations per data class (D01–D10). Also preserved verbatim in `P01-WAVE1` §9. |
| **Deliverable** | `Time semantics specification` | **GROUNDED.** `docs/p01/P01_EVIDENCE.md:58` — *"`P01-02` Timestamp/as-of semantics \| "Time semantics specification" \| `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1–3"*; `docs/p01/P01_GATE_ACCEPTANCE.md:53` criterion 4 **PASS** — *"Timestamp, currency, unit, precision semantics explicit"*. Also preserved verbatim in `P01-WAVE1` §11. |
| **Entry Criteria** | `Baseline reconciled` | **GROUNDED IN SUBSTANCE.** Dependency `P00-02` (Hard) is **SATISFIED** by `P00-02-BASELINE-RECONCILIATION-ACCEPTANCE-ACT.md` @ `2d3c9718b80b6c92d9e333733604e83fc261ac2e` — *"P00-02 ACCEPTED / EXIT CONDITION = SATISFIED / BASELINE AND GAPS = RECORDED"*. Also preserved verbatim in `P01-WAVE1` §4. |
| **Test / Validation** | `Contract tests` | **PARTIALLY GROUNDED.** The *concept* appears in `docs/p01/P01_VALIDATION_RULES.md` §9 as a *specified obligation (tracker `P01-02`)* — but as an **acceptance criterion** it is tracker-only. Preserved verbatim in `P01-WAVE1` §11. |

### 4.B Tracker-only criteria

| Criterion | Tracker value | Note |
|---|---|---|
| **Exit Criteria** | `All domains mapped to time semantics` | **TRACKER-ONLY.** No independent repository record states this exit condition. It is, however, preserved verbatim in `P01-WAVE1` §12, and is **substantively consistent** with `P01_TIMESTAMP_CURRENCY_UNIT_RULES.md` §1.1, which maps obligations across data classes D01–D10. |
| **Evidence** | `Time contract` | **TRACKER-ONLY.** No independent repository source names a "Time contract" as P01-02 evidence. Preserved verbatim in `P01-WAVE1` §11. |
| **Test / Validation** | `Contract tests` | **TRACKER-ONLY as an acceptance criterion** (see 4.A). |

**Additional tracker fields** (`Dependencies`, `Dependency Type`, `Authority / Gate`, `Status`,
`Owner`, `Priority`, `Notes`, `Execution Wave`, `Parallel Workstream`, `Critical Path`,
`Parallel With`, `Parallelization Notes`) are **scheduling, dependency and authority fields**, not
acceptance criteria. They are preserved in §3 for completeness and are **not** authorized as
acceptance criteria by this act.

### 4.C Contradictions

> ### **NONE FOUND.**

| Checked against | Finding |
|---|---|
| `docs/p01/P01_VALIDATION_RULES.md` §9 | *"Contract tests for identifiers, **time**, mode, provenance \| Specified obligation (tracker `P01-01`, `-02`, `-04`, `-05`) \| **Specified — not executed** (implementation prohibited in P01)"* — **explicitly acknowledges the tracker P01-02 criterion** and records the artifact's production status. Consistent, not contradictory. |
| `docs/p01/P01_EVIDENCE.md` §3 | *"the tracker also names … "Contract tests" as gate artifacts. These are **executable/implementation artifacts**; `D4_12_PHASE_SEQUENCE.md:25` places P01 under the standing prohibition "implementation prohibited". They are therefore **specified as obligations** in `P01_VALIDATION_RULES.md` §9 and registered as **DEP-P01-07**, and **not produced**."* — acknowledges the criterion and records the deferral. Consistent, not contradictory. |
| `docs/p01/P01_GATE_ACCEPTANCE.md` | criterion 4 **PASS** confirms timestamp semantics are explicit; no competing exit or evidence criterion is stated. |
| `P01-WAVE1` §4/§9/§11/§12 | Preserves the row verbatim and states *"No technical acceptance criteria beyond the tracker are invented by this act."* |
| `Dependency Matrix` sheet | P01-02 row: *"P01-02 \| P01 \| P00-02 \| Hard \| YES \| Timestamp/as-of semantics must be stable before dependent work can be certified."* — **consistent** with the Work Tracker row (Dependencies `P00-02`, Type `Hard`). Not a competing acceptance row. |
| `docs/p00/P00_GATE_MODEL.md`, `D7`, `D8` | No record states a different P01-02 acceptance criterion. |

**No authoritative record directly conflicts with any tracker criterion. No contradiction is
resolved by preference; none required resolution.**

### 4.D Deferred obligations — distinction preserved

| Concept | Status |
|---|---|
| **P01-02 acceptance criteria** | **ESTABLISHED by this act** (the six criteria in §3) |
| **P01-02 implementation** | **NOT STARTED** — no P01-02 source, test, or fixture exists anywhere in the four-repository universe |
| **DEP-P01-07 deferred contract-test execution (time-scoped portion)** | **REMAINS OUTSTANDING** — routed to **P05/P06 execution + P15** per `P01_DEPENDENCY_REGISTER.md`. **NOT discharged by this act.** |
| **Later P05/P06/P15 obligations** | **UNCHANGED** — this act neither creates nor discharges them |

Recording these criteria **does not** discharge the deferred obligation. The identifier-scoped
portion of DEP-P01-07 was previously recognized as satisfied for **P01-01** only; the
**time-scoped portion remains outstanding** and is unaffected.

---

## 5. AUTHORITY BOUNDARY

> ## `P01-02 acceptance-criteria authority = established for P01-02 only`

1. **Scope.** This authorization applies to the **P01-02 acceptance determination only**.
2. **No general tracker authority.** This act does **not** establish general tracker authority for
   IIPS, for any other work item, phase, row, sheet, or tracker. Every future use of a tracker as
   authority requires its own explicit Program Authority authorization.
3. **No extension to other work items.** Nothing here extends to **P01-01, P01-03, P01-04, P01-05,
   P02, or any other item**. P01-01's criteria authority rests on its own separate act @ `7eec2d1`
   and is unaffected.
4. **Criteria are authorized, not authored.** The six criteria are the authorized tracker row's
   wording, elevated to authority by the Program Authorization decision in §0. No wording was
   invented, paraphrased, narrowed, or broadened.
5. **Criterion classes distinguished:** C1 Requirement · C2 Deliverable · C3 Test/Validation ·
   C4 Evidence · C5 Exit Criteria · C6 Entry Criteria.

---

## 6. EXPLICIT SEPARATIONS — NOT ESTABLISHED BY THIS GATE

| Authority | Status |
|---|---|
| **Execution authority** | **ALREADY ESTABLISHED, separately** — `P01-WAVE1-EXECUTION-AUTHORITY-DESIGNATION-ACT.md` @ `6b7552b` (§5 holder decision option C; §9 names P01-02). This act does **not** extend, modify, or reinterpret it. |
| **A3 acceptance authority** | **`P01-02 A3 authority = NOT ESTABLISHED BY THIS GATE`** |
| **A2 certification authority** | **NOT ESTABLISHED BY THIS GATE** |
| **Certification scope** | **`P01-02 certification scope = NOT DETERMINED BY THIS GATE`** |
| **Implementation / acceptance / certification / integration / production** | **NOT PERFORMED, NOT AUTHORIZED** |

> ## `P01-02 A3 authority = NOT ESTABLISHED BY THIS GATE`
>
> ## `P01-02 certification scope = NOT DETERMINED BY THIS GATE`

**No acceptor is named, selected, or inferred.** SAI's designation as P01-01 A3 acceptor is
bounded to P01-01 and does **not** transfer. No acceptor may be inferred from authorship,
repository ownership, execution authority, or Program Authority. Per `D7_AUTHORITY_ROLE_ASSIGNMENT.md`:
*"No individual names are recorded. None may be inferred."*

**The P01-01 disposition `ACCEPTANCE-GOVERNED ONLY / NOT CERTIFICATION-BEARING` is an explicit
Program Authority determination bounded to P01-01 and is NOT transferred to P01-02.** P01-02
certification scope is a separate subsequent governed gate.

---

## 7. LIMITATIONS AND UNRESOLVED PORTIONS (recorded, not resolved)

1. **The tracker artifact itself is external to this repository's governance authority.** Its MD5
   matches the governance pin in `P01_EVIDENCE.md` §1 and its git blob is identical across `main`
   and the candidate lineage, but the tracker remains a **planning specification**
   (`PLANNING SPECIFICATION — NOT AN IMPLEMENTATION AUTHORIZATION`), elevated to authority **only**
   for the bounded P01-02 acceptance-criteria purpose by the Program Authority decision in §0.
2. **Two of the six criteria (Exit Criteria, Evidence) are tracker-only** with no independent
   repository grounding. They are authorized by the Program Authority decision, not by independent
   evidence. This is recorded rather than concealed.
3. **The time-scoped DEP-P01-07 obligation remains outstanding.** No P01-02 contract tests or time
   contract artifact exist. Whether the P01-02 acceptance criteria can be satisfied is **not**
   determined here — only the authority basis for the criteria is established.
4. **P01-02 certification scope is unresolved** and is deliberately not decided in this gate.

---

## 8. SINGLE-ARTIFACT ATTESTATION

This is the **only artifact created by this act**. No source, test, fixture, P01-01 artifact,
P01-WAVE1 execution-authority act, P01 certification record, D4/D7/D8 certification framework
record, tracker record, or unrelated governance record was created, modified, renamed, deleted, or
regenerated in this pass.

---

## 9. REPOSITORY INTEGRITY VERIFICATION

| Check | Result |
|---|---|
| PMD `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` — **UNCHANGED** ✓ |
| P01-01 acceptance @ `9c9e606d` | **INTACT** ✓ |
| P01-01 criteria-authority @ `7eec2d1` | **INTACT** ✓ |
| P01-01 re-exercise @ `412b2638` | **INTACT** ✓ |
| P01-01 A3 designation @ `4dda3edd` | **INTACT** ✓ |
| P01-01 cert-scope determination @ `54ecee0` | **INTACT** ✓ |
| P01-WAVE1 execution authority @ `6b7552b` | blob `1bfa9eff…` — **INTACT** ✓ |
| Tracker file | blob `6f4abdbc…` — **UNMODIFIED** (read-only) ✓ |
| Source / tests / fixtures | **UNCHANGED** ✓ |
| P01 package records (`docs/p01/**`) | **UNCHANGED** ✓ |
| `D4_12` / `D4_11` / `D7` / `D8` | **UNCHANGED** ✓ |
| Frozen trees | `9080e997` / `0062ad52` / `8491efdc` / `1597ed06` — **UNCHANGED** ✓ |
| Unauthorized diff count | **0** ✓ |

---

## 10. NEXT GOVERNED GATE

> ## `P01-02 A3 ACCEPTANCE-AUTHORITY DESIGNATION`

**Not performed in this execution.** That gate must remain a separate act and must designate a
P01-02-specific acceptor on explicit Program Authority authority — no acceptor may be inferred.

---

**Authority attestation:** Established and recorded by **RAMKI**, Program Authority, under the
explicit bounded authorization recorded in §0, after the complete P01-02 tracker row was recovered
unambiguously from the authoritative Work Tracker (MD5-verified against the governance pin) and
cross-validated field-for-field against the pre-existing governed preservation in `P01-WAVE1` §4.
This act establishes **acceptance-criteria authority for P01-02 only**. It creates no A3 authority,
no A2 authority, no certification scope, no implementation, no acceptance, no certification, no
integration, and no production authorization. Tracker-only criteria are recorded as such rather
than presented as independently grounded, and the time-scoped DEP-P01-07 obligation is expressly
left outstanding.
