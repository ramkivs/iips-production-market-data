# D32 — P13 Implementation Authorization Adjudication

**Explicit Program Authority decision act. Append-only.**
No implementation · no P13 acceptance · no certification · no activation ·
no source change · no amendment of any accepted artifact.

| Field | Value |
|---|---|
| **Record** | **D32** |
| **Act** | Program Authority implementation + work-item authorization adjudication for P13 |
| **Baseline** | `b332f7c1f01860b83199bba6de90cdc258dc1cb7` (P12 certification) |
| **Predecessors** | D29 P12 authorization · D31 P12 acceptance · P12 certification `b332f7c` · P13 entry assessment (ENTRY-READY WITH BOUNDED/DEFERRED CONDITIONS) |
| **Authority** | **Program Authority** (Sai / Ramki) |
| **Date** | 2026-09-12 |

---

# 0. DECISION

> # ✅ **F-1 — AUTHORIZED**
> # ✅ **F-2 — AUTHORIZED (UI01 through UI19)**
> # ⛔ **F-3 — A3 NOT DESIGNATED** (separate act required before P13 acceptance)

```
F-1 P13 IMPLEMENTATION       = AUTHORIZED
F-2 P13 WORK ITEMS           = AUTHORIZED (UI01 through UI19)
F-3 P13 A3 DESIGNATION       = NOT DESIGNATED
P13 ACCEPTANCE               = NOT ACCEPTED (no A3 designated)
P13 CERTIFICATION            = NONE (not required before P14 progression)
P14–P17                      = NOT AUTHORIZED
PRODUCTION ACTIVATION         = NOT AUTHORIZED
```

⚠ **Authorization is not acceptance, not certification, and not production activation.**
P13 may now be implemented within the authorized scope. Nothing further is granted.

---

# 1. F-1 — P13 Implementation Authorization

## 1.1 Prerequisites Re-Verified at Baseline `b332f7c`

| Prerequisite | Status | Evidence |
|---|---|---|
| **P12 — API/DTO Gate** | ✅ ACCEPTED + CERTIFIED (C6, C7) | Acceptance: `docs/PHASE_12_GATE_ACCEPTANCE.md` (A3 Sai). Certification: `docs/PHASE_12_CERTIFICATION_DECISION.md` (A2 Sai) |
| P05–P08 | ✅ ACCEPTED | Respective acceptance records |
| P09 | ✅ ACCEPTED + CERTIFIED (C3, C4, C8, C11 within D03) | `docs/PHASE_09_CERTIFICATION_DECISION.md` |
| P10 | ✅ ACCEPTED + CERTIFIED (C3, C8 within D06–D09) | `docs/PHASE_10_CERTIFICATION_DECISION.md` |
| P11 | ✅ ACCEPTED + CERTIFIED (C1, C2 within Engine Integration) | `docs/PHASE_11_CERTIFICATION_DECISION.md` |
| P01 gate integrity | ✅ UNCHANGED | SHA `cf23f0eda0ee917626d90270e883073c5d52d62c` |
| AD-9 gate (C6 before UI05) | ✅ SATISFIED | C6 CERTIFIED within P12 scope (commit `b332f7c`) |
| D4_12 stated blockers | ✅ ALL RESOLVED | P12 done, AD-9 satisfied, prohibition dissolved |
| P13 entry assessment | ✅ ENTRY-READY WITH BOUNDED/DEFERRED CONDITIONS | Read-only assessment |

## 1.2 D4_12 Blocker Re-Evaluation — Adopted

| D4_12 Stated Blocker | Current State | Resolved? |
|---|---|---|
| P12 | ✅ ACCEPTED + CERTIFIED | ✅ RESOLVED |
| AD-9 gates UI05 Screener | ✅ C6 CERTIFIED before UI05 | ✅ RESOLVED |
| "Prohibited to start" | ✅ Basis dissolved | ✅ DISSOLVED |

## 1.3 Decision

**P13 implementation is AUTHORIZED.**

