# D5 — CONSOLIDATED ADR / AUTHORITY REGISTER

**Preparation record only.** No item below is approved, resolved, assigned or certified.

---

## 1. Status-type vocabulary (distinctions preserved exactly)

| Type | Meaning | Who can move it |
|---|---|---|
| **PENDING RAMKI/SAI** | A prepared ADR awaiting a **named, known** existing-IIPS authority | Ramki / Sai |
| **UNKNOWN AUTHORITY** | No authority has been identified; there is **no one to ask** | Program leadership must first name the role |
| **UNRESOLVED EXISTING-IIPS ISSUE** | A defect or semantic question owned by the existing-IIPS program | Existing-IIPS authority |
| **EXTERNAL REPAIR / REVALIDATION** | Work outside this program's remit that must complete elsewhere | Existing-IIPS program |
| **DOCUMENTATION GAP** | Artifact cannot be located; not a technical defect | Existing-IIPS program |
| **OPEN DESIGN QUESTION** | A design decision with no empowered decision-maker yet | Depends on the gating authority |

These types are **not interchangeable**. An UNKNOWN AUTHORITY item cannot be progressed by
preparing a better document; a PENDING RAMKI/SAI item can.

---

## 2. Register

| Item | Type | Status | Required authority | Blocks |
|---|---|---|---|---|
| **ADR-01** Namespace + collision guard | PENDING RAMKI/SAI | **PENDING — NOT APPROVED** | **Ramki / Sai** (+ A2 for certification C2) | P05 Acquisition · P06 Normalization · P11 Engine Integration · certification C1 |
| **ADR-02** Replay identity extension | PENDING RAMKI/SAI | **PENDING — NOT APPROVED** | **Ramki / Sai** (+ A2 for certifications C3, C4) | P08 Historical/PIT · downstream PIT-dependent work |
| **A1** Security / identity authority | UNKNOWN AUTHORITY | **OPEN — UNKNOWN** | **UNKNOWN** | P03 · P04 · P05 · and transitively all downstream. Owns OI-08, OI-09, tenancy boundary |
| **A2** New-program certification authority | UNKNOWN AUTHORITY | **OPEN — UNKNOWN** | **UNKNOWN** | Certifications C1–C12 · P07 · P09 · P10 · P12 · P15 E2E Certification |
| **A3** P00–P17 gate acceptors | UNKNOWN AUTHORITY | **OPEN — UNKNOWN** | **UNKNOWN** | **Formal acceptance of every phase P00–P17 (0 of 18 have an acceptor)** |
| **A4** P16 production activation authority | UNKNOWN AUTHORITY | **OPEN — UNKNOWN** | **UNKNOWN** | P16 Production Activation · P17 Operations |
| **OI-08** Identity cardinality 1 → N | OPEN DESIGN QUESTION | **UNRESOLVED** | **A1 (UNKNOWN)** | P04 · UI02 Company Workspace · UI15 CrossSectorIntelligence · CSIP holdings-count assertions |
| **OI-09** External identifier standard | OPEN DESIGN QUESTION | **UNRESOLVED** | **A1 (UNKNOWN)** | P04 Security Master · canonical security master definition · D05 |
| **OI-10** Namespace token approval | OPEN DESIGN QUESTION *(carried by ADR-01)* | **PENDING — `MD:<domain>.<field>` recommended, NOT approved** | **Ramki / Sai** | P05 · P06 · P11 · ingress certification C1 |
| **AD-17** `ReplayService` literal-return semantics (M-2) | UNRESOLVED EXISTING-IIPS ISSUE | **UNRESOLVED** | **Existing-IIPS** | Truthful replay reporting in UI17 ReplayExplorer. **Explicitly NOT merged into ADR-02** |
| **M-1** Evidence-chain defect + AD-4 revalidation | EXTERNAL REPAIR / REVALIDATION | **OPEN — not repaired** | **Existing-IIPS (AD-10)** | **P15 E2E Certification** · any reliance on the certified 13-engine baseline. AD-4 = **REQUIRE REVALIDATION, not revocation** |
| **M-5** Authentication / session not wired | UNRESOLVED EXISTING-IIPS ISSUE | **OPEN — not repaired** | **Existing-IIPS** | Compounds A1 → P03 Secrets/Security · tenancy enforcement |
| **M-6** Retention stub (`isWithinRetention`) | UNRESOLVED EXISTING-IIPS ISSUE | **OPEN — not repaired** | **Existing-IIPS** | Retention enforcement (certification C10) · P17 Operations · UI11 Administration |
| *IES-016/017/020 readiness certificate files* | DOCUMENTATION GAP | **NOT LOCATABLE** | **Existing-IIPS** | Evidence completeness only. **AD-8 stands: these engines ARE certified** |
| *`G:\IIPS\BACKUPS`* | DOCUMENTATION GAP | **INACCESSIBLE** | **Existing-IIPS** | Historical evidence completeness |

---

## 3. Counts

| Type | Count |
|---|---|
| PENDING RAMKI/SAI | 2 (ADR-01, ADR-02) — *plus OI-10, carried by ADR-01* |
| UNKNOWN AUTHORITY | 4 (A1, A2, A3, A4) |
| UNRESOLVED EXISTING-IIPS | 3 (AD-17/M-2, M-5, M-6) |
| EXTERNAL REPAIR / REVALIDATION | 1 (M-1 / AD-4) |
| DOCUMENTATION GAP | 2 |
| OPEN DESIGN QUESTION | 3 (OI-08, OI-09, OI-10) |

**Actionable by a known authority today: 2 items (ADR-01, ADR-02).** Everything else first
requires a role to be named or belongs to another program.

---

## 4. Unchanged invariants (re-confirmed, not re-decided)

All 14 G-A decisions stand unmodified: AD-1 adapter model · AD-2 sole ingress · AD-3 · AD-4
**REQUIRE REVALIDATION** · AD-6 dual-layer · AD-8 13-engine certified scope · AD-9 screener
contract before UI05 · AD-10 · AD-11 · AD-12 G2 retired · AD-13 five additional surfaces ·
AD-14 tracker corrections authorized but **not applied** · AD-15 · AD-16 (token still
unapproved). All D4 dispositions preserved. 19 UI surfaces in scope. 13-engine target scope
intact.
