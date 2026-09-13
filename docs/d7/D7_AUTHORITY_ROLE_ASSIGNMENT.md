# D7 — AUTHORITY ROLE ASSIGNMENT SHEET

**Handoff preparation only. PREPARED — NOT TRANSMITTED.**
**No person or role is named, proposed, chosen or inferred in this document.**
All four roles remain **UNKNOWN**.

---

## A1 — Security / Identity Authority

| Field | Content |
|---|---|
| **Role** | Named authority for security, identity and tenancy decisions for this new production market-data program |
| **Required scope** | Secrets handling · service/tenant identity · tenancy enforcement model · canonical security identity decisions · provider entitlement boundary |
| **Why needed** | P03 cannot be completed or implemented without an owner for the security model. P04's canonical security master requires two identity decisions (OI-08, OI-09) that no one is currently empowered to make. Compounded by **M-5** (authentication/session not wired) — an existing-IIPS condition this program is prohibited from repairing |
| **Blocked phases** | **Directly:** P03 Secrets/Security · P04 Security Master · P05 Acquisition. **Transitively:** P06 → P17 |
| **Blocked work items** | **OI-08** identity cardinality 1 → N · **OI-09** external identifier standard · tenancy/security boundary (D4 Part K §K.2.6) |
| **Current assignment** | **UNKNOWN** |
| **Required assignment** | A named person or formally recognized authority role with effective authority over the scope above |

---

## A2 — New-Program Certification Authority

| Field | Content |
|---|---|
| **Role** | Named certification authority for this new program's data-plane and product-plane artifacts |
| **Required scope** | Ownership of certification requirements **C1–C12** (D4 Part M): ingress path · namespace/collision guard · snapshot lineage · replay identity extension · security master · screener contract · object-resolution contract · provenance derivation · governance classification · PIT reproducibility · data-plane security enforcement |
| **Why needed** | Nine of the twelve certification requirements currently have **no owner**. Certification cannot be requested, scoped or granted without one. Distinct from Ramki/Sai, who own certified *existing-IIPS* engine-layer contracts, not this program's new certifications |
| **Blocked phases** | Certification of P07 Data Quality · P09 Intelligence · P10 Alternative/Event Intelligence · P12 Certified APIs · **P15 E2E Certification** |
| **Blocked work items** | C1–C12 |
| **Current assignment** | **UNKNOWN** |
| **Required assignment** | A named certification authority for the new program |

---

## A3 — P00–P17 Gate Acceptors

| Field | Content |
|---|---|
| **Role** | Named acceptor(s) for the formal phase gates P00–P17 |
| **Required scope** | Authority to formally accept a phase gate — either a single acceptor for all phases or a per-phase assignment |
| **Why needed** | The tracker's *Phase Gates* sheet defines a gate, gate intent, minimum evidence and the promotion rule **"Explicit gate acceptance; no automatic promotion"** for every phase — but **names no acceptor for any phase**. The rule mandates that acceptance be explicit; it does not identify who gives it |
| **Blocked phases** | **Formal acceptance of all 18 phases (P00–P17)** — orthogonal to execution: a phase may be fully specified, implemented, evidenced and tested and still cannot pass a gate |
| **Blocked work items** | Every gate acceptance in the program |
| **Current assignment** | **UNKNOWN** |
| **Required assignment** | Named acceptor(s) for P00–P17 |

> ### **0 of 18 phases currently have a named gate acceptor.**

**Non-substitution:** Ramki/Sai ADR approval is **not** a gate acceptance. A1, A2 and A4 are
**not** substitutes for A3. Treating any of them as a gate acceptor would be an invention of
authority.

---

## A4 — P16 Production Activation Authority

| Field | Content |
|---|---|
| **Role** | Named authority empowered to authorize production activation |
| **Required scope** | Production activation decision for P16, and the operational authority carried into P17 |
| **Why needed** | Production activation cannot occur without an empowered decision-maker, independently of technical readiness or certification |
| **Blocked phases** | P16 Production Activation · P17 Operations |
| **Blocked work items** | Production connectivity, licensing activation, operational release |
| **Current assignment** | **UNKNOWN** |
| **Required assignment** | A named production-activation authority |

> ### ⚠ Gate name is not an authority assignment
>
> The SPEC and the tracker's *Phase Gates* sheet contain the entry
> **"P16 — Production activation authority gate"**.
>
> **This is the name of a gate, not an assignment of authority.** It describes *what the gate
> is about*; it does not identify *who holds* the activation authority. No authority may be
> inferred from it.

---

## Summary

| Role | Current assignment |
|---|---|
| A1 Security / Identity Authority | **UNKNOWN** |
| A2 New-Program Certification Authority | **UNKNOWN** |
| A3 P00–P17 Gate Acceptors | **UNKNOWN** (0 of 18) |
| A4 P16 Production Activation Authority | **UNKNOWN** |

**4 of 4 unresolved. No names. No roles. No proxy authority.**
