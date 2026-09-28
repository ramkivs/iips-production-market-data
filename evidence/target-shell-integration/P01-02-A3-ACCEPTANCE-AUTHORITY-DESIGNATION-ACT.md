# Institutional Investment Platform System (IIPS)
# P01-02 — A3 ACCEPTANCE AUTHORITY DESIGNATION ACT

**Act ID:** `p01-02-a3-acceptance-authority-designation-act-2026-09-28-001`
**Act Type:** AUTHORITY-DESIGNATION-ACT / A3 ACCEPTANCE-AUTHORITY DESIGNATION
(**designation only — NOT an implementation, NOT a test execution, NOT an acceptance, NOT an
acceptance re-exercise, NOT an A2 certification designation, NOT a certification-scope
determination, NOT a certification, NOT an integration, NOT a production authorization, NOT a
Dhan/NSE activation**)
**Governing Standards:** AD-01..AD-18 / AD-CHARTER-2026-01 / P00 phase-gate model
**Governing Gate:** `P01-02 A3 ACCEPTANCE-AUTHORITY DESIGNATION`
**Designating Authority:** **RAMKI — Program Authority**
**Recording Agent:** Arena (recording only)
**Recorded At (local, Asia/Calcutta):** 2026-09-28
**Repository / Branch:** `ramkivs/iips-production-market-data` /
`arena/01a0e6d9-iips-production-market-data`

---

## 0. ANTECEDENT AND PROGRAM AUTHORITY DECISION

This act designates the P01-02-specific A3 acceptance authority identified as missing by the gate
`P01-02 — TIMESTAMP / AS-OF SEMANTICS — SEPARATE GOVERNED EXECUTION GATE` (result **C. AUTHORITY
DESIGNATION REQUIRED**), following the establishment of P01-02 acceptance-criteria authority by
`P01-02-ACCEPTANCE-CRITERIA-AUTHORITY-ACT.md` @ `d712c31beac4568c45ab4823ef127225a9f80464`.

**The Program Authority decision recorded here, verbatim:**

> **I, RAMKI, acting as the established IIPS Program Authority, explicitly direct the following
> governed determination:**
>
> **A P01-02-specific A3 acceptance authority must be established before any P01-02 acceptance
> exercise is performed.**
>
> **The acceptor must be explicitly designated through an authoritative governance act.**

> **For this gate, the Program Authority designates: SAI as the A3 acceptance authority for P01-02
> only.**

The acceptor was **not** inferred from: the P01-01 A3 designation · authorship · repository
ownership · execution authority · acceptance-criteria authority · Program Authority itself ·
historical participation in another phase.

---

## 1. DESIGNATION

> ## Gate: `P01-02 A3 ACCEPTANCE-AUTHORITY DESIGNATION`
>
> ## Artifact: `P01-02 — Timestamp/as-of semantics`
>
> ## A3 acceptor: **`SAI`**
>
> ## Designating authority: `RAMKI — Program Authority`
>
> ## Scope: `P01-02 only`

| Field | Value |
|---|---|
| **A3 acceptor** | **SAI** |
| **Designated scope** | **`P01-02 — Timestamp/as-of semantics`** and nothing else |
| **Designating authority** | **RAMKI — Program Authority** |
| **Authority class** | **A3 — gate acceptance authority** (formal acceptance of the P01-02 work item) |
| **Effective from** | This act's commit |
| **Duration** | Until separately revoked or superseded by a subsequent explicit Program Authority act |

---

## 2. VALID DESIGNATION BASIS (Phase 2 determination)

| # | Question | Determination | Evidence |
|---|---|---|---|
| 1 | **What constitutes a valid A3 designation?** | A **named acceptor**, explicitly designated by an authoritative governance act, scoped to a gate. Per-item/per-phase assignment is expressly permitted. | `docs/d7/D7_AUTHORITY_ROLE_ASSIGNMENT.md` A3 — *"Authority to formally accept a phase gate — **either a single acceptor for all phases or a per-phase assignment**"*; `docs/p00/P00_GATE_MODEL.md` — *"Explicit gate acceptance; **no automatic promotion**"* |
| 2 | **Who is authorized to designate the P01-02 A3 acceptor?** | **Program Authority (RAMKI).** | `docs/p00/P00_AUTHORITY_REGISTER.md` §4 — *"**A3** Gate acceptance \| **PROGRAM-AUTHORITY CLEARANCE ESTABLISHED** \| **NO** \| Cleared for the **gate process**. **NO AUTOMATIC GATE ACCEPTANCE.**"*; established per-item A3 designation precedents: `D10-3` (P06-scoped), `P16-D3`, and the P01-01 A3 designation act @ `4dda3ed` |
| 3 | **Is a specific person already designated by an authoritative record for this exact scope?** | **NO.** Universe-wide search across the four IIPS repositories (`iips-production-market-data`, `iips-review-recovered`, `IIPS`, `Cockpit`) found **no P01-02 A3 acceptor, designation, or acceptance act**. | Verified: no P01-02 governance artifact exists on the session branch; no `A3 acceptor` / `A3 designation` record naming a person for P01-02 exists in `docs/` or `evidence/` anywhere |
| 4 | **Is a new P01-02-specific designation act required?** | **YES.** | `D7` A3 — *"0 of 18 phases currently have a named gate acceptor"*; *"**No individual names are recorded. None may be inferred**"* |