Authorization is granted on the basis of:
1. P12 (sole dependency) is ACCEPTED and CERTIFIED.
2. All transitive dependencies (P01–P12) are ACCEPTED.
3. AD-9 gate (C6 before UI05) is SATISFIED.
4. All D4_12 stated blockers resolved.
5. No certification-before-progression requirement for P13.
6. No certification boundary has been implicitly broadened.
7. P01 gate integrity preserved.

---

# 2. F-2 — P13 Work-Item Authorization

## 2.1 Authorized Work Items

| UI | Surface | Disposition | Specification Source | Key P13 Delta |
|---|---|---|---|---|
| **UI01** | Dashboard | REUSE | `D4_10` L.2 | Replace literal provenance with derived; add quality/asOf badges |
| **UI02** | Company Workspace | REUSE cmp · ADAPT identity | `D4_10` L.2 | Re-keyed from sector to canonical security ID (OI-08); preserve P04 identity authority |
| **UI03** | Portfolio | REUSE | `D4_10` L.2 | Holdings priced from D01; per-holding quality |
| **UI04** | Research | ADAPT | `D4_10` L.2 | Attach data vintage to research artifacts |
| **UI05** | Screener | **NEW** | `D4_10` L.2 | Consume certified C6 screener contract; AD-9 satisfied |
| **UI06** | Decision Center | EXTEND | `D4_10` L.2 | Cell-level provenance + as-of |
| **UI07** | Watchlists | **NEW** | `D4_10` L.2 | New persistence + streaming/quality contract |
| **UI08** | Reports | EXTEND | `D4_10` L.2 | PIT reproducibility: pin dataVersion/asOf |
| **UI09** | Alerts | **NEW** | `D4_10` L.2 | Deterministic evaluation; no alerts on unavailable data |
| **UI10** | Collaboration | **NEW** | `D4_10` L.2 | Comments must pin the vintage they reference |
| **UI11** | Administration | EXTEND | `D4_10` L.2 | Real feed health replaces literals |
| **UI12** | Settings | ADAPT | `D4_10` L.2 | Data-source events and preferences added |
| **UI13** | Global Search | **NEW** | `D4_10` L.2 | Consume certified C7 resolution contract; single resolver |
| **UI14** | Command Palette | **NEW** | `D4_10` L.2 | Share UI13/C7 contract; no duplicate resolver |
| **UI15** | CrossSectorIntelligence | REUSE | `D4_10` L.2 | Mark snapshot-sourced inputs; OI-08 cardinality |
| **UI16** | EvidenceExplorer | EXTEND | `D4_10` L.2 | Show contributing snapshot IDs (Part 7) |
| **UI17** | ReplayExplorer | EXTEND | `D4_10` L.2 | ⚠ Show data vintage; MUST NOT assert verified reproduction (AD-17/M-2) |
| **UI18** | EngineRegistry | REUSE | `D4_10` L.2 | ⚠ Reflect AD-4 revalidation state; MUST NOT imply revalidation occurred |
| **UI19** | AiAdvisory | ADAPT | `D4_10` L.2 | Label output SYNTHESIZED; pin grounding vintage |

## 2.2 Cross-Surface Rules (U1–U10)

All 10 cross-surface rules from `D4_10` L.3 are AUTHORIZED and BINDING:

| Rule | Statement |
|---|---|
| **U1** | No fabricated provenance — surfaces must not display dataSource/freshness/confidence unless derived from real lineage |
| **U2** | Degradation is visible — stale, partial, unavailable must be visually distinct and never rendered as normal |
| **U3** | No silent mixing — LIVE and SNAPSHOT/PIT data must not be blended without explicit mode indicator |
| **U4** | Worst-case aggregation — aggregate inherits worst quality of contributors |
| **U5** | Class labelling — SYNTHESIZED content must be labelled as such |
| **U6** | Single resolver — UI13/UI14/UI02 use one object-resolution contract |
| **U7** | No client-side entitlement — visibility filtering is server-enforced |
| **U8** | As-of everywhere — every data-bearing surface displays effective as-of |
| **U9** | No component rebuild without cause — 13/19 need no new component |
| **U10** | No concealment — REUSE/INTEGRATE DATA never hides NEW or ADAPT work |

