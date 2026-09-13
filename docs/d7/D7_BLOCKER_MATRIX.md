# D7 — BLOCKER / DEPENDENCY MATRIX

**Handoff preparation only. PREPARED — NOT TRANSMITTED.**
Nothing below is approved, assigned, resolved or certified.

> ## CRITICAL RULE — applies to every authority-resolution row below
>
> ### **Resolution removes the blocker; it does not by itself authorize implementation.**
>
> Implementation additionally requires: upstream phase deliverables complete, a certification
> owner (**A2 — UNKNOWN**), a gate acceptor (**A3 — UNKNOWN**), and the absence of a standing
> prohibition. **No phase is currently authorized to start.**

---

## Matrix

### A1 — Security / Identity Authority

| Field | Value |
|---|---|
| **Owner / required authority** | **UNKNOWN** — must first be named |
| **Directly blocked phases** | P03 Secrets/Security · P04 Security Master · P05 Acquisition |
| **Indirectly blocked phases** | P06 · P07 · P08 · P09 · P10 · P11 · P12 · P13 · P14 · P15 · P16 · P17 |
| **Resolution required** | Naming of a security/identity authority, then decisions on the security model, OI-08 and OI-09 |
| **Does resolution itself authorize implementation?** | **NO.** Resolution removes the blocker; it does not by itself authorize implementation. |
| **Current status** | **UNKNOWN** |

### A2 — New-Program Certification Authority

| Field | Value |
|---|---|
| **Owner / required authority** | **UNKNOWN** |
| **Directly blocked phases** | P15 E2E Certification |
| **Indirectly blocked phases** | Certification of P07 · P09 · P10 · P12; and P16 · P17 downstream of P15 |
| **Resolution required** | Naming of a new-program certification authority; ownership of C1–C12 |
| **Does resolution itself authorize implementation?** | **NO.** Resolution removes the blocker; it does not by itself authorize implementation. |
| **Current status** | **UNKNOWN** |

### A3 — P00–P17 Gate Acceptors

| Field | Value |
|---|---|
| **Owner / required authority** | **UNKNOWN** |
| **Directly blocked phases** | **Formal acceptance of all 18 phases P00–P17** |
| **Indirectly blocked phases** | None additional — the block is orthogonal to execution order |
| **Resolution required** | Named acceptor(s), single or per-phase |
| **Does resolution itself authorize implementation?** | **NO.** Resolution removes the blocker; it does not by itself authorize implementation. |
| **Current status** | **UNKNOWN — 0 of 18 named** |

### A4 — P16 Production Activation Authority

| Field | Value |
|---|---|
| **Owner / required authority** | **UNKNOWN** |
| **Directly blocked phases** | P16 Production Activation |
| **Indirectly blocked phases** | P17 Operations |
| **Resolution required** | Naming of a production-activation authority |
| **Does resolution itself authorize implementation?** | **NO.** Resolution removes the blocker; it does not by itself authorize implementation. |
| **Current status** | **UNKNOWN** |

### OI-08 — Identity cardinality 1 → N

| Field | Value |
|---|---|
| **Owner / required authority** | **A1 (UNKNOWN)** |
| **Directly blocked phases** | P04 Security Master |
| **Indirectly blocked phases** | P11 Engine Integration (CSIP holdings assertions) · P13 UI Integration (UI02, UI15) |
| **Resolution required** | Product-behaviour decision on one-holding-per-sector → many-securities-per-sector |
| **Does resolution itself authorize implementation?** | **NO.** Resolution removes the blocker; it does not by itself authorize implementation. |
| **Current status** | **UNRESOLVED** |

### OI-09 — External identifier standard

| Field | Value |
|---|---|
| **Owner / required authority** | **A1 (UNKNOWN)** |
| **Directly blocked phases** | P04 Security Master |
| **Indirectly blocked phases** | P05 Acquisition · D05 security-master domain · P13 (UI13/UI14 resolution) |
| **Resolution required** | Selection of an identifier standard (ISIN / CUSIP / SEDOL / FIGI / other) |
| **Does resolution itself authorize implementation?** | **NO.** Resolution removes the blocker; it does not by itself authorize implementation. |
| **Current status** | **UNRESOLVED** |

### OI-10 — Namespace token approval

| Field | Value |
|---|---|
| **Owner / required authority** | **Ramki / Sai** (carried by ADR-01-A1) |
| **Directly blocked phases** | P05 Acquisition · P06 Normalization |
| **Indirectly blocked phases** | P11 Engine Integration · certification C1 (ingress) via C2 |
| **Resolution required** | Approval of an exact token. `MD:<domain>.<field>` is **recommended, not approved** |
| **Does resolution itself authorize implementation?** | **NO.** Resolution removes the blocker; it does not by itself authorize implementation. |
| **Current status** | **PENDING — token NOT approved** |

