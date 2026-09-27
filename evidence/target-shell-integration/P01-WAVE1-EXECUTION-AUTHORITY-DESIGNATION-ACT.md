# Institutional Investment Platform System (IIPS)
# P01 WAVE 1 (P01-01 / P01-02) — EXECUTION AUTHORITY DESIGNATION ACT

**Act ID:** `p01-wave1-execution-authority-designation-act-2026-09-27-001`
**Act Type:** AUTHORITY-DESIGNATION-ACT / EXECUTION-AUTHORITY-ESTABLISHMENT (**authority only — NOT an execution, NOT an acceptance act, NOT a certification, NOT an implementation, NOT a tracker status mutation**)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01 / P00 phase-gate model (Work Tracker Production Schedule)
**Inherited Holder Policy:** `NEXT-PRODUCT-SURFACE-AUTHORITY-DESIGNATION-PACKET.md` §0 NON-NEGOTIABLE holder rules + designation-act lineage (Surface-act F-8 / Phase-4 / P00-02 precedence)
**Designated By:** RAMKI (Designating Authority) — explicit authority instruction received for this designation act (recorded verbatim; no holder decision inferred by the Recording Agent)
**Recording Agent:** Arena (recording only)
**Execution Mode:** NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED
**Recorded At (local, Asia/Calcutta):** 2026-09-27
**Repository / Branch (authoritative at act time):** `ramkivs/iips-production-market-data` / `arena/01a0e30c-iips-production-market-data`
**Antecedent checkpoint:** `2d3c9718b80b6c92d9e333733604e83fc261ac2e` (P00-02 ACCEPTANCE AUTHORITY ACT)

---

## 1. AUTHORITY HOLDER

**RAMKI (Designating Authority)** is the established holder for this bounded program governance decision.

## 2. AUTHORITY EVIDENCE (repository-verified; no inference from ownership/authorship/title/implementation)

1. `NEXT-PRODUCT-SURFACE-AUTHORITY-DESIGNATION-PACKET.md` — packet header line 8: **"Authority Holder: RAMKI"** (present in repository; verified at act time; zero competing holder identities found across `evidence/`).
2. `WATCHLISTS-PERSISTENCE-IDENTITY-TRANSPORT-GOVERNANCE-DECISION.md` §8 authority-type row — holder-reserved authority model (RAMKI references verified at `c9f5260`).
3. `P00-02-BASELINE-RECONCILIATION-EXECUTION-AUTHORITY-DESIGNATION-ACT.md` §6 — **"Acceptance authority: RAMKI (Designating Authority)"**; "(a) the executor is a designated recording system; (b) the acceptance authority is separately established and holder-reserved." (1 explicit holder-reserved clause.)
4. `P00-02-BASELINE-RECONCILIATION-ACCEPTANCE-ACT.md` §2 — P00-02 acceptance exercised by the same holder lineage under explicit instruction (7 holder references; acceptance ≠ execution maintained).
5. `OPTIONAL-INTELLIGENCE-PROGRAM-MIGRATION-INVENTORY.md` (INT-001..INT-018) — governance artifact heredoc header: **"Designated By: RAMKI (Designating Authority)"**.

No P13/P14/P15/P16/P17 lane authority, Watchlists authority, or D115 authority is imported into P01 by this act.

## 3. P01-01 TRACKER FACTS (verbatim, re-read at act time from the authoritative tracker)

| Field | Value (verbatim) |
| --- | --- |
| Work ID | P01-01 |
| Phase | P01 |
| Area | Contracts |
| Work Item | Canonical identifiers |
| Requirement | Define instrument/company/portfolio/research/event identifiers and cross-provider mapping semantics. |
| Deliverable | Canonical ID specification |
| Dependencies | P00-02 |
| Dependency Type | Hard |
| Entry Criteria | Baseline reconciled |
| Exit Criteria | IDs versioned and testable |
| Test / Validation | Contract tests |
| Evidence | ID contract + fixtures |
| Authority / Gate | Phase gate |
| Status | NOT STARTED |
| Priority | High |
| Execution Wave | W1 |
| Parallel Workstream | WS-A Governance & Contracts |
| Critical Path | YES |
| Parallel With | — |
| Parallelization Notes | Phase-gate dependency controls entry/exit; no dependency bypass. |

- Dependency `P00-02` (Hard): **SATISFIED** by the accepted P00-02 acceptance act (`2d3c971…`: ACCEPTED / EXIT CONDITION = SATISFIED / BASELINE AND GAPS = RECORDED).
- Entry criterion "Baseline reconciled": **SUPPORTED** by the same act. Supported ≠ started; satisfied ≠ authorized — this act is what establishes execution authority (see §5).

