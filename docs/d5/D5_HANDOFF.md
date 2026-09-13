# D5 — HANDOFF PACKAGE

**Prepared, not transmitted.** Nothing has been sent or communicated externally. This is a
workspace artifact only.

---

## 1. What Ramki / Sai must decide

Two prepared ADRs, both **PENDING**, both concerning certified existing-IIPS surfaces.

### ADR-01 — Market-Data Field Namespace + Collision Guard
*(`docs/d5/ADR-01_NAMESPACE_COLLISION_GUARD.md`)*

| Sub-decision | Question |
|---|---|
| **A-1** | Which exact namespace token is adopted? D4 recommends `MD:<domain>.<field>` — **recommended, NOT approved** (OI-10) |
| **A-2** | Is fail-closed pre-merge collision detection (rules C1–C6) in `DataBoundExecutor` approved? |

Substance: `LiveDataRuntime.ts:76` merges `{...data.fields, ...companyInputs}` unguarded. 54
free-form camelCase keys across 6 engines include the price-derived valuation metrics
`peRatio`, `evEbitda`, `evRevenue`, `fcfYield` — which a market-data plane supplies and which
`companyInputs` silently overwrites. A live NFR-04 violation. Exactly one certified component
changes: `DataBoundExecutor`. No engine, methodology, scoring, calibration or taxonomy change.

### ADR-02 — Replay Identity Extension
*(`docs/d5/ADR-02_REPLAY_IDENTITY_EXTENSION.md`)*

Question: may `dataVersion` + `asOf` + provider participate in effective replay identity, with
explicit `data-*` ↔ `SNAP_*` linkage via an additive `contributingData[]` block?

**Critical boundary:** ADR-02 must be decided **separately from AD-17 / M-2**. AD-17 concerns
the existing `ReplayService` literal `reproduced` / `byteIdentical` returns and remains an
unresolved existing-IIPS issue. **The two must not be merged into one approval.**

---

## 2. What A1 authority must decide *(once named)*

*(`docs/d5/E-01_SECURITY_IDENTITY_AUTHORITY.md` — status **OPEN — AUTHORITY UNKNOWN**)*

1. The security, identity and tenancy model for P03 Secrets/Security.
2. **OI-08** — identity cardinality 1 → N. Today `companyId` is a sector label
   (`${sector}-H1`), CSIP receives one holding per sector, tests assert `holdings 10` /
   `holdings 13`. Real data implies many securities per sector. A product-behaviour change.
3. **OI-09** — the external identifier standard (ISIN / CUSIP / SEDOL / FIGI / other).
4. The tenancy / security boundary: server-enforced scoping, provider entitlement behind the
   data plane, interaction with AD-11 `DataGovernanceRuntime.classify()`.

**The first requirement is naming the role.** Until then there is no one to ask.

---

## 3. What A3 authority must decide *(once named)*

*(`docs/d5/E-02_GATE_ACCEPTOR_AUTHORITY.md` — status **OPEN — AUTHORITY UNKNOWN**)*

Who accepts the gates for P00–P17 — a single acceptor, or per-phase assignment.

**0 of 18 phases currently have a named acceptor.** Without them, no phase can be formally
accepted regardless of technical readiness. Ramki/Sai ADR approval is **not** a gate
acceptance and must not be treated as one.

---

## 4. What remains explicitly outside this program

| Item | Owner | Note |
|---|---|---|
| **M-1** evidence-chain defect + revalidation | Existing-IIPS (AD-10) | **AD-4 = REQUIRE REVALIDATION, not revocation.** E2E-030 is **not** revoked |
| **AD-17 / M-2** `ReplayService` literal returns | Existing-IIPS | Unresolved; separate from ADR-02 |
| **M-5** authentication / session not wired | Existing-IIPS | Compounds the A1 block |
| **M-6** retention stub | Existing-IIPS | Certification C10 blocked |
| Missing IES-016/017/020 readiness certificate **files** | Existing-IIPS | Documentation gap only — **AD-8 stands: these engines ARE certified** |
| `G:\IIPS\BACKUPS` | Existing-IIPS | Inaccessible historical evidence |
| Any modification to `iips-review-recovered` | Existing-IIPS | Prohibited to this program |

---

## 5. What cannot start before each decision

| Decision | Cannot start until resolved |
|---|---|
| **ADR-01 / OI-10** | P05 Acquisition · P06 Normalization · P11 Engine Integration · ingress certification C1 |
| **ADR-02** | P08 Historical/PIT · downstream PIT-dependent work |
| **A1 named + decided** | P03 Secrets/Security · P04 Security Master · P05 Acquisition — and transitively everything downstream |
| **A2 named** | Any certification (C1–C12) · P15 E2E Certification |
| **A3 named** | **Formal acceptance of any phase P00–P17** |
| **A4 named** | P16 Production Activation · P17 Operations |
| **AD-4 / M-1 resolved externally** | P15 E2E Certification · P16 · P17 |
| **AD-17 resolved (existing-IIPS)** | Truthful replay reporting in UI17 ReplayExplorer |
| **AD-9 screener contract certified** | UI05 Screener implementation |
| **Standing user prohibitions** | P00 scaffolding · P01 · P02 · P04 · P05 · P11 · P12 · P13 · P15 implementation |

---

## 6. Evidence required **after** approval *(not produced now)*

### If ADR-01 is approved
1. Collision census re-verified at implementation time (52 coded / 54 free-form; shared-key table).
2. **13-engine oracle / byte-identity evidence** — including Auto triple `44ba/ea22/c8ed`,
   Materials `5813…`, Telecom `3cfb/92be`.
3. **Fail-closed negative tests** — C1, C2, C3, C4 each abort, with the specified error content;
   no partial merge under any violation.
4. Determinism evidence for C6.

### If ADR-02 is approved
5. Byte-identical replay of all existing golden executions with `contributingData` empty.
6. Ambiguity-detection: executions differing only in `dataVersion`/`asOf` yield distinct
   effective replay identities.
7. Deterministic serialization of the lineage block.
8. Demonstration that `data-*` and `SNAP_*` formats are unchanged.

### Independently of both
9. Whatever the A2 certification authority specifies for C1–C12 — **currently unknown, and not
   assumed here.**

---

## 7. Package contents

| File | Purpose |
|---|---|
| `ADR-01_NAMESPACE_COLLISION_GUARD.md` | ADR preparation — PENDING RAMKI/SAI |
| `ADR-02_REPLAY_IDENTITY_EXTENSION.md` | ADR preparation — PENDING RAMKI/SAI |
| `E-01_SECURITY_IDENTITY_AUTHORITY.md` | Authority escalation — OPEN, UNKNOWN |
| `E-02_GATE_ACCEPTOR_AUTHORITY.md` | Authority escalation — OPEN, UNKNOWN |
| `D5_REGISTER.md` | Consolidated ADR/authority register |
| `D5_DEPENDENCY_MAP.md` | Implementation dependency map (grants no authority) |
| `D5_HANDOFF.md` | This handoff summary |

**No approval, no certification, no authority assignment, no phase acceptance, and no
production-readiness claim is made by any file in this package.**