### ADR-01 — Namespace + collision guard

| Field | Value |
|---|---|
| **Owner / required authority** | **Ramki / Sai** (+ A2 for certification C2) |
| **Directly blocked phases** | P05 Acquisition · P06 Normalization · P11 Engine Integration |
| **Indirectly blocked phases** | P07 · P08 · P12 · P13 · P14 · P15 |
| **Resolution required** | Decision on A-1 (token) and A-2 (guard) |
| **Does resolution itself authorize implementation?** | **NO.** Resolution removes the blocker; it does not by itself authorize implementation. **ADR approval ≠ certification.** |
| **Current status** | **PENDING RAMKI/SAI — NOT APPROVED** |

### ADR-02 — Replay identity extension

| Field | Value |
|---|---|
| **Owner / required authority** | **Ramki / Sai** (+ A2 for certifications C3, C4) |
| **Directly blocked phases** | P08 Historical/PIT |
| **Indirectly blocked phases** | Downstream PIT-dependent work: P09 · P10 · P11 · P13 (UI16, UI17) |
| **Resolution required** | Decision on the additive `contributingData[]` linkage and extended effective replay identity |
| **Does resolution itself authorize implementation?** | **NO.** Resolution removes the blocker; it does not by itself authorize implementation. **Approval does NOT resolve AD-17.** |
| **Current status** | **PENDING RAMKI/SAI — NOT APPROVED** |

### AD-17 / M-2 — `ReplayService` literal returns

| Field | Value |
|---|---|
| **Owner / required authority** | **Existing-IIPS authority** — outside this program |
| **Directly blocked phases** | None (not a phase blocker) |
| **Indirectly blocked phases** | Truthful replay reporting in UI17 ReplayExplorer (P13) |
| **Resolution required** | Existing-IIPS decision on the literal `reproduced` / `byteIdentical` returns |
| **Does resolution itself authorize implementation?** | **NO.** Resolution removes the blocker; it does not by itself authorize implementation. **Explicitly separate from ADR-02.** |
| **Current status** | **UNRESOLVED** |

### M-1 / AD-4 — Evidence chain + revalidation

| Field | Value |
|---|---|
| **Owner / required authority** | **Existing-IIPS program (AD-10)** |
| **Directly blocked phases** | P15 E2E Certification |
| **Indirectly blocked phases** | P16 Production Activation · P17 Operations; and any reliance on the certified 13-engine baseline |
| **Resolution required** | M-1 repair **and** revalidation. **AD-4 = REQUIRE REVALIDATION, NOT REVOCATION.** E2E-030 is **not revoked** and **not renewed** |
| **Does resolution itself authorize implementation?** | **NO.** Resolution removes the blocker; it does not by itself authorize implementation. |
| **Current status** | **OPEN — no revalidation performed or claimed** |

### M-5 — Authentication / session not wired

| Field | Value |
|---|---|
| **Owner / required authority** | **Existing-IIPS** — this program is prohibited from repairing it |
| **Directly blocked phases** | Compounds the A1 block on P03 Secrets/Security |
| **Indirectly blocked phases** | P12 (tenant boundary) · P13 (UI12 Settings) |
| **Resolution required** | Existing-IIPS repair |
| **Does resolution itself authorize implementation?** | **NO.** Resolution removes the blocker; it does not by itself authorize implementation. |
| **Current status** | **OPEN — not repaired** |

### M-6 — Retention stub

| Field | Value |
|---|---|
| **Owner / required authority** | **Existing-IIPS** — this program is prohibited from repairing it |
| **Directly blocked phases** | Certification C10 (retention enforcement) |
| **Indirectly blocked phases** | P17 Operations · P13 (UI11 Administration) |
| **Resolution required** | Existing-IIPS repair |
| **Does resolution itself authorize implementation?** | **NO.** Resolution removes the blocker; it does not by itself authorize implementation. |
| **Current status** | **OPEN — not repaired** |

---

## Totals

| Category | Count |
|---|---|
| Actionable by a **known** authority today | **2** (ADR-01, ADR-02 → Ramki/Sai) |
| Blocked on an **unnamed** role | **6** (A1, A2, A3, A4, OI-08, OI-09) |
| Owned by **existing-IIPS** | **4** (AD-17/M-2, M-1/AD-4, M-5, M-6) |
| Carried by an ADR | **1** (OI-10) |
| **Rows where resolution authorizes implementation** | **0** |