## 2.3 P13-Specific Bounded Conditions

| Surface | Bounded Condition |
|---|---|
| **UI05** | May consume certified C6. Must not claim certification beyond C6's P12 scope |
| **UI13** | May consume certified C7. Must use governed resolver. No second/raw-provider resolver |
| **UI14** | Must share UI13/C7 contract. No duplicate resolver implementation |
| **UI17** | Must display data vintage. MUST NOT assert verified reproduction. AD-17/M-2 UNRESOLVED |
| **UI18** | Must reflect AD-4 revalidation state. MUST NOT imply revalidation occurred. AD-4 DEFERRED |
| **UI19** | Must label output SYNTHESIZED. Must preserve grounding-vintage. No Existing-IIPS modification |
| **UI02** | Preserve P04 identity authority. Respect OI-08 cardinality. No new identity authority |

## 2.4 Decision

**All 19 P13 work items (UI01 through UI19) are AUTHORIZED** within their specification scope as stated in `D4_10_P13_UI_DELTA.md` Part L, subject to the cross-surface rules (U1–U10) and surface-specific bounded conditions above.

---

# 3. F-3 — P13 A3 Acceptor Designation

## 3.1 Status

**NOT DESIGNATED.**

## 3.2 Decision

P13 A3 designation is a SEPARATE authority act that must be performed before P13 acceptance can occur. This authorization does NOT designate an A3 acceptor and does NOT constitute P13 acceptance.

---

# 4. Bounded and Deferred Conditions

## 4.1 Carried Forward from Prior Phases (PRESERVED)

| Condition | Status | Resolution Gate |
|---|---|---|
| **AD-4 revalidation** | DEFERRED | P15 (E2E Certification) |
| **AD-17/M-2** | UNRESOLVED (external Existing-IIPS authority) | P15 |
| **M-6 retention stub** | OPEN (existing-IIPS) | Unknown |
| Replay reproducibility | NOT CLAIMED | P15 (external) |

## 4.2 P13-Specific Bounded Conditions

| Condition | Bounded Constraint |
|---|---|
| P12 C6 scope | CERTIFIED within P12 API/DTO Gate only — P13 consumes but does NOT broaden |
| P12 C7 scope | CERTIFIED within P12 API/DTO Gate only — P13 consumes but does NOT broaden |
| C12 (data-plane security) | BLOCKED — M-5, security authority UNKNOWN |
| C9/C10 | Outside P13 certification scope |
| K.2.6 security/tenant | Bounded (M-5 not wired) |
| UI17 AD-17 | MUST NOT assert verified reproduction |
| UI18 AD-4 | MUST NOT imply revalidation occurred |
| Stale P05/P08 assertions (13) | Non-blocking debt |

---

# 5. Certification Boundaries — PRESERVED

| Boundary | Status |
|---|---|
| **P12 C6 certification** | CERTIFIED within P12 API/DTO Gate scope ONLY — NOT broadened |
| **P12 C7 certification** | CERTIFIED within P12 API/DTO Gate scope ONLY — NOT broadened |
| **P11 C1/C2 certification** | CERTIFIED within Engine Integration scope ONLY — NOT broadened |
| **P09 certification** | C3, C4, C8, C11 within D03 scope ONLY — NOT broadened |
| **P10 certification** | C3, C8 within D06–D09 scope ONLY — NOT broadened |
| **P13 certification** | NOT REQUIRED before progression (gate model: "Cert before progression? = No") |
| **C12** | BLOCKED — NOT within P13 scope |
| **C9/C10** | NOT within P13 scope |

---

# 6. Authorized Scope

## 6.1 P13 Purpose

Integrate the governed P05–P12 data plane with 19 authorized frontend UI surfaces while preserving provenance, quality/degradation visibility, PIT/as-of semantics, canonical identity, resolver authority, and existing methodology boundaries.

## 6.2 Explicit Exclusions

