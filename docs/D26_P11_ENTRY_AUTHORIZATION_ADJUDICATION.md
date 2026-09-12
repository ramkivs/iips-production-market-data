# P11 Entry Authorization — Program Authority Adjudication

## Identity

| Field | Value |
|---|---|
| **Record type** | Program Authority entry + bounded-condition adjudication |
| **Phase** | P11 — Engine Integration |
| **Decision** | **AUTHORIZED** (with bounded conditions) |
| **Date** | 2026-09-12 |
| **Authority** | **Program Authority** (Sai / Ramki) |
| **Baseline** | `3c96d0f98f4d3af38075445871e875ba668bb233` (P10 certification) |

---

## Authority Act 1 — AD-4 Revalidation Disposition

### Question

Must AD-4 revalidation be completed before P11 implementation entry, or may it be deferred?

### Evidence

| Item | Status | Source |
|---|---|---|
| E2E-030 | NOT REVOKED · NOT RENEWED | `docs/PROGRAM_STATE.md` row 19 |
| AD-4 | Revalidation required, not revocation | `docs/PROGRAM_STATE.md` row 19 |
| M-1 | OPEN_REVALIDATION_REQUIRED | `docs/PROGRAM_STATE.md` row 18 |
| Owner | Existing-IIPS program (AD-10) | `docs/d4/D4_11_CERTIFICATION_MATRIX.md` M.2 |
| Sequencing S1 | "M-1 repair and AD-4 revalidation precede any claim about the certified 13-engine baseline" | `docs/d4/D4_11_CERTIFICATION_MATRIX.md` M.5 |
| P11 treatment | "inherits AD-4 revalidation" | `docs/d4/D4_12_PHASE_SEQUENCE.md` N.2 |
| M-1 blocks | P15, P16, P17 | `docs/PROGRAM_STATE.md` row 18 |

### Rationale

**AD-4 revalidation is NOT required before P11 implementation entry.**

The sequencing constraint S1 states: "M-1 repair and AD-4 revalidation precede **any claim about the certified 13-engine baseline**."

P11 implementation does **NOT** make any claim about the certified 13-engine baseline. P11 builds the market-data ingress path (`MarketDataSource` → `DataSnapshot` → `DataBoundRequest` → `DataBoundExecutor`) and the namespace/collision guard (`MD:<domain>.<field>`). P11 integrates with the 13 engines but does not certify them or claim they remain certified through the new ingress.

AD-4 revalidation is required before **P15 (E2E Certification)**, which is the gate that certifies the 13-engine baseline through the new ingress path. P11 implementation is a prerequisite for P15, not a certification act.

**Precedent:** P05, P06, P07, P08, P09, and P10 were all authorized and implemented with AD-4/M-1 OPEN. None of those phases claimed the 13-engine baseline was certified. P11 follows the same pattern.

### Decision

**AD-4 revalidation MAY BE DEFERRED to P15 (E2E Certification) with explicit bounded condition.**

**Bounded condition:** P11 implementation MUST NOT claim the 13-engine baseline is certified through the new ingress. AD-4 revalidation (including M-1 repair) MUST be completed before P15 can certify the 13-engine baseline.

**Timing/gate:** P15 (E2E Certification) — not before.

---

## Authority Act 2 — AD-17 / M-2 Disposition

### Question

Must AD-17/M-2 be resolved before P11 implementation entry, or may it be deferred? Does it require external authority?

### Evidence

| Item | Status | Source |
|---|---|---|
| AD-17 / M-2 | UNRESOLVED — not resolved by ADR-02 approval | `docs/PROGRAM_STATE.md` row 17 |
| ReplayService | Returns literals (M-2 defect) | `docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md` INT-003 |
| Owner | Existing-IIPS program | `docs/PROGRAM_STATE.md` row 17 |
| Blocks | UI17 replay reporting | `docs/PROGRAM_STATE.md` row 17 |
| Affects | P11 evidence/snapshot/replay | `docs/d4/D4_12_PHASE_SEQUENCE.md` N.2 |
| Program rule | "No existing-IIPS methodology or certification artifact is to be modified by this program" | `docs/PROGRAM_STATE.md` §26 |

