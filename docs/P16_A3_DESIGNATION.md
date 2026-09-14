# P16 A3 Designation — Authority Decision Record

**Decision ID:** P16-D2
**Date:** 2026-09-14
**Authority:** Program Authority (Sai / Ramki)
**Status:** READ-ONLY AUTHORITY DECISION

---

## 1. Decision

**P16-D2: DESIGNATE RAJI**

Program Authority has adjudicated that **Raji** is designated as the **A3 gate acceptor** for
**P16 gate acceptance only**.

---

## 2. Designation Details

| Field | Value |
|-------|-------|
| **Designated Authority** | **Raji** |
| **Role** | **P16 A3 gate acceptor** |
| **Scope** | **P16 gate acceptance only** |
| **Purpose** | Gate acceptance evaluation and decision for P16 |
| **Status** | **DESIGNATED** |

---

## 3. Basis

| # | Basis |
|---|-------|
| 1 | **P16-D1 authorized P16 entry** — commit `56b8fbd85242be4418100863bc0a1e1978703221` |
| 2 | **Program Authority has designated Raji for P16 A3** |

`P16_ENTRY_AUTHORIZATION.md`:112-115 records that P16 A3 designation is a **separate authority
decision** and that *"P16-D1 does not infer, assume, or establish P16 A3 identity."* This record
(**P16-D2**) is that separate decision.

---

## 4. Scope and Limitations

### 4.1 Authorized Scope

This designation authorizes Raji to:
- Act as the A3 gate acceptor for P16
- Evaluate P16 for gate acceptance when P16 is otherwise ready for that act
- Record a P16 A3 gate acceptance decision within P16 scope

### 4.2 Explicit Exclusions

⛔ This designation does **NOT** grant, and must not be read as granting:

- **Raji is NOT designated P16 A2 by this decision.** P16 A2 certification authority requires a
  separate Program Authority designation.
- **Raji is NOT granted P16 implementation authorization.**
- **Raji is NOT granted P16 implementation authority.**
- **This record is NOT P16 acceptance.** Designation of an acceptor is not the acceptance act.
- **This record is NOT P16 certification.**
- **This record does NOT exercise A4.**
- **This record does NOT constitute production activation**, and performs no production activation
  beyond the separately completed **A4-D2**.
- **This designation applies to P16 only** and does not alter, extend or supersede any other gate
  designation.

---

## 5. Authority Chain

| # | Decision | Authority | Commit | Status |
|---|----------|-----------|--------|--------|
| 1 | **A4-D1** — Raji designated P16 A4 Production Activation Authority | Program Authority | `3e6167bacde309910fbc934fd7eabf0d1e971519` | ✅ COMPLETE |
| 2 | **A4-D2** — Raji exercised P16 A4 activation control | Raji (A4) | `728ea638c70aa9c97352948b9ca22288bc96da2e` | ✅ COMPLETE |
| 3 | **P16-D1** — Program Authority authorized P16 entry | Program Authority | `56b8fbd85242be4418100863bc0a1e1978703221` | ✅ COMPLETE |
| 4 | **P16-D2** — Raji designated P16 A3 gate acceptor | Program Authority | *this record* | ✅ COMPLETE |

### 5.1 Separation of roles

Raji holds **two distinct P16 roles** by **two distinct authority acts**: **A4** (production
activation, by A4-D1) and **A3** (gate acceptance, by this record, P16-D2). ⚠ Neither role implies
the other, and **neither implies A2**. The roles are not merged by common identity.

---

## 6. Not Performed by This Record

| Act | Status |
|-----|--------|
| P16 A2 designation (**P16-D3**) | ⛔ **NOT DONE** |
| P16 implementation authorization | ⛔ **NOT DONE** |
| P16 implementation | ⛔ **NOT DONE** |
| P16 A3 acceptance | ⛔ **NOT DONE** |
| P16 A2 certification | ⛔ **NOT DONE** |
| P16 closure | ⛔ **NOT DONE** |
| Additional production activation | ⛔ **NOT PERFORMED** |

---

## 7. Record Boundary

- This record **modifies no other artifact**. A4-D1, A4-D2 and P16-D1 remain unchanged.
- No P00–P15 record is modified.
- No branch was merged, rebased or rewritten.
- No implementation file is created or modified by this act.

---

**P16-D2 is recorded. Raji is the designated P16 A3 gate acceptor, for P16 gate acceptance only.**
**No acceptance, certification, implementation authorization or production activation is performed
by this record.**
