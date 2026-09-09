# E-01 — AUTHORITY ESCALATION: SECURITY / IDENTITY AUTHORITY (A1)

**Package type:** authority-escalation record. **No authority is named, chosen, assumed or
inferred in this document.**

| Field | Value |
|---|---|
| Escalation ID | E-01 |
| Register ID | **A1** |
| Type | **UNKNOWN AUTHORITY** (not a pending ADR; there is no one to send an ADR to) |
| Status | **OPEN — AUTHORITY UNKNOWN** |

---

## 1. The unresolved question

> **Who is the named authority for security/identity decisions for this new production
> market-data program?**

This is distinct from Ramki/Sai authority over certified existing-IIPS engine-layer
contracts. A1 concerns **new-program** security, identity and tenancy decisions, for which no
owner has been identified in the workspace, the SPEC, the tracker or the existing-IIPS
evidence repository.

**No candidate is proposed here.** Selecting a person or role would be an invention of
authority and is prohibited.

---

## 2. Why it is blocking

```
A1 (UNKNOWN)
 ↓
P03 Secrets/Security      — cannot be specified to completion or implemented
 ↓
P04 Security Master       — adapter model authorized (AD-1) but cannot proceed
 ↓
P05 Acquisition           — cannot proceed
```

| Phase | Effect |
|---|---|
| **P03 Secrets/Security** | Directly blocked. No authority to decide secrets handling, session/authentication wiring, or the tenancy enforcement model. Compounded by **M-5** (authentication/session not wired) — an existing-IIPS condition this program is prohibited from repairing |
| **P04 Security Master** | The AD-1 adapter model is authorized and D4 Part G specifies it fully (explicit, auditable, versioned, evidenced, no silent coercion, CSIP untouched). It still cannot proceed: it depends on P03 and on two identity decisions no one is empowered to make |
| **P05 Acquisition** | Depends on P04 for canonical identity, and independently on OI-10 (see ADR-01) |

Everything downstream of P05 inherits the block transitively. **A1 is the single
highest-leverage blocker in the program** (D4 Part N).

---

## 3. Dependent open decisions

A1 does not merely gate phases; it is the **owner of record** for three unresolved decisions
that currently have no decision-maker:

| ID | Decision | Detail |
|---|---|---|
| **OI-08** | **Identity cardinality 1 → N** | Today `companyId` is a sector label (`${sector}-H1`) and `/api/company/:id` is keyed by sector; CSIP receives one holding per sector, and existing tests assert `holdings 10` / `holdings 13`. Real market data implies many securities per sector. This is a **product-behaviour change**, not a technical detail, and D4 explicitly declines to resolve it |
| **OI-09** | **External identifier standard** | No standard has been selected (ISIN / CUSIP / SEDOL / FIGI / other). The canonical security master cannot be defined without one. D4 explicitly declines to select |
| **—** | **Tenancy / security boundary** | Server-enforced tenant scoping, provider entitlement enforcement behind the data plane, and the classification boundary interacting with AD-11 `DataGovernanceRuntime.classify()`. D4 Part K marks this **⚠ Blocked**, deliberately not over-specified beyond available authority |

---

## 4. What is NOT being asked

- This escalation does **not** request approval of the AD-1 adapter model — that is already
  authorized by G-A and specified in D4 Part G.
- It does **not** request repair of M-5 — that is an existing-IIPS defect this program is
  prohibited from touching.
- It does **not** propose an answer to OI-08 or OI-09.

---

## 5. Consequence of continued non-resolution

P03, P04 and P05 remain unstartable. Because P05 feeds P06/P07 → P08 → P09/P10 → P11 → P12 →
P13/P14 → P15, the entire implementation chain remains blocked regardless of how complete the
specification becomes. Specification work can continue in parallel; **implementation cannot**.

---

## 6. Status

# **OPEN — AUTHORITY UNKNOWN**

No name assigned. No role assigned. No proxy authority assumed.
