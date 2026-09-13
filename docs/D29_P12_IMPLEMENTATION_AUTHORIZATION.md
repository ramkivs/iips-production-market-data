# D29 — P12 Implementation Authorization Adjudication

**Explicit Program Authority decision act. Append-only.**
No implementation · no P12 acceptance · no certification · no activation ·
no source change · no amendment of any accepted artifact.

| Field | Value |
|---|---|
| **Record** | **D29** |
| **Act** | Program Authority implementation + work-item authorization adjudication for P12 |
| **Baseline** | `90a8836cfda291a70ed99f0e5c201a1db547368a` (P11 certification) |
| **Predecessors** | D26 P11 entry authorization · D27 P11 A3 designation · P11 acceptance `f093c74` · P11 certification `90a8836` · D28 P12 entry assessment |
| **Authority** | **Program Authority** (Sai / Ramki) |
| **Date** | 2026-09-12 |

---

# 0. DECISION

> # ✅ **F-1 — AUTHORIZED**
> # ✅ **F-2 — AUTHORIZED (P12-01 through P12-07)**
> # ⛔ **F-3 — A3 NOT DESIGNATED** (separate act required before P12 acceptance)

```
F-1 P12 IMPLEMENTATION       = AUTHORIZED
F-2 P12 WORK ITEMS           = AUTHORIZED (P12-01 through P12-07)
F-3 P12 A3 DESIGNATION       = NOT DESIGNATED
P12 ACCEPTANCE               = NOT ACCEPTED (no A3 designated)
P12 CERTIFICATION (C6, C7)   = NONE GRANTED
P13–P17                      = NOT AUTHORIZED
PRODUCTION ACTIVATION         = NOT AUTHORIZED
```

⚠ **Authorization is not acceptance, not certification, and not production activation.**
P12 may now be implemented within the authorized scope. Nothing further is granted.

---

# 1. F-1 — P12 Implementation Authorization

## 1.1 Prerequisites Re-Verified at Baseline `90a8836`

| Prerequisite | Status | Evidence |
|---|---|---|
| **P11 — Engine Integration** | ✅ COMPLETE + ACCEPTED + CERTIFIED | Implementation: `p11/src/*.js` (4 modules). Tests: 63/63 PASS. Acceptance: `docs/PHASE_11_GATE_ACCEPTANCE.md` (A3 Raji). Certification: `docs/PHASE_11_CERTIFICATION_DECISION.md` (A2 Sai, C1/C2 within Engine Integration scope) |
| P05 — Acquisition | ✅ ACCEPTED | `docs/p05/P05_GATE_ACCEPTANCE.md` |
| P06 — Normalization | ✅ ACCEPTED | `docs/p06/P06_GATE_ACCEPTANCE.md` |
| P07 — Data Quality | ✅ ACCEPTED (P07-01 through P07-04) | `docs/PHASE_07_P07_01_ACCEPTANCE.md` through `P07_04` |
| P08 — Historical/PIT | ✅ ACCEPTED | `docs/PHASE_08_GATE_ACCEPTANCE.md` |
| P09 — Intelligence | ✅ ACCEPTED + CERTIFIED (C3, C4, C8, C11 within D03) | `docs/PHASE_09_ACCEPTANCE.md`, `docs/PHASE_09_CERTIFICATION_DECISION.md` |
| P10 — Alt/Event Intelligence | ✅ ACCEPTED + PARTIAL CERTIFICATION (C3, C8 within D06-D09) | `docs/PHASE_10_GATE_ACCEPTANCE.md`, `docs/PHASE_10_CERTIFICATION_DECISION.md` |
| OI-10 (namespace token) | ✅ RESOLVED | `docs/CHECKPOINT-03.md` |
| OI-08 (identity cardinality) | ✅ RESOLVED | `docs/p04/P04_GATE_ACCEPTANCE.md` |
| P01 gate integrity | ✅ UNCHANGED | SHA `cf23f0eda0ee917626d90270e883073c5d52d62c` |
| D28 entry assessment | ✅ ENTRY-READY WITH BOUNDED/DEFERRED CONDITIONS | `docs/P12_ENTRY_ASSESSMENT.md` |

## 1.2 D28 Blocker Evaluations — Adopted

