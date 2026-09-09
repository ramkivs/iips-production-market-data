# P04 — DEPENDENCY REGISTER

**Baseline HEAD:** `9a26ac70058a4410ed99905f0aa3d3a18e87ba17`

---

## 1. Upstream dependencies — satisfied

| Dependency | State | What P04 consumes | Evidence |
|---|---|---|---|
| **P00** Governance | **ACCEPTED** | Evidence conventions, gate model, open-items register | `docs/p00/` (7 artifacts) |
| **P01** Data Contract | **ACCEPTED** | Identity contract slots (§1.1); `identityMappingVersion` slot; field dictionary §7; ID-1…ID-6; timestamp/currency/unit rules | `docs/p01/` (10 artifacts) |
| **P02** Provider Abstraction | **ACCEPTED** | Provider identity PI-1…PI-8; adapter versioning AV-1…AV-6; six version axes; error taxonomy E1–E8 | `docs/p02/` (11 artifacts) |
| **P03** Secrets/Security | **ACCEPTED** | Gate chain G1–G7; tenant isolation IS-1…IS-4; audit requirements; `identityMappingVersion` pass-through (impact **NONE**) | `docs/p03/` (14 artifacts) |

TRACKER `Work Tracker`!P04-01 dependencies `P01,P02,P03` (Hard) — **all satisfied**.

---

## 2. Resolved content decisions

| Item | Prior | Now | Effect |
|---|---|---|---|
| **OI-08** identity cardinality | OPEN — `blocks:[P04,P11]` | ✅ **RESOLVED — 1:N by explicit program authority** | P04 entry blocker cleared; specified in CD-1…CD-7, MC-1…MC-7 |
| **OI-09** external identifier standard | OPEN — `blocks:[P04]` | ✅ **RESOLVED — FIGI/OpenFIGI authoritative** | P04 entry blocker cleared; specified in XI-1…XI-8 |

⚠ **Neither is represented as a blocker anywhere in this package.** Their **downstream
consequences** are carried forward separately (§3 DEP-P04-06, `P04_OPEN_ITEMS.md` OI-P04-02) —
recording a consequence is not reopening a decision.

---

## 3. Dependencies P04 records but does not resolve

| ID | Dependency | Owner | Blocks P04? | Note |
|---|---|---|---|---|
| **DEP-P04-01** | **OI-10** exact namespace token | Ramki/Sai (recording) | **NO** | `D8_STATUS` `OI-10.blocks:[P05,P06,P11]` — **P04 not listed**. `namespaceVersion` untouched (VA-3) |
| **DEP-P04-02** | **AD-17 / M-2** replay literal returns | **EXISTING-IIPS** | **NO** | UNRESOLVED; firewall preserved (AF-1…AF-5); constrains UI17 (P13) |
| **DEP-P04-03** | **M-1 / AD-4** E2E-030 revalidation | **EXISTING-IIPS** | **NO** | `blocks:[P15,P16,P17]`; not revoked, not renewed |
| **DEP-P04-04** | **M-5** authentication/session not wired | **EXISTING-IIPS** | **NO** | P03 limitation; **C12 BLOCKED** |
| **DEP-P04-05** | **M-6** retention stub | **EXISTING-IIPS** | **NO** | Audit retention; C10 (V-A5) |
| **DEP-P04-06** | **1:N downstream product-behaviour impact** | **P11 / P12 / P13** | **NO** | `/api/company/:id`, holdings cardinality, CSIP `holdings 10`/`holdings 13`, UI02, UI13 (`D4_05` §G.7, NR-8…NR-10) |
| **DEP-P04-07** | **Sector-taxonomy conflict resolution** | **Ramki/Sai methodology** | **NO** | Only if a mismatch arises (TX-3, TX-4) — **OI-P04-01** |
| **DEP-P04-08** | **Tenant/region governance attribute set** | **A1** (cleared, not named) | **NO** | `D4_05` §G.9 historically "UNKNOWN"; AD-11 mechanism unchanged — **OI-P04-03** |
| **DEP-P04-09** | **AD-9** screener contract certification | A2 (cleared) | **NO** | `blocks:[UI05]` — P12 |
| **DEP-P04-10** | **OpenFIGI source availability / licensing** | **P05** | **NO** | ⚠ FIGI is chosen as a **standard**; no provider selected, no licence implied. Entitlement matrix **EMPTY** (INV-10) — **OI-P04-04** |

---

## 4. Downstream consumers of P04

| Phase | Consumes | Evidence |
|---|---|---|
| **P05** Acquisition | `P05-01` dep `P02-01,P04-01`; `P05-02` dep `…,P04-02`; `P05-03` dep `P05-01,P04-02` | TRACKER *Dependency Matrix* |
| **P06** Normalization | `P06-01` dep `P01,P04,P05` | ibid. |
| **P07** Data Quality | Phase roadmap deps `P04–P06` | TRACKER *Phase Roadmap* |
| **P08** Historical/PIT | `P08-02` dep **`P04-03`**, entry *"Instrument lifecycle stable"* | TRACKER — ⚠ P08 depends on P04, **not** the reverse |
| **P09** Fundamentals | `P09-01` dep `P04,P06,P08` | ibid. |
| **P10** Alt/Event | `P10-01` dep `P02,P04,P06,P07` | ibid. |
| **P11** Engine Integration | Outstanding includes **OI-08** | `D8_STATUS.phase_readiness.P11` |
| **P13** UI Integration | `P13-05` Screener dep `P04,P11,P12`; INT-015 search identity | TRACKER |
| **All domains** | D05 consumers = *"All domains"* | `D4_02` §D.6 |

---

## 5. Existing-IIPS — depend on, never modify

| Artifact | Relationship |
|---|---|
| `NormalizedHolding` / `companyId` (`cross-sector/types.ts:7`) | **Read-only evidence.** Certified join key untouched |
| `OntologyMapper`, `RankingEngine`, `OpportunityEngine`, `CrossSectorEvidence` | **Unchanged** (CG-4) |
| Sector taxonomy · `EngineRegistry.ts:42-49` | **Map onto, never redefine** (TX-1/TX-2) |
| `ReplayService`, `DataBoundExecutor`, `LiveDataRuntime.ts`, `PROGRAM_v1.1_REPLAY_BASELINE.json` | **Untouched** (AF-5) |
| Auto Option-A · Materials G1–G6 · Telecom D16 | **Frozen, untouched** |
| E2E-030 certification artifacts | **Untouched** — not revoked, not renewed |

`D8_STATUS.existing_iips_boundary.may_depend_on_without_modifying: true`.

---

## 6. Not absorbed into P04

| # | Belongs elsewhere |
|---|---|
| 1 | Provider selection, credentials, acquisition — **P05** |
| 2 | Normalization pipeline — **P06** |
| 3 | Quality/freshness/reconciliation — **P07** |
| 4 | Corporate actions, PIT storage, adjusted series — **P08** |
| 5 | Engine integration and CSIP holdings-count consequences — **P11** |
| 6 | API and UI identity surfacing — **P12 / P13** |
| 7 | OI-10 token recording — Ramki/Sai |
| 8 | M-1, M-5, M-6, AD-17 — **existing-IIPS** |
| 9 | Certification (C1–C12) — **A2**; activation — **A4** |
