# D4 Part N — P00–P17 Phase Dependency Sequence

**SPECIFICATION ONLY.** **No dates are stated or invented** (user constraint). Sequence is
expressed as dependency order and readiness state only. **No phase gate is accepted here.**

---

## N.1 Readiness vocabulary

| State | Meaning |
|---|---|
| **SPEC-READY** | Can be specified/planned now; no unresolved blocker for specification work |
| **BLOCKED — AUTHORITY** | Cannot proceed until a named authority question is answered |
| **BLOCKED — DEPENDENCY** | Waits on an upstream phase deliverable |
| **BLOCKED — EXTERNAL** | Waits on something outside this program |
| **NOT STARTED — PROHIBITED** | User standing prohibition on starting work |

---

## N.2 Phase sequence

| Phase | Scope (tracker) | Depends on | Readiness | Blocker / note |
|---|---|---|---|---|
| **P00** | Governance | — | **SPEC-READY** | ⚠ User: **do not scaffold P00 yet**; gate acceptor **A3 UNKNOWN** |
| **P01** | Data Contract | P00 | **SPEC-READY** | ⚠ Standing prohibition: **implementation prohibited** |
| **P02** | Provider Abstraction | P01 | **SPEC-READY** | Depends on P01. Ingress abstraction specified (Part 6); D01–D10 baseline (Part 3) |
| **P03** | Secrets/Security | P01 | **BLOCKED — AUTHORITY** | **A1 security/identity authority UNKNOWN**; M-5 auth not wired |
| **P04** | Security Master | P02, P03 | **SPEC-READY (spec) · BLOCKED (impl)** | AD-1 adapter model authorized; blocked by **P03**, **OI-08**, **OI-09**. Prohibited to start |
| **P05** | Acquisition | P02, P04 | **BLOCKED — AUTHORITY** | Blocked by **OI-10** (namespace token unapproved) and **P04**; AD-16 ADR pending. Prohibited to start |
| **P06** | Normalization | P05 | **BLOCKED — AUTHORITY** | Blocked by **OI-10**; namespace + fail-closed collision guard (Part 5) must be approved first |
| **P07** | Data Quality | P05, P06 | **BLOCKED — DEPENDENCY** | Depends on P05/P06; quality/freshness/completeness certification owner **A2 UNKNOWN** |
| **P08** | Historical/PIT | P06, P07 | **BLOCKED — AUTHORITY** | Blocked by **ADR-AD3**; ⚠ **AD-17/M-2 unresolved** (existing-IIPS) |
| **P09** | Intelligence | P07, P08 | **SPEC-READY (spec) · BLOCKED (impl)** | Downstream of data quality and PIT as applicable; certification owner **A2 UNKNOWN** |
| **P10** | Alternative/Event Intelligence | P09 | **PARTIAL SPEC** | ⚠ **Thin coverage in the D4 package** — not elaborated; certification owner **A2 UNKNOWN** |
| **P11** | Engine Integration | P05, P06, P09 | **SPEC-READY (spec) · BLOCKED (impl)** | 13 engines, no engine change (Part 8). Blocked by **OI-10** and inherits **AD-4 revalidation**. ⚠ CSIP **OI-08** |
| **P12** | Certified APIs (**G2 retired**) | P11 | **SPEC-READY (spec) · BLOCKED (impl)** | Blocked by **P11**, **AD-9** screener contract gate, and **A1/A2** for tenancy/certification authority. AD-12 rename. Prohibited to start |
| **P13** | UI Integration (19 surfaces) | P12 | **SPEC-READY (spec) · BLOCKED (impl)** | Blocked by **P12**; **AD-9** gates UI05 Screener. Prohibited to start |
| **P14** | UX/Parity | P13 | **SPEC-READY (spec) · BLOCKED (impl)** | Blocked by **P13**. Non-regression oracle gate (Part 11 M.4) |
| **P15** | E2E Certification | P11, P13, P14 | **BLOCKED — AUTHORITY + EXTERNAL** | Blocked by **AD-4 / M-1** (revalidation required, **not** revocation) and **A2 new-program certification authority UNKNOWN**. ⚠ Standing prohibition: **do not start P15** |
| **P16** | Production Activation | P15, P03 | **BLOCKED — AUTHORITY** | Blocked by **P15** and **A4 P16 activation authority UNKNOWN** |
| **P17** | Operations | P16 | **BLOCKED — AUTHORITY** | Blocked by **P16** and **A4**; M-6 retention limitation remains (existing-IIPS) |

---

## N.3 Critical path

```
P01 → P02 → P03* → P04* → P05* → P06* → P07 → P08*
                                    ↘ P09 → P10 → P11* → P12* → P13* → P14 → P15* → P16* → P17*
```
`*` = currently blocked by an unresolved authority or external dependency.

**Longest blocked chain:** P03 Secrets/Security (A1 security/identity authority UNKNOWN) gates
P04 → P05 → P06 → P07 → P08 and, transitively, everything downstream through P11 Engine
Integration to P15 E2E Certification. **P03 is the single highest-leverage blocker.**

**Second blocker:** OI-10 (namespace token approval) gates P05 Acquisition and P06 Normalization
directly, and is a precondition for certifying the ingress (Part 11 S2) and therefore for P11.

**Third blocker:** AD-4 / M-1 gates P15 E2E Certification, which in turn gates P16 and P17.

---

## N.4 Parallelisable work (specification only)

| Track | Phases | Can proceed independently |
|---|---|---|
| Provider abstraction / data specification | P02 | Yes |
| Engine + CSIP integration spec | P11 | Yes — no code change required |
| Certified API / UI spec | P12, P13 | Yes — contract-level only |
| UX/parity and test strategy | P14 | Yes |
| Authority resolution | AD-3, AD-16/OI-10, AD-17, OI-08, OI-09, 4 authority roles | **Yes — and is the rate limiter** |

---

## N.5 Gate acceptance statement

**No P00–P17 gate can be formally accepted at this time**, because the gate-acceptor roles for
P00–P17 are **UNKNOWN** (G-A, 4 unknown authority roles). This document records readiness only.
It does **not** accept any gate and does **not** claim any gate is accepted.