| Blocker | D28 Finding | Adopted? |
|---|---|---|
| AD-4 revalidation | Does NOT block P12 entry; deferred to P15 | ✅ Adopted |
| AD-17/M-2 | Does NOT block P12 entry; deferred to P15 (external authority) | ✅ Adopted |
| Stale P05/P08 assertions (8) | Non-blocking documentation debt | ✅ Adopted |
| P11 C1/C2 sufficiency | Sufficient for P12 dependency | ✅ Adopted |
| C6/C7 certification authority | A2 (Sai) exists for C1–C12 scope | ✅ Adopted |
| A1 security authority | Not required for P12 entry (C12 not a P12 requirement) | ✅ Adopted |
| D4_12 stated blockers | All resolved or not entry blockers | ✅ Adopted |

## 1.3 Decision

**P12 implementation is AUTHORIZED.**

Authorization is granted on the basis of:
1. All direct dependencies (P11) are ACCEPTED and CERTIFIED.
2. All transitive dependencies (P01–P11) are ACCEPTED.
3. OI-10 and OI-08 are RESOLVED.
4. AD-4 revalidation deferred to P15 with bounded condition.
5. AD-17/M-2 deferred to P15 with bounded condition (external authority).
6. D28 entry assessment confirms ENTRY-READY WITH BOUNDED/DEFERRED CONDITIONS.
7. No certification boundary has been implicitly broadened.
8. P01 gate integrity preserved.

---

# 2. F-2 — P12 Work-Item Authorization

## 2.1 Authorized Work Items

| Work Item | Scope | Specification Source |
|---|---|---|
| **P12-01** | **Data provenance DTO** — Extend `ExecutiveProvenance` with additive fields: `asOf`, `receivedAt`, `dataVersion`, `mode` (LIVE \| SNAPSHOT \| PIT), `quality` (good \| stale \| partial \| unavailable), `completenessPct` (0–100), `contributingSnapshotIds`, `identityMappingVersion`, `namespaceVersion`, `classification` (REAL \| CERTIFIED-ENGINE \| CERTIFIED-PRODUCT \| DERIVED \| SYNTHESIZED \| PRESENTATIONAL). Existing `dataSource`, `freshness`, `calibratedAt`, `transportSemantics` REUSED with derived semantics. Provider identity NEVER exposed (NFR-06). | `D4_09` K.2.1 |
| **P12-02** | **Product API / DTO integration** — Product transport + typed client integration. Every data-bearing DTO carries `quality`, `completenessPct`, `asOf`, `mode` at granularity where quality can vary. Prohibited: dropping quality on aggregation; presenting partial/stale as good; defaulting absent quality to good; aggregating mixed-quality without declaring worst-case (NFR-04). Additive — no breaking change to existing `apiVersion '1.0'` consumers. | `D4_09` K.2.2, K.3, K.4 |
| **P12-03** | **Screener contract (C6)** — Universe definition derived from D05 security master (explicit, versioned). Filter model deterministic with declared operators and stable ordering. Field set canonical namespaced market-data + mapped fundamentals. Per-row `quality`, `completenessPct`, `asOf`. Sorting deterministic and total (stable tie-break). Saved screens re-executable, PIT-capable, reproducible for an as-of. Degraded behaviour: stale/partial rows explicitly marked, never silently ranked as good. Tenant scoping enforced server-side. AD-9 gate: contract certified before UI05. | `D4_09` K.2.3 |
| **P12-04** | **Object-resolution / search contract (C7)** — Resolution input: canonical security ID, issuer ID, identifier, or symbol. Resolution output: governed product object references (company, research, holding, decision, evidence, alert, report). Identity source: P04 adapter only. Prohibited: raw-provider search surface (INT-015). Time-awareness: PIT resolution as of a stated boundary. Tenant scoping enforced server-side. Consumers: UI13 Global Search, UI14 Command Palette, UI02. | `D4_09` K.2.4 |
| **P12-05** | **Evidence / replay linkage exposure** — Evidence DTO extended with contributing `DataSnapshot` IDs, provider (governed-internal; exposure decision per NFR-06), `dataVersion`, `asOf`, `mode`. Replay DTO must disambiguate data vintage (Part 7). ⚠ **AD-17 constraint:** `ReplayService` returns `reproduced/byteIdentical` as literals (M-2). DTOs MUST NOT present these as verified reproduction. UNRESOLVED — existing-IIPS authority. | `D4_09` K.2.5 |
| **P12-06** | **Security / tenant boundaries** — Tenant scoping server-enforced on every data endpoint. `DataGovernanceRuntime` classification respected (AD-11). Provider entitlement enforced behind the data plane, never client-side. Secrets never in DTOs, logs, or client bundles (NFR-05). ⚠ **Bounded condition:** Authentication/session/enforcement not wired (M-5); security/identity authority UNKNOWN. C12 NOT within P12 certification scope. | `D4_09` K.2.6 |
| **P12-07** | **Endpoint delta (additive)** — New endpoints: screener (per K.2.3), object-resolution/search (per K.2.4), watchlist (UI07), alerts (UI09), report generation (UI08, PIT-reproducible), collaboration (UI10). Extended endpoints: market-data admin (`/api/admin/*`) for provider config, entitlement, feed health. Existing 20+ endpoints PRESERVED with additive provenance/quality fields, no breaking change. `apiVersion '1.0'` is the existing extension point. | `D4_09` K.3 |