## 4. P01-02 TRACKER FACTS (verbatim, re-read at act time from the authoritative tracker)

| Field | Value (verbatim) |
| --- | --- |
| Work ID | P01-02 |
| Phase | P01 |
| Area | Contracts |
| Work Item | Timestamp/as-of semantics |
| Requirement | Define event time, received time, publication time, effective time and as-of semantics. |
| Deliverable | Time semantics specification |
| Dependencies | P00-02 |
| Dependency Type | Hard |
| Entry Criteria | Baseline reconciled |
| Exit Criteria | All domains mapped to time semantics |
| Test / Validation | Contract tests |
| Evidence | Time contract |
| Authority / Gate | Phase gate |
| Status | NOT STARTED |
| Priority | High |
| Execution Wave | W1 |
| Parallel Workstream | WS-A Governance & Contracts |
| Critical Path | YES |
| Parallel With | — |
| Parallelization Notes | Phase-gate dependency controls entry/exit; no dependency bypass. |

- Dependency `P00-02` (Hard): **SATISFIED** (same evidence as §3).
- Entry criterion "Baseline reconciled": **SUPPORTED** (same evidence as §3).

## 5. EXPLICIT HOLDER DECISION — EXECUTION SCOPE

Recorded verbatim from the holder's instruction for this act: this gate establishes **"the bounded P01 Wave-1 authority"** over the items named in the act title and scope block — **P01-01 / P01-02**.

**HOLDER DECISION = option C: execution authority is designated for BOTH P01-01 AND P01-02, together, as the bounded P01 Wave-1 execution scope.**

No other item is authorized by this decision (see §10).

## 6. EXPLICIT SEQUENCING DECISION

