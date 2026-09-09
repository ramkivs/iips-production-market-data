# D8 — EXECUTION AUTHORIZATION

**Authority of record:** Sai/Ramki approval — *"consider this as decision approved by Sai/Ramki
to move forward"*.

**Program implementation state: `AUTHORITY_REVIEW_HOLD` → `AUTHORIZED_TO_PROCEED`.**

**This document grants no certification, accepts no gate, and authorizes no production
activation.** Execution proceeds strictly in dependency order, beginning at P00.

---

## 1. What is authorized

| # | Authorization | Scope |
|---|---|---|
| 1 | **ADR-01 authority hold CLEARED** | Namespace + fail-closed collision guard approved in principle; rules C1–C6 as written |
| 2 | **ADR-02 authority hold CLEARED** | Additive replay-identity extension approved; dual-layer identity and contributing-data linkage preserved |
| 3 | **A1–A4 program-authority clearance ESTABLISHED** | The program may proceed; roles are cleared, not person-assigned |
| 4 | **P00 Governance authorized to execute** | The single first executable work package (`D8_FIRST_WORK_PACKAGE.md`) |
| 5 | **P01–P14 authority-unblocked** | May proceed **in sequence** as their upstream deliverables complete |
| 6 | **Program implementation state = `AUTHORIZED_TO_PROCEED`** | The D7 `AUTHORITY_REVIEW_HOLD` is lifted, subject to the dependency sequence and remaining technical prerequisites |

### 1.1 Implementation sequence now unlocked

```
P00 ► P01 ► P02 ► P03 ► P04* ► P05* ► P06* ► P07 ► P08 ► P09 ► P10 ► P11* ► P12 ► P13 ► P14 ┈┈► P15 (BLOCKED) ┈┈► P16 ┈┈► P17
```
`►` = unlocked, executes when its upstream deliverable exists · `*` = technical prerequisite
outstanding (P04: OI-08/OI-09 · P05/P06/P11: exact token) · `┈┈►` = still blocked by M-1/AD-4.

**Executable right now: P00 only.** Every other phase has an unmet upstream deliverable.

### 1.2 Existing-IIPS boundary — protected

The new program **may depend on** existing-IIPS artifacts **without modifying them**. The
following remain existing-IIPS responsibilities and must not be implemented or altered here:
M-1 repair/revalidation · AD-17 resolution · existing-IIPS methodology changes · existing-IIPS
certification changes · existing-IIPS production runtime changes outside the approved
new-program boundary.

---

## 2. What is explicitly NOT authorized

| # | Not authorized | Reason |
|---|---|---|
| 1 | Adopting any specific namespace token string | **APPROVED-BUT-REQUIRES-EXACT-TOKEN RECORDING** — the source artifacts do not establish one; inventing one is prohibited |
| 2 | Any certification (C1–C12) | **NO CERTIFICATION GRANTED.** Authority cleared ≠ certification issued |
| 3 | Acceptance of any P00–P17 gate | A3 clearance makes acceptance *possible*; each gate still needs an explicit acceptance act with evidence |
| 4 | **P15 E2E Certification** | **STILL BLOCKED** — M-1 unrepaired, no revalidation, AD-4 stands |
| 5 | **P16 Production Activation / P17 Operations** | Downstream of P15 |
| 6 | Resolving AD-17 / M-2 | Unresolved existing-IIPS issue; not reached by ADR-02 approval |
| 7 | Repairing M-1, M-5, M-6 | Existing-IIPS ownership |
| 8 | Modifying `iips-review-recovered` | Prohibited to this program |
| 9 | Modifying the tracker XLSX or SPEC DOCX | AD-14 corrections remain **specified, not applied** |
| 10 | Deciding OI-08 or OI-09 | Owner cleared; substantive decisions still open — required before P04 completes |
| 11 | Skipping ahead in the sequence | Instruction 10: no silent reordering |
| 12 | Starting P01–P14 before their upstream deliverables exist | Sequence integrity |

---

## 3. Standing invariants (unchanged, carried forward)

| Invariant | State |
|---|---|
| Sole ingress boundary | `MarketDataSource<T>` → `DataSnapshot<T>` (AD-2) |
| Identity model | Adapter model (AD-1); certified CSIP boundary untouched |
| Certified engine scope | **13 engines** (AD-8) |
| UI surfaces in scope | **19** (AD-13) |
| G2 | **RETIRED** (AD-12) |
| Frozen methodologies | Auto Option-A · Materials G1–G6 · Telecom D16 — preserved verbatim |
| E2E-030 | **NOT revoked · NOT renewed · revalidation required** (AD-4) |
| Dual-layer replay identity | `data-*` and `SNAP_*` both preserved (AD-6) |
| Tracker corrections | Specified (D4 Part O), **not applied** |

---

## 4. Sequenced release of subsequent phases

Each phase becomes executable only when the row's precondition is met. **No phase in this
table is authorized to start now** except P00.

| Phase | Precondition to become executable |
|---|---|
| P01 Data Contract | P00 deliverables complete + P00 gate accepted |
| P02 Provider Abstraction | P01 complete |
| P03 Secrets/Security | P01 complete (⚠ M-5 remains an existing-IIPS limitation) |
| P04 Security Master | P02 + P03 complete **and OI-08 + OI-09 decided** |
| P05 Acquisition | P02 + P04 complete **and exact namespace token recorded** |
| P06 Normalization | P05 complete **and exact namespace token recorded** |
| P07 Data Quality | P05 + P06 complete |
| P08 Historical/PIT | P06 + P07 complete |
| P09 Intelligence | P07 + P08 complete |
| P10 Alt/Event Intelligence | P09 complete **and D4 coverage deepened** (currently thin) |
| P11 Engine Integration | P05/P06/P09 complete **and token recorded**; ⚠ OI-08; inherits AD-4 |
| P12 Certified APIs | P11 complete; AD-9 screener contract certified before UI05 |
| P13 UI Integration | P12 complete |
| P14 UX/Parity | P13 complete |
| **P15 E2E Certification** | **M-1 repaired + revalidation complete (existing-IIPS)** — BLOCKED |
| **P16 Production Activation** | P15 complete — BLOCKED |
| **P17 Operations** | P16 complete — BLOCKED |

---

## 5. Authorized first work package

> ## **P00 — GOVERNANCE**

Sole authorized execution. Full definition: `docs/d8/D8_FIRST_WORK_PACKAGE.md`.

**Not executed in D8.**

---

## 6. Authorization statement

Execution is authorized for **P00 Governance only**, under Sai/Ramki program-authority
clearance, subject to every prohibition in §2. No certification is granted, no gate is
accepted, no production activation is authorized, and AD-17 and M-1 remain unresolved.