## 2.2 Decision

**All seven P12 work items (P12-01 through P12-07) are AUTHORIZED.**

⚠ Each work item is authorized within its specification scope as stated above. Work items must preserve all bounded/deferred conditions (§4) and all certification boundaries (§5).

---

# 3. F-3 — P12 A3 Acceptor Designation

## 3.1 Status

**NOT DESIGNATED.**

## 3.2 Rationale

The Program Authority does NOT designate a P12 A3 acceptor at this time. Per the established non-inference rule:
- The P10 A3 acceptor is NOT automatically designated for P12.
- The P11 A3 acceptor (Raji) is NOT automatically designated for P12.
- No A3 acceptor is inferred from any prior designation.

## 3.3 Decision

**P12 A3 designation is a SEPARATE authority act** that must be performed before P12 acceptance can occur. This authorization does NOT designate an A3 acceptor and does NOT constitute P12 acceptance.

⚠ **P12 acceptance is BLOCKED until an A3 acceptor is explicitly designated.**

---

# 4. Bounded and Deferred Conditions

## 4.1 Carried Forward from Prior Phases (PRESERVED)

| Condition | Status | Resolution Gate |
|---|---|---|
| **AD-4 revalidation** | DEFERRED | P15 (E2E Certification) |
| **AD-17/M-2** | DEFERRED (external Existing-IIPS authority) | P15 (E2E Certification) |
| **M-6 retention stub** | OPEN (existing-IIPS) | Unknown |
| **OI-05** | OPEN | Non-blocking |

## 4.2 P12-Specific Bounded Conditions

| Condition | Bounded Constraint | Resolution Gate |
|---|---|---|
| **AD-4 in P12 scope** | P12 MUST NOT claim the 13-engine baseline is certified through the new ingress | P15 |
| **AD-17/M-2 in P12 DTOs** | DTOs MUST NOT present replay reproducibility as verified. AD-17 constraint MUST be carried explicitly in Evidence/Replay DTOs | P15 (external authority) |
| **C6 certification** | MUST be certified by A2 before P12→P13 progression (AD-9 gate) | P12 certification |
| **C7 certification** | MUST be certified by A2 before P12→P13 progression | P12 certification |
| **K.2.6 security/tenant** | Server-enforced tenant scoping implemented to extent possible without M-5. C12 NOT claimed. Security authority UNKNOWN acknowledged | P15 or security authority resolution |
| **C12 (data-plane security)** | NOT within P12 certification scope. BLOCKED — M-5, security authority UNKNOWN | External |
| **C9 (DataGovernanceRuntime.classify)** | NOT within P12 certification scope | Separate |
| **C10 (retention enforcement)** | BLOCKED — existing-IIPS M-6 | External |
| **Stale P05/P08 assertions (8)** | Non-blocking documentation debt — not reclassified as P12 blockers | Housekeeping |
| **Replay reproducibility** | NOT CLAIMED | P15 (external authority) |

---

# 5. Certification Boundaries — PRESERVED