- The tracker specifies **NO ordering** between P01-01 and P01-02 (verified at act time: neither row's Dependencies, "Parallel With", or any other designated column cross-references the other item; row sequence is not an ordering field).
- The holder's instruction for this act designated no sequential ordering, and this act **does not invent ordering**: both items are authorized **independently / without tracker-imposed ordering**.
- Execution discipline: consistent with the program's one-governance-item-per-pass and one-act-one-checkpoint discipline, each item is exercised through **its own separate governed execution gate** (one item per gate, one artifact/checkpoint per gate). Execution order between the two items is **not constrained** by the tracker or by this act.
- This records **non-designation of ordering** as the sequencing decision; it manufactures no schedule.

## 7. DESIGNATED EXECUTOR

**Executor: Arena (Recording Agent)** — designated only within this bounded scope and only under the holder's explicit instruction record for each execution gate (per the repository-established model recorded in the P00-02 designation act §6: executor = "Arena (Recording Agent), acting only under RAMKI's explicit instruction record for that item"; executor = a designated recording system). **The executor does NOT become the acceptance authority by execution** (same record: "acceptance authority is separately established and holder-reserved").

## 8. ACCEPTANCE AUTHORITY STATUS

- P01-01/P01-02 acceptance authority is **NOT** established by this act, and P00-02's acceptance authority does **NOT** automatically transfer to P01 items.
- Recorded disposition: **P01-01 ACCEPTANCE AUTHORITY = UNRESOLVED / NOT YET DESIGNATED; P01-02 ACCEPTANCE AUTHORITY = UNRESOLVED / NOT YET DESIGNATED.**
- Consequence: no P01-01/P01-02 completion or acceptance may be claimed at any execution gate until acceptance authority is separately designated in a later authority act, and no tracker status change to ACCEPTED may occur without such designation and acceptance.
- The executor expressly does not self-accept.

## 9. EXACT EXECUTION SCOPE (authorized only this — tracker-defined, nothing invented)

- **P01-01 — Canonical identifiers** (Requirement: define instrument/company/portfolio/research/event identifiers and cross-provider mapping semantics; Deliverable: Canonical ID specification) — within the exact tracker row §3.
- **P01-02 — Timestamp/as-of semantics** (Requirement: define event time, received time, publication time, effective time and as-of semantics; Deliverable: Time semantics specification) — within the exact tracker row §4.
- Each item is exercised only via its own separate governed execution gate under the holder's subsequent explicit execution instruction; this act alone starts neither.

## 10. EXACT EXCLUSIONS (NOT authorized)

This act does **NOT** authorize and does **NOT** begin: P01-03; P01-04; P01-05; P02; P03; P04; P05; P06-01 (or any P06/P07 item); INT-011; Watchlists work of any kind; persistence; SG-4; SG-5; D115 (unchanged); Dhan; NSE; OIDC / operator-drop activation; production access/activation of any kind; any certification act; any acceptance act for P01-01/P01-02; any tracker status mutation (including P01-01/P01-02 status); any modification of P01 source code or tests before their own execution gates; any modification of the P00-02 artifacts, the baseline matrix, or the certified corpus. Execution mode remains NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV for any future execution under this authority.

## 11. REQUIRED TRACKER-DEFINED EVIDENCE (per authorized item; verbatim from tracker)

| Item | Deliverable | Test / Validation | Evidence (required) |
| --- | --- | --- | --- |
| P01-01 | Canonical ID specification | Contract tests | ID contract + fixtures |
| P01-02 | Time semantics specification | Contract tests | Time contract |

No technical acceptance criteria beyond the tracker are invented by this act.

## 12. REQUIRED EXIT-CONDITION EVIDENCE (what each execution gate must prove)

| Item | Exit Criteria (verbatim) | Authority / Gate |
| --- | --- | --- |
| P01-01 | IDs versioned and testable | Phase gate |
| P01-02 | All domains mapped to time semantics | Phase gate |

The eventual execution gate for each item must prove the tracker-defined exit condition using authoritative evidence (deliverable + validation + evidence columns of that item's row), and is phase-gated at completion subject to §8 (acceptance authority to be designated separately).

## 13. PRESERVATION REQUIREMENTS (unchanged by this act; remain binding)

- P00-02 acceptance artifact (`2d3c971…`) — preserved, unmodified.
- P00-02 execution record (`c9f5260…`) — preserved, unmodified.
- P00-02 baseline/gap record including G1–G8 and U1–U2 routing — preserved (U1 remains a P00/P01 discovery input; its resolution is **not** completed by this act).
- Certified v1.0.0-rc1 corpus (archival `8a058f6e…`, P13–P17-CERT, BI-01..08, D114 Stage-5) — preserved, unmodified; any P01 execution under this authority must not modify the certified corpus and must respect reuse/partial-verification dispositions from the reconciliation record (VM/VG/PV rows, esp. INT-001/INT-003/INT-004).
- INT-001..INT-018 baseline matrix (`OPTIONAL-INTELLIGENCE-PROGRAM-MIGRATION-INVENTORY.md`) — preserved verbatim.
- P01 tracker rows — preserved, unmodified (statuses remain NOT STARTED).
- Watchlists governance records; SG-4 state (D, preserved); D115 records — preserved, unmodified.

## 14. DOWNSTREAM BOUNDARY (explicit)

- P01-01/P01-02 execution gates are the *next* governed actions; each requires the holder's explicit execution instruction for that item. **No other item in the dependency graph is opened by this act.**
- Nothing in this act reopens INT-011/G6 (separate Watchlists lane; SG-4 = D preserved) or any G1–G8 downstream gate; the gap-routing obligations stand as recorded.
- The act grants NO authority over: P01-03/P01-04/P01-05 (their dependencies remain unsatisfied: P01-03 needs "ID contract drafted" via P01-01; P01-04 needs "Time semantics defined" via P01-02; P01-05 needs both), or any W2+ phase.

## 15. EXPLICIT STATEMENTS

- **P01-01 and P01-02 remain NOT STARTED** until their separate execution gates are run (and accepted per §8 when acceptance authority exists).
- **This act does NOT itself execute P01** (neither P01-01 nor P01-02).
- **This act does NOT authorize P01-03 onward** (§10, §14).
- **This act makes NO acceptance claim and NO certification claim** concerning P01-01, P01-02, or any other item.
- **One authority artifact only** for the bounded P01 Wave-1 scope — no separate per-item authority artifacts were created in this gate.

## 16. DATE/TIME

2026-09-27 (local, Asia/Calcutta).

## 17. SINGLE-ARTIFACT ATTESTATION

This is the only artifact created by this designation act. No source, test, tracker, certification, P00-02, or Watchlists artifact was created, modified, renamed, deleted, or regenerated in this pass. One act; one scope designation; next governed step = a separately instructed P01-01 **or** P01-02 execution gate (one item per gate).

## 18. AUTHORITY STATUS LINE

**EXECUTION AUTHORITY = ESTABLISHED (bounded: P01-01 + P01-02, Wave-1 scope only; no ordering designated; executions gated separately). ACCEPTANCE AUTHORITY = UNRESOLVED / NOT YET DESIGNATED. ACCEPTANCE/SELF-ACCEPTANCE = EXPRESSLY EXCLUDED** (execution may occur only under the holder's explicit instruction per item; after any execution, acceptance requires a separate designated acceptance authority and act).

---

**Designation attestation:** Recorded from RAMKI's explicit designation instruction; tracker facts verbatim; no ordering invented; no acceptance authority manufactured; no downstream authority granted.