This authorization does NOT:
- ⛔ Authorize P13 acceptance (requires A3 designation + explicit act)
- ⛔ Authorize P13 certification (not required; none granted)
- ⛔ Authorize production activation (remains NOT AUTHORIZED)
- ⛔ Authorize P14 or any downstream phase
- ⛔ Broaden P12 C6/C7 certification scope
- ⛔ Broaden P09/P10/P11 certification scope
- ⛔ Resolve AD-4 (deferred to P15)
- ⛔ Resolve AD-17/M-2 (external authority)
- ⛔ Claim replay reproducibility
- ⛔ Modify P01 canonical contracts
- ⛔ Modify P04 identity authority
- ⛔ Modify Existing-IIPS methodology, scoring, calibration, taxonomy, or engine behavior
- ⛔ Reimplement or duplicate the P04 resolver
- ⛔ Designate a P13 A3 acceptor
- ⛔ Remediate stale P05/P08 boundary assertions

---

# 7. Updated Authority-State Matrix

| Item | Pre-authorization | Post-authorization |
|---|---|---|
| P05–P10 | ✅ ACCEPTED | ✅ ACCEPTED (unchanged) |
| P09 certification | ✅ C3, C4, C8, C11 (D03 only) | ✅ UNCHANGED |
| P10 certification | ✅ C3, C8 (D06-D09 only) | ✅ UNCHANGED |
| P11 | ✅ ACCEPTED + CERTIFIED (C1, C2) | ✅ UNCHANGED |
| P12 | ✅ ACCEPTED + CERTIFIED (C6, C7) | ✅ UNCHANGED |
| **P13 implementation** | ⛔ NOT AUTHORIZED | ✅ **AUTHORIZED** (UI01 through UI19) |
| P13 acceptance | ⛔ NOT ACCEPTED | ⛔ NOT ACCEPTED (no A3 designated) |
| P13 certification | ⛔ NONE | ⛔ NONE (not required) |
| AD-4 revalidation | ⚠ DEFERRED to P15 | ⚠ DEFERRED to P15 (unchanged) |
| AD-17/M-2 | ⚠ UNRESOLVED (external) | ⚠ UNRESOLVED (unchanged) |
| C12 | ⛔ BLOCKED | ⛔ BLOCKED (unchanged) |
| Production activation | ⛔ NOT AUTHORIZED | ⛔ NOT AUTHORIZED |
| P14–P17 | ⛔ NOT AUTHORIZED | ⛔ NOT AUTHORIZED |
| P01 gate | `cf23f0eda0ee` | `cf23f0eda0ee` (UNCHANGED) |

---

# 8. Explicit Non-Decisions

This act does **NOT**: implement P13 · accept P13 · certify P13 · designate a P13 A3 acceptor · authorize P14 or downstream phases · authorize production activation · resolve AD-4, AD-17/M-2, or any deferred condition · broaden P09/P10/P11/P12 certification scope · amend any accepted artifact · remediate stale boundary assertions · modify P00–P12 artifacts · touch source, tests, or existing-IIPS.

---

# 9. Required Next Acts

| # | Act | Owner | Status |
|---|---|---|---|
| **F-1** | *This record — P13 implementation authorization* | Program Authority | ✅ **COMPLETE** |
| **F-2** | *This record — P13 work item authorization (UI01–UI19)* | Program Authority | ✅ **COMPLETE** |
| **F-3** | P13 A3 acceptor designation — separate act required before P13 acceptance | Program Authority | ⛔ **NOT DESIGNATED** |
| **P13 implementation** | Implement UI01–UI19 within authorized scope | — | AUTHORIZED to proceed |
| **P13 acceptance** | Formal gate acceptance by designated A3 | A3 (NOT YET DESIGNATED) | BLOCKED by F-3 |

---

**D32 — P13 IMPLEMENTATION AUTHORIZATION ADJUDICATION.**
**F-1 = AUTHORIZED · F-2 = AUTHORIZED (UI01 through UI19) · F-3 = NOT DESIGNATED.**
**P13 IMPLEMENTATION = AUTHORIZED · P13 ACCEPTANCE = NOT_ACCEPTED · P13 CERTIFICATION = NONE ·**
**PRODUCTION ACTIVATION = NOT_AUTHORIZED · P14–P17 = NOT_AUTHORIZED.**