| Boundary | Status |
|---|---|
| **P11 C1/C2 certification** | CERTIFIED within P11 Engine Integration scope ONLY — NOT broadened |
| **P09 certification** | C3, C4, C8, C11 within D03 scope ONLY — NOT broadened |
| **P10 certification** | C3, C8 within D06–D09 scope ONLY — NOT broadened |
| **P07 certification** | NONE GRANTED — C8 certified within P07 scope; C7 NOT established; withhold INTACT |
| **P08 certification** | NONE GRANTED — C7 NOT CERTIFIED |
| **C6 (screener contract)** | NOT CERTIFIED — target for P12 certification |
| **C7 (object-resolution contract)** | NOT CERTIFIED — target for P12 certification |
| **C12 (data-plane security)** | BLOCKED — NOT within P12 scope |
| **C9/C10** | NOT within P12 scope |

---

# 6. P12 Certification Targets

| Requirement | Definition | Consumer |
|---|---|---|
| **C6** | Screener contract — universe definition, filter model, field set, result rows, sorting, saved screens, degraded behaviour, tenant scoping | P12-03; AD-9 gate (certify before UI05) |
| **C7** | Object-resolution / search contract — resolution input/output, identity source (P04 adapter only), PIT resolution, tenant scoping | P12-04; UI13/UI14 consumers |

**Certification authority:** A2 (Sai) — designated for C1–C12 certification scope.

⚠ **C6 and C7 are NOT certified by this act.** They must be demonstrated during P12 implementation and certified by A2 before P12→P13 progression.

---

# 7. Authorized Scope

## 7.1 P12 Purpose

Expose governed market data through stable APIs/contracts while preserving the established governance, identity, PIT, namespace, engine, evidence, and certification boundaries.

## 7.2 Authorized Implementation

P12 implementation is authorized for:
- **Data provenance DTO** — additive extension of `ExecutiveProvenance` (P12-01)
- **Quality/freshness/completeness propagation** — every data-bearing DTO (P12-02)
- **Screener contract** — governed, deterministic, PIT-capable (P12-03, C6 target)
- **Object-resolution / search contract** — governed, P04-adapter-sourced (P12-04, C7 target)
- **Evidence / replay linkage DTOs** — with AD-17 constraint explicit (P12-05)
- **Security / tenant boundaries** — to extent possible without M-5 (P12-06)
- **Additive endpoint delta** — new and extended endpoints, no breaking change (P12-07)

## 7.3 Explicit Exclusions

This authorization does NOT:
- ⛔ Authorize P12 acceptance (requires A3 designation + explicit act)
- ⛔ Authorize P12 certification (requires A2 explicit act on C6, C7)
- ⛔ Authorize production activation (remains NOT AUTHORIZED)
- ⛔ Authorize P13 or any downstream phase
- ⛔ Grant C6 or C7 certification (must be demonstrated and certified by A2)
- ⛔ Resolve AD-4 revalidation (deferred to P15)
- ⛔ Resolve AD-17/M-2 (deferred to P15, external authority)
- ⛔ Modify P01 canonical contracts
- ⛔ Modify Existing-IIPS methodology, scoring, calibration, taxonomy, or certified engine behavior
- ⛔ Modify any of the 13 certified engines
- ⛔ Broaden P11 certification beyond Engine Integration scope
- ⛔ Broaden P09 certification beyond D03 scope
- ⛔ Broaden P10 certification beyond D06–D09 scope
- ⛔ Designate a P12 A3 acceptor
- ⛔ Claim replay reproducibility is verified
- ⛔ Claim the 13-engine baseline is certified through the new ingress
- ⛔ Remediate stale P05/P08 boundary assertions
- ⛔ Perform housekeeping commits

---

# 8. Updated Authority-State Matrix

