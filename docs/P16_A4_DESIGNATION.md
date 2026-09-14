# P16 A4 Designation — Authority Decision Record

**Decision ID:** A4-D1  
**Date:** 2026-09-14  
**Authority:** Program Authority (Sai / Ramki)  
**Status:** READ-ONLY AUTHORITY DECISION

---

## 1. Decision

**A4-D1: DESIGNATE RAJI**

Program Authority has adjudicated that **Raji** is designated as the **A4 Production Activation Authority** for **P16 only**.

---

## 2. Designation Details

| Field | Value |
|-------|-------|
| **Designated Authority** | **Raji** |
| **Role** | **A4 Production Activation Authority** |
| **Scope** | **P16 only** |
| **Purpose** | Production activation control for P16 |
| **Status** | **DESIGNATED** |

---

## 3. Scope and Limitations

### 3.1 Authorized Scope

This designation authorizes Raji to:
- Exercise A4 production activation control for P16
- Make production activation decisions within P16 scope
- Record A4 activation control decisions for P16

### 3.2 Explicit Exclusions

This designation does **NOT** grant Raji authority for:
- **P16 A3 gate acceptance** — requires separate A3 designation by Program Authority
- **P16 A2 certification** — requires separate A2 designation by Program Authority
- **P16 implementation authorization** — requires separate Program Authority decision
- **P16 entry authorization** — requires separate Program Authority decision
- **Any other gate or production activity** — this designation is P16-specific only

---

## 4. Decision Basis

### 4.1 Authority Model

The P00 authority model (`docs/p00/P00_AUTHORITY_REGISTER.md` §4) defines four distinct authority dimensions:

| Dimension | State | Meaning |
|-----------|-------|---------|
| **A** Authority to proceed | GRANTED | Program may execute work |
| **B** Certification authority (A2) | CLEARED | Owner exists for C1-C12 |
| **C** Formal gate acceptance (A3) | CLEARED | A3 clearance makes acceptance possible |
| **D** **Production activation (A4)** | **SEPARATE DOWNSTREAM ACTIVATION CONTROL** | **Exercised at P16 only** |

The authority register explicitly states:
> **A4** Production activation: **SEPARATE DOWNSTREAM ACTIVATION CONTROL**, Person named: **NO**, Exercised at **P16 only**, which is downstream of the blocked P15. **Not authorized by D8.**

### 4.2 P16 Entry Requirements

The P00 gate model (`docs/p00/P00_GATE_MODEL.md`) defines P16 as:

| Field | Value |
|-------|-------|
| **Phase** | P16 |
| **Gate name** | Production activation authority gate |
| **Minimum evidence** | **A4 activation control**; P15 accepted |
| **Upstream deps** | P15 |
| **Cert. before progression?** | YES |

P16 requires "A4 activation control" as minimum evidence, which necessitates:
1. A4 designation (this decision)
2. A4 activation control exercise (future decision)

### 4.3 Program Authority Adjudication

Program Authority has adjudicated A4-D1 as follows:

**Decision:** DESIGNATE RAJI

**Rationale:**
- Raji has served as A3 gate acceptor for P11 and P15
- Raji has demonstrated understanding of authority boundaries
- A4 is a separate downstream activation control, distinct from A3
- P16-specific scope ensures no conflation with other authority roles

---

## 5. Precedent and Distinction

### 5.1 A3 Designation Precedent

Program Authority has previously designated A3 gate acceptors:
- D10-3: Ramki designated as A3 for P06
- D27: Raji designated as A3 for P11
- D30/D31: Sai designated as A3 for P12
- D33: Sai designated as A3 for P13
- D37: Sai designated as A3 for P14
- P15_SCOPE_DEFINITION: Raji designated as A3 for P15

### 5.2 A4 Distinction

A4 (production activation) is **distinct** from:
- **A1** (security/identity authority)
- **A2** (certification authority)
- **A3** (gate acceptance authority)

This designation does **not** extend or conflate any prior A1/A2/A3 designations.

---

## 6. Current State

| Item | Status |
|------|--------|
| **A4 designation** | ✅ **DESIGNATED (Raji)** |
| **A4 activation control** | ⛔ **NOT EXERCISED** |
| **P16 entry authorization** | ⛔ **NOT AUTHORIZED** |
| **P16 implementation authorization** | ⛔ **NOT AUTHORIZED** |
| **P16 A3 designation** | ⛔ **NOT DESIGNATED** |
| **P16 A2 designation** | ⛔ **NOT DESIGNATED** |
| **P16 acceptance** | ⛔ **NOT ACCEPTED** |
| **P16 certification** | ⛔ **NOT CERTIFIED** |
| **Production activation** | ⛔ **NOT PERFORMED** |

---

## 7. Next Required Authority Steps

Following this A4 designation, the next required authority decisions are:

1. **A4-D2: A4 Activation Control Exercise**
   - Authority: Designated A4 (Raji)
   - Action: Exercise A4 production activation control for P16
   - Record: `docs/P16_A4_ACTIVATION_CONTROL.md`

2. **P16-D1: P16 Entry Authorization**
   - Authority: Program Authority
   - Action: Authorize P16 entry based on satisfied prerequisites
   - Record: `docs/P16_ENTRY_AUTHORIZATION.md`

3. **P16-D2: P16 A3 Designation**
   - Authority: Program Authority
   - Action: Designate A3 gate acceptor for P16
   - Record: `docs/P16_A3_DESIGNATION.md`

4. **P16-D3: P16 A2 Designation**
   - Authority: Program Authority
   - Action: Designate A2 certification authority for P16
   - Record: `docs/P16_A2_DESIGNATION.md`

---

## 8. Authority Boundaries

### 8.1 What This Decision Does

- ✅ Designates Raji as A4 Production Activation Authority
- ✅ Limits scope to P16 only
- ✅ Enables future A4 activation control exercise
- ✅ Unblocks P16 authority chain (first step)

### 8.2 What This Decision Does NOT Do

- ⛔ Does NOT exercise A4 activation control
- ⛔ Does NOT authorize P16 entry
- ⛔ Does NOT authorize P16 implementation
- ⛔ Does NOT designate P16 A3 or A2
- ⛔ Does NOT accept P16
- ⛔ Does NOT certify P16
- ⛔ Does NOT activate production
- ⛔ Does NOT grant authority for any other gate

---

## 9. Explicit Statement

**A4-D1 is an authority designation only.** It does not exercise A4, authorize P16, or activate production. It is the first step in the P16 authority chain, enabling future A4 activation control exercise by the designated authority (Raji).

**Designation ≠ Activation.** This decision designates Raji as A4. A separate decision (A4-D2) is required for Raji to exercise A4 activation control.

**P16 remains BLOCKED** until A4 activation control is exercised (A4-D2) and P16 entry is authorized (P16-D1).

---

## 10. Record Integrity

This record:
- Does not modify any P0-P15 authority records
- Does not resolve P15 branch topology
- Does not merge branches
- Does not amend historical records
- Does not change any source code
- Is append-only to the authority record corpus

---

**A4-D1: DESIGNATE RAJI — RECORDED.**

**Raji is designated as A4 Production Activation Authority for P16 only.**

**Next step: A4-D2 (A4 activation control exercise by Raji).**
