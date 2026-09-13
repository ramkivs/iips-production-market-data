# D5 — IMPLEMENTATION DEPENDENCY MAP

> **This map describes dependency order only. It does NOT grant implementation authority,
> does not accept any gate, and does not authorize any phase to start.** A phase appearing
> "downstream and unblocked" in this diagram is still subject to its own authority
> prerequisites and to the standing prohibitions.

---

## 1. Core chain

```
                A1  (UNKNOWN — security/identity authority)
                 │
                 ▼
        P03  Secrets/Security
                 │
                 ▼
        P04  Security Master            ◄── OI-08 (cardinality 1→N, UNRESOLVED, owner A1)
                 │                      ◄── OI-09 (identifier standard, UNRESOLVED, owner A1)
                 ▼
        P05  Acquisition
                 │
                 ▼
        P06  Normalization  /  P07  Data Quality
                 │
                 ▼
        P08  Historical/PIT
                 │
                 ▼
        P09  Intelligence  /  P10  Alternative/Event Intelligence
                 │
                 ▼
        P11  Engine Integration   (13 certified engines)
                 │
                 ▼
        P12  Certified APIs
                 │
                 ▼
        P13  UI Integration  /  P14  UX/Parity
                 │
                 ▼
        P15  E2E Certification
                 │
                 ▼
        P16  Production Activation  /  P17  Operations
```

---

## 2. Overlays

```
ADR-01 (PENDING RAMKI/SAI)
   └─► OI-10  (namespace token, PENDING)
          └─► P05 Acquisition
          └─► P06 Normalization
          └─► P11 Engine Integration
          └─► certification C1 (ingress) — depends on C2

ADR-02 (PENDING RAMKI/SAI)
   └─► P08 Historical/PIT
          └─► certifications C3, C4

AD-17 / M-2  (UNRESOLVED)
   └─► existing-IIPS replay authority  — SEPARATE; not merged with ADR-02
          └─► truthful replay reporting, UI17 ReplayExplorer

AD-4 / M-1  (EXTERNAL revalidation required, NOT revocation)
   └─► P15 E2E Certification
          └─► P16, P17

A2  (UNKNOWN — new-program certification authority)
   └─► all certification requirements C1–C12
          └─► P07, P09, P10, P12, P15

A3  (UNKNOWN — gate acceptors)
   └─► FORMAL GATE ACCEPTANCE of every phase P00–P17
          (orthogonal to the chain: it gates acceptance, not execution)

A4  (UNKNOWN — production activation authority)
   └─► P16 Production Activation
          └─► P17 Operations

A1  (UNKNOWN — security/identity authority)
   └─► P03 → P04 → P05 → …  (the whole chain)
   └─► OI-08, OI-09, tenancy/security boundary
```

---

## 3. Upstream-most blockers, by reach

| Rank | Blocker | Type | Phases reached |
|---|---|---|---|
| 1 | **A1** | UNKNOWN AUTHORITY | P03 → P17 (**15 phases**) |
| 2 | **A3** | UNKNOWN AUTHORITY | Formal acceptance of **all 18** (orthogonal) |
| 3 | **OI-10 / ADR-01** | PENDING RAMKI/SAI | P05, P06, P11 → downstream (**13 phases**) |
| 4 | **A2** | UNKNOWN AUTHORITY | Certification of P07, P09, P10, P12, P15 |
| 5 | **AD-4 / M-1** | EXTERNAL | P15 → P16, P17 |
| 6 | **ADR-02** | PENDING RAMKI/SAI | P08 → downstream PIT-dependent work |
| 7 | **A4** | UNKNOWN AUTHORITY | P16, P17 |
| 8 | **AD-17** | UNRESOLVED EXISTING-IIPS | UI17 reporting truthfulness (not a phase blocker) |

---

## 4. Reading rule

Resolution of an upstream item **removes one blocker**; it does not confer permission to
start. Each phase additionally requires: its own upstream deliverables, its certification
owner (A2, UNKNOWN), a gate acceptor (A3, UNKNOWN), and the absence of a standing prohibition.

**No phase is currently authorized to start.**