### 2.1 Conflict check — NONE FOUND

| Check | Result |
|---|---|
| SAI already assigned to a conflicting P01-02 scope | **NO** — no pre-existing P01-02 A3 assignment exists |
| Another authoritative A3 designation directly conflicting for P01-02 | **NO** — none exists in the four-repository universe |
| Records merely *referencing* P01-02 (not designating an A3) | `D14`, `D15`, `PHASE_07_*`, `P01_EVIDENCE.md`, `P00-02` acceptance act — all reference P01-02 as a **dependency** or in the evidence/entry-criterion mapping. **None designates a P01-02 A3 acceptor.** |

**No conflict was found; no selection between competing designations was required.**

---

## 3. REFERENCED AUTHORITIES (not modified, not extended by this act)

| Authority | Artifact | Ref | Relationship to this designation |
|---|---|---|---|
| **Execution authority** | `P01-WAVE1-EXECUTION-AUTHORITY-DESIGNATION-ACT.md` | `6b7552b642b92c0b783d4c190e409c4ce116e932` (blob `1bfa9eff…`) | **Bounded P01 Wave-1 execution scope = P01-01 + P01-02.** §9 names P01-02. **Referenced; not extended or reinterpreted.** |
| **Acceptance-criteria authority** | `P01-02-ACCEPTANCE-CRITERIA-AUTHORITY-ACT.md` | `d712c31beac4568c45ab4823ef127225a9f80464` | **Established for P01-02 only.** Supplies the six authorized criteria the acceptor may adjudicate against. |
| **Program Authority** | `NEXT-PRODUCT-SURFACE-AUTHORITY-DESIGNATION-PACKET.md`; `PHASE1C-INTELLIGENCE-PAYLOAD-AUTHORITY-DESIGNATION.md` + `.json` | on PMD `main` @ `4d3e1cdc` | *"Authority Holder: RAMKI"*; *"Governing Authority: RAMKI (Designating Authority)"*; `decisionAuthority = RAMKI (Designating Authority)`. **Designating authority for this act.** |
| **P00-02 baseline reconciliation** | `P00-02-BASELINE-RECONCILIATION-ACCEPTANCE-ACT.md` | `2d3c9718b80b6c92d9e333733604e83fc261ac2e` | Supports the P01-02 entry criterion *"Baseline reconciled"*. |

---

## 4. EXPLICIT SEPARATIONS

> ## A3 acceptance authority ≠ execution authority
>
> ## A3 acceptance authority ≠ acceptance-criteria authority
>
> ## A3 acceptance authority ≠ A2 certification authority
>
> ## A3 acceptance authority ≠ production authorization

| Separation | Statement |
|---|---|
| **Execution authority** | **REMAINS SEPARATE.** Vested in the P01-WAVE1 act (holder RAMKI; executor Arena (Recording Agent)). This act grants SAI **no** execution authority. Per `P01-WAVE1` §7, the executor *"does NOT become the acceptance authority by execution."* |
| **Acceptance-criteria authority** | **REMAINS SEPARATE.** Vested in the P01-02 criteria-authority act @ `d712c31` (Program Authority; tracker explicitly authorized for P01-02 only). This act grants SAI **no** authority to define or alter criteria. |
| **A2 certification authority** | **NOT ESTABLISHED BY THIS ACT.** No A2 authority is created, implied, or conferred. |
| **Certification scope** | **NOT DETERMINED BY THIS ACT.** Whether P01-02 is certification-bearing remains a separate subsequent governed gate. The P01-01 disposition *"ACCEPTANCE-GOVERNED ONLY / NOT CERTIFICATION-BEARING"* is **not** transferred to P01-02. |
| **Production authorization** | **NOT ESTABLISHED BY THIS ACT.** No production activation, Dhan activation, NSE activation, or licensed/provider execution is authorized. |
| **Integration authority** | **NOT ESTABLISHED BY THIS ACT.** No integration into PMD `main` is authorized. |