### Rationale

**AD-17/M-2 requires external Existing-IIPS authority and CANNOT be adjudicated by this Program Authority.**

AD-17/M-2 is an existing-IIPS defect: `ReplayService` returns literals instead of replaying from stored snapshots. This is an existing-IIPS source-code defect that this program is explicitly prohibited from modifying (`docs/PROGRAM_STATE.md` §26: "No existing-IIPS methodology or certification artifact is to be modified by this program").

P11 can be implemented with the known limitation that `ReplayService` returns literals (M-2). P11's evidence/snapshot/replay mechanisms will ADAPT the existing `ReplayService` (per `docs/d4/D4_01_INTEGRATION_REUSE_BASELINE.md` INT-003: "ADAPT" treatment). The bounded condition is that AD-17 resolution is required before P15 (E2E Certification) can certify replay reproducibility.

**Precedent:** P08 (Historical/PIT) was accepted with AD-17/M-2 UNRESOLVED (`docs/PHASE_08_GATE_ACCEPTANCE.md`). P08 recorded AD-17/M-2 as a bounded, deferred condition. P11 follows the same pattern.

### Decision

**AD-17/M-2 requires external Existing-IIPS authority. This Program Authority CANNOT resolve it.**

**AD-17/M-2 MAY BE DEFERRED to P15 (E2E Certification) with explicit bounded condition.**

**Bounded condition:** P11 implementation MUST NOT claim replay reproducibility is certified. AD-17 resolution MUST be completed by the Existing-IIPS program before P15 can certify replay reproducibility.

**Responsible authority:** Existing-IIPS program (external to this program).

**Required resolution gate:** P15 (E2E Certification) — not before.

---

## Authority Act 3 — P11 Entry Authorization

### Question

Can P11 implementation now be explicitly AUTHORIZED?

### Prerequisites Verification

| Prerequisite | Status | Verified |
|---|---|---|
| P05 (Acquisition) | ✅ ACCEPTED | `docs/p05/P05_GATE_ACCEPTANCE.md` |
| P06 (Normalization) | ✅ ACCEPTED | `docs/p06/P06_GATE_ACCEPTANCE.md` |
| P07 (Data Quality) | ✅ ACCEPTED | `docs/PHASE_07_P07_01_ACCEPTANCE.md` through `P07_04` |
| P08 (Historical/PIT) | ✅ ACCEPTED | `docs/PHASE_08_GATE_ACCEPTANCE.md` |
| P09 (Intelligence) | ✅ ACCEPTED + CERTIFIED | `docs/PHASE_09_ACCEPTANCE.md`, `docs/PHASE_09_CERTIFICATION_DECISION.md` |
| P10 (Intelligence Data) | ✅ ACCEPTED + PARTIAL CERTIFICATION | `docs/PHASE_10_GATE_ACCEPTANCE.md`, `docs/PHASE_10_CERTIFICATION_DECISION.md` |
| OI-10 (namespace token) | ✅ RESOLVED | `docs/CHECKPOINT-03.md` §3 |
| OI-08 (identity cardinality) | ✅ RESOLVED | `docs/p04/P04_GATE_ACCEPTANCE.md` §3 |
| P01 gate integrity | ✅ UNCHANGED | SHA `cf23f0eda0ee917626d90270e883073c5d52d62c` |
| AD-4 revalidation | ⚠ DEFERRED to P15 | This adjudication, Act 1 |
| AD-17/M-2 | ⚠ DEFERRED to P15 (external authority) | This adjudication, Act 2 |

### P11 Purpose and Scope

**P11 — Engine Integration**

P11 integrates the 13 certified engines with the new market-data ingress path:

- **Market-data ingress path:** `MarketDataSource` → `DataSnapshot` → `DataBoundRequest` → `DataBoundExecutor`
- **Namespace + collision guard:** `MD:<domain>.<field>` with fail-closed rules C1–C6
- **Evidence/snapshot/replay mechanisms:** ADAPT treatment (per INT-003)
- **13 certified engines:** REUSE treatment (no engine changes)

### P11 Certification Requirements

P11 requires certification of:

- **C1** — Market-data ingress path (`MarketDataSource` → `DataSnapshot` → `DataBoundRequest` → `DataBoundExecutor`)
- **C2** — Namespace + collision guard (`MD:<domain>.<field>`, rules C1–C6)

**Critical distinction:** C1 and C2 are P11's own certification requirements. They are NOT prerequisites for authorizing P11 implementation. P11 implementation must demonstrate C1 and C2 before P11 acceptance/certification, but not before P11 entry.

### Decision

**P11 implementation is AUTHORIZED.**

Authorization is granted on the basis of:

1. All direct dependencies (P05, P06, P09) are ACCEPTED.
2. All transitive dependencies (P01–P10) are ACCEPTED.
3. OI-10 (namespace token) is RESOLVED.
4. OI-08 (identity cardinality) is RESOLVED.
5. AD-4 revalidation is explicitly deferred to P15 with bounded condition.
6. AD-17/M-2 is explicitly deferred to P15 with bounded condition (external authority).
7. P10 partial certification does NOT block P11.
8. No certification boundary has been implicitly broadened.
9. P01 gate integrity is preserved.

---

## P11 Implementation Authorization

### Authorized Scope

P11 implementation is authorized for:

- **Engine Integration only** — integrating the 13 certified engines with the new market-data ingress path
- **Market-data ingress path** — `MarketDataSource` → `DataSnapshot` → `DataBoundRequest` → `DataBoundExecutor`
- **Namespace + collision guard** — `MD:<domain>.<field>` with fail-closed rules C1–C6
- **Evidence/snapshot/replay adaptation** — ADAPT treatment per INT-003
- **No engine changes** — 13 engines are REUSED, not modified

### Explicit Exclusions

This authorization does NOT:

- ⛔ Authorize P11 acceptance (requires A3 explicit act)
- ⛔ Authorize P11 certification (requires A2 explicit act)
- ⛔ Authorize production activation (remains NOT AUTHORIZED)
- ⛔ Authorize P12 or any downstream phase
- ⛔ Grant C1 or C2 certification (must be demonstrated and certified before P11 acceptance)
- ⛔ Resolve AD-4 revalidation (deferred to P15)
- ⛔ Resolve AD-17/M-2 (deferred to P15, external authority)
- ⛔ Modify any existing-IIPS source, methodology, or certification artifact
- ⛔ Modify any of the 13 engines
- ⛔ Modify scoring, calibration, or taxonomy
- ⛔ Broaden P09 certification beyond D03 scope
- ⛔ Broaden P10 certification beyond C3/C8 within D06-D09 scope

### C1/C2 Certification Requirements

P11 implementation MUST demonstrate:

- **C1** — Market-data ingress path certification evidence
- **C2** — Namespace + collision guard certification evidence

C1 and C2 must be demonstrated and certified by A2 before P11 acceptance. P11 implementation produces the evidence; A2 certification evaluates it.

### Deferred Conditions

The following conditions remain OPEN and are NOT resolved by this authorization:

| Condition | Status | Resolution Gate |
|---|---|---|
| **AD-4 revalidation** | DEFERRED | P15 (E2E Certification) |
| **AD-17/M-2** | DEFERRED (external authority) | P15 (E2E Certification) |
| **OI-05** | OPEN | Non-blocking for P11 |
| **M-6** | OPEN | Non-blocking for P11 |
| **C9** | NOT CERTIFIED | Non-blocking for P11 |
| **C10** | NOT CERTIFIED | Non-blocking for P11 |
| **AG-1 / AG-2** | OPEN | Non-blocking for P11 |
| **Documentation debt** | OUTSTANDING | Non-blocking for P11 |
| **P09 boundary-test debt** | OUTSTANDING | Non-blocking for P11 |
| **PIT durable persistence** | OPEN | Non-blocking for P11 |

### A3 Designation Requirement

**A3 P11 acceptor must be designated before P11 acceptance.**

This authorization does NOT designate an A3 acceptor. A3 designation is a separate Program Authority act that must be performed before P11 acceptance can occur.

---

## Updated Authority-State Matrix

| Item | Pre-authorization | Post-authorization |
|---|---|---|
| P05–P10 | ✅ ACCEPTED | ✅ ACCEPTED (unchanged) |
| P09 certification | ✅ CERTIFIED (D03 only) | ✅ CERTIFIED (D03 only, NOT broadened) |
| P10 certification | ✅ PARTIAL (C3, C8 within D06-D09) | ✅ PARTIAL (unchanged) |
| **P11 implementation** | ⛔ NOT AUTHORIZED | ✅ **AUTHORIZED** (Engine Integration only) |
| P11 acceptance | ⛔ NOT ACCEPTED | ⛔ NOT ACCEPTED |
| P11 certification | ⛔ NONE GRANTED | ⛔ NONE GRANTED |
| C1 (ingress) | ⛔ NOT CERTIFIED | ⛔ NOT CERTIFIED (must be demonstrated) |
| C2 (namespace guard) | ⛔ NOT CERTIFIED | ⛔ NOT CERTIFIED (must be demonstrated) |
| AD-4 revalidation | ⚠ OPEN | ⚠ DEFERRED to P15 |
| AD-17/M-2 | ⚠ UNRESOLVED | ⚠ DEFERRED to P15 (external authority) |
| Production activation | ⛔ NOT AUTHORIZED | ⛔ NOT AUTHORIZED |
| P12–P17 | ⛔ NOT AUTHORIZED | ⛔ NOT AUTHORIZED |
| P01 gate | `cf23f0eda0ee` | `cf23f0eda0ee` (UNCHANGED) |

---

## Authority Boundaries

This authorization:

- ✅ Authorizes P11 implementation (Engine Integration only)
- ✅ Defers AD-4 revalidation to P15 with explicit bounded condition
- ✅ Defers AD-17/M-2 to P15 with explicit bounded condition (external authority)
- ✅ Preserves all certification boundaries
- ✅ Preserves P09 certification scope (D03 only)
- ✅ Preserves P10 certification scope (C3, C8 within D06-D09)
- ⛔ Does NOT constitute P11 acceptance
- ⛔ Does NOT grant C1 or C2 certification
- ⛔ Does NOT authorize P12 or any downstream phase
- ⛔ Does NOT authorize production activation
- ⛔ Does NOT modify existing-IIPS source or methodology

---

## Next Steps

To proceed with P11 implementation:

1. **P11 entry assessment** — Read-only dependency/authority assessment (this document)
2. **P11 implementation authorization** — This adjudication (AUTHORIZED)
3. **P11 implementation** — Implement Engine Integration within authorized scope
4. **A3 P11 acceptor designation** — Program Authority explicit act (required before acceptance)
5. **P11 acceptance** — A3 explicit act (requires C1/C2 evidence)
6. **P11 certification** — A2 explicit act (requires C1/C2 demonstration)

**P11 implementation may now proceed.**

---

**P11 IMPLEMENTATION = AUTHORIZED (Engine Integration only).**

**AD-4 revalidation = DEFERRED to P15.**

**AD-17/M-2 = DEFERRED to P15 (external authority).**

**Program Authority: Sai / Ramki.**

**Date: 2026-09-12.**

**Commit:** (to be recorded after commit)