| Item | Pre-authorization | Post-authorization |
|---|---|---|
| P05–P10 | ✅ ACCEPTED | ✅ ACCEPTED (unchanged) |
| P07 certification | ⛔ NONE GRANTED (withhold intact) | ⛔ NONE GRANTED (unchanged) |
| P08 certification | ⛔ NONE GRANTED | ⛔ NONE GRANTED (unchanged) |
| P09 certification | ✅ C3, C4, C8, C11 (D03 only) | ✅ C3, C4, C8, C11 (D03 only, NOT broadened) |
| P10 certification | ✅ C3, C8 (D06-D09 only) | ✅ C3, C8 (D06-D09 only, NOT broadened) |
| P11 | ✅ ACCEPTED + CERTIFIED (C1, C2) | ✅ ACCEPTED + CERTIFIED (C1, C2, NOT broadened) |
| **P12 implementation** | ⛔ NOT AUTHORIZED | ✅ **AUTHORIZED** (P12-01 through P12-07) |
| P12 acceptance | ⛔ NOT ACCEPTED | ⛔ NOT ACCEPTED (no A3 designated) |
| P12 certification | ⛔ NONE GRANTED | ⛔ NONE GRANTED |
| C6 (screener contract) | ⛔ NOT CERTIFIED | ⛔ NOT CERTIFIED (P12 target) |
| C7 (object-resolution contract) | ⛔ NOT CERTIFIED | ⛔ NOT CERTIFIED (P12 target) |
| AD-4 revalidation | ⚠ DEFERRED to P15 | ⚠ DEFERRED to P15 (unchanged) |
| AD-17/M-2 | ⚠ DEFERRED to P15 (external) | ⚠ DEFERRED to P15 (external, unchanged) |
| Production activation | ⛔ NOT AUTHORIZED | ⛔ NOT AUTHORIZED |
| P13–P17 | ⛔ NOT AUTHORIZED | ⛔ NOT AUTHORIZED |
| P01 gate | `cf23f0eda0ee` | `cf23f0eda0ee` (UNCHANGED) |

---

# 9. Authority Boundaries

This authorization:
- ✅ Authorizes P12 implementation (P12-01 through P12-07)
- ✅ Defers AD-4 revalidation to P15 with explicit bounded condition
- ✅ Defers AD-17/M-2 to P15 with explicit bounded condition (external authority)
- ✅ Preserves all certification boundaries (P07–P11)
- ✅ Preserves P01 gate integrity
- ✅ States C6/C7 as P12 certification targets
- ⛔ Does NOT constitute P12 acceptance
- ⛔ Does NOT grant C6 or C7 certification
- ⛔ Does NOT authorize P13 or any downstream phase
- ⛔ Does NOT authorize production activation
- ⛔ Does NOT designate a P12 A3 acceptor
- ⛔ Does NOT modify existing-IIPS source or methodology
- ⛔ Does NOT modify any P00–P11 accepted/certified artifact

---

# 10. Explicit Non-Decisions

This act does **NOT**: implement P12 · accept P12 · certify C6 or C7 · designate a P12 A3 acceptor · authorize P13 or downstream phases · authorize production activation · resolve AD-4, AD-17/M-2, M-6, or any deferred condition · amend the gate model, certification matrix, or any accepted artifact · remediate stale boundary assertions · perform housekeeping commits · modify P00–P11 artifacts · touch source, tests, or existing-IIPS.

---

# 11. Required Next Acts

| # | Act | Owner | Status |
|---|---|---|---|
| **F-1** | *This record — P12 implementation authorization* | Program Authority | ✅ **COMPLETE** |
| **F-2** | *This record — P12 work item authorization (P12-01 through P12-07)* | Program Authority | ✅ **COMPLETE** |
| **F-3** | P12 A3 acceptor designation — separate act required before P12 acceptance | Program Authority | ⛔ **NOT DESIGNATED** |
| **P12 implementation** | Implement P12-01 through P12-07 within authorized scope | — | AUTHORIZED to proceed |
| **P12 acceptance** | Formal gate acceptance by designated A3 | A3 (NOT YET DESIGNATED) | BLOCKED by F-3 |
| **P12 certification** | A2 evaluation of C6, C7 evidence | A2 (Sai) | After implementation |

---

**D29 — P12 IMPLEMENTATION AUTHORIZATION ADJUDICATION.**
**F-1 = AUTHORIZED · F-2 = AUTHORIZED (P12-01 through P12-07) · F-3 = NOT DESIGNATED.**
**P12 IMPLEMENTATION = AUTHORIZED · P12 ACCEPTANCE = NOT_ACCEPTED · P12 CERTIFICATION = NONE_GRANTED ·**
**PRODUCTION ACTIVATION = NOT_AUTHORIZED · P13–P17 = NOT_AUTHORIZED.**