---

## 5. EXPLICIT NON-EXTENSION

This designation confers **no authority over**:

* **P01-01** — governed by its own separate A3 designation act @ `4dda3ed` (acceptor SAI, P01-01 only);
* **P01-03, P01-04, P01-05** — no designation exists; none is created here;
* **P02 or any later phase**;
* **certification**, A2 authority, or certification scope;
* **production authorization**;
* **integration authority**.

### 5.1 SAI's P01-01 designation remains a separate historical act

`P01-01-A3-ACCEPTANCE-AUTHORITY-DESIGNATION-ACT.md` @ `4dda3edd6f8f7d258118be2ce39bf5815386a02c`
(blob `5af8eee3e6065afeb25639be671a751257f8bf70`) remains **unmodified and unmerged**. It is a
distinct act with a distinct scope (P01-01). The two designations are **separate authority bases**
and are **not collapsed into one title** — SAI holds A3 acceptance authority for P01-01 under the
P01-01 act, and A3 acceptance authority for P01-02 under **this** act. Each rests on its own
explicit Program Authority designation.

---

## 6. WHAT THIS DESIGNATION DOES AND DOES NOT DO

**It does:** designate SAI as the A3 acceptance authority for **P01-02 only**, empowered to
formally accept or reject the P01-02 work item **against the criteria authorized by the P01-02
acceptance-criteria authority act**, in a separate governed acceptance gate.

**It does not:**
* accept P01-02 — **no acceptance is performed by this act**;
* pre-accept or pre-judge the outcome of any future P01-02 acceptance gate;
* implement, execute, or test P01-02;
* designate A2 certification authority;
* determine certification scope;
* certify P01-02;
* integrate P01-02 into PMD `main`;
* authorize production, Dhan, or NSE activation.

**Acceptance remains a separate governed act.** Designation ≠ acceptance.

---

## 7. SINGLE-ARTIFACT ATTESTATION

This is the **only artifact created by this act**. No source module, contract test, fixture,
P01-01 artifact, P01-02 criteria-authority artifact, P01-WAVE1 execution-authority act, D4/D7/D8
framework record, or unrelated governance record was created, modified, renamed, deleted, or
regenerated in this pass.

---

## 8. REPOSITORY INTEGRITY VERIFICATION

| Check | Result |
|---|---|
| PMD `main` | `4d3e1cdca3a33da0ec3be8b336b17128108a502c` — **UNCHANGED** ✓ |
| P01-02 criteria-authority act @ `d712c31` | **INTACT** ✓ |
| P01-WAVE1 execution authority @ `6b7552b` | blob `1bfa9eff…` — **INTACT** ✓ |
| P01-01 acceptance @ `9c9e606d` | **INTACT** ✓ |
| P01-01 criteria-authority @ `7eec2d1` | **INTACT** ✓ |
| P01-01 re-exercise @ `412b2638` | **INTACT** ✓ |
| **P01-01 A3 designation @ `4dda3edd`** | blob `5af8eee3…` — **INTACT, NOT MODIFIED, NOT MERGED** ✓ |
| P01-01 cert-scope determination @ `54ecee0` | **INTACT** ✓ |
| Source / tests / fixtures | **UNCHANGED** ✓ |
| Frozen trees | `9080e997` / `0062ad52` / `8491efdc` / `1597ed06` — **UNCHANGED** ✓ |
| Unauthorized diff count | **0** ✓ |

---

## 9. NEXT GOVERNED GATE

> ## `P01-02 CERTIFICATION-SCOPE DETERMINATION`

**Not performed in this execution.** P01-02 acceptance is likewise **not** performed here.

---

**Authority attestation:** Designated by **RAMKI**, Program Authority, under the explicit bounded
designation recorded in §0, after verifying that no P01-02 A3 acceptor was previously designated
anywhere in the four-repository IIPS universe and that no conflicting assignment exists. The
designation is bounded to **P01-02 only**, rests on its own explicit Program Authority act, and is
recorded separately from SAI's P01-01 designation, which remains a distinct unmodified historical
act. This act creates no execution authority, no acceptance-criteria authority, no A2
certification authority, no certification scope, no acceptance, no certification, no integration,
and no production authorization.
